import type { CategoryIcon as Key } from '@/lib/data/seed';

/** Simple line icons drawn on a 24-unit grid. */
export const CATEGORY_ICON_PATHS: Record<Key, string> = {
  grain: 'M12 21V8M12 8c-2-1-3-3-3-5 2 1 3 3 3 5Zm0 0c2-1 3-3 3-5-2 1-3 3-3 5Zm0 4c-2-1-4-3-4-5 2 0 4 2 4 5Zm0 0c2-1 4-3 4-5-2 0-4 2-4 5Zm0 4c-2-1-4-3-4-5 2 0 4 2 4 5Zm0 0c2-1 4-3 4-5-2 0-4 2-4 5Z',
  bean: 'M8 5c3-2 8 0 9 4s-1 6-3 7-3 4-6 4-5-3-4-6 0-3 1-5 0-3 3-4Zm2 4c2 0 3 2 2 4',
  chilli: 'M16 4c0 2-1 3-2 3M14 7c3 0 5 2 4 6-1 5-7 8-13 8 4-2 6-5 6-9 0-3 1-5 3-5Z',
  bottle: 'M10 3h4v4l2 3v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10l2-3V3Zm-2 9h8',
  oil: 'M12 3c3 5 6 8 6 12a6 6 0 0 1-12 0c0-4 3-7 6-12Zm-2 13a2 2 0 0 0 2 2',
  can: 'M6 6c0-1.5 2.7-2.5 6-2.5s6 1 6 2.5v12c0 1.5-2.7 2.5-6 2.5S6 19.5 6 18V6Zm0 0c0 1.5 2.7 2.5 6 2.5s6-1 6-2.5M6 15c0 1.5 2.7 2.5 6 2.5s6-1 6-2.5',
  snack: 'M7 4h10l-1 3c1 3 1 9 0 12l1 2H7l1-2c-1-3-1-9 0-12L7 4Zm3 7h4m-4 3h4',
  cookie: 'M12 3a9 9 0 1 0 9 9 3 3 0 0 1-3-3 3 3 0 0 1-3-3 3 3 0 0 1-3-3Zm-3 7h.01M8 15h.01M13 16h.01M15 12h.01',
  cup: 'M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9Zm11 1h1.5a2.5 2.5 0 0 1 0 5H16M9 3c-1 1 1 2 0 3m3-3c-1 1 1 2 0 3',
  soda: 'M7 8h10l-1.5 12a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1L7 8Zm7 0 2-5h2M8 12h8',
  snow: 'M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M10 5l2 2 2-2M10 19l2-2 2 2',
  home: 'M4 11 12 4l8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-9Z',
};

export function CategoryIcon({ name, className, strokeWidth = 1.6 }: { name: Key; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={CATEGORY_ICON_PATHS[name]} />
    </svg>
  );
}
