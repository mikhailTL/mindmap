import React from 'react'
import { Button } from '../ui/button'
import { ActivityScreen, Sheet, Step, Note, OnDevice, Choice, Readout, Meter } from './shell'
import { createPacer, createMicMeter, audioSupported } from './audio'
import { useReduced } from './useReduced'

/* Box Breathing.
 *
 * The pace is held by requestAnimationFrame rather than by a CSS keyframe,
 * because the three things on this screen have to agree to the same clock: the
 * ring, the word, and the sound. A keyframe cannot tell the page which phase it
 * is in, so the previous version of this could only animate a circle and hope.
 *
 * WHAT ACTUALLY RUNS
 *  - the clock: one rAF loop, phase and remaining seconds derived from elapsed
 *    time, so a backgrounded tab resumes on the real wall clock rather than
 *    drifting behind.
 *  - the sound: two sine oscillators through a raised-cosine envelope, built in
 *    the page by src/toolkit/audio.js. Not a file, not a sample, not a fetch.
 *  - the microphone, if asked: an AnalyserNode RMS of the last 2048 samples,
 *    read once a frame and discarded. It is a level meter, so an audible
 *    out-breath moves it and a held breath does not. No recording is made.
 *
 * SAFETY. Box breathing has two holds in it and this screen never pushes one.
 * The hold is four seconds at rest, it is named as a rest, Even Breathing with
 * no hold at all is one tap away, and the line under the pattern says to
 * shorten or skip a hold that does not feel comfortable. Nothing here asks for
 * discomfort, and nothing is counted beyond this screen: the round count is
 * gone the moment the reader leaves. */

const PATTERNS = {
  box:  { id:'box',  label:'Box, 4-4-4-4', steps:[['In', 4], ['Rest', 4], ['Out', 4], ['Rest', 4]],
          lede:'Four in, four at rest, four out, four at rest.' },
  even: { id:'even', label:'Even, 4-4',    steps:[['In', 4], ['Out', 4]],
          lede:'Four in, four out, with no hold at all.' },
  long: { id:'long', label:'Longer out, 4-6', steps:[['In', 4], ['Out', 6]],
          lede:'Four in and six out, which is the slowest of the three.' },
}

const SAY = {
  In:   'Breathe in',
  Out:  'Breathe out',
  Rest: 'Rest, gently',
}

/* The ring. One disc inside one ring, scaled between .46 and 1 across the
   in-breath and back down across the out-breath, holding still through a rest.
   Under reduced motion the disc is fixed and the seconds carry the pace. */
function Ring({ phase, t, secs, scale, still }) {
  const pct = Math.round(t * 100)
  return (
    <div className="relative mx-auto grid aspect-square w-full max-w-[17rem] place-items-center">
      <svg viewBox="0 0 200 200" aria-hidden focusable="false" className="absolute inset-0 size-full">
        <circle cx="100" cy="100" r="92" fill="none" className="kit-s-art" strokeWidth="3" opacity="0.5"/>
        {/* The arc is the phase running down, drawn clockwise from the top. It
            is the part that still reports the pace when the disc holds still. */}
        <circle cx="100" cy="100" r="92" fill="none" className="kit-s" strokeWidth="6"
          strokeLinecap="round" transform="rotate(-90 100 100)"
          strokeDasharray={`${(pct / 100) * 578} 578`}/>
        <circle cx="100" cy="100" r="62" className="kit-f-art" opacity="0.42"
          style={{ transformBox:'fill-box', transformOrigin:'center',
                   transform:`scale(${still ? 0.8 : scale})` }}/>
      </svg>
      <div className="relative text-center">
        <p className="font-display text-row font-bold tracking-tight text-ink">{SAY[phase]}</p>
        <p className="mt-0.5 font-display text-stat font-bold tabular-nums text-ink">{secs}</p>
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
  const [rounds, setRounds] = React.useState(0)
  const [frame, setFrame] = React.useState({ phase:'In', t:0, secs:4, scale:0.46 })

  const steps = PATTERNS[pattern].steps
  const cycle = steps.reduce((a, s) => a + s[1], 0)

  const pacer = React.useRef(null)
  const meter = React.useRef(null)
  const started = React.useRef(0)
  const lastPhase = React.useRef(-1)
  const soundOn = React.useRef(false)
  soundOn.current = sound

  /* One loop for the clock, the ring, the cue and the meter, so none of them
     can disagree about which phase it is. */
  React.useEffect(() => {
    if (!running) return
    let id = 0
    started.current = performance.now()
    lastPhase.current = -1
    const tick = now => {
      const el = (now - started.current) / 1000
      const into = el % cycle
      let at = 0, i = 0
      for (; i < steps.length; i++) { if (into < at + steps[i][1]) break; at += steps[i][1] }
      const [phase, dur] = steps[Math.min(i, steps.length - 1)]
      const t = Math.min(1, (into - at) / dur)
      /* The disc grows across an in-breath, shrinks across an out-breath and
         holds at either end through a rest. */
      const scale = phase === 'In' ? 0.46 + 0.54 * t
        : phase === 'Out' ? 1 - 0.54 * t
        : (steps[(i - 1 + steps.length) % steps.length]?.[0] === 'In' ? 1 : 0.46)
      setFrame({ phase, t, secs: Math.max(1, Math.ceil(dur - (into - at))), scale })
      if (i !== lastPhase.current) {
        if (lastPhase.current !== -1 && i === 0) setRounds(r => r + 1)
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

  /* The stream and the context are let go on leaving the screen, not on the
     next render: a camera or microphone left open after a reader navigates away
     is the one bug this page is not allowed to have. */
  React.useEffect(() => () => {
    meter.current?.stop(); meter.current = null
    pacer.current?.close(); pacer.current = null
  }, [])

  const askMic = async () => {
    if (mic === 'on') { meter.current?.stop(); meter.current = null; setMic('off'); setLevel(0); return }
    setMic('asking')
    try { meter.current = await createMicMeter(); setMic('on') }
    catch (e) { setMic(e?.message === 'unsupported' ? 'unsupported' : 'refused') }
  }

  const p = PATTERNS[pattern]

  return (
    <ActivityScreen family="tide" title="Box Breathing" minutes="2 to 5 minutes"
      lede="A four-count square: in, rest, out, rest. The ring holds the pace so you do not have to count.">
      <Sheet>
        <Ring {...frame} still={reduced}/>

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <Button size="sm" onClick={() => setRunning(r => !r)}
            className="min-w-[8.5rem]">{running ? 'Pause' : rounds ? 'Start again' : 'Start'}</Button>
          <Readout n={rounds} unit={rounds === 1 ? 'round' : 'rounds'}/>
          <span className="ml-auto text-fine text-ink-3">Nothing is counted after you leave.</span>
        </div>
      </Sheet>

      <Sheet className="mt-3">
        <Step>Pattern</Step>
        <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
          {Object.values(PATTERNS).map(o => (
            <Choice key={o.id} on={pattern === o.id}
              onClick={() => { setPattern(o.id); setRounds(0) }}>{o.label}</Choice>
          ))}
        </div>
        <Note className="mt-2.5">{p.lede} If a rest ever feels uncomfortable, shorten it or move
          straight to the out-breath. Even, 4-4 has no hold in it at all.</Note>

        <Step className="mt-5">Sound and breath level</Step>
        <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
          <Choice on={sound} disabled={!audioSupported()}
            onClick={() => setSound(s => !s)}>
            {sound ? 'Sound cues on' : 'Sound cues off'}
          </Choice>
          <Choice on={mic === 'on'} onClick={askMic}>
            {mic === 'on' ? 'Breath level on' : mic === 'asking' ? 'Asking for the microphone'
              : 'Turn on breath level'}
          </Choice>
        </div>
        {mic === 'on' && (
          <Meter className="mt-3.5" value={level} label="Microphone level, right now"
            right={`${Math.round(level * 100)}%`}/>
        )}
        {mic === 'on' && (
          <OnDevice>The level is measured in this page and thrown away every frame. No audio is
            recorded, saved, uploaded or shared. An out-breath through the mouth moves the bar; a
            quiet one will not, and that is fine.</OnDevice>
        )}
        {mic === 'refused' && <Note className="mt-2.5">The microphone stayed off, so the pattern runs
          without it. Everything on this screen works the same way.</Note>}
        {mic === 'unsupported' && <Note className="mt-2.5">This browser has no microphone to offer, so
          the pattern runs without it.</Note>}
        <Note className="mt-2.5">The two cues are a low sine tone built in the page, one pitch going
          in and a lower one coming out. There is no audio file and nothing is fetched.</Note>

        {reduced && <Note className="mt-4">Your device asks for reduced motion, so the ring holds
          still and the seconds carry the pace.</Note>}
      </Sheet>
    </ActivityScreen>
  )
}
