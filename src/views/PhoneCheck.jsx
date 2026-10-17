import React from 'react'
import { Button } from '../ui/button'
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
import { SCORE, SCORE_DEF } from '../lib/terms'
import { StepFigure, SAY_LINES } from '../charts/camera'
import { addReachPoint, getReach } from '../app/store'
import { addReading } from '../lib/readingLog'
import { FS } from '../signals/ppg'
import { PulseChart, SeeTrends } from './student/charts'

/* Camera + mic reading, no patch. Each frame becomes one number and the
   audio six, then both are dropped. Only the resulting Mind Score is saved,
   and it syncs to the student's account. Never buffer or persist raw media. */

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

/* Reach: one coarse position per reading, only while Reach is on. */
function captureReachPoint(onDone) {
  if (!getReach().on) return
  const geo = typeof navigator !== 'undefined' ? navigator.geolocation : null
  if (!geo?.getCurrentPosition) { onDone(false); return }
  try {
    geo.getCurrentPosition(
      pos => { addReachPoint(pos.coords.latitude, pos.coords.longitude); onDone(true) },
      () => onDone(false),
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 8000 })
  } catch { onDone(false) }
}

/* Check-in answers and their calibration, on this device. No raw signal. */
const CHECKINS = 'mindmap.phone.checkins'
function loadCheckins() {
  try {
    const raw = localStorage.getItem(CHECKINS)
    const a = raw ? JSON.parse(raw) : []
    return Array.isArray(a) ? a.filter(e => Array.isArray(e.contributions)) : []
  } catch { return [] }
}
function saveCheckins(a) { try { localStorage.setItem(CHECKINS, JSON.stringify(a)) } catch {} }

const PANEL = 'rounded-panel border border-rule bg-card p-4 lg:p-5'

/* The waveform confirms finger placement. Keep it live. */
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
    <div className="grid grid-cols-[2.25rem_1fr] gap-x-3 border-t border-rule py-3">
      <span aria-hidden className={cn('mt-2 size-3 rounded-chip justify-self-center',
        on ? 'bg-accent' : 'border-2 border-ruling')}/>
      <div>
        <p className={cn('font-display text-ui font-bold', on ? 'text-ink' : 'text-ink-2')}>{title}</p>
        <p className="mt-1 max-w-[52ch] text-meta leading-[1.4] text-ink-2">{note}</p>
        {children}
      </div>
    </div>
  )
}

/* Before a reading. On a phone this card sits under the steps, so it stays
   one line. On xl it sits beside a long column of steps, so it shows the
   empty rainbow the score will land on and what the result will hold: every
   row below is a part of the result panel further down this file. */
const AFTER = [
  `Your ${SCORE} on the rainbow`,
  'The pulse it was read from',
  'How sure the score is',
  'Does this match how you feel?',
]
const WAIT_R = [118, 98, 78, 58]

function Waiting() {
  return (
    <div>
      <div aria-hidden className="mx-auto hidden w-full max-w-[300px] xl:block">
        <svg viewBox="0 0 300 172" className="block w-full">
          {WAIT_R.map(r => (
            <path key={r} d={`M${150 - r} 150a${r} ${r} 0 0 1 ${2 * r} 0`} fill="none"
              stroke="#e3ede7" strokeWidth="14" strokeLinecap="round"/>
          ))}
          <text x="150" y="140" textAnchor="middle" fill="#426a58" fontFamily="Chivo, sans-serif"
            fontSize="34" fontWeight="700">--</text>
          <text x="32" y="166" textAnchor="middle" fill="#426a58" fontFamily="Chivo, sans-serif" fontSize="13">0 calm</text>
          <text x="268" y="166" textAnchor="middle" fill="#426a58" fontFamily="Chivo, sans-serif" fontSize="13">100 peak</text>
        </svg>
      </div>
      <p className="max-w-[36ch] text-meta text-ink-3 xl:mt-4 xl:text-center xl:font-display xl:font-bold xl:text-ink xl:mx-auto">
        Your Mind Score appears here.
      </p>
      <div className="mt-4 hidden border-t border-rule pt-4 xl:block">
        <p className="text-fine font-semibold text-ink-3">After the reading</p>
        <ol className="m-0 mt-2 grid list-none gap-2 p-0">
          {AFTER.map((t, i) => (
            <li key={t} className="grid grid-cols-[1.5rem_1fr] items-baseline gap-2 text-meta text-ink-2">
              <span className="text-right font-display text-ui font-bold tabular-nums text-accent">{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

/* SAY_LINES lives in charts/camera. Only two of three are printed. */

const PHASES = { idle:1, camera:1, voice:2, working:3, done:4 }

export function PhoneCheck({ go }) {
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
  const [noPosition, setNoPosition] = React.useState(false)
  const [logged, setLogged] = React.useState(false)
  const videoRef = React.useRef(null)
  const live = React.useRef({ cam: null, ppg: null, motion: null })

  React.useEffect(() => {
    setBaseline(loadBaseline())
    const past = loadCheckins()
    setCheckins(past)
    setCalibration(fitCalibration(past))
  }, [])
  /* Unmounting is what stops the camera, frame loop and accelerometer.
     captureVoice releases the mic itself when its window closes. */
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
      if (!scored.ok) { setError('No signal came through. Try again.'); setPhase('idle'); return }

      const next = updateBaseline(baseline, featuresFrom({ ppg, voice }), dayKey())
      setBaseline(next); saveBaseline(next)
      setResult(scored)
      /* A held reading is shown with its reason but kept out of the log. */
      setLogged(scored.held ? false
        : !!addReading({ at: Date.now(), score: scored.score, source: 'camera', pulse: ppg.hr }))
      setAnswered(false)
      setDetail({ ppg, voice, move, torch: cam.torch })
      setPhase('done')
      setNoPosition(false)
      captureReachPoint(ok => setNoPosition(!ok))
    } catch (e) {
      stopStream(cam?.stream)
      live.current.motion?.stop(); live.current.motion = null
      setError(e?.name === 'NotAllowedError'
        ? 'The camera was not allowed. The check-in questions still work.'
        : (e?.message || 'Something stopped the capture.'))
      setPhase('idle')
    }
  }

  /* One answer is one label; the calibration is refitted on all of them. */
  const answer = stressed => {
    if (!result?.model || result.held) return
    const next = [...checkins, { contributions: result.model.contributions, temporal: result.model.temporal, label: stressed ? 1 : 0, day: dayKey() }].slice(-200)
    setCheckins(next); saveCheckins(next)
    setCalibration(fitCalibration(next))
    setAnswered(true)
  }

  const busy = phase === 'camera' || phase === 'voice' || phase === 'working'
  const s = result ? sentenceFor(result) : null
  const n = checkins.length
  const plural = n === 1 ? '' : 's'

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,32rem)] xl:items-start lg:gap-4">
      <div>
        <div className={PANEL}>
            {/* Each note carries only what its StepFigure cannot show. */}
            <div>
              <Step on={PHASES[phase] >= 1}
                title={`Fingertip on the camera · ${PPG_SECONDS}s`}
                note="Fingertip flat over the lens, forearm on the table.">
                <div className="mt-2.5 grid gap-2 sm:grid-cols-2 sm:gap-4">
                  <StepFigure kind="grip"/>
                  <StepFigure kind="rest"/>
                </div>
              </Step>
              <Step on={PHASES[phase] >= 2}
                title={`Say one sentence · ${VOICE_SECONDS}s`}
                note="A quiet room. No words are kept.">
                <div className="mt-2.5"><StepFigure kind="quiet"/></div>
                <List className="mt-2.5 gap-1 border-l-2 border-accent pl-3">
                  {SAY_LINES.slice(0, 2).map(l => (
                    <Item key={l} marker="none" className="text-meta leading-[1.45] text-ink">{l}</Item>
                  ))}
                </List>
              </Step>
              <Step on={PHASES[phase] >= 3}
                title="See your Mind Score"
                note="0 to 100, against your own normal."/>
            </div>

            {/* Frames are read off this element. `display:none` would stop them. */}
            <video ref={videoRef} playsInline muted className="sr-only" aria-hidden tabIndex={-1}/>

            {phase === 'camera' && (
              <div className="mt-4" aria-live="polite">
                <p className="font-mono text-meta tabular-nums text-ink-3">
                  Reading your pulse · {Math.max(0, Math.ceil(PPG_SECONDS * (1 - progress)))}s left
                </p>
                <Trace samples={samples} className="mt-2"/>
                <Progress className="mt-2" value={progress * 100} label="Pulse capture progress"/>
              </div>
            )}

            {phase === 'voice' && (
              <div className="mt-4" aria-live="polite">
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

            {phase === 'working' && <p className="mt-4 text-meta text-ink-2" aria-live="polite">Working out your score…</p>}

            {error && (
              <p role="alert" className="mt-4 max-w-[46ch] border-l-2 border-warn pl-3 text-meta text-warn">
                {error}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              {/* Not "Take a reading": that is the enclosing tab's name. */}
              <Button onClick={() => run(true)} disabled={busy || !supported}>
                {busy ? 'Reading…' : result ? 'Take another reading' : `Start the ${PPG_SECONDS + VOICE_SECONDS} second reading`}
              </Button>
              <Button variant="outline" onClick={() => run(false)} disabled={busy || !supported}>
                Skip the voice
              </Button>
            </div>
            {!supported && (
              <p className="mt-3 max-w-[46ch] text-fine text-ink-2">
                No camera in this browser. The questions still work.
              </p>
            )}
        </div>
      </div>

      <section aria-live="polite" className={cn(PANEL, 'min-h-[7rem] xl:sticky xl:top-[92px]')}>
          {!result && <Waiting/>}
          {result && (
            <>
              <div className="flex flex-col items-start gap-4">
                {/* The owner, 17 October: a camera reading reads like patch data,
                    the Mind Score on the rainbow, then the pulse it was read
                    from. The heart band carries it, as on the patch dial. */}
                <RainbowDial score={result.score} size={300}
                  rings={[{ id:'heart', name:'Heart', glow:'#e11919',
                            value: result.score, reading: result.channels.join(' + ') }]}/>
                <div className="w-full">
                  <Headline>{s.lead}<b className={cn('font-bold', s.calm ? 'text-calm' : 'text-warn')}>{s.word}</b>.</Headline>
                  <p className="mt-3 max-w-[42ch] text-meta text-ink-2">{s.tail}</p>

                  {detail?.ppg && <PulseResult ppg={detail.ppg}/>}

                  {/* The band ranks with the score, never behind a disclosure. */}
                  <dl className="m-0 mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-meta">
                    <dt className="text-ink-3">Mind Score</dt>
                    <dd className="m-0 font-mono tabular-nums text-ink">{result.score} out of 100</dd>
                    <dt className="text-ink-3">How sure</dt>
                    <dd className="m-0 font-mono tabular-nums text-ink">
                      {result.low} to {result.high} <span className="text-ink-3">(±{result.half})</span>
                      <span className="text-ink-3"> · {result.baselineDays === 0
                        ? 'no history yet, so a wide band'
                        : `${result.baselineDays} day${result.baselineDays === 1 ? '' : 's'} of history`}</span>
                    </dd>
                    <dt className="text-ink-3">Read from</dt>
                    <dd className="m-0 text-ink">{result.channels.join(' and ')}
                      {result.missing.length > 0 && <span className="text-ink-3"> · no {result.missing.join(', ')}</span>}
                    </dd>
                  </dl>

                  {/* These rows stop the figure being read as a diagnosis. */}
                  <dl className="m-0 mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-fine">
                    <dt className="text-ink-3">What the score is</dt>
                    <dd className="m-0 text-ink-2">{SCORE_DEF}</dd>
                    <dt className="text-ink-3">A higher score</dt>
                    <dd className="m-0 text-ink-2">Your body is working harder, not doing worse</dd>
                    <dt className="text-ink-3">What to watch</dt>
                    <dd className="m-0 text-ink-2">Which way the score moved, more than the number</dd>
                  </dl>

                  {logged && (
                    <p className="mt-3 flex flex-wrap items-center gap-x-3 text-meta text-ink-2">
                      Added to your {SCORE} Log.
                      <SeeTrends go={go}/>
                    </p>
                  )}

                  {noPosition && (
                    <p className="mt-2 text-fine text-ink-3">No position this time.</p>
                  )}

                  {result.held && (
                    <p className="mt-4 max-w-[44ch] border-l-2 border-warn pl-3 text-meta text-warn">
                      {result.holdReason}
                    </p>
                  )}

                  {/* The check-in: the label the network learns this person from. */}
                  {!result.held && (
                    <div className="mt-4 border-t border-rule pt-4">
                      {!answered ? (
                        <>
                          <p className="max-w-[40ch] text-meta text-ink">Does this match how you feel?</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button onClick={() => answer(true)}>Stressed</Button>
                            <Button variant="outline" onClick={() => answer(false)}>Fine</Button>
                          </div>
                          <p className="mt-2.5 max-w-[44ch] text-fine text-ink-3">
                            {n === 0
                              ? 'Your first answer starts your own calibration.'
                              : `${n} answer${plural} so far shape your readings.`}
                          </p>
                        </>
                      ) : (
                        <p className="max-w-[44ch] text-meta text-ink-2">
                          Noted. <span className="font-mono tabular-nums">{n}</span> answer{plural} now shape your next reading.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <AllDetail label="See what moved your Mind Score">
                <p className="mt-2 max-w-[52ch] text-meta text-ink-3">
                  Right bars raised the score, left bars lowered it. Each bar compares you
                  with your own average only.
                </p>
                <Diverge items={result.contrib.map(c => ({ label: c.label,
                  x: Math.max(-1, Math.min(1, c.raw)) }))}/>
                <Readings detail={detail} result={result}/>
              </AllDetail>
            </>
          )}
      </section>
    </div>
  )
}

/* Raw values in their own units. The closing rows are load bearing: the
   index is not a clinical RMSSD. */
function Readings({ detail, result }) {
  if (!detail) return null
  const { ppg, voice, move, torch } = detail
  const rows = []
  rows.push(['Heart rate', `${ppg.hr.toFixed(0)} bpm`])
  rows.push(['Beats used', `${ppg.beats}${ppg.dropped ? ` · ${ppg.dropped} dropped as noise` : ''}`])
  rows.push(['Beat-to-beat index',
    !ppg.hrvOk ? `held back. Beat timing was uncertain by ${ppg.jitterMs.toFixed(0)} ms`
    : ppg.hrvResolved ? `${ppg.rmssd.toFixed(0)} ms ± ${ppg.rmssdBand.toFixed(0)}`
    : `under ${(ppg.rmssd + ppg.rmssdBand).toFixed(0)} ms, too steady for the camera`])
  rows.push(['Signal quality', `${Math.round(ppg.quality * 100)}%${torch ? '' : ' · no torch on this phone'}`])
  if (voice?.ok) {
    rows.push(['Pitch', `${voice.f0Mean.toFixed(0)} Hz`])
    rows.push(['Speech found', `${voice.voicedS.toFixed(1)} s of ${voice.durS.toFixed(0)} s`])
  } else if (voice) {
    rows.push(['Voice', voice.message])
  }
  if (move?.ok) rows.push(['Movement', `${move.peak.toFixed(2)} g peak · limit ${MOVE_LIMIT_G} g`])
  return (
    <>
      <dl className="m-0 mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-fine">
        {rows.map(([k, v]) => (
          <React.Fragment key={k}>
            <dt className="text-ink-3">{k}</dt>
            <dd className="m-0 font-mono tabular-nums text-ink-2">{v}</dd>
          </React.Fragment>
        ))}
      </dl>
      <dl className="m-0 mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-fine">
        <dt className="text-ink-3">Not a clinical RMSSD</dt>
        <dd className="m-0 text-ink-2">Reads about a fifth below clinical RMSSD.</dd>
        <dt className="text-ink-3">Compared to</dt>
        <dd className="m-0 text-ink-2">Your own history, so phone and patch share one scale.</dd>
      </dl>
    </>
  )
}

/* ── The pulse, the way the Trends dashboard draws a signal ──────────── */

/* The capture's own pulse wave, smoothed, as a line chart, then the two
   figures the score was read from. Same card as the Trends dashboard: a
   panel head, the chart, then tiles. Only after a camera reading. */
function Tile({ label, value, unit, sub, glow }) {
  return (
    <div className="flex min-w-0 flex-col rounded-panel border p-2.5"
      style={{ borderColor: glow + '55', background: `linear-gradient(160deg, #ffffff 0%, ${glow}14 100%)` }}>
      <p className="flex items-center gap-2">
        <span aria-hidden className="h-4 w-[3px] shrink-0 rounded-bar" style={{ background: glow }}/>
        <span className="min-w-0 font-display text-ui font-medium text-ink">{label}</span>
      </p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className={cn('font-display font-bold tabular-nums leading-none text-ink',
          /\d/.test(value) ? 'text-head' : 'text-row')}>{value}</span>
        {unit && <span className="text-fine text-ink-3">{unit}</span>}
      </p>
      {sub && <p className="mt-1 text-fine text-ink-2">{sub}</p>}
    </div>
  )
}

function PulseResult({ ppg }) {
  const hrv = !ppg.hrvOk ? { value: 'Held back', unit: '', sub: 'Beat timing was not clear enough' }
    : ppg.hrvResolved ? { value: ppg.rmssd.toFixed(0), unit: 'ms', sub: 'Compared only with your own' }
    : { value: `Under ${(ppg.rmssd + ppg.rmssdBand).toFixed(0)}`, unit: 'ms', sub: 'Too steady for the camera' }
  return (
    <section aria-label="Your pulse from this reading"
      className="mt-4 rounded-panel border border-rule bg-card p-3 shadow-card">
      <h3 className="mark flex items-baseline justify-between gap-3">
        <span>Your Pulse</span><span className="tick">from the camera</span>
      </h3>
      <PulseChart className="mt-2" wave={ppg.wave} fs={FS} seconds={6}/>
      <p className="mt-1 text-fine text-ink-3">The last six seconds of the pulse the camera read. Each
        rise is one heartbeat.</p>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <Tile label="Heart rate" value={ppg.hr.toFixed(0)} unit="bpm" glow="#e11919"
          sub={`${ppg.beats} beats read`}/>
        <Tile label="Variability" value={hrv.value} unit={hrv.unit} glow="#1d8fb0" sub={hrv.sub}/>
      </div>
    </section>
  )
}
