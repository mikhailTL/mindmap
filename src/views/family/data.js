/* What a card or a child's page may show, and the words for it. One place, so
 * the parent and the Counselor/Professional dashboards draw the same rules.
 *
 * CONSENT, never widened here:
 *   parent  whole days only. The hour-by-hour curve needs the teen's raw
 *           switch (consent.raw). Never a single reading's time or value.
 *   pro     the Mind Score needs consent.score, any trend consent.trends, and
 *           single readings with their times consent.raw. The name needs
 *           consent.name; otherwise the pseudonym. */

import { Light } from '../../signals/light.js'
import { statusOf as rosterStatus, summary as rosterSummary } from '../../lib/roster.js'
import { liveSourceLine, liveStatus, liveSummary } from './live.js'

/* A live teen (from the account, ./live.js) or a demo one (src/lib/roster.js):
   the cards and pages call these two and never ask which. */
export const summaryOf = (teen, range) => (teen.live ? liveSummary(teen, range) : rosterSummary(teen, range))
export const statusOfTeen = (teen, range) => (teen.live ? liveStatus(teen, range) : rosterStatus(teen, range))

export const STATUS_WORD = Object.freeze({ green: 'Green', yellow: 'Yellow', red: 'Red' })
export const STATUS_SUB = Object.freeze({
  green: 'In their usual range',
  yellow: 'A little above usual',
  red: 'Well above usual',
})
export const PREV = Object.freeze({ day: 'yesterday', week: 'last week', month: 'last month' })
export const RANGE_WORD = Object.freeze({ day: 'Day', week: 'Week', month: 'Month' })

/* Graphic colours for a value against the teen's own band. All clear 3 : 1
   on card; the word always travels with them. */
export const TIER_FILL = Object.freeze({ green: '#18a370', yellow: '#b5871b', red: '#a8321f' })

export const isPro = v => v === 'pro'
export const showsScore = (teen, v) => !isPro(v) || teen.consent?.score !== false
export const showsTrends = (teen, v) => !isPro(v) || teen.consent?.trends !== false
export const showsHours = (teen, v) => (isPro(v) ? teen.consent?.trends !== false : teen.consent?.raw === true)
export const showsReadings = (teen, v) => isPro(v) && teen.consent?.raw === true

export const displayName = (teen, v) => (isPro(v) && !teen.consent?.name ? teen.pseudonym : teen.name)
export const sourceLine = teen => (teen.live ? liveSourceLine(teen)
  : teen.patch ? 'Patch, with phone checks' : 'Phone camera and check-in questions')
/* The line under a teen's name: age and grade for the demo, who they are to
   you for a linked account, which has neither. */
export const metaLine = (teen, v) => (teen.live ? 'Linked to you'
  : isPro(v) ? `Grade ${teen.grade}` : `${teen.age}, grade ${teen.grade}`)
/* A fill for a value: its light's colour, or the plain line colour when the
   teen does not share their usual band. */
export const fillOf = (teen, v) => TIER_FILL[lightOf(teen, v)] || '#157446'

/* A value against the teen's own band, the same cut the roster uses for a
   day's light. */
export function lightOf(teen, v) {
  if (!teen.usual || v == null) return null
  const over = v - teen.usual.hi
  return over > 8 ? Light.RED : over > 0 ? Light.YELLOW : Light.GREEN
}

/* "6 higher than last week". Higher means more stress on this scale. */
export function changeWords(change, range, variant) {
  if (isPro(variant)) return change === 0 ? `No change vs ${PREV[range]}` : `${change > 0 ? '+' : '−'}${Math.abs(change)} vs ${PREV[range]}`
  if (change === 0) return `Same as ${PREV[range]}`
  return `${Math.abs(change)} ${change > 0 ? 'higher' : 'lower'} than ${PREV[range]}`
}

/* The day record for an ISO date, or the latest. */
export const dayOf = (teen, date) => teen.days.find(d => d.date === date) ?? teen.days[teen.days.length - 1]

/* Mean and spread of a field over the 30 days before `date`, the teen's own usual. */
export function usualOf(teen, key, date) {
  const i = teen.days.findIndex(d => d.date === date)
  const end = i < 0 ? teen.days.length - 1 : i
  const span = teen.days.slice(Math.max(0, end - 30), end)
  const vals = span.map(d => d[key])
  const mean = vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length)
  const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, vals.length)) || 1
  return { mean, sd }
}

const longDate = iso => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US',
  { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })
export const dayLabel = (teen, iso) => (iso === teen.days[teen.days.length - 1].date ? 'Today' : longDate(iso))
/* Words for a value against the usual band, or none when it is not shared. */
export const subOf = (teen, v) => STATUS_SUB[lightOf(teen, v)] || ''
export const shortDate = iso => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US',
  { month: 'short', day: 'numeric', timeZone: 'UTC' })

/* ── Parent Trends: ranges, sources, signals, sleep ──────────────────────
 * Everything below is a whole day or a sum of whole days, the parent's
 * consent scope. */

export const RANGE_DAYS = Object.freeze({ day: 1, week: 7, month: 30 })
/* The days a range covers, ending today. */
export const rangeDays = (teen, range) => teen.days.slice(-RANGE_DAYS[range])

/* Readings by source over some days. A live teen without sources sent has
   only a count. */
export function sourceTotals(days) {
  const n = { patch: 0, camera: 0, survey: 0, total: 0, days: 0, known: false }
  for (const d of days) {
    if (d.score != null) n.days += 1
    if (d.sources) {
      n.known = true
      const by = src => (d.readings && d.readings.length ? d.readings.filter(r => r.source === src).length
        : Number(d.sources[src]) || 0)
      const p = by('patch'), c = by('camera'), s = by('survey')
      n.patch += p; n.camera += c; n.survey += s
    }
    n.total += d.readings && d.readings.length ? d.readings.length : d.count || 0
  }
  return n
}

/* How many days of each light. */
export function lightCounts(days) {
  const n = { green: 0, yellow: 0, red: 0, none: 0 }
  for (const d of days) n[d.light || 'none'] += 1
  return n
}

/* The body signals a parent sees, as whole days. `from` says where each one
   is measured: the patch, the phone camera, or the phone itself. */
export const BODY = Object.freeze([
  { k: 'pulse', label: 'Pulse', unit: 'bpm', dp: 0, color: '#e11919', up: 'Faster than usual', down: 'Slower than usual',
    from: { patch: 'Patch', phone: 'Phone camera' } },
  { k: 'hrv', label: 'Heart rhythm', unit: 'ms', dp: 0, color: '#a024f2', up: 'More varied than usual', down: 'Less varied than usual',
    from: { patch: 'Patch', phone: 'Phone camera' } },
  { k: 'eda', label: 'Sweat response', unit: 'µS', dp: 1, color: '#e86a05', up: 'Higher than usual', down: 'Lower than usual',
    from: { patch: 'Patch' } },
  { k: 'temp', label: 'Skin temperature', unit: '°C', dp: 1, color: '#199e19', up: 'Warmer than usual', down: 'Cooler than usual',
    from: { patch: 'Patch' } },
  { k: 'steps', label: 'Steps', unit: 'steps', dp: 0, color: '#1560e0', up: 'More active than usual', down: 'Less active than usual',
    from: { patch: 'Patch', phone: 'Phone' } },
])
export const bodyFor = teen => BODY.filter(m => (teen.patch ? m.from.patch : m.from.phone))
export const bodyMissing = teen => BODY.filter(m => !teen.patch && !m.from.phone)
export const bodySource = (teen, m) => (teen.patch ? m.from.patch : m.from.phone)

/* A signal's usual band: its 30 day mean, give or take three quarters of a
   spread, the same cut as the words. */
export function bodyBand(teen, k, date) {
  const u = usualOf(teen, k, date)
  return { lo: u.mean - 0.75 * u.sd, hi: u.mean + 0.75 * u.sd, mean: u.mean, sd: u.sd }
}
export function bodyWord(teen, m, date, v) {
  const u = usualOf(teen, m.k, date)
  const z = (v - u.mean) / u.sd
  return Math.abs(z) < 0.75 ? 'About usual' : z > 0 ? m.up : m.down
}

/* Hours slept the night before a day. Demo only: derived from the day's
   score and a hash of the date, so it is the same on every load. A linked
   teen's account does not send sleep yet. */
function hash(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return ((h >>> 0) % 1000) / 1000
}
export function sleepOf(teen, d) {
  if (teen.live || !d || d.score == null || !teen.usual) return null
  const v = 8.3 - (d.score - teen.usual.base) * 0.035 + (hash(teen.id + d.date) - 0.5) * 1.4
  return Math.round(Math.max(5.4, Math.min(9.8, v)) * 10) / 10
}
export const sleepShared = teen => (teen.live ? teen.sharing?.sleep === true : true)

/* "Wednesday 14 October". */
export const fullDate = iso => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB',
  { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
