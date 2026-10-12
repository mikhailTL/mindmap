/* Browser plumbing for the two phone streams. The numbers come out of ppg.js
   and voice.js, which stay DOM-free so they can be tested in Node. */

export const PPG_SECONDS = 30
export const VOICE_SECONDS = 15

export function mediaAvailable() {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
}

/* Rear camera with the torch on where allowed; returns { stream, track, torch }.
   The torch is what makes this work indoors — on room light alone the pulse
   rides on a signal too small to survive sensor noise. A phone that refuses it
   still returns a stream, and the quality score catches that downstream. */
export async function openCamera() {
  if (!mediaAvailable()) throw new Error('This browser will not open a camera from here.')
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' }, width: { ideal: 320 }, height: { ideal: 240 },
             frameRate: { ideal: 30 } },
    audio: false,
  })
  const track = stream.getVideoTracks()[0]
  let torch = false
  try {
    await track.applyConstraints({ advanced: [{ torch: true }] })
    torch = track.getSettings?.().torch === true
  } catch { torch = false }
  return { stream, track, torch }
}

/* Reduces each frame to one number — mean red channel over the middle of the
   sensor — for `seconds`. Returns { done, cancel }; `done` resolves to
   [{ t: ms, v }]. Frames go into a 32x24 canvas so the downscale averages in
   the graphics path rather than looping 76,800 pixels every 33 ms, which on a
   mid-range phone is the difference between 30 fps and dropped beats. */
export function capturePPG(video, { seconds = PPG_SECONDS, onTick } = {}) {
  const W = 32, H = 24
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const samples = []
  let stop = false, raf = 0
  const t0 = performance.now()

  const done = new Promise(resolve => {
    const step = now => {
      if (stop) return resolve(samples)
      try {
        ctx.drawImage(video, 0, 0, W, H)
        const d = ctx.getImageData(W / 4, H / 4, W / 2, H / 2).data
        let r = 0
        for (let i = 0; i < d.length; i += 4) r += d[i]
        samples.push({ t: now - t0, v: (r / (d.length / 4)) })
      } catch { /* a frame that is not ready yet is simply not a sample */ }
      const elapsed = (now - t0) / 1000
      onTick?.(elapsed / seconds, samples)
      if (elapsed >= seconds) return resolve(samples)
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
  })

  return { done, cancel() { stop = true; cancelAnimationFrame(raf) } }
}

/* `seconds` of microphone, held as raw samples in memory and never written
   anywhere. Resolves to { pcm: Float32Array, fs }. ScriptProcessorNode rather
   than AudioWorklet: a worklet needs its own module file fetched at runtime,
   and that request can fail on school wifi. */
export async function captureVoice({ seconds = VOICE_SECONDS, onLevel } = {}) {
  if (!mediaAvailable()) throw new Error('This browser will not open a microphone from here.')
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  })
  const Ctx = window.AudioContext || window.webkitAudioContext
  const ac = new Ctx()
  const src = ac.createMediaStreamSource(stream)
  const node = ac.createScriptProcessor(4096, 1, 1)
  const chunks = []
  let total = 0
  const t0 = performance.now()

  const done = new Promise(resolve => {
    node.onaudioprocess = e => {
      const buf = e.inputBuffer.getChannelData(0)
      chunks.push(new Float32Array(buf))
      total += buf.length
      let peak = 0
      for (let i = 0; i < buf.length; i += 8) peak = Math.max(peak, Math.abs(buf[i]))
      const elapsed = (performance.now() - t0) / 1000
      onLevel?.(peak, elapsed / seconds)
      if (elapsed >= seconds) finish()
    }
    function finish() {
      node.onaudioprocess = null
      const out = new Float32Array(total)
      let o = 0
      for (const c of chunks) { out.set(c, o); o += c.length }
      resolve({ pcm: out, fs: ac.sampleRate })
    }
    src.connect(node)
    /* Chromium will not run a ScriptProcessor with no destination, so route it
       through a muted gain node — connecting it straight to the speakers plays
       the microphone back through the earpiece. */
    const mute = ac.createGain()
    mute.gain.value = 0
    node.connect(mute)
    mute.connect(ac.destination)
  })

  return {
    done: done.finally(() => {
      stream.getTracks().forEach(t => t.stop())
      ac.close().catch(() => {})
    }),
  }
}

export function stopStream(stream) {
  stream?.getTracks?.().forEach(t => { try { t.stop() } catch {} })
}
