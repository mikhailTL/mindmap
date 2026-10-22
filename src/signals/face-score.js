// Mental Mirror score: the pulse goes through the TNAM model; face cues add hand-weighted terms on personal z-scores.
import {
  FEATURES, ORDINARY_LOGIT, SCORE_TEMPERATURE, calibratedContributions, calibratedLogit,
  forward, identityCalibration,
} from './tnam.js'

const K = 2.4

// Positive weight raises the score. Directions follow the facial-stress literature; the weights are not fitted.
export const FACE_TERMS = [
  { id: 'blinkRate',  w: 0.55, label: 'Blink rate' },
  { id: 'browFurrow', w: 0.60, label: 'Brow tension' },
  { id: 'lipPress',   w: 0.40, label: 'Lip pressing' },
  { id: 'eyeSquint',  w: 0.30, label: 'Eye tightening' },
  { id: 'headMotion', w: 0.35, label: 'Restlessness' },
  { id: 'earVar',     w: 0.25, label: 'Eye movement' },
]

// Priors until personal history exists: hr in bpm, blinkRate in blinks/min, blendshapes 0 to 1, headMotion in face widths/s.
export const FACE_PRIOR = {
  hr:         { m: 76,    s: 11 },
  blinkRate:  { m: 17,    s: 7 },
  browFurrow: { m: 0.12,  s: 0.08 },
  lipPress:   { m: 0.08,  s: 0.06 },
  eyeSquint:  { m: 0.15,  s: 0.10 },
  headMotion: { m: 0.015, s: 0.010 },
  earVar:     { m: 0.06,  s: 0.03 },
}

export function emptyFaceBaseline() {
  return { n: 0, days: 0, stats: {}, lastDay: null }
}

export function updateFaceBaseline(baseline, features, dayKey) {
  const b = { ...baseline, stats: { ...baseline.stats } }
  for (const [k, v] of Object.entries(features)) {
    if (v == null || !Number.isFinite(v)) continue
    // Welford running mean and variance per feature.
    const st = b.stats[k] ? { ...b.stats[k] } : { n: 0, m: 0, m2: 0 }
    st.n += 1
    const d = v - st.m
    st.m += d / st.n
    st.m2 += d * (v - st.m)
    b.stats[k] = st
  }
  b.n += 1
  if (dayKey && dayKey !== b.lastDay) { b.days += 1; b.lastDay = dayKey }
  return b
}

function zOf(key, value, baseline) {
  const st = baseline.stats[key]
  const prior = FACE_PRIOR[key]
  if (!st || st.n < 2) return prior ? (value - prior.m) / prior.s : 0
  // SD floored at 30% of the prior so a very steady history does not inflate z.
  const own = st.n >= 5 ? Math.sqrt(st.m2 / (st.n - 1)) : (prior ? prior.s : 1)
  const sd = Math.max(own, prior ? 0.3 * prior.s : 1e-6)
  return sd > 0 ? (value - st.m) / sd : 0
}

export function faceFeatures(face) {
  const f = {}
  if (!face?.ok) return f
  for (const t of FACE_TERMS) if (Number.isFinite(face[t.id])) f[t.id] = face[t.id]
  if (face.hr != null && face.hrQuality >= 0.25) f.hr = face.hr
  return f
}

export function scoreFace({ face, baseline = emptyFaceBaseline(), calibration = identityCalibration(), history = [] }) {
  const features = faceFeatures(face)
  const used = FACE_TERMS.filter(t => features[t.id] != null)
  if (!used.length && features.hr == null) {
    return { ok: false, reason: 'no-signal', message: 'Nothing came through to score.' }
  }
  const z = {}
  for (const t of used) z[t.id] = clamp(zOf(t.id, features[t.id], baseline), -3, 3)
  if (features.hr != null) z.hr = clamp(zOf('hr', features.hr, baseline), -3, 3)

  const x = FEATURES.map(k => (k === 'hr' && z.hr != null ? z.hr : 0))
  const fw = forward(x, history)
  const cc = calibratedContributions(fw, calibration)
  const heart = z.hr != null ? (calibratedLogit(fw, calibration) - ORDINARY_LOGIT) / SCORE_TEMPERATURE : 0

  const wTotal = FACE_TERMS.reduce((a, t) => a + Math.abs(t.w), 0)
  const faceD = used.reduce((a, t) => a + (K * t.w * z[t.id]) / wTotal / 2, 0)

  const D = heart + faceD
  const score = Math.round(100 / (1 + Math.exp(-D)))

  const contrib = []
  if (z.hr != null) contrib.push({ id: 'hr', ch: 'heart', label: 'Pulse', value: features.hr, z: z.hr, raw: cc.hr / SCORE_TEMPERATURE })
  for (const t of used) contrib.push({ ...t, ch: 'face', value: features[t.id], z: z[t.id], raw: (K * t.w * z[t.id]) / wTotal / 2 })

  // Band half-width: face, pulse and short-baseline uncertainties in quadrature, scaled by the logistic slope p(1 - p).
  const sFace = 0.35
  const sPulse = z.hr == null ? 0.45 : 0.45 * (1 - (face.hrQuality ?? 0))
  const sBaseline = 0.75 * Math.exp(-(baseline.days || 0) / 6)
  const sigmaS = Math.sqrt(sFace ** 2 + sPulse ** 2 + sBaseline ** 2)
  const p = score / 100
  const half = clamp(Math.round(sigmaS * 100 * K * p * (1 - p)), 4, 34)

  return {
    ok: true, score, S: D / K, contrib, features,
    model: { contributions: FEATURES.map(k => fw.contributions[k]), temporal: fw.temporal, logit: fw.logit },
    heartRead: z.hr != null,
    calibrationLabels: calibration.n || 0,
    low: Math.max(0, score - half), high: Math.min(100, score + half), half,
    baselineDays: baseline.days || 0,
    quality: face.hrQuality ?? 0,
  }
}

export function faceBandOf(n) {
  if (n < 35) return { key: 'low',   word: 'lower than usual' }
  if (n < 58) return { key: 'usual', word: 'in your usual range' }
  if (n < 73) return { key: 'up',    word: 'slightly higher than usual' }
  return { key: 'high', word: 'much higher than usual' }
}

/* The words for each driver in the one-line result. */
const SAY = {
  hr: 'Pulse', blinkRate: 'Blinking', browFurrow: 'Brow tension', lipPress: 'Lip pressing',
  eyeSquint: 'Eye tightening', headMotion: 'Restlessness', earVar: 'Eye movement',
}

export function faceSentence(r) {
  const b = faceBandOf(r.score)
  const top = [...r.contrib].sort((a, c) => Math.abs(c.raw) - Math.abs(a.raw))[0]
  const tail = !top || Math.abs(top.raw) < 0.3
    ? 'Nothing stands out.'
    : `${SAY[top.id] ?? top.label} is ${top.z > 0 ? 'above' : 'below'} ${r.baselineDays ? 'your usual' : 'the typical range'}.`
  return { lead: 'Right now your stress is ', word: b.word, tail, calm: b.key === 'usual' || b.key === 'low' }
}

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x))
