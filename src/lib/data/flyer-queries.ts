import 'server-only';
import { productBySku, store } from './store';
import type { Flyer, Focal } from './flyers';

export type FlyerWarning = { sku: string; title: string; reason: 'discontinued' | 'coming-soon' | 'unknown' };
export type FlyerRow = Flyer & { focalCount: number; focals: Focal[]; warnings: FlyerWarning[] };

/** Flyers of a catalogue with a warning for every focal whose product can no longer be sold. */
export function flyersWithWarnings(catalogueId: string): FlyerRow[] {
  const s = store();
  return (s.flyers[catalogueId] ?? []).map((f) => {
    const focals = s.focals[f.id] ?? [];
    const warnings: FlyerWarning[] = [];
    for (const focal of focals) {
      const p = productBySku(focal.sku);
      if (!p) warnings.push({ sku: focal.sku, title: focal.title, reason: 'unknown' });
      else if (p.status !== 'active') warnings.push({ sku: p.sku, title: p.title, reason: p.status });
    }
    return { ...f, focalCount: focals.length, focals, warnings };
  });
}
