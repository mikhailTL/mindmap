import React from 'react'
import { SENSORS } from '../lib/sensors'
import { cn } from '../lib/utils'
import { SCORE, NOTES, LOCATION, PRO } from '../lib/terms'

/* The small figures that several pages share.
 *
 * All three were glyphs before: a bare squiggle, a matrix drawn as three
 * separate lists, and seven bars of one fixed height. Each now carries the
 * thing it was missing, which in every case was the comparison.
 *   - A trace is read against the wearer's own usual band, so a reader can see
 *     which part of it is out of the ordinary rather than being told.
 *   - Who sees what is one matrix: five things down, three audiences across,
 *     the rule that fixes each row, and a count per audience.
 *   - A week is seven values against the usual range, not seven equal bars
 *     coloured by a rule the reader cannot see.
 * None of them invents a measurement. The traces are illustrative shapes and
 * say so; the week comes from the fixture the caller passes; the consent
 * matrix is the consent model, which lib/caseload.js defines.
 */

/* ── The four signals, against the wearer's own usual range ─────────────── */

/* Each trace is an illustrative shape, not a reading: the product has never
   taken one off a patch. What is new here is BAND, the wearer's own usual
   range, drawn behind the trace. Every signal enters the network as a distance
   from that band, so a trace drawn without it was the one thing the figure
   existed to show, left out. Lower y is higher on screen. */
const TRACE = {
  heart: 'M0 20 L8 20 L11 8 L14 30 L17 20 L26 20 L34 20 L37 9 L40 31 L43 20 L52 20 L60 20 L63 8 L66 30 L69 20 L80 20',
  sweat: 'M0 30 L10 30 L14 30 Q18 30 20 14 Q22 6 26 12 Q30 18 33 28 L40 30 Q46 30 48 16 Q51 8 55 15 Q58 22 62 29 L80 30',
  temp:  'M0 12 C12 12 18 14 26 17 C36 21 44 22 54 21 C64 20 72 18 80 15',
  move:  'M0 20 L6 20 L8 17 L10 23 L12 20 L30 20 L32 19 L34 21 L36 20 L60 20 L62 16 L64 24 L66 20 L80 20',
}
/* [top, bottom] of the usual band, the baseline, and the point where the shape
   first leaves the band, in the same viewBox units as the path above. */
const BAND = {
  heart: { band: [15, 25], base: 20, out: [37, 9],  says: 'beats faster, with more even gaps between beats' },
  sweat: { band: [24, 33], base: 30, out: [22, 7],  says: 'rises first, and fastest, when the body tenses' },
  temp:  { band: [10, 19], base: 14, out: [54, 21], says: 'drifts down under strain and back up on settling' },
  move:  { band: [17, 23], base: 20, out: [62, 16], says: 'spikes, telling a hard run from a hard day' },
}

/* The root stays an <svg> sized by className, so a caller that passes a height
   keeps the height it asked for. Everything added is inside the viewBox: text
   in a scaled viewBox shrinks with the column, so the unit and the window
   belong to the card around this, not to the drawing.

   `muted` draws a signal this surface does NOT have, in `ruling` #8eb0b6 flat.
   It exists because charts/camera.jsx was dimming the whole drawing with
   `opacity-45`: the signal's own colour at 45% over card lands near 1.6 : 1
   and partial-opacity decoration is not the idiom anywhere else in this
   directory. The state is carried in words beside the figure either way, so
   the muted trace is a shape and never the only thing saying so. */
export function SignalTrace({ kind, muted = false, className }) {
  const s = SENSORS[kind]
  const g = BAND[kind]
  if (!s || !g) return null
  const [hi, lo] = g.band
  return (
    <svg viewBox="0 0 80 36" preserveAspectRatio="none" role="img" focusable="false"
      aria-label={`${s.name}, ${s.unit}: an illustrative shape against the usual range. `
        + `It ${g.says}.`}
      className={cn('h-10 w-full', className)}>
      {/* the usual range, and the middle of it */}
      <rect x="0" y={hi} width="80" height={lo - hi} className="fill-ink-3 opacity-[0.1]" />
      <path d={`M0 ${hi} H80 M0 ${lo} H80`} fill="none" className="stroke-ink-3" strokeWidth="1"
        strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
      <path d={`M0 ${g.base} H80`} fill="none" className="stroke-ink-3" strokeWidth="1"
        vectorEffect="non-scaling-stroke" />
      <path d={TRACE[kind]} fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
        stroke={muted ? '#8eb0b6' : (s.glow || s.color)} vectorEffect="non-scaling-stroke" />
      {/* the moment it leaves the band, ringed in the surface colour so it
          stays legible where it crosses its own trace */}
      <circle cx={g.out[0]} cy={g.out[1]} r="2.6" fill={muted ? '#8eb0b6' : (s.glow || s.color)}
        className="stroke-card" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/* ── Who sees what ─────────────────────────────────────────────────────── */

/* Five things, three audiences, and the rule that fixes each row. 2 always,
   1 only with consent, 0 never. Raw readings, Notes and Location are 0 for
   both the parent and the medical professional at every consent level: those
   three never leave the phone. Rows 1 and 2 are 1, because nothing is shared
   by default. Level 2 is the student's own column. */
const WHAT = [
  { label: `${SCORE} for the day`,        rule: 'Shared only when the student turns it on' },
  { label: 'Whether the week ran high',   rule: 'Shared only when the student turns it on' },
  { label: 'Every reading, second by second', rule: 'Never leaves the phone' },
  { label: NOTES,                         rule: 'Never leaves the phone' },
  { label: LOCATION,                      rule: 'Never leaves the phone' },
]
const SEES = [
  { who: 'Student', sees: [2, 2, 2, 2, 2] },
  { who: 'Parent',  sees: [1, 1, 0, 0, 0] },
  { who: PRO,       sees: [1, 1, 0, 0, 0] },
]
/* The three states, named once. The mark carries a shape rather than a word,
   or the same phrase is read out fifteen times over one figure. */
const STATE = { 2: 'Always', 1: 'Only if the student agrees', 0: 'Never' }

/* Decorative: the state is named in type beside every mark. title stays, as it
   is all a mouse has to go on. */
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

/* "2 only if the student agrees, 3 never", counted off the table
   rather than typed, so a row moved between states cannot leave the summary
   saying the old thing. */
function summarise(sees) {
  return [2, 1, 0]
    .map(v => ({ v, n: sees.filter(x => x === v).length }))
    .filter(x => x.n)
    .map(x => `${x.n} ${STATE[x.v].toLowerCase()}`)
    .join(', ')
}

const COLS = 'md:grid md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] md:items-start md:gap-4'

export function WhoSeesWhat({ className }) {
  return (
    <figure className={cn('m-0', className)}>
      <div className="overflow-hidden rounded-panel border border-rule bg-card">
        {/* The legend lives inside the panel: on the overview this figure sits
            on a tinted band, and spec section 2 keeps every piece of content
            except a heading inside a container with a visible edge. */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-rule px-4 py-3
          text-sec text-ink-2">
          {[2, 1, 0].map(v => (
            <span key={v} className="flex items-center gap-2"><Mark v={v}/> {STATE[v]}</span>
          ))}
        </div>
        {/* The header exists only where there are columns to head. Below md the
            audience is named inside each cell instead, which is the one string
            this figure repeats; every row label is written once. */}
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

        <div className={cn('border-t border-rule bg-mist/60 px-4 py-2.5', COLS)}>
          <p className="text-tick text-ink-3">Across the five</p>
          {SEES.map(p => (
            <p key={p.who} className="mt-1 text-fine leading-[1.4] text-ink-2 md:mt-0">
              <span className="text-ink-3 md:hidden">{p.who}: </span>{summarise(p.sees)}
            </p>
          ))}
        </div>

        <figcaption className="border-t border-rule px-4 py-3 text-sec text-ink-3">Crisis alerts
          are the exception. Students are told so before they start.</figcaption>
      </div>
    </figure>
  )
}

/* ── A week against the usual range ────────────────────────────────────── */

/* Seven days as seven values, with the band they are being judged against
   drawn behind them. The bars it replaces were all one height and carried the
   over-range state in colour alone; here position carries the value, a diamond
   marks a day outside the range, and that day's figure is printed under it.
   The scale is the band plus headroom rather than 0 to 100: these are index
   values, the band is the only reference that means anything, and a hundred
   point axis flattens the week to a flat line. Both bounds are printed. */
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
      {/* The label sits on the plot and not on the figure: role="img" makes
          everything under it presentational, and the caption below is text a
          reader should still get. */}
      <div className="relative h-16" role="img"
        aria-label={`${rows.length} days against a usual range of ${lo} to ${hi}. `
          + (over.length
            ? `Above it: ${over.map(d => `${d.d} ${d.v}`).join(', ')}.`
            : 'No day above it.')}>
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
      {/* The figure goes under the day rather than over the marker: at a phone
          preview's width a label above the top marker has nowhere to sit. */}
      <div aria-hidden="true" className="flex">
        {rows.map(d => (
          <span key={d.d} className="flex-1 text-center text-fine tabular-nums text-ink-2">
            {d.v > hi ? d.v : ''}
          </span>
        ))}
      </div>
      <figcaption className="mt-1 text-fine leading-[1.4] text-ink-3">
        Usual range <span className="tabular-nums text-ink-2">{lo} to {hi}</span>. Days
        above it are marked and their figure printed.
      </figcaption>
    </figure>
  )
}
