import React from 'react'
import { Chevron } from '../ui/marks'
import { cn } from '../lib/utils'
import { vars } from './theme'
import { SCORE } from '../lib/terms'
import '../kit/kit.css'

/* The Toolkit index: a grid of rows, each an icon, a name and one line.
 *
 * The drawn tiles that used to lead each row (src/toolkit/marks.jsx) are gone.
 * The owner read them as self-designed diagrams standing in for tools, and
 * he was right: a picture of a breathing square is not a pacer. Each row now
 * carries a 24px line mark, the activity's name and at most eight words, and
 * the tool itself is on the activity's own route.
 *
 * Text budget (spec 0f): counted whole, the index is 78 words. One line of
 * reassurance (6), three group labels (5), nine names (18), nine lines (49).
 * Names and lines alone are 67. At 390 only the first group is above the
 * fold, and that is 23 words.
 *
 * At 1280 the rows sit three across; at 390 one under another, broken into
 * two groups so no run of similar rows passes three (spec 0e section 14). */

/* 24px line marks, stroke 1.6, the same vocabulary as src/ui/marks.jsx. */
const I = ({ children }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden focusable="false"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
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

/* `items` is read by src/views/Methods.jsx for a count, so the shape stays. */
export const STUDENT_GROUPS = [
  { label:'Body', items:[
    { id:'breathing', route:'toolkit-breathing', family:'tide',  icon:BreathIcon,
      title:'Box Breathing',       line:'Four counts, a ring keeps pace' },
    { id:'scan',      route:'toolkit-scan',      family:'pool',  icon:ScanIcon,
      title:'Body Scan',           line:'Seven regions on a timer' },
    { id:'move',      route:'toolkit-move',      family:'night', icon:MoveIcon,
      title:'Movement Break',      line:'Camera meter fills as you move' },
  ]},
  { label:'Mind', items:[
    { id:'ground',    route:'toolkit-ground',    family:'stone', icon:GroundIcon,
      title:'5-4-3-2-1 Grounding', line:'Tap what the camera finds' },
    { id:'reframe',   route:'toolkit-reframe',   family:'leaf',  icon:ReframeIcon,
      title:'Thought Reframe',     line:'Three fields, your own words' },
  ]},
  { label:'Beyond the screen', items:[
    { id:'sigh',      route:'toolkit-sigh',      family:'tide',  icon:SighIcon,
      title:'Sigh coach',          line:'Your exhale, measured by the mic' },
    { id:'chest',     route:'toolkit-chest',     family:'pool',  icon:ChestIcon,
      title:'Chest breathing',     line:'Phone on your chest, eyes closed' },
    { id:'steady',    route:'toolkit-steady',    family:'stone', icon:SteadyIcon,
      title:'Steady hand',         line:'Keep the dot still, ring breathes' },
    { id:'alert',     route:'toolkit-alert',     family:'night', icon:AlertIcon,
      title:'Alertness check',     line:'Sixty seconds of taps' },
  ]},
]

export const PARENT_GROUPS = [
  { label:'Talking', items:[
    { id:'openers',  family:'leaf',  icon:TalkIcon,  title:'Conversation Openers',    line:'One intention, said two ways' },
    { id:'phrasing', family:'tide',  icon:CheckIcon, title:'Opening Line Check',      line:'Your line, checked in the page' },
  ]},
  { label:'Reading', items:[
    { id:'score',    family:'stone', icon:DialIcon,  title:`Reading the ${SCORE}`,    line:'What a high fortnight carries' },
    { id:'rules',    family:'night', icon:RulesIcon, title:'Conversation Ground Rules', line:'Six rules before anybody speaks' },
    { id:'reach',    family:'pool',  icon:ReachIcon, title:'When to Get Help',        line:'Who to tell, and when' },
  ]},
]

function Row({ item, index, onOpen }) {
  const As = item.route ? 'a' : 'button'
  const props = item.route ? { href:'#/' + item.route } : { type:'button', onClick:() => onOpen(item.id) }
  const Icon = item.icon
  return (
    <As {...props} style={{ ...vars(item.family), animationDelay:`${Math.min(index, 6) * 45}ms` }}
      className={cn('kit-card kit-settle kit-ground flex w-full items-center gap-3',
        'rounded-panel border-2 border-ink p-3 text-left')}>
      <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-panel
        border-2 border-ink bg-card text-ink">
        <Icon/>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-ui font-bold tracking-tight text-ink">{item.title}</span>
        <span className="mt-0.5 block text-fine text-ink-2">{item.line}</span>
      </span>
      <Chevron aria-hidden className="size-4 shrink-0 text-ink"/>
    </As>
  )
}

export function ToolkitIndex({ who = 'student', onOpen = () => {} }) {
  const groups = who === 'parent' ? PARENT_GROUPS : STUDENT_GROUPS
  let n = -1
  return (
    <div className="wrap">
      <p className="text-fine text-ink-3">
        {who === 'parent' ? 'Nothing here is shown to your teenager.' : 'Nobody is told which you opened.'}
      </p>
      {groups.map(g => (
        <section key={g.label} className="mt-4">
          <h3 className="mark">{g.label}</h3>
          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map(it => <Row key={it.id} item={it} index={++n} onOpen={onOpen}/>)}
          </div>
        </section>
      ))}
    </div>
  )
}
