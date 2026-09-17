import React from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { DemoNotice } from '../ui/notice'
import { Separator } from '../ui/separator'
import { FinalSurvey } from '../survey/Survey'
import { Card, CardTitle } from '../ui/card'
import { Table, THead, TBody, TR, TH, TD } from '../s21/table'
import { ArrowLeft, ArrowRight, Never } from '../ui/marks'
import { ExplodedStack, LAYERS } from './Patch'
import { RainbowDial } from '../charts/rainbow'
import { SignalTrace, WeekStrip } from '../charts/infographics'
import { studentRings } from '../lib/readings'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { roster, triage, scoreOnly, alertsOnly, tierOf, TIER_LABEL } from '../lib/caseload'
import { DATA } from '../lib/assets'
import { cn } from '../lib/utils'

/* The judge's route through the site, in eight stops.
 *
 * This replaces a page built around a generated video. A video of a product
 * that does not physically exist is a picture of a claim; every stop here shows
 * the live component the real screen runs, or a drawing of the real part, so
 * there is nothing on this page a judge cannot also go and click.
 *
 * The order answers four questions in the order a judge asks them: what is the
 * problem, what did you actually build, does it work, and what would it change.
 * Stop seven is the one that matters most — it is the list of everything on
 * this site that is not real, written by us rather than found by a reviewer.
 *
 * Why the current stop is NOT in the URL: the router matches the whole hash
 * against a fixed list of view names, so `#/tour/3` — or any sub-path, query or
 * suffix — fails that match and drops the visitor on the overview. Encoding the
 * stop would mean editing the router, which this change is not allowed to touch,
 * and a deep link that silently lands somewhere else is worse than no deep link.
 */

/* Arithmetic, not a measurement: 1 Hz for a seven-hour school day. Computed
   rather than typed so the two numbers in the sentence cannot drift apart. */
const SCHOOL_HOURS = 7
const PER_DAY = SCHOOL_HOURS * 60 * 60

const Lede = ({ children }) => <p className="mt-5 max-w-[46ch] text-body text-ink-2">{children}</p>
const Note = ({ children }) =>
  <p className="mt-6 max-w-[52ch] border-t border-rule pt-4 text-sec text-ink-3">{children}</p>

/* ── 01 ─────────────────────────────────────────────────────────────────── */
/* The gap drawn as what it is: a row of days with almost nothing written in it.
   No figure here is a statistic — the top row is one conversation because that
   is the thing being described, and the caption says the drawing is a drawing. */
function EvidenceGap() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const rows = [
    { label: 'What an adult has to go on', on: [2] },
    { label: 'What the patch records',     on: [0, 1, 2, 3, 4, 5, 6] },
  ]
  return (
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
                <span className="mt-1.5 block font-mono text-tick text-ink-3">{d}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <figcaption className="note mt-5 max-w-[46ch]">
        A drawing, not data. The lower row is one reading a second — {' '}
        <span className="font-mono tabular-nums text-ink-2">{PER_DAY.toLocaleString('en-US')}</span>{' '}
        readings in a {SCHOOL_HOURS}-hour school day, per student.
      </figcaption>
    </figure>
  )
}

/* ── 02 ─────────────────────────────────────────────────────────────────── */
/* This used to hand-place three layers in depth: a per-layer translateZ keyed
   off `data-i`, written straight onto `.lyr` because the old stack registered
   its layers on top of each other and left the separation to the host. The
   DI-03 drawing is a custom element with its own shadow root, its own stage and
   its own explode control, so there is no `.lyr` left to reach and a host that
   reached in would be fighting it. The rig is deleted, not defended.
   No caption here either — the component prints its own inside the shadow
   root, and a second one underneath would say the same thing twice. */
function Hardware() {
  return <ExplodedStack className="w-full"/>
}

/* ── 03 ─────────────────────────────────────────────────────────────────── */
/* Each signal beside the shape it actually draws, and the sentence sensors.js
   already holds for it — retyping those here is how the patch page and the tour
   end up describing the same sensor two different ways. */
function Signals() {
  return (
    <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
      {SENSOR_ORDER.map(id => {
        const s = SENSORS[id]
        return (
          <li key={id}>
            <Card className="h-full p-5">
              <div className="flex items-center gap-2.5">
                <s.icon aria-hidden className="size-5" style={{ color: s.glow }}/>
                <CardTitle as="h3" className="text-row">{s.name}</CardTitle>
                <span className="ml-auto font-mono text-tick text-ink-3">{s.unit}</span>
              </div>
              <SignalTrace kind={id} className="mt-3"/>
              <p className="mt-3 text-sec text-ink-2">{s.about}</p>
            </Card>
          </li>
        )
      })}
    </ul>
  )
}

/* ── 06 ─────────────────────────────────────────────────────────────────── */
/* The ranked board, plus the students the board is not allowed to rank. Every
   count is read off the same fixture the counselor console reads, so the prose
   cannot claim a consent split the list does not show. */
function Caseload() {
  const ranked = triage()
  const held = [...scoreOnly(), ...alertsOnly()]
  return (
    <div>
      <ol className="m-0 list-none space-y-2 p-0">
        {ranked.map((s, i) => {
          const tier = tierOf(s.current)
          return (
            <li key={s.id} className="grid grid-cols-[1.5rem_minmax(0,1fr)_5.5rem_3rem]
              items-center gap-3 border-b border-rule pb-2">
              <span className="font-mono text-meta tabular-nums text-ink-3">{i + 1}</span>
              <span className="min-w-0">
                <span className="block truncate font-display text-ui font-medium text-ink">{s.name}</span>
                <span className="mt-1 block h-2 w-full rounded-bar bg-rule/70">
                  <span className={cn('block h-2 rounded-bar',
                    tier === 'crisis' ? 'bg-crit' : tier === 'high' ? 'bg-warn' : 'bg-accent')}
                    style={{ width: `${s.current}%` }}/>
                </span>
              </span>
              <span className="font-mono text-fine text-ink-2">{TIER_LABEL[tier]}</span>
              {/* Change is what the list is ordered on, so it is the figure on
                  the row — the score alone would make the order look wrong. */}
              <span className="text-right font-mono text-fine tabular-nums text-ink">
                {s.velocity > 0 ? '+' : ''}{s.velocity}</span>
            </li>
          )
        })}
      </ol>
      <p className="mark mt-7">Consented out of the ranking</p>
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
/* Third column is the cell treatment, not a badge variant. Five of these rows
   used to pass `demo` straight into <Badge variant="demo">, which was the
   capsule; a ruled annotation is the wrong shape inside a table cell, so a
   generated row gets a stamp instead — the mono uppercase word on a warn rule,
   the same mark the annotation carries, sized to a cell. A stated fact keeps
   the bordered `state` badge. The two differ by shape, face and weight before
   they differ by hue, so the column still separates in grayscale. */
const HONESTY = [
  ['The screens on this site', 'Built', 'fact',
    'Hash-routed React. Every chart on this tour is the component the real screen runs, on the same fixtures.'],
  ['Every figure on them', 'Generated', 'demo',
    'Produced by the scoring model from invented baselines. Nobody has worn a patch and nobody has been measured.'],
  ['The patch', 'Drawn, not built', 'demo',
    'Design-intent CAD, revision DI-03: seven layers inside a 64 × 42 mm spline lozenge. Every render in the package is stamped DESIGN INTENT — NOT AS-BUILT. There is no photograph of an assembled unit anywhere on this site, because there is not one.'],
  /* The three rows below are the package's own self-audit, compressed to the
     wording of its answers. They are the most useful rows in the table: a
     reviewer who finds a team's failures already written down does not have to
     wonder what else was not written down. Resolving any of them here would
     mean inventing a result the model does not have. */
  ["The CAD's own audit", 'Two of ten fail', 'demo',
    'Ten questions, our answers, published unresolved. The provisional antenna volume intersects 38 body entries, including about 477.3 mm³ of the battery. Red and IR cones overlap 0.326 mm³ outside tissue, and optical crosstalk is unproven.'],
  ['The tooling', 'Unverified', 'demo',
    'Global 1.5° / 3° draft and tool release are unverified, and the service port and the bent acoustic channel need a resolved tool scheme. A valid solid is not proof that the part comes out of a tool.'],
  ['The dimensions', 'Unverifiable', 'demo',
    'No engineering CAD, schematic, approved BOM, netlist, tolerance stack or prototype measurement was available, so there is no baseline to check the model against. The shell footprint is assigned for this layout.'],
  ['The scoring model', 'Written, not validated', 'demo',
    'Four signals scored against a fourteen-day baseline and blended through a logistic. It has never been compared with any clinical measure.'],
  ['Accuracy', 'None claimed', 'demo',
    'No study, no participants, no error rate. Any accuracy figure quoted for this device would be one we made up.'],
  ['The eight students', 'Invented', 'demo',
    'Student 8241 and the rest are numbers, carrying consent records we wrote ourselves.'],
  ['Regulatory status', 'Not a medical device', 'fact',
    'It does not diagnose, treat or screen for any condition, and nothing on this site should be read as saying it does.'],
]

const Status = ({ kind, children }) =>
  kind === 'demo'
    ? <span className="inline-flex items-baseline border-l-2 border-warn pl-2.5
        font-mono text-fine uppercase tracking-[0.09em] text-warn">{children}</span>
    : <Badge variant="state">{children}</Badge>

/* Two renderings of one list, because the phone cannot have the table. Three
   columns need about 480px of intrinsic width — the status cells and the
   `Thing` column do not fold — so at 390px the table scrolls sideways inside
   its own box and the column that scrolls out of sight is the third one, which
   is the column carrying the admission. A table nobody drags is a table nobody
   reads, so below `sm` the same rows stack. HONESTY stays the single source. */
function Honesty() {
  return (
    <>
      <ul className="m-0 list-none space-y-5 p-0 sm:hidden">
        {HONESTY.map(([what, status, kind, means]) => (
          <li key={what} className="border-t border-rule pt-3.5">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
              <span className="font-display text-ui font-medium text-ink">{what}</span>
              <Status kind={kind}>{status}</Status>
            </div>
            <p className="mt-2.5 text-sec text-ink-2">{means}</p>
          </li>
        ))}
      </ul>
      <Table className="hidden sm:block">
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
              <TD><Status kind={kind}>{status}</Status></TD>
              <TD className="text-sec text-ink-2">{means}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </>
  )
}

/* ── The stops ──────────────────────────────────────────────────────────── */
/* `art` is a function, not an element, so each stop's components mount fresh
   when the reader arrives — the dial counts up on arrival rather than having
   already finished behind a hidden panel. */
const STOPS = [
  {
    id: 'problem', nav: 'The problem',
    title: 'A counselor hears about a student once, then nothing for days',
    body: (
      <>
        <Lede>
          A counselor's record of a student is one conversation, when one happens, plus whatever a
          teacher passes on. Between those, nothing about that student gets written down.
        </Lede>
        <Lede>
          MindMap makes one narrow claim: measure four body signals continuously and there is a
          record of every day, not only the days someone spoke up. It does not claim to know why a
          day ran high, and it never compares one student against another — only against their own
          last two weeks.
        </Lede>
      </>
    ),
    art: EvidenceGap,
  },
  {
    id: 'hardware', nav: 'The hardware',
    title: 'A sealed lozenge, 64 × 42 mm, seven layers deep',
    body: (
      <>
        <Lede>
          The shell is one continuous spline lozenge — not a stadium, not a rounded rectangle —
          64 × 42 mm nominal, worn along the forearm. Inside it the stack is seven layers, and the
          electronics are a single flex-rigid PCB: a rigid island carrying a Seeed XIAO nRF52840,
          a MAX30102 optical sensor and the analog front end, with a polyimide flex bend arching
          over the island. The XIAO is bought; the carrier around it is ours.
        </Lede>
        <Lede>
          Two Ag/AgCl electrodes sit 28.0 mm apart, the optical centre is at X 0 / Y −8.0, and the
          skin side follows an R42 curve. Those are coordinates assigned in the model, not figures
          taken off a part.
        </Lede>
        <ul className="mt-6 m-0 list-none space-y-4 p-0">
          {LAYERS.map(l => (
            <li key={l.i} className="border-t border-rule pt-3">
              <p className="font-display text-ui font-medium text-ink">
                <span className="mr-2.5 font-mono text-tick text-ink-3">
                  {String(l.i + 1).padStart(2, '0')}</span>{l.title}</p>
              <p className="mt-1 text-sec text-ink-2">{l.body}</p>
            </li>
          ))}
        </ul>
        <Note>Design intent, not as-built. Every dimension above is assigned in the CAD; no
          MindMap engineering drawing, approved BOM or prototype measurement existed to check
          them against. No unit has been assembled and photographed, so no photograph of one
          appears here.</Note>
      </>
    ),
    art: Hardware,
    go: ['patch', 'Open the hardware page'],
  },
  {
    id: 'signals', nav: 'Four signals',
    title: 'What each of the four signals measures',
    body: (
      <>
        <Lede>
          Pulse, sweat, skin temperature and movement, off the forearm, once a second. Sweat moves
          first and heart-rate variability moves furthest; skin temperature drifts slowly enough to
          rule illness in or out.
        </Lede>
        <Lede>
          Movement is the control rather than a fifth reading. Above 0.35 g the score is held back,
          so a hard run cannot be scored as a hard day.
        </Lede>
      </>
    ),
    art: Signals,
    wide: true,
  },
  {
    id: 'student', nav: 'Student screen',
    title: 'The student sees one score out of 100, and every reading behind it',
    body: (
      <>
        <Lede>
          One number out of 100 and one plain sentence. The four rings are each signal's own
          distance from this person's fourteen-day baseline; the number in the middle is the
          model's blend of all four, so the rings deliberately do not add up to it.
        </Lede>
        <Lede>
          The student sees everything: every reading, second by second, and everything they write.
          Nothing on their own screen is withheld from them.
        </Lede>
      </>
    ),
    art: () => (
      <div>
        <RainbowDial score={51} usual={46} rings={studentRings()} size={340}/>
        <p className="mt-6 max-w-[34ch] font-display text-head font-medium text-ink">
          Today is a little higher than your normal.</p>
        <p className="mt-2 max-w-[34ch] text-sec text-ink-2">
          It went up in third period and has stayed there.</p>
        <DemoNotice className="mt-4">Sample data — not a real person.</DemoNotice>
      </div>
    ),
    go: ['student', 'Open the student screen'],
  },
  {
    id: 'parent', nav: 'Parent screen',
    title: 'The parent sees the week, and never a raw reading',
    body: (
      <>
        <Lede>
          A parent gets one number a day, one sentence a week, and which days sat above their
          child's own range. That is the whole of it.
        </Lede>
        <Lede>
          The line the product will not cross is here: a parent never sees a raw reading, never
          sees anything the student wrote, and never sees where they were. A product that showed a
          parent the raw stream would be a surveillance tool, and a teenager would stop wearing it.
        </Lede>
      </>
    ),
    art: () => {
      const band = DATA.weekBand || { hi: 1 }
      const over = (DATA.week || []).filter(d => d.v > band.hi).length
      const never = ['A raw reading', 'Anything written in the app', 'Where they were',
        'Anything said near the microphone']
      return (
        <div>
          <p className="max-w-[30ch] font-display text-head font-medium text-ink">
            Maya had a harder week than usual.</p>
          <WeekStrip days={DATA.week} band={DATA.weekBand} className="mt-5 max-w-[22rem]"/>
          <p className="mt-3 font-mono text-tick tabular-nums text-ink-3">
            {over} of {(DATA.week || []).length} above her usual range</p>
          <p className="mark mt-8">Never shown to a parent</p>
          <ul className="m-0 mt-3 list-none space-y-2.5 p-0">
            {never.map(t => (
              <li key={t} className="flex items-start gap-3 text-meta text-ink">
                <Never className="mt-1 size-4 shrink-0 text-ink-3"/>{t}
              </li>
            ))}
          </ul>
        </div>
      )
    },
    go: ['privacy', 'See who can see what'],
  },
  {
    id: 'counselor', nav: 'Counselor console',
    title: 'The counselor sees only the students whose guardian agreed',
    body: null,   /* built below, from the fixture, so the counts cannot drift */
    art: Caseload,
    go: ['pro', 'Open the counselor console'],
  },
  {
    id: 'honest', nav: 'Real vs demo',
    title: 'What is real and what is demonstration',
    body: (
      <>
        <Lede>
          This is the list a reviewer would otherwise have to assemble themselves, so we have
          written it out. Nothing on this site has been measured on a person.
        </Lede>
        <Lede>
          Everything marked below as generated, drawn or invented is exactly that. Three of the
          rows are the CAD package's own self-audit, and two of its ten answers are failures —
          they are printed here in the words the audit used, unresolved, because a failure we
          found ourselves is worth more on this page than a claim we cannot back.
        </Lede>
      </>
    ),
    art: Honesty,
    wide: true,
  },
  {
    id: 'scale', nav: 'At scale',
    title: 'What would change in one school, if this were real',
    body: (
      <>
        <Lede>
          This is arithmetic and an argument. It is a projection, not a finding: there is no
          adoption figure here, no effect size and no trial, because we have run none.
        </Lede>
        <Lede>
          The argument is about the order of a queue. A counselor's queue today is ordered by who
          asked, or who a teacher mentioned. This orders it by who moved fastest this week.
        </Lede>
      </>
    ),
    art: () => (
      <div>
        <p className="mark">The assumptions, named</p>
        <ol className="m-0 mt-3 list-none space-y-3 p-0">
          {[
            'A secondary school of about 1,200 students with three counselors — roughly 400 names each. That ratio is an assumption; we did not survey schools.',
            `Each wearer reports at 1 Hz through a ${SCHOOL_HOURS}-hour school day: ${PER_DAY.toLocaleString('en-US')} readings per student per day.`,
            'Some unknown fraction of students wear a patch, and some unknown fraction of guardians consent to trends. Both are unknown, and the split shown on the counselor screen is invented.',
            'Groups under five are never reported, so small classes return nothing however many students consent.',
          ].map((t, i) => (
            <li key={i} className="flex gap-3 border-t border-rule pt-3 text-sec text-ink-2">
              <span className="font-mono text-tick tabular-nums text-ink-3">
                {String(i + 1).padStart(2, '0')}</span>{t}
            </li>
          ))}
        </ol>
        <p className="mt-8 max-w-[54ch] text-meta text-ink">
          At 400 students a counselor cannot read 400 charts, which is why the output is a rank and
          a sentence rather than a dashboard. If the ranking is right, the student who is falling
          fastest is seen first instead of fourth.
        </p>
        <Note>What would prove this wrong: a trial in which counselors working from the ranked list
          reach students no earlier than counselors working from their existing referral queue. We
          have not run it, and until someone does, the paragraph above is a hypothesis.</Note>
      </div>
    ),
    wide: true,
  },
]

/* The counselor stop's prose is generated from the same roster the list draws,
   because a hand-written "five of eight" is a claim that goes stale the moment
   a consent record changes. */
function CaseloadBody() {
  const all = roster().length, ranked = triage().length
  const partial = scoreOnly().length, alerts = alertsOnly().length
  return (
    <>
      <Lede>
        {all} students on this caseload, in a list ordered by change rather than by how high the
        score is — a student who has been steady at 86 for a month is not the emergency.
      </Lede>
      <Lede>
        Consent decides who can appear. {ranked} guardians agreed to trends, so {ranked} students
        can be ranked; {partial} agreed to a score without trends and are listed unranked; the
        remaining {alerts} agreed to crisis alerts only, and that record carries no score at all.
        Ranking those {partial + alerts} anyway would leak exactly the thing they withheld.
      </Lede>
      <Note>Crisis alerts reach the counselor in every case. That is the one thing a guardian
        cannot consent away, and students are told so before they start wearing it.</Note>
    </>
  )
}

export function Tour({ go }) {
  const [i, setI] = React.useState(0)
  const anchor = React.useRef(null)
  const first = React.useRef(true)
  const stop = STOPS[i]

  /* Moving stop changes content above the control that changed it, so the
     reader is put back at the top of the stop. Skipped on first paint, or the
     page would scroll itself on arrival. Honour the reduced-motion setting
     explicitly: the global `scroll-behavior: smooth` is what would otherwise
     animate this. */
  React.useEffect(() => {
    if (first.current) { first.current = false; return }
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    anchor.current?.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' })
  }, [i])

  return (
    <main className="wrap py-14">
      <p className="note">Guided tour · {STOPS.length} stops</p>
      <h1 className="mt-3.5 font-display font-medium text-view leading-[1.05] tracking-tight text-ink">
        What we built, what it does, and what is still a demo
      </h1>
      <p className="mt-5 max-w-read text-lead leading-[1.55] text-ink-2">
        {STOPS.length} stops, about five minutes: the patch, the four signals, the three screens,
        and the list of everything here that is generated. Every chart on the way is the live
        component the real screen runs, not a recording of it.
      </p>

      <Tabs value={stop.id} onValueChange={v => setI(STOPS.findIndex(s => s.id === v))}
        className="mt-10">
        {/* The strip is the index and the control. Radix gives it roving focus
            and arrow keys; Previous and Next below are for the reader who is
            moving through in order and should not have to aim at a tab. */}
        <div ref={anchor} data-anchor>
          <TabsList aria-label="Tour stops" className="gap-x-6">
            {STOPS.map((s, n) => (
              <TabsTrigger key={s.id} value={s.id} className="gap-2 text-ui">
                <span className="font-mono text-fine tabular-nums text-ink-3">
                  {String(n + 1).padStart(2, '0')}</span>
                {s.nav}
              </TabsTrigger>
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
                  <h2 className="font-display font-medium text-sub leading-[1.12] tracking-tight text-ink">
                    {s.title}</h2>
                  {s.id === 'counselor' ? <CaseloadBody/> : s.body}
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

      {/* Position, then the two controls. The figure is announced because the
          strip above it is a scrolling row on a phone and the reader cannot
          always see where they are in it. */}
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
        <h2 className="font-display font-medium text-sub leading-[1.12] tracking-tight text-ink">
          Open the app yourself
        </h2>
        <p className="mt-3 max-w-[54ch] text-lead text-ink-2">
          The launcher opens the student screen, the parent screen and the counselor console.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Button onClick={() => go('app')}>Open the app<ArrowRight aria-hidden/></Button>
          <Button variant="outline" onClick={() => go('check')}>Score yourself in six questions</Button>
        </div>
      </section>

      {/* The closing questions — the star rating, the impact question and the
          one free-text box — had been written, built and then mounted nowhere,
          so no reviewer had ever been asked any of them. The end of the tour is
          where they belong: it is the only screen a person reaches having seen
          the whole thing. */}
      <Separator className="mt-14"/>
      <section className="py-14">
        <FinalSurvey/>
      </section>
    </main>
  )
}
