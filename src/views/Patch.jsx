import React from 'react'
import { motion, useTransform } from 'framer-motion'
import { ScrollScene } from '../s21/motion'
const T = { fontFamily:'ui-monospace,monospace' }

/* All three drawings share one wide viewBox and one set of coordinates, so the
   exploded layers register on top of each other without per-layer nudging.

   What changed: every layer used to be drawn on a 400x400 square as a 308x228
   rounded rectangle — a 4:3 block that read as a pebble or a games console,
   not as something you stick on a forearm. A skin patch is a thin, wide
   lozenge: a stadium-shaped adhesive flange with a raised pod in the middle.
   So the canvas is 440x260 and the silhouette below is a 412x148 stadium
   (2.8:1, fully radiused ends) with a 216x108 pod centred in it. The ring left
   between the two IS the adhesive flange, which is why it is never drawn as a
   shape of its own — it is the part of the flange the pod does not cover. */
const FL  = { x:14,  y:56, width:412, height:148, rx:74 }  /* adhesive flange, stadium */
const POD = { x:112, y:76, width:216, height:108, rx:44 }  /* the raised body */

export const Shell = (
  <svg viewBox="0 0 440 260" role="img" aria-label="The printed shell, seen face on">
    <defs><pattern id="hatch" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="7" stroke="#0b2b33" strokeOpacity=".14" strokeWidth="1"/></pattern></defs>
    <rect {...FL} fill="#ffffff" fillOpacity=".93" stroke="#0b2b33" strokeWidth="1.6"/>
    {/* The hatch covers the whole stadium and is then masked by the opaque pod,
        so it survives only in the flange ring. That is cheaper and steadier
        than an even-odd ring path, and it means the adhesive zone can never
        drift out of register with the body sitting on it. */}
    <rect {...FL} fill="url(#hatch)"/>
    <rect x="25" y="67" width="390" height="126" rx="63" fill="none" stroke="#0b2b33" strokeOpacity=".3" strokeWidth="1"/>
    <rect {...POD} fill="#ffffff" stroke="#0b2b33" strokeWidth="1.5"/>
    <rect x="124" y="88" width="192" height="84" rx="36" fill="none" stroke="#0b2b33" strokeOpacity=".28" strokeWidth="1"/>
    {/* The charging slot straddles the pod wall rather than sitting inside it,
        because a port that does not break the outline is a sticker, not a port. */}
    <rect x="310" y="116" width="30" height="28" rx="9" fill="url(#hatch)" stroke="#0b2b33" strokeOpacity=".45" strokeWidth="1"/>
    <circle cx="220" cy="130" r="30" fill="none" stroke="#0b2b33" strokeOpacity=".3" strokeWidth="1"/>
    <circle cx="220" cy="130" r="7" fill="#0a6e68"/>
    <path d="M14 130H0M426 130h14" stroke="#0b2b33" strokeOpacity=".3" strokeWidth="1"/>
  </svg>)

export const Board = (
  <svg viewBox="0 0 440 260" role="img" aria-label="The XIAO nRF52840 Sense board">
    <defs><pattern id="keep" width="6" height="6" patternUnits="userSpaceOnUse">
      <line x1="0" y1="6" x2="6" y2="0" stroke="#0a6e68" strokeOpacity=".35" strokeWidth="1"/></pattern></defs>
    {/* The middle layer used to be a bare rectangle floating at a different
        width from the other two, so mid-explode it looked like a stray part.
        This dashed ghost is the flange the tray lands inside — it carries no
        information beyond registration, which is why it is a construction line. */}
    <rect {...FL} fill="none" stroke="#0b2b33" strokeOpacity=".3" strokeWidth="1" strokeDasharray="6 6"/>
    <rect x="116" y="80" width="208" height="100" rx="16" fill="#dfecee" stroke="#0b2b33" strokeWidth="1.6"/>
    <rect x="132" y="92" width="176" height="76" rx="6" fill="#ffffff" stroke="#0b2b33" strokeWidth="1.3"/>
    <rect x="132" y="92" width="176" height="20" fill="url(#keep)"/>
    <rect x="132" y="92" width="176" height="20" fill="none" stroke="#0a6e68" strokeOpacity=".5" strokeWidth="1" strokeDasharray="4 3"/>
    <rect x="196" y="84" width="48" height="12" rx="3" fill="#ffffff" stroke="#0b2b33" strokeWidth="1.2"/>
    <text x="220" y="136" textAnchor="middle" style={T} fontSize="18" fill="#0b2b33">nRF52840</text>
    <text x="220" y="154" textAnchor="middle" style={T} fontSize="13" fill="#1f5560">IMU · PDM MIC</text>
    <g fill="#0a6e68">{[120,132,144,156].flatMap(y=>[
      <rect key={'l'+y} x="138" y={y} width="14" height="6" rx="1.5"/>,
      <rect key={'r'+y} x="294" y={y} width="14" height="6" rx="1.5"/>])}</g>
    <g fill="#0b2b33" fillOpacity=".55">{[176,196,216,236,256].map(x=>
      <rect key={x} x={x} y="173" width="12" height="6" rx="1"/>)}</g>
  </svg>)

export const Face = (
  <svg viewBox="0 0 440 260" role="img" aria-label="The sensor face that sits against the skin">
    <rect {...FL} fill="#ffffff" fillOpacity=".85" stroke="#0b2b33" strokeOpacity=".55" strokeWidth="1.4"/>
    {/* No inset trim line on this layer, unlike the shell. It was drawn here
        too, for symmetry, and at this size it ran horizontally straight
        through "EDA" and "TEMP" — a decorative rule cancelling four labels.
        The pod outline already separates flange from body, so the trim had
        nothing left to say. */}
    <rect {...POD} fill="none" stroke="#0b2b33" strokeOpacity=".35" strokeWidth="1.2"/>
    {/* The two EDA electrodes moved out onto the wings, outside the pod
        outline. They were inboard on the old square drawing, which put both
        skin contacts under the thickest part of the enclosure — the wide
        silhouette is what makes the real placement drawable. */}
    {[66,374].map(cx=>(<g key={cx}>
      <circle cx={cx} cy="124" r="34" fill="#dfecee" stroke="#0b2b33" strokeWidth="1.5"/>
      <circle cx={cx} cy="124" r="22" fill="none" stroke="#0b2b33" strokeOpacity=".35" strokeWidth="1"/>
      <path d={`M${cx} 158v13`} stroke="#0b2b33" strokeOpacity=".3" strokeWidth="1"/>
      <text x={cx} y="185" textAnchor="middle" style={T} fontSize="15" fill="#1f5560">EDA</text></g>))}
    <rect x="186" y="102" width="68" height="52" rx="14" fill="#0b2b33"/>
    <circle cx="204" cy="120" r="6" fill="#0a6e68"/><circle cx="236" cy="120" r="6" fill="#0a6e68"/>
    <rect x="206" y="134" width="28" height="12" rx="3" fill="#ffffff" fillOpacity=".85"/>
    <rect x="206" y="162" width="28" height="12" rx="3" fill="#dfecee" stroke="#0b2b33" strokeWidth="1.2"/>
    <path d="M220 174v10" stroke="#0b2b33" strokeOpacity=".3" strokeWidth="1"/>
    <text x="220" y="94" textAnchor="middle" style={T} fontSize="15" fill="#1f5560">PPG</text>
    <text x="220" y="199" textAnchor="middle" style={T} fontSize="15" fill="#1f5560">TEMP</text>
  </svg>)

/* `title`/`body` describe the physical stack and label the drawing. `cad`
   names what the model actually isolates, which is not the same thing: the CAD
   is three printed parts, and the board is not one of them. Calling part two
   "XIAO nRF52840 Sense" put a chip's name on a plastic tray. */
export const LAYERS = [
  { i:0, part:'pod', art:Shell, title:'Printed shell',
    body:'Charging slot in the side.' },
  { i:1, part:'pcb', art:Board, title:'Electronics pod',
    body:'Takes a XIAO nRF52840 Sense board, bought not designed.' },
  { i:2, part:'base', art:Face,  title:'Skin-side base',
    body:'Sensor window and adhesive. Three signals read through it.' },
]

/* The exploded drawing, lifted out of PatchPage so the homepage hero can use
   the same one. It was inline markup in a single view; the hero needed it and
   copying forty lines of transform classes into a second file is how two
   drawings drift apart.

   IT NOW OWNS ITS OWN SCROLL MOTION. It used to be a static stack of three
   registered sheets that expected whichever page hosted it to push them apart
   and tip them — PatchPage did it with a GSAP ScrollTrigger reaching in
   through `#stack` and `.lyr`, and the guided tour did it by writing inline
   transforms onto the same class on mount. That is one figure animated by two
   unrelated mechanisms living in two other files, neither of which could see
   what the other had set, and it is why the drawing's own code carried a
   fixed counter-tilt to cancel an angle a different file had chosen. All of
   it is replaced by one ScrollScene here, which is framer's useScroll and the
   same spring the rest of the site's scroll motion uses, so the figure is
   correct wherever it is mounted and nothing has to be set up around it.

   What the reader gets out of the change: the stack used to tip through 16
   degrees with the three sheets held at a fixed depth, which read as a plate
   sliding. It now tips through 32 and rotates through 30 while the three
   sheets travel different distances in depth, so it opens and closes as it
   passes — the separation reads as depth because the sheets are genuinely
   moving apart, not as a slide because they are no longer moving together.

   `size` exists because one width served two very different boxes: at
   `w-[min(84%,400px)]` the drawing sat correctly beside the CAD viewer but
   floated inside the much larger hero column with a ring of dead space around
   it, which is what read as "shrunken". The default is the hardware page's
   old value, so only the hero has to say anything, and what it should say is
   `size="w-[min(96%,470px)]"` — measured, not guessed: at the hero's 604x460
   column that is the largest width whose projected ink still clears the
   figcaption at the steepest point of the scrub. Naming it here also keeps
   Tailwind generating the class even before the hero passes it. */

/* Depth per sheet, as [at progress 0, at progress 1], in px along the stack's
   own normal. The midpoints are 122 / 17 / -88, which is within a few pixels
   of the 128 / 20 / -88 this figure was tuned at as a static drawing: the
   composition a reader sees at the middle of the pass is the one that was
   measured, and the two ends open and close either side of it. The three
   travel 125, 10 and 84 — deliberately unequal, because three sheets moving
   the same distance is a plate coming apart in one piece. */
const SHEET_Z = { 0: [60, 185], 1: [12, 22], 2: [-46, -130] }

/* One sheet. A component rather than inline markup because it calls a hook:
   it reads the same sprung progress the scene is rotating on, so the depth and
   the tip cannot disagree by a frame.

   x and y are framer's, not Tailwind's `-translate-x-1/2`: framer writes the
   whole `transform` property, so a translate declared in a class would be
   overwritten wholesale and the sheet would register off its own centre. */
function Sheet({ layer, size, progress, narrow }) {
  const [a, b] = SHEET_Z[layer.i] || [0, 0]
  /* Shrunk toward the midpoint below sm, like the scene's rotation: less
     travel, same composition. */
  const k = narrow ? 0.5 : 1
  const m = (a + b) / 2
  const z = useTransform(progress, [0, 1], [m + (a - m) * k, m + (b - m) * k])
  return (
    <motion.figure data-i={layer.i} style={{ x: '-50%', y: '-50%', z }}
      /* `aspect-square` went with the square viewBox: on a 440x260 drawing it
         padded every layer with 40% empty height and pushed the artwork off
         the centre this translate assumes. Height now comes from the SVG,
         which is identical for all three, so registration is free. */
      className={`lyr absolute left-1/2 top-1/2 m-0 ${size}
        [transform-style:preserve-3d]
        [&_svg]:h-auto [&_svg]:w-full [&_svg]:overflow-visible
        [&_svg]:drop-shadow-[0_26px_34px_rgba(23,31,60,0.16)]`}>
      {layer.art}
    </motion.figure>
  )
}

export function ExplodedStack({
  className,
  caption = 'Drawing · engineering labels',
  shift = '0%, 0%',
  /* 84% overran the left edge by 4px at 390 once the sheets tip: the
     rotation widens the painted box past the element box. 76% below sm
     keeps every sheet inside the column; the desktop figure is unchanged. */
  size = 'w-[min(76%,400px)] sm:w-[min(84%,400px)]',
}) {
  return (
    /* The clip stays on this element and stays horizontal-only. Horizontal is
       the axis a scrollbar can come from and this is what guarantees the
       figure cannot raise one at any width; vertical is deliberately left
       open, because the sheets' drop shadows and their tipped corners paint
       above and below this box by design and clipping them would shear the
       drawing. */
    <div className={'relative overflow-x-clip ' + (className || '')}>
      {/* The stack tips away from its own centre, so at hero size it drifts up
          and right and leaves a hole under it. `shift` recentres the optical
          mass rather than the bounding box. It sits on a wrapper outside the
          scene so it is not competing for the same `transform`. */}
      {/* overflow-clip, and it is load-bearing. The three sheets tip through
          32 degrees inside a 1500px perspective, which throws the near corner
          of the top sheet well outside this box, and the automated check at
          1280 caught exactly that: two elements past the viewport edge on the
          patch page. The scene's own clip is off because a clip on the
          rotating element shears its tipped corners; the clip belongs one
          level out, on the box that does not move. */}
      <div className="absolute inset-0 overflow-clip"
        style={{ transform: `translate(${shift})` }}>
        {/* The angles are stated as the net result now. They used to be split
            across a fixed rotateX(-20deg) counter-tilt here and a 66-to-50
            scrub written in PatchPage, which existed only because GSAP
            overwrote `#stack`'s transform wholesale and the correction had
            nowhere else to live. One mechanism, one set of numbers: 52 degrees
            of tip easing to 20, which keeps the three faces readable the whole
            way through — the pair that read as three slivers was 70 to 50.
            clip={false} because this figure's own clip is the element above. */}
        <ScrollScene clip={false} perspective={1500} restAt={0.5} narrow={0.4}
          className="h-full w-full"
          from={{ rotateX: 52, rotateZ: -44 }} to={{ rotateX: 20, rotateZ: -14 }}>
          {({ progress, narrow }) => (
            <div className="absolute inset-0 [transform-style:preserve-3d]">
              {[...LAYERS].reverse().map(l => (
                <Sheet key={l.i} layer={l} size={size} progress={progress} narrow={narrow}/>
              ))}
            </div>
          )}
        </ScrollScene>
      </div>
      {caption && <span className="note absolute inset-x-0 bottom-0 text-center">{caption}</span>}
    </div>
  )
}
