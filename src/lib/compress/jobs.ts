/**
 * Background compression jobs.
 *
 * Uploads are streamed to a temp file (never buffered whole by the route),
 * jobs run one at a time behind a small queue so two large files cannot
 * multiply memory, and finished results live on disk until they are
 * downloaded or expire. State is in memory: fine for a demo, and the README
 * says what a production version would persist.
 */
import 'server-only';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { compressPdf, LEVELS, type Phase } from './compress-pdf';

export type JobStatus = {
  id: string;
  fileName: string;
  state: 'queued' | 'running' | 'done' | 'error';
  phase: Phase | 'queued' | 'done';
  done: number;
  total: number;
  attempt: number;
  levelLabel: string;
  inputBytes: number;
  outputBytes: number | null;
  imagesTotal: number;
  imagesResampled: number;
  warnings: string[];
  error: string | null;
  startedAt: number;
  finishedAt: number | null;
  queuePosition: number;
};

type Entry = { status: JobStatus; inputPath: string; outputPath: string; createdAt: number };

export const MAX_UPLOAD_BYTES = 150 * 1024 * 1024;
const TTL_MS = 20 * 60 * 1000;
export const JOB_DIR = path.join(tmpdir(), 'catalogue-studio-jobs');

const g = globalThis as unknown as { __jobs?: Map<string, Entry>; __queue?: string[]; __running?: boolean };
const jobs = (g.__jobs ??= new Map());
const queue = (g.__queue ??= []);
const targets = new Map<string, number>();

export async function newJobPaths() {
  await mkdir(JOB_DIR, { recursive: true });
  const id = randomUUID();
  return { id, inputPath: path.join(JOB_DIR, `${id}.in.pdf`), outputPath: path.join(JOB_DIR, `${id}.out.pdf`) };
}

async function prune() {
  const now = Date.now();
  for (const [id, e] of jobs) {
    if (now - e.createdAt > TTL_MS && e.status.state !== 'running') {
      jobs.delete(id);
      await rm(e.inputPath, { force: true });
      await rm(e.outputPath, { force: true });
    }
  }
}

export async function enqueueJob(opts: {
  id: string;
  inputPath: string;
  outputPath: string;
  fileName: string;
  inputBytes: number;
  targetBytes: number;
}) {
  await prune();
  const status: JobStatus = {
    id: opts.id,
    fileName: opts.fileName,
    state: 'queued',
    phase: 'queued',
    done: 0,
    total: 0,
    attempt: 1,
    levelLabel: '',
    inputBytes: opts.inputBytes,
    outputBytes: null,
    imagesTotal: 0,
    imagesResampled: 0,
    warnings: [],
    error: null,
    startedAt: Date.now(),
    finishedAt: null,
    queuePosition: queue.length,
  };
  jobs.set(opts.id, { status, inputPath: opts.inputPath, outputPath: opts.outputPath, createdAt: Date.now() });
  targets.set(opts.id, opts.targetBytes);
  queue.push(opts.id);
  void drain();
  return status;
}

async function drain() {
  if (g.__running) return;
  g.__running = true;
  try {
    while (queue.length > 0) {
      const id = queue.shift()!;
      queue.forEach((qid, i) => {
        const e = jobs.get(qid);
        if (e) e.status.queuePosition = i;
      });
      const entry = jobs.get(id);
      if (!entry) continue;
      await run(entry, targets.get(id) ?? 10 * 1024 * 1024);
      targets.delete(id);
    }
  } finally {
    g.__running = false;
  }
}

async function run(entry: Entry, targetBytes: number) {
  const s = entry.status;
  s.state = 'running';
  s.queuePosition = 0;
  try {
    const input = await readFile(entry.inputPath);
    const result = await compressPdf(input, {
      targetBytes,
      onProgress: (p) => {
        s.phase = p.phase;
        s.done = p.done;
        s.total = p.total;
        s.attempt = p.attempt;
        const l = LEVELS[p.level];
        s.levelLabel = `${l.ppi} ppi · JPEG ${l.quality}`;
      },
    });
    // Never hand back something bigger than what came in.
    const out = result.bytes.length < input.length ? result.bytes : input;
    await writeFile(entry.outputPath, out);
    s.outputBytes = out.length;
    s.imagesTotal = result.imagesTotal;
    s.imagesResampled = result.imagesResampled;
    s.warnings = result.warnings;
    s.levelLabel = `${result.level.ppi} ppi · JPEG ${result.level.quality}`;
    s.state = 'done';
    s.phase = 'done';
  } catch (err) {
    s.state = 'error';
    s.error = err instanceof Error ? err.message : 'Compression failed';
  } finally {
    s.finishedAt = Date.now();
    await rm(entry.inputPath, { force: true });
  }
}

export function jobStatus(id: string): JobStatus | null {
  return jobs.get(id)?.status ?? null;
}

export function jobOutputPath(id: string): string | null {
  const e = jobs.get(id);
  return e && e.status.state === 'done' ? e.outputPath : null;
}
