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
import { SceneCard } from '../ui/scenes/SceneCard'
import { mirrorArt, pulseArt, surveyArt } from '../ui/scenes/art'

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

/* One of the three ways, as a lit scene card (owner, 18 October: the site
   should carry more of the Toolkit's depth; 19 October: light cards, not
   dark). Each takes its own tone and a small loop that shows what it reads. */
const ART = { mirror: [mirrorArt, 'mint', [0.62, 0.5]], sensors: [pulseArt, 'sky', [0.47, 0.3]],
  ask: [surveyArt, 'paper', [0.66, 0.55]] }

function Route({ r, i, go, toCheck }) {
  const [art, tone, light] = ART[r.art]
  const cta = r.id === 'ask'
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
      </Button>
  return (
    <ScrollRow index={i} className="h-full">
      <SceneCard tone={tone} art={art} w={240} h={110} sky={{ light, rings: 5, ringGap: 14 }}
        bandClass="h-[88px] sm:h-[112px]"
        title={r.title} meta={r.when} line={r.line} footer={cta}/>
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
