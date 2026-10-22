// Breathing rate from the microphone loudness envelope (exhale runs) or from chest motion with the phone on the sternum.
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

// Detrends with a 20 s moving mean and counts upward zero crossings; crossings within `refractory` s are one breath.
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
