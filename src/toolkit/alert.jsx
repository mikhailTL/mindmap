import React from 'react'
import { ActivityScreen } from './shell'
import { cn } from '../lib/utils'
import { useMounted, readBest, saveBest, HowTo, CountOver, useTopOn } from './dark'
import { useGame, GameBar, Pops, EndCard } from './game'
import { DidItWork } from './after'

/* Reaction Test, as whack the light.
 *
 * Nine lights. After a short random wait one of them lights up; hit it as
 * fast as you can. Fifteen lights a round, about half a minute. The time
 * runs from performance.now() at the frame the light goes on to the
 * pointerdown that hits it, so no transition sits in front of it. A tap in
 * the wait is "too early" and costs nothing but the light. Space or Enter
 * hits whichever light is on, for a keyboard; 1 to 9 hit a light by place.
 *
 * The only comparison is with your own best on this device. The times are
 * kept for the end card and dropped; the best average is the one number
 * stored. */

const LIGHTS = 9
const TRIALS = 15
const WAIT_MIN = 700
const WAIT_MAX = 2000
const MISS_MS = 1300
const SHOW_MS = 380

const rand = (a, b) => a + Math.random() * (b - a)
const pointsFor = rt => Math.round(Math.max(2, (700 - rt) / 25))

function Grid({ lit = -1, flash = null, onHit, disabled, still }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {Array.from({ length: LIGHTS }, (_, i) => {
        const on = i === lit
        const f = flash && flash.i === i ? flash.kind : null
        return (
          <button key={i} type="button" tabIndex={-1} aria-label={on ? `Light ${i + 1}, on` : `Light ${i + 1}`}
            disabled={disabled}
            onPointerDown={e => { e.preventDefault(); onHit?.(i) }}
            className={cn('relative aspect-square w-full rounded-full border-2 border-rule touch-manipulation select-none',
              'disabled:cursor-default',
              !on && !f && 'bg-card',
              f === 'early' && 'bg-mist',
              f === 'miss' && 'bg-mist',
              !still && f === 'hit' && 'scale-90 transition-transform duration-150')}
            style={on ? { background:'var(--g-main)', boxShadow:'0 0 0 6px var(--g-wash)' }
              : f === 'hit' ? { background:'var(--g-wash)' } : undefined}>
            {on && <span aria-hidden className="absolute inset-[22%] rounded-full bg-card/80"/>}
          </button>
        )
      })}
    </div>
  )
}

export default function Alertness() {
  const g = useGame('alert')
  const mounted = useMounted()
  const [stage, setStage] = React.useState('intro')    // intro | count | play | end
  useTopOn(stage === 'end')
  const [lit, setLit] = React.useState(-1)
  const [flash, setFlash] = React.useState(null)       // { i, kind: hit | early | miss }
  const [n, setN] = React.useState(0)
  const [word, setWord] = React.useState('Wait for a light')
  const [summary, setSummary] = React.useState(null)

  const st = React.useRef({ phase:'idle', lit:-1, prev:-1, goAt:0, rts:[], early:0, missed:0, trial:0 })
  const timer = React.useRef(0)
  const stopClocks = () => clearTimeout(timer.current)
  React.useEffect(() => () => stopClocks(), [])

  const finish = () => {
    stopClocks()
    const s = st.current
    s.phase = 'done'
    const rts = s.rts
    const avg = rts.length ? rts.reduce((a, b) => a + b, 0) / rts.length : null
    const b = rts.length >= 5 ? saveBest('alert', Math.round(avg), { lower:true }) : { best: readBest('alert'), isNew:false, before:null }
    setSummary({ avg, fastest: rts.length ? Math.min(...rts) : null, hits: rts.length, early: s.early, best: b })
    g.finish({ complete:true })
    setStage('end')
  }
  const finishRef = React.useRef(finish); finishRef.current = finish

  function arm() {
    const s = st.current
    if (!mounted.current || s.phase === 'done') return
    if (s.trial >= TRIALS) { finishRef.current(); return }
    s.phase = 'wait'; s.lit = -1
    setLit(-1); setWord('Wait for a light')
    timer.current = setTimeout(() => {
      let i = Math.floor(Math.random() * LIGHTS)
      if (i === s.prev) i = (i + 1 + Math.floor(Math.random() * (LIGHTS - 1))) % LIGHTS
      s.prev = i; s.lit = i; s.phase = 'go'
      requestAnimationFrame(now => { s.goAt = now })
      s.goAt = performance.now()
      setLit(i); setWord('Hit it')
      timer.current = setTimeout(() => {
        if (s.phase !== 'go' || s.lit !== i) return
        s.missed += 1; s.trial += 1; s.phase = 'show'
        setN(s.trial); setLit(-1); setFlash({ i, kind:'miss' }); setWord('Missed that one')
        g.cue('low')
        timer.current = setTimeout(() => { setFlash(null); arm() }, SHOW_MS)
      }, MISS_MS)
    }, rand(WAIT_MIN, WAIT_MAX))
  }

  const hit = i => {
    const s = st.current
    if (s.phase === 'go') {
      if (i !== s.lit) return
      const rt = performance.now() - s.goAt
      clearTimeout(timer.current)
      s.rts.push(rt); s.trial += 1; s.phase = 'show'
      setN(s.trial); setLit(-1); setFlash({ i, kind:'hit' }); setWord(`${Math.round(rt)} ms`)
      const col = i % 3, row = Math.floor(i / 3)
      g.add(pointsFor(rt), { x: 17 + col * 33, y: 11 + row * 33, sound: rt < 350 ? 'good' : 'tick' })
      timer.current = setTimeout(() => { setFlash(null); arm() }, SHOW_MS)
    } else if (s.phase === 'wait') {
      clearTimeout(timer.current)
      s.early += 1; s.phase = 'show'
      setFlash({ i, kind:'early' }); setWord('Too early. Wait for it.')
      timer.current = setTimeout(() => { setFlash(null); arm() }, SHOW_MS + 300)
    }
  }

  React.useEffect(() => {
    if (stage !== 'play') return
    const key = e => {
      if (e.repeat) return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        const s = st.current
        hit(s.phase === 'go' ? s.lit : 4)
      } else if (/^[1-9]$/.test(e.key)) hit(+e.key - 1)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [stage]) // eslint-disable-line react-hooks/exhaustive-deps

  const begin = () => {
    stopClocks()
    g.reset(); setSummary(null); setN(0); setLit(-1); setFlash(null); setWord('Wait for a light')
    st.current = { phase:'idle', lit:-1, prev:-1, goAt:0, rts:[], early:0, missed:0, trial:0 }
    document.activeElement?.blur?.()
    setStage('count')
  }
  const play = () => { setStage('play'); arm() }

  const measured = 'Taps are timed here and never sent. This is reaction time, not stress.'

  if (stage === 'intro') {
    const best = readBest('alert')
    return (
      <ActivityScreen family="night" title="Reaction Test">
        <div style={g.vars}>
          <HowTo onStart={begin} startLabel="Start" measured={measured}
            art={<div className="mx-auto w-full max-w-[13rem]"><Grid lit={4} disabled still/></div>}
            steps={[
              'A light comes on. Hit it as fast as you can.',
              'Fifteen lights. Tapping before one is on does not count.',
              best != null ? `Laptop: click, or press Space. Your best average: ${best} ms.`
                : 'Laptop: click the light, or press Space.',
            ]}>
            <DidItWork tool="alert" phase="before" className="mt-4"/>
          </HowTo>
        </div>
      </ActivityScreen>
    )
  }

  if (stage === 'end' && summary) {
    const ms = v => v == null ? 'None' : `${Math.round(v)} ms`
    return (
      <ActivityScreen family="night" title="Reaction Test">
        <EndCard game={g} title={summary.best.isNew && summary.best.before != null ? 'New personal best' : 'Lights done'}
          onAgain={begin}
          stats={[
            ['Average', ms(summary.avg)],
            ['Fastest', ms(summary.fastest)],
            ['Hits', `${summary.hits} of ${TRIALS}`],
            ['Your best average', summary.best.best != null ? `${summary.best.best} ms` : 'Needs 5 hits'],
          ]}>
          <DidItWork tool="alert" phase="after" className="border border-rule"/>
        </EndCard>
      </ActivityScreen>
    )
  }

  return (
    <ActivityScreen family="night" title="Reaction Test">
      <div style={g.vars} className="mx-auto w-full max-w-[30rem]">
        <GameBar game={g}>
          <span className="font-display text-ui font-semibold tabular-nums text-ink-2">
            Light {Math.min(TRIALS, n + 1)} of {TRIALS}
          </span>
        </GameBar>
        <div className="relative mx-auto mt-3 w-full max-w-[22rem]">
          <Grid lit={lit} flash={flash} onHit={hit} disabled={stage !== 'play'} still={g.reduced}/>
          <Pops game={g}/>
          <CountOver on={stage === 'count'} onDone={play}/>
        </div>
        <p className="mt-4 text-center font-display text-row font-bold tabular-nums text-ink" aria-live="polite">
          {stage === 'play' ? word : 'Get ready'}
        </p>
        <p className="mt-2 text-center text-fine text-ink-2">{measured}</p>
      </div>
    </ActivityScreen>
  )
}
