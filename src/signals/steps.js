/* Steps, from the accelerometer, with the phone in a hand or a pocket.
 *
 * The input is the gravity-removed acceleration magnitude in g: |a| / 9.81
 * minus 1, the same quantity src/signals/motion.js reads, so a phone held at
 * any angle sits at zero when still and swings either side of it with each
 * stride. A step is a heel strike: a short positive spike at a cadence of
 * one to three a second.
 *
 * Band-pass by two moving means: a 0.25 s mean takes out sensor noise above
 * the stride rate, a 2 s mean takes out the slow drift of a hand swinging or
 * a phone settling in a pocket, and the difference is what is left between
 * them. A peak above 0.08 g counts, and nothing counts again within 0.3 s,
 * because nobody walks faster than two hundred steps a minute.
 *
 * Pure functions over arrays, so they are tested without a phone. The
 * samples never leave the page and are dropped when the screen closes. */

export const PEAK_G = 0.08
export const REFRACTORY_S = 0.3
export const FAST_MEAN_S = 0.25
export const SLOW_MEAN_S = 2

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

/* `mags` in g, `hz` the sample rate. Returns the count, the cadence in steps
   per minute over the whole series, and the length of the series. */
export function countSteps(mags, hz) {
  const n = mags?.length || 0
  if (!n || !(hz > 0)) return { steps: 0, perMinute: null, seconds: 0 }
  const seconds = n / hz
  const fast = movingMean(mags, Math.max(1, Math.round(hz * FAST_MEAN_S)))
  const slow = movingMean(mags, Math.max(1, Math.round(hz * SLOW_MEAN_S)))
  const gap = Math.max(1, Math.round(hz * REFRACTORY_S))
  let steps = 0
  let last = -Infinity
  for (let i = 1; i < n - 1; i++) {
    const x = fast[i] - slow[i]
    if (x < PEAK_G) continue
    if (x < fast[i - 1] - slow[i - 1]) continue
    if (x < fast[i + 1] - slow[i + 1]) continue
    if (i - last < gap) continue
    steps += 1
    last = i
  }
  const perMinute = seconds >= 1 ? (steps * 60) / seconds : null
  return { steps, perMinute, seconds }
}

/* One sentence with the numbers. A count and a rate, never a feeling. */
export function walkWords(steps, perMinute) {
  if (!steps) return 'No steps counted.'
  const s = steps === 1 ? 'step' : 'steps'
  if (perMinute == null) return `${steps} ${s}.`
  return `${steps} ${s} at ${Math.round(perMinute)} a minute.`
}
