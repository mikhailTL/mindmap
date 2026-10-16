import React from 'react'
import { Button } from '../ui/button'
import { cn } from '../lib/utils'
import { ActivityScreen, Choice } from './shell'
import { createPacer, audioSupported } from './audio'
import { useReduced } from './useReduced'
import { DidItWork } from './after'

/* Body Scan. A guided timer with a body outline that lights the current region.
 *
 * WHAT RUNS. One requestAnimationFrame clock steps through seven regions,
 * twenty seconds each, feet to face. The silhouette is one SVG path; the seven
 * regions are shapes clipped to that path, and the live one is filled. A
 * two-word prompt names the region, the pacer cue sounds on each change
 * (src/toolkit/audio.js), and Pause and Skip are the controls.
 *
 * SAFETY. Every prompt is noticing, never forcing: no tensing, squeezing or
 * holding. The one line under the controls says to skip any part that hurts. */

const REGIONS = [
  { id:'feet',      say:'Feet. Notice.' },
  { id:'legs',      say:'Legs. Soften.' },
  { id:'belly',     say:'Belly. Breathe.' },
  { id:'chest',     say:'Chest. Loosen.' },
  { id:'hands',     say:'Hands. Open.' },
  { id:'shoulders', say:'Shoulders. Drop.' },
  { id:'face',      say:'Face. Rest.' },
]
const SECS = 20
const TOTAL = SECS * REGIONS.length

/* Front view, one path, drawn clockwise from the top of the head. */
const BODY = [
  'M60 4', 'C72 4 78 12 78 22', 'C78 30 72 38 66 40', 'L66 48',
  'C82 50 94 54 98 66', 'C101 82 104 100 106 118', 'C107 126 104 132 100 132',
  'C96 132 93 127 93 120', 'C92 104 90 86 88 70', 'C88 90 86 110 87 128',
  'C88 150 86 180 84 212', 'C84 222 86 230 82 232', 'L66 232', 'C64 228 64 220 64 212',
  'C64 190 62 160 60 136', 'C58 160 56 190 56 212', 'C56 220 56 228 54 232', 'L38 232',
  'C34 230 36 222 36 212', 'C34 180 32 150 33 128', 'C34 110 32 90 32 70',
  'C30 86 28 104 27 120', 'C27 127 24 132 20 132', 'C16 132 13 126 14 118',
  'C16 100 19 82 22 66', 'C26 54 38 50 54 48', 'L54 40', 'C48 38 42 30 42 22',
  'C42 12 48 4 60 4', 'Z',
].join(' ')

const SHAPES = {
  feet:      [[0, 208, 120, 30]],
  legs:      [[0, 132, 120, 76]],
  belly:     [[30, 100, 60, 32]],
  chest:     [[30, 66, 60, 34]],
  hands:     [[8, 64, 26, 72], [86, 64, 26, 72]],
  shoulders: [[0, 40, 120, 26]],
  face:      [[0, 0, 120, 40]],
}

function Figure({ at, still }) {
  return (
    <svg viewBox="0 0 120 240" role="img" aria-label={at ? `Highlighting ${at}` : 'Body outline'}
      className="mx-auto block h-[46vh] w-auto max-h-[34rem] lg:h-[62vh]">
      <defs><clipPath id="scan-body"><path d={BODY}/></clipPath></defs>
      <path d={BODY} className="fill-aqua-2"/>
      <g clipPath="url(#scan-body)">
        {Object.entries(SHAPES).map(([id, rects]) => rects.map(([x, y, w, h], k) => (
          <rect key={id + k} x={x} y={y} width={w} height={h} className="fill-accent"
            opacity={at === id ? 1 : 0}
            style={{ transition: still ? 'none' : 'opacity .35s var(--ease-out)' }}/>
        )))}
      </g>
      <path d={BODY} fill="none" className="stroke-ink" strokeWidth="2.5" strokeLinejoin="round"/>
    </svg>
  )
}

export default function BodyScan() {
  const reduced = useReduced()
  const [running, setRunning] = React.useState(false)
  const [sound, setSound] = React.useState(true)
  const [i, setI] = React.useState(0)
  const [left, setLeft] = React.useState(SECS)
  const [started, setStarted] = React.useState(false)
  const [finished, setFinished] = React.useState(false)

  const pacer = React.useRef(null)
  const t0 = React.useRef(0)
  const lastI = React.useRef(-1)
  const soundOn = React.useRef(true)
  soundOn.current = sound

  const cue = idx => {
    if (!soundOn.current) return
    pacer.current ||= createPacer()
    pacer.current.cue(247 - idx * 6, 0.5)
  }

  React.useEffect(() => {
    if (!running) return
    let id = 0
    t0.current = performance.now() - i * SECS * 1000 - (SECS - left) * 1000
    const tick = now => {
      /* A rAF timestamp can precede the performance.now() the effect read,
         so el is clamped at zero or the first index would be -1. */
      const el = Math.max(0, (now - t0.current) / 1000)
      if (el >= TOTAL) { setRunning(false); setFinished(true); setLeft(0); return }
      const idx = Math.min(REGIONS.length - 1, Math.floor(el / SECS))
      setI(idx)
      setLeft(Math.max(0, Math.ceil(SECS - (el - idx * SECS))))
      if (idx !== lastI.current) { lastI.current = idx; cue(idx) }
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  React.useEffect(() => () => { pacer.current?.close(); pacer.current = null }, [])

  const reset = () => { setI(0); setLeft(SECS); setFinished(false); lastI.current = -1 }

  const start = async () => {
    if (finished) reset()
    setStarted(true)
    if (sound) { pacer.current ||= createPacer(); await pacer.current.start() }
    setRunning(r => !r)
  }
  const skip = () => {
    if (i >= REGIONS.length - 1) { setRunning(false); setFinished(true); setLeft(0); return }
    const n = i + 1
    setI(n); setLeft(SECS); lastI.current = n; cue(n)
    t0.current = performance.now() - n * SECS * 1000
  }

  const region = REGIONS[i]
  const lit = started && !finished ? region.id : null

  return (
    <ActivityScreen family="pool" title="Body Scan">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
        <Figure at={lit} still={reduced}/>
        <div className="text-center lg:text-left">
          <p className="font-display text-head font-bold tracking-tight text-ink lg:text-sub">
            {finished ? 'Whole body. Rest.' : started ? region.say : 'Feet to face.'}
          </p>
          <p className="mt-2 font-display text-dial font-bold tabular-nums text-ink">
            {started && !finished ? left : ''}
          </p>
          <p className="mt-1 font-display text-ui font-semibold text-ink-2">
            {finished ? 'Done' : `${i + 1} of ${REGIONS.length}`}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2.5 lg:justify-start">
            <Button size="sm" className="min-w-[9rem]" onClick={start}>
              {finished ? 'Start again' : running ? 'Pause' : started ? 'Resume' : 'Start'}
            </Button>
            {started && !finished && <Button size="sm" variant="outline" onClick={skip}>Skip</Button>}
            <Choice on={sound} disabled={!audioSupported()} onClick={() => setSound(s => !s)}>Sound</Choice>
          </div>
          <p className="mt-3 text-fine text-ink-2">Skip any part that hurts.</p>
        </div>
      </div>
      {!started && <DidItWork tool="scan" phase="before" className="mt-4"/>}
      {finished && <DidItWork tool="scan" phase="after" className="mt-4"/>}
    </ActivityScreen>
  )
}
