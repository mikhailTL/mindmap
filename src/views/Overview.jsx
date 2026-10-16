import React from 'react'
import { PHOTOS } from '../lib/photos'
import { Button } from '../ui/button'
import { Section, SectionHead, SectionLede } from '../ui/section'
import { ScrollIn, ScrollRow } from '../ui/motion'
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
/* The site's vocabulary. Nothing here invents a second name for any of it. */
import {
  SCORE, NOTES, LOCATION, PRO, PRO_LC,
  CONSENT_SHORT,
} from '../lib/terms'

/* Nine bands, one idea each: hero, problem, what it does, the two ways in,
 * the tools, what no other app has, who it is for, privacy, every age.
 *
 * Grounds are set here rather than in the bands. They are tints and not
 * alternating near-whites because paper and card differ by about 2% in
 * luminance, which reads as no change at all. ink 12.7 : 1, ink.2 6.9,
 * ink.3 4.67 and accent 4.84 all clear AA on every wash.
 */

const DOES = [
  { title: 'Gives you a score', line: 'One stress score a day, against your own usual.' },
  { title: 'Shows your trend',  line: 'See how a week or a month went.' },
  { title: 'Helps you act',     line: 'Tools and resources to feel better, in the app.' },
]

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

const RESOURCES = [
  { title: 'Exercise and meditation on YouTube', items: [
    { name: 'Yoga With Adriene', what: 'Yoga and stretching, all levels', href: 'https://www.youtube.com/@yogawithadriene' },
    { name: 'MadFit', what: 'Short home workouts, no equipment', href: 'https://www.youtube.com/@MadFit' },
    { name: 'Headspace', what: 'Guided meditation and breathing', href: 'https://www.youtube.com/@headspace' },
    { name: 'The Honest Guys', what: 'Guided meditations for sleep and calm', href: 'https://www.youtube.com/@TheHonestGuys' },
  ] },
  { title: 'Podcasts on meditation and calm', items: [
    { name: 'Meditation Minis', what: 'Ten minute guided meditations', href: 'https://podcasts.apple.com/us/podcast/meditation-minis-podcast/id963597166' },
    { name: 'Happier Meditation', what: 'Dan Harris on meditation for sceptics', href: 'https://www.meditatehappier.com/explore-happier-meditation' },
    { name: 'NAMI for teens', what: 'Where to find help, by a national nonprofit', href: 'https://www.nami.org/kids-teens-and-young-adults/' },
  ] },
]

/* What no other wellbeing app for teenagers measures. The Traffic Light leads
   because it is the one a parent asks about first; the six under it are the
   sensors the phone or the patch already has (project doc
   beyond-the-screen-research). */
const BEYOND = [
  { title: 'Settle time',     line: 'How fast your body settles after a stress peak.' },
  { title: 'Run-up',          line: 'How much your body rose before a marked exam.' },
  { title: 'Sigh coach',      line: 'The microphone measures each exhale as you breathe.' },
  { title: 'Chest breathing', line: 'Your phone on your chest counts your breaths.' },
  { title: 'Alertness check', line: 'Sixty seconds of taps show a short night.' },
  { title: 'Pocket pacer',    line: 'Breathing cues keep going with the phone locked.' },
]

const SCREENS = [
  { id:'student', who:'Student', photo:'student-card',
    alt:'Five teenagers walking home together through a park',
    title:'Your score each day',
    line:'See every reading you take, and what moved it.',
    cta:'What a student gets' },
  { id:'parent',  who:'Parent', photo:'parent-card',
    alt:'A mother and her teenage son looking at something together at home',
    title:'One light, one sentence',
    line:'How the week went, in plain words. Never a raw reading.',
    cta:'What a parent gets' },
  { id:'pro',     who:PRO, photo:'school-card',
    alt:`A ${PRO_LC} and a student talking on a sofa`,
    title:'Students to check on',
    line:'Only the students who chose to share.',
    cta:`What a ${PRO_LC} gets` },
]

/* One line per audience. The full matrix is on the privacy page. */
const SEES = [
  { who:'Student', sees:'Sees everything first' },
  { who:'Parent',  sees:'Only what the student allows' },
  { who:PRO,       sees:'Only what the student allows' },
]

/* The wording is the promise. "A group under five" is the k floor; "fewer than
   five" would be one word shorter and a different commitment. */
const NEVER = [
  'Show a parent a raw reading',
  'Report on a group under five',
  'Keep data past what the student chooses',
  'Open a record without logging it',
  'Sell or share anything',
  'Diagnose anything. Not a medical device',
]

const FUTURE = [
  { title: 'MindMap Teens',   when: 'Now',   now: true },
  { title: 'MindMap Adults',  when: 'Next',  now: false },
  { title: 'MindMap Seniors', when: 'Later', now: false },
]

const HERO_FACTS = [
  'One stress score a day, from a patch or your phone camera.',
  'You decide who else can see it.',
]

/* The three lamps of the Traffic Light, drawn once for the landing tile. */
function Lamps() {
  return (
    <svg viewBox="0 0 44 112" className="h-[92px] w-auto shrink-0" aria-hidden focusable="false">
      <rect x="2" y="2" width="40" height="108" rx="20" className="fill-ink"/>
      <circle cx="22" cy="24" r="12" className="fill-crit"/>
      <circle cx="22" cy="56" r="12" className="fill-sun"/>
      <circle cx="22" cy="88" r="12" className="fill-mint"/>
    </svg>
  )
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
            <ScrollIn as="p" className="font-body text-ui font-semibold text-accent-ink">
              A wellbeing app for teenagers
            </ScrollIn>
            {/* No balanced wrapping: it moves the break mid-phrase. Leading is
                1.06, not 1.02, where the descenders of "Making your stress"
                landed in the cap height of "readable". */}
            <h1 className="mt-4 max-w-[13ch] font-display text-view font-bold leading-[1.06]
              tracking-tight text-ink [text-wrap:balance] lg:text-sect
              2xl:max-w-[11ch] 2xl:text-fig">
              Making your stress <span className="text-accent">readable</span>.
            </h1>
            <ScrollIn as="p" className="mt-5 max-w-[30ch] text-lead font-medium leading-[1.3] text-ink">
              MindMap is an app that helps teenagers track and monitor their stress levels.
            </ScrollIn>
            <ScrollIn className="mt-4">
              <List>
                {HERO_FACTS.map(f => (
                  <Item key={f} className="text-sec text-ink-2">{f}</Item>
                ))}
              </List>
            </ScrollIn>
            <ScrollIn className="mt-7 flex flex-wrap gap-3">
              <Button onClick={() => go('app')}>Open the app<span aria-hidden>→</span></Button>
              <Button variant="outline" onClick={() => { setMode('demo'); go('app-student') }}>Watch the demo</Button>
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
              <Frame photo="students-hallway" eager
                alt="Four high school students walking along a bright corridor with folders and backpacks, talking as they go"
                className="absolute inset-0"/>
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

      {/* -- the problem, on the one dark band -----------------------------
          Every figure on this band is external and sourced. The figures sit
          on a frosted panel: on the band directly they measured under AA. */}
      <Section name="The problem" tone="ink" className="relative isolate overflow-hidden">
        <Frame wash photo="student-homework"
          alt="A teenager at a desk late in the evening, head in one hand over an open notebook"
          className="absolute inset-0 -z-10 opacity-[0.22]"/>
        <SectionHead tone="ink" className="max-w-[30ch]">
          Teen stress is common, and most of it goes unseen
        </SectionHead>
        <div className="mt-5 rounded-panel border border-paper/30 bg-card/90 p-5 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.6)] backdrop-blur-md lg:p-6">
          <ProblemFigures/>
        </div>
      </Section>

      {/* -- what it does ---------------------------------------------------- */}
      <Section name="What MindMap does" tone="paper">
        <SectionHead>What MindMap does</SectionHead>
        <dl className="mt-5 grid gap-3.5 md:grid-cols-3">
          {DOES.map(d => (
            <div key={d.title} className="rounded-panel border border-rule bg-card p-5 shadow-card">
              <dt className="font-display text-head font-bold leading-[1.15] tracking-tight text-ink">{d.title}</dt>
              <dd className="m-0 mt-2 text-sec leading-[1.5] text-ink-2">{d.line}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* -- the two ways in ------------------------------------------------- */}
      <Section name="Getting started" tone="card" className="relative isolate overflow-hidden bg-accent-wash">
        <Frame wash photo="student-bus"
          alt="Two boys laughing together on a school bus seat, one holding a phone, trees going past the window behind them"
          className="absolute inset-0 -z-20 opacity-[0.28]"/>
        <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-accent-wash via-accent-wash/85 to-accent-wash/35"/>
        <SectionHead>2 ways to use MindMap</SectionHead>
        <SectionLede>Both give you the same score and the same app.</SectionLede>
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
                      <span aria-hidden className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-accent-wash font-display text-xs font-bold text-accent">{n + 1}</span>
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
        <div className="mt-5 flex flex-wrap gap-3">
          <Button size="sm" onClick={() => go('app')}>Open the app<span aria-hidden>→</span></Button>
          <Button variant="outline" size="sm" onClick={() => { setMode('demo'); go('app-student') }}>Watch the demo<span aria-hidden>→</span></Button>
        </div>
      </Section>

      {/* -- the tools, and the resources inside them ----------------------- */}
      <Section name="Toolkit" tone="paper">
        <SectionHead>Tools inside the app</SectionHead>
        <SectionLede>Exercises, plus the best free videos and podcasts, in one place.</SectionLede>
        <div className="mt-5 grid gap-3.5 md:grid-cols-2">
          {RESOURCES.map(group => (
            <div key={group.title} className="rounded-panel border border-rule bg-card p-5 shadow-card">
              <p className="font-display text-head font-bold leading-[1.15] tracking-tight text-ink">{group.title}</p>
              <ul className="m-0 mt-3 list-none p-0">
                {group.items.map(it => (
                  <li key={it.href} className="border-t border-rule py-2.5 first:border-t-0 first:pt-0">
                    <a href={it.href} target="_blank" rel="noreferrer"
                      className="group flex items-center gap-3 text-ink hoverOnly:text-accent-ink">
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-ui font-semibold">{it.name}</span>
                        <span className="block text-fine text-ink-3">{it.what}</span>
                      </span>
                      <ArrowRight className="size-4 shrink-0 text-accent"/>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <Button variant="outline" size="sm" onClick={() => go('toolkit')}>Open the Toolkit<span aria-hidden>→</span></Button>
        </div>
      </Section>

      {/* -- what no other app has: the Traffic Light first ------------------ */}
      <Section name="Beyond the screen" tone="card" className="bg-aqua-2">
        <SectionHead>What other apps do not have</SectionHead>
        <SectionLede>Measured by sensors your phone and the patch already have.</SectionLede>
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-3">
          <Card interactive as="button" type="button" onClick={() => go('traffic-light')}
            className="col-span-2 flex w-full items-center gap-5 border-l-accent p-5 text-left lg:col-span-3">
            <Lamps/>
            <span className="min-w-0 flex-1">
              <span className="block font-body text-ui font-semibold text-accent-ink">For parents</span>
              <span className="mt-1 block font-display text-[1.75rem] font-bold leading-[1.1] tracking-tight text-ink">
                The Traffic Light
              </span>
              <span className="mt-2 block max-w-[46ch] text-sec leading-[1.5] text-ink-2">
                Measures how a teen reacts to their phone, never what is on it.
              </span>
              <span className="mt-3 flex items-center gap-2 font-display text-meta font-bold text-accent">
                See the Traffic Light
                <ArrowRight className="size-[1.1rem] transition-transform duration-200 groupHoverOnly:translate-x-1.5"/>
              </span>
            </span>
          </Card>
          {BEYOND.map(b => (
            <div key={b.title} className="rounded-panel border border-rule bg-card p-4 shadow-card sm:p-5">
              <p className="font-display text-ui sm:text-head font-bold leading-[1.15] tracking-tight text-ink">{b.title}</p>
              <p className="m-0 mt-1.5 text-meta leading-[1.45] text-ink-2 sm:text-sec">{b.line}</p>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <Button variant="outline" size="sm" onClick={() => go('methods')}>How each one is measured<span aria-hidden>→</span></Button>
        </div>
      </Section>

      {/* -- the three audiences ------------------------------------------- */}
      <Section name="Who it is for" tone="card" id="screens" className="bg-beam-wash">
        <SectionHead>Who MindMap is for</SectionHead>
        <SectionLede>Each person sees only what the student allows.</SectionLede>
        <div className="mt-5 grid auto-rows-fr gap-3.5 lg:grid-cols-3">
          {SCREENS.map((s2, i) => (
            <ScrollRow key={s2.id} index={i} className="h-full">
              <button type="button" onClick={() => go(s2.id)}
                className="group flex h-full w-full flex-col gap-3 overflow-hidden rounded-panel
                  border border-rule bg-card p-5 text-left touch-manipulation
                  transition-[border-color,transform] duration-150 ease-[var(--ease-out)]
                  motion-safe:active:scale-[0.99] hoverOnly:border-accent">
                {/* max-w-none is load-bearing: preflight's `img { max-width:
                    100% }` would undo the negative-margin bleed. */}
                <img src={PHOTOS[s2.photo]} alt={s2.alt} loading="lazy" decoding="async"
                  width="1200" height="423"
                  className="-mx-5 -mt-5 mb-1 h-[160px] w-[calc(100%_+_2.5rem)] max-w-none
                    rounded-t-panel object-cover
                    motion-safe:transition-transform motion-safe:duration-[260ms]
                    motion-safe:ease-[var(--ease-out)]
                    motion-safe:groupHoverOnly:scale-[1.02]"/>
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

      {/* ── privacy, with the promises that used to be their own band ─────── */}
      <Section name="Privacy" tone="paper">
        <SectionHead>Your data stays yours</SectionHead>
        <SectionLede>{CONSENT_SHORT}</SectionLede>
        <dl className="mt-5 grid gap-3.5 sm:grid-cols-3">
          {SEES.map(r => (
            <div key={r.who} className="rounded-panel border border-rule bg-card p-5">
              <dt className="font-body text-ui font-semibold text-accent-ink">{r.who}</dt>
              <dd className="m-0 mt-2 font-display text-head font-bold leading-[1.15] tracking-tight text-ink">
                {r.sees}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 font-display text-ui font-semibold text-ink">MindMap will never</p>
        <ul className="m-0 mt-2.5 flex list-none flex-wrap gap-2 p-0">
          {NEVER.map(t => (
            <li key={t} className="rounded-full border border-rule bg-card px-3.5 py-1.5 text-meta text-ink-2">{t}</li>
          ))}
        </ul>
        <p className="mt-4 text-meta text-ink-2">
          {NOTES}, {LOCATION} and every raw reading never leave the phone.
          <button type="button" onClick={() => go('privacy')}
            className="ml-3 border-b-2 border-accent/35 font-display font-medium text-accent hoverOnly:border-accent hoverOnly:text-accent-ink">
            Who sees what
          </button>
        </p>
      </Section>

      {/* ── what comes next, and the closing line ───────────────────────── */}
      <Section name="What comes next" tone="card" className="bg-accent-wash">
        <SectionHead>MindMap for every age</SectionHead>
        <SectionLede>Teens first. The same patch and score can serve adults and seniors.</SectionLede>
        <ul className="m-0 mt-5 flex list-none flex-wrap gap-2.5 p-0">
          {FUTURE.map(f => (
            <li key={f.title} className={cn('flex items-center gap-2.5 rounded-full border px-4 py-2',
              f.now ? 'border-accent/40 bg-card shadow-card' : 'border-rule bg-card/70')}>
              <span className="font-display text-ui font-bold text-ink">{f.title}</span>
              <span className={cn('font-body text-fine font-semibold', f.now ? 'text-accent-ink' : 'text-ink-3')}>{f.when}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-[40ch] font-display text-head font-bold leading-[1.2] tracking-tight text-ink">
          Quantify the stress. Find the resources. Start feeling better.
        </p>
      </Section>

    </main>
  )
}
