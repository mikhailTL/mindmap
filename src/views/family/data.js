/* What a card or a child's page may show, and the words for it. One place, so
 * the parent and the Medical Professional dashboards draw the same rules.
 *
 * CONSENT, never widened here:
 *   parent  whole days only. The hour-by-hour curve needs the teen's raw
 *           switch (consent.raw). Never a single reading's time or value.
 *   pro     the Mind Score needs consent.score, any trend consent.trends, and
 *           single readings with their times consent.raw. The name needs
 *           consent.name; otherwise the pseudonym. */

import { Light } from '../../signals/light.js'

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
export const sourceLine = teen => (teen.patch ? 'Patch, with phone checks' : 'Phone camera and check-in questions')

/* A value against the teen's own band, the same cut the roster uses for a
   day's light. */
export function lightOf(teen, v) {
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
export const shortDate = iso => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US',
  { month: 'short', day: 'numeric', timeZone: 'UTC' })
