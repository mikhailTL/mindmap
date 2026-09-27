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
        <div className="wrap relative py-10 lg:py-14">
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
          <ScrollIn className="mt-5">
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
          <div className="mt-8 grid gap-x-6 gap-y-5 lg:grid-cols-3">
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

          {/* One figure, two halves of it. The drawing and the model were a
              drawing beside a boxed widget: the model sat in a white card with
              its own heading, its own sidebar and its own frame, which is what
              read as an embed. The card is gone, the viewer's own furniture is
              hidden in arena.jsx, and both halves now stand on the band's own
              ground under one caption.

              The drawing keeps the narrower column because the model is the
              half you operate. Both came down in height: the two of them used
              to run past a laptop's screen on their own. */}
          <figure className="mt-8 m-0 grid items-center gap-7 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-10">
            {/* The column is wider than the old 360px because the drawing was
                coming out at 268px beside a 350px model. ExplodedStack's own 84%
                is the widest the rotated sheet can be without its corners
                crossing the clip on its container, so the width has to come
                from the column rather than from `size`. */}
            <ExplodedStack caption="" className="h-[min(30vh,260px)] lg:h-[min(36vh,320px)]"/>

            {/* No height here: the viewer sets the one its own framing needs. */}
            <div className="min-w-0">
              <PatchArena ref={model} onPlay={() => setPicked(null)}/>
            </div>

            <figcaption className="max-w-[72ch] text-meta text-ink-3 lg:col-span-2">
              The drawing names what each layer does. The model is the same patch, turnable and
              sectionable. No assembled unit has been photographed yet, and no figure on this page
              was measured from one.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Was py-20, which put 80px of empty paper between the band's border and
          a heading with three cards under it. Same step as the band above. */}
      <section className="wrap py-10 lg:py-14">
        {/* "Three layers" counted the list without saying what the list was
            of. */}
        <h2 className="mark">The three parts of a patch</h2>
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
                  className={cn('grid h-full items-start gap-4 p-5',
                    on && 'border-l-accent bg-mist/60')}>
                  <div>
                    <h3 className="font-display text-row font-bold text-ink">{l.title}</h3>
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
