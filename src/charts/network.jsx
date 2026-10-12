import React from 'react'
import { useReducedMotion } from 'framer-motion'
import { ARCH, PARAM_COUNT, SIGNALS, Z_LIMIT, edge, edgeMax, reference, run } from '../signals/net'
import { SENSORS } from '../lib/sensors'
import { ScrollIn, RuleDraw } from '../ui/motion'
import { cn } from '../lib/utils'

/* The Mind Score network, drawn from the network itself.
 *
 * Nothing here is an illustration of the model: the edges are read out of the
 * fitted weights with edge()/edgeMax(), the nodes are lit by the activations
 * run() returns, and the big number is run().score. Change the weights and
 * this picture changes with them.
 *
 * The argument the figure exists to make is the third preset. Heart, sweat and
 * temperature are identical between "a hard day" and "the same body, during a
 * run"; only movement differs, and the score drops by 35 points. A weighted
 * sum cannot do that, which is why there is a network at all.
 */

/* Quoted from the header of src/signals/net-weights.js, which tools/net/train.py
 * rewrites whenever it refits. These four numbers cannot be imported, so if
 * that header ever disagrees with this line, that header is right. */
const FIT = { points: '483,521', mean: '0.014', p99: '0.074', worst: '1.246' }

/* The four demonstration days, in z-scores against the wearer's own baseline.
 * Order matters: "a hard day" and the run sit next to each other so the pair
 * can be clicked one after the other. */
const PRESETS = [
  { id: 'ordinary', label: 'An ordinary day', z: [0, 0, 0, 0] },
  { id: 'hard', label: 'A hard day', z: [1.8, 1.6, -1.2, 0] },
  { id: 'running', label: 'The same body, during a run', z: [1.8, 1.6, -1.2, 2.4] },
  { id: 'easy', label: 'An easy day', z: [-1.5, -1.2, 1, 0] },
]
const byId = id => PRESETS.find(p => p.id === id) || PRESETS[1]

/* The slider's domain is the z domain, so the words have to be the reading's
 * distance from the wearer's own usual rather than any absolute value. */
function inWords(z) {
  const a = Math.abs(z)
  if (a < 0.4) return 'your usual'
  if (a < 1.1) return z > 0 ? 'a little above your usual' : 'a little below your usual'
  if (a < 2.2) return z > 0 ? 'above your usual' : 'below your usual'
  return z > 0 ? 'well above your usual' : 'well below your usual'
}
const signed = z => (z > 0 ? '+' : '') + z.toFixed(1)

/* 1 SVG unit = 1 CSS pixel, so a 12px label is 12px on a phone and the 4
 * columns can be laid out against the space that actually exists. The house
 * useWidth in charts/primitives floors at 320, which breaks that contract on a
 * 390px viewport once the card padding is taken off, so this one does not
 * clamp. */
function useBoxWidth(fallback = 760) {
  const ref = React.useRef(null)
  const [w, setW] = React.useState(fallback)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => setW(Math.max(240, Math.round(el.clientWidth || fallback)))
    read()
    if (!window.ResizeObserver) return
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [fallback])
  return [ref, w]
}

/* Columns left to right, nodes spread down each column. Below 430px the label
 * gutter and the node radii shrink rather than the whole drawing scaling down,
 * because a scaled drawing takes the type with it. */
function geometry(w) {
  const narrow = w < 430
  /* The gutter has to hold "Temperature" at the label size below, or an SVG,
     which clips to its viewBox, eats the first letter. */
  const gutter = narrow ? 86 : 126
  const h = narrow ? 272 : w < 780 ? 304 : 340
  const foot = 28                        // clearance for the per layer counts below
  const top = 8
  const first = gutter + (narrow ? 8 : 16)
  const last = w - (narrow ? 14 : 20)
  const r = narrow ? { in: 5.5, hid: 3.4, out: 11 } : { in: 7, hid: 4.4, out: 14 }
  const inset = [20, 0, 14, 0]
  const x = ARCH.map((_, l) => first + ((last - first) * l) / (ARCH.length - 1))
  const mid = (top + h - foot) / 2
  const pos = (layer, i) => {
    const n = ARCH[layer]
    if (n === 1) return [x[layer], mid]
    const lo = top + inset[layer]
    const hi = h - foot - inset[layer]
    return [x[layer], lo + ((hi - lo) * i) / (n - 1)]
  }
  return { narrow, gutter, h, foot, r, x, pos, labelX: gutter - (narrow ? 6 : 10) }
}

/* Edge weight to ink. The raw magnitudes are honest but unreadable: movement
 * owns the three largest first-layer weights by a factor of five, because it
 * drives the gate, so a linear mapping prints the other three signals as
 * nothing at all. The exponents below are monotone, so every ordering survives
 * and the faint edges stay on the page. */
const emphasis = m => Math.pow(Math.max(0, Math.min(1, m)), 0.55)

export function MindScoreNet({ className, initial = 'hard' }) {
  const reduced = useReducedMotion()
  const [box, w] = useBoxWidth()
  const geo = React.useMemo(() => geometry(w), [w])

  const [z, setZ] = React.useState(() => byId(initial).z.slice())
  const [active, setActive] = React.useState(() => byId(initial).id)
  const zRef = React.useRef(z)
  zRef.current = z
  const frame = React.useRef(0)
  React.useEffect(() => () => cancelAnimationFrame(frame.current), [])

  /* A preset is an argument, so it has to be watched arriving: the sliders
     travel to it rather than jumping, and the score counts across the gap. One
     rAF loop over the whole vector, not a spring per slider. */
  const glide = target => {
    cancelAnimationFrame(frame.current)
    if (reduced) { setZ(target.slice()); return }
    const from = zRef.current.slice()
    const t0 = performance.now()
    const step = t => {
      const p = Math.min(1, (t - t0) / 460)
      const e = 1 - Math.pow(1 - p, 3)
      setZ(from.map((v, i) => v + (target[i] - v) * e))
      if (p < 1) frame.current = requestAnimationFrame(step)
    }
    frame.current = requestAnimationFrame(step)
  }

  const setOne = (i, v) => {
    cancelAnimationFrame(frame.current)
    setActive(null)
    setZ(prev => prev.map((old, k) => (k === i ? v : old)))
  }

  const { score, p, acts } = run(z)
  const { score: refScore, gate } = reference(z)

  /* Weights do not move when a slider does, so the 234 edges are built once
     per layout and reused on every frame of a drag. */
  const edges = React.useMemo(() => {
    const out = []
    for (let l = 0; l < ARCH.length - 1; l++) {
      const max = edgeMax(l) || 1
      for (let i = 0; i < ARCH[l]; i++) {
        const [x1, y1] = geo.pos(l, i)
        const tone = l === 0 ? SENSORS[SIGNALS[i]].glow : null
        for (let j = 0; j < ARCH[l + 1]; j++) {
          const m = emphasis(Math.abs(edge(l, i, j)) / max)
          const [x2, y2] = geo.pos(l + 1, j)
          out.push({
            k: `${l}-${i}-${j}`, x1, y1, x2, y2, tone,
            sw: +(0.45 + 1.5 * m).toFixed(2),
            op: +(0.09 + 0.5 * m).toFixed(3),
          })
        }
      }
    }
    return out
  }, [geo])

  const read = SIGNALS.map((s, i) => `${SENSORS[s].name} ${inWords(z[i])}`).join(', ')
  const alt = `Diagram of the network that computes the Mind Score. Four readings enter: ${read}. `
    + `They pass through ${ARCH[1]} and then ${ARCH[2]} intermediate units and leave as one `
    + `Mind Score of ${score} out of 100, where 0 is calm and 100 is peak.`

  /* A node is a card-filled ring with a disc inside it whose radius carries the
     activation. Size and not sign: a tanh unit's sign is an accident of how it
     was initialised, and the magnitude is the only part a reader can act on. */
  const lit = a => Math.sqrt(Math.min(1, Math.abs(a)))

  return (
    <ScrollIn className={cn('w-full', className)}>
      <div className="rounded-panel border border-rule bg-card p-5 sm:p-7">

        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h3 className="font-display text-row font-bold text-ink">How one day becomes one number</h3>
          <p className="tick">{ARCH.join('-')}, live in this page</p>
        </div>

        <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-7">
          <div ref={box} role="img" aria-label={alt} className="w-full min-w-0 sm:flex-1">
            <svg viewBox={`0 0 ${w} ${geo.h}`} aria-hidden focusable="false"
              className="block w-full" style={{ aspectRatio: `${w} / ${geo.h}` }}>
              <g>
                {edges.map(e => (
                  <line key={e.k} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                    strokeWidth={e.sw} strokeOpacity={e.op} strokeLinecap="round"
                    stroke={e.tone || undefined}
                    className={e.tone ? undefined : 'stroke-ink'}/>
                ))}
              </g>

              {/* input column: the one place the signal colours appear in the
                  drawing. The label beside each stays ink, per lib/sensors. */}
              {SIGNALS.map((id, i) => {
                const s = SENSORS[id]
                const [cx, cy] = geo.pos(0, i)
                return (
                  <g key={id}>
                    <text x={geo.labelX} y={cy + 4} textAnchor="end"
                      fontSize={geo.narrow ? 12 : 14}
                      className="fill-ink font-body">{s.name}</text>
                    <circle cx={cx} cy={cy} r={geo.r.in} className="fill-card stroke-ruling" strokeWidth="1.2"/>
                    <circle cx={cx} cy={cy} r={(geo.r.in * lit(z[i] / Z_LIMIT)).toFixed(2)} fill={s.glow}/>
                  </g>
                )
              })}

              {[1, 2].map(l => (
                <g key={l}>
                  {acts[l].map((a, j) => {
                    const [cx, cy] = geo.pos(l, j)
                    return (
                      <g key={j}>
                        <circle cx={cx} cy={cy} r={geo.r.hid} className="fill-card stroke-ruling" strokeWidth="1"/>
                        <circle cx={cx} cy={cy} r={(geo.r.hid * lit(a)).toFixed(2)} className="fill-ink"/>
                      </g>
                    )
                  })}
                </g>
              ))}

              {(() => {
                const [cx, cy] = geo.pos(3, 0)
                return (
                  <g>
                    <circle cx={cx} cy={cy} r={geo.r.out} className="fill-card stroke-ink" strokeWidth="1.6"/>
                    <circle cx={cx} cy={cy} r={(geo.r.out * Math.sqrt(p)).toFixed(2)} className="fill-accent"/>
                  </g>
                )
              })()}

              {/* the architecture, under the columns it describes */}
              {/* The output column sits against the right edge, so its caption
                  is anchored to that edge: centred on the node it runs past the
                  viewBox and an SVG clips to its viewBox. */}
              {ARCH.map((n, l) => {
                const last = l === ARCH.length - 1
                return (
                  <text key={l} x={last ? w - 2 : geo.x[l]} y={geo.h - 6}
                    textAnchor={last ? 'end' : 'middle'}
                    fontSize={geo.narrow ? 11 : 12}
                    className="fill-ink-3 font-mono">
                    {l === 0 ? `${n} signals` : last ? `${n} score` : `${n} units`}
                  </text>
                )
              })}
            </svg>
          </div>

          <div className="max-w-full shrink-0 text-center sm:w-[168px] sm:text-left">
            <p className="m-0 font-display text-fig font-bold leading-none tabular-nums text-ink">{score}</p>
            <p className="m-0 mt-1.5 font-display text-ui font-medium text-ink-2">Mind Score</p>
            <p className="tick mt-1">out of 100</p>
            <p className="tick">0 is calm, 100 is peak</p>
          </div>
        </div>

        <RuleDraw className="mt-6"/>

        <p className="mt-5 max-w-[68ch] text-sec text-ink-2">
          Those middle two days carry identical heart, sweat and temperature readings.
          Sitting still they come out at 86. During a run they come out at 51, because
          movement holds the other three back rather than adding to them.
        </p>

        <div className="mt-4 flex max-w-[900px] flex-wrap gap-2.5">
          {PRESETS.map(d => (
            <button key={d.id} type="button" aria-pressed={active === d.id}
              onClick={() => { setActive(d.id); glide(d.z) }}
              className={cn('inline-flex min-h-[44px] items-center rounded-field border px-3.5',
                'font-display text-fine font-medium',
                'transition-[background-color,border-color,color] duration-150 ease-[var(--ease-out)]',
                'motion-safe:active:scale-[0.97] touch-manipulation',
                active === d.id
                  ? 'border-ink bg-mist text-ink'
                  : 'border-rule text-ink-2 hoverOnly:border-ruling hoverOnly:bg-mist')}>
              {d.label}
            </button>
          ))}
        </div>

        <ul className="mt-6 m-0 max-w-[900px] list-none p-0">
          {SIGNALS.map((id, i) => {
            const s = SENSORS[id]
            const slider = `mm-net-${id}`
            return (
              <li key={id} className="border-t border-rule py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                  <label htmlFor={slider}
                    className="flex items-center gap-2.5 font-display text-ui font-medium text-ink">
                    <span aria-hidden className="h-4 w-[3px] shrink-0 rounded-bar"
                      style={{ background: s.glow }}/>
                    {s.name}
                  </label>
                  <span className="text-fine text-ink-2">
                    {inWords(z[i])}
                    <span className="ml-2 font-mono text-tick tabular-nums text-ink-3">{signed(z[i])} z</span>
                  </span>
                </div>
                <input id={slider} type="range" min={-Z_LIMIT} max={Z_LIMIT} step="0.1"
                  value={z[i]} onChange={e => setOne(i, Number(e.target.value))}
                  aria-valuetext={`${inWords(z[i])}, ${signed(z[i])} standard deviations`}
                  style={{ '--mm-dot': s.glow }}
                  className="mt-1 h-11 w-full cursor-pointer appearance-none bg-transparent
                    [&::-webkit-slider-runnable-track]:h-1.5
                    [&::-webkit-slider-runnable-track]:rounded-bar
                    [&::-webkit-slider-runnable-track]:bg-mist
                    [&::-webkit-slider-thumb]:-mt-[9px]
                    [&::-webkit-slider-thumb]:h-6
                    [&::-webkit-slider-thumb]:w-6
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:rounded-chip
                    [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-card
                    [&::-webkit-slider-thumb]:bg-[var(--mm-dot)]
                    [&::-moz-range-track]:h-1.5
                    [&::-moz-range-track]:rounded-bar
                    [&::-moz-range-track]:bg-mist
                    [&::-moz-range-thumb]:h-6
                    [&::-moz-range-thumb]:w-6
                    [&::-moz-range-thumb]:appearance-none
                    [&::-moz-range-thumb]:rounded-chip
                    [&::-moz-range-thumb]:border-2
                    [&::-moz-range-thumb]:border-card
                    [&::-moz-range-thumb]:bg-[var(--mm-dot)]"/>
              </li>
            )
          })}
        </ul>
        <p aria-hidden className="mt-1 flex max-w-[900px] justify-between gap-2 text-fine text-ink-3">
          <span>well below</span><span>your usual</span><span>well above</span>
        </p>

        <div className="mt-5 max-w-[640px] rounded-field bg-mist px-4 py-3">
          <p className="m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-display text-ui font-medium text-ink">Movement gate</span>
            <span className="font-mono text-num font-medium tabular-nums leading-none text-ink">
              {gate.toFixed(2)}</span>
          </p>
          <p className="tick mt-1.5">
            How much of heart, sweat and temperature is counted at this much movement.
            1.00 counts all of it, 0.00 counts none.
          </p>
        </div>

        <p className="mt-5 max-w-[72ch] text-fine text-ink-3">
          Architecture {ARCH.join('-')}, tanh between layers and a logistic at the end,
          {' '}{PARAM_COUNT} parameters, running in this page with no server behind it.
          It is fitted to the published-coefficient reference model documented in
          tools/net/train.py, not to people. Against that reference, over {FIT.points} test
          points, it is out by {FIT.mean} score points on average, {FIT.p99} at the 99th
          percentile and {FIT.worst} at worst. It will be refitted when measured readings
          exist. The reference model reads {refScore} at these inputs.
        </p>
        <p className="mt-2 max-w-[72ch] text-fine text-ink-3">
          A Mind Score is not a diagnosis and it is not a percentage. It is one number
          out of 100 describing one day against that person's own fourteen day baseline.
        </p>
      </div>
    </ScrollIn>
  )
}
