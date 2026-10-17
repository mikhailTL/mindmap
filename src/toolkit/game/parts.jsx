import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../../ui/button'
import { cn } from '../../lib/utils'
import { useReduced } from '../useReduced'
import { OnDevice } from '../shell'
import { readProgress, subscribe, setPick, recordFinish, levelFor, levelName,
         themeById, THEMES, RINGS } from './progress'
import { BadgeIcon } from './badges'
import { wakeSound, playSound, soundSupported } from './sound'
import { Burst, Confetti, LevelEmblem, XPBar, ToNext, LevelUpBanner, Stars, CountUp, TIER,
         useTotalTween, useSvgId, SPRING, SOFT } from './fx'
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

/* useGame(tool): the score for this one session, the pops, the combo, the
   sound and the end. `add(n, { x, y, sound, label, combo })` adds to the
   score and floats "+n" at x/y (percent of the nearest <Pops/> box). Each add
   grows the combo unless `combo:false`; `miss()` sets it back to zero. The
   combo lives inside one round only and is never stored. `finish()` stores
   the session once and returns the result the end card reads. */
export function useGame(tool) {
  const progress = useProgress()
  const reduced = useReduced()
  const [points, setPoints] = React.useState(0)
  const [pops, setPops] = React.useState([])
  const [bump, setBump] = React.useState(0)
  const [combo, setCombo] = React.useState(0)
  const [result, setResult] = React.useState(null)
  const ref = React.useRef(0)
  const comboRef = React.useRef(0)
  const topCombo = React.useRef(0)
  const done = React.useRef(null)
  const id = React.useRef(0)
  const soundOn = React.useRef(progress.sound)
  soundOn.current = progress.sound

  const add = React.useCallback((n, o = {}) => {
    const v = Math.max(0, Math.round(n))
    if (!v) return
    ref.current += v
    if (o.combo !== false) {
      comboRef.current += 1
      topCombo.current = Math.max(topCombo.current, comboRef.current)
      setCombo(comboRef.current)
    }
    setPoints(ref.current)
    setBump(b => b + 1)
    const k = ++id.current
    setPops(list => [...list.slice(-5), { k, v, x:o.x ?? 50, y:o.y ?? 40, label:o.label,
                                          combo: o.combo !== false ? comboRef.current : 0 }])
    setTimeout(() => setPops(list => list.filter(p => p.k !== k)), 1100)
    playSound(o.sound || 'tick', soundOn.current)
  }, [])

  const miss = React.useCallback(() => { comboRef.current = 0; setCombo(0) }, [])

  /* finish({ complete, marks }): store the session once. Points come only
     from a finish (flat, see progress.js); the round score is kept beside
     it as `score` so the end card can show both without mixing them. An
     early end is said outright: finish({ complete:false }). */
  const finish = React.useCallback((o = {}) => {
    if (done.current) return done.current
    const opts = o && typeof o === 'object' && !o.nativeEvent ? o : {}
    const complete = opts.complete !== false
    const r = { ...recordFinish(tool, { complete, marks: opts.marks || [] }), score: ref.current,
                combo: topCombo.current }
    done.current = r
    setResult(r)
    playSound(r.levelUp ? 'level' : r.complete ? 'good' : 'turn', soundOn.current)
    return r
  }, [tool])

  const reset = React.useCallback(() => {
    ref.current = 0; done.current = null; comboRef.current = 0; topCombo.current = 0
    setPoints(0); setPops([]); setResult(null); setCombo(0)
  }, [])

  const cue = React.useCallback(kind => playSound(kind, soundOn.current), [])

  return { tool, points, pops, bump, combo, add, miss, finish, reset, result, cue, reduced,
           progress, vars:gameVars(progress.theme), ring:progress.ring }
}

/* ── small pieces ────────────────────────────────────────────────────── */

/* A white halo so a small pop stays readable over any fill it drifts across. */
const POP_HALO = '0 0 2px #fff, 0 0 6px #fff, 0 0 10px #fff'

function Flame({ className }) {
  return (
    <svg viewBox="0 0 16 20" aria-hidden focusable="false" className={className}>
      <path d="M8 1c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 2-7 2 1 3 3 3 5 1-2 1-5 1-9z" fill="#f2702a"/>
      <path d="M8 10c.6 2 3 3 3 5a3 3 0 0 1-6 0c0-1.5 1.2-2 1.5-3.5.8.6 1.2 1.3 1.5 2 .3-1 .2-2.2 0-3.5z" fill="#ffd76a"/>
    </svg>
  )
}

function Pop({ p, reduced }) {
  const big = p.v >= 15 || !!p.label
  return (
    <span className="absolute" style={{ left:p.x + '%', top:p.y + '%' }}>
      <motion.span className="absolute left-0 top-0 flex items-center gap-1 whitespace-nowrap"
        style={{ x:'-50%' }}
        initial={reduced ? { opacity:1 } : { opacity:0, y:10, scale:0.3 }}
        animate={reduced ? { opacity:1 } : { opacity:1, y:-30, scale:[0.3, 1.3, 1] }}
        exit={reduced ? { opacity:0 } : { opacity:0, y:-52, scale:0.9, transition:{ duration:0.32, ease:'easeIn' } }}
        transition={reduced ? { duration:0 } : { y:SOFT, scale:{ duration:0.42, times:[0, 0.55, 1] }, opacity:{ duration:0.12 } }}>
        {big ? (
          <span className="relative overflow-hidden rounded-[12px] px-2.5 py-1 font-display text-num font-bold tabular-nums text-white shadow-raise"
            style={{ background:'linear-gradient(135deg, var(--g-main), var(--g-ink) 70%)' }}>
            +{p.v}{p.label ? <span className="ml-1.5 text-ui">{p.label}</span> : null}
            {!reduced && (
              <motion.span aria-hidden className="absolute inset-0 bg-white"
                initial={{ opacity:0.85 }} animate={{ opacity:0 }} transition={{ duration:0.4 }}/>
            )}
          </span>
        ) : (
          <span className="font-display text-num font-bold tabular-nums" style={{ color:'var(--g-ink)', textShadow:POP_HALO }}>
            +{p.v}
          </span>
        )}
        {p.combo >= 2 && (
          <span className="flex items-center rounded-[10px] bg-white px-1.5 py-0.5 font-display text-fine font-bold text-ink shadow-card">
            <Flame className="mr-0.5 h-4 w-3.5"/>x{p.combo}
          </span>
        )}
      </motion.span>
      {big && <Burst fire={p.k} x={0} y={0} count={8} spread={38} size={6}/>}
    </span>
  )
}

/* The floating "+10"s. Put inside a `relative` box. */
export function Pops({ game }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-visible">
      <AnimatePresence>
        {game.pops.map(p => <Pop key={p.k} p={p} reduced={game.reduced}/>)}
      </AnimatePresence>
    </div>
  )
}

/* A ring that fills. `value` 0 to 1. The ring style comes from the reader's
   pick unless one is passed. Children sit in the middle. A soft glow rides
   the leading end of a solid ring. */
export function FillRing({ value = 0, ring = 'solid', className, children, thin = false, still }) {
  const reduced = useReduced()
  const gid = useSvgId('fr')
  const v = Math.max(0, Math.min(1, value))
  const R = 52, C = 2 * Math.PI * R
  const w = thin ? 7 : 11
  /* No CSS transition: games move this every frame, and a transition that
     restarts every frame never gets anywhere. The games' own clocks are the
     smoothing. */
  const ease = 'none'
  let art
  if (ring === 'dots' || ring === 'beads') {
    const n = ring === 'dots' ? 24 : 12
    const r = ring === 'dots' ? 3.6 : 6.4
    const lit = Math.round(v * n)
    art = Array.from({ length:n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2
      return <circle key={i} cx={60 + R * Math.cos(a)} cy={60 + R * Math.sin(a)} r={r}
        style={{ fill: i < lit ? `url(#${gid}g)` : '#dbe7e0', transition: reduced ? 'none' : 'fill .3s' }}/>
    })
  } else {
    const a = v * Math.PI * 2 - Math.PI / 2
    art = (
      <>
        <circle cx="60" cy="60" r={R} fill="none" stroke="#e1ebe5" strokeWidth={ring === 'double' ? 4 : w}/>
        {ring === 'double' && <circle cx="60" cy="60" r={R - 11} fill="none" strokeWidth="3"
          style={{ stroke:'var(--g-main)', opacity:.45 }}/>}
        <circle cx="60" cy="60" r={R} fill="none" strokeWidth={w} strokeLinecap="round"
          transform="rotate(-90 60 60)" strokeDasharray={C} stroke={`url(#${gid}g)`}
          style={{ strokeDashoffset: C * (1 - v), transition:ease }}/>
        {!thin && v > 0.01 && v < 0.999 && (
          <circle cx={60 + R * Math.cos(a)} cy={60 + R * Math.sin(a)} r={w * 1.1} fill={`url(#${gid}t)`}/>
        )}
      </>
    )
  }
  return (
    <div className={cn('relative grid aspect-square place-items-center', className)}>
      <svg viewBox="0 0 120 120" aria-hidden focusable="false" className="absolute inset-0 size-full overflow-visible">
        <defs>
          <linearGradient id={gid + 'g'} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor:'var(--g-main)' }}/>
            <stop offset="1" style={{ stopColor:'var(--g-ink)' }}/>
          </linearGradient>
          <radialGradient id={gid + 't'}>
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95"/>
            <stop offset="0.45" style={{ stopColor:'var(--g-main)' }} stopOpacity="0.55"/>
            <stop offset="1" style={{ stopColor:'var(--g-main)' }} stopOpacity="0"/>
          </radialGradient>
          <radialGradient id={gid + 'w'} cx="0.5" cy="0.4" r="0.6">
            <stop offset="0" stopColor="#ffffff"/>
            <stop offset="1" style={{ stopColor:'var(--g-wash)' }}/>
          </radialGradient>
        </defs>
        {!thin && <circle cx="60" cy="60" r={R - w / 2 - 3} fill={`url(#${gid}w)`}/>}
        {art}
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  )
}

/* The combo: a small flame and the count, only from two in a row. */
export function Combo({ game, className }) {
  const n = game.combo || 0
  return (
    <AnimatePresence>
      {n >= 2 && (
        <motion.span key="combo" className={cn('inline-flex items-center gap-0.5 font-display text-ui font-bold tabular-nums text-ink', className)}
          initial={game.reduced ? false : { scale:0.4, opacity:0 }} animate={{ scale:1, opacity:1 }}
          exit={{ scale:0.4, opacity:0 }} transition={SPRING} aria-label={`Combo ${n}`}>
          <Flame className="h-5 w-4"/>
          <motion.span key={n} initial={game.reduced ? false : { scale:1.5 }} animate={{ scale:1 }} transition={SPRING}>
            x{n}
          </motion.span>
        </motion.span>
      )}
    </AnimatePresence>
  )
}

/* This round's score, with a springy bump on each add. It is called score,
   not points: points are what a finish adds to the level, and only a finish. */
export function Score({ game, className }) {
  return (
    <div className={cn('flex items-center gap-3 font-display text-ui font-semibold text-ink-2', className)}>
      <p className="flex items-baseline">
        <span className="mr-1.5">Score</span>
        <motion.span key={game.bump} className="inline-block font-display text-num font-bold tabular-nums text-ink"
          style={{ color: game.bump > 0 ? 'var(--g-ink)' : undefined }}
          initial={game.reduced || !game.bump ? false : { scale:1.45 }} animate={{ scale:1 }} transition={SPRING}>
          {game.points}
        </motion.span>
      </p>
      <Combo game={game}/>
    </div>
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
      className={cn('min-h-[44px] rounded-field border px-3 font-display text-ui',
        'transition-[background-color,color,transform] duration-150 motion-safe:active:scale-[0.96]',
        p.sound ? 'border-ink bg-ink font-bold text-paper' : 'border-rule bg-card font-medium text-ink', className)}>
      {p.sound ? 'Sound on' : 'Sound off'}
    </button>
  )
}

/* The row over a game: session score and combo on the left, sound on the right. */
export function GameBar({ game, children, className }) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-x-3 gap-y-2', className)}>
      <Score game={game}/>
      <div className="flex items-center gap-2">{children}<SoundToggle/></div>
    </div>
  )
}

/* Level, its emblem and a bar to the next one. Only grows. */
export function LevelMeter({ className, total }) {
  const p = useProgress()
  const t = total ?? p.total
  const L = levelFor(t)
  return (
    <div className={cn('flex items-center gap-3 rounded-[16px] border border-rule bg-card p-3 shadow-card', className)}
      style={gameVars(p.theme)}>
      <LevelEmblem level={L.level} size={52} pulse={false}/>
      <div className="min-w-0 flex-1">
        <p className="font-display text-ui font-bold text-ink">Level {L.level}, {levelName(L.level)}</p>
        <XPBar total={t} className="mt-1.5"/>
        <ToNext total={t} className="mt-1"/>
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

/* 3, 2, 1, then onDone. One big number that springs in, inside a ring
   that drains each second. */
export function Countdown({ from = 3, onDone, className }) {
  const reduced = useReduced()
  const [n, setN] = React.useState(from)
  const cb = React.useRef(onDone)
  cb.current = onDone
  React.useEffect(() => {
    if (n <= 0) { cb.current?.(); return }
    const t = setTimeout(() => setN(n - 1), 800)
    return () => clearTimeout(t)
  }, [n])
  if (n <= 0) return null
  return (
    <span className={cn('relative inline-grid size-32 place-items-center', className)}>
      <svg viewBox="0 0 100 100" aria-hidden focusable="false" className="absolute inset-0 size-full -rotate-90">
        <circle cx="50" cy="50" r="44" fill="#ffffff" stroke="#e1ebe5" strokeWidth="7"/>
        <motion.circle key={n} cx="50" cy="50" r="44" fill="none" strokeWidth="7" strokeLinecap="round"
          style={{ stroke:'var(--g-main)' }} pathLength="1" strokeDasharray="1 1"
          initial={{ strokeDashoffset:0 }} animate={{ strokeDashoffset: reduced ? 0 : 1 }}
          transition={{ duration:0.8, ease:'linear' }}/>
      </svg>
      <motion.span key={n} className="relative font-display text-fig font-bold tabular-nums"
        style={{ color:'var(--g-ink)' }}
        initial={reduced ? false : { scale:1.9, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={SPRING}>
        {n}
      </motion.span>
    </span>
  )
}

/* "20 for finishing, 10 for a new tool and 5 for all right." */
const PART_WORDS = { 'Finished':'for finishing', 'New tool':'for a new tool', 'All right':'for getting every answer right' }
function partsLine(parts = []) {
  const bits = parts.map(([k, n]) => `${n} ${PART_WORDS[k] || k.toLowerCase()}`)
  if (bits.length < 2) return bits.length ? bits[0][0].toUpperCase() + bits[0].slice(1) + '.' : ''
  const s = bits.slice(0, -1).join(', ') + ' and ' + bits[bits.length - 1]
  return s[0].toUpperCase() + s.slice(1) + '.'
}

const BACK_CLASS = cn('inline-flex min-h-[54px] items-center justify-center gap-2.5 rounded-field border border-rule',
  'bg-card px-7 font-display text-ui font-semibold text-ink shadow-card transition-[background-color,transform]',
  'duration-150 motion-safe:active:scale-[0.97] hoverOnly:bg-mist')

/* The results screen. In order: the stars for the round and its medal, the
   round score rolling up, the points a finish earned flying into the level
   bar, the bar filling (a level up drops a banner and confetti), the stats,
   then any new badge turning over. An early end earns no points and says so
   plainly. `stars` (1 to 3) is the tool's own judgement of the round; left
   out, a finish is two stars and a round with every answer right is three.
   `stats` is [[label, value], ...]. Children go under the buttons. With no
   `onDone`, Back goes to the Toolkit. */
export function EndCard({ game, title = 'Round done', stats = [], onAgain, againLabel = 'Play again',
                          onDone, doneLabel, back = '#/toolkit', stars, children, className }) {
  const r = game.result
  const reduced = useReduced()
  const [phase, setPhase] = React.useState(0)
  const [lvUp, setLvUp] = React.useState(null)
  const [boom, setBoom] = React.useState(0)
  const [gain, setGain] = React.useState(0)
  const el = React.useRef(null)
  React.useEffect(() => {
    if (!r) return
    try { el.current?.scrollIntoView({ block:'start', behavior: reduced ? 'auto' : 'smooth' }) } catch { /* old browsers */ }
  }, [r, reduced])
  React.useEffect(() => {
    if (!r) return
    setLvUp(null)
    if (reduced) { setPhase(3); return }
    setPhase(0)
    const ts = [setTimeout(() => setPhase(1), 1150), setTimeout(() => { setPhase(2); setGain(g => g + 1) }, 1650),
                setTimeout(() => setPhase(3), r.levelUp ? 3600 : 2500)]
    return () => ts.forEach(clearTimeout)
  }, [r, reduced])
  const total = useTotalTween(r?.totalBefore ?? 0, r?.total ?? 0, { run: !!r && phase >= 2,
    onLevel: l => { setLvUp(l); setBoom(b => b + 1) } })
  const done = r ? r.complete !== false : false
  const n = !r || !done ? 0 : stars != null ? Math.max(1, Math.min(3, Math.round(stars)))
    : (r.parts || []).some(([k]) => k === 'All right') ? 3 : 2
  const gold = n === 3
  React.useEffect(() => { if (r && gold && !reduced) { const t = setTimeout(() => setBoom(b => b + 1), 1100); return () => clearTimeout(t) } }, [r, gold, reduced])
  if (!r) return null
  const hasScore = (r.score || 0) > 0 && !stats.some(([k]) => /score/i.test(k))
  const allStats = [...stats]
  if ((r.combo || 0) >= 3 && !stats.some(([k]) => /combo/i.test(k))) allStats.push(['Best combo', `x${r.combo}`])
  const badges = (r.badges || []).filter(Boolean)
  const L = levelFor(total)
  return (
    <section ref={el} style={game.vars}
      className={cn('relative scroll-mt-24 overflow-hidden rounded-[22px] border border-rule bg-card shadow-raise', !reduced && 'g-in', className)}>
      <p role="status" className="sr-only">
        {title}. {n ? `${n} of 3 stars. ` : ''}{done ? `${r.points} points.` : 'Ended early, no points this time.'}
        {r.levelUp ? ` Level ${r.after.level} reached.` : ''}
        {badges.map(b => ` New badge: ${b.name}.`).join('')}
      </p>
      <Confetti fire={boom} x={50} y={18}/>

      <div className="relative px-4 pb-5 pt-6 text-center sm:px-6"
        style={{ background:'radial-gradient(120% 90% at 50% 0%, var(--g-wash) 0%, #ffffff 78%)' }}>
        {done ? <Stars n={n} size={42}/> : null}
        {n > 0 && (
          <motion.p className="mt-1 font-display text-fine font-bold uppercase tracking-[0.12em]" style={{ color:'var(--g-ink)' }}
            initial={reduced ? false : { opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.9, duration:0.3 }}>
            {TIER[n]} round
          </motion.p>
        )}
        <p role="heading" aria-level={3} className="mt-1 font-display text-head font-bold tracking-tight text-ink">{title}</p>
        {hasScore && (
          <div className="mt-3">
            <p className="font-display text-fine font-semibold text-ink-2">Round score</p>
            <p className="font-display text-fig font-bold leading-none" style={{ color:'var(--g-ink)' }}>
              <CountUp to={r.score} delay={0.25}/>
            </p>
          </div>
        )}
        <p className="mx-auto mt-3 max-w-[30rem] text-ui text-ink-2">
          {done ? partsLine(r.parts) : 'Ended early. Points come when you finish a round.'}
        </p>
      </div>

      <div className="px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="relative rounded-[18px] border border-rule p-3 sm:p-4"
          style={{ background:'linear-gradient(120deg, #def0fc 0%, #f6e8ff 55%, #ffe8e0 100%)' }}>
          {done && r.points > 0 && (
            <motion.span aria-hidden className="pointer-events-none absolute right-3 top-0 z-10 rounded-[12px] px-2.5 py-1 font-display text-ui font-bold text-white shadow-raise"
              style={{ background:'linear-gradient(135deg, var(--g-main), var(--g-ink) 70%)' }}
              initial={reduced ? { opacity:0 } : { opacity:0, y:-40, scale:0.5 }}
              animate={reduced ? { opacity:0 } : phase === 0 ? { opacity:1, y:-22, scale:1.15 }
                : { opacity:0, y:34, x:-60, scale:0.45 }}
              transition={phase === 0 ? { ...SPRING, delay:0.6 } : { duration:0.5, ease:[0.5, 0, 0.75, 0] }}>
              +{r.points} points
            </motion.span>
          )}
          <div className="flex items-center gap-3">
            <motion.div key={L.level} initial={reduced || L.level === r.before.level ? false : { scale:0.3, rotate:-30 }}
              animate={{ scale:1, rotate:0 }} transition={SPRING}>
              <LevelEmblem level={L.level} size={60}/>
            </motion.div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-display text-ui font-bold text-ink">Level {L.level}, {levelName(L.level)}</p>
                {done && <p className="shrink-0 font-display text-ui font-bold tabular-nums" style={{ color:'var(--g-ink)' }}>+{r.points}</p>}
              </div>
              <XPBar total={total} gain={gain + boom} className="mt-1.5" tall/>
              <ToNext total={total} className="mt-1"/>
            </div>
          </div>
          <LevelUpBanner level={lvUp || r.after.level} show={!!lvUp} className="mt-3"/>
          {r.opened.length > 0 && phase >= 3 && (
            <p className="mt-2 text-sec font-semibold" style={{ color:'var(--g-ink)' }}>
              Opened: {r.opened.map(o => `${o.kind === 'theme' ? 'colour' : 'ring'} ${o.name}`).join(', ')}.
            </p>
          )}
        </div>

        {allStats.length > 0 && (
          <dl className="mt-3 grid grid-cols-2 gap-2">
            {allStats.map(([k, v], i) => (
              <motion.div key={k} className="rounded-[14px] p-2.5" style={{ background:'var(--g-wash)' }}
                initial={reduced ? false : { opacity:0, y:12, scale:0.96 }} animate={{ opacity:1, y:0, scale:1 }}
                transition={{ ...SOFT, delay:0.35 + i * 0.07 }}>
                <dt className="text-fine text-ink-2">{k}</dt>
                <dd className="font-display text-row font-bold tabular-nums text-ink">{v}</dd>
              </motion.div>
            ))}
          </dl>
        )}

        {badges.length > 0 && phase >= 3 && (
          <ul className="mt-3 grid gap-2" style={{ perspective:800 }}>
            {badges.map((b, i) => (
              <motion.li key={b.id} className="relative flex items-center gap-3 overflow-hidden rounded-[16px] border border-rule p-3"
                style={{ background:'linear-gradient(110deg, #fff8e1 0%, #ffffff 60%)' }}
                initial={reduced ? false : { rotateX:-80, opacity:0, y:-8 }} animate={{ rotateX:0, opacity:1, y:0 }}
                transition={{ ...SPRING, delay:i * 0.25 }}>
                <span className="relative">
                  <motion.span className="block" initial={reduced ? false : { scale:0, rotate:-120 }}
                    animate={{ scale:1, rotate:0 }} transition={{ ...SPRING, delay:0.15 + i * 0.25 }}>
                    <BadgeIcon id={b.id} size={56} shine/>
                  </motion.span>
                  <Burst fire={reduced ? 0 : i + 1} x={50} y={50} count={12} spread={46} size={7}/>
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-fine font-bold uppercase tracking-[0.1em] text-[#825d07]">New badge</span>
                  <span className="block font-display text-row font-bold leading-tight text-ink">{b.name}</span>
                  <span className="block text-fine text-ink-2">{b.line}</span>
                </span>
              </motion.li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          {onAgain && <Button className="min-w-[10rem] flex-1 sm:flex-none" onClick={onAgain}>{againLabel}</Button>}
          {onDone
            ? <Button variant="outline" className="min-w-[8rem] flex-1 sm:flex-none" onClick={onDone}>{doneLabel || 'Done'}</Button>
            : <a href={back} className={cn(BACK_CLASS, 'min-w-[8rem] flex-1 sm:flex-none')}>{doneLabel || 'Back'}</a>}
        </div>
        {children && <div className="mt-4">{children}</div>}
        <details className="mt-4 border-t border-rule pt-3" open={r.opened.length > 0}>
          <summary className="min-h-[44px] cursor-pointer py-2 font-display text-ui font-semibold text-ink">
            Colours and rings
          </summary>
          <ThemePicker className="mt-1"/>
        </details>
        <OnDevice className="mt-3">Points stay on this phone. Nobody else sees them.</OnDevice>
      </div>
    </section>
  )
}
