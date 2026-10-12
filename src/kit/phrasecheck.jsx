import React from 'react'
import { Button } from '../ui/button'
import { List, Item } from '../ui/list'
import { FIELD, Hint, Readout, Step, Tag, riseAt } from './panel'
import { cn } from '../lib/utils'

/* Opening Line Check. The sentence a parent was about to open with, matched
 * against ten written phrasings, each with a note on what it does to the
 * conversation.
 *
 * THE RULEBOOK, same figure as Thought Reframe on the student side and for the
 * same two reasons: a reader can see the whole list, so there is nothing to
 * mistake this for, and a count against ten says more than a bare list of
 * hits. The two tools are built alike on purpose. A parent and their teenager
 * comparing screens should recognise the other one's.
 *
 * The matched phrases are marked in the parent's own sentence rather than only
 * quoted underneath, because the point is which part of their line did it.
 * Marks light in reading order, 40ms apart, and the keyframe's end state is
 * the marked one, so reduced motion loses the scan and keeps every mark.
 *
 * Regular expressions over the typed text. No model, nothing learned, nothing
 * sent, and the panel says so where a reader will actually be reading. */

const PATTERNS = [
  { label: 'you always or you never',
    re: /\byou (always|never)\b/i,
    note: 'A claim about a pattern is arguable, so it gets argued. One instance is not.' },
  { label: 'why didn’t you',
    re: /\bwhy (did\s?n'?t|don'?t|are\s?n'?t) you\b/i,
    note: 'Asks her to defend a decision before she has described it.' },
  { label: 'the score',
    re: /\b(your|the|that) (score|number|reading|graph)\b/i,
    note: 'Leads with the data, so the conversation belongs to the app rather than to the two of you.' },
  { label: 'calm down',
    re: /\b(calm down|relax|cheer up|stop (worrying|stressing))\b/i,
    note: 'Tells her what to feel, which is the one thing nobody can do on request.' },
  { label: 'just',
    re: /\bjust\b/i,
    note: '“Just” makes the thing sound small. If it were small it would already be done.' },
  { label: 'at least',
    re: /\bat least\b/i,
    note: 'A comparison. It reads as a correction of how much this is allowed to hurt.' },
  { label: 'should',
    re: /\bshould\b/i,
    note: 'A rule. Worth knowing whose rule it is before you say it out loud.' },
  { label: 'when I was your age',
    re: /\bwhen i was your age\b/i,
    note: 'Moves the subject to you, and the comparison cannot be won.' },
  { label: 'nothing to worry about',
    re: /\bnothing to (worry|stress) about\b/i,
    note: 'Settles the question on her behalf, before she has said what the question is.' },
  { label: 'I am worried that',
    re: /\bI'?m (just )?(worried|concerned) (about|that)\b/i,
    note: 'Your worry becomes the thing she has to manage. True, and better said later.' },
]

const SHAPE = [
  'One thing you saw yourself, not a number. “You were quiet at dinner.”',
  'A question she can answer in one word. “Long day, or a bad one?”',
  'An offer with an exit in it. “I am around if you want. If not, that is fine.”',
]

/* Matches, in the order they appear in the sentence, with overlaps dropped so
   the marks below can be built by walking the string once. */
function run(text) {
  if (!text.trim()) return { hits: [], spans: [] }
  const hits = PATTERNS.map(p => {
    const m = text.match(p.re)
    return m ? { ...p, found: m[0], at: m.index } : null
  }).filter(Boolean)
  const spans = []
  for (const h of [...hits].sort((a, b) => a.at - b.at)) {
    const last = spans[spans.length - 1]
    if (last && h.at < last.at + last.found.length) continue
    spans.push(h)
  }
  return { hits, spans }
}

/* The sentence, with the phrasings that matched marked inside it. */
function Marked({ text, spans }) {
  const out = []
  let at = 0
  spans.forEach((s, i) => {
    if (s.at > at) out.push(<React.Fragment key={`t${i}`}>{text.slice(at, s.at)}</React.Fragment>)
    out.push(
      <mark key={`m${i}`} style={riseAt(i)}
        className="kit-mark rounded-xs bg-warn-wash px-0.5 text-ink">{text.slice(s.at, s.at + s.found.length)}</mark>
    )
    at = s.at + s.found.length
  })
  out.push(<React.Fragment key="rest">{text.slice(at)}</React.Fragment>)
  return <p className="mt-3 max-w-[52ch] text-body leading-[1.6] text-ink">{out}</p>
}

function Rulebook({ hits }) {
  const on = new Set(hits.map(h => h.label))
  let n = -1
  return (
    <div className="mt-3 rounded-panel border border-rule bg-card p-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
        <Readout n={hits.length} unit={hits.length === 1 ? 'phrasing matched' : 'phrasings matched'}/>
        <Readout n={PATTERNS.length} unit="on the list"/>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {PATTERNS.map(p => {
          const lit = on.has(p.label)
          if (lit) n += 1
          return <Tag key={p.label} on={lit} style={lit ? riseAt(n) : undefined}>{p.label}</Tag>
        })}
      </div>
      <p className="note mt-2.5">Every phrasing this knows is above. It looks for those ten in what you
        typed and prints the note that goes with each match. It cannot tell whether your sentence is
        kind, and it does not know your teenager.</p>
    </div>
  )
}

export function PhraseCheck() {
  const [text, setText] = React.useState('')
  const [shown, setShown] = React.useState('')     // the line as it was when Check was pressed
  const [pass, setPass] = React.useState(0)        // replays the lighting on a second check
  const { hits, spans } = React.useMemo(() => run(shown), [shown])

  return (
    <div>
      <p className="max-w-[54ch] text-sec text-ink-2">The sentence you were about to open with. Type it
        the way you would say it.</p>

      <textarea rows={3} value={text} maxLength={240} onChange={e => setText(e.target.value)}
        aria-label="What you were going to say"
        placeholder="I saw your score was high again, why didn't you say something?"
        className={cn(FIELD, 'mt-4')}/>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" disabled={!text.trim()}
          onClick={() => { setShown(text); setPass(p => p + 1) }}>Check it</Button>
        {text && <Button type="button" size="sm" variant="ghost"
          onClick={() => { setText(''); setShown('') }}>Clear</Button>}
      </div>

      {/* The live region is the heading and the notes, not the rulebook: the
          rulebook remounts on every check to replay its lighting, and a
          remounted live region would read ten chips out again each time. */}
      <div aria-live="polite">
        <Step className="mt-6">{!shown.trim() ? 'What it looks for'
          : hits.length === 0 ? 'Your line, nothing matched'
          : hits.length === 1 ? 'Your line, one phrasing matched'
          : `Your line, ${hits.length} phrasings matched`}</Step>
        {shown.trim() && <Marked text={shown} spans={spans}/>}

        {shown.trim() && hits.length === 0 && (
          <Hint className="mt-3">None of the {PATTERNS.length} matched. That is not approval. It means
            the phrasings this tool knows how to look for are not in your sentence.</Hint>
        )}

        {hits.length > 0 && (
          <dl className="m-0 mt-4">
            {hits.map((h, i) => (
              <div key={h.label} style={riseAt(i)} className="kit-rise border-b border-rule py-3">
                <dt className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <Tag on>{h.label}</Tag>
                  <span className="font-display text-ui font-bold text-ink">“{h.found}”</span>
                </dt>
                <dd className="m-0 mt-1.5 max-w-[48ch] text-sec text-ink">{h.note}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <Rulebook key={pass} hits={hits}/>

      <Step className="mt-6">A shape that usually holds</Step>
      <List className="mt-3">
        {SHAPE.map(s => <Item key={s}><span className="text-sec text-ink-2">{s}</span></Item>)}
      </List>
      <Hint className="mt-4">Nothing you type here is saved or sent anywhere.</Hint>
    </div>
  )
}
