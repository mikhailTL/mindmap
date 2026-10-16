/* A whole breathing session as one sound file, made in the page.
 *
 * WHY A FILE. Page JavaScript freezes the moment a phone locks, so a pacer
 * driven by requestAnimationFrame or by oscillators started from script
 * stops at the lock screen. An HTML <audio> element the student started
 * keeps playing, and in a Home Screen web app it gets the lock screen
 * controls through the Media Session API. So the session is rendered up
 * front, every cue at its second, silence between, and handed to <audio>.
 *
 * THE CUE is the same soft cue as src/toolkit/audio.js: two sine voices a
 * fifth apart through a short raised envelope, low peak gain, no click at
 * either end. One cue at each phase change, a lower pitch for "out", a brief
 * double cue for the "in again" of cyclic sighing, and one longer cue at the
 * end so a locked phone says the session is over.
 *
 * WHAT IS IN IT. 16 kHz mono 16-bit PCM, which is 1.9 MB a minute and more
 * than enough for sines under 500 Hz. Nothing is recorded; nothing leaves the
 * page; the Blob URL is revoked when the student stops.
 *
 * The cue is rendered with an OfflineAudioContext where the page has one, so
 * the sound is the same engine the live pacer uses; where it is absent (a
 * test runner, an old browser) the same two sines are summed in plain
 * arithmetic, which is the only thing an OfflineAudioContext would do here
 * anyway. */

export const RATE = 16000

export const PATTERNS = {
  box:  { id:'box',  label:'Box 4-4-4-4',    steps:[['In', 4], ['Rest', 4], ['Out', 4], ['Rest', 4]] },
  even: { id:'even', label:'Even 4-4',       steps:[['In', 4], ['Out', 4]] },
  long: { id:'long', label:'Longer out 4-6', steps:[['In', 4], ['Out', 6]] },
  sigh: { id:'sigh', label:'Sigh 2-1-6',     steps:[['In', 2], ['In again', 1], ['Out', 6]] },
}

/* Pitch per phase, the same figures the live pacers use. */
const HZ = { 'In':294, 'Out':196, 'Rest':247, 'In again':330, 'Done':196 }
const CUE_SECS = 0.42
const PEAK = 0.07
const TAIL = 1.2                      // seconds after the last phase, for the end cue

/* The schedule: one entry per phase change from zero to the session's end,
   then a 'Done' entry at the end. Pure, so the screen can derive the phase
   from audio.currentTime without touching the file. */
export function pacerSchedule(pattern = 'box', minutes = 5) {
  const p = PATTERNS[pattern] || PATTERNS.box
  const seconds = Math.max(1, Math.round(minutes * 60))
  const cues = []
  let at = 0
  while (at < seconds) {
    for (const [phase, secs] of p.steps) {
      if (at >= seconds) break
      cues.push({ at, phase, secs: Math.min(secs, seconds - at) })
      at += secs
    }
  }
  cues.push({ at: seconds, phase: 'Done', secs: 0 })
  return { pattern: p.id, seconds, cues }
}

/* The phase at second `t`, with how far into it and how many seconds remain. */
export function phaseAt(sched, t) {
  const { cues, seconds } = sched
  if (t >= seconds) return { phase:'Done', into:0, secs:0, count:0, t:1, left:0 }
  let i = 0
  while (i + 1 < cues.length && cues[i + 1].at <= t) i++
  const c = cues[i]
  const into = Math.max(0, t - c.at)
  return {
    phase: c.phase, into, secs: c.secs,
    count: Math.max(1, Math.ceil(c.secs - into)),
    t: c.secs ? Math.min(1, into / c.secs) : 0,
    left: Math.max(0, seconds - t),
  }
}

/* One cue as samples, at `rate`. The envelope is the one in audio.js: up to
   the peak by 22% of the length, then down to silence, both exponential. */
function cueMath(hz, secs, peak, rate) {
  const n = Math.round(secs * rate)
  const out = new Float32Array(n)
  const up = Math.max(1, Math.round(n * 0.22))
  const floor = 0.0001
  for (let i = 0; i < n; i++) {
    const g = i < up
      ? floor * Math.pow(peak / floor, i / up)
      : peak * Math.pow(floor / peak, (i - up) / Math.max(1, n - up))
    const t = i / rate
    out[i] = g * (Math.sin(2 * Math.PI * hz * t) + 0.45 * Math.sin(2 * Math.PI * hz * 1.5 * t))
  }
  return out
}

async function cueOffline(hz, secs, peak, rate) {
  const OC = typeof window !== 'undefined' && (window.OfflineAudioContext || window.webkitOfflineAudioContext)
  if (!OC) return null
  let ctx
  try { ctx = new OC(1, Math.round(secs * rate), rate) } catch { return null }
  const bus = ctx.createGain()
  bus.gain.setValueAtTime(0.0001, 0)
  bus.gain.exponentialRampToValueAtTime(peak, secs * 0.22)
  bus.gain.exponentialRampToValueAtTime(0.0001, secs)
  bus.connect(ctx.destination)
  for (const [mult, share] of [[1, 1], [1.5, 0.45]]) {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(hz * mult, 0)
    g.gain.setValueAtTime(share, 0)
    o.connect(g); g.connect(bus)
    o.start(0); o.stop(secs)
  }
  try {
    const buf = await ctx.startRendering()
    return buf.getChannelData(0)
  } catch { return null }
}

const renderCue = async (hz, secs, peak = PEAK, rate = RATE) =>
  (await cueOffline(hz, secs, peak, rate)) || cueMath(hz, secs, peak, rate)

/* A 44-byte header for 16-bit mono PCM. `n` is the sample count. */
export function wavHeader(view, n, rate = RATE) {
  const str = (at, s) => { for (let i = 0; i < s.length; i++) view.setUint8(at + i, s.charCodeAt(i)) }
  str(0, 'RIFF'); view.setUint32(4, 36 + n * 2, true); str(8, 'WAVE')
  str(12, 'fmt '); view.setUint32(16, 16, true)
  view.setUint16(20, 1, true); view.setUint16(22, 1, true)
  view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true)
  view.setUint16(32, 2, true); view.setUint16(34, 16, true)
  str(36, 'data'); view.setUint32(40, n * 2, true)
}

/* Write `cue` into `pcm` (Int16) at sample `at`, adding to what is there. */
function place(pcm, cue, at) {
  const end = Math.min(pcm.length, at + cue.length)
  for (let i = at, j = 0; i < end; i++, j++) {
    const v = pcm[i] + Math.round(cue[j] * 32767)
    pcm[i] = v > 32767 ? 32767 : v < -32768 ? -32768 : v
  }
}

/* The whole session as an ArrayBuffer holding a WAV. Exposed so a test can
   check the header and the cue positions without a Blob. */
export async function renderPacerBuffer({ pattern = 'box', minutes = 5, rate = RATE } = {}) {
  const sched = pacerSchedule(pattern, minutes)
  const n = Math.round((sched.seconds + TAIL) * rate)
  const buf = new ArrayBuffer(44 + n * 2)
  wavHeader(new DataView(buf), n, rate)
  const pcm = new Int16Array(buf, 44, n)
  const cues = {}
  for (const phase of Object.keys(HZ)) {
    cues[phase] = await renderCue(HZ[phase], phase === 'Done' ? 0.9 : phase === 'In again' ? 0.18 : CUE_SECS, PEAK, rate)
  }
  for (const c of sched.cues) {
    const at = Math.round(c.at * rate)
    place(pcm, cues[c.phase], at)
    if (c.phase === 'In again') place(pcm, cues[c.phase], at + Math.round(0.28 * rate))
  }
  return { buffer: buf, schedule: sched, samples: n, rate }
}

/* The session as a Blob URL for an <audio> element. The caller revokes it. */
export async function renderPacerWav(opts) {
  const { buffer } = await renderPacerBuffer(opts)
  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }))
}
