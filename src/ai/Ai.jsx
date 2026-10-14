import React from 'react'
import { cn } from '../lib/utils'
import { NOTES, PRO_LC, SCORE } from '../lib/terms'
import { ArrowRight, ChevronDown } from '../ui/marks'
import { GetHelp } from '../app/Help'
import { AUDIENCES, PILLARS, SOURCES, pillarSources } from './framework'

/* MindMap AI.
 *
 * A real language model behind api/mindmap-ai.js, with the owner's key in the
 * Vercel environment. Three things this screen is built around:
 *
 * 1. It asks the server whether a key exists before it draws anything a reader
 *    could type into. With no key the composer is never rendered: the screen
 *    says it is not connected and stops. It cannot appear to answer, because
 *    there is no field and no reply element to fill.
 * 2. Every reply carries the name of the model that produced it, read off the
 *    server response rather than written here. Nothing on this screen is
 *    labelled as an answer unless a model returned it.
 * 3. It says what leaves the phone, in the interface and not in a policy page.
 *    This is a real change from Notes, which never left the device: a message
 *    here goes to MindMap's server and on to the model. The panel above the
 *    composer is that sentence, and it is not collapsible.
 *
 * Nothing typed here reaches storage. There is no localStorage, no store.js
 * and no endpoint other than the one model call, and the server writes no
 * copy. Leaving the screen ends the conversation.
 *
 * 14 OCTOBER, design spec 0f: no paragraph, no sentence over ten words, and
 * the screen fills a laptop. At 1280 the conversation sits left and the
 * data-sent card, the help lines and the framework sit right; at 390 it is
 * one column.
 */

const ENDPOINT = '/api/mindmap-ai'
const MAX_CHARS = 1200

/* ── Marks ──────────────────────────────────────────────────────────────── */

const SendMark = p => <ArrowRight {...p}/>

/* ── Small pieces ───────────────────────────────────────────────────────── */

function Heading({ children }) {
  return <h3 className="font-display font-bold text-ink">{children}</h3>
}

/* The disclosure the rest of the app uses: a full width control with a word
   and a chevron, no capsule and no icon disc. */
function Disclosure({ label, children, className }) {
  const [open, setOpen] = React.useState(false)
  const id = React.useId()
  return (
    <section className={cn('overflow-hidden rounded-panel border border-rule bg-card', className)}>
      <button type="button" onClick={() => setOpen(v => !v)}
        aria-expanded={open} aria-controls={id}
        className="flex min-h-[48px] w-full items-center gap-3 px-4 py-3 text-left
          font-display text-ui font-semibold text-ink transition-colors duration-150
          ease hoverOnly:bg-mist">
        <span className="min-w-0 flex-1">{label}</span>
        <ChevronDown aria-hidden size={18}
          className={cn('shrink-0 text-ink-2 transition-transform duration-200 ease',
            open && 'rotate-180')}/>
      </button>
      {open && <div id={id} className="border-t border-rule px-4 py-3.5">{children}</div>}
    </section>
  )
}

/* ── What leaves the phone ──────────────────────────────────────────────── */

const LEAVES = [
  ['Sent', 'Your words, to MindMap’s server and on to the model.'],
  ['Not sent', `No name, reading, ${SCORE}, ${NOTES.toLowerCase()} or location.`],
  ['Kept', 'Nothing. Leaving this screen ends the conversation.'],
  ['Shown to', `Nobody else. Not a parent, not a ${PRO_LC}.`],
]

function Leaves() {
  return (
    <section className="overflow-hidden rounded-panel border border-rule bg-aqua">
      <div className="border-b border-rule px-4 py-3">
        <Heading>Data Sent</Heading>
      </div>
      <dl className="m-0 grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 px-4 py-3 text-fine
        sm:grid-cols-[6.5rem_minmax(0,1fr)]">
        {LEAVES.map(([k, v]) => (
          <React.Fragment key={k}>
            <dt className="font-display font-semibold text-ink-2">{k}</dt>
            <dd className="m-0 mb-1.5 max-w-[56ch] text-ink-2 last:mb-0">{v}</dd>
          </React.Fragment>
        ))}
      </dl>
    </section>
  )
}

/* ── The framework, printed where the reader is ─────────────────────────── */

function Framework() {
  return (
    <div>
      <p className="max-w-[62ch] text-fine text-ink-2">
        One framework, three adaptations: student, parent, {PRO_LC}. The guidance each rule
        rests on is named beside it.
      </p>
      <ul className="mt-3 m-0 list-none p-0">
        {PILLARS.map(p => {
          const src = pillarSources(p)
          return (
            <li key={p.id} className="border-t border-rule py-2.5 first:border-t-0 first:pt-0">
              <h4 className="font-display font-semibold text-ink">{p.title}</h4>
              <p className="mt-0.5 max-w-[62ch] text-fine text-ink-2">{p.rule}</p>
              <p className="mt-0.5 max-w-[62ch] text-fine text-ink-3">
                {src.length
                  ? src.map(s => s.body).filter((b, i, a) => a.indexOf(b) === i).join(', ')
                  : 'A MindMap rule, not published guidance.'}
              </p>
            </li>
          )
        })}
      </ul>
      <h4 className="mt-4 font-display font-semibold text-ink">Published Guidance Cited</h4>
      <ul className="mt-1.5 m-0 list-none p-0">
        {SOURCES.map(s => (
          <li key={s.id} className="py-1.5">
            <a href={s.url} target="_blank" rel="noreferrer"
              className="font-display text-fine font-medium text-accent underline
                decoration-accent/40 underline-offset-2 transition-colors duration-150
                ease hoverOnly:text-accent-ink">
              {s.body}, {s.title}
            </a>
            <span className="ml-1.5 text-fine text-ink-3">{s.detail}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 max-w-[62ch] text-fine text-ink-3">
        The FDA publishes no such framework. None is cited.
      </p>
    </div>
  )
}

/* ── Transcript ─────────────────────────────────────────────────────────── */

function Turn({ turn }) {
  const mine = turn.role === 'user'
  return (
    <li className={cn('max-w-[48ch]', mine && 'ml-auto')}>
      <p className={cn('text-fine text-ink-3', mine && 'text-right')}>
        {mine ? 'You' : 'MindMap AI'}
        {!mine && turn.model && <span className="text-ink-3">{' · ' + turn.model}</span>}
      </p>
      <div className={cn('mt-1 rounded-panel border px-3.5 py-2.5',
        mine ? 'border-rule bg-accent-wash' : 'border-rule bg-card')}>
        <p className="max-w-none whitespace-pre-line text-ui leading-[1.55] text-ink">
          {turn.content}
        </p>
      </div>
    </li>
  )
}

/* ── The screen ─────────────────────────────────────────────────────────── */

/**
 * MindMap AI, for one of the three audiences.
 *
 * Props
 *   who        'student' | 'parent' | 'pro'   Which adaptation answers. Default 'student'.
 *   go         function                       Optional. The router, used only by the
 *                                             "How it works" button when present.
 *   className  string                         Optional.
 *
 * Mount at: route `ai` in src/views/App.jsx, in place of <AiPending/>:
 *   ai: p => <MindMapAI {...p} who={audience}/>,
 */
export function MindMapAI({ who = 'student', go, className }) {
  const audience = AUDIENCES[who] ? who : 'student'
  const spec = AUDIENCES[audience]

  /* 'checking' | 'ready' | 'unconfigured' | 'unreachable' */
  const [state, setState] = React.useState('checking')
  const [model, setModel] = React.useState(null)
  const [turns, setTurns] = React.useState([])
  const [draft, setDraft] = React.useState('')
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState('')
  const foot = React.useRef(null)
  const live = React.useRef(true)

  React.useEffect(() => () => { live.current = false }, [])

  /* One probe, before anything a reader could type into exists. A dev server
     with no serverless runtime answers this with HTML, which is not a key and
     is reported as unreachable rather than as connected. */
  React.useEffect(() => {
    let dead = false
    ;(async () => {
      try {
        const r = await fetch(ENDPOINT, { headers: { accept: 'application/json' } })
        const type = r.headers.get('content-type') || ''
        if (!type.includes('application/json')) throw new Error('not json')
        const body = await r.json()
        if (dead) return
        if (body?.configured) { setModel(body.model || null); setState('ready') }
        else setState('unconfigured')
      } catch {
        if (!dead) setState('unreachable')
      }
    })()
    return () => { dead = true }
  }, [])

  /* The conversation is per audience: switching adaptation mid thread would
     answer a parent under a student's rules. */
  React.useEffect(() => { setTurns([]); setDraft(''); setError('') }, [audience])

  React.useEffect(() => {
    if (turns.length || pending) foot.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [turns.length, pending])

  const send = React.useCallback(async text => {
    const body = text.trim().slice(0, MAX_CHARS)
    if (!body || pending) return
    const next = [...turns, { role: 'user', content: body }]
    setTurns(next)
    setDraft('')
    setError('')
    setPending(true)
    try {
      const r = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          audience,
          messages: next.map(t => ({ role: t.role, content: t.content })),
        }),
      })
      const type = r.headers.get('content-type') || ''
      const payload = type.includes('application/json') ? await r.json() : null
      if (!live.current) return
      if (payload?.configured === false) {
        setState('unconfigured')
        setTurns([])
        return
      }
      if (!r.ok || !payload?.ok || !payload.reply) {
        setError(payload?.error || 'The reply did not arrive. Nothing was answered.')
        return
      }
      setModel(payload.model || model)
      setTurns(t => [...t, { role: 'assistant', content: payload.reply, model: payload.model || model }])
    } catch {
      if (live.current) setError('The server could not be reached. Nothing was sent on.')
    } finally {
      if (live.current) setPending(false)
    }
  }, [audience, model, pending, turns])

  const fine = typeof window !== 'undefined'
    && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches

  const helpLines = (
    <section className="rounded-panel border border-rule bg-aqua p-4">
      <Heading>A Person Instead</Heading>
      <p className="mt-1 max-w-[52ch] text-fine text-ink-2">
        Help lines need no reading and no account.
      </p>
      <GetHelp className="mt-2.5"/>
    </section>
  )

  return (
    <div className={cn('wrap', className)}>
      <h2 className="font-display font-bold text-ink">{spec.heading}</h2>

      {state === 'checking' && (
        <p aria-live="polite" className="mt-2 max-w-[56ch] text-meta text-ink-2">
          Checking the connection.
        </p>
      )}

      {(state === 'unconfigured' || state === 'unreachable') && (
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-4">
          <section className="rounded-panel border border-ink-3 bg-card p-4">
            <Heading>Not Connected Yet</Heading>
            <p className="mt-1.5 max-w-[58ch] text-meta text-ink-2">
              {state === 'unconfigured'
                ? 'No model key is set, so nothing here answers.'
                : 'The server did not answer, so nothing here answers.'}
            </p>
            <p className="mt-2 max-w-[58ch] text-fine text-ink-3">
              No field is offered until the key is in place.
            </p>
            {typeof go === 'function' && (
              <button type="button" onClick={() => go('methods')}
                className="mt-3.5 inline-flex min-h-[44px] items-center gap-2 rounded-field
                  border border-ink px-4 font-display text-ui font-medium text-ink
                  transition-colors duration-150 ease hoverOnly:bg-mist">
                How it works
                <ArrowRight aria-hidden size={16}/>
              </button>
            )}
          </section>
          <div className="flex flex-col gap-3 lg:gap-4">
            {helpLines}
            <Disclosure label="Framework And Sources"><Framework/></Disclosure>
          </div>
        </div>
      )}

      {state === 'ready' && (
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-4">
          <div className="min-w-0">
            {turns.length === 0 ? (
              <section className="rounded-panel border border-rule bg-card p-4">
                <Heading>Somewhere To Start</Heading>
                <ul className="mt-2 m-0 flex list-none flex-col gap-2 p-0">
                  {spec.starters.map(s => (
                    <li key={s}>
                      <button type="button" onClick={() => send(s)}
                        className="w-full rounded-field border border-rule bg-paper px-3.5 py-3
                          text-left font-body text-ui text-ink transition-colors duration-150
                          ease hoverOnly:bg-mist">
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <ul role="log" aria-live="polite" aria-label="Conversation"
                className="m-0 flex list-none flex-col gap-3 p-0">
                {turns.map((t, i) => <Turn key={i} turn={t}/>)}
              </ul>
            )}

            {pending && (
              <p aria-live="polite" className="mt-3 text-fine text-ink-2">
                Waiting for the model.
              </p>
            )}

            {error && (
              <div role="alert" className="mt-3 rounded-panel border border-ink-3 bg-card p-3.5">
                <p className="max-w-[56ch] text-fine text-ink">{error}</p>
              </div>
            )}

            <form className="mt-3" onSubmit={e => { e.preventDefault(); send(draft) }}>
              <label className="block">
                <span className="sr-only">Your message</span>
                {/* text-ui is 16px: the floor that stops iOS Safari zooming the
                    page when a field takes focus. Do not shrink it. */}
                <textarea rows={3} value={draft} maxLength={MAX_CHARS}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey && fine) {
                      e.preventDefault(); send(draft)
                    }
                  }}
                  placeholder={spec.opener}
                  className="block w-full resize-y rounded-field border border-rule bg-card
                    p-3 font-body text-ui leading-[1.55] text-ink placeholder:text-ink-3
                    transition-colors duration-150 ease hoverOnly:border-ink-3"/>
              </label>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                <button type="submit" disabled={!draft.trim() || pending}
                  className={cn('inline-flex min-h-[48px] items-center gap-2 rounded-field border',
                    'px-4 font-display text-ui font-medium transition-colors duration-150 ease',
                    !draft.trim() || pending
                      ? 'cursor-not-allowed border-rule bg-mist text-ink-3'
                      : 'border-accent-ink bg-accent text-paper hoverOnly:bg-accent-ink')}>
                  {pending ? 'Sending' : 'Send'}
                  <SendMark aria-hidden size={16}/>
                </button>
                {turns.length > 0 && (
                  <button type="button" onClick={() => { setTurns([]); setError('') }}
                    className="inline-flex min-h-[44px] items-center rounded-field px-3
                      font-display text-ui font-medium text-ink-2 transition-colors
                      duration-150 ease hoverOnly:text-ink">
                    Clear
                  </button>
                )}
                <span className="ml-auto text-fine tabular-nums text-ink-3">
                  {draft.length}/{MAX_CHARS}
                </span>
              </div>
              <p className="mt-2 max-w-[62ch] text-fine text-ink-3">
                A language model, not a clinician. It never diagnoses.
              </p>
            </form>
          </div>

          <div className="flex flex-col gap-3 lg:gap-4">
            <Leaves/>
            {helpLines}
            <Disclosure label="Framework And Sources"><Framework/></Disclosure>
          </div>
        </div>
      )}
      <div ref={foot}/>
    </div>
  )
}
