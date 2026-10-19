import React from 'react'
import { cn } from '../../lib/utils'

/* A small looping preview of the face mesh, on the light ground. A drawn
 * face, not a person: 478 points laid out on a formula, the count Google's
 * MediaPipe Face Landmarker returns. Built like the How it works demo
 * (views/methods/MirrorDemo.jsx) but light and simpler: the outline draws,
 * the points sweep in, the features light, a blink, the pulse patch beats.
 * Runs only on screen with the tab visible; reduced motion draws one still. */

const W = 240, H = 280, LOOP = 7
const FACE = { x: 120, y: 144, rx: 76, ry: 100 }
const SWEEP = [0.5, 2.2]
const STILL_T = 4.6

const DOT = '#18a370', GLOW = '#3ecf9a', LINE = 'rgba(21,116,70,0.17)'
const FEAT = '#0f5836', IRIS = '#1d8fb0', PATCH = '#f25424'

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const ease = v => { v = clamp(v); return v * v * (3 - 2 * v) }
const span = (t, a, b) => ease((t - a) / (b - a))
const bump = (t, at, w) => Math.max(0, 1 - Math.abs(t - at) / w)

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

let MESH = null
function mesh() {
  if (MESH) return MESH
  const eyeL = [FACE.x - 29, FACE.y - 12], eyeR = [FACE.x + 29, FACE.y - 12]
  const mouth = [FACE.x, FACE.y + 52]
  const feat = {
    outline: Array.from({ length: 36 }, (_, i) => oval((i / 36) * Math.PI * 2)),
    browL: ring(eyeL[0], eyeL[1] + 5, 21, 19, 9, Math.PI * 1.15, Math.PI * 1.85),
    browR: ring(eyeR[0], eyeR[1] + 5, 21, 19, 9, Math.PI * 1.15, Math.PI * 1.85),
    eyeL: ring(...eyeL, 15, 6, 14), eyeR: ring(...eyeR, 15, 6, 14),
    irisL: ring(...eyeL, 4, 4, 5), irisR: ring(...eyeR, 4, 4, 5),
    lipsO: ring(...mouth, 24, 10, 18), lipsI: ring(...mouth, 16, 3.5, 16),
    nose: Array.from({ length: 6 }, (_, i) => [FACE.x, FACE.y - 8 + i * 5.5]),
  }
  const fixed = Object.values(feat).reduce((n, f) => n + f.length, 0)
  const need = 478 - fixed
  const busy = ([x, y]) =>
    [eyeL, eyeR].some(([ex, ey]) => ((x - ex) / 19) ** 2 + ((y - ey) / 9) ** 2 < 1)
    || ((x - mouth[0]) / 28) ** 2 + ((y - mouth[1]) / 12) ** 2 < 1
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
  for (const [k, f] of Object.entries(feat)) groups[k] = f.map(p => (pts.push({ x: p[0], y: p[1], k }), pts.length - 1))
  for (const p of fill) pts.push({ x: p[0], y: p[1], k: 'fill' })
  const top = Math.min(...pts.map(p => p.y)), low = Math.max(...pts.map(p => p.y))
  pts.forEach(p => { p.at = SWEEP[0] + (SWEEP[1] - SWEEP[0]) * (p.y - top) / (low - top) })
  const seen = new Set(), lines = []
  pts.forEach((p, i) => {
    pts.map((q, j) => [j, (q.x - p.x) ** 2 + (q.y - p.y) ** 2]).filter(([j]) => j !== i)
      .sort((a, b) => a[1] - b[1]).slice(0, 3).forEach(([j, d]) => {
        const key = i < j ? i + ':' + j : j + ':' + i
        if (d < 20 * 20 && !seen.has(key)) { seen.add(key); lines.push([i, j]) }
      })
  })
  MESH = { pts, groups, lines, eyeL, eyeR, mouth, top, low }
  return MESH
}

function draw(ctx, m, t) {
  ctx.clearRect(0, 0, W, H)
  const fade = 1 - span(t, LOOP - 0.5, LOOP - 0.1)
  ctx.globalAlpha = fade
  const sway = span(t, 2.6, 3) * Math.sin(t * 1.6) * 1.6
  const blink = Math.max(bump(t, 3.6, 0.12), bump(t, 5.3, 0.12))
  const brow = span(t, 4.2, 4.6) * (1 - span(t, 5, 5.4))
  const X = new Float32Array(m.pts.length), Y = new Float32Array(m.pts.length)
  m.pts.forEach((p, i) => {
    let y = p.y
    if (p.k === 'eyeL' || p.k === 'irisL') y = m.eyeL[1] + (y - m.eyeL[1]) * (1 - 0.88 * blink)
    if (p.k === 'eyeR' || p.k === 'irisR') y = m.eyeR[1] + (y - m.eyeR[1]) * (1 - 0.88 * blink)
    if (p.k === 'browL' || p.k === 'browR') y -= 3.5 * brow
    X[i] = p.x + sway; Y[i] = y
  })
  const on = i => t >= m.pts[i].at

  /* Outline. */
  const o = m.groups.outline, n = Math.max(1, Math.round(o.length * span(t, 0, 0.5)))
  ctx.lineWidth = 1.3; ctx.strokeStyle = FEAT; ctx.shadowColor = GLOW; ctx.shadowBlur = 6
  ctx.beginPath()
  for (let s = 0; s <= n && s <= o.length; s++) {
    const i = o[s % o.length]
    s ? ctx.lineTo(X[i], Y[i]) : ctx.moveTo(X[i], Y[i])
  }
  ctx.stroke()

  /* Mesh. */
  ctx.shadowBlur = 0; ctx.strokeStyle = LINE; ctx.lineWidth = 0.7
  ctx.beginPath()
  for (const [a, b] of m.lines) if (on(a) && on(b)) { ctx.moveTo(X[a], Y[a]); ctx.lineTo(X[b], Y[b]) }
  ctx.stroke()

  /* The sweep line while points arrive. */
  const sw = (t - SWEEP[0]) / (SWEEP[1] - SWEEP[0])
  if (sw > 0 && sw < 1) {
    const y = m.top + sw * (m.low - m.top)
    const g = ctx.createLinearGradient(FACE.x - 100, 0, FACE.x + 100, 0)
    g.addColorStop(0, 'rgba(62,207,154,0)'); g.addColorStop(0.5, 'rgba(24,163,112,0.9)'); g.addColorStop(1, 'rgba(62,207,154,0)')
    ctx.strokeStyle = g; ctx.lineWidth = 1.2
    ctx.beginPath(); ctx.moveTo(FACE.x - 100, y); ctx.lineTo(FACE.x + 100, y); ctx.stroke()
  }

  /* Points, each landing bright. */
  ctx.fillStyle = DOT; ctx.shadowColor = GLOW; ctx.shadowBlur = 4
  ctx.beginPath()
  m.pts.forEach((p, i) => {
    if (!on(i)) return
    const r = 0.85 + 1.3 * bump(t, p.at + 0.05, 0.25) + (p.k === 'fill' ? 0 : 0.25)
    ctx.moveTo(X[i] + r, Y[i]); ctx.arc(X[i], Y[i], r, 0, Math.PI * 2)
  })
  ctx.fill()

  /* Features, then the pulse patch. */
  const lit = span(t, 2.2, 2.7)
  if (lit > 0) {
    ctx.globalAlpha = fade * lit
    ctx.lineWidth = 1.2; ctx.shadowBlur = 6
    for (const k of ['browL', 'browR', 'eyeL', 'eyeR', 'irisL', 'irisR', 'lipsO', 'lipsI', 'nose']) {
      const g = m.groups[k], closed = !k.startsWith('brow') && k !== 'nose'
      ctx.strokeStyle = k.startsWith('iris') ? IRIS : FEAT
      ctx.beginPath()
      g.forEach((i, s) => s ? ctx.lineTo(X[i], Y[i]) : ctx.moveTo(X[i], Y[i]))
      if (closed) ctx.closePath()
      ctx.stroke()
    }
    const beat = 0.55 + 0.45 * Math.abs(Math.sin(t * Math.PI * 1.2))
    ctx.globalAlpha = fade * lit * beat
    ctx.strokeStyle = PATCH; ctx.shadowColor = PATCH; ctx.lineWidth = 1.4
    ctx.strokeRect(FACE.x - 20 + sway, FACE.y - 74, 40, 19)
  }
  ctx.shadowBlur = 0
  ctx.globalAlpha = 1
}

const still = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false } }

export function MeshPreview({ className }) {
  const box = React.useRef(null)
  const canvas = React.useRef(null)

  React.useEffect(() => {
    const el = canvas.current, host = box.current
    const ctx = el?.getContext('2d')
    if (!ctx) return
    const m = mesh()
    let raf = 0, t = 0, last = 0, calm = still()
    const fit = () => {
      const w = host.clientWidth || W, dpr = Math.min(2, window.devicePixelRatio || 1)
      el.width = Math.round(w * dpr); el.height = Math.round(w * H / W * dpr)
      ctx.setTransform(dpr * w / W, 0, 0, dpr * w / W, 0, 0)
      draw(ctx, m, calm ? STILL_T : t)
    }
    const tick = now => {
      raf = requestAnimationFrame(tick)
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0
      last = now
      const r = host.getBoundingClientRect()
      if (document.hidden || r.bottom < 0 || r.top > innerHeight || r.width === 0) return
      t = (t + dt) % LOOP
      draw(ctx, m, t)
    }
    const run = () => {
      cancelAnimationFrame(raf); last = 0
      if (calm) draw(ctx, m, STILL_T)
      else raf = requestAnimationFrame(tick)
    }
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null
    ro?.observe(host)
    fit(); run()
    let mq = null
    try { mq = matchMedia('(prefers-reduced-motion: reduce)') } catch {}
    const onMq = () => { calm = still(); run() }
    mq?.addEventListener?.('change', onMq)
    return () => { cancelAnimationFrame(raf); ro?.disconnect(); mq?.removeEventListener?.('change', onMq) }
  }, [])

  return (
    <div ref={box} className={cn('w-full', className)} aria-hidden>
      <canvas ref={canvas} className="block h-auto w-full" style={{ aspectRatio: `${W} / ${H}` }}/>
    </div>
  )
}
