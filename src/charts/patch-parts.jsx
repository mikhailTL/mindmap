import React from 'react'
import { ScrollScene } from '../ui/motion'

/* One drawing per part card on the hardware page's dark band.
 *
 * WHAT WAS WRONG. Each card drew a single 440 by 260 silhouette into a strip
 * the page sizes at 324 by 50 at 1280 and 315 by 84 at 390. `meet` scales to
 * the smaller axis, so the drawing came out 109 units wide inside a 324 unit
 * panel: two thirds of every card was empty ground with one small outline
 * floating in it. The viewBox is 6 : 1 now, which is the shape of the strip
 * the page actually gives, and the drawing fills it.
 *
 * WHAT FILLS IT. Three orthographic views per part instead of one, on one
 * sheet divided by rules, the way a drawing sheet is divided: the face, a
 * long-axis elevation, and an enlarged detail of the one feature that card is
 * about. Every view carries centre lines, construction geometry dashed, and
 * hatching that means something (adhesive on the face, cut material in the
 * sections). No part of any view is decoration: the aria-label names every
 * piece of it, because a 50px strip has no room for type a reader could read
 * and a figure with unreadable labels is worse than one with none.
 *
 * DEPTH IS NOT DIMENSIONED. The elevations show that there is a raised body
 * on a flange; the thickness, the battery, the adhesive and the electrode
 * build are all open and no view here states a value for any of them. The
 * only settled dimension, 54 by 36 mm, is drawn to scale in every face view
 * and dimensioned on charts/patchstack.jsx, which is the figure that carries
 * the millimetre ruler.
 *
 * These sit on the ink band. Against #0d2b1e, ink is 1.00 and accent 2.80 -
 * both unusable - so every stroke is one of three measured values:
 *   paper      #f7faf8   14.47 : 1   the raised body
 *   mist       #e3ede7   12.69 : 1   the plastic
 *   accent.lit #3ecf9a    7.67 : 1   the one thing each card is about
 * Under reduced motion ScrollScene resolves each drawing to its `to` angle. */
const PAPER = '#f7faf8'
const MIST  = '#e3ede7'
const LIT   = '#3ecf9a'
const GND   = '#0d2b1e'   /* the panel's own ground, used to mask, never to draw */

/* Stroke hierarchy. The strip renders at about half a viewBox unit per CSS
   pixel, so nothing thinner than 1.6 survives: the previous file's 1.0
   construction lines aliased into a grey smear at the lg height. */
const OUT = 2.4, BODY = 1.8, CON = 1.6

/* Three view panes and the rules between them. */
const RULE_X = [201, 401]
const P = [{ cx: 101 }, { cx: 301 }, { cx: 500 }]

/* The settled footprint, to scale in every face view: 54 mm by 36 mm at
   2.25 units per millimetre. */
const FX = 60.75, FY = 40.5

const dashDot = { strokeDasharray: '11 3 2 3' }

/* A centre line crossing a whole view, which is what says the part is
   symmetrical about both axes rather than merely drawn that way. */
const Centre = ({ cx, cy = 50, w, h }) => (
  <g stroke={MIST} strokeOpacity=".45" strokeWidth={CON} {...dashDot}>
    <line x1={cx - w} y1={cy} x2={cx + w} y2={cy}/>
    <line x1={cx} y1={cy - h} x2={cx} y2={cy + h}/>
  </g>
)

/* The sheet furniture: two rules dividing the three views, and a corner tick
   at each end, so the strip reads as one sheet of three views. */
const Sheet = () => (
  <g stroke={MIST} strokeOpacity=".3" strokeWidth={CON}>
    {RULE_X.map(x => <line key={x} x1={x} y1="8" x2={x} y2="92"/>)}
    <path d="M4 14V4h10M596 14V4h-10M4 86v10h10M596 86v10h-10" fill="none"/>
  </g>
)

/* The skin the part sits against, drawn as a surface line with hatch ticks
   under it: the convention for "material continues below this line". */
const Skin = ({ x0, x1, y }) => {
  /* `y` is coerced: a JSX attribute written as y="72" arrives as a string and
     `y + 6` would silently produce "726", which paints the hatch 600 units
     below the viewBox and pushes the svg's own bbox with it. */
  const y0 = +y
  return (
    <g stroke={MIST} strokeOpacity=".42" strokeWidth={CON}>
      <line x1={x0} y1={y0} x2={x1} y2={y0}/>
      {Array.from({ length: Math.floor((x1 - x0) / 9) }, (_, i) => (
        <line key={i} x1={x0 + 4 + i * 9} y1={y0} x2={x0 + i * 9} y2={y0 + 6}/>
      ))}
    </g>
  )
}

/* `tilt` is per drawing so the three do not move as one plate. The angles are
   smaller than they were: the strip is 50px tall at lg and a nine degree
   rotateX threw its own edges past the clip.
   `h-full` on the scene is load-bearing at lg: the card's ink panel sets its
   own height there and the page constrains the svg with `lg:[&_svg]:h-full`,
   and a percentage height resolves against this wrapper. */
function Frame({ label, children, tilt }) {
  return (
    <ScrollScene perspective={760} narrow={0.5} className="h-full"
      from={tilt[0]} to={tilt[1]}>
      <svg viewBox="0 0 600 100" role="img" aria-label={label}
        preserveAspectRatio="xMidYMid meet"
        className="h-[56px] w-full sm:h-[64px]">
        <Sheet/>
        {children}
      </svg>
    </ScrollScene>
  )
}

const TILT = {
  shell: [{ rotateX: 6, rotateZ: -2, z: -12 }, { rotateX: -4, rotateZ: 1.5, z: 8 }],
  pod:   [{ rotateX: 5, rotateZ: 1.5, z: -9 }, { rotateX: -3, rotateZ: -2, z: 10 }],
  base:  [{ rotateX: -4, rotateZ: 2, z: 9 },   { rotateX: 6, rotateZ: -1.5, z: -11 }],
}

/* ── 1. The printed shell ───────────────────────────────────────────────── */
/* Face, long-axis elevation, and the charging slot enlarged. The slot
   straddles the body wall in both the face and the elevation: a port that
   does not break the outline is a sticker. */
export const ShellArt = (
  <Frame tilt={TILT.shell}
    label={'Three views of the printed shell. On the left, the face: the adhesive flange is '
      + 'hatched around a raised body 54 mm along the arm by 36 mm across it, the charging slot '
      + 'breaks the body wall, and centre lines cross both axes. In the middle, the long side '
      + 'view: the raised body stands on the flange, the slot breaks its side wall, and the '
      + 'skin surface is hatched beneath. On the right, the slot is enlarged through the cut '
      + 'wall. Depth is not dimensioned.'}>
    <defs>
      <pattern id="pp-shell-hatch" width="7" height="7" patternTransform="rotate(45)"
        patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="7" stroke={MIST} strokeOpacity=".5" strokeWidth="1.3"/>
      </pattern>
      <pattern id="pp-shell-cut" width="6" height="6" patternTransform="rotate(45)"
        patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="6" stroke={PAPER} strokeOpacity=".45" strokeWidth="1.2"/>
      </pattern>
    </defs>

    {/* face */}
    <rect x={P[0].cx - FX} y={50 - FY} width={FX * 2} height={FY * 2} rx="26"
      fill="url(#pp-shell-hatch)" stroke={MIST} strokeWidth={OUT}/>
    <rect x={P[0].cx - FX + 7} y={50 - FY + 7} width={FX * 2 - 14} height={FY * 2 - 14} rx="20"
      fill="none" stroke={MIST} strokeOpacity=".4" strokeWidth={CON}/>
    <rect x={P[0].cx - 37} y="28" width="74" height="44" rx="15"
      fill={GND} stroke={PAPER} strokeWidth={BODY}/>
    <rect x={P[0].cx - 30} y="34" width="60" height="32" rx="10"
      fill="none" stroke={PAPER} strokeOpacity=".38" strokeWidth={CON}/>
    <Centre cx={P[0].cx} w={FX + 9} h={FY + 5}/>
    <rect x={P[0].cx + 31} y="43" width="15" height="14" rx="4"
      fill={GND} stroke={LIT} strokeWidth={BODY}/>

    {/* long-axis elevation */}
    <Skin x0={P[1].cx - 70} x1={P[1].cx + 70} y="72"/>
    <rect x={P[1].cx - FX} y="62" width={FX * 2} height="10" rx="4"
      fill="url(#pp-shell-hatch)" stroke={MIST} strokeWidth={OUT}/>
    <path d={`M${P[1].cx - 38} 62V36a12 12 0 0 1 12-12h52a12 12 0 0 1 12 12v26`}
      fill={GND} stroke={PAPER} strokeWidth={BODY}/>
    <line x1={P[1].cx - 30} y1="32" x2={P[1].cx + 30} y2="32"
      stroke={PAPER} strokeOpacity=".38" strokeWidth={CON}/>
    <rect x={P[1].cx + 32} y="42" width="14" height="13" rx="4"
      fill={GND} stroke={LIT} strokeWidth={BODY}/>
    <g stroke={MIST} strokeOpacity=".45" strokeWidth={CON} {...dashDot}>
      <line x1={P[1].cx} y1="16" x2={P[1].cx} y2="80"/>
    </g>

    {/* the slot, enlarged: the wall is cut, so it is hatched */}
    <circle cx={P[2].cx} cy="50" r="38" fill="none" stroke={MIST} strokeOpacity=".3"
      strokeWidth={CON}/>
    <path d={`M${P[2].cx - 34} 18v64h22V62h26V38h-26V18Z`}
      fill="url(#pp-shell-cut)" stroke={PAPER} strokeWidth={BODY}/>
    <rect x={P[2].cx - 8} y="39" width="40" height="22" rx="7"
      fill={GND} stroke={LIT} strokeWidth={OUT}/>
    <rect x={P[2].cx + 14} y="45" width="16" height="10" rx="3" fill={LIT} fillOpacity=".7"/>
    <g stroke={MIST} strokeOpacity=".45" strokeWidth={CON} {...dashDot}>
      <line x1={P[2].cx - 42} y1="50" x2={P[2].cx + 42} y2="50"/>
    </g>
  </Frame>
)

/* ── 2. The electronics pod ─────────────────────────────────────────────── */
/* Tray in plan with the bought board in it, the same tray in section with the
   board dropping in, and one pad row enlarged. */
export const PodArt = (
  <Frame tilt={TILT.pod}
    label={'Three views of the electronics pod. On the left, the tray from above, with the '
      + 'bought board seated in it, its two pad rows and its connector, inside the dashed '
      + 'outline of the patch footprint. In the middle, the tray in section, with the board '
      + 'above it and arrows showing it dropping in. On the right, one pad row is enlarged '
      + 'against the cut tray wall. Depth is not dimensioned.'}>
    <defs>
      <pattern id="pp-pod-cut" width="6" height="6" patternTransform="rotate(45)"
        patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="6" stroke={MIST} strokeOpacity=".42" strokeWidth="1.2"/>
      </pattern>
    </defs>

    {/* plan: the footprint dashed, the tray solid, the board lit */}
    <rect x={P[0].cx - FX} y={50 - FY} width={FX * 2} height={FY * 2} rx="26"
      fill="none" stroke={MIST} strokeOpacity=".35" strokeWidth={CON} strokeDasharray="7 6"/>
    <rect x={P[0].cx - 44} y="23" width="88" height="54" rx="8"
      fill="none" stroke={MIST} strokeWidth={OUT}/>
    <rect x={P[0].cx - 38} y="29" width="76" height="42" rx="5"
      fill="none" stroke={MIST} strokeOpacity=".42" strokeWidth={CON}/>
    <rect x={P[0].cx - 30} y="34" width="60" height="32" rx="3"
      fill={GND} stroke={LIT} strokeWidth={BODY}/>
    <rect x={P[0].cx - 8} y="29" width="16" height="6" rx="2"
      fill="none" stroke={LIT} strokeOpacity=".75" strokeWidth={CON}/>
    <g stroke={LIT} strokeOpacity=".9" strokeWidth={CON}>
      {[40, 46, 52, 58].flatMap(y => [
        <path key={'l' + y} d={`M${P[0].cx - 28} ${y}h8`}/>,
        <path key={'r' + y} d={`M${P[0].cx + 20} ${y}h8`}/>,
      ])}
    </g>
    <Centre cx={P[0].cx} w={FX + 9} h={FY + 5}/>

    {/* section: the tray cut, the board above it, two arrows */}
    <path d={`M${P[1].cx - 56} 50v26h112V50`} fill="url(#pp-pod-cut)" stroke={MIST}
      strokeWidth={OUT}/>
    <path d={`M${P[1].cx - 48} 58v12h96V58`} fill="none" stroke={MIST} strokeOpacity=".42"
      strokeWidth={CON}/>
    <rect x={P[1].cx - 44} y="28" width="88" height="12" rx="2"
      fill={GND} stroke={LIT} strokeWidth={BODY}/>
    <g stroke={PAPER} strokeOpacity=".55" strokeWidth={CON} fill="none">
      <path d={`M${P[1].cx - 26} 44v8l-4-5M${P[1].cx - 26} 52l4-5`}/>
      <path d={`M${P[1].cx + 26} 44v8l-4-5M${P[1].cx + 26} 52l4-5`}/>
    </g>
    <g stroke={MIST} strokeOpacity=".45" strokeWidth={CON} {...dashDot}>
      <line x1={P[1].cx} y1="20" x2={P[1].cx} y2="84"/>
    </g>

    {/* one pad row, enlarged against the cut wall */}
    <circle cx={P[2].cx} cy="50" r="38" fill="none" stroke={MIST} strokeOpacity=".3"
      strokeWidth={CON}/>
    <path d={`M${P[2].cx - 36} 20v60h18V20Z`} fill="url(#pp-pod-cut)" stroke={MIST}
      strokeWidth={BODY}/>
    <rect x={P[2].cx - 10} y="22" width="46" height="56" rx="3"
      fill={GND} stroke={LIT} strokeWidth={OUT}/>
    <g stroke={LIT} strokeWidth="2.6">
      {[32, 44, 56, 68].map(y => <path key={y} d={`M${P[2].cx - 18} ${y}h26`}/>)}
    </g>
    <g stroke={PAPER} strokeOpacity=".4" strokeWidth={CON} {...dashDot}>
      <line x1={P[2].cx - 42} y1="50" x2={P[2].cx + 42} y2="50"/>
    </g>
  </Frame>
)

/* ── 3. The skin-side base ─────────────────────────────────────────────── */
/* The whole face is adhesive, so the whole stadium is hatched. The two wing
   electrodes and the central window are the contacts, and the enlarged view
   is the window: two emitters, one detector, and the path between them. */
export const BaseArt = (
  <Frame tilt={TILT.base}
    label={'Three views of the skin-side base. On the left, the adhesive face, hatched over the '
      + 'whole 54 by 36 mm stadium, with a wing electrode at each end, the central sensing '
      + 'window between them, and the pod outline dashed behind. In the middle, the base in '
      + 'section against the skin, with the electrodes standing out from the face and the '
      + 'window flush with it. On the right, the window is enlarged: two emitters, one '
      + 'detector, and the path each takes through the skin. Depth is not dimensioned.'}>
    <defs>
      <pattern id="pp-base-hatch" width="7" height="7" patternTransform="rotate(45)"
        patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="7" stroke={MIST} strokeOpacity=".42" strokeWidth="1.3"/>
      </pattern>
    </defs>

    {/* the adhesive face */}
    <rect x={P[0].cx - FX} y={50 - FY} width={FX * 2} height={FY * 2} rx="26"
      fill="url(#pp-base-hatch)" stroke={MIST} strokeWidth={OUT}/>
    <rect x={P[0].cx - 37} y="28" width="74" height="44" rx="15"
      fill="none" stroke={MIST} strokeOpacity=".35" strokeWidth={CON} strokeDasharray="6 5"/>
    {[P[0].cx - 44, P[0].cx + 44].map(cx => (
      <g key={cx}>
        <circle cx={cx} cy="50" r="13" fill={GND} stroke={LIT} strokeWidth={BODY}/>
        <circle cx={cx} cy="50" r="7" fill="none" stroke={LIT} strokeOpacity=".55"
          strokeWidth={CON}/>
      </g>
    ))}
    <rect x={P[0].cx - 15} y="40" width="30" height="20" rx="6"
      fill={GND} stroke={LIT} strokeWidth={BODY}/>
    <circle cx={P[0].cx - 7} cy="47" r="2.6" fill={LIT}/>
    <circle cx={P[0].cx + 7} cy="47" r="2.6" fill={LIT}/>
    <rect x={P[0].cx - 6} y="52" width="12" height="5" rx="1.5" fill="none"
      stroke={PAPER} strokeOpacity=".7" strokeWidth={CON}/>
    <Centre cx={P[0].cx} w={FX + 9} h={FY + 5}/>

    {/* section against the skin */}
    <Skin x0={P[1].cx - 70} x1={P[1].cx + 70} y="66"/>
    <path d={`M${P[1].cx - FX} 66V44h${FX * 2}v22`} fill="url(#pp-base-hatch)" stroke={MIST}
      strokeWidth={OUT}/>
    <path d={`M${P[1].cx - 52} 66v6h14v-6M${P[1].cx + 38} 66v6h14v-6`}
      fill={GND} stroke={LIT} strokeWidth={BODY}/>
    <rect x={P[1].cx - 15} y="58" width="30" height="8" rx="2"
      fill={GND} stroke={LIT} strokeWidth={BODY}/>
    <line x1={P[1].cx - 44} y1="44" x2={P[1].cx + 44} y2="44"
      stroke={MIST} strokeOpacity=".42" strokeWidth={CON}/>
    <g stroke={MIST} strokeOpacity=".45" strokeWidth={CON} {...dashDot}>
      <line x1={P[1].cx} y1="22" x2={P[1].cx} y2="82"/>
    </g>

    {/* the window, enlarged: emitters, detector, and the path between them */}
    <circle cx={P[2].cx} cy="50" r="38" fill="none" stroke={MIST} strokeOpacity=".3"
      strokeWidth={CON}/>
    <rect x={P[2].cx - 34} y="20" width="68" height="20" rx="5"
      fill={GND} stroke={PAPER} strokeWidth={BODY}/>
    <circle cx={P[2].cx - 22} cy="30" r="5" fill={LIT}/>
    <circle cx={P[2].cx + 22} cy="30" r="5" fill={LIT}/>
    <rect x={P[2].cx - 8} y="25" width="16" height="10" rx="2" fill="none"
      stroke={PAPER} strokeOpacity=".75" strokeWidth={BODY}/>
    <Skin x0={P[2].cx - 36} x1={P[2].cx + 36} y="74"/>
    <g stroke={LIT} strokeOpacity=".85" strokeWidth={CON} fill="none">
      <path d={`M${P[2].cx - 22} 36C${P[2].cx - 22} 60 ${P[2].cx} 68 ${P[2].cx} 40`}/>
      <path d={`M${P[2].cx + 22} 36C${P[2].cx + 22} 60 ${P[2].cx} 68 ${P[2].cx} 40`}/>
    </g>
  </Frame>
)

/* Keyed by LAYERS[].part, so the page maps a card to its drawing without a
   second ordering to keep in step. */
export const PART_ART = { pod: ShellArt, pcb: PodArt, base: BaseArt }
