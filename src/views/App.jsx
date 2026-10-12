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
import { Palette } from '../ui/palette'
import { Logo } from '../ui/logo'
import { Button } from '../ui/button'
import { StarRating } from '../ui/stars'
import { Section, SectionHead, SectionLede } from '../ui/section'
import { ArrowLeft, ArrowRight, Bracket, ChevronDown, Cross, Grid, PulseMark } from '../ui/marks'
import { ScrollProgress } from '../ui/motion'
import { cn } from '../lib/utils'

/* `app-*` are the dashboards, `student`/`parent`/`pro` the pages that explain
   them. `check` and `privacy` stay because they are already linked. */
const VIEWS = ['site','patch','without-patch','student','parent','pro','app','app-student',
               'app-parent','app-pro','check','privacy','tour','responses','survey',
               'kit-student','kit-parent']

/* Routes that render app screens, so the chrome switches: `check` is the
   student section on its reading tab, `privacy` the parent section on its
   sharing tab, whatever the urls suggest. */
const APP_VIEWS = new Set(['app','app-student','app-parent','app-pro','check','privacy',
                           'kit-student','kit-parent'])

/* The palette pushes `hub`, which is not a route; `go` resolves aliases. */
const ALIAS = { hub: 'app' }

const TITLE = {
  site:'MindMap, a wellness app for teenagers',
  patch:'The MindMap patch',
  'without-patch':'MindMap without the patch',
  student:'MindMap for students',
  parent:'MindMap for parents',
  pro:'MindMap for Medical Professionals',
  app:'Open the MindMap app',
  'app-student':'The student screen in MindMap',
  'app-parent':'The parent screen in MindMap',
  'app-pro':'The medical professional console in MindMap',
  check:'Take a reading in MindMap',
  privacy:'Who can see what in MindMap',
  tour:'A guided tour of MindMap',
  responses:'Survey responses in MindMap',
  survey:'Give feedback on MindMap',
}

const MAIN = [
  ['site',          'Overview'],
  ['patch',         'The patch'],
  ['without-patch', 'Without the patch'],
]

const AUDIENCE = [
  ['student', 'Students', 'What a week of readings looks like'],
  ['parent',  'Parents',  'What a parent is shown, and what they are not'],
  ['pro',     'Medical Professionals',  'What a medical professional sees across a year group'],
]

/* Which nav entry lights per view. The three audience pages share `who`. */
const SECTION = { site:'site', patch:'patch', 'without-patch':'without-patch',
                  student:'who', parent:'who', pro:'who', survey:'survey',
                  app:null, 'app-student':null, 'app-parent':null, 'app-pro':null,
                  check:null, privacy:null, tour:null, responses:null }

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
                'hoverOnly:bg-mist focus-visible:bg-mist',
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

  const rows = [...MAIN, ...AUDIENCE.map(([id, label]) => [id, label]), ['survey', 'Give feedback']]

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
          {MAIN.map(([id, label]) => (
            <button key={id} onClick={() => go(id)}
              aria-current={SECTION[view] === id ? 'page' : undefined}
              className={linkClass(SECTION[view] === id)}>{label}</button>
          ))}
          <AudienceMenu view={view} go={go}/>
          <button onClick={() => go('survey')}
            aria-current={view === 'survey' ? 'page' : undefined}
            className={linkClass(view === 'survey')}>Give feedback</button>
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
          <button onClick={() => go('app')}
            className={cn('inline-flex h-11 shrink-0 items-center gap-1.5 rounded-field px-3',
              'bg-accent font-display text-ui font-medium text-paper transition-colors',
              'duration-150 hoverOnly:bg-accent-ink sm:gap-2 sm:px-4')}>
            <span className="sm:hidden">Open app</span>
            <span className="hidden sm:inline">Open the app</span>
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

/* The bar belongs to whichever app you are in.
 *
 * It used to be one bar listing the three audiences, so a student standing in
 * the student app was offered a parent dashboard and a clinical console at the
 * bottom of every screen. Nobody switches audience; you are one of them. The
 * bar now lists what is inside the app you opened, and the launcher at /#/app
 * is where the three live. */
const APP_NAV = {
  student: [
    ['app-student', 'Today',   PulseMark],
    ['check',       'Reading', DialMark],
    ['kit-student', 'Toolkit', Bracket],
  ],
  parent: [
    ['app-parent',  'Week',    PulseMark],
    ['kit-parent',  'Toolkit', Bracket],
    ['privacy',     'Sharing', Grid],
  ],
  pro: [
    ['app-pro',     'Caseload', Grid],
  ],
}

/* Which app a route belongs to, and which of its tabs it lights. */
const APP_OF = {
  'app-student': 'student', check: 'student', 'kit-student': 'student',
  'app-parent': 'parent', privacy: 'parent', 'kit-parent': 'parent',
  'app-pro': 'pro',
}
const APP_TAB = { app:null, 'app-student':'app-student', check:'check',
                  'kit-student':'kit-student', 'app-parent':'app-parent',
                  privacy:'privacy', 'kit-parent':'kit-parent', 'app-pro':'app-pro' }

const APP_TITLE = {
  app:            'Screens',
  'app-student':  'Today',
  check:          'Take a reading',
  'kit-student':  'Toolkit',
  'app-parent':   'This week',
  privacy:        'Sharing',
  'kit-parent':   'Toolkit',
  'app-pro':      'Caseload',
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
function AppTabBar({ view, go }) {
  const here = APP_TAB[view]
  const tabs = APP_NAV[APP_OF[view]]
  /* The launcher has no app yet, so it has no bar. */
  if (!tabs) return null
  return (
    <nav aria-label="App screens"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-3 bg-card
        pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-[34rem] list-none p-0">
        {tabs.map(([id, label, Mark]) => {
          const on = here === id
          return (
            <li key={id} className="flex-1">
              <button type="button" onClick={() => go(id)}
                aria-current={on ? 'page' : undefined}
                className={cn('relative flex min-h-[56px] w-full flex-col items-center justify-center gap-1',
                  'px-1 pb-1.5 pt-2 transition-colors duration-150',
                  /* rule on the cell edge: the fill alone could read as hover */
                  'before:absolute before:inset-x-0 before:top-0 before:h-[2px]',
                  on ? 'text-accent-ink before:bg-accent' : 'text-ink-2 before:bg-transparent')}>
                {/* accent-wash on paper is 1.14 : 1; filled accent is 5.79. */}
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

function ExitToSite({ go, className, short = false }) {
  return (
    <button type="button" onClick={() => go('site')}
      className={cn('flex min-h-[44px] shrink-0 items-center gap-2 rounded-field pr-2 font-display',
        'text-ui font-medium text-ink-2 transition-colors duration-150 hoverOnly:text-ink', className)}>
      <ArrowLeft aria-hidden className="size-4 shrink-0"/>
      {short ? (
        <>
          {/* At 390 this row also carries the screen name and the demo switch. */}
          <span className="sm:hidden">Site</span>
          <span className="hidden sm:inline">Back to the site</span>
        </>
      ) : 'Back to the site'}
    </button>
  )
}

function AppTopBar({ view, go }) {
  return (
    <div className="sticky top-0 z-40 border-b border-ink-3 bg-card">
      <div className="flex h-12 items-center gap-3 px-[22px] sm:px-10 lg:px-14">
        <span aria-hidden className="h-4 w-[3px] shrink-0 rounded-bar bg-accent"/>
        <span className="min-w-0 truncate font-display text-tick font-bold text-ink">
          {APP_TITLE[view] || 'App'}
        </span>
        <div className="ml-auto flex items-center gap-3">
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
    <footer className="border-t border-ink-3 px-[22px] py-5 sm:px-10 lg:px-14">
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

/* The ends are labelled: an unlabelled 0 to 10 row gets answered backwards.
   The only bordered cells left in the survey. */
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
                          : 'border-rule font-medium text-ink-2 hoverOnly:border-ink-3 hoverOnly:bg-mist')}>
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
  const visitor = getVisitor()
  const answer = (q, value, label) => recordAnswer({ page: PAGE, qid: q.id, kind: q.kind, value, label })

  return (
    /* <main> so this route has a main landmark for the skip link. */
    <main>
      <Section tone="paper" tight>
        <h1 className="font-display font-bold text-major leading-[1.05] tracking-tight text-ink">
          Give feedback
        </h1>
        <SectionHead className="mt-5">Tell me what to fix</SectionHead>
        <SectionLede>
          {visitor ? `${visitor.name}, ` : ''}about three minutes. Answers save as you give them,
          so you can stop halfway and come back, and they go to the person building MindMap once
          you are through. The only thing sent alongside them is the name you gave.
        </SectionLede>
        <p className="mt-3.5 text-fine font-medium tabular-nums text-ink-3">
          {done} of {total} answered
        </p>
      </Section>

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

const fromHash = () => {
  const h = location.hash.replace(/^#\/?/, '')
  return VIEWS.includes(h) ? h : 'site'
}

export function App() {
  const [view, setView] = React.useState(fromHash)
  const mainRef = React.useRef(null)
  const [said, setSaid] = React.useState('')
  /* Three gates in order: title sequence, name, per-page questions. The
     responses route is excluded from all three. */
  const admin = view === 'responses'
  /* Plays on every load. Only Skip suppresses it, and it does so permanently. */
  const [showIntro, setShowIntro] = React.useState(() => {
    try { return !admin && !introSuppressed() } catch { return false }
  })
  const [visitor, setVisitorState] = React.useState(() => {
    try { return getVisitor() } catch { return null }
  })
  const endIntro = React.useCallback(() => setShowIntro(false), [])
  /* Navigation resets scroll, title and focus itself: focus otherwise falls to
     <body> and the scroll position carries over from the previous screen. */
  const land = React.useCallback(v => {
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

  /* Three routes are tabs inside a section and keep their urls. */
  const V = { site:Overview, patch:PatchPage, 'without-patch':WithoutPatch,
              tour:Tour, responses:Responses, survey:SurveyPage,
              student:ForStudents, parent:ForParents, pro:ForSchools,
              app:Launch, 'app-pro':Pro,
              'app-student': p => <Students {...p} tab="today"/>,
              'app-parent':  p => <Parents  {...p} tab="week"/>,
              check:         p => <Students {...p} tab="check"/>,
              privacy:       p => <Parents  {...p} tab="shared"/>,
              'kit-student': () => <Toolkit who="student"/>,
              'kit-parent':  () => <Toolkit who="parent"/> }[view]
  return (
    <>
      {/* Not sr-only: that clips to 1x1, which audits read as a 1px tap target
          and which leaves a keyboard user no hit area. */}
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
      {/* Nothing in here is clipped or transformed: a transform creates a
          containing block and breaks the sticky columns in the reading screen. */}
      <div className={cn(inApp && APP_SHELL)}>
        {inApp && <AppTopBar view={view} go={go}/>}
        <div id="main" ref={mainRef} tabIndex={-1} className="outline-none">
          <V go={go} key={view}/>
        </div>
        {/* Keyed by view, so leaving a page abandons a mid-answer question. */}
        {/* Marketing routes only: on a phone this pill lands on the tab bar. */}
        {!showIntro && visitor && !admin && !inApp && view !== 'survey' && <ReviewLauncher page={view}/>}
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
        {/* Clears the fixed tab bar: its height plus the handset's bottom inset. */}
        {inApp && <div aria-hidden className="h-[calc(4rem+env(safe-area-inset-bottom))]"/>}
      </div>
      {inApp && <AppTabBar view={view} go={go}/>}
    </>
  )
}
