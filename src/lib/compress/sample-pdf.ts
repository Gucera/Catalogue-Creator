/**
 * Builds a small "print catalogue" PDF with oversized photos, so visitors can
 * try the compressor without bringing a file. Photos are the generated
 * packshots rendered far above print resolution plus a little grain (like a
 * camera file), then drawn at ~60 mm — the typical waste a browser print of
 * a catalogue contains.
 */
import 'server-only';
import sharp from 'sharp';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { allProducts } from '../data/store';
import { packshotSvg } from '../photos/packshot';

const MM = 72 / 25.4;
const PAGES = 8;
const COLS = 3;
const ROWS = 3;
const PHOTO_PX = 1200;

async function photo(svg: string, seed: number): Promise<Buffer> {
  const base = await sharp(Buffer.from(svg), { density: (72 * PHOTO_PX) / 400 })
    .resize(PHOTO_PX, PHOTO_PX)
    .removeAlpha()
    .raw()
    .toBuffer();
  // Mild per-pixel grain so the JPEG behaves like a real photo, not flat art.
  let s = seed >>> 0;
  for (let i = 0; i < base.length; i += 3) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const n = ((s >>> 24) % 9) - 4;
    base[i] = Math.max(0, Math.min(255, base[i] + n));
    base[i + 1] = Math.max(0, Math.min(255, base[i + 1] + n));
    base[i + 2] = Math.max(0, Math.min(255, base[i + 2] + n));
  }
  return sharp(base, { raw: { width: PHOTO_PX, height: PHOTO_PX, channels: 3 } })
    .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
    .toBuffer();
}

let cached: Promise<Uint8Array> | null = null;

export function samplePdf(): Promise<Uint8Array> {
  cached ??= build().catch((e) => {
    cached = null;
    throw e;
  });
  return cached;
}

async function build(): Promise<Uint8Array> {
  const products = allProducts().filter((p) => p.photo === 'ok').slice(0, PAGES * COLS * ROWS);
  const doc = await PDFDocument.create();
  doc.setTitle('Harbourline sample catalogue (demo)');
  doc.setProducer('Catalogue Studio demo');
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const jpegs = await Promise.all(products.map((p, i) => photo(packshotSvg(p), i + 1)));

  for (let pageNo = 0; pageNo < PAGES; pageNo++) {
    const page = doc.addPage([210 * MM, 297 * MM]);
    page.drawRectangle({ x: 0, y: 279 * MM, width: 210 * MM, height: 18 * MM, color: rgb(0.5, 0.65, 0.71) });
    page.drawText('Harbourline Wholesale · Sample catalogue', { x: 10 * MM, y: 286 * MM, size: 12, font: bold, color: rgb(1, 1, 1) });
    page.drawText(`Page ${pageNo + 1}`, { x: 185 * MM, y: 286 * MM, size: 10, font, color: rgb(1, 1, 1) });
    const cardW = (190 - (COLS - 1) * 4) / COLS;
    const cardH = (250 - (ROWS - 1) * 4) / ROWS;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const idx = pageNo * COLS * ROWS + r * COLS + c;
        const p = products[idx];
        if (!p) continue;
        const x = (10 + c * (cardW + 4)) * MM;
        const top = (272 - r * (cardH + 4)) * MM;
        page.drawRectangle({ x, y: top - cardH * MM, width: cardW * MM, height: cardH * MM, borderColor: rgb(0.85, 0.85, 0.87), borderWidth: 0.6 });
        const img = await doc.embedJpg(jpegs[idx]);
        const side = (cardW - 8) * MM;
        page.drawImage(img, { x: x + 4 * MM, y: top - 4 * MM - side, width: side, height: side });
        page.drawText(p.title.slice(0, 34), { x: x + 3 * MM, y: top - side - 10 * MM, size: 7.5, font: bold });
        page.drawText(`${p.sku}   ${p.size}`, { x: x + 3 * MM, y: top - side - 14 * MM, size: 6.5, font, color: rgb(0.45, 0.45, 0.5) });
      }
    }
  }
  return doc.save();
}
