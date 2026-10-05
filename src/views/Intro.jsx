import React from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '../lib/utils'
import { Button } from '../ui/button'
import { Logo } from '../ui/logo'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { ITEMS } from '../lib/engine'

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
 *    clear 3:1 on #0d2b1e but Movement #1560e0 measures 2.91, and the four are
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

/* Five beats: what it is, what it measures, how to use it, what comes back,
   and who it is for.

   The review watched this and could not answer "what is it and what does it
   do" at the end of it, which is the one job an opening sequence has. So beat
   one now says what it measures rather than making an observation about
   bodies, beat two names the four signals, and a fifth beat was added for the
   audience, which was asked for by name.

   Beat three said "two ways to take a reading" while the overview said "3
   Ways to Use MindMap", and nothing on either page reconciled them. There are
   three ways to use it (patch, phone, demo) and two of them are readings; the
   sequence now says three and matches the page.

   Each beat carries its own ground. The sequence ran on one near-black green
   throughout and the note was that it was too dark and too bold for an
   opening. These are teals, lightening across the four and settling onto the
   brand green for the mark. Every one was measured: paper clears 9.1 : 1 on
   the weakest of them and accent-lit clears 4.8, so nothing in the sequence
   changes contrast class as the ground moves under it.

   Nothing here is a setup for a later line, and no number appears that the
   prototype does not produce. */
const BEATS = [
  { ms: 6200, bg: '#0b3f3f',
    head: 'MindMap is a wellness app for teenagers.',
    sub:  'It measures what stress does to your body, and tells you in one sentence.' },
  { ms: 6200, bg: '#0f4d4e',
    head: 'It reads four signals.',
    sub:  'Your pulse, your sweat, your skin temperature and how much you move.' },
  { ms: 6200, bg: '#0c4738',
    head: 'Three ways to use it.',
    sub:  'Wear the patch. Use the phone in your pocket. Or open the demo and look around.' },
  { ms: 6200, bg: '#11423f',
    head: 'A day comes back as one score.',
    sub:  'Out of 100, with one plain sentence under it saying what changed.' },
  { ms: 5600, bg: '#0d2b1e',
    head: 'MindMap',
    sub:  'For students, their parents, and school counselors.' },
]
const LAST = BEATS.length - 1
const TOTAL = BEATS.reduce((a, b) => a + b.ms, 0)
const EXIT_MS = 620          // must match the opacity transition on the overlay
const SKIP_MS = 180          // a skip is an interruption, so it clears faster
const STILL_MS = 900         // reduced motion: hold the finished mark, then leave
const OUT_MS = 700           // how long before a beat ends its stage starts leaving

const svgProps = {
  preserveAspectRatio: 'xMidYMid meet',
  className: 'h-full w-full',
  'aria-hidden': true,
  focusable: 'false',
}

/* The mark's dot is `var(--logo-peak, currentColor)`, and the accent it
   defaults to measures 2.24 on ink. Beam is 5.30, so on every ink field in
   this file the peak is beam and the rest of the mark is whatever it sits on. */
const PEAK = { '--logo-peak': '#0e9c9c' }

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
/* The mark's ridge, the same five points the logo is drawn from. It is shared
   by the route beat and by the closing morph, so it lives here rather than
   being typed twice and drifting. */
const RIDGE = 'M10.5 18.2 15 10.2 20 15.8 25.4 11 29.5 17.6'

/* The axis under the closing line: five marks across the 40-440 span the line
   is drawn along, so the last one sits under the endpoint the mark's dot
   morphs out of. */
const HOURS = [['6am', 60], ['10am', 150], ['2pm', 240], ['6pm', 330], ['10pm', 420]]

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
            strokeLinecap="round" stroke="#0e9c9c" className="iv-a iv-fade"
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
   thing. Two plates, in the order the check-in screen lists the same two
   routes, so the film and the app agree about what comes first.

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

/* ── Beat 2 ── the four signals, named ─────────────────────────────────────
   The review's question after watching this was "what does it actually
   measure", and nothing in the sequence answered it: the signals appeared as
   four unlabelled dots in a legend on the next beat. Four plates, each with
   the signal's own trace in the signal's own colour, is the shortest way to
   answer it, and it reuses the hues the rest of the site already assigns. */
const TRACE_D = {
  heart: 'M0 20 L10 20 L13 7 L16 31 L19 20 L34 20 L44 20 L47 8 L50 30 L53 20 L68 20 L80 20',
  sweat: 'M0 29 L12 29 Q18 29 21 13 Q24 5 28 12 Q32 19 36 28 L44 29 Q50 29 53 15 Q56 7 60 14 Q63 21 67 28 L80 29',
  temp:  'M0 11 C12 11 18 13 26 17 C36 22 44 23 54 21 C64 19 72 16 80 13',
  move:  'M0 20 L7 20 L9 16 L11 24 L13 20 L34 20 L36 18 L38 22 L40 20 L58 20 L60 14 L62 26 L64 20 L80 20',
}

function StageSignals() {
  return (
    <div className="mx-auto grid h-full w-full max-w-[940px] content-center gap-2 sm:gap-3
      grid-cols-2 lg:grid-cols-4">
      {SENSOR_ORDER.map((id, i) => (
        <Plate key={id} className="px-3 py-3 sm:px-4 sm:py-4" delay={`${0.1 + i * 0.12}s`}>
          <svg {...svgProps} viewBox="0 0 80 36" preserveAspectRatio="none"
            className="h-9 w-full sm:h-11">
            <path d={TRACE_D[id]} fill="none" strokeWidth="1.8" strokeLinecap="round"
              strokeLinejoin="round" stroke={SENSORS[id].glow} vectorEffect="non-scaling-stroke"
              className="iv-a iv-draw" style={{ '--len': 200, '--d': '.9s', '--t': `${0.3 + i * 0.12}s` }}/>
          </svg>
          <span className="mt-2 block font-display text-ui font-bold text-ink">{SENSORS[id].name}</span>
          <span className="mt-1 block text-fine leading-tight text-ink-2">{SENSORS[id].short}</span>
        </Plate>
      ))}
    </div>
  )
}

function StageRoutes() {
  return (
    <div className="mx-auto grid h-full w-full max-w-[1040px] content-center items-start gap-2
      sm:gap-4 lg:grid-cols-3">
      <Plate className="px-4 py-3 sm:px-5 sm:py-4" delay=".1s">
        <span className="block font-display text-ui font-bold text-ink">Wear the patch</span>
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
              <rect x="2" y="4" width="36" height="20" rx="10" fill="#0d2b1e" stroke="#f7faf8"
                strokeWidth="0.7" className="iv-a iv-pop" style={{ '--d': '.45s', '--t': '.95s' }} />
              <path d={RIDGE} fill="none" stroke="#0e9c9c" strokeWidth="0.9" strokeLinecap="round"
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
        <span className="block font-display text-ui font-bold text-ink">Answer six questions</span>
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

      {/* The third way. It was missing, and its absence was the reason the
          sequence said two ways while the overview said three. */}
      <Plate className="px-4 py-3 sm:px-5 sm:py-4" delay=".7s">
        <span className="block font-display text-ui font-bold text-ink">Open the demo</span>
        <div className="mx-auto mt-2 aspect-[420/96] w-full">
          <svg {...svgProps} viewBox="0 0 420 96">
            <rect x="24" y="10" width="372" height="76" rx="10" fill="none" strokeWidth="2.2"
              strokeDasharray="8 7" className="stroke-ruling iv-a iv-pop"
              style={{ '--d': '.5s', '--t': '.95s' }}/>
            <path d="M68 70 L136 40 L200 54 L268 24 L352 38" fill="none" strokeWidth="2.6"
              strokeLinecap="round" strokeLinejoin="round" className="stroke-accent iv-a iv-draw"
              style={{ '--len': 320, '--d': '.9s', '--t': '1.15s' }}/>
            <circle cx="352" cy="38" r="5.5" fill="#0e9c9c" className="iv-a iv-pop"
              style={{ '--d': '.4s', '--t': '1.9s' }}/>
          </svg>
        </div>
        <p className="mt-1.5 text-fine text-ink-3">Nobody measured. Every screen filled in, so you can look around.</p>
      </Plate>
    </div>
  )
}

function StageScore() {
  return (
    <div className="mx-auto flex h-full w-full max-w-[760px] items-center">
      <Plate className="w-full px-3 py-3 sm:px-6 sm:py-5">
        <div className="mx-auto aspect-[460/210] max-h-full w-full max-w-[700px]">
          <svg {...svgProps} viewBox="0 0 460 210">
            {/* Four signal traces, four connector curves, a junction dot and a
                label used to live here — eleven things drawn in four seconds to
                say one thing. The four signals are the patch page's subject and
                the arc is this beat's, so the arc is all that is left. */}
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
              <circle cx="419.1" cy="199.8" r="6.5" fill="#0e9c9c" className="iv-a iv-pop"
                style={{ '--d': '.35s', '--t': '1.15s' }} />
            </g>
          )}

          <g className={cn(a, !still && 'iv-morph')} style={still
            ? { transform: 'translate(136px,125.2px) scale(5.2)', transformBox: 'view-box',
                transformOrigin: '0 0', strokeWidth: 0.5 }
            : { '--d': '1s', '--t': '1.55s', transformBox: 'view-box', transformOrigin: '0 0' }}>
            <rect x="2" y="4" width="36" height="20" rx="10" fill="none" stroke="#f7faf8"
              className={cn(a, !still && 'iv-draw')}
              style={still ? undefined : { '--len': 96, '--d': '.8s', '--t': '2.3s' }} />
            <path d={RIDGE} fill="none" stroke="#0e9c9c" strokeLinecap="round" strokeLinejoin="round"
              className={cn(a, !still && 'iv-draw')}
              style={still ? undefined : { '--len': 33, '--d': '1.3s', '--t': '.15s' }} />
            <circle cx="29.5" cy="17.6" r="2.4" fill="#0e9c9c" strokeWidth="0"
              className={cn(a, !still && 'iv-pop')}
              style={still ? undefined : { '--d': '.4s', '--t': '3s' }} />
          </g>
        </svg>
      </div>

      <p className={cn(a, !still && 'iv-rise', 'mt-2 font-display text-view font-bold tracking-tight text-paper')}
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

/* Four stages, down from six. The two that went were the seven-layer patch
   stack and the who-sees-what diagram: both are whole pages elsewhere, and a
   title sequence that explains an enclosure and a consent model on the way
   past is a sequence nobody finishes reading. */
const STAGES = [StageDay, StageSignals, StageRoutes, StageScore, StageMark]

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
.iv-root .iv-stage{animation:iv-stage .55s cubic-bezier(.2,.7,.3,1) both}
/* Nothing in the sequence loops any more. A pulse that blinks forever, a
   drawing that sways forever and a dash pattern that flows forever are three
   things moving while somebody is trying to read a sentence, and none of them
   carries information the still frame does not. They are overridden here
   rather than deleted at each call site so the classes stay available to the
   pages, which are not a title card and can afford ambient motion. */
.iv-root .iv-blink,.iv-root .iv-sway{animation:none}
.iv-root .iv-flow{animation-name:iv-fade;animation-duration:.4s;animation-delay:var(--t);animation-iteration-count:1}
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
30%{opacity:1}
to{opacity:1;transform:translate(-50%,-50%) translateZ(var(--z1))}}
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
      style={{ background: BEATS[beat]?.bg || '#0d2b1e', transition: 'background 900ms cubic-bezier(0.4,0,0.2,1)' }}
      className={cn('iv-root fixed inset-0 z-[400] flex flex-col overflow-hidden outline-none',
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
          {/* Where "01 / 04" was. A count is a label the film does not need:
              the only thing a viewer wants off this corner is how much is
              left, and four ticks with one filled says that without asking
              anyone to read a number. The rail below and its progressbar role
              still carry the announced version. */}
          <span className="flex items-center gap-1.5">
            {BEATS.map((_, i) => (
              <span key={i} className={cn('block h-[3px] w-4',
                i === beat ? 'bg-beam' : i < beat ? 'bg-paper/45' : 'bg-paper/20')}/>
            ))}
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
                {/* Dots, not a beat number, for the same reason as the corner
                    above: the head under this line is the thing to read. */}
                <span className="flex items-center gap-1.5">
                  {BEATS.map((_, i) => (
                    <span key={i} className={cn('block size-1.5 rounded-chip',
                      i === beat ? 'bg-beam' : 'bg-paper/25')}/>
                  ))}
                </span>
                <span className="h-px flex-1 bg-paper/20"/>
              </span>
              {beat < LAST && (
                <>
                  <p className="iv-a iv-rise font-display text-sub font-bold text-paper"
                    style={{ '--d': '.7s' }}>{b.head}</p>
                  {/* The sub used to arrive 160ms behind the head, which is
                      not a gap — both lines land together and the eye picks
                      one. A second of separation is the difference between
                      reading two lines and glancing at a block. */}
                  <p className="iv-a iv-rise mt-2.5 max-w-[52ch] text-sec text-mist sm:mt-3 sm:text-body"
                    style={{ '--d': '.7s', '--t': '1s' }}>{b.sub}</p>
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
      <div className="shrink-0 px-5 py-4 sm:px-10 sm:py-5">
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
