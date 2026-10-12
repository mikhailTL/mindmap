import React from 'react'
import { ScrollScene } from '../ui/motion'

/* One small line drawing per part card on the hardware page's dark band.
 *
 * They follow views/Patch.jsx rather than inventing a second drawing style:
 * one shared viewBox for all three, the same stadium flange with a centred
 * pod, the same stroke weights (1.6 for an outline, 1.5 for a body, 1.2 to 1
 * for a construction line), and construction geometry dashed so it reads as
 * registration and not as a part.
 *
 * What had to change is the ground. These cards stand on the ink band, so each
 * drawing is given its own ink panel inside the card and the band's palette
 * applies: ink is 1.00 on itself and accent is 2.80, both unusable, so every
 * stroke here is one of three values measured against #0b2b33.
 *
 *   paper      #f5fafa   14.47 : 1
 *   mist       #dfecee   12.69 : 1
 *   accent.lit #3fd6c4    7.67 : 1
 *
 * accent.lit carries the one thing each card is about: the charging slot, the
 * board in its tray, the skin contacts. mist draws the plastic, paper the
 * raised body.
 *
 * They do animate now, which reverses what this comment used to claim. Three
 * line drawings of three parts of one object, stacked down a rail beside a 3D
 * viewer of that same object, read as three flat icons when every one of them
 * is square to the page. Each one is given its own small ScrollScene, so the
 * rail reads as three objects sitting in space at slightly different angles
 * and turning as the reader goes past. It is kept deliberately small — these
 * are 76px tall, 44 to 56 at lg, and a drawing that size cannot carry a tip
 * worth more than a few degrees before the strokes start to alias. The
 * reduced-motion branch is ScrollScene's: under that setting each drawing
 * resolves to the `to` angle and holds there, fully drawn.
 *
 * No labels. The card beside each drawing already names the part in the page's
 * own type, and 15px mono inside a 90px figure is a caption nobody reads.
 */
const PAPER = '#f5fafa'
const MIST  = '#dfecee'
const LIT   = '#3fd6c4'
const GND   = '#0b2b33'   /* the panel's own ground, used to mask, never to draw */

/* Same proportions as the engineering drawing, on a shorter canvas: 440x200
   instead of 440x260, because these sit three to a column and the height is
   the expensive dimension. */
const FL  = { x:12,  y:40, width:416, height:120, rx:60 }
const POD = { x:114, y:56, width:212, height:88,  rx:36 }

/* `tilt` is per drawing rather than one shared value, so the three do not move
   as one plate: the shell leads, the pod follows it a little flatter, and the
   base runs the opposite way in both rotateX and Z so the bottom of the rail
   is never parallel to the top. Nine degrees of rotateX, three of rotateZ and
   18px of depth is the whole budget at this size — the drawing is 76px tall,
   44 to 56 at lg, and past that the 1px construction lines start to alias.

   `h-full` on the scene is load-bearing at lg. The card's ink panel sets its
   own height there and the page constrains the svg to it with an
   `lg:[&_svg]:h-full`; a percentage height resolves against this wrapper, so
   without it the svg would be measuring against `auto` and fall back to its
   own 88px. Below lg the panel's height is auto and `h-full` resolves to auto
   with it, which is the same as not being there. */
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

/* The printed shell: the adhesive flange hatched, the raised body on top of
   it, and the charging slot straddling the body wall so it breaks the
   outline. A port that does not break the outline is a sticker. */
export const ShellArt = (
  <Frame tilt={TILT.shell} label="The printed shell, face on, with the charging slot breaking its side wall">
    <defs>
      <pattern id="pp-shell-hatch" width="7" height="7" patternTransform="rotate(45)"
        patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="7" stroke={MIST} strokeOpacity=".42" strokeWidth="1"/>
      </pattern>
    </defs>
    <rect {...FL} fill="none" stroke={MIST} strokeWidth="1.6"/>
    {/* The hatch covers the whole stadium and is masked by the opaque body, so
        it survives only in the flange ring. The ring IS the adhesive. */}
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

/* The electronics pod: a tray, and the bought board dropping into it. The two
   arrows are the only thing on any of these three that states an action, and
   the card's text is what says the board is bought separately. */
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
   whole stadium is hatched. The two wing electrodes and the central window
   are the contacts, which is what accent.lit is carrying here. */
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
