// TensorFlow.js and the COCO-SSD model load from a CDN on the camera tap, outside the main bundle.
// Frames are measured in the page and are not stored or uploaded.
const TFJS    = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js'
const COCOSSD = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js'

export const DETECTOR_NAME = 'SSDLite MobileNet V2, trained on COCO'

export const cameraSupported = () =>
  typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

const loaded = new Map()
function script(src) {
  if (loaded.has(src)) return loaded.get(src)
  const p = new Promise((res, rej) => {
    const el = document.createElement('script')
    el.src = src
    el.async = true
    el.crossOrigin = 'anonymous'
    el.onload = () => res(true)
    el.onerror = () => { loaded.delete(src); rej(new Error('offline')) }
    document.head.appendChild(el)
  })
  loaded.set(src, p)
  return p
}

let detector = null
let detectorAt = null

export function loadDetector() {
  if (detector) return detector
  detector = (async () => {
    await script(TFJS)
    await script(COCOSSD)
    if (!window.cocoSsd) throw new Error('offline')
    try { await window.tf?.setBackend('webgl') } catch { /* the CPU backend still answers */ }
    detectorAt = await window.cocoSsd.load({ base: 'lite_mobilenet_v2' })
    return detectorAt
  })()
  detector = detector.catch(e => { detector = null; throw e })
  return detector
}

export const detectorReady = () => !!detectorAt

export async function openCamera({ facing = 'environment' } = {}) {
  if (!cameraSupported()) throw new Error('unsupported')
  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: { ideal: facing }, width: { ideal: 640 }, height: { ideal: 480 } },
  })
}

export function stopStream(stream) {
  if (!stream) return
  for (const t of stream.getTracks()) t.stop()
}

// COCO class names are bare nouns; these read correctly without an article. `person` is not offered as a thing to notice.
const NO_ARTICLE = new Set(['broccoli', 'scissors', 'skis'])
const DROP = new Set(['person'])

export function phraseFor(label) {
  if (DROP.has(label)) return null
  if (NO_ARTICLE.has(label)) return label
  return (/^[aeiou]/.test(label) ? 'an ' : 'a ') + label
}

// Frame difference: each frame is downscaled to 64x48 luma and compared with the previous one, giving 0..1.
export function createMotionMeter() {
  const cv = document.createElement('canvas')
  cv.width = 64; cv.height = 48
  const g = cv.getContext('2d', { willReadFrequently: true })
  let prev = null
  // Fixed full scale in mean absolute luma difference: a still room reads under 3, a gentle stretch 5 to 15.
  const FULL = 28
  const read = video => {
    if (!video || video.readyState < 2) return 0
    g.drawImage(video, 0, 0, cv.width, cv.height)
    const px = g.getImageData(0, 0, cv.width, cv.height).data
    const n = cv.width * cv.height
    const now = new Uint8ClampedArray(n)
    for (let i = 0, p = 0; i < n; i++, p += 4) {
      now[i] = (px[p] * 77 + px[p + 1] * 150 + px[p + 2] * 29) >> 8
    }
    if (!prev) { prev = now; return 0 }
    let sum = 0
    for (let i = 0; i < n; i++) sum += Math.abs(now[i] - prev[i])
    prev = now
    const mad = sum / n
    return Math.max(0, Math.min(1, mad / FULL))
  }
  const reset = () => { prev = null }
  return { read, reset }
}
