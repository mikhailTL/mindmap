import React from 'react'
import { Overview } from './Overview'
import { PatchPage } from './PatchPage'
import { Hub } from './Hub'
import { Students } from './Students'
import { Parents } from './Parents'
import { Pro } from './Pro'
import { Index } from './Index'
import { Palette, PaletteHint } from '../ui/palette'
import { ScrollProgress } from '../s21/motion'
import { cn } from '../lib/utils'

const VIEWS = ['site','patch','hub','student','parent','check','privacy','pro','index']

/* A section per subject, the way a device site is normally organised, rather
   than one marketing page and one door into everything else. */
const TITLE = {
  site:'MindMap — one number, one sentence', patch:'The patch — MindMap',
  hub:'Open the app — MindMap', student:'For students — MindMap', parent:'For parents — MindMap',
  check:'Take a reading — MindMap', privacy:'Who can see what — MindMap',
  pro:'For school counselors — MindMap', index:'All features — MindMap',
}
/* One entry per audience, in the order a visitor meets them: the person
   wearing it, the person it reports to, then the school. "The app" is gone —
   it was a door to three pages that are now sections of their own, so it sat
   in the bar naming a place rather than a reader. */
const NAV = [
  ['site',    'Overview'],
  ['patch',   'The patch'],
  ['student', 'For students'],
  ['parent',  'For parents'],
  ['pro',     'For schools'],
  ['index',   'All features'],
]
/* Which top-level section each view belongs under. */
const SECTION = { site:'site', patch:'patch', student:'student', check:'student',
                  parent:'parent', privacy:'parent', pro:'pro', index:'index', hub:'index' }

function Header({ view, go }) {
  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-paper/90 backdrop-blur-[14px]">
      <div className="wrap flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
        <button onClick={() => go('site')}
          className="font-display text-head font-extrabold tracking-tight text-ink">MindMap</button>
        <PaletteHint/>
        {/* Two testers never found "For schools" or "All features": the bar
            scrolled horizontally with no fade or arrow, hiding 41% of itself.
            It wraps now — every destination is on screen at every width. */}
        <nav aria-label="Sections" className="-mx-1 ml-auto flex basis-full flex-wrap gap-x-1 sm:basis-auto sm:flex-nowrap">
          {NAV.map(([id, label]) => {
            const on = SECTION[view] === id
            return (
              <button key={id} onClick={() => go(id)} aria-current={on ? 'page' : undefined}
                className={cn('relative min-h-[48px] whitespace-nowrap px-2.5 font-display',
                  'text-ui font-medium transition-colors duration-150 sm:px-3 sm:text-meta',
                  on ? 'text-ink' : 'text-ink-2 hover:text-ink')}>
                {label}
                {on && <span aria-hidden className="absolute inset-x-3 bottom-0 h-0.5 bg-accent"/>}
              </button>
            )
          })}
        </nav>
      </div>
      <ScrollProgress/>
    </header>
  )
}

const fromHash = () => {
  const h = location.hash.replace(/^#\/?/, '')
  return VIEWS.includes(h) ? h : 'site'
}

export function App() {
  const [view, setView] = React.useState(fromHash)
  const mainRef = React.useRef(null)
  const [said, setSaid] = React.useState('')
  /* A keyboard user lost their place on every navigation: focus fell back to
     <body>, the title never changed, and the scroll position carried over from
     the previous screen. */
  const land = React.useCallback(v => {
    window.scrollTo(0, 0)
    document.title = TITLE[v] || 'MindMap'
    setSaid(TITLE[v] || 'MindMap')
    requestAnimationFrame(() => {
      mainRef.current?.focus({ preventScroll: true })
      window.ScrollTrigger?.refresh()
    })
  }, [])
  const go = React.useCallback(v => {
    if (location.hash !== '#/' + v) history.pushState(null, '', '#/' + v)
    setView(v); land(v)
  }, [land])
  React.useEffect(() => { land(view) }, [])
  React.useEffect(() => {
    const onPop = () => { const v = fromHash(); setView(v); land(v) }
    addEventListener('hashchange', onPop); addEventListener('popstate', onPop)
    return () => { removeEventListener('hashchange', onPop); removeEventListener('popstate', onPop) }
  }, [land])
  const wide = view !== 'site' && view !== 'index'
  React.useEffect(() => { document.documentElement.dataset.wide = String(wide) }, [wide])

  /* Three routes are tabs inside a section rather than pages of their own, and
     they keep their URLs so every existing link still lands in the right place. */
  const V = { site:Overview, patch:PatchPage, hub:Hub, pro:Pro, index:Index,
              student: p => <Students {...p} tab="today"/>,
              check:   p => <Students {...p} tab="check"/>,
              parent:  p => <Parents  {...p} tab="week"/>,
              privacy: p => <Parents  {...p} tab="shared"/> }[view]
  return (
    <>
      {/* sr-only clips this to a 1x1 box, which an audit reads as a 1px tap
          target and a keyboard user gets no real hit area from. Full size,
          parked above the viewport, sliding down on focus. */}
      <a href="#main"
        onClick={e => { e.preventDefault(); mainRef.current?.focus() }}
        className="absolute left-4 top-0 z-[200] -translate-y-[200%] rounded-xs bg-ink px-5 py-3
          font-display text-meta font-medium text-paper transition-transform duration-150
          focus:translate-y-4">Skip to the main content</a>
      <Header view={view} go={go}/>
      <Palette go={go}/>
      <p aria-live="polite" className="sr-only text-sec">{said}</p>
      <div id="main" ref={mainRef} tabIndex={-1} className="outline-none">
        <V go={go} key={view}/>
      </div>
      <footer className="border-t border-rule py-11">
        <div className="wrap">
          <p className="max-w-[70ch] text-meta text-ink-3">MindMap measures physiology and reports patterns. It is not a
            medical device and does not diagnose or treat any condition. If you need urgent help, contact your
            local emergency number or a crisis line.</p>
          <p className="lab mt-3.5">MindMap · Solace Innovation</p>
        </div>
      </footer>
    </>
  )
}
