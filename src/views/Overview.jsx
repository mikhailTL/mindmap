import React from 'react'
import { Button } from '../ui/button'
import { Section, SectionHead, SectionLede } from '../ui/section'
import { ScrollIn, ScrollRow, Parallax2D } from '../ui/motion'
import { ArrowRight } from '../ui/marks'
import { IPhone } from '../ui/iphone'
import { PhoneApp } from '../ui/phone-app'
import { PatchFront } from '../charts/patch-front'
import { ProblemFigures } from '../charts/problem'
import { Frame } from '../ui/frame'
import { Card } from '../ui/card'
import { List, Item } from '../ui/list'
import { cn } from '../lib/utils'
import { setMode } from '../lib/mode'
import { Different } from './landing/Different'
import { ToolsBand } from './landing/Tools'
/* The site's vocabulary. Nothing here invents a second name for any of it. */
import {
  SCORE, NOTES, LOCATION, PRO, PRO_LC,
  CONSENT_SHORT,
} from '../lib/terms'

/* Nine bands, one idea each: hero, what MindMap is, the problem, the two ways
 * in, the tools, what makes it different, who it is for, privacy, every age.
 *
 * Grounds alternate green, white and blue so the page reads as a sequence:
 *   hero paper, what it is accent.wash, problem ink, two ways sky.wash,
 *   tools paper, different (its own), who for accent.wash, privacy
 *   beam.wash, every age aqua.2.
 * Measured on each wash (ink : ink.2 : ink.3 : accent : accent.ink):
 *   accent.wash 12.68 : 6.88 : 4.67 : 4.84 : 7.09
 *   sky.wash    13.01 : 7.06 : 4.80 : 4.97 : 7.28
 *   beam.wash   12.95 : 7.03 : 4.78 : 4.95 : 7.25
 *   aqua.2      11.84 : 6.43 : 4.36 : 4.52 : 6.62
 * ink.3 fails on aqua.2, so that band sets no ink.3 and its green words take
 * accent.ink. Photographs never sit under text without an opaque ground.
 *
 * One photograph per band at most, each in a different treatment, so they
 * read as part of the page rather than as a strip.
 */

/* The owner's description, condensed by cutting and never by rewording.
   Do not edit these sentences. */
const IS_LEAD = 'MindMap is an adolescent wellness and mental health regulation app and wearable designed for teens, parents, and medical professionals and schools. Its goal is to provide comprehensive and causal data to all three audiences in an understandable way, addressing adolescent mental needs from their root cause while reducing stigma.'

const IS = [
  { id: 'patch', text: "Vital signs from a small, comfortable patch, worn on the upper arm or back, feed MindMap's neural network, which produces a simple and readable Mind Score and shows when stress rose or shifted." },
  { id: 'phone', text: 'MindMap also works without the patch, with phone based pulse readings, survey scoring, and a parental extension that links teen phone activity to stress.' },
  { id: 'kit',   text: 'Teens and parents get strategy and activity based toolkits, MindMap AI for guidance, and resources such as videos.' },
  { id: 'lock',  text: "Teens decide what is shared with parents and medical professionals and schools, and data stays private within a teen's network." },
]

/* Small drawn marks for the four paragraphs. Ink outlines, one brand colour
   each, so the four read as a set without being one repeated shape. */
const IS_ICON = {
  patch: (
    <svg viewBox="0 0 48 48" className="size-11" aria-hidden focusable="false">
      <rect x="3" y="14" width="42" height="20" rx="10" className="fill-card stroke-ink" strokeWidth="2"/>
      <rect x="13" y="18" width="22" height="12" rx="6" className="fill-accent-wash stroke-ink" strokeWidth="1.6"/>
      <circle cx="24" cy="24" r="2.8" className="fill-accent"/>
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 48 48" className="size-11" aria-hidden focusable="false">
      <rect x="13" y="3" width="22" height="42" rx="5" className="fill-card stroke-ink" strokeWidth="2"/>
      <path d="M17 26 h4 l2 -6 l3 11 l2 -5 h3" fill="none" className="stroke-sky" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="20" y="8" width="8" height="2" rx="1" className="fill-ink"/>
    </svg>
  ),
  kit: (
    <svg viewBox="0 0 48 48" className="size-11" aria-hidden focusable="false">
      <path d="M18 14 v-4 a2 2 0 0 1 2 -2 h8 a2 2 0 0 1 2 2 v4" fill="none" className="stroke-ink" strokeWidth="2"/>
      <rect x="5" y="14" width="38" height="27" rx="5" className="fill-card stroke-ink" strokeWidth="2"/>
      <path d="M24 21 v13 M17.5 27.5 h13" className="stroke-coral" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 48 48" className="size-11" aria-hidden focusable="false">
      <path d="M15 21 v-5 a9 9 0 0 1 18 0 v5" fill="none" className="stroke-ink" strokeWidth="2"/>
      <rect x="9" y="21" width="30" height="22" rx="5" className="fill-card stroke-ink" strokeWidth="2"/>
      <circle cx="24" cy="30" r="3" className="fill-lilac"/>
      <path d="M24 32 v5" className="stroke-lilac" strokeWidth="2.4" strokeLinecap="round"/>
    </svg>
  ),
}

/* The two ways in. Each card is the steps themselves, so the band needs no
   second block explaining them. `lead` is the phone route: the only one a
   stranger can use in the next minute. */
const WAYS = [
  { id:'phone', go:'without-patch', title:'Without the patch', cta:'See how it works', lead:true,
    steps: ['Open the app and tap Take a reading', 'Hold your fingertip over the phone camera', 'After 45 seconds, your score appears'],
    art:(
      <svg viewBox="0 0 220 120" className="h-[46px] w-auto" aria-hidden focusable="false">
        <rect x="74" y="3" width="72" height="114" rx="12" className="fill-card stroke-ink" strokeWidth="2"/>
        <rect x="86" y="19" width="48" height="48" rx="8" className="fill-ink"/>
        <circle cx="102" cy="39" r="8" className="fill-accent"/>
        <circle cx="122" cy="39" r="5" className="fill-beam"/>
        <path d="M84 91 q10 -16 20 0 t20 0 t12 -6" fill="none" stroke="#a8321f"
          strokeWidth="2.4" strokeLinecap="round"/>
      </svg>) },
  { id:'patch', go:'pairing', title:'With the patch', cta:'Pair the patch',
    steps: ['Stick the patch on your upper arm', 'Pair it with the app once', 'Your score updates through the day'],
    art:(
      <svg viewBox="0 0 220 120" className="h-[46px] w-auto" aria-hidden focusable="false">
        <rect x="7" y="23" width="206" height="74" rx="37" className="fill-card stroke-ink" strokeWidth="2"/>
        <rect x="56" y="33" width="108" height="54" rx="22" className="fill-mist stroke-ink" strokeWidth="1.6"/>
        <circle cx="110" cy="60" r="14" fill="none" className="stroke-ink-3" strokeWidth="1.6"/>
        <circle cx="110" cy="60" r="4.5" className="fill-accent"/>
      </svg>) },
]

const SCREENS = [
  { id:'student', who:'Student',
    title:`Your ${SCORE} each day`,
    line:'Every reading you take, and what moved it.',
    cta:'What a student gets' },
  { id:'parent',  who:'Parent',
    title:'A weekly summary',
    line:'How the week went, in plain words, with no raw readings.',
    cta:'What a parent gets' },
  { id:'pro',     who:PRO,
    title:'Students to check on',
    line:'Only the students who chose to share.',
    cta:`What a ${PRO_LC} gets` },
]

/* One line per audience. The full matrix is on the privacy page. */
const SEES = [
  { who:'Student', sees:'Sees everything first' },
  { who:`Parent and ${PRO}`, sees:'Only what the student allows' },
]

/* The wording is the promise. "A group under five" is the k floor; "fewer than
   five" would be one word shorter and a different commitment. */
const NEVER = [
  'Show a parent a raw reading',
  'Report on a group under five',
  'Keep data past what the student chooses',
  'Open a record without logging it',
  'Sell or share anything',
  'Diagnose anything or act as a medical device',
]

const FUTURE = [
  { title: 'MindMap Teens',   when: 'Now',   now: true },
  { title: 'MindMap Adults',  when: 'Next',  now: false },
  { title: 'MindMap Seniors', when: 'Later', now: false },
]

const HERO_FACTS = [
  `A ${SCORE} from a patch or your phone camera.`,
  'You decide who else sees it.',
]

/* A wash photograph drifting against the scroll, 10% oversize so no edge shows. */
function DriftWash({ photo, className, imgClassName, distance = 48 }) {
  return (
    <Parallax2D clip distance={distance} scale={0.03}
      className={cn('absolute inset-0 [&>div]:absolute [&>div]:inset-0', className)}>
      <Frame wash photo={photo} className={cn('absolute inset-0 scale-[1.1]', imgClassName)}/>
    </Parallax2D>
  )
}

/* The hero's second button. The site routes by hash, so a plain #different
   link would change the route; this scrolls instead, under the sticky header,
   and jumps without animating when the reader asks for reduced motion. */
function toDifferent() {
  const el = document.getElementById('different')
  if (!el) return
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const head = document.querySelector('header')?.offsetHeight ?? 58
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - head, behavior: reduced ? 'auto' : 'smooth' })
}

export function Overview({ go }) {
  return (
    <main>
      {/* -- the hero -------------------------------------------------------
          `h-`, not `min-h-`, from lg up: min-h lets tall content push the band
          past the fold. Under lg the two halves stack and are taller than a
          phone, so there the band takes its own height. */}
      <section id="hero" className="relative isolate flex flex-col overflow-hidden border-t
        border-rule bg-paper lg:h-[calc(100svh-58px)]">

        <div className="wrap relative z-10 flex flex-1 flex-col
          lg:grid lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)]
          xl:grid-cols-[minmax(0,44rem)_minmax(0,1fr)]
          2xl:grid-cols-[minmax(0,50rem)_minmax(0,1fr)]">

          <div className="flex min-h-0 flex-1 flex-col justify-center py-6 lg:flex-none lg:py-0 lg:pr-10">
            <ScrollIn as="p" className="mb-4 font-body text-ui font-semibold text-accent-ink">
              A wellness app for teenagers
            </ScrollIn>
            {/* No balanced wrapping: it moves the break mid-phrase. Leading is
                1.06, not 1.02, where the descenders of "Making your stress"
                landed in the cap height of "readable". */}
            <h1 className="max-w-[13ch] font-display text-view font-bold leading-[1.06]
              tracking-tight text-ink [text-wrap:balance] lg:text-sect
              2xl:max-w-[11ch] 2xl:text-fig">
              Making your stress <span className="text-accent">readable</span>.
            </h1>
            <ScrollIn as="p" className="mt-5 max-w-[30ch] text-lead font-medium leading-[1.3] text-ink">
              The world’s only wearable patch and app system designed exclusively for adolescent wellness.
            </ScrollIn>
            <ScrollIn className="mt-4">
              <List>
                {HERO_FACTS.map(f => (
                  <Item key={f} className="text-sec text-ink-2">{f}</Item>
                ))}
              </List>
            </ScrollIn>
            {/* "Open the app" is in the header, so not repeated here. */}
            <ScrollIn className="mt-7 flex flex-wrap items-center gap-3">
              <Button onClick={() => { setMode('demo'); go('app-student') }}>Watch the demo<span aria-hidden>→</span></Button>
              <Button variant="ghost" className="min-h-[44px] px-0 sm:ml-3" onClick={toDifferent}>
                More than your typical stress monitoring app
              </Button>
            </ScrollIn>
          </div>

          {/* `after` on each field is the part that lives past the wrap's right
              edge: over 1680 the wrap stops short of the viewport. */}
          <div className="relative -mx-[22px] flex flex-1 border-t border-rule
            sm:-mx-10 lg:mx-0 lg:-mr-10 lg:border-l lg:border-t-0">

            <div className="relative flex flex-1 items-center justify-center overflow-hidden
              border-r border-rule bg-accent-wash px-4 py-8 lg:py-0
              after:absolute after:inset-y-0 after:left-full after:hidden after:w-screen
              after:bg-accent-wash after:content-[''] lg:after:block">
              <span aria-hidden className="absolute left-3 top-3 h-3 w-3 border-l border-t border-ruling/55"/>
              <span aria-hidden className="absolute bottom-3 left-3 h-3 w-3 border-b border-l border-ruling/55"/>
              <span aria-hidden className="mm-glow pointer-events-none absolute left-1/2 top-1/2
                h-[62%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-[50%]"/>
              <figure className="relative m-0 flex min-w-0 max-w-full flex-col items-center gap-3">
                <PatchFront className="w-[180px] sm:w-[224px] lg:w-[250px] xl:w-[290px]"/>
                <figcaption className="max-w-[17ch] text-balance text-center font-display text-fine
                  font-bold tracking-[0.01em] text-ink-3 sm:max-w-none">
                  Pulse, sweat, temperature, movement
                </figcaption>
              </figure>
            </div>

            {/* The one photograph on the hero, under the phone. The focal point
                comes from lib/photos.js and the frame grows to keep faces whole. */}
            <div className="relative flex flex-1 flex-col items-center justify-center
              overflow-hidden bg-beam-wash px-4 py-8 lg:py-0
              after:absolute after:inset-y-0 after:left-full after:hidden after:w-screen
              after:bg-beam-wash after:content-[''] lg:after:block">
              {/* Drawn 10% oversize so the drift shows no edge. */}
              <Parallax2D clip distance={24} scale={0.02}
                className="absolute inset-0 [&>div]:absolute [&>div]:inset-0">
                <Frame photo="students-hallway" eager
                  alt="Four high school students walking along a bright corridor with folders and backpacks, talking as they go"
                  className="absolute inset-0 scale-[1.1]"/>
              </Parallax2D>
              <IPhone model="15-pro" scale={0.3} screenBg="#f7faf8"
                label={`The MindMap app, cycling through a reading, the ${SCORE} it returns and the week it lands in`}
                className="shrink-0 lg:hidden">
                <PhoneApp/>
              </IPhone>
              <IPhone model="15-pro" scale={0.52} screenBg="#f7faf8"
                label={`The MindMap app, cycling through a reading, the ${SCORE} it returns and the week it lands in`}
                className="hidden shrink-0 lg:block xl:hidden">
                <PhoneApp/>
              </IPhone>
              <IPhone model="15-pro" scale={0.62} screenBg="#f7faf8"
                label={`The MindMap app, cycling through a reading, the ${SCORE} it returns and the week it lands in`}
                className="hidden shrink-0 xl:block">
                <PhoneApp/>
              </IPhone>
            </div>
          </div>
        </div>
      </section>

      {/* -- what MindMap is, in the owner's own words, on green -------------
          The lead and a tall photograph on the left; the four paragraphs as a
          two by two set on the right from lg. */}
      {/* The band's name is its h2, not a label plus an sr-only twin. */}
      <Section tone="card" id="what" className="bg-accent-wash">
        <h2 className="m-0 font-body text-ui font-semibold text-accent">What MindMap is</h2>
        <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-10
          xl:grid-cols-[minmax(0,30rem)_minmax(0,1fr)]">
          <div className="flex flex-col gap-5">
            <ScrollIn as="p" className="m-0 max-w-[60ch] font-display text-lead font-bold leading-[1.4] tracking-tight
              text-ink sm:text-row lg:text-head lg:leading-[1.28]">
              {IS_LEAD}
            </ScrollIn>
            {/* clip={false} keeps the shadow; html and body clip x already. */}
            <Parallax2D clip={false} distance={40} scale={0.03}
              className="lg:flex lg:flex-1 lg:flex-col lg:[&>div]:flex lg:[&>div]:flex-1 lg:[&>div]:flex-col">
              <div className="relative h-[260px] overflow-hidden rounded-panel border border-rule
                shadow-card sm:h-[320px] lg:h-auto lg:min-h-[300px] lg:flex-1">
                <Frame photo="friends-steps"
                  alt="Two teenagers sitting on outdoor steps, smiling at an open notebook, a backpack at their feet"
                  className="absolute inset-0"/>
              </div>
            </Parallax2D>
          </div>
          <ul className="m-0 grid list-none content-start gap-3.5 p-0 sm:grid-cols-2">
            {IS.map((item, i) => (
              <ScrollRow as="li" key={item.id} index={i}
                className="flex gap-4 rounded-panel border border-rule bg-card p-5">
                <span className="shrink-0 pt-0.5">{IS_ICON[item.id]}</span>
                <p className="m-0 text-sec leading-[1.55] text-ink-2">{item.text}</p>
              </ScrollRow>
            ))}
          </ul>
        </div>
      </Section>

      {/* -- the problem, on the one dark band -----------------------------
          Every figure on this band is external and sourced. The figures sit
          on a frosted panel: on the band directly they measured under AA. */}
      <Section name="The problem" tone="ink" className="relative isolate overflow-hidden">
        <DriftWash photo="student-homework" className="-z-10" imgClassName="opacity-[0.22]"/>
        <SectionHead tone="ink" className="max-w-[30ch]">
          Teen stress is common and often unseen
        </SectionHead>
        <ScrollIn className="mt-5 rounded-panel border border-paper/30 bg-card/90 p-5 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.6)] backdrop-blur-md lg:p-6">
          <ProblemFigures/>
        </ScrollIn>
      </Section>

      {/* -- the two ways in, on blue ---------------------------------------
          The photograph sits at 0.14 with no scrim so the ground stays blue.
          Over it accent measured 4.0, so the band's name takes accent.ink. */}
      <Section name="Getting started" tone="card"
        className="relative isolate overflow-hidden bg-sky-band [&>div>p:first-child]:text-accent-ink">
        <DriftWash photo="student-bus" className="-z-10" imgClassName="opacity-[0.14]"/>
        <SectionHead>2 ways to use MindMap</SectionHead>
        <SectionLede>Both give you the same {SCORE} in the same app.</SectionLede>
        <div className="mt-5 grid auto-rows-fr gap-3.5 md:grid-cols-2">
          {WAYS.map((w, i) => (
            <ScrollRow key={w.id} index={i} className="h-full">
              <Card interactive as="button" type="button" onClick={() => go(w.go)}
                className={cn('flex h-full w-full flex-col p-5 text-left', w.lead && 'border-l-accent')}>
                <span className="grid h-[52px] place-items-start" aria-hidden>{w.art}</span>
                <span className="mt-3 block font-display text-head font-bold leading-tight text-ink">
                  {w.title}
                </span>
                <ol className="m-0 mt-3 list-none space-y-2 p-0">
                  {w.steps.map((step, n) => (
                    <li key={step} className="flex items-start gap-3 text-sec leading-[1.5] text-ink-2">
                      <span aria-hidden className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-sky-wash font-display text-xs font-bold text-sky-ink">{n + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <span className="mt-auto flex items-center gap-2 pt-5 font-display text-meta
                  font-bold text-accent">
                  {w.cta}
                  <ArrowRight className="size-[1.1rem] transition-transform duration-200
                    groupHoverOnly:translate-x-1.5"/>
                </span>
              </Card>
            </ScrollRow>
          ))}
        </div>
      </Section>

      {/* -- the tools, on white (views/landing/Tools.jsx) ------------------ */}
      <ToolsBand go={go}/>

      {/* -- what makes MindMap different (views/landing/Different.jsx) ----- */}
      <Different go={go}/>

      {/* -- the three audiences, on green ----------------------------------
          From lg the cards stack in the left column and the kitchen
          photograph is the band's right edge, faded in from the green, so no
          card or word ever sits over a face. Under lg it is a rounded frame
          between the lede and the cards. */}
      {/* No band name: "Who it is for" sat right above "Who MindMap is for". */}
      <Section tone="card" id="screens" className="relative isolate overflow-hidden bg-accent-wash">
        <div aria-hidden className="absolute inset-y-0 right-0 -z-10 hidden w-[46%] lg:block
          [mask-image:linear-gradient(to_right,transparent,black_45%)]">
          <DriftWash photo="parent-kitchen" imgClassName="opacity-90"/>
        </div>
        <SectionHead>Who MindMap is for</SectionHead>
        <Parallax2D clip={false} distance={32} scale={0.03} className="mt-5 lg:hidden">
          <div className="relative h-[220px] overflow-hidden rounded-panel border border-rule sm:h-[280px]">
            <Frame photo="parent-kitchen"
              alt="A mother and her teenage son cooking together in a bright kitchen, chopping vegetables"
              className="absolute inset-0"/>
          </div>
        </Parallax2D>
        <div className="mt-5 grid auto-rows-fr gap-3.5 lg:max-w-[34rem] xl:max-w-[40rem]">
          {SCREENS.map((s2, i) => (
            <ScrollRow key={s2.id} index={i} className="h-full">
              <button type="button" onClick={() => go(s2.id)}
                className="group flex h-full w-full flex-col gap-3 rounded-panel
                  border border-rule bg-card p-5 text-left shadow-card touch-manipulation
                  transition-[border-color,transform] duration-150 ease-[var(--ease-out)]
                  motion-safe:active:scale-[0.99] hoverOnly:border-accent">
                <span className="font-body text-ui font-semibold text-accent-ink">{s2.who}</span>
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

      {/* ── privacy, on blue, with a rounded photograph beside it at lg ───── */}
      <Section name="Privacy" tone="card" className="bg-sky-band">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-10
          xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <div className="min-w-0">
            <SectionHead>Your data stays yours</SectionHead>
            <SectionLede>{CONSENT_SHORT}</SectionLede>
            <dl className="mt-5 grid gap-3.5 sm:grid-cols-2">
              {SEES.map((r, i) => (
                <ScrollRow key={r.who} index={i} className="rounded-panel border border-rule bg-card p-5">
                  <dt className="font-body text-ui font-semibold text-accent-ink">{r.who}</dt>
                  <dd className="m-0 mt-2 font-display text-head font-bold leading-[1.15] tracking-tight text-ink">
                    {r.sees}
                  </dd>
                </ScrollRow>
              ))}
            </dl>
            <ScrollIn>
              <p className="mt-6 font-display text-ui font-semibold text-ink">MindMap will never</p>
              <List className="mt-2.5 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {NEVER.map(t => (
                  <Item key={t} className="text-meta text-ink-2">{t}</Item>
                ))}
              </List>
            </ScrollIn>
            <p className="mt-5 text-meta text-ink-2">
              {NOTES}, {LOCATION} and every raw reading never leave the phone.
              <button type="button" onClick={() => go('privacy')}
                className="ml-3 border-b-2 border-accent/35 font-display font-medium text-accent hoverOnly:border-accent hoverOnly:text-accent-ink">
                Who sees what
              </button>
            </p>
          </div>
          <Parallax2D clip={false} distance={40} scale={0.03} className="lg:[&>div]:h-full">
            <div className="relative h-[220px] overflow-hidden rounded-[28px] border border-rule shadow-card
              sm:h-[280px] lg:h-full lg:min-h-[340px]">
              <Frame photo="parent-laptop"
                alt="A mother and her teenage daughter sitting close together at a laptop on a living room table, both smiling"
                className="absolute inset-0"/>
            </div>
          </Parallax2D>
        </div>
      </Section>

      {/* ── what comes next, and the closing line, on turquoise ────────────
          ink.3 measures 4.36 on aqua.2, so nothing here is set in it, and the
          band's name takes accent.ink rather than accent. */}
      {/* No band name: "What comes next" said what the lede says. */}
      <Section tone="card" className="relative isolate overflow-hidden bg-aqua-2">
        {/* A soft, low-opacity vignette of the photograph in the right half,
            from lg only: under lg the text runs the full width. */}
        <div aria-hidden className="absolute inset-y-0 right-0 -z-10 hidden w-1/2 lg:block
          [mask-image:radial-gradient(ellipse_62%_75%_at_55%_45%,black_35%,transparent_75%)]">
          <DriftWash photo="student-basketball" imgClassName="opacity-[0.55] mix-blend-multiply"/>
        </div>
        <SectionHead>MindMap for every age</SectionHead>
        <SectionLede className="text-ink-2">MindMap starts with teens. Adults and seniors come next.</SectionLede>
        <ol className="m-0 mt-5 grid max-w-[40rem] list-none grid-cols-3 gap-2.5 p-0">
          {FUTURE.map((f, i) => (
            <ScrollRow as="li" key={f.title} index={i} className={cn('flex flex-col gap-1 rounded-panel border bg-card p-4',
              f.now ? 'border-accent shadow-card' : 'border-rule')}>
              <span className={cn('font-body text-fine font-semibold', f.now ? 'text-accent-ink' : 'text-ink-2')}>{f.when}</span>
              <span className="font-display text-ui font-bold leading-[1.2] text-ink sm:text-row">{f.title}</span>
            </ScrollRow>
          ))}
        </ol>
        <p className="mt-6 max-w-[40ch] font-display text-head font-bold leading-[1.2] tracking-tight text-ink">
          Quantify the stress. Find the resources. Start feeling better.
        </p>
      </Section>

    </main>
  )
}
