import React from 'react'
import { Button } from '../ui/button'
import { ActivityScreen } from './shell'
import { audioSupported } from './audio'
import { useWakeLock, buzz, useMounted, useHold, readBest, saveBest, HowTo, CountOver, useTopOn } from './dark'
import { useGame, GameBar, Pops, EndCard, useSvgId } from './game'
import { DidItWork } from './after'

/* Long Exhale, as a candle game.
 *
 * Five breaths. Each one is two sniffs in through the nose and one long,
 * slow breath out toward the phone, the cyclic sigh (Balban 2023). The
 * microphone level is read once a frame and dropped: it bends the flame, and
 * the time it stays bent is the exhale. Too hard and the flame flickers and
 * the clock waits. Holding Space, or holding the button, is the same breath
 * for a laptop or a refused microphone. No audio is kept. */

const ROUNDS = 5
const IN_S = 2
const AGAIN_S = 1
const WAIT_S = 6                    // how long the flame waits for a breath out
const DROP_S = 0.45                 // quiet this long ends a breath out
const MIN_S = 1                     // shorter is a cough, not an exhale
const REST_S = 1.4
const GOAL_S = 6                    // the long mark on the gauge
const GAUGE_S = 12                  // the gauge's full length
const HARD = 0.97                   // a level this high is a blow, not a breath
const HARD_S = 0.5

const one = v => (Math.round(v * 10) / 10).toFixed(1)

/* The microphone as a loudness and nothing else. Unlike the meter in
   audio.js this hands back the raw RMS, because the game measures the room
   during the 3 2 1 and needs a level it can compare with that. */
async function openMic() {
  const C = window.AudioContext || window.webkitAudioContext
  if (!C || !navigator.mediaDevices?.getUserMedia) throw new Error('unsupported')
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  })
  const ctx = new C()
  if (ctx.state === 'suspended') { try { await ctx.resume() } catch { /* ignored */ } }
  const src = ctx.createMediaStreamSource(stream)
  const an = ctx.createAnalyser()
  an.fftSize = 1024
  src.connect(an)
  const buf = new Float32Array(an.fftSize)
  const read = () => {
    an.getFloatTimeDomainData(buf)
    let s = 0
    for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i]
    return Math.sqrt(s / buf.length)
  }
  const stop = () => {
    try { src.disconnect() } catch { /* ignored */ }
    for (const t of stream.getTracks()) t.stop()
    try { ctx.close() } catch { /* ignored */ }
  }
  return { read, stop }
}

/* The candle, the flame and the exhale gauge around them. `lean` 0 to 1
   bends the flame; `out` hides it; `secs` fills the gauge. */
function Candle({ lean = 0, flicker = false, out = false, secs = 0, word, sub, still, small = false }) {
  const R = 100, C = 2 * Math.PI * R
  const arc = 0.75                                    // the gauge is three quarters of a circle
  const v = Math.min(1, secs / GAUGE_S)
  const goal = GOAL_S / GAUGE_S
  const goalA = (-225 + 270 * goal) * Math.PI / 180
  const bend = still ? lean * 0.6 : lean
  const w = flicker && !still ? Math.sin(performance.now() / 40) * 0.12 : 0
  const id = useSvgId('cd')
  return (
    <div className={small ? 'relative mx-auto aspect-square w-full max-w-[15rem]'
      : 'relative mx-auto aspect-square w-full max-w-[20rem] sm:max-w-[24rem]'}>
      <svg viewBox="0 0 240 240" aria-hidden focusable="false" className="absolute inset-0 size-full">
        <defs>
          <linearGradient id={id + 'g'} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" style={{ stopColor:'var(--g-ink)' }}/><stop offset="1" style={{ stopColor:'var(--g-main)' }}/>
          </linearGradient>
          <radialGradient id={id + 'h'}>
            <stop offset="0" stopColor="#ffd76a" stopOpacity="0.75"/><stop offset="1" stopColor="#ffd76a" stopOpacity="0"/>
          </radialGradient>
          <linearGradient id={id + 'f'} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#e2541c"/><stop offset="0.6" stopColor="#f59a2a"/><stop offset="1" stopColor="#ffd76a"/>
          </linearGradient>
          <linearGradient id={id + 'w'} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffffff"/><stop offset="0.5" stopColor="#f4f8f6"/><stop offset="1" stopColor="#dfe9e3"/>
          </linearGradient>
        </defs>
        <circle cx="120" cy="120" r={R - 12} style={{ fill:'var(--g-wash)' }} opacity="0.6"/>
        <g transform="rotate(135 120 120)">
          <circle cx="120" cy="120" r={R} fill="none" stroke="#e1ebe5" strokeWidth="12"
            strokeLinecap="round" strokeDasharray={`${C * arc} ${C}`}/>
          {v > 0 && <circle cx="120" cy="120" r={R} fill="none" strokeWidth="12" strokeLinecap="round"
            strokeDasharray={`${C * arc * v} ${C}`} stroke={`url(#${id}g)`}/>}
        </g>
        <circle cx={120 + R * Math.cos(goalA)} cy={120 + R * Math.sin(goalA)} r="9"
          className="fill-card stroke-ink" strokeWidth="3"/>
        <g transform="translate(0 -14)">
        {/* the candle */}
        {!out && <circle cx={120 + bend * 26} cy="100" r={44 - bend * 10} fill={`url(#${id}h)`}/>}
        <rect x="104" y="128" width="32" height="64" rx="5" fill={`url(#${id}w)`} className="stroke-ink" strokeWidth="3"/>
        <path d="M104 140h32" className="stroke-rule" strokeWidth="3"/>
        <path d="M120 128v-8" className="stroke-ink" strokeWidth="3" strokeLinecap="round"/>
        {/* the flame: leans right with the breath, shorter as it leans */}
        {!out && (
          <g style={{ transformBox:'view-box', transformOrigin:'120px 122px',
                      transform:`rotate(${(bend + w) * 62}deg) scale(${1 - bend * 0.25}, ${1 + bend * 0.15})` }}>
            <path d="M120 122c-11 0-16-9-15-19 1-11 9-17 15-31 6 14 14 20 15 31 1 10-4 19-15 19z"
              fill={`url(#${id}f)`}/>
            <path d="M120 120c-5 0-7-4-7-9 0-5 4-9 7-15 3 6 7 10 7 15 0 5-2 9-7 9z" fill="#fff6d6" opacity="0.95"/>
          </g>
        )}
        {out && <path d="M120 116c4-8-4-12 0-20M126 112c3-6-3-9 0-15" className="stroke-ink-3" strokeWidth="2.5"
          fill="none" strokeLinecap="round"/>}
        </g>
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <p className="font-display text-row font-bold tracking-tight text-ink">{word}</p>
        <p className="h-6 font-display text-ui font-semibold tabular-nums text-ink-2">{sub}</p>
      </div>
    </div>
  )
}

export default function Sigh() {
  const g = useGame('sigh')
  const mounted = useMounted()
  const [stage, setStage] = React.useState('intro')     // intro | count | play | end
  useTopOn(stage === 'end')
  const [mic, setMic] = React.useState('off')           // off | asking | on | none
  const [frame, setFrame] = React.useState({ step:'in', round:0, lean:0, secs:0, left:IN_S, flicker:false, out:false })
  const [summary, setSummary] = React.useState(null)
  const hold = useHold(stage === 'play' || stage === 'count')
  const meter = React.useRef(null)
  const calib = React.useRef([])
  const floor = React.useRef(0.01)
  const runs = React.useRef([])

  useWakeLock(stage === 'play' || stage === 'count')

  React.useEffect(() => () => { meter.current?.stop(); meter.current = null }, [])

  const begin = async () => {
    g.reset(); runs.current = []; calib.current = []; setSummary(null)
    document.activeElement?.blur?.()
    if (!meter.current && audioSupported() && mic !== 'none') {
      /* asked again on Play again: the round ended and the microphone was closed */
      setMic('asking')
      try {
        const m = await openMic()
        if (!mounted.current) { m.stop(); return }
        meter.current = m; setMic('on')
      } catch {
        if (!mounted.current) return
        setMic('none')
      }
    }
    if (!mounted.current) return
    setFrame({ step:'in', round:0, lean:0, secs:0, left:IN_S, flicker:false, out:false })
    setStage('count')
  }

  /* While the 3 2 1 runs, the room is measured so a breath means louder
     than this room, not louder than some fixed number. */
  React.useEffect(() => {
    if (stage !== 'count' || !meter.current) return
    let id = 0
    const tick = () => { calib.current.push(meter.current.read()); id = requestAnimationFrame(tick) }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [stage])

  const finish = React.useCallback((complete = true) => {
    const secs = runs.current
    const longest = secs.length ? Math.max(...secs) : 0
    const b = saveBest('sigh', longest > 0 ? Math.round(longest * 10) / 10 : NaN)
    setSummary({ longest, n: secs.length, long: secs.filter(s => s >= GOAL_S).length, best: b })
    meter.current?.stop(); meter.current = null
    g.finish({ complete })
    setStage('end')
  }, [g])
  const finishRef = React.useRef(finish); finishRef.current = finish

  React.useEffect(() => {
    if (stage !== 'play') return
    const sorted = [...calib.current].sort((a, b) => a - b)
    const room = sorted.length ? sorted[Math.floor(sorted.length * 0.5)] : 0.004
    floor.current = Math.max(0.006, room * 3)
    let id = 0
    const m = { round:0, step:'in', at:performance.now(), runAt:0, lastOn:0, on:false,
                secs:0, hardAt:0, lean:0, last:performance.now(), result:null }
    g.cue('turn'); buzz(25)
    const go = (step, now) => { m.step = step; m.at = now }
    const level = () => {
      if (hold.ref.current) return 0.55
      if (!meter.current) return 0
      const r = meter.current.read()
      if (r <= floor.current) return 0
      return Math.min(1, Math.log2(r / floor.current) / 5)
    }
    const tick = now => {
      const dt = Math.min(0.05, (now - m.last) / 1000); m.last = now
      const into = (now - m.at) / 1000
      const lv = level()
      m.lean += (lv - m.lean) * Math.min(1, dt * 10)
      let flicker = false
      if (m.step === 'in' && into >= IN_S) { go('again', now); g.cue('tick') }
      else if (m.step === 'again' && into >= AGAIN_S) { go('out', now); g.cue('low'); buzz(15) }
      else if (m.step === 'out') {
        const breathing = lv > 0.12
        if (breathing) { if (!m.on) { m.on = true; m.runAt = now; m.secs = 0 } m.lastOn = now }
        if (m.on) {
          if (lv >= HARD) { if (!m.hardAt) m.hardAt = now } else m.hardAt = 0
          flicker = !!m.hardAt && now - m.hardAt > HARD_S * 1000
          if (breathing && !flicker) m.secs += dt
          if (!breathing && now - m.lastOn > DROP_S * 1000) {
            m.on = false
            if (m.secs >= MIN_S) {
              const s = m.secs
              runs.current.push(s)
              const pts = Math.round(s * 8) + (s >= GOAL_S ? 15 : 0)
              if (s < GOAL_S * 0.5) g.miss()
              g.add(pts, { x:50, y:30, sound: s >= GOAL_S ? 'good' : 'tick', label: `${one(s)} s` })
              m.result = s
              go('rest', now)
            } else m.secs = 0
          }
        } else if (into >= WAIT_S) { m.result = 0; g.miss(); go('rest', now) }
      } else if (m.step === 'rest' && into >= REST_S) {
        m.round += 1
        if (m.round >= ROUNDS) { finishRef.current(); return }
        m.result = null; m.secs = 0
        go('in', now); g.cue('turn'); buzz(25)
      }
      const step = m.step
      const left = step === 'in' ? IN_S - into : step === 'again' ? AGAIN_S - into : 0
      setFrame({ step, round:m.round, lean: step === 'out' || m.on ? m.lean : 0, secs:m.secs,
                 left:Math.max(0, left), flicker, out: step === 'rest' && m.result === 0, result:m.result })
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [stage]) // eslint-disable-line react-hooks/exhaustive-deps

  const again = () => begin()

  const word = stage !== 'play' ? 'Get ready'
    : frame.step === 'in' ? 'Breathe in'
    : frame.step === 'again' ? 'Sniff once more'
    : frame.step === 'out' ? (frame.flicker ? 'Softer' : frame.lean > 0.1 ? 'Keep going' : 'Breathe out slowly')
    : frame.result ? `${one(frame.result)} seconds` : 'Next breath'
  const sub = stage !== 'play' ? null
    : frame.step === 'out' || frame.step === 'rest' ? `${one(frame.secs)} s` : Math.ceil(frame.left)

  const micLine = mic === 'on' ? 'Breathe out toward the phone. Holding Space or the button works too.'
    : 'No microphone. Hold Space or the button while you breathe out.'

  if (stage === 'intro') {
    const best = readBest('sigh')
    return (
      <ActivityScreen family="tide" title="Long Exhale">
        <div style={g.vars}>
          <HowTo onStart={begin} disabled={mic === 'asking'}
            startLabel={mic === 'asking' ? 'Asking for the microphone' : 'Light the candle'}
            art={<Candle word="Five breaths" sub={best != null ? `Your best ${one(best)} s` : 'Bend the flame, keep it lit'} still={g.reduced} small/>}
            steps={[
              'Breathe in through your nose, then sniff once more.',
              'Breathe out slowly on the flame. Long and soft wins.',
              'Too hard and it flickers. No mic? Hold Space or the button.',
            ]}
            measured="Sound level is measured here and never recorded.">
            <DidItWork tool="sigh" phase="before" className="mt-4"/>
          </HowTo>
        </div>
      </ActivityScreen>
    )
  }

  if (stage === 'end' && summary) {
    return (
      <ActivityScreen family="tide" title="Long Exhale">
        <EndCard game={g} title={summary.best.isNew && summary.best.before != null ? 'New personal best' : 'Candle done'}
          onAgain={again} stars={summary.long >= 4 ? 3 : summary.long >= 2 ? 2 : 1}
          stats={[
            ['Longest breath out', `${one(summary.longest)} s`],
            ['Over six seconds', `${summary.long} of ${ROUNDS}`],
            ['Your best', summary.best.best != null ? `${one(summary.best.best)} s` : 'None yet'],
            ['Breaths counted', `${summary.n} of ${ROUNDS}`],
          ]}>
          <DidItWork tool="sigh" phase="after" className="border border-rule"/>
        </EndCard>
      </ActivityScreen>
    )
  }

  return (
    <ActivityScreen family="tide" title="Long Exhale">
      <div style={g.vars} className="mx-auto w-full max-w-[34rem]">
        <GameBar game={g}>
          <span className="font-display text-ui font-semibold tabular-nums text-ink-2">
            Breath {Math.min(ROUNDS, frame.round + 1)} of {ROUNDS}
          </span>
        </GameBar>
        <div className="relative mt-2">
          <Candle lean={frame.lean} flicker={frame.flicker} out={frame.out} secs={frame.secs}
            word={word} sub={sub} still={g.reduced}/>
          <Pops game={g}/>
          <CountOver on={stage === 'count'} onDone={() => setStage('play')}/>
        </div>
        <Button {...hold.bind} aria-pressed={hold.held}
          className="mt-3 w-full touch-none select-none"
          variant={hold.held ? 'solid' : 'outline'}>
          {hold.held ? 'Breathing out' : 'Hold while you breathe out'}
        </Button>
        <p className="mt-2 text-center text-fine text-ink-2">{micLine}</p>
        <p className="mt-1 text-center text-fine text-ink-2">Sound level is measured here and never recorded.</p>
        <div className="mt-3 flex justify-center">
          <Button size="sm" variant="outline" onClick={() => finishRef.current(false)}>End round</Button>
        </div>
      </div>
    </ActivityScreen>
  )
}
