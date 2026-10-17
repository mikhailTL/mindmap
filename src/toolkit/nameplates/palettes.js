/* One palette per toolkit nameplate.
 *
 *   fade  the open sky on the left of the banner, where the title sits. The
 *         scene's own sky starts on this colour, so the words sit in calm
 *         space rather than on a box.
 *   ink   the title. Clears 4.5 : 1 on `fade` (tests/nameplates.test.js).
 *   sub   the short line under it. Also clears 4.5 : 1 on `fade`.
 *   glow  the soft coloured shadow a card casts when a pointer is on it.
 *
 * Some banners are deep (white words), some are light (dark words), so a
 * column of them never reads as one card repeated. Kept in plain JS, apart
 * from the drawings, so the contrast test can read it without JSX. */

export const PALETTES = {
  /* student exercises */
  breathing: { fade:'#173a6b', ink:'#ffffff', sub:'#d6e6ff', glow:'#3a6fb0' },
  ground:    { fade:'#ffd56b', ink:'#3d2400', sub:'#573605', glow:'#ffad33' },
  reframe:   { fade:'#4d2380', ink:'#ffffff', sub:'#eadcff', glow:'#c46bc4' },
  scan:      { fade:'#0b5a44', ink:'#ffffff', sub:'#d2f5e6', glow:'#4cc59a' },
  move:      { fade:'#a8361a', ink:'#ffffff', sub:'#ffe2d6', glow:'#ff9466' },
  sigh:      { fade:'#6b2c55', ink:'#ffffff', sub:'#ffe0ec', glow:'#ff8a6a' },
  chest:     { fade:'#8c1550', ink:'#ffffff', sub:'#ffe0ee', glow:'#ff7ab4' },
  steady:    { fade:'#134d36', ink:'#ffffff', sub:'#d6f3e3', glow:'#5bbf86' },
  alert:     { fade:'#1b1745', ink:'#ffffff', sub:'#dcd7ff', glow:'#9a8cff' },
  pocket:    { fade:'#262b80', ink:'#ffffff', sub:'#dfe3ff', glow:'#8a96f0' },
  walk:      { fade:'#d4efff', ink:'#0d2b1e', sub:'#24493a', glow:'#5cb85c' },

  /* parent tools */
  openers:   { fade:'#b0391c', ink:'#ffffff', sub:'#ffe4da', glow:'#ff9b6e' },
  phrasing:  { fade:'#5a2a8c', ink:'#ffffff', sub:'#efe2ff', glow:'#c693e8' },
  score:     { fade:'#0d5590', ink:'#ffffff', sub:'#d9ecff', glow:'#7cc4f0' },
  rules:     { fade:'#ffe6a8', ink:'#3d2a00', sub:'#5a4006', glow:'#ffc76a' },
  reach:     { fade:'#0d4a52', ink:'#ffffff', sub:'#d3f2f2', glow:'#4fb3b0' },

  /* medical professional tools */
  'pro-opener':   { fade:'#1a3f73', ink:'#ffffff', sub:'#dce8ff', glow:'#ffd98a' },
  'pro-triage':   { fade:'#ffdf8f', ink:'#3a2600', sub:'#573b00', glow:'#ffb85a' },
  'pro-ground':   { fade:'#2d5a1e', ink:'#ffffff', sub:'#e2f5d6', glow:'#8cc65a' },
  'pro-parents':  { fade:'#3f2272', ink:'#ffffff', sub:'#e9ddff', glow:'#a476d6' },
  'pro-referral': { fade:'#cde9ff', ink:'#0b2f55', sub:'#1d4570', glow:'#6fb6ee' },

  /* life skills: school */
  'school-cram':        { fade:'#0e4f8a', ink:'#ffffff', sub:'#dcecff', glow:'#6fb6ee' },
  'school-sources':     { fade:'#e7dcff', ink:'#2e1155', sub:'#47237a', glow:'#c3a8ff' },
  'school-good-enough': { fade:'#ffc9a8', ink:'#4a1a05', sub:'#6a2a0c', glow:'#ff9e72' },
  'school-active':      { fade:'#0f5a4a', ink:'#ffffff', sub:'#d4f5ea', glow:'#5cc9a2' },
  /* outside */
  'outside-feed':     { fade:'#1f2f6b', ink:'#ffffff', sub:'#dde5ff', glow:'#6f8fd8' },
  'outside-conflict': { fade:'#f4ddff', ink:'#351457', sub:'#4e2479', glow:'#e0bcff' },
  'outside-no':       { fade:'#7a1f5c', ink:'#ffffff', sub:'#ffdcf0', glow:'#ff8fb3' },
  /* life */
  'life-home':   { fade:'#ffd8c2', ink:'#4a1c0a', sub:'#6b2d12', glow:'#ffb08a' },
  'life-money':  { fade:'#c9f2dd', ink:'#0b3d28', sub:'#175a3d', glow:'#5fcf98' },
  'life-stress': { fade:'#2b4f7a', ink:'#ffffff', sub:'#dbe9fb', glow:'#8fbce0' },
  'life-health': { fade:'#a8344d', ink:'#ffffff', sub:'#ffe1e7', glow:'#ff9a8a' },
  /* career */
  'career-explore':  { fade:'#fff0b8', ink:'#3b2a00', sub:'#5a4200', glow:'#ffc96a' },
  'career-email':    { fade:'#0f4c75', ink:'#ffffff', sub:'#d8ecfb', glow:'#6fb6dc' },
  'career-feedback': { fade:'#1f5e2e', ink:'#ffffff', sub:'#dcf4d6', glow:'#86c96a' },
  'career-belong':   { fade:'#8a2c6b', ink:'#ffffff', sub:'#ffe0f3', glow:'#f08fc0' },
}

/* A tool added later without a palette of its own still gets a readable
   banner: its family's deep colour with white words. */
const BY_FAMILY = {
  coral:'#b23009', lilac:'#6f09b2', sun:'#825d07', mint:'#067049',
  sky:'#0967ab', blush:'#b2095e', aqua:'#11677f', accent:'#0f5836',
}

export function paletteFor(id, family) {
  if (PALETTES[id]) return PALETTES[id]
  const fade = BY_FAMILY[family] || BY_FAMILY.accent
  return { fade, ink:'#ffffff', sub:'#ffffff', glow:fade }
}

/* WCAG relative luminance and contrast, for the test and for anyone adding
   a palette. */
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
