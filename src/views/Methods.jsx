import React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { Camera, MoveMark } from '../ui/marks'
import { FrameworkGlow, NetworkGlow } from './methods/TechFigures'
import { TechBand, TechTitle, Glass, IsoPlate, Topo } from '../ui/tech'
import { CONTEXT_WINDOWS, PARAM_COUNT } from '../signals/tnam'
import { TNAM_RESULTS as R } from '../signals/tnam-results'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { SCORE, PRO_PLURAL_LC } from '../lib/terms'
import { cn } from '../lib/utils'
import { Parallax2D, ScrollIn, ScrollRow } from '../ui/motion'
import { ToolkitBand } from './methods/ToolkitBand'
import { MirrorDemo } from './methods/MirrorDemo'

/* How it works, one category at a time.
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
 * model".
 *
 * 19 October (later), the owner: "some of the words under how it works are
 * too little, needs some more explanation". Each tab gets `explain`: one plain
 * sentence (trimmed the same day: "wayy too much text") on how the part works and why it is there, every
 * fact taken from the code or docs/. And: "stop making things dark, site
 * should be more peaceful and light ... keep adding the topographic,
 * isometric, and technological designs". Every tab now sits on the light
 * tech ground (ui/tech TechBand: grid, contours, blooms); nothing on this
 * page is dark. */

const HOP_S = 30
const MEMORY_MIN = (CONTEXT_WINDOWS * HOP_S) / 60
const SUBJECTS = R.per_subject.length
const WINS = R.paired.wins
const SIGNAL_NAMES = SENSOR_ORDER.map(id => SENSORS[id].name.toLowerCase())

/* ── the categories ──────────────────────────────────────────────────────
   Every band is on the light tech ground (ui/tech); `tech` is the second
   bloom's hue. 18 October, the owner: "Especially for the AI and ML,
   implement the cool discord style design strats at a technical cool level
   ... different from toolkit". `plain` keeps a tab's facts as ruled rows
   with icons instead of glass cards.
   `still` skips the parallax: the patch render and the Mirror demo hold
   their place. 18 October, the owner: "remove app and site from how it
   works", so that tab is gone. */
const CATEGORIES = [
  { id: 'hardware', tab: 'The patch', tech: 'mint', plain: true, still: true,
    title: 'What the patch measures',
    line: 'The patch sends four body signals to your phone, where each is compared with your own normal.',
    explain: 'Stress shows up in small body changes, and the patch reads them every second.',
    rows: [
      ['Measures', `${SENSORS[SENSOR_ORDER[0]].name}, ${SIGNAL_NAMES[1]}, skin ${SIGNAL_NAMES[2]} and ${SIGNAL_NAMES[3]}, once a second.`],
      ['Sits', 'On your upper arm, inside a small printed shell.'],
      ['Connects', 'To your phone over Bluetooth, with no wires.'],
    ],
    close: 'MindMap also works without the patch, with readings from the phone camera pulse and the survey.',
    figure: PatchRender },
  /* "Add Mental Mirror as a whole new feature on the how it works complete
     with a video demo" (18 October). Facts from docs/mental-mirror.md. */
  { id: 'mirror', tab: 'Mental Mirror', tech: 'mint', still: true,
    title: 'Mental Mirror',
    line: "Google's MediaPipe Face Landmarker maps 478 points on your face, frame by frame.",
    explain: 'One 30 second reading with the front camera, compared with your own earlier readings.',
    close: `It gives a ${SCORE} without the patch. No picture is kept.`,
    figure: MirrorDemo },
  { id: 'ai', tab: 'MindMap AI', tech: 'vio',
    title: 'Plain answers to your questions',
    line: 'Ask when a reading or a hard week needs explaining.',
    explain: 'A chat built on a language model that follows one written set of rules, with its sources listed.',
    rows: [
      ['Answers', `Stress, sleep, school and the ${SCORE}.`],
      ['Follows', 'Guidance from SAMHSA, NIMH, AAP and CDC.'],
      ['Speaks to', `Teens, parents and ${PRO_PLURAL_LC}, each in their own voice.`],
      ['Never', 'Diagnoses, scores severity or names a medication.'],
      ['In a crisis', 'A crisis line comes before anything else.'],
    ],
    figure: FrameworkGlow },
  { id: 'ml', tab: 'Machine Learning', tech: 'mint',
    title: 'A novel neural network',
    line: `It turns four body signals into one ${SCORE}, so you can see when a day sits above your own normal.`,
    explain: `Each signal gets its own learned curve, and the curves add up, so every score shows what moved it.`,
    rows: [
      ['Size', `${PARAM_COUNT.toLocaleString('en-US')} parameters, small enough to run on the phone.`],
      ['Tested on', `${SUBJECTS + R.transfer.subjects} adults in two public lab datasets, and ${R.exams.spearman_flagged_vs_grade.n} real exam sessions.`],
      ['Against the old formula', `Reads stress better than the hand-set formula it replaced for ${WINS} of ${SUBJECTS} people. Ties the other ${SUBJECTS - WINS}.`],
      ['Accuracy', `Tells a stressful minute from a calm one ${Math.round(R.summary.tnam.bacc.mean * 100)} times in 100.`],
      ['Quiet when calm', `Flags ${Math.round(R.summary.tnam.meditation_false_alarm * 100)} in 100 meditation minutes. The formula flags ${Math.round(R.summary.formula.meditation_false_alarm * 100)}.`],
      ['Made for', 'Stress, not sadness. A sad film does not move the score.'],
      ['More', 'Full figures are in the repository, under docs.'],
    ],
    figure: NetworkGlow },
  { id: 'beyond', tab: 'Phone sensors', tech: 'mint', plain: true,
    title: 'What your phone adds',
    line: 'Sensors you already carry, used only inside MindMap.',
    explain: 'They give a reading when the patch is off and run some Toolkit activities.',
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

/* The patch tab's picture: the real CAD model (the one in the 3D viewer on
   the patch page) rendered face up from public/di/arena, revision DI-03,
   with the engraved logo and wordmark on top. A still image, outlined in the
   accent so the pale shell reads on paper, standing on an isometric plate. */
function PatchRender({ className }) {
  return (
    <figure className={cn('relative m-0 flex justify-center pb-14', className)}>
      <IsoPlate className="absolute bottom-0 left-1/2 w-[300px] max-w-full -translate-x-1/2 lg:w-[340px]"/>
      <img src={`${import.meta.env.BASE_URL}patch-front-cad.png`} width={605} height={871}
        alt="The MindMap patch CAD model, face up, with the MindMap logo engraved on top."
        className="relative block h-auto w-[200px] lg:w-[240px]" decoding="async"/>
    </figure>
  )
}

/* The phone tab's drawing: one phone on an isometric plate, the five
   sensors beside it. */
function PhoneParts({ className }) {
  const parts = CATEGORIES.find(c => c.id === 'beyond').rows
  return (
    <figure className={cn('m-0 flex items-center justify-center gap-6', className)}>
      <div className="relative shrink-0 pb-9">
        <IsoPlate n={4} className="absolute bottom-0 left-1/2 w-[150px] -translate-x-1/2"/>
      <svg viewBox="0 0 80 150" aria-hidden focusable="false"
        className="relative block h-40 w-auto drop-shadow-[0_0_12px_rgba(62,207,154,.45)]"
        fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="72" height="142" rx="12" fill="#ffffff" stroke="#8fb3a2" strokeWidth="2"/>
        <circle cx="40" cy="16" r="4" className="text-accent" stroke="currentColor" strokeWidth="2"/>
        <path d="M32 136h16" className="text-accent" stroke="currentColor" strokeWidth="2"/>
        <rect x="14" y="30" width="52" height="94" rx="4" className="text-rule" stroke="currentColor" strokeWidth="1.6"/>
        <circle cx="40" cy="64" r="14" className="text-accent" stroke="currentColor" strokeWidth="2"
          strokeDasharray="66 22" transform="rotate(135 40 64)"/>
        <path d="M22 98h36M22 106h24" className="text-rule" stroke="currentColor" strokeWidth="2"/>
      </svg>
      </div>
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
function Row({ k, icon: Icon, first, children }) {
  return (
    <div className={cn('grid gap-x-4 gap-y-0.5 border-t border-rule py-2', first && 'border-t-0 pt-0',
      'sm:grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)]')}>
      <p className="flex items-center gap-2 font-body text-ui font-semibold text-ink">
        {Icon && <Icon size={18} className="text-accent"/>}{k}
      </p>
      <p className="text-meta leading-[1.45] text-ink-2">{children}</p>
    </div>
  )
}

/* A fact on the tech ground: a glass card, the label in mono. The crisis row
   gets the warm edge so it is the first card the eye finds. */
function Fact({ k, children }) {
  const crisis = k === 'In a crisis'
  return (
    <Glass tone={crisis ? 'coral' : 'quiet'} className="h-full px-4 py-3">
      <p className={cn('t-mono text-[0.8125rem] font-semibold leading-tight',
        crisis ? 'text-[#b23009]' : 'text-[#0f5836]')}>{k}</p>
      <p className="mt-1.5 text-ui leading-[1.45] text-[#0d2b1e]">{children}</p>
    </Glass>
  )
}

/* A category on the tech ground. */
function TechCategory({ c }) {
  const Figure = c.figure
  const odd = c.rows && c.rows.length % 2 === 1
  return (
    <TechBand hue={c.tech}>
      {/* Heading, drawing, facts on a phone; facts beside the drawing from lg. */}
      <div className="grid gap-x-10 gap-y-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:grid-rows-[auto_1fr] lg:items-start">
        <ScrollIn className="min-w-0 lg:col-start-1 lg:row-start-1">
          <TechTitle className="max-w-[24ch] text-sub leading-[1.12]">{c.title}</TechTitle>
          <p className="mt-2.5 max-w-[48ch] text-sec leading-[1.5] text-[#2a5744]">{c.line}</p>
          {c.explain && <p className="mt-3 max-w-[52ch] text-sec leading-[1.5] text-[#0d2b1e]">{c.explain}</p>}
        </ScrollIn>
        {c.still
          ? <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pt-1"><Figure/></div>
          : <Parallax2D className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pt-1" distance={36} scale={0.03}><Figure/></Parallax2D>}
        {(c.rows || c.close) && (
          <div className="min-w-0 lg:col-start-1 lg:row-start-2 lg:-mt-2">
            {c.rows && c.plain && (
              <div className="max-w-[40rem]">
                {c.rows.map(([k, line, icon], i) => (
                  <ScrollRow key={k} index={i}><Row k={k} icon={icon} first={i === 0}>{line}</Row></ScrollRow>
                ))}
              </div>
            )}
            {c.rows && !c.plain && (
              <ul className="m-0 grid list-none gap-2.5 p-0 sm:grid-cols-2">
                {c.rows.map(([k, line], i) => (
                  <ScrollRow as="li" key={k} index={i}
                    className={cn(odd && i === c.rows.length - 1 && 'sm:col-span-2')}>
                    <Fact k={k}>{line}</Fact>
                  </ScrollRow>
                ))}
              </ul>
            )}
            {c.close && (
              <p className={cn('max-w-[48ch] border-t border-rule pt-3.5 text-sec font-semibold leading-[1.5] text-[#0d2b1e]',
                c.rows && 'mt-5')}>
                {c.close}
              </p>
            )}
          </div>
        )}
      </div>
    </TechBand>
  )
}

/* The switcher. Six controls a reader presses, so rounded-field, body face,
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
        <section className="relative isolate overflow-hidden border-t border-rule bg-paper">
          <Topo seed={3.4} className="t-topo -right-56 -top-72 size-[44rem] text-[#157446]"/>
          <div className="wrap pb-5 pt-7 lg:pb-6 lg:pt-10">
            <div className="min-w-0">
              <h1 className="font-display font-bold text-major leading-[1.05] tracking-tight text-ink">
                How MindMap works
              </h1>
              <p className="mt-2 max-w-[48ch] text-sec leading-[1.5] text-ink-2">
                Every number is read against your own last two weeks, never anyone else's.
              </p>
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
          return (
            <TabsPrimitive.Content key={c.id} value={c.id} className="outline-none">
              <TechCategory c={c}/>
            </TabsPrimitive.Content>
          )
        })}

      </TabsPrimitive.Root>
    </main>
  )
}
