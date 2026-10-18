import { createWriteStream } from 'node:fs';
import { open, rm } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { enqueueJob, MAX_UPLOAD_BYTES, newJobPaths } from '@/lib/compress/jobs';
import { parseTarget } from '@/lib/compress/params';

export const runtime = 'nodejs';

/**
 * Upload a PDF as the raw request body (so the browser can report upload
 * progress) and start a compression job. The body is streamed to a temp
 * file and cut off as soon as it passes the size limit.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const declared = Number(req.headers.get('content-length') ?? 0);
  if (declared > MAX_UPLOAD_BYTES) return Response.json({ error: 'File is larger than 150 MB' }, { status: 413 });
  if (!req.body) return Response.json({ error: 'No file' }, { status: 400 });

  const { id, inputPath, outputPath } = await newJobPaths();
  let received = 0;
  const limited = Readable.fromWeb(req.body as import('node:stream/web').ReadableStream).on('data', (chunk: Buffer) => {
    received += chunk.length;
    if (received > MAX_UPLOAD_BYTES) limited.destroy(new Error('too-large'));
  });
  try {
    await pipeline(limited, createWriteStream(inputPath));
  } catch (err) {
    await rm(inputPath, { force: true });
    const tooLarge = (err as Error).message === 'too-large';
    return Response.json({ error: tooLarge ? 'File is larger than 150 MB' : 'Upload failed' }, { status: tooLarge ? 413 : 400 });
  }

  // Signature check: a PDF starts with "%PDF-" within its first kilobyte.
  const fh = await open(inputPath, 'r');
  const head = Buffer.alloc(1024);
  await fh.read(head, 0, 1024, 0);
  await fh.close();
  if (!head.includes('%PDF-')) {
    await rm(inputPath, { force: true });
    return Response.json({ error: 'That file is not a PDF' }, { status: 415 });
  }

  const status = await enqueueJob({
    id,
    inputPath,
    outputPath,
    fileName: (url.searchParams.get('name') ?? 'catalogue.pdf').slice(0, 120),
    inputBytes: received,
    targetBytes: parseTarget(url.searchParams.get('targetMb')),
  });
  return Response.json(status, { status: 202 });
}
