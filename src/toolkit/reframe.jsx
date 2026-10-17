import React from 'react'
import { Button } from '../ui/button'
import { Bin } from '../ui/marks'
import { cn } from '../lib/utils'
import { ActivityScreen, FIELD, OnDevice } from './shell'
import { DidItWork } from './after'
import { useGame, GameBar, Pops, LevelMeter, EndCard } from './game'

/* Thought Reframe, as a card game.
 *
 * 1. Pick the thought: tap one from the deck or write your own.
 * 2. Flip three cards. Each is a question; tap an answer or write one.
 * 3. Build: tap the answers in the order you like after "Right now it feels
 *    like ...". Edit the words, then save.
 *
 * The journal is localStorage on this device (`mindmap.toolkit.journal`),
 * every access wrapped. Nobody else can read it and it is never sent. */

const JOURNAL_KEY = 'mindmap.toolkit.journal'

const THOUGHTS = [
  'I always mess things up.', 'Everyone is judging me.', "I can't handle this.",
  "It's going to go badly.", 'I should be better at this.', 'Nobody gets it.',
  'This will never get better.', 'I said the wrong thing.',
]

const PROMPTS = [
  { q:'What would you tell a friend?', a:[
    'One bad moment is not the whole story.', 'I am doing more than I think.',
    "It's OK not to have it figured out."] },
  { q:'What is one fact against it?', a:[
    'It went OK last time.', 'People have helped me before.', 'I have done hard things before.'] },
  { q:'Will this matter in a week?', a:[
    'Probably not much.', 'A little, and I can plan for it.', 'Yes, so I will take one small step.'] },
  { q:'What part can you control?', a:[
    'I can control what I do next.', 'I can choose who to ask for help.', 'I can choose how I talk to myself.'] },
  { q:'Is there a kinder way to say it?', a:[
    'This is hard right now.', 'I am still learning.', 'I am having a rough day, not a rough life.'] },
  { q:'What is one small next step?', a:[
    'Next I will drink some water.', 'Next I will text someone I trust.', 'Next I will take a short break.'] },
]

const dealThree = () => [...PROMPTS].sort(() => Math.random() - 0.5).slice(0, 3)
const lowerFirst = s => s ? s[0].toLowerCase() + s.slice(1) : s
const opener = t => `Right now it feels like ${lowerFirst(t.trim()).replace(/[.!?]*$/, '')}.`

function readJournal() {
  try { const v = JSON.parse(localStorage.getItem(JOURNAL_KEY) || '[]'); return Array.isArray(v) ? v : [] }
  catch { return [] }
}
function writeJournal(list) {
  try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(list.slice(0, 60))); return true } catch { return false }
}

function Journal({ list, onDelete, className }) {
  if (!list.length) return null
  return (
    <details className={cn('rounded-panel border border-rule bg-card p-3', className)}>
      <summary className="min-h-[44px] cursor-pointer py-2 font-display text-ui font-bold text-ink">
        Your journal ({list.length})
      </summary>
      <ul className="mt-2 grid gap-2">
        {list.map(e => (
          <li key={e.id} className="flex items-start gap-2 rounded-field p-3" style={{ background:'var(--g-wash)' }}>
            <div className="min-w-0 flex-1">
              <p className="text-fine text-ink-2">{e.thought}</p>
              <p className="mt-1 text-sec text-ink">{e.balanced}</p>
            </div>
            <button type="button" onClick={() => onDelete(e.id)} aria-label="Delete this entry"
              className="grid size-11 shrink-0 place-items-center rounded-field text-ink-2 hoverOnly:text-ink">
              <Bin aria-hidden className="size-4"/>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-fine text-ink-3">Only on this phone.</p>
    </details>
  )
}

/* A face-down card that turns over to a question and its answers. */
function FlipCard({ n, prompt, open, answer, onFlip, onAnswer, reduced }) {
  const [own, setOwn] = React.useState('')
  return (
    <div className={cn('g-flip', open && 'is-flipped')}>
      <div className="g-flip-inner">
        <button type="button" onClick={onFlip} tabIndex={open ? -1 : 0} aria-hidden={open}
          className="g-front flex min-h-[15rem] flex-col items-center justify-center gap-2 rounded-panel border-2
            border-ink p-4 text-center" style={{ background:'var(--g-main)' }}>
          <span className="grid size-12 place-items-center rounded-full border-2 border-paper font-display
            text-row font-bold text-paper">{n}</span>
          <span className="font-display text-ui font-bold text-paper">Tap to flip</span>
        </button>
        <div className={cn('g-back rounded-panel border border-rule bg-card p-3', reduced && '')}
          aria-hidden={!open}>
          <p className="font-display text-ui font-bold text-ink">{prompt.q}</p>
          <div className="mt-2 grid gap-1.5">
            {prompt.a.map(a => (
              <button key={a} type="button" tabIndex={open ? 0 : -1} aria-pressed={answer === a}
                onClick={() => onAnswer(a)}
                className={cn('min-h-[44px] rounded-field border-2 px-2.5 py-1.5 text-left text-fine transition-colors',
                  answer === a ? 'border-ink font-bold text-ink' : 'border-rule bg-card text-ink')}
                style={answer === a ? { background:'var(--g-wash)' } : undefined}>{a}</button>
            ))}
          </div>
          <form className="mt-2 flex gap-1.5" onSubmit={e => { e.preventDefault(); if (own.trim()) onAnswer(own.trim()) }}>
            <label className="min-w-0 flex-1">
              <span className="sr-only">Your own answer</span>
              <input tabIndex={open ? 0 : -1} className={cn(FIELD, 'p-2 text-fine')} value={own}
                onChange={e => setOwn(e.target.value)} placeholder="Or write your own"/>
            </label>
            <Button size="sm" type="submit" tabIndex={open ? 0 : -1} disabled={!own.trim()} className="px-3">Use</Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function Reframe() {
  const g = useGame('reframe')
  const [stage, setStage] = React.useState('pick')     // pick | flip | build | done
  const [thought, setThought] = React.useState('')
  const [own, setOwn] = React.useState('')
  const [cards, setCards] = React.useState(dealThree)
  const [open, setOpen] = React.useState([false, false, false])
  const [answers, setAnswers] = React.useState([null, null, null])
  const [order, setOrder] = React.useState([])
  const [text, setText] = React.useState('')
  const [journal, setJournal] = React.useState(readJournal)
  const [saved, setSaved] = React.useState(null)
  const box = React.useRef(null)

  const posOf = el => {
    const b = box.current?.getBoundingClientRect(), r = el?.getBoundingClientRect?.()
    return b && r ? { x:(r.left + r.width / 2 - b.left) / b.width * 100, y:(r.top - b.top) / b.height * 100 } : {}
  }

  const pick = (t, el) => { setThought(t); g.add(10, posOf(el)); setStage('flip') }

  const answer = (i, a) => {
    const first = answers[i] == null
    setAnswers(list => list.map((x, k) => k === i ? a : x))
    if (first) g.add(20, { x: 17 + i * 33, y: 30, sound:'good' })
  }

  const build = () => {
    setOrder([]); setText(opener(thought)); setStage('build')
  }
  const place = (i) => {
    if (order.includes(i)) return
    const next = [...order, i]
    setOrder(next)
    setText([opener(thought), ...next.map(k => answers[k])].join(' '))
    g.add(5, { x:50, y:10 })
  }

  const save = () => {
    const entry = { id: Date.now().toString(36), thought, balanced: text.trim() }
    const list = [entry, ...journal]
    const ok = writeJournal(list)
    setJournal(list); setSaved(ok)
    g.add(20, { x:50, y:60, label:'saved', sound:'good' })
    setTimeout(() => { setStage('done'); g.finish() }, 450)
  }

  const del = id => { const list = journal.filter(e => e.id !== id); writeJournal(list); setJournal(list) }

  const again = () => {
    g.reset(); setThought(''); setOwn(''); setCards(dealThree()); setOpen([false, false, false])
    setAnswers([null, null, null]); setOrder([]); setText(''); setSaved(null); setStage('pick')
  }

  const answered = answers.filter(a => a != null).length
  const STEPS = ['Pick', 'Flip', 'Build']
  const stepIx = { pick:0, flip:1, build:2, done:3 }[stage]

  return (
    <ActivityScreen family="leaf" title="Thought Reframe">
      <div style={g.vars} className="mx-auto w-full max-w-[60rem]">
        {stage !== 'done' && (
          <GameBar game={g} className="mb-3">
            <ol className="flex gap-3" aria-label="Steps">
              {STEPS.map((s, i) => (
                <li key={s} aria-current={i === stepIx ? 'step' : undefined}
                  className={cn('flex items-center gap-1.5 font-display text-fine',
                    i === stepIx ? 'font-bold text-ink' : 'text-ink-2')}>
                  <span aria-hidden className="size-2.5 rounded-full border-[1.5px] border-ink-3"
                    style={i <= stepIx ? { background:'var(--g-main)' } : undefined}/>{s}
                </li>
              ))}
            </ol>
          </GameBar>
        )}

        <div ref={box} className="relative">
          {stage === 'pick' && (
            <div>
              <h3 className="font-display text-row font-bold tracking-tight text-ink">Pick the thought</h3>
              <p className="mt-1 text-sec text-ink-2">The one that is loudest right now.</p>
              <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {THOUGHTS.map((t, k) => (
                  <button key={t} type="button" onClick={e => pick(t, e.currentTarget)}
                    style={{ animationDelay:`${k * 35}ms` }}
                    className={cn('min-h-[84px] rounded-panel border border-rule bg-card p-3 text-left font-display',
                      'text-ui font-semibold text-ink transition-transform duration-150 motion-safe:active:scale-[0.97]',
                      !g.reduced && 'g-in')}>{t}</button>
                ))}
              </div>
              <form className="mt-3 flex gap-2" onSubmit={e => { e.preventDefault(); if (own.trim()) pick(own.trim(), e.currentTarget) }}>
                <label className="min-w-0 flex-1">
                  <span className="sr-only">Write your own thought</span>
                  <input className={FIELD} value={own} onChange={e => setOwn(e.target.value)} placeholder="Or write your own"/>
                </label>
                <Button size="sm" type="submit" disabled={!own.trim()}>Use</Button>
              </form>
            </div>
          )}

          {stage === 'flip' && (
            <div>
              <p className="rounded-field p-3 font-display text-ui font-semibold text-ink"
                style={{ background:'var(--g-wash)' }}>{thought}</p>
              <h3 className="mt-3 font-display text-row font-bold tracking-tight text-ink">Flip three cards</h3>
              <p className="mt-1 text-sec text-ink-2">Pick the answer that fits best.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {cards.map((c, i) => (
                  <FlipCard key={c.q} n={i + 1} prompt={c} open={open[i]} answer={answers[i]}
                    reduced={g.reduced}
                    onFlip={() => { setOpen(o => o.map((x, k) => k === i ? true : x)); g.cue('turn') }}
                    onAnswer={a => answer(i, a)}/>
                ))}
              </div>
              <Button className="mt-4 w-full sm:w-auto sm:min-w-[12rem]" disabled={answered < 3} onClick={build}>
                {answered < 3 ? `${answered} of 3 answered` : 'Build it'}
              </Button>
            </div>
          )}

          {stage === 'build' && (
            <div>
              <h3 className="font-display text-row font-bold tracking-tight text-ink">Build a balanced thought</h3>
              <p className="mt-1 text-sec text-ink-2">Tap the pieces in the order you like.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {answers.map((a, i) => (
                  <button key={i} type="button" onClick={() => place(i)} disabled={order.includes(i)}
                    className={cn('min-h-[46px] rounded-field border border-rule px-3 py-2 text-left text-sec',
                      'transition-colors duration-150 disabled:opacity-40',
                      order.includes(i) ? 'bg-mist text-ink-2' : 'bg-card text-ink')}>{a}</button>
                ))}
              </div>
              <label className="mt-3 block">
                <span className="font-display text-ui font-bold text-ink">Your balanced thought</span>
                <textarea className={cn(FIELD, 'mt-2 min-h-[8rem] resize-y')} value={text}
                  onChange={e => setText(e.target.value)}/>
              </label>
              <Button className="mt-3 w-full sm:w-auto sm:min-w-[12rem]" onClick={save}
                disabled={order.length < 1 || !text.trim()}>Save to journal</Button>
            </div>
          )}
          <Pops game={g}/>
        </div>

        {stage === 'done' && (
          <EndCard game={g} title="Thought reframed"
            stats={[['Cards flipped', '3 of 3'], ['Pieces used', `${order.length} of 3`]]}
            onAgain={again}>
            <figure className="rounded-field p-3" style={{ background:'var(--g-wash)' }}>
              <p className="text-fine text-ink-2">Before: {thought}</p>
              <p className="mt-1 text-sec font-semibold text-ink">{text}</p>
            </figure>
            <p className="mt-2 text-fine text-ink-2">
              {saved ? 'Saved to your journal on this phone.' : 'Storage is blocked here, so this was not saved.'}
            </p>
            <DidItWork tool="reframe" phase="after" className="mt-3"/>
          </EndCard>
        )}

        {stage === 'pick' && (
          <>
            <LevelMeter className="mt-5 max-w-[34rem]"/>
            <DidItWork tool="reframe" phase="before" className="mt-4"/>
          </>
        )}
        {(stage === 'pick' || stage === 'done') && <Journal list={journal} onDelete={del} className="mt-4"/>}
        <OnDevice className="mt-4">Your words stay on this device.</OnDevice>
      </div>
    </ActivityScreen>
  )
}
