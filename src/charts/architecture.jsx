import React from 'react'
import { Always, Never } from '../ui/marks'
import { TNAM_RESULTS as R } from '../signals/tnam-results'
import { CONTEXT_WINDOWS } from '../signals/tnam'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { K_ANONYMITY } from '../lib/caseload'
import { PRO, SCORE } from '../lib/terms'
import { cn } from '../lib/utils'

/* The figures on the How it works page, one per category: the patch and its
 * link to the phone (Hardware), the framework and its three adaptations (AI),
 * the path from four signals to one number (Machine Learning), and the three
 * consent rules (Other Software).
 *
 * Every label is HTML and no figure carries <text> inside its viewBox. Text in
 * a scaled SVG shrinks with the column, so a 12px label set to fit 1280px is a
 * 7px label at 390px, which fails the contrast sweep at the one width where it
 * matters most. The SVGs here hold shapes only and are aria-hidden; the reading
 * order is the HTML beside them.
 *
 * No figure invents a fact. The patch signals come from lib/sensors.js, the k
 * floor from lib/caseload.js, the audience names from lib/terms.js, and the
 * four curves in the network figure are read out of signals/tnam-results.js,
 * which ml/research.py generates. A change in any of those reaches these
 * drawings instead of disagreeing with them.
 *
 * NO ENTRANCE ANIMATION on a figure: the band around it may animate, and two
 * opacity animations on one subtree once left ink-3 small print at 2.48 : 1 for
 * over a second. A figure is content, so it is painted, not revealed.
 *
 * Each figure takes `dark` for the one band set on the ink ground (spec 0f
 * rule 7). On ink the labels are mist and the drawing is accent-lit, which is
 * the only accent allowed to be a word there (7.67 : 1). */

const LABEL = (dark) => cn('text-tick font-semibold', dark ? 'text-mist' : 'text-ink-2')
const SMALL = (dark) => cn('text-fine', dark ? 'text-mist' : 'text-ink-3')
const STROKE = (dark) => (dark ? 'text-accent-lit' : 'text-accent')
const FAINT = (dark) => (dark ? 'text-ink-3' : 'text-rule')

/* ── 1. The patch and the phone ─────────────────────────────────────────── */

/* Upper arm, patch, a dashed link, a phone. The patch is a stadium with the
   four sensor points under its face, which is the engineering layout in
   views/Patch.jsx reduced to its outline. Nothing here claims a built unit:
   the Methods band beside it says so in words. */
export function PatchLink({ className, dark = false }) {
  return (
    <figure className={cn('m-0', className)}>
      <svg viewBox="0 0 320 128" aria-hidden focusable="false" className="block w-full"
        fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* the arm */}
        <rect x="18" y="14" width="78" height="100" rx="39" className={FAINT(dark)}
          stroke="currentColor" strokeWidth="1.6"/>
        {/* the patch, a stadium on the arm, and its four sensor points */}
        <rect x="37" y="34" width="40" height="60" rx="20" className={STROKE(dark)}
          stroke="currentColor" strokeWidth="2"/>
        <g className={STROKE(dark)} fill="currentColor">
          <circle cx="50" cy="52" r="3"/><circle cx="64" cy="52" r="3"/>
          <circle cx="50" cy="76" r="3"/><circle cx="64" cy="76" r="3"/>
        </g>
        {/* the link, drawn as three arcs and a dashed run, which is the
            radio mark everybody reads as a radio */}
        <g className={STROKE(dark)} stroke="currentColor" strokeWidth="1.6">
          <path d="M104 64h118" strokeDasharray="4 6"/>
          <path d="M150 50a18 18 0 0 1 0 28M158 42a30 30 0 0 1 0 44M142 56a9 9 0 0 1 0 16"/>
        </g>
        {/* the phone, and the dial on its screen */}
        <rect x="236" y="10" width="64" height="108" rx="10" className={FAINT(dark)}
          stroke="currentColor" strokeWidth="1.6"/>
        <circle cx="268" cy="64" r="18" className={STROKE(dark)} stroke="currentColor"
          strokeWidth="2" strokeDasharray="85 30" transform="rotate(135 268 64)"/>
      </svg>
      <figcaption className="mt-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-2">
        <span className={LABEL(dark)}>Upper arm</span>
        <span className={cn(LABEL(dark), 'text-center')}>Bluetooth Low Energy</span>
        <span className={cn(LABEL(dark), 'text-right')}>Phone</span>
      </figcaption>
      <ul className="m-0 mt-2.5 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0">
        {SENSOR_ORDER.map(id => {
          const Icon = SENSORS[id].icon
          return (
            <li key={id} className={cn('flex items-center gap-1.5', dark ? 'text-mist' : 'text-ink')}>
              <Icon aria-hidden size={16} className={STROKE(dark)}/>
              <span className="text-fine">{SENSORS[id].name}</span>
            </li>
          )
        })}
      </ul>
    </figure>
  )
}

/* ── 2. One framework, three adaptations ───────────────────────────────── */

const PUBLISHERS = ['SAMHSA', 'NIMH', 'AAP', 'CDC']
const ADAPTATIONS = ['Student', 'Parent', PRO]

function Box({ dark, strong, className, children }) {
  return (
    <div className={cn('rounded-panel border px-3 py-2 text-center',
      dark ? 'border-ink-3 bg-ink-2' : 'border-rule bg-card',
      strong && (dark ? 'border-accent-lit' : 'border-accent'),
      className)}>
      {children}
    </div>
  )
}

export function FrameworkFan({ className, dark = false }) {
  return (
    <figure className={cn('m-0 mx-auto w-full max-w-[22rem]', className)}>
      <Box dark={dark} strong>
        <p className={LABEL(dark)}>One framework</p>
        <p className={cn(SMALL(dark), 'mt-0.5')}>{PUBLISHERS.join(', ')}</p>
      </Box>
      <svg viewBox="0 0 300 36" preserveAspectRatio="none" aria-hidden focusable="false"
        className={cn('block h-9 w-full', STROKE(dark))}
        fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path vectorEffect="non-scaling-stroke" d="M150 2v10M150 12L50 34M150 12v22M150 12l100 22"/>
      </svg>
      <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0">
        {ADAPTATIONS.map(a => (
          <li key={a} className="h-full">
            <Box dark={dark} className="flex h-full items-center justify-center">
              <span className={LABEL(dark)}>{a}</span>
            </Box>
          </li>
        ))}
      </ul>
    </figure>
  )
}

/* ── 3. Four signals, a short memory, one number ────────────────────────── */

/* One fitted curve per signal, read out of the results file rather than drawn
   by hand. Each signal has several features in the network; the one drawn is
   the plainest of its signal: heart rate, tonic sweat, temperature slope and
   movement. The y range is normalised per tile, so a tile shows the shape of
   its curve and nothing about its size. */
const CURVE_OF = { heart: 'hr', sweat: 'edaTonic', temp: 'tempSlope', move: 'motion' }
const TILE_W = 100, TILE_H = 44, PAD = 5
/* The temporal term reads the preceding windows at the 30 second hop R.task
   states, so the minutes are arithmetic rather than a typed figure. */
const HOP_S = 30
const MEMORY_MIN = (CONTEXT_WINDOWS * HOP_S) / 60

function curvePath(shape) {
  const lo = Math.min(...shape.y), hi = Math.max(...shape.y), span = hi - lo || 1
  const n = shape.x.length
  return shape.y.map((y, i) => {
    const px = PAD + (i / (n - 1)) * (TILE_W - 2 * PAD)
    const py = TILE_H - PAD - ((y - lo) / span) * (TILE_H - 2 * PAD)
    return `${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`
  }).join('')
}

const Arrow = ({ dark, className }) => (
  <svg viewBox="0 0 24 24" aria-hidden focusable="false" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    className={cn('size-5 shrink-0', dark ? 'text-mist' : 'text-ink-3', className)}>
    <path d="M3.5 12h16M13.5 6l6 6-6 6"/>
  </svg>
)

export function NetworkPath({ className, dark = false }) {
  const cells = Array.from({ length: CONTEXT_WINDOWS }, (_, i) => i)
  return (
    <figure className={cn('m-0 flex flex-col items-center gap-2', className)}>
      <ul className="m-0 grid w-full max-w-[20rem] list-none grid-cols-2 gap-2 p-0">
        {SENSOR_ORDER.map(id => (
          <li key={id} className={cn('min-w-0 rounded-panel border px-2 pb-1.5 pt-2',
            dark ? 'border-ink-3 bg-ink-2' : 'border-rule bg-card')}>
            <svg viewBox={`0 0 ${TILE_W} ${TILE_H}`} aria-hidden focusable="false"
              className={cn('block w-full', STROKE(dark))} fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={curvePath(R.shapes[CURVE_OF[id]])}/>
            </svg>
            <p className={cn(SMALL(dark), 'mt-1')}>{SENSORS[id].name}</p>
          </li>
        ))}
      </ul>
      <Arrow dark={dark} className="rotate-90"/>
      <div className="w-full max-w-[20rem]">
        <div className="grid grid-cols-8 gap-1">
          {cells.map(i => (
            <span key={i} className={cn('block h-7 rounded-xs border',
              dark ? 'border-ink-3' : 'border-rule',
              i === cells.length - 1 && (dark ? 'bg-accent-lit' : 'bg-accent'))}/>
          ))}
        </div>
        <p className={cn(SMALL(dark), 'mt-1 text-center')}>Last {MEMORY_MIN} minutes</p>
      </div>
      <Arrow dark={dark} className="rotate-90"/>
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 64 64" aria-hidden focusable="false" className={cn('size-16', STROKE(dark))}
          fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <circle cx="32" cy="32" r="24" strokeDasharray="113 38" transform="rotate(135 32 32)"/>
        </svg>
        <p className={cn(SMALL(dark), 'mt-1')}>{SCORE}</p>
      </div>
    </figure>
  )
}

/* ── 4. The three consent rules ─────────────────────────────────────────── */

/* Each rule is checkable in lib/caseload.js and the parent dashboard. The mark
   repeats the word so colour is never the only carrier. */
const RULES = [
  { ok: false, who: 'Parent', what: 'Anything finer than one day' },
  { ok: false, who: PRO, what: `A group under ${K_ANONYMITY} students` },
  { ok: true, who: 'Audit log', what: 'Every record opened' },
]

export function ConsentRules({ className, dark = false }) {
  return (
    <figure className={cn('m-0', className)}>
      <ul className={cn('m-0 flex list-none flex-col gap-0 rounded-panel border p-0',
        dark ? 'border-ink-3 bg-ink-2' : 'border-rule bg-card')}>
        {RULES.map(r => (
          <li key={r.what} className={cn('grid grid-cols-[1rem_minmax(0,1fr)_auto] items-start gap-3',
            'border-t px-3 py-2 first:border-t-0', dark ? 'border-ink-3' : 'border-rule')}>
            <span className="mt-[0.2rem]">
              {r.ok ? <Always aria-hidden className={cn('size-4', STROKE(dark))}/>
                    : <Never aria-hidden className={cn('size-4', dark ? 'text-mist' : 'text-ink-3')}/>}
            </span>
            <span className="min-w-0">
              <span className={cn('block', LABEL(dark))}>{r.who}</span>
              <span className={cn('block', SMALL(dark))}>{r.what}</span>
            </span>
            <span className={cn('text-fine font-semibold',
              r.ok ? STROKE(dark) : (dark ? 'text-mist' : 'text-ink-3'))}>
              {r.ok ? 'Always' : 'Never'}
            </span>
          </li>
        ))}
      </ul>
    </figure>
  )
}
