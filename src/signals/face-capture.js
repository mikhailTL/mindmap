import { FACE_SECONDS } from './face.js'

// Front camera and MediaPipe Face Landmarker: one numeric record per frame for face.js, plus the tracking overlay.
// Frames are reduced to numbers on arrival and not stored. Model files are served from this origin.
const WASM_PATH = '/mediapipe/wasm'
const MODEL_PATH = '/models/face_landmarker.task'

/* Landmark indices, MediaPipe's canonical face mesh. */
const L_EYE = [33, 160, 158, 133, 153, 144]     /* outer, upper×2, inner, lower×2 */
const R_EYE = [362, 385, 387, 263, 373, 380]
const NOSE = 1
const FACE_L = 234, FACE_R = 454
const BROW_MID = [105, 334]
const EYE_OUT = [33, 263]
const MOUTH = [61, 291]

/* The colour patch is read off a 64×48 copy of the frame. */
const RW = 64, RH = 48
/* No new camera frame for this long: the camera has stopped. */
const STALL_MS = 4000

let vision = null
let landmarkerPromise = null
let preferCPU = false
// One failed detectForVideo call leaves the landmarker graph in an error state, so each call needs a decoded frame,
// a strictly increasing timestamp from this page-wide clock, and a single active capture.
let clock = 0           /* last timestamp handed to the landmarker, page-wide */
let active = null       /* the one capture allowed to feed the landmarker */

export async function loadVision() {
  if (!vision) vision = await import('@mediapipe/tasks-vision')
  return vision
}

export function faceAvailable() {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof WebAssembly !== 'undefined'
}

export function loadLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const v = await loadVision()
      const fileset = await v.FilesetResolver.forVisionTasks(WASM_PATH)
      const make = delegate => v.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_PATH, delegate },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: false,
      })
      // The GPU delegate is missing on some browsers; after a GPU failure the next landmarker is built on the CPU.
      if (preferCPU) return make('CPU')
      try { return await make('GPU') } catch { preferCPU = true; return make('CPU') }
    })().catch(e => { landmarkerPromise = null; throw e })
  }
  return landmarkerPromise
}

// A landmarker that has thrown keeps throwing, so it is closed and rebuilt on the next reading.
function dropLandmarker(lm) {
  try { lm?.close() } catch { /* already gone */ }
  landmarkerPromise = null
  preferCPU = true
}

export async function openFrontCamera() {
  if (!faceAvailable()) throw new Error('This browser will not open a camera from here.')
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'user' }, width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
    audio: false,
  })
  return { stream, track: stream.getVideoTracks()[0] }
}

export function frameReady(video) {
  return !!video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0
}

export function nextTimestamp(last, now) {
  const t = Math.floor(now)
  return Number.isFinite(t) && t > last ? t : last + 1
}

// Forehead patch in normalised frame coords: between landmarks 10 (hairline) and 9 (brow), 35% of face width.
export function foreheadPatch(lm, out = {}) {
  const brow = lm[9], top = lm[10]
  const span = Math.abs(brow.y - top.y)
  const w = Math.max(4 / RW, Math.abs(lm[FACE_R].x - lm[FACE_L].x) * 0.35)
  const h = Math.max(2 / RH, span * 0.6)
  out.x = (brow.x + top.x) / 2 - w / 2
  out.y = Math.max(0, Math.min(top.y, brow.y) + span * 0.2)
  out.w = w
  out.h = h
  return out
}

export function patchPixels(p, W, H, out = {}) {
  if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.w) || !Number.isFinite(p.h)) return null
  const x0 = Math.max(0, Math.min(W - 1, Math.round(p.x * W)))
  const y0 = Math.max(0, Math.min(H - 1, Math.round(p.y * H)))
  const x1 = Math.max(x0 + 1, Math.min(W, Math.round((p.x + p.w) * W)))
  const y1 = Math.max(y0 + 1, Math.min(H, Math.round((p.y + p.h) * H)))
  out.x = x0; out.y = y0; out.w = x1 - x0; out.h = y1 - y0
  return out
}

// Maps normalised frame coords onto a canvas the way object-fit: cover shows the video, optionally mirrored.
export function coverMap(vw, vh, cw, ch, mirror = true, out = {}) {
  const s = Math.max(cw / vw, ch / vh)
  out.sx = vw * s; out.sy = vh * s
  out.ox = (cw - out.sx) / 2; out.oy = (ch - out.sy) / 2
  out.cw = cw; out.mirror = mirror
  return out
}
export const mapX = (m, x) => (m.mirror ? m.cw - (m.ox + x * m.sx) : m.ox + x * m.sx)
export const mapY = (m, y) => m.oy + y * m.sy

// Eye aspect ratio: mean of the two vertical lid distances over the eye width.
const ear = (lm, idx) => {
  const p0 = lm[idx[0]], p1 = lm[idx[1]], p2 = lm[idx[2]], p3 = lm[idx[3]], p4 = lm[idx[4]], p5 = lm[idx[5]]
  const v1 = Math.hypot(p1.x - p5.x, p1.y - p5.y)
  const v2 = Math.hypot(p2.x - p4.x, p2.y - p4.y)
  const h = Math.hypot(p0.x - p3.x, p0.y - p3.y) || 1
  return (v1 + v2) / (2 * h)
}

export function captureFace(video, landmarker, { seconds = FACE_SECONDS, onFrame } = {}) {
  active?.cancel('stopped')

  const canvas = document.createElement('canvas')
  canvas.width = RW; canvas.height = RH
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const track = video.srcObject?.getVideoTracks?.()[0] ?? null
  const frames = []
  const patch = {}, px = {}
  let stop = false, raf = 0, lastVideoTime = -1, finish = null, warned = false
  const t0 = performance.now()
  let lastFrameAt = t0

  const end = outcome => {
    if (stop) return
    stop = true
    cancelAnimationFrame(raf)
    track?.removeEventListener('ended', onEnded)
    document.removeEventListener('visibilitychange', onHidden)
    if (active === handle) active = null
    finish(outcome)
  }
  const onEnded = () => end({ ok: false, reason: 'camera-ended' })
  // A hidden page pauses capture and would leave a gap, so the reading ends.
  const onHidden = () => { if (document.hidden) end({ ok: false, reason: 'hidden' }) }

  const done = new Promise(resolve => {
    finish = resolve
    const step = now => {
      if (stop) return
      const elapsed = Math.max(0, now - t0) / 1000
      if (track && track.readyState === 'ended') return onEnded()
      // One record per new camera frame, not per screen refresh, so a 60 Hz display does not duplicate 30 fps frames.
      if (!frameReady(video) || video.currentTime === lastVideoTime) {
        if (now - lastFrameAt > STALL_MS) return end({ ok: false, reason: 'stalled' })
        if (elapsed >= seconds) return end({ ok: true, frames })
        raf = requestAnimationFrame(step)
        return
      }
      lastVideoTime = video.currentTime
      lastFrameAt = now

      let res
      try {
        clock = nextTimestamp(clock, now)
        res = landmarker.detectForVideo(video, clock)
      } catch (e) {
        console.error('Mental Mirror: the face model stopped', e)
        dropLandmarker(landmarker)
        return end({ ok: false, reason: 'model' })
      }

      const lm = res.faceLandmarks?.[0]
      let rec = null
      if (lm) {
        const bs = {}
        for (const c of res.faceBlendshapes?.[0]?.categories ?? []) bs[c.categoryName] = c.score
        let green = null
        const r = patchPixels(foreheadPatch(lm, patch), RW, RH, px)
        if (r) {
          ctx.drawImage(video, 0, 0, RW, RH)
          const d = ctx.getImageData(r.x, r.y, r.w, r.h).data
          let g = 0
          for (let i = 1; i < d.length; i += 4) g += d[i]
          green = g / (d.length / 4)
        }
        rec = {
          t: now - t0, ok: true, bs,
          ear: (ear(lm, L_EYE) + ear(lm, R_EYE)) / 2,
          nose: [lm[NOSE].x, lm[NOSE].y],
          faceW: Math.abs(lm[FACE_R].x - lm[FACE_L].x) || 1,
          green,
        }
        frames.push(rec)
      } else {
        frames.push({ t: now - t0, ok: false })
      }
      try { onFrame?.(res, rec, Math.min(1, elapsed / seconds)) } catch (e) {
        if (!warned) { warned = true; console.error('Mental Mirror: overlay', e) }
      }
      if (elapsed >= seconds) return end({ ok: true, frames })
      raf = requestAnimationFrame(step)
    }
    track?.addEventListener('ended', onEnded)
    document.addEventListener('visibilitychange', onHidden)
    raf = requestAnimationFrame(step)
  })

  const handle = { done, frames, cancel(reason = 'stopped') { end({ ok: false, reason }) } }
  active = handle
  return handle
}

const COL = {
  mesh: 'rgba(255,255,255,0.24)',
  dot: 'rgba(255,255,255,0.78)',
  line: '#7ce3cf',
  patch: '#ff9f7a',
  lead: 'rgba(255,255,255,0.6)',
  tag: 'rgba(13,43,30,0.86)',
  text: '#ffffff',
}
const map = {}
const fpatch = {}

// MediaPipe lists each shared mesh edge twice; each is drawn once.
let tess = null
function tessellation(F) {
  if (tess) return tess
  const seen = new Set(), out = []
  for (const c of F.FACE_LANDMARKS_TESSELATION ?? []) {
    const key = c.start < c.end ? c.start * 1000 + c.end : c.end * 1000 + c.start
    if (!seen.has(key)) { seen.add(key); out.push(c) }
  }
  tess = out
  return tess
}

const avg2 = (cats, a, b) => {
  let x = 0, y = 0
  for (let i = 0; i < cats.length; i++) {
    const c = cats[i]
    if (c.categoryName === a) x = c.score
    else if (c.categoryName === b) y = c.score
  }
  return (x + y) / 2
}

function strokeSet(ctx, lm, conns, m) {
  ctx.beginPath()
  for (let i = 0; i < conns.length; i++) {
    const a = lm[conns[i].start], b = lm[conns[i].end]
    if (!a || !b) continue
    ctx.moveTo(mapX(m, a.x), mapY(m, a.y))
    ctx.lineTo(mapX(m, b.x), mapY(m, b.y))
  }
  ctx.stroke()
}

function tag(ctx, text, ax, ay, side, edge, y, k, cw, ch) {
  const pad = 5 * k, h = 18 * k
  const w = ctx.measureText(text).width + pad * 2
  let x = side < 0 ? edge - 10 * k - w : edge + 10 * k
  x = Math.max(4 * k, Math.min(cw - w - 4 * k, x))
  const top = Math.max(4 * k, Math.min(ch - h - 4 * k, y - h / 2))
  ctx.strokeStyle = COL.lead
  ctx.lineWidth = 0.75 * k
  ctx.beginPath()
  ctx.moveTo(ax, ay)
  ctx.lineTo(side < 0 ? x + w : x, top + h / 2)
  ctx.stroke()
  ctx.fillStyle = '#ffffff'
  ctx.beginPath(); ctx.arc(ax, ay, 1.5 * k, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = COL.tag
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(x, top, w, h, 4 * k); else ctx.rect(x, top, w, h)
  ctx.fill()
  ctx.fillStyle = COL.text
  ctx.fillText(text, x + pad, top + h / 2)
  return top
}

export function drawOverlay(ctx, result, v, { vw, vh, cw, ch, dpr = 1, mirror = true, pulse = null } = {}) {
  ctx.clearRect(0, 0, cw, ch)
  const lm = result?.faceLandmarks?.[0]
  if (!lm || !vw || !vh) return
  const m = coverMap(vw, vh, cw, ch, mirror, map)
  const k = dpr * Math.max(1, Math.min(1.25, cw / dpr / 380))
  const F = v.FaceLandmarker

  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.strokeStyle = COL.mesh; ctx.lineWidth = 0.7 * k
  strokeSet(ctx, lm, tessellation(F), m)
  ctx.fillStyle = COL.dot
  ctx.beginPath()
  const r = 1.2 * k
  for (let i = 0; i < lm.length; i++) {
    const p = lm[i]
    ctx.rect(mapX(m, p.x) - r / 2, mapY(m, p.y) - r / 2, r, r)
  }
  ctx.fill()

  /* The features the reading uses, in one colour. */
  ctx.strokeStyle = COL.line; ctx.lineWidth = 1.2 * k
  strokeSet(ctx, lm, F.FACE_LANDMARKS_FACE_OVAL, m)
  strokeSet(ctx, lm, F.FACE_LANDMARKS_LEFT_EYEBROW, m)
  strokeSet(ctx, lm, F.FACE_LANDMARKS_RIGHT_EYEBROW, m)
  strokeSet(ctx, lm, F.FACE_LANDMARKS_LEFT_EYE, m)
  strokeSet(ctx, lm, F.FACE_LANDMARKS_RIGHT_EYE, m)
  strokeSet(ctx, lm, F.FACE_LANDMARKS_LIPS, m)
  if (lm.length > 468) {
    strokeSet(ctx, lm, F.FACE_LANDMARKS_LEFT_IRIS, m)
    strokeSet(ctx, lm, F.FACE_LANDMARKS_RIGHT_IRIS, m)
  }

  const fp = foreheadPatch(lm, fpatch)
  const px0 = mapX(m, fp.x), px1 = mapX(m, fp.x + fp.w)
  const pl = Math.min(px0, px1), pw = Math.abs(px1 - px0)
  const pt = mapY(m, fp.y), ph = fp.h * m.sy
  ctx.strokeStyle = COL.patch; ctx.lineWidth = 1 * k
  ctx.strokeRect(pl, pt, pw, ph)

  const cats = result.faceBlendshapes?.[0]?.categories ?? []
  const xa = mapX(m, lm[FACE_L].x), xb = mapX(m, lm[FACE_R].x)
  const left = Math.min(xa, xb), right = Math.max(xa, xb)
  const pickSide = (pair, side) => {
    const a = mapX(m, lm[pair[0]].x), b = mapX(m, lm[pair[1]].x)
    return (side < 0 ? a <= b : a >= b) ? pair[0] : pair[1]
  }
  ctx.font = `600 ${Math.round(11 * k)}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`
  ctx.textBaseline = 'middle'

  const blink = avg2(cats, 'eyeBlinkLeft', 'eyeBlinkRight')
  const brow = avg2(cats, 'browDownLeft', 'browDownRight')
  const squint = avg2(cats, 'eyeSquintLeft', 'eyeSquintRight')
  const lips = avg2(cats, 'mouthPressLeft', 'mouthPressRight')

  const bi = pickSide(BROW_MID, -1)
  tag(ctx, `Brow ${Math.round(brow * 100)}%`, mapX(m, lm[bi].x), mapY(m, lm[bi].y), -1, left, mapY(m, lm[bi].y), k, cw, ch)
  const mi = pickSide(MOUTH, -1)
  tag(ctx, `Lips ${Math.round(lips * 100)}%`, mapX(m, lm[mi].x), mapY(m, lm[mi].y), -1, left, mapY(m, lm[mi].y), k, cw, ch)
  const ei = pickSide(EYE_OUT, 1)
  const eyeY = mapY(m, lm[ei].y)
  const eyeTop = tag(ctx, blink >= 0.5 ? 'Blink' : `Eyes ${Math.round(squint * 100)}%`, mapX(m, lm[ei].x), eyeY, 1, right, eyeY, k, cw, ch)
  const pulseY = Math.min(pt + ph / 2, eyeTop - 13 * k)
  tag(ctx, pulse ? `Pulse ${Math.round(pulse)}` : 'Pulse …', Math.max(px0, px1), pt + ph / 2, 1, right, pulseY, k, cw, ch)
}
