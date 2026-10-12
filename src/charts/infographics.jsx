import React from 'react'
import { SENSORS } from '../lib/sensors'
import { cn } from '../lib/utils'
import { SCORE, NOTES, LOCATION } from '../lib/terms'


/* ── The four signals, drawn as the shapes they actually make ───────────── */
const TRACE = {
  heart: 'M0 20 L8 20 L11 8 L14 30 L17 20 L26 20 L34 20 L37 9 L40 31 L43 20 L52 20 L60 20 L63 8 L66 30 L69 20 L80 20',
  sweat: 'M0 30 L10 30 L14 30 Q18 30 20 14 Q22 6 26 12 Q30 18 33 28 L40 30 Q46 30 48 16 Q51 8 55 15 Q58 22 62 29 L80 30',
  temp:  'M0 12 C12 12 18 14 26 17 C36 21 44 22 54 21 C64 20 72 18 80 15',
  move:  'M0 20 L6 20 L8 17 L10 23 L12 20 L30 20 L32 19 L34 21 L36 20 L60 20 L62 16 L64 24 L66 20 L80 20',
}
export function SignalTrace({ kind, className }) {
  const color = SENSORS[kind]?.glow || SENSORS[kind]?.color
  return (
    <svg viewBox="0 0 80 36" aria-hidden preserveAspectRatio="none"
      className={cn('h-10 w-full', className)}>
      <path d={TRACE[kind]} fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
        stroke={color} vectorEffect="non-scaling-stroke"/>
    </svg>
  )
}

/* ── Who sees what. 2 always, 1 only with consent, 0 never. ───────────── */
const WHAT = [
  `${SCORE} for the day`,
  'Whether the week ran high',
  'Every reading, second by second',
  NOTES,
  LOCATION,
]
/* Raw stream, Notes and Location are level 0 for both parent and medical professional at
   every consent level: the trust block above this figure states that those
   three never leave the phone. Rows 1 and 2 are level 1 — nothing is shared by
   default. Level 2 is the student's own column. */
const SEES = [
  { who:'Student',   sees:[2, 2, 2, 2, 2] },
  { who:'Parent',    sees:[1, 1, 0, 0, 0] },
  { who:'Medical Professional', sees:[1, 1, 0, 0, 0] },
]
/* The three states, named once: the legend prints them and each list in the
   grid is named by one. Mark carries no text of its own, or the same phrase is
   read out eighteen times over one figure. */
const STATE = { 2:'Always', 1:'Only if the student agrees', 0:'Never' }
/* Decorative: the state is on the list this mark sits in. title stays — it is
   all a mouse has to go on. */
function Mark({ v }) {
  return (
    <span aria-hidden="true" className="flex items-center justify-center" title={STATE[v]}>
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
/* Five rows per window, split into consecutive blocks of the same state. SEES
   is ordered so there are never more than two blocks. */
function runs(sees) {
  const out = []
  sees.forEach((v, i) => {
    const last = out[out.length - 1]
    if (last && last.v === v) last.rows.push(i)
    else out.push({ v, rows:[i] })
  })
  return out
}
export function WhoSeesWhat({ className }) {
  return (
    <figure className={cn('m-0', className)}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sec text-ink-2">
        <span className="flex items-center gap-2"><Mark v={2}/> Always</span>
        <span className="flex items-center gap-2"><Mark v={1}/> Only if the student agrees</span>
        <span className="flex items-center gap-2"><Mark v={0}/> Never</span>
      </div>
      {/* auto-rows-fr keeps rows equal at every width: the three windows stack
          into one column on a phone, and auto rows there size themselves
          separately. */}
      <div className="mt-5 grid auto-rows-fr gap-5 md:grid-cols-3">
        {SEES.map(p => (
          <div key={p.who} className="flex h-full flex-col rounded-panel border border-rule bg-card p-6">
            <h3 className="font-display text-head font-bold leading-tight text-ink">{p.who}</h3>
            {/* One list per state, named by that state, so a cell reads
                "Parent: Never, list, Notes" rather than repeating the phrase
                inside all five marks. */}
            <div className="mt-4 grid gap-3">
              {runs(p.sees).map(g => (
                <ul key={g.v} role="list" aria-label={`${p.who}: ${STATE[g.v]}`}
                  className="m-0 grid list-none gap-3 p-0">
                  {g.rows.map(i => (
                    <li key={WHAT[i]} className="grid grid-cols-[1.25rem_1fr] items-start gap-3 text-sec leading-[1.45]">
                      <span className="mt-[0.1rem]"><Mark v={g.v}/></span>
                      <span className={g.v === 0 ? 'text-ink-3' : 'text-ink'}>{WHAT[i]}</span>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* The four cards above already print the consent model word for word;
          only the exception is stated nowhere else. */}
      <figcaption className="mt-4 max-w-[62ch] text-sec text-ink-3">Crisis alerts are the
        exception, and students are told so before they start.</figcaption>
    </figure>
  )
}

/* ── A week at a glance: five school days, above or inside the normal band. */
export function WeekStrip({ days, band, className }) {
  return (
    <div className={cn('flex gap-1.5', className)} role="img"
      aria-label={`Seven days. ${days.filter(d => d.v > band.hi).length} above the usual range.`}>
      {days.map(d => {
        const over = d.v > band.hi
        return (
          <div key={d.d} className="flex-1 text-center">
            <div className={cn('h-2 rounded-xs', over ? 'bg-warn' : 'bg-accent/45')}/>
            <span className="mt-1.5 block text-tick text-ink-3">{d.d[0]}</span>
          </div>
        )
      })}
    </div>
  )
}
