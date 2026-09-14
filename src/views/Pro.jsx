import React from 'react'
import { Back } from './Monitor'
import { Panel } from '../s21/display'
import { Table, THead, TBody, TR, TH, TD } from '../s21/table'
import { RuleDraw, ScrollIn } from '../s21/motion'
import { Button } from '../ui/button'
import { ConfirmClose } from '../ui/confirm'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
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
import KineticGrid from '../s21/texture'
import { cn } from '../lib/utils'

const TABS = [
  ['triage','Triage'], ['student','One student'], ['cohort','Year groups'],
  ['escalation','Escalation'], ['consent','Consent'],
]
const Sub = ({ children, className }) =>
  <p className={cn('max-w-[68ch] text-sec text-ink-2', className)}>{children}</p>
const Note = ({ children }) => <p className="mt-5 max-w-[70ch] border-t border-rule pt-4 text-meta text-ink-3">{children}</p>

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

/* ── Triage ─────────────────────────────────────────────────────────────── */
/* One list, ranked by rate of change, because that is what the page claims
   the ranking is. The previous version sorted by velocity and then rendered
   four columns grouped by tier, so the fastest changer appeared fourth. */
function Row({ s, rank, onOpen }) {
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
        <span className="pt-1 font-mono text-meta tabular-nums text-ink-3 sm:pt-0">{rank}</span>
        <span className="min-w-0">
          <span className="block truncate text-row text-ink">{s.name}</span>
          <span className="mt-0.5 block font-mono text-tick text-ink-3">
            Grade {s.grade} · {TIER_LABEL[s.tier]}</span>
        </span>
        <span className="flex items-baseline gap-2 sm:block">
          <span className={cn('font-mono text-num font-medium leading-none tabular-nums',
            s.tier === 'crisis' ? 'text-crit' : s.tier === 'high' ? 'text-warn' : 'text-ink')}>
            {s.current}</span>
          <span className="whitespace-nowrap font-mono text-tick text-ink-3 sm:mt-1 sm:block">out of 100</span>
        </span>
        <span className="col-span-full sm:col-span-1">
          <span className="flex items-center gap-3">
            <span className={cn('font-mono text-meta tabular-nums',
              dir === 'worse' ? 'text-warn' : dir === 'better' ? 'text-calm' : 'text-ink-3')}>
              {s.velocity > 0 ? '▲ +' : s.velocity < 0 ? '▼ −' : '– '}{Math.abs(s.velocity) || ''}
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
   beside the triage list, so they are cards like everything else on the board.
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

function Triage({ onOpen }) {
  const ranked = triage()
  const scored = [...ranked, ...scoreOnly()]
  const quiet = alertsOnly()
  const total = roster().length
  const fastest = ranked[0]
  const byScore = [...scored].sort((a, b) => b.current - a.current)
  const highest = byScore[0]
  const place = ['first','second','third','fourth','fifth','sixth','seventh','eighth'][
    byScore.findIndex(x => x.id === fastest.id)]
  return (
    <>
      {/* Was "Who to see first", which posed the board's question without
          naming the board. The question is worth keeping, so it leads the
          paragraph instead. */}
      <h2 className="font-display text-head font-medium tracking-tight text-ink">
        Your caseload, ranked by weekly change</h2>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        {/* "Ranked by weekly velocity" was a second sentence saying what the
            heading now says, so the two terms are folded into one line and the
            hover definitions are unchanged. */}
        <Sub>Who to see first. <b className="font-medium text-ink">
          <Term label="Stress index"
            def="One score a day per student, 0 to 100, read against that student's own baseline rather than against the year group."/>,
          {' '}0 to 100, higher is worse</b>, ordered by weekly{' '}
          <Term label="velocity"
            def="The change in a student's seven-day average from one week to the next. It is what orders this list, so a rising student at 55 sits above a level one at 70."/>.</Sub>
        <span className="font-mono text-tick text-ink-3">
          {total} consented · {ranked.length} ranked</span>
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

      {/* "Why this order" was the most useful thing on the screen and sat 240px
          below the fold. It leads now. */}
      {/* mt was 7. The scale here is three fixed steps — 10 inside a section,
          14 between sections, 20 between page regions — so blocks at the same
          level of the outline no longer each pick their own number. */}
      <div className="mt-10 grid gap-x-10 gap-y-4 border-y border-rule py-5 sm:grid-cols-2">
        <div className="border-l-2 border-accent pl-4">
          <p className="font-mono text-num font-medium tabular-nums text-warn">+{fastest.velocity}
            <span className="ml-2 text-tick text-ink-3">{fastest.name} · first on the list</span></p>
          <p className="mt-1.5 text-sec text-ink-2">{place[0].toUpperCase() + place.slice(1)} highest
            score of {scored.length}. Ranked first here on velocity.</p>
        </div>
        <div className="border-l-2 border-rule pl-4">
          <p className="font-mono text-num font-medium tabular-nums text-ink">{highest.current}
            <span className="ml-2 text-tick text-ink-3">{highest.name} · highest score</span></p>
          <p className="mt-1.5 text-sec text-ink-2">Flat week. Referral already open since Feb 18.</p>
        </div>
      </div>

      <ol className="mt-10 list-none space-y-2 p-0">
        {ranked.map((s, i) => <Row key={s.id} s={s} rank={i + 1} onOpen={onOpen}/>)}
      </ol>
      {/* The first half of this footnote defined velocity; that definition is
          on the word itself now, and what is left is the bar's legend. */}
      <p className="mt-4 border-t border-ink pt-3 text-meta text-ink-3">
        Right of centre on the bar is worse.</p>

      <div className="mt-14 grid gap-5 lg:grid-cols-2">
        <Limited heading="Score only — no trends shared"
          note="Guardian consented to a score only. No rank is shown for these students.">
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
          note="Guardian consented to crisis alerts only. No score, trend or tier is shown.">
          {quiet.map(s => (
            <li key={s.id} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
              <span className="text-meta text-ink">{s.name}</span>
              <span className="font-mono text-meta text-ink-3">Grade {s.grade} · nothing shared</span>
            </li>
          ))}
        </Limited>
      </div>
    </>
  )
}

/* ── One student ────────────────────────────────────────────────────────── */
function OneStudent({ who, setWho }) {
  const all = roster()
  const s = all.find(x => x.name === who) || all[0]
  const [note, setNote] = React.useState('')
  /* Both of these used to be module constants, so every student on the board
     showed Student 8241's drivers and Student 8241's 45-day line. */
  const drivers = driversFor(s)
  const series = profile45(s)
  const lo = Math.min(...series.map(p => p.v)), hi = Math.max(...series.map(p => p.v))
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-head font-medium tracking-tight text-ink">{s.name}</h2>
          <p className="mt-1 font-mono text-tick text-ink-3">
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
            <CardTitle as="h3" className="text-row">Score today: {s.current} out of 100</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-3">
            <ul className="max-w-[46ch] space-y-1.5 text-sec text-ink-2">
              <li>Consent scope: <b className="font-medium text-ink">score and crisis alerts</b></li>
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
            aria-label="Daily mean stress index over 45 days, rising through the last two weeks.">
            {[40, 60, 80].map(v => {
              const y = 180 - ((v - lo) / (hi - lo)) * 160
              return <g key={v}>
                <line x1="40" x2="710" y1={y} y2={y} className="stroke-rule" strokeWidth="1"/>
                <text x="30" y={y + 5} textAnchor="end" className="fill-ink-3 font-mono text-[16px]">{v}</text>
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
            <text x="40" y="209" className="fill-ink-3 font-mono text-[16px]">45 days ago</text>
            <text x="710" y="209" textAnchor="end" className="fill-ink-3 font-mono text-[16px]">today</text>
          </svg>
          <Note>The coloured stretch is the last two weeks.</Note>
        </Panel>

        <Panel label="Counselor notes">
          <label htmlFor="cnote" className="sr-only">Counselor note for {s.name}</label>
          <textarea id="cnote" rows={5} value={note} onChange={e => setNote(e.target.value)}
            placeholder="Add a note…"
            className="w-full resize-none rounded-field border-0 border-b-2 border-rule bg-mist/40 p-3.5
              text-meta text-ink placeholder:text-ink-3 focus-visible:border-ink focus-visible:outline-none"/>
          <div className="mt-3 flex items-center justify-between gap-3">
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
function Cohort() {
  const visible = COHORT_PERIOD.filter(p => !p.suppressed)
  const lo = Math.min(...visible.map(p => p.mean)), hi = Math.max(...visible.map(p => p.mean))
  const avg = Math.round(visible.reduce((a, b) => a + b.mean, 0) / visible.length)
  const top = [...visible].sort((a, b) => b.mean - a.mean)[0]
  const hardest = [...COHORT_WEEKDAY].sort((a, b) => b.mean - a.mean)[0]
  const wAvg = Math.round(COHORT_WEEKDAY.reduce((a, b) => a + b.mean, 0) / COHORT_WEEKDAY.length)
  const suppressed = COHORT_PERIOD.filter(p => p.suppressed).length
  return (
    <>
      <h2 className="font-display text-head font-medium tracking-tight text-ink">
        Patterns across the whole school</h2>
      {/* A reviewer read "8 students" on the triage board and "18 consented
          students" here and concluded one of them was invented. Both are true
          and neither said which population it meant. */}
      <Sub className="mt-2">All {SCHOOL_N} consented students in the building, not the eight on your
        caseload. Nobody here is identifiable.</Sub>
      <div className="mt-10 grid gap-x-12 gap-y-10 lg:grid-cols-3">
        <section className="lg:col-span-2">
          {/* "School-wide pattern" repeated the h2 directly above it. The two
              findings under it are what the section actually is. */}
          <h3 className="mark">The two clearest patterns</h3>
          <RuleDraw className="mt-2.5"/>
          <ScrollIn className="mt-6">
            <h4 className="font-display text-row font-medium tracking-tight text-ink">
              {top.label} shows a school-wide stress spike.</h4>
            <ul className="mt-3 max-w-[58ch] space-y-1.5 text-sec text-ink-2">
              <li>Mean <b className="font-medium text-ink">{top.mean}</b> against a school average
                of {avg} — <b className="font-medium text-warn">
                {Math.round(((top.mean - avg) / avg) * 100)}% higher</b></li>
              <li>Across {top.n} consented students in that period</li>
              <li>Holds across every year group taking it</li>
            </ul>
          </ScrollIn>
          <ScrollIn delay={0.08} className="mt-6 border-t border-rule pt-6">
            <h4 className="font-display text-row font-medium tracking-tight text-ink">
              {hardest.full} is the hardest day of the week, school-wide.</h4>
            <ul className="mt-3 max-w-[58ch] space-y-1.5 text-sec text-ink-2">
              <li>Mean <b className="font-medium text-ink">{hardest.mean}</b> against {wAvg} on an
                average day</li>
              <li>Exam weeks in junior year run <b className="font-medium text-warn">2.4×</b> the
                non-exam baseline</li>
            </ul>
          </ScrollIn>
          <Note>Consented students only, from the same windows the individual scores use.</Note>
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
        <Panel label="Stress by class period — school-wide">
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
                    <div className="h-full w-full" role="img" aria-label="Suppressed for k-anonymity"
                      style={{ backgroundImage:'repeating-linear-gradient(45deg,#cdd6ea,#cdd6ea 4px,transparent 4px,transparent 8px)' }}/>
                  ) : (
                    <div className={cn('h-full rounded-xs', p.mean >= 65 ? 'bg-warn' : 'bg-accent')}
                      style={{ width: 20 + ((p.mean - lo) / (hi - lo || 1)) * 80 + '%' }}/>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel label="Stress by weekday — school-wide">
          <div className="flex h-[170px] items-end justify-between gap-3">
            {COHORT_WEEKDAY.map(d => (
              <div key={d.key} className="flex flex-1 flex-col items-center justify-end gap-2">
                <span className="font-mono text-sec tabular-nums text-ink-3">{d.mean}</span>
                <div className={cn('w-full rounded-t-xs', d.mean >= 60 ? 'bg-warn' : 'bg-ink-3')}
                  style={{ height: (d.mean / 100) * 120 + 'px' }}/>
                <span className="font-mono text-tick text-ink-3">{d.label}</span>
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
function Escalation() {
  const [done, setDone] = React.useState(PROTOCOL_DONE)
  const [closing, setClosing] = React.useState(false)
  const [closed, setClosed] = React.useState(null)
  const toggle = i => setDone(d => d.includes(i) ? d.filter(x => x !== i) : [...d, i])
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
            <h3 className="font-display text-row font-medium tracking-tight text-ink">Student 8241</h3>
            <span className="font-mono text-sec tabular-nums text-ink-3">2:14 PM</span>
          </div>
          <p className="mt-2 max-w-[60ch] text-meta text-ink-2">
            Student 8241’s physiology crossed the crisis threshold during AP Chemistry. The escalation
            protocol ran automatically.</p>
          <div className="mt-5 border-t border-rule pt-4">
            {/* "Protocol" named the document, not the five checkboxes under
                it. */}
            <h4 className="mark">Escalation steps</h4>
            <ul className="mt-3 space-y-1">
              {PROTOCOL.map((step, i) => (
                <li key={step}>
                  <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
                    <input type="checkbox" checked={done.includes(i)} onChange={() => toggle(i)}
                      className="size-4 accent-[#3d52a0]"/>
                    <span className={cn('text-meta', done.includes(i) ? 'text-ink-3 line-through decoration-rule' : 'text-ink')}>
                      {step}</span>
                    <span className="ml-auto font-mono text-sec tabular-nums text-ink-3">
                      {done.includes(i) ? PROTOCOL_TIMES[i] : ''}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
            <Button size="sm" disabled={done.length < PROTOCOL.length || !!closed}
              onClick={() => setClosing(true)}>
              {closed ? 'Closed' : 'Close with outcome'}</Button>
            <span className="font-mono text-sec tabular-nums text-ink-3">
              {done.length} of {PROTOCOL.length} steps complete</span>
          </div>
          </CardContent>
        </Card>

        <Panel as="h3" label="Referrals already open">
          <ul className="divide-y divide-rule">
            {REFERRALS.map(r => (
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

      <Panel as="h3" className="mt-14" label="Audit log" action="Append-only · cannot be edited or deleted">
        <Table>
          <THead><TR>{['When','Actor','Action','Subject'].map(h => <TH key={h}>{h}</TH>)}</TR></THead>
          <TBody>
            {AUDIT_LOG.map(r => (
              <TR key={r.at + r.action}>
                <TD num className="w-44">{r.at}<span className="ml-2 text-ink-3">{r.rel}</span></TD>
                <TD className="w-44">{r.actor}</TD>
                <TD>{r.action}</TD>
                <TD className="w-44">{r.subject}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <Note>A student changing their own settings is logged exactly like a staff action. Step five is
          still open, so there is no closing entry yet.</Note>
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
function Consent() {
  return (
    <>
      <h2 className="mb-7 font-display text-head font-medium tracking-tight text-ink">
        What each guardian agreed to</h2>
      <Panel as="h3" label="Consent ledger" action={`${CONSENT_LEDGER.length} active · FERPA / COPPA`}>
        <Table>
          <THead><TR>{['Student','Guardian','Scope consented','Basis','Signed','Expires']
            .map(h => <TH key={h}>{h}</TH>)}</TR></THead>
          <TBody>
            {CONSENT_LEDGER.map(r => (
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
        <Note>The triage board reads this table directly: two students here carry no rank, one shows no
          score. A student can narrow or withdraw any scope except a crisis alert, at any time.</Note>
      </Panel>

      <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Panel as="h3" label="Data retention">
          <div className="font-mono text-stat font-medium tabular-nums text-ink">90</div>
          <p className="mt-1 text-sec text-ink-3">days, raw signals</p>
          <p className="mt-4 max-w-[52ch] text-meta text-ink-2">
            Set by each student. After the window closes the second-by-second readings are deleted.
            No archive, no backup.</p>
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
            {AUDIT_LOG.map(r => (
              <li key={r.at + r.action} className="flex items-baseline justify-between gap-4 py-3.5 first:pt-0">
                <div className="min-w-0">
                  <p className="truncate text-meta text-ink">{r.action}</p>
                  <p className="mt-0.5 text-sec text-ink-3">{r.actor} · {r.subject}</p>
                </div>
                <span className="shrink-0 font-mono text-sec tabular-nums text-ink-3">{r.at}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-rule pt-4">
            <Button variant="outline" size="sm" disabled>Export audit log (CSV)</Button>
            <Button variant="outline" size="sm" disabled>Export consent ledger</Button>
            <span className="text-sec text-ink-3">Disabled in this demo. In the product every export
              writes its own row above.</span>
          </div>
        </Panel>
      </div>
    </>
  )
}

export function Pro({ go }) {
  const [tab, setTab] = React.useState('triage')
  const [who, setWho] = React.useState('Student 8241')
  const [said, setSaid] = React.useState('')
  /* Switching tabs, or opening a record from the board, replaced the whole
     panel with focus still on <body> and nothing announced. A screen-reader
     user had no way to know the page had changed under them. */
  const announce = msg => { setSaid(''); requestAnimationFrame(() => setSaid(msg)) }
  const onTab = v => { setTab(v); announce(`${TABS.find(t => t[0] === v)[1]} — showing now`) }
  const openStudent = name => { setWho(name); setTab('student'); announce(`Opened the record for ${name}`) }
  const PANES = {
    triage: () => <Triage onOpen={openStudent}/>,
    student: () => <OneStudent who={who} setWho={setWho}/>,
    cohort: Cohort, escalation: Escalation, consent: Consent,
  }
  return (
    <main>
      <div className="relative overflow-hidden border-b border-rule bg-mist">
        {/* decoration: it carries no information a reader needs */}
        <KineticGrid aria-hidden className="absolute inset-0" globalColor="monochrome"/>
        {/* Was py-6 sm:py-8; the header band is the smallest of the three
            fixed steps, and matches the band in views/shell.jsx. */}
        <div className="wrap relative py-10">
          <Back go={go} to="site" label="Overview"/>
          {/* Was "For school counselors and psychologists" — an audience, not a
              screen. The three audience views are named the same way now. */}
          <h1 className="font-display font-medium text-major leading-[1.05] tracking-tight text-ink">
            What a school counselor sees</h1>
          <p className="mt-3 max-w-[60ch] text-sec text-ink-2">
            Only students who consented appear, and each one only to the extent their guardian agreed.
            Groups under five return nothing.</p>
          <p className="mt-4 inline-flex max-w-[60ch] items-baseline gap-2 border-l-2 border-warn bg-paper/70
            py-2 pl-3 pr-4 text-meta text-ink-2">
            <Badge variant="demo">Demo</Badge>
            Every figure here is generated. No student was measured.</p>
        </div>
      </div>
      {/* Was py-9 sm:py-12; the tab body is a section, the middle step. */}
      <div className="wrap py-14">
      <p aria-live="polite" className="sr-only text-sec">{said}</p>
      {/* Was a second hand-classed copy of the tab strip in views/shell.jsx.
          One definition in ui/tabs now, so the two consoles cannot drift. */}
      <Tabs value={tab} onValueChange={onTab}>
        <TabsList aria-label="Monitoring views">
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
