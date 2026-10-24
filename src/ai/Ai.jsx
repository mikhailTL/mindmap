// MindMap AI chat. Messages go only to /api/mindmap-ai and are not stored; the composer renders only after the server confirms a key.
import React from 'react'
import { cn } from '../lib/utils'
import { NOTES, PRO_LC, SCORE } from '../lib/terms'
import { ArrowRight, ChevronDown } from '../ui/marks'
import { GetHelp } from '../app/Help'
import { useTypingRecorder, TypingLine } from '../toolkit/typing-line'
import { usualTypingGap } from '../app/store'
import { AUDIENCES, PILLARS, SOURCES, pillarSources } from './framework'
import { Glass, TechRoot, TechTitle } from '../ui/tech'

// Both text colours are above 7:1 on every fill used here.
const HI = 'text-[#0d2b1e]', DIM = 'text-[#2a5744]'

const ENDPOINT = '/api/mindmap-ai'
const MAX_CHARS = 1200

const SendMark = p => <ArrowRight {...p}/>

function Heading({ children }) {
  return <h3 className={cn('font-display text-ui font-bold', HI)}>{children}</h3>
}

function Disclosure({ label, children, className }) {
  const [open, setOpen] = React.useState(false)
  const id = React.useId()
  return (
    <Glass as="section" tone="quiet" className={cn('overflow-hidden', className)}>
      <button type="button" onClick={() => setOpen(v => !v)}
        aria-expanded={open} aria-controls={id}
        className={cn('flex min-h-[48px] w-full items-center gap-3 rounded-panel px-4 py-3 text-left',
          'font-display text-ui font-semibold transition-colors duration-150 ease hoverOnly:bg-[#3ecf9a]/[0.08]', HI)}>
        <span className="min-w-0 flex-1">{label}</span>
        <ChevronDown aria-hidden size={18}
          className={cn('shrink-0 transition-transform duration-200 ease', DIM, open && 'rotate-180')}/>
      </button>
      {open && <div id={id} className="border-t border-rule px-4 py-3.5">{children}</div>}
    </Glass>
  )
}

const LEAVES = [
  ['Sent', 'Your words, to MindMap’s server and on to the model.'],
  ['Not sent', `No name, reading, ${SCORE}, ${NOTES.toLowerCase()} or location.`],
  ['Kept', 'Not by MindMap. The model provider may keep messages, so leave out names and private details.'],
  ['Shown to', `Nobody else. Not a parent, not a ${PRO_LC}.`],
]

function Leaves() {
  return (
    <Glass as="details" className="group overflow-hidden">
      <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-3 px-4 py-3
        [&::-webkit-details-marker]:hidden">
        <Heading>What data is sent</Heading>
        <ChevronDown aria-hidden className="size-4 shrink-0 text-ink-2 transition-transform duration-150
          group-open:rotate-180"/>
      </summary>
      <dl className="m-0 grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 border-t border-rule px-4 py-3 text-fine
        sm:grid-cols-[6.5rem_minmax(0,1fr)]">
        {LEAVES.map(([k, v]) => (
          <React.Fragment key={k}>
            <dt className="t-mono text-[0.8125rem] font-semibold leading-[1.75] text-[#0f5836]">{k}</dt>
            <dd className={cn('m-0 mb-1.5 max-w-[56ch] last:mb-0', HI)}>{v}</dd>
          </React.Fragment>
        ))}
      </dl>
    </Glass>
  )
}

function Framework() {
  return (
    <div>
      <p className={cn('max-w-[62ch] text-fine', DIM)}>
        One framework, three adaptations: teen, parent, {PRO_LC}. The guidance each rule
        rests on is named beside it.
      </p>
      <ul className="mt-3 m-0 list-none p-0">
        {PILLARS.map(p => {
          const src = pillarSources(p)
          return (
            <li key={p.id} className="border-t border-rule py-2.5 first:border-t-0 first:pt-0">
              <h4 className={cn('font-display font-semibold', HI)}>{p.title}</h4>
              <p className={cn('mt-0.5 max-w-[62ch] text-fine', HI)}>{p.rule}</p>
              <p className="t-mono mt-1 max-w-[62ch] text-[0.8125rem] text-[#0f5836]">
                {src.length
                  ? src.map(s => s.body).filter((b, i, a) => a.indexOf(b) === i).join(', ')
                  : 'A MindMap rule, not published guidance.'}
              </p>
            </li>
          )
        })}
      </ul>
      <h4 className={cn('mt-4 font-display font-semibold', HI)}>Published guidance cited</h4>
      <ul className="mt-1.5 m-0 list-none p-0">
        {SOURCES.map(s => (
          <li key={s.id} className="py-1.5">
            <a href={s.url} target="_blank" rel="noreferrer"
              className="font-display text-fine font-medium text-[#157446] underline
                decoration-[#157446]/50 underline-offset-2 transition-colors duration-150
                ease hoverOnly:text-[#0f5836]">
              {s.body}, {s.title}
            </a>
            <span className={cn('ml-1.5 text-fine', DIM)}>{s.detail}</span>
          </li>
        ))}
      </ul>
      <p className={cn('mt-3 max-w-[62ch] text-fine', DIM)}>
        The FDA publishes no such framework. None is cited.
      </p>
    </div>
  )
}

function Turn({ turn }) {
  const mine = turn.role === 'user'
  return (
    <li className={cn('max-w-[48ch]', mine && 'ml-auto')}>
      <p className={cn('t-mono text-[0.8125rem]', DIM, mine && 'text-right')}>
        {mine ? 'You' : 'MindMap AI'}
        {!mine && turn.model && <span>{' · ' + turn.model}</span>}
      </p>
      {mine ? (
        <div className="mt-1 rounded-[14px] rounded-br-[4px] border border-[#2294e6]/35 bg-[#def0fc] px-3.5 py-2.5">
          <p className={cn('max-w-none whitespace-pre-line text-ui leading-[1.55]', HI)}>{turn.content}</p>
        </div>
      ) : (
        <Glass tone="vio" className="mt-1 rounded-bl-[4px] px-3.5 py-2.5">
          <p className={cn('max-w-none whitespace-pre-line text-ui leading-[1.55]', HI)}>{turn.content}</p>
        </Glass>
      )}
    </li>
  )
}

export function MindMapAI({ who = 'student', go, className }) {
  const audience = AUDIENCES[who] ? who : 'student'
  const spec = AUDIENCES[audience]

  /* 'checking' | 'ready' | 'unconfigured' | 'unreachable' */
  const [state, setState] = React.useState('checking')
  const [model, setModel] = React.useState(null)
  const [turns, setTurns] = React.useState([])
  const [draft, setDraft] = React.useState('')
  // Records key timing only, not key values (src/signals/typing.js).
  const typing = useTypingRecorder()
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState('')
  const foot = React.useRef(null)
  const live = React.useRef(true)

  React.useEffect(() => () => { live.current = false }, [])

  // Probes the endpoint before any input exists; a dev server without the API answers with HTML, treated as unreachable.
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

  // Each audience has its own rules, so the conversation resets when it changes.
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
    typing.finish()
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

  // Enter sends only on fine-pointer devices; on touch it inserts a newline.
  const fine = typeof window !== 'undefined'
    && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches

  const helpLines = (
    <Glass as="section" tone="coral" className="p-4">
      <Heading>A person instead</Heading>
      <p className={cn('mt-1 max-w-[52ch] text-fine', HI)}>
        Help lines need no reading and no account.
      </p>
      <GetHelp className="mt-3"/>
    </Glass>
  )

  return (
    <div className={cn('wrap', className)}>
     <TechRoot className="t-band t-band--sky relative rounded-[20px] border border-rule p-4 shadow-[0_24px_48px_-34px_rgba(13,43,30,.4)] sm:p-6 lg:p-7">
      <header className="relative isolate -mx-4 -mt-4 overflow-hidden rounded-t-[20px] border-b border-rule
        px-4 pb-4 pt-5 sm:-mx-6 sm:-mt-6 sm:px-6 lg:-mx-7 lg:-mt-7 lg:px-7 lg:pt-6">
        <span aria-hidden className="t-field-shape -right-24 -top-36 size-72 sm:-right-10"/>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <TechTitle className="text-head">{spec.heading}</TechTitle>
        </div>
      </header>

      {state === 'checking' && (
        <p aria-live="polite" className={cn('mt-4 flex max-w-[56ch] items-center gap-2.5 text-meta', DIM)}>
          <span aria-hidden className="t-typing t-anim"><i/><i/><i/></span>
          Checking the connection.
        </p>
      )}

      {(state === 'unconfigured' || state === 'unreachable') && (
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-4">
          <Glass as="section" tone="quiet" className="p-4">
            <Heading>Unavailable</Heading>
            <p className={cn('mt-1.5 max-w-[58ch] text-meta', HI)}>
              MindMap AI is unavailable right now. Try again shortly.
            </p>
            {typeof go === 'function' && (
              <button type="button" onClick={() => go('methods')}
                className={cn('mt-3.5 inline-flex min-h-[44px] items-center gap-2 rounded-field',
                  'border border-[#157446]/60 bg-white px-4 font-display text-ui font-medium',
                  'transition-colors duration-150 ease hoverOnly:bg-[#3ecf9a]/[0.08]', HI)}>
                How it works
                <ArrowRight aria-hidden size={16}/>
              </button>
            )}
          </Glass>
          <div className="flex flex-col gap-3 lg:gap-4">
            {helpLines}
            <Disclosure label="Framework and sources"><Framework/></Disclosure>
          </div>
        </div>
      )}

      {state === 'ready' && (
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-4">
          <div className="min-w-0">
            {turns.length === 0 ? (
              <Glass as="section" sheen className="p-4">
                <Heading>Somewhere to start</Heading>
                <ul className="mt-2.5 m-0 flex list-none flex-col gap-2 p-0">
                  {spec.starters.map(s => (
                    <li key={s}>
                      <button type="button" onClick={() => send(s)}
                        className={cn('group flex w-full items-center gap-3 rounded-[12px] border border-rule',
                          'bg-white px-3.5 py-3 text-left font-body text-ui',
                          'transition-[background-color,border-color,box-shadow] duration-150 ease',
                          'hoverOnly:border-[#2294e6]/60 hoverOnly:bg-[#f3f9fd]', HI)}>
                        <span className="min-w-0 flex-1">{s}</span>
                        <ArrowRight aria-hidden size={16} className="shrink-0 text-[#157446] transition-transform
                          duration-150 ease-[var(--ease-out)] groupHoverOnly:translate-x-0.5"/>
                      </button>
                    </li>
                  ))}
                </ul>
              </Glass>
            ) : (
              <ul role="log" aria-live="polite" aria-label="Conversation"
                className="m-0 flex list-none flex-col gap-3 p-0">
                {turns.map((t, i) => <Turn key={i} turn={t}/>)}
              </ul>
            )}

            {pending && (
              <p aria-live="polite" className={cn('mt-3 flex items-center gap-2.5 text-fine', DIM)}>
                <span aria-hidden className="t-typing t-anim"><i/><i/><i/></span>
                Waiting for the model.
              </p>
            )}

            {error && (
              <Glass role="alert" tone="coral" className="mt-3 p-3.5">
                <p className={cn('max-w-[56ch] text-fine', HI)}>{error}</p>
              </Glass>
            )}

            <form className="mt-4" onSubmit={e => { e.preventDefault(); send(draft) }}>
              <label className="t-field block">
                <span className="sr-only">Your message</span>
                {/* text-ui is 16px, the minimum that stops iOS Safari zooming the page on focus. */}
                <textarea rows={3} value={draft} maxLength={MAX_CHARS}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => {
                    typing.onKeyDown(e)
                    if (e.key === 'Enter' && !e.shiftKey && fine) {
                      e.preventDefault(); send(draft)
                    }
                  }}
                  placeholder={spec.opener}
                  className="block w-full resize-y rounded-[12px] border-0 bg-white
                    p-3 font-body text-ui leading-[1.55] text-[#0d2b1e] placeholder:text-[#426a58]
                    caret-[#157446]"/>
              </label>
              <div className="mt-2 rounded-field bg-paper px-3 py-2 empty:hidden">
                <TypingLine rhythm={typing.rhythm} usual={usualTypingGap()} className="mt-0"/>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                <button type="submit" disabled={!draft.trim() || pending}
                  className={cn('inline-flex min-h-[48px] items-center gap-2 rounded-field border',
                    'px-5 font-display text-ui font-bold transition-[background-color,color,transform] duration-150',
                    'ease-[var(--ease-out)] motion-safe:active:scale-[0.97]',
                    !draft.trim() || pending
                      ? 'cursor-not-allowed border-rule bg-white text-[#2a5744]'
                      : 'border-accent bg-accent text-white hoverOnly:bg-accent-ink')}>
                  {pending ? 'Sending' : 'Send'}
                  <SendMark aria-hidden size={16}/>
                </button>
                {turns.length > 0 && (
                  <button type="button" onClick={() => { setTurns([]); setError('') }}
                    className="inline-flex min-h-[44px] items-center rounded-field px-3
                      font-display text-ui font-medium text-[#2a5744] transition-colors
                      duration-150 ease hoverOnly:text-[#0d2b1e]">
                    Clear
                  </button>
                )}
                <span className={cn('t-mono ml-auto text-[0.8125rem] tabular-nums', DIM)}>
                  {draft.length}/{MAX_CHARS}
                </span>
              </div>
              <p className={cn('mt-2 max-w-[62ch] text-fine', DIM)}>
                A language model, not a clinician. It never diagnoses.
              </p>
            </form>
          </div>

          <div className="flex flex-col gap-3 lg:gap-4">
            <Leaves/>
            {helpLines}
            <Disclosure label="Framework and sources"><Framework/></Disclosure>
          </div>
        </div>
      )}
     </TechRoot>
      <div ref={foot}/>
    </div>
  )
}
