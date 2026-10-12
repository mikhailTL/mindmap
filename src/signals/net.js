import { WEIGHTS } from './net-weights.js'

/* The Mind Score network.
 *
 * Four signals in, one number out. Each input is the wearer's reading for that
 * signal expressed as a z-score against their own fourteen-day baseline, so
 * zero is an ordinary day for that person and the same input means the same
 * thing for everybody.
 *
 * Architecture 4-16-10-1, tanh between layers and a logistic at the end:
 * 261 weights, which is small enough to run on every frame of a chart and
 * small enough to read. The weights come from tools/net/train.py and are
 * generated, not hand-written; that script states what they were fitted
 * against and measures the error.
 *
 * Why a network and not the dot product it looks like: movement does not add
 * to the score, it gates the other three. A reading taken during a run has to
 * discount heart and sweat rather than count them as stress, and that is a
 * product of two terms, which no weighted sum can express. The network learns
 * the gate along with the weights.
 */

export const SIGNALS = ['heart', 'sweat', 'temp', 'move']
export const ARCH = WEIGHTS.arch
export const Z_LIMIT = WEIGHTS.zLimit
export const PARAM_COUNT = WEIGHTS.layers
  .reduce((a, l) => a + l.w.length + l.b.length, 0)

const LAYERS = WEIGHTS.layers.map((l, i) => ({
  rows: ARCH[i], cols: ARCH[i + 1], w: l.w, b: l.b,
  last: i === WEIGHTS.layers.length - 1,
}))

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x))
const logistic = x => 1 / (1 + Math.exp(-x))

/* Returns the score and every activation on the way to it, because the figure
 * on the overview page draws the activations rather than illustrating them. */
export function run(z) {
  let a = SIGNALS.map((_, i) => clamp(Number(z[i]) || 0, -Z_LIMIT, Z_LIMIT))
  const acts = [a]
  for (const L of LAYERS) {
    const next = new Array(L.cols)
    for (let j = 0; j < L.cols; j++) {
      let sum = L.b[j]
      for (let i = 0; i < L.rows; i++) sum += a[i] * L.w[i * L.cols + j]
      next[j] = L.last ? logistic(sum) : Math.tanh(sum)
    }
    a = next
    acts.push(a)
  }
  return { score: Math.round(a[0] * 100), p: a[0], acts }
}

export const score = z => run(z).score

/* The weight on one edge, for drawing. */
export const edge = (layer, from, to) =>
  LAYERS[layer].w[from * LAYERS[layer].cols + to]

/* The largest absolute weight in a layer, so edge thickness can be relative to
 * that layer rather than to the whole net, where the first layer would
 * otherwise swamp the rest. */
export const edgeMax = layer =>
  LAYERS[layer].w.reduce((m, v) => Math.max(m, Math.abs(v)), 0)

/* What the network was fitted against. Kept here so a page can state the
 * reference model beside the network's answer and so the two can be checked
 * against each other at runtime -- see tools/net/train.py, which is the
 * authority for both. */
const REF_W = [1.3, 1.0, -0.8]
const REF_K = 2.4
const REF_GATE_AT = 1.2
const REF_GATE_SHARPNESS = 3.0

export function reference(z) {
  const c = z.map(v => clamp(Number(v) || 0, -Z_LIMIT, Z_LIMIT))
  const gate = logistic(-REF_GATE_SHARPNESS * (c[3] - REF_GATE_AT))
  const wSum = REF_W.reduce((a, w) => a + Math.abs(w), 0)
  const s = gate * (REF_W[0] * c[0] + REF_W[1] * c[1] + REF_W[2] * c[2]) / wSum / 2
  return { score: Math.round(logistic(REF_K * s) * 100), gate }
}
