import React from 'react'
import { Button } from '../ui/button'
import { ArrowRight, Cross, Wave } from '../ui/marks'
import { ActivityScreen, Sheet, OnDevice, Choice } from './shell'
import { createPacer, createMicMeter, audioSupported } from './audio'
import { DarkSheet, buzz, cueWords } from './dark'
import { breathsFromEnvelope } from '../signals/breath'
import { useReduced } from './useReduced'
import { DidItWork } from './after'

/* Long exhale: cyclic sighing (Balban 2023), paced and measured. The
 * microphone level (read once a frame and dropped) is the exhale detector; the
 * same level, sampled into a 60-second ring, gives breaths per minute. With
 * the microphone refused the pacer runs on counts. No audio is kept. */

const TOTAL = 300                     // five minutes
const HZ = 20                         // ring buffer rate
const WINDOW = 60 * HZ                // one rolling minute
const FLOOR = 0.2                     // level above this is a mouth exhale
const MIN_EXHALE = 1                  // seconds; shorter runs are noise
const DROP = 0.35                     // seconds below the floor that end a run
const TARGET = 6                      // the soft exhale target
const EXHALE_CAP = 20                 // the longest the pacer waits
const BARS = 12
const BAR_MAX = 10                    // seconds at full width

const PHASES = [
  { id:'in',    word:'In',          secs:2,    hz:294 },
  { id:'again', word:'In again',    secs:1,    hz:330 },
  { id:'out',   word:'Out, slowly', secs:null, hz:196 },
]

function makeRing(n) {
  const buf = new Float32Array(n)
  let at = 0, count = 0
  return {
    push(v) { buf[at] = v; at = (at + 1) % n; if (count < n) count++ },
    ordered() {
      const out = new Array(count)
      const start = count < n ? 0 : at
      for (let i = 0; i < count; i++) out[i] = buf[(start + i) % n]
      return out
    },
    seconds() { return count / HZ },
    reset() { at = 0; count = 0 },
  }
}

const EyeShut = p => (
  <svg viewBox="0 0 24 24" width={18} height={18} fill="none" aria-hidden stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" {...p}>
    <path d="M3 10c2.5 3.5 5.5 5 9 5s6.5-1.5 9-5M6 13.5l-1.5 2.5M12 15v3M18 13.5l1.5 2.5"/>
  </svg>
)

const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
const one = v => v == null ? '' : (Math.round(v * 10) / 10).toFixed(1)

/* Under reduced motion the disc holds still and the count carries the pace. */
function Ring({ phase, t, count, scale, still, idle, level, micOn }) {
  const dash = (idle ? 0 : t) * 578
  return (
    <div className="relative mx-auto grid aspect-square w-full max-w-[22rem] place-items-center
      sm:max-w-[26rem]">
      <svg viewBox="0 0 200 200" aria-hidden focusable="false" className="absolute inset-0 size-full">
        <circle cx="100" cy="100" r="92" fill="none" className="stroke-rule" strokeWidth="4"/>
        <circle cx="100" cy="100" r="92" fill="none" className="kit-s" strokeWidth="7"
          strokeLinecap="round" transform="rotate(-90 100 100)"
          strokeDasharray={`${dash} 578`}/>
        <circle cx="100" cy="100" r="68" className="kit-f-tint kit-s-art" strokeWidth="3"
          style={{ transformBox:'fill-box', transformOrigin:'center',
                   transform:`scale(${still ? 0.78 : scale})` }}/>
        {micOn && !idle && (
          <circle cx="100" cy="100" r="68" className="kit-f-art" opacity={0.22 + 0.5 * level}
            style={{ transformBox:'fill-box', transformOrigin:'center',
                     transform:`scale(${still ? 0.3 : 0.18 + 0.6 * level})` }}/>
        )}
      </svg>
      <div className="relative text-center">
        <p className="font-display text-row font-bold tracking-tight text-ink">
          {idle ? 'Ready' : phase.word}
        </p>
        <p className="mt-1 font-display text-dial font-bold tabular-nums text-ink">
          {idle ? '' : count}
        </p>
      </div>
    </div>
  )
}

/* The last twelve exhales, each a bar as long as it was. */
function Bars({ bars, still }) {
  const targetPct = Math.min(100, (TARGET / BAR_MAX) * 100)
  return (
    <div className="relative">
      <div aria-hidden className="absolute inset-y-0 w-0.5 bg-ink-3/60" style={{ left: `${targetPct}%` }}/>
      <ol className="space-y-1.5" aria-label="Exhales, newest last">
        {bars.map((b, i) => (
          <li key={b.id} className="flex items-center gap-2">
            <div className="h-3 flex-1 overflow-hidden rounded-bar bg-mist">
              <div className={still ? 'h-full rounded-bar kit-fill-art'
                : 'h-full rounded-bar kit-fill-art transition-[width] duration-200 ease-[var(--ease-out)]'}
                style={{ width: `${Math.min(100, (b.seconds / BAR_MAX) * 100)}%`,
                         opacity: 0.55 + 0.45 * ((i + 1) / bars.length) }}/>
            </div>
            <span className="w-10 text-right font-display text-fine font-semibold tabular-nums text-ink-2">
              {one(b.seconds)} s
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default function Sigh() {
  const reduced = useReduced()
  const [running, setRunning] = React.useState(false)
  const [done, setDone] = React.useState(false)
  const [sound, setSound] = React.useState(false)
  const [eyes, setEyes] = React.useState(false)
  const [mic, setMic] = React.useState('off')      // off | asking | on | refused | unsupported
  const [frame, setFrame] = React.useState({ phase:PHASES[0], t:0, count:2, scale:0.46, left:TOTAL, level:0 })
  const [bars, setBars] = React.useState([])
  const [bpm, setBpm] = React.useState(null)
  const [result, setResult] = React.useState(null)

  const pacer = React.useRef(null)
  const meter = React.useRef(null)
  const ring = React.useRef(makeRing(WINDOW))
  const soundOn = React.useRef(false); soundOn.current = sound
  const eyesOn = React.useRef(false); eyesOn.current = eyes
  const micOn = React.useRef(false); micOn.current = mic === 'on'
  const machine = React.useRef(null)
  const all = React.useRef([])                   // every exhale this session, {seconds}
  const bpmStart = React.useRef(null)
  const bpmNow = React.useRef(null)
  const endRef = React.useRef(() => {})

  const cue = React.useCallback(phase => {
    if (eyesOn.current) buzz(30)
    if (soundOn.current) {
      pacer.current ||= createPacer()
      pacer.current.cue(phase.hz, 0.42)
    }
  }, [])

  React.useEffect(() => {
    if (!running) return
    let id = 0
    const now0 = performance.now()
    const m = machine.current = {
      t0: now0, i: 0, phaseAt: now0,
      above: false, runAt: 0, lastAbove: 0, exhaled: false,
      lastSample: now0, lastBpm: now0,
    }
    cue(PHASES[0])
    const advance = now => {
      m.i = (m.i + 1) % PHASES.length
      m.phaseAt = now
      m.above = false; m.exhaled = false
      cue(PHASES[m.i])
    }
    const tick = now => {
      const el = (now - m.t0) / 1000
      const left = Math.max(0, TOTAL - el)
      if (left <= 0) { endRef.current(); return }

      let level = 0
      if (meter.current) {
        level = meter.current.read()
        if (level > FLOOR) {
          if (!m.above) { m.above = true; m.runAt = now }
          m.lastAbove = now
        } else if (m.above && now - m.lastAbove > DROP * 1000) {
          m.above = false
          const secs = (m.lastAbove - m.runAt) / 1000
          if (secs >= MIN_EXHALE) {
            const bar = { id: now, seconds: secs }
            all.current.push(bar)
            setBars(b => [...b, bar].slice(-BARS))
            if (PHASES[m.i].id === 'out') m.exhaled = true
          }
        }
        if (now - m.lastSample >= 1000 / HZ) {
          m.lastSample = now
          ring.current.push(level)
        }
        if (now - m.lastBpm >= 1000 && ring.current.seconds() >= 10) {
          m.lastBpm = now
          const r = breathsFromEnvelope(ring.current.ordered(), HZ, { floor:FLOOR, minSeconds:MIN_EXHALE })
          bpmNow.current = r.perMinute
          if (bpmStart.current == null && ring.current.seconds() >= 60) bpmStart.current = r.perMinute
          setBpm(r.perMinute)
        }
      }

      const phase = PHASES[m.i]
      const into = (now - m.phaseAt) / 1000
      let t, count, scale
      if (phase.secs != null) {
        t = Math.min(1, into / phase.secs)
        count = Math.max(1, Math.ceil(phase.secs - into))
        scale = phase.id === 'in' ? 0.46 + 0.4 * t : 0.86 + 0.14 * t
        if (into >= phase.secs) advance(now)
      } else {
        t = Math.min(1, into / TARGET)
        count = Math.ceil(into)
        scale = Math.max(0.46, 1 - 0.54 * t)
        const over = micOn.current
          ? m.exhaled || (into >= TARGET && !m.above) || into >= EXHALE_CAP
          : into >= TARGET
        if (over && into >= MIN_EXHALE) advance(now)
      }
      setFrame({ phase, t, count, scale, left, level })
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [running, cue])

  const end = React.useCallback(() => {
    setRunning(false)
    setEyes(false)
    const ex = all.current
    const mean = a => a.length ? a.reduce((s, e) => s + e.seconds, 0) / a.length : null
    setResult({
      last: mean(ex.slice(-3)), n: ex.length,
      bpmStart: bpmStart.current ?? bpmNow.current, bpmEnd: bpmNow.current,
    })
    setDone(true)
  }, [])
  endRef.current = end

  /* `mounted` gates every await below against a prompt resolving late. */
  const mounted = React.useRef(true)
  React.useEffect(() => () => {
    mounted.current = false
    meter.current?.stop(); meter.current = null
    pacer.current?.close(); pacer.current = null
  }, [])

  const askMic = async () => {
    if (!audioSupported() || !navigator.mediaDevices?.getUserMedia) { setMic('unsupported'); return }
    setMic('asking')
    try {
      const m = await createMicMeter()
      if (!mounted.current) { m.stop(); return }
      meter.current = m; setMic('on')
    }
    catch (e) { if (mounted.current) setMic(e?.message === 'unsupported' ? 'unsupported' : 'refused') }
  }

  const start = async () => {
    all.current = []; ring.current.reset(); bpmStart.current = null; bpmNow.current = null
    setBars([]); setBpm(null); setResult(null); setDone(false)
    if (sound) { pacer.current ||= createPacer(); await pacer.current.start() }
    if (!mounted.current) return
    if (mic === 'off' || mic === 'refused') await askMic()
    if (!mounted.current) return
    setRunning(true)
  }

  const toggleSound = async () => {
    const next = !sound
    setSound(next)
    if (next) { pacer.current ||= createPacer(); await pacer.current.start() }
  }

  const idle = !running && !done
  const line = mic === 'refused' ? 'Allow the microphone to see your exhales.'
    : mic === 'unsupported' ? 'No microphone here. The pacer still runs.'
    : mic === 'asking' ? 'Asking for the microphone.'
    : eyes ? cueWords(sound)
    : 'Twice in through the nose, slowly out the mouth.'

  return (
    <ActivityScreen family="tide" title="Long Exhale">
      <DarkSheet on={eyes && running} onStop={end} line={`${cueWords(sound)} Tap to stop.`}>
        <p className="font-display text-view font-bold tracking-tight text-mist">{frame.phase.word}</p>
        <p className="mt-2 font-display text-dial font-bold tabular-nums text-mist/80">
          {frame.count}
        </p>
      </DarkSheet>

      {!done && (
        <>
          <Ring phase={frame.phase} t={frame.t} count={frame.count} scale={frame.scale}
            still={reduced} idle={idle} level={frame.level} micOn={mic === 'on'}/>

          <p className="mx-auto mt-2 max-w-[32rem] text-center font-display text-ui font-semibold
            tabular-nums text-ink-2" aria-live="off">
            {mmss(frame.left)} left
          </p>
          {bpm != null && (
            <p className="mx-auto mt-1 max-w-[32rem] text-center font-display text-ui font-semibold
              tabular-nums text-ink" aria-live="polite">
              {Math.round(bpm)} breaths per minute
            </p>
          )}

          <div className="mx-auto mt-4 flex w-full max-w-[32rem] flex-wrap justify-center gap-2.5">
            {running
              ? <Button size="sm" className="min-w-[9rem]" onClick={end}><Cross/>Stop</Button>
              : <Button size="sm" className="min-w-[9rem]" disabled={mic === 'asking'} onClick={start}>
                  <ArrowRight/>Start</Button>}
            <Choice on={sound} disabled={!audioSupported()} onClick={toggleSound}
              className="inline-flex items-center gap-2"><Wave size={18}/>Sound</Choice>
            <Choice on={eyes} onClick={() => setEyes(e => !e)}
              className="inline-flex items-center gap-2"><EyeShut/>Eyes closed</Choice>
          </div>
          <p className="mx-auto mt-3 max-w-[32rem] text-center text-fine text-ink-2">{line}</p>
          <OnDevice className="mx-auto mt-2 max-w-[32rem] justify-center">
            Sound level is measured here and never recorded.
          </OnDevice>

          {bars.length > 0 && (
            <div className="mx-auto mt-5 w-full max-w-[32rem]">
              <h3 className="font-display text-ui font-bold text-ink">Your Exhales</h3>
              <div className="mt-2"><Bars bars={bars} still={reduced}/></div>
            </div>
          )}
          {idle && <DidItWork tool="sigh" phase="before" className="mx-auto mt-4 w-full max-w-[32rem]"/>}
        </>
      )}

      {done && result && (
        <Sheet className="mx-auto w-full max-w-[32rem]">
          <h3 className="font-display text-row font-bold tracking-tight text-ink">Your Session</h3>
          <p className="mt-3 font-display text-ui font-semibold text-ink-2">Exhale at the end</p>
          <p className="mt-1 font-display text-stat font-bold tabular-nums text-ink">
            {one(result.last ?? 0)}<span className="ml-1 text-fine font-semibold text-ink-2">s</span>
          </p>
          <p className="mt-2 text-fine text-ink-2">
            {result.bpmStart == null ? 'Needs the microphone.'
              : `Breathing ${Math.round(result.bpmStart)} to ${Math.round(result.bpmEnd)} a minute, ${result.n} exhales.`}
          </p>
          <Button size="sm" className="mt-4 min-w-[9rem]" onClick={start}><ArrowRight/>Again</Button>
        </Sheet>
      )}
      {done && <DidItWork tool="sigh" phase="after" className="mx-auto mt-3 w-full max-w-[32rem]"/>}
    </ActivityScreen>
  )
}
