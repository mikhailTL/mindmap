import React from 'react'
import { List, Item } from '../ui/list'
import { Panel } from '../kit/panel'
import { Router } from '../kit/router'
import { Pacer } from '../kit/pacer'
import { FeelingMap } from '../kit/feelings'
import { Pile } from '../kit/pile'
import { Absolutes } from '../kit/words'
import { Senses } from '../kit/senses'
import { Openers } from '../kit/openers'
import { PhraseCheck } from '../kit/phrasecheck'
import { Meaning } from '../kit/meaning'
import { SCORE } from '../lib/terms'

/* Teen Toolkit.
 *
 * `who` is 'student' or 'parent'. The two share this shell and nothing else:
 * a student is regulating themselves and a parent is helping somebody else,
 * which are different activities, not one activity with different copy.
 *
 * Nothing in here calls anything. Every tool is local logic on what the reader
 * typed or tapped, which is the only kind of claim a static build can make
 * honestly. Nothing is labelled as intelligence it does not have. */

const STUDENT = [
  { id:'pacer', title:'Paced breathing', time:'2 to 5 min', Body: Pacer,
    lede:'A circle to breathe with at five to six breaths a minute, or at the pace you tap in yourself.' },
  { id:'feelings', title:'Feeling map', time:'1 min', Body: FeelingMap,
    lede:'Put a dot on two axes and get the closest word out of sixteen. Wound up and flat are both bad days and they need opposite things.' },
  { id:'words', title:'Absolute words', time:'3 min', Body: Absolutes,
    lede:'Write the sentence you are saying to yourself. It flags the absolute words in it and asks one question about each.' },
  { id:'senses', title:'Senses count', time:'3 min', Body: Senses,
    lede:'Five things you can see, four you can hear, down to one. It holds the count and the list.' },
  { id:'pile', title:'The pile', time:'5 to 10 min', Body: Pile,
    lede:'Write down everything on your mind, split it into what can move today and what cannot, then one first move on the top one.' },
]

const PARENT = [
  { id:'openers', title:'Two ways to open it', time:'3 min', Body: Openers,
    lede:'Pick the situation you are in tonight and see the same intention said as a check and said as a question.' },
  { id:'phrase', title:'Check a sentence', time:'2 min', Body: PhraseCheck,
    lede:'Type what you were going to say. It matches a short list of phrasings that tend to close a conversation.' },
  { id:'meaning', title:'What a high week does and does not mean', time:'4 min', Body: Meaning,
    lede:`Six things parents read into a ${SCORE}, and what the reading can actually carry.` },
  { id:'before', title:'Before you start', time:'2 min',
    lede:'Six things that decide how the conversation goes before either of you says anything.' },
  { id:'worried', title:'If you are worried', time:'1 min',
    lede:'When this stops being a conversation at home, and what to do about it.' },
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
      <List>
        {rows.map(r => <Item key={r}><span className="text-body text-ink-2">{r}</span></Item>)}
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
      <h1 className="font-display font-bold tracking-tight text-ink">Teen Toolkit</h1>
      <p className="mt-3 max-w-[54ch] text-body text-ink-2">
        {parent
          ? `Helping somebody through it is a different job from settling yourself, so none of this is a breathing exercise. None of it depends on the ${SCORE} being high this week.`
          : 'Five things to do when the day has run high. Try one, try three, try none of them. Nothing here is counted and nothing is a streak.'}
      </p>

      <p className="mt-5 max-w-[58ch] border-l-2 border-accent pl-4 text-sec text-ink-2">
        All of this runs in your browser. Nothing you type or tap on this screen is saved, sent or
        shared {parent ? 'with your teenager, with MindMap, or with anybody else' : 'to MindMap, to a parent, or to anybody else'}.
        Close the panel and it is gone.
      </p>

      {!parent && (
        <div className="mt-7">
          <Router items={items} onOpen={reveal}/>
        </div>
      )}

      <div className="mt-7 flex flex-col gap-3.5">
        {items.map(it => (
          <Panel key={it.id} id={`kit-${it.id}`} title={it.title} time={it.time} lede={it.lede}
            open={open.has(it.id)} onOpenChange={on => set(it.id, on)}
            panelRef={el => { refs.current[it.id] = el }}>
            {it.Body ? <it.Body/> : <Static id={it.id}/>}
          </Panel>
        ))}
      </div>

      <p className="note mt-7 max-w-[58ch]">
        {parent
          ? 'None of these are exercises for your teenager to be given. The student side of the app has its own, and they are hers to open or ignore.'
          : 'Nobody is told which of these you opened. Your parent’s side of the app has its own list, and it does not include this screen.'}
      </p>
    </div>
  )
}
