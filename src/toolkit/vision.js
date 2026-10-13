/* The camera, and the two things the Toolkit actually does with it.
 *
 * RULE. Nothing a reader films in the Toolkit leaves the device. Both of the
 * pipelines below take frames straight off a MediaStream, measure them in the
 * page, and never write them anywhere: no upload, no fetch of a frame, no
 * canvas.toDataURL, no MediaRecorder, no storage. The only network request
 * either of them makes is the one that fetches the detector itself, and that
 * is a public model file, the same for every reader, carrying nothing about
 * them. The interface says so at the point of use.
 *
 * 1. OBJECT RECOGNITION, for the five-things step of grounding. A single-shot
 *    detector of the YOLO family: SSDLite with a MobileNet V2 backbone,
 *    trained on COCO's 80 everyday classes, run through TensorFlow.js on the
 *    device's own GPU. It is named for what it is rather than for YOLO, which
 *    it is not.
 *
 * 2. FRAME DIFFERENCE, for the movement break. Written here rather than
 *    fetched: each frame is downscaled to 64 by 48, converted to luma, and
 *    compared with the frame before it. The mean absolute difference is how
 *    much of the picture moved. No model, no dependency, no network at all.
 *
 * WHY A SCRIPT TAG AND NOT A DEPENDENCY. TensorFlow.js is 1.4MB and this app
 * is a phone interface whose first screen is a score. Nothing is added to
 * package.json, nothing enters the main bundle, and the two scripts are
 * injected on the tap that asks for the camera, so a reader who never opens
 * grounding never pays for them. */

const TFJS    = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js'
const COCOSSD = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js'

export const DETECTOR_NAME = 'SSDLite MobileNet V2, trained on COCO'

export const cameraSupported = () =>
  typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

/* One script, once, whatever asks for it. */
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

/* Resolves to something with `.detect(video)`. The model file is about 500KB
   and is cached by the browser after the first open. */
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

/* The rear camera on a phone, the only camera on a laptop. `playsInline` and
   `muted` are set by the element, not here. */
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

/* COCO's class names are singular nouns, so an article has to be put back on
   before one can be read as a thing somebody can see. */
const NO_ARTICLE = new Set(['broccoli', 'scissors', 'skis'])
/* Only one class is withheld. Anything a reader can see counts, including the
   car outside the window, so the list is not pruned down to furniture; what is
   dropped is `person`, because offering somebody a person as one of five things
   to notice is the wrong register for this exercise. */
const DROP = new Set(['person'])

export function phraseFor(label) {
  if (DROP.has(label)) return null
  if (NO_ARTICLE.has(label)) return label
  return (/^[aeiou]/.test(label) ? 'an ' : 'a ') + label
}

/* The movement meter. `read(video)` returns 0 to 1: how much of the picture
   changed since the last call. The two 64 by 48 buffers are the only state and
   they are overwritten every frame. */
export function createMotionMeter() {
  const cv = document.createElement('canvas')
  cv.width = 64; cv.height = 48
  const g = cv.getContext('2d', { willReadFrequently: true })
  let prev = null
  /* A fixed denominator rather than a rolling peak. A rolling peak makes the
     bar relative to whatever the reader did fastest in the last minute, so slow
     movement reads as full scale the moment it is the only movement there has
     been -- which is the opposite of useful on a screen asking somebody to go
     gently. 28 is a mean absolute luma difference measured against a gentle
     shoulder roll at arm's length filling about a third of the frame: a still
     room sits under 3, a comfortable stretch lands between 5 and 15, and
     anything over 28 is faster than this activity is for. */
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
