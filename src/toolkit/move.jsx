import React from 'react'
import { Button } from '../ui/button'
import { Check } from '../ui/marks'
import { cn } from '../lib/utils'
import { ActivityScreen } from './shell'
import { DidItWork } from './after'
import { motion } from 'framer-motion'
import { useGame, GameBar, Pops, LevelMeter, Countdown, EndCard, FillRing, SPRING } from './game'

/* Movement Break, as a five move challenge.
 *
 * Each move has twenty seconds and a 3, 2, 1 before it. With the phone in
 * hand, the motion sensor (DeviceMotion) fills a meter as you move: about ten
 * seconds of real movement fills it, and a full meter ends the move early.
 * Points per move: up to 20 for the meter, 10 for finishing, 5 more for a
 * full meter. iPhone asks permission on the Start tap.
 *
 * No sensor (a laptop, a refusal, or no readings in the first second and a
 * half): tap mode. Do the move and tap Done; 30 points a move.
 *
 * WHERE THE READINGS GO. Nowhere. One number is kept for the current frame
 * and overwritten. SAFETY. Every move is gentle and within comfort. */

const MOVES = [
  { id:'reach',     name:'Reach up',       say:'Reach both arms up high. Hold the phone loosely.' },
  { id:'shake',     name:'Shake it out',   say:'Shake your hands and arms loose.' },
  { id:'side',      name:'Side stretch',   say:'Lean gently to one side, then the other.' },
  { id:'shoulders', name:'Shoulder rolls', say:'Roll your shoulders slowly backwards.' },
  { id:'march',     name:'March',          say:'March on the spot. Easy knees.' },
]
const SECS = 20
const FILL_SECS = 10

/* Motion sensor: resolves 'motion' when real readings arrive, 'tap' when not. */
async function openMotion(energy) {
  if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return { mode:'tap', stop:() => {} }
  try {
    const ask = window.DeviceMotionEvent.requestPermission
    if (typeof ask === 'function' && (await ask()) !== 'granted') return { mode:'tap', stop:() => {} }
  } catch { return { mode:'tap', stop:() => {} } }
  let seen = false
  const grav = { x:0, y:0, z:0, ready:false }
  const on = e => {
    let x, y, z
    const a = e.acceleration
    if (a && a.x != null) { x = a.x; y = a.y; z = a.z }
    else {
      const b = e.accelerationIncludingGravity
      if (!b || b.x == null) return
      if (!grav.ready) { Object.assign(grav, { x:b.x, y:b.y, z:b.z, ready:true }) }
      grav.x += (b.x - grav.x) * 0.1; grav.y += (b.y - grav.y) * 0.1; grav.z += (b.z - grav.z) * 0.1
      x = b.x - grav.x; y = b.y - grav.y; z = b.z - grav.z
    }
    seen = true
    const mag = Math.sqrt(x * x + y * y + z * z)
    energy.current += (Math.min(1, mag / 3.5) - energy.current) * 0.25
  }
  window.addEventListener('devicemotion', on)
  const stop = () => window.removeEventListener('devicemotion', on)
  await new Promise(r => setTimeout(r, 1500))
  if (!seen) { stop(); return { mode:'tap', stop:() => {} } }
  return { mode:'motion', stop }
}

export default function MoveBreak() {
  const g = useGame('move')
  const [stage, setStage] = React.useState('idle')     // idle | ready | move | wait | done
  const [i, setI] = React.useState(0)
  const [mode, setMode] = React.useState('probing')    // probing | motion | tap
  const [left, setLeft] = React.useState(SECS)
  const [fill, setFill] = React.useState(0)
  const [live, setLive] = React.useState(0)
  const [done, setDone] = React.useState([])           // { id, fill }
  const energy = React.useRef(0)
  const sensor = React.useRef(null)
  const fillRef = React.useRef(0)
  const modeRef = React.useRef('probing')
  modeRef.current = mode

  React.useEffect(() => () => sensor.current?.stop(), [])

  const move = MOVES[Math.min(i, MOVES.length - 1)]

  const finishMove = React.useCallback((how) => {
    const f = fillRef.current
    if (how === 'motion' || how === 'full') {
      g.add(Math.round(f * 20) + 10, { x:50, y:30, sound:'good' })
      if (how === 'full') setTimeout(() => g.add(5, { x:50, y:44, label:'full meter' }), 220)
    } else if (how === 'tap') {
      g.add(30, { x:50, y:30, sound:'good' })
    }
    if (how === 'skip') g.miss()
    setDone(d => [...d, { id: MOVES[i].id, fill: how === 'skip' ? 0 : how === 'tap' ? 1 : f, skipped: how === 'skip' }])
    if (i + 1 >= MOVES.length) { setTimeout(() => { setStage('done'); g.finish({ complete:true }) }, 500); setStage('wait-end') }
    else { setI(i + 1); setStage('ready') }
  }, [i, g.add, g.finish, g.miss])

  React.useEffect(() => {
    if (stage !== 'move') return
    fillRef.current = 0; setFill(0); energy.current = 0
    let id = 0, last = performance.now()
    const t0 = performance.now()
    const tick = now => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now
      const el = (now - t0) / 1000
      setLeft(Math.max(0, Math.ceil(SECS - el)))
      if (modeRef.current === 'motion') {
        const e = energy.current
        setLive(e)
        fillRef.current = Math.min(1, fillRef.current + (e > 0.08 ? e : 0) * dt / FILL_SECS * 1.6)
        setFill(fillRef.current)
        if (fillRef.current >= 1) { finishMove('full'); return }
        if (el >= SECS) { finishMove('motion'); return }
      } else if (el >= SECS) { setStage('wait'); return }
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [stage, i, finishMove])

  const start = async () => {
    g.reset(); setI(0); setDone([]); setLeft(SECS); setStage('ready')
    if (!sensor.current) {
      setMode('probing')
      const s = await openMotion(energy)
      sensor.current = s
      setMode(s.mode)
    }
  }

  const tapMode = mode !== 'motion'
  const moved = done.filter(d => !d.skipped).length
  const avg = done.length ? Math.round(done.reduce((a, d) => a + d.fill, 0) / done.length * 100) : 0

  return (
    <ActivityScreen family="night" title="Movement Break">
      <div style={g.vars} className="mx-auto w-full max-w-[40rem]">
        {stage !== 'done' && (
          <GameBar game={g} className="mb-3">
            {stage !== 'idle' && (
              <span className="font-display text-ui font-semibold tabular-nums text-ink-2">
                Move {Math.min(i + 1, MOVES.length)} of {MOVES.length}
              </span>
            )}
          </GameBar>
        )}

        {stage !== 'done' && (
          <ol className="mb-4 grid grid-cols-5 gap-1.5" aria-label="Moves">
            {MOVES.map((m, k) => {
              const d = done.find(x => x.id === m.id)
              const now = k === i && stage !== 'idle'
              return (
                <motion.li key={m.id} className={cn('relative grid h-11 place-items-center overflow-hidden rounded-[12px] border font-display text-ui tabular-nums',
                  now ? 'border-ink font-bold text-ink shadow-card' : 'border-rule text-ink-2')}
                  animate={g.reduced ? undefined : { scale: now ? 1.06 : 1, y: now ? -2 : 0 }} transition={SPRING}
                  style={{ background: d && !d.skipped ? 'linear-gradient(135deg, var(--g-main), var(--g-ink))' : now ? 'var(--g-wash)' : '#ffffff',
                           borderColor: d && !d.skipped ? 'transparent' : undefined }}>
                  {d && !d.skipped
                    ? <motion.span initial={g.reduced ? false : { scale:0, rotate:-60 }} animate={{ scale:1, rotate:0 }} transition={SPRING}>
                        <Check aria-hidden className="size-5 text-paper"/>
                      </motion.span>
                    : <span aria-hidden>{k + 1}</span>}
                  <span className="sr-only">{m.name}{d ? (d.skipped ? ', skipped' : ', done') : ''}</span>
                </motion.li>
              )
            })}
          </ol>
        )}

        {stage === 'idle' && (
          <div>
            <p className="font-display text-row font-bold text-ink">Five moves, twenty seconds each</p>
            <p className="mt-1 text-sec text-ink-2">Hold your phone as you move. The meter fills as you move.</p>
            <Button className="mt-4 w-full sm:w-auto sm:min-w-[12rem]" onClick={start}>Start</Button>
            <p className="mt-2 text-fine text-ink-2">Gentle moves only. Stop if anything hurts.</p>
            <LevelMeter className="mt-5"/>
            <DidItWork tool="move" phase="before" className="mt-4"/>
          </div>
        )}

        {stage === 'ready' && (
          <div className="grid place-items-center py-6 text-center">
            <p className="font-display text-ui font-semibold text-ink-2">{i === 0 ? 'First' : 'Next'}</p>
            <p className="font-display text-head font-bold text-ink">{move.name}</p>
            <div className="mt-3 h-24"><Countdown key={i} from={3} onDone={() => setStage('move')}/></div>
            <p className="mt-2 text-fine text-ink-2">
              {mode === 'probing' ? 'Checking the motion sensor.' : mode === 'motion' ? 'Motion sensor on.' : 'No motion sensor. Tap Done after each move.'}
            </p>
          </div>
        )}

        {(stage === 'move' || stage === 'wait' || stage === 'wait-end') && (
          <div className="relative">
            <div className="grid items-center gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
              <FillRing value={tapMode ? 1 - left / SECS : fill} ring={g.ring} className="mx-auto w-48">
                <p className="font-display text-dial font-bold tabular-nums text-ink">{left}</p>
                <p className="font-display text-fine font-semibold text-ink-2">seconds</p>
              </FillRing>
              <div className="text-center sm:text-left">
                <p key={move.id} className={cn('font-display text-head font-bold text-ink', !g.reduced && 'g-in')}>{move.name}</p>
                <p className="mt-1 font-display text-ui font-bold" style={{ color:'var(--g-ink)' }}>Do this now</p>
                <p className="text-sec text-ink">{move.say}</p>
                {!tapMode && (
                  <div className="mt-3">
                    <div className="flex items-baseline justify-between">
                      <span className="font-display text-ui font-semibold text-ink-2">Meter</span>
                      <span className="font-display text-ui font-bold tabular-nums text-ink">{Math.round(fill * 100)}%</span>
                    </div>
                    <div className="relative mt-1.5 h-5 overflow-hidden rounded-full bg-white shadow-[inset_0_1px_3px_rgba(13,43,30,0.18)]">
                      <div className="absolute inset-0 rounded-full" style={{ transform:`translateX(${(fill - 1) * 100}%)`,
                        background:'linear-gradient(90deg, var(--g-ink), var(--g-main))' }}>
                        {!g.reduced && <span className="g-sheen absolute inset-y-0 w-1/3"/>}
                      </div>
                    </div>
                    <p className="mt-1.5 text-fine text-ink-2">{live > 0.08 ? 'Moving. Keep going.' : 'Move to fill it.'}</p>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap justify-center gap-2.5 sm:justify-start">
                  {tapMode && (
                    <Button className="min-w-[9rem]" disabled={stage === 'wait-end' || left > SECS - 5}
                      onClick={() => finishMove('tap')}>
                      {stage === 'wait' ? 'Done' : left > SECS - 5 ? 'Move first' : 'Done'}
                    </Button>
                  )}
                  <Button variant="outline" size={tapMode ? 'md' : 'sm'} disabled={stage === 'wait-end'}
                    onClick={() => finishMove('skip')}>Skip</Button>
                </div>
              </div>
            </div>
            <Pops game={g}/>
          </div>
        )}

        {stage === 'done' && (
          <EndCard game={g} title={moved === MOVES.length ? 'All five moves done' : 'Break done'}
            stars={moved >= MOVES.length ? 3 : moved >= 3 ? 2 : 1}
            stats={[['Moves done', `${moved} of ${MOVES.length}`],
                    tapMode ? ['Mode', 'Tap'] : ['Meter average', `${avg}%`]]}
            onAgain={start}>
            <DidItWork tool="move" phase="after"/>
          </EndCard>
        )}
      </div>
    </ActivityScreen>
  )
}
