import React from 'react'
import { cn } from '../lib/utils'
import { Button } from '../ui/button'
import { createCinematic } from './cinematic'

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

export const PatchArena = React.forwardRef(function PatchArena({ className, view = 'closed', onPlay }, ref) {
  const host = React.useRef(null)
  const el = React.useRef(null)
  /* the walkthrough, once the geometry is in and the box is on screen */
  const cine = React.useRef(null)
  const [playing, setPlaying] = React.useState(false)
  const [armed, setArmed] = React.useState(false)   /* geometry in, sequence available */
  const [seen, setSeen] = React.useState(false)
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
      /* a part card is the user taking hold of the model as much as a drag is */
      cine.current?.stop()
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
    showAll() {
      if (!el.current) return
      cine.current?.stop()
      try { el.current.showAll() } catch {}
    },
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
        /* `ready` settles once the 178 bodies are in the scene. The sequence
           cannot be armed before that: it writes state.explode, and applyState
           has nothing to write it onto until the geometry is there. */
        a.ready.then(() => {
          if (dead) return
          const c = createCinematic(a, on => { if (!dead) { setPlaying(on); if (on) setSeen(true) } })
          if (!c) return
          cine.current = c
          setArmed(true)
          /* reduce: the model stays closed and still, and the button is the
             only thing that will ever move it */
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
      cine.current?.dispose()
      cine.current = null
      /* disconnectedCallback disposes the renderer and every buffer. */
      el.current?.remove()
      el.current = null
    }
  }, [view])

  /* The element is appended imperatively, so it is already in the box when
     React first inserts the button — and React, which does not know that node,
     appends after it. That put the button behind the viewer's own fifteen
     tabbable controls: a keyboard user reaching for "play again" had to pass
     through Reset, Save view and all eight named views first. The button is
     therefore a sibling ahead of the box rather than a child of it, which is
     the only thing that fixes the order. */
  return (
    <div className={cn('relative h-full w-full', className)}>
      {/* The sequence yields to the first touch and then stays yielded, so this
          is the way back to it. It sits clear of the viewer's own furniture:
          the panel and the selection card are on the left, the activity card is
          top right at 100px, and the status line runs along the bottom of the
          stage above a notice bar that is one line wide and two lines narrow —
          hence the two offsets, because at 390 a single one sat on the line
          that tells the user they can drag the model.
          Hidden while the sequence is running so it is not covering the model
          for the twelve-thirteenths of the time nobody needs it. */}
      {phase === 'live' && armed && !playing && (
        <Button variant="outline" size="sm"
          onClick={() => { onPlay?.(); cine.current?.start() }}
          className="absolute bottom-[88px] right-5 z-10 bg-card/95 text-ui shadow-lift
            backdrop-blur-[2px] hover:bg-mist sm:bottom-[76px]">
          {seen ? 'Play again' : 'Play the walkthrough'}
        </Button>
      )}
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
  )
})
