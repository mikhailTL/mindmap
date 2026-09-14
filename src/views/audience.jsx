import React from 'react'
import { useReducedMotion } from 'framer-motion'
import { Button } from '../ui/button'
import { ArrowLeft, ArrowRight } from '../ui/marks'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { SignalTrace, WeekStrip } from '../charts/infographics'
import { RainbowDial } from '../charts/rainbow'
import { studentRings } from '../lib/readings'
import { cn } from '../lib/utils'

/* The three audience routes.
 *
 * These used to be doors: clicking "For parents" in the top bar dropped a
 * visitor who had never heard of MindMap straight into a working parent
 * dashboard full of a stranger's readings, with no explanation of what the
 * product was or why those numbers existed. A judge arriving on the parent tab
 * met a chart before they met a claim.
 *
 * So each tab is now a walkthrough: what MindMap offers that group, what it
 * does for them, and one labelled way into the screen at the end. The app is
 * reached deliberately, not by accident.
 *
 * One `Walkthrough` renders all three. The three audiences differ only in the
 * data structure below it, which is the whole point — three hand-built pages
 * drift apart the first time one of them gets a fix.
 *
 * Drawing and animation follow s21/onboarding: inline SVG, stroke-draw and
 * rise keyframes driven by CSS custom properties, and one rule that makes
 * reduced-motion free — every drawing's RESTING state, with no animation at
 * all, is the finished picture. Kill the animation and you reveal the complete
 * diagram rather than an empty frame.
 */

/* ─────────────────────────── motion plumbing ─────────────────────────── */

/* Steps animate when they arrive and again on every re-entry, so scrolling
   back up to re-watch one works. `run` doubles as the remount key; a step that
   has never been seen sits at run 0, which renders the finished picture with
   no animation — the same state a stalled observer or a missing
   IntersectionObserver leaves behind, which is why nothing here can go blank. */
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

/* Keyframes live with the drawings that use them rather than in the Tailwind
   config, because they describe this page's artwork and nothing else. The two
   kill-switches at the bottom are the entire reduced-motion story. */
const CSS = `
.wt-root .wt-a{animation-duration:var(--d,.6s);animation-delay:var(--t,0s);animation-fill-mode:both;animation-timing-function:cubic-bezier(.2,.7,.3,1)}
.wt-root .wt-draw{stroke-dasharray:var(--len);stroke-dashoffset:0;animation-name:wt-draw}
.wt-root .wt-rise{animation-name:wt-rise}
.wt-root .wt-pop{transform-box:fill-box;transform-origin:center;animation-name:wt-pop}
.wt-root .wt-grow{transform-box:fill-box;transform-origin:bottom center;animation-name:wt-grow}
.wt-root .wt-sweep{transform-box:fill-box;transform-origin:left center;animation-name:wt-sweep}
.wt-root .wt-drop{transform-box:fill-box;transform-origin:top center;animation-name:wt-grow}
.wt-root .wt-move{animation-name:wt-move}
.wt-root .wt-in{animation-name:wt-in}
.wt-root .wt-wipe{animation-name:wt-wipe}
@keyframes wt-draw{from{stroke-dashoffset:var(--len)}}
@keyframes wt-rise{from{opacity:0;transform:translateY(8px)}}
@keyframes wt-pop{from{opacity:0;transform:scale(.4)}}
@keyframes wt-grow{from{transform:scaleY(0)}}
@keyframes wt-sweep{from{transform:scaleX(0)}}
@keyframes wt-move{from{transform:translate(var(--fx,0px),var(--fy,0px))}}
@keyframes wt-in{from{opacity:0;transform:translate(var(--fx,0px),var(--fy,0px))}}
@keyframes wt-wipe{from{clip-path:inset(0 100% 0 0)}}
.wt-root [data-play="false"] .wt-a{animation:none}
@media (prefers-reduced-motion:reduce){.wt-root .wt-a{animation:none}}
`

/* One viewBox for every drawn stage, so no step's artwork is at a different
   scale from its neighbour's. */
const svgProps = {
  viewBox: '0 0 480 200',
  preserveAspectRatio: 'xMidYMid meet',
  className: 'block h-auto w-full',
  'aria-hidden': true,
  focusable: 'false',
}

/* Deterministic wiggle, same as the onboarding explainer's: Math.random()
   would redraw on every render and read as noise rather than as a recording. */
function wave(y, seed, amp, steps, x0, x1) {
  let d = ''
  for (let i = 0; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps
    const n = Math.sin(i * seed) * 0.62 + Math.sin(i * seed * 2.3 + 1.7) * 0.38
    d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + (y - n * amp).toFixed(1)
  }
  return d
}

/* ═══════════════════════ students — five drawings ═══════════════════════ */

/* The dial the student screen actually uses, remounted on entry so its own
   count-up runs. A redrawn copy would be a picture of the feature; this is the
   feature. */
function ArtScore() {
  const moved = [
    ['sweat', 'Sweat climbed from one o’clock', 'raised it'],
    ['heart', 'Heart settled after six', 'lowered it'],
    ['move',  'PE counted as effort, not stress', 'held back'],
  ]
  return (
    <div className="flex w-full flex-col items-center gap-5 sm:flex-row sm:gap-7">
      <RainbowDial score={62} rings={studentRings()} size={252} className="shrink-0"/>
      <ul className="m-0 w-full min-w-0 list-none space-y-3 p-0">
        <li className="mark">What moved it</li>
        {moved.map(([id, text, effect], i) => (
          <li key={id} className="wt-a wt-rise flex items-baseline gap-2.5"
            style={{ '--d': '.5s', '--t': `${1.1 + i * 0.22}s` }}>
            <span aria-hidden className="mt-1 h-3.5 w-[3px] shrink-0"
              style={{ background: SENSORS[id].glow }}/>
            <span className="text-fine text-ink-2">{text}</span>
            <span className="ml-auto shrink-0 font-mono text-fine text-ink">{effect}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* The four real trace shapes from the infographics kit, wiped in left to right
   one after another — the order they are recorded in, at the speed they are
   drawn on the screen itself. */
function ArtSignals() {
  return (
    <ul className="m-0 grid w-full list-none grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2.5 p-0">
      {SENSOR_ORDER.map((id, i) => {
        const s = SENSORS[id], Icon = s.icon
        return (
          <li key={id} className="contents">
            <span className="wt-a wt-rise flex items-center gap-2"
              style={{ '--d': '.45s', '--t': `${i * 0.16}s` }}>
              <Icon aria-hidden className="size-4 shrink-0" style={{ color: s.glow }}/>
              <span className="font-display text-fine font-medium text-ink">{s.name}</span>
            </span>
            <span className="wt-a wt-wipe block" style={{ '--d': '1.05s', '--t': `${0.2 + i * 0.16}s` }}>
              <SignalTrace kind={id} className="h-7"/>
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/* A phone with a switch per row, a wall, and the two rows that get across it.
   The switches are drawn in their settled position; the animation is the knob
   travelling to it, so the resting frame is a correctly-set panel. */
const SHARE_ROWS = [
  ['Day score',     true],
  ['Week trend',    true],
  ['Every reading', false],
  ['Your notes',    false],
]
function ArtShare() {
  return (
    <svg {...svgProps}>
      <rect x="16" y="12" width="176" height="176" rx="14" strokeWidth="1.7"
        className="stroke-ink fill-card wt-a wt-draw" style={{ '--len': 700, '--d': '.9s' }}/>
      <text x="104" y="38" textAnchor="middle" fontSize="16" className="font-body fill-ink-2">Your phone</text>
      <line x1="30" y1="48" x2="178" y2="48" strokeWidth="1" className="stroke-rule"/>

      {SHARE_ROWS.map(([label, on], i) => {
        const y = 74 + i * 30
        return (
          <g key={label} className="wt-a wt-rise" style={{ '--d': '.5s', '--t': `${0.35 + i * 0.12}s` }}>
            <text x="30" y={y + 5} fontSize="14.5" className="font-body fill-ink">{label}</text>
            <rect x="140" y={y - 9} width="36" height="18" rx="9"
              className={on ? 'fill-accent' : 'fill-mist stroke-rule'} strokeWidth="1"/>
            <circle r="6.5" cx={on ? 167 : 149} cy={y} className={on ? 'fill-card' : 'fill-ink-3'}>
            </circle>
            {/* only the switches that ended up on have somewhere to travel from */}
            {on && <circle r="6.5" cx="167" cy={y} className="fill-card wt-a wt-move"
              style={{ '--fx': '-18px', '--d': '.5s', '--t': `${1 + i * 0.14}s` }}/>}
          </g>
        )
      })}

      {/* the wall: what does not cross it never leaves the handset */}
      <line x1="248" y1="24" x2="248" y2="176" strokeWidth="1.5" strokeDasharray="6 6"
        className="stroke-ruling wt-a wt-drop" style={{ '--d': '.7s', '--t': '1.3s' }}/>

      {[0, 1].map(i => (
        <path key={i} d={`M196 ${74 + i * 30} C 240 ${74 + i * 30}, 260 ${96 + i * 26}, 306 ${96 + i * 26}`}
          fill="none" strokeWidth="1.4"
          className="stroke-accent wt-a wt-draw"
          style={{ '--len': 120, '--d': '.8s', '--t': `${1.6 + i * 0.15}s` }}/>
      ))}
      {[2, 3].map(i => (
        <g key={i}>
          <path d={`M196 ${74 + i * 30} L 236 ${74 + i * 30}`} fill="none" strokeWidth="1.4"
            className="stroke-ink-3 wt-a wt-draw"
            style={{ '--len': 40, '--d': '.4s', '--t': `${1.9 + i * 0.12}s` }}/>
          <path d={`M232 ${68 + i * 30} l 10 12 M242 ${68 + i * 30} l -10 12`} strokeWidth="1.6"
            strokeLinecap="round" className="stroke-ink-3 wt-a wt-pop"
            style={{ '--d': '.35s', '--t': `${2.2 + i * 0.12}s` }}/>
        </g>
      ))}

      <g className="wt-a wt-rise" style={{ '--d': '.6s', '--t': '2.5s' }}>
        <rect x="306" y="56" width="158" height="90" rx="8" strokeWidth="1.4"
          className="stroke-rule fill-card"/>
        <text x="320" y="80" fontSize="14" className="font-body fill-ink-2">Shared out</text>
        <rect x="320" y="90" width="130" height="22" rx="6" className="fill-accent-wash"/>
        <text x="330" y="105" fontSize="13.5" className="font-body fill-accent-ink">Day score</text>
        <rect x="320" y="116" width="130" height="22" rx="6" className="fill-accent-wash"/>
        <text x="330" y="131" fontSize="13.5" className="font-body fill-accent-ink">Week trend</text>
      </g>
    </svg>
  )
}

/* The six-question check-in, running: the counter fills, an answer lands on the
   scale, and a score arrives on the right. */
function ArtCheck() {
  return (
    <svg {...svgProps}>
      <rect x="20" y="22" width="296" height="156" rx="10" strokeWidth="1.4"
        className="stroke-rule fill-card"/>
      <text x="38" y="48" fontSize="14" className="font-mono fill-ink-3">Question 6 of 6</text>
      <rect x="38" y="58" width="260" height="6" rx="3" className="fill-mist"/>
      <rect x="38" y="58" width="260" height="6" rx="3" className="fill-accent wt-a wt-sweep"
        style={{ '--d': '2.2s' }}/>
      <text x="38" y="92" fontSize="16" className="font-body fill-ink">How heavy did today feel?</text>

      {[0, 1, 2, 3, 4].map(i => {
        const cx = 62 + i * 58, picked = i === 3
        return (
          <g key={i}>
            <circle cx={cx} cy="126" r="13" fill="none" strokeWidth="1.5" className="stroke-ink-3"/>
            {picked && <circle cx={cx} cy="126" r="8" className="fill-accent wt-a wt-pop"
              style={{ '--d': '.4s', '--t': '2.1s' }}/>}
          </g>
        )
      })}
      <text x="62" y="160" textAnchor="middle" fontSize="13.5" className="font-body fill-ink-3">light</text>
      <text x="294" y="160" textAnchor="middle" fontSize="13.5" className="font-body fill-ink-3">heavy</text>

      <path d="M324 100 L 356 100 M348 94 l 8 6 -8 6" fill="none" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" className="stroke-ink-3 wt-a wt-draw"
        style={{ '--len': 60, '--d': '.5s', '--t': '2.5s' }}/>

      <g className="wt-a wt-rise" style={{ '--d': '.6s', '--t': '2.7s' }}>
        <rect x="366" y="58" width="98" height="84" rx="8" strokeWidth="1.5" className="stroke-ink fill-card"/>
        <text x="415" y="108" textAnchor="middle" fontSize="38" fontWeight="500"
          className="font-display fill-ink">58</text>
        <text x="415" y="128" textAnchor="middle" fontSize="13" className="font-body fill-ink-3">out of 100</text>
      </g>
    </svg>
  )
}

/* Seven days growing out of the baseline against the student's own usual
   range, with the two that cleared it painted as exceptions. */
const WEEK_H = [44, 60, 112, 52, 104, 38, 46]
const WEEK_D = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const WEEK_LINE = 96          // y of the top of this student's usual range
function ArtWeekBars() {
  return (
    <svg {...svgProps}>
      <line x1="26" y1="160" x2="348" y2="160" strokeWidth="1" className="stroke-ink-3"/>
      <line x1="26" y1={WEEK_LINE} x2="348" y2={WEEK_LINE} strokeWidth="1.5" strokeDasharray="6 6"
        className="stroke-warn wt-a wt-sweep" style={{ '--d': '.9s', '--t': '1.1s' }}/>

      {WEEK_H.map((h, i) => {
        const x = 32 + i * 46, over = 160 - h < WEEK_LINE
        return (
          <g key={i}>
            <rect x={x} y={160 - h} width="28" height={h} rx="3"
              className={cn('wt-a wt-grow', over ? 'fill-warn' : 'fill-ink-3')}
              style={{ '--d': '.6s', '--t': `${0.1 + i * 0.09}s` }}/>
            <text x={x + 14} y="182" textAnchor="middle" fontSize="14"
              className="font-mono fill-ink-3">{WEEK_D[i]}</text>
          </g>
        )
      })}

      {/* the gutter: every word sits to the right of the plot, never over it */}
      <g className="wt-a wt-rise" style={{ '--d': '.5s', '--t': '1.5s' }}>
        <text x="360" y={WEEK_LINE - 4} fontSize="14" className="font-body fill-warn">top of your</text>
        <text x="360" y={WEEK_LINE + 14} fontSize="14" className="font-body fill-warn">usual range</text>
      </g>
      <g className="wt-a wt-rise" style={{ '--d': '.5s', '--t': '1.9s' }}>
        <text x="360" y="44" fontSize="15" className="font-body fill-ink">Two days</text>
        <text x="360" y="62" fontSize="15" className="font-body fill-ink">above it</text>
      </g>
    </svg>
  )
}

/* ═══════════════════════ parents — five drawings ════════════════════════ */

/* A week of recording behind one card. The figures are a field, not a table:
   the point of the drawing is how many of them there are. */
const LCG = (() => {
  const out = []
  let s = 20260914
  for (let i = 0; i < 84; i++) { s = (s * 1103515245 + 12345) % 2147483648; out.push(30 + (s % 70)) }
  return out
})()
function ArtSentence() {
  return (
    <svg {...svgProps}>
      {LCG.map((n, i) => {
        const c = i % 12, r = (i / 12) | 0
        const x = 28 + c * 38, y = 30 + r * 24
        if (x > 46 && x < 430 && y > 50 && y < 154) return null
        return (
          <text key={i} x={x} y={y} fontSize="13.5"
            className="font-mono fill-ink-3 wt-a wt-pop"
            style={{ '--d': '.3s', '--t': `${(i * 0.012).toFixed(3)}s` }}>{n}</text>
        )
      })}
      <g className="wt-a wt-rise" style={{ '--d': '.7s', '--t': '1.3s' }}>
        {/* the site's one depth mechanism, drawn: a hard offset, no blur */}
        <rect x="63" y="65" width="356" height="80" rx="10" className="fill-ink" opacity=".1"/>
        <rect x="60" y="62" width="356" height="80" rx="10" strokeWidth="1.6" className="stroke-ink fill-card"/>
        <text x="82" y="97" fontSize="18" className="font-body fill-ink">Tuesday and Thursday ran high.</text>
        <text x="82" y="123" fontSize="16" className="font-body fill-ink-2">The rest of the week was calm.</text>
      </g>
    </svg>
  )
}

/* The parent screen's own week strip, wiped in. */
const PWEEK = [{ d:'Mon', v:41 }, { d:'Tue', v:74 }, { d:'Wed', v:46 }, { d:'Thu', v:69 },
               { d:'Fri', v:44 }, { d:'Sat', v:33 }, { d:'Sun', v:36 }]
const PBAND = { lo:28, hi:58 }
function ArtParentWeek() {
  return (
    <div className="w-full max-w-[30rem]">
      <p className="mark mb-4">Her week</p>
      <span className="wt-a wt-wipe block" style={{ '--d': '1.1s', '--t': '.1s' }}>
        <WeekStrip days={PWEEK} band={PBAND}/>
      </span>
      <p className="wt-a wt-rise mt-4 text-sec text-ink-2" style={{ '--d': '.5s', '--t': '1.3s' }}>
        Two days above her own range — <span className="text-ink">Tuesday and Thursday</span>.
        Her range is built from her own fortnight.
      </p>
    </div>
  )
}

/* The hard line, drawn as a line. What sits above it is what a parent account
   can render; what sits below it has no parent-side representation at all. */
const ABOVE = ['One score for the day', 'Which days ran high']
const BELOW = ['Any single reading', 'Anything the student wrote', 'Where the student was']
function ArtHardLine() {
  return (
    <svg {...svgProps}>
      {ABOVE.map((t, i) => {
        const y = 34 + i * 30
        return (
          <g key={t} className="wt-a wt-rise" style={{ '--d': '.5s', '--t': `${i * 0.15}s` }}>
            <circle cx="40" cy={y} r="10" className="fill-accent"/>
            <path d={`M35 ${y + 1} l 4 4 6.5 -8`} fill="none" strokeWidth="2" strokeLinecap="round"
              strokeLinejoin="round" className="stroke-card"/>
            <text x="60" y={y + 5} fontSize="16" className="font-body fill-ink">{t}</text>
          </g>
        )
      })}

      <line x1="24" y1="92" x2="456" y2="92" strokeWidth="2"
        className="stroke-ink wt-a wt-draw" style={{ '--len': 432, '--d': '1s', '--t': '.5s' }}/>
      <text x="456" y="110" textAnchor="end" fontSize="14" className="font-body fill-ink-2 wt-a wt-rise"
        style={{ '--d': '.5s', '--t': '1.3s' }}>nothing below this line has a parent view</text>

      {BELOW.map((t, i) => {
        const y = 136 + i * 26
        return (
          <g key={t} className="wt-a wt-rise" style={{ '--d': '.5s', '--t': `${1.5 + i * 0.18}s` }}>
            <circle cx="40" cy={y} r="10" fill="none" strokeWidth="1.5" className="stroke-ink-3" opacity=".6"/>
            <path d={`M34 ${y + 6} L 46 ${y - 6}`} strokeWidth="1.8" strokeLinecap="round"
              className="stroke-ink-3 wt-a wt-draw"
              style={{ '--len': 18, '--d': '.35s', '--t': `${1.75 + i * 0.18}s` }}/>
            <text x="60" y={y + 5} fontSize="16" className="font-body fill-ink-2">{t}</text>
          </g>
        )
      })}
    </svg>
  )
}

/* One thing crosses to the school because a guardian opened the gate, and the
   gate is drawn closing again afterwards, because that is the part people ask
   about. */
function ArtConsent() {
  return (
    <svg {...svgProps}>
      <rect x="18" y="44" width="128" height="112" rx="8" strokeWidth="1.5" className="stroke-ink fill-card"/>
      <text x="82" y="70" textAnchor="middle" fontSize="16" className="font-body fill-ink">You</text>
      <rect x="30" y="94" width="104" height="26" rx="6" className="fill-mist"/>
      <text x="82" y="111" textAnchor="middle" fontSize="13.5" className="font-body fill-ink-2">Everything else</text>

      <path d="M152 91 L 340 91" fill="none" strokeWidth="1.4" strokeDasharray="5 5"
        className="stroke-ruling wt-a wt-sweep" style={{ '--d': '.6s' }}/>

      <rect x="334" y="44" width="128" height="112" rx="8" strokeWidth="1.5" className="stroke-ink fill-card"/>
      <text x="398" y="70" textAnchor="middle" fontSize="16" className="font-body fill-ink">Counselor</text>
      {/* drawn where it ends up, animated from where it started */}
      <g className="wt-a wt-in" style={{ '--fx': '-184px', '--d': '1.2s', '--t': '.6s' }}>
        <rect x="346" y="78" width="104" height="26" rx="6" className="fill-accent-wash"/>
        <text x="398" y="95" textAnchor="middle" fontSize="13.5" className="font-body fill-accent-ink">Week trend</text>
      </g>

      <g className="wt-a wt-move" style={{ '--fy': '-58px', '--d': '.6s', '--t': '2.1s' }}>
        <rect x="234" y="60" width="10" height="76" rx="5" className="fill-ink"/>
      </g>
      <text x="239" y="156" textAnchor="middle" fontSize="14" className="font-body fill-ink-2 wt-a wt-rise"
        style={{ '--d': '.5s', '--t': '2.6s' }}>you can close it again</text>
    </svg>
  )
}

/* Readings stop; the chart shows a gap rather than a flat calm afternoon. */
function ArtGap() {
  return (
    <svg {...svgProps}>
      <line x1="28" y1="168" x2="452" y2="168" strokeWidth="1" className="stroke-ink-3"/>
      <text x="28" y="34" fontSize="14" className="font-body fill-ink-3">readings</text>

      <path d={wave(96, 1.05, 9, 20, 28, 244)} fill="none" strokeWidth="2.4" strokeLinecap="round"
        strokeLinejoin="round" className="stroke-accent wt-a wt-draw"
        style={{ '--len': 250, '--d': '1.5s' }}/>
      <circle cx="244" cy="96" r="4.5" className="fill-accent wt-a wt-pop"
        style={{ '--d': '.4s', '--t': '1.4s' }}/>

      <line x1="244" y1="46" x2="244" y2="168" strokeWidth="1.4" strokeDasharray="5 5"
        className="stroke-warn wt-a wt-drop" style={{ '--d': '.6s', '--t': '1.5s' }}/>
      <text x="252" y="42" fontSize="14" className="font-body fill-ink-2 wt-a wt-rise"
        style={{ '--d': '.5s', '--t': '1.7s' }}>last reading 4:10pm</text>
      <line x1="248" y1="96" x2="452" y2="96" strokeWidth="2" strokeDasharray="7 7"
        className="stroke-ink-3 wt-a wt-sweep" style={{ '--d': '1s', '--t': '1.8s' }}/>

      <g className="wt-a wt-rise" style={{ '--d': '.6s', '--t': '2.4s' }}>
        <rect x="248" y="118" width="204" height="56" rx="8" strokeWidth="1.4" className="stroke-warn fill-card"/>
        <rect x="248" y="118" width="4" height="56" className="fill-warn"/>
        <text x="266" y="142" fontSize="15" className="font-body fill-ink">No readings since 4:10pm.</text>
        <text x="266" y="162" fontSize="14" className="font-body fill-ink-2">Check the patch is on.</text>
      </g>
    </svg>
  )
}

/* ═══════════════════════ schools — five drawings ════════════════════════ */

/* Ranked by change. Rows are drawn in their final order and animated from the
   place the score ranking had them, so the motion IS the re-sort — and the
   still frame is the list the counselor actually gets. */
const RANK = [
  { id:'Student 5512', score:58, delta:'+16', from: 56 },
  { id:'Student 2298', score:49, delta:'+9',  from: 84 },
  { id:'Student 8241', score:74, delta:'+7',  from:-56 },
  { id:'Student 7736', score:63, delta:'+4',  from:  0 },
  { id:'Student 1184', score:81, delta:'−6',  from:-84 },
]
function ArtRank() {
  return (
    <svg {...svgProps}>
      <text x="318" y="32" textAnchor="end" fontSize="13.5" className="font-mono fill-ink-3">score</text>
      <text x="400" y="32" textAnchor="middle" fontSize="13.5" className="font-mono fill-ink-2">change</text>
      <line x1="346" y1="38" x2="454" y2="38" strokeWidth="2" className="stroke-accent wt-a wt-draw"
        style={{ '--len': 108, '--d': '.6s', '--t': '1.1s' }}/>

      {RANK.map((r, i) => {
        const y = 62 + i * 28
        return (
          <g key={r.id} className="wt-a wt-move"
            style={{ '--fy': `${r.from}px`, '--d': '.9s', '--t': '1.2s' }}>
            <text x="24" y={y + 5} fontSize="13.5" className="font-mono fill-ink-2">{r.id}</text>
            <rect x="130" y={y - 5} width="176" height="10" rx="5" className="fill-mist"/>
            <rect x="130" y={y - 5} width={176 * r.score / 100} height="10" rx="5" className="fill-accent"/>
            <text x="336" y={y + 5} textAnchor="end" fontSize="14" className="font-mono fill-ink">{r.score}</text>
            <g className="wt-a wt-rise" style={{ '--d': '.4s', '--t': `${0.3 + i * 0.1}s` }}>
              <rect x="350" y={y - 11} width="60" height="22" rx="6" className="fill-warn-wash"/>
              <text x="380" y={y + 5} textAnchor="middle" fontSize="13.5" className="font-mono fill-warn">{r.delta}</text>
            </g>
          </g>
        )
      })}
    </svg>
  )
}

/* The same list, limited by consent. Each row draws only as far as that
   family agreed, and the agreement arrives first so the cause is visible. */
const GRANTS = [
  { id:'Student 5512', show:'both',  score:58, chip:'trend and score' },
  { id:'Student 4470', show:'none',  score:0,  chip:'crisis alerts only' },
  { id:'Student 8241', show:'both',  score:74, chip:'trend and score' },
  { id:'Student 3907', show:'score', score:86, chip:'score, no trend' },
  { id:'Student 2298', show:'both',  score:49, chip:'trend and score' },
]
function ArtGrants() {
  return (
    <svg {...svgProps}>
      <text x="456" y="32" textAnchor="end" fontSize="13.5" className="font-mono fill-ink-3">
        what the family agreed</text>
      {GRANTS.map((r, i) => {
        const y = 60 + i * 28
        return (
          <g key={r.id}>
            <text x="24" y={y + 5} fontSize="13.5" className="font-mono fill-ink-2 wt-a wt-rise"
              style={{ '--d': '.4s', '--t': `${i * 0.08}s` }}>{r.id}</text>

            {/* the agreement arrives before the row does, because it is the cause */}
            <g className="wt-a wt-rise" style={{ '--d': '.45s', '--t': `${0.2 + i * 0.1}s` }}>
              <rect x="324" y={y - 11} width="132" height="22" rx="6" className="fill-mist"/>
              <text x="390" y={y + 5} textAnchor="middle" fontSize="12.5" className="font-body fill-ink-2">{r.chip}</text>
            </g>

            {r.show === 'both' ? (
              <>
                <rect x="130" y={y - 5} width="160" height="10" rx="5" className="fill-mist"/>
                <rect x="130" y={y - 5} width={160 * r.score / 100} height="10" rx="5"
                  className="fill-accent wt-a wt-sweep" style={{ '--d': '.7s', '--t': `${1.1 + i * 0.1}s` }}/>
              </>
            ) : (
              <g className="wt-a wt-rise" style={{ '--d': '.45s', '--t': `${1.1 + i * 0.1}s` }}>
                <rect x="130" y={y - 8} width="160" height="16" rx="4" fill="none" strokeWidth="1.2"
                  strokeDasharray="4 4" className="stroke-ink-3"/>
                <text x="210" y={y + 4} textAnchor="middle" fontSize="12" className="font-body fill-ink-2">
                  {r.show === 'none' ? 'nothing to show' : 'no trend'}</text>
              </g>
            )}
            {r.show !== 'none' && (
              <text x="312" y={y + 5} textAnchor="end" fontSize="14"
                className="font-mono fill-ink wt-a wt-rise"
                style={{ '--d': '.4s', '--t': `${1.4 + i * 0.1}s` }}>{r.score}</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

/* The floor of five, shown by putting a group that clears it next to a group
   that does not. */
function ArtFloor() {
  return (
    <svg {...svgProps}>
      <rect x="18" y="16" width="212" height="150" rx="10" strokeWidth="1.4" className="stroke-rule fill-card"/>
      <text x="36" y="42" fontSize="15" className="font-body fill-ink">One class · 4 students</text>
      {[0, 1, 2, 3].map(i => (
        <circle key={i} cx={44 + i * 26} cy="72" r="8" className="fill-ink-3 wt-a wt-pop"
          style={{ '--d': '.35s', '--t': `${i * 0.12}s` }}/>
      ))}
      <g className="wt-a wt-rise" style={{ '--d': '.5s', '--t': '.9s' }}>
        <rect x="36" y="98" width="176" height="52" rx="6" fill="none" strokeWidth="1.3"
          strokeDasharray="5 5" className="stroke-ink-3"/>
        <text x="124" y="129" textAnchor="middle" fontSize="15" className="font-body fill-ink-2">
          nothing reported</text>
      </g>

      <rect x="250" y="16" width="212" height="150" rx="10" strokeWidth="1.4" className="stroke-rule fill-card"/>
      <text x="268" y="42" fontSize="14" className="font-body fill-ink">Year group · 11 students</text>
      {Array.from({ length: 11 }, (_, i) => (
        <circle key={i} cx={276 + (i % 6) * 26} cy={66 + ((i / 6) | 0) * 24} r="8"
          className="fill-ink-3 wt-a wt-pop" style={{ '--d': '.35s', '--t': `${i * 0.07}s` }}/>
      ))}
      <g className="wt-a wt-rise" style={{ '--d': '.5s', '--t': '1.1s' }}>
        <rect x="268" y="110" width="176" height="42" rx="6" strokeWidth="1.3" className="stroke-rule fill-mist"/>
        <rect x="282" y="126" width="106" height="10" rx="5" className="fill-rule"/>
        <rect x="282" y="126" width="67" height="10" rx="5" className="fill-accent wt-a wt-sweep"
          style={{ '--d': '.8s', '--t': '1.4s' }}/>
        <text x="428" y="135" textAnchor="end" fontSize="16" className="font-mono fill-ink">63</text>
      </g>

      <text x="240" y="188" textAnchor="middle" fontSize="14" className="font-body fill-ink-2">
        under five, the answer is withheld — not estimated</text>
    </svg>
  )
}

/* Opening a record writes a line. The line is drawn last, after the record is
   opened, which is the order it actually happens in. */
const LOG = [
  ['Mon 09:12', 'counselor A opened Student 8241'],
  ['Mon 11:40', 'counselor A exported a summary'],
  ['Tue 08:05', 'counselor B opened Student 5512'],
]
function ArtAudit() {
  return (
    <svg {...svgProps}>
      <g className="wt-a wt-rise" style={{ '--d': '.5s' }}>
        <rect x="24" y="20" width="212" height="54" rx="8" strokeWidth="1.5" className="stroke-ink fill-card"/>
        <text x="42" y="44" fontSize="15" className="font-mono fill-ink">Student 5512</text>
        <text x="42" y="63" fontSize="13.5" className="font-body fill-ink-2">record opened</text>
      </g>
      {/* the pointer that did it, arriving and landing on the card */}
      <path d="M190 40 L 190 64 L 197 58 L 202 68 L 207 66 L 202 56 L 210 55 Z"
        strokeWidth="1.3" className="fill-card stroke-ink wt-a wt-in"
        style={{ '--fx': '-34px', '--fy': '26px', '--d': '.7s', '--t': '.4s' }}/>

      <rect x="24" y="88" width="432" height="96" rx="8" strokeWidth="1.4" className="stroke-rule fill-card"/>
      <text x="42" y="112" fontSize="14" className="font-body fill-ink-2">Access log · the school can read it</text>
      <line x1="42" y1="120" x2="438" y2="120" strokeWidth="1" className="stroke-rule"/>
      {LOG.map(([when, what], i) => {
        const y = 140 + i * 20, last = i === LOG.length - 1
        return (
          <g key={when} className="wt-a wt-rise"
            style={{ '--d': '.45s', '--t': `${last ? 1.7 : 1 + i * 0.15}s` }}>
            {last && <rect x="36" y={y - 13} width="408" height="19" rx="4" className="fill-accent-wash wt-a wt-sweep"
              style={{ '--d': '.6s', '--t': '1.7s' }}/>}
            <text x="42" y={y} fontSize="13.5" className="font-mono fill-ink-3">{when}</text>
            <text x="126" y={y} fontSize="13.5"
              className={cn('font-mono', last ? 'fill-ink' : 'fill-ink-2')}>{what}</text>
          </g>
        )
      })}
    </svg>
  )
}

/* Crossing the review line produces an action with a reason, and the drawing
   says out loud what the action is not. */
function ArtEscalate() {
  return (
    <svg {...svgProps}>
      <line x1="26" y1="168" x2="316" y2="168" strokeWidth="1" className="stroke-ink-3"/>
      <line x1="26" y1="72" x2="316" y2="72" strokeWidth="1.4" strokeDasharray="5 5"
        className="stroke-warn wt-a wt-sweep" style={{ '--d': '.7s' }}/>
      <text x="26" y="64" fontSize="13.5" className="font-body fill-warn">review line</text>

      <path d="M30 150 C 80 148, 118 140, 156 124 C 198 106, 226 88, 262 58 L 310 44"
        fill="none" strokeWidth="2.4" strokeLinecap="round" className="stroke-accent wt-a wt-draw"
        style={{ '--len': 320, '--d': '1.6s', '--t': '.4s' }}/>
      <circle cx="238" cy="72" r="6" className="fill-warn wt-a wt-pop"
        style={{ '--d': '.4s', '--t': '1.6s' }}/>
      <text x="228" y="54" textAnchor="end" fontSize="13.5" className="font-body fill-ink-2 wt-a wt-rise"
        style={{ '--d': '.45s', '--t': '1.75s' }}>crossed Tuesday</text>

      <path d="M320 104 L 346 104 M339 98 l 7 6 -7 6" fill="none" strokeWidth="1.5" strokeLinecap="round"
        strokeLinejoin="round" className="stroke-ink-3 wt-a wt-draw"
        style={{ '--len': 44, '--d': '.4s', '--t': '1.9s' }}/>

      <g className="wt-a wt-rise" style={{ '--d': '.6s', '--t': '2.1s' }}>
        <rect x="354" y="44" width="112" height="118" rx="8" strokeWidth="1.5" className="stroke-ink fill-card"/>
        <text x="410" y="70" textAnchor="middle" fontSize="14" className="font-body fill-ink-2">Next step</text>
        <rect x="364" y="82" width="92" height="30" rx="6" strokeWidth="1.2" className="stroke-rule fill-mist"/>
        <text x="410" y="102" textAnchor="middle" fontSize="12" className="font-body fill-ink">Check in today</text>
        <rect x="364" y="118" width="92" height="30" rx="6" strokeWidth="1.2" className="stroke-rule fill-mist"/>
        <text x="410" y="138" textAnchor="middle" fontSize="12" className="font-body fill-ink">Refer on</text>
      </g>
      <text x="26" y="190" fontSize="14" className="font-body fill-ink-2">
        a step to take, not a diagnosis</text>
    </svg>
  )
}

/* ═════════════════════════════ the content ══════════════════════════════ */

const AUDIENCES = {
  student: {
    label: 'For students',
    title: 'You see everything the patch reads.',
    lede: 'MindMap turns your day into one score and one sentence, shows you the four signals underneath it, and lets you decide line by line what anybody else is told.',
    steps: [
      { kind:'flow', Art:ArtScore, tag:'The score',
        head:'Your day becomes one score out of 100, and the app names what moved it.',
        body:'The score is set against your own last two weeks, never against other students. Underneath it the app names the signals that pushed it up and the ones that held it down, so the number always arrives with a reason attached.' },
      { kind:'flow', Art:ArtSignals, tag:'The four signals',
        head:'Each of the four signals keeps its own trace.',
        body:'Heart, sweat, skin temperature and movement are read once a second and drawn separately, each in its own colour. Open one and you get its last hour, its bars class period by class period, and where today sits inside your own fortnight.' },
      { kind:'svg', Art:ArtShare, tag:'What you share',
        head:'You set what leaves your phone, one row at a time.',
        body:'The day’s score, the week’s shape, individual readings and anything you typed each have their own switch. Turn one off and it stops being shared from that moment. Crisis alerts are the single exception, and you are told that before you start.' },
      { kind:'svg', Art:ArtCheck, tag:'Check in without it',
        head:'You can take a reading without wearing the patch.',
        body:'Six questions, each answered on a five-point scale, scored by the same model the patch feeds. It is there for the days you do not have the patch on, and for checking what the score is actually responding to.' },
      { kind:'svg', Art:ArtWeekBars, tag:'The week',
        head:'Seven days side by side show the pattern you cannot feel day to day.',
        body:'Every day is scored the same way and lined up against your own usual range. Two heavy days in the same week are obvious on the strip and close to invisible from inside it.' },
    ],
    cta: { view:'app-student', label:'Open the student screen',
      title:'The student screen',
      line:'Today’s score, the four signals behind it, and the check-in. It runs on sample readings, so nothing in it is anyone’s real week.' },
  },

  parent: {
    label: 'For parents',
    title: 'One sentence a week about your child.',
    lede: 'MindMap tells you when a week ran hard and when it did not, in plain words — and never hands you a reading you would have to interpret.',
    steps: [
      { kind:'svg', Art:ArtSentence, tag:'One sentence',
        head:'You get one sentence a week, not a stream of numbers.',
        body:'Four signals at one reading a second is a few million readings in a week. The app does the reading and gives you a line in plain words, with the days behind it if you want to look.' },
      { kind:'flow', Art:ArtParentWeek, tag:'Days above range',
        head:'The week shows which days sat above your child’s own range.',
        body:'The range is built from their own fortnight, so a naturally fast resting heart rate is not read as a bad week. Days above it are marked and days inside it are left alone.' },
      { kind:'svg', Art:ArtHardLine, tag:'The hard line',
        head:'You never see a raw reading, a note, or a location.',
        body:'A parent account can render the day’s score and the shape of the week. Below that there is no parent view to enable — it is a property of the product, not a setting somebody could switch on by accident.' },
      { kind:'svg', Art:ArtConsent, tag:'What a school sees',
        head:'You decide what a school counselor may see, and you can take it back.',
        body:'Sharing with a school is off until a guardian turns it on, and what it covers is trends and a score — not readings. Switching it off stops the sharing from that moment.' },
      { kind:'svg', Art:ArtGap, tag:'Missing readings',
        head:'If the patch stops reporting, you are told.',
        body:'A gap in the data is shown as a gap, with the time the last reading arrived. Missing readings are never allowed to fill in as a quiet afternoon.' },
    ],
    cta: { view:'app-parent', label:'Open the parent screen',
      title:'The parent screen',
      line:'The week, the sentence, and the full list of what is and is not shared. It runs on sample readings, so nothing in it belongs to a real family.' },
  },

  pro: {
    label: 'For school counselors',
    title: 'A caseload ordered by who changed this week.',
    lede: 'MindMap ranks the students whose families consented by how fast they are moving, holds every row inside what was agreed, and logs every record you open.',
    steps: [
      { kind:'svg', Art:ArtRank, tag:'Ranked by change',
        head:'The list is ranked by change, not by score.',
        body:'A student who has always run high is rarely the one being missed. The console sorts on the size of this week’s move, so the row at the top is the one that is different from itself.' },
      { kind:'svg', Art:ArtGrants, tag:'Consent limits it',
        head:'Consent decides what each row is allowed to show.',
        body:'Every row is limited by what that family agreed to: a trend and a score, a score without trends, or crisis alerts only. Where nothing was agreed the row shows nothing — not a greyed-out figure you could guess at.' },
      { kind:'svg', Art:ArtFloor, tag:'The floor of five',
        head:'Nothing is reported for a group smaller than five.',
        body:'Class, year group and season views return a result only when at least five students sit inside them. Below that the answer is withheld, because with four it is a short step from a group figure to a named student.' },
      { kind:'svg', Art:ArtAudit, tag:'The audit log',
        head:'Every record you open is written to a log the school can read.',
        body:'The log records who opened which record and when. It is written whether or not you change anything, and there is no setting that turns it off.' },
      { kind:'svg', Art:ArtEscalate, tag:'Escalation',
        head:'When a score crosses the review line, you get a next step.',
        body:'The console hands you an action — check in, or refer on — with the reason it fired attached to it. It returns no diagnosis and no clinical finding, and it says so on the screen.' },
    ],
    cta: { view:'app-pro', label:'Open the counselor console',
      title:'The counselor console',
      line:'The ranked caseload, the consent ledger and the audit log. It runs on sample students, so no row belongs to a real person.' },
  },
}

/* ══════════════════════════ the shared page ═════════════════════════════ */

const SVG_STAGE = '-mx-[22px] border-y border-rule bg-card sm:mx-0 sm:rounded-field sm:border'
const FLOW_STAGE = 'flex min-h-[208px] items-center justify-center rounded-field border border-rule ' +
  'bg-card p-4 sm:min-h-[244px] sm:p-6 lg:min-h-[268px]'

function Stage({ step, still, flip }) {
  const [ref, run] = useReplay()
  const Art = step.Art
  /* Under reduced motion nothing is ever remounted, so the drawing is built
     once, in its finished state, and never moves again. */
  const play = !still && run > 0
  return (
    <div ref={ref} data-play={String(play)}
      className={cn(step.kind === 'svg' ? SVG_STAGE : FLOW_STAGE, flip && 'lg:order-1')}>
      <Art key={still ? 0 : run}/>
    </div>
  )
}

function Walkthrough({ audience, go }) {
  const reduced = useReducedMotion()
  const a = AUDIENCES[audience]
  return (
    <main className="wt-root">
      <style>{CSS}</style>

      <div className="border-b border-rule bg-mist">
        <div className="wrap grid gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-16">
          <div>
            <button onClick={() => go('site')}
              className="mb-8 flex min-h-[44px] w-fit items-center gap-2 py-2 font-display text-meta
                font-medium text-accent transition-colors duration-150 hover:text-accent-ink">
              <ArrowLeft aria-hidden className="size-4"/> Overview
            </button>
            <p className="font-mono text-tick text-ink-2">{a.label}</p>
            <h1 className="mt-3 max-w-[18ch] font-display text-view font-medium leading-[1.06]
              tracking-tight text-ink">{a.title}</h1>
            <p className="mt-5 max-w-[52ch] text-lead text-ink-2">{a.lede}</p>
            {/* Said once, here, rather than badged onto fifteen drawings. */}
            <p className="mt-6 max-w-[52ch] text-sec text-ink-3">
              {a.steps.length} things it does, drawn with the app’s own charts. Every figure in the
              drawings below is sample data.
            </p>
          </div>

          {/* Buttons rather than anchors: the site routes on the hash, so a real
              #fragment link would be read as a navigation and change the view. */}
          <nav aria-label={`${a.label} — contents`} className="self-end">
            <ol className="m-0 list-none p-0">
              {a.steps.map((s, i) => (
                <li key={s.head}>
                  <button onClick={() => document.getElementById(`${audience}-step-${i + 1}`)
                    ?.scrollIntoView({ behavior:'smooth', block:'start' })}
                    className="flex min-h-[50px] w-full items-baseline gap-3 border-t border-rule
                      px-1 py-2.5 text-left transition-colors duration-150 hover:bg-paper/60">
                    <span className="font-mono text-fine font-light tabular-nums text-ink-3">
                      {String(i + 1).padStart(2, '0')}</span>
                    <span className="font-display text-meta font-medium text-ink-2">{s.tag}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>

      <ol className="wrap list-none py-14">
        {a.steps.map((s, i) => {
          const flip = i % 2 === 1
          return (
            <li key={s.head} id={`${audience}-step-${i + 1}`} data-anchor
              className={cn('grid gap-7 border-t border-rule py-10 first:border-t-0 first:pt-0',
                'lg:items-center lg:gap-14',
                flip ? 'lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]'
                     : 'lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]')}>
              <div className={cn(flip && 'lg:order-2')}>
                <span className="font-mono text-num font-light tabular-nums text-ink-3">
                  {String(i + 1).padStart(2, '0')}</span>
                <h2 className="mt-3 max-w-[22ch] font-display text-sub font-medium leading-[1.14]
                  tracking-tight text-ink">{s.head}</h2>
                <p className="mt-4 max-w-[44ch] text-sec text-ink-2">{s.body}</p>
              </div>
              <Stage step={s} still={!!reduced} flip={flip}/>
            </li>
          )
        })}
      </ol>

      {/* The one way into the app from this page, at the end of it, named. */}
      <div className="wrap py-20">
        <div className="field shadow-raise p-7 sm:p-10">
          <p className="mark max-w-none">Open the app</p>
          <h2 className="mt-5 font-display text-sub font-medium tracking-tight text-ink">{a.cta.title}</h2>
          <p className="mt-4 max-w-[54ch] text-sec text-ink-2">{a.cta.line}</p>
          <Button className="mt-7" onClick={() => go(a.cta.view)}>
            {a.cta.label} <ArrowRight aria-hidden/>
          </Button>
        </div>
      </div>
    </main>
  )
}

export function ForStudents({ go }) { return <Walkthrough audience="student" go={go}/> }
export function ForParents({ go })  { return <Walkthrough audience="parent"  go={go}/> }
export function ForSchools({ go })  { return <Walkthrough audience="pro"     go={go}/> }
