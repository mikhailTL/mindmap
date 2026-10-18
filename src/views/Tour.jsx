import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Table, THead, TBody, TR, TH, TD } from '../ui/table'
import { ArrowLeft, ArrowRight, Never } from '../ui/marks'
import { ExplodedStack, LAYERS } from './Patch'
import { SeeDetails } from './Monitor'
import { Parallax2D, ScrollIn, ScrollRow } from '../ui/motion'
import { PHOTOS, dims, focal } from '../lib/photos'
import { RainbowDial } from '../charts/rainbow'
import { SignalTrace, WeekStrip } from '../charts/infographics'
import { studentRings } from '../lib/readings'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { roster, triage, scoreOnly, alertsOnly, tierOf, TIER_LABEL, K_ANONYMITY }
  from '../lib/caseload'
import { DATA } from '../lib/assets'
import { cn } from '../lib/utils'
import { cardClass } from '../ui/card'
import {
  SCORE, SCORE_RANGE, NOTES, LOCATION, CASELOAD_TITLE,
  PRO, PRO_LC, CONSENT_SHORT,
} from '../lib/terms'
import { TNAM_RESULTS as R } from '../signals/tnam-results'

/* Same sum Methods.jsx uses for "Tested on", so the two cannot drift. */
const TESTED_ADULTS = R.per_subject.length + R.transfer.subjects

/* The guided tour, in eight stops. Every stop renders the live component the
 * real screen runs, or a drawing of the real part, never a mockup. The HONESTY
 * stop lists everything on this site that is not real; keep it current.
 *
 * The current stop is NOT in the URL: the router matches the whole hash against
 * a fixed list, so `#/tour/3` lands on the overview. Deep-linking a stop means
 * changing the router first. */

const PANEL = 'overflow-hidden rounded-panel border border-rule bg-card'

/* Arithmetic, not a measurement: 1 Hz over a seven-hour school day, then that
   across one assumed caseload. Computed so stop one and stop eight agree. */
const SCHOOL_HOURS = 7
const PER_DAY = SCHOOL_HOURS * 60 * 60
const CASELOAD_ASSUMED = 400
const num = n => n.toLocaleString('en-US')

/* Every frame is a licensed stock photograph of models. Nobody in one uses
 * MindMap or wears the patch, and no alt text may imply otherwise.
 * Eager: Radix mounts only the open tab, so at most one is ever in the tree.
 * max-w-none is load-bearing against preflight's img { max-width: 100% }. */
function PhotoCard({ photo, alt, drift = false, className }) {
  const src = PHOTOS[photo]
  if (!src || !alt) return null
  const [w, h] = dims(photo)
  return (
    <div className={cn(PANEL, 'h-[152px] lg:h-[172px]', className)}>
      {/* The photograph drifts inside its frame: 28px taller than the panel,
          so the ±14px travel never shows an edge. */}
      <Parallax2D className="h-full [&>div]:h-full" distance={drift ? 28 : 0} clip={false}>
        <img src={src} alt={alt} width={w} height={h} loading="eager" decoding="async"
          style={{ objectPosition: focal(photo) }}
          className="-mt-3.5 block h-[calc(100%+28px)] w-full max-w-none object-cover"/>
      </Parallax2D>
    </div>
  )
}

/* Labelled rows: a label and its value, one line each. Reading notes beside
   the figure, so a rule rather than a second white box (src/ui/card.jsx). */
function Facts({ rows, className }) {
  return (
    <div className={cn(cardClass('rule', 'accent'), className)}>
      {rows.map(([label, value], i) => (
        <div key={label} className={cn('py-2', i && 'border-t border-rule')}>
          <p className="font-display text-fine font-bold leading-tight text-ink">{label}</p>
          <p className="mt-0.5 text-meta leading-[1.35] text-ink-2">{value}</p>
        </div>
      ))}
    </div>
  )
}

/* A figure's own container. A column, so a short figure can push its caption
   to the foot with mt-auto. */
function Fig({ children, className }) {
  return <div className={cn(PANEL, 'flex h-full flex-col p-3.5 lg:p-4', className)}>{children}</div>
}

/* ── 01 ─────────────────────────────────────────────────────────────────── */
/* Nothing here is a statistic; the caption must keep saying so. */
function EvidenceGap() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const rows = [
    { label: 'What an adult hears about', on: [2], count: '1 of 7 days' },
    { label: 'What the patch records',    on: [0, 1, 2, 3, 4, 5, 6], count: '7 of 7 days' },
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
        A drawing, not data. One reading a second is{' '}
        <span className="font-mono tabular-nums text-ink-2">{num(PER_DAY)}</span>{' '}
        a school day.
      </figcaption>
    </figure>
  )
}

/* ── 02 ─────────────────────────────────────────────────────────────────── */
/* ExplodedStack owns its own scroll motion. Do not write transforms onto `.lyr`. */
function Hardware() {
  return (
    <figure className="m-0 flex h-full flex-col">
      <ExplodedStack className="h-[min(44vh,360px)] w-full" caption={null}
        size="w-[min(94%,420px)]"/>
      <figcaption className="mt-auto border-t border-rule pt-2.5 text-fine leading-[1.4] text-ink-3">
        Drawn at real size.
      </figcaption>
    </figure>
  )
}

/* ── 03 ─────────────────────────────────────────────────────────────────── */
/* Copy comes from lib/sensors.js; do not retype it here. Each signal takes
   its own trace's hue as a wash, heart to movement. */
const SIGNAL_HUE = { heart: 'coral', sweat: 'sun', temp: 'mint', move: 'sky' }

function Signals() {
  return (
    <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:gap-4">
      {SENSOR_ORDER.map((id, i) => {
        const s = SENSORS[id]
        return (
          <ScrollRow key={id} as="li" index={i} className="h-full">
            <div className={cn(cardClass('tint', SIGNAL_HUE[id]), 'flex h-full flex-col overflow-hidden p-3.5')}>
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
/* Read off the same fixture the console reads. No position numerals: a column
 * of ranks is a leaderboard. Order is largest change first. */
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
              <span className="text-right font-mono text-fine tabular-nums text-ink">
                {s.velocity > 0 ? '+' : ''}{s.velocity}</span>
            </li>
          )
        })}
      </ol>
      <p className="mt-3 border-t border-rule pt-2.5 font-display text-fine font-bold
        leading-tight text-ink">Students who share less</p>
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
/* Third column is a cell treatment ('demo' | 'fact'). The two differ by shape
   and weight before hue, so the column still separates in grayscale. */
const HONESTY = [
  ['The screens on this site', 'Working', 'fact',
    'Real React, running in your browser.'],
  ['The numbers on them', 'Sample data', 'demo',
    'Drawn from sample baselines.'],
  ['The scoring model', 'Four signals', 'fact',
    'Four signals against a fourteen day baseline.'],
  ['Accuracy', `Tested on ${TESTED_ADULTS} adults`, 'fact',
    'Two public lab datasets, see Machine Learning.'],
  ['The eight students', 'Sample profiles', 'demo',
    'Sample students with sample consent settings.'],
  ['Regulatory status', 'Not a medical device', 'fact',
    'No diagnosis, treatment or screening for any condition.'],
]

/* ── 08 ─────────────────────────────────────────────────────────────────── */
/* `from` is the provenance of the row and is never blank. */
const SCALE_ROWS = [
  ['Students on one list', num(CASELOAD_ASSUMED), 'students', 'The list size used on this page.'],
  ['Readings per second', '1', 'Hz', `The design target, over a ${SCHOOL_HOURS} hour school day.`],
  ['Per student, per day', num(PER_DAY), 'readings', 'The two rows above, multiplied.'],
  ['Across the whole list', num(CASELOAD_ASSUMED * PER_DAY), 'readings', 'Per student, times the list.'],
  ['Smallest group reported', String(K_ANONYMITY), 'students', 'A smaller group shows nothing.'],
]

function ScaleFigure() {
  return (
    <figure className="m-0">
      <figcaption className="font-display text-fine font-bold leading-tight text-ink">
        One list, one day
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
    </figure>
  )
}

/* ── The stops ──────────────────────────────────────────────────────────── */
/* `art` is a function, not an element: each stop's components must mount fresh
   on arrival, or the dial finishes counting behind a hidden panel.
   `facts` may also be a function, where the rows are read off a fixture. */
const STOPS = [
  {
    id: 'problem', drift: true, nav: 'The problem',
    title: 'Why stress is hard to track',
    lede: 'An adult hears only what a student says.',
    photo: 'students-hallway',
    alt: 'Four high school students walking along a bright corridor with folders and backpacks, talking as they go',
    facts: [
      ['Compared with', `The student's own last two weeks, nobody else.`],
      ['The photographs', 'These are licensed stock photos of models.'],
    ],
    art: EvidenceGap,
  },
  {
    id: 'hardware', nav: 'The patch',
    title: 'What goes on the upper arm',
    lede: 'Three printed parts around a ready made board.',
    facts: LAYERS.map(l => [l.title, l.body]),
    art: Hardware,
  },
  {
    id: 'signals', drift: true, nav: 'The four signals',
    title: 'What the patch records',
    lede: 'Four signals from the upper arm, once a second.',
    facts: [
      ['Illness check', 'Skin temperature drifts slowly, telling illness from stress.'],
      ['Movement check', `Movement above 0.35 g holds the ${SCORE} back.`],
    ],
    art: Signals,
  },
  {
    id: 'student', drift: true, nav: 'Student screen',
    title: 'What the student sees',
    lede: `One ${SCORE}, ${SCORE_RANGE}, read against their own normal.`,
    photo: 'student-homework',
    alt: 'A teenager in headphones leaning over an open notebook at a desk, a laptop and a pencil case beside them',
    facts: [
      ['Each ring', 'One signal against the fourteen day baseline.'],
      ['The number in the middle', 'All four signals blended.'],
      ['Every reading', `Second by second, plus their own ${NOTES}.`],
      ['Hidden from the student', 'Nothing.'],
    ],
    art: () => (
      <div className="flex h-full flex-col">
        <RainbowDial score={51} usual={46} rings={studentRings()} size={300}/>
        <p className="mt-3 border-t border-rule pt-3 font-display text-row font-bold
          leading-tight text-ink">
          Today is a little higher than your normal.</p>
        <p className="mt-1 text-meta leading-[1.35] text-ink-2">
          Up since third period.</p>
      </div>
    ),
    go: ['student', 'Open the student screen'],
  },
  {
    id: 'parent', drift: true, nav: 'Parent screen',
    title: 'What the parent sees',
    lede: `A day's ${SCORE}, and Trends over weeks and months.`,
    photo: 'parent-laptop',
    alt: 'A mother and her teenage son sitting together at a dining table, both looking at an open laptop',
    facts: [
      ['The finest detail', 'A whole day, never an hour or a moment.'],
      ['Trends', `Day by day, week by week and month by month, against their child's own range.`],
      ['Who decides', CONSENT_SHORT],
    ],
    art: () => {
      const band = DATA.weekBand || { hi: 1 }
      const days = DATA.week || []
      const over = days.filter(d => d.v > band.hi).length
      /* The relationship, never a name: the same words parent-dash.jsx uses. */
      const never = ['A raw reading', NOTES, LOCATION, 'Anything said near the microphone']
      return (
        <div className="flex h-full flex-col">
          <p className="font-display text-row font-bold leading-tight text-ink">
            Trends</p>
          <div className="mt-3"><WeekStrip days={DATA.week} band={DATA.weekBand}/></div>
          <p className="mt-2 font-mono text-fine tabular-nums text-ink-3">
            {over} of {days.length} days above their usual range
          </p>
          <p className="mt-auto border-t border-rule pt-2.5 font-display text-fine font-bold
            leading-tight text-ink">Never shown to a parent</p>
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
    id: 'pro', nav: `${PRO} screen`,
    title: `What the ${PRO} sees`,
    lede: `A short list, biggest ${SCORE} change first.`,
    photo: 'clinic-talk',
    alt: `A teenage boy talking with a ${PRO_LC} on a sofa by a sunlit window`,
    /* Read off the roster the list draws, so a consent change cannot go stale. */
    facts: () => {
      const all = roster().length, trends = triage().length
      const partial = scoreOnly().length, alerts = alertsOnly().length
      return [
        ['On the list', `${all} students.`],
        ['Trends shared', `${trends}, with Parental Consent.`],
        ['Score only', `${partial}, sharing a ${SCORE} but not Trends.`],
        ['Alerts only', `${alerts}, sharing crisis alerts and nothing else.`],
        ['Always on', `Crisis alerts reach the ${PRO} in every case.`],
      ]
    },
    art: Caseload,
    go: ['pro', `Open the ${PRO} screen`],
  },
  {
    id: 'honest', nav: 'Real and demo',
    title: 'What is real, what is demo',
    lede: 'The screens run on sample data.',
    facts: [],
    art: () => (
      <Table>
        <THead>
          <TR>
            <TH>Item</TH>
            <TH>Status</TH>
            <TH>Meaning</TH>
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
    title: 'How the numbers add up',
    lede: 'One list, one school day.',
    photo: 'school-card',
    alt: 'A woman and a teenage boy talking in a room lined with shelves',
    facts: [
      ['A waiting list today', 'Ordered by who asked first or was referred.'],
      ['This list', `Ordered by whose ${SCORE} moved most.`],
      ['Why a list', `A ${PRO} cannot read ${num(CASELOAD_ASSUMED)} charts.`],
    ],
    art: ScaleFigure,
  },
]

export function Tour({ go }) {
  const [i, setI] = React.useState(0)
  const anchor = React.useRef(null)
  const first = React.useRef(true)
  const stop = STOPS[i]

  /* Changing stop replaces content above the control, so scroll the reader
     back to the top. Skipped on first paint. `behavior` is explicit because
     the global smooth scroll would otherwise animate under reduced motion. */
  React.useEffect(() => {
    if (first.current) { first.current = false; return }
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    anchor.current?.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' })
  }, [i])

  return (
    <main>
      <section className="border-t border-rule bg-mist">
        <div className="wrap grid gap-3 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]
          lg:gap-4 lg:py-7">
          <h1 className="min-w-0 max-w-[18ch] font-display text-major font-bold leading-[1.06]
            tracking-tight text-ink">
            A guided tour of MindMap
          </h1>
          <p className="self-end text-sec leading-[1.45] text-ink-2">
            {STOPS.length} stops, about five minutes. Every figure is the live screen, not a recording.
          </p>
        </div>
      </section>

      <section className="border-t border-rule bg-paper">
        <div className="wrap py-5 lg:py-7">
          <Tabs value={stop.id} onValueChange={v => setI(STOPS.findIndex(s => s.id === v))}>
            {/* Radix gives the strip roving focus and arrow keys. `scroll` rather
                than wrap: eight triggers wrap to three rows on a 390px screen. */}
            <div ref={anchor} data-anchor>
              <TabsList scroll aria-label="Tour stops" className="gap-x-5">
                {STOPS.map(s => (
                  <TabsTrigger key={s.id} value={s.id}
                    className="min-h-[46px] text-ui">{s.nav}</TabsTrigger>
                ))}
              </TabsList>
            </div>

            {STOPS.map(s => {
              const A = s.art
              const rows = typeof s.facts === 'function' ? s.facts() : s.facts
              const more = s.photo || rows.length > 0
              return (
                <TabsContent key={s.id} value={s.id} className="mt-3 lg:mt-4">
                  <h2 className="font-display text-sub font-bold leading-[1.12] tracking-tight
                    text-ink">{s.title}</h2>
                  <ScrollIn as="p" className="mt-1 text-sec font-medium leading-[1.35] text-ink">
                    {s.lede}
                  </ScrollIn>
                  {/* Above the fold: the figure, then the route out. The rail of
                      facts and the photograph sit behind See details. Two columns
                      from lg, with the figure taking the wider track. */}
                  <div className={cn('mt-3 grid gap-3 lg:gap-4',
                    more && 'lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]')}>
                    {/* One mover per stop: a drawing drifts; a stop whose figure
                        is read (a list, the table) or moves itself holds still. */}
                    <ScrollIn className="min-w-0 lg:col-start-2">
                      {s.drift
                        ? <Parallax2D className="h-full [&>div]:h-full" distance={28} scale={0.02}>
                            <Fig><A/></Fig>
                          </Parallax2D>
                        : <Fig><A/></Fig>}
                    </ScrollIn>
                    <div className="flex flex-col gap-3 lg:col-start-1 lg:row-start-1 lg:gap-4">
                      {s.go && (
                        <Button variant="outline" size="sm" className="w-fit"
                          onClick={() => go(s.go[0])}>
                          {s.go[1]}<ArrowRight aria-hidden/>
                        </Button>
                      )}
                      {more && (
                        <SeeDetails label="See details">
                          <div className="flex flex-col gap-3 lg:gap-4">
                            {rows.length > 0 && <Facts rows={rows}/>}
                            {s.photo && <PhotoCard photo={s.photo} alt={s.alt} drift={!s.drift}/>}
                          </div>
                        </SeeDetails>
                      )}
                    </div>
                  </div>
                </TabsContent>
              )
            })}
          </Tabs>

          {/* aria-live on the position: the tab strip scrolls on a phone. */}
          <div className={cn(cardClass('outline'), 'mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 px-3.5 py-3')}>
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

      <section className="border-t border-rule bg-aqua-2">
        <ScrollIn className="wrap py-5 lg:py-7">
          <h2 className="font-display text-sub font-bold leading-[1.12] tracking-tight text-ink">
            Open the app yourself
          </h2>
          <p className="mt-2 max-w-[40ch] text-sec font-medium leading-[1.35] text-ink">
            No patch or account needed. Sign in and your readings sync.
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            <Button size="sm" onClick={() => go('app')}>
              Open the app<ArrowRight aria-hidden/>
            </Button>
            <Button variant="outline" size="sm" onClick={() => go('check')}>
              Get a {SCORE} from a short survey
            </Button>
          </div>
        </ScrollIn>
      </section>
    </main>
  )
}
