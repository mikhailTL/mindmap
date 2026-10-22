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
import { Card, cardClass } from '../ui/card'
import { List, Item } from '../ui/list'
import { cn } from '../lib/utils'
import { setMode } from '../lib/mode'
import { WhatIs } from './landing/WhatIs'
import { Different } from './landing/Different'
import { HeadsUp } from './audience'
import rainbowLg from '../photos/rainbow-field.webp'
import rainbowSm from '../photos/rainbow-field-sm.webp'
import heroField from '../photos/hero-field.webp'
import {
  SCORE, NOTES, LOCATION, PRO, PRO_LC, PRO_PLURAL,
  CONSENT_SHORT,
} from '../lib/terms'

// Section ids in page order, for the header's Overview menu. `what-is` is in landing/WhatIs.jsx and
// `different` in landing/Different.jsx.
export const OVERVIEW_SECTIONS = [
  ['problem',   'The problem'],
  ['why',       'Why MindMap?'],
  ['what-is',   'What is MindMap?'],
  ['different', 'Features'],
  ['start',    'Getting started'],
  ['screens',  'Audiences'],
  ['privacy',  'Privacy'],
]

const WAYS = [
  { id:'patch', go:'patch', title:'With the patch', cta:'See how it works', lead:true, photo:'photos-steps-patch',
    steps: ['Stick the patch on your upper arm', 'Pair it with the app once', 'Your score updates through the day'] },
  { id:'phone', go:'without-patch', title:'Without the patch', cta:'See how it works', photo:'ovw-mirror-face',
    steps: [
      "Mental Mirror reads your face with Google's MediaPipe Face Landmarker, a machine learning model.",
      'Camera pulse check reads your pulse from skin colour with your phone camera.',
      'Survey asks a few short questions.',
    ] },
]

const SCREEN_TOP = ['border-t-accent', 'border-t-beam', 'border-t-sun']

const SCREENS = [
  { id:'students', title:'Students',
    who:`Students seeking proactive wellness management, recommended by a parent or ${PRO}, or in a state of mental distress.`,
    gets:[`Your ${SCORE} each day.`,
      <><HeadsUp/> notices stress in how you use your phone, never what is on it. You see it first.</>],
    cta:'What a student gets' },
  { id:'parents', title:'Parents',
    who:'Parents who want to understand and support their teen’s stress without invading their privacy, or whose teen was recommended MindMap.',
    gets:['Trends by day, week and month, in plain words.',
      <><HeadsUp/> tells you when phone activity is causing your teen stress.</>],
    cta:'What a parent gets' },
  { id:'pro', title:PRO_PLURAL,
    who:'Counselors, therapists and other professionals who support teens and want to see which students may need a check-in, with the teen’s consent.',
    gets:['Only the students who chose to share.',
      <>Each student’s <HeadsUp/> colour, never the content.</>],
    cta:`What a ${PRO_LC} gets` },
]

const SEES = [
  { who:'Student', sees:'Sees everything first' },
  { who:`Parent and ${PRO}`, sees:'Only what the student allows' },
]

// "A group under five" states the k-anonymity floor of five people.
const NEVER = [
  'Show a parent a raw reading',
  'Report on a group under five',
  'Keep data past what the student chooses',
  'Open a record without logging it',
  'Sell or share anything',
  'Diagnose anything or act as a medical device',
]

function DriftWash({ photo, className, imgClassName, distance = 48 }) {
  return (
    <Parallax2D clip distance={distance} scale={0.03}
      className={cn('absolute inset-0 [&>div]:absolute [&>div]:inset-0', className)}>
      <Frame wash photo={photo} className={cn('absolute inset-0 scale-[1.1]', imgClassName)}/>
    </Parallax2D>
  )
}

// The site routes by hash, so a #different link would change the route; this scrolls under the sticky header.
function toDifferent() {
  const el = document.getElementById('different')
  if (!el) return
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const head = document.querySelector('header')?.offsetHeight ?? 58
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - head, behavior: reduced ? 'auto' : 'smooth' })
}

// Drawn 24% oversize so no edge shows. The wordmark is 42% of the photo's width, so the band stays 200px tall
// at 390 to keep its first and last letters in the crop.
function RainbowBreak() {
  return (
    <section aria-label="MindMap" className="relative isolate h-[200px] overflow-hidden sm:h-[320px]
      lg:h-[min(46vw,620px)]">
      <Parallax2D clip distance={120} x={-90} scale={0.06} narrow={0.5}
        className="absolute inset-0 [&>div]:absolute [&>div]:inset-[-12%]">
        <img src={rainbowLg} srcSet={`${rainbowSm} 1086w, ${rainbowLg} 2172w`} sizes="124vw"
          width={2172} height={724} loading="lazy" decoding="async"
          alt="MINDMAP written across a blue sky under a rainbow, with children running through a field of flowers"
          className="block h-full w-full object-cover object-center"/>
      </Parallax2D>
    </section>
  )
}

export function Overview({ go }) {
  return (
    <main>
      {/* `h-`, not `min-h-`, from lg: min-h lets tall content push the band past the fold. */}
      <section id="hero" className="relative isolate flex flex-col overflow-hidden border-t
        border-rule bg-paper lg:h-[calc(100svh-58px)]">

        <div className="wrap relative z-10 flex flex-1 flex-col
          lg:grid lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)]
          xl:grid-cols-[minmax(0,44rem)_minmax(0,1fr)]
          2xl:grid-cols-[minmax(0,50rem)_minmax(0,1fr)]">

          <div className="relative flex min-h-0 flex-1 flex-col justify-center py-6 lg:flex-none lg:py-0 lg:pr-10">
            <div aria-hidden className="pointer-events-none absolute inset-y-0 -left-[50vw] -right-[22px] -z-10
              sm:-right-10 lg:right-0">
              <img src={heroField} alt="" width={728} height={408} decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-[70%_60%] opacity-[0.34]"/>
              <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(247,250,248,0.55)_0%,rgba(247,250,248,0.35)_55%,rgba(247,250,248,0.1)_100%)]"/>
            </div>
            <ScrollIn as="p" className="mb-4 font-body text-[1.125rem] font-semibold text-accent-ink sm:text-[1.25rem]">
              A teen wellness app
            </ScrollIn>
            {/* Leading 1.06: at 1.02 the descenders of the first line reach the cap height of the second. */}
            <h1 className="max-w-[13ch] font-display text-view font-bold leading-[1.06]
              tracking-tight text-ink [text-wrap:balance] lg:text-sect
              2xl:max-w-[11ch] 2xl:text-fig">
              Making your stress <span className="text-accent">readable</span>.
            </h1>
            <ScrollIn as="p" className="mt-5 max-w-[34ch] text-[1.125rem] font-medium leading-[1.4] text-ink">
              The world’s only wearable patch and app system designed exclusively for adolescent wellness.
            </ScrollIn>
            <ScrollIn className="mt-7 flex flex-wrap items-center gap-3">
              <Button onClick={() => { setMode('demo'); go('app-home?demo') }}>View the demo<span aria-hidden>→</span></Button>
              {/* accent-ink, not accent: over the field photograph accent measures 4.48:1. */}
              <Button variant="ghost" className="min-h-[44px] whitespace-normal px-0 text-left text-accent-ink
                hoverOnly:text-ink sm:ml-3" onClick={toDifferent}>
                More than your typical stress monitoring app
              </Button>
            </ScrollIn>
          </div>

          <div className="relative -mx-[22px] flex flex-1 border-t border-rule
            sm:-mx-10 lg:mx-0 lg:-mr-10 lg:border-l lg:border-t-0">

            <div className="relative flex flex-1 items-center justify-center overflow-hidden
              border-r border-rule bg-accent-wash px-4 py-8 lg:py-0
              after:absolute after:inset-y-0 after:left-full after:hidden after:w-screen
              after:bg-accent-wash after:content-[''] lg:after:block">
              <span aria-hidden className="absolute left-3 top-3 h-3 w-3 border-l border-t border-ruling/55"/>
              <span aria-hidden className="absolute bottom-3 left-3 h-3 w-3 border-b border-l border-ruling/55"/>
              <figure className="relative m-0 flex min-w-0 max-w-full flex-col items-center gap-3">
                <PatchFront className="w-[180px] sm:w-[224px] lg:w-[250px] xl:w-[290px]"/>
                <figcaption className="max-w-[17ch] text-balance text-center font-display text-fine
                  font-bold tracking-[0.01em] text-ink-3 sm:max-w-none">
                  Pulse, sweat, temperature, movement
                </figcaption>
              </figure>
            </div>

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

      <Section name="The problem" id="problem" tone="ink" className="relative isolate overflow-hidden">
        {/* The photograph fades out down the band, under the figures. */}
        <DriftWash photo="student-homework" imgClassName="opacity-[0.22]"
          className="-z-10 [mask-image:linear-gradient(to_bottom,black_45%,transparent_72%)]"/>
        <SectionHead tone="ink" className="max-w-[30ch]">
          Teen stress is a global crisis often invisible until it’s too late
        </SectionHead>
        {/* The figures sit on a frosted panel: directly on the dark band they fall under AA contrast. */}
        <ScrollIn className="mt-5 rounded-panel border border-paper/30 bg-card/90 p-5 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.6)] backdrop-blur-md lg:p-6">
          <ProblemFigures/>
        </ScrollIn>
        <div id="why" className="scroll-mt-14 outline-none">
          <ScrollIn className="mt-6 grid gap-4 rounded-panel bg-card p-6 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.55)]
            lg:mt-8 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-12 lg:p-10
            xl:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
            <h3 className="m-0 font-display text-sub font-bold leading-[1.1] tracking-tight text-ink">
              Why MindMap?
            </h3>
            <div className="max-w-[60ch]">
              <p className="m-0 text-sec leading-[1.6] text-ink-2">
                With these mental illnesses showing no sign of ceasing, current approaches do not focus on connections
                and support systems, leaving millions of teens suffering alone. MindMap introduces the world’s first
                wearable patch and app system designed for adolescents, contrary to existing solutions focused on adults,
                individual health, and driving stigma.
              </p>
              <p className="m-0 mt-5 font-display text-[1.25rem] font-semibold leading-[1.4] text-ink lg:text-[1.5rem]">
                MindMap is the only app that bridges the gap between{' '}
                <span className="text-accent">teens, parents, and {PRO_PLURAL}</span>{' '}
                to reduce isolation and nurture caring and supportive environments.
              </p>
            </div>
          </ScrollIn>
        </div>
      </Section>

      <WhatIs go={go}/>

      <Different/>

      <RainbowBreak/>

      <Section name="Getting started" id="start" tone="card"
        className="bg-sky-band [&>div>p:first-child]:text-accent-ink">
        <SectionHead>2 ways to use MindMap</SectionHead>
        <SectionLede>A reading turns your stress level into a {SCORE}, 0 calm to 100 peak. Both ways give the same score.</SectionLede>
        <div className="mt-5 grid gap-3.5 md:auto-rows-fr md:grid-cols-2">
          {WAYS.map((w, i) => (
            <ScrollRow key={w.id} index={i} className="h-full">
              <Card interactive as="button" type="button" onClick={() => go(w.go)}
                variant="plain"
                className={cn('flex h-full w-full flex-col overflow-hidden p-0 text-left lg:flex-row',
                  w.lead && 'border-l-accent')}>
                <span className="relative block aspect-[16/10] w-full shrink-0 overflow-hidden bg-sky-wash
                  lg:aspect-auto lg:w-[40%]">
                  <Frame wash photo={w.photo} className="absolute inset-0"/>
                </span>
                <span className="flex flex-1 flex-col p-5">
                  <span className="block font-display text-head font-bold leading-tight text-ink">
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
                </span>
              </Card>
            </ScrollRow>
          ))}
        </div>
      </Section>

      <Section name="Audiences" tone="card" id="screens" className="relative isolate overflow-hidden bg-accent-wash">
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
                className={cn(cardClass('plain'), 'border-t-4', SCREEN_TOP[i % SCREEN_TOP.length],
                  `group flex h-full w-full flex-col gap-3 p-5 text-left touch-manipulation
                  transition-[border-color,transform] duration-150 ease-[var(--ease-out)]
                  motion-safe:active:scale-[0.99] hoverOnly:border-x-accent hoverOnly:border-b-accent`)}>
                <span className="font-display text-head font-bold leading-[1.15] tracking-tight text-ink">
                  {s2.title}
                </span>
                <span className="max-w-[52ch] text-sec font-medium leading-[1.5] text-ink">{s2.who}</span>
                <span className="block space-y-1.5">
                  {s2.gets.map((g, n) => (
                    <span key={n} className="flex items-start gap-2.5 text-meta leading-[1.5] text-ink-2">
                      <span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-accent"/>
                      <span>{g}</span>
                    </span>
                  ))}
                </span>
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

      <Section name="Privacy" id="privacy" tone="card" className="bg-[#e2f2f0]">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-10
          xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <div className="min-w-0">
            <SectionHead>Your data stays yours</SectionHead>
            <SectionLede>{CONSENT_SHORT}</SectionLede>
            <dl className="mt-5 grid gap-3.5 sm:grid-cols-2">
              {SEES.map((r, i) => (
                <ScrollRow key={r.who} index={i} className={cn(cardClass('plain'), 'p-5')}>
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
              Readings sync to your account and the people you share with. {NOTES} and {LOCATION} are never shared.
              <button type="button" onClick={() => go('privacy')}
                className="ml-3 border-b-2 border-accent/35 font-display font-medium text-accent hoverOnly:border-accent hoverOnly:text-accent-ink">
                Who sees what
              </button>
            </p>
          </div>
          <Parallax2D clip={false} distance={40} scale={0.03} className="lg:[&>div]:h-full">
            <div className="relative h-[220px] overflow-hidden rounded-[28px] border border-rule shadow-card
              sm:h-[280px] lg:h-full lg:min-h-[340px]">
              <Frame photo="photos-hall-denim"
                alt="A teenage girl, a model, walking down a school corridor holding a notebook and a coffee cup"
                className="absolute inset-0"/>
            </div>
          </Parallax2D>
        </div>
      </Section>

    </main>
  )
}
