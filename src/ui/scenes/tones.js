/* The site's scene palette. The Toolkit's nameplates have a sky of their own
 * per activity (navy, plum, sun, coral), playful and many coloured. The site
 * scenes stay inside the brand instead: deep green ink running to teal and
 * turquoise, contour lines (the "map" in MindMap) and one soft light source.
 * So the two are related (gradient grounds, layered depth, glow, slow loops)
 * and the Toolkit still stands out as the colourful one.
 *
 *   sky    three stops, left to right (or top to bottom on a band).
 *   ridge  the layered hills, far to near.
 *   glow   the light source.
 *   line   contour lines, drawn at low opacity.
 *   ink    a title on `sky[0]`.   sub  a line under it, also on `sky[0]`.
 *
 * Text only ever sits on `sky[0]` or on a solid panel of it, so the ratios
 * are exact. Measured (contrast() below), ink : sub on sky[0] and on sky[1]:
 *   dusk    15.20 : 12.25   and  11.68 : 9.41
 *   lagoon  15.07 : 12.35   and  10.34 : 8.47
 *   tide    16.02 : 12.62   and  12.00 : 9.45
 *   dawn    14.20 :  7.71   and  13.26 : 7.20 (accent 4.67 at sky[2])
 * accent-lit on dusk: 7.67 on sky[0], 5.89 on sky[1]. */

export const TONES = {
  dusk:   { sky: ['#0d2b1e', '#11402f', '#1a6450'], ridge: ['#18573f', '#124632', '#0c3324'],
            glow: '#3ecf9a', line: '#bff5dc', ink: '#ffffff', sub: '#cfeedd', lit: '#3ecf9a' },
  lagoon: { sky: ['#0b2a33', '#0f4656', '#1a7189'], ridge: ['#156176', '#0f4b5c', '#0a3542'],
            glow: '#7fdcf0', line: '#c9f1fb', ink: '#ffffff', sub: '#d3edf5', lit: '#7fdcf0' },
  tide:   { sky: ['#0c2430', '#123b4a', '#1c5a6e'], ridge: ['#1a5468', '#134456', '#0d3140'],
            glow: '#9fe8d0', line: '#d2f4ea', ink: '#ffffff', sub: '#cfe9ee', lit: '#3ecf9a' },
  dawn:   { sky: ['#f1f9f6', '#e2f3f1', '#d2ebf2'], ridge: ['#c7e5e3', '#b5dcdc', '#a3d2d5'],
            glow: '#ffffff', line: '#1d8fb0', ink: '#0d2b1e', sub: '#2a5744', lit: '#157446' },
}

/* The four signals, lifted so each reads as a light on the deep grounds
   (each clears 3 : 1 as a graphic on every dark sky[0]). The names beside
   them carry the meaning; the colour never does alone. */
export const SIGNAL_LIT = { heart: '#ff7a7a', sweat: '#ffad5c', temp: '#6fdc6f', move: '#7fb0ff' }

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
