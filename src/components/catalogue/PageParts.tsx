'use client';

import { memo, type CSSProperties } from 'react';
import type { Product } from '@/lib/data/seed';
import type { Focal, Flyer } from '@/lib/data/flyers';
import { formatPrice } from '@/lib/data/flyers';
import { GAP_MM, SUBHEAD_GAP_MM, SUBHEAD_MM, BLOCK_GAP_MM, pageAnchor, type ProductPage, type TocEntry } from '@/lib/catalogue/layout';
import { BAND_TONES, type ExportSettings } from '@/lib/catalogue/settings';
import { QrCode } from '@/components/ui/QrCode';
import { BrandMark } from '@/components/ui/BrandMark';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import type { CategoryIcon as IconKey } from '@/lib/data/seed';
import { QueuedPhoto } from './QueuedPhoto';
import { FocalView } from '@/components/flyers/FocalView';

type Tones = readonly [string, string, string];

export function tonesFor(settings: ExportSettings, categoryIndex: number): Tones {
  return settings.bands.colorCycle ? BAND_TONES[categoryIndex % BAND_TONES.length] : BAND_TONES[0];
}

/** Header/footer band: a solid body that opens into two lighter waves towards the page. */
export function Band({ kind, heightMm, tones, children }: { kind: 'header' | 'footer'; heightMm: number; tones: Tones; children?: React.ReactNode }) {
  const h = heightMm;
  const waves =
    kind === 'header'
      ? [
          `M0 0H210V${h * 0.94}C170 ${h * 1.02} 130 ${h * 0.78} 90 ${h * 0.86}S20 ${h * 1.0} 0 ${h * 0.93}Z`,
          `M0 0H210V${h * 0.8}C165 ${h * 0.72} 125 ${h * 0.97} 75 ${h * 0.88}S18 ${h * 0.84} 0 ${h * 0.9}Z`,
          `M0 0H210V${h * 0.66}C150 ${h * 0.74} 95 ${h * 0.64} 50 ${h * 0.76}S10 ${h * 0.86} 0 ${h * 0.84}Z`,
        ]
      : [
          `M0 ${h}H210V${h * 0.06}C170 ${-h * 0.02} 130 ${h * 0.22} 90 ${h * 0.14}S20 ${0} 0 ${h * 0.07}Z`,
          `M0 ${h}H210V${h * 0.2}C165 ${h * 0.28} 125 ${h * 0.03} 75 ${h * 0.12}S18 ${h * 0.16} 0 ${h * 0.1}Z`,
          `M0 ${h}H210V${h * 0.34}C150 ${h * 0.26} 95 ${h * 0.36} 50 ${h * 0.24}S10 ${h * 0.14} 0 ${h * 0.16}Z`,
        ];
  return (
    <div className="absolute inset-x-0" style={{ [kind === 'header' ? 'top' : 'bottom']: 0, height: `${h}mm` }}>
      <svg viewBox={`0 0 210 ${h}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        <path d={waves[0]} fill={tones[2]} />
        <path d={waves[1]} fill={tones[1]} />
        <path d={waves[2]} fill={tones[0]} />
      </svg>
      <div className="relative h-full">{children}</div>
    </div>
  );
}

function Flag({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className="rounded-full px-[1.6mm] py-[0.3mm] text-[5pt] font-bold uppercase tracking-wide text-white" style={{ background: color }}>
      {children}
    </span>
  );
}

const FLAG_COLORS = { new: '#2563eb', promo: '#dc2626', vegan: '#16a34a', organic: '#a16207' } as const;

function etaLabel(iso: string) {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/** Memoised: changing a band or a slider re-renders pages, but not every card. */
export const ProductCard = memo(function ProductCard({
  product,
  cards,
  urgent,
}: {
  product: Product;
  cards: ExportSettings['cards'];
  urgent: boolean;
}) {
  const comingSoon = cards.showEta && product.status === 'coming-soon' && product.eta;
  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[1.4mm] border border-zinc-200 bg-white p-[1.4mm]">
      <div className="relative flex min-h-0 flex-1 items-center justify-center">
        <QueuedPhoto sku={product.sku} alt={product.title} urgent={urgent} className="max-h-full max-w-full object-contain" />
        {cards.showQr ? (
          <div className="absolute bottom-0 right-0 h-[11mm] w-[11mm] bg-white p-[0.3mm]">
            <QrCode value={product.sku} className="h-full w-full" />
          </div>
        ) : null}
      </div>
      {comingSoon ? (
        <div className="pointer-events-none absolute left-[-9mm] top-[3.5mm] w-[32mm] -rotate-45 bg-amber-500 py-[0.4mm] text-center text-[5pt] font-bold uppercase tracking-wider text-white shadow">
          Coming soon
        </div>
      ) : null}
      <p
        className="mt-[1mm] line-clamp-2 shrink-0 font-semibold leading-[1.15] text-zinc-900"
        style={{ fontSize: `${cards.titlePt}pt`, textAlign: cards.titleAlign }}
      >
        {product.title}
      </p>
      <div className="flex shrink-0 items-baseline justify-between gap-1 leading-tight text-zinc-500" style={{ fontSize: `${cards.skuPt}pt` }}>
        <span>{product.sku}</span>
        <span className="truncate">{product.size}</span>
      </div>
      {comingSoon ? (
        <div className="mt-[0.6mm] flex shrink-0 justify-center">
          <span className="rounded-full border border-amber-400 bg-amber-50 px-[1.6mm] text-[5pt] font-bold text-amber-700">
            Due {etaLabel(product.eta!)}
          </span>
        </div>
      ) : cards.showFlags && product.flags.length > 0 ? (
        <div className="mt-[0.6mm] flex shrink-0 justify-center gap-[0.8mm]">
          {product.flags.map((f) => (
            <Flag key={f} color={FLAG_COLORS[f]}>
              {f}
            </Flag>
          ))}
        </div>
      ) : null}
      {cards.showEach || cards.showBox ? (
        <div className="mt-[0.8mm] flex shrink-0 gap-[1mm]">
          {cards.showBox ? <PriceBox label="Box" value={product.boxPrice} /> : null}
          {cards.showEach ? <PriceBox label="Each" value={product.eachPrice} strong /> : null}
        </div>
      ) : null}
    </div>
  );
});

function PriceBox({ label, value, strong }: { label: string; value: number | null; strong?: boolean }) {
  return (
    <div className={`flex min-w-0 flex-1 flex-col items-center rounded-[0.8mm] border px-[0.6mm] py-[0.3mm] leading-tight ${strong ? 'border-zinc-800' : 'border-zinc-300'}`}>
      <span className="text-[4.5pt] font-semibold uppercase tracking-wide text-zinc-500">{label}</span>
      <span className="text-[8pt] font-bold text-zinc-900">{formatPrice(value)}</span>
    </div>
  );
}

function PageFooter({ settings, number, tones }: { settings: ExportSettings; number: number; tones: Tones }) {
  return (
    <Band kind="footer" heightMm={settings.bands.footerMm} tones={tones}>
      <div className="flex h-full items-end justify-between px-[8mm] pb-[2.2mm] text-[6.5pt] font-medium text-white">
        <span>{settings.bands.contact}</span>
        {settings.bands.pageNumbers ? <span className="text-[8pt] font-bold">{number}</span> : null}
      </div>
    </Band>
  );
}

export const ProductPageView = memo(function ProductPageView({
  page,
  number,
  settings,
  tones,
  grid,
  urgent,
}: {
  page: ProductPage<Product>;
  number: number;
  settings: ExportSettings;
  tones: Tones;
  grid: { cols: number; cardW: number; edge: number };
  urgent: boolean;
}) {
  const { headerMm } = settings.bands;
  const first = page.blocks[0];
  const gridStyle = (rows: number): CSSProperties => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${grid.cols}, ${grid.cardW}mm)`,
    gridAutoRows: `${page.cardH}mm`,
    gap: `${GAP_MM}mm`,
    minHeight: rows > 0 ? undefined : 0,
  });
  return (
    <>
      <Band kind="header" heightMm={headerMm} tones={tones}>
        <div className="flex h-full items-start justify-between px-[8mm] pt-[2.6mm] text-white">
          <span className="flex items-center gap-[2mm]">
            <BrandMark size={Math.round(headerMm * 1.5)} />
            <span className="font-serif text-[10pt] font-bold drop-shadow-sm">{settings.bands.title}</span>
          </span>
          <span className="text-right leading-tight drop-shadow-sm">
            <span className="block text-[13pt] font-extrabold uppercase tracking-wide">{page.categoryLabel}</span>
            {!page.dividers ? <span className="block text-[7.5pt] font-medium opacity-95">{first.subcategoryLabel}{first.continued ? ' (continued)' : ''}</span> : null}
          </span>
        </div>
      </Band>
      <div className="absolute" style={{ top: `${headerMm + grid.edge}mm`, left: `${grid.edge}mm` }}>
        {page.flow ? (
          <div style={gridStyle(1)}>
            {page.blocks.flatMap((b) => b.products).map((p) => (
              <ProductCard key={p.sku} product={p} cards={settings.cards} urgent={urgent} />
            ))}
          </div>
        ) : (
          page.blocks.map((b, i) => (
            <div key={`${b.subcategoryId}-${i}`} style={{ marginTop: i > 0 ? `${page.dividers ? BLOCK_GAP_MM : GAP_MM}mm` : 0 }}>
              {page.dividers ? (
                <div
                  className="flex items-center justify-between rounded-[1.2mm] px-[3mm] text-[8pt] font-bold uppercase tracking-wide text-white"
                  style={{ height: `${SUBHEAD_MM}mm`, marginBottom: `${SUBHEAD_GAP_MM}mm`, background: tones[0] }}
                  id={b.continued ? undefined : `sub-${b.subcategoryId}`}
                >
                  <span>{b.subcategoryLabel}</span>
                  {b.continued ? <span className="text-[6pt] font-semibold normal-case opacity-90">continued</span> : null}
                </div>
              ) : null}
              <div style={gridStyle(1)}>
                {b.products.map((p) => (
                  <ProductCard key={p.sku} product={p} cards={settings.cards} urgent={urgent} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      <PageFooter settings={settings} number={number} tones={tones} />
    </>
  );
});

export function ContentsPage({
  toc,
  settings,
  number,
  icons,
}: {
  toc: TocEntry[];
  settings: ExportSettings;
  number: number;
  icons: Record<number, IconKey>;
}) {
  const tones = BAND_TONES[0];
  return (
    <>
      <Band kind="header" heightMm={34} tones={tones}>
        <div className="flex h-full items-start justify-between px-[12mm] pt-[7mm] text-white">
          <span className="font-serif text-[30pt] font-bold leading-none drop-shadow-sm">Contents</span>
          <BrandMark size={52} />
        </div>
      </Band>
      <div className="absolute inset-x-[14mm] top-[42mm] columns-2 gap-[10mm]">
        {toc.map((c, i) => (
          <div key={c.categoryId} className="mb-[4mm] break-inside-avoid">
            <a href={`#${pageAnchor(c.page)}`} className="flex items-center gap-[2mm] text-[10.5pt] font-bold text-zinc-900 no-underline">
              <span className="flex h-[6.5mm] w-[6.5mm] shrink-0 items-center justify-center rounded-full text-white" style={{ background: tonesFor(settings, i)[0] }}>
                <CategoryIcon name={icons[c.categoryId] ?? 'home'} className="h-[4mm] w-[4mm]" strokeWidth={2} />
              </span>
              <span className="truncate">{c.label}</span>
              <span className="mx-[1mm] flex-1 border-b border-dotted border-zinc-400" />
              <span>{c.page}</span>
            </a>
            {settings.contents.subcategories ? (
              <ul className="ml-[8.5mm] mt-[0.8mm] space-y-[0.4mm]">
                {c.subcategories.map((s) => (
                  <li key={s.subcategoryId}>
                    <a href={`#${pageAnchor(s.page)}`} className="flex items-baseline text-[8pt] text-zinc-600 no-underline">
                      <span className="truncate">{s.label}</span>
                      <span className="mx-[1mm] flex-1 border-b border-dotted border-zinc-300" />
                      <span>{s.page}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
      <PageFooter settings={settings} number={number} tones={tones} />
    </>
  );
}

export function CategoryCoverPage({
  label,
  icon,
  subcategories,
  tones,
}: {
  label: string;
  icon: IconKey;
  subcategories: string[];
  tones: Tones;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: `linear-gradient(160deg, ${tones[2]}, ${tones[1]} 55%, ${tones[0]})` }}>
      <div className="absolute inset-[10mm] rounded-[4mm] border border-white/70" />
      <div className="flex h-[70mm] w-[70mm] items-center justify-center rounded-full bg-white/85 shadow-xl" style={{ color: tones[0] }}>
        <CategoryIcon name={icon} className="h-[38mm] w-[38mm]" strokeWidth={1.2} />
      </div>
      <h2 className="mt-[14mm] font-serif text-[40pt] font-bold text-white drop-shadow">{label}</h2>
      <p className="mt-[4mm] max-w-[150mm] text-center text-[10pt] uppercase tracking-[0.25em] text-white/95">{subcategories.join(' · ')}</p>
      <div className="absolute bottom-[18mm] flex items-center gap-[2mm] text-white/90">
        <BrandMark size={28} />
        <span className="font-serif text-[11pt] font-bold">Harbourline Wholesale</span>
      </div>
    </div>
  );
}

export function FlyerPage({ flyer, focals }: { flyer: Flyer; focals: Focal[] }) {
  return (
    <div className="absolute inset-0" style={{ containerType: 'inline-size' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/api/flyers/${flyer.id}/art`} alt={flyer.title} className="absolute inset-0 h-full w-full object-cover" data-flyer-art />
      {focals.map((f) => (
        <FocalView key={f.id} focal={f} />
      ))}
    </div>
  );
}
