'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Category, Product } from '@/lib/data/seed';
import type { Flyer, Focal } from '@/lib/data/flyers';
import {
  GRID_OPTIONS,
  buildSequence,
  buildToc,
  gridFor,
  packPages,
  pageAnchor,
  type GridKey,
  type PageEntry,
  type Section,
} from '@/lib/catalogue/layout';
import { COVER_DESIGNS, DEFAULT_SETTINGS, PAGE_FONTS, parseSettings, type ExportSettings } from '@/lib/catalogue/settings';
import { photoQueue, photoUrl, type PhotoReport } from '@/lib/photo-queue';
import { COVER_COMPONENTS } from './Covers';
import { Band, CategoryCoverPage, ContentsPage, FlyerPage, ProductPageView, tonesFor } from './PageParts';
import { Hint, SidebarGroup, SidebarSection, Slider, Toggle, selectClass } from './Sidebar';
import { PageNavigator } from './PageNavigator';
import { Modal } from '@/components/ui/Modal';
import { Icon } from '@/components/ui/Icon';

type Props = {
  catalogue: { id: string; name: string };
  categories: Category[];
  flyers: Array<{ flyer: Flyer; focals: Focal[] }>;
};

type SectionKey = 'cover' | 'layout' | 'contents' | 'products' | 'card' | 'extras';
const DEFAULT_OPEN: Record<SectionKey, boolean> = { cover: true, layout: true, contents: false, products: false, card: false, extras: false };
const OPEN_KEY = 'export-sidebar-open';

function readLocal<T>(key: string, fallback: T, parse: (raw: unknown) => T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? parse(JSON.parse(raw)) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: settings simply are not remembered */
  }
}

const A4_PX_W = 793.7; // 210 mm at 96 dpi
const A4_PX_H = 1122.5;

type PrintState =
  | { step: 'photos'; done: number; total: number }
  | { step: 'report'; report: PhotoReport }
  | { step: 'printing' };

export function ExportClient({ catalogue, categories, flyers }: Props) {
  const settingsKey = `export-settings-${catalogue.id}`;
  const [settings, setSettings] = useState<ExportSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [open, setOpen] = useState(DEFAULT_OPEN);
  const [current, setCurrent] = useState(0);
  const [bandEditor, setBandEditor] = useState(false);
  const [print, setPrint] = useState<PrintState | null>(null);

  // Settings live in localStorage, so read them after mount (no hydration mismatch).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-off sync from localStorage after mount
    setSettings(readLocal(settingsKey, DEFAULT_SETTINGS, parseSettings));
    setOpen(readLocal(OPEN_KEY, DEFAULT_OPEN, (raw) => ({ ...DEFAULT_OPEN, ...(raw as Partial<typeof DEFAULT_OPEN>) })));
    setLoaded(true);
  }, [settingsKey]);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      writeLocal(settingsKey, settings);
      setSavedAt(Date.now());
    }, 400);
    return () => clearTimeout(t);
  }, [settings, loaded, settingsKey]);

  const update = useCallback(<K extends Exclude<keyof ExportSettings, 'version'>>(key: K, patch: Partial<ExportSettings[K]>) => {
    setSettings((s) => ({ ...s, [key]: { ...(s[key] as object), ...patch } }));
  }, []);

  const toggleSection = (k: SectionKey) =>
    setOpen((o) => {
      const next = { ...o, [k]: !o[k] };
      writeLocal(OPEN_KEY, next);
      return next;
    });

  // ── Layout pipeline (pure functions from lib/catalogue/layout) ─────────
  const c = settings.cards;
  const sections = useMemo<Section<Product>[]>(() => {
    const keep = (p: Product) =>
      !(c.hideDiscontinued && p.status === 'discontinued') && !(c.hideNoPhoto && p.photo !== 'ok') && !(c.hideNoPrice && p.eachPrice == null);
    return categories.flatMap((cat) =>
      cat.subcategories.map((s) => ({
        categoryId: cat.id,
        categoryLabel: cat.label,
        subcategoryId: s.id,
        subcategoryLabel: s.label,
        products: s.products.filter(keep),
      }))
    );
  }, [categories, c.hideDiscontinued, c.hideNoPhoto, c.hideNoPrice]);

  const grid = useMemo(() => gridFor(settings.layout.grid as GridKey, settings.bands), [settings.layout.grid, settings.bands]);
  const pages = useMemo(() => packPages(sections, grid, settings.layout), [sections, grid, settings.layout]);
  const flyerIds = useMemo(() => (settings.extras.flyers ? flyers.map((f) => f.flyer.id) : []), [flyers, settings.extras.flyers]);
  const sequence = useMemo(
    () =>
      buildSequence(pages, {
        cover: settings.cover.enabled,
        contents: settings.contents.enabled,
        flyerIds,
        categoryCovers: settings.extras.categoryCovers,
      }),
    [pages, settings.cover.enabled, settings.contents.enabled, flyerIds, settings.extras.categoryCovers]
  );
  const toc = useMemo(() => buildToc(sequence), [sequence]);
  const productCount = useMemo(() => sections.reduce((n, s) => n + s.products.length, 0), [sections]);
  const catIndex = useMemo(() => new Map(categories.map((cat, i) => [cat.id, i])), [categories]);
  const iconOf = useMemo(() => Object.fromEntries(categories.map((cat) => [cat.id, cat.icon])), [categories]);
  const subsOf = useMemo(() => new Map(categories.map((cat) => [cat.id, cat.subcategories.map((s) => s.label)])), [categories]);
  const flyerById = useMemo(() => new Map(flyers.map((f) => [f.flyer.id, f])), [flyers]);

  const safeCurrent = Math.min(current, sequence.length - 1);

  // ←/→ flip pages (not while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, select, textarea, [role=dialog]')) return;
      if (e.key === 'ArrowRight') setCurrent((n) => Math.min(n + 1, sequence.length - 1));
      if (e.key === 'ArrowLeft') setCurrent((n) => Math.max(Math.min(n, sequence.length - 1) - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sequence.length]);

  // Fit the preview page into the space available.
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScale(Math.max(0.25, Math.min((width - 48) / A4_PX_W, (height - 48) / A4_PX_H, 1.1)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const dateLabel = useMemo(
    () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    []
  );
  const coverProps = useMemo(
    () => ({ icons: categories.map((cat) => cat.icon), categories: categories.map((cat) => cat.label), dateLabel }),
    [categories, dateLabel]
  );

  // ── Save as PDF: load every photo first, report problems, then print ──
  const allPhotoUrls = useMemo(() => pages.flatMap((p) => p.blocks.flatMap((b) => b.products.map((pr) => photoUrl(pr.sku)))), [pages]);

  const startPrint = async () => {
    setPrint({ step: 'photos', done: 0, total: allPhotoUrls.length });
    await photoQueue.settle(allPhotoUrls, (done, total) => setPrint({ step: 'photos', done, total }));
    const report = photoQueue.report(allPhotoUrls, (u) => decodeURIComponent(u.split('/').pop()!));
    if (report.failed.length > 0 || report.missing.length > 0) setPrint({ step: 'report', report });
    else doPrint();
  };

  const doPrint = async () => {
    setPrint({ step: 'printing' });
    await document.fonts.ready;
    await new Promise((r) => setTimeout(r, 300));
    window.print();
  };

  useEffect(() => {
    const done = () => setPrint((p) => (p?.step === 'printing' ? null : p));
    window.addEventListener('afterprint', done);
    return () => window.removeEventListener('afterprint', done);
  }, []);

  const retryFailed = async (report: PhotoReport) => {
    const urls = report.failed.map(photoUrl);
    photoQueue.retryFailed(urls);
    setPrint({ step: 'photos', done: 0, total: urls.length });
    await photoQueue.settle(urls);
    const next = photoQueue.report(allPhotoUrls, (u) => decodeURIComponent(u.split('/').pop()!));
    setPrint({ step: 'report', report: next });
  };

  const fontCss = PAGE_FONTS.find((f) => f.key === settings.cover.font)?.css;
  const cardsOn = [c.showQr, c.showEach, c.showBox, c.showFlags, c.showEta].filter(Boolean).length;
  const filtersOn = [c.hideDiscontinued, c.hideNoPhoto, c.hideNoPrice].filter(Boolean).length;
  const gridLabel = GRID_OPTIONS.find((g) => g.key === settings.layout.grid)?.label.split(' (')[0];

  const renderPage = (entry: PageEntry<Product>, urgent: boolean) => (
    <PageContent
      entry={entry}
      settings={settings}
      grid={grid}
      urgent={urgent}
      toc={toc}
      iconOf={iconOf}
      catIndex={catIndex}
      subsOf={subsOf}
      flyerById={flyerById}
      coverProps={coverProps}
    />
  );

  const entry = sequence[safeCurrent];

  return (
    <>
      <div className="flex h-[calc(100vh-7.6rem)] min-h-[560px] print:hidden">
        {/* ── Settings sidebar ─────────────────────────────── */}
        <aside className="flex w-80 shrink-0 flex-col border-r border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 px-4 py-3">
            <h1 className="text-base font-semibold text-zinc-900">Export settings</h1>
            <p className="text-xs text-zinc-500">
              {productCount.toLocaleString('en-GB')} products · {sequence.length} pages
            </p>
          </div>
          <div className="thin-scroll flex-1 overflow-y-auto">
            <SidebarSection icon="cover" title="Cover & branding" summary={`${settings.cover.enabled ? COVER_DESIGNS.find((d) => d.key === settings.cover.design)?.label : 'No cover'} · ${PAGE_FONTS.find((f) => f.key === settings.cover.font)?.label}`} open={open.cover} onToggle={() => toggleSection('cover')}>
              <Toggle label="Cover page" checked={settings.cover.enabled} onChange={(v) => update('cover', { enabled: v })} />
              <SidebarGroup label="Cover design">
                <div className="grid grid-cols-3 gap-2">
                  {COVER_DESIGNS.map((d) => {
                    const Cover = COVER_COMPONENTS[d.key];
                    const active = settings.cover.design === d.key;
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => {
                          update('cover', { design: d.key, enabled: true });
                          setCurrent(0);
                        }}
                        aria-pressed={active}
                        title={d.label}
                        className={`relative aspect-[210/297] overflow-hidden rounded-md border-2 transition ${active ? 'border-zinc-900 ring-2 ring-zinc-900/20' : 'border-transparent hover:border-zinc-300'}`}
                      >
                        <Cover {...coverProps} />
                      </button>
                    );
                  })}
                </div>
                <Hint>Dated with the export day.</Hint>
              </SidebarGroup>
              <SidebarGroup label="Font">
                <select className={selectClass} value={settings.cover.font} onChange={(e) => update('cover', { font: e.target.value as ExportSettings['cover']['font'] })}>
                  {PAGE_FONTS.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <Hint>Applies to cards, headers and footers.</Hint>
              </SidebarGroup>
              <SidebarGroup label="Header & footer">
                <button type="button" onClick={() => setBandEditor(true)} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50">
                  Edit header & footer
                </button>
              </SidebarGroup>
            </SidebarSection>

            <SidebarSection icon="layout" title="Page layout" summary={`${gridLabel} grid · ${settings.layout.pack ? 'subcategories share pages' : 'one subcategory per page'}`} open={open.layout} onToggle={() => toggleSection('layout')}>
              <SidebarGroup label="Grid">
                <select className={selectClass} value={settings.layout.grid} onChange={(e) => update('layout', { grid: e.target.value as GridKey })}>
                  {GRID_OPTIONS.map((g) => (
                    <option key={g.key} value={g.key}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </SidebarGroup>
              <SidebarGroup label="Subcategories">
                <Toggle label="Small subcategories share a page" checked={settings.layout.pack} onChange={(v) => update('layout', { pack: v })} />
                <Toggle nested label="New row for each subcategory" checked={settings.layout.newRow} disabled={!settings.layout.pack} onChange={(v) => update('layout', { newRow: v })} />
                <Toggle nested label="Subcategory dividers" checked={settings.layout.dividers} disabled={settings.layout.pack && !settings.layout.newRow} onChange={(v) => update('layout', { dividers: v })} />
              </SidebarGroup>
              <Slider label="Gap to paper edge" value={settings.bands.edgeMm} min={0} max={10} unit=" mm" onChange={(v) => update('bands', { edgeMm: v })} />
              <Hint>
                Card size: {grid.cardW} × {grid.cardH} mm. Cards on shared pages may shrink to make room for dividers, never below 85%.
              </Hint>
            </SidebarSection>

            <SidebarSection icon="list" title="Contents page" summary={settings.contents.enabled ? `Page ${settings.cover.enabled ? 2 : 1}${settings.contents.subcategories ? ' · with subcategories' : ''}` : 'Off'} open={open.contents} onToggle={() => toggleSection('contents')}>
              <Toggle label="Contents page" checked={settings.contents.enabled} onChange={(v) => update('contents', { enabled: v })} />
              <Toggle nested label="List subcategories" checked={settings.contents.subcategories} disabled={!settings.contents.enabled} onChange={(v) => update('contents', { subcategories: v })} />
              <Hint>Page numbers come from the final page order, and every entry links to its page in the PDF.</Hint>
            </SidebarSection>

            <SidebarSection icon="box" title="Products" summary={`${cardsOn} card details on · ${filtersOn} filter${filtersOn === 1 ? '' : 's'}`} open={open.products} onToggle={() => toggleSection('products')}>
              <SidebarGroup label="Show on cards">
                <Toggle label="QR code" checked={c.showQr} onChange={(v) => update('cards', { showQr: v })} />
                <Toggle label="Each price" checked={c.showEach} onChange={(v) => update('cards', { showEach: v })} />
                <Toggle label="Box price" checked={c.showBox} onChange={(v) => update('cards', { showBox: v })} />
                <Toggle label="Flags (new, promo, vegan…)" checked={c.showFlags} onChange={(v) => update('cards', { showFlags: v })} />
                <Toggle label="Coming soon + due date" checked={c.showEta} onChange={(v) => update('cards', { showEta: v })} />
              </SidebarGroup>
              <SidebarGroup label="Filter products">
                <Toggle label="Hide discontinued" checked={c.hideDiscontinued} onChange={(v) => update('cards', { hideDiscontinued: v })} />
                <Toggle label="Hide products without photo" checked={c.hideNoPhoto} onChange={(v) => update('cards', { hideNoPhoto: v })} />
                <Toggle label="Hide products without price" checked={c.hideNoPrice} onChange={(v) => update('cards', { hideNoPrice: v })} />
              </SidebarGroup>
            </SidebarSection>

            <SidebarSection icon="sliders" title="Card design" summary="Text sizes and title alignment" open={open.card} onToggle={() => toggleSection('card')}>
              <Slider label="Title size" value={c.titlePt} min={6} max={11} step={0.5} unit=" pt" onChange={(v) => update('cards', { titlePt: v })} />
              <Slider label="Code & size text" value={c.skuPt} min={5} max={9} step={0.5} unit=" pt" onChange={(v) => update('cards', { skuPt: v })} />
              <SidebarGroup label="Title alignment">
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1">
                  {(['left', 'center'] as const).map((a) => (
                    <button key={a} type="button" aria-pressed={c.titleAlign === a} onClick={() => update('cards', { titleAlign: a })} className={`rounded-md py-1.5 text-sm font-medium capitalize ${c.titleAlign === a ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </SidebarGroup>
            </SidebarSection>

            <SidebarSection icon="pages" title="Extra pages" summary={`${settings.extras.flyers ? `${flyers.length} flyers` : 'No flyers'} · ${settings.extras.categoryCovers ? 'category covers' : 'no category covers'}`} open={open.extras} onToggle={() => toggleSection('extras')}>
              <Toggle label="Flyers after the contents" hint={`${flyers.length} active flyers in this catalogue. Suspended flyers are left out.`} checked={settings.extras.flyers} onChange={(v) => update('extras', { flyers: v })} />
              <Toggle label="Cover page before each category" checked={settings.extras.categoryCovers} onChange={(v) => update('extras', { categoryCovers: v })} />
            </SidebarSection>
          </div>
          <div className="border-t border-zinc-200 bg-white p-4">
            <button type="button" onClick={startPrint} disabled={print != null} className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-60">
              <Icon name="printer" />
              Save as PDF
            </button>
            <p className="mt-2 text-center text-[11px] text-zinc-500" aria-live="polite">
              {savedAt ? 'Settings saved' : ' '}
            </p>
          </div>
        </aside>

        {/* ── Preview ──────────────────────────────────────── */}
        <main className="relative flex min-w-0 flex-1 flex-col bg-zinc-200/70">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-300/60 bg-zinc-100 px-4 py-2 text-sm">
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Previous page" onClick={() => setCurrent((n) => Math.max(Math.min(n, sequence.length - 1) - 1, 0))} disabled={safeCurrent === 0} className="rounded-md p-1.5 text-zinc-700 hover:bg-white disabled:opacity-30">
                <Icon name="left" />
              </button>
              <span className="min-w-28 text-center font-medium tabular-nums text-zinc-800">
                Page {safeCurrent + 1} of {sequence.length}
              </span>
              <button type="button" aria-label="Next page" onClick={() => setCurrent((n) => Math.min(n + 1, sequence.length - 1))} disabled={safeCurrent === sequence.length - 1} className="rounded-md p-1.5 text-zinc-700 hover:bg-white disabled:opacity-30">
                <Icon name="right" />
              </button>
            </div>
            <span className="hidden text-xs text-zinc-500 md:block">← → to flip pages · {Math.round(scale * 100)}%</span>
          </div>
          <div ref={stageRef} className="flex flex-1 items-start justify-center overflow-auto p-6">
            {entry ? (
              <div className="shrink-0 shadow-xl ring-1 ring-black/5" style={{ width: A4_PX_W * scale, height: A4_PX_H * scale }}>
                <div className="a4 origin-top-left" style={{ transform: `scale(${scale})`, fontFamily: fontCss }}>
                  {renderPage(entry, true)}
                </div>
              </div>
            ) : null}
          </div>
        </main>

        <PageNavigator sequence={sequence} current={safeCurrent} onSelect={setCurrent} flyerTitle={(id) => flyerById.get(id)?.flyer.title ?? 'Flyer'} />
      </div>

      {/* ── Print output: every page at real size, only while printing ── */}
      {print ? (
        <div className="hidden print:block" style={{ fontFamily: fontCss }}>
          {sequence.map((e) => (
            <div key={e.number} className="a4" id={pageAnchor(e.number)}>
              {renderPage(e, false)}
            </div>
          ))}
        </div>
      ) : null}

      {print?.step === 'photos' ? (
        <div className="fixed bottom-5 right-5 z-50 w-80 rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl print:hidden" role="status">
          <p className="text-sm font-semibold text-zinc-900">Loading product photos…</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {print.done} of {print.total} · 6 at a time, failed ones retried
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full rounded-full bg-zinc-900 transition-[width]" style={{ width: `${print.total ? (print.done / print.total) * 100 : 0}%` }} />
          </div>
        </div>
      ) : null}

      {print?.step === 'report' ? (
        <Modal
          title="Some photos are not available"
          onClose={() => setPrint(null)}
          footer={
            <>
              <button type="button" onClick={() => setPrint(null)} className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200">
                Cancel
              </button>
              {print.report.failed.length > 0 ? (
                <button type="button" onClick={() => retryFailed(print.report)} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50">
                  Retry failed
                </button>
              ) : null}
              <button type="button" onClick={doPrint} className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
                Print anyway
              </button>
            </>
          }
        >
          <p className="text-sm text-zinc-700">
            {print.report.loaded} of {print.report.loaded + print.report.missing.length + print.report.failed.length} photos are ready. The cards below will print without a photo.
          </p>
          <ReportList title="Missing" hint="These products have no photo yet. Upload one or hide them with “Hide products without photo”." skus={print.report.missing} tone="zinc" />
          <ReportList title="Failed to load" hint="The image host returned an error after 3 attempts. Retrying usually helps." skus={print.report.failed} tone="rose" />
        </Modal>
      ) : null}

      {bandEditor ? (
        <Modal title="Header & footer" wide onClose={() => setBandEditor(false)} footer={<button type="button" onClick={() => setBandEditor(false)} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">Done</button>}>
          <div className="grid gap-6 md:grid-cols-[1fr_220px]">
            <div className="space-y-4">
              <label className="block text-sm">
                <span className="text-zinc-800">Header title</span>
                <input className={`${selectClass} mt-1`} value={settings.bands.title} maxLength={60} onChange={(e) => update('bands', { title: e.target.value })} />
              </label>
              <label className="block text-sm">
                <span className="text-zinc-800">Footer contact line</span>
                <input className={`${selectClass} mt-1`} value={settings.bands.contact} maxLength={90} onChange={(e) => update('bands', { contact: e.target.value })} />
              </label>
              <Slider label="Header height" value={settings.bands.headerMm} min={10} max={34} unit=" mm" onChange={(v) => update('bands', { headerMm: v })} />
              <Slider label="Footer height" value={settings.bands.footerMm} min={6} max={24} unit=" mm" onChange={(v) => update('bands', { footerMm: v })} />
              <Toggle label="Page numbers in the footer" checked={settings.bands.pageNumbers} onChange={(v) => update('bands', { pageNumbers: v })} />
              <Toggle label="New band colour for each category" checked={settings.bands.colorCycle} onChange={(v) => update('bands', { colorCycle: v })} />
              <Hint>The card grid takes whatever height the bands leave: {grid.areaH} mm now, cards {grid.cardH} mm tall.</Hint>
            </div>
            <div className="rounded-lg bg-zinc-100 p-3">
              <div className="relative mx-auto overflow-hidden bg-white shadow" style={{ width: 196, height: 277 }}>
                <div className="a4 origin-top-left" style={{ transform: `scale(${196 / A4_PX_W})` }}>
                  <Band kind="header" heightMm={settings.bands.headerMm} tones={tonesFor(settings, 0)} />
                  <div className="absolute grid grid-cols-3 gap-[2mm]" style={{ top: `${settings.bands.headerMm + settings.bands.edgeMm}mm`, left: `${settings.bands.edgeMm}mm`, right: `${settings.bands.edgeMm}mm`, bottom: `${settings.bands.footerMm + settings.bands.edgeMm}mm` }}>
                    {Array.from({ length: grid.cols * grid.rows }, (_, i) => (
                      <div key={i} className="rounded-[1.4mm] border border-zinc-200 bg-zinc-50" />
                    ))}
                  </div>
                  <Band kind="footer" heightMm={settings.bands.footerMm} tones={tonesFor(settings, 0)} />
                </div>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

function ReportList({ title, hint, skus, tone }: { title: string; hint: string; skus: string[]; tone: 'zinc' | 'rose' }) {
  if (skus.length === 0) return null;
  return (
    <div className="mt-4">
      <p className={`text-sm font-semibold ${tone === 'rose' ? 'text-rose-700' : 'text-zinc-900'}`}>
        {title} ({skus.length})
      </p>
      <p className="text-xs text-zinc-500">{hint}</p>
      <div className="mt-2 flex max-h-28 flex-wrap gap-1 overflow-y-auto">
        {skus.map((s) => (
          <span key={s} className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${tone === 'rose' ? 'bg-rose-50 text-rose-700' : 'bg-zinc-100 text-zinc-700'}`}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

const PageContent = memo(function PageContent({
  entry,
  settings,
  grid,
  urgent,
  toc,
  iconOf,
  catIndex,
  subsOf,
  flyerById,
  coverProps,
}: {
  entry: PageEntry<Product>;
  settings: ExportSettings;
  grid: ReturnType<typeof gridFor>;
  urgent: boolean;
  toc: ReturnType<typeof buildToc>;
  iconOf: Record<number, Category['icon']>;
  catIndex: Map<number, number>;
  subsOf: Map<number, string[]>;
  flyerById: Map<string, { flyer: Flyer; focals: Focal[] }>;
  coverProps: { icons: Category['icon'][]; categories: string[]; dateLabel: string };
}) {
  switch (entry.kind) {
    case 'cover': {
      const Cover = COVER_COMPONENTS[settings.cover.design];
      return <Cover {...coverProps} />;
    }
    case 'contents':
      return <ContentsPage toc={toc} settings={settings} number={entry.number} icons={iconOf} />;
    case 'flyer': {
      const f = flyerById.get(entry.flyerId);
      return f ? <FlyerPage flyer={f.flyer} focals={f.focals} /> : null;
    }
    case 'category-cover':
      return (
        <CategoryCoverPage
          label={entry.categoryLabel}
          icon={iconOf[entry.categoryId]}
          subcategories={subsOf.get(entry.categoryId) ?? []}
          tones={tonesFor(settings, catIndex.get(entry.categoryId) ?? 0)}
        />
      );
    case 'products':
      return (
        <ProductPageView
          page={entry.page}
          number={entry.number}
          settings={settings}
          tones={tonesFor(settings, catIndex.get(entry.page.categoryId) ?? 0)}
          grid={grid}
          urgent={urgent}
        />
      );
  }
});
