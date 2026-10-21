import React from 'react'
import { Frame } from '../ui/frame'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { ScrollRow } from '../ui/motion'
import { setReadingIntent } from './reading/intent'
import { ITEMS } from '../lib/engine'
import { FACE_SECONDS } from '../signals/face'

/* Taking a reading with nothing on your arm. Each card opens its reading in
   the app; capture instructions live there, at the point of use (PhoneCheck),
   and are not repeated here. Owner, 21 October: the "Take a reading now"
   block that sat under these cards was out of place, so it is gone. */

/* The owner, 18 October: the Mental Mirror first, then the camera pulse
   check, then the Survey. 45 is PPG_SECONDS plus VOICE_SECONDS. Each card
   takes its own light hue (owner, 20 October: less green, no topography).
   21 October: the band behind them is green, and no pink: the pulse card
   is mint, not coral. */
const ROUTES = [
  { id:'mirror', title:'Mental Mirror', when:`${FACE_SECONDS} seconds`, hue:'sky',
    line:"Google's MediaPipe Face Landmarker maps 478 points on your face." },
  { id:'sensors', title:'Camera pulse check', when:'45 seconds', hue:'mint',
    line:'Reads your pulse from skin colour.' },
  { id:'ask', title:'Survey', when:'About a minute', hue:'sun',
    line:`${ITEMS.length} questions on how you feel.` },
]

/* The camera check has no screen worth cropping before it starts, so a plain
   drawing: a fingertip over the lens, and the pulse it reads. */
function PulsePreview() {
  return (
    <svg viewBox="0 0 220 100" aria-hidden className="h-full w-auto">
      <rect x="8" y="14" width="72" height="72" rx="16" fill="#fff" stroke="#0d2b1e" strokeWidth="2"/>
      <circle cx="30" cy="36" r="10" fill="none" stroke="#426a58" strokeWidth="1.6"/>
      <circle cx="30" cy="64" r="10" fill="none" stroke="#426a58" strokeWidth="1.6"/>
      <circle cx="58" cy="36" r="5" fill="#426a58"/>
      <circle cx="44" cy="50" r="27" fill="#18a370" fillOpacity=".2" stroke="#067049" strokeWidth="2"/>
      <path d="M96 56h22l7-22 10 40 8-28 6 10h18l7-22 10 40 8-28 6 10h12" fill="none"
        stroke="#067049" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

/* Crops of the app's own screens (src/lib/photos.js), shown whole. */
const PREVIEW = {
  mirror: <Frame photo="ppage-mirror-ui" alt="The Mental Mirror screen: a mesh of points over a face."
    className="!h-full !w-auto rounded-field border border-rule object-contain"/>,
  sensors: <PulsePreview/>,
  ask: <Frame photo="ppage-survey-ui"
    alt="The first Survey question, How tense does your body feel right now, with answers 0 to 4."
    className="!h-full !w-auto rounded-field border border-rule object-contain"/>,
}

function Route({ r, i, go }) {
  const cta = r.id === 'ask'
    ? <Button variant="outline" size="sm"
        onClick={() => { setReadingIntent('survey'); go('check') }}>
        Start the Survey<span aria-hidden>→</span>
      </Button>
    : r.id === 'mirror'
    ? <Button variant="outline" size="sm" onClick={() => go('mirror')}>
        Open the Mirror<span aria-hidden>→</span>
      </Button>
    : <Button variant="outline" size="sm"
        onClick={() => { setReadingIntent('sensors'); go('check') }}>
        Check my pulse<span aria-hidden>→</span>
      </Button>
  return (
    <ScrollRow index={i} className="h-full">
      <Card variant="tint" hue={r.hue} className="flex h-full flex-col overflow-hidden">
        <div className="flex h-[140px] items-center justify-center bg-white/55 px-4 py-3 lg:h-[150px]">
          {PREVIEW[r.id]}
        </div>
        <div className="flex flex-1 flex-col p-3.5 lg:p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <h3 className="font-display text-row font-bold leading-tight text-ink">{r.title}</h3>
            <p className="font-body text-fine text-ink-2">{r.when}</p>
          </div>
          <p className="mt-1.5 text-fine text-ink-2">{r.line}</p>
          <div className="mt-auto pt-3.5">{cta}</div>
        </div>
      </Card>
    </ScrollRow>
  )
}

/* `as`: the hub (views/PatchHub) draws this inside its own <main>, under the
   part's title and its one line. */
export function WithoutPatch({ go, as: Root = 'main' }) {
  return (
    <Root>
      <header className="bg-accent-wash">
        <div className="wrap grid gap-3 pb-7 pt-4 sm:grid-cols-3 sm:auto-rows-fr lg:gap-4 lg:pb-10 lg:pt-6">
          {ROUTES.map((r, i) => <Route key={r.id} r={r} i={i} go={go}/>)}
        </div>
      </header>
    </Root>
  )
}
