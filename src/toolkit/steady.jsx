import React from 'react'
import { Button } from '../ui/button'
import { ActivityScreen, Sheet, OnDevice, Meter, Note } from './shell'
import { askMotion } from '../signals/motion'
import { useReduced } from './useReduced'
import { DidItWork } from './after'

/* Steady Hand. A dot the hand keeps inside a ring.
 *
 * WHAT RUNS. The phone's x and y acceleration (accelerationIncludingGravity,
 * or acceleration where that is all there is) minus a slow moving average,
 * so the tilt of the hand drops out and only the movement is left. That
 * movement, scaled, is where the dot sits. The ring grows and shrinks on a
 * ten-second cycle, four in and six out, and only while the last second's
 * movement RMS is under a threshold; a shaky second pauses it where it is.
 *
 * THE MEASUREMENT. Movement RMS over each ten-second block. At the end the
 * first minute's blocks and the last minute's blocks become two meters. No
 * link to any feeling is claimed: this is a grounding exercise that happens
 * to have a number at the end, and the label on screen says so.
 *
 * REDUCED MOTION. The ring holds one size and the count under it carries the
 * pace. The dot still follows the hand, which is the exercise.
 *
 * WHERE THE SAMPLES GO. One second of magnitudes, a running sum per block,
 * and the block figures, all dropped when the screen closes. */

const SECONDS = 180
const CYCLE = 10
const IN = 4
const BLOCK = 10
const STILL_RMS = 0.3          // m/s^2, under this the ring breathes
const SCALE_RMS = 0.8          // m/s^2 that reads as zero stillness
const TAU = 1.5                // seconds, the slow mean that removes gravity
const PX_PER = 55              // viewBox units per m/s^2
const REACH = 86               // the dot never leaves the track

const Play = p => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="currentColor" {...p}>
    <path d="M7 4.5v15l12-7.5z"/>
  </svg>
)
const Square = p => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="currentColor" {...p}>
    <rect x="5.5" y="5.5" width="13" height="13" rx="2"/>
  </svg>
)
const Again = p => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4.5v4.5h4.5"/>
  </svg>
)

const stillness = rms => (rms == null ? 0 : Math.max(0, Math.min(1, 1 - rms / SCALE_RMS)))
const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null)

/* The ring breathes with a raised cosine, four seconds up and six down. */
function breathe(phase) {
  const t = phase < IN ? phase / IN : 1 - (phase - IN) / (CYCLE - IN)
  return 0.5 - 0.5 * Math.cos(Math.PI * t)
}

function Ring({ dx, dy, still, phase, hasDot, reduced, idle }) {
  const s = reduced ? 0.84 : 0.68 + 0.32 * breathe(phase)
  const secs = phase < IN ? Math.ceil(IN - phase) : Math.ceil(CYCLE - phase)
  const word = idle ? 'Ready' : !still ? 'Settle' : phase < IN ? 'In' : 'Out'
  return (
    <div className="relative mx-auto grid aspect-square w-full max-w-[22rem] place-items-center sm:max-w-[26rem]">
      <svg viewBox="0 0 200 200" aria-hidden focusable="false" className="absolute inset-0 size-full">
        <circle cx="100" cy="100" r="94" fill="none" className="stroke-rule" strokeWidth="3"/>
        <circle cx="100" cy="100" r="80" strokeWidth="4"
          className="fill-aqua stroke-ink transition-opacity duration-200 motion-reduce:transition-none"
          style={{ transformBox:'fill-box', transformOrigin:'center',
                   transform:`scale(${idle ? 0.84 : s})`,
                   opacity: still || idle ? 1 : 0.55 }}/>
        {hasDot && (
          <circle cx="100" cy="100" r="9" className="fill-ink"
            style={{ transform:`translate(${dx}px, ${dy}px)` }}/>
        )}
      </svg>
      <div className="relative mt-24 text-center">
        <p className="font-display text-row font-bold tracking-tight text-ink">{word}</p>
        <p className="font-display text-stat font-bold tabular-nums text-ink">
          {idle || !still ? '' : secs}
        </p>
      </div>
    </div>
  )
}

export default function Steady() {
  const reduced = useReduced()
  const [motion, setMotion] = React.useState('off')   // off | asking | on | refused | unsupported
  const [running, setRunning] = React.useState(false)
  const [elapsed, setElapsed] = React.useState(0)
  const [frame, setFrame] = React.useState({ dx:0, dy:0, still:true, phase:0 })
  const [result, setResult] = React.useState(null)    // { first, last, blocks }

  const listener = React.useRef(null)
  const slow = React.useRef(null)                      // { x, y, t } the moving mean
  const latest = React.useRef({ x:0, y:0 })            // gravity removed
  const recent = React.useRef([])                      // [{ t, m }] last second
  const block = React.useRef({ sum:0, n:0 })
  const blocks = React.useRef([])
  const sawSample = React.useRef(false)

  const detach = React.useCallback(() => {
    if (listener.current) window.removeEventListener('devicemotion', listener.current)
    listener.current = null
    slow.current = null
    recent.current = []
    latest.current = { x:0, y:0 }
  }, [])

  React.useEffect(() => () => detach(), [detach])

  const attach = React.useCallback(() => {
    const on = e => {
      const a = e.accelerationIncludingGravity?.x != null ? e.accelerationIncludingGravity : e.acceleration
      if (!a || a.x == null || a.y == null) return
      const t = performance.now()
      sawSample.current = true
      const s = slow.current
      if (!s) { slow.current = { x:a.x, y:a.y, t }; return }
      const dt = Math.min(0.1, (t - s.t) / 1000)
      const k = dt / (TAU + dt)
      s.x += (a.x - s.x) * k
      s.y += (a.y - s.y) * k
      s.t = t
      const hx = a.x - s.x, hy = a.y - s.y
      latest.current = { x:hx, y:hy }
      const m = Math.hypot(hx, hy)
      const r = recent.current
      r.push({ t, m })
      while (r.length && t - r[0].t > 1000) r.shift()
      block.current.sum += m * m
      block.current.n += 1
    }
    listener.current = on
    window.addEventListener('devicemotion', on)
  }, [])

  const closeBlock = () => {
    const b = block.current
    if (b.n >= 3) blocks.current.push(Math.sqrt(b.sum / b.n))
    block.current = { sum:0, n:0 }
  }

  const stop = React.useCallback(() => {
    setRunning(false)
    closeBlock()
    detach()
    const all = blocks.current
    const first = all.length ? mean(all.slice(0, 6)) : null
    const last = all.length ? mean(all.slice(-6)) : null
    setResult({ first, last, blocks: all.length })
  }, [detach])

  /* The clock. The ring's phase advances only while the hand is still. */
  React.useEffect(() => {
    if (!running) return
    let id = 0
    const t0 = performance.now()
    let last = t0
    let nextBlock = t0 + BLOCK * 1000
    let phase = 0
    let sx = 0, sy = 0
    const tick = now => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const el = (now - t0) / 1000
      setElapsed(Math.floor(el))
      if (el >= SECONDS) { stop(); return }
      if (listener.current && !sawSample.current && el > 3) { setMotion('unsupported'); detach() }
      if (now >= nextBlock) { nextBlock += BLOCK * 1000; closeBlock() }
      const r = recent.current
      const rms = r.length ? Math.sqrt(r.reduce((a, s) => a + s.m * s.m, 0) / r.length) : 0
      const still = !listener.current || rms < STILL_RMS
      if (still) phase = (phase + dt) % CYCLE
      /* a light spring on the dot, so a 60 Hz sensor does not jitter the screen */
      sx += (latest.current.x * PX_PER - sx) * Math.min(1, dt * 18)
      sy += (-latest.current.y * PX_PER - sy) * Math.min(1, dt * 18)
      const len = Math.hypot(sx, sy)
      const c = len > REACH ? REACH / len : 1
      setFrame({ dx: sx * c, dy: sy * c, still, phase })
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [running, stop, detach])

  const start = async () => {
    setResult(null)
    blocks.current = []
    block.current = { sum:0, n:0 }
    sawSample.current = false
    setElapsed(0)
    if (typeof DeviceMotionEvent === 'undefined') { setMotion('unsupported'); setRunning(true); return }
    setMotion('asking')
    const ok = await askMotion()
    if (!ok) { setMotion('refused'); setRunning(true); return }
    attach()
    setMotion('on')
    setRunning(true)
  }

  const sensorLine =
    motion === 'refused' ? 'Motion off. The ring still breathes.'
    : motion === 'unsupported' ? 'No motion sensor here. The ring still breathes.'
    : motion === 'asking' ? 'Asking for motion.'
    : null

  return (
    <ActivityScreen family="stone" title="Steady hand">
      {result ? (
        <Sheet>
          <h3 className="font-display text-row font-bold text-ink">How still</h3>
          {result.blocks >= 2 ? (
            <div className="mt-4 space-y-4">
              <Meter tall value={stillness(result.first)} label="First minute"
                right={`${Math.round(stillness(result.first) * 100)}%`}/>
              <Meter tall value={stillness(result.last)} label="Last minute"
                right={`${Math.round(stillness(result.last) * 100)}%`}/>
            </div>
          ) : (
            <p className="mt-3 text-sec text-ink-2">
              {motion === 'on' ? 'Under twenty seconds. Nothing to compare.' : 'No measurement here.'}
            </p>
          )}
          <Note className="mt-4">Experimental. A grounding exercise with a measured result.</Note>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button size="sm" className="min-w-[9rem]" onClick={start}><Again/>Again</Button>
          </div>
        </Sheet>
      ) : (
        <>
          <Ring {...frame} hasDot={running && motion === 'on'} reduced={reduced} idle={!running}/>
          <div className="mx-auto mt-4 flex w-full max-w-[32rem] flex-wrap items-center gap-3">
            {running ? (
              <Button size="sm" className="min-w-[9rem]" onClick={stop}><Square/>Stop</Button>
            ) : (
              <Button size="sm" className="min-w-[9rem]" disabled={motion === 'asking'} onClick={start}>
                <Play/>{motion === 'asking' ? 'Asking' : 'Start'}
              </Button>
            )}
            <p aria-live="polite" className="font-display text-stat font-bold tabular-nums text-ink">
              {elapsed}<span className="ml-1.5 text-fine font-semibold text-ink-2">s</span>
            </p>
          </div>
          <div className="mx-auto mt-3 w-full max-w-[32rem]">
            {!running && (
              <>
                <p className="font-display text-row font-bold text-ink">Hold the phone in one hand.</p>
                <p className="mt-1 text-sec text-ink-2">Keep the dot inside the ring.</p>
              </>
            )}
            {sensorLine && <p className="mt-2 text-fine text-ink-3">{sensorLine}</p>}
            <Note className="mt-3">Experimental. A grounding exercise with a measured result.</Note>
          </div>
        </>
      )}
      {result ? <DidItWork tool="steady" phase="after" className="mt-3"/>
        : !running && <DidItWork tool="steady" phase="before" className="mx-auto mt-3 w-full max-w-[32rem]"/>}
      <OnDevice className="mt-3">Movement is measured here and never recorded.</OnDevice>
    </ActivityScreen>
  )
}
