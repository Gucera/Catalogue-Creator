/**
 * Generated "packshot" photos. Each SKU gets a stable SVG drawing of a pack
 * (jar, bottle, can …) in its own colour, so the demo needs no real photos.
 */
import type { PackShape } from '../data/seed';

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function splitTitle(title: string): [string, string, string] {
  const words = title.split(' ');
  const brand = words[0] === 'Golden' || words[0] === 'Old' || words[0] === 'Copper' || words[0] === 'Little' || words[0] === 'Silver' || words[0] === 'Red' || words[0] === 'Bluebell'
    ? words.splice(0, 2).join(' ')
    : words.splice(0, 1).join(' ');
  const rest = words.join(' ');
  if (rest.length <= 14) return [brand, rest, ''];
  const mid = rest.lastIndexOf(' ', Math.ceil(rest.length / 2) + 3);
  return mid > 0 ? [brand, rest.slice(0, mid), rest.slice(mid + 1)] : [brand, rest, ''];
}

type Body = { path: string; label: { x: number; y: number; w: number; h: number }; extra?: string };

function body(shape: PackShape, c: string, dark: string, light: string): Body {
  switch (shape) {
    case 'jar':
      return {
        path: `<rect x="120" y="70" width="160" height="42" rx="8" fill="${dark}"/><rect x="104" y="108" width="192" height="232" rx="34" fill="${c}"/>`,
        label: { x: 104, y: 168, w: 192, h: 116 },
      };
    case 'bottle':
      return {
        path: `<rect x="176" y="40" width="48" height="30" rx="6" fill="${dark}"/><path d="M182 70h36v40c0 18 46 28 46 70v158a14 14 0 0 1-14 14H150a14 14 0 0 1-14-14V180c0-42 46-52 46-70z" fill="${c}"/>`,
        label: { x: 136, y: 200, w: 128, h: 110 },
      };
    case 'can':
      return {
        path: `<rect x="112" y="84" width="176" height="244" fill="${c}"/><ellipse cx="200" cy="84" rx="88" ry="18" fill="${light}"/><ellipse cx="200" cy="84" rx="74" ry="12" fill="#d4d4d8"/><ellipse cx="200" cy="328" rx="88" ry="18" fill="${dark}"/>`,
        label: { x: 112, y: 140, w: 176, h: 124 },
      };
    case 'bag':
      return {
        path: `<path d="M110 70h180l-4 14 6 12-6 12c18 40 22 100 22 150 0 40-8 70-12 82H104c-4-12-12-42-12-82 0-50 4-110 22-150l-6-12 6-12z" fill="${c}"/>`,
        label: { x: 110, y: 168, w: 180, h: 120 },
      };
    case 'box':
      return {
        path: `<path d="M276 96l34-24v236l-34 24z" fill="${dark}"/><path d="M92 96l34-24h184l-34 24z" fill="${light}"/><rect x="92" y="96" width="184" height="236" fill="${c}"/>`,
        label: { x: 92, y: 160, w: 184, h: 112 },
      };
    case 'tub':
      return {
        path: `<rect x="96" y="104" width="208" height="30" rx="8" fill="${dark}"/><path d="M106 134h188l-18 196H124z" fill="${c}"/>`,
        label: { x: 114, y: 176, w: 172, h: 104 },
      };
    case 'sachet':
    default:
      return {
        path: `<path d="M112 80l11-10 11 10 11-10 11 10 11-10 11 10 11-10 11 10 11-10 11 10 11-10 11 10 11-10 11 10 11-10 10 10v258H112z" fill="${c}"/>`,
        label: { x: 112, y: 160, w: 176, h: 122 },
      };
  }
}

export function packshotSvg(opts: { title: string; size: string; shape: PackShape; hue: number; sku: string }): string {
  const c = `hsl(${opts.hue} 58% 46%)`;
  const dark = `hsl(${opts.hue} 55% 30%)`;
  const light = `hsl(${opts.hue} 60% 70%)`;
  const b = body(opts.shape, c, dark, light);
  const [brand, l1, l2] = splitTitle(opts.title);
  const L = b.label;
  const cx = L.x + L.w / 2;
  const fit = (s: string, max: number) => Math.min(max, Math.floor((L.w - 16) / Math.max(s.length, 1) / 0.56));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
<defs>
<radialGradient id="bg" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#eceff2"/></radialGradient>
<linearGradient id="shine" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.18" stop-color="#fff" stop-opacity="0.28"/><stop offset="0.3" stop-color="#fff" stop-opacity="0"/><stop offset="0.85" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.18"/></linearGradient>
<clipPath id="body">${b.path.replace(/fill="[^"]*"/g, '')}</clipPath>
</defs>
<rect width="400" height="400" fill="url(#bg)"/>
<ellipse cx="200" cy="350" rx="120" ry="14" fill="#000" opacity="0.10"/>
${b.path}
<rect x="${L.x}" y="${L.y}" width="${L.w}" height="${L.h}" fill="#fffdf8"/>
<rect x="${L.x}" y="${L.y}" width="${L.w}" height="6" fill="${dark}"/>
<text x="${cx}" y="${L.y + 30}" text-anchor="middle" font-family="Georgia, 'DejaVu Serif', serif" font-style="italic" font-size="${fit(brand, 22)}" fill="${dark}">${esc(brand)}</text>
<text x="${cx}" y="${L.y + 60}" text-anchor="middle" font-family="Arial, 'DejaVu Sans', sans-serif" font-weight="700" font-size="${fit(l1, 20)}" fill="#1f2937">${esc(l1.toUpperCase())}</text>
${l2 ? `<text x="${cx}" y="${L.y + 82}" text-anchor="middle" font-family="Arial, 'DejaVu Sans', sans-serif" font-weight="700" font-size="${fit(l2, 20)}" fill="#1f2937">${esc(l2.toUpperCase())}</text>` : ''}
<text x="${cx}" y="${L.y + L.h - 10}" text-anchor="middle" font-family="Arial, 'DejaVu Sans', sans-serif" font-size="12" fill="#6b7280">${esc(opts.size.split('×').pop()!.trim())}</text>
<rect x="80" y="30" width="240" height="320" fill="url(#shine)" clip-path="url(#body)"/>
</svg>`;
}
