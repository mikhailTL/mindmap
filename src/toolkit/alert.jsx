import React from 'react'
import { Button } from '../ui/button'
import { ArrowRight } from '../ui/marks'
import { ActivityScreen, Sheet, OnDevice } from './shell'
import { pvtStats, pvtWords } from '../signals/pvt'
import { addAlertness, usualAlertness } from '../app/store'
import { useReduced } from './useReduced'
import { cn } from '../lib/utils'
import { DidItWork } from './after'

/* Reaction test: the PVT-B on a phone. The whole sheet is the button. After
 * a random wait the ring fills and a counter runs from performance.now(); the
 * next pointerdown ends the trial, a tap in the wait is a false start. Sixty
 * seconds or twenty trials, then pvtStats; the summary alone is stored. The
 * fill has no transition: a reaction time cannot start behind an ease. */

const SECONDS = 60
const MAX_TRIALS = 20
const WAIT_MIN = 2000
const WAIT_MAX = 5000
const EARLY_MS = 600
const HOLD_MS = 600
const MISS_MS = 3000

const rand = (a, b) => a + Math.random() * (b - a)

/* A track in the wait, a solid accent disc once it is time to tap. */
function Ring({ phase, ms }) {
  const go = phase === 'go' || phase === 'hold'
  return (
    <div className="relative mx-auto grid aspect-square w-full max-w-[18rem] place-items-center sm:max-w-[22rem]">
      <svg viewBox="0 0 200 200" aria-hidden focusable="false" className="absolute inset-0 size-full">
        <circle cx="100" cy="100" r="92" fill="none" strokeWidth="6"
          className={go ? 'stroke-accent' : 'stroke-rule'}/>
        <circle cx="100" cy="100" r="84" strokeWidth="0"
          className={go ? 'fill-accent' : phase === 'early' ? 'fill-mist' : 'fill-card'}/>
      </svg>
      <div className="relative grid h-[5rem] place-items-center text-center">
        {go ? (
          <p className={cn('font-display text-dial font-bold tabular-nums text-paper')}
            aria-live={phase === 'hold' ? 'polite' : 'off'}>
            <span className="inline-block min-w-[4ch] text-right">{ms}</span>
            <span className="ml-1 text-row">ms</span>
          </p>
        ) : (
          <p className="font-display text-row font-bold tracking-tight text-ink">
            {phase === 'idle' ? 'Ready' : phase === 'early' ? 'Too early' : 'Wait'}
          </p>
        )}
      </div>
    </div>
  )
}

export default function Alertness() {
  const reduced = useReduced()
  const [phase, setPhase] = React.useState('idle')   // idle | wait | go | hold | early | done
  const [ms, setMs] = React.useState(0)
  const [count, setCount] = React.useState(0)
  const [early, setEarly] = React.useState(0)
  const [result, setResult] = React.useState(null)

  const phaseRef = React.useRef('idle')
  const trials = React.useRef([])
  const startAt = React.useRef(0)
  const goAt = React.useRef(0)
  const timer = React.useRef(0)
  const raf = React.useRef(0)

  const go = p => { phaseRef.current = p; setPhase(p) }

  const stopClocks = () => { clearTimeout(timer.current); cancelAnimationFrame(raf.current) }
  React.useEffect(() => () => stopClocks(), [])

  /* Every handler touches refs and setters only, so none goes stale. */
  const finish = () => {
    stopClocks()
    const stats = pvtStats(trials.current)
    let usual = null
    if (stats.ok) {
      addAlertness(stats)
      usual = usualAlertness()
    }
    setResult({ stats, usual })
    go('done')
  }

  /* One trial ends: hold the number for a moment, then arm the next. */
  const settle = rt => {
    cancelAnimationFrame(raf.current)
    trials.current.push({ rt })
    setCount(trials.current.length)
    setMs(Math.round(rt))
    go('hold')
    timer.current = setTimeout(arm, HOLD_MS)
  }

  /* A wait of two to five seconds, then the fill and the counter. */
  function arm() {
    const elapsed = performance.now() - startAt.current
    if (elapsed >= SECONDS * 1000 || trials.current.length >= MAX_TRIALS) { finish(); return }
    go('wait')
    timer.current = setTimeout(() => {
      goAt.current = performance.now()
      setMs(0)
      go('go')
      const tick = now => {
        if (phaseRef.current !== 'go') return
        const t = now - goAt.current
        if (t >= MISS_MS) { settle(MISS_MS); return }
        setMs(Math.round(t))
        raf.current = requestAnimationFrame(tick)
      }
      raf.current = requestAnimationFrame(tick)
    }, rand(WAIT_MIN, WAIT_MAX))
  }

  const tap = e => {
    if (e && e.button != null && e.button !== 0) return
    const p = phaseRef.current
    if (p === 'idle') {
      trials.current = []
      setCount(0); setEarly(0); setResult(null)
      startAt.current = performance.now()
      arm()
    } else if (p === 'go') {
      settle(performance.now() - goAt.current)
    } else if (p === 'wait') {
      clearTimeout(timer.current)
      trials.current.push({ rt: -1, falseStart: true })
      setCount(trials.current.length)
      setEarly(n => n + 1)
      go('early')
      timer.current = setTimeout(arm, EARLY_MS)
    }
  }

  const onKey = e => {
    if (e.repeat) return
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); tap(null) }
  }

  const again = () => { setResult(null); go('idle') }

  const label = 'Validated for alertness and sleep loss, not for stress.'

  if (phase === 'done' && result) {
    const { stats, usual } = result
    return (
      <ActivityScreen family="night" title="Reaction Test">
        <Sheet className="mx-auto w-full max-w-[40rem]">
          <h3 className="font-display text-row font-bold text-ink">Your Reaction Time</h3>
          {stats.ok ? (
            <>
              <p className={cn('mt-3 font-display text-dial font-bold tabular-nums text-ink', !reduced && 'kit-rise')}>
                {Math.round(stats.mean)}<span className="ml-1.5 text-row text-ink-2">ms</span>
              </p>
              <p className={cn('mt-2 text-sec text-ink-2', !reduced && 'kit-rise')} style={{ animationDelay: '40ms' }}>
                {pvtWords(stats.mean, usual)}
              </p>
            </>
          ) : (
            <p className="mt-3 font-display text-row font-bold text-ink">{pvtWords(null)}</p>
          )}
          <p className="mt-5 text-fine text-ink-2">{label}</p>
          <Button size="sm" className="mt-4 min-w-[9rem]" onClick={again}>
            Check again <ArrowRight aria-hidden/>
          </Button>
        </Sheet>
        <DidItWork tool="alert" phase="after" className="mx-auto mt-3 w-full max-w-[40rem]"/>
      </ActivityScreen>
    )
  }

  const running = phase !== 'idle'
  return (
    <ActivityScreen family="night" title="Reaction Test">
      <div role="button" tabIndex={0}
        aria-label={running ? 'Tap as soon as the ring fills' : 'Start the reaction test'}
        onPointerDown={tap} onKeyDown={onKey}
        className="block w-full cursor-pointer select-none touch-manipulation rounded-panel">
        <Sheet className="grid min-h-[60vh] place-items-center">
          <div className="w-full">
            <Ring phase={phase} ms={ms}/>
            <p className="mt-3 text-center text-fine text-ink-2" aria-live="polite">
              {running
                ? <span className="font-display text-ui font-semibold tabular-nums">Tap {Math.min(count + 1, MAX_TRIALS)} of {MAX_TRIALS}</span>
                : 'Tap to start, then tap when the ring fills.'}
            </p>
          </div>
        </Sheet>
      </div>
      <OnDevice className="mx-auto mt-3 max-w-[32rem] justify-center">Taps are timed here and never sent.</OnDevice>
      <p className="mx-auto mt-1 max-w-[32rem] text-center text-fine text-ink-2">{label}</p>
      {running && early > 0 && (
        <p className="mx-auto mt-1 max-w-[32rem] text-center text-fine tabular-nums text-ink-3">False starts: {early}</p>
      )}
      {!running && <DidItWork tool="alert" phase="before" className="mx-auto mt-4 w-full max-w-[32rem]"/>}
    </ActivityScreen>
  )
}
