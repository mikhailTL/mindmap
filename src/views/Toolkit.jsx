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
import { ParentOpeners, ParentPhrasing, ParentScore, ParentRules, ParentReach } from '../toolkit/parent'

/* The Toolkit, as a router.
 *
 * `who` is 'student' or 'parent'. `open` names an activity and comes from the
 * route table in src/views/App.jsx:
 *
 *   toolkit-breathing  -> open="breathing"   Box Breathing
 *   toolkit-ground     -> open="ground"      5-4-3-2-1 Grounding
 *   toolkit-reframe    -> open="reframe"     Thought Reframe
 *   toolkit-scan       -> open="scan"        Body Scan
 *   toolkit-move       -> open="move"        Movement Break
 *   toolkit-sigh       -> open="sigh"        Sigh coach
 *   toolkit-chest      -> open="chest"       Chest breathing
 *   toolkit-steady     -> open="steady"      Steady hand
 *   toolkit-alert      -> open="alert"       Alertness check
 *
 * With no `open` this renders the index. With an `open` it renders that one
 * activity as the whole screen. The nine student activities are audience
 * independent, so a parent who lands on one gets the activity.
 *
 * THE PARENT SET HAS NO ROUTES YET. Its five activities open in place in the
 * same shell with an `onBack` control. The ids are wired here, so adding them
 * to App.jsx is five lines there:
 *
 *   'toolkit-openers'  -> <Toolkit who={audience} open="openers"/>
 *   'toolkit-phrasing' -> <Toolkit who={audience} open="phrasing"/>
 *   'toolkit-score'    -> <Toolkit who={audience} open="score"/>
 *   'toolkit-rules'    -> <Toolkit who={audience} open="rules"/>
 *   'toolkit-reach'    -> <Toolkit who={audience} open="reach"/>
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
}

const IN_PLACE = {
  openers:  ParentOpeners,
  phrasing: ParentPhrasing,
  score:    ParentScore,
  rules:    ParentRules,
  reach:    ParentReach,
}

export default function Toolkit({ who = 'student', open = null }) {
  const [here, setHere] = React.useState(null)

  const Routed = open && ROUTED[open]
  if (Routed) return <Routed/>

  const Direct = open && IN_PLACE[open]
  if (Direct) return <Direct/>

  const Local = here && IN_PLACE[here]
  if (Local) return <Local onBack={() => setHere(null)}/>

  return <ToolkitIndex who={who} onOpen={setHere}/>
}
