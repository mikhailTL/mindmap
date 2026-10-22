// Mind Score network, a Temporal Neural Additive Model: logit = bias + one learned curve per signal + a GRU term
// over recent windows. Inputs are personal z-scores; weights are trained on WESAD (tnam-weights.js).
import { TNAM_WEIGHTS as W } from './tnam-weights.js'

export const FEATURES = W.features
export const CONTEXT_WINDOWS = W.T
export const PARAM_COUNT = countParams()
export const THRESHOLD_LOGIT = Math.log(W.threshold / (1 - W.threshold))
export const CALIBRATION_PRIOR = 0.5

const sigmoid = x => 1 / (1 + Math.exp(-x))

function linear(l, x) {
  const out = new Array(l.w.length)
  for (let i = 0; i < l.w.length; i++) {
    let s = l.b[i]
    const row = l.w[i]
    for (let j = 0; j < row.length; j++) s += row[j] * x[j]
    out[i] = s
  }
  return out
}
const relu = v => { for (let i = 0; i < v.length; i++) if (v[i] < 0) v[i] = 0; return v }

// Per-signal MLP, one scalar in and one out. `k` is the index in FEATURES, not the feature name.
export function shape(k, z) {
  const [l1, l2, l3] = W.shapes[k]
  return linear(l3, relu(linear(l2, relu(linear(l1, [z])))))[0]
}

// Single-layer GRU matching PyTorch, gate order [r, z, n]; returns the final hidden state.
function gru(seq) {
  const H = W.gru.b_hh.length / 3
  let h = new Array(H).fill(0)
  const { w_ih, w_hh, b_ih, b_hh } = W.gru
  for (const x of seq) {
    const gi = new Array(3 * H), gh = new Array(3 * H)
    for (let i = 0; i < 3 * H; i++) {
      let a = b_ih[i]; const ri = w_ih[i]
      for (let j = 0; j < ri.length; j++) a += ri[j] * x[j]
      gi[i] = a
      let b = b_hh[i]; const rh = w_hh[i]
      for (let j = 0; j < H; j++) b += rh[j] * h[j]
      gh[i] = b
    }
    const next = new Array(H)
    for (let i = 0; i < H; i++) {
      const r = sigmoid(gi[i] + gh[i])
      const z = sigmoid(gi[H + i] + gh[H + i])
      const n = Math.tanh(gi[2 * H + i] + r * gh[2 * H + i])
      next[i] = (1 - z) * n + z * h[i]
    }
    h = next
  }
  return h
}

// Missing signals are 0 (at the personal usual); history is padded with zero vectors to CONTEXT_WINDOWS.
export function forward(x, history = []) {
  const contributions = {}
  let sum = W.bias
  FEATURES.forEach((k, i) => { const c = shape(i, x[i]); contributions[k] = c; sum += c })
  const seq = [...history.slice(-(CONTEXT_WINDOWS - 1)), x]
  const zero = new Array(x.length).fill(0)
  while (seq.length < CONTEXT_WINDOWS) seq.unshift(zero)
  const temporal = linear(W.head, gru(seq))[0]
  const logit = sum + temporal
  return { logit, probability: sigmoid(logit), contributions, temporal }
}

// Logit with every signal at usual; the display centres it at 50 and spreads the rest by SCORE_TEMPERATURE.
export const ORDINARY_LOGIT = forward(new Array(FEATURES.length).fill(0)).logit
export const SCORE_TEMPERATURE = 2.5
export const displayScore = logit => Math.round(100 * sigmoid((logit - ORDINARY_LOGIT) / SCORE_TEMPERATURE))

export function identityCalibration() {
  return { gains: FEATURES.map(() => 1), temporalGain: 1, offset: 0, n: 0 }
}

// Per-person calibration (one gain per curve, a temporal gain, an offset), fitted by gradient descent with
// class weighting and an L2 pull toward identity that weakens as labels accumulate.
export function fitCalibration(examples, { iterations = 600, lr = 0.15, prior = CALIBRATION_PRIOR } = {}) {
  const F = FEATURES.length
  const cal = identityCalibration()
  const n = examples.length
  if (!n) return cal
  const pos = Math.min(1 - 1e-3, Math.max(1e-3, examples.reduce((a, e) => a + e.label, 0) / n))
  const posWeight = (1 - pos) / pos
  const lam = prior / n
  for (let it = 0; it < iterations; it++) {
    const gG = new Array(F).fill(0); let gT = 0, gB = 0
    for (const e of examples) {
      let logit = W.bias + cal.offset + cal.temporalGain * e.temporal
      for (let k = 0; k < F; k++) logit += cal.gains[k] * e.contributions[k]
      const p = sigmoid(logit - THRESHOLD_LOGIT)
      const d = ((e.label ? posWeight : 1) * (p - e.label)) / n
      for (let k = 0; k < F; k++) gG[k] += d * e.contributions[k]
      gT += d * e.temporal; gB += d
    }
    for (let k = 0; k < F; k++) cal.gains[k] -= lr * (gG[k] + 2 * lam * (cal.gains[k] - 1))
    cal.temporalGain -= lr * (gT + 2 * lam * (cal.temporalGain - 1))
    cal.offset -= lr * (gB + 2 * lam * cal.offset)
  }
  cal.n = n
  return cal
}

export function calibratedLogit(fw, cal = identityCalibration()) {
  let logit = W.bias + cal.offset + cal.temporalGain * fw.temporal
  FEATURES.forEach((k, i) => { logit += cal.gains[i] * fw.contributions[k] })
  return logit
}

export function calibratedContributions(fw, cal = identityCalibration()) {
  const out = {}
  FEATURES.forEach((k, i) => { out[k] = cal.gains[i] * fw.contributions[k] })
  out.temporal = cal.temporalGain * fw.temporal
  return out
}

export function makeAsker({ minGap = 4, bands = [35, 58, 73] } = {}) {
  let lastBand = null, since = Infinity
  return score => {
    const band = bands.filter(b => score >= b).length
    since++
    const fire = lastBand !== null && band !== lastBand && since >= minGap
    lastBand = band
    if (fire) since = 0
    return fire
  }
}

function countParams() {
  let n = 0
  for (const s of W.shapes) for (const l of s) n += l.w.length * l.w[0].length + l.b.length
  n += W.gru.w_ih.length * W.gru.w_ih[0].length + W.gru.w_hh.length * W.gru.w_hh[0].length + W.gru.b_ih.length + W.gru.b_hh.length
  n += W.head.w.length * W.head.w[0].length + W.head.b.length + 1
  return n
}
