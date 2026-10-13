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
 * forty entries to score. Five bands, every one of them at least two columns
 * from 1280 up, every figure and every line of body copy inside a container
 * with a visible edge. docs/design-spec.md is the contract; section 0b of it
 * is what this wave is answering.
 *
 * What 0b says we did not have, and what the shape below does about it:
 *
 *   - "One big confident image or render per hero, a saturated ground, and
 *     floating cards layered over it." The hero's ground is now the brand
 *     teal rather than paper, one photograph runs the full height of the band
 *     and bleeds off its right edge, and three objects float over that at
 *     three depths: the copy panel, the patch card and the phone. It used to
 *     be a pale band holding three tiles of equal weight in a bordered grid.
 *
 *   - "It is all monotonous in color." Five bands now carry five grounds:
 *     accent, ink, sun-wash, sky-wash, lilac-wash. The six hues in
 *     tailwind.config.js each carry exactly one meaning on this page, and no
 *     hue carries a meaning on its own: every tile that is coloured also says
 *     in words what it is. Routes are coral, mint and sun; audiences are sky,
 *     blush and lilac.
 *
 *   - "All diagram and no realism." Thirteen photographs at six scales, from a
 *     148px strip the width of a column to the full height of the hero.
 *     Every card that carries a route or an audience is led by a frame of a
 *     person rather than by a drawing alone, and the drawing rides beside it.
 *
 * What did not change: the sourced statistics, the vocabulary, the three
 * click path to the app, the density, and the rule that no word on this page
 * is ever set over a photograph. Every text node's background is a known hex.
 */

/* Intrinsic size per key, so the browser holds the box before the file lands.
   Same numbers charts/people.jsx keeps for the frames it owns. */
const DIMS = {
  'clinic-talk':        [1600, 1066],
  'friends-steps':      [1418, 1125],
  'parent-hero':        [1344, 752],
  'parent-kitchen':     [1067, 1600],
  'parent-laptop':      [1600, 1066],
  'pro-hero':           [1344, 752],
  'school-card':        [1200, 423],
  'student-basketball': [1600, 1066],
  'student-bus':        [1600, 1067],
  'student-card':       [1200, 423],
  'student-controller': [1600, 1067],
  'student-game':       [1600, 1066],
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
  'students-hallway', 'clinic-talk', 'student-controller', 'parent-kitchen',
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
  { photo:'student-controller', h:'h-[150px]',
    alt:'A teenager in a red T shirt sitting in an armchair with headphones on, holding a games controller' },
  { photo:'parent-kitchen', h:'h-[160px] lg:h-[166px]',
    alt:'A mother and her teenage son chopping vegetables side by side at a kitchen counter' },
]

/* `lead` is the phone route: the only one a stranger can use in the next
 * minute, so it is the card that gets the width and the accent rule.
 * `gets` is the line that stops a card saying only "Wear the patch" and
 * "Needs the patch", which has told a judge nothing they could not guess.
 * `hue` is this card's colour, and it is spelled out rather than built from
 * the id because Tailwind reads this file as text. Each route owns one hue
 * and the chip the hue paints also carries the words, so the colour is never
 * the only thing saying what the card is. */
const DOORS = [
  { id:'phone', go:'without-patch', title:'Use your phone', note:'No patch needed', lead:true,
    gets:'45 seconds on the camera, or six questions instead',
    chip:'bg-coral-wash text-coral-ink', badge:'bg-coral-wash',
    photo:'student-bus',
    alt:'Two boys laughing together on a school bus seat, one holding a phone',
    art:(
      <svg viewBox="0 0 220 120" className="h-[34px] w-auto" aria-hidden focusable="false">
        <rect x="74" y="3" width="72" height="114" rx="12" className="fill-card stroke-ink" strokeWidth="2"/>
        <rect x="86" y="19" width="48" height="48" rx="8" className="fill-ink"/>
        <circle cx="102" cy="39" r="8" className="fill-accent"/>
        <circle cx="122" cy="39" r="5" className="fill-beam"/>
        <path d="M84 91 q10 -16 20 0 t20 0 t12 -6" fill="none" stroke="#a8321f"
          strokeWidth="2.4" strokeLinecap="round"/>
      </svg>) },
  { id:'patch', go:'patch', title:'Wear the patch', note:'Needs the patch',
    gets:'Pulse, sweat, temperature and movement, read together',
    chip:'bg-mint-wash text-mint-ink', badge:'bg-mint-wash',
    photo:'student-basketball',
    alt:'A teenage boy dribbling a basketball past a defender on an outdoor court under a cloudy sky',
    art:(
      <svg viewBox="0 0 220 120" className="h-[34px] w-auto" aria-hidden focusable="false">
        <rect x="7" y="23" width="206" height="74" rx="37" className="fill-card stroke-ink" strokeWidth="2"/>
        <rect x="56" y="33" width="108" height="54" rx="22" className="fill-mist stroke-ink" strokeWidth="1.6"/>
        <circle cx="110" cy="60" r="14" fill="none" className="stroke-ink-3" strokeWidth="1.6"/>
        <circle cx="110" cy="60" r="4.5" className="fill-accent"/>
      </svg>) },
  { id:'demo', go:'app', title:'Try the demo', note:'No reading taken',
    gets:'A worked day of measurements, already filled in',
    chip:'bg-sun-wash text-sun-ink', badge:'bg-sun-wash',
    photo:'student-game',
    alt:'Three teenage boys sitting along a sofa with game controllers, headphones round their necks',
    art:(
      <svg viewBox="0 0 220 120" className="h-[34px] w-auto" aria-hidden focusable="false">
        <rect x="18" y="13" width="184" height="94" rx="10" fill="none" className="stroke-ruling"
          strokeWidth="2" strokeDasharray="7 6"/>
        <path d="M42 83 L74 57 L104 69 L136 35 L178 47" fill="none" className="stroke-accent"
          strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="178" cy="47" r="5.5" className="fill-beam"/>
      </svg>) },
]

/* `fact` is the second true line each of these cards carries. The three facts
   are the consent model stated from each side of it, which is the one thing
   about this product a judge has to understand and cannot guess. The three
   hues are the three audiences and they are the same three everywhere a
   reader meets them on this page. */
const SCREENS = [
  { id:'student', who:'Student', photo:'friends-steps',
    chip:'bg-sky-wash text-sky-ink',
    alt:'Two students sitting on concrete steps outside a building, heads together over an open notebook',
    title:`Your ${SCORE} today, and what moved it`,
    fact:'Four tabs: Today, Reading, Toolkit, Sharing',
    cta:'What a student gets' },
  { id:'parent',  who:'Parent', photo:'parent-hero',
    chip:'bg-blush-wash text-blush-ink',
    alt:'A mother and her teenage child smiling at an open laptop together at home',
    title:'One sentence a week',
    fact:`Never a raw reading, never ${NOTES}, never ${LOCATION}`,
    cta:'What a parent gets' },
  { id:'pro',     who:PRO, photo:'pro-hero',
    chip:'bg-lilac-wash text-lilac-ink',
    alt:'A woman with a notepad and a teenager sitting and talking on a sofa in a bright room',
    title:CASELOAD_TITLE,
    fact:'Only what the student agreed to share, and never a group under five',
    cta:`What a ${PRO_LC} gets` },
]

/* Four decisions, each traceable to a published finding. The findings used to
 * be set as paragraphs; what carries the weight is the number and the citation
 * under it, so the prose is gone and those stayed. The citation sits on its
 * own ground inside the card, which is what stops four white rectangles
 * reading as one block. */
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

/* The hero's phone floats over the photograph rather than sitting in a cell of
 * its own, so its size is bounded by the stage it floats on and by nothing
 * else. IPhone takes a number, not a class, and the stage is the thing that
 * varies: the band is exactly one viewport tall, so a 1280 x 900 laptop and a
 * 390 x 844 phone leave it amounts 450px apart.
 *
 * 872 is the 15 Pro's height in points plus its bezel and 413 is its width the
 * same way, which is what scale 1 means to ui/iphone.jsx. Both axes are
 * measured because the stage is wide and short at 1280 and narrow and tall at
 * 390, and whichever is tighter wins.
 *
 * A ResizeObserver, not an IntersectionObserver: the arrival watchers in
 * ui/motion.jsx are the ones that `overflow-x: clip` breaks, and this is not
 * one of them. floor, not round, because a rounded-up hundredth is up to nine
 * pixels of phone that the stage would clip. */
const PHONE_H = 872
const PHONE_W = 413

function usePhoneScale(ref) {
  const [scale, setScale] = React.useState(0.3)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver !== 'function') return
    const fit = () => {
      const wide = innerWidth >= 1024
      /* The share of the stage the drawing may take. Below 1024 the stage is
         the width of the screen and the photograph needs to stay readable
         beside the drawing, so the drawing takes less of it. */
      const byWidth = (el.clientWidth * (wide ? 0.46 : 0.42)) / PHONE_W
      const byHeight = (el.clientHeight - (wide ? 40 : 24)) / PHONE_H
      const next = Math.max(0.12,
        Math.min(0.8, Math.floor(Math.min(byWidth, byHeight) * 100) / 100))
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
  const stage = React.useRef(null)
  const phone = usePhoneScale(stage)
  return (
    <main>
      {/* -- the hero -------------------------------------------------------
          `h-`, not `min-h-`: min-h lets tall content push the band past the
          fold, which brings the next band's heading into view under the title
          screen. At 1280 x 900 the viewport is the smaller of the two, so on a
          laptop the band is still exactly one screen.

          The ground is the brand teal, not paper. Spec 2 lets a heading sit on
          a band and nothing else, so the eyebrow is a chip, the headline sits
          on the teal and every other word on this band is inside the panel.
          `accent-lit` is the only green legible on this ground: `accent`
          itself is 1.0 : 1 on it. */}
      <section id="hero" className="relative isolate flex h-[calc(100svh-58px)] flex-col
        overflow-hidden border-t border-accent-ink bg-accent">

        {/* min-h-0: without it this flex item cannot shrink under its own
            content, so on a 667px phone the stage kept its natural height and
            the band ran past the fold. */}
        <div className="wrap relative z-10 flex min-h-0 flex-1 flex-col gap-3 py-4
          lg:grid lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)] lg:gap-7 lg:py-5
          xl:grid-cols-[minmax(0,27rem)_minmax(0,1fr)]">

          <div className="flex shrink-0 flex-col justify-center lg:min-h-0">
            <ScrollIn as="p" className="w-fit rounded-chip bg-paper px-3 py-1 font-mono text-ui
              font-bold tracking-[0.005em] text-accent-ink">
              MindMap, a wellness app for teenagers
            </ScrollIn>
            {/* No balanced wrapping: it moves the break mid-phrase. Leading is
                1.06, not 1.02, where the descenders of "Making your stress"
                landed in the cap height of "readable". */}
            <h1 className="mt-3 max-w-[19ch] font-display text-view font-bold leading-[1.06]
              tracking-tight text-paper lg:text-major">
              Making your stress <span className="text-accent-lit">readable</span>.
            </h1>
            {/* One panel, floating on the teal, holding every word on this
                band that is not the headline: the lede, both actions, the two
                figures and, where there is room for it, the three steps of a
                day and the one promise the product turns on. */}
            <ScrollIn className={cn(PANEL, 'mt-4 shadow-lift')}>
              <p className="px-3.5 pt-3.5 text-sec font-medium leading-[1.35] text-ink">
                One {SCORE} a day. One sentence saying what changed.
              </p>
              {/* Two actions, not one. The second is the route a judge checking
                  the working wants and it was previously only reachable five
                  bands down the page. */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-3.5 pb-3.5 pt-3">
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
              </div>
              {/* Two figures that are already on this site, each on its own
                  ground with its label beside it rather than under it, which
                  is what spec 3 asks of a number that carries weight. */}
              <div className="grid border-t border-rule sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 bg-sky-wash p-3.5">
                  <span className="font-mono text-row font-bold tabular-nums leading-none text-sky-ink">
                    {SCORE_RANGE}
                  </span>
                  <span className="text-fine text-ink-2">{SCORE}, against your own normal</span>
                </div>
                {/* The rule moves with the wrap: a top rule when the two
                    figures are stacked, a left rule when they sit side by
                    side, so there is never a doubled edge or a missing one. */}
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 border-t border-rule
                  bg-sun-wash p-3.5 sm:border-l sm:border-t-0 lg:border-l-0 lg:border-t
                  xl:border-l xl:border-t-0">
                  <span className="font-mono text-row font-bold tabular-nums leading-none text-sun-ink">
                    45
                  </span>
                  <span className="text-fine text-ink-2">seconds, a reading off the camera</span>
                </div>
              </div>
              {/* lg and up only. Below it the hero is already a screen of copy
                  plus the stage, and three more rows would push the button
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
                  and not a second wording of it. */}
              <p className="hidden border-t border-rule px-3.5 py-2 text-fine leading-[1.4]
                text-ink-3 lg:block">
                {CONSENT_SHORT}
              </p>
            </ScrollIn>
          </div>

          {/* The stage. One photograph at the size the references use it,
              running the full height of the band and off its right edge, with
              two objects floating over it at two further depths: the patch in
              the top corner and the phone standing on the bottom edge. The
              three tiles of equal weight this replaced read as a contact
              sheet rather than as a scene.

              The negative margins cancel the wrap's own padding at each step,
              so the frame reaches the edge of the screen; the band clips, so
              nothing can reach past it and raise a scrollbar. */}
          <div ref={stage} className="relative -mx-[22px] min-h-[180px] flex-1 overflow-hidden
            bg-accent-ink sm:-mx-10 lg:-mr-14 lg:ml-0 lg:min-h-0 lg:rounded-l-panel">
            <Frame photo="students-hallway" eager={EAGER.has('students-hallway')}
              alt="Four high school students walking along a bright corridor with folders and backpacks, talking as they go"
              className="absolute inset-0 object-[50%_32%]"/>

            {/* The patch, its drawing and the four signals it reads, in a card
                of its own so the drawing is never a white oval on a white
                card. The four chips are lg and up: at 390 the card would be
                most of the stage, and the patch card in the band below names
                the same four signals at every width. */}
            <div className="absolute bottom-3 left-3 z-20 flex items-center gap-3 rounded-panel border
              border-rule bg-accent-wash px-3 py-2.5 shadow-lift lg:bottom-5 lg:left-5 lg:gap-4
              lg:px-4 lg:py-3">
              <PatchFront className="w-[48px] shrink-0 lg:w-[64px]"/>
              <div className="min-w-0">
                <p className="font-display text-ui font-bold leading-tight text-ink">The patch</p>
                {/* A wrapping row, not a two column grid. On a grid the two
                    tracks are equal, the longest of the four words is
                    Temperature, and that track came out short of it: the word
                    ran out through its own pill. Each chip sizes to its own
                    word here, and the row wraps where it must. */}
                <ul className="m-0 mt-2 hidden max-w-[260px] list-none flex-wrap gap-1.5 p-0 lg:flex">
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

            {/* The phone, and beside it the three screens it is cycling
                through. The drawing moves on a four second beat, so without
                the three names a judge sees one screen and cannot tell there
                are three. */}
            <div className="absolute bottom-3 right-3 z-10 flex flex-col items-center gap-2
              lg:bottom-5 lg:right-8 lg:gap-2.5">
              <IPhone model="15-pro" scale={phone} screenBg="#f5fafa"
                label={`The MindMap app, cycling through a reading, the ${SCORE} it returns and the week it lands in`}
                className="shrink-0">
                <PhoneApp/>
              </IPhone>
              <ul aria-hidden className="m-0 hidden list-none flex-wrap justify-center gap-1.5 p-0
                sm:flex">
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
          {/* The eyebrow is a chip rather than a line of mono on the band: it
              is the one warm thing on the darkest band on the page and it is
              a container, which the band's rules require of it. */}
          <p className="w-fit rounded-chip bg-coral-wash px-3 py-0.5 font-mono text-ui font-bold
            tracking-[0.005em] text-coral-ink">
            Who this is about
          </p>
          <RevealLines as="h2"
            lines={['Most teenagers who are struggling', 'are not being reached.']}
            className="mt-2 max-w-[30ch] font-display text-sub font-bold leading-[1.12]
              tracking-tight text-paper"/>

          {/* The three frames are sized so the column they make comes out
              within 30px of ProblemStats beside it. It used to run 125px
              past, which left that much empty tint inside the figure's own
              border: a hole in a bordered panel is the exact thing the owner
              called low effort, and a column that simply stops short of its
              neighbour is the same hole moved onto the band. */}
          <div className="mt-3 grid gap-3 lg:mt-4
            lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:gap-4">
            <div className="flex flex-col gap-3 lg:gap-4">
              <ScrollIn className={PANEL_INK}>
                <div className="h-[170px] overflow-hidden lg:h-[176px]">
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
          One band, two rows of three, on the warmest ground the palette has.
          Both rows run the photograph down the side of the card from `sm` up
          rather than across its top: the frame is then the full height of the
          card, which is 200px and more rather than 124px, and the card is
          shorter because its picture and its words share a line. That is the
          mixed scale spec 5 asks for and about 130px of band height back.

          BOTH ROWS ARE AN EVEN THREE UP. The first row used to run 1.35fr /
          1fr / 1fr with a wider picture on the lead card, to say that the
          phone route is the only one a stranger can use in the next minute.
          Rendered, it did not say that: it said one card had been laid out
          differently from its two siblings, directly above a second row of
          three equal cards doing the same job. Spec 5 allows mixed scale
          across a page, not inside one row of three equals, and the two
          narrow cards were paying for it in four-line wraps. The lead is
          still marked, by the one device that costs no layout: the accent
          rule down its left edge, which the other two do not carry. */}
      <Section name="Getting started" tone="card" id="screens" className="bg-sun-wash" tight>
        <SectionHead>Three Ways to Start</SectionHead>
        <div className="mt-3 grid auto-rows-fr gap-3 lg:grid-cols-3 lg:gap-4">
          {DOORS.map((d, i) => (
            <ScrollRow key={d.id} index={i} className="h-full">
              <Card interactive as="button" type="button" onClick={() => go(d.go)}
                className={cn('flex h-full flex-col p-0 sm:flex-row', d.lead && 'border-l-accent')}>
                {/* One width for all three: the picture is the same share of
                    every card, so the row reads as one decision. */}
                <span className="relative block h-[150px] w-full shrink-0 overflow-hidden
                  sm:h-auto sm:w-[40%] sm:self-stretch">
                  <Frame photo={d.photo} alt={d.alt} eager={EAGER.has(d.photo)}
                    className="absolute inset-0"/>
                </span>
                <span className="flex min-w-0 flex-1 flex-col p-3.5">
                  {/* The drawing sits beside the photograph rather than over
                      it: the card is one object that says the same thing
                      twice, once as a frame of a person and once as a
                      diagram of the thing they would use. */}
                  <span aria-hidden className={cn('grid w-fit place-items-center rounded-panel border',
                    'border-rule px-2 py-1', d.badge)}>
                    {d.art}
                  </span>
                  <span className="mt-2 block font-display text-row font-bold leading-tight text-ink">
                    {d.title}
                  </span>
                  <span className="mt-1 block text-meta leading-[1.35] text-ink-2">
                    {d.gets}
                  </span>
                  <span className="mt-auto flex items-center gap-2 pt-3">
                    <span className={cn('rounded-chip px-2.5 py-1 font-display text-fine font-bold',
                      d.chip)}>
                      {d.note}
                    </span>
                    <ArrowRight aria-hidden className="size-[1.05rem] text-accent transition-transform
                      duration-200 groupHoverOnly:translate-x-1.5"/>
                  </span>
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
                  border border-rule bg-card text-left touch-manipulation sm:flex-row
                  transition-[border-color,transform] duration-150 ease-[var(--ease-out)]
                  motion-safe:active:scale-[0.99] hoverOnly:border-accent">
                <span className="relative block h-[150px] w-full shrink-0 overflow-hidden
                  sm:h-auto sm:w-[36%] sm:self-stretch">
                  <Frame photo={s2.photo} alt={s2.alt}
                    className="absolute inset-0 motion-safe:transition-transform
                      motion-safe:duration-[260ms] motion-safe:ease-[var(--ease-out)]
                      motion-safe:groupHoverOnly:scale-[1.02]"/>
                </span>
                <span className="flex min-w-0 flex-1 flex-col p-3.5">
                  <span className={cn('w-fit rounded-chip px-2.5 py-1 font-mono text-fine font-bold',
                    'tracking-[0.005em]', s2.chip)}>
                    {s2.who}
                  </span>
                  <span className="mt-2 block font-display text-row font-bold leading-[1.15]
                    tracking-tight text-ink">
                    {s2.title}
                  </span>
                  <span className="mt-1 block text-meta leading-[1.35] text-ink-2">
                    {s2.fact}
                  </span>
                  <span className="mt-auto flex items-center gap-2.5 pt-3 font-display text-meta
                    font-bold text-accent groupHoverOnly:text-accent-ink">
                    {s2.cta}
                    <ArrowRight className="size-[1.05rem] transition-transform duration-200
                      groupHoverOnly:translate-x-1.5"/>
                  </span>
                </span>
              </button>
            </ScrollRow>
          ))}
        </div>
      </Section>

      {/* -- privacy ---------------------------------------------------------
          The four promises used to be four hairline rows on the tint. They are
          one card, with the photograph as its top edge at the height spec 5
          asks of a frame inside a card, against the figure that proves them. */}
      <Section name="Privacy" tone="card" className="bg-sky-wash" tight>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-4">
          <div>
            <SectionHead>Student Privacy</SectionHead>
            <ScrollIn className={cn(PANEL, 'mt-3')}>
              <div className="h-[180px] overflow-hidden lg:h-[210px]">
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
      <Section name="Evidence" tone="paper" className="bg-lilac-wash" tight>
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
                  <div className={cn(PANEL, 'flex h-full flex-col')}>
                    <h3 className="px-3.5 pt-3.5 font-display text-ui font-bold leading-tight text-ink">
                      {e.title}
                    </h3>
                    <p className="px-3.5 pb-2.5 pt-1 text-meta leading-[1.4] text-ink-2">{e.line}</p>
                    {/* The source on its own ground. Four identical white
                        rectangles read as one block; two tones per card is
                        what separates the claim from what it rests on. */}
                    <p className="mt-auto border-t border-rule bg-aqua-2 px-3.5 py-2 font-mono
                      text-fine leading-[1.4] text-ink-3">
                      {e.cite}
                    </p>
                  </div>
                </ScrollRow>
              ))}
            </div>
            {/* The frame that fills the foot of this column. The citations
                beside it run 175px short of the promises in the next column,
                and a band whose last word is a footnote is the one a judge
                leaves on. At 848 by 150 it is the widest frame on the page,
                which is the point: no two photographs here are the same
                shape. */}
            <ScrollIn className={cn(PANEL, 'mt-3 h-[150px] lg:mt-4')}>
              <Frame photo="school-card" className="object-[50%_38%]"
                alt={`A ${PRO_LC} and a student talking on a sofa`}/>
            </ScrollIn>
          </div>

          <ScrollIn className={cn(PANEL, 'flex flex-col')}>
            {/* The frame is this band's realism: the limits are a promise made
                to the people in it, and the band carried no photograph at
                all. */}
            <div className="h-[150px] overflow-hidden">
              <Frame photo="student-card"
                alt="Five teenagers walking home together through a park"/>
            </div>
            <h3 className="border-t border-rule px-4 pt-3 font-display text-row font-bold
              leading-tight text-ink">
              What MindMap will never do
            </h3>
            {/* marker="none": the rule on each row is the marker. */}
            <List className="mt-2 gap-0 px-4">
              {NEVER.map(t => (
                <Item key={t} marker="none"
                  className="border-t border-rule py-1.5 text-meta leading-[1.4] text-ink-2">
                  {t}
                </Item>
              ))}
            </List>
            {/* The honesty line belongs with the promises, and inside a
                container, rather than as small print on the band. */}
            <p className="mt-auto border-t border-rule bg-aqua-2 px-4 py-2 text-fine text-ink-3">
              Not tested on anyone. No claim that it lowers stress.
            </p>
          </ScrollIn>
        </div>
      </Section>

    </main>
  )
}
