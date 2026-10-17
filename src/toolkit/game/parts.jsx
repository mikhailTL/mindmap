import React from 'react'
import { Button } from '../../ui/button'
import { cn } from '../../lib/utils'
import { useReduced } from '../useReduced'
import { OnDevice } from '../shell'
import { readProgress, subscribe, setPick, recordSession, levelFor,
         themeById, THEMES, RINGS } from './progress'
import { wakeSound, playSound, soundSupported } from './sound'
import './game.css'

/* ── progress as React state ─────────────────────────────────────────── */

export function useProgress() {
  const [p, setP] = React.useState(readProgress)
  React.useEffect(() => subscribe(setP), [])
  return p
}

/* The CSS custom properties every game piece reads its colour from. */
export function gameVars(themeId) {
  const t = themeById(themeId)
  return { '--g-main':t.main, '--g-ink':t.ink, '--g-wash':t.wash }
}

/* ── one session ─────────────────────────────────────────────────────── */

/* useGame(tool): the points for this one session, the pops, the sound and
   the end. `add(n, { x, y, sound })` adds points and floats "+n" at x/y
   (percent of the nearest <Pops/> box, default centre). `finish()` stores the
   session once and returns the result the end card reads. */
export function useGame(tool) {
  const progress = useProgress()
  const reduced = useReduced()
  const [points, setPoints] = React.useState(0)
  const [pops, setPops] = React.useState([])
  const [bump, setBump] = React.useState(0)
  const [result, setResult] = React.useState(null)
  const ref = React.useRef(0)
  const done = React.useRef(null)
  const id = React.useRef(0)
  const soundOn = React.useRef(progress.sound)
  soundOn.current = progress.sound

  const add = React.useCallback((n, o = {}) => {
    const v = Math.max(0, Math.round(n))
    if (!v) return
    ref.current += v
    setPoints(ref.current)
    setBump(b => b + 1)
    const k = ++id.current
    setPops(list => [...list.slice(-5), { k, v, x:o.x ?? 50, y:o.y ?? 40, label:o.label }])
    setTimeout(() => setPops(list => list.filter(p => p.k !== k)), 950)
    playSound(o.sound || 'tick', soundOn.current)
  }, [])

  const finish = React.useCallback(() => {
    if (done.current) return done.current
    const r = recordSession(tool, ref.current)
    done.current = r
    setResult(r)
    playSound(r.levelUp ? 'level' : 'good', soundOn.current)
    return r
  }, [tool])

  const reset = React.useCallback(() => {
    ref.current = 0; done.current = null
    setPoints(0); setPops([]); setResult(null)
  }, [])

  const cue = React.useCallback(kind => playSound(kind, soundOn.current), [])

  return { tool, points, pops, bump, add, finish, reset, result, cue, reduced,
           progress, vars:gameVars(progress.theme), ring:progress.ring }
}

/* ── small pieces ────────────────────────────────────────────────────── */

/* The floating "+10"s. Put inside a `relative` box. */
export function Pops({ game }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-visible">
      {game.pops.map(p => (
        <span key={p.k} style={{ left:p.x + '%', top:p.y + '%', color:'var(--g-ink)',
                                 transform: game.reduced ? 'translate(-50%,0)' : undefined }}
          className={cn('absolute whitespace-nowrap font-display text-num font-bold tabular-nums',
            !game.reduced && 'g-pop')}>
          +{p.v}{p.label ? <span className="ml-1 text-ui">{p.label}</span> : null}
        </span>
      ))}
    </div>
  )
}

/* A ring that fills. `value` 0 to 1. The ring style comes from the reader's
   pick unless one is passed. Children sit in the middle. */
export function FillRing({ value = 0, ring = 'solid', className, children, thin = false, still }) {
  const reduced = useReduced()
  const v = Math.max(0, Math.min(1, value))
  const R = 52, C = 2 * Math.PI * R
  const w = thin ? 7 : 10
  const ease = still || reduced ? 'none' : 'stroke-dashoffset .6s cubic-bezier(0.23,1,0.32,1)'
  let art
  if (ring === 'dots' || ring === 'beads') {
    const n = ring === 'dots' ? 24 : 12
    const r = ring === 'dots' ? 3.6 : 6.4
    const lit = Math.round(v * n)
    art = Array.from({ length:n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2
      return <circle key={i} cx={60 + R * Math.cos(a)} cy={60 + R * Math.sin(a)} r={r}
        style={{ fill: i < lit ? 'var(--g-main)' : '#c2d7ca', transition: reduced ? 'none' : 'fill .3s' }}/>
    })
  } else {
    art = (
      <>
        <circle cx="60" cy="60" r={R} fill="none" stroke="#c2d7ca" strokeWidth={ring === 'double' ? 3 : 4}/>
        {ring === 'double' && <circle cx="60" cy="60" r={R - 10} fill="none" strokeWidth="3"
          style={{ stroke:'var(--g-main)', opacity:.45 }}/>}
        <circle cx="60" cy="60" r={R} fill="none" strokeWidth={w} strokeLinecap="round"
          transform="rotate(-90 60 60)" strokeDasharray={C}
          style={{ stroke:'var(--g-main)', strokeDashoffset: C * (1 - v), transition:ease }}/>
      </>
    )
  }
  return (
    <div className={cn('relative grid aspect-square place-items-center', className)}>
      <svg viewBox="0 0 120 120" aria-hidden focusable="false" className="absolute inset-0 size-full">{art}</svg>
      <div className="relative text-center">{children}</div>
    </div>
  )
}

/* Points so far this session, with a bump on each add. */
export function Score({ game, className }) {
  return (
    <p className={cn('font-display text-ui font-semibold text-ink-2', className)}>
      <span key={game.bump} className={cn('font-display text-num font-bold tabular-nums text-ink',
        !game.reduced && game.bump > 0 && 'g-bump')}>{game.points}</span>
      <span className="ml-1.5">points</span>
    </p>
  )
}

/* The sound pick. Off by default; the tap that turns it on also wakes audio. */
export function SoundToggle({ className }) {
  const p = useProgress()
  if (!soundSupported()) return null
  const flip = async () => {
    const next = !p.sound
    if (next) await wakeSound()
    setPick('sound', next)
    if (next) playSound('tick', true)
  }
  return (
    <button type="button" aria-pressed={p.sound} onClick={flip}
      className={cn('min-h-[44px] rounded-field border-2 border-ink px-3 font-display text-ui',
        'transition-colors duration-150',
        p.sound ? 'bg-ink font-bold text-paper' : 'bg-card font-medium text-ink', className)}>
      {p.sound ? 'Sound on' : 'Sound off'}
    </button>
  )
}

/* The row over a game: session points on the left, sound on the right. */
export function GameBar({ game, children, className }) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <Score game={game}/>
      <div className="flex items-center gap-2">{children}<SoundToggle/></div>
    </div>
  )
}

/* Level and how far into it. Only grows. */
export function LevelMeter({ className, total }) {
  const p = useProgress()
  const reduced = useReduced()
  const L = levelFor(total ?? p.total)
  return (
    <div className={className} style={gameVars(p.theme)}>
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-display text-ui font-bold text-ink">Level {L.level}</span>
        <span className="text-fine text-ink-2 tabular-nums">{L.need - L.into} points to level {L.level + 1}</span>
      </div>
      <div className="mt-1.5 h-3 overflow-hidden rounded-bar border-2 border-ink bg-card">
        <div className="h-full rounded-bar" style={{ width: Math.round(L.pct * 100) + '%',
          background:'var(--g-main)', transition: reduced ? 'none' : 'width .6s cubic-bezier(0.23,1,0.32,1)' }}/>
      </div>
    </div>
  )
}

/* Colours and ring styles. Locked ones say the level that opens them. */
export function ThemePicker({ className }) {
  const p = useProgress()
  const lv = levelFor(p.total).level
  return (
    <div className={className}>
      <p className="font-display text-ui font-bold text-ink">Colours</p>
      <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-8">
        {THEMES.map(t => {
          const open = t.level <= lv, on = p.theme === t.id
          return (
            <button key={t.id} type="button" disabled={!open} aria-pressed={on}
              aria-label={open ? t.name : `${t.name}, opens at level ${t.level}`}
              onClick={() => setPick('theme', t.id)}
              className={cn('flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-field border-2 p-1',
                on ? 'border-ink bg-mist' : 'border-rule bg-card', !open && 'cursor-not-allowed')}>
              <span aria-hidden className="size-6 rounded-full border-2 border-ink"
                style={{ background: open ? t.main : '#e3ede7' }}/>
              <span className={cn('text-fine', on ? 'font-bold text-ink' : 'text-ink-2')}>
                {open ? t.name : `Level ${t.level}`}
              </span>
            </button>
          )
        })}
      </div>
      <p className="mt-3 font-display text-ui font-bold text-ink">Ring</p>
      <div className="mt-2 grid grid-cols-4 gap-2" style={gameVars(p.theme)}>
        {RINGS.map(r => {
          const open = r.level <= lv, on = p.ring === r.id
          return (
            <button key={r.id} type="button" disabled={!open} aria-pressed={on}
              aria-label={open ? r.name : `${r.name}, opens at level ${r.level}`}
              onClick={() => setPick('ring', r.id)}
              className={cn('flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-field border-2 p-1',
                on ? 'border-ink bg-mist' : 'border-rule bg-card', !open && 'cursor-not-allowed opacity-70')}>
              <FillRing value={open ? 0.7 : 0} ring={r.id} thin still className="w-8"/>
              <span className={cn('text-fine', on ? 'font-bold text-ink' : 'text-ink-2')}>
                {open ? r.name : `Level ${r.level}`}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* A number counting up from zero, held still under reduced motion. */
function CountUp({ to }) {
  const reduced = useReduced()
  const [n, setN] = React.useState(reduced ? to : 0)
  React.useEffect(() => {
    if (reduced) { setN(to); return }
    let id = 0
    const t0 = performance.now()
    const tick = now => {
      const k = Math.min(1, (now - t0) / 700)
      setN(Math.round(to * (1 - Math.pow(1 - k, 3))))
      if (k < 1) id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [to, reduced])
  return n
}

/* 3, 2, 1, then onDone. Shown as one big number. */
export function Countdown({ from = 3, onDone, className }) {
  const [n, setN] = React.useState(from)
  const cb = React.useRef(onDone)
  cb.current = onDone
  React.useEffect(() => {
    if (n <= 0) { cb.current?.(); return }
    const t = setTimeout(() => setN(n - 1), 800)
    return () => clearTimeout(t)
  }, [n])
  if (n <= 0) return null
  return <span key={n} className={cn('g-count inline-block font-display text-fig font-bold tabular-nums text-ink', className)}>{n}</span>
}

/* The end of a session: points, a few plain stats, the level ring, anything
   that opened, and one button. `stats` is [[label, value], ...]. Children go
   under the button (the pulse check, a saved thought). */
export function EndCard({ game, title = 'Round done', stats = [], onAgain, children, className }) {
  const r = game.result
  const reduced = useReduced()
  const [stage, setStage] = React.useState(0)
  const el = React.useRef(null)
  React.useEffect(() => {
    if (!r) return
    try { el.current?.scrollIntoView({ block:'start', behavior: reduced ? 'auto' : 'smooth' }) } catch { /* old browsers */ }
  }, [r, reduced])
  React.useEffect(() => {
    if (!r) return
    if (reduced) { setStage(2); return }
    const a = setTimeout(() => setStage(1), 250)
    const b = setTimeout(() => setStage(2), r.levelUp ? 1100 : 250)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [r, reduced])
  if (!r) return null
  const shownLevel = stage >= 2 ? r.after : r.before
  const ringValue = stage === 0 ? r.before.pct
    : stage === 1 ? (r.levelUp ? 1 : r.after.pct) : r.after.pct
  return (
    <section ref={el} style={game.vars}
      className={cn('g-in scroll-mt-24 rounded-panel border-2 border-ink bg-card p-4 sm:p-6', className)}>
      <p role="status" className="sr-only">{title}. {r.points} points.</p>
      <div className="grid items-center gap-5 sm:grid-cols-[auto_minmax(0,1fr)]">
        <FillRing value={ringValue} ring={game.ring} still={stage === 2 && r.levelUp}
          className="mx-auto w-44 sm:w-52">
          <p className="font-display text-fine font-semibold text-ink-2">Level {shownLevel.level}</p>
          <p className="font-display text-gap font-bold tabular-nums" style={{ color:'var(--g-ink)' }}>
            +<CountUp to={r.points}/>
          </p>
          <p className="font-display text-fine font-semibold text-ink-2">points</p>
        </FillRing>
        <div className="min-w-0">
          <h3 className="font-display text-head font-bold tracking-tight text-ink">{title}</h3>
          {stats.length > 0 && (
            <dl className="mt-3 grid grid-cols-2 gap-2">
              {stats.map(([k, v]) => (
                <div key={k} className="rounded-field p-2.5" style={{ background:'var(--g-wash)' }}>
                  <dt className="text-fine text-ink-2">{k}</dt>
                  <dd className="font-display text-row font-bold tabular-nums text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          <p className="mt-3 text-sec text-ink">
            {r.levelUp ? `Level ${r.after.level} reached.` : `${r.after.need - r.after.into} points to level ${r.after.level + 1}.`}
          </p>
          {r.opened.length > 0 && (
            <p className="mt-1 text-sec font-semibold" style={{ color:'var(--g-ink)' }}>
              New {r.opened.map(o => `${o.kind === 'theme' ? 'colour' : 'ring'}: ${o.name}`).join('. New ')}.
            </p>
          )}
          <Button className="mt-4 w-full sm:w-auto sm:min-w-[12rem]" onClick={onAgain}>Play again</Button>
        </div>
      </div>
      {children && <div className="mt-4">{children}</div>}
      <details className="mt-4 border-t border-rule pt-3" open={r.opened.length > 0}>
        <summary className="min-h-[44px] cursor-pointer py-2 font-display text-ui font-semibold text-ink">
          Colours and rings
        </summary>
        <ThemePicker className="mt-1"/>
      </details>
      <OnDevice className="mt-3">Points stay on this phone. Nobody else sees them.</OnDevice>
    </section>
  )
}
