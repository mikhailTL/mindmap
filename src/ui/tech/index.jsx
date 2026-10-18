import React from 'react'
import { cn } from '../../lib/utils'
import './tech.css'

/* The tech register's pieces (see ./tech.css). Used by How it works (AI,
 * Machine Learning, Mental Mirror), the MindMap AI chat and the Mental Mirror
 * capture screen. Nothing here is shared with the Toolkit's sky scenes. */

/* Whether `ref`'s element is on screen and the tab is visible. A coalesced
   scroll and resize listener, not an IntersectionObserver: overflow-x: clip
   on html and body stops observer entries arriving (ui/motion.jsx). */
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

/* The root every tech surface sits in: sets the tokens and runs or pauses
   the motion inside it. */
export const TechRoot = React.forwardRef(function TechRoot({ as: As = 'div', className, children, ...p }, outer) {
  const ref = React.useRef(null)
  const on = useLive(ref)
  const set = el => { ref.current = el; if (typeof outer === 'function') outer(el); else if (outer) outer.current = el }
  return <As ref={set} data-live={on ? 'on' : 'off'} className={cn('tech', className)} {...p}>{children}</As>
})

/* A dark band with the grid, the grain and two drifting blooms. `hue` tints
   the second bloom: 'mint' (default), 'vio' for MindMap AI. */
export function TechBand({ as = 'section', hue = 'mint', className, inner, children, ...p }) {
  const second = hue === 'vio' ? 'rgba(167,139,250,.22)' : 'rgba(29,143,176,.24)'
  return (
    <TechRoot as={as} className={cn('t-band border-t border-[#1b3a2c]', className)} {...p}>
      <span aria-hidden className="t-bloom t-drift t-anim -left-24 -top-24 size-[26rem]"
        style={{ background: 'radial-gradient(closest-side, rgba(62,207,154,.22), transparent)' }}/>
      <span aria-hidden className="t-bloom t-drift-2 t-anim -bottom-32 -right-20 size-[30rem]"
        style={{ background: `radial-gradient(closest-side, ${second}, transparent)` }}/>
      <div className={cn('wrap py-8 lg:py-12', inner)}>{children}</div>
    </TechRoot>
  )
}

/* Glass with a gradient edge. tone: 'mint' | 'vio' | 'coral' | 'quiet'. */
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

export function Chip({ className, children, dot = false }) {
  return (
    <span className={cn('t-chip t-mono', className)}>
      {dot && <span aria-hidden className="t-dot t-anim"/>}
      {children}
    </span>
  )
}

/* A primary action on the dark ground: mint fill, ink text (9.3 : 1). */
export const TechButton = React.forwardRef(function TechButton({ className, variant = 'solid', ...p }, ref) {
  return (
    <button ref={ref} type="button" {...p}
      className={cn('inline-flex min-h-[48px] items-center justify-center gap-2 rounded-field px-5',
        'font-display text-ui font-bold transition-[background-color,color,transform,box-shadow] duration-150',
        'ease-[var(--ease-out)] motion-safe:active:scale-[0.97] select-none touch-manipulation',
        'disabled:pointer-events-none disabled:opacity-50',
        variant === 'solid'
          ? 'bg-[#3ecf9a] text-[#07140e] shadow-[0_0_24px_-6px_rgba(62,207,154,.7)] hoverOnly:bg-[#5fe0b0]'
          : 'border border-[#2f5a47] bg-white/[0.04] text-[#eafaf2] hoverOnly:bg-white/[0.08]',
        className)}/>
  )
})
