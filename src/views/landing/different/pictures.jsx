import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { PatchFront } from '../../../charts/patch-front'
import { SENSORS, SENSOR_ORDER } from '../../../lib/sensors'
import { FAMILY } from '../../../lib/roster'
import { LampFace } from '../../../traffic/Face'
import { HEADLINE } from '../../../signals/light.js'
import { demoDay, settleTimes } from '../../../signals/recovery'
import { AvatarArt } from '../../../account/avatars'
import { DEMO_LINKS, DEMO_TEEN } from '../../../account/demo-network'
import { AUDIENCES } from '../../../ai/framework'
import { FINISH_POINTS, LEVEL_NAMES, unlocksAt } from '../../../toolkit/game/progress'
import { NOTES, PRO, SCORE } from '../../../lib/terms'
import { cn } from '../../../lib/utils'

/* One purpose-built picture per point in "What makes MindMap different".
 * Each shows its point in a different form: a network diagram, a choice of
 * two sensors, a phone notification, a linked trio, a shaded curve, a bar
 * run-up, a chat, a level badge. Figures are the app's own demo data
 * (lib/roster.js, signals/recovery.js, account/demo-network.js,
 * toolkit/game/progress.js), so a change there shows here.
 *
 * Every picture fills the pane Different.jsx gives it, is one role="img" with
 * a label that says what it shows, and hides its drawing from screen readers.
 * Motion is small, loops slowly, uses transform and opacity only, and is
 * dropped for prefers-reduced-motion, leaving the finished frame. */

const MAYA = FAMILY.find(t => t.id === 'maya') || FAMILY[0]
const TODAY = MAYA.days[MAYA.days.length - 1]
const PARENT = DEMO_LINKS.find(l => l.person.role === 'parent').person
const DOC = DEMO_LINKS.find(l => l.person.role === 'pro' && l.status === 'active').person

const DAY = demoDay()
const SETTLE = settleTimes(DAY.index, DAY.band).find(t => t.settled && t.peak > DAY.band.hi + 10)
const TEST = DAY.events.find(e => e.kind === 'test') || DAY.events[0]

const clock = m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`

function Pic({ label, className, children }) {
  return (
    <div role="img" aria-label={label} className="absolute inset-0">
      <div aria-hidden className={cn('absolute inset-0', className)}>{children}</div>
    </div>
  )
}

/* A slow loop that rests on its last frame when motion is reduced. */
function useLoop() {
  return !useReducedMotion()
}

/* ── Mind Score: four signals through our own network into one dial ───── */

const IN_Y = [28, 62, 96, 130]
const H1 = [20, 50, 80, 110, 140]
const H2 = [50, 80, 110]
const X_IN = 82, X_H1 = 148, X_H2 = 212
const DIAL = { cx: 302, cy: 104, r: 42 }
const OUT = { x: DIAL.cx - DIAL.r - 8, y: DIAL.cy - 6 }

/* A short trace per signal, drawn in its own colour: a beat, a slow rise, a
   gentle drift, a jitter. */
const WAVE = {
  heart: 'M6 0h12l4-9 5 17 4-8h9l4-9 5 17 4-8h9',
  sweat: 'M6 4c8 0 10-6 18-6s10 4 18 0 10-6 20-6',
  temp:  'M6 0c10-6 16-6 24 0s14 6 22 0 10-4 10-4',
  move:  'M6 0l5-6 4 9 5-11 5 12 4-7 5 5 5-8 5 9 5-5 5 2',
}

function ScorePic() {
  const loop = useLoop()
  const v = TODAY.score
  const C = Math.PI * DIAL.r
  const arc = `M${DIAL.cx - DIAL.r} ${DIAL.cy}a${DIAL.r} ${DIAL.r} 0 0 1 ${DIAL.r * 2} 0`
  const rows = SENSOR_ORDER.map(id => SENSORS[id])
  return (
    <Pic label={`Demo: the four patch signals, ${rows.map(r => r.name.toLowerCase()).join(', ')}, run through MindMap's own neural network into one dial: a ${SCORE} of ${v} out of 100 today.`}>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-2">
      <svg viewBox="0 0 360 160" preserveAspectRatio="xMidYMid meet" className="block min-h-0 w-full max-w-[620px] shrink"
        style={{ aspectRatio: '360 / 160' }}>
        <g stroke="#0d2b1e" strokeOpacity="0.16" strokeWidth="1">
          {IN_Y.map(a => H1.map(b => <line key={`a${a}${b}`} x1={X_IN} y1={a} x2={X_H1} y2={b}/>))}
          {H1.map(a => H2.map(b => <line key={`b${a}${b}`} x1={X_H1} y1={a} x2={X_H2} y2={b}/>))}
          {H2.map(a => <line key={`c${a}`} x1={X_H2} y1={a} x2={OUT.x} y2={OUT.y}/>)}
        </g>
        {rows.map((r, i) => (
          <g key={r.id}>
            <path d={WAVE[r.id]} transform={`translate(4 ${IN_Y[i]})`} fill="none" stroke={r.glow}
              strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx={X_IN} cy={IN_Y[i]} r="6" fill={r.glow}/>
          </g>
        ))}
        {H1.map((y, i) => (
          <motion.circle key={y} cx={X_H1} cy={y} r="7" fill="#ffffff" stroke="#157446" strokeWidth="2"
            animate={loop ? { opacity: [1, 0.45, 1] } : undefined}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}/>
        ))}
        {H2.map((y, i) => (
          <motion.circle key={y} cx={X_H2} cy={y} r="7" fill="#157446"
            animate={loop ? { opacity: [1, 0.55, 1] } : undefined}
            transition={{ duration: 2.4, repeat: Infinity, delay: 0.8 + i * 0.3, ease: 'easeInOut' }}/>
        ))}
        {loop && rows.map((r, i) => (
          <motion.circle key={`p${r.id}`} cx={X_IN} cy={IN_Y[i]} r="3.5" fill={r.glow}
            initial={{ opacity: 0 }}
            animate={{ x: [0, X_H1 - X_IN], y: [0, H1[i + 1] - IN_Y[i]], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.3, repeat: Infinity, repeatDelay: 1.6, delay: i * 0.25, ease: 'easeInOut' }}/>
        ))}
        {loop && H2.map((y, i) => (
          <motion.circle key={`q${y}`} cx={X_H2} cy={y} r="3.5" fill="#157446"
            initial={{ opacity: 0 }}
            animate={{ x: [0, OUT.x - X_H2], y: [0, OUT.y - y], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 1.9, delay: 1.6 + i * 0.15, ease: 'easeInOut' }}/>
        ))}
        <path d={arc} fill="none" stroke="#ffffff" strokeWidth="11" strokeLinecap="round"/>
        <path d={arc} fill="none" stroke="#157446" strokeWidth="11" strokeLinecap="round"
          strokeDasharray={`${(C * v) / 100} ${C}`}/>
        <text x={DIAL.cx} y={DIAL.cy - 4} textAnchor="middle" className="font-display" fontWeight="700"
          fontSize="30" fill="#0d2b1e">{v}</text>
      </svg>
      <ul className="m-0 hidden list-none flex-wrap justify-center gap-x-4 gap-y-1 p-0 xl:flex">
        {rows.map(r => (
          <li key={r.id} className="flex items-center gap-1.5 text-fine leading-tight text-ink-2">
            <span className="size-2 rounded-full" style={{ background: r.glow }}/>{r.name}
          </li>
        ))}
      </ul>
      </div>
    </Pic>
  )
}

/* ── Network: teen in the middle, a switch on each link ──────────────── */

function Toggle({ animate }) {
  const loop = useLoop() && animate
  const t = { duration: 4, repeat: Infinity, times: [0, 0.4, 0.5, 0.9, 1], ease: 'easeInOut' }
  return (
    <span className="relative block h-4 w-7 overflow-hidden rounded-chip bg-ruling ring-2 ring-coral-wash sm:h-5 sm:w-9">
      <motion.span className="absolute inset-0 bg-accent"
        animate={loop ? { opacity: [1, 1, 0, 0, 1] } : undefined} transition={t}/>
      <motion.span className="absolute left-[3px] top-[3px] size-[10px] rounded-full bg-card sm:size-[14px]"
        style={{ x: '115%' }}
        animate={loop ? { x: ['115%', '115%', '0%', '0%', '115%'] } : undefined} transition={t}/>
    </span>
  )
}

function Person({ avatar, name, role, big }) {
  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <span className="flex h-12 items-center sm:h-14">
        <AvatarArt id={avatar} className={big ? 'size-12 sm:size-14' : 'size-9 sm:size-11'}/>
      </span>
      <p className="m-0 mt-1 font-display text-fine font-bold leading-tight text-ink">{name}</p>
      <p className="m-0 text-fine leading-tight text-ink-2">{role}</p>
    </div>
  )
}

function NetworkPic() {
  return (
    <Pic label={`Demo: ${DEMO_TEEN.name}, a teen, linked to her parent ${PARENT.name} and to ${DOC.name}, a ${PRO}. A switch on each link is ${DEMO_TEEN.name}'s, and her ${NOTES} are never shared.`}>
      <div className="absolute inset-x-2 top-1/2 mx-auto max-w-[340px] -translate-y-1/2">
        <div className="relative grid grid-cols-3 items-start">
          <span className="absolute left-[16.7%] right-[16.7%] top-6 border-t-2 border-coral sm:top-7"/>
          <span className="absolute left-[33.3%] top-6 sm:top-7 -translate-x-1/2 -translate-y-1/2"><Toggle/></span>
          <span className="absolute left-[66.7%] top-6 sm:top-7 -translate-x-1/2 -translate-y-1/2"><Toggle animate/></span>
          <Person avatar={PARENT.avatar} name={PARENT.name} role="Parent"/>
          <Person avatar={DEMO_TEEN.avatar} name={DEMO_TEEN.name} role="Teen" big/>
          <Person avatar={DOC.avatar} name={DOC.name} role={PRO}/>
        </div>
        <p className="m-0 mt-2 flex items-center justify-center gap-1.5 text-fine leading-tight text-coral-ink">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>
          </svg>
          {NOTES} are never shared
        </p>
      </div>
    </Pic>
  )
}

/* ── Patch, or the phone camera ──────────────────────────────────────── */

function PatchPic() {
  const loop = useLoop()
  const heart = SENSORS.heart.glow
  return (
    <Pic label="Demo: the MindMap patch, or a phone whose camera reads pulse when there is no patch.">
      <div className="absolute inset-0 grid grid-cols-[1fr_auto_1fr] items-center px-3">
        <figure className="m-0 flex flex-col items-center">
          <PatchFront className="w-[54px]"/>
          <figcaption className="mt-1.5 text-fine font-semibold leading-tight text-ink">Patch</figcaption>
        </figure>
        <span className="font-display text-ui font-bold text-beam-ink">or</span>
        <figure className="m-0 flex flex-col items-center">
          <span className="relative block h-[84px] w-[46px] rounded-[11px] border-[3px] border-ink bg-card">
            <span className="absolute left-1/2 top-1.5 size-[7px] -translate-x-1/2 rounded-full bg-ink"/>
            {loop && (
              <motion.span className="absolute left-1/2 top-1.5 -ml-[3.5px] size-[7px] rounded-full"
                style={{ boxShadow: `0 0 0 2px ${heart}` }}
                animate={{ scale: [1, 2.6], opacity: [0.9, 0] }}
                transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 0.3, ease: 'easeOut' }}/>
            )}
            <svg viewBox="0 0 40 24" className="absolute inset-x-1 top-[34px] w-[calc(100%-8px)]">
              <path d="M1 14h9l3-8 4 14 3-9 3 3h16" fill="none" stroke={heart} strokeWidth="2.4"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <figcaption className="mt-1.5 text-fine font-semibold leading-tight text-ink">Phone camera</figcaption>
        </figure>
      </div>
    </Pic>
  )
}

/* ── Heads Up: the notification lands on a parent's phone ────────────── */

function HeadsUpPic() {
  const loop = useLoop()
  return (
    <Pic label={`Demo: a Heads Up notification lands on a parent's phone with a yellow light: ${HEADLINE.yellow}`}>
      <div className="absolute bottom-0 left-1/2 h-[118px] w-[min(210px,84%)] -translate-x-1/2 rounded-t-[26px] border-[3px] border-b-0 border-ink-3 bg-ink-2">
        <span className="absolute left-1/2 top-2 h-[5px] w-12 -translate-x-1/2 rounded-bar bg-ink"/>
        <motion.div className="absolute inset-x-2 top-6 rounded-[12px] bg-card px-2.5 py-2"
          animate={loop ? { y: [-18, 0, 0, -18], opacity: [0, 1, 1, 0] } : undefined}
          transition={{ duration: 6, repeat: Infinity, times: [0, 0.08, 0.88, 1], ease: 'easeOut' }}>
          <p className="m-0 flex items-center justify-between text-fine leading-none text-ink-2">
            <span className="font-semibold">Heads Up</span><span>now</span>
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <LampFace light="yellow" size={24}/>
            <p className="m-0 font-display text-fine font-bold leading-tight text-ink">{HEADLINE.yellow}</p>
          </div>
        </motion.div>
      </div>
    </Pic>
  )
}

/* ── Recovery: a peak, and the drop back shaded ──────────────────────── */

function RecoveryPic() {
  const from = SETTLE.peakAt - 30, to = SETTLE.peakAt + DAY.usualSettle + 16
  const lo = DAY.band.lo - 2, hi = SETTLE.peak + 3, W = 100, H = 100
  const x = m => ((m - from) / (to - from)) * W
  const y = v => H - ((v - lo) / (hi - lo)) * H
  let line = ''
  for (let m = from; m <= to; m += 2) line += `${m === from ? 'M' : 'L'}${x(m).toFixed(2)} ${y(DAY.index[m]).toFixed(2)}`
  const end = SETTLE.peakAt + SETTLE.minutes
  let drop = `M${x(SETTLE.peakAt).toFixed(2)} ${y(DAY.band.hi).toFixed(2)}`
  for (let m = SETTLE.peakAt; m <= end; m++) drop += `L${x(m).toFixed(2)} ${y(Math.max(DAY.band.hi, DAY.index[m])).toFixed(2)}`
  drop += `L${x(end).toFixed(2)} ${y(DAY.band.hi).toFixed(2)}Z`
  const at = m => `calc(12px + (100% - 24px) * ${x(m) / W})`
  const span = n => `calc((100% - 24px) * ${n / (to - from)})`
  return (
    <Pic label={`Demo: a line rises to a peak and drops back into the usual range. The drop is shaded: settled in ${SETTLE.minutes} minutes, against a usual ${DAY.usualSettle}.`}>
      <div className="absolute top-2.5 h-5" style={{ left: at(SETTLE.peakAt), width: span(SETTLE.minutes) }}>
        <span className="absolute inset-x-0 bottom-0 h-2 rounded-t-[3px] border-x-2 border-t-2 border-lilac-ink"/>
        <span className="absolute bottom-2.5 left-0 whitespace-nowrap font-display text-fine font-bold leading-none text-lilac-ink">{SETTLE.minutes} min</span>
      </div>
      <div className="absolute bottom-2.5 h-5" style={{ left: at(SETTLE.peakAt), width: span(DAY.usualSettle) }}>
        <span className="absolute inset-x-0 top-0 h-2 rounded-b-[3px] border-x-2 border-b-2 border-dashed border-ink-3"/>
        <span className="absolute left-full top-1 ml-1.5 whitespace-nowrap text-fine leading-none text-ink-2">usual {DAY.usualSettle}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
        className="absolute inset-x-3 bottom-8 top-9 h-[calc(100%-68px)] w-[calc(100%-24px)] overflow-visible">
        <rect x="0" y={y(DAY.band.hi)} width={W} height={y(DAY.band.lo) - y(DAY.band.hi)} fill="#ffffff"/>
        <path d={drop} fill="#a024f2" opacity="0.28"/>
        <path d={line} fill="none" stroke="#6f09b2" strokeWidth="2.5" strokeLinecap="round"
          strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
      </svg>
    </Pic>
  )
}

/* ── Stress before events: the climb, in 20-minute steps, to a marked test ─ */

const STEP = 15
const RUN = Array.from({ length: 6 }, (_, i) => {
  const a = TEST.minute - 6 * STEP + i * STEP
  let s = 0
  for (let m = a; m < a + STEP; m++) s += DAY.index[m] - DAY.usual[m]
  return s / STEP
})
const RUN_MAX = Math.max(1, ...RUN)

function EventsPic() {
  const loop = useLoop()
  return (
    <Pic label={`Demo: six bars, one for each 15 minutes in the hour and a half before a ${TEST.label.toLowerCase()} at ${clock(TEST.minute)} marked in the calendar, climbing higher above the usual line as the test gets closer.`}>
      <div className="absolute right-3 top-2.5 flex items-center gap-2 rounded-[8px] bg-sun-wash py-1 pl-1 pr-2">
        <span className="overflow-hidden rounded-[5px] bg-card leading-none">
          <span className="block h-1.5 bg-sun"/>
          <span className="block px-1.5 pb-1 pt-0.5 font-display text-fine font-bold text-ink">{clock(TEST.minute)}</span>
        </span>
        <span className="font-display text-fine font-bold leading-tight text-ink">{TEST.label}</span>
      </div>
      <div className="absolute inset-x-3 bottom-7 top-[58px] flex items-end gap-1.5">
        {RUN.map((v, i) => (
          <motion.span key={i} className="block flex-1 origin-bottom rounded-t-[5px] bg-sun"
            style={{ height: `${Math.max(5, (v / RUN_MAX) * 100)}%` }}
            initial={loop ? { scaleY: 0.15 } : false}
            animate={loop ? { scaleY: [0.15, 1, 1, 0.15] } : undefined}
            transition={{ duration: 5, times: [0, 0.2, 0.9, 1], repeat: Infinity, delay: i * 0.08, ease: 'easeOut' }}/>
        ))}
      </div>
      <span className="absolute inset-x-3 bottom-7 border-t-2 border-dashed border-ink-3"/>
      <p className="absolute inset-x-3 bottom-1.5 m-0 flex justify-between text-fine leading-tight text-ink-2">
        <span>Usual</span><span>Test</span>
      </p>
    </Pic>
  )
}

/* ── MindMap AI: a question, a pause, a reply ────────────────────────── */

const ASK = AUDIENCES.student.starters[0]

function AiPic() {
  const loop = useLoop()
  const [replied, setReplied] = React.useState(true)
  React.useEffect(() => {
    if (!loop) { setReplied(true); return }
    let t
    const cycle = on => { setReplied(on); t = setTimeout(() => cycle(!on), on ? 5200 : 1500) }
    cycle(false)
    return () => clearTimeout(t)
  }, [loop])
  return (
    <Pic label={`Demo: a teen asks MindMap AI "${ASK}" and gets a short, practical reply.`}>
      <div className="absolute inset-x-3 top-3 flex flex-col gap-2">
        <p className="m-0 ml-auto max-w-[86%] rounded-[14px] rounded-br-[4px] bg-accent-lit px-3 py-1.5 text-fine leading-snug text-ink">
          {ASK}</p>
        <div className="relative">
          <motion.p className="m-0 max-w-[92%] rounded-[14px] rounded-bl-[4px] bg-card px-3 py-1.5 text-fine leading-snug text-ink"
            animate={{ opacity: replied ? 1 : 0, y: replied ? 0 : 6 }} transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}>
            That sounds tiring. When does your phone go away at night?</motion.p>
          <motion.span className="absolute left-0 top-0 flex gap-1 rounded-[14px] rounded-bl-[4px] bg-ink-2 px-3 py-2.5"
            animate={{ opacity: replied ? 0 : 1 }} transition={{ duration: 0.2 }}>
            {[0, 1, 2].map(i => (
              <motion.span key={i} className="size-1.5 rounded-full bg-mist"
                animate={loop && !replied ? { opacity: [0.3, 1, 0.3] } : undefined}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}/>
            ))}
          </motion.span>
        </div>
      </div>
    </Pic>
  )
}

/* ── Toolkit: points fill a level, and the next level opens new things ─ */

const LEVEL = 3
const OPENS = unlocksAt(LEVEL)

function ToolkitPic() {
  const loop = useLoop()
  return (
    <Pic label={`Demo: a level ${LEVEL} badge, ${LEVEL_NAMES[LEVEL - 1]}. Finishing an exercise adds ${FINISH_POINTS} points to the bar, and the level opens ${OPENS.map(o => `the ${o.name} ${o.kind === 'theme' ? 'colour' : 'ring'}`).join(' and ')}.`}>
      <div className="absolute inset-0 flex items-center gap-3.5 px-3">
        <div className="relative shrink-0">
          <svg viewBox="0 0 64 72" width="66" height="74">
            <path d="M32 2l28 16v36L32 70 4 54V18z" fill="#18a370"/>
            <path d="M32 12l20 11.5v25L32 60 12 48.5v-25z" fill="#ffffff"/>
            <text x="32" y="45" textAnchor="middle" className="font-display" fontWeight="700" fontSize="24" fill="#067049">{LEVEL}</text>
          </svg>
          {loop && (
            <motion.span className="absolute -right-2 -top-1 font-display text-fine font-bold text-mint-ink"
              animate={{ y: [6, -10], opacity: [0, 1, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.4, ease: 'easeOut' }}>
              +{FINISH_POINTS}
            </motion.span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-fine leading-tight text-ink-2">Level {LEVEL}</p>
          <p className="m-0 font-display text-ui font-bold leading-tight text-ink">{LEVEL_NAMES[LEVEL - 1]}</p>
          <div className="relative mt-2 h-2.5 overflow-hidden rounded-bar bg-card">
            <motion.span className="absolute inset-0 origin-left rounded-bar bg-mint"
              style={{ scaleX: 0.62 }}
              animate={loop ? { scaleX: [0.38, 0.38, 0.62, 0.62] } : undefined}
              transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.35, 0.55, 1], ease: 'easeOut' }}/>
          </div>
          <ul className="m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0">
            {OPENS.map(o => (
              <li key={o.id} className="flex items-center gap-1.5 text-fine leading-tight text-ink-2">
                {o.kind === 'theme'
                  ? <span className="size-3 rounded-full" style={{ background: o.main }}/>
                  : <span className="size-3 rounded-full border-2 border-dotted border-mint-ink"/>}
                {o.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Pic>
  )
}

/* Keyed by the point id in Different.jsx. */
export const PICTURES = {
  score: ScorePic,
  network: NetworkPic,
  patch: PatchPic,
  heads: HeadsUpPic,
  settle: RecoveryPic,
  event: EventsPic,
  ai: AiPic,
  toolkit: ToolkitPic,
}
