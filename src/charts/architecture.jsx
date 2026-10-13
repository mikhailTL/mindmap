import React from 'react'
import { Always, Never, Sometimes } from '../ui/marks'
import { TNAM_RESULTS as R } from '../signals/tnam-results'
import { MOVE_LIMIT_G } from '../signals/motion'
import { SENSOR_ORDER } from '../lib/sensors'
import { K_ANONYMITY, TIER_LABEL, tierOf } from '../lib/caseload'
import { LOCATION, NOTES, PRO, SCORE } from '../lib/terms'
import { cn } from '../lib/utils'

/* The figures on the Methods page. They live here so that page stays a page
 * rather than a drawing.
 *
 * Every label is HTML and no figure carries <text> inside its viewBox. Text in
 * a scaled SVG shrinks with the column, so a 12px label set to fit 1280px is a
 * 7px label at 390px, which fails the contrast sweep at the one width where it
 * matters most. The SVGs here hold shapes only and are aria-hidden; the reading
 * order is the HTML beside them.
 *
 * No figure invents a fact. The patch signals come from lib/sensors.js, the
 * k floor from lib/caseload.js, the audience names from lib/terms.js, and every
 * network figure from signals/tnam-results.js, which ml/research.py generates. A
 * change in any of those reaches these drawings instead of disagreeing with
 * them.
 *
 * Every label here is a label. A figure earns its place by what it draws, so
 * the words beside it name the parts and stop; the sentence that would have
 * explained the drawing is the drawing's failure, not its caption.
 *
 * NO ENTRANCE ANIMATION. These figures each carried a ScrollIn or a ScrollRow,
 * and the Methods bands that hold them carry their own, so the two opacity
 * animations multiplied on one subtree. A measured 1280 load of this page put
 * 261 text nodes at or near opacity 0 a second in, and the pair's product was
 * 0.76 x 0.76 = 0.575, where ink-3 small print reads 2.48 : 1 against the 4.5
 * it owes. The arrival watcher in ui/motion.jsx restores a hidden element on a
 * scroll event or a 1500ms fallback and nothing else, so a load that reflows
 * content into view leaves it faded for over a second. A figure is content, so
 * it is painted, not revealed; the band around it may animate.
 */

/* The one label style every box in these figures opens with: body face, no
   case or tracking games, ink-3. On paper 5.33 : 1, on aqua-2 4.66, on
   beam-wash 5.10, so it clears AA on each ground a Methods band uses. It is
   deliberately not `font-mono`: spec 0d bans a typewriter face on a label, and
   `font-code` is reserved for file paths and code identifiers. */
const TAG = 'text-tick text-ink-3'
const BOX = 'rounded-panel border border-rule bg-card p-4'

const pct1 = v => (v * 100).toFixed(1) + '%'
const f2 = v => v.toFixed(2)

/* ── 1. The three steps ─────────────────────────────────────────────────── */

/* Each step carries a figure and not a picture of itself. None of the three
   plots a reading, because there are no readings to plot: the first is the
   shape of one capture in seconds, the second is the scale every signal is
   converted to, and the third is the scale the answer lands on. The last two
   are read out of the code that enforces them, so a boundary moved there moves
   the drawing with it.
   The figure this replaced drew fourteen hand-written bar heights, which is
   invented data wearing a chart's clothes. */

const BASELINE_DAYS = 14
const CAPTURE_S = 30
const CAPTURE_TICKS = [0, 15, 30]
/* The phone route, which is the only one a visitor can take today. The lengths
   are the ones the capture code runs and the Methods page quotes. */
const LANES = [
  { tag: 'Rear camera',   secs: 30, bar: 'bg-accent' },
  { tag: 'Microphone',    secs: 15, bar: 'bg-beam' },
  { tag: 'Accelerometer', secs: 30, bar: 'bg-ink-3' },
]

/* A labelled axis under a scale. The two end labels are pulled inside their own
   ends: a centred label at the right-hand end paints past the card. */
function Ticks({ ticks, at, unit }) {
  const last = ticks.length - 1
  return (
    <div aria-hidden="true" className="relative mt-1 h-5">
      {ticks.map((t, i) => (
        <span key={t} style={{ left: `${at(t)}%` }}
          className={cn('absolute top-0 whitespace-nowrap text-tick tabular-nums text-ink-3',
            i === 0 ? 'translate-x-0' : i === last ? '-translate-x-full' : '-translate-x-1/2')}>
          {t}{unit}
        </span>
      ))}
    </div>
  )
}

function CaptureLanes() {
  const at = v => (v / CAPTURE_S) * 100
  return (
    <div>
      <ul className="m-0 grid list-none gap-2 p-0">
        {LANES.map(l => (
          <li key={l.tag}>
            <p className="flex items-baseline justify-between gap-3">
              <span className="text-fine leading-[1.3] text-ink-2">{l.tag}</span>
              <span className="text-tick tabular-nums text-ink-3">{l.secs} s</span>
            </p>
            <span className="mt-1 block h-2 w-full rounded-bar bg-mist">
              <span style={{ width: `${at(l.secs)}%` }} className={cn('block h-2 rounded-bar', l.bar)}/>
            </span>
          </li>
        ))}
      </ul>
      <Ticks ticks={CAPTURE_TICKS} at={at} unit=" s"/>
    </div>
  )
}

/* Minus three to plus three, which is where signals/score.js clamps. The band
   is the person's own ordinary range and the figure plots nothing inside it. */
const SD_LIMIT = 3
const SD_TICKS = [-3, -1, 0, 1, 3]

function BaselineScale() {
  const at = v => ((v + SD_LIMIT) / (SD_LIMIT * 2)) * 100
  return (
    <div>
      <div className="relative h-8 rounded-xs border border-rule bg-mist/50">
        <span aria-hidden="true" style={{ left: `${at(-1)}%`, width: `${at(1) - at(-1)}%` }}
          className="absolute inset-y-0 block border-x border-accent bg-accent/15"/>
        <span aria-hidden="true" style={{ left: `${at(0)}%` }}
          className="absolute inset-y-0 block w-0.5 -translate-x-1/2 bg-ink"/>
      </div>
      <Ticks ticks={SD_TICKS} at={at} unit=""/>
      <p className="mt-1 text-fine leading-[1.4] text-ink-3">
        Standard deviations from this person&rsquo;s own baseline. Shaded: their usual range.
        Clamped at <span className="tabular-nums text-ink-2">3</span>.
      </p>
    </div>
  )
}

/* The four bands, scanned off tierOf rather than typed, so the drawing cannot
   carry a boundary the code does not have. */
const SCORE_BANDS = (() => {
  const out = []
  let start = 0, cur = tierOf(0)
  for (let s = 1; s <= 100; s++) {
    const t = tierOf(s)
    if (t !== cur) { out.push({ tier: cur, from: start, to: s }); cur = t; start = s }
  }
  out.push({ tier: cur, from: start, to: 100 })
  return out
})()
const SCORE_TICKS = [0, 25, 50, 75, 100]

function ScoreScale() {
  const at = v => v
  return (
    <div>
      <div className="relative h-8 rounded-xs border border-rule bg-mist/50">
        {SCORE_BANDS.slice(1).map(b => (
          <span key={b.tier} aria-hidden="true" style={{ left: `${at(b.from)}%` }}
            className="absolute inset-y-0 block w-px bg-ink-3"/>
        ))}
        <span aria-hidden="true" style={{ left: `${at(50)}%` }}
          className="absolute inset-y-0 block w-0.5 -translate-x-1/2 bg-ink"/>
      </div>
      <Ticks ticks={SCORE_TICKS} at={at} unit=""/>
      <ul className="m-0 mt-1 grid list-none grid-cols-2 gap-x-3 gap-y-0.5 p-0">
        {SCORE_BANDS.map(b => (
          <li key={b.tier} className="text-fine leading-[1.35] text-ink-3">
            {TIER_LABEL[b.tier]}{' '}
            <span className="tabular-nums text-ink-2">{b.from} to {b.to}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const FIGURE = { capture: <CaptureLanes/>, baseline: <BaselineScale/>, score: <ScoreScale/> }
const FIG_UNIT = { capture: 'seconds', baseline: 'standard deviations', score: SCORE }

/* The plain reading of the whole method. Somebody who reads only this figure
   has to come away correct, so step one names all three inputs and the caption
   carries the thing a short reader would otherwise assume: no patch exists. */
const STEPS = [
  { n: 1, fig: 'capture', title: 'Taking a Reading',
    line: 'The patch, a phone camera and microphone, or six questions.',
    note: 'Drawn: one phone capture, the only route running today.' },
  { n: 2, fig: 'baseline', title: 'Two Weeks of Baseline',
    line: `Each signal as its distance from that person's own baseline.`,
    note: `${BASELINE_DAYS} days set the middle. Nobody is compared with anybody else.` },
  { n: 3, fig: 'score', title: 'One Number, One Sentence',
    line: `${SCORE}, 0 to 100. 50 is an ordinary day for that person.`,
    note: 'The bands name where a reading sits. They are not clinical cut-offs.' },
]

export function ThreeSteps({ className }) {
  return (
    <figure className={cn('m-0', className)}>
      <ol className="m-0 grid list-none gap-3 p-0 lg:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.n} className="h-full">
            <div className={cn(BOX, 'flex h-full flex-col p-5')}>
              <div className="flex items-baseline justify-between gap-4">
                <span className={TAG}>{s.n}</span>
                <span className={TAG}>{FIG_UNIT[s.fig]}</span>
              </div>
              <h3 className="mt-2 font-display text-head font-bold leading-[1.15] tracking-tight text-ink">
                {s.title}
              </h3>
              <p className="mt-2 text-sec leading-[1.5] text-ink-2">{s.line}</p>
              <div className="mt-auto pt-4">{FIGURE[s.fig]}</div>
              <p className="mt-2 border-t border-rule pt-2 text-fine leading-[1.4] text-ink-3">{s.note}</p>
            </div>
          </li>
        ))}
      </ol>
      <figcaption className="note mt-3.5 max-w-[62ch]">
        One scale, whichever way in. No patch has been built.
      </figcaption>
    </figure>
  )
}

/* ── 2. Movement, and why it takes a different path ─────────────────────── */

/* The fitted movement curve, read straight out of the results file rather than
   drawn by hand. It is the whole argument of the section it sits in: the curve
   rises, so the network reads movement as arousal, so a moving reading cannot be
   handed to it. Domain is the patch's own movement scale, where 1 is the
   MOVE_LIMIT_G line and everything past that line saturates at 1. */
const MC = R.shapes.motion
const MC_LO = Math.min(...MC.y)
const MC_HI = Math.max(...MC.y)
const MC_RISE = MC_HI - MC_LO
/* The plot runs x 8 to 280 and y 86 to 18 inside a 288 by 100 box. The box is
   fixed because the labels beside it are HTML positioned as percentages of it:
   1 viewBox unit is 1% of the drawing's height at every width. */
const MC_X0 = 8, MC_X1 = 280, MC_Y0 = 86, MC_Y1 = 18
const mcX = t => MC_X0 + t * (MC_X1 - MC_X0)
const mcY = v => MC_Y0 - ((v - MC_LO) / (MC_RISE || 1)) * (MC_Y0 - MC_Y1)
const MC_PATH = MC.x
  .map((xv, i) => (i ? 'L' : 'M') + mcX(xv).toFixed(1) + ' ' + mcY(MC.y[i]).toFixed(1))
  .join(' ')
/* The levels worth ruling: both ends of the fitted curve, and the level at
   which movement pushes the score neither way, when the curve crosses it. */
const MC_LEVELS = [
  { v: MC_HI, label: f2(MC_HI) },
  ...(MC_LO < 0 && MC_HI > 0 ? [{ v: 0, label: '0' }] : []),
  { v: MC_LO, label: f2(MC_LO) },
]

function MotionCurve() {
  return (
    <div className="flex gap-2">
      {/* The y labels are HTML: text inside a scaled viewBox shrinks with the
          column and fails the contrast sweep at 390. */}
      <div aria-hidden="true" className="relative w-9 shrink-0">
        {MC_LEVELS.map(l => (
          <span key={l.label} style={{ top: `${mcY(l.v)}%` }}
            className="absolute right-0 -translate-y-1/2 text-fine tabular-nums text-ink-3">
            {l.label}
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <svg viewBox="0 0 288 100" aria-hidden="true" focusable="false" className="block h-auto w-full">
          {MC_LEVELS.map(l => (
            <path key={l.label} d={`M${MC_X0} ${mcY(l.v).toFixed(1)} H${MC_X1}`} fill="none"
              className="stroke-rule" strokeWidth="1"/>
          ))}
          <path d={`M${MC_X0} 94 H${MC_X1}`} fill="none" className="stroke-ink-3" strokeWidth="1"/>
          <path d={`M${MC_X0} 94 V 10`} fill="none" className="stroke-ink-3" strokeWidth="1"/>
          <path d={MC_PATH} fill="none" className="stroke-ink" strokeWidth="2.4"
            strokeLinecap="round" strokeLinejoin="round"/>
          {/* where the curve meets the line past which no reading is scored by
              the network at all */}
          <path d={`M${MC_X1} 10 V 94`} fill="none" className="stroke-warn" strokeWidth="1.4"
            strokeDasharray="4 3"/>
          <circle cx={MC_X1} cy={mcY(MC_HI)} r="4" className="fill-warn stroke-card" strokeWidth="1.6"/>
        </svg>
        <div aria-hidden="true" className="mt-1 flex justify-between gap-3 text-fine text-ink-3">
          <span>still</span>
          <span>{MOVE_LIMIT_G} g and above</span>
        </div>
      </div>
    </div>
  )
}

/* Three systems, three measures, nine figures on one scale. Two of the three
   measures are false alarms and one is a catch, so they never share a bar
   colour, and each card says which direction is better once rather than
   restating it against every bar. */
const CONFOUND = [
  { id: 'formula', short: 'Hand formula alone', src: R.confound.formula },
  { id: 'raw', short: 'Model alone', src: R.confound.tnam_raw },
  { id: 'ships', short: 'Model, formula over the line', src: R.confound.tnam_fallback, ships: true },
]
const MEASURES = [
  { key: 'physical_flagged', label: 'Moving windows called stressed',
    better: 'Lower is better', bar: 'bg-warn' },
  { key: 'relax_flagged', label: 'Calm windows called stressed',
    better: 'Lower is better', bar: 'bg-warn' },
  { key: 'cognitive_caught', label: 'Cognitive stress still caught',
    better: 'Higher is better', bar: 'bg-accent' },
]
const PCT_TICKS = [0, 50, 100]

export function MovementFallback({ className }) {
  /* The curve and the three outcomes side by side at lg: the curve is the
     cause and the bars are the cost, and a reader who sees them together does
     not have to hold one in memory while scrolling to the other. */
  return (
    <div className={cn(className)}>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start lg:gap-5">
        <div className="min-w-0">
          <figure className={cn(BOX, 'm-0 h-full p-5')}>
            <p className={TAG}>The fitted movement curve, in the logit</p>
            <div className="mt-3"><MotionCurve/></div>
            <figcaption className="mt-3.5 max-w-[48ch] text-sec leading-[1.5] text-ink-2">
              Climbs{' '}
              <span className="tabular-nums text-ink">{MC_RISE.toFixed(2)}</span> from{' '}
              <span className="tabular-nums text-ink">{f2(MC_LO)}</span> to{' '}
              <span className="tabular-nums text-ink">{f2(MC_HI)}</span>: the network
              reading movement as arousal. Amber: the line past which it never scores a reading.
            </figcaption>
            <p className="mt-2 text-fine text-ink-3"><span className="font-code">TNAM_RESULTS.shapes.motion</span></p>
          </figure>
        </div>

        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-3">
          {MEASURES.map((m, i) => (
            <li key={m.key} className="h-full">
              <div className={cn(BOX, 'flex h-full flex-col p-5')}>
                <p className={TAG}>{m.better}</p>
                <h3 className="mt-1 font-display text-ui font-bold leading-[1.25] text-ink">{m.label}</h3>
                <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
                  {CONFOUND.map(c => (
                    <li key={c.id}>
                      <p className="flex items-baseline justify-between gap-2">
                        <span className="min-w-0 text-fine leading-[1.35] text-ink-2">
                          {c.short}
                          {c.ships ? <span className="ml-1.5 text-fine text-ink">ships</span> : null}
                        </span>
                        <span className="shrink-0 text-meta tabular-nums text-ink">
                          {pct1(c.src[m.key])}
                        </span>
                      </p>
                      <span className="mt-1.5 block h-2 w-full rounded-bar bg-mist">
                        <span className={cn('block h-2 rounded-bar', m.bar)}
                          style={{ width: `${Math.round(c.src[m.key] * 100)}%` }}/>
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <Ticks ticks={PCT_TICKS} at={v => v} unit="%"/>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className="note mt-3.5 max-w-[68ch]">
        Real jogging and rest data, from TNAM_RESULTS.confound, on one 0 to 100% scale. The third
        bar in each card is the shipped code.
      </p>
    </div>
  )
}
/* ── 3. Where each piece runs ───────────────────────────────────────────── */

/* A box inside the device panel. Nested rather than listed, because the point
   of the figure is containment: these things are inside the phone. */
function Nest({ label, count, items, className }) {
  return (
    <div className={cn('rounded-panel border border-rule bg-paper p-4', className)}>
      {/* The count is the part a reader can check against the list under it,
          and it is read off that list rather than typed beside it. */}
      <p className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className={TAG}>{label}</span>
        <span className="text-tick tabular-nums text-ink-3">{count}</span>
      </p>
      {/* The measure is restated on the item: this box runs the full width of the
          device panel, and at 1680 an uncapped line in it sets at about 95
          characters. Widening the page widens the layout, not the line. */}
      <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0">
        {items.map(t => (
          <li key={t} className="max-w-[62ch] text-sec leading-[1.45] text-ink">{t}</li>
        ))}
      </ul>
    </div>
  )
}

/* Down on a phone, right at lg, because the two panels sit side by side there.
   Two drawings rather than one rotated: a rotate paints outside the element's
   box and this element sits in the middle of a grid. */
function Flow({ label }) {
  return (
    <div className="flex items-center justify-center gap-2.5 lg:flex-col lg:gap-2">
      <svg viewBox="0 0 24 24" aria-hidden focusable="false" fill="none" stroke="currentColor"
        strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
        className="size-5 shrink-0 text-ink-2 lg:hidden">
        <path d="M12 3.5v16M6 13.5l6 6 6-6"/>
      </svg>
      <svg viewBox="0 0 24 24" aria-hidden focusable="false" fill="none" stroke="currentColor"
        strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
        className="hidden size-5 shrink-0 text-ink-2 lg:block">
        <path d="M3.5 12h16M13.5 6l6 6-6 6"/>
      </svg>
      <span className="text-tick text-ink-2 lg:max-w-[9rem] lg:text-center">{label}</span>
    </div>
  )
}

const ON_PATCH = ['Pulse, sweat, skin temperature and movement, off the upper arm.']
/* Three sensors, each with the length of capture the code runs, so this box and
   the capture figure in step one cannot drift apart. */
const ON_PHONE = [
  'Rear camera, 30 seconds, one number per frame.',
  'Microphone, 15 seconds, held in memory.',
  'Accelerometer, across the whole capture.',
]
const IN_PAGE = [
  'Filters and frequency estimates: signals/dsp.js, ppg.js, voice.js.',
  'The network: signals/tnam.js. One forward pass, no request, no worker.',
  `The baseline and calibration, in this browser’s storage.`,
]

/* Stated as absences, with the Never mark the privacy figures already use.
   Each line is checkable in the repository, which is the only reason to make
   a claim this strong. */
const NOT_THERE = [
  'No scoring endpoint, and no weights fetched over the wire.',
  `No account, and no store of anybody’s readings.`,
  'No analytics, and no third-party script.',
]

export function WhereItRuns({ className }) {
  return (
    <figure className={cn('m-0', className)}>
      <div className="grid gap-3.5 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,19rem)] lg:items-center lg:gap-5">

        <div className="min-w-0">
          <div className={cn(BOX, 'p-5')}>
            <p className={TAG}>On the device</p>
            <h3 className="mt-1.5 font-display text-head font-bold leading-[1.15] tracking-tight text-ink">
              The Whole Scoring Path
            </h3>
            <p className="mt-2 text-tick text-ink-3">
              Nothing inside this boundary is sent anywhere.
            </p>
            <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
              <Nest label="On the arm" count={`${SENSOR_ORDER.length} signals, 1 Hz`} items={ON_PATCH}/>
              <Nest label="In the hand" count={`${ON_PHONE.length} sensors`} items={ON_PHONE}/>
            </div>
            <Nest className="mt-3" label="In this page, in the browser"
              count={`${IN_PAGE.length} modules`} items={IN_PAGE}/>
          </div>
        </div>

        <Flow label="Survey answers only, and only if one is sent"/>

        <div className="min-w-0">
          <div className={cn(BOX, 'p-5')}>
            <p className={TAG}>On a server</p>
            <h3 className="mt-1.5 font-display text-head font-bold leading-[1.15] tracking-tight text-ink">
              One Optional Server Function
            </h3>
            <p className="mt-2 text-sec leading-[1.5] text-ink-2">
              api/responses.js takes the usability survey. The site is static and runs with that
              function off.
            </p>
            <p className="mt-3.5 border-t border-rule pt-3.5 text-tick text-ink-3">
              What crosses the boundary: {NOT_THERE.length} things do not
            </p>
            <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
              {NOT_THERE.map(t => (
                <li key={t} className="flex items-start gap-2.5 text-sec leading-[1.45] text-ink-2">
                  <Never aria-hidden className="mt-[0.15rem] size-4 text-ink-3"/>
                  <span className="min-w-0 flex-1">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <figcaption className="note mt-3.5 max-w-[68ch]">
        Three network calls exist in src/, all of them the survey. A {SCORE} needs none.
      </figcaption>
    </figure>
  )
}

/* ── 4. Data flow and who can see it ────────────────────────────────────── */

/* `life` is the axis the three boxes are really arranged on: the figure is
   about what outlives the capture, and only the third box does. `after` is what
   happens on the way to the next box, and it is drawn on the connector rather
   than written underneath it. */
const STAGES = [
  { tag: 'Measured', title: 'The Raw Sensor Channels',
    life: 'Lives for the capture', after: 'Nothing is written down yet',
    items: [
      'Patch: four signals, once a second.',
      'Camera: 30 seconds, one number per frame. Microphone: 15 seconds, in memory.',
      'Accelerometer: movement during the capture.',
    ] },
  { tag: 'Derived', title: 'Features Computed in the Capture',
    life: 'Lives for the capture', after: 'Every frame and sample is dropped',
    items: [
      'Heart rate, and a variation index that is not a clinical RMSSD.',
      'Capture quality, 0 to 1, which sets the band width.',
      `Pitch and steadiness. Peak movement against the ${MOVE_LIMIT_G} g line.`,
      `Each as a distance from this person’s own history, clamped to plus or minus 3.`,
    ] },
  { tag: 'Kept', title: 'Records Written to the Phone',
    life: 'Outlives the capture',
    items: [
      'A mean and variance per feature: mindmap.phone.baseline.',
      'Check-in answers: mindmap.phone.checkins, no raw signal.',
      'Nothing else. Every frame and sample becomes a number and is dropped, so no reading can be replayed.',
    ] },
]

function Chevron({ label }) {
  return (
    <span className="flex max-w-[8rem] flex-col items-center gap-1 text-center">
      <svg viewBox="0 0 24 24" aria-hidden focusable="false" fill="none" stroke="currentColor"
        strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
        className="size-5 shrink-0 text-ink-3">
        <path d="M9 5.5l6.5 6.5L9 18.5"/>
      </svg>
      <span className="text-fine leading-[1.35] text-ink-3">{label}</span>
    </span>
  )
}

/* Always / only with consent / never, the three states the privacy figure on
   the overview already names. The mark repeats the word in its own row rather
   than carrying it, so a reader of one panel never has to look away. */
const SEEN = [
  { who: 'Student', lead: 'Everything, and first.',
    rows: [
      [2, `Every reading, every number from it, their own ${NOTES}.`],
      [2, 'Each reading before anybody else has anything.'],
    ] },
  { who: 'Parent', lead: 'A day at a time, and only with consent.',
    rows: [
      [1, `The ${SCORE} for each day and for the week.`],
      [0, `${NOTES}, ${LOCATION}, raw readings, anything finer than a day.`],
    ] },
  { who: PRO, lead: 'Only what the consent record allows.',
    rows: [
      [1, `Per student, exactly as consented. A group under ${K_ANONYMITY} returns nothing.`],
      [2, 'Crisis alerts no guardian can consent away. An audit entry per record opened.'],
    ] },
]
const STATE = { 2: 'Always', 1: 'Only if the student agrees', 0: 'Never' }
const Mark = ({ v }) => (
  v === 2 ? <Always aria-hidden className="size-4 text-accent"/>
  : v === 1 ? <Sometimes aria-hidden className="size-4 text-accent"/>
  : <Never aria-hidden className="size-4 text-ink-3"/>
)

export function DataFlow({ className }) {
  return (
    <div className={cn(className)}>
      <figure className="m-0">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)]
          lg:items-stretch lg:gap-4">
          {STAGES.map((s, i) => (
            <React.Fragment key={s.tag}>
              {i > 0 && (
                <div className="hidden items-center justify-center lg:flex">
                  <Chevron label={STAGES[i - 1].after}/>
                </div>
              )}
              <div className="h-full min-w-0">
                <div className={cn(BOX, 'flex h-full flex-col p-5')}>
                  <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className={TAG}>{s.tag}</span>
                    <span className="text-tick text-ink-3">{s.life}</span>
                  </p>
                  <h3 className="mt-1.5 font-display text-row font-bold leading-[1.2] tracking-tight text-ink">
                    {s.title}
                  </h3>
                  <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
                    {s.items.map(t => (
                      <li key={t} className="border-t border-rule pt-2 text-sec leading-[1.45] text-ink-2">
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <figcaption className="note mt-3.5 max-w-[68ch]">
          Only the third box survives the reading. The first two last as long as the capture.
        </figcaption>
      </figure>

      <p className="mark mt-7">Who can see each thing</p>
      <div className="mt-3.5 grid auto-rows-fr gap-3 lg:grid-cols-3">
        {SEEN.map((p, i) => (
          <div key={p.who} className="h-full">
            <div className={cn(BOX, 'flex h-full flex-col p-5')}>
              <h3 className="font-display text-head font-bold leading-[1.15] tracking-tight text-ink">
                {p.who}
              </h3>
              <p className="mt-1 text-sec text-ink-2">{p.lead}</p>
              <ul className="m-0 mt-3.5 flex list-none flex-col gap-3 p-0">
                {p.rows.map(([v, t]) => (
                  <li key={t} className="grid grid-cols-[1rem_minmax(0,1fr)] items-start gap-3">
                    <span className="mt-[0.2rem]"><Mark v={v}/></span>
                    <span className="min-w-0">
                      <span className={cn('block font-display text-fine font-bold',
                        v === 0 ? 'text-ink-3' : 'text-accent')}>{STATE[v]}</span>
                      <span className={cn('mt-0.5 block text-sec leading-[1.45]',
                        v === 0 ? 'text-ink-2' : 'text-ink')}>{t}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
