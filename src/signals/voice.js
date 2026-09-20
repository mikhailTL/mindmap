import { mean, median, percentile, sd } from './dsp.js'

/* Prosody from fifteen seconds of speech.
 *
 * What is kept is how the sentence was said: the pitch, how far it moved
 * across the clip, and how steady the pitch and the loudness were from one
 * 20 ms window to the next. What is not kept is the sentence. The audio
 * is turned into these numbers on the device and then dropped, so nothing that
 * could be replayed ever leaves the phone or reaches a server.
 *
 * Pitch is found by normalised autocorrelation rather than by an FFT: at a
 * 16 kHz working rate a 40 ms frame holds only four cycles of a 100 Hz voice,
 * which is too few bins to place the fundamental, while autocorrelation reads
 * the period directly and is not fooled by a missing fundamental.
 */
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

  /* The noise floor is taken from the quietest twentieth of the clip rather
     than a fixed number, so a loud room and a quiet one both get a usable
     threshold. The twentieth rather than the fifth is measured: a clip that
     is 85% speech has no silence in its lowest fifth, and a gate set from
     there sat above most of the speech and found none of it. */
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

  /* Jitter and shimmer only make sense inside an unbroken voiced run — across
     a pause, the "next cycle" is a different word. */
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
    /* Frame-to-frame, at the 20 ms hop — deliberately not called jitter and
       shimmer, which are cycle-to-cycle measures a phone microphone in a
       noisy room has no business claiming. These are the instability of the
       pitch and of the loudness over 20 ms windows. Against a synthetic voice
       they rose monotonically with a planted perturbation (1.2, 1.4, 2.5 and
       8.8% for 0.2, 0.6, 1.2 and 2.0% planted), on a floor set by the hop.
       Monotone is all the scorer needs: it only reads them as z-scores. */
    f0Instab: jit.length ? mean(jit) / mean(jitBase) : null,
    ampInstab: shim.length ? mean(shim) / mean(shimBase) : null,
    /* Pause ratio and speaking rate are deliberately absent. Both are
       plausible stress features and both failed to move monotonically with a
       planted pause schedule in testing, so neither is returned and neither
       reaches the score. */
    voicedS: voiced.length * HOP_S,
    durS,
    quality: Math.min(1, voiced.length / 120) * Math.min(1, mean(voiced.map(f => f.r)) / 0.6),
  }
}

/* Normalised autocorrelation over the lag range a human voice can occupy,
   with the winning lag interpolated across its neighbours so the pitch is not
   quantised to whole samples — at 16 kHz a 200 Hz voice is 80 samples long, so
   one sample of lag error is 1.25% of the period, which would swamp a jitter
   figure that lives at well under 1%. */
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

/* Plain decimation with a short moving average in front of it. The microphone
   runs at 44.1 or 48 kHz and nothing here needs anything above 8 kHz. */
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
