import React from 'react'
import { List, Item } from '../ui/list'
import { Panel, riseAt } from '../kit/panel'
import { Router } from '../kit/router'
import { Pacer } from '../kit/pacer'
import { FeelingMap } from '../kit/feelings'
import { Pile } from '../kit/pile'
import { Absolutes } from '../kit/words'
import { Senses } from '../kit/senses'
import { Openers } from '../kit/openers'
import { PhraseCheck } from '../kit/phrasecheck'
import { Meaning } from '../kit/meaning'
import {
  BreathMark, MapMark, ReframeMark, GroundMark, PileMark,
  OpenersMark, CheckMark, GaugeMark, RulesMark, HelpMark,
} from '../kit/glyphs'
import { SCORE } from '../lib/terms'

/* Teen Toolkit.
 *
 * `who` is 'student' or 'parent'. The two share this shell and nothing else:
 * a student is regulating themselves and a parent is helping somebody else,
 * which are different activities, not one activity with different copy.
 *
 * Every activity is named as a feature rather than described as an action.
 * "Two ways to open it" told a reader nothing before they tapped it; the name
 * now says what the thing is, the line under it says what it does, and where
 * the activity is a known technique it carries the known name so it is legible
 * on sight. A name that overstates the tool is worse than a vague one, so
 * nothing is named after a method it does not implement: the breathing one is
 * resonance breathing because that is the rate it runs, not box breathing.
 *
 * Nothing in here calls anything. Every tool is local logic on what the reader
 * typed or tapped, which is the only kind of claim a static build can make
 * honestly. Nothing is labelled as intelligence it does not have. */

const STUDENT = [
  { id:'pacer', title:'Resonance Breathing', time:'2 to 5 min', Body: Pacer, mark: BreathMark,
    lede:'Paced at five to six breaths a minute, or tap your own rate.' },
  { id:'feelings', title:'Mood Map', time:'1 min', Body: FeelingMap, mark: MapMark,
    lede:'One dot between energy and feeling bad or good, then a word for it.' },
  { id:'words', title:'Thought Reframe', time:'3 min', Body: Absolutes, mark: ReframeMark,
    lede:'Marks the absolute words in your own sentence, one question each.' },
  { id:'senses', title:'5-4-3-2-1 Grounding', time:'3 min', Body: Senses, mark: GroundMark,
    lede:'Five things you can see down to one you can taste, counted for you.' },
  { id:'pile', title:'Brain Dump', time:'5 to 10 min', Body: Pile, mark: PileMark,
    lede:'Dump it all out, split today from not today, pick one first move.' },
]

const PARENT = [
  { id:'openers', title:'Conversation Openers', time:'3 min', Body: Openers, mark: OpenersMark,
    lede:'The same intention as a check and as a question, five situations.' },
  { id:'phrase', title:'Opening Line Check', time:'2 min', Body: PhraseCheck, mark: CheckMark,
    lede:'Your opening line against ten phrasings that close one down.' },
  { id:'meaning', title:`Reading the ${SCORE}`, time:'4 min', Body: Meaning, mark: GaugeMark,
    lede:'Six things parents read into a high fortnight, and what it carries.' },
  { id:'before', title:'Conversation Ground Rules', time:'2 min', mark: RulesMark, tone:'quiet',
    lede:'Six things that decide how it goes before anybody speaks.' },
  { id:'worried', title:'When to Get Help', time:'1 min', mark: HelpMark, tone:'quiet',
    lede:'When this stops being a conversation at home, and who to tell.' },
]

const BEFORE = [
  'Pick a moment with an end to it: a car journey, a walk to the shop, the washing up. A conversation with an exit is easier to start than one across a table.',
  'Lead with what you saw yourself, never with what you read. “You were quiet at dinner” outranks any number on this phone.',
  'Ask one question and then stop talking. The silence after it is the part doing the work.',
  'Do not solve it in the first two minutes. Most of it does not need solving and all of it needs hearing first.',
  'Say what you are not about to do: ring the school, take the phone, call her friend’s mother. A lot of teenagers are managing the consequences of telling you, rather than the thing itself.',
  'Never put her next to a sibling or a classmate. Being evaluated against other people was the largest single predictor of a cortisol response across 208 studies (Dickerson and Kemeny, 2004), which makes a comparison the one move with measured physiological cost.',
]

const WORRIED = [
  'Nothing in MindMap is a diagnosis, and neither is a high fortnight. It is four signals against her own normal.',
  'You do not need a threshold to make a call. “She has not been herself for a month” is a reason a GP or a school counsellor will act on.',
  'Say you are doing it, and why, before you do it. Finding out afterwards is the part that ends the conversations.',
  'If she is in danger now, that is an emergency number or a crisis line, not an app.',
]

function Static({ id }) {
  const rows = id === 'before' ? BEFORE : WORRIED
  return (
    <>
      {/* The rows arrive in reading order rather than as one block, which is
          the order they are meant to be used in. */}
      <List>
        {rows.map((r, i) => (
          <Item key={r} className="kit-rise" style={riseAt(i)}>
            <span className="text-body text-ink-2">{r}</span>
          </Item>
        ))}
      </List>
      {id === 'before' && (
        <p className="mt-5 max-w-[58ch] text-sec text-ink-2">Offers outperform requirements here, and
          that is measured rather than assumed: across trials built on self-determination theory,
          support for a person’s own choice is what predicted them staying with a change
          (Ntoumanis and others, 2021). Phrased as an offer it has a chance. Phrased as a condition it
          has less.</p>
      )}
    </>
  )
}

export default function Toolkit({ who = 'student' }) {
  const parent = who === 'parent'
  const items = parent ? PARENT : STUDENT
  const [open, setOpen] = React.useState(() => new Set())
  const refs = React.useRef({})

  const set = (id, on) => setOpen(s => {
    const next = new Set(s)
    on ? next.add(id) : next.delete(id)
    return next
  })

  /* The router opens a panel and brings it to the top of the screen. Smooth is
     passed explicitly, so reduced motion has to be checked here: a behaviour
     given to scrollIntoView overrides the CSS. */
  const reveal = id => {
    set(id, true)
    const soft = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    requestAnimationFrame(() => {
      refs.current[id]?.scrollIntoView({ block: 'start', behavior: soft ? 'smooth' : 'auto' })
    })
  }

  return (
    <div className="wrap">
      {/* Two columns from lg. A single centred stack of full-width panels is
          the shape the spec exists to stop, and this page has two genuinely
          different jobs to put side by side: deciding which tool to open, and
          the tools themselves. The app shell's top bar carries the h1, so
          nothing in here is one. */}
      <div className="grid gap-3 lg:grid-cols-[21rem_minmax(0,1fr)] lg:gap-4">
        <div className="flex flex-col gap-3">
          {/* The lede and the privacy line are body text, so they are in a
              container rather than sitting on the app's tinted ground. */}
          <section className="rounded-panel border border-rule bg-card p-4 sm:p-5">
            <h2 className="font-display text-row font-bold tracking-tight text-ink">Teen Toolkit</h2>
            <p className="mt-2 max-w-[46ch] text-sec text-ink-2">
              {parent
                ? `Helping somebody through it is a different job from settling yourself, so none of this is a breathing exercise. None of it depends on the ${SCORE} being high this week.`
                : 'Five things to do when the day has run high. Try one, try three, try none of them. Nothing here is counted and nothing is a streak.'}
            </p>
            <p className="mt-4 max-w-[46ch] border-l-2 border-accent pl-4 text-sec text-ink-2">
              All of this runs in your browser. Nothing you type or tap on this screen is saved, sent or
              shared {parent ? 'with your teenager, with MindMap, or with anybody else' : 'to MindMap, to a parent, or to anybody else'}.
              Close the panel and it is gone.
            </p>
          </section>

          {!parent && <Router items={items} onOpen={reveal}/>}
        </div>

        <div className="flex flex-col gap-3">
          {items.map(it => (
            <Panel key={it.id} id={`kit-${it.id}`} title={it.title} time={it.time} lede={it.lede}
              mark={it.mark} tone={it.tone}
              open={open.has(it.id)} onOpenChange={on => set(it.id, on)}
              panelRef={el => { refs.current[it.id] = el }}>
              {it.Body ? <it.Body/> : <Static id={it.id}/>}
            </Panel>
          ))}
          {/* Foot of the list rather than foot of the intro, because it is
              about the list and because the two columns end nearer together
              with it here. */}
          <p className="note rounded-panel border border-rule bg-card p-4 sm:p-5">
            {parent
              ? 'None of these are exercises for your teenager to be given. The student side of the app has its own, and they are hers to open or ignore.'
              : 'Nobody is told which of these you opened. Your parent’s side of the app has its own list, and it does not include this screen.'}
          </p>
        </div>
      </div>
    </div>
  )
}
