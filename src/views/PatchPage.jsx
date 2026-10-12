import React from 'react'
import { PHOTOS } from '../lib/photos'
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

/* Claims here are limited to what the build is. Battery, charge time,
   adhesive, wear duration, electrode build, part numbers, ingress, weight and
   cost are all open and no figure for any of them may be added.

   The exploded five-layer figure (charts/patchstack) lives on THIS page, not
   on the landing page or the methods page: it is the inside of the patch and
   it belongs under the patch. It carries its own caption and its own layer
   table, so nothing here repeats either. */
const CHAIN = [
  'Upper arm, under a sleeve.',
  'Four signals, once a second.',
  'Bluetooth to your phone.',
  `One ${SCORE} a day, ${SCORE_RANGE}.`,
]

/* The settled numbers, as values rather than as sentences. They sit beside the
   exploded figure because that section was one centred column at 1280 and the
   spec asks every wide section for two. Nothing open may join this table:
   battery, charge time, adhesive, wear duration, electrode build, part
   numbers, ingress, weight, range, cost and accuracy all stay off it. */
const FIGURES = [
  { k: 'Along the arm',    v: '54', u: 'mm' },
  { k: 'Across the arm',   v: '36', u: 'mm' },
  { k: 'Sensing channels', v: '4',  u: 'at once' },
  { k: 'Readings',         v: '1',  u: 'a second' },
  { k: 'Baseline',         v: '14', u: 'days' },
]

/* Two settled facts that are not numbers. Kept out of the table above so a
   reader never has to decode a blank cell. */
const PLAIN = [
  { k: 'Link',     v: 'Bluetooth Low Energy to the phone. No wire, no host computer.' },
  { k: 'Charging', v: 'Through a slot in the side of the shell.' },
]

/* Named so the table above cannot be read as a complete datasheet. Every one
   of these is genuinely unsettled and no figure for any of them appears
   anywhere on this site. */
const OPEN = ['Battery', 'Charge time', 'Adhesive', 'Wear time', 'Weight', 'Cost']

/* The three assemblies the 3D model can isolate. The titles come from
   views/Patch, which the model and the hero drawing share; the lines are
   written here because that file's own copy names a board and a supplier and
   counts three signals where there are four. A page a judge reads must carry
   only settled facts, so this page states its own. */
const PART_LINE = {
  pod:  'The oval that closes the stack. Charging runs through a slot in its side.',
  pcb:  'Carries the radio. Bluetooth Low Energy to the phone, and nothing else.',
  base: 'The face that sits against the outer upper arm. All four channels read through it.',
}

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
        <div className="wrap relative py-7 lg:py-10
          lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,40%)] lg:items-center lg:gap-8">
          <div className="min-w-0">
          <p className="font-mono text-ui font-bold tracking-[0.005em] text-accent">The patch</p>
          {/* The line break is explicit so a 390px column cannot hyphen-break
              "sticker-sized" across two lines. */}
          <RevealLines as="h1"
            className="mt-2 max-w-[22ch] font-display font-bold text-major leading-[1.05] tracking-tight text-ink"
            lines={['A sticker-sized', 'patch for the upper arm.']}/>
          <ScrollIn className="mt-4">
            {/* A container, not text on the tinted band. */}
            <Card className="max-w-[46ch] p-3.5">
              <ul className="m-0 grid list-none gap-1.5 p-0">
                {CHAIN.map(t => (
                  <li key={t} className="flex gap-2.5 text-meta leading-[1.4] text-ink-2">
                    {/* accent on card is 5.80:1, well over the 3:1 a non-text
                        mark needs; aria-hidden so the dots are not read out. */}
                    <span aria-hidden
                      className="mt-[0.5em] h-[7px] w-[7px] shrink-0 rounded-chip bg-accent"/>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              {/* Plain, early and once. Nothing below may imply otherwise. */}
              <p className="mt-3 border-t border-rule pt-2.5 text-fine text-ink-2">
                <b className="font-display font-bold text-ink">No unit has been built or worn.</b>{' '}
                Everything on this page is a drawing or a model.
              </p>
            </Card>
            {/* A real <button>, not an anchor or a div: it must be in the tab
                order and take the site's focus ring. */}
            <button type="button" onClick={toModel}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 border-b-2 border-accent/35
                font-display text-ui font-medium text-accent hoverOnly:border-accent hoverOnly:text-accent-ink">
              Turn the 3D model<ChevronDown/>
            </button>
          </ScrollIn>
          </div>

          {/* No caption: the card above states that no unit has been built, and
              saying it twice reads as a disclaimer. Alt text carries the
              content.

              Parallax travel is 52px, a transform only, and under this band's
              vertical padding, so it changes no layout and cannot reach the
              edge. Raising it can. */}
          <figure className="m-0 mt-6 lg:mt-0">
            <Parallax2D distance={52}>
              <img src={PHOTOS['patch-worn']} width="1024" height="688" loading="eager"
                decoding="async"
                alt="A teenager in a school gym with the MindMap patch on his upper arm"
                className="h-[210px] w-full rounded-panel object-cover sm:h-[280px] lg:h-[320px]"/>
            </Parallax2D>
          </figure>
        </div>
      </section>

      {/* Plain-language names only; EDA / PPG / nRF52840 belong on the signal
          pages. */}
      <Section tone="card" tight className="bg-aqua-2">
        <SectionHead className="mt-0 max-w-[24ch]">Four signals off the skin</SectionHead>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {RAINBOW.map((s2, i) => (
            <ScrollRow key={s2.id} index={i} className="h-full">
              <Card className="flex h-full flex-col border-l-[3px]" style={{ borderLeftColor: s2.glow }}>
                <div className="bg-mist/70 px-3 py-2 lg:px-4">
                  <SignalTrace kind={s2.id} className="h-10"/>
                </div>
                <dl className="m-0 px-3 pb-3 pt-2 lg:px-4 lg:pb-3.5">
                  <dt className="font-display text-ui font-bold text-ink">{s2.name}</dt>
                  {/* text-fine, not text-sec: two of these run to three rows in
                      a 170px phone column. Full per-signal detail, including
                      the 0.35 g movement threshold, lives on the signal
                      pages. */}
                  <dd className="m-0 mt-1 max-w-[26ch] text-fine text-ink-2">{s2.short}</dd>
                </dl>
              </Card>
            </ScrollRow>
          ))}
        </div>
      </Section>

      {/* Inside the patch. This figure was on the methods page, which is the
          wrong page for it: it is the build of the patch. It brings its own
          caption, its own layer table and its own control, so this band adds a
          heading, a container and a rail of the settled values, and nothing
          else.

          The rail exists because the figure is one tall centred column and a
          wide section is owed two. It is a second column of real values, not
          decoration: every row is a number this project has settled on. */}
      <Section name="Inside the patch" tone="card" tight className="bg-card">
        <SectionHead className="mt-0 max-w-[26ch]">Five layers of one oval</SectionHead>
        <div className="mt-4 grid gap-3 lg:mt-5
          lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)] lg:items-start lg:gap-4">
          <Card className="min-w-0 p-3.5 lg:p-5">
            <PatchStack/>
          </Card>

          {/* lg:sticky, so the values stay beside the figure while the reader
              scrolls the layer table. top-24 clears the sticky header. */}
          <Card className="p-3.5 lg:sticky lg:top-24 lg:p-4">
            <h3 className="font-display text-row font-bold leading-tight text-ink">
              Settled so far
            </h3>
            {/* Two columns on a phone and one in the lg rail: five stacked
                rows is 170px of mostly empty line on a 390px screen, and the
                figure above it is already long. */}
            <dl className="m-0 mt-2.5 grid grid-cols-2 gap-x-4 lg:grid-cols-1">
              {FIGURES.map(f => (
                <div key={f.k}
                  className="flex items-baseline gap-3 border-t border-rule py-1.5
                    first:border-t-0 lg:[&:nth-child(2)]:border-t">
                  <dt className="min-w-0 flex-1 text-fine text-ink-2">{f.k}</dt>
                  <dd className="m-0 shrink-0 font-mono text-row font-bold tabular-nums text-ink">
                    {f.v}
                    <span className="ml-1.5 font-body text-fine font-normal text-ink-3">{f.u}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <dl className="m-0 mt-3 grid gap-2 border-t border-rule pt-2.5 sm:grid-cols-2
              lg:grid-cols-1">
              {PLAIN.map(p => (
                <div key={p.k} className="min-w-0">
                  <dt className="font-display text-ui font-bold text-ink">{p.k}</dt>
                  <dd className="m-0 mt-0.5 max-w-[34ch] text-fine text-ink-2">{p.v}</dd>
                </div>
              ))}
            </dl>
            {/* Open values are named rather than left as blanks, so the table
                reads as the state of the work and not as a datasheet with
                holes in it. Chips, not a sentence: this page carries no
                paragraphs. */}
            <div className="mt-3 border-t border-rule pt-2.5">
              <p className="font-mono text-fine text-ink-3">Still open, nothing claimed</p>
              <ul className="m-0 mt-1.5 flex list-none flex-wrap gap-1.5 p-0">
                {OPEN.map(o => (
                  <li key={o} className="rounded-chip border border-rule bg-paper px-2.5 py-[3px]
                    text-fine text-ink-2">
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      </Section>

      {/* The isolate toggles must stay beside the model, not under it. */}
      <section ref={band} id="model" data-anchor
        className="border-t border-rule bg-ink text-paper">
        <div className="wrap py-8 lg:py-12">
          <SectionHead tone="ink" className="mt-0 max-w-[26ch]">
            The three parts of a patch
          </SectionHead>
          {/* items-stretch: the rail's lg:h-full sizes from the figure. */}
          <div className="mt-4 grid gap-4 lg:mt-6
            lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:items-stretch lg:gap-6">
            <figure className="m-0 min-w-0">
              <PatchArena ref={model} onPlay={() => setPicked(null)} onShowAll={() => setPicked(null)}
                beside={<ExplodedStack caption="" className="h-[190px] lg:h-full lg:min-h-[240px]"/>}/>
              {/* The honesty line is the hero's, once. This caption says what
                  the figure is. */}
              <figcaption className="mt-2.5 max-w-[70ch] text-fine text-mist">
                A model and a drawing, not a photograph.
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
                          Keep it a descendant selector, since the svg sits inside
                          its own perspective box  and keep the matching
                          h-full in charts/patch-parts. */}
                      <div className="bg-ink px-3 py-2.5
                        lg:h-[clamp(44px,5.6vh,56px)] lg:py-2 lg:[&_svg]:h-full">
                        {PART_ART[l.part]}</div>
                      <div className="p-3.5 lg:p-3">
                        <h3 className="font-display text-row font-bold leading-tight text-ink
                          lg:text-ui">
                          {l.title}</h3>
                        <p className="mt-1 text-fine text-ink-2">{PART_LINE[l.part]}</p>
                        <span className="mt-1.5 block text-fine font-bold text-accent lg:mt-1">
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
