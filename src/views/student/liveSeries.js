import { USUAL } from '../../lib/readingLog'
import { liveLight } from '../family/live.js'

/* The student's own readings, cut into days for the Trends tab and the
 * Trends box. Only what the log holds: a day with no reading has no score,
 * and nothing is filled in. */

const DAY = 864e5

export function dayKey(t) {
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function midnight(t) {
  const d = new Date(t); d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/* Noon, so a step of one day never lands on the wrong side of a clock change. */
export const addDay = (t, n) => {
  const d = new Date(midnight(t)); d.setDate(d.getDate() + n); d.setHours(12)
  return midnight(d.getTime())
}

/** Map of YYYY-MM-DD to { key, at, items, mean, sources }. */
export function byDay(entries = []) {
  const out = new Map()
  for (const r of entries) {
    const k = dayKey(r.at)
    if (!out.has(k)) out.set(k, { key: k, at: midnight(r.at), items: [] })
    out.get(k).items.push(r)
  }
  for (const d of out.values()) {
    d.mean = Math.round(d.items.reduce((a, r) => a + r.score, 0) / d.items.length)
    d.sources = { camera: 0, survey: 0, patch: 0 }
    for (const r of d.items) d.sources[r.source]++
    d.light = liveLight(USUAL, d.mean)
  }
  return out
}

/** The last `n` days ending on the day of `now`, oldest first. */
export function lastDays(days, now, n) {
  const end = midnight(now)
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const at = addDay(end, -i)
    const k = dayKey(at)
    out.push({ key: k, at, day: days.get(k) || null })
  }
  return out
}

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const weekday = at => WD[new Date(at).getDay()]
export const monthDay = at => { const d = new Date(at); return `${MON[d.getMonth()]} ${d.getDate()}` }
export const longDay = at => `${weekday(at)} ${monthDay(at)}`

export const RANGE_LABEL = { day: 'that day', week: 'last 7 days', month: 'last 30 days' }

/** What a range shows: the readings in it, the chart's points and ticks. */
export function rangeView(entries, days, now, range, anchor) {
  if (range === 'day') {
    const from = midnight(anchor ?? now), to = from + DAY - 1
    const list = entries.filter(r => r.at >= from && r.at <= to)
    const hr = h => `${h % 12 || 12} ${h < 12 ? 'am' : 'pm'}`
    return {
      from, to, list,
      points: list.map(r => ({ key: r.id, x: (r.at - from) / DAY, v: r.score,
        read: `${clockOf(r.at)}, ${SOURCE_WORD[r.source]}` })),
      ticks: [0, 6, 12, 18].map(h => ({ x: h / 24, label: hr(h) })),
      label: dayKey(from) === dayKey(now) ? 'Today' : longDay(from),
    }
  }
  const n = range === 'week' ? 7 : 30
  const cells = lastDays(days, now, n)
  const from = cells[0].at, to = midnight(now) + DAY - 1
  const list = entries.filter(r => r.at >= from && r.at <= to)
  const at = k => (n > 1 ? k / (n - 1) : 0.5)
  const every = n === 7 ? 1 : 7
  return {
    from, to, list,
    points: cells.map((c, k) => c.day && ({ key: c.key, x: at(k), v: c.day.mean,
      read: `${longDay(c.at)}, average of ${c.day.items.length} reading${c.day.items.length === 1 ? '' : 's'}` }))
      .filter(Boolean),
    ticks: cells.map((c, k) => ({ x: at(k),
      label: n === 7 ? weekday(c.at) : (n - 1 - k) % every === 0 ? monthDay(c.at) : '' })),
    label: `${monthDay(from)} to ${monthDay(to)}`,
  }
}

export const SOURCE_WORD = { camera: 'camera', survey: 'survey', patch: 'patch', mirror: 'mirror' }

export function clockOf(at) {
  const d = new Date(at)
  const h = d.getHours(), m = d.getMinutes()
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`
}
