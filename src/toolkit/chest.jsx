import React from 'react'
import { Button } from '../ui/button'
import { ActivityScreen } from './shell'
import { askMotion } from '../signals/motion'
import { useWakeLock, buzz, useMounted, useHold, readBest, saveBest, HowTo, CountOver, useTopOn } from './dark'
import { useGame, GameBar, Pops, EndCard, useSvgId } from './game'
import { DidItWork } from './after'

/* Breath Counter, as a rhythm game.
 *
 * A wave scrolls across the screen: up is a breath in, down is a breath out.
 * The player's own line is drawn beside it, and each breath scores how much
 * of it was in time. The wave starts at twelve breaths a minute and slows to
 * under eight over eight breaths, with the breath out longer than the breath
 * in.
 *
 * The player's breath comes from one of two places. Holding Space or the pad
 * means "breathing in", letting go means "breathing out". Or the phone lies
 * on the chest and the tilt of the chest rising and falling is read from
 * devicemotion: gravity, smoothed, minus its slow mean, on whichever axis is
 * moving most, and whether it is going up or down. Which way is "in" depends
 * on how the phone lies, so both are tried and the better one is kept.
 * Nothing is stored; the samples are dropped as they are read. */

const BREATHS = 8
const FIRST_S = 5                   // 12 a minute
const LAST_S = 8                    // 7.5 a minute
const IN_SHARE = 0.4                // the breath out is the longer part
const GRACE_S = 0.35                // either side of a turn nobody is marked
const NOW_X = 104
const PX_S = 30
const W = 360, H = 210
const Y = y => 176 - y * 136

const PERIODS = Array.from({ length: BREATHS }, (_, k) => FIRST_S + (LAST_S - FIRST_S) * k / (BREATHS - 1))
const STARTS = PERIODS.reduce((a, p, i) => (a.push(i ? a[i - 1] + PERIODS[i - 1] : 0), a), [])
const TOTAL = STARTS[BREATHS - 1] + PERIODS[BREATHS - 1]

/* Where the wave is at second t: which breath, in or out, its height 0 to 1,
   and how far from the nearest turn. */
function target(t) {
  if (t < 0 || t >= TOTAL) return { k: t < 0 ? -1 : BREATHS, inhale: false, y: 0, edge: 0 }
  let k = 0
  while (k + 1 < BREATHS && STARTS[k + 1] <= t) k++
  const P = PERIODS[k], into = t - STARTS[k], ph = into / P
  const turnIn = P * IN_SHARE
  const inhale = ph < IN_SHARE
  const y = inhale ? (1 - Math.cos(Math.PI * ph / IN_SHARE)) / 2
    : (1 + Math.cos(Math.PI * (ph - IN_SHARE) / (1 - IN_SHARE))) / 2
  const edge = Math.min(into, Math.abs(into - turnIn), P - into)
  return { k, inhale, y, edge }
}

function wavePath(from, to) {
  let d = ''
  for (let t = from; t <= to + 0.001; t += 0.1) {
    const x = NOW_X + (t - (from + (NOW_X / PX_S))) * PX_S
    d += (d ? 'L' : 'M') + x.toFixed(1) + ' ' + Y(target(t).y).toFixed(1)
  }
  return d
}

/* The picture: the wave, the player's line, the now line and the two dots. */
function Wave({ t = -1, trail = [], py = 0, matching = false, still }) {
  const from = t - NOW_X / PX_S
  const to = t + (W - NOW_X) / PX_S
  const tg = target(t)
  const id = useSvgId('wv')
  let trailD = ''
  for (const s of trail) {
    const x = NOW_X - (t - s.t) * PX_S
    if (x < 0) continue
    trailD += (trailD ? 'L' : 'M') + x.toFixed(1) + ' ' + Y(s.y).toFixed(1)
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-hidden focusable="false" className="block w-full">
      <defs>
        <linearGradient id={id + 'b'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff"/><stop offset="1" style={{ stopColor:'var(--g-wash)' }}/>
        </linearGradient>
        <linearGradient id={id + 's'} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor:'var(--g-ink)' }} stopOpacity="0.25"/>
          <stop offset="0.3" style={{ stopColor:'var(--g-main)' }} stopOpacity="0.75"/>
          <stop offset="1" style={{ stopColor:'var(--g-main)' }} stopOpacity="0.35"/>
        </linearGradient>
        <radialGradient id={id + 'g'}>
          <stop offset="0" style={{ stopColor:'var(--g-main)' }} stopOpacity="0.6"/>
          <stop offset="1" style={{ stopColor:'var(--g-main)' }} stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect x="0" y="0" width={W} height={H} rx="14" fill={`url(#${id}b)`}/>
      <path d={`M0 ${Y(0)}H${W}M0 ${Y(1)}H${W}`} className="stroke-rule" strokeWidth="2" strokeDasharray="4 6"/>
      <text x="10" y={Y(1) - 8} className="fill-ink-2 font-display text-[13px] font-semibold">In</text>
      <text x="10" y={Y(0) + 20} className="fill-ink-2 font-display text-[13px] font-semibold">Out</text>
      <path d={wavePath(from, to)} fill="none" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"
        stroke={`url(#${id}s)`}/>
      {trailD && <path d={trailD} fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
        className="stroke-ink"/>}
      <path d={`M${NOW_X} 8V${H - 8}`} className="stroke-ink-3" strokeWidth="2"/>
      <circle cx={NOW_X} cy={Y(tg.y)} r={matching ? 34 : 24} fill={`url(#${id}g)`}/>
      <circle cx={NOW_X} cy={Y(tg.y)} r={matching && !still ? 17 : 14} stroke="#ffffff" strokeWidth="3"
        style={{ fill:'var(--g-main)', transition: still ? 'none' : 'r .15s' }}/>
      <circle cx={NOW_X} cy={Y(py)} r="8" className="fill-card stroke-ink" strokeWidth="4"/>
    </svg>
  )
}

export default function Chest() {
  const g = useGame('chest')
  const mounted = useMounted()
  const [stage, setStage] = React.useState('intro')      // intro | count | play | end
  useTopOn(stage === 'end')
  const [frame, setFrame] = React.useState({ t:-1, trail:[], py:0, matching:false, k:0, source:'tap' })
  const [summary, setSummary] = React.useState(null)
  const [motionOk, setMotionOk] = React.useState(null)    // null | true | false
  const hold = useHold(stage === 'play' || stage === 'count')
  const motion = React.useRef({ on:false, last:0, lp:null, slow:null, v:[0, 0, 0], s:0, ds:0, u:0, at:0 })
  const listener = React.useRef(null)

  useWakeLock(stage === 'play' || stage === 'count')

  const detach = React.useCallback(() => {
    if (listener.current) window.removeEventListener('devicemotion', listener.current)
    listener.current = null
  }, [])
  React.useEffect(() => detach, [detach])

  const attach = () => {
    detach()
    const M = motion.current = { on:false, last:0, lp:null, slow:null, v:[0, 0, 0], s:0, ds:0, u:0, at:0 }
    const on = e => {
      const a = e.accelerationIncludingGravity
      if (!a || a.x == null || a.y == null || a.z == null) return
      const now = performance.now()
      const dt = M.at ? Math.min(0.2, (now - M.at) / 1000) : 0.02
      M.at = now; M.last = now; M.on = true
      const x = [a.x, a.y, a.z]
      if (!M.lp) { M.lp = [...x]; M.slow = [...x]; return }
      const kf = dt / (0.3 + dt), ks = dt / (5 + dt), kv = dt / (8 + dt)
      let best = 0
      for (let i = 0; i < 3; i++) {
        M.lp[i] += (x[i] - M.lp[i]) * kf
        M.slow[i] += (x[i] - M.slow[i]) * ks
        const d = M.lp[i] - M.slow[i]
        M.v[i] += (d * d - M.v[i]) * kv
        if (M.v[i] > M.v[best]) best = i
      }
      const s = M.lp[best] - M.slow[best]
      M.ds += ((s - M.s) / dt - M.ds) * (dt / (0.3 + dt))
      M.s = s
      const thr = Math.sqrt(M.v[best]) * 0.25
      if (M.ds > thr) M.u = 1
      else if (M.ds < -thr) M.u = 0
    }
    listener.current = on
    window.addEventListener('devicemotion', on)
  }

  const begin = async () => {
    g.reset(); setSummary(null)
    document.activeElement?.blur?.()
    if (typeof DeviceMotionEvent !== 'undefined') {
      const ok = await askMotion()
      if (!mounted.current) return
      if (ok) attach()
      setMotionOk(ok)
    } else setMotionOk(false)
    setFrame({ t:-1, trail:[], py:0, matching:false, k:0, source:'tap' })
    setStage('count')
  }

  const finish = React.useCallback((scores, complete = true) => {
    detach()
    const inTime = scores.filter(s => s >= 0.6).length
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    const b = saveBest('chest', scores.length ? Math.round(avg * 100) : NaN)
    setSummary({ inTime, top: scores.length ? Math.max(...scores) : 0, avg, best: b, n: scores.length })
    g.finish({ complete })
    setStage('end')
  }, [g, detach])
  const finishRef = React.useRef(finish); finishRef.current = finish
  const scoresRef = React.useRef([])

  React.useEffect(() => {
    if (stage !== 'play') return
    let id = 0
    const t0 = performance.now()
    let last = t0, py = 0, k = 0, good = [0, 0], bad = [0, 0], wasIn = false, tapped = false
    const trail = []
    scoresRef.current = []
    const tick = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      const t = (now - t0) / 1000
      const tg = target(t)
      if (hold.ref.current) tapped = true
      const M = motion.current
      const sensing = !tapped && M.on && now - M.last < 1000
      /* both readings of the sensor are scored; the better way up wins */
      const pol = good[0] - bad[0] >= good[1] - bad[1] ? 0 : 1
      const u = sensing ? (pol ? 1 - M.u : M.u) : (hold.ref.current ? 1 : 0)
      py += (u - py) * Math.min(1, dt * 3)
      trail.push({ t, y: py })
      while (trail.length && t - trail[0].t > NOW_X / PX_S + 0.2) trail.shift()
      if (tg.k === k && tg.edge > GRACE_S) {
        const want = tg.inhale ? 1 : 0
        if (sensing) {
          for (const p of [0, 1]) { const v = p ? 1 - M.u : M.u; if (v === want) good[p] += dt; else bad[p] += dt }
        } else if (u === want) good[0] += dt; else bad[0] += dt
      }
      if (tg.inhale && !wasIn && tg.k < BREATHS) { g.cue('turn'); buzz(20) }
      if (!tg.inhale && wasIn) g.cue('low')
      wasIn = tg.inhale
      if (tg.k !== k) {
        const p = sensing && good[1] - bad[1] > good[0] - bad[0] ? 1 : 0
        const total = good[p] + bad[p]
        const score = total > 0 ? good[p] / total : 0
        scoresRef.current.push(score)
        const pts = Math.round(score * 20)
        if (score < 0.6) g.miss()
        if (pts > 0) g.add(pts, { x:30, y:18, sound: score >= 0.85 ? 'good' : 'tick',
                                  label: score >= 0.85 ? 'Great' : score >= 0.6 ? 'Good' : '' })
        good = [0, 0]; bad = [0, 0]; k = tg.k
        if (k >= BREATHS) { finishRef.current(scoresRef.current); return }
      }
      const matching = tg.edge > GRACE_S ? u === (tg.inhale ? 1 : 0) : true
      setFrame({ t, trail: trail.slice(), py, matching, k: Math.min(k, BREATHS - 1), source: sensing ? 'motion' : 'tap',
                 inhale: tg.inhale })
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [stage]) // eslint-disable-line react-hooks/exhaustive-deps

  const measured = 'Motion is measured here and never recorded.'

  if (stage === 'intro') {
    const best = readBest('chest')
    return (
      <ActivityScreen family="pool" title="Breath Counter">
        <div style={g.vars}>
          <HowTo onStart={begin} startLabel="Start the wave" measured={measured}
            art={
              <div className="overflow-hidden rounded-panel border-2 border-ink">
                <Wave t={3.2} still/>
              </div>
            }
            steps={[
              'Breathe in as the wave rises. Breathe out as it falls.',
              'Hold Space or the pad while you breathe in. Let go to breathe out.',
              best != null ? `On a phone, lie down with it on your chest. Your best so far: ${best}% in time.`
                : 'On a phone, lie down and rest it on your chest. It senses your breathing.',
            ]}>
            <DidItWork tool="chest" phase="before" className="mt-4"/>
          </HowTo>
        </div>
      </ActivityScreen>
    )
  }

  if (stage === 'end' && summary) {
    return (
      <ActivityScreen family="pool" title="Breath Counter">
        <EndCard game={g} title={summary.best.isNew && summary.best.before != null ? 'New personal best' : 'Wave done'}
          onAgain={begin} stars={summary.inTime >= 6 ? 3 : summary.inTime >= 3 ? 2 : 1}
          stats={[
            ['Breaths in time', `${summary.inTime} of ${BREATHS}`],
            ['Best breath', `${Math.round(summary.top * 100)}%`],
            ['Pace at the end', `${Math.round(60 / LAST_S)} a minute`],
            ['Your best round', summary.best.best != null ? `${summary.best.best}%` : 'None yet'],
          ]}>
          <DidItWork tool="chest" phase="after" className="border border-rule"/>
        </EndCard>
      </ActivityScreen>
    )
  }

  const source = frame.source === 'motion' ? 'Sensing your breathing. Touch the pad to use taps instead.'
    : motionOk ? 'Hold while breathing in. Or lay the phone on your chest.'
    : 'Hold while breathing in. Let go to breathe out.'
  return (
    <ActivityScreen family="pool" title="Breath Counter">
      <div style={g.vars} className="mx-auto w-full max-w-[40rem]">
        <GameBar game={g}>
          <span className="font-display text-ui font-semibold tabular-nums text-ink-2">
            Breath {frame.k + 1} of {BREATHS}
          </span>
        </GameBar>
        <div className="relative mt-2 select-none overflow-hidden rounded-panel border-2 border-ink touch-none"
          {...hold.bind}>
          <Wave t={frame.t} trail={frame.trail} py={frame.py} matching={frame.matching} still={g.reduced}/>
          <Pops game={g}/>
          <CountOver on={stage === 'count'} onDone={() => setStage('play')}/>
        </div>
        <p className="mt-3 text-center font-display text-row font-bold text-ink" aria-live="polite">
          {stage !== 'play' ? 'Get ready' : frame.inhale ? 'Breathe in' : 'Breathe out'}
        </p>
        <Button {...hold.bind} aria-pressed={hold.held} variant={hold.held ? 'solid' : 'outline'}
          className="mt-3 w-full touch-none select-none">
          {hold.held ? 'Breathing in' : 'Hold to breathe in'}
        </Button>
        <p className="mt-2 text-center text-fine text-ink-2">{source}</p>
        <p className="mt-1 text-center text-fine text-ink-2">{measured}</p>
        <div className="mt-3 flex justify-center">
          <Button size="sm" variant="outline" onClick={() => finishRef.current(scoresRef.current, false)}>End round</Button>
        </div>
      </div>
    </ActivityScreen>
  )
}
