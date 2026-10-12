import React from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Section, SectionHead } from '../ui/section'
import { ArrowRight, Check, Always, Never, Minus, ChevronDown } from '../ui/marks'
import { RevealLines, ScrollIn, ScrollRow } from '../ui/motion'
import { WirelessLink, ArmPlacement, StepArt } from '../charts/pairing-art'
import { ITEMS, connectPatch } from '../lib/engine'
import { SCORE } from '../lib/terms'
import { cn } from '../lib/utils'

/* Using the patch. This was a full marketing page for six steps and five
 * failures, which is far more page than the subject deserves: the owner's note
 * was that it should be one button, and that the directions should arrive when
 * pressing it makes them relevant.
 *
 * So it is one console. Pressing Connect runs lib/engine.js connectPatch for
 * real, and the ordered list under the button fills in as the flow moves. One
 * drawing is shown at a time, for whichever step is current, and the reader can
 * press any revealed step to see its drawing again. The five failures are
 * behind a quiet control and nothing else.
 *
 * Three rules govern this file.
 *
 * One. Every step is the flow engine.js actually runs and every quoted message
 * is a string from that file, verbatim. The phase the console reports is
 * derived from the same navigator.bluetooth guard the engine uses, so the
 * console cannot claim a step the code did not reach.
 *
 * Two. No unit has been built or worn. The header says so plainly, once.
 * Battery, charge time, adhesive, wear duration, electrode build, part
 * numbers, ingress, weight, cost, range and pairing time are all unsettled: a
 * line that would need one of them is written without it.
 *
 * Three. Containers, density, small headings, no paragraphs. See
 * docs/design-spec.md. */

/* The six steps of the real flow. One line each: the long version of each of
   these was a paragraph nobody read. Art for each is in charts/pairing-art. */
const STEPS = [
  { k:'wake',    title:'Take the patch off charge',
    line:'Off charge it advertises itself over Bluetooth Low Energy.' },
  { k:'open',    title:'Open the app in a browser',
    line:'Nothing to install, but the browser has to offer Bluetooth.' },
  { k:'tap',     title:'Press Connect to the patch',
    line:'The app asks the browser for a device and touches nothing else.' },
  { k:'chooser', title:'The browser puts up its own list',
    line:'That sheet is the browser’s, filtered to the one service the patch advertises.' },
  { k:'pick',    title:'Choose the patch, then Pair',
    line:'The app sees nothing at all until you choose.' },
  { k:'stream',  title:'It streams',
    line:'Four channels, once a second, all day.' },
]

/* Stated as the five things a reader does not have to find, because the point
   of the list is the absence. */
const NOTHING = ['A cable', 'A host computer', 'A driver', 'A download', 'A development tool']

/* The three settled facts about the link itself, carried on the console's own
   status bar so the bar states something true before anything is pressed.
   Range, pairing time and battery are all open and none of them is here. */
const LINK_FACTS = [
  { k:'Link',     v:'Bluetooth Low Energy' },
  { k:'Channels', v:'4, once a second' },
  { k:'Fallback', v:`${ITEMS.length} questions` },
]

/* Every quoted string is from src/lib/engine.js; the line it comes from is in
   the comment beside it so a future edit to the connect path finds this copy.
   `seen` is what a reader actually sees on their own screen, and `code` is the
   line in this repo that put it there. The two are kept apart on purpose: a
   service filter is not a message, and labelling it as one would be a small
   lie in a page whose whole subject is what the code really does. */
const TROUBLE = [
  { /* engine.js:47, the navigator.bluetooth guard */
    title:'A message about an embedded page',
    seen:'This browser cannot open a Bluetooth connection from inside an embedded page. Open the '
      + 'site directly in Chrome on a computer, or use the check-in below.',
    why:'The app checks for Bluetooth before anything else, and an embedded page offers none.',
    fix:'Open the site in its own browser window.' },
  { /* engine.js:47 again: one guard, a different cause */
    title:'The same message on plain http',
    seen:'This browser cannot open a Bluetooth connection from inside an embedded page. Open the '
      + 'site directly in Chrome on a computer, or use the check-in below.',
    why:'One guard covers every case where the browser offers no Bluetooth at all.',
    fix:'Open the site over https in a browser that supports it.' },
  { /* engine.js:45 and 50: the service filter on requestDevice */
    title:'The list opens and stays empty',
    seen:'The browser’s own sheet, with no device in it and nothing to choose.',
    code:'filters: [{ services: [6e400001-b5a3-f393-e0a9-e50e24dcca9e] }]',
    why:'The request names one service, so nothing that is not the patch can be listed.',
    fix:'Take the patch off charge, keep it near the phone, press Connect again.' },
  { /* engine.js:54 and 55: NotFoundError is a cancel, not a fault */
    title:'You closed the list without choosing',
    seen:'No patch was selected. The check-in below works without one.',
    why:'Dismissing the browser’s sheet is reported to the app as a cancel, not a fault.',
    fix:'Press Connect again and choose the patch.' },
  { /* engine.js:56: anything requestDevice or gatt.connect throws */
    title:'Found, then could not connect',
    seen:'Could not connect: unknown. The check-in below works without a patch.',
    why:'Anything the connection throws lands here, with the browser’s own reason after the colon.',
    fix:`Try once more with the patch close by, or take a ${SCORE} without one.` },
]

/* Four settled facts about where it sits. Nothing here needs a figure that is
   still open. */
const BODY = [
  { t:'Outer upper arm, long axis along it',
    d:'An oval, 54 mm along the arm by 36 mm across it.' },
  { t:'The skin face does the reading',
    d:'Heart, skin conductance, skin temperature, movement. Once a second, all day.' },
  { t:'Charged through the side',
    d:'A slot in the side of the shell, so the face against the skin carries no port.' },
  { t:'Scored against the wearer',
    d:'Readings become z-scores against the wearer’s own fourteen-day baseline.' },
]

const PHASE_WORD = { idle:'Not started', asking:'Asking the browser', live:'Streaming', stuck:'Stopped' }

/* done / now / stuck, and nothing else: a step past the cursor is not rendered
   at all, which is the whole point of the control. */
function statusOf(i, cursor, phase) {
  if (i < cursor - 1) return 'done'
  if (phase === 'live') return 'done'
  if (phase === 'stuck') return 'stuck'
  return 'now'
}

const MARK = { done: Check, now: Always, stuck: Minus }
const LABEL = { done:'Done', now:'Now', stuck:'Stopped here' }

export function Pairing({ go }) {
  const [phase, setPhase] = React.useState('idle')
  const [cursor, setCursor] = React.useState(0)      // steps revealed
  const [msg, setMsg] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [trouble, setTrouble] = React.useState(false)
  const [focus, setFocus] = React.useState(null)     // which step's drawing shows

  /* The same guard engine.js runs, read here only to decide which step the
     flow reached. The message the reader sees is always the engine's own. */
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
    <main>
      <header className="border-t border-rule bg-mist">
        <div className="wrap py-7 lg:py-10">
          <div className="grid items-end gap-5
            lg:grid-cols-[minmax(0,1fr)_minmax(0,42%)] lg:gap-8">
            <div className="min-w-0">
              <p className="font-mono text-ui font-bold tracking-[0.005em] text-accent">
                Using the patch
              </p>
              {/* The break is explicit so a 390px column cannot split
                  "plugged" across two lines. */}
              <RevealLines as="h1"
                className="mt-2 max-w-[20ch] font-display font-bold text-major leading-[1.05]
                  tracking-tight text-ink"
                lines={['Nothing is plugged', 'into anything.']}/>
              <ScrollIn className="mt-4 grid gap-3 sm:grid-cols-2">
                {/* Containers on the tinted band, not text on it. */}
                <Card className="p-3.5">
                  <p className="font-display text-tick font-bold text-ink">Not needed to start</p>
                  <ul className="m-0 mt-2 flex list-none flex-wrap gap-1.5 p-0">
                    {NOTHING.map(t => (
                      <li key={t} className="flex items-center gap-1.5 rounded-chip border border-rule
                        bg-paper px-2.5 py-1 text-fine text-ink">
                        <Never aria-hidden className="size-3.5 shrink-0 text-ink-3"/>{t}
                      </li>
                    ))}
                  </ul>
                </Card>
                {/* Plain, early and once. A reader must not reach the console
                    below believing a unit has been assembled or worn. */}
                <Card className="p-3.5">
                  <p className="font-display text-tick font-bold text-ink">
                    No unit has been built or worn.
                  </p>
                  <p className="mt-2 max-w-[44ch] text-fine text-ink-2">
                    The enclosure is drawn at a settled size and the connect path below is the
                    app’s real code.
                  </p>
                </Card>
              </ScrollIn>
            </div>

            {/* The figure gets a container too: a drawing sitting straight on
                the tinted band is the thing the owner called low effort. */}
            <Card className="min-w-0 p-3.5">
              <figure className="m-0 min-w-0">
                <WirelessLink/>
                <figcaption className="mt-2 max-w-[42ch] text-fine text-ink-2">
                  A drawing. The link is Bluetooth Low Energy and there is no second path.
                </figcaption>
              </figure>
            </Card>
          </div>
        </div>
      </header>

      {/* The console. One button; the directions arrive when pressing it makes
          them relevant, and the failures stay behind their own control. */}
      <Section name="The setup" tone="card" className="bg-card">
        <SectionHead className="mt-1 max-w-[26ch]">One button, {STEPS.length} steps</SectionHead>
        <div className="mt-4 lg:mt-5">
          <Card>
            {/* The bar states three settled facts even at rest, so a reader who
                never presses the button still leaves with the link, the rate
                and the way through without a patch. */}
            <div className="border-b border-rule bg-paper p-3.5 lg:p-4">
              <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
                <div className="min-w-0" aria-live="polite">
                  <p className="font-display text-ui font-bold text-ink">{PHASE_WORD[phase]}</p>
                  <p className="mt-0.5 font-mono text-fine tabular-nums text-ink-3">
                    {cursor} of {STEPS.length} steps
                  </p>
                </div>
                <Button size="sm" onClick={connect} disabled={busy}
                  className="min-h-[44px] shrink-0">
                  {busy ? 'Choosing a device…' : phase === 'idle' ? 'Connect to the patch' : 'Connect again'}
                  <ArrowRight aria-hidden/>
                </Button>
              </div>
              <dl className="m-0 mt-3 grid gap-2 border-t border-rule pt-2.5 sm:grid-cols-3">
                {LINK_FACTS.map(f => (
                  <div key={f.k} className="min-w-0">
                    <dt className="font-mono text-fine text-ink-3">{f.k}</dt>
                    <dd className="m-0 mt-0.5 font-display text-ui font-bold leading-tight text-ink">
                      {f.v}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* The engine's own words, quoted. Mono and ruled rather than
                coloured: this page carries grounds where warn fails. The live
                region is here rather than on the status word so a reader using
                a screen reader hears the whole outcome, not just the phase. */}
            <div aria-live="polite">
              {msg && (
                /* The tint is on the wrapper, not on the <p>: input.css caps
                   every paragraph at a 62ch measure, so a filled <p> paints a
                   box that stops in the middle of its own card. */
                <div className="border-b border-rule bg-aqua px-3.5 py-3 lg:px-4">
                  <p className="font-mono text-fine text-ink-2">{msg}</p>
                </div>
              )}
            </div>

            {cursor > 0 && (
              <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
                <div className="min-w-0 p-3.5 lg:p-4">
                  {/* A real ordered list in the DOM: the order is the
                      document's, not the grid's. The status rides beside the
                      title rather than in a third column, which at 390 left
                      the step's own line four words wide. */}
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
                              <span className="font-mono text-tick tabular-nums text-ink-3">
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
                                <span className={cn('rounded-chip border px-2 py-[1px] font-mono',
                                  'text-fine leading-[1.3]',
                                  st === 'done'
                                    ? 'border-accent/35 text-accent'
                                    : 'border-rule text-ink-3')}>
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

                  {/* Quiet, and only once there is something to be not
                      working. Pressing it is the only way the five failures
                      appear, and it is drawn as a control rather than as a
                      link, because that is what it is. */}
                  <button type="button" onClick={() => setTrouble(v => !v)}
                    aria-expanded={trouble} aria-controls="trouble"
                    className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-field
                      border border-ink bg-transparent px-4 font-display text-ui font-medium
                      text-ink touch-manipulation transition-[background-color] duration-150
                      ease-[var(--ease-out)] active:bg-mist hoverOnly:bg-mist">
                    {trouble ? 'Hide what can go wrong' : 'It is not working'}
                    <ChevronDown aria-hidden
                      className={cn('transition-transform duration-150 ease-[var(--ease-out)]',
                        trouble && 'rotate-180')}/>
                  </button>
                </div>

                {/* One drawing, for the step being read. Six of these stacked
                    was most of the old page's height. */}
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
                    <dl className="m-0 mt-2.5 grid gap-1.5">
                      {t.code && (
                        <div className="flex gap-2">
                          <dt className="shrink-0 font-mono text-fine text-ink-3">Code</dt>
                          <dd className="m-0 min-w-0 break-words font-mono text-fine text-ink-2">
                            {t.code}
                          </dd>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <dt className="shrink-0 font-mono text-fine text-ink-3">Why</dt>
                        <dd className="m-0 min-w-0 text-fine text-ink-2">{t.why}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="shrink-0 font-mono text-fine text-ink-3">Do</dt>
                        <dd className="m-0 min-w-0 text-fine text-ink-2">{t.fix}</dd>
                      </div>
                    </dl>
                  </Card>
                </ScrollRow>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section name="On the body" tone="paper" tight className="bg-aqua-2">
        <SectionHead className="mt-1 max-w-[24ch]">Where it goes</SectionHead>
        <div className="mt-4 grid gap-3 lg:mt-5
          lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:gap-4">
          <Card className="p-3.5">
            <figure className="m-0 min-w-0">
              <ArmPlacement/>
              <figcaption className="note mt-2 max-w-[40ch]">
                The outer face of the upper arm, seen straight on. A drawing.
              </figcaption>
            </figure>
          </Card>
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
            {BODY.map((b, i) => (
              <li key={b.t}>
                <ScrollRow index={i} className="h-full">
                  <Card className="h-full p-3.5">
                    <p className="font-display text-ui font-bold leading-tight text-ink">{b.t}</p>
                    <p className="mt-1.5 max-w-[48ch] text-fine text-ink-2">{b.d}</p>
                  </Card>
                </ScrollRow>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* The no-patch route makes the wireless point stronger rather than
          weaker: there is nothing to plug in because there is nothing you have
          to have. A container, not words on the tint. */}
      <Section tone="paper" tight className="bg-aqua">
        <Card className="p-3.5 lg:p-4">
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
            <div className="min-w-0">
              <h2 className="m-0 font-display text-row font-bold leading-tight text-ink">
                No patch, still a {SCORE}
              </h2>
              <p className="mt-1.5 max-w-[46ch] text-fine text-ink-2">
                The phone camera and microphone, or {ITEMS.length} questions.
              </p>
            </div>
            <Button onClick={() => go && go('without-patch')}>
              Take a reading without the patch<ArrowRight aria-hidden/>
            </Button>
          </div>
        </Card>
      </Section>
    </main>
  )
}
