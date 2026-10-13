import React from 'react'
import { Button } from '../ui/button'
import { cn } from '../lib/utils'
import { ActivityScreen, Sheet, Step, Note, Hit, Readout, FIELD, riseAt } from './shell'

/* Thought Reframe. The reader's own sentence, scanned against a written list of
 * absolute words, with one question attached to each.
 *
 * WHAT ACTUALLY RUNS. A tokeniser and a lookup, in this file, on this device.
 * That is the whole claim and the screen makes no other: the list is drawn in
 * full, all of it, before anything is typed and again with the matches lit, so
 * a reader can see exactly what the tool is. A count against a known
 * denominator says something a bare list of hits does not -- three of nineteen
 * is a different sentence from nine of nineteen -- and it is also the honest
 * way to show that this is a word list rather than a mind reader.
 *
 * Nothing is labelled as intelligence. Nothing is sent anywhere. The sentence
 * is gone when the screen closes.
 *
 * The scan runs on the press rather than on every keystroke: judging the first
 * half of a sentence before it is finished is the opposite of what this is for. */

const GROUPS = [
  { words:['always'],                    ask:'When has it gone differently, even once?' },
  { words:['never'],                     ask:'Never, or not yet?' },
  { words:['everyone', 'everybody'],     ask:'Name three of them.' },
  { words:['nobody', 'no one'],          ask:'Nobody, or nobody you have asked?' },
  { words:['nothing'],                   ask:'Nothing at all, or nothing today?' },
  { words:['everything'],                ask:'Everything, or the two things in front of you?' },
  { words:["can't", 'cant', 'cannot'],   ask:'Cannot, or have not found a way yet?' },
  { words:['should', 'must'],            ask:'Whose rule is that?' },
  { words:['ruined'],                    ask:'Ruined for good, or bad for a week?' },
  { words:['pointless'],                 ask:'Pointless to who?' },
  { words:['obviously'],                 ask:'Obvious to who?' },
  { words:['totally', 'completely'],     ask:'How much of it, as a number out of ten?' },
  { words:['worst'],                     ask:'Worst so far, or worst there could be?' },
]

const LIST = Object.fromEntries(GROUPS.flatMap(g => g.words.map(w => [w, g.ask])))
const COUNT = Object.keys(LIST).length

const bare = t => t.toLowerCase().replace(/[^a-z']/g, '')

/* Tokens keep their whitespace so the sentence rebuilds exactly with the
   matches wrapped. Two-word entries are matched on the pair. */
function scan(text) {
  const parts = text.split(/(\s+)/)
  const out = []
  const found = []
  for (let i = 0; i < parts.length; i++) {
    const one = bare(parts[i])
    const pair = parts[i + 2] !== undefined ? one + ' ' + bare(parts[i + 2]) : ''
    if (pair && LIST[pair]) {
      out.push({ text: parts[i] + parts[i + 1] + parts[i + 2], hit: pair })
      found.push(pair); i += 2; continue
    }
    if (LIST[one]) { out.push({ text: parts[i], hit: one }); found.push(one) }
    else out.push({ text: parts[i], hit: null })
  }
  return { out, found: [...new Set(found)] }
}

export default function Reframe() {
  const [text, setText] = React.useState('')
  const [done, setDone] = React.useState(null)

  const run = () => setDone(text.trim() ? scan(text) : null)
  const hitSet = new Set(done?.found || [])
  let lit = -1

  return (
    <ActivityScreen family="leaf" title="Thought Reframe" minutes="3 minutes"
      lede="Write the sentence that is going round. The page marks the absolute words in it and asks one question about each.">
      <Sheet>
        <Step>The sentence</Step>
        <label className="mt-2.5 block">
          <span className="sr-only">The sentence that is going round</span>
          <textarea className={cn(FIELD, 'min-h-[7.5rem] resize-y')} value={text} rows={3}
            onChange={e => setText(e.target.value)}
            placeholder="I always mess this up and everyone noticed."/>
        </label>
        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <Button size="sm" onClick={run} disabled={!text.trim()}>Mark the sentence</Button>
          {done && <Button size="sm" variant="outline"
            onClick={() => { setText(''); setDone(null) }}>Clear</Button>}
          <span className="ml-auto text-fine text-ink-3">Stays on this device. Nothing is saved.</span>
        </div>
      </Sheet>

      {done && (
        <Sheet className="mt-3" key={text}>
          <Step>Your sentence, marked</Step>
          <p className="mt-2.5 max-w-[52ch] text-body text-ink">
            {done.out.map((t, i) => t.hit
              ? <mark key={i} className="kit-mark kit-fill rounded-field px-1 text-paper"
                  style={riseAt(++lit)}>{t.text}</mark>
              : <span key={i}>{t.text}</span>)}
          </p>

          <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1.5
            border-t-2 border-ink pt-3.5">
            <Readout n={done.found.length}
              unit={done.found.length === 1 ? 'word matched' : 'words matched'}/>
            <Readout n={COUNT} unit="on the list"/>
          </div>

          {done.found.length === 0 && (
            <Note className="mt-3">Nothing on the list turned up, which is worth reading as it is:
              the sentence is already specific. The list is nineteen words long and it is printed
              below, so you can see what it was looking for.</Note>
          )}

          {done.found.length > 0 && (
            <ol className="mt-3.5 flex list-none flex-col gap-3 p-0">
              {done.found.map((w, i) => (
                <li key={w} className="kit-rise" style={riseAt(i)}>
                  <p className="font-display text-ui font-bold text-ink">{w}</p>
                  <p className="mt-1 max-w-[52ch] text-sec text-ink-2">{LIST[w]}</p>
                </li>
              ))}
            </ol>
          )}
        </Sheet>
      )}

      <Sheet className="mt-3">
        <Step>The whole list it checks against</Step>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {Object.keys(LIST).map(w => <Hit key={w} on={hitSet.has(w)}>{w}</Hit>)}
        </div>
        <Note className="mt-3">That is the entire tool: nineteen spellings and one question each,
          matched in this page. No model, no account, and nothing read by anybody else.</Note>
      </Sheet>
    </ActivityScreen>
  )
}
