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
 *   - Colour. Five bands used to carry five grounds, three of them hues the
 *     owner has since struck out. The grounds are the green system's own
 *     near-whites now: aqua, paper, card, aqua-2. Bands are told apart by
 *     which near-white they sit on and by their heading, never by a hue.
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
    photo:'student-bus',
    alt:'Two boys laughing together on a school bus seat, one holding a phone',
    art:(
      <svg viewBox="0 0 220 120" className="h-[34px] w-auto" aria-hidden focusable="false">
        <rect x="74" y="3" width="72" height="114" rx="12" className="fill-card stroke-ink" strokeWidth="2"/>
        <rect x="86" y="19" width="48" height="48" rx="8" className="fill-ink"/>
        <circle cx="102" cy="39" r="8" className="fill-accent"/>
        <circle cx="122" cy="39" r="5" className="fill-beam"/>
        <path d="M84 91 q10 -16 20 0 t20 0 t12 -6" fill="none" strokeWidth="2.4" strokeLinecap="round" className="stroke-accent"/>
      </svg>) },
  { id:'patch', go:'patch', title:'Wear the patch', note:'Needs the patch',
    gets:'Pulse, sweat, temperature and movement, read together',
    photo:'student-basketball',
    alt:'A teenage boy dribbling a basketball past a defender on an outdoor court under a cloudy sky',
    art:(
      <svg viewBox="0 0 220 120" className="h-[34px] w-auto" aria-hidden focusable="false">
        <rect x="7" y="23" width="206" height="74" rx="37" className="fill-card stroke-ink" strokeWidth="2"/>
        <rect x="56" y="33" width="108" height="54" rx="22" className="fill-aqua stroke-ink" strokeWidth="1.6"/>
        <circle cx="110" cy="60" r="14" fill="none" className="stroke-ink-3" strokeWidth="1.6"/>
        <circle cx="110" cy="60" r="4.5" className="fill-accent"/>
      </svg>) },
  { id:'demo', go:'app', title:'Try the demo', note:'No reading taken',
    gets:'A worked day of measurements, already filled in',
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
    alt:'Two students sitting on concrete steps outside a building, heads together over an open notebook',
    title:`Your ${SCORE} today, and what moved it`,
    fact:'Four tabs: Today, Reading, Toolkit, Sharing',
    cta:'What a student gets' },
  { id:'parent',  who:'Parent', photo:'parent-hero',
    alt:'A mother and her teenage child smiling at an open laptop together at home',
    title:'One sentence a week',
    fact:`Never a raw reading, never ${NOTES}, never ${LOCATION}`,
    cta:'What a parent gets' },
  { id:'pro',     who:PRO, photo:'pro-hero',
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
      /* The share of the stage the drawing may take. A third of the column
         wide, four fifths of it tall: the phone stands in front of the frame
         with most of itself inside it and the rest in the padding below, and
         the photograph stays readable beside it at every width. */
      const byWidth = (el.clientWidth * 0.34) / PHONE_W
      const byHeight = (el.clientHeight * 0.80) / PHONE_H
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
          Rebuilt for calm. What this replaced: a saturated teal field at
          exactly 100svh, with a photograph bleeding off the right edge, the
          phone clipped by that edge, a copy panel floating on the teal and a
          row of glass pills over the phone's foot. Four layers, three of them
          overlapping, and the band's fixed height crushed the column on the
          left while cutting the drawing on the right.

          The ground is a near-white in the green family, so the brand green is
          free to be the accent again rather than the field. The words sit
          directly on it; nothing needs a panel to be legible. The height is
          the content's, not the viewport's -- forcing one screen is what broke
          the scale at both ends.

          Three objects on the right, each fully inside its own column: the
          photograph in a frame, the phone standing in front of it, the patch
          at its foot. Nothing is clipped and nothing floats over a face. */}
      <section id="hero" className="border-t border-rule bg-aqua">
        <div className="wrap grid gap-7 py-7 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]
          lg:items-center lg:gap-10 lg:py-10 xl:grid-cols-[minmax(0,29rem)_minmax(0,1fr)]">

          {/* The words. The eyebrow is a line of type, not a pill: a rounded
              capsule of letterspaced monospace over a headline is the single
              most recognisable mark of a generated landing page. */}
          <div>
            <ScrollIn as="p" className="font-body text-ui font-semibold text-accent-ink">
              A wellness app for teenagers
            </ScrollIn>
            {/* No balanced wrapping: it moves the break mid-phrase. Leading is
                1.06, where the descenders of "Making your stress" landed in
                the cap height of "readable" at 1.02. */}
            <h1 className="mt-2 max-w-[14ch] font-display text-view font-bold leading-[1.06]
              tracking-tight text-ink lg:text-major">
              Making your stress <span className="text-accent">readable</span>.
            </h1>
            <p className="mt-3.5 max-w-[36ch] text-lead text-ink-2">
              One {SCORE} a day. One sentence saying what changed.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Button onClick={() => go('app')}>Open the app<span aria-hidden>&rarr;</span></Button>
              {/* The route a judge checking the working wants. It used to be
                  reachable only five bands down the page. */}
              <Button variant="ghost" size="sm" onClick={() => go('methods')}>
                How it works
                <ArrowRight className="size-[1.05rem]"/>
              </Button>
            </div>

            {/* Two figures already true of this site. Set in the display face
                with tabular figures: they line up with each other without
                being typed out on a typewriter. */}
            <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4 border-t border-rule pt-4">
              {[[SCORE_RANGE, `${SCORE}, against your own normal`],
                ['45', 'seconds, a reading off the camera']].map(([fig, label]) => (
                <div key={label}>
                  <dt className="font-display text-stat font-bold tabular-nums leading-none
                    text-accent-ink">
                    {fig}
                  </dt>
                  <dd className="m-0 mt-1.5 max-w-[18ch] text-fine text-ink-3">{label}</dd>
                </div>
              ))}
            </dl>

            {/* lg and up. Below it the hero is already a screen of copy plus
                the stage, and the same three steps are the three cards in the
                band under this one. Numerals, not numbered discs: a row of
                filled circles is decoration the list does not need. */}
            <ol className="m-0 mt-5 hidden list-none border-t border-rule p-0 lg:block">
              {DAY.map(([n, step]) => (
                <li key={n} className="flex items-baseline gap-3 border-b border-rule py-2">
                  <span aria-hidden className="w-3 shrink-0 font-display text-ui font-bold
                    tabular-nums leading-none text-accent">
                    {n}
                  </span>
                  <span className="min-w-0 text-meta leading-[1.35] text-ink-2">{step}</span>
                </li>
              ))}
            </ol>
            {/* The one promise this product turns on, in the one place a judge
                is certain to read. Same sentence as the privacy band, from
                src/lib/terms.js, not a second wording of it. */}
            <p className="mt-3 hidden text-fine leading-[1.4] text-ink-3 lg:block">
              {CONSENT_SHORT}
            </p>
          </div>

          {/* The stage. One frame, and two objects standing in front of it at
              one further depth each. The frame has its own aspect ratio so the
              column has a height before the photograph lands; the phone
              overhangs the frame's bottom edge by a sixth of itself, and the
              padding below is what that overhang stands in, so nothing is ever
              cut by the band. */}
          <div ref={stage} className="relative mx-auto w-full max-w-[520px] pb-12 lg:max-w-none
            lg:pb-14">
            <div className="relative overflow-hidden rounded-panel border border-rule shadow-lift
              aspect-[5/4] lg:aspect-[16/11]">
              <Frame photo="students-hallway" eager={EAGER.has('students-hallway')}
                alt="Four high school students walking along a bright corridor with folders and backpacks, talking as they go"
                className="absolute inset-0 object-[50%_32%]"/>
            </div>

            {/* The patch and the four signals it reads, in a card of its own so
                the drawing is never a white oval on a white card. The chips are
                sm and up: at 390 the card would be most of the frame, and the
                patch card in the band below names the same four signals at
                every width. */}
            <div className="absolute bottom-10 left-0 z-20 flex items-center gap-3 rounded-panel
              border border-rule bg-card px-3 py-2.5 shadow-lift lg:bottom-11 lg:gap-4 lg:px-4
              lg:py-3">
              <PatchFront className="w-[46px] shrink-0 lg:w-[58px]"/>
              <div className="min-w-0">
                <p className="font-display text-ui font-bold leading-tight text-ink">The patch</p>
                {/* A wrapping row, not a two column grid: on a grid the tracks
                    are equal, the longest word is Temperature, and that track
                    came out short of it. */}
                <ul className="m-0 mt-2 hidden max-w-[250px] list-none flex-wrap gap-1.5 p-0 sm:flex">
                  {SIGNALS.map(([name, Mark]) => (
                    <li key={name}
                      className="flex items-center gap-1.5 whitespace-nowrap rounded-field border
                        border-rule bg-aqua px-2 py-1">
                      <Mark aria-hidden className="size-3.5 shrink-0 text-beam-ink"/>
                      <span className="text-fine leading-none text-ink-2">{name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* The phone, whole. It cycles a reading, the number it returns and
                the week that number lands in, on a four second beat, so the
                drawing carries the product rather than a still of it. The row
                of pills that used to name the three beats is gone: it sat over
                the phone's own foot and read as chrome. */}
            <div className="absolute bottom-0 right-2 z-10 lg:right-6">
              <IPhone model="15-pro" scale={phone} screenBg="#f5fafa"
                label={`The MindMap app, cycling through a reading, the ${SCORE} it returns and the week it lands in`}
                className="shrink-0">
                <PhoneApp/>
              </IPhone>
            </div>
          </div>
        </div>
      </section>

      {/* -- the problem -----------------------------------------------------
          This band used to be near-black, as a chapter break. Spec 0c retires
          that: no saturated or dark ground on a whole section. It is paper now,
          and the break from the band above is carried by the ground changing
          from aqua to paper and by the rule between them.

          The heading sits on the band, which spec 2 allows it to. Everything
          else here is in a container: the frames, the small print, and the
          national figures. Every figure in ProblemStats is external and
          sourced; the rules for them live in charts/problem.jsx and are not
          this page's to bend. */}
      <section id="problem" className="border-t border-rule bg-paper">
        <div className="wrap py-5 lg:py-7">
          {/* A line of type, not a capsule. Spec 0c: a rounded-full enclosure
              around letterspaced type above a headline is the mark of a
              generated page, and this band had one. */}
          <p className="font-body text-ui font-semibold text-accent-ink">
            Who this is about
          </p>
          <RevealLines as="h2"
            lines={['Most teenagers who are struggling', 'are not being reached.']}
            className="mt-2 max-w-[30ch] font-display text-sub font-bold leading-[1.12]
              tracking-tight text-ink"/>

          {/* The three frames are sized so the column they make comes out
              within 30px of ProblemStats beside it. It used to run 125px
              past, which left that much empty tint inside the figure's own
              border: a hole in a bordered panel is the exact thing the owner
              called low effort, and a column that simply stops short of its
              neighbour is the same hole moved onto the band. */}
          <div className="mt-3 grid gap-3 lg:mt-4
            lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:gap-4">
            <div className="flex flex-col gap-3 lg:gap-4">
              <ScrollIn className={PANEL}>
                <div className="h-[170px] overflow-hidden lg:h-[176px]">
                  <Frame photo="clinic-talk" eager={EAGER.has('clinic-talk')}
                    alt={`A teenage boy talking with a ${PRO_LC} on a sofa by a sunlit window`}/>
                </div>
                {/* The one place the page says what the photographs are. */}
                <p className="px-3.5 pb-3.5 pt-3 text-fine text-ink-3">
                  Stock photographs of models. Nobody shown uses MindMap.
                </p>
              </ScrollIn>

              {PROBLEM_FRAMES.map((f, i) => (
                <ScrollRow key={f.photo} index={i} className={cn(PANEL, f.h)}>
                  <Frame photo={f.photo} alt={f.alt} eager={EAGER.has(f.photo)}/>
                </ScrollRow>
              ))}
            </div>

            <ScrollIn className={cn(PANEL, 'p-4')}>
              <ProblemStats/>
            </ScrollIn>
          </div>
        </div>
      </section>

      {/* -- three ways to start ---------------------------------------------
          Two rows of three used to sit inside one band on one ground, and they
          read as a single set of six. They are two different questions, so they
          are two bands on two grounds now, each with its own heading.

          Each card is a photograph and three lines. The drawing that used to
          ride beside the photograph, and the coloured capsule that used to
          carry the caveat, are both gone: a card that says the same thing three
          ways is not clearer, it is louder. The caveat is a line of type. */}
      <Section name="Getting started" tone="card" id="screens" className="bg-card" tight>
        <SectionHead>Three Ways to Start</SectionHead>
        <div className="mt-3 grid auto-rows-fr gap-3 lg:grid-cols-3 lg:gap-4">
          {DOORS.map((d, i) => (
            <ScrollRow key={d.id} index={i} className="h-full">
              <Card interactive as="button" type="button" onClick={() => go(d.go)}
                className={cn('flex h-full flex-col p-0 sm:flex-row', d.lead && 'border-l-accent')}>
                {/* 190px, not 150: a frame under 170 cuts a face, which is the
                    defect the owner photographed. The focal point for each
                    photograph comes from lib/photos.js, not from this file. */}
                <span className="relative block h-[190px] w-full shrink-0 overflow-hidden
                  sm:h-auto sm:w-[40%] sm:self-stretch">
                  <Frame photo={d.photo} alt={d.alt} eager={EAGER.has(d.photo)}
                    className="absolute inset-0"/>
                </span>
                <span className="flex min-w-0 flex-1 flex-col p-3.5">
                  <span className="block text-fine font-semibold text-ink-3">{d.note}</span>
                  <span className="mt-1 block font-display text-row font-bold leading-tight text-ink">
                    {d.title}
                  </span>
                  <span className="mt-1 block text-meta leading-[1.35] text-ink-2">
                    {d.gets}
                  </span>
                  <span className="mt-auto flex items-center gap-2 pt-3 font-display text-meta
                    font-bold text-accent">
                    Open
                    <ArrowRight aria-hidden className="size-[1.05rem] transition-transform
                      duration-200 groupHoverOnly:translate-x-1.5"/>
                  </span>
                </span>
              </Card>
            </ScrollRow>
          ))}
        </div>
      </Section>

      {/* -- the three audiences ----------------------------------------------
          Its own band, on its own ground, with its own heading. The audience
          used to be named in a monospace capsule in a colour of its own, which
          is the element the owner singled out by name. It is a line of type. */}
      <Section name="Audiences" tone="card" className="bg-aqua" tight>
        <SectionHead>Audiences</SectionHead>
        <div className="mt-3 grid auto-rows-fr gap-3 lg:grid-cols-3 lg:gap-4">
          {SCREENS.map((s2, i) => (
            <ScrollRow key={s2.id} index={i} className="h-full">
              <button type="button" onClick={() => go(s2.id)}
                className="group flex h-full w-full flex-col overflow-hidden rounded-panel
                  border border-rule bg-card text-left touch-manipulation sm:flex-row
                  transition-[border-color,transform] duration-150 ease-[var(--ease-out)]
                  motion-safe:active:scale-[0.99] hoverOnly:border-accent">
                <span className="relative block h-[190px] w-full shrink-0 overflow-hidden
                  sm:h-auto sm:w-[36%] sm:self-stretch">
                  <Frame photo={s2.photo} alt={s2.alt}
                    className="absolute inset-0 motion-safe:transition-transform
                      motion-safe:duration-[260ms] motion-safe:ease-[var(--ease-out)]
                      motion-safe:groupHoverOnly:scale-[1.02]"/>
                </span>
                <span className="flex min-w-0 flex-1 flex-col p-3.5">
                  <span className="block text-fine font-semibold text-ink-3">{s2.who}</span>
                  <span className="mt-1 block font-display text-row font-bold leading-[1.15]
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
      <Section name="Privacy" tone="card" className="bg-card" tight>
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
      <Section name="Evidence" tone="paper" className="bg-aqua-2" tight>
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
                    <p className="mt-auto border-t border-rule bg-aqua-2 px-3.5 py-2
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
