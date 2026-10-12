import React from 'react'
import { Button } from '../ui/button'
import { FIELD, Hint, Readout, Step, Tag, riseAt } from './panel'
import { cn } from '../lib/utils'

/* Thought Reframe. The reader's own sentence, scanned against a fixed list of
 * absolute words, with one question attached to each.
 *
 * THE RULEBOOK. The whole list is drawn, all nineteen words, before anything
 * is typed and again with the matches lit. That is the figure, and it is here
 * for two reasons. It is the honest one: a reader can see that this is a word
 * list and a lookup, so there is nothing left for them to imagine it is. And
 * it is the useful one, because a count against a known denominator says
 * something a bare list of hits does not: three of nineteen is a different
 * sentence from nine of nineteen.
 *
 * The matched chips and the marks in the sentence light in reading order, 40ms
 * apart, which is the scan happening rather than a result appearing. Under
 * reduced motion the keyframe lands on its end state, so every match is still
 * marked.
 *
 * The scan freezes on the press. Running it live while the reader typed meant
 * the marks restaged on every keystroke, and the second half of a sentence
 * being judged before it is finished is the opposite of what this is for. */

/* One row of the rulebook: the words that trigger it, and the question they
   get. Spellings are listed separately because the scanner matches spellings,
   and a reader looking for why "cant" lit should find "cant". */
const GROUPS = [
  { words: ['always'],                     ask: 'When has it gone differently, even once?' },
  { words: ['never'],                      ask: 'Never, or not yet?' },
  { words: ['everyone', 'everybody'],      ask: 'Name three of them.' },
  { words: ['nobody', 'no one'],           ask: 'Nobody, or nobody you have asked?' },
  { words: ['nothing'],                    ask: 'Nothing at all, or nothing today?' },
  { words: ['everything'],                 ask: 'Everything, or the two things in front of you?' },
  { words: ["can't", 'cant', 'cannot'],    ask: 'Cannot, or have not yet found a way?' },
  { words: ['should', 'must'],             ask: 'Whose rule is that?' },
  { words: ['ruined'],                     ask: 'Ruined for good, or bad for a week?' },
  { words: ['pointless'],                  ask: 'Pointless to who?' },
  { words: ['obviously'],                  ask: 'Obvious to who?' },
  { words: ['totally', 'completely'],      ask: 'How much of it, in a number?' },
  { words: ['worst'],                      ask: 'Worst so far, or worst there could be?' },
]

const LIST = Object.fromEntries(GROUPS.flatMap(g => g.words.map(w => [w, g.ask])))
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

/* The rulebook, drawn. Keyed on the scanned sentence at the call site so a
   second look replays the lighting rather than leaving it already on. */
function Rulebook({ found }) {
  const hit = new Set(found)
  let n = -1
  return (
    <div className="mt-3 rounded-panel border-2 border-ink bg-card p-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
        <Readout n={found.length} unit={found.length === 1 ? 'word matched' : 'words matched'}/>
        <Readout n={COUNT} unit="on the list"/>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {GROUPS.flatMap(g => g.words).map(w => {
          const on = hit.has(w)
          if (on) n += 1
          return <Tag key={w} on={on} style={on ? riseAt(n) : undefined}>{w}</Tag>
        })}
      </div>
      <p className="note mt-2.5">Every word this looks for is above. It compares your words to those
        nineteen and prints the question that goes with each match. There is nothing else in it.</p>
    </div>
  )
}

export function Absolutes() {
  const [text, setText] = React.useState('')
  const [again, setAgain] = React.useState('')
  const [shown, setShown] = React.useState('')     // the sentence as it was when Look was pressed
  const [run, setRun] = React.useState(0)          // replays the lighting on a second look
  const { out, found } = React.useMemo(() => scan(shown), [shown])
  const asked = GROUPS.filter(g => g.words.some(w => found.includes(w)))

  const look = () => { setShown(text); setRun(r => r + 1) }
  const clear = () => { setText(''); setAgain(''); setShown('') }

  let marked = -1

  return (
    <div>
      <p className="max-w-[54ch] text-sec text-ink-2">Write the sentence you are saying to yourself
        about this. The exact one, not a tidied version.</p>

      <textarea rows={3} value={text} maxLength={240} onChange={e => setText(e.target.value)}
        aria-label="The sentence you are saying to yourself"
        placeholder="I always mess this up and everyone noticed"
        className={cn(FIELD, 'mt-4')}/>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" disabled={!text.trim()} onClick={look}>Look at it</Button>
        {(text || again) && (
          <Button type="button" size="sm" variant="ghost" onClick={clear}>Clear</Button>
        )}
      </div>

      {/* The live region is the heading and the questions, not the rulebook:
          the rulebook remounts on every look to replay its lighting, and a
          remounted live region would read nineteen chips out again each time. */}
      <div aria-live="polite">
        <Step className="mt-6">{!shown.trim() ? 'What it looks for'
          : found.length === 0 ? 'Your sentence, nothing matched'
          : found.length === 1 ? 'Your sentence, one word matched'
          : `Your sentence, ${found.length} words matched`}</Step>
        {shown.trim() && (
          <p className="mt-3 max-w-[52ch] text-body leading-[1.6] text-ink">
            {out.map((t, i) => {
              if (!t.hit) return <React.Fragment key={i}>{t.text}</React.Fragment>
              marked += 1
              return (
                <mark key={i} style={riseAt(marked)}
                  className="kit-mark rounded-xs bg-warn-wash px-0.5 text-ink">{t.text}</mark>
              )
            })}
          </p>
        )}

        {shown.trim() && found.length === 0 && (
          <Hint className="mt-3">None of the {COUNT} words turned up. That does not mean the sentence is
            fair to you. It means this list did not catch anything. It is a word list, not a judge.</Hint>
        )}

        {asked.length > 0 && (
          <dl className="m-0 mt-4">
            {asked.map((g, i) => (
              <div key={g.ask} style={riseAt(i)} className="kit-rise border-b border-rule py-3">
                <dt className="flex flex-wrap gap-1.5">
                  {g.words.filter(w => found.includes(w)).map(w => <Tag key={w} on>{w}</Tag>)}
                </dt>
                <dd className="m-0 mt-1.5 max-w-[46ch] text-sec text-ink">{g.ask}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <Rulebook key={run} found={found}/>

      {asked.length > 0 && (
        <>
          <label htmlFor="words-again" className="mt-5 block font-display text-ui font-medium text-ink">
            Write it again, answering those
          </label>
          <textarea id="words-again" rows={3} value={again} maxLength={240}
            onChange={e => setAgain(e.target.value)} className={cn(FIELD, 'mt-2')}/>
          {again.trim() && (
            <div className="kit-ground mt-4 rounded-panel border-2 border-ink p-4">
              <p className="note">First go</p>
              <p className="mt-0.5 max-w-[52ch] text-sec text-ink-2">{shown}</p>
              <p className="note mt-3">Second go</p>
              <p className="mt-0.5 max-w-[52ch] text-body text-ink">{again}</p>
            </div>
          )}
        </>
      )}

      <Hint className="mt-6">Both versions stay in this panel. Nothing is saved or sent, and nothing
        here reads your sentence or decides whether you are right.</Hint>
    </div>
  )
}
