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

/* COLOUR, this pass. The page ran mist, aqua-2, white, white, ink: five
 * near-white teals and a dark band, which is the monotony the owner named on
 * the twelve reference screens. It now runs coral, white, sun, ink, with the
 * four signal cards carrying one hue each in the rainbow's own order, so the
 * set reads as four different things rather than one tint four times.
 *
 * Every value is from tailwind.config.js and every pairing was measured: each
 * hue's `ink` clears 4.5 : 1 on paper, card and all six washes, and the hue
 * `DEFAULT` is used only as a left edge against a white card, where the
 * weakest of the four, mint, is 3.22 : 1 against the 3 : 1 a non-text graphic
 * owes. No hue touches body text, which stays ink and ink-2. The signal's own
 * glow still draws its trace, so colour is never the only thing naming it: the
 * name is printed under every trace. */
/* Nobody pictured anywhere on this site wears the patch, because no unit has
   been built or worn. This frame is a licensed stock photograph with a drawing
   of the oval placed on it, and its alt text says exactly that. */
const ARM_ALT = 'A licensed stock photograph of a teenager in a school gym, with a drawing '
  + 'of the patch placed on the outer upper arm to show where it would sit.'

const SIGNAL_WASH = {
  heart: 'bg-coral-wash', sweat: 'bg-sun-wash', temp: 'bg-mint-wash', move: 'bg-sky-wash',
}

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

/* THE MODEL MAY NOT COME UP, AND A JUDGE MUST NOT BE LEFT LOOKING AT THAT.
 *
 * The viewer is a 620 KB script over roughly 9 MB of geometry and it wants a
 * GPU. On a locked-down laptop, a software rasteriser or a blocked WebGL2 it
 * can sit on its own loading panel for as long as the page is open, and the
 * seven controls under it stay disabled the whole time. That reads as a broken
 * page, not as a browser limit.
 *
 * Nothing under public/di/arena is touched to fix it: that bundle is vendored
 * and checksummed. The page watches its own stage instead.
 *
 * TWO SIGNALS, BOTH FROM THIS SIDE OF THE ELEMENT:
 *   1. No WebGL2 context at all, in which case the model is never mounted and
 *      the dead state is never painted.
 *   2. The viewer disables every one of its controls until the model is live,
 *      so a control that is still disabled MODEL_WAIT after the band comes
 *      within reach is the proof that it has not come up. This catches the
 *      hung load, the missing script and the failed context alike, because all
 *      three leave the same controls disabled.
 *
 * Either way the band drops to the exploded drawing, which carries the same
 * parts and only settled facts. The clock starts when the band is 300px away,
 * the same trigger the viewer itself mounts on, so a reader who never scrolls
 * this far is never told the model failed. */
const MODEL_WAIT = 8000

function noWebgl2() {
  try {
    const c = document.createElement('canvas')
    const g = c.getContext('webgl2')
    if (!g) return true
    /* Hand the context straight back: the probe must not spend one of the
       browser's handful of live contexts, which the viewer needs. */
    g.getExtension('WEBGL_lose_context')?.loseContext()
    return false
  } catch { return true }
}

export function PatchPage() {
  const [picked, setPicked] = React.useState(null)
  /* true once the model is known not to have come up. One way only: a swap
     back would move the band under a reader already looking at it. */
  const [down, setDown] = React.useState(false)
  const model = React.useRef(null)
  const band = React.useRef(null)
  const stage = React.useRef(null)

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
      {/* No border-b: the <Section> below supplies border-t, and two meeting
          hairlines render as a 2px rule. */}
      <section className="relative overflow-hidden bg-coral-wash">
        <div className="wrap relative py-7 lg:py-10
          lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,44%)] lg:items-center lg:gap-8">
          <div className="min-w-0">
          <p className="inline-flex rounded-chip border border-rule bg-card px-2.5 py-1
            font-mono text-ui font-bold tracking-[0.005em] text-coral-ink">The patch</p>
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
              {down ? 'See the three parts' : 'Turn the 3D model'}<ChevronDown/>
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
                alt={ARM_ALT}
                className="h-[230px] w-full rounded-panel border border-rule object-cover
                  sm:h-[300px] lg:h-[380px]"/>
            </Parallax2D>
          </figure>
        </div>
      </section>

      {/* Plain-language names only; EDA / PPG / nRF52840 belong on the signal
          pages. */}
      <Section tone="card" tight>
        <SectionHead className="mt-0 max-w-[24ch]">Four signals off the skin</SectionHead>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {RAINBOW.map((s2, i) => (
            <ScrollRow key={s2.id} index={i} className="h-full">
              <Card className="flex h-full flex-col border-l-[3px]" style={{ borderLeftColor: s2.glow }}>
                <div className={cn('px-3 py-3 lg:px-4', SIGNAL_WASH[s2.id] || 'bg-mist/70')}>
                  <SignalTrace kind={s2.id} className="h-12"/>
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
      <Section name="Inside the patch" tone="card" tight className="bg-sun-wash">
        <SectionHead className="mt-0 max-w-[26ch]">Five layers of one oval</SectionHead>
        <div className="mt-4 grid gap-3 lg:mt-5
          lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)] lg:items-start lg:gap-4">
          <Card className="min-w-0 p-3.5 lg:p-5">
            <PatchStack/>
          </Card>

          {/* lg:sticky, so the values stay beside the figure while the reader
              scrolls the layer table. top-24 clears the sticky header. */}
          <Card className="lg:sticky lg:top-24">
            {/* Where the oval goes, at the one scale the exploded figure beside
                it cannot show: a human arm. A licensed stock frame of a model,
                carrying no patch and no drawing of one. */}
            <img src={PHOTOS['student-basketball']} width="1600" height="1066" loading="eager"
              decoding="async"
              alt="A teenager in a sleeveless vest dribbling a basketball on an outdoor court"
              className="block h-[128px] w-full max-w-none border-b border-rule object-cover
                object-[50%_38%] lg:h-[144px]"/>
            <div className="p-3.5 lg:p-4">
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
          {/* With the model, two columns: the figure and a rail of three cards
              sized to it. With the drawing standing in, the figure is twice
              that height and a 360px rail beside it leaves a third of the band
              empty, so the three cards drop under it as a row of three. The
              band is multi-column either way. */}
          <div className={cn('mt-4 grid gap-4 lg:mt-6 lg:gap-6',
            !down && 'lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:items-stretch')}>
            <figure className="m-0 min-w-0">
              {down ? (
                /* The stand-in is the exploded drawing this site already draws
                   the patch with, in a white card because it is drawn for one.
                   Its trailing layer table and sensor list are hidden with a
                   child selector rather than a prop, because that same table
                   is already open in full in "Inside the patch" above and a
                   judge must not read the page as repeating itself. The
                   drawing, the arm inset, the dimension line and the "no unit
                   has been built" caption all stay. */
                <Card className="p-3.5 lg:p-5">
                  <PatchStack className="[&>dl]:hidden [&>p]:hidden"/>
                </Card>
              ) : (
                <div ref={stage}>
                  <PatchArena ref={model} onPlay={() => setPicked(null)} onShowAll={() => setPicked(null)}
                    beside={<ExplodedStack caption="" className="h-[190px] lg:h-full lg:min-h-[240px]"/>}/>
                </div>
              )}
              {/* The honesty line is the hero's, once. This caption says what
                  the figure is, and when the model is down it says in one line
                  why the drawing is standing in for it. */}
              <figcaption className="mt-2.5 max-w-[70ch] text-fine text-mist">
                {down
                  ? 'The interactive model needs hardware acceleration this browser did not provide, so the drawing of the same patch stands in its place.'
                  : 'A model and a drawing, not a photograph.'}
              </figcaption>
            </figure>

            {/* At lg the rail takes the figure's height and the three rows
                share it. The row floor is min-content, not 0: a bare 1fr row
                shrinks past its own text and clips it. Below lg the cards are
                full width and none of this applies.

                The drawing that stands in for the model is twice the model's
                height, and three cards sharing that leaves each one two thirds
                empty, so the stretch is dropped with the model. */}
            <ol className={cn('m-0 grid list-none gap-3 p-0 lg:gap-2.5',
              down ? 'sm:grid-cols-3 lg:gap-4'
                   : 'lg:h-full lg:grid-rows-[repeat(3,minmax(min-content,1fr))]')}>
              {LAYERS.map(l => {
                const on = !down && picked === l.part
                /* bg-ink panel inside a white card: the drawing's strokes are
                   mist and accent.lit, which both disappear on white. On ink
                   they measure 12.69 and 7.67.

                   The svg carries its own h-[76px] (88px at sm) from
                   charts/patch-parts, so a height on this panel alone will not
                   resize it at lg. `[&_svg]:h-full` is a class-plus-type
                   selector and wins on specificity. Keep it a descendant
                   selector, since the svg sits inside its own perspective box
                   and keep the matching h-full in charts/patch-parts. */
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
                      {/* Only offered while there is a model to isolate. With
                          the drawing standing in, these would be three more
                          controls that do nothing, which is the defect this
                          fallback exists to remove. */}
                      {!down && (
                        <span className="mt-1.5 block text-fine font-bold text-accent lg:mt-1">
                          {on ? 'Showing only this' : 'Show only this'}</span>
                      )}
                    </div>
                  </>
                )
                return (
                  <li key={l.i}>
                    {down ? (
                      <Card>{body}</Card>
                    ) : (
                      <Card interactive as="button" aria-pressed={on}
                        onClick={() => setPicked(on ? null : l.part)}
                        className={cn('lg:h-full', on && 'border-l-accent')}>
                        {body}
                      </Card>
                    )}
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
