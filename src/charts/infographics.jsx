import React from 'react'
import { SENSORS } from '../lib/sensors'
import { cn } from '../lib/utils'
import { SCORE, NOTES, LOCATION } from '../lib/terms'

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
/* Three steps as three windows. They were three blocks hanging off one long
   rule, with a second rule over each block, and the review said what a rule
   between items does: it reads as a new topic beginning. A box closes a group,
   so the sequence is now boxed and the order is carried by the order. */
/* Step one does not name the four signals. They are named on the hero and
   again on the patch panel, both on this page and both above this figure, so
   a third printing here was the third telling of one list. What is left is
   the two things neither of those says: where it reads from and how often. */
export function HowItWorks({ className }) {
  const steps = [
    { t:'Worn on the arm', art:'patch',
      s:'From the upper arm, once a second, all day.' },
    { t:'Read on your phone', art:'phone',
      s:`One ${SCORE}, measured against your own last two weeks.` },
    { t:'One sentence back', art:'card',
      s:'One line in plain words, with the four signals under it.' },
  ]
  return (
    <ol className={cn('m-0 grid auto-rows-fr list-none gap-5 p-0 md:grid-cols-3', className)}>
      {steps.map(s2 => (
        <li key={s2.t} className="flex h-full flex-col rounded-panel border border-rule bg-card p-6">
          <span className="flex h-24 items-center justify-center rounded-field bg-mist/70">
            <StepArt kind={s2.art}/>
          </span>
          <h3 className="mt-5 font-display text-head font-bold leading-tight text-ink">{s2.t}</h3>
          <p className="mt-2 max-w-[34ch] text-sec leading-[1.5] text-ink-2">{s2.s}</p>
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
/* The five things a day of measurement produces, and what each person is shown
   of them. 2 always, 1 only with consent, 0 never. */
const WHAT = [
  `${SCORE} for the day`,
  'Whether the week ran high',
  'Every reading, second by second',
  NOTES,
  LOCATION,
]
/* The raw stream, Notes and Location are level 0 for both a parent and a
   counselor at every consent level. The trust block above this figure states
   that those three never leave the phone, and a cell that said "only if the
   student agrees" put a second answer to the same question in the same
   section. Rows 1 and 2 are level 1 for the same reason: nothing is shared by
   default, so what a parent or a school is shown is what the student turned
   on, and the student can turn it off again. Level 2 is the student's own
   column, which is the one audience that always sees everything. */
const SEES = [
  { who:'Student',   sees:[2, 2, 2, 2, 2] },
  { who:'Parent',    sees:[1, 1, 0, 0, 0] },
  { who:'Counselor', sees:[1, 1, 0, 0, 0] },
]
/* The three states, named once. The legend prints them, each list in the
   grid is named by one of them, and Mark itself carries no text: it used to
   put a sr-only copy of its own state inside every cell, which is this one
   short phrase read out eighteen times over one figure. */
const STATE = { 2:'Always', 1:'Only if the student agrees', 0:'Never' }
/* Decorative. The state is on the list this mark sits in, so a mark that also
   announced it would say everything twice. title stays: it is the only thing
   a mouse has to go on. */
function Mark({ v }) {
  return (
    <span aria-hidden="true" className="flex items-center justify-center" title={STATE[v]}>
      {v === 2 && <svg viewBox="0 0 20 20" aria-hidden className="size-5 text-accent">
        <circle cx="10" cy="10" r="8" fill="currentColor"/>
        {/* The tick is knocked out of the filled accent disc. It was a raw
            literal of the retired palette's near-white; card #ffffff is the
            equivalent sheet colour and reads 6.65 : 1 on accent. */}
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
/* The five rows of one person's window, split into consecutive blocks of the
   same state. SEES orders the rows so there are never more than two blocks,
   which is what lets the blocks be invisible and the name be free. */
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
      {/* One window per person, not a table. The table put a rule under every
          row, and a rule across a list of five things reads as five separate
          subjects rather than as one person's view of one day. Equal rows at
          every width: auto-rows-fr, because the three windows stack into one
          column on a phone and auto rows there size themselves separately. */}
      <div className="mt-5 grid auto-rows-fr gap-5 md:grid-cols-3">
        {SEES.map(p => (
          <div key={p.who} className="flex h-full flex-col rounded-panel border border-rule bg-card p-6">
            <h3 className="font-display text-head font-bold leading-tight text-ink">{p.who}</h3>
            {/* Inside each window the five rows are one list per state, named
                by that state. SEES is already ordered so the states run in
                blocks, which is why this changes nothing a reader can see:
                same five rows, same order, one gap throughout. What it buys
                is the name. A list carries it once for the rows under it, so
                a cell reads "Parent: Never, list, Notes" instead of putting
                the same phrase inside all five marks. */}
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
      {/* One sentence, and it is the one the four cards above this figure do
          not carry. They print the consent model word for word, in the same
          section, a few inches up; repeating it here was the same answer
          given twice on one screen. The exception is not stated anywhere
          else, so it stays. */}
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
