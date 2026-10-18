/** Fictional brand mark (string form, for generated SVG art and covers). */
export function brandMarkSvg(size = 64, opts: { ring?: string; fill?: string; wave?: string } = {}): string {
  const fill = opts.fill ?? '#173a5e';
  const wave = opts.wave ?? '#7fc4c9';
  const ring = opts.ring ?? '#e9b44c';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">
<circle cx="32" cy="32" r="30" fill="${fill}"/>
<circle cx="32" cy="32" r="27" fill="none" stroke="${ring}" stroke-width="1.6"/>
<path d="M14 36c4-3 8-3 12 0s8 3 12 0 8-3 12 0" fill="none" stroke="${wave}" stroke-width="3.2" stroke-linecap="round"/>
<path d="M14 43c4-3 8-3 12 0s8 3 12 0 8-3 12 0" fill="none" stroke="${wave}" stroke-width="3.2" stroke-linecap="round" opacity=".6"/>
<path d="M22 31V16M42 31V16M22 23h20" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
</svg>`;
}
