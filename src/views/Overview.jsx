import React from 'react'
import { PHOTOS } from '../lib/photos'
import { Button } from '../ui/button'
import { Section, SectionHead } from '../ui/section'
import { ScrollIn, ScrollRow, RevealLines } from '../ui/motion'
import { ArrowRight, MoveMark, PulseMark, SweatMark, TempMark } from '../ui/marks'
import { IPhone } from '../ui/iphone'
import { PhoneApp } from '../ui/phone-app'
import { PatchFront } from '../charts/patch-front'
import { ProblemStats } from '../charts/problem'
import { WhoSeesWhat } from '../charts/infographics'
import { Card } from '../ui/card'
import { List, Item } from '../ui/list'
import { cn } from '../lib/utils'
/* The site's vocabulary. Nothing here invents a second name for any of it. */
import {
  SCORE, SCORE_RANGE, NOTES, LOCATION, PRO, PRO_LC,
  CONSENT_SHORT, CONSENT_OFF, CASELOAD_TITLE,
} from '../lib/terms'

/* This page is a landing page and nothing else, and it is read by a judge with
 * forty entries to score. It is therefore built as an instrument panel rather
 * than a portfolio: five bands, every one of them at least two columns from
 * 1280 up, every figure and every line of body copy inside a container with a
 * visible edge. docs/design-spec.md is the contract and sections 0 to 6 of it
 * are what the shape below is answering.
 *
 * What changed from the draft this wave inherited, and why:
 *   - The hero's composite panel placed its three cells by auto-flow, and the
 *     cell that spans two rows could not fit beside the one before it, so the
 *     browser opened a third row and left 480 x 485px of empty tint in the
 *     bottom right. Measured, that hole was a fifth of the hero. Every cell is
 *     now placed by an explicit column and row, so the panel cannot grow a row
 *     it was not given.
 *   - The hero's copy column held five objects in 801px and read as air. It
 *     now carries two actions rather than one and a readout card that states
 *     the two figures and, where there is room for it, the three steps of a
 *     day. No band on this page is a single idea in a large size any more.
 *   - "Three ways to start" and "Who it is for" were two bands of three cards
 *     with one line each: 882px for about sixty words. They are one band now,
 *     and every one of the six cards carries a third true line, so the same
 *     height holds roughly twice the information.
 *
 * Padding is `py-5 lg:py-7`, which is what Section's `tight` sets; spec 1 caps
 * vertical padding at `py-10 lg:py-14` and four of the five bands come through
 * Section, so matching them is both denser than the cap and one rhythm.
 *
 * No text is ever set over a photograph, so the measured contrast of every
 * word on this page is a known pair of hex values rather than whatever pixel
 * happens to be behind it.
 */

/* Intrinsic size per key, so the browser holds the box before the file lands.
   Same numbers charts/people.jsx keeps for the frames it owns. */
const DIMS = {
  'clinic-talk':        [1600, 1066],
  'friends-steps':      [1418, 1125],
  'parent-card':        [1200, 423],
  'parent-kitchen':     [1067, 1600],
  'parent-laptop':      [1600, 1066],
  'school-card':        [1200, 423],
  'student-basketball': [1600, 1066],
  'student-bus':        [1600, 1067],
  'student-card':       [1200, 423],
  'student-controller': [1600, 1067],
  'student-game':       [1600, 1066],
  'student-homework':   [1592, 1194],
  'students-hallway':   [1600, 1068],
}

/* Every frame is a licensed stock photograph of models. Nobody in one uses
 * MindMap, nobody is wearing the patch, and no alt text here may say or imply
 * otherwise: each one names what is in the frame and stops. The page prints
 * that out loud once, in small print, in the problem column.
 *
 * max-w-none is load-bearing: Tailwind's preflight sets img { max-width: 100% }
 * and that undoes a frame set to fill a box wider than its own file. */
function Frame({ photo, alt, className, eager = false }) {
  const src = PHOTOS[photo]
  if (!src || !alt) return null
  const [w, h] = DIMS[photo] || [1600, 1066]
  return (
    <img src={src} alt={alt} width={w} height={h}
      loading={eager ? 'eager' : 'lazy'} decoding="async"
      className={cn('block h-full w-full max-w-none object-cover', className)}/>
  )
}

/* The first six frames in document order are eager. A judge scrolling fast
   was reaching card tops that were still empty white boxes, which is half of
   what the blank-space complaint was about. */
const EAGER = new Set([
  'student-controller', 'clinic-talk', 'students-hallway', 'parent-kitchen',
  'student-bus', 'student-basketball',
])

/* The four signals, named once, beside the drawing of the thing that reads
   them. The hero used to name them in a caption under the drawing and the
   patch page names them again; this is the same four words in the same order
   as src/lib/terms.js vocabulary allows. */
const SIGNALS = [
  ['Pulse', PulseMark],
  ['Sweat', SweatMark],
  ['Temperature', TempMark],
  ['Movement', MoveMark],
]

/* What the phone in the hero is cycling through, in the order ui/phone-app.jsx
   cycles it. The drawing moves; a judge who looks away for four seconds sees
   one of three screens and no label, so the three are named beside it. */
const BEATS = ['Reading', SCORE, 'The week']

/* A day, in three steps, each one three words. It is the plainest true thing
   this page can say about what using MindMap is, and it is the thing a judge
   who reads nothing else should still come away with. */
const DAY = [
  ['1', 'Take a reading'],
  ['2', `Read the ${SCORE}`],
  ['3', 'See what changed'],
]

/* The problem column's frames, at three heights on purpose. Equal heights in a
   column read as the same photograph bar the owner rejected, turned sideways. */
const PROBLEM_FRAMES = [
  { photo:'students-hallway', h:'h-[136px] lg:h-[146px]',
    alt:'Four high school students walking along a bright corridor with folders and backpacks, talking as they go' },
  { photo:'parent-kitchen', h:'h-[176px] lg:h-[196px]',
    alt:'A mother and her teenage son chopping vegetables side by side at a kitchen counter' },
]

/* `lead` is the phone route: the only one a stranger can use in the next
 * minute, so it is the card that gets the width and the accent rule.
 * `gets` is the line the draft did not have. A card that says only "Wear the
 * patch" and "Needs the patch" has told a judge nothing they could not guess,
 * which is the whole of the babyish complaint in one card. */
const DOORS = [
  { id:'phone', go:'without-patch', title:'Use your phone', note:'No patch needed', lead:true,
    gets:'45 seconds on the camera, or six questions instead',
    photo:'student-bus',
    alt:'Two boys laughing together on a school bus seat, one holding a phone',
    art:(
      <svg viewBox="0 0 220 120" className="h-[38px] w-auto" aria-hidden focusable="false">
        <rect x="74" y="3" width="72" height="114" rx="12" className="fill-card stroke-ink" strokeWidth="2"/>
        <rect x="86" y="19" width="48" height="48" rx="8" className="fill-ink"/>
        <circle cx="102" cy="39" r="8" className="fill-accent"/>
        <circle cx="122" cy="39" r="5" className="fill-beam"/>
        <path d="M84 91 q10 -16 20 0 t20 0 t12 -6" fill="none" stroke="#a8321f"
          strokeWidth="2.4" strokeLinecap="round"/>
      </svg>) },
  { id:'patch', go:'patch', title:'Wear the patch', note:'Needs the patch',
    gets:'Pulse, sweat, temperature and movement, read together',
    photo:'student-basketball',
    alt:'A teenage boy dribbling a basketball past a defender on an outdoor court under a cloudy sky',
    art:(
      <svg viewBox="0 0 220 120" className="h-[38px] w-auto" aria-hidden focusable="false">
        <rect x="7" y="23" width="206" height="74" rx="37" className="fill-card stroke-ink" strokeWidth="2"/>
        <rect x="56" y="33" width="108" height="54" rx="22" className="fill-mist stroke-ink" strokeWidth="1.6"/>
        <circle cx="110" cy="60" r="14" fill="none" className="stroke-ink-3" strokeWidth="1.6"/>
        <circle cx="110" cy="60" r="4.5" className="fill-accent"/>
      </svg>) },
  { id:'demo', go:'app', title:'Try the demo', note:'No reading taken',
    gets:'A worked day of measurements, already filled in',
    photo:'student-game',
    alt:'Three teenage boys sitting along a sofa with game controllers, headphones round their necks',
    art:(
      <svg viewBox="0 0 220 120" className="h-[38px] w-auto" aria-hidden focusable="false">
        <rect x="18" y="13" width="184" height="94" rx="10" fill="none" className="stroke-ruling"
          strokeWidth="2" strokeDasharray="7 6"/>
        <path d="M42 83 L74 57 L104 69 L136 35 L178 47" fill="none" className="stroke-accent"
          strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="178" cy="47" r="5.5" className="fill-beam"/>
      </svg>) },
]

/* `fact` is the second true line each of these cards now carries. The three
   facts are the consent model stated from each side of it, which is the one
   thing about this product a judge has to understand and cannot guess. */
const SCREENS = [
  { id:'student', who:'Student', photo:'student-card',
    alt:'Five teenagers walking home together through a park',
    title:`Your ${SCORE} today, and what moved it`,
    fact:'Four tabs: Today, Reading, Toolkit, Sharing',
    cta:'What a student gets' },
  { id:'parent',  who:'Parent', photo:'parent-card',
    alt:'A mother and her teenage son looking at something together at home',
    title:'One sentence a week',
    fact:`Never a raw reading, never ${NOTES}, never ${LOCATION}`,
    cta:'What a parent gets' },
  { id:'pro',     who:PRO, photo:'school-card',
    alt:`A ${PRO_LC} and a student talking on a sofa`,
    title:CASELOAD_TITLE,
    fact:'Only what the student agreed to share, and never a group under five',
    cta:`What a ${PRO_LC} gets` },
]

/* Four decisions, each traceable to a published finding. The findings used to
 * be set as paragraphs; what carries the weight is the number and the citation
 * under it, so the prose is gone and those stayed. */
const EVIDENCE = [
  { title:'The mark on the dial',
    line:'Alarm at a near normal result fell from about half to about a third.',
    cite:'Zikmund-Fisher et al., J Med Internet Res, 2018. 1,618 adults.' },
  { title:'Nobody is ranked',
    line:'Being judged by other people was the biggest single driver.',
    cite:'Dickerson & Kemeny, Psychological Bulletin, 2004. 208 studies. d = 0.67 against 0.15.' },
  { title:'You decide what is shared',
    line:'A stressor you cannot control raised cortisol three times as much.',
    cite:'Dickerson & Kemeny, 2004. d = 0.52 against 0.16.' },
  { title:'Plain words, measured',
    line:'Below grade 5 on Flesch-Kincaid, about grade 7 on SMOG.',
    cite:'Measured on the prose of all 13 pages. tools/readability.' },
]

const TRUST = [
  { title:'The student sees it first',
    line:'Before anybody else has anything.' },
  { title:'Nothing is shared by default',
    line:CONSENT_SHORT },
  { title:'Never shared with anyone',
    line:`${NOTES}, ${LOCATION}, and every raw reading.` },
  { title:'Sharing switches off',
    line:CONSENT_OFF },
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

/* Containers, per spec 2. Two grounds, because the ink band needs its own. */
const PANEL = 'overflow-hidden rounded-panel border border-rule bg-card'
const PANEL_INK = 'overflow-hidden rounded-panel border border-ink-2 bg-ink-2/40'

/* IPhone takes a number, not a class, so this drawing cannot be sized by the
 * box it sits in, and the box is the thing that varies: the hero is exactly
 * one viewport tall, so a 1280 x 1050 desktop and a 375 x 667 phone leave it
 * amounts 500px apart. One fixed size for all of them left the cell two thirds
 * empty at the top of that range and clipped the drawing at the bottom of it,
 * and a ladder of breakpoints cannot see viewport height at all.
 *
 * So the cell is measured. Its own box, less its padding and less whatever
 * else it holds, is what the drawing may fill; 872 is the 15 Pro's height in
 * points plus its bezel, which is what scale 1 means to ui/iphone.jsx. The
 * panel carries min-h-0 and its rows are minmax(0,1fr), so the cell's height
 * never follows its contents and this cannot feed back on itself.
 *
 * A ResizeObserver, not an IntersectionObserver: the arrival watchers in
 * ui/motion.jsx are the ones that `overflow-x: clip` breaks, and this is not
 * one of them. floor, not round, because a rounded-up hundredth is up to nine
 * pixels of phone that the hero would clip. */
const PHONE_POINTS = 872

function usePhoneScale(ref) {
  const [scale, setScale] = React.useState(0.3)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver !== 'function') return
    const fit = () => {
      const style = getComputedStyle(el)
      const gap = parseFloat(style.rowGap) || 0
      /* Child 0 is the drawing. Everything after it is what the drawing has
         to leave room for, each one plus the gap above it. */
      let taken = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
      for (let i = 1; i < el.children.length; i++) {
        taken += el.children[i].getBoundingClientRect().height + gap
      }
      /* Below 1280 the drawing takes its width out of the photograph beside it
         rather than out of empty tint, so it is capped narrower there. */
      const cap = innerWidth >= 1280 ? 0.8 : innerWidth >= 1024 ? 0.56 : 0.44
      const room = el.clientHeight - taken
      const next = Math.max(0.12, Math.min(cap, Math.floor(room / PHONE_POINTS * 100) / 100))
      setScale(prev => (Math.abs(prev - next) < 0.005 ? prev : next))
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(el)
    addEventListener('resize', fit)
    return () => { observer.disconnect(); removeEventListener('resize', fit) }
  }, [ref])
  return scale
}

/* A labelled rule, for the second row of a band whose heading belongs to the
   first. Cheaper than a second heading and it still reads as a divider. */
function RowLabel({ children, className }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <h3 className="font-display text-row font-bold leading-tight tracking-tight text-ink">
        {children}
      </h3>
      <span aria-hidden className="h-px flex-1 bg-rule"/>
    </div>
  )
}

export function Overview({ go }) {
  const phoneCell = React.useRef(null)
  const phone = usePhoneScale(phoneCell)
  return (
    <main>
      {/* -- the hero -------------------------------------------------------
          `h-`, not `min-h-`: min-h lets tall content push the band past the
          fold, which brings the next band's heading into view under the title
          screen. At 1280 x 720 the viewport is the smaller of the two, so on a
          laptop the band is still exactly one screen.

          Two tracks, not three. The three objects on the right are one panel:
          `gap-px` over `bg-rule` makes the hairline between them the panel's
          own rule, so they read as a composition instead of as three tiles
          with paper showing between them. */}
      <section id="hero" className="relative isolate flex h-[calc(100svh-58px)] flex-col
        overflow-hidden border-t border-rule bg-paper">

        {/* min-h-0: without it this flex item cannot shrink under its own
            content, so on a 667px phone the panel kept its natural height, the
            band ran 180px past the fold and the hero clipped the drawing
            rather than sizing it. */}
        <div className="wrap relative z-10 flex min-h-0 flex-1 flex-col gap-4 py-4
          lg:grid lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-6 lg:py-5
          xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">

          <div className="flex min-h-0 flex-col justify-center lg:py-0">
            <ScrollIn as="p" className="font-mono text-ui font-bold
              tracking-[0.005em] text-accent">
              MindMap, a wellness app for teenagers
            </ScrollIn>
            {/* No balanced wrapping: it moves the break mid-phrase. Leading is
                1.06, not 1.02, where the descenders of "Making your stress"
                landed in the cap height of "readable". */}
            <h1 className="mt-3 max-w-[19ch] font-display text-view font-medium leading-[1.06]
              tracking-tight text-ink lg:text-major">
              Making your stress <span className="text-accent">readable</span>.
            </h1>
            <ScrollIn as="p" className="mt-3 max-w-[30ch] text-sec font-medium leading-[1.35] text-ink">
              One {SCORE} a day. One sentence saying what changed.
            </ScrollIn>
            {/* Two actions, not one. The second is the route a judge checking
                the working wants and it was previously only reachable five
                bands down the page. */}
            <ScrollIn className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 sm:gap-x-6">
              <Button onClick={() => go('app')}>Open the app<span aria-hidden>→</span></Button>
              {/* sm and up. The two actions measure 406px side by side and a
                  390px phone has 334px of column, so below sm the second one
                  took a row of its own and cost the panel under it 58px. The
                  header's own nav carries this route at every width, and so
                  does the evidence band. */}
              <Button variant="ghost" size="sm" onClick={() => go('methods')}
                className="hidden sm:inline-flex">
                How it works
                <ArrowRight className="size-[1.05rem]"/>
              </Button>
            </ScrollIn>
            {/* The region that used to be blank. Two figures that are already
                on this site, each with its label beside it rather than under
                it, which is what spec 3 asks of a number that carries weight. */}
            <ScrollIn className={cn(PANEL, 'mt-5 lg:mt-6')}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 p-3.5">
                  <span className="font-mono text-row font-bold tabular-nums leading-none text-accent">
                    {SCORE_RANGE}
                  </span>
                  <span className="text-fine text-ink-2">{SCORE}, against your own normal</span>
                </div>
                {/* The rule moves with the wrap: a top rule when the two
                    figures are stacked, a left rule when they sit side by
                    side, so there is never a doubled edge or a missing one. */}
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 border-t border-rule
                  p-3.5 sm:border-l sm:border-t-0 lg:border-l-0 lg:border-t xl:border-l xl:border-t-0">
                  <span className="font-mono text-row font-bold tabular-nums leading-none text-accent">
                    45
                  </span>
                  <span className="text-fine text-ink-2">seconds, a reading off the camera</span>
                </div>
              </div>
              {/* lg and up only. Below it the hero is already a screen of copy
                  plus the phone, and three more rows would push the button
                  under the fold on a 844px phone. The same three steps are the
                  three cards in the band under this one.

                  Rows, not three columns: in a 416px column three cells set
                  every step on two lines and the strip read as a caption. */}
              <ol className="m-0 hidden list-none p-0 lg:block">
                {DAY.map(([n, step]) => (
                  <li key={n} className="flex items-center gap-2.5 border-t border-rule px-3.5 py-2">
                    <span aria-hidden className="grid size-5 shrink-0 place-items-center rounded-chip
                      bg-accent font-mono text-fine font-bold leading-none text-paper">
                      {n}
                    </span>
                    <span className="min-w-0 text-meta leading-[1.3] text-ink-2">{step}</span>
                  </li>
                ))}
              </ol>
              {/* The one promise this product turns on, in the one place a
                  judge is certain to read. The privacy band states it in full
                  further down; this is the same sentence from src/lib/terms.js
                  and not a second wording of it. lg and up with the steps,
                  and for the same reason. */}
              <p className="hidden border-t border-rule px-3.5 py-2 text-fine leading-[1.4]
                text-ink-3 lg:block">
                {CONSENT_SHORT}
              </p>
            </ScrollIn>
          </div>

          {/* One object. Every cell is placed by an explicit column and row
              from lg up: left to auto-flow, the phone's two-row span could not
              start beside the cell before it, so the browser opened a third
              row and the panel carried a 480 x 485px hole. The patch strip
              takes the whole bottom edge rather than sitting under the
              photograph: in the left column alone it was 83px wide at 1024 and
              clipped its own labels. Below lg the photograph cell is dropped,
              because the band is already a screen of copy plus two drawings
              and a third would push the button under the fold. */}
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-px rounded-panel border border-rule
            bg-rule lg:grid-cols-[minmax(0,1fr)_auto] lg:grid-rows-[minmax(0,1fr)_auto]">

            <div className="relative col-span-2 hidden overflow-hidden rounded-tl-panel bg-card
              lg:col-span-1 lg:col-start-1 lg:row-start-1 lg:block">
              <Frame photo="student-controller" eager={EAGER.has('student-controller')}
                alt="A teenager in a red T shirt sitting in an armchair with headphones on, holding a games controller"
                className="absolute inset-0 object-[60%_28%]"/>
            </div>

            {/* The drawing and the four signal names are one cell: the caption
                that used to sit under the drawing said the same four words in
                a line of its own. */}
            {/* lg and up. On a phone the hero is a screen of copy and one
                object, and at 390 this cell plus the phone needed 335px of a
                215px panel: both were cut off at the fold. The four signals
                are named on the patch card in the band below, which every
                width gets, so nothing here is only here. */}
            <div className="hidden flex-col items-center justify-center gap-4 overflow-hidden
              bg-accent-wash px-3 py-4 lg:col-span-2 lg:col-start-1 lg:row-start-2 lg:flex
              lg:flex-row lg:gap-6 lg:rounded-b-panel lg:px-6 lg:py-3.5">
              <PatchFront className="w-[150px] shrink-0 sm:w-[180px] lg:w-[92px] xl:w-[100px]"/>
              {/* The strip runs the whole width of the panel, so from lg the
                  label holds the left of it and the four signals the right,
                  rather than the three sitting together in the middle with a
                  third of the strip empty beside them. */}
              <div className="min-w-0 lg:flex lg:flex-1 lg:items-center lg:justify-between lg:gap-6">
                <p className="font-display text-ui font-bold leading-tight text-ink">The patch</p>
                {/* A wrapping row, not a two column grid. On a grid the two
                    tracks are equal, the longest of the four words is
                    Temperature, and at 1280 that track came out 10px short of
                    it: the word ran out through its own pill. Each chip sizes
                    to its own word here, and the row wraps where it must. */}
                <ul className="m-0 mt-2 flex list-none flex-wrap gap-1.5 p-0 lg:mt-0
                  lg:justify-end">
                  {SIGNALS.map(([name, Mark]) => (
                    <li key={name}
                      className="flex items-center gap-1.5 whitespace-nowrap rounded-chip border
                        border-rule bg-card px-2 py-1">
                      <Mark aria-hidden className="size-3.5 shrink-0 text-beam-ink"/>
                      <span className="text-fine leading-none text-ink-2">{name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* The phone, and under it the three screens it is cycling
                through. The drawing moves on a four second beat, so without
                the three names a judge sees one screen and cannot tell there
                are three. */}
            <div ref={phoneCell} className="col-span-2 flex flex-col items-center justify-center
              gap-3 overflow-hidden rounded-panel bg-beam-wash px-3 py-4 lg:col-span-1
              lg:col-start-2 lg:row-start-1 lg:rounded-bl-none lg:rounded-br-none
              lg:rounded-tl-none lg:px-4">
              <IPhone model="15-pro" scale={phone} screenBg="#f5fafa"
                label={`The MindMap app, cycling through a reading, the ${SCORE} it returns and the week it lands in`}
                className="shrink-0">
                <PhoneApp/>
              </IPhone>
              <ul aria-hidden className="m-0 flex w-full list-none flex-wrap justify-center gap-1.5
                p-0">
                {BEATS.map(b => (
                  <li key={b} className="rounded-chip border border-rule bg-card px-2 py-1 text-fine
                    leading-none text-ink-2">
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* -- the dark chapter -----------------------------------------------
          The heading sits on the band, which spec 2 allows it to. Everything
          else here is in a container: the frames, the small print, and the
          national figures. Every figure in ProblemStats is external and
          sourced; the rules for them live in charts/problem.jsx and are not
          this page's to bend. */}
      <section id="problem" className="border-t border-rule bg-ink">
        <div className="wrap py-5 lg:py-7">
          {/* The heading is the one thing spec 2 lets sit on the band, so it
              takes the full width and wraps in two lines instead of five in a
              17rem column, which was 76px of band height spent on a ragged
              left edge. */}
          <p className="font-mono text-ui font-bold tracking-[0.005em] text-accent-lit">
            Who this is about
          </p>
          <RevealLines as="h2"
            lines={['Most teenagers who are struggling', 'are not being reached.']}
            className="mt-2 max-w-[30ch] font-display text-sub font-bold leading-[1.12]
              tracking-tight text-paper"/>

          <div className="mt-3 grid gap-3 lg:mt-4 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:gap-4">
            <div className="flex flex-col gap-3 lg:gap-4">
              <ScrollIn className={PANEL_INK}>
                <div className="h-[186px] overflow-hidden lg:h-[200px]">
                  <Frame photo="clinic-talk" eager={EAGER.has('clinic-talk')}
                    alt={`A teenage boy talking with a ${PRO_LC} on a sofa by a sunlit window`}/>
                </div>
                {/* The one place the page says what the photographs are. */}
                <p className="px-3.5 pb-3.5 pt-3 text-fine text-ruling">
                  Stock photographs of models. Nobody shown uses MindMap.
                </p>
              </ScrollIn>

              {PROBLEM_FRAMES.map((f, i) => (
                <ScrollRow key={f.photo} index={i} className={cn(PANEL_INK, f.h)}>
                  <Frame photo={f.photo} alt={f.alt} eager={EAGER.has(f.photo)}/>
                </ScrollRow>
              ))}
            </div>

            <ScrollIn className={cn(PANEL_INK, 'p-4')}>
              <ProblemStats/>
            </ScrollIn>
          </div>
        </div>
      </section>

      {/* -- getting in, and who it is for -----------------------------------
          One band, two rows of three. They were two bands, and between them
          they spent 882px and two section headings on six cards carrying one
          line each. The heading belongs to the first row and the ruled label
          introduces the second, which is one heading's worth of height back
          and no information lost.

          The first row is three unequal tracks on purpose: an even three up
          would say the three routes are equal, and the phone is the only one a
          stranger can use in the next minute. */}
      <Section name="Getting started" tone="card" id="screens" className="bg-accent-wash" tight>
        <SectionHead>Three Ways to Start</SectionHead>
        <div className="mt-3 grid auto-rows-fr gap-3 lg:gap-4
          lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)]">
          {DOORS.map((d, i) => (
            <ScrollRow key={d.id} index={i} className="h-full">
              <Card interactive as="button" type="button" onClick={() => go(d.go)}
                className={cn('flex h-full flex-col p-0', d.lead && 'border-l-accent')}>
                <span className={cn('relative block w-full overflow-hidden',
                  d.lead ? 'h-[140px] lg:h-[152px]' : 'h-[114px] lg:h-[124px]')}>
                  <Frame photo={d.photo} alt={d.alt} eager={EAGER.has(d.photo)}
                    className="absolute inset-0"/>
                </span>
                {/* The drawing rides up over the foot of the photograph: the
                    card is one object rather than a picture with a panel
                    bolted under it. */}
                <span aria-hidden
                  className="relative z-10 -mt-6 ml-4 grid w-fit place-items-center rounded-panel
                    border border-rule bg-card px-2.5 py-1.5">
                  {d.art}
                </span>
                <span className="mt-2.5 block px-4 font-display text-row font-bold leading-tight text-ink">
                  {d.title}
                </span>
                <span className="mt-1 block px-4 text-meta leading-[1.35] text-ink-2">
                  {d.gets}
                </span>
                <span className="mt-auto flex items-center gap-2 px-4 pb-4 pt-3 font-display text-meta
                  font-bold text-accent">
                  {d.note}
                  <ArrowRight className="size-[1.05rem] transition-transform duration-200
                    groupHoverOnly:translate-x-1.5"/>
                </span>
              </Card>
            </ScrollRow>
          ))}
        </div>

        <RowLabel className="mt-5 lg:mt-6">Who It Is For</RowLabel>
        <div className="mt-3 grid auto-rows-fr gap-3 lg:grid-cols-3 lg:gap-4">
          {SCREENS.map((s2, i) => (
            <ScrollRow key={s2.id} index={i} className="h-full">
              <button type="button" onClick={() => go(s2.id)}
                className="group flex h-full w-full flex-col overflow-hidden rounded-panel
                  border border-rule bg-card text-left touch-manipulation
                  transition-[border-color,transform] duration-150 ease-[var(--ease-out)]
                  motion-safe:active:scale-[0.99] hoverOnly:border-accent">
                <span className="relative block h-[114px] w-full overflow-hidden lg:h-[124px]">
                  <Frame photo={s2.photo} alt={s2.alt}
                    className="absolute inset-0 motion-safe:transition-transform
                      motion-safe:duration-[260ms] motion-safe:ease-[var(--ease-out)]
                      motion-safe:groupHoverOnly:scale-[1.02]"/>
                </span>
                <span className="mt-3 block px-4 font-mono text-fine font-bold tracking-[0.005em] text-accent">
                  {s2.who}
                </span>
                <span className="mt-1 block px-4 font-display text-row font-bold leading-[1.15]
                  tracking-tight text-ink">
                  {s2.title}
                </span>
                <span className="mt-1 block px-4 text-meta leading-[1.35] text-ink-2">
                  {s2.fact}
                </span>
                <span className="mt-auto flex items-center gap-2.5 px-4 pb-4 pt-3 font-display text-meta
                  font-bold text-accent groupHoverOnly:text-accent-ink">
                  {s2.cta}
                  <ArrowRight className="size-[1.05rem] transition-transform duration-200
                    groupHoverOnly:translate-x-1.5"/>
                </span>
              </button>
            </ScrollRow>
          ))}
        </div>
      </Section>

      {/* -- privacy ---------------------------------------------------------
          The four promises used to be four hairline rows on the tint. They are
          one card now, with the photograph as its top edge, against the figure
          that proves them. */}
      <Section name="Privacy" tone="card" className="bg-aqua-2" tight>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-4">
          <div>
            <SectionHead>Student Privacy</SectionHead>
            <ScrollIn className={cn(PANEL, 'mt-3')}>
              <div className="h-[118px] overflow-hidden lg:h-[126px]">
                <Frame photo="parent-laptop"
                  alt="A mother and her teenage son sitting together at a dining table, both looking at an open laptop"/>
              </div>
              {TRUST.map(t => (
                <div key={t.title} className="border-t border-rule px-3.5 py-2">
                  <h3 className="font-display text-ui font-bold leading-tight text-ink">{t.title}</h3>
                  <p className="mt-0.5 text-meta leading-[1.4] text-ink-2">{t.line}</p>
                </div>
              ))}
            </ScrollIn>
          </div>
          <WhoSeesWhat/>
        </div>
      </Section>

      {/* -- the research, and the limits ------------------------------------
          Two sections merged into one band. They were 646px of two headings,
          two sets of padding and two single-column grids; the limits are a
          promise about the same design decisions the cards beside them cite,
          and this leaves the page with exactly one ink band. */}
      <Section name="Evidence" tone="paper" tight>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,19rem)] lg:gap-4">
          <div>
            {/* The link rides the heading line. As its own row under the cards
                it was 60px of band height carrying one link. */}
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
              <SectionHead>Designed From the Research</SectionHead>
              <Button variant="ghost" size="sm" onClick={() => go('methods')}>
                How the {SCORE} is computed
                <ArrowRight className="size-[1.05rem]"/>
              </Button>
            </div>
            <div className="mt-3 grid auto-rows-fr gap-3 sm:grid-cols-2 lg:gap-4">
              {EVIDENCE.map((e, i) => (
                <ScrollRow key={e.title} index={i} className="h-full">
                  <div className={cn(PANEL, 'flex h-full flex-col p-3.5')}>
                    <h3 className="font-display text-ui font-bold leading-tight text-ink">{e.title}</h3>
                    <p className="mt-1 text-meta leading-[1.4] text-ink-2">{e.line}</p>
                    <p className="mt-auto pt-2.5 font-mono text-fine leading-[1.4] text-ink-3">{e.cite}</p>
                  </div>
                </ScrollRow>
              ))}
            </div>
          </div>

          <ScrollIn className={cn(PANEL, 'p-4')}>
            <h3 className="font-display text-row font-bold leading-tight text-ink">
              What MindMap will never do
            </h3>
            {/* marker="none": the rule on each row is the marker. */}
            <List className="mt-2.5 gap-0">
              {NEVER.map(t => (
                <Item key={t} marker="none"
                  className="border-t border-rule py-2 text-meta leading-[1.4] text-ink-2">
                  {t}
                </Item>
              ))}
            </List>
            {/* The honesty line belongs with the promises, and inside a
                container, rather than as small print on the band. */}
            <p className="mt-3 border-t border-rule pt-3 text-fine text-ink-3">
              Not tested on anyone. No claim that it lowers stress.
            </p>
          </ScrollIn>
        </div>
      </Section>

    </main>
  )
}
