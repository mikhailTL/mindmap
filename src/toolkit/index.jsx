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
 * Text budget (spec 0f): the whole index is under 45 words. One line of
 * reassurance, two group labels, five names, five lines.
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
