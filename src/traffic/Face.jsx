import React from 'react'
import { LIGHT_FACE } from '../signals/light.js'
import { cn } from '../lib/utils'

/* One lamp of the traffic light, and the face on it. Every lamp on every
 * Heads Up surface on the site is drawn here, so a lamp cannot be lit without
 * a face or carry a face while dark.
 *
 *   green   smile     upward arc
 *   yellow  neutral   straight line
 *   red     frown     downward arc
 *
 * The face is ink at 80 percent, stroke about 8 percent of the lamp, round
 * caps. Under 14 px the stroke is held at 1.5 px so the mouth still reads.
 * The face is decorative: the state is always written beside the lamp.
 *
 * A lit lamp glows in its own colour, as a real lamp does, from 14 px up
 * (smaller, the glow muddies the face). Pass glow={false} to turn it off.
 * The glow sits outside the face and under any words, so it never lowers the
 * contrast of the mouth or of text beside it. */

export const LAMP_COLOR = Object.freeze({ green: '#34c759', yellow: '#ffcc00', red: '#ff3b30' })
const FACE_INK = '#0d2b1e'

const MOUTH = {
  smile: 'M31 58 Q50 76 69 58',
  neutral: 'M33 64 H67',
  frown: 'M31 70 Q50 53 69 70',
}

const glowsAt = (glow, px) => (glow === undefined ? px >= 14 : !!glow)

export function LampFace({ light = 'green', size = 24, lit = true, glow, className, style }) {
  const color = LAMP_COLOR[light] || LAMP_COLOR.green
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 100 100" className={className}
      style={{ display: 'block', flexShrink: 0, overflow: 'visible',
        filter: lit && glowsAt(glow, size) ? `drop-shadow(0 0 ${Math.max(2, size * 0.28)}px ${color})` : undefined, ...style }}>
      <LampMarks light={light} px={size} lit={lit}/>
    </svg>
  )
}

/* The same lamp as an SVG group, for drawings that place lamps themselves
   (the week graph). Centre (cx, cy), diameter `size` in the drawing's units,
   `px` the size it will render at, so the small-lamp stroke floor holds.
   The glow here is a soft disc in the lamp's colour, the same reach as
   LampFace's drop shadow, so a chart's faces match the cards'. Where faces
   sit close in a row, draw every glow first (layer="glow") and then every
   lamp (layer="lamp"), so no glow ever lies over a neighbour's face. */
export function LampFaceG({ light = 'green', cx, cy, size, px = size, lit = true, glow, layer = 'all' }) {
  const k = size / 100
  const color = LAMP_COLOR[light] || LAMP_COLOR.green
  const id = 'lamp-glow-' + React.useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const on = lit && glowsAt(glow, px)
  return (
    <g transform={`translate(${cx - size / 2} ${cy - size / 2}) scale(${k})`} aria-hidden="true">
      {on && layer !== 'lamp' && (
        <>
          <defs>
            <radialGradient id={id}>
              <stop offset="0.55" stopColor={color} stopOpacity="0.6"/>
              <stop offset="1" stopColor={color} stopOpacity="0"/>
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="80" fill={`url(#${id})`}/>
        </>
      )}
      {layer !== 'glow' && <LampMarks light={light} px={px} lit={lit}/>}
    </g>
  )
}

function LampMarks({ light, px, lit }) {
  const color = LAMP_COLOR[light] || LAMP_COLOR.green
  const face = LIGHT_FACE[light] || 'smile'
  const sw = Math.max(8, (1.5 * 100) / px)
  const eye = Math.max(6.5, 90 / px)
  return (
    <>
      <circle cx="50" cy="50" r="50" fill={color} opacity={lit ? 1 : 0.2}/>
      {lit && (
        <g fill="none" stroke={FACE_INK} strokeOpacity="0.8" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="35" cy="40" r={eye} fill={FACE_INK} fillOpacity="0.8" stroke="none"/>
          <circle cx="65" cy="40" r={eye} fill={FACE_INK} fillOpacity="0.8" stroke="none"/>
          <path d={MOUTH[face]}/>
        </g>
      )}
    </>
  )
}

/* The arrow beside a Heads Up face: is the Mind Score for the range shown up,
   down or level against the range before it of the same length. Higher means
   more stress, so up is coral, down is green and level is ink. A solid tile
   with a white arrow and the points in it (white clears 5 : 1 on all three),
   and the whole of it spoken, so the colour never carries it alone. */
const DIR = {
  up:    { bg: '#b23009', d: 'M12 19.5V5M5.5 11.5L12 5l6.5 6.5', word: 'up' },
  down:  { bg: '#067049', d: 'M12 4.5V19M5.5 12.5L12 19l6.5-6.5', word: 'down' },
  level: { bg: '#426a58', d: 'M4.5 12H19M13 5.5l6.5 6.5-6.5 6.5', word: 'level' },
}
export const trendDir = change => (change == null || Number.isNaN(change) ? null
  : Math.round(change) > 0 ? 'up' : Math.round(change) < 0 ? 'down' : 'level')
export const trendLabel = (change, since) => {
  const dir = trendDir(change)
  if (!dir) return ''
  const n = Math.abs(Math.round(change))
  return dir === 'level' ? `Mind Score level with ${since}`
    : `Mind Score ${DIR[dir].word} ${n} ${n === 1 ? 'point' : 'points'} from ${since}`
}

export function FaceTrend({ change, since, small = false, className }) {
  const dir = trendDir(change)
  if (!dir) return null
  const t = DIR[dir]
  const n = Math.abs(Math.round(change))
  const label = trendLabel(change, since)
  return (
    <span role="img" aria-label={label} title={label}
      className={cn('inline-flex shrink-0 items-center justify-center gap-0.5 rounded-[10px] font-display font-bold',
        'leading-none tabular-nums text-white shadow-[0_2px_0_rgba(13,43,30,0.18)]',
        small ? 'h-7 min-w-7 px-1 text-fine' : 'h-8 min-w-8 px-1.5 text-ui', className)}
      style={{ background: t.bg }}>
      <svg aria-hidden="true" viewBox="0 0 24 24" width={small ? 18 : 21} height={small ? 18 : 21} fill="none"
        stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        <path d={t.d}/>
      </svg>
      {dir !== 'level' && <span aria-hidden="true">{n}</span>}
    </span>
  )
}

export default LampFace
