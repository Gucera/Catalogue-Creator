/**
 * Pure A4 catalogue layout engine.
 *
 * No React and no DOM: everything is millimetres in, page models out, so the
 * same functions drive the on-screen preview, the print output and the unit
 * tests. Pipeline:
 *
 *   sections ──packPages──▶ product pages ──buildSequence──▶ numbered pages
 *                                                   └──buildToc──▶ contents
 */

export const A4_W_MM = 210;
export const A4_H_MM = 297;

/** Space between two cards. */
export const GAP_MM = 2;
/** Subcategory ribbon drawn above a block when dividers are on. */
export const SUBHEAD_MM = 7;
export const SUBHEAD_GAP_MM = 1.5;
/** Extra space between two blocks sharing a page. */
export const BLOCK_GAP_MM = 3;
/**
 * Dividers are paid for by shortening the cards a little. Below this share of
 * the normal card height the block moves to the next page instead.
 */
export const MIN_SHARED_CARD_SCALE = 0.85;

export const GRID_OPTIONS = [
  { key: '3x3', cols: 3, rows: 3, label: '3 × 3 (9 per page)' },
  { key: '3x4', cols: 3, rows: 4, label: '3 × 4 (12 per page)' },
  { key: '4x4', cols: 4, rows: 4, label: '4 × 4 (16 per page)' },
  { key: '4x5', cols: 4, rows: 5, label: '4 × 5 (20 per page)' },
  { key: '5x6', cols: 5, rows: 6, label: '5 × 6 (30 per page)' },
] as const;
export type GridKey = (typeof GRID_OPTIONS)[number]['key'];

export type Grid = {
  cols: number;
  rows: number;
  /** Card size in mm. */
  cardW: number;
  cardH: number;
  /** The card area between header band, footer band and the side edges. */
  areaW: number;
  areaH: number;
  edge: number;
};

export type BandHeights = { headerMm: number; footerMm: number; edgeMm: number };

export function gridFor(key: GridKey, bands: BandHeights): Grid {
  const g = GRID_OPTIONS.find((o) => o.key === key) ?? GRID_OPTIONS[1];
  const areaW = A4_W_MM - 2 * bands.edgeMm;
  const areaH = A4_H_MM - bands.headerMm - bands.footerMm - 2 * bands.edgeMm;
  return {
    cols: g.cols,
    rows: g.rows,
    cardW: floor1((areaW - (g.cols - 1) * GAP_MM) / g.cols),
    cardH: floor1((areaH - (g.rows - 1) * GAP_MM) / g.rows),
    areaW,
    areaH,
    edge: bands.edgeMm,
  };
}

/** One shelf of products, in catalogue order. */
export type Section<T> = {
  categoryId: number;
  categoryLabel: string;
  subcategoryId: number;
  subcategoryLabel: string;
  products: T[];
};

/** A run of one subcategory's cards on a page. */
export type Block<T> = {
  subcategoryId: number;
  subcategoryLabel: string;
  products: T[];
  /** The subcategory already started on an earlier page. */
  continued: boolean;
};

export type ProductPage<T> = {
  categoryId: number;
  categoryLabel: string;
  blocks: Block<T>[];
  /** Card height on this page (shorter than the grid's when ribbons share the space). */
  cardH: number;
  /** Ribbons are drawn above each block. */
  dividers: boolean;
  /** Cards run on cell after cell across subcategories (no new row per block). */
  flow: boolean;
};

export type PackOptions = {
  /** Small subcategories of one category may share a page. */
  pack: boolean;
  /** Each subcategory starts on a new row (otherwise cards flow on). */
  newRow: boolean;
  /** Draw a ribbon above each subcategory. */
  dividers: boolean;
};

const floor1 = (n: number) => Math.floor(n * 10) / 10;

/**
 * Card height for blocks with these row counts on one page, or null when
 * they do not fit. The grid's row count is a hard limit; with dividers the
 * ribbons are paid for by shorter cards, never by narrower ones.
 */
export function cardHeightFor(rowCounts: number[], grid: Grid, dividers: boolean): number | null {
  const rows = rowCounts.reduce((a, b) => a + b, 0);
  if (rows === 0 || rows > grid.rows) return null;
  if (!dividers) return grid.cardH;
  const blocks = rowCounts.length;
  const fixed =
    blocks * (SUBHEAD_MM + SUBHEAD_GAP_MM) + (blocks - 1) * BLOCK_GAP_MM + (rows - blocks) * GAP_MM;
  const h = Math.min(grid.cardH, floor1((grid.areaH - fixed) / rows));
  return h >= grid.cardH * MIN_SHARED_CARD_SCALE ? h : null;
}

/** Cards fill every cell; a category still always starts on a new page. */
function flowPages<T>(sections: Section<T>[], grid: Grid): ProductPage<T>[] {
  const perPage = grid.cols * grid.rows;
  const pages: ProductPage<T>[] = [];
  let page: ProductPage<T> | null = null;
  let used = 0;
  for (const s of sections) {
    let rest = s.products;
    let continued = false;
    while (rest.length > 0) {
      if (!page || page.categoryId !== s.categoryId || used >= perPage) {
        page = {
          categoryId: s.categoryId,
          categoryLabel: s.categoryLabel,
          blocks: [],
          cardH: grid.cardH,
          dividers: false,
          flow: true,
        };
        pages.push(page);
        used = 0;
      }
      const take = rest.slice(0, perPage - used);
      page.blocks.push({ subcategoryId: s.subcategoryId, subcategoryLabel: s.subcategoryLabel, products: take, continued });
      used += take.length;
      rest = rest.slice(take.length);
      continued = true;
    }
  }
  return pages;
}

/**
 * Lay sections out on product pages.
 *
 * - A category always starts on a fresh page.
 * - With `pack`, the next subcategory starts on the row below the previous
 *   one when at least one full row of it fits; rows that do not fit carry on
 *   overleaf as a "continued" block.
 * - Without `pack`, every subcategory starts on its own page.
 */
export function packPages<T>(sections: Section<T>[], grid: Grid, opts: PackOptions): ProductPage<T>[] {
  if (opts.pack && !opts.newRow) return flowPages(sections, grid);

  const rowsOf = (n: number) => Math.ceil(n / grid.cols);
  const pages: ProductPage<T>[] = [];
  let open: ProductPage<T> | null = null;
  const close = () => {
    if (open) pages.push(open);
    open = null;
  };

  for (const s of sections) {
    if (s.products.length === 0) continue;
    if (open && (!opts.pack || (open as ProductPage<T>).categoryId !== s.categoryId)) close();
    let rest = s.products;
    let continued = false;

    while (rest.length > 0) {
      const current = open as ProductPage<T> | null;
      const usedRows = current ? current.blocks.map((b) => rowsOf(b.products.length)) : [];
      // Most rows of this subcategory that still fit on the open page (or a fresh one).
      let rows = Math.min(rowsOf(rest.length), grid.rows);
      let h: number | null = null;
      for (; rows > 0; rows--) {
        h = cardHeightFor([...usedRows, rows], grid, opts.dividers);
        if (h != null) break;
      }
      if (rows === 0 || h == null) {
        if (!current) throw new Error('Grid too small for a single row');
        close();
        continue;
      }
      const take = rest.slice(0, rows * grid.cols);
      const block: Block<T> = {
        subcategoryId: s.subcategoryId,
        subcategoryLabel: s.subcategoryLabel,
        products: take,
        continued,
      };
      if (current) {
        current.blocks.push(block);
        current.cardH = h;
      } else {
        open = {
          categoryId: s.categoryId,
          categoryLabel: s.categoryLabel,
          blocks: [block],
          cardH: h,
          dividers: opts.dividers,
          flow: false,
        };
      }
      rest = rest.slice(take.length);
      continued = true;
      if (rest.length > 0) close();
    }
  }
  close();
  return pages;
}

/** Every page of the finished document, in print order, with its page number. */
export type PageEntry<T> = { number: number } & (
  | { kind: 'cover' }
  | { kind: 'contents' }
  | { kind: 'flyer'; flyerId: string }
  | { kind: 'category-cover'; categoryId: number; categoryLabel: string }
  | { kind: 'products'; page: ProductPage<T>; productIndex: number }
);

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type SequenceOptions = {
  cover: boolean;
  contents: boolean;
  flyerIds: string[];
  categoryCovers: boolean;
};

export function buildSequence<T>(pages: ProductPage<T>[], opts: SequenceOptions): PageEntry<T>[] {
  const out: Array<DistributiveOmit<PageEntry<T>, 'number'>> = [];
  if (opts.cover) out.push({ kind: 'cover' });
  if (opts.contents) out.push({ kind: 'contents' });
  for (const flyerId of opts.flyerIds) out.push({ kind: 'flyer', flyerId });
  let lastCategory: number | null = null;
  pages.forEach((page, productIndex) => {
    if (opts.categoryCovers && page.categoryId !== lastCategory) {
      out.push({ kind: 'category-cover', categoryId: page.categoryId, categoryLabel: page.categoryLabel });
    }
    lastCategory = page.categoryId;
    out.push({ kind: 'products', page, productIndex });
  });
  // Numbers come from the final order, so inserted pages can never skew the contents.
  return out.map((e, i) => ({ ...e, number: i + 1 }) as PageEntry<T>);
}

export type TocEntry = {
  categoryId: number;
  label: string;
  page: number;
  subcategories: Array<{ subcategoryId: number; label: string; page: number }>;
};

/** Contents from the numbered sequence: each heading points at its first page. */
export function buildToc<T>(sequence: PageEntry<T>[]): TocEntry[] {
  const toc: TocEntry[] = [];
  const byCat = new Map<number, TocEntry>();
  for (const e of sequence) {
    if (e.kind === 'category-cover' && !byCat.has(e.categoryId)) {
      const entry: TocEntry = { categoryId: e.categoryId, label: e.categoryLabel, page: e.number, subcategories: [] };
      byCat.set(e.categoryId, entry);
      toc.push(entry);
    }
    if (e.kind !== 'products') continue;
    let entry = byCat.get(e.page.categoryId);
    if (!entry) {
      entry = { categoryId: e.page.categoryId, label: e.page.categoryLabel, page: e.number, subcategories: [] };
      byCat.set(e.page.categoryId, entry);
      toc.push(entry);
    }
    for (const b of e.page.blocks) {
      if (!b.continued) entry.subcategories.push({ subcategoryId: b.subcategoryId, label: b.subcategoryLabel, page: e.number });
    }
  }
  return toc;
}

/** Stable DOM ids so contents entries can link into the printed PDF. */
export const pageAnchor = (n: number) => `page-${n}`;
