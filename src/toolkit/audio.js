/* Web Audio, for real, in two small pieces.
 *
 * Nothing in here is a recording and nothing in here is a file. The cue is
 * synthesised in the page from two oscillators, and the level meter reads the
 * microphone through an AnalyserNode and throws every sample away as soon as
 * it has been measured: no MediaRecorder, no buffer kept, no upload, no key
 * and no network. That is why the Toolkit is allowed to claim it.
 *
 * An AudioContext may only be created inside a gesture on iOS and in Chrome's
 * autoplay policy, so both of these are constructed on a tap and never on
 * mount. */

const Ctx = () => window.AudioContext || window.webkitAudioContext

export const audioSupported = () => typeof window !== 'undefined' && !!Ctx()

/* A soft two-note cue, used to mark the turn of a breath or the move to the
 * next part of the body. A sine at a low pitch through a short raised-cosine
 * envelope: no click at either end, nothing percussive, nothing that reads as
 * an alert. Two voices a fifth apart because one sine alone sounds like a
 * test tone. */
export function createPacer() {
  let ctx = null
  const start = async () => {
    const C = Ctx()
    if (!C) return null
    if (!ctx) ctx = new C()
    if (ctx.state === 'suspended') { try { await ctx.resume() } catch { /* a blocked resume is not an error worth showing */ } }
    return ctx
  }
  /* `hz` is the fundamental and `secs` the whole envelope. Peak gain is low on
     purpose: this is a nudge for somebody who may be wearing headphones in a
     dark room at eleven at night. */
  const cue = async (hz = 220, secs = 0.5, peak = 0.07) => {
    const c = await start()
    if (!c) return
    const t = c.currentTime
    const bus = c.createGain()
    bus.gain.setValueAtTime(0.0001, t)
    bus.gain.exponentialRampToValueAtTime(peak, t + secs * 0.22)
    bus.gain.exponentialRampToValueAtTime(0.0001, t + secs)
    bus.connect(c.destination)
    for (const [mult, share] of [[1, 1], [1.5, 0.45]]) {
      const o = c.createOscillator()
      const g = c.createGain()
      o.type = 'sine'
      o.frequency.setValueAtTime(hz * mult, t)
      g.gain.setValueAtTime(share, t)
      o.connect(g); g.connect(bus)
      o.start(t); o.stop(t + secs + 0.05)
    }
  }
  const close = () => { try { ctx?.close() } catch { /* already closed */ } ctx = null }
  return { start, cue, close }
}

/* The microphone as a level meter and nothing else.
 *
 * getFloatTimeDomainData hands back the last 2048 samples, the RMS of that
 * block is the loudness, and the block is overwritten on the next frame. A
 * slow exhale through the mouth is audible to this; a held one is not, which
 * is the point, because it makes the pacing something the page can confirm
 * rather than something it assumes.
 *
 * `read()` returns 0 to 1 after a fixed gain, so the caller never sees a
 * decibel figure it would have to explain. */
export async function createMicMeter() {
  const C = Ctx()
  if (!C || !navigator.mediaDevices?.getUserMedia) throw new Error('unsupported')
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
  })
  const ctx = new C()
  if (ctx.state === 'suspended') { try { await ctx.resume() } catch { /* ignored */ } }
  const src = ctx.createMediaStreamSource(stream)
  const an = ctx.createAnalyser()
  an.fftSize = 2048
  an.smoothingTimeConstant = 0.7
  src.connect(an)
  const buf = new Float32Array(an.fftSize)
  let peak = 0.04                                  // a floor, so a quiet room does not read as full scale
  const read = () => {
    an.getFloatTimeDomainData(buf)
    let sum = 0
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
    const rms = Math.sqrt(sum / buf.length)
    peak = Math.max(peak * 0.995, rms)             // a slow ceiling, so the meter scales to the room
    return Math.max(0, Math.min(1, rms / (peak || 1)))
  }
  const stop = () => {
    try { src.disconnect() } catch { /* ignored */ }
    for (const t of stream.getTracks()) t.stop()
    try { ctx.close() } catch { /* ignored */ }
  }
  return { read, stop }
}
