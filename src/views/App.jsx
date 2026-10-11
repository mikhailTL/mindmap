import React from 'react'
import { Overview } from './Overview'
import { PatchPage } from './PatchPage'
import { WithoutPatch } from './WithoutPatch'
import { Tour } from './Tour'
import { Responses } from './Responses'
import { Intro, introSuppressed } from './Intro'
import { NameGate } from '../survey/NameGate'
import { ReviewLauncher } from '../survey/Survey'
import { PAGE, REQUIRED, SECTIONS } from '../survey/questions'
import {
  answersFor, exportRows, getVersion, getVisitor,
  recordAnswer, subscribe, syncPending, toCSV,
} from '../survey/store'
import { Students } from './Students'
import { Parents } from './Parents'
import { Pro } from './Pro'
import { Launch } from './Launch'
import { ForStudents, ForParents, ForSchools } from './audience'
import { ModeToggle } from '../ui/mode-toggle'
import { Palette } from '../ui/palette'
import { Logo } from '../ui/logo'
import { Button } from '../ui/button'
import { StarRating } from '../ui/stars'
import { Section, SectionHead, SectionLede } from '../ui/section'
import { ArrowLeft, ArrowRight, Bracket, ChevronDown, Cross, Grid, PulseMark } from '../ui/marks'
import { ScrollProgress } from '../s21/motion'
import { cn } from '../lib/utils'

/* The nav tabs used to drop a first-time visitor straight into a screen full
   of somebody else's readings. They now open a walkthrough of what MindMap
   does for that audience, and the app itself is behind one deliberate door:
   Launch. `app-*` are the real dashboards; `student`/`parent`/`pro` are the
   explanations of them. The old `check` and `privacy` urls still resolve, so
   nothing that was ever linked is broken.

   `survey` is new. The usability survey was only reachable from a box that
   appears in the corner after three routes have been visited, which meant a
   reviewer who came to do one job could not find the job. It has a url now
   and a place in the bar; the corner box still works for everyone who never
   goes looking. */
const VIEWS = ['site','patch','without-patch','student','parent','pro','app','app-student',
               'app-parent','app-pro','check','privacy','tour','responses','survey']

/* One bar was serving two different things.
 *
 * Half of these routes are a website: they argue for MindMap to somebody who
 * has not used it. The other half are the product: the screens a student, a
 * parent or a counselor would open on a Tuesday. Navigating a dashboard with
 * the same bar that sells the dashboard is what made this read as a prototype,
 * so the chrome now switches on the route. Marketing keeps the top bar; the
 * app gets a tab bar on a phone and a rail on a desktop, which is what every
 * product of this shape does, Oura and Dexcom included.
 *
 * `check` and `privacy` are in here because they render app screens, whatever
 * their urls suggest: `check` is the student section on its reading tab and
 * `privacy` is the parent section on its sharing tab. */
const APP_VIEWS = new Set(['app','app-student','app-parent','app-pro','check','privacy'])

/* The command palette ships an entry whose id is `hub`, which is not a route
   and used to render nothing at all. Rather than let any caller push a view
   that does not exist, `go` resolves through here first. */
const ALIAS = { hub: 'app' }

/* These are the browser tab text, which is the one string on this site a
   reader meets before the page has drawn. They were written as headlines with
   an em dash hinge in each one ("The patch, em dash, MindMap"), so a row of
   open tabs read as a row of identical fragments. Plain sentences now, no
   dashes, the distinguishing word first. */
const TITLE = {
  site:'MindMap, a wellness app for teenagers',
  patch:'The MindMap patch',
  'without-patch':'MindMap without the patch',
  student:'MindMap for students',
  parent:'MindMap for parents',
  pro:'MindMap for schools',
  app:'Open the MindMap app',
  'app-student':'The student screen in MindMap',
  'app-parent':'The parent screen in MindMap',
  'app-pro':'The counselor console in MindMap',
  check:'Take a reading in MindMap',
  privacy:'Who can see what in MindMap',
  tour:'A guided tour of MindMap',
  responses:'Survey responses in MindMap',
  survey:'Give feedback on MindMap',
}

/* The bar carried six flat tabs, three of which were "For students", "For
   parents", "For schools". Three entries of the same shape, differing by one
   word, is a list that should have been a list: they are one question, "who
   is this for", and they belong behind one control. What is left at the top
   level is the three things a stranger reads in order, then that question,
   then the survey.

   "No patch" was the label on the phone-only route, and read as an error
   state: the same two words the app prints when no hardware is paired. It
   names the thing you do use now, not the thing you do not. */
const MAIN = [
  ['site',          'Overview'],
  ['patch',         'The patch'],
  ['without-patch', 'Without the patch'],
]

/* The audience menu. Each one gets a line of its own, because "Students" on
   its own does not say whether it is the app, the argument, or a sign-up. */
const AUDIENCE = [
  ['student', 'Students', 'What a week of readings looks like'],
  ['parent',  'Parents',  'What a parent is shown, and what they are not'],
  ['pro',     'Schools',  'What a counselor sees across a year group'],
]

/* Which top-level section each view belongs under. The three audience pages
   all light the one menu trigger, so the bar still says where you are. */
const SECTION = { site:'site', patch:'patch', 'without-patch':'without-patch',
                  student:'who', parent:'who', pro:'who', survey:'survey',
                  /* the app lives under no tab: it is reached through Open the
                     app, so no nav entry should light up while you are inside */
                  app:null, 'app-student':null, 'app-parent':null, 'app-pro':null,
                  check:null, privacy:null, tour:null, responses:null }

/* Every nav label used to be preceded by a counting numeral, 01 through 06.
   Numbering a reader through a website tells them how much is left rather
   than what any of it is, and at 390px those numerals were the reason the bar
   wrapped to a third row. There is not a counting numeral left in here. */

/* Tight cells until there is width to spend. The bar has to hold a wordmark,
   five labels, the demo switch and the key on one line, and the roomier
   spacing only fits once past 1536. */
const linkClass = on => cn(
  'relative flex h-full items-center whitespace-nowrap px-2.5 font-display text-ui font-medium 2xl:px-3.5',
  'transition-colors duration-150',
  'after:pointer-events-none after:absolute after:inset-x-2 after:bottom-0 after:h-[2px]',
  on ? 'text-ink after:bg-accent' : 'text-ink-2 after:bg-transparent hover:text-ink hover:after:bg-rule'
)

/* The audience menu, hand rolled.
 *
 * There is no Radix menu package in this project and this is not worth adding
 * one for, but a div that shows a list on click is not a menu: a keyboard user
 * gets no arrow keys, no way out but Tab, and no idea the trigger does
 * anything. So the four things that actually make it a menu are here and the
 * rest is markup. Open on click, Escape and an outside press close it, the
 * arrows walk the items, and closing by keyboard puts focus back on the
 * trigger, because focus that falls to <body> loses a keyboard user the page.
 */
function AudienceMenu({ view, go }) {
  const [open, setOpen] = React.useState(false)
  const [at, setAt] = React.useState(0)
  const wrap = React.useRef(null)
  const trigger = React.useRef(null)
  const items = React.useRef([])
  const on = SECTION[view] === 'who'

  const close = React.useCallback((refocus = true) => {
    setOpen(false)
    if (refocus) trigger.current?.focus()
  }, [])

  /* Pointer down rather than click: a click that lands on another nav button
     should close this and open that in one press, not take two. */
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
      e.preventDefault(); openAt(AUDIENCE.length - 1)
    }
  }

  function onItemKey(e, i) {
    const last = AUDIENCE.length - 1
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
        Who uses it
        <ChevronDown aria-hidden
          className={cn('size-3.5 transition-transform duration-150', open && 'rotate-180')}/>
      </button>
      {open && (
        <div role="menu" aria-label="Who uses it"
          className="absolute left-0 top-full z-50 mt-px w-[19rem] overflow-hidden rounded-panel
            border border-rule bg-card py-1.5 shadow-lift">
          {AUDIENCE.map(([id, label, hint], i) => (
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
                'hover:bg-mist focus-visible:bg-mist',
                view === id && 'bg-accent-wash')}
            >
              <span className="block font-display text-ui font-medium text-ink">{label}</span>
              <span className="mt-0.5 block text-fine text-ink-3">{hint}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* The phone drawer.
 *
 * At 390px the old bar was a wordmark row, two rows of wrapped tabs and a
 * button row under them: roughly half the viewport of chrome above every
 * page. The bar is one 56px row now and everything that used to wrap lives in
 * here. Modal, so it traps Tab rather than letting focus wander onto the page
 * behind it, locks the body while it is up, and hands focus back to the
 * hamburger on the way out.
 */
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
        /* Tab out of either end wraps, which is what makes it a trap rather
           than a suggestion. */
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

  const rows = [...MAIN, ...AUDIENCE.map(([id, label]) => [id, label]), ['survey', 'Give feedback']]

  return (
    <div className="fixed inset-0 z-[60] xl:hidden">
      <div className="absolute inset-0 bg-ink/45" onClick={onClose} aria-hidden/>
      <div ref={panel} role="dialog" aria-modal="true" aria-label="Menu"
        className="absolute inset-x-0 top-0 max-h-[100dvh] overflow-y-auto border-b border-ink bg-paper">
        <div className="wrap flex h-14 items-center justify-between">
          <span className="font-display text-row font-medium text-ink">Menu</span>
          <button type="button" onClick={onClose} aria-label="Close the menu"
            className="-mr-2 grid size-11 place-items-center rounded-field text-ink-2 hover:bg-mist hover:text-ink">
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
                  here ? 'text-ink' : 'text-ink-2 hover:text-ink')}>
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

/* One row, 56px, at every width.
 *
 * What was wrong with the old bar was not any one control, it was that the
 * bar had four kinds of thing in it at once: a wordmark, six numbered and
 * ruled cells, a segmented switch and a filled key, laid out with
 * `flex-wrap`, which on a phone turned into four stacked rows. A header is a
 * place to leave, not a page. So: the mark, the sections, one menu, the
 * survey, and the single filled control that opens the app. Below lg the
 * sections go behind a hamburger, because five labels and a wordmark do not
 * fit on one line and pretending otherwise is what caused the wrap.
 */
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
        {/* No motto here any more. It is four words of explanation on a row
            that now has to hold five destinations and a key, and it was the
            first thing to give way. */}
        <button onClick={() => go('site')} aria-label="MindMap, go to the overview"
          className="mr-1 shrink-0 rounded-field px-1 py-1 text-row text-ink
            transition-colors duration-150 hover:bg-mist sm:mr-2 sm:text-head">
          <Logo/>
        </button>

        <nav aria-label="Sections" className="hidden h-full items-stretch xl:flex">
          {MAIN.map(([id, label]) => (
            <button key={id} onClick={() => go(id)}
              aria-current={SECTION[view] === id ? 'page' : undefined}
              className={linkClass(SECTION[view] === id)}>{label}</button>
          ))}
          <AudienceMenu view={view} go={go}/>
          {/* The survey was the one thing reviewers were asked to do and the
              one thing with no way to reach it. It is a destination now. */}
          <button onClick={() => go('survey')}
            aria-current={view === 'survey' ? 'page' : undefined}
            className={linkClass(view === 'survey')}>Give feedback</button>
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
          {/* Two things left this row. The demo/real switch, because it is a
              setting belonging to the app and it never acted on anything a
              marketing page draws; it lives in the app chrome now. And the
              command-palette hint, which was a key cap styled like a control
              that could not be pressed: the shortcut still works, the badge
              that implied it was a button does not. */}
          {/* Still the only filled control on the bar: everything else here
              explains MindMap, this opens it. */}
          <button onClick={() => go('app')}
            className={cn('inline-flex h-11 shrink-0 items-center gap-1.5 rounded-field px-3',
              'bg-accent font-display text-ui font-medium text-paper transition-colors',
              'duration-150 hover:bg-accent-ink sm:gap-2 sm:px-4')}>
{/* Two testers could not tell the app from the site. Half of that is
                what the app looks like, which the app chrome below answers, and
                half is whether the door says it is a door. So this is a
                crossing rather than a link: the label names where it goes and
                the arrow points out of the page, and it is the exact mirror of
                "Back to the site" in the app, which carries the same arrow
                pointing the other way. One crossing each direction, both named,
                neither doubled.

                The full label gives way at 390px and nowhere else. It used to
                hold out until 1280, which wasted the room the row had. */}
            <span className="sm:hidden">Open app</span>
            <span className="hidden sm:inline">Open the app</span>
            <ArrowRight aria-hidden className="size-4 shrink-0"/>
          </button>
          <button ref={burger} type="button" onClick={() => setMenu(true)}
            aria-expanded={menu} aria-label="Open the menu"
            className="-mr-1.5 grid size-11 shrink-0 place-items-center rounded-field text-ink
              hover:bg-mist xl:hidden">
            {/* Three equal rules. The `Stack` mark in ui/marks has a short
                third rule, which is a text-alignment icon and next to a
                wordmark reads as one. */}
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

/* ── the app's own chrome ───────────────────────────────────────────────
 *
 * Four destinations, and they are the four things this app is: the screen a
 * student reads, the reading they take to fill it, the screen their parent
 * reads, and the console their school reads. The student's two sit together
 * because that is the order one person moves through them; the two oversight
 * screens follow.
 *
 * What is deliberately *not* a destination: Launch, which asks who you are and
 * is a door you walk through once, and the sharing screen, which is a tab
 * inside the parent and student sections and is where it belongs — a person
 * checks what is shared while looking at what is shared, not from a bar.
 * `#/privacy` still resolves and lights Parent, because that is the section it
 * opens.
 */
const DialMark = p => (
  /* The score arch with the reading landed on it, which is what taking a
     reading produces. A second wave mark next to the pulse trace would have
     been two pictures of the same thing. */
  <svg viewBox="0 0 24 24" width={p.size || 20} height={p.size || 20} fill="none" aria-hidden
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="shrink-0">
    <path d="M3.8 17.8a8.2 8.2 0 0 1 16.4 0"/>
    <circle cx="18.9" cy="13.7" r="1.9" fill="currentColor" stroke="none"/>
  </svg>
)

const APP_NAV = [
  ['app-student', 'Student', PulseMark],
  ['check',       'Reading', DialMark],
  ['app-parent',  'Parent',  Bracket],
  ['app-pro',     'School',  Grid],
]

/* Which destination each route belongs to. Launch is in here as null on
   purpose: on the door nothing is lit, because nothing has been chosen. */
const APP_TAB = { app:null, 'app-student':'app-student', check:'check',
                  'app-parent':'app-parent', privacy:'app-parent', 'app-pro':'app-pro' }

/* The destination names, for the app's title bar.
 *
 * A website header says what the site is; an app's bar says which screen is
 * open. These are the four destinations plus the two routes that are tabs
 * inside one of them, written as the screen rather than as the audience.
 */
const APP_TITLE = {
  app:            'Screens',
  'app-student':  'Student',
  check:          'Take a reading',
  'app-parent':   'Parent',
  privacy:        'Who sees what',
  'app-pro':      'School',
}

/* ── the app shell ─────────────────────────────────────────────────────────
 *
 * Two testers said the same thing in the same words: the app reads as another
 * page of the website. It already had its own navigation, and that was not
 * enough, because everything else about it was still the brochure. Same
 * ground, same 60px page titles, same section padding.
 *
 * So the four things that make a surface a product are declared here, once,
 * and every app route inherits them:
 *
 *   ground   a tinted canvas, the turquoise at 15% over paper, which resolves
 *            to #d5eaef. No marketing band uses it: those run paper, card,
 *            mist, aqua, aqua-2, accent-wash, beam-wash and the one ink band.
 *            White chrome and white cards sit on top of it, which is the
 *            layering a product has and a landing page does not. Measured
 *            against every ink that lands on it: ink 11.97, ink-2 6.67,
 *            ink-3 4.80, accent 4.89, accent-ink 7.05, warn 4.63, crit 5.36,
 *            beam-ink 5.15. The weakest of them clears 4.5.
 *   type     headings step down hard. A marketing page title is `major`, 40px
 *            to 60px, and a marketing section head is `sub`, 32px to 48px. In
 *            here an h1 is `head` at 29px and an h2 is `row` at 25px, so the
 *            largest heading in the app is smaller than the smallest heading
 *            on any marketing page. Card titles follow at 18px and 17px.
 *   rhythm   every banded `.wrap` tightens to 24px of padding, 32px past lg.
 *            The marketing bands are 36 and 56.
 *   nav      persistent, and the destination you are on is a filled accent
 *            block in both the phone bar and the desk rail.
 *
 * Written as descendant variants rather than per screen because the screens
 * belong to the dashboards and the surface belongs to the chrome. A pane
 * cannot drift back towards the brochure without this file saying so.
 */
const APP_SHELL = cn(
  'min-h-[100dvh] bg-beam/15 lg:pl-[13.5rem]',
  /* Each step carries its own leading and tracking from the scale, so one
     class per level is the whole override. `.mark` is exempt: it is a ruled
     label at 16px that happens to be marked up as a heading, and a step on
     it would blow a hairline annotation up to 25px. */
  '[&_h1:not(.mark)]:text-head [&_h2:not(.mark)]:text-row',
  '[&_h3:not(.mark)]:text-meta [&_h4:not(.mark)]:text-ui',
  '[&_.wrap]:py-6 lg:[&_.wrap]:py-8',
)

/* The phone bar.
 *
 * Fixed to the bottom, always there, thumb height. Selection is carried four
 * ways and colour is only one of them: a rule lands on the top edge of the
 * cell, the mark fills, the label goes bold, and the ink darkens. Desaturate
 * a screenshot and you can still read where you are. Every cell is at least
 * 56 tall and a quarter of the viewport wide, so the smallest target here is
 * 97 x 56 at 390. The inset padding is what keeps the labels off a home
 * indicator, and the spacer the page renders below the footer is what keeps
 * this bar off the last line of content.
 *
 * White, on a hairline. The marketing header is mist on a 2px ink rule, and
 * the two are now different objects at a glance rather than the same object
 * in two places.
 */
function AppTabBar({ view, go }) {
  const here = APP_TAB[view]
  return (
    <nav aria-label="App screens"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-3 bg-card
        pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="flex">
        {APP_NAV.map(([id, label, Mark]) => {
          const on = here === id
          return (
            <li key={id} className="flex-1">
              <button type="button" onClick={() => go(id)}
                aria-current={on ? 'page' : undefined}
                className={cn('relative flex min-h-[56px] w-full flex-col items-center justify-center gap-1',
                  'px-1 pb-1.5 pt-2 transition-colors duration-150',
                  /* the rule on the cell edge, which is what a tab bar uses to
                     say "this one" when the fill alone could be a hover */
                  'before:absolute before:inset-x-0 before:top-0 before:h-[2px]',
                  on ? 'text-accent-ink before:bg-accent' : 'text-ink-2 before:bg-transparent')}>
                {/* Solid, not tinted. An accent-wash pill measures 1.14 : 1
                    against paper, which is a fill you can only see if you
                    already know where to look; filled accent is 5.79 with
                    paper reversed out of it. */}
                <span aria-hidden className={cn('flex h-7 w-14 items-center justify-center rounded-bar',
                  'transition-colors duration-150', on ? 'bg-accent text-paper' : 'bg-transparent')}>
                  <Mark size={22}/>
                </span>
                <span className={cn('font-display text-fine leading-none',
                  on ? 'font-bold' : 'font-medium')}>{label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/* The desktop rail.
 *
 * The same four destinations, not the phone bar stretched across 1440: four
 * icons spaced a third of a metre apart along the bottom of a monitor is a
 * phone habit on a desk. A 216px column instead, labels beside their marks,
 * with the settings and the way out where a desk app keeps them, at the foot,
 * below everything you actually came for.
 *
 * The selected destination is a filled accent block. It was an accent-wash
 * tint with a leading bar, which is how this site marks a row in a list; a
 * product marks the screen you are standing on more loudly than it marks a
 * selected row, because that one is a fact about the whole window.
 */
function AppRail({ view, go }) {
  const here = APP_TAB[view]
  return (
    <div className="fixed inset-y-0 left-0 z-40 hidden w-[13.5rem] flex-col overflow-y-auto
      border-r border-ink-3 bg-card lg:flex">
      {/* 48px, the same as the title bar to its right, so the two line up
          across the top of the window instead of stepping. */}
      <div className="flex h-12 shrink-0 items-center border-b border-rule px-4 text-ui text-ink">
        <Logo/>
      </div>
      <nav aria-label="App screens" className="flex flex-col gap-1 p-2.5">
        {APP_NAV.map(([id, label, Mark]) => {
          const on = here === id
          return (
            <button key={id} type="button" onClick={() => go(id)}
              aria-current={on ? 'page' : undefined}
              className={cn('flex min-h-[44px] w-full items-center gap-2.5 rounded-field px-3',
                'text-left transition-colors duration-150',
                on ? 'bg-accent text-paper' : 'text-ink-2 hover:bg-mist hover:text-ink')}>
              <Mark size={20}/>
              <span className={cn('font-display text-ui', on ? 'font-bold' : 'font-medium')}>{label}</span>
            </button>
          )
        })}
      </nav>
      <div className="mt-auto border-t border-rule p-2.5">
        <ModeToggle compact className="[&_button]:min-h-[44px]"/>
        <ExitToSite go={go} className="mt-3"/>
      </div>
    </div>
  )
}

/* The way out. Named, not a logo that might mean home and might mean site, and
   set as a quiet text control rather than anything that competes with the four
   screens above it. It carries the arrow that the site's "Open the app"
   carries reversed, so the two crossings are one pair.

   One of these is on screen at a time: the rail holds it past lg, the title
   bar holds it below. Never both, and never two back links in one corner. */
function ExitToSite({ go, className, short = false }) {
  return (
    <button type="button" onClick={() => go('site')}
      className={cn('flex min-h-[44px] shrink-0 items-center gap-2 rounded-field pr-2 font-display',
        'text-ui font-medium text-ink-2 transition-colors duration-150 hover:text-ink', className)}>
      <ArrowLeft aria-hidden className="size-4 shrink-0"/>
      {short ? (
        <>
          {/* At 390 this row holds the screen name, the demo switch and
              this, and the three of them only just fit. So below sm the label
              is the destination on its own and the full sentence comes back
              above it. The arrow carries the direction at either size. */}
          <span className="sm:hidden">Site</span>
          <span className="hidden sm:inline">Back to the site</span>
        </>
      ) : 'Back to the site'}
    </button>
  )
}

/* The app's title bar.
 *
 * Nothing about it is the marketing header, which is the point. White rather
 * than mist, 48px rather than 56, a hairline rather than a 2px ink rule, and
 * it carries the name of the screen you are on instead of a wordmark, five
 * links and a filled key. An app bar reports; a site header offers.
 *
 * Past lg it is the name alone, because the rail beside it already holds the
 * wordmark, the demo switch and the way out, and repeating any of those would
 * be the doubling this pass is removing.
 */
function AppTopBar({ view, go }) {
  return (
    <div className="sticky top-0 z-40 border-b border-ink-3 bg-card">
      <div className="flex h-12 items-center gap-3 px-[22px] sm:px-10 lg:px-14">
        <span aria-hidden className="h-4 w-[3px] shrink-0 rounded-bar bg-accent"/>
        <span className="min-w-0 truncate font-display text-tick font-bold text-ink">
          {APP_TITLE[view] || 'App'}
        </span>
        <div className="ml-auto flex items-center gap-3 lg:hidden">
          <ModeToggle compact className="[&_button]:min-h-[44px]"/>
          <ExitToSite go={go} short/>
        </div>
      </div>
    </div>
  )
}

/* The app's foot.
 *
 * The site ends on a band: a 2px rule, a mist ground, 88px of padding and the
 * disclaimer set at reading size. A product does not end a screen with a
 * marketing band, so in here the same two sentences are a hairline and a line
 * of small print. ink-3 on the app canvas measures 4.80 : 1, so it still
 * clears 4.5 at 14px.
 */
function AppFoot() {
  return (
    <footer className="border-t border-ink-3 px-[22px] py-5 sm:px-10 lg:px-14">
      <p className="max-w-[78ch] text-fine text-ink-3">MindMap measures physiology and reports patterns. It is not a
        medical device and does not diagnose or treat any condition. If you need urgent help, contact your
        local emergency number or a crisis line.</p>
      <p className="mt-2 text-fine text-ink-3">MindMap · Solace Innovation</p>
    </footer>
  )
}

/* ── the survey, as a page ───────────────────────────────────────────────
 *
 * The survey itself lives in src/survey and is only ever opened as a dialog
 * out of the corner box, which is deliberate for a reviewer who is mid-browse
 * and wrong for a reviewer who arrived to do it. This is the same questions
 * and the same store, written down a page instead of inside an overlay, so an
 * answer given here is the same answer the corner box counts, and the whole
 * thing has a url that can be sent to someone.
 */

function useSurveyStore() {
  return React.useSyncExternalStore(subscribe, getVersion, () => 0)
}

/* An answer is a row on a ruled list, not a card.
 *
 * Every choice here used to be a bordered rounded box, so a seven-option
 * question was seven identical capsules stacked in a column and a twenty
 * question survey was a hundred and forty of them. That is the shape a
 * generated interface reaches for when it has a list and no idea what the list
 * is: the box adds nothing the hairline above the row does not already do, and
 * a column of them buries which one is picked under the sameness of the rest.
 * Rules separate; a bar, a fill and a weight say which one is chosen. */
const pickClass = on => cn(
  'flex min-h-[44px] w-full items-center border-t border-rule pr-3 text-left',
  'font-display text-ui transition-colors duration-150 ease-out',
  on ? 'bg-accent-wash font-bold text-ink' : 'font-medium text-ink-2 hover:bg-mist hover:text-ink'
)

/* The selected marker, and the same one the phone drawer uses for the page you
   are on, so "picked" looks the same everywhere on the site. */
const Bar = ({ on }) => (
  <span aria-hidden className={cn('mr-3 h-5 w-[3px] shrink-0 rounded-bar',
    on ? 'bg-accent' : 'bg-transparent')}/>
)

const fieldClass = cn(
  'block w-full rounded-field border border-rule bg-card p-3 font-body text-sec text-ink',
  'placeholder:text-ink-3 transition-colors duration-150 ease-out hover:border-ink-3'
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

function ChoiceField({ q, value, onPick }) {
  return (
    <div role="radiogroup" aria-label={q.prompt} className="mt-3 flex flex-col">
      {q.options.map(opt => (
        <button key={opt} type="button" role="radio" aria-checked={value === opt}
          onClick={() => onPick(opt, opt)} className={pickClass(value === opt)}>
          <Bar on={value === opt}/>{opt}
        </button>
      ))}
    </div>
  )
}

/* Eleven buttons wrap on a phone, so the ends are labelled. An unlabelled
   0 to 10 row gets answered backwards by the people you least want to
   misread. The only bordered cells left in the survey: a horizontal scale of
   single figures has nothing else to hold it together. */
function NpsField({ q, value, onPick }) {
  return (
    <div className="mt-3">
      <div role="radiogroup" aria-label={q.prompt} className="flex flex-wrap gap-1.5">
        {Array.from({ length: 11 }, (_, n) => (
          <button key={n} type="button" role="radio" aria-checked={value === n}
            aria-label={`${n} out of 10`} onClick={() => onPick(n, String(n))}
            className={cn('min-h-[44px] min-w-[44px] flex-1 rounded-field border text-ui tabular-nums',
              'transition-colors duration-150 ease-out',
              value === n ? 'border-ink bg-ink font-bold text-paper'
                          : 'border-rule font-medium text-ink-2 hover:border-ink-3 hover:bg-mist')}>
            {n}
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-fine text-ink-3">
        <span>{q.low}</span><span>{q.high}</span>
      </div>
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
      {/* "Ready to save." used to sit here the moment a character was typed,
          which is a line of text that reports the obvious. The hint now only
          exists while Save is off, saying why it is off. */}
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

function ImpactField({ q, initial, onSave, onSkip }) {
  const [score, setScore] = React.useState(initial?.score ?? null)
  const [label, setLabel] = React.useState(initial?.label ?? null)
  const [note, setNote] = React.useState(initial?.note ?? '')
  return (
    <div>
      <ScaleField q={q} value={score} onPick={(v, l) => { setScore(v); setLabel(l) }}/>
      <label className="mt-5 block font-display text-ui font-medium text-ink">{q.sentence.prompt}</label>
      <textarea rows={2} value={note} maxLength={q.sentence.maxLength}
        placeholder={q.sentence.placeholder} onChange={e => setNote(e.target.value)}
        className={cn(fieldClass, 'mt-2')}/>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
        <Button size="sm" type="button" disabled={score == null}
          onClick={() => onSave({ score, note: note.trim() }, label)}>Save</Button>
        {onSkip && <Button size="sm" type="button" variant="ghost" onClick={onSkip}>Skip</Button>}
      </div>
      {score == null && <p className="note mt-2">Pick a point above first.</p>}
    </div>
  )
}

function SurveyField({ q, answer, onAnswer, onSkip }) {
  const v = answer?.value
  if (q.kind === 'scale')  return <ScaleField q={q} value={v ?? null} onPick={onAnswer}/>
  if (q.kind === 'choice') return <ChoiceField q={q} value={typeof v === 'string' ? v : null} onPick={onAnswer}/>
  if (q.kind === 'nps')    return <NpsField q={q} value={typeof v === 'number' ? v : null} onPick={onAnswer}/>
  if (q.kind === 'text')   return <TextField q={q} initial={typeof v === 'string' ? v : ''}
                                    onSave={t => onAnswer(t, null)} onSkip={q.optional ? onSkip : undefined}/>
  if (q.kind === 'stars')  return (
    <div className="mt-3">
      <StarRating label={q.prompt} max={q.max} step={q.step}
        value={typeof v === 'number' ? v : null}
        onChange={n => onAnswer(n, `${n} of ${q.max}`)}/>
    </div>
  )
  if (q.kind === 'impact') return <ImpactField q={q}
    initial={v && typeof v === 'object' ? { ...v, label: answer.label } : null}
    onSave={onAnswer} onSkip={onSkip}/>
  return null
}

function csvName() {
  const n = getVisitor()?.name || 'anon'
  return 'mindmap-review-' + n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.csv'
}

/* The reviewer can take their own answers away. Same consent argument the
   rest of the site makes: if the data is about you, you get a copy of it. */
function downloadCSV() {
  try {
    const url = URL.createObjectURL(new Blob([toCSV(exportRows())], { type:'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url; a.download = csvName()
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  } catch {}
}

function SurveyPage() {
  useSurveyStore()
  const [skipped, setSkipped] = React.useState(() => new Set())
  React.useEffect(() => { syncPending() }, [])

  const byId = new Map(answersFor(PAGE).map(a => [a.qid, a]))
  const done = REQUIRED.filter(q => byId.has(q.id)).length
  const total = REQUIRED.length
  const visitor = getVisitor()
  const answer = (q, value, label) => recordAnswer({ page: PAGE, qid: q.id, kind: q.kind, value, label })

  return (
    /* <main>, like every other page: without it this route had no main
       landmark and a screen reader had nothing to skip to. */
    <main>
      {/* "Tell us where this falls down" was the heading here. There is no
          "us": one student reads these. And "where this falls down" is not a
          phrase anybody says out loud, which is why it read as filler. */}
      <Section tone="paper" tight>
        <h1 className="font-display font-bold text-major leading-[1.05] tracking-tight text-ink">
          Give feedback
        </h1>
        <SectionHead className="mt-5">Tell me what to fix</SectionHead>
        <SectionLede>
          {visitor ? `${visitor.name}, ` : ''}about three minutes. Answers save as you give them,
          so you can stop halfway and come back. The only thing kept alongside them is the
          name you gave.
        </SectionLede>
        <p className="mt-3.5 text-fine font-medium tabular-nums text-ink-3">
          {done} of {total} answered
        </p>
      </Section>

      {/* tight, because the default section padding put about a hundred pixels
          of nothing between "0 of 12 answered" and the first question, and the
          rule between the two bands already says a new thing has started. */}
      <Section tone="card" tight>
        <div>
          {/* Twenty questions down one column, so the vertical rhythm is the
              whole layout. It was mt-12 between sections and gap-8 with pt-6
              inside them, which put a band of nothing between every question
              and cost four extra scrolls to reach the end. The rule above each
              prompt is what separates them; the space only has to keep the
              rule off the answer above it.

              From lg the section's name moves into a rail beside the questions
              instead of sitting above them. The answers keep a 44rem reading
              measure whatever the window does, so on a wide screen the column
              was a strip of questions with half the page empty to the right of
              it. The rail fills that with the one thing worth having on screen
              while you answer ten statements in a row: which ten they are.
              It sticks, so it is still there at the tenth. */}
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
                      {/* "Optional" sits next to the prompt, not flung to the
                          far side of the column: pushed apart by a
                          justify-between it reads as a heading in a table
                          rather than a note about this one question. */}
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
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
          {/* Same grid as a section, so the closing row lines up under the
              answers rather than under the rail. */}
          <div className="mt-9 lg:grid lg:grid-cols-[17rem_minmax(0,44rem)] lg:gap-x-14">
            <div aria-hidden/>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-rule pt-5">
              <p className="note">{done >= total ? 'That is all of them. Thanks.' : `${total - done} to go.`}</p>
              <Button size="sm" variant="ghost" type="button" onClick={downloadCSV}>Download my answers</Button>
            </div>
          </div>
        </div>
      </Section>
    </main>
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
     A returning reviewer sees none of the first two: the whole point of the
     skip is that nobody sits through an intro twice. The responses page is
     excluded from all of it, since Mikhail reading the results is not a
     respondent, and a survey card over the data he came to read would be
     absurd. */
  const admin = view === 'responses'
  /* Plays on every load, not once ever. Only the Skip control suppresses it,
     and it suppresses it permanently, because a visitor who watched it may
     well want it again and a visitor who skipped it has told you exactly what
     they want. */
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
  /* Every caller resolves through here, so a control that asks for a view
     which no longer exists lands on the overview instead of rendering nothing.
     The command palette was doing exactly that. */
  const go = React.useCallback(raw => {
    const v = ALIAS[raw] || (VIEWS.includes(raw) ? raw : 'site')
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
  const inApp = APP_VIEWS.has(view)

  /* Three routes are tabs inside a section rather than pages of their own, and
     they keep their URLs so every existing link still lands in the right place. */
  const V = { site:Overview, patch:PatchPage, 'without-patch':WithoutPatch,
              tour:Tour, responses:Responses, survey:SurveyPage,
              /* what MindMap does for each audience, behind the Who uses it menu */
              student:ForStudents, parent:ForParents, pro:ForSchools,
              /* the app, behind Open the app */
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
      {!inApp && <Header view={view} go={go}/>}
      <Palette go={go}/>
      <p aria-live="polite" className="sr-only text-sec">{said}</p>
      {inApp && <AppRail view={view} go={go}/>}
      {/* The rail is fixed, so the page is inset by its width rather than
          laid out beside it: the dashboards draw full-bleed bands and a flex
          sibling would have clipped them.

          APP_SHELL is where the app stops looking like the site: the canvas,
          the heading steps and the band padding all land here and every pane
          inside inherits them. Nothing is clipped and nothing is transformed,
          so the sticky columns inside the reading screen still stick. */}
      <div className={cn(inApp && APP_SHELL)}>
        {inApp && <AppTopBar view={view} go={go}/>}
        <div id="main" ref={mainRef} tabIndex={-1} className="outline-none">
          <V go={go} key={view}/>
        </div>
        {/* Mounted per view and keyed by it, so leaving a page abandons any
            question that was mid-answer rather than carrying it to the next one. */}
        {/* One box in the corner, not a card over the page. It counts the
            routes visited and only appears once someone has been around. It is
            suppressed on the survey route itself, where offering to open the
            survey over the survey would be a joke. */}
        {/* Not on the app routes. A feedback bubble parked over a dashboard is
            the clearest tell that a thing is a demo rather than a product, and
            on a phone it would sit directly on top of the tab bar. It still
            follows a reviewer around all eight marketing pages, and the survey
            has its own place in the marketing bar. */}
        {!showIntro && visitor && !admin && !inApp && view !== 'survey' && <ReviewLauncher page={view}/>}
        {/* The site keeps its band. The app gets a line of small print,
            because the band is the last thing on the page that still read as
            the brochure.

            The band's extra foot room under sm is not decoration: the feedback
            pill is fixed at bottom-4 right-4 and was sitting on the medical
            disclaimer on a phone, which is the one line on this page that
            should never be covered. 7rem clears the pill and its safe area. */}
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
        {/* What keeps the tab bar off the last line of the page. Its height
            plus whatever the handset reserves at the bottom of the glass. */}
        {inApp && <div aria-hidden className="h-[calc(4rem+env(safe-area-inset-bottom))] lg:hidden"/>}
      </div>
      {inApp && <AppTabBar view={view} go={go}/>}
    </>
  )
}
