import React from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { SCORE } from '../lib/terms'
import { cn } from '../lib/utils'

const INK = '#0d2b1e'      /* ink */
const INK3 = '#426a58'     /* ink-3: 5.33 on paper, 5.61 on card */
const RULE = '#c2d7ca'     /* rule */
const RULING = '#93b2a1'   /* ruling */
const PAPER = '#f7faf8'
const CARD = '#ffffff'
const MIST = '#e3ede7'
const AQUA = '#edf7f7'
const AQUA2 = '#cee8ea'
const BEAM = '#1d8fb0'  /* beam: 3.20 on paper, so graphics only */
const ACCENT = '#157446'   /* accent */

// Footprint in mm; the plates, the ruler and the inset are all scaled from these.
const MM_LONG = 54
const MM_CROSS = 36

const f = n => Number(n.toFixed(2))

// Superellipse; k is handle length over radius, and 0.66 gives slightly straighter sides than an ellipse.
function oval(cx, cy, a, b, k = 0.66) {
  const hx = a * k, hy = b * k
  return `M${f(cx)} ${f(cy - b)}`
    + `C${f(cx + hx)} ${f(cy - b)} ${f(cx + a)} ${f(cy - hy)} ${f(cx + a)} ${f(cy)}`
    + `C${f(cx + a)} ${f(cy + hy)} ${f(cx + hx)} ${f(cy + b)} ${f(cx)} ${f(cy + b)}`
    + `C${f(cx - hx)} ${f(cy + b)} ${f(cx - a)} ${f(cy + hy)} ${f(cx - a)} ${f(cy)}`
    + `C${f(cx - a)} ${f(cy - hy)} ${f(cx - hx)} ${f(cy - b)} ${f(cx)} ${f(cy - b)}Z`
}

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
            <text x={f(x)} y={f(cy + cfg.chanDy)} textAnchor="middle"
              fontSize={f(cfg.chanSize)} fontWeight="700" fill={INK}>{j + 1}</text>
          </g>
        )
      })}
    </>
  )
}

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
    spec:'Charging slot in the side',
    body:'The shell closes the stack. Charging runs through a slot in its side.' },
  { id:'radio', title:'Radio', face:AQUA, wall:MIST, art:radioArt,
    spec:'Bluetooth Low Energy',
    body:'The radio sends readings to the phone over Bluetooth Low Energy.' },
  { id:'board', title:'Board', face:MIST, wall:RULE, art:boardArt,
    spec:'Four signals in, one score out',
    body:`The board turns four signals into one ${SCORE}, on the patch itself.` },
  { id:'sense', title:'Sensing', face:PAPER, wall:MIST, art:senseArt,
    spec:'4 signals, 1 reading a second',
    body:'The sensing layer reads four signals off the skin, once a second, all day.' },
  { id:'skin', title:'Skin side', face:AQUA2, wall:RULE, art:skinArt,
    spec:`${MM_LONG} by ${MM_CROSS} mm against the arm`,
    body:'The skin side sits against the outer upper arm. All four signals read through it.' },
]

const LAST = LAYERS.length - 1

// u is px per mm and fore the cross-axis foreshortening. open and closed are the plate pitch at each end
// of the travel; closed is less than the plate depth, so the assembled stack overlaps.
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

const WIDE = build({ w:760, u:8, fore:0.4, wall:9, open:126, closed:60,
  cx:234, top:10, labelSize:15, specSize:12, keySize:12, chanSize:14, chanDy:-32,
  lead:26, maxW:820, rulerNum:11, rulerCap:13, minor:5, major:9, spec:true })

const NARROW = build({ w:330, u:2.9, fore:0.4, wall:6, open:62, closed:36,
  cx:90, top:6, labelSize:13, specSize:0, keySize:10.5, chanSize:11, chanDy:-13,
  lead:11, maxW:400, rulerNum:10.5, rulerCap:11, minor:4, major:7, spec:false })

/* input.css --ease-out in array form, same as ui/motion.jsx. */
const EASE = [0.23, 1, 0.32, 1]

const CHAN = SENSOR_ORDER.map((id, i) => `${i + 1} ${SENSORS[id].name} in ${SENSORS[id].unit}`)
  .join(', ')

const ALT = 'An exploded drawing of the MindMap patch, five layers of one oval. '
  + `${MM_LONG} mm along the arm, ${MM_CROSS} mm across. `
  + 'Outside in: shell with charging slot, radio, board, sensing layer, skin side. '
  + `Sensing layer signals: ${CHAN}. `
  + `A millimetre ruler under the bottom plate runs 0 to ${MM_LONG} mm. `
  + 'Ticked every 5 mm, numbered every 10.'

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
      <g fontSize={f(rulerNum)} fill={INK3}>
        {majors.map(mm => (
          <text key={mm} x={f(at(mm))} y={f(numY)}
            textAnchor={mm === 0 ? 'start' : 'middle'}>{mm}</text>
        ))}
      </g>
      <text x={f((x0 + x1) / 2)} y={f(capY)} textAnchor="middle"
        fontSize={f(cfg.rulerCap || rulerNum)} fill={INK3}>
        {MM_LONG} mm along the arm
      </text>
    </g>
  )
}

function Layer({ layer, i, t, cfg, hatch }) {
  const cy = cfg.cys[i]
  // Travel is measured from the last plate, which stays put, so the ruler under it does not move.
  const y = useTransform(t, [0, 1], [(i - LAST) * (cfg.closed - cfg.open), 0])
  const { cx, a, b, wall, fore, labelX, labelSize, specSize, keySize } = cfg
  const last = i === LAST
  const isSense = layer.id === 'sense'
  const specY = cy + labelSize * 1.4
  const keyTop = cfg.spec ? specY + keySize * 1.55 : cy + keySize * 1.6
  return (
    <motion.g style={{ y }}>
      <path d={oval(cx, cy + wall, a, b)} fill={layer.wall} stroke={RULING} strokeWidth="1.3"/>
      <path d={oval(cx, cy, a, b)} fill={layer.face} stroke={RULING} strokeWidth="1.6"/>
      {layer.art({ cx, cy, a, b, hatch, fore, cfg })}
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
            <rect x={f(labelX)} y={f(ky - keySize * 0.72)} width="3" height={f(keySize * 0.84)}
              rx="1.5" fill={s.glow}/>
            <text x={f(labelX + 9)} y={f(ky)} fontSize={f(keySize)} fill={INK3}>
              <tspan fontWeight="700" fill={INK}>{j + 1}</tspan>
              <tspan dx="4">{s.name}, {s.unit}</tspan>
            </text>
          </g>
        )
      })}
      {last && <Ruler cfg={cfg}/>}
    </motion.g>
  )
}

// t is openness, 0 closed to 1 separated. The figure rests at 1, the state the viewBox is sized for.
function Stack({ shut, cfg }) {
  const reduced = useReducedMotion()
  const t = useMotionValue(1)
  React.useEffect(() => {
    const run = animate(t, shut ? 0 : 1, reduced ? { duration: 0 } : { duration: 0.5, ease: EASE })
    return () => run.stop()
  }, [shut, reduced, t])
  // Per-instance pattern ids, so a second figure's defs do not collide with the first.
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
      aria-label={`The patch seen from above on the outer upper arm, with its long axis along the arm. ${MM_LONG} mm along the arm, ${MM_CROSS} mm across. Both dimension lines are ticked every 5 mm.`}
      className="block h-auto w-full" style={{ maxWidth: IN.w }}>
      <path d="M42 -6C36 56 40 150 48 250L162 250C170 150 174 56 168 -6Z"
        fill={MIST} stroke={RULING} strokeWidth="1.4"/>
      <ellipse cx={cx} cy={cy} rx={f(rx)} ry={f(ry)} fill={CARD} stroke={INK} strokeWidth="1.6"/>
      <ellipse cx={cx} cy={cy} rx={f(rx * 0.74)} ry={f(ry * 0.82)} fill="none"
        stroke={RULE} strokeWidth="1"/>
      <circle cx={cx} cy={cy} r="5" fill={ACCENT}/>
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
      <g fontSize={size} fill={INK3}>
        <text x={f(dimX + 10)} y={f(cy - 1)}>{MM_LONG} mm</text>
        <text x={f(dimX + 10)} y={f(cy + size + 2)} fontSize={f(size * 0.84)}>along the arm</text>
        <text x={cx} y={f(dimY + size * 1.5)} textAnchor="middle">{MM_CROSS} mm across</text>
      </g>
    </svg>
  )
}

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

export function PatchStack({ className, caption, brief = false }) {
  const [shut, setShut] = React.useState(false)
  const [more, setMore] = React.useState(false)
  const narrow = useNarrow()
  const cfg = narrow ? NARROW : WIDE
  const show = !brief && (!narrow || more)
  return (
    <div className={cn('min-w-0', className)}>
      <figure className="m-0">
        <div className="overflow-x-clip">
          <Stack shut={shut} cfg={cfg}/>
        </div>

        <button type="button" onClick={() => setShut(v => !v)} aria-pressed={shut}
          className="mt-4 inline-flex min-h-[44px] items-center border-b-2 border-accent/35
            font-display text-ui font-medium text-accent
            hoverOnly:border-accent hoverOnly:text-accent-ink">
          {shut ? 'Separate the layers' : 'Close the stack'}
        </button>

        {show && (
          <div className="mt-5 flex flex-wrap items-start gap-x-6 gap-y-3">
            <div className="min-w-0 max-w-full shrink-0 basis-[232px]"><ArmInset/></div>
            <p className="note m-0 max-w-[34ch]">
              The patch is {MM_LONG} by {MM_CROSS} mm. It sits on the outer upper arm, with its long side along the arm.
            </p>
          </div>
        )}

        <figcaption className="note mt-4">
          {caption ? `${caption} ` : ''}An exploded drawing of the patch layers.
        </figcaption>
      </figure>

      {narrow && !brief && (
        <button type="button" onClick={() => setMore(v => !v)} aria-expanded={more}
          aria-controls="patchstack-detail"
          className="mt-4 inline-flex min-h-[44px] items-center border-b-2 border-accent/35
            font-display text-ui font-medium text-accent
            hoverOnly:border-accent hoverOnly:text-accent-ink">
          {more ? 'Hide the layer notes' : 'Show the layer notes'}
        </button>
      )}

      {show && (
      <dl id="patchstack-detail" className="m-0 mt-5">
        {LAYERS.map(l => (
          <div key={l.id} className="border-t border-rule py-3">
            <dt className="font-display text-ui font-bold leading-tight text-ink">{l.title}</dt>
            <dd className="m-0 mt-1 max-w-[56ch] text-note text-ink-2">{l.body}</dd>
            {l.id === 'sense' && (
              <dd className="m-0 mt-2">
                <ul className="m-0 list-none p-0">
                  {SENSOR_ORDER.map((id, j) => {
                    const s = SENSORS[id]
                    return (
                      <li key={id} className="flex items-start gap-2.5 py-1">
                        <span aria-hidden className="mt-[0.34em] h-4 w-[3px] shrink-0 rounded-bar"
                          style={{ background: s.glow }}/>
                        <p className="m-0 min-w-0 text-note text-ink-2">
                          <span className="block">
                            <b className="font-display font-bold text-ink">
                              {j + 1} {s.name}
                            </b>
                            <span className="ml-1.5 text-fine text-ink-3">{s.unit}</span>
                          </span>
                          <span className="block">{s.short}</span>
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
      )}

      <p className="note mt-4 max-w-[56ch]">
        Movement is not added to the {SCORE}. The app only uses it to decide when the other three signals count.
      </p>
    </div>
  )
}
