import React from 'react'
import { cn } from '../lib/utils'
import { Button } from '../ui/button'
import { ArrowLeft, ArrowRight } from '../ui/marks'
import { createCinematic } from './cinematic'

/* The interactive CAD, sitting directly on the hardware page.
 *
 * This is the viewer that ships with the model rather than a second one
 * written here: it already carries orbit, the explode stages, shell opacity,
 * eight named views, per-component selection and the two section cuts.
 * Rebuilding a subset of that around a plain GLB would mean a viewer that
 * turns and explodes but cannot section, which is most of the point.
 *
 * What it does NOT get to keep is its own dress. It ships a bordered shell, a
 * header reading "Interactive CAD", a 250px sidebar of its own buttons and a
 * notice bar along the bottom — a widget sitting on the page rather than part
 * of it, in a blue studio palette this site no longer uses anywhere. All of
 * that is hidden below and rebuilt in the site's own controls, which drive the
 * element through its public methods. The vendor bundle is not modified.
 *
 * What it costs: 620 KB of script and about 20 MB of geometry (9 MB over the
 * wire). None of it is requested until the box is actually approaching the
 * viewport, and the script is fetched once per page load however many boxes
 * ask for it. */
const SCRIPT = '/di/arena/mindmap-arena.js'
const DATA   = '/di/arena/mindmap-arena.json'
const BASE   = '/di/arena/'

/* The element's four colour variables are written as inline style by its own
   setArena(), so a rule in the shadow root cannot beat them — only another
   inline write can. These are mist, ink, card, rule and accent: the ground the
   figure sits on, and the ink and rule the page uses around it. */
const SKIN = {
  bg:     '#e3ede7',
  ink:    '#0d2b1e',
  panel:  '#ffffff',
  border: '#c2d7ca',
  accent: '#157446',
}

/* Appended to the shadow root, so it lands after the bundle's own sheet and
   wins on order at equal specificity. Two jobs: delete the furniture that made
   the model read as an embed, and put the parts that stay — the loading state,
   the component card a click opens, the toast — on this site's surfaces, type
   and 44px controls. */
const SKIN_CSS = `
.shell{border:0;border-radius:0;background:transparent}
.shell header,.shell .notice,.shell .caption,.shell .status-note{display:none!important}
.shell .panel{display:none!important}
.shell .layout{grid-template-columns:minmax(0,1fr)}
.shell .stage{min-height:0;background:transparent}
.busy{background:${SKIN.bg};padding:20px;font-family:Chivo,system-ui,sans-serif}
.busy strong{font-family:Quicksand,system-ui,sans-serif;font-weight:700;font-size:17px;letter-spacing:-.01em}
.busy p{font-size:15px;color:#47705e;margin:6px 0 0}
.selection{bottom:16px;left:16px;padding:16px;max-height:min(80%,320px);border:1px solid ${SKIN.border};border-radius:10px;
  box-shadow:5px 5px 0 0 rgb(13 43 30 / .16);font-family:Chivo,system-ui,sans-serif}
.selection h3{font-family:Quicksand,system-ui,sans-serif;font-weight:700;font-size:17px;letter-spacing:-.01em}
.selection p{font-size:13px;color:#2a5744}
.selection .kicker{color:#47705e}
.selection-actions{gap:7px}
.selection-actions button{min-height:44px;padding:8px 12px;font-size:13px;border-radius:6px;border-color:#0d2b1e}
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

/* The eight configurations the model actually carries. Titles are the plain
   ones: nothing here is named anything a reader has to decode. */
const VIEWS = [
  ['closed',    'Closed'],
  ['exploded',  'Exploded'],
  ['ghost',     'See through'],
  ['skin',      'Skin side'],
  ['section_a', 'Section A-A'],
  ['section_b', 'Section B-B'],
  ['arm',       'On the arm'],
  ['optics',    'Optics'],
]

/* One sixth of a turn per press: far enough that the shape moves, short enough
   that a reader can walk it round with repeated presses. */
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
   box in the same periwinkle — two marks from the palette this site replaced,
   both written inside a bundle that cannot be edited. An own property on the
   instance runs the real method and then repaints those two, which is the same
   hook the walkthrough already uses on draw(). */
function greenSelection(a) {
  const any = a.objects.values().next().value
  if (!any) return
  const tint = any.material.color.clone().set(SKIN.accent)
  const box = any.material.color.clone().set('#0e9c9c')
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

export const PatchArena = React.forwardRef(function PatchArena({ className, view = 'closed', onPlay }, ref) {
  const host = React.useRef(null)
  const el = React.useRef(null)
  /* the walkthrough, once the geometry is in and the box is on screen */
  const cine = React.useRef(null)
  const spin = React.useRef(0)
  const [playing, setPlaying] = React.useState(false)
  const [armed, setArmed] = React.useState(false)   /* geometry in, sequence available */
  /* 'wait' until the box is near the viewport, 'fetch' while the script is in
     flight, 'live' once the element is mounted and showing its own progress,
     'error' if either the script or WebGL2 is unavailable. */
  const [phase, setPhase] = React.useState('wait')
  const [mode, setMode] = React.useState(view)
  const [apart, setApart] = React.useState(false)
  const [turning, setTurning] = React.useState(false)

  /* Anything the reader does to the model is the reader taking hold of it, so
     the sequence yields first and stays yielded. */
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
    /* The three part cards under the model isolate an assembly. The element
       exposes select() publicly but not group isolation, so this repeats what
       its own "Assembly" button does, and falls back to selecting the first
       body of the group if the internals ever move. */
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
           the page. Inside a fixed box it takes the box's height instead. */
        a.style.cssText = 'display:block;height:100%;min-height:0'
        a.addEventListener('mindmap-error', () => { if (!dead) setPhase('error') })
        /* the element is the one that knows which view is on screen: the
           explode control and the selection card both move it themselves */
        a.addEventListener('mindmap-view-change', e => {
          if (dead) return
          setMode(e.detail.view)
          /* setView writes the explode value itself and does not announce it,
             so the take-apart control would otherwise stay lit over a model
             that had been put back together by a section cut. */
          setApart(e.detail.view === 'exploded')
        })
        a.addEventListener('mindmap-explode-change', e => { if (!dead) setApart(e.detail.value > 0.02) })
        /* a drag is the reader steering; nothing should be steering back */
        a.addEventListener('pointerdown', () => { if (!dead) spinOff() }, { capture: true, passive: true })
        el.current = a
        node.append(a)
        /* setArena() runs synchronously inside connectedCallback and writes the
           blue studio onto the element's inline style, so this has to land
           after the append rather than before it. */
        for (const [k, v] of Object.entries(SKIN)) a.style.setProperty('--' + k, v)
        const sheet = document.createElement('style')
        sheet.textContent = SKIN_CSS
        a.shadowRoot?.append(sheet)
        setPhase('live')
        /* `ready` settles once the 178 bodies are in the scene. The sequence
           cannot be armed before that: it writes state.explode, and applyState
           has nothing to write it onto until the geometry is there. */
        a.ready.then(() => {
          if (dead) return
          /* The scene paints its own solid background over the page. Dropping
             it is what puts the model on the page's ground instead of on a
             panel of its own — the renderer was already created with alpha. */
          if (a.scene) a.scene.background = null
          greenSelection(a)
          a.applyState()
          const c = createCinematic(a, on => { if (!dead) setPlaying(on) })
          if (!c) return
          cine.current = c
          setArmed(true)
          /* reduce: the model stays closed and still, and the buttons are the
             only things that will ever move it */
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
      /* disconnectedCallback disposes the renderer and every buffer. */
      el.current?.remove()
      el.current = null
    }
  }, [view, spinOff])

  /* The element publishes no method for turning the model, so this does what
     the walkthrough does: it moves the camera round the point the controls are
     already looking at, and lets the element's own loop draw it. Azimuth only,
     so a press cannot tip the patch onto an edge the reader then has to
     recover from. */
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
  /* Compact because there are fourteen of them and they are the interface, not
     a band of buttons over it. 44px is the floor and text-fine is the smallest
     step that carries a control label. */
  const key = 'min-h-[44px] px-3 text-fine'

  return (
    <div className={cn('flex w-full flex-col', className)}>
      {/* The stage owns its height here rather than taking it from whatever box
          the page puts it in. A fixed-height parent shared with the controls
          was collapsing the canvas to a hundred pixels on a phone, where the
          controls wrap to six rows — and the framing the model is drawn with is
          a function of the canvas aspect, so a squashed canvas draws a small
          model floating in an empty field. */}
      <div className="relative h-[min(40vh,280px)] lg:h-[min(58vh,470px)]">
        <div ref={host} className="h-full w-full"/>
        {phase !== 'live' && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            {phase === 'error' ? (
              <p className="max-w-[34ch] text-sec text-ink-2">
                The 3D model needs WebGL2, which this browser has turned off. The drawing beside it
                shows the same three parts.
              </p>
            ) : (
              <p className="max-w-[30ch] text-sec text-ink-3">
                {phase === 'fetch' ? 'Loading the model…' : 'The model loads when you reach it.'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* A rule, not a box: the controls belong to the figure above them the
          way a key belongs to a drawing. */}
      <div className="mt-3 border-t border-rule pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="tick mr-1 shrink-0">Views</span>
          {VIEWS.map(([id, label]) => (
            <Button key={id} size="sm" variant={mode === id && !playing ? 'solid' : 'outline'}
              aria-pressed={mode === id && !playing} disabled={!live}
              onClick={() => show(id)} className={key}>{label}</Button>
          ))}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="tick mr-1 shrink-0">Turn</span>
          <Button size="sm" variant="outline" disabled={!live} onClick={() => turn(1)} className={key}>
            <ArrowLeft/>Left
          </Button>
          <Button size="sm" variant="outline" disabled={!live} onClick={() => turn(-1)} className={key}>
            Right<ArrowRight/>
          </Button>
          <Button size="sm" variant={turning ? 'solid' : 'outline'} aria-pressed={turning}
            disabled={!live} onClick={rotate} className={key}>Keep turning</Button>
          <Button size="sm" variant={apart ? 'solid' : 'outline'} aria-pressed={apart}
            disabled={!live} onClick={() => takeApart(!apart)} className={key}>
            {apart ? 'Put together' : 'Take apart'}
          </Button>
          <Button size="sm" variant="outline" disabled={!live}
            onClick={() => { hold(); spinOff(); try { el.current?.showAll() } catch {} }} className={key}>
            Show every part
          </Button>
          <Button size="sm" variant={playing ? 'solid' : 'outline'} aria-pressed={playing}
            disabled={!live} onClick={walk} className={key}>Walkthrough</Button>
        </div>
        {/* The viewer used to say this along the bottom of the canvas in 10px
            mono. It is one line of the page's own type instead. */}
        <p className="note mt-2">Drag the model to turn it. Scroll to zoom. Click any part to name it.</p>
      </div>
    </div>
  )
})
