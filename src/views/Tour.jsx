import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { DemoNotice } from '../ui/notice'
import { Separator } from '../ui/separator'
import { Card, CardTitle } from '../ui/card'
import { Table, THead, TBody, TR, TH, TD } from '../ui/table'
import { ArrowLeft, ArrowRight, Never } from '../ui/marks'
import { ExplodedStack, LAYERS } from './Patch'
import { Parallax2D } from '../ui/motion'
import { List, Item } from '../ui/list'
import { RainbowDial } from '../charts/rainbow'
import { SignalTrace, WeekStrip } from '../charts/infographics'
import { studentRings } from '../lib/readings'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { roster, triage, scoreOnly, alertsOnly, tierOf, TIER_LABEL } from '../lib/caseload'
import { DATA } from '../lib/assets'
import { cn } from '../lib/utils'
import { SCORE, SCORE_RANGE, NOTES, LOCATION, CASELOAD_TITLE, PRO, PRO_LC, PRO_PLURAL_LC }
  from '../lib/terms'

/* The guided tour, in eight stops.
 *
 * Every stop renders the live component the real screen runs, or a drawing of
 * the real part — never a recording or a mockup. The HONESTY stop is the list
 * of everything on this site that is not real; keep it current.
 *
 * The current stop is deliberately NOT in the URL. The router matches the whole
 * hash against a fixed list of view names, so `#/tour/3` — or any sub-path,
 * query or suffix — fails the match and lands the visitor on the overview.
 * Deep-linking a stop requires changing the router first. */

/* Arithmetic, not a measurement: 1 Hz over a seven-hour school day. Computed,
   not typed, so the two numbers in the caption cannot drift apart. */
const SCHOOL_HOURS = 7
const PER_DAY = SCHOOL_HOURS * 60 * 60

const Lede = ({ children }) => <p className="mt-5 max-w-[46ch] text-body text-ink-2">{children}</p>
const Note = ({ children }) =>
  <p className="mt-6 max-w-[52ch] border-t border-rule pt-4 text-sec text-ink-3">{children}</p>

/* ── 01 ─────────────────────────────────────────────────────────────────── */
/* Nothing in this figure is a statistic, and the caption must keep saying the
   drawing is a drawing. */
function EvidenceGap() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const rows = [
    { label: 'What an adult has to go on', on: [2] },
    { label: 'What the patch records',     on: [0, 1, 2, 3, 4, 5, 6] },
  ]
  return (
    /* Largest drift of the three figures on the tour. */
    <Parallax2D distance={38}>
    <figure className="m-0">
      {rows.map((r, ri) => (
        <div key={r.label} className={cn(ri && 'mt-7')}>
          <p className="font-display text-tick font-medium text-ink-2">{r.label}</p>
          <div className="mt-2.5 flex gap-1.5" role="img"
            aria-label={`${r.label}: ${r.on.length} of seven days`}>
            {days.map((d, i) => (
              <div key={i} className="flex-1 text-center">
                <div className={cn('h-9 rounded-xs border border-rule',
                  r.on.includes(i) ? 'border-accent bg-accent' : 'bg-mist')}/>
                <span className="mt-1.5 block text-tick text-ink-3">{d}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <figcaption className="note mt-5 max-w-[46ch]">
        A drawing, not data. The lower row is one reading a second:{' '}
        <span className="font-mono tabular-nums text-ink-2">{PER_DAY.toLocaleString('en-US')}</span>{' '}
        readings in a {SCHOOL_HOURS}-hour school day, per student.
      </figcaption>
    </figure>
    </Parallax2D>
  )
}

/* ── 02 ─────────────────────────────────────────────────────────────────── */
/* ExplodedStack owns its own scroll motion and reduced-motion branch. Do not
   write transforms onto `.lyr` here, and do not wrap this in Parallax2D — it is
   the one stop whose figure already moves. */
function Hardware() {
  return (
    <figure className="m-0">
      <ExplodedStack className="h-[min(46vh,400px)] w-full" caption={null}
        size="w-[min(94%,440px)]"/>
      <figcaption className="note mt-2 text-center">
        Shell, electronics pod, skin-side base.
      </figcaption>
    </figure>
  )
}

/* ── 03 ─────────────────────────────────────────────────────────────────── */
/* Copy comes from lib/sensors.js. Do not retype it here, or the patch page and
   the tour describe the same sensor two different ways. */
function Signals() {
  return (
    <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
      {SENSOR_ORDER.map((id, i) => {
        const s = SENSORS[id]
        return (
          /* Alternating travel per column; one distance for all four reads as
             the grid being dragged. h-full must carry through the Parallax2D
             wrapper or the row loses its equal-height cards. */
          <li key={id}>
            <Parallax2D distance={i % 2 ? 20 : 32} className="h-full [&>div]:h-full">
            <Card className="h-full p-5">
              <div className="flex items-center gap-2.5">
                <s.icon aria-hidden className="size-5" style={{ color: s.glow }}/>
                <CardTitle as="h3" className="text-row">{s.name}</CardTitle>
                <span className="ml-auto text-tick text-ink-3">{s.unit}</span>
              </div>
              <SignalTrace kind={id} className="mt-3"/>
              <p className="mt-3 text-sec text-ink-2">{s.about}</p>
            </Card>
            </Parallax2D>
          </li>
        )
      })}
    </ul>
  )
}

/* ── 06 ─────────────────────────────────────────────────────────────────── */
/* The check-in list plus the students consent keeps off it. Every count is read
   off the same fixture the medical professional console reads, so the prose cannot claim a
   consent split the list does not show.
 *
 * No position numerals: a column of ranks is a leaderboard whatever the heading
 * says. Order is largest change first. */
function Caseload() {
  const moved = triage()
  const held = [...scoreOnly(), ...alertsOnly()]
  return (
    <div>
      <p className="mark">{CASELOAD_TITLE}</p>
      <ol className="m-0 mt-3 list-none space-y-2 p-0">
        {moved.map(s => {
          const tier = tierOf(s.current)
          return (
            <li key={s.id} className="grid grid-cols-[minmax(0,1fr)_5.5rem_3rem]
              items-center gap-3 border-b border-rule pb-2">
              <span className="min-w-0">
                <span className="block truncate font-display text-ui font-medium text-ink">{s.name}</span>
                <span className="mt-1 block h-2 w-full rounded-bar bg-rule/70">
                  <span className={cn('block h-2 rounded-bar',
                    tier === 'crisis' ? 'bg-crit' : tier === 'high' ? 'bg-warn' : 'bg-accent')}
                    style={{ width: `${s.current}%` }}/>
                </span>
              </span>
              <span className="text-fine text-ink-2">{TIER_LABEL[tier]}</span>
              {/* Change since last week orders the list, so it is the figure on
                  the row — the score alone makes the order look wrong. */}
              <span className="text-right font-mono text-fine tabular-nums text-ink">
                {s.velocity > 0 ? '+' : ''}{s.velocity}</span>
            </li>
          )
        })}
      </ol>
      <p className="mark mt-7">Consented out of this list</p>
      <ul className="m-0 mt-3 list-none space-y-2 p-0">
        {held.map(s => (
          <li key={s.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1
            border-b border-rule pb-2">
            <span className="font-display text-ui font-medium text-ink-2">{s.name}</span>
            <span className="text-sec text-ink-3">{s.scope}</span>
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

/* ── The stops ──────────────────────────────────────────────────────────── */
/* `art` is a function, not an element: each stop's components must mount fresh
   on arrival, or the dial finishes counting behind a hidden panel. */
const STOPS = [
  {
    id: 'problem', nav: 'The problem',
    title: 'The problem',
    body: (
      <>
        <Lede>
          The record an adult has of a teenager is the days someone spoke up. MindMap records
          every day, against that student's own last two weeks and nobody else's.
        </Lede>
      </>
    ),
    art: EvidenceGap,
  },
  {
    id: 'hardware', nav: 'The hardware',
    title: 'The patch',
    body: (
      <>
        <Lede>
          An adhesive base, a tray for a Seeed XIAO nRF52840 Sense board, and a printed shell.
          The board is bought, not designed by us.
        </Lede>
        <List className="mt-6 gap-4">
          {LAYERS.map(l => (
            <Item key={l.i} marker="none" className="border-t border-rule pt-3">
              <span className="block font-display text-ui font-bold text-ink">{l.title}</span>
              <span className="mt-1 block text-sec text-ink-2">{l.body}</span>
            </Item>
          ))}
        </List>
        <Note>Drawn to the real dimensions. No unit has been assembled.</Note>
      </>
    ),
    art: Hardware,
  },
  {
    id: 'signals', nav: 'Four signals',
    title: 'The four signals',
    body: (
      <>
        <Lede>
          Pulse, sweat, skin temperature and movement, off the upper arm, once a second. Sweat moves
          first, heart-rate variability moves furthest, and skin temperature drifts slowly enough
          to rule illness in or out.
        </Lede>
        <Lede>
          Movement is a control, not a fifth reading. Above 0.35 g the {SCORE} is held back, so a
          hard run cannot be scored as a hard day.
        </Lede>
      </>
    ),
    art: Signals,
    wide: true,
  },
  {
    id: 'student', nav: 'Student screen',
    title: 'What the student sees',
    body: (
      <>
        <Lede>
          One {SCORE}, {SCORE_RANGE}, and one plain sentence. Each ring is one signal's distance
          from this person's fourteen-day baseline; the number in the middle blends all four.
        </Lede>
        <Lede>
          The student sees every reading, second by second, and their own {NOTES}. Nothing on
          their own screen is withheld from them.
        </Lede>
      </>
    ),
    art: () => (
      <div>
        <Parallax2D distance={56}>
          <RainbowDial score={51} usual={46} rings={studentRings()} size={340}/>
        </Parallax2D>
        <p className="mt-6 max-w-[34ch] font-display text-head font-bold text-ink">
          Today is a little higher than your normal.</p>
        <p className="mt-2 max-w-[34ch] text-sec text-ink-2">
          It went up in third period and has stayed there.</p>
        <DemoNotice className="mt-4">Sample data, not a real person.</DemoNotice>
      </div>
    ),
    go: ['student', 'Open the student screen'],
  },
  {
    id: 'parent', nav: 'Parent screen',
    title: 'What the parent sees',
    body: (
      <>
        <Lede>
          A parent gets one {SCORE} a day, one sentence a week, and which days sat above their
          child's own range. That is all.
        </Lede>
        <Lede>
          A parent never sees a raw reading, {NOTES} or {LOCATION}. A teenager who could not keep
          those private would stop wearing the patch.
        </Lede>
      </>
    ),
    art: () => {
      const band = DATA.weekBand || { hi: 1 }
      const over = (DATA.week || []).filter(d => d.v > band.hi).length
      const never = ['A raw reading', NOTES, LOCATION,
        'Anything said near the microphone']
      return (
        <div>
          <p className="max-w-[30ch] font-display text-head font-bold text-ink">
            Maya had a harder week than usual.</p>
          {/* Small drift: a large one here reads as the list coming apart. */}
          <Parallax2D distance={24} className="mt-5 max-w-[22rem]">
            <WeekStrip days={DATA.week} band={DATA.weekBand}/>
          </Parallax2D>
          <p className="mt-3 font-mono text-tick tabular-nums text-ink-3">
            {over} of {(DATA.week || []).length} above her usual range</p>
          <p className="mark mt-8">Never shown to a parent</p>
          {/* The bar is this row's marker, so the list's own is off. */}
          <List className="mt-3 gap-2.5">
            {never.map(t => (
              <Item key={t} marker="none" className="gap-3 text-meta text-ink">
                <Never className="mt-1 size-4 shrink-0 text-ink-3"/>{t}
              </Item>
            ))}
          </List>
        </div>
      )
    },
    go: ['privacy', 'See who can see what'],
  },
  {
    id: 'pro', nav: `${PRO} console`,
    title: `What the ${PRO_LC} sees`,
    body: null,   /* built below, from the fixture, so the counts cannot drift */
    art: Caseload,
    go: ['pro', `Open the ${PRO_LC} console`],
  },
  {
    id: 'honest', nav: 'Real vs demo',
    title: 'What is real and what is a demo',
    body: (
      <>
        <Lede>
          Nothing on this site has been measured on a person. We would rather be judged on a
          demonstration that says so than on a prototype that implies more.
        </Lede>
      </>
    ),
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
              <TD className="text-sec text-ink-2">{means}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    ),
    wide: true,
  },
  {
    id: 'scale', nav: 'At scale',
    title: 'What this would change on a caseload',
    body: (
      <>
        <Lede>
          A projection, not a finding: no adoption figure, no effect size, no trial.
        </Lede>
        <Lede>
          A {PRO_LC}'s queue today is ordered by who asked first, or who was referred. This orders
          it by whose {SCORE} moved most since last week.
        </Lede>
      </>
    ),
    art: () => (
      <div>
        <p className="mark">The assumptions</p>
        <List className="mt-3 gap-3">
          {[
            `One ${PRO_LC} carrying a caseload of about 400 students. That ratio is an assumption.`,
            `Each wearer reports at 1 Hz through a ${SCHOOL_HOURS}-hour school day: ${PER_DAY.toLocaleString('en-US')} readings per student per day.`,
            `Some unknown fraction of students wear a patch, and some unknown fraction of guardians consent to trends. The split shown on the ${PRO_LC} screen is invented.`,
            'Groups under five are never reported.',
          ].map((t, i) => (
            <Item key={i} marker="none" className="border-t border-rule pt-3 text-sec text-ink-2">{t}</Item>
          ))}
        </List>
        <p className="mt-8 max-w-[54ch] text-meta text-ink">
          A {PRO_LC} cannot read 400 charts, which is why the output is a short list and a
          sentence rather than a dashboard. If the list is right, the student whose {SCORE} moved
          most is seen first.
        </p>
        <Note>What would prove this wrong: a trial in which {PRO_PLURAL_LC} using this list reach
          students no earlier than {PRO_PLURAL_LC} using their existing referral queue. We have not
          run it.</Note>
      </div>
    ),
    wide: true,
  },
]

/* Generated from the same roster the list draws. A hand-written "five of
   eight" goes stale the moment a consent record changes. */
function CaseloadBody() {
  const all = roster().length, trends = triage().length
  const partial = scoreOnly().length, alerts = alertsOnly().length
  return (
    <>
      <Lede>
        {all} students on this caseload. The list leads with the students whose {SCORE} moved most
        since last week, so a check-in starts with the biggest change. A student steady at 86 for a
        month is not the emergency.
      </Lede>
      <Lede>
        Consent decides who can appear. {trends} guardians agreed to trends, so {trends} students
        appear with a change since last week; {partial} agreed to a {SCORE} without trends and
        appear without one; the remaining {alerts} agreed to crisis alerts only, which carries no
        {SCORE} at all.
      </Lede>
      <Note>Crisis alerts reach the {PRO_LC} in every case. No guardian can consent that away,
        and students are told so before they wear it.</Note>
    </>
  )
}

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
    <main className="wrap py-14">
      <p className="note">Guided tour · {STOPS.length} stops</p>
      <h1 className="mt-3.5 font-display font-bold text-major leading-[1.05] tracking-tight text-ink">
        What we built and how it works
      </h1>
      <p className="mt-5 max-w-read text-lead leading-[1.55] text-ink-2">
        About five minutes. Every chart is the live component the real screen runs, not a
        recording.
      </p>

      <Tabs value={stop.id} onValueChange={v => setI(STOPS.findIndex(s => s.id === v))}
        className="mt-10">
        {/* Radix gives the strip roving focus and arrow keys. Previous/Next
            below exist for in-order readers who should not have to aim at a
            tab. */}
        <div ref={anchor} data-anchor>
          <TabsList aria-label="Tour stops" className="gap-x-6">
            {STOPS.map(s => (
              <TabsTrigger key={s.id} value={s.id} className="text-ui">{s.nav}</TabsTrigger>
            ))}
          </TabsList>
        </div>

        {STOPS.map(s => {
          const A = s.art
          return (
            <TabsContent key={s.id} value={s.id}>
              <section className={cn('grid gap-10',
                !s.wide && 'lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start lg:gap-14')}>
                <div>
                  <h2 className="font-display font-bold text-sub leading-[1.12] tracking-tight text-ink">
                    {s.title}</h2>
                  {s.id === 'pro' ? <CaseloadBody/> : s.body}
                  {s.go && (
                    <Button variant="outline" size="sm" className="mt-7"
                      onClick={() => go(s.go[0])}>
                      {s.go[1]}<ArrowRight aria-hidden/>
                    </Button>
                  )}
                </div>
                <div className="min-w-0"><A/></div>
              </section>
            </TabsContent>
          )
        })}
      </Tabs>

      {/* aria-live on the position: the tab strip scrolls on a phone, so the
          reader cannot always see where they are in it. */}
      <div className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-4 border-t-2 border-ink pt-6">
        <p aria-live="polite" className="font-mono text-tick tabular-nums text-ink-2">
          Stop {i + 1} of {STOPS.length}</p>
        <div className="ml-auto flex gap-3">
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

      <Separator weight="ink" className="mt-20"/>
      <section className="py-10">
        <h2 className="font-display font-bold text-sub leading-[1.12] tracking-tight text-ink">
          Open the app yourself
        </h2>
        <p className="mt-3 max-w-[54ch] text-lead text-ink-2">
          The launcher opens the student screen, the parent screen and the {PRO_LC} console.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button onClick={() => go('app')}>Open the app<ArrowRight aria-hidden/></Button>
          <Button variant="outline" onClick={() => go('check')}>Get a {SCORE} in six questions</Button>
        </div>
      </section>

    </main>
  )
}
