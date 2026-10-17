import Cram from './cram.jsx'
import Sources from './sources.jsx'
import Enough from './enough.jsx'
import Active from './active.jsx'
import { CramIcon, SourceIcon, EnoughIcon, ActiveIcon } from './ui.jsx'

/* School: academic success and executive functioning. One working tool per
 * problem the owner listed. Each Component takes { onExit } and saves only to
 * localStorage under `mindmap.skills.<id>`. */

export const CATEGORY = { id:'school', title:'School', sub:'Academic success', family:'sky' }

export const TOOLS = [
  { id:'school-cram', title:'Time-Block Planner', line:'Spread work before it is due',
    family:'sky', icon:CramIcon, Component:Cram },
  { id:'school-sources', title:'Source Checker', line:'Six checks before you trust it',
    family:'lilac', icon:SourceIcon, Component:Sources },
  { id:'school-good-enough', title:'Good Enough Meter', line:'Know when it is ready',
    family:'coral', icon:EnoughIcon, Component:Enough },
  { id:'school-active', title:'Active Recall', line:'Notes into questions and quizzes',
    family:'mint', icon:ActiveIcon, Component:Active },
]
