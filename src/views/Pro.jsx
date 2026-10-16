import React from 'react'
import { Panel, PanelHead, SeeDetails, Stat, TONES, Why } from './Monitor'
import { Button } from '../ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { Badge } from '../ui/badge'
import { DemoNotice, RealNotice } from '../ui/notice'
import { useMode } from '../lib/mode'
import { ArrowRight, Chevron, Plus } from '../ui/marks'
import { List, Item } from '../ui/list'
import {
  K_ANONYMITY, TIER_LABEL, triage, scoreOnly, alertsOnly, roster,
  SCHOOL_N, COHORT_PERIOD, COHORT_WEEKDAY, AUDIT_LOG, PROTOCOL, PROTOCOL_TIMES,
  PROTOCOL_DONE, REFERRALS, driversFor, INTERVENTIONS, profile45,
} from '../lib/caseload'
import { RETENTION, getSharing, getVersion, subscribe } from '../app/store'
import { useAccount } from '../account/store'
import { CASELOAD_TITLE, CONSENT_SHORT, SCORE, PRO } from '../lib/terms'
import { cn } from '../lib/utils'

/* THE MEDICAL PROFESSIONAL CONSOLE.
 *
 * 1. PLAIN WORDS. No caseload, cohort, triage, escalation, k-anonymity,
 *    consent scope, audit log, retention or intervention in the copy. The
 *    reader is a counsellor between two appointments.
 *
 * 2. A SEQUENCE, NOT A WALL. Five steps in working order: the whole school,
 *    who to check in with, one student, urgent alerts, what each guardian
 *    agreed. One lead card, one block and one disclosure per step, and a Next
 *    control at the foot.
 *
 * 3. MINDMAP AI IS AN ACTION, not a panel: one control, routed to `ai`.
 *    This console never answers anything itself.
 *
 * 4. FOUR SAFEGUARDS, in RULES below, behind a "?" beside the heading and
 *    enforced on every step. Simplify the language, never the safeguard.
 *
 * COLOUR. Grounds are card, accent-wash and aqua through Monitor's TONES.
 * warn means a figure above a student's own normal and crit means an urgent
 * alert; both are stated in words beside the figure. Nothing here puts warn
 * on aqua-2, which fails AA.
 */

/* Where the professional works, from their account (src/account/store.js
   `setting`). The words on the first step and the console heading change;
   the k-floor and the consent rules do not. Signed out, the demo is a
   school. */
export const SETTING_WORDS = {
  school: {
    step: 'The whole school',
    head: 'Manage stress across the school',
    lead: 'The whole school',
    across: 'across the school',
  },
  practice: {
    step: 'The whole practice',
    head: 'Manage stress across the practice',
    lead: 'The whole practice',
    across: 'across the practice',
  },
  other: {
    step: 'Everyone you follow',
    head: 'Manage stress for everyone you follow',
    lead: 'Everyone you follow',
    across: 'across everyone you follow',
  },
}
const wordsFor = me => SETTING_WORDS[(me && me.role === 'pro' && me.setting) || 'school']
/* The line under "Start here" for a Medical Professional names the setting
   they chose at sign-up: the console's own `head` words, one source. A
   student or a parent gets null. */
export const settingLineFor = me =>
  me && me.role === 'pro' && SETTING_WORDS[me.setting] ? SETTING_WORDS[me.setting].head + '.' : null

/* The five steps, in working order. */
const stepsFor = words => [
  ['school',  words.step],
  ['list',    'Students to check on'],
  ['student', 'Student record'],
  ['urgent',  'Urgent alerts'],
  ['agreed',  'Parental Consent'],
]
const nextOf = (steps, id) => {
  const i = steps.findIndex(s => s[0] === id)
  return i >= 0 && i < steps.length - 1 ? steps[i + 1] : null
}

/* The four safeguards. Nothing on this console can switch any of them off.
   Do not shorten these four lines away. */
const RULES = [
  'You see only what a student agreed to share.',
  'A group under five shows nothing.',
  'Every record you open is logged.',
  'Nothing here is a diagnosis.',
]

const ROW = 'mt-3 grid items-start gap-3 lg:mt-4 lg:gap-4'
const TICKS = [25, 50, 75]
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight']
const word = n => WORDS[n] ?? String(n)
const cap = t => t.charAt(0).toUpperCase() + t.slice(1)

/* What a guardian agreed to share, from the same three flags the lists read,
   in words instead of a scope string. */
const agreed = s =>
  !s.showScore ? 'Urgent alerts only'
  : !s.showTrend ? `${SCORE} only`
  : s.showRaw ? `${SCORE}, weekly change and raw readings`
  : `${SCORE} and weekly change`

/* The lead of a step: one plain sentence, one figure under it and smaller. */
function Lead({ title, meta, sentence, label, figure, unit, sub, tone = 'text-ink', children }) {
  return (
    <Panel tone="brand">
      <PanelHead title={title} meta={meta}/>
      <div className="mt-3 grid items-start gap-3.5 [&>*]:min-w-0
        lg:grid-cols-[minmax(0,1fr)_minmax(0,17rem)] lg:gap-5">
        <div>
          <p className="max-w-[26ch] font-display text-row font-bold leading-[1.16] text-ink
            sm:text-head">{sentence}</p>
          {children}
        </div>
        <div className={cn('rounded-field border p-3.5', TONES.card)}>
          <p className="tick">{label}</p>
          <p className={cn('mt-1 flex flex-wrap items-baseline gap-x-1.5 font-display text-head',
            'font-medium tabular-nums leading-none', tone)}>
            {figure}
            {unit && <span className="font-body text-fine font-normal text-ink-3">{unit}</span>}
          </p>
          {sub && <p className="mt-1.5 max-w-[26ch] text-fine text-ink-2">{sub}</p>}
        </div>
      </div>
    </Panel>
  )
}

/* A caption under a figure. One line, and it never restates the figure. */
const Note = ({ children }) =>
  <p className="mt-3 max-w-[66ch] border-t border-rule pt-2.5 text-fine text-ink-3">{children}</p>

/* A key and a figure on one rule. */
function KV({ k, v, tone = 'text-ink' }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-rule py-2 last:border-b-0">
      <dt className="text-fine text-ink-2">{k}</dt>
      <dd className={cn('m-0 shrink-0 font-display text-ui font-medium tabular-nums', tone)}>{v}</dd>
    </div>
  )
}

/* A labelled bar off a shared scale. The count is printed, so the width and
   the colour never carry anything on their own. */
function BarRow({ label, figure, pct, tone, aria }) {
  return (
    <li className="border-b border-rule py-2 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 text-fine text-ink-2">{label}</span>
        <span className="shrink-0 text-fine tabular-nums text-ink">{figure}</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-xs bg-aqua-2" role="img"
        aria-label={aria || `${label}, ${figure}`}>
        <div className={cn('h-full rounded-xs', tone)}
          style={{ width: Math.max(2, Math.round(pct)) + '%' }}/>
      </div>
    </li>
  )
}

/* src/lib/caseload.js writes "Crisis alert" into the record; this console
   says urgent alert everywhere, so one name for one thing. A referral's
   target keeps only its first clause. */
const plain = t => t.replace(/crisis alert/gi, m => (m[0] === 'C' ? 'Urgent alert' : 'urgent alert'))
const shortRef = t => t.split(':')[0]

/* Demo figure for the settle row: days the body took longer than usual to
   settle. A count of days and nothing finer. */
const SETTLE_DAYS = 2

const BlankRow = ({ children }) => (
  <li className="flex items-center gap-3 py-3">
    <span aria-hidden className="w-8 shrink-0 border-t border-dashed border-ruling"/>
    <span className="text-fine text-ink-3">{children}</span>
  </li>
)

/* ── Step 1. The whole school ───────────────────────────────────────────── */

/* The hatch that marks a group too small to show. Its own pattern id: the
   chart below defines `hatch` inside its own svg and two elements with the
   same id in one document collide. */
const HatchKey = ({ className }) => (
  <svg className={cn('h-2 w-full', className)} preserveAspectRatio="none" role="img"
    aria-label="Hidden, fewer than five students">
    <defs>
      <pattern id="hatch-key" width="8" height="8" patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="8" className="stroke-ruling" strokeWidth="4"/>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#hatch-key)"/>
  </svg>
)

function Weekday({ wAvg }) {
  const hardest = [...COHORT_WEEKDAY].sort((a, b) => b.mean - a.mean)[0]
  const lightest = [...COHORT_WEEKDAY].sort((a, b) => a.mean - b.mean)[0]
  return (
    <Panel>
      <PanelHead as="h3" title={`${SCORE} by weekday`} meta="out of 100"/>
      <div className="mt-3 grid gap-3 [&>*]:min-w-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,15rem)]
        lg:gap-5">
      <div>
      <div className="flex gap-2.5" role="img"
        aria-label={`Mean ${SCORE} by day of the week, out of 100: `
          + COHORT_WEEKDAY.map(d => `${d.full} ${d.mean}`).join(', ')
          + `. An average day is ${wAvg}.`}>
        <div aria-hidden className="flex h-[118px] w-7 shrink-0 flex-col justify-between
          text-right text-fine tabular-nums text-ink-3">
          <span>100</span><span>50</span><span>0</span>
        </div>
        <div aria-hidden className="relative h-[118px] flex-1">
          {[0, 50, 100].map(v => (
            <span key={v} className="absolute inset-x-0 h-px bg-rule"
              style={{ bottom: (v / 100) * 118 + 'px' }}/>
          ))}
          <span className="absolute inset-x-0 h-0.5 bg-ink"
            style={{ bottom: (wAvg / 100) * 118 + 'px' }}/>
          <div className="absolute inset-0 flex items-end justify-between gap-2.5">
            {COHORT_WEEKDAY.map(d => (
              <span key={d.key} className="flex h-full flex-1 items-end">
                <span className={cn('w-full rounded-t-xs', d.mean >= 60 ? 'bg-warn' : 'bg-accent')}
                  style={{ height: (d.mean / 100) * 118 + 'px' }}/>
              </span>
            ))}
          </div>
        </div>
      </div>
      <div aria-hidden className="mt-1.5 flex gap-2.5 pl-9">
        {COHORT_WEEKDAY.map(d => (
          <span key={d.key} className="flex-1 text-center">
            <span className="block text-fine tabular-nums text-ink">{d.mean}</span>
            <span className="block text-fine text-ink-3">{d.label}</span>
          </span>
        ))}
      </div>
      </div>
      <dl className="m-0 p-0">
        <KV k="Hardest day" v={`${hardest.full}, ${hardest.mean}`}/>
        <KV k="Lightest day" v={`${lightest.full}, ${lightest.mean}`}/>
        <KV k="Average day" v={String(wAvg)}/>
      </dl>
      </div>
    </Panel>
  )
}

function School({ words }) {
  const all = roster()
  const visible = COHORT_PERIOD.filter(p => !p.suppressed)
  const avg = Math.round(visible.reduce((a, b) => a + b.mean, 0) / visible.length)
  const top = [...visible].sort((a, b) => b.mean - a.mean)[0]
  const hidden = COHORT_PERIOD.length - visible.length
  const wAvg = Math.round(COHORT_WEEKDAY.reduce((a, b) => a + b.mean, 0) / COHORT_WEEKDAY.length)
  return (
    <>
      <Lead title={words.lead} meta={`${SCHOOL_N} consented students`}
        sentence={`${top.label.replace(' · ', ', ')} reads highest ${words.across}.`}
        label="Highest class period" figure={top.mean} unit="out of 100" tone="text-warn"
        sub={`An average period reads ${avg}.`}/>

      <div className={ROW}>
        <Panel>
          <PanelHead as="h3" title={`${SCORE} by class period`} meta="out of 100"/>
          <ul className="m-0 mt-3 list-none space-y-3 p-0">
            {COHORT_PERIOD.map(p => (
              <li key={p.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 text-fine text-ink-2">{p.label}</span>
                  {/* A hidden group prints no size either: a count beside a
                      class period publishes the size of the very group the
                      rule exists to protect. */}
                  <span className="shrink-0 text-fine tabular-nums text-ink-3">
                    {p.suppressed ? 'hidden' : `${p.mean} · ${p.n} students`}</span>
                </div>
                <div className="relative mt-1.5 h-2.5 w-full overflow-hidden rounded-xs bg-aqua-2">
                  {p.suppressed ? (
                    <svg className="h-full w-full" preserveAspectRatio="none" role="img"
                      aria-label="Hidden, fewer than five students">
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
          <div aria-hidden className="mt-2 flex justify-between border-t border-rule pt-1.5
            text-fine tabular-nums text-ink-3">
            {[0, ...TICKS, 100].map(t => <span key={t}>{t}</span>)}
          </div>
          <Note>The dark line marks the average period.</Note>
          {hidden > 0 && (
            <div className="mt-2.5 flex items-center gap-2.5">
              <HatchKey className="w-16 shrink-0"/>
              <p className="text-fine text-ink-2">A hatched bar has fewer than {K_ANONYMITY} students.</p>
            </div>
          )}
        </Panel>
      </div>

      <div className={ROW}>
        <SeeDetails label="See each weekday">
          <Weekday wAvg={wAvg}/>
        </SeeDetails>
      </div>
    </>
  )
}

/* ── Step 2. Who to check in with ───────────────────────────────────────── */

/* Three lines. The safeguards are in RULES above. */
const ORDER_RULES = [
  'A big change comes before a high score.',
  `A band shows where the ${SCORE} sits today.`,
  'No raw reading, journal or location is listed.',
]

/* The figure columns, named once on the rule the list hangs from. */
const ListHead = () => (
  <div aria-hidden className="mt-3 flex items-center gap-3 border-b border-ink pb-2">
    <span className="tick min-w-0 flex-1">student</span>
    <span className="hidden w-14 shrink-0 sm:block"/>
    <span className="tick w-10 shrink-0 text-right">change</span>
    <span className="w-4 shrink-0"/>
  </div>
)

function Row({ s, onOpen, max }) {
  const dir = s.velocity > 0 ? 'worse' : s.velocity < 0 ? 'better' : 'flat'
  const move = `${s.velocity > 0 ? '+' : s.velocity < 0 ? '−' : ''}${Math.abs(s.velocity)}`
  const half = Math.round((Math.abs(s.velocity) / (max || 1)) * 50)
  return (
    <li className="border-b border-rule">
      {/* One label on the button: read out separately the marks inside are a
          name, a punctuated fragment, a bare numeral and a glyph. */}
      <button type="button" onClick={() => onOpen(s.name)}
        aria-label={`${s.name}, grade ${s.grade}, ${TIER_LABEL[s.tier]}, ${SCORE} ${s.current} out of 100, `
          + `${dir === 'worse' ? `up ${Math.abs(s.velocity)} points` : dir === 'better'
            ? `down ${Math.abs(s.velocity)} points` : 'level'} this week. Open record.`}
        className="flex min-h-[52px] w-full items-center gap-3 py-2.5 text-left
          transition-colors duration-150 hoverOnly:bg-aqua">
        <span aria-hidden className="min-w-0 flex-1">
          <span className="block truncate text-meta text-ink">{s.name}</span>
          <span className="block text-fine text-ink-3">
            Grade {s.grade} · {TIER_LABEL[s.tier]} · {s.weekAgo} to {s.current}</span>
        </span>
        {/* Zero sits at the middle of the track, so up and down read off one
            scale and a level week is visibly nothing. */}
        <span aria-hidden className="relative hidden h-2 w-14 shrink-0 overflow-hidden rounded-xs
          bg-aqua-2 sm:block">
          <span aria-hidden className="absolute inset-y-0 left-1/2 w-px bg-ruling"/>
          <span aria-hidden className={cn('absolute inset-y-0', dir === 'worse'
            ? 'left-1/2 bg-warn' : dir === 'better' ? 'right-1/2 bg-accent' : 'left-1/2 bg-transparent')}
            style={{ width: half + '%' }}/>
        </span>
        <span aria-hidden className={cn('w-10 shrink-0 text-right font-display text-row',
          'font-medium leading-none tabular-nums',
          dir === 'worse' ? 'text-warn' : dir === 'better' ? 'text-accent' : 'text-ink-3')}>{move}</span>
        <Chevron aria-hidden className="size-4 shrink-0 text-ink-3"/>
      </button>
    </li>
  )
}

/* The students a guardian signed a narrower agreement for. They are not
   ordered: ordering them would leak the very thing that was withheld. */
function SharedWithLess({ onOpen }) {
  const scored = scoreOnly(), quiet = alertsOnly()
  return (
    <ul className="m-0 mt-3 list-none p-0">
      {scored.map(s => (
        <li key={s.id} className="border-b border-rule">
          <button type="button" onClick={() => onOpen(s.name)}
            aria-label={`${s.name}, grade ${s.grade}, ${SCORE} ${s.current} out of 100, no weekly change shared. Open record.`}
            className="flex min-h-[52px] w-full items-center gap-3 py-2.5 text-left
              transition-colors duration-150 hoverOnly:bg-aqua">
            <span aria-hidden className="min-w-0 flex-1">
              <span className="block truncate text-meta text-ink">{s.name}</span>
              <span className="block text-fine text-ink-3">
                Grade {s.grade} · {SCORE} only, no weekly change</span>
            </span>
            <span aria-hidden className="shrink-0 font-display text-row font-medium leading-none
              tabular-nums text-ink">{s.current}</span>
            <Chevron aria-hidden className="size-4 shrink-0 text-ink-3"/>
          </button>
        </li>
      ))}
      {quiet.map(s => (
        <li key={s.id} className="flex items-center justify-between gap-3 border-b border-rule py-3">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-meta text-ink">{s.name}</span>
            <span className="block text-fine text-ink-3">Grade {s.grade} · urgent alerts only</span>
          </span>
          <span className="shrink-0 font-display text-ui font-medium text-ink-3">nothing shared</span>
        </li>
      ))}
    </ul>
  )
}

/* One plain sentence about the week. A higher Mind Score is a body working
   harder than that student's own normal: not anxiety, not distress, not a
   diagnosis, and no sentence here may say so. */
const weekLine = rising =>
  !rising ? 'Nobody you follow reads higher than last week.'
  : rising === 1 ? 'One student reads above their own normal this week.'
  : `${cap(word(rising))} students read above their own normal this week.`

function CheckIn({ onOpen, onStep }) {
  const all = roster()
  const moved = triage()
  const rising = moved.filter(s => s.velocity > 0)
  const max = Math.max(...moved.map(s => Math.abs(s.velocity)), 1)
  const lead = moved[0]
  const open = PROTOCOL.length - PROTOCOL_DONE.length
  return (
    <>
      <Lead title={CASELOAD_TITLE} meta={`${moved.length} of ${all.length} students`}
        sentence={weekLine(rising.length)}
        label="Biggest change this week" tone={lead.velocity > 0 ? 'text-warn' : 'text-ink'}
        figure={`${lead.velocity > 0 ? '+' : ''}${lead.velocity}`} unit="points"
        sub={`${lead.name}, ${lead.weekAgo} to ${lead.current}.`}>
        {open > 0 && (
          <button type="button" onClick={() => onStep('urgent')}
            className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-field border
              border-crit/40 bg-card px-3 text-left font-display text-ui font-medium text-crit
              transition-colors duration-150 hoverOnly:bg-aqua">
            One urgent alert is still open
            <ArrowRight aria-hidden className="size-4 shrink-0"/>
          </button>
        )}
      </Lead>

      <div className={cn(ROW, '[&>*]:min-w-0 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]')}>
        <Panel>
          <PanelHead as="h3" title="Students to open" meta="biggest change first"/>
          <ListHead/>
          <ol className="m-0 list-none p-0">
            {moved.map(s => <Row key={s.id} s={s} onOpen={onOpen} max={max}/>)}
          </ol>
        </Panel>
        <Panel>
          <PanelHead as="h3" title="Students who share less" meta="in no order"/>
          <SharedWithLess onOpen={onOpen}/>
        </Panel>
      </div>

      <div className={ROW}>
        <SeeDetails label="See how the order works">
          <Panel tone="aqua">
            <PanelHead as="h3" title="How the order works"/>
            <List className="mt-3 max-w-[56ch] text-fine text-ink-2">
              {ORDER_RULES.map(r => <Item key={r}>{r}</Item>)}
            </List>
          </Panel>
        </SeeDetails>
      </div>
    </>
  )
}

/* ── Step 3. One student ────────────────────────────────────────────────── */

/* The record's own first line: what this student's body did against their
   own normal, never what they felt. */
function recordLead(s, series) {
  if (!s.showScore) return `Only an urgent alert about ${s.name} reaches you.`
  if (!s.showTrend) return `${s.name} reads ${s.current} out of 100 today. No weekly change is shared.`
  const fortnight = s.current - series[31].v
  if (s.velocity > 0 && fortnight > 0)
    return `${s.name} has read above their normal for two weeks.`
  if (s.velocity > 0) return `${s.name} read higher this week than last.`
  if (s.velocity < 0) return `${s.name} read lower this week than last.`
  return `${s.name} is level with last week.`
}

function OneStudent({ who, setWho }) {
  const [note, setNote] = React.useState('')
  React.useSyncExternalStore(subscribe, getVersion, () => 0)
  const settle = getSharing().pro.settle === true
  const all = roster()
  const s = all.find(x => x.name === who) || all[0]
  /* Per student, not module constants. */
  const drivers = driversFor(s).slice(0, 3)
  const series = profile45(s)
  const lo = Math.min(...series.map(p => p.v)), hi = Math.max(...series.map(p => p.v))
  const yspan = hi - lo || 1
  /* Gridlines off this student's own window, never fixed lines. */
  const ticks = [10, 20, 30, 40, 50, 60, 70, 80, 90].filter(v => v > lo && v < hi)
  const refs = REFERRALS.filter(r => r.student === s.name)
  const tried = INTERVENTIONS.filter(i => i.sessions > 0)
  const span = Math.max(...INTERVENTIONS.map(i => Math.abs(i.hrvDeltaPct)), 1)
  return (
    <>
      <Panel tone="brand">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-row font-bold tracking-tight text-ink">{s.name}</h2>
            <p className="mt-0.5 text-fine text-ink-3">
              Grade {s.grade}{s.showScore ? ` · ${TIER_LABEL[s.tier]}` : ''}</p>
            <p className="mt-2 max-w-[30ch] font-display text-row font-bold leading-[1.16] text-ink
              sm:text-head">{recordLead(s, series)}</p>
          </div>
          <div className="min-w-0">
            <label htmlFor="pick" className="tick block">Open a different student</label>
            {/* The focus ring is written out: the global one in src/input.css
                sits inside :where() and any utility here would win. */}
            <select id="pick" value={s.name} onChange={e => setWho(e.target.value)}
              className="mt-1 min-h-[48px] max-w-full rounded-field border-0 border-b-2 border-ink
                bg-transparent px-1 font-body text-fine text-ink focus-visible:outline
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              {all.map(x => <option key={x.id} value={x.name}>
                {x.name}{x.showScore ? ` · ${x.current}` : ' · not shared'}</option>)}
            </select>
          </div>
        </div>
        {/* Three figures, each drawn only as far as the agreement reaches: a
            gap here is a guardian's decision, not missing data. The tier word
            is on the line under the name, so it is not under the figure too. */}
        <div className="mt-3.5 grid grid-cols-2 gap-3 border-t border-rule pt-3.5 lg:grid-cols-3 lg:gap-4">
          <Stat label={`${SCORE} today`} value={s.showScore ? s.current : 'not shared'}
            unit={s.showScore ? 'of 100' : null}/>
          <Stat label="Change this week"
            value={s.showTrend ? `${s.velocity > 0 ? '+' : ''}${s.velocity}` : 'not shared'}
            unit={s.showTrend ? 'points' : null}
            sub={s.showTrend ? `${s.weekAgo} to ${s.current}` : null}/>
          <Stat className="col-span-2 lg:col-span-1" label="Parent agreed to share" value={agreed(s)}
            sub={`Signed ${s.signedAt}, runs out ${s.expires}.`}/>
        </div>
        {/* Day-level settle count. The student's own switch in Sharing, off by
            default, so the row is absent rather than blank until it is shared. */}
        {settle && (
          <dl className="m-0 mt-3 border-t border-rule p-0 pt-1">
            <KV k="Slow to settle" v={`${SETTLE_DAYS} days this week`}/>
          </dl>
        )}
      </Panel>

      {!s.showScore && (
        <div className={ROW}>
          <Panel>
            <PanelHead as="h3" title="No readings shared"/>
            <List className="mt-3 max-w-[48ch] text-fine text-ink-2">
              <Item>The guardian agreed to urgent alerts and nothing else.</Item>
              <Item>You are told if a reading raises one.</Item>
            </List>
          </Panel>
        </div>
      )}

      {s.showScore && !s.showTrend && (
        <div className={ROW}>
          <Panel>
            <PanelHead as="h3" title={`${SCORE} today`} meta={`${s.current} out of 100`}/>
            <List className="mt-3 max-w-[48ch] text-fine text-ink-2">
              <Item>Weekly change, breakdown and 45-day line are not shared.</Item>
              <Item>Urgent alerts still reach you.</Item>
            </List>
          </Panel>
        </div>
      )}

      {s.showTrend && <>
      <div className={ROW}>
        <Panel>
          <PanelHead as="h3" title="The last 45 days" meta="one point a day"/>
          <svg viewBox="0 0 720 200" className="mt-3 block w-full overflow-visible" role="img"
            aria-label={`Daily ${SCORE} over 45 days, ending at ${s.current}.`}>
            {ticks.map(v => {
              const y = 170 - ((v - lo) / yspan) * 150
              return <g key={v}>
                <line x1="40" x2="710" y1={y} y2={y} className="stroke-rule" strokeWidth="1"/>
                <text x="30" y={y + 5} textAnchor="end" className="fill-ink-3 text-[15px]">{v}</text>
              </g>
            })}
            <path fill="none" strokeWidth="2" strokeLinejoin="round" className="stroke-ink-3"
              vectorEffect="non-scaling-stroke"
              d={series.map((q, i) => (i ? 'L' : 'M') + (40 + (i / 44) * 670).toFixed(1) + ' ' +
                (170 - ((q.v - lo) / yspan) * 150).toFixed(1)).join(' ')}/>
            <path fill="none" strokeWidth="2.5" strokeLinejoin="round" className="stroke-warn"
              vectorEffect="non-scaling-stroke"
              d={series.slice(31).map((q, i) => (i ? 'L' : 'M') + (40 + ((i + 31) / 44) * 670).toFixed(1) + ' ' +
                (170 - ((q.v - lo) / yspan) * 150).toFixed(1)).join(' ')}/>
            <text x="40" y="195" className="fill-ink-3 text-[15px]">45 days ago</text>
            <text x="710" y="195" textAnchor="end" className="fill-ink-3 text-[15px]">today</text>
          </svg>
          <dl className="m-0 mt-2.5 p-0">
            <KV k="Lowest and highest in 45 days" v={`${lo} to ${hi}`}/>
            <KV k="Last two weeks" v={`${series[31].v} to ${s.current}`}/>
          </dl>
          <Note>The coloured part is the last two weeks.</Note>
        </Panel>
      </div>

      <div className={ROW}>
        <SeeDetails label="See more about the student">
          {/* 7fr and 5fr: at 6 and 6 the right column ended well short. */}
          <div className="grid items-start gap-3 [&>*]:min-w-0 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-4">
            <div className="flex flex-col gap-3 lg:gap-4">
              <Panel tone="aqua">
                <PanelHead as="h3" title="What changed most" meta="share of this week"/>
                <ul className="m-0 mt-3 list-none p-0">
                  {drivers.map(d => (
                    <BarRow key={d.label} label={d.label}
                      figure={`${Math.round(d.share * 100)}%`}
                      pct={(d.share / drivers[0].share) * 100} tone="bg-accent"
                      aria={`${d.label}, ${Math.round(d.share * 100)} percent of this week's change`}/>
                  ))}
                </ul>
                <Note>Bars compare with this student&rsquo;s own normal, not raw readings.</Note>
              </Panel>
              <Panel>
                <PanelHead as="h3" title="What has been tried" meta="measured by the patch"/>
                <ul className="m-0 mt-3 list-none p-0">
                  {tried.map(i => (
                    <BarRow key={i.name}
                      label={`${i.name}, ${i.sessions} session${i.sessions === 1 ? '' : 's'}`}
                      figure={`${i.hrvDeltaPct > 0 ? '+' : ''}${i.hrvDeltaPct}%`}
                      pct={(Math.abs(i.hrvDeltaPct) / span) * 100}
                      tone={i.hrvDeltaPct > 0 ? 'bg-accent' : i.hrvDeltaPct < 0 ? 'bg-warn' : 'bg-ink-3'}
                      aria={`${i.name}, ${i.sessions} sessions, heartbeat steadiness `
                        + `${i.hrvDeltaPct > 0 ? 'up' : i.hrvDeltaPct < 0 ? 'down' : 'unchanged'} `
                        + `${Math.abs(i.hrvDeltaPct)} percent`}/>
                  ))}
                </ul>
                <Note>Each bar shows how much steadier the heartbeat was.</Note>
              </Panel>
            </div>
            <div className="flex flex-col gap-3 lg:gap-4">
              <Panel>
                <PanelHead as="h3" title="Referrals"/>
                <ul className="m-0 mt-2 list-none divide-y divide-rule p-0">
                  {refs.length === 0 && <BlankRow>No referral has been opened.</BlankRow>}
                  {refs.map(r => (
                    <li key={r.to + r.opened} className="py-2.5 first:pt-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="min-w-0 text-fine text-ink">{shortRef(r.to)}</span>
                        <Badge variant="state">{r.status}</Badge>
                      </div>
                      <p className="mt-0.5 text-fine text-ink-3">Opened {r.opened}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 border-t border-rule pt-3">
                  <Button variant="outline" size="sm" disabled>New referral</Button>
                </div>
              </Panel>
              <Panel tone="aqua">
                <PanelHead as="h3" title="Your notes"/>
                <label htmlFor="cnote" className="sr-only">{PRO} note for {s.name}</label>
                <textarea id="cnote" rows={3} value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Add a note…"
                  className="mt-3 w-full resize-none rounded-field border-0 border-b-2 border-rule
                    bg-card p-3 text-fine text-ink placeholder:text-ink-3
                    focus-visible:border-ink focus-visible:outline focus-visible:outline-2
                    focus-visible:outline-offset-2 focus-visible:outline-accent"/>
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <span className="text-fine text-ink-3">Every saved note is logged</span>
                  <Button size="sm" disabled={!note.trim()}>Save note</Button>
                </div>
              </Panel>
            </div>
          </div>
        </SeeDetails>
      </div>
      </>}
    </>
  )
}

/* ── Step 4. Urgent alerts ──────────────────────────────────────────────── */

function Urgent({ real }) {
  const [done, setDone] = React.useState(PROTOCOL_DONE)
  const [what, setWhat] = React.useState('')
  const [closed, setClosed] = React.useState(false)
  const toggle = i => setDone(d => d.includes(i) ? d.filter(x => x !== i) : [...d, i])
  /* The steps are the practice's own document and stay on screen in real
     mode, unticked and untouchable. */
  const ticked = real ? [] : done
  const referrals = real ? [] : REFERRALS
  /* Today's lines only: what the reader has to see is that opening anything
     writes one. */
  const log = real ? [] : AUDIT_LOG.filter(r => r.rel === 'Today')
  return (
    <>
      {/* Red, on purpose: the one alarm on the console. The owner allows red
          in the alert and emergency sections. */}
      <Panel className={cn('border-l-4 border-l-crit', real ? 'border-rule bg-card' : 'border-crit/40 bg-[#fbeae6]')}>
        <PanelHead title="Urgent alerts"
          meta={real ? 'nothing open' : PROTOCOL_TIMES[0]}/>
        <p className={cn('mt-3 max-w-[30ch] font-display text-row font-bold leading-[1.16] sm:text-head',
          real ? 'text-ink' : 'text-[#7a2314]')}>
          {real ? 'No alert has been raised.'
                : 'An alert was raised for Student 8241 during AP Chemistry.'}</p>
        {real && <p className="mt-2 max-w-[52ch] text-fine text-ink-2">Only a paired patch can
          raise one.</p>}
        <div className="mt-3.5 border-t border-rule pt-3">
          <h3 className="tick">Steps taken</h3>
          <ul className="m-0 mt-1.5 list-none p-0">
            {PROTOCOL.map((step, i) => (
              <li key={step}>
                <label className={cn('flex min-h-[44px] items-center gap-2.5',
                  real ? 'cursor-default' : 'cursor-pointer')}>
                  <input type="checkbox" checked={ticked.includes(i)} disabled={real}
                    onChange={() => toggle(i)} className="size-4 accent-accent"/>
                  <span className={cn('text-fine', ticked.includes(i)
                    ? 'text-ink-3 line-through decoration-rule' : 'text-ink')}>{step}</span>
                  <span className="ml-auto shrink-0 whitespace-nowrap text-fine tabular-nums
                    text-ink-3">{ticked.includes(i) ? PROTOCOL_TIMES[i] : ''}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
        {/* Finishing is one field and one control, no dialog. */}
        <div className="mt-3.5 border-t border-rule pt-3">
          <label htmlFor="outcome" className="tick block">What happened</label>
          <textarea id="outcome" rows={2} value={what} onChange={e => setWhat(e.target.value)}
            disabled={real || closed} placeholder="One line, kept with this alert…"
            className="mt-1.5 w-full resize-none rounded-field border-0 border-b-2 border-rule
              bg-card p-3 text-fine text-ink placeholder:text-ink-3 focus-visible:border-ink
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
              focus-visible:outline-accent disabled:opacity-60"/>
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <span className="text-fine tabular-nums text-ink-3">
              {ticked.length} of {PROTOCOL.length} steps done</span>
            <Button size="sm" onClick={() => setClosed(true)}
              disabled={real || closed || ticked.length < PROTOCOL.length || !what.trim()}>
              {closed ? 'Finished' : 'Finish and log it'}</Button>
          </div>
          {closed && (
            <p className="mt-2.5 border-l-2 border-accent py-1 pl-3 text-fine text-ink-2">
              Logged at {PROTOCOL_TIMES[PROTOCOL_TIMES.length - 1]}. This alert is now closed.
              <span className="mt-0.5 block text-fine text-ink-3">&ldquo;{what}&rdquo;</span></p>
          )}
        </div>
      </Panel>

      <div className={ROW}>
        <SeeDetails label="See referrals and the log">
          <div className="grid items-start gap-3 [&>*]:min-w-0 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-4">
            <Panel tone="aqua">
              <PanelHead as="h3" title="Open referrals"/>
              <ul className="m-0 mt-2 list-none divide-y divide-rule p-0">
                {real && <BlankRow>No referral has been opened.</BlankRow>}
                {referrals.map(r => (
                  <li key={r.student + r.opened} className="py-2.5 first:pt-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-fine text-ink">{r.student}</span>
                      <Badge variant="state">{r.status}</Badge>
                    </div>
                    <p className="mt-0.5 text-fine text-ink-3">{shortRef(r.to)} · opened {r.opened}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-3 border-t border-rule pt-3">
                <Button variant="outline" size="sm" disabled>New referral</Button>
              </div>
            </Panel>
            <Panel>
              <PanelHead as="h3" title="Who opened what today" meta="nothing can be deleted"/>
              <ul className="m-0 mt-2 list-none p-0">
                {real && <BlankRow>Nothing has been logged yet.</BlankRow>}
                {log.map(r => (
                  <li key={r.at + r.action} className="flex flex-wrap items-baseline
                    justify-between gap-x-3 gap-y-0.5 border-b border-rule py-2.5 last:border-b-0">
                    <span className="min-w-0 flex-1 basis-[13rem]">
                      <span className="block text-fine text-ink">{plain(r.action)}</span>
                      <span className="mt-0.5 block text-fine text-ink-3">{r.actor} · {r.subject}</span>
                    </span>
                    <span className="shrink-0 text-fine tabular-nums text-ink-3">{r.at}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </SeeDetails>
      </div>
    </>
  )
}

/* ── Step 5. Parental consent ───────────────────────────────────────────── */

const FACTS = [
  ['Raw readings a parent can see', 'Never'],
  ['Raw readings you can see', 'Only if the student agrees'],
  ['Readings sold or passed to anyone else', 'Never'],
  ['Location collected by default', 'No'],
]

function Agreed({ real }) {
  const rows = real ? [] : roster()
  const longest = Math.max(...RETENTION)
  return (
    <>
      <Panel tone="brand">
        <PanelHead title="Parental Consent" meta={`${rows.length} signed`}/>
        <p className="mt-3 max-w-[48ch] text-fine text-ink-2">{CONSENT_SHORT}</p>
        <ul className="m-0 mt-3 list-none p-0">
          {real && <BlankRow>Nobody has signed yet.</BlankRow>}
          {rows.map(r => (
            <li key={r.id} className="border-b border-rule py-2.5 last:border-b-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <span className="min-w-0 text-meta text-ink">{r.name}</span>
                <span className="shrink-0 text-fine tabular-nums text-ink-3">
                  Signed {r.signedAt} · {r.basis}</span>
              </div>
              <p className="mt-0.5 text-fine text-ink-2">{agreed(r)}</p>
            </li>
          ))}
        </ul>
        {/* The expiry is the same date on every signature, so one line. */}
        <Note>{rows.length ? `Every signature runs out ${rows[0].expires}. ` : ''}Urgent alerts
          cannot be switched off.</Note>
      </Panel>

      <div className={ROW}>
        <SeeDetails label="See how long readings are kept">
          <div className="grid items-start gap-3 [&>*]:min-w-0 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-4">
            <Panel tone="aqua">
              <PanelHead as="h3" title="How long readings are kept"/>
              <p className="mt-3 max-w-[46ch] text-fine text-ink-2">Raw readings are deleted
                when the time runs out.</p>
              <ul className="m-0 mt-3 list-none border-t border-rule p-0">
                {RETENTION.map(d => (
                  <BarRow key={d} label={d === RETENTION[0] ? `${d} days, the default` : `${d} days`}
                    figure={`${d} days`} pct={(d / longest) * 100}
                    tone={d === RETENTION[0] ? 'bg-accent' : 'bg-ink-3'}
                    aria={`${d} days${d === RETENTION[0] ? ', the default' : ''}`}/>
                ))}
              </ul>
              <ul className="m-0 mt-3 list-none divide-y divide-rule border-t border-rule p-0">
                {FACTS.map(([k, v]) => (
                  <li key={k} className="flex flex-wrap items-baseline justify-between gap-3 py-2.5">
                    <span className="min-w-0 text-fine text-ink-2">{k}</span>
                    <span className="shrink-0 text-fine font-medium text-ink">{v}</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel>
              <PanelHead as="h3" title="Export a copy" meta="both are logged"/>
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <Button variant="outline" size="sm" disabled>Export the record</Button>
                <Button variant="outline" size="sm" disabled>Export what was agreed</Button>
              </div>
            </Panel>
          </div>
        </SeeDetails>
      </div>
    </>
  )
}

/* ── Nothing paired, which is every visitor's true state today ──────────── */

/* src/views/App.jsx renders its own start screen for this audience in real
   mode, so this is reached only if that changes. */
const WHAT_FILLS = [
  'A student pairs a patch on their own phone.',
  'A guardian signs what may be shared.',
  'Only what was signed appears here.',
]

const AskAi = ({ go, className }) => (
  <button type="button" onClick={() => go('ai')}
    className={cn('inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-field border',
      'border-rule bg-card px-3 font-display text-ui font-medium text-accent-ink',
      'transition-colors duration-150 hoverOnly:bg-aqua active:bg-aqua', className)}>
    Ask MindMap AI
    <ArrowRight aria-hidden className="size-4 shrink-0 text-accent"/>
  </button>
)

/* The way into the network screen (src/account/Network.jsx): a code the
   student enters and a parent approves. */
const AddStudent = ({ go, className }) => (
  <button type="button" onClick={() => go('network')}
    className={cn('inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-field border',
      'border-accent-ink bg-accent px-3 font-display text-ui font-medium text-paper',
      'transition-colors duration-150 hoverOnly:bg-accent-ink active:bg-accent-ink', className)}>
    <Plus aria-hidden className="size-4 shrink-0"/>
    Add a student
  </button>
)

const NothingYet = ({ go }) => (
  <Panel tone="brand">
    <PanelHead title="No readings yet"/>
    <p className="mt-3 max-w-[28ch] font-display text-row font-bold leading-[1.16] text-ink
      sm:text-head">No student has paired a patch yet.</p>
    <List className="mt-3 max-w-[54ch] text-fine text-ink-2">
      {WHAT_FILLS.map(t => <Item key={t}>{t}</Item>)}
    </List>
    <div className="mt-3.5 flex flex-wrap gap-2.5">
      <AddStudent go={go}/>
      <AskAi go={go}/>
    </div>
  </Panel>
)

/* ── The console ────────────────────────────────────────────────────────── */

export function Pro({ go }) {
  const [mode] = useMode()
  const real = mode === 'real'
  const words = wordsFor(useAccount())
  const STEPS = stepsFor(words)
  const [step, setStep] = React.useState('school')
  const [who, setWho] = React.useState('Student 8241')
  const [said, setSaid] = React.useState('')
  /* Moving between steps, or opening a record, replaces the whole panel with
     focus still on <body> and nothing announced. */
  const announce = msg => { setSaid(''); requestAnimationFrame(() => setSaid(msg)) }
  const onStep = v => { setStep(v); announce(`Showing ${STEPS.find(s => s[0] === v)[1]}`) }
  const openStudent = name => {
    setWho(name); setStep('student'); announce(`Opened the record for ${name}`)
  }
  const PANES = {
    school:  () => real ? <NothingYet go={go}/> : <School words={words}/>,
    list:    () => real ? <NothingYet go={go}/> : <CheckIn onOpen={openStudent} onStep={onStep}/>,
    student: () => real ? <NothingYet go={go}/> : <OneStudent who={who} setWho={setWho}/>,
    urgent:  () => <Urgent real={real}/>,
    agreed:  () => <Agreed real={real}/>,
  }
  const at = STEPS.findIndex(s => s[0] === step)
  const nx = nextOf(STEPS, step)
  return (
    <main>
      <Tabs value={step} onValueChange={onStep}>
        <div className="wrap !pt-4">
          <p aria-live="polite" className="sr-only text-fine">{said}</p>
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <h2 className="max-w-[24ch] font-display text-row font-bold tracking-tight text-ink
              sm:text-head">{words.head}</h2>
            {/* The four safeguards, behind a "?". They hold on every step. */}
            <Why label="The four rules on this screen" className="pt-1">
              <ul className="m-0 list-none p-0">
                {RULES.map(r => <li key={r} className="py-0.5">{r}</li>)}
              </ul>
            </Why>
          </div>
          {real
            ? <RealNotice className="mt-2" inline>No patch is paired and nothing is signed.</RealNotice>
            : <DemoNotice className="mt-2" inline>These figures are generated. No student was measured.</DemoNotice>}
        </div>

        {/* The five steps are the whole navigation, so they stay chrome: card
            ground, stuck beneath the 48px top bar from sm up, and scrolling
            sideways at 390 rather than wrapping. */}
        <div className="mt-3 border-b border-ink bg-card sm:sticky sm:top-12 sm:z-30">
          <div className="wrap !py-0">
            <TabsList aria-label="The five steps" scroll className="gap-x-5 border-b-0">
              {STEPS.map(([v, label]) => (
                <TabsTrigger key={v} value={v} className="min-h-[46px] text-ui">{label}</TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        <div className="wrap !pt-3 pb-12">
          {/* Where the reader is, and the two actions this console hands off. */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="tick">Step {at + 1} of {STEPS.length}</p>
            <div className="flex flex-wrap gap-2.5">
              <AddStudent go={go}/>
              <AskAi go={go}/>
            </div>
          </div>
          {STEPS.map(([v]) => {
            const Pane = PANES[v]
            return <TabsContent key={v} value={v} className="mt-3"><Pane/></TabsContent>
          })}
          {nx && (
            <button type="button" onClick={() => onStep(nx[0])}
              className="mt-3 flex min-h-[52px] w-full items-center justify-between gap-3
                rounded-panel border border-rule bg-card px-3.5 text-left transition-colors
                duration-150 hoverOnly:bg-aqua active:bg-aqua lg:mt-4">
              <span className="min-w-0">
                <span className="tick block">Next step</span>
                <span className="block font-display text-ui font-medium text-ink">{nx[1]}</span>
              </span>
              <ArrowRight aria-hidden className="size-4 shrink-0 text-accent"/>
            </button>
          )}
        </div>
      </Tabs>
    </main>
  )
}
