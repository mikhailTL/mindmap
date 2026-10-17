import React from 'react'
import { Button } from '../ui/button'
import { cn } from '../lib/utils'
import { ActivityScreen, OnDevice } from './shell'
import { DidItWork } from './after'
import { useGame, GameBar, Pops, LevelMeter, EndCard } from './game'

/* Body Scan, as "light up the body".
 *
 * The guide moves feet to face. The part to notice glows on the figure; press
 * and hold it (or the pad under it) while you notice that part, and it fills
 * with light. About six seconds of holding lights it. Letting go only pauses
 * the fill; nothing drains. Lit is 15 points, and a part lit in one hold is 5
 * more. Skip is always there and costs nothing.
 *
 * SAFETY. Every prompt is noticing, never tensing or squeezing. */

const REGIONS = [
  { id:'feet',      name:'Feet',      say:'Notice the floor under them.' },
  { id:'legs',      name:'Legs',      say:'Let them feel heavy.' },
  { id:'belly',     name:'Belly',     say:'Breathe slowly into it.' },
  { id:'chest',     name:'Chest',     say:'Feel it rise and fall.' },
  { id:'hands',     name:'Hands',     say:'Let your fingers open.' },
  { id:'shoulders', name:'Shoulders', say:'Let them drop a little.' },
  { id:'face',      name:'Face',      say:'Soften your jaw and eyes.' },
]
const HOLD = 6

/* Front view, one path, drawn clockwise from the top of the head. */
const BODY = [
  'M60 4', 'C72 4 78 12 78 22', 'C78 30 72 38 66 40', 'L66 48',
  'C82 50 94 54 98 66', 'C101 82 104 100 106 118', 'C107 126 104 132 100 132',
  'C96 132 93 127 93 120', 'C92 104 90 86 88 70', 'C88 90 86 110 87 128',
  'C88 150 86 180 84 212', 'C84 222 86 230 82 232', 'L66 232', 'C64 228 64 220 64 212',
  'C64 190 62 160 60 136', 'C58 160 56 190 56 212', 'C56 220 56 228 54 232', 'L38 232',
  'C34 230 36 222 36 212', 'C34 180 32 150 33 128', 'C34 110 32 90 32 70',
  'C30 86 28 104 27 120', 'C27 127 24 132 20 132', 'C16 132 13 126 14 118',
  'C16 100 19 82 22 66', 'C26 54 38 50 54 48', 'L54 40', 'C48 38 42 30 42 22',
  'C42 12 48 4 60 4', 'Z',
].join(' ')

const SHAPES = {
  feet:      [[0, 208, 120, 30]],
  legs:      [[0, 132, 120, 76]],
  belly:     [[34, 100, 52, 32]],
  chest:     [[34, 66, 52, 34]],
  hands:     [[0, 64, 34, 72], [86, 64, 34, 72]],
  shoulders: [[0, 40, 120, 26]],
  face:      [[0, 0, 120, 40]],
}
const centre = id => { const [x, y, w, h] = SHAPES[id][0]; return id === 'hands' ? [17, 100] : [x + w / 2, y + h / 2] }

function Figure({ cur, fill, lit, skipped, onDown, onUp }) {
  return (
    <svg viewBox="0 0 120 240" role="img"
      aria-label={cur ? `Body outline. ${cur} is glowing.` : 'Body outline'}
      onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={onUp} onLostPointerCapture={onUp}
      onContextMenu={e => e.preventDefault()}
      className="mx-auto block h-[40vh] max-h-[30rem] w-auto touch-none select-none lg:h-[58vh]">
      <defs><clipPath id="scan-body"><path d={BODY}/></clipPath></defs>
      <path d={BODY} className="fill-aqua-2"/>
      <g clipPath="url(#scan-body)">
        {Object.entries(SHAPES).map(([id, rects]) => rects.map(([x, y, w, h], k) => {
          const isCur = id === cur
          const on = lit.includes(id)
          const p = isCur ? fill : on ? 1 : 0
          return (
            <g key={id + k} data-region={id}>
              <rect data-region={id} x={x} y={y} width={w} height={h}
                style={{ fill: isCur ? '#ffffff' : 'transparent' }}/>
              {p > 0 && (
                <rect data-region={id} x={x} y={y + h * (1 - p)} width={w} height={h * p}
                  stroke={on ? '#ffffff' : 'none'} strokeWidth="1.2"
                  style={{ fill:'var(--g-main)', opacity: on ? 1 : 0.85 }}/>
              )}
              {skipped.includes(id) && (
                <rect data-region={id} x={x} y={y} width={w} height={h} fill="none"
                  stroke="#426a58" strokeWidth="1.5" strokeDasharray="3 3"/>
              )}
            </g>
          )
        }))}
      </g>
      <path d={BODY} fill="none" className="stroke-ink" strokeWidth="2.5" strokeLinejoin="round"
        pointerEvents="none"/>
      {cur && SHAPES[cur].map(([x, y, w, h], k) => (
        <rect key={k} x={x + 2} y={y + 2} width={w - 4} height={h - 4} rx="6" fill="none" strokeWidth="2.5"
          strokeDasharray="5 4" pointerEvents="none" clipPath="url(#scan-body)"
          style={{ stroke:'var(--g-ink)' }}/>
      ))}
    </svg>
  )
}

export default function BodyScan() {
  const g = useGame('scan')
  const [stage, setStage] = React.useState('idle')     // idle | play | done
  const [i, setI] = React.useState(0)
  const [fill, setFill] = React.useState(0)
  const [lit, setLit] = React.useState([])
  const [skipped, setSkipped] = React.useState([])
  const [held, setHeld] = React.useState(false)
  const [between, setBetween] = React.useState(false)
  const [hint, setHint] = React.useState('')
  const [steady, setSteady] = React.useState(0)

  const heldRef = React.useRef(false)
  const breaks = React.useRef(0)
  const fillRef = React.useRef(0)
  const box = React.useRef(null)

  const region = REGIONS[Math.min(i, REGIONS.length - 1)]
  const hold = on => {
    if (heldRef.current && !on && fillRef.current > 0 && fillRef.current < 1) breaks.current++
    heldRef.current = on; setHeld(on)
  }

  const nextRegion = React.useCallback((idx) => {
    if (idx + 1 >= REGIONS.length) { setStage('done'); g.finish({ complete:true }); return }
    setI(idx + 1); fillRef.current = 0; setFill(0); breaks.current = 0; setBetween(false)
    g.cue('turn')
  }, [g.finish, g.cue])

  React.useEffect(() => {
    if (stage !== 'play' || between) return
    let id = 0, last = performance.now()
    const tick = now => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now
      if (heldRef.current) {
        fillRef.current = Math.min(1, fillRef.current + dt / HOLD)
        setFill(fillRef.current)
        if (fillRef.current >= 1) {
          const [x, y] = centre(region.id)
          const b = box.current?.getBoundingClientRect(), sv = box.current?.querySelector('svg')?.getBoundingClientRect()
          const pos = b && sv ? { x: (sv.left - b.left + x / 120 * sv.width) / b.width * 100,
                                  y: (sv.top - b.top + y / 240 * sv.height) / b.height * 100 - 6 } : {}
          setLit(l => [...l, region.id])
          g.add(15, { ...pos, sound:'good' })
          if (breaks.current === 0) { setSteady(s => s + 1); setTimeout(() => g.add(5, { ...pos, y: pos.y + 8, label:'steady' }), 220) }
          heldRef.current = false; setHeld(false); setBetween(true)
          setTimeout(() => nextRegion(i), 900)
          return
        }
      }
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [stage, between, i, region.id, g.add, nextRegion])

  const onDown = e => {
    if (stage !== 'play' || between) return
    /* Hit test in figure units against the region's boxes, not the clipped
       shapes, so the gap between the legs still counts as feet or legs. */
    const svg = e.currentTarget
    let inside = false
    try {
      const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY
      const q = pt.matrixTransform(svg.getScreenCTM().inverse())
      inside = SHAPES[region.id].some(([x, y, w, h]) => q.x >= x - 4 && q.x <= x + w + 4 && q.y >= y - 4 && q.y <= y + h + 4)
    } catch { inside = (e.target?.dataset?.region === region.id) }
    if (inside) { e.currentTarget.setPointerCapture?.(e.pointerId); setHint(''); hold(true) }
    else setHint(`Hold the glowing part: ${region.name.toLowerCase()}.`)
  }

  const start = () => {
    g.reset(); setI(0); fillRef.current = 0; setFill(0); setLit([]); setSkipped([]); setSteady(0)
    breaks.current = 0; setBetween(false); setHint(''); setStage('play'); g.cue('turn')
  }
  const skip = () => { setSkipped(s => [...s, region.id]); hold(false); nextRegion(i) }

  return (
    <ActivityScreen family="pool" title="Body Scan">
      <div style={g.vars} className="mx-auto w-full max-w-[60rem]">
        {stage !== 'done' && <GameBar game={g} className="mb-3">
          <span className="font-display text-ui font-semibold tabular-nums text-ink-2">
            {lit.length} of {REGIONS.length} lit
          </span>
        </GameBar>}

        {stage !== 'done' && (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
            <div ref={box} className="relative">
              <Figure cur={stage === 'play' && !between ? region.id : null} fill={fill} lit={lit}
                skipped={skipped} onDown={onDown} onUp={() => hold(false)}/>
              <Pops game={g}/>
            </div>
            <div className="text-center lg:text-left">
              {stage === 'idle' && (
                <>
                  <p className="font-display text-row font-bold text-ink">Light up the body</p>
                  <p className="mt-1 text-sec text-ink-2">Hold each glowing part while you notice it.</p>
                  <Button className="mt-4 w-full sm:w-auto sm:min-w-[12rem]" onClick={start}>Start</Button>
                  <LevelMeter className="mt-5 text-left"/>
                </>
              )}
              {stage === 'play' && (
                <>
                  <p className="font-display text-fine font-semibold text-ink-2">
                    {Math.min(i + 1, REGIONS.length)} of {REGIONS.length}
                  </p>
                  <p key={region.id} className={cn('font-display text-head font-bold tracking-tight text-ink',
                    !g.reduced && 'g-in')}>{between ? `${region.name} lit` : region.name}</p>
                  <p className="mt-1 text-sec text-ink-2">{between ? 'Moving on.' : region.say}</p>
                  <button type="button" aria-pressed={held} disabled={between}
                    onPointerDown={e => { e.currentTarget.setPointerCapture?.(e.pointerId); setHint(''); hold(true) }}
                    onPointerUp={() => hold(false)} onPointerCancel={() => hold(false)}
                    onLostPointerCapture={() => hold(false)}
                    onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); hold(true) } }}
                    onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); hold(false) } }}
                    onContextMenu={e => e.preventDefault()}
                    className={cn('relative mt-3 h-16 w-full touch-none select-none overflow-hidden rounded-panel border-2',
                      'border-ink font-display text-ui font-bold text-ink transition-colors duration-150',
                      held ? 'bg-mist' : 'bg-card')}>
                    <span aria-hidden className="absolute inset-y-0 left-0"
                      style={{ width: `${Math.round(fill * 100)}%`, background:'var(--g-wash)' }}/>
                    <span className="relative">{held ? 'Holding' : 'Press and hold'}</span>
                  </button>
                  <p className="mt-2 min-h-[1.5rem] text-fine text-ink-2" aria-live="polite">{hint}</p>
                  <div className="mt-1 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                    <Button size="sm" variant="outline" onClick={skip} disabled={between}>Skip</Button>
                    <span className="text-fine text-ink-2">Skip any part that hurts.</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        {stage === 'idle' && <DidItWork tool="scan" phase="before" className="mt-4"/>}

        {stage === 'done' && (
          <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start">
            <div className="hidden lg:block">
              <Figure cur={null} fill={0} lit={lit} skipped={skipped} onDown={() => {}} onUp={() => {}}/>
            </div>
            <EndCard game={g} title={lit.length === REGIONS.length ? 'Whole body lit' : 'Scan done'}
              stats={[['Parts lit', `${lit.length} of ${REGIONS.length}`],
                      ['Lit in one hold', String(steady)]]}
              onAgain={start}>
              <DidItWork tool="scan" phase="after"/>
            </EndCard>
          </div>
        )}
        <OnDevice className="mt-4">Nothing leaves this device.</OnDevice>
      </div>
    </ActivityScreen>
  )
}
