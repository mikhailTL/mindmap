import React from 'react'
import { Frame } from '../ui/frame'
import { Button } from '../ui/button'
import { ArrowLeft, ArrowRight, Check, Never } from '../ui/marks'
import { Section, SectionHead, SectionLede } from '../ui/section'
import { Progress } from '../ui/progress'
import { WeekChart } from '../charts/week'
import { DayChart } from '../charts/day'
import { Bars, RainbowDial } from '../charts/rainbow'
import { Spark } from '../charts/primitives'
import { studentRings } from '../lib/readings'
import { SENSORS } from '../lib/sensors'
import { DATA } from '../lib/assets'
import { CHART_DATA } from '../lib/chartdata'
import { COHORT_PERIOD, COHORT_WEEKDAY, K_ANONYMITY, SCHOOL_N, TIER_LABEL, roster }
  from '../lib/caseload'
import { ScrollIn, ScrollRow } from '../ui/motion'
import { CalendarLegend, FACE_MEANS, FACE_WORD, MonthCalendar, longDay } from './calendar'
import { TEEN } from './student/demoTeen'
import { LampFace } from '../traffic/Face'
import { TrafficLight } from './pro/look'
import { cn } from '../lib/utils'
import { cardClass, cardInk } from '../ui/card'
import {
  CASELOAD_DEF, CASELOAD_TITLE, CONSENT_SHORT, LOCATION, NOTES, SCORE,
  SCORE_DEF, PRO, PRO_LC, PRO_FOR,
} from '../lib/terms'

// The three audience pages (students, parents, counselors/professionals) and the parts they share.
const PANEL = 'overflow-hidden rounded-panel border border-rule bg-card'
const HEAD = 'max-w-none border-b border-rule bg-aqua px-3.5 py-2 font-display text-fine font-bold leading-tight text-ink'

// ink-3 clears 4.9:1 on every ground here, and each label ink clears 5.3:1 on its hero.
const THEME = {
  students: { hero: 'bg-[#ecf8f2]', block: 'bg-sky-band', label: 'text-mint-ink',
    a: 'bg-sky-wash', b: 'bg-mint-wash' },
  parents:  { hero: 'bg-[#ebf5fd]', block: 'bg-sun-wash', label: 'text-sky-ink',
    a: 'bg-accent-wash', b: 'bg-sky-wash' },
  pro:      { hero: 'bg-[#e2f2f0]', block: 'bg-lilac-wash', label: 'text-beam-ink',
    a: 'bg-sky-wash', b: 'bg-beam-wash' },
}

function Facts({ rows, head, photo, photoAlt, className, variant = 'plain', hue = 'accent' }) {
  const t = cardInk(variant, hue)
  const flat = variant === 'rule'
  return (
    <div className={cn(cardClass(variant, hue), 'overflow-hidden', className)}>
      {photo && (
        <div className="h-[184px] border-b border-rule sm:h-[240px] md:h-[320px] lg:h-[268px]">
          <Frame photo={photo} alt={photoAlt}/>
        </div>
      )}
      {head && (
        <p className={cn(variant === 'plain' ? HEAD
          : cn('max-w-none border-b py-2 font-display text-fine font-bold leading-tight', t.line, t.head,
            flat ? 'px-0 pt-2.5' : 'px-3.5'))}>{head}</p>
      )}
      {rows.map(([label, value], i) => (
        <div key={label} className={cn(flat ? 'py-2' : 'px-3.5 py-2', i && cn('border-t', t.line))}>
          <p className={cn('font-display text-fine font-bold leading-tight', t.head)}>{label}</p>
          <p className={cn('mt-0.5 text-meta leading-[1.35]', t.body)}>{value}</p>
        </div>
      ))}
    </div>
  )
}

function Chips({ head, rows, className, variant = 'plain', hue = 'accent' }) {
  const t = cardInk(variant, hue)
  return (
    <div className={cn(cardClass(variant, hue), 'flex h-full flex-col overflow-hidden', className)}>
      <p className={variant === 'plain' ? HEAD
        : cn('max-w-none border-b px-3.5 py-2 font-display text-fine font-bold leading-tight', t.line, t.head)}>{head}</p>
      <ul className="m-0 grid list-none gap-1.5 p-3.5">
        {rows.map(t2 => (
          <li key={t2} className={cn('flex items-start gap-2 rounded-field border px-2.5 py-1.5 text-meta leading-[1.3] text-ink-2',
            variant === 'plain' ? 'border-rule' : cn(t.line, 'bg-card/70'))}>
            <Never aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-3"/>{t2}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Fig({ title, children, className, fill }) {
  return (
    <figure className={cn(PANEL, 'm-0 flex flex-col', fill && 'h-full', className)}>
      {title && (
        <figcaption className={cn(HEAD, 'flex items-baseline justify-between gap-3')}>
          {title}<span className="shrink-0 font-medium text-ink-2">Demo</span>
        </figcaption>
      )}
      <div className={cn('min-w-0 p-3.5 lg:p-4', fill && 'flex flex-1 flex-col justify-center')}>{children}</div>
    </figure>
  )
}

// A frame holding a face is at least 176px tall; Frame grows the box if the photograph needs more.
function Photo({ photo, alt, block, eager, className }) {
  return (
    <div className={cn('relative pb-3 pr-3', className)}>
      {block && <span aria-hidden className={cn('absolute bottom-0 left-8 right-0 top-8 rounded-[20px]', block)}/>}
      <div className={cn(PANEL, 'relative h-full')}>
        <Frame photo={photo} alt={alt} eager={eager}/>
      </div>
    </div>
  )
}

function Pair({ children, wide }) {
  return (
    <div className={cn('mt-3 grid gap-3 lg:gap-4',
      wide ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]' : 'lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]')}>
      {children}
    </div>
  )
}

function Side({ photo, alt, block, children }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 lg:gap-4">
      {photo && (
        <ScrollIn>
          <Photo photo={photo} alt={alt} block={block} className="h-[220px] sm:h-[300px] lg:h-[236px]"/>
        </ScrollIn>
      )}
      <ScrollIn>{children}</ScrollIn>
    </div>
  )
}

export function HeadsUp({ size = 9, className }) {
  return (
    <span className={cn('whitespace-nowrap', className)}>
      <TrafficLight size={size} horizontal cycle={false}
        className="mr-[0.35em] align-middle"/>Heads Up
    </span>
  )
}

function HeadsUpBand({ line, go, ground, photo, photoAlt, block }) {
  return (
    <Section tone="card" tight className={ground}>
      <div className={cn('grid gap-4', photo && 'lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-center lg:gap-8')}>
        <div className="min-w-0">
          <SectionHead><HeadsUp size={14}/></SectionHead>
          <SectionLede>{line}</SectionLede>
          <Button size="sm" className="mt-3" onClick={() => go('heads-up')}>
            See how it works <ArrowRight aria-hidden/>
          </Button>
        </div>
        {photo && (
          <ScrollIn>
            <Photo photo={photo} alt={photoAlt} block={block} className="h-[220px] sm:h-[300px] lg:h-[260px]"/>
          </ScrollIn>
        )}
      </div>
    </Section>
  )
}

function Hero({ label, title, lede, go, photo, photoAlt, facts, theme }) {
  return (
    <div className={cn('border-b border-rule', theme.hero)}>
      <div className="wrap grid gap-4 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,46%)]
        lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:gap-y-4 lg:py-8">
        <div className="min-w-0">
          <button onClick={() => go('site')}
            className="mb-3 flex min-h-[44px] w-fit items-center gap-2 py-2 font-display text-meta
              font-medium text-accent transition-colors duration-150 hoverOnly:text-accent-ink">
            <ArrowLeft aria-hidden className="size-4"/> Overview
          </button>
          <p className={cn('font-body text-ui font-semibold', theme.label)}>{label}</p>
          <h1 className="mt-2 max-w-[16ch] font-display text-major font-bold leading-[1.06]
            tracking-tight text-ink">{title}</h1>
          {lede && (
            <p className="mt-3 max-w-[42ch] text-sec font-medium leading-[1.35] text-ink">{lede}</p>
          )}
        </div>
        <Photo photo={photo} alt={photoAlt} block={theme.block} eager
          className="h-[240px] sm:h-[340px] md:h-[400px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-auto lg:min-h-[420px]"/>
        <Facts className="lg:max-w-[36rem] lg:self-end" rows={facts}/>
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
          {/* Wraps: the longest label is half a pixel wider than a 390px phone allows. */}
          <Button size="sm" className="mt-3 max-w-full whitespace-normal text-left"
            onClick={() => go(view)}>
            {label} <ArrowRight aria-hidden/>
          </Button>
        </div>
        <Facts rows={rows} variant="outline" className="self-end"/>
      </div>
    </Section>
  )
}

function ScoreExplain({ rings, rows, photo, photoAlt, block }) {
  return (
    <Pair>
      <ScrollIn className="h-full">
        <Fig title="One number, 0 to 100" fill={!!photo}>
          <div className="flex justify-center">
            <RainbowDial score={62} usual={51} rings={rings} size={320}/>
          </div>
        </Fig>
      </ScrollIn>
      <Side photo={photo} alt={photoAlt} block={block}>
        <Facts head="How to read the dial" rows={rows} variant="rule" hue="accent"/>
      </Side>
    </Pair>
  )
}

const RANGE_LABEL = { day: 'Day', week: 'Week', month: 'Month' }
const TEEN_TODAY = TEEN.days.length ? TEEN.days[TEEN.days.length - 1].date : null

function RangeSwitch({ ranges, value, onChange }) {
  return (
    <div role="group" aria-label="Choose a time range"
      className="inline-flex overflow-hidden rounded-field border border-rule">
      {ranges.map(r => (
        <button key={r} type="button" aria-pressed={value === r} onClick={() => onChange(r)}
          className={cn('min-h-[44px] min-w-[4.5rem] px-4 font-display text-ui font-medium',
            'transition-colors duration-150 focus-visible:outline focus-visible:outline-2',
            'focus-visible:-outline-offset-2 focus-visible:outline-accent',
            value === r ? 'bg-accent-wash text-accent-ink shadow-[inset_0_-3px_0_#157446]' : 'bg-card text-ink hoverOnly:bg-aqua')}>
          {RANGE_LABEL[r]}
        </button>
      ))}
    </div>
  )
}

function PickedDay({ d }) {
  if (!d || d.score == null) return null
  return (
    <p aria-live="polite" className="m-0 mt-3 flex items-center gap-3 rounded-field border border-rule
      bg-aqua px-3 py-2.5">
      {d.light && <LampFace light={d.light} size={32}/>}
      <span className="min-w-0 text-meta leading-[1.35] text-ink-2">
        <b className="block font-display font-bold text-ink">{longDay(d.date)}</b>
        {SCORE} {d.score}{d.light ? `. ${FACE_WORD[d.light]}: ${FACE_MEANS[d.light].toLowerCase()}.` : '.'}
      </span>
    </p>
  )
}

function TrendsFig({ ranges }) {
  const shown = ranges.filter(r => r !== 'day' || (DATA.day && DATA.day.length))
  const [range, setRange] = React.useState(shown.includes('month') ? 'month' : shown[0])
  const [picked, setPicked] = React.useState(TEEN_TODAY)
  return (
    <Fig title="Pick a range, then a day">
      <RangeSwitch ranges={shown} value={range} onChange={setRange}/>
      <div className="mt-3">
        {range === 'day' && <DayChart data={DATA.day} band={DATA.band}/>}
        {range === 'week' && <WeekChart data={DATA.week} band={DATA.weekBand}/>}
        {range === 'month' && TEEN_TODAY && (
          <>
            <MonthCalendar days={TEEN.days} today={TEEN_TODAY} selected={picked}
              onSelect={setPicked} legend={false}/>
            <PickedDay d={TEEN.days.find(x => x.date === picked)}/>
            <CalendarLegend className="mt-4"/>
          </>
        )}
      </div>
    </Fig>
  )
}

const STOCK = ['The photographs', 'These are licensed stock photos of models.']

const SIGNAL_GROUND = ['bg-coral-wash', 'bg-sun-wash', 'bg-mint-wash', 'bg-sky-wash']

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
  const th = THEME.students

  return (
    <main>
      <Hero go={go} label="For teens" theme={th} photo="students-hallway"
        photoAlt="Four teen models walking along a bright corridor with folders and backpacks"
        title="See your stress as a number"
        lede="One Mind Score a day, so you can act on your stress."
        facts={[
          ['One number a day', SCORE_DEF],
          ['You choose what is shared', 'Sharing starts on. Switch any of it off, any time.'],
          STOCK,
        ]}/>

      <HeadsUpBand go={go} ground={th.a} block="bg-mint-wash" photo="student-controller"
        photoAlt="A teenager in headphones on a sofa, smiling, holding a games controller"
        line="Notices stress patterns in how you use your phone, never what is on it. You see it first."/>

      <Section tone="card" tight>
        <SectionHead>Your {SCORE} today</SectionHead>
        <Pair>
          <ScrollIn>
            <Fig title="The dial and the four signals">
              <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center lg:gap-6">
                <RainbowDial score={62} usual={51} rings={rings} size={320}/>
                <div className="w-full min-w-0"><Signals rings={rings}/></div>
              </div>
            </Fig>
          </ScrollIn>
          <ScrollIn>
            <Facts head="How to read the dial" variant="rule" hue="accent" rows={[
              ['Each ring', 'Each ring shows one body signal against your own last fourteen days.'],
              ['The mark on the arc', 'The mark shows where a usual day sits for you.'],
              ['Movement', 'How much you move, so exercise is not read as stress.'],
            ]}/>
          </ScrollIn>
        </Pair>
      </Section>

      <Section tone="paper" className={th.b} tight>
        <SectionHead>Trends</SectionHead>
        <Pair>
          <ScrollIn>
            <TrendsFig ranges={['day', 'week', 'month']}/>
          </ScrollIn>
          <Side photo="photos-steps-patch" block={th.block}
            alt="A teenage girl, a model, reading a notebook on outdoor steps, with a drawing of the patch on her upper arm">
            <Facts head="How to read the Trends" variant="rule" hue="sky" rows={[
              ['Day, week, month', 'Switch the view to see one day, a week or a month.'],
              ['The calendar', <>Each day shows its <HeadsUp/> face and {SCORE}. Pick a day to see it.</>],
              ['The shaded band', 'The band is your usual range, built from your last fourteen days.'],
            ]}/>
          </Side>
        </Pair>
      </Section>

      <Section tone="card" tight>
        <SectionHead>Who can see your score</SectionHead>
        <Pair wide>
          <ScrollIn>
            <Facts head="How sharing works" photo="student-card"
              photoAlt="Five teenagers, models, walking together through a park, talking as they go"
              rows={[
                ['Who opens the account', 'A guardian opens the account. You choose what is shared after that.'],
                ['Shared per person', `Sharing with a parent does not share with a ${PRO_LC}. You set each one on its own.`],
                ['Switching off', 'You can switch any sharing off at any time.'],
                ['What a parent can see at most', `A parent sees one ${SCORE} a day and which days ran high.`],
                [`What a ${PRO_LC} can see at most`, `A ${PRO_LC} sees your ${SCORE} and the direction it moved.`],
              ]}/>
          </ScrollIn>
          <ScrollIn className="self-start">
            <Chips head="What is never shared" variant="tint" hue="sky"
              rows={[NOTES, LOCATION, 'Any raw reading', 'Anything you type in the app']}/>
          </ScrollIn>
        </Pair>
      </Section>

      <Closer go={go} view="app-student" ground={th.a}
        label="Open the teen screen" title="Try the teen screen"
        line="The demo uses sample readings."
        rows={[
          ['One screen', 'Today, Reading, Toolkit and Sharing, each a tab.'],
          ['No account needed', 'Sign in later and your readings sync.'],
          ['No patch needed', 'The demo opens on a sample day already filled in.'],
        ]}/>
    </main>
  )
}

// Consent scope for a parent: moving a row between these lists changes what is shared.
const SEEN = [`One ${SCORE} a day`, 'Which days ran high', 'When the patch stops reporting']
const UNSEEN = ['Any raw reading', NOTES, LOCATION, 'Anything in real time']

function SeenUnseen() {
  return (
    <>
      {[['Shared with you', SEEN, true, 'tint'], ['Never shared with you', UNSEEN, false, 'outline']]
        .map(([head, rows, yes, variant], ci) => (
          <ScrollRow key={head} index={ci}>
            <div className={cn(cardClass(variant, 'sky'), 'flex h-full flex-col overflow-hidden')}>
              <h3 className={cn('max-w-none border-b px-3.5 py-2 font-display text-fine font-bold leading-tight text-ink',
                cardInk(variant, 'sky').line)}>{head}</h3>
              <ul className="m-0 grid list-none gap-1.5 p-3.5">
                {rows.map(r => (
                  <li key={r} className={cn('flex items-start gap-2 rounded-field border px-2.5 py-1.5',
                    'text-meta leading-[1.3] text-ink-2', yes ? 'border-sky/25 bg-card/70' : 'border-rule')}>
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
  const rings = React.useMemo(() => studentRings(), [])
  const th = THEME.parents

  return (
    <main>
      <Hero go={go} label="For parents" theme={th} photo="parent-hero"
        photoAlt="A mother and her teenage child smiling at an open laptop together at home"
        title="See how your teen is doing"
        lede="One Mind Score a day for your child, over days, weeks and months."
        facts={[
          ['One score a day', 'A day is the finest detail you see. You never see an hour or a moment.'],
          ['Never shown to you', `You never see a raw reading, ${NOTES} or ${LOCATION}.`],
          STOCK,
        ]}/>

      <HeadsUpBand go={go} ground={th.a} line="Tells you when phone activity is causing your teen stress."/>

      <Section tone="card" tight>
        <SectionHead>The {SCORE}</SectionHead>
        <ScoreExplain rings={rings} photo="photos-hall-duo" block={th.block}
          photoAlt={'A licensed stock photograph of two teenage girls in a school corridor, with a drawing '
            + 'of the patch placed on the upper arm of one of them to show where it sits'} rows={[
          ['0 to 100', 'One number a day, from the body signals the patch reads.'],
          ['Against their own usual', 'Compared with your teen\'s own usual day. Never with another teen.'],
          ['Calm to peak', 'The white cloud is calm. The rain cloud is peak.'],
        ]}/>
      </Section>

      <Section tone="paper" className={th.b} tight>
        <SectionHead>Trends</SectionHead>
        <SectionLede>A high day is a good reason to be around that evening.</SectionLede>
        <Pair>
          <ScrollIn>
            <TrendsFig ranges={['week', 'month']}/>
          </ScrollIn>
          <Side photo="student-game" block="bg-sun-wash"
            alt="Three teenagers, models, playing a video game together on a sofa at home">
            <Facts head="How to read Trends" variant="rule" hue="sky" rows={[
              ['Days, weeks, months', <>One {SCORE} a day with its <HeadsUp/> face, by week or by month.</>],
              ['Pick a day', 'Tap a day on the calendar to see its score and face.'],
              ['A day at most', `Nothing finer than a day. Never ${NOTES}, ${LOCATION} or raw readings.`],
            ]}/>
          </Side>
        </Pair>
      </Section>

      <Section tone="card" tight>
        <SectionHead>What you see and never see</SectionHead>
        <div className="mt-3 grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          <SeenUnseen/>
          <ScrollIn className="sm:col-span-2 lg:col-span-1">
            <Facts head="Who decides what is shared" variant="tint" hue="sun" rows={[
              ['Who decides', CONSENT_SHORT],
              ['Shared per person', `What your child shares with you does not go to a ${PRO_LC}.`],
              ['Switching off', 'The teen can switch sharing off at any time.'],
              ['Not a diagnosis', 'MindMap is not a medical device and does not diagnose anything.'],
              ['No ranking', 'Your child is never compared with another teen.'],
            ]}/>
          </ScrollIn>
        </div>
      </Section>

      <Closer go={go} view="app-parent" ground={th.a}
        label="Open the parent screen" title="Try the parent screen"
        line="The demo uses sample readings."
        rows={[
          ['Opens on Trends', `One ${SCORE} a day, by week or by month.`],
          ['Crisis alerts', 'A crisis alert always reaches a guardian. Nobody can switch that off.'],
        ]}/>
    </main>
  )
}

// `Bars` takes a paint, not a class; #157446 is the accent token.
const ACCENT = '#157446'
const SCHOOL_WEEK = COHORT_WEEKDAY.map(d => ({ label: d.label, v: d.mean }))

// Ordered on the week's movement, as CASELOAD_DEF states above the table.
const BOARD = roster().filter(s => s.showTrend).sort((a, b) => b.velocity - a.velocity)
const SERIES = name => CHART_DATA.pro?.[name.replace(/\D/g, '')]

function Caseload() {
  return (
    <table className="w-full border-collapse text-left">
      <caption className="sr-only">{CASELOAD_TITLE}</caption>
      <thead>
        <tr className="border-b border-ink font-display text-fine font-bold text-ink-2">
          <th scope="col" className="py-2.5 pr-3">Teen</th>
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
              {SERIES(s.name)
                ? <Spark data={SERIES(s.name)}/>
                : <span aria-hidden className="block h-px w-16 bg-ruling"/>}
            </td>
            <td className="border-b border-rule py-2.5 pl-2 text-right text-meta
              tabular-nums text-ink-3">{s.weekAgo}</td>
            <td className="border-b border-rule py-2.5 pl-2 text-right text-num
              tabular-nums text-ink">{s.current}</td>
            <td className={cn('border-b border-rule py-2.5 pl-2 text-right text-meta tabular-nums',
              s.velocity ? 'text-ink' : 'text-ink-3')}>
              {s.velocity > 0 ? '▲ +' : s.velocity < 0 ? '▼ ' : ''}{s.velocity}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// k-anonymity floor: a period under K_ANONYMITY renders as a withheld row with no mean.
function SmallGroups() {
  return (
    <ul className="m-0 list-none p-0">
      {COHORT_PERIOD.map(c => (
        <li key={c.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2
          border-t border-rule py-2.5 sm:grid-cols-[minmax(0,14rem)_minmax(5rem,1fr)_4.5rem]">
          <span className="order-1 min-w-0">
            <span className="block font-display text-meta font-bold text-ink">{c.label}</span>
            <span className="block text-fine text-ink-3">{c.n} teens</span>
          </span>
          <span className="order-3 col-span-2 sm:order-2 sm:col-span-1">
            {c.suppressed ? (
              <span className="block font-display text-fine text-ink-3">
                Fewer than {K_ANONYMITY} teens, so nothing is shown</span>
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
  const rings = React.useMemo(() => studentRings(), [])
  const suppressed = COHORT_PERIOD.filter(c => c.suppressed).length
  const peak = COHORT_WEEKDAY.reduce((a, b) => (b.mean > a.mean ? b : a))
  const th = THEME.pro

  return (
    <main>
      <Hero go={go} label={PRO_FOR} theme={th} photo="clinic-talk"
        photoAlt="A licensed stock photograph of a teenager talking with an adult who holds a clipboard, on a sofa by a sunlit window"
        title="See Trends across your teens"
        lede="You see how each teen who shares with you is trending, and how groups are doing."
        facts={[
          ['What you see', `Each teen's ${SCORE} and the direction it moved.`],
          ['Never shown to you', `A raw reading, ${NOTES}, ${LOCATION}, or any group under ${K_ANONYMITY} teens.`],
          STOCK,
        ]}/>

      <HeadsUpBand go={go} ground={th.a} line="You see each sharing teen’s colour, never the content."/>

      <Section tone="card" tight>
        <SectionHead>The {SCORE}</SectionHead>
        <ScoreExplain rings={rings} rows={[
          ['0 to 100', 'One number a day, from the body signals the patch reads.'],
          ['Against their own usual', 'Each teen is compared with their own usual day, never with another teen.'],
          ['Calm to peak', 'The white cloud is calm. The rain cloud is peak.'],
        ]}/>
      </Section>

      <Section tone="paper" className={th.b} tight>
        <SectionHead>Trends</SectionHead>
        <Pair>
          <ScrollIn>
            <TrendsFig ranges={['week', 'month']}/>
          </ScrollIn>
          <Side photo="student-homework" block={th.block}
            alt="A teenager in headphones leaning over an open notebook at a desk, a laptop and a pencil case beside them">
            <Facts head="How to read Trends" variant="rule" hue="beam" rows={[
              ['Days, weeks, months', <>Each teen’s {SCORE} and <HeadsUp/> face, by week or by month.</>],
              ['Pick a day', 'Tap a day on the calendar to see its score and face.'],
              ['Consented teens only', 'You see a teen only if they chose to share with you.'],
              ['Small groups', `A group under ${K_ANONYMITY} teens shows nothing.`],
            ]}/>
          </Side>
        </Pair>
      </Section>

      <Section tone="card" tight>
        <SectionHead>Stress across all your teens</SectionHead>
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_minmax(0,20rem)] lg:gap-4">
          <ScrollIn className="h-full">
            <Photo photo="photos-hall-denim" block="bg-beam-wash"
              alt="A teenage girl, a model, walking down a school corridor holding a notebook and a coffee cup"
              className="h-[220px] sm:h-[300px] lg:h-full"/>
          </ScrollIn>
          <ScrollIn>
            <Fig title={`Average ${SCORE} by school day`}>
              {/* Width cap: at 1360px each of the five bars would be wider than it is tall. */}
              <Bars data={SCHOOL_WEEK} color={ACCENT} unit="school day" className="max-w-[640px]"/>
            </Fig>
          </ScrollIn>
          <ScrollIn>
            <Facts head="How to read the chart" variant="rule" hue="lilac" rows={[
              ['Teens in the chart', `${SCHOOL_N} teens, all of whom chose to share with a ${PRO_LC}.`],
              ['Highest day', `${peak.full} ran highest, with an average of ${peak.mean}.`],
              ['Not a ranking', 'No single teen can be picked out of this chart.'],
            ]}/>
          </ScrollIn>
        </div>
      </Section>

      <Section tone="paper" className={th.a} tight>
        <SectionHead>{CASELOAD_TITLE}</SectionHead>
        <SectionLede>{CASELOAD_DEF}</SectionLede>
        <Pair>
          <ScrollIn>
            <Fig title="Last week against this week">
              <Caseload/>
            </Fig>
          </ScrollIn>
          <ScrollIn>
            <Facts head="Who is on the list" variant="outline" rows={[
              ['On the list', `${BOARD.length} teens, all of whom agreed to share Trends.`],
              ['Off the list', 'Teens who share only a score, or only alerts, are not listed.'],
              ['Why change, not score', 'A teen steady at 86 for a month is not a change.'],
            ]}/>
          </ScrollIn>
        </Pair>
      </Section>

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
              <Facts head="Why small groups show nothing" variant="tint" hue="lilac" rows={[
                ['The rule', `A group needs at least ${K_ANONYMITY} teens. Below that, no average is computed or shown.`],
                ['Hidden here', `${suppressed} of ${COHORT_PERIOD.length} periods are under the limit.`],
                ['Cannot be turned off', 'No setting anywhere in MindMap turns this rule off.'],
              ]}/>
            </ScrollIn>
            <ScrollIn>
              <Facts head="How the audit log works" variant="tint" hue="beam" rows={[
                ['Every record opened', 'Every record you open is logged, with who opened it and when.'],
                ['No setting turns it off', 'Nobody can switch the log off, including us.'],
                ['Consent is per teen', 'You see only what each teen agreed to share.'],
                ['Crisis alerts', 'A crisis alert always reaches you. No guardian can switch that off.'],
              ]}/>
            </ScrollIn>
          </div>
        </Pair>
      </Section>

      <Closer go={go} view="app-pro" ground={th.b} label={`Open the ${PRO} screen`}
        title={`Try the ${PRO} screen`}
        line="The demo uses sample teens."
        rows={[
          ['Opens on the list', CASELOAD_TITLE + '.'],
          ['The consent tab', 'The consent tab shows what each guardian signed and when it expires.'],
          ['The audit tab', 'The audit tab lists every record opened, in order, never cleared.'],
        ]}/>
    </main>
  )
}
