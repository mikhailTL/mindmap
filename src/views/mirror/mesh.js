import { CONTOURS, TRIS, VERTS } from './canonicalFace'

/* The face mesh the drawn previews use (MeshPreview here, MirrorDemo on How
 * it works): MediaPipe's own canonical face, 478 points in the Face
 * Landmarker's order, its real tessellation and feature contours. Drawn the
 * way MediaPipe's demos draw a result: hairline edges, small solid points,
 * the features a little stronger in one colour. No glow, no blur.
 * 20 October, the owner: the mask should "look more like an actual AI model
 * ML not like an LED gala mask". */

export const N = 478

/* Model space points, the ten iris points added at the centre of each eye. */
function points() {
  const p = new Float32Array(N * 3)
  p.set(VERTS)
  const iris = (contour, at) => {
    const ids = [...new Set(contour)]
    let x = 0, y = 0, z = 0
    for (const i of ids) { x += VERTS[i * 3]; y += VERTS[i * 3 + 1]; z += VERTS[i * 3 + 2] }
    x /= ids.length; y /= ids.length; z = z / ids.length + 0.25
    const ring = [[0, 0], [0.46, 0], [0, 0.4], [-0.46, 0], [0, -0.4]]
    ring.forEach(([dx, dy], k) => p.set([x + dx, y + dy, z], (at + k) * 3))
    return [x, y]
  }
  return { p, eyeR: iris(CONTOURS.eyeR, 468), eyeL: iris(CONTOURS.eyeL, 473) }
}

/* Each triangle edge once. */
function edges() {
  const seen = new Set(), out = []
  for (let t = 0; t < TRIS.length; t += 3) {
    for (const [a, b] of [[TRIS[t], TRIS[t + 1]], [TRIS[t + 1], TRIS[t + 2]], [TRIS[t + 2], TRIS[t]]]) {
      const key = a < b ? a * 1000 + b : b * 1000 + a
      if (!seen.has(key)) { seen.add(key); out.push(a, b) }
    }
  }
  return Uint16Array.from(out)
}

let MESH = null
export function faceMesh() {
  if (MESH) return MESH
  const { p, eyeR, eyeL } = points()
  const group = new Int8Array(N)   /* 1 eyeR, 2 eyeL, 3 brow, 4 lips */
  for (const i of CONTOURS.eyeR) group[i] = 1
  for (const i of CONTOURS.eyeL) group[i] = 2
  for (let i = 468; i < 473; i++) group[i] = 1
  for (let i = 473; i < 478; i++) group[i] = 2
  for (const i of [...CONTOURS.browL, ...CONTOURS.browR]) group[i] = 3
  for (const i of CONTOURS.lips) group[i] = 4
  let lips = 0
  for (const i of CONTOURS.lips) lips += p[i * 3 + 1]
  MESH = { p, edges: edges(), contours: CONTOURS, group, eyeR, eyeL, mouthY: lips / CONTOURS.lips.length,
    top: 8.26, low: -9.4 }
  return MESH
}

/* Model space to the canvas: a small head turn (yaw, pitch in radians), a
   blink, a brow lift and a lip press, then scale about (cx, cy). Writes into
   `out` (x, y pairs) and returns it. */
export function project(m, out, { cx, cy, s, yaw = 0, pitch = 0, blink = 0, brow = 0, press = 0 }) {
  const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch)
  const P = m.p
  for (let i = 0; i < N; i++) {
    let x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2]
    const g = m.group[i]
    if (g === 1) y = m.eyeR[1] + (y - m.eyeR[1]) * (1 - 0.88 * blink)
    else if (g === 2) y = m.eyeL[1] + (y - m.eyeL[1]) * (1 - 0.88 * blink)
    else if (g === 3) y += 0.32 * brow
    else if (g === 4) y = m.mouthY + (y - m.mouthY) * (1 - 0.45 * press)
    const x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw
    const y1 = y * cp - z1 * sp
    out[i * 2] = cx + x1 * s
    out[i * 2 + 1] = cy - y1 * s
  }
  return out
}

/* Pairs of point indices as one path. `on(i)` hides points not yet in. */
export function strokePairs(ctx, xy, pairs, on, upto = pairs.length) {
  ctx.beginPath()
  for (let k = 0; k + 1 < upto; k += 2) {
    const a = pairs[k], b = pairs[k + 1]
    if (on && !(on(a) && on(b))) continue
    ctx.moveTo(xy[a * 2], xy[a * 2 + 1]); ctx.lineTo(xy[b * 2], xy[b * 2 + 1])
  }
  ctx.stroke()
}

/* The forehead patch the pulse is read from, as face-capture.js places it:
   a fifth of the way down from the hairline (10) to the brow line (9), a
   third of the face (234 to 454) wide. */
export function patchRect(xy) {
  const tx = xy[20], ty = xy[21], bx = xy[18], by = xy[19]
  const span = Math.abs(by - ty)
  const w = Math.abs(xy[454 * 2] - xy[234 * 2]) * 0.35
  return { x: (tx + bx) / 2 - w / 2, y: Math.min(ty, by) + span * 0.2, w, h: span * 0.6 }
}

/* The calm line style shared by both light drawings. */
export const INK = {
  edge: 'rgba(16,71,58,0.26)',   /* tessellation, 0.6 px */
  dot: 'rgba(13,43,30,0.62)',    /* landmarks, 1.2 px */
  feature: '#157446',            /* eyes, brows, lips, oval, irises */
  patch: '#c2410c',              /* the forehead patch */
}
