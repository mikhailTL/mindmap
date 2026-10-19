import React from 'react'
import { List, Item } from '../ui/list'
import { Choice, Hint, Step, riseAt } from './panel'
import { cn } from '../lib/utils'

/* Conversation Openers. Pick the situation and see the same intention said
 * two ways: one that puts the teen on the spot, one that starts a
 * conversation. 18 October: copy made plain and pronoun neutral (owner). The pairs are written per situation, so this branches
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
    pick: 'Scores ran high',
    subject: 'Wednesday',
    check: { say: 'Your score was high three days running. What happened?',
             why: 'Starts with the number, so your teen has to explain it.' },
    open:  { say: 'You looked tired on Wednesday. Was it a long day, or something else?',
             why: 'Starts with what you noticed. Your teen can answer in one word.' },
    avoid: ['Why is it so high?', 'I have been watching it climb for days.'],
    quiet: 'Say “OK, I am around later if you want to talk.” Then let it go.',
  },
  {
    id: 'school',
    pick: 'They will not talk about school',
    subject: 'the drive',
    check: { say: 'Is something going on at school? You can tell me anything.',
             why: 'Asks straight about the topic they are avoiding. The answer will likely be "no".' },
    open:  { say: 'I am driving to the store. Come with me.',
             why: 'Side by side, no eye contact and a clear end point make it easier to talk.' },
    avoid: ['You know you can talk to me.', 'I am only asking because I care.'],
    quiet: 'Do not bring up school. Spending the time together is enough.',
  },
  {
    id: 'sleep',
    pick: 'Three short nights in a row',
    subject: 'the short nights',
    check: { say: 'The app says you only slept five hours. You need to put your phone away.',
             why: 'Quotes the app and gives an order, so the talk becomes an argument about the phone.' },
    open:  { say: 'You have had some short nights. Is it hard to fall asleep, or are you going to bed late?',
             why: 'Names what you noticed and offers two answers. One of them is not their fault.' },
    avoid: ['This is why you are so tired.', 'I knew that phone was the problem.'],
    quiet: 'Let it go and ask again at the weekend. Pressure does not help sleep.',
  },
  {
    id: 'number',
    pick: 'A number I do not understand',
    subject: 'the hard few days',
    check: { say: 'What does 68 mean? Should I be worried?',
             why: 'Asks your teen to explain their own score and to deal with your worry.' },
    open:  { say: 'I can see the last few days were harder than usual. I do not know why.',
             why: 'Says what the number shows and what it does not. Your teen can fill in the rest.' },
    avoid: ['Sixty-eight out of a hundred is not good.', 'The app flagged you.'],
    quiet: 'Say nothing more for now. The number is not urgent.',
  },
  {
    id: 'wrong',
    pick: 'Something is wrong and I do not know what',
    subject: 'the last few weeks',
    check: { say: 'You have been off for weeks. What is wrong with you?',
             why: 'Sounds like an accusation. Any answer feels like a confession.' },
    open:  { say: 'Something has been hard for a few weeks. You do not have to tell me what it is. Would it help to talk to someone other than me?',
             why: 'Says what you have seen, does not ask for an explanation, and offers someone else to talk to. Some teens would rather talk to someone who is not a parent, and that is OK.' },
    avoid: ['I am your parent, you have to tell me.', 'Nothing can be that bad.'],
    quiet: 'Leave the offer open and ask again in a week.',
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
      strong ? 'border-accent bg-accent-wash font-bold text-accent-ink' : 'border-rule bg-card font-medium text-ink-2',
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
          <><Node>You</Node><Arrow delay="120ms"/><Node strong>Teen</Node></>
        ) : (
          <>
            <span className="flex shrink-0 flex-col gap-1.5">
              <Node>You</Node><Node>Teen</Node>
            </span>
            <span className="flex shrink-0 flex-col gap-[1.4rem]">
              <Arrow delay="120ms"/><Arrow delay="240ms"/>
            </span>
            <Node strong className="min-w-0 break-words">{subject}</Node>
          </>
        )}
      </div>
      <p className="note mt-2">{kind === 'check'
        ? 'Your teen has to explain themselves.'
        : 'You both look at what you noticed.'}</p>
    </div>
  )
}

export function Openers() {
  const [at, setAt] = React.useState(null)
  const c = CASES.find(x => x.id === at)

  return (
    <div>
      <p className="max-w-[54ch] text-sec text-ink-2">Pick your situation. See a way to start that puts
        your teen on the spot, and a way that starts a conversation.</p>

      <Step className="mt-5">Your situation</Step>
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
              {[['check', 'Puts them on the spot'], ['open', 'Starts a conversation']].map(([kind, label], i) => (
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

            <Step className="mt-6">Avoid saying</Step>
            <List className="mt-3">
              {c.avoid.map((a, i) => (
                <Item key={a} style={riseAt(i)} className="kit-rise">
                  <span className="text-sec text-ink-2">“{a}”</span>
                </Item>
              ))}
            </List>

            <Step className="mt-6">If your teen says nothing</Step>
            <p className="mt-2.5 max-w-[52ch] text-body text-ink">{c.quiet}</p>
          </div>
        )}
      </div>

      <Hint className="mt-6">These are general examples. Nothing you pick is recorded.</Hint>
    </div>
  )
}
