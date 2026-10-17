import React from 'react'
import { PatchFront } from '../../../charts/patch-front'
import { SENSORS, SENSOR_ORDER } from '../../../lib/sensors'
import { FAMILY } from '../../../lib/roster'
import { LampFace } from '../../../traffic/Face'
import { HEADLINE } from '../../../signals/light.js'
import { demoDay, settleTimes } from '../../../signals/recovery'
import { AvatarArt } from '../../../account/avatars'
import { DEMO_LINKS, DEMO_TEEN } from '../../../account/demo-network'
import { AUDIENCES } from '../../../ai/framework'
import { NOTES, PRO, SCORE } from '../../../lib/terms'
import { cn } from '../../../lib/utils'

/* One small, plain picture per point in "What makes MindMap different".
 * Each is a single idea at a glance: one dial, one line, one notification,
 * two numbers. Figures are the app's own demo data (lib/roster.js,
 * signals/recovery.js, account/demo-network.js), so a change there shows
 * here. Every picture is one role="img" with a label that says what it
 * shows; the drawing inside is hidden from screen readers. Nothing moves. */

const MAYA = FAMILY.find(t => t.id === 'maya') || FAMILY[0]
const TODAY = MAYA.days[MAYA.days.length - 1]
const PARENT = DEMO_LINKS.find(l => l.person.role === 'parent').person
const DOC = DEMO_LINKS.find(l => l.person.role === 'pro' && l.status === 'active').person

const DAY = demoDay()
const SETTLE = settleTimes(DAY.index, DAY.band).find(t => t.settled && t.peak > DAY.band.hi + 10)
const TEST = DAY.events.find(e => e.kind === 'test') || DAY.events[0]

/* The ground every picture sits on: a flat wash, fixed height, so a row of
   cards lines up without any of them needing a frame of its own. */
function Pic({ label, wash, children, className }) {
  return (
    <div role="img" aria-label={label}
      className={cn('relative h-[140px] overflow-hidden rounded-[12px]', wash, className)}>
      <div aria-hidden className="absolute inset-0">{children}</div>
    </div>
  )
}

/* A stretch of the demo day's per-minute index as one line. The line is
   drawn in a stretched box (non-scaling stroke keeps it 2px), and labels sit
   on top in HTML so text is never squashed. */
function Line({ from, to, lo = 30, hi = 76, band, dashed, stroke, children }) {
  const W = 100, H = 100
  const x = m => ((m - from) / (to - from)) * W
  const y = v => H - ((v - lo) / (hi - lo)) * H
  const path = series => {
    let d = ''
    for (let m = from; m <= to; m += 2) d += `${m === from ? 'M' : 'L'}${x(m).toFixed(2)} ${y(series[m]).toFixed(2)}`
    return d
  }
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-x-3 bottom-3 top-9 h-[calc(100%-48px)] w-[calc(100%-24px)] overflow-visible">
        {band && <rect x="0" y={y(band.hi)} width={W} height={y(band.lo) - y(band.hi)} className="fill-card" opacity="0.75"/>}
        {dashed && <path d={path(dashed)} fill="none" stroke="#426a58" strokeWidth="1.5" strokeDasharray="3 4"
          vectorEffect="non-scaling-stroke"/>}
        <path d={path(DAY.index)} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round"
          strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
      </svg>
      {children?.({ x: m => `calc(12px + (100% - 24px) * ${x(m) / W})` })}
    </>
  )
}

/* ── Mind Score: one dial ─────────────────────────────────────────────── */

function ScorePic() {
  const v = TODAY.score
  const R = 54, C = Math.PI * R
  return (
    <Pic wash="bg-accent-wash"
      label={`Demo: a dial showing a ${SCORE} of ${v} out of 100, today.`}>
      <svg viewBox="0 0 140 84" className="absolute left-1/2 top-3 h-[80px] w-auto -translate-x-1/2">
        <path d="M16 72a54 54 0 0 1 108 0" fill="none" stroke="#ffffff" strokeWidth="12" strokeLinecap="round"/>
        <path d="M16 72a54 54 0 0 1 108 0" fill="none" stroke="#157446" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${(C * v) / 100} ${C}`}/>
      </svg>
      <p className="absolute inset-x-0 top-[48px] m-0 text-center font-display text-stat font-bold tabular-nums text-ink">{v}</p>
      <p className="absolute inset-x-0 bottom-2 m-0 text-center text-fine text-ink-2">{SCORE} today</p>
    </Pic>
  )
}

/* ── Network: three people, linked ───────────────────────────────────── */

function Who({ avatar, name, role, big }) {
  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <AvatarArt id={avatar} className={big ? 'size-12' : 'size-10'}/>
      <p className="m-0 mt-1.5 whitespace-nowrap font-display text-fine font-bold leading-tight text-ink">{name}</p>
      <p className="m-0 whitespace-nowrap text-fine leading-tight text-ink-2">{role}</p>
    </div>
  )
}

function NetworkPic() {
  return (
    <Pic wash="bg-coral-wash"
      label={`Demo: ${DEMO_TEEN.name}, a teen, linked to her parent ${PARENT.name} and to ${DOC.name}, a ${PRO}.`}>
      {/* The third column is a little wider: "Medical Professional" is the longest role. */}
      <div className="absolute inset-x-1 top-1/2 grid -translate-y-1/2 grid-cols-[1fr_0.85fr_1.2fr] items-start">
        <span className="absolute left-[16%] right-[18%] top-6 border-t-2 border-dashed border-coral"/>
        <Who avatar={PARENT.avatar} name={PARENT.name} role="Parent"/>
        <Who avatar={DEMO_TEEN.avatar} name={DEMO_TEEN.name} role="Teen" big/>
        <Who avatar={DOC.avatar} name={DOC.name} role={PRO}/>
      </div>
    </Pic>
  )
}

/* ── Patch: the patch and its four readings ──────────────────────────── */

function PatchPic() {
  const rows = SENSOR_ORDER.map(id => SENSORS[id])
  return (
    <Pic wash="bg-beam-wash"
      label={`Demo: the MindMap patch, designed to read ${rows.map(r => r.name.toLowerCase()).join(', ')}.`}>
      <div className="absolute inset-0 flex items-center justify-center gap-3 px-3">
        <PatchFront className="w-[54px] shrink-0"/>
        <ul className="m-0 list-none space-y-1 p-0">
          {rows.map(r => {
            const Icon = r.icon
            return (
              <li key={r.id} className="flex items-center gap-2 text-fine leading-tight text-ink">
                <Icon aria-hidden size={16} style={{ color: r.glow }} className="shrink-0"/>{r.name}
              </li>
            )
          })}
        </ul>
      </div>
    </Pic>
  )
}

/* ── Heads Up: the one line a parent gets ────────────────────────────── */

function HeadsUpPic() {
  return (
    <Pic wash="bg-sky-wash" label={`Demo: a Heads Up notification on a parent's phone with a yellow light: ${HEADLINE.yellow}`}>
      <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 rounded-[12px] bg-card px-3 py-2.5 shadow-card">
        <p className="m-0 flex items-center justify-between text-fine leading-none text-ink-2">
          <span className="font-semibold">Heads Up</span><span>now</span>
        </p>
        <div className="mt-2 flex items-center gap-2.5">
          <LampFace light="yellow" size={28}/>
          <p className="m-0 font-display text-ui font-bold leading-tight text-ink">{HEADLINE.yellow}</p>
        </div>
      </div>
    </Pic>
  )
}

/* ── Recovery time: one peak, one line, how long it took ─────────────── */

function RecoveryPic() {
  const from = SETTLE.peakAt - 40, to = SETTLE.peakAt + 50
  return (
    <Pic wash="bg-lilac-wash"
      label={`Demo: a line that rises to a peak at ${Math.round(SETTLE.peak)} and settles back toward the usual range. Settled in ${SETTLE.minutes} minutes; the usual is ${DAY.usualSettle}.`}>
      <p className="absolute left-3 top-2.5 m-0 text-fine leading-tight text-ink">
        <span className="font-display font-bold">Settled in {SETTLE.minutes} min</span>
        <span className="text-ink-2"> · usual {DAY.usualSettle}</span>
      </p>
      <Line from={from} to={to} band={DAY.band} stroke="#a024f2">
        {({ x }) => (
          <span className="absolute top-9 h-[calc(100%-48px)] border-x-2 border-lilac-ink/60 bg-lilac/10"
            style={{ left: x(SETTLE.peakAt), width: `calc((100% - 24px) * ${SETTLE.minutes / (to - from)})` }}/>
        )}
      </Line>
    </Pic>
  )
}

/* ── Stress before events: the climb before a marked test ────────────── */

function EventsPic() {
  const from = TEST.minute - 120, to = TEST.minute + 12
  return (
    <Pic wash="bg-sun-wash"
      label={`Demo: a line that climbs above the dashed usual line in the two hours before a ${TEST.label.toLowerCase()} marked in the calendar.`}>
      <Line from={from} to={to} dashed={DAY.usual} stroke="#825d07">
        {({ x }) => (
          <>
            <span className="absolute bottom-3 top-2.5 border-l-2 border-sun-ink" style={{ left: x(TEST.minute) }}/>
            <span className="absolute top-2.5 -translate-x-full whitespace-nowrap rounded-[6px] bg-sun-ink px-1.5 py-0.5
              text-fine font-semibold leading-tight text-card" style={{ left: x(TEST.minute) }}>{TEST.label}</span>
          </>
        )}
      </Line>
    </Pic>
  )
}

/* ── Measured exercises: the phone as the sensor ─────────────────────── */

const EXHALE = 6.8, GOAL = 6, GAUGE = 12

function ExercisesPic() {
  return (
    <Pic wash="bg-mint-wash"
      label={`Demo: a Long Exhale on the phone. The microphone measured a ${EXHALE} second exhale against a ${GOAL} second goal. Sound is never recorded.`}>
      <div className="absolute inset-0 flex items-center justify-center gap-4 px-3">
        <div className="relative h-[100px] w-[54px] shrink-0 rounded-[12px] border-[3px] border-ink bg-card">
          <span className="absolute left-1/2 top-1.5 h-1 w-4 -translate-x-1/2 rounded-bar bg-ink"/>
          <svg viewBox="0 0 24 40" className="absolute left-1/2 top-[26px] h-[48px] -translate-x-1/2">
            <path d="M12 3c4 5 6 9 6 13a6 6 0 0 1-12 0c0-4 2-8 6-13z" fill="#f25424"/>
            <path d="M12 11c2 2.5 3 4.5 3 6.5a3 3 0 0 1-6 0c0-2 1-4 3-6.5z" fill="#ffe8e0"/>
            <rect x="8" y="24" width="8" height="14" rx="2" fill="#d5f2e8" stroke="#067049" strokeWidth="1.2"/>
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-fine leading-tight text-ink-2">Long exhale</p>
          <p className="m-0 mt-0.5 font-display text-head font-bold tabular-nums leading-none text-ink">{EXHALE} s</p>
          <div className="relative mt-2.5 h-2 rounded-bar bg-card">
            <span className="absolute inset-y-0 left-0 rounded-bar bg-mint" style={{ width: `${(EXHALE / GAUGE) * 100}%` }}/>
            <span className="absolute -top-1 h-4 w-0.5 bg-ink" style={{ left: `${(GOAL / GAUGE) * 100}%` }}/>
          </div>
          <p className="m-0 mt-1.5 text-fine leading-tight text-ink-2">Goal {GOAL} s</p>
        </div>
      </div>
    </Pic>
  )
}

/* ── Before and after: two pulse checks ──────────────────────────────── */

const BEFORE = 84, AFTER = 78

function BeforeAfterPic() {
  return (
    <Pic wash="bg-blush-wash"
      label={`Demo: a pulse check of ${BEFORE} beats a minute before a breathing exercise and ${AFTER} after it.`}>
      <div className="absolute inset-0 flex items-center justify-center gap-3 px-3">
        <div className="text-center">
          <p className="m-0 text-fine text-ink-2">Before</p>
          <p className="m-0 mt-1 font-display text-stat font-bold tabular-nums leading-none text-ink-2">{BEFORE}</p>
          <p className="m-0 mt-1 text-fine text-ink-2">bpm</p>
        </div>
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#b2095e" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <path d="M3.5 12h16M13.5 6l6 6-6 6"/>
        </svg>
        <div className="text-center">
          <p className="m-0 text-fine text-ink-2">After</p>
          <p className="m-0 mt-1 font-display text-stat font-bold tabular-nums leading-none text-blush-ink">{AFTER}</p>
          <p className="m-0 mt-1 text-fine text-ink-2">bpm</p>
        </div>
      </div>
    </Pic>
  )
}

/* ── MindMap AI: one question, one answer ────────────────────────────── */

const ASK = AUDIENCES.student.starters[0]

function AiPic() {
  return (
    <Pic wash="bg-accent-wash" label={`Demo: a teen asks MindMap AI "${ASK}" and gets a short, practical reply.`}>
      <div className="absolute inset-x-3 top-3 flex flex-col gap-1.5">
        <p className="m-0 ml-auto max-w-[88%] rounded-[12px] rounded-br-[4px] bg-accent px-2.5 py-1.5 text-fine leading-snug text-card">
          {ASK}</p>
        <p className="m-0 max-w-[92%] rounded-[12px] rounded-bl-[4px] bg-card px-2.5 py-1.5 text-fine leading-snug text-ink">
          That sounds tiring. When does your phone go away?</p>
      </div>
    </Pic>
  )
}

/* ── Privacy: the teen's own switches ────────────────────────────────── */

function Switch({ on }) {
  return (
    <span className={cn('relative h-6 w-10 shrink-0 rounded-chip', on ? 'bg-accent' : 'bg-ruling')}>
      <span className={cn('absolute top-[3px] size-[18px] rounded-full bg-card', on ? 'right-[3px]' : 'left-[3px]')}/>
    </span>
  )
}

function PrivacyPic() {
  return (
    <Pic wash="bg-sky-wash"
      label={`Demo: ${DEMO_TEEN.name}'s sharing switches for her parent ${PARENT.name}. ${SCORE} for each day is on. ${NOTES} are never shared.`}>
      <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 rounded-[12px] bg-card px-3 py-2">
        <p className="m-0 flex items-center gap-2 text-fine leading-tight text-ink-2">
          <AvatarArt id={DEMO_TEEN.avatar} className="size-6"/>
          <span>Shared with <span className="font-semibold text-ink">{PARENT.name}</span></span>
        </p>
        <p className="m-0 mt-2 flex items-center justify-between gap-2 text-fine leading-tight text-ink">
          {SCORE} each day<Switch on/>
        </p>
        <p className="m-0 mt-1.5 flex items-center justify-between gap-2 text-fine leading-tight text-ink">
          {NOTES}
          <span className="inline-flex items-center gap-1 text-ink-2">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>
            </svg>
            Never
          </span>
        </p>
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
  breath: ExercisesPic,
  helped: BeforeAfterPic,
  ai: AiPic,
  sharing: PrivacyPic,
}
