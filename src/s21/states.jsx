import React from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '../lib/utils'

/* LOADING STATE — pixel-grid loader for long-running work.
 *
 * Retokenised for paper: the grid is ink that darkens rather than a light that
 * comes on, and the shimmer runs ink-3 → ink → ink-3 instead of muted → white. */

const chevron = Array.from({ length: 9 }, (_, i) => {
  const r = Math.floor(i / 3),
    c = i % 3
  return (c + Math.abs(r - 1)) * 90
})

const ORBIT_ORDER = [0, 1, 2, 5, 8, 7, 6, 3]
const orbit = Array.from({ length: 9 }, (_, i) => {
  const k = ORBIT_ORDER.indexOf(i)
  return k === -1 ? null : k * 110
})

const PATTERNS = {
  Drive: { delays: chevron, dur: 650, round: false },
  Dots: { delays: chevron, dur: 650, round: true },
  Orbit: { delays: orbit, dur: 950, round: false },
}

/* Off is 0.10 and on is 0.72 — on paper a dark cell at full strength is a hole
 * punched in the page, so the "lit" end of the ramp stops short of solid. */
const KEYFRAMES = `
@keyframes s21-pixel-on { 0%,100% { opacity:0.10 } 45% { opacity:0.72 } }
@keyframes s21-shimmer-text { from { background-position:200% 0 } to { background-position:-200% 0 } }
`

function useElapsed() {
  const [ms, setMs] = React.useState(0)
  React.useEffect(() => {
    /* Wall-clock delta, not a tick count: a throttled background tab drops
     * intervals, and a counter that under-reports the wait is worse than none. */
    const t0 = performance.now()
    const t = setInterval(() => setMs(performance.now() - t0), 100)
    return () => clearInterval(t)
  }, [])
  const total = ms / 1000
  if (total < 60) return `${total.toFixed(1)}s`
  return `${Math.floor(total / 60)}m ${(total % 60).toFixed(1)}s`
}

export function LoadingState({ label = 'Churning', variant = 'Drive', className }) {
  const elapsed = useElapsed()
  const reduced = useReducedMotion()
  const { delays, dur, round } = PATTERNS[variant] || PATTERNS.Drive

  return (
    <div className={cn('flex w-fit items-center gap-3', className)}>
      <style>{KEYFRAMES}</style>

      <span aria-hidden className="grid grid-cols-[repeat(3,5px)] gap-[2px]">
        {delays.map((d, i) => (
          <span
            key={i}
            className={cn('size-[5px] bg-ink', round ? 'rounded-full' : 'rounded-[1px]')}
            style={{
              opacity: d === null ? 0.06 : 0.14,
              /* Reduced motion keeps the grid, drops the pulse. Squashing the
               * duration instead would leave it strobing. */
              animation:
                d === null || reduced ? 'none' : `s21-pixel-on ${dur}ms ease-in-out ${d}ms infinite`,
            }}
          />
        ))}
      </span>

      <span
        className="bg-clip-text font-display text-label font-medium tracking-normal text-transparent"
        style={{
          /* ink-3 → ink → ink-3. Literal token hexes because a gradient stop
           * cannot take a Tailwind class. */
          backgroundImage: 'linear-gradient(90deg, #576e6b 35%, #0d2b27 50%, #576e6b 65%)',
          backgroundSize: '200% 100%',
          animation: reduced ? 'none' : 's21-shimmer-text 1.4s linear infinite',
        }}
      >
        {label}
      </span>

      <span className="font-mono text-label text-ink-3 tabular-nums">{elapsed}</span>
    </div>
  )
}

export default LoadingState
