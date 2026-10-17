import { bandpass, mean, median, percentile, resample, sd, spectrum } from './dsp.js'

/* The Mental Mirror: what a face gives away, as numbers.
 *
 * In: one record per camera frame from face-capture.js — the 52 blendshape
 * scores MediaPipe's Face Landmarker returns, the eye aperture and nose
 * position read off its 478 landmarks, and the mean green level of a patch of
 * forehead skin. Out: a handful of per-capture features, each one a thing a
 * person can recognise in themselves, plus a contactless heart rate.
 *
 * DOM-free, so it runs under Node against synthetic frames.
 *
 * Every feature is scored as a z-score against the same person's own
 * history, captured the same way (face-score.js). None of the face weights
 * are fitted: no public dataset pairs face video with stress labels on the
 * sensors this app already reads. UBFC-Phys (56 people, face video + the same
 * wrist device WESAD used) is the validation set; access is by request. Until
 * that is run, the face channel is a starting allocation and the copy on
 * screen says so. */

export const FACE_SECONDS = 30
export const FS = 30

/* Blendshapes that carry tension. Names are MediaPipe's. */
const BROW = ['browDownLeft', 'browDownRight']
const BROW_INNER = ['browInnerUp']
const SQUINT = ['eyeSquintLeft', 'eyeSquintRight']
const LIP = ['mouthPressLeft', 'mouthPressRight']
const JAW = ['jawForward']
const BLINK = ['eyeBlinkLeft', 'eyeBlinkRight']

const BLINK_ON = 0.5          /* blendshape score at which a blink has started */
const BLINK_OFF = 0.3
const MIN_S = 12

const avg = (bs, keys) => mean(keys.map(k => bs[k] ?? 0))

export function analyseFace(frames) {
  if (frames.length < MIN_S * 15) return fail('too-short', 'The capture stopped early.')
  const durS = (frames[frames.length - 1].t - frames[0].t) / 1000
  if (durS < MIN_S) return fail('too-short', 'The capture stopped early.')
  const seen = frames.filter(f => f.ok)
  if (seen.length / frames.length < 0.6) return fail('no-face', 'The camera could not keep your face in view. Face the phone in good light.')

  /* Blink rate: rising edges on the mean of the two eye-blink scores, with a
     hysteresis so a flicker on the threshold is not two blinks. */
  let blinks = 0, closed = false
  const blinkScore = seen.map(f => avg(f.bs, BLINK))
  for (const b of blinkScore) {
    if (!closed && b >= BLINK_ON) { closed = true; blinks++ }
    else if (closed && b <= BLINK_OFF) closed = false
  }
  const blinkRate = (blinks * 60) / durS

  /* Tension shapes: time-averaged over the capture, blinks excluded from the
     squint so a blink does not read as a wince. */
  const open = seen.filter((_, i) => blinkScore[i] < BLINK_OFF)
  const pool = open.length >= seen.length * 0.5 ? open : seen
  const browFurrow = mean(pool.map(f => avg(f.bs, BROW)))
  const browRaise = mean(pool.map(f => avg(f.bs, BROW_INNER)))
  const eyeSquint = mean(pool.map(f => avg(f.bs, SQUINT)))
  const lipPress = mean(pool.map(f => avg(f.bs, LIP)))
  const jawForward = mean(pool.map(f => avg(f.bs, JAW)))

  /* Eye aperture variability (EAR), blinks excluded: fidgeting eyes. */
  const ears = pool.map(f => f.ear).filter(Number.isFinite)
  const earVar = ears.length > 10 ? sd(ears) / (mean(ears) || 1) : 0

  /* Head micro-movement: frame-to-frame nose displacement as a fraction of
     face width, so distance from the camera cancels. */
  const steps = []
  for (let i = 1; i < seen.length; i++) {
    const a = seen[i - 1], b = seen[i]
    const w = (a.faceW + b.faceW) / 2 || 1
    steps.push(Math.hypot(b.nose[0] - a.nose[0], b.nose[1] - a.nose[1]) / w)
  }
  const headMotion = steps.length ? median(steps) * FS : 0   /* face-widths per second */
  const headTurns = steps.length ? percentile(steps, 0.95) * FS : 0

  const rppg = analyseRPPG(seen.map(f => ({ t: f.t, v: f.green })))

  return {
    ok: true, reason: null, durS, framesSeen: seen.length, frames: frames.length,
    blinkRate, browFurrow, browRaise, eyeSquint, lipPress, jawForward, earVar, headMotion, headTurns,
    hr: rppg.ok ? rppg.hr : null, hrQuality: rppg.ok ? rppg.quality : 0, rppg,
  }
}

/* Contactless pulse from a patch of forehead skin, green channel: the blood
 * volume pulse modulates reflected green light by a few tenths of a percent.
 * Rate only. Beat-to-beat variation at 30 fps off a face is below the noise
 * floor and is not reported; the fingertip reading remains the place for it.
 * Survey of the method: McDuff, "Camera Measurement of Physiological Vital
 * Signs", 2021. */
export function analyseRPPG(samples) {
  if (samples.length < MIN_S * 15) return { ok: false, reason: 'too-short' }
  const { y } = resample(samples.map(s => s.t), samples.map(s => s.v), FS)
  const raw = y.slice(2 * FS)                   /* auto-exposure settles */
  if (raw.length < MIN_S * FS) return { ok: false, reason: 'too-short' }
  const level = mean(raw) || 1
  const x = raw.map(v => v / level - 1)         /* fractional change */
  const wide = bandpass(x, FS, 0.7, 3.0)
  const { f, p } = spectrum(wide, FS)
  let k0 = -1, inBand = 0, total = 0
  for (let k = 1; k < f.length - 1; k++) {
    if (f[k] < 0.5 || f[k] > 4) continue
    total += p[k]
    if (f[k] >= 0.7 && f[k] <= 3.0) { inBand += p[k]; if (k0 < 0 || p[k] > p[k0]) k0 = k }
  }
  if (k0 < 1) return { ok: false, reason: 'no-pulse' }
  const a = p[k0 - 1], b = p[k0], c = p[k0 + 1], den = a - 2 * b + c
  const d = den === 0 ? 0 : (0.5 * (a - c)) / den
  const f0 = f[k0] + Math.max(-0.5, Math.min(0.5, d)) * (f[1] - f[0])
  /* Quality: how much of the band's power sits in the peak and its two
     neighbours. Below 0.25 the "pulse" is as likely lighting flicker or a
     head movement, and the rate is withheld. */
  const peakPower = a + b + c
  const quality = inBand > 0 ? Math.min(1, peakPower / inBand) : 0
  const swing = percentile(x, 0.95) - percentile(x, 0.05)
  if (quality < 0.25 || swing > 0.08) return { ok: false, reason: 'unstable', quality }
  return { ok: true, hr: f0 * 60, quality, snr: total > 0 ? inBand / total : 0 }
}

function fail(reason, message) {
  return { ok: false, reason, message }
}
