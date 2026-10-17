import React from 'react'
import { Section, SectionHead } from '../../ui/section'
import { Button } from '../../ui/button'
import { ArrowRight, Camera, MoveMark } from '../../ui/marks'
import { Nameplate } from '../../toolkit/nameplates/Nameplate.jsx'
import { STUDENT_ITEMS } from '../../toolkit/index.jsx'
import { SKILL_BY_ID, SKILL_GROUPS } from '../../skills/index.js'
import { LevelEmblem } from '../../toolkit/game/fx.jsx'
import { BadgeIcon } from '../../toolkit/game/badges.jsx'
import { LEVEL_NAMES, FINISH_POINTS, NEW_TOOL_BONUS, badgeById } from '../../toolkit/game/progress.js'
import { SCORE, PRO_PLURAL } from '../../lib/terms'
import { cn } from '../../lib/utils'
import { ScrollIn, ScrollRow } from '../../ui/motion'

/* The Toolkit tab of How it works.
 *
 * Every fact here is read from the code, not written by hand:
 *   activities     toolkit/index.jsx (STUDENT_ITEMS) and skills/index.js
 *   points, levels toolkit/game/progress.js: 20 a finish, +10 the first
 *                  time, eight named levels, no dates stored (no streaks)
 *   sensors        microphone in sigh.jsx; motion in chest, steady, move and
 *                  walk; the camera only in after.jsx, the optional pulse
 *                  check before and after. Every one has a tap or key stand-in.
 *   Mind Score     no Toolkit file writes a reading or the score, so the
 *                  band says the two are separate.
 *
 * Picture first: the activities appear as their own nameplates, the levels
 * as their own emblems, the badges as their own coins. No counts, because
 * the Toolkit grows. */

const ITEM = Object.fromEntries(STUDENT_ITEMS.map(i => [i.id, i]))
const PLATES = [ITEM.breathing, ITEM.sigh, ITEM.walk, SKILL_BY_ID['school-cram']].filter(Boolean)

const nameOf = id => ITEM[id]?.title || id
const SKILL_LIST = SKILL_GROUPS.map(g => g.title)
const listed = xs => xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`
const SKILL_TABS = SKILL_LIST.join(', ')

const STEPS = [
  { n: 1, k: 'Pick one', line: `A calming activity, or a life skill (${SKILL_TABS}).` },
  { n: 2, k: 'Follow the screen', line: 'It leads and times every step. Some activities read the phone, below.' },
  { n: 3, k: 'Finish', line: `${FINISH_POINTS} points, ${NEW_TOOL_BONUS} more the first time. Levels only go up.` },
]

const BADGE_IDS = ['first', 'calm-kit', 'plan', 'all-tabs']

/* Same 24 box and 1.6 stroke as the marks in Methods.jsx. */
const M = ({ children, size = 20, className }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden focusable="false"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    className={cn('shrink-0', className)}>{children}</svg>
)
const MicMark = p => <M {...p}><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></M>
const TapMark = p => <M {...p}><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.7-2.3L4.5 16a1.5 1.5 0 0 1 2.3-1.9L9 16"/></M>

const SENSORS = [
  { k: 'Microphone', icon: MicMark, line: `${nameOf('sigh')}: your breath out bends a candle flame.` },
  { k: 'Motion', icon: MoveMark,
    line: `${listed(['chest', 'steady', 'move', 'walk'].map(nameOf))}: breaths, tilt, movement and steps.` },
  { k: 'Camera', icon: Camera, line: 'Optional pulse check before and after, to see if it helped.' },
  { k: 'No sensor', icon: TapMark, line: 'Taps and keys stand in on a laptop.' },
]

const WHO = [
  { k: 'Students', bar: 'bg-accent',
    line: 'Calm your body, clear your head, try it with your phone. Points, levels and badges.' },
  { k: 'Parents', bar: 'bg-beam',
    line: `Conversation openers, reading the ${SCORE}, when to get help. Plus the teen exercises, to do together.` },
  { k: PRO_PLURAL, bar: 'bg-sky',
    line: 'Session openers, a next step guide, a referral note. Plus the teen exercises, for a session.' },
]

function Row({ k, icon: Icon, first, children }) {
  return (
    <div className={cn('grid gap-x-4 gap-y-0.5 border-t border-rule py-2', first && 'border-t-0 pt-0',
      'sm:grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)]')}>
      <p className="flex items-center gap-2 font-body text-ui font-semibold text-ink">
        {Icon && <Icon size={18} className="text-accent"/>}{k}
      </p>
      <p className="text-meta leading-[1.45] text-ink-2">{children}</p>
    </div>
  )
}

function SubHead({ children }) {
  return <h3 className="font-display text-row font-bold leading-tight tracking-tight text-ink">{children}</h3>
}

/* The eight levels, each in its own emblem, name underneath. */
function Levels() {
  return (
    <figure className="m-0 mt-4">
      <ol aria-label="Levels" className="m-0 grid list-none grid-cols-4 gap-x-2 gap-y-3 p-0 sm:grid-cols-8">
        {LEVEL_NAMES.map((name, i) => (
          <li key={name} className="flex flex-col items-center gap-1">
            <LevelEmblem level={i + 1} size={42} glow={false} pulse={false}/>
            <span className="text-fine font-semibold text-ink-2">{name}</span>
          </li>
        ))}
      </ol>
      <ul aria-label="Some of the badges" className="m-0 mt-4 flex list-none flex-wrap gap-x-4 gap-y-2 p-0">
        {BADGE_IDS.map(id => (
          <li key={id} className="flex items-center gap-2">
            <BadgeIcon id={id} size={30}/>
            <span className="text-fine font-semibold text-ink">{badgeById(id)?.name}</span>
          </li>
        ))}
      </ul>
      <figcaption className="mt-3 text-fine text-ink-2">
        No dates are kept, so there are no streaks and a missed day costs nothing.
      </figcaption>
    </figure>
  )
}

export function ToolkitBand({ go }) {
  return (
    <Section tone="card" className="bg-mint-wash">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-x-10">

        <ScrollIn className="min-w-0 lg:col-start-1">
          <SectionHead className="mt-0 max-w-[24ch]">Calming activities and life skills</SectionHead>
          <p className="mt-2 max-w-[48ch] text-sec leading-[1.5] text-ink-2">
            The Toolkit, inside the app. <strong className="font-semibold text-ink">Pick one, follow the screen, finish.</strong>
          </p>
        </ScrollIn>

        {/* Real nameplates: each one opens its activity. After the heading on
            a phone, so the picture comes before the steps. */}
        <figure className="m-0 grid min-w-0 gap-2.5 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          {PLATES.map((it, i) => <Nameplate key={it.id} item={it} index={i}/>)}
        </figure>

        <div className="min-w-0 lg:col-start-1">
          <ol className="m-0 list-none p-0">
            {STEPS.map((s, i) => (
              <ScrollRow as="li" key={s.n} index={i}>
                <div className={cn('flex gap-3 border-t border-rule py-2.5', i === 0 && 'border-t-0 pt-0')}>
                  <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-accent font-display text-ui font-bold text-paper">
                    {s.n}
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-ui font-bold text-ink">{s.k}</p>
                    <p className="text-meta leading-[1.45] text-ink-2">{s.line}</p>
                  </div>
                </div>
              </ScrollRow>
            ))}
          </ol>
          <Levels/>
          <Button className="mt-5" onClick={() => go('toolkit')}>
            Open the Toolkit<ArrowRight aria-hidden/>
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-8 border-t border-rule pt-6 lg:grid-cols-2 lg:gap-10">
        <section aria-labelledby="kit-phone" className="min-w-0">
          <div id="kit-phone"><SubHead>What the phone measures</SubHead></div>
          <div className="mt-3">
            {SENSORS.map((s, i) => (
              <ScrollRow key={s.k} index={i}><Row k={s.k} icon={s.icon} first={i === 0}>{s.line}</Row></ScrollRow>
            ))}
          </div>
          <p className="mt-3 text-meta font-semibold text-ink">
            Sensor readings stay on the phone. The Toolkit does not change your {SCORE}.
          </p>
        </section>

        <section aria-labelledby="kit-who" className="min-w-0">
          <div id="kit-who"><SubHead>Who gets which set</SubHead></div>
          <ul className="m-0 mt-3 grid list-none gap-3 p-0">
            {WHO.map((w, i) => (
              <ScrollRow as="li" key={w.k} index={i}>
                <div className="flex gap-3">
                  <span aria-hidden className={cn('w-1.5 shrink-0 rounded-full', w.bar)}/>
                  <div className="min-w-0">
                    <p className="font-display text-ui font-bold text-ink">{w.k}</p>
                    <p className="text-meta leading-[1.45] text-ink-2">{w.line}</p>
                  </div>
                </div>
              </ScrollRow>
            ))}
          </ul>
          <p className="mt-3 text-meta text-ink-2">
            <strong className="font-semibold text-ink">Everyone</strong> also gets the life skills
            ({SKILL_TABS}) and Resources.
          </p>
        </section>
      </div>
    </Section>
  )
}

export default ToolkitBand
