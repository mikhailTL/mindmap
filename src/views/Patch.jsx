import React from 'react'

/* The exploded drawing is DI-03 now: a CAD-derived assembly delivered as a
   self-contained custom element with its own shadow root.

   What used to live here — `Shell`, `Board` and `Face`, three hand-drawn SVGs
   on a 440x260 canvas — was made before any CAD existed and disagrees with the
   package on every point that matters: the silhouette is a continuous spline
   lozenge at 64 x 42 mm, not a 2.8:1 stadium; there are seven layers, not
   three; and the electronics layer is a flex-rigid PCB with a rigid island and
   a polyimide flex bend, not a tray with a board dropped into it. Keeping a
   second, wrong drawing beside the real one is how a reader ends up believing
   the wrong one, so the three constants are deleted rather than deprecated.
   `<mindmap-exploded>` replaces all three, and LAYERS below is the written
   account of that drawing rather than the drawing itself.

   DESIGN INTENT — NOT AS-BUILT. Every dimension and material named here is
   assigned in the design-intent CAD. Nothing on this page was measured from
   hardware, no unit has been assembled, and no performance figure follows from
   any of it. */

const TAG = 'mindmap-exploded'
const SCRIPT = '/di/exploded/mindmap-exploded.js'

/* The only <img> anywhere on this site, and only when the script does not
   arrive: the same drawing exported flat. A drawing that fails to load should
   degrade to a picture of itself, not to a hole where the mechanism was. */
const FLAT = '/di/exploded/MindMap-Exploded-Technical.svg'

/* Seven layers, outermost first, named and described from the package's
   GEOMETRY.md so the prose beside the drawing cannot drift from the drawing.
   `part` is the layer's own slug. It is no longer a body in the DI-01
   enclosure GLB — that model holds three printed parts and this stack has
   seven — so a caller that feeds `part` to the CAD viewer will be asking it to
   isolate something it does not contain. */
export const LAYERS = [
  { i: 0, part: 'shell-core', title: 'Shell rigid core',
    body: 'Encloses the stack; the bonded TPE band, the pre-weld director and the port door stay in its assembly group.' },
  { i: 1, part: 'light-guide', title: 'PMMA status light guide',
    body: 'Routes the status LED out to the slot in the perimeter.' },
  { i: 2, part: 'battery', title: 'Conformal LiPo pouch',
    body: 'Supplies the modelled battery volume, with its seal flange and welded tabs.' },
  { i: 3, part: 'pcb', title: 'Flex-rigid PCB rigid island',
    body: 'Carries the XIAO, the MAX30102 optical sensor, the analog front end, passives, routing and the flex bend as one soldered subassembly.' },
  { i: 4, part: 'thermal-pocket', title: 'Thermal foam isolation pocket',
    body: 'Isolates the modelled thermal contact path and its conductive epoxy layer.' },
  { i: 5, part: 'skin-shell', title: 'Skin-side shell',
    body: 'Holds the electrodes, the two optical windows, the opaque rib, the gasket and the pressure and acoustic features.' },
  { i: 6, part: 'adhesive-base', title: 'Medical PU adhesive base',
    body: 'Carries the conforming attachment layer and the modelled clearances around the sensing interfaces.' },
]

/* Built from LAYERS rather than typed out, so the name a screen reader hears
   cannot fall out of step with the list the page prints. */
const NAME = 'Exploded assembly drawing, design intent rather than as-built: seven layers, outermost first — '
  + LAYERS.map(l => l.title.toLowerCase()).join(', ') + '.'

/* One <script> for the whole application, tracked by a promise at module scope
   AND by an attribute on the tag itself. StrictMode invokes every effect twice
   and a page can mount more than one of these; a second `customElements.define`
   of a name that is already taken throws, and the throw would take the whole
   render down with it. */
let loading = null
function loadDrawing() {
  if (loading) return loading
  if (typeof document === 'undefined') return Promise.reject(new Error(TAG))
  loading = new Promise((resolve, reject) => {
    if (customElements.get(TAG)) return resolve()
    let el = document.querySelector(`script[data-di="${TAG}"]`)
    if (!el) {
      el = document.createElement('script')
      el.src = SCRIPT
      el.async = true
      el.dataset.di = TAG
      document.head.append(el)
    }
    el.addEventListener('load', () => resolve(), { once: true })
    el.addEventListener('error', () => reject(new Error(TAG)), { once: true })
  }).then(() => customElements.whenDefined(TAG))
  return loading
}

/* The component measures its own width and derives everything else from it: a
   layer drawn at 0.64x that width clamped to 270-470px, a stage 2.25x the layer,
   and below 560px a column of seven face-on sheets at the SVG's own 360:260
   with 24px between them, inside 8px of stage padding. Running the same
   arithmetic here holds the box open from the first paint, so the page does not
   jump when the element upgrades.

   CHROME is the component's header and caption, which is the one part that
   cannot be derived: both wrap inside the shadow root at widths we do not
   control, and measuring across 300-1328px put them between 140px and 218px.
   The floor takes the top of that range rather than the average. A floor that
   is never shorter than the drawing cannot produce a jump; a floor fitted to
   the mean would jump at every width it missed, and the price is at most 80px
   of paper under a drawing that is already 1200px tall. */
const CHROME = 224
const reserveFor = w => Math.round(w < 560
  ? 7 * w * (260 / 360) + 6 * 24 + 16 + CHROME
  : 2.25 * Math.min(470, Math.max(270, w * 0.64)) + CHROME)

/* Callers still size this figure with a fixed height left over from the old
   three-layer stack — `h-[min(52vh,440px)]` and friends. The DI-03 drawing
   cannot fit in 440px: its own floor is a 270px layer, which is a 608px stage
   before the header, and on a narrow column it is a 2000px sheet column. A
   height that small would either clip the drawing or overlap whatever follows
   it, so height classes are dropped and the reserved height above stands in
   their place. Everything else the caller passes is kept. */
const dropHeight = (s = '') =>
  s.split(/\s+/).filter(c => c && !/(^|:)(h|min-h|max-h)-/.test(c)).join(' ')

/* Signature is unchanged because four views import it. `shift` and `size` are
   now accepted and ignored: both addressed a stack this file drew and no
   longer owns. `shift` recentred a tipped three-layer stack that drifted off
   its own bounding box, and `size` set a per-layer width — the component
   centres itself and derives its layer width from its own box, capping at the
   same 470px the hero used to ask for. `caption` still prints, but it defaults
   to nothing now: the drawing already carries its own caption inside the
   shadow root, and a second one underneath says the same thing twice. */
export function ExplodedStack({ className, caption = null, shift, size }) {
  const box = React.useRef(null)
  const [failed, setFailed] = React.useState(false)
  const [reserve, setReserve] = React.useState(null)

  React.useEffect(() => {
    let live = true
    loadDrawing().catch(() => { if (live) setFailed(true) })
    return () => { live = false }
  }, [])

  React.useLayoutEffect(() => {
    const el = box.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const measure = () => { if (el.clientWidth) setReserve(reserveFor(el.clientWidth)) }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    /* All four palette properties are declared on the wrapper and inherit
       across the shadow boundary, which is also how the package's own
       integration note binds them. Two reasons they cannot go on the element:
       React 18 does not map `className` onto a custom element at all, so the
       classes would silently never land; and the component's own :host rule is
       `color: var(--fig-ink, inherit)`, so `--fig-ink: currentColor` declared
       on the element would make its colour refer to itself. One level up it
       resolves against `text-ink`, and the component gets a real ink value to
       measure its own faint-line contrast against. */
    <div ref={box} style={reserve ? { minHeight: reserve } : undefined}
      className={`relative text-ink [--fig-ink:currentColor]
        [--fig-accent:theme(colors.accent.DEFAULT)] [--fig-face:theme(colors.card)]
        [--fig-recess:theme(colors.mist)] ${dropHeight(className)}`}>
      {/* The name lives out here and the drawing is hidden beneath it. The
          component ships an explode slider inside its shadow root, and a
          control that can take focus inside an aria-hidden subtree is
          unreachable to a screen reader while still being tabbable — so the
          drawing is presented as a figure and `inert` withdraws the control
          rather than leaving it half-exposed. The seven layers are named in
          page text by every view that uses this. */}
      <div role="img" aria-label={NAME}>
        {failed
          ? <img src={FLAT} alt="" aria-hidden="true" className="block w-full"/>
          : <mindmap-exploded aria-hidden="true" inert=""/>}
      </div>
      {caption && <span className="note mt-2 block text-center">{caption}</span>}
    </div>
  )
}
