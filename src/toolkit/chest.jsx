import React from 'react'
import { Button } from '../ui/button'
import { Wave } from '../ui/marks'
import { ActivityScreen, Sheet, OnDevice, Choice } from './shell'
import { createPacer, audioSupported } from './audio'
import { DarkSheet, buzz, cueWords } from './dark'
import { askMotion } from '../signals/motion'
import { breathsFromMotion } from '../signals/breath'
import { DidItWork } from './after'

/* Chest Breathing: the phone lies on the chest and counts the breaths. Every
 * devicemotion z goes into a sixty-second buffer; every two seconds
 * breathsFromMotion turns it into breaths per minute. A tone and a buzz cue
 * each breath, easing from the first measured rate toward six per minute.
 * Start goes dark at once: DarkSheet holds the screen, a tap ends. The buffer
 * is dropped when the screen closes and nothing is stored. */

const SECONDS = 180
const WINDOW_MS = 60_000
const ASSUMED_HZ = 50
const FLOOR = 5
const TARGET = 6
const FALLBACK_RATE = 12
const TONE_HZ = 196

const Play = p => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="currentColor" {...p}>
    <path d="M7 4.5v15l12-7.5z"/>
  </svg>
)
const Again = p => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4.5v4.5h4.5"/>
  </svg>
)

const axisOf = e => {
  const g = e.accelerationIncludingGravity
  if (g && g.z != null) return g.z
  const a = e.acceleration
  if (a && a.z != null) return a.z
  return null
}

/* The idle ring. The screen is dark while the session runs. */
function Ring() {
  return (
    <div className="relative mx-auto grid aspect-square w-full max-w-[22rem] place-items-center
      sm:max-w-[26rem]">
      <svg viewBox="0 0 200 200" aria-hidden focusable="false" className="absolute inset-0 size-full">
        <circle cx="100" cy="100" r="92" fill="none" className="stroke-rule" strokeWidth="4"/>
        <circle cx="100" cy="100" r="68" className="kit-f-tint kit-s-art" strokeWidth="3"
          style={{ transformBox:'fill-box', transformOrigin:'center', transform:'scale(0.78)' }}/>
      </svg>
      <p className="relative font-display text-row font-bold tracking-tight text-ink">Ready</p>
    </div>
  )
}

export default function Chest() {
  const [motion, setMotion] = React.useState('off')   // off | asking | on | refused | unsupported
  const [sound, setSound] = React.useState(true)
  const [dark, setDark] = React.useState(false)
  const [bpm, setBpm] = React.useState(null)
  const [count, setCount] = React.useState(0)
  const [elapsed, setElapsed] = React.useState(0)
  const [result, setResult] = React.useState(null)

  const buf = React.useRef([])
  const pacer = React.useRef(null)
  const listener = React.useRef(null)
  const soundOn = React.useRef(true)
  soundOn.current = sound
  const rates = React.useRef({ first: null, last: null })

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
      const z = axisOf(e)
      if (z == null) return
      const t = performance.now()
      const b = buf.current
      b.push({ t, z })
      while (b.length && t - b[0].t > WINDOW_MS) b.shift()
    }
    listener.current = on
    window.addEventListener('devicemotion', on)
  }, [])

  const measure = React.useCallback(() => {
    const b = buf.current
    if (b.length < 2) return null
    const span = (b[b.length - 1].t - b[0].t) / 1000
    const hz = span >= 2 ? (b.length - 1) / span : ASSUMED_HZ
    const r = breathsFromMotion(b.map(s => s.z), hz)
    return r.perMinute == null ? null : Math.max(2, Math.min(40, r.perMinute))
  }, [])

  const stop = React.useCallback(() => {
    setDark(false)
    detach()
    setResult({ start: rates.current.first, end: rates.current.last ?? rates.current.first })
  }, [detach])

  /* The session clock: a measurement every two seconds, a cue every breath. */
  React.useEffect(() => {
    if (!dark) return
    const t0 = performance.now()
    let id = 0
    let nextMeasure = t0 + 2000
    let nextCue = t0 + 1500
    let rate0 = null
    let sawSample = false
    let n = 0
    rates.current = { first: null, last: null }
    setCount(0); setBpm(null); setElapsed(0)
    const tick = now => {
      const el = (now - t0) / 1000
      setElapsed(Math.floor(el))
      if (el >= SECONDS) { stop(); return }
      if (!sawSample && buf.current.length) sawSample = true
      if (!sawSample && el > 3 && listener.current) {
        /* DeviceMotionEvent exists but nothing arrives: a laptop. */
        setMotion('unsupported'); detach()
      }
      if (now >= nextMeasure) {
        nextMeasure += 2000
        const r = measure()
        if (r != null) {
          setBpm(r)
          if (rates.current.first == null) rates.current.first = r
          rates.current.last = r
          if (rate0 == null) rate0 = r
        }
      }
      if (now >= nextCue) {
        const base = rate0 ?? FALLBACK_RATE
        const eased = base > TARGET ? TARGET + (base - TARGET) * Math.max(0, 1 - el / SECONDS) : base
        const rate = Math.max(FLOOR, eased)
        nextCue = now + 60_000 / rate
        n += 1
        setCount(n)
        if (soundOn.current) { pacer.current ||= createPacer(); pacer.current.cue(TONE_HZ, 1.4, 0.06) }
        buzz(20)
      }
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [dark, measure, stop, detach])

  const start = async () => {
    setResult(null)
    if (sound) { pacer.current ||= createPacer(); await pacer.current.start() }
    if (!mounted.current) return
    if (typeof DeviceMotionEvent === 'undefined') { setMotion('unsupported'); setDark(true); return }
    setMotion('asking')
    const ok = await askMotion()
    if (!mounted.current) return
    if (!ok) { setMotion('refused'); setDark(true); return }
    attach()
    setMotion('on')
    setDark(true)
  }

  const toggleSound = async () => {
    const next = !sound
    setSound(next)
    if (next) { pacer.current ||= createPacer(); await pacer.current.start() }
  }

  const sensorLine =
    motion === 'refused' ? 'Motion off. The pacer still runs.'
    : motion === 'unsupported' ? 'No motion sensor here. The pacer still runs.'
    : motion === 'asking' ? 'Asking for motion.'
    : null
  const measured = result?.end != null

  return (
    <ActivityScreen family="pool" title="Chest Breathing">
      <DarkSheet on={dark} onStop={stop} line={`${cueWords(sound)} Tap to stop.`}>
        <p className="font-display text-fig font-bold tabular-nums text-paper">{count}</p>
        <p aria-live="polite" className="mt-3 font-display text-ui font-semibold text-mist/80">
          {bpm == null ? `${elapsed} s` : `${Math.round(bpm)} per minute`}
        </p>
      </DarkSheet>

      {result ? (
        <>
          <Sheet className="mx-auto w-full max-w-[32rem]">
            <h3 className="font-display text-row font-bold text-ink">Your Breathing</h3>
            <p className="mt-3 font-display text-ui font-semibold text-ink-2">{measured ? 'At the end' : 'Time'}</p>
            <p className="mt-1 font-display text-stat font-bold tabular-nums text-ink">
              {measured ? Math.round(result.end) : elapsed}
              <span className="ml-1.5 text-fine font-semibold text-ink-2">{measured ? 'per minute' : 's'}</span>
            </p>
            <p className="mt-2 text-fine text-ink-2">
              {measured ? `${Math.round(result.start)} per minute at the start.` : sensorLine ?? 'No measurement here.'}
            </p>
            <Button size="sm" className="mt-4 min-w-[9rem]" onClick={start}><Again/>Again</Button>
          </Sheet>
          <DidItWork tool="chest" phase="after" className="mx-auto mt-3 w-full max-w-[32rem]"/>
        </>
      ) : (
        <>
          <Ring/>
          <div className="mx-auto mt-4 flex w-full max-w-[32rem] flex-wrap justify-center gap-2.5">
            <Button size="sm" className="min-w-[9rem]" disabled={motion === 'asking'} onClick={start}>
              <Play/>{motion === 'asking' ? 'Asking' : 'Start'}
            </Button>
            <Choice on={sound} disabled={!audioSupported()} onClick={toggleSound}
              className="inline-flex items-center gap-2"><Wave size={18}/>Sound</Choice>
          </div>
          <p className="mx-auto mt-3 max-w-[32rem] text-center text-fine text-ink-2">
            {sensorLine ?? 'Lie down, phone on your chest, eyes closed.'}
          </p>
          <OnDevice className="mx-auto mt-2 max-w-[32rem] justify-center">
            Motion is measured here and never recorded.
          </OnDevice>
          {!dark && <DidItWork tool="chest" phase="before" className="mx-auto mt-4 w-full max-w-[32rem]"/>}
        </>
      )}
    </ActivityScreen>
  )
}
