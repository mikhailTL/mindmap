import { DATA } from '../../lib/assets'
import { emptyBaseline, scoreCapture, updateBaseline } from '../../signals/score'
import { TODAY as ROSTER_TODAY } from '../../lib/roster'

// The demo reading comes from scoreCapture on a synthetic capture tuned to land on 51. The student screen and
// the calendar both import it, so they print the same figures.
export const DEMO_PPG = { ok: true, hr: 64.6, rmssd: 60, hrvOk: true, quality: 0.86 }
export const DEMO_MOTION = { ok: true, peak: 0.01, still: true }
export const DEMO_HISTORY = [0, 3.5, -3, 6.5, -5.2, 2, -4, 0.8, 5.5, -6, 2.8, -2.2, 1.5, -2]

function demoReading() {
  let b = emptyBaseline()
  DEMO_HISTORY.forEach((off, i) => {
    b = updateBaseline(b, { hr: 64 + off, hrv: 60.6 + off * 1.3 }, 'day' + i)
  })
  return scoreCapture({ ppg: DEMO_PPG, voice: null, motion: DEMO_MOTION, baseline: b })
}
export const READ = demoReading()

export const BAND = DATA.band || { lo: 0, hi: 1 }
export const USUAL = Math.round((BAND.lo + BAND.hi) / 2)

export function clock12(t) {
  const [h, m] = String(t).split(':').map(Number)
  if (!Number.isFinite(h)) return t
  const half = h < 12 ? 'am' : 'pm'
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${half}`
}

// The clock is the point where the day series reaches the score, so the hero number agrees with the chart.
export const TAKEN_AT = (() => {
  const day = DATA.day || []
  if (!day.length) return '13:10'
  let best = day[0]
  for (const d of day) if (Math.abs(d.v - READ.score) < Math.abs(best.v - READ.score)) best = d
  return best.t
})()

const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const TODAY = { score: READ.score, day: WEEKDAY[new Date(`${ROSTER_TODAY}T12:00:00Z`).getUTCDay()],
  clock: clock12(TAKEN_AT) }

export const CROSSED = (() => {
  const day = DATA.day || []
  const i = day.findIndex((d, k) => k > 20 && d.v > BAND.hi)
  return i > 0 ? day[i].t : null
})()

export const PEAK = (() => {
  const day = DATA.day || []
  if (!day.length) return { v: 0, t: '00:00' }
  const hi = day.reduce((a, d) => (d.v > a.v ? d : a), day[0])
  return { v: Math.round(hi.v), t: hi.t }
})()

export const TODAY_SHORT = TODAY.day.slice(0, 3)
export const WEEK = (DATA.week || []).map(d => (d.d === TODAY_SHORT ? { ...d, v: TODAY.score } : d))
export const WBAND = DATA.weekBand || BAND

export const WEEK_COUNT = {
  above: WEEK.filter(d => d.v > WBAND.hi).length,
  inside: WEEK.filter(d => d.v >= WBAND.lo && d.v <= WBAND.hi).length,
  below: WEEK.filter(d => d.v < WBAND.lo).length,
}

// Seeded from year and month, so a month draws the same on every load. Future days are null rather than 0,
// since 0 is a valid score and would draw as a calm day.
export function monthScores(year, month, upToDay = null) {
  const days = new Date(year, month + 1, 0).getDate()
  let s = ((year * 12 + month) * 7919) % 2147483647
  if (s <= 0) s += 2147483646
  const rnd = () => (s = (s * 48271) % 2147483647) / 2147483647
  const mid = (WBAND.lo + WBAND.hi) / 2
  return Array.from({ length: days }, (_, i) => {
    const dow = new Date(year, month, i + 1).getDay()
    const weekend = dow === 0 || dow === 6 ? -7 : 0
    const midweek = dow === 3 || dow === 4 ? 6 : 0
    const v = mid + weekend + midweek + (rnd() - 0.5) * 20
    const n = Math.max(8, Math.min(96, Math.round(v)))
    return upToDay != null && i + 1 > upToDay ? null : n
  })
}
