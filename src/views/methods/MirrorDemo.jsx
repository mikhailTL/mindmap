import React from 'react'
import { cn } from '../../lib/utils'
import { Topo } from '../../ui/tech'
import '../../ui/tech/tech.css'

/* The Mental Mirror demo on How it works. A drawn face, not a person: the
 * outline is a formula and the 478 points are laid out from it, matching the
 * count MediaPipe Face Landmarker returns (signals/face-capture.js). The tags
 * are the ones the live overlay draws: Brow, Eyes, Lips, Pulse.
 *
 * One 9.6 s loop on a canvas: outline, points sweep in, a 30 s reading run
 * fast with live tags, then four bands and one Mind Score. Under
 * prefers-reduced-motion it draws the finished frame once and stops.
 *
 * 19 October (later), the owner: "they cant be the black dark thing". The
 * panel is light (ui/tech .t-paper): the mesh in deep green and turquoise
 * with a soft glow, the readouts in deep green mono on a white plate.
 * Text on the canvas, measured in the build against the darkest pixel of
 * the ground under it (19 October):
 *   #0d2b1e values on the plate        14.4 : 1
 *   #0f5836 labels on the plate         8.1 : 1
 *   #426a58 "--" on the plate           5.8 : 1
 *   #0d2b1e score on the panel         11.0 : 1
 *   #0f5836 bottom labels on the panel  5.3 : 1 */

const W = 360, H = 440, LOOP = 9.6
const FACE = { x: 116, y: 162, rx: 86, ry: 112 }
const STILL_T = 8.4
const SWEEP = [0.7, 3.0]

const DOT = '#14895f', GLOW = 'rgba(62,207,154,0.75)', LINE = 'rgba(29,143,176,0.3)'
const EDGE = '#157446', FEATURE = '#1781a0', TEAL_GLOW = 'rgba(29,143,176,0.55)'
const LABEL = '#0f5836', VALUE = '#0d2b1e', MUTED = '#426a58', PULSE = '#d23c3c'
const RULE = 'rgba(21,116,70,0.16)'
const BANDS = [
  { name: 'Pulse', color: '#dc3c3c', to: 62 },
  { name: 'Brow', color: '#e07a12', to: 58 },
  { name: 'Eyes', color: '#18a370', to: 46 },
  { name: 'Mouth and head', color: '#2f6fdc', to: 54 },
]
const SCORE_TO = 57

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const ease = v => { v = clamp(v); return v * v * (3 - 2 * v) }
const span = (t, a, b) => ease((t - a) / (b - a))
const bump = (t, at, w) => Math.max(0, 1 - Math.abs(t - at) / w)

/* The outline: wide at the brow, narrow at the chin. */
function oval(a, s = 1) {
  const c = Math.cos(a), n = Math.sin(a)
  const chin = n > 0 ? 1 - 0.22 * n * n : 1
  return [FACE.x + FACE.rx * s * c * chin, FACE.y + FACE.ry * s * n * (n > 0 ? 1.06 : 0.94)]
}
const ring = (cx, cy, rx, ry, k, from = 0, to = Math.PI * 2) =>
  Array.from({ length: k }, (_, i) => {
    const a = from + (to - from) * (i / (to - from >= 6.28 ? k : k - 1))
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]
  })

/* Built once: 478 points, the feature contours that index into them, and
   each point's three nearest neighbours as mesh lines. */
function build() {
  const eyeL = [FACE.x - 33, FACE.y - 14], eyeR = [FACE.x + 33, FACE.y - 14]
  const mouth = [FACE.x, FACE.y + 58]
  const feat = {
    outline: Array.from({ length: 36 }, (_, i) => oval((i / 36) * Math.PI * 2)),
    browL: ring(eyeL[0], eyeL[1] + 6, 24, 22, 10, Math.PI * 1.15, Math.PI * 1.85),
    browR: ring(eyeR[0], eyeR[1] + 6, 24, 22, 10, Math.PI * 1.15, Math.PI * 1.85),
    eyeL: ring(...eyeL, 17, 7, 16), eyeR: ring(...eyeR, 17, 7, 16),
    irisL: ring(...eyeL, 4.5, 4.5, 5), irisR: ring(...eyeR, 4.5, 4.5, 5),
    lipsO: ring(...mouth, 28, 11, 20), lipsI: ring(...mouth, 19, 4, 20),
    nose: Array.from({ length: 6 }, (_, i) => [FACE.x, FACE.y - 8 + i * 6]),
    noseBase: ring(FACE.x, FACE.y + 20, 11, 9, 5, Math.PI * 0.15, Math.PI * 0.85),
  }
  const fixed = Object.values(feat).reduce((n, f) => n + f.length, 0)
  const need = 478 - fixed
  const busy = ([x, y]) =>
    [eyeL, eyeR].some(([ex, ey]) => ((x - ex) / 22) ** 2 + ((y - ey) / 11) ** 2 < 1)
    || ((x - mouth[0]) / 32) ** 2 + ((y - mouth[1]) / 14) ** 2 < 1
  const GOLD = Math.PI * (3 - Math.sqrt(5))
  let fill = []
  for (let n = need; fill.length < need; n += 4) {
    fill = []
    for (let i = 0; i < n; i++) {
      const p = oval(i * GOLD, 0.94 * Math.sqrt((i + 0.5) / n))
      if (!busy(p)) fill.push(p)
    }
  }
  fill = fill.slice(0, need)

  const pts = [], groups = {}
  for (const [k, f] of Object.entries(feat)) {
    groups[k] = f.map(p => (pts.push({ x: p[0], y: p[1], k }), pts.length - 1))
  }
  for (const p of fill) pts.push({ x: p[0], y: p[1], k: 'fill' })

  /* The sweep: top of the face first, each point as the line reaches it. */
  const top = Math.min(...pts.map(p => p.y)), low = Math.max(...pts.map(p => p.y))
  pts.forEach(p => { p.at = SWEEP[0] + (SWEEP[1] - SWEEP[0]) * (p.y - top) / (low - top) })

  const seen = new Set(), lines = []
  pts.forEach((p, i) => {
    pts.map((q, j) => [j, (q.x - p.x) ** 2 + (q.y - p.y) ** 2]).filter(([j]) => j !== i)
      .sort((a, b) => a[1] - b[1]).slice(0, 3).forEach(([j, d]) => {
        const key = i < j ? i + ':' + j : j + ':' + i
        if (d < 22 * 22 && !seen.has(key)) { seen.add(key); lines.push([i, j]) }
      })
  })
  return { pts, groups, lines, eyeL, eyeR, mouth, top, low }
}

/* Where every point is at time t: a slow head sway, two blinks, one brow
   lift and a small press of the lips while the reading runs. */
function pose(m, t) {
  const live = span(t, 3, 3.4) * (1 - span(t, 6.8, 7.2))
  const dx = live * 1.8 * Math.sin(t * 1.7), dy = live * 1.2 * Math.sin(t * 1.1 + 1)
  const blink = Math.max(bump(t, 4.3, 0.12), bump(t, 6.1, 0.12))
  const brow = span(t, 4.9, 5.3) * (1 - span(t, 5.7, 6.1))
  const press = span(t, 5.4, 5.8) * (1 - span(t, 6.3, 6.7))
  const at = new Float32Array(m.pts.length * 2)
  m.pts.forEach((p, i) => {
    let x = p.x, y = p.y
    if (p.k === 'eyeL' || p.k === 'irisL') y = m.eyeL[1] + (y - m.eyeL[1]) * (1 - 0.88 * blink)
    if (p.k === 'eyeR' || p.k === 'irisR') y = m.eyeR[1] + (y - m.eyeR[1]) * (1 - 0.88 * blink)
    if (p.k === 'browL' || p.k === 'browR') y -= 4 * brow
    if (p.k === 'lipsO' || p.k === 'lipsI') y = m.mouth[1] + (y - m.mouth[1]) * (1 - 0.45 * press)
    at[i * 2] = x + dx; at[i * 2 + 1] = y + dy
  })
  return { at, blink, brow, press }
}

function draw(ctx, m, t, font) {
  ctx.clearRect(0, 0, W, H)
  const fade = 1 - span(t, 9.1, 9.55)
  ctx.globalAlpha = fade
  const { at, blink, brow, press } = pose(m, t)
  const X = i => at[i * 2], Y = i => at[i * 2 + 1]
  const on = i => t >= m.pts[i].at

  /* Outline first, as a line drawn round the face. */
  const outline = m.groups.outline
  const drawn = span(t, 0, 0.7)
  ctx.lineWidth = 1.3; ctx.strokeStyle = EDGE; ctx.shadowColor = GLOW; ctx.shadowBlur = 8
  ctx.beginPath()
  const n = Math.max(1, Math.round(outline.length * drawn))
  for (let s = 0; s <= n && s <= outline.length; s++) {
    const i = outline[s % outline.length]
    s ? ctx.lineTo(X(i), Y(i)) : ctx.moveTo(X(i), Y(i))
  }
  ctx.stroke()

  /* The mesh. */
  ctx.shadowBlur = 0; ctx.strokeStyle = LINE; ctx.lineWidth = 0.7
  ctx.beginPath()
  for (const [a, b] of m.lines) if (on(a) && on(b)) { ctx.moveTo(X(a), Y(a)); ctx.lineTo(X(b), Y(b)) }
  ctx.stroke()

  /* The sweep line while the points arrive. */
  const sweep = (t - SWEEP[0]) / (SWEEP[1] - SWEEP[0])
  if (sweep > 0 && sweep < 1) {
    const y = m.top + sweep * (m.low - m.top)
    const g = ctx.createLinearGradient(FACE.x - 110, 0, FACE.x + 110, 0)
    g.addColorStop(0, 'rgba(29,143,176,0)'); g.addColorStop(0.5, 'rgba(29,143,176,0.8)'); g.addColorStop(1, 'rgba(29,143,176,0)')
    ctx.strokeStyle = g; ctx.lineWidth = 1.2
    ctx.beginPath(); ctx.moveTo(FACE.x - 110, y); ctx.lineTo(FACE.x + 110, y); ctx.stroke()
  }

  /* Points. Each lands bright and settles. */
  ctx.fillStyle = DOT; ctx.shadowColor = GLOW; ctx.shadowBlur = 5
  ctx.beginPath()
  m.pts.forEach((p, i) => {
    if (!on(i)) return
    const r = 0.9 + 1.4 * bump(t, p.at + 0.05, 0.25) + (p.k === 'fill' ? 0 : 0.3)
    ctx.moveTo(X(i) + r, Y(i)); ctx.arc(X(i), Y(i), r, 0, Math.PI * 2)
  })
  ctx.fill()

  /* Features light up once the mesh is in. */
  const lit = span(t, 2.6, 3.2)
  if (lit > 0) {
    ctx.globalAlpha = fade * lit
    ctx.strokeStyle = FEATURE; ctx.shadowColor = TEAL_GLOW; ctx.lineWidth = 1.2; ctx.shadowBlur = 8
    for (const k of ['browL', 'browR', 'eyeL', 'eyeR', 'irisL', 'irisR', 'lipsO', 'lipsI', 'nose', 'noseBase']) {
      const g = m.groups[k], closed = !k.startsWith('brow') && !k.startsWith('nose')
      ctx.beginPath()
      g.forEach((i, s) => s ? ctx.lineTo(X(i), Y(i)) : ctx.moveTo(X(i), Y(i)))
      if (closed) ctx.closePath()
      ctx.stroke()
    }
    /* The forehead patch the pulse is read from. */
    const beat = 0.55 + 0.45 * Math.abs(Math.sin(t * Math.PI * 1.25))
    ctx.globalAlpha = fade * lit * (t > 3.2 ? beat : 1)
    ctx.strokeStyle = PULSE; ctx.shadowColor = PULSE
    ctx.strokeRect(FACE.x - 22, FACE.y - 82, 44, 22)
    ctx.globalAlpha = fade
  }
  ctx.shadowBlur = 0

  /* Readouts, right column, on a white plate so their contrast is exact. */
  ctx.save()
  ctx.globalAlpha = fade; ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.strokeStyle = RULE; ctx.lineWidth = 1
  ctx.shadowColor = 'rgba(62,207,154,0.35)'; ctx.shadowBlur = 14
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(226, 18, 128, 258, 8) : ctx.rect(226, 18, 128, 258); ctx.fill()
  ctx.shadowBlur = 0; ctx.stroke()
  ctx.restore()
  const reading = span(t, 3, 7)
  const tags = [
    ['Points', String(Math.min(478, m.pts.filter((p, i) => on(i)).length)), 0.7],
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
  ctx.fillStyle = 'rgba(21,116,70,0.14)'; ctx.fillRect(24, by, 322, 3)
  const bar = ctx.createLinearGradient(24, 0, 346, 0)
  bar.addColorStop(0, '#18a370'); bar.addColorStop(1, '#1d8fb0')
  ctx.fillStyle = bar; ctx.shadowColor = GLOW; ctx.shadowBlur = 6
  ctx.fillRect(24, by, 322 * reading, 3); ctx.shadowBlur = 0

  /* Four bands and the score. */
  const cx = W / 2, cy = 420, dial = span(t, 7.0, 8.2)
  BANDS.forEach((b, i) => {
    const r = 82 - i * 11
    ctx.lineWidth = 7; ctx.lineCap = 'butt'
    ctx.strokeStyle = 'rgba(21,116,70,0.09)'
    ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, Math.PI * 2); ctx.stroke()
    if (dial > 0) {
      ctx.strokeStyle = b.color; ctx.shadowColor = b.color; ctx.shadowBlur = 5
      ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, Math.PI + Math.PI * (b.to / 100) * dial); ctx.stroke()
      ctx.shadowBlur = 0
    }
  })
  /* Each tag sends a spark down into its band as the reading ends. */
  const fly = span(t, 6.7, 7.3)
  if (fly > 0 && fly < 1) {
    BANDS.forEach((b, i) => {
      const sx = 236, sy = 40 + (i === 0 ? 4 : i) * 50 + 22, r = 82 - i * 11
      const ex = cx - r, ey = cy
      const x = sx + (ex - sx) * fly, y = sy + (ey - sy) * fly - Math.sin(fly * Math.PI) * 30
      ctx.fillStyle = b.color; ctx.shadowColor = b.color; ctx.shadowBlur = 10
      ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill()
    })
    ctx.shadowBlur = 0
  }
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
    const m = build()
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
      t = (t + dt) % LOOP
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
    <figure className={cn('m-0', className)}>
      {/* A light instrument panel (ui/tech .t-paper) in a white glass bezel,
          faint contour lines behind the face. 19 October, the owner: "i like
          the mental mirror thing a lot", so the drawing and its timing stay. */}
      <div className="t-glass w-full p-1.5">
        <div className="t-paper relative w-full overflow-hidden">
          <Topo seed={1.3} className="-left-[20%] -top-[8%] h-auto w-[140%] text-[#157446] opacity-[.13]"/>
          <div ref={box} className="t-mono relative w-full">
            <canvas ref={canvas} aria-hidden="true" className="block h-auto w-full" style={{ aspectRatio: `${W} / ${H}` }}/>
          </div>
          {['left-2.5 top-2.5 border-l border-t', 'right-2.5 top-2.5 border-r border-t',
            'bottom-2.5 left-2.5 border-b border-l', 'bottom-2.5 right-2.5 border-b border-r'].map(k => (
            <span key={k} aria-hidden className={cn('pointer-events-none absolute size-4 rounded-[2px] border-[#157446]/45', k)}/>
          ))}
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
