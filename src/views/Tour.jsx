import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { DemoNotice } from '../ui/notice'
import { Table, THead, TBody, TR, TH, TD } from '../ui/table'
import { ArrowLeft, ArrowRight, Never } from '../ui/marks'
import { ExplodedStack, LAYERS } from './Patch'
import { ScrollIn, ScrollRow } from '../ui/motion'
import { PHOTOS } from '../lib/photos'
import { RainbowDial } from '../charts/rainbow'
import { SignalTrace, WeekStrip } from '../charts/infographics'
import { studentRings } from '../lib/readings'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { roster, triage, scoreOnly, alertsOnly, tierOf, TIER_LABEL, K_ANONYMITY }
  from '../lib/caseload'
import { DATA } from '../lib/assets'
import { cn } from '../lib/utils'
import {
  SCORE, SCORE_RANGE, NOTES, LOCATION, CASELOAD_TITLE, CASELOAD_DEF,
  PRO, PRO_LC, PRO_PLURAL_LC, CONSENT_SHORT,
} from '../lib/terms'

/* The guided tour, in eight stops. This is the route "Other" lands on from the
 * entry chooser, so for a share of visitors it is the first real page of the
 * site, and it is held to docs/design-spec.md like any other surface.
 *
 * What changed in this pass, and why:
 *   - The page predated the spec. Section padding was py-14, the stop grid ran
 *     gap-10 / lg:gap-14 and the closer opened on mt-20, so one stop filled
 *     about a third of its own band and the rest was paper. Padding is now the
 *     spec's py-10 / lg:py-14 cap through Band, gaps are gap-3 / lg:gap-4.
 *   - Every stop was a column of ledes set directly on the band beside a
 *     figure set directly on the band. Spec 2 allows a heading there and
 *     nothing else, so each stop is now a rail of containers (a photograph, a
 *     card of labelled facts, the route out) against the figure in its own
 *     card, which is also what makes every stop two columns at 1280.
 *   - The ledes were paragraphs, which spec 4 does not allow anywhere on the
 *     marketing pages. Each one is now a single line plus three or four
 *     labelled rows, so the same stop carries more true statements in less
 *     height than the prose did.
 *   - Stop five opened by naming an invented teenager. Requirement B5 is that
 *     no invented person's name appears anywhere on the site, so the line
 *     names the relationship instead, which is the wording that
 *     views/parent-dash.jsx already uses for the same reader, and the count
 *     under the strip follows it from "her" to "their".
 *   - Stop eight stated its assumptions and drew nothing. It now carries the
 *     arithmetic those assumptions imply, with the unit and the provenance of
 *     every row, which is what spec 8b asks of a figure.
 *
 * Every stop still renders the live component the real screen runs, or a
 * drawing of the real part, never a recording or a mockup. The HONESTY stop is
 * the list of everything on this site that is not real; keep it current.
 *
 * The current stop is deliberately NOT in the URL. The router matches the whole
 * hash against a fixed list of view names, so `#/tour/3` or any sub-path,
 * query or suffix fails the match and lands the visitor on the overview.
 * Deep-linking a stop requires changing the router first. */

/* Containers, per spec 2. One ground, because the tour has no ink band. */
const PANEL = 'overflow-hidden rounded-panel border border-rule bg-card'

/* Arithmetic, not a measurement: 1 Hz over a seven-hour school day, and then
   that figure across one assumed caseload. Computed rather than typed, so the
   numbers in stop one and stop eight cannot drift apart. */
const SCHOOL_HOURS = 7
const PER_DAY = SCHOOL_HOURS * 60 * 60
const CASELOAD_ASSUMED = 400
const num = n => n.toLocaleString('en-US')

/* Intrinsic size per key, so the browser holds the box before the file lands.
   Same numbers views/Overview.jsx keeps for the frames it owns. */
const DIMS = {
  'clinic-talk':      [1600, 1066],
  'parent-laptop':    [1600, 1066],
  'student-homework': [1592, 1194],
  'students-hallway': [1600, 1068],
}

/* Every frame is a licensed stock photograph of models. Nobody in one uses
 * MindMap, nobody is wearing the patch, and no alt text here may say or imply
 * otherwise. The tour prints that out loud once, on the first stop.
 *
 * Eager at every stop: Radix mounts only the open tab, so at most one of these
 * is ever in the tree and it is always above the fold when its tab opens. Lazy
 * would hand a judge an empty box on every tab switch.
 *
 * max-w-none is load-bearing: Tailwind's preflight sets img { max-width: 100% }
 * and that undoes a frame set to fill a box wider than its own file. */
function PhotoCard({ photo, alt, className }) {
  const src = PHOTOS[photo]
  if (!src || !alt) return null
  const [w, h] = DIMS[photo] || [1600, 1066]
  return (
    <div className={cn(PANEL, 'h-[152px] lg:h-[172px]', className)}>
      <img src={src} alt={alt} width={w} height={h} loading="eager" decoding="async"
        className="block h-full w-full max-w-none object-cover"/>
    </div>
  )
}

/* The rail's workhorse: a card of labelled rows. A label and its value, never a
   label over a value, so a row costs one line of height wherever it fits. */
function Facts({ rows, className }) {
  return (
    <div className={cn(PANEL, className)}>
      {rows.map(([label, value], i) => (
        <div key={label} className={cn('px-3.5 py-2', i && 'border-t border-rule')}>
          <p className="font-display text-fine font-bold leading-tight text-ink">{label}</p>
          <p className="mt-0.5 text-meta leading-[1.35] text-ink-2">{value}</p>
        </div>
      ))}
    </div>
  )
}

/* A figure's own container. Spec 2: no figure sits on the band.
 *
 * h-full and a column: the rail beside it is a photograph, a card of facts and
 * a button, and on the shorter stops it is the taller of the two tracks. Left
 * to its content the figure card stopped 230px above the rail's foot at 1280
 * and the band showed paper through the gap, which is the hole spec 1 counts
 * against a section. The figures that are shorter than the rail push their own
 * caption to the foot with mt-auto instead. */
function Fig({ children, className }) {
  return <div className={cn(PANEL, 'flex h-full flex-col p-3.5 lg:p-4', className)}>{children}</div>
}

/* ── 01 ─────────────────────────────────────────────────────────────────── */
/* Nothing in this figure is a statistic, and the caption must keep saying the
   drawing is a drawing. */
function EvidenceGap() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const rows = [
    { label: 'What an adult has to go on', on: [2], count: '1 of 7 days' },
    { label: 'What the patch records',     on: [0, 1, 2, 3, 4, 5, 6], count: '7 of 7 days' },
  ]
  return (
    <figure className="m-0 flex h-full flex-col">
      {rows.map((r, ri) => (
        <div key={r.label} className={cn(ri && 'mt-4')}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
            <p className="font-display text-fine font-bold leading-tight text-ink">{r.label}</p>
            <p className="font-mono text-fine tabular-nums text-ink-3">{r.count}</p>
          </div>
          <div className="mt-2 flex gap-1.5" role="img"
            aria-label={`${r.label}: ${r.on.length} of seven days`}>
            {days.map((d, i) => (
              <div key={i} className="flex-1 text-center">
                <div className={cn('h-12 rounded-xs border border-rule lg:h-16',
                  r.on.includes(i) ? 'border-accent bg-accent' : 'bg-mist')}/>
                <span className="mt-1 block text-fine text-ink-3">{d}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <figcaption className="mt-auto border-t border-rule pt-2.5 text-fine leading-[1.4] text-ink-3">
        A drawing, not data. The lower row is one reading a second:{' '}
        <span className="font-mono tabular-nums text-ink-2">{num(PER_DAY)}</span>{' '}
        readings in a {SCHOOL_HOURS} hour school day, per student.
      </figcaption>
    </figure>
  )
}

/* ── 02 ─────────────────────────────────────────────────────────────────── */
/* ExplodedStack owns its own scroll motion and its own reduced-motion branch.
   Do not write transforms onto `.lyr` here. */
function Hardware() {
  return (
    <figure className="m-0 flex h-full flex-col">
      <ExplodedStack className="h-[min(44vh,360px)] w-full" caption={null}
        size="w-[min(94%,420px)]"/>
      <figcaption className="mt-auto border-t border-rule pt-2.5 text-fine leading-[1.4] text-ink-3">
        Shell, electronics pod, skin-side base. Drawn to the real dimensions.
        No unit has been assembled.
      </figcaption>
    </figure>
  )
}

/* ── 03 ─────────────────────────────────────────────────────────────────── */
/* Copy comes from lib/sensors.js. Do not retype it here, or the patch page and
   the tour describe the same sensor two different ways. `short` rather than
   `about`: `about` is three sentences and spec 4 allows no paragraph here. */
function Signals() {
  return (
    <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:gap-4">
      {SENSOR_ORDER.map((id, i) => {
        const s = SENSORS[id]
        return (
          <ScrollRow key={id} as="li" index={i} className="h-full">
            <div className={cn(PANEL, 'flex h-full flex-col p-3.5')}>
              <div className="flex items-center gap-2.5">
                <s.icon aria-hidden className="size-5 shrink-0" style={{ color: s.glow }}/>
                <h3 className="font-display text-row font-bold leading-tight text-ink">{s.name}</h3>
                <span className="ml-auto font-mono text-fine tabular-nums text-ink-3">{s.unit}</span>
              </div>
              <SignalTrace kind={id} className="mt-2.5"/>
              <p className="mt-2.5 text-meta leading-[1.35] text-ink-2">{s.short}</p>
            </div>
          </ScrollRow>
        )
      })}
    </ul>
  )
}

/* ── 06 ─────────────────────────────────────────────────────────────────── */
/* The check-in list plus the students consent keeps off it. Every count is read
 * off the same fixture the medical professional console reads, so the rail
 * cannot claim a consent split the list does not show.
 *
 * No position numerals: a column of ranks is a leaderboard whatever the heading
 * says. Order is largest change first. */
function Caseload() {
  const moved = triage()
  const held = [...scoreOnly(), ...alertsOnly()]
  return (
    <div>
      <p className="font-display text-fine font-bold leading-tight text-ink">{CASELOAD_TITLE}</p>
      <ol className="m-0 mt-2 list-none p-0">
        {moved.map(s => {
          const tier = tierOf(s.current)
          return (
            <li key={s.id} className="grid grid-cols-[minmax(0,1fr)_5rem_2.75rem] items-center
              gap-3 border-t border-rule py-2">
              <span className="min-w-0">
                <span className="block truncate font-display text-meta font-medium text-ink">
                  {s.name}</span>
                <span className="mt-1 block h-2 w-full rounded-bar bg-rule/70">
                  <span className={cn('block h-2 rounded-bar',
                    tier === 'crisis' ? 'bg-crit' : tier === 'high' ? 'bg-warn' : 'bg-accent')}
                    style={{ width: `${s.current}%` }}/>
                </span>
              </span>
              <span className="text-fine text-ink-2">{TIER_LABEL[tier]}</span>
              {/* Change since last week orders the list, so it is the figure on
                  the row: the score alone makes the order look wrong. */}
              <span className="text-right font-mono text-fine tabular-nums text-ink">
                {s.velocity > 0 ? '+' : ''}{s.velocity}</span>
            </li>
          )
        })}
      </ol>
      <p className="mt-3 border-t border-rule pt-2.5 font-display text-fine font-bold
        leading-tight text-ink">Consented out of this list</p>
      <ul className="m-0 mt-2 list-none p-0">
        {held.map(s => (
          <li key={s.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5
            border-t border-rule py-2">
            <span className="font-display text-meta font-medium text-ink-2">{s.name}</span>
            <span className="text-fine text-ink-3">{s.scope}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── 07 ─────────────────────────────────────────────────────────────────── */
/* Third column is a cell treatment ('demo' | 'fact'), not a Badge variant.
   The two differ by shape, face and weight before they differ by hue, so the
   column still separates in grayscale. */
const HONESTY = [
  ['The screens on this site', 'Built', 'fact',
    'Hash-routed React, running on fixture data.'],
  ['Every figure on them', 'Generated', 'demo',
    'Produced by the scoring model from invented baselines. Nobody has been measured.'],
  ['The patch', 'Drawn, not built', 'demo',
    'A CAD model, three printed parts and a bought board. No assembled unit exists to photograph.'],
  ['The scoring model', 'Written, not validated', 'demo',
    'Four signals scored against a fourteen-day baseline and blended through a logistic. It has never been compared with any clinical measure.'],
  ['Accuracy', 'None claimed', 'demo',
    'No study, no participants, no error rate.'],
  ['The eight students', 'Invented', 'demo',
    'Student 8241 and the rest are numbers, carrying consent records we wrote ourselves.'],
  ['Regulatory status', 'Not a medical device', 'fact',
    'It does not diagnose, treat or screen for any condition, and nothing on this site should be read as saying it does.'],
]

/* ── 08 ─────────────────────────────────────────────────────────────────── */
/* Four assumptions and the two figures they imply. `from` is the provenance of
   the row and is never left blank: a number with no source is the thing spec 9
   exists to stop. */
const SCALE_ROWS = [
  ['Caseload', num(CASELOAD_ASSUMED), 'students', 'Assumption. No ratio has been surveyed.'],
  ['Sampling', '1', 'Hz', `Design target, across a ${SCHOOL_HOURS} hour school day.`],
  ['Per student, per day', num(PER_DAY), 'readings', 'Arithmetic from the two rows above.'],
  ['Across the caseload', num(CASELOAD_ASSUMED * PER_DAY), 'readings', 'Arithmetic. Not a measurement.'],
  ['Reporting floor', String(K_ANONYMITY), 'students', 'Nothing is reported for a smaller group.'],
]

function ScaleFigure() {
  return (
    <figure className="m-0">
      <figcaption className="font-display text-fine font-bold leading-tight text-ink">
        What one caseload would produce in a day
      </figcaption>
      <dl className="m-0 mt-2">
        {SCALE_ROWS.map(([label, value, unit, from]) => (
          <div key={label} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4
            border-t border-rule py-2">
            <dt className="font-display text-meta font-medium leading-tight text-ink">{label}</dt>
            <dd className="m-0 flex items-baseline gap-1.5 text-right">
              <span className="font-mono text-row font-bold tabular-nums leading-none text-ink">
                {value}</span>
              <span className="text-fine text-ink-2">{unit}</span>
            </dd>
            <p className="col-span-2 mt-0.5 text-fine leading-[1.4] text-ink-3">{from}</p>
          </div>
        ))}
      </dl>
      <p className="mt-3 border-t border-rule pt-2.5 text-fine leading-[1.4] text-ink-3">
        What would prove this wrong: a trial in which {PRO_PLURAL_LC} using this list reach
        students no earlier than {PRO_PLURAL_LC} using their existing referral queue. We have
        not run it.
      </p>
    </figure>
  )
}

/* ── The stops ──────────────────────────────────────────────────────────── */
/* `art` is a function, not an element: each stop's components must mount fresh
   on arrival, or the dial finishes counting behind a hidden panel.
   `facts` may also be a function, where the rows are read off a fixture. */
const STOPS = [
  {
    id: 'problem', nav: 'The problem',
    title: 'The problem',
    lede: 'The record an adult has is the days somebody spoke up.',
    photo: 'students-hallway',
    alt: 'Four high school students walking along a bright corridor with folders and backpacks, talking as they go',
    facts: [
      ['What an adult has', 'The days a student spoke up, or somebody noticed.'],
      ['What the patch records', `Every school day, at 1 Hz: ${num(PER_DAY)} readings a day.`],
      ['Compared against', `That student's own last two weeks, and nobody else's.`],
      ['The photographs', 'Stock photographs of models. Nobody shown uses MindMap.'],
    ],
    art: EvidenceGap,
  },
  {
    id: 'hardware', nav: 'The hardware',
    title: 'The patch',
    lede: 'Three printed parts and one board we did not design.',
    facts: [
      ...LAYERS.map(l => [l.title, l.body]),
      ['Board', 'Seeed XIAO nRF52840 Sense. Bought, not designed by us.'],
      ['Status', 'Drawn to the real dimensions. No unit has been assembled.'],
    ],
    art: Hardware,
  },
  {
    id: 'signals', nav: 'Four signals',
    title: 'The four signals',
    lede: 'Four signals off the upper arm, once a second.',
    facts: [
      ['Moves first', 'Sweat. Changes too small to feel.'],
      ['Moves furthest', 'Heart rate variability, not the rate itself.'],
      ['Rules illness in or out', 'Skin temperature, which drifts slowly.'],
      ['A control, not a reading', `Above 0.35 g the ${SCORE} is held back, so a hard run cannot be scored as a hard day.`],
    ],
    art: Signals,
  },
  {
    id: 'student', nav: 'Student screen',
    title: 'What the student sees',
    lede: `One ${SCORE}, ${SCORE_RANGE}, and one plain sentence.`,
    photo: 'student-homework',
    alt: 'A teenager in headphones leaning over an open notebook at a desk, a laptop and a pencil case beside them',
    facts: [
      ['Each ring', `One signal's distance from this person's fourteen day baseline.`],
      ['The number in the middle', 'All four signals, blended.'],
      ['The student sees', `Every reading, second by second, and their own ${NOTES}.`],
      ['Withheld from the student', 'Nothing on their own screen.'],
    ],
    art: () => (
      <div className="flex h-full flex-col">
        <RainbowDial score={51} usual={46} rings={studentRings()} size={300}/>
        <p className="mt-3 border-t border-rule pt-3 font-display text-row font-bold
          leading-tight text-ink">
          Today is a little higher than your normal.</p>
        <p className="mt-1 text-meta leading-[1.35] text-ink-2">
          It went up in third period and has stayed there.</p>
        <DemoNotice className="mt-auto pt-3">Sample data, not a real person.</DemoNotice>
      </div>
    ),
    go: ['student', 'Open the student screen'],
  },
  {
    id: 'parent', nav: 'Parent screen',
    title: 'What the parent sees',
    lede: `One ${SCORE} a day, and one sentence a week.`,
    photo: 'parent-laptop',
    alt: 'A mother and her teenage son sitting together at a dining table, both looking at an open laptop',
    facts: [
      ['Finest a parent is shown', 'A day. Never an hour, never a moment.'],
      ['Never shown to a parent', `A raw reading, ${NOTES}, or ${LOCATION}.`],
      ['Shown each week', `Which days sat above their child's own range.`],
      ['Who decides', CONSENT_SHORT],
    ],
    art: () => {
      const band = DATA.weekBand || { hi: 1 }
      const days = DATA.week || []
      const over = days.filter(d => d.v > band.hi).length
      /* The relationship, never a name. views/parent-dash.jsx addresses the
         same reader with the same two words, so the tour and the screen it is
         describing cannot drift apart on it. */
      const never = ['A raw reading', NOTES, LOCATION, 'Anything said near the microphone']
      return (
        <div className="flex h-full flex-col">
          <p className="font-display text-row font-bold leading-tight text-ink">
            Your child had a harder week than usual.</p>
          <div className="mt-3"><WeekStrip days={DATA.week} band={DATA.weekBand}/></div>
          <p className="mt-2 font-mono text-fine tabular-nums text-ink-3">
            {over} of {days.length} days above their usual range
          </p>
          <p className="mt-auto border-t border-rule pt-2.5 font-display text-fine font-bold
            leading-tight text-ink">Never shown to a parent</p>
          {/* A card holding a row of chips: one level of nesting, which spec 2
              allows. The mark is each chip's marker, so the list has none. */}
          <ul className="m-0 mt-2 grid list-none gap-1.5 p-0 sm:grid-cols-2">
            {never.map(t => (
              <li key={t} className="flex items-start gap-2 rounded-field border border-rule
                px-2.5 py-1.5 text-meta leading-[1.3] text-ink-2">
                <Never aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-3"/>{t}
              </li>
            ))}
          </ul>
        </div>
      )
    },
    go: ['privacy', 'See who can see what'],
  },
  {
    id: 'pro', nav: `${PRO} console`,
    title: `What the ${PRO_LC} sees`,
    lede: CASELOAD_DEF,
    photo: 'clinic-talk',
    alt: `A teenage boy talking with a ${PRO_LC} on a sofa by a sunlit window`,
    /* Read off the same roster the list draws. A typed "five of eight" goes
       stale the moment a consent record changes. */
    facts: () => {
      const all = roster().length, trends = triage().length
      const partial = scoreOnly().length, alerts = alertsOnly().length
      return [
        ['On this caseload', `${all} students.`],
        ['Appear with a change', `${trends} guardians agreed to trends.`],
        ['Appear without one', `${partial} agreed to a ${SCORE} without trends.`],
        [`Carry no ${SCORE} at all`, `${alerts} agreed to crisis alerts only.`],
        ['Cannot be consented away', `Crisis alerts reach the ${PRO_LC} in every case, and students are told so before they wear it.`],
      ]
    },
    art: Caseload,
    go: ['pro', `Open the ${PRO_LC} console`],
  },
  {
    id: 'honest', nav: 'Real vs demo',
    title: 'What is real and what is a demo',
    lede: 'Nothing on this site has been measured on a person.',
    facts: [
      ['Built', 'The screens, as hash-routed React on fixture data.'],
      ['Generated', 'Every figure on them, from invented baselines.'],
      ['Drawn, not built', 'The patch. No assembled unit exists to photograph.'],
      ['Not claimed', 'Accuracy. No study, no participants, no error rate.'],
    ],
    art: () => (
      <Table>
        <THead>
          <TR>
            <TH>Thing</TH>
            <TH>Status</TH>
            <TH>What that means</TH>
          </TR>
        </THead>
        <TBody>
          {HONESTY.map(([what, status, kind, means]) => (
            <TR key={what}>
              <TD className="font-display font-medium text-ink">{what}</TD>
              <TD>
                {kind === 'demo'
                  ? <span className="inline-flex items-baseline border-l-2 border-warn pl-2.5 text-fine text-warn">{status}</span>
                  : <Badge variant="state">{status}</Badge>}
              </TD>
              <TD className="text-meta text-ink-2">{means}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    ),
  },
  {
    id: 'scale', nav: 'At scale',
    title: 'What this would change on a caseload',
    lede: 'A projection, not a finding.',
    facts: [
      ['A queue today', 'Ordered by who asked first, or who was referred.'],
      ['This queue', `Ordered by whose ${SCORE} moved most since last week.`],
      ['Why a list, not a dashboard', `A ${PRO_LC} cannot read ${num(CASELOAD_ASSUMED)} charts.`],
      ['What is not claimed', 'No adoption figure, no effect size, no trial.'],
    ],
    art: ScaleFigure,
  },
]

export function Tour({ go }) {
  const [i, setI] = React.useState(0)
  const anchor = React.useRef(null)
  const first = React.useRef(true)
  const stop = STOPS[i]

  /* Changing stop replaces content above the control that changed it, so the
     reader is moved back to the top. Skipped on first paint, or the page
     scrolls itself on arrival. `behavior` is set explicitly because the global
     `scroll-behavior: smooth` would otherwise animate it under reduced
     motion. */
  React.useEffect(() => {
    if (first.current) { first.current = false; return }
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    anchor.current?.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' })
  }, [i])

  return (
    <main>
      {/* -- the title band -------------------------------------------------
          Two columns from lg: the title on the left and what the tour costs a
          reader on the right, in a container, rather than as a second line of
          prose under the first. */}
      <section className="border-t border-rule bg-mist">
        <div className="wrap grid gap-3 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]
          lg:gap-4 lg:py-7">
          <div className="min-w-0">
            <p className="font-mono text-ui font-bold tracking-[0.005em] text-accent">
              Guided tour
            </p>
            <h1 className="mt-2 max-w-[18ch] font-display text-major font-bold leading-[1.06]
              tracking-tight text-ink">
              What we built and how it works
            </h1>
            <p className="mt-3 max-w-[44ch] text-sec font-medium leading-[1.35] text-ink">
              Eight stops, in the order the product works.
            </p>
          </div>
          <Facts className="self-end" rows={[
            ['Stops', `${STOPS.length}, each one a screen or a part.`],
            ['Time', 'About five minutes, start to finish.'],
            ['What you are looking at', 'The live components the real screens run, not recordings.'],
          ]}/>
        </div>
      </section>

      {/* -- the stops ------------------------------------------------------ */}
      <section className="border-t border-rule bg-paper">
        <div className="wrap py-5 lg:py-7">
          <Tabs value={stop.id} onValueChange={v => setI(STOPS.findIndex(s => s.id === v))}>
            {/* Radix gives the strip roving focus and arrow keys. Previous and
                Next below exist for in-order readers who should not have to
                aim at a tab. `scroll` rather than wrap: eight triggers wrap to
                three rows on a 390px screen and cost a third of the fold. */}
            <div ref={anchor} data-anchor>
              <TabsList scroll aria-label="Tour stops" className="gap-x-5">
                {STOPS.map(s => (
                  <TabsTrigger key={s.id} value={s.id}
                    className="min-h-[46px] text-ui">{s.nav}</TabsTrigger>
                ))}
              </TabsList>
            </div>

            {STOPS.map((s, n) => {
              const A = s.art
              const rows = typeof s.facts === 'function' ? s.facts() : s.facts
              return (
                <TabsContent key={s.id} value={s.id} className="mt-3 lg:mt-4">
                  <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
                    <h2 className="font-display text-sub font-bold leading-[1.12] tracking-tight
                      text-ink">{s.title}</h2>
                    <p className="font-mono text-fine tabular-nums text-ink-2">
                      Stop {n + 1} of {STOPS.length}
                    </p>
                  </div>
                  {/* Two columns from lg, per spec 1. The rail is fixed and the
                      figure takes the rest, so a wide figure is not squeezed
                      into half the band to keep the two tracks even. */}
                  <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]
                    lg:gap-4">
                    <div className="flex flex-col gap-3 lg:gap-4">
                      <ScrollIn as="p" className="text-sec font-medium leading-[1.35] text-ink">
                        {s.lede}
                      </ScrollIn>
                      {s.photo && <ScrollIn><PhotoCard photo={s.photo} alt={s.alt}/></ScrollIn>}
                      <ScrollIn><Facts rows={rows}/></ScrollIn>
                      {s.go && (
                        <Button variant="outline" size="sm" className="w-fit"
                          onClick={() => go(s.go[0])}>
                          {s.go[1]}<ArrowRight aria-hidden/>
                        </Button>
                      )}
                    </div>
                    <ScrollIn className="min-w-0"><Fig><A/></Fig></ScrollIn>
                  </div>
                </TabsContent>
              )
            })}
          </Tabs>

          {/* aria-live on the position: the tab strip scrolls on a phone, so
              the reader cannot always see where they are in it. */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-panel border
            border-rule bg-card px-3.5 py-3">
            <p aria-live="polite" className="font-mono text-fine tabular-nums text-ink-2">
              Stop {i + 1} of {STOPS.length}
            </p>
            <div className="ml-auto flex gap-2.5">
              <Button variant="outline" size="sm" disabled={i === 0}
                onClick={() => setI(n => Math.max(0, n - 1))}>
                <ArrowLeft aria-hidden/>Previous
              </Button>
              <Button size="sm" disabled={i === STOPS.length - 1}
                onClick={() => setI(n => Math.min(STOPS.length - 1, n + 1))}>
                Next<ArrowRight aria-hidden/>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* -- the way out ----------------------------------------------------
          Two columns from lg, and the three routes carry what each one opens
          rather than a heading and a single button on an otherwise empty
          band. */}
      <section className="border-t border-rule bg-aqua-2">
        <div className="wrap grid gap-3 py-5 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]
          lg:gap-4 lg:py-7">
          <div className="min-w-0">
            <h2 className="font-display text-sub font-bold leading-[1.12] tracking-tight text-ink">
              Open the app yourself
            </h2>
            <p className="mt-2 max-w-[40ch] text-sec font-medium leading-[1.35] text-ink">
              Nothing below needs a patch or an account.
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              <Button size="sm" onClick={() => go('app')}>
                Open the app<ArrowRight aria-hidden/>
              </Button>
              <Button variant="outline" size="sm" onClick={() => go('check')}>
                Get a {SCORE} in six questions
              </Button>
            </div>
          </div>
          <Facts className="self-start" rows={[
            ['The launcher', `The student screen, the parent screen and the ${PRO_LC} console.`],
            ['Six questions', `A ${SCORE} with no patch and nothing stored.`],
            ['What is stored', 'Nothing typed anywhere on this site leaves the device.'],
          ]}/>
        </div>
      </section>
    </main>
  )
}
