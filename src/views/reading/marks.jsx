import React from 'react'
import { Camera, Link, Stack } from '../../ui/marks'

/* What a reading looks like everywhere in the log. Colour says the band,
 * shape says the source, and both always sit beside words, so neither carries
 * a state on its own.
 *
 * Graphic hexes are the Tailwind tokens: crit, sun, accent, sky. Each clears
 * 3:1 on card. The `ink` classes are the same hues at text contrast. */
export const BAND = {
  high:  { word: 'Well above your usual',  short: 'Well above',  fill: '#a8321f', ink: 'text-crit' },
  up:    { word: 'A little above your usual', short: 'A little above', fill: '#b5871b', ink: 'text-sun-ink' },
  usual: { word: 'In your usual range',    short: 'Usual range', fill: '#157446', ink: 'text-accent' },
  low:   { word: 'Below your usual range', short: 'Below',       fill: '#2294e6', ink: 'text-sky-ink' },
}

export const SOURCE = {
  camera: { word: 'Camera',        Icon: Camera },
  survey: { word: 'Survey',        Icon: Stack },
  patch:  { word: 'Patch',         Icon: Link },
}

/* Circle for the camera, square for the six questions, diamond for the patch.
   Drawn about a centre so the chart and the list share one geometry. */
export function ShapePath({ source, cx, cy, r, ...rest }) {
  if (source === 'survey') {
    const s = r * 0.9
    return <rect x={cx - s} y={cy - s} width={s * 2} height={s * 2} rx={1} {...rest}/>
  }
  if (source === 'patch') {
    const s = r * 1.25
    return <path d={`M${cx} ${cy - s}L${cx + s} ${cy}L${cx} ${cy + s}L${cx - s} ${cy}Z`} {...rest}/>
  }
  return <circle cx={cx} cy={cy} r={r} {...rest}/>
}

export function Shape({ source, fill = 'currentColor', size = 14, hollow = false, className }) {
  return (
    <svg aria-hidden viewBox="0 0 14 14" width={size} height={size} className={className}>
      <ShapePath source={source} cx={7} cy={7} r={5}
        fill={hollow ? 'none' : fill} stroke={fill} strokeWidth={hollow ? 1.6 : 0}/>
    </svg>
  )
}

/* Times and days as a reader in the US says them. */
export function clock(at) {
  const d = new Date(at)
  const h = d.getHours(), m = d.getMinutes()
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`
}

const midnight = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime() }

export function dayName(at, now) {
  const diff = Math.round((midnight(now) - midnight(at)) / 864e5)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return new Date(at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

export function when(at, now) {
  const day = dayName(at, now)
  return `${clock(at)} ${day === 'Today' || day === 'Yesterday' ? day.toLowerCase()
    : new Date(at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
}
