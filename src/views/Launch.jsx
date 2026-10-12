import React from 'react'
import { Card, CardContent } from '../ui/card'
import { Logo } from '../ui/logo'
import { ArrowRight } from '../ui/marks'
import { RainbowDial } from '../charts/rainbow'
import { WeekStrip } from '../charts/infographics'
import { studentRings } from '../lib/readings'
import { triage, tierOf, TIER_LABEL } from '../lib/caseload'
import { SCORE, CASELOAD_TITLE } from '../lib/terms'
import { DATA } from '../lib/assets'
import { useMode } from '../lib/mode'
import { cn } from '../lib/utils'

/* The app's front door: three role previews.
 *
 * Each preview renders the real dashboard component on the real fixture data
 * (RainbowDial, WeekStrip, triage()). Do not hand-draw a mock here — it goes
 * stale against the screen it previews. */

/* ── Loop ────────────────────────────────────────────────────────────────── */

/* A tick counter: anything keyed on it remounts and replays its own entry.
   RainbowDial animates on mount, so replay must be a remount. Stopping the
   tick lets the last cycle finish instead of freezing mid-draw. */
function useCycle(run, period) {
  const [n, setN] = React.useState(0)
  React.useEffect(() => {
    if (!run) return
    const id = setInterval(() => setN(v => v + 1), period)
    return () => clearInterval(id)
  }, [run, period])
  return n
}

/* `still` starts every entry in its finished state (reduced motion).
   Two requestAnimationFrames, not one: the first state must be painted before
   the flip, or the browser coalesces both and no transition runs. */
function useEntered(still) {
  const [on, setOn] = React.useState(still)
  React.useEffect(() => {
    if (still) { setOn(true); return }
    let b
    const a = requestAnimationFrame(() => { b = requestAnimationFrame(() => setOn(true)) })
    return () => { cancelAnimationFrame(a); cancelAnimationFrame(b) }
  }, [still])
  return on
}

function useStill() {
  const [still, setStill] = React.useState(
    () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)
  React.useEffect(() => {
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setStill(mq.matches)
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return still
}

const EASE = 'cubic-bezier(0.2,0.7,0.3,1)'

/* ── Frames ──────────────────────────────────────────────────────────────── */

/* Fixed height, identical in both modes and on all three cards, so switching
   Demo/Real cannot move the page under a pointer already on a card. */
const BODY = 'flex min-h-[236px] w-full flex-col items-center justify-center'

function Phone({ children }) {
  return (
    <div className="w-full max-w-[300px] rounded-[22px] border-2 border-ink bg-card p-3 shadow-raise">
      <span aria-hidden className="mx-auto mb-3 block h-1 w-10 rounded-bar bg-rule"/>
      <div className={BODY}>{children}</div>
    </div>
  )
}
function Console({ children }) {
  return (
    <div className="w-full max-w-[320px] rounded-panel border-2 border-ink bg-card shadow-raise">
      <div className="flex items-baseline justify-between border-b border-rule px-3 py-2">
        <span className="text-tick text-ink-3">Check in with</span>
        <span className="text-tick text-ink-3">by change</span>
      </div>
      <div className={cn(BODY, 'px-3 py-4')}>{children}</div>
    </div>
  )
}

/* Real mode must never render a figure here. 0 is a valid score (calm), so a
   dial at 0 reads as a reading. The slot holds a drawn rule, not a glyph —
   a dash or an em dash could be mistaken for a value. */
function Waiting({ children }) {
  return (
    <>
      <span aria-hidden className="block h-[3px] w-14 bg-ink-3"/>
      <span aria-hidden className="mt-3 text-tick text-ink-3">out of 100</span>
      <p className="mt-4 max-w-[24ch] text-center text-sec text-ink-2">{children}</p>
    </>
  )
}

/* ── The three previews ──────────────────────────────────────────────────── */

function StudentPreview({ cycle, real }) {
  if (real) return <Phone><Waiting>No readings yet. Pair a patch to start.</Waiting></Phone>
  /* size must stay above ~250: below that the score, its unit and both foot
     labels collide inside the dial's box. The `key` is what replays it. */
  return (
    <Phone>
      <RainbowDial key={cycle} score={51} usual={46} rings={studentRings()} size={268}/>
    </Phone>
  )
}

/* Derived from the same fixture WeekStrip draws, so the sentence and the
   picture cannot disagree. Do not hardcode the count. */
function daysOver() {
  const band = DATA.weekBand || { hi: 1 }
  return (DATA.week || []).filter(d => d.v > band.hi).length
}

function ParentPreview({ cycle, real, still }) {
  if (real) return (
    <Phone>
      <div aria-hidden className="flex w-full max-w-[17rem] gap-1.5">
        {Array.from({ length: 7 }, (_, i) => <span key={i} className="h-2 flex-1 rounded-xs bg-mist"/>)}
      </div>
      {/* Not colour alone: the words and the weight carry this state into
          grayscale. */}
      <p className="mt-5 flex max-w-[26ch] items-start gap-2 text-sec font-medium text-crit">
        <span aria-hidden className="mt-[0.5em] size-2 shrink-0 rounded-chip bg-crit"/>
        Patch not connected. No readings have arrived this week.
      </p>
    </Phone>
  )
  return <ParentWeek key={cycle} still={still}/>
}

function ParentWeek({ still }) {
  const on = useEntered(still)
  const n = daysOver()
  return (
    <Phone>
      {/* A clip-path wipe, not seven staggered bars: the bars are 8px tall, so
          a rise inside one is a two-pixel event at preview size. */}
      <div aria-hidden className="w-full max-w-[17rem] overflow-hidden">
        <div style={{
          clipPath: on ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
          transition: still ? undefined : `clip-path 1100ms ${EASE}`,
        }}>
          <WeekStrip days={DATA.week} band={DATA.weekBand}/>
        </div>
      </div>
      <p className="mt-5 max-w-[24ch] text-center text-sec text-ink-2"
        style={{
          opacity: on ? 1 : 0,
          transform: on ? 'none' : 'translateY(6px)',
          transition: still ? undefined : `opacity 460ms ${EASE} 900ms, transform 460ms ${EASE} 900ms`,
        }}>
        {n === 1 ? 'One day' : `${n} days`} above her usual range this week.
      </p>
    </Phone>
  )
}

function ProPreview({ cycle, real, still }) {
  if (real) return (
    <Console>
      <div aria-hidden className="w-full space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <span key={i} className="block h-2.5 w-full rounded-bar bg-mist"/>
        ))}
      </div>
      <p className="mt-5 max-w-[30ch] text-center text-sec text-ink-2">
        No students yet. A name appears here only once a guardian has consented.
      </p>
    </Console>
  )
  return <ProRanking key={cycle} still={still}/>
}

function ProRanking({ still }) {
  const on = useEntered(still)
  /* The reading field is `current`, not `score`. Reading `score` gives
     undefined, tierOf floors it to 'info', and every row renders identical. */
  const rows = triage().slice(0, 5)
  return (
    <Console>
      <ul className="m-0 w-full list-none space-y-3 p-0">
        {rows.map((s, i) => {
          const tier = tierOf(s.current)
          return (
            <li key={s.id} className="grid grid-cols-[1.1rem_minmax(0,1fr)_4.6rem] items-center gap-2"
              style={{
                opacity: on ? 1 : 0,
                transform: on ? 'none' : 'translateX(-10px)',
                /* in rank order, so the top of the board arrives first */
                transition: still ? undefined
                  : `opacity 420ms ${EASE} ${i * 90}ms, transform 420ms ${EASE} ${i * 90}ms`,
              }}>
              <span className="font-mono text-fine tabular-nums text-ink-3">{i + 1}</span>
              <span className="block h-2.5 w-full rounded-bar bg-mist">
                <span className={cn('block h-2.5 rounded-bar',
                  tier === 'crisis' ? 'bg-crit' : tier === 'high' ? 'bg-warn' : 'bg-accent')}
                  style={{ width: `${s.current}%` }}/>
              </span>
              <span className="font-mono text-fine tabular-nums text-ink-2">{TIER_LABEL[tier]}</span>
            </li>
          )
        })}
      </ul>
    </Console>
  )
}

/* ── The doors ───────────────────────────────────────────────────────────── */

const ROLES = [
  { id:'app-student', who:'Student', Preview: StudentPreview,
    title:`Your ${SCORE}, and how it was worked out`,
    body:'Every reading the patch took today, what moved the number, and what you wrote. Nothing here is withheld from you.',
    cta:'Open the student screen',
    name:`Open the student screen: one ${SCORE} out of 100 for today, with every reading underneath it.` },
  { id:'app-parent', who:'Parent', Preview: ParentPreview,
    title:'The week in one sentence',
    body:`One ${SCORE} a day, which days sat above her own range, and a line in plain words. Never a raw reading, never a note.`,
    cta:'Open the parent screen',
    name:`Open the parent screen: the week at a glance and one plain sentence.` },
  { id:'app-pro', who:'Medical Professional', Preview: ProPreview,
    /* Wording is fixed site-wide in lib/terms.js — change it there, not here. */
    title: CASELOAD_TITLE,
    body:`The students whose ${SCORE} moved most since last week, for the ones whose guardian consented to trends. Never a group under five.`,
    cta:'Open the medical professional console',
    name:`Open the medical professional console: the students whose ${SCORE} moved most since last week.` },
]


function Door({ role, go, active, setActive, real, still }) {
  const focused = active === role.id
  /* Idle: all three cycle slowly. Pointed at: that one speeds up and the other
     two stop. Real mode has nothing to animate. */
  const run = !still && !real && (active === null || focused)
  const cycle = useCycle(run, focused ? 2400 : 5600)
  const { Preview } = role
  return (
    <Card interactive as="button" type="button" aria-label={role.name}
      onClick={() => go(role.id)}
      onPointerEnter={() => setActive(role.id)}
      onPointerLeave={() => setActive(a => (a === role.id ? null : a))}
      onFocus={() => setActive(role.id)}
      onBlur={() => setActive(a => (a === role.id ? null : a))}
      className="flex h-full flex-col">
      {/* aria-hidden: the previews label themselves, and all of it would
          otherwise be concatenated into this button's accessible name
          (role.name). */}
      <div aria-hidden className={cn('grid min-h-[352px] place-items-center border-b border-rule px-3 py-5',
        'transition-opacity duration-200', active !== null && !focused && 'opacity-75')}>
        <Preview cycle={cycle} real={real} still={still}/>
      </div>
      <CardContent className="flex flex-1 flex-col gap-2.5 p-4">
        {/* A span, not a heading: a button's content model is phrasing, and a
            heading inside it lands outside the document outline. */}
        <span className="block font-display text-row font-bold leading-[1.2] tracking-[-0.014em] text-ink">
          {role.who}
        </span>
        <span className="block font-display text-ui font-medium text-ink-2">
          {role.title}
        </span>
        <p className="text-note text-ink-2">{role.body}</p>
        <span className="mt-auto inline-flex items-center gap-2 pt-2 font-display text-ui
          font-medium text-accent">
          {role.cta}<ArrowRight aria-hidden className="size-4 shrink-0"/>
        </span>
      </CardContent>
    </Card>
  )
}

export function Launch({ go }) {
  const [mode] = useMode()
  const [active, setActive] = React.useState(null)
  const still = useStill()
  const real = mode === 'real'
  return (
    /* No vertical padding: `.wrap` takes it from the app shell (24px, 32 past
       lg). */
    <main className="wrap">
      {/* lg:hidden — past lg the app rail carries the wordmark instead. */}
      <Logo className="text-ui text-ink lg:hidden" title="MindMap"/>
      <h1 className="mt-4 font-display text-head font-bold leading-[1.2] tracking-[-0.018em] text-ink lg:mt-0">
        Who is opening the app?
      </h1>
      <p className="mt-2.5 max-w-[60ch] text-sec text-ink-2">
        Three screens read the same day of measurements and show three different parts of it.
        Pick the one that is yours.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {ROLES.map(role => (
          <Door key={role.id} role={role} go={go} active={active} setActive={setActive}
            real={real} still={still}/>
        ))}
      </div>
      {/* The medical disclaimer lives in the app foot, on every app screen.
          Do not repeat it here. */}
    </main>
  )
}
