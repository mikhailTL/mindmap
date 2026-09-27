import React from 'react'
import { Tally, ScrollIn, ScrollRow } from '../s21/motion'
import { cn } from '../lib/utils'

/* The problem band. It sits directly under the hero and it is the page's
   argument, made in pictures.
 *
 * It used to be four facts about the hardware — four signals, 45 seconds,
 * 14 days — which told a visitor what the thing does before telling them why
 * it should exist.
 *
 * Every figure here is real and every figure carries its source on screen.
 * Nothing may be added to this file that is not in SOURCES below. If a chart
 * wants a shape the data does not have, the chart changes.
 *
 * Two figures were wrong until an earlier pass: 42% and 22% were printed
 * against CDC YRBS 2023 and are in fact the 2021 numbers. 2023 reads 39.7%
 * and 20.4%.
 *
 * There is no defensible "150% rise since 2010" from one consistent
 * instrument, so the trend panel does not claim one. It shows the same YRBS
 * question a decade apart, 30% to 40%, which is the rise that actually exists.
 * NSDUH cannot be spliced across its 2020 redesign to manufacture a larger
 * number, and none of this measures "mental illness" — it measures one
 * self-reported question.
 *
 * WHAT THIS PASS CHANGED, and why. Every statistic on the homepage now lives
 * on this one dark band: the review's words were that the stats had to be "in
 * the dark green bar" and that the light section holding the 1-in-5 funnel was
 * "too much". So the funnel is gone. It was a 304px two-tier isotype drawing
 * plus two stacked ratios plus a legend, about 420px of band on its own, and
 * it was carrying a single fact: most of it goes unaddressed. That fact is now
 * one ruled row under the three CDC figures — figure, five marks, sentence —
 * which costs the band roughly 90px instead of 420 and reads as the conclusion
 * the three figures above it lead to.
 *
 * SOURCES moved here too, so the links sit with the numbers they belong to
 * instead of under a section that no longer exists.
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

/* Everything in this file is drawn for the dark band and nowhere else. accent
   #157446 measures 2.62 : 1 on ink and is unusable there, so the lit quantity
   is accent.lit (7.67 : 1), the second quantity is beam (4.53 : 1, and only
   ever a graphic), the remainder is ink.3 and the type is mist and ruling. */
const LIT = '#3ecf9a'   /* accent.lit — the quantity being counted */
const REST = '#47705e'  /* ink.3 — the denominator it is counted out of */
const PAIR = '#0e9c9c'  /* beam — the other half of a two-way split */

/* ── 1. How big it is, and which way it is going ───────────────────────── */

/* A hundred-figure array, not a bar. A bar of 40% asks a reader to convert a
   length back into people; a hundred marks with 40 of them lit is already the
   sentence. It also survives a phone, which a grouped bar chart does not.
 *
 * The mark fills more of its 10-unit cell than a naive figure would, and the
 * head sits closer to its own shoulders than to the head below it. Both matter
 * only at this size: at 160px a cell is 16px, and with looser proportions a
 * column of marks joins up into one continuous string of dots instead of ten
 * people. The grid carries no meaning on its own — it is aria-hidden and the
 * figure is stated in large type above it. */
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
      className={cn('block h-auto w-full max-w-[152px] lg:max-w-[184px]', className)}>
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

/* Five marks, three of them lit, on one line. This is all that is left of the
   funnel: the two-tier drawing existed to show 1 in 5 opening out into 5, and
   the opening-out was the expensive part of it in both height and attention.
   The ratio that matters is the second one, so only the second one is drawn,
   and the first is a clause in the sentence beside it. */
function ThreeOfFive({ className }) {
  const marks = [LIT, LIT, LIT, PAIR, PAIR]
  return (
    <svg viewBox="0 0 100 26" aria-hidden="true"
      className={cn('block h-auto w-full', className)}>
      {marks.map((fill, i) => (
        <g key={i} fill={fill}>
          <circle cx={10 + i * 20} cy="6.4" r="4.2" />
          <rect x={10 + i * 20 - 7} y="13" width="14" height="11" rx="5.4" />
        </g>
      ))}
    </svg>
  )
}

const ROW = [
  { pct: 40, exact: '39.7%', of: 'felt persistently sad or hopeless for two weeks or more' },
  { pct: 20, exact: '20.4%', of: 'seriously considered attempting suicide' },
]

export function ProblemStats({ className }) {
  return (
    <div className={cn(className)}>
      <p className="text-fine text-ruling">
        Out of every 100 US high school students
      </p>
      {/* Three across from sm up, and one column on a phone. gap-y is smaller
          than it was because the three cells are now the same height to within
          a line, so the vertical gap was separating nothing. */}
      <div className="mt-4 grid gap-x-7 gap-y-8 sm:grid-cols-3">
        {ROW.map((h, i) => (
          <ScrollRow key={h.pct} index={i} className="h-full">
            {/* figcaption has to be the figure's first or last child, and it
                has to come first here: the number, then what it is of, then
                where it is from, and only then the array. The figure is named
                once, by the caption, and the hundred marks are hidden. */}
            <figure className="m-0 flex h-full flex-col">
              <figcaption>
                {/* min-h keeps the three captions on one line with each other
                    even though the third figure is set a step smaller */}
                <span className="flex min-h-[2.75rem] items-end font-display text-dial font-bold
                  tabular-nums leading-none text-accent-lit">
                  <Tally to={h.pct} suffix="%" />
                </span>
                <span className="mt-2 block max-w-[30ch] text-sec leading-[1.4] text-mist">{h.of}</span>
                <span className="mt-1 block text-fine text-ruling">
                  {h.exact}. CDC Youth Risk Behavior Survey, 2023
                </span>
              </figcaption>
              <HundredGrid filled={h.pct} className="mt-auto pt-3" />
            </figure>
          </ScrollRow>
        ))}

        <ScrollRow index={2} className="h-full">
          <figure className="m-0 flex h-full flex-col">
            <figcaption>
              <span className="flex min-h-[2.75rem] items-end font-display text-stat font-bold
                tabular-nums leading-none text-mist">
                30%
                <span className="mx-2 font-body text-meta font-normal text-ruling">to</span>
                <span className="text-accent-lit"><Tally to={40} suffix="%" /></span>
              </span>
              <span className="mt-2 block max-w-[30ch] text-sec leading-[1.4] text-mist">
                the first figure ten years earlier: the same survey, the same question, a rise of
                ten points
              </span>
              <span className="mt-1 block text-fine text-ruling">
                CDC YRBS Data Summary and Trends Report, 2013 to 2023
              </span>
            </figcaption>
            {/* the two year labels live in HTML, not in the viewBox: text inside
                a scaled SVG shrinks below 12px the moment the column narrows */}
            <div className="mt-auto max-w-[168px] pt-3 lg:max-w-[200px]">
              <ThenNow />
              <div className="mt-1 grid grid-cols-2 text-center text-fine text-ruling">
                <span>2013</span>
                <span>2023</span>
              </div>
            </div>
          </figure>
        </ScrollRow>
      </div>

      {/* ── 2. The gap, in one row ───────────────────────────────────────
          The strongest single fact on the page, so it gets the rule above it
          and the largest figure on the band. It is a row and not a fourth
          column because it is counted out of a different hundred: the three
          above are out of all high school students, this one is out of the
          adolescents who had an episode. A fourth column would have implied
          one denominator for all four. */}
      <ScrollIn className="mt-7 border-t border-ink-3 pt-6">
        <figure className="m-0 flex flex-wrap items-center gap-x-9 gap-y-4"
          aria-label={'1 in 5 US adolescents aged 12 to 17, or 20.1 percent, had a major ' +
            'depressive episode in the past year, and 3 in 5 of them, or 59.4 percent, ' +
            'received no treatment for it. Source: NIMH, from NSDUH 2021.'}>
          {/* The figure and its five marks are one object and never separate.
              Left as three siblings in one wrapping row, a phone gave the
              sentence the 50px left over beside them and set it one word to
              the line. */}
          <div className="flex shrink-0 items-center gap-6">
            <p className="font-display text-gap font-bold leading-none text-accent-lit">3 in 5</p>
            <div className="w-[112px] shrink-0"><ThreeOfFive /></div>
          </div>
          {/* basis is what makes the sentence take its own line rather than a
              column: under 18rem of space left in the row, it wraps. */}
          <figcaption className="min-w-0 max-w-[58ch] flex-1 basis-[18rem] text-sec leading-[1.4]
            text-mist">
            of the 1 in 5 US adolescents aged 12 to 17 who had a major depressive episode in the
            past year received no treatment for it
            <span className="mt-1 block text-fine text-ruling">
              20.1% and 59.4%. NIMH, from NSDUH 2021
            </span>
          </figcaption>
          {/* The two colours are named once, here, rather than on each mark. */}
          <div className="flex shrink-0 flex-wrap gap-x-5 gap-y-1.5 text-fine text-mist">
            <span className="flex items-center gap-2">
              <span aria-hidden className="size-3 rounded-chip bg-accent-lit" />No treatment
            </span>
            <span className="flex items-center gap-2">
              <span aria-hidden className="size-3 rounded-chip bg-beam" />Treatment
            </span>
          </div>
        </figure>
      </ScrollIn>

      {/* Both sources, on the band that carries the figures. paper on ink is
          14.47 : 1 and the accent.lit underline is 7.67, so the links are
          legible as links and not only as colour. */}
      <p className="mt-6 border-t border-ink-3 pt-4 text-fine text-mist">
        Sources:{' '}
        {SOURCES.map((s, i) => (
          <React.Fragment key={s.href}>
            {i > 0 && ' · '}
            <a href={s.href} target="_blank" rel="noreferrer"
              className="border-b border-accent-lit/50 text-paper hover:border-accent-lit">
              {s.label}
            </a>
          </React.Fragment>
        ))}
      </p>
    </div>
  )
}
