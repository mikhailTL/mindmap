import React from 'react'
const T = { fontFamily:'ui-monospace,monospace' }

export const Shell = (
  <svg viewBox="0 0 400 400" role="img" aria-label="The printed shell, seen face on">
    <defs><pattern id="hatch" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="7" stroke="#0d2b27" strokeOpacity=".14" strokeWidth="1"/></pattern></defs>
    <rect x="46" y="86" width="308" height="228" rx="66" fill="#fcfcfb" fillOpacity=".93" stroke="#0d2b27" strokeWidth="1.6"/>
    <rect x="62" y="102" width="276" height="196" rx="52" fill="none" stroke="#0d2b27" strokeOpacity=".28" strokeWidth="1"/>
    <rect x="150" y="140" width="100" height="26" rx="13" fill="url(#hatch)" stroke="#0d2b27" strokeOpacity=".4" strokeWidth="1"/>
    <circle cx="200" cy="228" r="34" fill="none" stroke="#0d2b27" strokeOpacity=".3" strokeWidth="1"/>
    <circle cx="200" cy="228" r="7" fill="#0f6b62"/>
    <path d="M46 200h-26M354 200h26" stroke="#0d2b27" strokeOpacity=".3" strokeWidth="1"/>
  </svg>)

export const Board = (
  <svg viewBox="0 0 400 400" role="img" aria-label="The XIAO nRF52840 Sense board">
    <defs><pattern id="keep" width="6" height="6" patternUnits="userSpaceOnUse">
      <line x1="0" y1="6" x2="6" y2="0" stroke="#0f6b62" strokeOpacity=".35" strokeWidth="1"/></pattern></defs>
    <rect x="92" y="128" width="216" height="144" rx="10" fill="#e7efeb" stroke="#0d2b27" strokeWidth="1.6"/>
    <rect x="150" y="118" width="52" height="14" rx="4" fill="#fcfcfb" stroke="#0d2b27" strokeWidth="1.2"/>
    <rect x="112" y="132" width="176" height="34" fill="url(#keep)"/>
    <rect x="112" y="132" width="176" height="34" fill="none" stroke="#0f6b62" strokeOpacity=".5" strokeWidth="1" strokeDasharray="4 3"/>
    <rect x="146" y="182" width="108" height="62" rx="4" fill="#fcfcfb" stroke="#0d2b27" strokeWidth="1.3"/>
    <text x="200" y="209" textAnchor="middle" style={T} fontSize="18" fill="#0d2b27">nRF52840</text>
    <text x="200" y="231" textAnchor="middle" style={T} fontSize="16" fill="#3f5754">IMU · PDM MIC</text>
    <g fill="#0f6b62">{[186,200,214,228].flatMap(y=>[
      <rect key={'l'+y} x="104" y={y} width="16" height="7" rx="1.5"/>,
      <rect key={'r'+y} x="280" y={y} width="16" height="7" rx="1.5"/>])}</g>
    <g fill="#0d2b27" fillOpacity=".55">{[150,172,194,216,238].map(x=>
      <rect key={x} x={x} y="254" width="13" height="7" rx="1"/>)}</g>
  </svg>)

export const Face = (
  <svg viewBox="0 0 400 400" role="img" aria-label="The sensor face that sits against the skin">
    <rect x="46" y="86" width="308" height="228" rx="66" fill="#fcfcfb" fillOpacity=".85" stroke="#0d2b27" strokeOpacity=".55" strokeWidth="1.4"/>
    {[116,284].map(cx=>(<g key={cx}>
      <circle cx={cx} cy="200" r="40" fill="#e7efeb" stroke="#0d2b27" strokeWidth="1.5"/>
      <circle cx={cx} cy="200" r="27" fill="none" stroke="#0d2b27" strokeOpacity=".35" strokeWidth="1"/>
      <text x={cx} y="278" textAnchor="middle" style={T} fontSize="16" fill="#3f5754">EDA</text></g>))}
    <rect x="172" y="172" width="56" height="56" rx="14" fill="#0d2b27"/>
    <circle cx="188" cy="192" r="6" fill="#0f6b62"/><circle cx="212" cy="192" r="6" fill="#0f6b62"/>
    <rect x="188" y="206" width="24" height="12" rx="3" fill="#fcfcfb" fillOpacity=".85"/>
    <rect x="186" y="252" width="28" height="12" rx="3" fill="#e7efeb" stroke="#0d2b27" strokeWidth="1.2"/>
    <path d="M116 240v22M284 240v22M200 236v10" stroke="#0d2b27" strokeOpacity=".3" strokeWidth="1"/>
    <text x="200" y="162" textAnchor="middle" style={T} fontSize="16" fill="#3f5754">PPG</text>
    <text x="200" y="283" textAnchor="middle" style={T} fontSize="16" fill="#3f5754">TEMP</text>
  </svg>)

/* `title`/`body` describe the physical stack and label the drawing. `cad`
   names what the model actually isolates, which is not the same thing: the CAD
   is three printed parts, and the board is not one of them. Calling part two
   "XIAO nRF52840 Sense" put a chip's name on a plastic tray. */
export const LAYERS = [
  { i:0, part:'pod', art:Shell, title:'Printed shell',
    body:'The outer cover, 3D-printed. The slot in the side is the charging port.',
    cad:'In the model: the cover on its own.' },
  { i:1, part:'pcb', art:Board, title:'Electronics pod',
    body:'The tray a XIAO nRF52840 Sense board drops into. Four posts locate the board, which carries the motion sensor, the microphone and the Bluetooth radio.',
    cad:'In the model: the tray and its posts. The board itself is a separate part and is not printed.' },
  { i:2, part:'base', art:Face,  title:'Skin-side base',
    body:'The ring that holds the sensor window and the adhesive. Pulse, sweat and temperature are read through it.',
    cad:'In the model: the base ring on its own.' },
]
