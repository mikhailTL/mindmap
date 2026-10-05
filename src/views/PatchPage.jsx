import React from 'react'
import { Label } from '../ui/misc'
import { LAYERS, ExplodedStack } from './Patch'
import { PatchArena } from '../charts/arena'
import { RevealLines, ScrollIn, ScrollRow } from '../s21/motion'
import { Card } from '@/ui/card'
import { SignalTrace } from '../charts/infographics'
import { RAINBOW } from '../lib/sensors'
import { ChevronDown } from '../ui/marks'
import { cn } from '../lib/utils'

/* The page's three part cards map onto the model's own assemblies. */
const GROUP = { pod: 'Upper shell', pcb: 'PCB assembly', base: 'Skin carrier' }

export function PatchPage() {
  const [picked, setPicked] = React.useState(null)
  const model = React.useRef(null)
  const band = React.useRef(null)

  /* scrollTo rather than scrollIntoView, and the offset read off the element
     rather than written here: scrollIntoView silently does nothing in more
     than one engine once smooth behaviour is inherited from html, and a jump
     link that sometimes does nothing is worse than no jump link. No behavior
     option, so the site's own scroll-behavior rule decides — and that rule is
     already cancelled under prefers-reduced-motion. data-anchor on the target
     is what supplies the offset that keeps the band clear of the sticky
     header, so the number lives in one place for the whole site. */
  const toModel = React.useCallback(() => {
    const el = band.current
    if (!el) return
    const clear = parseFloat(getComputedStyle(el).scrollMarginTop) || 0
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - clear })
  }, [])

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
            className="mt-3 max-w-[22ch] font-display font-bold text-major leading-[1.05] tracking-tight text-ink"
            lines={['A sticker-sized', 'patch for the forearm.']}/>
          <ScrollIn className="mt-4">
            <p className="max-w-[46ch] text-lead leading-[1.5] text-ink-2">
              A sticker you wear on your upper arm, under a sleeve. It reads four things off the
              skin once a second and sends them to your phone over Bluetooth, where the app turns
              a whole day of them into one score.
            </p>
            {/* What you can DO here, said inside the first screen rather than
                discovered nine hundred pixels down. The page's one interactive
                object is a 3D model on a dark band below the fold, and nothing
                above the fold admitted it existed. A real button, so it is in
                the tab order and takes the site's focus ring, and the scroll
                itself is left to the site's own rule so it stops animating
                when the reader has asked for stillness. */}
            <button type="button" onClick={toModel}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 border-b-2 border-accent/35
                font-display text-ui font-medium text-accent hover:border-accent hover:text-accent-ink">
              Turn the 3D model<ChevronDown/>
            </button>
          </ScrollIn>

          {/* Plain words before the engineering labels. Two testers hit
              EDA / PPG / nRF52840 first and stopped reading.

              Sweat used to take the full width with a 56px trace and the other
              three sat in a row beneath it. That weighting is gone: one signal
              with a hero chart read as the feature and the other three as its
              footnotes, when the reading is all four together and none of them
              means anything alone. Four equal tiles, one row, a 44px trace
              each — the row of metric tiles a product app opens with, and it
              costs the page a whole band of height.

              The signal's own colour is the card's leading rule, the same mark
              the tiles elsewhere use. Each tile is its own <dl> so the
              term/definition reading survives the grid. h-full is on both
              wrappers because equal height is now the point: an uneven row of
              four reads as four unrelated cards, not one reading. */}
          <div className="mt-6 grid grid-cols-2 gap-3 lg:mt-7 lg:grid-cols-4 lg:gap-4">
            {RAINBOW.map((s2, i) => (
              <ScrollRow key={s2.id} index={i} className="h-full">
                <Card className="flex h-full flex-col border-l-[3px]" style={{ borderLeftColor: s2.glow }}>
                  <div className="bg-mist/70 px-3 py-2.5 lg:px-4">
                    <SignalTrace kind={s2.id} className="h-11"/>
                  </div>
                  <dl className="m-0 px-3 pb-3.5 pt-2.5 lg:px-4 lg:pb-4">
                    <dt className="font-display text-row font-bold text-ink">{s2.name}</dt>
                    {/* text-meta, not text-sec: two of these lines run to three
                        rows in a 170px phone column and the tile is a label,
                        not a paragraph. The full note on each signal, the
                        0.35 g movement threshold included, is on the signal
                        pages where a reader has asked for it. */}
                    <dd className="m-0 mt-1 max-w-[26ch] text-meta text-ink-2">{s2.short}</dd>
                  </dl>
                </Card>
              </ScrollRow>
            ))}
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
      <section ref={band} id="model" data-anchor className="border-b border-rule bg-ink text-paper">
        <div className="wrap py-9 lg:py-12">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:items-start lg:gap-8">
            <figure className="m-0 min-w-0">
              {/* The drawing goes INTO the viewer's card rather than beside it
                  as a second figure at the same scale. One composition, one
                  edge, one caption under the pair. */}
              <PatchArena ref={model} onPlay={() => setPicked(null)} onShowAll={() => setPicked(null)}
                beside={<ExplodedStack caption="" className="h-[190px] lg:h-full lg:min-h-[240px]"/>}/>
              <figcaption className="mt-3 max-w-[70ch] text-meta text-mist">
                Turn the model to see the patch from any angle, or cut it open. The flat drawing
                beside it names the same three layers. Nothing here is a photograph: no unit has
                been built yet, so every dimension on this page comes from the CAD.
              </figcaption>
            </figure>

            {/* The three toggles, as a rail. `.mark` rules in ink and colours
                its label ink-2, both of which disappear on this band, so the
                heading is written out here in the band's own two values. */}
            <div className="min-w-0">
              {/* Sized as what it is: a heading one level under the page
                  title, not a caption. The review could not tell whether this
                  was a new section or a part of the one above it, and at
                  caption size it could have been either. */}
              <h3 className="font-display text-head font-bold leading-tight text-accent-lit">
                The three parts of a patch</h3>
              <p className="mt-2 text-sec text-mist">Tap one to see it on its own.</p>
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
