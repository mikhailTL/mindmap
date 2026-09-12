import React from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { Back } from './Monitor'
import { Panel, StatusPill, Badge, Progress, EmptyState } from '../s21/display'
import { Table, THead, TBody, TR, TH, TD } from '../s21/table'
import { Reveal, RevealRow, RuleDraw } from '../s21/motion'
import { Spark, FigHead } from '../charts/primitives'
import { Button } from '../ui/button'
import { DATA } from '../lib/assets'
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

/* ── Triage ─────────────────────────────────────────────────────────────── */
/* One list, ranked by rate of change, because that is what the page claims
   the ranking is. The previous version sorted by velocity and then rendered
   four columns grouped by tier, so the fastest changer appeared fourth. */
function Row({ s, rank, onOpen }) {
  const dir = s.velocity > 0 ? 'worse' : s.velocity < 0 ? 'better' : 'flat'
  return (
    <li>
      <button onClick={() => onOpen(s.name)}
        className="grid w-full grid-cols-[2rem_minmax(0,1fr)] items-start gap-x-4 gap-y-3 border-t
          border-rule py-4 text-left transition-colors duration-150 hover:bg-sage/60
          focus-visible:bg-sage/60 sm:grid-cols-[2rem_minmax(0,13rem)_7rem_minmax(0,1fr)] sm:items-center">
        <span className="pt-1 font-mono text-meta tabular-nums text-ink-3 sm:pt-0">{rank}</span>
        <span className="min-w-0">
          <span className="block truncate text-row text-ink">{s.name}</span>
          <span className="mt-0.5 block font-mono text-label uppercase tracking-[0.12em] text-ink-3">
            Grade {s.grade} · {TIER_LABEL[s.tier]}</span>
        </span>
        <span className="flex items-baseline gap-2 sm:block">
          <span className={cn('font-mono text-num font-medium leading-none tabular-nums',
            s.tier === 'crisis' ? 'text-crit' : s.tier === 'high' ? 'text-warn' : 'text-ink')}>
            {s.current}</span>
          <span className="whitespace-nowrap font-mono text-label text-ink-3 sm:mt-1 sm:block">out of 100</span>
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
              <span className="flex flex-1 justify-end bg-sage">
                {s.velocity < 0 && <span className="bg-calm"
                  style={{ width: Math.min(100, Math.abs(s.velocity) * 6) + '%' }}/>}
              </span>
              <span className="w-px bg-ink-3"/>
              <span className="flex flex-1 bg-sage">
                {s.velocity > 0 && <span className="bg-warn"
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
      </button>
    </li>
  )
}

function Limited({ heading, note, children }) {
  return (
    <section className="rounded-xs border border-rule bg-sage/40 p-5">
      <h3 className="font-display text-row font-bold text-ink">{heading}</h3>
      <p className="mt-1.5 max-w-[52ch] text-sec text-ink-2">{note}</p>
      <ul className="mt-4 divide-y divide-rule border-t border-rule">{children}</ul>
    </section>
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
      <h2 className="font-display text-head font-bold tracking-tight text-ink">Who to see first</h2>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
        <Sub><b className="font-medium text-ink">Stress index, 0 to 100, higher is worse.</b> Ranked by
          how fast each student is changing — not by who scores highest today.</Sub>
        <span className="font-mono text-label uppercase tracking-[0.12em] text-ink-3">
          {total} consented · {ranked.length} ranked</span>
      </div>

      <div className="mt-6 flex h-3 overflow-hidden rounded-full" role="img"
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
          <span key={t} className="font-mono text-label tabular-nums text-ink-3">
            {scored.filter(s2 => s2.tier === t).length} {TIER_LABEL[t]}</span>
        ))}
      </div>

      {/* "Why this order" was the most useful thing on the screen and sat 240px
          below the fold. It leads now. */}
      <div className="mt-7 grid gap-x-10 gap-y-4 border-y border-rule py-5 sm:grid-cols-2">
        <div className="border-l-2 border-accent pl-4">
          <p className="font-mono text-num font-medium tabular-nums text-warn">+{fastest.velocity}
            <span className="ml-2 text-label text-ink-3">{fastest.name} · first on the list</span></p>
          <p className="mt-1.5 text-sec text-ink-2">Scores {fastest.current}, which is {place} highest
            of the {scored.length} today. Ranking by score would have put them near the bottom.</p>
        </div>
        <div className="border-l-2 border-rule pl-4">
          <p className="font-mono text-num font-medium tabular-nums text-ink">{highest.current}
            <span className="ml-2 text-label text-ink-3">{highest.name} · highest score</span></p>
          <p className="mt-1.5 text-sec text-ink-2">Already open with you, already referred. A high score
            you knew about yesterday is not news.</p>
        </div>
      </div>

      <ol className="mt-7 list-none p-0">
        {ranked.map((s, i) => <Row key={s.id} s={s} rank={i + 1} onOpen={onOpen}/>)}
      </ol>
      <p className="mt-3 border-t border-ink pt-3 text-meta text-ink-3">The figure beside each name is the
        change in their seven-day average, per week. Right of the centre line is worse; left is better.</p>

      <div className="mt-9 grid gap-5 lg:grid-cols-2">
        <Limited heading="Score only — no trends shared"
          note={`Their guardian consented to a wellness score and crisis alerts, and not to
            week-over-week movement. These students carry no rank, because a rank is a trend.`}>
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
          note={`Their guardian consented to crisis alerts and nothing else. No score, no trend, no tier —
            the board shows you that this student exists and that you would be called if they were in
            crisis. That is the whole record.`}>
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
          <h2 className="font-display text-head font-bold tracking-tight text-ink">{s.name}</h2>
          <p className="mt-1 font-mono text-label uppercase tracking-[0.12em] text-ink-3">
            Grade {s.grade}{s.showScore ? ` · ${TIER_LABEL[s.tier]}` : ''}</p>
          <p className="mt-2 max-w-[46ch] text-sec text-ink-2">Consented: {s.scope}.</p>
        </div>
        <div>
          <label htmlFor="pick" className="lab block">Open a different student</label>
          <select id="pick" value={s.name} onChange={e => setWho(e.target.value)}
            className="mt-1.5 min-h-[48px] rounded-xs border border-rule bg-paper px-3 font-body
              text-meta text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            {all.map(x => <option key={x.id} value={x.name}>
              {x.name} · G{x.grade}{x.showScore ? ` · ${x.current}` : ' · not shared'}</option>)}
          </select>
        </div>
      </div>

      {!s.showScore && (
        <div className="mt-7 rounded-xs border border-rule bg-sage/40 p-6">
          <h3 className="font-display text-row font-bold text-ink">Nothing to show, by consent</h3>
          <p className="mt-2 max-w-[58ch] text-sec text-ink-2">This student's guardian consented to crisis
            alerts only. There is no score, no trend and no breakdown for you to open. If their readings
            crossed the crisis threshold you would be paged, and that page is the only thing this record
            can ever contain.</p>
        </div>
      )}

      {s.showScore && !s.showTrend && (
        <div className="mt-7 rounded-xs border border-rule bg-sage/40 p-6">
          <h3 className="font-display text-row font-bold text-ink">Score today: {s.current} out of 100</h3>
          <p className="mt-2 max-w-[58ch] text-sec text-ink-2">Their guardian consented to a score and to
            crisis alerts, not to trends. The week-over-week panels, the driver breakdown and the 45-day
            line are withheld on this record — not blurred, withheld.</p>
        </div>
      )}

      {s.showTrend && <>
      <div className="mt-7 grid gap-8 lg:grid-cols-3">
        <Panel label="What changed this week">
          <div className={cn('font-mono text-stat font-medium tabular-nums',
            s.velocity > 0 ? 'text-warn' : s.velocity < 0 ? 'text-calm' : 'text-ink')}>
            {s.velocity > 0 ? '+' : ''}{s.velocity}</div>
          <p className="mt-1 text-sec text-ink-3">vs the week before</p>
          <ul className="mt-4 space-y-2.5 border-t border-rule pt-4 text-meta text-ink-2">
            <li>Mean index moved from {s.weekAgo} to {s.current}.</li>
            <li>Changing {s.velocity > 0 ? 'for the worse' : 'for the better'} by {Math.abs(s.velocity)} points a week.</li>
            <li>The change keeps landing in the same lesson: AP Chemistry.</li>
          </ul>
        </Panel>

        <Panel label="What is driving it" action="share of this week's rise">
          <ul className="space-y-3.5">
            {drivers.map(d => (
              <li key={d.label}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-meta text-ink-2">{d.label}</span>
                  <span className="font-mono text-label tabular-nums text-ink">{Math.round(d.share * 100)}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-sage">
                  <div className="h-full rounded-full bg-warn" style={{ width: d.share * 100 + '%' }}/>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel label="Interventions tried">
          <ul className="space-y-2.5 text-meta text-ink-2">
            {INTERVENTIONS.filter(i => i.sessions > 0).map(i => <li key={i.name}>{efficacyLabel(i)}</li>)}
          </ul>
          <Note>Measured on their own physiology, not self-reported.</Note>
        </Panel>
      </div>

      <div className="mt-9 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
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
          <Note>The coloured stretch is the last two weeks — the run that put them on this board.</Note>
        </Panel>

        <Panel label="Counselor notes">
          <label htmlFor="cnote" className="sr-only">Counselor note for {s.name}</label>
          <textarea id="cnote" rows={5} value={note} onChange={e => setNote(e.target.value)}
            placeholder="Add a note…"
            className="w-full resize-none rounded-xs border border-rule bg-paper p-3.5 text-meta text-ink
              placeholder:text-ink-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"/>
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
      <h2 className="font-display text-head font-bold tracking-tight text-ink">
        Patterns across the whole school</h2>
      {/* A reviewer read "8 students" on the triage board and "18 consented
          students" here and concluded one of them was invented. Both are true
          and neither said which population it meant. */}
      <Sub className="mt-2">These screens aggregate all {SCHOOL_N} consented students in the building,
        not the eight on your caseload. No individual is identifiable in anything below.</Sub>
      <div className="mt-8 grid gap-x-12 gap-y-10 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h3 className="lab font-normal">School-wide pattern</h3>
          <RuleDraw className="mt-2.5"/>
          <Reveal className="mt-6">
            <h4 className="font-display text-row font-bold tracking-tight text-ink">
              {top.label} shows a school-wide stress spike.</h4>
            <p className="mt-2 max-w-[70ch] text-sec text-ink-2">
              Mean index {top.mean} against a school average of {avg} —
              {' '}{Math.round(((top.mean - avg) / avg) * 100)}% higher, across {top.n} consented students.
              This is not one struggling student. It is a timetable problem.</p>
          </Reveal>
          <Reveal delay={0.08} className="mt-6 border-t border-rule pt-6">
            <h4 className="font-display text-row font-bold tracking-tight text-ink">
              {hardest.full} is the hardest day of the week, school-wide.</h4>
            <p className="mt-2 max-w-[70ch] text-sec text-ink-2">
              Mean index {hardest.mean} against {wAvg} on an average day, across all {SCHOOL_N} consented
              students. Exam weeks in junior year run about 2.4× the non-exam baseline.</p>
          </Reveal>
          <Note>Aggregated across consented students only, and computed from the same windows the
            individual scores use. Nothing here is a projection.</Note>
        </section>

        <Panel as="h3" label="Privacy floor">
          <div className="font-mono text-stat font-medium tabular-nums text-ink">{K_ANONYMITY}</div>
          <p className="mt-1 text-sec text-ink-3">minimum cell size</p>
          <p className="mt-4 text-meta text-ink-2">
            Any group smaller than {K_ANONYMITY} students is suppressed before it reaches this screen —
            not blurred, not rounded. Suppressed.</p>
          {suppressed > 0 && (
            <p className="mt-4 border-t border-rule pt-4 text-meta text-ink-2">
              {suppressed} cell{suppressed === 1 ? '' : 's'} hidden on this page for exactly that reason.
              In a class of three, an “anonymous” average is a name.</p>
          )}
        </Panel>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Panel label="Stress by class period — school-wide">
          <ul className="space-y-4">
            {COHORT_PERIOD.map(p => (
              <li key={p.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-meta text-ink-2">{p.label}</span>
                  <span className="font-mono text-sec tabular-nums text-ink-3">
                    {p.suppressed ? 'suppressed' : p.mean} · n={p.n}</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sage">
                  {p.suppressed ? (
                    <div className="h-full w-full" role="img" aria-label="Suppressed for k-anonymity"
                      style={{ backgroundImage:'repeating-linear-gradient(45deg,#dde5e2,#dde5e2 4px,transparent 4px,transparent 8px)' }}/>
                  ) : (
                    <div className={cn('h-full rounded-full', p.mean >= 65 ? 'bg-warn' : 'bg-accent')}
                      style={{ width: 20 + ((p.mean - lo) / (hi - lo || 1)) * 80 + '%' }}/>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel label="By weekday">
          <div className="flex h-[170px] items-end justify-between gap-3">
            {COHORT_WEEKDAY.map(d => (
              <div key={d.key} className="flex flex-1 flex-col items-center justify-end gap-2">
                <span className="font-mono text-sec tabular-nums text-ink-3">{d.mean}</span>
                <div className={cn('w-full rounded-t-sm', d.mean >= 60 ? 'bg-warn' : 'bg-ink-3')}
                  style={{ height: (d.mean / 100) * 120 + 'px' }}/>
                <span className="font-mono text-label text-ink-3">{d.label}</span>
              </div>
            ))}
          </div>
          <Note>Every weekday cell clears the {K_ANONYMITY}-student floor.</Note>
        </Panel>
      </div>

      <Panel className="mt-10" label="What a school does with this">
        <p className="max-w-[80ch] text-sec text-ink-2">
          A counselor cannot move a hundred students one at a time. But a third-period spike that shows up
          across an entire grade is not a hundred individual problems — it is one scheduling decision, and it
          can be changed by one person in one meeting. That is the difference between a wellness app and an
          intervention.</p>
      </Panel>
    </>
  )
}

/* ── Escalation ─────────────────────────────────────────────────────────── */
function Escalation() {
  const [done, setDone] = React.useState(PROTOCOL_DONE)
  const toggle = i => setDone(d => d.includes(i) ? d.filter(x => x !== i) : [...d, i])
  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <section className="border-t-2 border-crit/40 pt-4">
          <h2 className="lab font-normal text-crit">Crisis queue</h2>
          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="font-display text-row font-bold tracking-tight text-ink">Student 8241</h3>
            <span className="font-mono text-sec tabular-nums text-ink-3">2:14 PM</span>
          </div>
          <p className="mt-2 max-w-[60ch] text-meta text-ink-2">
            Student 8241’s physiology crossed the crisis threshold during AP Chemistry. The escalation
            protocol ran automatically.</p>
          <div className="mt-5 border-t border-rule pt-4">
            <h4 className="lab font-normal">Protocol</h4>
            <ul className="mt-3 space-y-1">
              {PROTOCOL.map((step, i) => (
                <li key={step}>
                  <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
                    <input type="checkbox" checked={done.includes(i)} onChange={() => toggle(i)}
                      className="size-4 accent-[#0f6b62]"/>
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
            <Button size="sm" disabled={done.length < PROTOCOL.length}>Close with outcome</Button>
            <span className="font-mono text-sec tabular-nums text-ink-3">
              {done.length} of {PROTOCOL.length} steps complete</span>
          </div>
        </section>

        <Panel as="h3" label="Referrals">
          <ul className="divide-y divide-rule">
            {REFERRALS.map(r => (
              <li key={r.student + r.opened} className="py-3.5 first:pt-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-meta text-ink">{r.student}</span>
                  <Badge tone={r.status === 'Closed' ? 'quiet' : 'accent'}>{r.status}</Badge>
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

      <Panel as="h3" className="mt-10" label="Audit log" action="Append-only · cannot be edited or deleted">
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
        <Note>The last row is a student changing their own settings. It is logged exactly like any staff
          action. The top row is where this crisis currently stands — step five of the protocol is still
          open, so there is no closing entry yet.</Note>
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
      <h2 className="mb-7 font-display text-head font-bold tracking-tight text-ink">
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
                <TD><Badge>{r.basis}</Badge></TD>
                <TD num>{r.signedAt}</TD>
                <TD num>{r.expires}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <Note>Consent is scoped, not blanket, and the triage board reads this table directly. Two students
          here share a score and not trends, so they carry no rank on the board. One shares crisis alerts
          only, so the board shows their name and nothing else. Every scope except a crisis alert can be
          narrowed or withdrawn by the student at any time.</Note>
      </Panel>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Panel as="h3" label="Data retention">
          <div className="font-mono text-stat font-medium tabular-nums text-ink">90</div>
          <p className="mt-1 text-sec text-ink-3">days, raw signals</p>
          <p className="mt-4 max-w-[52ch] text-meta text-ink-2">
            Set by each student, not by the district. After the window closes, the second-by-second readings
            are deleted; only the derived summaries remain. There is no archive, and no backup that quietly
            keeps them.</p>
          <ul className="mt-5 divide-y divide-rule border-t border-rule">
            {FACTS.map(([k, v]) => (
              <li key={k} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
                <span className="text-meta text-ink-2">{k}</span>
                <span className="text-meta font-medium text-ink">{v}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel as="h3" label="The same log, most recent first">
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
            <span className="text-sec text-ink-3">Exports are disabled in this demo. In the product every
              export writes its own row above.</span>
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
      <div className="relative overflow-hidden border-b border-rule bg-sage">
        {/* decoration: it carries no information a reader needs */}
        <KineticGrid aria-hidden className="absolute inset-0" globalColor="monochrome"/>
        <div className="wrap relative py-6 sm:py-8">
          <Back go={go} to="site" label="Overview"/>
          <h1 className="font-display font-bold text-[clamp(1.875rem,3.4vw,2.75rem)] leading-[1.05] tracking-tight text-ink">
            For school counselors and psychologists</h1>
          <p className="mt-3 max-w-[60ch] text-sec text-ink-2">
            Only students who consented appear, and each one only to the extent their guardian agreed.
            Groups under five return nothing.</p>
          <p className="mt-4 inline-flex max-w-[60ch] items-baseline gap-2 border-l-2 border-warn bg-paper/70
            py-2 pl-3 pr-4 text-meta text-ink-2">
            <b className="font-mono text-label font-medium uppercase tracking-[0.12em] text-warn">Demo</b>
            Every name, score and timestamp on this screen is generated by the scoring model. No student
            was measured to build it.</p>
        </div>
      </div>
      <div className="wrap py-9 sm:py-12">
      <p aria-live="polite" className="sr-only text-sec">{said}</p>
      <Tabs.Root value={tab} onValueChange={onTab}>
        <Tabs.List aria-label="Monitoring views"
          className="flex flex-wrap gap-x-1 gap-y-1 overflow-x-auto border-b border-ink pb-px">
          {TABS.map(([v, label]) => (
            <Tabs.Trigger key={v} value={v}
              className="min-h-[48px] whitespace-nowrap px-4 font-display text-meta font-medium text-ink-2
                transition-colors duration-150 hover:text-ink data-[state=active]:border-b-2
                data-[state=active]:border-accent data-[state=active]:text-ink">
              {label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {TABS.map(([v]) => {
          const Pane = PANES[v]
          return <Tabs.Content key={v} value={v} className="pt-9 focus-visible:outline-none"><Pane/></Tabs.Content>
        })}
      </Tabs.Root>
      </div>
    </main>
  )
}
