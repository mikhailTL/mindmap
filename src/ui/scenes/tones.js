/* The site's scene palette, in daylight. Owner, 19 October: "too many black
 * gradient backgrounds, needs to fit site more while maintaining technological
 * edge". So every scene now sits on the site's own light grounds: white or
 * paper running to pale mint or pale sky, one soft turquoise light, contour
 * lines in light mint over a fine grid, and deep green ink for the drawing and
 * the words. The Toolkit's nameplates keep their deep, many coloured skies, so
 * the Toolkit is still the colourful one.
 *
 *   sky    three stops, left to right (or top to bottom on a band).
 *   ridge  the layered hills, far to near.
 *   glow   the light source.        shade  the tint of a soft shadow.
 *   line   contour lines.           grid   the fine grid under them.
 *   ink    a title.  sub  a line under it.  lit  a green word or mark.
 *
 * Words may sit on any of the three sky stops. Measured (contrast() below),
 * on sky[0] : sky[1] : sky[2]:
 *   mint   ink 15.20 : 14.04 : 12.86   sub 8.25 : 7.62 : 6.98   lit 5.80 : 5.36 : 4.91
 *   sky    ink 15.20 : 13.91 : 12.58   sub 8.25 : 7.55 : 6.83   lit 5.80 : 5.31 : 4.80
 *   paper  ink 15.20 : 14.09 : 12.91   sub 8.25 : 7.65 : 7.01   lit 5.80 : 5.38 : 4.93
 * accent.ink, the hero's label, is 7.03 or more on all nine. */

export const TONES = {
  mint:  { sky: ['#ffffff', '#eff8f3', '#dcf1e6'], ridge: ['#e2f3ea', '#d2ecde', '#c1e3d1'],
           glow: '#7fd8e6', shade: '29 143 176', line: '#8fd6b8', grid: '#1d8fb0',
           ink: '#0d2b1e', sub: '#2a5744', lit: '#157446' },
  sky:   { sky: ['#ffffff', '#eef6fb', '#dcecf6'], ridge: ['#e0eef6', '#d0e4f0', '#bfd9e9'],
           glow: '#7fd8e6', shade: '29 143 176', line: '#93d6c4', grid: '#1d8fb0',
           ink: '#0d2b1e', sub: '#2a5744', lit: '#157446' },
  paper: { sky: ['#ffffff', '#f0f8f6', '#dff0ee'], ridge: ['#e3f2ef', '#d3ebe6', '#c3e2dc'],
           glow: '#8fe0d8', shade: '21 116 70', line: '#8fd6b8', grid: '#157446',
           ink: '#0d2b1e', sub: '#2a5744', lit: '#157446' },
}

/* A soft shadow in the tone's own colour, so a light card still lifts. */
export const glowShadow = (tone, s = '0 22px 44px -26px') =>
  `0 1px 2px rgb(13 43 30 / 0.06), ${s} rgb(${TONES[tone].shade} / 0.45)`

/* System monospace for the scenes' small labels: the technical edge. */
export const MICRO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
export function luminance(hex) {
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16))
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}
export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}
