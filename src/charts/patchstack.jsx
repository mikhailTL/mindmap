import React from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { SCORE } from '../lib/terms'
import { cn } from '../lib/utils'

/* The exploded patch: five layers of ONE oval, separated along a single axis,
 * each with a leader to its label.
 *
 * WHAT CHANGED, AND WHY.
 *
 * 1. THE FOUR CHANNELS ARE NAMED ON THE DRAWING. The sensing layer was four
 *    coloured circles and nothing else, so the figure asked the reader to
 *    carry a colour down to the table below it. Each channel now carries a
 *    numbered callout on the plate and a keyed line in the label column that
 *    gives its name and its unit. Colour, a digit, a name and a unit: four
 *    carriers, so the figure survives greyscale and colour-vision deficiency.
 *
 * 2. THE DIMENSION IS A GRADUATED RULER, not one callout. The long axis was
 *    the figure's only stated size. It is a millimetre scale now, minor ticks
 *    every 5 mm and majored and numbered every 10, so any feature on the
 *    drawing can be measured off it rather than guessed at. The long axis is
 *    the one direction the tilt does not foreshorten, so it is the only one
 *    this view can graduate honestly; the cross dimension stays on the plan
 *    inset, which also carries graduations now.
 *
 * 3. THE BLANK SPACE IS GONE. The stack's openness used to be driven by the
 *    scroll position, and the viewBox reserves the height the SEPARATED stack
 *    needs. A figure below the fold therefore rendered collapsed into the
 *    middle of its own box, which left about 150px empty above the drawing at
 *    1280 and about 70px between the ruler and the button at 390, and no
 *    amount of scrolling fixed it in a full-page capture. Openness is now the
 *    reader's: the figure rests separated, which is the state the box is sized
 *    for, and the button is the only thing that closes it. The collapse is
 *    anchored on the bottom layer, so the ruler and the dimension never move.
 *
 * 4. EACH LABEL CARRIES A SPEC LINE at the wide size, where there were 180
 *    unused viewBox units to the right of the longest label. Every line is a
 *    settled fact, and nothing open joins them.
 *
 * Every claim here is a settled one. Battery, adhesive, electrode build, part
 * numbers, ingress rating, weight and cost are all open, so a layer that has
 * only an open fact is labelled by its FUNCTION and nothing else. No unit has
 * been built; the figcaption says so and no copy may imply otherwise.
 *
 * Drawing idiom follows charts/rainbow.jsx and charts/patch-parts.jsx: flat
 * opaque strokes, one fill per shape, no gradient, no blur, no partial-opacity
 * decoration. Token values are inlined as hex the way patch-parts.jsx does it,
 * because SVG attributes cannot take a Tailwind class. */

const INK = '#0b2b33'      /* ink */
const INK3 = '#3c6a74'     /* ink-3: 5.33 on paper, 5.61 on card */
const RULE = '#bed6da'     /* rule */
const RULING = '#8eb0b6'   /* ruling */
const PAPER = '#f5fafa'
const CARD = '#ffffff'
const MIST = '#dfecee'
const AQUA = '#edf7f7'
const AQUA2 = '#cee8ea'
const BEAM = '#1d8fb0'     /* beam: 3.20 on paper, so a graphic and never a word */
const ACCENT = '#0a6e68'   /* accent */

/* The settled footprint, in millimetres. Every plate in the figure, the
   millimetre ruler and the orientation inset are scaled off these two
   numbers, so the drawing cannot drift from the stated dimension. */
const MM_LONG = 54
const MM_CROSS = 36

const f = n => Number(n.toFixed(2))

/* One superellipse, used for every plate. Same construction as
   charts/patch-front.jsx, which does not export it; k is handle length as a
   fraction of the radius, and 0.66 keeps the sides a little straighter than a
   true ellipse without reading as a stadium. */
function oval(cx, cy, a, b, k = 0.66) {
  const hx = a * k, hy = b * k
  return `M${f(cx)} ${f(cy - b)}`
    + `C${f(cx + hx)} ${f(cy - b)} ${f(cx + a)} ${f(cy - hy)} ${f(cx + a)} ${f(cy)}`
    + `C${f(cx + a)} ${f(cy + hy)} ${f(cx + hx)} ${f(cy + b)} ${f(cx)} ${f(cy + b)}`
    + `C${f(cx - hx)} ${f(cy + b)} ${f(cx - a)} ${f(cy + hy)} ${f(cx - a)} ${f(cy)}`
    + `C${f(cx - a)} ${f(cy - hy)} ${f(cx - hx)} ${f(cy - b)} ${f(cx)} ${f(cy - b)}Z`
}

/* ---- the five layers, outside in, which is also top to bottom on screen ---- */

/* Charging slot at the LEFT extreme, not the right: the right extreme is where
   this layer's leader line starts. A port that does not break the outline is a
   sticker, so the slot straddles the silhouette. */
function shellArt({ cx, cy, a, b }) {
  return (
    <>
      <path d={oval(cx, cy, a * 0.88, b * 0.8)} fill="none" stroke={RULE} strokeWidth="1"/>
      <rect x={f(cx - a - a * 0.045)} y={f(cy - b * 0.22)} width={f(a * 0.09)} height={f(b * 0.44)}
        rx={f(b * 0.1)} fill={MIST} stroke={INK} strokeWidth="1.3"/>
      <rect x={f(cx - a - a * 0.016)} y={f(cy - b * 0.07)} width={f(a * 0.032)} height={f(b * 0.14)}
        rx="1.5" fill={RULING}/>
    </>
  )
}

/* Three open arcs off a module footprint. The arcs are elliptical, not
   circular, so they are foreshortened by the same amount as the plate. */
function radioArt({ cx, cy, a, b }) {
  const px = cx - a * 0.58
  const rings = [[0.14, 0.3], [0.22, 0.48], [0.3, 0.66]]
  return (
    <>
      <rect x={f(px - a * 0.1)} y={f(cy - b * 0.26)} width={f(a * 0.2)} height={f(b * 0.52)}
        rx={f(b * 0.1)} fill={CARD} stroke={INK} strokeWidth="1.3"/>
      <g fill="none" stroke={BEAM} strokeWidth="1.4" strokeLinecap="round">
        {rings.map(([kx, ky]) => {
          const rx = a * kx, ry = b * ky
          return <path key={kx}
            d={`M${f(px)} ${f(cy - ry)} A${f(rx)} ${f(ry)} 0 0 0 ${f(px)} ${f(cy + ry)}`}/>
        })}
      </g>
    </>
  )
}

/* Four channels in, one number out: the point of the board, drawn rather than
   claimed. The four inbound traces carry the channel colours, so this plate
   and the sensing plate under it read as the same four things. */
function boardArt({ cx, cy, a, b }) {
  const bw = a * 0.56, bh = b * 0.52
  const collect = cx - a * 0.06
  const out = cx + bw - a * 0.07
  return (
    <>
      <rect x={f(cx - bw)} y={f(cy - bh)} width={f(bw * 2)} height={f(bh * 2)}
        rx={f(b * 0.14)} fill={CARD} stroke={INK} strokeWidth="1.4"/>
      <g stroke={INK3} strokeWidth="1" strokeLinecap="round">
        {SENSOR_ORDER.map((id, j) => {
          const y = cy + (j - 1.5) * (bh * 0.56)
          return <line key={id} x1={f(cx - bw + a * 0.13)} y1={f(y)} x2={f(collect)} y2={f(y)}/>
        })}
        <line x1={f(collect)} y1={f(cy - bh * 0.84)} x2={f(collect)} y2={f(cy + bh * 0.84)}/>
        <line x1={f(collect)} y1={f(cy)} x2={f(out)} y2={f(cy)} strokeWidth="1.3"/>
      </g>
      {SENSOR_ORDER.map((id, j) => {
        const y = cy + (j - 1.5) * (bh * 0.56)
        return <rect key={id} x={f(cx - bw + a * 0.045)} y={f(y - b * 0.06)}
          width={f(a * 0.08)} height={f(b * 0.12)} rx="2" fill={SENSORS[id].glow}/>
      })}
      <circle cx={f(out)} cy={f(cy)} r={f(b * 0.12)} fill={ACCENT}/>
    </>
  )
}

/* The four channels, one flat SENSORS colour each, spaced along the long axis,
   each with an ink ring and a numbered callout keyed to the label column. The
   digit is what lets the figure be read without colour at all. */
function senseArt({ cx, cy, a, b, cfg }) {
  return (
    <>
      {SENSOR_ORDER.map((id, j) => {
        const x = cx + (j - 1.5) * (a * 0.42)
        const r = b * 0.3
        return (
          <g key={id}>
            <circle cx={f(x)} cy={f(cy)} r={f(r * 1.5)} fill={CARD} stroke={RULING} strokeWidth="1"/>
            <circle cx={f(x)} cy={f(cy)} r={f(r)} fill={SENSORS[id].glow}/>
            <line x1={f(x)} y1={f(cy + cfg.chanDy + 3)} x2={f(x)} y2={f(cy - r * 1.5 - 1.5)}
              stroke={RULING} strokeWidth="1"/>
            <text x={f(x)} y={f(cy + cfg.chanDy)} textAnchor="middle" className="font-mono"
              fontSize={f(cfg.chanSize)} fontWeight="700" fill={INK}>{j + 1}</text>
          </g>
        )
      })}
    </>
  )
}

/* The hatch covers the whole plate and is clipped by the plate path itself, so
   the texture cannot leak past the silhouette. Window drawn after it. */
function skinArt({ cx, cy, a, b, hatch, fore }) {
  return (
    <>
      <path d={oval(cx, cy, a, b)} fill={`url(#${hatch})`}/>
      <path d={oval(cx, cy, a * 0.72, b * 0.66)} fill="none" stroke={RULING}
        strokeWidth="1" strokeDasharray="5 5"/>
      <ellipse cx={f(cx)} cy={f(cy)} rx={f(a * 0.1)} ry={f(a * 0.1 * fore)}
        fill={CARD} stroke={INK} strokeWidth="1.4"/>
      <circle cx={f(cx)} cy={f(cy)} r={f(a * 0.035)} fill={ACCENT}/>
    </>
  )
}

/* `spec` is one settled fact per layer, drawn under the title at the wide size
   only: at the narrow size the label column is 105 units and holds a title and
   nothing else. Nothing open may join this list. */
const LAYERS = [
  { id:'shell', title:'Shell', face:CARD, wall:MIST, art:shellArt,
    spec:'Charging slot in the side',
    body:'The oval that closes the stack. Charging runs through a slot in its side.' },
  { id:'radio', title:'Radio', face:AQUA, wall:MIST, art:radioArt,
    spec:'Bluetooth Low Energy',
    body:'Bluetooth Low Energy to the phone.' },
  { id:'board', title:'Board', face:MIST, wall:RULE, art:boardArt,
    spec:'Four channels in, one score out',
    /* Cut from four lines to one: the baseline window and the network shape
       are the methods page's subject, not a patch drawing's. */
    body:`Turns the four channels into one ${SCORE}, on the patch itself.` },
  { id:'sense', title:'Sensing', face:PAPER, wall:MIST, art:senseArt,
    spec:'4 channels, 1 reading a second',
    body:'Four channels off the skin, sampled once a second, all day.' },
  { id:'skin', title:'Skin interface', face:AQUA2, wall:RULE, art:skinArt,
    spec:`${MM_LONG} by ${MM_CROSS} mm against the arm`,
    body:'The face that sits against the outer upper arm. All four channels read through it.' },
]

const LAST = LAYERS.length - 1

/* ---- geometry ----
 * Both variants come out of the same arithmetic: `u` is px per millimetre and
 * `fore` is the foreshortening of the cross-arm direction under the tilt, so a
 * plate is always MM_LONG by MM_CROSS and nothing is hand-tuned.
 * `open` and `closed` are the pitch between plate centres at the two ends of
 * the travel; `closed` is deliberately short of the plate depth, because an
 * assembled stack overlaps. The travel is anchored on the LAST plate, so the
 * ruler under it is static whatever the reader does. */
function build({ w, u, fore, wall, open, closed, cx, top, labelSize, specSize, keySize,
                 chanSize, chanDy, lead, maxW, rulerNum, rulerCap, minor, major, spec }) {
  const a = (MM_LONG * u) / 2
  const b = (MM_CROSS * u * fore) / 2
  const cys = LAYERS.map((_, i) => top + b + i * open)
  const rulerY = cys[LAST] + b + wall + labelSize * 1.2
  const numY = rulerY + major + rulerNum
  const capY = numY + rulerCap * 1.3
  return {
    w, u, fore, a, b, wall, cx, open, closed, cys, labelSize, specSize, keySize,
    chanSize, chanDy, maxW, rulerY, numY, capY, minor, major, rulerNum, spec,
    witnessFrom: cys[LAST] + b + wall + 4,
    leadX: cx + a + lead,
    labelX: cx + a + lead + 12,
    h: Math.ceil(capY + rulerCap * 0.6 + 6),
  }
}

/* 760 wide at an 820px cap renders the 15px labels at 15 to 16px on any column
   a landing page gives this. */
const WIDE = build({ w:760, u:8, fore:0.4, wall:9, open:126, closed:60,
  cx:234, top:10, labelSize:15, specSize:12, keySize:12, chanSize:14, chanDy:-32,
  lead:26, maxW:820, rulerNum:11, rulerCap:13, minor:5, major:9, spec:true })

/* Below sm the plate shrinks and the label column narrows to the longest
   title, "Skin interface". Labels stay beside the plates rather than under
   them: under them, the closed state could not compress at all without a
   label landing on the next plate. */
const NARROW = build({ w:330, u:3.3, fore:0.4, wall:7, open:76, closed:44,
  cx:100, top:8, labelSize:13, specSize:0, keySize:10.5, chanSize:11, chanDy:-13,
  lead:12, maxW:400, rulerNum:10.5, rulerCap:11, minor:4, major:7, spec:false })

/* input.css --ease-out in array form, same as ui/motion.jsx. */
const EASE = [0.23, 1, 0.32, 1]

const CHAN = SENSOR_ORDER.map((id, i) => `${i + 1} ${SENSORS[id].name} in ${SENSORS[id].unit}`)
  .join(', ')

const ALT = 'An exploded drawing of the MindMap patch: five layers of one oval '
  + `${MM_LONG} mm along the arm by ${MM_CROSS} mm across it, separated along a single axis. `
  + 'From the outside in, the shell with the charging slot in its side, the radio, the board, '
  + 'the sensing layer, and the skin interface that sits against the outer upper arm. '
  + `The sensing layer carries four numbered channels: ${CHAN}. `
  + `A millimetre ruler under the bottom plate runs 0 to ${MM_LONG} mm, ticked every 5 mm and `
  + 'numbered every 10.'

/* The millimetre ruler: the drawing's scale, not just its overall size. Minor
   ticks every 5 mm, majors numbered every 10, arrowheads and witness lines at
   the two extremes so it doubles as the overall dimension. It is drawn outside
   the travelling groups and anchored on the bottom plate, which never moves,
   so the figure's one piece of measurement furniture is always where the
   reader last saw it. */
function Ruler({ cfg }) {
  const { cx, a, rulerY, numY, capY, minor, major, rulerNum, witnessFrom } = cfg
  const x0 = cx - a, x1 = cx + a
  const at = mm => x0 + (mm / MM_LONG) * (a * 2)
  const minors = []
  for (let mm = 0; mm <= MM_LONG; mm += 5) minors.push(mm)
  const majors = [0, 10, 20, 30, 40, 50]
  const head = major * 0.72
  return (
    <g>
      <g fill="none" stroke={INK3} strokeWidth="1">
        {/* witness lines: the plate's two extremes carried down to the scale */}
        <line x1={f(x0)} y1={f(witnessFrom)} x2={f(x0)} y2={f(rulerY + major + 2)}/>
        <line x1={f(x1)} y1={f(witnessFrom)} x2={f(x1)} y2={f(rulerY + major + 2)}/>
        <line x1={f(x0)} y1={f(rulerY)} x2={f(x1)} y2={f(rulerY)}/>
        {/* inward arrowheads, so the scale reads as a dimension as well */}
        <path d={`M${f(x0)} ${f(rulerY)}l${f(head)} ${f(-head * 0.46)}M${f(x0)} ${f(rulerY)}l${f(head)} ${f(head * 0.46)}`}/>
        <path d={`M${f(x1)} ${f(rulerY)}l${f(-head)} ${f(-head * 0.46)}M${f(x1)} ${f(rulerY)}l${f(-head)} ${f(head * 0.46)}`}/>
        {minors.map(mm => (
          <line key={`m${mm}`} x1={f(at(mm))} y1={f(rulerY)} x2={f(at(mm))}
            y2={f(rulerY + minor)}/>
        ))}
        {majors.map(mm => (
          <line key={`M${mm}`} x1={f(at(mm))} y1={f(rulerY)} x2={f(at(mm))}
            y2={f(rulerY + major)} strokeWidth="1.3"/>
        ))}
        {/* the long-axis end, which is not on a ten */}
        <line x1={f(at(MM_LONG))} y1={f(rulerY)} x2={f(at(MM_LONG))} y2={f(rulerY + major)}
          strokeWidth="1.3"/>
      </g>
      <g className="font-mono" fontSize={f(rulerNum)} fill={INK3}>
        {majors.map(mm => (
          <text key={mm} x={f(at(mm))} y={f(numY)}
            textAnchor={mm === 0 ? 'start' : 'middle'}>{mm}</text>
        ))}
      </g>
      <text x={f((x0 + x1) / 2)} y={f(capY)} textAnchor="middle" className="font-mono"
        fontSize={f(cfg.rulerCap || rulerNum)} fill={INK3}>
        {MM_LONG} mm along the arm
      </text>
    </g>
  )
}

/* One layer: the plate, its depth wall, its art, its leader, its title, and at
   the wide size one settled spec line. The sensing layer also carries the
   channel key, because a numbered callout with nothing to key it to is worse
   than no callout. */
function Layer({ layer, i, t, cfg, hatch }) {
  const cy = cfg.cys[i]
  /* Travel is measured from the LAST plate, which stays put: the ruler and the
     overall dimension under it are then static in every state, and the figure
     never shows blank space under its own drawing. */
  const y = useTransform(t, [0, 1], [(i - LAST) * (cfg.closed - cfg.open), 0])
  const { cx, a, b, wall, fore, labelX, labelSize, specSize, keySize } = cfg
  const last = i === LAST
  const isSense = layer.id === 'sense'
  /* 1.4 of the label size, not 0.9: at 0.9 the spec line sat in the title's
     descenders. */
  const specY = cy + labelSize * 1.4
  const keyTop = cfg.spec ? specY + keySize * 1.55 : cy + keySize * 1.6
  return (
    <motion.g style={{ y }}>
      <path d={oval(cx, cy + wall, a, b)} fill={layer.wall} stroke={RULING} strokeWidth="1.3"/>
      <path d={oval(cx, cy, a, b)} fill={layer.face} stroke={RULING} strokeWidth="1.6"/>
      {layer.art({ cx, cy, a, b, hatch, fore, cfg })}
      {/* The long axis, on the plate the ruler measures. A centre line is what
          ties a dimension to the feature it dimensions. */}
      {last && (
        <line x1={f(cx - a - 8)} y1={f(cy)} x2={f(cx + a + 8)} y2={f(cy)} stroke={RULING}
          strokeWidth="1" strokeDasharray="11 3 2 3"/>
      )}
      <line x1={f(cx + a)} y1={f(cy)} x2={f(cfg.leadX)} y2={f(cy)} stroke={RULING} strokeWidth="1"/>
      <circle cx={f(cx + a)} cy={f(cy)} r="2.4" fill={RULING}/>
      <text x={f(labelX)} y={f(cy + labelSize * 0.36)} className="font-display"
        fontSize={f(labelSize)} fontWeight="700" fill={INK}>{layer.title}</text>
      {cfg.spec && (
        <text x={f(labelX)} y={f(specY)} fontSize={f(specSize)} fill={INK3}>{layer.spec}</text>
      )}
      {isSense && SENSOR_ORDER.map((id, j) => {
        const s = SENSORS[id]
        const ky = keyTop + j * keySize * 1.22
        return (
          <g key={id}>
            {/* the chip is the plate's colour and the digit is the plate's
                digit: two carriers for one mapping */}
            <rect x={f(labelX)} y={f(ky - keySize * 0.72)} width="3" height={f(keySize * 0.84)}
              rx="1.5" fill={s.glow}/>
            <text x={f(labelX + 9)} y={f(ky)} fontSize={f(keySize)} fill={INK3}>
              <tspan className="font-mono" fontWeight="700" fill={INK}>{j + 1}</tspan>
              <tspan dx="4">{s.name}, {s.unit}</tspan>
            </text>
          </g>
        )
      })}
      {last && <Ruler cfg={cfg}/>}
    </motion.g>
  )
}

/* `t` is openness, 0 closed and 1 separated. The figure RESTS at 1, which is
   the state the viewBox is sized for, and the reader's button is its only
   writer. It was scroll-driven, and a scroll-driven openness means a figure
   below the fold renders collapsed inside a box sized for the open state,
   which is where the blank space in this figure came from. */
function Stack({ shut, cfg }) {
  const reduced = useReducedMotion()
  const t = useMotionValue(1)
  React.useEffect(() => {
    const run = animate(t, shut ? 0 : 1, reduced ? { duration: 0 } : { duration: 0.5, ease: EASE })
    return () => run.stop()
  }, [shut, reduced, t])
  /* Pattern ids must be per-instance: two of these on one page and the second
     <defs> would silently lose to the first. */
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '')
  const hatch = `ps-hatch-${uid}`
  return (
    <svg viewBox={`0 0 ${cfg.w} ${cfg.h}`} role="img" aria-label={ALT}
      className="block h-auto w-full" style={{ maxWidth: cfg.maxW }}>
      <defs>
        <pattern id={hatch} width="7" height="7" patternTransform="rotate(45)"
          patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="7" stroke={RULING} strokeWidth="1"/>
        </pattern>
      </defs>
      {LAYERS.map((l, i) => (
        <Layer key={l.id} layer={l} i={i} t={t} cfg={cfg} hatch={hatch}/>
      ))}
    </svg>
  )
}

/* The orientation, in true plan rather than under the tilt, because this is
   the view that can carry both dimensions without lying about either. The
   dashed line is the arm's own axis, and the oval's long axis lies on it.
   Both dimension lines are graduated every 5 mm, so the inset carries a scale
   and not only two numbers. */
const IN = { w:300, h:238, u:2.6, cx:105, cy:100 }

function ArmInset() {
  const rx = (MM_CROSS * IN.u) / 2
  const ry = (MM_LONG * IN.u) / 2
  const { cx, cy, u } = IN
  const size = 12
  const dimX = cx + rx + 30
  const dimY = cy + ry + 16
  const fives = n => Array.from({ length: Math.floor(n / 5) + 1 }, (_, i) => i * 5)
  return (
    <svg viewBox={`0 0 ${IN.w} ${IN.h}`} role="img"
      aria-label={`The patch in plan on the outer upper arm, long axis parallel to the arm, ${MM_LONG} mm along the arm by ${MM_CROSS} mm across it. Both dimension lines are ticked every 5 mm.`}
      className="block h-auto w-full" style={{ maxWidth: IN.w }}>
      {/* The limb is the one shape here that is drawn rather than calculated:
          an arm has no arithmetic. It only has to be wider than the plate. */}
      <path d="M42 -6C36 56 40 150 48 250L162 250C170 150 174 56 168 -6Z"
        fill={MIST} stroke={RULING} strokeWidth="1.4"/>
      <ellipse cx={cx} cy={cy} rx={f(rx)} ry={f(ry)} fill={CARD} stroke={INK} strokeWidth="1.6"/>
      <ellipse cx={cx} cy={cy} rx={f(rx * 0.74)} ry={f(ry * 0.82)} fill="none"
        stroke={RULE} strokeWidth="1"/>
      <circle cx={cx} cy={cy} r="5" fill={ACCENT}/>
      {/* Centre lines last, over the part: the vertical one is the arm's axis
          and the oval's long axis at once, which is the whole point of this
          view, and the horizontal one is what the cross dimension measures. */}
      <g stroke={RULING} strokeWidth="1" strokeDasharray="11 3 2 3">
        <line x1={cx} y1="2" x2={cx} y2="232"/>
        <line x1={f(cx - rx - 10)} y1={cy} x2={f(cx + rx + 10)} y2={cy}/>
      </g>

      <g fill="none" stroke={INK3} strokeWidth="1">
        <line x1={f(cx + rx)} y1={f(cy - ry)} x2={f(dimX + 6)} y2={f(cy - ry)}/>
        <line x1={f(cx + rx)} y1={f(cy + ry)} x2={f(dimX + 6)} y2={f(cy + ry)}/>
        <line x1={f(dimX)} y1={f(cy - ry)} x2={f(dimX)} y2={f(cy + ry)}/>
        <path d={`M${f(dimX)} ${f(cy - ry)}l-4 7M${f(dimX)} ${f(cy - ry)}l4 7`}/>
        <path d={`M${f(dimX)} ${f(cy + ry)}l-4 -7M${f(dimX)} ${f(cy + ry)}l4 -7`}/>
        {/* graduations: every 5 mm on the long axis */}
        {fives(MM_LONG).map(mm => (
          <line key={`y${mm}`} x1={f(dimX - 3)} y1={f(cy - ry + mm * u)} x2={f(dimX + 3)}
            y2={f(cy - ry + mm * u)}/>
        ))}
        <line x1={f(cx - rx)} y1={f(cy + ry)} x2={f(cx - rx)} y2={f(dimY + 6)}/>
        <line x1={f(cx + rx)} y1={f(cy + ry)} x2={f(cx + rx)} y2={f(dimY + 6)}/>
        <line x1={f(cx - rx)} y1={f(dimY)} x2={f(cx + rx)} y2={f(dimY)}/>
        <path d={`M${f(cx - rx)} ${f(dimY)}l7 -4M${f(cx - rx)} ${f(dimY)}l7 4`}/>
        <path d={`M${f(cx + rx)} ${f(dimY)}l-7 -4M${f(cx + rx)} ${f(dimY)}l-7 4`}/>
        {/* and every 5 mm across it */}
        {fives(MM_CROSS).map(mm => (
          <line key={`x${mm}`} x1={f(cx - rx + mm * u)} y1={f(dimY - 3)}
            x2={f(cx - rx + mm * u)} y2={f(dimY + 3)}/>
        ))}
      </g>
      <g className="font-mono" fontSize={size} fill={INK3}>
        <text x={f(dimX + 10)} y={f(cy - 1)}>{MM_LONG} mm</text>
        <text x={f(dimX + 10)} y={f(cy + size + 2)} fontSize={f(size * 0.84)}>along the arm</text>
        <text x={cx} y={f(dimY + size * 1.5)} textAnchor="middle">{MM_CROSS} mm across</text>
        <text x={cx} y={f(dimY + size * 2.7)} textAnchor="middle" fontSize={f(size * 0.84)}>
          ticks every 5 mm</text>
      </g>
    </svg>
  )
}

/* Starts false and corrects on mount, the same way ui/motion.jsx does it, so a
   browser without matchMedia still gets a drawing. */
function useNarrow() {
  const [narrow, setNarrow] = React.useState(false)
  React.useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const mq = matchMedia('(max-width: 639px)')
    const sync = () => setNarrow(mq.matches)
    sync()
    mq.addEventListener?.('change', sync)
    return () => mq.removeEventListener?.('change', sync)
  }, [])
  return narrow
}

export function PatchStack({ className, caption }) {
  const [shut, setShut] = React.useState(false)
  const narrow = useNarrow()
  const cfg = narrow ? NARROW : WIDE
  return (
    <div className={cn('min-w-0', className)}>
      <figure className="m-0">
        {/* Nothing here paints past its box, but the clip costs nothing and
            the page sets overflow-x: clip anyway. */}
        <div className="overflow-x-clip">
          <Stack shut={shut} cfg={cfg}/>
        </div>

        <button type="button" onClick={() => setShut(v => !v)} aria-pressed={shut}
          className="mt-4 inline-flex min-h-[44px] items-center border-b-2 border-accent/35
            font-display text-ui font-medium text-accent
            hoverOnly:border-accent hoverOnly:text-accent-ink">
          {shut ? 'Separate the layers' : 'Close the stack'}
        </button>

        <div className="mt-6 flex flex-wrap items-start gap-x-8 gap-y-4">
          <div className="min-w-0 max-w-full shrink-0 basis-[300px]"><ArmInset/></div>
          <p className="note m-0 max-w-[34ch]">
            {MM_LONG} mm along the arm by {MM_CROSS} mm across it, worn on the outer upper arm with
            the long axis parallel to the arm.
          </p>
        </div>

        {/* The second sentence is not optional and is not behind the prop: a
            judge must never read this drawing as a photograph of a build. */}
        <figcaption className="note mt-5">
          {caption ? `${caption} ` : ''}Drawing of the intended build. No unit has been built.
        </figcaption>
      </figure>

      {/* A dl, not headings: another view wires this component in and this
          figure must not guess at the page's heading level. */}
      <dl className="m-0 mt-7">
        {LAYERS.map(l => (
          <div key={l.id} className="border-t border-rule py-4">
            <dt className="font-display text-row font-bold leading-tight text-ink">{l.title}</dt>
            <dd className="m-0 mt-1.5 max-w-[56ch] text-meta text-ink-2">{l.body}</dd>
            {l.id === 'sense' && (
              <dd className="m-0 mt-3">
                <ul className="m-0 list-none p-0">
                  {SENSOR_ORDER.map((id, j) => {
                    const s = SENSORS[id]
                    return (
                      <li key={id} className="flex items-start gap-3 py-1.5">
                        {/* The digit is the drawing's own callout number and
                            the bar is the drawing's own colour: two ways back
                            to the plate above. Neither touches the words. */}
                        <span aria-hidden className="mt-[0.34em] h-4 w-[3px] shrink-0 rounded-bar"
                          style={{ background: s.glow }}/>
                        <p className="m-0 min-w-0 text-sec text-ink-2">
                          <b className="font-display font-bold text-ink">
                            <span className="font-mono">{j + 1}</span> {s.name}
                          </b>
                          <span className="ml-1.5 font-mono text-fine text-ink-3">{s.unit}</span>
                          {'. '}{s.short}
                        </p>
                      </li>
                    )
                  })}
                </ul>
              </dd>
            )}
          </div>
        ))}
      </dl>

      <p className="note mt-4 max-w-[56ch]">
        Movement is not added to the {SCORE}. It gates the other three, so a hard run does not
        read as a hard day.
      </p>
    </div>
  )
}
