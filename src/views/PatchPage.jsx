import React from 'react'
import { PHOTOS } from '../lib/photos'
import { LAYERS, ExplodedStack } from './Patch'
import { PatchArena } from '../charts/arena'
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

/* Claims here are limited to what the build is. Adhesive wear life and
   time-worn are undecided and no unit has been worn, so no figure for either
   may be added. */
const CHAIN = [
  'Upper arm, under a sleeve.',
  'Four signals, once a second.',
  'Bluetooth to your phone.',
  `One ${SCORE} a day, ${SCORE_RANGE}.`,
]

export function PatchPage() {
  const [picked, setPicked] = React.useState(null)
  const model = React.useRef(null)
  const band = React.useRef(null)

  /* scrollTo, not scrollIntoView: scrollIntoView silently no-ops in more than
     one engine when smooth behaviour is inherited from html. No `behavior`
     option is passed, so the site's scroll-behavior rule applies and is
     already cancelled under prefers-reduced-motion. The sticky-header offset
     is read from the target's scroll-margin-top (data-anchor), not hardcoded. */
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

  return (
    <main>
      {/* No border-b: the <Section> below supplies border-t, and two meeting
          hairlines render as a 2px rule. */}
      <section className="relative overflow-hidden bg-mist">
        <div className="wrap relative py-9 lg:py-12
          lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,40%)] lg:items-center lg:gap-10">
          <div className="min-w-0">
          <p className="font-mono text-row font-bold tracking-[0.005em] text-accent">The patch</p>
          {/* The line break is explicit so a 390px column cannot hyphen-break
              "sticker-sized" across two lines. */}
          <RevealLines as="h1"
            className="mt-3 max-w-[22ch] font-display font-bold text-major leading-[1.05] tracking-tight text-ink"
            lines={['A sticker-sized', 'patch for the upper arm.']}/>
          <ScrollIn className="mt-4">
            <ul className="m-0 grid max-w-[46ch] list-none gap-2 p-0">
              {CHAIN.map(t => (
                <li key={t} className="flex gap-2.5 text-body leading-[1.45] text-ink-2">
                  {/* accent on mist is 4.85:1, over the 3:1 a non-text mark
                      needs; aria-hidden so the dots are not read out. */}
                  <span aria-hidden
                    className="mt-[0.52em] h-[7px] w-[7px] shrink-0 rounded-chip bg-accent"/>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 max-w-[46ch] text-meta text-ink-3">
              How long one adhesive lasts is not settled. No unit has been worn yet.
            </p>
            {/* A real <button>, not an anchor or a div: it must be in the tab
                order and take the site's focus ring. */}
            <button type="button" onClick={toModel}
              className="mt-5 inline-flex min-h-[44px] items-center gap-2 border-b-2 border-accent/35
                font-display text-ui font-medium text-accent hoverOnly:border-accent hoverOnly:text-accent-ink">
              Turn the 3D model<ChevronDown/>
            </button>
          </ScrollIn>
          </div>

          {/* No caption: the figcaption in the model band below already states
              that no unit has been built. Saying it twice reads as a
              disclaimer. Alt text carries the content.

              Parallax travel is 52px — a transform only, and under this band's
              vertical padding, so it changes no layout and cannot reach the
              edge. Raising it can. */}
          <figure className="m-0 mt-8 lg:mt-0">
            <Parallax2D distance={52}>
              <img src={PHOTOS['patch-worn']} width="1024" height="688" loading="eager"
                decoding="async"
                alt="A teenager in a school gym with the MindMap patch on his upper arm"
                className="h-[230px] w-full rounded-panel object-cover sm:h-[300px] lg:h-[340px]"/>
            </Parallax2D>
          </figure>
        </div>
      </section>

      {/* Plain-language names only; EDA / PPG / nRF52840 belong on the signal
          pages. */}
      <Section tone="card" tight className="bg-aqua-2">
        <SectionHead className="mt-0 max-w-[24ch]">Four signals off the skin</SectionHead>
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {RAINBOW.map((s2, i) => (
            <ScrollRow key={s2.id} index={i} className="h-full">
              <Card className="flex h-full flex-col border-l-[3px]" style={{ borderLeftColor: s2.glow }}>
                <div className="bg-mist/70 px-3 py-2.5 lg:px-4">
                  <SignalTrace kind={s2.id} className="h-11"/>
                </div>
                <dl className="m-0 px-3 pb-3.5 pt-2.5 lg:px-4 lg:pb-4">
                  <dt className="font-display text-row font-bold text-ink">{s2.name}</dt>
                  {/* text-meta, not text-sec: two of these run to three rows in
                      a 170px phone column. Full per-signal detail, including
                      the 0.35 g movement threshold, lives on the signal
                      pages. */}
                  <dd className="m-0 mt-1 max-w-[26ch] text-meta text-ink-2">{s2.short}</dd>
                </dl>
              </Card>
            </ScrollRow>
          ))}
        </div>
      </Section>

      {/* The isolate toggles must stay beside the model, not under it. */}
      <section ref={band} id="model" data-anchor
        className="border-t border-rule bg-ink text-paper">
        <div className="wrap py-10 lg:py-16">
          <SectionHead tone="ink" className="mt-0 max-w-[26ch]">
            The three parts of a patch
          </SectionHead>
          {/* items-stretch: the rail's lg:h-full sizes from the figure. */}
          <div className="mt-6 grid gap-6 lg:mt-9
            lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:items-stretch lg:gap-8">
            <figure className="m-0 min-w-0">
              <PatchArena ref={model} onPlay={() => setPicked(null)} onShowAll={() => setPicked(null)}
                beside={<ExplodedStack caption="" className="h-[190px] lg:h-full lg:min-h-[240px]"/>}/>
              <figcaption className="mt-3 max-w-[70ch] text-meta text-mist">
                No unit has been built, so nothing here is a photograph.
              </figcaption>
            </figure>

            {/* At lg the rail takes the figure's height and the three rows
                share it. The row floor is min-content, not 0: a bare 1fr row
                shrinks past its own text and clips it. Below lg the cards are
                full width and none of this applies. */}
            <ol className="m-0 grid list-none gap-3 p-0
              lg:h-full lg:gap-2.5 lg:grid-rows-[repeat(3,minmax(min-content,1fr))]">
              {LAYERS.map(l => {
                const on = picked === l.part
                return (
                  <li key={l.i}>
                    <Card interactive as="button" aria-pressed={on}
                      onClick={() => setPicked(on ? null : l.part)}
                      className={cn('lg:h-full', on && 'border-l-accent')}>
                      {/* bg-ink panel inside a white card: the drawing's strokes
                          are mist and accent.lit, which both disappear on
                          white. On ink they measure 12.69 and 7.67.

                          The svg carries its own h-[76px] (88px at sm) from
                          charts/patch-parts, so a height on this panel alone
                          will not resize it at lg. `[&_svg]:h-full` is a
                          class-plus-type selector and wins on specificity.
                          Keep it a descendant selector — the svg sits inside
                          its own perspective box — and keep the matching
                          h-full in charts/patch-parts. */}
                      <div className="bg-ink px-3 py-3
                        lg:h-[clamp(44px,5.6vh,56px)] lg:py-2 lg:[&_svg]:h-full">
                        {PART_ART[l.part]}</div>
                      <div className="p-4 lg:p-3">
                        <h3 className="font-display text-head font-bold leading-tight text-ink
                          lg:text-row">
                          {l.title}</h3>
                        <p className="mt-1.5 text-sec text-ink-2 lg:mt-1 lg:text-fine">{l.body}</p>
                        <span className="mt-2 block text-tick font-bold text-accent lg:mt-1">
                          {on ? 'Showing only this' : 'Show only this'}</span>
                      </div>
                    </Card>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </section>
    </main>
  )
}
