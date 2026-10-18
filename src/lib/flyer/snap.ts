/**
 * Snapping for the focal editor.
 *
 * Rects are in 0..1 of the flyer. The threshold is given in screen pixels so
 * snapping feels the same at every zoom level; it is converted to normalised
 * units with the current view size.
 */

export type Rect = { x: number; y: number; w: number; h: number };
export type Guide = { axis: 'x' | 'y'; at: number };

type Candidate = { at: number; offset: number };

/** Best (closest) snap for one axis, or null when nothing is within reach. */
function bestSnap(edges: number[], targets: number[], threshold: number): Candidate | null {
  let best: Candidate | null = null;
  for (const t of targets) {
    for (const e of edges) {
      const d = t - e;
      if (Math.abs(d) <= threshold && (!best || Math.abs(d) < Math.abs(best.offset))) {
        best = { at: t, offset: d };
      }
    }
  }
  return best;
}

/**
 * Move `rect` so its left/centre/right and top/middle/bottom line up with the
 * page edges, the page centre or another box, when within `thresholdPx`.
 * Returns the snapped rect and the guide lines to draw.
 */
export function snapRect(
  rect: Rect,
  others: Rect[],
  viewW: number,
  viewH: number,
  thresholdPx = 6
): { rect: Rect; guides: Guide[] } {
  const xs = [0, 0.5, 1, ...others.flatMap((o) => [o.x, o.x + o.w / 2, o.x + o.w])];
  const ys = [0, 0.5, 1, ...others.flatMap((o) => [o.y, o.y + o.h / 2, o.y + o.h])];
  const sx = bestSnap([rect.x, rect.x + rect.w / 2, rect.x + rect.w], xs, thresholdPx / viewW);
  const sy = bestSnap([rect.y, rect.y + rect.h / 2, rect.y + rect.h], ys, thresholdPx / viewH);
  const guides: Guide[] = [];
  if (sx) guides.push({ axis: 'x', at: sx.at });
  if (sy) guides.push({ axis: 'y', at: sy.at });
  return {
    rect: { ...rect, x: rect.x + (sx?.offset ?? 0), y: rect.y + (sy?.offset ?? 0) },
    guides,
  };
}

/** Keep a rect fully on the page. */
export function clampRect(r: Rect): Rect {
  const w = Math.min(Math.max(r.w, 0.05), 1);
  const h = Math.min(Math.max(r.h, 0.03), 1);
  return {
    w,
    h,
    x: Math.min(Math.max(r.x, 0), 1 - w),
    y: Math.min(Math.max(r.y, 0), 1 - h),
  };
}
