import React from 'react'
import { Tally, ScrollRow } from '../s21/motion'
import { cn } from '../lib/utils'

/* The problem band. It sits directly under the hero and it is the page's
   argument, made in pictures.
 *
 * It used to be four facts about the hardware — four signals, 45 seconds,
 * 14 days — which told a visitor what the thing does before telling them why
 * it should exist. The order is now: how large the problem is, how fast it
 * grew, where the gap in it sits, and the narrow thing MindMap does about
 * that gap.
 *
 * Every figure here is real and every figure carries its source on screen.
 * Nothing may be added to this file that is not in SOURCES below. If a chart
 * wants a shape the data does not have, the chart changes.
 *
 * Two figures were wrong until this pass: 42% and 22% were printed against
 * CDC YRBS 2023 and are in fact the 2021 numbers. 2023 reads 39.7% and 20.4%.
 *
 * There is no defensible "150% rise since 2010" from one consistent
 * instrument, so the trend panel does not claim one. It shows the same YRBS
 * question a decade apart, 30% to 40%, which is the rise that actually exists.
 * NSDUH cannot be spliced across its 2020 redesign to manufacture a larger
 * number, and none of this measures "mental illness" — it measures one
 * self-reported question.
 *
 * Sizing: everything in this file was roughly half again too big and the band
 * cost a reader three scrolls. The isotype grids stay, because they are the
 * part that works, but a 10 by 10 block is now 152px and not 300px, the
 * funnel is 304px and not 460px, and every margin that produced an empty
 * band rather than a separation is gone.
 *
 * The claim is deliberately small. MindMap does not detect, diagnose, prevent
 * or treat anything; it is not a medical device. What it does is measure
 * continuously and report a pattern early, and that is all the copy says. */

export const SOURCES = [
  { label: 'CDC, Youth Risk Behavior Survey, 2023',
    href: 'https://www.cdc.gov/yrbs/youth-health-in-focus/mental-health.html' },
  { label: 'NIMH, Major Depression, from NSDUH 2021',
    href: 'https://www.nimh.nih.gov/health/statistics/major-depression' },
]

/* ── 1. How big it is, and which way it is going ───────────────────────── */

/* A hundred-figure array, not a bar. A bar of 40% asks a reader to convert a
   length back into people; a hundred marks with 40 of them lit is already the
   sentence. It also survives a phone, which a grouped bar chart does not.
 *
 * Colour: the remainder is ink.3 rather than ink.2. ink.2 sits at about
 * 1.9 : 1 on the dark band and the denominator disappears, which costs the
 * chart its whole point; ink.3 holds at roughly 2.7 : 1 and still leaves the
 * lit green obviously the louder of the two. The grid carries no meaning on
 * its own in any case — it is aria-hidden and the figure is stated in large
 * type above it. */
const LIT = '#3ecf9a'
const REST = '#47705e'

/* The mark fills more of its 10-unit cell than it used to, and the head sits
   closer to its own shoulders than to the head below it. Both matter only at
   this size: at 160px a cell is 16px, and with the old proportions a column
   of marks joined up into one continuous string of dots instead of ten
   people. It still reads as a person at half the former size, which is the
   whole point of shrinking it. */
function HundredGrid({ filled, className }) {
  const cells = []
  for (let i = 0; i < 100; i++) {
    const x = (i % 10) * 10
    const y = Math.floor(i / 10) * 10
    const on = i < filled
    cells.push(
      <g key={i} fill={on ? LIT : REST}>
        <circle cx={x + 5} cy={y + 2.7} r="1.75" />
        <rect x={x + 2.05} y={y + 5.1} width="5.9" height="4.1" rx="2.05" />
      </g>
    )
  }
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true"
      className={cn('block h-auto w-full max-w-[160px]', className)}>
      {cells}
    </svg>
  )
}

/* The trend gets a then-and-now pair and not a third grid. Stat one and stat
   three are the same underlying measure, so drawn the same way they would read
   as a printing error; drawn as a rise they read as the decade behind stat
   one, which is what they are. Same reason the figure is `stat` and not
   `dial`: two present-day numbers carry the band, the trend supports them.
 *
 * Zero baseline, 1.5 units per point, and the dashed rule carries the 2013
 * level across so the ten points are a thing you can see rather than a thing
 * you are told. A truncated axis would make the rise look like the 150% the
 * data does not support. */
function ThenNow({ className }) {
  return (
    <svg viewBox="0 0 100 86" aria-hidden="true"
      className={cn('block h-auto w-full', className)}>
      <rect x="10" y="31" width="30" height="45" rx="2" fill={REST} />
      <rect x="60" y="16" width="30" height="60" rx="2" fill={LIT} />
      <path d="M10 31 L90 31" fill="none" stroke="#93b2a1" strokeWidth="0.8"
        strokeDasharray="3 3" />
      <path d="M4 76 L96 76" fill="none" stroke={REST} strokeWidth="1" />
    </svg>
  )
}

const ROW = [
  { pct: 40, exact: '39.7%', of: 'felt persistently sad or hopeless for two weeks or more' },
  { pct: 20, exact: '20.4%', of: 'seriously considered attempting suicide' },
]

/* Built for the dark band. accent measures 2.80 : 1 there and is unusable, so
   the figures are accent.lit and the supporting type is mist and ruling. */
export function ProblemStats({ className }) {
  return (
    <div className={cn(className)}>
      <p className="font-mono text-fine text-ruling">
        Out of every 100 US high school students
      </p>
      {/* Three across from sm up, and one column on a phone. The row was two
          figures with gap-11 between them and a third of the band empty to the
          right of them. */}
      <div className="mt-5 grid gap-x-7 gap-y-9 sm:grid-cols-3">
        {ROW.map((h, i) => (
          <ScrollRow key={h.pct} index={i}>
            {/* figcaption has to be the figure's first or last child, and it
                has to come first here: the number, then what it is of, then
                where it is from, and only then the array. The figure is named
                once, by the caption, and the hundred marks are hidden. */}
            <figure className="m-0">
              <figcaption>
                {/* min-h keeps the three captions on one line with each other
                    even though the third figure is set a step smaller */}
                <span className="flex min-h-[3rem] items-end font-display text-dial font-bold
                  tabular-nums leading-none text-accent-lit">
                  <Tally to={h.pct} suffix="%" />
                </span>
                <span className="mt-2 block max-w-[30ch] text-sec leading-[1.4] text-mist">{h.of}</span>
                <span className="mt-1.5 block font-mono text-fine text-ruling">
                  {h.exact}. CDC Youth Risk Behavior Survey, 2023
                </span>
              </figcaption>
              <HundredGrid filled={h.pct} className="mt-3.5" />
            </figure>
          </ScrollRow>
        ))}

        <ScrollRow index={2}>
          <figure className="m-0">
            <figcaption>
              <span className="flex min-h-[3rem] items-end font-display text-stat font-bold
                tabular-nums leading-none text-mist">
                30%
                <span className="mx-2 font-body text-meta font-normal text-ruling">to</span>
                <span className="text-accent-lit"><Tally to={40} suffix="%" /></span>
              </span>
              <span className="mt-2 block max-w-[30ch] text-sec leading-[1.4] text-mist">
                the first figure ten years earlier: the same survey, the same question, a rise of
                ten points
              </span>
              <span className="mt-1.5 block font-mono text-fine text-ruling">
                CDC YRBS Data Summary and Trends Report, 2013 to 2023
              </span>
            </figcaption>
            {/* the two year labels live in HTML, not in the viewBox: text inside
                a scaled SVG shrinks below 12px the moment the column narrows */}
            <div className="mt-3.5 max-w-[176px]">
              <ThenNow />
              <div className="mt-1.5 grid grid-cols-2 text-center font-mono text-fine text-ruling">
                <span>2013</span>
                <span>2023</span>
              </div>
            </div>
          </figure>
        </ScrollRow>
      </div>
    </div>
  )
}

/* ── 2. The gap ────────────────────────────────────────────────────────── */

/* The hinge. Two ratios side by side would read as two unrelated facts, so the
   second is drawn as the first one opened up: the single dark figure in the
   top row widens into the whole bottom row. The gap is then the thing you see,
   which is the only reason the chart exists.
 *
 * Light ground only. The amber that carries "no treatment" has no dark-band
 * value in the palette and inventing one would put an unmeasured colour into
 * the system, so this chart is not tone-switchable. */
const LEAD = '#0d2b1e'   /* ink   */
const QUIET = '#47705e'  /* ink.3, outline for the four not in the figure */
const NONE = '#99590c'   /* warn  */
const SOME = '#157446'   /* accent */

function Person({ cx, y, fill, outline }) {
  return (
    <g fill={outline ? 'none' : fill} stroke={outline ? fill : 'none'} strokeWidth="0.8">
      <circle cx={cx} cy={y + 6} r="3.6" />
      <rect x={cx - 6} y={y + 11} width="12" height="9.5" rx="4.6" />
    </g>
  )
}

function FiveAcross({ y, marks }) {
  return marks.map((m, i) => (
    <Person key={i} cx={10 + i * 20} y={y} fill={m.fill} outline={m.outline} />
  ))
}

/* Each ratio's number now sits on the same line as the sentence it belongs to
   rather than above it. That is worth about 70px on its own, and 70px was the
   difference between this figure fitting a laptop screen and not. */
function Ratio({ figure, tone, children, note, className }) {
  return (
    <div className={cn('flex items-baseline gap-3.5', className)}>
      <p className={cn('shrink-0 font-display text-stat font-bold leading-none', tone)}>{figure}</p>
      <p className="min-w-0 max-w-[34ch] text-sec leading-[1.4] text-ink-2">
        {children}
        <span className="mt-1 block font-mono text-fine text-ink-3">{note}</span>
      </p>
    </div>
  )
}

export function TreatmentGap({ className }) {
  return (
    <figure className={cn('m-0', className)}
      aria-label={'1 in 5 US adolescents aged 12 to 17, or 20.1 percent, had a major depressive ' +
        'episode in the past year, and 3 in 5 of them, or 59.4 percent, did not receive ' +
        'treatment for it. Source: NIMH, 2021.'}>
      <Ratio figure="1 in 5" tone="text-ink" note="20.1%. NIMH, 2021">
        US adolescents aged 12 to 17 had a major depressive episode in the past year
      </Ratio>

      <svg viewBox="0 0 100 64" aria-hidden="true"
        className="mt-4 block h-auto w-full max-w-[304px]">
        <FiveAcross y={0} marks={[
          { fill: QUIET, outline: true }, { fill: QUIET, outline: true },
          { fill: LEAD }, { fill: QUIET, outline: true }, { fill: QUIET, outline: true },
        ]} />
        {/* the one figure above, opened out into the five below */}
        <path d="M43 23 L2 40 L98 40 L57 23 Z" fill="#dcefe4" />
        <path d="M43 23 L2 40 M57 23 L98 40" fill="none" stroke="#93b2a1" strokeWidth="0.7" />
        <FiveAcross y={42} marks={[
          { fill: NONE }, { fill: NONE }, { fill: NONE }, { fill: SOME }, { fill: SOME },
        ]} />
      </svg>

      <Ratio figure="3 in 5" tone="text-warn" note="59.4%. NIMH, 2021" className="mt-4">
        of those adolescents received no treatment for it
      </Ratio>

      <div className="mt-3.5 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-tick text-ink-3">
        <span className="flex items-center gap-2">
          <span aria-hidden className="size-3 rounded-chip bg-warn" />No treatment
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden className="size-3 rounded-chip bg-accent" />Treatment
        </span>
      </div>
    </figure>
  )
}

/* ── 3. Why a continuous reading changes anything ──────────────────────── */

/* Drawn in HTML rather than SVG on purpose. The labels have to hold a real
   type size at 342px of content width, and text inside a scaled viewBox does
   not: a 12px label becomes 9px the moment the container narrows. Boxes and
   rules in CSS scale by layout instead, so nothing here can shrink below the
   step it was set at.
 *
 * The two lanes share one time axis and it carries no numbers, because there
 * is no sourced figure for how long the delay runs. The picture makes the
 * shape of the claim, not a measurement of it. */
function Marker({ at, tone }) {
  return (
    <span aria-hidden style={{ left: `${at}%` }}
      className={cn('absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-chip',
        'ring-2 ring-paper', tone === 'lead' ? 'bg-accent-ink' : 'bg-ink')} />
  )
}

export function WhyItWorks({ className }) {
  return (
    <figure className={cn('m-0 max-w-[640px]', className)}>
      {/* lane one: the patch, reading the whole way across */}
      <p className="font-display text-ui font-bold text-ink">MindMap, reading all day</p>
      <div className="relative mt-2 h-4">
        <span aria-hidden className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-bar bg-accent" />
        <Marker at={26} tone="lead" />
      </div>
      <p className="mt-1.5 font-mono text-tick text-accent-ink">Pattern reported</p>

      {/* the span between the two marks, which is the whole point of the figure */}
      <div className="relative mt-3.5 h-9" aria-hidden>
        <span style={{ left: '26%', right: '18%' }}
          className="absolute top-0 h-2.5 border-x border-t border-ruling" />
        <span style={{ left: '26%', right: '18%' }}
          className="absolute top-3 flex justify-center">
          <span className="font-mono text-tick text-ink-3">delay</span>
        </span>
      </div>

      {/* lane two: nothing visible to anyone else until late. The lane name sits
          above its track, as lane one's does, so a screen reader hears the two
          lanes in the same order it hears them read on the page */}
      <p className="font-display text-ui font-bold text-ink">Without it</p>
      <div className="relative mt-2 h-4">
        {/* a dashed 6px pill renders as lint, so the inert lane is a plain
            ruled track: something is being measured for the whole span above,
            and nothing at all is on this one until the mark near the end */}
        <span aria-hidden className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-bar
          border border-rule bg-mist" />
        <Marker at={82} />
      </div>
      <p className="mt-1.5 text-right font-mono text-tick text-ink-2">Someone notices</p>

      <div className="mt-3.5 flex items-center gap-2 border-t border-rule pt-2.5">
        <span className="font-mono text-tick text-ink-3">Time</span>
        <span aria-hidden className="h-px flex-1 bg-rule" />
        <svg viewBox="0 0 8 8" aria-hidden className="size-2 fill-ruling"><path d="M0 0l8 4-8 4z" /></svg>
      </div>

      <figcaption className="mt-3.5 max-w-[46ch] text-sec leading-[1.45] text-ink-2">
        The patch reads the body all day and reports a change in one sentence, before anyone
        has had to find the words for it.
      </figcaption>
    </figure>
  )
}
