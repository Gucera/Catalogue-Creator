/**
 * In-memory demo store. Server-only.
 *
 * Holds the seeded catalogue plus everything the demo lets visitors change
 * (folder order, flyer order/suspension, focals). It lives on globalThis so
 * it survives hot reloads in dev; a restart resets it to the seed, which is
 * what we want for a public demo.
 */
import 'server-only';
import { buildCatalogue, type Category, type Product } from './seed';
import { FLYER_SEEDS, type Flyer, type Focal } from './flyers';

export type CatalogueSummary = {
  id: string;
  name: string;
  kind: 'main' | 'price-list';
  description: string;
};

type Store = {
  categories: Category[];
  /** Per catalogue: category ids in display order. */
  categoryOrder: Record<string, number[]>;
  /** Per catalogue: subcategory ids in display order, per category. */
  subOrder: Record<string, Record<number, number[]>>;
  flyers: Record<string, Flyer[]>;
  focals: Record<string, Focal[]>;
  updatedAt: number;
};

export const CATALOGUES: CatalogueSummary[] = [
  {
    id: 'main',
    name: 'Main Catalogue',
    kind: 'main',
    description: 'Every active line in the range.',
  },
  {
    id: 'catering',
    name: 'Catering Catalogue',
    kind: 'price-list',
    description: 'Only bulk packs on the catering price list.',
  },
];

/** Catering = bulk packs only (a price-list catalogue is a filtered clone of Main). */
function inCatering(p: Product) {
  return /(\b[2-9]|\d{2,})\s*(kg|l)\b|× 1 kg|1 × /.test(p.size);
}

function seed(): Store {
  const categories = buildCatalogue();
  const categoryOrder: Store['categoryOrder'] = {};
  const subOrder: Store['subOrder'] = {};
  for (const c of CATALOGUES) {
    categoryOrder[c.id] = categories.map((x) => x.id);
    subOrder[c.id] = Object.fromEntries(
      categories.map((x) => [x.id, x.subcategories.map((s) => s.id)])
    );
  }
  const toFlyer = (seed: (typeof FLYER_SEEDS)[number]): Flyer => {
    const { slots, ...f } = seed;
    void slots;
    return f;
  };
  const flyers: Store['flyers'] = {
    main: FLYER_SEEDS.map(toFlyer),
    catering: FLYER_SEEDS.filter((f) => f.inCatering).map(toFlyer),
  };
  const focals: Store['focals'] = {};
  const used = new Set<string>();
  for (const f of FLYER_SEEDS) {
    focals[f.id] = f.slots.map((slot, i) => {
      const pool = categories
        .find((c) => c.label === slot.cat)!
        .subcategories.flatMap((s) => s.products)
        .filter((p) =>
          !used.has(p.sku) && (slot.discontinued ? p.status === 'discontinued' : p.status === 'active') && p.photo === 'ok' && p.eachPrice != null
        );
      const fallback = categories.flatMap((c) => c.subcategories.flatMap((s) => s.products)).filter((p) => !used.has(p.sku));
      const list = pool.length > 0 ? pool : fallback;
      const p = list[(i * 7 + 3) % list.length];
      used.add(p.sku);
      return {
        id: `${f.id}-f${i + 1}`,
        sku: p.sku,
        title: p.title,
        size: p.size,
        eachPrice: p.eachPrice,
        boxPrice: p.boxPrice,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        layout: slot.layout,
        theme: slot.theme,
        showQr: true,
        showBox: slot.layout !== 'badge',
      };
    });
  }
  return { categories, categoryOrder, subOrder, flyers, focals, updatedAt: Date.now() };
}

const g = globalThis as unknown as { __demoStore?: Store };
export function store(): Store {
  if (!g.__demoStore) g.__demoStore = seed();
  return g.__demoStore;
}

export function getCatalogue(id: string) {
  return CATALOGUES.find((c) => c.id === id) ?? null;
}

/** The catalogue's tree in its saved order, filtered for price-list catalogues. */
export function catalogueTree(id: string): Category[] {
  const s = store();
  const byId = new Map(s.categories.map((c) => [c.id, c]));
  return s.categoryOrder[id]
    .map((cid) => byId.get(cid)!)
    .map((c) => {
      const subs = new Map(c.subcategories.map((x) => [x.id, x]));
      return {
        ...c,
        subcategories: s.subOrder[id][c.id]
          .map((sid) => subs.get(sid)!)
          .map((sub) => ({
            ...sub,
            products: id === 'catering' ? sub.products.filter(inCatering) : sub.products,
          }))
          .filter((sub) => sub.products.length > 0),
      };
    })
    .filter((c) => c.subcategories.length > 0);
}

export function allProducts(): Product[] {
  return store().categories.flatMap((c) => c.subcategories.flatMap((s) => s.products));
}

export function productBySku(sku: string): Product | null {
  const key = sku.trim().toUpperCase();
  return allProducts().find((p) => p.sku === key) ?? null;
}
