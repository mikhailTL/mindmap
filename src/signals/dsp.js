/* Shared numerics for the phone-only capture. No DOM in this file, so every
   function here runs unchanged in Node, which is how it gets tested against
   signals whose answer is known in advance. */

export const mean = a => a.reduce((x, y) => x + y, 0) / (a.length || 1)

export function sd(a) {
  if (a.length < 2) return 0
  const m = mean(a)
  return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1))
}

export function median(a) {
  if (!a.length) return NaN
  const s = [...a].sort((x, y) => x - y), h = s.length >> 1
  return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2
}

export function percentile(a, p) {
  if (!a.length) return NaN
  const s = [...a].sort((x, y) => x - y)
  const i = (s.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i)
  return lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (i - lo)
}

/* Irregular samples onto a uniform grid. Camera frames arrive when the camera
   feels like delivering them — 30 fps nominal means anything from 28 to 33 in
   practice, and every frequency estimate below assumes an even spacing it has
   to be given. Linear interpolation is enough: the gaps are a frame or two,
   well inside the band of interest. */
export function resample(t, v, fs) {
  if (t.length < 4) return { y: [], fs }
  const t0 = t[0], t1 = t[t.length - 1]
  const n = Math.floor((t1 - t0) * fs / 1000)
  const y = new Float64Array(n)
  let j = 0
  for (let i = 0; i < n; i++) {
    const tt = t0 + (i * 1000) / fs
    while (j < t.length - 2 && t[j + 1] < tt) j++
    const span = t[j + 1] - t[j] || 1
    y[i] = v[j] + (v[j + 1] - v[j]) * ((tt - t[j]) / span)
  }
  return { y: Array.from(y), fs }
}

/* Iterative radix-2 FFT, in place on separate real and imaginary arrays.
   Written out rather than pulled in, because one 1024-point transform is not
   worth a dependency on the critical path of a 30-second capture. */
export function fft(re, im, inverse = false) {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[re[i], re[j]] = [re[j], re[i]]
      ;[im[i], im[j]] = [im[j], im[i]]
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (inverse ? 2 : -2) * Math.PI / len
    const wr = Math.cos(ang), wi = Math.sin(ang)
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = i + k + len / 2
        const xr = re[b] * cr - im[b] * ci
        const xi = re[b] * ci + im[b] * cr
        re[b] = re[a] - xr; im[b] = im[a] - xi
        re[a] += xr;       im[a] += xi
        const nr = cr * wr - ci * wi
        ci = cr * wi + ci * wr; cr = nr
      }
    }
  }
  if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n }
}

const nextPow2 = n => 1 << Math.ceil(Math.log2(Math.max(2, n)))

/* Zero every bin outside [lo, hi] Hz and transform back. A brick wall in the
   frequency domain rings in the time domain, which would move a peak; the
   edges are therefore raised-cosine over 0.15 Hz rather than square. The
   signal is mean-removed first so bin 0 does not dominate the taper. */
export function bandpass(x, fs, lo, hi) {
  const n = nextPow2(x.length)
  const m = mean(x)
  const re = new Float64Array(n), im = new Float64Array(n)
  for (let i = 0; i < x.length; i++) re[i] = x[i] - m
  fft(re, im)
  const roll = 0.15
  for (let k = 0; k <= n / 2; k++) {
    const f = (k * fs) / n
    let g = 1
    if (f < lo - roll || f > hi + roll) g = 0
    else if (f < lo) g = 0.5 - 0.5 * Math.cos(Math.PI * (f - (lo - roll)) / roll)
    else if (f > hi) g = 0.5 + 0.5 * Math.cos(Math.PI * (f - hi) / roll)
    re[k] *= g; im[k] *= g
    if (k > 0 && k < n / 2) { re[n - k] *= g; im[n - k] *= g }
  }
  fft(re, im, true)
  return Array.from(re.slice(0, x.length))
}

/* Single-sided power spectrum, for the band-concentration part of the quality
   score. */
export function spectrum(x, fs) {
  const n = nextPow2(x.length)
  const m = mean(x)
  const re = new Float64Array(n), im = new Float64Array(n)
  /* Hann window, so a heart rate that falls between two bins does not smear
     its power across the whole band and read as noise. */
  for (let i = 0; i < x.length; i++) {
    const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (x.length - 1))
    re[i] = (x[i] - m) * w
  }
  fft(re, im)
  const half = n / 2
  const f = new Array(half), p = new Array(half)
  for (let k = 0; k < half; k++) {
    f[k] = (k * fs) / n
    p[k] = re[k] * re[k] + im[k] * im[k]
  }
  return { f, p }
}

/* Local maxima with a refusal distance, refined to sub-sample position.
   The refinement matters more than it looks: at 30 fps a peak is located to
   the nearest 33 ms, and quantising beat times to 33 ms adds roughly 20 ms of
   pure artefact to RMSSD — the same order as the number being measured. A
   parabola through the peak sample and its two neighbours takes that back. */
export function peaks(x, fs, minGapS) {
  const gap = Math.max(1, Math.round(minGapS * fs))
  const thr = 0.35 * percentile(x.map(Math.abs), 0.9)
  const out = []
  for (let i = 1; i < x.length - 1; i++) {
    if (x[i] <= x[i - 1] || x[i] < x[i + 1] || x[i] < thr) continue
    const prev = out[out.length - 1]
    if (prev && i - prev.i < gap) {
      if (x[i] > x[prev.i]) out.pop()
      else continue
    }
    const a = x[i - 1], b = x[i], c = x[i + 1]
    const den = a - 2 * b + c
    const d = den === 0 ? 0 : (0.5 * (a - c)) / den
    out.push({ i, t: ((i + Math.max(-0.5, Math.min(0.5, d))) * 1000) / fs, amp: b })
  }
  return out
}
