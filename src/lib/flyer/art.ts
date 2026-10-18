/**
 * Generated A4 promotional posters (the "flyer images" focals are placed on).
 * 840 × 1188 viewBox = A4 at 4 px/mm. Each design leaves open space where
 * the seeded focals sit.
 */
import type { FlyerArt } from '../data/flyers';
import { brandMarkSvg } from '../brand';

const W = 840;
const H = 1188;

function mark(x: number, y: number, size: number, light = false) {
  const inner = brandMarkSvg(size).replace(/<svg[^>]*>|<\/svg>/g, '');
  return `<g transform="translate(${x} ${y}) scale(${size / 64})">${inner}</g>
<text x="${x + size + 14}" y="${y + size * 0.48}" font-family="Georgia, serif" font-size="${size * 0.42}" font-weight="700" fill="${light ? '#fff' : '#173a5e'}">Harbourline</text>
<text x="${x + size + 15}" y="${y + size * 0.8}" font-family="Arial, sans-serif" font-size="${size * 0.2}" letter-spacing="3" fill="${light ? '#ffffffcc' : '#5b6b7a'}">WHOLESALE</text>`;
}

function footer(bg: string, fg: string, text: string) {
  return `<rect y="${H - 70}" width="${W}" height="70" fill="${bg}"/>
<text x="40" y="${H - 28}" font-family="Arial, sans-serif" font-size="20" fill="${fg}">${text}</text>
<text x="${W - 40}" y="${H - 28}" text-anchor="end" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="${fg}">harbourline.example</text>`;
}

function dots(color: string, x0: number, y0: number, cols: number, rows: number, gap = 22) {
  let s = '';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) s += `<circle cx="${x0 + c * gap}" cy="${y0 + r * gap}" r="3" fill="${color}"/>`;
  return s;
}

const ART: Record<FlyerArt, () => string> = {
  'summer-grill': () => `
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb347"/><stop offset="1" stop-color="#ff6b3d"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#g)"/>
<circle cx="700" cy="170" r="120" fill="#ffe08a" opacity=".85"/>
<g stroke="#ffe08a" stroke-width="8" stroke-linecap="round" opacity=".8">${Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return `<line x1="${700 + Math.cos(a) * 140}" y1="${170 + Math.sin(a) * 140}" x2="${700 + Math.cos(a) * 175}" y2="${170 + Math.sin(a) * 175}"/>`;
  }).join('')}</g>
${mark(40, 40, 64, true)}
<text x="40" y="300" font-family="Georgia, serif" font-weight="700" font-size="104" fill="#fff">Summer</text>
<text x="40" y="400" font-family="Georgia, serif" font-weight="700" font-style="italic" font-size="104" fill="#3b1d0f">Grill</text>
<text x="44" y="452" font-family="Arial, sans-serif" font-size="26" fill="#fff" letter-spacing="2">SAUCES · DRINKS · SNACKS FOR THE SEASON</text>
<rect x="30" y="480" width="${W - 60}" height="540" rx="28" fill="#fff" opacity=".22"/>
<path d="M0 1050 Q210 1000 420 1050 T840 1050 V${H} H0z" fill="#3b1d0f" opacity=".25"/>
${footer('#3b1d0f', '#ffe9d6', 'Offers valid while stocks last')}`,
  'spice-week': () => `
<rect width="${W}" height="${H}" fill="#2b1a12"/>
${dots('#c0612b', 520, 70, 13, 9)}
<circle cx="150" cy="1000" r="260" fill="#c0612b" opacity=".35"/>
<circle cx="760" cy="1060" r="200" fill="#e9b44c" opacity=".25"/>
${mark(40, 40, 60, true)}
<text x="40" y="300" font-family="Georgia, serif" font-size="40" fill="#e9b44c" letter-spacing="6">ONE WEEK ONLY</text>
<text x="40" y="420" font-family="Georgia, serif" font-weight="700" font-size="128" fill="#fff">Spice</text>
<text x="40" y="540" font-family="Georgia, serif" font-weight="700" font-style="italic" font-size="128" fill="#e9b44c">Week</text>
<text x="44" y="580" font-family="Arial, sans-serif" font-size="24" fill="#f3e6d8" letter-spacing="2">GROUND · WHOLE · BLENDS</text>
<rect x="40" y="580" width="${W - 80}" height="330" fill="none"/>
${footer('#c0612b', '#fff', 'Mix and match across the range')}`,
  breakfast: () => `
<rect width="${W}" height="${H}" fill="#f6efe2"/>
<rect x="0" y="0" width="${W}" height="520" fill="#9ccfc1"/>
<circle cx="230" cy="620" r="210" fill="#fff"/>
<circle cx="230" cy="620" r="170" fill="#f6efe2"/>
<ellipse cx="230" cy="600" rx="90" ry="70" fill="#f7c948"/>
<path d="M480 860c0-80 60-130 140-130s140 50 140 130z" fill="#c97b4a"/>
<rect x="540" y="690" width="160" height="40" rx="20" fill="#7a4a2a"/>
${mark(40, 40, 60)}
<text x="40" y="300" font-family="Georgia, serif" font-weight="700" font-size="96" fill="#173a5e">Breakfast</text>
<text x="40" y="400" font-family="Georgia, serif" font-style="italic" font-size="96" fill="#fff">Table</text>
<text x="44" y="460" font-family="Arial, sans-serif" font-size="24" fill="#173a5e" letter-spacing="2">TEA · COFFEE · MALT DRINKS</text>
${footer('#173a5e', '#fff', 'New lines every month')}`,
  'world-snacks': () => `
<rect width="${W}" height="${H}" fill="#5b3fa8"/>
${Array.from({ length: 9 }, (_, i) => `<rect x="${-200 + i * 140}" y="-100" width="60" height="1500" fill="#ffffff" opacity=".06" transform="rotate(20 420 594)"/>`).join('')}
${mark(40, 40, 60, true)}
<text x="40" y="340" font-family="Arial, sans-serif" font-weight="900" font-size="120" fill="#ffd23f">WORLD</text>
<text x="40" y="460" font-family="Arial, sans-serif" font-weight="900" font-size="120" fill="#fff">SNACKS</text>
<circle cx="640" cy="760" r="180" fill="#ffd23f"/>
<text x="640" y="740" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="64" fill="#5b3fa8">3 FOR 2</text>
<text x="640" y="800" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="#5b3fa8">on all crisps</text>
${footer('#2e1f5e', '#fff', 'Crisps, nuts and savoury mixes')}`,
  'pantry-saver': () => `
<rect width="${W}" height="${H}" fill="#fdf6e9"/>
<rect width="${W}" height="380" fill="#173a5e"/>
<path d="M0 380 Q420 460 840 380 V420 Q420 500 0 420z" fill="#e9b44c"/>
${mark(40, 40, 60, true)}
<text x="40" y="250" font-family="Georgia, serif" font-weight="700" font-size="100" fill="#fff">Pantry Savers</text>
<text x="44" y="310" font-family="Arial, sans-serif" font-size="26" fill="#cfe3f0" letter-spacing="2">STOCK UP ON THE ESSENTIALS</text>
${dots('#e9b44c55', 40, 960, 36, 3)}
${footer('#173a5e', '#fff', 'Bulk prices on rice, tins and pulses')}`,
  'cool-drinks': () => `
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2bb3c0"/><stop offset="1" stop-color="#1d6fa3"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#g)"/>
${Array.from({ length: 14 }, (_, i) => `<circle cx="${(i * 137) % W}" cy="${200 + ((i * 251) % 900)}" r="${10 + (i % 4) * 9}" fill="#fff" opacity=".18"/>`).join('')}
${mark(40, 40, 60, true)}
<text x="40" y="320" font-family="Arial, sans-serif" font-weight="900" font-size="120" fill="#fff">Cool</text>
<text x="40" y="440" font-family="Arial, sans-serif" font-weight="900" font-size="120" fill="#bff3f7">Drinks</text>
<text x="44" y="496" font-family="Arial, sans-serif" font-size="26" fill="#fff" letter-spacing="2">JUICES · SODAS · WATER</text>
${footer('#124a6e', '#fff', 'Chilled range now in stock')}`,
};

export function flyerArtSvg(art: FlyerArt): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${ART[art]()}</svg>`;
}
