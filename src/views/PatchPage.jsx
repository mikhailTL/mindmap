import React from 'react'
import { Frame } from '../ui/frame'
import { LAYERS, ExplodedStack } from './Patch'
import { PatchArena } from '../charts/arena'
import { PatchStack } from '../charts/patchstack'
import { Parallax2D, RevealLines, ScrollIn, ScrollRow } from '../ui/motion'
import { Card } from '@/ui/card'
import { SignalTrace } from '../charts/infographics'
import { RAINBOW } from '../lib/sensors'
import { ChevronDown } from '../ui/marks'
import { cn } from '../lib/utils'
import { Section, SectionHead } from '../ui/section'
import { PART_ART } from '../charts/patch-parts'
import { SCORE, SCORE_RANGE } from '../lib/terms'

/* Values must match the assembly names in the GLB, or isolateGroup no-ops. */
const GROUP = { pod: 'Upper shell', pcb: 'PCB assembly', base: 'Skin carrier' }

/* No unit has been built or worn. The hero frame is a licensed stock
   photograph with a drawing of the oval placed on it. */
const ARM_ALT = 'A licensed stock photograph of a teenager in a school gym, with a drawing '
  + 'of the patch placed on the outer upper arm to show where it would sit.'

/* One ground step per signal, in the rainbow's own order. */
const SIGNAL_GROUND = ['bg-aqua', 'bg-aqua-2', 'bg-accent-wash', 'bg-beam-wash']

/* Only settled facts. Battery, charge time, adhesive, wear time, electrode
   build, part numbers, ingress, weight and cost are open: no figure for any
   of them may be added anywhere on this page. */
const CHAIN = [
  'Sits on your upper arm, under a sleeve.',
  'Records four signals, once a second.',
  'Sends readings to your phone over Bluetooth.',
  `Gives you one ${SCORE} a day, ${SCORE_RANGE}.`,
]

const FIGURES = [
  { k: 'Along the arm',       v: '54', u: 'mm' },
  { k: 'Across the arm',      v: '36', u: 'mm' },
  { k: 'Signals',             v: '4',  u: 'at once' },
  { k: 'Readings',            v: '1',  u: 'a second' },
  { k: 'Learning your usual', v: '14', u: 'days' },
]

const OPEN = ['Battery', 'Charge time', 'Adhesive', 'Wear time', 'Weight', 'Cost']

/* Titles come from views/Patch; the lines are written here so this page
   states only settled facts. */
const PART_LINE = {
  pod:  'Closes the stack. Charges through a slot in the side.',
  pcb:  'Holds the Bluetooth Low Energy radio.',
  base: 'Sits on the arm. All four signals read here.',
}

/* The 3D viewer needs a GPU and can sit on its loading panel forever. Its
   controls stay disabled until the model is live, so a control still disabled
   MODEL_WAIT after the band comes within reach means the model is down, and
   the band drops to the exploded drawing. */
const MODEL_WAIT = 8000

function noWebgl2() {
  try {
    const c = document.createElement('canvas')
    const g = c.getContext('webgl2')
    if (!g) return true
    g.getExtension('WEBGL_lose_context')?.loseContext()
    return false
  } catch { return true }
}

export function PatchPage() {
  const [picked, setPicked] = React.useState(null)
  const [down, setDown] = React.useState(false)
  const model = React.useRef(null)
  const band = React.useRef(null)
  const stage = React.useRef(null)

  /* scrollTo, not scrollIntoView, which no-ops in some engines under an
     inherited smooth behaviour. The header offset comes from scroll-margin-top. */
  const toModel = React.useCallback(() => {
    const el = band.current
    if (!el) return
    const clear = parseFloat(getComputedStyle(el).scrollMarginTop) || 0
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - clear })
  }, [])

  React.useEffect(() => {
    if (picked) model.current?.isolateGroup(GROUP[picked])
    else model.current?.showAll()
  }, [picked])

  React.useEffect(() => {
    const node = stage.current
    if (!node) return
    let poll = 0, io = null, dead = false
    const up = () => {
      const b = node.querySelectorAll('button')
      return b.length > 0 && ![...b].some(x => x.disabled)
    }
    const begin = () => {
      if (dead) return
      if (noWebgl2()) { setDown(true); return }
      const t0 = Date.now()
      poll = setInterval(() => {
        if (dead) return
        if (up()) { clearInterval(poll); poll = 0 }
        else if (Date.now() - t0 > MODEL_WAIT) { clearInterval(poll); poll = 0; setDown(true) }
      }, 400)
    }
    if (typeof IntersectionObserver !== 'function') begin()
    else {
      io = new IntersectionObserver(e => {
        if (e.some(x => x.isIntersecting)) { io.disconnect(); io = null; begin() }
      }, { rootMargin: '300px' })
      io.observe(node)
    }
    return () => { dead = true; if (poll) clearInterval(poll); io?.disconnect() }
  }, [])

  return (
    <main>
      <section className="relative overflow-hidden bg-accent-wash">
        <div className="wrap relative py-7 lg:py-10
          lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,44%)] lg:items-center lg:gap-8">
          <div className="min-w-0">
          <p className="font-body text-ui font-semibold text-accent-ink">The patch</p>
          <RevealLines as="h1"
            className="mt-2 max-w-[22ch] font-display font-bold text-major leading-[1.05] tracking-tight text-ink"
            lines={['A patch that sticks to your arm']}/>
          <ScrollIn className="mt-4">
            <Card className="max-w-[46ch] p-3.5">
              <ul className="m-0 grid list-none gap-1.5 p-0">
                {CHAIN.map(t => (
                  <li key={t} className="flex gap-2.5 text-meta leading-[1.4] text-ink-2">
                    <span aria-hidden
                      className="mt-[0.5em] h-[7px] w-[7px] shrink-0 rounded-chip bg-accent"/>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              {/* The page's one honesty line, verbatim. The drawings repeat it
                  in their own captions; nothing else here does. */}
              <p className="mt-3 border-t border-rule pt-2.5 font-display text-ui font-bold text-ink">
                No unit has been built or worn.
              </p>
            </Card>
            <button type="button" onClick={toModel}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 border-b-2 border-accent/35
                font-display text-ui font-medium text-accent hoverOnly:border-accent hoverOnly:text-accent-ink">
              {down ? 'See the three parts' : 'Turn the 3D model'}<ChevronDown/>
            </button>
          </ScrollIn>
          </div>

          <figure className="m-0 mt-6 lg:mt-0">
            <Parallax2D distance={52}>
              <div className="h-[240px] overflow-hidden rounded-panel border border-rule
                sm:mx-auto sm:h-[340px] sm:max-w-[600px] lg:h-[380px] lg:max-w-none">
                <Frame photo="patch-worn" alt={ARM_ALT} eager/>
              </div>
            </Parallax2D>
          </figure>
        </div>
      </section>

      <Section tone="card" tight>
        <SectionHead className="mt-0 max-w-[24ch]">What the patch records</SectionHead>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {RAINBOW.map((s2, i) => (
            <ScrollRow key={s2.id} index={i} className="h-full">
              <Card className="flex h-full flex-col">
                <div className={cn('px-3 py-3 lg:px-4', SIGNAL_GROUND[i] || 'bg-aqua')}>
                  <SignalTrace kind={s2.id} className="h-12"/>
                </div>
                <dl className="m-0 px-3 pb-3 pt-2 lg:px-4 lg:pb-3.5">
                  <dt className="font-display text-ui font-bold text-ink">{s2.name}</dt>
                  <dd className="m-0 mt-1 max-w-[26ch] text-fine text-ink-2">{s2.short}</dd>
                </dl>
              </Card>
            </ScrollRow>
          ))}
        </div>
      </Section>

      <Section tone="card" tight className="bg-aqua-2">
        <SectionHead className="mt-0 max-w-[26ch]">What is inside</SectionHead>
        <div className="mt-4 grid gap-3 lg:mt-5
          lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)] lg:items-start lg:gap-4">
          <Parallax2D distance={28} className="min-w-0">
            <Card className="min-w-0 p-3.5 lg:p-5">
              <PatchStack/>
            </Card>
          </Parallax2D>

          <ScrollIn className="lg:sticky lg:top-24">
          <Card className="p-3.5 lg:p-4">
            <h3 className="font-display text-row font-bold leading-tight text-ink">
              Decided so far
            </h3>
            <dl className="m-0 mt-2.5 grid grid-cols-2 gap-x-4 lg:grid-cols-1">
              {FIGURES.map(f => (
                <div key={f.k}
                  className="flex items-baseline gap-3 border-t border-rule py-1.5
                    first:border-t-0 lg:[&:nth-child(2)]:border-t">
                  <dt className="min-w-0 flex-1 text-fine text-ink-2">{f.k}</dt>
                  <dd className="m-0 shrink-0 text-row font-bold tabular-nums text-ink">
                    {f.v}
                    <span className="ml-1.5 font-body text-fine font-normal text-ink-3">{f.u}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 border-t border-rule pt-2.5">
              <p className="text-fine font-semibold text-ink-3">Not decided yet</p>
              <ul className="m-0 mt-1.5 flex list-none flex-wrap gap-1.5 p-0">
                {OPEN.map(o => (
                  <li key={o} className="rounded-field border border-rule bg-paper px-2.5 py-[3px]
                    text-fine text-ink-2">
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
          </ScrollIn>
        </div>
      </Section>

      <section ref={band} id="model" data-anchor
        className="border-t border-rule bg-paper">
        <div className="wrap py-8 lg:py-12">
          <SectionHead className="mt-0 max-w-[26ch]">Take the patch apart</SectionHead>
          <div className={cn('mt-4 grid gap-4 lg:mt-6 lg:gap-6',
            !down && 'lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:items-stretch')}>
            <figure className="m-0 min-w-0">
              {down ? (
                /* The drawing's layer table is already open in full above. */
                <Card className="p-3.5 lg:p-5">
                  <PatchStack className="[&>dl]:hidden [&>p]:hidden"/>
                </Card>
              ) : (
                <div ref={stage}>
                  <PatchArena ref={model} onPlay={() => setPicked(null)} onShowAll={() => setPicked(null)}
                    beside={<ExplodedStack caption="" className="h-[190px] lg:h-full lg:min-h-[240px]"/>}/>
                </div>
              )}
              {/* Only the fallback needs a caption: the hero states once that
                  no unit exists, and the drawing's own caption repeats it. */}
              {down && (
                <figcaption className="mt-2.5 max-w-[70ch] text-fine text-ink-3">
                  This browser cannot show the 3D model, so the drawing stands in.
                </figcaption>
              )}
            </figure>

            <ol className={cn('m-0 grid list-none gap-3 p-0 lg:gap-2.5',
              down ? 'sm:grid-cols-3 lg:gap-4'
                   : 'lg:h-full lg:grid-rows-[repeat(3,minmax(min-content,1fr))]')}>
              {LAYERS.map((l, idx) => {
                const on = !down && picked === l.part
                /* bg-ink panel: the part strokes are drawn for a dark plate.
                   `[&_svg]:h-full` outranks the svg's own height at lg. */
                const body = (
                  <>
                    <div className="bg-ink px-3 py-2.5
                      lg:h-[clamp(44px,5.6vh,56px)] lg:py-2 lg:[&_svg]:h-full">
                      {PART_ART[l.part]}</div>
                    <div className="p-3.5 lg:p-3">
                      <h3 className="font-display text-row font-bold leading-tight text-ink
                        lg:text-ui">
                        {l.title}</h3>
                      <p className="mt-1 text-fine text-ink-2">{PART_LINE[l.part]}</p>
                      {!down && (
                        <span className="mt-1.5 block text-fine font-bold text-accent lg:mt-1">
                          {on ? 'Showing only this part' : 'Show only this part'}</span>
                      )}
                    </div>
                  </>
                )
                return (
                  <ScrollRow as="li" key={l.i} index={idx} className="lg:h-full">
                    {down ? (
                      <Card>{body}</Card>
                    ) : (
                      <Card interactive as="button" aria-pressed={on}
                        onClick={() => setPicked(on ? null : l.part)}
                        className={cn('lg:h-full', on && 'border-l-accent')}>
                        {body}
                      </Card>
                    )}
                  </ScrollRow>
                )
              })}
            </ol>
          </div>
        </div>
      </section>
    </main>
  )
}
