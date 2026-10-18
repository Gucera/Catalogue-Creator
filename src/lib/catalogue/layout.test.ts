import { describe, expect, it } from 'vitest';
import {
  GRID_OPTIONS,
  MIN_SHARED_CARD_SCALE,
  buildSequence,
  buildToc,
  cardHeightFor,
  gridFor,
  packPages,
  type PackOptions,
  type Section,
} from './layout';
import { rng } from '../data/seed';

const BANDS = { headerMm: 18, footerMm: 10, edgeMm: 6 };

function randomSections(seed: number): Section<string>[] {
  const r = rng(seed);
  const out: Section<string>[] = [];
  let n = 0;
  const cats = 1 + Math.floor(r() * 6);
  for (let c = 1; c <= cats; c++) {
    const subs = 1 + Math.floor(r() * 5);
    for (let s = 0; s < subs; s++) {
      const count = r() < 0.4 ? 1 + Math.floor(r() * 5) : Math.floor(r() * 60);
      out.push({
        categoryId: c,
        categoryLabel: `Cat ${c}`,
        subcategoryId: c * 100 + s,
        subcategoryLabel: `Sub ${c}.${s}`,
        products: Array.from({ length: count }, () => `P${n++}`),
      });
    }
  }
  return out;
}

const OPTION_SETS: PackOptions[] = [
  { pack: false, newRow: true, dividers: false },
  { pack: true, newRow: true, dividers: false },
  { pack: true, newRow: true, dividers: true },
  { pack: true, newRow: false, dividers: false },
];

describe('gridFor', () => {
  it('fits the cards inside the area between the bands', () => {
    for (const g of GRID_OPTIONS) {
      const grid = gridFor(g.key, BANDS);
      expect(grid.cols * grid.cardW + (grid.cols - 1) * 2).toBeLessThanOrEqual(grid.areaW + 1e-6);
      expect(grid.rows * grid.cardH + (grid.rows - 1) * 2).toBeLessThanOrEqual(grid.areaH + 1e-6);
    }
  });
});

describe('packPages (property tests over 300 random catalogues)', () => {
  for (const opts of OPTION_SETS) {
    for (const g of GRID_OPTIONS) {
      it(`keeps every invariant for grid ${g.key} with ${JSON.stringify(opts)}`, () => {
        const grid = gridFor(g.key, BANDS);
        for (let seed = 1; seed <= 300; seed++) {
          const sections = randomSections(seed);
          const pages = packPages(sections, grid, opts);

          // 1. Every product appears exactly once, in catalogue order.
          expect(pages.flatMap((p) => p.blocks.flatMap((b) => b.products))).toEqual(
            sections.flatMap((s) => s.products)
          );

          for (const page of pages) {
            const cards = page.blocks.reduce((n, b) => n + b.products.length, 0);
            // 2. Never more cards than the grid holds.
            expect(cards).toBeLessThanOrEqual(grid.cols * grid.rows);
            // 3. Never more rows than the grid has (new-row mode counts rows per block).
            if (!page.flow) {
              const rows = page.blocks.reduce((n, b) => n + Math.ceil(b.products.length / grid.cols), 0);
              expect(rows).toBeLessThanOrEqual(grid.rows);
            }
            // 4. One category per page.
            expect(new Set(page.blocks.map(() => page.categoryId)).size).toBe(1);
            // 5. Cards are never squeezed below the allowed scale.
            expect(page.cardH).toBeGreaterThanOrEqual(grid.cardH * MIN_SHARED_CARD_SCALE - 0.01);
          }

          // 6. Without packing, a page never mixes subcategories.
          if (!opts.pack) for (const page of pages) expect(page.blocks).toHaveLength(1);
        }
      });
    }
  }

  it('marks a subcategory as continued only after it started', () => {
    const grid = gridFor('3x4', BANDS);
    const sections = randomSections(7);
    const pages = packPages(sections, grid, { pack: true, newRow: true, dividers: true });
    const started = new Set<number>();
    for (const b of pages.flatMap((p) => p.blocks)) {
      expect(b.continued).toBe(started.has(b.subcategoryId));
      started.add(b.subcategoryId);
    }
  });

  it('puts two small shelves of one category on one page', () => {
    const grid = gridFor('3x4', BANDS);
    const pages = packPages(
      [
        { categoryId: 1, categoryLabel: 'A', subcategoryId: 1, subcategoryLabel: 'a1', products: ['1', '2', '3', '4'] },
        { categoryId: 1, categoryLabel: 'A', subcategoryId: 2, subcategoryLabel: 'a2', products: ['5', '6'] },
        { categoryId: 2, categoryLabel: 'B', subcategoryId: 3, subcategoryLabel: 'b1', products: ['7'] },
      ],
      grid,
      { pack: true, newRow: true, dividers: true }
    );
    expect(pages).toHaveLength(2);
    expect(pages[0].blocks.map((b) => b.subcategoryLabel)).toEqual(['a1', 'a2']);
    expect(pages[1].categoryLabel).toBe('B');
  });
});

describe('cardHeightFor', () => {
  it('refuses more rows than the grid has', () => {
    const grid = gridFor('3x4', BANDS);
    expect(cardHeightFor([3, 2], grid, false)).toBeNull();
    expect(cardHeightFor([2, 2], grid, false)).toBe(grid.cardH);
  });
  it('shortens cards to pay for dividers', () => {
    const grid = gridFor('3x4', BANDS);
    const h = cardHeightFor([2, 2], grid, true)!;
    expect(h).toBeLessThan(grid.cardH);
  });
});

describe('buildSequence + buildToc', () => {
  it('numbers pages from the final order and points the contents at real pages', () => {
    const grid = gridFor('3x4', BANDS);
    for (let seed = 1; seed <= 100; seed++) {
      const pages = packPages(randomSections(seed), grid, { pack: true, newRow: true, dividers: true });
      const seq = buildSequence(pages, { cover: true, contents: true, flyerIds: ['a', 'b'], categoryCovers: seed % 2 === 0 });
      seq.forEach((e, i) => expect(e.number).toBe(i + 1));
      const toc = buildToc(seq);
      for (const cat of toc) {
        const target = seq[cat.page - 1];
        expect(['category-cover', 'products']).toContain(target.kind);
        for (const sub of cat.subcategories) {
          const page = seq[sub.page - 1];
          expect(page.kind).toBe('products');
          if (page.kind === 'products') {
            expect(page.page.blocks.some((b) => b.subcategoryId === sub.subcategoryId && !b.continued)).toBe(true);
          }
        }
      }
    }
  });
});
