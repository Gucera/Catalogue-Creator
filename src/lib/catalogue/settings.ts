/**
 * Export settings: one versioned object, saved per catalogue in
 * localStorage. Parsing is defensive (zod with per-field fallbacks) so an
 * old or hand-edited value can never break the page.
 */
import { z } from 'zod';
import { GRID_OPTIONS } from './layout';

export const COVER_DESIGNS = [
  { key: 'harbour', label: 'Harbour Navy' },
  { key: 'market', label: 'Market Fresh' },
  { key: 'coastal', label: 'Coastal Teal' },
] as const;

export const PAGE_FONTS = [
  { key: 'inter', label: 'Inter', css: "'Inter', Arial, sans-serif" },
  { key: 'arial', label: 'Arial', css: 'Arial, Helvetica, sans-serif' },
  { key: 'georgia', label: 'Georgia', css: 'Georgia, serif' },
] as const;

const gridKeys = GRID_OPTIONS.map((g) => g.key) as [string, ...string[]];

const num = (min: number, max: number, d: number) => z.number().min(min).max(max).catch(d);
const bool = (d: boolean) => z.boolean().catch(d);

export const SettingsSchema = z.object({
  version: z.literal(1).catch(1),
  cover: z
    .object({
      enabled: bool(true),
      design: z.enum(['harbour', 'market', 'coastal']).catch('harbour'),
      font: z.enum(['inter', 'arial', 'georgia']).catch('inter'),
    })
    .catch({ enabled: true, design: 'harbour', font: 'inter' }),
  bands: z
    .object({
      headerMm: num(10, 34, 18),
      footerMm: num(6, 24, 10),
      edgeMm: num(0, 10, 6),
      colorCycle: bool(true),
      title: z.string().max(60).catch('Harbourline Wholesale'),
      contact: z.string().max(90).catch('01632 960 412 · trade@harbourline.example'),
      pageNumbers: bool(true),
    })
    .catch({ headerMm: 18, footerMm: 10, edgeMm: 6, colorCycle: true, title: 'Harbourline Wholesale', contact: '01632 960 412 · trade@harbourline.example', pageNumbers: true }),
  layout: z
    .object({
      grid: z.enum(gridKeys).catch('3x4'),
      pack: bool(true),
      newRow: bool(true),
      dividers: bool(true),
    })
    .catch({ grid: '3x4', pack: true, newRow: true, dividers: true }),
  contents: z.object({ enabled: bool(true), subcategories: bool(true) }).catch({ enabled: true, subcategories: true }),
  cards: z
    .object({
      showQr: bool(true),
      showEach: bool(true),
      showBox: bool(true),
      showFlags: bool(true),
      showEta: bool(true),
      hideDiscontinued: bool(true),
      hideNoPhoto: bool(false),
      hideNoPrice: bool(false),
      titlePt: num(6, 11, 7.5),
      skuPt: num(5, 9, 6),
      titleAlign: z.enum(['left', 'center']).catch('left'),
    })
    .catch({ showQr: true, showEach: true, showBox: true, showFlags: true, showEta: true, hideDiscontinued: true, hideNoPhoto: false, hideNoPrice: false, titlePt: 7.5, skuPt: 6, titleAlign: 'left' }),
  extras: z.object({ flyers: bool(true), categoryCovers: bool(false) }).catch({ flyers: true, categoryCovers: false }),
});

export type ExportSettings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: ExportSettings = SettingsSchema.parse({});

export function parseSettings(raw: unknown): ExportSettings {
  const r = SettingsSchema.safeParse(raw ?? {});
  return r.success ? r.data : DEFAULT_SETTINGS;
}

/** Soft 3-tone band palettes (darkest first); with colour cycling each category takes the next. */
export const BAND_TONES: Array<readonly [string, string, string]> = [
  ['#7fa7b5', '#a9c6d0', '#d6e6eb'],
  ['#d99a7e', '#e9bfab', '#f6e0d5'],
  ['#a3b56b', '#c6d39c', '#e6edd1'],
  ['#9b8fc4', '#c0b7de', '#e3dff2'],
];
