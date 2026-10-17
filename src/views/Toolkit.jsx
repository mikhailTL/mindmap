import React from 'react'
import { ToolkitIndex } from '../toolkit/index.jsx'
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
 * THE MEDICAL PROFESSIONAL SET HAS NO ROUTES YET. It opens in place by state.
 * Adding routes is five lines in App.jsx:
 *
 *   'toolkit-pro-opener'   -> <Toolkit who="pro" open="pro-opener"/>
 *   'toolkit-pro-triage'   -> <Toolkit who="pro" open="pro-triage"/>
 *   'toolkit-pro-ground'   -> <Toolkit who="pro" open="pro-ground"/>
 *   'toolkit-pro-parents'  -> <Toolkit who="pro" open="pro-parents"/>
 *   'toolkit-pro-referral' -> <Toolkit who="pro" open="pro-referral"/>
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

export default function Toolkit({ who = 'student', open = null }) {
  const [here, setHere] = React.useState(null)

  const Routed = open && ROUTED[open]
  if (Routed) return <Routed/>

  const Direct = open && IN_PLACE[open]
  if (Direct) return <Direct/>

  const Local = here && IN_PLACE[here]
  if (Local) return <Local onBack={() => { setHere(null); window.scrollTo(0, 0) }}/>

  return <ToolkitIndex who={who} onOpen={setHere}/>
}
