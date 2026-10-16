import React from 'react'
import { cn } from '../lib/utils'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { ArrowLeft, ArrowRight, ChevronDown } from '../ui/marks'
import { createCinematic } from './cinematic'

/* The interactive CAD on the hardware page.
 * Everything under public/di/arena is VENDORED — regenerated upstream, never
 * edited here. The bundle's own chrome is hidden by the stylesheet below and
 * rebuilt in the site's controls, which drive the element through its public
 * methods. The viewer already carries orbit, explode stages, shell opacity,
 * eight named views, per-component selection and two section cuts.
 * Cost: 620 KB of script, ~20 MB of geometry (9 MB over the wire). Nothing is
 * requested until the box approaches the viewport, and the script is fetched
 * once per page load however many boxes ask for it. */
const SCRIPT = '/di/arena/mindmap-arena.js'
const DATA   = '/di/arena/mindmap-arena.json'
const BASE   = '/di/arena/'

/* The element's colour variables are written as inline style by its own
   setArena(), so a rule in the shadow root cannot beat them. */
const SKIN = {
  bg:     '#dfecee',
  ink:    '#0b2b33',
  panel:  '#ffffff',
  border: '#bed6da',
  accent: '#0a6e68',
}

/* Appended to the shadow root, so it lands after the bundle's own sheet and
   wins on order at equal specificity. */
const SKIN_CSS = `
.shell{border:0;border-radius:0;background:transparent}
.shell header,.shell .notice,.shell .caption,.shell .status-note{display:none!important}
.shell .panel{display:none!important}
.shell .layout{grid-template-columns:minmax(0,1fr)}
.shell .stage{min-height:0;background:transparent}
.busy{background:${SKIN.bg};padding:20px;font-family:Chivo,system-ui,sans-serif}
.busy strong{font-family:Quicksand,system-ui,sans-serif;font-weight:700;font-size:17px;letter-spacing:-.01em}
.busy p{font-size:15px;color:#3c6a74;margin:6px 0 0}
.selection{bottom:16px;left:16px;padding:16px;max-height:min(80%,320px);border:1px solid ${SKIN.border};border-radius:10px;
  box-shadow:5px 5px 0 0 rgb(13 43 30 / .16);font-family:Chivo,system-ui,sans-serif}
.selection h3{font-family:Quicksand,system-ui,sans-serif;font-weight:700;font-size:17px;letter-spacing:-.01em}
.selection p{font-size:13px;color:#1f5560}
.selection .kicker{color:#3c6a74}
.selection-actions{gap:7px}
.selection-actions button{min-height:44px;padding:8px 12px;font-size:13px;border-radius:6px;border-color:#0b2b33}
.selection .close{min-height:34px;min-width:34px;font-size:17px;border:0}
.toast{border:1px solid ${SKIN.border};border-radius:10px;font-family:Chivo,system-ui,sans-serif}
button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid ${SKIN.accent};outline-offset:2px}
@media(max-width:760px){
  .selection{left:12px;right:12px;bottom:12px;max-width:none;max-height:92%;padding:12px}
  .selection h3{font-size:16px}
  .selection p{font-size:12px;margin:4px 0}
  .selection-actions{margin-top:8px}
}
`

/* The eight configurations the model carries. Three stay on the face of the
   card, five behind the disclosure; all eight call setView. */
const VIEWS = {
  closed:    'Closed',
  exploded:  'Exploded',
  arm:       'On the arm',
  ghost:     'See through',
  skin:      'Skin side',
  section_a: 'Section A-A',
  section_b: 'Section B-B',
  optics:    'Optics',
}
const PRIMARY = ['closed', 'exploded', 'arm']
const SECONDARY = ['ghost', 'skin', 'section_a', 'section_b', 'optics']

const STEP = Math.PI / 3
const STEP_MS = 420

const reducedMotion = () => {
  try { return matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

/* The element registers itself globally, so a second mount must not inject a
   second copy of a 620 KB script. One promise, shared. */
let pending = null
function loadViewer() {
  if (pending) return pending
  pending = new Promise((resolve, reject) => {
    if (window.customElements?.get('mindmap-arena')) { resolve(); return }
    const s = document.createElement('script')
    s.src = SCRIPT
    s.async = true
    s.onload = () => customElements.whenDefined('mindmap-arena').then(resolve, reject)
    s.onerror = () => reject(new Error('script'))
    document.head.append(s)
  })
  pending.catch(() => { pending = null })
  return pending
}

/* applyState tints the selected body toward #7091e6 and draws the selection
   box in the same periwinkle — a retired palette, inside a bundle that cannot
   be edited. An own property on the instance runs the real method and then
   repaints those two. */
function greenSelection(a) {
  const any = a.objects.values().next().value
  if (!any) return
  const tint = any.material.color.clone().set(SKIN.accent)
  const box = any.material.color.clone().set('#1d8fb0')
  const base = a.applyState.bind(a)
  a.applyState = () => {
    base()
    const m = a.objects.get(a.selected)
    if (m) {
      m.material.color.setRGB(...a.D.materials[m.userData.material].color)
      m.material.color.lerp(tint, 0.34)
    }
    if (a.selectionBox) a.selectionBox.material.color.copy(box)
  }
}

export const PatchArena = React.forwardRef(function PatchArena(
  { className, view = 'closed', onPlay, onShowAll, beside }, ref) {
  const host = React.useRef(null)
  const el = React.useRef(null)
  const cine = React.useRef(null)
  const spin = React.useRef(0)
  const [playing, setPlaying] = React.useState(false)
  const [armed, setArmed] = React.useState(false)   /* geometry in, sequence available */
  /* 'wait' until the box is near the viewport, 'fetch' while the script is in
     flight, 'live' once mounted, 'error' if the script or WebGL2 is missing. */
  const [phase, setPhase] = React.useState('wait')
  const [mode, setMode] = React.useState(view)
  const [apart, setApart] = React.useState(false)
  const [turning, setTurning] = React.useState(false)
  const [more, setMore] = React.useState(false)

  /* Any reader input takes hold of the model, so the sequence yields first
     and stays yielded. */
  const hold = React.useCallback(() => { cine.current?.stop() }, [])

  const spinOff = React.useCallback(() => {
    const a = el.current
    if (!a?.controls) return
    a.state.rotate = false
    a.controls.autoRotate = false
    /* the element's own Reset reads this button back, so it is kept true even
       though the panel it lives in is not on screen */
    a.shadowRoot?.querySelector('[data-action=rotate]')?.setAttribute('aria-pressed', 'false')
    setTurning(false)
  }, [])

  React.useImperativeHandle(ref, () => ({
    /* The element exposes select() publicly but not group isolation, so this
       repeats its own "Assembly" button, falling back to the group's first
       body if the internals move. */
    isolateGroup(group) {
      const a = el.current
      if (!a || !a.D) return
      hold()
      spinOff()
      try {
        const ids = a.D.parts.filter(p => p.group === group).map(p => p.id)
        if (!ids.length) return
        a.setView('closed')
        a.state.isolate = new Set(ids)
        a.state.hidden.clear()
        a.applyState()
        a.fit()
      } catch {
        try { a.select(a.D.parts.find(p => p.group === group)?.name) } catch {}
      }
    },
    showAll() {
      if (!el.current) return
      hold()
      try { el.current.showAll() } catch {}
    },
  }), [hold, spinOff])

  React.useEffect(() => {
    const node = host.current
    if (!node) return
    let dead = false

    const mount = () => {
      setPhase('fetch')
      loadViewer().then(() => {
        if (dead) return
        const a = document.createElement('mindmap-arena')
        a.setAttribute('src', DATA)
        a.setAttribute('asset-base', BASE)
        a.setAttribute('view', view)
        /* :host declares min-height:680px so the viewer is usable when it is
           the page. Inside a fixed box it takes the box's height. */
        a.style.cssText = 'display:block;height:100%;min-height:0'
        a.addEventListener('mindmap-error', () => { if (!dead) setPhase('error') })
        a.addEventListener('mindmap-view-change', e => {
          if (dead) return
          setMode(e.detail.view)
          /* The model changes its own view (selection card "Section", the
             walkthrough); if it lands on a demoted view the drawer opens. */
          if (!PRIMARY.includes(e.detail.view)) setMore(true)
          /* setView writes the explode value itself and does not announce it,
             so the take-apart control would otherwise stay lit over a model a
             section cut had put back together. */
          setApart(e.detail.view === 'exploded')
        })
        a.addEventListener('mindmap-explode-change', e => { if (!dead) setApart(e.detail.value > 0.02) })
        a.addEventListener('pointerdown', () => { if (!dead) spinOff() }, { capture: true, passive: true })
        el.current = a
        node.append(a)
        /* setArena() runs synchronously inside connectedCallback and writes
           the blue studio onto inline style, so this has to land after the
           append. */
        for (const [k, v] of Object.entries(SKIN)) a.style.setProperty('--' + k, v)
        const sheet = document.createElement('style')
        sheet.textContent = SKIN_CSS
        a.shadowRoot?.append(sheet)
        setPhase('live')
        /* `ready` settles once the 178 bodies are in the scene; the sequence
           writes state.explode and applyState has nothing to write it onto
           until the geometry is there. */
        a.ready.then(() => {
          if (dead) return
          /* The scene paints its own solid background over the page; the
             renderer was already created with alpha. */
          if (a.scene) a.scene.background = null
          greenSelection(a)
          a.applyState()
          const c = createCinematic(a, on => { if (!dead) setPlaying(on) })
          if (!c) return
          cine.current = c
          setArmed(true)
          if (!reducedMotion()) c.start()
        }, () => {})
      }, () => { if (!dead) setPhase('error') })
    }

    if (typeof IntersectionObserver !== 'function') { mount(); return () => { dead = true } }
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { io.disconnect(); mount() }
    }, { rootMargin: '300px' })
    io.observe(node)
    return () => {
      dead = true
      io.disconnect()
      cancelAnimationFrame(spin.current)
      cine.current?.dispose()
      cine.current = null
      el.current?.remove()
      el.current = null
    }
  }, [view, spinOff])

  /* No public method turns the model, so this moves the camera round the point
     the controls already look at. Azimuth only, so a press cannot tip the
     patch onto an edge. */
  const turn = React.useCallback(dir => {
    const a = el.current
    if (!a?.controls || !a.camera) return
    hold()
    spinOff()
    cancelAnimationFrame(spin.current)
    const t = a.controls.target
    const x0 = a.camera.position.x - t.x
    const y0 = a.camera.position.y - t.y
    const r = Math.hypot(x0, y0)
    const z = a.camera.position.z
    const from = Math.atan2(y0, x0)
    const at = f => {
      const ang = from + dir * STEP * f
      a.camera.position.set(t.x + r * Math.cos(ang), t.y + r * Math.sin(ang), z)
      try { a.controls.update() } catch {}
    }
    if (reducedMotion()) { at(1); return }
    const t0 = performance.now()
    const tick = now => {
      const f = Math.min(1, (now - t0) / STEP_MS)
      at(f < 1 ? 1 - Math.pow(1 - f, 3) : 1)
      if (f < 1) spin.current = requestAnimationFrame(tick)
    }
    spin.current = requestAnimationFrame(tick)
    try { a.startLoop() } catch {}
  }, [hold, spinOff])

  const rotate = React.useCallback(() => {
    const a = el.current
    if (!a?.controls) return
    if (a.controls.autoRotate) { spinOff(); return }
    hold()
    cancelAnimationFrame(spin.current)
    a.state.rotate = true
    a.controls.autoRotate = true
    a.shadowRoot?.querySelector('[data-action=rotate]')?.setAttribute('aria-pressed', 'true')
    setTurning(true)
    try { a.startLoop() } catch {}
  }, [hold, spinOff])

  const show = React.useCallback(name => {
    const a = el.current
    if (!a) return
    hold()
    spinOff()
    try { a.setView(name) } catch {}
  }, [hold, spinOff])

  const takeApart = React.useCallback(on => {
    const a = el.current
    if (!a) return
    hold()
    try { a.setExplode(on ? 1 : 0, { animate: !reducedMotion() }) } catch {}
  }, [hold])

  const walk = React.useCallback(() => {
    if (playing) { cine.current?.stop(); return }
    onPlay?.()
    spinOff()
    cine.current?.start()
  }, [playing, onPlay, spinOff])

  const live = phase === 'live' && armed
  /* 44px is the control floor and text-fine the smallest step that carries a
     control label. */
  const key = 'min-h-[44px] px-3 text-fine'
  const viewKey = id => (
    <Button key={id} size="sm" variant={mode === id && !playing ? 'solid' : 'outline'}
      aria-pressed={mode === id && !playing} disabled={!live}
      onClick={() => show(id)} className={key}>{VIEWS[id]}</Button>
  )

  return (
    /* shadow-raise is the site's one depth mechanism: a hard offset, no blur.
       On the ink band it lands at 10% ink over ink and is invisible there; the
       white surface against the dark ground is the separation instead. */
    <Card className={cn('flex w-full flex-col shadow-raise', className)}>
      <div className="grid lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        {/* The stage owns its height: a fixed-height parent shared with the
            controls collapsed the canvas to ~100px on a phone. Framing follows
            canvas aspect — half-width = max(38mm, half-height x aspect) x 1.4
            — so a 2.2:1 stage draws the patch at a third of its width, and
            beside a 320px column (near 1.4:1) about two thirds across. */}
        <div className="relative order-1 h-[min(62vw,300px)] bg-mist lg:order-2
          lg:h-[min(50vh,440px)] lg:border-l lg:border-rule">
          <div ref={host} className="h-full w-full"/>
          {phase !== 'live' && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              {phase === 'error' ? (
                <p className="max-w-[34ch] text-sec text-ink-2">
                  The 3D model needs WebGL2, off in this browser. The drawing beside it shows
                  the same three parts.
                </p>
              ) : (
                <p className="max-w-[30ch] text-sec text-ink-3">
                  {phase === 'fetch' ? 'Loading the model…' : 'The model loads when you reach it.'}
                </p>
              )}
            </div>
          )}
        </div>

        {beside && (
          <div className="order-2 border-t border-rule px-4 py-4 lg:order-1 lg:border-t-0 lg:px-5">
            {beside}
          </div>
        )}
      </div>

      <div className="border-t border-rule px-4 py-3 lg:px-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <div role="group" aria-label="View" className="flex flex-wrap items-center gap-1.5">
            {PRIMARY.map(viewKey)}
          </div>
          <span aria-hidden className="mx-1 hidden h-6 w-px bg-rule sm:block"/>
          <div role="group" aria-label="Turn the model" className="flex items-center gap-1.5">
            {/* Icon-only: the pair of words pushes this row onto a second
                line at 390px. The name is still on the button for screen
                readers. */}
            <Button size="sm" variant="outline" disabled={!live} onClick={() => turn(1)}
              className={cn(key, 'min-w-[44px] px-0')}>
              <ArrowLeft/><span className="sr-only">Turn left</span>
            </Button>
            <Button size="sm" variant="outline" disabled={!live} onClick={() => turn(-1)}
              className={cn(key, 'min-w-[44px] px-0')}>
              <ArrowRight/><span className="sr-only">Turn right</span>
            </Button>
          </div>
          <Button size="sm" variant={playing ? 'solid' : 'outline'} aria-pressed={playing}
            disabled={!live} onClick={walk} className={key}>
            {playing ? 'Stop' : 'Walkthrough'}
          </Button>
          <Button size="sm" variant="outline" disabled={!live} aria-expanded={more}
            aria-controls="arena-more" onClick={() => setMore(v => !v)} className={key}>
            More
            <ChevronDown className={cn('transition-transform duration-150', more && 'rotate-180')}/>
          </Button>
        </div>
        {more && (
          <div id="arena-more" className="mt-2.5 flex flex-wrap items-center gap-1.5
            border-t border-rule pt-2.5">
            {SECONDARY.map(viewKey)}
            <Button size="sm" variant={turning ? 'solid' : 'outline'} aria-pressed={turning}
              disabled={!live} onClick={rotate} className={key}>Keep turning</Button>
            <Button size="sm" variant={apart ? 'solid' : 'outline'} aria-pressed={apart}
              disabled={!live} onClick={() => takeApart(!apart)} className={key}>
              {apart ? 'Put together' : 'Take apart'}
            </Button>
            {/* onShowAll: the part cards beside the figure isolate an
                assembly, and without this the rail went on reading "Showing
                only this" over a model showing everything. */}
            <Button size="sm" variant="outline" disabled={!live}
              onClick={() => { hold(); spinOff(); onShowAll?.(); try { el.current?.showAll() } catch {} }}
              className={key}>
              Show every part
            </Button>
          </div>
        )}
        <p className="note mt-2">Drag to turn, scroll to zoom. Click any part to name it.</p>
      </div>
    </Card>
  )
})
