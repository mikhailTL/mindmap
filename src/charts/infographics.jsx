import React from 'react'
import { SENSORS } from '../lib/sensors'
import { cn } from '../lib/utils'
import { SCORE, NOTES, LOCATION, PRO } from '../lib/terms'

// Illustrative trace shapes, not readings, in viewBox units; lower y is higher on screen.
const TRACE = {
  heart: 'M0 20 L8 20 L11 8 L14 30 L17 20 L26 20 L34 20 L37 9 L40 31 L43 20 L52 20 L60 20 L63 8 L66 30 L69 20 L80 20',
  sweat: 'M0 30 L10 30 L14 30 Q18 30 20 14 Q22 6 26 12 Q30 18 33 28 L40 30 Q46 30 48 16 Q51 8 55 15 Q58 22 62 29 L80 30',
  temp:  'M0 12 C12 12 18 14 26 17 C36 21 44 22 54 21 C64 20 72 18 80 15',
  move:  'M0 20 L6 20 L8 17 L10 23 L12 20 L30 20 L32 19 L34 21 L36 20 L60 20 L62 16 L64 24 L66 20 L80 20',
}
// [top, bottom] of the usual band, the baseline, and the point where the shape first leaves the band.
const BAND = {
  heart: { band: [15, 25], base: 20, out: [37, 9],  says: 'beats faster, with more even gaps between beats' },
  sweat: { band: [24, 33], base: 30, out: [22, 7],  says: 'rises first, and fastest, when the body tenses' },
  temp:  { band: [10, 19], base: 14, out: [54, 21], says: 'drifts down under strain and back up on settling' },
  move:  { band: [17, 23], base: 20, out: [62, 16], says: 'spikes when you move, so exercise is not read as stress' },
}

export function SignalTrace({ kind, muted = false, className }) {
  const s = SENSORS[kind]
  const g = BAND[kind]
  if (!s || !g) return null
  const [hi, lo] = g.band
  return (
    <svg viewBox="0 0 80 36" preserveAspectRatio="none" role="img" focusable="false"
      aria-label={`${s.name}, ${s.unit}. This is an example shape against the usual range, not a real reading. `
        + `Under stress it ${g.says}.`}
      className={cn('h-10 w-full', className)}>
      {/* the usual range, and the middle of it */}
      <rect x="0" y={hi} width="80" height={lo - hi} className="fill-ink-3 opacity-[0.1]" />
      <path d={`M0 ${hi} H80 M0 ${lo} H80`} fill="none" className="stroke-ink-3" strokeWidth="1"
        strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
      <path d={`M0 ${g.base} H80`} fill="none" className="stroke-ink-3" strokeWidth="1"
        vectorEffect="non-scaling-stroke" />
      <path d={TRACE[kind]} fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
        stroke={muted ? '#93b2a1' : (s.glow || s.color)} vectorEffect="non-scaling-stroke" />
      <circle cx={g.out[0]} cy={g.out[1]} r="2.6" fill={muted ? '#93b2a1' : (s.glow || s.color)}
        className="stroke-card" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

// Per audience: 2 shared, 1 shared only with consent, 0 not shared.
const WHAT = [
  { label: `${SCORE} for the day`,        rule: 'Shared unless the student turns it off' },
  { label: 'Which days ran high',         rule: 'Shared unless the student turns it off' },
  { label: 'Every reading, second by second', rule: 'Never shared' },
  { label: NOTES,                         rule: 'Never shared' },
  { label: LOCATION,                      rule: 'Never shared' },
]
const SEES = [
  { who: 'Student', sees: [2, 2, 2, 2, 2] },
  { who: 'Parent',  sees: [1, 1, 0, 0, 0] },
  { who: PRO,       sees: [1, 1, 0, 0, 0] },
]
const STATE = { 2: 'Always', 1: 'Only if the student agrees', 0: 'Never' }

function Mark({ v }) {
  return (
    <span aria-hidden="true" className="flex shrink-0 items-center justify-center" title={STATE[v]}>
      {v === 2 && <svg viewBox="0 0 20 20" aria-hidden className="size-5 text-accent">
        <circle cx="10" cy="10" r="8" fill="currentColor"/>
        {/* card #ffffff reads 6.65 : 1 on accent. */}
        <path d="M6 10.5l2.6 2.6L14 8" fill="none" className="stroke-card" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      {v === 1 && <svg viewBox="0 0 20 20" aria-hidden className="size-5 text-accent">
        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M10 2a8 8 0 010 16z" fill="currentColor"/></svg>}
      {v === 0 && <svg viewBox="0 0 20 20" aria-hidden className="size-5 text-ink-3">
        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".5"/>
        <path d="M6.5 13.5l7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
    </span>
  )
}

const COLS = 'md:grid md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] md:items-start md:gap-4'

export function WhoSeesWhat({ className }) {
  return (
    <figure className={cn('m-0', className)}>
      <div className="overflow-hidden rounded-panel border border-rule bg-card">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-rule px-4 py-3
          text-sec text-ink-2">
          {[2, 1, 0].map(v => (
            <span key={v} className="flex items-center gap-2"><Mark v={v}/> {STATE[v]}</span>
          ))}
        </div>
        <div className={cn('hidden bg-mist/60 px-4 py-2.5', COLS)}>
          <p className="text-tick text-ink-3">What</p>
          {SEES.map(p => (
            <p key={p.who} className="font-display text-ui font-bold leading-[1.2] text-ink">{p.who}</p>
          ))}
        </div>

        <ul role="list" className="m-0 list-none p-0">
          {WHAT.map((w, i) => (
            <li key={w.label} className={cn('border-t border-rule px-4 py-3 first:border-t-0 md:first:border-t', COLS)}>
              <div className="min-w-0">
                <p className="text-sec leading-[1.4] text-ink">{w.label}</p>
                <p className="mt-0.5 text-fine leading-[1.4] text-ink-3">{w.rule}</p>
              </div>
              {SEES.map(p => (
                <p key={p.who} className="mt-2 flex items-start gap-2 text-fine leading-[1.4] md:mt-0">
                  <Mark v={p.sees[i]}/>
                  <span className="min-w-0">
                    <span className="text-ink-3 md:hidden">{p.who}: </span>
                    <span className={p.sees[i] === 0 ? 'text-ink-3' : 'text-ink-2'}>{STATE[p.sees[i]]}</span>
                  </span>
                </p>
              ))}
            </li>
          ))}
        </ul>

        <figcaption className="border-t border-rule px-4 py-3 text-sec text-ink-3">Crisis alerts
          are the one exception. Students are told this before they start.</figcaption>
      </div>
    </figure>
  )
}

// The scale is the band plus headroom rather than 0 to 100, so the week is not flattened.
export function WeekStrip({ days, band, className }) {
  const rows = Array.isArray(days) ? days.filter(d => d && Number.isFinite(d.v)) : []
  const lo = Number.isFinite(band?.lo) ? band.lo : 0
  const hi = Number.isFinite(band?.hi) ? band.hi : 1
  if (!rows.length || hi <= lo) return null

  const span = hi - lo
  const top = Math.max(hi, ...rows.map(d => d.v)) + span * 0.45
  const bot = Math.min(lo, ...rows.map(d => d.v)) - span * 0.45
  const y = v => ((Math.min(top, Math.max(bot, v)) - bot) / (top - bot)) * 100
  const x = i => ((i + 0.5) / rows.length) * 100
  const over = rows.filter(d => d.v > hi)

  return (
    <figure className={cn('m-0', className)}>
      <div className="relative h-16" role="img"
        aria-label={`${rows.length} days against a usual range of ${lo} to ${hi}. `
          + (over.length
            ? `Days above it: ${over.map(d => `${d.d} ${d.v}`).join(', ')}.`
            : 'No day was above it.')}>
        <span aria-hidden="true" style={{ bottom: `${y(lo)}%`, height: `${y(hi) - y(lo)}%` }}
          className="absolute inset-x-0 block border-y border-accent/40 bg-accent/10"/>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"
          className="absolute inset-0 h-full w-full">
          <polyline fill="none" className="stroke-ink-3" strokeWidth="1" strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            points={rows.map((d, i) => `${x(i)},${100 - y(d.v)}`).join(' ')}/>
        </svg>
        {rows.map((d, i) => (
          <span key={d.d} aria-hidden="true" style={{ left: `${x(i)}%`, bottom: `${y(d.v)}%` }}
            className={cn('absolute block -translate-x-1/2 translate-y-1/2',
              d.v > hi ? 'size-2.5 rotate-45 bg-warn' : 'size-2 rounded-chip bg-accent')}/>
        ))}
      </div>
      <div aria-hidden="true" className="mt-1.5 flex">
        {rows.map(d => (
          <span key={d.d} className="flex-1 text-center text-tick text-ink-3">{d.d[0]}</span>
        ))}
      </div>
      <div aria-hidden="true" className="flex">
        {rows.map(d => (
          <span key={d.d} className="flex-1 text-center text-fine tabular-nums text-ink-2">
            {d.v > hi ? d.v : ''}
          </span>
        ))}
      </div>
      <figcaption className="mt-1 text-fine leading-[1.4] text-ink-3">
        The usual range is <span className="tabular-nums text-ink-2">{lo} to {hi}</span>. Days
        above it are marked, with their score printed under them.
      </figcaption>
    </figure>
  )
}
