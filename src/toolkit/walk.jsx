import React from 'react'
import { Button } from '../ui/button'
import { Wave } from '../ui/marks'
import { ActivityScreen, Sheet, OnDevice, Choice } from './shell'
import { createPacer, audioSupported } from './audio'
import { useWakeLock, buzz, cueWords } from './dark'
import { useReduced } from './useReduced'
import { askMotion } from '../signals/motion'
import { countSteps, walkWords } from '../signals/steps'
import { DidItWork } from './after'

/* Short walk: three minutes on foot, the phone counting. Every devicemotion
 * magnitude less one g goes into a buffer for the walk; every two seconds
 * countSteps turns it into a count and a cadence. The Wake Lock holds the
 * screen; a tone and a buzz mark halfway and the end. The walk is never
 * scored as stress: hard movement disqualifies every other reading. The
 * buffer is dropped when the screen closes and nothing is stored. */

const SECONDS = 180
const HALF = 90
const MEASURE_MS = 2000
const ASSUMED_HZ = 50
const TONE_HZ = 220
const RING = 578                                      // 2 * pi * 92

const Play = p => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="currentColor" {...p}>
    <path d="M7 4.5v15l12-7.5z"/>
  </svg>
)
const Stop = p => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="currentColor" {...p}>
    <rect x="6" y="6" width="12" height="12" rx="1.5"/>
  </svg>
)
const Again = p => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4.5v4.5h4.5"/>
  </svg>
)

/* |a| / 9.81 minus 1: zero at rest at any angle. */
const magOf = e => {
  const a = e.accelerationIncludingGravity || e.acceleration
  if (!a || a.x == null) return null
  return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z) / 9.81 - 1
}

const clock = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

function Ring({ t, children }) {
  return (
    <div className="relative mx-auto grid aspect-square w-full max-w-[22rem] place-items-center
      sm:max-w-[26rem]">
      <svg viewBox="0 0 200 200" aria-hidden focusable="false" className="absolute inset-0 size-full">
        <circle cx="100" cy="100" r="92" fill="none" className="stroke-rule" strokeWidth="4"/>
        <circle cx="100" cy="100" r="92" fill="none" className="kit-s" strokeWidth="7"
          strokeLinecap="round" transform="rotate(-90 100 100)"
          strokeDasharray={`${t * RING} ${RING}`}/>
        <circle cx="100" cy="100" r="68" className="kit-f-tint kit-s-art" strokeWidth="3"
          style={{ transformBox:'fill-box', transformOrigin:'center', transform:'scale(0.78)' }}/>
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  )
}

export default function Walk() {
  const reduced = useReduced()
  const [motion, setMotion] = React.useState('off')   // off | asking | on | refused | unsupported
  const [sound, setSound] = React.useState(true)
  const [running, setRunning] = React.useState(false)
  const [elapsed, setElapsed] = React.useState(0)
  const [live, setLive] = React.useState({ steps: 0, perMinute: null })
  const [result, setResult] = React.useState(null)

  const buf = React.useRef([])
  const listener = React.useRef(null)
  const pacer = React.useRef(null)
  const soundOn = React.useRef(true)
  soundOn.current = sound
  const last = React.useRef({ steps: 0, perMinute: null })

  useWakeLock(running)

  const detach = React.useCallback(() => {
    if (listener.current) window.removeEventListener('devicemotion', listener.current)
    listener.current = null
    buf.current = []
  }, [])

  /* `mounted` gates the awaits in start against a prompt resolving late. */
  const mounted = React.useRef(true)
  React.useEffect(() => () => {
    mounted.current = false
    detach()
    pacer.current?.close(); pacer.current = null
  }, [detach])

  const attach = React.useCallback(() => {
    const on = e => {
      const g = magOf(e)
      if (g == null) return
      buf.current.push({ t: performance.now(), g })
    }
    listener.current = on
    window.addEventListener('devicemotion', on)
  }, [])

  const measure = React.useCallback(() => {
    const b = buf.current
    if (b.length < 2) return null
    const span = (b[b.length - 1].t - b[0].t) / 1000
    const hz = span >= 2 ? (b.length - 1) / span : ASSUMED_HZ
    return countSteps(b.map(s => s.g), hz)
  }, [])

  const cue = React.useCallback(() => {
    if (soundOn.current) { pacer.current ||= createPacer(); pacer.current.cue(TONE_HZ, 0.9, 0.07) }
    buzz(30)
  }, [])

  const stop = React.useCallback(() => {
    setRunning(false)
    detach()
    setResult({ ...last.current })
  }, [detach])

  /* The walk clock: a count every two seconds, cues at halfway and the end. */
  React.useEffect(() => {
    if (!running) return
    const t0 = performance.now()
    let id = 0
    let nextMeasure = t0 + MEASURE_MS
    let halfDone = false
    let sawSample = false
    last.current = { steps: 0, perMinute: null }
    setLive({ steps: 0, perMinute: null }); setElapsed(0)
    const tick = now => {
      const el = (now - t0) / 1000
      setElapsed(reduced ? Math.floor(el) : el)
      if (el >= SECONDS) { cue(); stop(); return }
      if (!halfDone && el >= HALF) { halfDone = true; cue() }
      if (!sawSample && buf.current.length) sawSample = true
      if (!sawSample && el > 3 && listener.current) {
        /* DeviceMotionEvent exists but nothing arrives: a laptop. */
        setMotion('unsupported'); detach()
      }
      if (now >= nextMeasure) {
        nextMeasure += MEASURE_MS
        const r = measure()
        if (r) { last.current = { steps: r.steps, perMinute: r.perMinute }; setLive(last.current) }
      }
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [running, reduced, measure, stop, cue, detach])

  const start = async () => {
    setResult(null)
    if (sound) { pacer.current ||= createPacer(); await pacer.current.start() }
    if (!mounted.current) return
    if (typeof DeviceMotionEvent === 'undefined') { setMotion('unsupported'); setRunning(true); return }
    setMotion('asking')
    const ok = await askMotion()
    if (!mounted.current) return
    if (!ok) { setMotion('refused'); setRunning(true); return }
    attach()
    setMotion('on')
    setRunning(true)
  }

  const toggleSound = async () => {
    const next = !sound
    setSound(next)
    if (next) { pacer.current ||= createPacer(); await pacer.current.start() }
  }

  const noSensor = motion === 'refused' || motion === 'unsupported'
  const sensorLine =
    motion === 'refused' ? 'Motion off. The clock still runs.'
    : motion === 'unsupported' ? 'No motion sensor here. The clock still runs.'
    : motion === 'asking' ? 'Asking for motion.'
    : null
  const secs = Math.min(SECONDS, Math.floor(elapsed))
  const left = SECONDS - secs

  return (
    <ActivityScreen family="night" title="Short Walk">
      {result ? (
        <>
        <Sheet className="mx-auto w-full max-w-[32rem]">
          <h3 className="font-display text-row font-bold text-ink">Your Walk</h3>
          <p className="mt-3 font-display text-ui font-semibold text-ink-2">{noSensor ? 'Walked' : 'Steps'}</p>
          <p className="mt-1 font-display text-stat font-bold tabular-nums text-ink">
            {noSensor ? clock(secs) : Math.round(result.steps)}
          </p>
          <p className="mt-2 text-sec text-ink">
            {noSensor ? 'Timed by the clock alone.' : walkWords(result.steps, result.perMinute)}
          </p>
          <p className="mt-2 text-fine text-ink-2">The walk is never scored as stress.</p>
          <Button size="sm" className="mt-4 min-w-[9rem]" onClick={start}><Again/>Again</Button>
        </Sheet>
        <DidItWork tool="walk" phase="after" className="mx-auto mt-3 w-full max-w-[32rem]"/>
        </>
      ) : (
        <>
          <Ring t={running ? Math.min(1, elapsed / SECONDS) : 0}>
            {running ? (
              <>
                <p aria-live="polite" className="font-display text-fig font-bold tabular-nums text-ink">
                  {noSensor ? <span className="text-row">no sensor</span> : live.steps}
                </p>
                <p className="mt-1 font-display text-ui font-semibold text-ink-2">
                  {noSensor ? '' : live.perMinute == null ? 'steps' : `${Math.round(live.perMinute)} per minute`}
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-row font-bold tracking-tight text-ink">Ready</p>
                <p className="mt-1 font-display text-ui font-semibold tabular-nums text-ink-2">0 steps</p>
              </>
            )}
          </Ring>
          <p className="mx-auto mt-2 max-w-[32rem] text-center font-display text-ui font-semibold
            tabular-nums text-ink-2" aria-live="off">
            {clock(left)} left
          </p>
          <div className="mx-auto mt-4 flex w-full max-w-[32rem] flex-wrap justify-center gap-2.5">
            {running ? (
              <Button size="sm" className="min-w-[9rem]" onClick={stop}><Stop/>Stop</Button>
            ) : (
              <Button size="sm" className="min-w-[9rem]" disabled={motion === 'asking'} onClick={start}>
                <Play/>{motion === 'asking' ? 'Asking' : 'Start'}
              </Button>
            )}
            <Choice on={sound} disabled={!audioSupported()} onClick={toggleSound}
              className="inline-flex items-center gap-2"><Wave size={18}/>Sound</Choice>
          </div>
          <p className="mx-auto mt-3 max-w-[32rem] text-center text-fine text-ink-2">
            {sensorLine ?? (running ? cueWords(sound) : 'Three minutes. Keep the screen on.')}
          </p>
          <OnDevice className="mx-auto mt-2 max-w-[32rem] justify-center">
            Motion is measured here and never recorded.
          </OnDevice>
          {!running && <DidItWork tool="walk" phase="before" className="mx-auto mt-4 w-full max-w-[32rem]"/>}
        </>
      )}
    </ActivityScreen>
  )
}
