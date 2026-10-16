import React from 'react'
import { motion, useTransform } from 'framer-motion'
import { ScrollScene } from '../ui/motion'
const T = { fontFamily:'ui-monospace,monospace' }

/* Shell, Board and Face share the 440x260 viewBox and the FL/POD coordinates,
   so the exploded layers register without per-layer nudging; keep all three the
   same size or ExplodedStack's centring breaks. The adhesive flange is the ring
   FL leaves outside POD — never a shape of its own. */
const FL  = { x:14,  y:56, width:412, height:148, rx:74 }  /* adhesive flange, stadium */
const POD = { x:112, y:76, width:216, height:108, rx:44 }  /* the raised body */

export const Shell = (
  <svg viewBox="0 0 440 260" role="img" aria-label="The printed shell, seen face on">
    <defs><pattern id="hatch" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="7" stroke="#0d2b1e" strokeOpacity=".14" strokeWidth="1"/></pattern></defs>
    <rect {...FL} fill="#ffffff" fillOpacity=".93" stroke="#0d2b1e" strokeWidth="1.6"/>
    {/* Hatch covers the whole stadium and is masked by the opaque pod, leaving
        it in the flange ring only — the pod rect must come after. */}
    <rect {...FL} fill="url(#hatch)"/>
    <rect x="25" y="67" width="390" height="126" rx="63" fill="none" stroke="#0d2b1e" strokeOpacity=".3" strokeWidth="1"/>
    <rect {...POD} fill="#ffffff" stroke="#0d2b1e" strokeWidth="1.5"/>
    <rect x="124" y="88" width="192" height="84" rx="36" fill="none" stroke="#0d2b1e" strokeOpacity=".28" strokeWidth="1"/>
    <rect x="310" y="116" width="30" height="28" rx="9" fill="url(#hatch)" stroke="#0d2b1e" strokeOpacity=".45" strokeWidth="1"/>
    <circle cx="220" cy="130" r="30" fill="none" stroke="#0d2b1e" strokeOpacity=".3" strokeWidth="1"/>
    <circle cx="220" cy="130" r="7" fill="#157446"/>
    <path d="M14 130H0M426 130h14" stroke="#0d2b1e" strokeOpacity=".3" strokeWidth="1"/>
  </svg>)

export const Board = (
  <svg viewBox="0 0 440 260" role="img" aria-label="The XIAO nRF52840 Sense board">
    <defs><pattern id="keep" width="6" height="6" patternUnits="userSpaceOnUse">
      <line x1="0" y1="6" x2="6" y2="0" stroke="#157446" strokeOpacity=".35" strokeWidth="1"/></pattern></defs>
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
    {/* No inset trim line here, unlike Shell: it runs through the EDA and TEMP
        labels at this size. */}
    <rect {...POD} fill="none" stroke="#0d2b1e" strokeOpacity=".35" strokeWidth="1.2"/>
    {/* EDA electrodes belong on the wings, outside the pod outline: that is the
        real skin-contact placement. */}
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

/* `part` is the CAD part id — three printed parts. The XIAO board is bought,
   not modelled, so 'pcb' is the tray, not the chip. */
export const LAYERS = [
  { i:0, part:'pod', art:Shell, title:'Printed shell',
    body:'The shell has a charging slot in the side.' },
  { i:1, part:'pcb', art:Board, title:'Electronics pod',
    body:'The pod holds a XIAO nRF52840 Sense board, which we bought rather than designed.' },
  { i:2, part:'base', art:Face,  title:'Skin-side base',
    body:'The base holds the sensor window and the adhesive. The signals read through it.' },
]

/* Owns its own scroll motion via ScrollScene. Do not drive `#stack` or `.lyr`
   from a host page — two mechanisms writing the same `transform` is what the
   old counter-tilt existed to cancel.

   `size` defaults to the hardware page's width; the hero passes
   `w-[min(96%,470px)]`, the largest width whose projected ink still clears the
   figcaption at the steepest point of the scrub in its 604x460 column. The
   literal is named here so Tailwind emits the class before any caller uses it. */

/* Depth per sheet as [progress 0, progress 1], px along the stack's normal.
   Midpoints 122 / 17 / -88 are the tuned static composition. Travel is
   deliberately unequal (125 / 10 / 84) so the stack opens instead of sliding
   as one plate. */
const SHEET_Z = { 0: [60, 185], 1: [12, 22], 2: [-46, -130] }

/* A component, not inline markup, so useTransform reads the same sprung
   progress the scene rotates on; otherwise depth and tip drift a frame apart.
   Centring uses framer's x/y, not `-translate-x-1/2`: framer writes the whole
   `transform`, so a class translate is overwritten and the sheet registers off
   its own centre. */
function Sheet({ layer, size, progress, narrow }) {
  const [a, b] = SHEET_Z[layer.i] || [0, 0]
  const k = narrow ? 0.5 : 1
  const m = (a + b) / 2
  const z = useTransform(progress, [0, 1], [m + (a - m) * k, m + (b - m) * k])
  return (
    <motion.figure data-i={layer.i} style={{ x: '-50%', y: '-50%', z }}
      /* No `aspect-square`: height comes from the SVG, identical for all three
         layers, so they register against this translate. */
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
  caption = 'A drawing with engineering labels',
  shift = '0%, 0%',
  /* 76% below sm: rotation widens the painted box past the element box, and
     84% overran the left edge by 4px at 390. */
  size = 'w-[min(76%,400px)] sm:w-[min(84%,400px)]',
}) {
  return (
    /* Horizontal-only clip: stops the tipped sheets raising a horizontal
       scrollbar at any width. A full clip shears their shadows and corners. */
    <div className={'relative overflow-x-clip ' + (className || '')}>
      {/* `shift` recentres the optical mass; it lives on this wrapper, not the
          scene, so it does not compete for the same `transform`. The
          `overflow-clip` is load-bearing and must stay on this non-moving box:
          at 32deg in a 1500px perspective the top sheet's near corner lands
          outside it and overflows the viewport at 1280. */}
      <div className="absolute inset-0 overflow-clip"
        style={{ transform: `translate(${shift})` }}>
        {/* Net angles, no counter-tilt. 52deg easing to 20 keeps all three
            faces readable through the scrub; past ~70 they read as slivers.
            clip={false} because the clip lives on the wrapper above. */}
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
