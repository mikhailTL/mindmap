import React from 'react'
import { Button } from '../ui/button'
import { FIELD, Hint, Step } from './panel'
import { cn } from '../lib/utils'

/* The reader's own sentence, scanned against a fixed list of absolute words,
 * with a question attached to each one. No model, no interpretation: it is a
 * word list and a lookup, and the panel says so. */

const LIST = {
  always:     'When has it gone differently, even once?',
  never:      'Never, or not yet?',
  everyone:   'Name three of them.',
  everybody:  'Name three of them.',
  nobody:     'Nobody, or nobody you have asked?',
  'no one':   'Nobody, or nobody you have asked?',
  nothing:    'Nothing at all, or nothing today?',
  everything: 'Everything, or the two things in front of you?',
  "can't":    'Cannot, or have not yet found a way?',
  cant:       'Cannot, or have not yet found a way?',
  cannot:     'Cannot, or have not yet found a way?',
  should:     'Whose rule is that?',
  must:       'Whose rule is that?',
  ruined:     'Ruined for good, or bad for a week?',
  pointless:  'Pointless to who?',
  obviously:  'Obvious to who?',
  totally:    'How much of it, in a number?',
  completely: 'How much of it, in a number?',
  worst:      'Worst so far, or worst there could be?',
}

const COUNT = Object.keys(LIST).length

const bare = t => t.toLowerCase().replace(/[^a-z']/g, '')

/* Tokens keep their whitespace so the sentence can be rebuilt exactly, with
   the matches wrapped. Two-word entries are matched on the pair. */
function scan(text) {
  const parts = text.split(/(\s+)/)
  const out = []
  const found = []
  for (let i = 0; i < parts.length; i++) {
    const one = bare(parts[i])
    const pair = parts[i + 2] !== undefined ? one + ' ' + bare(parts[i + 2]) : ''
    if (pair && LIST[pair]) {
      out.push({ text: parts[i] + parts[i + 1] + parts[i + 2], hit: pair })
      found.push(pair)
      i += 2
      continue
    }
    if (LIST[one]) { out.push({ text: parts[i], hit: one }); found.push(one) }
    else out.push({ text: parts[i], hit: null })
  }
  return { out, found: [...new Set(found)] }
}

export function Absolutes() {
  const [text, setText] = React.useState('')
  const [again, setAgain] = React.useState('')
  const [looked, setLooked] = React.useState(false)
  const { out, found } = React.useMemo(() => scan(text), [text])

  return (
    <div>
      <p className="max-w-[54ch] text-sec text-ink-2">Write the sentence you are saying to yourself
        about this. The exact one, not a tidied version.</p>

      <textarea rows={3} value={text} maxLength={240} onChange={e => setText(e.target.value)}
        aria-label="The sentence you are saying to yourself"
        placeholder="I always mess this up and everyone noticed"
        className={cn(FIELD, 'mt-4')}/>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" disabled={!text.trim()} onClick={() => setLooked(true)}>
          Look at it
        </Button>
        {(text || again) && (
          <Button type="button" size="sm" variant="ghost"
            onClick={() => { setText(''); setAgain(''); setLooked(false) }}>Clear</Button>
        )}
      </div>

      {looked && text.trim() && (
        <>
          <Step className="mt-6">Your sentence</Step>
          <p className="mt-3 max-w-[52ch] text-body leading-[1.6] text-ink">
            {out.map((t, i) => t.hit
              ? <mark key={i} className="rounded-xs bg-warn-wash px-0.5 text-ink">{t.text}</mark>
              : <React.Fragment key={i}>{t.text}</React.Fragment>)}
          </p>

          {found.length === 0 ? (
            <Hint className="mt-4">None of the {COUNT} words on the list turned up. That does not mean
              the sentence is fair to you. It means this list did not catch anything. It is a word
              list, not a judge.</Hint>
          ) : (
            <>
              <Step className="mt-6">{found.length === 1 ? 'One word, one question' : `${found.length} words, ${found.length} questions`}</Step>
              <dl className="m-0 mt-3">
                {found.map(w => (
                  <div key={w} className="border-b border-rule py-3">
                    <dt className="font-display text-ui font-bold text-ink">{w}</dt>
                    <dd className="m-0 mt-1 max-w-[46ch] text-sec text-ink-2">{LIST[w]}</dd>
                  </div>
                ))}
              </dl>
              <label htmlFor="words-again" className="mt-5 block font-display text-ui font-medium text-ink">
                Write it again, answering those
              </label>
              <textarea id="words-again" rows={3} value={again} maxLength={240}
                onChange={e => setAgain(e.target.value)} className={cn(FIELD, 'mt-2')}/>
              {again.trim() && (
                <div className="mt-4 border-l-2 border-accent pl-4">
                  <p className="note">First go</p>
                  <p className="mt-0.5 max-w-[52ch] text-sec text-ink-2">{text}</p>
                  <p className="note mt-3">Second go</p>
                  <p className="mt-0.5 max-w-[52ch] text-body text-ink">{again}</p>
                </div>
              )}
            </>
          )}
        </>
      )}

      <Step className="mt-6">What this is doing</Step>
      <p className="mt-2.5 max-w-[58ch] text-sec text-ink-2">Matching your words against the {COUNT} absolute
        ones on the list, always, never, nobody and should among them, and printing the question that
        goes with each.
        It cannot read your sentence and it is not deciding whether you are right. The questions are
        the part that does the work, and they are the same questions every time.</p>
      <Hint className="mt-3">Both versions stay in this panel. Nothing is saved or sent.</Hint>
    </div>
  )
}
