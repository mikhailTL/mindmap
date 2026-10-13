import React from 'react'
import { Button } from '../ui/button'
import { cn } from '../lib/utils'
import { ActivityScreen, Sheet, Step, Note, OnDevice, Choice, Meter } from './shell'
import { openCamera, stopStream, createMotionMeter, cameraSupported } from './vision'
import { useReduced } from './useReduced'

/* Movement Break.
 *
 * Three slow movements, forty-five seconds each, for the hour somebody has been
 * sat in one position with their shoulders up by their ears.
 *
 * WHAT ACTUALLY RUNS. If the camera is turned on, every frame is downscaled to
 * 64 by 48, converted to luma and compared with the frame before it; the mean
 * absolute difference is how much of the picture moved. That is written in
 * src/toolkit/vision.js, in about twenty lines, with no model and no
 * dependency, and it is the whole claim: the page can tell that something is
 * moving and roughly how much. It cannot tell what the body is doing and does
 * not say it can.
 *
 * The reading is smoothed by a critically damped spring integrated on each
 * frame rather than by an average, because an average of a noisy signal lags
 * and then overshoots, and this number is being read by somebody who is
 * supposed to be slowing down.
 *
 * WHERE THE FRAMES GO. Nowhere. The two 64 by 48 luma buffers are the only
 * copy and each is overwritten by the next frame. Nothing is photographed,
 * encoded, stored or sent, and the stream stops on leaving the screen.
 *
 * SAFETY. Gentle, within a range that is comfortable, and every instruction
 * says so. Nothing is held, forced or pushed into. The camera is optional and
 * the three movements are the activity with or without it. */

const MOVES = [
  { id:'shoulders', name:'Shoulder rolls', secs:45,
    say:'Roll both shoulders slowly backwards, as big a circle as is comfortable. Five one way, then five the other.' },
  { id:'reach', name:'Reach and lean', secs:45,
    say:'Reach one arm up and lean gently to the other side, only as far as feels easy. Hold for a breath, then swap.' },
  { id:'turn', name:'Slow turns', secs:45,
    say:'Sitting or standing, turn slowly from the waist to look behind you, then back the other way. Let your head follow last.' },
]

/* The band the reading is meant to sit in. Low is a pause, which is fine and
   is named as fine; high is faster than this activity is for. Both are said in
   words, so the band is never carried by colour alone. */
const band = v => v < 0.12 ? 'Still' : v < 0.55 ? 'Slow and steady' : 'Faster than this needs'

export default function MoveBreak() {
  const reduced = useReduced()
  const [i, setI] = React.useState(0)
  const [running, setRunning] = React.useState(false)
  const [left, setLeft] = React.useState(MOVES[0].secs)
  const [cam, setCam] = React.useState('off')     // off | asking | on | refused | unsupported
  const [motion, setMotion] = React.useState(0)

  const videoRef = React.useRef(null)
  const streamRef = React.useRef(null)
  const meterRef = React.useRef(null)
  const started = React.useRef(0)
  /* The spring: position, velocity, and a stiffness and damping chosen so the
     needle settles in about a third of a second without passing its target. */
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

  /* One loop for the countdown and the meter. It runs whenever either of them
     has something to do, so the reading is live while the reader is still
     deciding whether to press Start. */
  React.useEffect(() => {
    if (!running && !meterRef.current) return
    let id = 0
    let last = performance.now()
    if (running) started.current = performance.now() - (move.secs - left) * 1000
    const tick = now => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (running) {
        const el = (now - started.current) / 1000
        const rest = Math.max(0, Math.ceil(move.secs - el))
        setLeft(rest)
        if (el >= move.secs) {
          if (i < MOVES.length - 1) { setI(n => n + 1); setLeft(MOVES[i + 1].secs); started.current = now }
          else { setRunning(false); setLeft(0) }
        }
      }
      if (meterRef.current && videoRef.current) {
        const raw = meterRef.current.read(videoRef.current)
        const s = spring.current
        const k = 90, c = 2 * Math.sqrt(k)            // critically damped
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
    if (cam === 'on') { closeCam(); setCam('off'); return }
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

  return (
    <ActivityScreen family="night" title="Movement Break" minutes="2 to 3 minutes"
      lede="Three slow movements for a body that has been in one position too long. The camera can show you how fast you are actually going.">
      <Sheet>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <p className="font-display text-row font-bold tracking-tight text-ink">{move.name}</p>
          <p className="font-display text-fine font-semibold text-ink-2">
            Move {i + 1} of {MOVES.length}
          </p>
        </div>
        <p className="mt-2 max-w-[48ch] text-sec text-ink-2 [text-wrap:pretty]">{move.say}</p>
        <p className="mt-3 font-display text-stat font-bold tabular-nums text-ink">
          {left}
          {/* The space is inside the span: JSX drops whitespace between two
              elements and a screen reader would say "forty-five seconds" as
              one word. */}
          <span className="ml-1.5 align-baseline font-display text-fine font-semibold text-ink-2">
            {' '}seconds left
          </span>
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <Button size="sm" className="min-w-[8.5rem]" onClick={() => {
            if (done) { setI(0); setLeft(MOVES[0].secs); setRunning(true) }
            else setRunning(r => !r)
          }}>{done ? 'Start again' : running ? 'Pause' : left < move.secs ? 'Carry on' : 'Start'}</Button>
          {i < MOVES.length - 1 && (
            <Button size="sm" variant="outline"
              onClick={() => { setI(n => n + 1); setLeft(MOVES[i + 1].secs); started.current = performance.now() }}>
              Next move
            </Button>
          )}
          <span className="ml-auto text-fine text-ink-3">Go only as far as is comfortable.</span>
        </div>
      </Sheet>

      <Sheet className="mt-3">
        <Step>Movement, measured</Step>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <Choice on={cam === 'on'} onClick={askCam} className="min-w-[13rem]">
            {cam === 'on' ? 'Turn the camera off'
              : cam === 'asking' ? 'Asking for the camera'
              : 'Turn on the camera'}
          </Choice>
        </div>

        {/* Mounted always: a <video> created at the moment a stream arrives has
            no layout yet and iOS refuses to play into it. */}
        <div className={cn('mt-3 overflow-hidden rounded-panel border-2 border-ink bg-ink',
          cam === 'on' ? 'block' : 'sr-only')}>
          <video ref={videoRef} muted playsInline
            className="block aspect-[4/3] w-full -scale-x-100 object-cover"/>
        </div>

        {cam === 'on' && (
          <>
            <Meter className="mt-3.5" value={motion} label="How much of the picture is moving"
              right={band(motion)}/>
            <p className="mt-2 font-display text-fine font-semibold tabular-nums text-ink-2">
              {Math.round(motion * 100)} out of 100
            </p>
            <OnDevice>The camera runs inside this page. Each frame is shrunk to 64 by 48, compared
              with the one before it and dropped: nothing is photographed, saved, uploaded or
              shared, and the camera stops the moment you turn it off or leave.</OnDevice>
            <Note className="mt-1.5">This is frame difference, not body tracking. The page can tell
              that something in the picture moved and roughly how much. It cannot tell what you are
              doing, and the reading goes up if somebody walks behind you.</Note>
          </>
        )}
        {cam === 'off' && <Note className="mt-2.5">Optional. The three movements are the same
          activity without it.</Note>}
        {cam === 'refused' && <Note className="mt-2.5">The camera stayed off, so the movements run
          on the clock alone.</Note>}
        {cam === 'unsupported' && <Note className="mt-2.5">This browser has no camera to offer, so
          the movements run on the clock alone.</Note>}
        {reduced && <Note className="mt-2.5">Your device asks for reduced motion, so the bar steps to
          its reading rather than sliding, and the figure beside it is the same number.</Note>}
      </Sheet>
    </ActivityScreen>
  )
}
