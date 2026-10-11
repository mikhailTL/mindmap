import React from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '../lib/utils'
import { Button } from '../ui/button'
import { Logo } from '../ui/logo'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { ITEMS } from '../lib/engine'
import { IntroSky } from '../charts/intro-sky'

/* The title sequence.
 *
 * Four things decide the shape of this file.
 *
 * 1. It is a title card, not a page, and it is a pale one. It ran as an ink
 *    field for two passes and the note came back both times that it was too
 *    dark and too bold for an opening. It is aqua now, the type is ink, and
 *    the logo mark is still the recurring device: it is the patch on the arm
 *    in beat three, and the last beat resolves a day of readings back into
 *    the mark's own two-peak stroke.
 *
 * 2. The rainbow is the ground, so the plates are translucent. charts/
 *    intro-sky.jsx lays a four-band arch and a travelling cloud behind every
 *    beat, and a wall of opaque white cards in front of it leaves nothing to
 *    see. Every plate is card at 85%, which keeps ink-3 at 4.74 : 1 over the
 *    worst band the arch can put behind it and still lets the arch read
 *    through. Signal colour stays on a plate, as it does in the app.
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

/* Six beats: what it is, what the patch does, the three ways in, what comes
   back, who it is for, and the mark.

   The review watched this and could not answer "what is it and what does it
   do" at the end of it, which is the one job an opening sequence has. Beat one
   now names the product and the thing it hands back in the same breath, beat
   two says what the patch is and what it reads, beat three says what the phone
   does without it, and beat five is the audience, which was asked for by name.

   Beat three said "two ways to take a reading" while the overview said "3 Ways
   to Use MindMap", and nothing on either page reconciled them. The heading is
   now the overview's heading, word for word, and the beat settles the
   arithmetic itself: three ways, two of which read a body.

   Each beat carries its own ground, and the whole set moved. The sequence
   ran on one near-black green, then on five dark teals, and the note both
   times was the same: too dark and too bold for an opening, and aqua or
   turquoise would be better. These are pale aquas. Relative luminance, and
   the gap to the next one, which has to stay visible across the 900ms
   crossfade:

     #e8f6f4 .8960   #dcf0ef .8377   #d2ebe9 .7900
     #e3f2ed .8595   #d7eeea .8154   #eaf6f2 .8981
     gaps    .0583   .0477   .0695   .0441   .0828

   The type inverted with them. Measured across all six grounds, worst case:
   ink #0b2b33 12.16 : 1, ink-2 #1f5560 6.60, ink-3 #3c6a74 4.48, accent
   #0a6e68 4.64. Headings are ink and sub-lines are ink-2; ink-3 is only ever
   used inside a plate, where it measures 4.74 against the worst plate the
   arch can put under it. paper, mist, rule and ruling have no contrast left
   on a pale ground at all and none of them survives in here.

   Nothing here is a setup for a later line, and no number appears that the
   prototype does not produce. */
/* How long each beat is, and why it is that long.
 *
 * A tester said the sequence was helpful but moved fast. Two different faults
 * hide in that: not enough time to read, and content landing faster than the
 * eye settles. The dwell below answers the first and PACE/DUR in the CSS
 * answers the second.
 *
 * The dwell of a beat is not a flat addition. It is sized to the beat's own
 * content:
 *
 *   copy done = when the sub-line lands
 *             + (heading + sub-line words) / 3.5      first read, prose rate
 *             + (stage words) / 9                     labels and captions, scanned
 *   anim done = when the last element in the stage finishes + 0.4
 *   dwell     = max(copy done, anim done) + 0.9       one crossfade of rest
 *
 * 3.5 words a second is a first-time reader on prose. The stage rate is faster
 * because a stage is short labels in a grid, sampled rather than read line by
 * line, and because every stage here is a whole page elsewhere on the site for
 * anybody who wants all of it. The last beat has no heading block, so its clock
 * starts when the wordmark lands rather than when a sub-line does.
 *
 *   beat  words (copy / stage)  last element  copy done  dwell
 *     1        37 / 6               4.33s      13.55s    14.4s
 *     2        30 / 39              2.31s      15.21s    16.1s
 *     3        22 / 67              3.31s      16.04s    16.9s
 *     4        26 / 10              4.76s      10.85s    11.7s
 *     5        19 / 33              2.47s      11.41s    12.3s
 *     6        25 / 4               6.24s      13.01s    13.9s
 *
 * 85.3s against the 34.4s it ran before. The floor is the copy, not the
 * timings: the six headings and sub-lines are approved and 3.5 words a second
 * over them is most of this. Nobody has to sit through it either way, which is
 * what Back, Next and Skip are for.
 */
const BEATS = [
  { ms: 10400, bg: '#e8f6f4',
    head: 'MindMap is a stress tracker for teenagers.',
    sub:  'It measures your pulse, your sweat, your skin temperature and how much you move, all day, then hands back one score out of 100 and one sentence saying what changed.' },
  { ms: 11600, bg: '#dcf0ef',
    head: 'The patch is a sticker for your upper arm.',
    sub:  'It sticks to the skin, takes those four readings about once a second, and sends them to your phone over Bluetooth.' },
  { ms: 12200, bg: '#d2ebe9',
    head: '3 Ways to Use MindMap',
    sub:  'The patch and the phone each take a real reading from your body. The demo takes none.' },
  { ms: 8400, bg: '#e3f2ed',
    head: 'A day comes back as one score.',
    sub:  'Out of 100, from the patch or from the phone, with one plain sentence under it saying what changed.' },
  { ms: 8900, bg: '#d7eeea',
    head: 'Students, parents and school counselors.',
    sub:  'Each one sees a different amount, and the student decides what leaves their phone.' },
  { ms: 10000, bg: '#eaf6f2',
    head: 'MindMap',
    sub:  'A patch, or six questions. One score and one sentence a day.' },
]
const LAST = BEATS.length - 1
const EXIT_MS = 620          // must match the opacity transition on the overlay
const SKIP_MS = 180          // a skip is an interruption, so it clears faster
const OUT_MS = 900           // how long before a beat ends its stage starts leaving
const FADE_MS = 1500         // the ground crossfade, in step with the longer beats

const svgProps = {
  preserveAspectRatio: 'xMidYMid meet',
  className: 'h-full w-full',
  'aria-hidden': true,
  focusable: 'false',
}

/* The mark's dot is `var(--logo-peak, currentColor)`. On the old ink field it
   was beam #1d8fb0 at 5.30 : 1. On a pale aqua beam measures 2.69 and fails
   even as a graphic, so the peak is beam-ink #11677f, which is the same
   turquoise at a value that holds 3.96 on the lightest ground. */
const PEAK = { '--logo-peak': '#11677f' }

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
    <div className={cn('iv-a iv-rise rounded-panel border border-rule bg-card/85', className)}
      style={{ '--d': '.55s', '--t': delay }}>{children}</div>
  )
}

/* ── Beat 1 ── what stress does to a body, and who can see it ─────────────
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
    <div className="mx-auto flex h-full max-h-full min-h-0 w-full max-w-[880px] items-center">
      {/* On a plate, like every other drawing here. It used to sit straight on
          the field, which worked when the field was ink and nothing was behind
          it; over the arch, a bare axis in ink-3 measures 1.66 : 1. */}
      <Plate className="max-h-full min-h-0 w-full px-3 py-4 sm:px-5 sm:py-5">
      <svg {...svgProps} viewBox="0 0 480 250">
        <text x="8" y="44" fontSize="17" className="font-mono fill-ink-2 iv-a iv-rise"
          style={{ '--d': '.5s', '--t': '.1s' }}>your body</text>
        {DAY.map((d, i) => (
          <line key={'b' + i} x1={d.x} y1={92 - d.body} x2={d.x} y2={92 + d.body} strokeWidth="3.4"
            strokeLinecap="round" stroke="#1d8fb0" className="iv-a iv-fade"
            style={{ '--d': '.4s', '--t': `${0.25 + i * 0.03}s` }} />
        ))}

        <text x="8" y="152" fontSize="17" className="font-mono fill-ink-2 iv-a iv-rise"
          style={{ '--d': '.5s', '--t': '.75s' }}>what anyone notices</text>
        {DAY.map((d, i) => (
          <line key={'s' + i} x1={d.x} y1={186 - d.seen} x2={d.x} y2={186 + d.seen} strokeWidth="3.4"
            strokeLinecap="round" className="stroke-ink-3 iv-a iv-fade"
            style={{ '--d': '.4s', '--t': `${0.95 + i * 0.03}s` }} />
        ))}

        {/* The two moments, and the distance between them. The left mark sits
            where the body's bars start growing and the right where the second
            lane finally moves; both x values come straight off DAY's own
            thresholds rather than being placed by eye. */}
        <path d="M230 60 V 216" fill="none" strokeWidth="1.25" strokeDasharray="4 5"
          className="stroke-ink-3 iv-a iv-fade" style={{ '--d': '.5s', '--t': '1.85s' }} />
        <path d="M374 170 V 216" fill="none" strokeWidth="1.25" strokeDasharray="4 5"
          className="stroke-ink-3 iv-a iv-fade" style={{ '--d': '.5s', '--t': '2s' }} />
        <path d="M230 210 V 222 M230 216 H 374 M374 210 V 222" fill="none" strokeWidth="1.4"
          className="stroke-ink-3 iv-a iv-draw" style={{ '--len': 180, '--d': '.7s', '--t': '2.1s' }} />
        <text x="302" y="242" textAnchor="middle" fontSize="16"
          className="font-mono fill-ink-2 iv-a iv-rise" style={{ '--d': '.5s', '--t': '2.5s' }}>hours</text>
      </svg>
      </Plate>
    </div>
  )
}

/* ── Beat 3 ── the three ways in, side by side ─────────────────────────────
   The half of the product that needs no hardware had no picture anywhere in
   this sequence, which is exactly how a patch ends up reading as the whole
   thing. Three plates: the patch, the phone on its own, and the demo. The
   first two read a body and the third reads nobody, which is the whole of the
   "three ways, two readings" arithmetic the heading promises.

   Every plate carries signal colour or a filled control, so every one of them
   is a plate. Nothing in this sequence paints a signal hue straight onto the
   ground, which is where the arch lives. */

/* One or two words per question, not the questions themselves: the six real
   prompts are sentences, and six sentences beside a five-point scale wrap into
   a wall of text at 390px. Keyed off ITEMS so the count here can never drift
   from the count the app actually asks. */
const ASK = {
  tension: 'Tension', edge: 'On edge', sleep: 'Last night',
  energy: 'Energy', focus: 'Focus', demand: 'Today so far',
}
const PICKED = [3, 1, 4, 2, 3, 1]

/* ── Beat 2 ── the four signals the patch reads, named ────────────────────
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
        {/* Hidden under sm. Stacked on a 390px phone these three drawings ran
            the stage 700px tall inside a 456px slot, so the plates were cut off
            and ran up over the head. The title and the line under it carry the
            beat on a phone; the drawings return at sm. */}
        <div className="mx-auto mt-2 hidden aspect-[420/96] w-full sm:block">
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
              <rect x="2" y="4" width="36" height="20" rx="10" fill="#0b2b33" stroke="#f5fafa"
                strokeWidth="0.7" className="iv-a iv-pop" style={{ '--d': '.45s', '--t': '.95s' }} />
              <path d={RIDGE} fill="none" stroke="#1d8fb0" strokeWidth="0.9" strokeLinecap="round"
                strokeLinejoin="round" className="iv-a iv-draw"
                style={{ '--len': 33, '--d': '.8s', '--t': '1.2s' }} />
            </g>
          </svg>
        </div>
        <ul className="m-0 mt-2 hidden list-none flex-wrap gap-x-3 gap-y-1 p-0 sm:flex">
          {SENSOR_ORDER.map((id, i) => (
            <li key={id} className="iv-a iv-rise flex items-center gap-1.5"
              style={{ '--d': '.4s', '--t': `${1.3 + i * 0.1}s` }}>
              <span className="block h-2 w-2 rounded-chip" style={{ background: SENSORS[id].glow }} />
              <span className="text-fine leading-tight text-ink-2">{SENSORS[id].name}</span>
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-fine text-ink-3">Four signals off your skin, about one reading a
          second, all day.</p>
      </Plate>

      <Plate className="px-4 py-3 sm:px-5 sm:py-4" delay=".4s">
        <span className="block font-display text-ui font-bold text-ink">Use the phone alone</span>
        <ul className="m-0 mt-2 hidden list-none gap-1 p-0 sm:grid">
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
        <p className="mt-1.5 text-fine text-ink-3">The camera, the microphone and six questions.
          About thirty seconds, and nothing on your arm.</p>
      </Plate>

      {/* The third way. It was missing, and its absence was the reason the
          sequence said two ways while the overview said three. */}
      <Plate className="px-4 py-3 sm:px-5 sm:py-4" delay=".7s">
        <span className="block font-display text-ui font-bold text-ink">Open the demo</span>
        <div className="mx-auto mt-2 hidden aspect-[420/96] w-full sm:block">
          <svg {...svgProps} viewBox="0 0 420 96">
            <rect x="24" y="10" width="372" height="76" rx="10" fill="none" strokeWidth="2.2"
              strokeDasharray="8 7" className="stroke-ink-3 iv-a iv-pop"
              style={{ '--d': '.5s', '--t': '.95s' }}/>
            <path d="M68 70 L136 40 L200 54 L268 24 L352 38" fill="none" strokeWidth="2.6"
              strokeLinecap="round" strokeLinejoin="round" className="stroke-accent iv-a iv-draw"
              style={{ '--len': 320, '--d': '.9s', '--t': '1.15s' }}/>
            <circle cx="352" cy="38" r="5.5" fill="#1d8fb0" className="iv-a iv-pop"
              style={{ '--d': '.4s', '--t': '1.9s' }}/>
          </svg>
        </div>
        <p className="mt-1.5 text-fine text-ink-3">No one is measured. Every screen is filled in, so
          you can look around.</p>
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
              className="stroke-ink-3 iv-a iv-draw" style={{ '--len': 414, '--d': '.5s', '--t': '2.5s' }} />
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

/* ── Beat 5 ── who can use it ──────────────────────────────────────────────
   Asked for by name: the audience was a single line at the end of the last
   beat, which is the same as not saying it. Three readers, each named the way
   they would be named out loud, with one line on what that person gets and
   nothing else. Written from the student outwards, because that is the
   direction permission travels here. A counselor's line says what was handed
   to them rather than what they can look up, which is the difference between a
   shared reading and a feed. */
const READERS = [
  { who: 'Students',
    gets: 'The score, the sentence, and all four readings behind them.' },
  { who: 'Parents',
    gets: 'The score and the sentence, once a student shares them.' },
  { who: 'School counselors',
    gets: 'Only what a student has chosen to pass on.' },
]

function StageAudience() {
  return (
    <div className="mx-auto grid h-full w-full max-w-[1040px] content-center items-start gap-2
      sm:gap-4 lg:grid-cols-3">
      {READERS.map((r, i) => (
        <Plate key={r.who} className="px-4 py-4 sm:px-5 sm:py-5" delay={`${0.1 + i * 0.18}s`}>
          {/* One figure per plate, at plate scale: a head and a pair of
              shoulders, which is as much of a person as a title card can draw
              without becoming an illustration of one. The band under it is the
              amount that reader is handed, drawn as a share of the plate's
              width rather than as a figure, because no number here is one the
              prototype produces. */}
          <div className="mx-auto hidden aspect-[180/72] w-full max-w-[200px] sm:block">
            <svg {...svgProps} viewBox="0 0 180 72">
              <circle cx="90" cy="24" r="13" fill="none" strokeWidth="2.2"
                className="stroke-ink-3 iv-a iv-pop"
                style={{ '--d': '.45s', '--t': `${0.3 + i * 0.18}s` }}/>
              <path d="M58 64 C 62 46, 76 40, 90 40 C 104 40, 118 46, 122 64" fill="none"
                strokeWidth="2.2" strokeLinecap="round" className="stroke-ink-3 iv-a iv-draw"
                style={{ '--len': 160, '--d': '.7s', '--t': `${0.45 + i * 0.18}s` }}/>
              <rect x="40" y="68" width={100 - i * 28} height="4" rx="2"
                fill="#1d8fb0" className="iv-a iv-fade"
                style={{ '--d': '.5s', '--t': `${0.9 + i * 0.18}s` }}/>
            </svg>
          </div>
          <span className="block font-display text-ui font-bold text-ink sm:mt-2">{r.who}</span>
          <span className="mt-1 block text-fine leading-tight text-ink-2">{r.gets}</span>
        </Plate>
      ))}
    </div>
  )
}

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
                className="stroke-ink-3 iv-a iv-draw" style={{ '--len': 402, '--d': '.5s', '--t': '0s' }} />
              {HOURS.map(([h, x], i) => (
                <g key={h} className="iv-a iv-rise" style={{ '--d': '.4s', '--t': `${0.25 + i * 0.07}s` }}>
                  <line x1={x} y1="226" x2={x} y2="234" strokeWidth="1.25" className="stroke-ink-3" />
                  <text x={x} y="252" textAnchor="middle" fontSize="16"
                    className="font-mono fill-ink-2">{h}</text>
                </g>
              ))}
              <circle cx="419.1" cy="199.8" r="6.5" fill="#11677f" className="iv-a iv-pop"
                style={{ '--d': '.35s', '--t': '1.15s' }} />
            </g>
          )}

          <g className={cn(a, !still && 'iv-morph')} style={still
            ? { transform: 'translate(136px,125.2px) scale(5.2)', transformBox: 'view-box',
                transformOrigin: '0 0', strokeWidth: 0.5 }
            : { '--d': '1s', '--t': '1.55s', transformBox: 'view-box', transformOrigin: '0 0' }}>
            <rect x="2" y="4" width="36" height="20" rx="10" fill="none" stroke="#0b2b33"
              className={cn(a, !still && 'iv-draw')}
              style={still ? undefined : { '--len': 96, '--d': '.8s', '--t': '2.3s' }} />
            <path d={RIDGE} fill="none" stroke="#11677f" strokeLinecap="round" strokeLinejoin="round"
              className={cn(a, !still && 'iv-draw')}
              style={still ? undefined : { '--len': 33, '--d': '1.3s', '--t': '.15s' }} />
            <circle cx="29.5" cy="17.6" r="2.4" fill="#11677f" strokeWidth="0"
              className={cn(a, !still && 'iv-pop')}
              style={still ? undefined : { '--d': '.4s', '--t': '3s' }} />
          </g>
        </svg>
      </div>

      {/* text-beam would be a word in a colour that measures 2.69 here, which
          the palette forbids outright. beam-ink is the turquoise when it has
          to be a word, and the wordmark is 36px or larger, so it clears the
          3 : 1 large-text bar at 3.96 with room over. */}
      <p className={cn(a, !still && 'iv-rise', 'mt-2 font-display text-view font-bold tracking-tight text-ink')}
        style={still ? undefined : { '--d': '.6s', '--t': '3.15s' }}>
        Mind<span className="text-beam-ink">Map</span>
      </p>
      <p className={cn(a, !still && 'iv-rise', 'mt-3 text-center text-lead text-ink-2')}
        style={still ? undefined : { '--d': '.6s', '--t': '3.4s' }}>
        A patch, or six questions. One score and one sentence a day.
      </p>

      {/* The last beat was an arch, a wordmark and a lot of nothing. The four
          signals close it instead: the same four hues, in the same order, that
          the arch behind them is drawn in, which is the one place in the
          sequence where the rainbow and the product are the same object. The
          names come from lib/sensors.js, so nothing here is a second copy. */}
      <ul className={cn(a, !still && 'iv-rise',
        'm-0 mt-5 flex list-none flex-wrap items-center justify-center gap-x-5 gap-y-2 p-0')}
        style={still ? undefined : { '--d': '.6s', '--t': '3.5s' }}>
        {SENSOR_ORDER.map(id => (
          <li key={id} className="flex items-center gap-2">
            <span aria-hidden className="block h-2.5 w-2.5 rounded-chip"
              style={{ background: SENSORS[id].glow }}/>
            <span className="font-display text-ui font-medium text-ink">{SENSORS[id].name}</span>
          </li>
        ))}
      </ul>

      <p className={cn(a, !still && 'iv-rise', 'mt-4 max-w-[46ch] text-center text-note text-ink-3')}
        style={still ? undefined : { '--d': '.6s', '--t': '3.7s' }}>
        A working prototype built by a high-school team. Not a medical device.
      </p>
    </div>
  )
}

/* Six stages, one per beat. The two that went earlier were the seven-layer
   patch stack and the who-sees-what consent diagram: both are whole pages
   elsewhere, and a title sequence that explains an enclosure and a permission
   model on the way past is a sequence nobody finishes. The audience stage is
   not that diagram. It names three people and what each one is handed, which
   is the question the review actually asked. */
const STAGES = [StageDay, StageSignals, StageRoutes, StageScore, StageAudience, StageMark]

/* One motion vocabulary, declared once. Keyframes live here rather than in
   tailwind.config.js because they describe this one sequence, not the design
   system. The reduced-motion rule at the bottom is the whole no-motion story:
   remove the animation and every mark, layer and label renders finished. */
const CSS = `
/* The second half of "it moves fast". Every --t and --d in this file is a cue
   relative to the start of its beat, and they were written against beats of
   about six seconds: a stage finished arriving by 2.3s and then sat for four.
   Stretched over a fourteen-second beat the same cues would land in the first
   sixth of it and the rest would be a still. One multiplier on the delays and
   a smaller one on the durations re-spaces the whole build without touching a
   single call site, which is the only way to re-time ninety-odd cues without
   mistyping one. 1.5 on the delays walks the stage in over about three and a
   half seconds instead of two and a bit; 1.15 on the durations stops the
   strokes from drawing faster than the gaps between them.
   calc() multiplies a time by a number, so --t stays authored in seconds. */
.iv-root{--iv-pace:1.5;--iv-dur:1.15}
.iv-root .iv-a{animation-duration:calc(var(--d,1s) * var(--iv-dur,1));animation-delay:calc(var(--t,0s) * var(--iv-pace,1));animation-fill-mode:both;animation-timing-function:cubic-bezier(.2,.7,.3,1)}
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
.iv-root .iv-flow{animation-name:iv-fade;animation-duration:.4s;animation-delay:calc(var(--t,0s) * var(--iv-pace,1));animation-iteration-count:1}
.iv-root .iv-out{animation:iv-out ${OUT_MS}ms cubic-bezier(.55,0,.25,1) both}
@keyframes iv-draw{from{stroke-dashoffset:var(--len)}}
@keyframes iv-rise{from{opacity:0;transform:translateY(10px)}}
@keyframes iv-pop{from{opacity:0;transform:scale(.35)}}
@keyframes iv-fade{from{opacity:0}}
@keyframes iv-fade-out{from{opacity:1}to{opacity:0}}
@keyframes iv-flow{from{stroke-dashoffset:0}to{stroke-dashoffset:-34}}
@keyframes iv-scan{0%{transform:translateX(170px);opacity:0}8%{opacity:1}92%{opacity:1}100%{transform:translateX(446px);opacity:0}}
@keyframes iv-blink{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes iv-sway{0%,100%{transform:rotateX(30deg) rotateZ(-22deg)}50%{transform:rotateX(20deg) rotateZ(-8deg)}}
@keyframes iv-morph{from{transform:translate(-138.5px,-132.8px) scale(18.9);stroke-width:.18px}
to{transform:translate(136px,125.2px) scale(5.2);stroke-width:.5px}}
@keyframes iv-stage{from{opacity:0;transform:translateY(16px)}}
@keyframes iv-out{to{opacity:0;transform:translateY(-14px)}}
@media (prefers-reduced-motion:reduce){.iv-root [class*="iv-"]{animation:none !important}}
`

export function Intro({ onDone }) {
  const reduced = useReducedMotion()
  /* Reduced motion used to open on the last beat and leave after 900ms, which
     made the other five unreachable. It opens on the first beat like everybody
     else now and does not advance itself at all; see the clock below. */
  const [beat, setBeat] = React.useState(0)
  const [leaving, setLeaving] = React.useState(false)
  const [exiting, setExiting] = React.useState(false)
  const rootRef = React.useRef(null)
  const skipRef = React.useRef(null)
  const prevRef = React.useRef(null)
  const nextRef = React.useRef(null)
  /* When the beat now playing began. Zero means "re-anchor on the next frame",
     which is how a jump hands the beat it lands on that beat's whole dwell
     rather than whatever was left of the one it replaced. */
  const startRef = React.useRef(0)
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

  /* The reader's own clock. However long the beats are, a sequence that only
     advances on a timer is too fast for somebody who reads slowly and too slow
     for somebody who does not, so the two directions are controls. A jump
     re-anchors the beat timer: going on early does not shorten the beat landed
     on, and going back gives that beat its whole dwell again instead of the
     sliver that was left when it was first passed.

     Next past the last beat ends the sequence, and that is not Skip. Skip is a
     refusal and writes the key; reaching the end by pressing Next is having
     watched it, and suppresses nothing. */
  const goTo = React.useCallback(i => {
    if (doneRef.current || timerRef.current) return
    if (i > LAST) { close(EXIT_MS); return }
    const n = Math.max(0, Math.min(LAST, i))
    if (n === beatRef.current) return
    beatRef.current = n
    startRef.current = 0
    leaveRef.current = false
    setLeaving(false)
    setBeat(n)
  }, [close])

  const goNext = React.useCallback(() => goTo(beatRef.current + 1), [goTo])
  const goPrev = React.useCallback(() => goTo(beatRef.current - 1), [goTo])

  /* One clock, and it owns one beat at a time. It used to run against the sum
     of every beat, which left no time to seek to: a jump would have had to
     rewrite the progress rail's history to express itself. The frame timestamp
     is still what a boundary is derived from, so a dropped frame or a
     backgrounded tab cannot leave the headline and the rail disagreeing about
     which beat is playing; only the origin moved, from the start of the
     sequence to the start of the beat now playing.

     Under reduced motion this does not run at all. An auto-advancing sequence
     is fast for anybody who reads slowly however long its beats are, and a
     reader who asked for less motion asked for exactly that. Every beat
     renders finished, Back and Next are the only clock, and Next on the last
     beat ends it. Nothing that was moving is frozen, so there is no stopped
     screen to stare at either. */
  React.useEffect(() => {
    if (reduced) return
    let raf = 0
    startRef.current = 0
    const tick = t => {
      if (!startRef.current) startRef.current = t
      const i = beatRef.current
      const dur = BEATS[i].ms
      const e = t - startRef.current
      const p = Math.min(1, e / dur)
      /* Written straight to the DOM: this runs 60x a second and re-rendering
         six segments that often is real work for a decorative rail. */
      fills.current.forEach((el, k) => {
        if (el) el.style.transform = `scaleX(${k < i ? 1 : k === i ? p : 0})`
      })
      /* The stage starts clearing before the beat ends, so the boundary is a
         hand-off and not a swap. Two state writes per beat, not per frame. */
      const out = i < LAST && e > dur - OUT_MS
      if (out !== leaveRef.current) { leaveRef.current = out; setLeaving(out) }
      if (e >= dur) {
        if (i >= LAST) { close(EXIT_MS); return }
        beatRef.current = i + 1
        startRef.current = t
        leaveRef.current = false
        setLeaving(false)
        setBeat(i + 1)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced, close])

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

  /* Three controls now, so the trap is a ring rather than one node: Tab walks
     Back, Skip, Next and wraps, and Back drops out of the ring on the first
     beat where it is disabled. Nothing escapes into the page behind, which is
     currently aria-hidden.

     The arrows are the same two actions as the two buttons, which is what makes
     the sequence reader-paced from the keyboard alone. Down and Up are included
     because the beats read as a vertical stack of cards on a phone and both
     axes get guessed at. Esc is still Skip, consequence included: a person
     hitting Esc is refusing this. */
  const ring = () =>
    [prevRef.current, skipRef.current, nextRef.current].filter(el => el && !el.disabled)

  const onKey = e => {
    if (e.key === 'Escape') { e.preventDefault(); skip() }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goNext() }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goPrev() }
    else if (e.key === 'Tab') {
      e.preventDefault()
      const els = ring()
      if (!els.length) return
      const at = els.indexOf(document.activeElement)
      const to = at < 0 ? 0 : (at + (e.shiftKey ? -1 : 1) + els.length) % els.length
      els[to].focus()
    }
  }

  const Stage = STAGES[beat]
  const b = BEATS[beat]

  return (
    <div ref={rootRef} tabIndex={-1} onKeyDown={onKey}
      role="dialog" aria-modal="true" aria-label="Introduction to MindMap"
      /* The crossfade was 900ms against six-second beats. On a fourteen-second
         beat the same 900ms is proportionally half of what it was and starts
         reading as a switch, so it grew with the pace. The six grounds are
         .044 to .083 apart in relative luminance, which is what keeps one
         distinguishable from the next while the two are mixed; a longer mix
         does not spend any of that. */
      style={{ background: BEATS[beat]?.bg || '#0b2b33',
        transition: `background ${FADE_MS}ms cubic-bezier(0.4,0,0.2,1)` }}
      className={cn('iv-root fixed inset-0 z-[400] flex flex-col overflow-hidden outline-none',
        'transition-opacity duration-[480ms] ease-out', exiting ? 'opacity-0' : 'opacity-100')}>
      <style>{CSS}</style>

      {/* The one continuous thing in the sequence. It sits under every beat
          and is the only transition between them; `beat` and the beat count
          are all it takes, so the cloud's walk re-spaces itself if a beat is
          ever added or removed. */}
      <IntroSky beat={beat} count={BEATS.length}/>

      {/* The announcement is its own node so the visible headline can be styled
          and swapped freely without a screen reader hearing it twice. */}
      <p aria-live="polite" aria-atomic="true" className="sr-only">{b.head + ' ' + b.sub}</p>

      {/* ── the frame, top: wordmark, beat number, and the rail ───────────── */}
      {/* No rule under the frame. A hairline across the top of every beat is
          one more line between one beat and the next, which is what the review
          was counting. */}
      <div className="relative z-10 shrink-0">
        {/* --logo-peak is set on a wrapper rather than passed down: Logo takes
            no style prop, and the mark reads the variable off whatever it
            inherits from. tone="paper" is the light-ground lockup, where the
            accent half of the wordmark is accent #0a6e68 at 4.64 : 1; the
            accent-lit the ink field needed measures 1.9 here. */}
        <div aria-hidden style={PEAK}
          className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-4
            px-5 py-3 text-ink sm:px-10 sm:py-4">
          <Logo tone="paper" className="text-ui sm:text-head"/>
          {/* Where "01 / 04" was. A count is a label the film does not need:
              the only thing a viewer wants off this corner is how much is
              left, and four ticks with one filled says that without asking
              anyone to read a number. The rail below and its progressbar role
              still carry the announced version. */}
          <span className="flex items-center gap-1.5">
            {BEATS.map((_, i) => (
              <span key={i} className={cn('block h-[3px] w-4',
                i === beat ? 'bg-accent' : i < beat ? 'bg-ink/35' : 'bg-ink/15')}/>
            ))}
          </span>
        </div>
        {!reduced && (
          <div className="flex h-[3px] w-full gap-px" role="progressbar"
            aria-label="Introduction progress" aria-valuemin={1}
            aria-valuemax={BEATS.length} aria-valuenow={beat + 1}>
            {BEATS.map((_, i) => (
              <span key={i} className="block h-full flex-1 overflow-hidden bg-ink/10">
                <span ref={el => { fills.current[i] = el }}
                  className="block h-full w-full origin-left bg-accent"
                  style={{ transform: 'scaleX(0)' }} />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── the stage ─────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex min-h-0 w-full flex-1 flex-col overflow-hidden">
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
                      i === beat ? 'bg-accent' : 'bg-ink/20')}/>
                  ))}
                </span>
              </span>
              {beat < LAST && (
                <>
                  <p className="iv-a iv-rise font-display text-sub font-bold text-ink"
                    style={{ '--d': '.7s' }}>{b.head}</p>
                  {/* The sub used to arrive 160ms behind the head, which is
                      not a gap — both lines land together and the eye picks
                      one. A second of separation is the difference between
                      reading two lines and glancing at a block. */}
                  <p className="iv-a iv-rise mt-2.5 max-w-[52ch] text-sec text-ink-2 sm:mt-3 sm:text-body"
                    style={{ '--d': '.7s', '--t': '1s' }}>{b.sub}</p>
                </>
              )}
            </div>
            {/* overflow-hidden: a drawing taller than its slot was bleeding
                up over the head and sub on beat 1, which measured as a 562 by
                46 overlap. The stage is clipped to its own box now. */}
            <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden">
              <Stage still={reduced}/>
            </div>
          </div>
        </div>

        {/* Where the band wipe was. One opaque panel with a 2px beam edge
            crossed the stage at every boundary, and the note back was that the
            cuts still read as abrupt lines. It was the line. The sky behind
            every beat is the transition now: the arch never moves and the
            cloud walks one step along it per beat, so a boundary is something
            continuing rather than something being cut. */}
      </main>

      {/* ── the frame, bottom: the three controls ──────────────────────────── */}
      <div className="relative z-10 shrink-0 px-5 py-4 sm:px-10 sm:py-5">
        {/* Back and Next are the plate shape every drawing in here already
            uses: ink #0b2b33 on card at 85%, which measures 11.8 : 1 over the
            worst band the arch can put under them, and 4.74 : 1 when Back
            dims to ink-3 on the first beat. Button's own disabled state is
            opacity 45, which would take that label to about 2.4; it is
            overridden to a colour instead, so a disabled control is still
            readable rather than just faint.

            Skip stays the one dark object, because it is the one control with
            a consequence: paper on ink at 14.47 : 1, second line in mist at
            12.69. Three keys of equal weight and one of them permanent is how
            a person skips the intro by meaning to go on.

            54px tall, never narrower than 44, and the row stretches so all
            three match the two-line Skip. */}
        <div className="mx-auto flex w-full max-w-[660px] items-stretch justify-center gap-2 sm:gap-3">
          <Button ref={prevRef} onClick={goPrev} disabled={beat === 0}
            aria-label="Previous section"
            className="h-auto min-h-[54px] min-w-[44px] shrink-0 border border-rule bg-card/85 px-4
              font-display text-ui font-medium text-ink hoverOnly:bg-card active:bg-card
              disabled:opacity-100 disabled:text-ink-3 sm:px-6">
            Back
          </Button>
          <Button ref={skipRef} onClick={skip}
            className="flex h-auto min-h-[54px] w-full max-w-[430px] flex-col gap-0.5 bg-ink py-3
              text-paper hoverOnly:bg-ink-2 active:bg-ink-2">
            <span className="font-display text-ui font-medium">Skip the intro</span>
            <span className="font-body text-fine font-normal text-mist">
              and don&rsquo;t show it again on this device
            </span>
          </Button>
          <Button ref={nextRef} onClick={goNext} aria-label="Next section"
            className="h-auto min-h-[54px] min-w-[44px] shrink-0 border border-rule bg-card/85 px-4
              font-display text-ui font-medium text-ink hoverOnly:bg-card active:bg-card sm:px-6">
            Next
          </Button>
        </div>
        <p aria-hidden className="mx-auto mt-2.5 w-full text-center font-mono text-fine text-ink-3">
          Arrow keys move between sections. Esc skips.
        </p>
      </div>
    </div>
  )
}
