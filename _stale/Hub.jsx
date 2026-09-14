import React from 'react'
import { ScrollRow } from '../s21/motion'
import { ArrowRight } from '../ui/marks'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Label } from '../ui/misc'
import { Separator } from '../ui/separator'
import { RainbowDial } from '../charts/rainbow'
import { WeekStrip } from '../charts/infographics'
import { studentRings } from '../lib/readings'
import { roster, triage, tierOf, TIER_LABEL } from '../lib/caseload'
import { DATA } from '../lib/assets'
import { cn } from '../lib/utils'

/* This page was four tiles with a stock photograph on each: a phone in
 * somebody's hands, a teenager on a pavement, a family at a table, a counselor
 * at a desk. Every photograph on this site is being deleted, and the tiles were
 * the reason to rebuild rather than just unhook the images — a picture of a
 * person holding a phone told a visitor nothing about the screen behind it.
 *
 * What replaces them is the screen itself. Each role panel runs the live
 * component that role's page runs, on that page's own data, so a preview can
 * never go stale against the thing it previews and a visitor can see what they
 * are choosing before they choose it.
 *
 * The other change is rank. "Take a reading" used to sit first, level with the
 * three audiences, which made four equal doors out of one question (who are
 * you?) and three side trips. The three roles are now the page; everything else
 * is a ruled row underneath at a smaller step.
 */

/* One line per role saying what that person is shown and what they are not.
 * This is the product's whole claim, and it was previously stated nowhere on
 * the page a visitor uses to pick a side of it. */
const ROLES = [
  { id:'student', who:'Student', ord:'01',
    title:'One score out of 100, today',
    sees:'Sees every reading the patch takes, and everything written in the app.',
    never:'Nothing on this screen is withheld from them — they are the one who decides what leaves it.',
    cta:'Open the student screen' },
  { id:'parent', who:'Parent', ord:'02',
    title:'One sentence a week, and which days ran high',
    sees:'Sees one number a day, and which of the seven days sat above their child\'s own range.',
    never:'Never a raw reading, never a note, never a location.',
    cta:'Open the parent screen' },
  { id:'pro', who:'School counselor', ord:'03',
    title:'A caseload ranked by who is changing fastest',
    sees:'Sees a score and a rank, for the students whose guardian consented to trends.',
    never:'Never raw readings unless the student switches them on, and never a group under five.',
    cta:'Open the counselor console' },
]

/* Built, and reachable from here. Kept apart from the planned list below by a
   heading and an ink rule rather than by a badge in a corner. */
const ELSEWHERE = [
  ['check',   'Score yourself in six questions', 'No patch needed. You get one number and one sentence.'],
  ['privacy', 'Who can see what',                'Every row of data, against the student, the parent and the counselor.'],
  ['patch',   'The patch, in three parts',       'The printed shell, the board inside, and what reads through the base.'],
  ['tour',    'Guided tour, eight stops',        'The problem, what we built, and what is still demonstration.'],
]

/* Screens that do not exist. Two entries left this list when the pages they
   described were built — "Who can see what" and "Your patch" are above now, and
   leaving them here while they worked was the dishonest half of the list. */
const PLANNED = [
  ['The hours ahead',    'Which periods usually run hard, and a prompt before them.'],
  ['Your history',       'Ninety days. The worst stretches, and what ended them.'],
  ['Readings by class',  'Every class you take, laid against the timetable.'],
  ['What helps',         'The measured effect of each thing you have tried.'],
]

/* The parent line is counted off the same fixture the strip draws, so the
   sentence and the picture cannot disagree. A hard-coded "two days" was already
   contradicting the counter on the parent screen. */
function daysOver() {
  const band = DATA.weekBand || { hi: 1 }
  return (DATA.week || []).filter(d => d.v > band.hi).length
}

function Preview({ id }) {
  if (id === 'student') {
    /* Below about 250 the dial's score, its unit and both foot labels collide
       inside the same box; this is the smallest size that stays legible. */
    return <RainbowDial score={51} usual={46} rings={studentRings()} size={258}/>
  }
  if (id === 'parent') {
    const n = daysOver()
    return (
      <div className="w-full max-w-[17rem]">
        <WeekStrip days={DATA.week} band={DATA.weekBand}/>
        <p className="mt-4 text-sec text-ink-2">
          {n === 1 ? 'One day' : `${n} days`} above her usual range.
        </p>
      </div>
    )
  }
  /* The counselor's screen is a ranking, so the preview is the ranking — real
     order, real scores, real tier colours. `roster()` names the reading
     `current`; reading `score` here returns undefined, which tierOf floors to
     'info', and the preview becomes four identical rows. */
  const rows = triage().slice(0, 4)
  return (
    <ul className="m-0 w-full max-w-[17rem] list-none space-y-3 p-0">
      {rows.map((s, i) => {
        const tier = tierOf(s.current)
        return (
          <li key={s.id} className="grid grid-cols-[1.25rem_1fr_4.5rem] items-center gap-2.5">
            <span className="font-mono text-fine tabular-nums text-ink-3">{i + 1}</span>
            <span className="block h-2.5 w-full rounded-bar bg-rule/70">
              <span className={cn('block h-2.5 rounded-bar',
                tier === 'crisis' ? 'bg-crit' : tier === 'high' ? 'bg-warn' : 'bg-accent')}
                style={{ width: `${s.current}%` }}/>
            </span>
            <span className="font-mono text-fine tabular-nums text-ink-2">{TIER_LABEL[tier]}</span>
          </li>
        )
      })}
    </ul>
  )
}

export function Hub({ go }) {
  const total = roster().length
  return (
    <main className="wrap py-14">
      <Label>Open the app</Label>
      <h1 className="mt-3.5 font-display font-medium text-view leading-[1.05] tracking-tight text-ink">
        MindMap has three screens: student, parent, counselor
      </h1>
      <p className="mt-5 max-w-read text-lead leading-[1.55] text-ink-2">
        All three read the same day of measurements from the patch. The student sees every reading;
        the other two see only what the student agreed to share. Open any of them.
      </p>

      {/* The three doors, and the largest thing on the page. Equal columns,
          equal preview height, one CTA each — a role that got a taller tile or
          a second button would read as the recommended answer to a question
          that has no recommended answer. */}
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {ROLES.map((r, i) => (
          <ScrollRow key={r.id} index={i} className="h-full">
            <Card interactive as="button" type="button" onClick={() => go(r.id)}
              className="flex h-full flex-col">
              {/* place-items, not place-content: a content-sized grid track
                  collapses a w-full preview to the width of its own labels and
                  the parent's bars measure zero. */}
              <div aria-hidden className="grid min-h-[268px] place-items-center border-b border-rule
                bg-card px-6 py-8">
                <Preview id={r.id}/>
              </div>
              <CardHeader className="pb-0 pt-6">
                <span className="font-mono text-fine uppercase tracking-[0.08em] text-ink-3">
                  {r.ord} · {r.who}</span>
                <CardTitle as="h2" className="text-sub leading-[1.12] tracking-tight">{r.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4 pt-4">
                <p className="text-sec text-ink-2">
                  <span className="font-medium text-ink">{r.sees}</span>{' '}{r.never}
                </p>
                <span className="mt-auto inline-flex items-center gap-2.5 pt-2 font-display
                  text-meta font-medium text-accent">
                  {r.cta}<ArrowRight aria-hidden className="size-[1.1rem]"/>
                </span>
              </CardContent>
            </Card>
          </ScrollRow>
        ))}
      </div>

      {/* Second rank, and it looks like one: no preview, one line each, a
          smaller title step. */}
      <section className="mt-20">
        <h2 className="mark">Four more pages that open and run</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {ELSEWHERE.map(([to, h, p], i) => (
            <ScrollRow key={to} index={i} className="h-full">
              <Card interactive as="button" type="button" onClick={() => go(to)}
                className="flex h-full flex-col gap-3 p-5">
                <CardTitle as="h3" className="text-row tracking-tight">{h}</CardTitle>
                <p className="text-sec text-ink-2">{p}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-1 font-mono
                  text-tick text-accent">
                  Open <ArrowRight aria-hidden className="size-3.5"/>
                </span>
              </Card>
            </ScrollRow>
          ))}
        </div>
      </section>

      {/* The ink rule is the page's own break between what runs and what does
          not, and the sentence under it says which side is which — a reader
          should not have to reach the sixth card to find out. */}
      <div className="mt-20">
        <Separator weight="ink"/>
        <h2 className="mt-8 font-display text-sub font-medium tracking-tight text-ink">
          Planned screens, not built yet
        </h2>
        <p className="mt-3 max-w-[62ch] text-meta text-ink-2">
          Everything above this rule opens and runs, on generated data — the {total} students on the
          counselor screen are invented, and nobody has been measured. Nothing below this rule exists:
          these four are written down and nothing more.
        </p>
        <ul className="mt-6 grid list-none gap-x-10 gap-y-5 p-0 sm:grid-cols-2 xl:grid-cols-4">
          {PLANNED.map(([h, p]) => (
            <li key={h} className="border-t border-rule pt-4">
              <h3 className="font-display text-row font-medium tracking-tight text-ink-2">{h}</h3>
              <p className="mt-1.5 text-sec text-ink-3">{p}</p>
              <p className="mt-2.5 font-mono text-tick italic text-ink-3">— not built</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
