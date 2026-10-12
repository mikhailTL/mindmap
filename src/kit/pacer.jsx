import React from 'react'
import { useReducedMotion } from 'framer-motion'
import { Button } from '../ui/button'
import { Choice, Hint, Step } from './panel'

/* Resonance Breathing. Paced at the resonance-frequency rate, 5 to 6 breaths a
 * minute, which is what the name is: it is not box breathing and it has no
 * holds in it, so it is not called that.
 *
 * THE DIAL. Three things, each saying something the others do not:
 *   the disc    scales 0.42 to 1 and is the breath itself, so the reader can
 *               follow it without reading anything
 *   the ring    is split 40 / 60 in the activity's two tones, which is the one
 *               fact about this technique that is hard to say in words: the
 *               out-breath is half as long again as the in-breath
 *   the hand    runs round the ring once per breath, so a glance says where
 *               in the cycle this is and how much of the long half is left
 * Under reduced motion the disc is held, the hand is parked at the top of the
 * cycle and the ring still carries the split. The count below keeps running,
 * because it is React state rather than motion, and it is the pacer in that
 * mode.
 *
 * The cycle is integrated rather than looked up from the clock, so the pace
 * can change mid-session without the dial jumping: the position advances by
 * dt / cycle every frame and the cycle length is free to move under it. That
 * is what the glide below needs.
 *
 * One rAF loop writes `transform` on two refs. State is set only when the
 * phase, the whole second or the elapsed second changes, so React renders
 * about once a second rather than sixty times. */

const IN = 0.4                 // share of each cycle spent breathing in
const RATES = [5, 5.5, 6]      // breaths a minute
const WALK_MS = 120000         // measured pace to target pace, over two minutes
const cycleOf = rate => 60000 / rate
/* The whole transform, written here rather than left half to a class. An
   inline `transform` replaces the element's -translate-x-1/2 outright, so a
   bare scale() put the disc's corner on the centre of the ring instead of its
   middle, and it grew out of the bottom right. */
const discAt = k => `translate(-50%, -50%) scale(${k.toFixed(4)})`
const s1 = ms => (ms / 1000).toFixed(1)
const clock = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/* Four taps give three intervals; the median is the measurement. Anything
   faster than 2.5s or slower than 20s a breath is a mis-tap, not a breath. */
function fromTaps(taps) {
  if (taps.length < 4) return null
  const gaps = taps.slice(1).map((t, i) => t - taps[i]).sort((a, b) => a - b)
  const mid = gaps[Math.floor(gaps.length / 2)]
  if (gaps[0] < 2500 || gaps[gaps.length - 1] > 20000) return 'wild'
  return mid
}

/* One cell of the readout. The label sits above the figure rather than beside
   it here, because three of these sit in a row and a side label would set the
   column width from the longest word rather than from the figure. */
function Cell({ label, children, className }) {
  return (
    <div className={`bg-card p-3 ${className || ''}`}>
      <p className="font-display text-fine font-medium text-ink-2">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  )
}

export function Pacer() {
  const reduced = useReducedMotion()
  const [rate, setRate] = React.useState(5.5)
  const [measured, setMeasured] = React.useState(null)   // cycle in ms, from taps
  const [taps, setTaps] = React.useState([])
  const [running, setRunning] = React.useState(false)
  const [tone, setTone] = React.useState(false)
  const [beat, setBeat] = React.useState({ phase: 'in', left: 0, cycle: cycleOf(5.5), at: 0 })
  const disc = React.useRef(null)
  const hand = React.useRef(null)
  const audio = React.useRef(null)
  const began = React.useRef(0)

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
      if (!reduced) {
        if (disc.current) disc.current.style.transform = discAt(0.42 + 0.58 * k)
        if (hand.current) hand.current.style.transform = `rotate(${(p * 360).toFixed(2)}deg)`
      }
      const g = audio.current?.gain
      if (g) {
        try { g.setTargetAtTime(inhale ? 0.055 * k : 0, audio.current.ctx.currentTime, 0.05) } catch {}
      }
      const left = Math.max(1, Math.ceil(((inhale ? IN - p : 1 - p) * cycle) / 1000))
      const at = Math.max(0, Math.floor((t - began.current) / 1000))
      const key = (inhale ? 'i' : 'o') + left + '/' + at
      if (key !== shown) { shown = key; setBeat({ phase: inhale ? 'in' : 'out', left, cycle, at }) }
      raf = requestAnimationFrame(frame)
    })
    return () => cancelAnimationFrame(raf)
  }, [running, target, measured, reduced])

  const begin = () => { began.current = performance.now(); setRunning(true) }
  const stop = () => { setRunning(false); setBeat(b => ({ ...b, left: 0 })) }

  return (
    <div>
      <p className="max-w-[54ch] text-sec text-ink-2">{reduced
        ? 'Your device asks for reduced motion, so the dial is held still and the count is the pacer: breathe in while it runs down the in-breath, out through the longer half.'
        : 'Breathe in while the disc grows and out while it shrinks. The shorter, darker run on the ring is the in-breath, two fifths of it, and the longer, lighter run is the out-breath. Look at it rather than counting.'}</p>

      <div className="kit-ground mt-5 rounded-panel border-2 border-ink p-4 sm:p-5">
        <div aria-hidden className="relative mx-auto size-[208px]">
          {/* The ring, and the one fact it is here to carry: the out-breath is
              the longer half. pathLength normalises the circle to 100 units so
              the split is written as the numbers it actually is. */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 size-full">
            <circle cx="50" cy="50" r="46" className="stroke-ruling" strokeWidth="2" fill="none"/>
            <circle cx="50" cy="50" r="46" pathLength="100" transform="rotate(-90 50 50)"
              className="kit-s" strokeWidth="4" strokeLinecap="butt" fill="none"
              strokeDasharray="40 60"/>
            <circle cx="50" cy="50" r="46" pathLength="100" transform="rotate(-90 50 50)"
              className="kit-s-art" strokeWidth="4" strokeLinecap="butt" fill="none"
              strokeDasharray="60 40" strokeDashoffset="-40"/>
          </svg>
          {/* The breath. Held at the size it rests at when motion is reduced,
              which is still a disc inside a ring rather than a blank field. */}
          <span ref={disc} style={{ transform: discAt(reduced ? 0.78 : 0.42) }}
            className="absolute left-1/2 top-1/2 size-[168px] rounded-chip kit-fill
              will-change-transform"/>
          {/* The hand. A rotation on a wrapper, so the dot it carries is the
              only thing that moves and it moves on the compositor. */}
          <span ref={hand} style={{ transform: 'rotate(0deg)' }}
            className="absolute inset-0 will-change-transform">
            <span className="absolute left-1/2 top-0 size-3.5 -translate-x-1/2 -translate-y-1/2
              rounded-chip border-2 border-paper bg-ink"/>
          </span>
        </div>

        {/* The readout. Three figures rather than one, because "how long is
            left" and "how long have I been doing this" are different questions
            and the second one is the one a reader asks at the end. */}
        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-field border-2 border-ink
          bg-ink sm:grid-cols-3">
          {/* Announced, because under reduced motion and for a reader who
              cannot see the disc this cell is the pacer. Twice a breath at five
              a minute is ten announcements a minute, which is the instruction
              rather than chatter. The two figures beside it are not announced:
              a seconds counter read aloud every second is unusable. */}
          <Cell label="Now" className="col-span-2 sm:col-span-1">
            <p aria-live="polite" className="font-display text-row font-bold text-ink">
              {running ? (beat.phase === 'in' ? 'Breathe in' : 'Breathe out') : 'Ready'}
            </p>
          </Cell>
          <Cell label="Seconds left">
            <p className="font-mono text-stat tabular-nums text-ink">{running ? beat.left : '0'}</p>
          </Cell>
          <Cell label="Elapsed">
            <p className="font-mono text-stat tabular-nums text-ink">{clock(beat.at)}</p>
          </Cell>
        </div>
        <p className="note mt-2">
          {s1(cyc * IN)} seconds in, {s1(cyc * (1 - IN))} out
          {running && typeof measured === 'number' && cyc - target > 200 ? ', easing down' : ''}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => (running ? stop() : begin())}
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
