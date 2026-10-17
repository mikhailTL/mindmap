import React from 'react'
import { motion, AnimatePresence, animate } from 'framer-motion'
import { cn } from '../../lib/utils'
import { useReduced } from '../useReduced'
import { levelFor, levelStart, levelName } from './progress'

/* The visual reward layer: bursts, confetti, level emblems, the XP bar and
 * the stars a round earns. Everything moves with transform and opacity only,
 * and every piece holds still (or draws nothing) under reduced motion. */

export const PARTY = ['#f25424', '#f2248b', '#a024f2', '#2294e6', '#18a370', '#f5b82e']
export const SPRING = { type:'spring', stiffness:420, damping:26 }
export const SOFT = { type:'spring', stiffness:220, damping:24 }

/* A stable id that is safe inside url(#...). */
export function useSvgId(prefix = 'g') {
  return prefix + React.useId().replace(/[^a-zA-Z0-9]/g, '')
}

/* Seeded random, so a burst looks the same on a re-render. */
const rnd = seed => { let s = seed % 2147483647 || 7; return () => (s = s * 16807 % 2147483647) / 2147483647 }

function Shape({ kind, colour, size }) {
  if (kind === 0) return <span className="block rounded-full" style={{ width:size, height:size, background:colour }}/>
  if (kind === 1) return <span className="block rounded-[2px]" style={{ width:size, height:size * 0.6, background:colour }}/>
  return (
    <svg viewBox="0 0 10 10" width={size * 1.3} height={size * 1.3} aria-hidden focusable="false" className="block">
      <path d="M5 0l1.4 3.4L10 3.8 7.3 6.2 8.1 10 5 8 1.9 10l.8-3.8L0 3.8l3.6-.4z" fill={colour}/>
    </svg>
  )
}

/* A ring of shapes flying out from a point. `fire` changes to set it off;
   x and y are percent of the nearest positioned box. */
export function Burst({ fire, x = 50, y = 50, count = 12, spread = 70, colours = PARTY, size = 8 }) {
  const reduced = useReduced()
  const [live, setLive] = React.useState([])
  React.useEffect(() => {
    if (!fire || reduced) return
    const r = rnd(fire * 97 + count)
    const parts = Array.from({ length:count }, (_, i) => {
      const a = (i / count) * Math.PI * 2 + r() * 0.5
      const d = spread * (0.55 + r() * 0.6)
      return { i, dx:Math.cos(a) * d, dy:Math.sin(a) * d, c:colours[i % colours.length], k:i % 3,
               rot:(r() - 0.5) * 360, s:size * (0.7 + r() * 0.6) }
    })
    const key = fire
    setLive(l => [...l, { key, parts }])
    const t = setTimeout(() => setLive(l => l.filter(b => b.key !== key)), 900)
    return () => clearTimeout(t)
  }, [fire]) // eslint-disable-line react-hooks/exhaustive-deps
  if (reduced || !live.length) return null
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 z-20">
      {live.map(b => (
        <span key={b.key} className="absolute" style={{ left:x + '%', top:y + '%' }}>
          {b.parts.map(p => (
            <motion.span key={p.i} className="absolute" style={{ marginLeft:-p.s / 2, marginTop:-p.s / 2 }}
              initial={{ x:0, y:0, scale:0.4, opacity:1, rotate:0 }}
              animate={{ x:p.dx, y:p.dy, scale:[0.4, 1.15, 0], opacity:[1, 1, 0], rotate:p.rot }}
              transition={{ duration:0.75, ease:[0.16, 1, 0.3, 1] }}>
              <Shape kind={p.k} colour={p.c} size={p.s}/>
            </motion.span>
          ))}
        </span>
      ))}
    </span>
  )
}

/* Confetti that pops up from a point and falls. Put it in a box with
   overflow hidden so nothing widens the page. */
export function Confetti({ fire, x = 50, y = 30, count = 46 }) {
  const reduced = useReduced()
  const [live, setLive] = React.useState(null)
  React.useEffect(() => {
    if (!fire || reduced) return
    const r = rnd(fire * 131 + 3)
    setLive({ key:fire, parts: Array.from({ length:count }, (_, i) => ({
      i, c:PARTY[i % PARTY.length], k:i % 3, s:6 + r() * 6,
      dx:(r() - 0.5) * 420, up:-(70 + r() * 150), fall:240 + r() * 260,
      rot:(r() - 0.5) * 900, d:1.5 + r() * 0.9, delay:r() * 0.12,
    })) })
    const t = setTimeout(() => setLive(null), 2700)
    return () => clearTimeout(t)
  }, [fire]) // eslint-disable-line react-hooks/exhaustive-deps
  if (reduced || !live) return null
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      <span className="absolute" style={{ left:x + '%', top:y + '%' }}>
        {live.parts.map(p => (
          <motion.span key={live.key + '-' + p.i} className="absolute"
            initial={{ x:0, y:0, rotate:0, opacity:1, scale:0.6 }}
            animate={{ x:[0, p.dx * 0.7, p.dx], y:[0, p.up, p.fall], rotate:p.rot, opacity:[1, 1, 1, 0], scale:1 }}
            transition={{ duration:p.d, delay:p.delay, ease:'easeOut', times:[0, 0.3, 1] }}>
            <Shape kind={p.k} colour={p.c} size={p.s}/>
          </motion.span>
        ))}
      </span>
    </span>
  )
}

/* ── level emblems ─────────────────────────────────────────────────────

   Each level has its own shape and colour, and one small gem around the rim
   for every level reached, so the emblem itself shows growth. The darker
   stop sits under the number, which white clears 4.5 : 1 on. */

const EMBLEM = [
  { top:'#3ad69b', deep:'#0f5836', rim:'#bdf0d9' },   // 1 Starter
  { top:'#5db8f5', deep:'#0967ab', rim:'#cfe8fb' },   // 2 Explorer
  { top:'#3cc2d6', deep:'#11677f', rim:'#c6eef4' },   // 3 Regular
  { top:'#c26bff', deep:'#6f09b2', rim:'#ecd4ff' },   // 4 Skilled
  { top:'#ff9a4d', deep:'#b23009', rim:'#ffd9bf' },   // 5 Pro
  { top:'#ff6b9e', deep:'#b2095e', rim:'#ffd0e3' },   // 6 Expert
  { top:'#7b8cff', deep:'#2b2f9e', rim:'#d6dbff' },   // 7 Ace
  { top:'#8a3cff', deep:'#2a1060', rim:'#f5c542' },   // 8 Legend
]
export const emblemColours = level => EMBLEM[(Math.max(1, level) - 1) % EMBLEM.length]

const poly = (n, r, inner = null, rot = -Math.PI / 2) => {
  const pts = []
  const k = inner ? n * 2 : n
  for (let i = 0; i < k; i++) {
    const rr = inner && i % 2 ? inner : r
    const a = rot + (i / k) * Math.PI * 2
    pts.push(`${(50 + rr * Math.cos(a)).toFixed(2)} ${(50 + rr * Math.sin(a)).toFixed(2)}`)
  }
  return 'M' + pts.join('L') + 'Z'
}
const scallop = (n, r, bump) => {
  let d = ''
  for (let i = 0; i <= n * 8; i++) {
    const a = -Math.PI / 2 + (i / (n * 8)) * Math.PI * 2
    const rr = r + bump * Math.cos(a * n)
    d += (i ? 'L' : 'M') + (50 + rr * Math.cos(a)).toFixed(2) + ' ' + (50 + rr * Math.sin(a)).toFixed(2)
  }
  return d + 'Z'
}
const SHAPES = [
  'M50 6a44 44 0 1 1 0 88a44 44 0 1 1 0-88z',                                  // circle
  poly(6, 46, null, -Math.PI / 2),                                              // hexagon
  'M50 5l38 13v30c0 24-17 40-38 47C29 88 12 72 12 48V18z',                      // shield
  poly(8, 47, 39),                                                               // badge burst
  poly(10, 47, 40),                                                              // star seal
  scallop(9, 42, 5),                                                             // flower seal
  'M50 4l13 10 16 1 4 16 11 11-6 15 3 16-14 8-7 15-16-2-12 10-12-10-16 2-7-15-14-8 3-16-6-15 11-11 4-16 16-1z', // sun seal
  'M14 30l14 10 10-26 12 18 12-18 10 26 14-10-4 38c0 14-14 26-32 28C30 94 18 82 18 68z', // crown shield
]

export function LevelEmblem({ level = 1, size = 84, pct = null, glow = true, className, pulse = true }) {
  const reduced = useReduced()
  const id = useSvgId('em')
  const c = emblemColours(level)
  const shape = SHAPES[(Math.max(1, level) - 1) % SHAPES.length]
  const gems = Math.min(8, Math.max(1, level))
  const R = 49, C = 2 * Math.PI * R
  return (
    <div className={cn('relative grid shrink-0 place-items-center', className)} style={{ width:size, height:size }}>
      {glow && (
        <motion.span aria-hidden className="absolute inset-[-14%] rounded-full"
          style={{ background:`radial-gradient(circle, ${c.top}88 0%, ${c.top}00 68%)` }}
          animate={reduced || !pulse ? { opacity:0.8 } : { opacity:[0.55, 1, 0.55], scale:[0.94, 1.06, 0.94] }}
          transition={reduced || !pulse ? { duration:0 } : { duration:3.2, repeat:Infinity, ease:'easeInOut' }}/>
      )}
      <svg viewBox="-4 -4 108 108" aria-hidden focusable="false" className="relative size-full overflow-visible">
        <defs>
          <linearGradient id={id + 'f'} x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0" stopColor={c.top}/><stop offset="0.62" stopColor={c.deep}/>
          </linearGradient>
          <radialGradient id={id + 'h'} cx="0.35" cy="0.22" r="0.6">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.55"/><stop offset="1" stopColor="#ffffff" stopOpacity="0"/>
          </radialGradient>
        </defs>
        {pct != null && (
          <>
            <circle cx="50" cy="50" r={R} fill="none" stroke="#ffffff" strokeOpacity="0.85" strokeWidth="5"/>
            <circle cx="50" cy="50" r={R} fill="none" strokeWidth="5" strokeLinecap="round" stroke={c.top}
              transform="rotate(-90 50 50)" strokeDasharray={C}
              style={{ strokeDashoffset: C * (1 - Math.max(0.02, Math.min(1, pct))),
}}/>
          </>
        )}
        <g transform="translate(50 50) scale(0.82) translate(-50 -50)">
          <path d={shape} fill={c.rim} transform="translate(50 52) scale(1.06) translate(-50 -50)" opacity="0.9"/>
          <path d={shape} fill={`url(#${id}f)`}/>
          <path d={shape} fill={`url(#${id}h)`}/>
          <path d={shape} fill="none" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.6"/>
        </g>
        {Array.from({ length:gems }, (_, i) => {
          const a = Math.PI / 2 + (i - (gems - 1) / 2) * 0.27
          return <circle key={i} cx={50 + 31 * Math.cos(a)} cy={50 + 31 * Math.sin(a)} r="3.2"
            fill={c.rim} stroke="#ffffff" strokeWidth="1.2"/>
        })}
      </svg>
      {glow && !reduced && pulse && [[-0.06, 0.12, 0], [0.92, 0.2, 0.9], [0.84, 0.86, 1.7]].map(([x, y, d], i) => (
        <motion.svg key={i} viewBox="0 0 10 10" aria-hidden focusable="false" className="absolute"
          style={{ left:`${x * 100}%`, top:`${y * 100}%`, width:size * 0.16, height:size * 0.16 }}
          animate={{ scale:[0, 1, 0], rotate:[0, 90], opacity:[0, 1, 0] }}
          transition={{ duration:1.6, delay:d, repeat:Infinity, repeatDelay:1.2, ease:'easeInOut' }}>
          <path d="M5 0C5.6 3.6 6.4 4.4 10 5 6.4 5.6 5.6 6.4 5 10 4.4 6.4 3.6 5.6 0 5 3.6 4.4 4.4 3.6 5 0z" fill={c.top}/>
        </motion.svg>
      ))}
      {/* The number sits on its own solid disc in the level's deep colour, so
          white clears 4.5 : 1 on a real background rather than relying on a
          text shadow over the light top of the gradient. */}
      <span className="absolute inset-0 grid place-items-center pb-[4%]">
        <span className="grid place-items-center rounded-full font-display font-bold tabular-nums leading-none text-white"
          style={{ width:size * 0.46, height:size * 0.46, fontSize:size * 0.28, backgroundColor:c.deep,
                   boxShadow:`0 0 0 ${Math.max(1.5, size * 0.03)}px rgba(255,255,255,.7)` }}>{level}</span>
      </span>
    </div>
  )
}

/* ── the XP bar ─────────────────────────────────────────────────────── */

/* Tween a running total from `from` to `to`, stopping briefly at each level
   boundary so the bar fills right up before it starts again. Calls onLevel
   with the new level as each boundary is crossed. */
export function useTotalTween(from, to, { delay = 0, onLevel, run = true } = {}) {
  const reduced = useReduced()
  const [v, setV] = React.useState(reduced ? to : from)
  const cb = React.useRef(onLevel); cb.current = onLevel
  React.useEffect(() => {
    if (!run) { setV(reduced ? to : from); return }
    if (reduced || to <= from) {
      setV(to)
      if (reduced) for (let l = levelFor(from).level + 1; l <= levelFor(to).level; l++) cb.current?.(l)
      return
    }
    let stop = false, ctl = null, t = null
    const legs = []
    let at = from
    while (at < to) {
      const next = levelStart(levelFor(at).level + 1)
      const end = Math.min(next, to)
      legs.push([at, end, end === next])
      at = end
    }
    const go = i => {
      if (stop || i >= legs.length) return
      const [a, b, crosses] = legs[i]
      ctl = animate(a, b, { duration: Math.min(1.1, 0.35 + (b - a) / 120), ease:[0.22, 1, 0.36, 1],
        onUpdate: x => setV(x),
        onComplete: () => {
          if (stop) return
          if (crosses) { cb.current?.(levelFor(b).level); t = setTimeout(() => go(i + 1), 900) }
          else go(i + 1)
        } })
    }
    setV(from)
    t = setTimeout(() => go(0), delay)
    return () => { stop = true; clearTimeout(t); ctl?.stop() }
  }, [from, to, run, reduced]) // eslint-disable-line react-hooks/exhaustive-deps
  return v
}

/* A thick bar with a gradient fill, a moving shine and a glowing tip.
   `total` may be fractional mid tween. `gain` changing sets off sparks at
   the tip. The fill moves with translateX inside a clipped track. */
export function XPBar({ total = 0, gain = 0, className, tall = false, label }) {
  const reduced = useReduced()
  const L = levelFor(total)
  const pct = Math.max(0, Math.min(1, (total - levelStart(L.level)) / L.need))
  const c = emblemColours(L.level)
  return (
    <div className={cn('relative', className)}>
      <div role="progressbar" aria-label={label || `Points to level ${L.level + 1}`}
        aria-valuemin={0} aria-valuemax={L.need} aria-valuenow={Math.floor(L.into)}
        className={cn('relative overflow-hidden rounded-full bg-white/90 shadow-[inset_0_1px_3px_rgba(13,43,30,0.18)]',
          tall ? 'h-5' : 'h-4')}>
        <div className="absolute inset-0" style={{ transform:`translateX(${(pct - 1) * 100}%)` }}>
          <div className="absolute inset-0 rounded-full"
            style={{ background:`linear-gradient(90deg, ${c.deep} 0%, ${c.top} 85%, ${c.rim} 100%)` }}/>
          {!reduced && <span className="g-sheen absolute inset-y-0 w-1/3"/>}
        </div>
        {[0.25, 0.5, 0.75].map(t => (
          <span key={t} aria-hidden className="absolute inset-y-[3px] w-[2px] rounded-full bg-[#0d2b1e]/15"
            style={{ left:`${t * 100}%` }}/>
        ))}
      </div>
      {/* the glowing tip and its sparks ride a full width layer */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 right-0"
        style={{ transform:`translateX(${pct * 100}%)` }}>
        <span className="absolute top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background:`radial-gradient(circle, #ffffffee 0%, ${c.top}99 35%, ${c.top}00 70%)`,
                   opacity: pct > 0.02 ? 1 : 0 }}/>
        <span className="absolute left-0 top-1/2 size-0">
          <Burst fire={gain} x={0} y={0} count={10} spread={34} size={6}/>
        </span>
      </div>
    </div>
  )
}

/* "45 points to Explorer" with the number big and rolling. */
export function ToNext({ total, className }) {
  const L = levelFor(total)
  const left = Math.max(0, Math.ceil(levelStart(L.level + 1) - total))
  return (
    <p className={cn('flex items-baseline gap-1.5 text-ink-2', className)}>
      <span className="font-display text-row font-bold tabular-nums text-ink">{left}</span>
      <span className="text-fine font-semibold">points to {levelName(L.level + 1)}</span>
    </p>
  )
}

/* The banner that drops in on a level up. */
export function LevelUpBanner({ level, show, className }) {
  const c = emblemColours(level)
  return (
    <AnimatePresence>
      {show && (
        <motion.div role="status" initial={{ opacity:0, y:-24, scale:0.9 }} animate={{ opacity:1, y:0, scale:1 }}
          exit={{ opacity:0, y:-12, scale:0.96 }} transition={SPRING}
          className={cn('relative z-20 flex items-center gap-3 overflow-hidden rounded-[16px] p-3 text-white shadow-raise', className)}
          style={{ background:`linear-gradient(110deg, ${c.deep} 0%, ${c.deep} 45%, ${c.top} 130%)` }}>
          <LevelEmblem level={level} size={52} glow={false}/>
          <span className="min-w-0">
            <span className="block font-display text-fine font-bold uppercase tracking-[0.08em] text-white">Level up</span>
            <span className="block font-display text-row font-bold leading-tight text-white">Level {level}: {levelName(level)}</span>
          </span>
          <span aria-hidden className="g-sheen absolute inset-y-0 w-1/4"/>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ── stars for a round ─────────────────────────────────────────────── */

export const TIER = ['', 'Bronze', 'Silver', 'Gold']

function Star({ on, i, size, reduced, onLand }) {
  const id = useSvgId('st')
  return (
    <motion.span className="relative inline-grid place-items-center"
      initial={reduced ? false : { scale:0, rotate:-40, opacity:0 }}
      animate={{ scale:1, rotate:0, opacity:1 }}
      transition={reduced ? { duration:0 } : { ...SPRING, delay:0.35 + i * 0.22 }}
      onAnimationComplete={() => on && onLand?.(i)}
      style={{ width:size, height:size, marginTop: i === 1 ? 0 : size * 0.18 }}>
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden focusable="false">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={on ? '#ffd76a' : '#e3ede7'}/><stop offset="1" stopColor={on ? '#e59a12' : '#c2d7ca'}/>
          </linearGradient>
        </defs>
        <path d="M12 1.8l3.1 6.4 7 1-5.1 4.9 1.2 7-6.2-3.3-6.2 3.3 1.2-7L1.9 9.2l7-1z"
          fill={`url(#${id})`} stroke={on ? '#a86a00' : '#9fbcae'} strokeWidth="1.1" strokeLinejoin="round"/>
        {on && <path d="M8.5 8.8l2-.3" stroke="#fff6d6" strokeWidth="1.4" strokeLinecap="round"/>}
      </svg>
    </motion.span>
  )
}

export function Stars({ n = 0, size = 44, className }) {
  const reduced = useReduced()
  const [fire, setFire] = React.useState(0)
  const [at, setAt] = React.useState(50)
  return (
    <div className={cn('relative flex items-start justify-center gap-1.5', className)}
      role="img" aria-label={n ? `${n} of 3 stars, ${TIER[n]}` : 'No stars this time'}>
      {[0, 1, 2].map(i => (
        <Star key={i} i={i} on={i < n} size={i === 1 ? size * 1.2 : size} reduced={reduced}
          onLand={k => { setAt(20 + k * 30); setFire(f => f + 1) }}/>
      ))}
      <Burst fire={fire} x={at} y={45} count={9} spread={44} size={6}/>
    </div>
  )
}

/* A number that rolls up, with one bump at the end. */
export function CountUp({ to = 0, delay = 0, duration = 0.9, className }) {
  const reduced = useReduced()
  const [n, setN] = React.useState(reduced ? to : 0)
  const [done, setDone] = React.useState(reduced)
  React.useEffect(() => {
    if (reduced) { setN(to); setDone(true); return }
    setDone(false)
    let ctl = null
    const t = setTimeout(() => {
      ctl = animate(0, to, { duration, ease:[0.16, 1, 0.3, 1], onUpdate:v => setN(Math.round(v)),
                             onComplete:() => setDone(true) })
    }, delay * 1000)
    return () => { clearTimeout(t); ctl?.stop() }
  }, [to, reduced]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <motion.span className={cn('inline-block tabular-nums', className)}
      animate={done && !reduced ? { scale:[1, 1.18, 1] } : { scale:1 }} transition={{ duration:0.35 }}>
      {n}
    </motion.span>
  )
}
