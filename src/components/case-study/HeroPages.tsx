'use client';

import { useMemo } from 'react';
import type { Category, Product } from '@/lib/data/seed';
import type { Flyer, Focal } from '@/lib/data/flyers';
import { gridFor, packPages } from '@/lib/catalogue/layout';
import { DEFAULT_SETTINGS } from '@/lib/catalogue/settings';
import { HarbourCover } from '@/components/catalogue/Covers';
import { FlyerPage, ProductPageView, tonesFor } from '@/components/catalogue/PageParts';

const A4_W = 793.7;
const A4_H = 1122.5;

function Sheet({ width, children, className, style }: { width: number; children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const s = width / A4_W;
  return (
    <div className={`overflow-hidden rounded-[3px] bg-white shadow-2xl ring-1 ring-black/10 ${className ?? ''}`} style={{ width, height: A4_H * s, ...style }}>
      <div className="a4 origin-top-left" style={{ transform: `scale(${s})`, fontFamily: "'Inter', Arial, sans-serif" }}>
        {children}
      </div>
    </div>
  );
}

/** Three real pages from the demo engine (cover, product page, flyer), fanned out. */
export function HeroPages({ category, flyer }: { category: Category; flyer: { flyer: Flyer; focals: Focal[] } }) {
  const page = useMemo(() => {
    const grid = gridFor('3x4', DEFAULT_SETTINGS.bands);
    const sections = category.subcategories.map((s) => ({
      categoryId: category.id,
      categoryLabel: category.label,
      subcategoryId: s.id,
      subcategoryLabel: s.label,
      products: s.products.filter((p: Product) => p.status !== 'discontinued'),
    }));
    return { grid, page: packPages(sections, grid, DEFAULT_SETTINGS.layout)[0] };
  }, [category]);

  return (
    <div className="relative mx-auto h-[420px] w-full max-w-[560px] sm:h-[480px]" aria-label="Pages produced by the demo: a cover, a product page and a flyer" role="img">
      <Sheet width={250} className="absolute left-0 top-10 -rotate-6" style={{ zIndex: 1 }}>
        <HarbourCover icons={['grain', 'bean', 'chilli', 'bottle', 'oil', 'can', 'snack', 'cookie', 'cup', 'soda', 'snow', 'home']} categories={['Rice & Grains', 'Spices', 'Sauces', 'Snacks', 'Drinks']} dateLabel="18 October 2026" />
      </Sheet>
      <Sheet width={250} className="absolute right-0 top-10 rotate-6" style={{ zIndex: 1 }}>
        <FlyerPage flyer={flyer.flyer} focals={flyer.focals} />
      </Sheet>
      <Sheet width={280} className="absolute left-1/2 top-0 -translate-x-1/2" style={{ zIndex: 2 }}>
        <ProductPageView page={page.page} number={8} settings={DEFAULT_SETTINGS} tones={tonesFor(DEFAULT_SETTINGS, 0)} grid={page.grid} urgent />
      </Sheet>
    </div>
  );
}
