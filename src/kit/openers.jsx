import React from 'react'
import { List, Item } from '../ui/list'
import { Choice, Hint, Step, riseAt } from './panel'
import { cn } from '../lib/utils'

/* Conversation Openers. Pick the situation you are actually in and see the
 * same intention said two ways: one that reads as a check on her, one that
 * opens a conversation. The pairs are written per situation, so this branches
 * on the pick rather than swapping a noun.
 *
 * THE DIAGRAM. The lede makes a claim that is easy to agree with and hard to
 * see: the difference is not tone, it is which of you has to account for
 * something. So each phrasing carries the sentence drawn as what it does. A
 * check points one arrow at her and she is the end of it. An opener points two
 * arrows at the thing you both saw, and she is standing next to you looking at
 * it. That is the whole argument of this tool in two drawings.
 *
 * The arrows draw themselves, over 450ms, once per pick. A drawn line arrives
 * with a direction; a line that is simply there does not, and the direction is
 * the information. Under reduced motion the base layer lands the keyframe on
 * its end state, so both diagrams are drawn and only the drawing is lost. */

const CASES = [
  {
    id: 'high',
    pick: 'The week ran high',
    subject: 'Wednesday',
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
    subject: 'the drive',
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
    subject: 'the short nights',
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
    subject: 'the heavy week',
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
    subject: 'the last few weeks',
    check: { say: 'You have been off for weeks. What is wrong with you?',
             why: 'Two weeks of observation delivered as an accusation, with no answer that is not a confession.' },
    open:  { say: 'Something has been heavy for a few weeks. You do not have to tell me what it is. Is it the kind of thing that needs somebody who is not me?',
             why: 'Says what you have seen, drops the requirement to explain, and offers a route out that is not you. Some things a teenager will take to anybody but a parent, and that is not a failure of the household.' },
    avoid: ['I am your mother, you have to tell me.', 'Nothing can be that bad.'],
    quiet: 'Leave the offer open and say it again in a week. Asked twice, a fortnight apart, is not nagging.',
  },
]

/* One arrow. pathLength normalises the stroke to 100 units so the one dash
   length in kit.css draws any of them, and the head is part of the same path
   so it arrives last, which is what makes the direction land. */
function Arrow({ back, delay }) {
  return (
    <svg viewBox="0 0 34 12" aria-hidden focusable="false"
      className={cn('h-3 w-[34px] shrink-0', back && 'rotate-180')}
      fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path className="kit-draw" pathLength="100" style={{ animationDelay: delay }}
        d="M1 6h28M25 2.2L29.4 6 25 9.8"/>
    </svg>
  )
}

function Node({ strong, className, children }) {
  return (
    <span className={cn('rounded-field border px-2 py-0.5 text-center font-display text-fine',
      strong ? 'border-ink bg-ink font-bold text-paper' : 'border-rule bg-card font-medium text-ink-2',
      className)}>
      {children}
    </span>
  )
}

/* The sentence drawn as what it does to the two people in it. The wrapper
   takes mt-auto, so in a two-up row at 1280 the two diagrams sit on the same
   line as each other rather than wherever their paragraph happened to end;
   the margin above it is on that paragraph instead. */
function Shape({ kind, subject }) {
  return (
    <div className="mt-auto border-t border-rule pt-3">
      {/* Two shapes, not one shape with a different label. The opener's three
          nodes do not fit on one line in a 282px card at 390, and wrapping
          "Her" onto a second row broke the sentence the drawing is making, so
          it is drawn as what it is: two people, one arrow each, both arriving
          at the same thing. */}
      <div className={cn('flex items-center gap-1.5',
        kind === 'check' ? 'text-warn' : 'text-accent')}>
        {kind === 'check' ? (
          <><Node>You</Node><Arrow delay="120ms"/><Node strong>Her</Node></>
        ) : (
          <>
            <span className="flex shrink-0 flex-col gap-1.5">
              <Node>You</Node><Node>Her</Node>
            </span>
            <span className="flex shrink-0 flex-col gap-[1.4rem]">
              <Arrow delay="120ms"/><Arrow delay="240ms"/>
            </span>
            <Node strong className="min-w-0 break-words">{subject}</Node>
          </>
        )}
      </div>
      <p className="note mt-2">{kind === 'check'
        ? 'The question ends at her, so she is the one with something to account for.'
        : 'The question ends at the thing you both saw, and she is standing beside you looking at it.'}</p>
    </div>
  )
}

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

      <div aria-live="polite">
        {c && (
          /* Keyed on the pick, so a second pick arrives as a new pair rather
             than swapping its words under the reader mid-read. */
          <div key={c.id}>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[['check', 'Reads as a check'], ['open', 'Opens a conversation']].map(([kind, label], i) => (
                <div key={kind} style={riseAt(i * 2)}
                  className={cn('kit-rise flex flex-col rounded-[18px] border p-4',
                    kind === 'check' ? 'border-transparent bg-warn-wash' : 'kit-ground border-transparent')}>
                  <p className={cn('font-display text-tick font-bold',
                    kind === 'check' ? 'text-warn' : 'text-accent')}>{label}</p>
                  <p className="mt-2 max-w-[34ch] font-display text-head font-bold leading-[1.25] text-ink">
                    “{c[kind].say}”
                  </p>
                  <p className="mb-4 mt-2.5 max-w-[40ch] text-sec text-ink-2">{c[kind].why}</p>
                  <Shape kind={kind} subject={c.subject}/>
                </div>
              ))}
            </div>

            <Step className="mt-6">Not these</Step>
            <List className="mt-3">
              {c.avoid.map((a, i) => (
                <Item key={a} style={riseAt(i)} className="kit-rise">
                  <span className="text-sec text-ink-2">“{a}”</span>
                </Item>
              ))}
            </List>

            <Step className="mt-6">If she says nothing</Step>
            <p className="mt-2.5 max-w-[52ch] text-body text-ink">{c.quiet}</p>
          </div>
        )}
      </div>

      <Hint className="mt-6">Written for a daughter because the examples read better with one pronoun.
        Swap it. Nothing here is personalised to your teenager and nothing you pick is recorded.</Hint>
    </div>
  )
}
