import React from 'react'
import { Button } from '../ui/button'
import { ArrowRight, Cross } from '../ui/marks'
import { ActivityScreen, OnDevice, Choice } from './shell'
import { PATTERNS, pacerSchedule, phaseAt, renderPacerWav } from './wav'
import { useReduced } from './useReduced'
import { DidItWork } from './after'

/* Pocket pacer: the pacer that keeps going when the phone locks. The session
 * is rendered to a WAV (src/toolkit/wav.js) ahead of the tap, so Start is a
 * synchronous audio.play() that survives the lock screen. The phase is read
 * from audio.currentTime, so word and sound never drift. */

const MINUTES = [5, 10]
const SAY = { 'In':'Breathe in', 'Out':'Breathe out', 'Rest':'Rest', 'In again':'In again', 'Done':'Done' }

const hasSession = () => typeof navigator !== 'undefined' && 'mediaSession' in navigator
const quiet = fn => { try { fn() } catch { /* unsupported */ } }

const Pause = p => (
  <svg viewBox="0 0 24 24" width={18} height={18} fill="none" aria-hidden stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" className="shrink-0" {...p}>
    <path d="M8.5 5v14M15.5 5v14"/>
  </svg>
)
const Lock = p => (
  <svg viewBox="0 0 24 24" width={18} height={18} fill="none" aria-hidden stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>
  </svg>
)

const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

/* Under reduced motion the disc holds still and the count carries the pace. */
function Ring({ phase, t, count, still, idle }) {
  const dash = (idle ? 0 : t) * 578
  const scale = phase === 'In' ? 0.46 + 0.54 * t
    : phase === 'Out' ? 1 - 0.54 * t
    : phase === 'In again' ? 0.86 + 0.14 * t
    : phase === 'Rest' ? 1 : 0.46
  return (
    <div className="relative mx-auto grid aspect-square w-full max-w-[22rem] place-items-center
      sm:max-w-[26rem]">
      <svg viewBox="0 0 200 200" aria-hidden focusable="false" className="absolute inset-0 size-full">
        <circle cx="100" cy="100" r="92" fill="none" className="stroke-rule" strokeWidth="4"/>
        <circle cx="100" cy="100" r="92" fill="none" className="kit-s" strokeWidth="7"
          strokeLinecap="round" transform="rotate(-90 100 100)"
          strokeDasharray={`${dash} 578`}/>
        <circle cx="100" cy="100" r="68" className="kit-f-tint kit-s-art" strokeWidth="3"
          style={{ transformBox:'fill-box', transformOrigin:'center',
                   transform:`scale(${still || idle ? 0.78 : scale})` }}/>
      </svg>
      <div className="relative text-center">
        <p className="font-display text-row font-bold tracking-tight text-ink" aria-live="polite">
          {idle ? 'Ready' : SAY[phase]}
        </p>
        <p className="mt-1 font-display text-dial font-bold tabular-nums text-ink">
          {idle || phase === 'Done' ? '' : count}
        </p>
      </div>
    </div>
  )
}

export default function Pocket() {
  const reduced = useReduced()
  const [pattern, setPattern] = React.useState('box')
  const [minutes, setMinutes] = React.useState(5)
  const [state, setState] = React.useState('idle')     // idle | playing | paused | done
  const [ready, setReady] = React.useState(false)
  const [blocked, setBlocked] = React.useState(false)
  const [gen, setGen] = React.useState(0)
  const [frame, setFrame] = React.useState({ phase:'In', t:0, count:4, left:0 })

  const audio = React.useRef(null)
  const url = React.useRef(null)
  const sched = React.useRef(pacerSchedule('box', 5))
  const stopRef = React.useRef(() => {})

  /* The file is made when the choice changes. */
  React.useEffect(() => {
    let live = true
    setReady(false)
    sched.current = pacerSchedule(pattern, minutes)
    setFrame({ phase:'In', t:0, count:4, left:sched.current.seconds })
    renderPacerWav({ pattern, minutes }).then(u => {
      if (!live) { URL.revokeObjectURL(u); return }
      url.current = u
      setReady(true)
    }).catch(() => { if (live) setReady(false) })
    return () => {
      live = false
      if (url.current) { URL.revokeObjectURL(url.current); url.current = null }
    }
  }, [pattern, minutes, gen])

  /* The lock screen's controls, where the browser has them. */
  const session = React.useCallback(on => {
    if (!hasSession()) return
    const ms = navigator.mediaSession
    quiet(() => {
      ms.metadata = on ? new window.MediaMetadata({ title:'MindMap pacer', artist:`Breathing, ${minutes} minutes` }) : null
    })
    for (const [act, fn] of [['play', () => audio.current?.play()],
                             ['pause', () => audio.current?.pause()],
                             ['stop', () => stopRef.current()]]) {
      quiet(() => ms.setActionHandler(act, on ? fn : null))
    }
    quiet(() => { ms.playbackState = on ? 'playing' : 'none' })
  }, [minutes])
  const sessionRef = React.useRef(session)
  sessionRef.current = session

  const stop = React.useCallback(() => {
    const a = audio.current
    if (a) { quiet(() => a.pause()); a.removeAttribute('src'); quiet(() => a.load()) }
    session(false)
    setState('idle')
    setGen(g => g + 1)                       // a fresh URL
  }, [session])
  stopRef.current = stop

  /* Start is synchronous: src is set and play() called inside the tap. */
  const start = () => {
    const a = audio.current
    if (!a || !url.current) return
    setBlocked(false)
    if (a.getAttribute('src') !== url.current) a.src = url.current
    session(true)
    const p = a.play()
    if (p?.catch) p.catch(() => { setBlocked(true); session(false) })
  }

  const pause = () => audio.current?.pause()
  const resume = () => { setBlocked(false); const p = audio.current?.play(); if (p?.catch) p.catch(() => setBlocked(true)) }

  /* State follows the element. */
  const onPlay = () => { setState('playing'); quiet(() => { navigator.mediaSession.playbackState = 'playing' }) }
  const onPause = () => {
    const a = audio.current
    if (!a || a.ended || !a.getAttribute('src')) return   // ended, or Stop emptied it
    setState('paused'); quiet(() => { navigator.mediaSession.playbackState = 'paused' })
  }
  const onEnded = () => {
    setState('done')
    setFrame(f => ({ ...f, phase:'Done', t:1, count:0, left:0 }))
    session(false)
  }

  /* The phase from audio.currentTime, once a frame while playing. */
  React.useEffect(() => {
    if (state !== 'playing') return
    let id = 0
    const tick = () => {
      const a = audio.current
      if (a) setFrame(phaseAt(sched.current, a.currentTime))
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [state])

  /* Leaving the screen ends the sound. */
  React.useEffect(() => () => {
    quiet(() => audio.current?.pause())
    sessionRef.current(false)
  }, [])

  const idle = state === 'idle'
  const running = state === 'playing' || state === 'paused'

  return (
    <ActivityScreen family="leaf" title="Pocket Pacer">
      <audio ref={audio} controls playsInline muted={false} preload="auto"
        className="sr-only" aria-label="Pacer sound"
        onPlay={onPlay} onPause={onPause} onEnded={onEnded}/>

      <Ring phase={frame.phase} t={frame.t} count={frame.count} still={reduced} idle={idle}/>

      <p className="mx-auto mt-2 max-w-[32rem] text-center font-display text-ui font-semibold
        tabular-nums text-ink-2" aria-live="polite">
        {blocked ? 'Tap Start again'
          : running ? `${mmss(frame.left)} left`
          : state === 'done' ? `${minutes} minutes done`
          : ready ? `${mmss(sched.current.seconds)} left` : 'Preparing'}
      </p>

      <div className="mx-auto mt-4 flex w-full max-w-[32rem] flex-wrap justify-center gap-2.5">
        {state === 'playing' && (
          <Button size="sm" className="min-w-[9rem]" onClick={pause}><Pause/>Pause</Button>
        )}
        {state === 'paused' && (
          <Button size="sm" className="min-w-[9rem]" onClick={resume}><ArrowRight/>Resume</Button>
        )}
        {!running && (
          <Button size="sm" className="min-w-[9rem]" disabled={!ready} onClick={start}>
            <ArrowRight/>{state === 'done' ? 'Again' : 'Start'}
          </Button>
        )}
        {running && (
          <Button size="sm" variant="outline" className="min-w-[9rem]" onClick={stop}><Cross/>Stop</Button>
        )}
      </div>

      <div className="mx-auto mt-5 grid w-full max-w-[32rem] grid-cols-2 gap-2 sm:grid-cols-4">
        {Object.values(PATTERNS).map(o => (
          <Choice key={o.id} on={pattern === o.id} disabled={running}
            className="px-2 text-center text-fine sm:text-ui"
            onClick={() => setPattern(o.id)}>{o.label}</Choice>
        ))}
      </div>
      <div className="mx-auto mt-2 grid w-full max-w-[32rem] grid-cols-2 gap-2">
        {MINUTES.map(m => (
          <Choice key={m} on={minutes === m} disabled={running} className="text-center"
            onClick={() => setMinutes(m)}>{m} min</Choice>
        ))}
      </div>

      <p className="mx-auto mt-3 flex max-w-[32rem] items-center justify-center gap-2 text-center
        text-fine text-ink-2">
        <Lock/>{hasSession() ? 'Lock your phone. The cues keep going.' : 'No lock screen controls here. The sound still plays.'}
      </p>
      <OnDevice className="mx-auto mt-2 max-w-[32rem] justify-center">
        A sound file made on this phone. Nothing is recorded.
      </OnDevice>
      {idle && <DidItWork tool="pocket" phase="before" className="mx-auto mt-4 w-full max-w-[32rem]"/>}
      {state === 'done' && <DidItWork tool="pocket" phase="after" className="mx-auto mt-3 w-full max-w-[32rem]"/>}
    </ActivityScreen>
  )
}
