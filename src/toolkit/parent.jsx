import React from 'react'
import { ActivityScreen, Sheet } from './shell'
import { Openers } from '../kit/openers'
import { PhraseCheck } from '../kit/phrasecheck'
import { Meaning } from '../kit/meaning'
import { SCORE } from '../lib/terms'

/* The parent side of the Toolkit, in the same shell as the student side.
 *
 * Three of these are tools already written for this audience in src/kit/,
 * given a screen each. Two are short lists, one plain sentence a row
 * (spec 0f; rewritten plainly 18 October, owner). Nothing a parent reads here is reported
 * to their teenager or to anybody else. */

const RULES = [
  'Talk during something with an end, like a drive or a walk.',
  'Start with what you noticed, not what the app shows.',
  'Ask one question, then listen.',
  'Do not try to fix anything in the first two minutes.',
  'Say early on what you will not do.',
  'Do not compare your teen with a sibling or classmate.',
]

const REACH = [
  'Two weeks of high scores is not a diagnosis.',
  'You do not need a certain score to call for help.',
  'See a doctor if your teen seems unlike themselves for a month.',
  'Tell your teen before you call anyone.',
  'If your teen is in danger now, call an emergency number. Do not rely on an app.',
]

function Rows({ rows }) {
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {rows.map(r => (
        <li key={r} className="flex items-start gap-3 border-t border-rule py-3 first:border-t-0 first:pt-0">
          <span aria-hidden className="kit-fill mt-[0.55em] size-2.5 shrink-0 rounded-bar"/>
          <span className="min-w-0 flex-1 text-sec text-ink-2">{r}</span>
        </li>
      ))}
    </ul>
  )
}

export function ParentOpeners(p) {
  return (
    <ActivityScreen {...p} id="openers" family="leaf" title="Conversation Openers">
      <Sheet><Openers/></Sheet>
    </ActivityScreen>
  )
}

export function ParentPhrasing(p) {
  return (
    <ActivityScreen {...p} id="phrasing" family="tide" title="Opening Line Check">
      <Sheet><PhraseCheck/></Sheet>
    </ActivityScreen>
  )
}

export function ParentScore(p) {
  return (
    <ActivityScreen {...p} id="score" family="stone" title={`Reading the ${SCORE}`}>
      <Sheet><Meaning/></Sheet>
    </ActivityScreen>
  )
}

export function ParentRules(p) {
  return (
    <ActivityScreen {...p} id="rules" family="night" title="Conversation Ground Rules">
      <Sheet><Rows rows={RULES}/></Sheet>
    </ActivityScreen>
  )
}

export function ParentReach(p) {
  return (
    <ActivityScreen {...p} id="reach" family="pool" title="When to Get Help">
      <Sheet><Rows rows={REACH}/></Sheet>
    </ActivityScreen>
  )
}
