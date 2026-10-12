import React from 'react'
import { Tally, ScrollIn, ScrollRow } from '../ui/motion'
import { cn } from '../lib/utils'

/* The problem band, under the hero.
 * STATISTICS RULES — externally constrained. Do not alter or drop these, and
 * add nothing to this file that is not sourced. If a chart wants a shape the
 * data does not have, the chart changes.
 *   - Every figure carries its exact percentage on screen and names its source
 *     once: in the Sources row at the foot of the band, or, for the trend, on
 *     its own line (its document is not one of the two in SOURCES).
 *   - CDC YRBS 2023 reads 39.7% and 20.4%. 42% and 22% are the 2021 numbers
 *     and were once printed against 2023 by mistake.
 *   - No "150% rise since 2010": no consistent instrument supports it. The
 *     trend panel shows the same YRBS question a decade apart, 30% to 40%.
 *     NSDUH cannot be spliced across its 2020 redesign.
 *   - None of this measures "mental illness". It measures one self-reported
 *     question.
 * MindMap does not detect, diagnose, prevent or treat anything and is not a
 * medical device. */

export const SOURCES = [
  { label: 'CDC, Youth Risk Behavior Survey, 2023',
    href: 'https://www.cdc.gov/yrbs/youth-health-in-focus/mental-health.html' },
  { label: 'NIMH, Major Depression, from NSDUH 2021',
    href: 'https://www.nimh.nih.gov/health/statistics/major-depression' },
]

/* Dark band only. accent #0a6e68 measures 2.62 : 1 on ink and is unusable
   there, so the lit quantity is accent.lit (7.67 : 1), the second quantity beam
   (4.53 : 1, graphic only), the remainder ink.3, the type mist and ruling. */
const LIT = '#3fd6c4'   /* accent.lit, the quantity being counted */
const REST = '#3c6a74'  /* ink.3, the denominator it is counted out of */
const PAIR = '#1d8fb0'  /* beam, the other half of a two-way split */

/* ── 1. How big it is, and which way it is going ───────────────────────── */

/* A hundred-figure array, not a bar. The mark fills more of its 10-unit cell
   than a naive figure would and the head sits closer to its own shoulders than
   to the head below: at 104px a cell is 10.4px, and looser proportions join a
   column of marks into one string of dots. It is a supporting mark, sized under
   the figure it belongs to and not against the column it sits in. aria-hidden;
   the figure is in large type above it. */
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
      className={cn('block h-auto w-full max-w-[104px] lg:max-w-[120px]', className)}>
      {cells}
    </svg>
  )
}

/* Zero baseline, 1.5 units per point, dashed rule carrying the 2013 level
   across. A truncated axis would make the rise look like the 150% the data
   does not support. */
function ThenNow({ className }) {
  return (
    <svg viewBox="0 0 100 86" aria-hidden="true"
      className={cn('block h-auto w-full', className)}>
      <rect x="10" y="31" width="30" height="45" rx="2" fill={REST} />
      <rect x="60" y="16" width="30" height="60" rx="2" fill={LIT} />
      <path d="M10 31 L90 31" fill="none" stroke="#8eb0b6" strokeWidth="0.8"
        strokeDasharray="3 3" />
      <path d="M4 76 L96 76" fill="none" stroke={REST} strokeWidth="1" />
    </svg>
  )
}

/* Five marks, one lit: of all adolescents aged 12 to 17, the one in five with
   a major depressive episode in the past year. Both rows use the same
   five-mark unit and the label over each row says which five it is. */
function OneOfFive({ className }) {
  const marks = [LIT, REST, REST, REST, REST]
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

/* Five marks, three lit. These five are the five the row above found, not five
   adolescents. */
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
      <div className="mt-4 grid gap-x-7 gap-y-8 sm:grid-cols-3">
        {ROW.map((h, i) => (
          <ScrollRow key={h.pct} index={i} className="h-full">
            {/* figcaption has to be the figure's first or last child, and it
                comes first here: number, what it is of, exact figure, then the
                array. */}
            <figure className="m-0 flex h-full flex-col">
              <figcaption>
                {/* min-h keeps the three captions on one line with each other
                    even though the third figure is a step smaller */}
                <span className="flex min-h-[2.75rem] items-end font-display text-dial font-bold
                  tabular-nums leading-none text-accent-lit">
                  <Tally to={h.pct} suffix="%" />
                </span>
                <span className="mt-2 block max-w-[30ch] text-sec leading-[1.4] text-mist">{h.of}</span>
                <span className="mt-1 block text-fine text-ruling">{h.exact}</span>
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
              {/* Names the figure, does not read it out: the two bars, the
                  dashed 2013 level and the year labels are the rise. */}
              <span className="mt-2 block max-w-[30ch] text-sec leading-[1.4] text-mist">
                the first figure, ten years earlier
              </span>
              <span className="mt-1 block text-fine text-ruling">
                CDC YRBS Data Summary and Trends Report, 2013 to 2023
              </span>
            </figcaption>
            {/* year labels live in HTML, not the viewBox: text inside a scaled
                SVG shrinks below 12px as the column narrows */}
            <div className="mt-auto max-w-[116px] pt-3 lg:max-w-[132px]">
              <ThenNow />
              <div className="mt-1 grid grid-cols-2 text-center text-fine text-ruling">
                <span>2013</span>
                <span>2023</span>
              </div>
            </div>
          </figure>
        </ScrollRow>
      </div>

      {/* ── 2. The treatment gap, as two figures that nest ─────────
          Row one is counted out of all adolescents aged 12 to 17; row two out
          of row one, so it is indented behind a rule and labelled as a part of
          that group. Each row keeps its own exact percentage and both come
          from the one NIMH entry in the Sources row. A row and not a fourth
          column: the three figures above are counted out of all high school
          students and these two are not. */}
      <ScrollIn className="mt-7 border-t border-ink-3 pt-6">
        <p className="text-fine text-ruling">Among US adolescents aged 12 to 17</p>

        <figure className="m-0 mt-4 flex flex-wrap items-center gap-x-8 gap-y-3"
          aria-label={'1 in 5 US adolescents aged 12 to 17, or 20.1 percent, had a major '
            + 'depressive episode in the past year. Source: NIMH, from NSDUH 2021.'}>
          {/* The figure and its five marks are one object: as loose siblings
              in a wrapping row, a phone sets the sentence one word to the
              line. */}
          <div className="flex shrink-0 items-center gap-5">
            <p className="font-display text-stat font-bold leading-none text-accent-lit">1 in 5</p>
            <div className="w-[72px] shrink-0"><OneOfFive /></div>
          </div>
          <figcaption className="min-w-0 max-w-[52ch] flex-1 basis-[17rem] text-sec leading-[1.4]
            text-mist">
            had a major depressive episode in the past year
            <span className="mt-1 block text-fine text-ruling">20.1%</span>
          </figcaption>
        </figure>

        {/* Same left edge as the indented figure under it: pl-5 on a phone,
            ml-6 plus pl-5 from sm up. */}
        <p className="mt-6 pl-5 text-fine text-ruling sm:pl-11">Within that group</p>
        <figure className="m-0 mt-2 flex flex-wrap items-center gap-x-8 gap-y-3 border-l-2
          border-ink-3 pl-5 sm:ml-6"
          aria-label={'3 in 5 of the adolescents who had a major depressive episode in the past '
            + 'year, or 59.4 percent, received no treatment for it. Source: NIMH, from '
            + 'NSDUH 2021.'}>
          <div className="flex shrink-0 items-center gap-5">
            <p className="font-display text-gap font-bold leading-none text-accent-lit">3 in 5</p>
            <div className="w-[78px] shrink-0"><ThreeOfFive /></div>
          </div>
          <figcaption className="min-w-0 max-w-[52ch] flex-1 basis-[17rem] text-sec leading-[1.4]
            text-mist">
            received no treatment for it
            <span className="mt-1 block text-fine text-ruling">59.4%</span>
            {/* Inside the caption so the caption stays the figure's last
                child. */}
            <span className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-fine text-mist">
              <span className="flex items-center gap-2">
                <span aria-hidden className="size-3 rounded-chip bg-accent-lit" />No treatment
              </span>
              <span className="flex items-center gap-2">
                <span aria-hidden className="size-3 rounded-chip bg-beam" />Treatment
              </span>
            </span>
          </figcaption>
        </figure>
      </ScrollIn>

      {/* paper on ink is 14.47 : 1 and the accent.lit underline 7.67, so the
          links read as links and not only as colour. */}
      <p className="mt-6 border-t border-ink-3 pt-4 text-fine text-mist">
        Sources:{' '}
        {SOURCES.map((s, i) => (
          <React.Fragment key={s.href}>
            {i > 0 && ' · '}
            <a href={s.href} target="_blank" rel="noreferrer"
              className="border-b border-accent-lit/50 text-paper hoverOnly:border-accent-lit">
              {s.label}
            </a>
          </React.Fragment>
        ))}
      </p>
    </div>
  )
}
