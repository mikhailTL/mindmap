/* Breathing, measured two ways, from what a phone already has.
 *
 *   exhales / breathsFromEnvelope   the microphone's loudness envelope. A
 *       mouth exhale is a run of sound above a floor; its length is the
 *       exhale length. Nothing about the sound but its level is used, and
 *       the level is thrown away as soon as it is measured (src/toolkit/
 *       audio.js). Microphone breathing-phase detection runs at about 75%
 *       in the literature (Shih 2019), which is good enough to pace a
 *       breathing exercise and show the exhale getting longer, and not good
 *       enough to call a diagnosis. It is not asked to.
 *
 *   breathsFromMotion   the accelerometer with the phone resting on the
 *       chest, lying down. The chest rises and falls once per breath; the
 *       dominant slow cycle in the axis through the phone is the breathing
 *       rate. A phone on the sternum matches a respiration band at R^2 0.976
 *       on inter-breath interval (Cinotti 2025, N=10).
 *
 * Both are pure functions over arrays so they can be tested without a
 * phone. */

/* Runs of level above `floor` lasting at least `minSeconds`. */
export function exhales(samples, hz, { floor = 0.05, minSeconds = 1 } = {}) {
  const out = []
  const minN = Math.round(minSeconds * hz)
  let i = 0
  const n = samples.length
  while (i < n) {
    if (!(samples[i] > floor)) { i++; continue }
    let j = i
    while (j < n && samples[j] > floor) j++
    if (j - i >= minN) out.push({ start: i / hz, seconds: (j - i) / hz, peak: Math.max(...samples.slice(i, j)) })
    i = j
  }
  return out
}

export function breathsFromEnvelope(samples, hz, opts) {
  const ex = exhales(samples, hz, opts)
  const seconds = samples.length / hz
  const meanExhale = ex.length ? ex.reduce((a, e) => a + e.seconds, 0) / ex.length : null
  return {
    breaths: ex.length,
    perMinute: seconds > 0 ? (ex.length * 60) / seconds : null,
    meanExhale,
    longest: ex.length ? Math.max(...ex.map(e => e.seconds)) : null,
    exhales: ex,
  }
}

/* The slow cycle in a chest-axis series. Detrend with a moving mean, then
 * count upward zero crossings with a refractory gap so noise inside one
 * breath cannot count twice. Breathing sits between 4 and 30 per minute, so
 * crossings closer than two seconds apart are the same breath. */
export function breathsFromMotion(series, hz, { minSeconds = 10, refractory = 2 } = {}) {
  const n = series.length
  if (n < minSeconds * hz) return { perMinute: null, breaths: 0, seconds: n / hz }
  const smooth = movingMean(series, Math.max(1, Math.round(hz * 0.5)))
  const trend = movingMean(smooth, Math.max(1, Math.round(hz * 20)))
  const x = smooth.map((v, i) => v - trend[i])
  const gap = Math.round(refractory * hz)
  const crossings = []
  for (let i = 1; i < n; i++) {
    if (x[i - 1] <= 0 && x[i] > 0 && (!crossings.length || i - crossings[crossings.length - 1] >= gap)) crossings.push(i)
  }
  const seconds = n / hz
  if (crossings.length < 3) return { perMinute: null, breaths: crossings.length, seconds }
  /* rate from the intervals between crossings, so a partial breath at
     either end of the window does not count as a whole one */
  const span = (crossings[crossings.length - 1] - crossings[0]) / hz
  return { perMinute: (60 * (crossings.length - 1)) / span, breaths: crossings.length, seconds }
}

function movingMean(a, w) {
  const out = new Array(a.length)
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    sum += a[i]
    if (i >= w) sum -= a[i - w]
    out[i] = sum / Math.min(w, i + 1)
  }
  return out
}
