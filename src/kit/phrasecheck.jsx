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
    note: 'Always and never invite an argument. Talk about one time instead.' },
  { label: 'why didn’t you',
    re: /\bwhy (did\s?n'?t|don'?t|are\s?n'?t) you\b/i,
    note: 'Puts your teen on the defensive before they have explained.' },
  { label: 'the score',
    re: /\b(your|the|that) (score|number|reading|graph)\b/i,
    note: 'Starts with the data, so the talk is about the app instead of the two of you.' },
  { label: 'calm down',
    re: /\b(calm down|relax|cheer up|stop (worrying|stressing))\b/i,
    note: 'Tells your teen how to feel. Nobody can feel calm on request.' },
  { label: 'just',
    re: /\bjust\b/i,
    note: '“Just” makes the problem sound small.' },
  { label: 'at least',
    re: /\bat least\b/i,
    note: 'Compares it to something worse. It can sound like they should hurt less.' },
  { label: 'should',
    re: /\bshould\b/i,
    note: 'Sounds like a rule. Use it only if you mean it as one.' },
  { label: 'when I was your age',
    re: /\bwhen i was your age\b/i,
    note: 'Makes the talk about you and sets up a comparison.' },
  { label: 'nothing to worry about',
    re: /\bnothing to (worry|stress) about\b/i,
    note: 'Answers for your teen before they have said what is wrong.' },
  { label: 'I am worried that',
    re: /\bI'?m (just )?(worried|concerned) (about|that)\b/i,
    note: 'Your worry becomes something your teen has to manage. Save it for later in the talk.' },
]

const SHAPE = [
  'Start with something you saw, not a number. “You were quiet at dinner.”',
  'Ask a question they can answer in one word. “Long day, or a bad one?”',
  'Offer to talk with no pressure. “I am around if you want. If not, that is fine.”',
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
    <div className="mt-3 rounded-[18px] border border-rule bg-card p-3.5">
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
      <p className="note mt-2.5">It looks for these ten phrasings in what you typed and explains each
        match. It cannot tell if your sentence is kind, and it does not know your teen.</p>
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
      <p className="max-w-[54ch] text-sec text-ink-2">Type the first thing you plan to say to your teen.
        This checks it for phrasings that can shut a talk down.</p>

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
          : hits.length === 0 ? 'No phrasings matched'
          : hits.length === 1 ? '1 phrasing matched'
          : `${hits.length} phrasings matched`}</Step>
        {shown.trim() && <Marked text={shown} spans={spans}/>}

        {shown.trim() && hits.length === 0 && (
          <Hint className="mt-3">None of the {PATTERNS.length} phrasings this tool checks for are in your
            sentence.</Hint>
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

      <Step className="mt-6">A better way to start</Step>
      <List className="mt-3">
        {SHAPE.map(s => <Item key={s}><span className="text-sec text-ink-2">{s}</span></Item>)}
      </List>
      <Hint className="mt-4">Nothing you type here is saved.</Hint>
    </div>
  )
}
