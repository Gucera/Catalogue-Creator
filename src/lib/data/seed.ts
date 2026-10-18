/**
 * Deterministic fake catalogue for the demo.
 *
 * Everything here is invented: the wholesaler, product names, SKUs, prices
 * and pack sizes come from a seeded random generator, so every visitor sees
 * the same catalogue and tests can rely on fixed counts.
 */

export type ProductStatus = 'active' | 'coming-soon' | 'discontinued';
export type ProductFlag = 'new' | 'promo' | 'vegan' | 'organic';
export type PackShape = 'jar' | 'bottle' | 'can' | 'bag' | 'box' | 'tub' | 'sachet';

export type Product = {
  sku: string;
  title: string;
  /** Pack size line printed under the title, e.g. "12 × 400 g". */
  size: string;
  eachPrice: number | null;
  boxPrice: number | null;
  status: ProductStatus;
  /** ISO date when a coming-soon product is expected in stock. */
  eta: string | null;
  flags: ProductFlag[];
  /** Photo state in the fake image service (to exercise the photo loader). */
  photo: 'ok' | 'missing' | 'broken';
  shape: PackShape;
  hue: number;
};

export type Subcategory = { id: number; label: string; products: Product[] };
export type Category = {
  id: number;
  label: string;
  /** Icon key used on covers and contents. */
  icon: CategoryIcon;
  subcategories: Subcategory[];
};

export type CategoryIcon =
  | 'grain'
  | 'bean'
  | 'chilli'
  | 'bottle'
  | 'oil'
  | 'can'
  | 'snack'
  | 'cookie'
  | 'cup'
  | 'soda'
  | 'snow'
  | 'home';

/** mulberry32: tiny, fast, good enough for fake data. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type SubSpec = {
  label: string;
  count: number;
  shape: PackShape;
  nouns: string[];
  sizes: string[];
  /** Typical each-price range in GBP. */
  price: [number, number];
};

type CatSpec = { label: string; icon: CategoryIcon; hue: number; subs: SubSpec[] };

const BRANDS = [
  'Harbourline',
  'Saltmarsh',
  'Golden Quay',
  'Old Mill',
  'Kestrel',
  'Bluebell Farm',
  'Copper Pot',
  'Little Orchard',
  'Northgate',
  'Silver Birch',
  'Red Kite',
  'Meadowsweet',
];

const ADJECTIVES = [
  'Classic',
  'Smoky',
  'Mild',
  'Hot',
  'Extra Fine',
  'Stoneground',
  'Toasted',
  'Golden',
  'Wild',
  'Country',
  'Rich',
  'Light',
  'Spiced',
  'Sweet',
  'Premium',
];

const SPECS: CatSpec[] = [
  {
    label: 'Rice & Grains',
    icon: 'grain',
    hue: 40,
    subs: [
      { label: 'Basmati Rice', count: 14, shape: 'bag', nouns: ['Basmati Rice', 'Long Grain Rice', 'Brown Basmati'], sizes: ['4 × 5 kg', '10 × 1 kg', '1 × 10 kg'], price: [2, 14] },
      { label: 'Specialty Rice', count: 5, shape: 'bag', nouns: ['Jasmine Rice', 'Arborio Rice', 'Sushi Rice', 'Red Rice'], sizes: ['10 × 1 kg', '6 × 2 kg'], price: [2, 6] },
      { label: 'Couscous & Bulgur', count: 4, shape: 'box', nouns: ['Couscous', 'Bulgur Wheat', 'Giant Couscous'], sizes: ['12 × 500 g', '6 × 1 kg'], price: [1, 3] },
      { label: 'Flour & Semolina', count: 11, shape: 'bag', nouns: ['Chapati Flour', 'Semolina', 'Gram Flour', 'Rice Flour'], sizes: ['10 × 1 kg', '4 × 5 kg'], price: [1, 9] },
    ],
  },
  {
    label: 'Pulses & Beans',
    icon: 'bean',
    hue: 25,
    subs: [
      { label: 'Lentils', count: 10, shape: 'bag', nouns: ['Red Lentils', 'Green Lentils', 'Urad Dal', 'Moong Dal', 'Toor Dal'], sizes: ['10 × 1 kg', '20 × 500 g'], price: [1, 4] },
      { label: 'Dried Beans', count: 8, shape: 'bag', nouns: ['Kidney Beans', 'Black-Eyed Beans', 'Butter Beans', 'Chickpeas'], sizes: ['10 × 1 kg', '20 × 500 g'], price: [1, 4] },
      { label: 'Tinned Pulses', count: 3, shape: 'can', nouns: ['Chickpeas in Water', 'Mixed Beans', 'Red Kidney Beans'], sizes: ['24 × 400 g'], price: [0.5, 1.2] },
    ],
  },
  {
    label: 'Spices & Seasonings',
    icon: 'chilli',
    hue: 12,
    subs: [
      { label: 'Ground Spices', count: 22, shape: 'jar', nouns: ['Ground Cumin', 'Turmeric', 'Paprika', 'Ground Coriander', 'Chilli Powder', 'Garam Masala', 'Ground Ginger'], sizes: ['6 × 100 g', '10 × 400 g', '6 × 1 kg'], price: [1, 7] },
      { label: 'Whole Spices', count: 12, shape: 'sachet', nouns: ['Cumin Seeds', 'Cloves', 'Cardamom Pods', 'Black Peppercorns', 'Star Anise', 'Cinnamon Sticks'], sizes: ['10 × 100 g', '6 × 300 g'], price: [1, 8] },
      { label: 'Spice Blends', count: 6, shape: 'jar', nouns: ['Curry Blend', 'Jerk Seasoning', 'Ras el Hanout', 'Za’atar', 'Cajun Mix'], sizes: ['6 × 100 g', '6 × 400 g'], price: [1.5, 5] },
      { label: 'Salt & Stock', count: 2, shape: 'tub', nouns: ['Sea Salt Flakes', 'Vegetable Stock Powder'], sizes: ['6 × 500 g'], price: [1, 4] },
    ],
  },
  {
    label: 'Sauces & Condiments',
    icon: 'bottle',
    hue: 350,
    subs: [
      { label: 'Hot Sauces', count: 9, shape: 'bottle', nouns: ['Chilli Sauce', 'Hot Pepper Sauce', 'Sriracha', 'Peri Peri Sauce'], sizes: ['12 × 150 ml', '6 × 500 ml'], price: [1, 4] },
      { label: 'Cooking Sauces', count: 15, shape: 'jar', nouns: ['Tikka Paste', 'Korma Sauce', 'Black Bean Sauce', 'Sweet & Sour', 'Tomato Pasta Sauce'], sizes: ['6 × 450 g', '12 × 285 g'], price: [1, 3] },
      { label: 'Pickles & Chutneys', count: 7, shape: 'jar', nouns: ['Mango Chutney', 'Lime Pickle', 'Mixed Pickle', 'Garlic Pickle'], sizes: ['6 × 300 g', '6 × 1 kg'], price: [1, 5] },
      { label: 'Soy & Fish Sauce', count: 3, shape: 'bottle', nouns: ['Light Soy Sauce', 'Dark Soy Sauce', 'Fish Sauce'], sizes: ['12 × 150 ml', '6 × 1 l'], price: [1, 4] },
    ],
  },
  {
    label: 'Oils & Vinegar',
    icon: 'oil',
    hue: 55,
    subs: [
      { label: 'Cooking Oils', count: 10, shape: 'bottle', nouns: ['Sunflower Oil', 'Rapeseed Oil', 'Vegetable Oil', 'Mustard Oil'], sizes: ['6 × 1 l', '4 × 5 l', '1 × 20 l'], price: [2, 30] },
      { label: 'Olive Oil', count: 6, shape: 'bottle', nouns: ['Extra Virgin Olive Oil', 'Pure Olive Oil', 'Pomace Olive Oil'], sizes: ['6 × 1 l', '12 × 500 ml'], price: [4, 12] },
      { label: 'Vinegar', count: 3, shape: 'bottle', nouns: ['Malt Vinegar', 'White Wine Vinegar', 'Balsamic Vinegar'], sizes: ['12 × 500 ml'], price: [0.6, 3] },
    ],
  },
  {
    label: 'Tinned & Jarred',
    icon: 'can',
    hue: 200,
    subs: [
      { label: 'Tomatoes', count: 8, shape: 'can', nouns: ['Chopped Tomatoes', 'Plum Tomatoes', 'Tomato Purée', 'Passata'], sizes: ['24 × 400 g', '6 × 2.5 kg'], price: [0.5, 4] },
      { label: 'Vegetables', count: 9, shape: 'can', nouns: ['Sweetcorn', 'Garden Peas', 'Okra in Brine', 'Bamboo Shoots'], sizes: ['24 × 400 g', '12 × 340 g'], price: [0.5, 1.5] },
      { label: 'Fish', count: 5, shape: 'can', nouns: ['Sardines in Oil', 'Tuna Chunks', 'Mackerel Fillets'], sizes: ['24 × 120 g', '12 × 160 g'], price: [0.8, 2.5] },
      { label: 'Fruit', count: 4, shape: 'can', nouns: ['Mango Pulp', 'Pineapple Rings', 'Lychees in Syrup'], sizes: ['6 × 850 g', '12 × 565 g'], price: [1, 3] },
    ],
  },
  {
    label: 'Snacks & Crisps',
    icon: 'snack',
    hue: 30,
    subs: [
      { label: 'Crisps', count: 16, shape: 'bag', nouns: ['Sea Salt Crisps', 'Cheese & Onion Crisps', 'Plantain Chips', 'Cassava Chips'], sizes: ['24 × 40 g', '12 × 150 g'], price: [0.4, 2] },
      { label: 'Nuts & Seeds', count: 11, shape: 'bag', nouns: ['Roasted Peanuts', 'Cashews', 'Salted Pistachios', 'Sunflower Seeds', 'Trail Mix'], sizes: ['12 × 200 g', '6 × 1 kg'], price: [1, 9] },
      { label: 'Savoury Mixes', count: 5, shape: 'bag', nouns: ['Bombay Mix', 'Chilli Crackers', 'Rice Crackers'], sizes: ['12 × 200 g', '20 × 70 g'], price: [0.6, 2] },
    ],
  },
  {
    label: 'Biscuits & Sweets',
    icon: 'cookie',
    hue: 280,
    subs: [
      { label: 'Biscuits', count: 14, shape: 'box', nouns: ['Digestive Biscuits', 'Shortbread', 'Ginger Nuts', 'Butter Cookies', 'Wafer Rolls'], sizes: ['12 × 300 g', '24 × 150 g'], price: [0.6, 3] },
      { label: 'Chocolate', count: 6, shape: 'box', nouns: ['Milk Chocolate Bar', 'Dark Chocolate', 'Hazelnut Bar'], sizes: ['24 × 100 g', '36 × 45 g'], price: [0.5, 2.5] },
      { label: 'Sweets', count: 2, shape: 'bag', nouns: ['Fruit Jellies', 'Mint Imperials'], sizes: ['12 × 200 g'], price: [0.8, 1.5] },
    ],
  },
  {
    label: 'Hot Drinks',
    icon: 'cup',
    hue: 15,
    subs: [
      { label: 'Tea', count: 10, shape: 'box', nouns: ['Breakfast Tea', 'Green Tea', 'Chai Tea', 'Earl Grey', 'Mint Tea'], sizes: ['12 × 80 bags', '6 × 240 bags'], price: [1, 6] },
      { label: 'Coffee', count: 8, shape: 'jar', nouns: ['Instant Coffee', 'Ground Coffee', 'Coffee Beans'], sizes: ['6 × 200 g', '6 × 1 kg'], price: [2, 14] },
      { label: 'Chocolate & Malt', count: 3, shape: 'tub', nouns: ['Drinking Chocolate', 'Malted Drink'], sizes: ['6 × 400 g'], price: [2, 5] },
    ],
  },
  {
    label: 'Soft Drinks',
    icon: 'soda',
    hue: 190,
    subs: [
      { label: 'Juices', count: 11, shape: 'bottle', nouns: ['Mango Juice', 'Guava Nectar', 'Apple Juice', 'Pineapple Juice'], sizes: ['12 × 1 l', '24 × 250 ml'], price: [0.5, 2] },
      { label: 'Carbonated', count: 12, shape: 'can', nouns: ['Cola', 'Ginger Beer', 'Lemonade', 'Tropical Soda', 'Cream Soda'], sizes: ['24 × 330 ml', '12 × 1.5 l'], price: [0.4, 1.6] },
      { label: 'Water', count: 4, shape: 'bottle', nouns: ['Still Spring Water', 'Sparkling Water', 'Coconut Water'], sizes: ['24 × 500 ml', '6 × 1.5 l'], price: [0.2, 1.5] },
    ],
  },
  {
    label: 'Frozen',
    icon: 'snow',
    hue: 210,
    subs: [
      { label: 'Frozen Vegetables', count: 9, shape: 'bag', nouns: ['Frozen Peas', 'Spinach Portions', 'Okra', 'Mixed Vegetables'], sizes: ['10 × 1 kg', '20 × 400 g'], price: [0.8, 3] },
      { label: 'Breads & Pastry', count: 7, shape: 'box', nouns: ['Plain Paratha', 'Samosa Pastry', 'Naan Bread', 'Spring Roll Wrappers'], sizes: ['12 × 400 g', '20 × 5 pcs'], price: [1, 3] },
      { label: 'Ready Snacks', count: 5, shape: 'box', nouns: ['Vegetable Samosas', 'Spring Rolls', 'Onion Bhajis'], sizes: ['10 × 12 pcs'], price: [2, 5] },
    ],
  },
  {
    label: 'Household',
    icon: 'home',
    hue: 160,
    subs: [
      { label: 'Cleaning', count: 9, shape: 'bottle', nouns: ['Washing-Up Liquid', 'Surface Cleaner', 'Bleach', 'Glass Cleaner'], sizes: ['12 × 500 ml', '4 × 5 l'], price: [0.6, 6] },
      { label: 'Paper & Foil', count: 6, shape: 'box', nouns: ['Kitchen Roll', 'Aluminium Foil', 'Cling Film', 'Baking Paper'], sizes: ['12 × 1 roll', '6 × 30 m'], price: [0.8, 4] },
      { label: 'Disposables', count: 4, shape: 'box', nouns: ['Paper Plates', 'Food Containers', 'Napkins'], sizes: ['20 × 50 pcs', '10 × 100 pcs'], price: [1, 5] },
    ],
  },
];

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** Number of packs in a size line like "12 × 400 g" (1 when there is no "×"). */
export function packCount(size: string): number {
  const m = /^(\d+)\s*×/.exec(size);
  return m ? Number(m[1]) : 1;
}

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function buildCatalogue(seed = 20261018): Category[] {
  const r = rng(seed);
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  let skuNo = 10001;
  let subId = 100;
  const etaBase = new Date(Date.UTC(2026, 10, 1));
  return SPECS.map((cat, ci) => ({
    id: ci + 1,
    label: cat.label,
    icon: cat.icon,
    subcategories: cat.subs.map((sub) => {
      const seen = new Set<string>();
      const products: Product[] = [];
      // Big shelves are doubled; small ones stay small so page packing has work to do.
      const target = sub.count >= 6 ? sub.count * 2 : sub.count;
      while (products.length < target) {
        const brand = pick(BRANDS);
        const noun = pick(sub.nouns);
        const adj = r() < 0.45 ? `${pick(ADJECTIVES)} ` : '';
        const size = pick(sub.sizes);
        const title = `${brand} ${adj}${noun}`;
        if (seen.has(`${title}|${size}`)) continue;
        seen.add(`${title}|${size}`);
        const each = round2(sub.price[0] + r() * (sub.price[1] - sub.price[0]));
        const packs = packCount(size);
        const roll = r();
        const status: ProductStatus = roll < 0.05 ? 'coming-soon' : roll < 0.08 ? 'discontinued' : 'active';
        const flags: ProductFlag[] = [];
        if (r() < 0.12) flags.push('new');
        if (r() < 0.1) flags.push('promo');
        if (r() < 0.1) flags.push('vegan');
        if (r() < 0.06) flags.push('organic');
        const photoRoll = r();
        products.push({
          sku: `HL-${skuNo++}`,
          title,
          size,
          // A few products have no price yet (exercises "Hide products without price").
          eachPrice: r() < 0.03 ? null : each,
          boxPrice: packs > 1 ? round2(each * packs * (0.86 + r() * 0.06)) : null,
          status,
          eta: status === 'coming-soon' ? addDays(etaBase, Math.floor(r() * 60)) : null,
          flags,
          photo: photoRoll < 0.035 ? 'missing' : photoRoll < 0.045 ? 'broken' : 'ok',
          shape: sub.shape,
          hue: (cat.hue + Math.floor((r() - 0.5) * 70) + 360) % 360,
        });
      }
      return { id: ++subId, label: sub.label, products };
    }),
  }));
}

export const BRAND = {
  name: 'Harbourline Wholesale',
  short: 'Harbourline',
  tagline: 'Cash & carry for independent grocers',
  phone: '01632 960 412',
  email: 'trade@harbourline.example',
  web: 'harbourline.example',
} as const;
