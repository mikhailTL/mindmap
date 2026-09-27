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
import { ProblemStats, TreatmentGap, WhyItWorks, SOURCES } from '../charts/problem'
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
 * The order is now: what this is, what the problem is, why this helps, the
 * three ways to start, how a reading works, who sees what, and what it will
 * never do. Each band answers the question the band above it raises, which is
 * the only ordering rule this page needs.
 *
 * Grounds and rhythm are not decided here: every band is a <Section>, which
 * owns its ground, its heading size and its padding. The dark band appears
 * exactly once, on the statistics, because that is the part of the page that
 * has to stop somebody scrolling.
 *
 * What changed in the pass after the last review: nothing on this page is a
 * row of three equal rounded cards any more. There were two of them, one under
 * the other, and a row of equal cards with an icon on top is the single most
 * generated-looking object on the web. Both are ruled rows now, which is the
 * language the rest of the site is already in — an observation sheet, not a
 * pricing page — and both are shorter than the cards they replace.
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
          What was wrong with it was one thing wearing three hats. The copy sat
          in the left half and one phone sat in the right half, and between
          them, at 1440 and worse at 1920, ran a column of nothing about four
          hundred pixels wide. Filling a gap with padding is what put it there
          in the first place, so it is filled with the other half of the
          product instead: the patch, drawn front on, at a size that makes it
          the first object you see.

          Three things hold the band together. The whole section is one ruled
          sheet, margin line included, so the parts of the copy column the
          headline does not reach are ruled paper rather than blank paper. The
          right side is a washed panel that runs off the edge of the page
          instead of stopping politely inside it. And the patch is translated
          left across the boundary between the two, overlapping both, so the
          composition has one seam that is deliberately broken rather than a
          tidy fifty-fifty split with a canyon down the middle.

          It is also about a hundred and thirty pixels shorter than what it
          replaces, which was the other half of the note. */}
      <section id="hero" className="relative isolate overflow-hidden border-t border-rule bg-paper">
        <RuledField className="z-0" pitch={37} offset={12} opacity={0.34}/>
        <MarginRule className="left-[11px] z-0 sm:left-6 lg:left-8"/>

        <div className="wrap relative z-10 grid gap-0
          lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]
          xl:grid-cols-[minmax(0,1fr)_minmax(0,30rem)]
          2xl:grid-cols-[minmax(0,1fr)_minmax(0,40rem)]">

          <div className="max-w-[40rem] py-8 lg:self-center lg:py-12 lg:pr-14">
            {/* The name, with the hairline a drawing puts in front of a key.
                accent on paper is 5.52 : 1, so it can be a word and not only
                a colour. It is two steps smaller than it was: it is the label
                on the sheet, not the first headline. */}
            <ScrollIn as="p" className="flex items-center gap-3 font-display text-tick font-bold
              tracking-tight text-accent">
              <span aria-hidden className="h-px w-7 shrink-0 bg-accent/55"/>
              MindMap, a wellness app for teenagers
            </ScrollIn>
            {/* One element, one leading, balanced wrapping. The break falls
                wherever the column is, instead of being hard coded into a
                place that only worked at one width. Leading is 1.06 and not
                1.02: at 1.02 the descenders of "Making your stress" landed in
                the cap height of "readable". */}
            <h1 className="mt-4 max-w-[13ch] font-display text-view font-bold leading-[1.06]
              tracking-tight text-ink [text-wrap:balance] 2xl:max-w-[12ch] 2xl:text-sect">
              Making your stress <span className="text-accent">readable</span>.
            </h1>
            {/* Three sizes that are genuinely three sizes: 46, 22, 15 at 1440.
                What this replaces was 46, 24, 19, which is one size of large
                and two sizes of medium, and reads as a template because it is
                how a template hedges. */}
            <ScrollIn as="p" className="mt-4 text-row font-medium leading-[1.3] text-ink-2">
              One score. One sentence. Every day.
            </ScrollIn>
            {/* ink-2 and not ink-3. Measured on a rule rather than on the
                ground between two, ink-3 at this size lands at 4.51 : 1, which
                passes and has no margin left in it; ink-2 is 7.3 : 1 there. */}
            <ScrollIn as="p" className="mt-2.5 max-w-read text-note text-ink-2">
              Read from a patch on your forearm, or from the phone already in your pocket.
            </ScrollIn>
            <ScrollIn className="mt-7">
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => go('app')}>Open the app<span aria-hidden>→</span></Button>
                <Button variant="outline" onClick={() => go('without-patch')}>Take a reading now</Button>
              </div>
            </ScrollIn>
          </div>

          {/* The two ways to use it, shown rather than described. The app is
              the live components on the live data, so it cannot drift out of
              date with the product it is advertising, and the patch is the
              front view because a reader who has never seen the thing needs
              the object before it needs an exploded drawing of the object. */}
          {/* The panel runs off the page. `after` is the part of it that lives
              past the wrap's right edge: at 1920 the wrap stops 120px short of
              the viewport and a panel that stopped with it left a strip of bare
              paper beside a full-bleed dark band, which reads as a mistake. The
              section clips it, so the strip costs nothing. */}
          <div className="relative -mx-[22px] border-t border-rule bg-mist/50 sm:-mx-10
            lg:mx-0 lg:-mr-14 lg:border-l lg:border-t-0
            after:absolute after:inset-y-0 after:left-full after:hidden after:w-screen
            after:bg-mist/50 after:content-[''] lg:after:block">
            {/* registration marks, the way a sheet carries them: four corners,
                hairline, no frame. They are the reason the panel reads as part
                of a drawing rather than as a box with a tint in it. */}
            <span aria-hidden className="absolute left-4 top-4 h-3 w-3 border-l border-t border-ruling/50"/>
            <span aria-hidden className="absolute bottom-4 left-4 h-3 w-3 border-b border-l border-ruling/50"/>

            {/* The patch carries a negative left margin at lg, so it hangs
                across the panel's own border and sits on the ruled paper with
                the headline. That overlap is the whole composition: without it
                this is two columns again, with a rule instead of a canyon. */}
            {/* Past 1680 the panel is wider than the page, because the page
                stops and the panel does not. The left pad is exactly that
                overhang, so the pair centres in the panel a reader can see
                rather than in the part of it the layout knows about. */}
            <div className="flex items-end justify-center gap-0 px-5 pb-6 pt-7
              lg:h-full lg:justify-start lg:px-0 lg:pb-14 lg:pt-10
              2xl:justify-center 2xl:pl-[max(0px,calc((100vw-1680px)/2))]">
              <PatchFront
                className="relative z-20 w-[166px] shrink-0 -mr-9 translate-y-3
                  sm:w-[200px] lg:-ml-20 lg:-mr-11 lg:w-[248px] lg:translate-y-2
                  2xl:ml-0 2xl:w-[288px]"/>
              <IPhone model="15-pro" scale={0.34} screenBg="#f7faf8"
                label="The MindMap app, cycling through a reading, the score it returns and the week it lands in"
                className="relative z-10 lg:hidden">
                <PhoneApp/>
              </IPhone>
              <IPhone model="15-pro" scale={0.52} screenBg="#f7faf8"
                label="The MindMap app, cycling through a reading, the score it returns and the week it lands in"
                className="relative z-10 hidden lg:block 2xl:hidden">
                <PhoneApp/>
              </IPhone>
              <IPhone model="15-pro" scale={0.56} screenBg="#f7faf8"
                label="The MindMap app, cycling through a reading, the score it returns and the week it lands in"
                className="relative z-10 hidden 2xl:block">
                <PhoneApp/>
              </IPhone>
            </div>

            {/* A key, the way a drawing carries one: one typed line along the
                bottom naming the two objects and what each costs a reader in
                time. It sits on the panel's own baseline rather than beside
                either device, which is why it cannot collide with one when the
                pair grows at 1920. ink-3 on mist is 4.68 : 1. */}
            <div className="absolute bottom-5 right-6 hidden items-center gap-3 whitespace-nowrap lg:flex">
              <span className="tick">Patch · all day</span>
              <span aria-hidden className="h-3 w-px bg-ruling/55"/>
              <span className="tick">Phone · 45 seconds</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── the problem, on the one dark band ────────────────────────────
          Straight under the hero, because a reader who does not believe there
          is a problem has no reason to care how the product works. Every
          figure here is external and sourced. The band this replaces carried
          three facts about the device and one placeholder reading
          "[cited stat]", which was honest and useless. */}
      <Section name="The problem" tone="ink">
        <SectionHead tone="ink" className="max-w-[20ch]">
          Most teenagers who are struggling are not being reached.
        </SectionHead>
        <ProblemStats className="mt-8"/>
      </Section>

      {/* ── why this helps ──────────────────────────────────────────────── */}
      <Section name="Why MindMap helps" tone="paper">
        <SectionHead className="max-w-[26ch]">
          The body changes before anyone finds the words for it.
        </SectionHead>
        <div className="mt-8 grid gap-x-14 gap-y-10 lg:grid-cols-2">
          <TreatmentGap/>
          <WhyItWorks/>
        </div>
        <p className="mt-8 text-fine text-ink-3">
          Sources:{' '}
          {SOURCES.map((s, i) => (
            <React.Fragment key={s.href}>
              {i > 0 && ' · '}
              <a href={s.href} target="_blank" rel="noreferrer"
                className="border-b border-accent/40 text-accent hover:border-accent">{s.label}</a>
            </React.Fragment>
          ))}
        </p>
      </Section>

      {/* ── the three doors ──────────────────────────────────────────────
          Three ruled rows, not three cards. The lede that used to sit here
          said the three doors open the same app and then asked who you are,
          which is what the rows say themselves, one line each. Every row keeps
          a transparent left rule so the one that is marked does not shunt its
          own text three pixels out of line with the other two. */}
      <Section name="Getting started" tone="card">
        <SectionHead>3 Ways to Use MindMap</SectionHead>
        <ul className="mt-7 list-none border-t border-rule p-0">
          {DOORS.map((d, i) => (
            <ScrollRow key={d.id} index={i} as="li" className="border-b border-rule">
              <button type="button" onClick={() => go(d.go)}
                className={cn(`group grid w-full grid-cols-[3.4rem_minmax(0,1fr)] items-center
                  gap-x-5 gap-y-1.5 border-l-[3px] py-5 pl-4 pr-1 text-left
                  transition-colors duration-150 hover:bg-mist/60
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
      <Section name="How it works" tone="paper" tight>
        <SectionHead>A day in, one score and one sentence out.</SectionHead>
        <HowItWorks className="mt-7"/>
      </Section>

      {/* ── the three audiences ──────────────────────────────────────────
          Not three equal tiles. The student is the person wearing the thing
          and is given roughly twice the area and twice the artwork; the parent
          and the counselor are two ruled rows beside them, which is also the
          truth about how much each of those two is shown. */}
      <Section name="Who it is for" tone="card" id="screens">
        <SectionHead>3 Perspectives</SectionHead>
        <SectionLede>
          One day of measurements, read three ways. The student sees all of it; the other two see
          only what the student agreed to share.
        </SectionLede>
        <div className="mt-7 grid border-t border-rule lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <ScrollIn className="h-full">
            <button type="button" onClick={() => go(SCREENS[0].id)}
              className="group flex h-full w-full flex-col gap-5 border-b border-rule py-7 pr-0
                text-left transition-colors duration-150 hover:bg-mist/60 lg:border-r lg:pr-12">
              <span className="font-display text-tick font-bold text-accent">{SCREENS[0].who}</span>
              <span className="font-display text-sub font-bold leading-[1.12] tracking-tight text-ink">
                {SCREENS[0].title}
              </span>
              {/* The line and the dial share a row rather than stacking. A
                  dial centred under a left-set paragraph left two hundred
                  pixels of nothing on either side of it and made the cell
                  taller than the two rows beside it for no reason. */}
              <div className="flex flex-wrap items-center gap-x-10 gap-y-5">
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
                  className="group flex h-full w-full flex-col gap-3 border-b border-rule py-7
                    text-left transition-colors duration-150 hover:bg-mist/60">
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
      <Section name="Privacy" tone="paper">
        <SectionHead>Student Privacy</SectionHead>
        <SectionLede>
          The student decides what leaves the phone. Parents and counselors see a score and a
          sentence, and only where consent has been given.
        </SectionLede>
        <WhoSeesWhat className="mt-7 max-w-[62rem]"/>
      </Section>

      {/* ── the limits ──────────────────────────────────────────────────── */}
      {/* This was a moving marquee showing one or two items at a time. These
          are the strongest sentences on the site and a marquee cannot be read.
          The tick marks that replaced the marquee went too: a checkmark beside
          a promise never to do something is the icon arguing with the
          sentence. A rule over each line does the same separating and says
          nothing. */}
      <Section name="Limits" tone="mist" tight>
        <SectionHead>What MindMap Will Never Do</SectionHead>
        <ul className="mt-6 grid list-none gap-x-12 gap-y-0 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {NEVER.map(t => (
            <li key={t} className="border-t border-ruling/50 py-3 text-meta leading-[1.4] text-ink">
              {t}
            </li>
          ))}
        </ul>
      </Section>

    </main>
  )
}
