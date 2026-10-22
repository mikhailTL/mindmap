// Band-pass as the difference of 0.25 s and 2 s moving means; a peak above 0.08 g is a step,
// with a 0.3 s refractory gap (at most 200 steps/min).
// Step counting from gravity-removed acceleration magnitude in g (|a| / 9.81 - 1).
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

export function walkWords(steps, perMinute) {
  if (!steps) return 'No steps counted.'
  const s = steps === 1 ? 'step' : 'steps'
  if (perMinute == null) return `${steps} ${s}.`
  return `${steps} ${s} at ${Math.round(perMinute)} a minute.`
}
