import React from 'react'
import { Button } from '../ui/button'
import { cn } from '../lib/utils'
import { ActivityScreen, Choice } from './shell'
import { DidItWork } from './after'
import { motion } from 'framer-motion'
import { useGame, GameBar, Pops, LevelMeter, Countdown, EndCard, useSvgId } from './game'

const PATTERNS = {
  box:  { id:'box',  label:'Box', say:'In 4, rest 4, out 4, rest 4.', laps:4,
          steps:[['In', 4, .25], ['Rest', 4, .25], ['Out', 4, .25], ['Rest', 4, .25]] },
  even: { id:'even', label:'Even', say:'In 4, out 4. No rests.', laps:6, steps:[['In', 4, .5], ['Out', 4, .5]] },
  long: { id:'long', label:'Long out', say:'In 4, out 6. No rests.', laps:5, steps:[['In', 4, .5], ['Out', 6, .5]] },
}
const SAY = { In:'Breathe in', Out:'Breathe out', Rest:'Rest' }
const GRACE = 0.5  // seconds at the start of each side that are not scored
const PASS = 0.7  // share of a side that must match the light

const wants = steps => steps.map((s, i) => s[0] === 'In' ||
  (s[0] === 'Rest' && steps[(i - 1 + steps.length) % steps.length][0] === 'In'))

// The square runs from (30,30) to (170,170), walked from the bottom left, up first.
const A = 30, S = 140
function at(u) {
  const k = ((u % 1) + 1) % 1 * 4, side = Math.floor(k), f = k - side
  if (side === 0) return [A, A + S - f * S]
  if (side === 1) return [A + f * S, A]
  if (side === 2) return [A + S, A + f * S]
  return [A + S - f * S, A + S]
}

function Board({ pattern, u, match, lag, idle, children, held, onHold, reduced }) {
  const id = useSvgId('bx')
  const steps = PATTERNS[pattern].steps
  const [lx, ly] = at(u)
  const [cx, cy] = [100, 100]
  const dx = lx + (cx - lx) * 0.2 * lag, dy = ly + (cy - ly) * 0.2 * lag
  let u0 = 0
  const labels = steps.map(([name, , span]) => {
    const mid = u0 + span / 2
    u0 += span
    const [x, y] = at(mid)
    const out = 16
    const ox = x === A ? -out : x === A + S ? out : 0
    const oy = y === A ? -out + 4 : y === A + S ? out + 4 : 4
    return { name, x: x + ox, y: y + oy, vertical: x === A || x === A + S }
  })
  const done = u % 1
  const per = S * 4
  return (
    <motion.div role="button" tabIndex={0} aria-pressed={held}
      aria-label={held ? 'Holding. Let go to breathe out.' : 'Press and hold to breathe in.'}
      onPointerDown={e => { e.currentTarget.setPointerCapture?.(e.pointerId); onHold(true) }}
      onPointerUp={() => onHold(false)} onPointerCancel={() => onHold(false)}
      onLostPointerCapture={() => onHold(false)}
      onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); onHold(true) } }}
      onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onHold(false) } }}
      onContextMenu={e => e.preventDefault()}
      animate={reduced ? undefined : { scale: held ? 0.975 : 1 }}
      transition={{ type:'spring', stiffness:500, damping:30 }}
      className={cn('relative mx-auto aspect-square w-full max-w-[24rem] select-none overflow-hidden rounded-[24px] border',
        'touch-none shadow-raise sm:max-w-[28rem]', held ? 'border-ink' : 'border-rule')}
      style={{ background:'radial-gradient(100% 100% at 50% 30%, #ffffff 0%, var(--g-wash) 100%)', WebkitTouchCallout:'none' }}>
      <span aria-hidden className="absolute inset-0 transition-opacity duration-300"
        style={{ opacity: held ? 1 : 0, background:'radial-gradient(70% 70% at 50% 50%, var(--g-wash) 0%, color-mix(in srgb, var(--g-main) 22%, var(--g-wash)) 100%)' }}/>
      <svg viewBox="0 0 200 200" aria-hidden focusable="false" className="absolute inset-0 size-full">
        <defs>
          <radialGradient id={id + 'g'}>
            <stop offset="0" style={{ stopColor:'var(--g-main)' }} stopOpacity="0.6"/>
            <stop offset="1" style={{ stopColor:'var(--g-main)' }} stopOpacity="0"/>
          </radialGradient>
          <linearGradient id={id + 't'} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" style={{ stopColor:'var(--g-ink)' }}/><stop offset="1" style={{ stopColor:'var(--g-main)' }}/>
          </linearGradient>
        </defs>
        <rect x={A} y={A} width={S} height={S} rx="10" fill="#ffffff" fillOpacity="0.55" stroke="#dbe7e0" strokeWidth="7"/>
        {!idle && (
          <path d={`M${A} ${A + S} V${A} H${A + S} V${A + S} H${A}`} fill="none" strokeWidth="7"
            strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${done * per} ${per}`}
            stroke={`url(#${id}t)`} opacity="0.6"/>
        )}
        {labels.map(l => (
          <text key={l.name + l.x + l.y} x={l.x} y={l.y} textAnchor="middle"
            transform={l.vertical ? `rotate(${l.x < 100 ? -90 : 90} ${l.x} ${l.y - 4})` : undefined}
            className="fill-ink-2 font-display" style={{ fontSize:11, fontWeight:700 }}>{l.name}</text>
        ))}
        {!idle && !reduced && [0.045, 0.03, 0.015].map((k, i) => {
          const [tx, ty] = at(u - k)
          return <circle key={k} cx={tx} cy={ty} r={4 + i * 1.5} style={{ fill:'var(--g-main)', opacity:0.15 + i * 0.12 }}/>
        })}
        <circle cx={lx} cy={ly} r="24" fill={`url(#${id}g)`}/>
        <circle cx={lx} cy={ly} r="9.5" style={{ fill:'var(--g-main)' }} stroke="#ffffff" strokeWidth="2.5"/>
        {!idle && (
          <circle cx={dx} cy={dy} r="6" strokeWidth="3"
            style={{ fill: match ? '#ffffff' : 'none', stroke: match ? '#0d2b1e' : '#426a58' }}/>
        )}
      </svg>
      <div className="pointer-events-none absolute inset-[22%] grid place-items-center text-center">
        {children}
      </div>
    </motion.div>
  )
}

export default function Breathing() {
  const g = useGame('breathing')
  const [pattern, setPattern] = React.useState('box')
  const [stage, setStage] = React.useState('idle')      // idle | ready | play | done
  const [held, setHeld] = React.useState(false)
  const [view, setView] = React.useState({ u:0, phase:'In', secs:4, match:true, lap:0, hold:true })
  const [lag, setLag] = React.useState(0)
  const [note, setNote] = React.useState('')
  const [tally, setTally] = React.useState({ sides:0, good:0, laps:0, clean:0, inTime:0, time:0 })

  const P = PATTERNS[pattern]
  const heldRef = React.useRef(false)
  const noteRef = React.useRef(0)
  heldRef.current = held

  React.useEffect(() => {
    if (stage !== 'play') return
    const steps = P.steps, want = wants(steps)
    const cycle = steps.reduce((a, s) => a + s[1], 0)
    const starts = []; let acc = 0
    for (const s of steps) { starts.push(acc); acc += s[2] }
    const t = { sides:0, good:0, laps:0, clean:0, inTime:0, time:0 }
    let side = { i:0, ok:0, all:0 }, lapClean = true, lastLap = 0
    let lagV = 0, id = 0, last = performance.now()
    const t0 = performance.now()
    const tick = now => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now
      const el = Math.max(0, (now - t0) / 1000)
      const lap = Math.floor(el / cycle)
      const into = el - lap * cycle
      let i = 0, a = 0
      for (; i < steps.length - 1; i++) { if (into < a + steps[i][1]) break; a += steps[i][1] }
      const [phase, dur] = steps[i]
      const f = Math.min(1, (into - a) / dur)
      const ff = g.reduced ? Math.floor(f * dur) / dur : f
      const match = heldRef.current === want[i] || (into - a) < GRACE

      /* Close the side that just ended, then the lap. */
      if (i !== side.i || lap !== lastLap) {
        const ratio = side.all ? side.ok / side.all : 0
        t.sides++
        const [x, y] = at(starts[side.i] + steps[side.i][2] * 0.9)
        if (ratio >= PASS) { t.good++; g.add(10, { x: x / 2, y: y / 2 - 4 }) }
        else { lapClean = false; g.miss(); noteRef.current = now; setNote('Try the next side.') }
        if (lap !== lastLap) {
          t.laps++
          if (lapClean) { t.clean++; g.add(10, { x:50, y:44, label:'clean lap', sound:'good' }) }
          lapClean = true; lastLap = lap
        }
        g.cue('turn')
        side = { i, ok:0, all:0 }
        setTally({ ...t })
      }
      side.all += dt; t.time += dt
      if (match) { side.ok += dt; t.inTime += dt }
      if (noteRef.current && now - noteRef.current > 1800) { noteRef.current = 0; setNote('') }

      lagV = g.reduced ? (match ? 0 : 1) : lagV + ((match ? 0 : 1) - lagV) * Math.min(1, dt * 10)
      setLag(lagV)
      setView({ u: starts[i] + steps[i][2] * ff, phase, secs: Math.max(1, Math.ceil(dur - (into - a))),
                match, lap, hold: want[i] })

      if (lap >= P.laps) { setTally({ ...t }); setStage('done'); g.finish({ complete:true }); return }
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, pattern])

  const start = () => { g.reset(); setTally({ sides:0, good:0, laps:0, clean:0, inTime:0, time:0 })
    setView({ u:0, phase:'In', secs:4, match:true, lap:0, hold:true }); setNote(''); setStage('ready') }
  const end = () => { setStage('done'); g.finish({ complete:false }) }

  const steady = tally.time ? Math.round(tally.inTime / tally.time * 100) : 0
  const idle = stage === 'idle' || stage === 'ready'

  return (
    <ActivityScreen family="tide" title="Box Breathing">
      <div style={g.vars} className="mx-auto w-full max-w-[34rem]">
        {stage !== 'done' && (
          <>
            <GameBar game={g} className="mb-3">
              {stage === 'play' && (
                <span className="font-display text-ui font-semibold tabular-nums text-ink-2">
                  Lap {Math.min(P.laps, view.lap + 1)} of {P.laps}
                </span>
              )}
            </GameBar>
            <div className="relative mx-auto w-full max-w-[24rem] sm:max-w-[28rem]">
              <Board pattern={pattern} u={view.u} match={view.match} lag={lag}
                idle={idle} held={held} onHold={setHeld} reduced={g.reduced}>
                {stage === 'idle' && (
                  <>
                    <p className="font-display text-row font-bold text-ink">How it works</p>
                    <p className="mt-1 text-fine text-ink-2">Hold the box while the light goes up. Let go while it comes down.</p>
                  </>
                )}
                {stage === 'ready' && (
                  <>
                    <Countdown from={3} onDone={() => setStage('play')}/>
                    <p className="mt-1 text-fine text-ink-2">Hold when the light goes up.</p>
                  </>
                )}
                {stage === 'play' && (
                  <>
                    <p className="font-display text-row font-bold text-ink">{SAY[view.phase]}</p>
                    <p className="font-display text-dial font-bold tabular-nums text-ink">{view.secs}</p>
                    <p className="mt-1 font-display text-ui font-bold" style={{ color:'var(--g-ink)' }}>
                      {view.hold ? 'Hold the box' : 'Let go'}
                    </p>
                  </>
                )}
              </Board>
              <Pops game={g}/>
            </div>
            <p className="mt-2 min-h-[1.5rem] text-center text-fine text-ink-2" aria-live="polite">
              {stage === 'play' ? (note || (view.match ? 'In time.' : 'Off time. Match the light.')) : ''}
            </p>
          </>
        )}

        {stage === 'idle' && (
          <>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {Object.values(PATTERNS).map(o => (
                <Choice key={o.id} on={pattern === o.id} className="px-2 text-center text-fine sm:text-ui"
                  onClick={() => setPattern(o.id)}>{o.label}</Choice>
              ))}
            </div>
            <p className="mt-2 text-center text-sec text-ink">{P.say}</p>
            <p className="mt-1 text-center text-fine text-ink-2">Shorten any rest that feels uncomfortable.</p>
            <Button className="mt-4 w-full" onClick={start}>Start</Button>
            <LevelMeter className="mt-5"/>
            <DidItWork tool="breathing" phase="before" className="mt-4"/>
          </>
        )}

        {stage === 'play' && (
          <div className="flex justify-center">
            <Button size="sm" variant="outline" onClick={end}>End round</Button>
          </div>
        )}

        {stage === 'done' && (
          <EndCard game={g} title={steady >= 80 ? 'In time with the light' : 'Round done'}
            stars={steady >= 85 ? 3 : steady >= 60 ? 2 : 1}
            stats={[['Sides in time', `${tally.good} of ${tally.sides}`],
                    ['Clean laps', `${tally.clean} of ${tally.laps}`],
                    ['Steadiness', `${steady}%`],
                    ['Pattern', P.label]]}
            onAgain={start}>
            <DidItWork tool="breathing" phase="after"/>
          </EndCard>
        )}
      </div>
    </ActivityScreen>
  )
}
