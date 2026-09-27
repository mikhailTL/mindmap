import React from 'react'
import { Tally, ScrollRow } from '../s21/motion'
import { cn } from '../lib/utils'

/* The problem band. It sits directly under the hero and it is the page's
   argument, made in pictures.
 *
 * It used to be four facts about the hardware — four signals, 45 seconds,
 * 14 days — which told a visitor what the thing does before telling them why
 * it should exist. The order is now: how large the problem is, where the gap
 * in it sits, and the narrow thing MindMap does about that gap.
 *
 * Every figure here is real and every figure carries its source on screen.
 * Nothing may be added to this file that is not in SOURCES below. If a chart
 * wants a shape the data does not have, the chart changes.
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

/* ── 1. How big it is ──────────────────────────────────────────────────── */

/* A hundred-figure array, not a bar. A bar of 42% asks a reader to convert a
   length back into people; a hundred marks with 42 of them lit is already the
   sentence. It also survives a phone, which a grouped bar chart does not.
 *
 * Colour: the remainder is ink.3 rather than ink.2. ink.2 sits at about
 * 1.9 : 1 on the dark band and the denominator disappears, which costs the
 * chart its whole point; ink.3 holds at roughly 2.7 : 1 and still leaves the
 * lit green obviously the louder of the two. The grid carries no meaning on
 * its own in any case — it is aria-hidden and the figure is stated in 58px
 * type beside it. */
const LIT = '#3ecf9a'
const REST = '#47705e'

function HundredGrid({ filled, className }) {
  const cells = []
  for (let i = 0; i < 100; i++) {
    const x = (i % 10) * 10
    const y = Math.floor(i / 10) * 10
    const on = i < filled
    cells.push(
      <g key={i} fill={on ? LIT : REST}>
        <circle cx={x + 5} cy={y + 3.1} r="1.75" />
        <rect x={x + 2.3} y={y + 5.3} width="5.4" height="4.2" rx="2.1" />
      </g>
    )
  }
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true"
      className={cn('block h-auto w-full max-w-[300px]', className)}>
      {cells}
    </svg>
  )
}

const HEADLINE = [
  { pct: 42, of: 'felt persistently sad or hopeless for two weeks or more' },
  { pct: 22, of: 'seriously considered attempting suicide' },
]

/* Built for the dark band. accent measures 2.80 : 1 there and is unusable, so
   the figures are accent.lit and the supporting type is mist and ruling. */
export function ProblemStats({ className }) {
  return (
    <div className={cn(className)}>
      <p className="font-mono text-fine uppercase tracking-[0.05em] text-ruling">
        Out of every 100 US high school students
      </p>
      <div className="mt-7 grid gap-11 sm:grid-cols-2 sm:gap-9">
        {HEADLINE.map((h, i) => (
          <ScrollRow key={h.pct} index={i}>
            {/* figcaption has to be the figure's first or last child, and it
                has to come first here: the number, then what it is of, then
                where it is from, and only then the array. The figure is named
                once, by the caption, and the hundred marks are hidden. */}
            <figure className="m-0">
              <figcaption>
                <span className="block font-display text-dial font-bold tabular-nums
                  leading-none text-accent-lit">
                  <Tally to={h.pct} suffix="%" />
                </span>
                <span className="mt-3 block max-w-[30ch] text-sec leading-[1.45] text-mist">{h.of}</span>
                <span className="mt-2 block font-mono text-fine text-ruling">
                  CDC Youth Risk Behavior Survey, 2023
                </span>
              </figcaption>
              <HundredGrid filled={h.pct} className="mt-5" />
            </figure>
          </ScrollRow>
        ))}
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

export function TreatmentGap({ className }) {
  return (
    <figure className={cn('m-0', className)}
      aria-label={'1 in 5 US adolescents aged 12 to 17, or 20.1 percent, had a major depressive ' +
        'episode in the past year, and 3 in 5 of them, or 59.4 percent, did not receive ' +
        'treatment for it. Source: NIMH, 2021.'}>
      <p className="font-display text-stat font-bold leading-none text-ink">1 in 5</p>
      <p className="mt-2.5 max-w-[34ch] text-sec leading-[1.45] text-ink-2">
        US adolescents aged 12 to 17 had a major depressive episode in the past year
        <span className="mt-1.5 block font-mono text-fine text-ink-3">20.1%. NIMH, 2021</span>
      </p>

      <svg viewBox="0 0 100 64" aria-hidden="true"
        className="mt-6 block h-auto w-full max-w-[460px]">
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

      <p className="mt-6 font-display text-stat font-bold leading-none text-warn">3 in 5</p>
      <p className="mt-2.5 max-w-[34ch] text-sec leading-[1.45] text-ink-2">
        of those adolescents did not receive treatment for it
        <span className="mt-1.5 block font-mono text-fine text-ink-3">59.4%. NIMH, 2021</span>
      </p>

      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 font-mono text-tick text-ink-3">
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
      <div className="relative mt-2.5 h-4">
        <span aria-hidden className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-bar bg-accent" />
        <Marker at={26} tone="lead" />
      </div>
      <p className="mt-2 font-mono text-tick text-accent-ink">Pattern reported</p>

      {/* the span between the two marks, which is the whole point of the figure */}
      <div className="relative mt-5 h-9" aria-hidden>
        <span style={{ left: '26%', right: '18%' }}
          className="absolute top-0 h-2.5 border-x border-t border-ruling" />
        <span style={{ left: '26%', right: '18%' }}
          className="absolute top-3.5 flex justify-center">
          <span className="font-mono text-tick text-ink-3">delay</span>
        </span>
      </div>

      {/* lane two: nothing visible to anyone else until late. The lane name sits
          above its track, as lane one's does, so a screen reader hears the two
          lanes in the same order it hears them read on the page */}
      <p className="font-display text-ui font-bold text-ink">Without it</p>
      <div className="relative mt-2.5 h-4">
        {/* a dashed 6px pill renders as lint, so the inert lane is a plain
            ruled track: something is being measured for the whole span above,
            and nothing at all is on this one until the mark near the end */}
        <span aria-hidden className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-bar
          border border-rule bg-mist" />
        <Marker at={82} />
      </div>
      <p className="mt-2 text-right font-mono text-tick text-ink-2">Someone notices</p>

      <div className="mt-5 flex items-center gap-2 border-t border-rule pt-3">
        <span className="font-mono text-tick text-ink-3">Time</span>
        <span aria-hidden className="h-px flex-1 bg-rule" />
        <svg viewBox="0 0 8 8" aria-hidden className="size-2 fill-ruling"><path d="M0 0l8 4-8 4z" /></svg>
      </div>

      <figcaption className="mt-5 max-w-[46ch] text-sec leading-[1.5] text-ink-2">
        The patch reads the body all day and reports a change in one sentence, before anyone
        has had to find the words for it.
      </figcaption>
    </figure>
  )
}
