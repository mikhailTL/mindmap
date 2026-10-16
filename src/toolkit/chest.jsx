import React from 'react'
import { Button } from '../ui/button'
import { ActivityScreen, Sheet, OnDevice, Choice } from './shell'
import { createPacer, audioSupported } from './audio'
import { DarkSheet, buzz, cueWords } from './dark'
import { askMotion } from '../signals/motion'
import { breathsFromMotion } from '../signals/breath'

/* Chest Breathing. The phone lies on the chest and counts the breaths.
 *
 * WHAT RUNS. Lying down, the axis through the phone rises and falls once per
 * breath. Every devicemotion event's z (accelerationIncludingGravity, or
 * acceleration where that is all there is) goes into a buffer holding the
 * last sixty seconds; every two seconds breathsFromMotion (src/signals/
 * breath.js) turns that buffer into breaths per minute. The sample rate is
 * measured from the event timestamps and assumed to be 50 Hz until there are
 * enough of them.
 *
 * THE PACER. A soft low tone, and a short buzz on phones that have one, once
 * per breath. The pace starts at the first measured rate and eases down toward
 * six per minute over the three minutes, never below five. Without a
 * measurement it starts at twelve.
 *
 * EYES CLOSED. Start goes dark at once: DarkSheet holds the screen on and a
 * tap anywhere ends. A session is three minutes at most.
 *
 * WHERE THE SAMPLES GO. A sixty-second array, overwritten as it fills, dropped
 * when the screen closes. Only the two rates on the result sheet exist after
 * that, and they are not stored. */

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

const fmt = v => (v == null ? '--' : Math.round(v))

export default function Chest() {
  const [motion, setMotion] = React.useState('off')   // off | asking | on | refused | unsupported
  const [sound, setSound] = React.useState(true)
  const [dark, setDark] = React.useState(false)
  const [bpm, setBpm] = React.useState(null)
  const [count, setCount] = React.useState(0)
  const [elapsed, setElapsed] = React.useState(0)
  const [result, setResult] = React.useState(null)    // { start, end, seconds }

  const buf = React.useRef([])                         // [{ t, z }], last sixty seconds
  const pacer = React.useRef(null)
  const listener = React.useRef(null)
  const soundOn = React.useRef(true)
  soundOn.current = sound
  const rates = React.useRef({ first: null, last: null })
  const live = React.useRef(bpm)
  live.current = bpm

  const detach = React.useCallback(() => {
    if (listener.current) window.removeEventListener('devicemotion', listener.current)
    listener.current = null
    buf.current = []
  }, [])

  React.useEffect(() => () => {
    detach()
    pacer.current?.close(); pacer.current = null
  }, [detach])

  /* The sensor. Samples arrive at the event rate and the buffer is trimmed to
     the last sixty seconds on every event. */
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

  /* The session clock: a measurement every two seconds, a cue every breath,
     and a stop at three minutes. */
  const stop = React.useCallback(() => {
    setDark(false)
    detach()
    setResult({ start: rates.current.first, end: rates.current.last ?? rates.current.first })
  }, [detach])

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
    if (typeof DeviceMotionEvent === 'undefined') { setMotion('unsupported'); setDark(true); return }
    setMotion('asking')
    const ok = await askMotion()
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

  return (
    <ActivityScreen family="pool" title="Chest breathing">
      <DarkSheet on={dark} onStop={stop}>
        <p className="font-display text-fig font-bold tabular-nums text-paper">{count}</p>
        <p aria-live="polite" className="mt-3 font-display text-ui font-semibold text-mist/80">
          {motion === 'on' ? `${fmt(bpm)} per minute` : `${elapsed} s`}
        </p>
      </DarkSheet>

      {result ? (
        <Sheet>
          <h3 className="font-display text-row font-bold text-ink">Your breathing</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Figure label="At the start" value={result.start}/>
            <Figure label="At the end" value={result.end}/>
          </div>
          <p className="mt-4 text-fine text-ink-2">
            A phone on the chest matched a breathing band in a 2025 study of ten adults.
          </p>
          {sensorLine && <p className="mt-2 text-fine text-ink-3">{sensorLine}</p>}
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button size="sm" className="min-w-[9rem]" onClick={start}><Again/>Again</Button>
          </div>
        </Sheet>
      ) : (
        <Sheet>
          <p className="font-display text-row font-bold text-ink">Lie down, phone on the chest.</p>
          <p className="mt-1 text-sec text-ink-2">Start, then close your eyes.</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button size="sm" className="min-w-[9rem]" disabled={motion === 'asking'} onClick={start}>
              <Play/>{motion === 'asking' ? 'Asking' : 'Start'}
            </Button>
            <Choice on={sound} disabled={!audioSupported()} onClick={toggleSound}>
              <span aria-hidden className="mr-2 inline-block size-2 rounded-bar bg-current align-middle"/>
              Sound
            </Choice>
          </div>
          <p aria-live="polite" className="mt-4 font-display text-stat font-bold tabular-nums text-ink">
            {fmt(bpm)}<span className="ml-1.5 text-fine font-semibold text-ink-2">per minute</span>
          </p>
          {sensorLine && <p className="mt-2 text-fine text-ink-3">{sensorLine}</p>}
        </Sheet>
      )}

      <div className="mt-3 space-y-1.5">
        <OnDevice>Motion is measured here and never recorded.</OnDevice>
        <p className="text-fine text-ink-3">{cueWords(sound)}</p>
      </div>
    </ActivityScreen>
  )
}

function Figure({ label, value }) {
  return (
    <div className="rounded-field border-2 border-ink bg-card p-3">
      <p className="font-display text-ui font-semibold text-ink-2">{label}</p>
      <p className="mt-1 font-display text-stat font-bold tabular-nums text-ink">
        {fmt(value)}<span className="ml-1.5 text-fine font-semibold text-ink-2">per minute</span>
      </p>
    </div>
  )
}
