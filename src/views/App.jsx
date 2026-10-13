import React from 'react'
import { Overview } from './Overview'
import { PatchPage } from './PatchPage'
import { WithoutPatch } from './WithoutPatch'
import { Tour } from './Tour'
import { Methods } from './Methods'
import { Pairing } from './Pairing'
import { Responses } from './Responses'
import { Entry } from './Entry'
import { GetHelp, HelpBody, NotificationSettings, NotesJournal } from '../app'
import { NameGate } from '../survey/NameGate'
import { ReviewLauncher } from '../survey/Survey'
import { PAGE, REQUIRED, SECTIONS, questionNumber } from '../survey/questions'
import {
  answersFor, getVersion, getVisitor,
  isQueued, recordAnswer, submitResponse, subscribe, syncPending, wasSent,
} from '../survey/store'
import Toolkit from './Toolkit'
import { Students } from './Students'
import { Parents } from './Parents'
import { Pro } from './Pro'
import { Launch } from './Launch'
import { ForStudents, ForParents, ForSchools } from './audience'
import { ModeToggle } from '../ui/mode-toggle'
import { useMode, setMode } from '../lib/mode'
import { Palette } from '../ui/palette'
import { Logo } from '../ui/logo'
import { Button } from '../ui/button'
import { StarRating } from '../ui/stars'
import { Section, SectionHead, SectionLede } from '../ui/section'
import { ArrowLeft, ArrowRight, Bracket, Chevron, ChevronDown, Cross, Frame, Grid,
         PulseMark, Rule, Search, Wave } from '../ui/marks'
import { ScrollProgress } from '../ui/motion'
import { cn } from '../lib/utils'

/* The route ids, fixed by spec 0e section 18 so no two workers invent
   different ones. This file owns the table; a worker needing a route it does
   not own names it in its report rather than adding it here.

   `app-*` are the dashboards, `students`/`parents`/`pro` the pages that
   explain them. Two ids are not in section 18 and are kept because they are
   built, linked and reachable: `tour` (the standalone tour page) and `notes`
   (the device-only journal, off the tab bar now that MindMap AI has its slot
   per section 8). Both are named in this worker's report. */
const VIEWS = [
  /* the site */
  'site','patch','pairing','without-patch','methods','privacy','monitor','survey','responses',
  /* the three audience explainer pages */
  'students','parents','pro',
  /* the product */
  'app','app-student','app-parent','app-pro',
  /* inside the product */
  'reading','calendar','toolkit','ai','help','shared','app-notify',
  /* one route per toolkit activity, spec 0d section 7 */
  'toolkit-breathing','toolkit-ground','toolkit-reframe','toolkit-scan','toolkit-move',
  /* kept, not in section 18 */
  'tour','notes',
]

/* Routes that render app screens, so the chrome switches: `reading` is the
   student section on its reading tab, `privacy` the parent section on its
   sharing tab, whatever the urls suggest. */
const APP_VIEWS = new Set(['app','app-student','app-parent','app-pro','reading','shared',
                           'privacy','toolkit','ai','calendar','help','monitor','notes',
                           'app-notify','toolkit-breathing','toolkit-ground','toolkit-reframe',
                           'toolkit-scan','toolkit-move'])

/* Old ids, so a link, a bookmark or another worker's button still lands. The
   palette pushes `hub`, which is not a route. */
const ALIAS = {
  hub: 'app',
  student: 'students', parent: 'parents',
  check: 'reading',
  'kit-student': 'toolkit', 'kit-parent': 'toolkit',
}

const TITLE = {
  site:'MindMap, a wellness app for teenagers',
  patch:'The MindMap patch',
  'without-patch':'MindMap without the patch',
  students:'MindMap for students',
  parents:'MindMap for parents',
  pro:'MindMap for Medical Professionals',
  app:'Open the MindMap app',
  'app-student':'The student screen in MindMap',
  'app-parent':'The parent screen in MindMap',
  'app-pro':'The medical professional console in MindMap',
  monitor:'Every reading in MindMap',
  reading:'Take a reading in MindMap',
  calendar:'The week and the month in MindMap',
  toolkit:'The MindMap Toolkit',
  'toolkit-breathing':'Breathing, in the MindMap Toolkit',
  'toolkit-ground':'Grounding, in the MindMap Toolkit',
  'toolkit-reframe':'Reframing, in the MindMap Toolkit',
  'toolkit-scan':'A body scan, in the MindMap Toolkit',
  'toolkit-move':'Moving, in the MindMap Toolkit',
  ai:'MindMap AI',
  shared:'What leaves your phone in MindMap',
  notes:'Your notes in MindMap',
  'app-notify':'Reminders in MindMap',
  help:'Getting help',
  privacy:'Who can see what in MindMap',
  methods:'How the Mind Score is computed',
  pairing:'Pairing the MindMap patch',
  tour:'A guided tour of MindMap',
  responses:'Survey responses in MindMap',
  survey:'Give feedback on MindMap',
}

/* Two menus, because five flat tabs plus a dropdown did not fit a laptop and
   read as a pile. Pairing and the no-patch route are both about the patch, so
   they live under it. */
const PATCH = [
  ['patch',         'The patch',          'What it is, and what the four signals are'],
  ['pairing',       'Pairing it',         'Six steps, no cable and no host computer'],
  ['without-patch', 'Without the patch',  'The camera and microphone, or six questions'],
]

const AUDIENCE = [
  ['students', 'Students', 'What a week of readings looks like'],
  ['parents',  'Parents',  'What a parent is shown, and what they are not'],
  ['pro',      'Medical Professionals',  'What a medical professional sees across a year group'],
]

/* Which nav entry lights per view. The three patch pages share `kit`, the
   three audience pages `who`, and every route not named here lights nothing.
   The app routes are all in that second set: the header is not rendered over
   them at all. */
const SECTION = { site:'site', methods:'methods',
                  patch:'kit', pairing:'kit', 'without-patch':'kit',
                  students:'who', parents:'who', pro:'who', survey:'survey' }

const linkClass = on => cn(
  'relative flex h-full items-center whitespace-nowrap px-2.5 font-display text-ui font-medium 2xl:px-3.5',
  /* Colour only. `transition-colors` also covers the 2px active indicator,
     which then fades in over 150ms after the route has already swapped. */
  'transition-[color] duration-100',
  'after:pointer-events-none after:absolute after:inset-x-2 after:bottom-0 after:h-[2px]',
  on ? 'text-ink after:bg-accent' : 'text-ink-2 after:bg-transparent hoverOnly:text-ink hoverOnly:after:bg-rule'
)

/* Hand-rolled menu; there is no Radix in this project. Click opens, Escape and
 * an outside press close, arrows walk the items, and close returns focus to the
 * trigger -- focus falling to <body> loses a keyboard user the page.
 */
function NavMenu({ view, go, label, items: entries, section }) {
  const [open, setOpen] = React.useState(false)
  const [at, setAt] = React.useState(0)
  const wrap = React.useRef(null)
  const trigger = React.useRef(null)
  const items = React.useRef([])
  const on = SECTION[view] === section

  const close = React.useCallback((refocus = true) => {
    setOpen(false)
    if (refocus) trigger.current?.focus()
  }, [])

  /* pointerdown, not click, so a press on another nav button takes one press. */
  React.useEffect(() => {
    if (!open) return
    const away = e => { if (!wrap.current?.contains(e.target)) close(false) }
    document.addEventListener('pointerdown', away)
    return () => document.removeEventListener('pointerdown', away)
  }, [open, close])

  React.useEffect(() => { if (open) items.current[at]?.focus() }, [open, at])

  const openAt = i => { setAt(i); setOpen(true) }

  function onTriggerKey(e) {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); openAt(0)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); openAt(entries.length - 1)
    }
  }

  function onItemKey(e, i) {
    const last = entries.length - 1
    if (e.key === 'ArrowDown')      { e.preventDefault(); setAt(i === last ? 0 : i + 1) }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setAt(i === 0 ? last : i - 1) }
    else if (e.key === 'Home')      { e.preventDefault(); setAt(0) }
    else if (e.key === 'End')       { e.preventDefault(); setAt(last) }
    else if (e.key === 'Escape')    { e.preventDefault(); close() }
    else if (e.key === 'Tab')       { close(false) }
  }

  return (
    <div ref={wrap} className="relative flex h-full">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-current={on ? 'page' : undefined}
        onClick={() => (open ? close() : openAt(0))}
        onKeyDown={onTriggerKey}
        className={cn(linkClass(on), 'gap-1.5')}
      >
        {label}
        <ChevronDown aria-hidden
          className={cn('size-3.5 transition-transform duration-150', open && 'rotate-180')}/>
      </button>
      {open && (
        <div role="menu" aria-label={label}
          className="absolute left-0 top-full z-50 mt-px w-[19rem] overflow-hidden rounded-panel
            border border-rule bg-card py-1.5 shadow-lift">
          {entries.map(([id, text, hint], i) => (
            <button
              key={id}
              ref={el => { items.current[i] = el }}
              type="button"
              role="menuitem"
              tabIndex={-1}
              aria-current={view === id ? 'page' : undefined}
              onClick={() => { close(false); go(id) }}
              onKeyDown={e => onItemKey(e, i)}
              className={cn('block w-full px-4 py-2.5 text-left transition-colors duration-150',
                'hoverOnly:bg-mist focus-visible:bg-mist',
                view === id && 'bg-accent-wash')}
            >
              <span className="block font-display text-ui font-medium text-ink">{text}</span>
              <span className="mt-0.5 block text-fine text-ink-3">{hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Drawer({ view, go, onClose }) {
  const panel = React.useRef(null)

  React.useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const sel = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])'
    const focusable = () => Array.from(panel.current?.querySelectorAll(sel) || [])
    requestAnimationFrame(() => focusable()[0]?.focus())
    const onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
      else if (e.key === 'Tab') {
        const f = focusable()
        if (!f.length) return
        const i = f.indexOf(document.activeElement)
        const next = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i === f.length - 1 ? 0 : i + 1)
        e.preventDefault(); f[next].focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  /* Flat on a phone. A dropdown inside a drawer is two taps for nothing. */
  const rows = [
    ['site', 'Overview'],
    ...PATCH.map(([id, label]) => [id, label]),
    ['methods', 'How it works'],
    ...AUDIENCE.map(([id, label]) => [id, label]),
    ['survey', 'Give feedback'],
  ]

  return (
    <div className="fixed inset-0 z-[60] xl:hidden">
      <div className="absolute inset-0 bg-ink/45" onClick={onClose} aria-hidden/>
      <div ref={panel} role="dialog" aria-modal="true" aria-label="Menu"
        className="absolute inset-x-0 top-0 max-h-[100dvh] overflow-y-auto overscroll-contain border-b border-ink bg-paper">
        <div className="wrap flex h-14 items-center justify-between">
          <span className="font-display text-row font-medium text-ink">Menu</span>
          <button type="button" onClick={onClose} aria-label="Close the menu"
            className="-mr-2 grid size-11 place-items-center rounded-field text-ink-2 hoverOnly:bg-mist hoverOnly:text-ink">
            <Cross className="size-4"/>
          </button>
        </div>
        <nav aria-label="Sections" className="wrap pb-5">
          {rows.map(([id, label]) => {
            const here = view === id
            return (
              <button key={id} type="button" onClick={() => { onClose(); go(id) }}
                aria-current={here ? 'page' : undefined}
                className={cn('flex min-h-[52px] w-full items-center border-t border-rule',
                  'font-display text-sec font-medium transition-colors duration-150',
                  here ? 'text-ink' : 'text-ink-2 hoverOnly:text-ink')}>
                <span className={cn('mr-3 h-5 w-[3px] rounded-bar', here ? 'bg-accent' : 'bg-transparent')}/>
                {label}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

function Header({ view, go }) {
  const [menu, setMenu] = React.useState(false)
  const burger = React.useRef(null)
  const closeMenu = React.useCallback(() => {
    setMenu(false)
    burger.current?.focus()
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b-2 border-ink bg-mist">
      <div className="wrap flex h-14 items-center gap-1">
        <button onClick={() => go('site')} aria-label="MindMap, go to the overview"
          className="mr-1 shrink-0 rounded-field px-1 py-1 text-row text-ink
            transition-colors duration-150 hoverOnly:bg-mist sm:mr-2 sm:text-head">
          <Logo/>
        </button>

        <nav aria-label="Sections" className="hidden h-full items-stretch xl:flex">
          <button onClick={() => go('site')}
            aria-current={SECTION[view] === 'site' ? 'page' : undefined}
            className={linkClass(SECTION[view] === 'site')}>Overview</button>
          <NavMenu view={view} go={go} label="The patch" items={PATCH} section="kit"/>
          <button onClick={() => go('methods')}
            aria-current={SECTION[view] === 'methods' ? 'page' : undefined}
            className={linkClass(SECTION[view] === 'methods')}>How it works</button>
          <NavMenu view={view} go={go} label="Who uses it" items={AUDIENCE} section="who"/>
          <button onClick={() => go('survey')}
            aria-current={view === 'survey' ? 'page' : undefined}
            className={linkClass(view === 'survey')}>Give feedback</button>
          {/* Spec 0e, section 15: Guided tour is off the navigation. The
              walkthrough plays on every page load, and the tour itself is the
              fourth option in the entry chooser that opens with it. */}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
          <button onClick={() => go('app')} aria-label="Open the app"
            className={cn('inline-flex h-11 shrink-0 items-center gap-1.5 rounded-field px-3',
              'bg-accent font-display text-ui font-medium text-paper transition-colors',
              'duration-150 hoverOnly:bg-accent-ink sm:gap-2 sm:px-4')}>
            <span aria-hidden className="sm:hidden">Open app</span>
            <span aria-hidden className="hidden sm:inline">Open the app</span>
            <ArrowRight aria-hidden className="size-4 shrink-0"/>
          </button>
          <button ref={burger} type="button" onClick={() => setMenu(true)}
            aria-expanded={menu} aria-label="Open the menu"
            className="-mr-1.5 grid size-11 shrink-0 place-items-center rounded-field text-ink
              hoverOnly:bg-mist xl:hidden">
            {/* Inline, not the shared `Stack` mark: that one has a short third
                rule and reads as a text-alignment icon beside a wordmark. */}
            <svg viewBox="0 0 24 24" aria-hidden className="size-5" fill="none"
              stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16"/>
            </svg>
          </button>
        </div>
      </div>
      <ScrollProgress/>
      {menu && <Drawer view={view} go={go} onClose={closeMenu}/>}
    </header>
  )
}

/* Launch and the sharing screen are deliberately not destinations. `#/privacy`
   still resolves, and lights Parent. */
const DialMark = p => (
  <svg viewBox="0 0 24 24" width={p.size || 20} height={p.size || 20} fill="none" aria-hidden
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="shrink-0">
    <path d="M3.8 17.8a8.2 8.2 0 0 1 16.4 0"/>
    <circle cx="18.9" cy="13.7" r="1.9" fill="currentColor" stroke="none"/>
  </svg>
)

const AskMark = p => (
  <svg viewBox="0 0 24 24" width={p.size || 20} height={p.size || 20} fill="none" aria-hidden
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    className="shrink-0">
    <path d="M20.5 12.4c0 3.9-3.8 7-8.5 7a9.8 9.8 0 0 1-2.6-.35L4.8 20.4l1.1-3.3A6.7 6.7 0 0 1 3.5 12.4c0-3.9 3.8-7 8.5-7s8.5 3.1 8.5 7Z"/>
    <path d="M9.6 10.3a2.4 2.4 0 0 1 4.7.6c0 1.6-2.3 1.9-2.3 3.2"/>
  </svg>
)

const CalendarMark = p => (
  <svg viewBox="0 0 24 24" width={p.size || 20} height={p.size || 20} fill="none" aria-hidden
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="shrink-0">
    <rect x="3.5" y="5.5" width="17" height="14.5" rx="1.5"/>
    <path d="M3.5 10h17M8.5 3.5v3M15.5 3.5v3M8.6 13.6h.01M12 13.6h.01M15.4 13.6h.01M8.6 16.8h.01M12 16.8h.01"/>
  </svg>
)

/* The bar belongs to whichever app you are in.
 *
 * It used to be one bar listing the three audiences, so a student standing in
 * the student app was offered a parent dashboard and a clinical console at the
 * bottom of every screen. Nobody switches audience; you are one of them. The
 * bar now lists what is inside the app you opened, and the launcher at /#/app
 * is where the three live. */
const APP_NAV = {
  student: [
    ['app-student', 'Today',    PulseMark],
    ['reading',     'Reading',  DialMark],
    ['toolkit',     'Toolkit',  Bracket],
    ['ai',          'Ask',      AskMark, 'Ask MindMap AI'],
    ['shared',      'Sharing',  Grid],
  ],
  parent: [
    ['app-parent',  'Week',     PulseMark],
    ['calendar',    'Calendar', CalendarMark],
    ['toolkit',     'Toolkit',  Bracket],
    ['ai',          'Ask',      AskMark, 'Ask MindMap AI'],
    ['privacy',     'Sharing',  Grid],
  ],
  pro: [
    ['app-pro',     'Caseload', Grid],
    ['ai',          'Ask',      AskMark, 'Ask MindMap AI'],
    ['toolkit',     'Toolkit',  Bracket],
  ],
}

/* Which app a route belongs to. Five screens are shared by all three
   audiences, so they have no fixed answer here: they belong to whichever app
   you walked in from, which App remembers below, and the bar under them is the
   bar you had. */
const APP_OF = {
  'app-student': 'student', reading: 'student', shared: 'student',
  notes: 'student', 'app-notify': 'student', monitor: 'student',
  'app-parent': 'parent', privacy: 'parent',
  'app-pro': 'pro',
}
const SHARED_VIEWS = new Set(['toolkit','ai','calendar','help',
                              'toolkit-breathing','toolkit-ground','toolkit-reframe',
                              'toolkit-scan','toolkit-move'])

const APP_TAB = { app:null,
                  'app-student':'app-student', monitor:'app-student', reading:'reading',
                  toolkit:'toolkit', ai:'ai', notes:'ai', shared:'shared',
                  'app-notify':'shared', help:null,
                  'toolkit-breathing':'toolkit', 'toolkit-ground':'toolkit',
                  'toolkit-reframe':'toolkit', 'toolkit-scan':'toolkit',
                  'toolkit-move':'toolkit',
                  'app-parent':'app-parent', calendar:'calendar', privacy:'privacy',
                  'app-pro':'app-pro' }

/* Two spellings of each screen name. At 390 the top bar also carries the help
   button, the demo switch and the way back, so the long one would be the thing
   that gets truncated. */
const APP_TITLE = {
  app:            ['Screens',          'Screens'],
  'app-student':  ['Today',            'Today'],
  monitor:        ['Readings',         'Every reading'],
  reading:        ['Reading',          'Take a reading'],
  calendar:       ['Calendar',         'The week and the month'],
  toolkit:        ['Toolkit',          'Toolkit'],
  'toolkit-breathing': ['Breathing',   'Breathing'],
  'toolkit-ground':    ['Grounding',   'Grounding'],
  'toolkit-reframe':   ['Reframing',   'Reframing'],
  'toolkit-scan':      ['Body scan',   'Body scan'],
  'toolkit-move':      ['Moving',      'Moving'],
  /* 'MindMap AI' is 134px at 390 in a row with 116 left, so the short
     spelling is the tab's word and the full name is the heading on the
     screen and this element's accessible name. */
  ai:             ['Ask',              'MindMap AI'],
  shared:         ['Sharing',          'Sharing'],
  notes:          ['Notes',            'Notes'],
  'app-notify':   ['Reminders',        'Reminders'],
  help:           ['Help',             'Getting help'],
  'app-parent':   ['Week',             'This week'],
  privacy:        ['Sharing',          'Sharing'],
  'app-pro':      ['Caseload',         'Caseload'],
}

/* App shell, inherited by every app route.
 *
 *   ground  bg-beam/15 resolves to #d5eaef and is used by no marketing band.
 *           Every ink on it clears 4.5 : 1, the weakest ink-3 at 4.80, so a
 *           new ink used in here has to be checked.
 *   type    h1 is `head` (29px), h2 `row` (25px), under the smallest
 *           marketing heading (`sub`, 32px).
 */
const APP_SHELL = cn(
  'min-h-[100dvh] bg-beam/15',
  /* `.mark` is exempt: it is a ruled 16px label marked up as a heading, and a
     step on it would blow a hairline annotation up to 25px. */
  '[&_h1:not(.mark)]:text-head [&_h2:not(.mark)]:text-row',
  '[&_h3:not(.mark)]:text-meta [&_h4:not(.mark)]:text-ui',
  '[&_.wrap]:py-6 lg:[&_.wrap]:py-8',
)

/* Selection is carried four ways and colour is only one: rule on the cell's top
 * edge, mark fills, label bolds, ink darkens -- it survives a desaturated
 * screenshot. Cells are at least 56 tall and a quarter of the row, so the
 * smallest target is 97 x 56 at 390. The inset padding keeps labels off the
 * home indicator; the spacer below the footer keeps the bar off content.
 */
function AppTabBar({ app, view, go }) {
  const here = APP_TAB[view]
  const tabs = APP_NAV[app]
  /* The launcher has no app yet, so it has no bar. */
  if (!tabs) return null
  return (
    <nav aria-label="App screens"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-3 bg-card
        pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-[34rem] list-none p-0">
        {tabs.map(([id, label, Mark, spoken]) => {
          const on = here === id
          return (
            <li key={id} className="min-w-0 flex-1">
              <button type="button" onClick={() => go(id)}
                aria-current={on ? 'page' : undefined}
                aria-label={spoken || undefined}
                /* 51px tall at 390 and 67 past sm. Apple Fitness and Oura both
                   sit near 50 on a handset, and the old 67 here took 8% of a
                   390 x 844 screen before the top bar had its 48. */
                className={cn('relative flex min-h-[48px] w-full flex-col items-center justify-center',
                  'gap-0.5 px-0.5 pb-1 pt-1.5 transition-colors duration-150',
                  'sm:min-h-[56px] sm:gap-1 sm:px-1 sm:pb-1.5 sm:pt-2',
                  /* rule on the cell edge: the fill alone could read as hover */
                  'before:absolute before:inset-x-0 before:top-0 before:h-[2px]',
                  on ? 'text-accent-ink before:bg-accent' : 'text-ink-2 before:bg-transparent')}>
                {/* accent-wash on paper is 1.14 : 1; filled accent is 5.79. */}
                <span aria-hidden className={cn('flex h-6 w-11 items-center justify-center rounded-bar',
                  'transition-colors duration-150 sm:h-7 sm:w-14',
                  on ? 'bg-accent text-paper' : 'bg-transparent')}>
                  <Mark size={20}/>
                </span>
                <span className={cn('max-w-full truncate font-display text-fine leading-none',
                  on ? 'font-bold' : 'font-medium')}>{label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function ExitToSite({ go, className, short = false }) {
  return (
    <button type="button" onClick={() => go('site')}
      aria-label={short ? 'Back to the site' : undefined}
      className={cn('flex min-h-[44px] shrink-0 items-center gap-2 rounded-field pr-2 font-display',
        'text-ui font-medium text-ink-2 transition-colors duration-150 hoverOnly:text-ink', className)}>
      <ArrowLeft aria-hidden className="size-4 shrink-0"/>
      {short ? (
        <>
          {/* At 390 this row also carries the screen name and the demo switch.
              Both spellings are in the DOM, so the name is on the button. */}
          <span aria-hidden className="sm:hidden">Site</span>
          <span aria-hidden className="hidden sm:inline">Back to the site</span>
        </>
      ) : 'Back to the site'}
    </button>
  )
}

function AppTopBar({ view, go }) {
  const [short, long] = APP_TITLE[view] || ['App', 'App']
  return (
    <div className="sticky top-0 z-40 border-b border-ink-3 bg-card">
      {/* px-4 at 390, not the wrap's 22: this row carries the screen name, the
          help button, the demo switch and the way back, and the 12px bought
          here is 12px the name keeps. */}
      <div className="flex h-12 items-center gap-2 px-4 sm:gap-3 sm:px-10 lg:px-14">
        {/* The accent rule is ornament, so it is the first thing to go on a
            handset where the row is full. */}
        <span aria-hidden className="hidden h-4 w-[3px] shrink-0 rounded-bar bg-accent sm:block"/>
        {/* The screens dropped their own header bands, so this is each app
            route's only heading and has to be the h1. */}
        {/* Both spellings are in the DOM and CSS picks one, so the heading
            carries its name on the element: the text nodes would otherwise be
            read out one after the other. */}
        <h1 aria-label={long}
          className="min-w-0 truncate font-display text-tick font-bold text-ink">
          <span aria-hidden className="sm:hidden">{short}</span>
          <span aria-hidden className="hidden sm:inline">{long}</span>
        </h1>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          {/* First in the group, so the one control somebody might need in a
              hurry is the one nearest their thumb. */}
          <GetHelp compact/>
          <ModeToggle compact className="[&_button]:min-h-[44px]"/>
          <ExitToSite go={go} short/>
        </div>
      </div>
    </div>
  )
}

/* ink-3 on the app canvas measures 4.80 : 1, so this small print still clears
   4.5 at 14px. */
function AppFoot() {
  return (
    <footer className="border-t border-ink-3 px-4 py-5 sm:px-10 lg:px-14">
      <p className="max-w-[78ch] text-fine text-ink-3">MindMap measures physiology and reports patterns. It is not a
        medical device and does not diagnose or treat any condition. If you need urgent help, contact your
        local emergency number or a crisis line.</p>
      <p className="mt-2 text-fine text-ink-3">MindMap · Solace Innovation</p>
    </footer>
  )
}

/* Same questions and same store as the dialog in src/survey, so an answer given
   here is the answer the corner box counts. Unlike the dialog it has a url. */

function useSurveyStore() {
  return React.useSyncExternalStore(subscribe, getVersion, () => 0)
}

const pickClass = on => cn(
  'flex min-h-[44px] w-full items-center border-t border-rule pr-3 text-left',
  'font-display text-ui transition-colors duration-150 ease-out',
  on ? 'bg-accent-wash font-bold text-ink' : 'font-medium text-ink-2 hoverOnly:bg-mist hoverOnly:text-ink'
)

const Bar = ({ on }) => (
  <span aria-hidden className={cn('mr-3 h-5 w-[3px] shrink-0 rounded-bar',
    on ? 'bg-accent' : 'bg-transparent')}/>
)

const fieldClass = cn(
  'block w-full rounded-field border border-rule bg-card p-3 font-body text-sec text-ink',
  'placeholder:text-ink-3 transition-colors duration-150 ease-out hoverOnly:border-ink-3'
)

function ScaleField({ q, value, onPick }) {
  return (
    <div role="radiogroup" aria-label={q.prompt} className="mt-3 flex flex-col">
      {q.points.map(p => {
        const on = value === p.value
        return (
          <button key={p.value} type="button" role="radio" aria-checked={on}
            onClick={() => onPick(p.value, p.label)} className={pickClass(on)}>
            <Bar on={on}/>{p.label}
          </button>
        )
      })}
    </div>
  )
}

function TextField({ q, initial = '', onSave, onSkip }) {
  const [text, setText] = React.useState(initial)
  const empty = !text.trim()
  return (
    <div className="mt-3">
      <textarea rows={3} value={text} maxLength={q.maxLength} placeholder={q.placeholder}
        aria-label={q.prompt} onChange={e => setText(e.target.value)} className={fieldClass}/>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span className="note">{empty ? 'Save turns on once you write something.' : ''}</span>
        <span className="text-fine tabular-nums text-ink-3">{text.length}/{q.maxLength}</span>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <Button size="sm" type="button" disabled={empty} onClick={() => onSave(text.trim())}>Save</Button>
        {onSkip && <Button size="sm" type="button" variant="ghost" onClick={onSkip}>Skip</Button>}
      </div>
    </div>
  )
}

function SurveyField({ q, answer, onAnswer, onSkip }) {
  const v = answer?.value
  if (q.kind === 'scale') return <ScaleField q={q} value={v ?? null} onPick={onAnswer}/>
  if (q.kind === 'text')  return <TextField q={q} initial={typeof v === 'string' ? v : ''}
                                   onSave={t => onAnswer(t, null)} onSkip={q.optional ? onSkip : undefined}/>
  if (q.kind === 'stars') return (
    <div className="mt-3">
      <StarRating label={q.prompt} max={q.max} step={q.step}
        value={typeof v === 'number' ? v : null}
        onChange={n => onAnswer(n, `${n} of ${q.max}`)}/>
    </div>
  )
  return null
}

/* `sent` is read back from the store, not held here, so reopening the page after
 * a successful send does not invite a second copy. Enabled from the first
 * answer: the store stamps a partial response, so a later full one is a new
 * send rather than a no-op.
 */
function SubmitRow({ done, total }) {
  /* Derived from the store each render: a queued response is retried in the
     background and the commit re-renders through the page's subscription. */
  const [busy, setBusy] = React.useState(false)
  const empty = answersFor(PAGE).length === 0
  const state = busy ? 'sending' : wasSent() ? 'sent' : isQueued() ? 'queued' : 'idle'

  const submit = async () => {
    setBusy(true)
    try { await submitResponse({ force: true }) } finally { setBusy(false) }
  }

  /* 'queued' is saved and retried on its own, so the line is a receipt. */
  const line =
    state === 'sent' ? 'Sent. Thank you.'
      : state === 'queued' ? 'Saved. It will send on its own.'
      : done >= total ? 'That is all of them.'
      : `${total - done} to go.`

  return (
    <div className="border-t border-rule pt-5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <p className="note">{line}</p>
        <Button type="button" className="ml-auto min-h-[44px]"
          disabled={empty || state === 'sending' || state === 'sent'}
          onClick={submit}>
          {state === 'sent' ? 'Submitted'
            : state === 'sending' ? 'Sending'
            : state === 'queued' ? 'Send again'
            : 'Submit'}
        </Button>
      </div>
      {state === 'queued' && (
        <p className="note mt-2.5">
          Nothing is lost. It goes out the next time this page is open, or as soon as
          you are back online.
        </p>
      )}
      {state !== 'sent' && state !== 'queued' && !empty && done < total && (
        <p className="note mt-2.5">You can submit what you have and come back to the rest.</p>
      )}
    </div>
  )
}

function SurveyPage() {
  useSurveyStore()
  const [skipped, setSkipped] = React.useState(() => new Set())
  React.useEffect(() => { syncPending() }, [])

  const byId = new Map(answersFor(PAGE).map(a => [a.qid, a]))
  const done = REQUIRED.filter(q => byId.has(q.id)).length
  const total = REQUIRED.length
  const [visitor, setVisitor] = React.useState(() => { try { return getVisitor() } catch { return null } })
  const answer = (q, value, label) => recordAnswer({ page: PAGE, qid: q.id, kind: q.kind, value, label })

  return (
    /* <main> so this route has a main landmark for the skip link. */
    <main>
      <Section tone="paper" tight>
        <h1 className="font-display font-bold text-major leading-[1.05] tracking-tight text-ink">
          Give feedback
        </h1>
        <SectionHead className="mt-5">Reviewer Feedback</SectionHead>
        <SectionLede>
          About three minutes. Answers save as you give them, so you can stop halfway and come
          back. Nothing identifies you: no name, no email, no school.
        </SectionLede>
        <p className="mt-3.5 text-fine font-medium tabular-nums text-ink-3">
          {done} of {total} answered
        </p>
      </Section>

      {/* Asked here, where the name is actually used, rather than over the whole
          site before anyone has seen it. */}
      {!visitor && (
        <Section tone="paper" tight>
          <NameGate inline onDone={() => {
            try { setVisitor(getVisitor()) } catch { setVisitor({ name: 'Anonymous' }) }
          }}/>
        </Section>
      )}

      <Section tone="card" tight>
        <div>
          {SECTIONS.map(section => (
            <section key={section.id}
              className="mt-9 border-t border-ink pt-3 first:mt-0
                lg:grid lg:grid-cols-[17rem_minmax(0,44rem)] lg:gap-x-14">
              <div className="lg:sticky lg:top-[4.5rem] lg:self-start">
                <h2 className="font-display text-head font-bold text-ink-2">{section.title}</h2>
                {section.note && <p className="mt-1.5 max-w-[36ch] text-meta text-ink-3">{section.note}</p>}
              </div>
              <div className="mt-5 flex flex-col gap-6 lg:mt-0">
                {section.items.map(q => {
                  const a = byId.get(q.id)
                  const off = skipped.has(q.id)
                  return (
                    <div key={q.id} className="border-t border-rule pt-4">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        {/* The numeral comes from ask order, not the prompt. */}
                        <span className="text-fine tabular-nums text-ink-3">
                          {questionNumber(q.id)}
                        </span>
                        <p className="max-w-[44ch] font-display text-body font-bold text-ink">{q.prompt}</p>
                        {q.optional && <span className="note">Optional</span>}
                      </div>
                      {off && !a ? <p className="note mt-3">Skipped.</p> : (
                        <SurveyField q={q} answer={a}
                          onAnswer={(v, l) => answer(q, v, l)}
                          onSkip={() => setSkipped(new Set(skipped).add(q.id))}/>
                      )}
                      {a && (
                        <p className="mt-2.5 text-fine font-medium text-calm">
                          Saved{a.label ? `, ${a.label}` : ''}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
          <div className="mt-9 lg:grid lg:grid-cols-[17rem_minmax(0,44rem)] lg:gap-x-14">
            <div aria-hidden/>
            <SubmitRow done={done} total={total}/>
          </div>
        </div>
      </Section>
    </main>
  )
}


/* ── The demo switch defaults to real ───────────────────────────────────────
 *
 * Spec 0d, section 5: "the demo toggle should be default set to real so judge
 * can try out ... this applies to the parent and med professional interfaces
 * as will". The default itself is `FALLBACK` in src/lib/mode.js, which this
 * worker does not own, so it is corrected here on the first load that has no
 * stored choice. A stored choice is always honoured, so this never overrides
 * the switch somebody has actually touched.
 */
const MODE_KEY = 'mindmap.mode'
try {
  const stored = window.localStorage.getItem(MODE_KEY)
  if (stored !== 'demo' && stored !== 'real') setMode('real')
} catch { setMode('real') }

/* ── The start screen each audience lands on ─────────────────────────────────
 *
 * Spec 0d, section 5: "Opening any audience lands on a short start screen:
 * what the audience can do right now, as three or four actions ... With no
 * readings yet, the screen offers the actions. It never just says there is
 * nothing to show."
 *
 * Nothing is paired and nothing has been measured in real mode, which is now
 * the default, so this is what the three app routes render there. Demo mode
 * has a worked day behind it, so there it renders the dashboard instead and
 * section 6 gets its centred sentence and dial with nothing above them. The
 * fourth action on every audience is what switches the two over.
 *
 * Grounds and inks: card and aqua, ink, ink-2, ink-3, accent and accent-ink.
 * Worst text pair on the screen is ink-3 on aqua at 5.14 : 1.
 */
const START = {
  student: {
    head: 'Four Ways to Start',
    line: 'No patch is paired, so today has no reading yet.',
    actions: [
      { id:'reading', title:'Take a Reading', Mark:DialMark,
        why:'Six questions, about a minute, scored on this phone.' },
      { id:'toolkit', title:'Open the Toolkit', Mark:Bracket,
        why:'Activities for a hard hour. Nothing is stored or sent.' },
      { id:'ai', title:'Ask MindMap AI', Mark:AskMark,
        why:'A question about a pattern, answered in plain words.' },
      { id:'demo', title:'Try the Worked Day', Mark:Wave,
        why:'One full day of measurements, already scored.' },
    ],
    setup: { id:'pairing', title:'Connect a Patch', Mark:Frame,
             why:'Six steps, no cable and no host computer.' },
  },
  parent: {
    head: 'Four Ways to Start',
    line: 'No patch is paired, so this week has no days in it yet.',
    actions: [
      { id:'calendar', title:'See the Week', Mark:CalendarMark,
        why:'The week and the month against a target score.' },
      { id:'privacy', title:'Open the Sharing Record', Mark:Grid,
        why:'One value a day. Never a reading, never Notes.' },
      { id:'ai', title:'Ask MindMap AI', Mark:AskMark,
        why:'A question about a pattern, answered in plain words.' },
      { id:'demo', title:'Open the Worked Example', Mark:Wave,
        why:'One worked week, already scored, day by day.' },
    ],
    setup: { id:'pairing', title:'Connect a Patch', Mark:Frame,
             why:'Six steps, no cable and no host computer.' },
  },
  pro: {
    head: 'Four Ways to Start',
    line: 'No guardian has consented, so the caseload has no students in it.',
    actions: [
      { id:'demo', title:'Open the Worked Caseload', Mark:Wave,
        why:'A worked caseload, already scored, for review.' },
      { id:'ai', title:'Ask MindMap AI', Mark:AskMark,
        why:'A question about a pattern, answered in plain words.' },
      { id:'methods', title:'How the Mind Score Works', Mark:Rule,
        why:'Four signals, one number, on a scale of 0 to 100.' },
      { id:'help', title:'Getting Help', Mark:Search,
        why:'Names, numbers, and how to reach each one.' },
    ],
    setup: null,
  },
}

function StartAction({ action, run, className }) {
  const { Mark } = action
  return (
    <button type="button" onClick={() => run(action.id)}
      className={cn('group flex h-full min-h-[112px] w-full flex-col items-start gap-2',
        'rounded-panel border border-rule bg-card p-3 text-left transition-colors duration-150',
        'hoverOnly:border-accent hoverOnly:bg-accent-wash active:bg-accent-wash',
        'sm:min-h-[132px] sm:p-4', className)}>
      <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-field
        bg-accent-wash text-accent-ink">
        <Mark size={18}/>
      </span>
      <span className="font-display text-ui font-bold leading-[1.22] text-ink">{action.title}</span>
      {/* The reason is the first thing to go at 390, where four of these are a
          two by two grid and the titles already say what they do. */}
      <span className="hidden max-w-[34ch] text-fine text-ink-2 sm:block">{action.why}</span>
      <Chevron aria-hidden className="mt-auto size-4 shrink-0 text-accent"/>
    </button>
  )
}

function AudienceStart({ go, who }) {
  const s = START[who]
  /* One handler for both kinds of action: a route, or the switch to the worked
     example, which is the demo fixture set and says so on the toggle above. */
  const run = React.useCallback(id => {
    if (id === 'demo') setMode('demo')
    else go(id)
  }, [go])

  return (
    <main className="wrap">
      {/* An h2: the app's top bar already carries this screen's h1. */}
      <h2 className="font-display font-bold text-ink">{s.head}</h2>
      <p className="mt-1.5 max-w-[52ch] text-meta text-ink-2">{s.line}</p>

      <ul className="m-0 mt-3.5 grid list-none grid-cols-2 gap-2.5 p-0 lg:mt-4 lg:grid-cols-4 lg:gap-4">
        {s.actions.map(a => (
          <li key={a.id} className="min-w-0">
            <StartAction action={a} run={run}/>
          </li>
        ))}
      </ul>

      {/* Spec 0d, section 5: "Connecting a patch is one of the offered actions,
          not a wall of instructions." One row, one line, one control. */}
      {s.setup && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-panel border
          border-rule bg-aqua p-3.5 lg:mt-4">
          <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-field
            border border-rule bg-card text-accent-ink">
            <s.setup.Mark size={18}/>
          </span>
          <span className="min-w-[11rem] flex-1">
            <span className="block font-display text-ui font-bold text-ink">{s.setup.title}</span>
            <span className="mt-0.5 block text-fine text-ink-2">{s.setup.why}</span>
          </span>
          {/* w-full at 390: beside the line it squeezed the sentence into a
              four-line strip. It takes its own row there and sits on the end
              of the line past sm. */}
          <button type="button" onClick={() => run(s.setup.id)}
            className="inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2
              rounded-field bg-accent px-4 font-display text-ui font-medium text-paper
              transition-colors duration-150 hoverOnly:bg-accent-ink active:bg-accent-ink
              sm:w-auto">
            Start pairing
            <ArrowRight aria-hidden className="size-4 shrink-0"/>
          </button>
        </div>
      )}
    </main>
  )
}

/* The three app routes: the start screen with nothing measured, the dashboard
   with the worked set behind it. Students, Parents and Pro belong to other
   workers; nothing here reaches inside them. */
function StudentApp(p) {
  const [mode] = useMode()
  return mode === 'real' ? <AudienceStart go={p.go} who="student"/> : <Students {...p} tab="today"/>
}
function ParentApp(p) {
  const [mode] = useMode()
  return mode === 'real' ? <AudienceStart go={p.go} who="parent"/> : <Parents {...p} tab="week"/>
}
function ProApp(p) {
  const [mode] = useMode()
  return mode === 'real' ? <AudienceStart go={p.go} who="pro"/> : <Pro {...p}/>
}

/* ── Two routes whose screens belong to other workers ───────────────────────
 *
 * `ai` and `calendar` exist in spec 0e section 18 and are listed there before
 * either screen was built. These two stand in so every id in the table
 * resolves today; each one is one line to replace in the route table below and
 * nothing else in this file changes.
 *
 * MindMap AI is a real model behind a server function, with the owner's key
 * (spec 0d, section 8). Until that key exists it must not claim to be
 * answering, so this page says plainly that it is not connected and offers no
 * input to type into.
 */
function AiPending({ go }) {
  return (
    <main className="wrap">
      <h2 className="font-display font-bold text-ink">MindMap AI</h2>
      <div className="mt-3 rounded-panel border border-rule bg-card p-4">
        <p className="max-w-[56ch] text-meta text-ink-2">
          Not connected yet. MindMap AI runs on a language model behind a server
          function, and the key is not in place, so nothing on this screen is
          answering and no answer is offered.
        </p>
        <p className="mt-2.5 max-w-[56ch] text-fine text-ink-3">
          One framework for adolescent mental health, with three adaptations: the
          student, the parent and the Medical Professional. Never a diagnosis.
        </p>
        <button type="button" onClick={() => go('methods')}
          className="mt-3.5 inline-flex min-h-[44px] items-center gap-2 rounded-field border
            border-ink px-4 font-display text-ui font-medium text-ink transition-colors
            duration-150 hoverOnly:bg-mist active:bg-mist">
          How it works
          <ArrowRight aria-hidden className="size-4 shrink-0"/>
        </button>
      </div>
    </main>
  )
}

function CalendarPending({ go }) {
  return (
    <main className="wrap">
      <h2 className="font-display font-bold text-ink">The Week and the Month</h2>
      <div className="mt-3 rounded-panel border border-rule bg-card p-4">
        <p className="max-w-[56ch] text-meta text-ink-2">
          Not built yet. The calendar holds the week and the month against a
          target score the reader sets, with how often the target was met and how
          often a day ran above or below the usual range.
        </p>
        <button type="button" onClick={() => go('app-parent')}
          className="mt-3.5 inline-flex min-h-[44px] items-center gap-2 rounded-field border
            border-ink px-4 font-display text-ui font-medium text-ink transition-colors
            duration-150 hoverOnly:bg-mist active:bg-mist">
          Back to the week
          <ArrowRight aria-hidden className="size-4 shrink-0"/>
        </button>
      </div>
    </main>
  )
}

/* One resolver for the hash, for `go` and for the alias table, so a link to an
   old id lands in exactly one place. */
const resolve = raw => ALIAS[raw] || (VIEWS.includes(raw) ? raw : 'site')
const fromHash = () => resolve(location.hash.replace(/^#\/?/, ''))

export function App() {
  const [view, setView] = React.useState(fromHash)
  const mainRef = React.useRef(null)
  const [said, setSaid] = React.useState('')
  /* Which of the three apps the shared screens belong to. The Toolkit, MindMap
     AI, the calendar and Getting help are all reachable from more than one
     audience, so the bar under them is the bar of the app the reader walked in
     from rather than a guess. */
  const [audience, setAudience] = React.useState('student')
  /* Three gates in order: title sequence, name, per-page questions. The
     responses route is excluded from all three. */
  const admin = view === 'responses'
  /* Plays on every load. Only Skip suppresses it, and it does so permanently. */
  /* Navigation resets scroll, title and focus itself: focus otherwise falls to
     <body> and the scroll position carries over from the previous screen. */
  const land = React.useCallback(v => {
    if (APP_OF[v]) setAudience(APP_OF[v])
    window.scrollTo(0, 0)
    document.title = TITLE[v] || 'MindMap'
    setSaid(TITLE[v] || 'MindMap')
    requestAnimationFrame(() => {
      mainRef.current?.focus({ preventScroll: true })
      window.ScrollTrigger?.refresh()
    })
  }, [])
  /* Unknown views fall back to the overview rather than rendering nothing. */
  const go = React.useCallback(raw => {
    const v = resolve(raw)
    if (location.hash !== '#/' + v) history.pushState(null, '', '#/' + v)
    setView(v); land(v)
  }, [land])
  React.useEffect(() => {
    /* An old id in the url is rewritten once to the id spec 0e section 18
       fixes, so a bookmark of `#/check` keeps working and the address bar then
       agrees with every link on the site. A bare url is left alone. */
    if (location.hash && location.hash !== '#/' + view) {
      history.replaceState(null, '', '#/' + view)
    }
    land(view)
  }, [])
  React.useEffect(() => {
    const onPop = () => { const v = fromHash(); setView(v); land(v) }
    addEventListener('hashchange', onPop); addEventListener('popstate', onPop)
    return () => { removeEventListener('hashchange', onPop); removeEventListener('popstate', onPop) }
  }, [land])
  const wide = view !== 'site'
  React.useEffect(() => { document.documentElement.dataset.wide = String(wide) }, [wide])
  const inApp = APP_VIEWS.has(view)
  /* `app` itself is the launcher and has no bar; a shared screen takes the bar
     of the app it was opened from. */
  const appOf = APP_OF[view] || (SHARED_VIEWS.has(view) ? audience : null)

  /* The route table. Every id in spec 0e section 18 is here and resolves.
     Several routes are a tab inside a section and keep their own url. */
  const V = { site:Overview, patch:PatchPage, 'without-patch':WithoutPatch,
              tour:Tour, responses:Responses, survey:SurveyPage,
              methods:Methods, pairing:Pairing,
              students:ForStudents, parents:ForParents, pro:ForSchools,
              app:Launch,
              /* Start screen with nothing measured, dashboard with the worked
                 set behind it. */
              'app-student': StudentApp,
              'app-parent':  ParentApp,
              'app-pro':     ProApp,
              /* The student screen with every reading on it, whichever mode. */
              monitor:       p => <Students {...p} tab="today"/>,
              reading:       p => <Students {...p} tab="check"/>,
              shared:        p => <Students {...p} tab="shared"/>,
              privacy:       p => <Parents  {...p} tab="shared"/>,
              notes: () => <NotesJournal/>,
              'app-notify': () => <NotificationSettings/>,
              help: () => <HelpBody/>,
              /* Owned by other workers. `toolkit` is the list; the five
                 activity routes pass the activity down as `open`. */
              toolkit:             () => <Toolkit who={audience}/>,
              'toolkit-breathing': () => <Toolkit who={audience} open="breathing"/>,
              'toolkit-ground':    () => <Toolkit who={audience} open="ground"/>,
              'toolkit-reframe':   () => <Toolkit who={audience} open="reframe"/>,
              'toolkit-scan':      () => <Toolkit who={audience} open="scan"/>,
              'toolkit-move':      () => <Toolkit who={audience} open="move"/>,
              ai:       AiPending,
              calendar: CalendarPending }[view]
  return (
    <>
      {/* Not sr-only: that clips to 1x1, which audits read as a 1px tap target
          and which leaves a keyboard user no hit area. */}
      <a href="#main"
        onClick={e => { e.preventDefault(); mainRef.current?.focus() }}
        className="absolute left-4 top-0 z-[200] -translate-y-[200%] rounded-field bg-ink px-5 py-3
          font-display text-meta font-medium text-paper transition-transform duration-150
          focus:translate-y-4">Skip to the main content</a>
      {/* The chooser, and the guided tour behind its fourth option. It owns its
          own fixed layers and its own session flag. */}
      <Entry go={go} enabled={!admin}/>
      {/* The name is only ever used to label a survey answer, so it is asked
          inside the survey now rather than across the whole site before anyone
          has seen anything. A full-screen panel between a first-time reader and
          the product is a cost paid by everybody to serve one page. */}
      {!inApp && <Header view={view} go={go}/>}
      <Palette go={go}/>
      <p aria-live="polite" className="sr-only text-sec">{said}</p>
      {/* Nothing in here is clipped or transformed: a transform creates a
          containing block and breaks the sticky columns in the reading screen. */}
      <div className={cn(inApp && APP_SHELL)}>
        {inApp && <AppTopBar view={view} go={go}/>}
        <div id="main" ref={mainRef} tabIndex={-1} className="outline-none">
          <V go={go} key={view}/>
        </div>
        {/* Keyed by view, so leaving a page abandons a mid-answer question. */}
        {/* Marketing routes only: on a phone this pill lands on the tab bar. */}
        {!admin && !inApp && view !== 'survey' && <ReviewLauncher page={view}/>}
        {/* The extra foot room under sm is load-bearing: the feedback pill is
            fixed at bottom-4 right-4 and otherwise covers the disclaimer. */}
        {inApp ? <AppFoot/> : (
          <footer className="border-t-2 border-ink bg-mist py-11 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:pb-11">
            <div className="wrap">
              <p className="max-w-[70ch] text-meta text-ink-3">MindMap measures physiology and reports patterns. It is not a
                medical device and does not diagnose or treat any condition. If you need urgent help, contact your
                local emergency number or a crisis line.</p>
              <p className="note mt-3.5">MindMap · Solace Innovation</p>
            </div>
          </footer>
        )}
        {/* Clears the fixed tab bar: its height plus the handset's bottom
            inset. Measured: the bar is 51px at 390 and 61 at 1280. */}
        {inApp && appOf &&
          <div aria-hidden className="h-[calc(3.5rem+env(safe-area-inset-bottom))]
            sm:h-[calc(4rem+env(safe-area-inset-bottom))]"/>}
      </div>
      {inApp && <AppTabBar app={appOf} view={view} go={go}/>}
    </>
  )
}
