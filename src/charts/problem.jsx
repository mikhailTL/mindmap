import React from 'react'
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
 * its source.
 *
 * CONTRAST ON THIS BAND, WHICH IS NOW LIGHT. Spec 0c retired the near-black
 * ground: the band is bg-paper and the panel behind these figures is card,
 * #ffffff. Every pair below was measured against #ffffff:
 *   ink        #0d2b1e  14.92 : 1   headings and the source links
 *   ink-2      #2a5744   8.31 : 1   body copy, and the value over each bar
 *   ink-3      #426a58   5.99 : 1   small print, axis labels, axis rules
 *   accent.ink #0f5836   8.79 : 1   the headline figures
 *   accent     #157446   6.10 : 1   the lit bar (graphic; clears as text too)
 *   beam       #1d8fb0   3.74 : 1   the second bar, graphic only, never a word
 * The three colours this band used to run on all fail outright on white and
 * are gone from this file: ruling 2.32 : 1, mist 1.21 : 1, accent.lit 1.81.
 * Colour is never the only carrier: every quantity is also printed in type. */

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
    <div aria-hidden="true" className={cn('relative h-7 border-t border-ink-3', className)}>
      {ticks.map(t => (
        <span key={`t${t}`} style={{ left: `${t}%` }}
          className="absolute top-0 block h-1 w-px -translate-x-1/2 bg-ink-3" />
      ))}
      {ticks.map((t, i) => (
        <span key={t} style={{ left: `${t}%` }}
          className={cn('absolute top-1.5 whitespace-nowrap text-fine tabular-nums text-ink-3',
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
    <span className={cn('block rounded-bar border border-ink-3 p-px', className)}>
      <span style={{ width: `${value}%` }}
        className={cn('block h-2.5 rounded-bar', lit ? 'bg-accent' : 'bg-beam')} />
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
      <figcaption className="text-fine text-ink-3">
        Out of every 100 US high school students, 2023
      </figcaption>
      <ul className="m-0 mt-3 grid list-none gap-4 p-0">
        {Y2023.map(h => (
          <li key={h.pct}>
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <span className="text-head font-bold tabular-nums leading-none text-accent-ink">
                {h.pct}%
              </span>
              <span className="text-fine text-ink-3">of students, {h.exact}% exact</span>
            </div>
            <p className="mt-1 max-w-[46ch] text-sec leading-[1.4] text-ink-2">{h.of}</p>
            <PctTrack className="mt-2" value={h.exact} />
          </li>
        ))}
      </ul>
      <PctAxis className="mt-1.5" ticks={[0, 25, 50, 75, 100]} />
      <p className="mt-0.5 text-fine text-ink-3">Per 100 students. Outline: the hundred.</p>
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
      <figcaption className="text-fine text-ink-3">
        The first question, ten years apart
      </figcaption>
      <div className="mt-3 flex gap-2">
        {/* The y axis labels are HTML and not <text> in the viewBox: type inside
            a scaled SVG shrinks with the column and fails the contrast sweep at
            the one width where it matters most. */}
        <div aria-hidden="true" className="relative h-[150px] w-6 shrink-0">
          {TREND_TICKS.map(t => (
            <span key={t} style={{ bottom: `${(t / TREND_MAX) * 100}%` }}
              className="absolute right-0 translate-y-1/2 whitespace-nowrap text-fine
                tabular-nums text-ink-3">
              {t}
            </span>
          ))}
        </div>
        <div className="relative h-[150px] min-w-0 flex-1 border-b border-l border-ink-3">
          {TREND_TICKS.map(t => (
            <span key={t} aria-hidden="true" style={{ bottom: `${(t / TREND_MAX) * 100}%` }}
              className="absolute inset-x-0 block h-px bg-rule" />
          ))}
          {/* the 2013 level, carried across */}
          <span aria-hidden="true" style={{ bottom: `${(30 / TREND_MAX) * 100}%` }}
            className="absolute inset-x-0 block border-t border-dashed border-ink-3" />
          <div className="absolute inset-0 flex items-end">
            {TREND.map(b => (
              <div key={b.year} className="relative flex h-full flex-1 items-end justify-center">
                <span style={{ height: `${(b.pct / TREND_MAX) * 100}%` }}
                  className={cn('block w-6 rounded-t-xs', b.lit ? 'bg-accent' : 'bg-beam')} />
                <span style={{ bottom: `${(b.pct / TREND_MAX) * 100}%` }}
                  className="absolute left-1/2 mb-1 -translate-x-1/2 text-meta tabular-nums text-ink-2">
                  {b.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="mt-1 flex gap-2 pl-8">
        {TREND.map(b => (
          <span key={b.year} className="flex-1 text-center text-fine tabular-nums text-ink-3">
            {b.year}
          </span>
        ))}
      </div>
      <p className="mt-2.5 max-w-[34ch] text-sec leading-[1.4] text-ink-2">
        felt persistently sad or hopeless for two weeks or more
        <span className="mt-1 block text-fine tabular-nums text-ink-3">
          A rise of 10 points. Dashed: the 2013 level.
        </span>
        <span className="mt-1 block text-fine text-ink-3">
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
      <path d={`M0 0 V10 M${GAP_EPISODE} 0 L100 10`} fill="none" className="stroke-ink-3"
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
        <figcaption className="text-fine text-ink-3">
          Out of every 100 US adolescents aged 12 to 17
        </figcaption>

        <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <span className="text-row font-bold tabular-nums leading-none text-accent-ink">
            1 in 5
          </span>
          <span className="text-sec leading-[1.4] text-ink-2">
            had a major depressive episode in the past year
          </span>
          <span className="text-fine tabular-nums text-ink-3">20.1%</span>
        </div>
        <PctTrack className="mt-2" value={GAP_EPISODE} />
        <GapConnector />

        {/* The second bar is the segment above, opened out to its own hundred,
            so the two percentages never look as though they share a scale. */}
        <p className="text-fine text-ink-3">
          Those 20.1%, counted again out of 100
        </p>
        <span className="mt-1.5 flex gap-[2px] rounded-bar border border-ink-3 p-px">
          <span style={{ width: `${GAP_UNTREATED}%` }} className="block h-2.5 rounded-l-bar bg-accent" />
          <span className="block h-2.5 flex-1 rounded-r-bar bg-beam" />
        </span>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <span className="text-row font-bold tabular-nums leading-none text-accent-ink">
            3 in 5
          </span>
          <span className="text-sec leading-[1.4] text-ink-2">received no treatment for it</span>
          <span className="text-fine tabular-nums text-ink-3">59.4%</span>
        </div>
        {/* Colour is never the only carrier: each block is named here and the
            figure above prints its own percentage. */}
        <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-fine text-ink-2">
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="size-3 rounded-chip bg-accent" />No treatment, 59.4%
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

/* The owner, 15 October: no "the first figure, ten years apart" wording,
   the statistics from his own paragraph, and "the green people that showed
   1 in 7 and 1 in 5" back instead of bars. Every figure below carries its
   exact value and its source in small print; the rules at the top of this
   file hold. Two of his figures were replaced because no source supports
   them as written and the owner's own rule is approved statistics only:
   "nearly 70% undiagnosed" is NIMH's 59.4% untreated, and "+126% since
   2010" is the same YRBS question a decade apart, 30% to 40%. The Florida
   40% is the national 2023 figure (Florida left the YRBS in 2022); the
   Florida line here is the one Florida figure with a source, 20.1% with a
   major depressive episode. */

/* One person: a head and a rounded body, 20 units wide. Filled in the
   accent green for the people the figure counts, outlined in ink-3 for the
   rest, so the ratio reads before the number does. */
function Person({ cx, y, on }) {
  return (
    <g fill={on ? '#157446' : 'none'} stroke={on ? 'none' : '#426a58'} strokeWidth="0.9">
      <circle cx={cx} cy={y + 6} r="3.6"/>
      <rect x={cx - 6} y={y + 11} width="12" height="9.5" rx="4.6"/>
    </g>
  )
}

/* `of` people in a row, the first `on` of them filled. Rows wrap at ten. */
function People({ on, of, className }) {
  const perRow = Math.min(of, 10)
  const rows = Math.ceil(of / perRow)
  const W = perRow * 20, H = rows * 24
  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false"
      className={cn('block h-auto', className)} style={{ width: `${perRow * 22}px`, maxWidth: '100%' }}>
      {Array.from({ length: of }, (_, i) => (
        <Person key={i} cx={10 + (i % perRow) * 20} y={Math.floor(i / perRow) * 24} on={i < on}/>
      ))}
    </svg>
  )
}

const WHO = { label: 'WHO, Mental health of adolescents, 2025',
              href: 'https://www.who.int/news-room/fact-sheets/detail/mental-health-of-adolescents' }
const FL  = { label: 'SAMHSA, Behavioral Health Barometer, Florida, 2021 to 2023',
              href: 'https://www.samhsa.gov/data/sites/default/files/reports/rpt56788/2023-nsduh-barometer-florida.pdf' }
const NIMH_SUICIDE = { label: 'NIMH, Suicide, from CDC WISQARS 2023',
              href: 'https://www.nimh.nih.gov/health/statistics/suicide' }
const TRENDS = { label: 'CDC YRBS Trends, 2013 to 2023', href: 'https://www.cdc.gov/yrbs/dstr/index.html' }

const FIGURES = [
  { big: '1 in 7', line: 'teens live with a mental health condition globally',
    exact: '14.3% of 10 to 19 year olds, worldwide', src: WHO,
    art: <People on={1} of={7}/> },
  { big: '1 in 5', line: 'Florida teens had a major depressive episode in a year',
    exact: '20.1% of Floridians aged 12 to 17', src: FL,
    art: <People on={1} of={5}/> },
  { big: '3 in 5', line: 'with depression received no treatment',
    exact: '59.4%, aged 12 to 17, US', src: SOURCES[1],
    art: <People on={3} of={5}/> },
  { big: '40%', line: 'felt sad or hopeless for two weeks or more',
    exact: '39.7% of US high school students, 2023', src: SOURCES[0],
    art: <People on={4} of={10}/> },
  { big: '#2', line: 'cause of death from age 10 to 34 is suicide',
    exact: 'United States, 2023', src: NIMH_SUICIDE,
    art: (
      /* A rank, drawn as three rows; the second is the one. Red is the
         product's alarm colour and this is the one alarm on the page. */
      <svg viewBox="0 0 200 48" aria-hidden="true" focusable="false" className="block h-auto w-[220px] max-w-full">
        <rect x="0" y="0" width="200" height="10" rx="5" fill="none" stroke="#426a58" strokeWidth="0.9"/>
        <rect x="0" y="19" width="150" height="10" rx="5" fill="#a8321f"/>
        <rect x="0" y="38" width="110" height="10" rx="5" fill="none" stroke="#426a58" strokeWidth="0.9"/>
      </svg>) },
  { big: '30%\u00a0→\u00a040%', wide: true, line: 'felt sad or hopeless, 2013 against 2023',
    exact: 'Same question, same survey, ten years on', src: TRENDS,
    art: (
      <div className="flex flex-col gap-1">
        <People on={3} of={10}/>
        <People on={4} of={10}/>
      </div>) },
]

export function ProblemFigures({ className }) {
  /* The owner, 16 October: no sources on the band, the numbers as large as
     they go. The exact value and the source stay on each figure for a screen
     reader and as a hover title, so the file's sourcing rule still holds. */
  return (
    <div className={cn('grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {FIGURES.map(f => (
        <figure key={f.big} className="m-0" title={`${f.exact}. ${f.src.label}`}
          aria-label={`${f.big} ${f.line}. ${f.exact}. Source: ${f.src.label}.`}>
          <p className={cn('whitespace-nowrap font-display font-bold tabular-nums leading-none text-accent-ink',
            f.wide ? 'text-major' : 'text-fig')}>{f.big}</p>
          <div className="mt-3">{f.art}</div>
          <p className="mt-3 max-w-[22ch] font-display text-row font-semibold leading-[1.25] text-ink">{f.line}</p>
        </figure>
      ))}
    </div>
  )
}

/* The two headline figures are printed, never counted up to. A count-up starts
   at zero and passes through numbers that are not the statistic, and these sit
   beside their own exact values: a reader scrolling past saw "24%" next to
   "39.7% exact". A published figure is not an animation.
 *
 * NO ENTRANCE ANIMATION IN THIS FILE EITHER, AND THE SAME REASON. The three
 * figures were each wrapped in a ScrollIn, inside the band's own ScrollIn in
 * views/Overview.jsx. Two opacity animations on one subtree MULTIPLY, and the
 * pair was measured on a 1280 load at 0.76 x 0.76 = 0.575 effective: at that
 * value ink-3 small print falls to 2.48 : 1 and ink-2 to 2.89, while the
 * accent-ink headline figure still holds 3.02 and still reads at display size.
 * That is exactly what a full-page capture of this band showed - "40%" in
 * teal beside an invisible "of students, 39.7% exact" - and it is what any
 * reader sees for the first second or so of every load, because the arrival
 * watcher in ui/motion.jsx hides anything below the fold at opacity 0 and only
 * restores it on a scroll event or a 1500ms fallback timer, and a page that
 * reflows content into view (a lazy photograph, a late-mounting route) fires
 * neither.
 * A sourced statistic is content, not an entrance. The band around this one is
 * free to animate; the figures inside it do not, so nothing here can be hidden
 * by a second, compounding factor and the type is readable in the first frame
 * it is painted. */
export function ProblemStats({ className }) {
  return (
    <div className={cn(className)}>
      {/* The trend holds the right-hand column for both rows, so the treatment
          gap rises into the space beside it instead of leaving a third of the
          panel empty. On a phone the grid is one column and the order is the
          reading order: the survey, then its ten year comparison, then the
          figure counted out of a different population. */}
      <div className="grid gap-x-7 gap-y-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,15rem)]">
        <div className="lg:col-start-1 lg:row-start-1"><SurveyChart /></div>
        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <TrendChart />
        </div>
        <div className="border-t border-rule pt-5 lg:col-start-1 lg:row-start-2">
          <TreatmentGap />
        </div>

        {/* The sources sit under the trend at lg, which is where the second
            column would otherwise run out of content, and under everything on a
            phone. ink on card is 14.92 : 1 and the accent underline
            6.10, so the links read as links and not only as colour. */}
        <p className="border-t border-rule pt-4 text-fine text-ink-2
          lg:col-start-2 lg:row-start-2 lg:self-end">
          Sources:{' '}
          {SOURCES.map((s, i) => (
            <React.Fragment key={s.href}>
              {i > 0 && ' · '}
              <a href={s.href} target="_blank" rel="noreferrer"
                className="border-b border-accent/50 text-ink hoverOnly:border-accent">
                {s.label}
              </a>
            </React.Fragment>
          ))}
        </p>
      </div>
    </div>
  )
}
