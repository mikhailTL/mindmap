import React from 'react'
import { LIGHT_FACE } from '../signals/light.js'

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
 * The face is decorative: the state is always written beside the lamp. */

export const LAMP_COLOR = Object.freeze({ green: '#34c759', yellow: '#ffcc00', red: '#ff3b30' })
const FACE_INK = '#0d2b1e'

const MOUTH = {
  smile: 'M31 58 Q50 76 69 58',
  neutral: 'M33 64 H67',
  frown: 'M31 70 Q50 53 69 70',
}

export function LampFace({ light = 'green', size = 24, lit = true, glow = false, className, style }) {
  const color = LAMP_COLOR[light] || LAMP_COLOR.green
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 100 100" className={className}
      style={{ display: 'block', flexShrink: 0, overflow: 'visible',
        filter: lit && glow ? `drop-shadow(0 0 ${Math.max(2, size * 0.28)}px ${color})` : undefined, ...style }}>
      <LampMarks light={light} px={size} lit={lit}/>
    </svg>
  )
}

/* The same lamp as an SVG group, for drawings that place lamps themselves
   (the week graph). Centre (cx, cy), diameter `size` in the drawing's units,
   `px` the size it will render at, so the small-lamp stroke floor holds. */
export function LampFaceG({ light = 'green', cx, cy, size, px = size, lit = true }) {
  const k = size / 100
  return (
    <g transform={`translate(${cx - size / 2} ${cy - size / 2}) scale(${k})`} aria-hidden="true">
      <LampMarks light={light} px={px} lit={lit}/>
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

export default LampFace
