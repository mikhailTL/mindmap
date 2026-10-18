import React from 'react'
import { PatchPage } from './PatchPage'
import { Pairing } from './Pairing'
import { WithoutPatch } from './WithoutPatch'
import { SCORE } from '../lib/terms'
import { cn } from '../lib/utils'

/* About the patch, Pairing the patch and Without the patch, read top to bottom
   on one page. The three routes ('patch', 'pairing', 'without-patch') all
   render this, and each lands on its own part. The owner, 18 October: no
   numbers and no loud colour bands, just titles. Each part opens on the same
   wash with the same title, and the sections inside sit on white. */

const PARTS = [
  { id:'about-patch',   route:'patch',         short:'About the patch',   title:'About the patch' },
  { id:'pairing-patch', route:'pairing',       short:'Pairing',           title:'Pairing the patch',
    line:'Fully wireless, 2 minutes of setup.' },
  { id:'without-patch', route:'without-patch', short:'Without the patch', title:'Without the patch',
    line:`Three ways to get a ${SCORE} with only your phone.` },
]
const BY_ROUTE = Object.fromEntries(PARTS.map(p => [p.route, p]))

/* The site header is 56px plus its 1px rule; the switcher sits under it. */
const HEAD = 57
const BAR = 52
const CLEAR = HEAD + BAR

/* The site sets scroll-behavior: smooth on <html>; arriving must not animate. */
function jump(y) {
  const html = document.documentElement
  const was = html.style.scrollBehavior
  html.style.scrollBehavior = 'auto'
  try { window.scrollTo({ top: y, left: 0, behavior: 'instant' }) } catch { window.scrollTo(0, y) }
  html.style.scrollBehavior = was
}

function topOf(id) {
  const el = document.getElementById(id)
  if (!el) return 0
  const m = parseFloat(getComputedStyle(el).scrollMarginTop) || 0
  return Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY - m))
}

const targetOf = route => (route === 'patch' || !BY_ROUTE[route] ? 0 : topOf(BY_ROUTE[route].id))

/* Lands on a route's part and holds it there while the page settles (fonts,
   pictures, the app's own scroll to the top), until the reader moves. */
function settle(route, done) {
  let held = true
  const place = () => {
    if (!held) return
    const y = targetOf(route)
    if (Math.abs(window.scrollY - y) > 1) jump(y)
  }
  const letGo = () => { held = false }
  const LET_GO = ['wheel', 'touchstart', 'pointerdown', 'keydown']
  place()
  let r2 = 0
  const r1 = requestAnimationFrame(() => { place(); r2 = requestAnimationFrame(place) })
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(place) : null
  ro?.observe(document.getElementById('patch-hub') || document.body)
  addEventListener('scroll', place, { passive: true })
  LET_GO.forEach(t => addEventListener(t, letGo, { passive: true, capture: true }))
  const end = setTimeout(() => { stop(); done?.() }, 1400)
  function stop() {
    held = false
    cancelAnimationFrame(r1); cancelAnimationFrame(r2); clearTimeout(end)
    ro?.disconnect()
    removeEventListener('scroll', place)
    LET_GO.forEach(t => removeEventListener(t, letGo, { capture: true }))
  }
  return stop
}

function routeInHash() {
  const raw = location.hash.replace(/^#\/?/, '').split(/[?/]/)[0]
  return BY_ROUTE[raw] ? raw : null
}

/* The part's title, on the wash its first band continues. */
function PartHead({ part, as: H = 'h2' }) {
  return (
    <div className={cn(H !== 'h1' && 'border-t border-rule', 'bg-accent-wash')}>
      <div className="wrap pt-8 lg:pt-12">
        <H id={part.id + '-h'}
          className="m-0 font-display text-major font-bold leading-[1.05] tracking-tight text-ink">
          {part.title}
        </H>
        {part.line && <p className="mt-2 text-meta leading-[1.4] text-ink-2">{part.line}</p>}
      </div>
    </div>
  )
}

export function PatchHub({ go, section = 'patch' }) {
  const [on, setOn] = React.useState((BY_ROUTE[section] || PARTS[0]).id)
  const pick = React.useRef(null)

  React.useLayoutEffect(() => {
    setOn((BY_ROUTE[section] || PARTS[0]).id)
    return settle(section, () => pick.current?.())
  }, [section])

  /* The header menu calls go() for the route already showing: the app scrolls
     to the top and nothing remounts, so the part is found again here. */
  React.useEffect(() => {
    let raf = 0, stop = null
    const onClick = e => {
      if (!e.target?.closest?.('[role="menuitem"], #drawer-patch button')) return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = routeInHash()
        if (!r) return
        stop?.(); stop = settle(r, () => pick.current?.())
        setOn(BY_ROUTE[r].id)
      })
    }
    document.addEventListener('click', onClick)
    return () => { document.removeEventListener('click', onClick); cancelAnimationFrame(raf); stop?.() }
  }, [])

  /* The part in view: the last one whose top has passed the switcher. */
  React.useEffect(() => {
    if (typeof IntersectionObserver !== 'function') return
    const els = PARTS.map(p => document.getElementById(p.id)).filter(Boolean)
    const choose = () => {
      let cur = PARTS[0].id
      for (const el of els) if (el.getBoundingClientRect().top <= CLEAR + 2) cur = el.id
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      setOn(atEnd && els.length ? els[els.length - 1].id : cur)
    }
    pick.current = choose
    const io = new IntersectionObserver(choose, {
      rootMargin: `-${CLEAR + 1}px 0px 0px 0px`, threshold: [0, 0.02],
    })
    els.forEach(el => io.observe(el))
    return () => { io.disconnect(); pick.current = null }
  }, [])

  const toPart = p => {
    setOn(p.id)
    window.scrollTo({ top: p.route === 'patch' ? 0 : topOf(p.id), left: 0 })
    document.getElementById(p.id)?.focus({ preventScroll: true })
  }

  return (
    <main id="patch-hub">
      <nav aria-label="On this page"
        className="sticky z-40 border-b border-rule bg-paper/95 backdrop-blur-md
          supports-[backdrop-filter]:bg-paper/85"
        style={{ top: HEAD }}>
        {/* Scrolls sideways rather than overflow on a phone narrower than 360. */}
        <div className="wrap">
        <ul className="-mx-1.5 m-0 flex h-[52px] list-none items-stretch overflow-x-auto p-0
          [scrollbar-width:none] sm:-mx-3 sm:gap-2 [&::-webkit-scrollbar]:hidden">
          {PARTS.map(p => {
            const here = on === p.id
            return (
              <li key={p.id} className="flex min-w-0">
                <button type="button" onClick={() => toPart(p)}
                  aria-current={here ? 'location' : undefined}
                  className={cn('relative flex min-h-[44px] items-center gap-2 whitespace-nowrap px-1.5',
                    'font-display text-[15px] font-medium touch-manipulation transition-[color] duration-150',
                    'after:pointer-events-none after:absolute after:inset-x-1.5 after:bottom-0 after:h-[3px]',
                    'sm:text-ui',
                    'after:rounded-bar sm:px-3 sm:after:inset-x-3',
                    here ? 'text-ink after:bg-accent' : 'text-ink-2 after:bg-transparent hoverOnly:text-ink')}>
                  {p.short}
                </button>
              </li>
            )
          })}
        </ul>
        </div>
      </nav>

      <section id="about-patch" tabIndex={-1} aria-labelledby="about-patch-h"
        className="outline-none" style={{ scrollMarginTop: CLEAR }}>
        <PartHead part={PARTS[0]} as="h1"/>
        <PatchPage as="div" go={go}/>
      </section>

      <section id="pairing-patch" tabIndex={-1} aria-labelledby="pairing-patch-h"
        className="outline-none" style={{ scrollMarginTop: CLEAR }}>
        <PartHead part={PARTS[1]}/>
        <Pairing as="div"/>
      </section>

      <section id="without-patch" tabIndex={-1} aria-labelledby="without-patch-h"
        className="outline-none" style={{ scrollMarginTop: CLEAR }}>
        <PartHead part={PARTS[2]}/>
        <WithoutPatch as="div" go={go}/>
      </section>
    </main>
  )
}
