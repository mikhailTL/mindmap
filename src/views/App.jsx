import React from 'react'
import { Overview } from './Overview'
import { PatchPage } from './PatchPage'
import { Hub } from './Hub'
import { Tour } from './Tour'
import { Responses } from './Responses'
import { Intro } from './Intro'
import { NameGate } from '../survey/NameGate'
import { PageSurvey } from '../survey/Survey'
import { getVisitor, hasSeenIntro, setSeenIntro } from '../survey/store'
import { Students } from './Students'
import { Parents } from './Parents'
import { Pro } from './Pro'
import { Palette, PaletteHint } from '../ui/palette'
import { ScrollProgress } from '../s21/motion'
import { cn } from '../lib/utils'

const VIEWS = ['site','patch','hub','student','parent','check','privacy','pro','tour','responses']

/* A section per subject, the way a device site is normally organised, rather
   than one marketing page and one door into everything else. */
const TITLE = {
  site:'MindMap — one number, one sentence', patch:'The patch — MindMap',
  hub:'Open the app — MindMap', student:'For students — MindMap', parent:'For parents — MindMap',
  check:'Take a reading — MindMap', privacy:'Who can see what — MindMap',
  pro:'For school counselors — MindMap', tour:'Guided tour — MindMap',
  responses:'Review responses — MindMap',
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
  ['hub',     'Dashboard'],
]
/* Which top-level section each view belongs under. */
const SECTION = { site:'site', patch:'patch', student:'student', check:'student',
                  parent:'parent', privacy:'parent', pro:'pro', hub:'hub', tour:'hub',
                  responses:'hub' }

/* The single most conventional thing left on this site was this: a sticky bar
   with a wordmark on the left and a row of links on the right, which is the
   shape of every website ever made. It is a numbered index now — the band
   index down the top of a chart. The destinations are the same and all six
   stay visible at 390px, which is what testers needed; what changed is that
   they are numbered, ruled, and the active one is filled ink rather than
   underlined in an accent. */
function Header({ view, go }) {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-ink bg-paper">
      <div className="wrap flex flex-wrap items-stretch gap-x-6 gap-y-0">
        <button onClick={() => go('site')}
          className="lift shrink-0 self-center py-3 pr-2 font-display text-head font-medium
            tracking-tight text-ink">MindMap</button>
        <PaletteHint/>
        <nav aria-label="Sections" className="-mx-1 flex basis-full flex-wrap sm:ml-auto sm:basis-auto sm:flex-nowrap">
          {NAV.map(([id, label], i) => {
            const on = SECTION[view] === id
            return (
              <button key={id} onClick={() => go(id)} aria-current={on ? 'page' : undefined}
                className={cn('group relative flex min-h-[50px] items-baseline gap-2 whitespace-nowrap',
                  'border-l border-rule px-3 pb-2 pt-3.5 transition-colors duration-150 first:border-l-0',
                  'sm:px-4', on ? 'bg-ink text-paper' : 'text-ink-2 hover:bg-mist')}>
                <span className={cn('font-mono text-fine font-light tabular-nums',
                  on ? 'text-paper/55' : 'text-ink-3')}>{String(i + 1).padStart(2, '0')}</span>
                <span className="font-display text-ui font-medium sm:text-meta">{label}</span>
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
  /* Three gates, in order, and each one only for a first-time visitor:
     the title sequence, then the name, then the per-page questions.
     A returning reviewer sees none of the first two — the whole point of the
     skip is that nobody sits through an intro twice. The responses page is
     excluded from all of it: Mikhail reading the results is not a respondent,
     and a survey card over the data he came to read would be absurd. */
  const admin = view === 'responses'
  const [showIntro, setShowIntro] = React.useState(() => {
    try { return !admin && !hasSeenIntro() } catch { return false }
  })
  const [visitor, setVisitorState] = React.useState(() => {
    try { return getVisitor() } catch { return null }
  })
  const endIntro = React.useCallback(() => {
    try { setSeenIntro() } catch {}
    setShowIntro(false)
  }, [])
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
  const wide = view !== 'site'
  React.useEffect(() => { document.documentElement.dataset.wide = String(wide) }, [wide])

  /* Three routes are tabs inside a section rather than pages of their own, and
     they keep their URLs so every existing link still lands in the right place. */
  const V = { site:Overview, patch:PatchPage, hub:Hub, pro:Pro, tour:Tour, responses:Responses,
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
        className="absolute left-4 top-0 z-[200] -translate-y-[200%] rounded-field bg-ink px-5 py-3
          font-display text-meta font-medium text-paper transition-transform duration-150
          focus:translate-y-4">Skip to the main content</a>
      {showIntro && !admin && <Intro onDone={endIntro}/>}
      {!showIntro && !visitor && !admin && (
        <NameGate onDone={() => { try { setVisitorState(getVisitor()) } catch { setVisitorState({ name:'Anonymous' }) } }}/>
      )}
      <Header view={view} go={go}/>
      <Palette go={go}/>
      <p aria-live="polite" className="sr-only text-sec">{said}</p>
      <div id="main" ref={mainRef} tabIndex={-1} className="outline-none">
        <V go={go} key={view}/>
      </div>
      {/* Mounted per view and keyed by it, so leaving a page abandons any
          question that was mid-answer rather than carrying it to the next one. */}
      {!showIntro && visitor && !admin && <PageSurvey key={view} page={view}/>}
      <footer className="border-t border-rule py-11">
        <div className="wrap">
          <p className="max-w-[70ch] text-meta text-ink-3">MindMap measures physiology and reports patterns. It is not a
            medical device and does not diagnose or treat any condition. If you need urgent help, contact your
            local emergency number or a crisis line.</p>
          <p className="note mt-3.5">MindMap · Solace Innovation</p>
        </div>
      </footer>
    </>
  )
}
