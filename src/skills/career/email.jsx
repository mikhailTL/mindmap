import React from 'react'
import { cn } from '../../lib/utils'
import { Lines } from '../../kit/pro/common'
import { META } from './meta'
import { Screen, Sheet, H, Field, CopyBlock, Finish, Action, Choice, Chips, CopyButton, useSaved } from './parts'
import { PURPOSES, buildEmail, checkEmail, INTERVIEW, ASK_THEM, starAnswer, speakingTime, wordCount,
         thankYouNote, followUpNote, ETIQUETTE, WORD_LIMIT } from './email-logic'

/* Professional Email, in three parts.
 *
 * Email      purpose, recipient, ask, deadline, then a draft you can edit.
 *            The checker reads whatever is in the draft box, so it works on
 *            a message you wrote yourself too.
 * Interview  common questions and a STAR answer builder, timed at a calm
 *            140 words a minute.
 * Networking four etiquette cards and a thank-you or follow-up note. */

const TOOL = META.email
const TABS = [['email', 'Email'], ['interview', 'Interview'], ['network', 'Networking']]
const BLANK = { tab:'email', purpose:'meeting', f:{}, draft:'', q:0, star:{}, answers:{}, note:'thanks', n:{} }

function Checker({ text }) {
  const issues = checkEmail(text)
  if (!text.trim()) return <p className="text-fine text-ink-2">Write or paste an email above and it is checked as you type.</p>
  const n = wordCount(text)
  return (
    <div aria-live="polite">
      {issues.length === 0 ? (
        <p className="kit-ground rounded-[12px] p-3 font-display text-ui font-bold text-ink">
          Reads as professional. {n} words.
        </p>
      ) : (
        <>
          <p className="font-display text-ui font-bold text-ink">
            {issues.length} {issues.length === 1 ? 'thing' : 'things'} to fix
            <span className="font-semibold text-ink-2"> · {n} words</span>
          </p>
          <ul className="m-0 mt-2 grid list-none gap-2 p-0">
            {issues.map(i => (
              <li key={i.id} className="rounded-[12px] border border-rule bg-card p-3">
                <p className="font-display text-ui font-bold text-ink">{i.label}</p>
                <p className="text-fine text-ink-2">{i.tip}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function EmailTab({ s, patch }) {
  const p = PURPOSES.find(x => x.id === s.purpose) || PURPOSES[0]
  const set = k => e => patch(o => ({ f:{ ...o.f, [k]:e.target.value } }))
  const built = buildEmail({ purpose:s.purpose, ...s.f })
  return (
    <>
      <Sheet>
        <H>1. What is it for?</H>
        <Chips className="mt-3">
          {PURPOSES.map(x => (
            <Choice key={x.id} on={s.purpose === x.id} onClick={() => patch({ purpose:x.id })}>{x.label}</Choice>
          ))}
        </Chips>
        <H className="mt-6">2. The details</H>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Their name, with a title" placeholder="Ms. Lee or Dr. Patel" value={s.f.toName || ''} onChange={set('toName')}/>
          <Field label="Your full name" placeholder="Ana Ruiz" value={s.f.myName || ''} onChange={set('myName')}/>
          <Field className="sm:col-span-2" label="One line about you" hint="Optional."
            placeholder="I am a junior at Riverview High" value={s.f.about || ''} onChange={set('about')}/>
          <Field className="sm:col-span-2" label={p.askLabel} placeholder={p.askHint} value={s.f.ask || ''} onChange={set('ask')}/>
          {p.id !== 'thanks' && (
            <Field className="sm:col-span-2" label="Deadline" hint="Optional. A day or date." placeholder="Friday"
              value={s.f.deadline || ''} onChange={set('deadline')}/>
          )}
        </div>
        <Action className="mt-4 w-full sm:w-auto" onClick={() => patch({ draft: built.body })}>Write my email</Action>
      </Sheet>
      <Sheet>
        <H>3. Draft and check</H>
        <p className="mt-1 text-sec text-ink"><span className="font-semibold">Subject:</span> {built.subject}</p>
        <Field className="mt-3" area label="Your email" hint="Edit it, or paste one you wrote. Texting habits are flagged below."
          rows={13} value={s.draft} onChange={e => patch({ draft:e.target.value })}/>
        <div className="mt-3"><Checker text={s.draft}/></div>
        {s.draft.trim() && (
          <div className="mt-3 flex flex-wrap gap-3">
            <CopyButton text={`Subject: ${built.subject}\n\n${s.draft}`} label="Copy email" kind="primary"/>
          </div>
        )}
      </Sheet>
    </>
  )
}

function InterviewTab({ s, patch }) {
  const item = INTERVIEW[s.q] || INTERVIEW[0]
  const st = s.star[s.q] || {}
  const set = k => e => patch(o => ({ star:{ ...o.star, [o.q]:{ ...(o.star[o.q] || {}), [k]:e.target.value } } }))
  const answer = starAnswer(st)
  const n = wordCount(answer), secs = speakingTime(n)
  const saved = s.answers[s.q]
  return (
    <>
      <Sheet>
        <H>Pick a question</H>
        <div className="mt-3 grid gap-2">
          {INTERVIEW.map((x, i) => (
            <Choice key={x.q} on={s.q === i} onClick={() => patch({ q:i })} className="w-full">
              <span className="min-w-0 flex-1">{x.q}</span>
              {s.answers[i] && <span className="text-fine font-semibold">Saved</span>}
            </Choice>
          ))}
        </div>
      </Sheet>
      <Sheet>
        <H>{item.q}</H>
        <p className="mt-1 text-fine text-ink-2">{item.tip}</p>
        <p className="mt-3 text-sec text-ink">Build it with STAR: Situation, Task, Action, Result.</p>
        <div className="mt-3 grid gap-3">
          <Field label="Situation" hint="Where and when?" placeholder="In robotics club last spring" value={st.s || ''} onChange={set('s')}/>
          <Field label="Task" hint="What did you need to do?" placeholder="I had to fix the arm before the meet" value={st.t || ''} onChange={set('t')}/>
          <Field label="Action" hint="What did you do? Say I, not we." placeholder="I tested each motor and rebuilt the gear box" value={st.a || ''} onChange={set('a')}/>
          <Field label="Result" hint="What happened? A number helps." placeholder="We placed third out of 14 teams" value={st.r || ''} onChange={set('r')}/>
        </div>
        {answer && (
          <div className="kit-ground mt-4 rounded-[14px] p-4">
            <p className="font-display text-fine font-bold text-ink-2">Your answer · {n} words · about {secs} seconds out loud</p>
            <p className="mt-1 text-sec text-ink">{answer}</p>
            <p className="mt-2 text-fine text-ink-2">
              {secs < 30 ? 'Short. Add one detail to the Action.' : secs > 120 ? 'Long. Cut the Situation to one line.' : 'A good length. Say it out loud twice.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Action onClick={() => patch(o => ({ answers:{ ...o.answers, [o.q]:answer } }))}>
                {saved === answer ? 'Saved' : 'Save answer'}
              </Action>
              <CopyButton text={answer}/>
            </div>
          </div>
        )}
      </Sheet>
      <Sheet>
        <H>Questions to ask them</H>
        <p className="mt-1 text-fine text-ink-2">Have two ready for the end.</p>
        <Lines rows={ASK_THEM} className="mt-2"/>
      </Sheet>
    </>
  )
}

function NetworkTab({ s, patch }) {
  const set = k => e => patch(o => ({ n:{ ...o.n, [k]:e.target.value } }))
  const text = s.note === 'thanks' ? thankYouNote(s.n) : followUpNote(s.n)
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {ETIQUETTE.map(c => (
          <Sheet key={c.id}>
            <H>{c.title}</H>
            <Lines rows={c.rows} className="mt-2"/>
          </Sheet>
        ))}
      </div>
      <Sheet>
        <H>Write a note</H>
        <Chips className="mt-3">
          <Choice on={s.note === 'thanks'} onClick={() => patch({ note:'thanks' })}>Thank-you note</Choice>
          <Choice on={s.note === 'follow'} onClick={() => patch({ note:'follow' })}>Follow-up</Choice>
        </Chips>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Their name, with a title" placeholder="Mr. Kim" value={s.n.toName || ''} onChange={set('toName')}/>
          <Field label="Your name" placeholder="Jo Park" value={s.n.myName || ''} onChange={set('myName')}/>
          <Field className="sm:col-span-2" label={s.note === 'thanks' ? 'What you are thanking them for' : 'What you are following up on'}
            placeholder={s.note === 'thanks' ? 'letting me shadow you on Friday' : 'my internship application'}
            value={s.n.topic || ''} onChange={set('topic')}/>
          {s.note === 'thanks' && (
            <Field className="sm:col-span-2" label="One thing you learned" hint="Optional. It makes the note about them."
              placeholder="Seeing how you plan a whole week of patients helped me a lot" value={s.n.detail || ''} onChange={set('detail')}/>
          )}
        </div>
        <CopyBlock className="mt-4" title="Your note" text={text}/>
      </Sheet>
    </>
  )
}

export default function Email({ onExit }) {
  const [s, patch, set] = useSaved(TOOL.id, BLANK)
  return (
    <Screen tool={TOOL} onExit={onExit}
      problem="A work email, an interview or a new contact is not a group chat."
      doing={`Build a short email and check it for texting habits, practise interview answers, and learn the basics of keeping in touch. Aim for under ${WORD_LIMIT} words.`}>
      <div role="group" aria-label="Part" className="grid grid-cols-3 gap-2">
        {TABS.map(([id, label]) => (
          <Choice key={id} on={s.tab === id} onClick={() => patch({ tab:id })}
            className={cn('justify-center px-2 text-center text-fine sm:text-ui')}>{label}</Choice>
        ))}
      </div>
      {s.tab === 'email' && <EmailTab s={s} patch={patch}/>}
      {s.tab === 'interview' && <InterviewTab s={s} patch={patch}/>}
      {s.tab === 'network' && <NetworkTab s={s} patch={patch}/>}
      <Finish onExit={onExit} onAgain={() => set({ ...BLANK, tab:s.tab })}/>
    </Screen>
  )
}
