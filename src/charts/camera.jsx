import React from 'react'
import { SignalTrace } from './infographics'
import { SENSORS } from '../lib/sensors'
import { cn } from '../lib/utils'

/* The rear camera, exploded: photoplethysmography drawn rather than described.
 * Two constraints that are easy to break by accident:
 * 1. Plates stay face-on at a shallow oblique angle. Rotated to isometric
 *    diamonds they lose the island silhouette, which is the shape the reader
 *    is meant to recognise.
 * 2. Every step sentence is cut to EXACTLY two lines. baseY centres a pair of
 *    baselines on the 62-unit row and ROWH holds four of the six leaders level
 *    with the part they point at, so a one-line row sits high and a three-line
 *    row overflows. Re-cut inside a sentence; never change the line count. */

/* Palette by hand: these are SVG paint attributes and Tailwind tokens do not
   reach them. Values are tailwind.config.js, unchanged. */
const INK = '#0d2b1e', INK2 = '#2a5744', INK3 = '#426a58'
const RULE = '#c2d7ca', RULING = '#93b2a1', MIST = '#e3ede7'
const CARD = '#ffffff', ACCENT = '#157446', WASH = '#dcefe4'
const BEAM = '#1d8fb0', BEAMWASH = '#ddf0f8'
/* Read out of lib/sensors.js rather than typed again. That file is the
   per-signal spectrum the score dial is built from and is the one place in
   the project allowed a colour outside the green system; a copy of the hex
   here would be a second source for it and could drift. */
const BLOOD = SENSORS.heart.glow

/* One oblique projection for the whole drawing: (x, y) in a plate's own plan
   lands at (cx + x - 0.42y, cy + 0.34y). A steeper angle turns the island into
   a sliver and buries the lens cutouts. */
const SHX = -0.42, SY = 0.34
const CX = 530                          // the stack's centre line
const A = 64, RAD = 22, T = 6           // plate half-side, corner radius, thickness

/* Paths are built through the map below, never handed to an SVG matrix
   transform: a matrix squashes stroke width with the geometry: at 0.34
   vertical scale a 1.4 edge prints 0.48 across and 1.4 down. */
const px = (cx, x, y) => cx + x + SHX * y
const py = (cy, y) => cy + SY * y
const P = (cx, cy, x, y) => `${px(cx, x, y).toFixed(1)},${py(cy, y).toFixed(1)}`

/* Rounded square, corners as quadratics: quadratics survive an affine map
   exactly, where an elliptical arc needs its radii and rotation recomputed
   per layer. */
function plateD(cx, cy, a, b, r, ox = 0, oy = 0) {
  const p = (x, y) => P(cx, cy, x + ox, y + oy)
  return `M${p(-a + r, -b)} L${p(a - r, -b)} Q${p(a, -b)} ${p(a, -b + r)}`
    + ` L${p(a, b - r)} Q${p(a, b)} ${p(a - r, b)}`
    + ` L${p(-a + r, b)} Q${p(-a, b)} ${p(-a, b - r)}`
    + ` L${p(-a, -b + r)} Q${p(-a, -b)} ${p(-a + r, -b)} Z`
}

const K = 0.5523
function holeD(cx, cy, ox, oy, r) {
  const p = (x, y) => P(cx, cy, x + ox, y + oy)
  return `M${p(r, 0)} C${p(r, K * r)} ${p(K * r, r)} ${p(0, r)}`
    + ` C${p(-K * r, r)} ${p(-r, K * r)} ${p(-r, 0)}`
    + ` C${p(-r, -K * r)} ${p(-K * r, -r)} ${p(0, -r)}`
    + ` C${p(K * r, -r)} ${p(r, -K * r)} ${p(r, 0)} Z`
}

/* The island's cutouts, in plan, once. Repeated on every layer rather than
   reduced to the one lens the light uses. */
const LENSES = [[-29, -29], [-29, 29], [29, 29]]
const LENS_R = 20
const FLASH_HOLE = [33, -24], FLASH_R = 10
const TINY = [33, -47], TINY_R = 4.5

/* Four plates 56 apart, the closest they can sit and still leave a gap the
   beam's arrowhead fits in. */
const ROW = { glass: 144, lens: 200, ir: 256, sensor: 312 }
const PHONE = 388, ISLAND = 382        // phone body face, island top face
const VB_H = 462                       // the drawing's own height, in its own units

/* The light uses the top-left camera, so the ray is one vertical line: along
   the stack's normal is straight down in this projection. */
const RAYX = px(CX, LENSES[0][0], LENSES[0][1])
const faceY = cy => py(cy, LENSES[0][1])

/* One path: the outline and the clip keeping the vessels inside the skin have
   to be the same path. Every y is 0.74 of the earlier path. */
const FINGER = 'M471.5,0 C467,29.6 468.5,63.6 476,83.6 C482,97 492.5,104.7 512.8,105.5'
  + ' C533,104.7 543.5,97 549.5,83.6 C557,63.6 558.5,29.6 554,0 Z'

const PAD = { x: 513.2, y: 100, r: 16 }        // the skin actually against the glass
const FLASH = { cx: 420, cy: 76, a: 22, r: 9, t: 5 }

/* ── The step table ───────────────────────────────────────────────────────
 * Six rows of one height. `to` is where each leader arrives, always a part's
 * left edge at its own mid height, so the arrow comes in parallel to the edge
 * it names. `elbow` is where the leader turns out of its row; values differ
 * per step only to keep vertical runs off the flash and off each other.
 * TBL_TOP is set so four of the six rows land within a few units of the part
 * they point at, which lets most leaders draw as one straight horizontal.
 * Step 02 is a plain diagonal: its target is tissue, not a plate edge, and a
 * staircase into it arrived at the same height as the cover-glass leader one
 * row below. Step 03 owns two plates, so its leader forks. */
const TBL_X = 8, TBL_W = 344, TBL_TOP = 44, ROWH = 62
const NUM_W = 30                       // the marker's own cell
const TXT_X = TBL_X + NUM_W + 10
const TBL_R = TBL_X + TBL_W            // where every leader leaves from
const LEAD = 21                        // line leading inside a row

export const CAMERA_STEPS = [
  { id: 'flash', elbow: 378,
    lines: ['The flash shines into', 'your fingertip.'],
    to: [[396, 76]] },
  { id: 'blood', diagonal: true,
    lines: ['Blood absorbs it. Each beat', 'changes how much.'],
    to: [[486, 82]] },
  { id: 'optics', elbow: 400,
    lines: ['Light comes back through the', 'glass. The lens focuses it.'],
    to: [[460, ROW.glass], [460, ROW.lens]] },
  { id: 'ir', elbow: 408,
    lines: ['The infrared filter drops', 'invisible light.'],
    to: [[460, ROW.ir]] },
  { id: 'sensor', elbow: 408,
    lines: ['The sensor reads it thirty', 'times a second.'],
    to: [[460, ROW.sensor]] },
  { id: 'pulse', elbow: 420,
    lines: ['That rise and fall', 'is your pulse.'],
    to: [[452, PHONE]] },
]

const rowTop = i => TBL_TOP + i * ROWH
const rowMid = i => rowTop(i) + ROWH / 2
/* Two lines centred on the row, so the marker and the first line share a
   line and the block cannot drift off its leader. */
const baseY = i => rowMid(i) - (LEAD / 2) + 5
/* Out, along, then in: the last segment is horizontal and lands on a plate's
   left edge. */
const leadD = (s, i, [tx, ty]) =>
  s.diagonal ? `M${TBL_R},${rowMid(i)} L${tx},${ty}`
    : Math.abs(ty - rowMid(i)) < 1 ? `M${TBL_R},${rowMid(i)} H${tx}`
      : `M${TBL_R},${rowMid(i)} H${s.elbow} V${ty} H${tx}`

/* Body, then face: the offset copy showing below the face is the layer's
   thickness, and both come from the same call so they cannot lose register. */
function Plate({ cy, face = CARD, side = MIST, a = A, b = A, r = RAD, t = T, children }) {
  return (
    <g>
      <path d={plateD(CX, cy + t, a, b, r)} fill={side} stroke={INK} strokeWidth="1.2"/>
      <path d={plateD(CX, cy, a, b, r)} fill={face} stroke={INK} strokeWidth="1.4"/>
      {children}
    </g>
  )
}

/* `lens` is what changes between layers; the flash and sensor windows are
   plain openings passing through. */
function Cutouts({ cy, lens }) {
  return (
    <g>
      {LENSES.map(([x, y], i) => <g key={i}>{lens(x, y, i)}</g>)}
      <path d={holeD(CX, cy, FLASH_HOLE[0], FLASH_HOLE[1], FLASH_R)}
        fill={MIST} stroke={RULING} strokeWidth="1"/>
      <path d={holeD(CX, cy, TINY[0], TINY[1], TINY_R)}
        fill={MIST} stroke={RULING} strokeWidth="1"/>
    </g>
  )
}

/* The grid runs along the die's own plan axes, not square to the page: a
   page-square grid on a foreshortened face gives the projection away. */
function SensorDie({ cy, ox, oy }) {
  const h = 16, n = 4, out = []
  for (let i = 1; i < n; i++) {
    const d = -h + (2 * h * i) / n
    out.push(<line key={`v${i}`} {...seg(cy, ox + d, oy - h, ox + d, oy + h)}/>)
    out.push(<line key={`h${i}`} {...seg(cy, ox - h, oy + d, ox + h, oy + d)}/>)
  }
  return (
    <g>
      <path d={plateD(CX, cy, h, h, 4, ox, oy)} fill={INK} stroke={INK} strokeWidth="1.1"/>
      <g stroke={RULING} strokeWidth="0.9" opacity="0.55">{out}</g>
    </g>
  )
}

function seg(cy, x1, y1, x2, y2) {
  return {
    x1: px(CX, x1, y1), y1: py(cy, y1),
    x2: px(CX, x2, y2), y2: py(cy, y2),
  }
}

function Stack({ p }) {
  const ray = { fill: 'none', stroke: BEAM, strokeWidth: '2.2', strokeLinecap: 'round' }
  const glow = { fill: 'none', stroke: BEAMWASH, strokeWidth: '8', strokeLinecap: 'round' }
  return (
    <g>
      {/* Where the island's two visible corners close back to if the layers
          were stacked. */}
      <g stroke={RULING} strokeWidth="1" strokeDasharray="2 6">
        <line x1={px(CX, -A, A)} y1="168" x2={px(CX, -A, A)} y2={py(ISLAND, A)}/>
        <line x1={px(CX, A, -A)} y1="124" x2={px(CX, A, -A)} y2="358"/>
      </g>

      {/* The flash, exploded to the side because it is not in the optical
          stack, since it sits beside the lenses in the same island, which is why
          its window is a cutout on every plate below. */}
      <path d={plateD(FLASH.cx, FLASH.cy + FLASH.t, FLASH.a, FLASH.a, FLASH.r)}
        fill={MIST} stroke={INK} strokeWidth="1.2"/>
      <path d={plateD(FLASH.cx, FLASH.cy, FLASH.a, FLASH.a, FLASH.r)}
        fill={CARD} stroke={INK} strokeWidth="1.4"/>
      <path d={holeD(FLASH.cx, FLASH.cy, 0, 0, 11.5)} fill={WASH} stroke={INK2} strokeWidth="1.1"/>
      <path d={holeD(FLASH.cx, FLASH.cy, 0, 0, 5.8)} fill={ACCENT}/>

      <path d="M424,68 C432,52 444,42 468,49" {...glow}/>
      <path d="M424,68 C432,52 444,42 468,49" {...ray} className={`${p}-ray`}/>

      <path d={FINGER} fill={MIST} stroke={INK} strokeWidth="1.4" strokeLinejoin="round"/>
      <g clipPath={`url(#${p}-finger)`}>
        <path d="M485,0 C488.5,25.2 492,55.5 490,95.5" fill="none" stroke={BLOOD}
          strokeWidth="2.1" strokeLinecap="round" opacity="0.5" className={`${p}-vein`}/>
        <path d="M533,0 C529,23.7 534.5,55.5 538,93.2" fill="none" stroke={BLOOD}
          strokeWidth="1.8" strokeLinecap="round" opacity="0.5" className={`${p}-vein`}/>
        {/* Across both vessels and back down to the pad: what reaches the
            sensor is what the blood did not absorb. */}
        <path d="M468,49 C488,63 518,70 536,81 C534,91 526,97 513,101" {...glow}/>
        <path d="M468,49 C488,63 518,70 536,81 C534,91 526,97 513,101"
          {...ray} className={`${p}-ray`}/>
      </g>
      <path d={holeD(PAD.x, PAD.y, 0, 0, PAD.r)} fill={WASH} fillOpacity="0.8"
        stroke={INK} strokeWidth="1.3"/>

      {/* Cover glass. The tint is a separate inset shape, not a translucent
          face, so the layer below does not print through it. */}
      <Plate cy={ROW.glass}>
        <path d={plateD(CX, ROW.glass, A - 7, A - 7, RAD - 3)} fill={BEAMWASH}
          fillOpacity="0.5" stroke={INK} strokeOpacity="0.3" strokeWidth="1"/>
        <Cutouts cy={ROW.glass} lens={(x, y) => (
          <path d={holeD(CX, ROW.glass, x, y, LENS_R)} fill="none"
            stroke={RULING} strokeWidth="1.1"/>
        )}/>
      </Plate>

      <Plate cy={ROW.lens}>
        <Cutouts cy={ROW.lens} lens={(x, y) => (
          <g>
            <path d={holeD(CX, ROW.lens, x, y, LENS_R)} fill={CARD} stroke={INK2} strokeWidth="1.2"/>
            <path d={holeD(CX, ROW.lens, x, y, 14)} fill={WASH} stroke={INK2} strokeWidth="1"/>
            <path d={holeD(CX, ROW.lens, x, y, 7)} fill={CARD} stroke={INK2} strokeWidth="1"/>
          </g>
        )}/>
      </Plate>

      {/* The 45 degree hatch is the site's mark for a material zone, same as
          the adhesive on the patch drawing. */}
      <Plate cy={ROW.ir}>
        <Cutouts cy={ROW.ir} lens={(x, y) => (
          <g>
            <path d={holeD(CX, ROW.ir, x, y, LENS_R)} fill={`url(#${p}-hatch)`}/>
            <path d={holeD(CX, ROW.ir, x, y, LENS_R)} fill="none" stroke={ACCENT}
              strokeWidth="1.1" strokeDasharray="4 3"/>
          </g>
        )}/>
      </Plate>

      <Plate cy={ROW.sensor}>
        <Cutouts cy={ROW.sensor} lens={(x, y) => <SensorDie cy={ROW.sensor} ox={x} oy={y}/>}/>
      </Plate>

      {/* The phone body, sized to clear the island. No inset trim line: it
          ran about ten units outside the island and printed as a fourth
          parallel outline around the same corner. */}
      <path d={plateD(CX, PHONE + 9, 90, 104, 34, 18)} fill={MIST} stroke={INK} strokeWidth="1.3"/>
      <path d={plateD(CX, PHONE, 90, 104, 34, 18)} fill={CARD} stroke={INK} strokeWidth="1.5"/>
      <path d={plateD(CX, ISLAND + 4, A, A, RAD)} fill={MIST} stroke={INK} strokeWidth="1.2"/>
      <path d={plateD(CX, ISLAND, A, A, RAD)} fill={CARD} stroke={INK} strokeWidth="1.5"/>
      {LENSES.map(([x, y], i) => (
        <g key={i}>
          <path d={holeD(CX, ISLAND, x, y, LENS_R)} fill={MIST} stroke={INK} strokeWidth="1.3"/>
          <path d={holeD(CX, ISLAND, x, y, 13)} fill={CARD} stroke={INK2} strokeWidth="1"/>
          <path d={holeD(CX, ISLAND, x, y, 6)} fill={INK}/>
        </g>
      ))}
      <path d={holeD(CX, ISLAND, FLASH_HOLE[0], FLASH_HOLE[1], FLASH_R)}
        fill={WASH} stroke={INK2} strokeWidth="1.1"/>
      <path d={holeD(CX, ISLAND, FLASH_HOLE[0], FLASH_HOLE[1], 4.5)} fill={ACCENT}/>
      <path d={holeD(CX, ISLAND, TINY[0], TINY[1], TINY_R)} fill={INK} fillOpacity="0.5"/>

      {/* Every segment carries an arrowhead: once the plates are solid the
          gaps are the only place the ray can be seen. */}
      <g stroke={BEAM} strokeWidth="2.2" strokeLinecap="round" className={`${p}-ray`}>
        <line x1={RAYX} y1="106" x2={RAYX} y2={faceY(ROW.glass) - 4}
          markerEnd={`url(#${p}-tip)`}/>
        <line x1={RAYX} y1={faceY(ROW.glass) + T + 3} x2={RAYX} y2={faceY(ROW.lens) - 4}
          markerEnd={`url(#${p}-tip)`}/>
        <line x1={RAYX} y1={faceY(ROW.lens) + T + 3} x2={RAYX} y2={faceY(ROW.ir) - 4}
          markerEnd={`url(#${p}-tip)`}/>
        <line x1={RAYX} y1={faceY(ROW.ir) + T + 3} x2={RAYX} y2={faceY(ROW.sensor) - 4}
          markerEnd={`url(#${p}-tip)`}/>
      </g>
    </g>
  )
}

function Defs({ p }) {
  return (
    <defs>
      <marker id={`${p}-tip`} viewBox="0 0 10 10" refX="8" refY="5"
        markerWidth="4" markerHeight="4" orient="auto-start-reverse">
        <path d="M0 1 L9 5 L0 9 Z" fill={BEAM}/>
      </marker>
      {/* Leader arrows in the drawing's dark grey-green, not the pale ruling
          grey: a line followed across 250 units has to survive being looked
          at, and it stays far enough off the turquoise that a label cannot be
          read as the light travelling. */}
      <marker id={`${p}-lead`} viewBox="0 0 10 10" refX="8" refY="5"
        markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M0 2 L9 5 L0 8 Z" fill={INK3}/>
      </marker>
      <clipPath id={`${p}-finger`}><path d={FINGER}/></clipPath>
      <pattern id={`${p}-hatch`} width="7" height="7" patternTransform="rotate(45)"
        patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="7" stroke={INK} strokeOpacity="0.16" strokeWidth="1"/>
      </pattern>
    </defs>
  )
}

/* Media query as state, not CSS: the figure below mounts one of two drawings,
   and a CSS-only answer would ship both and hide one, a second copy of a
   200-line SVG in every payload. */
export function useNarrow(q = '(max-width: 767px)') {
  const [v, setV] = React.useState(
    () => typeof matchMedia === 'function' ? matchMedia(q).matches : false)
  React.useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const m = matchMedia(q)
    const on = () => setV(m.matches)
    on()
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [q])
  return v
}

/* Bands first, then rules, then text, so nothing is drawn over a sentence. */
function StepTable({ p }) {
  return (
    <g>
      {CAMERA_STEPS.map((s, i) => (
        <rect key={s.id} x={TBL_X} y={rowTop(i)} width={TBL_W} height={ROWH}
          fill={i % 2 ? MIST : CARD}/>
      ))}
      <g stroke={RULE} strokeWidth="1">
        {CAMERA_STEPS.map((s, i) => (
          <line key={s.id} x1={TBL_X} y1={rowTop(i)} x2={TBL_R} y2={rowTop(i)}/>
        ))}
        <line x1={TBL_X} y1={rowTop(CAMERA_STEPS.length)} x2={TBL_R}
          y2={rowTop(CAMERA_STEPS.length)}/>
      </g>
      {CAMERA_STEPS.map((s, i) => (
        <g key={s.id}>
          {s.to.map((t, j) => (
            <path key={j} d={leadD(s, i, t)} fill="none" stroke={INK3}
              strokeWidth="1.1" strokeLinejoin="round" markerEnd={`url(#${p}-lead)`}/>
          ))}
          <circle cx={TBL_R} cy={rowMid(i)} r="2.8" fill={INK3}/>
          {/* A plain marker, not 01 to 06 (owner, 20 October). */}
          <circle cx={TBL_X + NUM_W / 2 + 2} cy={baseY(i) - 5} r="3.5" fill={BEAM}/>
          {s.lines.map((l, j) => (
            <text key={j} x={TXT_X} y={baseY(i) + j * LEAD} fill={INK}
              fontFamily="Chivo, sans-serif" fontSize="16">{l}</text>
          ))}
        </g>
      ))}
    </g>
  )
}

/* The sensor's brightness over three and a half seconds of a 70 bpm pulse,
   drawn from a model wave rather than typed as points: a fast dip as the
   beat arrives, a slower climb back, and the small second notch a pulse wave
   carries. Demo shape, not a recording. */
const TR_W = 300, TR_H = 150, TR_SECONDS = 3.5, TR_BPM = 70
const TR_X0 = 8, TR_X1 = TR_W - 8, TR_TOP = 22, TR_BOT = 108
function trBright(t) {
  const period = 60 / TR_BPM
  const ph = ((t - 0.25) % period + period) % period / period
  const g = (c, w) => Math.exp(-((ph - c) ** 2) / (2 * w * w))
  return 1 - (0.92 * g(0.16, 0.07) + 0.3 * g(0.42, 0.06))
}
const TR_PATH = (() => {
  let d = ''
  for (let i = 0; i <= 140; i++) {
    const t = (i / 140) * TR_SECONDS
    const x = TR_X0 + (i / 140) * (TR_X1 - TR_X0)
    const y = TR_TOP + (1 - trBright(t)) * (TR_BOT - TR_TOP)
    d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return d
})()
/* Where each dip bottoms out, for its marker. */
const TR_DIPS = Array.from({ length: 5 }, (_, k) => 0.25 + 0.16 * (60 / TR_BPM) + k * (60 / TR_BPM))
  .filter(t => t < TR_SECONDS)
  .map(t => ({ x: TR_X0 + (t / TR_SECONDS) * (TR_X1 - TR_X0), y: TR_TOP + (1 - trBright(t)) * (TR_BOT - TR_TOP) }))
const TR_SEC = (TR_X1 - TR_X0) / TR_SECONDS

function SensorTrace({ p }) {
  return (
    <svg viewBox={`0 0 ${TR_W} ${TR_H}`} aria-hidden className="block h-auto w-full rounded-panel bg-mist">
      <style>{`
        @keyframes ${p}-scan { from { transform: translateX(0) } to { transform: translateX(${TR_X1 - TR_X0}px) } }
        .${p}-head { animation: ${p}-scan 3.5s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .${p}-head { animation: none; opacity: 0 } }
      `}</style>
      <text x={TR_X0} y="14" fill={INK2} fontFamily="Chivo, sans-serif" fontSize="13">brightness</text>
      <line x1={TR_X0} y1={TR_TOP - 4} x2={TR_X1} y2={TR_TOP - 4} stroke={RULE} strokeDasharray="3 4"/>
      <path d={TR_PATH} fill="none" stroke={BEAM} strokeWidth="2.6" strokeLinecap="round"
        strokeLinejoin="round"/>
      {/* A read head sweeping across at the speed of the trace: transform only. */}
      <line x1={TR_X0} y1={TR_TOP - 8} x2={TR_X0} y2={TR_BOT + 6} stroke={ACCENT} strokeWidth="1.5"
        strokeOpacity="0.55" className={`${p}-head`}/>
      {TR_DIPS.map((d, i) => (
        <g key={i}>
          <circle cx={d.x} cy={d.y} r="4" fill={CARD} stroke={BLOOD} strokeWidth="2"/>
          <text x={d.x} y={d.y + 17} textAnchor="middle" fill={INK2}
            fontFamily="Chivo, sans-serif" fontSize="13">{i + 1}</text>
        </g>
      ))}
      <g stroke={INK3} strokeWidth="1.2">
        <line x1={TR_X0} y1={TR_H - 16} x2={TR_X0 + TR_SEC} y2={TR_H - 16}/>
        <line x1={TR_X0} y1={TR_H - 20} x2={TR_X0} y2={TR_H - 12}/>
        <line x1={TR_X0 + TR_SEC} y1={TR_H - 20} x2={TR_X0 + TR_SEC} y2={TR_H - 12}/>
      </g>
      <text x={TR_X0 + TR_SEC + 8} y={TR_H - 12} fill={INK2} fontFamily="Chivo, sans-serif" fontSize="13">1 second</text>
    </svg>
  )
}

export function CameraModule({ className }) {
  const raw = React.useId()
  const p = `mmc${raw.replace(/[^a-zA-Z0-9]/g, '')}`   // useId returns colons; CSS will not take them
  const narrow = useNarrow()
  return (
    <figure className={cn('m-0', className)}>
      {/* On xl the caption is a rail beside the figure: the sensor's trace at
          a size that reads, and one sentence. */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_19rem] xl:items-center xl:gap-8">
        <div>
          <svg
            /* Narrow crops to the drawing rather than redrawing it, so phone
               and desktop cannot drift apart. */
            /* HELD TO 244px ON A PHONE. The crop is 300 units wide by 470
               tall, so at the full 358px of a 390 column it printed 561px of
               drawing before a word of the step list, and at 288 still 451px.
               Spec 0e section 14 caps a band at about one and a half screens
               and this one ran to 1.95, so the cap comes down again: 244 puts
               the drawing at 382px. The only type inside the crop is the
               "camera island" label, which lands at 15 * 244 / 300 = 12.2px
               and stays ink-2 on card, 8.31 : 1. Nothing else in the crop is
               type. */
            viewBox={narrow ? `390 -4 300 ${VB_H + 8}` : `0 0 700 ${VB_H}`}
            className={cn('block w-full', narrow && 'mx-auto max-w-[244px]')}
            role="img"
            aria-label="An exploded view of a phone's rear camera, labelled along the light path.
              The flash shines into the side of a fingertip. Blood absorbs some of that light,
              more with every heartbeat. What comes back crosses the cover glass, and the lens
              focuses it. The infrared filter drops the light the eye cannot see. The image
              sensor reads it thirty times a second. That number rising and falling is the pulse.">
            {/* Keyframes live in the drawing, not input.css: the class names
                are namespaced per instance, and two of these on one page must
                not share a keyframe name. */}
            <style>{`
              @keyframes ${p}-flow { to { stroke-dashoffset: -26 } }
              @keyframes ${p}-beat { 0%,100% { opacity:.34 } 42% { opacity:.95 } }
              .${p}-ray  { stroke-dasharray: 7 6; animation: ${p}-flow 1.15s linear infinite; }
              .${p}-vein { animation: ${p}-beat 1.15s ease-in-out infinite; }
              @media (prefers-reduced-motion: reduce) {
                .${p}-ray { stroke-dasharray: none; animation: none }
                .${p}-vein { animation: none; opacity: .7 }
              }
            `}</style>
            <Defs p={p}/>
            <g aria-hidden="true">
              <Stack p={p}/>
              <text x={CX} y={VB_H - 12} textAnchor="middle" fill={INK2}
                fontFamily="Chivo, sans-serif" fontSize="15">camera island</text>
              {!narrow && <StepTable p={p}/>}
            </g>
          </svg>

          {/* The steps again as HTML for the narrow crop: at 390px a 16-unit
              sentence inside a 700-unit viewBox renders at nine pixels. */}
          {narrow && (
            <ol className="m-0 mt-4 grid list-none gap-2 p-0">
              {CAMERA_STEPS.map(s => (
                <li key={s.id} className="grid grid-cols-[0.75rem_1fr] items-baseline gap-x-2">
                  <span aria-hidden className="size-1.5 translate-y-[-0.15rem] rounded-full bg-beam"/>
                  <span className="text-note leading-[1.35] text-ink">{s.lines.join(' ')}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* NOT DRAWN ON A PHONE: at 390 the last step of the list already says it.
            From md it is the drawing's last step at a size that reads: what
            the sensor's number does over a few seconds. On xl it is a rail
            beside the drawing, sized to fill it rather than leave a column of
            blank card with one line of type in it. */}
        {!narrow && (
          <figcaption className="m-0 grid gap-3 border-t border-rule/60 pt-4
            md:grid-cols-[minmax(0,1fr)_minmax(0,16rem)] md:items-center md:gap-6
            xl:grid-cols-1 xl:content-center xl:self-stretch xl:border-l xl:border-t-0 xl:pl-7 xl:pt-0">
            <SensorTrace p={p}/>
            <div>
              <p className="m-0 font-display text-ui font-bold leading-tight text-ink">What the sensor sees</p>
              <p className="m-0 mt-1 text-meta leading-[1.45] text-ink-2">
                The image gets a little darker each time blood pushes into the fingertip.
                Each dip is one heartbeat.</p>
            </div>
          </figcaption>
        )}
      </div>
    </figure>
  )
}

/* ── What the phone gets, and what it does not ───────────────────────────── */
const COVERAGE = [
  { id:'heart', name:'Heart rate',  on:true,  note:'The camera reads this.' },
  { id:'move',  name:'Movement',    on:true,  note:'The phone reads this.' },
  { id:'sweat', name:'Sweat',       on:false, note:'Only the patch reads this.' },
  { id:'temp',  name:'Skin temperature', on:false, note:'Only the patch reads this.' },
]

export function SignalCoverage({ className }) {
  return (
    <ul className={cn('m-0 grid list-none grid-cols-2 gap-2.5 p-0 lg:grid-cols-4 lg:gap-3.5', className)}>
      {COVERAGE.map(s => (
        <li key={s.id}
          className={cn('rounded-panel border px-3 py-2.5',
            s.on ? 'border-rule/60 bg-card' : 'border-dashed border-ruling bg-transparent')}>
          <SignalTrace kind={s.id} muted={!s.on}/>
          <p className={cn('mt-1.5 font-display text-ui font-bold',
            s.on ? 'text-ink' : 'text-ink-3')}>{s.name}</p>
          <p className={cn('mt-0.5 text-fine', s.on ? 'text-accent' : 'text-ink-3')}>{s.note}</p>
        </li>
      ))}
    </ul>
  )
}

/* Three figures for the capture steps: each 210 x 92 in its own units,
   rendered at 5rem of height. */

/* Lines to read out loud. What is measured is the level and steadiness of a
   voice, never the words. Exported: the capture screen and the phone mockup
   have to offer the same lines. */
export const SAY_LINES = [
  'The bus leaves at eight.',
  'The window faces the street.',
  'There are four chairs at the table.',
]

/* Which finger, and over what: the pad covers the lens and the flash at once. */
function GripFig() {
  return (
    <svg viewBox="0 0 210 96" className="block w-full max-w-[16rem]" aria-hidden>
      {/* The pad is drawn inside the island's edges, not around them, so the
          island stays readable under it. */}
      <rect x="6" y="6" width="70" height="70" rx="19" fill={CARD} stroke={INK} strokeWidth="1.4"/>
      <circle cx="25" cy="25" r="9" fill="none" stroke={INK2} strokeWidth="1.2"/>
      <circle cx="25" cy="57" r="9" fill="none" stroke={INK2} strokeWidth="1.2"/>
      <circle cx="57" cy="57" r="9" fill="none" stroke={INK2} strokeWidth="1.2"/>
      <circle cx="57" cy="25" r="6.5" fill={WASH} stroke={INK2} strokeWidth="1.2"/>
      <circle cx="57" cy="25" r="3" fill={ACCENT}/>
      <ellipse cx="41" cy="41" rx="30" ry="27" fill={WASH} fillOpacity="0.45"
        stroke={INK} strokeWidth="1.6"/>
      <g stroke={INK3} strokeWidth="1" fill="none">
        <path d="M64,25 H112"/>
        <path d="M66,57 H112"/>
      </g>
      <g fill={INK2} fontFamily="Chivo, sans-serif" fontSize="12.5">
        <text x="116" y="29">flash</text>
        <text x="116" y="61">lens</text>
      </g>
      <text x="6" y="90" fill={INK3} fontFamily="Chivo, sans-serif" fontSize="12.5">
        the fingertip pad rests here
      </text>
    </svg>
  )
}

/* Hand on the phone, forearm on the same surface behind it: a hand holding a
   phone up cannot survive thirty seconds of stillness. */
function RestArt() {
  const hatch = [10, 24, 38, 52, 66, 80, 94, 108, 122, 136, 150, 164, 178, 192]
  return (
    <g>
      <line x1="4" y1="68" x2="206" y2="68" stroke={INK} strokeWidth="1.6"/>
      <g stroke={RULING} strokeWidth="1">
        {hatch.map(x => <line key={x} x1={x} y1="68" x2={x - 7} y2="76"/>)}
      </g>
      <rect x="18" y="57" width="90" height="11" rx="3" fill={MIST} stroke={INK} strokeWidth="1.4"/>
      <path d="M56,57 L104,57 L112,68 L210,68 L210,45
               C172,45 146,46 124,49 C106,52 92,50 80,47
               C68,44 54,45 48,50 C44,54 48,57 56,57 Z"
        fill={MIST} stroke={INK} strokeWidth="1.4" strokeLinejoin="round"/>
      <ellipse cx="62" cy="57" rx="10" ry="3.2" fill={WASH} stroke={INK2} strokeWidth="1.1"/>
      <circle cx="62" cy="57" r="2.4" fill={ACCENT}/>
      <text x="4" y="88" fill={INK3} fontFamily="Chivo, sans-serif" fontSize="12.5">
        phone and forearm on a table
      </text>
    </g>
  )
}

function RestFig() {
  return (
    <svg viewBox="0 0 210 96" className="block w-full max-w-[16rem]" aria-hidden>
      <RestArt/>
    </svg>
  )
}

/* The struck-out speaker is the room; the distance is on a dimension line
   because it is a measurement. */
function QuietFig() {
  return (
    <svg viewBox="0 0 210 96" className="block w-full max-w-[16rem]" aria-hidden>
      <rect x="8" y="10" width="30" height="54" rx="8" fill={MIST} stroke={INK} strokeWidth="1.4"/>
      <circle cx="23" cy="58" r="2.6" fill={ACCENT}/>
      <path d="M62,32 L70,32 L79,22 L79,52 L70,42 L62,42 Z" fill={CARD} stroke={INK} strokeWidth="1.2"/>
      <path d="M85,28 C90,33 90,41 85,46" fill="none" stroke={INK3} strokeWidth="1.3"/>
      <path d="M58,52 L92,22" stroke={INK} strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="172" cy="26" r="11" fill={CARD} stroke={INK} strokeWidth="1.4"/>
      <path d="M152,58 C152,42 161,34 172,34 C183,34 192,42 192,58" fill={CARD}
        stroke={INK} strokeWidth="1.4"/>
      <g fill="none" stroke={BEAM} strokeWidth="1.6" strokeLinecap="round">
        <path d="M144,24 C138,29 138,37 144,42"/>
        <path d="M134,20 C126,27 126,39 134,46"/>
      </g>
      <g stroke={INK3} strokeWidth="1">
        <line x1="40" y1="68" x2="40" y2="80"/>
        <line x1="150" y1="68" x2="150" y2="80"/>
        <line x1="40" y1="74" x2="150" y2="74"/>
      </g>
      <text x="95" y="90" textAnchor="middle" fill={INK3}
        fontFamily="Chivo, sans-serif" fontSize="12.5">about an arm’s length away</text>
    </svg>
  )
}

const STEP_FIGS = { grip: GripFig, rest: RestFig, quiet: QuietFig }

export function StepFigure({ kind }) {
  const F = STEP_FIGS[kind]
  return F ? <F/> : null
}
