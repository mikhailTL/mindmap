import React from 'react'
import { Always, Never, Sometimes } from '../ui/marks'
import { ScrollIn, ScrollRow } from '../ui/motion'
import { TNAM_RESULTS as R } from '../signals/tnam-results'
import { MOVE_LIMIT_G } from '../signals/motion'
import { K_ANONYMITY } from '../lib/caseload'
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
 * model figure from signals/tnam-results.js, which ml/research.py generates. A
 * change in any of those reaches these drawings instead of disagreeing with
 * them.
 */

/* Mono, ink-3: the one label style every box in these figures opens with. On
   paper 5.33 : 1, on aqua-2 4.66, on beam-wash 5.10, so it clears AA on each
   ground a Methods band uses. */
const TAG = 'font-mono text-tick text-ink-3'
const BOX = 'rounded-panel border border-rule bg-card p-4'

const pct = v => Math.round(v * 100) + '%'
const pct1 = v => (v * 100).toFixed(1) + '%'

/* ── 1. The three steps ─────────────────────────────────────────────────── */

/* Fourteen bars with a band behind them and the last one lit: the figure for
   "compared with your own two weeks". Drawn in a loop and sliced to
   BASELINE_DAYS, so the figure cannot carry a different number of days from the
   prose beside it. */
const BASELINE_DAYS = 14
const BARS = [9, 13, 7, 11, 15, 8, 12, 10, 14, 9, 12, 8, 11, 24]

function CompareGlyph() {
  const h = BARS.slice(0, BASELINE_DAYS)
  return (
    <svg viewBox="0 0 120 40" aria-hidden focusable="false" className="h-[52px] w-auto">
      {/* the band the first thirteen days describe */}
      <rect x="2" y="16" width="116" height="12" rx="3" className="fill-mist"/>
      {h.map((v, i) => (
        <rect key={i} x={4 + i * 8.2} y={34 - v} width="5.4" height={v} rx="1.6"
          className={i === h.length - 1 ? 'fill-accent' : 'fill-ink-3'}/>
      ))}
      <path d="M2 34 H118" fill="none" className="stroke-ink-3" strokeWidth="1"/>
    </svg>
  )
}

const GLYPH = {
  /* Left to right: the patch, then a phone. The two things a reading is taken
     with, drawn in the same hand as the three doors on the overview. */
  read: (
    <svg viewBox="0 0 120 56" aria-hidden focusable="false" className="h-[52px] w-auto">
      <rect x="2" y="14" width="56" height="28" rx="14" className="fill-card stroke-ink" strokeWidth="1.6"/>
      <rect x="16" y="20" width="28" height="16" rx="8" className="fill-mist stroke-ink-3" strokeWidth="1.2"/>
      <circle cx="30" cy="28" r="3.4" className="fill-accent"/>
      <rect x="78" y="4" width="30" height="48" rx="6" className="fill-card stroke-ink" strokeWidth="1.6"/>
      <rect x="84" y="10" width="18" height="18" rx="4" className="fill-ink"/>
      <circle cx="90" cy="19" r="3.2" className="fill-accent"/>
      <circle cx="98" cy="19" r="2.2" className="fill-beam"/>
      <path d="M84 40 q5 -7 9 0 t9 0" fill="none" className="stroke-ink-3" strokeWidth="1.4"/>
    </svg>
  ),
  compare: <CompareGlyph/>,
  /* The arch with a mark on it and the sentence under it, which is the order
     the student screen puts them in: sentence first, number second. */
  one: (
    <svg viewBox="0 0 120 56" aria-hidden focusable="false" className="h-[52px] w-auto">
      <path d="M12 38 A 36 36 0 0 1 84 38" fill="none" className="stroke-ruling" strokeWidth="5"
        strokeLinecap="round"/>
      <path d="M12 38 A 36 36 0 0 1 36 4.3" fill="none" className="stroke-accent" strokeWidth="5"
        strokeLinecap="round"/>
      <circle cx="48" cy="38" r="4" className="fill-ink"/>
      <path d="M48 38 V 8" fill="none" className="stroke-ink" strokeWidth="1.6"/>
      <rect x="12" y="46" width="72" height="4" rx="2" className="fill-mist"/>
      <rect x="12" y="46" width="44" height="4" rx="2" className="fill-ink-3"/>
      <rect x="96" y="20" width="18" height="18" rx="3" className="fill-accent"/>
    </svg>
  ),
}

/* The plain reading of the whole method. Somebody who reads only this figure
   has to come away correct, so step one names all three inputs and the caption
   carries the thing a short reader would otherwise assume: no patch exists. */
const STEPS = [
  { n: 1, glyph: 'read', title: 'A reading is taken',
    line: `From the patch on the arm, from a phone camera and microphone in about
      forty-five seconds, or from six questions with no sensor at all.` },
  { n: 2, glyph: 'compare', title: 'It is set against your own two weeks',
    line: `Each signal becomes its distance from that person's own fourteen-day baseline, so
      zero is an ordinary day for them. Nobody is measured against anybody else.` },
  { n: 3, glyph: 'one', title: 'One number and one sentence come back',
    line: `Those distances go through the ${SCORE} model, which runs in this page, and come back
      as one number, 0 to 100, with a sentence saying what moved it.` },
]

export function ThreeSteps({ className }) {
  return (
    <figure className={cn('m-0', className)}>
      <ol className="m-0 grid list-none gap-3.5 p-0 lg:grid-cols-3">
        {STEPS.map((s, i) => (
          <ScrollRow key={s.n} index={i} as="li" className="h-full">
            <div className={cn(BOX, 'flex h-full flex-col p-5')}>
              <div className="flex items-start justify-between gap-4">
                <span className={TAG}>Step {s.n}</span>
                <span aria-hidden>{GLYPH[s.glyph]}</span>
              </div>
              <h3 className="mt-4 font-display text-head font-bold leading-[1.15] tracking-tight text-ink">
                {s.title}
              </h3>
              <p className="mt-2.5 text-sec leading-[1.5] text-ink-2">{s.line}</p>
            </div>
          </ScrollRow>
        ))}
      </ol>
      <figcaption className="note mt-4 max-w-[62ch]">
        Three ways in, one scale. Which of the three exist as running code is set out further down
        this page, and no patch has been built.
      </figcaption>
    </figure>
  )
}

/* ── 2. Movement, and why it takes a different path ─────────────────────── */

/* The fitted movement curve, read straight out of the results file rather than
   drawn by hand. It is the whole argument of the section it sits in: the curve
   rises, so the model reads movement as arousal, so a moving reading cannot be
   handed to it. Domain is the patch's own movement scale, where 1 is the
   MOVE_LIMIT_G line and everything past that line saturates at 1. */
const MC = R.shapes.motion
const MC_LO = Math.min(...MC.y)
const MC_HI = Math.max(...MC.y)
const MC_RISE = MC_HI - MC_LO
const MC_PATH = MC.x
  .map((xv, i) => {
    const px = 8 + xv * 272
    const py = 86 - ((MC.y[i] - MC_LO) / (MC_RISE || 1)) * 68
    return (i ? 'L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1)
  })
  .join(' ')

function MotionCurve() {
  return (
    <svg viewBox="0 0 288 100" aria-hidden focusable="false" className="block h-auto w-full">
      {/* the curve's own starting level, carried across, so the rise is read
          against something rather than estimated */}
      <path d="M8 86 H280" fill="none" className="stroke-ruling" strokeWidth="1" strokeDasharray="3 3"/>
      <path d="M8 94 H280" fill="none" className="stroke-ink-3" strokeWidth="1"/>
      <path d={MC_PATH} fill="none" className="stroke-ink" strokeWidth="2.4"
        strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="280" cy={86 - 68} r="4" className="fill-warn"/>
      <path d="M280 10 V 94" fill="none" className="stroke-warn" strokeWidth="1.4" strokeDasharray="4 3"/>
    </svg>
  )
}

/* Three systems, two measures. Lower is better on the first and higher on the
   second, which is why the two measures never share a bar colour. Both are
   graphics and clear the 3 : 1 a non-text mark needs; the figure beside each
   bar is ink. */
const CONFOUND = [
  { id: 'formula', name: 'The hand formula alone', src: R.confound.formula },
  { id: 'raw', name: 'The model alone', src: R.confound.tnam_raw },
  { id: 'ships', name: 'What ships: the model, with the formula over the line', src: R.confound.tnam_fallback },
]
const MEASURES = [
  { key: 'physical_flagged', label: 'Moving windows called stressed', hint: 'lower is better', bar: 'bg-warn' },
  { key: 'cognitive_caught', label: 'Cognitive stress still caught', hint: 'higher is better', bar: 'bg-accent' },
]

export function MovementFallback({ className }) {
  return (
    <div className={cn(className)}>
      <ScrollIn>
        <figure className={cn(BOX, 'm-0 p-5')}>
          <p className={TAG}>The fitted movement curve</p>
          <div className="mt-3"><MotionCurve/></div>
          <div className="mt-1 flex justify-between gap-3 font-mono text-tick text-ink-3">
            <span>still</span>
            <span>{MOVE_LIMIT_G} g and above</span>
          </div>
          <figcaption className="mt-4 max-w-[62ch] text-sec leading-[1.5] text-ink-2">
            One of the ten fitted curves, read out of the results file. It climbs by{' '}
            <span className="font-mono tabular-nums text-ink">{MC_RISE.toFixed(2)}</span> in the
            logit across the movement range, which is the model saying that movement is arousal.
            The training set had no condition where somebody exercised calmly, so it had no way to
            learn otherwise.
          </figcaption>
        </figure>
      </ScrollIn>

      <ul className="m-0 mt-3.5 grid list-none gap-3.5 p-0 lg:grid-cols-3">
        {CONFOUND.map((c, i) => (
          <ScrollRow key={c.id} index={i} as="li" className="h-full">
            <div className={cn(BOX, 'flex h-full flex-col p-5')}>
              <h3 className="font-display text-ui font-bold leading-[1.25] text-ink">{c.name}</h3>
              <div className="mt-4 flex flex-col gap-4">
                {MEASURES.map(m => (
                  <div key={m.key}>
                    <p className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 text-fine leading-[1.4] text-ink-2">{m.label}</span>
                      <span className="shrink-0 font-mono text-meta tabular-nums text-ink">
                        {pct1(c.src[m.key])}
                      </span>
                    </p>
                    <span className="mt-1.5 block h-2 w-full rounded-bar bg-mist">
                      <span className={cn('block h-2 rounded-bar', m.bar)}
                        style={{ width: `${Math.round(c.src[m.key] * 100)}%` }}/>
                    </span>
                    <p className="mt-1 text-fine text-ink-3">{m.hint}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollRow>
        ))}
      </ul>
      <p className="note mt-4 max-w-[68ch]">
        Real jogging data. Every figure from TNAM_RESULTS.confound. The third card is what the code
        does today.
      </p>
    </div>
  )
}

/* ── 3. Where each piece runs ───────────────────────────────────────────── */

/* A box inside the device panel. Nested rather than listed, because the point
   of the figure is containment: these things are inside the phone. */
function Nest({ label, items, className }) {
  return (
    <div className={cn('rounded-panel border border-rule bg-paper p-4', className)}>
      <p className={TAG}>{label}</p>
      {/* The measure is restated on the item: this box runs the full width of the
          device panel, and at 1680 an uncapped line in it sets at about 95
          characters. Widening the page widens the layout, not the line. */}
      <ul className="m-0 mt-2.5 flex list-none flex-col gap-1.5 p-0">
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
      <span className="font-mono text-tick text-ink-2 lg:max-w-[9rem] lg:text-center">{label}</span>
    </div>
  )
}

const ON_PATCH = [
  'Pulse, sweat, skin temperature and movement, read off the upper arm.',
  'Firmware advertising the Nordic UART service the browser looks for.',
]
const ON_PHONE = [
  'Rear camera with the torch on where the phone allows it.',
  'Microphone, held in memory and never written anywhere.',
  'Accelerometer, which decides which way a reading is scored.',
]
const IN_PAGE = [
  'The filters and the frequency estimates: signals/dsp.js.',
  'Heart rate and beat-to-beat variation: signals/ppg.js. Pitch and steadiness: signals/voice.js.',
  'The model: signals/tnam.js and the weights beside it. Plain JavaScript, one forward pass per reading, no request and no worker.',
  `The ${SCORE} itself: signals/score.js for a capture, lib/engine.js for the six questions.`,
  'The running baseline and this person’s own calibration, in this browser’s own storage. Neither leaves it.',
]

/* Stated as absences, with the Never mark the privacy figures already use.
   Each line is checkable in the repository, which is the only reason to make
   a claim this strong. */
const NOT_THERE = [
  'No scoring endpoint, and no model fetched over a network.',
  'No account, no login, no profile.',
  'No store of anybody’s readings.',
  'No analytics, and no third-party script of any kind.',
]

export function WhereItRuns({ className }) {
  return (
    <figure className={cn('m-0', className)}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,19rem)] lg:items-center lg:gap-6">

        <ScrollIn className="min-w-0">
          <div className={cn(BOX, 'p-5')}>
            <p className={TAG}>On the device</p>
            <h3 className="mt-2 font-display text-head font-bold leading-[1.15] tracking-tight text-ink">
              Everything that produces a score
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Nest label="On the arm" items={ON_PATCH}/>
              <Nest label="In the hand" items={ON_PHONE}/>
            </div>
            <Nest className="mt-3" label="In this page, in the browser" items={IN_PAGE}/>
          </div>
        </ScrollIn>

        <Flow label="Survey answers only"/>

        <ScrollIn className="min-w-0">
          <div className={cn(BOX, 'p-5')}>
            <p className={TAG}>On a server</p>
            <h3 className="mt-2 font-display text-head font-bold leading-[1.15] tracking-tight text-ink">
              One function, and it is optional
            </h3>
            <p className="mt-2.5 text-sec leading-[1.5] text-ink-2">
              api/responses.js takes the usability survey. The site is built and served as static
              files and runs with that function switched off.
            </p>
            <ul className="m-0 mt-4 flex list-none flex-col gap-2 border-t border-rule p-0 pt-4">
              {NOT_THERE.map(t => (
                <li key={t} className="flex items-start gap-2.5 text-sec leading-[1.45] text-ink-2">
                  <Never aria-hidden className="mt-[0.15rem] size-4 text-ink-3"/>
                  <span className="min-w-0 flex-1">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </ScrollIn>
      </div>

      <figcaption className="note mt-4 max-w-[68ch]">
        Three network calls exist in the whole of src/: one posts a survey answer, one mails a
        finished response, and one reads them back for the results page. A {SCORE} needs none of
        them.
      </figcaption>
    </figure>
  )
}

/* ── 4. Data flow and who can see it ────────────────────────────────────── */

const STAGES = [
  { tag: 'Measured', title: 'What the sensors give',
    items: [
      'Patch: pulse, sweat, skin temperature and movement, once a second.',
      'Camera: one number per frame, the mean red channel over the middle of the sensor, for 30 seconds.',
      'Microphone: 15 seconds of samples, held in memory.',
      'Accelerometer: movement magnitude while the capture runs.',
    ] },
  { tag: 'Derived', title: 'What is computed from it',
    items: [
      'Heart rate, and a beat-to-beat variation index that is not a clinical RMSSD.',
      'Capture quality, 0 to 1, which decides how wide the band is.',
      'Pitch, pitch range, pitch steadiness, loudness steadiness.',
      `Peak movement in g, against the ${MOVE_LIMIT_G} g line.`,
      'Each of those as a distance from this person’s own history, clamped to plus or minus 3.',
    ] },
  { tag: 'Kept', title: 'What is written down',
    items: [
      'A running mean and variance per feature, under mindmap.phone.baseline in this browser.',
      'Check-in answers, under mindmap.phone.checkins: what the model saw and what the person said, with no raw signal. These are what the personal calibration is fitted from.',
      'Nothing else. Every camera frame and every audio sample is reduced to a number and dropped, so no reading can be replayed.',
    ] },
]

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      className="size-5 shrink-0 text-ink-3">
      <path d="M9 5.5l6.5 6.5L9 18.5"/>
    </svg>
  )
}

/* Always / only with consent / never, the three states the privacy figure on
   the overview already names. The mark repeats the word in its own row rather
   than carrying it, so a reader of one panel never has to look away. */
const SEEN = [
  { who: 'Student', lead: 'Everything, and first.',
    rows: [
      [2, `Every reading second by second, every number derived from it, and their own ${NOTES}.`],
      [2, 'Each reading before anybody else has anything at all.'],
    ] },
  { who: 'Parent', lead: 'A day at a time, and only with consent.',
    rows: [
      [1, `The ${SCORE} for each day and for the week.`],
      [1, 'Whether a day ran above that person’s own usual range.'],
      [0, `${NOTES}, ${LOCATION}, and anything said near the microphone.`],
      [0, 'Any raw reading, and anything finer-grained than a day.'],
    ] },
  { who: PRO, lead: 'Only what the consent record allows.',
    rows: [
      [1, `A ${SCORE}, week-over-week movement, or raw readings, per student, exactly as consented.`],
      [0, `A group of fewer than ${K_ANONYMITY} students, which returns nothing.`],
      [2, 'Crisis alerts, which no guardian can consent away, and students are told so first.'],
      [2, 'An audit entry for every record opened. No setting turns it off.'],
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
                <div className="hidden items-center justify-center lg:flex"><Chevron/></div>
              )}
              <ScrollRow index={i} className="h-full min-w-0">
                <div className={cn(BOX, 'flex h-full flex-col p-5')}>
                  <p className={TAG}>{s.tag}</p>
                  <h3 className="mt-2 font-display text-row font-bold leading-[1.2] tracking-tight text-ink">
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
              </ScrollRow>
            </React.Fragment>
          ))}
        </div>
        <figcaption className="note mt-4 max-w-[68ch]">
          Only the third box survives the reading. The first two exist for as long as the capture
          takes.
        </figcaption>
      </figure>

      <p className="mark mt-10">Who can see each thing</p>
      <div className="mt-4 grid auto-rows-fr gap-3.5 lg:grid-cols-3">
        {SEEN.map((p, i) => (
          <ScrollRow key={p.who} index={i} className="h-full">
            <div className={cn(BOX, 'flex h-full flex-col p-5')}>
              <h3 className="font-display text-head font-bold leading-[1.15] tracking-tight text-ink">
                {p.who}
              </h3>
              <p className="mt-1.5 text-sec text-ink-2">{p.lead}</p>
              <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
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
          </ScrollRow>
        ))}
      </div>
      <p className="note mt-4 max-w-[68ch]">
        {pct(R.exams.motion_rejected)} of windows were dropped for wrist movement across the{' '}
        {R.exams.spearman_flagged_vs_grade.n} exams in TNAM_RESULTS.exams. A dropped window is one
        nobody ever sees.
      </p>
    </div>
  )
}
