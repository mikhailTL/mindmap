import React from 'react'
import { cn } from '../../lib/utils'
import { SCENES, FallbackScene } from './scenes.jsx'
import { paletteFor } from './palettes.js'
import './nameplates.css'

// One shared IntersectionObserver pauses the loop of any banner scrolled out of view.
let watcher = null
const watch = el => {
  if (typeof IntersectionObserver === 'undefined' || !el) return () => {}
  if (!watcher) {
    watcher = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) e.target.removeAttribute('data-off')
        else e.target.setAttribute('data-off', '')
      }
    }, { rootMargin:'80px' })
  }
  watcher.observe(el)
  return () => watcher && watcher.unobserve(el)
}

export function Nameplate({ item, index = 0, onOpen = () => {} }) {
  const ref = React.useRef(null)
  const u = 'np' + React.useId().replace(/[^a-zA-Z0-9]/g, '')
  const p = paletteFor(item.id, item.family)
  const Scene = SCENES[item.id]
  React.useEffect(() => watch(ref.current), [])

  // Writes the tilt straight to the element's style, so pointer moves do not re-render.
  const onMove = e => {
    if (e.pointerType !== 'mouse' || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--px', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3))
    ref.current.style.setProperty('--py', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3))
  }
  const onLeave = () => {
    ref.current?.style.setProperty('--px', '0')
    ref.current?.style.setProperty('--py', '0')
  }

  const As = item.route ? 'a' : 'button'
  const props = item.route ? { href:'#/' + item.route } : { type:'button', onClick:() => onOpen(item.id) }

  return (
    <As ref={ref} {...props} onPointerMove={onMove} onPointerLeave={onLeave}
      style={{ backgroundColor:p.fade, '--np-glow':p.glow, animationDelay:`${Math.min(index, 8) * 35}ms` }}
      className={cn('np np-in relative flex min-h-[116px] w-full overflow-hidden rounded-[20px] text-left sm:min-h-[124px]')}>
      <svg viewBox="0 0 300 120" overflow="visible" aria-hidden="true" focusable="false"
        className="np-art absolute right-0 top-0 h-full">
        {Scene ? <Scene u={u}/> : <FallbackScene u={u} fade={p.fade}/>}
      </svg>
      <span className="relative z-[1] flex w-[56%] max-w-[300px] flex-col justify-center py-4 pl-4 pr-1 sm:pl-5"
        style={{ backgroundColor:p.fade }}>
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-full w-12 sm:w-16"
          style={{ background:`linear-gradient(90deg, ${p.fade}, ${p.fade}00)` }}/>
        <span className="block font-display text-meta font-bold leading-tight tracking-tight" style={{ color:p.ink }}>
          {item.title}
        </span>
        <span className="mt-1 block text-fine leading-snug" style={{ color:p.sub }}>{item.line}</span>
      </span>
    </As>
  )
}

export default Nameplate
