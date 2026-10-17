import { FACE_SECONDS } from './face.js'

/* Browser plumbing for the Mental Mirror: the front camera, MediaPipe's Face
 * Landmarker, and the per-frame record face.js scores. The numbers come out
 * of face.js, which stays DOM-free.
 *
 * Nothing leaves the device. Each frame is reduced to 52 blendshape scores,
 * one eye-aperture figure, one nose position and one green level as it
 * arrives, and the frame is dropped. No image is written, kept or sent. Any
 * change that buffers or persists frames breaks that promise and the copy on
 * screen.
 *
 * The model and its runtime are served from this origin (public/models,
 * public/mediapipe) so a reading works on school wifi that blocks CDNs. */

const WASM_PATH = '/mediapipe/wasm'
const MODEL_PATH = '/models/face_landmarker.task'

/* Landmark indices, MediaPipe's canonical face mesh. */
const L_EYE = [33, 160, 158, 133, 153, 144]     /* outer, upper×2, inner, lower×2 */
const R_EYE = [362, 385, 387, 263, 373, 380]
const NOSE = 1
const FACE_L = 234, FACE_R = 454

let vision = null
let landmarkerPromise = null

export async function loadVision() {
  if (!vision) vision = await import('@mediapipe/tasks-vision')
  return vision
}

export function faceAvailable() {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof WebAssembly !== 'undefined'
}

/* One landmarker per page. ~4 MB model + ~13 MB runtime, fetched once. */
export function loadLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const v = await loadVision()
      const fileset = await v.FilesetResolver.forVisionTasks(WASM_PATH)
      return v.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: false,
      })
    })().catch(e => { landmarkerPromise = null; throw e })
  }
  return landmarkerPromise
}

/* Front camera, no torch. 640×480 is enough for the mesh and for a usable
   forehead patch; higher only costs frames. */
export async function openFrontCamera() {
  if (!faceAvailable()) throw new Error('This browser will not open a camera from here.')
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'user' }, width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
    audio: false,
  })
  return { stream, track: stream.getVideoTracks()[0] }
}

const ear = (lm, idx) => {
  const p = idx.map(i => lm[i])
  const v1 = Math.hypot(p[1].x - p[5].x, p[1].y - p[5].y)
  const v2 = Math.hypot(p[2].x - p[4].x, p[2].y - p[4].y)
  const h = Math.hypot(p[0].x - p[3].x, p[0].y - p[3].y) || 1
  return (v1 + v2) / (2 * h)
}

/* Runs the landmarker on every frame for `seconds`. `onFrame` gets the raw
   result (for the mesh overlay) and the record. Resolves to the records. */
export function captureFace(video, landmarker, { seconds = FACE_SECONDS, onFrame } = {}) {
  const W = 64, H = 48
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const frames = []
  let stop = false, raf = 0, lastTs = -1
  const t0 = performance.now()

  const done = new Promise(resolve => {
    const step = now => {
      if (stop) return resolve(frames)
      const elapsed = (now - t0) / 1000
      try {
        const ts = Math.max(lastTs + 1, Math.round(now))
        lastTs = ts
        const res = landmarker.detectForVideo(video, ts)
        const lm = res.faceLandmarks?.[0]
        if (lm) {
          const bs = {}
          for (const c of res.faceBlendshapes?.[0]?.categories ?? []) bs[c.categoryName] = c.score
          /* Forehead patch: between the brow line and the hairline, centred on
             the nose. Normalised coordinates → the 64×48 downscale. */
          const brow = lm[9], top = lm[10]
          const cx = ((brow.x + top.x) / 2) * W
          const cy = Math.max(0, Math.min(top.y * H, brow.y * H))
          const ph = Math.max(2, Math.abs(brow.y - top.y) * H * 0.8)
          const pw = Math.max(4, Math.abs(lm[FACE_R].x - lm[FACE_L].x) * W * 0.35)
          ctx.drawImage(video, 0, 0, W, H)
          const d = ctx.getImageData(
            Math.max(0, Math.round(cx - pw / 2)), Math.max(0, Math.round(cy)),
            Math.max(1, Math.round(pw)), Math.max(1, Math.round(ph)),
          ).data
          let g = 0
          for (let i = 1; i < d.length; i += 4) g += d[i]
          const rec = {
            t: now - t0, ok: true, bs,
            ear: (ear(lm, L_EYE) + ear(lm, R_EYE)) / 2,
            nose: [lm[NOSE].x, lm[NOSE].y],
            faceW: Math.abs(lm[FACE_R].x - lm[FACE_L].x) || 1,
            green: g / (d.length / 4),
          }
          frames.push(rec)
          onFrame?.(res, rec, elapsed / seconds)
        } else {
          frames.push({ t: now - t0, ok: false })
          onFrame?.(res, null, elapsed / seconds)
        }
      } catch { /* a frame not ready yet is not a sample */ }
      if (elapsed >= seconds) return resolve(frames)
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
  })

  return { done, frames, cancel() { stop = true; cancelAnimationFrame(raf) } }
}

/* The mesh, drawn from the landmarker's own connection tables. */
export function drawMesh(ctx, result, v, { width, height, mirror = true, color = 'rgba(10,110,104,0.55)', strong = '#0a6e68' } = {}) {
  ctx.clearRect(0, 0, width, height)
  const lm = result?.faceLandmarks?.[0]
  if (!lm) return
  ctx.save()
  if (mirror) { ctx.translate(width, 0); ctx.scale(-1, 1) }
  const du = new v.DrawingUtils(ctx)
  du.drawConnectors(lm, v.FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color, lineWidth: 0.5 })
  du.drawConnectors(lm, v.FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: strong, lineWidth: 1.2 })
  du.drawConnectors(lm, v.FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: strong, lineWidth: 1.2 })
  du.drawConnectors(lm, v.FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, { color: strong, lineWidth: 1.2 })
  du.drawConnectors(lm, v.FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, { color: strong, lineWidth: 1.2 })
  du.drawConnectors(lm, v.FaceLandmarker.FACE_LANDMARKS_LIPS, { color: strong, lineWidth: 1.2 })
  du.drawConnectors(lm, v.FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: strong, lineWidth: 1 })
  ctx.restore()
}

