'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Cat = { id: string; name: string; kind: 'main' | 'price-list' };

/** Catalogue switcher + tab strip (Products · Flyers · Export PDF). */
export function CatalogueNav({ catalogue, catalogues }: { catalogue: Cat; catalogues: Cat[] }) {
  const path = usePathname() ?? '';
  if (/\/flyers\/[^/]+$/.test(path)) return null; // full-screen flyer editor
  const base = `/demo/catalogues/${catalogue.id}`;
  const tabs = [
    { href: base, label: 'Products', active: path === base },
    { href: `${base}/flyers`, label: 'Flyers', active: path.startsWith(`${base}/flyers`) },
    { href: `${base}/export`, label: 'Export PDF', active: path.startsWith(`${base}/export`) },
  ];
  const sub = path.slice(base.length);
  return (
    <div className="border-b border-zinc-200 bg-white print:hidden">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-end gap-x-8 gap-y-2 px-4 pt-3">
        <div className="pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Catalogue</p>
          <div className="flex items-center gap-1.5">
            {catalogues.map((c) => (
              <Link
                key={c.id}
                href={`/demo/catalogues/${c.id}${sub}`}
                className={`rounded-md border px-2.5 py-1 text-sm font-semibold transition ${
                  c.id === catalogue.id ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 text-zinc-700 hover:border-zinc-400'
                }`}
              >
                {c.name}
                {c.kind === 'price-list' ? (
                  <span className={`ml-1.5 rounded px-1 text-[10px] font-medium ${c.id === catalogue.id ? 'bg-white/20' : 'bg-zinc-100 text-zinc-500'}`}>
                    price list
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
        <nav className="flex gap-1" aria-label="Catalogue sections">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              aria-current={t.active ? 'page' : undefined}
              className={`-mb-px border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium transition ${
                t.active ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
