import React from 'react'
import { cn } from '../lib/utils'

// Every figure in this file is sourced. CDC YRBS 2023 reads 39.7% and 20.4%; the trend is the same
// YRBS question a decade apart. These measure one self-reported question, not mental illness.
export const SOURCES = [
  { label: 'CDC, Youth Risk Behavior Survey, 2023',
    href: 'https://www.cdc.gov/yrbs/youth-health-in-focus/mental-health.html' },
  { label: 'NIMH, Major Depression, from NSDUH 2021',
    href: 'https://www.nimh.nih.gov/health/statistics/major-depression' },
]

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

function PctTrack({ value, lit = true, className }) {
  return (
    <span className={cn('block rounded-bar border border-ink-3 p-px', className)}>
      <span style={{ width: `${value}%` }}
        className={cn('block h-2.5 rounded-bar', lit ? 'bg-accent' : 'bg-beam')} />
    </span>
  )
}

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

// Zero baseline and a 50 point ceiling, so the 30% to 40% rise is shown to scale.
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

// Two scales: the second bar is the first bar's lit segment rescaled to its own hundred.
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

function Person({ cx, y, on }) {
  return (
    <g fill={on ? '#157446' : 'none'} stroke={on ? 'none' : '#426a58'} strokeWidth="0.9">
      <circle cx={cx} cy={y + 6} r="3.6"/>
      <rect x={cx - 6} y={y + 11} width="12" height="9.5" rx="4.6"/>
    </g>
  )
}

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
const KFF_FL = { label: 'KFF, Adolescents with a Major Depressive Episode in the Past Year, from NSDUH 2023 to 2024',
                 href: 'https://www.kff.org/mental-health/state-indicator/adolescents-with-a-major-depressive-episode-in-the-past-year/' }

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
      <svg viewBox="0 0 200 48" aria-hidden="true" focusable="false" className="block h-auto w-[220px] max-w-full">
        <rect x="0" y="0" width="200" height="10" rx="5" fill="none" stroke="#426a58" strokeWidth="0.9"/>
        <rect x="0" y="19" width="150" height="10" rx="5" fill="#a8321f"/>
        <rect x="0" y="38" width="110" height="10" rx="5" fill="none" stroke="#426a58" strokeWidth="0.9"/>
      </svg>) },
  // 225,000 (15.51%) is MHA 2023 as given in the Florida Hospital Association 2023 behavioral health brief.
  { big: '225,000+', wide: true, line: 'depressive episodes among Florida teens in just one year',
    exact: '256,000 Floridians aged 12 to 17, 2023 to 2024', src: KFF_FL,
    art: <People on={20} of={20}/> },
]

export function ProblemFigures({ className }) {
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

// No entrance animation: nested opacity animations multiply and drop the small print below 4.5:1 on load.
export function ProblemStats({ className }) {
  return (
    <div className={cn(className)}>
      <div className="grid gap-x-7 gap-y-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,15rem)]">
        <div className="lg:col-start-1 lg:row-start-1"><SurveyChart /></div>
        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <TrendChart />
        </div>
        <div className="border-t border-rule pt-5 lg:col-start-1 lg:row-start-2">
          <TreatmentGap />
        </div>

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
