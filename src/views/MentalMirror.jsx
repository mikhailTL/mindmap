import React from 'react'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { Headline, AllDetail } from './Monitor'
import { RainbowDial } from '../charts/rainbow'
import { Diverge } from '../charts/diverge'
import { cn } from '../lib/utils'
import { SCORE } from '../lib/terms'
import { addReading } from '../lib/readingLog'

import { FACE_SECONDS, analyseFace } from '../signals/face'
import { captureFace, drawOverlay, faceAvailable, loadLandmarker, loadVision, openFrontCamera } from '../signals/face-capture'
import { FACE_TERMS, emptyFaceBaseline, faceFeatures, faceSentence, scoreFace, updateFaceBaseline } from '../signals/face-score'
import { fitCalibration, identityCalibration } from '../signals/tnam'

/* The Mental Mirror. The front camera, the face model's landmarks drawn over
 * the face as it is read, thirty seconds, one Mind Score. Students only: it
 * lives under the Reading tab and asks once before the camera opens.
 *
 * No picture leaves the phone. Each frame becomes 52 expression scores, one
 * eye figure, one nose position and one skin-colour level, then is dropped.
 * The Mind Score that comes out is saved like any other reading; the frames
 * never are. Any change that buffers or persists frames breaks what the
 * screen says.
 *
 * Every reading owns a run id. Stop, a new Start and leaving the screen all
 * move the id on, so a run still waiting on the model or the camera finds out
 * when it wakes, stops its own camera and touches nothing else. Before this,
 * a run stopped while the model loaded carried on, and its failure stopped
 * the next run's camera (docs/mental-mirror.md). */

/* The four bands of the dial, one per group of cues, each 0 to 100 where 50
   is this person's usual. */
const BANDS = [
  { id: 'mirror-pulse', name: 'Pulse', glow: '#e11919', of: ['hr'] },
  { id: 'mirror-brow',  name: 'Brow',  glow: '#e86a05', of: ['browFurrow'] },
  { id: 'mirror-eyes',  name: 'Eyes',  glow: '#199e19', of: ['blinkRate', 'eyeSquint', 'earVar'] },
  { id: 'mirror-mouth', name: 'Mouth and head', glow: '#1560e0', of: ['lipPress', 'headMotion'] },
]
function bandsOf(result) {
  return BANDS.map(b => {
    const zs = result.contrib.filter(c => b.of.includes(c.id)).map(c => c.z)
    const z = zs.length ? zs.reduce((a, x) => a + x, 0) / zs.length : null
    return { id: b.id, name: b.name, glow: b.glow,
      value: z == null ? 50 : Math.round(100 / (1 + Math.exp(-1.1 * z))) }
  })
}

const PANEL = 'rounded-panel border border-rule/60 bg-card p-5 lg:p-6'
const STORE = 'mindmap.mirror.baseline'
const CHECKINS = 'mindmap.phone.checkins'   /* shared with the camera reading: one calibration per person */
const CONSENT = 'mindmap.mirror.ok'

function load(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback } catch { return fallback }
}
function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)) } catch {} }
const dayKey = () => new Date().toISOString().slice(0, 10)

/* Why a capture ended without a result, in a few words. */
const ENDED = {
  'camera-ended': 'The camera stopped. Try again.',
  stalled: 'The camera froze. Try again.',
  hidden: 'The reading stopped when you left. Try again.',
  model: 'Something went wrong. Try again.',
}
function cameraMessage(e) {
  const n = e?.name
  if (n === 'NotAllowedError' || n === 'SecurityError') return 'The camera is not allowed. The other readings still work.'
  if (n === 'NotFoundError' || n === 'OverconstrainedError') return 'No front camera was found.'
  if (n === 'NotReadableError') return 'Another app is using the camera.'
  return 'Something went wrong. Try again.'
}

const KEEP = [
  ['bg-accent', 'Students only.'],
  ['bg-beam', 'No picture is kept.'],
  ['bg-sky', 'Not a diagnosis.'],
  ['bg-coral', "Google's MediaPipe Face Landmarker maps 478 points on your face. Your pulse is read from skin colour."],
]

/* Any render failure inside the mirror shows a short note and a retry, not a
   blank tab. Unmounting the broken mirror runs its cleanup, so the camera is
   off before the note shows. */
class MirrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { failed: false, n: 0 } }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error, info) { console.error('Mental Mirror', error, info?.componentStack) }
  render() {
    if (this.state.failed) {
      return (
        <div className={cn(PANEL, 'max-w-[44ch]')} role="alert">
          <p className="text-sec text-ink">Something went wrong. Try again.</p>
          <Button className="mt-3" onClick={() => this.setState(s => ({ failed: false, n: s.n + 1 }))}>Try again</Button>
        </div>
      )
    }
    return <React.Fragment key={this.state.n}>{this.props.children}</React.Fragment>
  }
}

export function MentalMirror(props) {
  return <MirrorBoundary><Mirror {...props}/></MirrorBoundary>
}

function Mirror() {
  const videoRef = React.useRef(null)
  const canvasRef = React.useRef(null)
  const boxRef = React.useRef(null)
  const live = React.useRef({ stream: null, capture: null })
  const runId = React.useRef(0)
  const mounted = React.useRef(false)
  const dprRef = React.useRef(1)
  const pulseRef = React.useRef(null)

  const [consented, setConsented] = React.useState(() => load(CONSENT, false) === true)
  const [phase, setPhase] = React.useState('idle')   /* idle · loading · capture · working · done */
  const [progress, setProgress] = React.useState(0)
  const [seen, setSeen] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [result, setResult] = React.useState(null)
  const [face, setFace] = React.useState(null)
  const [baseline, setBaseline] = React.useState(emptyFaceBaseline)
  const [checkins, setCheckins] = React.useState([])
  const [calibration, setCalibration] = React.useState(identityCalibration)
  const [answered, setAnswered] = React.useState(false)
  const supported = faceAvailable()

  const stopAll = React.useCallback(() => {
    live.current.capture?.cancel(); live.current.capture = null
    live.current.stream?.getTracks().forEach(t => t.stop()); live.current.stream = null
    if (videoRef.current) videoRef.current.srcObject = null
    const c = canvasRef.current
    c?.getContext('2d')?.clearRect(0, 0, c.width, c.height)
  }, [])

  React.useEffect(() => {
    mounted.current = true
    const b = load(STORE, null)
    setBaseline(b && b.stats ? b : emptyFaceBaseline())
    const past = load(CHECKINS, [])
    const usable = Array.isArray(past) ? past.filter(e => Array.isArray(e?.contributions)) : []
    setCheckins(usable)
    setCalibration(fitCalibration(usable))
    return () => { mounted.current = false; runId.current++; stopAll() }
  }, [stopAll])

  /* The overlay canvas matches the box in device pixels, so the tags are
     sharp and the landmarks land where the cropped video shows them. */
  React.useEffect(() => {
    const box = boxRef.current, canvas = canvasRef.current
    if (!box || !canvas) return
    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const w = Math.max(1, Math.round(box.clientWidth * dpr)), h = Math.max(1, Math.round(box.clientHeight * dpr))
      if (canvas.width !== w) canvas.width = w
      if (canvas.height !== h) canvas.height = h
      dprRef.current = dpr
    }
    fit()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', fit)
      return () => window.removeEventListener('resize', fit)
    }
    const ro = new ResizeObserver(fit)
    ro.observe(box)
    return () => ro.disconnect()
  }, [consented])

  const agree = () => { save(CONSENT, true); setConsented(true) }

  const run = async () => {
    const id = ++runId.current
    const alive = () => mounted.current && runId.current === id
    const fail = msg => { if (alive()) { setError(msg); setPhase('idle') } }
    stopAll()
    setError(null); setResult(null); setFace(null); setSeen(false); setAnswered(false); setProgress(0)
    pulseRef.current = null
    setPhase('loading')

    /* All three settle before anything is decided, so a camera that opened
       while the model failed is still closed. */
    const [lmR, visR, camR] = await Promise.allSettled([loadLandmarker(), loadVision(), openFrontCamera()])
    const stream = camR.status === 'fulfilled' ? camR.value.stream : null
    const quit = () => stream?.getTracks().forEach(t => t.stop())
    if (!alive()) return quit()
    if (camR.status === 'rejected') return fail(cameraMessage(camR.reason))
    if (lmR.status === 'rejected' || visR.status === 'rejected') { quit(); return fail('The face model did not load. Try again.') }

    live.current.stream = stream
    const video = videoRef.current
    try {
      video.srcObject = stream
      await video.play()
    } catch (e) {
      if (!alive()) return quit()
      stopAll()
      return fail(cameraMessage(e))
    }
    if (!alive()) return quit()

    const vision = visR.value
    setPhase('capture')
    let lastPct = -1, lastPeek = 0, found = false
    const capture = captureFace(video, lmR.value, {
      seconds: FACE_SECONDS,
      onFrame: (res, rec, frac) => {
        const c = canvasRef.current
        if (c) {
          drawOverlay(c.getContext('2d'), res, vision, {
            vw: video.videoWidth, vh: video.videoHeight, cw: c.width, ch: c.height,
            dpr: dprRef.current, pulse: pulseRef.current,
          })
        }
        const pct = Math.round(frac * 100)
        if (pct !== lastPct) { lastPct = pct; setProgress(pct) }
        if (rec && !found) { found = true; setSeen(true) }
        /* The running pulse for the forehead tag, once a second. */
        const now = performance.now()
        if (now - lastPeek > 1000) {
          lastPeek = now
          const partial = analyseFace(capture.frames)
          pulseRef.current = partial?.ok ? partial.hr : null
        }
      },
    })
    live.current.capture = capture
    const out = await capture.done
    if (!alive()) return
    live.current.capture = null
    stopAll()
    if (!out.ok) return out.reason === 'stopped' ? setPhase('idle') : fail(ENDED[out.reason] || ENDED.model)

    setPhase('working')
    const analysed = analyseFace(out.frames)
    if (!analysed.ok) return fail(analysed.message)
    const scored = scoreFace({ face: analysed, baseline, calibration })
    if (!scored.ok) return fail('Nothing came through. Try again in better light.')

    const next = updateFaceBaseline(baseline, faceFeatures(analysed), dayKey())
    setBaseline(next); save(STORE, next)
    setFace(analysed)
    setResult(scored)
    addReading?.({ at: Date.now(), score: scored.score, source: 'mirror', pulse: analysed.hr ?? undefined })
    setPhase('done')
  }

  const stop = () => { runId.current++; stopAll(); setPhase('idle') }

  /* One answer is one label; the calibration is refitted on everything this
     person has said, from the mirror and the fingertip reading alike. */
  const answer = stressed => {
    if (!result?.model) return
    const next = [...checkins, { contributions: result.model.contributions, temporal: result.model.temporal, label: stressed ? 1 : 0, day: dayKey(), source: 'mirror' }].slice(-200)
    setCheckins(next); save(CHECKINS, next)
    setCalibration(fitCalibration(next))
    setAnswered(true)
  }

  const busy = phase === 'loading' || phase === 'capture' || phase === 'working'
  const s = result ? faceSentence(result) : null

  if (!consented) {
    return (
      <div className={cn(PANEL, 'max-w-[44ch]')}>
        <h3 className="font-display text-row font-bold text-ink">Before you start</h3>
        <ul className="m-0 mt-3 list-none space-y-2.5 p-0">
          {KEEP.map(([dot, line]) => (
            <li key={line} className="flex items-baseline gap-3 text-ui text-ink">
              <span aria-hidden className={cn('size-2.5 shrink-0 translate-y-[-1px] rounded-[3px]', dot)}/>
              {line}
            </li>
          ))}
        </ul>
        <Button className="mt-5" onClick={agree} disabled={!supported}>Open the mirror</Button>
        {!supported && <p className="mt-3 text-fine text-ink-3">This browser cannot open a camera here.</p>}
      </div>
    )
  }

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] xl:items-start lg:gap-4">
      {/* ── the mirror ─────────────────────────────────────────────── */}
      <div className={PANEL}>
        <div ref={boxRef} className="relative overflow-hidden rounded-field bg-ink/90" style={{ aspectRatio: '4 / 3' }}>
          <video ref={videoRef} muted playsInline autoPlay
            className={cn('absolute inset-0 h-full w-full object-cover', phase === 'capture' ? 'opacity-100' : 'opacity-0')}
            style={{ transform: 'scaleX(-1)' }} aria-hidden/>
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden/>
          {phase !== 'capture' && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              <p className="max-w-[28ch] text-sec text-paper/90">
                {phase === 'loading' ? 'Loading MediaPipe Face Landmarker…'
                  : phase === 'working' ? 'Reading…'
                  : phase === 'done' ? 'Done. The camera is off.'
                  : 'Face the phone in good light.'}
              </p>
            </div>
          )}
          {phase === 'capture' && !seen && (
            <p className="absolute inset-x-0 bottom-3 text-center text-fine text-paper/90">Looking for a face…</p>
          )}
        </div>

        {phase === 'capture' && (
          <div className="mt-3">
            <Progress value={progress} max={100} label="Reading progress"/>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-fine text-ink-2">
              <span className="inline-flex items-center gap-1.5"><span aria-hidden className="size-2 rounded-full bg-accent-lit"/>Face Landmarker</span>
              <span className="inline-flex items-center gap-1.5"><span aria-hidden className="size-2.5 rounded-[2px] border-2 border-coral"/>Pulse patch</span>
            </p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={run} disabled={busy || !supported}>
            {phase === 'done' ? 'Read again' : busy ? 'Reading…' : `Start · ${FACE_SECONDS}s`}
          </Button>
          {busy && <Button variant="outline" onClick={stop}>Stop</Button>}
        </div>
        {error && <p className="mt-3 max-w-[40ch] text-sec text-warn" role="alert">{error}</p>}
      </div>

      {/* ── the result ─────────────────────────────────────────────── */}
      <div className={PANEL} aria-live="polite">
        {!result && (
          <p className="max-w-[36ch] text-sec text-ink-3">Your {SCORE} shows here.</p>
        )}
        {result && (
          <>
            <div className="flex flex-col items-start gap-4">
              <RainbowDial score={result.score} size={300} rings={bandsOf(result)}/>
              <div className="w-full">
                <Headline>{s.lead}<b className={cn('font-bold', s.calm ? 'text-calm' : 'text-warn')}>{s.word}</b>.</Headline>
                <p className="mt-2 max-w-[40ch] text-meta text-ink-2">{s.tail}</p>

                <dl className="m-0 mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-meta">
                  <dt className="text-ink-3">{SCORE}</dt>
                  <dd className="m-0 font-mono tabular-nums text-ink">{result.score} of 100</dd>
                  <dt className="text-ink-3">Range</dt>
                  <dd className="m-0 font-mono tabular-nums text-ink">{result.low} to {result.high}</dd>
                  <dt className="text-ink-3">Pulse</dt>
                  <dd className="m-0 text-ink">{face?.hr
                    ? <span className="font-mono tabular-nums">{Math.round(face.hr)} bpm</span>
                    : <span className="text-ink-3">Not read</span>}</dd>
                </dl>

                {/* The check-in: the label this person teaches the model with. */}
                <div className="mt-5 border-t border-rule/60 pt-4">
                  {!answered ? (
                    <>
                      <p className="text-sec text-ink">Does this match how you feel?</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button onClick={() => answer(true)}>Stressed</Button>
                        <Button variant="outline" onClick={() => answer(false)}>Fine</Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sec text-ink-2">Noted. Thanks.</p>
                  )}
                </div>
              </div>
            </div>

            <AllDetail label="What moved it">
              <Diverge items={result.contrib.map(c => ({ label: c.label, x: Math.max(-1, Math.min(1, c.raw)) }))}/>
              <dl className="m-0 mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-fine">
                {FACE_TERMS.map(t => (
                  <React.Fragment key={t.id}>
                    <dt className="text-ink-3">{t.label}</dt>
                    <dd className="m-0 font-mono tabular-nums text-ink">
                      {result.features[t.id] == null ? 'Not read'
                        : t.id === 'blinkRate' ? `${result.features[t.id].toFixed(1)} per min`
                        : t.id === 'headMotion' ? `${(result.features[t.id] * 100).toFixed(1)}% face width per s`
                        : t.id === 'earVar' ? `${(result.features[t.id] * 100).toFixed(0)}% variation`
                        : `${Math.round(result.features[t.id] * 100)}%`}
                    </dd>
                  </React.Fragment>
                ))}
              </dl>
            </AllDetail>
          </>
        )}
      </div>
    </div>
  )
}
