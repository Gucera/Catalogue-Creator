import { useId } from 'react';
import type { CategoryIcon as IconKey } from '@/lib/data/seed';
import { CATEGORY_ICON_PATHS } from '@/components/ui/CategoryIcon';
import { brandMarkSvg } from '@/lib/brand';

export type CoverProps = { icons: IconKey[]; categories: string[]; dateLabel: string };

/** "Rice & Grains" → "RICE": a footer line of category names that always fits. */
const shortList = (cats: string[]) => cats.slice(0, 7).map((c) => c.split(' ')[0].toUpperCase()).join('  ·  ');

/** Rounded so server and browser trig results print the same (hydration). */
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Icons placed evenly on a circle (cx, cy, r in a 210 × 297 mm viewBox). */
function ring(n: number, cx: number, cy: number, r: number) {
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return { x: r2(cx + Math.cos(a) * r), y: r2(cy + Math.sin(a) * r), a };
  });
}

function IconAt({ name, x, y, size, color, stroke = 1.6 }: { name: IconKey; x: number; y: number; size: number; color: string; stroke?: number }) {
  return (
    <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${size / 24})`}>
      <path d={CATEGORY_ICON_PATHS[name]} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

function Mark({ x, y, size, ring: ringColor }: { x: number; y: number; size: number; ring?: string }) {
  const inner = brandMarkSvg(64, { ring: ringColor }).replace(/<svg[^>]*>|<\/svg>/g, '');
  return <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${size / 64})`} dangerouslySetInnerHTML={{ __html: inner }} />;
}

function Corner({ x, y, sx, sy, color }: { x: number; y: number; sx: 1 | -1; sy: 1 | -1; color: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${sx} ${sy})`} stroke={color} fill="none" strokeWidth={0.4}>
      <path d="M0 14V0h14" />
      <path d="M3 9V3h6" />
      <circle cx="0" cy="0" r="0.9" fill={color} />
    </g>
  );
}

export function HarbourCover({ icons, categories, dateLabel }: CoverProps) {
  // Unique per instance: the preview, thumbnails and print copy are all in one document.
  const bg = `hn-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const gold = '#d9b468';
  const pts = ring(icons.length, 105, 118, 58);
  return (
    <svg viewBox="0 0 210 297" className="absolute inset-0 h-full w-full">
      <defs>
        <radialGradient id={bg} cx="50%" cy="38%" r="75%">
          <stop offset="0" stopColor="#24507e" />
          <stop offset="1" stopColor="#0c1f3a" />
        </radialGradient>
      </defs>
      <rect width="210" height="297" fill={`url(#${bg})`} />
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M-10 ${200 + i * 3.2} Q 52 ${192 + i * 3.2} 105 ${200 + i * 3.2} T 220 ${200 + i * 3.2}`} stroke="#ffffff" strokeOpacity={0.04 + i * 0.005} fill="none" strokeWidth="0.5" />
      ))}
      <rect x="9" y="9" width="192" height="279" fill="none" stroke={gold} strokeOpacity="0.55" strokeWidth="0.35" />
      <Corner x={13} y={13} sx={1} sy={1} color={gold} />
      <Corner x={197} y={13} sx={-1} sy={1} color={gold} />
      <Corner x={13} y={284} sx={1} sy={-1} color={gold} />
      <Corner x={197} y={284} sx={-1} sy={-1} color={gold} />
      <line x1="40" y1="32" x2="60" y2="32" stroke={gold} strokeWidth="0.3" />
      <line x1="150" y1="32" x2="170" y2="32" stroke={gold} strokeWidth="0.3" />
      <text x="105" y="33.2" textAnchor="middle" fontFamily="Inter, Arial" fontSize="3.2" letterSpacing="1.4" fill={gold}>
        CASH &amp; CARRY WHOLESALE
      </text>
      <circle cx="105" cy="118" r="70" fill="none" stroke={gold} strokeOpacity="0.5" strokeWidth="0.35" />
      <circle cx="105" cy="118" r="66" fill="none" stroke={gold} strokeOpacity="0.35" strokeWidth="0.25" strokeDasharray="0.6 1.4" />
      <circle cx="105" cy="118" r="48" fill="none" stroke={gold} strokeOpacity="0.6" strokeWidth="0.4" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="7.2" fill="#0e2747" stroke={gold} strokeWidth="0.45" />
          <IconAt name={icons[i]} x={p.x} y={p.y} size={8} color={gold} />
        </g>
      ))}
      <circle cx="105" cy="118" r="38" fill="#fbf7ee" stroke={gold} strokeWidth="0.8" />
      <Mark x={105} y={110} size={36} ring={gold} />
      <text x="105" y="139" textAnchor="middle" fontFamily="Cormorant Garamond, Georgia, serif" fontWeight="700" fontSize="8.5" fill="#173a5e">
        Harbourline
      </text>
      <text x="105" y="144.5" textAnchor="middle" fontFamily="Inter, Arial" fontSize="2.4" letterSpacing="1.6" fill="#5b6b7a">
        WHOLESALE
      </text>
      <text x="105" y="216" textAnchor="middle" fontFamily="Cormorant Garamond, Georgia, serif" fontWeight="600" fontSize="22" fill="#fbf7ee">
        Product Catalogue
      </text>
      <line x1="76" y1="226" x2="100" y2="226" stroke={gold} strokeWidth="0.35" />
      <rect x="103.4" y="224.4" width="3.2" height="3.2" transform="rotate(45 105 226)" fill={gold} />
      <line x1="110" y1="226" x2="134" y2="226" stroke={gold} strokeWidth="0.35" />
      <text x="105" y="238" textAnchor="middle" fontFamily="Inter, Arial" fontSize="3.6" fontWeight="600" letterSpacing="2.2" fill={gold}>
        {dateLabel.toUpperCase()}
      </text>
      <text x="105" y="250" textAnchor="middle" fontFamily="Cormorant Garamond, Georgia, serif" fontStyle="italic" fontSize="5.6" fill="#dbe4f0">
        Everything your shelves need, under one roof
      </text>
      <text x="105" y="275" textAnchor="middle" fontFamily="Inter, Arial" fontSize="2.3" letterSpacing="1" fill={gold} fillOpacity="0.85">
        {shortList(categories)}
      </text>
    </svg>
  );
}

const TILE_COLORS = ['#d9483b', '#e9822f', '#f2b134', '#7cb342', '#2e9e83', '#2b8cc4', '#3f5fb5', '#7b4fb0', '#c2457a', '#8d6e63', '#5c7c8a', '#4caf50'];

export function MarketCover({ icons, categories, dateLabel }: CoverProps) {
  const n = icons.length;
  const cx = 105;
  const cy = 170;
  const R1 = 44;
  const R2 = 72;
  const seg = (Math.PI * 2) / n;
  const tiles = Array.from({ length: n }, (_, i) => {
    const a0 = -Math.PI / 2 + i * seg + 0.035;
    const a1 = a0 + seg - 0.07;
    const p = (r: number, a: number) => `${r2(cx + Math.cos(a) * r)} ${r2(cy + Math.sin(a) * r)}`;
    const mid = (a0 + a1) / 2;
    return {
      d: `M${p(R1, a0)} L${p(R2, a0)} A${R2} ${R2} 0 0 1 ${p(R2, a1)} L${p(R1, a1)} A${R1} ${R1} 0 0 0 ${p(R1, a0)}Z`,
      ix: r2(cx + Math.cos(mid) * ((R1 + R2) / 2)),
      iy: r2(cy + Math.sin(mid) * ((R1 + R2) / 2)),
    };
  });
  const [day, ...rest] = dateLabel.split(' ');
  const year = rest.pop();
  return (
    <svg viewBox="0 0 210 297" className="absolute inset-0 h-full w-full">
      <rect width="210" height="297" fill="#fbf6ec" />
      {Array.from({ length: 22 }, (_, r) =>
        Array.from({ length: 30 }, (_, c) => <circle key={`${r}-${c}`} cx={8 + c * 6.8} cy={95 + r * 6.4} r="0.35" fill="#173a5e" fillOpacity="0.07" />)
      )}
      <rect x="16" y="20" width="10" height="0.8" fill="#7cb342" />
      <text x="16" y="17" fontFamily="Inter, Arial" fontSize="2.8" fontWeight="700" letterSpacing="1.4" fill="#d9483b">
        HARBOURLINE WHOLESALE
      </text>
      <text x="16" y="45" fontFamily="Playfair Display, Georgia, serif" fontWeight="800" fontSize="20" fill="#173a5e">
        Product
      </text>
      <text x="16" y="66" fontFamily="Playfair Display, Georgia, serif" fontStyle="italic" fontWeight="700" fontSize="20" fill="#173a5e">
        Catalogue
      </text>
      <text x="194" y="30" textAnchor="end" fontFamily="Inter, Arial" fontSize="2.6" letterSpacing="1.2" fill="#5b6b7a">
        EDITION
      </text>
      <text x="194" y="40" textAnchor="end" fontFamily="Playfair Display, Georgia, serif" fontStyle="italic" fontSize="7" fill="#173a5e">
        {day} {rest.join(' ')}
      </text>
      <text x="194" y="56" textAnchor="end" fontFamily="Playfair Display, Georgia, serif" fontWeight="800" fontSize="15" fill="#d9483b">
        {year}
      </text>
      <circle cx={cx} cy={cy} r={R2 + 6} fill="#ffffff" />
      <circle cx={cx} cy={cy} r={R2 + 6} fill="none" stroke="#e7dccb" strokeWidth="0.6" strokeDasharray="0.8 1.6" />
      {tiles.map((t, i) => (
        <g key={i}>
          <path d={t.d} fill={TILE_COLORS[i % TILE_COLORS.length]} />
          <IconAt name={icons[i]} x={t.ix} y={t.iy} size={11} color="#ffffff" stroke={1.8} />
        </g>
      ))}
      <circle cx={cx} cy={cy} r={R1 - 4} fill="#ffffff" />
      <circle cx={cx} cy={cy} r={R1 - 4} fill="none" stroke="#efe6d6" strokeWidth="1.2" />
      <Mark x={cx} y={cy - 6} size={34} />
      <text x={cx} y={cy + 20} textAnchor="middle" fontFamily="Cormorant Garamond, Georgia, serif" fontWeight="700" fontSize="7.5" fill="#173a5e">
        Harbourline
      </text>
      <path d="M150 92c18-10 32-6 40 2-14 8-28 8-40-2Z" fill="#7cb342" />
      <path d="M150 92c14 1 28 1 40 2" stroke="#4f7d22" strokeWidth="0.4" fill="none" />
      <path d="M22 238c12-12 26-12 36-6-12 10-24 12-36 6Z" fill="#7cb342" />
      <rect y="262" width="210" height="35" fill="#173a5e" />
      <rect y="261" width="210" height="1.2" fill="#d9483b" />
      <text x="16" y="276" fontFamily="Playfair Display, Georgia, serif" fontStyle="italic" fontWeight="700" fontSize="6" fill="#ffffff">
        Good food, well stocked.
      </text>
      <text x="16" y="284" fontFamily="Playfair Display, Georgia, serif" fontStyle="italic" fontSize="5" fill="#f2b134">
        Delivered to your door.
      </text>
      {[0, 1, 2].map((row) => (
        <text key={row} x="194" y={273 + row * 4.2} textAnchor="end" fontFamily="Inter, Arial" fontSize="2.3" letterSpacing="0.8" fill="#ffffff">
          {categories.slice(row * 3, row * 3 + 3).map((c) => c.toUpperCase()).join(' · ')}
        </text>
      ))}
    </svg>
  );
}

export function CoastalCover({ icons, categories, dateLabel }: CoverProps) {
  const bg = `ct-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const pts = ring(icons.length, 105, 120, 52);
  const light = '#d7f0ee';
  return (
    <svg viewBox="0 0 210 297" className="absolute inset-0 h-full w-full">
      <defs>
        <linearGradient id={bg} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f6f78" />
          <stop offset="1" stopColor="#0f3d4a" />
        </linearGradient>
      </defs>
      <rect width="210" height="297" fill={`url(#${bg})`} />
      {Array.from({ length: 7 }, (_, i) => (
        <circle key={i} cx="105" cy="120" r={64 + i * 9} fill="none" stroke="#ffffff" strokeOpacity={0.12 - i * 0.014} strokeWidth="0.35" />
      ))}
      <text x="105" y="24" textAnchor="middle" fontFamily="Inter, Arial" fontSize="2.8" letterSpacing="1.8" fill={light}>
        HARBOURLINE WHOLESALE
      </text>
      {pts.map((p, i) => (
        <IconAt key={i} name={icons[i]} x={p.x} y={p.y} size={8.5} color={light} stroke={1.4} />
      ))}
      <circle cx="105" cy="120" r="40" fill="#ffffff" fillOpacity="0.08" />
      <circle cx="105" cy="120" r="34" fill="#fdfbf6" />
      <Mark x={105} y={113} size={32} ring="#7fc4c9" />
      <text x="105" y="140" textAnchor="middle" fontFamily="Cormorant Garamond, Georgia, serif" fontWeight="700" fontSize="8" fill="#0f3d4a">
        Harbourline
      </text>
      <text x="105" y="214" textAnchor="middle" fontFamily="Cormorant Garamond, Georgia, serif" fontWeight="600" fontSize="21" fill="#ffffff">
        Product Catalogue
      </text>
      <line x1="80" y1="222" x2="130" y2="222" stroke={light} strokeWidth="0.3" />
      <text x="105" y="232" textAnchor="middle" fontFamily="Inter, Arial" fontSize="3.4" fontWeight="600" letterSpacing="2" fill={light}>
        {dateLabel.toUpperCase()}
      </text>
      <text x="105" y="244" textAnchor="middle" fontFamily="Cormorant Garamond, Georgia, serif" fontStyle="italic" fontSize="5.4" fill="#bfe3e0">
        Everything your shelves need, under one roof
      </text>
      <path d="M0 270 Q 52 262 105 270 T 210 270 V297 H0Z" fill="#0b3140" />
      <text x="105" y="284" textAnchor="middle" fontFamily="Inter, Arial" fontSize="2.3" letterSpacing="1" fill={light}>
        {shortList(categories)}
      </text>
    </svg>
  );
}

export const COVER_COMPONENTS = { harbour: HarbourCover, market: MarketCover, coastal: CoastalCover } as const;
