/* The Medical Professional caseload, as figures. Pure functions over
 * src/lib/roster.js, so the cards, the compact list, the teen detail and the
 * group charts read one set of numbers.
 *
 * CONSENT, enforced here and nowhere else in the view:
 *   consent.trends false  no change, no line, no range comparison; the
 *                         figures for the chosen range still show, since a
 *                         mean is not movement
 *   consent.raw false     no individual readings, only day figures
 * Groups under K_ANONYMITY show nothing. */

import { CASELOAD, summary, statusOf, TODAY } from '../../lib/roster.js'
import { K_ANONYMITY } from '../../lib/caseload.js'
import { Light } from '../../signals/light.js'

export const RANGE_SHORT = Object.freeze({ day: 'Day', week: 'Week', month: 'Month' })
export const RANGE_NOUN = Object.freeze({ day: 'today', week: 'this week', month: 'this month' })
const SPAN = { day: 1, week: 7, month: 30 }

/* Today is always its own part now, so the Trends part reads a week or a
   month. A stored 'day' reads as the week. */
export const TREND_RANGES = Object.freeze([['week', 'Week'], ['month', 'Month']])
export const trendRange = r => (r === 'month' ? 'month' : 'week')
export const TREND_TITLE = Object.freeze({ week: 'Last 7 days', month: 'Last 30 days' })
export const TREND_PREV = Object.freeze({ week: 'the 7 days before', month: 'the 30 days before' })
export const trendDays = (teen, r) => teen.days.slice(r === 'month' ? -30 : -7)

const avg = (a, k) => a.reduce((s, d) => s + d[k], 0) / Math.max(1, a.length)
const one = v => Math.round(v * 10) / 10
const sum = (a, k) => a.reduce((s, d) => s + d[k], 0)

export const trendsShared = teen => teen.consent.trends === true
export const readingsShared = teen => teen.consent.raw === true

/* Every figure for one teen over one range. `change` is null when the teen
   does not share trends, so no screen can print it by accident. */
export function figures(teen, range = 'week') {
  const n = SPAN[range]
  const cur = teen.days.slice(-n), prev = teen.days.slice(-2 * n, -n)
  const s = summary(teen, range)
  const trend = trendsShared(teen)
  const delta = k => (trend ? one(avg(cur, k) - avg(prev, k)) : null)
  return {
    range,
    score: s.mean, min: s.min, max: s.max,
    change: trend ? s.change : null,
    points: trend ? s.points : null,
    peaks: sum(cur, 'peaks'),
    recovery: Math.round(avg(cur, 'recovery')),
    pulse: Math.round(avg(cur, 'pulse')),
    hrv: Math.round(avg(cur, 'hrv')),
    eda: avg(cur, 'eda').toFixed(1),
    temp: avg(cur, 'temp').toFixed(1),
    steps: Math.round(avg(cur, 'steps')),
    readings: cur.reduce((t, d) => t + d.readings.length, 0),
    delta: { pulse: delta('pulse'), hrv: delta('hrv'), eda: delta('eda'), recovery: delta('recovery') },
    light: s.light, signals: s.signals,
  }
}

/* The figures a card can show. `key` indexes figures(); `unit` is printed
   beside the number, always. */
export const COLUMNS = Object.freeze([
  { key: 'score',    label: 'Mind Score',     unit: 'of 100' },
  { key: 'change',   label: 'Change',         unit: 'points' },
  { key: 'peaks',    label: 'Peaks',          unit: 'peaks' },
  { key: 'recovery', label: 'Recovery time',  unit: 'min' },
  { key: 'pulse',    label: 'Resting pulse',  unit: 'bpm' },
  { key: 'hrv',      label: 'Variability',    unit: 'ms' },
  { key: 'eda',      label: 'Sweat response', unit: 'µS' },
  { key: 'readings', label: 'Readings',       unit: 'readings' },
])
export const DEFAULT_COLUMNS = Object.freeze(['score', 'change', 'peaks', 'recovery', 'pulse', 'hrv'])

export const signed = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v)

/* Status words beside the face. */
export const STATUS_WORD = Object.freeze({ green: 'Green', yellow: 'Yellow', red: 'Red' })
export const STATUS_LINE = Object.freeze({
  green: 'Within their usual range',
  yellow: 'Above their usual range',
  red: 'Well above their usual range',
})
const RANK = { [Light.RED]: 0, [Light.YELLOW]: 1, [Light.GREEN]: 2 }

export const SORTS = Object.freeze([
  ['stress', 'Most stress first'],
  ['rise', 'Biggest rise'],
  ['name', 'Name'],
  ['grade', 'Grade'],
])

const byCode = (a, b) => a.pseudonym.localeCompare(b.pseudonym)

/* `rise` orders only teens who share trends; the rest follow by code, never
   by the movement they did not share. */
export function sortTeens(list, sort, range) {
  const f = new Map(list.map(t => [t.id, figures(t, range)]))
  const out = [...list]
  if (sort === 'stress') out.sort((a, b) => RANK[statusOf(a, range)] - RANK[statusOf(b, range)] || f.get(b.id).score - f.get(a.id).score)
  else if (sort === 'rise') out.sort((a, b) => {
    const ca = f.get(a.id).change, cb = f.get(b.id).change
    if (ca === null && cb === null) return byCode(a, b)
    if (ca === null) return 1
    if (cb === null) return -1
    return cb - ca
  })
  else if (sort === 'grade') out.sort((a, b) => a.grade - b.grade || byCode(a, b))
  else out.sort(byCode)
  return out
}

export function filterTeens(list, { query = '', statuses = [], grade = 'all', range = 'week' } = {}) {
  const q = query.trim().toLowerCase().replace(/^student\s*/, '')
  return list.filter(t =>
    (!q || t.pseudonym.toLowerCase().includes(q)) &&
    (!statuses.length || statuses.includes(statusOf(t, range))) &&
    (grade === 'all' || t.grade === Number(grade)))
}

export const GRADES = Object.freeze([...new Set(CASELOAD.map(t => t.grade))].sort((a, b) => a - b))

export function statusCounts(list, range = 'week') {
  const c = { green: 0, yellow: 0, red: 0 }
  for (const t of list) c[statusOf(t, range)]++
  return c
}

/* The demo's one open urgent alert belongs to the teen reading highest
   today among those on red. */
export function alertTeen(list = CASELOAD) {
  const red = list.filter(t => statusOf(t, 'day') === Light.RED)
  const pool = red.length ? red : list
  return [...pool].sort((a, b) => b.days[b.days.length - 1].score - a.days[a.days.length - 1].score)[0] || null
}

/* ── Across the whole network ─────────────────────────────────────────── */

/* Mean daily Mind Score over the last `n` days, and the middle half, across
   teens who share trends. Fewer than K_ANONYMITY teens: nothing. */
export function networkSeries(list = CASELOAD, n = 30) {
  const shared = list.filter(trendsShared)
  if (shared.length < K_ANONYMITY) return null
  const out = []
  for (let i = n; i >= 1; i--) {
    const vals = shared.map(t => t.days[t.days.length - i].score).sort((a, b) => a - b)
    const q = p => vals[Math.min(vals.length - 1, Math.floor(p * vals.length))]
    out.push({ date: shared[0].days[shared[0].days.length - i].date,
      mean: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length), lo: q(0.25), hi: q(0.75) })
  }
  return { n: shared.length, points: out }
}

/* This week's mean per grade, across every teen (a week's mean is not
   movement). The change is added only when at least K_ANONYMITY of that
   grade share trends. A grade under K_ANONYMITY prints neither a mean nor a
   count. */
export function gradeGroups(list = CASELOAD) {
  return GRADES.map(g => {
    const teens = list.filter(t => t.grade === g)
    if (teens.length < K_ANONYMITY) return { grade: g, hidden: true }
    const mean = Math.round(teens.reduce((s, t) => s + figures(t, 'week').score, 0) / teens.length)
    const moving = teens.filter(trendsShared)
    const change = moving.length >= K_ANONYMITY
      ? one(moving.reduce((s, t) => s + figures(t, 'week').change, 0) / moving.length) : null
    return { grade: g, hidden: false, n: teens.length, mean, change }
  })
}

/* The audit log in src/lib/caseload.js names the study codes of the older
   eight-student demo. On this screen its rows are re-pointed at teens in
   CASELOAD so the log and the cards agree. */
export function logSubjects(list = CASELOAD) {
  const alert = alertTeen(list)
  const other = list.find(t => t !== alert && readingsShared(t)) || list[0]
  const map = { '8241': alert.pseudonym.split(' ')[1], '5512': other.pseudonym.split(' ')[1] }
  return t => t.replace(/\b(8241|5512)\b/g, m => map[m])
}

export const SOURCE_WORD = Object.freeze({ patch: 'Patch', camera: 'Phone camera', survey: 'Check-in questions' })
export const sourceLine = teen => (teen.patch ? 'Patch and phone readings' : 'Phone camera and questions')
export { TODAY }
