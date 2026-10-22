// Before/after camera pulse pairs around each exercise, ranked by mean heart-rate drop.
export const TOOL_NAMES = {
  breathing: 'Box Breathing',
  scan:      'Body Scan',
  move:      'Movement Break',
  ground:    'Grounding',
  reframe:   'Thought Reframe',
  sigh:      'Long Exhale',
  chest:     'Breath Counter',
  steady:    'Hold Still',
  walk:      'Short Walk',
  pocket:    'Breathing by Sound',
  alert:     'Reaction Test',
}

// Lowercase names for tools whose title reads badly mid-sentence.
const IN_SENTENCE = { walk: 'walk', pocket: 'sound breathing' }

export const MIN_PAIRS = 2

export const toolName = tool => TOOL_NAMES[tool] || String(tool ?? '')

const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : null)

// Positive hrDrop means the pulse fell. A missing RMSSD gives a null hrvRise rather than 0.
export function effectOf(before, after) {
  const hb = num(before?.hr), ha = num(after?.hr)
  const vb = num(before?.rmssd), va = num(after?.rmssd)
  return {
    hrDrop: hb != null && ha != null ? hb - ha : null,
    hrvRise: vb != null && va != null ? va - vb : null,
  }
}

const mean = a => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null)

// Tools with fewer than MIN_PAIRS pairs sort after the ranked ones, with null means.
export function rankTools(pairs) {
  const byTool = new Map()
  for (const p of Array.isArray(pairs) ? pairs : []) {
    if (!p || typeof p.tool !== 'string' || !p.tool) continue
    const e = effectOf(p.before, p.after)
    if (e.hrDrop == null) continue
    if (!byTool.has(p.tool)) byTool.set(p.tool, { drops: [], rises: [] })
    const g = byTool.get(p.tool)
    g.drops.push(e.hrDrop)
    if (e.hrvRise != null) g.rises.push(e.hrvRise)
  }
  const rows = []
  for (const [tool, g] of byTool) {
    const n = g.drops.length
    const ranked = n >= MIN_PAIRS
    rows.push({
      tool, n,
      meanHrDrop: ranked ? mean(g.drops) : null,
      meanHrvRise: ranked && g.rises.length >= MIN_PAIRS ? mean(g.rises) : null,
    })
  }
  return rows.sort((a, b) => {
    const ra = a.meanHrDrop != null, rb = b.meanHrDrop != null
    if (ra !== rb) return ra ? -1 : 1
    if (ra && a.meanHrDrop !== b.meanHrDrop) return b.meanHrDrop - a.meanHrDrop
    if (a.n !== b.n) return b.n - a.n
    return toolName(a.tool).localeCompare(toolName(b.tool))
  })
}

export function effectWords(tool, meanHrDrop) {
  const name = toolName(tool)
  const lower = (IN_SENTENCE[tool] || name).toLowerCase()
  const d = num(meanHrDrop)
  if (d == null) return `Two checks after the ${lower} are needed.`
  const r = Math.round(Math.abs(d))
  if (r === 0) return `After the ${lower} your pulse is about the same.`
  const beats = r === 1 ? 'beat' : 'beats'
  const dir = d > 0 ? 'lower' : 'higher'
  return `After the ${lower} your pulse is ${r} ${beats} ${dir}.`
}
