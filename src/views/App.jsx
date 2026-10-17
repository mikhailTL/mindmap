import React from 'react'
import { SCORE } from '../lib/terms'
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
import { SKILL_TOOLS, SKILL_ROUTES } from '../skills/index.js'
import { Students } from './Students'
import { Welcome } from './student/Welcome'
import { Parents } from './Parents'
import { Pro, settingLineFor } from './Pro'
import { Launch } from './Launch'
import { AppHome } from './AppHome'
import { ForStudents, ForParents, ForSchools } from './audience'
import { HeadsUpPage } from '../traffic/Page'
import { ModeToggle } from '../ui/mode-toggle'
import { useMode, setMode } from '../lib/mode'
import { MindMapAI } from '../ai'
import { Calendar } from './calendar'
import { Logo } from '../ui/logo'
import { Button } from '../ui/button'
import { StarRating } from '../ui/stars'
import { Section, SectionHead, SectionLede } from '../ui/section'
import { ArrowLeft, ArrowRight, Bracket, Chevron, ChevronDown, Cross, Frame, Grid,
         People, PulseMark, Rule, Search, Wave } from '../ui/marks'
import { SignIn } from '../account/SignIn'
import { Account } from '../account/Account'
import { Network } from '../account/Network'
import { AccountButton } from '../account/ui'
import { useAccount } from '../account/store'
import { ScrollProgress } from '../ui/motion'
import { MotionConfig } from 'framer-motion'
import { motionPreference, useAppearance } from '../account/appearance'
import { RealNotice } from '../ui/notice'
import { Frame as Photo } from '../ui/frame'
import { PatchFront } from '../charts/patch-front'
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
  /* the three audience explainer pages, and Heads Up */
  'students','parents','pro','heads-up',
  /* the product */
  'app','app-home','app-student','app-parent','app-pro','app-pro-trends',
  /* inside the product */
  'reading','calendar','toolkit','ai','help','shared','app-notify',
  /* one route per toolkit activity, spec 0d section 7 */
  'toolkit-breathing','toolkit-ground','toolkit-reframe','toolkit-scan','toolkit-move',
  'toolkit-sigh','toolkit-chest','toolkit-steady','toolkit-alert','toolkit-pocket','toolkit-walk',
  /* the five parent activities, which belong to the parent app */
  'toolkit-openers','toolkit-phrasing','toolkit-score','toolkit-rules','toolkit-reach',
  /* the five Medical Professional activities */
  'toolkit-pro-opener','toolkit-pro-triage','toolkit-pro-ground','toolkit-pro-parents','toolkit-pro-referral',
  /* the fifteen life skills, for every audience */
  ...SKILL_ROUTES,
  /* kept, not in section 18 */
  'tour','notes',
  /* accounts: sign in, the portal, its sections, and who is linked to whom */
  'signin','account','account-section','network',
]

/* The portal's sections live at #/account/<section>. The view string keeps
   the whole path; `idOf` folds it to the one route id the tables know. */
const SECTION_RE = /^account\/(profile|passcode|sharing|data|about)$/
const idOf = v => (SECTION_RE.test(v) ? 'account-section' : v)
const sectionOf = v => (SECTION_RE.exec(v) || [])[1] || null

/* Routes that render app screens, so the chrome switches: `reading` is the
   student section on its reading tab, `privacy` the parent section on its
   sharing tab, whatever the urls suggest. */
const APP_VIEWS = new Set(['app','app-student','app-parent','app-pro','app-pro-trends','reading','shared',
                           'privacy','toolkit','ai','calendar','help','monitor','notes',
                           'app-notify','toolkit-breathing','toolkit-ground','toolkit-reframe',
                           'toolkit-scan','toolkit-move','toolkit-sigh','toolkit-chest',
                           'toolkit-steady','toolkit-alert','toolkit-pocket','toolkit-walk',
                           'toolkit-openers','toolkit-phrasing','toolkit-score','toolkit-rules',
                           'toolkit-reach',
                           'toolkit-pro-opener','toolkit-pro-triage','toolkit-pro-ground',
                           'toolkit-pro-parents','toolkit-pro-referral',
                           'signin','account','account-section','network', ...SKILL_ROUTES])

/* The three account routes belong to whichever app the signed in account is
   for, and otherwise to the app the reader walked in from. */
const ACCOUNT_VIEWS = new Set(['account','account-section','network'])

/* Old ids, so a link, a bookmark or another worker's button still lands. The
   palette pushes `hub`, which is not a route. */
const ALIAS = {
  'traffic-light': 'heads-up',
  hub: 'app',
  student: 'students', parent: 'parents',
  check: 'reading',
  'kit-student': 'toolkit', 'kit-parent': 'toolkit',
}

/* Both kit ids land on the one Toolkit route, so the audience they name is
   carried here: `kit-parent` opens the parent Toolkit, not the teen one. */
const KIT_OF = { 'kit-student': 'student', 'kit-parent': 'parent' }
/* The route, without a `?…` after it: `#/network?code=ABC123` is the network
   route, and the query stays in the address for the page (and for the
   editor's ?edit=1, which src/editor/boot.js reads first) to read. */
const hashParts = () => {
  const h = location.hash.replace(/^#\/?/, '')
  const i = h.indexOf('?')
  return i < 0 ? [h, ''] : [h.slice(0, i), h.slice(i)]
}
const rawHash = () => hashParts()[0]

const TITLE = {
  site:'MindMap, a wellbeing app for teenagers',
  patch:'The MindMap patch',
  'without-patch':'MindMap without the patch',
  students:'MindMap for students',
  parents:'MindMap for parents',
  pro:'MindMap for Medical Professionals',
  'heads-up':'Heads Up, by MindMap',
  app:'Open the MindMap app',
  'app-home':'The MindMap app',
  'app-pro-trends':'Caseload trends in MindMap',
  'app-student':'The student screen in MindMap',
  'app-parent':'The parent screen in MindMap',
  'app-pro':'The Medical Professional screen in MindMap',
  monitor:'Every reading in MindMap',
  reading:'Take a reading in MindMap',
  calendar:'Your calendar in MindMap',
  toolkit:'The MindMap Toolkit',
  'toolkit-breathing':'Breathing, in the MindMap Toolkit',
  'toolkit-ground':'Grounding, in the MindMap Toolkit',
  'toolkit-reframe':'Reframing, in the MindMap Toolkit',
  'toolkit-scan':'A body scan, in the MindMap Toolkit',
  'toolkit-move':'Moving, in the MindMap Toolkit',
  'toolkit-sigh':'Long Exhale, in the MindMap Toolkit',
  'toolkit-chest':'Breath Counter, in the MindMap Toolkit',
  'toolkit-steady':'Hold Still, in the MindMap Toolkit',
  'toolkit-alert':'Reaction Test, in the MindMap Toolkit',
  'toolkit-pocket':'Breathing by Sound, in the MindMap Toolkit',
  'toolkit-walk':'Short Walk, in the MindMap Toolkit',
  'toolkit-openers':'Conversation Openers, in the MindMap Toolkit',
  'toolkit-phrasing':'Opening Line Check, in the MindMap Toolkit',
  'toolkit-score':`Reading the ${SCORE}, in the MindMap Toolkit`,
  'toolkit-rules':'Conversation Ground Rules, in the MindMap Toolkit',
  'toolkit-reach':'When to Get Help, in the MindMap Toolkit',
  'toolkit-pro-opener':'Session Openers, in the MindMap Toolkit',
  'toolkit-pro-triage':'Next Step Guide, in the MindMap Toolkit',
  'toolkit-pro-ground':'Grounding Timer, in the MindMap Toolkit',
  'toolkit-pro-parents':'Talking With Parents, in the MindMap Toolkit',
  'toolkit-pro-referral':'Referral Note, in the MindMap Toolkit',
  ...Object.fromEntries(SKILL_TOOLS.map(t => [t.route, `${t.title}, in the MindMap Toolkit`])),
  ai:'MindMap AI',
  shared:'Sharing in MindMap',
  notes:'Your notes in MindMap',
  'app-notify':'Reminders in MindMap',
  help:'Getting help in MindMap',
  privacy:'Who can see your score in MindMap',
  methods:'How MindMap works',
  pairing:'Pairing the MindMap patch',
  tour:'A guided tour of MindMap',
  responses:'Survey responses in MindMap',
  survey:'Give feedback on MindMap',
  signin:'Sign in to MindMap',
  account:'Your account in MindMap',
  'account-section':'Account settings in MindMap',
  network:'Your network in MindMap',
}

/* Two menus, because five flat tabs plus a dropdown did not fit a laptop and
   read as a pile. Pairing and the no-patch route are both about the patch, so
   they live under it. */
const PATCH = [
  ['patch',         'The patch',          'What the patch is and what it records.'],
  ['pairing',       'Pairing the patch',  'How to connect the patch to your phone.'],
  ['without-patch', 'Without the patch',  'Take a reading with your phone camera instead.'],
]

const AUDIENCE = [
  ['students', 'Students', 'What a student sees each day.'],
  ['parents',  'Parents',  'What a parent can and cannot see.'],
  ['pro',      'Medical Professionals',  'What a Medical Professional sees across a group.'],
]

/* Heads Up is its own tab, beside the audience menu rather than inside it. */
const HEADS_UP = ['heads-up', 'Heads Up', 'Tells you when phone activity is causing your teen stress.']

/* Which nav entry lights per view. The three patch pages share `kit`, the
   three audience pages `who`, and every route not named here lights nothing.
   The app routes are all in that second set: the header is not rendered over
   them at all. */
const SECTION = { site:'site', methods:'methods',
                  patch:'kit', pairing:'kit', 'without-patch':'kit',
                  students:'who', parents:'who', pro:'who', 'heads-up':'heads-up', survey:'survey' }

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

  /* The three patch pages fold into one row, as on the desktop menu. It
     opens by itself when one of them is the page you are on. */
  const onPatch = PATCH.some(([id]) => id === view)
  const [patchOpen, setPatchOpen] = React.useState(onPatch)
  const rows = [
    ['site', 'Overview'],
    'patch-group',
    ['methods', 'How it works'],
    ...AUDIENCE.map(([id, label]) => [id, label]),
    [HEADS_UP[0], HEADS_UP[1]],
    ['survey', 'Give feedback'],
  ]

  const row = (id, label, inner = false) => {
    const here = view === id
    return (
      <button key={id} type="button" onClick={() => { onClose(); go(id) }}
        aria-current={here ? 'page' : undefined}
        className={cn('flex min-h-[52px] w-full items-center border-t border-rule',
          'font-display text-sec font-medium transition-colors duration-150',
          inner && 'pl-5',
          here ? 'text-ink' : 'text-ink-2 hoverOnly:text-ink')}>
        <span className={cn('mr-3 h-5 w-[3px] rounded-bar', here ? 'bg-accent' : 'bg-transparent')}/>
        {label}
      </button>
    )
  }

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
          {rows.map(r => r === 'patch-group' ? (
            <div key="patch-group">
              <button type="button" onClick={() => setPatchOpen(o => !o)}
                aria-expanded={patchOpen} aria-controls="drawer-patch"
                className={cn('flex min-h-[52px] w-full items-center border-t border-rule',
                  'font-display text-sec font-medium transition-colors duration-150',
                  onPatch ? 'text-ink' : 'text-ink-2 hoverOnly:text-ink')}>
                <span className={cn('mr-3 h-5 w-[3px] rounded-bar', onPatch ? 'bg-accent' : 'bg-transparent')}/>
                The patch
                <ChevronDown aria-hidden className={cn('ml-auto size-4 shrink-0 transition-transform duration-150',
                  patchOpen && 'rotate-180')}/>
              </button>
              {patchOpen && (
                <div id="drawer-patch">
                  {PATCH.map(([id, label]) => row(id, id === 'patch' ? 'About the patch' : label, true))}
                </div>
              )}
            </div>
          ) : row(r[0], r[1]))}
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
    <header className="sticky top-0 z-50 border-b border-rule bg-paper/80 backdrop-blur-md supports-[backdrop-filter]:bg-paper/70">
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
          <button onClick={() => go(HEADS_UP[0])} title={HEADS_UP[2]}
            aria-current={view === HEADS_UP[0] ? 'page' : undefined}
            className={linkClass(view === HEADS_UP[0])}>{HEADS_UP[1]}</button>
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
    /* Spoken apart from the top bar's Home, which goes to the app home. */
    ['app-student', 'Home',     PulseMark, 'Student home'],
    ['reading',     'Reading',  DialMark],
    ['toolkit',     'Toolkit',  Bracket],
    ['ai',          'Ask',      AskMark, 'Ask MindMap AI'],
    ['shared',      'Privacy',  Grid],
  ],
  parent: [
    ['app-parent',  'Trends',   PulseMark],
    ['calendar',    'Calendar', CalendarMark],
    ['toolkit',     'Toolkit',  Bracket],
    ['ai',          'Ask',      AskMark, 'Ask MindMap AI'],
    ['privacy',     'Privacy',  Grid],
  ],
  pro: [
    /* Short at 390, the full words past sm. The linking screen is the
       Connect tab, so two tabs never both say Network. */
    ['app-pro',     ['Network', 'Your Network'], Grid, 'Your Network'],
    ['network',     'Connect',  People, 'Connect with parents and teens'],
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
  'toolkit-openers': 'parent', 'toolkit-phrasing': 'parent', 'toolkit-score': 'parent',
  'toolkit-rules': 'parent', 'toolkit-reach': 'parent',
  'app-pro': 'pro', 'app-pro-trends': 'pro',
  'toolkit-pro-opener': 'pro', 'toolkit-pro-triage': 'pro', 'toolkit-pro-ground': 'pro',
  'toolkit-pro-parents': 'pro', 'toolkit-pro-referral': 'pro',
}
const SHARED_VIEWS = new Set(['toolkit','ai','calendar','help',
                              'toolkit-breathing','toolkit-ground','toolkit-reframe',
                              'toolkit-scan','toolkit-move','toolkit-sigh','toolkit-chest',
                              'toolkit-steady','toolkit-alert','toolkit-pocket','toolkit-walk',
                              ...SKILL_ROUTES])

const APP_TAB = { app:null,
                  'app-student':'app-student', monitor:'app-student', reading:'reading',
                  toolkit:'toolkit', ai:'ai', notes:'ai', shared:'shared',
                  'app-notify':'shared', help:null,
                  'toolkit-breathing':'toolkit', 'toolkit-ground':'toolkit',
                  'toolkit-reframe':'toolkit', 'toolkit-scan':'toolkit',
                  'toolkit-move':'toolkit', 'toolkit-sigh':'toolkit',
                  'toolkit-chest':'toolkit', 'toolkit-steady':'toolkit',
                  'toolkit-alert':'toolkit', 'toolkit-pocket':'toolkit',
                  'toolkit-walk':'toolkit',
                  'toolkit-openers':'toolkit', 'toolkit-phrasing':'toolkit',
                  'toolkit-score':'toolkit', 'toolkit-rules':'toolkit',
                  'toolkit-reach':'toolkit',
                  'toolkit-pro-opener':'toolkit', 'toolkit-pro-triage':'toolkit',
                  'toolkit-pro-ground':'toolkit', 'toolkit-pro-parents':'toolkit',
                  'toolkit-pro-referral':'toolkit',
                  ...Object.fromEntries(SKILL_ROUTES.map(r => [r, 'toolkit'])),
                  'app-parent':'app-parent', calendar:'calendar', privacy:'privacy',
                  'app-pro':'app-pro', 'app-pro-trends':'app-pro',
                  /* Network is a tab only on the pro bar; on the other two it
                     lights nothing and is reached from the account portal. */
                  signin:null, account:null, 'account-section':null, network:'network' }

/* Two spellings of each screen name. At 390 the top bar also carries the help
   button, the demo switch and the way back, so the long one would be the thing
   that gets truncated. */
const APP_TITLE = {
  app:            ['Welcome',          'Welcome'],
  'app-student':  ['Student',          'Student'],
  monitor:        ['Readings',         'Every reading'],
  reading:        ['Reading',          'Take a reading'],
  calendar:       ['Calendar',         'Calendar'],
  toolkit:        ['Toolkit',          'Toolkit'],
  'toolkit-breathing': ['Breathing',   'Breathing'],
  'toolkit-ground':    ['Grounding',   'Grounding'],
  'toolkit-reframe':   ['Reframing',   'Reframing'],
  'toolkit-scan':      ['Body scan',   'Body scan'],
  'toolkit-move':      ['Moving',      'Moving'],
  'toolkit-sigh':      ['Exhale',      'Long Exhale'],
  'toolkit-chest':     ['Breaths',     'Breath Counter'],
  'toolkit-steady':    ['Hold still',  'Hold Still'],
  'toolkit-alert':     ['Reaction',    'Reaction Test'],
  'toolkit-pocket':    ['Sound',       'Breathing by Sound'],
  'toolkit-walk':      ['Walk',        'Short Walk'],
  'toolkit-openers':   ['Openers',     'Conversation Openers'],
  'toolkit-phrasing':  ['Line check',  'Opening Line Check'],
  'toolkit-score':     [SCORE,         `Reading the ${SCORE}`],
  'toolkit-rules':     ['Ground rules','Conversation Ground Rules'],
  'toolkit-reach':     ['Get help',    'When to Get Help'],
  'toolkit-pro-opener':   ['Openers',  'Session Openers'],
  'toolkit-pro-triage':   ['Next step','Next Step Guide'],
  'toolkit-pro-ground':   ['Grounding','Grounding Timer'],
  'toolkit-pro-parents':  ['Parents',  'Talking With Parents'],
  'toolkit-pro-referral': ['Referral', 'Referral Note'],
  ...Object.fromEntries(SKILL_TOOLS.map(t => [t.route, ['Toolkit', t.title]])),
  /* 'MindMap AI' is 134px at 390 in a row with 116 left, so the short
     spelling is the tab's word and the full name is the heading on the
     screen and this element's accessible name. */
  ai:             ['Ask',              'MindMap AI'],
  shared:         ['Privacy',          'Privacy'],
  notes:          ['Notes',            'Notes'],
  'app-notify':   ['Reminders',        'Reminders'],
  help:           ['Help',             'Getting help'],
  'app-parent':   ['Parent',           'Parent'],
  privacy:        ['Privacy',          'Privacy'],
  'app-pro':      ['Medical',          'Medical Professionals'],
  'app-pro-trends': ['Trends',         'Trends'],
  signin:         ['Sign in',          'Sign in'],
  account:        ['Account',          'Account'],
  'account-section': ['Account',       'Account'],
  network:        ['Network',          'Network'],
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
  /* Design spec 0f rule 5: the app fills a laptop. The wrap runs to 1168 at
     1280 (the wrap's own 56px gutters) and stops at 1200 on anything wider,
     so a 1920 display gets a laptop layout and not a 1680 one. */
  '[&_.wrap]:max-w-[1200px]',
  /* `.mark` is exempt: it is a ruled 16px label marked up as a heading, and a
     step on it would blow a hairline annotation up to 25px. */
  /* The h1 is the top bar's title. Below sm the row also carries five
     controls, so it steps down to `row` (22px): "Reminders" is 125px at
     `head` and the title has 115. */
  '[&_h1:not(.mark)]:text-row sm:[&_h1:not(.mark)]:text-head [&_h2:not(.mark)]:text-row',
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
      /* The one dark band the app keeps (design spec 0f rule 7): the bar is
         ink, the way Apple Fitness and Dexcom draw theirs. mist on ink is
         12.1 : 1, accent-lit on ink 7.67. */
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink bg-ink
        pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-[40rem] list-none p-0">
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
                  on ? 'text-accent-lit before:bg-accent-lit' : 'text-mist before:bg-transparent')}>
                <span aria-hidden className={cn('flex h-6 w-11 items-center justify-center rounded-bar',
                  'transition-colors duration-150 sm:h-7 sm:w-14',
                  on ? 'bg-accent-lit text-ink' : 'bg-transparent')}>
                  <Mark size={20}/>
                </span>
                <span className={cn('max-w-full truncate font-display text-fine leading-none',
                  on ? 'font-bold' : 'font-medium')}>
                  {Array.isArray(label) ? <>
                    <span className="sm:hidden">{label[0]}</span>
                    <span className="hidden sm:inline">{label[1]}</span>
                  </> : label}
                </span>
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
      className={cn('flex min-h-[44px] shrink-0 items-center gap-2 rounded-field font-display',
        'text-ui font-medium text-ink-2 transition-colors duration-150 hoverOnly:text-ink',
        /* Below sm the word goes and the arrow sits in a 44 square: the row
           at 390 also carries the account button now. */
        short ? 'min-w-[44px] justify-center sm:min-w-0 sm:justify-start sm:pr-2' : 'pr-2', className)}>
      <ArrowLeft aria-hidden className="size-4 shrink-0"/>
      {short ? <span aria-hidden className="hidden sm:inline">Site</span> : 'Back to the site'}
    </button>
  )
}

const HomeMark = p => (
  <svg viewBox="0 0 24 24" width={p.size || 20} height={p.size || 20} fill="none" aria-hidden
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
    className="shrink-0">
    <path d="M3.5 11 12 4l8.5 7"/>
    <path d="M5.5 9.5V20h4.5v-5.5h4V20h4.5V9.5"/>
  </svg>
)

/* The way back to the app home (#/app-home), on every app screen. First in
   the row, where a home control is looked for. */
function HomeButton({ go }) {
  return (
    <button type="button" onClick={() => go('app-home')} aria-label="Home" title="Home"
      className="-ml-2 grid size-11 shrink-0 place-items-center rounded-field text-ink-2
        transition-colors duration-150 hoverOnly:bg-mist hoverOnly:text-ink sm:-ml-3">
      <HomeMark size={21}/>
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
      <div className="flex h-12 items-center gap-1 px-4 sm:gap-3 sm:px-10 lg:px-14">
        <HomeButton go={go}/>
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
        {/* Five controls at 390: help 44, the toggle 101, the way back 44 and
            the account 40, at 4px gaps, which leaves the heading the 121px it
            had before the account button arrived. */}
        <div className="ml-auto flex items-center gap-1 sm:gap-3">
          {/* First in the group, so the one control somebody might need in a
              hurry is the one nearest their thumb. */}
          <GetHelp compact/>
          <ModeToggle compact className="[&_button]:min-h-[44px] [&_button]:px-2 sm:[&_button]:px-3"/>
          {/* Off below sm, where the Home button took its room: the app home
              carries the link to the site. */}
          <ExitToSite go={go} short className="hidden sm:flex"/>
          {/* Last, at the right: the way to sign in, or to the account. */}
          <AccountButton go={go} className="-mr-2 w-10 sm:w-11"/>
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
      {/* Two lines, ten words each at most (design spec 0f). */}
      <p className="text-fine text-ink-3">MindMap is not a medical device and gives no diagnosis.</p>
      <p className="mt-1 text-fine text-ink-3">For urgent help, call your local emergency number. MindMap · Solace Innovation</p>
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
    state === 'sent' ? 'Your answers were sent. Thank you.'
      : state === 'queued' ? 'Your answers are saved and will send on their own.'
      : done >= total ? 'You have answered every question.'
      : `${total - done} left to answer.`

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
          Your answers will send the next time you open this page online.
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
        <SectionHead className="mt-5">Tell us what you think</SectionHead>
        <SectionLede>
          The survey takes about three minutes. Answers save as you go, so you can stop
          halfway and come back. No email or school is collected.
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
/* Twelve tiles, one drawing (the reading tile is about the patch) and eleven
   photographs. The owner: "3 of the stock images under parent dashboard are
   the same, needs to be a variety for all 4 across all 3 audiences." No two
   tiles here show the same people: parent-card, parent-hero and parent-laptop
   are one shoot, as are pro-hero and school-card, so each set appears once. */
const START = {
  student: {
    head: 'Start here',
    actions: [
      { id:'reading', title:'Take a reading',    Mark:DialMark, art:'patch' },
      { id:'toolkit', title:'Open the Toolkit',  Mark:Bracket,
        photo:'student-basketball', alt:'A teenager dribbling a basketball on an outdoor court' },
      { id:'ai',      title:'Ask MindMap AI',    Mark:AskMark,
        photo:'student-homework', alt:'A teenager in headphones writing in a notebook at a desk' },
      { id:'demo',    title:'View Demo',         Mark:Wave,
        photo:'student-bus', alt:'Two boys laughing together on a school bus seat, one holding a phone' },
    ],
    setup: { id:'pairing', title:'Connect a patch', Mark:Frame, cta:'Start pairing' },
  },
  parent: {
    head: 'Start here',
    actions: [
      { id:'calendar', title:'Analyze trends',   Mark:CalendarMark,
        photo:'parent-laptop', alt:'A mother and her teenage son at a dining table, looking at an open laptop' },
      { id:'privacy',  title:'What is shared',   Mark:Grid,
        photo:'parent-kitchen', alt:'A mother and her teenage son chopping vegetables side by side at a kitchen counter' },
      { id:'ai',       title:'Ask MindMap AI',   Mark:AskMark,
        photo:'student-controller', alt:'A teenager in headphones holding a game controller on a sofa at home' },
      { id:'demo',     title:'View Demo',        Mark:Wave,
        photo:'friends-steps', alt:'Two students on concrete steps outside, heads together over a notebook' },
    ],
    /* Static: no light here, since nothing has been measured. */
    feature: { id:'heads-up', title:'Heads Up',
      line:'Tells you when phone activity is causing your teen stress.', cta:'See how Heads Up works' },
    setup: { id:'pairing', title:'Connect a patch', Mark:Frame, cta:'Start pairing' },
  },
  pro: {
    head: 'Start here',
    /* The worked example goes last: the owner wants every feature first. */
    actions: [
      { id:'ai',      title:'Ask MindMap AI',    Mark:AskMark,
        photo:'pro-hero', alt:'A woman with a notepad listening to a teenager on a sofa' },
      /* The caseload dashboard with nobody added yet, in live mode. */
      { id:'app-pro-trends', title:'View Trends', Mark:PulseMark,
        photo:'students-hallway', alt:'Four students walking and talking down a school corridor' },
      { id:'help',    title:'Get help',          Mark:Search,
        photo:'clinic-talk', alt:'A man and a teenage boy talking on a sofa by a sunlit window' },
      { id:'demo',    title:'View sample caseload', Mark:Wave,
        photo:'student-card', alt:'Five teenagers walking together through a park' },
    ],
    /* The setup slot the other two audiences use for the patch: here it is
       the network, parents and teens alike. */
    setup: { id:'network', title:'Your Network', Mark:People, cta:'Connect with parents and teens' },
  },
}

/* An action is a picture, an icon and two to four words (design spec 0f rule
   4). No sentence under it at any width. The owner on the icon-only tiles:
   "needs to add images of hardware or examples of stuff ... needs to be
   visual regardless of if its real or demo". A photograph, or the patch
   drawing where the action is about the patch. */
function StartAction({ action, run, className }) {
  const { Mark } = action
  return (
    <button type="button" onClick={() => run(action.id)}
      className={cn('group flex h-full w-full flex-col items-start overflow-hidden',
        'rounded-panel border border-rule bg-card text-left transition-colors',
        'duration-150 hoverOnly:border-accent active:bg-accent-wash', className)}>
      {/* One shape at every width, 16:9, narrower than any tile photograph's
          widest safe crop (parent-kitchen, 1.9), so the frame never grows a
          box and every tile's words sit on one line across the row. */}
      <span aria-hidden className="relative block aspect-[16/9] w-full shrink-0 overflow-hidden bg-accent-wash">
        {action.art === 'patch'
          ? <span className="flex h-full w-full items-center justify-center"><PatchFront className="h-[84%] w-auto"/></span>
          : <Photo photo={action.photo} alt={action.alt} className="absolute inset-0"/>}
        <span className="absolute left-2.5 top-2.5 flex size-8 items-center justify-center rounded-field
          bg-card/90 text-accent-ink shadow-[0_1px_4px_rgba(0,0,0,0.18)] backdrop-blur-sm">
          <Mark size={16}/>
        </span>
      </span>
      <span className="flex w-full items-center justify-between gap-2 p-3 sm:p-3.5 lg:px-4 lg:py-3.5">
        <span className="font-display text-ui font-bold leading-[1.22] text-ink">{action.title}</span>
        <Chevron aria-hidden className="mb-0.5 size-4 shrink-0 text-accent"/>
      </span>
    </button>
  )
}

function AudienceStart({ go, who }) {
  const s = START[who]
  const me = useAccount()
  const settingLine = who === 'pro' ? settingLineFor(me) : null
  /* One handler for both kinds of action: a route, or the switch to the worked
     example, which is the demo fixture set and says so on the toggle above. */
  const run = React.useCallback(id => {
    if (id === 'demo') setMode('demo')
    else if (id === 'app-pro-trends') { setMode('real'); go(id) }
    else go(id)
  }, [go])

  /* The setup card. On the pro screen it comes before the tiles, so the
     sample caseload stays the last control. */
  const setup = s.setup && (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-3 rounded-panel border',
      'border-ink bg-ink p-3.5 lg:p-4', who === 'pro' ? 'mt-3.5 lg:mt-4' : 'mt-2.5 lg:mt-4')}>
      {/* The patch drawing for the pairing card; the pro card is about
          people, so it keeps its mark. */}
      <span aria-hidden className="flex h-12 w-16 shrink-0 items-center justify-center rounded-field bg-paper/10 text-accent-lit">
        {s.setup.id === 'pairing' ? <PatchFront className="h-10 w-auto"/> : <s.setup.Mark size={22}/>}
      </span>
      <span className="min-w-[9rem] flex-1 font-display text-ui font-bold text-paper">
        {s.setup.title}</span>
      <button type="button" onClick={() => run(s.setup.id)}
        className="inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2
          rounded-field bg-accent px-4 font-display text-ui font-medium text-paper
          transition-colors duration-150 hoverOnly:bg-accent-lit hoverOnly:text-ink
          active:bg-accent-lit active:text-ink sm:w-auto">
        {s.setup.cta}
        <ArrowRight aria-hidden className="size-4 shrink-0"/>
      </button>
    </div>
  )

  return (
    <main className="wrap">
      {/* The owner: "based on the user's account name, it greets them with a
          welcome ____ (name) on this page". Only here, live mode, so with
          nobody signed in Welcome has no name and draws nothing. */}
      {me && <Welcome className="mb-3"/>}
      {/* An h2: the app's top bar already carries this screen's h1. */}
      <h2 className="font-display font-bold text-ink">{s.head}</h2>
      {/* The pro start screen has no patch to pair, so it says nothing about one. */}
      {who === 'pro'
        ? settingLine && <p className="mt-2 text-fine text-ink-3">{settingLine}</p>
        : <RealNotice className="mt-2" inline>No patch is paired yet.</RealNotice>}

      {who === 'pro' && setup}

      <ul className={cn('m-0 grid list-none grid-cols-2 gap-2.5 p-0 lg:grid-cols-4 lg:gap-4',
        who === 'pro' ? 'mt-2.5 lg:mt-4' : 'mt-3.5 lg:mt-4')}>
        {s.actions.map(a => (
          <li key={a.id} className="min-w-0">
            <StartAction action={a} run={run}/>
          </li>
        ))}
      </ul>

      {s.feature && (
        <section aria-labelledby="start-feature" className="mt-2.5 rounded-panel border border-rule
          bg-card p-3.5 lg:mt-4 lg:p-4">
          <h3 id="start-feature" className="m-0 font-display text-ui font-bold text-ink">{s.feature.title}</h3>
          <p className="mt-1 max-w-[52ch] text-sec text-ink-2">{s.feature.line}</p>
          <button type="button" onClick={() => run(s.feature.id)}
            className="mt-1.5 inline-flex min-h-[44px] items-center gap-2 font-display text-ui
              font-bold text-accent underline decoration-accent/40 underline-offset-4
              hoverOnly:text-accent-ink">
            {s.feature.cta}</button>
        </section>
      )}

      {/* Spec 0d section 5: connecting a patch is one of the offered actions.
          The one dark card on the screen (spec 0f rule 7): paper on ink is
          14.47 : 1, and the control is the solid accent fill. */}
      {who !== 'pro' && setup}
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
/* One resolver for the hash, for `go` and for the alias table, so a link to an
   old id lands in exactly one place. */
const resolve = r => {
  const raw = String(r ?? '').split('?')[0]
  return ALIAS[raw] || (VIEWS.includes(raw) || SECTION_RE.test(raw) ? raw : 'site')
}
const fromHash = () => resolve(rawHash())

export function App() {
  /* Re-renders on the Reduce motion setting, so framer-motion follows it too. */
  useAppearance()
  const [view, setView] = React.useState(fromHash)
  const mainRef = React.useRef(null)
  const [said, setSaid] = React.useState('')
  /* Which of the three apps the shared screens belong to. The Toolkit, MindMap
     AI, the calendar and Getting help are all reachable from more than one
     audience, so the bar under them is the bar of the app the reader walked in
     from rather than a guess. */
  const [audience, setAudience] = React.useState('student')
  /* The signed in account, if any. Signing in moves the shared screens to
     that account's app; nothing is gated on it. */
  const me = useAccount()
  React.useEffect(() => { if (me) setAudience(me.role) }, [me?.id, me?.role])
  /* Three gates in order: title sequence, name, per-page questions. The
     responses route is excluded from all three. */
  const admin = view === 'responses'
  /* Plays on every load. Only Skip suppresses it, and it does so permanently. */
  /* Navigation resets scroll, title and focus itself: focus otherwise falls to
     <body> and the scroll position carries over from the previous screen. */
  const land = React.useCallback(raw => {
    const v = idOf(raw)
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
    if (KIT_OF[raw]) setAudience(KIT_OF[raw])
    const v = resolve(raw)
    const q = String(raw ?? '').includes('?') ? String(raw).slice(String(raw).indexOf('?')) : ''
    if (location.hash !== '#/' + v + q) history.pushState(null, '', '#/' + v + q)
    setView(v); land(v)
  }, [land])
  React.useEffect(() => {
    /* An old id in the url is rewritten once to the id spec 0e section 18
       fixes, so a bookmark of `#/check` keeps working and the address bar then
       agrees with every link on the site. A bare url is left alone. */
    if (KIT_OF[rawHash()]) setAudience(KIT_OF[rawHash()])
    if (location.hash && rawHash() !== view) {
      history.replaceState(null, '', '#/' + view + hashParts()[1])
    }
    land(view)
  }, [])
  React.useEffect(() => {
    const onPop = () => {
      if (KIT_OF[rawHash()]) setAudience(KIT_OF[rawHash()])
      const v = fromHash(); setView(v); land(v)
    }
    addEventListener('hashchange', onPop); addEventListener('popstate', onPop)
    return () => { removeEventListener('hashchange', onPop); removeEventListener('popstate', onPop) }
  }, [land])
  const wide = view !== 'site'
  React.useEffect(() => { document.documentElement.dataset.wide = String(wide) }, [wide])
  /* The route id: a portal section folds to `account-section`. */
  const id = idOf(view)
  /* The app home stands alone, centred, with no bar above or below: at
     #/app-home always, and at #/app until somebody has signed in. */
  const bare = id === 'app-home' || (id === 'app' && !me)
  const inApp = APP_VIEWS.has(id) && !bare
  /* `app` itself is the launcher and has no bar; a shared screen takes the bar
     of the app it was opened from. */
  const appOf = APP_OF[id]
    || (ACCOUNT_VIEWS.has(id) && me ? me.role : null)
    || (SHARED_VIEWS.has(id) || ACCOUNT_VIEWS.has(id) ? audience : null)

  /* The route table. Every id in spec 0e section 18 is here and resolves.
     Several routes are a tab inside a section and keep their own url. */
  const V = { site:Overview, patch:PatchPage, 'without-patch':WithoutPatch,
              tour:Tour, responses:Responses, survey:SurveyPage,
              methods:Methods, pairing:Pairing,
              students:ForStudents, parents:ForParents, pro:ForSchools,
              'heads-up': HeadsUpPage,
              /* Signed out, the app home; signed in, the three doors. */
              app: me ? Launch : AppHome,
              'app-home': AppHome,
              /* Start screen with nothing measured, dashboard with the worked
                 set behind it. */
              'app-student': StudentApp,
              'app-parent':  ParentApp,
              'app-pro':     ProApp,
              /* "View Trends": the caseload dashboard in live mode, with
                 nobody added yet. Pro.jsx draws its own empty state. */
              'app-pro-trends': p => <Pro {...p}/>,
              /* The student screen with every reading on it, whichever mode. */
              monitor:       p => <Students {...p} tab="today"/>,
              reading:       p => <Students {...p} tab="check"/>,
              shared:        p => <Students {...p} tab="shared"/>,
              privacy:       p => <Parents  {...p} tab="shared"/>,
              notes: () => <NotesJournal/>,
              /* Both bodies arrive without the app's gutters, so they get the
                 wrap here. */
              'app-notify': () => <main className="wrap"><NotificationSettings/></main>,
              help: () => <main className="wrap"><HelpBody/></main>,
              /* Owned by other workers. `toolkit` is the list; the eleven
                 activity routes pass the activity down as `open`. */
              toolkit:             () => <Toolkit who={audience}/>,
              'toolkit-breathing': () => <Toolkit who={audience} open="breathing"/>,
              'toolkit-ground':    () => <Toolkit who={audience} open="ground"/>,
              'toolkit-reframe':   () => <Toolkit who={audience} open="reframe"/>,
              'toolkit-scan':      () => <Toolkit who={audience} open="scan"/>,
              'toolkit-move':      () => <Toolkit who={audience} open="move"/>,
              'toolkit-sigh':      () => <Toolkit who={audience} open="sigh"/>,
              'toolkit-chest':     () => <Toolkit who={audience} open="chest"/>,
              'toolkit-steady':    () => <Toolkit who={audience} open="steady"/>,
              'toolkit-alert':     () => <Toolkit who={audience} open="alert"/>,
              'toolkit-pocket':    () => <Toolkit who={audience} open="pocket"/>,
              'toolkit-walk':      () => <Toolkit who={audience} open="walk"/>,
              /* The parent set: parent routes, so always the parent shell. */
              'toolkit-openers':   () => <Toolkit who="parent" open="openers"/>,
              'toolkit-phrasing':  () => <Toolkit who="parent" open="phrasing"/>,
              'toolkit-score':     () => <Toolkit who="parent" open="score"/>,
              'toolkit-rules':     () => <Toolkit who="parent" open="rules"/>,
              'toolkit-reach':     () => <Toolkit who="parent" open="reach"/>,
              /* The Medical Professional set: always the pro shell. */
              'toolkit-pro-opener':   () => <Toolkit who="pro" open="pro-opener"/>,
              'toolkit-pro-triage':   () => <Toolkit who="pro" open="pro-triage"/>,
              'toolkit-pro-ground':   () => <Toolkit who="pro" open="pro-ground"/>,
              'toolkit-pro-parents':  () => <Toolkit who="pro" open="pro-parents"/>,
              'toolkit-pro-referral': () => <Toolkit who="pro" open="pro-referral"/>,
              /* The life skills, audience independent like the exercises. */
              ...Object.fromEntries(SKILL_TOOLS.map(t => [t.route, () => <Toolkit who={audience} open={t.id}/>])),
              ai:       p => <MindMapAI {...p} who={audience}/>,
              calendar: p => <Calendar {...p} who={audience}/>,
              /* Accounts, kept on this device. */
              signin:   SignIn,
              account:  Account,
              'account-section': p => <Account {...p} section={sectionOf(view)}/>,
              network:  Network }[id]
  return (
    <MotionConfig reducedMotion={motionPreference()}>
      {/* Not sr-only: that clips to 1x1, which audits read as a 1px tap target
          and which leaves a keyboard user no hit area. */}
      <a href="#main"
        onClick={e => { e.preventDefault(); mainRef.current?.focus() }}
        className="absolute left-4 top-0 z-[200] -translate-y-[200%] rounded-field bg-ink px-5 py-3
          font-display text-meta font-medium text-paper transition-transform duration-150
          focus:translate-y-4">Skip to the main content</a>
      {/* The chooser, and the guided tour behind its fourth option. It owns its
          own fixed layers and its own session flag. */}
      <Entry go={go} enabled={!admin && !bare}/>
      {/* The name is only ever used to label a survey answer, so it is asked
          inside the survey now rather than across the whole site before anyone
          has seen anything. A full-screen panel between a first-time reader and
          the product is a cost paid by everybody to serve one page. */}
      {!inApp && !bare && <Header view={view} go={go}/>}
      <p aria-live="polite" className="sr-only text-sec">{said}</p>
      {/* Nothing in here is clipped or transformed: a transform creates a
          containing block and breaks the sticky columns in the reading screen. */}
      {/* In the app the shell is a column, so a short screen (the start
          screen, MindMap AI unconnected) keeps its foot at the bottom of the
          viewport rather than a third of the way down a blank page. */}
      <div className={cn(inApp && APP_SHELL, inApp && 'flex flex-col')}>
        {inApp && <AppTopBar view={id} go={go}/>}
        <div id="main" ref={mainRef} tabIndex={-1} className={cn('outline-none', inApp && 'flex-1')}>
          <V go={go} key={view}/>
        </div>
        {/* Keyed by view, so leaving a page abandons a mid-answer question. */}
        {/* Marketing routes only: on a phone this pill lands on the tab bar. */}
        {!admin && !inApp && !bare && view !== 'survey' && id !== 'heads-up' && <ReviewLauncher page={view}/>}
        {/* The extra foot room under sm is load-bearing: the feedback pill is
            fixed at bottom-4 right-4 and otherwise covers the disclaimer. */}
        {/* Heads Up draws its own one-line footer, so the site footer stays off it. */}
        {inApp ? <AppFoot/> : id === 'heads-up' || bare ? null : (
          <footer className="border-t-2 border-ink bg-mist py-11 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:pb-11">
            <div className="wrap">
              <p className="max-w-[70ch] text-meta text-ink-3">MindMap measures body signals and shows patterns. It is not a
                medical device and does not diagnose or treat any condition. If you need urgent help, call your
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
      {inApp && <AppTabBar app={appOf} view={id} go={go}/>}
    </MotionConfig>
  )
}
