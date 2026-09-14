import React from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '../lib/utils'
import { Button } from '../ui/button'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { LAYERS } from './Patch'

/* The title sequence. Twenty seconds, once, the first time anyone opens the
 * site — the caller is responsible for not mounting it a second time.
 *
 * Two decisions shape the whole file.
 *
 * First: every drawing's RESTING state is the finished picture, and motion is
 * only ever an animation layered on top of it. That is what makes reduced
 * motion and an interrupted beat behave without a second set of artwork —
 * killing the animation reveals a complete diagram rather than an empty frame.
 * It is the same contract src/s21/onboarding.jsx works under, and the drawing
 * idiom here (stroke-draw, rise, pop, driven by --d / --t custom properties)
 * is deliberately the same one so the two explainers read as one hand.
 *
 * Second: one requestAnimationFrame loop owns the entire timeline. An earlier
 * shape of this was a chain of five setTimeouts, which meant five things to
 * cancel, a beat index that could disagree with the progress bar, and no way
 * to know where in a beat an unmount happened. One clock, one cancel.
 *
 * The hardware beat is the centrepiece because the patch is the only physical
 * thing the project has, so it gets the longest beat and the largest drawing. */

/* Durations are per-beat rather than one divided by five: the problem states
   itself quickly, the hardware needs time to assemble and be read, and the
   wordmark only has to land. 20.6s total. */
const BEATS = [
  { ms: 4000,
    head: 'Stress builds for hours before it shows.',
    sub:  'The body starts reacting long before anything looks different from the outside.' },
  { ms: 4600,
    head: 'So the patch reads the body directly.',
    sub:  'Three printed layers around a XIAO nRF52840 Sense board, worn on the forearm.' },
  { ms: 4200,
    head: 'Four signals, once a second.',
    sub:  'Heart, sweat, skin temperature and movement — read off the arm, not typed into an app.' },
  { ms: 4600,
    head: 'One number, one sentence, three people.',
    sub:  'The student sees the signals. A parent sees the sentence. A counselor sees only what a guardian agreed to.' },
  { ms: 3200,
    head: 'MindMap',
    sub:  'A patch on the arm, and one sentence a day.' },
]
const TOTAL = BEATS.reduce((a, b) => a + b.ms, 0)
const EXIT_MS = 480          // must match the opacity transition on the overlay
const SKIP_MS = 180          // a skip is an interruption, so it clears faster
const STILL_MS = 900         // reduced motion: hold the wordmark, then leave

const svgProps = {
  preserveAspectRatio: 'xMidYMid meet',
  className: 'h-full w-full',
  'aria-hidden': true,
  focusable: 'false',
}

/* Deterministic wiggle, and its own measured length. Math.random() would redraw
   on every render and read as noise rather than as a recording; the length is
   returned because --len has to be at least the path length or the stroke-draw
   never completes, and eyeballing it is how a trace ends up permanently short. */
function waveLine(y, seed, amp, steps, x0, x1) {
  let d = '', len = 0, px = 0, py = 0
  for (let i = 0; i <= steps; i++) {
    const x = x0 + ((x1 - x0) * i) / steps
    const n = Math.sin(i * seed) * 0.62 + Math.sin(i * seed * 2.3 + 1.7) * 0.38
    const yy = y - n * amp
    if (i) len += Math.hypot(x - px, yy - py)
    d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + yy.toFixed(1)
    px = x; py = yy
  }
  return { d, len: Math.ceil(len) + 4 }
}

/* Per-signal trace character, keyed off sensors.js so order and colour can only
   come from one place. Heart is dense and spiky, sweat and temperature drift,
   movement is jittery — the shape is part of the claim, not decoration. */
const SHAPE = {
  heart: { steps: 24, amp: 9, seed: 1.15 },
  sweat: { steps: 11, amp: 8, seed: 0.72 },
  temp:  { steps: 9,  amp: 7, seed: 0.55 },
  move:  { steps: 28, amp: 9, seed: 1.90 },
}

/* ── Beat 1 ─────────────────────────────────────────────────────────────────
   Two lanes over one day. The upper lane is what a teacher or a parent has to
   go on and it is flat for seven hours; the lower lane is what the body is
   doing over the same seven hours. The upper lane only breaks at the far
   right, which is the entire argument of the product in one picture. */
const HOURS = ['7a', '9a', '11a', '1p', '3p', '5p', '7p', '9p']
const HX = i => 54 + i * 54                      // 54 → 432 across a 480 box
const INSIDE = 'M54 218 C 110 216, 152 210, 192 202 S 268 180, 306 162 C 350 140, 400 116, 432 96'

function StageDay() {
  return (
    <div className="mr-auto flex h-full w-full max-w-[900px] items-center">
      <svg {...svgProps} viewBox="0 0 480 280">
        <line x1="40" y1="250" x2="452" y2="250" strokeWidth="1"
          className="stroke-ink-3 iv-a iv-draw" style={{ '--len': 420, '--d': '.55s' }} />
        {HOURS.map((h, i) => (
          <g key={h} className="iv-a iv-rise" style={{ '--d': '.4s', '--t': `${0.1 + i * 0.07}s` }}>
            <line x1={HX(i)} y1="250" x2={HX(i)} y2="258" strokeWidth="1" className="stroke-ink-3" />
            <text x={HX(i)} y="274" textAnchor="middle" fontSize="15"
              className="font-mono fill-ink-3">{h}</text>
          </g>
        ))}

        <text x="54" y="44" fontSize="17" className="font-body fill-ink-2 iv-a iv-rise"
          style={{ '--d': '.5s', '--t': '.3s' }}>what anyone can see</text>
        <path d="M54 68 H378" fill="none" strokeWidth="1.5" strokeLinecap="round"
          className="stroke-ink-3 iv-a iv-draw" style={{ '--len': 330, '--d': '1.5s', '--t': '.5s' }} />
        {HOURS.slice(0, 7).map((h, i) => (
          <circle key={h} cx={HX(i)} cy="68" r="4" className="fill-ink-3 iv-a iv-pop"
            style={{ '--d': '.3s', '--t': `${0.55 + i * 0.13}s` }} />
        ))}

        <text x="54" y="178" fontSize="17" className="font-body fill-ink-2 iv-a iv-rise"
          style={{ '--d': '.5s', '--t': '.6s' }}>what the patch measures</text>
        <path d={INSIDE} fill="none" strokeWidth="3" strokeLinecap="round"
          className="stroke-accent iv-a iv-draw" style={{ '--len': 440, '--d': '2.5s', '--t': '.55s' }} />

        {/* The break, in terracotta — the token that means out of range — landing
            a beat after the climb has already crossed the frame. */}
        <path d="M378 68 L432 36" fill="none" strokeWidth="3" strokeLinecap="round"
          className="stroke-warn iv-a iv-draw" style={{ '--len': 75, '--d': '.4s', '--t': '2.95s' }} />
        <circle cx="432" cy="36" r="5.5" className="fill-warn iv-a iv-pop"
          style={{ '--d': '.35s', '--t': '3.25s' }} />
        <text x="424" y="22" textAnchor="end" fontSize="17"
          className="font-body fill-ink iv-a iv-rise" style={{ '--d': '.45s', '--t': '3.4s' }}>
          now it shows
        </text>
      </svg>
    </div>
  )
}

/* ── The stack ──────────────────────────────────────────────────────────────
   The same three drawings the hardware page uses, on their own preserve-3d
   parent rather than through ExplodedStack. Two reasons: the page underneath
   drives `#stack` and `.lyr` with GSAP by selector, so reusing those hooks
   would let two components fight over one transform; and the assembly needs
   per-layer start and end depths, which ExplodedStack has no way to express.

   `--z1` is also written as the figure's inline transform, so with the
   animation removed the stack renders closed instead of stacked at zero. */
function Stack({ z0, z1, z2, close = '0s', width, turning, className }) {
  return (
    <div className={cn('relative [perspective:1400px]', className)}>
      <div className={cn('absolute inset-0 [transform-style:preserve-3d]',
        turning && 'iv-a iv-turn')}
        style={{ transform: 'rotateX(30deg) rotateZ(-22deg)', '--d': '4s' }}>
        {[...LAYERS].reverse().map(l => (
          <figure key={l.i} className={cn('iv-lyr absolute left-1/2 top-1/2 m-0 [transform-style:preserve-3d]',
            '[&_svg]:h-auto [&_svg]:w-full [&_svg]:overflow-visible',
            '[&_svg]:drop-shadow-[0_22px_30px_rgba(23,31,60,0.16)]', width)}
            style={{
              '--z0': `${z0[l.i]}px`, '--z1': `${z1[l.i]}px`, '--z2': `${z2[l.i]}px`,
              '--t': `${[0.8, 0.1, 0.45][l.i]}s`, '--t2': close,
              transform: `translate(-50%,-50%) translateZ(${z2[l.i]}px)`,
            }}>
            {l.art}
          </figure>
        ))}
      </div>
    </div>
  )
}

/* ── Beat 2 ── the three layers fall together, then name themselves ───────── */
const PART_NOTE = {
  pod:  'The outer cover, with the charging slot cut into the wall.',
  pcb:  'The raised pod: a tray the XIAO nRF52840 Sense board drops into.',
  base: 'The sensor face, ringed by the adhesive flange that holds it on.',
}

function StagePatch() {
  return (
    <div className="grid h-full w-full items-center gap-4
      lg:grid-cols-[1.35fr_1fr] lg:gap-10">
      {/* Three depths, not two. Landing straight onto a closed stack buries the
          board under the shell's opaque pod, so the only layer with a part
          number printed on it is the one nobody ever sees. It lands at a
          readable separation, holds while the legend names the parts, and only
          then closes — which is also the state beat 3 opens in. */}
      <Stack className="h-full min-h-[180px] w-full" width="w-[min(94%,520px)]" close="3.4s"
        z0={{ 0: 340, 1: 0, 2: -340 }} z1={{ 0: 116, 1: 6, 2: -100 }} z2={{ 0: 12, 1: 0, 2: -12 }} />
      <ol className="m-0 grid list-none gap-0 p-0" aria-hidden>
        {LAYERS.map((l, i) => (
          <li key={l.part}
            className="iv-a iv-rise grid grid-cols-[2.25rem_1fr] gap-x-2 border-t border-rule py-2.5
              last:border-b sm:py-3"
            style={{ '--d': '.5s', '--t': `${2.5 + i * 0.22}s` }}>
            <span className="font-mono text-fine tabular-nums text-ink-3">
              {String(i + 1).padStart(2, '0')}</span>
            <span>
              <span className="block font-display text-ui font-medium text-ink sm:text-row">{l.title}</span>
              <span className="mt-0.5 block text-fine text-ink-2 sm:text-sec">{PART_NOTE[l.part]}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

/* ── Beat 3 ── the closed patch turns, and the four signals come off it ──── */
function StageRead() {
  return (
    <div className="grid h-full w-full grid-rows-[1.05fr_1fr] items-center gap-2
      lg:grid-cols-[1fr_1.15fr] lg:grid-rows-1 lg:gap-8">
      <Stack turning className="h-full min-h-[150px] w-full" width="w-[min(94%,480px)]"
        z0={{ 0: 12, 1: 0, 2: -12 }} z1={{ 0: 12, 1: 0, 2: -12 }} z2={{ 0: 12, 1: 0, 2: -12 }} />
      <div className="flex h-full w-full items-center">
        <svg {...svgProps} viewBox="0 0 440 200">
          {SENSOR_ORDER.map((id, i) => {
            const s = SENSORS[id], sh = SHAPE[id], y = 30 + i * 42
            /* Traces start at 152 and not at the end of the longest label:
               "Temperature" is the widest name and ran into its own green line. */
            const w = waveLine(y, sh.seed, sh.amp, sh.steps, 152, 432)
            return (
              <g key={id}>
                <circle cx="10" cy={y - 4} r="4.5" fill={s.glow} className="iv-a iv-pop"
                  style={{ '--d': '.35s', '--t': `${0.2 + i * 0.24}s` }} />
                <text x="24" y={y + 1} fontSize="15" className="font-body fill-ink-2 iv-a iv-rise"
                  style={{ '--d': '.45s', '--t': `${0.28 + i * 0.24}s` }}>{s.name}</text>
                <path d={w.d} fill="none" strokeWidth="2.25" strokeLinecap="round"
                  strokeLinejoin="round" stroke={s.glow} className="iv-a iv-draw"
                  style={{ '--len': w.len, '--d': '1.5s', '--t': `${0.4 + i * 0.24}s` }} />
              </g>
            )
          })}
          {/* The sampling rate drawn as the ticks themselves rather than asserted. */}
          {Array.from({ length: 20 }, (_, i) => (
            <line key={i} x1={152 + i * 14.7} y1="176" x2={152 + i * 14.7} y2="184" strokeWidth="1.25"
              className="stroke-ink-3 iv-a iv-rise" style={{ '--d': '.3s', '--t': `${1.9 + i * 0.04}s` }} />
          ))}
          <text x="152" y="198" fontSize="14" className="font-mono fill-ink-3 iv-a iv-rise"
            style={{ '--d': '.5s', '--t': '2.7s' }}>1 Hz</text>
        </svg>
      </div>
    </div>
  )
}

/* ── Beat 4 ── four traces into one arc, then the arc into three readers ─── */
const READERS = [
  { who: 'Student',   sees: 'The number, and the four signals under it.' },
  { who: 'Parent',    sees: 'The sentence. No raw readings, ever.' },
  { who: 'Counselor', sees: 'Only as far as a guardian agreed.' },
]

function StageScore() {
  return (
    <div className="flex h-full w-full max-w-[1000px] flex-col justify-center gap-4">
      <div className="mx-auto h-[clamp(120px,24vh,250px)] w-full max-w-[760px]">
        <svg {...svgProps} viewBox="0 0 480 168">
          {SENSOR_ORDER.map((id, i) => {
            const s = SENSORS[id], sh = SHAPE[id], y = 22 + i * 36
            const w = waveLine(y, sh.seed, 5, Math.max(5, Math.round(sh.steps / 2)), 8, 92)
            return (
              <g key={id}>
                <path d={w.d} fill="none" strokeWidth="2.25" strokeLinecap="round" stroke={s.glow}
                  className="iv-a iv-draw" style={{ '--len': w.len, '--d': '.7s', '--t': `${i * 0.1}s` }} />
                <path d={`M92 ${y} Q 128 ${y} 156 76`} fill="none" strokeWidth="1"
                  className="stroke-ink-3 iv-a iv-draw"
                  style={{ '--len': 100, '--d': '.6s', '--t': `${0.85 + i * 0.09}s` }} />
              </g>
            )
          })}
          <text x="50" y="160" textAnchor="middle" fontSize="12"
            className="font-body fill-ink-3 iv-a iv-rise" style={{ '--d': '.45s', '--t': '.4s' }}>
            four signals
          </text>

          <circle cx="156" cy="76" r="5" className="fill-accent iv-a iv-pop"
            style={{ '--d': '.35s', '--t': '1.5s' }} />
          <path d="M161 80 L242 126" fill="none" strokeWidth="1" className="stroke-ink-3 iv-a iv-draw"
            style={{ '--len': 95, '--d': '.4s', '--t': '1.65s' }} />

          <path d="M246 128 A84 84 0 0 1 414 128" fill="none" strokeWidth="9" strokeLinecap="round"
            className="stroke-rule iv-a iv-rise" style={{ '--d': '.4s', '--t': '1.8s' }} />
          <path d="M246 128 A84 84 0 0 1 365.8 52" fill="none" strokeWidth="9" strokeLinecap="round"
            className="stroke-accent iv-a iv-draw" style={{ '--len': 172, '--d': '1.1s', '--t': '1.95s' }} />
          <g className="iv-a iv-rise" style={{ '--d': '.5s', '--t': '2.75s' }}>
            <text x="330" y="116" textAnchor="middle" fontSize="46" fontWeight="500"
              className="font-display fill-ink">64</text>
            <text x="330" y="140" textAnchor="middle" fontSize="14"
              className="font-body fill-ink-2">out of 100</text>
          </g>
        </svg>
      </div>

      <p className="iv-a iv-rise mx-auto max-w-[36ch] text-center text-lead text-ink"
        style={{ '--d': '.5s', '--t': '3.1s' }}>
        &ldquo;Tense from noon, settled by six.&rdquo;
      </p>

      <div className="grid gap-2 sm:grid-cols-3 sm:gap-3" aria-hidden>
        {READERS.map((r, i) => (
          <div key={r.who} className="iv-a iv-rise flex h-full flex-col items-center"
            style={{ '--d': '.5s', '--t': `${3.4 + i * 0.16}s` }}>
            {/* A stub of rule above each card, so the three read as branches of
                the one score rather than as a row of unrelated tiles. */}
            <span className="block h-3 w-px bg-rule sm:h-4" />
            <div className="flex w-full flex-1 flex-col justify-center rounded-panel border
              border-rule bg-card px-3 py-2 text-center">
              <span className="block font-display text-ui font-medium text-ink">{r.who}</span>
              <span className="mt-0.5 block text-fine text-ink-2">{r.sees}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Beat 5 ── everything clears ─────────────────────────────────────────── */
function StageMark() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center text-center">
      <p className="iv-a iv-rise font-display text-page font-medium tracking-tight text-ink"
        style={{ '--d': '.7s', '--t': '.1s' }}>MindMap</p>
      <span className="iv-a iv-fade mt-6 block h-px w-[min(78%,360px)] bg-ink"
        style={{ '--d': '.6s', '--t': '.55s' }} />
      <p className="iv-a iv-rise mt-6 text-lead text-ink-2"
        style={{ '--d': '.6s', '--t': '.75s' }}>A patch on the arm, and one sentence a day.</p>
      <p className="iv-a iv-rise note mt-3 max-w-[42ch]"
        style={{ '--d': '.6s', '--t': '1.05s' }}>
        A working prototype built by a high-school team. Not a medical device.
      </p>
    </div>
  )
}

const STAGES = [StageDay, StagePatch, StageRead, StageScore, StageMark]

/* Keyframes live here rather than in tailwind.config.js because they describe
   this one sequence, not the design system. The reduced-motion rule at the
   bottom is the whole no-motion story: remove the animation and every mark,
   layer and label renders at its finished state. */
const CSS = `
.iv-root .iv-a{animation-duration:var(--d,1s);animation-delay:var(--t,0s);animation-fill-mode:both;animation-timing-function:cubic-bezier(.2,.7,.3,1)}
.iv-root .iv-draw{stroke-dasharray:var(--len);stroke-dashoffset:0;animation-name:iv-draw}
.iv-root .iv-rise{animation-name:iv-rise}
.iv-root .iv-pop{transform-box:fill-box;transform-origin:center;animation-name:iv-pop}
.iv-root .iv-fade{animation-name:iv-fade}
.iv-root .iv-lyr{animation-name:iv-land,iv-close;animation-duration:1.5s,.65s;animation-delay:var(--t),var(--t2);animation-fill-mode:both,forwards;animation-timing-function:cubic-bezier(.2,.7,.3,1),cubic-bezier(.55,0,.25,1)}
.iv-root .iv-turn{animation-name:iv-turn;animation-timing-function:cubic-bezier(.4,0,.2,1)}
@keyframes iv-draw{from{stroke-dashoffset:var(--len)}}
@keyframes iv-rise{from{opacity:0;transform:translateY(9px)}}
@keyframes iv-pop{from{opacity:0;transform:scale(.4)}}
@keyframes iv-fade{from{opacity:0}}
@keyframes iv-land{from{opacity:0;transform:translate(-50%,-50%) translateZ(var(--z0))}
30%{opacity:1}
to{opacity:1;transform:translate(-50%,-50%) translateZ(var(--z1))}}
@keyframes iv-close{from{transform:translate(-50%,-50%) translateZ(var(--z1))}
to{transform:translate(-50%,-50%) translateZ(var(--z2))}}
@keyframes iv-turn{0%,14%{transform:rotateX(30deg) rotateZ(-22deg)}
38%,58%{transform:rotateX(8deg) rotateZ(6deg)}
84%,100%{transform:rotateX(52deg) rotateZ(-36deg)}}
@media (prefers-reduced-motion:reduce){.iv-root .iv-a,.iv-root .iv-lyr,.iv-root .iv-turn{animation:none}}
`

export function Intro({ onDone }) {
  const reduced = useReducedMotion()
  const [beat, setBeat] = React.useState(reduced ? BEATS.length - 1 : 0)
  const [exiting, setExiting] = React.useState(false)
  const rootRef = React.useRef(null)
  const skipRef = React.useRef(null)
  const fills = React.useRef([])
  const beatRef = React.useRef(0)
  const doneRef = React.useRef(false)
  const timerRef = React.useRef(0)

  /* onDone is a one-way door: the caller writes "seen" somewhere and unmounts
     this tree. Firing it twice — skip landing on the same frame the timeline
     ends, or a queued exit timer resolving after an unmount — would run that
     side effect twice, so the latch is a ref and not state. */
  const finish = React.useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    onDone?.()
  }, [onDone])

  const leave = React.useCallback(ms => {
    if (doneRef.current || timerRef.current) return
    setExiting(true)
    timerRef.current = setTimeout(finish, ms)
  }, [finish])

  /* One clock for the whole sequence. Beat boundaries are derived from elapsed
     time rather than accumulated by a chain of timeouts, so a dropped frame or
     a backgrounded tab cannot leave the headline and the progress bar
     disagreeing about which beat is playing. */
  React.useEffect(() => {
    if (reduced) return
    let raf = 0, t0 = 0
    const tick = t => {
      if (!t0) t0 = t
      const e = t - t0
      let acc = 0, i = 0
      while (i < BEATS.length - 1 && e >= acc + BEATS[i].ms) { acc += BEATS[i].ms; i++ }
      const p = Math.min(1, (e - acc) / BEATS[i].ms)
      /* Written straight to the DOM: this runs 60x a second and re-rendering
         five segments that often is real work for a decorative bar. */
      fills.current.forEach((el, k) => {
        if (el) el.style.transform = `scaleX(${k < i ? 1 : k === i ? p : 0})`
      })
      if (i !== beatRef.current) { beatRef.current = i; setBeat(i) }
      if (e >= TOTAL) { leave(EXIT_MS); return }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced, leave])

  /* No motion at all: the wordmark is already on screen, so the only thing
     left is to get out of the way. */
  React.useEffect(() => {
    if (!reduced) return
    const id = setTimeout(finish, STILL_MS)
    return () => clearTimeout(id)
  }, [reduced, finish])

  React.useEffect(() => () => clearTimeout(timerRef.current), [])

  /* Scroll lock, and the rest of the document taken out of the accessibility
     tree. The siblings are walked from this node up rather than from a known
     container because the caller decides where this mounts, and their previous
     aria-hidden values are restored rather than removed — something else on the
     page may have set one for its own reasons. */
  React.useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const touched = []
    for (let el = rootRef.current; el && el !== document.body; el = el.parentElement) {
      for (const sib of Array.from(el.parentElement?.children || [])) {
        if (sib === el || sib.tagName === 'SCRIPT' || sib.tagName === 'STYLE') continue
        touched.push([sib, sib.getAttribute('aria-hidden')])
        sib.setAttribute('aria-hidden', 'true')
      }
    }
    rootRef.current?.focus({ preventScroll: true })
    return () => {
      document.body.style.overflow = prev
      touched.forEach(([el, was]) =>
        was === null ? el.removeAttribute('aria-hidden') : el.setAttribute('aria-hidden', was))
    }
  }, [])

  /* Skip is the only control in here, so the trap is one line: Tab goes back to
     it rather than escaping into the page that is currently aria-hidden. */
  const onKey = e => {
    if (e.key === 'Escape') { e.preventDefault(); leave(SKIP_MS) }
    else if (e.key === 'Tab') { e.preventDefault(); skipRef.current?.focus() }
  }

  const Stage = STAGES[beat]
  const b = BEATS[beat]

  return (
    <div ref={rootRef} tabIndex={-1} onKeyDown={onKey}
      role="dialog" aria-modal="true" aria-label="Introduction to MindMap"
      className={cn('iv-root fixed inset-0 z-[400] flex flex-col overflow-hidden bg-paper outline-none',
        'transition-opacity duration-[480ms] ease-out', exiting ? 'opacity-0' : 'opacity-100')}>
      <style>{CSS}</style>

      {/* The announcement is its own node so the visible headline can be styled
          and swapped freely without a screen reader hearing it twice. */}
      <p aria-live="polite" aria-atomic="true" className="sr-only">{b.head + '. ' + b.sub}</p>

      {/* Reversed so Skip is the first thing in the DOM — and so the first tab
          stop — while still sitting at the right-hand end of the bar. */}
      <div className="mx-auto flex w-full max-w-[1180px] flex-row-reverse items-center
        justify-between gap-4 px-5 py-4 sm:px-10">
        <Button ref={skipRef} variant="outline" size="sm" onClick={() => leave(SKIP_MS)}>Skip</Button>
        {!reduced && (
          <div className="flex items-center gap-3" role="progressbar" aria-label="Introduction progress"
            aria-valuemin={1} aria-valuemax={BEATS.length} aria-valuenow={beat + 1}>
            <span aria-hidden className="flex gap-1.5">
              {BEATS.map((_, i) => (
                <span key={i} className="block h-[3px] w-7 overflow-hidden rounded-bar bg-rule/70 sm:w-11">
                  <span ref={el => { fills.current[i] = el }}
                    className="block h-full w-full origin-left rounded-bar bg-accent"
                    style={{ transform: 'scaleX(0)' }} />
                </span>
              ))}
            </span>
            <span aria-hidden className="font-mono text-fine tabular-nums text-ink-3">
              {String(beat + 1).padStart(2, '0')} / {String(BEATS.length).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      <main className="mx-auto flex min-h-0 w-full max-w-[1180px] flex-1 flex-col justify-center px-5 pb-8
        sm:px-10 sm:pb-10">
        {/* The headline block holds its height across beats. Letting it size to
            its own text moved the drawing up and down under it on every change,
            which reads as the page reloading rather than as one sequence. */}
        <div aria-hidden key={'h' + beat}
          className={cn('w-full shrink-0',
            beat < BEATS.length - 1 && 'min-h-[8.5rem] sm:min-h-[9.5rem]')}>
          {beat < BEATS.length - 1 && (
            <>
              <p className="iv-a iv-rise font-display text-sub font-medium text-ink"
                style={{ '--d': '.6s' }}>{b.head}</p>
              <p className="iv-a iv-rise mt-2.5 max-w-[58ch] text-sec text-ink-2 sm:mt-3 sm:text-body"
                style={{ '--d': '.6s', '--t': '.18s' }}>{b.sub}</p>
            </>
          )}
        </div>
        <div className="flex min-h-0 w-full flex-1 items-center justify-center [max-height:600px]">
          <Stage key={beat} />
        </div>
      </main>
    </div>
  )
}
