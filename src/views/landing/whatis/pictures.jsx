import React from 'react'
import { PatchFront } from '../../../charts/patch-front'
import { RainbowDial } from '../../../charts/rainbow'
import { STUDENT_RINGS, studentRings } from '../../../lib/readings'
import { SENSORS, SENSOR_ORDER } from '../../../lib/sensors'
import { FAMILY } from '../../../lib/roster'
import { LampFace } from '../../../traffic/Face'
import { HEADLINE } from '../../../signals/light.js'
import { AvatarArt } from '../../../account/avatars'
import { AUDIENCES } from '../../../ai/framework.js'
import { Check, Never } from '../../../ui/marks'
import { THEMES, levelFor, levelName } from '../../../toolkit/game/progress.js'
import { NOTES, LOCATION, PRO, SCORE } from '../../../lib/terms'
import { cn } from '../../../lib/utils'

/* The three demo pictures for the What is MindMap? band. Each is built from
 * the app's own pieces and demo data, so a change in the app shows here:
 *
 *   patch    PatchFront, the four rings' readings from lib/readings.js, and
 *            the student's RainbowDial with the sentence the phone mock uses
 *   network  Maya, Elena and Dr. Shah from account/demo-network.js; what each
 *            sees is the SHARING table's wording in app/store.js
 *   app      a MindMap AI starter from ai/framework.js and the Heads Up yellow
 *            headline from signals/light.js
 *   toolkit  three calming activities and a level bar, by the Toolkit's own
 *            level rules (toolkit/game/progress.js)
 *
 * Every picture is one role="img" with a label that says what it shows; the
 * drawing inside is hidden from screen readers. The only motion is a slow
 * dash along the connecting lines, and reduced motion stops it. */

export const PICTURE_CSS = `
@keyframes mm-whatis-flow { to { stroke-dashoffset: -20 } }
.mm-whatis-flow { animation: mm-whatis-flow 1.6s linear infinite }
@media (prefers-reduced-motion: reduce) { .mm-whatis-flow { animation: none } }
`

function Picture({ label, wash, children, className }) {
  return (
    <div role="img" aria-label={label}
      className={cn('relative flex h-full flex-col rounded-[12px] p-3.5 sm:p-4', wash, className)}>
      <span aria-hidden className="absolute right-3.5 top-2.5 text-fine text-ink-2">Demo</span>
      <div aria-hidden className="flex flex-1 flex-col">{children}</div>
    </div>
  )
}

const Panel = ({ className, children }) => (
  <div className={cn('rounded-[10px] border border-rule bg-card shadow-card', className)}>{children}</div>
)

/* A short vertical link whose dashes run downward. */
function Flow({ label }) {
  return (
    <div className="flex items-center justify-center gap-2.5 py-1.5">
      <svg width="14" height="30" viewBox="0 0 14 30" className="text-ink-3" aria-hidden>
        <path d="M7 1v22" stroke="currentColor" strokeWidth="2" strokeDasharray="4 6"
          strokeLinecap="round" className="mm-whatis-flow"/>
        <path d="M2.5 20.5 7 26l4.5-5.5" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="text-fine font-semibold text-ink-2">{label}</span>
    </div>
  )
}

/* ── 1. the patch: readings in, a Mind Score out ─────────────────────────── */

const READINGS = SENSOR_ORDER.map(id => ({ ...SENSORS[id], big: STUDENT_RINGS.find(r => r.id === id)?.big }))

export function PatchPicture() {
  const rings = React.useMemo(() => studentRings(), [])
  return (
    <Picture wash="bg-beam-wash"
      label={`Demo: the MindMap patch with four readings, heart 70 bpm, sweat 3.00 µS, temperature 33.5 °C and movement 0.01 g, passing through the neural network to a ${SCORE} of 38 on the rainbow dial, with the words Today is running easy, lower than your usual 46.`}>
      <div className="mt-5 flex items-center gap-3">
        <PatchFront className="w-[66px] shrink-0 sm:w-[78px]"/>
        <Panel className="min-w-0 flex-1 px-3 py-2">
          <ul className="m-0 list-none p-0">
            {READINGS.map(r => {
              const Icon = r.icon
              return (
                <li key={r.id} className="flex items-center gap-2 py-[3px]">
                  <Icon aria-hidden size={16} style={{ color: r.glow }} className="shrink-0"/>
                  <span className="min-w-0 flex-1 truncate text-fine text-ink-2">{r.name}</span>
                  <span className="font-mono text-fine tabular-nums text-ink">{r.big}<span className="text-ink-2"> {r.unit}</span></span>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>
      <Flow label="Neural Network"/>
      <Panel className="flex flex-1 flex-col items-center justify-center px-3 pb-3.5 pt-3">
        <RainbowDial score={38} usual={46} rings={rings} size={236}/>
        <p className="m-0 mt-2.5 text-center font-display text-row font-bold leading-tight text-ink">
          Today is running easy.</p>
        <p className="m-0 mt-1 text-center text-fine text-ink-2">Lower than your usual 46.</p>
      </Panel>
    </Picture>
  )
}

/* ── 2. the network: a teen, a parent and a Medical Professional ────────── */

const MAYA = FAMILY[0]
const TODAY = MAYA.days[MAYA.days.length - 1]

function Person({ avatar, name, role }) {
  return (
    <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-2">
      <AvatarArt id={avatar} className="size-9"/>
      <div className="min-w-0">
        <p className="m-0 font-display text-ui font-bold leading-tight text-ink">{name}</p>
        <p className="m-0 text-fine leading-snug text-ink-2">{role}</p>
      </div>
    </div>
  )
}

function Sees({ items, never }) {
  return (
    <>
      <ul className="m-0 mt-2.5 list-none space-y-1 p-0">
        {items.map(t => (
          <li key={t} className="flex items-start gap-1.5 text-fine leading-snug text-ink">
            <Check aria-hidden size={16} className="mt-[2px] shrink-0 text-accent"/>{t}
          </li>
        ))}
      </ul>
      <p className="m-0 mt-2 flex items-start gap-1.5 border-t border-rule pt-2 text-fine leading-snug text-ink-2">
        <Never aria-hidden size={16} className="mt-[2px] shrink-0 text-ink-3"/>
        <span>{`Never ${never}`}</span>
      </p>
    </>
  )
}

export function NetworkPicture() {
  return (
    <Picture wash="bg-sky-wash"
      label={`Demo: Maya, a teen, linked to her parent Elena and to Dr. Shah, a ${PRO}. Maya chooses who sees what. Elena sees one ${SCORE} a day, today ${TODAY.score}, and roughly how long Maya slept, and never ${NOTES}, ${LOCATION} or raw readings. Dr. Shah sees Maya's ${SCORE} and week over week movement only because Maya agreed, and never ${NOTES} or ${LOCATION}.`}>
      <Panel className="mx-auto mt-5 flex w-full max-w-[17rem] items-center gap-3 px-3 py-2.5">
        <AvatarArt id="fox" className="size-11"/>
        <div className="min-w-0 flex-1">
          <p className="m-0 font-display text-ui font-bold leading-tight text-ink">Maya, 15</p>
          <p className="m-0 text-fine leading-snug text-ink-2">Chooses who sees what</p>
        </div>
        <span className="relative h-6 w-10 shrink-0 rounded-chip bg-accent">
          <span className="absolute right-[3px] top-[3px] size-[18px] rounded-full bg-card"/>
        </span>
      </Panel>

      <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="h-7 w-full text-ink-3">
        {[25, 75].map(x => (
          <path key={x} d={`M50 0C50 12 ${x} 12 ${x} 24`} fill="none" stroke="currentColor" strokeWidth="2"
            strokeDasharray="4 6" vectorEffect="non-scaling-stroke" className="mm-whatis-flow"/>
        ))}
      </svg>

      <div className="grid flex-1 grid-cols-2 gap-2.5">
        <Panel className="flex flex-col p-2.5 sm:p-3">
          <Person avatar="sym-flower" name="Elena" role="Parent"/>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-[8px] bg-paper px-2 py-1.5">
            <LampFace light={TODAY.light} size={26}/>
            <span className="font-display text-head font-bold leading-none tabular-nums text-ink">{TODAY.score}</span>
            <span className="text-fine leading-tight text-ink-2">Today</span>
          </div>
          <Sees items={[`One ${SCORE} a day`, 'Roughly how long she slept']}
            never={`${NOTES}, ${LOCATION} or raw readings`}/>
        </Panel>
        <Panel className="flex flex-col p-2.5 sm:p-3">
          <Person avatar="sym-leaf" name="Dr. Shah" role={PRO}/>
          <p className="m-0 mt-2.5 rounded-[8px] bg-paper px-2 py-1.5 text-fine leading-snug text-ink">
            Sees only teens who said yes</p>
          <Sees items={[`Her ${SCORE}`, 'Week over week movement']}
            never={`${NOTES} or ${LOCATION}`}/>
        </Panel>
      </div>
    </Picture>
  )
}

/* ── 3. one app: MindMap AI and Heads Up ────────────────────────────────── */

const ASK = AUDIENCES.student.starters[0]

function Head({ children }) {
  return <p className="m-0 font-display text-ui font-bold leading-tight text-ink">{children}</p>
}

export function AppPicture() {
  return (
    <Picture wash="bg-lilac-wash"
      label={`Demo: two parts of one app. MindMap AI answering a teen who wrote "${ASK}". And a Heads Up message for a parent with a yellow light: ${HEADLINE.yellow}`}>
      <div className="mt-5 flex flex-1 flex-col justify-center gap-3">
        <Panel className="px-3 py-2.5">
          <Head>MindMap AI</Head>
          <p className="m-0 ml-auto mt-2 w-fit max-w-[85%] rounded-[12px] rounded-br-[4px] bg-accent px-2.5 py-1.5
            text-fine leading-snug text-card">{ASK}</p>
          <p className="m-0 mt-1.5 w-fit max-w-[88%] rounded-[12px] rounded-bl-[4px] bg-mist px-2.5 py-1.5
            text-fine leading-snug text-ink">That sounds tiring. What time does your phone go away at night?</p>
        </Panel>

        <Panel className="flex items-center gap-3 px-3 py-2.5">
          <LampFace light="yellow" size={34}/>
          <div className="min-w-0">
            <p className="m-0 text-fine leading-tight text-ink-2">Heads Up, for parents</p>
            <p className="m-0 mt-0.5 font-display text-ui font-bold leading-tight text-ink">{HEADLINE.yellow}</p>
          </div>
        </Panel>
      </div>
    </Picture>
  )
}

/* ── the Toolkit, a part of feature 3 with its own small picture ─────────── */

/* Three of the calming activities, drawn with the same strokes the Toolkit's
   own index uses (toolkit/index.jsx), so the marks match the app. */
const G = ({ children }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden focusable="false"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
)
const CALM = [
  { id: 'breathing', name: 'Breathing', tone: 'text-sky-ink',
    mark: <G><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3"/></G> },
  { id: 'ground', name: 'Grounding', tone: 'text-sun-ink',
    mark: <G><circle cx="12" cy="12" r="3.5"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21"/></G> },
  { id: 'scan', name: 'Body scan', tone: 'text-mint-ink',
    mark: <G><circle cx="12" cy="5" r="2.5"/><path d="M8 10h8l-1 6h-6zM10 16v5M14 16v5"/></G> },
]

/* Demo points. The level, its name, the bar and the next unlock are the
   Toolkit's own rules in toolkit/game/progress.js. */
const DEMO_POINTS = 160
const LV = levelFor(DEMO_POINTS)
const NEXT = THEMES.find(t => t.level === LV.level + 1)

export function ToolkitPicture() {
  return (
    <div role="img"
      aria-label={`Toolkit demo: three calming activities, breathing, grounding and body scan, and a level bar at level ${LV.level}, ${levelName(LV.level)}, with ${LV.into} of ${LV.need} points toward level ${LV.level + 1}${NEXT ? `, which unlocks the ${NEXT.name} colour` : ''}.`}
      className="rounded-[10px] border border-rule bg-card p-2.5">
      <div aria-hidden>
        <ul className="m-0 grid list-none grid-cols-3 gap-1.5 p-0">
          {CALM.map(c => (
            <li key={c.id} className="flex flex-col items-center gap-1 rounded-[8px] bg-paper px-1 py-2">
              <span className={c.tone}>{c.mark}</span>
              <span className="text-center text-fine font-semibold leading-tight text-ink">{c.name}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2.5 flex items-center gap-2">
          <span className="font-display text-fine font-bold text-ink">Level {LV.level}</span>
          <span className="relative h-2 flex-1 overflow-hidden rounded-bar bg-mist">
            <span className="absolute inset-y-0 left-0 rounded-bar bg-accent" style={{ width: `${Math.round(LV.pct * 100)}%` }}/>
          </span>
          <span className="text-fine tabular-nums text-ink-2">{LV.into}/{LV.need}</span>
        </div>
        {NEXT && (
          <p className="m-0 mt-1 flex items-center gap-1.5 text-fine leading-snug text-ink-2">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>
            </svg>
            Level {LV.level + 1} unlocks the {NEXT.name} colour
          </p>
        )}
      </div>
    </div>
  )
}
