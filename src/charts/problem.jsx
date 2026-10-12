import React from 'react'
import { Tally, ScrollIn, ScrollRow } from '../ui/motion'
import { cn } from '../lib/utils'

/* The problem band, under the hero.
 * STATISTICS RULES, externally constrained. Do not alter or drop these, and
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
 * medical device.
 *
 * WHY THESE ARE CHARTS AND NOT PICTOGRAMS. The band used to carry three big
 * numbers over hundred-figure arrays and the sentence "30% to 40%, the first
 * figure, ten years earlier", which is prose doing a chart's job: no scale, no
 * axis, no comparison a reader could measure. Every figure here now carries a
 * value, a unit, a scale with ticks, the denominator it is counted out of, and
 * its source. The arrays also failed on their own ground: ink-3 against the
 * band's blended surface measures 1.99 : 1, so nine hundred of the thousand
 * marks were invisible.
 *
 * CONTRAST ON THIS BAND. The panel behind these figures is ink-2 at 40% over
 * ink, which blends to about #133c45. Measured against it: paper 11.8 : 1,
 * mist 6.7, accent.lit 6.62, ruling 5.15, beam 4.53 (graphic only). accent,
 * ink-2 and ink-3 all fall under 2 : 1 here and are unusable, as a mark as
 * much as as a word. Every quantity below is therefore accent.lit or ruling,
 * and every one of them is also labelled in type. */

export const SOURCES = [
  { label: 'CDC, Youth Risk Behavior Survey, 2023',
    href: 'https://www.cdc.gov/yrbs/youth-health-in-focus/mental-health.html' },
  { label: 'NIMH, Major Depression, from NSDUH 2021',
    href: 'https://www.nimh.nih.gov/health/statistics/major-depression' },
]

/* ── Shared chart furniture ────────────────────────────────────────────── */

/* A percentage axis under a row of tracks. Tick marks sit exactly on their
   value; the two end labels are pulled inside their own ends, because a
   centred label at 100% paints past the panel. */
function PctAxis({ ticks, className }) {
  const last = ticks.length - 1
  return (
    <div aria-hidden="true" className={cn('relative h-7 border-t border-ruling', className)}>
      {ticks.map(t => (
        <span key={`t${t}`} style={{ left: `${t}%` }}
          className="absolute top-0 block h-1 w-px -translate-x-1/2 bg-ruling" />
      ))}
      {ticks.map((t, i) => (
        <span key={t} style={{ left: `${t}%` }}
          className={cn('absolute top-1.5 whitespace-nowrap font-mono text-fine tabular-nums text-ruling',
            i === 0 ? 'translate-x-0' : i === last ? '-translate-x-full' : '-translate-x-1/2')}>
          {t}
        </span>
      ))}
    </div>
  )
}

/* One quantity on a 0 to 100 track. The outline is the denominator: the reader
   can see the hundred it is counted out of, which a bare bar never shows. */
function PctTrack({ value, lit = true, className }) {
  return (
    <span className={cn('block rounded-bar border border-ruling p-px', className)}>
      <span style={{ width: `${value}%` }}
        className={cn('block h-2.5 rounded-bar', lit ? 'bg-accent-lit' : 'bg-ruling')} />
    </span>
  )
}

/* ── 1. The 2023 survey, both questions on one scale ───────────────────── */

const Y2023 = [
  { pct: 40, exact: 39.7, of: 'felt persistently sad or hopeless for two weeks or more' },
  { pct: 20, exact: 20.4, of: 'seriously considered attempting suicide' },
]

function SurveyChart() {
  return (
    <figure className="m-0">
      <figcaption className="text-fine text-ruling">
        Out of every 100 US high school students, 2023
      </figcaption>
      <ul className="m-0 mt-3 grid list-none gap-4 p-0">
        {Y2023.map(h => (
          <li key={h.pct}>
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <span className="font-mono text-head font-bold tabular-nums leading-none text-accent-lit">
                <Tally to={h.pct} suffix="%" />
              </span>
              <span className="text-fine text-ruling">of students, {h.exact}% exact</span>
            </div>
            <p className="mt-1 max-w-[46ch] text-sec leading-[1.4] text-mist">{h.of}</p>
            <PctTrack className="mt-2" value={h.exact} />
          </li>
        ))}
      </ul>
      <PctAxis className="mt-1.5" ticks={[0, 25, 50, 75, 100]} />
      <p className="mt-0.5 font-mono text-fine text-ruling">Per 100 students. Outline: the hundred.</p>
    </figure>
  )
}

/* ── 2. The same question, ten years apart ─────────────────────────────── */

/* Zero baseline and a 50 point ceiling, ticked every 10. A truncated axis would
   make the rise look like the 150% the data does not support, and the 2013
   level is carried across the plot so the ten point difference is a distance a
   reader can see rather than a subtraction they have to do. */
const TREND_MAX = 50
const TREND_TICKS = [0, 10, 20, 30, 40, 50]
const TREND = [
  { year: '2013', pct: 30, lit: false },
  { year: '2023', pct: 40, lit: true },
]

function TrendChart() {
  return (
    <figure className="m-0">
      <figcaption className="text-fine text-ruling">
        The first question, ten years apart
      </figcaption>
      <div className="mt-3 flex gap-2">
        {/* The y axis labels are HTML and not <text> in the viewBox: type inside
            a scaled SVG shrinks with the column and fails the contrast sweep at
            the one width where it matters most. */}
        <div aria-hidden="true" className="relative h-[150px] w-6 shrink-0">
          {TREND_TICKS.map(t => (
            <span key={t} style={{ bottom: `${(t / TREND_MAX) * 100}%` }}
              className="absolute right-0 translate-y-1/2 whitespace-nowrap font-mono text-fine
                tabular-nums text-ruling">
              {t}
            </span>
          ))}
        </div>
        <div className="relative h-[150px] min-w-0 flex-1 border-b border-l border-ruling">
          {TREND_TICKS.map(t => (
            <span key={t} aria-hidden="true" style={{ bottom: `${(t / TREND_MAX) * 100}%` }}
              className="absolute inset-x-0 block h-px bg-ruling/40" />
          ))}
          {/* the 2013 level, carried across */}
          <span aria-hidden="true" style={{ bottom: `${(30 / TREND_MAX) * 100}%` }}
            className="absolute inset-x-0 block border-t border-dashed border-ruling" />
          <div className="absolute inset-0 flex items-end">
            {TREND.map(b => (
              <div key={b.year} className="relative flex h-full flex-1 items-end justify-center">
                <span style={{ height: `${(b.pct / TREND_MAX) * 100}%` }}
                  className={cn('block w-6 rounded-t-xs', b.lit ? 'bg-accent-lit' : 'bg-ruling')} />
                <span style={{ bottom: `${(b.pct / TREND_MAX) * 100}%` }}
                  className="absolute left-1/2 mb-1 -translate-x-1/2 font-mono text-meta tabular-nums text-paper">
                  {b.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="mt-1 flex gap-2 pl-8">
        {TREND.map(b => (
          <span key={b.year} className="flex-1 text-center font-mono text-fine tabular-nums text-ruling">
            {b.year}
          </span>
        ))}
      </div>
      <p className="mt-2.5 max-w-[34ch] text-sec leading-[1.4] text-mist">
        felt persistently sad or hopeless for two weeks or more
        <span className="mt-1 block font-mono text-fine tabular-nums text-ruling">
          A rise of 10 points. Dashed: the 2013 level.
        </span>
        <span className="mt-1 block text-fine text-ruling">
          CDC YRBS Data Summary and Trends Report, 2013 to 2023
        </span>
      </p>
    </figure>
  )
}

/* ── 3. The treatment gap, as one quantity opened out ──────────────────── */

/* Two scales, not one: the first bar is counted out of all adolescents aged 12
   to 17 and the second is the first bar's lit segment rescaled to its own
   hundred. The connector is what says so. Drawn rather than written, because
   "3 in 5 of the 1 in 5" is the kind of sentence a reader has to re-read. */
const GAP_EPISODE = 20.1
const GAP_UNTREATED = 59.4

function GapConnector() {
  return (
    <svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"
      focusable="false" className="block h-3.5 w-full">
      <path d={`M0 0 V10 M${GAP_EPISODE} 0 L100 10`} fill="none" className="stroke-ruling"
        strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function TreatmentGap() {
  return (
    <div>
      <figure className="m-0"
        aria-label={'1 in 5 US adolescents aged 12 to 17, or 20.1 percent, had a major depressive '
          + 'episode in the past year. Of that group, 3 in 5, or 59.4 percent, received no '
          + 'treatment for it. Source: NIMH, from NSDUH 2021.'}>
        <figcaption className="text-fine text-ruling">
          Out of every 100 US adolescents aged 12 to 17
        </figcaption>

        <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <span className="font-mono text-row font-bold tabular-nums leading-none text-accent-lit">
            1 in 5
          </span>
          <span className="text-sec leading-[1.4] text-mist">
            had a major depressive episode in the past year
          </span>
          <span className="font-mono text-fine tabular-nums text-ruling">20.1%</span>
        </div>
        <PctTrack className="mt-2" value={GAP_EPISODE} />
        <GapConnector />

        {/* The second bar is the segment above, opened out to its own hundred,
            so the two percentages never look as though they share a scale. */}
        <p className="font-mono text-fine text-ruling">
          Those 20.1%, counted again out of 100
        </p>
        <span className="mt-1.5 flex gap-[2px] rounded-bar border border-ruling p-px">
          <span style={{ width: `${GAP_UNTREATED}%` }} className="block h-2.5 rounded-l-bar bg-accent-lit" />
          <span className="block h-2.5 flex-1 rounded-r-bar bg-beam" />
        </span>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <span className="font-mono text-row font-bold tabular-nums leading-none text-accent-lit">
            3 in 5
          </span>
          <span className="text-sec leading-[1.4] text-mist">received no treatment for it</span>
          <span className="font-mono text-fine tabular-nums text-ruling">59.4%</span>
        </div>
        {/* Colour is never the only carrier: each block is named here and the
            figure above prints its own percentage. */}
        <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-fine text-mist">
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="size-3 rounded-chip bg-accent-lit" />No treatment, 59.4%
          </span>
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="size-3 rounded-chip bg-beam" />Treatment
          </span>
        </p>
      </figure>
    </div>
  )
}

/* ── The band ──────────────────────────────────────────────────────────── */

export function ProblemStats({ className }) {
  return (
    <div className={cn(className)}>
      {/* The trend holds the right-hand column for both rows, so the treatment
          gap rises into the space beside it instead of leaving a third of the
          panel empty. On a phone the grid is one column and the order is the
          reading order: the survey, then its ten year comparison, then the
          figure counted out of a different population. */}
      <div className="grid gap-x-7 gap-y-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,15rem)]">
        <ScrollRow index={0} className="lg:col-start-1 lg:row-start-1"><SurveyChart /></ScrollRow>
        <ScrollRow index={1} className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <TrendChart />
        </ScrollRow>
        <ScrollIn className="border-t border-ink-3 pt-5 lg:col-start-1 lg:row-start-2">
          <TreatmentGap />
        </ScrollIn>

        {/* The sources sit under the trend at lg, which is where the second
            column would otherwise run out of content, and under everything on a
            phone. paper on ink is 14.47 : 1 and the accent.lit underline 7.67,
            so the links read as links and not only as colour. */}
        <p className="border-t border-ink-3 pt-4 text-fine text-mist
          lg:col-start-2 lg:row-start-2 lg:self-end">
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
    </div>
  )
}
