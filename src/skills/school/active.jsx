import React from 'react'
import { cn } from '../../lib/utils'
import { Sheet, Action, Choice, Meter, Note } from '../../toolkit/shell'
import { Screen, H, Field, Seg, Tick, CopyButton, useSaved, uid, ActiveIcon } from './ui'
import { notesToCards, review, dueCards, dayNumber, buildQuestion, precision } from './logic'
import { EndCard } from '../../toolkit/game'
import { useSkill, Quest, GoalMeter, leave } from '../../toolkit/game/skill'

/* Active learning. Turn notes into questions, quiz yourself on a spaced
 * schedule (a card you know waits longer, one you miss comes back today),
 * and turn "I don't get it" into a precise question for a teacher. */

const ID = 'school-active'
const EMPTY_ASK = { where:'', get:'', stuck:'', tried:'', ask:'' }
const START = { tab:'make', notes:'', drafts:[], cards:[], ask:EMPTY_ASK, asked:[] }
const STARTERS = ['Why does', 'How do I know when to', 'What is the difference between', 'Can you check if']
const inDays = d => d <= 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`

function Make({ s, set, g }) {
  const make = e => {
    const drafts = notesToCards(s.notes).slice(0, 30).map(c => ({ ...c, id:uid() }))
    if (drafts.length) g.hit(10, e, { label:`${drafts.length} ${drafts.length === 1 ? 'card' : 'cards'}`, sound:'good' })
    set({ drafts })
  }
  const edit = (id, k, v) => set({ drafts:s.drafts.map(d => d.id === id ? { ...d, [k]:v } : d) })
  const keep = () => {
    const today = dayNumber()
    const add = s.drafts.filter(d => d.q.trim() && d.a.trim())
      .map(d => ({ id:d.id, q:d.q.trim(), a:d.a.trim(), box:1, due:today }))
    set({ cards:[...s.cards, ...add].slice(-300), drafts:[], notes:'', tab:'quiz' })
    window.scrollTo(0, 0)
  }
  return (
    <>
      <Sheet>
        <Field area label="Paste or type your notes" hint="One fact per line works best. Term: meaning lines become clean questions."
          placeholder={'Osmosis: water moving across a membrane\nMitochondria are where cells make energy.\nThe cell membrane controls what goes in and out.'}
          value={s.notes} maxLength={6000} onChange={e => set({ notes:e.target.value })}/>
        <Action className="mt-3 w-full" disabled={!s.notes.trim()} onClick={make}>Turn into questions</Action>
      </Sheet>
      {s.drafts.length > 0 && (
        <>
          <Note>Fix any question that reads oddly. Questions in your own words are easier to remember.</Note>
          <ol className="grid gap-3">
            {s.drafts.map((d, i) => (
              <li key={d.id}>
                <Sheet className="grid gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display text-ui font-bold text-ink">Card {i + 1}</p>
                    <Action kind="quiet" className="min-h-[44px] px-3 text-fine"
                      onClick={() => set({ drafts:s.drafts.filter(x => x.id !== d.id) })}>Remove</Action>
                  </div>
                  <Field area short label="Question" value={d.q} maxLength={240} onChange={e => edit(d.id, 'q', e.target.value)}/>
                  <Field area short label="Answer" value={d.a} maxLength={240} onChange={e => edit(d.id, 'a', e.target.value)}/>
                </Sheet>
              </li>
            ))}
          </ol>
          <Action onClick={keep}>Save {s.drafts.length} {s.drafts.length === 1 ? 'card' : 'cards'} and quiz me</Action>
        </>
      )}
    </>
  )
}

function Quiz({ s, set, g, onExit }) {
  const today = dayNumber()
  const [run, setRun] = React.useState(null)   // { queue:[ids], i, shown, typed, tally:{got,partly,not}, retried:Set }
  const due = dueCards(s.cards, today)
  const next = s.cards.length ? Math.min(...s.cards.map(c => c.due)) - today : null

  const begin = all => {
    g.reset()
    const list = all ? [...s.cards].sort((a, b) => a.box - b.box) : due
    setRun({ queue:list.map(c => c.id), i:0, shown:false, typed:'', tally:{ got:0, partly:0, not:0 }, retried:[] })
  }
  if (!s.cards.length) {
    return (
      <Sheet>
        <H>No cards yet</H>
        <p className="mt-1 text-ui text-ink-2">Make some from your notes first.</p>
        <Action className="mt-3 w-full" onClick={() => set({ tab:'make' })}>Make questions</Action>
      </Sheet>
    )
  }
  if (!run) {
    return (
      <>
        <Sheet>
          <H>{due.length ? `${due.length} ${due.length === 1 ? 'card' : 'cards'} to review` : 'Nothing due today'}</H>
          <p className="mt-1 text-ui text-ink-2">
            {due.length ? 'Answer from memory before you check. Recalling it helps you remember.'
              : `Your next card comes back ${inDays(next)}. You can still run through all of them.`}
          </p>
          <div className="mt-4 grid gap-3">
            {due.length > 0 && <Action onClick={() => begin(false)}>Start quiz</Action>}
            <Action kind={due.length ? 'quiet' : 'primary'} onClick={() => begin(true)}>Quiz all {s.cards.length}</Action>
          </div>
        </Sheet>
        <Boxes cards={s.cards}/>
        <details className="rounded-[18px] border border-rule bg-card p-4">
          <summary className="min-h-[44px] cursor-pointer py-2 font-display text-ui font-bold text-ink">Your cards ({s.cards.length})</summary>
          <ul className="mt-2 grid gap-2">
            {s.cards.map(c => (
              <li key={c.id} className="kit-ground flex items-start gap-2 rounded-[12px] p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-ui font-semibold text-ink">{c.q}</p>
                  <p className="text-fine text-ink-2">{c.a}. Box {c.box}, back {inDays(c.due - today)}.</p>
                </div>
                <button type="button" aria-label={`Delete card: ${c.q}`}
                  onClick={() => set({ cards:s.cards.filter(x => x.id !== c.id) })}
                  className="kit-quiet grid size-11 shrink-0 place-items-center rounded-[10px]">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18"/></svg>
                </button>
              </li>
            ))}
          </ul>
        </details>
      </>
    )
  }

  if (run.i >= run.queue.length) {
    const seen = run.tally.got + run.tally.partly + run.tally.not
    if (g.result) return (
      <EndCard game={g} title={run.tally.partly + run.tally.not === 0 ? 'Every card from memory' : 'Quiz done'}
        againLabel="Back to my cards" onAgain={() => { setRun(null); g.reset() }} onDone={leave(onExit)}
        stats={[['Got it', run.tally.got], ['Partly', run.tally.partly], ['Not yet', run.tally.not], ['Answers from memory', seen]]}>
        <p className="text-ui text-ink">Cards you got right come back later. The rest come back sooner.</p>
      </EndCard>
    )
    return (
      <Sheet className="kit-ground border-transparent">
        <H>Quiz done</H>
        <dl className="mt-3 grid grid-cols-3 gap-2">
          {[['Got it', run.tally.got], ['Partly', run.tally.partly], ['Not yet', run.tally.not]].map(([k, v]) => (
            <div key={k} className="rounded-[12px] bg-card p-3">
              <dt className="text-fine text-ink-2">{k}</dt>
              <dd className="font-display text-num font-bold tabular-nums text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sec text-ink">
          {seen} answers from memory. Cards you got wait longer before they come back; the rest return sooner.
        </p>
        <Action className="mt-4 w-full" onClick={() => setRun(null)}>Done</Action>
      </Sheet>
    )
  }

  const card = s.cards.find(c => c.id === run.queue[run.i])
  if (!card) return null
  const grade = (k, e) => {
    set({ cards:s.cards.map(c => c.id === card.id ? review(c, k, today) : c) })
    const again = k === 'not' && !run.retried.includes(card.id)
    const queue = again ? [...run.queue, card.id] : run.queue
    const tally = { ...run.tally, [k]:run.tally[k] + 1 }
    if (k === 'got') g.hit(10, e, { sound:'good' })
    else if (k === 'partly') g.hit(5, e)
    else g.cue('turn')
    setRun({ ...run, i:run.i + 1, shown:false, typed:'', queue,
      retried: again ? [...run.retried, card.id] : run.retried, tally })
    if (run.i + 1 >= queue.length) g.finish({ complete:true, marks: tally.partly + tally.not === 0 ? ['clean'] : [] })
  }
  return (
    <Sheet>
      <GoalMeter reduced={g.reduced} value={run.i / run.queue.length} label={`Card ${run.i + 1} of ${run.queue.length}`} right={`Box ${card.box}`}/>
      <p key={run.i} className={cn('mt-4 font-display text-row font-bold text-ink', !g.reduced && 'g-card')}>{card.q}</p>
      <Field className="mt-3" label="Your answer, from memory" hint="Optional. Saying it out loud works too."
        value={run.typed} onChange={e => setRun({ ...run, typed:e.target.value })}/>
      {!run.shown ? (
        <Action className="mt-4 w-full" onClick={() => setRun({ ...run, shown:true })}>Show answer</Action>
      ) : (
        <>
          <div className={cn('kit-ground mt-4 rounded-[12px] p-3', !g.reduced && 'g-in')} aria-live="polite">
            <p className="text-fine text-ink-2">Answer</p>
            <p className="text-sec font-semibold text-ink">{card.a}</p>
          </div>
          <p className="mt-3 font-display text-ui font-semibold text-ink">How did you do?</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <Action className="px-2" onClick={e => grade('got', e)}>Got it</Action>
            <Action kind="quiet" className="px-2" onClick={e => grade('partly', e)}>Partly</Action>
            <Action kind="quiet" className="px-2" onClick={e => grade('not', e)}>Not yet</Action>
          </div>
        </>
      )}
    </Sheet>
  )
}

function Boxes({ cards }) {
  const n = [1, 2, 3, 4, 5].map(b => cards.filter(c => c.box === b).length)
  return (
    <Sheet>
      <p className="font-display text-ui font-semibold text-ink">Where your cards are</p>
      <ol className="mt-2 grid grid-cols-5 gap-1.5 text-center">
        {n.map((v, i) => (
          <li key={i} className={cn('rounded-[10px] p-2', v ? 'kit-ground' : 'border border-rule')}>
            <span className="block font-display text-num font-bold tabular-nums text-ink">{v}</span>
            <span className="block text-fine text-ink-2">Box {i + 1}</span>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-fine text-ink-2">Box 1 comes back today, box 5 in two weeks.</p>
    </Sheet>
  )
}

function Ask({ s, set, g, onExit }) {
  const [last, setLast] = React.useState(null)
  const f = s.ask
  const p = precision(f)
  const text = buildQuestion(f)
  const up = (k, v) => set({ ask:{ ...f, [k]:v } })
  const tip = id => p.checks.find(c => c.id === id)
  const mark = id => (f[id] || '').trim() && !tip(id).ok ? tip(id).tip : null
  if (last && g.result) return (
    <EndCard game={g} title="Question ready" againLabel="Write another" onDone={leave(onExit)}
      onAgain={() => { setLast(null); g.reset() }} stats={[['Precision', `${last.score} of 5`]]}>
      <p className="kit-ground rounded-[12px] p-3 text-sec text-ink">{last.text}</p>
      <CopyButton className="mt-3" text={last.text}/>
    </EndCard>
  )
  return (
    <>
      <Sheet className="grid gap-4">
        <Field label="Where exactly?" placeholder="e.g. Unit 3 worksheet, problem 7" value={f.where} maxLength={80}
          hint={mark('where')} onChange={e => up('where', e.target.value)}/>
        <Field label="I understand..." placeholder="e.g. how to set up the equation" value={f.get} maxLength={140}
          hint={mark('get')} onChange={e => up('get', e.target.value)}/>
        <Field label="I get stuck when..." placeholder="e.g. I have to move x to one side" value={f.stuck} maxLength={140}
          hint={mark('stuck')} onChange={e => up('stuck', e.target.value)}/>
        <Field label="I already tried..." placeholder="e.g. redoing the example from class" value={f.tried} maxLength={140}
          hint={mark('tried')} onChange={e => up('tried', e.target.value)}/>
        <div>
          <Field label="So my question is..." placeholder="e.g. Why does the sign flip" value={f.ask} maxLength={160}
            hint={mark('ask')} onChange={e => up('ask', e.target.value)}/>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Question starters">
            {STARTERS.map(t => (
              <Choice key={t} className="min-h-[44px] px-3 text-fine" onClick={() => up('ask', t + ' ')}>{t}</Choice>
            ))}
          </div>
        </div>
      </Sheet>
      <Sheet>
        <GoalMeter reduced={g.reduced} value={p.score / 5} label="Precision" right={`${p.score} of 5`}/>
        <p className="mt-2 text-ui font-semibold text-ink">{p.line}</p>
        <ul className="mt-3 grid gap-2">
          {p.checks.map(c => (
            <li key={c.id} className="flex items-start gap-2 text-ui text-ink">
              <Tick ok={c.ok}/><span><span className="sr-only">{c.ok ? 'Done: ' : 'Missing: '}</span>{c.tip}</span>
            </li>
          ))}
        </ul>
      </Sheet>
      {text && (
        <Sheet>
          <H>Your question</H>
          <p className="kit-ground mt-2 rounded-[12px] p-3 text-sec text-ink">{text}</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <CopyButton text={text}/>
            <Action onClick={() => {
              setLast({ text, score:p.score })
              g.finish({ complete:true })
              set({ asked:[{ id:uid(), text }, ...s.asked].slice(0, 20), ask:EMPTY_ASK }); window.scrollTo(0, 0)
            }}>
              Save and finish
            </Action>
          </div>
          <Action kind="quiet" className="mt-3 w-full" onClick={() => set({ ask:EMPTY_ASK })}>Start again</Action>
        </Sheet>
      )}
      {s.asked.length > 0 && (
        <details className="rounded-[18px] border border-rule bg-card p-4">
          <summary className="min-h-[44px] cursor-pointer py-2 font-display text-ui font-bold text-ink">Saved questions ({s.asked.length})</summary>
          <ul className="mt-2 grid gap-2">
            {s.asked.map(q => (
              <li key={q.id} className="kit-ground flex items-start gap-2 rounded-[12px] p-3">
                <p className="min-w-0 flex-1 text-ui text-ink">{q.text}</p>
                <button type="button" aria-label="Delete this question"
                  onClick={() => set({ asked:s.asked.filter(x => x.id !== q.id) })}
                  className="kit-quiet grid size-11 shrink-0 place-items-center rounded-[10px]">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18"/></svg>
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  )
}

const GOALS = {
  make:['Turn your notes into questions.', ['Paste notes', 'Fix the questions', 'Save the cards']],
  quiz:['Answer every card from memory before you look.', ['Answer the cards']],
  ask: ['Write a question a teacher can answer in one go.', ['Fill in the parts', 'Save it']],
}

export default function Active({ onExit }) {
  const g = useSkill(ID)
  const [s, setS] = useSaved(ID, START)
  const set = patch => setS(v => ({ ...v, ...patch }))
  const TABS = [['make', 'Make questions'], ['quiz', 'Quiz me'], ['ask', 'Ask a teacher']]
  const step = g.result ? 9 : s.tab === 'make' ? (s.drafts.length ? 1 : 0)
    : s.tab === 'ask' ? (precision(s.ask).score >= 3 ? 1 : 0) : 0
  return (
    <Screen title="Active Recall" family="mint" icon={ActiveIcon} onExit={onExit}
      problem="Study by quizzing yourself instead of rereading your notes."
      plan="Turn notes into questions, quiz yourself over several days, and write clear questions for your teacher.">
      <Seg small label="Part" value={s.tab} onChange={v => { set({ tab:v }); g.reset() }} options={TABS}/>
      <Quest game={g} goal={GOALS[s.tab][0]} steps={GOALS[s.tab][1]} at={step}>
        {s.tab === 'make' && <Make s={s} set={set} g={g}/>}
        {s.tab === 'quiz' && <Quiz s={s} set={set} g={g} onExit={onExit}/>}
        {s.tab === 'ask' && <Ask s={s} set={set} g={g} onExit={onExit}/>}
      </Quest>
    </Screen>
  )
}
