import React from 'react'
import { cn } from '../lib/utils'

/* The patch face on: the marketing view, NOT the accurate one.
 * views/Patch.jsx carries the engineering drawing (412 x 148 stadium, 216 x
 * 108 pod). This is a tall white oval drawn from the supplied reference. Three
 * features must stay in the same relative places: the charging tab breaking
 * the outline at the top, the pod boundary stepped in from the flange, and the
 * sensor window with its single green point at the centre of the lower face.
 * Exactly two gradients, both linear, both doing curvature. Contrast across
 * the drawing is deliberately tiny — white plastic in soft light has almost
 * none. */

/* One superellipse used twice, shell and pod. k is handle length as a fraction
   of the radius: a true ellipse is 0.552, 0.74 pushes the sides straighter. */
function oval(cx, cy, a, b, k = 0.74) {
  const hx = a * k, hy = b * k
  return `M${cx} ${cy - b}`
    + `C${cx + hx} ${cy - b} ${cx + a} ${cy - hy} ${cx + a} ${cy}`
    + `C${cx + a} ${cy + hy} ${cx + hx} ${cy + b} ${cx} ${cy + b}`
    + `C${cx - hx} ${cy + b} ${cx - a} ${cy + hy} ${cx - a} ${cy}`
    + `C${cx - a} ${cy - hy} ${cx - hx} ${cy - b} ${cx} ${cy - b}Z`
}

const SHELL = oval(120, 172, 96, 132)
const POD   = oval(120, 172, 76, 108)

/* The mark's geometry, lifted from ui/logo.jsx rather than redrawn: 36 x 20
   stadium, two-peak ridge, terminal dot. Stroke widths are divided by S so the
   etch stays a hairline instead of scaling with the coordinates. */
const S = 2.55
const MARK_X = 120 - (40 * S) / 2
const MARK_Y = 150 - (28 * S) / 2

function Mark({ dx, dy, color, opacity, width }) {
  return (
    <g transform={`translate(${MARK_X + dx} ${MARK_Y + dy}) scale(${S})`}
      stroke={color} strokeOpacity={opacity} fill="none" strokeWidth={width / S}>
      <rect x="2" y="4" width="36" height="20" rx="10"/>
      <path d="M10.5 18.2 15 10.2 20 15.8 25.4 11 29.5 17.6"
        strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="29.5" cy="17.6" r="2.4" fill={color} fillOpacity={opacity} strokeWidth="0"/>
    </g>
  )
}

/* Groove = three offset strokes: lit lower lip, shadowed upper lip, floor of
   the cut on top. Offsets stay sub-pixel at drawing scale. */
function Etched({ children }) { return children }

export function PatchFront({ className, size, label }) {
  const name = label
    || 'The MindMap patch seen from the front: a white oval shell with the MindMap logo etched into it'
  return (
    <svg viewBox="0 0 240 320" role="img" aria-label={name}
      className={cn('block h-auto', className)}
      style={size ? { width: size } : undefined}>
      <defs>
        <linearGradient id="pf-shell" x1="0.12" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#ffffff"/>
          <stop offset="0.55" stopColor="#fbfdfc"/>
          <stop offset="1" stopColor="#e9f1ec"/>
        </linearGradient>
        <linearGradient id="pf-pod" x1="0.2" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#ffffff"/>
          <stop offset="1" stopColor="#f1f7f3"/>
        </linearGradient>
      </defs>

      {/* The charging tab, drawn before the shell so the shell covers its
          root. A port that does not break the outline is a sticker. */}
      <g aria-hidden="true">
        <rect x="97" y="23" width="46" height="30" rx="11"
          fill="#f3f8f5" stroke="#8eb0b6" strokeOpacity="0.5" strokeWidth="1.4"/>
        <rect x="106" y="31" width="28" height="4.5" rx="2.25" fill="#8eb0b6" fillOpacity="0.55"/>
      </g>

      <g aria-hidden="true">
        <path d={SHELL} fill="url(#pf-shell)" stroke="#8eb0b6" strokeOpacity="0.62" strokeWidth="1.7"/>
        <path d="M99 44q21 7 42 0" fill="none" stroke="#bed6da" strokeWidth="1.1"/>

        {/* pod boundary: one step, a shadow line with a lit line under it,
            which is all a 1mm rise looks like on white plastic */}
        <path d={POD} fill="url(#pf-pod)" stroke="#bed6da" strokeWidth="1.1"/>
        <path d={oval(120, 173.4, 76, 108)} fill="none" stroke="#ffffff" strokeWidth="1.4"/>
        <path d={POD} fill="none" stroke="#8eb0b6" strokeOpacity="0.28" strokeWidth="1"/>

        <Etched>
          <Mark dx={0.9} dy={1.2} color="#ffffff" opacity={0.95} width={3.2}/>
          <Mark dx={-0.6} dy={-0.8} color="#0b2b33" opacity={0.12} width={3.2}/>
          <Mark dx={0} dy={0} color="#8eb0b6" opacity={0.72} width={3}/>
        </Etched>

        {/* Satoshi — the etch on the real shell is the same lockup the site
            is set in. */}
        <g className="font-display" textAnchor="middle" fontSize="20" fontWeight="700"
          letterSpacing="-0.5">
          <text x="120.9" y="209.2" fill="#ffffff" fillOpacity="0.95">MindMap</text>
          <text x="119.4" y="207.2" fill="#0b2b33" fillOpacity="0.12">MindMap</text>
          <text x="120" y="208" fill="#8eb0b6" fillOpacity="0.74">MindMap</text>
        </g>

        {/* sensor window, in the same place the engineering drawing puts it */}
        <circle cx="120" cy="248" r="23" fill="#f4f8f6" stroke="#bed6da" strokeWidth="1.1"/>
        <circle cx="120" cy="248" r="14" fill="none" stroke="#8eb0b6" strokeOpacity="0.3" strokeWidth="1"/>
        <circle cx="120" cy="248" r="4.6" fill="#0a6e68"/>

        <path d="M32 214q22 66 88 66t88 -66" fill="none"
          stroke="#8eb0b6" strokeOpacity="0.22" strokeWidth="2.2"/>
      </g>
    </svg>
  )
}
