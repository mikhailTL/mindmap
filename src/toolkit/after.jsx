import React from 'react'
import { Button } from '../ui/button'
import { Camera, Cross } from '../ui/marks'
import { Sheet, OnDevice, Meter } from './shell'
import { capturePPG, mediaAvailable, openCamera, stopStream } from '../signals/capture'
import { analysePPG } from '../signals/ppg'
import { addEffect } from '../app/store'
import { effectOf } from '../signals/effect'

/* Did it work. A 20-second camera pulse before an exercise and one after.
 *
 * Mounted twice by each activity: `phase="before"` on the idle screen and
 * `phase="after"` on the finished screen. The before reading waits in a
 * module map keyed by tool, so the activity itself carries nothing. When the
 * after reading lands and a before reading is waiting, the pair goes to the
 * `effects` slot and the sheet shows the two figures side by side.
 *
 * ON THE IDLE SCREEN the before phase is one outline button and nothing
 * else: the meter and the honesty line appear only while the camera is on,
 * and the result is one line. The after phase is a small sheet with a
 * heading, because the result is what that screen is for.
 *
 * The pipeline is PhoneCheck's: openCamera, capturePPG, analysePPG. Each frame
 * becomes one number as it arrives and the frames are dropped; the only
 * things that outlive this sheet are two pulse figures. The exercise never
 * waits for it: no camera, a refusal or no pulse is one line, and the
 * activity's own controls stay where they were. */

const SECONDS = 20
/* A before reading older than this is a different afternoon. */
const STALE_MS = 45 * 60 * 1000

const BEFORE = new Map()

export function takeBefore(tool) {
  const r = BEFORE.get(tool)
  if (!r) return null
  BEFORE.delete(tool)
  return Date.now() - r.t <= STALE_MS ? r : null
}

const bpm = hr => Math.round(hr)

export function DidItWork({ tool, phase = 'after', className }) {
  const [state, setState] = React.useState('idle')   // idle | camera | done | error
  const [progress, setProgress] = React.useState(0)
  const [reading, setReading] = React.useState(null)  // { hr, rmssd }
  const [before, setBefore] = React.useState(null)
  const [line, setLine] = React.useState(null)
  const videoRef = React.useRef(null)
  const live = React.useRef({ cam: null, ppg: null })

  const supported = mediaAvailable()

  /* The camera prompt can resolve after this sheet is gone, so `mounted`
     gates every await in run: a stream that arrives late is stopped at once. */
  const mounted = React.useRef(true)
  React.useEffect(() => () => {
    mounted.current = false
    live.current.ppg?.cancel()
    stopStream(live.current.cam?.stream)
  }, [])

  async function run() {
    setLine(null); setReading(null); setBefore(null); setProgress(0)
    let cam = null
    try {
      setState('camera')
      cam = await openCamera()
      if (!mounted.current) { stopStream(cam.stream); return }
      live.current.cam = cam
      const video = videoRef.current
      video.srcObject = cam.stream
      video.muted = true
      await video.play().catch(() => {})
      if (!mounted.current) { stopStream(cam.stream); live.current.cam = null; return }
      const cap = capturePPG(video, { seconds: SECONDS, onTick: p => setProgress(p) })
      live.current.ppg = cap
      const frames = await cap.done
      live.current.ppg = null
      stopStream(cam.stream); live.current.cam = null
      if (!mounted.current) return
      const ppg = analysePPG(frames)
      if (!ppg.ok) { setLine(ppg.message); setState('error'); return }
      const r = { hr: ppg.hr, rmssd: ppg.rmssd, t: Date.now() }
      setReading(r)
      if (phase === 'before') {
        BEFORE.set(tool, r)
      } else {
        const b = takeBefore(tool)
        if (b) {
          setBefore(b)
          addEffect({ tool, before: { hr: b.hr, rmssd: b.rmssd }, after: { hr: r.hr, rmssd: r.rmssd } })
        }
      }
      setState('done')
    } catch (e) {
      live.current.ppg = null
      stopStream(cam?.stream); live.current.cam = null
      if (!mounted.current) return
      setLine(e?.name === 'NotAllowedError' ? 'The camera was not allowed.' : 'The camera did not open.')
      setState('error')
    }
  }

  function cancel() {
    live.current.ppg?.cancel()
    live.current.ppg = null
    stopStream(live.current.cam?.stream); live.current.cam = null
    setState('idle')
  }

  const left = Math.max(0, Math.ceil(SECONDS * (1 - progress)))
  const video = <video ref={videoRef} playsInline muted className="sr-only" aria-hidden tabIndex={-1}/>

  /* The idle screen's row. */
  if (phase === 'before') {
    if (!supported) return null
    return (
      <div className={className}>
        {video}
        {state === 'idle' && (
          <div className="flex justify-center">
            <Button size="sm" variant="outline" onClick={run}>
              <Camera/>Check my pulse first, {SECONDS} seconds
            </Button>
          </div>
        )}
        {state === 'camera' && (
          <>
            <Meter value={progress} label="Fingertip over the lens" right={`${left} s`}/>
            <OnDevice className="mt-2 justify-center">Measured by the camera, never recorded.</OnDevice>
            <div className="mt-3 flex justify-center">
              <Button size="sm" variant="outline" onClick={cancel}><Cross/>Stop</Button>
            </div>
          </>
        )}
        {state === 'done' && reading && (
          <p className="text-center font-display text-ui font-semibold tabular-nums text-ink" aria-live="polite">
            {bpm(reading.hr)} bpm, kept until you finish.
          </p>
        )}
        {state === 'error' && (
          <div className="text-center">
            <p className="text-fine text-ink-2">{line}</p>
            <Button size="sm" variant="outline" className="mt-2" onClick={run}><Camera/>Try again</Button>
          </div>
        )}
      </div>
    )
  }

  /* The finished screen's sheet. One honesty line, under the result. */
  const drop = before && reading ? effectOf(before, reading).hrDrop : null
  return (
    <Sheet className={className}>
      {video}
      <h3 className="font-display text-ui font-bold text-ink">Check your pulse</h3>

      {state === 'idle' && (
        supported
          ? <Button size="sm" className="mt-3" onClick={run}><Camera/>Check my pulse, {SECONDS} seconds</Button>
          : <p className="mt-2 text-fine text-ink-3">No camera here.</p>
      )}

      {state === 'camera' && (
        <div className="mt-3">
          <Meter value={progress} label="Fingertip over the lens" right={`${left} s`}/>
          <Button size="sm" variant="outline" className="mt-3" onClick={cancel}><Cross/>Stop</Button>
        </div>
      )}

      {state === 'done' && reading && (
        <div className="mt-2" aria-live="polite">
          {before
            ? <p className="font-display text-row font-bold tabular-nums text-ink">
                Before {bpm(before.hr)}, after {bpm(reading.hr)} bpm</p>
            : <p className="font-display text-row font-bold tabular-nums text-ink">
                {bpm(reading.hr)}<span className="ml-1.5 text-fine font-semibold text-ink-2">bpm</span></p>}
          <p className="mt-1 text-fine text-ink-2">
            {before ? (drop > 0 ? `${Math.round(drop)} lower.` : drop < 0 ? `${Math.round(-drop)} higher.` : 'About the same.')
              : 'No reading from before.'}
          </p>
        </div>
      )}

      {state === 'error' && (
        <div className="mt-2">
          <p className="text-fine text-ink-2">{line}</p>
          <Button size="sm" variant="outline" className="mt-2" onClick={run}><Camera/>Try again</Button>
        </div>
      )}

      {supported && <OnDevice className="mt-3">Measured by the camera, never recorded.</OnDevice>}
    </Sheet>
  )
}

export default DidItWork
