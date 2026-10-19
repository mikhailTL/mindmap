import React from 'react'
import { Frame } from '../ui/frame'
import { LAYERS, ExplodedStack } from './Patch'
import { PatchArena } from '../charts/arena'
import { PatchStack } from '../charts/patchstack'
import { Parallax2D, ScrollIn, ScrollRow } from '../ui/motion'
import { Card, cardInk } from '@/ui/card'
import { SignalTrace } from '../charts/infographics'
import { RAINBOW } from '../lib/sensors'
import { cn } from '../lib/utils'
import { Section, SectionHead } from '../ui/section'
import { PART_ART } from '../charts/patch-parts'
import { SCORE, SCORE_RANGE } from '../lib/terms'
import { TONES, glowShadow, MICRO } from '../ui/scenes/tones'
import { contourPath } from '../ui/scenes/kit'

/* Values must match the assembly names in the GLB, or isolateGroup no-ops. */
const GROUP = { pod: 'Upper shell', pcb: 'PCB assembly', base: 'Skin carrier' }

/* The hero frame is a licensed stock photograph with a drawing of the
   oval placed on it. */
const ARM_ALT = 'A licensed stock photograph of a teenager in a school gym, with a drawing '
  + 'of the patch placed on the outer upper arm to show where it sits.'

/* Each signal's card takes its own trace's hue as a wash (src/ui/card.jsx),
   in the rainbow's order: heart, sweat, temperature, movement. */
const SIGNAL_HUE = ['coral', 'sun', 'mint', 'sky']

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

/* Light grounds (owner, 19 October: "stop making things dark, site should be
   more peaceful and light", keep the topographic and technical designs). The
   part strips are the scenes' mint sky under a fine turquoise grid; the
   drawings on them are measured in charts/patch-parts.jsx. */
const M = TONES.mint
const GRID = 'linear-gradient(rgb(29 143 176 / .08) 1px, transparent 1px), '
  + 'linear-gradient(90deg, rgb(29 143 176 / .08) 1px, transparent 1px), '
const STRIP = {
  backgroundImage: GRID + `linear-gradient(90deg, ${M.sky.join(', ')})`,
  backgroundSize: '10px 10px, 10px 10px, auto',
}
/* "Decided so far" is a white card in a fine green to turquoise edge, with
   contour lines in its corner. Measured on white: ink 15.20, ink-2 8.25,
   ink-3 6.11, accent-ink 8.50. */
const SPEC_EDGE = {
  border: '1px solid transparent',
  background: 'linear-gradient(#fff, #fff) padding-box, '
    + 'linear-gradient(135deg, rgb(21 116 70 / .55), rgb(29 143 176 / .4) 55%, #c2d7ca) border-box',
  boxShadow: glowShadow('mint'),
}

function Contours({ className }) {
  return (
    <svg aria-hidden viewBox="0 0 160 120" className={cn('pointer-events-none absolute', className)}>
      <g fill="none" stroke={M.line} strokeOpacity=".55" strokeWidth=".9">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <path key={i} d={contourPath(110, 40, 10 + i * 11, { amp: 1.6 + i * 0.6, phase: i * 0.9 })}/>
        ))}
      </g>
    </svg>
  )
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

/* `as`: the hub (views/PatchHub) draws this inside its own <main>. */
export function PatchPage({ as: Root = 'main' }) {
  const [picked, setPicked] = React.useState(null)
  const [down, setDown] = React.useState(false)
  const model = React.useRef(null)
  const stage = React.useRef(null)

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
    <Root>
      <section id="model" data-anchor
        className="bg-paper">
        {/* The owner, 19 October: the CAD model is the first thing seen on
            the patch page. */}
        <div className="wrap pb-8 pt-4 lg:pb-12 lg:pt-6">
          <SectionHead className="mt-0 max-w-[26ch]">Take the patch apart</SectionHead>
          <div className={cn('mt-4 grid gap-4 lg:mt-6 lg:gap-6',
            !down && 'lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:items-stretch')}>
            <figure className="m-0 min-w-0">
              {down ? (
                /* The drawing's layer table is open in full just below. */
                <Card className="p-3.5 lg:p-5">
                  <PatchStack className="[&>dl]:hidden [&>p]:hidden"/>
                </Card>
              ) : (
                <div ref={stage}>
                  <PatchArena ref={model} onPlay={() => setPicked(null)} onShowAll={() => setPicked(null)}
                    beside={<ExplodedStack caption="" className="h-[190px] lg:h-full lg:min-h-[240px]"/>}/>
                </div>
              )}
              {/* Only the fallback needs a caption. */}
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
                /* A light strip under each drawing (STRIP above).
                   `[&_svg]:h-full` outranks the svg's own height at lg. */
                const body = (
                  <>
                    <div style={STRIP} className="border-b border-rule px-3 py-2.5
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

      <section className="relative overflow-hidden border-t border-rule bg-accent-wash">
        {/* The part's title sits just above, in views/PatchHub. */}
        <div className="wrap relative pb-7 pt-4 lg:pb-10 lg:pt-6
          lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,44%)] lg:items-start lg:gap-8">
          <div className="min-w-0">
          <ScrollIn>
            <Card variant="rule" side="left" className="max-w-[46ch] py-1 pl-3.5">
              <ul className="m-0 grid list-none gap-1.5 p-0">
                {CHAIN.map(t => (
                  <li key={t} className="text-meta leading-[1.4] text-ink-2">{t}</li>
                ))}
              </ul>
            </Card>
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
              <Card variant="tint" hue={SIGNAL_HUE[i]} className="flex h-full flex-col">
                <div className={cn('border-b px-3 py-3 lg:px-4', cardInk('tint', SIGNAL_HUE[i]).line)}>
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

      {/* White, not a wash: a wash opens each part of the page. */}
      <Section tone="card" tight>
        <SectionHead className="mt-0 max-w-[26ch]">What is inside</SectionHead>
        <div className="mt-4 grid gap-3 lg:mt-5
          lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)] lg:items-start lg:gap-4">
          <Parallax2D distance={28} className="min-w-0">
            <Card className="min-w-0 p-3.5 lg:p-5">
              {/* The drawing names every layer; the owner found the notes too wordy. */}
              <PatchStack brief/>
            </Card>
          </Parallax2D>

          <ScrollIn className="lg:sticky lg:top-32">
          <Card style={SPEC_EDGE} className="relative p-3.5 lg:p-4">
            <Contours className="-right-8 -top-6 h-32 w-44"/>
            <h3 className="relative font-display text-row font-bold leading-tight text-ink">
              Decided so far
            </h3>
            <dl className="relative m-0 mt-2.5 grid grid-cols-2 gap-x-4 lg:grid-cols-1">
              {FIGURES.map(f => (
                <div key={f.k}
                  className="flex items-baseline gap-3 border-t border-rule py-1.5
                    first:border-t-0 lg:[&:nth-child(2)]:border-t">
                  <dt className="min-w-0 flex-1 text-fine text-ink-2">{f.k}</dt>
                  <dd className="m-0 shrink-0 text-row font-bold tabular-nums text-ink">
                    {f.v}
                    <span style={{ fontFamily: MICRO }}
                      className="ml-1.5 text-[0.8125rem] font-normal text-ink-3">{f.u}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <div className="relative mt-3 border-t border-rule pt-2.5">
              <p style={{ fontFamily: MICRO }}
                className="flex items-center gap-2 text-[0.8125rem] font-semibold text-accent-ink">
                <span aria-hidden className="h-px w-3 bg-accent"/>Not decided yet</p>
              <ul className="m-0 mt-1.5 flex list-none flex-wrap gap-1.5 p-0">
                {OPEN.map(o => (
                  <li key={o} className="rounded-field border border-dashed border-ruling bg-paper
                    px-2.5 py-[3px] text-fine text-ink-2">
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
          </ScrollIn>
        </div>
      </Section>

    </Root>
  )
}
