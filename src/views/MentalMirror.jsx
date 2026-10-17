import React from 'react'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { Headline, AllDetail } from './Monitor'
import { RainbowDial } from '../charts/rainbow'
import { Diverge } from '../charts/diverge'
import { cn } from '../lib/utils'
import { SCORE, SCORE_DEF } from '../lib/terms'
import { addReading } from '../lib/readingLog'

import { FACE_SECONDS, analyseFace } from '../signals/face'
import { captureFace, drawMesh, faceAvailable, loadLandmarker, loadVision, openFrontCamera } from '../signals/face-capture'
import { FACE_TERMS, emptyFaceBaseline, faceFeatures, faceSentence, scoreFace, updateFaceBaseline } from '../signals/face-score'
import { fitCalibration, identityCalibration } from '../signals/tnam'

/* The Mental Mirror. The front camera, a mesh drawn over the face as it is
 * read, thirty seconds, one Mind Score. Students only: the route is inside
 * the student app and the screen asks once before the camera opens.
 *
 * Nothing leaves the device. Each frame becomes 52 expression scores, one
 * eye figure, one nose position and one skin-colour level, then is dropped.
 * No image is kept or sent, in either mode. The copy on screen says so; any
 * change that buffers or persists frames breaks it.
 *
 * The heart rate read off the skin goes through the Mind Score model with
 * this person's calibration. The expression features enter with a starting
 * allocation that has not been fitted, and the screen says that too. */

const PANEL = 'rounded-panel border border-rule bg-card p-4 lg:p-5'
const STORE = 'mindmap.mirror.baseline'
const CHECKINS = 'mindmap.phone.checkins'   /* shared with the camera reading: one calibration per person */
const CONSENT = 'mindmap.mirror.ok'

function load(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback } catch { return fallback }
}
function save(key, v) { try { localStorage.setItem(key, JSON.stringify(v)) } catch {} }
const dayKey = () => new Date().toISOString().slice(0, 10)

/* What is read, in the words a student would use. Shown live, so the
   reading is never a black box while it runs. */
const LIVE = [
  ['blinkRate', 'Blinks', v => `${Math.round(v)}/min`],
  ['browFurrow', 'Brow', v => `${Math.round(v * 100)}%`],
  ['lipPress', 'Lips', v => `${Math.round(v * 100)}%`],
  ['eyeSquint', 'Eyes', v => `${Math.round(v * 100)}%`],
]

export function MentalMirror({ go }) {
  const videoRef = React.useRef(null)
  const canvasRef = React.useRef(null)
  const live = React.useRef({ stream: null, capture: null, vision: null })

  const [consented, setConsented] = React.useState(() => load(CONSENT, false) === true)
  const [phase, setPhase] = React.useState('idle')   /* idle · loading · capture · working · done */
  const [progress, setProgress] = React.useState(0)
  const [seen, setSeen] = React.useState(false)
  const [peek, setPeek] = React.useState(null)       /* running feature readout during capture */
  const [error, setError] = React.useState(null)
  const [result, setResult] = React.useState(null)
  const [face, setFace] = React.useState(null)
  const [baseline, setBaseline] = React.useState(emptyFaceBaseline)
  const [checkins, setCheckins] = React.useState([])
  const [calibration, setCalibration] = React.useState(identityCalibration)
  const [answered, setAnswered] = React.useState(false)
  const supported = faceAvailable()

  React.useEffect(() => {
    const b = load(STORE, null)
    setBaseline(b && b.stats ? b : emptyFaceBaseline())
    const past = load(CHECKINS, []).filter(e => Array.isArray(e?.contributions))
    setCheckins(past)
    setCalibration(fitCalibration(past))
    return () => stopAll()
  }, [])

  const stopAll = () => {
    live.current.capture?.cancel(); live.current.capture = null
    live.current.stream?.getTracks().forEach(t => t.stop()); live.current.stream = null
  }

  const agree = () => { save(CONSENT, true); setConsented(true) }

  const run = async () => {
    setError(null); setResult(null); setFace(null); setPeek(null); setSeen(false); setAnswered(false)
    setPhase('loading')
    try {
      const [landmarker, vision, cam] = await Promise.all([loadLandmarker(), loadVision(), openFrontCamera()])
      live.current.stream = cam.stream
      live.current.vision = vision
      const video = videoRef.current
      video.srcObject = cam.stream
      await video.play()
      const canvas = canvasRef.current
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      const ctx = canvas.getContext('2d')

      setPhase('capture')
      let tick = 0
      const capture = captureFace(video, landmarker, {
        seconds: FACE_SECONDS,
        onFrame: (res, rec, frac) => {
          drawMesh(ctx, res, vision, { width: canvas.width, height: canvas.height })
          setProgress(frac)
          if (rec) setSeen(true)
          /* A running readout every half second, from the frames so far. */
          if (++tick % 15 === 0) {
            const partial = analyseFace(capture.frames)
            if (partial?.ok) setPeek(partial)
          }
        },
      })
      live.current.capture = capture
      const frames = await capture.done
      stopAll()
      setPhase('working')

      const analysed = analyseFace(frames)
      if (!analysed.ok) { setError(analysed.message); setPhase('idle'); return }
      const scored = scoreFace({ face: analysed, baseline, calibration })
      if (!scored.ok) { setError('Nothing came through to score. Try again in better light.'); setPhase('idle'); return }

      const next = updateFaceBaseline(baseline, faceFeatures(analysed), dayKey())
      setBaseline(next); save(STORE, next)
      setFace(analysed)
      setResult(scored)
      addReading?.({ at: Date.now(), score: scored.score, source: 'mirror', pulse: analysed.hr ?? undefined })
      setPhase('done')
    } catch (e) {
      stopAll()
      setError(e?.name === 'NotAllowedError'
        ? 'The camera was not allowed. The other ways to take a reading still work.'
        : (e?.message || 'Something stopped the capture.'))
      setPhase('idle')
    }
  }

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
  const n = checkins.length

  if (!consented) {
    return (
      <div className={cn(PANEL, 'max-w-[60ch]')}>
        <h3 className="font-display text-row font-bold text-ink">Before the mirror opens</h3>
        <dl className="m-0 mt-3 list-none p-0">
          {[
            ['For students', 'The mirror is part of the student app and is read against your own earlier readings, never against anyone else.'],
            ['Nothing leaves the phone', 'Each frame becomes a few numbers (how far your brow moved, how often you blinked, the colour of a patch of forehead) and is dropped. No picture is kept or sent.'],
            ['Not a diagnosis', `It gives a ${SCORE}, the same 0 to 100 the other readings give, and a range for how sure it is.`],
            ['Still being validated', 'The pulse comes from a published method. The expression weights are a starting allocation and have not been fitted to a dataset yet. The range is wider on purpose.'],
          ].map(([k, v]) => (
            <div key={k} className="border-b border-rule py-2.5 last:border-b-0">
              <dt className="font-display text-ui font-medium text-ink">{k}</dt>
              <dd className="m-0 mt-0.5 text-fine text-ink-2">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={agree} disabled={!supported}>I understand, open the mirror</Button>
          {go && <Button variant="outline" onClick={() => go('reading')}>Not now</Button>}
        </div>
        {!supported && <p className="mt-3 text-fine text-ink-3">This browser cannot open a camera here.</p>}
      </div>
    )
  }

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] xl:items-start lg:gap-4">
      {/* ── the mirror ─────────────────────────────────────────────── */}
      <div className={PANEL}>
        <div className="relative overflow-hidden rounded-field bg-ink/90" style={{ aspectRatio: '4 / 3' }}>
          <video ref={videoRef} muted playsInline autoPlay
            className={cn('absolute inset-0 h-full w-full object-cover', phase === 'capture' ? 'opacity-100' : 'opacity-0')}
            style={{ transform: 'scaleX(-1)' }} aria-hidden/>
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden/>
          {phase !== 'capture' && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              <p className="max-w-[32ch] text-sec text-paper/90">
                {phase === 'loading' ? 'Loading the face model…'
                  : phase === 'working' ? 'Reading…'
                  : phase === 'done' ? 'Done. The camera is off.'
                  : 'Face the phone in good light. Thirty seconds, no talking needed.'}
              </p>
            </div>
          )}
          {phase === 'capture' && !seen && (
            <p className="absolute inset-x-0 bottom-3 text-center text-fine text-paper/90">Looking for a face…</p>
          )}
        </div>

        {phase === 'capture' && (
          <div className="mt-3">
            <Progress value={Math.round(progress * 100)} max={100}/>
            <dl className="m-0 mt-3 grid grid-cols-4 gap-2 text-center">
              {LIVE.map(([k, label, fmt]) => (
                <div key={k}>
                  <dt className="text-fine text-ink-3">{label}</dt>
                  <dd className="m-0 font-mono text-ui tabular-nums text-ink">{peek?.[k] != null ? fmt(peek[k]) : '—'}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-fine text-ink-3">
              Pulse {peek?.hr ? `${Math.round(peek.hr)} bpm from skin colour` : 'locking…'}
            </p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={run} disabled={busy || !supported}>
            {phase === 'done' ? 'Read again' : busy ? 'Reading…' : `Start · ${FACE_SECONDS}s`}
          </Button>
          {busy && <Button variant="outline" onClick={() => { stopAll(); setPhase('idle') }}>Stop</Button>}
        </div>
        {error && <p className="mt-3 max-w-[48ch] text-sec text-warn" role="alert">{error}</p>}
        <p className="mt-3 max-w-[52ch] text-fine text-ink-3">
          The lines are the model reading your face as it happens. Frames become numbers on the phone and are dropped; nothing is kept or sent.
        </p>
      </div>

      {/* ── the result ─────────────────────────────────────────────── */}
      <div className={PANEL} aria-live="polite">
        {!result && (
          <p className="max-w-[36ch] text-sec text-ink-3">Your {SCORE} appears here.</p>
        )}
        {result && (
          <>
            <div className="flex flex-col items-start gap-4">
              <RainbowDial score={result.score} size={300}
                rings={[{ id: 'mirror', name: 'Mirror', glow: '#1d8fb0', value: result.score,
                          reading: result.heartRead ? 'face + pulse' : 'face' }]}/>
              <div className="w-full">
                <Headline>{s.lead}<b className={cn('font-bold', s.calm ? 'text-calm' : 'text-warn')}>{s.word}</b>.</Headline>
                <p className="mt-3 max-w-[42ch] text-meta text-ink-2">{s.tail}</p>

                <dl className="m-0 mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-meta">
                  <dt className="text-ink-3">{SCORE}</dt>
                  <dd className="m-0 font-mono tabular-nums text-ink">{result.score} out of 100</dd>
                  <dt className="text-ink-3">How sure</dt>
                  <dd className="m-0 font-mono tabular-nums text-ink">
                    {result.low} to {result.high} <span className="text-ink-3">(±{result.half})</span>
                    <span className="text-ink-3"> · {result.baselineDays === 0
                      ? 'no history yet, so a wide band'
                      : `${result.baselineDays} day${result.baselineDays === 1 ? '' : 's'} of history`}</span>
                  </dd>
                  <dt className="text-ink-3">Pulse</dt>
                  <dd className="m-0 text-ink">{face?.hr
                    ? <><span className="font-mono tabular-nums">{Math.round(face.hr)} bpm</span> from skin colour, quality {Math.round(face.hrQuality * 100)}%</>
                    : <span className="text-ink-3">not read this time; the face alone was scored</span>}</dd>
                  <dt className="text-ink-3">Face in view</dt>
                  <dd className="m-0 font-mono tabular-nums text-ink">{Math.round((face.framesSeen / face.frames) * 100)}% of frames</dd>
                </dl>

                <p className="mt-4 max-w-[48ch] text-meta text-ink-3">{SCORE_DEF}</p>

                {/* The check-in: the label this person teaches the model with. */}
                <div className="mt-5 border-t border-rule pt-4">
                  {!answered ? (
                    <>
                      <p className="max-w-[40ch] text-sec text-ink">Does this match how you feel right now?</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button onClick={() => answer(true)}>Stressed</Button>
                        <Button variant="outline" onClick={() => answer(false)}>Fine</Button>
                      </div>
                      <p className="mt-3 max-w-[44ch] text-fine text-ink-3">
                        {n === 0 ? 'Your first answer starts your own calibration.'
                          : `${n} answer${n === 1 ? '' : 's'} so far shape how your readings are weighed.`}
                      </p>
                    </>
                  ) : (
                    <p className="max-w-[44ch] text-sec text-ink-2">
                      Noted. <span className="font-mono tabular-nums">{n}</span> answer{n === 1 ? '' : 's'} now shape how
                      your readings are weighed, here and in the fingertip reading.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <AllDetail label={`See what moved your ${SCORE}`}>
              <p className="mt-2 max-w-[52ch] text-sec text-ink-3">
                Right of the line raised the {SCORE}, left of it lowered it. Each bar is that feature against your
                own earlier mirror readings.
              </p>
              <Diverge items={result.contrib.map(c => ({ label: c.label, x: Math.max(-1, Math.min(1, c.raw)) }))}/>
              <dl className="m-0 mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-fine">
                {FACE_TERMS.map(t => (
                  <React.Fragment key={t.id}>
                    <dt className="text-ink-3">{t.label}</dt>
                    <dd className="m-0 font-mono tabular-nums text-ink">
                      {result.features[t.id] == null ? '—'
                        : t.id === 'blinkRate' ? `${result.features[t.id].toFixed(1)} per min`
                        : t.id === 'headMotion' ? `${(result.features[t.id] * 100).toFixed(1)}% face width per s`
                        : t.id === 'earVar' ? `${(result.features[t.id] * 100).toFixed(0)}% variation`
                        : `${Math.round(result.features[t.id] * 100)}%`}
                    </dd>
                  </React.Fragment>
                ))}
              </dl>
              <p className="mt-4 max-w-[52ch] text-fine text-ink-3">
                The pulse is read by a published method (skin-colour photoplethysmography) and goes through the same
                learned model as the fingertip reading. The expression weights are a starting allocation, not a fitted
                result: no dataset pairs face video with stress on these sensors yet, which is why the band is wider here.
                Nothing on this screen has been validated against a person.
              </p>
            </AllDetail>
          </>
        )}
      </div>
    </div>
  )
}
