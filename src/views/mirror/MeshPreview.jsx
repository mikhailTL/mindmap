import React from 'react'
import { cn } from '../../lib/utils'
import { INK, N, faceMesh, patchRect, project, strokePairs } from './mesh'

// Face mesh preview shown before the camera opens. Runs only on screen with the tab visible; reduced motion
// draws one still frame.
const W = 240, H = 280
const S = 12.4, CX = 120, CY = 140 - 0.57 * S
const IN = [0.2, 1.6]   /* the mesh comes in, seconds */
const LIT = 1.8         /* the features, after it */

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const ease = v => { v = clamp(v); return v * v * (3 - 2 * v) }
const bump = (t, at, w) => Math.max(0, 1 - Math.abs(t - at) / w)

const XY = new Float32Array(N * 2)

// `u` is canvas units per CSS pixel, so lines keep their width at any size.
function draw(ctx, m, t, still, u = 1) {
  ctx.clearRect(0, 0, W, H)
  const live = still ? 0 : ease((t - LIT) / 1.2)
  const cyc = t % 6.5
  project(m, XY, {
    cx: CX, cy: CY, s: S,
    yaw: live * 0.16 * Math.sin(t * 0.55), pitch: live * 0.06 * Math.sin(t * 0.41 + 1),
    blink: still ? 0 : bump(cyc, 4.2, 0.13),
  })
  /* Each point arrives as the reveal passes its height. */
  const reach = still ? Infinity : m.top + (m.low - m.top) * clamp((t - IN[0]) / (IN[1] - IN[0])) * 1.02
  const on = still || t > IN[1] + 0.1 ? null : i => m.p[i * 3 + 1] >= reach

  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.strokeStyle = INK.edge; ctx.lineWidth = 0.6 * u
  strokePairs(ctx, XY, m.edges, on)

  ctx.fillStyle = INK.dot
  const r = 0.6 * u
  ctx.beginPath()
  for (let i = 0; i < N; i++) {
    if (on && !on(i)) continue
    ctx.moveTo(XY[i * 2] + r, XY[i * 2 + 1]); ctx.arc(XY[i * 2], XY[i * 2 + 1], r, 0, Math.PI * 2)
  }
  ctx.fill()

  const lit = still ? 1 : ease((t - LIT) / 0.5)
  if (lit > 0) {
    ctx.globalAlpha = lit
    ctx.strokeStyle = INK.feature; ctx.lineWidth = 1.1 * u
    for (const k of ['oval', 'browL', 'browR', 'eyeL', 'eyeR', 'irisL', 'irisR', 'lips']) strokePairs(ctx, XY, m.contours[k])
    const p = patchRect(XY)
    ctx.strokeStyle = INK.patch; ctx.lineWidth = 1 * u
    ctx.strokeRect(p.x, p.y, p.w, p.h)
    ctx.globalAlpha = 1
  }
}

const still = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false } }

export function MeshPreview({ className }) {
  const box = React.useRef(null)
  const canvas = React.useRef(null)

  React.useEffect(() => {
    const el = canvas.current, host = box.current
    const ctx = el?.getContext('2d')
    if (!ctx) return
    const m = faceMesh()
    let raf = 0, t = 0, last = 0, u = 1, calm = still()
    const fit = () => {
      const w = host.clientWidth || W, dpr = Math.min(2, window.devicePixelRatio || 1)
      el.width = Math.round(w * dpr); el.height = Math.round(w * H / W * dpr)
      ctx.setTransform(dpr * w / W, 0, 0, dpr * w / W, 0, 0)
      u = W / w
      draw(ctx, m, t, calm, u)
    }
    const tick = now => {
      raf = requestAnimationFrame(tick)
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0
      last = now
      const r = host.getBoundingClientRect()
      if (document.hidden || r.bottom < 0 || r.top > innerHeight || r.width === 0) return
      t += dt
      draw(ctx, m, t, false, u)
    }
    const run = () => {
      cancelAnimationFrame(raf); last = 0
      if (calm) draw(ctx, m, t, true, u)
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
