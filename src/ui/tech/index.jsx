import React from 'react'
import { cn } from '../../lib/utils'
import './tech.css'

// True while the element is on screen and the tab is visible. Uses scroll/resize listeners because
// overflow-x: clip on html and body stops IntersectionObserver entries arriving.
export function useLive(ref) {
  const [on, setOn] = React.useState(false)
  React.useEffect(() => {
    let frame = 0
    const check = () => {
      frame = 0
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      setOn(!document.hidden && r.bottom > 0 && r.top < innerHeight && r.width > 0)
    }
    const queue = () => { if (!frame) frame = requestAnimationFrame(check) }
    check()
    addEventListener('scroll', queue, { passive: true })
    addEventListener('resize', queue, { passive: true })
    document.addEventListener('visibilitychange', queue)
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(queue) : null
    ro?.observe(document.documentElement)
    return () => {
      cancelAnimationFrame(frame)
      removeEventListener('scroll', queue)
      removeEventListener('resize', queue)
      document.removeEventListener('visibilitychange', queue)
      ro?.disconnect()
    }
  }, [ref])
  return on
}

export const TechRoot = React.forwardRef(function TechRoot({ as: As = 'div', className, children, ...p }, outer) {
  const ref = React.useRef(null)
  const on = useLive(ref)
  const set = el => { ref.current = el; if (typeof outer === 'function') outer(el); else if (outer) outer.current = el }
  return <As ref={set} data-live={on ? 'on' : 'off'} className={cn('tech', className)} {...p}>{children}</As>
})

// An isometric floor: a diamond of 30 degree lines for a drawing to stand on.
export function IsoPlate({ className, n = 6, hue = '#157446' }) {
  const W = 240, H = W * Math.tan(Math.PI / 6), cx = W / 2, cy = H / 2
  const at = (i, j) => [cx + (i - j) * (W / 2 / n), (i + j) * (H / 2 / n)]
  const lines = []
  for (let k = 0; k <= n; k++) {
    lines.push([at(k, 0), at(k, n)], [at(0, k), at(n, k)])
  }
  return (
    <svg viewBox={`-6 -6 ${W + 12} ${H + 12}`} aria-hidden focusable="false" fill="none"
      className={cn('pointer-events-none block', className)}>
      <path d={`M${at(0, 0)}L${at(n, 0)}L${at(n, n)}L${at(0, n)}Z`} fill={hue} fillOpacity=".05"
        stroke={hue} strokeOpacity=".45" strokeWidth="1.2"/>
      {lines.map(([a, b], i) => (
        <path key={i} d={`M${a}L${b}`} stroke={hue} strokeOpacity=".14" strokeWidth="1"/>
      ))}
    </svg>
  )
}

export const TONE_HUE = {
  mint: '#157446', sky: '#0967ab', teal: '#11677f', lilac: '#6f09b2', sun: '#825d07', coral: '#b23009',
  leaf: '#067049', ocean: '#1f5fae',
}
export function TechBand({ as = 'section', tone = 'mint', className, inner, children, ...p }) {
  return (
    <TechRoot as={as} className={cn('t-band border-t border-rule', tone !== 'mint' && `t-band--${tone}`, className)} {...p}>
      <span aria-hidden className="t-field-shape -right-48 -top-48 size-[24rem] lg:-right-40 lg:-top-56 lg:size-[34rem]"/>
      <div className={cn('wrap py-8 lg:py-12', inner)}>{children}</div>
    </TechRoot>
  )
}

export function Glass({ as: As = 'div', tone = 'mint', sheen = false, className, children, ...p }) {
  return (
    <As className={cn('t-glass', tone !== 'mint' && `t-glass--${tone}`, sheen && 't-sheen t-anim', className)} {...p}>
      {children}
    </As>
  )
}

/* A heading lit by a slow sheen. */
export function TechTitle({ as: As = 'h2', className, children }) {
  return (
    <As className={cn('t-title t-anim font-display font-bold tracking-tight', className)}>{children}</As>
  )
}

/* A primary action: the accent, white text (5.8 : 1). No glow. */
export const TechButton = React.forwardRef(function TechButton({ className, variant = 'solid', ...p }, ref) {
  return (
    <button ref={ref} type="button" {...p}
      className={cn('inline-flex min-h-[48px] items-center justify-center gap-2 rounded-field px-5',
        'font-display text-ui font-bold transition-[background-color,color,transform,box-shadow] duration-150',
        'ease-[var(--ease-out)] motion-safe:active:scale-[0.97] select-none touch-manipulation',
        'disabled:pointer-events-none disabled:opacity-50',
        variant === 'solid'
          ? 'bg-accent text-white hoverOnly:bg-accent-ink'
          : 'border border-ruling bg-card text-ink hoverOnly:bg-mist',
        className)}/>
  )
})
