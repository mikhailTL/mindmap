/* Demo teens for the card dashboards: a parent's children and a
 * Counselor/Professional's caseload. One generator so both dashboards, the child detail
 * view and the student's own demo read the same kind of record.
 *
 * Nothing here is a measurement. Every number is generated, deterministically,
 * from a seed per teen, and the screens that show it say "Demo".
 *
 * The Mind Score runs 0 to 100 and HIGHER MEANS MORE STRESS (the dial reads
 * 0 calm, 100 peak). Each teen has their own usual band; a day is compared
 * with that band, never with another teen. */

import { Light, SIGNAL } from '../signals/light.js'

export const RANGES = Object.freeze(['day', 'week', 'month'])
export const RANGE_LABEL = Object.freeze({ day: 'Today', week: 'This week', month: 'This month' })
export const DAYS = 90

/* A small seeded generator (mulberry32), so a teen looks the same on every load. */
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v))
const round = v => Math.round(v)

/* The demo's "today": fixed, so the screens and their tests do not move. */
export const TODAY = '2026-10-16'
const day0 = new Date(TODAY + 'T12:00:00Z')
const isoDay = offset => new Date(day0.getTime() - offset * 86400000).toISOString().slice(0, 10)
const weekday = iso => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(iso + 'T12:00:00Z').getUTCDay()]

const SIGNAL_KEYS = Object.keys(SIGNAL)

/* One teen's record. `base` is their usual Mind Score, `drift` how far the
   last two weeks have moved from it (positive means more stress), `swing` how
   much a day varies, `patch` whether they wear the patch (otherwise their
   readings come from the phone camera and the check-in questions). */
export function makeTeen({ id, first, last = '', pseudonym, age, grade, seed, base = 48, drift = 0, swing = 9,
  patch = true, avatar = null, consent = { score: true, trends: true, raw: false } }) {
  const r = rng(seed)
  const lo = round(base - 10), hi = round(base + 10)
  const days = []
  for (let i = DAYS - 1; i >= 0; i--) {
    const date = isoDay(i)
    const recent = i < 14 ? (14 - i) / 14 : 0
    const wk = weekday(date)
    const weekdayLift = wk === 'Sat' || wk === 'Sun' ? -5 : wk === 'Mon' ? 3 : 0
    const score = round(clamp(base + drift * recent + weekdayLift + (r() - 0.5) * 2 * swing))
    const peaks = Math.max(0, round((score - base) / 8 + r() * 2))
    const camera = patch ? (r() < 0.15 ? 1 : 0) : (r() < 0.75 ? 1 + round(r()) : 0)
    const survey = r() < (patch ? 0.25 : 0.6) ? 1 : 0
    const pulse = round(68 + (score - 50) * 0.22 + (r() - 0.5) * 6)
    const hrv = round(clamp(62 - (score - 50) * 0.5 + (r() - 0.5) * 10, 18, 110))
    const eda = +(clamp(2.2 + (score - 50) * 0.04 + (r() - 0.5) * 0.8, 0.4, 9)).toFixed(1)
    const temp = +(33.4 + (r() - 0.5) * 0.6 - (score - 50) * 0.004).toFixed(1)
    const steps = round(5200 + (r() - 0.3) * 5200)
    const recovery = round(clamp(9 + (score - base) * 0.45 + r() * 6, 3, 60))
    const lightScore = score - hi
    const light = lightScore > 8 ? Light.RED : lightScore > 0 ? Light.YELLOW : Light.GREEN
    const signals = light === Light.GREEN ? [] : SIGNAL_KEYS
      .map(k => [k, r()]).sort((a, b) => b[1] - a[1]).slice(0, light === Light.RED ? 2 : 1).map(([k]) => SIGNAL[k])
    const readings = []
    const n = (patch ? 4 : 0) + camera + survey
    for (let j = 0; j < Math.max(1, n); j++) {
      const hour = 8 + round((j + r() * 0.8) * (13 / Math.max(1, n)))
      const src = j < (patch ? 4 : 0) ? 'patch' : j < (patch ? 4 : 0) + camera ? 'camera' : 'survey'
      readings.push({ time: `${String(hour).padStart(2, '0')}:${String(round(r() * 59)).padStart(2, '0')}`,
        score: round(clamp(score + (r() - 0.5) * 14)), source: src })
    }
    days.push({ date, weekday: wk, score, peaks, recovery, pulse, hrv, eda, temp, steps,
      sources: { patch, camera, survey }, light, signals, readings })
  }
  /* Today, hour by hour from 7 am. */
  const today = days[days.length - 1]
  const hours = []
  for (let h = 7; h <= 22; h++) {
    const bump = h >= 13 && h <= 16 ? (today.score - base) * 0.8 : 0
    hours.push({ hour: h, score: round(clamp(base + bump + (r() - 0.5) * 2 * swing * 0.7)) })
  }
  const name = last ? `${first} ${last}` : first
  return { id, first, last, name, initial: first[0], pseudonym: pseudonym || `Student ${1000 + (seed % 9000)}`,
    age, grade, patch, avatar, consent, usual: { lo, hi, base }, days, hours }
}

/* Mean, range and change for a range, plus the points to draw. Change is
   against the previous range of the same length. */
export function summary(teen, range = 'week') {
  if (range === 'day') {
    const pts = teen.hours.map(h => ({ label: h.hour > 12 ? `${h.hour - 12}p` : `${h.hour}a`, score: h.score }))
    const today = teen.days[teen.days.length - 1], prev = teen.days[teen.days.length - 2]
    return { range, mean: today.score, min: Math.min(...pts.map(p => p.score)), max: Math.max(...pts.map(p => p.score)),
      change: today.score - prev.score, points: pts, light: today.light, signals: today.signals }
  }
  const n = range === 'week' ? 7 : 30
  const cur = teen.days.slice(-n), before = teen.days.slice(-2 * n, -n)
  const avg = a => round(a.reduce((s, d) => s + d.score, 0) / a.length)
  const worst = cur.reduce((w, d) => (d.light === Light.RED ? Light.RED : w === Light.RED ? w : d.light === Light.YELLOW ? Light.YELLOW : w), Light.GREEN)
  return { range, mean: avg(cur), min: Math.min(...cur.map(d => d.score)), max: Math.max(...cur.map(d => d.score)),
    change: avg(cur) - avg(before),
    points: cur.map(d => ({ label: range === 'week' ? d.weekday : d.date.slice(8), date: d.date, score: d.score, light: d.light })),
    light: worst, signals: [...new Set(cur.flatMap(d => d.signals))].slice(0, 3) }
}

/* The Heads Up face for a range. Day: today's light. Week and month: the
   average of the daily lights (green 0, yellow 1, red 2), rounded. With no
   range it is the week, the cards' default. */
export const FACE_LABEL = Object.freeze({ day: 'Today', week: 'Week average', month: 'Month average' })
const FACE_RANK = { [Light.GREEN]: 0, [Light.YELLOW]: 1, [Light.RED]: 2 }
export function statusOf(teen, range = 'week') {
  if (range === 'day') return teen.days[teen.days.length - 1].light
  const days = teen.days.slice(range === 'month' ? -30 : -7)
  const m = days.reduce((s, d) => s + FACE_RANK[d.light], 0) / days.length
  return m >= 1.5 ? Light.RED : m >= 0.5 ? Light.YELLOW : Light.GREEN
}

/* A date range of days, inclusive, for calendar pickers. */
export function daysBetween(teen, from, to) {
  return teen.days.filter(d => d.date >= from && d.date <= to)
}

/* A parent's two children. */
export const FAMILY = Object.freeze([
  makeTeen({ id: 'maya', first: 'Maya', age: 15, grade: 10, seed: 1501, base: 46, drift: 20, patch: true, avatar: 'fox' }),
  makeTeen({ id: 'leo', first: 'Leo', age: 13, grade: 8, seed: 1307, base: 41, drift: -3, patch: false, avatar: 'owl' }),
])

/* A Counselor/Professional's caseload: 24 teens across grades 8 to 12, each
   age fitting the grade (grade plus 5 or plus 6). Names are
   invented; the pseudonym is what the screen shows until a teen's consent
   allows the name. */
const FIRSTS = ['Ava', 'Noah', 'Mia', 'Ethan', 'Zoe', 'Liam', 'Isla', 'Mateo', 'Nora', 'Kai', 'Lena', 'Omar',
  'Ruby', 'Theo', 'Aria', 'Jonah', 'Sana', 'Eli', 'Grace', 'Diego', 'Hana', 'Felix', 'Iris', 'Jude']
const LASTS = ['P.', 'K.', 'R.', 'S.', 'L.', 'M.', 'T.', 'B.', 'D.', 'W.', 'C.', 'H.']
export const CASELOAD = Object.freeze(FIRSTS.map((first, i) => {
  const seed = 2000 + i * 37
  const r = rng(seed)
  return makeTeen({
    id: 'c' + (i + 1), first, last: LASTS[i % LASTS.length], age: 13 + (i % 5) + (i % 2), grade: 8 + (i % 5),
    seed, base: round(36 + r() * 30), drift: round((r() - 0.35) * 26), swing: round(6 + r() * 8),
    patch: r() > 0.35, pseudonym: `Student ${String(1000 + ((seed * 7919) % 9000)).padStart(4, '0')}`,
    consent: { score: true, trends: r() > 0.15, raw: r() > 0.7 },
  })
}))
