import React from 'react'
import { cn } from '../../lib/utils'
import { INK, N, faceMesh, patchRect, project, strokePairs } from '../mirror/mesh'

/* The Mental Mirror demo on How it works. Not a person: MediaPipe's
 * canonical face (views/mirror/mesh.js), the 478 points and tessellation
 * Face Landmarker returns (signals/face-capture.js). The tags are the ones
 * the live overlay draws: Brow, Eyes, Lips, Pulse.
 *
 * One 9.6 s loop on a canvas: outline, points sweep in, a 30 s reading run
 * fast with live tags, then four bands and one Mind Score. Under
 * prefers-reduced-motion it draws the finished frame once and stops.
 *
 * 19 October (later), the owner: "they cant be the black dark thing". The
 * panel is light, the readouts in deep green mono on a white plate.
 * 20 October, the owner: "not like an LED gala mask". The mesh is drawn like
 * MediaPipe's demos: hairline tessellation, small solid points, the features
 * in one green. No glow, no blur, no contour ground, no beating patch.
 * Text on the canvas, measured in the build against the darkest pixel of
 * the ground under it (19 October):
 *   #0d2b1e values on the plate        14.4 : 1
 *   #0f5836 labels on the plate         8.1 : 1
 *   #426a58 "--" on the plate           5.8 : 1
 *   #0d2b1e score on the panel         11.0 : 1
 *   #0f5836 bottom labels on the panel  5.3 : 1
 * 20 October, the owner: "mirror looks too crazy". Calmer, same mesh: drawn
 * smaller, time runs at 0.6 speed, the head turn is half as wide, the four
 * sparks into the bands are gone, and the band colours are the site's
 * quieter inks. Labels are the body face, not mono ("AI font, remove"). */

/* Real seconds per drawing second: the 9.6 s loop plays over 16 s. */
const PACE = 0.6

const W = 360, H = 440, LOOP = 9.6
const S = 11.4, CX = 116, CY = 162 - 0.57 * S
const STILL_T = 8.4
const SWEEP = [0.7, 3.0]

const LABEL = '#0f5836', VALUE = '#0d2b1e', MUTED = '#426a58', PULSE = '#c0604f'
const RULE = 'rgba(21,116,70,0.16)'
const BANDS = [
  { name: 'Pulse', color: '#cf7a68', to: 62 },
  { name: 'Brow', color: '#c9a24e', to: 58 },
  { name: 'Eyes', color: '#5fae90', to: 46 },
  { name: 'Mouth and head', color: '#6fa3d6', to: 54 },
]
const SCORE_TO = 57

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const ease = v => { v = clamp(v); return v * v * (3 - 2 * v) }
const span = (t, a, b) => ease((t - a) / (b - a))
const bump = (t, at, w) => Math.max(0, 1 - Math.abs(t - at) / w)

const XY = new Float32Array(N * 2)

/* Where every point is at time t: a slow head turn, two blinks, one brow
   lift and a small press of the lips while the reading runs. */
function pose(m, t) {
  const live = span(t, 3, 3.4) * (1 - span(t, 6.8, 7.2))
  const blink = Math.max(bump(t, 4.3, 0.12), bump(t, 6.1, 0.12))
  const brow = span(t, 4.9, 5.3) * (1 - span(t, 5.7, 6.1))
  const press = span(t, 5.4, 5.8) * (1 - span(t, 6.3, 6.7))
  project(m, XY, { cx: CX, cy: CY, s: S, yaw: live * 0.07 * Math.sin(t * 1.7), pitch: live * 0.05 * Math.sin(t * 1.1 + 1),
    blink, brow, press })
  return { blink, brow, press }
}

function countOn(m, on) {
  let n = 0
  for (let i = 0; i < N; i++) if (on(i)) n++
  return n
}

function draw(ctx, m, t, font) {
  ctx.clearRect(0, 0, W, H)
  const fade = 1 - span(t, 9.1, 9.55)
  ctx.globalAlpha = fade
  const { blink, brow, press } = pose(m, t)
  /* The sweep: top of the face first, each point as the line reaches it. */
  const sweep = (t - SWEEP[0]) / (SWEEP[1] - SWEEP[0])
  const reach = m.top + (m.low - m.top) * clamp(sweep) * 1.02
  const on = sweep >= 1.05 ? null : i => m.p[i * 3 + 1] >= reach
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'

  /* The face oval first, as a line drawn round the face. */
  const oval = m.contours.oval
  ctx.lineWidth = 1.1; ctx.strokeStyle = INK.feature
  strokePairs(ctx, XY, oval, null, 2 * Math.max(1, Math.round(oval.length / 2 * span(t, 0, 0.7))))

  /* The tessellation and the points. */
  ctx.strokeStyle = INK.edge; ctx.lineWidth = 0.6
  strokePairs(ctx, XY, m.edges, on)
  ctx.fillStyle = INK.dot
  ctx.beginPath()
  for (let i = 0; i < N; i++) {
    if (on && !on(i)) continue
    ctx.moveTo(XY[i * 2] + 0.65, XY[i * 2 + 1]); ctx.arc(XY[i * 2], XY[i * 2 + 1], 0.65, 0, Math.PI * 2)
  }
  ctx.fill()

  /* A thin line where the points are arriving. */
  if (sweep > 0 && sweep < 1) {
    const y = CY - reach * S
    ctx.strokeStyle = 'rgba(21,116,70,0.35)'; ctx.lineWidth = 0.75
    ctx.beginPath(); ctx.moveTo(CX - 98, y); ctx.lineTo(CX + 98, y); ctx.stroke()
  }

  /* The features once the mesh is in, then the forehead patch. */
  const lit = span(t, 2.6, 3.2)
  if (lit > 0) {
    ctx.globalAlpha = fade * lit
    ctx.strokeStyle = INK.feature; ctx.lineWidth = 1.1
    for (const k of ['browL', 'browR', 'eyeL', 'eyeR', 'irisL', 'irisR', 'lips']) strokePairs(ctx, XY, m.contours[k])
    const p = patchRect(XY)
    ctx.strokeStyle = INK.patch; ctx.lineWidth = 1
    ctx.strokeRect(p.x, p.y, p.w, p.h)
    ctx.globalAlpha = fade
  }

  /* Readouts, right column, on a white plate so their contrast is exact. */
  ctx.save()
  ctx.globalAlpha = fade; ctx.fillStyle = '#ffffff'; ctx.strokeStyle = RULE; ctx.lineWidth = 1
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(226, 18, 128, 258, 8) : ctx.rect(226, 18, 128, 258); ctx.fill()
  ctx.stroke()
  ctx.restore()
  const reading = span(t, 3, 7)
  const tags = [
    ['Points', String(on ? countOn(m, on) : N), 0.7],
    ['Brow', `${Math.round(18 + 6 * Math.sin(t * 2.3) + 26 * brow)}%`, 3],
    ['Eyes', blink > 0.4 ? 'Blink' : `${Math.round(61 + 4 * Math.sin(t * 1.9))}%`, 3],
    ['Lips', `${Math.round(12 + 3 * Math.sin(t * 2.9) + 30 * press)}%`, 3],
    ['Pulse', t < 4.6 ? '--' : `${Math.round(76 + 2.4 * Math.sin(t * 1.3))} bpm`, 3],
  ]
  /* Full strength always: a tag not yet live shows "--" in the muted ink. */
  tags.forEach(([k, v, from], r) => {
    const y = 40 + r * 50, a = span(t, from, from + 0.4)
    ctx.fillStyle = LABEL; ctx.font = `600 11.5px ${font}`; ctx.textAlign = 'left'
    ctx.fillText(k, 236, y)
    ctx.fillStyle = a > 0 ? VALUE : MUTED; ctx.font = `700 19px ${font}`
    ctx.fillText(a > 0 ? v : '--', 236, y + 22)
    if (r < tags.length - 1) {
      ctx.strokeStyle = RULE; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(236, y + 32); ctx.lineTo(344, y + 32); ctx.stroke()
    }
  })
  /* A small pulse trace under its tag once it is in. */
  if (t >= 4.6) {
    ctx.globalAlpha = fade * span(t, 4.6, 5)
    ctx.strokeStyle = PULSE; ctx.lineWidth = 1.2
    ctx.beginPath()
    for (let x = 0; x <= 52; x++) {
      const ph = (x / 13 + t * 1.27) % 1
      const yv = ph < 0.12 ? -Math.sin(ph / 0.12 * Math.PI) * 7 : Math.sin((ph - 0.12) * 4) * 1.2
      x ? ctx.lineTo(294 + x, 236 + yv) : ctx.moveTo(294, 236 + yv)
    }
    ctx.stroke()
  }
  ctx.globalAlpha = fade

  /* The 30 s reading, run fast. */
  const by = 304
  ctx.fillStyle = LABEL; ctx.font = `600 11.5px ${font}`; ctx.textAlign = 'left'
  ctx.fillText('30 second reading', 24, by - 8)
  ctx.textAlign = 'right'
  ctx.fillText(`${Math.round(30 * reading)} s`, 346, by - 8)
  ctx.fillStyle = '#e3efe9'; ctx.fillRect(24, by, 322, 3)
  ctx.fillStyle = '#157446'; ctx.fillRect(24, by, 322 * reading, 3)

  /* Four bands and the score. */
  const cx = W / 2, cy = 420, dial = span(t, 7.0, 8.2)
  BANDS.forEach((b, i) => {
    const r = 82 - i * 11
    ctx.lineWidth = 7; ctx.lineCap = 'butt'
    ctx.strokeStyle = 'rgba(21,116,70,0.09)'
    ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, Math.PI * 2); ctx.stroke()
    if (dial > 0) {
      ctx.strokeStyle = b.color
      ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, Math.PI + Math.PI * (b.to / 100) * dial); ctx.stroke()
    }
  })
  ctx.textAlign = 'center'
  ctx.globalAlpha = fade * span(t, 7.2, 7.6)
  ctx.fillStyle = VALUE; ctx.font = `700 30px ${font}`
  ctx.fillText(String(Math.round(SCORE_TO * span(t, 7.2, 8.2))), cx, cy - 6)
  ctx.fillStyle = LABEL; ctx.font = `600 11.5px ${font}`
  ctx.fillText('Mind Score', cx, cy + 15)
  ctx.globalAlpha = 1
}

const reducedMotion = () => {
  try { return matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

export function MirrorDemo({ className }) {
  const box = React.useRef(null)
  const canvas = React.useRef(null)

  React.useEffect(() => {
    const el = canvas.current, host = box.current
    const ctx = el?.getContext('2d')
    if (!ctx) return
    const m = faceMesh()
    const font = getComputedStyle(host).fontFamily || 'system-ui, sans-serif'
    let raf = 0, t = 0, last = 0, still = reducedMotion()

    const fit = () => {
      const w = host.clientWidth, dpr = Math.min(2, window.devicePixelRatio || 1)
      el.width = Math.round(w * dpr); el.height = Math.round(w * H / W * dpr)
      ctx.setTransform(dpr * w / W, 0, 0, dpr * w / W, 0, 0)
      draw(ctx, m, still ? STILL_T : t, font)
    }
    /* Time only moves while the panel is on screen and the tab is visible. */
    const tick = now => {
      raf = requestAnimationFrame(tick)
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0
      last = now
      const r = host.getBoundingClientRect()
      if (document.hidden || r.bottom < 0 || r.top > innerHeight) return
      t = (t + dt * PACE) % LOOP
      draw(ctx, m, t, font)
    }
    const run = () => {
      cancelAnimationFrame(raf); last = 0
      if (still) draw(ctx, m, STILL_T, font)
      else raf = requestAnimationFrame(tick)
    }
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null
    ro?.observe(host)
    fit(); run()
    let mq = null
    try { mq = matchMedia('(prefers-reduced-motion: reduce)') } catch {}
    const onMq = () => { still = reducedMotion(); run() }
    mq?.addEventListener?.('change', onMq)
    return () => { cancelAnimationFrame(raf); ro?.disconnect(); mq?.removeEventListener?.('change', onMq) }
  }, [])

  return (
    <figure className={cn('m-0 mx-auto w-full max-w-[20rem]', className)}>
      {/* A plain light panel, flat paper. 19 October, the owner: "i like the
          mental mirror thing a lot"; 20 October, its glow and ground went and
          it sits smaller, inside the photo pair (Methods.jsx). */}
      <div className="relative w-full overflow-hidden rounded-[10px] bg-[#f6f8f7]">
        <div ref={box} className="relative w-full">
          <canvas ref={canvas} aria-hidden="true" className="block h-auto w-full" style={{ aspectRatio: `${W} / ${H}` }}/>
        </div>
      </div>
      <figcaption className="sr-only">
        A sped-up drawing of one reading.
        <span> A drawn face fills with 478 tracked points. Live values for brow, eyes,
          lips and pulse change as the reading runs, then four bands fill and one Mind Score appears.</span>
      </figcaption>
    </figure>
  )
}

export default MirrorDemo
