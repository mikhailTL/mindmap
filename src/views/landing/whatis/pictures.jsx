import React from 'react'
import { PatchFront } from '../../../charts/patch-front'
import { RainbowDial } from '../../../charts/rainbow'
import { STUDENT_RINGS, studentRings } from '../../../lib/readings'
import { SENSORS, SENSOR_ORDER } from '../../../lib/sensors'
import { FAMILY } from '../../../lib/roster'
import { LampFace } from '../../../traffic/Face'
import { HEADLINE } from '../../../signals/light.js'
import { AvatarArt } from '../../../account/avatars'
import { SKILL_GROUPS } from '../../../skills/index.js'
import { AUDIENCES } from '../../../ai/framework.js'
import { Check, Never } from '../../../ui/marks'
import { NOTES, LOCATION, PRO, SCORE } from '../../../lib/terms'
import { cn } from '../../../lib/utils'

/* The three demo pictures for the What is MindMap? band. Each is built from
 * the app's own pieces and demo data, so a change in the app shows here:
 *
 *   patch    PatchFront, the four rings' readings from lib/readings.js, and
 *            the student's RainbowDial with the sentence the phone mock uses
 *   network  Maya, Elena and Dr. Shah from account/demo-network.js; what each
 *            sees is the SHARING table's wording in app/store.js
 *   app      a MindMap AI starter from ai/framework.js, the Heads Up yellow
 *            headline from signals/light.js, the four SKILL_GROUPS
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
    <div className="flex items-center gap-2">
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
          <div className="mt-2.5 flex items-center gap-2 rounded-[8px] bg-paper px-2 py-1.5">
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

/* ── 3. one app: MindMap AI, Heads Up and the four life skills groups ───── */

const GROUP_TILE = {
  sky: 'bg-sky-wash text-sky-ink',
  blush: 'bg-blush-wash text-blush-ink',
  mint: 'bg-mint-wash text-mint-ink',
  sun: 'bg-sun-wash text-sun-ink',
}
const ASK = AUDIENCES.student.starters[0]

function Head({ children }) {
  return <p className="m-0 font-display text-ui font-bold leading-tight text-ink">{children}</p>
}

export function AppPicture() {
  const groups = SKILL_GROUPS.map(g => ({ id: g.id, title: g.title, sub: g.sub, family: g.family, Icon: g.tools[0]?.icon }))
  return (
    <Picture wash="bg-lilac-wash"
      label={`Demo: three parts of one app. MindMap AI answering a teen who wrote "${ASK}". A Heads Up message for a parent with a yellow light: ${HEADLINE.yellow} And the Toolkit's four groups: ${groups.map(g => `${g.title}, ${g.sub}`).join('; ')}.`}>
      <div className="mt-5 flex flex-1 flex-col justify-between gap-2.5">
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

        <Panel className="px-3 py-2.5">
          <Head>Toolkit</Head>
          <ul className="m-0 mt-2 grid list-none grid-cols-2 gap-x-2 gap-y-3 p-0">
            {groups.map(({ id, title, sub, family, Icon }) => (
              <li key={id} className="flex min-w-0 items-center gap-2">
                <span className={cn('grid size-9 shrink-0 place-items-center rounded-[8px] [&_svg]:size-5',
                  GROUP_TILE[family] || GROUP_TILE.sky)}>
                  {Icon ? <Icon/> : null}
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-fine font-bold leading-tight text-ink">{title}</span>
                  <span className="block text-fine leading-tight text-ink-2">{sub}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </Picture>
  )
}
