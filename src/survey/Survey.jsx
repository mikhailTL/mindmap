import React from 'react'
import { Button } from '../ui/button'
import { Cross } from '../ui/marks'
import { StarRating } from '../ui/stars'
import { cn } from '../lib/utils'
import { PAGE, questionNumber, REQUIRED, SECTIONS } from './questions'
import {
  answersFor, getVersion, getVisitor, recordAnswer,
  subscribe, syncPending, submitResponse, wasSent, isQueued,
} from './store'

/* One survey, opened from a box in the corner. The box appears only once the
 * reviewer has been around the site and stays away once put away; the dialog
 * saves each answer as it is given, so closing it half-done loses nothing.
 *
 * The questions are src/survey/questions.js. It is a house questionnaire with
 * no published benchmark, so nothing in here compares an answer against one,
 * and the launcher no longer says "Tell me what to fix": that prompt was
 * removed on 13 October along with the free-text question it opened. */

/* An answer is a row on a ruled list, not a card: rules separate, and a bar, a
 * fill and a weight mark the chosen one. Kept byte for byte identical to the
 * page version in views/App.jsx so an answer looks the same whichever way it
 * is opened. Point values go to the store but are not printed, the label
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

/* A short written answer. Saves on blur as well as on Save, so leaving the
 * field never loses what was typed (owner, 18 October: four of these in a row,
 * and a forgotten Save would drop an answer). No Skip: every one is optional,
 * and a blank field is already a skip. Exported so the #/survey page uses the
 * same field. `bg` is the field fill on the surface it sits on. */
export function TextAnswer({ q, initial = '', onSave, bg = 'bg-paper' }) {
  const [text, setText] = React.useState(initial)
  const saved = React.useRef(initial)
  const empty = !text.trim()
  const save = () => {
    const t = text.trim()
    if (!t || t === saved.current) return
    saved.current = t
    onSave(t)
  }
  return (
    <div className="mt-3">
      <textarea
        rows={q.important ? 4 : 3}
        value={text}
        maxLength={q.maxLength}
        placeholder={q.placeholder}
        onChange={e => setText(e.target.value)}
        onBlur={save}
        aria-label={q.prompt}
        className={cn(
          'block w-full rounded-field border p-3',
          'font-body text-sec text-ink placeholder:text-ink-3',
          'transition-[border-color,background-color] duration-150 ease-out',
          q.important
            ? 'border-2 border-accent bg-accent-wash/40'
            : cn('border-rule hoverOnly:border-ink-3', bg)
        )}
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Button size="sm" type="button" variant="outline" disabled={empty} onClick={save}>Save</Button>
        <span className="text-fine tabular-nums text-ink-3">
          {text.length}/{q.maxLength}
        </span>
      </div>
    </div>
  )
}

/* Number, prompt, then "Optional" and the hint on one line under it. The
 * important question gets a larger prompt and the hint. Exported so the
 * #/survey page renders the same head. */
export function QuestionHead({ q, size = 'text-ui' }) {
  return (
    <div className="flex items-baseline gap-x-3">
      {/* The numeral comes from ask order, not the prompt. */}
      <span className="shrink-0 text-fine tabular-nums text-ink-3">{questionNumber(q.id)}</span>
      <div className="min-w-0">
        <p className={cn('max-w-[44ch] font-display font-bold text-ink',
          q.important ? 'text-row' : size)}>{q.prompt}</p>
        {(q.hint || q.optional) && (
          <p className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {q.hint && <span className="text-meta font-medium text-accent-ink">{q.hint}</span>}
            {q.optional && <span className="note">Optional</span>}
          </p>
        )}
      </div>
    </div>
  )
}

/* One question, whichever kind it is. Shared by the page cards and the final
 * block so wording and spacing cannot drift between them. */
function Question({ q, answer, onAnswer }) {
  if (q.kind === 'scale') {
    return <ScaleControl q={q} value={answer?.value ?? null} onPick={(v, l) => onAnswer(v, l)} />
  }
  if (q.kind === 'text') {
    return (
      <TextAnswer
        q={q}
        initial={typeof answer?.value === 'string' ? answer.value : ''}
        onSave={v => onAnswer(v, null)}
      />
    )
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
                dialog's business, the box must not claim a send it has not
                checked. */}
            <span className="font-display text-ui font-medium text-ink">
              {finished ? 'All saved, thanks' : started ? 'Finish the feedback' : 'Give feedback'}
            </span>
            {/* No fixed count before starting: the question set can grow. Once
                started, the live tally is read from REQUIRED. */}
            <span className="text-fine font-medium tabular-nums text-ink-3">
              {started ? `${done}/${total}` : 'A few questions'}
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
        aria-label="Reviewer feedback"
        tabIndex={-1}
        ref={ref}
        className="mx-auto min-h-full w-full max-w-[42rem] bg-paper sm:min-h-0 sm:rounded-panel"
      >
        {/* The tally only; that answers save themselves is said below, once. */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-rule bg-paper px-5 py-3.5 sm:rounded-t-panel sm:px-8">
          <div>
            <h2 className="font-display text-sub font-bold text-ink">Reviewer Feedback</h2>
            <p className="mt-0.5 text-fine font-medium tabular-nums text-ink-3">
              {done} of {total} answered
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
        </div>

        <div className="px-5 pb-9 pt-5 sm:px-8">
          {/* Says what is stored, every time the dialog opens, and not only in
              the consent panel: a reviewer who answered on one visit and came
              back on another may never see that panel again. */}
          <p className="max-w-[56ch] text-sec text-ink-2">
            Answers save as you give them, so closing this loses nothing,
            and they go on to the person building MindMap once you are through.
          </p>
          <p className="note mt-2 max-w-[56ch]">
            Anonymous. What is stored is your answers, the age group, role and school level
            you pick from the lists, the date, and a random code for this browser. No name,
            no email, no school and no birth date is asked for anywhere in it.
          </p>

          {SECTIONS.map(section => (
            <section key={section.id} className="mt-8">
              <h3 className="font-display text-row font-bold text-ink">{section.title}</h3>
              {section.note && <p className="mt-1.5 max-w-[52ch] text-meta text-ink-3">{section.note}</p>}
              <div className="mt-5 flex flex-col gap-6">
                {section.items.map(q => {
                  const a = byId.get(q.id)
                  return (
                    <div key={q.id} className="border-t border-rule/60 pt-4">
                      <QuestionHead q={q}/>
                      <Question q={q} answer={a} onAnswer={(v, l) => answer(q, v, l)}/>
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
