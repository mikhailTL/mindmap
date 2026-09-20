import React from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '../lib/utils'
import { Button } from '../ui/button'
import { Logo } from '../ui/logo'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { ITEMS } from '../lib/engine'
import { LAYERS } from './Patch'

/* The title sequence.
 *
 * Four things decide the shape of this file.
 *
 * 1. It is a title card, not a page. The rest of the site is paper; this is an
 *    ink field, and the logo mark is its recurring device — it is the patch on
 *    the arm in beat two, and the last beat resolves a day of readings back
 *    into the mark's own two-peak stroke. The contrast against the site proper
 *    is the point: when it clears, you know the film ended and the product
 *    began.
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

/* This key means "has refused", not "has watched" — the two are different
   questions and only one of them suppresses the sequence. Reaching the end
   sets nothing; the intro plays again on the next load, which is what was
   asked for. Only Skip (or Esc, which is the same action) writes it. */
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
   product and who it is for, because someone who watches four seconds and
   leaves must still be able to answer "what is this" — and the answer is an
   app, not a piece of hardware. The patch arrives third, as one of two ways in,
   which is the order the product actually works in: a person with no patch can
   still take a reading, and a sequence that opens on a circuit board tells them
   the opposite. Nothing here is a setup for a later line, and no number appears
   that the prototype does not produce. */
const BEATS = [
  { ms: 4200,
    head: 'MindMap is a wellness app for teenagers.',
    sub:  'Your body reacts to a hard day hours before anyone notices it, you included.' },
  { ms: 4400,
    head: 'There are two ways to take a reading.',
    sub:  'Wear the patch, or answer six questions. One model scores both.' },
  { ms: 4000,
    head: 'The patch is a thin sticker for your forearm.',
    sub:  'Three printed parts around one small board. Pulse, sweat, skin temperature and micro-movements read through the face against your skin.' },
  { ms: 4200,
    head: 'A whole day of readings comes back as one score out of 100.',
    sub:  'Under the score, one sentence in plain words.' },
  { ms: 3800,
    head: 'You decide what a parent or a counselor sees.',
    sub:  'The score and the sentence are yours to pass on. The readings behind them stay with you.' },
  { ms: 4600,
    head: 'MindMap',
    sub:  'A patch, or six questions. One score and one sentence a day.' },
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

/* ── Beat 1 ── the app, who it is for, and the gap it exists to close ──────
   Two lanes on one axis: what the body is doing, and what anybody watching can
   see. Drawn as bars of samples rather than as a curve, so the lag between the
   two is a horizontal distance a viewer can measure off the screen instead of
   a claim they have to take on trust. The bars also survive at 390px, where a
   pair of overlaid curves would read as one smudge. */
const DAY = Array.from({ length: 32 }, (_, i) => {
  /* Deterministic, for the same reason waveLine is: a recording that redrew
     itself on every render would read as noise. */
  const k = Math.abs(Math.sin(i * 1.73) * 0.66 + Math.sin(i * 0.9 + 1.2) * 0.34)
  return {
    x: 14 + i * 14.4,
    body: i < 15 ? 3 + k * 4 : 6 + k * 20,
    seen: i < 25 ? 2 : 2 + (i - 25) * 1.8,
  }
})

function StageDay() {
  return (
    <div className="mx-auto flex h-full w-full max-w-[880px] items-center">
      <svg {...svgProps} viewBox="0 0 480 250">
        <text x="8" y="44" fontSize="17" className="font-mono fill-rule iv-a iv-rise"
          style={{ '--d': '.5s', '--t': '.1s' }}>your body</text>
        {DAY.map((d, i) => (
          <line key={'b' + i} x1={d.x} y1={92 - d.body} x2={d.x} y2={92 + d.body} strokeWidth="3.4"
            strokeLinecap="round" stroke="#7091e6" className="iv-a iv-fade"
            style={{ '--d': '.4s', '--t': `${0.25 + i * 0.03}s` }} />
        ))}

        <text x="8" y="152" fontSize="17" className="font-mono fill-rule iv-a iv-rise"
          style={{ '--d': '.5s', '--t': '.75s' }}>what anyone notices</text>
        {DAY.map((d, i) => (
          <line key={'s' + i} x1={d.x} y1={186 - d.seen} x2={d.x} y2={186 + d.seen} strokeWidth="3.4"
            strokeLinecap="round" className="stroke-rule iv-a iv-fade"
            style={{ '--d': '.4s', '--t': `${0.95 + i * 0.03}s` }} />
        ))}

        {/* The two moments, and the distance between them. The left mark sits
            where the body's bars start growing and the right where the second
            lane finally moves; both x values come straight off DAY's own
            thresholds rather than being placed by eye. */}
        <path d="M230 60 V 216" fill="none" strokeWidth="1.25" strokeDasharray="4 5"
          className="stroke-ruling iv-a iv-fade" style={{ '--d': '.5s', '--t': '1.85s' }} />
        <path d="M374 170 V 216" fill="none" strokeWidth="1.25" strokeDasharray="4 5"
          className="stroke-ruling iv-a iv-fade" style={{ '--d': '.5s', '--t': '2s' }} />
        <path d="M230 210 V 222 M230 216 H 374 M374 210 V 222" fill="none" strokeWidth="1.4"
          className="stroke-rule iv-a iv-draw" style={{ '--len': 180, '--d': '.7s', '--t': '2.1s' }} />
        <text x="302" y="242" textAnchor="middle" fontSize="16"
          className="font-mono fill-rule iv-a iv-rise" style={{ '--d': '.5s', '--t': '2.5s' }}>hours</text>
      </svg>
    </div>
  )
}

/* ── Beat 2 ── the two ways in, side by side ───────────────────────────────
   The half of the product that needs no hardware had no picture anywhere in
   this sequence, which is exactly how a patch ends up reading as the whole
   thing. Two plates, numbered the way the check-in screen numbers the same two
   routes, so the film and the app agree about what order they come in.

   Both plates carry signal colour or filled controls, so both are light
   plates — the ink field cannot hold either. */

/* One or two words per question, not the questions themselves: the six real
   prompts are sentences, and six sentences beside a five-point scale wrap into
   a wall of text at 390px. Keyed off ITEMS so the count here can never drift
   from the count the app actually asks. */
const ASK = {
  tension: 'Tension', edge: 'On edge', sleep: 'Last night',
  energy: 'Energy', focus: 'Focus', demand: 'Today so far',
}
const PICKED = [3, 1, 4, 2, 3, 1]

function StageRoutes() {
  return (
    <div className="mx-auto grid h-full w-full max-w-[940px] content-center items-start gap-2
      sm:gap-4 lg:grid-cols-2">
      <Plate className="px-4 py-3 sm:px-5 sm:py-4" delay=".1s">
        <span className="flex items-baseline gap-3">
          <span className="font-mono text-fine tabular-nums text-ink-3">01</span>
          <span className="font-display text-ui font-medium text-ink">Wear the patch</span>
        </span>
        {/* Full plate width, with the elbow cut flush at the left edge of the
            box: at a fixed narrow width the same two strokes closed into a
            loop floating in the middle of the card and stopped reading as a
            limb. The ratio is what holds the height steady at 390px. */}
        <div className="mx-auto mt-2 aspect-[420/96] w-full">
          <svg {...svgProps} viewBox="0 0 420 96">
            {/* forearm: elbow off-frame at the left, heel of the hand at the
                right. Two long strokes and a cap — enough to place the patch,
                not enough to become an illustration of a person. */}
            <path d="M-6 18 C 120 10, 260 8, 344 15" fill="none" strokeWidth="2.2"
              className="stroke-ink-3 iv-a iv-draw" style={{ '--len': 356, '--d': '.7s', '--t': '.3s' }} />
            <path d="M-6 80 C 120 88, 260 86, 344 80" fill="none" strokeWidth="2.2"
              className="stroke-ink-3 iv-a iv-draw" style={{ '--len': 356, '--d': '.7s', '--t': '.36s' }} />
            <path d="M344 15 C 372 31, 372 64, 344 80" fill="none" strokeWidth="2.2"
              className="stroke-ink-3 iv-a iv-draw" style={{ '--len': 90, '--d': '.45s', '--t': '.8s' }} />
            {/* the mark at patch size, centred on the arm: 40 x 28 logo units
                at scale 1.7, so the dark lozenge is 61 x 34 on a 420 canvas */}
            <g transform="translate(136,25) scale(1.7)">
              <rect x="2" y="4" width="36" height="20" rx="10" fill="#171f3c" stroke="#ede8f5"
                strokeWidth="0.7" className="iv-a iv-pop" style={{ '--d': '.45s', '--t': '.95s' }} />
              <path d={RIDGE} fill="none" stroke="#7091e6" strokeWidth="0.9" strokeLinecap="round"
                strokeLinejoin="round" className="iv-a iv-draw"
                style={{ '--len': 33, '--d': '.8s', '--t': '1.2s' }} />
            </g>
          </svg>
        </div>
        <ul className="m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0">
          {SENSOR_ORDER.map((id, i) => (
            <li key={id} className="iv-a iv-rise flex items-center gap-1.5"
              style={{ '--d': '.4s', '--t': `${1.3 + i * 0.1}s` }}>
              <span className="block h-2 w-2 rounded-chip" style={{ background: SENSORS[id].glow }} />
              <span className="text-fine leading-tight text-ink-2">{SENSORS[id].name}</span>
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-fine text-ink-3">One reading a second, all day.</p>
      </Plate>

      <Plate className="px-4 py-3 sm:px-5 sm:py-4" delay=".4s">
        <span className="flex items-baseline gap-3">
          <span className="font-mono text-fine tabular-nums text-ink-3">02</span>
          <span className="font-display text-ui font-medium text-ink">Answer six questions</span>
        </span>
        <ul className="m-0 mt-2 grid list-none gap-1 p-0">
          {ITEMS.map((it, i) => (
            <li key={it.id} className="iv-a iv-rise flex items-center gap-3"
              style={{ '--d': '.4s', '--t': `${0.9 + i * 0.12}s` }}>
              <span className="text-fine leading-tight text-ink-2">{ASK[it.id] || it.id}</span>
              {/* The answered step is filled; the rest are outlined in ink-3
                  rather than washed in, because a five-point scale drawn in
                  mist is a row of dots nobody can count. */}
              <span className="ml-auto flex items-center gap-1.5">
                {[0, 1, 2, 3, 4].map(k => (
                  <span key={k} className={cn('block h-2 w-2 rounded-chip border border-ink-3',
                    k === PICKED[i] ? 'bg-accent' : 'bg-card')} />
                ))}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-fine text-ink-3">About thirty seconds. Nothing on your arm.</p>
      </Plate>
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

/* ── Beat 3 ── the three parts fall together, name themselves, then close ─── */
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
/* Written from the student outwards, because that is the direction permission
   travels here. A counselor's line says what was handed to them, not what they
   can look up — the difference between a shared reading and a feed. */
const READERS = [
  { who: 'The student', sees: 'The score, the sentence, and all four readings.' },
  { who: 'A parent',    sees: 'The score and the sentence, once you share them.' },
  { who: 'A counselor', sees: 'Only what you have chosen to pass on.' },
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
        A patch, or six questions. One score and one sentence a day.
      </p>
      <p className={cn(a, !still && 'iv-rise', 'mt-3 max-w-[46ch] text-center text-note text-rule')}
        style={still ? undefined : { '--d': '.6s', '--t': '3.6s' }}>
        A working prototype built by a high-school team. Not a medical device.
      </p>
    </div>
  )
}

const STAGES = [StageDay, StageRoutes, StageStack, StageScore, StageWho, StageMark]

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
/* The layer drawings are the hardware page's, and their engineering labels are
   correct there — that page tips the stack far less and never closes it. Here
   two separate things break them. Within the board, "nRF52840" and "IMU · PDM
   MIC" are 18 SVG units apart on a drawing held at rotateX(30deg) and swaying
   to 20deg, and the foreshortened vertical axis pulls those two lines onto each
   other. Between layers, the stack closes to 12px of separation, which puts
   "PPG" on the face directly over the board's part number in screen space.
   Suppressing the labels answers both at once, and costs this beat nothing:
   the numbered legend beside the drawing already names all three parts, and the
   claim here is "three parts stack up", not the name of a microcontroller.
   Scoped to .iv-lyr, which exists only inside this file — the hardware page's
   own .lyr figures are untouched. */
.iv-root .iv-lyr svg text{display:none}
.iv-root .iv-stage{animation:iv-stage .55s cubic-bezier(.2,.7,.3,1) both}
.iv-root .iv-out{animation:iv-out ${OUT_MS}ms cubic-bezier(.55,0,.25,1) both}
.iv-root .iv-wipe{animation:iv-wipe .62s cubic-bezier(.65,0,.35,1) both}
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
@keyframes iv-wipe{from{transform:translateX(-152%)}to{transform:translateX(102%)}}
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

        {/* The transition: one band crosses the stage at every boundary, so a
            beat change reads as an event rather than one picture replacing
            another.

            It used to hold full-frame for ~230ms with the logo mark popping in
            and back out inside it. Six beats meant six of those, and at that
            duration a mark appearing and vanishing does not read as branding —
            it reads as a flicker, which is exactly what it was reported as.
            The band now travels straight through without pausing and carries
            nothing. The brand is the whole film; it does not need stamping on
            every seam. */}
        {!reduced && (
          <div key={'w' + beat} aria-hidden
            className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
            <div className="iv-wipe absolute inset-y-0 left-0 w-[150%] border-r-2 border-beam
              bg-accent-ink"/>
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
