/* Three measures from the continuous patch stream that no consumer product
 * reports: settle time, run-up and carry-over. All three are per event. Every
 * wearable on the market reports a level (Whoop 0 to 3, Garmin 0 to 100, Oura
 * zones, Fitbit Body Response alerts) or a daily aggregate; none labels a
 * stress episode and says how long the body took to come back from it.
 *
 * The input is the per-minute arousal index, 0 to 100, that the scorer
 * already produces from heart, sweat, temperature and movement (movement
 * gates the others; see src/signals/score.js), and the wearer's own usual
 * band {lo, hi} from their last fourteen days. Nothing here knows about any
 * other person: every comparison is the wearer against themself.
 *
 *   settle time   minutes from a peak until the index has come half way back
 *                 to the top of the band. This is the half-recovery time of
 *                 a skin conductance response (Dawson, Schell and Filion,
 *                 Handbook of Psychophysiology), scaled from seconds on a
 *                 single response to minutes on a day. Slower recovery goes
 *                 with rumination and worry in adolescents (Aldao 2014;
 *                 Capobianco 2018; Borlimi 2025).
 *   run-up        how far the index rose in the two hours before a marked
 *                 event, against the wearer's usual for those minutes. The
 *                 anticipatory phase is separable from the event itself
 *                 (Pulopulos 2018; Juster 2012) and ambulatory pulse and EDA
 *                 rise the day before an exam (Kazdagli 2024).
 *   carry-over    the share of today's peaks that never settled before the
 *                 next peak began. Perseverative cognition keeps activation
 *                 up between stressors (Brosschot 2006).
 *
 * What the app may say from these: "your body took longer to settle than
 * usual", "arousal rose before your exam". What it may never say: anxiety,
 * depression, risk, any diagnosis. There is no normative cut-off and the
 * functions here do not carry one. */

const HALF_CAP = 90

/* Runs above the top of the band, split into events at a trough deep enough
 * to count as a second peak. `prominence` is in index points: a dip of fewer
 * points than that is the same event still going. */
export function excursions(series, band, { minLength = 2, prominence = 8 } = {}) {
  const hi = band.hi
  const n = series.length
  const out = []
  let i = 0
  while (i < n) {
    if (!(series[i] > hi)) { i++; continue }
    let j = i
    while (j < n && series[j] > hi) j++
    /* series[i..j) is one run above the band. Split it at troughs. */
    const run = series.slice(i, j)
    const cuts = splitAtTroughs(run, prominence)
    for (const [a, b] of cuts) {
      if (b - a < minLength) continue
      let peakAt = a, peak = run[a]
      for (let k = a; k < b; k++) if (run[k] > peak) { peak = run[k]; peakAt = k }
      out.push({ start: i + a, end: i + b, peak, peakAt: i + peakAt })
    }
    i = j
  }
  return out
}

/* Peaks and troughs of one run. A trough splits the run when the peak before
 * it and the peak after it both stand at least `prominence` above it. */
function splitAtTroughs(run, prominence) {
  const n = run.length
  if (n < 3) return [[0, n]]
  const cuts = []
  let segStart = 0
  let lastPeak = run[0]
  let k = 1
  while (k < n - 1) {
    const isTrough = run[k] <= run[k - 1] && run[k] <= run[k + 1]
    if (isTrough) {
      /* the highest point from the segment start up to here */
      let before = -Infinity
      for (let m = segStart; m < k; m++) if (run[m] > before) before = run[m]
      /* the highest point after here until the next trough at least as low */
      let after = -Infinity
      for (let m = k + 1; m < n; m++) { if (run[m] > after) after = run[m]; if (run[m] < run[k]) break }
      if (before - run[k] >= prominence && after - run[k] >= prominence) {
        cuts.push([segStart, k])
        segStart = k
        lastPeak = run[k]
      }
    }
    if (run[k] > lastPeak) lastPeak = run[k]
    k++
  }
  cuts.push([segStart, n])
  return cuts
}

/* For each event: minutes from the peak until the index is half way back to
 * the band top. `settled` is false when the next event began first (carried)
 * or the series ended first. */
export function settleTimes(series, band, { cap = HALF_CAP, minLength = 2, prominence = 8 } = {}) {
  const ev = excursions(series, band, { minLength, prominence })
  const n = series.length
  return ev.map((e, idx) => {
    const target = (e.peak + band.hi) / 2
    const nextStart = idx + 1 < ev.length ? ev[idx + 1].start : Infinity
    let k = e.peakAt + 1
    while (k < n && k < nextStart && series[k] > target) k++
    if (k < n && k < nextStart) {
      return { ...e, target, minutes: Math.min(cap, k - e.peakAt), settled: true, carried: false }
    }
    if (k >= nextStart) {
      return { ...e, target, minutes: Math.min(cap, nextStart - e.peakAt), settled: false, carried: true }
    }
    return { ...e, target, minutes: Math.min(cap, n - e.peakAt), settled: false, carried: false }
  })
}

const median = xs => {
  if (!xs.length) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/* The day's figure: how many events, the median settle time, and how many
 * did not settle. */
export function dailySettle(series, band, opts) {
  const t = settleTimes(series, band, opts)
  const done = t.filter(x => x.settled)
  return {
    events: t.length,
    /* over every event: an event that carried or never settled counts at
       the minutes it had, so a bad afternoon cannot shrink the median */
    median: median(t.map(x => x.minutes)),
    unsettled: t.length - done.length,
    carried: t.filter(x => x.carried).length,
    longest: t.length ? Math.max(...t.map(x => x.minutes)) : null,
    times: t,
  }
}

/* Carry-over on its own, for the card that only needs the share. */
export function carryOver(series, band, opts) {
  const d = dailySettle(series, band, opts)
  return { events: d.events, carried: d.carried, share: d.events ? d.carried / d.events : 0 }
}

/* The rise in the two hours before `eventMinute` (a minute of the day,
 * 0..1439) against `usual`, the wearer's mean index for each minute of the
 * day on unmarked days. `climbFrom` is the first minute of the climb: the
 * minute after the last one at which the index was still within 2 points of
 * usual. */
export function runUp(day, eventMinute, usual, { window = 120, near = 2 } = {}) {
  const to = Math.max(0, Math.min(day.length, eventMinute))
  const from = Math.max(0, to - window)
  if (to <= from) return { from, to, points: 0, climbFrom: to }
  let sum = 0
  for (let m = from; m < to; m++) sum += day[m] - usual[m]
  const points = sum / (to - from)
  let climbFrom = from
  for (let m = to - 1; m >= from; m--) {
    if (Math.abs(day[m] - usual[m]) <= near) { climbFrom = Math.min(to, m + 1); break }
  }
  return { from, to, points, climbFrom }
}

/* The sentence under the figure. It names a duration, never a feeling. */
export function settleWords(todayMinutes, usualMinutes) {
  if (todayMinutes == null) {
    return { key: 'none', line: 'No peak today, so nothing to settle from.' }
  }
  if (usualMinutes == null) {
    return { key: 'first', line: `Your body took ${todayMinutes} minutes to settle today.` }
  }
  const d = todayMinutes - usualMinutes
  if (d >= 3) return { key: 'longer', line: `Your body took ${todayMinutes} minutes to settle today, longer than your usual ${usualMinutes}.` }
  if (d <= -3) return { key: 'shorter', line: `Your body settled in ${todayMinutes} minutes today, faster than your usual ${usualMinutes}.` }
  return { key: 'usual', line: `Your body settled in ${todayMinutes} minutes today, about your usual.` }
}

/* ── demo ───────────────────────────────────────────────────────────────── */

/* A per-minute index for the worked demo day, deterministic, shaped so the
 * card has something true to compute: a run-up before the maths test, a peak
 * that settles, a lunch bump, a presentation whose peak carries into the
 * next one. The dashboard's 10-minute Mind Score line is the smoothed daily
 * number and stays as it is; this is the finer series beneath it. */
function lcg(seed) {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

export const DEMO_EVENTS = [
  { label: 'Maths test',   minute: 10 * 60 + 5,  kind: 'test' },
  { label: 'Presentation', minute: 14 * 60,      kind: 'talk' },
]

export function demoDay() {
  const band = { lo: 36, hi: 55 }
  const rnd = lcg(20261016)
  const base = 44
  const index = new Array(1440).fill(base)
  const bump = (centre, height, riseMin, fallMin) => {
    for (let m = centre - riseMin; m < centre; m++) if (m >= 0) index[m] += height * (m - (centre - riseMin)) / riseMin
    for (let m = centre; m < centre + fallMin; m++) if (m < 1440) index[m] += height * (1 - (m - centre) / fallMin)
  }
  /* run-up from 09:20, peak at the test, settles over about 15 minutes */
  bump(10 * 60 + 8, 24, 48, 34)
  /* lunch */
  bump(11 * 60 + 55, 13, 10, 20)
  /* run-up from 13:00, the presentation's peak at 14:05 settles slowly and
     carries into a second rise at 14:40 that has not settled by 16:00 */
  bump(14 * 60 + 5, 34, 65, 95)
  bump(14 * 60 + 42, 14, 12, 900)
  for (let m = 0; m < 1440; m++) {
    /* the night and early morning sit lower; small deterministic noise */
    const hour = m / 60
    const diurnal = hour < 7 ? -6 : hour > 16 ? 0 : 0
    index[m] = Math.max(0, Math.min(100, index[m] + diurnal + (rnd() - 0.5) * 1.6))
  }
  const usual = new Array(1440).fill(base).map((v, m) => (m < 7 * 60 ? v - 6 : v))
  return { index, usual, band, events: DEMO_EVENTS, span: [7 * 60, 16 * 60], usualSettle: 11 }
}
