import { DATA } from '../../lib/assets'
import { emptyBaseline, scoreCapture, updateBaseline } from '../../signals/score'

/* The demo reading, and everything derived from it, in one module.
 *
 * It used to live at the top of src/views/Students.jsx. The calendar needs the
 * same figures, and two copies of a fixture is how two screens start printing
 * two different numbers for the same Thursday, so the fixture is here and both
 * screens import it.
 *
 * The reading is produced by the engine rather than typed in, so the band, the
 * baseline length, the movement hold, the signal quality and the term
 * contributions a screen prints are whatever scoreCapture actually returns for
 * a capture. The capture is synthetic and is tuned to land on 51, the figure
 * the launcher and the tour already draw for this student. Its raw heart
 * inputs are deliberately never printed: the heart numbers a reader sees are
 * the patch fixtures in readings.js, and the engine's own inputs are a
 * separate demo series.
 *
 * Nothing in this file was measured from anybody. No patch has been built or
 * worn. */

export const DEMO_PPG = { ok: true, hr: 64.6, rmssd: 60, hrvOk: true, quality: 0.86 }
export const DEMO_MOTION = { ok: true, peak: 0.01, still: true }
/* Fourteen days of history, one capture a day, so baselineDays comes back 14
   rather than asserted in copy. */
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

/* 24-hour, because the day series is keyed that way and the chart's axis
   prints it; everything a reader is shown is converted back. */
export function clock12(t) {
  const [h, m] = String(t).split(':').map(Number)
  if (!Number.isFinite(h)) return t
  const half = h < 12 ? 'am' : 'pm'
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${half}`
}

/* When the capture was taken. Not a free choice: the day series is the same
   0 to 100 scale as the dial, so the clock has to be the point on it where the
   line is at the score, or the hero number contradicts the chart under it. */
export const TAKEN_AT = (() => {
  const day = DATA.day || []
  if (!day.length) return '13:10'
  let best = day[0]
  for (const d of day) if (Math.abs(d.v - READ.score) < Math.abs(best.v - READ.score)) best = d
  return best.t
})()

export const TODAY = { score: READ.score, day: 'Thursday', clock: clock12(TAKEN_AT) }

/* The first reading after the morning that sits above the normal band. The day
   chart picks the same point out in warn; this names the time it happened. */
export const CROSSED = (() => {
  const day = DATA.day || []
  const i = day.findIndex((d, k) => k > 20 && d.v > BAND.hi)
  return i > 0 ? day[i].t : null
})()

/* The day's own maximum, named rather than left for a reader to find on the
   line. Rounded the way the chart's own tooltip rounds. */
export const PEAK = (() => {
  const day = DATA.day || []
  if (!day.length) return { v: 0, t: '00:00' }
  const hi = day.reduce((a, d) => (d.v > a.v ? d : a), day[0])
  return { v: Math.round(hi.v), t: hi.t }
})()

/* The week. Same generated series the parent screen draws, with the demo day's
   entry replaced by the reading the student screen is actually showing, so no
   strip can contradict the number above it. */
export const TODAY_SHORT = TODAY.day.slice(0, 3)
export const WEEK = (DATA.week || []).map(d => (d.d === TODAY_SHORT ? { ...d, v: TODAY.score } : d))
export const WBAND = DATA.weekBand || BAND

export const WEEK_COUNT = {
  above: WEEK.filter(d => d.v > WBAND.hi).length,
  inside: WEEK.filter(d => d.v >= WBAND.lo && d.v <= WBAND.hi).length,
  below: WEEK.filter(d => d.v < WBAND.lo).length,
}

/* ── The month ──────────────────────────────────────────────────────────── */

/* A month of days, generated. One number a day on the same 0 to 100 scale as
 * the dial, drawn around the middle of this reader's own usual week range,
 * with the weekend dip and the mid-week rise the week series in
 * src/lib/chartdata.js already carries.
 *
 * Seeded from the year and the month, so the same month is the same month on
 * every load, in every screenshot and on every device. A calendar whose
 * squares change on refresh is not a calendar.
 *
 * `null` for a day that has not happened yet: an empty square, never a zero,
 * because 0 is a valid score on this scale and would draw as a calm day. */
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
