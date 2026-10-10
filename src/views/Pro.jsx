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
import { HoverCard, HoverCardTrigger, HoverCardContent } from '../ui/hover-card'
/* ui/hover-card ships no Portal, and the only triggers on this page sit inside
   a <p>; an unportaled panel would put a <div> in a paragraph and split it. */
import { Portal as HoverCardPortal } from '@radix-ui/react-hover-card'
import {
  K_ANONYMITY, TIER_LABEL, TIER_ORDER, triage, scoreOnly, alertsOnly, roster,
  SCHOOL_N, COHORT_PERIOD, COHORT_WEEKDAY,
  CONSENT_LEDGER, AUDIT_LOG, PROTOCOL, PROTOCOL_TIMES, PROTOCOL_DONE, REFERRALS,
  driversFor, INTERVENTIONS, efficacyLabel, profile45,
} from '../lib/caseload'
import { CASELOAD_TITLE, CASELOAD_DEF, SCORE, SCORE_DEF, SCORE_RANGE } from '../lib/terms'
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

/* A counselor who does not know what a column means had to scroll past the
   list to the footnote to find out. The definition sits on the word now. */
const Term = ({ label, def }) => (
  <HoverCard openDelay={180}>
    <HoverCardTrigger asChild>
      <button type="button" className="underline decoration-dotted decoration-ink-3
        underline-offset-4 hover:decoration-accent focus-visible:decoration-accent">{label}</button>
    </HoverCardTrigger>
    <HoverCardPortal><HoverCardContent>{def}</HoverCardContent></HoverCardPortal>
  </HoverCard>
)

/* ── Who to check in with ─────────────────────────────────────────────────────────────── */
/* One list, ordered by how far the Mind Score moved, which is what the page
   says the order is for. The previous version sorted by movement and then
   rendered four columns grouped by tier, so the biggest change came fourth. */
function Row({ s, n, onOpen }) {
  const dir = s.velocity > 0 ? 'worse' : s.velocity < 0 ? 'better' : 'flat'
  return (
    <li>
      {/* Was a bare <button> carrying its own hover and focus classes. A row
          that opens a record is the same affordance as any other clickable
          surface here, so it is the sourced Card's `interactive` state — which
          also gives it the leading accent rule the hand-rolled row never had. */}
      <Card as="button" interactive type="button" onClick={() => onOpen(s.name)}
        className="grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-x-4 gap-y-3 p-4
          sm:grid-cols-[2rem_minmax(0,15rem)_7rem_minmax(0,1fr)] sm:items-center">
        <span className="pt-1 font-mono text-meta tabular-nums text-ink-3 sm:pt-0">{n}</span>
        <span className="min-w-0">
          <span className="block truncate text-row text-ink">{s.name}</span>
          <span className="mt-0.5 block text-tick text-ink-3">
            Grade {s.grade} · {TIER_LABEL[s.tier]}</span>
        </span>
        <span className="flex items-baseline gap-2 sm:block">
          <span className={cn('font-mono text-num font-medium leading-none tabular-nums',
            s.tier === 'crisis' ? 'text-crit' : s.tier === 'high' ? 'text-warn' : 'text-ink')}>
            {s.current}</span>
          <span className="whitespace-nowrap text-tick text-ink-3 sm:mt-1 sm:block">out of 100</span>
        </span>
        <span className="col-span-full sm:col-span-1">
          <span className="flex items-center gap-3">
            <span className={cn('font-mono text-meta tabular-nums',
              dir === 'worse' ? 'text-warn' : dir === 'better' ? 'text-calm' : 'text-ink-3')}>
              {s.velocity > 0 ? '▲ +' : s.velocity < 0 ? '▼ −' : '0'}{Math.abs(s.velocity) || ''}
              <span className="ml-1 text-ink-3">a week</span></span>
            {/* Same colour and length for −6 and +4 made the improving student
                look worse than the worsening one. */}
            <span className="flex h-1.5 max-w-[13rem] flex-1 items-stretch" role="img"
              aria-label={`${dir === 'worse' ? 'Worse' : dir === 'better' ? 'Better' : 'Unchanged'} by ${Math.abs(s.velocity)} points this week`}>
              <span className="flex flex-1 justify-end overflow-hidden rounded-none bg-mist">
                {s.velocity < 0 && <span className="rounded-none bg-calm"
                  style={{ width: Math.min(100, Math.abs(s.velocity) * 6) + '%' }}/>}
              </span>
              <span className="w-px bg-ink-3"/>
              <span className="flex flex-1 overflow-hidden rounded-none bg-mist">
                {s.velocity > 0 && <span className="rounded-none bg-warn"
                  style={{ width: Math.min(100, s.velocity * 6) + '%' }}/>}
              </span>
            </span>
          </span>
          <span className="mt-1.5 block text-sec text-ink-2">
            {s.velocity > 0 ? `Up ${s.velocity} points in a week, from ${s.weekAgo}. `
              : s.velocity < 0 ? `Down ${Math.abs(s.velocity)} from ${s.weekAgo}. `
              : 'Level with last week. '}
            <span className="font-medium text-accent">Open record</span>
          </span>
        </span>
      </Card>
    </li>
  )
}

/* The consent-limited groups were a tinted band with a left rule; they sit
   beside the check-in list, so they are cards like everything else on it.
   The ruling-coloured leading edge is what still marks them as withheld. */
function Limited({ heading, note, children }) {
  return (
    <Card as="section" className="border-l-[3px] border-l-ruling">
      <CardHeader className="p-5 pb-0">
        <CardTitle as="h3" className="text-row">{heading}</CardTitle>
        <CardDescription className="max-w-[52ch]">{note}</CardDescription>
      </CardHeader>
      <CardContent className="p-5 pt-4">
        <ul className="divide-y divide-rule border-t border-rule">{children}</ul>
      </CardContent>
    </Card>
  )
}

/* The three conditions, in the order they happen. A school reads this tab
   first, and "why is it empty" is the question it asks — so the answer is the
   content of the empty board rather than a line under it. */
const CASELOAD_NEEDS = [
  ['A student pairs a patch',
   'Nothing reaches the school until the student pairs it, on their own phone. They can unpair it the same way.'],
  ['A guardian signs a consent scope',
   `The scope decides what this list may show: a ${SCORE}, a ${SCORE} with weekly change, or crisis alerts only.`],
  ['The scope is applied here, and never widened',
   `A student consented to alerts only carries no ${SCORE} and no place on this list.`],
]

/* The row the board draws, with its four fields named and none of them filled.
   Not a loading skeleton — the fields are labelled in words, because the point
   is to show a counselor what will appear here and what each part of it means,
   which a shimmering grey bar cannot do. */
function BlankBoardRow() {
  return (
    <figure className="m-0 mt-3">
      <div className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-x-4 gap-y-3 rounded-panel
        border border-dashed border-rule p-4 sm:grid-cols-[2rem_minmax(0,15rem)_7rem_minmax(0,1fr)]">
        <span className="text-tick text-ink-3">order</span>
        <span className="text-tick text-ink-3">student · grade · band</span>
        <span className="text-tick text-ink-3">{SCORE}</span>
        <span className="col-span-full sm:col-span-1">
          <span className="block text-tick text-ink-3">change this week</span>
          {/* The velocity track, drawn empty: centre line, worse to the right.
              Without it the legend under this figure legends nothing. */}
          <span aria-hidden className="mt-1.5 flex h-1.5 max-w-[13rem] items-stretch">
            <span className="flex-1 bg-mist"/>
            <span className="w-px bg-ink-3"/>
            <span className="flex-1 bg-mist"/>
          </span>
        </span>
      </div>
      <figcaption className="note mt-3 max-w-[62ch]">
        One row per consented student, ordered by how far their {SCORE} moved. Right of centre
        is worse.
      </figcaption>
    </figure>
  )
}

/* What the list is and why it is in this order, with both definitions on the
   words. It is the same copy on a full list and an empty one, so it is
   written once. */
const OrderRule = () => (
  <div className="max-w-[68ch]">
    <Sub>{CASELOAD_DEF}</Sub>
    <p className="mt-2 text-sec text-ink-3">
      <Term label={SCORE} def={SCORE_DEF}/>, {SCORE_RANGE}, higher is worse. Ordered by{' '}
      <Term label="weekly change"
        def="The move in a student's seven-day average from one week to the next. A student up 15 points from 55 comes before a student level at 70."/>.
      {' '}Change is what makes a check-in land before a problem grows. A low, steady {SCORE} is
      not a student in trouble.</p>
  </div>
)

function EmptyTriage() {
  return (
    <>
      <h2 className="font-display text-head font-bold tracking-tight text-ink">
        {CASELOAD_TITLE}</h2>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        <OrderRule/>
        <span className="text-tick text-ink-3">0 consented · 0 on this list</span>
      </div>

      <div className="mt-10">
        <section>
          <h3 className="mark">How a student gets on this list</h3>
          <ol className="m-0 mt-3 list-none p-0">
            {CASELOAD_NEEDS.map(([what, why]) => (
              <li key={what} className="border-b border-rule py-4 last:border-b-0 last:pb-0">
                <p className="font-display text-ui font-bold text-ink">{what}</p>
                <p className="mt-1 max-w-[62ch] text-sec text-ink-2">{why}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <BlankBoardRow/>

      {/* Both limited groups keep their headings with no rows under them: what
          a narrowed consent scope withholds is worth reading before a school
          has signed one. */}
      <div className="mt-14 grid gap-5 lg:grid-cols-2">
        {/* Written as scope definitions rather than as statements about
            guardians who have signed: none has. */}
        <Limited heading={`${SCORE} only, no weekly change`}
          note="These students never appear on the list above.">
          <BlankRow>No student is at this scope.</BlankRow>
        </Limited>
        <Limited heading="Crisis alerts only"
          note={`No ${SCORE}, change or band is ever shown.`}>
          <BlankRow>No student is at this scope.</BlankRow>
        </Limited>
      </div>
    </>
  )
}

function Triage({ onOpen, real }) {
  if (real) return <EmptyTriage/>
  const moved = triage()
  const scored = [...moved, ...scoreOnly()]
  const quiet = alertsOnly()
  const total = roster().length
  const mover = moved[0]
  const byScore = [...scored].sort((a, b) => b.current - a.current)
  const highest = byScore[0]
  /* This card used to read "Flat week. Referral already open since Feb 18."
     for whoever came out highest. Both halves were wrong on the fixture: the
     highest Mind Score consented to a score only, so the list may not state
     their weekly change at all, and Feb 18 is a different student's referral,
     one the Escalation tab shows as closed. Both come off the data now. */
  const ref = REFERRALS.find(r => r.student === highest.name && r.status !== 'Closed')
  const place = ['first','second','third','fourth','fifth','sixth','seventh','eighth'][
    byScore.findIndex(x => x.id === mover.id)]
  return (
    <>
      <h2 className="font-display text-head font-bold tracking-tight text-ink">
        {CASELOAD_TITLE}</h2>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        {/* The heading says what the list is for; the order rule and both
            hover definitions ride under it. */}
        <OrderRule/>
        <span className="text-tick text-ink-3">
          {total} consented · {moved.length} on this list</span>
      </div>

      <div className="mt-6 flex h-3 overflow-hidden rounded-xs" role="img"
        aria-label={TIER_ORDER.map(t => `${scored.filter(s2 => s2.tier === t).length} ${TIER_LABEL[t]}`).join(', ')}>
        {TIER_ORDER.map(t => {
          const n = scored.filter(s2 => s2.tier === t).length
          if (!n) return null
          const fill = { crisis:'bg-crit', high:'bg-warn', moderate:'bg-warn/45', info:'bg-ink-3/40' }[t]
          return <span key={t} className={cn(fill, 'border-r-2 border-paper last:border-r-0')}
            style={{ width: (n / scored.length) * 100 + '%' }}/>
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
        {TIER_ORDER.map(t => (
          <span key={t} className="font-mono text-tick tabular-nums text-ink-3">
            {scored.filter(s2 => s2.tier === t).length} {TIER_LABEL[t]}</span>
        ))}
      </div>

      {/* Why the order exists was the most useful thing on the screen and sat
          240px below the fold. It leads now. */}
      {/* mt was 7. The scale here is three fixed steps — 10 inside a section,
          14 between sections, 20 between page regions — so blocks at the same
          level of the outline no longer each pick their own number. */}
      <div className="mt-10 grid gap-x-10 gap-y-4 border-y border-rule py-5 sm:grid-cols-2">
        <div className="border-l-2 border-accent pl-4">
          <p className="font-mono text-num font-medium tabular-nums text-warn">+{mover.velocity}
            <span className="ml-2 text-tick text-ink-3">{mover.name} · first on the list</span></p>
          <p className="mt-1.5 text-sec text-ink-2">{place[0].toUpperCase() + place.slice(1)} highest {SCORE} of {scored.length}. First here because their {SCORE} moved most this week.</p>
        </div>
        <div className="border-l-2 border-rule pl-4">
          <p className="font-mono text-num font-medium tabular-nums text-ink">{highest.current}
            <span className="ml-2 text-tick text-ink-3">{highest.name} · highest {SCORE}</span></p>
          <p className="mt-1.5 text-sec text-ink-2">
            {highest.showTrend
              ? `Weekly change ${highest.velocity > 0 ? '+' : ''}${highest.velocity}. `
              : `${SCORE} only. No weekly change shared. `}
            {ref ? `Referral open since ${ref.opened}.` : 'No referral open.'}</p>
        </div>
      </div>

      <ol className="mt-10 list-none space-y-2 p-0">
        {moved.map((s, i) => <Row key={s.id} s={s} n={i + 1} onOpen={onOpen}/>)}
      </ol>
      {/* The first half of this footnote defined the weekly change; that
          definition is on the word itself now, and what is left is the bar's
          legend. */}
      <p className="mt-4 border-t border-ink pt-3 text-meta text-ink-3">
        Right of centre on the bar is worse.</p>

      <div className="mt-14 grid gap-5 lg:grid-cols-2">
        <Limited heading={`${SCORE} only, no weekly change`}
          note="These students do not appear on the list above.">
          {scoreOnly().map(s => (
            <li key={s.id} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
              <button onClick={() => onOpen(s.name)} className="min-h-[44px] text-left text-meta text-ink
                underline decoration-rule underline-offset-4 hover:decoration-accent">{s.name}</button>
              <span className="font-mono text-meta tabular-nums text-ink-3">
                Grade {s.grade} · {s.current} out of 100 · {TIER_LABEL[s.tier]}</span>
            </li>
          ))}
        </Limited>
        <Limited heading="Crisis alerts only"
          note={`No ${SCORE}, change or band is shown.`}>
          {quiet.map(s => (
            <li key={s.id} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
              <span className="text-meta text-ink">{s.name}</span>
              <span className="text-meta text-ink-3">Grade {s.grade} · nothing shared</span>
            </li>
          ))}
        </Limited>
      </div>
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
      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <Panel label="What changed this week">
          <div className={cn('font-mono text-stat font-medium tabular-nums',
            s.velocity > 0 ? 'text-warn' : s.velocity < 0 ? 'text-calm' : 'text-ink')}>
            {s.velocity > 0 ? '+' : ''}{s.velocity}</div>
          <p className="mt-1 text-sec text-ink-3">vs the week before</p>
          {/* "N points a week, worse" said the same thing as the figure above
              it and the caption under that, in a third wording. */}
          <ul className="mt-4 space-y-2.5 border-t border-rule pt-4 text-meta text-ink-2">
            <li>Moved from {s.weekAgo} to {s.current}.</li>
            <li>The change keeps landing in one lesson: AP Chemistry.</li>
          </ul>
        </Panel>

        <Panel label="What is driving the rise" action="share of this week's rise">
          <ul className="space-y-3.5">
            {drivers.map(d => (
              <li key={d.label}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-meta text-ink-2">{d.label}</span>
                  <span className="font-mono text-tick tabular-nums text-ink">{Math.round(d.share * 100)}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-xs bg-mist">
                  <div className="h-full rounded-xs bg-warn" style={{ width: d.share * 100 + '%' }}/>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel label="Interventions tried">
          <ul className="space-y-2.5 text-meta text-ink-2">
            {INTERVENTIONS.filter(i => i.sessions > 0).map(i => <li key={i.name}>{efficacyLabel(i)}</li>)}
          </ul>
          <Note>Measured from physiology.</Note>
        </Panel>
      </div>

      <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel label="The last 45 days">
          <svg viewBox="0 0 720 214" className="block w-full overflow-visible" role="img"
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
              d={series.map((p, i) => (i ? 'L' : 'M') + (40 + (i / 44) * 670).toFixed(1) + ' ' +
                (180 - ((p.v - lo) / (hi - lo)) * 160).toFixed(1)).join(' ')}/>
            <path fill="none" strokeWidth="2.5" strokeLinejoin="round" className="stroke-warn"
              vectorEffect="non-scaling-stroke"
              d={series.slice(31).map((p, i) => (i ? 'L' : 'M') + (40 + ((i + 31) / 44) * 670).toFixed(1) + ' ' +
                (180 - ((p.v - lo) / (hi - lo)) * 160).toFixed(1)).join(' ')}/>
            <text x="40" y="209" className="fill-ink-3 text-[16px]">45 days ago</text>
            <text x="710" y="209" textAnchor="end" className="fill-ink-3 text-[16px]">today</text>
          </svg>
          <Note>The coloured stretch is the last two weeks.</Note>
        </Panel>

        <Panel label="Counselor notes">
          <label htmlFor="cnote" className="sr-only">Counselor note for {s.name}</label>
          <textarea id="cnote" rows={5} value={note} onChange={e => setNote(e.target.value)}
            placeholder="Add a note…"
            className="w-full resize-none rounded-field border-0 border-b-2 border-rule bg-mist/40 p-3.5
              text-meta text-ink placeholder:text-ink-3 focus-visible:border-ink focus-visible:outline-none"/>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <span className="text-sec text-ink-3">Saving writes a row to the log</span>
            <Button size="sm" disabled={!note.trim()}>Save note</Button>
          </div>
        </Panel>
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
