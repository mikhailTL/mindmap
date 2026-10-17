import React from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Section, SectionHead } from '../ui/section'
import { ArrowRight, Check, Always, Never, Minus, ChevronDown } from '../ui/marks'
import { Parallax2D, RevealLines, ScrollIn, ScrollRow } from '../ui/motion'
import { WirelessLink, StepArt } from '../charts/pairing-art'
import { ITEMS, connectPatch } from '../lib/engine'
import { SCORE } from '../lib/terms'
import { cn } from '../lib/utils'

/* Using the patch: one console. Pressing Connect runs lib/engine.js
 * connectPatch for real, and the step list fills in as the flow moves. One
 * drawing shows at a time, for the current step; any revealed step can be
 * pressed to see its drawing again. The failures sit behind one control.
 *
 * Rules. Every step is the flow engine.js runs and every quoted message is a
 * string from that file, verbatim; the phase comes from the same
 * navigator.bluetooth guard, so the console cannot claim a step the code did
 * not reach. Battery, adhesive, range and pairing time are unsettled and stay
 * unwritten.
 * Containers, density, small headings, no paragraphs (docs/design-spec.md). */

/* The six steps of the real flow, one line each. Art is in charts/pairing-art. */
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

/* Stated as absences, because the absence is the point. */
const NOTHING = ['A cable', 'A driver', 'A download', 'A developer tool']

/* The settled facts about the link, on the status bar before anything is
   pressed. Range, pairing time and battery are open and not here. */
const LINK_FACTS = [
  { k:'Link',    v:'Bluetooth Low Energy' },
  { k:'Signals', v:'4, once a second' },
]

/* `seen` is the engine's own string, quoted verbatim (line noted beside it);
   `fix` is what to do. */
const TROUBLE = [
  { /* engine.js:47, the navigator.bluetooth guard: an embedded page and plain
       http both land on this one message, so one card. */
    title:'The Browser Has No Bluetooth',
    seen:'This browser cannot open a Bluetooth connection from inside an embedded page. Open the '
      + 'site directly in Chrome on a computer, or use the check-in below.',
    fix:'Open the site directly in Chrome, over https.' },
  { /* engine.js:45 and 50: the service filter on requestDevice */
    title:'The List Is Empty',
    seen:'The browser’s list shows no devices.',
    fix:'Take the patch off charge, near the phone. Press Connect again.' },
  { /* engine.js:54 and 55: NotFoundError is a cancel, not a fault */
    title:'You Closed the List',
    seen:'No patch was selected. The check-in below works without one.',
    fix:'Press Connect again and choose the patch.' },
  { /* engine.js:56: anything requestDevice or gatt.connect throws */
    title:'The Connection Failed',
    seen:'Could not connect: unknown. The check-in below works without a patch.',
    fix:`Try again, or take a ${SCORE} instead.` },
]

const PHASE_WORD = { idle:'Not started', asking:'Asking the browser', live:'Connected', stuck:'Stopped' }

/* done / now / stuck; a step past the cursor is not rendered at all. */
function statusOf(i, cursor, phase) {
  if (i < cursor - 1) return 'done'
  if (phase === 'live') return 'done'
  if (phase === 'stuck') return 'stuck'
  return 'now'
}

const MARK = { done: Check, now: Always, stuck: Minus }
const LABEL = { done:'Done', now:'Now', stuck:'Stopped here' }

/* `as`, `level` and `tail`: the hub (views/PatchHub) draws this inside its
   own <main>, under its own band, with Without the patch straight after. */
export function Pairing({ go, as: Root = 'main', level = 1, tail = true }) {
  const [phase, setPhase] = React.useState('idle')
  const [cursor, setCursor] = React.useState(0)      // steps revealed
  const [msg, setMsg] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [trouble, setTrouble] = React.useState(false)
  const [focus, setFocus] = React.useState(null)     // which step's drawing shows

  /* The same guard engine.js runs, read only to place the cursor. The message
     shown is always the engine's own. */
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

  const shown = STEPS.slice(0, cursor)
  const seeing = focus === null ? cursor - 1 : focus
  const art = seeing >= 0 ? STEPS[seeing] : null

  return (
    <Root>
      <header className="border-t border-rule bg-accent-wash">
        <div className="wrap py-7 lg:py-10">
          <div className="grid items-end gap-5
            lg:grid-cols-[minmax(0,1fr)_minmax(0,42%)] lg:gap-8">
            <div className="min-w-0">
              {level === 1 && (
                <p className="mb-2 font-body text-ui font-semibold text-accent-ink">
                  Using the patch
                </p>
              )}
              {/* The owner's own heading, spec 0d rule 3. */}
              <RevealLines as={level === 1 ? 'h1' : 'h2'}
                className="max-w-[20ch] font-display font-bold text-major leading-[1.05]
                  tracking-tight text-ink"
                lines={['Fully Wireless,', '2 Minutes of Setup']}/>
              <ScrollIn className="mt-4 grid gap-3 sm:grid-cols-2">
                <Card className="p-3.5">
                  <p className="font-display text-tick font-bold text-ink">What You Do Not Need</p>
                  <ul className="m-0 mt-2 flex list-none flex-wrap gap-1.5 p-0">
                    {NOTHING.map(t => (
                      <li key={t} className="flex items-center gap-1.5 rounded-field border border-rule
                        bg-paper px-2.5 py-1 text-fine text-ink">
                        <Never aria-hidden className="size-3.5 shrink-0 text-ink-3"/>{t}
                      </li>
                    ))}
                  </ul>
                </Card>
                <Card className="p-3.5">
                  <p className="font-display text-tick font-bold text-ink">
                    How It Connects
                  </p>
                  <p className="mt-2 max-w-[44ch] text-fine text-ink-2">
                    The connect steps below run the app’s real code.
                  </p>
                </Card>
              </ScrollIn>
            </div>

            <Parallax2D distance={40} className="min-w-0">
              <Card className="min-w-0 p-3.5">
                <figure className="m-0 min-w-0">
                  <WirelessLink/>
                </figure>
              </Card>
            </Parallax2D>
          </div>
        </div>
      </header>

      {/* The console: one button, the steps it reveals, the failures behind
          their own control. */}
      <Section tone="card" className="bg-card">
        <SectionHead className="mt-1 max-w-[26ch]">Connect the Patch</SectionHead>
        <div className="mt-4 lg:mt-5">
          <Card>
            <div className="border-b border-rule bg-paper p-3.5 lg:p-4">
              {/* Column at 390: the nowrap button label overran the card. */}
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap
                sm:items-center sm:justify-between sm:gap-x-5">
                <div className="min-w-0" aria-live="polite">
                  <p className="font-display text-ui font-bold text-ink">{PHASE_WORD[phase]}</p>
                  <p className="mt-0.5 text-fine tabular-nums text-ink-3">
                    {cursor} of {STEPS.length} steps
                  </p>
                </div>
                <Button size="sm" onClick={connect} disabled={busy}
                  className="min-h-[44px] shrink-0">
                  {busy ? 'Choosing a device…' : phase === 'idle' ? 'Connect to the patch' : 'Connect again'}
                  <ArrowRight aria-hidden/>
                </Button>
              </div>
              <dl className="m-0 mt-3 grid gap-2 border-t border-rule pt-2.5 sm:grid-cols-2">
                {LINK_FACTS.map(f => (
                  <div key={f.k} className="min-w-0">
                    <dt className="text-fine font-semibold text-ink-3">{f.k}</dt>
                    <dd className="m-0 mt-0.5 font-display text-ui font-bold leading-tight text-ink">
                      {f.v}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* The engine's own words, ruled rather than coloured. The live
                region wraps the whole outcome, not just the phase word. */}
            <div aria-live="polite">
              {msg && (
                /* Tint on the wrapper: input.css caps every <p> at 62ch. */
                <div className="border-b border-rule bg-aqua px-3.5 py-3 lg:px-4">
                  <p className="text-fine text-ink-2">{msg}</p>
                </div>
              )}
            </div>

            {cursor > 0 && (
              <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
                <div className="min-w-0 p-3.5 lg:p-4">
                  {/* A real ordered list; the status rides beside the title so
                      the step's line keeps its width at 390. */}
                  <ol className="m-0 grid list-none gap-2 p-0">
                    {shown.map((s, i) => {
                      const st = statusOf(i, cursor, phase)
                      const Mk = MARK[st]
                      const on = seeing === i
                      return (
                        <li key={s.k}>
                          <button type="button" onClick={() => setFocus(i)} aria-pressed={on}
                            className={cn('flex w-full min-h-[44px] items-start gap-3 rounded-panel',
                              'border border-rule bg-card px-3 py-2.5 text-left',
                              'touch-manipulation transition-[border-color] duration-150',
                              'ease-[var(--ease-out)] hoverOnly:border-ruling',
                              on && 'border-l-[3px] border-l-accent')}>
                            <span className="mt-0.5 flex shrink-0 items-center gap-1.5">
                              <span className="text-tick tabular-nums text-ink-3">
                                {i + 1}
                              </span>
                              <Mk aria-hidden className={cn('size-4',
                                st === 'done' ? 'text-accent' : 'text-ink-3')}/>
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                                <span className="font-display text-ui font-bold leading-tight text-ink">
                                  {s.title}
                                </span>
                                {/* Plain type, never a capsule (spec 0d rule 2). */}
                                <span className={cn('text-fine font-semibold leading-[1.3]',
                                  st === 'done' ? 'text-accent' : 'text-ink-3')}>
                                  {LABEL[st]}
                                </span>
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

                  {/* The only way the failures appear; drawn as a control. */}
                  <button type="button" onClick={() => setTrouble(v => !v)}
                    aria-expanded={trouble} aria-controls="trouble"
                    className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-field
                      border border-ink bg-transparent px-4 font-display text-ui font-medium
                      text-ink touch-manipulation transition-[background-color] duration-150
                      ease-[var(--ease-out)] active:bg-aqua hoverOnly:bg-aqua">
                    {trouble ? 'Hide the fixes' : 'Not working?'}
                    <ChevronDown aria-hidden
                      className={cn('transition-transform duration-150 ease-[var(--ease-out)]',
                        trouble && 'rotate-180')}/>
                  </button>
                </div>

                {/* One drawing, for the step being read. */}
                <div className="flex items-center justify-center border-t border-rule bg-aqua
                  p-3 lg:border-l lg:border-t-0">
                  {art && <StepArt kind={art.k} scale={0.4}/>}
                </div>
              </div>
            )}
          </Card>
        </div>

        {trouble && (
          <ul id="trouble" className="m-0 mt-3 grid list-none gap-2.5 p-0 lg:grid-cols-2 lg:gap-3">
            {TROUBLE.map((t, i) => (
              <li key={t.title}>
                <ScrollRow index={i} className="h-full">
                  <Card className="flex h-full flex-col p-3.5 lg:p-4">
                    <h3 className="font-display text-ui font-bold leading-tight text-ink">
                      {t.title}
                    </h3>
                    <p className="mt-2 border-l-2 border-ruling pl-2.5 text-fine text-ink-2">
                      {t.seen}
                    </p>
                    <dl className="m-0 mt-2.5 flex gap-2">
                      <dt className="shrink-0 text-fine font-semibold text-ink-3">Do</dt>
                      <dd className="m-0 min-w-0 text-fine text-ink-2">{t.fix}</dd>
                    </dl>
                  </Card>
                </ScrollRow>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Size, charging slot and baseline live on the patch page. The one thing
          kept here is the way through without a patch. */}
      {tail && <Section tone="paper" tight className="bg-aqua-2">
        <ScrollIn>
        <Card className="p-3.5 lg:p-4">
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
            <div className="min-w-0">
              <h2 className="m-0 font-display text-row font-bold leading-tight text-ink">
                Without the Patch
              </h2>
              <p className="mt-1.5 max-w-[46ch] text-fine text-ink-2">
                Phone camera and microphone, or {ITEMS.length} questions.
              </p>
            </div>
            <Button onClick={() => go && go('without-patch')}>
              Take a reading<ArrowRight aria-hidden/>
            </Button>
          </div>
        </Card>
        </ScrollIn>
      </Section>}
    </Root>
  )
}
