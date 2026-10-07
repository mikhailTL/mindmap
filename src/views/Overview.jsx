import React from 'react'
import { Button } from '../ui/button'
import { Section, SectionHead, SectionLede } from '../ui/section'
import { ScrollIn, ScrollRow } from '../s21/motion'
import { ArrowRight } from '../ui/marks'
import { IPhone } from '../ui/iphone'
import { PhoneApp } from '../ui/phone-app'
import { PatchFront } from '../charts/patch-front'
import { RainbowDial } from '../charts/rainbow'
import { ProblemStats } from '../charts/problem'
import { studentRings } from '../lib/readings'
import { triage, tierOf, TIER_LABEL } from '../lib/caseload'
import { DATA } from '../lib/assets'
import { HowItWorks, WhoSeesWhat, WeekStrip } from '../charts/infographics'
import { Card } from '../ui/card'
import { cn } from '../lib/utils'

/* The homepage, in the order the argument actually runs.
 *
 * It used to open with the product and put the reason for it on the fourth
 * band, behind a heading called "Why it matters" and a row of facts about the
 * device: four signals, forty five seconds, fourteen days. A visitor was being
 * told how the thing works before being told why anyone built it, and the one
 * figure on the page that was about a teenager was a placeholder.
 *
 * The order is now: what this is, what the problem is, the three ways to
 * start, how a reading works, who sees what, privacy, and what it will never
 * do. Each band answers the question the band above it raises, which is the
 * only ordering rule this page needs.
 *
 * WHAT WENT, and why. There was a light band called "Why MindMap helps"
 * between the problem and the three doors, carrying the 1-in-5 treatment
 * funnel and a two-lane timing diagram. It is gone: the review asked for every
 * statistic to sit on the dark band and said this one was "too much", so the
 * one fact in the funnel worth keeping is now a row on the dark band and the
 * timing diagram, which measured nothing and was captioned as a shape rather
 * than a figure, is not replaced.
 *
 * GROUNDS. Every band is a <Section>, which owns its padding and its heading
 * size, and the ground is chosen here because the ladder is a property of the
 * page and not of any one band. Alternating the two near-whites is invisible —
 * paper and card differ by about 2% in luminance — so the ladder runs
 * white, tint, white, tint between two dark bands:
 *
 *   hero            paper, ruled
 *   the problem     ink            every statistic on the page
 *   3 ways          accent.wash    the green tint
 *   a day in        card           white
 *   3 perspectives  beam.wash      the turquoise tint
 *   privacy         card           white
 *   never do        ink            the close
 *
 * Both washes are real palette grounds and the site had barely used either.
 * ink 12.7 : 1, ink.2 6.9 : 1, ink.3 4.67 : 1 and accent 4.84 : 1 all clear AA
 * on both of them, so nothing on a tinted band needed a different colour than
 * it had on paper. The one thing that did need changing is hover: mist/60 on a
 * wash is the same luminance as the wash, so the rows that hover now hover to
 * card instead.
 *
 * Nothing on this page is a row of three equal rounded cards. There were two
 * of them, one under the other, and a row of equal cards with an icon on top
 * is the single most generated-looking object on the web. Both are ruled rows.
 */

/* The three ways in, in the order a visitor can answer them: the one that
   needs hardware, the one that needs nothing, and the one for somebody who is
   only looking. The middle one carries the accent rule because it is the only
   one a stranger can use in the next minute. */
const DOORS = [
  { id:'patch', go:'patch', title:'Wear the patch', note:'Needs the patch',
    line:'A real reading from your own body, all day, off a sticker that takes pulse, sweat, temperature and movement once a second.',
    art:(
      <svg viewBox="0 0 220 120" className="h-[46px] w-auto" aria-hidden focusable="false">
        <rect x="7" y="23" width="206" height="74" rx="37" className="fill-card stroke-ink" strokeWidth="2"/>
        <rect x="56" y="33" width="108" height="54" rx="22" className="fill-mist stroke-ink" strokeWidth="1.6"/>
        <circle cx="110" cy="60" r="14" fill="none" className="stroke-ink-3" strokeWidth="1.6"/>
        <circle cx="110" cy="60" r="4.5" className="fill-accent"/>
      </svg>) },
  { id:'phone', go:'without-patch', title:'Use your phone', note:'No hardware needed', lead:true,
    line:'A real reading from your own body in forty five seconds, off the camera and one spoken sentence.',
    art:(
      <svg viewBox="0 0 220 120" className="h-[46px] w-auto" aria-hidden focusable="false">
        <rect x="74" y="3" width="72" height="114" rx="12" className="fill-card stroke-ink" strokeWidth="2"/>
        <rect x="86" y="19" width="48" height="48" rx="8" className="fill-ink"/>
        <circle cx="102" cy="39" r="8" className="fill-accent"/>
        <circle cx="122" cy="39" r="5" className="fill-beam"/>
        <path d="M84 91 q10 -16 20 0 t20 0 t12 -6" fill="none" stroke="#a8321f"
          strokeWidth="2.4" strokeLinecap="round"/>
      </svg>) },
  { id:'demo', go:'app', title:'Try the demo', note:'No reading taken',
    line:'Every screen filled with made up data, so you can look around without measuring anything.',
    art:(
      <svg viewBox="0 0 220 120" className="h-[46px] w-auto" aria-hidden focusable="false">
        <rect x="18" y="13" width="184" height="94" rx="10" fill="none" className="stroke-ruling"
          strokeWidth="2" strokeDasharray="7 6"/>
        <path d="M42 83 L74 57 L104 69 L136 35 L178 47" fill="none" className="stroke-accent"
          strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="178" cy="47" r="5.5" className="fill-beam"/>
      </svg>) },
]

/* The three people, in the order they meet the product: the one wearing it,
   the one it reports to, then the school. Each tile shows that screen's own
   live chart rather than a photograph of somebody holding a phone. */
const SCREENS = [
  { id:'student', who:'Student', photo:'student-card',
    alt:'A student outdoors at school, the patch worn on her upper arm under a short sleeve',
    title:'Your score today, and what moved it',
    line:'You see the score, the four signals behind it, and every reading ever taken.',
    cta:'What a student gets' },
  { id:'parent',  who:'Parent', photo:'parent-card',
    alt:'A parent and their teenager talking at a kitchen table, the patch on the teenager\u2019s upper arm',
    title:'One sentence a week, and which days ran high',
    line:'You see the shape of the week. Never a raw reading, never a note, never a location.',
    cta:'What a parent gets' },
  { id:'pro',     who:'School counselor', photo:'school-card',
    alt:'A school counselor at her desk, mid conversation with a student',
    title:'A caseload ranked by who is changing fastest',
    line:'You see a score and a rank, for the students whose guardian agreed to share trends.',
    cta:'What a school gets' },
]

/* Each preview is the live component that screen actually uses, on that
   screen's own data. A screenshot would go stale the first time a chart
   changed, and a photograph of somebody holding a phone shows nothing at all.

   The student's dial is drawn at roughly twice the other two, because the
   student is the person who wears the thing and the layout should say so
   before the words do. */
function Preview({ id }) {
  if (id === 'student') {
    return <RainbowDial score={51} usual={46} rings={studentRings()} size={244}/>
  }
  if (id === 'parent') {
    return (
      <div className="w-[13rem] shrink-0">
        <WeekStrip days={DATA.week} band={DATA.weekBand}/>
      </div>
    )
  }
  /* `roster()` calls the reading `current`, not `score`. Reading `s.score` gave
     every row undefined, which tierOf floors to 'info', so this preview once
     rendered four identical rows and four zero-width bars. */
  const rows = triage().slice(0, 4)
  /* Divs and not a list, because this whole preview sits inside a <button>
     and a <ul> inside a button is content a browser is allowed to move. */
  return (
    <div className="w-[13rem] shrink-0 space-y-2.5">
      {rows.map(s => {
        const tier = tierOf(s.current)
        return (
          <span key={s.id} className="grid grid-cols-[1fr_4.5rem] items-center gap-3">
            <span className="block h-2 w-full rounded-bar bg-rule/70">
              <span className={cn('block h-2 rounded-bar',
                tier === 'crisis' ? 'bg-crit' : tier === 'high' ? 'bg-warn' : 'bg-accent')}
                style={{ width: `${s.current}%` }}/>
            </span>
            <span className="font-mono text-fine tabular-nums text-ink-2">{TIER_LABEL[tier]}</span>
          </span>
        )
      })}
    </div>
  )
}

/* What a reader asks the moment they see a sticker on somebody's arm. Every
   line here is a fact the hardware thread has settled, and the last one is the
   one it has not: an invented wear time would be the only unmeasured number on
   the page. */
const PATCH_FACTS = [
  'An adhesive sticker, worn on the upper arm.',
  'A short sleeve covers it. Nothing shows when it is covered.',
  'Three parts: a printed outer shell, an electronics pod, and the skin side base.',
  'The board drops into the pod. The shell charges through a slot in its side.',
  'How long one adhesive lasts before it is replaced is not settled. No unit has been worn by anyone yet.',
]

const NEVER = [
  'Show a parent a raw reading',
  'Report on a group of under five students',
  'Keep data longer than the student chooses',
  'Open a record without logging it',
  'Sell or share anything with anyone',
  'Diagnose anything. This is not a medical device',
]

/* The hero's three facts. Fragments, not sentences: the title screen is
   scanned, never read, and each of these answers one question a reviewer
   asked. What does it measure, where does it measure, who else sees it. */
const HERO_FACTS = [
  'Pulse, sweat, temperature, movement.',
  'From a patch on your arm, or your phone alone.',
  'You choose who else sees it.',
]

export function Overview({ go }) {
  return (
    <main>
      {/* ── the hero ──────────────────────────────────────────────────────
          Type on a ruled sheet on the left, the two devices on the right, and
          the band is exactly one screen tall: `h-` and not `min-h-`, so the
          section below cannot show a strip of itself at the bottom of the
          first view and the page opens on one thing rather than one and a
          half. Below lg it goes back to `min-h-`, because a phone cannot fit a
          headline, two buttons and two drawings in 700px without shrinking one
          of them past use. */}
      <section id="hero" className="relative isolate flex min-h-[calc(100svh-57px)] flex-col
        overflow-hidden border-t border-rule bg-paper lg:h-[calc(100svh-57px)] lg:min-h-0">

        <div className="wrap relative z-10 flex flex-1 flex-col
          lg:grid lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)]
          xl:grid-cols-[minmax(0,44rem)_minmax(0,1fr)]
          2xl:grid-cols-[minmax(0,50rem)_minmax(0,1fr)]">

          <div className="flex shrink-0 flex-col justify-center py-10 lg:py-0 lg:pr-10">
            {/* The name, with the hairline a drawing puts in front of a key.
                accent on paper is 5.52 : 1, so it can be a word and not only a
                colour. */}
            <ScrollIn as="p" className="flex items-center gap-3 font-mono text-row font-bold
              tracking-[0.005em] text-accent">
              <span aria-hidden className="h-px w-7 shrink-0 bg-accent/55"/>
              MindMap, a wellness app for teenagers
            </ScrollIn>
            {/* Set the way the first version of this page set it: medium
                weight, not bold, and breaking after "stress" so "readable."
                takes the second line on its own. Balanced wrapping is off for
                the same reason, since balancing moved the break to wherever
                the two lines came out most even, which was mid-phrase. The
                column widened to 40rem at xl because the break only falls
                there if the line has room for it.

                Leading is 1.06 and not 1.02: at 1.02 the descenders of
                "Making your stress" landed in the cap height of "readable". */}
            <h1 className="mt-5 max-w-[19ch] font-display text-view font-medium leading-[1.06]
              tracking-tight text-ink lg:text-sect 2xl:text-fig">
              Making your stress <span className="text-accent">readable</span>.
            </h1>
            {/* Two paragraphs stood here, sixty words of prose on a title
                screen. Nobody reads a paragraph above the fold. One line says
                what comes back, three fragments say where it comes from, and
                the whole block is twenty seven words you can take in without
                reading a sentence. */}
            <ScrollIn as="p" className="mt-6 max-w-[26ch] text-lead font-medium leading-[1.3] text-ink">
              One score a day, out of 100. One sentence saying what changed.
            </ScrollIn>
            <ScrollIn as="ul" className="m-0 mt-5 flex list-none flex-col gap-2 p-0">
              {HERO_FACTS.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sec text-ink-2">
                  <span aria-hidden className="mt-[0.62em] h-[3px] w-3 shrink-0 rounded-bar bg-accent"/>
                  {f}
                </li>
              ))}
            </ScrollIn>
            <ScrollIn className="mt-8">
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => go('app')}>Open the app<span aria-hidden>→</span></Button>
                <Button variant="outline" onClick={() => go('without-patch')}>Take a reading from your phone</Button>
              </div>
            </ScrollIn>
          </div>

          {/* Two fields, side by side, each running the full height of the
              band. Stacking them cost the phone half its height for nothing:
              a phone drawing is tall and a patch drawing is not, so side by
              side is the arrangement that gives both of them their own size.

              `after` on each field is the part of it that lives past the
              wrap's right edge: over 1680 the wrap stops short of the viewport
              and a tint that stopped with it left a strip of bare paper beside
              a full-bleed band, which reads as a mistake. */}
          <div className="relative -mx-[22px] flex flex-1 border-t border-rule
            sm:-mx-10 lg:mx-0 lg:-mr-10 lg:border-l lg:border-t-0">

            <div className="relative flex flex-1 items-center justify-center overflow-hidden
              border-r border-rule bg-accent-wash px-4 py-8 lg:py-0
              after:absolute after:inset-y-0 after:left-full after:hidden after:w-screen
              after:bg-accent-wash after:content-[''] lg:after:block">
              {/* registration marks, the way a sheet carries them: two corners,
                  hairline, no frame. They are the reason a tinted field reads
                  as a plate on a drawing rather than as a box. */}
              <span aria-hidden className="absolute left-3 top-3 h-3 w-3 border-l border-t border-ruling/55"/>
              <span aria-hidden className="absolute bottom-3 left-3 h-3 w-3 border-b border-l border-ruling/55"/>
              {/* The glow is behind the drawing and is the only thing moving in
                  this field. It is a blurred radial in the accent, breathing on
                  a nine second cycle, which is slow enough to read as the thing
                  being alive rather than as an animation playing. It stops
                  under reduced motion and what is left is a still soft light,
                  not a hard edge appearing. */}
              <span aria-hidden className="mm-glow pointer-events-none absolute left-1/2 top-1/2
                h-[62%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-[50%]"/>
              {/* The caption is the figure's own label. The "4 signals" claim
                  used to stand on its own beside this drawing, which told a
                  reader there were four of something and not what. */}
              <figure className="relative m-0 flex min-w-0 max-w-full flex-col items-center gap-3">
                <PatchFront className="w-[180px] sm:w-[224px] lg:w-[250px] xl:w-[290px]"/>
                <figcaption className="max-w-[17ch] text-balance text-center font-display text-fine
                  font-bold tracking-[0.01em] text-ink-3 sm:max-w-none">
                  Pulse, sweat, temperature, movement
                </figcaption>
              </figure>
            </div>

            <div className="relative flex flex-1 flex-col items-center justify-center
              bg-beam-wash px-4 py-8 lg:py-0
              after:absolute after:inset-y-0 after:left-full after:hidden after:w-screen
              after:bg-beam-wash after:content-[''] lg:after:block">
              <span aria-hidden className="absolute right-3 top-3 h-3 w-3 border-r border-t border-ruling/55"/>
              <span aria-hidden className="absolute bottom-3 right-3 h-3 w-3 border-b border-r border-ruling/55"/>
              <IPhone model="15-pro" scale={0.3} screenBg="#f5fafa"
                label="The MindMap app, cycling through a reading, the score it returns and the week it lands in"
                className="shrink-0 lg:hidden">
                <PhoneApp/>
              </IPhone>
              <IPhone model="15-pro" scale={0.52} screenBg="#f5fafa"
                label="The MindMap app, cycling through a reading, the score it returns and the week it lands in"
                className="hidden shrink-0 lg:block xl:hidden">
                <PhoneApp/>
              </IPhone>
              <IPhone model="15-pro" scale={0.62} screenBg="#f5fafa"
                label="The MindMap app, cycling through a reading, the score it returns and the week it lands in"
                className="hidden shrink-0 xl:block">
                <PhoneApp/>
              </IPhone>
            </div>
          </div>
        </div>
      </section>

      {/* The band that stood here showed the patch drawing and the phone
          again, at the same size, with the same two captions. They are in the
          hero now, so this was the same figure printed twice on one page. */}

      {/* ── the problem, on the one dark band ────────────────────────────
          Straight under the hero, because a reader who does not believe there
          is a problem has no reason to care how the product works. Every
          figure here is external and sourced. The band this replaces carried
          three facts about the device and one placeholder reading
          "[cited stat]", which was honest and useless. */}
      <Section name="The problem" tone="ink">
        <SectionHead tone="ink" className="max-w-[30ch]">
          Most teenagers who are struggling are not being reached.
        </SectionHead>
        <ProblemStats className="mt-6"/>
      </Section>

      {/* ── the three doors ──────────────────────────────────────────────
          Three cards, not three ruled rows. The rows were a deliberate earlier
          choice and the review overturned it in as many words: a horizontal
          rule between items reads as a new topic beginning, so three options
          separated by rules read as three sections rather than as one choice
          with three answers. A card closes a group. A rule cuts one up. */}
      <Section name="Getting started" tone="card" className="bg-accent-wash">
        <SectionHead>3 Ways to Use MindMap</SectionHead>
        <SectionLede>
          All three open the same app. They differ in what it has to work with.
        </SectionLede>
        <div className="mt-7 grid auto-rows-fr gap-5 md:grid-cols-3">
          {DOORS.map((d, i) => (
            <ScrollRow key={d.id} index={i} className="h-full">
              <Card interactive as="button" type="button" onClick={() => go(d.go)}
                className={cn('flex h-full flex-col p-6', d.lead && 'border-l-accent')}>
                <span className="grid h-[72px] place-items-start" aria-hidden>{d.art}</span>
                <span className="mt-4 block font-display text-head font-bold leading-tight text-ink">
                  {d.title}
                </span>
                <span className="mt-2 block text-sec leading-[1.5] text-ink-2">{d.line}</span>
                <span className="mt-auto flex items-center gap-2 pt-5 font-display text-meta
                  font-bold text-accent">
                  {d.note}
                  <ArrowRight className="size-[1.1rem] transition-transform duration-200
                    group-hover:translate-x-1.5"/>
                </span>
              </Card>
            </ScrollRow>
          ))}
        </div>
      </Section>

      {/* ── how a reading works ─────────────────────────────────────────── */}
      <Section name="How it works" tone="card" tight className="bg-aqua">
        <SectionHead>A day in, one score and one sentence out.</SectionHead>
        <HowItWorks className="mt-6"/>
        {/* One window, five lines. The reviewer asked five questions about the
            object itself and the page answered none of them. */}
        <div className="mt-6 rounded-panel border border-rule bg-card p-6">
          <h3 className="font-display text-head font-bold leading-tight text-ink">The patch itself</h3>
          <ul className="mt-4 grid list-none gap-x-10 gap-y-2.5 p-0 md:grid-cols-2">
            {PATCH_FACTS.map(t => (
              <li key={t} className="flex gap-3 text-sec leading-[1.5] text-ink-2">
                <span aria-hidden className="mt-[0.62em] size-1.5 shrink-0 rounded-chip bg-accent"/>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ── the three audiences ──────────────────────────────────────────
          Not three equal tiles. The student is the person wearing the thing
          and is given roughly twice the area and twice the artwork; the parent
          and the counselor are two ruled rows beside them, which is also the
          truth about how much each of those two is shown. */}
      <Section name="Who it is for" tone="card" id="screens" className="bg-beam-wash">
        <SectionHead>3 Perspectives</SectionHead>
        <SectionLede>
          One day of measurements, read three ways. The student sees all of it; the other two see
          only what the student agreed to share.
        </SectionLede>
        {/* Three equal cells. It had been one wide student cell beside two
            stacked rows, which made the student's screen look like the product
            and the other two like footnotes. They are three views of the same
            day and the grid should say so: same width, same height, same
            order of parts in each. */}
        <div className="mt-7 grid auto-rows-fr gap-5 lg:grid-cols-3">
          {SCREENS.map((s2, i) => (
            <ScrollRow key={s2.id} index={i} className="h-full">
              <button type="button" onClick={() => go(s2.id)}
                /* Boxed, not ruled. Same note as the doors above: the rules
                   between these three read as three separate topics when they
                   are three views of one day. */
                className="group flex h-full w-full flex-col gap-3 rounded-panel border
                  border-rule bg-card p-6 text-left transition-[border-color] duration-150
                  hover:border-accent">
                {/* The photo leads. These three cards are the one place on
                    the site where a reader is choosing which person they are,
                    and a face answers that faster than a label does. Fixed
                    height and object-cover so three different crops still sit
                    on one line. */}
                <img src={`/photos/${s2.photo}.webp`} alt={s2.alt} loading="lazy" decoding="async"
                  width="900" height="605"
                  className="-mx-6 -mt-6 mb-1 h-[148px] w-[calc(100%+3rem)] rounded-t-panel
                    object-cover"/>
                <span className="font-mono text-body font-bold tracking-[0.005em] text-accent">{s2.who}</span>
                <span className="font-display text-head font-bold leading-[1.15] tracking-tight text-ink">
                  {s2.title}
                </span>
                {/* One fixed-height stage per cell, so the three previews sit
                    on the same line whatever shape each one is: an arch, a
                    week strip and a ranked list are three different heights
                    and without this the copy under them stepped. */}
                <span aria-hidden className="mt-1 flex h-[150px] items-center justify-center">
                  <Preview id={s2.id}/>
                </span>
                <span className="max-w-[34ch] text-sec leading-[1.5] text-ink-2">{s2.line}</span>
                <span className="mt-auto flex items-center gap-2.5 pt-2 font-display text-meta
                  font-bold text-accent group-hover:text-accent-ink">
                  {s2.cta}
                  <ArrowRight className="size-[1.1rem] transition-transform duration-200
                    group-hover:translate-x-1.5"/>
                </span>
              </button>
            </ScrollRow>
          ))}
        </div>
      </Section>

      {/* ── privacy ─────────────────────────────────────────────────────── */}
      <Section name="Privacy" tone="card" className="bg-aqua-2">
        <SectionHead>Student Privacy</SectionHead>
        <SectionLede>
          The student decides what leaves the phone. Parents and counselors see a score and a
          sentence, and only where consent has been given.
        </SectionLede>
        <WhoSeesWhat className="mt-6 max-w-[62rem]"/>
      </Section>

      {/* ── the limits ──────────────────────────────────────────────────── */}
      {/* This was a moving marquee showing one or two items at a time. These
          are the strongest sentences on the site and a marquee cannot be read.
          The tick marks that replaced the marquee went too: a checkmark beside
          a promise never to do something is the icon arguing with the
          sentence. A rule over each line does the same separating and says
          nothing. */}
      <Section name="Limits" tone="ink" tight>
        <SectionHead tone="ink">What MindMap Will Never Do</SectionHead>
        {/* The page's second dark band, and the reason it is allowed one. The
            component's note says the inverted band is used once, because one
            inversion cuts a page in two and a second one cuts it into nothing.
            These six lines are the strongest sentences on the site and they
            are the last thing on it, so the second inversion is not a repeat
            of the first — it closes the page against the band that opened it,
            and every tint between the two now reads as the middle. */}
        <ul className="mt-6 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {NEVER.map(t => (
            <li key={t} className="rounded-panel bg-ink-2/45 px-5 py-4 text-meta leading-[1.4] text-mist">
              {t}
            </li>
          ))}
        </ul>
      </Section>

    </main>
  )
}
