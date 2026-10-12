import React from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { ScrollScene } from '../ui/motion'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { SCORE } from '../lib/terms'
import { cn } from '../lib/utils'

/* The exploded patch for the landing page: five layers of ONE oval, separated
 * along a single axis, each with a leader to its label.
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
const INK3 = '#3c6a74'     /* ink-3 */
const RULE = '#bed6da'     /* rule */
const RULING = '#8eb0b6'   /* ruling */
const PAPER = '#f5fafa'
const CARD = '#ffffff'
const MIST = '#dfecee'
const AQUA = '#edf7f7'
const AQUA2 = '#cee8ea'
const BEAM = '#1d8fb0'     /* beam: 3.20 on paper, so a graphic and never a word */
const ACCENT = '#0a6e68'   /* accent */

/* The settled footprint, in millimetres. Every plate in the figure and the
   orientation inset are scaled off these two numbers, so the drawing cannot
   drift from the stated dimension. */
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
   claimed. The hidden widths are stated in the list below, not here, because
   sixteen dots at this size is mush. */
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

/* The four channels, one flat SENSORS colour each, spaced along the long axis.
   Every mark gets an ink ring as well, so colour is never the only cue. */
function senseArt({ cx, cy, a, b }) {
  return (
    <>
      {SENSOR_ORDER.map((id, j) => {
        const x = cx + (j - 1.5) * (a * 0.42)
        const r = b * 0.3
        return (
          <g key={id}>
            <circle cx={f(x)} cy={f(cy)} r={f(r * 1.5)} fill={CARD} stroke={RULING} strokeWidth="1"/>
            <circle cx={f(x)} cy={f(cy)} r={f(r)} fill={SENSORS[id].glow}/>
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

const LAYERS = [
  { id:'shell', title:'Shell', face:CARD, wall:MIST, art:shellArt,
    body:'The oval that closes the stack. Charging runs through a slot in its side.' },
  { id:'radio', title:'Radio', face:AQUA, wall:MIST, art:radioArt,
    body:'Bluetooth Low Energy to the phone.' },
  { id:'board', title:'Board', face:MIST, wall:RULE, art:boardArt,
    body:`Readings become z-scores against your own fourteen-day baseline. The four z-scores then run through a 4-16-10-1 network on the patch itself, which returns one ${SCORE}.` },
  { id:'sense', title:'Sensing', face:PAPER, wall:MIST, art:senseArt,
    body:'Four channels off the skin, sampled once a second, all day.' },
  { id:'skin', title:'Skin interface', face:AQUA2, wall:RULE, art:skinArt,
    body:'The face that sits against the outer upper arm. All four channels read through it.' },
]

const MID = (LAYERS.length - 1) / 2

/* ---- geometry ----
 * Both variants come out of the same arithmetic: `u` is px per millimetre and
 * `fore` is the foreshortening of the cross-arm direction under the tilt, so a
 * plate is always MM_LONG by MM_CROSS and nothing is hand-tuned.
 * `open` and `closed` are the pitch between plate centres at the two ends of
 * the scroll; `closed` is deliberately short of the plate depth, because an
 * assembled stack overlaps. Labels travel with their own plate, which is why
 * `closed` still has to clear the label's own line height. */
function build({ w, u, fore, wall, open, closed, cx, top, labelSize, lead, maxW }) {
  const a = (MM_LONG * u) / 2
  const b = (MM_CROSS * u * fore) / 2
  const cys = LAYERS.map((_, i) => top + b + i * open)
  const dimY = cys[cys.length - 1] + b + wall + labelSize * 1.7
  return {
    w, u, fore, a, b, wall, cx, open, closed, cys, labelSize, maxW, dimY,
    leadX: cx + a + lead,
    labelX: cx + a + lead + 12,
    h: Math.ceil(dimY + labelSize * 1.5 + 10),
  }
}

/* 760 wide at a 820px cap renders the 15px labels at 15 to 16px on any column
   a landing page gives this. */
const WIDE = build({ w:760, u:8, fore:0.4, wall:9, open:126, closed:60,
  cx:234, top:10, labelSize:15, lead:26, maxW:820 })

/* Below sm the plate shrinks and the label column narrows to the longest
   title, "Skin interface". Labels stay beside the plates rather than under
   them: under them, the closed state could not compress at all without a
   label landing on the next plate. */
const NARROW = build({ w:330, u:3.3, fore:0.4, wall:7, open:76, closed:44,
  cx:100, top:8, labelSize:13.5, lead:16, maxW:400 })

/* Zero rotation: ScrollScene is here for its sprung scroll progress and its
   reduced-motion resting value, not for a tilt. A real rotateX would carry the
   SVG label text with it. */
const FLAT = { rotateX:0, rotateZ:0, z:0 }

/* input.css --ease-out in array form, same as ui/motion.jsx. */
const EASE = [0.23, 1, 0.32, 1]

const ALT = 'An exploded drawing of the MindMap patch: five layers of one oval '
  + '54 mm along the arm by 36 mm across it, separated along a single axis. From the outside in, '
  + 'the shell with the charging slot in its side, the radio, the board, the sensing layer '
  + 'carrying the heart, sweat, temperature and movement channels, and the skin interface that '
  + 'sits against the outer upper arm.'

/* Dimension line with arrowheads and witness lines, mono label under it. The
   long axis is the one direction the tilt does not foreshorten, so it is the
   only one that can carry a dimension on this view honestly; the cross
   dimension is on the plan inset instead. */
function Dim({ x1, x2, y, from, label, size }) {
  const t = size * 0.34
  return (
    <g>
      <g fill="none" stroke={INK3} strokeWidth="1">
        <line x1={f(x1)} y1={f(from)} x2={f(x1)} y2={f(y + size * 0.5)}/>
        <line x1={f(x2)} y1={f(from)} x2={f(x2)} y2={f(y + size * 0.5)}/>
        <line x1={f(x1)} y1={f(y)} x2={f(x2)} y2={f(y)}/>
        <path d={`M${f(x1)} ${f(y)}l${f(size * 0.6)} ${f(-t)}M${f(x1)} ${f(y)}l${f(size * 0.6)} ${f(t)}`}/>
        <path d={`M${f(x2)} ${f(y)}l${f(-size * 0.6)} ${f(-t)}M${f(x2)} ${f(y)}l${f(-size * 0.6)} ${f(t)}`}/>
      </g>
      <text x={f((x1 + x2) / 2)} y={f(y + size * 1.45)} textAnchor="middle"
        className="font-mono" fontSize={f(size)} fill={INK3}>{label}</text>
    </g>
  )
}

function Layer({ layer, i, t, cfg, hatch }) {
  const cy = cfg.cys[i]
  /* The plate rests at its separated position and travels UP or DOWN toward
     the middle layer as the stack closes, so the figure never needs to know
     where the viewport is. */
  const y = useTransform(t, [0, 1], [(i - MID) * (cfg.closed - cfg.open), 0])
  const { cx, a, b, wall, fore } = cfg
  const last = i === LAYERS.length - 1
  return (
    <motion.g style={{ y }}>
      <path d={oval(cx, cy + wall, a, b)} fill={layer.wall} stroke={RULING} strokeWidth="1.3"/>
      <path d={oval(cx, cy, a, b)} fill={layer.face} stroke={RULING} strokeWidth="1.6"/>
      {layer.art({ cx, cy, a, b, hatch, fore })}
      <line x1={f(cx + a)} y1={f(cy)} x2={f(cfg.leadX)} y2={f(cy)} stroke={RULING} strokeWidth="1"/>
      <circle cx={f(cx + a)} cy={f(cy)} r="2.4" fill={RULING}/>
      <text x={f(cfg.labelX)} y={f(cy + cfg.labelSize * 0.36)} className="font-display"
        fontSize={f(cfg.labelSize)} fontWeight="700" fill={INK}>{layer.title}</text>
      {last && <Dim x1={cx - a} x2={cx + a} y={cfg.dimY} from={cy + b + wall + 4}
        size={cfg.labelSize * 0.84} label={`${MM_LONG} mm along the arm`}/>}
    </motion.g>
  )
}

/* `t` is openness, 0 closed and 1 separated, and it has exactly one writer at
   a time: the scroll progress while the reader has not touched the button, and
   a timed animation once they have. One value rather than two mechanisms
   writing the same transform. */
function Stack({ progress, reduced, held, cfg }) {
  const t = useMotionValue(1)
  React.useEffect(() => {
    if (held !== null) {
      const run = animate(t, held ? 1 : 0, reduced ? { duration: 0 } : { duration: 0.5, ease: EASE })
      return () => run.stop()
    }
    t.set(progress.get())
    return progress.on('change', v => t.set(v))
  }, [held, progress, reduced, t])
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
   dashed line is the arm's own axis, and the oval's long axis lies on it. */
const IN = { w:300, h:216, u:2.6, cx:105, cy:100 }

function ArmInset() {
  const rx = (MM_CROSS * IN.u) / 2
  const ry = (MM_LONG * IN.u) / 2
  const { cx, cy } = IN
  const size = 12
  const dimX = cx + rx + 30
  const dimY = cy + ry + 16
  return (
    <svg viewBox={`0 0 ${IN.w} ${IN.h}`} role="img"
      aria-label={`The patch in plan on the outer upper arm, long axis parallel to the arm, ${MM_LONG} mm along the arm by ${MM_CROSS} mm across it`}
      className="block h-auto w-full" style={{ maxWidth: IN.w }}>
      {/* The limb is the one shape here that is drawn rather than calculated:
          an arm has no arithmetic. It only has to be wider than the plate. */}
      <path d="M42 -6C36 56 40 140 48 222L162 222C170 140 174 56 168 -6Z"
        fill={MIST} stroke={RULING} strokeWidth="1.4"/>
      <ellipse cx={cx} cy={cy} rx={f(rx)} ry={f(ry)} fill={CARD} stroke={INK} strokeWidth="1.6"/>
      <ellipse cx={cx} cy={cy} rx={f(rx * 0.74)} ry={f(ry * 0.82)} fill="none"
        stroke={RULE} strokeWidth="1"/>
      <circle cx={cx} cy={cy} r="5" fill={ACCENT}/>
      {/* Centre line last, over the part: it is the arm's axis and the oval's
          long axis at once, which is the whole point of this view. */}
      <line x1={cx} y1="2" x2={cx} y2="212" stroke={RULING} strokeWidth="1" strokeDasharray="7 5"/>

      <g fill="none" stroke={INK3} strokeWidth="1">
        <line x1={f(cx + rx)} y1={f(cy - ry)} x2={f(dimX + 6)} y2={f(cy - ry)}/>
        <line x1={f(cx + rx)} y1={f(cy + ry)} x2={f(dimX + 6)} y2={f(cy + ry)}/>
        <line x1={f(dimX)} y1={f(cy - ry)} x2={f(dimX)} y2={f(cy + ry)}/>
        <path d={`M${f(dimX)} ${f(cy - ry)}l-4 7M${f(dimX)} ${f(cy - ry)}l4 7`}/>
        <path d={`M${f(dimX)} ${f(cy + ry)}l-4 -7M${f(dimX)} ${f(cy + ry)}l4 -7`}/>
        <line x1={f(cx - rx)} y1={f(cy + ry)} x2={f(cx - rx)} y2={f(dimY + 6)}/>
        <line x1={f(cx + rx)} y1={f(cy + ry)} x2={f(cx + rx)} y2={f(dimY + 6)}/>
        <line x1={f(cx - rx)} y1={f(dimY)} x2={f(cx + rx)} y2={f(dimY)}/>
        <path d={`M${f(cx - rx)} ${f(dimY)}l7 -4M${f(cx - rx)} ${f(dimY)}l7 4`}/>
        <path d={`M${f(cx + rx)} ${f(dimY)}l-7 -4M${f(cx + rx)} ${f(dimY)}l-7 4`}/>
      </g>
      <g className="font-mono" fontSize={size} fill={INK3}>
        <text x={f(dimX + 10)} y={f(cy - 1)}>{MM_LONG} mm</text>
        <text x={f(dimX + 10)} y={f(cy + size + 2)} fontSize={f(size * 0.84)}>along the arm</text>
        <text x={cx} y={f(dimY + size * 1.5)} textAnchor="middle">{MM_CROSS} mm across</text>
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
  /* null means the scroll drives the stack. Once the reader presses the
     button they own it, and the button keeps working either way. */
  const [held, setHeld] = React.useState(null)
  const narrow = useNarrow()
  const cfg = narrow ? NARROW : WIDE
  const shut = held === false
  return (
    <div className={cn('min-w-0', className)}>
      <figure className="m-0">
        {/* clip="x" is the house guard: nothing here paints past its box, but
            the clip costs nothing and the page sets overflow-x: clip anyway. */}
        <ScrollScene clip="x" perspective={1200} restAt={1} narrow={1} from={FLAT} to={FLAT}>
          {({ progress, reduced }) => (
            <Stack progress={progress} reduced={reduced} held={held} cfg={cfg}/>
          )}
        </ScrollScene>

        <button type="button" onClick={() => setHeld(shut)}
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
                  {SENSOR_ORDER.map(id => {
                    const s = SENSORS[id]
                    return (
                      <li key={id} className="flex items-start gap-3 py-1.5">
                        {/* Colour identifies the channel on the drawing and in
                            this bar. It never touches the words. */}
                        <span aria-hidden className="mt-[0.34em] h-4 w-[3px] shrink-0 rounded-bar"
                          style={{ background: s.glow }}/>
                        <p className="m-0 min-w-0 text-sec text-ink-2">
                          <b className="font-display font-bold text-ink">{s.name}.</b> {s.short}
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
