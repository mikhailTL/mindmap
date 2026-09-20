import React from 'react'
import { cn } from '../lib/utils'

/* The interactive CAD, mounted inside the hardware page's model box.
 *
 * This is the viewer that ships with the model rather than a second one
 * written here: it already carries every control the box needs — orbit, the
 * explode slider with Explode/Assemble, shell opacity, the named views
 * (closed, exploded, see-through, skin-side, section A-A, section B-B, on the
 * arm, optical module), per-component selection and isolation. Rebuilding a
 * subset of that around a plain GLB would mean a viewer that turns and
 * explodes but cannot section, which is most of the point.
 *
 * What it costs: 620 KB of script and about 20 MB of geometry (9 MB over the
 * wire). None of it is requested until the box is actually approaching the
 * viewport, and the script is fetched once per page load however many boxes
 * ask for it. */
const SCRIPT = '/di/arena/mindmap-arena.js'
const DATA   = '/di/arena/mindmap-arena.json'
const BASE   = '/di/arena/'

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

export const PatchArena = React.forwardRef(function PatchArena({ className, view = 'closed' }, ref) {
  const host = React.useRef(null)
  const el = React.useRef(null)
  /* 'wait' until the box is near the viewport, 'fetch' while the script is in
     flight, 'live' once the element is mounted and showing its own progress,
     'error' if either the script or WebGL2 is unavailable. */
  const [phase, setPhase] = React.useState('wait')

  React.useImperativeHandle(ref, () => ({
    /* The three part cards under the model isolate an assembly. The element
       exposes select() publicly but not group isolation, so this repeats what
       its own "Assembly" button does, and falls back to selecting the first
       body of the group if the internals ever move. */
    isolateGroup(group) {
      const a = el.current
      if (!a || !a.D) return
      try {
        const ids = a.D.parts.filter(p => p.group === group).map(p => p.id)
        if (!ids.length) return
        a.setView('closed')
        a.state.isolate = new Set(ids)
        a.state.hidden.clear()
        a.applyState()
        a.fit()
        /* the viewer titles its own view; say which assembly is showing */
        const t = a.shadowRoot?.querySelector('#view-title')
        if (t) t.textContent = group
      } catch {
        try { a.select(a.D.parts.find(p => p.group === group)?.name) } catch {}
      }
    },
    showAll() { try { el.current?.showAll() } catch {} },
  }), [])

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
        el.current = a
        node.append(a)
        setPhase('live')
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
      /* disconnectedCallback disposes the renderer and every buffer. */
      el.current?.remove()
      el.current = null
    }
  }, [view])

  return (
    <div ref={host} className={cn('relative h-full w-full', className)}>
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
  )
})
