import React from 'react'
import { Button } from '../ui/button'
import { ActivityScreen, OnDevice, Choice, Meter } from './shell'
import { createPacer, createMicMeter, audioSupported } from './audio'
import { useReduced } from './useReduced'
import { DidItWork } from './after'

/* Box Breathing. The pacer ring is the screen.
 *
 * WHAT RUNS. One requestAnimationFrame clock derives phase, count and disc
 * scale from elapsed time, so the ring, the word, the count and the sound
 * agree. The cue is two sine oscillators built in src/toolkit/audio.js; the
 * optional breath level is an AnalyserNode RMS read once a frame and dropped.
 *
 * SAFETY. The rests are four seconds and named as rests. Even, 4-4 has no
 * hold at all, and the one line under the pattern says to shorten any rest
 * that feels uncomfortable. Nothing is counted past this screen. */

const PATTERNS = {
  box:  { id:'box',  label:'Box 4-4-4-4',  steps:[['In', 4], ['Rest', 4], ['Out', 4], ['Rest', 4]] },
  even: { id:'even', label:'Even 4-4',     steps:[['In', 4], ['Out', 4]] },
  long: { id:'long', label:'Longer out 4-6', steps:[['In', 4], ['Out', 6]] },
}

const SAY = { In:'Breathe in', Out:'Breathe out', Rest:'Rest' }

/* The ring: a track, an arc for the phase running down, and a disc that grows
   on the in-breath and shrinks on the out-breath. Under reduced motion the
   disc holds still and the count carries the pace. */
function Ring({ phase, t, secs, scale, still, idle }) {
  const dash = (idle ? 0 : t) * 578
  return (
    <div className="relative mx-auto grid aspect-square w-full max-w-[22rem] place-items-center
      sm:max-w-[26rem]">
      <svg viewBox="0 0 200 200" aria-hidden focusable="false" className="absolute inset-0 size-full">
        <circle cx="100" cy="100" r="92" fill="none" className="stroke-rule" strokeWidth="4"/>
        <circle cx="100" cy="100" r="92" fill="none" className="stroke-accent" strokeWidth="7"
          strokeLinecap="round" transform="rotate(-90 100 100)"
          strokeDasharray={`${dash} 578`}/>
        <circle cx="100" cy="100" r="68" className="fill-accent-wash stroke-accent" strokeWidth="3"
          style={{ transformBox:'fill-box', transformOrigin:'center',
                   transform:`scale(${still ? 0.78 : scale})` }}/>
      </svg>
      <div className="relative text-center">
        <p className="font-display text-row font-bold tracking-tight text-ink">
          {idle ? 'Ready' : SAY[phase]}
        </p>
        <p className="mt-1 font-display text-dial font-bold tabular-nums text-ink">
          {idle ? '' : secs}
        </p>
      </div>
    </div>
  )
}

export default function Breathing() {
  const reduced = useReduced()
  const [pattern, setPattern] = React.useState('box')
  const [running, setRunning] = React.useState(false)
  const [sound, setSound] = React.useState(false)
  const [mic, setMic] = React.useState('off')          // off | asking | on | refused | unsupported
  const [level, setLevel] = React.useState(0)
  const [started, setStarted] = React.useState(false)
  const [frame, setFrame] = React.useState({ phase:'In', t:0, secs:4, scale:0.46 })

  const steps = PATTERNS[pattern].steps
  const cycle = steps.reduce((a, s) => a + s[1], 0)

  const pacer = React.useRef(null)
  const meter = React.useRef(null)
  const t0 = React.useRef(0)
  const lastPhase = React.useRef(-1)
  const soundOn = React.useRef(false)
  soundOn.current = sound

  React.useEffect(() => {
    if (!running) return
    let id = 0
    t0.current = performance.now()
    lastPhase.current = -1
    const tick = now => {
      const el = Math.max(0, (now - t0.current) / 1000)
      const into = el % cycle
      let at = 0, i = 0
      for (; i < steps.length; i++) { if (into < at + steps[i][1]) break; at += steps[i][1] }
      const [phase, dur] = steps[Math.min(i, steps.length - 1)]
      const t = Math.min(1, (into - at) / dur)
      const scale = phase === 'In' ? 0.46 + 0.54 * t
        : phase === 'Out' ? 1 - 0.54 * t
        : (steps[(i - 1 + steps.length) % steps.length]?.[0] === 'In' ? 1 : 0.46)
      setFrame({ phase, t, secs: Math.max(1, Math.ceil(dur - (into - at))), scale })
      if (i !== lastPhase.current) {
        lastPhase.current = i
        if (soundOn.current) {
          pacer.current ||= createPacer()
          pacer.current.cue(phase === 'In' ? 294 : phase === 'Out' ? 196 : 247, 0.42)
        }
      }
      if (meter.current) setLevel(meter.current.read())
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [running, pattern, cycle, steps])

  /* The microphone and the audio context are let go on leaving the screen. */
  React.useEffect(() => () => {
    meter.current?.stop(); meter.current = null
    pacer.current?.close(); pacer.current = null
  }, [])

  const toggleSound = async () => {
    const next = !sound
    setSound(next)
    if (next) { pacer.current ||= createPacer(); await pacer.current.start() }
  }

  const askMic = async () => {
    if (mic === 'on') { meter.current?.stop(); meter.current = null; setMic('off'); setLevel(0); return }
    setMic('asking')
    try { meter.current = await createMicMeter(); setMic('on') }
    catch (e) { setMic(e?.message === 'unsupported' ? 'unsupported' : 'refused') }
  }

  return (
    <ActivityScreen family="tide" title="Box Breathing">
      <Ring {...frame} still={reduced} idle={!started}/>

      <div className="mx-auto mt-5 flex w-full max-w-[32rem] flex-wrap justify-center gap-2.5">
        <Button size="sm" className="min-w-[9rem]"
          onClick={() => { setStarted(true); setRunning(r => !r) }}>
          {running ? 'Pause' : started ? 'Resume' : 'Start'}
        </Button>
        <Choice on={sound} disabled={!audioSupported()} onClick={toggleSound}>Sound</Choice>
        <Choice on={mic === 'on'} onClick={askMic}>
          {mic === 'asking' ? 'Asking' : 'Breath level'}
        </Choice>
      </div>

      <div className="mx-auto mt-5 grid w-full max-w-[32rem] grid-cols-3 gap-2">
        {Object.values(PATTERNS).map(o => (
          <Choice key={o.id} on={pattern === o.id} className="px-2 text-center text-fine sm:text-ui"
            onClick={() => setPattern(o.id)}>{o.label}</Choice>
        ))}
      </div>
      <p className="mx-auto mt-3 max-w-[32rem] text-center text-fine text-ink-2">
        Shorten any rest that feels uncomfortable.
      </p>

      {mic === 'on' && (
        <div className="mx-auto mt-4 w-full max-w-[32rem]">
          <Meter value={level} label="Breath level" right={`${Math.round(level * 100)}%`}/>
          <OnDevice className="mt-2">Audio is measured here and never recorded.</OnDevice>
        </div>
      )}
      {mic === 'refused' && <p className="mt-3 text-center text-fine text-ink-3">Microphone off. The pacer still runs.</p>}
      {mic === 'unsupported' && <p className="mt-3 text-center text-fine text-ink-3">No microphone here. The pacer still runs.</p>}
      {!started && <DidItWork tool="breathing" phase="before" className="mx-auto mt-5 w-full max-w-[32rem]"/>}
      {started && !running && <DidItWork tool="breathing" phase="after" className="mx-auto mt-5 w-full max-w-[32rem]"/>}
    </ActivityScreen>
  )
}
