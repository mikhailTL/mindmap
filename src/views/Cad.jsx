import React from 'react'
import { Label } from '../ui/misc'
import { Button } from '../ui/button'
import { Card } from '@/ui/card'
import { DemoNotice } from '../ui/notice'
import { RevealLines, ScrollIn } from '../s21/motion'

/* The full DI-03 assembly as a live scene: 183 bodies, drawn from raw
 * Float32 positions and Uint32 indices rather than from a compressed glTF.
 *
 * DESIGN INTENT — NOT AS-BUILT. Nothing in this package was measured from
 * hardware and no sensing behaviour follows from any of it.
 *
 * The geometry is 20.3 MB on disk and about 9 MB over a gzipping connection.
 * That is an order of magnitude past anything else this site ships, so it is
 * behind a button rather than behind a route: arriving at #/cad costs the
 * page and nothing else, and the three files are only requested once a reader
 * has been told the price and asked for it anyway.
 */
const TAG = 'mindmap-arena'
const SCRIPT = '/di/arena/mindmap-arena.js'
const PACK = '/di/arena/mindmap-arena.json'
const BIN = '/di/arena/mindmap.bin'

/* The geometry's length on disk. Content-Length reports the *compressed*
   length whenever the server gzips the response, while the reader yields
   decompressed bytes — dividing one by the other runs the bar to 100% at
   about 45% of the download and then sits there. The raw figure is the honest
   denominator, and a response that declares more than it is trusted instead. */
const RAW_BYTES = 20294028
const mb = n => (n / 1e6).toFixed(1)

/* The stage the viewer reserves for itself. The element floors its own :host
   at 680px, and at 700px below 760px wide where its controls panel goes modal,
   so the clamp starts at the taller of the two — a reservation the element can
   overrule is not a reservation, it is the layout shift this exists to
   prevent. One value feeds both the custom property the element sizes itself
   from and the min-height the empty box holds, so they cannot disagree. */
const STAGE = 'clamp(700px, 76vh, 880px)'

/* One <script> for the whole application, tracked at module scope. A second
   customElements.define of a name that is already taken throws, and React
   double-invokes effects under StrictMode, so the promise — not the DOM — is
   what makes this idempotent. A failed load clears the memo so that the retry
   control is not permanently pointed at a script that never arrived. */
let loading = null
function loadScript() {
  if (loading) return loading
  loading = new Promise((resolve, reject) => {
    if (customElements.get(TAG)) return resolve()
    let el = document.querySelector(`script[data-di="${TAG}"]`)
    if (!el) {
      el = document.createElement('script')
      el.src = SCRIPT
      el.async = true
      el.dataset.di = TAG
      document.head.append(el)
    }
    el.addEventListener('load', () => resolve(), { once: true })
    el.addEventListener('error', () => {
      loading = null
      el.remove()
      reject(new Error('The viewer code did not load.'))
    }, { once: true })
  }).then(() => customElements.whenDefined(TAG))
  return loading
}

/* Read through the stream rather than awaiting arrayBuffer(), so the reader
   gets a number that moves. A 9 MB transfer with a spinner over it is
   indistinguishable from a hang, and this one can run for half a minute. */
async function fetchGeometry(signal, onBytes) {
  const res = await fetch(BIN, { signal })
  if (!res.ok) throw new Error(`The geometry did not load (${res.status}).`)
  const declared = Number(res.headers.get('content-length')) || 0
  const total = declared > RAW_BYTES ? declared : RAW_BYTES
  if (!res.body?.getReader) { onBytes(null, total); return res.arrayBuffer() }
  const reader = res.body.getReader()
  const chunks = []
  let got = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    got += value.length
    onBytes(got, total)
  }
  /* The element indexes into one ArrayBuffer with 549 byte offsets, so the
     chunks have to be flattened into a single contiguous block. */
  const flat = new Uint8Array(got)
  let at = 0
  for (const c of chunks) { flat.set(c, at); at += c.length }
  return flat.buffer
}

/* What the viewer's own controls do, written out before the download rather
   than after it: a reader deciding whether to spend 9 MB needs to know what
   they are buying while they still have the choice. */
const CAN = [
  ['Four named views',
   'Exploded, Section A–A, Section B–B and Ghost cut and stage the assembly the same way the still renders on the hardware page do — except that you are holding the camera.'],
  ['A continuous explode',
   'A slider from nought to one rather than a together-or-apart switch, so the separation can be stopped halfway, where the parts are still recognisably in their pockets.'],
  ['Shell opacity',
   'Fades the outer case until the board, the cell, the light guide and the flex bend are visible through it without cutting anything away.'],
  ['Per-component selection',
   'Click any body and the viewer names it, and will hide it or isolate it from the other 182. Every name resolves inside the model’s own registry.'],
]

export function Cad({ go }) {
  const box = React.useRef(null)
  /* The parsed manifest and the 20 MB block live in refs, not in state: React
     has no reason to diff them, and a re-render per progress tick would carry
     them along for nothing. */
  const pack = React.useRef(null)
  const bin = React.useRef(null)
  const abort = React.useRef(null)

  const [stage, setStage] = React.useState('idle')     // idle | loading | error | live
  const [ready, setReady] = React.useState(false)       // the scene has drawn its first frame
  const [fault, setFault] = React.useState('')
  const [wire, setWire] = React.useState({ got: 0, total: RAW_BYTES, known: true })

  const start = React.useCallback(() => {
    if (stage === 'loading' || stage === 'live') return
    const ctrl = new AbortController()
    abort.current = ctrl
    setFault('')
    setWire({ got: 0, total: RAW_BYTES, known: true })
    setStage('loading')
    Promise.all([
      loadScript(),
      fetch(PACK, { signal: ctrl.signal }).then(r => {
        if (!r.ok) throw new Error(`The parts manifest did not load (${r.status}).`)
        return r.json()
      }),
      fetchGeometry(ctrl.signal, (got, total) =>
        setWire({ got: got ?? 0, total, known: got !== null })),
    ]).then(([, parsed, buffer]) => {
      if (ctrl.signal.aborted) return
      pack.current = parsed
      bin.current = buffer
      setStage('live')
    }).catch(err => {
      if (ctrl.signal.aborted || err?.name === 'AbortError') return
      console.error('[Cad] the interactive viewer could not load', err)
      setFault(err?.message || 'The viewer could not load.')
      setStage('error')
    })
  }, [stage])

  /* Mounting is its own effect so that the element is created once and torn
     down once. `ready` is deliberately not a dependency: flipping it inside
     the effect would run this cleanup and remove the element the moment it
     finished drawing. */
  React.useEffect(() => {
    if (stage !== 'live') return
    const host = box.current
    if (!host || !pack.current || !bin.current) return
    let dead = false
    const el = document.createElement(TAG)
    el.inlineData = pack.current
    el.inlineBuffer = bin.current
    el.setAttribute('arena', 'studio')
    el.setAttribute('view', 'closed')
    host.append(el)
    el.ready.then(() => { if (!dead) setReady(true) })
      .catch(err => {
        if (dead) return
        setFault(err?.message || 'The scene could not be drawn.')
        setStage('error')
      })
    /* remove() fires disconnectedCallback, which is where the element disposes
       its renderer, its geometries and its environment map. */
    return () => { dead = true; setReady(false); el.remove() }
  }, [stage])

  /* Leaving the route must not leave 20 MB pinned behind it, and must not
     leave a half-finished transfer running into a component that is gone. */
  React.useEffect(() => () => {
    abort.current?.abort()
    pack.current = null
    bin.current = null
  }, [])

  const pct = wire.total ? Math.min(100, Math.round((wire.got / wire.total) * 100)) : 0

  return (
    <main>
      <section className="border-b border-rule bg-mist">
        <div className="wrap py-20">
          <Label>Interactive CAD · revision DI-03</Label>
          <div className="mt-3 grid items-start gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14">
            <div>
              <RevealLines as="h1"
                className="max-w-[20ch] font-display font-medium text-sect leading-[1.05] tracking-tight text-ink"
                lines={['All 183 bodies,', 'in your own hands.']}/>
              <ScrollIn className="mt-5">
                <p className="max-w-[46ch] text-lead leading-[1.5] text-ink-2">
                  The same design-intent package the hardware page is written from, loaded
                  whole rather than rendered to pictures: every shell, board, foil, cell,
                  window and construction volume, drawn live and turned by you.
                </p>
                <p className="mt-5 max-w-[52ch] text-sec text-ink-2">
                  Millimetres throughout, revision DI-03, 15 September 2026. The viewer
                  carries its own controls — views, explode, shell opacity, component
                  selection — and stamps every frame it draws.
                </p>
                <DemoNotice className="mt-6">
                  This is our own model and nothing more. No unit has been assembled, no
                  dimension here was measured from hardware, and no sensing performance
                  follows from any of it. Activity lights inside the viewer are an
                  explanatory animation, not firmware, measurements or optical validation.
                </DemoNotice>
              </ScrollIn>
            </div>

            <ol className="m-0 grid list-none gap-4 p-0">
              {CAN.map(([title, text], i) => (
                <li key={title}>
                  <Card className="grid grid-cols-[36px_1fr] items-start gap-4 p-5">
                    <span className="pt-1 font-mono text-tick text-ink-3">0{i + 1}</span>
                    <div>
                      <h2 className="font-display text-row font-medium text-ink">{title}</h2>
                      <p className="mt-1.5 max-w-[46ch] text-meta text-ink-2">{text}</p>
                    </div>
                  </Card>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="wrap py-14">
        {/* The whole point of this route. The figure is in the heading and on
            the control, because a reader who only reads one of the two still
            has to meet it before anything is fetched. */}
        <h2 className="mark">Nothing has been downloaded yet</h2>
        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            <p className="max-w-[52ch] text-sec text-ink-2">
              The geometry is <span className="font-mono tabular-nums">20.3</span> MB of raw
              vertices, normals and indices — roughly{' '}
              <span className="font-mono tabular-nums">9</span> MB over the wire once the
              server compresses it, and it stays in memory at full size while the viewer is
              open. It is requested when you press the button and not before.
            </p>
            <p className="mt-4 max-w-[52ch] text-meta text-ink-3">
              On a phone, on a metered connection, or if you only want to see how the seven
              layers stack, the hardware page carries a lighter viewer of the same assembly
              at about a twentieth of the size.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Button onClick={start} disabled={stage === 'loading' || stage === 'live'}>
                {stage === 'idle' ? 'Load the interactive CAD — about 9 MB'
                  : stage === 'loading' ? 'Loading — about 9 MB'
                  : stage === 'error' ? 'Load the interactive CAD — about 9 MB'
                  : 'Loaded'}
              </Button>
              <Button variant="ghost" onClick={() => go('patch')}>
                Use the lighter viewer instead
              </Button>
            </div>
          </div>

          <div>
            {/* role="status" rather than a bare aria-live paragraph: the
                percentage, the byte count and the failure all come through the
                same region, so a screen reader hears one running commentary
                instead of three that interrupt each other. */}
            {/* The floor is the tallest state at 390px, where this column sits
                above the stage and every line it gains pushes the viewer down.
                Measured, not guessed: the download readout runs to 143px there
                and the post-load hint to the same. */}
            <div role="status" className="min-h-[10rem]">
              {stage === 'loading' && (
                <>
                  <p className="font-mono text-tick tabular-nums text-ink-2">
                    {wire.known
                      ? `Geometry · ${mb(wire.got)} of ${mb(wire.total)} MB · ${pct}%`
                      : 'Geometry · downloading, size not reported'}
                  </p>
                  <div
                    role="progressbar"
                    aria-label="Downloading the CAD geometry"
                    aria-valuemin={0} aria-valuemax={100}
                    aria-valuenow={wire.known ? pct : undefined}
                    className="mt-3 h-2.5 w-full max-w-[42ch] border border-rule bg-mist">
                    <div
                      className={`h-full bg-accent transition-[width] duration-200 ease-out
                        ${wire.known ? '' : 'w-1/3 animate-pulse'}`}
                      style={wire.known ? { width: `${pct}%` } : undefined}/>
                  </div>
                  <p className="mt-3 max-w-[46ch] text-meta text-ink-3">
                    The scene is built once the last byte lands, so the figure above stops
                    a moment before the model appears.
                  </p>
                </>
              )}
              {stage === 'error' && (
                <div className="border-l-[3px] border-crit pl-4">
                  <span className="font-mono text-tick uppercase tracking-[0.09em] text-crit">
                    Did not load
                  </span>
                  <p className="mt-2 max-w-[46ch] text-meta text-ink-2">{fault}</p>
                  <p className="mt-2 max-w-[46ch] text-meta text-ink-3">
                    Nothing is cached from a failed attempt, so trying again starts the
                    transfer from the beginning.
                  </p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={start}>
                    Try again
                  </Button>
                </div>
              )}
              {stage === 'live' && !ready && (
                <p className="font-mono text-tick text-ink-2">
                  Building the scene — 183 bodies.
                </p>
              )}
              {stage === 'live' && ready && (
                <p className="max-w-[46ch] text-meta text-ink-2">
                  Drag to turn the model, and use the viewer&rsquo;s own Controls panel for
                  views, explode, shell opacity and component selection. Press Escape to
                  clear a selection.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* The stage reserves its full height from the first paint, so the
            element upgrading into it moves nothing below it. */}
        <div className="relative mt-10 border border-rule bg-card"
          style={{ '--mindmap-height': STAGE }}>
          {/* The rule is on the wrapper, not on this box: a border on the box
              would sit inside its min-height and then be pushed out by the
              700px element, growing the stage by 2px at the moment of mount. */}
          <div ref={box} style={{ minHeight: STAGE }}/>
          {!ready && (
            <div className="pointer-events-none absolute inset-0 grid place-content-center
              justify-items-center gap-5 px-6 text-center">
              {/* A drawn stand-in rather than an empty box: the plan the
                  manifest describes, at its 64 : 42 proportion, with the two
                  electrode centres on the X axis and the optical pair on the
                  centreline at Y −8. The electrodes are drawn as setting-out
                  targets crossed by the centrelines they are dimensioned from
                  — a bare pair of circles over a rectangle reads as a face
                  rather than as a layout. */}
              <svg viewBox="0 0 128 84" aria-hidden="true"
                className={`h-28 w-auto text-rule ${stage === 'loading' ? 'animate-pulse' : ''}`}>
                <ellipse cx="64" cy="42" rx="60" ry="37" fill="none" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M2 42h124M64 3v78" stroke="currentColor" strokeWidth="0.8"
                  strokeDasharray="7 3 1.5 3" opacity="0.75"/>
                <circle cx="36" cy="42" r="6" fill="none" stroke="currentColor" strokeWidth="1.4"/>
                <circle cx="92" cy="42" r="6" fill="none" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M55 52h18v9h-18z M64 52v9" fill="none" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
              <p className="max-w-[40ch] font-mono text-tick text-ink-3">
                {stage === 'idle' ? 'The interactive model is not loaded.'
                  : stage === 'loading' ? 'Downloading the model…'
                  : stage === 'error' ? 'The model did not load, so the assembly cannot be shown here.'
                  : 'Building the scene…'}
              </p>
            </div>
          )}
        </div>

        <p className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-l-2 border-warn py-0.5 pl-3">
          <span className="shrink-0 font-mono text-fine uppercase tracking-[0.09em] text-warn">
            Design intent — not as-built
          </span>
          <span className="max-w-[62ch] text-fine text-ink-3">
            Revision DI-03 · 183 bodies · millimetres. Activity lights are an explanatory
            animation, not firmware, measurements or optical validation.
          </span>
        </p>

        <div className="mt-14 border-t border-ink pt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <p className="max-w-[62ch] text-meta text-ink-2">
            The written account of this package — what each layer is, what each sensor reads,
            and the ten-point audit the model fails eight of — is on the hardware page.
          </p>
          <Button variant="outline" onClick={() => go('patch')}
            className="justify-self-start lg:justify-self-end">
            Read the hardware page
            <span aria-hidden>→</span>
          </Button>
        </div>
      </section>
    </main>
  )
}
