import React from 'react'
import { Nameplate } from './nameplates/Nameplate.jsx'
import { SCORE } from '../lib/terms'
import '../kit/kit.css'

const I = ({ children }) => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden focusable="false"
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
    className="shrink-0">{children}</svg>
)
const BreathIcon  = () => <I><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3"/></I>
const ScanIcon    = () => <I><circle cx="12" cy="5" r="2.5"/><path d="M8 10h8l-1 6h-6zM10 16v5M14 16v5"/></I>
const MoveIcon    = () => <I><path d="M4 18l4-6 4 3 4-7 4 4"/></I>
const GroundIcon  = () => <I><circle cx="12" cy="12" r="3.5"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21"/></I>
const ReframeIcon = () => <I><path d="M4 7h16M4 12h10M4 17h7M17 15l2 2 3-4"/></I>
const TalkIcon    = () => <I><path d="M4 5h11v8H8l-4 3zM15 9h5v8l-3-2h-5v-3"/></I>
const CheckIcon   = () => <I><path d="M4 7h16M4 12h9M5 18l3 3 7-7"/></I>
const DialIcon    = () => <I><path d="M4 16a8 8 0 0 1 16 0"/><path d="M12 16l4-5"/><circle cx="12" cy="16" r="1.5"/></I>
const RulesIcon   = () => <I><path d="M5 7h14M5 12h10M5 17h12"/></I>
const ReachIcon   = () => <I><circle cx="9" cy="12" r="5"/><path d="M15 12h6m-3-3l3 3-3 3"/></I>
const SighIcon    = () => <I><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6"/></I>
const ChestIcon   = () => <I><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M9.5 12h1.5l1-3 2 6 1-3h1.5"/></I>
const SteadyIcon  = () => <I><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/></I>
const AlertIcon   = () => <I><circle cx="12" cy="13" r="7"/><path d="M12 9v4l3 2M10 3h4M12 3v3"/></I>
const PocketIcon  = () => <I><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M9.5 12c1 0 1-2.5 2.5-2.5s1.5 5 2.5 5 1-2.5 2.5-2.5"/></I>
const WalkIcon    = () => <I><circle cx="13" cy="4.5" r="1.8"/><path d="M9.5 21l2.5-7M12 9l-2 5 3.5 2 1 5M12 9l3 3h3M12 9l-3.5 1-1.5 3"/></I>
/* Counselor/Professional set */
const ScriptIcon  = () => <I><path d="M5 4h14v12H9l-4 4z"/><path d="M8.5 8.5h7M8.5 12h4.5"/></I>
const SignIcon    = () => <I><path d="M12 3v18M12 6h7l2 2.5-2 2.5h-7M12 13H5l-2 2.5L5 18h7"/></I>
const TimerIcon   = () => <I><circle cx="12" cy="13.5" r="7"/><path d="M12 9.5v4h3M9.5 3h5"/></I>
const FamilyIcon  = () => <I><circle cx="8" cy="7" r="2.6"/><circle cx="16.5" cy="9" r="2"/><path d="M3.5 19a4.5 4.5 0 0 1 9 0M13 19a3.5 3.5 0 0 1 7 0"/></I>
const NoteIcon    = () => <I><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h5"/></I>

// Also read by views/Methods.jsx and the landing Toolkit band; items keep id, route, family, icon, title, line.
export const STUDENT_GROUPS = [
  { label:'Calm your body', items:[
    { id:'breathing', route:'toolkit-breathing', family:'sky',    icon:BreathIcon,
      title:'Box Breathing',       line:'Breathe in time with a moving light' },
    { id:'scan',      route:'toolkit-scan',      family:'mint',   icon:ScanIcon,
      title:'Body Scan',           line:'Relax your body one part at a time' },
    { id:'move',      route:'toolkit-move',      family:'coral',  icon:MoveIcon,
      title:'Movement Break',      line:'Five gentle moves, 20 seconds each' },
  ]},
  { label:'Clear your head', items:[
    { id:'ground',    route:'toolkit-ground',    family:'sun',    icon:GroundIcon,
      title:'5-4-3-2-1 Grounding', line:'Find things you see, hear, feel, smell and taste' },
    { id:'reframe',   route:'toolkit-reframe',   family:'lilac',  icon:ReframeIcon,
      title:'Thought Reframe',     line:'Turn a harsh thought into a fairer one' },
  ]},
  { label:'Try it with your phone', items:[
    { id:'sigh',      route:'toolkit-sigh',      family:'aqua',   icon:SighIcon,
      title:'Long Exhale',         line:'Practice slow breaths out using the mic' },
    { id:'chest',     route:'toolkit-chest',     family:'blush',  icon:ChestIcon,
      title:'Breath Counter',      line:'Breathe with a wave, phone on your chest' },
    { id:'steady',    route:'toolkit-steady',    family:'accent', icon:SteadyIcon,
      title:'Hold Still',          line:'Tilt your phone to keep a marble in the middle' },
    { id:'alert',     route:'toolkit-alert',     family:'sun',    icon:AlertIcon,
      title:'Reaction Test',       line:'Tap each light as fast as you can' },
    { id:'pocket',    route:'toolkit-pocket',    family:'lilac',  icon:PocketIcon,
      title:'Breathing by Sound',  line:'Breathe along to a sound' },
    { id:'walk',      route:'toolkit-walk',      family:'coral',  icon:WalkIcon,
      title:'Short Walk',          line:'Take a 150 to 600 step walk' },
  ]},
]

export const PARENT_GROUPS = [
  { label:'Start the talk', items:[
    { id:'openers',  route:'toolkit-openers',  family:'coral', icon:TalkIcon,  title:'Conversation Openers',    line:'Ways to start a talk with your teen' },
    { id:'phrasing', route:'toolkit-phrasing', family:'lilac', icon:CheckIcon, title:'Opening Line Check',      line:'Check how your first words may sound' },
  ]},
  { label:'Know the next step', items:[
    { id:'score',    route:'toolkit-score',    family:'sky',   icon:DialIcon,  title:`Reading the ${SCORE}`,    line:'What the score can and cannot tell you' },
    { id:'rules',    route:'toolkit-rules',    family:'sun',   icon:RulesIcon, title:'Conversation Ground Rules', line:'Six tips for a calm talk' },
    { id:'reach',    route:'toolkit-reach',    family:'mint',  icon:ReachIcon, title:'When to Get Help',        line:'When to call for help, and who to call' },
  ]},
]

/* No routes: these open in place inside Toolkit.jsx. */
export const PRO_GROUPS = [
  { label:'For your sessions', items:[
    { id:'pro-opener',   family:'sky',   icon:ScriptIcon, title:'Session Openers',      line:'Questions to start a check-in' },
    { id:'pro-triage',   family:'sun',   icon:SignIcon,   title:'Next Step Guide',      line:'Pick a next step from the light and trend' },
    { id:'pro-ground',   family:'mint',  icon:TimerIcon,  title:'Grounding Timer',      line:'Run 5-4-3-2-1 grounding with a teen' },
    { id:'pro-parents',  family:'lilac', icon:FamilyIcon, title:'Talking With Parents', line:'Five steps to involve a parent, with consent' },
    { id:'pro-referral', family:'coral', icon:NoteIcon,   title:'Referral Note',        line:'Write a referral note to copy and send' },
  ]},
]

export const STUDENT_ITEMS = STUDENT_GROUPS.flatMap(g => g.items)
export const ALL_ITEMS = [...STUDENT_ITEMS, ...PARENT_GROUPS.flatMap(g => g.items),
                          ...PRO_GROUPS.flatMap(g => g.items)]

// Read by shell.jsx so a tool's screen matches its tile colour.
export const FAMILY_OF = Object.fromEntries(ALL_ITEMS.map(i => [i.id, i.family]))

export function Grid({ items, start = 0, onOpen = () => {} }) {
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
      {items.map((it, i) => <Nameplate key={it.id} item={it} index={start + i} onOpen={onOpen}/>)}
    </div>
  )
}

export function Head({ title, line, first }) {
  return (
    <div className={first ? 'mt-2' : 'mt-10'}>
      {/* h2: the app caps in-app h2 at text-row and h3 at text-meta. */}
      <h2 className="font-display font-bold tracking-tight text-ink">{title}</h2>
      {line && <p className="mt-1 max-w-[60ch] text-ui text-ink-2">{line}</p>}
    </div>
  )
}

function SubHead({ children }) {
  return <h3 className="mt-7 font-display font-bold text-ink">{children}</h3>
}

function Groups({ groups, start = 0, onOpen }) {
  let n = start
  return groups.map(g => {
    const at = n; n += g.items.length
    return (
      <section key={g.label} aria-label={g.label}>
        <SubHead>{g.label}</SubHead>
        <Grid items={g.items} start={at} onOpen={onOpen}/>
      </section>
    )
  })
}

const PARENT_COUNT = PARENT_GROUPS.reduce((n, g) => n + g.items.length, 0)
const PRO_COUNT = PRO_GROUPS.reduce((n, g) => n + g.items.length, 0)

export function ToolkitIndex({ who = 'student', onOpen = () => {} }) {
  if (who === 'parent') {
    return (
      <div className="wrap">
        <Head first title="For you" line="Nothing here is shown to your teenager."/>
        <Groups groups={PARENT_GROUPS} onOpen={onOpen}/>
        <Head title="Do these with your teen" line="The same exercises your teen has. Try one together."/>
        <Groups groups={STUDENT_GROUPS} start={PARENT_COUNT} onOpen={onOpen}/>
      </div>
    )
  }
  if (who === 'pro') {
    return (
      <div className="wrap">
        <Head first title="For your sessions" line="No teen data is held in these tools."/>
        <Grid items={PRO_GROUPS.flatMap(g => g.items)} start={0} onOpen={onOpen}/>
        <Head title="Use in a session" line="Exercises from the teen screen, to run with a teen in the room."/>
        <Groups groups={STUDENT_GROUPS} start={PRO_COUNT} onOpen={onOpen}/>
      </div>
    )
  }
  return (
    <div className="wrap">
      <Head first title="Your exercises" line="Nobody else sees which ones you open."/>
      <Groups groups={STUDENT_GROUPS} onOpen={onOpen}/>
    </div>
  )
}
