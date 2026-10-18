'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { Flyer, Focal, FocalLayout, FocalTheme } from '@/lib/data/flyers';
import { FLYER_ASPECT, formatPrice } from '@/lib/data/flyers';
import { clampRect, snapRect, type Guide, type Rect } from '@/lib/flyer/snap';
import { useUnsavedChanges } from '@/lib/use-unsaved-changes';
import { FocalView, FOCAL_THEMES } from './FocalView';
import { Icon } from '@/components/ui/Icon';

type SearchHit = { sku: string; title: string; size: string; eachPrice: number | null; boxPrice: number | null; status: string };
type LiveInfo = { title: string; size: string; eachPrice: number | null; boxPrice: number | null; status: string } | null;

const HISTORY_LIMIT = 40;
const BASE_W = 560;
const LAYOUT_SIZES: Record<FocalLayout, { w: number; h: number }> = {
  stack: { w: 0.42, h: 0.17 },
  row: { w: 0.84, h: 0.11 },
  badge: { w: 0.32, h: 0.18 },
};

type Drag = {
  mode: 'move' | 'resize';
  id: string;
  startX: number;
  startY: number;
  start: Rect;
  before: Focal[];
};

const isTyping = (t: EventTarget | null) => t instanceof HTMLElement && !!t.closest('input, textarea, select, [contenteditable=true]');

export function FocalEditor({ catalogueId, flyer, initial }: { catalogueId: string; flyer: Flyer; initial: Focal[] }) {
  // One state object, so undo/redo never sees a half-updated history.
  const [hist, setHist] = useState<{ past: Focal[][]; present: Focal[]; future: Focal[][] }>({ past: [], present: initial, future: [] });
  const focals = hist.present;
  const past = hist.past;
  const future = hist.future;
  const setFocals = (fn: (cur: Focal[]) => Focal[]) => setHist((h) => ({ ...h, present: fn(h.present) }));
  const [saved, setSaved] = useState<Focal[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(initial[0]?.id ?? null);
  const [zoom, setZoom] = useState(1);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [live, setLive] = useState<Record<string, LiveInfo>>({});
  const canvasRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);

  const dirty = useMemo(() => JSON.stringify(focals) !== JSON.stringify(saved), [focals, saved]);
  useUnsavedChanges(dirty);
  const selected = focals.find((f) => f.id === selectedId) ?? null;

  // Live product data, to flag focals whose product can no longer be sold or whose price moved.
  const skuKey = useMemo(() => [...new Set(focals.map((f) => f.sku))].sort().join(','), [focals]);
  useEffect(() => {
    if (!skuKey) return;
    let cancelled = false;
    fetch(`/api/products/prices?skus=${encodeURIComponent(skuKey)}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setLive((l) => ({ ...l, ...d.prices })))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [skuKey]);

  // ── History ───────────────────────────────────────────────
  const commit = useCallback((next: (cur: Focal[]) => Focal[]) => {
    setHist((h) => {
      const value = next(h.present);
      if (JSON.stringify(value) === JSON.stringify(h.present)) return h;
      return { past: [...h.past, h.present].slice(-HISTORY_LIMIT), present: value, future: [] };
    });
  }, []);
  const undo = useCallback(() => {
    setHist((h) => (h.past.length === 0 ? h : { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future].slice(0, HISTORY_LIMIT) }));
  }, []);
  const redo = useCallback(() => {
    setHist((h) => (h.future.length === 0 ? h : { past: [...h.past, h.present].slice(-HISTORY_LIMIT), present: h.future[0], future: h.future.slice(1) }));
  }, []);

  const patchSelected = (patch: Partial<Focal>) => selected && commit((cur) => cur.map((f) => (f.id === selected.id ? { ...f, ...patch } : f)));

  const remove = useCallback(
    (id: string) => {
      commit((cur) => cur.filter((f) => f.id !== id));
      setSelectedId(null);
    },
    [commit]
  );

  const duplicate = useCallback(
    (id: string) => {
      const src = focals.find((f) => f.id === id);
      if (!src) return;
      const copy = { ...src, id: `f-${crypto.randomUUID().slice(0, 8)}`, ...clampRect({ x: src.x + 0.03, y: src.y + 0.03, w: src.w, h: src.h }) };
      commit((cur) => [...cur, copy]);
      setSelectedId(copy.id);
    },
    [focals, commit]
  );

  // ── Keyboard ──────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (mod && e.key.toLowerCase() === 'd' && selectedId) {
        e.preventDefault();
        duplicate(selectedId);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        remove(selectedId);
      } else if (e.key === 'Escape') {
        setSelectedId(null);
      } else if (e.key.startsWith('Arrow') && selectedId && canvasRef.current) {
        e.preventDefault();
        const r = canvasRef.current.getBoundingClientRect();
        const px = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -px : e.key === 'ArrowRight' ? px : 0;
        const dy = e.key === 'ArrowUp' ? -px : e.key === 'ArrowDown' ? px : 0;
        commit((cur) => cur.map((f) => (f.id === selectedId ? { ...f, ...clampRect({ ...f, x: f.x + dx / r.width, y: f.y + dy / r.height }) } : f)));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, undo, redo, duplicate, remove, commit]);

  // ── Pointer drag / resize with snapping ───────────────────
  const onPointerDown = (e: ReactPointerEvent, f: Focal, mode: Drag['mode']) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setSelectedId(f.id);
    drag.current = { mode, id: f.id, startX: e.clientX, startY: e.clientY, start: { x: f.x, y: f.y, w: f.w, h: f.h }, before: focals };
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    const canvas = canvasRef.current;
    if (!d || !canvas) return;
    const r = canvas.getBoundingClientRect();
    const dx = (e.clientX - d.startX) / r.width;
    const dy = (e.clientY - d.startY) / r.height;
    let rect: Rect;
    if (d.mode === 'move') {
      rect = clampRect({ ...d.start, x: d.start.x + dx, y: d.start.y + dy });
      if (!e.altKey) {
        const others = focals.filter((f) => f.id !== d.id);
        const snapped = snapRect(rect, others, r.width, r.height);
        rect = clampRect(snapped.rect);
        setGuides(snapped.guides);
      } else setGuides([]);
    } else {
      rect = clampRect({ ...d.start, w: d.start.w + dx, h: d.start.h + dy });
    }
    setFocals((cur) => cur.map((f) => (f.id === d.id ? { ...f, ...rect } : f)));
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    setGuides([]);
    if (!d) return;
    // One history entry per gesture, not per pointer move.
    setHist((h) =>
      JSON.stringify(h.present) === JSON.stringify(d.before) ? h : { past: [...h.past, d.before].slice(-HISTORY_LIMIT), present: h.present, future: [] }
    );
  };

  // ── Product search (debounced, stale responses ignored) ───
  const [query, setQuery] = useState('');
  // Results remember which query they answer, so "searching" is derived, not stored.
  const [result, setResult] = useState<{ q: string; products: SearchHit[] }>({ q: '', products: [] });
  const trimmed = query.trim();
  const searching = trimmed.length >= 2 && result.q !== trimmed;
  const shownHits = result.q === trimmed ? result.products : [];
  useEffect(() => {
    if (trimmed.length < 2) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(trimmed)}`);
      const data = res.ok ? await res.json() : { products: [] };
      if (!cancelled) setResult({ q: trimmed, products: data.products });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [trimmed]);

  const place = (p: SearchHit) => {
    // New focals inherit the look of the selected one.
    const layout = selected?.layout ?? 'stack';
    const size = selected ? { w: selected.w, h: selected.h } : LAYOUT_SIZES[layout];
    const focal: Focal = {
      id: `f-${crypto.randomUUID().slice(0, 8)}`,
      sku: p.sku,
      title: p.title,
      size: p.size,
      eachPrice: p.eachPrice,
      boxPrice: p.boxPrice,
      ...clampRect({ x: 0.5 - size.w / 2, y: 0.5 - size.h / 2, ...size }),
      layout,
      theme: selected?.theme ?? 'paper',
      showQr: selected?.showQr ?? true,
      showBox: selected?.showBox ?? true,
    };
    commit((cur) => [...cur, focal]);
    setSelectedId(focal.id);
    setQuery('');
  };

  const save = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/flyers/${flyer.id}/focals`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ focals }) });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Save failed');
      setSaved(focals);
      setNotice({ tone: 'ok', text: 'Saved. The flyer page in the PDF export now shows these focals.' });
    } catch (err) {
      setNotice({ tone: 'error', text: `Not saved: ${(err as Error).message}` });
    } finally {
      setSaving(false);
    }
  };

  const liveOf = (f: Focal) => live[f.sku];
  const priceChanged = (f: Focal) => {
    const l = liveOf(f);
    return !!l && (l.eachPrice !== f.eachPrice || l.boxPrice !== f.boxPrice);
  };
  const notForSale = (f: Focal) => {
    const l = liveOf(f);
    return l === null || (!!l && l.status !== 'active');
  };

  const width = BASE_W * zoom;

  return (
    <div className="flex h-screen flex-col bg-zinc-100" onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-zinc-200 bg-white px-4">
        <Link
          href={`/demo/catalogues/${catalogueId}/flyers`}
          onClick={(e) => {
            if (dirty && !window.confirm('Leave without saving your changes?')) e.preventDefault();
          }}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
        >
          <Icon name="left" /> Flyers
        </Link>
        <div className="h-6 w-px bg-zinc-200" />
        <div>
          <p className="text-sm font-semibold text-zinc-900">{flyer.title}</p>
          <p className="text-[11px] text-zinc-500">{focals.length} focal{focals.length === 1 ? '' : 's'} · {dirty ? <span className="text-amber-700">unsaved changes</span> : 'all changes saved'}</p>
        </div>
        <div className="ml-6 flex items-center gap-1">
          <button type="button" onClick={undo} disabled={past.length === 0} title="Undo (Ctrl+Z)" aria-label="Undo" className="rounded-md p-2 text-zinc-700 hover:bg-zinc-100 disabled:opacity-30">
            <Icon name="undo" />
          </button>
          <button type="button" onClick={redo} disabled={future.length === 0} title="Redo (Ctrl+Shift+Z)" aria-label="Redo" className="rounded-md p-2 text-zinc-700 hover:bg-zinc-100 disabled:opacity-30">
            <Icon name="redo" />
          </button>
          <div className="mx-2 h-6 w-px bg-zinc-200" />
          <button type="button" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(1)))} aria-label="Zoom out" className="rounded-md p-2 text-zinc-700 hover:bg-zinc-100">
            <Icon name="zoomOut" />
          </button>
          <span className="w-12 text-center text-xs tabular-nums text-zinc-600">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(1)))} aria-label="Zoom in" className="rounded-md p-2 text-zinc-700 hover:bg-zinc-100">
            <Icon name="zoomIn" />
          </button>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {notice ? (
            <span role="status" className={`text-sm ${notice.tone === 'ok' ? 'text-emerald-700' : 'text-rose-700'}`}>
              {notice.text}
            </span>
          ) : null}
          <button type="button" onClick={save} disabled={!dirty || saving} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:bg-zinc-300">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Left: add products + layers */}
        <aside className="flex w-72 shrink-0 flex-col border-r border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 p-3">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500" htmlFor="focal-search">
              Add a product
            </label>
            <div className="relative mt-1.5">
              <Icon name="search" className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
              <input id="focal-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or code, e.g. chilli" className="w-full rounded-lg border border-zinc-300 py-2 pl-8 pr-3 text-sm focus:border-zinc-900 focus:outline-none" />
            </div>
            {query.trim().length >= 2 ? (
              <ul className="thin-scroll mt-2 max-h-72 overflow-y-auto rounded-lg border border-zinc-200">
                {searching && shownHits.length === 0 ? <li className="p-3 text-xs text-zinc-500">Searching…</li> : null}
                {!searching && shownHits.length === 0 ? <li className="p-3 text-xs text-zinc-500">No products found.</li> : null}
                {shownHits.map((h) => (
                  <li key={h.sku}>
                    <button type="button" onClick={() => place(h)} className="flex w-full items-start gap-2 border-b border-zinc-100 px-3 py-2 text-left last:border-0 hover:bg-zinc-50">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-zinc-900">{h.title}</span>
                        <span className="block text-[11px] text-zinc-500">
                          {h.sku} · {h.size}
                        </span>
                      </span>
                      <span className="text-xs font-semibold text-zinc-800">{formatPrice(h.eachPrice)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[11px] text-zinc-500">Name, prices, code and QR come from the product record; nothing is typed.</p>
            )}
          </div>
          <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Focals on this flyer</p>
          <ul className="thin-scroll flex-1 overflow-y-auto px-2 pb-3">
            {focals.length === 0 ? <li className="px-1 py-2 text-xs text-zinc-500">None yet. Search for a product above to place one.</li> : null}
            {focals.map((f) => (
              <li key={f.id}>
                <button type="button" onClick={() => setSelectedId(f.id)} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left ${f.id === selectedId ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-100'}`}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{f.title}</span>
                    <span className={`block text-[11px] ${f.id === selectedId ? 'text-white/60' : 'text-zinc-500'}`}>
                      {f.sku} · {formatPrice(f.eachPrice)}
                    </span>
                  </span>
                  {notForSale(f) ? <span title="Product can no longer be sold" className="rounded bg-rose-600 px-1 text-[10px] font-bold text-white">!</span> : priceChanged(f) ? <span title="Price changed since placing" className="rounded bg-amber-500 px-1 text-[10px] font-bold text-white">£</span> : null}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-zinc-200 p-3 text-[11px] leading-relaxed text-zinc-500">
            <b className="text-zinc-700">Shortcuts</b> · drag to move (Alt = no snapping) · arrows nudge 1px, Shift 10px · Ctrl+D duplicate · Delete remove · Ctrl+Z / Ctrl+Shift+Z
          </div>
        </aside>

        {/* Canvas */}
        <main className="thin-scroll min-w-0 flex-1 overflow-auto" onPointerDown={() => setSelectedId(null)}>
          <div className="flex min-h-full items-start justify-center p-8">
            <div ref={canvasRef} className="relative shrink-0 select-none bg-white shadow-xl" style={{ width, height: width / FLYER_ASPECT, containerType: 'inline-size' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/flyers/${flyer.id}/art`} alt={flyer.title} draggable={false} className="absolute inset-0 h-full w-full" />
              {focals.map((f) => (
                <div key={f.id}>
                  <FocalView focal={f} warning={notForSale(f)} />
                  <div
                    role="button"
                    tabIndex={-1}
                    aria-label={`Focal ${f.title}`}
                    onPointerDown={(e) => onPointerDown(e, f, 'move')}
                    className={`absolute cursor-move touch-none rounded-[1.2cqw] ${f.id === selectedId ? 'outline-2 outline-offset-2 outline-sky-500' : 'hover:outline hover:outline-1 hover:outline-sky-400'}`}
                    style={{ left: `${f.x * 100}%`, top: `${f.y * 100}%`, width: `${f.w * 100}%`, height: `${f.h * 100}%` }}
                  >
                    {f.id === selectedId ? (
                      <span
                        onPointerDown={(e) => onPointerDown(e, f, 'resize')}
                        className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize touch-none rounded-sm border-2 border-white bg-sky-500 shadow"
                        aria-hidden
                      />
                    ) : null}
                  </div>
                </div>
              ))}
              {guides.map((g, i) =>
                g.axis === 'x' ? (
                  <div key={i} className="pointer-events-none absolute inset-y-0 w-px bg-fuchsia-500" style={{ left: `${g.at * 100}%` }} />
                ) : (
                  <div key={i} className="pointer-events-none absolute inset-x-0 h-px bg-fuchsia-500" style={{ top: `${g.at * 100}%` }} />
                )
              )}
            </div>
          </div>
        </main>

        {/* Right: properties */}
        <aside className="thin-scroll w-72 shrink-0 overflow-y-auto border-l border-zinc-200 bg-white p-4">
          {selected ? (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-zinc-900">{selected.title}</p>
                <p className="text-xs text-zinc-500">
                  {selected.sku} · {selected.size}
                </p>
              </div>
              {notForSale(selected) ? (
                <p className="rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700">This product is {liveOf(selected)?.status === 'coming-soon' ? 'not in stock yet' : 'discontinued'}. Swap it out before the flyer is printed.</p>
              ) : null}
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Prices</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg border border-zinc-200 p-2">
                    <span className="block text-[10px] uppercase text-zinc-500">Each</span>
                    <b>{formatPrice(selected.eachPrice)}</b>
                  </div>
                  <div className="rounded-lg border border-zinc-200 p-2">
                    <span className="block text-[10px] uppercase text-zinc-500">Box</span>
                    <b>{formatPrice(selected.boxPrice)}</b>
                  </div>
                </div>
                {priceChanged(selected) ? (
                  <button
                    type="button"
                    onClick={() => {
                      const l = liveOf(selected)!;
                      patchSelected({ eachPrice: l.eachPrice, boxPrice: l.boxPrice, title: l.title, size: l.size });
                    }}
                    className="mt-2 w-full rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Price list changed: use {formatPrice(liveOf(selected)!.eachPrice)}
                  </button>
                ) : (
                  <p className="mt-1.5 text-[11px] text-zinc-500">Captured when placed; you’re told here if the price list changes.</p>
                )}
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Layout</p>
                <div className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-100 p-1">
                  {(['stack', 'row', 'badge'] as FocalLayout[]).map((l) => (
                    <button key={l} type="button" aria-pressed={selected.layout === l} onClick={() => patchSelected({ layout: l, ...clampRect({ x: selected.x, y: selected.y, ...LAYOUT_SIZES[l] }) })} className={`rounded-md py-1.5 text-xs font-medium capitalize ${selected.layout === l ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Theme</p>
                <div className="flex gap-2">
                  {(Object.keys(FOCAL_THEMES) as FocalTheme[]).map((t) => (
                    <button key={t} type="button" onClick={() => patchSelected({ theme: t })} aria-pressed={selected.theme === t} title={FOCAL_THEMES[t].label} className={`h-9 w-9 rounded-lg border-2 ${selected.theme === t ? 'border-zinc-900' : 'border-zinc-200'}`} style={{ background: `linear-gradient(135deg, ${FOCAL_THEMES[t].bg} 50%, ${FOCAL_THEMES[t].price} 50%)` }}>
                      <span className="sr-only">{FOCAL_THEMES[t].label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <label className="flex items-center justify-between text-sm text-zinc-800">
                  QR code (product code)
                  <input type="checkbox" checked={selected.showQr} onChange={(e) => patchSelected({ showQr: e.target.checked })} className="h-4 w-4 accent-zinc-900" />
                </label>
                <label className="flex items-center justify-between text-sm text-zinc-800">
                  Box price
                  <input type="checkbox" checked={selected.showBox} onChange={(e) => patchSelected({ showBox: e.target.checked })} className="h-4 w-4 accent-zinc-900" />
                </label>
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Position (mm on A4)</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['x', 'y', 'w', 'h'] as const).map((k) => {
                    const full = k === 'x' || k === 'w' ? 210 : 297;
                    return (
                      <label key={k} className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2 py-1 text-xs text-zinc-500">
                        <span className="w-3 uppercase">{k}</span>
                        <input
                          type="number"
                          value={Math.round(selected[k] * full)}
                          onChange={(e) => patchSelected(clampRect({ x: selected.x, y: selected.y, w: selected.w, h: selected.h, [k]: Number(e.target.value) / full }))}
                          className="w-full bg-transparent text-sm text-zinc-900 focus:outline-none"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <button type="button" onClick={() => commit((cur) => cur.map((f) => ({ ...f, layout: selected.layout, theme: selected.theme, showQr: selected.showQr, showBox: selected.showBox, w: selected.w, h: selected.h })))} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50">
                  Apply this style to all focals
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => duplicate(selected.id)} className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50">
                    <Icon name="copy" /> Duplicate
                  </button>
                  <button type="button" onClick={() => remove(selected.id)} className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50">
                    <Icon name="trash" /> Remove
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm text-zinc-600">
              <p className="font-semibold text-zinc-900">Nothing selected</p>
              <p>Click a focal on the flyer to edit it, or search for a product on the left to place a new one.</p>
              <p className="text-xs text-zinc-500">Positions are stored as fractions of the page, so the same focals print correctly at any size.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
