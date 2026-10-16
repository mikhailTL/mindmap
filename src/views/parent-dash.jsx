import React from 'react'
import { Chevron } from '../ui/marks'
import { RealNotice } from '../ui/notice'
import { List, Item } from '../ui/list'
import { Panel, PanelHead, SeeDetails, Why } from './Monitor'
import { RainbowDial } from '../charts/rainbow'
import { WeekChart } from '../charts/week'
import { useMode } from '../lib/mode'
import { DATA } from '../lib/assets'
import { AUDIT_LOG, CONSENT, CONSENT_LEDGER, PROTOCOL, PROTOCOL_DONE,
  PROTOCOL_TIMES } from '../lib/caseload'
import { bandOf } from '../signals/score'
import { cn } from '../lib/utils'
import { SCORE, NOTES, LOCATION, PRO_LC, CONSENT_SHORT, CONSENT_OFF } from '../lib/terms'
import { getSharing, getVersion, subscribe } from '../app/store'
import { LightPill } from '../traffic/Parent'
import { parentSummary } from '../signals/light'

/* Demo figure for the settle row: days the body took longer than usual to
   settle. A count of days and nothing finer. */
const SETTLE_DAYS = 2

/* The parent dashboard.
 *
 * CONSENT SCOPE, never widened here: day and week Mind Score, whether a day
 * sat above the student's own range, rough sleep, whether the patch was worn.
 * Nothing finer than a day. No raw reading, Notes or Location. The hero dial
 * carries one band, the week's score, never the four rings. The raw-readings
 * row is the student's switch and renders disabled; in real mode every
 * control is disabled because nothing is signed.
 *
 * NO NAME: the child is never named. Where a code is needed it is the
 * pseudonym the console uses. Pronouns are "they", true in both modes.
 *
 * SHAPE. One hero card and the Traffic Light beside it at 1280, under it at
 * 390. Everything else, the seven days first, behind one `See details`. */

const CHILD_POSS = 'your child’s'
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const FULL = { Mon:'Monday', Tue:'Tuesday', Wed:'Wednesday', Thu:'Thursday',
               Fri:'Friday', Sat:'Saturday', Sun:'Sunday' }

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven']
const word = n => WORDS[n] ?? String(n)
const cap = s => s.charAt(0).toUpperCase() + s.slice(1)
const list = xs => xs.length < 2 ? (xs[0] ?? '')
  : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`

/* Still time off the movement channel, in hours. Same figures as the movement
   ring in src/lib/readings.js. Not a scoring-model output: these come off the
   movement channel against the wearer's own usual, so both figures say
   "about". */
const SLEEP = { nights: 3, hours: 5.5, usual: 8 }
const hrs = h => `${h} h`

/* Single source for every figure on this screen, off the same fixture the week
   chart draws. Never retype a count as a literal below. */
function readWeek() {
  const band = DATA.weekBand
  const days = (DATA.week ?? []).map(d => ({
    key: d.d, name: FULL[d.d] ?? d.d, over: d.v > band.hi, v: d.v,
  }))
  const over = days.filter(d => d.over)
  /* Flagged day = furthest above their own range, not the latest. */
  const peak = over.length ? over.reduce((a, b) => (b.v > a.v ? b : a)) : null
  const ranked = [...days].sort((a, b) => b.v - a.v)
  return {
    band, days, over, peak,
    hiDay: ranked[0] ?? null, loDay: ranked[ranked.length - 1] ?? null,
    last: days[days.length - 1],
    avg: days.length ? Math.round(days.reduce((a, d) => a + d.v, 0) / days.length) : null,
    /* The dial's harm anchor: the middle of their own fourteen-day range. */
    usual: Math.round((band.lo + band.hi) / 2),
  }
}

/* Tier colour and tier word, both keyed off bandOf, so this screen and the
   student screen agree on what "usual" means. Colour is never the only
   carrier: the word sits under the dial. */
const TIER_BAR = { low:'bg-calm', usual:'bg-calm', up:'bg-warn', high:'bg-crit' }
const TIER_STROKE = { low:'#0a6e68', usual:'#0a6e68', up:'#8f5a0c', high:'#a8321f' }
const TIER_WORD = { low:'Easier than their usual week', usual:'Inside their usual range',
                    up:'A little above their usual range', high:'Above their usual range' }

/* ── 1. The week in one sentence ────────────────────────────────────────── */
/* MindMap measures physiology, not anxiety, mood or feeling. A sentence here
   may say a body worked harder and may never say a child was anxious,
   stressed, sad or struggling. Branched, not templated: a quiet week must not
   read "no days were harder". */
function heroSentence(w) {
  if (!w.days.length) return null
  const n = w.over.length
  if (!n) return 'This week looked ordinary for their body.'
  if (n === w.days.length) return 'Every day was harder on their body than usual.'
  if (n === 1) return 'One day was harder on their body than usual.'
  return `${cap(word(n))} days were harder on their body than usual.`
}

/* The quieter line: which days, and how far their own range runs. */
function heroDetail(w) {
  if (!w.days.length) return null
  const range = `Their usual range is ${w.band.lo} to ${w.band.hi}.`
  if (!w.over.length) return `Every day sat inside it. ${range}`
  if (w.over.length === 1) return `${w.peak.name} sat above it. ${range}`
  return `${list(w.over.map(d => d.name))} sat above it. ${w.peak.name} went furthest. ${range}`
}

/* ── 2. The week, at day grain and no finer ─────────────────────────────── */
function DayStrip({ on, tone, label }) {
  return (
    <div className="mt-2.5 flex gap-1" role="img" aria-label={label}>
      {on.map((v, i) => (
        <span key={i} aria-hidden
          className={cn('h-2 flex-1 rounded-bar', v ? tone : 'bg-ink-3/25')}/>
      ))}
    </div>
  )
}

/* One figure with its label above it. `pre` is the hedging word in front of
   a figure, small and on the same line. */
function Figure({ label, pre, figure, unit, className }) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="tick">{label}</p>
      <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 font-display text-row
        font-medium tabular-nums leading-none text-ink">
        {pre && <span className="font-body text-fine font-normal text-ink-3">{pre}</span>}
        {figure}
        {unit && <span className="font-body text-fine font-normal text-ink-3">{unit}</span>}
      </p>
    </div>
  )
}

/* A key and a figure on one rule. */
function Row({ k, v, tone = 'text-ink' }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-rule py-2">
      <dt className="min-w-0 text-fine text-ink-2">{k}</dt>
      <dd className={cn('m-0 min-w-0 text-right font-display text-ui font-medium tabular-nums', tone)}>{v}</dd>
    </div>
  )
}

/* A measured value against the same wearer's own usual, as two bars off one
   zero-based scale. Each bar carries its own name and figure. `top` is the
   scale's full length, never the larger of the two values. */
function PairBars({ rows, top, aria }) {
  return (
    <div className="mt-2.5 flex flex-col gap-2" role="img" aria-label={aria}>
      {rows.map(r => (
        <span key={r.k} aria-hidden className="block">
          <span className="flex items-baseline justify-between gap-2">
            <span className="min-w-0 text-fine text-ink-2">{r.k}</span>
            <span className="shrink-0 text-fine tabular-nums text-ink">{r.text}</span>
          </span>
          <span className="mt-1 block h-2 rounded-bar bg-ink-3/15">
            <span className={cn('block h-full rounded-bar', r.tone)}
              style={{ width: `${Math.round((r.v / top) * 100)}%` }}/>
          </span>
        </span>
      ))}
    </div>
  )
}

/* Worked out from movement, so it is an estimate and both figures say "about". */
function SleepBars() {
  return (
    <PairBars top={Math.max(SLEEP.hours, SLEEP.usual)}
      aria={`About ${hrs(SLEEP.hours)} on ${word(SLEEP.nights)} nights, against their usual of about ${hrs(SLEEP.usual)}.`}
      rows={[
        { k:'short nights', v:SLEEP.hours, text:`about ${hrs(SLEEP.hours)}`, tone:'bg-warn' },
        { k:'usual night', v:SLEEP.usual, text:`about ${hrs(SLEEP.usual)}`, tone:'bg-ink-3/40' },
      ]}/>
  )
}

/* Real mode only. A day with no reading says so; an unmeasured week and a calm
   week are indistinguishable otherwise. */
function EmptyWeek() {
  return (
    <dl className="m-0 p-0">
      {DAYS.map(k => <Row key={k} k={FULL[k]} v="No data" tone="text-ink-3"/>)}
    </dl>
  )
}

/* ── 3. The one thing worth asking about ────────────────────────────────── */
/* The openers, the "not this" line and the safety line ship with the flag, not
   behind a link: a flag with no next step gets acted on badly. */
const openers = day => [
  `How was ${day}?`,
  'Anything this week you want to get off your chest?',
  'Do you want help with it, or just to talk?',
]

function AskAbout({ w }) {
  if (!w.peak) {
    return (
      <p className="mt-2.5 max-w-[48ch] text-fine text-ink-2">No day sat above {CHILD_POSS} own
        range.</p>
    )
  }
  return (
    <>
      <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-display text-ui font-medium text-ink">{w.peak.name}</p>
        <p className="flex items-baseline gap-1.5 font-display text-row font-medium
          tabular-nums leading-none text-warn">
          {w.peak.v}
          <span className="font-body text-fine font-normal text-ink-3">out of 100</span></p>
      </div>
      <p className="mt-1.5 max-w-[48ch] text-fine text-ink-2">The app cannot say why.</p>
      <List className="mt-2.5 gap-0">
        {openers(w.peak.name).map(o => (
          <Item key={o} marker="none" className="border-b border-rule py-2 text-fine text-ink">
            &ldquo;{o}&rdquo;</Item>
        ))}
      </List>
      <p className="mt-2.5 max-w-[50ch] text-fine text-ink-2">Try not to say &ldquo;Your patch says
        you were stressed.&rdquo; They can see this page too.</p>
      <p className="mt-1.5 max-w-[50ch] text-fine text-ink-2">Worried about their safety? Call
        their {PRO_LC} or a crisis line.</p>
    </>
  )
}

/* ── 4. What a parent is never shown ────────────────────────────────────── */
/* Third person, so the same list is true in both modes. */
const NEVER = [
  [NOTES, 'Their journal stays on their phone.'],
  [LOCATION, 'MindMap never collects it.'],
  ['Second-by-second readings', 'You see whole days, never a moment.'],
  ['Anything they say', 'The microphone is never recorded.'],
  ['The four signals', 'You see the one number they make.'],
]

/* ── 5. What the school may see ─────────────────────────────────────────── */
/* Read from the same CONSENT record the medical professional's console reads.
   Never keep a second copy here. */
const [SCHOOL_CODE, RECORD] = Object.entries(CONSENT)[0]
const LEDGER = CONSENT_LEDGER.find(r => r.student === SCHOOL_CODE) ?? {}

const SCOPES = [
  { id:'score',  label:`The ${SCORE} for the week` },
  { id:'trends', label:`Whether the ${SCORE} moved week to week` },
  { id:'raw',    label:'Second-by-second readings',
    sub:'Off unless you and your child both turn it on.',
    /* The student holds the other half of this one, so a parent cannot widen
       it alone. The row stays, locked, with the words beside the control
       carrying the lock. */
    held:'Your child’s switch' },
]

/* A locked row is drawn at full strength, not faded: element opacity lands
   white-on-grey at about 2.4 : 1, a fail no contrast sweep catches. */
function Switch({ on, disabled, label, onClick }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onClick}
      disabled={disabled}
      className={cn('min-h-[44px] shrink-0 rounded-field border px-3.5 font-display text-ui',
        'transition-[background-color,color,border-color] duration-150 ease-out',
        'disabled:pointer-events-none',
        disabled
          ? on ? 'border-ink-3 bg-mist font-medium text-ink'
               : 'border-ink-3 bg-transparent font-light text-ink-2'
          : on ? 'border-ink bg-ink font-medium text-paper hoverOnly:bg-accent-ink active:bg-accent-ink'
               : 'border-ink bg-transparent font-light text-ink-2 hoverOnly:bg-mist active:bg-mist')}>
      {on ? 'Shared' : 'Not shared'}
    </button>
  )
}

function ScopeRow({ label, sub, children }) {
  return (
    <Item marker="none" className="border-b border-rule py-2.5">
      <span className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5">
        <span className="min-w-0 flex-1 basis-[14rem]">
          <span className="block font-display text-ui font-medium text-ink">{label}</span>
          {sub && <span className="block text-fine text-ink-2">{sub}</span>}
        </span>
        {children}
      </span>
    </Item>
  )
}

/* The four switches. Real mode has no signed consent, so every row starts
   closed and the controls are disabled. The raw scope is absent from this
   state on purpose: nothing here can flip it. */
function WhatIsShared({ real }) {
  const [share, setShare] = React.useState(() => ({
    score: !real && RECORD.score, trends: !real && RECORD.trends,
  }))
  return (
    <>
      <p className="mt-2.5 max-w-[56ch] text-fine text-ink-2">{CONSENT_SHORT}</p>
      <List className="mt-2.5 gap-0">
        {SCOPES.map(s => (
          <ScopeRow key={s.id} label={s.label} sub={s.sub}>
            {s.held ? (
              <span className="flex shrink-0 flex-wrap items-center justify-end gap-x-2.5 gap-y-2">
                <span className="font-display text-fine font-semibold text-ink-2">{s.held}</span>
                <Switch on={!real && !!RECORD[s.id]} disabled
                  label={`${s.label}. Locked here, ${s.held.toLowerCase()}`}/>
              </span>
            ) : (
              <Switch on={share[s.id]} disabled={real} label={s.label}
                onClick={() => setShare(p => ({ ...p, [s.id]: !p[s.id] }))}/>
            )}
          </ScopeRow>
        ))}
        {/* Not a choice, but listed as a disabled control rather than omitted. */}
        <ScopeRow label="A crisis alert" sub="Nobody can turn this off.">
          <Switch on disabled label="A crisis alert"/>
        </ScopeRow>
      </List>
      {real && (
        <p className="mt-2.5 max-w-[56ch] text-fine text-ink-2">These switches work once a
          guardian signs.</p>
      )}
      <p className="mt-2.5 max-w-[56ch] text-fine text-ink-3">Every switch here is logged.</p>
    </>
  )
}

/* The signed record: three rows, read from the same CONSENT entry. */
function WhatWasSigned({ real }) {
  if (real) {
    return <p className="mt-2.5 max-w-[56ch] text-fine text-ink-2">Nothing is signed yet.</p>
  }
  return (
    <>
      <p className="mt-2.5 max-w-[56ch] text-fine text-ink-2">{RECORD.scope}.</p>
      <dl className="m-0 mt-2.5 p-0">
        <Row k="Signed" v={RECORD.signedAt}/>
        <Row k="Runs out" v={LEDGER.expires ?? 'Not set'}/>
        <Row k="Legal basis" v={RECORD.basis}/>
      </dl>
      <p className="mt-2.5 max-w-[56ch] text-fine text-ink-2">{CONSENT_OFF}</p>
      <p className="mt-1.5 max-w-[56ch] text-fine text-ink-3">The {PRO_LC} sees your child
        as {SCHOOL_CODE}.</p>
    </>
  )
}

/* ── 6. The record's own log ────────────────────────────────────────────── */
/* The same append-only log the school console shows, narrowed to this one
   record. */
const MY_ROWS = AUDIT_LOG.filter(r => r.subject === SCHOOL_CODE)
/* The log is newest first, so the first three are the most recent. */
const SHOWN = 3

function RecordLog({ real }) {
  const [all, setAll] = React.useState(false)
  const rows = all ? MY_ROWS : MY_ROWS.slice(0, SHOWN)
  const more = MY_ROWS.length - SHOWN
  return (
    <>
      {real ? (
        <p className="mt-2.5 max-w-[54ch] text-fine text-ink-2">There is no record yet, so nothing
          is logged.</p>
      ) : (
        <ul className="m-0 mt-1.5 list-none p-0">
          {rows.map(r => (
            <li key={r.at + r.action} className="border-b border-rule py-2">
              <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                <span className="min-w-0 flex-1 font-display text-ui font-medium text-ink">
                  {r.action}</span>
                <span className="shrink-0 text-fine tabular-nums text-ink-3">{r.at}</span>
              </span>
              <span className="mt-0.5 block text-fine text-ink-2">{r.actor}</span>
            </li>
          ))}
        </ul>
      )}
      {!real && more > 0 && (
        <button type="button" aria-expanded={all} onClick={() => setAll(a => !a)}
          className="group mt-1.5 flex min-h-[44px] w-full items-center gap-3 text-left">
          <span className="min-w-0 flex-1 font-display text-ui font-medium text-ink
            transition-colors duration-150 groupHoverOnly:text-accent-ink">
            {all ? 'Show fewer' : `See all opens (${MY_ROWS.length})`}</span>
          <Chevron aria-hidden className={cn('size-4 shrink-0 text-accent transition-transform',
            'duration-150', all && 'rotate-90')}/>
        </button>
      )}
      <p className="mt-2.5 max-w-[54ch] text-fine text-ink-2">Every open is logged.</p>
    </>
  )
}

/* ── 7. What happens if a crisis alert is raised ────────────────────────── */
/* The practice's own protocol, same five steps the console runs, with the step
   that is the call to this parent marked. */
const GUARDIAN_STEP = PROTOCOL.findIndex(s => /guardian/i.test(s))

/* Minutes between two of the protocol's own clock times, parsed so the figure
   cannot disagree with PROTOCOL_TIMES. */
const minuteOf = t => {
  const [, h, m, ap] = t.match(/(\d+):(\d+)\s*([AP]M)/i)
  return ((Number(h) % 12) + (/p/i.test(ap) ? 12 : 0)) * 60 + Number(m)
}
const TO_GUARDIAN = minuteOf(PROTOCOL_TIMES[GUARDIAN_STEP]) - minuteOf(PROTOCOL_TIMES[0])

function CrisisPath({ real }) {
  return (
    <>
      {/* Demo only. In real mode the protocol has never run. */}
      {!real && (
        <div className="mt-2.5 border-b border-rule pb-2.5">
          <Figure label="Time from the alert to your call" figure={TO_GUARDIAN} unit="minutes"/>
          <p className="mt-1 max-w-[40ch] text-fine text-ink-2">From the one logged run.</p>
        </div>
      )}
      <ol className={cn('m-0 list-none p-0', real && 'mt-1.5')}>
        {PROTOCOL.map((step, i) => (
          <li key={step} className="flex items-baseline gap-2.5 border-b border-rule py-2">
            <span aria-hidden className="w-4 shrink-0 text-fine tabular-nums text-ink-3">
              {i + 1}</span>
            <span className="min-w-0 flex-1 text-fine text-ink">{step}</span>
            {i === GUARDIAN_STEP && (
              <span className="shrink-0 font-display text-fine font-semibold text-accent-ink">you</span>
            )}
            {!real && (
              <span className="w-[4.25rem] shrink-0 text-right text-fine tabular-nums text-ink-3">
                {PROTOCOL_DONE.includes(i) ? PROTOCOL_TIMES[i] : 'open'}</span>
            )}
          </li>
        ))}
      </ol>
      <p className="mt-2.5 max-w-[54ch] text-fine text-ink-2">Every step is logged.</p>
    </>
  )
}

/* ── 8. Is the patch even reporting ─────────────────────────────────────── */
function PatchStatus() {
  const rows = [['Status', 'Not reporting'],
                ['Days with readings this week', `0 of ${DAYS.length}`],
                ['Last reading', 'None']]
  return (
    <>
      <dl className="m-0 mt-1.5 p-0">
        {rows.map(([k, v]) => <Row key={k} k={k} v={v} tone="text-crit"/>)}
      </dl>
      <List className="mt-2.5">
        {['Pair a patch on your child’s phone.',
          'Check the patch sits on the upper arm.',
          'This page fills after the first full week.'].map(s => (
          <Item key={s} className="max-w-[52ch] text-fine text-ink-2">{s}</Item>
        ))}
      </List>
    </>
  )
}

/* ── The Traffic Light, the one block under the hero ────────────────────── */
/* The demo's one red day: the pill, one line, the link. The time and minutes
   live on the Traffic Light screen itself. The clock in parentSummary reads
   UTC. */
const LIGHT_DAY = parentSummary({ light: 'red', at: Date.UTC(2026, 9, 13, 21, 40), minutes: 23, top: 'pxPerSec' })

function TrafficLightCard({ go }) {
  return (
    <Panel className="flex h-full flex-col justify-center">
      <PanelHead title="The Traffic Light" meta="phone only"/>
      <div className="mt-2.5 flex items-center gap-3">
        <LightPill light={LIGHT_DAY.light} className="shrink-0"/>
        <p className="min-w-0 font-display text-ui font-medium text-ink">{LIGHT_DAY.line}</p>
      </div>
      <button type="button" onClick={() => go('traffic-light')}
        className="group mt-2.5 flex min-h-[44px] w-full items-center gap-3 border-t border-rule
          pt-2.5 text-left">
        <span className="min-w-0 flex-1 font-display text-ui font-medium text-ink
          transition-colors duration-150 groupHoverOnly:text-accent-ink">
          Open the Traffic Light</span>
        <Chevron aria-hidden className="size-4 shrink-0 text-accent"/>
      </button>
    </Panel>
  )
}

/* ── The never-shown module ─────────────────────────────────────────────── */
function NeverShown({ go, openTab }) {
  return (
    <Panel tone="beam">
      <PanelHead title="What you never see" meta="no export"/>
      <List className="mt-2.5 gap-0">
        {NEVER.map(([t, s]) => (
          <Item key={t} marker="none" className="border-b border-rule py-2">
            <span className="block font-display text-ui font-medium text-ink">{t}</span>
            <span className="block text-fine text-ink-2">{s}</span>
          </Item>
        ))}
      </List>
      <button type="button" onClick={() => (openTab ? openTab('shared') : go('privacy'))}
        className="group mt-2.5 flex min-h-[44px] w-full items-center gap-3 border-t border-rule
          pt-2.5 text-left">
        <span className="min-w-0 flex-1 font-display text-ui font-medium text-ink
          transition-colors duration-150 groupHoverOnly:text-accent-ink">
          Compare what each audience sees</span>
        <Chevron aria-hidden className="size-4 shrink-0 text-accent"/>
      </button>
    </Panel>
  )
}

/* ── The screen ─────────────────────────────────────────────────────────── */

export function ParentDash({ go, openTab }) {
  const [mode] = useMode()
  const real = mode === 'real'
  const w = readWeek()
  /* Day-level settle count. Off by default and the student's switch, so the
     row is absent rather than blank until it is shared. */
  React.useSyncExternalStore(subscribe, getVersion, () => 0)
  const settle = getSharing().parent.settle === true
  const tier = w.avg == null ? 'usual' : bandOf(w.avg).key
  /* One band, the week's score. 0 is a calm day on this scale, so real mode
     draws no dial at all rather than a dial at 0. */
  const weekRing = { id:'week', name:SCORE, value:w.avg ?? 0, glow:TIER_STROKE[tier] }
  const measured = w.days.length

  /* REAL MODE. One card carrying the honest sentence, the seven empty days
     beside it, then one disclosure. No dial. */
  if (real) {
    return (
      <div className="flex w-full flex-col gap-3 lg:gap-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-4">
          <Panel className="flex flex-col justify-center">
            <div className="flex flex-col items-center text-center">
              <p className="max-w-[30ch] font-display text-row font-bold leading-[1.14]
                tracking-tight text-ink sm:text-head">Nothing was measured this week.</p>
              <Why label="Why there is no score" align="center" className="mt-2">
                Each day is scored against their own last two weeks. An empty week is not
                a calm week.
              </Why>
            </div>
            <div className="mt-3 border-t border-rule pt-2.5">
              <RealNotice>No patch is paired yet.</RealNotice>
            </div>
          </Panel>
          <Panel tone="aqua">
            <PanelHead title="Each day" meta="0 of 7"/>
            <div className="mt-1.5"><EmptyWeek/></div>
          </Panel>
        </div>

        <SeeDetails label="See details">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
            <Panel className="h-full border-t-2 border-t-crit">
              <PanelHead title="Patch status" meta="not reporting"/>
              <PatchStatus/>
            </Panel>
            <Panel tone="brand" className="h-full">
              <PanelHead title="What is shared" meta="nothing signed"/>
              <WhatIsShared real={real}/>
            </Panel>
            <Panel className="h-full">
              <PanelHead title="What was signed" meta="nothing signed"/>
              <WhatWasSigned real={real}/>
            </Panel>
            <Panel tone="deep" className="h-full">
              <PanelHead title="Who opened the record" meta="nothing deleted"/>
              <RecordLog real={real}/>
            </Panel>
            <Panel className="h-full border-t-2 border-t-crit">
              <PanelHead title="Steps after a crisis alert" meta="five steps"/>
              <CrisisPath real={real}/>
            </Panel>
            <div className="lg:col-span-2"><NeverShown go={go} openTab={openTab}/></div>
          </div>
        </SeeDetails>
      </div>
    )
  }

  /* DEMO MODE. */
  return (
    <div className="flex w-full flex-col gap-3 lg:gap-4">
      {/* THE FOLD. The week's sentence, the dial, the tier word, and beside
          them at 1280 the Traffic Light. Nothing else. */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-4">
        <Panel className="flex flex-col justify-center">
          <div className="flex flex-col items-center text-center">
            <p className="max-w-[30ch] font-display text-row font-bold leading-[1.14]
              tracking-tight text-ink sm:text-head">{heroSentence(w)}</p>
            <RainbowDial className="mt-3" weather={false} score={w.avg} usual={w.usual}
              rings={[weekRing]} size={352}/>
            <p className="mt-2 flex items-center gap-2 font-display text-ui font-medium text-ink">
              <span aria-hidden className={cn('h-4 w-[3px] shrink-0 rounded-bar', TIER_BAR[tier])}/>
              {TIER_WORD[tier]}
            </p>
            <Why label="What this week's score means" align="center" className="mt-2">
              {heroDetail(w)} You see whole days, never a single moment.
            </Why>
          </div>
        </Panel>
        <TrafficLightCard go={go}/>
      </div>

      {/* ONE DISCLOSURE. Everything else is in here, collapsed, two abreast
          at 1280. The days above their usual are already in the hero line and
          the week chart, so no card restates them. */}
      <SeeDetails label="See details">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
          <Panel tone="aqua" className="flex h-full flex-col">
            <PanelHead title="Each day" meta={`${measured} of 7`}/>
            <WeekChart data={DATA.week} band={DATA.weekBand}/>
            <dl className="m-0 mt-auto border-t border-rule p-0 pt-1">
              {w.hiDay && <Row k="Highest day" v={`${w.hiDay.name}, ${w.hiDay.v}`}
                tone={w.hiDay.over ? 'text-warn' : 'text-ink'}/>}
              {w.loDay && <Row k="Lowest day" v={`${w.loDay.name}, ${w.loDay.v}`}/>}
              {settle && <Row k="Days slow to settle" v={`${SETTLE_DAYS} of ${DAYS.length}`}/>}
            </dl>
            {settle && (
              <p className="mt-1.5 text-fine text-ink-3">Shown only when your child shares it.</p>
            )}
          </Panel>

          <Panel tone="deep" className="h-full">
            <PanelHead title="Wear and rest" meta="from movement"/>
            <div className="mt-2.5">
              <Figure label="Days the patch reported" figure={measured} unit={`of ${DAYS.length}`}/>
            </div>
            <DayStrip tone="bg-calm" on={DAYS.map(k => w.days.some(d => d.key === k))}
              label={`The patch reported on ${word(measured)} of ${word(DAYS.length)} days.`}/>
            <div className="mt-3 border-t border-rule pt-2.5">
              <Figure label={`Rest on ${word(SLEEP.nights)} short nights`} pre="about"
                figure={SLEEP.hours} unit="h a night"/>
              <SleepBars/>
            </div>
          </Panel>

          <Panel tone="brand" className="h-full">
            <PanelHead title="What to ask about"/>
            <AskAbout w={w}/>
          </Panel>

          <Panel className="h-full">
            <PanelHead title="What is shared" meta="four switches"/>
            <WhatIsShared real={real}/>
          </Panel>

          <Panel className="h-full">
            <PanelHead title="What was signed"/>
            <WhatWasSigned real={real}/>
          </Panel>

          <Panel tone="aqua" className="h-full">
            <PanelHead title="Who opened the record" meta="nothing deleted"/>
            <RecordLog real={real}/>
          </Panel>
          <Panel className="h-full border-t-2 border-t-crit">
            <PanelHead title="Steps after a crisis alert" meta={`${PROTOCOL.length} steps`}/>
            <CrisisPath real={real}/>
          </Panel>

          <div className="lg:col-span-2"><NeverShown go={go} openTab={openTab}/></div>
        </div>
      </SeeDetails>
    </div>
  )
}
