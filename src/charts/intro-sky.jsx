import React from 'react'

/* The sky behind the title sequence: one arch and one cloud behind all six
 * beats, never cutting. The cloud walks from the left foot of the arch to the
 * right as the beats advance.
 * 1. The four band colours are fixed — the sensor hues from lib/sensors.js in
 *    the order charts/rainbow.jsx draws them (red outside, then orange, green,
 *    blue). Nothing here tints, washes or re-hues them: at 0.22 over a
 *    near-black green they composite to maroon and olive.
 * 2. The upward fade is a type budget. The group is painted at 0.55 and masked
 *    by a ramp holding 0.30 above y 420 and reaching 1 at the feet, so
 *    effective paint is at most 0.165 where the headline and sub-line sit.
 *    ink-2 #1f5560 clears 4.98 : 1 on the worst band at 0.165, ink #0b2b33
 *    clears 4.98 : 1 on the worst band at 0.55. Raising either spends that.
 * 3. ONE linearGradient for the whole cloud, gradientUnits="userSpaceOnUse",
 *    shared by every lobe. With the default objectBoundingBox each lobe gets
 *    its own copy of the ramp scaled to its own box and prints as a separately
 *    shaded disc. The cloud is unequal circles over a rounded base drawn
 *    twice: an edge pass painting the union's outer boundary, then a fill pass
 *    so no seam between lobes shows.
 * 4. Nothing may leave the viewBox at any cloud position. The cloud footprint
 *    is x -150..154, y -112..64 about its centre; the centre travels the half
 *    circle of radius 596 about (800, 780), so extremes are x 54..1550 and
 *    y 72..844 in a 1600 x 900 box. Fractal noise is centred on 0.5, so a
 *    displacement scale of 30 moves the boundary by at most 15 and the blur
 *    reaches ~10 past that, against a margin of 42 or more on every side.
 *    Clipped lobes print with a straight vertical cut down one side.
 * 5. xMidYMax pins the box to the bottom of the frame; the feet land in the
 *    side gutters the stage panels do not reach and the apex passes under the
 *    headline, where the mask has already taken the paint to almost nothing.
 * Only the cloud moves, and that transition is dropped under reduced motion. */

const VW = 1600, VH = 900
const CX = 800, CY = 780
const BAND = 40

/* Outside in. Radii 45 apart with a 40 stroke, which holds the innermost
   band's inner edge out at 365. The last beat puts type straight on the ground
   in the middle of the frame, so that empty half disc has to clear the
   wordmark, tagline, signal row and disclaimer at every size. */
const BANDS = [
  { r: 520, c: '#e11919' },   // Heart
  { r: 475, c: '#e86a05' },   // Sweat
  { r: 430, c: '#199e19' },   // Temperature
  { r: 385, c: '#1560e0' },   // Movement
]

/* The cloud's track: outside the outer band by half a stroke plus a clear 56. */
const R_CLOUD = 596

/* 420 is below the deepest the headline block reaches at 1280 x 800, which is
   what makes the 0.30 plateau a guarantee. */
const FADE_TOP = 420, FADE_BOT = 780, FADE_MIN = 0.3

const arc = r => `M${CX - r} ${CY} A${r} ${r} 0 0 1 ${CX + r} ${CY}`

/* [cx, cy, r] in cloud-local units; no two radii equal, set not symmetric. */
const LOBES = [[-104, 0, 46], [-52, -28, 62], [8, -42, 70], [72, -18, 54],
               [114, 6, 40], [-20, 14, 50], [52, 16, 44]]
const BASE = { x: -126, y: 4, w: 252, h: 56, r: 28 }
const TOP = -112, BOT = 64

/* 180 degrees is the left foot, 360 the right; t runs 0 to 1 across the beats. */
function along(t) {
  const a = Math.PI * (1 + t)
  return [CX + R_CLOUD * Math.cos(a), CY + R_CLOUD * Math.sin(a)]
}

/* One step between two feet, eased. Beats run ~14s, so the earlier 1500ms step
   read as a twitch followed by a long wait. */
const CSS = `
.is-sky .is-cloud{transition:transform 2400ms cubic-bezier(.33,0,.2,1)}
@media (prefers-reduced-motion:reduce){.is-sky .is-cloud{transition:none}}
`

/** Persistent sky. Cloud position is derived from `beat` and `count`, so
 *  adding or removing a beat needs nothing here. */
export function IntroSky({ beat = 0, count = 1 }) {
  /* ids cannot be constants: two of these could share a page and the second
     set of defs would silently lose to the first. */
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '')
  const grad = `is-g-${uid}`, fluff = `is-f-${uid}`
  const ramp = `is-r-${uid}`, veil = `is-m-${uid}`
  const t = count > 1 ? Math.min(1, Math.max(0, beat / (count - 1))) : 0
  const [cx, cy] = along(t)

  /* One shape set, two passes, identical geometry — that is what makes the
     edge pass an outline of the union and not of each lobe. */
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
        {/* A gradient stop clamps outside its span, so everything above
            FADE_TOP gets exactly FADE_MIN and everything below the feet 1. */}
        <linearGradient id={ramp} gradientUnits="userSpaceOnUse"
          x1="0" y1={FADE_TOP} x2="0" y2={FADE_BOT}>
          <stop offset="0" stopColor="#ffffff" stopOpacity={FADE_MIN}/>
          <stop offset="1" stopColor="#ffffff" stopOpacity="1"/>
        </linearGradient>
        <mask id={veil} maskUnits="userSpaceOnUse" x="0" y="0" width={VW} height={VH}>
          <rect x="0" y="0" width={VW} height={VH} fill={`url(#${ramp})`}/>
        </mask>
        {/* Two octaves, then a small blur. More octaves is a screen-sized
            filter running on a phone. */}
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

      {/* Unmasked: the cloud has to be visible over the apex, where the bands
          have faded out. */}
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
