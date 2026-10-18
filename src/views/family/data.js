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
  : teen.patch ? 'Patch, with phone checks' : 'Phone camera and survey')
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

/* ── Parent Trends: ranges and day counts ──────────────────────
 * Everything below is a whole day or a sum of whole days, the parent's
 * consent scope. */

export const RANGE_DAYS = Object.freeze({ day: 1, week: 7, month: 30 })
/* The days a range covers, ending today. */
export const rangeDays = (teen, range) => teen.days.slice(-RANGE_DAYS[range])

/* How many days of each light. */
export function lightCounts(days) {
  const n = { green: 0, yellow: 0, red: 0, none: 0 }
  for (const d of days) n[d.light || 'none'] += 1
  return n
}

/* "Wednesday 14 October". */
export const fullDate = iso => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB',
  { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
