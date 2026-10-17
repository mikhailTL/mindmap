import React from 'react'
import { clock } from './kit'

/* A stretch of the demo day's per-minute index (signals/recovery.js demoDay),
 * drawn at true pixel size so its labels stay legible at any width. Children
 * get the scales and draw their own marks on top. */

export const Y_LO = 28, Y_HI = 86
const PAD = { l: 34, r: 12, t: 14, b: 28 }

export function scales(w, h, from, to) {
  const x = m => PAD.l + ((m - from) / (to - from)) * (w - PAD.l - PAD.r)
  const y = v => PAD.t + (1 - (v - Y_LO) / (Y_HI - Y_LO)) * (h - PAD.t - PAD.b)
  return { x, y, left: PAD.l, right: w - PAD.r, top: PAD.t, bottom: h - PAD.b }
}

export const pathOf = (series, from, to, x, y, step = 2) => {
  let d = ''
  for (let m = from; m <= to; m += step) d += `${m === from ? 'M' : 'L'}${x(m).toFixed(1)} ${y(series[m]).toFixed(1)}`
  return d
}

export function DayChart({ w, h = 230, from, to, tickEvery = 30, children }) {
  const s = scales(w, h, from, to)
  const ticks = []
  const first = Math.ceil(from / tickEvery) * tickEvery
  const minGap = 70 // px between labels, so a 390 phone gets fewer
  let lastX = -Infinity
  for (let m = first; m <= to; m += tickEvery) {
    const xx = s.x(m)
    if (xx - lastX >= minGap) { ticks.push(m); lastX = xx }
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden className="block max-w-full overflow-visible">
      {[40, 60, 80].map(v => (
        <g key={v}>
          <path d={`M${s.left} ${s.y(v)}H${s.right}`} stroke="#c2d7ca" strokeWidth="1"/>
          <text x={s.left - 6} y={s.y(v) + 4} textAnchor="end" fontSize="12" fill="#426a58">{v}</text>
        </g>
      ))}
      <path d={`M${s.left} ${s.bottom}H${s.right}`} stroke="#93b2a1" strokeWidth="1"/>
      {ticks.map(m => (
        <g key={m}>
          <path d={`M${s.x(m)} ${s.bottom}v4`} stroke="#93b2a1" strokeWidth="1"/>
          <text x={s.x(m)} y={s.bottom + 18} textAnchor="middle" fontSize="12" fill="#426a58">
            {clock(m).replace(':00', '')}</text>
        </g>
      ))}
      {children(s)}
    </svg>
  )
}
