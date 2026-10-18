'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';

type JobStatus = {
  id: string;
  fileName: string;
  state: 'queued' | 'running' | 'done' | 'error';
  phase: 'queued' | 'analysing' | 'images' | 'saving' | 'done';
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

type View =
  | { step: 'idle' }
  | { step: 'uploading'; name: string; sent: number; total: number }
  | { step: 'job'; job: JobStatus; uploadedAt: number }
  | { step: 'error'; message: string };

const POLL_MS = 700;
const MAX_BYTES = 150 * 1024 * 1024;

/** Share of the bar each phase owns, so one percentage covers the whole trip. */
const WEIGHTS = { upload: 15, analysing: 7, images: 63, saving: 10, finishing: 5 };

export function overallPercent(view: View): number {
  if (view.step === 'uploading') return (view.sent / Math.max(view.total, 1)) * WEIGHTS.upload;
  if (view.step !== 'job') return 0;
  const j = view.job;
  const frac = j.total > 0 ? j.done / j.total : 0;
  switch (j.phase) {
    case 'queued':
      return WEIGHTS.upload;
    case 'analysing':
      return WEIGHTS.upload + frac * WEIGHTS.analysing;
    case 'images':
      return WEIGHTS.upload + WEIGHTS.analysing + frac * WEIGHTS.images;
    case 'saving':
      return 100 - WEIGHTS.finishing - WEIGHTS.saving / 2;
    case 'done':
      return 100;
  }
}

export function formatBytes(n: number) {
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(n < 10 * 1024 * 1024 ? 2 : 1)} MB`;
}

const STEPS = [
  { key: 'upload', label: 'Upload' },
  { key: 'analysing', label: 'Analyse sample' },
  { key: 'images', label: 'Resample photos' },
  { key: 'saving', label: 'Save PDF' },
  { key: 'done', label: 'Ready' },
] as const;

function stepIndex(view: View) {
  if (view.step === 'uploading') return 0;
  if (view.step !== 'job') return -1;
  const p = view.job.phase;
  return p === 'queued' ? 0 : p === 'analysing' ? 1 : p === 'images' ? 2 : p === 'saving' ? 3 : 4;
}

export function CompressClient() {
  const [view, setView] = useState<View>({ step: 'idle' });
  const [targetMb, setTargetMb] = useState(5);
  const [dragOver, setDragOver] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  // Poll the job until it settles.
  const jobId = view.step === 'job' && (view.job.state === 'queued' || view.job.state === 'running') ? view.job.id : null;
  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/compress/${jobId}`, { cache: 'no-store' });
        if (!res.ok) throw new Error((await res.json()).error ?? 'Job lost');
        const job: JobStatus = await res.json();
        if (!cancelled) setView((v) => (v.step === 'job' ? { ...v, job } : v));
      } catch (err) {
        if (!cancelled) setView({ step: 'error', message: (err as Error).message });
      }
    };
    const t = setInterval(tick, POLL_MS);
    void tick();
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [jobId]);

  useEffect(() => {
    if (view.step !== 'job' || view.job.state === 'done' || view.job.state === 'error') return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [view]);

  const upload = useCallback(
    (file: File) => {
      if (file.size > MAX_BYTES) return setView({ step: 'error', message: 'That file is larger than 150 MB, the limit of this demo.' });
      if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') return setView({ step: 'error', message: 'Please choose a PDF file.' });
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      xhr.open('POST', `/api/compress?targetMb=${targetMb}&name=${encodeURIComponent(file.name)}`);
      xhr.setRequestHeader('Content-Type', 'application/pdf');
      xhr.upload.onprogress = (e) => setView({ step: 'uploading', name: file.name, sent: e.loaded, total: e.total || file.size });
      xhr.onload = () => {
        const body = JSON.parse(xhr.responseText || '{}');
        if (xhr.status === 202) setView({ step: 'job', job: body, uploadedAt: Date.now() });
        else setView({ step: 'error', message: body.error ?? 'Upload failed' });
      };
      xhr.onerror = () => setView({ step: 'error', message: 'The upload was interrupted. Check the connection and try again.' });
      xhr.onabort = () => setView({ step: 'idle' });
      setView({ step: 'uploading', name: file.name, sent: 0, total: file.size });
      xhr.send(file);
    },
    [targetMb]
  );

  const trySample = async () => {
    setView({ step: 'uploading', name: 'harbourline-sample-catalogue.pdf', sent: 1, total: 1 });
    const res = await fetch(`/api/compress/sample?targetMb=${targetMb}`, { method: 'POST' });
    const body = await res.json();
    if (res.status === 202) setView({ step: 'job', job: body, uploadedAt: Date.now() });
    else setView({ step: 'error', message: body.error ?? 'Could not start' });
  };

  const busy = view.step === 'uploading' || (view.step === 'job' && view.job.state !== 'done' && view.job.state !== 'error');
  const pct = Math.round(overallPercent(view));
  const current = stepIndex(view);

  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Compress a catalogue PDF</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            A browser-printed catalogue embeds every photo at full camera resolution. This resamples each photo to what its printed size actually needs, keeps text and vector art untouched, and aims for the size you pick.
          </p>
        </div>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            <label className="text-sm">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Target size</span>
              <span className="mt-1 flex items-center gap-2">
                <input type="number" min={0.5} max={200} step={0.5} value={targetMb} disabled={busy} onChange={(e) => setTargetMb(Number(e.target.value))} className="w-24 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none" />
                MB
              </span>
            </label>
            <p className="max-w-sm pb-2 text-xs text-zinc-500">The first quality level predicted to land under this is used; if the real result is still too big it steps down once more.</p>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f && !busy) upload(f);
            }}
            className={`mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${dragOver ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-300'}`}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-700">
              <Icon name="upload" className="h-6 w-6" />
            </span>
            <p className="mt-3 text-sm font-semibold text-zinc-900">Drop a PDF here</p>
            <p className="text-xs text-zinc-500">Up to 150 MB · checked for a PDF signature before anything runs</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50">
                Choose file
              </button>
              <button type="button" disabled={busy} onClick={trySample} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-50">
                Use the sample catalogue
              </button>
            </div>
            <a href="/api/compress/sample" download className="mt-3 text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-800">
              Download the sample (≈17 MB, 8 pages, 72 photos)
            </a>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) upload(f);
              }}
            />
          </div>
        </section>

        {view.step === 'error' ? (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <Icon name="warning" className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Nothing was compressed</p>
              <p>{view.message}</p>
            </div>
          </div>
        ) : null}

        {view.step === 'uploading' || view.step === 'job' ? (
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm" aria-live="polite">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900">{view.step === 'uploading' ? view.name : view.job.fileName}</p>
                <p className="text-xs text-zinc-500">
                  {view.step === 'uploading'
                    ? `Uploading ${formatBytes(view.sent)} of ${formatBytes(view.total)}`
                    : view.job.state === 'queued'
                      ? `Waiting for another job to finish (${view.job.queuePosition + 1} in queue)`
                      : view.job.state === 'done'
                        ? `Finished in ${((view.job.finishedAt! - view.job.startedAt) / 1000).toFixed(1)} s`
                        : view.job.state === 'error'
                          ? 'Failed'
                          : `${view.job.phase === 'images' ? `Photo ${view.job.done} of ${view.job.total}` : view.job.phase === 'analysing' ? `Testing quality level ${view.job.done + 1}` : 'Writing the new file'} · ${view.job.levelLabel || 'choosing level'}${view.job.attempt > 1 ? ` · attempt ${view.job.attempt}` : ''} · ${((now - view.job.startedAt) / 1000).toFixed(0)} s`}
                </p>
              </div>
              <span className="text-2xl font-semibold tabular-nums text-zinc-900">{pct}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
              <div className={`h-full rounded-full transition-[width] duration-300 ${view.step === 'job' && view.job.state === 'done' ? 'bg-emerald-500' : 'bg-zinc-900'}`} style={{ width: `${pct}%` }} />
            </div>
            <ol className="mt-4 grid grid-cols-5 gap-2">
              {STEPS.map((s, i) => (
                <li key={s.key} className="flex flex-col items-center gap-1 text-center">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${i < current || (i === current && current === 4) ? 'bg-emerald-500 text-white' : i === current ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                    {i < current || (i === current && current === 4) ? <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={`text-[11px] ${i <= current ? 'text-zinc-800' : 'text-zinc-400'}`}>{s.label}</span>
                </li>
              ))}
            </ol>
            {view.step === 'uploading' && view.total > 1 ? (
              <button type="button" onClick={() => xhrRef.current?.abort()} className="mt-4 text-sm font-medium text-zinc-600 underline underline-offset-2">
                Cancel upload
              </button>
            ) : null}
            {view.step === 'job' && view.job.state === 'error' ? <p className="mt-4 text-sm text-rose-700">{view.job.error}</p> : null}
            {view.step === 'job' && view.job.state === 'done' && view.job.outputBytes != null ? <Result job={view.job} /> : null}
          </section>
        ) : null}
      </div>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700 shadow-sm">
          <p className="font-semibold text-zinc-900">What happens to the file</p>
          <ol className="mt-3 space-y-3">
            {[
              ['Stream to disk', 'The upload is written to a temp file as it arrives and cut off past the size limit.'],
              ['Measure', 'The page content is read to find how large each photo is actually drawn.'],
              ['Predict', 'A sample of photos is encoded at each quality level to pick one that should fit the target.'],
              ['Resample', 'Each photo is resized to the pixels it needs (only ever down) and re-encoded. A photo that would not shrink by 8% keeps its original.'],
              ['Save', 'Text, fonts and vectors are untouched. Jobs run one at a time and results expire after 20 minutes.'],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-bold text-white">{i + 1}</span>
                <span>
                  <b className="text-zinc-900">{t}.</b> {d}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </main>
  );
}

function Result({ job }: { job: JobStatus }) {
  const out = job.outputBytes!;
  const saved = 1 - out / job.inputBytes;
  return (
    <div className="mt-5 rounded-xl bg-zinc-50 p-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Before</p>
          <p className="text-xl font-semibold text-zinc-900">{formatBytes(job.inputBytes)}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">After</p>
          <p className="text-xl font-semibold text-emerald-700">{formatBytes(out)}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Smaller by</p>
          <p className="text-xl font-semibold text-zinc-900">{Math.max(0, saved * 100).toFixed(0)}%</p>
        </div>
      </div>
      <div className="mt-4 space-y-1.5">
        <div className="h-3 rounded-full bg-zinc-300" />
        <div className="h-3 rounded-full bg-emerald-500" style={{ width: `${Math.max(1.5, (out / job.inputBytes) * 100)}%` }} />
      </div>
      <p className="mt-3 text-xs text-zinc-600">
        {job.imagesResampled} of {job.imagesTotal} photos resampled · {job.levelLabel} · {job.attempt > 1 ? `${job.attempt} passes` : 'one pass'}
      </p>
      {job.warnings.length > 0 ? (
        <ul className="mt-2 list-disc pl-5 text-xs text-amber-800">
          {job.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}
      <a href={`/api/compress/${job.id}/download`} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
        <Icon name="download" /> Download compressed PDF
      </a>
    </div>
  );
}
