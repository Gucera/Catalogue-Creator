import { describe, expect, it } from 'vitest';
import { clampRect, snapRect } from './snap';

describe('snapRect', () => {
  it('snaps the left edge to the page edge within the pixel threshold', () => {
    const { rect, guides } = snapRect({ x: 0.004, y: 0.3, w: 0.3, h: 0.1 }, [], 500, 700, 6);
    expect(rect.x).toBe(0);
    expect(guides).toContainEqual({ axis: 'x', at: 0 });
  });

  it('snaps centres to the page centre', () => {
    const { rect } = snapRect({ x: 0.352, y: 0.6, w: 0.3, h: 0.1 }, [], 500, 700, 6);
    expect(rect.x + rect.w / 2).toBeCloseTo(0.5);
  });

  it('aligns with another box', () => {
    const other = { x: 0.1, y: 0.2, w: 0.3, h: 0.1 };
    const { rect } = snapRect({ x: 0.55, y: 0.205, w: 0.3, h: 0.1 }, [other], 500, 700, 6);
    expect(rect.y).toBeCloseTo(0.2);
  });

  it('leaves the rect alone when nothing is close', () => {
    const r = { x: 0.13, y: 0.27, w: 0.21, h: 0.11 };
    const { rect, guides } = snapRect(r, [], 500, 700, 6);
    expect(rect).toEqual(r);
    expect(guides).toEqual([]);
  });

  it('uses a threshold in screen pixels, so zooming in snaps less', () => {
    const r = { x: 0.01, y: 0.3, w: 0.2, h: 0.1 };
    expect(snapRect(r, [], 500, 700, 6).rect.x).toBe(0); // 5px away
    expect(snapRect(r, [], 2000, 2800, 6).rect.x).toBe(0.01); // 20px away
  });
});

describe('clampRect', () => {
  it('keeps the box on the page', () => {
    expect(clampRect({ x: 0.9, y: -0.2, w: 0.3, h: 0.2 })).toEqual({ x: 0.7, y: 0, w: 0.3, h: 0.2 });
  });
});
