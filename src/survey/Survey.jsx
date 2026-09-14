import React from 'react'
import { Button } from '../ui/button'
import { Cross } from '../ui/marks'
import { StarRating } from '../ui/stars'
import { cn } from '../lib/utils'
import { questionsFor } from './questions'
import {
  answersFor, getVersion, getVisitor, recordAnswer,
  subscribe, syncPending, exportRows, toCSV,
} from './store'

/* The survey, asked where the answer is still in the reader's head.
 *
 * The timing is the whole design. A card that appears on load is a pop-up and
 * gets closed as one; a card that appears after the reader has demonstrably
 * been on the page — twelve seconds, or forty per cent of the scroll, whichever
 * comes first — is a question from someone who watched them read. It shows one
 * question at a time because two questions in a 360px card is a form, and a
 * form at the corner of a page does not get filled in.
 *
 * It is fixed, so it cannot shift the layout; it traps nothing, so Tab leaves
 * it; Esc closes it; and on a phone the page gets bottom padding for exactly as
 * long as the sheet is up, so the sheet can never be the thing standing between
 * a reader and a button.
 */

/* Dismissal is per session, not per browser: "not now" means not now, and a
 * reviewer who comes back tomorrow should be asked again. sessionStorage is
 * mirrored into a module Set so the answer survives a reload but never needs
 * storage to work at all. */
const dismissed = new Set()
const SKEY = 'mindmap.survey.dismissed'

function loadDismissed() {
  try {
    const raw = window.sessionStorage.getItem(SKEY)
    if (raw) JSON.parse(raw).forEach(p => dismissed.add(p))
  } catch {}
}
function dismiss(page) {
  dismissed.add(page)
  try { window.sessionStorage.setItem(SKEY, JSON.stringify([...dismissed])) } catch {}
}
if (typeof window !== 'undefined') loadDismissed()

/* Subscribing to the store rather than lifting state: a page survey, the final
 * block and any export button can all be mounted at once, and each has to see
 * an answer the moment another one records it. */
function useSurvey() {
  return React.useSyncExternalStore(subscribe, getVersion, () => 0)
}

/* ---------------------------------------------------------------- controls */

function ScaleControl({ q, value, onPick }) {
  return (
    <div role="radiogroup" aria-label={q.prompt} className="mt-4 flex flex-col gap-1.5">
      {q.points.map(p => {
        const on = value === p.value
        return (
          <button
            key={p.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onPick(p.value, p.label)}
            className={cn(
              'flex min-h-[44px] items-center gap-3 rounded-field border px-3 py-2 text-left',
              'transition-[background-color,border-color,color] duration-150 ease-out',
              on
                ? 'border-ink bg-ink text-paper'
                : 'border-rule bg-paper text-ink-2 hover:border-ink-3 hover:bg-mist active:bg-accent-wash'
            )}
          >
            <span className={cn('font-mono text-fine tabular-nums', on ? 'text-paper/70' : 'text-ink-3')}>
              {p.value}
            </span>
            <span className="font-display text-ui font-medium">{p.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function TextControl({ q, initial = '', onSave, onSkip, saveLabel = 'Save' }) {
  const [text, setText] = React.useState(initial)
  const empty = !text.trim()
  const id = React.useId()
  return (
    <div className="mt-4">
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
          'hover:border-ink-3 focus:bg-card'
        )}
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {/* The disabled Save says why it is disabled, rather than leaving the
            reader to work out what the control wants from them. */}
        <span className="note">{empty ? 'Write a line, then save it.' : 'Ready to save.'}</span>
        <span className="font-mono text-fine tabular-nums text-ink-3">
          {text.length}/{q.maxLength}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
        <Button size="sm" type="button" disabled={empty} onClick={() => onSave(text.trim())}>
          {saveLabel}
        </Button>
        {onSkip && (
          <Button size="sm" type="button" variant="ghost" onClick={onSkip}>Skip this one</Button>
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
          'hover:border-ink-3 focus:bg-card'
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
          <Button size="sm" type="button" variant="ghost" onClick={onSkip}>Skip this one</Button>
        )}
      </div>
      {score == null && <p className="note mt-2">Pick a point on the scale to save this.</p>}
    </div>
  )
}

/* One question, whichever of the four kinds it is. Page cards and the final
 * block share it so a wording or spacing change cannot apply to one and not
 * the other. */
function Question({ q, answer, onAnswer, onSkip }) {
  if (q.kind === 'scale') {
    return <ScaleControl q={q} value={answer?.value ?? null} onPick={(v, l) => onAnswer(v, l)} />
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
  if (q.kind === 'stars') {
    return (
      <div className="mt-4">
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

/* --------------------------------------------------------- floating survey */

const ARM_MS = 12000
const ARM_SCROLL = 0.4

export function PageSurvey({ page }) {
  useSurvey()
  const all = questionsFor(page)

  /* The queue is frozen at mount. If it were recomputed from the store, the
     question the reader is answering would vanish out from under their hand
     the instant it was recorded. */
  const [queue] = React.useState(() => {
    const done = new Set(answersFor(page).map(a => a.qid))
    return all.filter(q => !done.has(q.id))
  })

  const [idx, setIdx] = React.useState(0)
  const [armed, setArmed] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [thanks, setThanks] = React.useState(false)
  const [closed, setClosed] = React.useState(() => dismissed.has(page))
  const cardRef = React.useRef(null)

  const idle = closed || !queue.length || !getVisitor()
  const live = armed && !idle

  React.useEffect(() => {
    if (idle) return
    let fired = false
    function stop() {
      clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
    }
    function arm() {
      if (fired) return
      fired = true
      setArmed(true)
      stop()
    }
    function onScroll() {
      const range = document.documentElement.scrollHeight - window.innerHeight
      if (range > 0 && window.scrollY / range >= ARM_SCROLL) arm()
    }
    const timer = setTimeout(arm, ARM_MS)
    window.addEventListener('scroll', onScroll, { passive: true })
    return stop
  }, [idle, page])

  /* Mounted first at rest, then flipped a frame later, so the card animates in
     from its own start state instead of appearing mid-transition. Under
     reduced motion the global duration override makes this a straight cut. */
  React.useEffect(() => {
    if (!live) return
    const f = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(f)
  }, [live])

  React.useEffect(() => {
    if (!live) return
    const onKey = e => { if (e.key === 'Escape') { dismiss(page); setClosed(true) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [live, page])

  /* On a phone the card is a bottom sheet, and a bottom sheet over a fixed
     footer control is the reason survey widgets get hated. The page grows by
     the sheet's height while it is up — scroll range only, nothing on screen
     moves — so every control can be reached past it. */
  React.useEffect(() => {
    if (!live || typeof window === 'undefined') return
    if (window.matchMedia('(min-width: 640px)').matches) return
    const h = cardRef.current?.offsetHeight || 0
    let prev = ''
    try {
      prev = document.body.style.paddingBottom
      document.body.style.paddingBottom = `${h}px`
    } catch {}
    return () => { try { document.body.style.paddingBottom = prev } catch {} }
  }, [live, idx])

  React.useEffect(() => {
    if (!thanks) return
    const t = setTimeout(() => setClosed(true), 1500)
    return () => clearTimeout(t)
  }, [thanks])

  React.useEffect(() => { if (live) syncPending() }, [live])

  if (idle || !armed) return null

  const q = queue[Math.min(idx, queue.length - 1)]

  const answer = (value, label) => {
    recordAnswer({ page, qid: q.id, kind: q.kind, value, label })
    if (idx + 1 >= queue.length) setThanks(true)
    else setIdx(idx + 1)
  }

  const skip = () => {
    if (idx + 1 >= queue.length) setThanks(true)
    else setIdx(idx + 1)
  }

  return (
    <aside
      ref={cardRef}
      aria-label="Question about this page"
      className={cn(
        'fixed z-40 border border-ink bg-card shadow-lift',
        'inset-x-0 bottom-0 rounded-t-panel',
        'pb-[max(1.25rem,env(safe-area-inset-bottom))]',
        'sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[23.5rem] sm:rounded-panel sm:pb-0',
        'transition-[transform,opacity] duration-300 ease-out',
        open ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-rule px-5 py-3">
        <span className="font-mono text-fine tabular-nums text-ink-3">
          {thanks ? 'Done' : `${idx + 1} of ${queue.length}`}
        </span>
        <button
          type="button"
          onClick={() => { dismiss(page); setClosed(true) }}
          className={cn(
            'flex min-h-[44px] items-center gap-2 rounded-field px-2 font-display text-ui font-medium text-ink-2',
            'transition-colors duration-150 ease-out hover:bg-mist hover:text-ink active:bg-accent-wash'
          )}
        >
          Not now <Cross size={16} />
        </button>
      </div>

      <div className="px-5 pb-5 pt-4">
        {thanks ? (
          <p className="font-display text-ui font-medium text-ink">
            Thank you — that is this page done.
          </p>
        ) : (
          <>
            <p className="font-display text-ui font-medium text-ink">{q.prompt}</p>
            <Question q={q} answer={null} onAnswer={answer} onSkip={skip} />
          </>
        )}
      </div>
    </aside>
  )
}

/* ------------------------------------------------------------ final survey */

function csvName() {
  const n = getVisitor()?.name || 'anon'
  return 'mindmap-review-' + n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.csv'
}

/* The reviewer can take their own answers away. It is the same consent
 * argument the rest of the site makes: if the data is about you, you get a
 * copy of it, and if there is no backend that day the file is still the
 * record. */
function downloadCSV() {
  try {
    const blob = new Blob([toCSV(exportRows())], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = csvName()
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  } catch {}
}

export function FinalSurvey({ className }) {
  useSurvey()
  const questions = questionsFor('final')
  const answers = answersFor('final')
  const byId = new Map(answers.map(a => [a.qid, a]))
  const [skipped, setSkipped] = React.useState(() => new Set())

  React.useEffect(() => { syncPending() }, [])

  const answer = (q, value, label) =>
    recordAnswer({ page: 'final', qid: q.id, kind: q.kind, value, label })

  const required = questions.filter(q => !q.optional)
  const left = required.filter(q => !byId.has(q.id)).length
  const visitor = getVisitor()

  return (
    <section
      aria-label="Final questions"
      className={cn('rounded-panel border border-rule bg-card p-6 sm:p-8', className)}
    >
      <h2 className="font-display text-sub font-medium text-ink">Last few questions</h2>
      <p className="mt-2 max-w-measure text-sec text-ink-2">
        {visitor
          ? `These are the last ones, ${visitor.name}. Answers are saved as you go.`
          : 'These are the last ones. Answers are saved as you go.'}
      </p>

      <div className="mt-8 flex flex-col gap-8">
        {questions.map(q => {
          const a = byId.get(q.id)
          const isSkipped = skipped.has(q.id)
          return (
            <div key={q.id} className="border-t border-rule pt-6">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="max-w-read font-display text-ui font-medium text-ink">{q.prompt}</p>
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
                <p className="mt-3 font-mono text-fine text-calm">
                  Saved{a.label ? ` — ${a.label}` : ''}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule pt-6">
        <p className="note">
          {left === 0
            ? 'That is everything. Thank you for walking the whole thing.'
            : `${left} question${left === 1 ? '' : 's'} left.`}
        </p>
        <Button size="sm" type="button" variant="ghost" onClick={downloadCSV}>
          Download my answers
        </Button>
      </div>
    </section>
  )
}

export default PageSurvey
