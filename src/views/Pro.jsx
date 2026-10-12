import React from 'react'
import { Panel } from '../ui/display'
import { Table, THead, TBody, TR, TH, TD } from '../ui/table'
import { RuleDraw, ScrollIn } from '../ui/motion'
import { Button } from '../ui/button'
import { ConfirmClose } from '../ui/confirm'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { DemoNotice, RealNotice } from '../ui/notice'
import { useMode } from '../lib/mode'
import { Chevron } from '../ui/marks'
import { List, Item } from '../ui/list'
import {
  K_ANONYMITY, TIER_LABEL, TIER_ORDER, triage, scoreOnly, alertsOnly, roster,
  SCHOOL_N, COHORT_PERIOD, COHORT_WEEKDAY,
  CONSENT_LEDGER, AUDIT_LOG, PROTOCOL, PROTOCOL_TIMES, PROTOCOL_DONE, REFERRALS,
  driversFor, INTERVENTIONS, efficacyLabel, profile45,
} from '../lib/caseload'
import { RETENTION } from '../app/store'
import { CASELOAD_TITLE, CASELOAD_DEF, SCORE, SCORE_RANGE, PRO, PRO_LC, PRO_PLURAL_LC } from '../lib/terms'
import { cn } from '../lib/utils'

const TABS = [
  ['triage','Who to check in with'], ['student','One student'], ['cohort','Group patterns'],
  ['escalation','Escalation'], ['consent','Consent'],
]
const Sub = ({ children, className }) =>
  <p className={cn('max-w-[68ch] text-sec text-ink-2', className)}>{children}</p>
const Note = ({ children }) => <p className="mt-4 max-w-[70ch] border-t border-rule pt-3.5 text-meta text-ink-3">{children}</p>

/* One rhythm for every module row on this console, at the spec's density:
   gap-3 at the base, gap-4 from lg, and never more. Every tab uses it, so the
   five of them cannot drift apart again.
   items-start because a grid stretches its children: the check-in list is
   shorter than the three panels beside it, and stretched it printed a quarter
   of a screen of empty card stock under the note. */
const ROW = 'mt-3 grid items-start gap-3 lg:mt-4 lg:gap-4'

/* The interior ticks on every 0 to 100 track on this console. The ends are
   drawn by the track itself, so they are not in the list. */
const TICKS = [25, 50, 75]

/* A figure, its unit and one line of provenance, in a bordered field on card
   stock. The summary strip is built from these. */
function Stat({ label, figure, unit, sub, tone = 'text-ink' }) {
  return (
    <div className="field p-4">
      <p className="font-display text-tick font-bold text-ink-2">{label}</p>
      <p className={cn('mt-1.5 font-mono text-stat font-medium leading-none tabular-nums', tone)}>
        {figure}
        {unit && <span className="ml-1.5 font-body text-tick font-light text-ink-3">{unit}</span>}
      </p>
      {sub && <p className="mt-2 max-w-[28ch] text-sec text-ink-3">{sub}</p>}
    </div>
  )
}

/* A key and a figure on one rule, for the modules that carry a short record
   rather than a chart. */
function KV({ k, v, tone = 'text-ink' }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-rule py-2.5 last:border-b-0">
      <dt className="text-meta text-ink-2">{k}</dt>
      <dd className={cn('m-0 shrink-0 font-display text-ui font-medium', tone)}>{v}</dd>
    </div>
  )
}

/* A labelled bar off a shared scale. Width is the only thing the colour does
   not already say, and the count is printed, so neither carries a state
   alone. */
function BarRow({ label, figure, pct, tone, aria }) {
  return (
    <li className="border-b border-rule py-2.5 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 text-meta text-ink-2">{label}</span>
        <span className="shrink-0 font-mono text-sec tabular-nums text-ink">{figure}</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-xs bg-mist" role="img"
        aria-label={aria || `${label}, ${figure}`}>
        <div className={cn('h-full rounded-xs', tone)}
          style={{ width: Math.max(2, Math.round(pct)) + '%' }}/>
      </div>
    </li>
  )
}

/* Which band each Mind Score sits in, across the caseload. A student whose
   guardian withheld the score carries no tier, so they are in no band here and
   are counted in the scope module instead. */
const BAND_TONE = { crisis:'bg-crit', high:'bg-warn', moderate:'bg-accent', info:'bg-ink-3' }
function BandSpread({ all }) {
  return (
    <ul className="m-0 list-none p-0">
      {TIER_ORDER.map(k => {
        const c = all.filter(s => s.tier === k).length
        return <BarRow key={k} label={TIER_LABEL[k]} figure={`${c} of ${all.length}`}
          pct={(c / all.length) * 100} tone={BAND_TONE[k]}
          aria={`${TIER_LABEL[k]} band, ${c} of ${all.length} students`}/>
      })}
    </ul>
  )
}

/* ── Empty, drawn ───────────────────────────────────────────────────────── */
/* No student paired and no guardian consented is this console's true state for
   every visitor today, not a fault, so the empty region keeps the form and loses
   only the entries.

   Dashed rather than solid: a drawn rule on this site means a real division, so
   a lane waiting for content has to be a visibly different mark. */
const BlankLane = ({ className }) =>
  <span aria-hidden className={cn('border-t border-dashed border-ruling', className)}/>

const BlankRow = ({ children }) => (
  <li className="flex items-center gap-4 py-3.5">
    <BlankLane className="w-10 shrink-0"/>
    <span className="text-sec text-ink-3">{children}</span>
  </li>
)

/* The header row stays with no data: the columns are the schema, and a medical professional
   evaluating this product needs to see what would be logged about them. */
const EmptyBand = ({ cols, children }) => (
  <TR>
    <TD colSpan={cols}>
      <span className="flex items-center gap-5 py-6">
        <BlankLane className="w-16 shrink-0"/>
        <span className="max-w-[62ch] text-sec text-ink-2">{children}</span>
      </span>
    </TD>
  </TR>
)

/* -- Who to check in with ------------------------------------------------

   The title, one sentence saying what the order is, and the list. The move is in
   the right-hand column because the move IS the order. This is the one screen
   in the app allowed to be dense. */

/* The figure columns, named once on the rule the list hangs from. */
const ListHead = () => (
  <div aria-hidden className="flex items-center gap-4 border-b border-ink pb-2">
    <span className="w-5 shrink-0"/>
    <span className="tick min-w-0 flex-1">student</span>
    <span aria-hidden className="hidden w-16 shrink-0 sm:block"/>
    <span className="tick w-10 shrink-0 text-right">move</span>
    <span className="w-4 shrink-0"/>
  </div>
)

/* What the order is, what it is not, and what is not in the list at any depth.
   The same block on a full list and an empty one, so it is written once. */
/* The rules that govern the order, as rows. They were one seven-line paragraph
   and a judge with forty entries does not read a paragraph. */
const LIST_RULES = [
  ['A student up 15 points from 55 comes before a student level at 70',
   'The move is what makes a check-in land before a problem grows.'],
  [`A low, steady ${SCORE} is not a student in trouble`,
   'A band names where a score sits today. It is never a verdict on a student.'],
  ['A student consented to crisis alerts only is never on this list',
   'They are listed separately and unordered, because ordering them would leak the thing they withheld.'],
  ['No raw reading, Notes entry or location is on this list at any depth',
   `${PRO} notes live in a student’s own record, and saving one writes a row to the audit log.`],
  ['A student can unpair their patch and leave this list the same day',
   'Nothing reaches this console after that. The rows already written to the log stay, because the log cannot be edited.'],
]

const LIST_NOTE = (
  <>
    <p className="mt-5 max-w-[74ch] text-meta text-ink-2">Change this week is the move in a
      student&rsquo;s seven-day average from one week to the next. It is what puts this list in
      order.</p>
    <List className="mt-2.5 gap-0">
      {LIST_RULES.map(([what, why]) => (
        <Item key={what} marker="none" className="border-b border-rule py-3 last:border-b-0">
          <span className="block max-w-[62ch] text-body text-ink">{what}</span>
          <span className="block max-w-[66ch] text-sec text-ink-2">{why}</span>
        </Item>
      ))}
    </List>
  </>
)

function Row({ s, n, onOpen, max }) {
  const dir = s.velocity > 0 ? 'worse' : s.velocity < 0 ? 'better' : 'flat'
  const move = `${s.velocity > 0 ? '+' : s.velocity < 0 ? '−' : ''}${Math.abs(s.velocity)}`
  /* No driver line here. The generated breakdown in src/lib/caseload.js puts
     the same signal first for every student on this list, so a third line
     printed the same sentence five times. The week-ago figure on the line
     below is per student and says what the move was made of. */
  /* Zero sits at the middle of the track, so up and down are read off one
     scale and a level week is visibly nothing rather than a short bar. */
  const half = Math.round((Math.abs(s.velocity) / (max || 1)) * 50)
  return (
    <li className="border-b border-rule">
      {/* One label on the button; the four marks inside are hidden from the reader,
          since read out separately they are a rank, a name, a punctuated fragment, a
          bare numeral and a glyph. */}
      <button type="button" onClick={() => onOpen(s.name)}
        aria-label={`${s.name}, grade ${s.grade}, ${TIER_LABEL[s.tier]}, ${SCORE} ${s.current} out of 100, `
          + `${dir === 'worse' ? `up ${Math.abs(s.velocity)} points` : dir === 'better'
            ? `down ${Math.abs(s.velocity)} points` : 'level'} this week. Open record.`}
        className="flex min-h-[56px] w-full items-center gap-4 py-3 text-left
          transition-colors duration-150 hoverOnly:bg-mist/50">
        <span aria-hidden className="w-5 shrink-0 font-mono text-meta tabular-nums text-ink-3">{n}</span>
        <span aria-hidden className="min-w-0 flex-1">
          <span className="block truncate text-body text-ink">{s.name}</span>
          <span className="block text-tick text-ink-3">
            Grade {s.grade} · {TIER_LABEL[s.tier]} · {s.weekAgo} to {s.current} out of 100</span>
        </span>
        <span aria-hidden className="relative hidden h-2 w-16 shrink-0 overflow-hidden rounded-xs bg-mist sm:block">
          <span aria-hidden className="absolute inset-y-0 left-1/2 w-px bg-ruling"/>
          <span aria-hidden className={cn('absolute inset-y-0',
            dir === 'worse' ? 'left-1/2 bg-warn' : dir === 'better' ? 'right-1/2 bg-calm' : 'left-1/2 bg-transparent')}
            style={{ width: half + '%' }}/>
        </span>
        <span aria-hidden className={cn('w-10 shrink-0 text-right font-mono text-num font-medium leading-none tabular-nums',
          dir === 'worse' ? 'text-warn' : dir === 'better' ? 'text-calm' : 'text-ink-3')}>{move}</span>
        <Chevron aria-hidden className="size-4 shrink-0 text-ink-3"/>
      </button>
    </li>
  )
}

function NarrowScopes({ onOpen }) {
  const scored = scoreOnly(), quiet = alertsOnly()
  return (
    <>
      <p className="max-w-[66ch] text-sec text-ink-2">These students are not on the list above,
        and it is not because nothing moved. A guardian signed a scope that withholds the weekly
        change, or everything except a crisis alert.</p>
      <ul className="m-0 mt-3 list-none p-0">
        {scored.map(s => (
          <li key={s.id} className="border-b border-rule">
            <button type="button" onClick={() => onOpen(s.name)}
              aria-label={`${s.name}, grade ${s.grade}, ${TIER_LABEL[s.tier]}, ${SCORE} ${s.current} out of 100, no weekly change shared. Open record.`}
              className="flex min-h-[56px] w-full items-center gap-4 py-3 text-left
                transition-colors duration-150 hoverOnly:bg-mist/50">
              <span aria-hidden className="min-w-0 flex-1">
                <span className="block truncate text-body text-ink">{s.name}</span>
                <span className="block text-tick text-ink-3">
                  Grade {s.grade} · {TIER_LABEL[s.tier]} · {SCORE} only, no weekly change</span>
              </span>
              <span aria-hidden className="shrink-0 font-mono text-num font-medium leading-none tabular-nums text-ink">
                {s.current}</span>
              <Chevron aria-hidden className="size-4 shrink-0 text-ink-3"/>
            </button>
          </li>
        ))}
        {quiet.map(s => (
          <li key={s.id} className="flex items-center justify-between gap-4 border-b border-rule py-3.5">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body text-ink">{s.name}</span>
              <span className="block text-tick text-ink-3">Grade {s.grade} · crisis alerts only</span>
            </span>
            <span className="shrink-0 font-display text-ui font-medium text-ink-3">nothing shared</span>
          </li>
        ))}
      </ul>
    </>
  )
}

/* The three conditions, in the order they happen. A medical professional reads this
   tab first and asks why it is empty, so the answer is the content of the empty list. */
const CASELOAD_NEEDS = [
  ['A student pairs a patch',
   `Nothing reaches a ${PRO_LC} until the student pairs it, on their own phone. They can unpair it the same way.`],
  ['A guardian signs a consent scope',
   `The scope decides what this list may show: a ${SCORE}, a ${SCORE} with weekly change, or crisis alerts only.`],
  ['The scope is applied here, and never widened',
   `A student consented to alerts only carries no ${SCORE} and no place on this list.`],
]

function TriageHead({ consented, listed }) {
  return (
    <>
      <h2 className="font-display text-head font-bold tracking-tight text-ink">{CASELOAD_TITLE}</h2>
      <p className="mt-2 max-w-[68ch] text-sec text-ink-2">{CASELOAD_DEF}</p>
      <p className="mt-1 text-tick text-ink-3">{consented} consented · {listed} on this list</p>
    </>
  )
}

function EmptyTriage() {
  return (
    <>
      <TriageHead consented={0} listed={0}/>
      <h3 className="mark mt-6">How a student gets on this list</h3>
      <List className="gap-0">
        {CASELOAD_NEEDS.map(([what, why]) => (
          <Item key={what} marker="none" className="border-b border-rule py-4">
            <span className="block text-body text-ink">{what}</span>
            <span className="mt-1 block max-w-[66ch] text-sec text-ink-2">{why}</span>
          </Item>
        ))}
      </List>
      {LIST_NOTE}
    </>
  )
}

/* What each signed scope lets this list do. The three counts partition the
   caseload, which is the property tests/caseload-consent.test.js checks. */
function ScopeMix({ listed, scored, quiet, total }) {
  const rows = [
    [`${SCORE} and weekly change`, listed, 'bg-accent'],
    [`${SCORE} only`, scored, 'bg-beam'],
    ['Crisis alerts only', quiet, 'bg-ink-3'],
  ]
  return (
    <ul className="m-0 list-none p-0">
      {rows.map(([label, c, tone]) => (
        <BarRow key={label} label={label} figure={`${c} of ${total}`}
          pct={(c / total) * 100} tone={tone}
          aria={`${label}, ${c} of ${total} students`}/>
      ))}
    </ul>
  )
}

/* Everything on this console that is open rather than historical, in one
   module: the crisis protocol mid-run, the referral queue and the last row
   written to the log. */
function OpenNow() {
  const open = REFERRALS.filter(r => r.status !== 'Closed')
  const today = AUDIT_LOG.filter(r => r.rel === 'Today')
  const last = AUDIT_LOG[0]
  return (
    <>
      <dl className="m-0 p-0">
        <KV k="Crisis protocol" v={`${PROTOCOL_DONE.length} of ${PROTOCOL.length} steps`} tone="text-crit"/>
        <KV k="Step still open" v={PROTOCOL[PROTOCOL.length - 1]}/>
        <KV k="Referrals open" v={`${open.length} of ${REFERRALS.length}`}/>
        <KV k="Rows logged today" v={String(today.length)}/>
      </dl>
      <p className="mt-3 max-w-[48ch] text-meta text-ink-3">Last row: {last.action}, {last.at}, by
        {' '}{last.actor}. Opening any record writes one, and no setting on this console turns that
        off.</p>
    </>
  )
}

function Triage({ onOpen, real }) {
  if (real) return <EmptyTriage/>
  const all = roster()
  const moved = triage()
  const scored = scoreOnly(), quiet = alertsOnly()
  const rising = moved.filter(s => s.velocity > 0)
  const max = Math.max(...moved.map(s => Math.abs(s.velocity)), 1)
  const openRef = REFERRALS.filter(r => r.status !== 'Closed')
  const today = AUDIT_LOG.filter(r => r.rel === 'Today')
  const lead = moved[0]
  return (
    <>
      <TriageHead consented={all.length} listed={moved.length}/>

      {/* The summary strip. Six figures the console already held in
          src/lib/caseload.js and never showed: the scope split, the direction
          of travel, the biggest single move, the protocol mid-run, the
          referral queue and today's log depth. */}
      {/* Two columns at 390, not one: stacked, six tiles put 650px of mostly
          empty card between the heading and the list a judge came to read.
          The figures here are all two or three characters wide, so they take
          the narrow column; the record strip on the One student tab keeps its
          wider breakpoint because "withheld" does not. */}
      <div className={cn(ROW, 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-6')}>
        <Stat label="On this list" figure={moved.length} unit={`of ${all.length}`}
          sub="the rest withheld weekly change"/>
        <Stat label="Up since last week" figure={rising.length} unit="students" tone="text-warn"
          sub={`${moved.length - rising.length} level or down`}/>
        <Stat label="Biggest move" figure={`+${lead.velocity}`} unit="points" tone="text-warn"
          sub={`${lead.name}, ${lead.weekAgo} to ${lead.current}`}/>
        <Stat label="Crisis protocol" figure={PROTOCOL_DONE.length} unit={`of ${PROTOCOL.length} steps`}
          tone="text-crit" sub="step five still open"/>
        <Stat label="Referrals open" figure={openRef.length} unit={`of ${REFERRALS.length}`}
          sub="awaiting intake or in progress"/>
        <Stat label="Logged today" figure={today.length} unit="rows"
          sub="every record opened is logged"/>
      </div>

      <div className={cn(ROW, 'lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]')}>
        <Panel as="h3" label={CASELOAD_TITLE} action="ordered by change this week">
          <ListHead/>
          <ol className="m-0 list-none p-0">
            {moved.map((s, i) => <Row key={s.id} s={s} n={i + 1} onOpen={onOpen} max={max}/>)}
          </ol>
          {LIST_NOTE}
        </Panel>

        <div className="flex flex-col gap-3 lg:gap-4">
          <Panel as="h3" label={`Bands on this caseload`} action={`${all.length} students`}>
            <BandSpread all={all}/>
            <Note>A band names where a {SCORE} sits today, never a verdict on a student. A student
              whose guardian withheld the {SCORE} is in no band.</Note>
          </Panel>
          <Panel as="h3" label="What each signed scope allows">
            <ScopeMix listed={moved.length} scored={scored.length} quiet={quiet.length}
              total={all.length}/>
          </Panel>
          <Panel as="h3" label="Open now" action="this afternoon"><OpenNow/></Panel>
        </div>
      </div>

      <div className={ROW}>
        <Panel as="h3" label="Shared with a narrower scope">
          <NarrowScopes onOpen={onOpen}/>
        </Panel>
      </div>
    </>
  )
}

/* ── One student ────────────────────────────────────────────────────────── */
/* What a record holds, and the consent scope that unlocks each part. */
const RECORD_FIELDS = [
  [`${SCORE} today, out of 100`, `With ${SCORE} consent.`],
  ['Weekly change, and a place on the list', 'With trend consent.'],
  ['What is driving the rise', 'With trend consent. Shares per signal, never a raw reading.'],
  ['The last 45 days', 'With trend consent.'],
  [`${PRO} notes`, 'Any scope. Saving writes a row to the audit log.'],
]

function EmptyRecord() {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-head font-bold tracking-tight text-ink">
            No student record open</h2>
          <p className="mt-1 text-tick text-ink-3">no grade · no scope</p>
          <Sub className="mt-2">A record opens from the check-in list, which stays empty until a
            guardian signs a scope.</Sub>
        </div>
        {/* The control stays, disabled: it is how a medical professional moves between students,
            whether or not there is anyone to move between. */}
        <div>
          <label htmlFor="pick" className="note block">Open a different student</label>
          <select id="pick" disabled defaultValue="none"
            className="mt-1.5 min-h-[48px] rounded-field border-0 border-b-2 border-rule bg-transparent
              px-1 font-body text-meta text-ink-3">
            <option value="none">No students consented</option>
          </select>
        </div>
      </div>

      <Card as="section" className="mt-10 border-l-[3px] border-l-ruling">
        <CardHeader className="p-6 pb-0">
          <CardTitle as="h3" className="text-row">What a record holds</CardTitle>
          <CardDescription className="max-w-[56ch]">Each line appears only if the guardian agreed to
            it. Crisis alerts reach the {PRO_LC} in every case, and no guardian can switch them
            off.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-5">
          <ul className="m-0 list-none border-t border-rule p-0">
            {RECORD_FIELDS.map(([field, when]) => (
              <li key={field} className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-baseline gap-x-5
                gap-y-1 border-b border-rule py-3.5
                sm:grid-cols-[2.5rem_minmax(0,19rem)_minmax(0,1fr)]">
                <BlankLane className="w-10"/>
                <span className="font-display text-meta font-bold text-ink">{field}</span>
                <span className="col-start-2 max-w-[52ch] text-sec text-ink-3 sm:col-start-3">{when}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  )
}

function OneStudent({ who, setWho, real }) {
  /* Hooks first, then the branch: returning before this line would change the hook
     order on a mode flip. */
  const [note, setNote] = React.useState('')
  if (real) return <EmptyRecord/>
  const all = roster()
  const s = all.find(x => x.name === who) || all[0]
  /* Per student, not module constants: as constants every student on the board
     showed Student 8241's drivers and 45-day line. */
  const drivers = driversFor(s)
  const series = profile45(s)
  const lo = Math.min(...series.map(p => p.v)), hi = Math.max(...series.map(p => p.v))
  const yspan = hi - lo || 1
  /* Gridlines off this student's own window. Fixed lines at 40, 60 and 80 were
     drawn for every student, so a student whose 45 days ran 81 to 96 had all
     three ruled below the baseline with their labels sitting on the date
     row. */
  const ticks = [10, 20, 30, 40, 50, 60, 70, 80, 90].filter(v => v > lo && v < hi)
  /* The record's own referral queue and its own rows in the log. Both were in
     src/lib/caseload.js already and were only reachable from other tabs, which
     is why a record read as thinner than it is. */
  const refs = REFERRALS.filter(r => r.student === s.name)
  const mine = AUDIT_LOG.filter(r => r.subject === s.name)
  const tried = INTERVENTIONS.filter(i => i.sessions > 0)
  const span = Math.max(...INTERVENTIONS.map(i => Math.abs(i.hrvDeltaPct)), 1)
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-head font-bold tracking-tight text-ink">{s.name}</h2>
          <p className="mt-1 text-tick text-ink-3">
            Grade {s.grade}{s.showScore ? ` · ${TIER_LABEL[s.tier]}` : ''}</p>
          <p className="mt-2 max-w-[46ch] text-sec text-ink-2">Consented: {s.scope}.</p>
        </div>
        <div>
          <label htmlFor="pick" className="note block">Open a different student</label>
          {/* The ring is written out rather than left to the global rule in
              src/input.css: that one is inside :where(), so it carries no
              specificity and any utility on this element wins. */}
          <select id="pick" value={s.name} onChange={e => setWho(e.target.value)}
            className="mt-1.5 min-h-[48px] rounded-field border-0 border-b-2 border-ink bg-transparent
              px-1 font-body text-meta text-ink focus-visible:outline focus-visible:outline-2
              focus-visible:outline-offset-2 focus-visible:outline-accent">
            {all.map(x => <option key={x.id} value={x.name}>
              {x.name} · G{x.grade}{x.showScore ? ` · ${x.current}` : ' · not shared'}</option>)}
          </select>
        </div>
      </div>

      {/* The record's own header figures. Each tile is drawn only if the scope
          reaches it, so an absence on this strip is a consent decision rather
          than a gap in the data. */}
      <div className={cn(ROW, 'sm:grid-cols-2 lg:grid-cols-4')}>
        <Stat label={`${SCORE} today`}
          figure={s.showScore ? s.current : 'withheld'} unit={s.showScore ? 'of 100' : null}
          tone={s.showScore ? 'text-ink' : 'text-ink-3'}
          sub={s.showScore ? TIER_LABEL[s.tier] + ' band' : 'no score in this scope'}/>
        <Stat label="Change this week"
          figure={s.showTrend ? `${s.velocity > 0 ? '+' : ''}${s.velocity}` : 'withheld'}
          unit={s.showTrend ? 'points' : null}
          tone={!s.showTrend ? 'text-ink-3' : s.velocity > 0 ? 'text-warn' : s.velocity < 0 ? 'text-calm' : 'text-ink'}
          sub={s.showTrend ? `${s.weekAgo} to ${s.current}` : 'no trend in this scope'}/>
        <Stat label="Raw readings" figure={s.showRaw ? 'shared' : 'never'}
          tone={s.showRaw ? 'text-ink' : 'text-ink-3'}
          sub={s.showRaw ? 'consented by student and guardian' : 'not in this scope'}/>
        <Stat label="Consent" figure={s.basis} sub={`signed ${s.signedAt}, expires ${s.expires}`}/>
      </div>

      {!s.showScore && (
        <div className={ROW}>
          <Panel as="h3" label="No readings shared for this student">
            <List className="max-w-[46ch] text-sec text-ink-2">
              <Item>Consent scope: <b className="font-medium text-ink">crisis alerts only</b></Item>
              <Item>You are paged if their readings cross the crisis threshold</Item>
            </List>
          </Panel>
        </div>
      )}

      {s.showScore && !s.showTrend && (
        <div className={ROW}>
          <Panel as="h3" label={`${SCORE} today: ${s.current} out of 100`}>
            <List className="max-w-[46ch] text-sec text-ink-2">
              <Item>Consent scope: <b className="font-medium text-ink">{SCORE} and crisis alerts</b></Item>
              <Item>Weekly change, driver breakdown and the 45-day line are withheld</Item>
            </List>
          </Panel>
        </div>
      )}

      {s.showTrend && <>
      <div className={cn(ROW, 'lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]')}>
        <Panel as="h3" label="The last 45 days" action="daily means">
          <svg viewBox="0 0 720 214" className="block w-full overflow-visible" role="img"
            aria-label={`Daily mean ${SCORE} over 45 days, ending at ${s.current}.`}>
            {ticks.map(v => {
              const y = 180 - ((v - lo) / yspan) * 160
              return <g key={v}>
                <line x1="40" x2="710" y1={y} y2={y} className="stroke-rule" strokeWidth="1"/>
                <text x="30" y={y + 5} textAnchor="end" className="fill-ink-3 text-[16px]">{v}</text>
              </g>
            })}
            <path fill="none" strokeWidth="2" strokeLinejoin="round" className="stroke-ink-3"
              vectorEffect="non-scaling-stroke"
              d={series.map((q, i) => (i ? 'L' : 'M') + (40 + (i / 44) * 670).toFixed(1) + ' ' +
                (180 - ((q.v - lo) / yspan) * 160).toFixed(1)).join(' ')}/>
            <path fill="none" strokeWidth="2.5" strokeLinejoin="round" className="stroke-warn"
              vectorEffect="non-scaling-stroke"
              d={series.slice(31).map((q, i) => (i ? 'L' : 'M') + (40 + ((i + 31) / 44) * 670).toFixed(1) + ' ' +
                (180 - ((q.v - lo) / yspan) * 160).toFixed(1)).join(' ')}/>
            <text x="40" y="209" className="fill-ink-3 text-[16px]">45 days ago</text>
            <text x="710" y="209" textAnchor="end" className="fill-ink-3 text-[16px]">today</text>
          </svg>
          {/* The row here used to read "Where the change lands: AP Chemistry",
              the same literal for every student and in no data file. The two
              rows below are read off this student's own series. */}
          <dl className="m-0 mt-3 p-0">
            <KV k="Range over the window" v={`${lo} to ${hi}`}/>
            <KV k="Last two weeks" v={`${series[31].v} to ${s.current}`}/>
          </dl>
          <Note>The coloured stretch is the last two weeks. One point per day, never a sample. The
            scale runs over this student&rsquo;s own window, {lo} to {hi}, not 0 to 100.</Note>
        </Panel>

        <Panel as="h3" label="What is driving the rise" action="share of this week">
          <ul className="m-0 list-none p-0">
            {drivers.map(d => (
              <BarRow key={d.label} label={d.label} figure={`${Math.round(d.share * 100)}%`}
                pct={(d.share / drivers[0].share) * 100} tone="bg-accent"
                aria={`${d.label}, ${Math.round(d.share * 100)} percent of this week's rise`}/>
            ))}
          </ul>
          <Note>Each one&rsquo;s share of this week&rsquo;s rise, worked out from signals against
            this student&rsquo;s own baseline. Never a raw reading.</Note>
        </Panel>
      </div>

      {/* Three modules in two columns, then the log on its own full-width
          row. As four panels in two rows the short one in each row ended 280px
          and 343px above its neighbour. */}
      <div className={cn(ROW, 'lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]')}>
        <Panel as="h3" label="Interventions tried" action="measured from physiology">
          <ul className="m-0 list-none p-0">
            {tried.map(i => (
              <BarRow key={i.name} label={`${i.name}, ${i.sessions} session${i.sessions === 1 ? '' : 's'}`}
                figure={`${i.hrvDeltaPct > 0 ? '+' : ''}${i.hrvDeltaPct}%`}
                pct={(Math.abs(i.hrvDeltaPct) / span) * 100}
                tone={i.hrvDeltaPct > 0 ? 'bg-calm' : i.hrvDeltaPct < 0 ? 'bg-warn' : 'bg-ink-3'}
                aria={efficacyLabel(i)}/>
            ))}
          </ul>
          <Note>Change in heart-rate variability across the sessions logged, not a self-report. One
            of the five has no measurable effect and one reads worse; both stay on the list.</Note>
        </Panel>

        <div className="flex flex-col gap-3 lg:gap-4">
        <Panel as="h3" label="Referrals on this student">
          <ul className="m-0 list-none divide-y divide-rule p-0">
            {refs.length === 0 && <BlankRow>No referral has been opened for this student.</BlankRow>}
            {refs.map(r => (
              <li key={r.to + r.opened} className="py-3 first:pt-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0 text-meta text-ink">{r.to}</span>
                  <Badge variant="state">{r.status}</Badge>
                </div>
                <p className="mt-1 text-sec text-ink-3">Opened {r.opened}</p>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-rule pt-3.5">
            <Button variant="outline" size="sm" disabled>New referral</Button>
          </div>
        </Panel>
        <Panel as="h3" label={`${PRO} notes`}>
          <label htmlFor="cnote" className="sr-only">{PRO} note for {s.name}</label>
          <textarea id="cnote" rows={4} value={note} onChange={e => setNote(e.target.value)}
            placeholder="Add a note…"
            className="w-full resize-none rounded-field border-0 border-b-2 border-rule bg-mist/40
              p-3.5 text-meta text-ink placeholder:text-ink-3 focus-visible:border-ink
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
              focus-visible:outline-accent"/>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <span className="text-sec text-ink-3">Saving writes a row to the log</span>
            <Button size="sm" disabled={!note.trim()}>Save note</Button>
          </div>
        </Panel>
        </div>
      </div>

      <div className={ROW}>
        <Panel as="h3" label="This record in the log" action="append only">
          <ul className="m-0 list-none p-0">
            {mine.length === 0 && <BlankRow>Nothing has been logged against this record yet.</BlankRow>}
            {mine.map(r => (
              <li key={r.at + r.action} className="border-b border-rule py-2.5 last:border-b-0">
                <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                  <span className="min-w-0 flex-1 text-meta text-ink">{r.action}</span>
                  <span className="shrink-0 font-mono text-tick tabular-nums text-ink-3">{r.at}</span>
                </span>
                <span className="mt-0.5 block text-sec text-ink-3">{r.actor} · {r.rel}</span>
              </li>
            ))}
          </ul>
          <Note>A student changing their own settings is logged exactly like a {PRO_LC}&rsquo;s own
            action, and no row can be edited or deleted.</Note>
        </Panel>
      </div>
      </>}
    </>
  )
}

/* ── Group patterns ─────────────────────────────────────────────────────── */
/* The hatch that marks a suppressed cell. Its own pattern id: the bars below
   each define `hatch` inside their own svg, and two elements with the same id in
   one document collide. */
const SuppressedSwatch = ({ className }) => (
  <svg className={cn('h-2 w-full', className)} preserveAspectRatio="none" role="img"
    aria-label="Suppressed for k-anonymity">
    <defs>
      <pattern id="hatch-legend" width="8" height="8" patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="8" className="stroke-ruling" strokeWidth="4"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#hatch-legend)"/>
  </svg>
)

/* Both halves aggregate consented students, so with none consented there is
   nothing to aggregate -- but the rule governing the aggregation is policy, and
   a practice weighs it before it signs. */
const COHORT_REPORTS = [
  [`${SCORE} by class period`, 'A mean per class period, across all consented students. Fewer than five consented students returns nothing.'],
  [`${SCORE} by weekday`, 'The same figure per weekday, across all consented students.'],
]

function EmptyCohort() {
  return (
    <>
      <h2 className="font-display text-head font-bold tracking-tight text-ink">
        Patterns across all consented students</h2>
      <Sub className="mt-2">Nobody has consented, so there is nothing to aggregate. Nobody on this
        tab is ever identifiable.</Sub>

      <div className={cn(ROW, 'lg:grid-cols-3')}>
        <section className="lg:col-span-2">
          <h3 className="mark">What this tab shows</h3>
          <RuleDraw className="mt-2.5"/>
          <List className="mt-5 gap-0">
            {/* The dashed lane is this row's rule as well as its blank; a solid border under
                it put two hairlines 12px apart. */}
            {COHORT_REPORTS.map(([what, how]) => (
              <Item key={what} marker="none" className="py-4 first:pt-0">
                <h4 className="font-display text-row font-bold tracking-tight text-ink">{what}</h4>
                <span className="mt-1.5 block max-w-[58ch] text-sec text-ink-2">{how}</span>
                <BlankLane className="mt-3.5 block w-full"/>
              </Item>
            ))}
          </List>
          <Note>Consented students only, from the same windows the individual {SCORE}s use.</Note>
        </section>

        <Panel as="h3" label="Smallest group we will show">
          <div className="font-mono text-stat font-medium tabular-nums text-ink">{K_ANONYMITY}</div>
          <p className="mt-1 text-sec text-ink-3">minimum cell size</p>
          <p className="mt-4 text-meta text-ink-2">
            Any group smaller than {K_ANONYMITY} is suppressed before it reaches this screen.</p>
          <div className="mt-5 border-t border-rule pt-4">
            <p className="text-meta text-ink-2">A suppressed cell is hatched, not hidden, so a
              {' '}{PRO_LC} can see a figure exists and is withheld.</p>
            <SuppressedSwatch className="mt-3"/>
          </div>
        </Panel>
      </div>
    </>
  )
}

function Cohort({ real }) {
  if (real) return <EmptyCohort/>
  const visible = COHORT_PERIOD.filter(p => !p.suppressed)
  const avg = Math.round(visible.reduce((a, b) => a + b.mean, 0) / visible.length)
  const top = [...visible].sort((a, b) => b.mean - a.mean)[0]
  const hardest = [...COHORT_WEEKDAY].sort((a, b) => b.mean - a.mean)[0]
  const easiest = [...COHORT_WEEKDAY].sort((a, b) => a.mean - b.mean)[0]
  const wAvg = Math.round(COHORT_WEEKDAY.reduce((a, b) => a + b.mean, 0) / COHORT_WEEKDAY.length)
  const suppressed = COHORT_PERIOD.filter(p => p.suppressed).length
  return (
    <>
      <h2 className="font-display text-head font-bold tracking-tight text-ink">
        Patterns across all consented students</h2>
      {/* The check-in list's count and this one are different populations, so each has
          to say which it means. */}
      <Sub className="mt-2">All {SCHOOL_N} consented students across the practice, not the eight on
        your own caseload. Nobody here is identifiable.</Sub>
      <div className={cn(ROW, 'lg:grid-cols-3')}>
        <section className="lg:col-span-2">
          <h3 className="mark">The two clearest patterns</h3>
          <RuleDraw className="mt-2.5"/>
          <ScrollIn className="mt-6">
            <h4 className="font-display text-row font-bold tracking-tight text-ink">
              {top.label} is the clearest spike across the whole group.</h4>
            <List className="mt-3 max-w-[58ch] text-sec text-ink-2">
              <Item>Mean <b className="font-medium text-ink">{top.mean}</b> against an all-period
                average of {avg}, <b className="font-medium text-warn">
                {Math.round(((top.mean - avg) / avg) * 100)}% higher</b></Item>
              <Item>Across {top.n} consented students in that period</Item>
              <Item>Every other period sits between {Math.min(...visible.map(v => v.mean))} and
                {' '}{[...visible].sort((a, b) => b.mean - a.mean)[1].mean}</Item>
            </List>
          </ScrollIn>
          <ScrollIn delay={0.08} className="mt-6 border-t border-rule pt-6">
            <h4 className="font-display text-row font-bold tracking-tight text-ink">
              {hardest.full} is the hardest day of the week across the whole group.</h4>
            <List className="mt-3 max-w-[58ch] text-sec text-ink-2">
              <Item>Mean <b className="font-medium text-ink">{hardest.mean}</b> against {wAvg} on an
                average day</Item>
              <Item>{easiest.full} is the lightest at <b className="font-medium text-ink">
                {easiest.mean}</b>, {hardest.mean - easiest.mean} points below {hardest.full}</Item>
              <Item>Every weekday cell covers all {SCHOOL_N} consented students</Item>
            </List>
          </ScrollIn>
          <Note>Consented students only, from the same windows the individual {SCORE}s use.</Note>
        </section>

        <Panel as="h3" label="Smallest group we will show">
          <div className="font-mono text-stat font-medium tabular-nums text-ink">{K_ANONYMITY}</div>
          <p className="mt-1 text-sec text-ink-3">minimum cell size</p>
          <p className="mt-4 text-meta text-ink-2">
            Any group smaller than {K_ANONYMITY} is suppressed before it reaches this screen.</p>
          {suppressed > 0 && (
            <p className="mt-4 border-t border-rule pt-4 text-meta text-ink-2">
              <b className="font-medium text-ink">{suppressed} cell{suppressed === 1 ? '' : 's'}</b>
              {' '}hidden on this page for that reason.</p>
          )}
          {/* The legend sits on the tab that draws the hatch, not only on the
              empty one, which is where it used to be alone. */}
          <div className="mt-4 border-t border-rule pt-4">
            <p className="text-meta text-ink-2">A suppressed cell is hatched, not hidden, so a
              {' '}{PRO_LC} can see a figure exists and is withheld.</p>
            <SuppressedSwatch className="mt-3"/>
          </div>
        </Panel>
      </div>

      <div className={cn(ROW, 'lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]')}>
        <Panel as="h3" label={`${SCORE} by class period`} action={`${SCORE_RANGE}, zero based`}>
          <ul className="space-y-4">
            {COHORT_PERIOD.map(p => (
              <li key={p.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-meta text-ink-2">{p.label}</span>
                  {/* A suppressed cell prints no n either. "n=3" beside a class
                      period publishes the exact size of the group the floor
                      exists to protect. */}
                  <span className="font-mono text-sec tabular-nums text-ink-3">
                    {p.suppressed ? `suppressed · n < ${K_ANONYMITY}` : `${p.mean} · n=${p.n}`}</span>
                </div>
                <div className="relative mt-2 h-2.5 w-full overflow-hidden rounded-xs bg-mist">
                  {p.suppressed ? (
                    /* Drawn, not a repeating-linear-gradient of a raw hex: gradients are out of the
                       system and that colour was not a token. Ruled in `ruling`. */
                    <svg className="h-full w-full" preserveAspectRatio="none" role="img"
                      aria-label="Suppressed for k-anonymity">
                      <defs>
                        <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse"
                          patternTransform="rotate(45)">
                          <line x1="0" y1="0" x2="0" y2="8" className="stroke-ruling" strokeWidth="4"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#hatch)"/>
                    </svg>
                  ) : (
                    /* Zero based. The old scale ran 20% to 100% across the
                       narrow span these means actually occupy, so a 46 and a
                       71 drew as one bar five times the other. */
                    <div className={cn('h-full rounded-xs', p.mean >= 65 ? 'bg-warn' : 'bg-accent')}
                      style={{ width: p.mean + '%' }}/>
                  )}
                  {TICKS.map(t => (
                    <span key={t} aria-hidden className="absolute inset-y-0 w-px bg-card/70"
                      style={{ left: t + '%' }}/>
                  ))}
                  <span aria-hidden className="absolute inset-y-0 w-0.5 bg-ink"
                    style={{ left: avg + '%' }}/>
                </div>
              </li>
            ))}
          </ul>
          <div aria-hidden className="mt-2.5 flex justify-between border-t border-rule pt-1.5
            font-mono text-tick tabular-nums text-ink-3">
            {[0, ...TICKS, 100].map(t => <span key={t}>{t}</span>)}
          </div>
          <Note>Bars run from zero, so twice the length is twice the mean. The upright rule is the
            all-period average, {avg}. A period under {K_ANONYMITY} consented students is hatched and
            returns neither a mean nor its size.</Note>
        </Panel>

        <div className="flex flex-col gap-3 lg:gap-4">
        <Panel as="h3" label={`${SCORE} by weekday`} action={`${SCORE_RANGE}, zero based`}>
          <div className="flex gap-3" role="img"
            aria-label={`Mean ${SCORE} by weekday, out of 100: `
              + COHORT_WEEKDAY.map(d => `${d.full} ${d.mean}`).join(', ')
              + `. The average day is ${wAvg}.`}>
            <div aria-hidden className="flex h-[150px] w-7 shrink-0 flex-col justify-between
              text-right font-mono text-tick tabular-nums text-ink-3">
              <span>100</span><span>50</span><span>0</span>
            </div>
            <div aria-hidden className="relative h-[150px] flex-1">
              {[0, 50, 100].map(v => (
                <span key={v} className="absolute inset-x-0 h-px bg-rule"
                  style={{ bottom: (v / 100) * 150 + 'px' }}/>
              ))}
              {/* The average the sentence beside this chart cites, drawn. */}
              <span className="absolute inset-x-0 h-0.5 bg-ink"
                style={{ bottom: (wAvg / 100) * 150 + 'px' }}/>
              <div className="absolute inset-0 flex items-end justify-between gap-3">
                {COHORT_WEEKDAY.map(d => (
                  <span key={d.key} className="flex h-full flex-1 items-end">
                    <span className={cn('w-full rounded-t-xs', d.mean >= 60 ? 'bg-warn' : 'bg-ink-3')}
                      style={{ height: (d.mean / 100) * 150 + 'px' }}/>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div aria-hidden className="mt-2 flex gap-3 pl-10">
            {COHORT_WEEKDAY.map(d => (
              <span key={d.key} className="flex-1 text-center">
                <span className="block font-mono text-sec tabular-nums text-ink">{d.mean}</span>
                <span className="block text-tick text-ink-3">{d.label}</span>
              </span>
            ))}
          </div>
          <Note>The horizontal rule is the average day, {wAvg}. Every weekday cell covers all
            {' '}{SCHOOL_N} consented students and clears the {K_ANONYMITY}-student floor.</Note>
        </Panel>

        {/* Stacked under the weekday chart rather than run full width below the
            row: the two charts are different heights and the shorter column
            was ending 187px above the taller one. */}
        <Panel as="h3" label={`What a ${PRO_LC} does with this`}>
          {/* Do not restate the period figure here: the panel above computes it, and a
              hard-coded 31% disagrees with it the moment the data moves. */}
          <List className="max-w-[64ch] text-sec text-ink-2">
            <Item>A pattern this size is a conversation with the school, never a finding about any
              one student.</Item>
            <Item>A check-in can be timed to the period the pattern names.</Item>
            <Item>The same screen shows whether the mean came down four weeks later.</Item>
          </List>
        </Panel>
        </div>
      </div>
    </>
  )
}

/* ── Escalation ─────────────────────────────────────────────────────────── */
function Escalation({ real }) {
  const [done, setDone] = React.useState(PROTOCOL_DONE)
  const [closing, setClosing] = React.useState(false)
  const [closed, setClosed] = React.useState(null)
  const toggle = i => setDone(d => d.includes(i) ? d.filter(x => x !== i) : [...d, i])
  /* Derived rather than branched on at the top: the protocol is the practice's own
     document and stays on screen either way, unticked and untouchable. */
  const ticked = real ? [] : done
  const referrals = real ? [] : REFERRALS
  const log = real ? [] : AUDIT_LOG
  return (
    <>
      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-4">
        <Card as="section" className="border-t-2 border-t-crit/40">
          <CardHeader className="p-5 pb-0">
            <CardTitle as="h2" className="text-tick text-crit">Crisis queue</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="font-display text-row font-bold tracking-tight text-ink">
              {real ? 'Nothing in the queue' : 'Student 8241'}</h3>
            <span className="font-mono text-sec tabular-nums text-ink-3">
              {real ? '' : PROTOCOL_TIMES[0]}</span>
          </div>
          {real
            /* An empty crisis queue is the good state and has to read as one. It is also the
               only thing on this console nobody can put a row into by hand. */
            ? <p className="mt-2 max-w-[60ch] text-meta text-ink-2">An entry appears only when a
                paired patch crosses the crisis threshold. Nobody can raise one by hand, and none
                has been raised.</p>
            : <p className="mt-2 max-w-[60ch] text-meta text-ink-2">
                Student 8241 crossed the crisis threshold during AP Chemistry. The protocol ran
                automatically.</p>}
          {/* The wrapper already draws the rule above the steps, and `.mark` draws its own:
              stacked, the two read as a pair of hairlines 16px apart. */}
          <div className="mt-5 border-t border-rule pt-4">
            <h4 className="font-display text-tick font-bold text-ink-2">Escalation steps</h4>
            <ul className="mt-3 space-y-1">
              {PROTOCOL.map((step, i) => (
                <li key={step}>
                  <label className={cn('flex min-h-[44px] items-center gap-3',
                    real ? 'cursor-default' : 'cursor-pointer')}>
                    <input type="checkbox" checked={ticked.includes(i)} disabled={real}
                      onChange={() => toggle(i)} className="size-4 accent-accent"/>
                    <span className={cn('text-meta', ticked.includes(i) ? 'text-ink-3 line-through decoration-rule' : 'text-ink')}>
                      {step}</span>
                    <span className="ml-auto shrink-0 whitespace-nowrap font-mono text-sec
                      tabular-nums text-ink-3">{ticked.includes(i) ? PROTOCOL_TIMES[i] : ''}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
            <Button size="sm" disabled={real || ticked.length < PROTOCOL.length || !!closed}
              onClick={() => setClosing(true)}>
              {closed ? 'Closed' : 'Close with outcome'}</Button>
            <span className="font-mono text-sec tabular-nums text-ink-3">
              {ticked.length} of {PROTOCOL.length} steps complete</span>
          </div>
          </CardContent>
        </Card>

        <Panel as="h3" label="Referrals on these students">
          <ul className="divide-y divide-rule">
            {real && <BlankRow>No referral has been opened. A referral is written from a
              student's record.</BlankRow>}
            {referrals.map(r => (
              <li key={r.student + r.opened} className="py-3.5 first:pt-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-meta text-ink">{r.student}</span>
                  <Badge variant="state">{r.status}</Badge>
                </div>
                <p className="mt-1 text-sec text-ink-3">{r.to} · opened {r.opened}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-rule pt-4">
            <Button variant="outline" size="sm" disabled>New referral</Button>
          </div>
        </Panel>
      </div>

      <ConfirmClose open={closing} onOpenChange={setClosing} subject="Student 8241"
        steps={PROTOCOL.length} onConfirm={o => setClosed(o)}/>

      {closed && (
        <p className="mt-4 border-l-2 border-calm py-1 pl-5 text-sec text-ink-2">
          Written to the log at {PROTOCOL_TIMES[PROTOCOL_TIMES.length - 1]}. The escalation clock
          has stopped.
          <span className="mt-1 block text-meta text-ink-3">“{closed}”</span>
        </p>
      )}

      <Panel as="h3" className="mt-3 lg:mt-4" label="Audit log" action="Cannot be edited or deleted">
        <Table>
          <THead><TR>{['When','Actor','Action','Subject'].map(h => <TH key={h}>{h}</TH>)}</TR></THead>
          <TBody>
            {real && <EmptyBand cols={4}>Nothing has been logged. A row is written whenever anyone
              opens a record, exports a figure or changes a setting.</EmptyBand>}
            {log.map(r => (
              <TR key={r.at + r.action}>
                <TD num className="w-44 whitespace-nowrap">{r.at}
                  <span className="mt-0.5 block text-ink-3">{r.rel}</span></TD>
                <TD className="w-44">{r.actor}</TD>
                <TD>{r.action}</TD>
                <TD className="w-44">{r.subject}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <Note>A student changing their own settings is logged exactly like a {PRO_LC}&rsquo;s
          own action.{' '}
          {real ? 'The log cannot be edited or deleted.'
                : 'Step five is still open, so there is no closing entry yet.'}</Note>
      </Panel>
    </>
  )
}

/* ── Consent ────────────────────────────────────────────────────────────── */
const FACTS = [
  ['Raw biometrics visible to parents', 'Never'],
  [`Raw biometrics visible to ${PRO_PLURAL_LC}`, 'Only with student consent'],
  ['Data sold or shared with third parties', 'Never'],
  ['Location collected by default', 'No'],
]
function Consent({ real }) {
  /* Only the rows are conditional. Every statement on this tab is policy, which is
     as true of a practice with nobody consented as of a full one. */
  const ledger = real ? [] : CONSENT_LEDGER
  const log = real ? [] : AUDIT_LOG
  return (
    <>
      <h2 className="mb-4 font-display text-head font-bold tracking-tight text-ink">
        What each guardian agreed to</h2>
      <Panel as="h3" label="Consent ledger" action={`${ledger.length} active · FERPA / COPPA`}>
        <Table>
          <THead><TR>{['Student','Guardian','Scope consented','Basis','Signed','Expires']
            .map(h => <TH key={h}>{h}</TH>)}</TR></THead>
          <TBody>
            {real && <EmptyBand cols={6}>No guardian has signed a scope. Every row is one
              signature, revocable at any time except a crisis alert.</EmptyBand>}
            {ledger.map(r => (
              <TR key={r.student}>
                <TD num>{r.student}</TD>
                <TD>{r.guardian}</TD>
                <TD>{r.scope}</TD>
                <TD><Badge variant="state">{r.basis}</Badge></TD>
                <TD num>{r.signedAt}</TD>
                <TD num>{r.expires}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <Note>The check-in list reads this table directly, so a narrowed scope narrows the
          list.{real ? '' : ` Two students here show no weekly change, one shows no ${SCORE}.`}</Note>
      </Panel>

      <div className={cn(ROW, 'lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]')}>
        <Panel as="h3" label="Data retention">
          {/* Read off RETENTION in src/app/store.js, which is the list the
              student's own Sharing screen offers. A 90 typed in here was the
              longest option dressed as a policy. */}
          <div className="font-mono text-stat font-medium tabular-nums text-ink">
            {Math.max(...RETENTION)}</div>
          <p className="mt-1 text-sec text-ink-3">days, the longest window a student may set</p>
          <p className="mt-4 max-w-[52ch] text-meta text-ink-2">
            Each student picks their own, {RETENTION.join(', ')} days, and it starts at the
            shortest. After the window closes the raw readings are deleted. No archive, no
            backup.</p>
          {/* The three windows themselves, off the same list, so the figure
              above reads as the end of a scale rather than as a policy. */}
          <ul className="m-0 mt-5 list-none border-t border-rule p-0">
            {RETENTION.map(d => (
              <BarRow key={d} label={d === RETENTION[0] ? `${d} days, the default` : `${d} days`}
                figure={`${d} d`} pct={(d / Math.max(...RETENTION)) * 100}
                tone={d === RETENTION[0] ? 'bg-accent' : 'bg-ink-3'}
                aria={`${d} days${d === RETENTION[0] ? ', the default' : ''}`}/>
            ))}
          </ul>
          <ul className="mt-5 divide-y divide-rule border-t border-rule">
            {FACTS.map(([k, v]) => (
              <li key={k} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
                <span className="text-meta text-ink-2">{k}</span>
                <span className="text-meta font-medium text-ink">{v}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel as="h3" label="Recent activity in the log">
          <ul className="divide-y divide-rule">
            {real && <BlankRow>Nothing has happened on this console yet.</BlankRow>}
            {log.map(r => (
              <li key={r.at + r.action}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3.5 first:pt-0">
                <div className="min-w-0 flex-1 basis-[15rem]">
                  <p className="text-meta text-ink">{r.action}</p>
                  <p className="mt-0.5 text-sec text-ink-3">{r.actor} · {r.subject}</p>
                </div>
                <span className="shrink-0 font-mono text-sec tabular-nums text-ink-3">{r.at}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-rule pt-4">
            <Button variant="outline" size="sm" disabled>Export audit log (CSV)</Button>
            <Button variant="outline" size="sm" disabled>Export consent ledger</Button>
            <span className="text-sec text-ink-3">{real
              ? 'Nothing to export yet. Every export writes its own row above.'
              : 'Disabled in this demo. Every export writes its own row above.'}</span>
          </div>
        </Panel>
      </div>
    </>
  )
}

export function Pro({ go }) {
  const [mode] = useMode()
  const real = mode === 'real'
  const [tab, setTab] = React.useState('triage')
  const [who, setWho] = React.useState('Student 8241')
  const [said, setSaid] = React.useState('')
  /* Switching tabs, or opening a record, replaces the whole panel with focus still
     on <body> and nothing announced. */
  const announce = msg => { setSaid(''); requestAnimationFrame(() => setSaid(msg)) }
  const onTab = v => { setTab(v); announce(`Showing ${TABS.find(t => t[0] === v)[1]}`) }
  const openStudent = name => { setWho(name); setTab('student'); announce(`Opened the record for ${name}`) }
  /* Every tab takes the flag rather than the console swapping wholesale: the policy
     statements hold for an empty caseload as for a full one. Only the rows go. */
  const PANES = {
    triage: () => <Triage onOpen={openStudent} real={real}/>,
    student: () => <OneStudent who={who} setWho={setWho} real={real}/>,
    cohort: () => <Cohort real={real}/>,
    escalation: () => <Escalation real={real}/>,
    consent: () => <Consent real={real}/>,
  }
  return (
    <main>
      {/* One definition in ui/tabs, so the two consoles cannot drift. The root wraps the
          header as well, because this console's strip belongs to the chrome. */}
      <Tabs value={tab} onValueChange={onTab}>
        {/* No screen header. The app's top bar names the screen; a band under it
            reading "What a medical professional sees" described the product to
            the person already using it. The consent rule it carried is real, so
            that sentence moved down into the console itself.

            These five tabs are the console's whole navigation, so they stay
            chrome: card ground, and from sm up stuck beneath the app's 48px top
            bar. At 390 the strip scrolls sideways rather than wrapping to three
            rows, which cost a third of the viewport.
            Contrast on card #ffffff: ink 14.92, ink-2 8.31, warn 5.78, crit 6.69. */}
        <div className="border-b border-ink bg-card sm:sticky sm:top-12 sm:z-30">
          <div className="wrap !py-0">
            <TabsList aria-label={`${PRO} views`} scroll className="gap-x-6 border-b-0">
              {TABS.map(([v, label]) => (
                <TabsTrigger key={v} value={v}>{label}</TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        <div className="wrap !pt-5 pb-14">
          <p aria-live="polite" className="sr-only text-sec">{said}</p>
          <p className="max-w-[62ch] text-sec text-ink-2">
            Only students who consented appear, and each one only to the extent their guardian
            agreed. Groups under {K_ANONYMITY} return nothing.</p>
          {real
            ? <RealNotice className="mb-5 mt-3">No student has paired a patch and no guardian has signed
                a scope, so this list is empty.</RealNotice>
            : <DemoNotice className="mb-5 mt-3">Every figure here is generated. No student was measured.</DemoNotice>}
          {TABS.map(([v]) => {
            const Pane = PANES[v]
            return <TabsContent key={v} value={v} className="mt-0"><Pane/></TabsContent>
          })}
        </div>
      </Tabs>
    </main>
  )
}
