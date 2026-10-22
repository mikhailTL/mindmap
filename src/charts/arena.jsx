import React from 'react'
import { cn } from '../lib/utils'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { ArrowLeft, ArrowRight, ChevronDown } from '../ui/marks'
import { createCinematic } from './cinematic'

// Interactive CAD viewer. public/di/arena is a vendored bundle: its own controls are hidden by SKIN_CSS
// and rebuilt here on the element's public methods. Nothing loads until the box nears the viewport.
const SCRIPT = '/di/arena/mindmap-arena.js'
const DATA   = '/di/arena/mindmap-arena.json'
const BASE   = '/di/arena/'

// setArena() writes these as inline style, so a shadow-root rule cannot override them; they are set after append.
const SKIN = {
  bg:     '#e3ede7',
  ink:    '#0d2b1e',
  panel:  '#ffffff',
  border: '#c2d7ca',
  accent: '#157446',
}

const SKIN_CSS = `
.shell{border:0;border-radius:0;background:transparent}
.shell header,.shell .notice,.shell .caption,.shell .status-note{display:none!important}
.shell .panel{display:none!important}
.shell .layout{grid-template-columns:minmax(0,1fr)}
.shell .stage{min-height:0;background:transparent}
.busy{background:${SKIN.bg};padding:20px;font-family:Chivo,system-ui,sans-serif}
.busy strong{font-family:Quicksand,system-ui,sans-serif;font-weight:700;font-size:17px;letter-spacing:-.01em}
.busy p{font-size:15px;color:#426a58;margin:6px 0 0}
.selection{bottom:16px;left:16px;padding:16px;max-height:min(80%,320px);border:1px solid ${SKIN.border};border-radius:10px;
  box-shadow:5px 5px 0 0 rgb(13 43 30 / .16);font-family:Chivo,system-ui,sans-serif}
.selection h3{font-family:Quicksand,system-ui,sans-serif;font-weight:700;font-size:17px;letter-spacing:-.01em}
.selection p{font-size:13px;color:#2a5744}
.selection .kicker{color:#426a58}
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

// The element registers globally, so the 620 KB script is loaded once per page however many viewers mount.
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

// applyState draws selection in periwinkle #7091e6; an own property on the instance runs it, then repaints in green.
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
  { className, view = 'closed', onPlay, onShowAll, onError, beside }, ref) {
  const host = React.useRef(null)
  const el = React.useRef(null)
  const cine = React.useRef(null)
  const spin = React.useRef(0)
  const [playing, setPlaying] = React.useState(false)
  const [armed, setArmed] = React.useState(false)   /* geometry in, sequence available */
  const [phase, setPhase] = React.useState('wait')
  const [mode, setMode] = React.useState(view)
  const [apart, setApart] = React.useState(false)
  const [turning, setTurning] = React.useState(false)
  const [more, setMore] = React.useState(false)

  const failed = React.useRef(onError)
  failed.current = onError
  React.useEffect(() => { if (phase === 'error') failed.current?.() }, [phase])

  const hold = React.useCallback(() => { cine.current?.stop() }, [])

  const spinOff = React.useCallback(() => {
    const a = el.current
    if (!a?.controls) return
    a.state.rotate = false
    a.controls.autoRotate = false
    a.shadowRoot?.querySelector('[data-action=rotate]')?.setAttribute('aria-pressed', 'false')
    setTurning(false)
  }, [])

  React.useImperativeHandle(ref, () => ({
    // Group isolation is not public, so this repeats the element's Assembly button, falling back to the group's first body.
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
        // :host sets min-height 680px; inside a fixed box the viewer takes the box's height.
        a.style.cssText = 'display:block;height:100%;min-height:0'
        a.addEventListener('mindmap-error', () => { if (!dead) setPhase('error') })
        a.addEventListener('mindmap-view-change', e => {
          if (dead) return
          setMode(e.detail.view)
          if (!PRIMARY.includes(e.detail.view)) setMore(true)
          // setView changes the explode value without an event, so the take-apart state follows the view.
          setApart(e.detail.view === 'exploded')
        })
        a.addEventListener('mindmap-explode-change', e => { if (!dead) setApart(e.detail.value > 0.02) })
        a.addEventListener('pointerdown', () => { if (!dead) spinOff() }, { capture: true, passive: true })
        el.current = a
        node.append(a)
        for (const [k, v] of Object.entries(SKIN)) a.style.setProperty('--' + k, v)
        const sheet = document.createElement('style')
        sheet.textContent = SKIN_CSS
        a.shadowRoot?.append(sheet)
        setPhase('live')
        a.ready.then(() => {
          if (dead) return
          // The renderer has alpha, so clearing the scene background shows the page behind it.
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

  // No public method turns the model, so this orbits the camera about the controls target, azimuth only.
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
  const key = 'min-h-[44px] px-3 text-fine'
  const viewKey = id => (
    <Button key={id} size="sm" variant={mode === id && !playing ? 'solid' : 'outline'}
      aria-pressed={mode === id && !playing} disabled={!live}
      onClick={() => show(id)} className={key}>{VIEWS[id]}</Button>
  )

  return (
    <Card className={cn('flex w-full flex-col shadow-raise', className)}>
      <div className="grid lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
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
