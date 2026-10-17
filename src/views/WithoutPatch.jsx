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
import { cardClass } from '../ui/card'

/* Taking a reading with nothing on your arm. Capture instructions live in
   PhoneCheck, at the point of use; do not duplicate them here. Every figure
   is 2D, so Parallax2D only, at unequal distances. */

const PANEL = 'rounded-panel border border-rule bg-card'

/* 45 is PPG_SECONDS plus VOICE_SECONDS. */
const HERO_FACTS = [
  ['45', 'seconds, with camera and voice'],
  [SCORE_RANGE, SCORE],
  ['0', 'camera frames kept'],
]

const ROUTES = [
  { id:'sensors', title:'Read with the camera', when:'45 seconds', art:'sensors',
    gives:['Heart rate', 'Beat-to-beat', 'Voice'] },
  { id:'ask', title:`Answer ${ITEMS.length} questions`, when:'About a minute', art:'ask',
    gives:['Tension', 'Sleep', 'Energy', 'Focus', 'Load'] },
]

function RouteArt({ kind }) {
  if (kind === 'sensors') return (
    <svg viewBox="0 0 200 74" aria-hidden className="h-10 w-[8.6rem] sm:h-14 sm:w-[12rem]">
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
    <svg viewBox="0 0 200 74" aria-hidden className="h-10 w-[8.6rem] sm:h-14 sm:w-[12rem]">
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

/* The site sets scroll-behavior: smooth on <html>, so the route change's
   window.scrollTo(0, 0) animates up from the overview's depth, and this page,
   being shorter, first clamps that to its own bottom. A phone can stop the
   animation there. Arriving jumps to the top at once instead. */
function useArriveAtTop() {
  React.useLayoutEffect(() => {
    const html = document.documentElement
    const was = html.style.scrollBehavior
    html.style.scrollBehavior = 'auto'
    try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }) } catch { window.scrollTo(0, 0) }
    const id = requestAnimationFrame(() => { html.style.scrollBehavior = was })
    return () => { cancelAnimationFrame(id); html.style.scrollBehavior = was }
  }, [])
}

/* One of the two ways, sized for the hero. */
function Route({ r, i, go, toCheck }) {
  return (
    <ScrollRow index={i} className="h-full">
      {/* The camera way is the white card; the questions take the turquoise
          wash (src/ui/card.jsx), so the pair reads as two choices. */}
      <div className={cn(i ? cardClass('tint', 'beam') : PANEL, 'flex h-full flex-col border-l-[3px] p-3.5 lg:p-4',
        i ? 'border-l-beam' : 'border-l-accent')}>
        {/* Art beside the title on a phone, above it once the cards pair up. */}
        <div className="flex items-center gap-3 sm:block">
          <div className={cn('w-fit shrink-0 rounded-panel px-2 py-1.5 sm:px-3 sm:py-2',
            i ? 'bg-card' : 'bg-accent-wash')}>
            <RouteArt kind={r.art}/>
          </div>
          <div className="min-w-0 sm:mt-3">
            <h3 className="font-display text-row font-bold leading-tight text-ink">{r.title}</h3>
            <p className="mt-0.5 text-fine font-semibold tabular-nums text-ink-3">{r.when}</p>
          </div>
        </div>
        <ul className={cn('m-0 mt-2.5 flex list-none flex-wrap gap-1.5 border-t p-0 pt-2.5',
          i ? 'border-beam/25' : 'border-rule')}>
          {r.gives.map(g => (
            <li key={g}
              className="rounded-field border border-rule bg-paper px-2.5 py-1 text-fine
                leading-none text-ink-2">
              {g}
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-3">
          {r.id === 'ask'
            ? <Button variant="outline" size="sm"
                onClick={() => { setReadingIntent('survey'); go('check') }}>
                Start the questions<span aria-hidden>→</span>
              </Button>
            : <Button variant="outline" size="sm" onClick={toCheck}>
                Use the camera<span aria-hidden>→</span>
              </Button>}
        </div>
      </div>
    </ScrollRow>
  )
}

export function WithoutPatch({ go }) {
  useArriveAtTop()
  const toCheck = () => document.getElementById('take')?.scrollIntoView({ behavior:'smooth', block:'start' })

  return (
    <main>
      <header className="border-t border-rule bg-accent-wash">
        <div className="wrap grid gap-5 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:items-center
          lg:gap-8 lg:py-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,31rem)]">
          <div className="min-w-0">
            <p className="font-body text-ui font-semibold text-accent-ink">
              Without the patch
            </p>
            <h1 className="mt-2 max-w-[18ch] font-display font-bold text-major
              leading-[1.04] tracking-tight text-ink">
              A {SCORE} from your phone
            </h1>
            <p className="mt-2.5 text-meta leading-[1.4] text-ink-2">
              Use the phone you already have.
            </p>
            <Figures items={HERO_FACTS} className="mt-2.5"/>

            <h2 className="mt-5 font-display text-head font-bold leading-tight text-ink lg:mt-6">
              Two ways to take a reading
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 sm:auto-rows-fr">
              {ROUTES.map((r, i) => <Route key={r.id} r={r} i={i} go={go} toCheck={toCheck}/>)}
            </div>
          </div>

          {/* The phone on a faded photograph, so the space beside it is
              picture rather than blank. A licensed stock frame of models:
              nobody shown uses MindMap. */}
          <div className="relative isolate flex justify-center overflow-hidden rounded-panel border
            border-rule bg-accent-wash px-4 py-5 lg:py-7">
            <Frame wash photo="student-bus" className="absolute inset-0 -z-10 opacity-60"/>
            <IPhone scale={0.54} label="The MindMap app running on a phone" className="shrink-0 lg:hidden">
              <PhoneApp/>
            </IPhone>
            <IPhone scale={0.62} label="The MindMap app running on a phone" className="hidden shrink-0 lg:block">
              <PhoneApp/>
            </IPhone>
          </div>
        </div>
      </header>

      <Section tone="card" tight id="camera">
        <SectionHead>Your pulse, from the phone camera</SectionHead>
        <ScrollIn className="mt-3 lg:mt-4">
          <div className={cn(PANEL, 'overflow-hidden border-l-[3px] border-l-accent p-3.5 lg:p-4')}>
            <Parallax2D distance={30}>
              <CameraModule className="mx-auto max-w-[66rem]"/>
            </Parallax2D>
            <SignalCoverage className="mt-4 border-t border-rule pt-4"/>
          </div>
        </ScrollIn>
      </Section>

      <Section tone="paper" tight id="take">
        <SectionHead>Take a reading now</SectionHead>
        <div className="mt-3 lg:mt-4"><PhoneCheck/></div>
      </Section>
    </main>
  )
}
