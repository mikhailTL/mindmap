import React from 'react'
import { Button } from '../ui/button'
import { Cross } from '../ui/marks'
import { StarRating } from '../ui/stars'
import { cn } from '../lib/utils'
import { PAGE, REQUIRED, SECTIONS } from './questions'
import {
  answersFor, getVersion, getVisitor, recordAnswer,
  subscribe, syncPending, submitResponse, wasSent, isQueued,
} from './store'

/* One survey, opened from a box in the corner. The box appears only once the
 * reviewer has been around the site and stays away once put away; the dialog
 * saves each answer as it is given, so closing it half-done loses nothing. */

/* An answer is a row on a ruled list, not a card: rules separate, and a bar, a
 * fill and a weight mark the chosen one. Kept byte for byte identical to the
 * page version in views/App.jsx so an answer looks the same whichever way it
 * is opened. Point values go to the store but are not printed — the label
 * already says which end of the scale it is. */
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

/* Same radio-group mechanics as the scale, but the options are named
   alternatives, so no numeral and no implied order. */
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

/* Zero to ten, wrapping on a phone. Both ends carry labels — an unlabelled
   0-10 row gets answered backwards. The only bordered cells in the survey: a
   horizontal scale of single figures has nothing else holding it together. */
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
        {/* The disabled Save says why it is disabled. */}
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

/* One question, whichever kind it is. Shared by the page cards and the final
 * block so wording and spacing cannot drift between them. */
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

/* The dialog offers no CSV: Submit is the action and it mails the response.
   src/views/Responses.jsx exports the spreadsheet. */


/* Subscribes to the store rather than lifting state: the corner box and the
   open survey must both see an answer the moment the other records it. */
function useSurvey() {
  return React.useSyncExternalStore(subscribe, getVersion, () => 0)
}

/* ------------------------------------------------------------ the survey */

const OFF_KEY = 'mindmap.review.off'
const SEEN_KEY = 'mindmap.review.seen'

const putAway = () => { try { sessionStorage.setItem(OFF_KEY, '1') } catch {} }
const isPutAway = () => { try { return sessionStorage.getItem(OFF_KEY) === '1' } catch { return false } }

/* The box waits for three distinct routes, which on this site means the
   reviewer has left the overview and opened something. */
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

/* The corner box: 56px of fixed chrome above the safe area, not a sheet, so
   the page needs no padding for it. */
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
            {/* This label reports the saved tally only. Delivery is the
                dialog's business — the box must not claim a send it has not
                checked. */}
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

  /* Four states, not a boolean: without a 'sending' state the control is mute
   * for the second or two the relay takes and gets pressed again. Derived from
   * the store, not held here, because a queued response retries itself in the
   * background and this has to notice. `busy` is the only local part. */
  const [busy, setBusy] = React.useState(false)
  const send = busy ? 'sending' : wasSent() ? 'sent' : isQueued() ? 'queued' : 'idle'

  /* Sends itself once the last required question is answered. Keyed on
   * completion so it fires on the transition, and submitResponse is the real
   * guard: it refuses once sentAt is set, so reopening a finished survey does
   * not post a second copy. */
  React.useEffect(() => {
    if (!complete) return
    let alive = true
    setBusy(true)
    submitResponse().finally(() => { if (alive) setBusy(false) })
    return () => { alive = false }
  }, [complete])

  /* The explicit path, for a deliberately partial response. force overrides
   * the once-only guard; the button disables itself after a success, so it
   * cannot send the same response twice. */
  const sendNow = () => {
    setBusy(true)
    submitResponse({ force: true }).finally(() => setBusy(false))
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
        {/* The tally only; that answers save themselves is said below, once. */}
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
              {/* Submit is the only control that acts on the answers. */}
              <Button
                size="sm"
                type="button"
                className="ml-auto min-h-[44px]"
                disabled={send === 'sending' || send === 'sent' || !answers.length}
                onClick={sendNow}
              >
                {send === 'sent' ? 'Submitted'
                  : send === 'sending' ? 'Sending'
                  : send === 'queued' ? 'Send again'
                  : 'Submit'}
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose}>
                {complete ? 'Close' : 'Come back to it'}
              </Button>
            </div>
            {/* No failure state: an undelivered response is queued and
                retried on its own, so the reviewer gets a receipt rather than
                a red line about the owner's activation link or relay. */}
            {send === 'queued' && (
              <p className="note mt-2.5">
                Saved. It goes out the next time this page is open, or as soon as you are
                back online.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReviewLauncher
