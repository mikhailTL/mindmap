import React from 'react'
import { Label } from '../ui/misc'
import { LAYERS, ExplodedStack } from './Patch'
import { RevealLines, ScrollIn, ScrollRow } from '../s21/motion'
import { Card } from '@/ui/card'
import { Button } from '../ui/button'
import { PatchCAD, PATCH_LAYERS } from '../charts/cad'
import { DemoNotice } from '../ui/notice'
import { SignalTrace } from '../charts/infographics'
import { RAINBOW } from '../lib/sensors'
import { cn } from '../lib/utils'

/* Every image on this page is a render of revision DI-03 of our own CAD.
   `alt` and the caption title are copied out of public/di/assets.json rather
   than written here, because the package author described what is actually in
   each frame and a second description would drift from the first. */
const STAMP = 'Design intent — not as-built'
const RENDERS = {
  hero: {
    title: 'Closed patch',
    alt: 'MindMap design-intent patch with a matte neutral shell, engraved logo and recessed mindmap wordmark. DESIGN INTENT — NOT AS-BUILT.' },
  'skin-side': {
    title: 'Skin-side view',
    alt: 'Skin-side view of the MindMap concept showing contact surfaces, electrodes and optical openings. DESIGN INTENT — NOT AS-BUILT.' },
  'section-a': {
    title: 'Longitudinal section A–A',
    alt: 'Longitudinal section of the MindMap design-intent assembly through the optical region. DESIGN INTENT — NOT AS-BUILT.' },
  exploded: {
    title: 'Exploded assembly',
    alt: 'Staged exploded view of the MindMap presentation assembly and its internal layers. DESIGN INTENT — NOT AS-BUILT.' },
  'section-b': {
    title: 'Transverse section B–B',
    alt: 'Transverse section of the MindMap presentation assembly showing the battery and flex region. DESIGN INTENT — NOT AS-BUILT.' },
  ghost: {
    title: 'Transparent shell',
    alt: 'Transparent-shell view exposing the MindMap internal layout and antenna clearance construction volume. DESIGN INTENT — NOT AS-BUILT.' },
  'optical-detail': {
    title: 'Optical section detail',
    alt: 'Detailed section of the modelled optical chambers, window and construction cones; optical performance is unverified. DESIGN INTENT — NOT AS-BUILT.' },
  'on-arm': {
    title: 'Full-arm context',
    alt: 'MindMap design-intent patch on a complete generic anatomical arm model with hand, wrist, forearm, elbow and upper-arm segment. DESIGN INTENT — NOT AS-BUILT.' },
}

/* The stamp is burned into the render itself. It is repeated in the caption so
   that it also reaches a reader who never resolves the pixels — a screen
   reader, a printout, a judge scanning captions. Sentence case raised by CSS,
   because some screen readers spell a literal all-caps word out letter by
   letter. Square, ruled, unfilled: the same mark ui/notice.jsx makes. */
function Stamp({ children }) {
  return (
    <figcaption className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-l-2 border-warn py-0.5 pl-3">
      <span className="shrink-0 font-mono text-fine uppercase tracking-[0.09em] text-warn">{STAMP}</span>
      <span className="text-fine text-ink-3">{children}</span>
    </figcaption>
  )
}

/* <img> is otherwise banned on this site, and the reason was that every image
   was a stock photograph of somebody else's hands. These are drawings of the
   thing the page is about, so they are the exception.

   width/height carry the 16:9 master's ratio, so the browser reserves the box
   from the markup and nothing below a figure can be shoved down when the file
   lands. The 960 variant is the src; 1920 is only fetched where the column is
   actually wide enough to need it. */
function Render({ id, sizes = '(min-width: 1024px) 46vw, 92vw', note, className }) {
  const r = RENDERS[id]
  return (
    <figure className={cn('m-0', className)}>
      <img
        src={`/di/images/mindmap-${id}-960.webp`}
        srcSet={`/di/images/mindmap-${id}-960.webp 960w, /di/images/mindmap-${id}-1920.webp 1920w`}
        sizes={sizes}
        width="1920" height="1080" loading="lazy" decoding="async"
        alt={r.alt}
        className="h-auto w-full border border-rule bg-card"
      />
      <Stamp>{note ? `${r.title} · ${note}` : r.title}</Stamp>
    </figure>
  )
}

/* Assigned dimensions, with the disposition the package gives each one. The
   right-hand sentence is the point of the table: almost none of these is a
   measurement, and the ones that are fixed are fixed to a supplied datum. */
const DIMS = [
  ['Envelope', '64 × 42 mm',
   'Assigned for this layout. No prototype comparison is possible.'],
  ['Plan form', 'Spline lozenge',
   'One continuous spline with an elliptical plan envelope — not a stadium, not a rounded rectangle.'],
  ['Centre height', '14.6 mm',
   'Above the central skin datum. Centre height, not the Z extent of the curved envelope.'],
  ['Skin curvature', 'R42',
   'The generating surface. Fit and join proof on the spline approximation remain open.'],
  ['Shell wall', '1.2 mm',
   'Nominal, drafted 3°. Tool release for that draft is unverified.'],
  ['Electrode spacing', '28.0 mm',
   'Centres assigned to X ±14, Y 0. The orientation of datum B was not supplied.'],
  ['Optical centre', 'X 0, Y −8.0',
   'Fixed to the supplied datum coordinates.'],
  ['Body registry', '183 entries',
   'Every name on this page resolves inside the model. Agreement with an engineering BOM cannot be checked.'],
]

/* One signal, the part that reads it, and the thing about that part which is
   not yet decided. The order and the colours come from lib/sensors, so a
   signal is the same colour here as on the arch and in the app. */
const READS = {
  heart: {
    part: 'MAX30102 OESIP · 5.6 × 3.3 × 1.55 mm',
    how: 'A red die, an infrared die and a silicon photodiode in one package, looking through two optical-PC windows that stand 0.3 mm proud of the skin face on an R60 crown. A moulded opaque rib at least 1.6 mm wide separates emitter from detector.',
    open: 'The die pitch is a modelling assumption, not a manufacturer dimension. The exact die-placement drawing was not obtained.' },
  sweat: {
    part: 'Two Ag/AgCl electrodes · OPA2333 front end',
    how: 'Two skin electrodes 28.0 mm apart into a VSSOP dual op-amp on the rigid island, with a copper guard ring drawn around the high-impedance node.',
    open: 'The guard net drive and its schematic connection are unverified, and the electrode orientation assumes a datum that was never supplied.' },
  temp: {
    part: 'NTC 0603 · copper skin pad',
    how: 'A thermistor on a copper pad bonded through a 0.1 mm conductive epoxy layer, sitting inside the thermal foam pocket so the pad sees skin and not the battery.',
    open: 'Value and MPN were not supplied. The thermal transfer, the interface contacts and the response time are not demonstrated.' },
  move: {
    part: 'LSM6DS3TR-C · 2.5 × 3.0 × 0.83 mm',
    how: 'A six-axis IMU carried on the XIAO module, used to tell a hard run apart from a hard day.',
    open: 'Its underside placement is assumed. The retrieved vendor STEP is the base module, not the Sense revision that carries this part.' },
}

/* The seven titles and descriptions are imported from Patch.jsx, which takes
   them from the package's GEOMETRY.md, so the list under the drawing cannot
   drift from the drawing. What the page adds is the material and the one
   dimension that makes each layer legible as a physical object, read off the
   package BOM and keyed by the layer's own slug — a slug with no entry simply
   prints no spec line. */
const SPEC = {
  'shell-core':     'PC/ABS natural · 1.2 mm nominal walls',
  'light-guide':    'PMMA · 0.3 mm prism pitch',
  battery:          'Aluminised laminate · 20 × 30 × 3.5 mm, R44',
  pcb:              'FR-4 · 0.8 rigid / 0.15 flex / 0.025 mask',
  'thermal-pocket': 'Medical PU foam · 0.1 mm epoxy bondline',
  'skin-shell':     'PC/ABS carbon black · R60 windows, 0.3 mm proud',
  'adhesive-base':  'Medical PU foam · 0.55 mm substrate',
}

/* The package's own ten-point self-audit, compressed but not softened. Every
   sentence in `text` is the audit's wording or the limitations document's
   wording; nothing here has been resolved, and inventing a resolution would
   be worse than printing the failure. */
const OPEN_LEAD = [
  { verdict: 'Fail', tone: 'text-crit', rule: 'border-l-[3px] border-crit',
    title: 'The antenna volume runs through the battery',
    text: 'The provisional antenna volume intersects 38 body entries, including about 477.3 mm³ of the battery. It is also not an exact antenna offset: the specified 5 mm clearance is not met, and the antenna’s identity and location need the correct source data.',
    figure: 'ghost',
    note: 'the provisional antenna clearance volume' },
  { verdict: 'Fail', tone: 'text-crit', rule: 'border-l-[3px] border-crit',
    title: 'Optical crosstalk is unproven',
    text: 'Red and IR cones overlap 0.326 mm³ outside tissue. Each emitter-to-photodiode pair overlaps 0.000 mm³ there, but that is geometry, not evidence: the cones are not refracted through the glass and PC interfaces, and they model no scattering, no reflection, no skin motion and no leakage along the sensor’s common cover glass.',
    figure: 'optical-detail',
    note: 'construction cones, not simulated light' },
]
const OPEN_REST = [
  ['Not satisfied', 'Mouldability',
   'Global 1.5° / 3° draft and tool release are unverified. The service port and the bent acoustic channel need a resolved tool scheme. Gates and ejector witnesses are candidate geometry, not a moulder-approved arrangement.'],
  ['Unverified', 'Surface continuity',
   'A C2 spline construction gives a broad smooth highlight, but the G2 joins and the specified R1.2-to-R2.8 perimeter blend law have not been certified.'],
  ['Unverifiable', 'There is no engineering baseline',
   'No MindMap engineering CAD, schematic, approved BOM, netlist, tolerance stack or prototype measurement was available to check this model against. That is also why no thickness difference from the printed prototype can be claimed.'],
  ['Illustrative', 'The electrical architecture is drawn, not designed',
   'The copper pours, four layers, I²C routes, vias and guard ring are real 3D bodies, but their connectivity, widths, return paths, isolation and guard drive are illustrative. They are not imported from a netlist and must not be read as verified ECAD.'],
  ['Wrong revision', 'The vendor board model is the base module',
   'The downloaded STEP is the XIAO base-module v15 model despite the Sense resource link, so the Sense-specific placement needs the correct vendor revision. Its envelope also measures 22.482 × 17.780 × 4.460 mm against the 21.0 × 17.5 × 3.5 mm assumed for the layout.'],
  ['Partial', 'The closure is not one form feature',
   'The principal closure follows one continuous perimeter form feature, but the door interface and the pre-weld director remain separate design features rather than part of it.'],
]

/* PATCH_LAYERS is ordered skin-side outwards, because that is the order the
   viewer separates the stack in. The written list this control sits under runs
   outermost first, so the toggles are reversed to agree with it: a reader who
   has just read seven numbered layers should find them in the same order in
   the row of buttons underneath. */
const PICKS = [...PATCH_LAYERS].reverse()

/* The labels are written as sentence fragments, because their other consumer
   is the canvas's own name — "showing the flex-rigid board alone". A control
   is not a sentence, so the article goes and the first letter comes up. */
const pickLabel = l => l.label.replace(/^the /, '').replace(/^./, c => c.toUpperCase())

/* Every state the two toggles need, in one place rather than two class strings
   that drift apart. Focus is the site-wide accent outline from input.css, so
   it is deliberately absent here. */
const CTL = 'flex w-full items-center gap-3 rounded-field border px-4 py-2.5 text-left ' +
  'font-display text-ui font-medium transition-colors duration-150 ease-out ' +
  'disabled:pointer-events-none disabled:opacity-45'
const CTL_ON = 'border-ink bg-ink text-paper hover:bg-accent-ink active:bg-accent-ink'
const CTL_OFF = 'border-rule bg-card text-ink hover:bg-mist active:bg-mist'

/* The page used to drive the drawing itself: a ScrollTrigger tipping `#stack`
   and a per-layer translateZ keyed by data-i. The DI-03 drawing is a custom
   element with its own shadow root, its own stage and its own explode control,
   so there is no `.lyr` and no `#stack` left to reach — and a host that
   reached in would be fighting it. The rig is deleted rather than defended. */
export function PatchPage({ go }) {
  /* The model path is published on globalThis by entry.jsx, so it is read at
     render rather than at module evaluation — the import graph is resolved
     before that assignment runs. */
  const src = globalThis.__CAD || '/di/models/mindmap.glb'
  const [exploded, setExploded] = React.useState(false)
  const [picked, setPicked] = React.useState(null)
  return (
    <main>
      <section className="relative overflow-hidden border-b border-rule bg-mist">
        <div className="wrap relative py-20">
          <Label>The patch · revision DI-03</Label>
          <div className="mt-3 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
            <div>
              <RevealLines as="h1"
                className="max-w-[22ch] font-display font-medium text-sect leading-[1.05] tracking-tight text-ink"
                lines={['A sticker-sized', 'patch for the forearm.']}/>
              <ScrollIn className="mt-5">
                <p className="max-w-[46ch] text-lead leading-[1.5] text-ink-2">
                  A sealed lozenge, 64 × 42 mm nominal, worn along the forearm for a week.
                  It is designed to read four signals off the skin — heart, sweat, skin
                  temperature and movement — once a second and send them to the phone.
                </p>
                <p className="mt-5 max-w-[52ch] text-sec text-ink-2">
                  Everything below is drawn from one package: the DI-03 design-intent CAD,
                  its 183-body registry and its own limitations document. The last section
                  is that document&rsquo;s list of what it failed to settle.
                </p>
                <DemoNotice className="mt-6">
                  No photograph of an assembled unit exists yet. Every picture on this page is
                  a render of our own model, no figure here was measured from hardware, and no
                  sensing performance has been tested on anyone.
                </DemoNotice>
              </ScrollIn>
            </div>
            <Render id="hero" sizes="(min-width: 1024px) 48vw, 92vw"/>
          </div>

          {/* The disposition column is why this is a table and not a spec strip.
              A bare figure reads as measured; the sentence beside it says which
              datum it was assigned from and what has not been checked. */}
          <dl className="mt-14 grid gap-x-10 gap-y-8 border-t border-ink pt-8 sm:grid-cols-2 lg:grid-cols-4">
            {DIMS.map(([k, v, why]) => (
              <div key={k}>
                <dt className="note">{k}</dt>
                <dd className="m-0 mt-1 font-mono text-row tabular-nums text-ink">{v}</dd>
                <dd className="m-0 mt-2 max-w-[34ch] text-fine text-ink-3">{why}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="wrap py-20">
        <h2 className="mark">Four signals, and the part that reads each</h2>
        <p className="mt-4 max-w-[58ch] text-sec text-ink-2">
          Plain words first, then the part number. Each card ends with the thing about
          that part which the model has not settled.
        </p>
        <div className="mt-10 grid gap-x-10 gap-y-8 lg:grid-cols-2">
          {RAINBOW.map((s, i) => {
            const r = READS[s.id]
            return (
              <ScrollRow key={s.id} index={i} className="h-full">
                <Card className="flex h-full flex-col border-l-[3px]" style={{ borderLeftColor: s.glow }}>
                  <div className="bg-mist/70 px-4 py-4">
                    <SignalTrace kind={s.id}/>
                  </div>
                  <dl className="m-0 flex flex-1 flex-col px-5 pb-5 pt-4">
                    <dt className="flex items-baseline gap-2.5 font-display text-head font-medium text-ink">
                      {s.name}
                      {s.id === 'sweat' && (
                        <span className="font-body text-note font-normal italic text-ink-3">first to move</span>
                      )}
                    </dt>
                    <dd className="m-0 mt-1.5 max-w-[42ch] text-sec text-ink-2">{s.short}</dd>
                    <dd className="m-0 mt-3 font-mono text-tick text-ink-2">{r.part}</dd>
                    <dd className="m-0 mt-2 max-w-[46ch] text-meta text-ink-2">{r.how}</dd>
                    {s.id === 'move' && (
                      <dd className="m-0 mt-3 max-w-[46ch] border-l-2 border-ink-3 pl-3 text-note text-ink-3">
                        Above <span className="font-mono tabular-nums">0.35 g</span> the score is held
                        back rather than counted as stress.
                      </dd>
                    )}
                    <dd className="m-0 mt-4 max-w-[46ch] border-l-2 border-warn pl-3 text-note text-ink-3">
                      <span className="mr-2 font-mono text-fine uppercase tracking-[0.09em] text-warn">Open</span>
                      {r.open}
                    </dd>
                  </dl>
                </Card>
              </ScrollRow>
            )
          })}
        </div>

        {/* Each paragraph sits under its own figure rather than one caption
            reading "left" and "right": the columns stack on a phone, where left
            and right are above and below. */}
        <div className="mt-14 grid items-start gap-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <Render id="skin-side" note="both electrodes and both optical windows"/>
            <p className="mt-5 max-w-[48ch] text-meta text-ink-2">
              The face that touches the arm. The two electrodes sit out on the wings at
              28.0 mm centres; the two optical windows sit inboard at the optical centre,
              X 0 and Y −8.0, split by the opaque rib.
            </p>
          </div>
          <div>
            <Render id="section-a" note="cut through the optical region"/>
            <p className="mt-5 max-w-[48ch] text-meta text-ink-2">
              The same region in section: window crown, opaque rib, sensor package and the
              pocket each of them sits in, over a skin-side shell curving to R42.
            </p>
          </div>
        </div>
      </section>

      <section className="wrap py-20">
        <h2 className="mark">Seven layers, outermost first</h2>
        <p className="mt-4 max-w-[58ch] text-sec text-ink-2">
          The drawing below is projected from the CAD itself, and it separates in the
          assembly order the model holds. The list under it is the same seven groups in
          words.
        </p>

        {/* The drawing measures its own column and reserves its own height, so
            it gets a row to itself: half a wide column left it floating in a
            box taller than the figure beside it. */}
        <ExplodedStack className="mt-10"/>

        <ol className="mt-10 grid list-none gap-4 p-0 lg:grid-cols-2">
          {LAYERS.map(l => (
            <li key={l.part} className="h-full">
              <Card className="grid h-full grid-cols-[36px_1fr] items-start gap-4 p-5">
                <span className="pt-1.5 font-mono text-tick text-ink-3">0{l.i + 1}</span>
                <div>
                  <h3 className="font-display text-row font-medium text-ink">{l.title}</h3>
                  <p className="mt-1.5 max-w-[46ch] text-sec text-ink-2">{l.body}</p>
                  {SPEC[l.part] && <p className="mt-2 font-mono text-fine text-ink-3">{SPEC[l.part]}</p>}
                </div>
              </Card>
            </li>
          ))}
        </ol>

        <div className="mt-14 grid items-start gap-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <Render id="exploded" note="the same separation, rendered"/>
            <p className="mt-5 max-w-[48ch] text-meta text-ink-2">
              The layers separate here as they are modelled, not as they would be built: the
              staged lifts are Z-only and keep soldered and bonded groups together, which
              preserves the subassemblies but does not establish an assembly order.
            </p>
          </div>
          <div>
            <Render id="section-b" note="battery and flex region"/>
            <p className="mt-5 max-w-[48ch] text-meta text-ink-2">
              The transverse cut shows why the stack is layered the way it is. The cell is a
              curved pouch rather than a can, so it follows the shell instead of dictating its
              thickness, and the polyimide flex arches over the rigid island at a 3.225 mm
              inner radius so the board assembly moves as one piece.
            </p>
          </div>
        </div>
      </section>

      <section className="wrap py-20">
        <h2 className="mark">Turn it yourself</h2>
        <p className="mt-4 max-w-[58ch] text-sec text-ink-2">
          The same seven groups as the solid model rather than as a projection of it. Drag
          to turn it, pull the stack apart, or take one layer out and look at it on its own.
          The model is about a megabyte, and neither it nor the 3D code is fetched
          until the drawing is nearly on screen.
        </p>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,260px)] lg:gap-12">
          {/* The host has to carry a real height: the viewer measures its own
              box every frame and a box of zero height draws nothing. */}
          <div className="field h-[clamp(380px,58vh,560px)] overflow-hidden">
            <PatchCAD src={src} exploded={exploded} selected={picked} onSelect={setPicked} scrollSpin/>
          </div>

          <div>
            <h3 className="font-display text-row font-medium text-ink">Separate the stack</h3>
            <Button variant={exploded ? 'solid' : 'outline'} size="sm" aria-pressed={exploded}
              className="mt-3 w-full" onClick={() => setExploded(v => !v)}>
              {exploded ? 'Put it back together' : 'Pull it apart'}
            </Button>

            <h3 className="mt-8 font-display text-row font-medium text-ink">Take one out</h3>
            <p className="mt-2 max-w-[34ch] text-meta text-ink-3">
              Or click a part in the drawing. Pressing the same layer again brings the rest
              back.
            </p>
            <ul className="mt-3 grid list-none gap-1.5 p-0">
              {PICKS.map((l, i) => {
                const on = picked === l.id
                return (
                  <li key={l.id}>
                    <button type="button" aria-pressed={on}
                      onClick={() => setPicked(on ? null : l.id)}
                      className={cn(CTL, on ? CTL_ON : CTL_OFF)}>
                      <span className={cn('font-mono text-tick tabular-nums',
                        on ? 'text-paper/60' : 'text-ink-3')}>0{i + 1}</span>
                      <span>{pickLabel(l)}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <Button variant="ghost" className="mt-4"
              disabled={!picked && !exploded}
              onClick={() => { setPicked(null); setExploded(false) }}>
              Show the whole stack again
            </Button>
          </div>
        </div>

        {/* The heavy viewer is one link, once, and it states its own price.
            A reader who does not want to spend 9 MB has already been given the
            thing they came for, directly above. */}
        <div className="mt-14 grid gap-6 border-t border-ink pt-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <h3 className="font-display text-row font-medium text-ink">All 183 bodies, not seven groups</h3>
            <p className="mt-2 max-w-[60ch] text-meta text-ink-2">
              The drawing above carries the stack in the seven groups this page names. The
              full interactive CAD holds every body in the package — named section views, a
              continuous explode, a shell-opacity fade and per-component selection. It is a
              9 MB download on its own page, and nothing is fetched there until you ask for
              it.
            </p>
          </div>
          <Button onClick={() => go('cad')} className="justify-self-start lg:justify-self-end">
            Open the interactive CAD
            <span aria-hidden>&rarr;</span>
          </Button>
        </div>
      </section>

      {/* The strongest section on the page, so it gets the band, the largest
          heading below the title and the full page-region step on both edges.
          Burying this would be the expensive mistake: a hardware page that
          claims a finished device is one a reviewer stops trusting. */}
      <section className="border-y border-rule bg-mist">
        <div className="wrap py-20">
          <Label>The honest part</Label>
          <h2 className="mt-3 max-w-[20ch] font-display text-sub font-medium tracking-tight text-ink">
            Eight things this design has not settled
          </h2>
          <p className="mt-5 max-w-[58ch] text-sec text-ink-2">
            The package audits itself against ten requirements and does not pass. What
            follows is that audit in its own words, shortened. None of it is resolved here.
          </p>
          <DemoNotice className="mt-6">
            A valid solid is not proof of mouldability, curvature continuity, electrical
            correctness or clinical performance. MindMap is not a medical device.
          </DemoNotice>

          {/* The two outright failures get the renders, because in both cases
              the picture is the argument: you can see the clearance volume
              sitting inside the battery, and you can see that the optical
              cones are construction geometry rather than simulated light. */}
          <div className="mt-10 grid gap-10 lg:gap-14">
            {OPEN_LEAD.map(o => (
              <div key={o.title} className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
                <div className={cn('border-l-2 pl-5', o.rule)}>
                  <span className={cn('font-mono text-tick uppercase tracking-[0.09em]', o.tone)}>
                    {o.verdict}
                  </span>
                  <h3 className="mt-2 max-w-[24ch] font-display text-head font-medium text-ink">{o.title}</h3>
                  <p className="mt-3 max-w-[48ch] text-meta text-ink-2">{o.text}</p>
                </div>
                <Render id={o.figure} note={o.note}/>
              </div>
            ))}
          </div>

          <ul className="mt-14 grid list-none gap-4 p-0 lg:grid-cols-2">
            {OPEN_REST.map(([verdict, title, text]) => (
              <li key={title} className="h-full">
                <Card className="h-full border-l-2 border-l-warn p-5">
                  <span className="font-mono text-fine uppercase tracking-[0.09em] text-warn">{verdict}</span>
                  <h3 className="mt-1.5 max-w-[30ch] font-display text-row font-medium text-ink">{title}</h3>
                  <p className="mt-2 max-w-[48ch] text-meta text-ink-2">{text}</p>
                </Card>
              </li>
            ))}
          </ul>

          <div className="mt-14 border-t border-ink pt-8">
            <h3 className="font-display text-row font-medium text-ink">What did check out</h3>
            <p className="mt-2 max-w-[64ch] text-meta text-ink-2">
              Two of the ten pass. The flex bend holds its 3.225 mm inner face and 0.15 mm
              stack in every saved state of the model, and every annotation name on every
              render resolves to an entry in the 183-body registry — internal consistency,
              which is not the same as agreement with an engineering BOM nobody has drawn yet.
            </p>
          </div>
        </div>
      </section>

      <section className="wrap py-20">
        <h2 className="mark">Where these numbers come from</h2>
        <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            <p className="max-w-[52ch] text-sec text-ink-2">
              Revision DI-03, 15 September 2026, millimetres throughout. Package outlines and
              the photodiode sensitive area are read off the Analog Devices MAX30102 datasheet;
              the op-amp body is the TI OPA333 / OPA2333 DGK outline; the module geometry is
              Seeed&rsquo;s own XIAO nRF52840 STEP file at its native scale, kept at the size it
              really is rather than resized to agree with our layout.
            </p>
            <p className="mt-4 max-w-[52ch] text-meta text-ink-3">
              The rest — placements, passive values, the battery supplier, the pogo spring
              rate and the LED-to-light-guide coupling — is unresolved, and the renders show
              our assumption rather than a part somebody sells.
            </p>
          </div>
          <div>
            <figure className="m-0">
              {/* Chromium focuses the video's internal control panel rather
                  than the element, so the global :focus-visible rule never
                  paints — a keyboard user reached this control and saw
                  nothing. :focus-within catches the shadow panel too. */}
              <video
                className="h-auto w-full border border-rule bg-card outline-none
                  focus-within:outline focus-within:outline-2 focus-within:outline-offset-2
                  focus-within:outline-accent focus-visible:outline focus-visible:outline-2
                  focus-visible:outline-offset-2 focus-visible:outline-accent"
                width="1280" height="720" controls muted playsInline preload="none"
                poster="/di/video/mindmap-poster.webp"
                aria-label="Twelve-second animation of the MindMap design-intent model separating into its layers and reassembling. Design intent, not as-built.">
                <source src="/di/video/mindmap-12s-60fps.mp4" type="video/mp4"/>
              </video>
              <Stamp>Assembly sweep · 12 s at 60 fps, path-traced from the model geometry</Stamp>
            </figure>
          </div>
        </div>

        <div className="mt-14 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
          <Render id="on-arm" note="generic context anatomy"/>
          <p className="max-w-[52ch] text-meta text-ink-2">
            The arm in that frame is a generic anatomical mesh adapted from the MakeHuman CC0
            base model, fitted locally to the R42 adhesive surface. It is context, not a
            patient scan and not anthropometric validation — it shows where the patch is meant
            to sit and nothing about whether it fits a particular forearm.
          </p>
        </div>
      </section>
    </main>
  )
}
