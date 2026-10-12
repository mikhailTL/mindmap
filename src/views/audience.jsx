import React from 'react'
import { PHOTOS } from '../lib/photos'
import { Button } from '../ui/button'
import { ArrowLeft, ArrowRight, Check, Never } from '../ui/marks'
import { Section, SectionHead, SectionLede } from '../ui/section'
import { DemoNotice } from '../ui/notice'
import { Progress } from '../ui/progress'
import { List, Item } from '../ui/list'
import { WeekChart } from '../charts/week'
import { Bars, RainbowDial } from '../charts/rainbow'
import { Spark } from '../charts/primitives'
import { studentRings } from '../lib/readings'
import { SENSORS } from '../lib/sensors'
import { DATA } from '../lib/assets'
import { CHART_DATA } from '../lib/chartdata'
import { COHORT_PERIOD, COHORT_WEEKDAY, K_ANONYMITY, SCHOOL_N, TIER_LABEL, roster } from '../lib/caseload'
import { Parallax2D } from '../ui/motion'
import { cn } from '../lib/utils'
import {
  CASELOAD_DEF, CASELOAD_TITLE, CONSENT_OFF, CONSENT_SHORT, LOCATION, NOTES, SCORE,
  PRO_LC, PRO_PLURAL_LC, PRO_FOR,
} from '../lib/terms'

/* The three audience routes: students, parents, medical professionals.
 *
 * One figure per section, and nothing on the student or parent page is
 * clickable except the door into the app. The medical professional page is
 * deliberately the dense one — that asymmetry is intended, so do not even out
 * the three.
 *
 * All consent wording comes from lib/terms.js verbatim so the three pages
 * cannot drift apart on it. */

/* ───────────────────────────── shared page parts ───────────────────────── */

/* Hero images are concept shots, the patch rendered from the same CAD as the
   3D model. No unit has been worn — never describe them as photographs. */
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
          /* 48px travel, under the band's padding at every width; the image
             keeps its own box, so the grid does not reflow. */
          <Parallax2D distance={48} className="mt-6 lg:mt-0">
            <img src={PHOTOS[photo]} alt={photoAlt} loading="eager" decoding="async"
              width="1344" height="752"
              className="h-[200px] w-full rounded-panel object-cover sm:h-[260px]
                lg:h-[292px]"/>
          </Parallax2D>
        )}
      </div>
    </div>
  )
}

/* DemoNotice is attached here, not in each section, so a figure cannot lose its
   "this is generated" line in an edit. Only the chart drifts; the caveat stays.

   `drift` is per call site (one distance everywhere reads as a rendering
   fault). Keep each value small enough that half fits inside this figure's
   padding, or the chart reaches its edge.

   `clip` defaults to 'x' and is turned off only for the two WeekChart figures:
   that svg is `overflow-visible` to paint value labels outside its box, and a
   horizontal clip shears them. Safe only there — those drift in y alone. */
function Fig({ title, children, className, drift = 26, clip = 'x' }) {
  return (
    <figure className={cn('field m-0 mt-5 p-4 sm:p-5', className)}>
      {title && <figcaption className="mark mb-5">{title}</figcaption>}
      <Parallax2D distance={drift} clip={clip}>{children}</Parallax2D>
      <DemoNotice className="mt-6"/>
    </figure>
  )
}

/* The ink band is the site's single separation device: one per page. */
function Closer({ title, line, label, view, go }) {
  return (
    <Section name="Open the app" tone="ink" tight>
      <SectionHead tone="ink">{title}</SectionHead>
      <SectionLede tone="ink">{line}</SectionLede>
      {/* The solid variant disappears on the ink band; accent-lit carries ink
          text at 7.67:1. */}
      <Button className="mt-6 bg-accent-lit text-ink hoverOnly:bg-paper" onClick={() => go(view)}>
        {label} <ArrowRight aria-hidden/>
      </Button>
    </Section>
  )
}

/* ═══════════════════════════════ for students ═══════════════════════════ */

/* Read-only. The interactive RainbowKey belongs on the app screen, not here. */
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
              {/* text-ui until lg: "Temperature" at text-row overruns a 115px
                  tile at 390px and clips. */}
              <span className="font-display text-ui font-bold leading-tight text-ink lg:text-row">{s.name}</span>
            </span>
            {/* Numeral is ink, never the signal's colour: four coloured numerals
                down a page read as four alarms. */}
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
        photoAlt="A teenager playing a video game at home"
        title={`Your ${SCORE}, every day.`}
        lede="You decide what leaves your phone."/>

      {/* Consent wording is terms.js verbatim. CONSENT_SHORT and CONSENT_OFF
          together already state that nothing is shared by default — do not add
          a third sentence saying it again. */}
      <Section name="Your call" tone="card" tight>
        <SectionHead>You see all of it, first</SectionHead>
        <SectionLede>{CONSENT_SHORT} {CONSENT_OFF}</SectionLede>
      </Section>

      <Section name="Today" tone="paper">
        <SectionHead>Your {SCORE} today</SectionHead>
        <SectionLede>Measured against your own normal, never against anyone else.</SectionLede>
        <Fig drift={36}>
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:gap-12">
            <RainbowDial score={62} usual={51} rings={rings} size={440}/>
            <div className="w-full min-w-0">
              <Signals rings={rings}/>
            </div>
          </div>
        </Fig>
      </Section>

      <Section name="Your week" tone="card">
        <SectionHead>Which days ran hard</SectionHead>
        {/* Full bleed on a phone; see the parent page's copy for why. */}
        <Fig drift={20} clip={false}
          className="-mx-[22px] rounded-none border-x-0 p-3.5 sm:mx-0 sm:rounded-field sm:border-x sm:p-7">
          <WeekChart data={DATA.week} band={DATA.weekBand}/>
        </Fig>
      </Section>

      <Section name="Your privacy" tone="mist" tight>
        <SectionHead>Nothing leaves your phone unless you say so</SectionHead>
        <SectionLede>Parents and {PRO_PLURAL_LC} see a {SCORE} and a week. {NOTES} and {LOCATION}
          never leave your phone.</SectionLede>
      </Section>

      <Closer go={go} view="app-student" label="Open the student screen" title="The student screen"
        line={`Your ${SCORE} and the check-in. Sample readings only.`}/>
    </main>
  )
}

/* ═══════════════════════════════ for parents ════════════════════════════ */

/* Consent scope for a parent. UNSEEN is not a settings page a parent has not
   found — there is no parent view of any of it, which is why it is drawn as an
   absence. Moving a row between these lists is a consent change. */
const SEEN = [`The daily ${SCORE}`, 'Which days ran high', 'A patch gone quiet']
const UNSEEN = ['Any single reading', NOTES, LOCATION, 'Anything in real time']
function SeenUnseen() {
  return (
    <div className="mt-7 grid gap-5 sm:grid-cols-2 sm:gap-7">
      {[['You see', SEEN, true], ['You never see', UNSEEN, false]].map(([head, rows, yes], ci) => (
        /* Unequal drift (34 / 18) so the pair reads as two depths. h-full three
           deep because Parallax2D is the grid item and the row's stretch stops
           there: the lists have three and four rows, and without it the shorter
           panel loses the matched height the comparison needs. */
        <Parallax2D key={head} distance={ci ? 18 : 34} className="h-full [&>div]:h-full">
        <div className="field h-full p-5 sm:p-6">
          <h3 className="font-display text-head font-bold text-ink">{head}</h3>
          {/* The tick or the bar is this row's marker, so the list's own is off. */}
          <List className="mt-4 gap-3.5">
            {rows.map(r => (
              <Item key={r} marker="none" className="gap-3 text-sec text-ink-2">
                {yes ? <Check aria-hidden className="mt-1 size-5 shrink-0 text-accent"/>
                     : <Never aria-hidden className="mt-1 size-5 shrink-0 text-ink-3"/>}
                <span>{r}</span>
              </Item>
            ))}
          </List>
        </div>
        </Parallax2D>
      ))}
    </div>
  )
}

export function ForParents({ go }) {
  return (
    <main>
      <Hero go={go} label="For parents" photo="parent-hero"
        photoAlt="A mother and her teenage son looking at something together at home"
        title="What you see about your child."
        lede="A week, and one sentence about it."/>

      <Section name="The week" tone="paper">
        <SectionHead>Her week, against her own normal</SectionHead>
        {/* Full bleed on a phone. WeekChart collides value labels on two
            adjacent above-range bars below ~330px of plot, and Wed/Thu are
            that pair. Reclaiming the 22px gutters gives 362px, which clears. */}
        <Fig drift={20} clip={false}
          className="-mx-[22px] rounded-none border-x-0 p-3.5 sm:mx-0 sm:rounded-field sm:border-x sm:p-7">
          <p className="mb-5 max-w-[40ch] text-body text-ink">
            Monday, Wednesday and Thursday ran high.</p>
          <WeekChart data={DATA.week} band={DATA.weekBand}/>
        </Fig>
      </Section>

      <Section name="What you see" tone="card">
        <SectionHead>What you see, and what you never see</SectionHead>
        <SeenUnseen/>
      </Section>

      {/* Consent is per audience: granting a week to a parent grants nothing
          to a medical professional. CONSENT_SHORT states who decides. */}
      <Section name="Sharing" tone="paper" tight>
        <SectionHead>Sharing is set per audience</SectionHead>
        <SectionLede>{CONSENT_SHORT}</SectionLede>
      </Section>

      {/* The day is named; what happened in it is not, because the product
          does not have it. Do not imply otherwise here. */}
      <Section name="Using it" tone="mist" tight>
        <SectionHead>Be around on the days that ran high</SectionHead>
        <SectionLede>You know the day ran hard. Not what happened in it.</SectionLede>
      </Section>

      <Closer go={go} view="app-parent" label="Open the parent screen" title="The parent screen"
        line="The week, and what is shared. Sample readings only."/>
    </main>
  )
}

/* ═══════════════════════════════ for medical professionals ══════════════ */

/* `Bars` takes a paint, not a class, so accent is passed by value. #0a6e68 is
   what the token resolves to — keep them in step. */
const ACCENT = '#0a6e68'
const SCHOOL_WEEK = COHORT_WEEKDAY.map(d => ({ label: d.label, v: d.mean }))

/* Ordered on the week's movement, not on today's score: a student who has
   always run high is rarely the one being missed. CASELOAD_DEF states the
   ordering above the table, so keep the two in agreement.

   A real <table>, for the column headers, row scope and numeric alignment. */
const BOARD = roster().filter(s => s.showTrend).sort((a, b) => b.velocity - a.velocity)
const SERIES = name => CHART_DATA.pro?.[name.replace(/\D/g, '')]
function Caseload() {
  return (
    <table className="w-full border-collapse text-left">
      <caption className="sr-only">{CASELOAD_TITLE}</caption>
      <thead>
        <tr className="border-b border-ink font-display text-fine font-bold text-ink-2 sm:text-tick">
          <th scope="col" className="py-3 pr-3">Student</th>
          {/* The seven weekly points the rank is built on; hidden below sm,
              where the three figures carry the row. */}
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
              {/* Not every student has a weekly series in the fixtures. A blank
                  cell in a table of figures reads as a bug, so draw the
                  absence as a flat rule. */}
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

/* k-anonymity floor: a period under K_ANONYMITY renders as a withheld row in
   line with the ones that cleared. Never print a mean for a suppressed row. */
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
          {/* Bar is ordered last on a phone and given the full row: in an
              auto-width column it collapses to a few pixels. */}
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
      <Hero go={go} label={PRO_FOR} photo="pro-hero"
        photoAlt={`A ${PRO_LC} and a student talking, the MindMap patch on the student’s upper arm`}
        title={`What a ${PRO_LC} sees.`}
        lede="Caseload-wide patterns, and a floor under small groups."/>

      <Section name="Across the caseload" tone="paper">
        <SectionHead>How the week runs</SectionHead>
        {/* The consent qualifier appears once per page. Bars inks the peak, so
            no sentence should name the tallest bar. */}
        <SectionLede>Mean {SCORE}, all {SCHOOL_N} students sharing with a {PRO_LC}.</SectionLede>
        <Fig drift={30}>
          {/* Width cap: `Bars` splits its width evenly between five bars, and
              at 1360px each is wider than it is tall. */}
          <Bars data={SCHOOL_WEEK} color={ACCENT} unit="school day" className="max-w-[680px]"/>
        </Fig>
      </Section>

      <Section name="By class period" tone="card">
        <SectionHead>The floor under small groups</SectionHead>
        <SectionLede>Nothing is reported for a group under {K_ANONYMITY} students.</SectionLede>
        <Fig drift={18}>
          <SmallGroups/>
        </Fig>
      </Section>

      <Section name="The caseload" tone="mist">
        <SectionHead>{CASELOAD_TITLE}</SectionHead>
        <SectionLede>{CASELOAD_DEF}</SectionLede>
        <Fig drift={12}>
          <Caseload/>
        </Fig>
      </Section>

      {/* Consent scope for a medical professional; all three claims are product-critical.
          A score and its direction only, never a reading, notes or location,
          and every record opened is logged with no setting to turn it off. The
          full who-sees-what matrix is on the overview and privacy pages. */}
      <Section name="Access" tone="paper">
        <SectionHead>What a {PRO_LC} gets</SectionHead>
        <SectionLede>A {SCORE}, and the direction it moved.</SectionLede>
        <p className="mt-5 max-w-[54ch] text-sec leading-[1.55] text-ink-2">
          Never a single reading. Never {NOTES}. Never {LOCATION}.</p>
        <p className="mt-3 max-w-[54ch] text-sec leading-[1.55] text-ink-2">
          Every record opened is logged. No setting turns the log off.</p>
      </Section>

      <Closer go={go} view="app-pro" label="Open the console"
        title={`The ${PRO_LC} console`}
        line="The check-in list and the audit log. Sample students only."/>
    </main>
  )
}
