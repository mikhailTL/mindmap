import React from 'react'
import { useReduced } from '../../../toolkit/useReduced'
import { cn } from '../../../lib/utils'

/* Shared pieces for the demo panels in the "What makes MindMap different"
 * band. Each demo is a working picture: inputs, what happens to them, and
 * what comes out, drawn from the app's own components and demo data.
 *
 * Motion: a demo steps through its states on a gentle loop while it is on
 * screen. Under reduced motion it never loops and holds on its last, fullest
 * state, so nothing is lost by sitting still. */

/* Width of a box, in CSS pixels, so a chart can draw at true size and its
   text stays the size it was set at on a 390 phone and on a laptop. */
export function useWidth(initial = 320) {
  const ref = React.useRef(null)
  const [w, setW] = React.useState(initial)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => { const v = Math.round(el.getBoundingClientRect().width); if (v > 0) setW(v) }
    read()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

function useInView(ref) {
  const [on, setOn] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') { setOn(true); return }
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  return on
}

/* The step a demo is on. `holds` is how long each step stays, in ms. Starts
   at 0 when the demo first comes into view; reduced motion pins the last. */
export function useSteps(ref, holds) {
  const reduced = useReduced()
  const seen = useInView(ref)
  const last = holds.length - 1
  const [i, setI] = React.useState(0)
  React.useEffect(() => {
    if (reduced || !seen) return
    const t = setTimeout(() => setI(v => (v + 1) % holds.length), holds[i])
    return () => clearTimeout(t)
  }, [reduced, seen, i, holds])
  return { step: reduced ? last : i, reduced, last }
}

/* Keyframes used across the demos. motion-reduce takes every one away. */
export const DEMO_CSS = `
@keyframes mm-dd-scroll { from { transform: translateX(0) } to { transform: translateX(var(--d)) } }
@keyframes mm-dd-blink { 0%, 100% { opacity: .25 } 50% { opacity: 1 } }
@keyframes mm-dd-flow { from { stroke-dashoffset: 24 } to { stroke-dashoffset: 0 } }
@keyframes mm-dd-flick { 0%, 100% { transform: scaleY(1) rotate(0) } 30% { transform: scaleY(.9) rotate(-5deg) } 65% { transform: scaleY(1.05) rotate(4deg) } }
@keyframes mm-dd-drawk { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
@keyframes mm-dd-wobble { 0%, 100% { transform: translate(0, 0) } 25% { transform: translate(6px, -4px) } 50% { transform: translate(-3px, 5px) } 75% { transform: translate(-6px, -2px) } }
.mm-dd-scroll { animation: mm-dd-scroll 3.2s linear infinite }
.mm-dd-blink { animation: mm-dd-blink 1.1s ease-in-out infinite }
.mm-dd-flow { stroke-dasharray: 4 8; animation: mm-dd-flow .9s linear infinite }
.mm-dd-flick { transform-origin: 50% 100%; animation: mm-dd-flick 1.6s ease-in-out infinite }
.mm-dd-wobble { animation: mm-dd-wobble 3.4s ease-in-out infinite }
.mm-dd-drawk { stroke-dasharray: 1; animation: mm-dd-drawk 2.2s cubic-bezier(0.2,0.7,0.3,1) both }
.mm-dd-fade { transition: opacity .45s cubic-bezier(0.23,1,0.32,1), transform .45s cubic-bezier(0.23,1,0.32,1) }
.mm-dd-draw { transition: stroke-dashoffset 2.2s cubic-bezier(0.2,0.7,0.3,1) }
@media (prefers-reduced-motion: reduce) {
  .mm-dd-scroll, .mm-dd-blink, .mm-dd-flow, .mm-dd-flick, .mm-dd-wobble, .mm-dd-drawk { animation: none }
  .mm-dd-fade, .mm-dd-draw { transition: none }
}
`

/* The frame every demo sits in. It is one picture to a screen reader: the
   label says in words what the moving parts show. */
export function Demo({ label, children, className, innerRef }) {
  return (
    <div ref={innerRef} role="img" aria-label={label}
      className={cn('relative w-full min-w-0 select-none text-left', className)}>
      {children}
    </div>
  )
}

/* "Demo" in the corner: every figure in these panels is generated. */
export function DemoTag({ className }) {
  return (
    <p aria-hidden className={cn('m-0 text-fine font-semibold text-ink-2', className)}>Demo data</p>
  )
}

/* One stage: a small heading with its number, then its body. */
export function Stage({ n, title, children, className, dim = false }) {
  return (
    <div className={cn('flex min-w-0 flex-col', className)} data-waiting={dim || undefined}>
      <p aria-hidden className="m-0 flex items-baseline gap-2 font-display text-ui font-bold text-ink">
        <span className="tabular-nums text-ink-2">{n}</span>{title}
      </p>
      <div className="mt-2 min-w-0 flex-1">{children}</div>
    </div>
  )
}

/* The arrow between two stages: across when wide, down when narrow. */
export function Flow({ wide, on = true, className }) {
  return (
    <div aria-hidden className={cn('flex shrink-0 items-center justify-center text-ink-3',
      wide ? 'w-8 self-center' : 'h-8', className)}>
      <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" className={cn('mm-dd-fade', on ? 'opacity-100' : 'opacity-30',
          !wide && 'rotate-90')}>
        <path d="M3.5 12h16M13.5 6l6 6-6 6"/>
      </svg>
    </div>
  )
}

/* A card ground inside a demo. */
export function Card({ children, className }) {
  return (
    <div className={cn('rounded-[12px] border border-rule bg-card p-3', className)}>{children}</div>
  )
}

/* A repeating waveform that scrolls, for a live signal. `kind` picks the
   shape; the path is drawn twice end to end so the loop has no seam. */
const WAVES = {
  pulse: 'M0 14h8l3-9 4 17 3-8h22',
  sweat: 'M0 18c6 0 8-10 12-10s6 10 10 10h18',
  temp:  'M0 12c10 0 10 3 20 3s10-3 20-3',
  move:  'M0 14h6l2-3 2 5 2-2h8l2-4 2 7 2-3h14',
  calm:  'M0 14c5 0 5-4 10-4s5 4 10 4 5-4 10-4 5 4 10 4',
}
export function Trace({ kind = 'pulse', color = 'currentColor', w = 80, h = 26, fast = false, className }) {
  const d = WAVES[kind] || WAVES.pulse
  const reps = Math.max(2, Math.ceil(w / 40) + 1)
  return (
    <svg viewBox={`0 0 ${w} 28`} width={w} height={h} preserveAspectRatio="none" aria-hidden
      className={cn('block shrink-0 overflow-hidden', className)}>
      <g className="mm-dd-scroll" style={{ ['--d']: `-${reps * 40}px`, animationDuration: fast ? '1.6s' : undefined }}>
        <g fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          vectorEffect="non-scaling-stroke">
          {Array.from({ length: reps * 2 }, (_, i) =>
            <path key={i} d={d} transform={`translate(${i * 40} 0)`} vectorEffect="non-scaling-stroke"/>)}
        </g>
      </g>
    </svg>
  )
}

/* Minute of the day to a clock, "9:24 am". */
export const clock = m => {
  const h = Math.floor(m / 60), mm = Math.round(m % 60)
  const ap = h >= 12 ? 'pm' : 'am'
  return `${h % 12 || 12}:${String(mm).padStart(2, '0')} ${ap}`
}

/* A plain phone outline at true size, for demos that need a screen with
   readable text in it. The IPhone mockup scales its contents down, which
   would put the words under 12px at this size. */
export function PhoneFrame({ time = '9:14', children, className, height = 280 }) {
  return (
    <div className={cn('relative mx-auto w-full max-w-[220px] overflow-hidden rounded-[28px] border-[6px] border-ink bg-card', className)}
      style={{ height }}>
      <div aria-hidden className="flex items-center justify-between px-4 pb-1 pt-2 text-[12px] font-semibold text-ink">
        <span>{time}</span><span className="h-3.5 w-14 rounded-chip bg-ink"/><span>5G</span>
      </div>
      {children}
    </div>
  )
}
