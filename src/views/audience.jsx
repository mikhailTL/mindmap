import React from 'react'
import { Frame } from '../ui/frame'
import { Button } from '../ui/button'
import { ArrowLeft, ArrowRight, Check, Never } from '../ui/marks'
import { Section, SectionHead, SectionLede } from '../ui/section'
import { DemoNotice } from '../ui/notice'
import { Progress } from '../ui/progress'
import { WeekChart } from '../charts/week'
import { Bars, RainbowDial } from '../charts/rainbow'
import { Spark } from '../charts/primitives'
import { studentRings } from '../lib/readings'
import { SENSORS } from '../lib/sensors'
import { DATA } from '../lib/assets'
import { CHART_DATA } from '../lib/chartdata'
import { COHORT_PERIOD, COHORT_WEEKDAY, K_ANONYMITY, SCHOOL_N, TIER_LABEL, roster }
  from '../lib/caseload'
import { ScrollIn, ScrollRow } from '../ui/motion'
import { cn } from '../lib/utils'
import {
  CASELOAD_DEF, CASELOAD_TITLE, CONSENT_SHORT, LOCATION, NOTES, SCORE,
  SCORE_RANGE, PRO, PRO_LC, PRO_FOR,
} from '../lib/terms'

/* The three audience routes: students, parents, medical professionals. Each
   page is a hero, at most three sections and a closer. The consent model and
   the wording in lib/terms.js are the facts; the layout is held to
   docs/design-spec.md. Every frame is a licensed stock photograph of models:
   nobody in one uses MindMap, and no alt text may say otherwise. */

const PANEL = 'overflow-hidden rounded-panel border border-rule bg-card'
const HEAD = 'max-w-none border-b border-rule bg-aqua px-3.5 py-2 font-display text-fine font-bold leading-tight text-ink'
/* Spec 0d rule 4: a frame holding a face is at least 176px tall. */
const PHOTO_H = 'h-[184px] sm:h-[240px] md:h-[320px] lg:h-[268px]'

/* A card of labelled rows: a label and its value, never a label over a
   paragraph. `photo` makes the card's top edge a banner. */
function Facts({ rows, head, photo, photoAlt, className }) {
  return (
    <div className={cn(PANEL, className)}>
      {photo && (
        <div className={cn('border-b border-rule', PHOTO_H)}>
          <Frame photo={photo} alt={photoAlt} eager/>
        </div>
      )}
      {head && <p className={HEAD}>{head}</p>}
      {rows.map(([label, value], i) => (
        <div key={label} className={cn('px-3.5 py-2', i && 'border-t border-rule')}>
          <p className="font-display text-fine font-bold leading-tight text-ink">{label}</p>
          <p className="mt-0.5 text-meta leading-[1.35] text-ink-2">{value}</p>
        </div>
      ))}
    </div>
  )
}

/* A card of chips, one per thing the audience is never given. */
function Chips({ head, rows, className }) {
  return (
    <div className={cn(PANEL, 'flex h-full flex-col', className)}>
      <p className={HEAD}>{head}</p>
      <ul className="m-0 grid list-none gap-1.5 p-3.5">
        {rows.map(t => (
          <li key={t} className="flex items-start gap-2 rounded-field border border-rule
            px-2.5 py-1.5 text-meta leading-[1.3] text-ink-2">
            <Never aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-3"/>{t}
          </li>
        ))}
      </ul>
    </div>
  )
}

/* DemoNotice is attached here so a figure cannot lose its "generated" line.
   `aside` is the photograph of the people a chart is about, drawn from 2xl
   only: below that it took the room the figure needs. */
function Fig({ title, aside, asideAlt, children, className }) {
  const body = (
    <div className="min-w-0 p-3.5 lg:p-4">
      {children}
      <DemoNotice className="mt-3"/>
    </div>
  )
  return (
    <figure className={cn(PANEL, 'm-0 flex flex-col', className)}>
      {title && <figcaption className={HEAD}>{title}</figcaption>}
      {aside ? (
        <div className="grid min-w-0 flex-1 2xl:grid-cols-[minmax(0,1fr)_minmax(0,230px)]">
          {body}
          <div className="hidden border-l border-rule 2xl:block">
            <Frame photo={aside} alt={asideAlt} eager/>
          </div>
        </div>
      ) : body}
    </figure>
  )
}

/* A figure beside its reading notes: one column on a phone, two from lg. */
function Pair({ children, wide }) {
  return (
    <div className={cn('mt-3 grid gap-3 lg:gap-4',
      wide ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]' : 'lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]')}>
      {children}
    </div>
  )
}

/* ───────────────────────────── shared page parts ───────────────────────── */

function Hero({ label, title, lede, go, photo, photoAlt, facts, ground }) {
  return (
    <div className={cn('border-b border-rule', ground || 'bg-aqua')}>
      <div className="wrap grid gap-3 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,38%)]
        lg:items-end lg:gap-5 lg:py-7">
        <div className="min-w-0">
          <button onClick={() => go('site')}
            className="mb-3 flex min-h-[44px] w-fit items-center gap-2 py-2 font-display text-meta
              font-medium text-accent transition-colors duration-150 hoverOnly:text-accent-ink">
            <ArrowLeft aria-hidden className="size-4"/> Overview
          </button>
          <p className="font-body text-ui font-semibold text-accent-ink">{label}</p>
          <h1 className="mt-2 max-w-[16ch] font-display text-major font-bold leading-[1.06]
            tracking-tight text-ink">{title}</h1>
          {lede && (
            <p className="mt-3 max-w-[42ch] text-sec font-medium leading-[1.35] text-ink">{lede}</p>
          )}
          <Facts className="mt-3 lg:max-w-[36rem]" rows={facts}/>
        </div>
        {photo && (
          <div className={cn(PANEL, 'h-[190px] sm:h-[240px] md:h-[320px] lg:h-[320px]')}>
            <Frame photo={photo} alt={photoAlt} eager/>
          </div>
        )}
      </div>
    </div>
  )
}

function Closer({ title, line, label, view, go, rows, ground }) {
  return (
    <Section tone="paper" tight className={ground}>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-4">
        <div className="min-w-0">
          <SectionHead>{title}</SectionHead>
          {line && <SectionLede>{line}</SectionLede>}
          <Button size="sm" className="mt-3" onClick={() => go(view)}>
            {label} <ArrowRight aria-hidden/>
          </Button>
        </div>
        <Facts rows={rows} className="self-end"/>
      </div>
    </Section>
  )
}

const STOCK = ['The photographs', 'These are licensed stock photos of models. Nobody shown uses MindMap.']
const HALLWAY = ['students-hallway',
  'Four high school students walking along a bright corridor with folders and backpacks']

/* ═══════════════════════════════ for students ═══════════════════════════ */

/* Read only; the interactive key is on the app screen. One ground step per
   tile, in the rainbow's own order, tells the four apart. */
const SIGNAL_GROUND = ['bg-aqua', 'bg-aqua-2', 'bg-accent-wash', 'bg-beam-wash']

function Signals({ rings }) {
  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-2.5 p-0 lg:gap-3">
      {rings.map((r, i) => {
        const s = SENSORS[r.id]
        const Icon = s.icon
        return (
          <li key={r.id} className={cn('rounded-field border border-rule p-3',
            SIGNAL_GROUND[i] || 'bg-aqua')}>
            <span className="flex items-center gap-2">
              <Icon aria-hidden className="size-4 shrink-0" style={{ color: s.glow }}/>
              <span className="font-display text-ui font-bold leading-tight text-ink">{s.name}</span>
            </span>
            <span className="mt-2 flex items-baseline gap-1.5">
              <span className="text-num tabular-nums leading-none text-ink">{r.value}</span>
              <span className="text-fine text-ink-3">of 100</span>
            </span>
            <Progress value={r.value} tone={s.glow} label={`${s.name}, ${r.value} out of 100`}
              className="mt-2 h-1.5"/>
          </li>
        )
      })}
    </ul>
  )
}

export function ForStudents({ go }) {
  const rings = React.useMemo(() => studentRings(), [])
  const band = DATA.weekBand || { hi: 1 }
  const days = DATA.week || []
  const over = days.filter(d => d.v > band.hi).length

  return (
    <main>
      <Hero go={go} label="For students" ground="bg-accent-wash" photo="student-hero"
        photoAlt="A teenager in headphones sitting in front of a sofa, holding a games controller"
        title="See your stress as a number"
        lede="One Mind Score a day, so you can act on your stress."
        facts={[
          ['One number a day', `Your ${SCORE} runs from ${SCORE_RANGE}, measured against your own usual.`],
          ['Nothing shared by default', 'Nothing is shared until you choose to share it.'],
          STOCK,
        ]}/>

      <Section tone="card" tight>
        <SectionHead>Your {SCORE} today</SectionHead>
        <Pair>
          <ScrollIn>
            <Fig title="The dial and the four signals" aside="student-game"
              asideAlt="Three teenage boys sitting on a sofa with games controllers and headphones">
              <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center lg:gap-6">
                <RainbowDial score={62} usual={51} rings={rings} size={320}/>
                <div className="w-full min-w-0"><Signals rings={rings}/></div>
              </div>
            </Fig>
          </ScrollIn>
          <ScrollIn>
            <Facts head="How to read the dial" rows={[
              ['Each ring', 'Each ring shows one body signal against your own last fourteen days.'],
              ['The mark on the arc', 'The mark shows where a usual day sits for you.'],
              ['Movement', 'Movement tells the app a hard run apart from a hard day.'],
            ]}/>
          </ScrollIn>
        </Pair>
      </Section>

      <Section tone="paper" className="bg-aqua-2" tight>
        <SectionHead>Your week at a glance</SectionHead>
        <Pair>
          <ScrollIn>
            <Fig title="The last seven days" aside={HALLWAY[0]} asideAlt={HALLWAY[1]}>
              <WeekChart data={DATA.week} band={DATA.weekBand}/>
            </Fig>
          </ScrollIn>
          <ScrollIn>
            <Facts head="How to read the chart" rows={[
              ['Days above your range', `${over} of ${days.length} days this week ran above your usual range.`],
              ['The shaded band', 'The band is your usual range, built from your last fourteen days.'],
            ]}/>
          </ScrollIn>
        </Pair>
      </Section>

      <Section tone="card" tight>
        <SectionHead>Who can see your score</SectionHead>
        <Pair wide>
          <ScrollIn>
            <Facts head="How sharing works" photo="friends-steps"
              photoAlt="Two students sitting on concrete steps outside a building, heads together over an open notebook"
              rows={[
                ['Who opens the account', 'A guardian opens the account. You choose what is shared after that.'],
                ['Shared per person', `Sharing with a parent does not share with a ${PRO_LC}. You set each one on its own.`],
                ['Switching off', 'You can switch any sharing off at any time.'],
                ['What a parent can see at most', `A parent sees one ${SCORE} a day and which days ran high.`],
                [`What a ${PRO_LC} can see at most`, `A ${PRO_LC} sees your ${SCORE} and the direction it moved.`],
              ]}/>
          </ScrollIn>
          <ScrollIn>
            <Chips head="What never leaves your phone"
              rows={[NOTES, LOCATION, 'Any raw reading', 'Anything you type in the app']}/>
          </ScrollIn>
        </Pair>
      </Section>

      <Closer go={go} view="app-student" ground="bg-beam-wash"
        label="Open the student screen" title="Try the student screen"
        line="The demo uses sample readings."
        rows={[
          ['Four tabs', 'The screen has Today, Reading, Toolkit and Sharing.'],
          ['No account needed', 'Nothing leaves your phone.'],
          ['No patch needed', 'The demo opens on a sample day already filled in.'],
        ]}/>
    </main>
  )
}

/* ═══════════════════════════════ for parents ════════════════════════════ */

/* Consent scope for a parent. Moving a row between these lists is a consent
   change. */
const SEEN = [`One ${SCORE} a day`, 'Which days ran high', 'When the patch stops reporting']
const UNSEEN = ['Any raw reading', NOTES, LOCATION, 'Anything in real time']

function SeenUnseen() {
  return (
    <>
      {[['Shared with you', SEEN, true], ['Never shared with you', UNSEEN, false]]
        .map(([head, rows, yes], ci) => (
          <ScrollRow key={head} index={ci} className="h-full">
            <div className={cn(PANEL, 'flex h-full flex-col')}>
              <h3 className={HEAD}>{head}</h3>
              <ul className="m-0 grid list-none gap-1.5 p-3.5">
                {rows.map(r => (
                  <li key={r} className="flex items-start gap-2 rounded-field border border-rule
                    px-2.5 py-1.5 text-meta leading-[1.3] text-ink-2">
                    {yes ? <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-accent"/>
                         : <Never aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-3"/>}
                    <span className="min-w-0">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollRow>
        ))}
    </>
  )
}

export function ForParents({ go }) {
  const band = DATA.weekBand || { hi: 1 }
  const days = DATA.week || []
  const over = days.filter(d => d.v > band.hi).length

  return (
    <main>
      <Hero go={go} label="For parents" ground="bg-beam-wash" photo="parent-hero"
        photoAlt="A mother and her teenage child smiling at an open laptop together at home"
        title="See how your teen's week went"
        lede="One Mind Score a day for your child, and which days ran high."
        facts={[
          ['One score a day', 'A day is the finest detail you see. You never see an hour or a moment.'],
          ['Never shown to you', `You never see a raw reading, ${NOTES} or ${LOCATION}.`],
          STOCK,
        ]}/>

      <Section tone="card" tight>
        <SectionHead>Heads Up</SectionHead>
        <SectionLede>Heads Up tells you when phone activity is causing your teen stress.</SectionLede>
        <Button size="sm" className="mt-3" onClick={() => go('heads-up')}>
          See Heads Up <ArrowRight aria-hidden/>
        </Button>
      </Section>

      <Section tone="paper" className="bg-aqua-2" tight>
        <SectionHead>Your child's week</SectionHead>
        <SectionLede>A high day is a good reason to be around that evening.</SectionLede>
        <Pair>
          <ScrollIn>
            <Fig title="The last seven days" aside="parent-kitchen"
              asideAlt="A mother and her teenage son chopping vegetables side by side at a kitchen counter">
              <WeekChart data={DATA.week} band={DATA.weekBand}/>
            </Fig>
          </ScrollIn>
          <ScrollIn>
            <Facts head="How to read the chart" rows={[
              ['Days above their range', `${over} of ${days.length} days this week ran above your child's usual range.`],
              ['The shaded band', `The band is your child's usual range, built from their last fourteen days.`],
              ['What the chart leaves out', 'The chart never says what happened in the day. MindMap does not record that.'],
            ]}/>
          </ScrollIn>
        </Pair>
      </Section>

      <Section tone="card" tight>
        <SectionHead>What you see and never see</SectionHead>
        <div className="mt-3 grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          <SeenUnseen/>
          <ScrollIn className="sm:col-span-2 lg:col-span-1">
            <Facts head="Who decides what is shared" rows={[
              ['Who decides', CONSENT_SHORT],
              ['Shared per person', `What your child shares with you does not go to a ${PRO_LC}.`],
              ['Switching off', 'The student can switch sharing off at any time.'],
              ['Not a diagnosis', 'MindMap is not a medical device and does not diagnose anything.'],
              ['No ranking', 'Your child is never compared with another student.'],
            ]}/>
          </ScrollIn>
        </div>
      </Section>

      <Closer go={go} view="app-parent" ground="bg-accent-wash"
        label="Open the parent screen" title="Try the parent screen"
        line="The demo uses sample readings."
        rows={[
          ['Opens on the week', `You see one ${SCORE} a day.`],
          ['Crisis alerts', 'A crisis alert always reaches a guardian. Nobody can switch that off.'],
        ]}/>
    </main>
  )
}

/* ═══════════════════════════ for medical professionals ══════════════════ */

/* `Bars` takes a paint, not a class; #157446 is the accent token. */
const ACCENT = '#157446'
const SCHOOL_WEEK = COHORT_WEEKDAY.map(d => ({ label: d.label, v: d.mean }))

/* Ordered on the week's movement, as CASELOAD_DEF states above the table. */
const BOARD = roster().filter(s => s.showTrend).sort((a, b) => b.velocity - a.velocity)
const SERIES = name => CHART_DATA.pro?.[name.replace(/\D/g, '')]

function Caseload() {
  return (
    <table className="w-full border-collapse text-left">
      <caption className="sr-only">{CASELOAD_TITLE}</caption>
      <thead>
        <tr className="border-b border-ink font-display text-fine font-bold text-ink-2">
          <th scope="col" className="py-2.5 pr-3">Student</th>
          <th scope="col" className="hidden py-2.5 pr-3 sm:table-cell">Seven weeks</th>
          <th scope="col" className="py-2.5 pl-2 text-right">Last week</th>
          <th scope="col" className="py-2.5 pl-2 text-right">This week</th>
          <th scope="col" className="py-2.5 pl-2 text-right">Change</th>
        </tr>
      </thead>
      <tbody>
        {BOARD.map(s => (
          <tr key={s.id}>
            <th scope="row" className="border-b border-rule py-2.5 pr-3 text-left font-normal">
              <span className="block text-meta text-ink">{s.name}</span>
              <span className="block font-display text-fine font-bold text-ink-3">
                Grade {s.grade}. {TIER_LABEL[s.tier]}</span>
            </th>
            <td className="hidden border-b border-rule py-2.5 pr-3 sm:table-cell">
              {/* A blank cell reads as a bug, so a missing series is a flat rule. */}
              {SERIES(s.name)
                ? <Spark data={SERIES(s.name)}/>
                : <span aria-hidden className="block h-px w-16 bg-ruling"/>}
            </td>
            <td className="border-b border-rule py-2.5 pl-2 text-right text-meta
              tabular-nums text-ink-3">{s.weekAgo}</td>
            <td className="border-b border-rule py-2.5 pl-2 text-right text-num
              tabular-nums text-ink">{s.current}</td>
            {/* The arrow carries the direction; warn and crit are not for a
                week-on-week change. */}
            <td className={cn('border-b border-rule py-2.5 pl-2 text-right text-meta tabular-nums',
              s.velocity ? 'text-ink' : 'text-ink-3')}>
              {s.velocity > 0 ? '▲ +' : s.velocity < 0 ? '▼ ' : ''}{s.velocity}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* k-anonymity floor: a period under K_ANONYMITY renders as a withheld row.
   Never print a mean for a suppressed row. */
function SmallGroups() {
  return (
    <ul className="m-0 list-none p-0">
      {COHORT_PERIOD.map(c => (
        <li key={c.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2
          border-t border-rule py-2.5 sm:grid-cols-[minmax(0,14rem)_minmax(5rem,1fr)_4.5rem]">
          <span className="order-1 min-w-0">
            <span className="block font-display text-meta font-bold text-ink">{c.label}</span>
            <span className="block text-fine text-ink-3">{c.n} students</span>
          </span>
          <span className="order-3 col-span-2 sm:order-2 sm:col-span-1">
            {c.suppressed ? (
              <span className="block font-display text-fine text-ink-3">
                Fewer than {K_ANONYMITY} students, so nothing is shown</span>
            ) : (
              <Progress value={c.mean} label={`${c.label}, average ${c.mean}`} className="h-2.5"/>
            )}
          </span>
          <span className="order-2 text-right text-meta tabular-nums text-ink sm:order-3">
            {c.suppressed ? 'hidden' : c.mean}</span>
        </li>
      ))}
    </ul>
  )
}

export function ForSchools({ go }) {
  const suppressed = COHORT_PERIOD.filter(c => c.suppressed).length
  const peak = COHORT_WEEKDAY.reduce((a, b) => (b.mean > a.mean ? b : a))

  return (
    <main>
      <Hero go={go} label={PRO_FOR} ground="bg-aqua-2" photo="clinic-talk"
        photoAlt="A teenager and an adult sitting and talking on a sofa by a sunlit window"
        title="See trends across your students"
        lede="You see which students moved most since last week, and how groups are trending."
        facts={[
          ['What you see', `Each student's ${SCORE} and the direction it moved.`],
          ['Never shown to you', `A raw reading, ${NOTES}, ${LOCATION}, or any group under ${K_ANONYMITY} students.`],
          STOCK,
        ]}/>

      <Section tone="card" tight>
        <SectionHead>Stress across all your students</SectionHead>
        <Pair>
          <ScrollIn>
            <Fig title={`Average ${SCORE} by school day`} aside={HALLWAY[0]} asideAlt={HALLWAY[1]}>
              {/* Width cap: at 1360px each of the five bars is wider than it is tall. */}
              <Bars data={SCHOOL_WEEK} color={ACCENT} unit="school day" className="max-w-[640px]"/>
            </Fig>
          </ScrollIn>
          <ScrollIn>
            <Facts head="How to read the chart" rows={[
              ['Students in the chart', `${SCHOOL_N} students, all of whom chose to share with a ${PRO_LC}.`],
              ['Highest day', `${peak.full} ran highest, with an average of ${peak.mean}.`],
              ['Not a ranking', 'No single student can be picked out of this chart.'],
            ]}/>
          </ScrollIn>
        </Pair>
      </Section>

      <Section tone="paper" className="bg-accent-wash" tight>
        <SectionHead>{CASELOAD_TITLE}</SectionHead>
        <SectionLede>{CASELOAD_DEF}</SectionLede>
        <Pair>
          <ScrollIn>
            <Fig title="Last week against this week">
              <Caseload/>
            </Fig>
          </ScrollIn>
          <ScrollIn>
            <Facts head="Who is on the list" rows={[
              ['On the list', `${BOARD.length} students, all of whom agreed to share trends.`],
              ['Off the list', 'Students who share only a score, or only alerts, are not listed.'],
              ['Why change, not score', 'A student steady at 86 for a month is not a change.'],
            ]}/>
          </ScrollIn>
        </Pair>
      </Section>

      {/* Consent scope for a medical professional: the k-anonymity floor and
          the audit log, both product-critical, in one section. */}
      <Section tone="card" tight>
        <SectionHead>Who can open a record</SectionHead>
        <Pair>
          <ScrollIn>
            <Fig title={`Average ${SCORE} by class period`}>
              <SmallGroups/>
            </Fig>
          </ScrollIn>
          <div className="flex flex-col gap-3 lg:gap-4">
            <ScrollIn>
              <Facts head="Why small groups show nothing" rows={[
                ['The rule', `A group needs at least ${K_ANONYMITY} students. Below that, no average is computed or shown.`],
                ['Hidden here', `${suppressed} of ${COHORT_PERIOD.length} periods are under the limit.`],
                ['Cannot be turned off', 'No setting anywhere in MindMap turns this rule off.'],
              ]}/>
            </ScrollIn>
            <ScrollIn>
              <Facts head="How the audit log works" rows={[
                ['Every record opened', 'Every record you open is logged, with who opened it and when.'],
                ['No setting turns it off', 'Nobody can switch the log off, including us.'],
                ['Consent is per student', 'You see only what each student agreed to share.'],
                ['Crisis alerts', 'A crisis alert always reaches you. No guardian can switch that off.'],
              ]}/>
            </ScrollIn>
          </div>
        </Pair>
      </Section>

      <Closer go={go} view="app-pro" ground="bg-beam-wash" label={`Open the ${PRO} screen`}
        title={`Try the ${PRO} screen`}
        line="The demo uses sample students."
        rows={[
          ['Opens on the list', CASELOAD_TITLE + '.'],
          ['The consent tab', 'The consent tab shows what each guardian signed and when it expires.'],
          ['The audit tab', 'The audit tab lists every record opened, in order, never cleared.'],
        ]}/>
    </main>
  )
}
