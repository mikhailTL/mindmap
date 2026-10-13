import React from 'react'
import { Panel, PanelHead, SeeDetails, Stat, TONES } from './Monitor'
import { Button } from '../ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { Badge } from '../ui/badge'
import { DemoNotice, RealNotice } from '../ui/notice'
import { useMode } from '../lib/mode'
import { ArrowRight, Chevron } from '../ui/marks'
import { List, Item } from '../ui/list'
import {
  K_ANONYMITY, TIER_LABEL, triage, scoreOnly, alertsOnly, roster,
  SCHOOL_N, COHORT_PERIOD, COHORT_WEEKDAY, AUDIT_LOG, PROTOCOL, PROTOCOL_TIMES,
  PROTOCOL_DONE, REFERRALS, driversFor, INTERVENTIONS, profile45,
} from '../lib/caseload'
import { RETENTION } from '../app/store'
import { CASELOAD_TITLE, CONSENT_OFF, CONSENT_SHORT, SCORE, PRO } from '../lib/terms'
import { cn } from '../lib/utils'

/* THE MEDICAL PROFESSIONAL CONSOLE, REBUILT 13 OCTOBER.
 *
 * The owner, verbatim: "The medical professional dashboard is too complex,
 * like the words it uses, and the jumble of data presented isnt clear and too
 * overwhelming, needs to be simplified and have a spet by step feel, like
 * 'Manage stress across the whole school' instead of a crisis protocol ...
 * Also tooooo much text on this one. Mindmap AI needs to be added to this as
 * well." Design spec 0e, section 16.
 *
 * What changed, and the rule each change follows.
 *
 * 1. PLAIN WORDS. Caseload, cohort, triage, escalation, crisis protocol,
 *    k-anonymity, consent scope, audit log, retention, intervention and
 *    suppressed cell are all gone from the copy. The reader is a counsellor
 *    between two appointments. Every one of them now says what it means:
 *    the students you follow, the whole school, who to check in with, steps
 *    taken, urgent alert, a group smaller than five, what a guardian agreed
 *    to share, the written record, how long readings are kept, what has been
 *    tried, hidden.
 *
 * 2. A SEQUENCE, NOT A WALL. Five steps in the order a professional works:
 *    the whole school, then who to check in with, then one student, then an
 *    urgent alert, then what each guardian agreed. One lead sentence, one
 *    main module and one disclosure per step, and a Next control at the foot
 *    of each. Nothing else is above the fold.
 *
 * 3. HALF THE WORDS. A sentence that restated a figure beside it is deleted.
 *    The five-row list of order rules is three lines, the six-tile summary
 *    strip is gone (it was the jumble), and the real-mode explanations of
 *    what each empty tab would hold are one short list.
 *
 * 4. MINDMAP AI IS AN ACTION, not a panel: one control, routed to `ai`, which
 *    src/views/App.jsx owns and another worker builds. This console never
 *    answers anything itself and never says it does.
 *
 * 5. FOUR SAFEGUARDS SURVIVE IN PLAIN WORDS and are on every step, in RULES
 *    below: what a student agreed to, the group of five, the written record,
 *    and that none of this is a diagnosis. Simplify the language, never the
 *    safeguard.
 *
 * COLOUR. Green, white and turquoise only (spec 0d, section 1). Grounds are
 * card, accent-wash and aqua through Monitor's TONES, indexed only by the six
 * live keys. warn means a figure above a student's own normal and crit means
 * an urgent alert; nothing else is coloured, and both are stated in words
 * beside the figure. Measured on accent-wash #d6eeeb, the only tint this file
 * lands text on: ink 11.33, ink-2 6.15, ink-3 4.61, warn 4.74, crit 5.50,
 * accent 4.78. On card: ink 15.20, ink-2 8.25, ink-3 5.61, warn 5.78, crit
 * 6.69, accent 5.80. Nothing here puts warn on aqua-2, which fails at 4.498.
 *
 * SIZE. Monitor's Panel and Stat, so a module is p-3.5 lg:p-4 and a card
 * figure is text-row rather than text-head or text-stat. No literal font-mono
 * anywhere; tabular-nums lines the figures up.
 */

/* The five steps, in working order. */
const STEPS = [
  ['school',  'The Whole School'],
  ['list',    'Who to Check In With'],
  ['student', 'One Student'],
  ['urgent',  'Urgent Alerts'],
  ['agreed',  'What Guardians Agreed'],
]
const nextOf = id => {
  const i = STEPS.findIndex(s => s[0] === id)
  return i >= 0 && i < STEPS.length - 1 ? STEPS[i + 1] : null
}

/* The four safeguards, in the plainest words they can be put in. They are on
   the screen on every step, above the step itself, and nothing on this console
   can switch any of them off. Do not shorten these four lines away. */
const RULES = [
  'A medical professional sees only what a student agreed to share.',
  'A group smaller than five shows nothing at all.',
  'Every record opened is written down. No setting turns that off.',
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

/* src/lib/caseload.js still writes "Crisis alert" into the record, and this
   console calls the same thing an urgent alert everywhere else. One word, so
   the screen does not use two names for one thing. A referral's target keeps
   only its first clause: the rest of the string is the clinical phrase a
   counsellor should not have to read off a queue. */
const plain = t => t.replace('Crisis alert', 'Urgent alert')
const shortRef = t => t.split(':')[0]

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
      <PanelHead as="h3" title={`${SCORE} by Day of the Week`} meta="out of 100"/>
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
        <KV k="An average day" v={String(wAvg)}/>
      </dl>
      </div>
    </Panel>
  )
}

function School() {
  const all = roster()
  const visible = COHORT_PERIOD.filter(p => !p.suppressed)
  const avg = Math.round(visible.reduce((a, b) => a + b.mean, 0) / visible.length)
  const top = [...visible].sort((a, b) => b.mean - a.mean)[0]
  const hidden = COHORT_PERIOD.length - visible.length
  const wAvg = Math.round(COHORT_WEEKDAY.reduce((a, b) => a + b.mean, 0) / COHORT_WEEKDAY.length)
  return (
    <>
      <Lead title="Across the Whole School" meta={`${SCHOOL_N} consented students`}
        sentence={`${top.label.replace(' · ', ', ')} reads highest across the school.`}
        label="Highest class period" figure={top.mean} unit="out of 100" tone="text-warn"
        sub={`An average period reads ${avg}.`}>
        <p className="mt-2.5 max-w-[48ch] text-fine text-ink-2">
          All {SCHOOL_N} consented students, not the {all.length} you follow.</p>
      </Lead>

      <div className={ROW}>
        <Panel>
          <PanelHead as="h3" title={`${SCORE} by Class Period`} meta="bars start at zero"/>
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
          <Note>The upright line is the average period, {avg}. A pattern this size is a
            conversation with the school, never a finding about one student.</Note>
          {hidden > 0 && (
            <div className="mt-2.5 flex items-center gap-2.5">
              <HatchKey className="w-16 shrink-0"/>
              <p className="text-fine text-ink-2">Hatched means hidden: fewer than
                {' '}{K_ANONYMITY} students.</p>
            </div>
          )}
        </Panel>
      </div>

      <div className={ROW}>
        <SeeDetails label="See the week, day by day">
          <Weekday wAvg={wAvg}/>
        </SeeDetails>
      </div>
    </>
  )
}

/* ── Step 2. Who to check in with ───────────────────────────────────────── */

/* Three lines, which is what the seven-line paragraph and the five-row table
   of order rules came down to. Nobody with forty entries to read reads the
   long version, and the safeguards in it are in RULES above. */
const ORDER_RULES = [
  'A big move comes before a high score.',
  `A band says where a ${SCORE} sits today, never what a student is.`,
  'No raw reading, journal entry or place a student has been is on this list.',
]

/* The figure columns, named once on the rule the list hangs from. */
const ListHead = () => (
  <div aria-hidden className="mt-3 flex items-center gap-3 border-b border-ink pb-2">
    <span className="tick min-w-0 flex-1">student</span>
    <span className="hidden w-14 shrink-0 sm:block"/>
    <span className="tick w-10 shrink-0 text-right">move</span>
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

/* One plain sentence about the week, branched off the records the list is
   built from.

   WHAT IT MAY NOT SAY. This console reads a body against each student's own
   normal. A higher Mind Score is a body working harder than that student's
   own normal. It is not anxiety, not distress and not a diagnosis, and no
   sentence here may say that it is. */
const weekLine = rising =>
  !rising ? 'Nobody you follow is reading higher than last week.'
  : rising === 1 ? 'One student is reading higher than their own normal this week.'
  : `${cap(word(rising))} students are reading higher than their own normal this week.`

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
        label="Biggest move this week" tone={lead.velocity > 0 ? 'text-warn' : 'text-ink'}
        figure={`${lead.velocity > 0 ? '+' : ''}${lead.velocity}`} unit="points"
        sub={`${lead.name}, ${lead.weekAgo} to ${lead.current}.`}>
        <p className="mt-2.5 max-w-[48ch] text-fine text-ink-2">
          {all.length - moved.length} of {all.length} shared no weekly change. They are listed on
          their own below.</p>
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
          <PanelHead as="h3" title="Students to Open" meta="biggest change first"/>
          <ListHead/>
          <ol className="m-0 list-none p-0">
            {moved.map(s => <Row key={s.id} s={s} onOpen={onOpen} max={max}/>)}
          </ol>
        </Panel>
        <Panel>
          <PanelHead as="h3" title="Shared With Less" meta="not ordered"/>
          <SharedWithLess onOpen={onOpen}/>
        </Panel>
      </div>

      <div className={ROW}>
        <SeeDetails label="See how the order works">
          <Panel tone="aqua">
            <PanelHead as="h3" title="How the Order Works"/>
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

/* The record's own first line, held to the same limit as the console's: it
   says what this student's body did against their own normal, never what they
   felt, and never that anything is wrong with them. */
function recordLead(s, series) {
  if (!s.showScore) return `Nothing about ${s.name} reaches this console except an urgent alert.`
  if (!s.showTrend) return `${s.name} is reading ${s.current} out of 100 today. No weekly change is shared.`
  const fortnight = s.current - series[31].v
  if (s.velocity > 0 && fortnight > 0)
    return `${s.name} has been reading above their own normal for about two weeks.`
  if (s.velocity > 0) return `${s.name} read higher this week than last.`
  if (s.velocity < 0) return `${s.name} is reading lower this week than last.`
  return `${s.name} is level with last week.`
}

function OneStudent({ who, setWho }) {
  const [note, setNote] = React.useState('')
  const all = roster()
  const s = all.find(x => x.name === who) || all[0]
  /* Per student, not module constants: as constants every student on the
     board showed Student 8241's breakdown and 45-day line. */
  const drivers = driversFor(s).slice(0, 3)
  const series = profile45(s)
  const lo = Math.min(...series.map(p => p.v)), hi = Math.max(...series.map(p => p.v))
  const yspan = hi - lo || 1
  /* Gridlines off this student's own window. Fixed lines at 40, 60 and 80
     were drawn for every student, so a student whose 45 days ran 81 to 96 had
     all three ruled below the floor of the chart. */
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
            {/* The ring is written out rather than left to the global rule in
                src/input.css: that one is inside :where(), so it carries no
                specificity and any utility here would win. */}
            <select id="pick" value={s.name} onChange={e => setWho(e.target.value)}
              className="mt-1 min-h-[48px] max-w-full rounded-field border-0 border-b-2 border-ink
                bg-transparent px-1 font-body text-fine text-ink focus-visible:outline
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
              {all.map(x => <option key={x.id} value={x.name}>
                {x.name}{x.showScore ? ` · ${x.current}` : ' · not shared'}</option>)}
            </select>
          </div>
        </div>
        {/* Three figures, each drawn only as far as the agreement reaches, so
            a gap here is a decision a guardian made and not missing data. */}
        <div className="mt-3.5 grid grid-cols-2 gap-3 border-t border-rule pt-3.5 lg:grid-cols-3 lg:gap-4">
          <Stat label={`${SCORE} today`} value={s.showScore ? s.current : 'not shared'}
            unit={s.showScore ? 'of 100' : null}
            sub={s.showScore ? `${TIER_LABEL[s.tier]} today` : null}/>
          <Stat label="Change this week"
            value={s.showTrend ? `${s.velocity > 0 ? '+' : ''}${s.velocity}` : 'not shared'}
            unit={s.showTrend ? 'points' : null}
            sub={s.showTrend ? `${s.weekAgo} to ${s.current}` : null}/>
          <Stat className="col-span-2 lg:col-span-1" label="Agreed to share" value={agreed(s)}
            sub={`Signed ${s.signedAt}, runs out ${s.expires}.`}/>
        </div>
      </Panel>

      {!s.showScore && (
        <div className={ROW}>
          <Panel>
            <PanelHead as="h3" title="No Readings Shared"/>
            <List className="mt-3 max-w-[48ch] text-fine text-ink-2">
              <Item>The guardian agreed to urgent alerts and nothing else.</Item>
              <Item>You are paged if a reading raises one.</Item>
            </List>
          </Panel>
        </div>
      )}

      {s.showScore && !s.showTrend && (
        <div className={ROW}>
          <Panel>
            <PanelHead as="h3" title={`${SCORE} Today, ${s.current} Out of 100`}/>
            <List className="mt-3 max-w-[48ch] text-fine text-ink-2">
              <Item>The weekly change, the breakdown and the 45-day line are not shared.</Item>
              <Item>Urgent alerts still reach you.</Item>
            </List>
          </Panel>
        </div>
      )}

      {s.showTrend && <>
      <div className={ROW}>
        <Panel>
          <PanelHead as="h3" title="The Last 45 Days" meta="one point a day"/>
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
            <KV k="Lowest and highest over the window" v={`${lo} to ${hi}`}/>
            <KV k="Last two weeks" v={`${series[31].v} to ${s.current}`}/>
          </dl>
          <Note>The coloured stretch is the last two weeks. The scale is this student&rsquo;s own
            window, {lo} to {hi}. A score is not a diagnosis.</Note>
        </Panel>
      </div>

      <div className={ROW}>
        <SeeDetails label="See more about the student"
          sub="What moved, what has been tried, referrals and notes">
          {/* 7fr and 5fr: at 6 and 6 the right column ended 165px above the
              left one, which is a quarter of a screen of empty card stock. */}
          <div className="grid items-start gap-3 [&>*]:min-w-0 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-4">
            <div className="flex flex-col gap-3 lg:gap-4">
              <Panel tone="aqua">
                <PanelHead as="h3" title="What Moved Most" meta="share of this week"/>
                <ul className="m-0 mt-3 list-none p-0">
                  {drivers.map(d => (
                    <BarRow key={d.label} label={d.label}
                      figure={`${Math.round(d.share * 100)}%`}
                      pct={(d.share / drivers[0].share) * 100} tone="bg-accent"
                      aria={`${d.label}, ${Math.round(d.share * 100)} percent of this week's change`}/>
                  ))}
                </ul>
                <Note>Worked out against this student&rsquo;s own normal. Never a raw
                  reading.</Note>
              </Panel>
              <Panel>
                <PanelHead as="h3" title="What Has Been Tried" meta="measured, not reported"/>
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
                <Note>How much steadier the heartbeat was. One of the five did nothing
                  measurable and one reads worse; both stay.</Note>
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
                <PanelHead as="h3" title="Your Notes"/>
                <label htmlFor="cnote" className="sr-only">{PRO} note for {s.name}</label>
                <textarea id="cnote" rows={3} value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Add a note…"
                  className="mt-3 w-full resize-none rounded-field border-0 border-b-2 border-rule
                    bg-card p-3 text-fine text-ink placeholder:text-ink-3
                    focus-visible:border-ink focus-visible:outline focus-visible:outline-2
                    focus-visible:outline-offset-2 focus-visible:outline-accent"/>
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <span className="text-fine text-ink-3">Saving is written down</span>
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
  /* Derived rather than branched at the top: the steps are the practice's own
     document and stay on screen either way, unticked and untouchable. */
  const ticked = real ? [] : done
  const referrals = real ? [] : REFERRALS
  /* Today's lines. The whole record is never worth a screenful here; what the
     reader has to see is that opening anything writes one. */
  const log = real ? [] : AUDIT_LOG.filter(r => r.rel === 'Today')
  return (
    <>
      <Panel tone="brand" className="border-t-2 border-t-crit/40">
        <PanelHead title={real ? 'Urgent Alerts' : 'One Urgent Alert'}
          meta={real ? 'nothing open' : PROTOCOL_TIMES[0]}/>
        <p className="mt-3 max-w-[30ch] font-display text-row font-bold leading-[1.16] text-ink
          sm:text-head">
          {real ? 'No alert has been raised.'
                : 'An alert was raised for Student 8241 during AP Chemistry.'}</p>
        {real && <p className="mt-2 max-w-[52ch] text-fine text-ink-2">An alert is raised by a
          paired patch and by nothing else. Nobody can raise one by hand.</p>}
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
        {/* Finishing is one field and one control, in place of the dialog that
            used to open over this screen with four more paragraphs in it. */}
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
              {closed ? 'Finished' : 'Finish and write it down'}</Button>
          </div>
          {closed && (
            <p className="mt-2.5 border-l-2 border-accent py-1 pl-3 text-fine text-ink-2">
              Written down at {PROTOCOL_TIMES[PROTOCOL_TIMES.length - 1]}. The clock on this alert
              has stopped.
              <span className="mt-0.5 block text-fine text-ink-3">&ldquo;{what}&rdquo;</span></p>
          )}
        </div>
      </Panel>

      <div className={ROW}>
        <SeeDetails label="See referrals and the written record"
          sub="Every line here is kept whatever happens next">
          <div className="grid items-start gap-3 [&>*]:min-w-0 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-4">
            <Panel tone="aqua">
              <PanelHead as="h3" title="Referrals Open"/>
              <ul className="m-0 mt-2 list-none divide-y divide-rule p-0">
                {real && <BlankRow>No referral has been opened. A referral is written from a
                  student&rsquo;s record.</BlankRow>}
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
              <PanelHead as="h3" title="Who Looked, and When" meta="nothing can be deleted"/>
              <ul className="m-0 mt-2 list-none p-0">
                {real && <BlankRow>Nothing has been written yet. A line is written whenever anyone
                  opens a record, exports a figure or changes a setting.</BlankRow>}
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
              <Note>Today&rsquo;s lines. Every record opened is written down here, no setting on
                this console turns that off, and no line can be edited or deleted.</Note>
            </Panel>
          </div>
        </SeeDetails>
      </div>
    </>
  )
}

/* ── Step 5. What guardians agreed ──────────────────────────────────────── */

const FACTS = [
  ['Raw readings a parent can see', 'Never'],
  ['Raw readings you can see', 'Only if the student agrees'],
  ['Readings sold or passed to anyone else', 'Never'],
  ['Where a student has been, collected by default', 'No'],
]

function Agreed({ real }) {
  const rows = real ? [] : roster()
  const longest = Math.max(...RETENTION)
  return (
    <>
      <Panel tone="brand">
        <PanelHead title="What Each Guardian Agreed" meta={`${rows.length} signed`}/>
        <p className="mt-3 max-w-[48ch] text-fine text-ink-2">{CONSENT_SHORT} {CONSENT_OFF}</p>
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
        {/* The expiry is the same date on every signature in this set, so it is
            one line here rather than a column of eight identical cells. */}
        <Note>{rows.length ? `Every signature runs out ${rows[0].expires}. ` : ''}Urgent alerts
          reach you whatever a guardian signs, and no guardian can switch them off.</Note>
      </Panel>

      <div className={ROW}>
        <SeeDetails label="See how long readings are kept"
          sub="And who has looked at anything on this console">
          <div className="grid items-start gap-3 [&>*]:min-w-0 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-4">
            <Panel tone="aqua">
              <PanelHead as="h3" title="How Long Readings Are Kept"/>
              <p className="mt-3 max-w-[46ch] text-fine text-ink-2">The window starts at the
                shortest. When it closes the raw readings are deleted, with no copy kept.</p>
              <ul className="m-0 mt-3 list-none border-t border-rule p-0">
                {RETENTION.map(d => (
                  <BarRow key={d} label={d === RETENTION[0] ? `${d} days, the one it starts on` : `${d} days`}
                    figure={`${d} days`} pct={(d / longest) * 100}
                    tone={d === RETENTION[0] ? 'bg-accent' : 'bg-ink-3'}
                    aria={`${d} days${d === RETENTION[0] ? ', the one it starts on' : ''}`}/>
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
              <PanelHead as="h3" title="Taking a Copy" meta="both write a line"/>
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                <Button variant="outline" size="sm" disabled>Export the record</Button>
                <Button variant="outline" size="sm" disabled>Export what was agreed</Button>
              </div>
              <Note>Every export is written down beside every record anyone opened.</Note>
            </Panel>
          </div>
        </SeeDetails>
      </div>
    </>
  )
}

/* ── Nothing paired, which is every visitor's true state today ──────────── */

/* src/views/App.jsx renders its own start screen for this audience in real
   mode, so this is reached only if that changes. It is three lines and an
   action rather than the three screens of explanation it replaced. */
const WHAT_FILLS = [
  'A student pairs a patch on their own phone, and can unpair it the same way.',
  'A guardian signs what may be shared.',
  'Only what was signed for ever appears here.',
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

const NothingYet = ({ go }) => (
  <Panel tone="brand">
    <PanelHead title="No Readings Yet"/>
    <p className="mt-3 max-w-[28ch] font-display text-row font-bold leading-[1.16] text-ink
      sm:text-head">No student has paired a patch, so there is nobody to check in with.</p>
    <List className="mt-3 max-w-[54ch] text-fine text-ink-2">
      {WHAT_FILLS.map(t => <Item key={t}>{t}</Item>)}
    </List>
    <AskAi go={go} className="mt-3.5"/>
  </Panel>
)

/* ── The console ────────────────────────────────────────────────────────── */

export function Pro({ go }) {
  const [mode] = useMode()
  const real = mode === 'real'
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
    school:  () => real ? <NothingYet go={go}/> : <School/>,
    list:    () => real ? <NothingYet go={go}/> : <CheckIn onOpen={openStudent} onStep={onStep}/>,
    student: () => real ? <NothingYet go={go}/> : <OneStudent who={who} setWho={setWho}/>,
    urgent:  () => <Urgent real={real}/>,
    agreed:  () => <Agreed real={real}/>,
  }
  const at = STEPS.findIndex(s => s[0] === step)
  const nx = nextOf(step)
  return (
    <main>
      <Tabs value={step} onValueChange={onStep}>
        <div className="wrap !pt-4">
          <p aria-live="polite" className="sr-only text-fine">{said}</p>
          {/* The outcome, which is what the owner asked this screen to be
              named after, and not a protocol. */}
          <h2 className="max-w-[24ch] font-display text-row font-bold tracking-tight text-ink
            sm:text-head">Manage Stress Across the School</h2>
          {/* The four safeguards. They sit above the steps so they are on the
              screen on every step, and nothing on this console switches any
              of them off. */}
          <ul className="m-0 mt-2.5 grid list-none gap-x-5 gap-y-1 rounded-panel border
            border-rule bg-card p-3 sm:grid-cols-2 lg:p-3.5">
            {RULES.map(r => (
              <li key={r} className="min-w-0 text-fine text-ink-2">{r}</li>
            ))}
          </ul>
          {real
            ? <RealNotice className="mt-2.5" inline>No student has paired a patch and no guardian
                has signed, so there is nothing to read.</RealNotice>
            : <DemoNotice className="mt-2.5" inline>Every figure here is generated. No student was
                measured.</DemoNotice>}
        </div>

        {/* The five steps are this console's whole navigation, so they stay
            chrome: card ground, and from sm up stuck beneath the app's 48px
            top bar. At 390 the strip scrolls sideways rather than wrapping to
            three rows, which cost a third of the viewport.
            Contrast on card #ffffff: ink 15.20, ink-2 8.25. */}
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
          {/* Where the reader is, and the one action this console hands off:
              MindMap AI, which src/views/App.jsx routes and another worker
              builds. Nothing on this screen answers anything. */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="tick">Step {at + 1} of {STEPS.length} · {STEPS[at][1]}</p>
            <AskAi go={go}/>
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
