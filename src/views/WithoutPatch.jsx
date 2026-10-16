import React from 'react'
import { Frame } from '../ui/frame'
import { Button } from '../ui/button'
import { Section, SectionHead } from '../ui/section'
import { IPhone } from '../ui/iphone'
import { PhoneApp } from '../ui/phone-app'
import { Parallax2D, ScrollIn, ScrollRow } from '../ui/motion'
import { CameraModule, SignalCoverage } from '../charts/camera'
import { PhoneCheck } from './PhoneCheck'
import { setReadingIntent } from './reading/intent'
import { ITEMS } from '../lib/engine'
import { SCORE, SCORE_RANGE } from '../lib/terms'
import { cn } from '../lib/utils'

/* Taking a reading with nothing on your arm. Capture instructions live in
   PhoneCheck, at the point of use; do not duplicate them here. Every figure
   is 2D, so Parallax2D only, at unequal distances. */

const PANEL = 'rounded-panel border border-rule bg-card'

/* 45 is PPG_SECONDS plus VOICE_SECONDS. */
const HERO_FACTS = [
  ['45', 'seconds, with camera and voice'],
  [SCORE_RANGE, SCORE],
  ['0', 'readings leave your phone'],
]

const ROUTES = [
  { id:'sensors', title:'Read with the camera', when:'45 seconds', art:'sensors',
    gives:['Heart rate', 'Beat-to-beat', 'Voice'] },
  { id:'ask', title:`Answer ${ITEMS.length} questions`, when:'30 seconds', art:'ask',
    gives:['Tension', 'Sleep', 'Energy', 'Focus', 'Load'] },
]

/* Approved claim language; all three stay verbatim. */
const LIMITS = [
  ['Heart rate', 'The heart rate comes within half a beat per minute of a known signal.'],
  ['Beat-to-beat index',
   'The beat-to-beat figure is our own index, not a clinical RMSSD. The app holds it back when the signal is noisy.'],
  ['Testing so far', 'No reading has been tested on a person yet. Every figure on this page is generated.'],
]

function RouteArt({ kind }) {
  if (kind === 'sensors') return (
    <svg viewBox="0 0 200 74" aria-hidden className="h-14 w-[12rem]">
      <rect x="14" y="4" width="52" height="66" rx="13" className="fill-aqua-2 stroke-ink" strokeWidth="1.6"/>
      <rect x="24" y="12" width="30" height="30" rx="9" className="fill-card stroke-ink-3" strokeWidth="1.3"/>
      <circle cx="33" cy="21" r="5" className="fill-none stroke-ink-3" strokeWidth="1.3"/>
      <circle cx="45" cy="33" r="5" className="fill-none stroke-ink-3" strokeWidth="1.3"/>
      <circle cx="45" cy="21" r="3" className="fill-accent"/>
      <ellipse cx="39" cy="27" rx="19" ry="15" className="fill-accent-wash stroke-ink" strokeWidth="1.8" opacity="0.9"/>
      <path d="M92 38h16M100 30v16" className="stroke-ruling" strokeWidth="1.6" strokeLinecap="round"/>
      <rect x="132" y="8" width="20" height="34" rx="10" className="fill-card stroke-ink" strokeWidth="1.6"/>
      <path d="M124 36a18 18 0 0 0 36 0M142 54v10M132 64h20" className="fill-none stroke-ink" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M168 18c5 6 5 14 0 20M178 12c9 10 9 22 0 32" className="fill-none stroke-beam" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
  return (
    <svg viewBox="0 0 200 74" aria-hidden className="h-14 w-[12rem]">
      {[0, 1, 2].map(i => (
        <rect key={i} x={16 + i * 9} y={2 + i * 7} width="116" height="52" rx="8"
          className={i === 2 ? 'fill-card stroke-ink' : 'fill-aqua-2 stroke-ruling'} strokeWidth="1.5"/>
      ))}
      <path d="M46 29h48M46 43h58M46 57h38" className="stroke-ink-3" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="128" cy="29" r="6" className="fill-none stroke-ruling" strokeWidth="1.6"/>
      <circle cx="128" cy="57" r="6" className="fill-none stroke-ruling" strokeWidth="1.6"/>
      <circle cx="128" cy="43" r="9" className="fill-accent-wash stroke-accent" strokeWidth="1.8"/>
      <path d="M123.5 43l3 3.5 6-7" className="fill-none stroke-accent" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function Figures({ items, className }) {
  return (
    <ul className={cn('m-0 flex list-none flex-wrap gap-1.5 p-0', className)}>
      {items.map(([value, label]) => (
        <li key={label} className="inline-flex items-baseline gap-1.5 rounded-field border
          border-rule bg-paper px-2.5 py-1">
          <span className="text-ui font-bold tabular-nums leading-none text-accent">
            {value}
          </span>
          <span className="text-fine leading-none text-ink-2">{label}</span>
        </li>
      ))}
    </ul>
  )
}

export function WithoutPatch({ go }) {
  const toCheck = () => document.getElementById('take')?.scrollIntoView({ behavior:'smooth', block:'start' })

  return (
    <main>
      <header className="border-t border-rule bg-accent-wash">
        <div className="wrap py-7 lg:py-10">
          <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-4">
            <div>
              <p className="font-body text-ui font-semibold text-accent-ink">
                Without the patch
              </p>
              <h1 className="mt-2 max-w-[16ch] font-display font-bold text-major
                leading-[1.04] tracking-tight text-ink">
                A {SCORE} from your phone
              </h1>

              <div className={cn(PANEL, 'mt-3 max-w-[34rem] overflow-hidden border-l-[3px] border-l-accent')}>
                {/* A licensed stock frame of models: nobody shown uses MindMap. */}
                <div className="h-[184px] border-b border-rule sm:h-[240px]">
                  <Frame photo="student-bus" eager
                    alt="Two boys laughing together on a school bus seat, one holding a phone"/>
                </div>
                <div className="p-3.5">
                  <p className="text-meta leading-[1.4] text-ink-2">
                    Take a reading with the phone you already have.
                  </p>
                  <Figures items={HERO_FACTS} className="mt-2.5"/>
                </div>
              </div>
              <div className="mt-3">
                <Button onClick={toCheck}>Take a reading<span aria-hidden>→</span></Button>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <Parallax2D distance={64} className="shrink-0">
                <IPhone scale={0.44} label="The MindMap app running on a phone">
                  <PhoneApp/>
                </IPhone>
              </Parallax2D>
            </div>
          </div>
        </div>
      </header>

      <Section tone="card" tight id="camera">
        <SectionHead>How the camera reads your pulse</SectionHead>
        <ScrollIn className="mt-3 lg:mt-4">
          <div className={cn(PANEL, 'overflow-hidden border-l-[3px] border-l-accent p-3.5 lg:p-4')}>
            <Parallax2D distance={30}>
              <CameraModule className="mx-auto max-w-[66rem]"/>
            </Parallax2D>
            <SignalCoverage className="mt-4 border-t border-rule pt-4"/>
          </div>
        </ScrollIn>
      </Section>

      <Section tone="paper" tight className="bg-aqua-2">
        <SectionHead>Two ways to take a reading</SectionHead>
        <div className="mt-3 grid gap-3 lg:auto-rows-fr lg:grid-cols-2 lg:gap-4">
          {ROUTES.map((r, i) => (
            <ScrollRow key={r.id} index={i} className="h-full">
              <div className={cn(PANEL, 'flex h-full flex-col border-l-[3px] border-l-accent',
                'p-4 lg:p-5')}>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                  <div className={cn('w-fit rounded-panel px-3 py-2',
                    i ? 'bg-aqua' : 'bg-accent-wash')}>
                    <Parallax2D distance={16}>
                      <RouteArt kind={r.art}/>
                    </Parallax2D>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-row font-bold leading-tight text-ink">{r.title}</h3>
                    <p className="mt-0.5 text-fine font-semibold tabular-nums text-ink-3">
                      {r.when}</p>
                  </div>
                </div>
                <ul className="m-0 mt-3 flex list-none flex-wrap gap-1.5 border-t border-rule p-0 pt-3">
                  {r.gives.map(g => (
                    <li key={g}
                      className="rounded-field border border-rule bg-paper px-2.5 py-1 text-fine
                        leading-none text-ink-2">
                      {g}
                    </li>
                  ))}
                </ul>
                {/* Labels differ from the hero's "Take a reading": duplicate
                    names are one control to a screen reader. */}
                <div className="mt-auto pt-3">
                  {r.id === 'ask'
                    ? <Button variant="outline" size="sm"
                        onClick={() => { setReadingIntent('survey'); go('check') }}>
                        Start the questions<span aria-hidden>→</span>
                      </Button>
                    : <Button variant="outline" size="sm" onClick={toCheck}>
                        Go to the camera reading<span aria-hidden>→</span>
                      </Button>}
                </div>
              </div>
            </ScrollRow>
          ))}
        </div>
      </Section>

      <Section tone="paper" tight id="take">
        <SectionHead>Take a reading now</SectionHead>
        <div className="mt-3 lg:mt-4"><PhoneCheck/></div>
      </Section>

      <Section tone="paper" tight className="bg-accent-wash">
        <SectionHead>What has been tested so far</SectionHead>
        <div className="mt-3 grid gap-3 lg:auto-rows-fr lg:grid-cols-3 lg:gap-4">
          {LIMITS.map(([k, v], i) => (
            <ScrollRow key={k} index={i} className="h-full">
              <div className={cn(PANEL, 'h-full p-3.5')}>
                <p className="font-display text-ui font-bold text-accent-ink">{k}</p>
                <p className="mt-1.5 max-w-[40ch] text-meta leading-[1.4] text-ink-2">{v}</p>
              </div>
            </ScrollRow>
          ))}
        </div>
      </Section>
    </main>
  )
}
