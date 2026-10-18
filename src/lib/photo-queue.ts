/**
 * Queued photo loader for the catalogue.
 *
 * A catalogue is hundreds of photos. Letting the browser fire every <img> at
 * once floods the image host and makes a print start before photos arrive.
 * This queue keeps a fixed number of requests in flight, retries transient
 * failures with back-off, and remembers the outcome per URL so the export can
 * report "missing" (the product has no photo, 404) separately from "failed"
 * (the host errored, worth retrying) before printing.
 */

export type PhotoState = 'queued' | 'loading' | 'loaded' | 'missing' | 'failed';

type Entry = {
  state: PhotoState;
  src: string | null;
  attempts: number;
  listeners: Set<() => void>;
};

export type PhotoReport = { loaded: number; missing: string[]; failed: string[]; pending: number };

const CONCURRENCY = 6;
const MAX_ATTEMPTS = 3;

class PhotoQueue {
  private entries = new Map<string, Entry>();
  private waiting: string[] = [];
  private active = 0;
  private watchers = new Set<() => void>();

  private entry(url: string): Entry {
    let e = this.entries.get(url);
    if (!e) {
      e = { state: 'queued', src: null, attempts: 0, listeners: new Set() };
      this.entries.set(url, e);
    }
    return e;
  }

  get(url: string): Entry {
    return this.entry(url);
  }

  /** Ask for a photo. `urgent` jumps the queue (the page on screen). */
  request(url: string, urgent = false) {
    const e = this.entry(url);
    if (e.state !== 'queued' || this.waiting.includes(url)) {
      if (urgent && this.waiting.includes(url)) {
        this.waiting = [url, ...this.waiting.filter((u) => u !== url)];
      }
      return;
    }
    if (urgent) this.waiting.unshift(url);
    else this.waiting.push(url);
    this.pump();
  }

  subscribe(url: string, fn: () => void) {
    const e = this.entry(url);
    e.listeners.add(fn);
    return () => e.listeners.delete(fn);
  }

  /** Called on any state change (for progress counters). */
  watch(fn: () => void) {
    this.watchers.add(fn);
    return () => this.watchers.delete(fn);
  }

  private set(url: string, patch: Partial<Entry>) {
    const e = this.entry(url);
    Object.assign(e, patch);
    e.listeners.forEach((l) => l());
    this.watchers.forEach((w) => w());
  }

  private pump() {
    while (this.active < CONCURRENCY && this.waiting.length > 0) {
      const url = this.waiting.shift()!;
      this.active++;
      void this.load(url).finally(() => {
        this.active--;
        this.pump();
      });
    }
  }

  private async load(url: string) {
    const e = this.entry(url);
    this.set(url, { state: 'loading', attempts: e.attempts + 1 });
    try {
      const res = await fetch(url);
      if (res.status === 404) return this.set(url, { state: 'missing' });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      this.set(url, { state: 'loaded', src: URL.createObjectURL(blob) });
    } catch {
      if (this.entry(url).attempts < MAX_ATTEMPTS) {
        // Back off, then go to the end of the queue.
        await new Promise((r) => setTimeout(r, 300 * 2 ** this.entry(url).attempts));
        this.set(url, { state: 'queued' });
        this.request(url);
      } else {
        this.set(url, { state: 'failed' });
      }
    }
  }

  /** Put failed photos back in the queue for another round of attempts. */
  retryFailed(urls: string[]) {
    for (const url of urls) {
      const e = this.entry(url);
      if (e.state === 'failed') {
        this.set(url, { state: 'queued', attempts: 0 });
        this.request(url);
      }
    }
  }

  report(urls: string[], keyOf: (url: string) => string = (u) => u): PhotoReport {
    const r: PhotoReport = { loaded: 0, missing: [], failed: [], pending: 0 };
    for (const url of urls) {
      const s = this.entry(url).state;
      if (s === 'loaded') r.loaded++;
      else if (s === 'missing') r.missing.push(keyOf(url));
      else if (s === 'failed') r.failed.push(keyOf(url));
      else r.pending++;
    }
    return r;
  }

  /** Request all URLs and resolve once none is queued or loading. */
  settle(urls: string[], onProgress?: (done: number, total: number) => void): Promise<void> {
    urls.forEach((u) => this.request(u));
    return new Promise((resolve) => {
      const check = () => {
        const pending = urls.filter((u) => {
          const s = this.entry(u).state;
          return s === 'queued' || s === 'loading';
        }).length;
        onProgress?.(urls.length - pending, urls.length);
        if (pending === 0) {
          stop();
          resolve();
        }
      };
      const stop = this.watch(check);
      check();
    });
  }
}

export const photoQueue = new PhotoQueue();

export const photoUrl = (sku: string) => `/api/photos/${encodeURIComponent(sku)}`;
