import React from 'react'
import { PHOTOS } from '../lib/photos'
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
import { COHORT_PERIOD, COHORT_WEEKDAY, K_ANONYMITY, SCHOOL_N, TIER_LABEL, roster } from '../lib/caseload'
import { cn } from '../lib/utils'
import {
  CASELOAD_DEF, CASELOAD_TITLE, CONSENT_OFF, CONSENT_SHORT, LOCATION, NOTES, SCORE,
} from '../lib/terms'

/* The three audience routes: for students, for parents, for schools.
 *
 * The last pass answered "make these pages theirs" by giving each one more
 * machinery: a day tagger a student had to fill in, four sharing switches, a
 * caseload that could be re-sorted, a detail panel that opened under the arch.
 * The owner's note on it was that the diagrams were too complex, and he was
 * right about the cause. Every one of those controls is a thing a reader has
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
 *
 * Density means figures, not paragraphs. The pass before this one put the
 * schools page at 548 rendered words, and over half of them were prose laid
 * around the figures: a lede that restated its heading, a caption that said in
 * words what the bars already showed, the consent qualifier written out three
 * times. The copy is cut back to a claim per heading and one line under it.
 * No figure lost a data point, and one whole figure went with the prose, for
 * the reason given where it used to stand.
 */

/* ───────────────────────────── shared page parts ───────────────────────── */

/* The band takes a photograph from lg and stacks it under the copy below
   that. The images are concept shots: the patch in them is rendered from the
   same CAD the 3D model on the patch page is built from, and no unit has been
   worn by anybody. */
function Hero({ label, title, lede, go, photo, photoAlt }) {
  return (
    <div className="border-b border-rule bg-mist">
      <div className={cn('wrap py-7 lg:py-9', photo &&
        'lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,42%)] lg:items-center lg:gap-10')}>
        <div className="min-w-0">
        <button onClick={() => go('site')}
          className="mb-5 flex min-h-[44px] w-fit items-center gap-2 py-2 font-display text-meta
            font-medium text-accent transition-colors duration-150 hoverOnly:text-accent-ink">
          <ArrowLeft aria-hidden className="size-4"/> Overview
        </button>
        <p className="font-mono text-row font-bold tracking-[0.005em] text-accent">{label}</p>
        <h1 className="mt-3 max-w-[16ch] font-display text-major font-bold leading-[1.06]
          tracking-tight text-ink">{title}</h1>
        <p className="mt-4 max-w-[46ch] text-lead text-ink-2">{lede}</p>
        </div>
        {photo && (
          <img src={PHOTOS[photo]} alt={photoAlt} loading="eager" decoding="async"
            width="1344" height="752"
            className="mt-6 h-[200px] w-full rounded-panel object-cover sm:h-[260px]
              lg:mt-0 lg:h-[292px]"/>
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
    <figure className={cn('field m-0 mt-5 p-4 sm:p-5', className)}>
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
      <Button className="mt-6 bg-accent-lit text-ink hoverOnly:bg-paper" onClick={() => go(view)}>
        {label} <ArrowRight aria-hidden/>
      </Button>
    </Section>
  )
}

/* ═══════════════════════════════ for students ═══════════════════════════ */

/* The four signals as a flat readout, replacing the RainbowKey tiles and the
   panel that opened under them. Those are the app's control surface and they
   belong on the app screen; here they were four buttons that only ever led
   back to the figure already on the page. Name, colour, figure, bar, nothing
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
        photoAlt="A wearable sensor worn on the back of an upper arm, under a short sleeve"
        title={`Your ${SCORE}, every day.`}
        lede="You decide what leaves your phone."/>

      {/* W2-D: ownership is the opening claim, not a line at the foot of the
          page. The consent wording is terms.js verbatim so that the student,
          parent and school pages cannot drift apart on it. The third sentence
          that used to sit between the two constants said that nothing is
          shared by default, which is what both of them already say. */}
      <Section name="Your call" tone="card" tight>
        <SectionHead>You see all of it, first</SectionHead>
        <SectionLede>{CONSENT_SHORT} {CONSENT_OFF}</SectionLede>
      </Section>

      <Section name="Today" tone="paper">
        <SectionHead>Your {SCORE} today</SectionHead>
        <SectionLede>Measured against your own normal, never against anyone else.</SectionLede>
        <Fig>
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:gap-12">
            {/* the arch is the picture on this page, so it gets the room: it
                leads at any width and takes half the row on a laptop */}
            <RainbowDial score={62} usual={51} rings={rings} size={440}/>
            <div className="w-full min-w-0">
              {/* no sentence over the tiles. The dial already shows the day
                  sitting above the usual band and the tiles already show which
                  signal moved, so the line was the figure read aloud. */}
              <Signals rings={rings}/>
            </div>
          </div>
        </Fig>
      </Section>

      <Section name="Your week" tone="card">
        <SectionHead>Which days ran hard</SectionHead>
        {/* no lede: it counted the bars drawn directly under it. Bleeds to the
            screen edge on a phone, as on the parent page's copy of this
            figure, where the reason is written out. */}
        <Fig className="-mx-[22px] rounded-none border-x-0 p-3.5 sm:mx-0 sm:rounded-field sm:border-x sm:p-7">
          <WeekChart data={DATA.week} band={DATA.weekBand}/>
        </Fig>
      </Section>

      <Section name="Your privacy" tone="mist" tight>
        <SectionHead>Nothing leaves your phone unless you say so</SectionHead>
        <SectionLede>Parents and schools see a {SCORE} and a week. {NOTES} and {LOCATION} never
          leave your phone.</SectionLede>
      </Section>

      <Closer go={go} view="app-student" label="Open the student screen" title="The student screen"
        line={`Your ${SCORE} and the check-in. Sample readings only.`}/>
    </main>
  )
}

/* ═══════════════════════════════ for parents ════════════════════════════ */

/* Two lists side by side, because the contrast IS the product for a parent.
   The second list is not a settings page they have not found yet: there is no
   parent view of any of it, which is why it is drawn as an absence. */
const SEEN = [`The daily ${SCORE}`, 'Which days ran high', 'A patch gone quiet']
const UNSEEN = ['Any single reading', NOTES, LOCATION, 'Anything in real time']
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
        photoAlt="A parent and their teenager talking across a kitchen counter"
        title="What you see about your child."
        lede="A week, and one sentence about it."/>

      <Section name="The week" tone="paper">
        <SectionHead>Her week, against her own normal</SectionHead>
        {/* Full bleed on a phone. WeekChart collides the value labels on two
            adjacent above-range bars once the plot drops under about 330px,
            and Wednesday and Thursday are exactly that pair. Taking back the
            22px gutters puts the chart at 362px, which clears them. */}
        <Fig className="-mx-[22px] rounded-none border-x-0 p-3.5 sm:mx-0 sm:rounded-field sm:border-x sm:p-7">
          {/* the sentence sits above the chart, not under it. A parent who
              reads only the first line has still got the whole message. */}
          <p className="mb-5 max-w-[40ch] text-body text-ink">
            Monday, Wednesday and Thursday ran high.</p>
          <WeekChart data={DATA.week} band={DATA.weekBand}/>
        </Fig>
      </Section>

      <Section name="What you see" tone="card">
        {/* the heading names both lists, because the contrast is the figure.
            The lede under it used to say there is no parent view for the second
            list, which is what the second list is drawn to say. */}
        <SectionHead>What you see, and what you never see</SectionHead>
        <SeenUnseen/>
      </Section>

      {/* W2-B: the control model, stated as mechanism, on the page a parent
          reads. Per audience is the heading now rather than a clause at the end
          of a four-sentence lede: switching a week on for home switches nothing
          on for school. CONSENT_SHORT says who decides, which is the rest of
          the model, and the sentences that used to stand beside it restated it
          in other words. */}
      <Section name="Sharing" tone="paper" tight>
        <SectionHead>Sharing is set per audience</SectionHead>
        <SectionLede>{CONSENT_SHORT}</SectionLede>
      </Section>

      {/* W2-A: what a parent gets out of the week is timing. The day is named;
          what happened in it is not, because the product does not have it. */}
      <Section name="Using it" tone="mist" tight>
        <SectionHead>Be around on the days that ran high</SectionHead>
        <SectionLede>You know the day ran hard. Not what happened in it.</SectionLede>
      </Section>

      <Closer go={go} view="app-parent" label="Open the parent screen" title="The parent screen"
        line="The week, and what is shared. Sample readings only."/>
    </main>
  )
}

/* ═══════════════════════════════ for schools ════════════════════════════ */

/* Whole-school means by day of the school week. `Bars` is the app's own bar
   figure and takes a paint rather than a class, so the accent token is passed
   by value here; it is the same #0a6e68 the class would resolve to. */
const ACCENT = '#0a6e68'
const SCHOOL_WEEK = COHORT_WEEKDAY.map(d => ({ label: d.label, v: d.mean }))

/* The caseload, ordered on the week's movement rather than on today's Mind Score,
   because a student who has always run high is rarely the one being missed.
   The sort toggle that used to make that argument is gone: it asked a reader
   to run an experiment to be told a one-line conclusion. CASELOAD_DEF states
   the ordering over the table, and the "was" and "now" columns are the
   argument, so the sentence that spelled it out under the lede has gone too.

   A table rather than a list. This is the one page whose audience reads
   tables, and a table gets column headers, row scope and alignment for free. */
const BOARD = roster().filter(s => s.showTrend).sort((a, b) => b.velocity - a.velocity)
const SERIES = name => CHART_DATA.pro?.[name.replace(/\D/g, '')]
function Caseload() {
  return (
    <table className="w-full border-collapse text-left">
      {/* CASELOAD_DEF is the lede over the table now, so the caption is the
          table's name rather than a second copy of the definition. */}
      <caption className="sr-only">{CASELOAD_TITLE}</caption>
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
        photoAlt="A school counselor and a student talking across a desk"
        title="What a counselor sees."
        lede="Whole-school patterns, and a floor under small groups."/>

      <Section name="The whole school" tone="paper">
        <SectionHead>How the school week runs</SectionHead>
        {/* the consent qualifier, once on the page rather than in three ledes,
            and no sentence naming the tallest bar: Bars inks the peak and greys
            the rest for exactly that reason. */}
        <SectionLede>Mean {SCORE}, all {SCHOOL_N} students sharing with the school.</SectionLede>
        <Fig>
          {/* capped, because `Bars` divides its width evenly between five bars
              and at 1360px each one came out wider than it was tall, which
              reads as a colour block rather than a measurement */}
          <Bars data={SCHOOL_WEEK} color={ACCENT} unit="school day" className="max-w-[680px]"/>
        </Fig>
      </Section>

      <Section name="By class period" tone="card">
        <SectionHead>The floor under small groups</SectionHead>
        {/* the rule, and not the worked example of it. Fifth period renders as
            a withheld row in line with the ones that cleared, so the sentence
            that used to name it was reading the figure out. */}
        <SectionLede>Nothing is reported for a group under {K_ANONYMITY} students.</SectionLede>
        <Fig>
          <SmallGroups/>
        </Fig>
      </Section>

      <Section name="The caseload" tone="mist">
        <SectionHead>{CASELOAD_TITLE}</SectionHead>
        <SectionLede>{CASELOAD_DEF}</SectionLede>
        <Fig>
          <Caseload/>
        </Fig>
      </Section>

      {/* What a counselor is given, what a counselor is never given, and what
          is kept about every record opened. Three claims, one line each.

          The who-sees-what matrix used to close this page and has been taken
          out rather than trimmed. It is 136 rendered words, it runs on the
          overview and on the privacy page already, and two of its three
          columns are a parent's and a student's, which is not what this
          audience came for. The counselor column is the lede under the
          heading. The k floor was also stated twice on this page and is now
          stated once, beside the figure that runs it. */}
      <Section name="Access" tone="paper">
        <SectionHead>What a counselor gets</SectionHead>
        <SectionLede>A {SCORE}, and the direction it moved.</SectionLede>
        <p className="mt-5 max-w-[54ch] text-sec leading-[1.55] text-ink-2">
          Never a single reading. Never {NOTES}. Never {LOCATION}.</p>
        <p className="mt-3 max-w-[54ch] text-sec leading-[1.55] text-ink-2">
          Every record opened is logged. No setting turns the log off.</p>
      </Section>

      <Closer go={go} view="app-pro" label="Open the counselor console" title="The counselor console"
        line="The check-in list and the audit log. Sample students only."/>
    </main>
  )
}
