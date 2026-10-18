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
import { FACE_SECONDS } from '../signals/face'
import { cn } from '../lib/utils'

/* Taking a reading with nothing on your arm. Capture instructions live in
   PhoneCheck, at the point of use; do not duplicate them here. Every figure
   is 2D, so Parallax2D only, at unequal distances. */

const PANEL = 'rounded-panel border border-rule bg-card'

/* The owner, 18 October: the Mental Mirror first, then the camera pulse
   check, then the Survey. 45 is PPG_SECONDS plus VOICE_SECONDS. */
const ROUTES = [
  { id:'mirror', title:'Mental Mirror', when:`${FACE_SECONDS} seconds`, art:'mirror',
    line:"Google's MediaPipe Face Landmarker maps 478 points on your face." },
  { id:'sensors', title:'Camera pulse check', when:'45 seconds', art:'sensors',
    line:'Reads your pulse from skin colour.' },
  { id:'ask', title:'Survey', when:'About a minute', art:'ask',
    line:`${ITEMS.length} questions on how you feel.` },
]

function RouteArt({ kind }) {
  /* A face with the landmark mesh over it, as the mirror draws it. */
  if (kind === 'mirror') return (
    <svg viewBox="0 0 200 74" aria-hidden className="h-10 w-[8.6rem] sm:h-12 sm:w-[10rem]">
      <rect x="62" y="2" width="76" height="70" rx="12" className="fill-ink"/>
      <ellipse cx="100" cy="38" rx="21" ry="27" className="fill-none stroke-beam" strokeWidth="1.6"/>
      <path d="M86 30q5-4 10 0M104 30q5-4 10 0" className="fill-none stroke-accent-lit" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M87 36h8M105 36h8M93 52q7 4 14 0" className="fill-none stroke-accent-lit" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M79 38 100 12 121 38 100 64Z M100 12v52 M79 38h42" className="fill-none stroke-beam" strokeWidth="0.7" opacity="0.7"/>
      <path d="M22 38h14l4-8 5 16 4-8h12" className="fill-none stroke-coral" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="166" cy="38" r="16" className="fill-accent-wash stroke-accent" strokeWidth="1.6"/>
      <path d="M158 40a8 8 0 0 1 16 0" className="fill-none stroke-accent" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
  if (kind === 'sensors') return (
    <svg viewBox="0 0 200 74" aria-hidden className="h-10 w-[8.6rem] sm:h-12 sm:w-[10rem]">
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
    <svg viewBox="0 0 200 74" aria-hidden className="h-10 w-[8.6rem] sm:h-12 sm:w-[10rem]">
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

/* One of the three ways. All three take the same white card. */
function Route({ r, i, go, toCheck }) {
  return (
    <ScrollRow index={i} className="h-full">
      <div className={cn(PANEL, 'flex h-full flex-col p-3.5 lg:p-4')}>
        {/* Art beside the title on a phone, above it once the cards pair up. */}
        <div className="flex items-center gap-3 sm:block">
          <div className="w-fit shrink-0 rounded-panel bg-accent-wash px-2 py-1.5 sm:px-2 sm:py-2">
            <RouteArt kind={r.art}/>
          </div>
          <div className="min-w-0 sm:mt-3">
            <h3 className="font-display text-row font-bold leading-tight text-ink">{r.title}</h3>
            <p className="mt-0.5 text-fine font-semibold tabular-nums text-ink-3">{r.when}</p>
          </div>
        </div>
        <p className="mt-2.5 border-t border-rule pt-2.5 text-fine text-ink-2">{r.line}</p>
        <div className="mt-auto pt-3">
          {r.id === 'ask'
            ? <Button variant="outline" size="sm"
                onClick={() => { setReadingIntent('survey'); go('check') }}>
                Start the Survey<span aria-hidden>→</span>
              </Button>
            : r.id === 'mirror'
            ? <Button variant="outline" size="sm" onClick={() => go('mirror')}>
                Open the Mirror<span aria-hidden>→</span>
              </Button>
            : <Button variant="outline" size="sm" onClick={toCheck}>
                Check my pulse<span aria-hidden>→</span>
              </Button>}
        </div>
      </div>
    </ScrollRow>
  )
}

/* `as`: the hub (views/PatchHub) draws this inside its own <main>, under the
   part's title. */
export function WithoutPatch({ go, as: Root = 'main' }) {
  const toCheck = () => document.getElementById('take')?.scrollIntoView({ behavior:'smooth', block:'start' })

  return (
    <Root>
      <header className="bg-accent-wash">
        <div className="wrap grid gap-5 pb-6 pt-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-center
          lg:gap-8 lg:pb-8 lg:pt-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
          <div className="min-w-0">
            <div className="grid gap-3 sm:grid-cols-3 sm:auto-rows-fr">
              {ROUTES.map((r, i) => <Route key={r.id} r={r} i={i} go={go} toCheck={toCheck}/>)}
            </div>
          </div>

          {/* The phone on a faded photograph, so the space beside it is
              picture rather than blank. A licensed stock frame of models:
              nobody shown uses MindMap. */}
          <div className="relative isolate flex justify-center overflow-hidden rounded-panel border
            border-rule bg-accent-wash px-4 py-5">
            <Frame wash photo="student-bus" className="absolute inset-0 -z-10 opacity-60"/>
            <IPhone scale={0.54} label="The MindMap app running on a phone" className="shrink-0 lg:hidden">
              <PhoneApp/>
            </IPhone>
            <IPhone scale={0.46} label="The MindMap app running on a phone" className="hidden shrink-0 lg:block">
              <PhoneApp/>
            </IPhone>
          </div>
        </div>
      </header>

      <Section tone="card" tight id="camera" className="scroll-mt-[7.5rem]">
        <SectionHead>How the camera pulse check works</SectionHead>
        <ScrollIn className="mt-3 lg:mt-4">
          <div className={cn(PANEL, 'overflow-hidden border-l-[3px] border-l-accent p-3.5 lg:p-4')}>
            <Parallax2D distance={30}>
              <CameraModule className="mx-auto max-w-[66rem]"/>
            </Parallax2D>
            <SignalCoverage className="mt-4 border-t border-rule pt-4"/>
          </div>
        </ScrollIn>
      </Section>

      <Section tone="paper" tight id="take" className="scroll-mt-[7.5rem]">
        <SectionHead>Take a reading now</SectionHead>
        <div className="mt-3 lg:mt-4"><PhoneCheck/></div>
      </Section>
    </Root>
  )
}
