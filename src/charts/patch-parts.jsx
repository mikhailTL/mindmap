import React from 'react'

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
 * stroke here is one of three values measured against #0d2b1e.
 *
 *   paper      #f7faf8   14.47 : 1
 *   mist       #e3ede7   12.69 : 1
 *   accent.lit #3ecf9a    7.67 : 1
 *
 * accent.lit carries the one thing each card is about: the charging slot, the
 * board in its tray, the skin contacts. mist draws the plastic, paper the
 * raised body. Nothing here animates, so there is no reduced-motion branch to
 * write; the drawings are identical however the reader has set that.
 *
 * No labels. The card beside each drawing already names the part in the page's
 * own type, and 15px mono inside a 90px figure is a caption nobody reads.
 */
const PAPER = '#f7faf8'
const MIST  = '#e3ede7'
const LIT   = '#3ecf9a'
const GND   = '#0d2b1e'   /* the panel's own ground, used to mask, never to draw */

/* Same proportions as the engineering drawing, on a shorter canvas: 440x200
   instead of 440x260, because these sit three to a column and the height is
   the expensive dimension. */
const FL  = { x:12,  y:40, width:416, height:120, rx:60 }
const POD = { x:114, y:56, width:212, height:88,  rx:36 }

function Frame({ label, children }) {
  return (
    <svg viewBox="0 0 440 200" role="img" aria-label={label}
      preserveAspectRatio="xMidYMid meet"
      className="h-[76px] w-full sm:h-[88px]">
      {children}
    </svg>
  )
}

/* The printed shell: the adhesive flange hatched, the raised body on top of
   it, and the charging slot straddling the body wall so it breaks the
   outline. A port that does not break the outline is a sticker. */
export const ShellArt = (
  <Frame label="The printed shell, face on, with the charging slot breaking its side wall">
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
  <Frame label="The electronics pod, a tray with the board dropping into it">
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
  <Frame label="The skin-side base, the adhesive face with its sensor contacts">
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
