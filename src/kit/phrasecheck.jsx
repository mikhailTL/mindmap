import React from 'react'
import { Button } from '../ui/button'
import { List, Item } from '../ui/list'
import { FIELD, Hint, Step } from './panel'
import { cn } from '../lib/utils'

/* Type the sentence you were going to say and see which known patterns are in
 * it. A list of regular expressions and a note for each. It cannot tell you
 * whether your sentence is kind, and the panel says so twice. */

const PATTERNS = [
  { re: /\byou (always|never)\b/i,
    note: 'A claim about a pattern is arguable, so it gets argued. One instance is not.' },
  { re: /\bwhy (did\s?n'?t|don'?t|are\s?n'?t) you\b/i,
    note: 'Asks her to defend a decision before she has described it.' },
  { re: /\b(your|the|that) (score|number|reading|graph)\b/i,
    note: 'Leads with the data, so the conversation belongs to the app rather than to the two of you.' },
  { re: /\b(calm down|relax|cheer up|stop (worrying|stressing))\b/i,
    note: 'Tells her what to feel, which is the one thing nobody can do on request.' },
  { re: /\bjust\b/i,
    note: '“Just” makes the thing sound small. If it were small it would already be done.' },
  { re: /\bat least\b/i,
    note: 'A comparison. It reads as a correction of how much this is allowed to hurt.' },
  { re: /\bshould\b/i,
    note: 'A rule. Worth knowing whose rule it is before you say it out loud.' },
  { re: /\bwhen i was your age\b/i,
    note: 'Moves the subject to you, and the comparison cannot be won.' },
  { re: /\bnothing to (worry|stress) about\b/i,
    note: 'Settles the question on her behalf, before she has said what the question is.' },
  { re: /\bI'?m (just )?(worried|concerned) (about|that)\b/i,
    note: 'Your worry becomes the thing she has to manage. True, and better said later.' },
]

const SHAPE = [
  'One thing you saw yourself, not a number. “You were quiet at dinner.”',
  'A question she can answer in one word. “Long day, or a bad one?”',
  'An offer with an exit in it. “I am around if you want. If not, that is fine.”',
]

export function PhraseCheck() {
  const [text, setText] = React.useState('')
  const [looked, setLooked] = React.useState(false)
  const hits = React.useMemo(() => {
    if (!text.trim()) return []
    return PATTERNS.map(p => {
      const m = text.match(p.re)
      return m ? { found: m[0], note: p.note } : null
    }).filter(Boolean)
  }, [text])

  return (
    <div>
      <p className="max-w-[54ch] text-sec text-ink-2">The sentence you were about to open with. Type it
        the way you would say it.</p>

      <textarea rows={3} value={text} maxLength={240} onChange={e => setText(e.target.value)}
        aria-label="What you were going to say"
        placeholder="I saw your score was high again, why didn't you say something?"
        className={cn(FIELD, 'mt-4')}/>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" disabled={!text.trim()} onClick={() => setLooked(true)}>Check it</Button>
        {text && <Button type="button" size="sm" variant="ghost"
          onClick={() => { setText(''); setLooked(false) }}>Clear</Button>}
      </div>

      {looked && text.trim() && (
        <div aria-live="polite">
          <Step className="mt-6">
            {hits.length === 0 ? 'No known patterns in it'
              : hits.length === 1 ? 'One known pattern in it'
              : `${hits.length} known patterns in it`}
          </Step>
          {hits.length === 0 ? (
            <Hint className="mt-3">None of the {PATTERNS.length} patterns matched. That is not approval.
              It means the phrasings this tool knows how to look for are not in your sentence.</Hint>
          ) : (
            <dl className="m-0 mt-3">
              {hits.map(h => (
                <div key={h.note} className="border-b border-rule py-3">
                  <dt className="font-display text-ui font-bold text-ink">“{h.found}”</dt>
                  <dd className="m-0 mt-1 max-w-[48ch] text-sec text-ink-2">{h.note}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}

      <Step className="mt-6">A shape that usually holds</Step>
      <List className="mt-3">
        {SHAPE.map(s => <Item key={s}><span className="text-sec text-ink-2">{s}</span></Item>)}
      </List>
      <Hint className="mt-4">Pattern matching on a list of {PATTERNS.length} phrasings, running in your
        browser. It cannot read your sentence, it does not know your teenager, and what you type is
        never sent anywhere.</Hint>
    </div>
  )
}
