import React from 'react'
import { motion } from 'framer-motion'
import { RainbowDial } from '../../../charts/rainbow'
import { PatchFront } from '../../../charts/patch-front'
import { SENSORS } from '../../../lib/sensors'
import { studentRings } from '../../../lib/readings'
import { FAMILY } from '../../../lib/roster'
import { LampFace } from '../../../traffic/Face'
import { HEADLINE } from '../../../signals/light.js'
import { demoDay, settleTimes } from '../../../signals/recovery'
import { AvatarArt } from '../../../account/avatars'
import { DEMO_LINKS, DEMO_TEEN } from '../../../account/demo-network'
import { AUDIENCES } from '../../../ai/framework'
import { FINISH_POINTS, LEVEL_NAMES, unlocksAt } from '../../../toolkit/game/progress'
import { LevelEmblem, emblemColours } from '../../../toolkit/game/fx'
import { NOTES, PRO, PRO_WRAP, SCORE } from '../../../lib/terms'
import { cn } from '../../../lib/utils'

/* One picture per card in "What makes MindMap different", each drawn from
 * the app's own parts and demo data: the rainbow dial, the network avatars,
 * the patch, a Heads Up notification with its lamp face, the recovery curve,
 * the run-up to a test, a MindMap AI chat, the Toolkit level emblem. Owner,
 * 20 October: "revert the images to actual stuff from site, dont use the 3d
 * images or topography here, bc these are user features".
 *
 * Each picture is one role="img" with a label and fills the pane the card
 * gives it. `play` is true only for the card in front while the band is on
 * screen (never under reduced motion): the picture then plays its one short
 * motion once and rests on the finished frame, which is also what every
 * other card shows. */

const EASE = [0.23, 1, 0.32, 1]

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

/* Counts up each time `play` turns on, to restart a motion by key. */
function useTake(play) {
  const [n, setN] = React.useState(0)
  React.useEffect(() => { if (play) setN(v => v + 1) }, [play])
  return n
}

/* ── Mind Score: the app's rainbow dial ─────────────────────────────── */

const RINGS = studentRings()

function ScorePic({ play }) {
  const take = useTake(play)
  return (
    <Pic label={`Demo: the ${SCORE} dial at ${TODAY.score} out of 100, its four bands for pulse, sweat, temperature and movement.`}
      className="flex items-center justify-center px-3 pt-3">
      {/* A new key on each take: the dial's bands and figure spring up from 0. */}
      <RainbowDial key={take} score={TODAY.score} usual={MAYA.usual?.base} rings={RINGS} size={212} compact/>
    </Pic>
  )
}

/* ── Network: teen in the middle, a switch on each link ──────────────── */

function Toggle({ play, flip }) {
  const run = play && flip
  const t = { duration: 2.4, times: [0, 0.25, 0.35, 0.75, 0.85], ease: 'easeInOut', delay: 0.5 }
  return (
    <span className="relative block h-[18px] w-8 overflow-hidden rounded-chip bg-ruling ring-2 ring-coral-wash">
      <motion.span className="absolute inset-0 bg-accent" initial={false}
        animate={run ? { opacity: [1, 1, 0, 0, 1] } : { opacity: 1 }} transition={t}/>
      <motion.span className="absolute left-[3px] top-[3px] size-3 rounded-full bg-card" initial={false}
        style={{ x: '115%' }}
        animate={run ? { x: ['115%', '115%', '0%', '0%', '115%'] } : { x: '115%' }} transition={t}/>
    </span>
  )
}

function Person({ avatar, name, role, big }) {
  return (
    <div className="relative z-[1] flex min-w-0 flex-col items-center text-center">
      <span className="flex h-14 items-center">
        <AvatarArt id={avatar} className={big ? 'size-12' : 'size-10'}/>
      </span>
      <p className="m-0 mt-1 font-display text-fine font-bold leading-tight text-ink">{name}</p>
      <p className="m-0 text-fine leading-tight text-ink-2">{role}</p>
    </div>
  )
}

function NetworkPic({ play }) {
  return (
    <Pic label={`Demo: ${DEMO_TEEN.name}, a teen, linked to her parent ${PARENT.name} and to ${DOC.name}, a ${PRO}. A switch on each link is ${DEMO_TEEN.name}'s, and her ${NOTES} are never shared.`}>
      <div className="absolute inset-x-2 top-1/2 mx-auto max-w-[300px] -translate-y-1/2">
        <div className="relative grid grid-cols-3 items-start">
          <motion.span className="absolute left-[16.7%] right-[16.7%] top-7 origin-center border-t-2 border-coral"
            initial={false} animate={play ? { scaleX: [0, 1] } : { scaleX: 1 }}
            transition={{ duration: 0.6, ease: EASE }}/>
          <span className="absolute left-[33.3%] top-7 z-[2] -translate-x-1/2 -translate-y-1/2"><Toggle play={play}/></span>
          <span className="absolute left-[66.7%] top-7 z-[2] -translate-x-1/2 -translate-y-1/2"><Toggle play={play} flip/></span>
          <Person avatar={PARENT.avatar} name={PARENT.name} role="Parent"/>
          <Person avatar={DEMO_TEEN.avatar} name={DEMO_TEEN.name} role="Teen" big/>
          <Person avatar={DOC.avatar} name={DOC.name} role={PRO_WRAP}/>
        </div>
        <p className="m-0 mt-2.5 flex items-center justify-center gap-1.5 text-fine leading-tight text-coral-ink">
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

function PatchPic({ play }) {
  const heart = SENSORS.heart.glow
  return (
    <Pic label="Demo: the MindMap patch, or a phone whose camera reads pulse when there is no patch."
      className="grid grid-cols-[1fr_auto_1fr] items-center px-4">
      <figure className="m-0 flex flex-col items-center">
        <motion.span className="block" initial={false}
          animate={play ? { y: [0, -4, 0] } : { y: 0 }}
          transition={{ duration: 1.4, ease: 'easeInOut', repeat: 1 }}>
          <PatchFront className="w-[62px]"/>
        </motion.span>
        <figcaption className="mt-2 text-fine font-semibold leading-tight text-ink">Patch</figcaption>
      </figure>
      <span className="font-display text-ui font-bold text-blush-ink">or</span>
      <figure className="m-0 flex flex-col items-center">
        <span className="relative block h-[92px] w-[50px] rounded-[12px] border-[3px] border-ink bg-card">
          <span className="absolute left-1/2 top-1.5 size-[7px] -translate-x-1/2 rounded-full bg-ink"/>
          {play && (
            <motion.span className="absolute left-1/2 top-1.5 -ml-[3.5px] size-[7px] rounded-full"
              style={{ boxShadow: `0 0 0 2px ${heart}` }}
              initial={{ scale: 1, opacity: 0 }}
              animate={{ scale: [1, 2.6], opacity: [0.9, 0] }}
              transition={{ duration: 1.1, repeat: 2, repeatDelay: 0.3, ease: 'easeOut' }}/>
          )}
          <svg viewBox="0 0 40 24" className="absolute inset-x-1 top-[36px] w-[calc(100%-8px)]">
            <motion.path d="M1 14h9l3-8 4 14 3-9 3 3h16" fill="none" stroke={heart} strokeWidth="2.4"
              strokeLinecap="round" strokeLinejoin="round" initial={false}
              animate={play ? { pathLength: [0, 1] } : { pathLength: 1 }}
              transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.2 }}/>
          </svg>
        </span>
        <figcaption className="mt-2 text-fine font-semibold leading-tight text-ink">Phone camera</figcaption>
      </figure>
    </Pic>
  )
}

/* ── Heads Up: the notification lands on a parent's phone ────────────── */

function HeadsUpPic({ play }) {
  return (
    <Pic label={`Demo: a Heads Up notification lands on a parent's phone with a yellow light: ${HEADLINE.yellow}`}>
      <div className="absolute bottom-0 left-1/2 h-[136px] w-[min(214px,84%)] -translate-x-1/2 rounded-t-[26px] border-[3px] border-b-0 border-ink-2
        bg-[linear-gradient(180deg,#ffffff,#eef7fd)] shadow-[0_-8px_24px_-16px_rgba(9,103,171,.45)]">
        <span className="absolute left-1/2 top-2 h-[5px] w-12 -translate-x-1/2 rounded-bar bg-ink-2"/>
        <motion.div className="absolute inset-x-2 top-6 rounded-[12px] border border-rule bg-card px-2.5 py-2 shadow-[0_6px_16px_-10px_rgba(13,43,30,.4)]"
          initial={false}
          animate={play ? { y: [-16, 0], opacity: [0, 1], scale: [0.96, 1] } : { y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.45 }}>
          <p className="m-0 flex items-center justify-between text-fine leading-none text-ink-2">
            <span className="font-semibold">Heads Up</span><span>now</span>
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <motion.span className="block" initial={false}
              animate={play ? { scale: [0.6, 1.12, 1] } : { scale: 1 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.85 }}>
              <LampFace light="yellow" size={26}/>
            </motion.span>
            <p className="m-0 font-display text-fine font-bold leading-tight text-ink">{HEADLINE.yellow}</p>
          </div>
        </motion.div>
        <div className="absolute inset-x-2 top-[96px] flex justify-center gap-2.5">
          <LampFace light="green" size={16} lit={false}/>
          <LampFace light="yellow" size={16}/>
          <LampFace light="red" size={16} lit={false}/>
        </div>
      </div>
    </Pic>
  )
}

/* ── Recovery: a peak, and the drop back shaded ──────────────────────── */

function RecoveryPic({ play }) {
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
  const at = m => `calc(14px + (100% - 28px) * ${x(m) / W})`
  const span = n => `calc((100% - 28px) * ${n / (to - from)})`
  const later = { duration: 0.4, ease: EASE, delay: 1.3 }
  return (
    <Pic label={`Demo: a line rises to a peak and drops back into the usual range. The drop is shaded: settled in ${SETTLE.minutes} minutes, against a usual ${DAY.usualSettle}.`}>
      <motion.div className="absolute top-3 h-5" style={{ left: at(SETTLE.peakAt), width: span(SETTLE.minutes) }}
        initial={false} animate={play ? { opacity: [0, 1], y: [4, 0] } : { opacity: 1, y: 0 }} transition={later}>
        <span className="absolute inset-x-0 bottom-0 h-2 rounded-t-[3px] border-x-2 border-t-2 border-lilac-ink"/>
        <span className="absolute bottom-2.5 left-0 whitespace-nowrap font-display text-fine font-bold leading-none text-lilac-ink">{SETTLE.minutes} min</span>
      </motion.div>
      <motion.div className="absolute bottom-3 h-5" style={{ left: at(SETTLE.peakAt), width: span(DAY.usualSettle) }}
        initial={false} animate={play ? { opacity: [0, 1] } : { opacity: 1 }} transition={{ ...later, delay: 1.5 }}>
        <span className="absolute inset-x-0 top-0 h-2 rounded-b-[3px] border-x-2 border-b-2 border-dashed border-ink-3"/>
        <span className="absolute left-full top-1 ml-1.5 whitespace-nowrap text-fine leading-none text-ink-2">usual {DAY.usualSettle}</span>
      </motion.div>
      {/* The line draws left to right by a clip, as the stroke does not scale. */}
      <motion.div className="absolute inset-x-3.5 bottom-9 top-10" initial={false}
        animate={play ? { clipPath: ['inset(-8% 100% -8% 0)', 'inset(-8% 0% -8% 0)'] } : { clipPath: 'inset(-8% 0% -8% 0)' }}
        transition={{ duration: 1.4, ease: 'easeInOut' }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="size-full overflow-visible">
          <rect x="0" y={y(DAY.band.hi)} width={W} height={y(DAY.band.lo) - y(DAY.band.hi)} fill="#ffffff" opacity="0.85"/>
          <path d={drop} fill="#a024f2" opacity="0.26"/>
          <path d={line} fill="none" stroke="#6f09b2" strokeWidth="2.5" strokeLinecap="round"
            strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
        </svg>
      </motion.div>
    </Pic>
  )
}

/* ── Stress before events: the climb, in 15-minute steps, to a marked test ─ */

const STEP = 15
const RUN = Array.from({ length: 6 }, (_, i) => {
  const a = TEST.minute - 6 * STEP + i * STEP
  let s = 0
  for (let m = a; m < a + STEP; m++) s += DAY.index[m] - DAY.usual[m]
  return s / STEP
})
const RUN_MAX = Math.max(1, ...RUN)

function EventsPic({ play }) {
  return (
    <Pic label={`Demo: six bars, one for each 15 minutes in the hour and a half before a ${TEST.label.toLowerCase()} at ${clock(TEST.minute)} marked in the calendar, climbing higher above the usual line as the test gets closer.`}>
      <motion.div className="absolute right-3.5 top-3 flex items-center gap-2 rounded-[8px] bg-card/80 py-1 pl-1 pr-2"
        initial={false} animate={play ? { scale: [0.9, 1.06, 1] } : { scale: 1 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.9 }}>
        <span className="overflow-hidden rounded-[5px] bg-card leading-none shadow-[0_0_0_1px_rgba(130,93,7,.25)]">
          <span className="block h-1.5 bg-sun"/>
          <span className="block px-1.5 pb-1 pt-0.5 font-display text-fine font-bold text-ink">{clock(TEST.minute)}</span>
        </span>
        <span className="font-display text-fine font-bold leading-tight text-ink">{TEST.label}</span>
      </motion.div>
      <div className="absolute inset-x-3.5 bottom-8 top-[62px] flex items-end gap-1.5">
        {RUN.map((v, i) => (
          <motion.span key={i} className="block flex-1 origin-bottom rounded-t-[5px] bg-sun"
            style={{ height: `${Math.max(5, (v / RUN_MAX) * 100)}%`, opacity: 0.55 + 0.45 * (i / (RUN.length - 1)) }}
            initial={false}
            animate={play ? { scaleY: [0.1, 1] } : { scaleY: 1 }}
            transition={{ duration: 0.6, delay: 0.15 + i * 0.1, ease: EASE }}/>
        ))}
      </div>
      <span className="absolute inset-x-3.5 bottom-8 border-t-2 border-dashed border-ink-3"/>
      <p className="absolute inset-x-3.5 bottom-2 m-0 flex justify-between text-fine leading-tight text-ink-2">
        <span>Usual</span><span>Test</span>
      </p>
    </Pic>
  )
}

/* ── MindMap AI: a question, a pause, a reply ────────────────────────── */

const ASK = AUDIENCES.student.starters[0]

function AiPic({ play }) {
  const [replied, setReplied] = React.useState(true)
  React.useEffect(() => {
    if (!play) { setReplied(true); return undefined }
    setReplied(false)
    const t = setTimeout(() => setReplied(true), 1600)
    return () => clearTimeout(t)
  }, [play])
  return (
    <Pic label={`Demo: a teen asks MindMap AI "${ASK}" and gets a short, practical reply.`}>
      <div className="absolute inset-x-3.5 top-4 flex flex-col gap-2">
        <motion.p className="m-0 ml-auto max-w-[86%] rounded-[14px] rounded-br-[4px] bg-accent-lit px-3 py-1.5 text-fine leading-snug text-ink"
          initial={false} animate={play ? { opacity: [0, 1], y: [8, 0] } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.2 }}>
          {ASK}</motion.p>
        <div className="relative">
          <motion.p className="m-0 max-w-[92%] rounded-[14px] rounded-bl-[4px] bg-card px-3 py-1.5 text-fine leading-snug text-ink"
            initial={false}
            animate={{ opacity: replied ? 1 : 0, y: replied ? 0 : 6 }} transition={{ duration: 0.3, ease: EASE }}>
            That sounds tiring. When does your phone go away at night?</motion.p>
          <motion.span className="absolute left-0 top-0 flex gap-1 rounded-[14px] rounded-bl-[4px] bg-card px-3 py-2.5"
            initial={false} animate={{ opacity: replied ? 0 : 1 }} transition={{ duration: 0.2 }}>
            {[0, 1, 2].map(i => (
              <motion.span key={i} className="size-1.5 rounded-full bg-ink-3"
                animate={!replied ? { opacity: [0.3, 1, 0.3] } : { opacity: 1 }}
                transition={!replied ? { duration: 0.9, repeat: Infinity, delay: i * 0.15 } : { duration: 0 }}/>
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
const TONE = emblemColours(LEVEL)

function ToolkitPic({ play }) {
  return (
    <Pic label={`Demo: a level ${LEVEL} badge, ${LEVEL_NAMES[LEVEL - 1]}. Finishing an exercise adds ${FINISH_POINTS} points to the bar, and the level opens ${OPENS.map(o => `the ${o.name} ${o.kind === 'theme' ? 'colour' : 'ring'}`).join(' and ')}.`}
      className="flex items-center gap-4 px-4">
      <div className="relative shrink-0">
        <LevelEmblem level={LEVEL} size={78} pulse={play}/>
        {play && (
          <motion.span className="absolute -right-3 -top-1 font-display text-ui font-bold text-mint-ink"
            initial={{ opacity: 0, y: 6 }} animate={{ y: [6, -12], opacity: [0, 1, 0] }}
            transition={{ duration: 1.6, delay: 0.5, ease: 'easeOut' }}>
            +{FINISH_POINTS}
          </motion.span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="m-0 text-fine leading-tight text-ink-2">Level {LEVEL}</p>
        <p className="m-0 font-display text-ui font-bold leading-tight text-ink">{LEVEL_NAMES[LEVEL - 1]}</p>
        <div className="relative mt-2 h-3 overflow-hidden rounded-bar bg-white/90 shadow-[inset_0_1px_3px_rgba(13,43,30,0.18)]">
          <motion.span className="absolute inset-0 origin-left rounded-bar"
            style={{ background: `linear-gradient(90deg, ${TONE.deep} 0%, ${TONE.top} 85%, ${TONE.rim} 100%)` }}
            initial={false}
            animate={play ? { scaleX: [0.38, 0.38, 0.64] } : { scaleX: 0.64 }}
            transition={{ duration: 1.5, times: [0, 0.45, 1], ease: 'easeOut' }}/>
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

/* CSS loops inside a picture (the dial's rain, the emblem's own CSS) hold
   still on every card but the one in front. */
export const DIF_CSS = `
.dif-card:not(.dif-play) *, .dif-card:not(.dif-play) *::before, .dif-card:not(.dif-play) *::after {
  animation-play-state: paused !important;
}
`
