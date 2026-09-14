import React from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '../lib/utils'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'

/* The twenty-second explainer that sits under the hero.
 *
 * A judge or a parent arrives knowing nothing, and the thing being explained is
 * a physical object plus a piece of software plus a reason for both. That is
 * three ideas, and nobody reads three paragraphs on a landing page. So the
 * whole argument is four sentences, each with a drawing that shows the claim
 * rather than decorating it: the day climbing, the patch reading, the four
 * traces becoming one number, the Tuesday conversation.
 *
 * Every drawing is inline SVG with a stroke-draw animation, and every drawing's
 * RESTING state — no animation at all — is the finished picture. That single
 * decision is what makes reduced-motion and paused behave correctly without a
 * second set of artwork: killing the animation reveals the complete diagram
 * instead of an empty frame. */

const BEAT_MS = 5000
const VB = '0 0 480 190'          // one viewBox for all four, so the box never resizes

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

/* Per-signal trace character, keyed off sensors.js so the order and the colours
   can only ever come from one place. Heart is dense and spiky, sweat and
   temperature drift, movement is jittery — the shapes are part of the
   explanation, not filler. */
const SHAPE = {
  heart: { steps: 22, amp: 8, seed: 1.15, len: 370 },
  sweat: { steps: 10, amp: 7, seed: 0.72, len: 300 },
  temp:  { steps: 8,  amp: 6, seed: 0.55, len: 295 },
  move:  { steps: 26, amp: 8, seed: 1.90, len: 385 },
}

const svgProps = {
  viewBox: VB,
  preserveAspectRatio: 'xMidYMid meet',
  className: 'h-full w-full',
  'aria-hidden': true,
  focusable: 'false',
}

/* ── Beat 1 ── a flat day that climbs while the clock passes ─────────────── */
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

/* ── Beat 2 ── four traces stacking out of the patch ─────────────────────── */
function StagePatch() {
  return (
    <svg {...svgProps}>
      {/* the forearm, as two lines running off the left edge — enough context to
          say "on the arm" without drawing a person */}
      <path d="M0 40 C 40 36, 96 38, 140 46" fill="none" strokeWidth="1.25"
        className="stroke-ink-3 ob-a ob-draw" style={{ '--len': 145, '--d': '.7s' }} />
      <path d="M0 156 C 40 158, 96 154, 140 146" fill="none" strokeWidth="1.25"
        className="stroke-ink-3 ob-a ob-draw" style={{ '--len': 145, '--d': '.7s' }} />

      <rect x="40" y="76" width="64" height="42" rx="10" strokeWidth="1.75"
        className="stroke-ink fill-card ob-a ob-draw" style={{ '--len': 215, '--d': '.8s', '--t': '.25s' }} />
      {SENSOR_ORDER.map((id, i) => (
        <circle key={id} r="3.5" cx={58 + (i % 2) * 28} cy={90 + Math.floor(i / 2) * 14}
          fill={SENSORS[id].glow} className="ob-a ob-pop"
          style={{ '--d': '.35s', '--t': `${0.85 + i * 0.09}s` }} />
      ))}
      <text x="72" y="136" textAnchor="middle" fontSize="13" className="font-body fill-ink-2">patch</text>

      {SENSOR_ORDER.map((id, i) => {
        const s = SENSORS[id], sh = SHAPE[id], y = 30 + i * 36
        return (
          <g key={id}>
            <path d={`M104 97 Q 140 97 168 ${y}`} fill="none" strokeWidth="1"
              className="stroke-ink-3 ob-a ob-draw"
              style={{ '--len': 115, '--d': '.5s', '--t': `${1.2 + i * 0.14}s` }} />
            <text x="170" y={y - 12} fontSize="13" className="font-body fill-ink-2 ob-a ob-rise"
              style={{ '--d': '.45s', '--t': `${1.45 + i * 0.14}s` }}>{s.name}</text>
            <path d={wave(y, sh.seed, sh.amp, sh.steps, 170, 452)} fill="none" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" stroke={s.glow}
              className="ob-a ob-draw"
              style={{ '--len': sh.len, '--d': '1.9s', '--t': `${1.6 + i * 0.14}s` }} />
          </g>
        )
      })}

      {/* the sampling rate, drawn as the ticks themselves rather than asserted */}
      {Array.from({ length: 24 }, (_, i) => (
        <line key={i} x1={170 + i * 12.26} y1="160" x2={170 + i * 12.26} y2="168"
          strokeWidth="1.25" className="stroke-ink-3 ob-a ob-rise"
          style={{ '--d': '.3s', '--t': `${2.5 + i * 0.045}s` }} />
      ))}
      <text x="170" y="182" fontSize="13" className="font-body fill-ink-2 ob-a ob-rise"
        style={{ '--d': '.5s', '--t': '3.6s' }}>one reading a second</text>
    </svg>
  )
}

/* ── Beat 3 ── four traces collapsing into one arc and one number ────────── */
function StageScore() {
  return (
    <svg {...svgProps}>
      {SENSOR_ORDER.map((id, i) => {
        const s = SENSORS[id], sh = SHAPE[id], y = 36 + i * 32
        return (
          <g key={id}>
            <path d={wave(y, sh.seed, 5, Math.round(sh.steps / 2), 20, 120)} fill="none"
              strokeWidth="2" strokeLinecap="round" stroke={s.glow}
              className="ob-a ob-draw" style={{ '--len': 120, '--d': '.8s', '--t': `${i * 0.1}s` }} />
            <path d={`M120 ${y} Q 164 ${y} 196 88`} fill="none" strokeWidth="1"
              className="stroke-ink-3 ob-a ob-draw"
              style={{ '--len': 95, '--d': '.7s', '--t': `${0.95 + i * 0.1}s` }} />
          </g>
        )
      })}
      <text x="70" y="176" textAnchor="middle" fontSize="13" className="font-body fill-ink-2">four signals</text>

      <circle cx="196" cy="88" r="4.5" className="fill-accent ob-a ob-pop"
        style={{ '--d': '.4s', '--t': '1.75s' }} />
      <path d="M200 91 L244 119" fill="none" strokeWidth="1" className="stroke-ink-3 ob-a ob-draw"
        style={{ '--len': 54, '--d': '.4s', '--t': '1.9s' }} />

      <path d="M248 124 A72 72 0 0 1 392 124" fill="none" strokeWidth="8" strokeLinecap="round"
        className="stroke-rule ob-a ob-rise" style={{ '--d': '.4s', '--t': '2.0s' }} />
      <path d="M248 124 A72 72 0 0 1 346.5 57.1" fill="none" strokeWidth="8" strokeLinecap="round"
        className="stroke-accent ob-a ob-draw" style={{ '--len': 142, '--d': '1.2s', '--t': '2.15s' }} />

      <g className="ob-a ob-rise" style={{ '--d': '.5s', '--t': '3.2s' }}>
        <text x="320" y="112" textAnchor="middle" fontSize="42" fontWeight="500"
          className="font-display fill-ink">62</text>
        <text x="320" y="132" textAnchor="middle" fontSize="13" className="font-body fill-ink-2">today</text>
      </g>
      <text x="320" y="164" textAnchor="middle" fontSize="14"
        className="font-body fill-ink ob-a ob-rise" style={{ '--d': '.5s', '--t': '3.6s' }}>
        &ldquo;Tense all afternoon, settled by six.&rdquo;
      </text>
    </svg>
  )
}

/* ── Beat 4 ── a week with one day marked, and the sentence beside it ────── */
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
  { tab: 'Before it shows',
    head: 'Stress builds for hours before it shows.',
    sub:  'The body reacts long before the person notices.',
    Stage: StageDay },
  { tab: 'Four signals',
    head: 'A patch on the forearm reads four signals, once a second.',
    sub:  'Heart, sweat, skin temperature and movement — read off the arm, not typed into an app.',
    Stage: StagePatch },
  { tab: 'One number',
    head: 'The app turns the day into one number and one plain sentence.',
    sub:  'No charts to interpret, and nothing that needs a clinician to read it.',
    Stage: StageScore },
  { tab: 'On Tuesday',
    head: 'So the conversation happens on Tuesday, not after a crisis.',
    sub:  'A small early conversation, in place of a late one.',
    Stage: StageWeek },
]

/* Keyframes live here rather than in tailwind.config.js because they are used
   by exactly one component and describe its drawings, not the design system.
   The two kill-switches at the bottom are the whole reduced-motion and paused
   story: remove the animation and every mark renders at its finished state. */
const CSS = `
.ob-root .ob-a{animation-duration:var(--d,1s);animation-delay:var(--t,0s);animation-fill-mode:both;animation-timing-function:cubic-bezier(.2,.7,.3,1)}
.ob-root .ob-draw{stroke-dasharray:var(--len);stroke-dashoffset:0;animation-name:ob-draw}
.ob-root .ob-rise{animation-name:ob-rise}
.ob-root .ob-pop{transform-box:fill-box;transform-origin:center;animation-name:ob-pop}
@keyframes ob-draw{from{stroke-dashoffset:var(--len)}}
@keyframes ob-rise{from{opacity:0;transform:translateY(7px)}}
@keyframes ob-pop{from{opacity:0;transform:scale(.4)}}
.ob-root[data-still="true"] .ob-a{animation:none}
@media (prefers-reduced-motion:reduce){.ob-root .ob-a{animation:none}}
`

export function Onboarding({ className }) {
  const reduced = useReducedMotion()
  const [beat, setBeat] = React.useState(0)
  const [playing, setPlaying] = React.useState(true)
  const fills = React.useRef([])

  /* Paused and reduced-motion are the same rendering problem — show the whole
     picture, hold it still — so they collapse into one flag. */
  const still = reduced || !playing

  // Segment fills are reset imperatively rather than held in state, because the
  // rAF loop writes them 60× a second and re-rendering four buttons that often
  // is real work for a purely decorative bar.
  React.useLayoutEffect(() => {
    fills.current.forEach((el, i) => {
      if (el) el.style.transform = `scaleX(${i < beat ? 1 : 0})`
    })
  }, [beat])

  React.useEffect(() => {
    if (still) return
    let raf = 0, t0 = null
    const step = t => {
      t0 ??= t
      const p = Math.min(1, (t - t0) / BEAT_MS)
      const el = fills.current[beat]
      if (el) el.style.transform = `scaleX(${p})`
      if (p >= 1) setBeat(b => (b + 1) % BEATS.length)
      else raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [beat, still])

  /* Any deliberate act by a human ends the autoplay. An explainer that starts
     moving again while someone is reading beat 3 is fighting its own viewer. */
  const jump = i => { setPlaying(false); setBeat(i) }

  const Stage = BEATS[beat].Stage

  return (
    <section
      className={cn('ob-root rounded-panel border border-rule bg-card shadow-raise', className)}
      data-still={String(!!still)}
    >
      <style>{CSS}</style>

      <div className="flex items-center justify-between gap-4 border-b border-rule px-5 py-4 sm:px-7">
        <h2 className="font-display text-tick font-medium text-ink-2">How it works</h2>
        {/* Hidden under reduced motion: nothing is playing, so a pause control
            would be a button that does nothing. */}
        {!reduced && (
          <button type="button" onClick={() => setPlaying(p => !p)}
            className="inline-flex min-h-[46px] items-center gap-2.5 rounded-field border border-ink
              px-4 font-display text-ui font-medium text-ink
              transition-colors duration-150 ease-out hover:bg-mist active:bg-mist">
            <svg aria-hidden viewBox="0 0 12 12" className="size-[1.05em] fill-current">
              {playing
                ? <g><rect x="2" y="1.5" width="3" height="9" /><rect x="7" y="1.5" width="3" height="9" /></g>
                : <path d="M3 1.5 L10.5 6 L3 10.5 Z" />}
            </svg>
            {playing ? 'Pause' : 'Play'}
          </button>
        )}
      </div>

      <div className="grid items-center gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[1fr_1.05fr] lg:gap-10">
        {/* One live region holding all four beats stacked in a single grid cell.
            Stacking fixes the height at the tallest beat, so a short headline
            and a long one cannot resize the box; the inactive three are
            visibility:hidden, which keeps their boxes but takes them out of the
            accessibility tree, so the region announces only the current beat. */}
        <div aria-live="polite" aria-atomic="true" className="grid">
          {BEATS.map((b, i) => (
            <div key={i} className={cn('[grid-area:1/1]', i === beat ? 'visible' : 'invisible')}>
              <p className="font-display text-sub font-medium text-ink">{b.head}</p>
              <p className="mt-3 max-w-[46ch] text-sec text-ink-2">{b.sub}</p>
            </div>
          ))}
        </div>

        {/* Height is reserved, not derived, so swapping drawings never reflows
            the page under the hero. Full-bleed on a phone: the drawing scales
            with the viewBox, so every 20px of side padding shrinks the labels,
            and at 390px wide the padded version put the annotations under 8px. */}
        <div className="-mx-5 h-[188px] border-y border-rule bg-paper p-1
          sm:mx-0 sm:h-[228px] sm:rounded-field sm:border sm:p-2 lg:h-[240px]">
          <Stage key={beat} />
        </div>
      </div>

      <div className="grid grid-cols-2 border-t border-rule sm:grid-cols-4">
        {BEATS.map((b, i) => (
          <button key={i} type="button" onClick={() => jump(i)}
            aria-label={`Beat ${i + 1} of 4: ${b.head}`}
            aria-current={i === beat ? 'step' : undefined}
            className={cn(
              'group flex flex-col gap-2.5 border-rule px-5 py-4 text-left sm:px-6',
              'transition-colors duration-150 ease-out',
              '[&:nth-child(n+3)]:border-t sm:[&:nth-child(n+3)]:border-t-0',
              '[&:nth-child(even)]:border-l sm:[&:nth-child(n+2)]:border-l',
              'hover:bg-mist/70 active:bg-mist',
              i === beat ? 'bg-mist/40' : 'bg-transparent',
            )}>
            <span aria-hidden className="block h-[3px] w-full overflow-hidden rounded-bar bg-rule/60">
              <span ref={el => { fills.current[i] = el }}
                className="block h-full w-full origin-left rounded-bar bg-accent"
                style={{ transform: 'scaleX(0)' }} />
            </span>
            <span aria-hidden className="font-mono text-tick text-ink-3">0{i + 1}</span>
            <span aria-hidden className={cn('font-display text-ui font-medium',
              i === beat ? 'text-ink' : 'text-ink-3 group-hover:text-ink-2')}>{b.tab}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
