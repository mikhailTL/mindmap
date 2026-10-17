import React from 'react'
import { SCORE } from '../lib/terms'
import { Overview } from './Overview'
import { PatchHub } from './PatchHub'
import { Tour } from './Tour'
import { Methods } from './Methods'
import { Responses } from './Responses'
import { Entry } from './Entry'
import { SiteIntro } from './SiteIntro'
import { captureHarness } from './Intro'
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
import { MentalMirror } from './MentalMirror'
import { Parents, ParentHome, ParentTrends } from './Parents'
import { StudentTrends } from './student/TrendsTab'
import { Pro, ProHome } from './Pro'
import { Launch } from './Launch'
import { AppHome } from './AppHome'
import { ForStudents, ForParents, ForSchools } from './audience'
import { HeadsUpPage } from '../traffic/Page'
import { ModeToggle } from '../ui/mode-toggle'
import { useMode } from '../lib/mode'
import { MindMapAI } from '../ai'
import { Calendar } from './calendar'
import { Logo, LogoMark } from '../ui/logo'
import { Button } from '../ui/button'
import { StarRating } from '../ui/stars'
import { Section, SectionHead, SectionLede } from '../ui/section'
import { ArrowLeft, ArrowRight, Bracket, ChevronDown, Cross, Frame, Grid,
         People, PulseMark, Person } from '../ui/marks'
import { SignIn } from '../account/SignIn'
import { Account } from '../account/Account'
import { Network, useAutoJoin } from '../account/Network'
import { useLiveSync } from '../account/sync'
import { AccountMenu } from '../account/ui'
import { HowTo } from './howto'
import { useAccount, signOut, setPreferredRole } from '../account/store'
import { ScrollProgress } from '../ui/motion'
import { MotionConfig } from 'framer-motion'
import { motionPreference, useAppearance } from '../account/appearance'
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
  'app','app-home','app-start','student-trends','parent-trends','app-student','app-parent','app-pro','app-pro-trends',
  /* inside the product */
  'reading','mirror','calendar','toolkit','ai','help','shared','app-notify',
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
const APP_VIEWS = new Set(['app','app-start','student-trends','parent-trends','app-student','app-parent','app-pro','app-pro-trends','reading','mirror','shared',
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
  'student-trends':'Your trends in MindMap',
  'parent-trends':'Trends and calendar in MindMap',
  site:'MindMap, a wellbeing app for teenagers',
  patch:'The MindMap patch',
  'without-patch':'MindMap without the patch',
  students:'MindMap for students',
  parents:'MindMap for parents',
  pro:'MindMap for Medical Professionals',
  'heads-up':'Heads Up, by MindMap',
  app:'Open the MindMap app',
  'app-home':'The MindMap app',
  'app-start':'Choose a screen in MindMap',
  'app-pro-trends':'Caseload trends in MindMap',
  'app-student':'The student screen in MindMap',
  'app-parent':'The parent screen in MindMap',
  'app-pro':'The Medical Professional screen in MindMap',
  monitor:'Every reading in MindMap',
  reading:'Take a reading in MindMap',
  mirror:'Your Mental Mirror in MindMap',
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
    ['mirror',      'Mirror',   Person, 'Mental Mirror'],
    ['student-trends', 'Trends', CalendarMark, 'Your trends'],
    ['toolkit',     'Toolkit',  Bracket],
    ['ai',          'Ask',      AskMark, 'Ask MindMap AI'],
    ['shared',      'Privacy',  Grid],
  ],
  parent: [
    ['app-parent',  'Home',     PulseMark, 'Parent home'],
    ['parent-trends', 'Trends', CalendarMark, 'Trends and calendar'],
    ['toolkit',     'Toolkit',  Bracket],
    ['ai',          'Ask',      AskMark, 'Ask MindMap AI'],
    ['privacy',     'Privacy',  Grid],
  ],
  pro: [
    /* Short at 390, the full words past sm. The linking screen is the
       Connect tab, so two tabs never both say Network. */
    ['app-pro',     'Home',     PulseMark, 'Medical Professional home'],
    ['app-pro-trends', 'Trends', CalendarMark, 'Trends across your teens'],
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
  'app-student': 'student', reading: 'student', mirror: 'student', shared: 'student', 'student-trends': 'student',
  'parent-trends': 'parent',
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

const APP_TAB = { app:null, 'app-start':null, 'student-trends':'student-trends', 'parent-trends':'parent-trends',
                  'app-student':'app-student', monitor:'app-student', reading:'reading', mirror:'mirror',
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
                  'app-pro':'app-pro', 'app-pro-trends':'app-pro-trends',
                  /* Network is a tab only on the pro bar; on the other two it
                     lights nothing and is reached from the account portal. */
                  signin:null, account:null, 'account-section':null, network:'network' }

/* Two spellings of each screen name. At 390 the top bar also carries the help
   button, the demo switch and the way back, so the long one would be the thing
   that gets truncated. */
const APP_TITLE = {
  app:            ['Welcome',          'Welcome'],
  'app-start':    ['Welcome',          'Welcome'],
  'student-trends': ['Trends',         'Your trends'],
  'parent-trends':  ['Trends',         'Trends and calendar'],
  'app-student':  ['Student',          'Student'],
  monitor:        ['Readings',         'Every reading'],
  reading:        ['Reading',          'Take a reading'],
  mirror:         ['Mirror',           'Mental Mirror'],
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
  'app-pro':      ['Home',             'Medical Professional home'],
  'app-pro-trends': ['Trends',         'Trends across your teens'],
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
                <span className={cn('max-w-full truncate font-display leading-none',
                  /* Seven tabs on the student bar: 55px each at 390. */
                  tabs.length > 6 ? 'text-[11.5px] sm:text-fine' : 'text-fine',
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

/* Each app's own home. The Home button goes here, never to the chooser:
   somebody in the parent app has no business landing on the student side. */
const HOME_OF = { student: 'app-student', parent: 'app-parent', pro: 'app-pro' }
const ROLE_WORD = { student: 'Student', parent: 'Parent', pro: 'Medical Professional' }

const HomeMark = p => (
  <svg viewBox="0 0 24 24" width={p.size || 20} height={p.size || 20} fill="none" aria-hidden
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
    className="shrink-0">
    <path d="M3.5 11 12 4l8.5 7"/>
    <path d="M5.5 9.5V20h4.5v-5.5h4V20h4.5V9.5"/>
  </svg>
)

const SwitchMark = p => (
  <svg viewBox="0 0 24 24" width={p.size || 18} height={p.size || 18} fill="none" aria-hidden
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    className="shrink-0">
    <path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5"/>
  </svg>
)

function HomeButton({ go, app }) {
  const to = HOME_OF[app] || 'app-start'
  return (
    <button type="button" onClick={() => go(to)}
      aria-label={app ? `Home, ${ROLE_WORD[app]} app` : 'Home'} title="Home"
      className="-ml-2 grid size-11 shrink-0 place-items-center rounded-field text-ink-2
        transition-colors duration-150 hoverOnly:bg-mist hoverOnly:text-ink sm:ml-0">
      <HomeMark size={21}/>
    </button>
  )
}

/* "Switch role": the way to the start of the app as somebody else. In the
   demo nobody signs in, so it opens the three doors; live, a different role
   means a different account, so it signs out and opens sign in. */
function SwitchRole({ go, className }) {
  const [mode] = useMode()
  const me = useAccount()
  const live = mode === 'real'
  const run = () => {
    if (live && me) signOut()
    go(live ? 'app-home' : 'app-start')
  }
  return (
    <button type="button" onClick={run}
      title={live ? 'Sign out and sign in with another role' : 'Choose Student, Parent or Medical Professional'}
      className={cn('flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-field px-2 font-display',
        'text-fine font-semibold text-accent-ink transition-colors duration-150 hoverOnly:bg-accent-wash',
        'sm:text-ui', className)}>
      <SwitchMark/>Switch role
    </button>
  )
}

/* Two rows on a phone, one from sm. Row one is the brand and the account
   controls; row two is where you are. From sm both rows fold into one with
   `contents` and the order classes put them back in reading order. */
function AppTopBar({ view, go, app }) {
  const [short, long] = APP_TITLE[view] || ['App', 'App']
  return (
    <div className="sticky top-0 z-40 border-b border-ink-3 bg-card">
      <div className="flex flex-col px-4 sm:h-14 sm:flex-row sm:items-center sm:gap-3 sm:px-10 lg:px-14">
        <div className="flex h-12 items-center gap-1 sm:contents">
          {/* The corner: MindMap's mark and name, back to the site's home. */}
          <button type="button" onClick={() => go('site')} aria-label="MindMap, back to the site"
            className="order-1 -ml-1.5 flex min-h-[44px] shrink-0 items-center rounded-field px-1.5
              text-[1.15rem] text-ink transition-colors duration-150 hoverOnly:bg-mist sm:text-[1.3rem]">
            <Logo/>
          </button>
          <div className="order-4 ml-auto flex items-center gap-1 sm:gap-2">
            <GetHelp compact/>
            <ModeToggle compact className="[&_button]:min-h-[44px] [&_button]:px-2 sm:[&_button]:px-3"/>
          </div>
          <AccountMenu go={go} className="order-7 -mr-2 ml-1 w-11"/>
        </div>
        <div className="flex h-11 items-center gap-1 border-t border-rule sm:contents">
          <span aria-hidden className="order-2 hidden h-6 w-px shrink-0 bg-rule sm:block"/>
          <div className="order-2 flex min-w-0 items-center gap-1">
            <HomeButton go={go} app={app}/>
            {/* Each app route's only heading. Both spellings are in the DOM and
                CSS picks one, so the name rides on the element. */}
            <h1 aria-label={long}
              className="min-w-0 truncate font-display text-tick font-bold text-ink">
              <span aria-hidden className="sm:hidden">{short}</span>
              <span aria-hidden className="hidden sm:inline">{long}</span>
            </h1>
          </div>
          <SwitchRole go={go} className="order-5 ml-auto -mr-2 sm:ml-0 sm:mr-0"/>
        </div>
      </div>
    </div>
  )
}

/* Live, each app opens only for an account of that role. The demo stays
   open so anybody, judges included, can walk all three. */
function RoleGate({ role, go }) {
  const me = useAccount()
  const word = ROLE_WORD[role]
  return (
    <main className="wrap">
      <section className="mx-auto max-w-[34rem] rounded-panel border border-rule bg-card p-5 text-center sm:p-7">
        <span aria-hidden className="mx-auto grid size-14 place-items-center rounded-full bg-accent-wash text-accent">
          <LogoMark className="h-auto w-9"/>
        </span>
        <h2 className="mt-4 font-display text-row font-bold text-ink">The {word} app</h2>
        <p className="mx-auto mt-2 max-w-[38ch] text-ui text-ink-2">
          {me
            ? `You are signed in as a ${ROLE_WORD[me.role] || 'member'}. Sign in with a ${word} account to open this app.`
            : `Sign in with a ${word} account to open this app.`}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {me && HOME_OF[me.role] && (
            <Button onClick={() => go(HOME_OF[me.role])}>Go to your home</Button>
          )}
          <Button variant={me ? 'outline' : undefined}
            onClick={() => { if (me) signOut(); setPreferredRole(role); go('app-home') }}>
            {`Sign in as a ${word}`}
          </Button>
        </div>
        <p className="mt-4 text-fine text-ink-3">Just looking? Switch to Demo at the top to try every app without an account.</p>
      </section>
    </main>
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


/* The three app routes: the start screen with nothing measured, the dashboard
   with the worked set behind it. Students, Parents and Pro belong to other
   workers; nothing here reaches inside them. */
/* Live and Demo render the same homes; each draws its own Live state. */
function StudentApp(p) {
  return <Students {...p} tab="today"/>
}
function ParentApp(p) {
  return <ParentHome {...p}/>
}
function ProApp(p) {
  return <ProHome go={p.go}/>
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
  const [mode] = useMode()
  React.useEffect(() => { if (me) setAudience(me.role) }, [me?.id, me?.role])
  /* Three gates in order: title sequence, name, per-page questions. The
     responses route is excluded from all three. */
  const admin = view === 'responses'
  /* Navigation resets scroll, title and focus itself: focus otherwise falls to
     <body> and the scroll position carries over from the previous screen. */
  const land = React.useCallback(raw => {
    const v = idOf(raw)
    if (APP_OF[v]) setAudience(APP_OF[v])
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
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
  /* Somebody who opened an invite link joins that network as soon as they
     are signed in, whichever way they signed in. */
  useAutoJoin(go)
  /* Live mode: the snapshot (linked teens, their shared days, the teen's own
     readings) is refreshed while the tab is open, so dashboards stay current. */
  useLiveSync()

  /* The site onboarding: on every load of the landing page and every time
     the visitor comes back to it. Only the screenshot harness holds it down. */
  const [siteIntro, setSiteIntro] = React.useState(false)
  const lastView = React.useRef(null)
  React.useEffect(() => {
    if (view === 'site' && lastView.current !== 'site' && !captureHarness()) setSiteIntro(true)
    lastView.current = view
  }, [view])
  const closeIntro = React.useCallback(() => {
    setSiteIntro(false)
    requestAnimationFrame(() => document.getElementById('main')?.focus({ preventScroll: true }))
  }, [])
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

  /* Live, an app's screens need an account of that app's role. The launcher,
     sign in and the account screens are not behind it; the demo never is. */
  const roleOf = APP_OF[id] || (SHARED_VIEWS.has(id) ? appOf : null)
  const gate = inApp && mode === 'real' && roleOf && HOME_OF[roleOf] && (!me || me.role !== roleOf)
    ? roleOf : null

  /* The route table. Every id in spec 0e section 18 is here and resolves.
     Several routes are a tab inside a section and keep their own url. */
  const V = { site:Overview,
              /* One page in three parts; each route lands on its part. */
              patch: p => <PatchHub {...p} section="patch"/>,
              pairing: p => <PatchHub {...p} section="pairing"/>,
              'without-patch': p => <PatchHub {...p} section="without-patch"/>,
              tour:Tour, responses:Responses, survey:SurveyPage,
              methods:Methods,
              students:ForStudents, parents:ForParents, pro:ForSchools,
              'heads-up': HeadsUpPage,
              /* Signed out, the app home; signed in, the three doors. */
              app: me ? Launch : AppHome,
              'app-home': AppHome,
              'student-trends': p => <StudentTrends {...p}/>,
              'parent-trends': p => <ParentTrends {...p}/>,
              'app-start': Launch,
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
              /* The Mental Mirror on its own tab; the same screen sits on the
                 reading chooser as the fourth way. */
              mirror: p => <main className="wrap"><MentalMirror go={p.go}/></main>,
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
              network:  p => <Network {...p} who={appOf}/> }[id]
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
      {siteIntro && view === 'site' && <SiteIntro onDone={closeIntro}/>}
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
        {inApp && <AppTopBar view={id} go={go} app={appOf}/>}
        {inApp && !gate && <HowTo app={appOf} tab={APP_TAB[id]} go={go}/>}
        <div id="main" ref={mainRef} tabIndex={-1} className={cn('outline-none', inApp && 'flex-1')}>
          {gate ? <RoleGate role={gate} go={go}/> : <V go={go} key={view}/>}
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
