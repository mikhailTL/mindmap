import Cram from './cram.jsx'
import Sources from './sources.jsx'
import Enough from './enough.jsx'
import Active from './active.jsx'
import { CramIcon, SourceIcon, EnoughIcon, ActiveIcon } from './ui.jsx'

export const CATEGORY = { id:'school', title:'School', sub:'Academic success', family:'sky' }

export const TOOLS = [
  { id:'school-cram', title:'Time-Block Planner', line:'Spread homework over the nights before it is due',
    family:'sky', icon:CramIcon, Component:Cram },
  { id:'school-sources', title:'Source Checker', line:'Check if a source can be trusted',
    family:'lilac', icon:SourceIcon, Component:Sources },
  { id:'school-good-enough', title:'Good Enough Meter', line:'Decide when your work is ready to hand in',
    family:'coral', icon:EnoughIcon, Component:Enough },
  { id:'school-active', title:'Active Recall', line:'Turn your notes into quiz questions',
    family:'mint', icon:ActiveIcon, Component:Active },
]
