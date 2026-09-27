import React from 'react'
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
      <line x1="0" y1="0" x2="0" y2="7" stroke="#0d2b1e" strokeOpacity=".14" strokeWidth="1"/></pattern></defs>
    <rect {...FL} fill="#ffffff" fillOpacity=".93" stroke="#0d2b1e" strokeWidth="1.6"/>
    {/* The hatch covers the whole stadium and is then masked by the opaque pod,
        so it survives only in the flange ring. That is cheaper and steadier
        than an even-odd ring path, and it means the adhesive zone can never
        drift out of register with the body sitting on it. */}
    <rect {...FL} fill="url(#hatch)"/>
    <rect x="25" y="67" width="390" height="126" rx="63" fill="none" stroke="#0d2b1e" strokeOpacity=".3" strokeWidth="1"/>
    <rect {...POD} fill="#ffffff" stroke="#0d2b1e" strokeWidth="1.5"/>
    <rect x="124" y="88" width="192" height="84" rx="36" fill="none" stroke="#0d2b1e" strokeOpacity=".28" strokeWidth="1"/>
    {/* The charging slot straddles the pod wall rather than sitting inside it,
        because a port that does not break the outline is a sticker, not a port. */}
    <rect x="310" y="116" width="30" height="28" rx="9" fill="url(#hatch)" stroke="#0d2b1e" strokeOpacity=".45" strokeWidth="1"/>
    <circle cx="220" cy="130" r="30" fill="none" stroke="#0d2b1e" strokeOpacity=".3" strokeWidth="1"/>
    <circle cx="220" cy="130" r="7" fill="#157446"/>
    <path d="M14 130H0M426 130h14" stroke="#0d2b1e" strokeOpacity=".3" strokeWidth="1"/>
  </svg>)

export const Board = (
  <svg viewBox="0 0 440 260" role="img" aria-label="The XIAO nRF52840 Sense board">
    <defs><pattern id="keep" width="6" height="6" patternUnits="userSpaceOnUse">
      <line x1="0" y1="6" x2="6" y2="0" stroke="#157446" strokeOpacity=".35" strokeWidth="1"/></pattern></defs>
    {/* The middle layer used to be a bare rectangle floating at a different
        width from the other two, so mid-explode it looked like a stray part.
        This dashed ghost is the flange the tray lands inside — it carries no
        information beyond registration, which is why it is a construction line. */}
    <rect {...FL} fill="none" stroke="#0d2b1e" strokeOpacity=".3" strokeWidth="1" strokeDasharray="6 6"/>
    <rect x="116" y="80" width="208" height="100" rx="16" fill="#e3ede7" stroke="#0d2b1e" strokeWidth="1.6"/>
    <rect x="132" y="92" width="176" height="76" rx="6" fill="#ffffff" stroke="#0d2b1e" strokeWidth="1.3"/>
    <rect x="132" y="92" width="176" height="20" fill="url(#keep)"/>
    <rect x="132" y="92" width="176" height="20" fill="none" stroke="#157446" strokeOpacity=".5" strokeWidth="1" strokeDasharray="4 3"/>
    <rect x="196" y="84" width="48" height="12" rx="3" fill="#ffffff" stroke="#0d2b1e" strokeWidth="1.2"/>
    <text x="220" y="136" textAnchor="middle" style={T} fontSize="18" fill="#0d2b1e">nRF52840</text>
    <text x="220" y="154" textAnchor="middle" style={T} fontSize="13" fill="#2a5744">IMU · PDM MIC</text>
    <g fill="#157446">{[120,132,144,156].flatMap(y=>[
      <rect key={'l'+y} x="138" y={y} width="14" height="6" rx="1.5"/>,
      <rect key={'r'+y} x="294" y={y} width="14" height="6" rx="1.5"/>])}</g>
    <g fill="#0d2b1e" fillOpacity=".55">{[176,196,216,236,256].map(x=>
      <rect key={x} x={x} y="173" width="12" height="6" rx="1"/>)}</g>
  </svg>)

export const Face = (
  <svg viewBox="0 0 440 260" role="img" aria-label="The sensor face that sits against the skin">
    <rect {...FL} fill="#ffffff" fillOpacity=".85" stroke="#0d2b1e" strokeOpacity=".55" strokeWidth="1.4"/>
    {/* No inset trim line on this layer, unlike the shell. It was drawn here
        too, for symmetry, and at this size it ran horizontally straight
        through "EDA" and "TEMP" — a decorative rule cancelling four labels.
        The pod outline already separates flange from body, so the trim had
        nothing left to say. */}
    <rect {...POD} fill="none" stroke="#0d2b1e" strokeOpacity=".35" strokeWidth="1.2"/>
    {/* The two EDA electrodes moved out onto the wings, outside the pod
        outline. They were inboard on the old square drawing, which put both
        skin contacts under the thickest part of the enclosure — the wide
        silhouette is what makes the real placement drawable. */}
    {[66,374].map(cx=>(<g key={cx}>
      <circle cx={cx} cy="124" r="34" fill="#e3ede7" stroke="#0d2b1e" strokeWidth="1.5"/>
      <circle cx={cx} cy="124" r="22" fill="none" stroke="#0d2b1e" strokeOpacity=".35" strokeWidth="1"/>
      <path d={`M${cx} 158v13`} stroke="#0d2b1e" strokeOpacity=".3" strokeWidth="1"/>
      <text x={cx} y="185" textAnchor="middle" style={T} fontSize="15" fill="#2a5744">EDA</text></g>))}
    <rect x="186" y="102" width="68" height="52" rx="14" fill="#0d2b1e"/>
    <circle cx="204" cy="120" r="6" fill="#157446"/><circle cx="236" cy="120" r="6" fill="#157446"/>
    <rect x="206" y="134" width="28" height="12" rx="3" fill="#ffffff" fillOpacity=".85"/>
    <rect x="206" y="162" width="28" height="12" rx="3" fill="#e3ede7" stroke="#0d2b1e" strokeWidth="1.2"/>
    <path d="M220 174v10" stroke="#0d2b1e" strokeOpacity=".3" strokeWidth="1"/>
    <text x="220" y="94" textAnchor="middle" style={T} fontSize="15" fill="#2a5744">PPG</text>
    <text x="220" y="199" textAnchor="middle" style={T} fontSize="15" fill="#2a5744">TEMP</text>
  </svg>)

/* `title`/`body` describe the physical stack and label the drawing. `cad`
   names what the model actually isolates, which is not the same thing: the CAD
   is three printed parts, and the board is not one of them. Calling part two
   "XIAO nRF52840 Sense" put a chip's name on a plastic tray. */
export const LAYERS = [
  { i:0, part:'pod', art:Shell, title:'Printed shell',
    body:'The outer cover. The slot in the side is the charging port.' },
  { i:1, part:'pcb', art:Board, title:'Electronics pod',
    body:'The tray a XIAO nRF52840 Sense board drops into. The board is bought separately.' },
  { i:2, part:'base', art:Face,  title:'Skin-side base',
    body:'Holds the sensor window and the adhesive. Pulse, sweat and temperature read through it.' },
]

/* The exploded drawing, lifted out of PatchPage so the homepage hero can use
   the same one. It was inline markup in a single view; the hero needed it and
   copying forty lines of transform classes into a second file is how two
   drawings drift apart. The id stays `stack` because both the hero and the
   hardware page drive it with the same ScrollTrigger, and only one of the two
   is mounted at a time under hash routing.

   `size` exists because one width served two very different boxes: at
   `w-[min(84%,400px)]` the drawing sat correctly beside the CAD viewer but
   floated inside the much larger hero column with a ring of dead space around
   it, which is what read as "shrunken". The default is the hardware page's
   old value, so only the hero has to say anything, and what it should say is
   `size="w-[min(96%,470px)]"` — measured, not guessed: at the hero's 604x460
   column that is the largest width whose projected ink still clears the
   figcaption at the steepest point of the scrub. Naming it here also keeps
   Tailwind generating the class even before the hero passes it. */
export function ExplodedStack({
  className,
  caption = 'Drawing · engineering labels',
  shift = '0%, 0%',
  size = 'w-[min(84%,400px)]',
}) {
  return (
    <div className={'relative overflow-x-clip [perspective:1500px] ' + (className || '')}>
      {/* A fixed counter-tilt wrapped around `#stack`, not folded into it.
          The stack sat at rotateX 58deg statically and Overview/PatchPage
          scrub it between 70deg and 50deg, which foreshortened every face to
          about a third of its height — three slivers, no readable patch. The
          corrective rotation cannot go on `#stack` itself because GSAP
          overwrites that transform wholesale, and it has to sit OUTSIDE the
          stack's own rotateZ so the two rotateX terms stay adjacent in the
          matrix and simply subtract. Net result: 50deg at first paint easing
          to 30deg across the scrub — faces readable throughout, and the layers
          still separate in depth exactly as before. */}
      <div className="absolute inset-0 [transform-style:preserve-3d] [transform:rotateX(-20deg)]">
        <div id="stack" className="absolute inset-0 [transform-style:preserve-3d]"
          /* The stack tips away from its own centre, so at hero size it drifts
             up and right and leaves a hole under it. `shift` recentres the
             optical mass rather than the bounding box. */
          style={{ transform: `translate(${shift}) rotateX(50deg) rotateZ(-26deg)` }}>
          {[...LAYERS].reverse().map(l => (
            <figure key={l.i} data-i={l.i}
              /* `aspect-square` went with the square viewBox: on a 440x260
                 drawing it padded every layer with 40% empty height and pushed
                 the artwork off the centre the -translate-y-1/2 assumes.
                 Height now comes from the SVG, which is identical for all
                 three, so registration is free. */
              className={`lyr absolute left-1/2 top-1/2 m-0 ${size}
                -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d]
                [&_svg]:h-auto [&_svg]:w-full [&_svg]:overflow-visible
                [&_svg]:drop-shadow-[0_26px_34px_rgba(23,31,60,0.16)]`}>
              {l.art}
            </figure>
          ))}
        </div>
      </div>
      {caption && <span className="note absolute inset-x-0 bottom-0 text-center">{caption}</span>}
    </div>
  )
}
