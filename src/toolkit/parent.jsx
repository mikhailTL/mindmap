import React from 'react'
import { ActivityScreen, Sheet, Step, Note, riseAt } from './shell'
import { Openers } from '../kit/openers'
import { PhraseCheck } from '../kit/phrasecheck'
import { Meaning } from '../kit/meaning'
import { SCORE } from '../lib/terms'

/* The parent side of the Toolkit, in the same shell as the student side.
 *
 * Helping somebody through a bad fortnight is a different job from settling
 * yourself, which is why none of these is a breathing exercise. Three of them
 * are the tools already written for this audience, lifted out of the
 * collapsible they used to open inside and given a screen; two are written
 * here, because they are a list of things to know rather than a thing to
 * operate.
 *
 * Nothing here depends on the Mind Score being high this week, and nothing a
 * parent reads on these screens is reported to their teenager or to anybody
 * else. */

const RULES = [
  'Pick a moment with an end to it: a car journey, a walk to the shop, the washing up. A conversation with an exit is easier to start than one across a table.',
  'Lead with what you saw yourself, never with what you read. "You were quiet at dinner" outranks any number on this phone.',
  'Ask one question and then stop talking. The silence after it is the part doing the work.',
  'Do not solve it in the first two minutes. Most of it does not need solving and all of it needs hearing first.',
  'Say what you are not about to do: ring the school, take the phone, call her friend’s mother. A lot of teenagers are managing the consequences of telling you, rather than the thing itself.',
  'Never put her next to a sibling or a classmate. Being evaluated against other people was the largest single predictor of a cortisol response across 208 studies (Dickerson and Kemeny, 2004), which makes a comparison the one move with a measured physiological cost.',
]

const REACH = [
  `Nothing in MindMap is a diagnosis, and neither is a high fortnight. It is four signals against her own normal.`,
  'You do not need a threshold to make a call. "She has not been herself for a month" is a reason a GP or a school counsellor will act on.',
  'Say you are doing it, and why, before you do it. Finding out afterwards is the part that ends the conversations.',
  'If she is in danger now, that is an emergency number or a crisis line, not an app.',
]

/* A list of things to know. Rules with a hairline between them rather than
   numbered discs: the order is the order of the conversation, not a ranking,
   and a column of filled circles with figures in them is one of the patterns
   spec 0d strikes out. */
function Rows({ rows }) {
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {rows.map((r, i) => (
        <li key={r} style={riseAt(i)}
          className="kit-rise flex items-start gap-3 border-t-2 border-ink py-3 first:border-t-0 first:pt-0">
          <span aria-hidden className="kit-fill mt-[0.55em] size-2.5 shrink-0 rounded-bar"/>
          <span className="min-w-0 flex-1 max-w-[62ch] text-sec text-ink-2">{r}</span>
        </li>
      ))}
    </ul>
  )
}

export function ParentOpeners(p) {
  return (
    <ActivityScreen {...p} family="leaf" title="Conversation Openers" minutes="3 minutes"
      lede="Pick the situation you are actually in and see the same intention said two ways: one that reads as a check on her, one that opens a conversation.">
      <Sheet><Openers/></Sheet>
    </ActivityScreen>
  )
}

export function ParentPhrasing(p) {
  return (
    <ActivityScreen {...p} family="tide" title="Opening Line Check" minutes="2 minutes"
      lede="Write the line you were about to open with. The page matches it against ten written phrasings and says what each one does to the conversation.">
      <Sheet><PhraseCheck/></Sheet>
      <Sheet className="mt-3">
        <Note>The whole tool is a list of ten phrasings and a lookup, matched in this page. Your
          line is not saved, sent or shown to anybody.</Note>
      </Sheet>
    </ActivityScreen>
  )
}

export function ParentScore(p) {
  return (
    <ActivityScreen {...p} family="stone" title={`Reading the ${SCORE}`} minutes="4 minutes"
      lede={`Six things parents read into a high fortnight, and what the ${SCORE} can actually support.`}>
      <Sheet><Meaning/></Sheet>
    </ActivityScreen>
  )
}

export function ParentRules(p) {
  return (
    <ActivityScreen {...p} family="night" title="Conversation Ground Rules" minutes="2 minutes"
      lede="Six things that decide how a conversation goes before anybody has spoken.">
      <Sheet><Rows rows={RULES}/></Sheet>
      <Sheet className="mt-3">
        <Step>Why an offer beats a condition</Step>
        <Note className="mt-2.5">Across trials built on self-determination theory, support for a
          person&rsquo;s own choice is what predicted them staying with a change (Ntoumanis and others,
          2021). Phrased as an offer it has a chance. Phrased as a condition it has less.</Note>
      </Sheet>
    </ActivityScreen>
  )
}

export function ParentReach(p) {
  return (
    <ActivityScreen {...p} family="pool" title="When to Get Help" minutes="1 minute"
      lede="When a conversation at home stops being the right tool, and who to tell instead.">
      <Sheet><Rows rows={REACH}/></Sheet>
    </ActivityScreen>
  )
}
