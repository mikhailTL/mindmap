import React from 'react'
import { Overview } from './Overview'
import { PatchPage } from './PatchPage'
import { Hub } from './Hub'
import { Student, Parent } from './Monitor'
import { Pro } from './Pro'
import { CheckIn } from './CheckIn'
import { Index } from './Index'
import { Palette, PaletteHint } from '../ui/palette'
import { ScrollProgress } from '../s21/motion'
import { cn } from '../lib/utils'

const VIEWS = ['site','patch','hub','student','parent','check','pro','index']

/* A section per subject, the way a device site is normally organised, rather
   than one marketing page and one door into everything else. */
const NAV = [
  ['site',  'Overview'],
  ['patch', 'The patch'],
  ['hub',   'The app'],
  ['pro',   'For schools'],
  ['index', 'All features'],
]
/* Which top-level section each view belongs under. */
const SECTION = { site:'site', patch:'patch', hub:'hub', student:'hub', parent:'hub',
                  check:'hub', pro:'pro', index:'index' }

function Header({ view, go }) {
  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-paper/90 backdrop-blur-[14px]">
      <div className="wrap flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
        <button onClick={() => go('site')}
          className="font-display text-[1.4375rem] font-extrabold tracking-tight text-ink">MindMap</button>
        <PaletteHint/>
        <nav aria-label="Sections" className="-mx-1 ml-auto flex basis-full gap-x-1 overflow-x-auto sm:basis-auto">
          {NAV.map(([id, label]) => {
            const on = SECTION[view] === id
            return (
              <button key={id} onClick={() => go(id)} aria-current={on ? 'page' : undefined}
                className={cn('relative min-h-[48px] whitespace-nowrap px-3 font-display text-meta',
                  'font-medium transition-colors duration-150',
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
  const go = React.useCallback(v => {
    if (location.hash !== '#/' + v) history.pushState(null, '', '#/' + v)
    setView(v); window.scrollTo(0, 0)
    requestAnimationFrame(() => window.ScrollTrigger?.refresh())
  }, [])
  React.useEffect(() => {
    const onPop = () => { setView(fromHash()); window.scrollTo(0, 0) }
    addEventListener('hashchange', onPop); addEventListener('popstate', onPop)
    return () => { removeEventListener('hashchange', onPop); removeEventListener('popstate', onPop) }
  }, [])
  const wide = view !== 'site' && view !== 'index'
  React.useEffect(() => { document.documentElement.dataset.wide = String(wide) }, [wide])

  const V = { site:Overview, patch:PatchPage, hub:Hub, student:Student, parent:Parent,
              check:CheckIn, pro:Pro, index:Index }[view]
  return (
    <>
      <Header view={view} go={go}/>
      <Palette go={go}/>
      <V go={go} key={view}/>
      <footer className="border-t border-rule py-11">
        <div className="wrap">
          <p className="text-meta text-ink-3">MindMap measures physiology and reports patterns. It is not a
            medical device and does not diagnose or treat any condition. If you need urgent help, contact your
            local emergency number or a crisis line.</p>
          <p className="lab mt-3.5">MindMap · Solace Innovation</p>
        </div>
      </footer>
    </>
  )
}
