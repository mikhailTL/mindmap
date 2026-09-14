import React from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Logo } from '../ui/logo'
import { Label } from '../ui/misc'
import { ArrowLeft, ArrowRight } from '../ui/marks'
import { RainbowDial } from '../charts/rainbow'
import { WeekStrip } from '../charts/infographics'
import { studentRings } from '../lib/readings'
import { triage, tierOf, TIER_LABEL } from '../lib/caseload'
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
        <span className="font-mono text-tick text-ink-3">Caseload</span>
        <span className="font-mono text-tick text-ink-3">by change</span>
      </div>
      <div className={cn(BODY, 'px-3 py-4')}>{children}</div>
    </div>
  )
}

/* The one thing Real mode must never do is show a figure. A dial sitting at 0
   is not an empty state on this scale — 0 is calm, the best day a person can
   have — so the place where the number goes holds an em dash instead. */
function Waiting({ children, big = '—' }) {
  return (
    <>
      <span aria-hidden className="font-display text-dial font-medium leading-none text-ink-3">{big}</span>
      <span aria-hidden className="mt-1 font-mono text-tick text-ink-3">out of 100</span>
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
     one colour — which is the opposite of what a ranked caseload shows. */
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
  { id:'app-student', ord:'01', who:'Student', Preview: StudentPreview,
    title:'Your score, and the working under it',
    body:'Every reading the patch took today, what moved the number, and what you wrote. Nothing here is withheld from you.',
    cta:'Open the student dashboard',
    name:'Open the student dashboard: one score out of 100 for today, with every reading underneath it.' },
  { id:'app-parent', ord:'02', who:'Parent', Preview: ParentPreview,
    title:'The week, and one sentence',
    body:'One number a day, which days sat above her own range, and a line in plain words. Never a raw reading, never a note.',
    cta:'Open the parent dashboard',
    name:'Open the parent dashboard: the week at a glance and one plain sentence.' },
  { id:'app-pro', ord:'03', who:'School professional', Preview: ProPreview,
    title:'A caseload ranked by who is changing fastest',
    body:'A score and a rank for the students whose guardian consented to trends. Never a group under five.',
    cta:'Open the counselor console',
    name:'Open the school counselor console: a caseload ranked by who is changing fastest.' },
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
      <div aria-hidden className={cn('grid min-h-[352px] place-items-center border-b border-rule px-4 py-8',
        'transition-opacity duration-200', active !== null && !focused && 'opacity-75')}>
        <Preview cycle={cycle} real={real} still={still}/>
      </div>
      <CardContent className="flex flex-1 flex-col gap-4">
        {/* The role is what a visitor is scanning for, so the role is the
            title. It used to be a mono eyebrow over a sentence — three cards
            each headed by a different sentence meant reading all three to find
            out which one was yours. */}
        <span className="flex items-baseline gap-3">
          <span className="font-mono text-fine tabular-nums text-ink-3">{role.ord}</span>
          {/* a span, not a heading: a button's content model is phrasing, and
              an h2 inside it puts a heading-shaped thing outside the outline */}
          <span className="block font-display text-sub font-medium leading-[1.12] tracking-tight text-ink">
            {role.who}
          </span>
        </span>
        <span className="-mt-2 block font-display text-meta font-medium text-ink-2">
          {role.title}
        </span>
        <p className="text-sec text-ink-2">{role.body}</p>
        <span className="mt-auto inline-flex items-center gap-2.5 pt-2 font-display text-meta
          font-medium text-accent">
          {role.cta}<ArrowRight aria-hidden className="size-[1.1rem]"/>
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
    <main className="wrap py-14">
      <Button variant="ghost" size="sm" onClick={() => go('site')}>
        <ArrowLeft aria-hidden/>Back to the overview
      </Button>

      {/* The mark at full size, once. This is the only screen a visitor reaches
          by saying "open it", so it is the one place the product introduces
          itself rather than sitting in a corner of a bar. */}
      <div className="mt-10 flex items-center gap-4">
        <Logo className="text-sub text-ink" title="MindMap"/>
      </div>
      <Label className="mt-8 block">Launch the app</Label>
      <h1 className="mt-3.5 font-display text-view font-medium leading-[1.05] tracking-tight text-ink">
        Who is opening the app?
      </h1>
      <p className="mt-5 max-w-read text-lead leading-[1.55] text-ink-2">
        Three screens read the same day of measurements and show three different slices of it.
        Each panel below is the screen itself, running. Pick the one that is yours.
      </p>

      <section className="mt-14">
        <h2 className="mark">Three screens</h2>
        <div className="mt-5 grid gap-6 lg:grid-cols-3">
          {ROLES.map(role => (
            <Door key={role.id} role={role} go={go} active={active} setActive={setActive}
              real={real} still={still}/>
          ))}
        </div>
      </section>

      <p className="mt-14 max-w-[62ch] text-sec text-ink-3">
        MindMap measures four body signals and scores them against your own two weeks. It is not a
        medical device, it does not diagnose anything, and no screen here is a clinical judgement.
      </p>
    </main>
  )
}
