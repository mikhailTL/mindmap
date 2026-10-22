// Voice prosody from a short clip: median pitch, pitch spread, and frame-to-frame pitch and loudness instability.
// Audio is reduced to these numbers on the device and discarded.
import { mean, median, percentile, sd } from './dsp.js'

export const WORK_FS = 16000
const FRAME_S = 0.04
const HOP_S = 0.02
const F0_MIN = 70
const F0_MAX = 350
const VOICED_R = 0.32          /* autocorrelation peak needed to call a frame voiced */

export function analyseVoice(pcm, fs) {
  if (!pcm || pcm.length < fs * 3) return fail('too-short', 'That clip was too short to read.')

  const x = fs === WORK_FS ? pcm : downsample(pcm, fs, WORK_FS)
  const n = Math.round(FRAME_S * WORK_FS)
  const hop = Math.round(HOP_S * WORK_FS)
  const frames = []
  for (let i = 0; i + n <= x.length; i += hop) {
    const seg = x.subarray ? x.subarray(i, i + n) : x.slice(i, i + n)
    frames.push({ rms: rms(seg), seg })
  }
  if (frames.length < 40) return fail('too-short', 'That clip was too short to read.')

  // Noise floor from the 5th percentile of frame RMS, so the gate adapts to the room.
  const floor = percentile(frames.map(f => f.rms), 0.05)
  const loud = percentile(frames.map(f => f.rms), 0.95)
  if (loud < 0.004) return fail('too-quiet', 'Nothing was picked up. Speak a little louder.')
  if (loud / (floor || 1e-6) < 2.2) return fail('too-noisy', 'Too much background noise to read that.')
  const gate = Math.max(floor * 3, loud * 0.1)

  for (const f of frames) {
    if (f.rms < gate) { f.voiced = false; continue }
    const { f0, r } = pitch(f.seg, WORK_FS)
    f.voiced = r >= VOICED_R && f0 > 0
    f.f0 = f.voiced ? f0 : null
    f.r = r
  }

  const voiced = frames.filter(f => f.voiced)
  if (voiced.length < 25) return fail('no-speech', 'No steady speech in that clip.')

  // Instability is measured only inside unbroken voiced runs; across a pause the next frame is a different word.
  const runs = []
  let cur = []
  for (const f of frames) {
    if (f.voiced) cur.push(f)
    else { if (cur.length >= 5) runs.push(cur); cur = [] }
  }
  if (cur.length >= 5) runs.push(cur)
  if (!runs.length) return fail('no-speech', 'No steady speech in that clip.')

  const jit = [], shim = []
  let jitBase = [], shimBase = []
  for (const run of runs) {
    for (let i = 1; i < run.length; i++) {
      const t0 = 1 / run[i].f0, t1 = 1 / run[i - 1].f0
      jit.push(Math.abs(t0 - t1)); jitBase.push(t0)
      shim.push(Math.abs(run[i].rms - run[i - 1].rms)); shimBase.push(run[i].rms)
    }
  }

  const f0s = voiced.map(f => f.f0)
  const f0Mean = median(f0s)
  const durS = x.length / WORK_FS

  return {
    ok: true, reason: null,
    f0Mean,
    f0Cv: sd(f0s) / (f0Mean || 1),
    // Frame-to-frame instability at the 20 ms hop, not cycle-level jitter and shimmer.
    f0Instab: jit.length ? mean(jit) / mean(jitBase) : null,
    ampInstab: shim.length ? mean(shim) / mean(shimBase) : null,
    voicedS: voiced.length * HOP_S,
    durS,
    quality: Math.min(1, voiced.length / 120) * Math.min(1, mean(voiced.map(f => f.r)) / 0.6),
  }
}

// Normalised autocorrelation pitch with the best lag interpolated; one sample of lag at 16 kHz is 1.25% of a 200 Hz period.
function pitch(seg, fs) {
  const loLag = Math.floor(fs / F0_MAX), hiLag = Math.min(Math.ceil(fs / F0_MIN), seg.length - 2)
  let e0 = 0
  for (let i = 0; i < seg.length; i++) e0 += seg[i] * seg[i]
  if (e0 <= 0) return { f0: 0, r: 0 }
  let bestLag = -1, best = 0
  const cor = new Float64Array(hiLag + 2)
  for (let lag = loLag; lag <= hiLag; lag++) {
    let acc = 0, e1 = 0
    for (let i = 0; i + lag < seg.length; i++) { acc += seg[i] * seg[i + lag]; e1 += seg[i + lag] * seg[i + lag] }
    const r = acc / Math.sqrt(e0 * e1 + 1e-12)
    cor[lag] = r
    if (r > best) { best = r; bestLag = lag }
  }
  if (bestLag < 0) return { f0: 0, r: 0 }
  const a = cor[bestLag - 1] || 0, b = cor[bestLag], c = cor[bestLag + 1] || 0
  const den = a - 2 * b + c
  const d = den === 0 ? 0 : Math.max(-0.5, Math.min(0.5, (0.5 * (a - c)) / den))
  return { f0: fs / (bestLag + d), r: best }
}

function rms(seg) {
  let acc = 0
  for (let i = 0; i < seg.length; i++) acc += seg[i] * seg[i]
  return Math.sqrt(acc / seg.length)
}

function downsample(x, from, to) {
  const ratio = from / to
  const out = new Float32Array(Math.floor(x.length / ratio))
  const w = Math.max(1, Math.floor(ratio))
  for (let i = 0; i < out.length; i++) {
    const c = Math.floor(i * ratio)
    let acc = 0, n = 0
    for (let k = c; k < Math.min(x.length, c + w); k++) { acc += x[k]; n++ }
    out[i] = n ? acc / n : 0
  }
  return out
}

const fail = (reason, message) => ({ ok: false, reason, message, quality: 0 })
