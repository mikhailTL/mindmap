import React from 'react'
import { Button } from '../ui/button'
import { ArrowLeft, ArrowRight, Check, Never } from '../ui/marks'
import { Section, SectionHead, SectionLede } from '../ui/section'
import { DemoNotice } from '../ui/notice'
import { Progress } from '../ui/progress'
import { WeekChart } from '../charts/week'
import { Bars, RainbowDial } from '../charts/rainbow'
import { WhoSeesWhat } from '../charts/infographics'
import { Spark } from '../charts/primitives'
import { studentRings } from '../lib/readings'
import { SENSORS } from '../lib/sensors'
import { DATA } from '../lib/assets'
import { CHART_DATA } from '../lib/chartdata'
import { COHORT_PERIOD, COHORT_WEEKDAY, K_ANONYMITY, SCHOOL_N, TIER_LABEL, roster } from '../lib/caseload'
import { cn } from '../lib/utils'

/* The three audience routes: for students, for parents, for schools.
 *
 * The last pass answered "make these pages theirs" by giving each one more
 * machinery: a day tagger a student had to fill in, four sharing switches, a
 * caseload that could be re-sorted, a detail panel that opened under the arch.
 * The owner's note on it was that the diagrams were too complex, and he was
 * right about the cause — every one of those controls is a thing a reader has
 * to operate before the page will say anything. A landing page that has to be
 * operated has not made its point.
 *
 * So each page now carries ONE picture per section and the fewest words that
 * can sit under it, and nothing on the student or parent page can be clicked
 * except the door into the app:
 *
 *   students  the rainbow arch with its clouds, large, and the four signals
 *   parents   the week, and the one sentence it produces
 *   schools   real figures, because this is the audience that wants them
 *
 * Density is not the enemy on the schools page and is the enemy on the other
 * two. That asymmetry is deliberate and is the whole design.
 */

/* ───────────────────────────── shared page parts ───────────────────────── */

/* The band takes a photograph from lg and stacks it under the copy below
   that. The images are concept shots: the patch in them is rendered from the
   same CAD the 3D model on the patch page is built from, and no unit has been
   worn by anybody. */
function Hero({ label, title, lede, go, photo, photoAlt }) {
  return (
    <div className="border-b border-rule bg-mist">
      <div className={cn('wrap py-10 lg:py-14', photo &&
        'lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,42%)] lg:items-end lg:gap-10')}>
        <div className="min-w-0">
        <button onClick={() => go('site')}
          className="mb-7 flex min-h-[44px] w-fit items-center gap-2 py-2 font-display text-meta
            font-medium text-accent transition-colors duration-150 hover:text-accent-ink">
          <ArrowLeft aria-hidden className="size-4"/> Overview
        </button>
        <p className="font-mono text-row font-bold tracking-[0.005em] text-accent">{label}</p>
        <h1 className="mt-3 max-w-[16ch] font-display text-major font-bold leading-[1.06]
          tracking-tight text-ink">{title}</h1>
        <p className="mt-4 max-w-[46ch] text-lead text-ink-2">{lede}</p>
        </div>
        {photo && (
          <img src={`/photos/${photo}.webp`} alt={photoAlt} loading="eager" decoding="async"
            width="1344" height="752"
            className="mt-7 h-[210px] w-full rounded-panel object-cover sm:h-[280px]
              lg:mt-0 lg:h-[320px]"/>
        )}
      </div>
    </div>
  )
}

/* A figure on a page: the chart, and the caveat. The caveat is attached here
   rather than written into each section, because a chart that loses its "this
   is generated" line in an edit is the one mistake on this site that would
   actually matter. */
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

/* The four signals as a flat readout, replacing the RainbowKey tiles and the
   panel that opened under them. Those are the app's control surface and they
   belong on the app screen; here they were four buttons that only ever led
   back to the figure already on the page. Name, colour, figure, bar — nothing
   to press, nothing to read twice. */
function Signals({ rings }) {
  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:gap-4">
      {rings.map(r => {
        const s = SENSORS[r.id]
        const Icon = s.icon
        return (
          <li key={r.id} className="field p-4">
            <span className="flex items-center gap-2.5">
              <Icon aria-hidden className="size-5 shrink-0" style={{ color: s.glow }}/>
              {/* text-ui until the tiles get a full half-column: "Temperature"
                  at text-row overruns a 115px tile at 390px and clips */}
              <span className="font-display text-ui font-bold leading-tight text-ink lg:text-row">{s.name}</span>
            </span>
            {/* the figure is ink, never the signal's colour: four coloured
                numerals down a page read as four alarms */}
            <span className="mt-3 block font-mono text-num tabular-nums leading-none text-ink">{r.value}</span>
            <Progress value={r.value} tone={s.glow} label={`${s.name}, ${r.value} out of 100`}
              className="mt-3 h-1.5"/>
          </li>
        )
      })}
    </ul>
  )
}

export function ForStudents({ go }) {
  const rings = React.useMemo(() => studentRings(), [])
  return (
    <main>
      <Hero go={go} label="For students" photo="student-hero"
        photoAlt="A student sitting on steps outside school, the patch worn on her upper arm under a short sleeve"
        title="Your stress, one number a day."
        lede="One score a day, and the four things behind it."/>

      <Section name="Today" tone="paper">
        <SectionHead>Your score today</SectionHead>
        <SectionLede>Scored against your own last two weeks, never against anyone else.</SectionLede>
        <Fig>
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:gap-12">
            {/* the arch is the picture on this page, so it gets the room: it
                leads at any width and takes half the row on a laptop */}
            <RainbowDial score={62} usual={51} rings={rings} size={440}/>
            <div className="w-full min-w-0">
              <p className="max-w-[26ch] text-body text-ink">
                Today ran higher than your usual. Sweat moved first, then your heart rate.</p>
              <div className="mt-6"><Signals rings={rings}/></div>
            </div>
          </div>
        </Fig>
      </Section>

      <Section name="Your week" tone="card">
        <SectionHead>Which days ran hard</SectionHead>
        <SectionLede>Three school days sat above your usual range. The weekend did not.</SectionLede>
        {/* bleeds to the screen edge on a phone: see the note on the parent
            page's copy of this figure */}
        <Fig className="-mx-[22px] rounded-none border-x-0 p-3.5 sm:mx-0 sm:rounded-field sm:border-x sm:p-7">
          <WeekChart data={DATA.week} band={DATA.weekBand}/>
        </Fig>
      </Section>

      <Section name="Your privacy" tone="mist" tight>
        <SectionHead>Nothing leaves your phone unless you say so</SectionHead>
        <SectionLede>You see all of it. Your parents see a score and a week, only if you switch
          it on. Nobody sees what you write.</SectionLede>
      </Section>

      <Closer go={go} view="app-student" label="Open the student screen" title="The student screen"
        line="Your score, your signals and the check-in. Sample readings only."/>
    </main>
  )
}

/* ═══════════════════════════════ for parents ════════════════════════════ */

/* Two lists side by side, because the contrast IS the product for a parent.
   The second list is not a settings page they have not found yet: there is no
   parent view of any of it, which is why it is drawn as an absence. */
const SEEN = ['One score for the day', 'Which days ran high', 'A patch that stopped reporting']
const UNSEEN = ['Any single reading', 'Anything she wrote', 'Where she is', 'What she is doing now']
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
      <Hero go={go} label="For parents" photo="parent-hero"
        photoAlt="A parent in a kitchen holding a phone, their teenager in the background wearing the patch"
        title="What you see about your child."
        lede="A week, and one sentence about it."/>

      <Section name="The week" tone="paper">
        <SectionHead>Her week</SectionHead>
        <SectionLede>Measured against her own fortnight, never against other children.</SectionLede>
        {/* Full bleed on a phone. WeekChart collides the value labels on two
            adjacent above-range bars once the plot drops under about 330px,
            and Wednesday and Thursday are exactly that pair. Taking back the
            22px gutters puts the chart at 362px, which clears them. */}
        <Fig className="-mx-[22px] rounded-none border-x-0 p-3.5 sm:mx-0 sm:rounded-field sm:border-x sm:p-7">
          {/* the sentence sits above the chart, not under it. A parent who
              reads only the first line has still got the whole message. */}
          <p className="mb-5 max-w-[40ch] text-body text-ink">
            Monday, Wednesday and Thursday ran high. The rest of the week was calm.</p>
          <WeekChart data={DATA.week} band={DATA.weekBand}/>
        </Fig>
      </Section>

      <Section name="What you see" tone="card">
        <SectionHead>What you see, and what you never see</SectionHead>
        <SectionLede>There is no parent view for the second list. It was never built.</SectionLede>
        <SeenUnseen/>
      </Section>

      <Section name="Using it" tone="mist" tight>
        <SectionHead>A better question at dinner</SectionHead>
        <SectionLede>Ask her about Thursday. It tells you when to ask, and nothing more.</SectionLede>
      </Section>

      <Closer go={go} view="app-parent" label="Open the parent screen" title="The parent screen"
        line="The week, the sentence, and everything that is shared. Sample readings only."/>
    </main>
  )
}

/* ═══════════════════════════════ for schools ════════════════════════════ */

/* Whole-school means by day of the school week. `Bars` is the app's own bar
   figure and takes a paint rather than a class, so the accent token is passed
   by value here; it is the same #0a6e68 the class would resolve to. */
const ACCENT = '#0a6e68'
const SCHOOL_WEEK = COHORT_WEEKDAY.map(d => ({ label: d.label, v: d.mean }))

/* The caseload, ranked on the week's movement rather than on today's score,
   because a student who has always run high is rarely the one being missed.
   The sort toggle that used to make that argument is gone: it asked a reader
   to run an experiment to be told a one-line conclusion. The ranking states
   it, and the "was" column lets anyone check it.

   A table rather than a list. This is the one page whose audience reads
   tables, and a table gets column headers, row scope and alignment for free. */
const BOARD = roster().filter(s => s.showTrend).sort((a, b) => b.velocity - a.velocity)
const SERIES = name => CHART_DATA.pro?.[name.replace(/\D/g, '')]
function Caseload() {
  return (
    <table className="w-full border-collapse text-left">
      <caption className="sr-only">Caseload ranked by change over the week</caption>
      <thead>
        <tr className="border-b border-ink font-display text-fine font-bold text-ink-2 sm:text-tick">
          <th scope="col" className="py-3 pr-3">Student</th>
          {/* the sparkline is the seven weekly points the rank is built on. At
              390px the three figures carry the row and the line is dropped. */}
          <th scope="col" className="hidden py-3 pr-3 sm:table-cell">Seven weeks</th>
          <th scope="col" className="py-3 pl-2 text-right">Was</th>
          <th scope="col" className="py-3 pl-2 text-right">Now</th>
          <th scope="col" className="py-3 pl-2 text-right">Change</th>
        </tr>
      </thead>
      <tbody>
        {BOARD.map(s => (
          <tr key={s.id}>
            <th scope="row" className="border-b border-rule py-3.5 pr-3 text-left font-normal">
              <span className="block text-meta text-ink">{s.name}</span>
              <span className="block font-display text-fine font-bold text-ink-3">
                Grade {s.grade}. {TIER_LABEL[s.tier]}</span>
            </th>
            <td className="hidden border-b border-rule py-3.5 pr-3 sm:table-cell">
              {/* not every student on the board has a weekly series in the
                  fixtures. A blank cell in a table of figures reads as a bug,
                  so the absence is drawn as a flat line. */}
              {SERIES(s.name)
                ? <Spark data={SERIES(s.name)}/>
                : <span aria-hidden className="block h-px w-16 bg-ruling"/>}
            </td>
            <td className="border-b border-rule py-3.5 pl-2 text-right font-mono text-meta
              tabular-nums text-ink-3">{s.weekAgo}</td>
            <td className="border-b border-rule py-3.5 pl-2 text-right font-mono text-num
              tabular-nums text-ink">{s.current}</td>
            <td className={cn('border-b border-rule py-3.5 pl-2 text-right font-mono text-meta tabular-nums',
              s.velocity > 0 ? 'text-warn' : s.velocity < 0 ? 'text-calm' : 'text-ink-3')}>
              {s.velocity > 0 ? '▲ +' : s.velocity < 0 ? '▼ ' : ''}{s.velocity}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* The floor of five, shown by running the rule rather than describing it: the
   period that falls under it renders as a withheld row, in line with the ones
   that cleared, so the gap is the point. */
function SmallGroups() {
  return (
    <ul className="m-0 list-none p-0">
      {COHORT_PERIOD.map(c => (
        <li key={c.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3
          border-b border-rule py-4 sm:grid-cols-[minmax(0,15rem)_minmax(6rem,1fr)_5rem]">
          <span className="order-1 min-w-0">
            <span className="block font-display text-meta font-bold text-ink">{c.label}</span>
            <span className="block text-fine text-ink-3">{c.n} students</span>
          </span>
          {/* the bar is ordered last on a phone and given the full row. In an
              auto-width column it collapsed to a few pixels, which quietly
              deleted the one thing this figure is here to show. */}
          <span className="order-3 col-span-2 sm:order-2 sm:col-span-1">
            {c.suppressed ? (
              <span className="block font-display text-fine text-ink-3">
                Under {K_ANONYMITY}, so nothing is reported</span>
            ) : (
              <Progress value={c.mean} label={`${c.label}, mean ${c.mean}`} className="h-2.5"/>
            )}
          </span>
          <span className="order-2 text-right font-mono text-meta tabular-nums text-ink sm:order-3">
            {c.suppressed ? 'withheld' : c.mean}</span>
        </li>
      ))}
    </ul>
  )
}

export function ForSchools({ go }) {
  return (
    <main>
      <Hero go={go} label="For schools" photo="pro-hero"
        photoAlt="A school counselor walking through a bright school corridor"
        title="What a counselor sees."
        lede="Whole-school patterns, a caseload ranked by change, and a hard floor under small groups."/>

      <Section name="The whole school" tone="paper">
        <SectionHead>How the school week runs</SectionHead>
        <SectionLede>Mean wellness score across all {SCHOOL_N} students whose families opted in.
          Thursday is the peak.</SectionLede>
        <Fig>
          {/* capped, because `Bars` divides its width evenly between five bars
              and at 1360px each one came out wider than it was tall, which
              reads as a colour block rather than a measurement */}
          <Bars data={SCHOOL_WEEK} color={ACCENT} unit="school day" className="max-w-[680px]"/>
        </Fig>
      </Section>

      <Section name="By class period" tone="card">
        <SectionHead>Class periods, and the floor under small groups</SectionHead>
        <SectionLede>Nothing is reported for a group under {K_ANONYMITY} students. Fifth period has
          three in it, so the figure is withheld rather than estimated.</SectionLede>
        <Fig>
          <SmallGroups/>
        </Fig>
      </Section>

      <Section name="The caseload" tone="mist">
        <SectionHead>Ranked by who changed this week</SectionHead>
        <SectionLede>A student who has always run high is rarely the one being missed, so the board
          ranks on the week's movement. Only students whose guardians consented to trends appear
          here.</SectionLede>
        <Fig>
          <Caseload/>
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
