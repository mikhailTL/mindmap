import React from 'react'
import { Button } from '../ui/button'
import { Section, SectionHead, SectionLede } from '../ui/section'
import { ScrollIn, ScrollRow } from '../s21/motion'
import { ArrowRight } from '../ui/marks'
import { IPhone } from '../ui/iphone'
import { PhoneApp } from '../ui/phone-app'
import { PatchFront } from '../charts/patch-front'
import { RuledField, MarginRule } from '../ui/paper'
import { RainbowDial } from '../charts/rainbow'
import { ProblemStats } from '../charts/problem'
import { studentRings } from '../lib/readings'
import { triage, tierOf, TIER_LABEL } from '../lib/caseload'
import { DATA } from '../lib/assets'
import { HowItWorks, WhoSeesWhat, WeekStrip } from '../charts/infographics'
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
  { id:'patch', go:'patch', title:'Wear the patch', note:'Needs a paired patch',
    line:'A sticker on your forearm reads four signals once a second, all day.',
    art:(
      <svg viewBox="0 0 220 120" className="h-[46px] w-auto" aria-hidden focusable="false">
        <rect x="7" y="23" width="206" height="74" rx="37" className="fill-card stroke-ink" strokeWidth="2"/>
        <rect x="56" y="33" width="108" height="54" rx="22" className="fill-mist stroke-ink" strokeWidth="1.6"/>
        <circle cx="110" cy="60" r="14" fill="none" className="stroke-ink-3" strokeWidth="1.6"/>
        <circle cx="110" cy="60" r="4.5" className="fill-accent"/>
      </svg>) },
  { id:'phone', go:'without-patch', title:'Use your phone', note:'Works right now', lead:true,
    line:'Fingertip on the camera, one spoken sentence. Forty five seconds, no hardware.',
    art:(
      <svg viewBox="0 0 220 120" className="h-[46px] w-auto" aria-hidden focusable="false">
        <rect x="74" y="3" width="72" height="114" rx="12" className="fill-card stroke-ink" strokeWidth="2"/>
        <rect x="86" y="19" width="48" height="48" rx="8" className="fill-ink"/>
        <circle cx="102" cy="39" r="8" className="fill-accent"/>
        <circle cx="122" cy="39" r="5" className="fill-beam"/>
        <path d="M84 91 q10 -16 20 0 t20 0 t12 -6" fill="none" stroke="#a8321f"
          strokeWidth="2.4" strokeLinecap="round"/>
      </svg>) },
  { id:'demo', go:'app', title:'Try the demo', note:'Start here if you are reviewing',
    line:'Every screen filled with generated data, marked as generated. Nothing to set up.',
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
  { id:'student', who:'Student',
    title:'Your score today, and what moved it',
    line:'You see the score, the four signals behind it, and every reading ever taken.',
    cta:'What a student gets' },
  { id:'parent',  who:'Parent',
    title:'One sentence a week, and which days ran high',
    line:'You see the shape of the week. Never a raw reading, never a note, never a location.',
    cta:'What a parent gets' },
  { id:'pro',     who:'School counselor',
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

const NEVER = [
  'Show a parent a raw reading',
  'Report on a group of under five students',
  'Keep data longer than the student chooses',
  'Open a record without logging it',
  'Sell or share anything with anyone',
  'Diagnose anything. This is not a medical device',
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
        <RuledField className="z-0" pitch={37} offset={12} opacity={0.34}/>
        <MarginRule className="left-[11px] z-0 sm:left-6 lg:left-8"/>

        <div className="wrap relative z-10 flex flex-1 flex-col
          lg:grid lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)]
          xl:grid-cols-[minmax(0,35rem)_minmax(0,1fr)]
          2xl:grid-cols-[minmax(0,41rem)_minmax(0,1fr)]">

          <div className="flex shrink-0 flex-col justify-center py-10 lg:py-0 lg:pr-10">
            {/* The name, with the hairline a drawing puts in front of a key.
                accent on paper is 5.52 : 1, so it can be a word and not only a
                colour. */}
            <ScrollIn as="p" className="flex items-center gap-3 font-display text-tick font-bold
              tracking-tight text-accent">
              <span aria-hidden className="h-px w-7 shrink-0 bg-accent/55"/>
              MindMap, a wellness app for teenagers
            </ScrollIn>
            {/* Leading is 1.06 and not 1.02: at 1.02 the descenders of "Making
                your stress" landed in the cap height of "readable". */}
            <h1 className="mt-5 max-w-[14ch] font-display text-view font-bold leading-[1.06]
              tracking-tight text-ink [text-wrap:balance] lg:text-sect 2xl:text-fig">
              Making your stress <span className="text-accent">readable</span>.
            </h1>
            <ScrollIn as="p" className="mt-6 text-lead font-medium leading-[1.3] text-ink-2">
              One score. One sentence. Every day.
            </ScrollIn>
            <ScrollIn as="p" className="mt-3 max-w-[44ch] text-sec text-ink-2">
              Read from a patch on your forearm, or from the phone already in your pocket.
            </ScrollIn>
            <ScrollIn className="mt-8">
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => go('app')}>Open the app<span aria-hidden>→</span></Button>
                <Button variant="outline" onClick={() => go('without-patch')}>Take a reading now</Button>
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

            <div className="relative flex flex-1 flex-col items-center justify-center gap-4
              border-r border-rule bg-accent-wash px-4 py-8 lg:py-0
              after:absolute after:inset-y-0 after:left-full after:hidden after:w-screen
              after:bg-accent-wash after:content-[''] lg:after:block">
              {/* registration marks, the way a sheet carries them: two corners,
                  hairline, no frame. They are the reason a tinted field reads
                  as a plate on a drawing rather than as a box. */}
              <span aria-hidden className="absolute left-3 top-3 h-3 w-3 border-l border-t border-ruling/55"/>
              <span aria-hidden className="absolute bottom-3 left-3 h-3 w-3 border-b border-l border-ruling/55"/>
              <PatchFront className="w-[116px] shrink-0 sm:w-[148px] lg:w-[178px] xl:w-[206px]"/>
              <p className="text-center">
                <span className="block font-display text-ui font-bold text-ink">The patch</span>
                <span className="mt-0.5 block text-fine text-ink-3">Four signals, all day</span>
              </p>
            </div>

            <div className="relative flex flex-[1.15] flex-col items-center justify-center gap-4
              bg-beam-wash px-4 py-8 lg:py-0
              after:absolute after:inset-y-0 after:left-full after:hidden after:w-screen
              after:bg-beam-wash after:content-[''] lg:after:block">
              <span aria-hidden className="absolute right-3 top-3 h-3 w-3 border-r border-t border-ruling/55"/>
              <span aria-hidden className="absolute bottom-3 right-3 h-3 w-3 border-b border-r border-ruling/55"/>
              <IPhone model="15-pro" scale={0.3} screenBg="#f7faf8"
                label="The MindMap app, cycling through a reading, the score it returns and the week it lands in"
                className="shrink-0 lg:hidden">
                <PhoneApp/>
              </IPhone>
              <IPhone model="15-pro" scale={0.52} screenBg="#f7faf8"
                label="The MindMap app, cycling through a reading, the score it returns and the week it lands in"
                className="hidden shrink-0 lg:block xl:hidden">
                <PhoneApp/>
              </IPhone>
              <IPhone model="15-pro" scale={0.62} screenBg="#f7faf8"
                label="The MindMap app, cycling through a reading, the score it returns and the week it lands in"
                className="hidden shrink-0 xl:block">
                <PhoneApp/>
              </IPhone>
              <p className="text-center">
                <span className="block font-display text-ui font-bold text-ink">The app</span>
                <span className="mt-0.5 block text-fine text-ink-3">A reading in forty five seconds</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── worn ──────────────────────────────────────────────────────────
          The photograph makes the argument no drawing can: a patch is a
          medical-looking object, and a teenager's first question about one is
          whether they would be seen wearing it.

          It is a 4:3 panel and not a full-bleed strip. The strip was wider and
          shorter than the subject, so object-cover had to choose between his
          face and his forearm and cut whichever it was not given: a picture
          captioned "worn, and not noticed" that did not show the thing being
          worn. At 4:3 the whole of him, and the patch, are inside the frame. */}
      <Section name="On a normal day" tone="mist">
        <div className="mt-6 grid items-center gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
          <figure className="m-0 overflow-hidden rounded-panel border border-ink shadow-raise">
            <picture>
              <source type="image/webp" srcSet="/img/worn-900.webp 900w, /img/worn.webp 1600w"
                sizes="(max-width: 1023px) 100vw, 58vw"/>
              <img src="/img/worn.jpg" width="1600" height="895" loading="eager" decoding="async"
                alt="A teenager sitting outdoors with friends, laughing, a MindMap patch on his forearm"
                className="aspect-[4/3] w-full object-cover object-[57%_42%]"/>
            </picture>
          </figure>
          <div>
            {/* "Worn, and not noticed" was a claim the photograph argues
                with: the patch is plainly visible in it. A caption should not
                ask a reader to disbelieve what they are looking at. */}
            <h2 className="font-display text-sub font-bold leading-[1.14] tracking-tight text-ink">
              A day that runs easy.
            </h2>
            <p className="mt-4 max-w-[36ch] text-body leading-[1.5] text-ink-2">
              The patch sits on the upper arm, half under a sleeve, and reads four signals while
              the day happens around it.
            </p>
            <p className="mt-3 max-w-[36ch] text-sec text-ink-2">
              Nothing to charge every night, nothing to remember to put on, and nothing to do
              until there is something worth saying.
            </p>
          </div>
        </div>
      </Section>

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
          Three ruled rows, not three cards. The lede that used to sit here
          said the three doors open the same app and then asked who you are,
          which is what the rows say themselves, one line each. Every row keeps
          a transparent left rule so the one that is marked does not shunt its
          own text three pixels out of line with the other two. */}
      <Section name="Getting started" tone="card" className="bg-accent-wash">
        <SectionHead>3 Ways to Use MindMap</SectionHead>
        <ul className="mt-6 list-none border-t border-rule p-0">
          {DOORS.map((d, i) => (
            <ScrollRow key={d.id} index={i} as="li" className="border-b border-rule">
              <button type="button" onClick={() => go(d.go)}
                className={cn(`group grid w-full grid-cols-[3.4rem_minmax(0,1fr)] items-center
                  gap-x-5 gap-y-1.5 border-l-[3px] py-4 pl-4 pr-1 text-left
                  transition-colors duration-150 hover:bg-card
                  md:grid-cols-[4.6rem_minmax(0,15ch)_minmax(0,1fr)_auto] md:gap-x-9`,
                  d.lead ? 'border-l-accent' : 'border-l-transparent')}>
                <span className="row-span-2 grid place-items-center md:row-span-1" aria-hidden>{d.art}</span>
                <span className="font-display text-head font-bold leading-tight text-ink">{d.title}</span>
                <span className="col-start-2 text-note leading-[1.5] text-ink-2 md:col-start-3 md:text-sec">
                  {d.line}
                </span>
                <span className="col-start-2 flex items-center gap-2 font-display text-tick font-bold
                  text-accent md:col-start-4 md:justify-self-end">
                  {d.note}
                  <ArrowRight className="size-[1rem] transition-transform duration-200
                    group-hover:translate-x-1.5"/>
                </span>
              </button>
            </ScrollRow>
          ))}
        </ul>
      </Section>

      {/* ── how a reading works ─────────────────────────────────────────── */}
      <Section name="How it works" tone="card" tight>
        <SectionHead>A day in, one score and one sentence out.</SectionHead>
        <HowItWorks className="mt-6"/>
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
        <div className="mt-6 grid border-t border-rule lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <ScrollIn className="h-full">
            <button type="button" onClick={() => go(SCREENS[0].id)}
              className="group flex h-full w-full flex-col gap-4 border-b border-rule py-6 pr-0
                text-left transition-colors duration-150 hover:bg-card lg:border-r lg:pr-12">
              <span className="font-display text-tick font-bold text-accent">{SCREENS[0].who}</span>
              <span className="font-display text-sub font-bold leading-[1.12] tracking-tight text-ink">
                {SCREENS[0].title}
              </span>
              {/* The line and the dial share a row rather than stacking. A
                  dial centred under a left-set paragraph left two hundred
                  pixels of nothing on either side of it and made the cell
                  taller than the two rows beside it for no reason.

                  flex-1 is the fix for the hole this cell had under it. The
                  student cell is shorter than the two rows it sits beside, the
                  CTA is anchored to the bottom so the two CTAs line up, and
                  the difference was landing as one 110px gap directly above
                  the link. The row takes the slack instead and centres in it,
                  so what is left reads as the cell breathing rather than as a
                  missing paragraph. */}
              <div className="flex flex-1 flex-wrap items-center gap-x-10 gap-y-4">
                <span className="max-w-[26ch] flex-1 text-sec leading-[1.5] text-ink-2">
                  {SCREENS[0].line}
                </span>
                <span aria-hidden><Preview id="student"/></span>
              </div>
              <span className="mt-auto flex items-center gap-2.5 font-display text-meta font-bold text-accent">
                {SCREENS[0].cta}
                <ArrowRight className="size-[1.1rem] transition-transform duration-200
                  group-hover:translate-x-1.5"/>
              </span>
            </button>
          </ScrollIn>

          <div className="grid lg:pl-12">
            {SCREENS.slice(1).map((s2, i) => (
              <ScrollRow key={s2.id} index={i + 1} className="h-full">
                <button type="button" onClick={() => go(s2.id)}
                  className="group flex h-full w-full flex-col gap-3 border-b border-rule py-6
                    text-left transition-colors duration-150 hover:bg-card">
                  <span className="font-display text-tick font-bold text-accent">{s2.who}</span>
                  <span className="font-display text-head font-bold leading-tight text-ink">{s2.title}</span>
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                    <span className="max-w-[34ch] flex-1 text-note leading-[1.5] text-ink-2">{s2.line}</span>
                    <div aria-hidden><Preview id={s2.id}/></div>
                  </div>
                  <span className="mt-auto flex items-center gap-2.5 pt-1 font-display text-meta
                    font-bold text-accent">
                    {s2.cta}
                    <ArrowRight className="size-[1.1rem] transition-transform duration-200
                      group-hover:translate-x-1.5"/>
                  </span>
                </button>
              </ScrollRow>
            ))}
          </div>
        </div>
      </Section>

      {/* ── privacy ─────────────────────────────────────────────────────── */}
      <Section name="Privacy" tone="card">
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
        <ul className="mt-5 grid list-none gap-x-12 gap-y-0 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {NEVER.map(t => (
            <li key={t} className="border-t border-ink-3 py-2.5 text-meta leading-[1.4] text-mist">
              {t}
            </li>
          ))}
        </ul>
      </Section>

    </main>
  )
}
