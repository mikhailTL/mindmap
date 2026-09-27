import React from 'react'
import { SignalTrace } from './infographics'
import { cn } from '../lib/utils'

/* The rear camera, taken apart, because the sentence never worked.
 *
 * "A fingertip over the rear camera turns the phone into the same kind of
 * sensor the patch carries" was the whole explanation, and it asked a reader
 * to picture a thing they have never seen. So the stack is drawn instead of
 * described, and photoplethysmography is something a judge can read off the
 * drawing without being told the word.
 *
 * Two earlier versions were rejected, and the faults are worth keeping written
 * down because both are easy to walk back into.
 *
 * The first drew the layers as isometric diamonds with numbered badges down
 * the right. A square rotated 45 degrees stops reading as a camera island and
 * starts reading as a rhombus, so the one shape the reader is supposed to
 * recognise was the one shape that had been thrown away. Hence face-on plates
 * at a shallow oblique angle, which is what survives here.
 *
 * The second named six parts and defined each one: cover glass, the window you
 * touch. That is a bill of materials. A reader finished it knowing what the
 * pieces are called and still not knowing how a phone measures a heartbeat,
 * which is the only thing this figure is for. It also ran 790 units tall on
 * six widely spaced rows with an empty left column, so it pushed the rest of
 * the page off the screen to say less.
 *
 * So the figure is now a procedure. The column on the left is the light's
 * journey in order, numbered, each step on a leader line into the part it
 * happens in, and the turquoise ray runs through the stack with an arrowhead
 * at every crossing so the direction of travel is legible before a word is
 * read. The numerals are information here rather than decoration: they are the
 * reading order, which is the whole point of the redraw.
 *
 * Everything is 0.71 of its old size and the rows sit 56 apart instead of 95,
 * which is what took 790 units down to 500 without dropping below the 15 unit
 * floor on type.
 */

/* Palette by hand, not by class: these are SVG paint attributes and Tailwind
   tokens do not reach them. Values are tailwind.config.js, unchanged. */
const INK = '#0d2b1e', INK2 = '#2a5744', INK3 = '#47705e'
const RULE = '#c2d7ca', RULING = '#93b2a1', MIST = '#e3ede7'
const CARD = '#ffffff', ACCENT = '#157446', WASH = '#dcefe4'
const BEAM = '#0e9c9c', BEAMWASH = '#d9f0ef'
const BLOOD = '#e11919'                 // the heart signal's own colour, sitewide

/* One oblique projection for the whole drawing: a point (x, y) in a plate's
   own plan lands at (cx + x - 0.42y, cy + 0.34y). Shallow on purpose. A
   steeper angle turns the island into a sliver and buries the lens cutouts,
   and the cutouts are the thing that says "this is your camera". */
const SHX = -0.42, SY = 0.34
const CX = 530                          // the stack's centre line
const A = 64, RAD = 22, T = 6           // plate half-side, corner radius, thickness

/* Every path is built through the map below rather than handed to an SVG
   matrix transform. A matrix would squash stroke width along with the
   geometry: at 0.34 vertical scale a 1.4 edge prints at 0.48 going across and
   1.4 going down, so the plate outlines would look half-erased next to the
   lens rings. Building the points costs a helper and keeps one ink weight. */
const px = (cx, x, y) => cx + x + SHX * y
const py = (cy, y) => cy + SY * y
const P = (cx, cy, x, y) => `${px(cx, x, y).toFixed(1)},${py(cy, y).toFixed(1)}`

/* Rounded square, corners as quadratics. Quadratics survive an affine map
   exactly, where an elliptical arc would need its radii and rotation
   recomputed per layer; the fuller corner they give is also closer to the
   squircle a camera island actually is. */
function plateD(cx, cy, a, b, r, ox = 0, oy = 0) {
  const p = (x, y) => P(cx, cy, x + ox, y + oy)
  return `M${p(-a + r, -b)} L${p(a - r, -b)} Q${p(a, -b)} ${p(a, -b + r)}`
    + ` L${p(a, b - r)} Q${p(a, b)} ${p(a - r, b)}`
    + ` L${p(-a + r, b)} Q${p(-a, b)} ${p(-a, b - r)}`
    + ` L${p(-a, -b + r)} Q${p(-a, -b)} ${p(-a + r, -b)} Z`
}

/* A plan circle, as four cubics, for the same reason. */
const K = 0.5523
function holeD(cx, cy, ox, oy, r) {
  const p = (x, y) => P(cx, cy, x + ox, y + oy)
  return `M${p(r, 0)} C${p(r, K * r)} ${p(K * r, r)} ${p(0, r)}`
    + ` C${p(-K * r, r)} ${p(-r, K * r)} ${p(-r, 0)}`
    + ` C${p(-r, -K * r)} ${p(-K * r, -r)} ${p(0, -r)}`
    + ` C${p(K * r, -r)} ${p(r, -K * r)} ${p(r, 0)} Z`
}

/* The island's cutouts, in plan, once. Three cameras, the flash beside them
   and the small sensor window above it: that arrangement is what a reader
   recognises, so it is repeated on every layer rather than simplified to the
   one lens the light happens to use. Three lenses really do mean three lens
   assemblies, three filters and three sensor dies. */
const LENSES = [[-29, -29], [-29, 29], [29, 29]]
const LENS_R = 20
const FLASH_HOLE = [33, -24], FLASH_R = 10
const TINY = [33, -47], TINY_R = 4.5

const ROW = { glass: 176, lens: 232, ir: 288, sensor: 344 }
const PHONE = 422, ISLAND = 416        // phone body face, island top face

/* The light uses the top-left camera, so the whole ray is one vertical line:
   travelling along the stack's normal is straight down in this projection,
   which is what lets the beam read as a single path through four parts. */
const RAYX = px(CX, LENSES[0][0], LENSES[0][1])
const faceY = cy => py(cy, LENSES[0][1])

/* The finger, once, because the outline and the clip that keeps the vessels
   inside the skin have to be the same path. Cut off at the top edge on
   purpose: a finger that starts at the frame has somewhere to come from. */
const FINGER = 'M471.5,0 C467,40 468.5,86 476,113 C482,131 492.5,141.5 512.8,142.6'
  + ' C533,141.5 543.5,131 549.5,113 C557,86 558.5,40 554,0 Z'

const PAD = { x: 513.2, y: 136, r: 16 }        // the skin actually against the glass
const FLASH = { cx: 424, cy: 108, a: 23, r: 9, t: 5 }

/* The light's journey, in order, and where each step's leader line lands.
   `lines` is pre-wrapped because SVG text does not wrap and the column is 270
   units wide; joining them back up is what the phone-width list renders, so
   the two can never say different things.

   `at` is the leader's height and the text block is centred on it, so a step
   sits beside the part it names rather than above or below it. Step three owns
   two plates, which is why its leader forks: the light crosses the cover glass
   and the lens in one move and splitting that into two steps would invent a
   stage that is not there. */
export const CAMERA_STEPS = [
  { id: 'flash', n: '01', at: 52,
    lines: ['The flash shines into the side', 'of your fingertip.'],
    /* An elbow, because the flash sits low and left of the text: a straight
       diagonal from the label would have crossed the ray leaving the flash. */
    lead: ['M330,52 H372 V112 H393'] },
  { id: 'blood', n: '02', at: 130,
    lines: ['Blood in the tissue absorbs', 'some of that light. Every',
      'heartbeat changes how much.'],
    /* Runs flat under the flash, then turns up into the tissue and stops on a
       vessel. Stopped at the outline it read as pointing at the contact pad,
       which is the next step's business, not this one's. */
    lead: ['M330,130 H455 L488,110'] },
  { id: 'optics', n: '03', at: 218,
    lines: ['What comes back out passes', 'through the cover glass. The',
      'lens focuses it.'],
    lead: ['M330,218 H398 L444,192', 'M330,218 H398 L449,244'] },
  { id: 'ir', n: '04', at: 296,
    lines: ['The infrared filter drops the', 'light your eye cannot see.'],
    lead: ['M330,296 H453'] },
  { id: 'sensor', n: '05', at: 356,
    lines: ['The image sensor turns what', 'lands on it into a number,',
      'thirty times a second.'],
    lead: ['M330,356 H448'] },
  { id: 'pulse', n: '06', at: 428,
    lines: ['That number rising and falling', 'is your pulse.'],
    /* Down onto the phone body rather than level into the island's corner:
       at label height the two silhouettes meet, and the number is the whole
       device's output, not the island's. */
    lead: ['M330,428 H390 L420,450'] },
]

/* Body, then face, so the offset copy showing below the face is the layer's
   thickness. Cheaper than three faces per plate and it cannot fall out of
   register, because both copies come from the same call. */
function Plate({ cy, face = CARD, side = MIST, a = A, b = A, r = RAD, t = T, children }) {
  return (
    <g>
      <path d={plateD(CX, cy + t, a, b, r)} fill={side} stroke={INK} strokeWidth="1.2"/>
      <path d={plateD(CX, cy, a, b, r)} fill={face} stroke={INK} strokeWidth="1.4"/>
      {children}
    </g>
  )
}

/* The cutouts that every layer carries, so the layers stay recognisably the
   same object. `lens` is what changes between layers; the flash and sensor
   windows are plain openings passing through. */
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

/* The grid is drawn along the die's own plan axes, not square to the page. A
   page-square grid on a foreshortened face is the giveaway that the
   projection was faked. */
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
      {/* Where the island's two visible corners would come back to if the
          layers were closed up. Convention, and it is the line that says the
          five plates and the phone are one part rather than six drawings. */}
      <g stroke={RULING} strokeWidth="1" strokeDasharray="2 6">
        <line x1={px(CX, -A, A)} y1="200" x2={px(CX, -A, A)} y2={py(ISLAND, A)}/>
        <line x1={px(CX, A, -A)} y1="156" x2={px(CX, A, -A)} y2="390"/>
      </g>

      {/* The flash, exploded out to the side because it is not in the optical
          stack: it sits beside the lenses in the same island, which is why its
          window appears as a cutout on every plate below. */}
      <path d={plateD(FLASH.cx, FLASH.cy + FLASH.t, FLASH.a, FLASH.a, FLASH.r)}
        fill={MIST} stroke={INK} strokeWidth="1.2"/>
      <path d={plateD(FLASH.cx, FLASH.cy, FLASH.a, FLASH.a, FLASH.r)}
        fill={CARD} stroke={INK} strokeWidth="1.4"/>
      <path d={holeD(FLASH.cx, FLASH.cy, 0, 0, 12)} fill={WASH} stroke={INK2} strokeWidth="1.1"/>
      <path d={holeD(FLASH.cx, FLASH.cy, 0, 0, 6)} fill={ACCENT}/>

      {/* Out of the flash and into the side of the finger. */}
      <path d="M417,100 C425,84 436,70 464,74" {...glow}/>
      <path d="M417,100 C425,84 436,70 464,74" {...ray} className={`${p}-ray`}/>

      {/* The fingertip. The contact outline inside it is the patch of skin
          actually against the glass, which is the thing a reader has to
          locate, and an outline finds it faster than a caption would. */}
      <path d={FINGER} fill={MIST} stroke={INK} strokeWidth="1.4" strokeLinejoin="round"/>
      <g clipPath={`url(#${p}-finger)`}>
        <path d="M485,0 C488.5,34 492,75 490,129" fill="none" stroke={BLOOD}
          strokeWidth="2.1" strokeLinecap="round" opacity="0.5" className={`${p}-vein`}/>
        <path d="M533,0 C529,32 534.5,75 538,126" fill="none" stroke={BLOOD}
          strokeWidth="1.8" strokeLinecap="round" opacity="0.5" className={`${p}-vein`}/>
        {/* Inside the tissue, across both vessels and back down to the pad.
            This detour is the whole reason the drawing exists: what reaches
            the sensor is what the blood did not absorb on the way. */}
        <path d="M466,74 C486,88 518,97 536,111 C534,125 526,133 513,138" {...glow}/>
        <path d="M466,74 C486,88 518,97 536,111 C534,125 526,133 513,138"
          {...ray} className={`${p}-ray`}/>
      </g>
      <path d={holeD(PAD.x, PAD.y, 0, 0, PAD.r)} fill={WASH} fillOpacity="0.8"
        stroke={INK} strokeWidth="1.3"/>

      {/* Cover glass. The tint is a separate inset shape rather than a
          translucent face, so the layer below does not print through it. */}
      <Plate cy={ROW.glass}>
        <path d={plateD(CX, ROW.glass, A - 7, A - 7, RAD - 3)} fill={BEAMWASH}
          fillOpacity="0.5" stroke={INK} strokeOpacity="0.3" strokeWidth="1"/>
        <Cutouts cy={ROW.glass} lens={(x, y) => (
          <path d={holeD(CX, ROW.glass, x, y, LENS_R)} fill="none"
            stroke={RULING} strokeWidth="1.1"/>
        )}/>
      </Plate>

      {/* Lens, as the concentric elements it is. */}
      <Plate cy={ROW.lens}>
        <Cutouts cy={ROW.lens} lens={(x, y) => (
          <g>
            <path d={holeD(CX, ROW.lens, x, y, LENS_R)} fill={CARD} stroke={INK2} strokeWidth="1.2"/>
            <path d={holeD(CX, ROW.lens, x, y, 14)} fill={WASH} stroke={INK2} strokeWidth="1"/>
            <path d={holeD(CX, ROW.lens, x, y, 7)} fill={CARD} stroke={INK2} strokeWidth="1"/>
          </g>
        )}/>
      </Plate>

      {/* Infrared filter. The 45 degree hatch is the site's mark for a
          material zone, the same one that marks adhesive on the patch
          drawing: here it is the coating, which is the only part of this
          layer that does anything. */}
      <Plate cy={ROW.ir}>
        <Cutouts cy={ROW.ir} lens={(x, y) => (
          <g>
            <path d={holeD(CX, ROW.ir, x, y, LENS_R)} fill={`url(#${p}-hatch)`}/>
            <path d={holeD(CX, ROW.ir, x, y, LENS_R)} fill="none" stroke={ACCENT}
              strokeWidth="1.1" strokeDasharray="4 3"/>
          </g>
        )}/>
      </Plate>

      {/* Image sensor. Square dies, not circles: it is the one layer that is
          not an optic, and the drawing should say so before the label does. */}
      <Plate cy={ROW.sensor}>
        <Cutouts cy={ROW.sensor} lens={(x, y) => <SensorDie cy={ROW.sensor} ox={x} oy={y}/>}/>
      </Plate>

      {/* The phone itself, so the stack lands on something. No inset trim line
          on this one: it was drawn here for consistency with the patch shell
          and it ran about ten units outside the island, which printed as a
          fourth parallel outline around the same corner and made the island
          impossible to pick out. The body is sized to clear the island
          instead, which is what the trim line was standing in for. */}
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

      {/* The ray in the gaps, because once the plates are solid the gaps are
          the only place it can be seen. Every segment carries an arrowhead
          now, not just the last one: the figure is read as a sequence, and one
          arrow at the bottom was the only thing saying which way down was. */}
      <g stroke={BEAM} strokeWidth="2.2" strokeLinecap="round" className={`${p}-ray`}>
        <line x1={RAYX} y1="143" x2={RAYX} y2={faceY(ROW.glass) - 4}
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
      {/* Leader arrows are the same shape in the drawing's grey, so a label
          pointing at a part cannot be mistaken for the light travelling. */}
      <marker id={`${p}-lead`} viewBox="0 0 10 10" refX="8" refY="5"
        markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M0 2 L9 5 L0 8 Z" fill={RULING}/>
      </marker>
      <clipPath id={`${p}-finger`}><path d={FINGER}/></clipPath>
      <pattern id={`${p}-hatch`} width="7" height="7" patternTransform="rotate(45)"
        patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="7" stroke={INK} strokeOpacity="0.16" strokeWidth="1"/>
      </pattern>
    </defs>
  )
}

/* Media query as state, because two things on this page need the real answer
   and not a guess: which version of this drawing to mount, and how big a phone
   mockup can be before it runs off a 390px screen. A CSS-only answer would
   have meant shipping both drawings and hiding one, which is a second copy of
   a 200-line SVG in every payload. */
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

/* Line leading, and the offset that centres an n-line block on its own leader.
   Text hung from a fixed top would drift away from the part it points at as
   soon as one step needed a third line. */
const LEAD = 21
const baseY = s => s.at - (s.lines.length - 1) * (LEAD / 2) + 6

export function CameraModule({ className }) {
  const raw = React.useId()
  const p = `mmc${raw.replace(/[^a-zA-Z0-9]/g, '')}`   // useId returns colons; CSS will not take them
  const narrow = useNarrow()
  return (
    <figure className={cn('m-0', className)}>
      <svg
        /* Narrow crops to the drawing rather than redrawing it, so the phone
           and the desktop are the same picture and cannot drift apart. */
        viewBox={narrow ? '386 0 314 500' : '0 0 700 500'}
        className="block w-full"
        role="img"
        aria-label="An exploded view of a phone's rear camera, numbered along the path the
          light takes. The flash shines into the side of a fingertip. Blood in the tissue
          absorbs some of that light, and every heartbeat changes how much. What comes back
          out passes through the cover glass and the lens, which focuses it. The infrared
          filter drops the light the eye cannot see. The image sensor turns what lands on it
          into a number thirty times a second, and that number rising and falling is the
          pulse.">
        {/* The animation lives in the drawing rather than in input.css because
            the class names are namespaced per instance; two of these on one
            page must not share a keyframe name. */}
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
          <text x={CX} y="492" textAnchor="middle" fill={INK2}
            fontFamily="ui-monospace, monospace" fontSize="15">camera island</text>

          {/* The steps, in order, each on a leader into the part it happens in.
              A numeral and a sentence beside the thing itself, rather than a
              badge on the drawing and a key underneath it: the badge version
              was three eye movements per part and taught nothing about order. */}
          {!narrow && CAMERA_STEPS.map(s => (
            <g key={s.id}>
              {s.lead.map((d, i) => (
                <path key={i} d={d} fill="none" stroke={RULING} strokeWidth="1.1"
                  markerEnd={`url(#${p}-lead)`}/>
              ))}
              <text x="22" y={baseY(s)} fill={ACCENT}
                fontFamily="ui-monospace, monospace" fontSize="15">{s.n}</text>
              {s.lines.map((l, i) => (
                <text key={i} x="50" y={baseY(s) + i * LEAD} fill={INK}
                  fontFamily="Chivo, sans-serif" fontSize="17">{l}</text>
              ))}
            </g>
          ))}
        </g>
      </svg>

      {/* The steps again, as HTML, for the narrow crop. At 390px a 17 unit
          sentence inside a 700 unit viewBox renders at nine pixels, so the
          words come out of the drawing and the ordered list carries the
          sequence the leader lines were carrying. */}
      {narrow && (
        <ol className="mt-6 m-0 grid list-none grid-cols-1 gap-y-3 p-0">
          {CAMERA_STEPS.map(s => (
            <li key={s.id} className="grid grid-cols-[1.9rem_1fr] gap-x-1">
              <span className="font-mono text-fine tabular-nums text-accent">{s.n}</span>
              <span className="text-sec leading-[1.45] text-ink-2">{s.lines.join(' ')}</span>
            </li>
          ))}
        </ol>
      )}

      <figcaption className="mt-7 flex flex-col gap-4 border-t border-rule pt-5
        sm:flex-row sm:items-center sm:gap-7">
        <p className="m-0 max-w-[46ch] text-sec leading-[1.5] text-ink-2">
          One number per frame, thirty frames a second. Each beat lets less light
          through, so the number dips once per beat.
        </p>
        <svg viewBox="0 0 220 44" aria-hidden className="h-11 w-full shrink-0 sm:w-[220px]">
          <path d="M0 14 L22 14 L30 30 L38 14 L60 14 L82 14 L90 30 L98 14 L120 14
                   L142 14 L150 30 L158 14 L180 14 L202 14 L210 30 L218 14"
            fill="none" stroke={BEAM} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          <text x="0" y="42" fill={INK3} fontFamily="Chivo, sans-serif" fontSize="11">one dip, one beat</text>
        </svg>
      </figcaption>
    </figure>
  )
}

/* ── What the phone gets, and what it does not ─────────────────────────────
 * This replaces a sentence. "No skin temperature, no sweat" was printed under
 * one of the two route cards and the review called it out by name: a reader
 * comparing two things should be looking at the comparison, not parsing a
 * clause. Four signals, two lit and two not, is the same fact in one glance.
 */
const COVERAGE = [
  { id:'heart', name:'Heart rate',  on:true,  note:'From the camera.' },
  { id:'move',  name:'Movement',    on:true,  note:'From the phone.' },
  { id:'sweat', name:'Sweat',       on:false, note:'Patch only.' },
  { id:'temp',  name:'Skin temperature', on:false, note:'Patch only.' },
]

export function SignalCoverage({ className }) {
  return (
    <ul className={cn('m-0 grid list-none grid-cols-2 gap-3 p-0 lg:grid-cols-4 lg:gap-4', className)}>
      {COVERAGE.map(s => (
        <li key={s.id}
          className={cn('rounded-panel border p-4',
            s.on ? 'border-rule bg-card' : 'border-dashed border-ruling bg-transparent')}>
          <div className={cn(!s.on && 'opacity-45')}>
            <SignalTrace kind={s.id}/>
          </div>
          <p className={cn('mt-2 font-display text-ui font-bold',
            s.on ? 'text-ink' : 'text-ink-3')}>{s.name}</p>
          <p className={cn('mt-0.5 text-fine', s.on ? 'text-accent' : 'text-ink-3')}>{s.note}</p>
        </li>
      ))}
    </ul>
  )
}

/* ── Screens for the four-step guide ──────────────────────────────────────
 * These are drawn at real device points and scaled by the phone frame around
 * them, the same contract PhoneApp works to. A screenshot would have been
 * faster and would be wrong the first time the app changed.
 */
const F_TITLE = { margin:0, fontFamily:'Quicksand, sans-serif', fontWeight:700,
  fontSize:30, letterSpacing:'-0.02em', color:INK }
const F_SUB = { margin:'8px 0 0', fontFamily:'Chivo, sans-serif', fontSize:17, color:INK2 }

function Pad() {
  return (
    <div style={{ padding:'0 28px' }}>
      <p style={F_TITLE}>Cover the camera.</p>
      <p style={F_SUB}>Rear lens and flash, one finger.</p>
      <svg viewBox="0 0 240 190" style={{ marginTop:26, width:'100%', display:'block' }} aria-hidden>
        <rect x="52" y="14" width="136" height="162" rx="30" fill={MIST} stroke={INK} strokeWidth="2.4"/>
        <rect x="70" y="32" width="86" height="86" rx="24" fill={CARD} stroke={INK2} strokeWidth="2"/>
        <circle cx="94" cy="56" r="15" fill="none" stroke={INK2} strokeWidth="2"/>
        <circle cx="132" cy="94" r="15" fill="none" stroke={INK2} strokeWidth="2"/>
        <circle cx="94" cy="94" r="9" fill={ACCENT}/>
        <circle cx="132" cy="56" r="7" fill={WASH} stroke={INK2} strokeWidth="1.6"/>
        <ellipse cx="116" cy="76" rx="54" ry="44" fill={WASH} stroke={INK} strokeWidth="2.6" opacity="0.92"/>
        <path d="M62,150 C62,120 76,100 106,92 L184,92 C176,124 160,146 138,158 Z"
          fill={MIST} stroke={INK} strokeWidth="2.4" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}

function Still() {
  return (
    <div style={{ padding:'0 28px' }}>
      <p style={F_TITLE}>Hold still.</p>
      <p style={F_SUB}>Thirty seconds. Rest your hand.</p>
      <div style={{ marginTop:24, borderRadius:16, background:INK, padding:'22px 18px' }}>
        <svg viewBox="0 0 300 92" style={{ width:'100%', display:'block' }} aria-hidden>
          <path d="M0 58 L28 58 L36 22 L44 80 L52 58 L90 58 L118 58 L126 22 L134 80 L142 58
                   L180 58 L208 58 L216 22 L224 80 L232 58 L268 58 L296 58"
            fill="none" stroke="#3ecf9a" strokeWidth="3.4" strokeLinecap="round"
            strokeLinejoin="round" className="mm-trace"/>
        </svg>
        <p style={{ margin:'14px 0 0', fontFamily:'Chivo Mono, monospace', fontSize:17, color:'#c2d7ca' }}>
          72 bpm · signal good</p>
      </div>
    </div>
  )
}

function Say() {
  return (
    <div style={{ padding:'0 28px' }}>
      <p style={F_TITLE}>Say one sentence.</p>
      <p style={F_SUB}>Anything. The words are not kept.</p>
      <div style={{ marginTop:28, display:'flex', alignItems:'flex-end', gap:5, height:120 }}>
        {[22, 48, 74, 96, 64, 108, 82, 54, 90, 116, 70, 44, 86, 58, 30, 66].map((v, i) => (
          <span key={i} style={{ flex:1, height:v, borderRadius:3,
            background: i % 3 === 0 ? BEAM : ACCENT, opacity: 0.55 + (v / 240) }}/>
        ))}
      </div>
      <p style={{ margin:'16px 0 0', fontFamily:'Chivo Mono, monospace', fontSize:16, color:INK3 }}>
        15s · listening</p>
    </div>
  )
}

function Got() {
  return (
    <div style={{ padding:'0 28px' }}>
      <p style={F_TITLE}>Your score.</p>
      <p style={F_SUB}>With how sure it is.</p>
      <div style={{ marginTop:26, borderRadius:16, background:CARD, border:`1px solid ${RULE}`,
        padding:'24px 20px' }}>
        <p style={{ margin:0, fontFamily:'Chivo Mono, monospace', fontSize:64, lineHeight:1, color:INK }}>38</p>
        <p style={{ margin:'6px 0 0', fontFamily:'Chivo, sans-serif', fontSize:16, color:INK3 }}>
          out of 100</p>
        <div style={{ marginTop:22, height:12, borderRadius:999, background:MIST, position:'relative' }}>
          <span style={{ position:'absolute', left:'22%', width:'26%', top:0, bottom:0,
            borderRadius:999, background:ACCENT }}/>
        </div>
        <p style={{ margin:'10px 0 0', fontFamily:'Chivo, sans-serif', fontSize:16, color:INK2 }}>
          Somewhere in the green band.</p>
      </div>
    </div>
  )
}

const SCREENS = { pad:Pad, still:Still, say:Say, got:Got }

export function StepScreen({ kind }) {
  const S = SCREENS[kind] || Pad
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%',
      justifyContent:'center', background:'#f7faf8' }}>
      <S/>
    </div>
  )
}
