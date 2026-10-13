import React from 'react'
import { ToolkitIndex } from '../toolkit/index.jsx'
import Breathing from '../toolkit/breathing'
import Grounding from '../toolkit/ground'
import Reframe from '../toolkit/reframe'
import BodyScan from '../toolkit/scan'
import MoveBreak from '../toolkit/move'
import { ParentOpeners, ParentPhrasing, ParentScore, ParentRules, ParentReach } from '../toolkit/parent'

/* The Toolkit, as a router rather than as a page of collapsibles.
 *
 * `who` is 'student' or 'parent' and comes from whichever app the reader walked
 * in from. `open` names an activity and comes from the route table in
 * src/views/App.jsx, which maps the five ids spec 0e section 18 fixes:
 *
 *   toolkit-breathing  -> open="breathing"   Box Breathing
 *   toolkit-ground     -> open="ground"      5-4-3-2-1 Grounding
 *   toolkit-reframe    -> open="reframe"     Thought Reframe
 *   toolkit-scan       -> open="scan"        Body Scan
 *   toolkit-move       -> open="move"        Movement Break
 *
 * With no `open` this renders the index. With an `open` it renders that one
 * activity as the whole screen, with its own way back: the index is not in the
 * document at all while an activity is on it, which is the difference between
 * a route and an accordion and the whole of what the owner asked for here.
 *
 * The five student activities are audience-independent, so a parent who lands
 * on one gets the activity rather than a redirect; breathing, a body scan and
 * a movement break are no less useful to the person doing the worrying.
 *
 * THE PARENT SET HAS NO ROUTES YET. App.jsx's table has five toolkit ids and
 * they belong to the student activities. The five parent activities are
 * therefore opened in place, in the same full-screen shell, with a `onBack`
 * control instead of a hash link. The ids are already wired here, so adding
 * them to App.jsx is five lines there and nothing here:
 *
 *   'toolkit-openers'  -> <Toolkit who={audience} open="openers"/>
 *   'toolkit-phrasing' -> <Toolkit who={audience} open="phrasing"/>
 *   'toolkit-score'    -> <Toolkit who={audience} open="score"/>
 *   'toolkit-rules'    -> <Toolkit who={audience} open="rules"/>
 *   'toolkit-reach'    -> <Toolkit who={audience} open="reach"/>
 *
 * Nothing in this screen calls a server, and the two sensors that can be
 * switched on inside an activity are measured in the page and never recorded.
 * Each activity says so where its sensor is turned on. The explanatory privacy
 * panel that used to sit at the foot of this page is gone. */

const ROUTED = {
  breathing: Breathing,
  ground:    Grounding,
  reframe:   Reframe,
  scan:      BodyScan,
  move:      MoveBreak,
}

const IN_PLACE = {
  openers:  ParentOpeners,
  phrasing: ParentPhrasing,
  score:    ParentScore,
  rules:    ParentRules,
  reach:    ParentReach,
}

export default function Toolkit({ who = 'student', open = null }) {
  /* Only the parent set uses this. A routed activity never reads it, so a
     reader arriving straight on #/toolkit-scan is not holding any state that
     has to be cleared. */
  const [here, setHere] = React.useState(null)

  const Routed = open && ROUTED[open]
  if (Routed) return <Routed/>

  /* A route for one of the parent activities, if App.jsx grows them, takes the
     same shell and sends its way back to the index route. */
  const Direct = open && IN_PLACE[open]
  if (Direct) return <Direct/>

  const Local = here && IN_PLACE[here]
  if (Local) return <Local onBack={() => setHere(null)}/>

  return <ToolkitIndex who={who} onOpen={setHere}/>
}
