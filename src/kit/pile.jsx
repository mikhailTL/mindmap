import React from 'react'
import { Button } from '../ui/button'
import { List, Item } from '../ui/list'
import { Choice, FIELD, Hint, Step } from './panel'
import { Cross } from '../ui/marks'
import { cn } from '../lib/utils'

/* Write the pile down, split it into what can move today and what cannot, then
 * one physical first move on the top item only.
 *
 * What comes back depends on what was entered and how it was split: nothing
 * actionable, one thing, or a list that has to be ordered because it cannot
 * all be first. No text leaves the component. */

const MAX = 8
let seq = 0

export function Pile() {
  const [text, setText] = React.useState('')
  const [items, setItems] = React.useState([])     // { id, text, bin }
  const [step, setStep] = React.useState('')

  const add = () => {
    const t = text.trim()
    if (!t || items.length >= MAX) return
    setItems(list => [...list, { id: ++seq, text: t.slice(0, 90), bin: null }])
    setText('')
  }
  const put = (id, bin) => setItems(l => l.map(i => (i.id === id ? { ...i, bin } : i)))
  const drop = id => setItems(l => l.filter(i => i.id !== id))
  const reset = () => { setItems([]); setText(''); setStep('') }

  const unsorted = items.filter(i => !i.bin)
  const today = items.filter(i => i.bin === 'today')
  const later = items.filter(i => i.bin === 'later')
  const sorted = items.length > 0 && unsorted.length === 0

  /* Order lives in `items`, so moving a today item swaps it with its
     neighbour in that same list rather than in a copy. */
  const shift = (id, dir) => setItems(l => {
    const order = l.filter(i => i.bin === 'today')
    const at = order.findIndex(i => i.id === id)
    const to = at + dir
    if (at < 0 || to < 0 || to >= order.length) return l
    const a = l.indexOf(order[at]), b = l.indexOf(order[to])
    const next = [...l]
    next[a] = l[b]; next[b] = l[a]
    return next
  })

  return (
    <div>
      <p className="max-w-[54ch] text-sec text-ink-2">A pile feels like one enormous thing. Written down
        it is four or five separate things, and most of them are not yours to fix today.</p>

      <Step className="mt-5">What is on your mind</Step>
      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <input value={text} maxLength={90} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="One thing at a time" aria-label="Something on your mind"
          className={cn(FIELD, 'min-w-[12rem] flex-1')}/>
        <Button type="button" size="sm" onClick={add} disabled={!text.trim() || items.length >= MAX}>Add</Button>
      </div>
      <Hint className="mt-2">
        {items.length >= MAX ? 'Eight is enough for one sitting.' : 'Short is fine. Nobody else reads this.'}
      </Hint>

      {unsorted.length > 0 && (
        <>
          <Step className="mt-6">Which of these could you move today</Step>
          <ul className="m-0 mt-3 list-none p-0">
            {unsorted.map(i => (
              <li key={i.id} className="border-b border-rule py-3">
                <div className="flex items-start gap-3">
                  <p className="min-w-0 flex-1 break-words text-body text-ink">{i.text}</p>
                  <button type="button" onClick={() => drop(i.id)} aria-label={`Remove ${i.text}`}
                    className="grid size-11 shrink-0 place-items-center rounded-field text-ink-3
                      transition-colors duration-150 hoverOnly:bg-mist hoverOnly:text-ink">
                    <Cross aria-hidden className="size-3.5"/>
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Choice onClick={() => put(i.id, 'today')}>I could move this today</Choice>
                  <Choice onClick={() => put(i.id, 'later')}>Not today</Choice>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {sorted && (
        <>
          <Step className="mt-6">What you have</Step>
          {today.length === 0 ? (
            <p className="mt-3 max-w-[52ch] text-body text-ink">Nothing on that list is yours to move
              today. That is an answer, not a failed sort. The pile is real and today is not where it
              gets solved. The pacer is the better use of the next five minutes.</p>
          ) : (
            <>
              <p className="mt-3 max-w-[52ch] text-body text-ink">
                {today.length === 1
                  ? 'One thing you can move. Write the first actual move and it stops being a worry.'
                  : today.length <= 3
                    ? 'Put them in the order you would be most relieved to finish. Only the top one needs a step.'
                    : `${today.length} things you could move today, which means none of them is first yet. Order them, then write a step for the top one only.`}
              </p>
              <ol className="m-0 mt-3 list-none p-0">
                {today.map((i, n) => (
                  <li key={i.id} className={cn('flex items-start gap-3 border-b border-rule py-3',
                    n === 0 && 'border-l-2 border-l-accent pl-3')}>
                    <span className="mt-0.5 w-[2ch] shrink-0 font-mono text-meta tabular-nums text-ink-3">{n + 1}</span>
                    <p className="min-w-0 flex-1 break-words text-body text-ink">{i.text}</p>
                    {today.length > 1 && (
                      <span className="flex shrink-0 gap-1">
                        <button type="button" onClick={() => shift(i.id, -1)} disabled={n === 0}
                          aria-label={`Move ${i.text} up`}
                          className="grid size-11 place-items-center rounded-field font-mono text-ink-2
                            transition-colors duration-150 hoverOnly:bg-mist disabled:opacity-40">↑</button>
                        <button type="button" onClick={() => shift(i.id, 1)} disabled={n === today.length - 1}
                          aria-label={`Move ${i.text} down`}
                          className="grid size-11 place-items-center rounded-field font-mono text-ink-2
                            transition-colors duration-150 hoverOnly:bg-mist disabled:opacity-40">↓</button>
                      </span>
                    )}
                  </li>
                ))}
              </ol>
              <label htmlFor="pile-step" className="mt-5 block font-display text-ui font-medium text-ink">
                First actual move on “{today[0].text}”
              </label>
              <input id="pile-step" value={step} maxLength={120} onChange={e => setStep(e.target.value)}
                placeholder="The message, the page, the question" className={cn(FIELD, 'mt-2')}/>
              <Hint className="mt-2">If it does not fit on one line it is still too big to start. Split it.</Hint>
            </>
          )}
          {later.length > 0 && (
            <>
              <Step className="mt-6">Not today</Step>
              <List className="mt-3">
                {later.map(i => (
                  <Item key={i.id}><span className="break-words text-sec text-ink-2">{i.text}</span></Item>
                ))}
              </List>
              <Hint className="mt-2">Still real, still written down, not being carried for the rest of
                the afternoon.</Hint>
            </>
          )}
          <div className="mt-6 border-t border-rule pt-4">
            <Button type="button" variant="outline" size="sm" onClick={reset}>Clear the pile</Button>
          </div>
        </>
      )}
    </div>
  )
}
