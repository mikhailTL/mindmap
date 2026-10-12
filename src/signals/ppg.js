import { bandpass, mean, median, percentile, resample, sd, spectrum } from './dsp.js'

/* Photoplethysmography off the phone camera. In: the per-frame mean red
 * channel from capture.js. Out: rate, and variation in the gaps between beats.
 * Constants were fitted against synthetic captures with known heart rate and
 * known RMSSD; measured figures are quoted where they decided a value.
 *
 * CAVEAT on the HRV output: narrowing the band to steady beat timing also
 * attenuates genuine variation, and the returned HRV ran ~20% below the planted
 * RMSSD, stably across rates. It is not a clinical RMSSD and must never be
 * presented as one — only as a z-score against the same person's own history
 * captured the same way, where the scale factor cancels. */
export const FS = 30            /* camera frame rate the signal is resampled to */
const WARMUP_S = 2              /* dropped: auto-exposure is still hunting */
const MIN_S = 12
const IBI_TOL = 0.25            /* an interval this far off the local median is an artefact */
const HRV_BAND_K = 1.3          /* scales the HRV band to ~1 sd, calibrated below */
const JITTER_CAL = 1.75         /* measured correction on the timing-noise estimate */
const JITTER_MAX_MS = 14        /* above this the HRV number is mostly the camera */

export function analysePPG(samples) {
  if (samples.length < MIN_S * 20) return fail('too-short', 'The capture stopped early.')

  const { y } = resample(samples.map(s => s.t), samples.map(s => s.v), FS)
  const raw = y.slice(Math.round(WARMUP_S * FS))
  const durS = raw.length / FS
  if (durS < MIN_S) return fail('too-short', 'The capture stopped early.')

  /* Uncovered lens, or a fingertip pressed hard enough to blanch: both give a
     high mean with almost no swing on it. */
  const level = mean(raw)
  const swing = percentile(raw, 0.95) - percentile(raw, 0.05)
  if (swing / (level || 1) < 0.0015) {
    return fail('no-contact', 'Cover the lens and the light fully with one fingertip.')
  }

  const wide = bandpass(raw, FS, 0.7, 3.5)
  const f0 = dominant(wide)
  if (!f0) return fail('no-pulse', 'No steady pulse there. Hold still and try again.')

  /* Beat timing comes off a band tightened around the rate just found: noise
     outside it moves each peak independently and lands straight in RMSSD.
     f0-0.5 Hz to f0x1.25 minimised RMSSD error over seven synthetic cases —
     narrower attenuated real variation (true 55 ms read 17 ms low at f0x1.08),
     wider readmitted noise. */
  const lo = Math.max(0.45, f0 - 0.5)
  const hi = Math.min(3.9, f0 * 1.25)
  const tight = bandpass(raw, FS, lo, hi)
  const amp = sd(tight) || 1
  /* Discard one second at each end: the band-pass FFT treats the record as
     circular, so the first and last samples are convolved with the opposite
     end and would dominate RMSSD on a short capture. */
  const edge = FS
  const wave = tight.slice(edge, tight.length - edge).map(x => x / amp)

  /* Upward zero crossings, not peaks: a band-limited pulse has a flat apex and
     a steep crossing, where amplitude noise moves the time estimate least.
     Crossings cut RMSSD error from 15.1 ms to 8.0 ms at 88 bpm. */
  const marks = crossings(wave, FS, 0.6 / f0)
  if (marks.length < 8) return fail('no-pulse', 'No steady pulse there. Hold still and try again.')

  /* How far noise can move a crossing: residual amplitude over slope. Noise is
     measured above the pulse band, where a camera's is flat, then scaled to
     the timing filter's bandwidth. */
  const above = bandpass(raw, FS, 4.5, 14)
  const noiseSd = Math.sqrt((sd(above) ** 2 * (hi - lo)) / 9.5) / amp
  const slope = median(marks.map(m => Math.abs(m.slope)))
  const jitterMs = slope > 0 ? (noiseSd / slope) * 1000 : Infinity

  const all = []
  for (let i = 1; i < marks.length; i++) all.push(marks[i].t - marks[i - 1].t)
  const kept = []
  let dropped = 0
  for (let i = 0; i < all.length; i++) {
    const ref = median(all.slice(Math.max(0, i - 5), i + 6))
    if (all[i] >= 300 && all[i] <= 2000 && Math.abs(all[i] - ref) / ref <= IBI_TOL) kept.push({ i, d: all[i] })
    else dropped++
  }
  if (kept.length < 6) return fail('unstable', 'That one was too noisy to score. Try again, still.')

  const ibi = kept.map(k => k.d)
  /* Successive differences only between adjacent intervals: bridging a
     rejected beat invents a difference that never happened. */
  const diffs = []
  for (let i = 1; i < kept.length; i++) {
    if (kept[i].i === kept[i - 1].i + 1) diffs.push(kept[i].d - kept[i - 1].d)
  }
  const hr = 60000 / median(ibi)
  const enough = diffs.length >= 8
  const rmssdRaw = enough ? Math.sqrt(mean(diffs.map(d => d * d))) : null

  /* Quadrature sum of two independent blurs: sampling — RMSSD's own standard
     error, ~rmssd/sqrt(2N), being ~12% over 32 s and ~17% over 18 s — and
     timing, the per-beat placement noise above. HRV_BAND_K carries the two to
     about one sd; set so the band held the true value on four captures in five
     across nine synthetic cases. */
  const hrvBand = enough
    ? HRV_BAND_K * Math.sqrt((rmssdRaw / Math.sqrt(2 * diffs.length)) ** 2 + (JITTER_CAL * jitterMs) ** 2)
    : null

  /* Gate on absolute timing noise, never on its ratio to the answer: low HRV
     is the signal of interest, and a ratio test rejected every 88 and 104 bpm
     capture despite errors under 1 ms. The 14 ms cut separated clean synthetic
     captures (5.7-9.6 ms) from noisy ones (17-55 ms). */
  const hrvOk = enough && jitterMs <= JITTER_MAX_MS
  /* A band wider than the number it qualifies is a ceiling, not a measurement:
     report "under 26 ms", never "3 ms plus or minus 23". */
  const hrvResolved = hrvOk && hrvBand <= rmssdRaw
  const quality = qualityOf(wide, f0, ibi, kept.length, all.length, durS, jitterMs)

  return {
    ok: true, reason: null,
    hr,
    rmssd: hrvOk ? rmssdRaw : null,
    rmssdBand: hrvOk ? hrvBand : null,
    sdnn: hrvOk ? sd(ibi) : null,
    pnn50: hrvOk ? diffs.filter(d => Math.abs(d) > 50).length / diffs.length : null,
    hrvOk, hrvResolved, jitterMs,
    beats: kept.length + 1, durS, kept: kept.length, dropped,
    quality, wave, ibi,
  }
}

/* Strongest frequency in the 0.7-3.5 Hz heart band, in Hz, interpolated across
   its two neighbouring bins so the answer is not pinned to a bin edge. */
function dominant(x) {
  const { f, p } = spectrum(x, FS)
  let k0 = -1
  for (let k = 1; k < f.length - 1; k++) {
    if (f[k] < 0.7 || f[k] > 3.5) continue
    if (k0 < 0 || p[k] > p[k0]) k0 = k
  }
  if (k0 < 1) return null
  const a = p[k0 - 1], b = p[k0], c = p[k0 + 1], den = a - 2 * b + c
  const d = den === 0 ? 0 : (0.5 * (a - c)) / den
  return f[k0] + Math.max(-0.5, Math.min(0.5, d)) * (f[1] - f[0])
}

/* Upward zero crossings as { t: ms, slope }, placed between the two samples
   straddling zero. The slope is kept for the timing-noise estimate. */
function crossings(w, fs, minGapS) {
  const out = []
  const gap = minGapS * 1000
  for (let i = 1; i < w.length; i++) {
    if (w[i - 1] >= 0 || w[i] < 0) continue
    const frac = w[i] === w[i - 1] ? 0 : -w[i - 1] / (w[i] - w[i - 1])
    const t = ((i - 1 + frac) * 1000) / fs
    if (out.length && t - out[out.length - 1].t < gap) continue
    out.push({ t, slope: (w[i] - w[i - 1]) * fs })
  }
  return out
}

/* Capture quality, 0-1: the product of power concentration at one rate and its
   harmonic, interval regularity, beat survival, timing noise and length. A
   product, so any one term failing pulls the result down alone. */
function qualityOf(wide, f0, ibi, kept, total, durS, jitterMs) {
  const { f, p } = spectrum(wide, FS)
  let inBand = 0, atPulse = 0
  for (let k = 0; k < f.length; k++) {
    if (f[k] < 0.7 || f[k] > 3.5) continue
    inBand += p[k]
    if (Math.abs(f[k] - f0) <= 0.2 || Math.abs(f[k] - 2 * f0) <= 0.2) atPulse += p[k]
  }
  const concentration = inBand > 0 ? atPulse / inBand : 0
  const regularity = 1 - Math.min(1, sd(ibi) / (median(ibi) * 0.2))
  const survival = total > 0 ? kept / total : 0
  const timing = 1 - Math.min(1, jitterMs / 25)
  const length = Math.min(1, durS / 25)
  return clamp01(concentration) * clamp01(0.45 + 0.55 * regularity) *
         clamp01(survival) * clamp01(0.35 + 0.65 * timing) * length
}

const clamp01 = x => Math.max(0, Math.min(1, x))
const fail = (reason, message) => ({ ok: false, reason, message, quality: 0, hrvOk: false })
