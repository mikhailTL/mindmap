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

// Matches the page version in views/App.jsx so an answer looks the same in both places.
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

// Saves on blur as well as on Save, so leaving the field keeps the text.
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

export function QuestionHead({ q, size = 'text-ui' }) {
  return (
    <div className="flex items-baseline gap-x-3">
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

// Subscribes to the store so the corner box and the open dialog see each answer immediately.
function useSurvey() {
  return React.useSyncExternalStore(subscribe, getVersion, () => 0)
}

const OFF_KEY = 'mindmap.review.off'
const SEEN_KEY = 'mindmap.review.seen'

const putAway = () => { try { sessionStorage.setItem(OFF_KEY, '1') } catch {} }
const isPutAway = () => { try { return sessionStorage.getItem(OFF_KEY) === '1' } catch { return false } }

// The launcher appears after 3 distinct routes in this session.
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
            <span className="font-display text-ui font-medium text-ink">
              {finished ? 'All saved, thanks' : started ? 'Finish the feedback' : 'Give feedback'}
            </span>
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

  // Send state is derived from the store, since a queued response retries in the background.
  const [busy, setBusy] = React.useState(false)
  const send = busy ? 'sending' : wasSent() ? 'sent' : isQueued() ? 'queued' : 'idle'

  // Sends once every required question is answered; submitResponse refuses a second send after sentAt is set.
  React.useEffect(() => {
    if (!complete) return
    let alive = true
    setBusy(true)
    submitResponse().finally(() => { if (alive) setBusy(false) })
    return () => { alive = false }
  }, [complete])

  // Manual send for a partial response; force bypasses the once-only guard.
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
