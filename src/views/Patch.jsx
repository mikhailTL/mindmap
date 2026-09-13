import React from 'react'
const T = { fontFamily:'ui-monospace,monospace' }

export const Shell = (
  <svg viewBox="0 0 400 400" role="img" aria-label="The printed shell, seen face on">
    <defs><pattern id="hatch" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="7" stroke="#171f3c" strokeOpacity=".14" strokeWidth="1"/></pattern></defs>
    <rect x="46" y="86" width="308" height="228" rx="66" fill="#f8f6fc" fillOpacity=".93" stroke="#171f3c" strokeWidth="1.6"/>
    <rect x="62" y="102" width="276" height="196" rx="52" fill="none" stroke="#171f3c" strokeOpacity=".28" strokeWidth="1"/>
    <rect x="150" y="140" width="100" height="26" rx="13" fill="url(#hatch)" stroke="#171f3c" strokeOpacity=".4" strokeWidth="1"/>
    <circle cx="200" cy="228" r="34" fill="none" stroke="#171f3c" strokeOpacity=".3" strokeWidth="1"/>
    <circle cx="200" cy="228" r="7" fill="#3d52a0"/>
    <path d="M46 200h-26M354 200h26" stroke="#171f3c" strokeOpacity=".3" strokeWidth="1"/>
  </svg>)

export const Board = (
  <svg viewBox="0 0 400 400" role="img" aria-label="The XIAO nRF52840 Sense board">
    <defs><pattern id="keep" width="6" height="6" patternUnits="userSpaceOnUse">
      <line x1="0" y1="6" x2="6" y2="0" stroke="#3d52a0" strokeOpacity=".35" strokeWidth="1"/></pattern></defs>
    <rect x="92" y="128" width="216" height="144" rx="10" fill="#dce2f1" stroke="#171f3c" strokeWidth="1.6"/>
    <rect x="150" y="118" width="52" height="14" rx="4" fill="#f8f6fc" stroke="#171f3c" strokeWidth="1.2"/>
    <rect x="112" y="132" width="176" height="34" fill="url(#keep)"/>
    <rect x="112" y="132" width="176" height="34" fill="none" stroke="#3d52a0" strokeOpacity=".5" strokeWidth="1" strokeDasharray="4 3"/>
    <rect x="146" y="182" width="108" height="62" rx="4" fill="#f8f6fc" stroke="#171f3c" strokeWidth="1.3"/>
    <text x="200" y="209" textAnchor="middle" style={T} fontSize="18" fill="#171f3c">nRF52840</text>
    <text x="200" y="231" textAnchor="middle" style={T} fontSize="16" fill="#30417e">IMU · PDM MIC</text>
    <g fill="#3d52a0">{[186,200,214,228].flatMap(y=>[
      <rect key={'l'+y} x="104" y={y} width="16" height="7" rx="1.5"/>,
      <rect key={'r'+y} x="280" y={y} width="16" height="7" rx="1.5"/>])}</g>
    <g fill="#171f3c" fillOpacity=".55">{[150,172,194,216,238].map(x=>
      <rect key={x} x={x} y="254" width="13" height="7" rx="1"/>)}</g>
  </svg>)

export const Face = (
  <svg viewBox="0 0 400 400" role="img" aria-label="The sensor face that sits against the skin">
    <rect x="46" y="86" width="308" height="228" rx="66" fill="#f8f6fc" fillOpacity=".85" stroke="#171f3c" strokeOpacity=".55" strokeWidth="1.4"/>
    {[116,284].map(cx=>(<g key={cx}>
      <circle cx={cx} cy="200" r="40" fill="#dce2f1" stroke="#171f3c" strokeWidth="1.5"/>
      <circle cx={cx} cy="200" r="27" fill="none" stroke="#171f3c" strokeOpacity=".35" strokeWidth="1"/>
      <text x={cx} y="278" textAnchor="middle" style={T} fontSize="16" fill="#30417e">EDA</text></g>))}
    <rect x="172" y="172" width="56" height="56" rx="14" fill="#171f3c"/>
    <circle cx="188" cy="192" r="6" fill="#3d52a0"/><circle cx="212" cy="192" r="6" fill="#3d52a0"/>
    <rect x="188" y="206" width="24" height="12" rx="3" fill="#f8f6fc" fillOpacity=".85"/>
    <rect x="186" y="252" width="28" height="12" rx="3" fill="#dce2f1" stroke="#171f3c" strokeWidth="1.2"/>
    <path d="M116 240v22M284 240v22M200 236v10" stroke="#171f3c" strokeOpacity=".3" strokeWidth="1"/>
    <text x="200" y="162" textAnchor="middle" style={T} fontSize="16" fill="#30417e">PPG</text>
    <text x="200" y="283" textAnchor="middle" style={T} fontSize="16" fill="#30417e">TEMP</text>
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
   is mounted at a time under hash routing. */
export function ExplodedStack({ className, caption = 'Drawing · engineering labels', shift = '0%, 0%' }) {
  return (
    <div className={'relative overflow-x-clip [perspective:1500px] ' + (className || '')}>
      <div id="stack" className="absolute inset-0 [transform-style:preserve-3d]"
        /* The stack tips away from its own centre, so at hero size it drifts
           up and right and leaves a hole under it. `shift` recentres the
           optical mass rather than the bounding box. */
        style={{ transform: `translate(${shift}) rotateX(58deg) rotateZ(-32deg)` }}>
        {[...LAYERS].reverse().map(l => (
          <figure key={l.i} data-i={l.i}
            className="lyr absolute left-1/2 top-1/2 m-0 aspect-square w-[min(84%,400px)]
              -translate-x-1/2 -translate-y-1/2 [transform-style:preserve-3d]
              [&_svg]:h-auto [&_svg]:w-full [&_svg]:overflow-visible
              [&_svg]:drop-shadow-[0_26px_34px_rgba(23,31,60,0.16)]">
            {l.art}
          </figure>
        ))}
      </div>
      {caption && <span className="note absolute inset-x-0 bottom-0 text-center">{caption}</span>}
    </div>
  )
}
