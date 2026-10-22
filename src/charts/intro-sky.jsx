import React from 'react'

// Sky behind the title sequence: four sensor-colour arcs and one cloud that moves from the left foot
// to the right as the beats advance.
const VW = 1600, VH = 900
const CX = 800, CY = 780
const BAND = 40

// Outside in: heart, sweat, temperature, movement.
const BANDS = [
  { r: 520, c: '#e11919' },
  { r: 475, c: '#e86a05' },
  { r: 430, c: '#199e19' },
  { r: 385, c: '#1560e0' },
]

const R_CLOUD = 596

// The mask holds 0.30 above y 420, which keeps the bands faint enough under the headline for text contrast.
const FADE_TOP = 420, FADE_BOT = 780, FADE_MIN = 0.3

const arc = r => `M${CX - r} ${CY} A${r} ${r} 0 0 1 ${CX + r} ${CY}`

const LOBES = [[-104, 0, 46], [-52, -28, 62], [8, -42, 70], [72, -18, 54],
               [114, 6, 40], [-20, 14, 50], [52, 16, 44]]
const BASE = { x: -126, y: 4, w: 252, h: 56, r: 28 }
const TOP = -112, BOT = 64

// 180 degrees is the left foot, 360 the right; t runs 0 to 1 across the beats.
function along(t) {
  const a = Math.PI * (1 + t)
  return [CX + R_CLOUD * Math.cos(a), CY + R_CLOUD * Math.sin(a)]
}

const CSS = `
.is-sky .is-cloud{transition:transform 2400ms cubic-bezier(.33,0,.2,1)}
@media (prefers-reduced-motion:reduce){.is-sky .is-cloud{transition:none}}
`

export function IntroSky({ beat = 0, count = 1 }) {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '')
  const grad = `is-g-${uid}`, fluff = `is-f-${uid}`
  const ramp = `is-r-${uid}`, veil = `is-m-${uid}`
  const t = count > 1 ? Math.min(1, Math.max(0, beat / (count - 1))) : 0
  const [cx, cy] = along(t)

  const pile = props => (
    <>
      <rect x={BASE.x} y={BASE.y} width={BASE.w} height={BASE.h} rx={BASE.r} {...props}/>
      {LOBES.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} {...props}/>)}
    </>
  )

  return (
    <svg className="is-sky pointer-events-none absolute inset-0 size-full" aria-hidden
      focusable="false" viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMax meet">
      <style>{CSS}</style>
      <defs>
        <linearGradient id={grad} gradientUnits="userSpaceOnUse" x1="0" y1={TOP} x2="0" y2={BOT}>
          <stop offset="0" stopColor="#ffffff"/>
          <stop offset="1" stopColor="#e9f4f3"/>
        </linearGradient>
        <linearGradient id={ramp} gradientUnits="userSpaceOnUse"
          x1="0" y1={FADE_TOP} x2="0" y2={FADE_BOT}>
          <stop offset="0" stopColor="#ffffff" stopOpacity={FADE_MIN}/>
          <stop offset="1" stopColor="#ffffff" stopOpacity="1"/>
        </linearGradient>
        <mask id={veil} maskUnits="userSpaceOnUse" x="0" y="0" width={VW} height={VH}>
          <rect x="0" y="0" width={VW} height={VH} fill={`url(#${ramp})`}/>
        </mask>
        <filter id={fluff} x="-25%" y="-35%" width="150%" height="170%">
          <feTurbulence type="fractalNoise" baseFrequency="0.013" numOctaves="2"
            seed="11" result="n"/>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="30"
            xChannelSelector="R" yChannelSelector="G" result="d"/>
          <feGaussianBlur in="d" stdDeviation="3.4"/>
        </filter>
      </defs>

      <g opacity="0.55" mask={`url(#${veil})`}>
        {BANDS.map(b => (
          <path key={b.c} d={arc(b.r)} fill="none" stroke={b.c} strokeWidth={BAND}/>
        ))}
      </g>

      <g className="is-cloud"
        style={{ transform: `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px)` }}>
        <g filter={`url(#${fluff})`}>
          <g fill="#a4c4c0" stroke="#a4c4c0" strokeWidth="7">{pile({})}</g>
          <g fill={`url(#${grad})`}>{pile({})}</g>
        </g>
      </g>
    </svg>
  )
}
