import React from 'react'
import { cn } from '../lib/utils'

/* The two things the title sequence does not do.
 *
 * This block used to be a four-beat player: the problem, the patch, the score,
 * the week. Then Intro.jsx arrived — six full-screen beats on every load —
 * and three of those four became the intro again in miniature. Its beat 3 and
 * this one's beat 2 carried the same sentence word for word ("read off the
 * arm, not typed into an app"), and the score beat is the thing the HowItWorks
 * figure further down this same page draws properly.
 *
 * What the intro never says is why any of it exists and what a person does
 * with it. It states what MindMap is, six times over, and stops. So that is
 * all that is left here: the day that climbs while nobody notices, and the
 * Tuesday somebody asks about. It is also the only explanation on the page for
 * a visitor who pressed Skip — which suppresses the intro permanently — so it
 * cannot simply be deleted with the rest.
 *
 * Both drawings are inline SVG, and both have the property the rest of the
 * site's artwork has: the RESTING state, with no animation at all, is the
 * finished picture. Killing the animation reveals the complete diagram rather
 * than an empty frame, which is what makes reduced motion free. */

const VB = '0 0 480 190'          // one viewBox for both, so the box never resizes

/* Deterministic wiggle. Math.random() would redraw differently on every render
   and make the traces look like noise rather than like a recording. */
function wave(y, seed, amp, steps, x0, x1) {
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps
    const n = Math.sin(i * seed) * 0.62 + Math.sin(i * seed * 2.3 + 1.7) * 0.38
    d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + (y - n * amp).toFixed(1)
  }
  return d
}

const svgProps = {
  viewBox: VB,
  preserveAspectRatio: 'xMidYMid meet',
  className: 'h-full w-full',
  'aria-hidden': true,
  focusable: 'false',
}

/* ── A flat day that climbs while the clock passes ───────────────────────── */
const HOURS = ['7a', '9a', '11a', '1p', '3p', '5p', '7p', '9p']

function StageDay() {
  return (
    <svg {...svgProps}>
      <line x1="40" y1="160" x2="456" y2="160" className="stroke-ink-3" strokeWidth="1" />
      {HOURS.map((h, i) => {
        const x = 52 + i * 54
        return (
          <g key={h} className="ob-a ob-rise" style={{ '--d': '.5s', '--t': `${0.12 + i * 0.14}s` }}>
            <line x1={x} y1="160" x2={x} y2="166" className="stroke-ink-3" strokeWidth="1" />
            <text x={x} y="180" textAnchor="middle" fontSize="12.5"
              className="font-mono fill-ink-3">{h}</text>
          </g>
        )
      })}

      <path d="M52 131 C 90 133, 122 128, 160 130 S 212 127, 236 124 C 272 118, 302 100, 340 86 S 402 63, 430 50"
        fill="none" strokeWidth="2.5" strokeLinecap="round"
        className="stroke-accent ob-a ob-draw" style={{ '--len': 410, '--d': '3.4s', '--t': '.15s' }} />

      <g className="ob-a ob-rise" style={{ '--d': '.5s', '--t': '1.15s' }}>
        <circle cx="236" cy="124" r="3.5" fill="none" strokeWidth="1.5" className="stroke-ink-3" />
        <text x="244" y="113" fontSize="13" className="font-body fill-ink-2">nothing feels wrong yet</text>
      </g>
      <g className="ob-a ob-rise" style={{ '--d': '.5s', '--t': '3.1s' }}>
        <circle cx="430" cy="50" r="4.5" className="fill-accent" />
        <text x="422" y="36" textAnchor="end" fontSize="14" className="font-body fill-ink">it shows</text>
      </g>
    </svg>
  )
}

/* ── A week with one day marked, and the sentence beside it ──────────────── */
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const MARKED = 1   // Tuesday, because the headline names Tuesday

function StageWeek() {
  return (
    <svg {...svgProps}>
      {DAYS.map((d, i) => {
        const x = 20 + i * 40, on = i === MARKED
        return (
          <g key={i} className="ob-a ob-rise" style={{ '--d': '.45s', '--t': `${i * 0.1}s` }}>
            <rect x={x} y="96" width="34" height="52" rx="6" strokeWidth={on ? 2 : 1}
              className={on ? 'stroke-accent fill-accent-wash' : 'stroke-rule fill-card'} />
            {on && <rect x={x} y="96" width="34" height="4" className="fill-accent" />}
            <path d={wave(126, on ? 1.6 : 0.8 + i * 0.3, on ? 9 : 5, 5, x + 5, x + 29)}
              fill="none" strokeWidth={on ? 2 : 1.25} strokeLinecap="round"
              className={on ? 'stroke-accent' : 'stroke-ink-3'} />
            <text x={x + 17} y="166" textAnchor="middle" fontSize="13"
              className="font-mono fill-ink-3">{d}</text>
          </g>
        )
      })}

      <path d="M77 92 C 77 62, 150 74, 206 58" fill="none" strokeWidth="1.25"
        className="stroke-ink-3 ob-a ob-draw" style={{ '--len': 145, '--d': '.8s', '--t': '.9s' }} />

      <g className="ob-a ob-rise" style={{ '--d': '.6s', '--t': '1.5s' }}>
        <rect x="212" y="24" width="250" height="60" rx="8" strokeWidth="1"
          className="stroke-rule fill-card" />
        <text x="230" y="50" fontSize="14" className="font-body fill-ink">
          &ldquo;Tuesday ran hot from noon.&rdquo;
        </text>
        <text x="230" y="70" fontSize="14" className="font-body fill-ink-2">
          Asked about it that evening.
        </text>
      </g>
    </svg>
  )
}

const BEATS = [
  { head: 'A hard day shows in the body before anyone talks about it.',
    sub:  'Heart rate, sweating and skin temperature move first, hours before a student could put it into words. Nobody writes any of it down.',
    Stage: StageDay },
  { head: 'A parent sees which day ran high, and can ask about it that evening.',
    sub:  'One day named, while it is still the same week. Not after a crisis, and not in a report at the end of term.',
    Stage: StageWeek },
]

/* Keyframes live here rather than in tailwind.config.js because they are used
   by exactly one component and describe its drawings, not the design system.
   The two kill-switches at the bottom are the whole reduced-motion story:
   remove the animation and every mark renders at its finished state. */
const CSS = `
.ob-root .ob-a{animation-duration:var(--d,1s);animation-delay:var(--t,0s);animation-fill-mode:both;animation-timing-function:cubic-bezier(.2,.7,.3,1)}
.ob-root .ob-draw{stroke-dasharray:var(--len);stroke-dashoffset:0;animation-name:ob-draw}
.ob-root .ob-rise{animation-name:ob-rise}
@keyframes ob-draw{from{stroke-dashoffset:var(--len)}}
@keyframes ob-rise{from{opacity:0;transform:translateY(7px)}}
.ob-root [data-play="false"] .ob-a{animation:none}
@media (prefers-reduced-motion:reduce){.ob-root .ob-a{animation:none}}
`

/* A drawing plays when it arrives and again on every re-entry, so scrolling
   back up to re-watch one works. `run` doubles as the remount key; at 0 the
   drawing has never been on screen and renders finished and still — which is
   also what a browser with no IntersectionObserver gets, so nothing here can
   go blank. */
function useReplay() {
  const ref = React.useRef(null)
  const [run, setRun] = React.useState(0)
  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    let inside = false
    const io = new IntersectionObserver(entries => {
      const hit = entries.some(e => e.isIntersecting)
      if (hit && !inside) { inside = true; setRun(r => r + 1) }
      else if (!hit && inside) { inside = false }
    }, { threshold: 0.3, rootMargin: '0px 0px -8% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, run]
}

function Beat({ beat }) {
  const [ref, run] = useReplay()
  const Stage = beat.Stage
  return (
    <section ref={ref} data-play={String(run > 0)}
      className="flex flex-col overflow-hidden rounded-panel border border-rule bg-card shadow-raise">
      <div className="px-5 py-6 sm:px-7">
        <h3 className="max-w-[30ch] font-display text-sub font-bold leading-[1.16] text-ink">
          {beat.head}</h3>
        <p className="mt-3 max-w-[46ch] text-sec text-ink-2">{beat.sub}</p>
      </div>
      {/* Height is reserved, not derived, so the drawing cannot reflow the page
          as it loads. Full-bleed on a phone: the drawing scales with its
          viewBox, so every 20px of side padding shrinks the labels, and at
          390px wide a padded version put the annotations under 8px. */}
      <div className="mt-auto h-[188px] border-t border-rule bg-paper p-1 sm:h-[212px] sm:p-2">
        <Stage key={run} />
      </div>
    </section>
  )
}

export function Onboarding({ className }) {
  return (
    <div className={cn('ob-root grid gap-6 lg:grid-cols-2', className)}>
      <style>{CSS}</style>
      {BEATS.map(b => <Beat key={b.head} beat={b} />)}
    </div>
  )
}
