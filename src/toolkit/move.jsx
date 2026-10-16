import React from 'react'
import { Button } from '../ui/button'
import { ActivityScreen, OnDevice, Meter, Video } from './shell'
import { openCamera, stopStream, createMotionMeter, cameraSupported } from './vision'
import { DidItWork } from './after'

/* Movement Break. The camera motion meter is the screen.
 *
 * WHAT RUNS. Each frame is shrunk to 64 by 48, converted to luma and compared
 * with the frame before (createMotionMeter in vision.js). The mean absolute
 * difference is how much of the picture moved; a critically damped spring
 * smooths it so the bar settles rather than jitters. Three moves, forty-five
 * seconds each, on one requestAnimationFrame clock with the meter.
 *
 * Start asks for the camera and starts the clock in one tap. Refused or
 * unsupported, the moves still run on the clock.
 *
 * WHERE THE FRAMES GO. Nowhere. Two 64 by 48 buffers, overwritten each frame.
 *
 * SAFETY. Every move is gentle and within comfort. Nothing is held or forced. */

const MOVES = [
  { id:'shoulders', name:'Shoulder rolls', secs:45, say:'Roll both shoulders slowly backwards.' },
  { id:'reach',     name:'Reach and lean', secs:45, say:'Reach one arm up, lean gently, then swap.' },
  { id:'turn',      name:'Slow turns',     secs:45, say:'Turn slowly from the waist, then back.' },
]

const band = v => v < 0.12 ? 'Still' : v < 0.55 ? 'Steady' : 'Fast'

export default function MoveBreak() {
  const [i, setI] = React.useState(0)
  const [running, setRunning] = React.useState(false)
  const [left, setLeft] = React.useState(MOVES[0].secs)
  const [cam, setCam] = React.useState('off')     // off | asking | on | refused | unsupported
  const [motion, setMotion] = React.useState(0)

  const videoRef = React.useRef(null)
  const streamRef = React.useRef(null)
  const meterRef = React.useRef(null)
  const t0 = React.useRef(0)
  const spring = React.useRef({ x:0, v:0 })

  const move = MOVES[i]
  const done = i >= MOVES.length - 1 && left === 0

  const closeCam = React.useCallback(() => {
    stopStream(streamRef.current)
    streamRef.current = null
    meterRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setMotion(0)
    spring.current = { x:0, v:0 }
  }, [])

  React.useEffect(() => () => closeCam(), [closeCam])

  React.useEffect(() => {
    if (!running && !meterRef.current) return
    let id = 0
    let last = performance.now()
    if (running) t0.current = performance.now() - (move.secs - left) * 1000
    const tick = now => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (running) {
        const el = Math.max(0, (now - t0.current) / 1000)
        setLeft(Math.max(0, Math.ceil(move.secs - el)))
        if (el >= move.secs) {
          if (i < MOVES.length - 1) { setI(n => n + 1); setLeft(MOVES[i + 1].secs); t0.current = now }
          else { setRunning(false); setLeft(0) }
        }
      }
      if (meterRef.current && videoRef.current) {
        const raw = meterRef.current.read(videoRef.current)
        const s = spring.current
        const k = 90, c = 2 * Math.sqrt(k)
        s.v += (k * (raw - s.x) - c * s.v) * dt
        s.x += s.v * dt
        setMotion(Math.max(0, Math.min(1, s.x)))
      }
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [running, i, move.secs, cam])

  const askCam = async () => {
    if (!cameraSupported()) { setCam('unsupported'); return }
    setCam('asking')
    let stream
    try { stream = await openCamera({ facing:'user' }) }
    catch { setCam('refused'); return }
    streamRef.current = stream
    const v = videoRef.current
    if (!v) { closeCam(); setCam('off'); return }
    v.srcObject = stream
    try { await v.play() } catch { /* a blocked autoplay still renders frames */ }
    meterRef.current = createMotionMeter()
    setCam('on')
  }

  const start = () => {
    if (done) { setI(0); setLeft(MOVES[0].secs); setRunning(true); return }
    if (cam === 'off') askCam()
    setRunning(r => !r)
  }
  const next = () => { setI(n => n + 1); setLeft(MOVES[i + 1].secs); t0.current = performance.now() }

  return (
    <ActivityScreen family="night" title="Movement Break">
      {cam !== 'on' && (
        <div className="mx-auto grid w-full max-w-[64rem] place-items-center gap-3 rounded-panel
          border-2 border-ink bg-ink px-4 py-10 sm:py-14">
          <p className="font-display text-row font-bold text-paper">{move.name}</p>
          <p className="text-center text-fine text-paper">
            {cam === 'refused' ? 'Camera off. The clock still runs.'
              : cam === 'unsupported' ? 'No camera here. The clock still runs.'
              : cam === 'asking' ? 'Asking for the camera.'
              : 'Start opens the camera. Frames stay here.'}
          </p>
        </div>
      )}
      <Video ref={videoRef} on={cam === 'on'} mirror>
        <p className="absolute left-3 top-3 rounded-field bg-ink/80 px-2 py-1 font-display text-ui
          font-semibold text-paper">{move.name}</p>
      </Video>

      <div className="mx-auto mt-3 w-full max-w-[64rem]">
        <Meter tall value={motion} label="Movement" right={cam === 'on' ? band(motion) : ''}/>
        {cam === 'on' && (
          <OnDevice className="mt-2">Frame difference, not body tracking. Frames stay here.</OnDevice>
        )}
      </div>

      <div className="mx-auto mt-4 flex w-full max-w-[64rem] flex-wrap items-center gap-3">
        <p className="font-display text-stat font-bold tabular-nums text-ink">
          {left}<span className="ml-1.5 font-display text-fine font-semibold text-ink-2">{' '}s</span>
        </p>
        <p className="min-w-0 flex-1 text-sec text-ink-2">{move.say}</p>
      </div>
      <div className="mx-auto mt-3 flex w-full max-w-[64rem] flex-wrap gap-2.5">
        <Button size="sm" className="min-w-[9rem]" onClick={start}>
          {done ? 'Start again' : running ? 'Pause' : left < move.secs ? 'Resume' : 'Start'}
        </Button>
        {i < MOVES.length - 1 && <Button size="sm" variant="outline" onClick={next}>Next</Button>}
        <span className="self-center text-fine text-ink-3">Move {i + 1} of {MOVES.length}</span>
      </div>
      {!running && i === 0 && left === MOVES[0].secs && <DidItWork tool="move" phase="before" className="mx-auto mt-4 w-full max-w-[64rem]"/>}
      {done && <DidItWork tool="move" phase="after" className="mx-auto mt-4 w-full max-w-[64rem]"/>}
    </ActivityScreen>
  )
}
