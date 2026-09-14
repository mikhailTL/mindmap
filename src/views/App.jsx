import React from 'react'
import { Overview } from './Overview'
import { PatchPage } from './PatchPage'
import { Hub } from './Hub'
import { Tour } from './Tour'
import { Responses } from './Responses'
import { Intro, introSuppressed } from './Intro'
import { NameGate } from '../survey/NameGate'
import { PageSurvey } from '../survey/Survey'
import { getVisitor } from '../survey/store'
import { Students } from './Students'
import { Parents } from './Parents'
import { Pro } from './Pro'
import { Launch } from './Launch'
import { ForStudents, ForParents, ForSchools } from './audience'
import { ModeToggle } from '../ui/mode-toggle'
import { Palette, PaletteHint } from '../ui/palette'
import { Logo } from '../ui/logo'
import { ScrollProgress } from '../s21/motion'
import { cn } from '../lib/utils'

/* The nav tabs used to drop a first-time visitor straight into a screen full
   of somebody else's readings. They now open a walkthrough of what MindMap
   does for that audience, and the app itself is behind one deliberate door:
   Launch. `app-*` are the real dashboards; `student`/`parent`/`pro` are the
   explanations of them. The old `check` and `privacy` urls still resolve, so
   nothing that was ever linked is broken. */
const VIEWS = ['site','patch','student','parent','pro','app','app-student','app-parent',
               'app-pro','check','privacy','hub','tour','responses']

/* A section per subject, the way a device site is normally organised, rather
   than one marketing page and one door into everything else. */
const TITLE = {
  site:'MindMap — a patch for the forearm', patch:'The patch — MindMap',
  student:'What MindMap does for students — MindMap',
  parent:'What MindMap does for parents — MindMap',
  pro:'What MindMap does for schools — MindMap',
  app:'Open the app — MindMap',
  'app-student':'Student screen — MindMap', 'app-parent':'Parent screen — MindMap',
  'app-pro':'Counselor console — MindMap',
  check:'Take a reading — MindMap', privacy:'Who can see what — MindMap',
  hub:'Dashboard — MindMap', tour:'Guided tour — MindMap',
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
]
/* Which top-level section each view belongs under. */
const SECTION = { site:'site', patch:'patch',
                  student:'student', parent:'parent', pro:'pro',
                  /* the app lives under no tab — it is reached through Launch,
                     so no nav entry should light up while you are inside it */
                  app:null, 'app-student':null, 'app-parent':null, 'app-pro':null,
                  check:null, privacy:null, hub:null, tour:null, responses:null }

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
        {/* Was the word alone. The mark carries the product's own silhouette,
            so the header now says what the thing is before the nav does. */}
        <button onClick={() => go('site')} aria-label="MindMap — go to the overview"
          className="lift shrink-0 self-center py-3 pr-2 text-head text-ink">
          <Logo/>
        </button>
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
        {/* The app is one deliberate door, not five. The nav tabs explain what
            MindMap does for each audience; this is the only control that opens
            the thing itself, so it is the only filled control in the bar. */}
        <div className="flex basis-full items-center justify-between gap-4 border-t border-rule
          py-2 sm:basis-auto sm:border-l sm:border-t-0 sm:pl-5">
          {/* The launcher carries its own Demo/Real block with a sentence for
              each mode, which is the better place to make the choice. Two
              controls for one setting on one screen is just clutter. */}
          {view !== 'app' && <ModeToggle className="min-w-0"/>}
          <button onClick={() => go('app')} aria-current={view.startsWith('app') ? 'page' : undefined}
            className={cn('inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-field px-4',
              'font-display text-meta font-medium transition-colors duration-150',
              view.startsWith('app')
                ? 'bg-accent-ink text-paper'
                : 'bg-accent text-paper hover:bg-accent-ink')}>
            Launch the app
            <span aria-hidden>→</span>
          </button>
        </div>
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
  /* Plays on every load, not once ever. Only the Skip control suppresses it,
     and it suppresses it permanently — watching to the end does not, because a
     visitor who watched it may well want it again and a visitor who skipped it
     has told you exactly what they want. */
  const [showIntro, setShowIntro] = React.useState(() => {
    try { return !admin && !introSuppressed() } catch { return false }
  })
  const [visitor, setVisitorState] = React.useState(() => {
    try { return getVisitor() } catch { return null }
  })
  /* Intro writes its own suppression key when Skip or Esc is used, so this
     only has to take the overlay down. */
  const endIntro = React.useCallback(() => setShowIntro(false), [])
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
  const V = { site:Overview, patch:PatchPage, hub:Hub, tour:Tour, responses:Responses,
              /* the three nav tabs: what MindMap does for each audience */
              student:ForStudents, parent:ForParents, pro:ForSchools,
              /* the app, behind Launch */
              app:Launch, 'app-pro':Pro,
              'app-student': p => <Students {...p} tab="today"/>,
              'app-parent':  p => <Parents  {...p} tab="week"/>,
              check:         p => <Students {...p} tab="check"/>,
              privacy:       p => <Parents  {...p} tab="shared"/> }[view]
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
