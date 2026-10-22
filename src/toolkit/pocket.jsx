import React from 'react'
import { Button } from '../ui/button'
import { ArrowRight, Cross } from '../ui/marks'
import { ActivityScreen, OnDevice, Choice } from './shell'
import { PATTERNS, pacerSchedule, phaseAt, renderPacerWav } from './wav'
import { useWakeLock, useTopOn } from './dark'
import { useGame, Score, Pops, EndCard, LevelMeter, useSvgId } from './game'
import { DidItWork } from './after'

// The session is pre-rendered to a WAV (wav.js) so Start can call play() inside the tap and keep going on the lock screen.
const MINUTES = [2, 5, 10]
const SAY = { 'In':'Breathe in', 'Out':'Breathe out', 'Rest':'Hold', 'In again':'In again', 'Done':'Done' }
const STAR_POINTS = 10

const hasSession = () => typeof navigator !== 'undefined' && 'mediaSession' in navigator
const quiet = fn => { try { fn() } catch { /* unsupported */ } }
const cycleOf = id => (PATTERNS[id] || PATTERNS.box).steps.reduce((a, s) => a + s[1], 0)

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

function Sky({ phase, t, count, still, idle, stars, lit }) {
  const scale = phase === 'In' ? 0.5 + 0.5 * t
    : phase === 'Out' ? 1 - 0.5 * t
    : phase === 'In again' ? 0.88 + 0.12 * t
    : phase === 'Rest' ? (count > 0 ? 1 : 0.5) : 0.5
  const R = 90
  const r = Math.max(2.4, Math.min(6, (Math.PI * R / Math.max(1, stars)) * 0.55))
  const id = useSvgId('sky')
  return (
    <div className="relative mx-auto grid aspect-square w-full max-w-[20rem] place-items-center sm:max-w-[24rem]">
      <svg viewBox="0 0 200 200" aria-hidden focusable="false" className="absolute inset-0 size-full overflow-visible">
        <defs>
          <radialGradient id={id + 'o'} cx="0.4" cy="0.35" r="0.7">
            <stop offset="0" stopColor="#ffffff"/><stop offset="0.55" style={{ stopColor:'var(--g-wash)' }}/>
            <stop offset="1" style={{ stopColor:'var(--g-main)' }} stopOpacity="0.55"/>
          </radialGradient>
          <radialGradient id={id + 'h'}>
            <stop offset="0.55" style={{ stopColor:'var(--g-main)' }} stopOpacity="0.3"/>
            <stop offset="1" style={{ stopColor:'var(--g-main)' }} stopOpacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="96" fill={`url(#${id}h)`} style={{ transformBox:'fill-box', transformOrigin:'center',
          transform:`scale(${still || idle ? 0.85 : 0.7 + scale * 0.35})` }}/>
        {Array.from({ length: stars }, (_, i) => {
          const a = (i / stars) * Math.PI * 2 - Math.PI / 2
          const on = i < lit
          const next = i === lit && !idle
          return <circle key={i} cx={100 + R * Math.cos(a)} cy={100 + R * Math.sin(a)} r={on ? r : r * 0.75}
            style={{ fill: on ? 'var(--g-main)' : next ? '#ffffff' : '#c2d7ca',
                     stroke: next ? 'var(--g-main)' : 'none', strokeWidth: 1.5,
                     transition: still ? 'none' : 'r .3s, fill .3s' }}/>
        })}
        <circle cx="100" cy="100" r="66" strokeWidth="2.5" fill={`url(#${id}o)`}
          style={{ stroke:'var(--g-main)', transformBox:'fill-box', transformOrigin:'center',
                   transform:`scale(${still || idle ? 0.8 : scale})` }}/>
      </svg>
      <div className="relative text-center">
        <p className="font-display text-row font-bold tracking-tight text-ink" aria-live="polite">
          {idle ? `${stars} breaths` : SAY[phase]}
        </p>
        <p className="mt-1 font-display text-dial font-bold tabular-nums text-ink">
          {idle ? '' : phase === 'Done' ? lit : count}
        </p>
      </div>
    </div>
  )
}

export default function Pocket() {
  const g = useGame('pocket')
  const [pattern, setPattern] = React.useState('long')
  const [minutes, setMinutes] = React.useState(2)
  const [state, setState] = React.useState('idle')     // idle | playing | paused | done
  const [ready, setReady] = React.useState(false)
  const [blocked, setBlocked] = React.useState(false)
  const [gen, setGen] = React.useState(0)
  const [frame, setFrame] = React.useState({ phase:'In', t:0, count:4, left:0 })
  const [lit, setLit] = React.useState(0)

  const audio = React.useRef(null)
  const url = React.useRef(null)
  const sched = React.useRef(pacerSchedule('long', 2))
  const stopRef = React.useRef(() => {})
  const paid = React.useRef(0)

  const cycle = cycleOf(pattern)
  const stars = Math.max(1, Math.floor(Math.round(minutes * 60) / cycle))

  useWakeLock(state === 'playing')
  useTopOn(state === 'done')

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
      ms.metadata = on ? new window.MediaMetadata({ title:'MindMap breathing', artist:`${minutes} minutes` }) : null
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

  /* Stars for every breath finished by second `t`. */
  const award = React.useCallback(t => {
    const done = Math.min(stars, Math.floor(t / cycle))
    if (done > paid.current) {
      const n = done - paid.current
      paid.current = done
      setLit(done)
      const a = (done - 1) / stars * Math.PI * 2 - Math.PI / 2
      g.add(n * STAR_POINTS, { x: 50 + 42 * Math.cos(a), y: 46 + 42 * Math.sin(a), sound:'tick' })
    }
  }, [stars, cycle, g])
  const awardRef = React.useRef(award); awardRef.current = award

  const end = React.useCallback(() => {
    session(false)
    if (paid.current > 0) { g.finish({ complete:true }); setState('done') } else setState('idle')
  }, [session, g])

  const stop = React.useCallback(() => {
    const a = audio.current
    if (a) { awardRef.current(a.currentTime || 0); quiet(() => a.pause()); a.removeAttribute('src'); quiet(() => a.load()) }
    end()
    setGen(x => x + 1)                       // a fresh URL
  }, [end])
  stopRef.current = stop

  const start = () => {
    const a = audio.current
    if (!a || !url.current) return
    setBlocked(false)
    g.reset(); paid.current = 0; setLit(0)
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
    awardRef.current(sched.current.seconds)
    setFrame(f => ({ ...f, phase:'Done', t:1, count:0, left:0 }))
    const a = audio.current
    if (a) { a.removeAttribute('src'); quiet(() => a.load()) }
    end()
    setGen(x => x + 1)
  }

  React.useEffect(() => {
    if (state !== 'playing') return
    let id = 0
    const tick = () => {
      const a = audio.current
      if (a) { setFrame(phaseAt(sched.current, a.currentTime)); awardRef.current(a.currentTime) }
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

  const again = () => { g.reset(); paid.current = 0; setLit(0); setState('idle') }

  const idle = state === 'idle'
  const running = state === 'playing' || state === 'paused'
  const pat = PATTERNS[pattern]

  return (
    <ActivityScreen family="leaf" title="Breathing by Sound">
      <audio ref={audio} controls playsInline muted={false} preload="auto"
        className="sr-only" aria-label="Breathing sound"
        onPlay={onPlay} onPause={onPause} onEnded={onEnded}/>

      {state === 'done' ? (
        <EndCard game={g} title={lit >= stars ? 'Every star lit' : 'Breathing done'} onAgain={again}
          stars={lit >= stars ? 3 : lit * 2 >= stars ? 2 : 1}
          className="mx-auto w-full max-w-[40rem]"
          stats={[
            ['Breaths', `${lit} of ${stars}`],
            ['Pattern', pat.label],
            ['Time', mmss(Math.min(sched.current.seconds, lit * cycle))],
            ['Each breath', `${cycle} s`],
          ]}>
          <DidItWork tool="pocket" phase="after" className="border border-rule"/>
        </EndCard>
      ) : (
        <div style={g.vars} className="mx-auto w-full max-w-[34rem]">
          {!idle && <Score game={g}/>}
          <div className="relative mt-1">
            <Sky phase={frame.phase} t={frame.t} count={frame.count} still={g.reduced} idle={idle}
              stars={stars} lit={lit}/>
            <Pops game={g}/>
          </div>

          <p className="mt-2 text-center font-display text-ui font-semibold tabular-nums text-ink-2" aria-live="polite">
            {blocked ? 'Tap Start again'
              : running ? `${mmss(frame.left)} left. ${lit} of ${stars} stars.`
              : ready ? `${mmss(sched.current.seconds)}. Breathe with the sound. Each full breath lights a star.` : 'Making the sound'}
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-2.5">
            {state === 'playing' && (
              <Button size="sm" className="min-w-[9rem]" onClick={pause}><Pause/>Pause</Button>
            )}
            {state === 'paused' && (
              <Button size="sm" className="min-w-[9rem]" onClick={resume}><ArrowRight/>Resume</Button>
            )}
            {!running && (
              <Button className="w-full" disabled={!ready} onClick={start}>
                <ArrowRight/>{ready ? 'Start' : 'Making the sound'}
              </Button>
            )}
            {running && (
              <Button size="sm" variant="outline" className="min-w-[9rem]" onClick={stop}><Cross/>Stop</Button>
            )}
          </div>

          {idle && (
            <>
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Object.values(PATTERNS).map(o => (
                  <Choice key={o.id} on={pattern === o.id}
                    className="px-2 text-center text-fine sm:text-ui"
                    onClick={() => setPattern(o.id)}>{o.label}</Choice>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {MINUTES.map(m => (
                  <Choice key={m} on={minutes === m} className="text-center"
                    onClick={() => setMinutes(m)}>{m} min</Choice>
                ))}
              </div>
              <LevelMeter className="mt-5"/>
            </>
          )}

          <p className="mt-3 flex items-center justify-center gap-2 text-center text-fine text-ink-2">
            <Lock/>{hasSession() ? 'You can lock your phone. The sound keeps playing.' : 'No lock screen controls here. The sound still plays.'}
          </p>
          <OnDevice className="mt-2 justify-center">A sound file made on this phone. Nothing is recorded.</OnDevice>
          {idle && <DidItWork tool="pocket" phase="before" className="mt-4"/>}
        </div>
      )}
    </ActivityScreen>
  )
}
