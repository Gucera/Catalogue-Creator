'use client';

import { memo, useEffect, useRef } from 'react';
import type { PageEntry } from '@/lib/catalogue/layout';
import type { Product } from '@/lib/data/seed';

function label(e: PageEntry<Product>, flyerTitle: (id: string) => string) {
  switch (e.kind) {
    case 'cover':
      return 'Cover';
    case 'contents':
      return 'Contents';
    case 'flyer':
      return `Flyer · ${flyerTitle(e.flyerId)}`;
    case 'category-cover':
      return `${e.categoryLabel} cover`;
    case 'products':
      return e.page.blocks.map((b) => b.subcategoryLabel + (b.continued ? ' (cont.)' : '')).join(', ');
  }
}

/** Right-hand page list: every page by number and content, grouped by category. */
export const PageNavigator = memo(function PageNavigator({
  sequence,
  current,
  onSelect,
  flyerTitle,
}: {
  sequence: PageEntry<Product>[];
  current: number;
  onSelect: (i: number) => void;
  flyerTitle: (id: string) => string;
}) {
  const listRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    listRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest' });
  }, [current]);

  let lastGroup = '';
  return (
    <nav aria-label="Pages" className="hidden w-64 shrink-0 flex-col border-l border-zinc-200 bg-white lg:flex">
      <p className="border-b border-zinc-200 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Pages</p>
      <ol ref={listRef} className="thin-scroll flex-1 overflow-y-auto py-1">
        {sequence.map((e, i) => {
          const group = e.kind === 'products' ? e.page.categoryLabel : e.kind === 'category-cover' ? e.categoryLabel : 'Front matter';
          const heading = group !== lastGroup ? group : null;
          lastGroup = group;
          const active = i === current;
          return (
            <li key={e.number}>
              {heading ? <p className="px-4 pb-1 pt-3 text-[11px] font-semibold text-zinc-900">{heading}</p> : null}
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-current={active ? 'page' : undefined}
                className={`flex w-full items-baseline gap-2 px-4 py-1 text-left text-xs ${active ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
              >
                <span className={`w-6 shrink-0 text-right font-mono tabular-nums ${active ? 'text-white/70' : 'text-zinc-400'}`}>{e.number}</span>
                <span className="truncate">{label(e, flyerTitle)}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
});
