import { memo } from 'react';
import type { Focal, FocalTheme } from '@/lib/data/flyers';
import { formatPrice } from '@/lib/data/flyers';
import { QrCode } from '@/components/ui/QrCode';
import { photoUrl } from '@/lib/photo-queue';

export const FOCAL_THEMES: Record<FocalTheme, { label: string; bg: string; fg: string; sub: string; price: string; priceFg: string; border: string }> = {
  paper: { label: 'Paper', bg: '#ffffff', fg: '#111827', sub: '#6b7280', price: '#173a5e', priceFg: '#ffffff', border: '#e5e7eb' },
  ink: { label: 'Ink', bg: '#111827', fg: '#ffffff', sub: '#cbd5e1', price: '#e9b44c', priceFg: '#111827', border: '#111827' },
  sale: { label: 'Sale', bg: '#fff7ed', fg: '#7c2d12', sub: '#9a3412', price: '#dc2626', priceFg: '#ffffff', border: '#fdba74' },
  fresh: { label: 'Fresh', bg: '#ecfdf5', fg: '#064e3b', sub: '#047857', price: '#059669', priceFg: '#ffffff', border: '#6ee7b7' },
};

/**
 * One focal drawn on a flyer. The parent sets `container-type: inline-size`,
 * so all sizes are in `cqw` (percent of the flyer's width) and the focal looks
 * the same in the editor, the export preview and the printed page.
 */
export const FocalView = memo(function FocalView({ focal, warning }: { focal: Focal; warning?: boolean }) {
  const t = FOCAL_THEMES[focal.theme];
  // Scale text with the box so resizing a focal resizes its contents.
  const k = focal.layout === 'row' ? Math.min(focal.h * 145, focal.w * 22) : focal.layout === 'badge' ? Math.min(focal.h * 100, focal.w * 55) : Math.min(focal.h * 100, focal.w * 40);
  const fs = (n: number) => `${(n * k) / 10}cqw`;
  const box = {
    left: `${focal.x * 100}%`,
    top: `${focal.y * 100}%`,
    width: `${focal.w * 100}%`,
    height: `${focal.h * 100}%`,
    background: t.bg,
    color: t.fg,
    borderColor: t.border,
  } as const;

  const prices = (
    <div className="flex items-end gap-[0.8cqw]">
      <div className="rounded-[0.7cqw] px-[1cqw] py-[0.4cqw] leading-none" style={{ background: t.price, color: t.priceFg }}>
        <span className="block font-semibold uppercase opacity-80" style={{ fontSize: fs(0.6) }}>Each</span>
        <span className="block font-extrabold tracking-tight" style={{ fontSize: fs(1.8) }}>{formatPrice(focal.eachPrice)}</span>
      </div>
      {focal.showBox && focal.boxPrice != null ? (
        <div className="leading-none" style={{ color: t.sub }}>
          <span className="block font-semibold uppercase" style={{ fontSize: fs(0.6) }}>Box</span>
          <span className="block font-bold" style={{ fontSize: fs(0.95) }}>{formatPrice(focal.boxPrice)}</span>
        </div>
      ) : null}
    </div>
  );
  // eslint-disable-next-line @next/next/no-img-element
  const photo = <img src={photoUrl(focal.sku)} alt="" className="h-full w-full object-contain" draggable={false} />;

  const qr = focal.showQr ? <QrCode value={focal.sku} className="h-full w-auto shrink-0" /> : null;

  return (
    <div className="absolute overflow-hidden rounded-[1.2cqw] border shadow-[0_0.4cqw_1.2cqw_rgba(0,0,0,0.18)]" style={box}>
      {warning ? (
        <span className="absolute left-[0.6cqw] top-[0.6cqw] z-10 rounded-full bg-rose-600 px-[0.8cqw] py-[0.2cqw] font-bold uppercase text-white" style={{ fontSize: fs(0.45) }}>
          Not for sale
        </span>
      ) : null}
      {focal.layout === 'row' ? (
        <div className="flex h-full items-center gap-[1.2cqw] p-[1cqw]">
          <div className="aspect-square h-full shrink-0 overflow-hidden rounded-[0.6cqw] bg-white">{photo}</div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="line-clamp-2 font-bold" style={{ fontSize: fs(1.25) }}>{focal.title}</p>
            <p style={{ fontSize: fs(0.8), color: t.sub }}>
              {focal.sku} · {focal.size}
            </p>
          </div>
          {prices}
          {focal.showQr ? <div className="aspect-square h-[80%] shrink-0">{qr}</div> : null}
        </div>
      ) : focal.layout === 'badge' ? (
        <div className="flex h-full flex-col items-center justify-center gap-[0.4cqw] p-[1cqw] text-center">
          <div className="h-[38%] aspect-square">{photo}</div>
          <p className="line-clamp-2 font-bold leading-tight" style={{ fontSize: fs(0.95) }}>{focal.title}</p>
          <p className="font-black leading-none" style={{ fontSize: fs(2.4), color: t.price }}>{formatPrice(focal.eachPrice)}</p>
          <p style={{ fontSize: fs(0.6), color: t.sub }}>{focal.size} · {focal.sku}</p>
        </div>
      ) : (
        <div className="flex h-full gap-[1cqw] p-[1cqw]">
          <div className="relative aspect-square h-full shrink-0 overflow-hidden rounded-[0.8cqw] bg-white">
            {photo}
            {focal.showQr ? <div className="absolute bottom-0 right-0 aspect-square h-[34%] bg-white p-[0.2cqw]">{qr}</div> : null}
          </div>
          <div className="relative flex min-w-0 flex-1 flex-col justify-between">
            <div className="pr-[0.5cqw] leading-tight">
              <p className="line-clamp-2 font-bold" style={{ fontSize: fs(1.15) }}>{focal.title}</p>
              <p style={{ fontSize: fs(0.75), color: t.sub }}>{focal.size}</p>
            </div>
            {prices}
          </div>
        </div>
      )}
    </div>
  );
});
