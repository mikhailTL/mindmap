import React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { Section, SectionHead } from '../ui/section'
import { Button } from '../ui/button'
import { ArrowRight } from '../ui/marks'
import { ConsentRules, FrameworkFan, NetworkPath, PatchLink } from '../charts/architecture'
import { CONTEXT_WINDOWS, PARAM_COUNT } from '../signals/tnam'
import { TNAM_RESULTS as R } from '../signals/tnam-results'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { K_ANONYMITY } from '../lib/caseload'
import { STUDENT_GROUPS } from '../toolkit/index'
import { PRO_LC, SCORE } from '../lib/terms'
import { cn } from '../lib/utils'

/* How it works, in four categories, one at a time.
 *
 * THE OWNER'S WORDS. "Nothing is sectioned into categories like I said to and
 * everything is cluttered and still too complex, like nobody needs to know
 * AUROC or anything." And earlier: divide it into "Hardware", "AI", "Machine
 * Learning" and "Other Software" so it is not everything all at once.
 *
 * So the page is a switcher and one band. A reader picks a category and sees
 * that category's band and nothing else: one heading, one line under it, three
 * to five rows of label and one short line, and one drawing. The previous
 * page was 1,665 rendered words across six bands; this one is under 350
 * across all four categories together (spec 0f rule 6).
 *
 * NO STATISTIC A JUDGE DOES NOT NEED. No AUROC, no p-value, no interval, no
 * balanced accuracy, no F1 and no decimal figure anywhere on this page. Those
 * live in docs/ and in signals/tnam-results.js, and one row says so. What
 * survives in words: no unit built or worn; every subject an adult; the
 * emotional-distress failure; the three consent rules; MindMap AI never
 * diagnoses and is not an FDA framework.
 *
 * EVERY COUNT IS READ, NOT TYPED. Parameters, the memory length, the subjects,
 * the people beaten, the k floor and the Toolkit count all come out of the
 * modules that enforce them.
 *
 * VOCABULARY. The neural network is "the Mind Score network". Never "the
 * model". */

const HOP_S = 30
const MEMORY_MIN = (CONTEXT_WINDOWS * HOP_S) / 60
const SUBJECTS = R.per_subject.length
const WINS = R.paired.wins
const TOOLS = STUDENT_GROUPS.reduce((n, g) => n + g.items.length, 0)
const SIGNAL_NAMES = SENSOR_ORDER.map(id => SENSORS[id].name.toLowerCase())

/* ── the four categories ─────────────────────────────────────────────────
   `tone` is the band's ground. Three near-whites and one ink band, which is
   the range spec 0f rule 7 asks for; the dark one is the network, so the one
   drawing with real data on it sits on the one ground that sets it apart. */
const CATEGORIES = [
  { id: 'hardware', tab: 'The patch', tone: 'paper', ground: 'bg-paper',
    title: 'A patch on your upper arm',
    line: 'The patch reads four body signals and sends them to your phone.',
    rows: [
      ['What the patch measures', `The patch measures ${SIGNAL_NAMES[0]}, ${SIGNAL_NAMES[1]}, skin ${SIGNAL_NAMES[2]} and ${SIGNAL_NAMES[3]}, once a second.`],
      ['Where the patch goes', 'The patch sticks to your upper arm, inside a small printed shell.'],
      ['How the patch connects', 'The patch pairs with your phone over Bluetooth, with no wires.'],
      ['Status today', 'The patch is a design, not a built unit. Patch readings on this site are generated.'],
    ],
    figure: PatchLink },
  { id: 'ai', tab: 'MindMap AI', tone: 'card', ground: 'bg-aqua',
    title: 'MindMap AI',
    line: 'MindMap AI answers questions in plain words and never diagnoses.',
    rows: [
      ['Answers', `MindMap AI answers questions about stress, sleep, school and the ${SCORE}.`],
      ['Follows', 'The answers follow guidance from SAMHSA, NIMH, AAP and CDC.'],
      ['Speaks to', 'Teens, parents and Medical Professionals each get a different voice.'],
      ['Never', 'MindMap AI never diagnoses, scores severity or names a medication.'],
      ['In a crisis', 'In a crisis, MindMap AI gives a crisis line before anything else.'],
      ['Status today', 'MindMap AI is not connected yet, so nothing on this site answers a question.'],
    ],
    figure: FrameworkFan },
  { id: 'ml', tab: 'Machine Learning', tone: 'ink', ground: 'bg-ink',
    title: 'A novel neural network',
    line: `A novel and never before seen approach to turning four body signals into one ${SCORE}.`,
    rows: [
      ['Learns', `Its own curve for each signal, with the last ${MEMORY_MIN} minutes in memory.`],
      ['Size', `${PARAM_COUNT.toLocaleString('en-US')} parameters, small enough to run on the phone. Nothing is uploaded.`],
      ['Tested on', `${SUBJECTS + R.transfer.subjects} adults in two public lab datasets, and ${R.exams.spearman_flagged_vs_grade.n} real exam sessions.`],
      ['Against the formula', `Reads stress better than the standard formula for ${WINS} of ${SUBJECTS} people. Ties the other ${SUBJECTS - WINS}.`],
      ['Accuracy', `Tells a stressful minute from a calm one ${Math.round(R.summary.tnam.bacc.mean * 100)} times in 100.`],
      ['Quiet when calm', `Flags ${Math.round(R.summary.tnam.meditation_false_alarm * 100)} in 100 meditation minutes. The formula flags ${Math.round(R.summary.formula.meditation_false_alarm * 100)}.`],
      ['Built for', 'Stress, not sadness. A sad film does not move the score.'],
      ['More', 'Full figures are in the repository, under docs.'],
    ],
    figure: NetworkPath },
  { id: 'software', tab: 'The app and the site', tone: 'card', ground: 'bg-beam-wash',
    title: 'The app and the site',
    line: 'Everything runs on your phone, and nothing is stored anywhere else.',
    rows: [
      ['Built with', 'The app is built with React and runs in the browser.'],
      ['Reading without the patch', 'The camera reads for 30 seconds and the microphone for 15. No patch is needed.'],
      ['Privacy', `Parents see one day at a time. Groups under ${K_ANONYMITY} show nothing. Every record opened is logged.`],
      ['Toolkit', `The toolkit has ${TOOLS} activities, each on its own page.`],
      ['Offline', 'Your readings and your baseline stay on your phone.'],
    ],
    figure: ConsentRules },
]

/* A row: label, one line. Ruled, never boxed. */
function Row({ k, dark, children }) {
  return (
    <div className={cn('grid gap-x-4 gap-y-0.5 border-t py-2 first:border-t-0 first:pt-0',
      'sm:grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)]', dark ? 'border-ink-3' : 'border-rule')}>
      <p className={cn('font-body text-ui font-semibold', dark ? 'text-paper' : 'text-ink')}>{k}</p>
      <p className={cn('text-meta leading-[1.45]', dark ? 'text-mist' : 'text-ink-2')}>{children}</p>
    </div>
  )
}

/* The switcher. Four controls a reader presses, so rounded-field, body face,
   normal case (spec 0d rule 2). Two by two on a phone, one row from sm. */
const TRIGGER = cn(
  'min-h-[44px] rounded-field border px-3 font-display text-ui font-medium',
  'select-none touch-manipulation transition-colors duration-150 ease',
  'border-rule bg-card text-ink-2 data-[state=inactive]:hoverOnly:bg-mist',
  'data-[state=active]:border-accent-ink data-[state=active]:bg-accent',
  'data-[state=active]:font-bold data-[state=active]:text-paper',
)

export function Methods({ go }) {
  return (
    <main>
      <TabsPrimitive.Root defaultValue={CATEGORIES[0].id}>

        {/* ── the opening band: title, one action, the switcher ── */}
        <section className="border-t border-rule bg-paper">
          <div className="wrap pb-5 pt-7 lg:pb-6 lg:pt-10">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div className="min-w-0">
                <p className="font-body text-ui font-semibold text-accent-ink">How it works</p>
                <h1 className="mt-2 font-display font-bold text-major leading-[1.05] tracking-tight text-ink">
                  The four parts of MindMap
                </h1>
              </div>
              <Button variant="outline" size="sm" onClick={() => go('check')}>
                Take a reading<ArrowRight aria-hidden/>
              </Button>
            </div>
            <TabsPrimitive.List aria-label="Category"
              className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {CATEGORIES.map(c => (
                <TabsPrimitive.Trigger key={c.id} value={c.id} className={TRIGGER}>
                  {c.tab}
                </TabsPrimitive.Trigger>
              ))}
            </TabsPrimitive.List>
          </div>
        </section>

        {/* ── one band per category, one on screen at a time ── */}
        {CATEGORIES.map(c => {
          const dark = c.tone === 'ink'
          const Figure = c.figure
          return (
            <TabsPrimitive.Content key={c.id} value={c.id} className="outline-none">
              <Section tone={c.tone} className={c.ground}>
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start lg:gap-10">
                  <div className="min-w-0">
                    <SectionHead tone={c.tone} className="mt-0 max-w-[24ch]">{c.title}</SectionHead>
                    <p className={cn('mt-2 max-w-[48ch] text-sec leading-[1.5]',
                      dark ? 'text-mist' : 'text-ink-2')}>
                      {c.line}
                    </p>
                    <div className="mt-4">
                      {c.rows.map(([k, line]) => <Row key={k} k={k} dark={dark}>{line}</Row>)}
                    </div>
                  </div>
                  <Figure dark={dark} className="min-w-0 lg:pt-1"/>
                </div>
              </Section>
            </TabsPrimitive.Content>
          )
        })}

      </TabsPrimitive.Root>
    </main>
  )
}
