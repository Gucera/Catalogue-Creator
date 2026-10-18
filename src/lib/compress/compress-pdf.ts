/**
 * Shrinks a print PDF by resampling every photo to the pixels it actually
 * needs at its printed size. Text and vector art are left untouched.
 *
 *   load → measure drawn sizes → predict a quality level from a sample
 *        → re-encode images (pool) → keep only real wins → save
 */
import 'server-only';
import { availableParallelism } from 'node:os';
import { deflateSync, inflateSync } from 'node:zlib';
import sharp, { type Sharp } from 'sharp';
import { PDFArray, PDFDict, PDFDocument, PDFName, PDFNumber, PDFRawStream, PDFRef } from 'pdf-lib';
import { measureImages, type DrawnImage } from './content-walk';

export type Level = { ppi: number; quality: number };

/** Quality ladder, best first. */
export const LEVELS: Level[] = [
  { ppi: 200, quality: 82 },
  { ppi: 170, quality: 78 },
  { ppi: 150, quality: 74 },
  { ppi: 125, quality: 70 },
  { ppi: 100, quality: 66 },
];

/** A re-encode must save at least this much or the original stays. */
const KEEP_RATIO = 0.92;
/** Aim a little under the target so one full pass is normally enough. */
const PREDICT_HEADROOM = 0.93;
const SAMPLE_SIZE = 40;
const CONCURRENCY = Math.min(Math.max(availableParallelism(), 2), 8);

export type Phase = 'analysing' | 'images' | 'saving';
export type ProgressFn = (p: { phase: Phase; done: number; total: number; level: number; attempt: number }) => void;

export type CompressResult = {
  bytes: Uint8Array;
  level: Level;
  attempts: number;
  imagesTotal: number;
  imagesResampled: number;
  imagesSkipped: number;
  warnings: string[];
};

type Job = {
  ref: PDFRef;
  drawn: DrawnImage;
  width: number;
  height: number;
  channels: 1 | 3;
  origBytes: number;
  decode: () => Promise<Sharp>;
  smask: PDFRef | null;
};

function filters(dict: PDFDict): string[] {
  const f = dict.get(PDFName.of('Filter'));
  if (f instanceof PDFName) return [f.decodeText()];
  if (f instanceof PDFArray) return f.asArray().map((x) => (x instanceof PDFName ? x.decodeText() : '?'));
  return [];
}

function channelsOf(doc: PDFDocument, dict: PDFDict): 1 | 3 | null {
  const cs = dict.lookup(PDFName.of('ColorSpace'));
  if (cs === PDFName.of('DeviceRGB')) return 3;
  if (cs === PDFName.of('DeviceGray')) return 1;
  if (cs instanceof PDFArray && cs.lookup(0) === PDFName.of('ICCBased')) {
    const icc = doc.context.lookup(cs.get(1));
    const n = icc && 'dict' in icc ? (icc as PDFRawStream).dict.lookup(PDFName.of('N')) : undefined;
    const v = n instanceof PDFNumber ? n.asNumber() : 0;
    return v === 1 ? 1 : v === 3 ? 3 : null;
  }
  return null; // CMYK, Indexed, Lab …: left alone
}

/** Undo PNG row predictors (Predictor ≥ 10) on inflated image data. */
export function undoPngPredictor(data: Uint8Array, columns: number, bpp: number): Uint8Array {
  const row = columns * bpp;
  const rows = Math.floor(data.length / (row + 1));
  const out = new Uint8Array(rows * row);
  for (let y = 0; y < rows; y++) {
    const type = data[y * (row + 1)];
    const src = y * (row + 1) + 1;
    const dst = y * row;
    for (let x = 0; x < row; x++) {
      const raw = data[src + x];
      const a = x >= bpp ? out[dst + x - bpp] : 0;
      const b = y > 0 ? out[dst - row + x] : 0;
      const c = x >= bpp && y > 0 ? out[dst - row + x - bpp] : 0;
      let v = raw;
      if (type === 1) v = raw + a;
      else if (type === 2) v = raw + b;
      else if (type === 3) v = raw + ((a + b) >> 1);
      else if (type === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v = raw + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
      }
      out[dst + x] = v & 0xff;
    }
  }
  return out;
}

function decodeFlatePixels(stream: PDFRawStream, width: number, channels: number): Uint8Array {
  const inflated = inflateSync(stream.getContents());
  const parms = stream.dict.lookupMaybe(PDFName.of('DecodeParms'), PDFDict);
  const predictor = parms?.lookupMaybe(PDFName.of('Predictor'), PDFNumber)?.asNumber() ?? 1;
  return predictor >= 10 ? undoPngPredictor(inflated, width, channels) : inflated;
}

function collectJobs(doc: PDFDocument, drawn: Map<string, DrawnImage>, warnings: string[]) {
  const jobs: Job[] = [];
  let skipped = 0;
  for (const d of drawn.values()) {
    const stream = doc.context.lookup(d.ref);
    if (!(stream instanceof PDFRawStream)) {
      skipped++;
      continue;
    }
    const dict = stream.dict;
    const width = dict.lookupMaybe(PDFName.of('Width'), PDFNumber)?.asNumber() ?? 0;
    const height = dict.lookupMaybe(PDFName.of('Height'), PDFNumber)?.asNumber() ?? 0;
    const bpc = dict.lookupMaybe(PDFName.of('BitsPerComponent'), PDFNumber)?.asNumber() ?? 8;
    const channels = channelsOf(doc, dict);
    const f = filters(dict);
    const special = dict.has(PDFName.of('Decode')) || dict.has(PDFName.of('ImageMask'));
    if (!channels || special || !width || !height) {
      skipped++;
      continue;
    }
    let decode: Job['decode'] | null = null;
    if (f.length === 1 && f[0] === 'DCTDecode') {
      decode = async () => sharp(stream.getContents());
    } else if (f.length === 2 && f[0] === 'FlateDecode' && f[1] === 'DCTDecode') {
      decode = async () => sharp(inflateSync(stream.getContents()));
    } else if (f.length === 1 && f[0] === 'FlateDecode' && bpc === 8) {
      decode = async () =>
        sharp(Buffer.from(decodeFlatePixels(stream, width, channels)), { raw: { width, height, channels } });
    }
    if (!decode) {
      skipped++;
      continue;
    }
    const smask = dict.get(PDFName.of('SMask'));
    jobs.push({
      ref: d.ref,
      drawn: d,
      width,
      height,
      channels,
      origBytes: stream.getContents().length,
      decode,
      smask: smask instanceof PDFRef ? smask : null,
    });
  }
  if (skipped > 0) warnings.push(`${skipped} image(s) use an encoding this demo leaves alone (kept as-is).`);
  return { jobs, skipped };
}

/** Pixel size an image needs at its largest printed size; never upscales. */
export function targetSize(job: Pick<Job, 'width' | 'height' | 'drawn'>, ppi: number) {
  const needW = Math.ceil((job.drawn.widthPt / 72) * ppi);
  const needH = Math.ceil((job.drawn.heightPt / 72) * ppi);
  const scale = Math.min(1, Math.max(needW / job.width, needH / job.height));
  return { w: Math.max(1, Math.round(job.width * scale)), h: Math.max(1, Math.round(job.height * scale)) };
}

type Encoded = { jpeg: Buffer; w: number; h: number; mask: Buffer | null };

async function encode(doc: PDFDocument, job: Job, level: Level): Promise<Encoded | null> {
  const { w, h } = targetSize(job, level.ppi);
  let img = (await job.decode()).resize(w, h, { fit: 'fill', kernel: 'mitchell' });
  if (job.channels === 1) img = img.toColourspace('b-w');
  const jpeg = await img.jpeg({ quality: level.quality, chromaSubsampling: '4:2:0' }).toBuffer();
  if (jpeg.length >= job.origBytes * KEEP_RATIO) return null;
  let mask: Buffer | null = null;
  if (job.smask) {
    const ms = doc.context.lookup(job.smask);
    if (!(ms instanceof PDFRawStream)) return null;
    const mw = ms.dict.lookupMaybe(PDFName.of('Width'), PDFNumber)?.asNumber() ?? 0;
    const mh = ms.dict.lookupMaybe(PDFName.of('Height'), PDFNumber)?.asNumber() ?? 0;
    if (filters(ms.dict).join() !== 'FlateDecode' || !mw || !mh) return null;
    const raw = await sharp(Buffer.from(decodeFlatePixels(ms, mw, 1)), { raw: { width: mw, height: mh, channels: 1 } })
      .resize(w, h, { fit: 'fill', kernel: 'mitchell' })
      .extractChannel(0)
      .raw()
      .toBuffer();
    mask = deflateSync(raw, { level: 9 });
  }
  return { jpeg, w, h, mask };
}

/** Small promise pool: at most `limit` encodes in flight. */
async function pool<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

/**
 * Pick the first level predicted to land under the target. Encodes an evenly
 * spread sample of images at each level and scales the saving up to all
 * images by their original byte share.
 */
async function pickLevel(doc: PDFDocument, jobs: Job[], fileBytes: number, targetBytes: number, onStep: () => void) {
  if (jobs.length === 0) return 0;
  const stride = Math.max(1, Math.floor(jobs.length / SAMPLE_SIZE));
  const sample = jobs.filter((_, i) => i % stride === 0).slice(0, SAMPLE_SIZE);
  const allImageBytes = jobs.reduce((n, j) => n + j.origBytes, 0);
  const sampleOrig = sample.reduce((n, j) => n + j.origBytes, 0);
  for (let li = 0; li < LEVELS.length; li++) {
    const encoded = await pool(sample, CONCURRENCY, (j) => encode(doc, j, LEVELS[li]).catch(() => null));
    const sampleNew = encoded.reduce((n, e, i) => n + (e ? e.jpeg.length + (e.mask?.length ?? 0) : sample[i].origBytes), 0);
    const predicted = fileBytes - allImageBytes + allImageBytes * (sampleNew / sampleOrig);
    onStep();
    if (predicted <= targetBytes * PREDICT_HEADROOM) return li;
  }
  return LEVELS.length - 1;
}

export async function compressPdf(
  input: Uint8Array,
  opts: { targetBytes: number; onProgress?: ProgressFn }
): Promise<CompressResult> {
  const report = opts.onProgress ?? (() => {});
  const warnings: string[] = [];

  report({ phase: 'analysing', done: 0, total: LEVELS.length, level: 0, attempt: 1 });
  const probe = await PDFDocument.load(input, { updateMetadata: false });
  const probeJobs = collectJobs(probe, measureImages(probe), []).jobs;
  let steps = 0;
  let levelIndex = await pickLevel(probe, probeJobs, input.length, opts.targetBytes, () =>
    report({ phase: 'analysing', done: ++steps, total: LEVELS.length, level: 0, attempt: 1 })
  );

  let best: CompressResult | null = null;
  for (let attempt = 1; levelIndex < LEVELS.length; attempt++, levelIndex++) {
    const level = LEVELS[levelIndex];
    const doc = await PDFDocument.load(input, { updateMetadata: false });
    const { jobs, skipped } = collectJobs(doc, measureImages(doc), attempt === 1 ? warnings : []);
    let done = 0;
    let resampled = 0;
    report({ phase: 'images', done, total: jobs.length, level: levelIndex, attempt });
    await pool(jobs, CONCURRENCY, async (job) => {
      try {
        const e = await encode(doc, job, level);
        if (e) {
          const old = doc.context.lookup(job.ref) as PDFRawStream;
          const dict = old.dict.clone(doc.context);
          dict.set(PDFName.of('Width'), PDFNumber.of(e.w));
          dict.set(PDFName.of('Height'), PDFNumber.of(e.h));
          dict.set(PDFName.of('BitsPerComponent'), PDFNumber.of(8));
          dict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
          dict.delete(PDFName.of('DecodeParms'));
          if (job.channels === 1) dict.set(PDFName.of('ColorSpace'), PDFName.of('DeviceGray'));
          doc.context.assign(job.ref, PDFRawStream.of(dict, e.jpeg));
          if (job.smask && e.mask) {
            const mOld = doc.context.lookup(job.smask) as PDFRawStream;
            const mDict = mOld.dict.clone(doc.context);
            mDict.set(PDFName.of('Width'), PDFNumber.of(e.w));
            mDict.set(PDFName.of('Height'), PDFNumber.of(e.h));
            mDict.delete(PDFName.of('DecodeParms'));
            doc.context.assign(job.smask, PDFRawStream.of(mDict, e.mask));
          }
          resampled++;
        }
      } catch (err) {
        if (warnings.length < 20) warnings.push(`Image ${job.ref.toString()} kept: ${(err as Error).message}`);
      }
      report({ phase: 'images', done: ++done, total: jobs.length, level: levelIndex, attempt });
    });
    report({ phase: 'saving', done: 0, total: 1, level: levelIndex, attempt });
    const bytes = await doc.save({ useObjectStreams: true });
    const result: CompressResult = {
      bytes,
      level,
      attempts: attempt,
      imagesTotal: jobs.length + skipped,
      imagesResampled: resampled,
      imagesSkipped: skipped,
      warnings,
    };
    if (!best || bytes.length < best.bytes.length) best = result;
    if (bytes.length <= opts.targetBytes) return result;
  }
  // Nothing reached the target: hand back the smallest attempt.
  warnings.push('Target not reached at the lowest level; returning the smallest result.');
  return best!;
}
