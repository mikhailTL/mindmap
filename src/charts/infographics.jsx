import React from 'react'
import { SENSORS } from '../lib/sensors'
import { cn } from '../lib/utils'

/* Pictures that replace paragraphs. Every one of these was a block of prose
   until a reader had to get through it to learn one fact. */

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

/* ── Patch → phone → sentence. Three steps, no paragraph. ──────────────── */
export function HowItWorks({ className }) {
  const steps = [
    { n: '1', t: 'The patch reads', s: 'Four signals from the skin, once a second.', art: 'patch' },
    { n: '2', t: 'The phone scores', s: 'Compared with your own last two weeks.',   art: 'phone' },
    { n: '3', t: 'You get a sentence', s: 'Plus the numbers, if you want them.',    art: 'card'  },
  ]
  return (
    <ol className={cn('grid list-none gap-4 p-0 sm:grid-cols-3', className)}>
      {steps.map((s, i) => (
        <li key={s.n} className="relative border-t-2 border-ink pt-5">
          <div className="flex h-24 items-center justify-center rounded-xs bg-sage">
            <StepArt kind={s.art}/>
          </div>
          <div className="mt-4 flex items-baseline gap-2.5">
            <span className="font-mono text-label tabular-nums text-ink-3">0{s.n}</span>
            <h3 className="font-display text-row font-bold text-ink">{s.t}</h3>
          </div>
          <p className="mt-1.5 max-w-[30ch] text-sec text-ink-2">{s.s}</p>
          {i < 2 && (
            <svg aria-hidden viewBox="0 0 24 24" className="absolute -right-3 top-16 hidden size-5 text-ink-3 sm:block">
              <path d="M4 12h16M14 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.75"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </li>
      ))}
    </ol>
  )
}
function StepArt({ kind }) {
  if (kind === 'patch') return (
    <svg viewBox="0 0 120 64" aria-hidden className="h-14">
      <rect x="26" y="14" width="68" height="36" rx="16" fill="none" className="stroke-ink" strokeWidth="1.6"/>
      <rect x="48" y="24" width="24" height="16" rx="5" className="fill-accent"/>
      <path d="M8 32h14M98 32h14" className="stroke-ink-3" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>)
  if (kind === 'phone') return (
    <svg viewBox="0 0 120 64" aria-hidden className="h-14">
      <rect x="46" y="6" width="28" height="52" rx="5" fill="none" className="stroke-ink" strokeWidth="1.6"/>
      <path d="M52 40 L56 40 L58 30 L61 46 L63 38 L68 38" fill="none" className="stroke-accent"
        strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="60" cy="18" r="5" fill="none" className="stroke-ink-3" strokeWidth="1.4"/>
    </svg>)
  return (
    <svg viewBox="0 0 120 64" aria-hidden className="h-14">
      <rect x="18" y="16" width="84" height="32" rx="3" fill="none" className="stroke-ink" strokeWidth="1.6"/>
      <path d="M28 28h44M28 36h30" className="stroke-ink-3" strokeWidth="2.4" strokeLinecap="round"/>
      <circle cx="86" cy="32" r="7" className="fill-accent"/>
    </svg>)
}

/* ── Who sees what. Replaces four paragraphs of privacy copy. ──────────── */
const ROWS = [
  ['One number for the day',    2, 2, 2],
  ['Whether the week ran high', 2, 2, 2],
  ['Every reading, second by second', 2, 0, 1],
  ['Anything they wrote',       2, 0, 0],
  ['Where they were',           2, 0, 0],
]
const WHO = ['The student', 'A parent', 'A counselor']
function Mark({ v }) {
  const label = v === 2 ? 'Always' : v === 1 ? 'Only if the student agrees' : 'Never'
  return (
    <span className="flex items-center justify-center" title={label}>
      <span className="sr-only">{label}</span>
      {v === 2 && <svg viewBox="0 0 20 20" aria-hidden className="size-5 text-accent">
        <circle cx="10" cy="10" r="8" fill="currentColor"/>
        <path d="M6 10.5l2.6 2.6L14 8" fill="none" stroke="#fcfcfb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      {v === 1 && <svg viewBox="0 0 20 20" aria-hidden className="size-5 text-accent">
        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M10 2a8 8 0 010 16z" fill="currentColor"/></svg>}
      {v === 0 && <svg viewBox="0 0 20 20" aria-hidden className="size-5 text-ink-3">
        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".5"/>
        <path d="M6.5 13.5l7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
    </span>
  )
}
export function WhoSeesWhat({ className }) {
  return (
    <figure className={cn('m-0', className)}>
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sec text-ink-2">
        <span className="flex items-center gap-2"><Mark v={2}/> Always</span>
        <span className="flex items-center gap-2"><Mark v={1}/> Only if the student agrees</span>
        <span className="flex items-center gap-2"><Mark v={0}/> Never</span>
      </div>
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">What each person can see</caption>
        <thead>
          <tr>
            <th className="sticky top-[7rem] z-10 w-1/2 border-b border-ink bg-paper py-3 pr-4 lab font-normal">What</th>
            {WHO.map(w => <th key={w}
              className="sticky top-[7rem] z-10 border-b border-ink bg-paper py-3 text-center lab font-normal">{w}</th>)}
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([what, a, b, c]) => (
            <tr key={what}>
              <th scope="row" className="border-b border-rule py-4 pr-4 text-left text-meta font-normal text-ink">{what}</th>
              {[a, b, c].map((v, i) => <td key={i} className="border-b border-rule py-4"><Mark v={v}/></td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption className="mt-4 max-w-[62ch] text-sec text-ink-3">Students can change every row at any
        time. Crisis alerts are the exception, and students are told so before they start.</figcaption>
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
            <div className={cn('h-2 rounded-full', over ? 'bg-warn' : 'bg-accent/45')}/>
            <span className="mt-1.5 block font-mono text-label text-ink-3">{d.d[0]}</span>
          </div>
        )
      })}
    </div>
  )
}
