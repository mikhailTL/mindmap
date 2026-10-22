// Per-event measures on the per-minute arousal index (0 to 100): recovery time, pre-event rise and back-to-back stress.
// Every comparison is against the wearer's own usual band { lo, hi }.
const HALF_CAP = 90

// Runs above band.hi, split into events at troughs at least `prominence` points below the peaks on both sides.
export function excursions(series, band, { minLength = 2, prominence = 8 } = {}) {
  const hi = band.hi
  const n = series.length
  const out = []
  let i = 0
  while (i < n) {
    if (!(series[i] > hi)) { i++; continue }
    let j = i
    while (j < n && series[j] > hi) j++
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

// Minutes from each peak until the index is halfway back to band.hi (half-recovery time), capped at HALF_CAP.
export function settleTimes(series, band, { cap = HALF_CAP, minLength = 2, prominence = 8 } = {}) {
  const ev = excursions(series, band, { minLength, prominence })
  const n = series.length
  return ev.map((e, idx) => {
    const target = (e.peak + band.hi) / 2
    const nextStart = idx + 1 < ev.length ? ev[idx + 1].start : Infinity
    let k = e.peakAt + 1
    while (k < n && k < nextStart && series[k] > target) k++
    if (k < n && k < nextStart) {
      const m = k - e.peakAt
      return { ...e, target, minutes: Math.min(cap, m), settled: m <= cap, carried: false }
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

export function dailySettle(series, band, opts) {
  const t = settleTimes(series, band, opts)
  const done = t.filter(x => x.settled)
  return {
    events: t.length,
    // Median over all events; unsettled ones count at the minutes they reached.
    median: median(t.map(x => x.minutes)),
    unsettled: t.length - done.length,
    carried: t.filter(x => x.carried).length,
    longest: t.length ? Math.max(...t.map(x => x.minutes)) : null,
    times: t,
  }
}

export function carryOver(series, band, opts) {
  const d = dailySettle(series, band, opts)
  return { events: d.events, carried: d.unsettled, share: d.events ? d.unsettled / d.events : 0 }
}

// Mean rise over `usual` in the `window` minutes before the event; climbFrom follows the last minute within `near` points.
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

export function settleWords(todayMinutes, usualMinutes) {
  if (todayMinutes == null) {
    return { key: 'none', line: 'No peak today, so nothing to settle from.' }
  }
  if (usualMinutes == null) {
    return { key: 'first', line: `Your body took ${todayMinutes} minutes to settle today.` }
  }
  const d = todayMinutes - usualMinutes
  if (d >= 3) return { key: 'longer', line: `Your body took ${todayMinutes} minutes to settle today. Your usual is ${usualMinutes}.` }
  if (d <= -3) return { key: 'shorter', line: `Your body settled in ${todayMinutes} minutes today. Your usual is ${usualMinutes}.` }
  return { key: 'usual', line: `Your body settled in ${todayMinutes} minutes today, about your usual.` }
}

// Demo day: seeded LCG noise over hand-placed bumps for a test, lunch and a presentation.
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
  bump(10 * 60 + 8, 24, 48, 34)
  /* lunch */
  bump(11 * 60 + 55, 13, 10, 20)
  bump(14 * 60 + 5, 34, 65, 95)
  bump(14 * 60 + 42, 14, 12, 900)
  for (let m = 0; m < 1440; m++) {
    const hour = m / 60
    const diurnal = hour < 7 ? -6 : hour > 16 ? 0 : 0
    index[m] = Math.max(0, Math.min(100, index[m] + diurnal + (rnd() - 0.5) * 1.6))
  }
  const usual = new Array(1440).fill(base).map((v, m) => (m < 7 * 60 ? v - 6 : v))
  return { index, usual, band, events: DEMO_EVENTS, span: [7 * 60, 16 * 60], usualSettle: 11 }
}
