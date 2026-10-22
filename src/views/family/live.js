// Shapes a linked teen from the account snapshot like a roster teen. Only what the server sent:
// no body signals, hours or single readings, and a day with no reading has a null score.
import { Light } from '../../signals/light.js'

const DAY_MS = 86400e3
export const LIVE_DAYS = 90
const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const RANK = { [Light.GREEN]: 0, [Light.YELLOW]: 1, [Light.RED]: 2 }

/* The viewer's own calendar day, as YYYY-MM-DD. */
export function localDay(t) {
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const weekdayOf = iso => WEEKDAY[new Date(iso + 'T12:00:00Z').getUTCDay()]

export function liveLight(usual, v) {
  if (!usual || v == null) return null
  const over = v - usual.hi
  return over > 8 ? Light.RED : over > 0 ? Light.YELLOW : Light.GREEN
}

function cleanUsual(u) {
  if (!u || typeof u !== 'object') return null
  const lo = Number(u.lo), hi = Number(u.hi), base = Number(u.base)
  if (![lo, hi, base].every(Number.isFinite)) return null
  return { lo, hi, base, ...(u.general ? { general: true } : {}) }
}

export function toTeen(t, audience = 'parent', now = Date.now()) {
  const sharing = t.sharing || {}
  const usual = cleanUsual(t.usual)
  const byDate = new Map((Array.isArray(t.days) ? t.days : []).map(d => [d.date, d]))
  const days = []
  for (let i = LIVE_DAYS - 1; i >= 0; i--) {
    const date = localDay(now - i * DAY_MS)
    const d = byDate.get(date)
    const score = d && Number.isFinite(d.mean) ? d.mean : null
    days.push({
      date, weekday: weekdayOf(date), score,
      min: d ? d.min : null, max: d ? d.max : null, count: d ? d.count || 0 : 0,
      sources: d && d.sources ? { patch: d.sources.patch || 0, camera: d.sources.camera || 0, survey: d.sources.survey || 0 } : null,
      light: liveLight(usual, score), signals: [], readings: [],
    })
  }
  const name = String(t.name || 'Teen')
  const any = days.filter(d => d.score != null)
  const pro = audience === 'pro'
  return {
    id: t.id, live: true, first: name.split(' ')[0], last: '', name, initial: name[0] || '?',
    pseudonym: name, age: null, grade: null, avatar: t.avatar || null,
    patch: any.some(d => d.sources && d.sources.patch > 0),
    sharing,
    // A parent's trend consent is the teen's `week` switch, and raw readings stay off for a parent.
    consent: pro
      ? { score: sharing.score === true, trends: sharing.trends === true, raw: sharing.raw === true, name: true }
      : { score: sharing.score === true, trends: sharing.week === true, raw: false, name: true },
    usual, latestAt: Number.isFinite(t.latestAt) ? t.latestAt : null,
    days, hours: [], hasReadings: any.length > 0,
  }
}

const avg = a => Math.round(a.reduce((s, d) => s + d.score, 0) / a.length)

export function liveSummary(teen, range = 'week') {
  const days = teen.days
  if (range === 'day') {
    const today = days[days.length - 1], prev = days[days.length - 2]
    return { range, mean: today.score, min: today.min, max: today.max,
      change: today.score != null && prev.score != null ? today.score - prev.score : null,
      points: [], light: today.light, signals: [] }
  }
  const n = range === 'week' ? 7 : 30
  const cur = days.slice(-n).filter(d => d.score != null)
  const before = days.slice(-2 * n, -n).filter(d => d.score != null)
  const mean = cur.length ? avg(cur) : null
  return {
    range, mean,
    min: cur.length ? Math.min(...cur.map(d => d.min ?? d.score)) : null,
    max: cur.length ? Math.max(...cur.map(d => d.max ?? d.score)) : null,
    change: mean != null && before.length ? mean - avg(before) : null,
    points: cur.map(d => ({ label: range === 'week' ? d.weekday : d.date.slice(8), date: d.date, score: d.score, light: d.light })),
    light: liveStatus(teen, range), signals: [],
  }
}

export function liveStatus(teen, range = 'week') {
  if (range === 'day') return teen.days[teen.days.length - 1].light
  const lit = teen.days.slice(range === 'month' ? -30 : -7).filter(d => d.light)
  if (!lit.length) return null
  // Average rank of the lit days (green 0, yellow 1, red 2), rounded to the nearest light.
  const m = lit.reduce((s, d) => s + RANK[d.light], 0) / lit.length
  return m >= 1.5 ? Light.RED : m >= 0.5 ? Light.YELLOW : Light.GREEN
}

/* Where a live teen's readings came from, over the days shown. */
export function liveSourceLine(teen) {
  const n = { patch: 0, camera: 0, survey: 0 }
  let known = false
  for (const d of teen.days) if (d.sources) { known = true; n.patch += d.sources.patch; n.camera += d.sources.camera; n.survey += d.sources.survey }
  if (!teen.hasReadings) return 'No readings yet'
  if (!known) return 'Readings shared by day'
  const words = [n.patch && 'Patch', n.camera && 'phone camera', n.survey && 'survey'].filter(Boolean)
  const line = words.length > 1 ? words.slice(0, -1).join(', ') + ' and ' + words[words.length - 1] : words[0]
  return line.charAt(0).toUpperCase() + line.slice(1)
}
