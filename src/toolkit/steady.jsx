import React from 'react'
import { Button } from '../ui/button'
import { ActivityScreen } from './shell'
import { useWakeLock, buzz, useMounted, readBest, saveBest, HowTo, CountOver, useTopOn } from './dark'
import { useGame, GameBar, Pops, EndCard, useSvgId } from './game'
import { DidItWork } from './after'

/* Hold Still, as a balance game.
 *
 * A marble sits in a bowl and a soft wind pushes it about. Keep it inside the
 * middle circle for the time the stage asks: 5, 8, 12, 16 and then 20
 * seconds. On a phone the tilt comes from deviceorientation, zeroed to how
 * the phone was held when the round began, so a steady hand is the whole
 * skill. On a laptop the board is a joystick: press and drag, or use the
 * arrow keys. Readings are used for the frame they arrive in and dropped. */

const TARGETS = [5, 8, 12, 16, 20]
const STAGE_MAX_S = 30
const CLEAR_S = 1.3
const C = 120, BOWL = 104, MARBLE = 11
const TILT_DEG = 14                // this many degrees is a full tilt
const PUSH = 420                   // px/s^2 at full tilt
const DRAG_PX = 70                 // a drag this long is a full tilt
const DAMP = 1.7

const one = v => (Math.round(v * 10) / 10).toFixed(1)
const zoneFor = s => 32 - s * 2
const clamp1 = v => Math.max(-1, Math.min(1, v))

async function askOrientation() {
  const O = typeof DeviceOrientationEvent !== 'undefined' ? DeviceOrientationEvent : null
  if (!O) return false
  if (typeof O.requestPermission !== 'function') return true
  try { return (await O.requestPermission()) === 'granted' } catch { return false }
}

function Board({ x = 0, y = 0, zone = 30, fill = 0, inside = false, still, cleared = false }) {
  const R = zone + 7, L = 2 * Math.PI * R
  const id = useSvgId('mb')
  return (
    <svg viewBox="0 0 240 240" aria-hidden focusable="false" className="block size-full overflow-visible">
      <defs>
        <radialGradient id={id + 'bowl'} cx="0.5" cy="0.42" r="0.6">
          <stop offset="0" stopColor="#ffffff"/><stop offset="0.8" style={{ stopColor:'var(--g-wash)' }}/>
          <stop offset="1" stopColor="#cfe0d6"/>
        </radialGradient>
        <radialGradient id={id + 'm'} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#ffffff"/>
          <stop offset="0.35" style={{ stopColor: inside ? 'var(--g-main)' : '#cfdcd5' }}/>
          <stop offset="1" style={{ stopColor: inside ? 'var(--g-ink)' : '#6f8b7d' }}/>
        </radialGradient>
        <radialGradient id={id + 'z'}>
          <stop offset="0.6" style={{ stopColor:'var(--g-main)' }} stopOpacity="0.35"/>
          <stop offset="1" style={{ stopColor:'var(--g-main)' }} stopOpacity="0"/>
        </radialGradient>
        <linearGradient id={id + 'r'} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor:'var(--g-main)' }}/><stop offset="1" style={{ stopColor:'var(--g-ink)' }}/>
        </linearGradient>
      </defs>
      <circle cx={C} cy={C} r={BOWL + MARBLE} fill={`url(#${id}bowl)`} className="stroke-ink" strokeWidth="2.5"/>
      <circle cx={C} cy={C} r={BOWL * 0.72} fill="none" className="stroke-rule" strokeWidth="2"/>
      <circle cx={C} cy={C} r={BOWL * 0.45} fill="none" className="stroke-rule" strokeWidth="2"/>
      {inside && <circle cx={C} cy={C} r={zone + 22} fill={`url(#${id}z)`} className={still ? undefined : 'g-breathe'}
        style={{ animationDuration:'1.6s' }}/>}
      <circle cx={C} cy={C} r={zone} style={{ fill:'#ffffff', stroke:'var(--g-main)' }} strokeWidth="3" strokeDasharray="5 4"/>
      <circle cx={C} cy={C} r={R} fill="none" stroke="#e1ebe5" strokeWidth="7"/>
      <circle cx={C} cy={C} r={R} fill="none" strokeWidth="7" strokeLinecap="round"
        transform={`rotate(-90 ${C} ${C})`} strokeDasharray={`${L * Math.min(1, fill)} ${L}`}
        stroke={`url(#${id}r)`}/>
      <ellipse cx={C + x + 3} cy={C + y + 5} rx={MARBLE} ry={MARBLE * 0.8} className="fill-ink" opacity="0.18"/>
      <circle data-marble cx={C + x} cy={C + y} r={MARBLE + (cleared && !still ? 3 : 0)}
        stroke="#0d2b1e" strokeWidth="2" fill={`url(#${id}m)`}/>
      <circle cx={C + x - 3.8} cy={C + y - 4} r="2.8" fill="#ffffff" opacity="0.9"/>
    </svg>
  )
}

export default function Steady() {
  const g = useGame('steady')
  const mounted = useMounted()
  const [stage, setStage] = React.useState('intro')   // intro | count | play | end
  useTopOn(stage === 'end')
  const [frame, setFrame] = React.useState({ x:0, y:0, s:0, inside:false, held:0, mode:'hold', step:'hold', source:'pointer' })
  const [summary, setSummary] = React.useState(null)
  const [tiltOk, setTiltOk] = React.useState(null)
  const tilt = React.useRef({ on:false, last:0, g:0, b:0, g0:null, b0:null, n:0 })
  const drag = React.useRef(null)                     // { sx, sy, x, y }
  const keys = React.useRef({ x:0, y:0 })
  const listener = React.useRef(null)

  useWakeLock(stage === 'play' || stage === 'count')

  const detach = React.useCallback(() => {
    if (listener.current) window.removeEventListener('deviceorientation', listener.current)
    listener.current = null
  }, [])
  React.useEffect(() => detach, [detach])

  const attach = () => {
    detach()
    const T = tilt.current = { on:false, last:0, g:0, b:0, g0:null, b0:null, n:0 }
    const on = e => {
      if (e.gamma == null || e.beta == null) return
      T.on = true; T.last = performance.now(); T.g = e.gamma; T.b = e.beta
    }
    listener.current = on
    window.addEventListener('deviceorientation', on)
  }

  /* arrow keys tilt the board while held */
  React.useEffect(() => {
    if (stage !== 'play') return
    const map = { ArrowLeft:['x', -1], ArrowRight:['x', 1], ArrowUp:['y', -1], ArrowDown:['y', 1] }
    const down = e => { const m = map[e.key]; if (!m) return; e.preventDefault(); keys.current[m[0]] = m[1] * 0.7 }
    const up = e => { const m = map[e.key]; if (!m) return; if (Math.sign(keys.current[m[0]]) === m[1]) keys.current[m[0]] = 0 }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); keys.current = { x:0, y:0 } }
  }, [stage])

  const begin = async () => {
    g.reset(); setSummary(null)
    document.activeElement?.blur?.()
    const ok = await askOrientation()
    if (!mounted.current) return
    if (ok) attach()
    setTiltOk(ok)
    setFrame({ x:0, y:0, s:0, inside:true, held:0, step:'hold', source:'pointer' })
    setStage('count')
  }

  const finish = React.useCallback((r, complete = true) => {
    detach()
    const b = saveBest('steady', r.longest > 0 ? Math.round(r.longest * 10) / 10 : NaN)
    setSummary({ ...r, best: b })
    g.finish({ complete })
    setStage('end')
  }, [g, detach])
  const finishRef = React.useRef(finish); finishRef.current = finish
  const runRef = React.useRef({ cleared:0, longest:0 })

  React.useEffect(() => {
    if (stage !== 'play') return
    let id = 0
    const t0 = performance.now()
    let last = t0, s = 0, step = 'hold', stepAt = t0
    let x = 0, y = 0, vx = 0, vy = 0, held = 0, paid = 0
    const ph = Array.from({ length:4 }, () => Math.random() * 6.28)
    runRef.current = { cleared:0, longest:0 }
    const T = tilt.current
    T.g0 = null; T.b0 = null
    const reset = now => { x = 0; y = 0; vx = 0; vy = 0; held = 0; paid = 0; stepAt = now; step = 'hold' }
    const tick = now => {
      const dt = Math.min(0.04, (now - last) / 1000); last = now
      const t = (now - t0) / 1000
      const sensing = T.on && now - T.last < 1000
      if (sensing && T.g0 == null) { T.g0 = T.g; T.b0 = T.b }
      let tx = keys.current.x, ty = keys.current.y, source = 'pointer'
      if (drag.current) {
        tx = clamp1((drag.current.x - drag.current.sx) / DRAG_PX)
        ty = clamp1((drag.current.y - drag.current.sy) / DRAG_PX)
      } else if (sensing && !tx && !ty) {
        tx = clamp1((T.g - T.g0) / TILT_DEG)
        ty = clamp1((T.b - T.b0) / TILT_DEG)
        source = 'tilt'
      }
      const zone = zoneFor(s)
      if (step === 'hold') {
        const amp = (60 + 28 * s) * (sensing ? 0.6 : 1)
        const wx = amp * (0.6 * Math.sin(t * 0.8 + ph[0]) + 0.4 * Math.sin(t * 2.1 + ph[1]))
        const wy = amp * (0.6 * Math.sin(t * 0.7 + ph[2]) + 0.4 * Math.sin(t * 1.7 + ph[3]))
        vx += (tx * PUSH + wx) * dt
        vy += (ty * PUSH + wy) * dt
        const k = Math.exp(-DAMP * dt)
        vx *= k; vy *= k
        x += vx * dt; y += vy * dt
        const d = Math.hypot(x, y)
        if (d > BOWL) {
          const nx = x / d, ny = y / d, vn = vx * nx + vy * ny
          x = nx * BOWL; y = ny * BOWL
          if (vn > 0) { vx -= 1.4 * vn * nx; vy -= 1.4 * vn * ny }
        }
        const inside = Math.hypot(x, y) < zone
        if (!inside && held > 0.5) g.miss()
        if (inside) {
          held += dt
          runRef.current.longest = Math.max(runRef.current.longest, held)
          if (Math.floor(held) > paid) { paid = Math.floor(held); g.add(2, { x:50, y:12, sound:'tick' }) }
        } else held = 0
        if (held >= TARGETS[s]) {
          runRef.current.cleared += 1
          g.add(15 + 5 * s, { x:50, y:30, sound:'good', label:'Clear' }); buzz(30)
          step = 'clear'; stepAt = now
        } else if ((now - stepAt) / 1000 > STAGE_MAX_S) {
          g.cue('low'); step = 'miss'; stepAt = now
        }
      } else if ((now - stepAt) / 1000 > CLEAR_S) {
        s += 1
        if (s >= TARGETS.length) { finishRef.current({ ...runRef.current }); return }
        reset(now)
        if (sensing) { T.g0 = T.g; T.b0 = T.b }
      }
      setFrame({ x, y, s, inside: Math.hypot(x, y) < zone, held, step, source,
                 left: Math.max(0, STAGE_MAX_S - (now - stepAt) / 1000) })
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [stage]) // eslint-disable-line react-hooks/exhaustive-deps

  const pointer = {
    onPointerDown: e => {
      if (stage !== 'play') return
      e.preventDefault()
      try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* ignored */ }
      drag.current = { sx:e.clientX, sy:e.clientY, x:e.clientX, y:e.clientY }
    },
    onPointerMove: e => { if (drag.current) { drag.current.x = e.clientX; drag.current.y = e.clientY } },
    onPointerUp: () => { drag.current = null },
    onPointerCancel: () => { drag.current = null },
  }

  const measured = 'Tilt is measured here and never recorded.'

  if (stage === 'intro') {
    const best = readBest('steady')
    return (
      <ActivityScreen family="stone" title="Hold Still">
        <div style={g.vars}>
          <HowTo onStart={begin} startLabel="Start stage 1" measured={measured}
            art={<div className="mx-auto w-full max-w-[15rem]"><Board x={14} y={-9} zone={32} fill={0.6} inside still/></div>}
            steps={[
              'Keep the marble in the middle circle. A soft wind pushes it.',
              'Phone: tilt it gently. Laptop: drag on the board or use the arrow keys.',
              best != null ? `Five stages, each a longer hold. Your best hold: ${one(best)} s.`
                : 'Five stages, each a longer hold.',
            ]}>
            <DidItWork tool="steady" phase="before" className="mt-4"/>
          </HowTo>
        </div>
      </ActivityScreen>
    )
  }

  if (stage === 'end' && summary) {
    return (
      <ActivityScreen family="stone" title="Hold Still">
        <EndCard game={g} title={summary.best.isNew && summary.best.before != null ? 'New personal best' : 'Balance done'}
          onAgain={begin} stars={summary.cleared >= TARGETS.length ? 3 : summary.cleared >= 3 ? 2 : 1}
          stats={[
            ['Stages cleared', `${summary.cleared} of ${TARGETS.length}`],
            ['Longest hold', `${one(summary.longest)} s`],
            ['Your best hold', summary.best.best != null ? `${one(summary.best.best)} s` : 'None yet'],
            ['Last target', `${TARGETS[TARGETS.length - 1]} s`],
          ]}>
          <DidItWork tool="steady" phase="after" className="border border-rule"/>
        </EndCard>
      </ActivityScreen>
    )
  }

  const target = TARGETS[frame.s]
  const line = stage !== 'play' ? 'Get ready'
    : frame.step === 'clear' ? 'Stage clear'
    : frame.step === 'miss' ? 'Next one'
    : frame.inside ? `${one(frame.held)} of ${target} s` : 'Back to the middle'
  const how = frame.source === 'tilt' ? 'Tilt the phone gently. Dragging works too.'
    : tiltOk ? 'Drag on the board, or tilt the phone.'
    : 'Drag on the board, or use the arrow keys.'

  return (
    <ActivityScreen family="stone" title="Hold Still">
      <div style={g.vars} className="mx-auto w-full max-w-[34rem]">
        <GameBar game={g}>
          <span className="font-display text-ui font-semibold tabular-nums text-ink-2">
            Stage {frame.s + 1} of {TARGETS.length}
          </span>
        </GameBar>
        <div {...pointer}
          className="relative mx-auto mt-2 aspect-square w-full max-w-[22rem] cursor-grab select-none touch-none
            active:cursor-grabbing sm:max-w-[26rem]">
          <Board x={frame.x} y={frame.y} zone={zoneFor(frame.s)} fill={frame.held / target}
            inside={frame.inside} cleared={frame.step === 'clear'} still={g.reduced}/>
          <Pops game={g}/>
          <CountOver on={stage === 'count'} onDone={() => setStage('play')}/>
        </div>
        <p className="mt-3 text-center font-display text-row font-bold tabular-nums text-ink" aria-live="polite">{line}</p>
        <p className="mt-1 text-center text-fine text-ink-2">Hold {target} seconds in the middle.</p>
        <p className="mt-2 text-center text-fine text-ink-2">{how}</p>
        <p className="mt-1 text-center text-fine text-ink-2">{measured}</p>
        <div className="mt-3 flex justify-center">
          <Button size="sm" variant="outline" onClick={() => finishRef.current({ ...runRef.current }, false)}>End round</Button>
        </div>
      </div>
    </ActivityScreen>
  )
}
