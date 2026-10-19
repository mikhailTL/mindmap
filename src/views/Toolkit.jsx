import React from 'react'
import { ToolkitIndex, Grid, Head } from '../toolkit/index.jsx'
import { SKILL_GROUPS, SKILL_BY_ID } from '../skills/index.js'
import { cn } from '../lib/utils'
import { ResourceList } from '../toolkit/resources.jsx'
import { PlayerCard } from '../toolkit/game/PlayerCard.jsx'
import Breathing from '../toolkit/breathing'
import Grounding from '../toolkit/ground'
import Reframe from '../toolkit/reframe'
import BodyScan from '../toolkit/scan'
import MoveBreak from '../toolkit/move'
import SighCoach from '../toolkit/sigh'
import ChestBreathing from '../toolkit/chest'
import SteadyHand from '../toolkit/steady'
import AlertnessCheck from '../toolkit/alert'
import PocketPacer from '../toolkit/pocket'
import WalkItOff from '../toolkit/walk'
import { ParentOpeners, ParentPhrasing, ParentScore, ParentRules, ParentReach } from '../toolkit/parent'
import { SessionOpeners, NextStepGuide, GroundingTimer, TalkingWithParents, ReferralNote } from '../kit/pro'

/* The Toolkit, as a router.
 *
 * `who` is 'student', 'parent' or 'pro'. `open` names an activity and comes from the
 * route table in src/views/App.jsx:
 *
 *   toolkit-breathing  -> open="breathing"   Box Breathing
 *   toolkit-ground     -> open="ground"      5-4-3-2-1 Grounding
 *   toolkit-reframe    -> open="reframe"     Thought Reframe
 *   toolkit-scan       -> open="scan"        Body Scan
 *   toolkit-move       -> open="move"        Movement Break
 *   toolkit-sigh       -> open="sigh"        Long exhale
 *   toolkit-chest      -> open="chest"       Breath counter
 *   toolkit-steady     -> open="steady"      Hold still
 *   toolkit-alert      -> open="alert"       Reaction test
 *   toolkit-pocket     -> open="pocket"      Breathing by sound
 *   toolkit-walk       -> open="walk"        Short walk
 *
 * With no `open` this renders the index. With an `open` it renders that one
 * activity as the whole screen. The eleven student activities are audience
 * independent, so a parent who lands on one gets the activity.
 *
 * The parent set has routes (toolkit-openers and the rest) and also opens in
 * place from the index when it is handed `onBack`.
 *
 * THE COUNSELOR/PROFESSIONAL SET HAS NO ROUTES YET. It opens in place by state.
 * Adding routes is five lines in App.jsx:
 *
 *   'toolkit-pro-opener'   -> <Toolkit who="pro" open="pro-opener"/>
 *   'toolkit-pro-triage'   -> <Toolkit who="pro" open="pro-triage"/>
 *   'toolkit-pro-ground'   -> <Toolkit who="pro" open="pro-ground"/>
 *   'toolkit-pro-parents'  -> <Toolkit who="pro" open="pro-parents"/>
 *   'toolkit-pro-referral' -> <Toolkit who="pro" open="pro-referral"/>
 *
 * The life skills (src/skills) open at `toolkit-<tool id>`, e.g.
 * toolkit-school-cram -> open="school-cram", for every audience.
 *
 * Nothing in this screen calls a server. The camera and microphone, where an
 * activity turns one on, are measured in the page and never recorded, and
 * nobody is told which activities a reader opened. */

const ROUTED = {
  breathing: Breathing,
  ground:    Grounding,
  reframe:   Reframe,
  scan:      BodyScan,
  move:      MoveBreak,
  sigh:      SighCoach,
  chest:     ChestBreathing,
  steady:    SteadyHand,
  alert:     AlertnessCheck,
  pocket:    PocketPacer,
  walk:      WalkItOff,
}

const IN_PLACE = {
  openers:  ParentOpeners,
  phrasing: ParentPhrasing,
  score:    ParentScore,
  rules:    ParentRules,
  reach:    ParentReach,
  'pro-opener':   SessionOpeners,
  'pro-triage':   NextStepGuide,
  'pro-ground':   GroundingTimer,
  'pro-parents':  TalkingWithParents,
  'pro-referral': ReferralNote,
}

/* The index opens on one of five tabs: the audience's own set, then the four
   life skills categories. The tab is kept in the address as
   `#/toolkit?tab=<id>`, so the way back from a skill lands on its tab. */
const FIRST_TAB = { student:'Exercises', parent:'Your tools', pro:'Your tools' }
const SKILL_LINE = {
  student: 'Only you see what you save.',
  parent:  'The same tools your teen has. Try one together.',
  pro:     'The same tools your teens have, to use in a session.',
}

const tabFromHash = () => {
  const m = /[?&]tab=([a-z]+)/.exec(typeof location !== 'undefined' ? location.hash : '')
  return m && (m[1] === 'resources' || SKILL_GROUPS.some(g => g.id === m[1])) ? m[1] : 'mine'
}

function Tabs({ who, tab, onTab }) {
  const tabs = [{ id:'mine', label:FIRST_TAB[who] || FIRST_TAB.student },
                ...SKILL_GROUPS.map(g => ({ id:g.id, label:g.title })),
                { id:'resources', label:'Resources' }]
  const onKey = e => {
    const i = tabs.findIndex(t => t.id === tab)
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!d) return
    e.preventDefault()
    const next = tabs[(i + d + tabs.length) % tabs.length].id
    onTab(next)
    requestAnimationFrame(() => document.getElementById('kit-tab-' + next)?.focus())
  }
  return (
    <div className="wrap !pb-0">
      {/* Wraps to two rows at 390 rather than scrolling a tab out of sight. */}
      <div role="tablist" aria-label="Toolkit sections" onKeyDown={onKey}
        className="flex flex-wrap gap-1.5">
        {tabs.map(t => {
          const on = t.id === tab
          return (
            <button key={t.id} id={'kit-tab-' + t.id} type="button" role="tab"
              aria-selected={on} aria-controls="kit-panel" tabIndex={on ? 0 : -1}
              onClick={() => onTab(t.id)}
              className={cn('min-h-[44px] shrink-0 rounded-full border border-rule px-4 font-display text-ui font-semibold',
                'transition-colors duration-150',
                on ? 'border-accent bg-accent-wash text-accent-ink' : 'bg-card text-ink-2 hoverOnly:bg-mist hoverOnly:text-ink')}>
              {t.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* The teen's level, badges and a tool to try next, over every teen tab. */
function Player({ who, tab }) {
  if (who !== 'student') return null
  return <PlayerCard tab={tab === 'mine' ? 'exercise' : tab} className="mb-6"/>
}

function SkillPanel({ group, who }) {
  return (
    <div className="wrap">
      <Player who={who} tab={group.id}/>
      <Head first title={group.sub} line={SKILL_LINE[who] || SKILL_LINE.student}/>
      <Grid items={group.tools.map(t => ({ ...t, route:'toolkit-' + t.id }))}/>
    </div>
  )
}

export default function Toolkit({ who = 'student', open = null }) {
  const [here, setHere] = React.useState(null)
  const [tab, setTab] = React.useState(tabFromHash)
  const onTab = id => {
    setTab(id)
    history.replaceState(null, '', id === 'mine' ? '#/toolkit' : '#/toolkit?tab=' + id)
  }

  const Routed = open && ROUTED[open]
  if (Routed) return <Routed/>

  const Direct = open && IN_PLACE[open]
  if (Direct) return <Direct/>

  const skill = open && SKILL_BY_ID[open]
  if (skill) {
    const Tool = skill.Component
    return <Tool onExit={() => { location.hash = '#/toolkit?tab=' + skill.category }}/>
  }

  const Local = here && IN_PLACE[here]
  if (Local) return <Local onBack={() => { setHere(null); window.scrollTo(0, 0) }}/>

  const group = SKILL_GROUPS.find(g => g.id === tab)
  const panel = tab === 'resources' ? (
    <div className="wrap">
      <Head first title="Videos and podcasts" line="Free, from outside MindMap. Each opens in a new tab."/>
      <div className="mt-4"><ResourceList/></div>
    </div>
  ) : group ? <SkillPanel group={group} who={who}/> : (
    <>
      {who === 'student' && <div className="wrap !pb-0"><Player who={who} tab="mine"/></div>}
      <ToolkitIndex who={who} onOpen={setHere}/>
    </>
  )
  return (
    <>
      <Tabs who={who} tab={tab} onTab={onTab}/>
      <div id="kit-panel" role="tabpanel" aria-labelledby={'kit-tab-' + tab} className="[&>.wrap]:!pt-5">
        {panel}
      </div>
    </>
  )
}
