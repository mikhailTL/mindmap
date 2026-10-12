import React from 'react'
import { ScrollScene } from '../ui/motion'

/* One small line drawing per part card on the hardware page's dark band.
 * They follow views/Patch.jsx: one shared viewBox for all three, the same
 * stadium flange with a centred pod, the same stroke weights (1.6 outline,
 * 1.5 body, 1.2-1.0 construction line), construction geometry dashed.
 * These sit on the ink band. Against #0b2b33, ink is 1.00 and accent 2.80 —
 * both unusable — so every stroke is one of three measured values:
 *   paper      #f5fafa   14.47 : 1   the raised body
 *   mist       #dfecee   12.69 : 1   the plastic
 *   accent.lit #3fd6c4    7.67 : 1   the one thing each card is about
 * Under reduced motion ScrollScene resolves each drawing to its `to` angle. */
const PAPER = '#f5fafa'
const MIST  = '#dfecee'
const LIT   = '#3fd6c4'
const GND   = '#0b2b33'   /* the panel's own ground, used to mask, never to draw */

/* Engineering-drawing proportions on a shorter canvas: 440x200, not 440x260. */
const FL  = { x:12,  y:40, width:416, height:120, rx:60 }
const POD = { x:114, y:56, width:212, height:88,  rx:36 }

/* `tilt` is per drawing so the three do not move as one plate. Nine degrees
   rotateX, three rotateZ, 18px depth is the whole budget — at 76px (44-56 at
   lg) the 1px construction lines alias past that.
   `h-full` on the scene is load-bearing at lg: the card's ink panel sets its
   own height there and the page constrains the svg with `lg:[&_svg]:h-full`,
   and a percentage height resolves against this wrapper. Without it the svg
   measures against `auto` and falls back to its own 88px. */
function Frame({ label, children, tilt }) {
  return (
    <ScrollScene perspective={620} narrow={0.5} className="h-full"
      from={tilt[0]} to={tilt[1]}>
      <svg viewBox="0 0 440 200" role="img" aria-label={label}
        preserveAspectRatio="xMidYMid meet"
        className="h-[76px] w-full sm:h-[88px]">
        {children}
      </svg>
    </ScrollScene>
  )
}

const TILT = {
  shell: [{ rotateX: 9, rotateZ: -3, z: -18 }, { rotateX: -5, rotateZ: 2, z: 10 }],
  pod:   [{ rotateX: 7, rotateZ: 2, z: -12 }, { rotateX: -4, rotateZ: -3, z: 14 }],
  base:  [{ rotateX: -6, rotateZ: 3, z: 12 }, { rotateX: 8, rotateZ: -2, z: -16 }],
}

/* Printed shell: adhesive flange hatched, raised body on top, charging slot
   straddling the body wall so it breaks the outline. A port that does not
   break the outline is a sticker. */
export const ShellArt = (
  <Frame tilt={TILT.shell} label="The printed shell, face on, with the charging slot breaking its side wall">
    <defs>
      <pattern id="pp-shell-hatch" width="7" height="7" patternTransform="rotate(45)"
        patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="7" stroke={MIST} strokeOpacity=".42" strokeWidth="1"/>
      </pattern>
    </defs>
    <rect {...FL} fill="none" stroke={MIST} strokeWidth="1.6"/>
    {/* The hatch covers the whole stadium and is masked by the opaque body,
        so it survives only in the flange ring. The ring IS the adhesive. */}
    <rect {...FL} fill="url(#pp-shell-hatch)"/>
    <rect x="22" y="49" width="396" height="102" rx="51"
      fill="none" stroke={MIST} strokeOpacity=".4" strokeWidth="1"/>
    <rect {...POD} fill={GND} stroke={PAPER} strokeWidth="1.5"/>
    <rect x="126" y="68" width="188" height="64" rx="28"
      fill="none" stroke={PAPER} strokeOpacity=".38" strokeWidth="1"/>
    <rect x="310" y="86" width="30" height="28" rx="9" fill={GND} stroke={LIT} strokeWidth="1.8"/>
    <path d="M12 100H2M428 100h10" stroke={MIST} strokeOpacity=".4" strokeWidth="1"/>
  </Frame>
)

/* Electronics pod: a tray and the bought board dropping into it. */
export const PodArt = (
  <Frame tilt={TILT.pod} label="The electronics pod, a tray with the board dropping into it">
    <rect {...FL} fill="none" stroke={MIST} strokeOpacity=".35" strokeWidth="1" strokeDasharray="6 6"/>
    <rect x="112" y="52" width="216" height="96" rx="14" fill="none" stroke={MIST} strokeWidth="1.6"/>
    <rect x="124" y="62" width="192" height="76" rx="8"
      fill="none" stroke={MIST} strokeOpacity=".42" strokeWidth="1"/>
    <rect x="146" y="74" width="148" height="52" rx="5" fill="none" stroke={LIT} strokeWidth="1.6"/>
    <rect x="200" y="66" width="40" height="10" rx="3"
      fill="none" stroke={LIT} strokeOpacity=".7" strokeWidth="1.2"/>
    <g stroke={LIT} strokeOpacity=".85" strokeWidth="1.4">
      {[84, 96, 108, 120].flatMap(y => [
        <path key={'l' + y} d={`M152 ${y}h12`}/>,
        <path key={'r' + y} d={`M276 ${y}h12`}/>,
      ])}
    </g>
    <g stroke={PAPER} strokeOpacity=".5" strokeWidth="1.2" fill="none">
      <path d="M168 24v16M168 40l-4.5-5.5M168 40l4.5-5.5"/>
      <path d="M272 24v16M272 40l-4.5-5.5M272 40l4.5-5.5"/>
    </g>
  </Frame>
)

/* The skin-side base, seen from the skin: the whole face is adhesive, so the
   whole stadium is hatched. The wing electrodes and central window are the
   contacts. */
export const BaseArt = (
  <Frame tilt={TILT.base} label="The skin-side base, the adhesive face with its sensor contacts">
    <defs>
      <pattern id="pp-base-hatch" width="7" height="7" patternTransform="rotate(45)"
        patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="7" stroke={MIST} strokeOpacity=".32" strokeWidth="1"/>
      </pattern>
    </defs>
    <rect {...FL} fill="url(#pp-base-hatch)" stroke={MIST} strokeWidth="1.5"/>
    <rect {...POD} fill="none" stroke={MIST} strokeOpacity=".35" strokeWidth="1.2" strokeDasharray="5 5"/>
    {[62, 378].map(cx => (
      <g key={cx}>
        <circle cx={cx} cy="100" r="26" fill={GND} stroke={LIT} strokeWidth="1.6"/>
        <circle cx={cx} cy="100" r="16" fill="none" stroke={LIT} strokeOpacity=".5" strokeWidth="1"/>
      </g>
    ))}
    <rect x="188" y="78" width="64" height="44" rx="12" fill={GND} stroke={LIT} strokeWidth="1.5"/>
    <circle cx="204" cy="94" r="5" fill={LIT}/>
    <circle cx="236" cy="94" r="5" fill={LIT}/>
    <rect x="206" y="104" width="28" height="11" rx="3"
      fill="none" stroke={PAPER} strokeOpacity=".65" strokeWidth="1.2"/>
    <rect x="206" y="130" width="28" height="12" rx="3" fill="none" stroke={LIT} strokeWidth="1.3"/>
  </Frame>
)

/* Keyed by LAYERS[].part, so the page maps a card to its drawing without a
   second ordering to keep in step. */
export const PART_ART = { pod: ShellArt, pcb: PodArt, base: BaseArt }
