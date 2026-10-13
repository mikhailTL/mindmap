import React from 'react'
import { Chevron } from '../ui/marks'
import { cn } from '../lib/utils'
import { vars } from './theme'
import { Mark, BreathMark, ScanMark, MoveMark, GroundMark, ReframeMark,
         TalkMark, CheckLineMark, DialMark, RulesMark, ReachMark } from './marks'
import { SCORE } from '../lib/terms'
import '../kit/kit.css'

/* The Toolkit index.
 *
 * It used to be five posters: a 440 by 150 drawing, a heading at display size,
 * a sentence, a filled duration pill and a collapsible underneath, stacked in
 * a 22rem-and-the-rest two column grid that left a column of air on a laptop
 * and a 300px-tall card per activity on a phone. The owner read it exactly as
 * it was: boxes too big, blank space, and activities opening in place "like
 * low effort instead of rerouting".
 *
 * So the index is a list and nothing else. One row per activity, 44px mark,
 * the feature's own name, one line of what it does, the time, and a chevron,
 * on a ground of the activity's own colour with the heavy edge and the hard
 * offset shadow that section 7b asks for. The row is the whole target, which
 * is 56px of height and the full width of the column. Opening one leaves the
 * page: every row is a link to a route, so Back works and the index is not on
 * the screen while an activity is.
 *
 * TWO GROUPS, NOT ONE RUN. Spec 0e section 14 caps a run of similar cards at
 * three on a phone. Five rows in one list breaks that, so they are grouped
 * three and two under two ruled labels, which is also the more useful order:
 * the body ones first, because they are what somebody reaches for when they
 * cannot think straight.
 *
 * NAMES. Plain feature names, as asked: Box Breathing, Body Scan, Movement
 * Break, 5-4-3-2-1 Grounding, Thought Reframe. No epigrams and nothing named
 * after a method it does not implement.
 *
 * NO PRIVACY PANEL. The explanatory panel at the foot of the page is gone.
 * What it was for is said in one line where a sensor is actually switched on,
 * inside the activity, which is the only place it does any work. */

export const STUDENT_GROUPS = [
  { label:'Breath and Body', items:[
    { id:'breathing', route:'toolkit-breathing', family:'tide',   mark:BreathMark,
      title:'Box Breathing',     time:'2 to 5 min',
      line:'A four-count square, with a sound cue and a live breath level if you want them.' },
    { id:'scan',      route:'toolkit-scan',      family:'pool',  mark:ScanMark,
      title:'Body Scan',         time:'3 to 4 min',
      line:'Attention down the body, eight parts, with the page keeping the clock.' },
    { id:'move',      route:'toolkit-move',      family:'night',  mark:MoveMark,
      title:'Movement Break',    time:'2 to 3 min',
      line:'Three slow movements, and the camera measuring how fast you are actually going.' },
  ]},
  { label:'Thoughts and Senses', items:[
    { id:'ground',    route:'toolkit-ground',    family:'stone', mark:GroundMark,
      title:'5-4-3-2-1 Grounding', time:'3 min',
      line:'Five things you can see down to one you can taste, with object recognition for the first rung.' },
    { id:'reframe',   route:'toolkit-reframe',   family:'leaf',  mark:ReframeMark,
      title:'Thought Reframe',   time:'3 min',
      line:'The absolute words in your own sentence, marked, with one question each.' },
  ]},
]

export const PARENT_GROUPS = [
  { label:'Starting a Conversation', items:[
    { id:'openers',  family:'leaf',  mark:TalkMark,      title:'Conversation Openers', time:'3 min',
      line:'The same intention said as a check and as a question, across five situations.' },
    { id:'phrasing', family:'tide',   mark:CheckLineMark, title:'Opening Line Check',   time:'2 min',
      line:'Your opening line against ten phrasings that close a conversation down.' },
  ]},
  { label:'Reading and Responding', items:[
    { id:'score',    family:'stone', mark:DialMark,      title:`Reading the ${SCORE}`, time:'4 min',
      line:'Six things parents read into a high fortnight, and what the reading carries.' },
    { id:'rules',    family:'night',  mark:RulesMark,     title:'Conversation Ground Rules', time:'2 min',
      line:'Six things that decide how it goes before anybody has spoken.' },
    { id:'reach',    family:'pool',  mark:ReachMark,     title:'When to Get Help',     time:'1 min',
      line:'When a conversation at home stops being the right tool, and who to tell.' },
  ]},
]

/* One row. A link when the activity has a route, a button when it does not, so
   the parent set behaves the same before its routes exist. */
function Row({ item, index, onOpen }) {
  const As = item.route ? 'a' : 'button'
  const props = item.route ? { href:'#/' + item.route } : { type:'button', onClick:() => onOpen(item.id) }
  return (
    <As {...props} style={{ ...vars(item.family), animationDelay:`${Math.min(index, 6) * 45}ms` }}
      className={cn('kit-card kit-settle kit-ground group flex w-full items-center gap-3',
        'rounded-panel border-2 border-ink p-2.5 text-left sm:gap-3.5 sm:p-3')}>
      <Mark draw={item.mark}/>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-ui font-bold tracking-tight text-ink sm:text-meta">
          {item.title}
        </span>
        <span className="mt-0.5 block text-fine text-ink-2 [text-wrap:pretty]">{item.line}</span>
        <span className="mt-1 block font-display text-fine font-semibold text-ink-2">{item.time}</span>
      </span>
      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-panel border-2
        border-ink bg-card">
        <Chevron className="size-3.5 text-ink"/>
      </span>
    </As>
  )
}

export function ToolkitIndex({ who = 'student', onOpen = () => {} }) {
  const parent = who === 'parent'
  const groups = parent ? PARENT_GROUPS : STUDENT_GROUPS
  let n = -1
  return (
    <div className="wrap">
      <div className="mx-auto w-full max-w-[52rem]">
        <p className="max-w-[52ch] text-sec text-ink-2 [text-wrap:pretty]">
          {parent
            ? `Helping somebody through a bad fortnight is a different job from settling yourself, so none of this is a breathing exercise. None of it depends on the ${SCORE} being high this week.`
            : 'Things to try when the day has run high. Try one, try three, try none. Nothing here is counted and nothing is a streak.'}
        </p>
        <p className="mt-1.5 max-w-[52ch] text-fine text-ink-3">
          {parent
            ? 'The student side of the app has its own list, and these are not exercises to be handed out.'
            : 'Nobody is told which of these you opened.'}
        </p>

        {groups.map(g => (
          <section key={g.label} className="mt-5">
            <h3 className="mark">{g.label}</h3>
            <div className="mt-3 grid gap-2.5 lg:grid-cols-2">
              {g.items.map(it => <Row key={it.id} item={it} index={++n} onOpen={onOpen}/>)}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
