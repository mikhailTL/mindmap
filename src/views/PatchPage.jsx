import React from 'react'
import { Label } from '../ui/misc'
import { LAYERS, ExplodedStack } from './Patch'
import { PatchArena } from '../charts/arena'
import { RevealLines, ScrollIn, ScrollRow } from '../s21/motion'
import { Card } from '@/ui/card'
import { SignalTrace } from '../charts/infographics'
import { RAINBOW } from '../lib/sensors'
import { cn } from '../lib/utils'

/* The page's three part cards map onto the model's own assemblies. */
const GROUP = { pod: 'Upper shell', pcb: 'PCB assembly', base: 'Skin carrier' }

export function PatchPage() {
  const [picked, setPicked] = React.useState(null)
  const model = React.useRef(null)

  /* "Show only this" drives the model rather than a copy of it. */
  React.useEffect(() => {
    if (picked) model.current?.isolateGroup(GROUP[picked])
    else model.current?.showAll()
  }, [picked])

  /* The drawing separates along its own axis and tips as the section scrolls.
     Without this the three sheets sit flat on top of one another. */
  React.useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const layers = Array.from(document.querySelectorAll('.lyr'))
    const Z = { '0': 128, '1': 20, '2': -88 }
    if (reduce || !window.gsap) {
      layers.forEach(l => { l.style.transform = `translateZ(${Z[l.dataset.i]}px)` })
      return
    }
    layers.forEach(l => gsap.set(l, { z: Z[l.dataset.i] }))
    if (!window.ScrollTrigger) return
    const t = gsap.fromTo('#stack', { rotateX: 66, rotateZ: -40 },
      { rotateX: 50, rotateZ: -22, ease: 'none',
        scrollTrigger: { trigger: '#stack', start: 'top bottom', end: 'bottom top', scrub: .6 } })
    return () => { t.scrollTrigger?.kill(); t.kill() }
  }, [])
  return (
    <main>
      {/* A dot grid sat over this band at 70%. It was texture standing in for
          hierarchy, and the palette rebuild left the band reading as itself. */}
      <section className="relative overflow-hidden border-b border-rule bg-mist">
        {/* Was py-20, a page-region step at both edges: 160px of nothing on a
            band that already opens with a label, a heading and a paragraph.
            This is Section's own padding, which is the site's default break and
            the one the review's "filled with nothing" was measured against. */}
        <div className="wrap relative py-9 lg:py-12">
          <Label>The patch</Label>
          {/* "What the patch measures." named the section but not the object, so
              a reader who landed here first still did not know what a patch is.
              The heading states the thing; the paragraph states what it does.
              The measure widens from 18ch because the longer line needs it, and
              the break falls after "sticker-sized" so a 390px column cannot
              hyphen-break that word across two lines. */}
          <RevealLines as="h1"
            className="mt-3 max-w-[22ch] font-display font-bold text-sect leading-[1.05] tracking-tight text-ink"
            lines={['A sticker-sized', 'patch for the forearm.']}/>
          <ScrollIn className="mt-4">
            <p className="max-w-[46ch] text-lead leading-[1.5] text-ink-2">
              It reads four signals off the skin once a second and sends them to the phone: heart,
              sweat, skin temperature and movement. One patch is worn for a week.
            </p>
          </ScrollIn>

          {/* Plain words before the engineering labels. Two testers hit
              EDA / PPG / nRF52840 first and stopped reading.

              Four equal tiles said the four signals were interchangeable and
              they are not. Sweat is the one that moves first, so it gets the
              width and the long trace; movement is the one that disqualifies a
              reading, so it carries its own threshold inline; heart and
              temperature are a pair and sit as a pair. That weighting survives
              the swap below.

              What changed: these were bordered divs hung off a hand-written
              top rule, which is a card drawn by hand — they are the sourced
              Card now. The signal's own colour moved from a 10px dot to the
              card's left rule, where it is the same mark the tiles elsewhere
              use; the dot went, because the rule already says it. Each pair is
              its own <dl> so the term/definition reading is kept inside the
              card rather than lost to the grid. */}
          {/* Placement is explicit per signal, because RAINBOW runs heart-first
              and auto-placement therefore gave heart the lead position.

              Sweat is the one that moves first, so it takes the full width and
              the long trace; the other three sit as a row of equals beneath it.
              This was a 3x2 grid with sweat and movement each spanning both
              rows, which gave those two ~400px cards holding ~130px of text
              over an empty field — and stretching the trace to fill the void
              only distorted the waveform it exists to show. */}
          <div className="mt-6 grid gap-x-4 gap-y-4 lg:grid-cols-3">
            {RAINBOW.map((s2, i) => {
              const lead = s2.id === 'sweat'
              const place = {
                sweat: 'lg:col-start-1 lg:col-span-3 lg:row-start-1',
                heart: 'lg:col-start-1 lg:row-start-2',
                temp:  'lg:col-start-2 lg:row-start-2',
                move:  'lg:col-start-3 lg:row-start-2',
              }[s2.id]
              return (
                /* No h-full on either: stretching the row to the tallest card
                   left the two short ones holding eighty pixels of nothing
                   under two lines of text. They end where their text ends. */
                <ScrollRow key={s2.id} index={i} className={place}>
                  <Card className="flex flex-col border-l-[3px]" style={{ borderLeftColor: s2.glow }}>
                    <div className={cn('bg-mist/70 px-4', lead ? 'py-5' : 'py-3')}>
                      <SignalTrace kind={s2.id} className={lead ? 'h-14' : undefined}/>
                    </div>
                    <dl className="m-0 px-4 pb-4 pt-3">
                      <dt className={cn('flex items-baseline gap-2.5 font-display font-bold text-ink',
                        lead ? 'text-head' : 'text-row')}>
                        {s2.name}
                        {lead && <span className="font-body text-note font-normal italic text-ink-3">
                          first to move</span>}
                      </dt>
                      <dd className={cn('m-0 mt-1.5 text-sec text-ink-2',
                        lead ? 'max-w-[40ch]' : 'max-w-[28ch]')}>
                        {s2.short}
                        {s2.id === 'move' && (
                          <span className="mt-2 block border-l-2 border-ink-3 pl-3 text-note text-ink-3">
                            Above <span className="font-mono tabular-nums">0.35 g</span> the score is held
                            back rather than counted as stress.
                          </span>
                        )}
                      </dd>
                    </dl>
                  </Card>
                </ScrollRow>
              )
            })}
          </div>

        </div>
      </section>

      {/* The dark band, used once. Two near-white bands in a row separate by
          about 2% in luminance, which is not a separation a reader notices,
          and the review asked for real shade between sections. This is where
          it belongs: the model is the thing on this page worth stopping at,
          and an inverted band puts a white card and a white shell on a ground
          that is nothing like either.

          It also absorbs the section that used to follow. "The three parts"
          was a third full band of its own, under a figure the reader had
          already scrolled past, driving a model no longer on screen. As a rail
          beside the figure the toggles point at something visible, and the
          page loses a band. */}
      <section className="border-b border-rule bg-ink text-paper">
        <div className="wrap py-9 lg:py-12">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:items-start lg:gap-8">
            <figure className="m-0 min-w-0">
              {/* The drawing goes INTO the viewer's card rather than beside it
                  as a second figure at the same scale. One composition, one
                  edge, one caption under the pair. */}
              <PatchArena ref={model} onPlay={() => setPicked(null)}
                beside={<ExplodedStack caption="" className="h-[190px] lg:h-full lg:min-h-[240px]"/>}/>
              <figcaption className="mt-3 max-w-[70ch] text-meta text-mist">
                The drawing names what each layer does. The model is the same patch, turnable and
                sectionable. No assembled unit has been photographed yet, and no figure on this page
                was measured from one.
              </figcaption>
            </figure>

            {/* The three toggles, as a rail. `.mark` rules in ink and colours
                its label ink-2, both of which disappear on this band, so the
                heading is written out here in the band's own two values. */}
            <div className="min-w-0">
              <h2 className="block rounded-none border-t border-mist pt-3 font-display text-tick
                font-bold text-accent-lit">The three parts of a patch</h2>
              <p className="mt-2 text-sec text-mist">Pick one to see it alone in the model.</p>
              <ol className="mt-4 grid list-none gap-3 p-0">
                {LAYERS.map(l => {
                  const on = picked === l.part
                  return (
                    <li key={l.i}>
                      <Card interactive as="button" aria-pressed={on}
                        onClick={() => setPicked(on ? null : l.part)}
                        className={cn('grid items-start gap-4 p-4', on && 'border-l-accent bg-mist/60')}>
                        <div>
                          <h3 className="font-display text-row font-bold text-ink">{l.title}</h3>
                          <p className="mt-1.5 text-sec text-ink-2">{l.body}</p>
                          <span className="mt-2 block text-tick font-bold text-accent">
                            {on ? 'Showing only this' : 'Show only this'}</span>
                        </div>
                      </Card>
                    </li>
                  )
                })}
              </ol>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
