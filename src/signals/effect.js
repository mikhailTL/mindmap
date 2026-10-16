/* Did it work. The loop between an exercise and a measurement.
 *
 * A pair is one tool, one camera pulse taken before it and one taken after.
 * The effect of a pair is how far the pulse fell and, where the camera
 * resolved it, how far the beat-to-beat variation rose. Ranking a tool asks
 * for at least two pairs, because one pair is one afternoon, not a pattern.
 *
 * Pure: no DOM, no store, no clock. The readings come from ppg.js by way of
 * the `effects` slot in src/app/store.js; nothing here knows where they were
 * taken or who took them. */

export const TOOL_NAMES = {
  breathing: 'Box breathing',
  scan:      'Body scan',
  move:      'Movement break',
  ground:    'Grounding',
  reframe:   'Thought reframe',
  sigh:      'Sigh coach',
  chest:     'Chest breathing',
  steady:    'Steady hand',
}

export const MIN_PAIRS = 2

export const toolName = tool => TOOL_NAMES[tool] || String(tool ?? '')

const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/* Positive hrDrop: the pulse fell. Positive hrvRise: the variation rose.
   Either RMSSD missing (the camera could not resolve it) gives a null rise,
   never a zero: an unknown is not the same as no change. */
export function effectOf(before, after) {
  const hb = num(before?.hr), ha = num(after?.hr)
  const vb = num(before?.rmssd), va = num(after?.rmssd)
  return {
    hrDrop: hb != null && ha != null ? hb - ha : null,
    hrvRise: vb != null && va != null ? va - vb : null,
  }
}

const mean = a => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null)

/* One row per tool, best mean pulse drop first. A tool with fewer than
   MIN_PAIRS pairs is listed after the ranked ones with its count and null
   means, so the card can say "1 check" without pretending to a figure. */
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

/* A number and a tool, never a feeling. Ten words at most. */
export function effectWords(tool, meanHrDrop) {
  const name = toolName(tool)
  const lower = name.charAt(0).toLowerCase() + name.slice(1)
  const d = num(meanHrDrop)
  if (d == null) return `Two checks after the ${lower} are needed.`
  const r = Math.round(Math.abs(d))
  if (r === 0) return `After the ${lower} your pulse is about the same.`
  const beats = r === 1 ? 'beat' : 'beats'
  const dir = d > 0 ? 'lower' : 'higher'
  return `After the ${lower} your pulse is ${r} ${beats} ${dir}.`
}
