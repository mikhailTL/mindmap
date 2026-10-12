import React from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '../lib/utils'
import { Button } from '../ui/button'
import { Logo } from '../ui/logo'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { IntroSky } from '../charts/intro-sky'
import { PHOTOS } from '../lib/photos'
import { RainbowDial } from '../charts/rainbow'
import { studentRings } from '../lib/readings'

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
  { ms: 11000, bg: '#e8f6f4', head: 'One number for your day.' },
  { ms: 13000, bg: '#dcf0ef', head: 'The patch goes on your arm.' },
  { ms: 12500, bg: '#d2ebe9', head: 'It reads four things.' },
  { ms: 12500, bg: '#e3f2ed', head: 'Your usual day is marked.',
    sub: 'So an ordinary day reads as ordinary.' },
  { ms: 13500, bg: '#d7eeea', head: 'Three ways to start.' },
  { ms: 13000, bg: '#eef7f3', head: 'You choose who sees it.',
    sub: 'Nothing leaves your phone unless you say so.' },
  { ms: 10500, bg: '#eaf6f2', head: 'MindMap',
    sub: 'A patch, or six questions. One score a day.' },
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

/* The mark's ridge, the same five points the logo is drawn from. It is shared
   by the route beat and by the closing morph, so it lives here rather than
   being typed twice and drifting. */
const RIDGE = 'M10.5 18.2 15 10.2 20 15.8 25.4 11 29.5 17.6'

/* The axis under the closing line: five marks across the 40-440 span the line
   is drawn along, so the last one sits under the endpoint the mark's dot
   morphs out of. */
const HOURS = [['6am', 60], ['10am', 150], ['2pm', 240], ['6pm', 330], ['10pm', 420]]

/* ── the drawing vocabulary ───────────────────────────────────────────────
 *
 * Three marks, and between them they are most of what this sequence does.
 *
 * An arrow is a line and a head, and the head is a separate node that pops
 * when the line finishes rather than a marker-end that appears with the first
 * pixel of it. A marker that is already there while the line is still growing
 * tells the eye where to look before the line has finished saying it, and the
 * whole point of an arrow here is that it arrives.
 *
 * A spot is two rings half a second apart. One ring reads as a circle somebody
 * drew; two in sequence read as a pulse, and a pulse is what says "this one,
 * now". They are bounded at two: a highlight that blinks forever is motion
 * competing with the thing it is highlighting.
 *
 * A chip is three words at most. Everything in here that wants a sentence is a
 * whole page elsewhere on the site, and this is the sequence that sends people
 * to those pages, not a smaller copy of them.
 */

/* The arrowhead, built from the tip backwards so the caller gives a point and
   a bearing rather than three corners it has to work out. The notch at -0.72
   is what stops it reading as a paper dart. */
function headPath(x, y, deg, s = 10) {
  const r = (deg * Math.PI) / 180
  const c = Math.cos(r), si = Math.sin(r)
  const p = (dx, dy) =>
    `${(x + dx * c - dy * si).toFixed(1)} ${(y + dx * si + dy * c).toFixed(1)}`
  return `M${p(0, 0)} L${p(-s, s * 0.5)} L${p(-s * 0.72, 0)} L${p(-s, -s * 0.5)} Z`
}

function Arrow({ d, len, x, y, deg, t, dur = 0.8, color = '#0b2b33', w = 2.4, still }) {
  if (still) {
    return (
      <g stroke={color} fill={color}>
        <path d={d} fill="none" strokeWidth={w} strokeLinecap="round"/>
        <path d={headPath(x, y, deg)} strokeWidth="0"/>
      </g>
    )
  }
  return (
    <g stroke={color} fill={color}>
      <path d={d} fill="none" strokeWidth={w} strokeLinecap="round"
        className="iv-a iv-draw" style={{ '--len': len, '--d': `${dur}s`, '--t': `${t}s` }}/>
      <path d={headPath(x, y, deg)} strokeWidth="0" className="iv-a iv-pop"
        style={{ '--d': '.28s', '--t': `${(t + dur - 0.06).toFixed(2)}s` }}/>
    </g>
  )
}

function Spot({ cx, cy, r, t, still, color = '#0a6e68' }) {
  if (still) return <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="2.4"/>
  return (
    <g fill="none" stroke={color} strokeWidth="2.6">
      {[0, 0.52].map((o, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} className="iv-a iv-ring"
          style={{ '--d': '1.3s', '--t': `${(t + o).toFixed(2)}s` }}/>
      ))}
    </g>
  )
}

function Chip({ x, y, t, still, anchor = 'middle', size = 17, tone = 'fill-ink', children }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight="600"
      className={cn('font-display', tone, !still && 'iv-a iv-rise')}
      style={still ? undefined : { '--d': '.5s', '--t': `${t}s` }}>{children}</text>
  )
}

/* A card in the drawings: the same panel the site uses, drawn rather than laid
   out, because an arrow pointing at an HTML box has to be positioned against a
   layout that moves and an arrow pointing at a rect does not. */
function Card({ x, y, w, h, t, still, dim = false }) {
  return (
    <rect x={x} y={y} width={w} height={h} rx="16"
      fill="#ffffff" fillOpacity={dim ? 0.34 : 0.85} stroke="#8eb0b6"
      strokeOpacity={dim ? 0.45 : 1} strokeWidth="1.5"
      className={cn(!still && 'iv-a iv-lift')}
      style={still ? undefined : { '--d': '.6s', '--t': `${t}s` }}/>
  )
}

/* ── Beat 1 ── a whole day arrives as one number ──────────────────────────
   The line is the day and the circle is what the day becomes. Nothing else is
   on the screen, because the first thing anybody has to understand about this
   product is the conversion, and a second object would be a second subject. */
const DAYLINE = waveLine(150, 1.05, 30, 30, 48, 300)

function StageOneNumber({ still }) {
  const a = still ? undefined : 'iv-a'
  return (
    <div className="iv-real mx-auto w-full max-w-[720px]">
      <div className="aspect-[16/9] w-full">
        <svg {...svgProps} viewBox="0 0 560 300">
          {/* the day, recorded */}
          <line x1="44" y1="226" x2="306" y2="226" strokeWidth="1.5"
            className={cn('stroke-ink-3', !still && 'iv-a iv-draw')}
            style={still ? undefined : { '--len': 300, '--d': '.6s', '--t': '.2s' }}/>
          <path d={DAYLINE.d} fill="none" stroke="#11677f" strokeWidth="3.2" strokeLinecap="round"
            strokeLinejoin="round" className={cn(a, !still && 'iv-draw')}
            style={still ? undefined : { '--len': DAYLINE.len, '--d': '2.2s', '--t': '.6s' }}/>
          <Chip x="175" y="256" t={1.1} still={still} size={16} tone="fill-ink-2">one day</Chip>

          {/* and what it becomes */}
          <Arrow still={still} t={3.3} dur={0.9} d="M318 168 C 348 178, 366 176, 386 166"
            len={92} x={390} y={164} deg={-24}/>

          <circle cx="462" cy="150" r="62" fill="#ffffff" fillOpacity="0.85" stroke="#0a6e68"
            strokeWidth="2.4" className={cn(a, !still && 'iv-pop')}
            style={still ? undefined : { '--d': '.5s', '--t': '4.15s' }}/>
          {still
            ? <text x="462" y="166" textAnchor="middle" fontSize="54" fontWeight="700"
                className="font-display fill-ink">64</text>
            : <Count to={64} ms={1500} delay={4600} x="462" y="166" textAnchor="middle"
                fontSize="54" fontWeight="700" className="font-display fill-ink"/>}
          <Chip x="462" y="236" t={6.0} still={still} size={16} tone="fill-ink-2">out of 100</Chip>
          <Spot cx={462} cy={150} r={76} t={6.3} still={still}/>
        </svg>
      </div>
    </div>
  )
}

/* ── Beat 2 ── where the patch goes, and where the readings go ────────────
   An arm, a patch landing on it, and four readings walking down the wire to a
   phone. The landing is the instruction: it comes in from off the arm and
   stops on the outer face of the upper arm, which is the one thing about
   wearing it that a picture can teach faster than a sentence. */
/* One path, used twice: once filled and once as the outline that draws over
   it. Typed twice, the two would drift apart on the first edit. */
/* ── Beat 2 ── where it goes, and where the readings go ──────────────────
 *
 * This beat was a drawn arm for three passes and it was wrong every time: two
 * mirrored curves read as a leaf, and adding a shoulder to them read as a
 * mitten. The problem was not the drawing. A limb with nothing attached to it
 * is ambiguous at any level of effort, and the one thing this beat has to
 * teach — where on your body the thing goes — is the one thing an ambiguous
 * limb cannot say.
 *
 * So it is the photograph. The same licensed plate the patch page uses, with
 * the patch composited onto the outer upper arm at its real 36 x 54 mm, framed
 * through a clip so the arm fills the panel. It is unambiguous, it is already
 * in the bundle, and it is the picture the visitor will meet again two clicks
 * later, which is what a walkthrough is for.
 *
 * The photograph is placed by arithmetic rather than by eye. The patch sits at
 * (0.5737, 0.7869) of the plate and is 0.0352 of its width, measured off the
 * file; PATCH_W is how wide it should be here, and the image's size and offset
 * fall out of those three numbers. Re-crop the photograph and only the
 * constants change.
 */
const PHOTO = { w: 1024, h: 688 }
const PATCH_AT = { x: 0.5737, y: 0.7869, w: 0.0352 }
const PANEL = { x: 20, y: 20, w: 280, h: 200 }
const PATCH_W = 27                               // how wide the patch reads, in viewBox units
const SPOT_AT = { x: 168, y: 146 }               // where it lands in the 560 x 300 viewBox

/* The crop, as a window onto the photograph's own pixels.
 *
 * It was a full-size <image> behind a clipPath, which paints correctly and
 * lays out catastrophically: the clip hides the pixels but the element keeps
 * its real geometry, so the <g> measured 479px inside a 350px column, the
 * dialog grew a 33px horizontal scroll, and on a 390px phone the browser
 * scrolled it to reveal the overflow — pushing every heading 13px off the left
 * edge of the screen. The drawing looked right and the words were cut in half.
 *
 * A nested <svg> clips to its own bounds by construction, so the geometry and
 * the paint agree. The viewBox below is the region of the photograph that
 * shows through, computed from where the patch is in the file and how big it
 * should read here. */
const CROP_W = (PATCH_AT.w * PHOTO.w * PANEL.w) / PATCH_W
const CROP_H = (CROP_W * PANEL.h) / PANEL.w
const CROP_X = PATCH_AT.x * PHOTO.w - ((SPOT_AT.x - PANEL.x) / PANEL.w) * CROP_W
const CROP_Y = PATCH_AT.y * PHOTO.h - ((SPOT_AT.y - PANEL.y) / PANEL.h) * CROP_H

function StagePatch({ still }) {
  const a = still ? undefined : 'iv-a'
  const clip = React.useId().replace(/[^a-zA-Z0-9]/g, '')
  const dot = (i, c) => (
    <circle key={i} r="6" fill={c}
      className={cn(!still && 'iv-a iv-run')}
      style={still
        ? { transform: `translate(${332 + i * 22}px, ${146 - i * 5}px)`, transformBox: 'view-box' }
        : { offsetPath: 'path("M312 152 C 344 150, 370 142, 392 134")',
            '--d': '2.4s', '--t': `${(4.4 + i * 0.45).toFixed(2)}s` }}/>
  )
  return (
    <div className="iv-real mx-auto w-full max-w-[760px]">
      <div className="aspect-[16/9] w-full">
        <svg {...svgProps} viewBox="0 0 560 300">
          <defs>
            <clipPath id={clip}>
              <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx="20"/>
            </clipPath>
          </defs>
          <g clipPath={`url(#${clip})`} className={cn(a, !still && 'iv-fade')}
            style={still ? undefined : { '--d': '.9s', '--t': '.3s' }}>
            <svg x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h}
              viewBox={`${CROP_X.toFixed(1)} ${CROP_Y.toFixed(1)} ${CROP_W.toFixed(1)} ${CROP_H.toFixed(1)}`}
              preserveAspectRatio="xMidYMid slice">
              <image href={PHOTOS['patch-worn']} x="0" y="0"
                width={PHOTO.w} height={PHOTO.h}/>
            </svg>
          </g>
          <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx="20" fill="none"
            stroke="#8eb0b6" strokeWidth="1.6" className={cn(a, !still && 'iv-fade')}
            style={still ? undefined : { '--d': '.9s', '--t': '.3s' }}/>

          {/* two rings on the patch itself, which is the whole instruction */}
          <Spot cx={SPOT_AT.x} cy={SPOT_AT.y} r={26} t={1.8} still={still}/>

          {/* and then the readings leave */}
          <Arrow still={still} t={3.4} dur={0.9} d="M312 152 C 344 150, 370 142, 392 134"
            len={100} x={396} y={132} deg={-20} color="#1f5560" w={2.2}/>
          {!still && SENSOR_ORDER.map((i2, i) => dot(i, SENSORS[i2].glow))}

          <rect x="408" y="62" width="100" height="176" rx="18" fill="#ffffff" fillOpacity="0.92"
            stroke="#8eb0b6" strokeWidth="1.6" className={cn(a, !still && 'iv-lift')}
            style={still ? undefined : { '--d': '.6s', '--t': '3.2s' }}/>
          <g className={cn(a, !still && 'iv-fade')}
            style={still ? undefined : { '--d': '.5s', '--t': '6.4s' }}>
            <text x="458" y="152" textAnchor="middle" fontSize="42" fontWeight="700"
              className="font-display fill-ink">64</text>
            <text x="458" y="176" textAnchor="middle" fontSize="14"
              className="font-mono fill-ink-2">out of 100</text>
          </g>
          <Chip x="458" y="264" t={6.8} still={still} size={16} tone="fill-ink-2">your phone</Chip>
        </svg>
      </div>
    </div>
  )
}

/* ── Beat 3 ── the four signals, one at a time ────────────────────────────
   One row per signal and a second and a half between them, which is the whole
   design of this beat: four traces arriving together is a chart, four arriving
   in turn is a list of four things. The spot on each dot is what makes the
   difference legible at a glance rather than only in sequence. */
function StageFour({ still }) {
  return (
    <div className="iv-real mx-auto w-full max-w-[720px]">
      <div className="aspect-[16/10] w-full">
        <svg {...svgProps} viewBox="0 0 560 350">
          {SENSOR_ORDER.map((id, i) => {
            const s = SENSORS[id]
            const y = 52 + i * 82
            const t = 0.4 + i * 1.55
            const w = waveLine(y, SHAPE[id].seed, SHAPE[id].amp * 1.1, SHAPE[id].steps, 236, 528)
            return (
              <g key={id}>
                <circle cx="40" cy={y} r="11" fill={s.glow}
                  className={cn(!still && 'iv-a iv-pop')}
                  style={still ? undefined : { '--d': '.42s', '--t': `${t}s` }}/>
                <Spot cx={40} cy={y} r={22} t={t + 0.15} still={still} color={s.glow}/>
                <text x="68" y={y + 7} fontSize="22" fontWeight="600"
                  className={cn('font-display fill-ink', !still && 'iv-a iv-rise')}
                  style={still ? undefined : { '--d': '.5s', '--t': `${(t + 0.2).toFixed(2)}s` }}>
                  {s.name}
                </text>
                <path d={w.d} fill="none" stroke={s.glow} strokeWidth="2.8" strokeLinecap="round"
                  strokeLinejoin="round" className={cn(!still && 'iv-a iv-draw')}
                  style={still ? undefined
                    : { '--len': w.len, '--d': '1.25s', '--t': `${(t + 0.35).toFixed(2)}s` }}/>
              </g>
            )
          })}
          <Chip x="382" y="336" t={7.0} still={still} size={16} tone="fill-ink-2">
            about once a second
          </Chip>
        </svg>
      </div>
    </div>
  )
}

/* ── Beat 4 ── the mark, which is the one thing on the dial to learn ──────
   The real RainbowDial, not a drawing of one, because the point of this beat
   is that the thing you are about to meet on the site is this thing. The
   overlay is a separate svg on the dial's own 320 x 232 viewBox, so the arrow
   lands on the mark by sharing its coordinate system rather than by being
   nudged until it looks right.

   The mark sits at 180 + 1.8 x usual degrees from the arch's centre, which for
   a usual day of 46 is 262.8 — just left of the apex. Change the usual and the
   arrow has to move with it; it is written as a constant here so the two
   cannot drift apart silently. */
const USUAL = 46
const DIAL_SCORE = 64

function StageMarkOnDial({ still }) {
  return (
    <div className="iv-real mx-auto flex w-full max-w-[560px] flex-col items-center">
      <div className="relative w-[min(100%,430px)]">
        <RainbowDial score={DIAL_SCORE} usual={USUAL} rings={studentRings()} size={430}/>
        <svg viewBox="0 0 320 232" aria-hidden focusable="false"
          className="pointer-events-none absolute inset-x-0 top-0"
          style={{ aspectRatio: '320 / 232' }}>
          <Chip x="14" y="30" t={2.4} still={still} anchor="start" size={16}>your usual day</Chip>
          <Arrow still={still} t={3.0} dur={0.75} d="M76 42 C 100 40, 118 33, 132 25"
            len={80} x={135} y={23} deg={-27}/>
          <Spot cx={146} cy={54} r={26} t={3.9} still={still}/>
        </svg>
      </div>
    </div>
  )
}

/* ── Beat 5 ── the three ways in, highlighted one at a time ───────────────
   This is the beat that is a manual rather than a trailer. Three cards in the
   order the overview lists them, then two seconds on each one alone: the spot
   says which, the arrow says look here, and three words say what it needs from
   you. A viewer who watches only this beat can still choose. */
const WAYS = [
  { label: 'Patch',  note: 'on your arm' },
  { label: 'Phone',  note: 'camera and flash' },
  { label: 'Demo',   note: 'nothing to wear' },
]

function StageWays({ still }) {
  const X = [26, 208, 390]
  return (
    <div className="iv-real mx-auto w-full max-w-[760px]">
      <div className="aspect-[16/9] w-full">
        <svg {...svgProps} viewBox="0 0 560 300">
          {WAYS.map((w, i) => {
            const x = X[i], cx = x + 72
            const show = 0.3 + i * 0.55
            const lit = 3.0 + i * 2.5
            return (
              <g key={w.label}>
                <Card x={x} y={86} w={144} h={128} t={show} still={still}/>
                {/* one glyph per card, drawn in the same two strokes as
                    everything else here so the row reads as one family */}
                <g className={cn(!still && 'iv-a iv-fade')}
                  style={still ? undefined : { '--d': '.5s', '--t': `${(show + 0.25).toFixed(2)}s` }}>
                  {i === 0 && (
                    <>
                      <rect x={cx - 15} y="112" width="30" height="44" rx="13" fill="#ffffff"
                        stroke="#1f5560" strokeWidth="2"/>
                      <rect x={cx - 6} y="104" width="12" height="10" rx="4" fill="#f3f8f5"
                        stroke="#1f5560" strokeWidth="1.4"/>
                    </>
                  )}
                  {i === 1 && (
                    <>
                      <rect x={cx - 17} y="104" width="34" height="54" rx="8" fill="#ffffff"
                        stroke="#1f5560" strokeWidth="2"/>
                      <circle cx={cx} cy="126" r="8" fill="none" stroke="#1f5560" strokeWidth="2"/>
                      <circle cx={cx} cy="146" r="3.4" fill="#e86a05"/>
                    </>
                  )}
                  {i === 2 && (
                    <>
                      <circle cx={cx} cy="131" r="22" fill="none" stroke="#1f5560" strokeWidth="2"
                        strokeDasharray="5 5"/>
                      <path d={`M${cx - 6} 121 L${cx + 11} 131 L${cx - 6} 141 Z`} fill="#1f5560"/>
                    </>
                  )}
                </g>
                <text x={cx} y="192" textAnchor="middle" fontSize="21" fontWeight="700"
                  className={cn('font-display fill-ink', !still && 'iv-a iv-rise')}
                  style={still ? undefined : { '--d': '.5s', '--t': `${(show + 0.35).toFixed(2)}s` }}>
                  {w.label}
                </text>

                {/* and then, one at a time */}
                <Arrow still={still} t={lit} dur={0.55}
                  d={`M${cx} 38 L${cx} 70`} len={40} x={cx} y={74} deg={90}/>
                <Spot cx={cx} cy={150} r={82} t={lit + 0.5} still={still}/>
                <Chip x={cx} y="252" t={lit + 0.7} still={still} size={16} tone="fill-ink-2">
                  {w.note}
                </Chip>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

/* ── Beat 6 ── the switch, and what happens when it goes off ──────────────
   Every other way of saying "you control what is shared" is a sentence. This
   one is a switch that turns off while you watch and a share that stops: the
   arrow fades, the card dims, and nothing has to be claimed. The student's
   phone never changes, which is the other half of the point. */
function StageShare({ still }) {
  const a = still ? undefined : 'iv-a'
  const off = still ? undefined : 'iv-a iv-fade-out'
  return (
    <div className="iv-real mx-auto w-full max-w-[760px]">
      <div className="aspect-[16/9] w-full">
        <svg {...svgProps} viewBox="0 0 560 300">
          {/* the student, in the middle, who sees everything first */}
          <rect x="232" y="64" width="96" height="164" rx="18" fill="#ffffff" fillOpacity="0.92"
            stroke="#8eb0b6" strokeWidth="1.6" className={cn(a, !still && 'iv-lift')}
            style={still ? undefined : { '--d': '.6s', '--t': '.3s' }}/>
          <g className={cn(a, !still && 'iv-fade')}
            style={still ? undefined : { '--d': '.5s', '--t': '.8s' }}>
            <text x="280" y="148" textAnchor="middle" fontSize="40" fontWeight="700"
              className="font-display fill-ink">64</text>
          </g>
          <Chip x="280" y="254" t={1.1} still={still} size={17}>You</Chip>

          <Card x={22} y={102} w={150} h={88} t={1.6} still={still}/>
          <Chip x="97" y="152" t={2.0} still={still} size={19}>Parent</Chip>

          {/* the counselor's card is the one that goes */}
          <g className={off} style={still ? undefined : { '--d': '.7s', '--t': '7.4s' }}>
            <Card x={388} y={102} w={150} h={88} t={2.0} still={still}/>
            <Chip x="463" y="152" t={2.4} still={still} size={19}>Counselor</Chip>
          </g>

          <Arrow still={still} t={3.2} dur={0.7} d="M224 138 L 186 140" len={50}
            x={182} y={140} deg={183} color="#1f5560" w={2.2}/>
          <g className={off} style={still ? undefined : { '--d': '.7s', '--t': '7.4s' }}>
            <Arrow still={still} t={4.0} dur={0.7} d="M336 138 L 374 140" len={50}
              x={378} y={140} deg={3} color="#1f5560" w={2.2}/>
          </g>

          {/* the switch: on, then off */}
          <g className={cn(a, !still && 'iv-lift')}
            style={still ? undefined : { '--d': '.55s', '--t': '5.2s' }}>
            <rect x="424" y="212" width="78" height="38" rx="19" fill="#0a6e68"
              className={cn(!still && 'iv-a iv-switch')}
              style={still ? undefined : { '--d': '.6s', '--t': '6.9s' }}/>
            <circle cx="483" cy="231" r="14" fill="#ffffff"
              className={cn(!still && 'iv-a iv-knob')}
              style={still ? undefined : { '--d': '.6s', '--t': '6.9s' }}/>
          </g>
          <Spot cx={463} cy={231} r={52} t={6.6} still={still}/>
          <Chip x="463" y="286" t={5.7} still={still} size={16} tone="fill-ink-2">
            you switch it off
          </Chip>
        </svg>
      </div>
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
      {/* The line under the wordmark was a sentence, then the four signals
          were a list, then there was a disclaimer. Three blocks of type under
          a mark that has just resolved out of a day of readings is three
          things competing with the one thing worth watching. The signals stay,
          because they are the four colours the arch behind them is drawn in
          and that is the only place in the sequence where the rainbow and the
          product are the same object. The sentence and the disclaimer are on
          the page this lands on. */}

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


    </div>
  )
}

/* Six stages, one per beat. The two that went earlier were the seven-layer
   patch stack and the who-sees-what consent diagram: both are whole pages
   elsewhere, and a title sequence that explains an enclosure and a permission
   model on the way past is a sequence nobody finishes. The audience stage is
   not that diagram. It names three people and what each one is handed, which
   is the question the review actually asked. */
const STAGES = [StageOneNumber, StagePatch, StageFour, StageMarkOnDial,
  StageWays, StageShare, StageMark]

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
/* The vocabulary the walkthrough beats are drawn in. They opt out of the pace
   multiplier above: that multiplier exists because the original six beats were
   cued for a six-second beat and then stretched, and every cue in the six
   walkthrough stages is already authored in real seconds against its own
   beat's dwell. One place that multiplies and one place that does not is worse
   than two vocabularies, so the stages that want true seconds say so. */
.iv-root .iv-real{--iv-pace:1;--iv-dur:1}
/* A highlight. Two of these half a second apart is a pulse; one is a circle
   somebody drew and forgot about, and an infinite one is motion arguing with
   the thing it is pointing at. */
.iv-root .iv-ring{transform-box:fill-box;transform-origin:center;animation-name:iv-ring}
.iv-root .iv-lift{animation-name:iv-lift}
/* An object arriving from somewhere specific. --dx/--dy is where it comes
   from, so the patch can fly in off the arm and land on it rather than fading
   up in place, which would say nothing about where it goes. */
.iv-root .iv-glide{animation-name:iv-glide}
/* Readings walking down the wire. Three passes, not infinite: enough to read
   as a flow and over before the beat is. */
.iv-root .iv-run{offset-rotate:0deg;animation-name:iv-run;animation-iteration-count:3;animation-timing-function:cubic-bezier(.45,0,.55,1)}
.iv-root .iv-switch{animation-name:iv-switch}
.iv-root .iv-knob{animation-name:iv-knob}
@keyframes iv-ring{0%{opacity:0;transform:scale(.5)}30%{opacity:.95}100%{opacity:0;transform:scale(1.45)}}
@keyframes iv-lift{from{opacity:0;transform:translateY(18px)}}
@keyframes iv-glide{from{opacity:0;transform:translate(var(--dx,0),var(--dy,0))}}
@keyframes iv-run{0%{offset-distance:0%;opacity:0}12%{opacity:1}86%{opacity:1}100%{offset-distance:100%;opacity:0}}
@keyframes iv-switch{to{fill:#9fb9bd}}
@keyframes iv-knob{to{transform:translateX(-40px)}}
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
      /* Belt as well as braces. The 33px sideways scroll above came from one
         oversized node and that node is fixed, but a dialog whose words can be
         pushed off the screen by anything at all is a bug waiting to be
         reintroduced by the next drawing. onScroll puts it back. */
      onScroll={e => { e.currentTarget.scrollLeft = 0 }}
      className={cn('iv-root fixed inset-0 z-[400] flex flex-col overflow-hidden outline-none',
        'transition-opacity duration-[480ms] ease-out', exiting ? 'opacity-0' : 'opacity-100')}>
      <style>{CSS}</style>

      {/* The one continuous thing in the sequence. It sits under every beat
          and is the only transition between them; `beat` and the beat count
          are all it takes, so the cloud's walk re-spaces itself if a beat is
          ever added or removed. */}
      {/* The arch behind every beat was the only transition between them and
          it still is, but it was also the loudest thing on the screen. Six of
          these seven beats are now a diagram somebody is meant to read, and a
          full-strength rainbow behind a diagram is two pictures on one screen:
          a cloud landed on the word "Sweat", and the beat that shows the real
          dial had a second arch behind the first one. It holds the beats
          together at a quarter strength and comes back whole for the mark,
          which is the only beat that is a title card rather than a lesson.

          Off entirely for the dial. No opacity makes two concentric arches
          read as one object. */}
      {beat !== 3 && (
        <div aria-hidden className="pointer-events-none absolute inset-0 transition-opacity
          duration-[900ms]" style={{ opacity: beat === LAST ? 1 : 0.26 }}>
          <IntroSky beat={beat} count={BEATS.length}/>
        </div>
      )}

      {/* The announcement is its own node so the visible headline can be styled
          and swapped freely without a screen reader hearing it twice. */}
      <p aria-live="polite" aria-atomic="true" className="sr-only">{b.head + (b.sub ? ' ' + b.sub : '')}</p>

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
                  {/* Most beats have no second line at all. The sequence used
                      to carry thirty-word sub-lines under every heading and the
                      note back was that it was a wall of words moving too fast
                      to read; the answer was not a slower wall. Where a second
                      line survives it is because the beat teaches something the
                      drawing cannot say on its own, and it is under nine
                      words. */}
                  {/* The sub used to arrive 160ms behind the head, which is
                      not a gap — both lines land together and the eye picks
                      one. A second of separation is the difference between
                      reading two lines and glancing at a block. */}
                  {b.sub && (
                    <p className="iv-a iv-rise mt-2.5 max-w-[52ch] text-sec text-ink-2 sm:mt-3 sm:text-body"
                      style={{ '--d': '.7s', '--t': '.9s' }}>{b.sub}</p>
                  )}
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
