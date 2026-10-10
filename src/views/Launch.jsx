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

/* The front door. "Launch the app" in the top bar lands here and nowhere else,
 * so this page answers one question — who is holding the phone — and answers it
 * with the screens themselves rather than with three links and three icons.
 *
 * Each door runs the component its dashboard runs, on that dashboard's own
 * data: the student's arch, the parent's week strip, the counselor's ranking.
 * A preview drawn by hand goes stale against the thing it previews the first
 * time either one changes, and a visitor who picked a door from a picture that
 * no longer matches has been misled by us rather than by their own guess.
 *
 * The animation is not decoration either. A still arch and a still ranking look
 * like two diagrams; an arch that fills and a list that ranks itself show what
 * the two screens actually do differently, which is the choice being made.
 */

/* ── Loop ────────────────────────────────────────────────────────────────── */

/* One mechanism drives every preview: a counter that ticks, and everything
   keyed on it remounts and plays its own entry again. That is deliberate
   rather than a stack of per-chart timelines — RainbowDial already counts its
   score and draws its arcs on mount, so replaying it is a remount, and the two
   previews written here get the same treatment instead of a second, parallel
   way of being animated. Stopping the tick leaves the last cycle to finish
   normally, so a card that quiets settles rather than freezing mid-draw. */
function useCycle(run, period) {
  const [n, setN] = React.useState(0)
  React.useEffect(() => {
    if (!run) return
    const id = setInterval(() => setN(v => v + 1), period)
    return () => clearInterval(id)
  }, [run, period])
  return n
}

/* `still` is the whole reduced-motion contract in this file: it starts every
   entry in its finished state, so nothing moves and nothing has to be caught
   mid-transition. Two frames, not one — the first commit has to be painted
   before the flip, or the browser coalesces both states and no transition
   runs at all. */
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

/* Every screen body is the same height in both modes and on all three cards,
   so switching Demo to Real cannot move the page under a pointer that is
   already on a card. */
const BODY = 'flex min-h-[236px] w-full flex-col items-center justify-center'

/* Student and parent use a phone because that is where those two screens are
   read. The counselor's is a console window because hers is a desk. Same
   depth mechanism as every other raised surface here: a hard offset, no blur. */
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

/* The one thing Real mode must never do is show a figure. A dial sitting at 0
   is not an empty state on this scale: 0 is calm, the best day a person can
   have. So the slot the number would fill holds a drawn blank instead of any
   glyph, which cannot be mistaken for a reading or for punctuation. */
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
  /* Below about 250 the score, its unit and both foot labels collide inside
     the dial's own box. Remounting on `cycle` is what replays the count and
     the four arcs; the dial handles reduced motion on its own. */
  return (
    <Phone>
      <RainbowDial key={cycle} score={51} usual={46} rings={studentRings()} size={268}/>
    </Phone>
  )
}

/* Counted off the fixture the strip draws, so the sentence and the picture
   cannot disagree — a hard-coded count was already contradicting the parent
   screen once. */
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
      {/* Red, and not red alone: the words say it and the weight carries it
          into grayscale, because a parent who cannot see the colour still has
          to learn that nothing is arriving. */}
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
      {/* The days arrive left to right. A wipe rather than seven staggered
          bars: the strip's bars are 8px tall, so a rise inside one is a
          two-pixel event nobody sees at preview size, while the days landing
          in order is the thing the parent screen is actually about. */}
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
  /* `roster()` names the reading `current`. Reading `score` returns undefined,
     tierOf floors that to 'info', and the board becomes four identical rows in
     one colour, which is the opposite of what this list is for: the five
     students whose reading moved most, in that order. */
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
  { id:'app-pro', who:'School professional', Preview: ProPreview,
    /* Was "Students ranked by who is changing fastest", which two testers read
       as students being listed by how badly they are doing. terms.js settled
       the wording for the whole site and this is it. */
    title: CASELOAD_TITLE,
    body:`The students whose ${SCORE} moved most since last week, for the ones whose guardian consented to trends. Never a group under five.`,
    cta:'Open the counselor console',
    name:`Open the counselor console: the students whose ${SCORE} moved most since last week.` },
]


function Door({ role, go, active, setActive, real, still }) {
  const focused = active === role.id
  /* Idle: all three breathe at the same slow pace, so the page is alive before
     anyone points at it. Pointed at: that one speeds up and the other two stop
     ticking — a card still replaying beside the one being read is competition,
     not context. Real mode has nothing to animate. */
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
      {/* aria-hidden: the dial labels itself for a reader who meets it on the
          student screen, and all of that would otherwise be concatenated into
          this button's name. The button says where it goes; the screen says
          what it says, once you are on it. */}
      <div aria-hidden className={cn('grid min-h-[352px] place-items-center border-b border-rule px-3 py-5',
        'transition-opacity duration-200', active !== null && !focused && 'opacity-75')}>
        <Preview cycle={cycle} real={real} still={still}/>
      </div>
      <CardContent className="flex flex-1 flex-col gap-2.5 p-4">
        {/* The role is what a visitor is scanning for, so the role is the
            title. It used to be a mono eyebrow over a sentence: three cards
            each headed by a different sentence meant reading all three to find
            out which one was yours. */}
        {/* a span, not a heading: a button's content model is phrasing, and
            an h2 inside it puts a heading-shaped thing outside the outline */}
        {/* `text-sub` was 32px to 48px here, which is a marketing section
            head sitting inside a card. On the app scale a door is a row of a
            list you are choosing from, so the role is `row` at 25px and
            everything under it steps down with it. */}
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
    /* This is the app's front door, so it is built to the app's scale rather
       than to the site's. What was here was a marketing page: a wordmark at
       48px, a 60px title, a 24px lede and 56px of air between every part of
       it, which is exactly why a tester could not tell they had crossed into
       the product. The title bar above already names the screen, the rail
       already carries the mark past lg, and the page itself is now a question
       and three doors.

       `.wrap` takes its padding from the shell, which is 24px here and 32
       past lg. It was py-14. */
    <main className="wrap">
      {/* Below lg the rail is not on screen, so this is the one place the
          product signs its name. One line, at 17px, not a 48px lockup. */}
      <Logo className="text-ui text-ink lg:hidden" title="MindMap"/>
      <h1 className="mt-4 font-display text-head font-bold leading-[1.2] tracking-[-0.018em] text-ink lg:mt-0">
        Who is opening the app?
      </h1>
      {/* The "Three screens" heading under this was a section head over a
          section of three, directly under a sentence that already said there
          were three. */}
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
      {/* The medical disclaimer used to be repeated here and in the footer of
          the same page. It is in the app's foot now, on every app screen. */}
    </main>
  )
}
