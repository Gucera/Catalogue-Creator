/**
 * Measures how large every image is actually drawn in a PDF.
 *
 * A minimal content-stream reader: it only follows the graphics state
 * (`q`, `Q`, `cm`) and image/form painting (`Do`), skips strings and inline
 * images, and recurses into form XObjects. The result says, per image
 * object, the largest size in points it appears at, which is what decides how
 * many pixels it really needs.
 */
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFRef,
  PDFStream,
  decodePDFRawStream,
} from 'pdf-lib';

export type Matrix = [number, number, number, number, number, number];
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

/** m × n in PDF's row-vector convention (`cm` pre-multiplies the CTM). */
export function multiply(m: Matrix, n: Matrix): Matrix {
  return [
    m[0] * n[0] + m[1] * n[2],
    m[0] * n[1] + m[1] * n[3],
    m[2] * n[0] + m[3] * n[2],
    m[2] * n[1] + m[3] * n[3],
    m[4] * n[0] + m[5] * n[2] + n[4],
    m[4] * n[1] + m[5] * n[3] + n[5],
  ];
}

export type DrawnImage = { ref: PDFRef; widthPt: number; heightPt: number; uses: number };

const WS = new Set([0x00, 0x09, 0x0a, 0x0c, 0x0d, 0x20]);
const DELIM = new Set([0x28, 0x29, 0x3c, 0x3e, 0x5b, 0x5d, 0x7b, 0x7d, 0x2f, 0x25]);

type Token = { t: 'num'; v: number } | { t: 'name'; v: string } | { t: 'op'; v: string };

/** Yields numbers, names and operators; everything else is skipped. */
export function* tokens(src: Uint8Array): Generator<Token> {
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (WS.has(c)) {
      i++;
    } else if (c === 0x25) {
      // % comment
      while (i < n && src[i] !== 0x0a && src[i] !== 0x0d) i++;
    } else if (c === 0x28) {
      // (string) with nesting and escapes
      let depth = 1;
      i++;
      while (i < n && depth > 0) {
        if (src[i] === 0x5c) i += 2;
        else {
          if (src[i] === 0x28) depth++;
          else if (src[i] === 0x29) depth--;
          i++;
        }
      }
    } else if (c === 0x3c && src[i + 1] !== 0x3c) {
      // <hex string>
      while (i < n && src[i] !== 0x3e) i++;
      i++;
    } else if (c === 0x2f) {
      let j = i + 1;
      while (j < n && !WS.has(src[j]) && !DELIM.has(src[j])) j++;
      yield { t: 'name', v: Buffer.from(src.subarray(i + 1, j)).toString('latin1') };
      i = j;
    } else if (DELIM.has(c)) {
      i++; // [ ] << >> { } – array and dict operands are not needed here
    } else {
      let j = i;
      while (j < n && !WS.has(src[j]) && !DELIM.has(src[j])) j++;
      const word = Buffer.from(src.subarray(i, j)).toString('latin1');
      i = j;
      const num = Number(word);
      if (word !== '' && !Number.isNaN(num)) {
        yield { t: 'num', v: num };
      } else if (word === 'ID') {
        // Inline image data: skip to the "EI" that follows whitespace.
        i++;
        while (i < n && !(WS.has(src[i - 1]) && src[i] === 0x45 && src[i + 1] === 0x49 && (i + 2 >= n || WS.has(src[i + 2])))) i++;
        i += 2;
      } else {
        yield { t: 'op', v: word };
      }
    }
  }
}

function streamBytes(stream: PDFStream): Uint8Array {
  if (stream instanceof PDFRawStream) return decodePDFRawStream(stream).decode();
  return stream.getContents();
}

export function measureImages(doc: PDFDocument): Map<string, DrawnImage> {
  const ctx = doc.context;
  const found = new Map<string, DrawnImage>();
  const visiting = new Set<string>();

  const walk = (bytes: Uint8Array, resources: PDFDict | undefined, base: Matrix) => {
    const stack: Matrix[] = [];
    let ctm = base;
    let operands: Token[] = [];
    const xobjects = resources?.lookupMaybe(PDFName.of('XObject'), PDFDict);
    for (const tok of tokens(bytes)) {
      if (tok.t !== 'op') {
        operands.push(tok);
        continue;
      }
      if (tok.v === 'q') stack.push(ctm);
      else if (tok.v === 'Q') ctm = stack.pop() ?? base;
      else if (tok.v === 'cm' && operands.length >= 6) {
        const m = operands.slice(-6).map((o) => (o.t === 'num' ? o.v : 0)) as Matrix;
        ctm = multiply(m, ctm);
      } else if (tok.v === 'Do' && xobjects) {
        const last = operands[operands.length - 1];
        if (last?.t === 'name') {
          const ref = xobjects.get(PDFName.of(last.v));
          const obj = ref instanceof PDFRef ? ctx.lookup(ref) : undefined;
          if (ref instanceof PDFRef && obj instanceof PDFStream) {
            const subtype = obj.dict.get(PDFName.of('Subtype'));
            const key = ref.toString();
            if (subtype === PDFName.of('Image')) {
              const w = Math.hypot(ctm[0], ctm[1]);
              const h = Math.hypot(ctm[2], ctm[3]);
              const prev = found.get(key);
              found.set(key, {
                ref,
                widthPt: Math.max(prev?.widthPt ?? 0, w),
                heightPt: Math.max(prev?.heightPt ?? 0, h),
                uses: (prev?.uses ?? 0) + 1,
              });
            } else if (subtype === PDFName.of('Form') && !visiting.has(key)) {
              visiting.add(key);
              const mArr = obj.dict.lookupMaybe(PDFName.of('Matrix'), PDFArray);
              const fm = mArr
                ? (mArr.asArray().map((x) => (x instanceof PDFNumber ? x.asNumber() : 0)) as Matrix)
                : IDENTITY;
              const formRes = obj.dict.lookupMaybe(PDFName.of('Resources'), PDFDict) ?? resources;
              walk(streamBytes(obj), formRes, multiply(fm, ctm));
              visiting.delete(key);
            }
          }
        }
      }
      operands = [];
    }
  };

  for (const page of doc.getPages()) {
    const contents = page.node.Contents();
    const parts =
      contents instanceof PDFArray
        ? contents.asArray().map((r) => ctx.lookup(r))
        : [contents];
    const chunks = parts.filter((p): p is PDFStream => p instanceof PDFStream).map(streamBytes);
    const joined = Buffer.concat(chunks.flatMap((c) => [Buffer.from(c), Buffer.from('\n')]));
    walk(joined, page.node.Resources(), IDENTITY);
  }
  return found;
}
