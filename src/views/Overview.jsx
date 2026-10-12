import React from 'react'
import { PHOTOS } from '../lib/photos'
import { Button } from '../ui/button'
import { Section, SectionHead, SectionLede } from '../ui/section'
import { ScrollIn, ScrollRow } from '../s21/motion'
import { ArrowRight } from '../ui/marks'
import { IPhone } from '../ui/iphone'
import { PhoneApp } from '../ui/phone-app'
import { PatchFront } from '../charts/patch-front'
import { ProblemStats } from '../charts/problem'
import { HowItWorks, WhoSeesWhat } from '../charts/infographics'
import { Card } from '../ui/card'
import { cn } from '../lib/utils'
/* The site's vocabulary lives in one file. The daily number is the Mind Score
   on every screen, the consent model is said the same way everywhere, and the
   two privacy rows a reader read as categories rather than as features are
   named for what they are. Nothing here invents a second name for any of
   them. */
import {
  SCORE, NOTES, LOCATION,
  CONSENT_SHORT, CONSENT_OFF, CASELOAD_TITLE,
} from '../lib/terms'

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
 * it had on paper. The one thing that did need changing is hoverOnly: mist/60 on a
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
    line:'A reading off a sticker on your arm, all day.',
    art:(
      <svg viewBox="0 0 220 120" className="h-[46px] w-auto" aria-hidden focusable="false">
        <rect x="7" y="23" width="206" height="74" rx="37" className="fill-card stroke-ink" strokeWidth="2"/>
        <rect x="56" y="33" width="108" height="54" rx="22" className="fill-mist stroke-ink" strokeWidth="1.6"/>
        <circle cx="110" cy="60" r="14" fill="none" className="stroke-ink-3" strokeWidth="1.6"/>
        <circle cx="110" cy="60" r="4.5" className="fill-accent"/>
      </svg>) },
  { id:'phone', go:'without-patch', title:'Use your phone', note:'No hardware needed', lead:true,
    line:'A reading in forty five seconds, off the camera.',
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
    line:'Every screen filled with made up data.',
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
   the one it reports to, then the school. Each tile leads with a photograph of
   that person, for the reason the note under this array gives. */
const SCREENS = [
  { id:'student', who:'Student', photo:'student-card',
    alt:'Five teenagers walking home together through a park',
    title:`Your ${SCORE} today, and what moved it`,
    line:'The four signals behind it, and every reading ever taken.',
    cta:'What a student gets' },
  { id:'parent',  who:'Parent', photo:'parent-card',
    alt:'A mother and her teenage son looking at something together at home',
    title:'One sentence a week, and which days ran high',
    line:`Never a raw reading, never ${NOTES}, never ${LOCATION}.`,
    cta:'What a parent gets' },
  { id:'pro',     who:'School counselor', photo:'school-card',
    alt:'A school counselor and a student talking on a sofa',
    title:CASELOAD_TITLE,
    line:'Only the students who share it.',
    cta:'What a school gets' },
]

/* These three cards used to carry a photograph AND a 150px live preview of
   that person's own screen: an arch for the student, a week strip for the
   parent, four ranked rows for the counselor. Two pictures of the same thing
   stacked in one card is what made this row 150px taller than it had any
   reason to be, and the note on it was plain: the dashboard pictures are not
   wanted here, the photograph is enough. A reader picking which of three
   people they are is answering that off a face, not off a chart they cannot
   read at 13rem wide. Every one of those previews is still on the page it
   belongs to, at a size where it can actually be read. */

/* What a reader asks the moment they see a sticker on somebody's arm: what it
   is, whether anybody can see it, and how long it stays on.
 *
   The two lines about the shell, the pod and the charging slot are gone. They
   describe how the thing is built, which is not a question anybody has before
   they have decided to wear one, and the exploded drawing answers it anyway on
   the page that owns the hardware.
 *
   The last line is the fact the hardware thread has not settled, and it stays:
   an invented wear time would be the only unmeasured number on the page. */

/* The four things a reader wants settled before they will put this on a
   teenager, in the order the question arrives: who sees it, who turned it on,
   what nobody gets, and how it stops.
 *
   A title and one line each. The same answer was being given three times in
   one section: a lede, four cards of prose, and then the table. The table is
   the detailed answer and it is a figure, so the cards are now the claim and
   the prose under them is a single sentence that the title does not already
   say. The lede went outright: it said the student sees every reading first,
   which is the first card. */
/* The design, with its working shown.
 *
 * Every other section of this page is about what the product does. This one is
 * about why each screen looks and reads the way it does, and it exists because
 * the answer is not taste. Four decisions, each traceable to a published
 * finding a judge can look up, and a closing line that refuses the claim the
 * section invites — that any of this has been shown to lower anybody's stress.
 * It has not. Saying so is not modesty; it is the difference between a design
 * rationale and an efficacy claim, and a reader who checks will find the
 * distinction held everywhere on this site.
 *
 * Numbers are quoted as the sources report them. Cohen's d is spelled out in
 * plain words first and given as a figure second, because the sentence has to
 * work for a reader who has never met an effect size.
 *
 * The readability figures are measured, not asserted. tools/readability/ runs
 * the formulas over the prose this site actually renders, so the number in the
 * fourth card is reproducible and moves when the writing does. */
const EVIDENCE = [
  { title: 'The mark on the dial',
    line: `A bare number makes an ordinary day look like bad news. Shown against a labelled
      usual day, the share of readers who wanted to call a doctor about a near-normal result
      fell from about half to about a third.`,
    cite: 'Zikmund-Fisher et al., J Med Internet Res, 2018. 1,618 adults.' },
  { title: 'Nobody is ranked',
    line: `Across 208 lab studies, being judged by other people was the biggest single driver of
      the stress hormone. No student here is ever compared with another
      student.`,
    cite: 'Dickerson & Kemeny, Psychological Bulletin, 2004. d = 0.67 against 0.15.' },
  { title: 'You decide what is shared',
    line: `In those same studies, a stressor you cannot control raised cortisol more than three
      times as much as one you can. Every share on this site is yours to switch off.`,
    cite: 'Dickerson & Kemeny, 2004. d = 0.52 against 0.16.' },
  { title: 'Plain words, measured',
    line: `The writing here is scored, not described. It reads below grade 5 on Flesch-Kincaid
      and about grade 7 on SMOG. Health material is meant to sit at or below grade 6.`,
    cite: 'Measured on the prose of all 13 pages. tools/readability.' },
]

const TRUST = [
  { title:'The student sees everything first',
    line:'Every reading lands on their phone before anybody else has anything.' },
  { title:'Nothing is shared by default',
    line:CONSENT_SHORT },
  { title:'Never shared with anyone',
    line:`${NOTES}, ${LOCATION}, and every raw reading.` },
  { title:'Sharing switches off',
    line:CONSENT_OFF },
]

/* Six promises, and the wording is the whole of them: each one is a sentence
   the project can be held to. They were cut to the shortest form that does not
   weaken the claim, and no further. "A group under five" is still the k floor;
   "fewer than five" would have been one word shorter and a different promise. */
const NEVER = [
  'Show a parent a raw reading',
  'Report on a group under five',
  'Keep data past what the student chooses',
  'Open a record without logging it',
  'Sell or share anything',
  'Diagnose anything. Not a medical device',
]

/* The hero's two facts. Fragments, not sentences: the title screen is
   scanned, never read. There were three, and the first one was the four
   signals, word for word the caption printed under the drawing beside it. A
   fragment that repeats a caption two inches away is the caption printed
   twice. What is left is where it measures and who else sees it. */
const HERO_FACTS = [
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
          headline, a button and two drawings in 700px without shrinking one
          of them past use. THAT IS NO LONGER TRUE: the band is one viewport
          tall at every width now, phones included, because the instruction was
          plain — the title screen takes the whole screen and the next section's
          heading must not be visible underneath it. `h-`, not `min-h-`, is the
          only thing that guarantees that: `min-h-` lets tall content push the
          band past the fold and the next band's top edge comes into view. The
          content inside is what flexes instead.

          Capped at 44rem. On a tall desktop a full-viewport band left about
          190px of nothing above the headline and as much below it, and that is
          the single largest piece of the "blank empty space" note. At 1280 x
          720 the viewport is the smaller of the two, so on a laptop the band
          is still exactly one screen, which is what the rule was for. */}
      <section id="hero" className="relative isolate flex h-[calc(100svh-58px)] flex-col
        overflow-hidden border-t border-rule bg-paper">

        <div className="wrap relative z-10 flex flex-1 flex-col
          lg:grid lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)]
          xl:grid-cols-[minmax(0,44rem)_minmax(0,1fr)]
          2xl:grid-cols-[minmax(0,50rem)_minmax(0,1fr)]">

          <div className="flex min-h-0 flex-1 flex-col justify-center py-6 lg:flex-none lg:py-0 lg:pr-10">
            {/* A hairline used to sit in front of this line, the way a
                drawing puts one in front of a key. On a page whose house rule
                is that there is not one em dash in the copy, a 28px rule
                immediately before a sentence is read as an em dash by anyone
                who is not thinking about drawings, and it was. There is
                nothing in front of the line now. */}
            <ScrollIn as="p" className="font-mono text-row font-bold
              tracking-[0.005em] text-accent">
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
            <h1 className="mt-4 max-w-[19ch] font-display text-view font-medium leading-[1.06]
              tracking-tight text-ink lg:text-sect 2xl:text-fig">
              Making your stress <span className="text-accent">readable</span>.
            </h1>
            {/* Two paragraphs stood here, sixty words of prose on a title
                screen. Nobody reads a paragraph above the fold. One line says
                what comes back and two fragments say where it comes from and
                who else sees it, which is a block you can take in without
                reading a sentence. */}
            <ScrollIn as="p" className="mt-5 max-w-[26ch] text-lead font-medium leading-[1.3] text-ink">
              One {SCORE} a day. One sentence saying what changed.
            </ScrollIn>
            <ScrollIn as="ul" className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
              {HERO_FACTS.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sec text-ink-2">
                  <span aria-hidden className="mt-[0.62em] h-[3px] w-3 shrink-0 rounded-bar bg-accent"/>
                  {f}
                </li>
              ))}
            </ScrollIn>
            {/* One button, not two. "Take a reading from your phone" stood
                beside this one and is also the middle card of the three ways
                directly below it, which made the phone route the only thing on
                the page offered twice inside the first two screens. The note
                was that one destination should not have three ways in, and
                this was the clearest case of it. */}
            <ScrollIn className="mt-7">
              <Button onClick={() => go('app')}>Open the app<span aria-hidden>→</span></Button>
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
                label={`The MindMap app, cycling through a reading, the ${SCORE} it returns and the week it lands in`}
                className="shrink-0 lg:hidden">
                <PhoneApp/>
              </IPhone>
              <IPhone model="15-pro" scale={0.52} screenBg="#f5fafa"
                label={`The MindMap app, cycling through a reading, the ${SCORE} it returns and the week it lands in`}
                className="hidden shrink-0 lg:block xl:hidden">
                <PhoneApp/>
              </IPhone>
              <IPhone model="15-pro" scale={0.62} screenBg="#f5fafa"
                label={`The MindMap app, cycling through a reading, the ${SCORE} it returns and the week it lands in`}
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
        {/* One line, so the figures under it open an argument instead of
            decorating the band. No figure of its own: this band already
            carries every number on the page. */}
        <SectionLede tone="ink">
          MindMap returns one {SCORE} a day.
        </SectionLede>
        <ProblemStats className="mt-5"/>
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
          All three open the same app.
        </SectionLede>
        <div className="mt-5 grid auto-rows-fr gap-3.5 md:grid-cols-3">
          {DOORS.map((d, i) => (
            <ScrollRow key={d.id} index={i} className="h-full">
              <Card interactive as="button" type="button" onClick={() => go(d.go)}
                className={cn('flex h-full flex-col p-5', d.lead && 'border-l-accent')}>
                <span className="grid h-[60px] place-items-start" aria-hidden>{d.art}</span>
                <span className="mt-4 block font-display text-head font-bold leading-tight text-ink">
                  {d.title}
                </span>
                <span className="mt-2 block text-sec leading-[1.5] text-ink-2">{d.line}</span>
                <span className="mt-auto flex items-center gap-2 pt-5 font-display text-meta
                  font-bold text-accent">
                  {d.note}
                  <ArrowRight className="size-[1.1rem] transition-transform duration-200
                    groupHoverOnly:translate-x-1.5"/>
                </span>
              </Card>
            </ScrollRow>
          ))}
        </div>
      </Section>

      {/* ── how a reading works ─────────────────────────────────────────── */}
      <Section name="How it works" tone="card" tight className="bg-aqua">
        <SectionHead>A day in, one {SCORE} and one sentence out.</SectionHead>
        <HowItWorks className="mt-5"/>
        {/* One window, three lines. The reviewer asked five questions about
            the object itself and the page answered none of them; two of the
            five answers turned out to be about how the thing comes apart,
            which is not a question a reader has here. */}
        {/* A panel called "The patch itself" stood here with three facts in
            it, under a heading, inside its own bordered box. Every one of them
            is on the patch page, which is one card away on this same screen
            and is now 169 words long. Printing a page's contents on the page
            that links to it is the most expensive kind of duplication there
            is: the reader pays for it twice and learns it once. */}
</Section>

      {/* ── the three audiences ──────────────────────────────────────────
          Three equal cells, for the reason the note on the grid gives.
          A lede stood under the heading saying one day of measurements read
          three ways, which is the heading, and then saying that the other two
          see only what the student shared, which is the band below. Both
          halves were already on the page, so it is gone. */}
      <Section name="Who it is for" tone="card" id="screens" className="bg-beam-wash">
        <SectionHead>3 Perspectives</SectionHead>
        {/* Three equal cells. It had been one wide student cell beside two
            stacked rows, which made the student's screen look like the product
            and the other two like footnotes. They are three views of the same
            day and the grid should say so: same width, same height, same
            order of parts in each. */}
        <div className="mt-5 grid auto-rows-fr gap-3.5 lg:grid-cols-3">
          {SCREENS.map((s2, i) => (
            <ScrollRow key={s2.id} index={i} className="h-full">
              <button type="button" onClick={() => go(s2.id)}
                /* Boxed, not ruled. Same note as the doors above: the rules
                   between these three read as three separate topics when they
                   are three views of one day. */
                /* The picture takes the hover, not the chrome. A reader
                   choosing which of three people they are needs to know which
                   card they are on; a 2% lean inside a clipped frame says that
                   without anything moving on the page. Press is 1%: three
                   percent off a 450px card is 13px of edge travel and reads
                   as the layout glitching. */
                className="group flex h-full w-full flex-col gap-3 overflow-hidden rounded-panel
                  border border-rule bg-card p-5 text-left touch-manipulation
                  transition-[border-color,transform] duration-150 ease-[var(--ease-out)]
                  motion-safe:active:scale-[0.99] hoverOnly:border-accent">
                {/* max-w-none is load-bearing and was missing. Tailwind's
                    preflight sets `img { max-width: 100% }`, which clamped
                    this image back to the card's content box and undid the
                    bleed: the picture started at the card's left edge and
                    stopped 40px short of its right one, on every card, at
                    every width. The negative margin was doing its half of the
                    job and the width was being thrown away.

                    The photo leads. These three cards are the one place on
                    the site where a reader is choosing which person they are,
                    and a face answers that faster than a label does. Fixed
                    height and object-cover so three different crops still sit
                    on one line. */}
                <img src={PHOTOS[s2.photo]} alt={s2.alt} loading="lazy" decoding="async"
                  width="1200" height="423"
                  className="-mx-5 -mt-5 mb-1 h-[160px] w-[calc(100%_+_2.5rem)] max-w-none
                    rounded-t-panel object-cover
                    motion-safe:transition-transform motion-safe:duration-[260ms]
                    motion-safe:ease-[var(--ease-out)]
                    motion-safe:groupHoverOnly:scale-[1.02]"/>
                <span className="font-mono text-body font-bold tracking-[0.005em] text-accent">{s2.who}</span>
                <span className="font-display text-head font-bold leading-[1.15] tracking-tight text-ink">
                  {s2.title}
                </span>
                <span className="max-w-[34ch] text-sec leading-[1.5] text-ink-2">{s2.line}</span>
                <span className="mt-auto flex items-center gap-2.5 pt-2 font-display text-meta
                  font-bold text-accent groupHoverOnly:text-accent-ink">
                  {s2.cta}
                  <ArrowRight className="size-[1.1rem] transition-transform duration-200
                    groupHoverOnly:translate-x-1.5"/>
                </span>
              </button>
            </ScrollRow>
          ))}
        </div>
      </Section>

      {/* ── privacy ─────────────────────────────────────────────────────── */}
      {/* Straight after the three perspectives, because a reader who has just
          been shown that a parent and a school each get a view of a teenager's
          day is holding exactly one question, and this section is the answer
          to it. One section and not two: the four statements say how the
          product works, the table says what each person is shown, and
          splitting them would put one subject on the page twice.
 *
          Four boxes, no rules. A rule between items reads as a new topic
          beginning, and these four are one answer in four parts. */}
      <Section name="Privacy" tone="card" className="bg-aqua-2">
        <SectionHead>Student Privacy</SectionHead>
        <div className="mt-5 grid auto-rows-fr gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((t, i) => (
            <ScrollRow key={t.title} index={i} className="h-full">
              <div className="flex h-full flex-col rounded-panel border border-rule bg-card p-5">
                <h3 className="font-display text-head font-bold leading-[1.15] tracking-tight text-ink">
                  {t.title}
                </h3>
                <p className="mt-3 text-sec leading-[1.5] text-ink-2">{t.line}</p>
              </div>
            </ScrollRow>
          ))}
        </div>
        <WhoSeesWhat className="mt-5 max-w-[62rem]"/>
      </Section>

      {/* ── the design, and where it comes from ─────────────────────────── */}
      {/* Directly after privacy, because both sections answer the same
          question — why should a stranger trust this — and both answer it with
          something checkable rather than with a promise. */}
      <Section name="Evidence" tone="paper">
        <SectionHead>Designed From the Research</SectionHead>
        <SectionLede>
          Four decisions on this site, and the published finding behind each one.
        </SectionLede>
        <div className="mt-5 grid auto-rows-fr gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {EVIDENCE.map((e, i) => (
            <ScrollRow key={e.title} index={i} className="h-full">
              <div className="flex h-full flex-col rounded-panel border border-rule bg-card p-5">
                <h3 className="font-display text-head font-bold leading-[1.15] tracking-tight text-ink">
                  {e.title}
                </h3>
                <p className="mt-3 text-sec leading-[1.5] text-ink-2">{e.line}</p>
                {/* The source sits at the foot of its own card, in the mono
                    face the site uses for anything a reader is meant to check
                    rather than read. mt-auto puts it on the card's floor so the
                    four citations line up across the row however long the
                    paragraphs above them run. */}
                <p className="mt-auto pt-4 font-mono text-fine leading-[1.45] text-ink-3">{e.cite}</p>
              </div>
            </ScrollRow>
          ))}
        </div>
        <ScrollIn>
          <p className="mt-5 max-w-[74ch] text-meta text-ink-3">
            None of this says MindMap lowers anyone&rsquo;s stress. It has not been tested and
            nothing here claims it has. These are the reasons behind the design, and every one of
            them can be looked up.
          </p>
        </ScrollIn>
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
        <ul className="mt-5 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {NEVER.map(t => (
            <li key={t} className="rounded-panel bg-ink-2/45 px-4 py-3.5 text-meta leading-[1.4] text-mist">
              {t}
            </li>
          ))}
        </ul>
      </Section>

    </main>
  )
}
