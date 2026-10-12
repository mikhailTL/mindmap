import React from 'react'
import { useReducedMotion } from 'framer-motion'
import { Button } from '../ui/button'
import { Choice, Hint, Step } from './panel'
import { cn } from '../lib/utils'

/* Paced breathing at the resonance-frequency rate, 5 to 6 breaths a minute.
 *
 * The cycle is integrated rather than looked up from the clock, so the pace
 * can change mid-session without the circle jumping: the position advances by
 * dt / cycle every frame and the cycle length is free to move under it. That
 * is what the glide below needs.
 *
 * One rAF loop writes `transform` on a ref. State is set only when the phase
 * or the whole second changes, so React renders about twice a second, not 60
 * times. */

const IN = 0.4                 // share of each cycle spent breathing in
const RATES = [5, 5.5, 6]      // breaths a minute
const WALK_MS = 120000         // measured pace to target pace, over two minutes
const cycleOf = rate => 60000 / rate
const s1 = ms => (ms / 1000).toFixed(1)

/* Four taps give three intervals; the median is the measurement. Anything
   faster than 2.5s or slower than 20s a breath is a mis-tap, not a breath. */
function fromTaps(taps) {
  if (taps.length < 4) return null
  const gaps = taps.slice(1).map((t, i) => t - taps[i]).sort((a, b) => a - b)
  const mid = gaps[Math.floor(gaps.length / 2)]
  if (gaps[0] < 2500 || gaps[gaps.length - 1] > 20000) return 'wild'
  return mid
}

export function Pacer() {
  const reduced = useReducedMotion()
  const [rate, setRate] = React.useState(5.5)
  const [measured, setMeasured] = React.useState(null)   // cycle in ms, from taps
  const [taps, setTaps] = React.useState([])
  const [running, setRunning] = React.useState(false)
  const [tone, setTone] = React.useState(false)
  const [beat, setBeat] = React.useState({ phase: 'in', left: 0, cycle: cycleOf(5.5) })
  const disc = React.useRef(null)
  const audio = React.useRef(null)

  const target = cycleOf(rate)
  const cyc = running ? beat.cycle : target      // idle shows the pace it is set to
  const tapped = fromTaps(taps)

  /* Audio is built on the press that starts it, which is what the autoplay
     policy requires, and torn down with it. Absent AudioContext is silent, not
     an error. */
  React.useEffect(() => {
    if (!running || !tone) return
    let kit = null
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return
      const ctx = new Ctx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 196
      gain.gain.value = 0
      osc.connect(gain).connect(ctx.destination)
      osc.start()
      kit = { ctx, osc, gain }
      audio.current = kit
    } catch { return }
    return () => {
      audio.current = null
      try { kit.gain.gain.value = 0; kit.osc.stop(); kit.ctx.close() } catch {}
    }
  }, [running, tone])

  React.useEffect(() => {
    if (!running) return
    const start = typeof measured === 'number' ? measured : target
    let t0 = 0, last = 0, p = 0, shown = ''
    let raf = requestAnimationFrame(function frame(t) {
      if (!t0) { t0 = t; last = t }
      const dt = Math.min(t - last, 120)       // a backgrounded tab must not jump
      last = t
      const glide = typeof measured === 'number' ? Math.min(1, (t - t0) / WALK_MS) : 1
      const cycle = start + (target - start) * glide
      p = (p + dt / cycle) % 1
      const inhale = p < IN
      const q = inhale ? p / IN : (p - IN) / (1 - IN)
      const e = 0.5 - 0.5 * Math.cos(Math.PI * q)   // slow at both turns, like a breath
      const k = inhale ? e : 1 - e
      if (disc.current && !reduced) disc.current.style.transform = `scale(${(0.4 + 0.6 * k).toFixed(4)})`
      const g = audio.current?.gain
      if (g) {
        try { g.setTargetAtTime(inhale ? 0.055 * k : 0, audio.current.ctx.currentTime, 0.05) } catch {}
      }
      const left = Math.max(1, Math.ceil(((inhale ? IN - p : 1 - p) * cycle) / 1000))
      const key = (inhale ? 'i' : 'o') + left
      if (key !== shown) { shown = key; setBeat({ phase: inhale ? 'in' : 'out', left, cycle }) }
      raf = requestAnimationFrame(frame)
    })
    return () => cancelAnimationFrame(raf)
  }, [running, target, measured, reduced])

  const stop = () => { setRunning(false); setBeat(b => ({ ...b, left: 0 })) }

  return (
    <div>
      <p className="max-w-[54ch] text-sec text-ink-2">{reduced
        ? 'Your device asks for reduced motion, so the circle is held still and the count is the pacer: breathe in while it runs down the in-breath, out through the longer half.'
        : 'Breathe in while the circle grows and out while it shrinks. The out-breath is the longer half. Look at it rather than counting.'}</p>

      <div className="mt-5 rounded-panel bg-aqua p-5">
        <div aria-hidden className="relative mx-auto grid h-[208px] w-[208px] place-items-center">
          <span className="absolute inset-0 rounded-chip border-2 border-dashed border-ruling"/>
          {reduced ? (
            <span className="absolute inset-0 m-auto size-[146px] rounded-chip bg-accent"/>
          ) : (
            <span ref={disc} style={{ transform: 'scale(0.4)' }}
              className="absolute inset-0 size-[208px] rounded-chip bg-accent will-change-transform"/>
          )}
        </div>
        <div className="mt-4 text-center">
          <p className="font-display text-row font-bold text-ink">
            {running ? (beat.phase === 'in' ? 'Breathe in' : 'Breathe out') : 'Ready'}
          </p>
          <p className="mt-1 font-mono text-stat tabular-nums text-ink-2">{running ? beat.left : '·'}</p>
          <p className="note mt-1">
            {s1(cyc * IN)} seconds in, {s1(cyc * (1 - IN))} out
            {running && typeof measured === 'number' && cyc - target > 200 ? ', easing down' : ''}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => (running ? stop() : setRunning(true))}
          aria-label={running ? 'Stop the pacer' : `Start the pacer at ${rate} breaths a minute`}>
          {running ? 'Stop' : 'Start'}
        </Button>
        <Choice on={tone} onClick={() => setTone(t => !t)}>
          {tone ? 'Tone on' : 'Tone off'}
        </Choice>
      </div>

      <Step className="mt-6">Pace</Step>
      <div className="mt-3 flex flex-wrap gap-2">
        {RATES.map(r => (
          <Choice key={r} on={rate === r}
            onClick={() => { setRate(r); setMeasured(null) }}>
            {r} a minute
          </Choice>
        ))}
      </div>
      <Hint className="mt-2.5">Slower is not better. Pick the one you can hold without reaching for air.</Hint>

      <Step className="mt-6">Or start from your own breath</Step>
      <p className="mt-2.5 max-w-[52ch] text-sec text-ink-2">Breathe the way you already are and tap at the
        start of each in-breath, four times. The pacer starts at the pace you tapped and eases from
        there to {rate} a minute over two minutes, rather than dropping you straight onto it.</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Choice onClick={() => setTaps(t => [...t, performance.now()].slice(-4))}
          className="min-w-[8rem] text-center font-bold">
          Tap ({Math.min(taps.length, 4)} of 4)
        </Choice>
        {taps.length > 0 && (
          <Button type="button" variant="ghost" onClick={() => { setTaps([]); setMeasured(null) }}>
            Clear taps
          </Button>
        )}
      </div>
      {tapped === 'wild' && (
        <Hint className="mt-2.5">Those taps were too uneven to read as breaths. Clear them and try again,
          or use a set pace above.</Hint>
      )}
      {typeof tapped === 'number' && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-sec text-ink">
            You tapped <span className="font-mono tabular-nums">{(60000 / tapped).toFixed(1)}</span> breaths
            a minute.
          </p>
          <Choice on={measured != null} onClick={() => setMeasured(tapped)}>
            {measured != null ? 'Starting from yours' : 'Start from mine'}
          </Choice>
        </div>
      )}

      <Step className="mt-6">Why this rate</Step>
      <p className="mt-2.5 max-w-[58ch] text-sec text-ink-2">Five to six breaths a minute is the
        resonance-frequency rate used in heart-rate-variability biofeedback, where the breath and the
        baroreflex line up (Lehrer and Gevirtz, 2014). Across twelve randomised trials, slow breathing
        came out at g = −0.35 against control on self-reported stress (Fincham and others, 2023). That
        is the technique as it has been measured in trials. It is not a claim about this app, and it is
        not a claim about what will happen to you.</p>
    </div>
  )
}
