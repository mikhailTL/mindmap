import { bandpass, mean, median, percentile, resample, sd, spectrum } from './dsp.js'

/* Photoplethysmography off the phone camera.
 *
 * A fingertip over the lens with the torch on turns the camera into the same
 * class of sensor the patch carries: light in, light out, and the blood volume
 * in between changing how much comes back. The red channel of each frame,
 * averaged over the middle of the sensor, is the raw signal. Everything here
 * turns that into the two heart features the patch model already takes — the
 * rate, and the variation in the gaps between beats.
 *
 * Every constant below was chosen against synthetic captures whose true heart
 * rate and true RMSSD were known in advance. The numbers those runs produced
 * are quoted where they decided something.
 *
 * One property of the method has to be stated plainly, because it decides how
 * the output may be used. Narrowing the band to steady the beat timing also
 * attenuates some of the genuine beat-to-beat variation: against synthetic
 * captures the returned HRV ran about 20% below the planted RMSSD, and the
 * shortfall was stable across rates. So this number is not a clinical RMSSD
 * and is never presented as one. It is an index on a fixed scale of its own,
 * and the scorer only ever uses it as a z-score against the same person's own
 * history captured the same way, where a constant scale factor cancels.
 */
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

  /* A lens that is not covered, or a fingertip pressed hard enough to blanch,
     both give a bright nearly flat frame: a high mean with almost nothing
     moving on it. */
  const level = mean(raw)
  const swing = percentile(raw, 0.95) - percentile(raw, 0.05)
  if (swing / (level || 1) < 0.0015) {
    return fail('no-contact', 'Cover the lens and the light fully with one fingertip.')
  }

  const wide = bandpass(raw, FS, 0.7, 3.5)
  const f0 = dominant(wide)
  if (!f0) return fail('no-pulse', 'No steady pulse there. Hold still and try again.')

  /* Beat timing is taken off a band tightened around the rate that was just
     found, not off the whole 0.7-3.5 Hz window. Out-of-band noise moves each
     peak independently, and independent per-beat error lands directly in
     RMSSD, which is built from differences between neighbouring beats.
     f0-0.5 Hz to f0x1.25 was the setting that minimised RMSSD error across
     seven synthetic cases: narrower suppressed more noise but started
     attenuating genuine variation (a true 55 ms read 17 ms low at f0x1.08),
     wider let the noise back in. */
  const lo = Math.max(0.45, f0 - 0.5)
  const hi = Math.min(3.9, f0 * 1.25)
  const tight = bandpass(raw, FS, lo, hi)
  const amp = sd(tight) || 1
  /* A second of filtered signal is discarded at each end. The band-pass runs
     through an FFT, so the transform treats the record as circular and the
     first and last samples are convolved with the opposite end of the
     capture. Left in, those corrupted beats landed in RMSSD, and on a short
     capture they dominated it. */
  const edge = FS
  const wave = tight.slice(edge, tight.length - edge).map(x => x / amp)

  /* Upward zero crossings, not peaks. A band-limited pulse has a flat apex
     and a steep zero crossing, and the steep part is where a given amount of
     amplitude noise moves the time estimate least. Swapping apexes for
     crossings cut RMSSD error by roughly a third on the same captures
     (15.1 ms to 8.0 ms at 88 bpm). */
  const marks = crossings(wave, FS, 0.6 / f0)
  if (marks.length < 8) return fail('no-pulse', 'No steady pulse there. Hold still and try again.')

  /* How far noise can move a crossing: the residual amplitude that survives
     the timing filter, divided by how fast the wave is moving as it crosses.
     Measured above the pulse band, where a camera's noise is flat, then
     scaled to the bandwidth the timing filter passes. */
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
  /* Successive differences only between genuinely adjacent intervals —
     bridging a rejected beat would invent a difference that never happened. */
  const diffs = []
  for (let i = 1; i < kept.length; i++) {
    if (kept[i].i === kept[i - 1].i + 1) diffs.push(kept[i].d - kept[i - 1].d)
  }
  const hr = 60000 / median(ibi)
  const enough = diffs.length >= 8
  const rmssdRaw = enough ? Math.sqrt(mean(diffs.map(d => d * d))) : null

  /* Two independent things blur an RMSSD read off a camera, and the stated
     band is their sum in quadrature.

     Sampling: RMSSD is a root-mean-square over a finite number of successive
     differences, so its own standard error is about rmssd / sqrt(2N) — around
     12% over a 32-second capture, 17% over 18 seconds.

     Timing: the per-beat placement noise estimated above, which enters every
     difference. HRV_BAND_K carries the two to about one standard deviation;
     it was set so the stated band contained the true value on roughly four
     captures in five across nine synthetic cases, rather than being picked to
     look tight. */
  const hrvBand = enough
    ? HRV_BAND_K * Math.sqrt((rmssdRaw / Math.sqrt(2 * diffs.length)) ** 2 + (JITTER_CAL * jitterMs) ** 2)
    : null

  /* The gate is on the timing noise itself rather than on its ratio to the
     answer. A ratio test throws away exactly the captures worth keeping: a
     stressed teenager has low HRV by definition, so dividing by it rejected
     every 88 and 104 bpm capture in testing while their actual error was
     under 1 ms. Timing noise below 14 ms separated the clean synthetic
     captures (5.7-9.6 ms) from the noisy ones (17-55 ms) cleanly. */
  const hrvOk = enough && jitterMs <= JITTER_MAX_MS
  /* A band wider than the number it qualifies is not a measurement of that
     number, it is a ceiling on it — which is what a metronome-steady pulse
     produces, and printing "3 ms plus or minus 23" instead of "under 26 ms"
     states a precision that is not there. */
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

/* The strongest frequency inside the plausible heart band, interpolated across
   its two neighbours so the answer is not pinned to a bin edge. */
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

/* Upward zero crossings, placed between the two samples that straddle zero,
   with the slope there kept because the timing-noise estimate needs it. */
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

/* Four things have to hold for a camera pulse to be worth scoring: the power
   sits at one rate and its harmonic, the intervals agree with each other, most
   of the beats found survived the artefact pass, and the capture ran long
   enough. Multiplied, so any one of them failing pulls the result down alone. */
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
