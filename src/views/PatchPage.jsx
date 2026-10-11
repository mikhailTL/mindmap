import React from 'react'
import { PHOTOS } from '../lib/photos'
// Label was the page eyebrow here; it is written out now so the mono step is
// visible at the call site rather than hidden behind a shared annotation class.
import { LAYERS, ExplodedStack } from './Patch'
import { PatchArena } from '../charts/arena'
import { Parallax2D, RevealLines, ScrollIn, ScrollRow } from '../s21/motion'
import { Card } from '@/ui/card'
import { SignalTrace } from '../charts/infographics'
import { RAINBOW } from '../lib/sensors'
import { ChevronDown } from '../ui/marks'
import { cn } from '../lib/utils'
import { Section, SectionHead } from '../ui/section'
import { PART_ART } from '../charts/patch-parts'
import { SCORE, SCORE_RANGE } from '../lib/terms'

/* The page's three part cards map onto the model's own assemblies. */
const GROUP = { pod: 'Upper shell', pcb: 'PCB assembly', base: 'Skin carrier' }

/* The hero used to be one 41-word paragraph that stopped at the day's one
   number, and
   the review stopped with it: it reads the signals how, then what does it do.
   Five statements carry the whole chain in fewer words than the paragraph
   carried half of it, and the last two are the half that was missing. Nothing
   here is claimed beyond what the build actually is: how long one adhesive
   lasts has not been decided and no unit has been worn, so no figure for
   either appears. */
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

  /* scrollTo rather than scrollIntoView, and the offset read off the element
     rather than written here: scrollIntoView silently does nothing in more
     than one engine once smooth behaviour is inherited from html, and a jump
     link that sometimes does nothing is worse than no jump link. No behavior
     option, so the site's own scroll-behavior rule decides, and that rule is
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

  /* The GSAP ScrollTrigger that used to live here is gone, and the drawing is
     not static as a result — it animates harder than it did. What stood here
     set a fixed translateZ on every `.lyr` on the page by document query and
     scrubbed `#stack` between rotateX 66/50 and rotateZ -40/-22, which meant
     one figure was driven by a second animation library reaching across two
     files into another component's class names, and the drawing itself carried
     a fixed counter-tilt whose only job was to cancel the angle chosen here.
     ExplodedStack now owns all of it through the site's own ScrollScene, with
     a wider tip and its three sheets separating in depth as they pass, so this
     page has nothing to set up and the site has one scroll mechanism instead
     of two. See views/Patch.jsx for the numbers. */
  return (
    <main>
      {/* A dot grid sat over this band at 70%. It was texture standing in for
          hierarchy, and the palette rebuild left the band reading as itself.

          The border-b is gone: the band under it is a <Section>, which brings
          its own border-t, and two hairlines meeting read as a 2px rule
          nobody drew. */}
      <section className="relative overflow-hidden bg-mist">
        <div className="wrap relative py-9 lg:py-12
          lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,40%)] lg:items-center lg:gap-10">
          <div className="min-w-0">
          <p className="font-mono text-row font-bold tracking-[0.005em] text-accent">The patch</p>
          {/* "What the patch measures." named the section but not the object, so
              a reader who landed here first still did not know what a patch is.
              The heading states the thing; the list under it states the chain.
              The measure widens from 18ch because the longer line needs it, and
              the break falls after "sticker-sized" so a 390px column cannot
              hyphen-break that word across two lines. */}
          <RevealLines as="h1"
            className="mt-3 max-w-[22ch] font-display font-bold text-major leading-[1.05] tracking-tight text-ink"
            lines={['A sticker-sized', 'patch for the upper arm.']}/>
          <ScrollIn className="mt-4">
            {/* Statements, not a block. The review asked for bullets here by
                name, and the standing preference is the same. text-body rather
                than text-lead: five lines at lead size is a wall again. */}
            <ul className="m-0 grid max-w-[46ch] list-none gap-2 p-0">
              {CHAIN.map(t => (
                <li key={t} className="flex gap-2.5 text-body leading-[1.45] text-ink-2">
                  {/* accent on mist is 4.85 : 1, well over the 3 : 1 a
                      non-text mark needs, and the dot is aria-hidden so the
                      list reads as a list and not as five bullet characters. */}
                  <span aria-hidden
                    className="mt-[0.52em] h-[7px] w-[7px] shrink-0 rounded-chip bg-accent"/>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            {/* The one fact about this object that is not settled. It used to
                sit on the landing page inside a panel repeating three things
                this page already says; the other two went with the panel and
                this one came here, where the object is. */}
            <p className="mt-4 max-w-[46ch] text-meta text-ink-3">
              How long one adhesive lasts is not settled. No unit has been worn yet.
            </p>
            {/* What you can DO here, said inside the first screen rather than
                discovered nine hundred pixels down. A real button, so it is in
                the tab order and takes the site's focus ring, and the scroll
                itself is left to the site's own rule so it stops animating
                when the reader has asked for stillness. */}
            <button type="button" onClick={toModel}
              className="mt-5 inline-flex min-h-[44px] items-center gap-2 border-b-2 border-accent/35
                font-display text-ui font-medium text-accent hoverOnly:border-accent hoverOnly:text-accent-ink">
              Turn the 3D model<ChevronDown/>
            </button>
          </ScrollIn>
          </div>

          {/* Worn, at the size it is actually worn. The drawing and the model
              below say what the thing is made of; this says what it looks like
              on an arm, which is the question the review asked twice and no
              diagram answers. No caption under it: the band below already
              states that no unit has been built and that nothing on the page
              is a photograph, and saying it twice on one screen read as a
              disclaimer rather than as a fact. The alt text carries what the
              image is for a reader who cannot see it. */}
          {/* The one photographic thing in the band, so it is the thing that
              drifts: 52px of total travel against a column of type that does
              not move, which is what makes the band read as two planes rather
              than as one sheet. The image's own box is untouched — the travel
              is a transform and it is less than this band's own vertical
              padding, so nothing is laid out differently and nothing can
              reach the edge. */}
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

      {/* The four signals were the back half of the hero band and sat under no
          heading of their own. That is what made this the one page in the menu
          that failed the scale: h1 at 54px, then a 29px card title, and no
          section heading anywhere on it. SectionHead is the site's h2 and the
          32-48px step comes from there, so this page cannot drift again.

          A ground of its own as well. Plain words before the engineering
          labels: two testers hit EDA / PPG / nRF52840 first and stopped
          reading. Four equal tiles, one row, a 44px trace each, the signal's
          own colour as the card's leading rule. h-full on both wrappers
          because an uneven row of four reads as four unrelated cards rather
          than as one reading. */}
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
      </Section>

      {/* The dark band, used once, and now one section with one heading at the
          top of it.

          The review could not tell whether what sat on the green belonged to
          the band or to the sections around it, and the cause was structural:
          the band opened with a figure and kept its only heading in the
          right-hand rail at card size, so the green had no stated beginning.
          The heading is the first thing inside it now, at the same step as the
          section above, and everything on the green sits under that one
          heading. No extra rules were added to say so: the ground changes, the
          padding is a step deeper than its neighbours, and the heading names
          the section. The rail stays beside the figure, because a toggle that
          isolates an assembly has to point at a model the reader can see. */}
      <section ref={band} id="model" data-anchor
        className="border-t border-rule bg-ink text-paper">
        <div className="wrap py-10 lg:py-16">
          <SectionHead tone="ink" className="mt-0 max-w-[26ch]">
            The three parts of a patch
          </SectionHead>
          {/* items-stretch, not items-start: the two columns are one row now,
              so the rail can be told to take the figure's height instead of
              running past it. */}
          <div className="mt-6 grid gap-6 lg:mt-9
            lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:items-stretch lg:gap-8">
            <figure className="m-0 min-w-0">
              {/* The drawing goes INTO the viewer's card rather than beside it
                  as a second figure at the same scale. One composition, one
                  edge, one caption under the pair. */}
              <PatchArena ref={model} onPlay={() => setPicked(null)} onShowAll={() => setPicked(null)}
                beside={<ExplodedStack caption="" className="h-[190px] lg:h-full lg:min-h-[240px]"/>}/>
              {/* Four short sentences. "No figure on this page was measured
                  from one" is what the review could not parse, and it was
                  saying two things at once: that nothing is a photograph, and
                  where the dimensions came from. The second was answering a
                  question nobody asked, so it is gone. */}
              {/* Four sentences stood here and three of them narrated the
                  picture directly above: that the drawing names the layers,
                  that the model is the same patch, that it turns and opens.
                  The drawing is labelled and the controls are visible. The one
                  sentence left is the one nothing on screen can say. */}
              <figcaption className="mt-3 max-w-[70ch] text-meta text-mist">
                No unit has been built, so nothing here is a photograph.
              </figcaption>
            </figure>

            {/* The three cards used to be sized for a column of their own and
                overran the viewer beside them by about three hundred pixels:
                the skin-side card sat below the model, where a reader
                scrolling the band never reached it, and the overrun left a
                slab of bare green under the figure.

                At lg the rail is pinned to the row: h-full takes the figure's
                height and three rows of minmax(min-content,1fr) share it, so
                any slack is spread across the three cards instead of pooling
                under the model. min-content is the floor rather than 0,
                because a 1fr row that can shrink past its text is a row that
                clips it. Every step inside the card comes down one notch to
                pay for the fit.

                None of this applies below lg, where the cards are the full
                width of the page with no figure beside them to match and the
                reading size is the right size. */}
            <ol className="m-0 grid list-none gap-3 p-0
              lg:h-full lg:gap-2.5 lg:grid-rows-[repeat(3,minmax(min-content,1fr))]">
              {LAYERS.map(l => {
                const on = picked === l.part
                return (
                  <li key={l.i}>
                    <Card interactive as="button" aria-pressed={on}
                      onClick={() => setPicked(on ? null : l.part)}
                      className={cn('lg:h-full', on && 'border-l-accent')}>
                      {/* The review called three text-only boxes boring and it
                          was right. The drawing sits on ink inside the white
                          card: the cards stand on the dark band, the band's
                          two usable stroke values are mist and accent.lit, and
                          both vanish on white. Its own ink panel is what lets
                          the drawing keep the band's palette and still measure
                          12.69 and 7.67 against what is behind it.

                          The drawing's own height lives on the svg in
                          charts/patch-parts (76px, 88px at sm), so a height on
                          this panel alone would not move it at lg. This
                          selector is what actually constrains it: `.cls svg`
                          and the svg's own `h-[76px]` are a class-plus-type
                          and a class, so this wins on specificity wherever it
                          falls in the sheet. It is a descendant selector
                          rather than the child selector it used to be because
                          the drawing now sits inside its own perspective box
                          — the two match at the same specificity, so nothing
                          else changed. The matching `h-full` on that box is in
                          charts/patch-parts; the viewBox is unchanged and
                          preserveAspectRatio keeps the drawing centred at
                          whatever height the panel is given. */}
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
