import React from 'react'
import { Button } from '../ui/button'
import { Label } from '../ui/misc'
import { LAYERS, ExplodedStack } from './Patch'
import { PatchCAD } from '../charts/cad'
import { RevealLines, ScrollIn, ScrollRow } from '../s21/motion'
import { Card } from '@/ui/card'
import { SignalTrace } from '../charts/infographics'
import { RAINBOW } from '../lib/sensors'
import { cn } from '../lib/utils'

const CAD_SRC = (globalThis.__CAD || '/MindMap-Patch-colored.glb')

export function PatchPage() {
  const [exploded, setExploded] = React.useState(false)
  const [picked, setPicked] = React.useState(null)

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
        {/* Was py-12 sm:py-16. Vertical rhythm is three fixed steps now — 10
            inside a section, 14 between sections, 20 between page regions — so
            the same kind of break is the same size everywhere. This band is a
            whole page region. */}
        <div className="wrap relative py-20">
          <Label>The patch</Label>
          {/* "What the patch measures." named the section but not the object, so
              a reader who landed here first still did not know what a patch is.
              The heading states the thing; the paragraph states what it does.
              The measure widens from 18ch because the longer line needs it, and
              the break falls after "sticker-sized" so a 390px column cannot
              hyphen-break that word across two lines. */}
          <RevealLines as="h1"
            className="mt-3 max-w-[22ch] font-display font-medium text-sect leading-[1.05] tracking-tight text-ink"
            lines={['A sticker-sized', 'patch for the forearm.']}/>
          <ScrollIn className="mt-5">
            <p className="max-w-[46ch] text-lead leading-[1.5] text-ink-2">
              It reads four signals off the skin — heart, sweat, skin temperature and movement —
              once a second, and sends them to the phone. One patch is worn for a week.
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
          <div className="mt-10 grid gap-x-10 gap-y-8 lg:grid-cols-3">
            {RAINBOW.map((s2, i) => {
              const lead = s2.id === 'sweat'
              const place = {
                sweat: 'lg:col-start-1 lg:col-span-3 lg:row-start-1',
                heart: 'lg:col-start-1 lg:row-start-2',
                temp:  'lg:col-start-2 lg:row-start-2',
                move:  'lg:col-start-3 lg:row-start-2',
              }[s2.id]
              return (
                <ScrollRow key={s2.id} index={i} className={cn('h-full', place)}>
                  <Card className="flex h-full flex-col border-l-[3px]" style={{ borderLeftColor: s2.glow }}>
                    <div className={cn('bg-mist/70 px-4', lead ? 'py-6' : 'py-4')}>
                      <SignalTrace kind={s2.id} className={lead ? 'h-16' : undefined}/>
                    </div>
                    <dl className="m-0 px-5 pb-5 pt-4">
                      <dt className={cn('flex items-baseline gap-2.5 font-display font-medium text-ink',
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

          <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:gap-12">
            <ExplodedStack className="h-[min(46vh,420px)]"/>

            <div className="relative h-[min(46vh,420px)] border-t-2 border-ink bg-card">
              <PatchCAD src={CAD_SRC} scrollSpin exploded={exploded} selected={picked} onSelect={setPicked}/>
              {/* It was labelled "the real model", which a reviewer read as a
                  photograph of a built unit. It is our own CAD, and it is the
                  enclosure only. */}
              <span className="note pointer-events-none absolute inset-x-0 bottom-3 text-center">
                CAD model · drag to turn</span>
              <div className="absolute right-3 top-3">
                <Button variant={exploded ? 'solid' : 'outline'} size="sm"
                  aria-pressed={exploded} onClick={() => setExploded(v => !v)}>
                  {exploded ? 'Put back together' : 'Take apart'}
                </Button>
              </div>
            </div>
          </div>
          <p className="mt-4 max-w-[68ch] text-meta text-ink-3">
            Left: the drawing, showing what each layer does. Right: our CAD — the file the enclosure is
            printed from. No photograph of an assembled unit exists yet, and no figure on this page was
            measured from one.</p>
        </div>
      </section>

      {/* Was pb-14 sm:pb-20 with no top padding at all, so the heading sat on
          the band's border. One page-region step, both edges. */}
      <section className="wrap py-20">
        {/* "Three layers" counted the list without saying what the list was
            of. */}
        <h2 className="mark">The three parts a patch is made of</h2>
        <p className="mt-2 max-w-[56ch] text-sec text-ink-2">Pick one to see it alone in the model.</p>
        {/* Three hand-built toggles, each re-declaring its own border, hover and
            pressed rule. They are the sourced Card in its `interactive` form
            now; the only thing the page still owns is the selected state, which
            holds the left rule at accent so a pressed toggle does not look the
            same as a hovered one. aria-pressed and the handler are unchanged. */}
        <ol className="mt-4 grid list-none gap-4 p-0 lg:grid-cols-3">
          {LAYERS.map(l => {
            const on = picked === l.part
            return (
              <li key={l.i} className="h-full">
                <Card interactive as="button" aria-pressed={on}
                  onClick={() => setPicked(on ? null : l.part)}
                  className={cn('grid h-full grid-cols-[36px_1fr] items-start gap-4 p-5',
                    on && 'border-l-accent bg-mist/60')}>
                  <span className="pt-1.5 font-mono text-tick text-ink-3">0{l.i + 1}</span>
                  <div>
                    <h3 className="font-display text-row font-medium text-ink">{l.title}</h3>
                    <p className="mt-1.5 text-sec text-ink-2">{l.body}</p>
                    <span className="mt-2 block font-mono text-tick text-accent">
                      {on ? 'Showing only this' : 'Show only this'}</span>
                  </div>
                </Card>
              </li>
            )
          })}
        </ol>
      </section>
    </main>
  )
}
