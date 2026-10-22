// Browsers only start an AudioContext inside a user gesture (iOS, Chrome autoplay policy), so both helpers are created on a tap.
const Ctx = () => window.AudioContext || window.webkitAudioContext

export const audioSupported = () => typeof window !== 'undefined' && !!Ctx()

// Cue: two sine voices a fifth apart through a smooth envelope, so it has no click at either end.
export function createPacer() {
  let ctx = null
  const start = async () => {
    const C = Ctx()
    if (!C) return null
    if (!ctx) ctx = new C()
    if (ctx.state === 'suspended') { try { await ctx.resume() } catch { /* a blocked resume is not an error worth showing */ } }
    return ctx
  }
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

// Level is the RMS of the latest 2048-sample block, scaled to 0..1. Samples are overwritten each frame and not kept.
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
