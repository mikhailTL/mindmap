import React from 'react'
import { Button } from '../ui/button'
import { Cross } from '../ui/marks'
import { StarRating } from '../ui/stars'
import { cn } from '../lib/utils'
import { PAGE, REQUIRED, SECTIONS } from './questions'
import {
  answersFor, getVersion, getVisitor, recordAnswer,
  subscribe, syncPending, submitResponse, wasSent,
} from './store'

/* One survey, opened from a small box in the corner.
 *
 * What was here: a card that armed itself after twelve seconds or forty per
 * cent of a scroll and then asked two questions, on every page, eight times a
 * visit. It was dismissed as a pop-up because it was one. A reviewer's words
 * for it were "very annoying", which is the correct review of any element that
 * appears over the thing a person is reading without being asked for.
 *
 * What replaces it interrupts nothing. A small box sits in the corner once the
 * reviewer has actually been around the site; it can be put away and it stays
 * away; and the survey itself opens as a dialog they chose to open, holds every
 * question in one place, and saves each answer the moment it is given so
 * closing it half-done loses nothing.
 */

/* An answer is a row on a ruled list, not a card.
 *
 * Every option here used to be a bordered rounded box, so a seven-option
 * question was seven identical capsules in a column and the whole survey was a
 * hundred and forty of them. The box adds nothing the hairline above the row
 * does not already do, and a column of them buries which one is picked under
 * the sameness of the rest. Rules separate; a bar, a fill and a weight say
 * which one is chosen. Kept byte for byte the same as the page version in
 * views/App.jsx, so an answer looks identical whichever way it is opened.
 *
 * The point's number used to be printed in front of its label in the mono
 * face, a stamp on every row of a five-row group. The label already says which
 * end of the scale it is. The value still goes to the store; it is only off
 * the screen. */
const pickClass = on => cn(
  'flex min-h-[44px] w-full items-center border-t border-rule pr-3 text-left',
  'font-display text-ui transition-colors duration-150 ease-out',
  on ? 'bg-accent-wash font-bold text-ink' : 'font-medium text-ink-2 hoverOnly:bg-mist hoverOnly:text-ink'
)

const Bar = ({ on }) => (
  <span aria-hidden className={cn('mr-3 h-5 w-[3px] shrink-0 rounded-bar',
    on ? 'bg-accent' : 'bg-transparent')}/>
)

function ScaleControl({ q, value, onPick }) {
  return (
    <div role="radiogroup" aria-label={q.prompt} className="mt-3 flex flex-col">
      {q.points.map(p => {
        const on = value === p.value
        return (
          <button
            key={p.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onPick(p.value, p.label)}
            className={pickClass(on)}
          >
            <Bar on={on}/>{p.label}
          </button>
        )
      })}
    </div>
  )
}

/* A multiple choice. Same radio-group mechanics as the scale, but the options
   are named alternatives rather than points on a line, so they carry no
   numeral and no implied order: numbering "On the forearm / On the chest"
   would suggest one is higher than another. */
function ChoiceControl({ q, value, onPick }) {
  return (
    <div className="mt-3 flex flex-col" role="radiogroup" aria-label={q.prompt}>
      {q.options.map(opt => {
        const on = value === opt
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onPick(opt, opt)}
            className={pickClass(on)}
          >
            <Bar on={on}/>{opt}
          </button>
        )
      })}
    </div>
  )
}

/* Zero to ten in a row. Eleven buttons is a lot for a phone, so they wrap and
   the two ends carry their own labels: an unlabelled 0-10 row gets answered
   backwards by roughly the people you least want to misread. The only bordered
   cells left in the survey, because a horizontal scale of single figures has
   nothing else to hold it together. */
function NpsControl({ q, value, onPick }) {
  return (
    <div className="mt-3">
      <div role="radiogroup" aria-label={q.prompt} className="flex flex-wrap gap-1.5">
        {Array.from({ length: 11 }, (_, n) => {
          const on = value === n
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${n} out of 10`}
              onClick={() => onPick(n, String(n))}
              className={cn(
                'min-h-[44px] min-w-[44px] flex-1 rounded-field border text-ui tabular-nums',
                'transition-[background-color,border-color,color] duration-150 ease-out',
                on
                  ? 'border-ink bg-ink font-bold text-paper'
                  : 'border-rule font-medium text-ink-2 hoverOnly:border-ink-3 hoverOnly:bg-mist'
              )}
            >
              {n}
            </button>
          )
        })}
      </div>
      <div className="mt-2 flex justify-between text-fine text-ink-3">
        <span>{q.low}</span>
        <span>{q.high}</span>
      </div>
    </div>
  )
}

function TextControl({ q, initial = '', onSave, onSkip, saveLabel = 'Save' }) {
  const [text, setText] = React.useState(initial)
  const empty = !text.trim()
  const id = React.useId()
  return (
    <div className="mt-3">
      <textarea
        id={id}
        rows={3}
        value={text}
        maxLength={q.maxLength}
        placeholder={q.placeholder}
        onChange={e => setText(e.target.value)}
        aria-label={q.prompt}
        className={cn(
          'block w-full rounded-field border border-rule bg-paper p-3',
          'font-body text-sec text-ink placeholder:text-ink-3',
          'transition-[border-color,background-color] duration-150 ease-out',
          'hoverOnly:border-ink-3 focus:bg-card'
        )}
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        {/* The disabled Save says why it is disabled. The old pair also printed
            "Ready to save." the instant a key was pressed, which is a sentence
            that reports what the reader just did. */}
        <span className="note">{empty ? 'Save turns on once you write something.' : ''}</span>
        <span className="text-fine tabular-nums text-ink-3">
          {text.length}/{q.maxLength}
        </span>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <Button size="sm" type="button" disabled={empty} onClick={() => onSave(text.trim())}>
          {saveLabel}
        </Button>
        {onSkip && (
          <Button size="sm" type="button" variant="ghost" onClick={onSkip}>Skip</Button>
        )}
      </div>
    </div>
  )
}

function ImpactControl({ q, initial, onSave, onSkip }) {
  const [score, setScore] = React.useState(initial?.score ?? null)
  const [label, setLabel] = React.useState(initial?.label ?? null)
  const [note, setNote] = React.useState(initial?.note ?? '')
  return (
    <div>
      <ScaleControl q={q} value={score} onPick={(v, l) => { setScore(v); setLabel(l) }} />
      <label className="mt-5 block font-display text-ui font-medium text-ink">
        {q.sentence.prompt}
      </label>
      <textarea
        rows={2}
        value={note}
        maxLength={q.sentence.maxLength}
        placeholder={q.sentence.placeholder}
        onChange={e => setNote(e.target.value)}
        className={cn(
          'mt-2 block w-full rounded-field border border-rule bg-paper p-3',
          'font-body text-sec text-ink placeholder:text-ink-3',
          'transition-[border-color,background-color] duration-150 ease-out',
          'hoverOnly:border-ink-3 focus:bg-card'
        )}
      />
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
        <Button
          size="sm"
          type="button"
          disabled={score == null}
          onClick={() => onSave({ score, note: note.trim() }, label)}
        >
          Save
        </Button>
        {onSkip && (
          <Button size="sm" type="button" variant="ghost" onClick={onSkip}>Skip</Button>
        )}
      </div>
      {score == null && <p className="note mt-2">Pick a point above first.</p>}
    </div>
  )
}

/* One question, whichever of the five kinds it is. Page cards and the final
 * block share it so a wording or spacing change cannot apply to one and not
 * the other. */
function Question({ q, answer, onAnswer, onSkip }) {
  if (q.kind === 'scale') {
    return <ScaleControl q={q} value={answer?.value ?? null} onPick={(v, l) => onAnswer(v, l)} />
  }
  if (q.kind === 'choice') {
    return <ChoiceControl q={q} value={typeof answer?.value === 'string' ? answer.value : null}
      onPick={(v, l) => onAnswer(v, l)} />
  }
  if (q.kind === 'text') {
    return (
      <TextControl
        q={q}
        initial={typeof answer?.value === 'string' ? answer.value : ''}
        onSave={v => onAnswer(v, null)}
        onSkip={q.optional ? onSkip : undefined}
      />
    )
  }
  if (q.kind === 'nps') {
    return <NpsControl q={q} value={typeof answer?.value === 'number' ? answer.value : null}
      onPick={(v, l) => onAnswer(v, l)} />
  }
  if (q.kind === 'stars') {
    return (
      <div className="mt-3">
        <StarRating
          label={q.prompt}
          max={q.max}
          step={q.step}
          value={typeof answer?.value === 'number' ? answer.value : null}
          onChange={v => onAnswer(v, `${v} of ${q.max}`)}
        />
      </div>
    )
  }
  if (q.kind === 'impact') {
    return (
      <ImpactControl
        q={q}
        initial={answer?.value && typeof answer.value === 'object'
          ? { ...answer.value, label: answer.label } : null}
        onSave={(v, l) => onAnswer(v, l)}
        onSkip={onSkip}
      />
    )
  }
  return null
}

/* csvName and downloadCSV lived here. The dialog no longer offers a reviewer
   their own answers as a file: Submit is the action, and it mails them.
   src/views/Responses.jsx still exports everything for the one person who
   actually needs a spreadsheet. */


/* Subscribing to the store rather than lifting state: the corner box and the
   open survey both have to see an answer the moment the other records it. */
function useSurvey() {
  return React.useSyncExternalStore(subscribe, getVersion, () => 0)
}

/* ------------------------------------------------------------ the survey */

const OFF_KEY = 'mindmap.review.off'
const SEEN_KEY = 'mindmap.review.seen'

const putAway = () => { try { sessionStorage.setItem(OFF_KEY, '1') } catch {} }
const isPutAway = () => { try { return sessionStorage.getItem(OFF_KEY) === '1' } catch { return false } }

/* The box waits until the reviewer has actually been somewhere. Asking someone
   to review a site they have seen one page of produces an answer about one
   page. Three distinct routes is the threshold, which on this site means they
   have at least left the overview and opened something. */
const SEEN_MIN = 3
function noteVisit(page) {
  try {
    const seen = new Set(JSON.parse(sessionStorage.getItem(SEEN_KEY) || '[]'))
    seen.add(page)
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen]))
    return seen.size
  } catch { return 0 }
}

function countAnswered() {
  const have = new Set(answersFor(PAGE).map(a => a.qid))
  return REQUIRED.filter(q => have.has(q.id)).length
}

/* The corner box. Fixed, small, and out of the way of everything: it never
   covers page content on a phone because it sits above the safe area and the
   page is not padded for it: it is 56px of chrome, not a sheet. */
export function ReviewLauncher({ page }) {
  useSurvey()
  const [open, setOpen] = React.useState(false)
  const [hidden, setHidden] = React.useState(true)
  const [seen, setSeen] = React.useState(0)

  React.useEffect(() => {
    setSeen(noteVisit(page))
    setHidden(isPutAway())
  }, [page])

  const done = countAnswered()
  const total = REQUIRED.length
  const started = done > 0
  const finished = done >= total
  if (hidden || (seen < SEEN_MIN && !started)) return null

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 print:hidden sm:bottom-6 sm:right-6">
        <div className="flex items-stretch overflow-hidden rounded-panel border border-ink bg-card shadow-lift">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex min-h-[48px] items-center gap-3 px-4 text-left hoverOnly:bg-mist"
          >
            {/* "Review sent" was a lie for as long as nothing was sent
                anywhere. A finished response is now mailed out on its own, but
                the label still reports only what this box can see, which is
                the saved tally: whether the relay accepted the mail is the
                survey's business and not the corner box's, and a box that
                claimed delivery it has not checked would be the same lie
                again. */}
            <span className="font-display text-ui font-medium text-ink">
              {finished ? 'All saved, thanks' : started ? 'Finish the feedback' : 'Tell me what to fix'}
            </span>
            <span className="text-fine font-medium tabular-nums text-ink-3">
              {started ? `${done}/${total}` : '3 min'}
            </span>
          </button>
          <button
            type="button"
            aria-label="Put this away"
            onClick={() => { putAway(); setHidden(true) }}
            className="grid w-11 place-items-center border-l border-rule text-ink-3 hoverOnly:bg-mist hoverOnly:text-ink"
          >
            <Cross className="size-3.5"/>
          </button>
        </div>
      </div>
      {open && <ReviewDialog onClose={() => setOpen(false)}/>}
    </>
  )
}

function ReviewDialog({ onClose }) {
  useSurvey()
  const ref = React.useRef(null)
  const [skipped, setSkipped] = React.useState(() => new Set())

  React.useEffect(() => { syncPending() }, [])
  React.useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ref.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const answers = answersFor(PAGE)
  const byId = new Map(answers.map(a => [a.qid, a]))
  const done = REQUIRED.filter(q => byId.has(q.id)).length
  const total = REQUIRED.length
  const visitor = getVisitor()
  const complete = done >= total

  /* Four states and not a boolean. A control that cannot say it is working says
   * nothing at all while the relay takes its second or two, and a reviewer who
   * gets no answer presses it again. */
  const [send, setSend] = React.useState(() => (wasSent() ? 'sent' : 'idle'))

  /* The response goes out by itself the moment the last required question is
   * answered: a reviewer who has answered everything has finished, and should
   * not have to find a button to prove it. Keyed on completion so it fires on
   * the transition rather than once per render, and submitResponse is the real
   * guard anyway: it refuses once sentAt is set, so reopening a finished survey
   * does not post the same response a second time. */
  React.useEffect(() => {
    if (!complete) return
    let alive = true
    setSend(prev => (prev === 'sent' ? prev : 'sending'))
    submitResponse().then(ok => {
      if (!alive) return
      /* A refusal from an already-sent record is not a failure to report. */
      setSend(ok || wasSent() ? 'sent' : 'failed')
    })
    return () => { alive = false }
  }, [complete])

  /* The explicit path, for a reviewer who has said the one thing they came to
   * say and is not going to answer the other eleven. force overrides the
   * once-only guard; the button is disabled once it has succeeded, so it cannot
   * be used to send the same response twice over. */
  const sendNow = () => {
    setSend('sending')
    submitResponse({ force: true }).then(ok => setSend(ok ? 'sent' : 'failed'))
  }

  const answer = (q, value, label) =>
    recordAnswer({ page: PAGE, qid: q.id, kind: q.kind, value, label })

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-ink/45 p-0 sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tell me what to fix"
        tabIndex={-1}
        ref={ref}
        className="mx-auto min-h-full w-full max-w-[42rem] bg-paper sm:min-h-0 sm:rounded-panel"
      >
        {/* The count under the heading was the line the review pointed at:
            "12 of 12 answered · saved as you go", set in the mono face, saying
            the same thing twice. The tally is worth a line. That every answer
            saves itself belongs in the sentence below, once. */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-rule bg-paper px-5 py-3.5 sm:rounded-t-panel sm:px-8">
          <div>
            <h2 className="font-display text-sub font-bold text-ink">Tell me what to fix</h2>
            <p className="mt-0.5 text-fine font-medium tabular-nums text-ink-3">
              {done} of {total} answered
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
        </div>

        <div className="px-5 pb-9 pt-5 sm:px-8">
          <p className="max-w-[52ch] text-sec text-ink-2">
            {visitor ? `${visitor.name}, ` : ''}about three minutes. Answers save as you give them,
            so closing this loses nothing, and they go on to the person building MindMap once you
            are through. The only thing kept alongside them is the name you gave.
          </p>

          {SECTIONS.map(section => (
            <section key={section.id} className="mt-8">
              <h3 className="mark">{section.title}</h3>
              {section.note && <p className="mt-1.5 max-w-[52ch] text-meta text-ink-3">{section.note}</p>}
              <div className="mt-5 flex flex-col gap-6">
                {section.items.map(q => {
                  const a = byId.get(q.id)
                  const isSkipped = skipped.has(q.id)
                  return (
                    <div key={q.id} className="border-t border-rule pt-4">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <p className="max-w-[44ch] font-display text-ui font-bold text-ink">{q.prompt}</p>
                        {q.optional && <span className="note">Optional</span>}
                      </div>
                      {isSkipped && !a ? (
                        <p className="note mt-3">Skipped.</p>
                      ) : (
                        <Question
                          q={q}
                          answer={a}
                          onAnswer={(v, l) => answer(q, v, l)}
                          onSkip={() => setSkipped(new Set(skipped).add(q.id))}
                        />
                      )}
                      {a && (
                        <p className="mt-2.5 text-fine font-medium text-calm">
                          Saved{a.label ? `, ${a.label}` : ''}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}

          <div className="mt-8 border-t border-rule pt-5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <p className="note">
                {complete
                  ? 'That is all of them. Thanks.'
                  : `${total - done} to go.`}
              </p>
              {/* Submit is the filled control and the only one that does
                  anything to the answers. "Download my answers" used to stand
                  here as a ghost button beside it, and on the survey PAGE it
                  was the only control at all, which meant the default outcome
                  of filling in a review was that nobody read it. Close is the
                  quiet one, because leaving is not the point of the dialog. */}
              <Button
                size="sm"
                type="button"
                className="ml-auto min-h-[44px]"
                disabled={send === 'sending' || send === 'sent' || !answers.length}
                onClick={sendNow}
              >
                {send === 'sent' ? 'Submitted' : send === 'sending' ? 'Sending' : 'Submit'}
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose}>
                {complete ? 'Close' : 'Come back to it'}
              </Button>
            </div>
            {send === 'failed' && (
              <p className="note mt-2.5">That did not send. Try again in a moment.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReviewLauncher
