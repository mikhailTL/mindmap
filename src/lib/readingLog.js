/* The reading log: every Mind Score this phone has produced, on this phone.
 *
 * One entry is { id, at, score, source, pulse?, note? }. `at` is epoch ms,
 * `score` 0 calm to 100 peak, `source` the way it was taken. Nothing else is
 * kept: no answers, no frames, no audio, no position.
 *
 * Own key, own module. Every storage touch is guarded, because Safari private
 * mode throws on getItem and an embedded webview can have storage disabled; a
 * reading that cannot be saved still returns its entry so the screen can show
 * it. */

export const KEY = 'mindmap.readings.log'
export const CAP = 500
export const SOURCES = Object.freeze(['camera', 'survey', 'patch'])
export const EVENT = 'mindmap:readings'

/* The band edges every score route already uses (engine.band, score.bandOf).
   Inclusive: 35 and 57 are both inside the usual range. */
export const USUAL = Object.freeze({ lo: 35, hi: 57 })
export const BANDS = Object.freeze(['high', 'up', 'usual', 'low'])

export function bandOf(n) {
  if (n < 35) return 'low'
  if (n < 58) return 'usual'
  if (n < 73) return 'up'
  return 'high'
}

const HOUR = 3600e3
const DAY = 24 * HOUR

export const RANGES = Object.freeze([
  { id: 'day', label: 'Day', ms: DAY },
  { id: 'week', label: 'Week', ms: 7 * DAY },
  { id: 'fortnight', label: '2 weeks', ms: 14 * DAY },
  { id: 'month', label: 'Month', ms: 30 * DAY },
])

export function windowFor(id, now) {
  const r = RANGES.find(x => x.id === id) || RANGES[1]
  return { from: now - r.ms, to: now }
}

/* ── Storage ──────────────────────────────────────────────────────────── */

function storage() {
  try { return globalThis.localStorage || null } catch { return null }
}

function clean(e) {
  if (!e || typeof e !== 'object') return null
  const at = Number(e.at)
  const raw = Number(e.score)
  if (!Number.isFinite(at) || !Number.isFinite(raw) || typeof e.score === 'string' && e.score.trim() === '') return null
  if (!SOURCES.includes(e.source)) return null
  const out = { id: String(e.id || ''), at, score: Math.max(0, Math.min(100, Math.round(raw))), source: e.source }
  const pulse = Number(e.pulse)
  if (e.pulse != null && Number.isFinite(pulse)) out.pulse = Math.round(pulse)
  const note = typeof e.note === 'string' ? e.note.trim().slice(0, 280) : ''
  if (note) out.note = note
  if (e.demo) out.demo = true
  return out
}

function readAll() {
  const s = storage()
  if (!s) return []
  try {
    const a = JSON.parse(s.getItem(KEY) || '[]')
    return Array.isArray(a) ? a.map(clean).filter(Boolean) : []
  } catch { return [] }
}

function writeAll(list) {
  const s = storage()
  try { s?.setItem(KEY, JSON.stringify(list)) } catch { /* shown, not saved */ }
  try { globalThis.dispatchEvent?.(new Event(EVENT)) } catch { /* no window */ }
}

const byTime = (a, b) => a.at - b.at

let n = 0
const newId = at => `${at.toString(36)}-${(n++).toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`

/** Adds one reading. Returns the stored entry, or null for an invalid one. */
export function addReading({ at = Date.now(), score, source, pulse, note } = {}) {
  const e = clean({ id: 'x', at, score, source, pulse, note })
  if (!e) return null
  e.id = newId(e.at)
  const list = [...readAll(), e].sort(byTime).slice(-CAP)
  writeAll(list)
  return e
}

/** Oldest first, `from` and `to` inclusive. */
export function listReadings({ from = -Infinity, to = Infinity } = {}) {
  return readAll().sort(byTime).filter(r => r.at >= from && r.at <= to)
}

/** Changes the note or the score of one entry. */
export function updateReading(id, patch = {}) {
  const list = readAll()
  const i = list.findIndex(r => r.id === id)
  if (i < 0) return null
  const next = clean({ ...list[i], ...patch, id })
  if (!next) return null
  if ('note' in patch && !next.note) delete next.note
  list[i] = next
  writeAll(list.sort(byTime))
  return next
}

export function clearReadings() {
  const s = storage()
  try { s?.removeItem ? s.removeItem(KEY) : s?.setItem(KEY, '[]') } catch { /* nothing to clear */ }
  try { globalThis.dispatchEvent?.(new Event(EVENT)) } catch { /* no window */ }
}

/* ── Derived figures ──────────────────────────────────────────────────── */

/* Largest-remainder rounding, so the four shares always add to 100. */
function shares(counts, total) {
  const keys = Object.keys(counts)
  const exact = keys.map(k => (counts[k] / total) * 100)
  const floor = exact.map(Math.floor)
  let left = 100 - floor.reduce((a, b) => a + b, 0)
  const order = exact.map((v, i) => [v - floor[i], i]).sort((a, b) => b[0] - a[0])
  for (const [, i] of order) { if (left <= 0) break; floor[i]++; left-- }
  return Object.fromEntries(keys.map((k, i) => [k, floor[i]]))
}

export function stats(list = []) {
  const bySource = { camera: 0, survey: 0, patch: 0 }
  const counts = { low: 0, usual: 0, up: 0, high: 0 }
  if (!list.length) {
    return { n: 0, mean: null, min: null, max: null, timeInUsual: null, bySource,
      byBand: { low: 0, usual: 0, up: 0, high: 0 } }
  }
  let sum = 0, min = Infinity, max = -Infinity
  for (const r of list) {
    sum += r.score
    min = Math.min(min, r.score); max = Math.max(max, r.score)
    if (r.source in bySource) bySource[r.source]++
    counts[bandOf(r.score)]++
  }
  const byBand = shares(counts, list.length)
  return { n: list.length, mean: Math.round(sum / list.length), min, max,
    timeInUsual: byBand.usual, bySource, byBand }
}

/** The latest reading against the one before it. Within 3 points is flat. */
export function trend(list = []) {
  if (list.length < 2) return null
  const a = list[list.length - 2], b = list[list.length - 1]
  const delta = b.score - a.score
  return { dir: delta > 3 ? 'up' : delta < -3 ? 'down' : 'flat', delta, prev: a }
}

const dayKey = t => {
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Newest day first, newest entry first inside a day. */
export function groupByDay(list = []) {
  const days = new Map()
  for (const r of [...list].sort((a, b) => b.at - a.at)) {
    const k = dayKey(r.at)
    if (!days.has(k)) days.set(k, [])
    days.get(k).push(r)
  }
  return [...days].map(([key, items]) => ({
    key, at: items[0].at, items,
    mean: Math.round(items.reduce((a, r) => a + r.score, 0) / items.length),
  }))
}

/* ── Demo ─────────────────────────────────────────────────────────────── */

/* Fourteen generated days for demo mode, never written to storage. Seeded, so
 * the same days come back on every load and in every screenshot. The last
 * entry is the figure the rest of the demo already shows for today. Weekends
 * sit lower and the middle of the week higher, as the demo week series does. */
export function demoReadings({ end, days = 14, last = { score: 51, clock: '13:10' } } = {}) {
  let s = 20261016
  const rnd = () => (s = (s * 48271) % 2147483647) / 2147483647
  const endDay = new Date(end); endDay.setHours(0, 0, 0, 0)
  const [lh, lm] = String(last.clock).split(':').map(Number)
  const out = []
  const push = (base, h, m, source, score, extra = {}) => {
    const d = new Date(base); d.setHours(h, m, 0, 0)
    const at = d.getTime()
    if (at > end) return
    out.push({ id: `demo-${at}`, at, score: Math.max(4, Math.min(96, Math.round(score))), source, demo: true, ...extra })
  }
  const NOTES = ['Chemistry test today', 'Group project due', 'After practice', 'Quiet evening']
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(endDay); day.setDate(endDay.getDate() - i)
    const dow = day.getDay()
    const mid = 45 + (dow === 0 || dow === 6 ? -8 : 0) + (dow === 3 || dow === 4 ? 6 : 0) + (rnd() - 0.5) * 10
    const today = i === 0
    push(day, 7, 30 + Math.floor(rnd() * 25), 'survey', mid - 4 + (rnd() - 0.5) * 10)
    if (today) {
      push(day, lh, lm, 'camera', last.score, { pulse: 68 })
      continue
    }
    const spike = rnd() < 0.22 ? 14 + rnd() * 12 : 0
    push(day, 13 + Math.floor(rnd() * 3), Math.floor(rnd() * 60), 'camera', mid + 5 + spike + (rnd() - 0.5) * 8,
      { pulse: Math.round(64 + (mid - 45) * 0.4 + rnd() * 10), ...(spike > 18 ? { note: NOTES[i % 2] } : {}) })
    if (rnd() < 0.7) {
      const dip = rnd() < 0.3 ? -12 : 0
      push(day, 19 + Math.floor(rnd() * 3), Math.floor(rnd() * 60), 'patch', mid - 4 + dip + (rnd() - 0.5) * 8,
        { pulse: Math.round(60 + rnd() * 8), ...(dip && rnd() < 0.5 ? { note: NOTES[3] } : {}) })
    }
  }
  return out.sort(byTime)
}
