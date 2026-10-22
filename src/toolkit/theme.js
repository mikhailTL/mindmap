const GLOW = '#3ecf9a'

// tint: pale ground. deep: text and button fill, 4.5:1 on tint and on white. art: graphics only, 3:1 on white.
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
  // Alias names for callers that pass leaf, tide, stone, night or pool.
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
