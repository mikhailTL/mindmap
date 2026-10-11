import React from 'react'
import { Panel } from '../s21/display'
import { Table, THead, TBody, TR, TH, TD } from '../s21/table'
import { RuleDraw, ScrollIn } from '../s21/motion'
import { Button } from '../ui/button'
import { ConfirmClose } from '../ui/confirm'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { DemoNotice, RealNotice } from '../ui/notice'
import { useMode } from '../lib/mode'
import { Chevron } from '../ui/marks'
/* The two hover cards that defined "Mind Score" and "weekly change" on the
   words themselves are gone with the paragraph that carried them. A tooltip is
   a third place for a definition to live and go stale, and the one sentence
   under the title now says what the order is in words a counselor already
   has. */
import {
  K_ANONYMITY, TIER_LABEL, triage, scoreOnly, alertsOnly, roster,
  SCHOOL_N, COHORT_PERIOD, COHORT_WEEKDAY,
  CONSENT_LEDGER, AUDIT_LOG, PROTOCOL, PROTOCOL_TIMES, PROTOCOL_DONE, REFERRALS,
  driversFor, INTERVENTIONS, efficacyLabel, profile45,
} from '../lib/caseload'
import { CASELOAD_TITLE, CASELOAD_DEF, SCORE } from '../lib/terms'
import { cn } from '../lib/utils'

const TABS = [
  ['triage','Who to check in with'], ['student','One student'], ['cohort','Year groups'],
  ['escalation','Escalation'], ['consent','Consent'],
]
const Sub = ({ children, className }) =>
  <p className={cn('max-w-[68ch] text-sec text-ink-2', className)}>{children}</p>
const Note = ({ children }) => <p className="mt-5 max-w-[70ch] border-t border-rule pt-4 text-meta text-ink-3">{children}</p>

/* ── Empty, drawn ───────────────────────────────────────────────────────── */
/* With no student paired and no guardian consented, this console has no rows —
 * which is its true state for every visitor today, and it is not a fault. So
 * an empty region here keeps the form and loses only the entries: the rules
 * stay, the columns keep their names, the blank is drawn as a ruled lane and
 * annotated. A bare sentence in the middle of a blank panel reads as a page
 * that failed to load, which is the one thing this console cannot afford to
 * look like.
 *
 * Dashed rather than solid: a drawn rule on this site means a real division,
 * so a lane that is waiting for content has to be visibly a different mark. */
const BlankLane = ({ className }) =>
  <span aria-hidden className={cn('border-t border-dashed border-ruling', className)}/>

const BlankRow = ({ children }) => (
  <li className="flex items-center gap-4 py-3.5">
    <BlankLane className="w-10 shrink-0"/>
    <span className="text-sec text-ink-3">{children}</span>
  </li>
)

/* A table keeps its header row when it has no data. The columns are the
   schema, and the schema is real whether or not anything has been written to
   it — a counselor evaluating this product needs to see what would be logged
   about them before there is anything to log. */
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

/* ── Who to check in with ────────────────────────────────────────────────
 *
 * One list, and it is the whole tab.
 *
 * What stood here: an h2, a paragraph carrying two hover-card definitions, a
 * count, a four-segment tier bar, a four-item legend under the bar, two
 * bordered callout panels naming the biggest mover and the highest score,
 * eight bordered student cards each holding a rank, a name, a grade, a band, a
 * figure, a scale caption, a signed figure, a two-sided divergence bar with
 * its own aria label, a sentence and an "Open record" link, a legend for that
 * bar, and two more bordered cards each wrapping a list of students whose
 * consent scope withholds something. Twenty-odd boxes.
 *
 * A counselor opening this on a Monday morning wants to know who to talk to
 * first. Everything above the list was answering a question that had not been
 * asked yet, and the list itself was eight cards deep, so the eye had to climb
 * out of one box and into the next to compare two students.
 *
 * So: the title, one sentence saying what the order is, and the list. A row is
 * a name, the band, the Mind Score and the move — and the move is on the
 * right, because the move IS the order, and an order you cannot read off a
 * single right-hand column is an order you have to be told about in a
 * footnote. The two-sided bar went with the callouts: a signed figure in warn
 * or calm says which way and how far already, and the bar said it again in
 * 13rem of width.
 *
 * This is the one screen in the app allowed to be dense. Dense is not boxed.
 */

/* The column the figures are in, named once. Two labels, on the rule the list
   hangs from, which is what a ruled sheet does instead of a caption per
   column. */
const ListHead = () => (
  <div aria-hidden className="flex items-center gap-4 border-b border-ink pb-2">
    <span className="w-5 shrink-0"/>
    <span className="tick min-w-0 flex-1">student</span>
    <span className="tick shrink-0">change this week</span>
    <span className="w-4 shrink-0"/>
  </div>
)

/* What the order is, what it is not, and what is not in the list at any depth.
   It is one block of small print under the list rather than four paragraphs
   and two hover cards above it, and it is the same block on a full list and an
   empty one, so it is written once. */
const LIST_NOTE = (
  <p className="mt-5 max-w-[74ch] text-meta text-ink-3">
    Change this week is the move in a student&rsquo;s seven-day average from one week to the next,
    and it is what puts this list in order: a student up 15 points from 55 comes before a student
    level at 70. That is what makes a check-in land before a problem grows. A low, steady {SCORE} is
    not a student in trouble. A student whose guardian consented to crisis alerts only is never on
    this list at all, and no raw reading, Notes entry or location is on it at any depth. Counselor
    notes live in a student&rsquo;s own record, and saving one writes a row to the audit log.</p>
)

function Row({ s, n, onOpen }) {
  const dir = s.velocity > 0 ? 'worse' : s.velocity < 0 ? 'better' : 'flat'
  const move = `${s.velocity > 0 ? '+' : s.velocity < 0 ? '−' : ''}${Math.abs(s.velocity)}`
  return (
    <li className="border-b border-rule">
      {/* Was a Card with `interactive`, which is the right affordance for a
          card and the wrong object for a row. One label on the button, and the
          four marks inside it are hidden from the reader: read out
          separately they are a rank, a name, a punctuated fragment, a bare
          numeral and a glyph. */}
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
            Grade {s.grade} · {TIER_LABEL[s.tier]} · {s.current} out of 100</span>
        </span>
        <span aria-hidden className={cn('shrink-0 font-mono text-num font-medium leading-none tabular-nums',
          dir === 'worse' ? 'text-warn' : dir === 'better' ? 'text-calm' : 'text-ink-3')}>{move}</span>
        <Chevron aria-hidden className="size-4 shrink-0 text-ink-3"/>
      </button>
    </li>
  )
}

/* The two consent-limited groups, which were two bordered cards side by side,
   each with a heading, a description and a list inside it. They are one list
   under one rule: a counselor reading either half is asking the same question,
   and what each student's scope withholds is a line on their own row. */
function NarrowScopes({ onOpen }) {
  const scored = scoreOnly(), quiet = alertsOnly()
  return (
    <section className="mt-14">
      <h3 className="mark">Shared with a narrower scope</h3>
      <p className="mt-4 max-w-[66ch] text-sec text-ink-2">These students are not on the list above,
        and it is not because nothing moved. A guardian signed a scope that withholds the weekly
        change, or everything except a crisis alert.</p>
      <ul className="m-0 mt-4 list-none p-0">
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
    </section>
  )
}

/* The three conditions, in the order they happen. A school reads this tab
   first, and "why is it empty" is the question it asks — so the answer is the
   content of the empty list rather than a line under it. The drawn blank row
   that used to sit under them, labelling the four fields of a row that does
   not exist yet, is gone: the list head above the real list names the same
   columns, and a diagram of an empty row is a diagram of nothing. */
const CASELOAD_NEEDS = [
  ['A student pairs a patch',
   'Nothing reaches the school until the student pairs it, on their own phone. They can unpair it the same way.'],
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
      <h3 className="mark mt-10">How a student gets on this list</h3>
      <ol className="m-0 list-none p-0">
        {CASELOAD_NEEDS.map(([what, why]) => (
          <li key={what} className="border-b border-rule py-4">
            <span className="block text-body text-ink">{what}</span>
            <span className="mt-1 block max-w-[66ch] text-sec text-ink-2">{why}</span>
          </li>
        ))}
      </ol>
      {LIST_NOTE}
    </>
  )
}

function Triage({ onOpen, real }) {
  if (real) return <EmptyTriage/>
  const moved = triage()
  return (
    <>
      <TriageHead consented={roster().length} listed={moved.length}/>
      <div className="mt-8"><ListHead/></div>
      <ol className="m-0 list-none p-0">
        {moved.map((s, i) => <Row key={s.id} s={s} n={i + 1} onOpen={onOpen}/>)}
      </ol>
      {LIST_NOTE}
      <NarrowScopes onOpen={onOpen}/>
    </>
  )
}

/* ── One student ────────────────────────────────────────────────────────── */
/* What a record holds, and the consent scope that unlocks each part of it. The
   list is the empty tab's whole content because a record's shape is the thing
   a school has to agree to before any of it exists. */
const RECORD_FIELDS = [
  [`${SCORE} today, out of 100`, `With ${SCORE} consent.`],
  ['Weekly change, and a place on the list', 'With trend consent.'],
  ['What is driving the rise', 'With trend consent. Shares per signal, never a raw reading.'],
  ['The last 45 days', 'With trend consent.'],
  ['Counselor notes', 'Any scope. Saving writes a row to the audit log.'],
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
        {/* The control stays, disabled and empty. Removing it would hide how a
            counselor moves between students, which is a real part of the
            console whether or not there is anyone to move between. */}
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
            it. Crisis alerts reach the counselor in every case, and no guardian can switch them
            off.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-5">
          <ul className="m-0 list-none border-t border-rule p-0">
            {/* Ruled as a two-column table rather than a wrapping row: the
                field and the consent that unlocks it are a pair, and ragged
                starts made them read as one sentence per line instead. */}
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
  /* Hooks first, then the branch: the two states are different screens, and
     returning before this line would change the hook order on a mode flip. */
  const [note, setNote] = React.useState('')
  if (real) return <EmptyRecord/>
  const all = roster()
  const s = all.find(x => x.name === who) || all[0]
  /* Both of these used to be module constants, so every student on the board
     showed Student 8241's drivers and Student 8241's 45-day line. */
  const drivers = driversFor(s)
  const series = profile45(s)
  const lo = Math.min(...series.map(p => p.v)), hi = Math.max(...series.map(p => p.v))
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
          <select id="pick" value={s.name} onChange={e => setWho(e.target.value)}
            className="mt-1.5 min-h-[48px] rounded-field border-0 border-b-2 border-ink bg-transparent
              px-1 font-body text-meta text-ink focus-visible:outline-none">
            {all.map(x => <option key={x.id} value={x.name}>
              {x.name} · G{x.grade}{x.showScore ? ` · ${x.current}` : ' · not shared'}</option>)}
          </select>
        </div>
      </div>

      {/* Both withheld-consent states were tinted bands with a left rule. They
          are the record for this student, so they are the same card the record
          would have been, with the ruling edge marking what is withheld. */}
      {!s.showScore && (
        <Card as="section" className="mt-10 border-l-[3px] border-l-ruling">
          <CardHeader className="p-6 pb-0">
            {/* "Nothing to show, by consent" read as an error state. It is a
                consent scope, and the card says which one. */}
            <CardTitle as="h3" className="text-row">No readings shared for this student</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-3">
            <ul className="max-w-[46ch] space-y-1.5 text-sec text-ink-2">
              <li>Consent scope: <b className="font-medium text-ink">crisis alerts only</b></li>
              <li>You are paged if their readings cross the crisis threshold</li>
            </ul>
          </CardContent>
        </Card>
      )}

      {s.showScore && !s.showTrend && (
        <Card as="section" className="mt-10 border-l-[3px] border-l-ruling">
          <CardHeader className="p-6 pb-0">
            <CardTitle as="h3" className="text-row">{SCORE} today: {s.current} out of 100</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-3">
            <ul className="max-w-[46ch] space-y-1.5 text-sec text-ink-2">
              <li>Consent scope: <b className="font-medium text-ink">{SCORE} and crisis alerts</b></li>
              <li>Weekly change, driver breakdown and the 45-day line are withheld</li>
            </ul>
          </CardContent>
        </Card>
      )}

      {s.showTrend && <>
      {/* Five bordered panels stood here: a figure panel, a driver panel with
          four tracks in it, an intervention panel, the 45-day line and a note
          field, laid out as a three-up grid and then a two-up grid. Five boxes
          for one student, and the one figure a counselor opens the record for
          was in the first of the five.

          It is the record's own reading now, at the step the dashboards give a
          figure, and everything under it is rows: the drivers are a percentage
          per row, the interventions are a line each, the line chart is the one
          chart, and the note field is a field. The driver bars went for the
          same reason the student screen's did — the figure beside each row
          states the same share against the same 100. */}
      <p className="note mt-10">Change this week, against the week before</p>
      <p className={cn('m-0 mt-1 font-mono text-dial font-medium leading-none tabular-nums',
        s.velocity > 0 ? 'text-warn' : s.velocity < 0 ? 'text-calm' : 'text-ink')}>
        {s.velocity > 0 ? '+' : ''}{s.velocity}</p>
      <p className="mt-3 max-w-[58ch] text-sec text-ink-2">Moved from {s.weekAgo} to {s.current}.
        The change keeps landing in one lesson: AP Chemistry.</p>

      <h3 className="mark mt-12">What is driving the rise</h3>
      <ul className="m-0 list-none p-0">
        {drivers.map(d => (
          <li key={d.label}
            className="flex items-center justify-between gap-4 border-b border-rule py-3.5">
            <span className="text-body text-ink">{d.label}</span>
            <span className="shrink-0 font-mono text-num font-medium leading-none tabular-nums text-ink">
              {Math.round(d.share * 100)}%</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 max-w-[66ch] text-meta text-ink-3">Each one&rsquo;s share of this
        week&rsquo;s rise. Never a raw reading.</p>

      <h3 className="mark mt-12">The last 45 days</h3>
      <svg viewBox="0 0 720 214" className="mt-4 block w-full overflow-visible" role="img"
        aria-label={`Daily mean ${SCORE} over 45 days, rising through the last two weeks.`}>
        {[40, 60, 80].map(v => {
          const y = 180 - ((v - lo) / (hi - lo)) * 160
          return <g key={v}>
            <line x1="40" x2="710" y1={y} y2={y} className="stroke-rule" strokeWidth="1"/>
            <text x="30" y={y + 5} textAnchor="end" className="fill-ink-3 text-[16px]">{v}</text>
          </g>
        })}
        <path fill="none" strokeWidth="2" strokeLinejoin="round" className="stroke-ink-3"
          vectorEffect="non-scaling-stroke"
          d={series.map((q, i) => (i ? 'L' : 'M') + (40 + (i / 44) * 670).toFixed(1) + ' ' +
            (180 - ((q.v - lo) / (hi - lo)) * 160).toFixed(1)).join(' ')}/>
        <path fill="none" strokeWidth="2.5" strokeLinejoin="round" className="stroke-warn"
          vectorEffect="non-scaling-stroke"
          d={series.slice(31).map((q, i) => (i ? 'L' : 'M') + (40 + ((i + 31) / 44) * 670).toFixed(1) + ' ' +
            (180 - ((q.v - lo) / (hi - lo)) * 160).toFixed(1)).join(' ')}/>
        <text x="40" y="209" className="fill-ink-3 text-[16px]">45 days ago</text>
        <text x="710" y="209" textAnchor="end" className="fill-ink-3 text-[16px]">today</text>
      </svg>
      <p className="mt-3 text-meta text-ink-3">The coloured stretch is the last two weeks.</p>

      <h3 className="mark mt-12">Interventions tried</h3>
      <ul className="m-0 list-none p-0">
        {INTERVENTIONS.filter(i => i.sessions > 0).map(i => (
          <li key={i.name} className="border-b border-rule py-3.5 text-body text-ink-2">
            {efficacyLabel(i)}</li>
        ))}
      </ul>
      <p className="mt-3 text-meta text-ink-3">Measured from physiology.</p>

      <h3 className="mark mt-12">Counselor notes</h3>
      <label htmlFor="cnote" className="sr-only">Counselor note for {s.name}</label>
      <textarea id="cnote" rows={4} value={note} onChange={e => setNote(e.target.value)}
        placeholder="Add a note…"
        className="mt-4 w-full resize-none rounded-field border-0 border-b-2 border-rule bg-mist/40
          p-3.5 text-meta text-ink placeholder:text-ink-3 focus-visible:border-ink
          focus-visible:outline-none"/>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <span className="text-sec text-ink-3">Saving writes a row to the log</span>
        <Button size="sm" disabled={!note.trim()}>Save note</Button>
      </div>
      </>}
    </>
  )
}

/* ── Year groups ────────────────────────────────────────────────────────── */
/* The hatch that marks a suppressed cell, drawn once as a legend. Its own
   pattern id: the bars below each define `hatch` inside their own svg, and a
   second element with the same id in one document is a real collision. */
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

/* Both halves of this tab aggregate consented students, so with none consented
   there is nothing to aggregate — but the rule that governs the aggregation is
   policy, and it is the half a school weighs before it signs anything. */
const COHORT_REPORTS = [
  [`${SCORE} by class period`, 'A mean per period across the building. Fewer than five consented students returns nothing.'],
  [`${SCORE} by weekday`, 'The same figure per weekday, school-wide.'],
]

function EmptyCohort() {
  return (
    <>
      <h2 className="font-display text-head font-bold tracking-tight text-ink">
        Patterns across the whole school</h2>
      <Sub className="mt-2">Nobody has consented, so there is nothing to aggregate. Nobody on this
        tab is ever identifiable.</Sub>

      <div className="mt-10 grid gap-x-12 gap-y-10 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h3 className="mark">What this tab shows</h3>
          <RuleDraw className="mt-2.5"/>
          <ul className="m-0 mt-5 list-none p-0">
            {/* The dashed lane is this row's rule as well as its blank: a solid
                border under it put two hairlines 12px apart. */}
            {COHORT_REPORTS.map(([what, how]) => (
              <li key={what} className="py-4 first:pt-0">
                <h4 className="font-display text-row font-bold tracking-tight text-ink">{what}</h4>
                <p className="mt-1.5 max-w-[58ch] text-sec text-ink-2">{how}</p>
                <BlankLane className="mt-3.5 block w-full"/>
              </li>
            ))}
          </ul>
          <Note>Consented students only, from the same windows the individual {SCORE}s use.</Note>
        </section>

        <Panel as="h3" label="Smallest group we will show">
          <div className="font-mono text-stat font-medium tabular-nums text-ink">{K_ANONYMITY}</div>
          <p className="mt-1 text-sec text-ink-3">minimum cell size</p>
          <p className="mt-4 text-meta text-ink-2">
            Any group smaller than {K_ANONYMITY} is suppressed before it reaches this screen.</p>
          <div className="mt-5 border-t border-rule pt-4">
            <p className="text-meta text-ink-2">A suppressed cell is hatched, not hidden, so a
              counselor can see a figure exists and is withheld.</p>
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
  const lo = Math.min(...visible.map(p => p.mean)), hi = Math.max(...visible.map(p => p.mean))
  const avg = Math.round(visible.reduce((a, b) => a + b.mean, 0) / visible.length)
  const top = [...visible].sort((a, b) => b.mean - a.mean)[0]
  const hardest = [...COHORT_WEEKDAY].sort((a, b) => b.mean - a.mean)[0]
  const wAvg = Math.round(COHORT_WEEKDAY.reduce((a, b) => a + b.mean, 0) / COHORT_WEEKDAY.length)
  const suppressed = COHORT_PERIOD.filter(p => p.suppressed).length
  return (
    <>
      <h2 className="font-display text-head font-bold tracking-tight text-ink">
        Patterns across the whole school</h2>
      {/* A reviewer read "8 students" on the check-in list and "18 consented
          students" here and concluded one of them was invented. Both are true
          and neither said which population it meant. */}
      <Sub className="mt-2">All {SCHOOL_N} consented students in the building, not the eight on your
        own list. Nobody here is identifiable.</Sub>
      <div className="mt-10 grid gap-x-12 gap-y-10 lg:grid-cols-3">
        <section className="lg:col-span-2">
          {/* "School-wide pattern" repeated the h2 directly above it. The two
              findings under it are what the section actually is. */}
          <h3 className="mark">The two clearest patterns</h3>
          <RuleDraw className="mt-2.5"/>
          <ScrollIn className="mt-6">
            <h4 className="font-display text-row font-bold tracking-tight text-ink">
              {top.label} shows a school-wide stress spike.</h4>
            <ul className="mt-3 max-w-[58ch] space-y-1.5 text-sec text-ink-2">
              <li>Mean <b className="font-medium text-ink">{top.mean}</b> against a school average
                of {avg}, <b className="font-medium text-warn">
                {Math.round(((top.mean - avg) / avg) * 100)}% higher</b></li>
              <li>Across {top.n} consented students in that period</li>
              <li>Holds across every year group taking it</li>
            </ul>
          </ScrollIn>
          <ScrollIn delay={0.08} className="mt-6 border-t border-rule pt-6">
            <h4 className="font-display text-row font-bold tracking-tight text-ink">
              {hardest.full} is the hardest day of the week, school-wide.</h4>
            <ul className="mt-3 max-w-[58ch] space-y-1.5 text-sec text-ink-2">
              <li>Mean <b className="font-medium text-ink">{hardest.mean}</b> against {wAvg} on an
                average day</li>
              <li>Exam weeks in junior year run <b className="font-medium text-warn">2.4×</b> the
                non-exam baseline</li>
            </ul>
          </ScrollIn>
          <Note>Consented students only, from the same windows the individual {SCORE}s use.</Note>
        </section>

        {/* "Privacy floor" named a policy in a term nobody outside the team
            uses. The rule itself is unchanged. */}
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
        </Panel>
      </div>

      <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Panel label={`${SCORE} by class period`}>
          <ul className="space-y-4">
            {COHORT_PERIOD.map(p => (
              <li key={p.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-meta text-ink-2">{p.label}</span>
                  <span className="font-mono text-sec tabular-nums text-ink-3">
                    {p.suppressed ? 'suppressed' : p.mean} · n={p.n}</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-xs bg-mist">
                  {p.suppressed ? (
                    /* Was a repeating-linear-gradient of a raw hex. Gradients
                       are out of the system and the colour was not a token, so
                       the hatch is drawn instead, ruled in `ruling`. */
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
                    <div className={cn('h-full rounded-xs', p.mean >= 65 ? 'bg-warn' : 'bg-accent')}
                      style={{ width: 20 + ((p.mean - lo) / (hi - lo || 1)) * 80 + '%' }}/>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel label={`${SCORE} by weekday`}>
          <div className="flex h-[170px] items-end justify-between gap-3">
            {COHORT_WEEKDAY.map(d => (
              <div key={d.key} className="flex flex-1 flex-col items-center justify-end gap-2">
                <span className="font-mono text-sec tabular-nums text-ink-3">{d.mean}</span>
                <div className={cn('w-full rounded-t-xs', d.mean >= 60 ? 'bg-warn' : 'bg-ink-3')}
                  style={{ height: (d.mean / 100) * 120 + 'px' }}/>
                <span className="text-tick text-ink-3">{d.label}</span>
              </div>
            ))}
          </div>
          <Note>Every weekday cell clears the {K_ANONYMITY}-student floor.</Note>
        </Panel>
      </div>

      <Panel className="mt-14" label="What a school does with this">
        {/* The first bullet restated the period figure from the top of the tab
            and hard-coded 31% while the panel above computes it, so the two
            would disagree the moment the data moved. */}
        <ul className="max-w-[64ch] space-y-2 text-sec text-ink-2">
          <li>Moving one lab section is a single timetable change.</li>
          <li>The same screen shows whether the mean came down four weeks later.</li>
        </ul>
      </Panel>
    </>
  )
}

/* ── Escalation ─────────────────────────────────────────────────────────── */
function Escalation({ real }) {
  const [done, setDone] = React.useState(PROTOCOL_DONE)
  const [closing, setClosing] = React.useState(false)
  const [closed, setClosed] = React.useState(null)
  const toggle = i => setDone(d => d.includes(i) ? d.filter(x => x !== i) : [...d, i])
  /* Derived rather than branched on at the top: the protocol is the school's
     own document and stays on the screen either way — with no alert to run it
     against, every step is simply unticked and untouchable. */
  const ticked = real ? [] : done
  const referrals = real ? [] : REFERRALS
  const log = real ? [] : AUDIT_LOG
  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        {/* The queue sat in a bare section while the referral list beside it was
            a Panel, so the two halves of one row were different objects. Both
            are cards now; the crit rule on the top edge is what still says
            which one is the alarm. */}
        <Card as="section" className="border-t-2 border-t-crit/40">
          <CardHeader className="p-5 pb-0">
            <CardTitle as="h2" className="text-tick text-crit">Crisis queue</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="font-display text-row font-bold tracking-tight text-ink">
              {real ? 'Nothing in the queue' : 'Student 8241'}</h3>
            <span className="font-mono text-sec tabular-nums text-ink-3">{real ? '' : '2:14 PM'}</span>
          </div>
          {real
            /* An empty crisis queue is the good state, and it has to read as
               one. It is also the only thing on this console nobody can put a
               row into by hand, which is worth saying while it is empty. */
            ? <p className="mt-2 max-w-[60ch] text-meta text-ink-2">An entry appears only when a
                paired patch crosses the crisis threshold. Nobody can raise one by hand, and none
                has been raised.</p>
            : <p className="mt-2 max-w-[60ch] text-meta text-ink-2">
                Student 8241 crossed the crisis threshold during AP Chemistry. The protocol ran
                automatically.</p>}
          {/* The wrapper already draws the rule that separates the steps from
              the alert above; `.mark` draws its own, so the two stacked into a
              pair of hairlines 16px apart that read as a rendering fault. */}
          <div className="mt-5 border-t border-rule pt-4">
            {/* "Protocol" named the document, not the five checkboxes under
                it. */}
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

        {/* Was "Referrals already open", with a row the status badge marks
            Closed sitting under it. */}
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
        <p className="mt-10 border-l-2 border-calm py-1 pl-5 text-sec text-ink-2">
          Written to the log at 2:41 PM. The escalation clock has stopped.
          <span className="mt-1 block text-meta text-ink-3">“{closed}”</span>
        </p>
      )}

      <Panel as="h3" className="mt-14" label="Audit log" action="Cannot be edited or deleted">
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
        <Note>A student changing their own settings is logged exactly like a staff action.{' '}
          {real ? 'The log cannot be edited or deleted.'
                : 'Step five is still open, so there is no closing entry yet.'}</Note>
      </Panel>
    </>
  )
}

/* ── Consent ────────────────────────────────────────────────────────────── */
const FACTS = [
  ['Raw biometrics visible to parents', 'Never'],
  ['Raw biometrics visible to counselors', 'Only with student consent'],
  ['Data sold or shared with third parties', 'Never'],
  ['Location collected by default', 'No'],
]
function Consent({ real }) {
  /* Only the rows are conditional. Every statement on this tab — the ledger's
     columns, the retention window, the four facts, the export behaviour — is
     policy, and policy is as true of a school with nobody enrolled as of a
     full one. It is also the tab a school reads before it enrolls anyone. */
  const ledger = real ? [] : CONSENT_LEDGER
  const log = real ? [] : AUDIT_LOG
  return (
    <>
      <h2 className="mb-7 font-display text-head font-bold tracking-tight text-ink">
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

      <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Panel as="h3" label="Data retention">
          <div className="font-mono text-stat font-medium tabular-nums text-ink">90</div>
          <p className="mt-1 text-sec text-ink-3">days, raw signals</p>
          <p className="mt-4 max-w-[52ch] text-meta text-ink-2">
            Set by each student. After the window closes the raw readings are deleted. No archive,
            no backup.</p>
          <ul className="mt-5 divide-y divide-rule border-t border-rule">
            {FACTS.map(([k, v]) => (
              <li key={k} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
                <span className="text-meta text-ink-2">{k}</span>
                <span className="text-meta font-medium text-ink">{v}</span>
              </li>
            ))}
          </ul>
        </Panel>

        {/* "The same log, most recent first" said what it was not. */}
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
  /* Switching tabs, or opening a record from the board, replaced the whole
     panel with focus still on <body> and nothing announced. A screen-reader
     user had no way to know the page had changed under them. */
  const announce = msg => { setSaid(''); requestAnimationFrame(() => setSaid(msg)) }
  const onTab = v => { setTab(v); announce(`Showing ${TABS.find(t => t[0] === v)[1]}`) }
  const openStudent = name => { setWho(name); setTab('student'); announce(`Opened the record for ${name}`) }
  /* Every tab takes the flag rather than the console swapping wholesale: the
     consent, retention, k-anonymity and audit statements are policy, and they
     are as true of an empty school as of a full one. Only the rows go. */
  const PANES = {
    triage: () => <Triage onOpen={openStudent} real={real}/>,
    student: () => <OneStudent who={who} setWho={setWho} real={real}/>,
    cohort: () => <Cohort real={real}/>,
    escalation: () => <Escalation real={real}/>,
    consent: () => <Consent real={real}/>,
  }
  return (
    <main>
      {/* The screen header, and the same construction as views/shell.jsx so
       * the four app screens open the same way. It was a mist band with a
       * kinetic grid behind it, which is the marketing hero: a tinted
       * full-bleed ground with a texture on it. Two pixels under a 48px white
       * title bar that reads as an application, it undid the title bar.
       *
       * Card ground, no texture, a hairline against the canvas, and 20px of
       * padding against the old 40. Measured on card #ffffff: ink 14.92,
       * ink-2 8.31, warn 5.78, crit 6.69; the weakest clears 4.5 : 1. The
       * closing hairline is ink-3 at 5.99, the app's own rule. */}
      <div className="border-b border-ink-3 bg-card">
        <div className="wrap !py-5 lg:!py-6">
          {/* Was "For school counselors and psychologists" — an audience, not a
              screen. The three audience views are named the same way now. */}
          <h1 className="font-display font-bold text-major leading-[1.05] tracking-tight text-ink">
            What a school counselor sees</h1>
          <p className="mt-2 max-w-[60ch] text-sec text-ink-2">
            Only students who consented appear, and each one only to the extent their guardian agreed.
            Groups under five return nothing.</p>
          {/* The hand-rolled tinted box around a capsule badge is gone; one
              ruled annotation carries the sentence, and which sentence depends
              on what the tabs below are actually showing. */}
          {real
            ? <RealNotice className="mt-3">No student has paired a patch and no guardian has signed
                a scope, so this list is empty.</RealNotice>
            : <DemoNotice className="mt-3">Every figure here is generated. No student was measured.</DemoNotice>}
        </div>
      </div>
      {/* Was py-9 sm:py-12; the tab body is a section, the middle step. */}
      <div className="wrap py-14">
      <p aria-live="polite" className="sr-only text-sec">{said}</p>
      {/* Was a second hand-classed copy of the tab strip in views/shell.jsx.
          One definition in ui/tabs now, so the two consoles cannot drift. */}
      <Tabs value={tab} onValueChange={onTab}>
        <TabsList aria-label="Counselor views">
          {TABS.map(([v, label]) => (
            <TabsTrigger key={v} value={v}>{label}</TabsTrigger>
          ))}
        </TabsList>
        {TABS.map(([v]) => {
          const Pane = PANES[v]
          return <TabsContent key={v} value={v}><Pane/></TabsContent>
        })}
      </Tabs>
      </div>
    </main>
  )
}
