import React from 'react'
import { cn } from '../../lib/utils'
import { FACE_TERMS } from '../../signals/face-score'

/* The pieces of the Mental Mirror screen (views/MentalMirror.jsx). Light
   surfaces only; styles in ./mirror.css. */

/* The four bands of the dial, one per group of cues. */
export const BANDS = [
  { id: 'mirror-pulse', name: 'Pulse', glow: '#e11919', of: ['hr'] },
  { id: 'mirror-brow',  name: 'Brow',  glow: '#e86a05', of: ['browFurrow'] },
  { id: 'mirror-eyes',  name: 'Eyes',  glow: '#199e19', of: ['blinkRate', 'eyeSquint', 'earVar'] },
  { id: 'mirror-mouth', name: 'Mouth and head', glow: '#1560e0', of: ['lipPress', 'headMotion'] },
]
const toneOf = id => BANDS.find(b => b.of.includes(id))?.glow ?? '#18a370'

/* A primary action: white on the accent, 5.8 : 1. */
export const MirrorButton = React.forwardRef(function MirrorButton({ className, variant = 'solid', ...p }, ref) {
  return (
    <button ref={ref} type="button" {...p}
      className={cn('inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-6',
        'font-display text-ui font-bold transition-[background-color,transform,box-shadow] duration-150',
        'motion-safe:active:scale-[0.97] select-none touch-manipulation',
        'disabled:pointer-events-none disabled:opacity-50',
        variant === 'solid'
          ? 'bg-accent text-white shadow-[0_1px_2px_rgba(13,43,30,.12)] hoverOnly:bg-accent-ink'
          : 'border border-ruling bg-white text-ink hoverOnly:bg-mist',
        className)}/>
  )
})

/* What it reads, as small chips. */
const READS = [
  ['Pulse from skin colour', '#e11919', 'pulse'],
  ['Brow', '#e86a05', 'brow'],
  ['Eyes', '#199e19', 'eye'],
  ['Mouth', '#1560e0', 'mouth'],
]
function Glyph({ kind, color }) {
  const p = { fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
  return (
    <svg viewBox="0 0 20 20" className="size-4 shrink-0" aria-hidden focusable="false">
      {kind === 'pulse' && <path d="M2 11h4l2-5 3 9 2-5h5" {...p}/>}
      {kind === 'brow' && <path d="M3 9c3-3 6-3 7-2M17 9c-3-3-6-3-7-2M5 13h3M12 13h3" {...p}/>}
      {kind === 'eye' && <><path d="M2 10c2.5-4 13.5-4 16 0-2.5 4-13.5 4-16 0z" {...p}/><circle cx="10" cy="10" r="2" fill={color}/></>}
      {kind === 'mouth' && <path d="M4 9c3 4 9 4 12 0M4 9c3 1 9 1 12 0" {...p}/>}
    </svg>
  )
}
export function ReadsChips({ className }) {
  return (
    <ul className={cn('m-0 flex list-none flex-wrap gap-2 p-0', className)} aria-label="What it reads">
      {READS.map(([label, color, kind]) => (
        <li key={label} className="mm-chip inline-flex min-h-[36px] items-center gap-2 px-3 text-fine text-ink">
          <Glyph kind={kind} color={color}/>{label}
        </li>
      ))}
    </ul>
  )
}

/* One calm ring round the face: a pale track and a solid green arc that
   fills over the 30 seconds, eased between updates. 20 October, the owner:
   "the green circle needs to be more calming and solid". */
export function ProgressRing({ progress = 0 }) {
  const p = Math.max(0, Math.min(100, progress))
  return (
    <svg viewBox="0 0 400 300" aria-hidden focusable="false"
      className="pointer-events-none absolute inset-0 h-full w-full">
      <circle cx="200" cy="150" r="128" fill="none" stroke="#e3efe9" strokeWidth="4.5"/>
      <circle cx="200" cy="150" r="128" fill="none" stroke="#157446" strokeWidth="4.5"
        strokeLinecap="round" pathLength="100" strokeDasharray="100 100" strokeDashoffset={100 - p}
        transform="rotate(-90 200 150)" className="mm-arc" opacity={p > 0 ? 1 : 0}/>
    </svg>
  )
}

function Wait() {
  return <span className="mm-wait" aria-label="Not in yet"><i/><i/><i/></span>
}

/* The live chips: the same figures the tags on the face show. Whether a
   face is found is said on the status line above them. */
export function LiveChips({ live }) {
  const found = !!live?.present
  const cells = [
    ['Pulse', live?.pulse != null ? `${live.pulse} bpm` : null],
    ['Brow', found && live.brow != null ? `${live.brow}%` : null],
    ['Eyes', found ? (live.blink ? 'Blink' : live.eyes != null ? `${live.eyes}%` : null) : null],
    ['Lips', found && live.lips != null ? `${live.lips}%` : null],
  ]
  return (
    <ul className="m-0 grid list-none grid-cols-4 gap-2 p-0" aria-label="Live values">
      {cells.map(([k, v]) => (
        <li key={k} className="mm-chip flex min-h-[60px] flex-col justify-center gap-1.5 px-2.5 py-2 sm:px-3.5">
          <span className="text-fine leading-none text-ink-3">{k}</span>
          <span className="flex h-[1.125rem] items-center font-display text-ui font-bold leading-none tabular-nums text-ink">
            {v ?? <Wait/>}
          </span>
        </li>
      ))}
    </ul>
  )
}

/* "Does this match how you feel?": one tap, calm on the left like the dial. */
export function CheckInScale({ answered, onAnswer }) {
  if (answered) {
    return (
      <p className="mm-reveal flex items-center gap-2 text-sec text-ink-2">
        <svg viewBox="0 0 20 20" className="size-5 shrink-0" aria-hidden focusable="false">
          <circle cx="10" cy="10" r="9" fill="#d5f2e8"/>
          <path d="M6 10.5l2.6 2.5L14 7.5" fill="none" stroke="#067049" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Noted. Thanks.
      </p>
    )
  }
  const opt = 'mm-answer flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-rule bg-white px-4 font-display text-ui font-bold text-ink'
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="p-0 text-sec font-medium text-ink">Does this match how you feel?</legend>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" className={opt} onClick={() => onAnswer(false)}>
          <span aria-hidden className="size-2.5 rounded-full" style={{ background: '#18a370' }}/>Fine
        </button>
        <button type="button" className={opt} onClick={() => onAnswer(true)}>
          <span aria-hidden className="size-2.5 rounded-full" style={{ background: '#f25424' }}/>Stressed
        </button>
      </div>
      <div aria-hidden className="mm-scale mt-2.5"/>
    </fieldset>
  )
}

/* A measured value in the units the old table used. */
function shown(id, v) {
  if (id === 'hr') return `${Math.round(v)} bpm`
  if (id === 'blinkRate') return `${v.toFixed(1)} per min`
  if (id === 'headMotion') return `${(v * 100).toFixed(1)}% face width per s`
  if (id === 'earVar') return `${(v * 100).toFixed(0)}% variation`
  return `${Math.round(v * 100)}%`
}

/* What moved it: one light card per contribution, biggest first. The bar runs
   from the centre, right raised the score and left lowered it. */
export function Movers({ result }) {
  const rows = [...result.contrib].sort((a, b) => Math.abs(b.raw) - Math.abs(a.raw))
  const missing = FACE_TERMS.filter(t => result.features[t.id] == null).map(t => t.label)
  return (
    <section className="mt-6" aria-labelledby="mm-moved">
      <h3 id="mm-moved" className="font-display text-row font-bold text-ink">What moved it</h3>
      <ul className="m-0 mt-3 grid list-none gap-2 p-0 sm:grid-cols-2">
        {rows.map((c, i) => {
          const x = Math.max(-1, Math.min(1, c.raw))
          const up = x > 0, flat = x === 0
          return (
            <li key={c.id} className="mm-chip mm-reveal p-3.5" style={{ animationDelay: `${120 + i * 60}ms` }}>
              <p className="m-0 flex items-center gap-2 font-display text-ui font-bold text-ink">
                <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: toneOf(c.id) }}/>
                {c.label}
              </p>
              <p className="m-0 mt-0.5 pl-[1.125rem] text-fine tabular-nums text-ink-2">{shown(c.id, c.value)}</p>
              <div aria-hidden className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-mist">
                <span className="absolute inset-y-0 left-1/2 w-1/2 origin-left rounded-full"
                  style={{ background: up ? '#b5871b' : '#18a370',
                    transform: `scaleX(${up ? Math.abs(x) : -Math.abs(x)})` }}/>
                <span className="absolute inset-y-0 left-1/2 w-px bg-ink-3"/>
              </div>
              <p className="m-0 mt-1.5 text-fine text-ink-2">
                {flat ? 'No change' : up ? 'Raised your score' : 'Lowered your score'}
              </p>
            </li>
          )
        })}
      </ul>
      {missing.length > 0 && (
        <p className="m-0 mt-3 text-fine text-ink-3">Not read: {missing.join(', ')}.</p>
      )}
    </section>
  )
}
