/* One colour family per tool, from the site's calm palette.
 *
 * 17 OCTOBER: the owner asked for the neo-brutalist look to go and for
 * "different coloration to look nice". So the hard offset shadow, the heavy
 * ink edge and the five green-only families are gone. Each tool now takes one
 * of the eight hue families already in tailwind.config.js (coral, lilac, sun,
 * mint, sky, blush, aqua, accent green), written here as hex because they are
 * handed to CSS custom properties rather than to class names.
 *
 *   tint  the wash. A pale ground for an icon or a selected row. ink, ink-2
 *         and the family's own deep all clear 4.5 : 1 on it.
 *   deep  the family ink. Clears 4.5 : 1 on its own tint and on white, and
 *         white clears 4.5 : 1 on it, so it can be a word or a button fill.
 *   art   the family graphic tone. 3 : 1 on white, never a word.
 *
 * The five older keys (leaf, tide, stone, night, pool) are kept as aliases so
 * every tool that already passes one still draws, now in a real colour. */

const GLOW = '#3ecf9a'

const HUES = {
  coral:  { tint:'#ffe8e0', deep:'#b23009', art:'#f25424' },
  lilac:  { tint:'#f6e8ff', deep:'#6f09b2', art:'#a024f2' },
  sun:    { tint:'#f5ecd7', deep:'#825d07', art:'#b5871b' },
  mint:   { tint:'#d5f2e8', deep:'#067049', art:'#18a370' },
  sky:    { tint:'#def0fc', deep:'#0967ab', art:'#2294e6' },
  blush:  { tint:'#fce6f1', deep:'#b2095e', art:'#f2248b' },
  aqua:   { tint:'#ddf0f8', deep:'#11677f', art:'#1d8fb0' },
  accent: { tint:'#dcefe4', deep:'#0f5836', art:'#157446' },
}

export const FAMILIES = {
  ...HUES,
  leaf:  HUES.accent,
  tide:  HUES.sky,
  stone: HUES.aqua,
  night: HUES.lilac,
  pool:  HUES.mint,
}

export const HUE_NAMES = Object.keys(HUES)

export function vars(name) {
  const f = FAMILIES[name] || FAMILIES.accent
  return { '--kit-tint':f.tint, '--kit-deep':f.deep, '--kit-art':f.art, '--kit-glow':GLOW }
}

export const familyOf = name => FAMILIES[name] || FAMILIES.accent
