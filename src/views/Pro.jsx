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
  K_ANONYMITY, TIER_LABEL, TIER_ORDER, triage, COHORT_PERIOD, COHORT_WEEKDAY,
  CONSENT_LEDGER, AUDIT_LOG, PROTOCOL, PROTOCOL_TIMES, REFERRALS,
  DRIVERS, INTERVENTIONS, efficacyLabel, PROFILE_45,
} from '../lib/caseload'
import KineticGrid from '../s21/texture'
import { cn } from '../lib/utils'

const TABS = [
  ['triage','Triage'], ['student','One student'], ['cohort','Year groups'],
  ['escalation','Escalation'], ['consent','Consent'],
]
const Sub = ({ children }) => <p className="max-w-[68ch] text-sec text-ink-2">{children}</p>
const Note = ({ children }) => <p className="mt-5 max-w-[70ch] border-t border-rule pt-4 text-meta text-ink-3">{children}</p>

/* ── Triage ─────────────────────────────────────────────────────────────── */
function Triage() {
  const students = triage()
  const worst = [...students].sort((a, b) => b.current - a.current)[0]
  const mid = students.find(s => s.tier === 'moderate' && s.velocity > 8) || students[0]
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <Sub>Ordered by how fast each student is deteriorating, not by who is worst today.
          Only students who consented appear here.</Sub>
        <span className="font-mono text-label uppercase tracking-[0.12em] text-ink-3">
          {students.length} consented · 0 hidden by consent</span>
      </div>
      <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {TIER_ORDER.map((tier, ti) => {
          const col = students.filter(s => s.tier === tier)
          return (
            <RevealRow key={tier} index={ti} className="border-t border-ink pt-3">
              <div className="flex items-baseline justify-between">
                <StatusPill status={TIER_LABEL[tier]}/>
                <span className="font-mono text-meta tabular-nums text-ink-3">{col.length}</span>
              </div>
              <ul className="mt-3 space-y-2.5">
                {col.length === 0 && <li className="py-3 text-sec text-ink-3">Nobody in this tier right now.</li>}
                {col.map(s => (
                  <li key={s.id} className="border-t border-rule pt-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-meta text-ink">{s.name}</span>
                      <span className="font-mono text-label tabular-nums text-ink-3">G{s.grade}</span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className={cn('font-mono text-[1.5rem] font-medium tabular-nums',
                        s.tier === 'crisis' ? 'text-crit' : s.tier === 'high' ? 'text-warn' : 'text-ink')}>
                        {s.current}</span>
                      <span className={cn('font-mono text-meta tabular-nums',
                        s.velocity > 0 ? 'text-warn' : s.velocity < 0 ? 'text-calm' : 'text-ink-3')}>
                        {s.velocity > 0 ? '▲ +' : s.velocity < 0 ? '▼ −' : '– '}{Math.abs(s.velocity) || ''}
                      </span>
                      <span className="font-mono text-label text-ink-3">/wk</span>
                    </div>
                    <Progress className="mt-2 h-1" value={Math.min(100, Math.abs(s.velocity) * 5)}
                      label={`velocity ${s.velocity} points per week`}/>
                    <p className="mt-2 text-sec text-ink-2">
                      {s.velocity > 0 ? `Up ${s.velocity} points in a week, from ${s.weekAgo}.`
                        : s.velocity < 0 ? `Improving — down ${Math.abs(s.velocity)} from ${s.weekAgo}.`
                        : 'Flat week over week.'}
                    </p>
                  </li>
                ))}
              </ul>
            </RevealRow>
          )
        })}
      </div>
      <Panel className="mt-10" label="Why this order">
        <p className="max-w-[80ch] text-sec text-ink-2">
          {worst.name} has the highest absolute score on this board, and you already know about {worst.name}.
          {' '}{mid.name} is {mid.velocity} points worse than a week ago and is still sitting in a lower tier —
          they are the one this ordering is for. Sorting by severity would have buried them under the students
          you are already seeing.
        </p>
        <Note>Velocity is the change in the seven-day mean stress index, per week.</Note>
      </Panel>
    </>
  )
}

/* ── One student ────────────────────────────────────────────────────────── */
function OneStudent() {
  const s = triage().find(x => x.name === 'Student 8241')
  const [note, setNote] = React.useState('')
  const lo = Math.min(...PROFILE_45.map(p => p.v)), hi = Math.max(...PROFILE_45.map(p => p.v))
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h2 className="font-display text-[1.5rem] font-bold tracking-tight text-ink">{s.name}</h2>
          <p className="mt-1 font-mono text-label uppercase tracking-[0.12em] text-ink-3">
            Grade {s.grade} · consented Aug 22, 2025 · {TIER_LABEL[s.tier]}</p>
        </div>
        <Button variant="outline" size="sm">Open referral</Button>
      </div>

      <div className="mt-7 grid gap-8 lg:grid-cols-3">
        <Panel label="What changed this week">
          <div className="font-mono text-[2rem] font-medium tabular-nums text-warn">+{s.velocity}</div>
          <p className="mt-1 text-sec text-ink-3">vs the week before</p>
          <ul className="mt-4 space-y-2.5 border-t border-rule pt-4 text-meta text-ink-2">
            <li>Mean index moved from {s.weekAgo} to {s.current}.</li>
            <li>Deterioration velocity +{s.velocity}/week — currently 2nd fastest on the board.</li>
            <li>Still anchored on AP Chemistry.</li>
          </ul>
        </Panel>

        <Panel label="Why — ranked">
          <ul className="space-y-3.5">
            {DRIVERS.map(d => (
              <li key={d.label}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-meta text-ink-2">{d.label}</span>
                  <span className="font-mono text-label tabular-nums text-ink-3">{d.contribution.toFixed(2)}</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-sage">
                  <div className="h-full rounded-full bg-warn" style={{ width: (d.contribution / 0.31) * 100 + '%' }}/>
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
        <Panel label="Longitudinal — 45 days">
          <svg viewBox="0 0 720 200" className="block w-full overflow-visible" role="img"
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
              d={PROFILE_45.map((p, i) => (i ? 'L' : 'M') + (40 + (i / 44) * 670).toFixed(1) + ' ' +
                (180 - ((p.v - lo) / (hi - lo)) * 160).toFixed(1)).join(' ')}/>
            <path fill="none" strokeWidth="2.5" strokeLinejoin="round" className="stroke-warn"
              vectorEffect="non-scaling-stroke"
              d={PROFILE_45.slice(31).map((p, i) => (i ? 'L' : 'M') + (40 + ((i + 31) / 44) * 670).toFixed(1) + ' ' +
                (180 - ((p.v - lo) / (hi - lo)) * 160).toFixed(1)).join(' ')}/>
            <text x="40" y="197" className="fill-ink-3 font-mono text-[16px]">45 days ago</text>
            <text x="710" y="197" textAnchor="end" className="fill-ink-3 font-mono text-[16px]">today</text>
          </svg>
          <Note>The amber stretch is the last fortnight, the run that put them on this board.</Note>
        </Panel>

        <Panel label="Counselor notes">
          <label htmlFor="cnote" className="sr-only">Counselor note for {s.name}</label>
          <textarea id="cnote" rows={5} value={note} onChange={e => setNote(e.target.value)}
            placeholder="Met with Student 8241 after 3rd period. They brought up the Kinetics lab unprompted."
            className="w-full resize-none rounded-xs border border-rule bg-paper p-3.5 text-meta text-ink
              placeholder:text-ink-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"/>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-sec text-ink-3">Written to the audit log</span>
            <Button size="sm">Save note</Button>
          </div>
        </Panel>
      </div>
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
      <div className="grid gap-x-12 gap-y-10 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="lab font-normal">School-wide pattern</h2>
          <RuleDraw className="mt-2.5"/>
          <Reveal className="mt-6">
            <h3 className="font-display text-[1.375rem] font-bold tracking-tight text-ink">
              {top.label} shows a school-wide stress spike.</h3>
            <p className="mt-2 max-w-[70ch] text-sec text-ink-2">
              Mean index {top.mean} against a school average of {avg} —
              {' '}{Math.round(((top.mean - avg) / avg) * 100)}% higher, across {top.n} consented students.
              This is not one struggling student. It is a timetable problem.</p>
          </Reveal>
          <Reveal delay={0.08} className="mt-6 border-t border-rule pt-6">
            <h3 className="font-display text-[1.375rem] font-bold tracking-tight text-ink">
              {hardest.full} is the hardest day of the week, school-wide.</h3>
            <p className="mt-2 max-w-[70ch] text-sec text-ink-2">
              Mean index {hardest.mean} against {wAvg} on an average day. Exam weeks in junior year run
              about 2.4× the non-exam baseline.</p>
          </Reveal>
          <Note>Aggregated across consented students only, and computed from the same windows the
            individual scores use. Nothing here is a projection.</Note>
        </section>

        <Panel as="h3" label="Privacy floor">
          <div className="font-mono text-[2.125rem] font-medium tabular-nums text-ink">{K_ANONYMITY}</div>
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
  const [done, setDone] = React.useState([0, 1, 2])
  const toggle = i => setDone(d => d.includes(i) ? d.filter(x => x !== i) : [...d, i])
  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <section className="border-t-2 border-crit/40 pt-4">
          <h2 className="lab font-normal text-crit">Crisis queue</h2>
          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="font-display text-[1.25rem] font-bold tracking-tight text-ink">Student 8241</h3>
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
            <Button size="sm">Close with outcome</Button>
            <span className="font-mono text-sec tabular-nums text-ink-3">
              {done.length} of {PROTOCOL.length} steps complete</span>
          </div>
        </section>

        <Panel label="Referrals">
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
            <Button variant="outline" size="sm">New referral</Button>
          </div>
        </Panel>
      </div>

      <Panel className="mt-10" label="Audit log" action="Append-only · cannot be edited or deleted">
        <Table>
          <THead><TR>{['When','Actor','Action','Subject'].map(h => <TH key={h}>{h}</TH>)}</TR></THead>
          <TBody>
            {AUDIT_LOG.map(r => (
              <TR key={r.at + r.action}>
                <TD num className="w-40">{r.at}</TD>
                <TD className="w-52">{r.actor}</TD>
                <TD>{r.action}</TD>
                <TD className="w-48">{r.subject}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <Note>Note the last row: Student 8241 revoked a sharing permission on Monday, and that revocation
          is logged exactly like any staff action. The log records what the school did, and what the student
          did about it.</Note>
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
      <Panel label="Consent ledger" action={`${CONSENT_LEDGER.length} active · FERPA / COPPA`}>
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
        <Note>Consent is scoped, not blanket. A guardian consenting to crisis alerts has not consented to
          trends, and the system will not show them trends.</Note>
      </Panel>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Panel label="Data retention">
          <div className="font-mono text-[2.125rem] font-medium tabular-nums text-ink">90</div>
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

        <Panel label="Access audit trail">
          <ul className="divide-y divide-rule">
            {AUDIT_LOG.slice(0, 6).map(r => (
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
            <Button variant="outline" size="sm">Export audit log (CSV)</Button>
            <Button variant="outline" size="sm">Export consent ledger</Button>
            <span className="text-sec text-ink-3">Every export is itself logged.</span>
          </div>
        </Panel>
      </div>
    </>
  )
}

const PANES = { triage:Triage, student:OneStudent, cohort:Cohort, escalation:Escalation, consent:Consent }

export function Pro({ go }) {
  return (
    <main>
      <div className="relative overflow-hidden border-b border-rule bg-sage">
        <KineticGrid className="absolute inset-0" globalColor="monochrome"/>
        <div className="wrap relative py-9 sm:py-12">
          <Back go={go} to="site" label="Overview"/>
          <h1 className="font-display font-bold text-[clamp(1.875rem,3.4vw,2.75rem)] leading-[1.05] tracking-tight text-ink">
            For school counselors and psychologists</h1>
          <p className="mt-3 max-w-[60ch] text-sec text-ink-2">
            Only students who consented appear. Groups under five return nothing.</p>
        </div>
      </div>
      <div className="wrap py-9 sm:py-12">
      <Tabs.Root defaultValue="triage">
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
