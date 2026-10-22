import React from 'react'
import { Button } from '../ui/button'
import { ActivityScreen, Choice } from './shell'
import { useWakeLock, buzz, useMounted, readBest, saveBest, HowTo, CountOver, useTopOn } from './dark'
import { askMotion } from '../signals/motion'
import { countSteps } from '../signals/steps'
import { useGame, GameBar, Pops, EndCard, useSvgId } from './game'
import { DidItWork } from './after'

const GOALS = [
  { id:'short', name:'Short', steps:150, secs:90 },
  { id:'lap',   name:'Lap',   steps:300, secs:180 },
  { id:'long',  name:'Long',  steps:600, secs:360 },
]
const FLAGS = [0.25, 0.5, 0.75]
const MEASURE_MS = 2000
const ASSUMED_HZ = 50
const NO_SENSOR_S = 3

const TRAIL = 'M30 214C84 214 96 172 150 172S266 182 270 132S200 92 146 98S40 84 62 46S206 22 292 30'

// Acceleration magnitude in g, minus 1 g of gravity, fed to countSteps.
const magOf = e => {
  const a = e.accelerationIncludingGravity || e.acceleration
  if (!a || a.x == null) return null
  return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z) / 9.81 - 1
}
const clock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

function Trail({ p = 0 }) {
  const ref = React.useRef(null)
  const [pts, setPts] = React.useState(null)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el?.getTotalLength) return
    try {
      const L = el.getTotalLength()
      const at = f => { const q = el.getPointAtLength(L * f); return { x:q.x, y:q.y } }
      setPts({ L, at, flags: FLAGS.map(at), end: at(1) })
    } catch { /* no layout, as in a test runner */ }
  }, [])
  const v = Math.max(0, Math.min(1, p))
  const me = pts ? pts.at(v) : { x:30, y:214 }
  const id = useSvgId('tr')
  return (
    <svg viewBox="0 0 320 240" aria-hidden focusable="false" className="block w-full">
      <defs>
        <linearGradient id={id + 'b'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff"/><stop offset="1" style={{ stopColor:'var(--g-wash)' }}/>
        </linearGradient>
        <linearGradient id={id + 'p'} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" style={{ stopColor:'var(--g-ink)' }}/><stop offset="1" style={{ stopColor:'var(--g-main)' }}/>
        </linearGradient>
        <radialGradient id={id + 'g'}>
          <stop offset="0" style={{ stopColor:'var(--g-main)' }} stopOpacity="0.55"/>
          <stop offset="1" style={{ stopColor:'var(--g-main)' }} stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="320" height="240" rx="14" fill={`url(#${id}b)`}/>
      <circle cx="260" cy="200" r="46" fill="#ffffff" opacity="0.5"/>
      <circle cx="60" cy="120" r="30" fill="#ffffff" opacity="0.5"/>
      <path d={TRAIL} fill="none" stroke="#e1ebe5" strokeWidth="18" strokeLinecap="round"/>
      <path d={TRAIL} fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 9"/>
      <path ref={ref} d={TRAIL} fill="none" strokeWidth="16" strokeLinecap="round" pathLength="100"
        strokeDasharray={`${v * 100} 100`} stroke={`url(#${id}p)`}/>
      {pts && pts.flags.map((f, i) => {
        const got = v >= FLAGS[i]
        return (
          <g key={i} transform={`translate(${f.x} ${f.y})`}>
            <path d="M0 0V-26" className="stroke-ink" strokeWidth="3" strokeLinecap="round"/>
            <path d="M0 -26L16 -20L0 -14Z" className="stroke-ink" strokeWidth="2" strokeLinejoin="round"
              style={{ fill: got ? 'var(--g-main)' : '#ffffff' }}/>
          </g>
        )
      })}
      {pts && (
        <g transform={`translate(${pts.end.x} ${pts.end.y})`}>
          <circle r="13" className="stroke-ink" strokeWidth="3" style={{ fill: v >= 1 ? 'var(--g-main)' : '#ffffff' }}/>
          <path d="M-5 0l3.5 3.5L6 -4" fill="none" className={v >= 1 ? 'stroke-card' : 'stroke-ink-3'} strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      )}
      <circle cx={me.x} cy={me.y} r="26" fill={`url(#${id}g)`}/>
      <circle cx={me.x} cy={me.y} r="10" className="fill-card stroke-ink" strokeWidth="4"/>
    </svg>
  )
}

export default function Walk() {
  const g = useGame('walk')
  const mounted = useMounted()
  const [goalId, setGoalId] = React.useState('lap')
  const [stage, setStage] = React.useState('intro')     // intro | count | play | end
  useTopOn(stage === 'end')
  const [mode, setMode] = React.useState('steps')        // steps | clock
  const [live, setLive] = React.useState({ p:0, steps:0, secs:0 })
  const [summary, setSummary] = React.useState(null)
  const buf = React.useRef([])
  const listener = React.useRef(null)
  const goal = GOALS.find(x => x.id === goalId) || GOALS[1]

  useWakeLock(stage === 'play' || stage === 'count')

  const detach = React.useCallback(() => {
    if (listener.current) window.removeEventListener('devicemotion', listener.current)
    listener.current = null
    buf.current = []
  }, [])
  React.useEffect(() => detach, [detach])

  const attach = () => {
    detach()
    const on = e => {
      const m = magOf(e)
      if (m == null) return
      buf.current.push({ t: performance.now(), g: m })
    }
    listener.current = on
    window.addEventListener('devicemotion', on)
  }

  const begin = async () => {
    g.reset(); setSummary(null)
    document.activeElement?.blur?.()
    let ok = false
    if (typeof DeviceMotionEvent !== 'undefined') {
      ok = await askMotion()
      if (!mounted.current) return
      if (ok) attach()
    }
    setMode(ok ? 'steps' : 'clock')
    setLive({ p:0, steps:0, secs:0 })
    setStage('count')
  }

  const finish = React.useCallback(r => {
    detach()
    const b = r.mode === 'steps' && r.steps > 0 ? saveBest('walk', r.steps) : { best: readBest('walk'), isNew:false, before:null }
    setSummary({ ...r, best: b })
    g.finish({ complete: !!r.done })
    setStage('end')
  }, [g, detach])
  const finishRef = React.useRef(finish); finishRef.current = finish
  const nowRef = React.useRef({ steps:0, secs:0, mode:'steps', p:0 })

  React.useEffect(() => {
    if (stage !== 'play') return
    const t0 = performance.now()
    let id = 0, next = t0 + MEASURE_MS, steps = 0, tenths = 0, flags = 0, m = mode
    nowRef.current = { steps:0, secs:0, mode:m, p:0 }
    const tick = now => {
      const secs = (now - t0) / 1000
      if (m === 'steps' && secs > NO_SENSOR_S && !buf.current.length) {
        // The API exists but no readings arrive, as on a laptop.
        m = 'clock'; setMode('clock'); detach()
      }
      if (m === 'steps' && now >= next) {
        next += MEASURE_MS
        const b = buf.current
        if (b.length > 1) {
          const span = (b[b.length - 1].t - b[0].t) / 1000
          const hz = span >= 2 ? (b.length - 1) / span : ASSUMED_HZ
          steps = countSteps(b.map(s => s.g), hz).steps
        }
      }
      const p = Math.min(1, m === 'steps' ? steps / goal.steps : secs / goal.secs)
      while (tenths < Math.floor(p * 10)) {
        tenths += 1
        if (tenths < 10) g.add(5, { x:50, y:6, sound:'tick' })
      }
      while (flags < FLAGS.length && p >= FLAGS[flags]) {
        flags += 1
        g.add(20, { x:50, y:24, sound:'good', label:'Flag' }); buzz(30)
      }
      nowRef.current = { steps, secs, mode:m, p, flags }
      setLive({ p, steps, secs })
      if (p >= 1) {
        g.add(40, { x:80, y:10, sound:'good', label:'Finish' }); buzz([30, 60, 30])
        finishRef.current({ ...nowRef.current, done:true })
        return
      }
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [stage]) // eslint-disable-line react-hooks/exhaustive-deps

  const measured = 'Motion is measured here and never recorded. A walk is never scored as stress.'

  if (stage === 'intro') {
    const best = readBest('walk')
    return (
      <ActivityScreen family="night" title="Short Walk">
        <div style={g.vars}>
          <HowTo onStart={begin} startLabel={`Walk ${goal.steps} steps`} measured={measured}
            pick={<GoalPicker value={goalId} onChange={setGoalId}/>}
            art={<div className="overflow-hidden rounded-panel border-2 border-ink"><Trail p={0.42}/></div>}
            steps={[
              'Pick a walk. Keep the screen on and the phone in your hand.',
              'Your steps fill the path. Three flags, then the finish.',
              best != null ? `No step sensor? The path fills over time. Most steps so far: ${best}.`
                : 'No step sensor? The path fills over time instead.',
            ]}>
            <DidItWork tool="walk" phase="before" className="mt-4"/>
          </HowTo>
        </div>
      </ActivityScreen>
    )
  }

  if (stage === 'end' && summary) {
    const pace = summary.mode === 'steps' && summary.secs > 10 ? Math.round(summary.steps / (summary.secs / 60)) : null
    return (
      <ActivityScreen family="night" title="Short Walk">
        <EndCard game={g} title={summary.done ? 'Finish reached' : 'Walk done'} onAgain={begin}
          stars={summary.done ? 3 : (summary.flags ?? 0) >= 2 ? 2 : 1}
          stats={[
            ['Steps', summary.mode === 'steps' ? `${summary.steps}` : 'On the clock'],
            ['Time', clock(summary.secs)],
            ['Flags', `${summary.flags ?? 0} of ${FLAGS.length}`],
            pace != null ? ['Pace', `${pace} a minute`]
              : ['Most steps', summary.best.best != null ? `${summary.best.best}` : 'None yet'],
          ]}>
          <DidItWork tool="walk" phase="after" className="border border-rule"/>
        </EndCard>
      </ActivityScreen>
    )
  }

  const left = mode === 'steps' ? `${Math.max(0, goal.steps - live.steps)} steps to go`
    : `${clock(Math.max(0, goal.secs - live.secs))} to go`
  return (
    <ActivityScreen family="night" title="Short Walk">
      <div style={g.vars} className="mx-auto w-full max-w-[34rem]">
        <GameBar game={g}>
          <span className="font-display text-ui font-semibold tabular-nums text-ink-2">{clock(live.secs)}</span>
        </GameBar>
        <div className="relative mt-2 overflow-hidden rounded-panel border-2 border-ink">
          <Trail p={live.p}/>
          <Pops game={g}/>
          <CountOver on={stage === 'count'} onDone={() => setStage('play')}/>
        </div>
        <p className="mt-3 text-center font-display text-row font-bold tabular-nums text-ink" aria-live="polite">
          {stage !== 'play' ? 'Get ready' : mode === 'steps' ? `${live.steps} steps` : 'Timed walk'}
        </p>
        <p className="mt-1 text-center font-display text-ui font-semibold tabular-nums text-ink-2">{left}</p>
        {mode === 'clock' && stage === 'play' && (
          <p className="mt-2 text-center text-fine text-ink-2">No step sensor here. The path fills with time.</p>
        )}
        <p className="mt-2 text-center text-fine text-ink-2">{measured}</p>
        <div className="mt-3 flex justify-center">
          <Button size="sm" variant="outline" onClick={() => finishRef.current({ ...nowRef.current, done:false })}>
            End walk
          </Button>
        </div>
      </div>
    </ActivityScreen>
  )
}

/* The goal picker sits on the how to play screen. */
function GoalPicker({ value, onChange }) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      {GOALS.map(o => (
        <Choice key={o.id} on={value === o.id} className="flex flex-col items-center justify-center px-2 py-1.5 text-center"
          onClick={() => onChange(o.id)}>
          <span className="block">{o.name}</span>
          <span className="block text-fine font-normal">{o.steps} steps</span>
        </Choice>
      ))}
    </div>
  )
}
