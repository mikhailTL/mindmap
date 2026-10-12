import React from 'react'
import { Button } from '../ui/button'
import { Card, CardContent } from '@/ui/card'
import { List, Item } from '../ui/list'
import { Progress } from '../ui/progress'
import { Headline, AllDetail } from './Monitor'
import { RainbowDial } from '../charts/rainbow'
import { Diverge } from '../charts/diverge'
import { cn } from '../lib/utils'

import { PPG_SECONDS, VOICE_SECONDS, capturePPG, captureVoice, mediaAvailable, openCamera, stopStream } from '../signals/capture'
import { analysePPG } from '../signals/ppg'
import { analyseVoice } from '../signals/voice'
import { askMotion, startMotion, MOVE_LIMIT_G } from '../signals/motion'
import { bandOf, emptyBaseline, featuresFrom, scoreCapture, sentenceFor, updateBaseline } from '../signals/score'
import { fitCalibration, identityCalibration } from '../signals/tnam'
import { SCORE_DEF } from '../lib/terms'
import { StepFigure, SAY_LINES } from '../charts/camera'

/* Camera + mic reading, no patch. Features match the patch's (rate,
   beat-to-beat variation, voice) so both feed one scale.
 *
 * Nothing leaves the device. Each frame is reduced to a single number as it
 * arrives and the audio to six numbers, then dropped; no video or recording is
 * ever written, so a reading cannot be replayed or recovered. Any change that
 * buffers or persists raw media breaks that promise and the copy on screen. */

const STORE = 'mindmap.phone.baseline'

function loadBaseline() {
  try {
    const raw = localStorage.getItem(STORE)
    if (!raw) return emptyBaseline()
    const b = JSON.parse(raw)
    return b && typeof b === 'object' && b.stats ? b : emptyBaseline()
  } catch { return emptyBaseline() }
}
function saveBaseline(b) { try { localStorage.setItem(STORE, JSON.stringify(b)) } catch {} }
const dayKey = () => new Date().toISOString().slice(0, 10)

/* The person's check-in answers, and the calibration fitted from them: one
   gain per model curve, kept on this device like the baseline. Each answer is
   the model's view of that reading plus what the person said; no raw signal. */
const CHECKINS = 'mindmap.phone.checkins'
function loadCheckins() {
  try {
    const raw = localStorage.getItem(CHECKINS)
    const a = raw ? JSON.parse(raw) : []
    return Array.isArray(a) ? a.filter(e => Array.isArray(e.contributions)) : []
  } catch { return [] }
}
function saveCheckins(a) { try { localStorage.setItem(CHECKINS, JSON.stringify(a)) } catch {} }

/* The beating waveform is the only feedback that confirms finger placement
   before the capture window is spent. Keep it live. */
function Trace({ samples, className }) {
  const d = React.useMemo(() => {
    if (!samples?.length) return ''
    const tail = samples.slice(-180)
    const v = tail.map(s => s.v)
    const lo = Math.min(...v), hi = Math.max(...v)
    const span = hi - lo || 1
    return tail.map((s, i) =>
      `${i ? 'L' : 'M'}${((i / (tail.length - 1 || 1)) * 100).toFixed(2)} ${(28 - ((s.v - lo) / span) * 24).toFixed(2)}`
    ).join(' ')
  }, [samples])
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={cn('h-14 w-full', className)} aria-hidden>
      <path d={d} fill="none" stroke="#e11919" strokeWidth="0.9" vectorEffect="non-scaling-stroke"/>
    </svg>
  )
}

function Step({ title, note, children, on }) {
  return (
    <div className={cn('grid grid-cols-[2.25rem_1fr] gap-x-3 border-t border-rule py-3',
      !on && 'opacity-45')}>
      <span aria-hidden className={cn('mt-2 size-3 rounded-chip justify-self-center',
        on ? 'bg-accent' : 'border-2 border-ruling')}/>
      <div>
        <p className="font-display text-ui font-bold text-ink">{title}</p>
        <p className="mt-1 max-w-[52ch] text-sec leading-[1.45] text-ink-2">{note}</p>
        {children}
      </div>
    </div>
  )
}

/* SAY_LINES is defined in charts/camera so the screen and the drawings cannot
   drift apart. Only two of the three are printed: given three, readers read all
   three aloud before choosing. */

const PHASES = { idle:0, camera:1, voice:2, working:3, done:4 }

export function PhoneCheck() {
  const [phase, setPhase] = React.useState('idle')
  const [progress, setProgress] = React.useState(0)
  const [samples, setSamples] = React.useState([])
  const [level, setLevel] = React.useState(0)
  const [error, setError] = React.useState(null)
  const [result, setResult] = React.useState(null)
  const [detail, setDetail] = React.useState(null)
  const [baseline, setBaseline] = React.useState(emptyBaseline)
  const [checkins, setCheckins] = React.useState([])
  const [calibration, setCalibration] = React.useState(identityCalibration)
  const [answered, setAnswered] = React.useState(false)
  const videoRef = React.useRef(null)
  const live = React.useRef({ cam: null, ppg: null, motion: null })

  React.useEffect(() => {
    setBaseline(loadBaseline())
    const past = loadCheckins()
    setCheckins(past)
    setCalibration(fitCalibration(past))
  }, [])
  /* Leaving mid-reading unmounts this screen, so the cleanup is the only thing
     that stops the capture. The camera track and the frame loop end here, and
     so does the accelerometer listener. The microphone is the one exception:
     captureVoice owns its own stream and exposes no cancel, so a reading
     abandoned during the voice window releases the mic when that window
     closes. */
  React.useEffect(() => () => {
    live.current.ppg?.cancel()
    stopStream(live.current.cam?.stream)
    live.current.motion?.stop()
  }, [])

  const supported = mediaAvailable()

  async function run(withVoice = true) {
    setError(null); setResult(null); setDetail(null); setSamples([]); setProgress(0)
    let cam = null
    try {
      const motionOk = await askMotion()
      const motion = motionOk ? startMotion() : null
      live.current.motion = motion

      setPhase('camera')
      cam = await openCamera()
      live.current.cam = cam
      const video = videoRef.current
      video.srcObject = cam.stream
      video.muted = true
      await video.play().catch(() => {})

      const run1 = capturePPG(video, { seconds: PPG_SECONDS,
        onTick: (p, s) => { setProgress(p); setSamples(s.slice()) } })
      live.current.ppg = run1
      const frames = await run1.done
      stopStream(cam.stream); live.current.cam = null
      const ppg = analysePPG(frames)

      let voice = null
      if (withVoice && ppg.ok) {
        setPhase('voice'); setProgress(0)
        const rec = await captureVoice({ seconds: VOICE_SECONDS,
          onLevel: (peak, p) => { setLevel(peak); setProgress(p) } })
        const { pcm, fs } = await rec.done
        voice = analyseVoice(pcm, fs)
      }

      const move = motion?.stop() ?? null
      live.current.motion = null
      setPhase('working')

      if (!ppg.ok) { setError(ppg.message); setPhase('idle'); return }

      const scored = scoreCapture({ ppg, voice, motion: move, baseline, calibration })
      if (!scored.ok) { setError('Nothing came through to score. Try again.'); setPhase('idle'); return }

      const next = updateBaseline(baseline, featuresFrom({ ppg, voice }), dayKey())
      setBaseline(next); saveBaseline(next)
      setResult(scored)
      setAnswered(false)
      setDetail({ ppg, voice, move, torch: cam.torch })
      setPhase('done')
    } catch (e) {
      stopStream(cam?.stream)
      live.current.motion?.stop(); live.current.motion = null
      setError(e?.name === 'NotAllowedError'
        ? 'The camera was not allowed. A reading needs it; the questions do not.'
        : (e?.message || 'Something stopped the capture.'))
      setPhase('idle')
    }
  }

  /* One answer becomes one label; the calibration is refitted on all of them.
     A reading taken while moving is not labelled: the model did not score it. */
  const answer = stressed => {
    if (!result?.model || result.held) return
    const next = [...checkins, { contributions: result.model.contributions, temporal: result.model.temporal, label: stressed ? 1 : 0, day: dayKey() }].slice(-200)
    setCheckins(next); saveCheckins(next)
    setCalibration(fitCalibration(next))
    setAnswered(true)
  }

  const busy = phase === 'camera' || phase === 'voice' || phase === 'working'
  const s = result ? sentenceFor(result) : null

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] xl:items-start xl:gap-8">
      <div>
        <Card>
          <CardContent>
            {/* Each `note` carries only what its StepFigure cannot show: the
                position, the surface, and that nothing is kept. Do not restate
                the drawings in prose. */}
            <div>
              <Step on={PHASES[phase] >= 1}
                title={`Index fingertip over the camera · ${PPG_SECONDS}s`}
                note="Pad flat over lens and flash. Phone and forearm on a table.">
                <div className="mt-2.5 grid gap-2 sm:grid-cols-2 sm:gap-4">
                  <StepFigure kind="grip"/>
                  <StepFigure kind="rest"/>
                </div>
              </Step>
              <Step on={PHASES[phase] >= 2}
                title={`Say one sentence · ${VOICE_SECONDS}s`}
                note="Quiet room. No words are kept.">
                <div className="mt-2.5"><StepFigure kind="quiet"/></div>
                {/* The accent rule is the marker here: these are the lines to
                    say, not a run of separate points. */}
                <List className="mt-2.5 gap-1 border-l-2 border-accent pl-3">
                  {SAY_LINES.slice(0, 2).map(l => (
                    <Item key={l} marker="none" className="text-sec leading-[1.5] text-ink">{l}</Item>
                  ))}
                </List>
              </Step>
              <Step on={PHASES[phase] >= 3}
                title="Your Mind Score and band"
                note="0 to 100, against your own normal."/>
            </div>

            {/* Frames are read off this element. It must stay in the DOM and
                playing: `sr-only` hides it without `display:none`, which stops
                frame delivery. Do not swap it for `hidden`. */}
            <video ref={videoRef} playsInline muted className="sr-only" aria-hidden tabIndex={-1}/>

            {phase === 'camera' && (
              <div className="mt-5" aria-live="polite">
                <p className="font-mono text-meta tabular-nums text-ink-3">
                  Reading your pulse · {Math.max(0, Math.ceil(PPG_SECONDS * (1 - progress)))}s left
                </p>
                <Trace samples={samples} className="mt-2"/>
                <Progress className="mt-2" value={progress * 100} label="Pulse capture progress"/>
              </div>
            )}

            {phase === 'voice' && (
              <div className="mt-5" aria-live="polite">
                <p className="font-mono text-meta tabular-nums text-ink-3">
                  Listening · {Math.max(0, Math.ceil(VOICE_SECONDS * (1 - progress)))}s left
                </p>
                <div className="mt-3 flex h-14 items-end gap-1" aria-hidden>
                  {Array.from({ length: 32 }, (_, i) => (
                    <span key={i} className="flex-1 bg-beam"
                      style={{ height: `${Math.max(4, Math.min(100, level * 260 * (0.55 + 0.45 * Math.sin(i))))}%` }}/>
                  ))}
                </div>
                <Progress className="mt-2" value={progress * 100} label="Voice capture progress"/>
              </div>
            )}

            {phase === 'working' && <p className="mt-5 text-sec text-ink-2" aria-live="polite">Working it out…</p>}

            {error && (
              <p role="alert" className="mt-5 max-w-[46ch] border-l-2 border-warn pl-3 text-sec text-warn">
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {/* Must not be labelled "Take a reading" — that is the enclosing
                  tab's name, and two identically named controls are one control
                  to a screen reader. */}
              <Button onClick={() => run(true)} disabled={busy || !supported}>
                {busy ? 'Reading…' : result ? 'Take another reading' : `Start the ${PPG_SECONDS + VOICE_SECONDS}-second reading`}
              </Button>
              <Button variant="outline" onClick={() => run(false)} disabled={busy || !supported}>
                Skip the voice
              </Button>
            </div>
            {!supported && (
              <p className="mt-4 max-w-[46ch] text-meta text-ink-2">
                No camera in this browser. The questions still work.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card aria-live="polite" className="min-h-[7rem] xl:sticky xl:top-[92px]">
        <CardContent>
          {!result && (
            <p className="max-w-[36ch] text-sec text-ink-3">
              Your Mind Score appears here.
            </p>
          )}
          {result && (
            <>
              <div className="flex flex-col items-start gap-5">
                <RainbowDial score={result.score} size={248}
                  rings={[{ id:'phone', name:'Phone sensors', color:'#0a6e68', glow:'#1d8fb0',
                            value: result.score, reading: result.channels.join(' + ') }]}/>
                <div>
                  <Headline>{s.lead}<b className={cn('font-bold', s.calm ? 'text-calm' : 'text-warn')}>{s.word}</b>.</Headline>
                  <p className="mt-4 max-w-[42ch] text-sec text-ink-2">{s.tail}</p>

                  {/* The confidence band ranks with the score, not behind a
                      disclosure. Do not move it into AllDetail. */}
                  <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-sec">
                    <dt className="text-ink-3">Mind Score</dt>
                    <dd className="m-0 font-mono tabular-nums text-ink">{result.score} out of 100</dd>
                    <dt className="text-ink-3">How sure</dt>
                    <dd className="m-0 font-mono tabular-nums text-ink">
                      {result.low} to {result.high} <span className="text-ink-3">(±{result.half})</span>
                    </dd>
                    <dt className="text-ink-3">Read from</dt>
                    <dd className="m-0 text-ink">{result.channels.join(' and ')}
                      {result.missing.length > 0 && <span className="text-ink-3"> · no {result.missing.join(', ')}</span>}
                    </dd>
                    <dt className="text-ink-3">Your history</dt>
                    <dd className="m-0 text-ink">{result.baselineDays === 0
                      ? 'none yet, so the band is wide on purpose'
                      : `${result.baselineDays} day${result.baselineDays === 1 ? '' : 's'}`}</dd>
                  </dl>

                  <p className="mt-4 max-w-[48ch] text-meta text-ink-3">{SCORE_DEF}</p>
                  <p className="mt-2 max-w-[48ch] text-meta text-ink-3">
                    Higher means working harder. The direction it moved matters more than the
                    figure. The band is how sure, from how clean the signal was.
                  </p>

                  {result.held && (
                    <p className="mt-5 max-w-[44ch] border-l-2 border-warn pl-3 text-sec text-warn">
                      {result.holdReason}
                    </p>
                  )}

                  {/* The check-in. The answer is the label the model learns this
                      person from: one gain per signal, refitted here, on this
                      device. Eight answers took a lab-trained model from 0.78 to
                      0.95 on people it had never seen (see tnam-results.js). */}
                  {!result.held && (
                    <div className="mt-6 border-t border-line pt-5">
                      {!answered ? (
                        <>
                          <p className="max-w-[40ch] text-sec text-ink">Does this match how you feel right now?</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button onClick={() => answer(true)}>Stressed</Button>
                            <Button variant="outline" onClick={() => answer(false)}>Fine</Button>
                          </div>
                          <p className="mt-3 max-w-[44ch] text-meta text-ink-3">
                            {checkins.length === 0
                              ? 'Your first answer starts your personal calibration.'
                              : `${checkins.length} answer${checkins.length === 1 ? '' : 's'} so far shape how your readings are weighed.`}
                          </p>
                        </>
                      ) : (
                        <p className="max-w-[44ch] text-sec text-ink-2">
                          Noted. <span className="font-mono tabular-nums">{checkins.length}</span> answer{checkins.length === 1 ? '' : 's'} now
                          shape how your readings are weighed. The next reading uses them.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <AllDetail label="See what moved your Mind Score">
                <p className="mt-2 max-w-[52ch] text-sec text-ink-3">
                  Right of the line raised the Mind Score, left of it lowered it. Each bar is that feature
                  against your own average, not against anybody else's.
                </p>
                <Diverge items={result.contrib.map(c => ({ label: c.label,
                  x: Math.max(-1, Math.min(1, c.raw)) }))}/>
                <Readings detail={detail} result={result}/>
              </AllDetail>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* Raw measured values in their own units. The closing paragraph's claims are
   load-bearing: the index runs ~20% below a clinical RMSSD and must never be
   called one, and nothing here has been validated against a person. */
function Readings({ detail, result }) {
  if (!detail) return null
  const { ppg, voice, move, torch } = detail
  const rows = []
  rows.push(['Heart rate', `${ppg.hr.toFixed(0)} bpm`])
  rows.push(['Beats used', `${ppg.beats}${ppg.dropped ? ` · ${ppg.dropped} rejected as artefact` : ''}`])
  rows.push(['Beat-to-beat index',
    !ppg.hrvOk ? `withheld. Beat timing was uncertain to ${ppg.jitterMs.toFixed(0)} ms`
    : ppg.hrvResolved ? `${ppg.rmssd.toFixed(0)} ms ± ${ppg.rmssdBand.toFixed(0)}`
    : `under ${(ppg.rmssd + ppg.rmssdBand).toFixed(0)} ms, steadier than this can resolve`])
  rows.push(['Signal quality', `${Math.round(ppg.quality * 100)}%${torch ? '' : ' · no torch on this device'}`])
  if (voice?.ok) {
    rows.push(['Pitch', `${voice.f0Mean.toFixed(0)} Hz`])
    rows.push(['Speech found', `${voice.voicedS.toFixed(1)} s of ${voice.durS.toFixed(0)} s`])
  } else if (voice) {
    rows.push(['Voice', voice.message])
  }
  if (move?.ok) rows.push(['Movement', `${move.peak.toFixed(2)} g peak · limit ${MOVE_LIMIT_G} g`])
  return (
    <>
      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 text-meta">
        {rows.map(([k, v]) => (
          <React.Fragment key={k}>
            <dt className="text-ink-3">{k}</dt>
            <dd className="m-0 font-mono tabular-nums text-ink-2">{v}</dd>
          </React.Fragment>
        ))}
      </dl>
      <p className="mt-6 max-w-[64ch] text-meta text-ink-2">
        The camera gives heart rate and a beat-to-beat index on a scale of its own. The filter that
        steadies beat timing also trims some real variation, so the index runs about a fifth below a
        clinical RMSSD and is never called one. Every feature is scored against your own history, which
        is what lets a phone reading and a patch reading share one scale. Nothing here has been
        validated against a person.
      </p>
    </>
  )
}
