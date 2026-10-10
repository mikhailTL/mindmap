import React from 'react'
import { Button } from '../ui/button'
import { Card, CardContent } from '@/ui/card'
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
import { SCORE_DEF } from '../lib/terms'
import { StepFigure, SAY_LINES } from '../charts/camera'

/* A reading with no patch, from the sensors a phone already has.
 *
 * The six questions still exist and still work. What they cannot do is produce
 * a measurement: they produce an opinion, scored. This screen puts a fingertip
 * on the camera for thirty seconds and one spoken sentence into the microphone
 * for fifteen, and hands the same model the same kind of features the patch
 * hands it: rate, beat-to-beat variation, and the way a voice is carrying.
 *
 * Nothing is uploaded. The frames are reduced to one number each as they
 * arrive and the audio is turned into six numbers and dropped; neither the
 * video nor the recording is ever written down, which is also why the result
 * cannot be recovered or replayed by anyone, including us.
 */

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

/* The live trace during a capture. A number ticking up says the phone is busy;
   a waveform that visibly beats is the only thing that tells someone their
   finger is in the right place before thirty seconds have gone by. */
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

/* The step marker was the numeral 01, 02, 03, which is one of the counting
   labels the review asked to see the back of. It was also doing a second job:
   dimming ahead of the capture and lighting as each stage passes. A dot keeps
   the state and drops the count, and the order is already carried by the
   stack. */
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

/* The lines a reader can repeat live in charts/camera beside the phone
   mockup that prints two of them, so the screen and the drawing cannot drift
   apart. */

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
  const videoRef = React.useRef(null)
  const live = React.useRef({ cam: null, ppg: null, motion: null })

  React.useEffect(() => { setBaseline(loadBaseline()) }, [])
  React.useEffect(() => () => {
    live.current.ppg?.cancel()
    stopStream(live.current.cam?.stream)
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
      setPhase('working')

      if (!ppg.ok) { setError(ppg.message); setPhase('idle'); return }

      const scored = scoreCapture({ ppg, voice, motion: move, baseline })
      if (!scored.ok) { setError('Nothing came through to score. Try again.'); setPhase('idle'); return }

      const next = updateBaseline(baseline, featuresFrom({ ppg, voice }), dayKey())
      setBaseline(next); saveBaseline(next)
      setResult(scored)
      setDetail({ ppg, voice, move, torch: cam.torch })
      setPhase('done')
    } catch (e) {
      stopStream(cam?.stream)
      setError(e?.name === 'NotAllowedError'
        ? 'The camera was not allowed. A reading needs it; the questions do not.'
        : (e?.message || 'Something stopped the capture.'))
      setPhase('idle')
    }
  }

  const busy = phase === 'camera' || phase === 'voice' || phase === 'working'
  const s = result ? sentenceFor(result) : null

  return (
    /* Gaps and top margins came down by about a third through this screen.
       It is the tallest thing on the page and every one of its stacked mt-
       steps was set independently, so the capture card opened on 24px, then
       28px between each live readout, then 32px before the buttons, and none
       of those gaps was carrying a division a rule was not already making. */
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] xl:items-start xl:gap-8">
      <div>
        <Card>
          <CardContent>
            {/* The opening line went. It said forty five seconds and nothing
                leaves the phone, both of which the page says above it, and it
                was costing the room these three steps needed to answer the
                questions a tester actually asked of them. */}
            {/* Four questions came back from one tester: which finger, cover
                it or touch it, rest the hand on what, and say what. Three of
                those are a position, so each step carries a small drawing and
                the sentence under it stays a sentence. */}
            <div>
              <Step on={PHASES[phase] >= 1}
                title={`Index fingertip over the camera · ${PPG_SECONDS}s`}
                note="Pad flat over the rear lens and flash. Rest it; pressing hard flattens the pulse.">
                <div className="mt-2.5 grid gap-2 sm:grid-cols-2 sm:gap-4">
                  <StepFigure kind="grip"/>
                  <StepFigure kind="rest"/>
                </div>
                <p className="mt-1.5 text-fine text-ink-3">Movement is what fails a reading.</p>
              </Step>
              <Step on={PHASES[phase] >= 2}
                title={`Say one sentence · ${VOICE_SECONDS}s`}
                note={'Somewhere quiet, no music or television. Phone about an arm\u2019s length '
                  + 'away. Normal voice. No words are kept.'}>
                <div className="mt-2.5"><StepFigure kind="quiet"/></div>
                <p className="mt-1.5 text-sec text-ink-3">Read one, or say anything you like:</p>
                <ul className="mt-1.5 list-none border-l-2 border-accent p-0 pl-3">
                  {SAY_LINES.map(l => (
                    <li key={l} className="text-sec leading-[1.5] text-ink">{l}</li>
                  ))}
                </ul>
              </Step>
              <Step on={PHASES[phase] >= 3}
                title="Your Mind Score, with a band"
                note="0 to 100, measured against your own normal. Which way it moved is the useful part, not the figure.">
                <p className="mt-2 max-w-[52ch] text-sec text-ink-3">
                  Higher means working harder. The band is how sure, from how clean the signal was.
                </p>
              </Step>
            </div>

            {/* The video element is the source the frames are read from. It is
                never shown: a live picture of the inside of a fingertip is a
                flat red rectangle, and the waveform underneath is the thing
                that actually tells you the capture is working. */}
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
              {/* Not "Take a reading": the tab this screen sits under is
                  already called that, and two controls on one page with the
                  same name is one control as far as a screen reader, or a
                  keyboard user reading a list of buttons, is concerned. */}
              <Button onClick={() => run(true)} disabled={busy || !supported}>
                {busy ? 'Reading…' : result ? 'Take another reading' : `Start the ${PPG_SECONDS + VOICE_SECONDS}-second reading`}
              </Button>
              <Button variant="outline" onClick={() => run(false)} disabled={busy || !supported}>
                Skip the voice step
              </Button>
            </div>
            {!supported && (
              <p className="mt-4 max-w-[46ch] text-meta text-ink-2">
                This browser will not hand over a camera. The questions still work.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 14rem of minimum height was an empty white box the size of a
          paragraph sitting beside a card twice as tall. The placeholder is one
          sentence, so the card is now the size of one sentence until there is
          a reading to put in it. */}
      <Card aria-live="polite" className="min-h-[7rem] xl:sticky xl:top-[92px]">
        <CardContent>
          {!result && (
            <>
              <p className="max-w-[36ch] text-sec text-ink-3">
                Your Mind Score appears here.
              </p>
              {/* The definition before the reading as well as beside it. Both
                  readers who asked what the number meant asked it on the way
                  in, not after. */}
              <p className="mt-2 max-w-[44ch] text-meta text-ink-3">{SCORE_DEF}</p>
            </>
          )}
          {result && (
            <>
              <div className="flex flex-col items-start gap-5">
                <RainbowDial score={result.score} size={248}
                  rings={[{ id:'phone', name:'Phone sensors', color:'#0a6e68', glow:'#1d8fb0',
                            value: result.score, reading: result.channels.join(' + ') }]}/>
                <div>
                  {/* The verdict alone at display size. The reason follows at
                      reading size: set in the same face and weight it ran to
                      six lines of 48px type, which is a paragraph pretending
                      to be a headline. */}
                  <Headline>{s.lead}<b className={cn('font-bold', s.calm ? 'text-calm' : 'text-warn')}>{s.word}</b>.</Headline>
                  <p className="mt-4 max-w-[42ch] text-sec text-ink-2">{s.tail}</p>

                  {/* The band is the honest part of the whole screen, so it is
                      printed at the same rank as the score rather than filed
                      under a disclosure. */}
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

                  {/* Two readers asked what the number means and neither of
                      them asked it before taking a reading, so the answer is
                      printed here as well as in the steps above. */}
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

/* What was actually measured, in the units it was measured in. A score with no
   way to see the numbers under it is a number to be taken on trust, and this
   product does not ask for that anywhere else. */
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
