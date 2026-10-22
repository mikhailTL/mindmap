import React from 'react'
import { LIGHT_FACE } from '../signals/light.js'
import { cn } from '../lib/utils'

export const LAMP_COLOR = Object.freeze({ green: '#34c759', yellow: '#ffcc00', red: '#ff3b30' })
const FACE_INK = '#0d2b1e'

const MOUTH = {
  smile: 'M31 58 Q50 76 69 58',
  neutral: 'M33 64 H67',
  frown: 'M31 70 Q50 53 69 70',
}

// By default a lit lamp glows only from 14 px up; smaller, the glow blurs the face.
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

// SVG-group version for charts. In a row of lamps, draw every layer="glow" first and then
// every layer="lamp", so no glow covers a neighbouring face.
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
  // Stroke is 8 units of the 100-unit viewBox, with a 1.5 px floor (150 / px units) so the
  // mouth still reads on small lamps.
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

// A higher Mind Score means more stress, so up is coral and down is green. White text
// clears 5:1 on all three backgrounds.
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
