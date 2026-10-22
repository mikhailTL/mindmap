import React from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Frame } from '../ui/frame'
import { Section, SectionHead } from '../ui/section'
import { ArrowRight, Check, Always, Cross, Minus, ChevronDown } from '../ui/marks'
import { ScrollIn, ScrollRow } from '../ui/motion'
import { WirelessLink, StepArt } from '../charts/pairing-art'
import { connectPatch } from '../lib/engine'
import { SCORE } from '../lib/terms'
import { cn } from '../lib/utils'

// Pairing console: Connect runs connectPatch from lib/engine.js, and the step list follows that flow.
const STEPS = [
  { k:'wake',    title:'Take the patch off charge',
    line:'It starts sending a Bluetooth signal.' },
  { k:'open',    title:'Open the app in a browser',
    line:'Nothing to install. The browser must support Bluetooth.' },
  { k:'tap',     title:'Press Connect to the patch',
    line:'The browser looks for it.' },
  { k:'chooser', title:'The browser shows a list',
    line:'Only the patch is listed.' },
  { k:'pick',    title:'Choose the patch and tap Pair',
    line:'The app sees nothing until you choose.' },
  { k:'stream',  title:'The patch starts sending readings',
    line:'Four signals, once a second.' },
]

/* What pairing does not need, listed as absences. */
const NOTHING = ['A cable', 'A driver', 'A download', 'A developer tool']

const LINK_FACTS = [
  { k:'Link',    v:'Bluetooth Low Energy' },
  { k:'Signals', v:'4, once a second' },
]

// `seen` is the engine's own message, verbatim; `fix` is what to do about it.
const TROUBLE = [
  { /* engine.js:54, the navigator.bluetooth guard: an embedded page and plain http both get this message */
    title:'The browser has no Bluetooth', hue:'sky',
    seen:'This browser cannot open a Bluetooth connection from inside an embedded page. Open the '
      + 'site directly in Chrome on a computer, or take the Survey in the app instead.',
    fix:'Open the site directly in Chrome, over https.' },
  { /* engine.js:45 and 50: the service filter on requestDevice */
    title:'The list is empty', hue:'lilac',
    seen:'The browser’s list shows no devices.',
    fix:'Take the patch off charge, near the phone. Press Connect again.' },
  { /* engine.js:61 and 62: NotFoundError is the device list being closed, not a fault */
    title:'You closed the list', hue:'sun',
    seen:'No patch was selected. The Survey in the app works without one.',
    fix:'Press Connect again and choose the patch.' },
  { /* engine.js:63: anything requestDevice or gatt.connect throws */
    title:'The connection failed', hue:'coral',
    seen:'Could not connect: unknown. The Survey in the app works without a patch.',
    fix:`Try again, or take a ${SCORE} instead.` },
]
const QUOTE = { sky:'border-sky-ink/40', lilac:'border-lilac-ink/40', sun:'border-sun-ink/40',
  coral:'border-coral-ink/40' }

const PHASE_WORD = { idle:'Not started', asking:'Asking the browser', live:'Connected', stuck:'Stopped' }

// done, now or stuck for a step the flow has reached; todo for steps past it.
function statusOf(i, cursor, phase) {
  if (i >= cursor) return 'todo'
  if (i < cursor - 1) return 'done'
  if (phase === 'live') return 'done'
  if (phase === 'stuck') return 'stuck'
  return 'now'
}

const MARK = { done: Check, now: Always, stuck: Minus }
const LABEL = { done:'Done', now:'Now', stuck:'Stopped here', todo:'' }

const PHOTO_ALT = 'A licensed stock photograph of two teenagers sitting on steps outside, reading a notebook together.'

export function Pairing({ as: Root = 'main' }) {
  const [phase, setPhase] = React.useState('idle')
  const [cursor, setCursor] = React.useState(0)      // steps the flow reached
  const [msg, setMsg] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [focus, setFocus] = React.useState(null)
  const [steps, setSteps] = React.useState(false)

  // Runs the same guard as engine.js only to place the cursor; the message shown is the engine's own.
  const connect = React.useCallback(async () => {
    if (busy) return
    setBusy(true); setMsg(''); setFocus(null)
    const bt = typeof navigator !== 'undefined' && !!navigator.bluetooth
    const at = bt ? 4 : 3
    setPhase('asking'); setCursor(at)
    const r = await connectPatch()
    setMsg(r.msg)
    if (r.ok) { setCursor(STEPS.length); setPhase('live') }
    else { setCursor(bt ? 5 : at); setPhase('stuck') }
    setBusy(false)
  }, [busy])

  const seeing = focus ?? Math.max(0, cursor - 1)
  const art = STEPS[seeing]

  return (
    <Root>
      <header className="bg-[#e2f2f0]">
        <div className="wrap pb-7 pt-4 lg:pb-10 lg:pt-6">
          <div className="grid items-start gap-5
            lg:grid-cols-[minmax(0,1fr)_minmax(0,46%)] lg:gap-8">
            <ScrollIn className="grid min-w-0 gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]
              lg:grid-cols-1">
              <Card variant="rule" hue="coral" side="left" className="self-start pl-3.5">
                <p className="font-display text-tick font-bold text-ink">What you do not need</p>
                <ul className="m-0 mt-1.5 grid list-none grid-cols-2 gap-x-4 p-0">
                  {NOTHING.map(t => (
                    <li key={t} className="flex min-h-[2rem] items-center gap-2 border-b border-coral/25
                      text-fine text-ink">
                      <Cross aria-hidden className="size-3.5 shrink-0 text-coral-ink"/>
                      <span className="line-through decoration-coral-ink/60 decoration-[1.5px]">{t}</span>
                    </li>
                  ))}
                </ul>
              </Card>
              <div className="h-[200px] overflow-hidden rounded-panel border border-rule lg:h-[230px]">
                <Frame photo="friends-steps" alt={PHOTO_ALT}/>
              </div>
            </ScrollIn>

            <ScrollIn className="min-w-0">
              <Card className="min-w-0 p-3.5 lg:p-5">
                <figure className="m-0 min-w-0">
                  <WirelessLink className="mx-auto"/>
                </figure>
              </Card>
            </ScrollIn>
          </div>
        </div>
      </header>

      <Section tone="card" tight className="bg-card">
        <SectionHead className="mt-0 max-w-[26ch]">Connect the patch</SectionHead>
        <div className="mt-4 lg:mt-5">
          <Card>
            <div className="border-b border-rule bg-sky-wash p-3.5 lg:p-4">
              {/* Column at 390, where the nowrap button label is wider than the card. */}
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap
                sm:items-center sm:justify-between sm:gap-x-5">
                <div className="min-w-0" aria-live="polite">
                  <p className="font-display text-ui font-bold text-ink">{PHASE_WORD[phase]}</p>
                  <p className="mt-0.5 text-fine tabular-nums text-ink-2">
                    {cursor} of {STEPS.length} steps
                  </p>
                </div>
                <Button size="sm" onClick={connect} disabled={busy}
                  className="min-h-[44px] shrink-0">
                  {busy ? 'Choosing a device…' : phase === 'idle' ? 'Connect to the patch' : 'Connect again'}
                  <ArrowRight aria-hidden/>
                </Button>
              </div>
              <dl className="m-0 mt-3 grid gap-2 border-t border-sky/25 pt-2.5 sm:grid-cols-2">
                {LINK_FACTS.map(f => (
                  <div key={f.k} className="min-w-0">
                    <dt className="text-fine font-semibold text-ink-2">{f.k}</dt>
                    <dd className="m-0 mt-0.5 font-display text-ui font-bold leading-tight text-ink">
                      {f.v}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div aria-live="polite">
              {msg && (
                /* Tint on the wrapper: input.css caps every <p> at 62ch. */
                <div className="border-b border-rule bg-sun-wash px-3.5 py-3 lg:px-4">
                  <p className="text-fine text-ink-2">{msg}</p>
                </div>
              )}
            </div>

            <button type="button" aria-expanded={steps} aria-controls="pairing-steps"
              onClick={() => setSteps(v => !v)}
              className="flex min-h-[48px] w-full items-center justify-between gap-3 px-3.5 py-2.5
                text-left font-display text-ui font-bold text-ink touch-manipulation lg:px-4
                hoverOnly:bg-beam-wash">
              Steps to connect
              <ChevronDown aria-hidden className={cn('size-5 shrink-0 text-ink-2',
                'transition-transform duration-150 motion-reduce:transition-none', steps && 'rotate-180')}/>
            </button>

            {steps && (
            <div id="pairing-steps"
              className="grid border-t border-rule lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
              <div className="min-w-0 p-3.5 lg:p-4">
                <ol className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2 lg:grid-cols-1">
                  {STEPS.map((s, i) => {
                    const st = statusOf(i, cursor, phase)
                    const Mk = MARK[st]
                    const on = seeing === i
                    return (
                      <li key={s.k}>
                        <button type="button" onClick={() => setFocus(i)} aria-pressed={on}
                          className={cn('flex h-full w-full min-h-[44px] items-start gap-3 rounded-panel',
                            'border border-rule bg-card px-3 py-2.5 text-left',
                            'touch-manipulation transition-[border-color,background-color] duration-150',
                            'ease-[var(--ease-out)] hoverOnly:border-ruling',
                            on && 'border-l-[3px] border-l-beam bg-beam-wash')}>
                          <span className="mt-0.5 flex shrink-0 items-center gap-1.5">
                            <span className="text-tick font-bold tabular-nums text-beam-ink">
                              {i + 1}
                            </span>
                            {Mk && <Mk aria-hidden className={cn('size-4',
                              st === 'done' ? 'text-accent' : 'text-ink-3')}/>}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                              <span className="font-display text-ui font-bold leading-tight text-ink">
                                {s.title}
                              </span>
                              {LABEL[st] && (
                                <span className={cn('text-fine font-semibold leading-[1.3]',
                                  st === 'done' ? 'text-accent' : 'text-ink-3')}>
                                  {LABEL[st]}
                                </span>
                              )}
                            </span>
                            <span className="mt-1 block max-w-[56ch] text-fine text-ink-2">
                              {s.line}
                            </span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ol>
              </div>

              {/* One drawing, for the step being read. */}
              <div className="flex items-center justify-center border-t border-rule bg-lilac-wash
                p-3 lg:border-l lg:border-t-0">
                {art && <StepArt kind={art.k} scale={0.4}/>}
              </div>
            </div>
            )}
          </Card>
        </div>

        <h3 className="mt-6 font-display text-row font-bold leading-tight text-ink lg:mt-8">
          Not working?
        </h3>
        <ul className="m-0 mt-3 grid list-none gap-2.5 p-0 sm:grid-cols-2 lg:grid-cols-4 lg:gap-3">
          {TROUBLE.map((t, i) => (
            <li key={t.title}>
              <ScrollRow index={i} className="h-full">
                <Card variant="tint" hue={t.hue} className="flex h-full flex-col p-3.5 lg:p-4">
                  <h4 className="font-display text-ui font-bold leading-tight text-ink">
                    {t.title}
                  </h4>
                  <p className={cn('mt-2 border-l-2 pl-2.5 text-fine text-ink-2', QUOTE[t.hue])}>
                    {t.seen}
                  </p>
                  <dl className="m-0 mt-auto flex gap-2 pt-2.5">
                    <dt className="shrink-0 text-fine font-semibold text-ink">Do</dt>
                    <dd className="m-0 min-w-0 text-fine text-ink-2">{t.fix}</dd>
                  </dl>
                </Card>
              </ScrollRow>
            </li>
          ))}
        </ul>
      </Section>

    </Root>
  )
}
