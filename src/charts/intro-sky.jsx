import React from 'react'

/* The sky behind the title sequence.
 *
 * The review reported three things, and all three were one thing: the opening
 * was "too dark and bold", the cuts between beats were "abrupt lines", and a
 * "more soothing aqua/turquoise background" was asked for. The band that swept
 * the frame at every boundary was the line. It is gone, the grounds in
 * Intro.jsx are pale aqua now, and this is what carries the sequence instead:
 * one arch and one cloud that live BEHIND all six beats and never cut. The
 * cloud walks from the left foot of the arch to the right as the beats
 * advance, so the passage of the sequence is drawn by something continuous
 * rather than announced by a divider.
 *
 * Five rules this file exists to hold.
 *
 * 1. The four band colours are fixed. They are the sensor hues from
 *    lib/sensors.js, in the order charts/rainbow.jsx draws them on every other
 *    page: red outside, then orange, green, blue. Nothing here tints, washes
 *    or re-hues them. A green-tinted rainbow was tried once and rejected, and
 *    an earlier pass of this file laid them at 0.22 over a near-black green,
 *    which composited to maroon and olive. Pale ground is what lets the four
 *    read as themselves.
 *
 * 2. The bands fade upwards, and that fade is a type budget, not a mood. The
 *    group is painted at 0.55 and masked by a ramp that holds 0.30 above
 *    y 420 and reaches 1 at the feet, so the effective paint is at most 0.165
 *    where the headline and its sub-line sit and 0.55 at the feet. Measured
 *    against the six grounds: ink-2 #2a5744 clears 4.98 : 1 on the worst band
 *    at 0.165, ink #0d2b1e clears 4.98 : 1 on the worst band at 0.55, and both
 *    are 6.6 : 1 or better on bare ground. Raising either number spends that,
 *    and the arch is also the better picture for it: a rainbow dissolving into
 *    the sky at its apex and strongest at its feet is what one looks like.
 *
 * 3. One gradient for the whole cloud, in user space. A cloud here is a pile
 *    of unequal circles over a rounded base, drawn twice: an edge pass that
 *    paints the union's outer boundary, then a fill pass on top so no seam
 *    between two lobes shows. The fill is ONE linearGradient with
 *    gradientUnits="userSpaceOnUse" shared by every lobe. With the default
 *    objectBoundingBox each lobe gets its own copy of the ramp scaled to its
 *    own box, every lobe prints as a separately shaded disc, and the pile
 *    reads as a bag of balls. The cloud is opaque white with a soft cool rim,
 *    because at 0.18 over a dark ground it read as a grey smudge.
 *
 * 4. Nothing leaves the viewBox, at any cloud position. The cloud's footprint
 *    is x -150..154 and y -112..64 around its centre; the centre travels the
 *    half circle of radius 596 about (800, 780), so the extremes are x 54..1550
 *    and y 72..844 in a 1600 x 900 box. Fractal noise is centred on 0.5, so a
 *    displacement scale of 30 moves the boundary by at most 15 and the blur
 *    reaches about 10 past that, against a margin of 42 or more on every side.
 *    Clipped lobes printing with a straight vertical cut down one side was the
 *    other thing that broke here.
 *
 * 5. The arch is seated low and wide on purpose. xMidYMax pins the box to the
 *    bottom of the frame, the feet land out in the side gutters the stage
 *    panels do not reach, and the apex passes under the headline where the
 *    mask has already taken the paint down to almost nothing. The arch is a
 *    horizon behind the content, not a ring around it.
 *
 * The only thing that moves is the cloud, once per beat, and the transition is
 * dropped under prefers-reduced-motion. The arch and the cloud both render
 * finished with no animation at all.
 */

const VW = 1600, VH = 900
const CX = 800, CY = 780
const BAND = 40

/* Outside in. Radii 45 apart with a 40 stroke, which is the dial's own
   touching-band geometry: band edges all but meet, so the four read as one
   object with legible boundaries rather than four separate rings.
   The stack is deliberately thin. The last beat is the only one that puts
   type straight on the ground rather than on a plate, and it puts it in the
   middle of the frame; a 40 stroke holds the innermost band's inner edge out
   at 365, and the empty half disc inside that is wide enough to clear the
   wordmark, the tagline, the signal row and the disclaimer at every size the
   box is drawn at. Type on the ground never crosses a band. */
const BANDS = [
  { r: 520, c: '#e11919' },   // Heart
  { r: 475, c: '#e86a05' },   // Sweat
  { r: 430, c: '#199e19' },   // Temperature
  { r: 385, c: '#1560e0' },   // Movement
]

/* The track the cloud walks: outside the outer band by half a stroke plus a
   clear 56, so the cloud rides on the arch rather than through it. */
const R_CLOUD = 596

/* Where the upward fade starts and finishes. 420 is below the deepest the
   headline block reaches at 1280 x 800, which is what makes the 0.30 plateau a
   guarantee rather than a hope. */
const FADE_TOP = 420, FADE_BOT = 780, FADE_MIN = 0.3

const arc = r => `M${CX - r} ${CY} A${r} ${r} 0 0 1 ${CX + r} ${CY}`

/* [cx, cy, r] in cloud-local units, bottoms roughly level so the pile reads as
   one body resting on something. No two radii are equal and the set is not
   symmetric: a row of same-sized bumps is what reads as a stamp. */
const LOBES = [[-104, 0, 46], [-52, -28, 62], [8, -42, 70], [72, -18, 54],
               [114, 6, 40], [-20, 14, 50], [52, 16, 44]]
const BASE = { x: -126, y: 4, w: 252, h: 56, r: 28 }
/* The cloud's own y range, which is where the shared gradient's stops go. */
const TOP = -112, BOT = 64

/* 180 degrees is the left foot, 360 the right. t runs 0 to 1 across the beats,
   so the first beat puts the cloud on one foot and the last on the other. */
function along(t) {
  const a = Math.PI * (1 + t)
  return [CX + R_CLOUD * Math.cos(a), CY + R_CLOUD * Math.sin(a)]
}

const CSS = `
.is-sky .is-cloud{transition:transform 1500ms cubic-bezier(.33,0,.2,1)}
@media (prefers-reduced-motion:reduce){.is-sky .is-cloud{transition:none}}
`

/** The persistent sky. `beat` is the index now playing and `count` the number
 *  of beats; the cloud's position is derived from the pair, so adding or
 *  removing a beat needs nothing here. */
export function IntroSky({ beat = 0, count = 1 }) {
  /* Two of these could share a page, so the ids cannot be constants: the
     second set of defs would silently lose to the first. */
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '')
  const grad = `is-g-${uid}`, fluff = `is-f-${uid}`
  const ramp = `is-r-${uid}`, veil = `is-m-${uid}`
  const t = count > 1 ? Math.min(1, Math.max(0, beat / (count - 1))) : 0
  const [cx, cy] = along(t)

  /* One shape set, two passes. Identical geometry in both, which is what makes
     the edge pass an outline of the union and not of each lobe. */
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
        {/* The type budget, drawn. A gradient stop clamps outside its span, so
            everything above FADE_TOP gets exactly FADE_MIN and everything
            below the feet gets exactly 1. */}
        <linearGradient id={ramp} gradientUnits="userSpaceOnUse"
          x1="0" y1={FADE_TOP} x2="0" y2={FADE_BOT}>
          <stop offset="0" stopColor="#ffffff" stopOpacity={FADE_MIN}/>
          <stop offset="1" stopColor="#ffffff" stopOpacity="1"/>
        </linearGradient>
        <mask id={veil} maskUnits="userSpaceOnUse" x="0" y="0" width={VW} height={VH}>
          <rect x="0" y="0" width={VW} height={VH} fill={`url(#${ramp})`}/>
        </mask>
        {/* Fluff, cheaply: two octaves of noise pushing the union's boundary
            around, then a small blur to take the hardness off it. Any more
            octaves is a filter the size of the screen running on a phone. */}
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

      {/* Unmasked, because the cloud is the thing that has to be visible at
          every step of the walk, including the step over the apex where the
          bands have faded out. */}
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
