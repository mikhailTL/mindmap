import React from 'react'
import { Button } from '../ui/button'
import { Headline } from './Monitor'
import { RainbowDial } from '../charts/rainbow'
import { cn } from '../lib/utils'
import { SCORE } from '../lib/terms'
import { addReading } from '../lib/readingLog'
import './mirror/mirror.css'
import { Topo } from './mirror/Topo'
import { MeshPreview } from './mirror/MeshPreview'
import { BANDS, CheckInScale, LiveChips, MirrorButton, Movers, ReadsChips, TickRing } from './mirror/parts'
import { readoutOf } from './mirror/readout'

import { FACE_SECONDS, analyseFace } from '../signals/face'
import { captureFace, drawOverlay, faceAvailable, loadLandmarker, loadVision, openFrontCamera } from '../signals/face-capture'
import { emptyFaceBaseline, faceFeatures, faceSentence, scoreFace, updateFaceBaseline } from '../signals/face-score'
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
 * the next run's camera (docs/mental-mirror.md).
 *
 * 18 October: the consent card and the camera panel sit on the tech ground
 * (ui/tech) with the How it works Mirror tab. 19 October, the owner: "too
 * many black gradient backgrounds", so that ground is light and only the
 * camera viewfinder stays dark (.mm-screen.is-live in mirror.css). The landmark
 * overlay glows through a CSS drop-shadow on its canvas;
 * signals/face-capture.js, which draws it, is unchanged.
 *
 * 19 October, the owner: "too dry". The whole flow is light now (views/
 * mirror/): a contour ground, a mesh preview before the camera opens, a ring
 * of ticks round the face for the 30 seconds, live chips with the same
 * figures the face tags draw, a one-tap check-in, and the result as light
 * cards. No longer on ui/tech. The logic below is unchanged; the only
 * addition is `tags`, a 4 Hz copy of the tag figures for the chips. */

/* The four bands of the dial (BANDS, ./mirror/parts), one per group of cues,
   each 0 to 100 where 50 is this person's usual. */
function bandsOf(result) {
  return BANDS.map(b => {
    const zs = result.contrib.filter(c => b.of.includes(c.id)).map(c => c.z)
    const z = zs.length ? zs.reduce((a, x) => a + x, 0) / zs.length : null
    return { id: b.id, name: b.name, glow: b.glow,
      value: z == null ? 50 : Math.round(100 / (1 + Math.exp(-1.1 * z))) }
  })
}

const PANEL = 'rounded-panel border border-rule/60 bg-card p-5 lg:p-6'
const HUD = ['left-2.5 top-2.5 border-l-2 border-t-2', 'right-2.5 top-2.5 border-r-2 border-t-2',
  'bottom-2.5 left-2.5 border-b-2 border-l-2', 'bottom-2.5 right-2.5 border-b-2 border-r-2']
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

const KEEP = ['Students only.', 'No picture is kept.', 'Not a diagnosis.']

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
  const [tags, setTags] = React.useState(null)   /* the chips' copy of the face tags, 4 Hz */
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
    setError(null); setResult(null); setFace(null); setSeen(false); setAnswered(false); setProgress(0); setTags(null)
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
    let lastPct = -1, lastPeek = 0, lastRead = 0, found = false
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
        if (now - lastRead > 250) { lastRead = now; setTags(readoutOf(res, pulseRef.current)) }
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
      <section className="mm mm-frame max-w-[48rem] p-5 sm:p-7" aria-labelledby="mm-start">
        <Topo/>
        <div className="grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_12.5rem] sm:gap-7">
          <div className="mm-bezel order-1 mx-auto w-[10.5rem] rounded-[28px] sm:order-2 sm:w-full">
            <div className="mm-screen rounded-[22px] px-[8%] py-[6%]"><MeshPreview/></div>
          </div>
          <div className="order-2 min-w-0 sm:order-1">
            <h2 id="mm-start" className="font-display text-head font-bold tracking-tight text-ink">Before you start</h2>
            <p className="mt-2 max-w-[40ch] text-sec text-ink-2">
              Google's MediaPipe Face Landmarker maps 478 points on your face for {FACE_SECONDS} seconds.
            </p>
            <ReadsChips className="mt-4"/>
            <ul className="m-0 mt-4 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0">
              {KEEP.map(line => (
                <li key={line} className="flex items-center gap-1.5 text-fine text-ink-2">
                  <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" aria-hidden focusable="false">
                    <path d="M3.5 8.5l2.8 2.6L12.5 5" fill="none" stroke="#067049" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {line}
                </li>
              ))}
            </ul>
            <MirrorButton className="mt-6 w-full sm:w-auto" onClick={agree} disabled={!supported}>Open the mirror</MirrorButton>
            {!supported && <p className="mt-3 text-fine text-ink-2">This browser cannot open a camera here.</p>}
          </div>
        </div>
      </section>
    )
  }

  /* One line under the viewfinder: what to do now. */
  const guide = phase === 'loading' ? "Loading Google's MediaPipe Face Landmarker…"
    : phase === 'working' ? 'Reading…'
    : phase === 'done' ? 'Done. The camera is off.'
    : phase === 'capture' ? (!seen ? 'Looking for a face…' : tags && !tags.present ? 'Face the light.' : 'Face found. Hold still.')
    : 'Face the phone in good light.'
  const still = phase === 'idle' || phase === 'loading'
  /* The status dot breathes while a face is in view, or while the model loads. */
  const glow = phase === 'loading' || phase === 'working' || (phase === 'capture' && !!tags?.present)

  return (
    <div className="mm grid gap-3 lg:gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] xl:items-start"
      data-reading={busy ? '' : undefined}>
      {/* ── the mirror ─────────────────────────────────────────────── */}
      <section className="mm-frame p-3 sm:p-5 lg:p-6" aria-label="Camera">
        <Topo/>
        <div className="mm-bezel mx-auto max-w-[34rem]">
          <div ref={boxRef} className={cn('mm-screen', phase === 'capture' && 'is-live')}
            style={{ aspectRatio: '4 / 3' }}>
            {/* Before the camera opens: the mesh, waiting inside the ring. */}
            <div aria-hidden className={cn('mm-fade absolute inset-0 flex items-center justify-center',
              still ? 'opacity-100' : 'opacity-0')}>
              {still && <MeshPreview className="w-[50%]"/>}
            </div>
            <video ref={videoRef} muted playsInline autoPlay
              className={cn('mm-fade absolute inset-0 h-full w-full object-cover', phase === 'capture' ? 'opacity-100' : 'opacity-0')}
              style={{ transform: 'scaleX(-1)' }} aria-hidden/>
            <TickRing progress={phase === 'capture' ? progress : phase === 'working' || phase === 'done' ? 100 : 0}
              live={phase === 'capture'}/>
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden
              style={{ filter: 'drop-shadow(0 0 4px rgba(62,207,154,.9))' }}/>
            {phase === 'capture' && <span aria-hidden className="mm-scan"/>}
            {HUD.map(k => (
              <span key={k} aria-hidden className={cn('pointer-events-none absolute size-5 rounded-[3px] border-accent-lit', k)}/>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-3 max-w-[34rem] space-y-2">
          <div className="mm-chip flex min-h-[48px] items-center justify-between gap-3 px-3.5 py-2">
            <p role="status" className="m-0 flex min-w-0 items-center gap-2.5 text-ui text-ink">
              <span aria-hidden className={cn('mm-dot shrink-0', glow && 'mm-breathe')}
                style={glow ? undefined : { background: '#93b2a1', boxShadow: 'none' }}/>
              {guide}
            </p>
            {phase === 'capture' && (
              <span className="shrink-0 font-display text-ui font-bold tabular-nums text-ink"
                role="progressbar" aria-label="Reading progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                {Math.round(progress / 100 * FACE_SECONDS)} / {FACE_SECONDS} s
              </span>
            )}
          </div>
          {phase === 'capture' && <LiveChips live={tags}/>}

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <MirrorButton onClick={run} disabled={busy || !supported}>
              {phase === 'done' ? 'Read again' : busy ? 'Reading…' : `Start · ${FACE_SECONDS}s`}
            </MirrorButton>
            {busy && <MirrorButton variant="ghost" onClick={stop}>Stop</MirrorButton>}
          </div>
          {error && (
            <p className="m-0 max-w-[44ch] rounded-2xl bg-coral-wash px-3.5 py-2.5 text-sec text-coral-ink" role="alert">{error}</p>
          )}
        </div>
      </section>

      {/* ── the result ─────────────────────────────────────────────── */}
      <section className="mm-frame p-4 sm:p-5 lg:p-6" aria-live="polite" aria-label={`Your ${SCORE}`}>
        <Topo/>
        {!result && (
          <>
            <p className="m-0 max-w-[36ch] text-sec text-ink-2">Your {SCORE} shows here.</p>
            <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">
              {BANDS.map(b => (
                <li key={b.id} className="mm-chip inline-flex min-h-[32px] items-center gap-2 px-3 text-fine text-ink-2">
                  <span aria-hidden className="h-1.5 w-4 rounded-full" style={{ background: b.glow }}/>{b.name}
                </li>
              ))}
            </ul>
          </>
        )}
        {result && (
          <div key={result.score + ':' + result.low} className="mm-reveal">
            <div className="flex justify-center">
              <RainbowDial score={result.score} size={300} rings={bandsOf(result)}/>
            </div>
            <div className="mt-2">
              <Headline>{s.lead}<b className={cn('font-bold', s.calm ? 'text-calm' : 'text-warn')}>{s.word}</b>.</Headline>
              <p className="mt-2 max-w-[40ch] text-meta text-ink-2">{s.tail}</p>
              <dl className="m-0 mt-4 flex flex-wrap gap-2">
                <div className="mm-chip px-3 py-2">
                  <dt className="text-fine text-ink-3">Range</dt>
                  <dd className="m-0 font-display text-ui font-bold tabular-nums text-ink">{result.low} to {result.high}</dd>
                </div>
                <div className="mm-chip px-3 py-2">
                  <dt className="text-fine text-ink-3">Pulse</dt>
                  <dd className="m-0 font-display text-ui font-bold text-ink">{face?.hr
                    ? <span className="tabular-nums">{Math.round(face.hr)} bpm</span>
                    : <span className="font-body font-normal text-ink-3">Not read</span>}</dd>
                </div>
              </dl>
            </div>

            {/* The check-in: the label this person teaches the model with. */}
            <div className="mm-chip mt-5 p-4">
              <CheckInScale answered={answered} onAnswer={answer}/>
            </div>

            <Movers result={result}/>
          </div>
        )}
      </section>
    </div>
  )
}
