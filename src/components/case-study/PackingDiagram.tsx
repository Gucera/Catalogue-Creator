'use client';

import { useMemo, useState } from 'react';
import { gridFor, packPages, type GridKey, type Section } from '@/lib/catalogue/layout';

/** A made-up category with shelves of very different sizes, the case packing exists for. */
const SHELVES: Array<{ cat: number; label: string; n: number }> = [
  { cat: 1, label: 'Ground Spices', n: 17 },
  { cat: 1, label: 'Whole Spices', n: 5 },
  { cat: 1, label: 'Spice Blends', n: 3 },
  { cat: 1, label: 'Salt & Stock', n: 2 },
  { cat: 1, label: 'Dried Herbs', n: 7 },
  { cat: 2, label: 'Hot Sauces', n: 4 },
  { cat: 2, label: 'Pickles', n: 9 },
];
const COLORS = ['#2b8cc4', '#e9822f', '#7cb342', '#c2457a', '#7b4fb0', '#d9483b', '#2e9e83'];

const SECTIONS: Section<number>[] = SHELVES.map((s, i) => ({
  categoryId: s.cat,
  categoryLabel: s.cat === 1 ? 'Spices' : 'Sauces',
  subcategoryId: i,
  subcategoryLabel: s.label,
  products: Array.from({ length: s.n }, () => i),
}));

function Switch({ label, value, set, disabled }: { label: string; value: boolean; set: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`flex items-center gap-2 text-sm ${disabled ? 'opacity-40' : 'cursor-pointer'}`}>
      <input type="checkbox" className="peer sr-only" checked={value} disabled={disabled} onChange={(e) => set(e.target.checked)} />
      <span aria-hidden className="relative h-5 w-9 rounded-full bg-zinc-600 transition after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-emerald-500 peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-300" />
      {label}
    </label>
  );
}

/** Live miniature of packPages: the same function the export page uses. */
export function PackingDiagram() {
  const [pack, setPack] = useState(true);
  const [newRow, setNewRow] = useState(true);
  const [dividers, setDividers] = useState(true);
  const [gridKey, setGridKey] = useState<GridKey>('3x4');
  const grid = useMemo(() => gridFor(gridKey, { headerMm: 18, footerMm: 10, edgeMm: 6 }), [gridKey]);
  const pages = useMemo(() => packPages(SECTIONS, grid, { pack, newRow, dividers }), [grid, pack, newRow, dividers]);

  const W = 118;
  const scale = W / 210;
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-900 p-5 text-zinc-100 shadow-2xl sm:p-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Switch label="Small shelves share a page" value={pack} set={setPack} />
        <Switch label="New row per shelf" value={newRow} set={setNewRow} disabled={!pack} />
        <Switch label="Dividers" value={dividers} set={setDividers} disabled={pack && !newRow} />
        <label className="flex items-center gap-2 text-sm">
          Grid
          <select value={gridKey} onChange={(e) => setGridKey(e.target.value as GridKey)} className="rounded-md border border-white/15 bg-zinc-800 px-2 py-1 text-sm">
            {(['3x3', '3x4', '4x4'] as GridKey[]).map((k) => (
              <option key={k} value={k}>
                {k.replace('x', ' × ')}
              </option>
            ))}
          </select>
        </label>
        <span className="ml-auto rounded-full bg-white/10 px-3 py-1 text-sm font-semibold tabular-nums">
          {pages.length} pages
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {pages.map((p, pi) => (
          <figure key={pi} className="relative shrink-0 overflow-hidden rounded-sm bg-white shadow-lg" style={{ width: W, height: W * (297 / 210) }}>
            <div className="absolute inset-x-0 top-0" style={{ height: 18 * scale, background: p.categoryId === 1 ? '#7fa7b5' : '#d99a7e' }} />
            <div className="absolute" style={{ top: (18 + 6) * scale, left: 6 * scale }}>
              {(p.flow ? [{ ...p.blocks[0], products: p.blocks.flatMap((b) => b.products), continued: false }] : p.blocks).map((b, bi) => (
                <div key={bi} style={{ marginTop: bi > 0 ? (p.dividers ? 3 : 2) * scale : 0 }}>
                  {p.dividers ? (
                    <div className="flex items-center justify-end rounded-[1px] pr-0.5" style={{ height: 7 * scale, marginBottom: 1.5 * scale, background: COLORS[b.subcategoryId] }}>
                      {b.continued ? <span className="text-[5px] font-bold uppercase text-white">cont.</span> : null}
                    </div>
                  ) : null}
                  <div className="grid" style={{ gridTemplateColumns: `repeat(${grid.cols}, ${grid.cardW * scale}px)`, gridAutoRows: `${p.cardH * scale}px`, gap: 2 * scale }}>
                    {b.products.map((sub, i) => (
                      <span key={i} className="rounded-[1px]" style={{ background: COLORS[sub], opacity: 0.85 }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <figcaption className="absolute bottom-0.5 right-1 text-[7px] font-semibold text-zinc-400">{pi + 1}</figcaption>
          </figure>
        ))}
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
        {SHELVES.map((s, i) => (
          <li key={s.label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[i] }} />
            {s.label} ({s.n})
          </li>
        ))}
      </ul>
    </div>
  );
}
