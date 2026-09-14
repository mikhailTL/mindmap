import React from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '../lib/utils'
import { Button } from '../ui/button'
import { Logo, LogoMark } from '../ui/logo'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { LAYERS } from './Patch'

/* The title sequence.
 *
 * Four things decide the shape of this file.
 *
 * 1. It is a title card, not a page. The rest of the site is paper; this is an
 *    ink field with the logo mark as its recurring device — the mark opens it,
 *    the mark rides the wipe between every beat, and the last beat resolves a
 *    day of readings back into the mark's own two-peak stroke. The contrast
 *    against the site proper is the point: when it clears, you know the film
 *    ended and the product began.
 *
 * 2. Colour cannot live on the ink field. Three of the four signal colours
 *    clear 3:1 on #171f3c but Movement #1560e0 measures 2.91, and the four are
 *    a set — splitting them across two contrast stories is worse than moving
 *    all four. So anything carrying signal colour sits on a card plate, which
 *    is also what those screens are in the app. Ink field, light plates.
 *
 * 3. Every drawing's RESTING state is the finished picture; motion is only ever
 *    layered on top. Killing the animation reveals a complete diagram rather
 *    than an empty frame, which is what makes reduced motion and an interrupted
 *    beat behave without a second set of artwork.
 *
 * 4. One requestAnimationFrame loop owns the whole timeline. A chain of
 *    setTimeouts was five things to cancel, a beat index that could disagree
 *    with the progress rail, and no way to know where in a beat an unmount
 *    happened. One clock, one cancel.
 *
 * Playback: this runs on every load. The only thing that stops it is the
 * visitor pressing Skip, which writes one key and is permanent. Sitting
 * through it does not count as consent to never see it again — a person who
 * watched it once and did not object may well want it again, and a person who
 * did object had a button at the bottom of the screen the whole time.
 */

/* Written and read here rather than through survey/store.js, whose seenIntro
   flag means "has watched", not "has refused". Two different questions, and
   one of them must not be set by simply reaching the end. */
const OFF_KEY = 'mindmap.intro.off'

/** True when the visitor has pressed Skip at some point, in which case the
 *  sequence must never mount again. Safe in private mode / blocked storage:
 *  a throwing localStorage reads as "not suppressed", so the worst failure is
 *  that the intro plays. */
export function introSuppressed() {
  try { return window.localStorage.getItem(OFF_KEY) === '1' } catch { return false }
}

/** Suppress the sequence permanently. Called by Skip and by Esc; exported so a
 *  settings control elsewhere could set the same flag. */
export function suppressIntro() {
  try { window.localStorage.setItem(OFF_KEY, '1') } catch {}
}

/* Every line is a statement of fact that stands on its own. Beat one names the
   product and where it goes, because someone who watches four seconds and
   leaves must still be able to answer "what is this". Nothing here is a setup
   for a later line, and no number appears that the prototype does not produce. */
const BEATS = [
  { ms: 3600,
    head: 'MindMap is a patch you wear on your forearm.',
    sub:  'It is about the size of a large sticker, and it stays on through the day.' },
  { ms: 4000,
    head: 'Inside are three printed parts and one circuit board.',
    sub:  'A XIAO nRF52840 Sense board sits in a printed tray, between the outer shell and the skin-side face.' },
  { ms: 3800,
    head: 'It measures four body signals, once every second.',
    sub:  'Heart rate, sweat, skin temperature and movement — read off the arm, not typed into an app.' },
  { ms: 4000,
    head: 'The app turns a whole day of readings into one score out of 100.',
    sub:  'Under the score it writes one sentence, in plain words.' },
  { ms: 3600,
    head: 'Three people see three different things.',
    sub:  'A parent decides how much a school counselor is allowed to see.' },
  { ms: 4600,
    head: 'MindMap',
    sub:  'A patch on the arm. One score and one sentence a day.' },
]
const LAST = BEATS.length - 1
const TOTAL = BEATS.reduce((a, b) => a + b.ms, 0)
const EXIT_MS = 480          // must match the opacity transition on the overlay
const SKIP_MS = 180          // a skip is an interruption, so it clears faster
const STILL_MS = 900         // reduced motion: hold the finished mark, then leave
const OUT_MS = 500           // how long before a beat ends its stage starts leaving

const svgProps = {
  preserveAspectRatio: 'xMidYMid meet',
  className: 'h-full w-full',
  'aria-hidden': true,
  focusable: 'false',
}

/* The mark's dot is `var(--logo-peak, currentColor)`, and the accent it
   defaults to measures 2.24 on ink. Beam is 5.30, so on every ink field in
   this file the peak is beam and the rest of the mark is whatever it sits on. */
const PEAK = { '--logo-peak': '#7091e6' }

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

/* A figure that counts up, written straight to the node. As React state this
   re-rendered the whole stage sixty times a second to change two glyphs. */
function Count({ to, ms = 1400, delay = 0, ...p }) {
  const ref = React.useRef(null)
  React.useEffect(() => {
    let raf = 0, t0 = 0
    const tick = t => {
      if (!t0) t0 = t
      const e = t - t0 - delay
      const q = e <= 0 ? 0 : Math.min(1, e / ms)
      if (ref.current) ref.current.textContent = String(Math.round(to * (1 - (1 - q) ** 3)))
      if (q < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to, ms, delay])
  return <text ref={ref} {...p}>0</text>
}

/* A light plate on the ink field: every screen the app would show, and the only
   surface in this sequence allowed to carry signal colour. */
function Plate({ className, delay = '0s', children }) {
  return (
    <div className={cn('iv-a iv-rise rounded-panel border border-rule bg-card', className)}
      style={{ '--d': '.55s', '--t': delay }}>{children}</div>
  )
}

/* ── Beat 1 ── the product, named and placed ───────────────────────────────
   The forearm draws, the mark lands on it as the patch, and then a short
   highlight runs the ridge forever — the mark's own stroke already being a day
   of readings, which is the trick the last beat spends itself on. */
function StageWear() {
  return (
    <div className="mx-auto flex h-full w-full max-w-[860px] items-center">
      <svg {...svgProps} viewBox="0 0 480 250">
        {/* forearm: elbow off-frame at the left, wrist and heel of the hand at
            the right. Two long strokes and a cap — enough to place the patch,
            not enough to become an illustration of a person. */}
        <path d="M4 70 C 120 56, 300 52, 398 62" fill="none" strokeWidth="2"
          className="stroke-rule iv-a iv-draw" style={{ '--len': 400, '--d': '.9s', '--t': '.05s' }} />
        <path d="M4 186 C 120 200, 300 198, 398 186" fill="none" strokeWidth="2"
          className="stroke-rule iv-a iv-draw" style={{ '--len': 400, '--d': '.9s', '--t': '.12s' }} />
        <path d="M398 62 C 430 84, 430 164, 398 186" fill="none" strokeWidth="2"
          className="stroke-rule iv-a iv-draw" style={{ '--len': 150, '--d': '.5s', '--t': '.75s' }} />

        {/* the mark, at patch size, sitting on the arm. 40 x 28 logo units at
            scale 4.4 → 176 x 123, centred on (240,124). */}
        <g transform="translate(152,62) scale(4.4)">
          <rect x="2" y="4" width="36" height="20" rx="10" fill="#171f3c" stroke="#ede8f5"
            strokeWidth="0.52" className="iv-a iv-draw" style={{ '--len': 96, '--d': '1s', '--t': '.7s' }} />
          <path d="M10.5 18.2 15 10.2 20 15.8 25.4 11 29.5 17.6" fill="none" stroke="#ede8f5"
            strokeWidth="0.55" strokeLinecap="round" strokeLinejoin="round"
            className="iv-a iv-draw" style={{ '--len': 33, '--d': '.9s', '--t': '1.35s' }} />
          {/* the same path again, carrying one short travelling dash: the line
              is live, and nothing in this frame is ever still */}
          <path d="M10.5 18.2 15 10.2 20 15.8 25.4 11 29.5 17.6" fill="none" stroke="#7091e6"
            strokeWidth="0.85" strokeLinecap="round" strokeLinejoin="round"
            className="iv-a iv-fade iv-flow"
            style={{ '--len': 33, '--seg': '3', '--gapl': '31', '--d': '2.2s', '--t': '2.2s' }} />
          <circle cx="29.5" cy="17.6" r="2.4" fill="#7091e6" className="iv-a iv-pop"
            style={{ '--d': '.4s', '--t': '2.15s' }} />
        </g>

        {/* leader and label, so "forearm" is drawn and not only spoken */}
        <path d="M240 196 V 222 H 288" fill="none" strokeWidth="1.25"
          className="stroke-ruling iv-a iv-draw" style={{ '--len': 76, '--d': '.5s', '--t': '2.4s' }} />
        <text x="296" y="227" fontSize="17" className="font-mono fill-rule iv-a iv-rise"
          style={{ '--d': '.5s', '--t': '2.6s' }}>forearm</text>
        <text x="184" y="35" fontSize="17" className="font-mono fill-rule iv-a iv-rise"
          style={{ '--d': '.5s', '--t': '1.15s' }}>the patch</text>
        <path d="M240 40 V 60" fill="none" strokeWidth="1.25"
          className="stroke-ruling iv-a iv-draw" style={{ '--len': 22, '--d': '.35s', '--t': '1.1s' }} />
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

   `--z2` is also written as the figure's inline transform, so with the
   animation removed the stack renders closed instead of stacked at zero. */
function Stack({ z0, z1, z2, close, width, className }) {
  return (
    <div className={cn('relative [perspective:1400px]', className)}>
      <div className="iv-sway absolute inset-0 [transform-style:preserve-3d]"
        style={{ transform: 'rotateX(30deg) rotateZ(-22deg)', '--t': `${parseFloat(close) + 0.5}s` }}>
        {[...LAYERS].reverse().map(l => (
          <figure key={l.i} className={cn('iv-lyr absolute left-1/2 top-1/2 m-0 [transform-style:preserve-3d]',
            '[&_svg]:h-auto [&_svg]:w-full [&_svg]:overflow-visible',
            '[&_svg]:drop-shadow-[0_16px_16px_rgba(0,0,0,0.5)]', width)}
            style={{
              '--z0': `${z0[l.i]}px`, '--z1': `${z1[l.i]}px`, '--z2': `${z2[l.i]}px`,
              '--t': `${[0.75, 0.1, 0.42][l.i]}s`, '--t2': close,
              transform: `translate(-50%,-50%) translateZ(${z2[l.i]}px)`,
            }}>
            {l.art}
          </figure>
        ))}
      </div>
    </div>
  )
}

/* ── Beat 2 ── the three parts fall together, name themselves, then close ─── */
const PART_NOTE = {
  pod:  'The outer cover. The slot in its wall is the charging port.',
  pcb:  'A printed tray. The XIAO nRF52840 Sense board drops into it.',
  base: 'The face that touches the skin, ringed by the adhesive flange.',
}

function StageStack() {
  return (
    <div className="grid h-full w-full grid-rows-[minmax(0,1fr)_auto] items-center gap-3
      lg:grid-cols-[1.3fr_1fr] lg:grid-rows-1 lg:gap-10">
      {/* Three depths, not two. Landing straight onto a closed stack buries the
          board under the shell's opaque pod, so the only layer with a part
          number printed on it is the one nobody ever sees. It lands at a
          readable separation, holds while the legend names the parts, and only
          then closes — and then never stops moving, because a still frame in
          the middle of a title sequence reads as a stall. */}
      <Stack className="h-full min-h-[190px] w-full overflow-hidden"
        width="w-[min(72%,230px)] sm:w-[min(90%,420px)] lg:w-[min(94%,500px)]" close="2.9s"
        z0={{ 0: 340, 1: 0, 2: -340 }} z1={{ 0: 116, 1: 6, 2: -100 }} z2={{ 0: 12, 1: 0, 2: -12 }} />
      <ol className="m-0 grid list-none gap-0 p-0" aria-hidden>
        {LAYERS.map((l, i) => (
          <li key={l.part}
            className="iv-a iv-rise grid grid-cols-[2.25rem_1fr] gap-x-2 border-t border-paper/25 py-1.5
              last:border-b sm:py-2.5"
            style={{ '--d': '.5s', '--t': `${1.95 + i * 0.2}s` }}>
            <span className="font-mono text-fine tabular-nums text-beam">
              {String(i + 1).padStart(2, '0')}</span>
            <span>
              <span className="block font-display text-ui font-medium text-paper">{l.title}</span>
              <span className="mt-0.5 hidden text-fine text-mist sm:block">{PART_NOTE[l.part]}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

/* ── Beat 3 ── four signals, four colours, one second apart ───────────────── */
function StageSignals() {
  return (
    <div className="mx-auto flex h-full w-full max-w-[880px] items-center">
      <Plate className="w-full px-3 py-3 sm:px-6 sm:py-5">
        <div className="mx-auto aspect-[460/212] max-h-full w-full max-w-[760px]">
          <svg {...svgProps} viewBox="0 0 460 212">
            {SENSOR_ORDER.map((id, i) => {
              const s = SENSORS[id], sh = SHAPE[id], y = 28 + i * 40
              /* Traces start at 168 and not at the end of the longest label:
                 "Temperature" is the widest name and ran into its own line. */
              const w = waveLine(y, sh.seed, sh.amp, sh.steps, 168, 446)
              return (
                <g key={id}>
                  <circle cx="12" cy={y - 5} r="5" fill={s.glow} className="iv-a iv-pop"
                    style={{ '--d': '.35s', '--t': `${0.15 + i * 0.2}s` }} />
                  <text x="28" y={y} fontSize="17" className="font-body fill-ink-2 iv-a iv-rise"
                    style={{ '--d': '.45s', '--t': `${0.22 + i * 0.2}s` }}>{s.name}</text>
                  <path d={w.d} fill="none" strokeWidth="2.4" strokeLinecap="round"
                    strokeLinejoin="round" stroke={s.glow} className="iv-a iv-draw"
                    style={{ '--len': w.len, '--d': '1.3s', '--t': `${0.35 + i * 0.2}s` }} />
                </g>
              )
            })}
            {/* the sampling rate drawn as the ticks themselves rather than asserted */}
            {Array.from({ length: 20 }, (_, i) => (
              <line key={i} x1={168 + i * 14.6} y1="180" x2={168 + i * 14.6} y2="189" strokeWidth="1.3"
                className="stroke-ruling iv-a iv-rise" style={{ '--d': '.3s', '--t': `${1.5 + i * 0.035}s` }} />
            ))}
            <text x="168" y="206" fontSize="15" className="font-mono fill-ink-2 iv-a iv-rise"
              style={{ '--d': '.5s', '--t': '2.25s' }}>one reading per second</text>
            {/* the playhead: the recording is still running while you read it */}
            <line x1="0" y1="8" x2="0" y2="192" strokeWidth="1.5" className="stroke-accent/45 iv-scan"
              style={{ '--t': '1.1s' }} />
          </svg>
        </div>
      </Plate>
    </div>
  )
}

/* ── Beat 4 ── a day of four signals collapses to one figure and one line ─── */
function StageScore() {
  return (
    <div className="mx-auto flex h-full w-full max-w-[760px] items-center">
      <Plate className="w-full px-3 py-3 sm:px-6 sm:py-5">
        <div className="mx-auto aspect-[460/210] max-h-full w-full max-w-[700px]">
          <svg {...svgProps} viewBox="0 0 460 210">
            {SENSOR_ORDER.map((id, i) => {
              const s = SENSORS[id], sh = SHAPE[id], y = 26 + i * 34
              const w = waveLine(y, sh.seed, 5, Math.max(5, Math.round(sh.steps / 2)), 10, 96)
              return (
                <g key={id}>
                  <path d={w.d} fill="none" strokeWidth="2.4" strokeLinecap="round" stroke={s.glow}
                    className="iv-a iv-draw" style={{ '--len': w.len, '--d': '.55s', '--t': `${i * 0.09}s` }} />
                  <path d={`M96 ${y} Q 130 ${y} 152 78`} fill="none" strokeWidth="1.2"
                    className="stroke-ruling iv-a iv-draw"
                    style={{ '--len': 100, '--d': '.5s', '--t': `${0.6 + i * 0.08}s` }} />
                </g>
              )
            })}
            <text x="53" y="152" textAnchor="middle" fontSize="14"
              className="font-body fill-ink-2 iv-a iv-rise" style={{ '--d': '.45s', '--t': '.35s' }}>
              a whole day
            </text>

            <circle cx="152" cy="78" r="5.5" className="fill-accent iv-a iv-pop"
              style={{ '--d': '.35s', '--t': '1.1s' }} />
            <path d="M157 82 L232 122" fill="none" strokeWidth="1.2" className="stroke-ruling iv-a iv-draw"
              style={{ '--len': 90, '--d': '.4s', '--t': '1.25s' }} />

            <path d="M238 126 A82 82 0 0 1 402 126" fill="none" strokeWidth="10" strokeLinecap="round"
              className="stroke-mist iv-a iv-rise" style={{ '--d': '.4s', '--t': '1.4s' }} />
            <path d="M238 126 A82 82 0 0 1 355 51.8" fill="none" strokeWidth="10" strokeLinecap="round"
              className="stroke-accent iv-a iv-draw" style={{ '--len': 168, '--d': '1.1s', '--t': '1.5s' }} />
            <circle cx="355" cy="51.8" r="6.5" className="fill-accent iv-a iv-pop iv-blink"
              style={{ '--d': '.3s', '--t': '2.6s' }} />
            <g className="iv-a iv-fade" style={{ '--d': '.4s', '--t': '1.5s' }}>
              <Count to={64} ms={1200} delay={120} x="320" y="116" textAnchor="middle" fontSize="50"
                fontWeight="500" className="font-display fill-ink" />
              <text x="320" y="142" textAnchor="middle" fontSize="15"
                className="font-body fill-ink-2">out of 100</text>
            </g>

            <line x1="24" y1="170" x2="436" y2="170" strokeWidth="1"
              className="stroke-rule iv-a iv-draw" style={{ '--len': 414, '--d': '.5s', '--t': '2.5s' }} />
            <text x="230" y="198" textAnchor="middle" fontSize="20"
              className="font-body fill-ink iv-a iv-rise" style={{ '--d': '.55s', '--t': '2.75s' }}>
              &ldquo;Tense from noon, settled by six.&rdquo;
            </text>
          </svg>
        </div>
      </Plate>
    </div>
  )
}

/* ── Beat 5 ── one score, three readers, three different views ───────────── */
const READERS = [
  { who: 'The student', sees: 'The score, the sentence, and all four signals.' },
  { who: 'A parent',    sees: 'The score and the sentence. Never the raw readings.' },
  { who: 'A counselor', sees: 'Only what a parent has allowed.' },
]

function StageWho() {
  return (
    <div className="mx-auto flex h-full w-full max-w-[900px] flex-col justify-center">
      <div className="iv-a iv-pop mx-auto flex items-baseline gap-2 rounded-panel border border-rule
        bg-card px-4 py-1.5" style={{ '--d': '.45s' }}>
        <span className="font-display text-num font-medium text-ink">64</span>
        <span className="text-fine text-ink-2">out of 100</span>
      </div>

      {/* The branch, drawn rather than implied: one trunk, three limbs. Below
          sm the panels stack, so three limbs would point at nothing and the
          trunk alone is the honest drawing. */}
      <span className="iv-a iv-fade mx-auto my-2.5 block h-5 w-px bg-rule sm:hidden"
        style={{ '--d': '.4s', '--t': '.35s' }}/>
      <div className="mx-auto hidden h-[58px] w-full max-w-[760px] sm:block">
        <svg {...svgProps} viewBox="0 0 760 58">
          <path d="M380 0 V 22" fill="none" strokeWidth="1.5" className="stroke-rule iv-a iv-draw"
            style={{ '--len': 24, '--d': '.3s', '--t': '.35s' }} />
          <path d="M126 22 H 634" fill="none" strokeWidth="1.5" className="stroke-rule iv-a iv-draw"
            style={{ '--len': 510, '--d': '.5s', '--t': '.6s' }} />
          {[126, 380, 634].map((x, i) => (
            <path key={x} d={`M${x} 22 V 56`} fill="none" strokeWidth="1.5"
              className="stroke-rule iv-a iv-draw"
              style={{ '--len': 36, '--d': '.3s', '--t': `${1.0 + i * 0.12}s` }} />
          ))}
        </svg>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-3 sm:gap-4" aria-hidden>
        {READERS.map((r, i) => (
          <div key={r.who} className="iv-a iv-rise flex flex-col rounded-panel border border-rule
            bg-card px-3.5 py-3" style={{ '--d': '.5s', '--t': `${1.2 + i * 0.16}s` }}>
            <span className="flex items-center gap-2">
              <span className="block h-2 w-2 rounded-chip bg-accent iv-blink"
                style={{ '--t': `${1.7 + i * 0.35}s` }} />
              <span className="font-display text-ui font-medium text-ink">{r.who}</span>
            </span>
            <span className="mt-1 block text-fine text-ink-2">{r.sees}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Beat 6 ── the day of readings folds back into the mark ────────────────
   The ridge in the logo is five points across a day. So beat six draws exactly
   that path at chart scale with hours under it, then collapses it — one
   element, one transform, its stroke-width animated alongside so the line
   thins as it shrinks instead of turning into a slab — into the stadium that
   draws around it. Geometry, not a cross-fade: it is the same path throughout.

   Big:   translate(-138.5,-132.8) scale(18.9)  → ridge spans x 60…419, y 60…211
   Small: translate(136,125.2)     scale(5.2)   → the mark, sitting on the
   baseline the chart's own last reading was on, so it lands where the line
   already was rather than jumping to the middle of an empty box. */
const RIDGE = 'M10.5 18.2 15 10.2 20 15.8 25.4 11 29.5 17.6'
const HOURS = [['8a', 60], ['11a', 145], ['2p', 239.5], ['5p', 341.6], ['8p', 419.1]]

function StageMark({ still }) {
  const a = still ? undefined : 'iv-a'
  return (
    <div className="mx-auto flex h-full w-full max-w-[820px] flex-col items-center justify-center">
      <div className="mx-auto aspect-[16/9] w-[min(100%,500px)]">
        <svg {...svgProps} viewBox="0 0 480 270">
          {/* the chart furniture, present only while the line is a day */}
          {!still && (
            <g className="iv-a iv-fade-out" style={{ '--d': '.4s', '--t': '1.55s' }}>
              {/* --t is restated at every level: the group carries its own
                  1.55s fade delay and CSS custom properties inherit, so a child
                  that omits it silently adopts its parent's cue. */}
              <line x1="40" y1="226" x2="440" y2="226" strokeWidth="1.25"
                className="stroke-ruling iv-a iv-draw" style={{ '--len': 402, '--d': '.5s', '--t': '0s' }} />
              {HOURS.map(([h, x], i) => (
                <g key={h} className="iv-a iv-rise" style={{ '--d': '.4s', '--t': `${0.25 + i * 0.07}s` }}>
                  <line x1={x} y1="226" x2={x} y2="234" strokeWidth="1.25" className="stroke-ruling" />
                  <text x={x} y="252" textAnchor="middle" fontSize="16"
                    className="font-mono fill-rule">{h}</text>
                </g>
              ))}
              <circle cx="419.1" cy="199.8" r="6.5" fill="#7091e6" className="iv-a iv-pop"
                style={{ '--d': '.35s', '--t': '1.15s' }} />
            </g>
          )}

          <g className={cn(a, !still && 'iv-morph')} style={still
            ? { transform: 'translate(136px,125.2px) scale(5.2)', transformBox: 'view-box',
                transformOrigin: '0 0', strokeWidth: 0.5 }
            : { '--d': '1s', '--t': '1.55s', transformBox: 'view-box', transformOrigin: '0 0' }}>
            <rect x="2" y="4" width="36" height="20" rx="10" fill="none" stroke="#ede8f5"
              className={cn(a, !still && 'iv-draw')}
              style={still ? undefined : { '--len': 96, '--d': '.8s', '--t': '2.3s' }} />
            <path d={RIDGE} fill="none" stroke="#7091e6" strokeLinecap="round" strokeLinejoin="round"
              className={cn(a, !still && 'iv-draw')}
              style={still ? undefined : { '--len': 33, '--d': '1.3s', '--t': '.15s' }} />
            <circle cx="29.5" cy="17.6" r="2.4" fill="#7091e6" strokeWidth="0"
              className={cn(a, !still && 'iv-pop')}
              style={still ? undefined : { '--d': '.4s', '--t': '3s' }} />
          </g>
        </svg>
      </div>

      <p className={cn(a, !still && 'iv-rise', 'mt-2 font-display text-view font-medium tracking-tight text-paper')}
        style={still ? undefined : { '--d': '.6s', '--t': '3.15s' }}>
        Mind<span className="text-beam">Map</span>
      </p>
      <p className={cn(a, !still && 'iv-rise', 'mt-3 text-center text-lead text-mist')}
        style={still ? undefined : { '--d': '.6s', '--t': '3.4s' }}>
        A patch on the arm. One score and one sentence a day.
      </p>
      <p className={cn(a, !still && 'iv-rise', 'mt-3 max-w-[46ch] text-center text-note text-rule')}
        style={still ? undefined : { '--d': '.6s', '--t': '3.6s' }}>
        A working prototype built by a high-school team. Not a medical device.
      </p>
    </div>
  )
}

const STAGES = [StageWear, StageStack, StageSignals, StageScore, StageWho, StageMark]

/* One motion vocabulary, declared once. Keyframes live here rather than in
   tailwind.config.js because they describe this one sequence, not the design
   system. The reduced-motion rule at the bottom is the whole no-motion story:
   remove the animation and every mark, layer and label renders finished. */
const CSS = `
.iv-root .iv-a{animation-duration:var(--d,1s);animation-delay:var(--t,0s);animation-fill-mode:both;animation-timing-function:cubic-bezier(.2,.7,.3,1)}
.iv-root .iv-draw{stroke-dasharray:var(--len);stroke-dashoffset:0;animation-name:iv-draw}
.iv-root .iv-rise{animation-name:iv-rise}
.iv-root .iv-pop{transform-box:fill-box;transform-origin:center;animation-name:iv-pop}
.iv-root .iv-fade{animation-name:iv-fade}
.iv-root .iv-fade-out{animation-name:iv-fade-out}
.iv-root .iv-flow{stroke-dasharray:var(--seg) var(--gapl);animation-name:iv-fade,iv-flow;animation-duration:.4s,var(--d);animation-delay:var(--t),var(--t);animation-iteration-count:1,infinite;animation-timing-function:linear,linear;animation-fill-mode:both,both}
.iv-root .iv-scan{animation:iv-scan 2.8s cubic-bezier(.45,0,.55,1) var(--t,0s) infinite both}
.iv-root .iv-blink{animation:iv-blink 2.2s cubic-bezier(.4,0,.6,1) var(--t,0s) infinite both}
.iv-root .iv-sway{animation:iv-sway 8s cubic-bezier(.45,0,.55,1) var(--t,0s) infinite both}
.iv-root .iv-morph{animation-name:iv-morph;animation-timing-function:cubic-bezier(.55,0,.25,1)}
.iv-root .iv-lyr{animation-name:iv-land,iv-close;animation-duration:1.4s,.6s;animation-delay:var(--t),var(--t2);animation-fill-mode:both,forwards;animation-timing-function:cubic-bezier(.2,.7,.3,1),cubic-bezier(.55,0,.25,1)}
.iv-root .iv-stage{animation:iv-stage .55s cubic-bezier(.2,.7,.3,1) both}
.iv-root .iv-out{animation:iv-out ${OUT_MS}ms cubic-bezier(.55,0,.25,1) both}
.iv-root .iv-wipe{animation:iv-wipe .9s cubic-bezier(.55,0,.25,1) both}
.iv-root .iv-wipemark{animation:iv-wipemark .9s cubic-bezier(.2,.7,.3,1) both}
@keyframes iv-draw{from{stroke-dashoffset:var(--len)}}
@keyframes iv-rise{from{opacity:0;transform:translateY(10px)}}
@keyframes iv-pop{from{opacity:0;transform:scale(.35)}}
@keyframes iv-fade{from{opacity:0}}
@keyframes iv-fade-out{from{opacity:1}to{opacity:0}}
@keyframes iv-flow{from{stroke-dashoffset:0}to{stroke-dashoffset:-34}}
@keyframes iv-scan{0%{transform:translateX(170px);opacity:0}8%{opacity:1}92%{opacity:1}100%{transform:translateX(446px);opacity:0}}
@keyframes iv-blink{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes iv-sway{0%,100%{transform:rotateX(30deg) rotateZ(-22deg)}50%{transform:rotateX(20deg) rotateZ(-8deg)}}
@keyframes iv-land{from{opacity:0;transform:translate(-50%,-50%) translateZ(var(--z0))}
30%{opacity:1}
to{opacity:1;transform:translate(-50%,-50%) translateZ(var(--z1))}}
@keyframes iv-close{from{transform:translate(-50%,-50%) translateZ(var(--z1))}
to{transform:translate(-50%,-50%) translateZ(var(--z2))}}
@keyframes iv-morph{from{transform:translate(-138.5px,-132.8px) scale(18.9);stroke-width:.18px}
to{transform:translate(136px,125.2px) scale(5.2);stroke-width:.5px}}
@keyframes iv-stage{from{opacity:0;transform:translateY(16px)}}
@keyframes iv-out{to{opacity:0;transform:translateY(-14px)}}
@keyframes iv-wipe{0%{transform:translateX(-152%)}
38%,64%{transform:translateX(-33%)}
100%{transform:translateX(102%)}}
@keyframes iv-wipemark{0%,34%{opacity:0;transform:translateX(-5%) scale(.82)}
46%,60%{opacity:1;transform:translateX(0) scale(1)}
72%,100%{opacity:0;transform:translateX(5%) scale(1.1)}}
@media (prefers-reduced-motion:reduce){.iv-root [class*="iv-"]{animation:none !important}}
`

export function Intro({ onDone }) {
  const reduced = useReducedMotion()
  const [beat, setBeat] = React.useState(reduced ? LAST : 0)
  const [leaving, setLeaving] = React.useState(false)
  const [exiting, setExiting] = React.useState(false)
  const rootRef = React.useRef(null)
  const skipRef = React.useRef(null)
  const fills = React.useRef([])
  const beatRef = React.useRef(0)
  const leaveRef = React.useRef(false)
  const doneRef = React.useRef(false)
  const timerRef = React.useRef(0)

  /* onDone is a one-way door: the caller unmounts this tree on it. Firing it
     twice — skip landing on the same frame the timeline ends, or a queued exit
     timer resolving after an unmount — would run that side effect twice, so
     the latch is a ref and not state. */
  const finish = React.useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    onDone?.()
  }, [onDone])

  const close = React.useCallback(ms => {
    if (doneRef.current || timerRef.current) return
    setExiting(true)
    timerRef.current = setTimeout(finish, ms)
  }, [finish])

  /* The only thing that suppresses the sequence. Watching it to the end does
     not, which is why this lives on the control and not in `finish`. */
  const skip = React.useCallback(() => {
    suppressIntro()
    close(SKIP_MS)
  }, [close])

  /* One clock for the whole sequence. Beat boundaries are derived from elapsed
     time rather than accumulated by a chain of timeouts, so a dropped frame or
     a backgrounded tab cannot leave the headline and the progress rail
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
         six segments that often is real work for a decorative rail. */
      fills.current.forEach((el, k) => {
        if (el) el.style.transform = `scaleX(${k < i ? 1 : k === i ? p : 0})`
      })
      if (i !== beatRef.current) { beatRef.current = i; setBeat(i); leaveRef.current = false; setLeaving(false) }
      /* The stage starts clearing before the beat ends, so the boundary is a
         hand-off and not a swap. Two state writes per beat, not per frame. */
      const out = i < LAST && e - acc > BEATS[i].ms - OUT_MS
      if (out !== leaveRef.current) { leaveRef.current = out; setLeaving(out) }
      if (e >= TOTAL) { close(EXIT_MS); return }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced, close])

  /* No motion at all: the finished mark is already on screen, so the only
     thing left is to get out of the way. */
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
    /* Focus has to be held, not just taken. The host decides where this mounts
       and may move focus itself during its own first render — this app focuses
       its main region from a rAF, which runs after this effect and silently
       pulled the keyboard out of a dialog covering the whole page, leaving Esc
       and the tab trap doing nothing at all. Anything landing outside is
       brought back; focusing the root itself re-enters, so this cannot loop. */
    const onFocusIn = e => {
      const el = rootRef.current
      if (el && !el.contains(e.target)) el.focus({ preventScroll: true })
    }
    document.addEventListener('focusin', onFocusIn)
    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.body.style.overflow = prev
      touched.forEach(([el, was]) =>
        was === null ? el.removeAttribute('aria-hidden') : el.setAttribute('aria-hidden', was))
    }
  }, [])

  /* Skip is the only control in here, so the trap is one line: Tab goes back to
     it rather than escaping into the page that is currently aria-hidden. Esc
     is Skip, consequence included — a person hitting Esc is refusing this. */
  const onKey = e => {
    if (e.key === 'Escape') { e.preventDefault(); skip() }
    else if (e.key === 'Tab') { e.preventDefault(); skipRef.current?.focus() }
  }

  const Stage = STAGES[beat]
  const b = BEATS[beat]

  return (
    <div ref={rootRef} tabIndex={-1} onKeyDown={onKey}
      role="dialog" aria-modal="true" aria-label="Introduction to MindMap"
      className={cn('iv-root fixed inset-0 z-[400] flex flex-col overflow-hidden bg-ink outline-none',
        'transition-opacity duration-[480ms] ease-out', exiting ? 'opacity-0' : 'opacity-100')}>
      <style>{CSS}</style>

      {/* The announcement is its own node so the visible headline can be styled
          and swapped freely without a screen reader hearing it twice. */}
      <p aria-live="polite" aria-atomic="true" className="sr-only">{b.head + ' ' + b.sub}</p>

      {/* ── the frame, top: wordmark, beat number, and the rail ───────────── */}
      <div className="shrink-0 border-b border-paper/20">
        {/* --logo-peak is set on a wrapper rather than passed down: Logo takes
            no style prop, and the mark reads the variable off whatever it
            inherits from. tone="ink" because the accent half of the wordmark
            measures 2.24 on this field. */}
        <div aria-hidden style={PEAK}
          className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-4
            px-5 py-3 text-paper sm:px-10 sm:py-4">
          <Logo tone="ink" className="text-ui sm:text-head"/>
          <span className="font-mono text-fine tabular-nums text-rule">
            {String(beat + 1).padStart(2, '0')} / {String(BEATS.length).padStart(2, '0')}
          </span>
        </div>
        {!reduced && (
          <div className="flex h-[3px] w-full gap-px" role="progressbar"
            aria-label="Introduction progress" aria-valuemin={1}
            aria-valuemax={BEATS.length} aria-valuenow={beat + 1}>
            {BEATS.map((_, i) => (
              <span key={i} className="block h-full flex-1 overflow-hidden bg-paper/15">
                <span ref={el => { fills.current[i] = el }}
                  className="block h-full w-full origin-left bg-beam"
                  style={{ transform: 'scaleX(0)' }} />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── the stage ─────────────────────────────────────────────────────── */}
      <main className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <div key={beat} className={cn('mx-auto flex min-h-0 w-full max-w-[1180px] flex-1 flex-col',
          'justify-center gap-4 px-5 py-5 sm:gap-6 sm:px-10 sm:py-7', leaving && 'iv-out')}>
          <div className="iv-stage flex min-h-0 flex-1 flex-col justify-center gap-4 sm:gap-6">
            <div aria-hidden className="shrink-0">
              <span className="mb-3 flex items-center gap-3">
                <span className="font-mono text-fine tabular-nums text-beam">
                  {String(beat + 1).padStart(2, '0')}</span>
                <span className="h-px flex-1 bg-paper/20"/>
              </span>
              {beat < LAST && (
                <>
                  <p className="iv-a iv-rise font-display text-sub font-medium text-paper"
                    style={{ '--d': '.55s' }}>{b.head}</p>
                  <p className="iv-a iv-rise mt-2.5 max-w-[64ch] text-sec text-mist sm:mt-3 sm:text-body"
                    style={{ '--d': '.55s', '--t': '.16s' }}>{b.sub}</p>
                </>
              )}
            </div>
            <div className="flex min-h-0 w-full flex-1 items-center justify-center">
              <Stage still={reduced}/>
            </div>
          </div>
        </div>

        {/* The transition, and the mark's third job: a band crosses the stage at
            every boundary carrying the logo, so a beat change is an event in
            the film rather than one picture being replaced by another. */}
        {!reduced && (
          <div key={'w' + beat} aria-hidden
            className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
            {/* The mark is NOT a child of the band. Anything pinned to a
                150%-wide element travelling 380% of the viewport is on screen
                for about 200ms whatever its keyframes say; held at the centre
                of the frame with its own timing, it lands while the band is
                holding over the stage. */}
            <div className="iv-wipe absolute inset-y-0 left-0 w-[150%] border-r-2 border-beam
              bg-accent-ink"/>
            <div style={PEAK} className="iv-wipemark absolute inset-0 flex items-center
              justify-center text-paper">
              <LogoMark className="h-[clamp(2.5rem,8vw,5rem)] w-auto"/>
            </div>
          </div>
        )}
      </main>

      {/* ── the frame, bottom: the one control, and what pressing it costs ── */}
      <div className="shrink-0 border-t border-paper/20 px-5 py-4 sm:px-10 sm:py-5">
        <Button ref={skipRef} onClick={skip}
          className="mx-auto flex h-auto w-full max-w-[430px] flex-col gap-0.5 bg-paper py-3
            text-ink hover:bg-mist active:bg-mist">
          <span className="font-display text-ui font-medium">Skip the intro</span>
          <span className="font-body text-fine font-normal text-ink-2">
            and don&rsquo;t show it again on this device
          </span>
        </Button>
        <p aria-hidden className="mx-auto mt-2.5 w-full text-center font-mono text-fine text-rule">
          Esc does the same
        </p>
      </div>
    </div>
  )
}
