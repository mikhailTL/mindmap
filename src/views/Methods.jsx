import React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { Section, SectionHead } from '../ui/section'
import { Button } from '../ui/button'
import { ArrowRight, Camera, MoveMark } from '../ui/marks'
import { ConsentRules, FrameworkFan, NetworkPath, PatchLink } from '../charts/architecture'
import { CONTEXT_WINDOWS, PARAM_COUNT } from '../signals/tnam'
import { TNAM_RESULTS as R } from '../signals/tnam-results'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { K_ANONYMITY } from '../lib/caseload'
import { SCORE } from '../lib/terms'
import { cn } from '../lib/utils'
import { Parallax2D, ScrollIn, ScrollRow } from '../ui/motion'
import { ToolkitBand } from './methods/ToolkitBand'

/* How it works, in six categories, one at a time.
 *
 * THE OWNER'S WORDS. "Nothing is sectioned into categories like I said to and
 * everything is cluttered and still too complex, like nobody needs to know
 * AUROC or anything." Later: "Remove sources from here, the phone sensor
 * section is dry and too much text." And: no count that will change (the
 * Toolkit grows), and no line anywhere saying the patch is unbuilt.
 *
 * So the page is a switcher and one band. A reader picks a category and sees
 * that category's band and nothing else: one heading, one line under it, a
 * few rows of label and one short line, and one drawing. No citations in the
 * text; the papers live in docs/.
 *
 * NO STATISTIC A JUDGE DOES NOT NEED. No AUROC, no p-value, no interval, no
 * balanced accuracy, no F1 and no decimal figure anywhere on this page.
 *
 * VOCABULARY. The neural network is "the Mind Score network". Never "the
 * model". */

const HOP_S = 30
const MEMORY_MIN = (CONTEXT_WINDOWS * HOP_S) / 60
const SUBJECTS = R.per_subject.length
const WINS = R.paired.wins
const SIGNAL_NAMES = SENSOR_ORDER.map(id => SENSORS[id].name.toLowerCase())

/* ── the four categories ─────────────────────────────────────────────────
   `tone` is the band's ground. Three near-whites and one ink band, which is
   the range spec 0f rule 7 asks for; the dark one is the network, so the one
   drawing with real data on it sits on the one ground that sets it apart. */
const CATEGORIES = [
  { id: 'hardware', tab: 'The patch', tone: 'paper', ground: 'bg-paper',
    title: 'Your body, once a second',
    line: 'The patch sends four body signals to your phone, where each is compared with your own normal.',
    rows: [
      ['Measures', `${SENSORS[SENSOR_ORDER[0]].name}, ${SIGNAL_NAMES[1]}, skin ${SIGNAL_NAMES[2]} and ${SIGNAL_NAMES[3]}, once a second.`],
      ['Sits', 'On your upper arm, inside a small printed shell.'],
      ['Connects', 'To your phone over Bluetooth, with no wires.'],
    ],
    close: 'MindMap also works without the patch, with readings from the phone camera pulse and the survey.',
    figure: PatchLink },
  { id: 'ai', tab: 'MindMap AI', tone: 'card', ground: 'bg-aqua',
    title: 'Plain answers to your questions',
    line: 'Ask when a reading or a hard week needs explaining.',
    rows: [
      ['Answers', `Stress, sleep, school and the ${SCORE}.`],
      ['Follows', 'Guidance from SAMHSA, NIMH, AAP and CDC.'],
      ['Speaks to', 'Teens, parents and Medical Professionals, each in their own voice.'],
      ['Never', 'Diagnoses, scores severity or names a medication.'],
      ['In a crisis', 'A crisis line comes before anything else.'],
      ['Status today', 'Not connected yet, so nothing on this site answers a question.'],
    ],
    figure: FrameworkFan },
  { id: 'ml', tab: 'Machine Learning', tone: 'ink', ground: 'bg-ink',
    title: 'A novel neural network',
    line: `It turns four body signals into one ${SCORE}, so you can see when a day sits above your own normal.`,
    rows: [
      ['Learns', `Its own curve for each signal, with the last ${MEMORY_MIN} minutes in memory.`],
      ['Size', `${PARAM_COUNT.toLocaleString('en-US')} parameters, small enough to run on the phone.`],
      ['Tested on', `${SUBJECTS + R.transfer.subjects} adults in two public lab datasets, and ${R.exams.spearman_flagged_vs_grade.n} real exam sessions.`],
      ['Against the formula', `Reads stress better than the standard formula for ${WINS} of ${SUBJECTS} people. Ties the other ${SUBJECTS - WINS}.`],
      ['Accuracy', `Tells a stressful minute from a calm one ${Math.round(R.summary.tnam.bacc.mean * 100)} times in 100.`],
      ['Quiet when calm', `Flags ${Math.round(R.summary.tnam.meditation_false_alarm * 100)} in 100 meditation minutes. The formula flags ${Math.round(R.summary.formula.meditation_false_alarm * 100)}.`],
      ['Made for', 'Stress, not sadness. A sad film does not move the score.'],
      ['More', 'Full figures are in the repository, under docs.'],
    ],
    figure: NetworkPath },
  { id: 'software', tab: 'App and site', tone: 'card', ground: 'bg-beam-wash',
    title: 'Your readings follow your account',
    line: 'Use the app with or without the patch, on any device.',
    rows: [
      ['Made with', 'React, running in the browser.'],
      ['Without the patch', '45 seconds in all: 30 with the camera, then 15 with the microphone.'],
      ['Privacy', `Parents see one day at a time. Groups under ${K_ANONYMITY} show nothing. Every record opened is logged.`],
      ['Toolkit', 'Short activities, each on its own page.'],
      ['Sync', 'Readings sync to your account and to the people you share with.'],
    ],
    figure: ConsentRules },
  { id: 'beyond', tab: 'Phone sensors', tone: 'paper', ground: 'bg-paper',
    title: 'What your phone adds',
    line: 'Sensors you already carry, used only inside MindMap.',
    rows: [
      ['Camera', 'Reads your pulse from a fingertip on the lens.', Camera],
      ['Microphone', 'Times each long breath out in the breathing tools.', MicMark],
      ['Motion', 'Counts your breaths with the phone resting on your chest.', MoveMark],
      ['Screen', 'Notes the rhythm of taps and typing in MindMap, never the words.', KeysMark],
      ['Location', 'How far from home a reading happened. Never a map.', PinMark],
    ],
    figure: PhoneParts },
  /* "Toolkit isn't yet on how mindmap works." Its own band, drawn with the
     Toolkit's own nameplates and level emblems (methods/ToolkitBand.jsx). */
  { id: 'toolkit', tab: 'Toolkit', band: ToolkitBand },
]

/* `#/methods?tab=toolkit` opens on that tab, so other pages can link to it. */
const tabFromHash = () => {
  const m = /[?&]tab=([a-z]+)/.exec(typeof location !== 'undefined' ? location.hash : '')
  return m && CATEGORIES.some(c => c.id === m[1]) ? m[1] : CATEGORIES[0].id
}

/* Three marks the shared set lacks, same 24 box and 1.6 stroke. */
const M = ({ children, size = 20, className }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden focusable="false"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    className={cn('shrink-0', className)}>{children}</svg>
)
function MicMark(p) { return <M {...p}><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></M> }
function KeysMark(p) { return <M {...p}><rect x="3" y="6" width="18" height="12" rx="1.5"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10"/></M> }
function PinMark(p) { return <M {...p}><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/></M> }

/* The phone tab's drawing: one phone, the five sensors around it. */
function PhoneParts({ className }) {
  const parts = CATEGORIES.find(c => c.id === 'beyond').rows
  return (
    <figure className={cn('m-0 flex items-center justify-center gap-6', className)}>
      <svg viewBox="0 0 80 150" aria-hidden focusable="false" className="block h-40 w-auto shrink-0"
        fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="72" height="142" rx="12" className="text-rule" stroke="currentColor" strokeWidth="2"/>
        <circle cx="40" cy="16" r="4" className="text-accent" stroke="currentColor" strokeWidth="2"/>
        <path d="M32 136h16" className="text-accent" stroke="currentColor" strokeWidth="2"/>
        <rect x="14" y="30" width="52" height="94" rx="4" className="text-rule" stroke="currentColor" strokeWidth="1.6"/>
        <circle cx="40" cy="64" r="14" className="text-accent" stroke="currentColor" strokeWidth="2"
          strokeDasharray="66 22" transform="rotate(135 40 64)"/>
        <path d="M22 98h36M22 106h24" className="text-rule" stroke="currentColor" strokeWidth="2"/>
      </svg>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {parts.map(([k, , Icon]) => (
          <li key={k} className="flex items-center gap-2 text-ink">
            <Icon size={20} className="text-accent"/>
            <span className="text-ui font-semibold">{k}</span>
          </li>
        ))}
      </ul>
    </figure>
  )
}

/* A row: label, one line. Ruled, never boxed. */
/* `first`, not :first-child: each row sits in its own ScrollRow wrapper. */
function Row({ k, icon: Icon, dark, first, children }) {
  return (
    <div className={cn('grid gap-x-4 gap-y-0.5 border-t py-2', first && 'border-t-0 pt-0',
      'sm:grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)]', dark ? 'border-ink-3' : 'border-rule')}>
      <p className={cn('flex items-center gap-2 font-body text-ui font-semibold', dark ? 'text-paper' : 'text-ink')}>
        {Icon && <Icon size={18} className="text-accent"/>}{k}
      </p>
      <p className={cn('text-meta leading-[1.45]', dark ? 'text-mist' : 'text-ink-2')}>{children}</p>
    </div>
  )
}

/* The switcher. Five controls a reader presses, so rounded-field, body face,
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
      <TabsPrimitive.Root defaultValue={tabFromHash()}>

        {/* ── the opening band: title, one action, the switcher ── */}
        <section className="border-t border-rule bg-paper">
          <div className="wrap pb-5 pt-7 lg:pb-6 lg:pt-10">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div className="min-w-0">
                <h1 className="font-display font-bold text-major leading-[1.05] tracking-tight text-ink">
                  How MindMap works
                </h1>
                <p className="mt-2 max-w-[48ch] text-sec leading-[1.5] text-ink-2">
                  Every number is read against your own last two weeks, never anyone else's.
                </p>
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
          if (c.band) {
            const Band = c.band
            return (
              <TabsPrimitive.Content key={c.id} value={c.id} className="outline-none">
                <Band go={go}/>
              </TabsPrimitive.Content>
            )
          }
          const dark = c.tone === 'ink'
          const Figure = c.figure
          return (
            <TabsPrimitive.Content key={c.id} value={c.id} className="outline-none">
              <Section tone={c.tone} className={c.ground}>
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start lg:gap-10">
                  <div className="min-w-0">
                    <ScrollIn>
                      <SectionHead tone={c.tone} className="mt-0 max-w-[24ch]">{c.title}</SectionHead>
                      <p className={cn('mt-2 max-w-[48ch] text-sec leading-[1.5]',
                        dark ? 'text-mist' : 'text-ink-2')}>
                        {c.line}
                      </p>
                    </ScrollIn>
                    <div className="mt-4">
                      {c.rows.map(([k, line, icon], i) => (
                        <ScrollRow key={k} index={i}><Row k={k} icon={icon} dark={dark} first={i === 0}>{line}</Row></ScrollRow>
                      ))}
                    </div>
                    {c.close && (
                      <p className={cn('mt-4 max-w-[48ch] border-t pt-3 text-sec font-semibold leading-[1.5]',
                        dark ? 'border-ink-3 text-paper' : 'border-rule text-ink')}>
                        {c.close}
                      </p>
                    )}
                  </div>
                  <Parallax2D className="min-w-0 lg:pt-1" distance={36} scale={0.03}>
                    <Figure dark={dark}/>
                  </Parallax2D>
                </div>
              </Section>
            </TabsPrimitive.Content>
          )
        })}

      </TabsPrimitive.Root>
    </main>
  )
}
