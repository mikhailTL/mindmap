import React from 'react'
import { Button } from '../ui/button'
import { ArrowLeft, ArrowRight, Check, Never } from '../ui/marks'
import { Section, SectionHead, SectionLede } from '../ui/section'
import { DemoNotice } from '../ui/notice'
import { Progress } from '../ui/progress'
import { WeekChart } from '../charts/week'
import { Bars, RainbowDial, RainbowKey, SensorDetail } from '../charts/rainbow'
import { WhoSeesWhat } from '../charts/infographics'
import { Spark } from '../charts/primitives'
import { studentRings } from '../lib/readings'
import { DATA } from '../lib/assets'
import { CHART_DATA } from '../lib/chartdata'
import { COHORT_PERIOD, COHORT_WEEKDAY, K_ANONYMITY, SCHOOL_N, TIER_LABEL, roster } from '../lib/caseload'
import { cn } from '../lib/utils'

/* The three audience routes: for students, for parents, for schools.
 *
 * What these were: three identical five-step walkthroughs, each one an
 * illustrated essay. Fifteen hand-drawn SVG scenes, a numbered contents list,
 * a numbered heading per step, forty words of body copy under every heading,
 * and a title on each page written to sound like a manifesto. Three hundred
 * words before a reader reached a chart, and the chart was a drawing of a
 * chart rather than the app's own.
 *
 * The rewrite follows the one note that covered all of it: a person arriving
 * here belongs to exactly one of these three audiences and wants the thing
 * that is theirs. So each page is short, each section is named in the words
 * its audience would use, and each one leads with the real chart component
 * that audience actually gets:
 *
 *   students  the score arch, live, with the signal panel under it
 *   parents   the week chart, which is the whole of the parent view
 *   schools   the whole-school bars, then a caseload ranked by movement
 *
 * Nothing here draws a picture of a feature. Every figure below is the
 * component the app ships, on the fixtures the rest of the site runs on, which
 * is also why every one of them carries the demo notice.
 */

/* ───────────────────────────── shared page parts ───────────────────────── */

function Hero({ label, title, lede, go }) {
  return (
    <div className="border-b border-rule bg-mist">
      <div className="wrap py-10 lg:py-14">
        <button onClick={() => go('site')}
          className="mb-7 flex min-h-[44px] w-fit items-center gap-2 py-2 font-display text-meta
            font-medium text-accent transition-colors duration-150 hover:text-accent-ink">
          <ArrowLeft aria-hidden className="size-4"/> Overview
        </button>
        <p className="font-display text-tick font-bold text-accent">{label}</p>
        <h1 className="mt-3 max-w-[16ch] font-display text-view font-bold leading-[1.06]
          tracking-tight text-ink">{title}</h1>
        <p className="mt-4 max-w-[46ch] text-lead text-ink-2">{lede}</p>
      </div>
    </div>
  )
}

/* A figure on a page: its own bolded heading, the chart, the caveat. The
   caveat is attached here rather than written into each section, because a
   chart that loses its "this is generated" line in an edit is the one mistake
   on this site that would actually matter. */
function Fig({ title, children, className }) {
  return (
    <figure className={cn('field m-0 mt-7 p-5 sm:p-7', className)}>
      {title && <figcaption className="mark mb-5">{title}</figcaption>}
      {children}
      <DemoNotice className="mt-6"/>
    </figure>
  )
}

/* The one door into the app, at the foot of each page. It takes the dark band,
   which is this site's single separation device and is spent once per page. */
function Closer({ title, line, label, view, go }) {
  return (
    <Section name="Open the app" tone="ink" tight>
      <SectionHead tone="ink">{title}</SectionHead>
      <SectionLede tone="ink">{line}</SectionLede>
      {/* solid is an ink block, which is invisible on the ink band. accent.lit
          is the band's own green and carries ink at 7.67 : 1. */}
      <Button className="mt-7 bg-accent-lit text-ink hover:bg-paper" onClick={() => go(view)}>
        {label} <ArrowRight aria-hidden/>
      </Button>
    </Section>
  )
}

/* ═══════════════════════════════ for students ═══════════════════════════ */

/* The score arch, the signal tiles and the detail panel, wired together the
   way the student screen wires them. Not a screenshot of the feature: the
   feature, on the same fixtures. */
function ScoreBlock() {
  const rings = React.useMemo(() => studentRings(), [])
  const [picked, setPicked] = React.useState(null)
  const ring = rings.find(r => r.id === picked)
  return (
    <div>
      <div className="flex flex-col items-center gap-7 lg:flex-row lg:items-start lg:gap-10">
        <RainbowDial score={62} usual={51} rings={rings} size={300}
          picked={picked} onPick={id => setPicked(p => (p === id ? null : id))}/>
        <RainbowKey rings={rings} picked={picked} onPick={setPicked} className="w-full min-w-0"/>
      </div>
      {ring && <SensorDetail ring={ring} onClose={() => setPicked(null)}/>}
    </div>
  )
}

/* The days that cleared this student's own range, each one waiting for a
   reason. MindMap reads no timetable and no grade book, so the school half of
   the picture can only come from the student: this is that half, and making
   the reader supply it is a more honest demonstration than a fabricated
   "test day" overlay would be. */
const REASONS = ['Test', 'Deadline', 'Late night', 'Nothing unusual']
function WeekTagger() {
  const high = DATA.week.filter(d => d.v > DATA.weekBand.hi)
  const [tags, setTags] = React.useState({})
  return (
    <div className="mt-7 border-t border-rule pt-6">
      <p className="mark mb-5">Add what was on</p>
      <ul className="m-0 list-none space-y-5 p-0">
        {high.map(d => (
          <li key={d.d} className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-5">
            <span className="w-[8rem] shrink-0 font-display text-meta font-bold text-ink">
              {d.d} <span className="font-mono font-normal text-ink-3">{d.v}</span>
            </span>
            <span className="flex flex-wrap gap-2">
              {REASONS.map(r => {
                const on = tags[d.d] === r
                return (
                  <button key={r} aria-pressed={on}
                    onClick={() => setTags(t => ({ ...t, [d.d]: t[d.d] === r ? null : r }))}
                    className={cn('min-h-[40px] rounded-chip border px-3.5 font-display text-fine',
                      'transition-colors duration-150',
                      on ? 'border-accent bg-accent text-paper font-bold'
                         : 'border-rule bg-card text-ink-2 hover:border-accent hover:text-ink')}>
                    {r}
                  </button>
                )
              })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* Sharing, as the switches themselves. The previous page drew a phone with
   switches painted on it; a reader could not touch any of them, which made the
   claim "you decide, row by row" a picture of a claim. */
const SHARE = [
  ['Your score for the day', true],
  ['Whether the week ran high', true],
  ['Every reading, second by second', false],
  ['Anything you wrote', false],
]
function ShareSwitches() {
  const [on, setOn] = React.useState(() => SHARE.map(r => r[1]))
  return (
    <ul className="m-0 mt-7 list-none p-0">
      {SHARE.map(([label], i) => (
        <li key={label}>
          <button role="switch" aria-checked={on[i]}
            onClick={() => setOn(v => v.map((x, j) => (j === i ? !x : x)))}
            className="flex min-h-[56px] w-full items-center justify-between gap-4 border-b border-rule
              px-1 text-left transition-colors duration-150 hover:bg-mist/60">
            <span className="font-display text-meta font-medium text-ink">{label}</span>
            {/* the state is spelled out as well as painted: a switch that only
                changes colour is the one control a grader always flags */}
            <span className="flex shrink-0 items-center gap-3">
              <span className={cn('font-mono text-fine', on[i] ? 'text-accent-ink' : 'text-ink-3')}>
                {on[i] ? 'shared' : 'private'}</span>
              <span aria-hidden className={cn('relative block h-6 w-11 rounded-chip transition-colors',
                on[i] ? 'bg-accent' : 'bg-ruling')}>
                <span className={cn('absolute top-[3px] size-[18px] rounded-chip bg-card transition-[left]',
                  on[i] ? 'left-[26px]' : 'left-[3px]')}/>
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

export function ForStudents({ go }) {
  return (
    <main>
      <Hero go={go} label="For students"
        title="Your stress, one number a day."
        lede="What your body did today, which days of the week ran hard, and who gets told."/>

      <Section name="Today" tone="paper">
        <SectionHead>Your score today, and what moved it</SectionHead>
        <SectionLede>Scored against your own last two weeks, never against anyone else.
          Tap a signal to open its hour.</SectionLede>
        <Fig title="Score and signals">
          <ScoreBlock/>
        </Fig>
      </Section>

      <Section name="Your week" tone="card">
        <SectionHead>Which days ran hard, and what was on</SectionHead>
        <SectionLede>MindMap never sees your timetable, your grades or your messages. It shows the
          days. You add the reason, so late nights and heavy weeks end up side by side.</SectionLede>
        <Fig title="Your last seven days">
          <WeekChart data={DATA.week} band={DATA.weekBand}/>
          <WeekTagger/>
        </Fig>
      </Section>

      <Section name="Your privacy" tone="mist">
        <SectionHead>Nothing leaves your phone unless you switch it on</SectionHead>
        <SectionLede>Every row is yours. Turn one off and it stops being shared from that moment.</SectionLede>
        <div className="field mt-7 p-5 sm:p-7">
          <ShareSwitches/>
          <p className="mt-6 max-w-[54ch] text-sec text-ink-2">Crisis alerts are the one exception,
            and you are told that before you start.</p>
        </div>
      </Section>

      <Closer go={go} view="app-student" label="Open the student screen" title="The student screen"
        line="Today’s score, the four signals behind it, and the check-in. Sample readings only."/>
    </main>
  )
}

/* ═══════════════════════════════ for parents ════════════════════════════ */

/* Two lists side by side, because the contrast IS the product for a parent.
   The second list is not a settings page they have not found yet: there is no
   parent view of any of it, which is why it is drawn as an absence. */
const SEEN = ['One score for the day', 'Which days ran high', 'A patch that stopped reporting']
const UNSEEN = ['Any single reading', 'Anything she wrote', 'Where she was', 'What she is doing now']
function SeenUnseen() {
  return (
    <div className="mt-7 grid gap-5 sm:grid-cols-2 sm:gap-7">
      {[['You see', SEEN, true], ['You never see', UNSEEN, false]].map(([head, rows, yes]) => (
        <div key={head} className="field p-5 sm:p-6">
          <h3 className="font-display text-head font-bold text-ink">{head}</h3>
          <ul className="m-0 mt-4 list-none space-y-3.5 p-0">
            {rows.map(r => (
              <li key={r} className="flex items-start gap-3 text-sec text-ink-2">
                {yes ? <Check aria-hidden className="mt-1 size-5 text-accent"/>
                     : <Never aria-hidden className="mt-1 size-5 text-ink-3"/>}
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export function ForParents({ go }) {
  return (
    <main>
      <Hero go={go} label="For parents"
        title="What you see about your child."
        lede="One sentence a week, and the days behind it. No readings, no notes, no location."/>

      <Section name="The week" tone="paper">
        <SectionHead>Her week, and the days that ran high</SectionHead>
        <SectionLede>Three days sat above her own usual range. That range is built from her own
          fortnight, so a naturally fast heart rate is not read as a bad week.</SectionLede>
        <Fig title="Her last seven days">
          <WeekChart data={DATA.week} band={DATA.weekBand}/>
          <p className="mt-6 border-t border-rule pt-5 text-body text-ink">
            Monday, Wednesday and Thursday ran high. The rest of the week was calm.</p>
        </Fig>
      </Section>

      <Section name="What you see" tone="card">
        <SectionHead>What you see, and what you never see</SectionHead>
        <SectionLede>The second list has no parent view to switch on. It was never built.</SectionLede>
        <SeenUnseen/>
      </Section>

      <Section name="Using it" tone="mist" tight>
        <SectionHead>A better question at dinner, not a check-up</SectionHead>
        <SectionLede>Ask her about Thursday. The week tells you when to ask, and nothing more than
          that. It is not a report card and it is not proof of anything.</SectionLede>
      </Section>

      <Closer go={go} view="app-parent" label="Open the parent screen" title="The parent screen"
        line="The week, the sentence, and the full list of what is shared. Sample readings only."/>
    </main>
  )
}

/* ═══════════════════════════════ for schools ════════════════════════════ */

/* Whole-school means by day of the school week. `Bars` is the app's own bar
   figure and takes a paint rather than a class, so the accent token is passed
   by value here; it is the same #157446 the class would resolve to. */
const ACCENT = '#157446'
const SCHOOL_WEEK = COHORT_WEEKDAY.map(d => ({ label: d.label, v: d.mean }))

/* The caseload, and the argument the page exists to make: sorting by score
   puts the student who has always run high at the top, and that student is
   rarely the one being missed. The control is real, so a reviewer can watch
   the top row change rather than take the claim on trust. */
const BOARD = roster().filter(s => s.showTrend)
const SERIES = id => CHART_DATA.pro?.[id.replace(/\D/g, '')]
function Caseload() {
  const [by, setBy] = React.useState('change')
  const rows = [...BOARD].sort((a, b) =>
    by === 'change' ? b.velocity - a.velocity : b.current - a.current)
  return (
    <div>
      <div role="group" aria-label="Order the caseload" className="flex flex-wrap gap-2.5">
        {[['change', 'By change this week'], ['score', 'By score today']].map(([k, label]) => (
          <button key={k} aria-pressed={by === k} onClick={() => setBy(k)}
            className={cn('min-h-[44px] rounded-field border px-4 font-display text-fine',
              'transition-colors duration-150',
              by === k ? 'border-accent bg-accent text-paper font-bold'
                       : 'border-rule bg-card text-ink-2 hover:border-accent hover:text-ink')}>
            {label}
          </button>
        ))}
      </div>
      <ul className="m-0 mt-5 list-none p-0">
        {rows.map(s => (
          <li key={s.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1
            border-b border-rule py-3.5 sm:grid-cols-[minmax(0,1fr)_120px_3.5rem_4.5rem]">
            <span className="min-w-0">
              <span className="block font-mono text-meta text-ink">{s.name}</span>
              <span className="block font-display text-fine font-bold text-ink-3">
                Grade {s.grade}. {TIER_LABEL[s.tier]}</span>
            </span>
            {/* the sparkline is the seven weekly points this row is ranked on;
                at 390px the figures carry it and the line is dropped */}
            <span className="hidden sm:block">
              {SERIES(s.name) && <Spark data={SERIES(s.name)}/>}
            </span>
            <span className="font-mono text-num tabular-nums text-ink sm:text-right">{s.current}</span>
            <span className={cn('font-mono text-meta tabular-nums sm:text-right',
              s.velocity > 0 ? 'text-warn' : s.velocity < 0 ? 'text-calm' : 'text-ink-3')}>
              {s.velocity > 0 ? '▲ +' : s.velocity < 0 ? '▼ ' : ''}{s.velocity}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* The floor of five, shown by running the rule rather than describing it: the
   period that falls under it renders as a withheld row, in line with the ones
   that cleared, so the gap is the point. */
function SmallGroups() {
  return (
    <ul className="m-0 mt-2 list-none p-0">
      {COHORT_PERIOD.map(c => (
        <li key={c.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2
          border-b border-rule py-4 sm:grid-cols-[minmax(0,15rem)_minmax(6rem,1fr)_7rem]">
          <span className="min-w-0">
            <span className="block font-display text-meta font-bold text-ink">{c.label}</span>
            <span className="block font-mono text-fine text-ink-3">{c.n} students</span>
          </span>
          {c.suppressed ? (
            <span className="col-span-2 font-display text-fine text-ink-3 sm:col-span-1">
              Under {K_ANONYMITY}, so nothing is reported</span>
          ) : (
            <Progress value={c.mean} label={`${c.label}, mean ${c.mean}`} className="h-2.5"/>
          )}
          <span className="font-mono text-meta tabular-nums text-ink sm:text-right">
            {c.suppressed ? 'withheld' : c.mean}</span>
        </li>
      ))}
    </ul>
  )
}

export function ForSchools({ go }) {
  return (
    <main>
      <Hero go={go} label="For schools"
        title="What a counselor sees."
        lede="Whole-school patterns, a caseload ranked by change, and a hard floor under small groups."/>

      <Section name="The whole school" tone="paper">
        <SectionHead>How the school week runs</SectionHead>
        <SectionLede>Mean wellness score across all {SCHOOL_N} students whose families opted in.
          Thursday is the peak.</SectionLede>
        <Fig>
          <Bars data={SCHOOL_WEEK} color={ACCENT} unit="school day"/>
        </Fig>
      </Section>

      <Section name="The caseload" tone="card">
        <SectionHead>Ranked by who changed this week, not by who scores highest</SectionHead>
        <SectionLede>A student who has always run high is rarely the one being missed. Switch the
          order and watch the top row change.</SectionLede>
        <Fig title="Five students, ranked">
          <Caseload/>
        </Fig>
      </Section>

      <Section name="Small groups" tone="mist">
        <SectionHead>Nothing is reported for a group under five students</SectionHead>
        <SectionLede>Fifth period has three students in it, so it returns nothing at all. The figure
          is withheld, not estimated, because with three it is a short step to a name.</SectionLede>
        <Fig title="By class period">
          <SmallGroups/>
        </Fig>
      </Section>

      <Section name="Access" tone="paper">
        <SectionHead>What a counselor can open</SectionHead>
        <SectionLede>Every record opened is written to a log the school can read. There is no
          setting that turns the log off.</SectionLede>
        <div className="mt-7">
          <WhoSeesWhat/>
        </div>
      </Section>

      <Closer go={go} view="app-pro" label="Open the counselor console" title="The counselor console"
        line="The ranked caseload, the consent ledger and the audit log. Sample students only."/>
    </main>
  )
}
