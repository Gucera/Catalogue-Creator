/**
 * Flyer + focal types shared by server and client, and the seeded flyers.
 *
 * A flyer is an A4 promotional poster (an image). A focal is a product
 * overlay placed on it: title, pack size, prices, SKU and a QR code, all
 * filled from the product record instead of being typed.
 */

export type FlyerArt =
  | 'summer-grill'
  | 'spice-week'
  | 'breakfast'
  | 'world-snacks'
  | 'pantry-saver'
  | 'cool-drinks';

export type Flyer = {
  id: string;
  title: string;
  art: FlyerArt;
  enabled: boolean;
  notes: string;
  inCatering: boolean;
};

export type FocalLayout = 'stack' | 'row' | 'badge';
export type FocalTheme = 'paper' | 'ink' | 'sale' | 'fresh';

/** Geometry is stored in 0..1 of the flyer image so it is resolution independent. */
export type Focal = {
  id: string;
  sku: string;
  /** Snapshot of the product data taken when the focal was placed. */
  title: string;
  size: string;
  eachPrice: number | null;
  boxPrice: number | null;
  x: number;
  y: number;
  w: number;
  h: number;
  layout: FocalLayout;
  theme: FocalTheme;
  showQr: boolean;
  showBox: boolean;
};

export const FLYER_ASPECT = 210 / 297;

type FlyerSeed = Flyer & {
  /** Focal slots; products are chosen from these categories at seed time. */
  slots: Array<{ cat: string; x: number; y: number; w: number; h: number; layout: FocalLayout; theme: FocalTheme; discontinued?: boolean }>;
};

export const FLYER_SEEDS: FlyerSeed[] = [
  {
    id: 'fl-grill',
    title: 'Summer Grill',
    art: 'summer-grill',
    enabled: true,
    notes: 'June–August promotion',
    inCatering: true,
    slots: [
      { cat: 'Sauces & Condiments', x: 0.06, y: 0.42, w: 0.42, h: 0.17, layout: 'stack', theme: 'paper' },
      { cat: 'Sauces & Condiments', x: 0.52, y: 0.42, w: 0.42, h: 0.17, layout: 'stack', theme: 'paper' },
      { cat: 'Soft Drinks', x: 0.06, y: 0.64, w: 0.42, h: 0.17, layout: 'stack', theme: 'paper' },
      { cat: 'Snacks & Crisps', x: 0.52, y: 0.64, w: 0.42, h: 0.17, layout: 'stack', theme: 'sale' },
    ],
  },
  {
    id: 'fl-spice',
    title: 'Spice Week',
    art: 'spice-week',
    enabled: true,
    notes: 'Ground and whole spices, all sizes',
    inCatering: true,
    slots: [
      { cat: 'Spices & Seasonings', x: 0.08, y: 0.53, w: 0.84, h: 0.11, layout: 'row', theme: 'ink' },
      { cat: 'Spices & Seasonings', x: 0.08, y: 0.66, w: 0.84, h: 0.11, layout: 'row', theme: 'ink' },
    ],
  },
  {
    id: 'fl-breakfast',
    title: 'Breakfast Table',
    art: 'breakfast',
    enabled: true,
    notes: '',
    inCatering: false,
    slots: [{ cat: 'Hot Drinks', x: 0.55, y: 0.6, w: 0.36, h: 0.2, layout: 'badge', theme: 'fresh' }],
  },
  {
    id: 'fl-snacks',
    title: 'World Snacks',
    art: 'world-snacks',
    enabled: false,
    notes: 'Paused until new stock lands',
    inCatering: false,
    slots: [],
  },
  {
    id: 'fl-pantry',
    title: 'Pantry Savers',
    art: 'pantry-saver',
    enabled: true,
    notes: 'One line was discontinued after this was made',
    inCatering: true,
    slots: [
      { cat: 'Rice & Grains', x: 0.06, y: 0.36, w: 0.42, h: 0.18, layout: 'stack', theme: 'sale' },
      { cat: 'Tinned & Jarred', x: 0.52, y: 0.36, w: 0.42, h: 0.18, layout: 'stack', theme: 'sale', discontinued: true },
      { cat: 'Pulses & Beans', x: 0.06, y: 0.58, w: 0.42, h: 0.18, layout: 'stack', theme: 'sale' },
    ],
  },
  {
    id: 'fl-drinks',
    title: 'Cool Drinks',
    art: 'cool-drinks',
    enabled: true,
    notes: '',
    inCatering: false,
    slots: [],
  },
];

export function formatPrice(v: number | null | undefined): string {
  return v == null ? '—' : `£${v.toFixed(2)}`;
}
