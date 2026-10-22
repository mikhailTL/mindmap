import React from 'react'
import { Button } from '../ui/button'
import { Choice, FIELD, Hint, Step, riseAt } from './panel'
import { cn } from '../lib/utils'

const STEPS = [
  { id:'see',   n:5, ask:'Five things you can see',            eg:'a door handle, the corner of a screen' },
  { id:'hear',  n:4, ask:'Four things you can hear',           eg:'a fan, traffic, somebody two rooms away' },
  { id:'feel',  n:3, ask:'Three things you can feel touching you', eg:'the chair, a sleeve, the floor' },
  { id:'smell', n:2, ask:'Two things you can smell',           eg:'or nothing, which is an answer' },
  { id:'taste', n:1, ask:'One thing you can taste',            eg:'water counts' },
]

const empty = () => Object.fromEntries(STEPS.map(s => [s.id, []]))

// A five-column grid, so a rung with fewer slots reads as part of five rather than a full-width bar.
function Rung({ step, done, live, skipped }) {
  return (
    <div className={cn('flex items-center gap-3 border-l-2 py-1.5 pl-2.5 transition-colors duration-200',
      live ? 'kit-edge' : 'border-l-transparent')}>
      <span className={cn('w-[5.5ch] shrink-0 font-display text-fine',
        live ? 'font-bold text-ink' : 'font-medium text-ink-2')}>{step.id}</span>
      <span className="grid min-w-0 flex-1 grid-cols-5 gap-1.5">
        {Array.from({ length: step.n }, (_, i) => (
          <span key={i} className={cn('h-2.5 rounded-bar origin-center',
            'transition-[background-color,transform] duration-200 ease-[var(--ease-out)]',
            i < done ? 'scale-y-100 kit-fill'
              : skipped ? 'scale-y-[0.45] bg-ruling'
              : 'scale-y-[0.45] bg-mist')}/>
        ))}
      </span>
      <span className="w-[4.5ch] shrink-0 text-right font-mono text-fine tabular-nums text-ink-2">
        {skipped ? 'skip' : `${done}/${step.n}`}
      </span>
    </div>
  )
}

export function Senses() {
  const [at, setAt] = React.useState(0)
  const [got, setGot] = React.useState(empty)
  const [text, setText] = React.useState('')
  const [skipped, setSkipped] = React.useState(() => new Set())
  const step = STEPS[at]
  const done = at >= STEPS.length

  const add = () => {
    const t = text.trim()
    if (!t || !step) return
    const next = [...got[step.id], t.slice(0, 60)]
    setGot(g => ({ ...g, [step.id]: next }))
    setText('')
    if (next.length >= step.n) setAt(a => a + 1)
  }

  const skip = () => {
    setSkipped(s => new Set(s).add(step.id))
    setText('')
    setAt(a => a + 1)
  }

  const reset = () => { setAt(0); setGot(empty()); setText(''); setSkipped(new Set()) }

  return (
    <div>
      <p className="max-w-[54ch] text-sec text-ink-2">Attention goes where it is sent. This sends it
        outwards, one sense at a time, and keeps count so you do not have to.</p>

      <div className="kit-ground mt-5 rounded-[18px] border border-rule p-3 sm:p-4">
        {STEPS.map((s, i) => (
          <Rung key={s.id} step={s} done={got[s.id].length} live={!done && i === at}
            skipped={skipped.has(s.id)}/>
        ))}
      </div>

      {!done && (
        <>
          <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="font-display text-row font-bold text-ink">{step.ask}</p>
            <p className="text-meta text-ink-2">
              <span className="font-mono tabular-nums">{got[step.id].length}</span> of{' '}
              <span className="font-mono tabular-nums">{step.n}</span>
            </p>
          </div>
          <p className="note mt-1">{step.eg}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <input value={text} maxLength={60} onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
              aria-label={step.ask} placeholder="What you noticed"
              className={cn(FIELD, 'min-w-[11rem] flex-1')}/>
            <Button type="button" size="sm" onClick={add} disabled={!text.trim()}>Add</Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Choice onClick={skip}>Nothing for this one</Choice>
            {at > 0 && <Choice onClick={reset}>Start again</Choice>}
          </div>
          {got[step.id].length > 0 && (
            <ul className="m-0 mt-4 flex list-none flex-wrap gap-2 p-0">
              {got[step.id].map((g, i) => (
                <li key={i} style={riseAt(i)} className="kit-rise rounded-field border border-rule bg-card
                  px-2.5 py-1 text-fine text-ink-2">{g}</li>
              ))}
            </ul>
          )}
        </>
      )}

      {done && (
        <>
          <Step className="mt-5">Fifteen seconds ago you could not have listed any of this</Step>
          <dl className="m-0 mt-3">
            {STEPS.map((s, i) => (
              <div key={s.id} style={riseAt(i)}
                className="kit-rise flex flex-wrap items-baseline gap-x-3 border-b border-rule py-2.5">
                <dt className="w-[6ch] shrink-0 font-display text-ui font-bold text-ink-2">{s.id}</dt>
                <dd className="m-0 min-w-0 flex-1 break-words text-sec text-ink">
                  {skipped.has(s.id) ? <span className="text-ink-3">skipped</span> : got[s.id].join(', ')}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 max-w-[52ch] text-body text-ink">That is the whole exercise. If the room
            still feels loud, run it again on different things.</p>
          <div className="mt-4"><Button type="button" variant="outline" size="sm" onClick={reset}>Run it again</Button></div>
        </>
      )}
      <Hint className="mt-6">Everything you typed is in this panel and nowhere else.</Hint>
    </div>
  )
}
