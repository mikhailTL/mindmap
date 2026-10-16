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

/* Grounds are set here rather than in the bands. Between the two dark bands the
 * washes run accent, beam, aqua, then paper. They are tints and not alternating
 * near-whites because paper and card differ by about 2% in luminance, which
 * reads as no change at all.
 *
 * ink 12.7 : 1, ink.2 6.9, ink.3 4.67 and accent 4.84 all clear AA on both
 * washes, so nothing on a tinted band needs a different colour than it has on
 * paper. Hover is the exception: mist/60 on a wash is the same luminance as the
 * wash, so the rows that hover hover to card instead.
 */

/* `lead` is the phone route: the only one a stranger can use in the next
   minute. */
const DOORS = [
  { id:'patch', go:'patch', title:'With the patch', note:'See the patch',
    line:'A small patch sticks to your upper arm and reads all day.',
    art:(
      <svg viewBox="0 0 220 120" className="h-[46px] w-auto" aria-hidden focusable="false">
        <rect x="7" y="23" width="206" height="74" rx="37" className="fill-card stroke-ink" strokeWidth="2"/>
        <rect x="56" y="33" width="108" height="54" rx="22" className="fill-mist stroke-ink" strokeWidth="1.6"/>
        <circle cx="110" cy="60" r="14" fill="none" className="stroke-ink-3" strokeWidth="1.6"/>
        <circle cx="110" cy="60" r="4.5" className="fill-accent"/>
      </svg>) },
  { id:'phone', go:'without-patch', title:'Without the patch', note:'See how', lead:true,
    line:'Your fingertip on the phone camera for 45 seconds.',
    art:(
      <svg viewBox="0 0 220 120" className="h-[46px] w-auto" aria-hidden focusable="false">
        <rect x="74" y="3" width="72" height="114" rx="12" className="fill-card stroke-ink" strokeWidth="2"/>
        <rect x="86" y="19" width="48" height="48" rx="8" className="fill-ink"/>
        <circle cx="102" cy="39" r="8" className="fill-accent"/>
        <circle cx="122" cy="39" r="5" className="fill-beam"/>
        <path d="M84 91 q10 -16 20 0 t20 0 t12 -6" fill="none" stroke="#a8321f"
          strokeWidth="2.4" strokeLinecap="round"/>
      </svg>) },
]

const SCREENS = [
  { id:'student', who:'Student', photo:'student-card',
    alt:'Five teenagers walking home together through a park',
    title:'Your score each day',
    line:'See every reading you take, and what moved it.',
    cta:'What a student gets' },
  { id:'parent',  who:'Parent', photo:'parent-card',
    alt:'A mother and her teenage son looking at something together at home',
    title:'One sentence a week',
    line:'How the week went, in plain words. Never a raw reading.',
    cta:'What a parent gets' },
  { id:'pro',     who:PRO, photo:'school-card',
    alt:`A ${PRO_LC} and a student talking on a sofa`,
    title:'Students to check on',
    line:'Only the students who chose to share.',
    cta:`What a ${PRO_LC} gets` },
]

/* Four decisions, each traceable to a published finding, and a closing line
 * that refuses the claim the section invites: nothing here has been shown to
 * lower anybody's stress. Numbers are quoted as the sources report them.
 *
 * The readability figures are measured, not asserted: tools/readability/ runs
 * the formulas over the prose this site renders, so the fourth card's number
 * moves when the writing does.
 */
const EVIDENCE = [
  { title: 'Your usual day is marked on the dial',
    line: 'A number shown next to a usual day reads calmly.',
    cite: 'Zikmund-Fisher et al., J Med Internet Res, 2018. 1,618 adults.' },
  { title: 'You are never compared with anyone',
    line: 'Being judged by others is the biggest stress driver.',
    cite: 'Dickerson & Kemeny, Psychological Bulletin, 2004. 208 studies.' },
  { title: 'You decide what is shared',
    line: 'Stress you cannot control raises cortisol three times more.',
    cite: 'Dickerson & Kemeny, 2004. d = 0.52 against 0.16.' },
  { title: 'Written in plain words',
    line: 'Every page reads at grade 7 or below.',
    cite: 'Measured on the prose of all 13 pages. tools/readability.' },
]

/* What it does, why, how a reading is taken, what is inside the toolkit, and
   what comes next: the owner's outline for the page, in his words where he
   gave them. Every link below was checked live before it was written in. */
const DOES = [
  { title: 'Gives you a score', line: 'One stress score a day, 0 to 100, against your own usual.' },
  { title: 'Shows your trend',  line: 'See how a week or a month went, day by day.' },
  { title: 'Helps you act',     line: 'Tools and resources to feel better, right in the app.' },
]
const WHY = [
  { title: 'See where you stand',   line: 'One place to check your wellbeing status and your trend.' },
  { title: 'Act on data',           line: 'A number tells you when to take a step, not just a feeling.' },
  { title: 'Get ahead of it',       line: 'Spot a hard week early and take precautions before it peaks.' },
  { title: 'Find help in one place', line: 'Exercises, videos, podcasts and help lines, without searching elsewhere.' },
]
const READING = [
  { title: 'Without the patch', go: 'without-patch', cta: 'See how it works',
    steps: ['Open the app and tap Take a reading', 'Hold your fingertip over the phone camera', 'After 45 seconds, your score appears'] },
  { title: 'With the patch', go: 'pairing', cta: 'Pair and connect the patch',
    steps: ['Stick the patch on your upper arm', 'Pair it with the app once', 'Your score updates through the day'] },
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
const FUTURE = [
  { title: 'MindMap Teens',   when: 'Now',  now: true,  line: 'For students, with parents and medical professionals in the loop.' },
  { title: 'MindMap Adults',  when: 'Next', now: false, line: 'The same patch and score, built around work and home.' },
  { title: 'MindMap Seniors', when: 'Later', now: false, line: 'The same patch and score, with family and carers in the loop.' },
]

/* What no other wellbeing app for teenagers measures. Each row is a sensor
   the phone or the patch already has, and each claim is the one the research
   record supports (project doc beyond-the-screen-research). */
const BEYOND = [
  { title: 'Settle time',     line: 'Minutes from a stress peak until your body is half way back to usual. From the patch.' },
  { title: 'Run-up',          line: 'How much your body rose before an exam you marked. From the patch.' },
  { title: 'Sigh coach',      line: 'The microphone measures each exhale while you breathe it out.' },
  { title: 'Chest breathing', line: 'Phone on your chest, eyes closed. The accelerometer counts your breaths.' },
  { title: 'Alertness check', line: 'Sixty seconds of taps show a short night before anything else does.' },
  { title: 'Reach',           line: 'How far from home your readings happened this week. Never shared, never a map.' },
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

const HERO_FACTS = [
  'One stress score a day, from a patch on your arm or from your phone camera.',
  'You decide who else can see it.',
]

export function Overview({ go }) {
  return (
    <main>
      {/* -- the hero -------------------------------------------------------
          `h-`, not `min-h-`, from lg up: min-h lets tall content push the band
          past the fold, which brings the next band's heading into view under
          the title screen. Under lg the two halves stack and are taller than a
          phone, so there the band takes its own height: a fixed one clipped
          the phone and the patch caption at 390. */}
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
              edge: over 1680 the wrap stops short of the viewport, and a tint
              that stopped with it would leave bare paper beside a full-bleed
              band. */}
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

            {/* The one photograph on the hero, under the phone. The owner's
                words, after a wave that put photographs everywhere: "all i
                needed integrated was an image there". So: one, here, and the
                phone stands in front of it. The focal point comes from
                lib/photos.js and the frame grows to keep the faces whole. */}
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
          Every figure on this band is external and sourced. */}
      <Section name="The problem" tone="ink" className="relative isolate overflow-hidden">
        {/* One photograph under the band, held at 22% under ink so the paper
            headline still measures above 7:1 on it. The figures sit on a
            frosted panel: ProblemStats draws itself for a light ground (ink-3
            small print, accent-ink figures), and on the band directly those
            measured 2.49:1 and 1.7:1. The panel is where the numbers are read. */}
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

      {/* -- what it is, and what it is for ---------------------------------
          The owner's own outline: What is MindMap, Why MindMap, what it does.
          Plain words a 14 year old reads once. */}
      <Section name="What is MindMap?" tone="paper">
        <SectionHead>An app that tracks your stress</SectionHead>
        <SectionLede>MindMap helps teenagers track and monitor their stress levels, every day.</SectionLede>
        <dl className="mt-5 grid gap-3.5 md:grid-cols-3">
          {DOES.map(d => (
            <div key={d.title} className="rounded-panel border border-rule bg-card p-5 shadow-card">
              <dt className="font-display text-head font-bold leading-[1.15] tracking-tight text-ink">{d.title}</dt>
              <dd className="m-0 mt-2 text-sec leading-[1.5] text-ink-2">{d.line}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section name="Why MindMap?" tone="card" className="bg-beam-wash">
        <SectionHead>Stress you can see is stress you can act on</SectionHead>
        <SectionLede>Seeing your stress as a number helps you take the right steps, instead of just feeling it.</SectionLede>
        <dl className="mt-5 grid gap-x-10 sm:grid-cols-2">
          {WHY.map(w => (
            <div key={w.title} className="border-t border-rule py-4">
              <dt className="font-display text-head font-bold leading-[1.15] tracking-tight text-ink">{w.title}</dt>
              <dd className="m-0 mt-1.5 text-sec leading-[1.5] text-ink-2">{w.line}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* -- the two ways, and the demo ------------------------------------ */}
      {/* The photographs of teenagers used to be a row of six under the problem
          band. The owner: "placed in different parts of the site, like in a
          gradation, background overlays, not js a row of images". Three of
          them sit under three bands, faded into the band's own ground. */}
      <Section name="Getting started" tone="card" className="relative isolate overflow-hidden bg-accent-wash">
        <Frame wash photo="student-bus"
          alt="Two boys laughing together on a school bus seat, one holding a phone, trees going past the window behind them"
          className="absolute inset-0 -z-20 opacity-[0.28]"/>
        <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-accent-wash via-accent-wash/85 to-accent-wash/35"/>
        <SectionHead>2 ways to use MindMap</SectionHead>
        <SectionLede>With the patch or without it. Both give you the same score and the same app.</SectionLede>
        <div className="mt-5 grid auto-rows-fr gap-3.5 md:grid-cols-2">
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
        {/* The drawing of the patch and where the number comes from each have
            a page. The overview links to them rather than carrying them. */}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button size="sm" onClick={() => go('app')}>Open the app<span aria-hidden>→</span></Button>
          <Button variant="outline" size="sm" onClick={() => { setMode('demo'); go('app-student') }}>Watch the demo<span aria-hidden>→</span></Button>
          <Button variant="outline" size="sm" onClick={() => go('methods')}>How it works<span aria-hidden>→</span></Button>
        </div>
      </Section>

      {/* -- taking a reading ------------------------------------------------ */}
      <Section name="Take a reading" tone="paper">
        <SectionHead>How you take a reading</SectionHead>
        <div className="mt-5 grid gap-3.5 md:grid-cols-2">
          {READING.map(r => (
            <button key={r.title} type="button" onClick={() => go(r.go)}
              className="group flex h-full w-full flex-col rounded-panel border border-rule bg-card p-5
                text-left shadow-card transition-[border-color,box-shadow] duration-200 hoverOnly:border-accent/50 hoverOnly:shadow-raise">
              <span className="font-display text-head font-bold leading-[1.15] tracking-tight text-ink">{r.title}</span>
              <ol className="m-0 mt-3 list-none space-y-2 p-0">
                {r.steps.map((step, i) => (
                  <li key={step} className="flex items-start gap-3 text-sec leading-[1.5] text-ink-2">
                    <span aria-hidden className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-accent-wash font-display text-xs font-bold text-accent">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <span className="mt-auto flex items-center gap-2 pt-4 font-display text-meta font-bold text-accent">
                {r.cta}<ArrowRight className="size-[1.1rem] transition-transform duration-200 groupHoverOnly:translate-x-1.5"/>
              </span>
            </button>
          ))}
        </div>
      </Section>

      {/* -- the toolkit, and the resources inside it ----------------------- */}
      <Section name="Toolkit" tone="card" className="bg-aqua-2">
        <SectionHead>Tools to feel better, inside the app</SectionHead>
        <SectionLede>Breathing, grounding and movement exercises, plus the best free videos and podcasts, so you never have to search elsewhere.</SectionLede>
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


      {/* -- what no other app has ------------------------------------------- */}
      <Section name="Beyond the screen" tone="paper">
        <SectionHead>What other apps do not have</SectionHead>
        <SectionLede>Measurements from sensors your phone and the patch already have. Nothing leaves the device.</SectionLede>
        <dl className="mt-5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {BEYOND.map(b => (
            <div key={b.title} className="rounded-panel border border-rule bg-card p-5 shadow-card">
              <dt className="font-display text-head font-bold leading-[1.15] tracking-tight text-ink">{b.title}</dt>
              <dd className="m-0 mt-2 text-sec leading-[1.5] text-ink-2">{b.line}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={() => go('toolkit')}>Open the Toolkit<span aria-hidden>→</span></Button>
          <Button variant="outline" size="sm" onClick={() => go('methods')}>How each one is measured<span aria-hidden>→</span></Button>
        </div>
      </Section>

      {/* -- the three audiences ------------------------------------------- */}
      <Section name="Who it is for" tone="card" id="screens" className="bg-beam-wash">
        <SectionHead>Who MindMap is for</SectionHead>
        <SectionLede>Three screens, one app. Each person sees only what the student allows.</SectionLede>
        <div className="mt-5 grid auto-rows-fr gap-3.5 lg:grid-cols-3">
          {SCREENS.map((s2, i) => (
            <ScrollRow key={s2.id} index={i} className="h-full">
              <button type="button" onClick={() => go(s2.id)}
                className="group flex h-full w-full flex-col gap-3 overflow-hidden rounded-panel
                  border border-rule bg-card p-5 text-left touch-manipulation
                  transition-[border-color,transform] duration-150 ease-[var(--ease-out)]
                  motion-safe:active:scale-[0.99] hoverOnly:border-accent">
                {/* max-w-none is load-bearing: Tailwind's preflight sets
                    `img { max-width: 100% }`, which clamps this back to the
                    card's content box and undoes the negative-margin bleed.
                    Fixed height and object-cover so three different crops still
                    sit on one line. */}
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

      {/* ── privacy ─────────────────────────────────────────────────────── */}
      <Section name="Privacy" tone="card" className="bg-aqua-2">
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
        <p className="mt-4 text-meta text-ink-2">
          {NOTES}, {LOCATION} and every raw reading never leave the phone.
          <button type="button" onClick={() => go('privacy')}
            className="ml-3 border-b-2 border-accent/35 font-display font-medium text-accent hoverOnly:border-accent hoverOnly:text-accent-ink">
            Who sees what
          </button>
        </p>
      </Section>

      {/* ── the design, and where it comes from ─────────────────────────── */}
      <Section name="Evidence" tone="paper" className="relative isolate overflow-hidden">
        <Frame wash photo="student-game"
          alt="Three teenage boys sitting along a sofa with game controllers, headphones round their necks, one leaning in to argue a point"
          className="absolute inset-0 -z-20 opacity-[0.2]"/>
        <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-paper via-paper/90 to-paper/40"/>
        <SectionHead>Why the app is built this way</SectionHead>
        <SectionLede>Four choices in the design, and the published study behind each.</SectionLede>
        <dl className="mt-5 grid gap-x-10 sm:grid-cols-2">
          {EVIDENCE.map(e => (
            <div key={e.title} className="border-t border-rule py-4">
              <dt className="font-display text-head font-bold leading-[1.15] tracking-tight text-ink">
                {e.title}
              </dt>
              <dd className="m-0 mt-1.5 text-sec leading-[1.5] text-ink-2">{e.line}</dd>
              <dd className="m-0 mt-1.5 text-fine leading-[1.45] text-ink-3">{e.cite}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 max-w-[60ch] text-meta text-ink-3">
          These studies support the design choices. They are not a test of MindMap itself.
        </p>
      </Section>

      {/* ── what comes next ─────────────────────────────────────────────── */}
      <Section name="What comes next" tone="card" className="bg-accent-wash">
        <SectionHead>MindMap for every age</SectionHead>
        <SectionLede>Teens first. The same patch and the same score can serve adults and seniors next.</SectionLede>
        <dl className="mt-5 grid gap-3.5 md:grid-cols-3">
          {FUTURE.map(f => (
            <div key={f.title} className={cn('rounded-panel border p-5', f.now ? 'border-accent/40 bg-card shadow-card' : 'border-rule bg-card/70')}>
              <dt className="flex items-center justify-between font-display text-head font-bold leading-[1.15] tracking-tight text-ink">
                {f.title}
                <span className={cn('font-body text-fine font-semibold', f.now ? 'text-accent-ink' : 'text-ink-3')}>{f.when}</span>
              </dt>
              <dd className="m-0 mt-2 text-sec leading-[1.5] text-ink-2">{f.line}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 max-w-[40ch] font-display text-head font-bold leading-[1.2] tracking-tight text-ink">
          Quantify the stress. Find the resources. Start feeling better.
        </p>
      </Section>

      {/* ── the limits ──────────────────────────────────────────────────── */}
      <Section name="Limits" tone="ink" tight className="relative isolate overflow-hidden">
        <Frame wash photo="friends-steps"
          alt="Two students sitting on concrete steps outside a building, heads together over an open notebook"
          className="absolute inset-0 -z-10 opacity-[0.2]"/>
        <SectionHead tone="ink">What MindMap will never do</SectionHead>
        {/* marker="none": the filled panel is the marker. */}
        <List className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {NEVER.map(t => (
            <Item key={t} marker="none"
              className="rounded-panel bg-ink-2/45 px-4 py-3.5 text-meta leading-[1.4] text-mist">
              {t}
            </Item>
          ))}
        </List>
      </Section>

    </main>
  )
}
