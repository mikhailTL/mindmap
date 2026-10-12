import React from 'react'
import { List, Item } from '../ui/list'
import { Choice, Hint, Step } from './panel'

/* Pick the situation you are actually in and see the same intention said two
 * ways: one that reads as a check on them, one that opens a conversation. The
 * pairs are written per situation, so this branches on the pick rather than
 * swapping a noun. */

const CASES = [
  {
    id: 'high',
    pick: 'The week ran high',
    check: { say: 'Your score was high three days this week. What happened?',
             why: 'Opens with the reading, so the patch is doing the asking and the first thing she has to do is account for a number.' },
    open:  { say: 'You looked wiped on Wednesday. Was that the week, or was that something?',
             why: 'Opens with what you saw yourself, and it can be answered in one word if one word is all she has.' },
    avoid: ['Why is it so high?', 'I have been watching it climb all week.'],
    quiet: 'Fair enough. I am around later if you want. Then actually leave it.',
  },
  {
    id: 'school',
    pick: 'She will not talk about school',
    check: { say: 'Is something going on at school? You can tell me anything.',
             why: 'A direct question about the one subject she is avoiding, plus a promise she did not ask for. The answer is going to be "no".' },
    open:  { say: 'I am driving to the shop. Come with me.',
             why: 'Side by side, no eye contact, a clear end point. Most of what teenagers say about school gets said in a car.' },
    avoid: ['You know you can talk to me.', 'I am only asking because I care.'],
    quiet: 'Say nothing about school at all. The point of the trip was the trip.',
  },
  {
    id: 'sleep',
    pick: 'Three short nights in a row',
    check: { say: 'The app says you only slept five hours. You need to put your phone away.',
             why: 'Two moves at once: a reading quoted back, and an instruction. The sleep is now an argument about the phone.' },
    open:  { say: 'Short nights this week. Is it that you cannot get to sleep, or that you are not going to bed?',
             why: 'Names what you noticed and offers two answers, one of which is not her fault. Either one tells you what the problem actually is.' },
    avoid: ['This is why you are so tired.', 'I knew that phone was the problem.'],
    quiet: 'Leave it and ask again at the weekend. Sleep is the one thing that does not improve under pressure.',
  },
  {
    id: 'number',
    pick: 'A number I do not understand',
    check: { say: 'What does 68 mean? Should I be worried?',
             why: 'Hands her the job of explaining her own reading, and your worry along with it.' },
    open:  { say: 'I can see the week was heavier than usual. I do not know what it was about.',
             why: 'States what the number does say, admits what it does not, and leaves her the part only she has.' },
    avoid: ['Sixty-eight out of a hundred is not good.', 'The app flagged you.'],
    quiet: 'Nothing. The number is not urgent and the silence is not a refusal.',
  },
  {
    id: 'wrong',
    pick: 'Something is clearly wrong and I do not know what',
    check: { say: 'You have been off for weeks. What is wrong with you?',
             why: 'Two weeks of observation delivered as an accusation, with no answer that is not a confession.' },
    open:  { say: 'Something has been heavy for a few weeks. You do not have to tell me what it is. Is it the kind of thing that needs somebody who is not me?',
             why: 'Says what you have seen, drops the requirement to explain, and offers a route out that is not you. Some things a teenager will take to anybody but a parent, and that is not a failure of the household.' },
    avoid: ['I am your mother, you have to tell me.', 'Nothing can be that bad.'],
    quiet: 'Leave the offer open and say it again in a week. Asked twice, a fortnight apart, is not nagging.',
  },
]

export function Openers() {
  const [at, setAt] = React.useState(null)
  const c = CASES.find(x => x.id === at)

  return (
    <div>
      <p className="max-w-[54ch] text-sec text-ink-2">Same intention, two sentences. The difference is
        not tone. It is which of you has to account for something.</p>

      <Step className="mt-5">Where you are tonight</Step>
      <div className="mt-3 flex flex-wrap gap-2">
        {CASES.map(x => (
          <Choice key={x.id} on={at === x.id} onClick={() => setAt(a => (a === x.id ? null : x.id))}>
            {x.pick}
          </Choice>
        ))}
      </div>

      {c && (
        <div aria-live="polite">
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="border-l-2 border-warn pl-4">
              <p className="font-display text-tick font-bold text-warn">Reads as a check</p>
              <p className="mt-2 max-w-[34ch] font-display text-head font-bold leading-[1.25] text-ink">
                “{c.check.say}”
              </p>
              <p className="mt-2.5 max-w-[40ch] text-sec text-ink-2">{c.check.why}</p>
            </div>
            <div className="border-l-2 border-accent pl-4">
              <p className="font-display text-tick font-bold text-accent">Opens a conversation</p>
              <p className="mt-2 max-w-[34ch] font-display text-head font-bold leading-[1.25] text-ink">
                “{c.open.say}”
              </p>
              <p className="mt-2.5 max-w-[40ch] text-sec text-ink-2">{c.open.why}</p>
            </div>
          </div>

          <Step className="mt-6">Not these</Step>
          <List className="mt-3">
            {c.avoid.map(a => (
              <Item key={a}><span className="text-sec text-ink-2">“{a}”</span></Item>
            ))}
          </List>

          <Step className="mt-6">If she says nothing</Step>
          <p className="mt-2.5 max-w-[52ch] text-body text-ink">{c.quiet}</p>
        </div>
      )}

      <Hint className="mt-6">Written for a daughter because the examples read better with one pronoun.
        Swap it. Nothing here is personalised to your teenager and nothing you pick is recorded.</Hint>
    </div>
  )
}
