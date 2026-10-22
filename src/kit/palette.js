// One colour family per activity, as hex copies of tailwind.config.js tokens, passed on as CSS custom properties.
// tint: card ground. deep: text, 4.5:1 on tint and card. art: graphic fills, 3:1. glow: only on deep or ink.
const GLOW = '#3ecf9a'                                   // accent.lit

export const FAMILIES = {
  sky:   { tint:'#ddf0f8', deep:'#11677f', art:'#1d8fb0', glow:GLOW },
  leaf:  { tint:'#dcefe4', deep:'#0f5836', art:'#157446', glow:GLOW },
  sand:  { tint:'#edf7f7', deep:'#0f5836', art:'#11677f', glow:GLOW },
  stone: { tint:'#cee8ea', deep:'#2a5744', art:'#426a58', glow:GLOW },
  dusk:  { tint:'#e3ede7', deep:'#0d2b1e', art:'#157446', glow:GLOW },
}

export const OWNS = {
  pacer:'sky', feelings:'leaf', words:'sand', senses:'stone', pile:'dusk',
  openers:'leaf', phrase:'sky', meaning:'stone', before:'dusk', worried:'sand',
}

export function vars(id) {
  const f = FAMILIES[OWNS[id]] || FAMILIES.leaf
  return { '--kit-tint':f.tint, '--kit-deep':f.deep, '--kit-art':f.art, '--kit-glow':f.glow }
}

export const familyOf = id => FAMILIES[OWNS[id]] || FAMILIES.leaf

export function varsFamily(name) {
  const f = FAMILIES[name] || FAMILIES.leaf
  return { '--kit-tint':f.tint, '--kit-deep':f.deep, '--kit-art':f.art, '--kit-glow':f.glow }
}
