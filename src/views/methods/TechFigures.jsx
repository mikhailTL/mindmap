import React from 'react'
import { TNAM_RESULTS as R } from '../../signals/tnam-results'
import { CONTEXT_WINDOWS } from '../../signals/tnam'
import { SENSORS, SENSOR_ORDER } from '../../lib/sensors'
import { PRO, PRO_PLURAL_LC, SCORE } from '../../lib/terms'
import { cn } from '../../lib/utils'
import { Glass } from '../../ui/tech'

// Mind Score network and MindMap AI framework drawings. Labels are HTML over aria-hidden SVG lines, so a label
// does not shrink with the drawing.
const LABEL = 'text-[0.8125rem] font-semibold leading-none text-[#0f5836]'
const HUE = { stroke: 'var(--t-hue, #157446)' }

// Curves come from signals/tnam-results.js. Each tile has its own y range, so it shows shape, not size.
const CURVE_OF = { heart: 'hr', sweat: 'edaTonic', temp: 'tempSlope', move: 'motion' }
const HOP_S = 30
const MEMORY_MIN = (CONTEXT_WINDOWS * HOP_S) / 60
const TW = 100, TH = 46, PAD = 6

function curvePath(shape) {
  const lo = Math.min(...shape.y), hi = Math.max(...shape.y), span = hi - lo || 1
  const n = shape.x.length
  return shape.y.map((y, i) => {
    const px = PAD + (i / (n - 1)) * (TW - 2 * PAD)
    const py = TH - PAD - ((y - lo) / span) * (TH - 2 * PAD)
    return `${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`
  }).join('')
}

function Lines({ h, paths, className }) {
  return (
    <svg viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" aria-hidden focusable="false"
      className={cn('absolute inset-0 block h-full w-full', className)} fill="none">
      {paths.map(d => <path key={d} d={d} style={HUE} strokeOpacity=".55" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>)}
    </svg>
  )
}

function Packets({ runs, delay = 0 }) {
  return runs.map(([x0, y0, x1, y1], i) => (
    <span key={i} aria-hidden className="t-lane t-anim"
      style={{ '--x0': `${x0}%`, '--y0': `${y0}px`, '--x1': `${x1}%`, '--y1': `${y1}px`,
        animationDelay: `${delay + i * 0.6}s` }}><i/></span>
  ))
}

const COLS = [12.5, 37.5, 62.5, 87.5]

export function NetworkGlow({ className }) {
  return (
    <figure className={cn('m-0 mx-auto w-full max-w-[24rem]', className)}>
      {/* signals */}
      <p className={LABEL}>Signals</p>
      <ul className="m-0 mt-2.5 grid list-none grid-cols-4 gap-1.5 p-0">
        {SENSOR_ORDER.map(id => {
          const S = SENSORS[id], Icon = S.icon
          return (
            <li key={id} className="flex min-w-0 flex-col items-center gap-1.5 text-center">
              <span className="grid size-11 place-items-center rounded-full border-[1.5px] bg-white"
                style={{ borderColor: S.glow }}>
                <Icon aria-hidden size={20} className="text-[#0d2b1e]"/>
              </span>
              <span className="whitespace-nowrap text-[0.75rem] font-semibold leading-tight text-[#0d2b1e]">{S.name}</span>
            </li>
          )
        })}
      </ul>

      <div className="relative h-6">
        <Lines h={24} paths={COLS.map(x => `M${x} 0V24`)}/>
        <Packets runs={COLS.map(x => [x, 0, x, 24])}/>
      </div>

      {/* one learned curve per signal */}
      <ul className="m-0 grid list-none grid-cols-4 gap-1.5 p-0">
        {SENSOR_ORDER.map(id => (
          <li key={id}>
            <Glass tone="quiet" className="px-1 py-1.5">
              <svg viewBox={`0 0 ${TW} ${TH}`} aria-hidden focusable="false" className="block w-full"
                fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d={`M${PAD} ${TH - PAD}H${TW - PAD}`} stroke="#93b2a1" strokeOpacity=".6" strokeDasharray="2 4"/>
                <path d={curvePath(R.shapes[CURVE_OF[id]])} style={HUE} strokeWidth="2.2"/>
              </svg>
            </Glass>
          </li>
        ))}
      </ul>
      <p className={cn(LABEL, 'mb-2 mt-2 text-center')}>One curve each</p>

      <div className="relative h-12">
        <Lines h={48} paths={COLS.map(x => `M${x} 0L50 48`)}/>
        <Packets runs={COLS.map(x => [x, 0, 50, 48])} delay={1.2}/>
      </div>

      {/* the sum, with the memory feeding it from the side */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <div className="min-w-0">
          <div className="relative grid grid-cols-8 gap-[3px] rounded-[6px]">
            {Array.from({ length: CONTEXT_WINDOWS }, (_, i) => (
              <span key={i} className={cn('block h-5 rounded-[3px] border',
                i === CONTEXT_WINDOWS - 1 ? 'border-[#11677f] bg-[#1d8fb0]/60' : 'border-[#c2d7ca] bg-[#1d8fb0]/[0.08]')}/>
            ))}
            <span aria-hidden className="t-scan t-anim"><i/></span>
          </div>
          <p className={cn(LABEL, 'mt-1.5')}>Last {MEMORY_MIN} minutes</p>
        </div>
        <span className="relative grid size-14 place-items-center rounded-full border-[1.5px] border-[#11677f] bg-white">
          <svg viewBox="0 0 24 24" aria-hidden focusable="false" className="size-6" fill="none"
            stroke="#11677f" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          <span className="pointer-events-none absolute right-full top-1/2 mr-0.5 h-px w-2 bg-[#1d8fb0]"/>
        </span>
        <p className={LABEL}>Added up</p>
      </div>

      <div className="relative h-8">
        <Lines h={32} paths={['M50 0V32']}/>
        <Packets runs={[[50, 0, 50, 32]]} delay={2.2}/>
      </div>

      {/* one number */}
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 96 64" aria-hidden focusable="false" className="block h-16 w-24" fill="none" strokeLinecap="round">
          <defs>
            <linearGradient id="t-dial" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#18a370"/><stop offset=".6" stopColor="#1d8fb0"/><stop offset="1" stopColor="#8b6cf0"/>
            </linearGradient>
          </defs>
          <path d="M12 56a36 36 0 0 1 72 0" stroke="#c2d7ca" strokeOpacity=".7" strokeWidth="7"/>
          <path d="M12 56a36 36 0 0 1 58 -27" stroke="url(#t-dial)" strokeWidth="7"/>
        </svg>
        <p className="mt-1 font-display text-ui font-bold text-[#0d2b1e]">{SCORE}</p>
      </div>
      <figcaption className="sr-only">
        Read it top to bottom. Each curve shows how much one signal adds as it moves away from your
        normal, and the curves plus the last {MEMORY_MIN} minutes add up to the {SCORE}.
      </figcaption>
    </figure>
  )
}

const PUBLISHERS = ['SAMHSA', 'NIMH', 'AAP', 'CDC']
// Lets "Counselor/Professional" break after the slash in a narrow column.
const soft = s => s.split('/').flatMap((p, i, a) => i < a.length - 1 ? [p + '/', <wbr key={i}/>] : [p])
const ADAPTATIONS = ['Student', 'Parent', PRO]
const FAN = [16.67, 50, 83.33]

export function FrameworkGlow({ className }) {
  return (
    <figure className={cn('m-0 mx-auto w-full max-w-[22rem]', className)}>
      <Glass tone="vio" className="px-4 py-3.5 text-center">
        <p className="font-display text-ui font-bold text-[#0d2b1e]">One framework</p>
        <ul className="m-0 mt-2.5 flex list-none flex-wrap justify-center gap-1.5 p-0">
          {PUBLISHERS.map(p => <li key={p} className="t-chip font-semibold">{p}</li>)}
        </ul>
      </Glass>
      <div className="relative h-14">
        <Lines h={56} paths={FAN.map(x => `M50 0L${x} 56`)}/>
        <Packets runs={FAN.map(x => [50, 0, x, 56])}/>
      </div>
      <ul className="m-0 grid list-none grid-cols-3 gap-2 p-0">
        {ADAPTATIONS.map(a => (
          <li key={a} className="h-full">
            <Glass tone="quiet" className="flex h-full min-h-[3.25rem] items-center justify-center px-2 py-2 text-center">
              <span className="text-[0.875rem] font-semibold leading-tight text-[#0d2b1e]">{soft(a)}</span>
            </Glass>
          </li>
        ))}
      </ul>
      <figcaption className="sr-only">
        One set of rules from these four publishers, worded for each person who reads the reply.
        <span className="sr-only"> The rules are adapted for students, parents and {PRO_PLURAL_LC}.</span>
      </figcaption>
    </figure>
  )
}
