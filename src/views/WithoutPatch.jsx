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

/* Taking a reading with nothing on your arm.
 *
 * Band ladder: accent-wash, card, aqua-2, paper, accent-wash. Four of the six
 * grounds spec 0d rule 1 leaves, alternating tinted and white so no two
 * neighbours read as one surface. `aqua-2` is not a Section tone, so it comes
 * in as a class and tailwind-merge drops the tone's own background.
 *
 * Capture instructions (which fingertip, resting on a table, a quiet room, a
 * sentence to say, what the score is measured against) live in PhoneCheck, at
 * the point of use. Do not duplicate them onto this page.
 *
 * Every figure here is 2D, so all use Parallax2D, never a 3D scene. Distances
 * are deliberately unequal (hero phone 64, camera module 30, route drawings 16)
 * because figures at one shared distance read as a rendering fault rather than
 * as depth.
 *
 * What changed on 13 October: the four retired hues came off (sky, sun, lilac
 * and the mist ground), the capsule eyebrow became a line of type, the dark
 * limits band became a near-white one, every frame went through ui/frame so a
 * photograph's focal point is read from lib/photos rather than guessed at the
 * call site, and no frame holding a face is under the 176px floor. */

const PANEL = 'rounded-panel border border-rule bg-card'

/* The three figures the hero states instead of a sentence. 45 is PPG_SECONDS
   plus VOICE_SECONDS, the scale is the site's one scale, and the third is the
   promise PhoneCheck keeps further down the page. */
const HERO_FACTS = [
  ['45', 'seconds, with camera and voice'],
  [SCORE_RANGE, SCORE],
  ['0', 'readings leave your phone'],
]

/* The bridge between a phone reading and a patch reading, which is the one
   thing about this page a reader cannot get from the drawing or from the
   coverage strip under it. What the camera reads, what it cannot, and the
   frame rate are all drawn below; do not restate them here. */
const CAMERA_FACTS = [
  ['Compared to', 'Your own history, not other students'],
  ['Scale', `The same ${SCORE} from the phone or the patch`],
]

const ROUTES = [
  { id:'sensors', title:'Read with the camera', when:'45 seconds', art:'sensors',
    gives:['Heart rate', 'Beat-to-beat', 'Voice'] },
  { id:'ask', title:`Answer ${ITEMS.length} questions`, when:'30 seconds', art:'ask',
    gives:['Tension', 'Sleep', 'Energy', 'Focus', 'Load'] },
]

/* Approved claim language; all three must stay. Do not reframe as trial-report
   columns (proved / not proved). This is a build. */
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

/* Figures as a row of fields inside the panel rather than as a row of cells.
   At 390 three cells stacked into three rows of their own cost this block
   about 140px of height for the same three numbers. Label beside the figure,
   never under it. rounded-field, not rounded-chip: the set is static and
   nobody acts on it, which is what spec 0c rule 3 asks for. */
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
              {/* An eyebrow is a line of type, per spec 0d rule 2. */}
              <p className="font-body text-ui font-semibold text-accent-ink">
                Without the patch
              </p>
              <h1 className="mt-2 max-w-[16ch] font-display font-bold text-major
                leading-[1.04] tracking-tight text-ink">
                A {SCORE} from your phone
              </h1>

              <div className={cn(PANEL, 'mt-3 max-w-[34rem] overflow-hidden border-l-[3px] border-l-accent')}>
                {/* The widest frame on the page, and the only one in the hero.
                    A licensed stock frame of models: nobody shown uses MindMap
                    and nobody is wearing a patch. 184px is the floor spec 0d
                    rule 4 puts under a frame holding a face; at 544px of panel
                    the 240px step keeps student-bus inside the 3.0 : 1 its two
                    subjects survive. */}
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
              {/* 64px travel = 32px either side, inside this band's padding, so
                  nothing reaches the edge and no layout shifts. */}
              <Parallax2D distance={64} className="shrink-0">
                <IPhone scale={0.44} label="The MindMap app running on a phone">
                  <PhoneApp/>
                </IPhone>
              </Parallax2D>
            </div>
          </div>
        </div>
      </header>

      {/* White ground: the figure's own mist bands vanish on a mist section. */}
      <Section tone="card" tight id="camera">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-4">
          <SectionHead>How the camera reads your pulse</SectionHead>
          {/* The reach of the phone, stated beside the heading rather than
              left for a reader to work out from the drawing. */}
          <ScrollIn className={cn(PANEL, 'self-end p-3.5')}>
            {CAMERA_FACTS.map(([k, v], i) => (
              <div key={k} className={cn('flex items-baseline gap-3 py-1.5',
                i && 'border-t border-rule')}>
                <span className="tick w-[4.2rem] shrink-0">{k}</span>
                <span className="min-w-0 flex-1 text-fine leading-[1.45] text-ink-2">{v}</span>
              </div>
            ))}
          </ScrollIn>
        </div>
        <ScrollIn className="mt-3 lg:mt-4">
          {/* The figure and the person it is about, inside one border. The
              frame is a full height column at lg and a wide band below it, so
              the same photograph is read at two quite different shapes. */}
          <div className={cn(PANEL, 'grid overflow-hidden border-l-[3px] border-l-accent',
            'lg:grid-cols-[minmax(0,1fr)_minmax(0,250px)]')}>
            <div className="min-w-0 p-3.5 lg:p-4">
              {/* ScrollIn owns the entrance, Parallax2D the drift, on separate
                  elements: both write `transform`, so nesting is required. */}
              <Parallax2D distance={30}>
                <CameraModule className="mx-auto max-w-[66rem]"/>
              </Parallax2D>
            </div>
            <div className="h-[200px] border-t border-rule sm:h-[260px] md:h-[340px]
              lg:h-auto lg:border-l lg:border-t-0">
              <Frame photo="student-homework" eager
                alt="A teenager in headphones leaning over an open notebook at a desk, a laptop and a pencil case beside them"/>
            </div>
          </div>
        </ScrollIn>
        <ScrollIn className="mt-3 lg:mt-4">
          <SignalCoverage/>
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
                  {/* 16px travel = 8px either side, inside this panel's 10px of
                      vertical padding, so the drawing stays within its ground. */}
                  {/* A ground step tells the two routes apart, since the two
                      hues that used to do it are retired. */}
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
                {/* Both labels must differ from the hero's "Take a reading":
                    duplicate names are one control to a screen reader. The
                    questions live inside the app, on a screen of their own, so
                    the intent is handed over and the app opens on it rather
                    than on its chooser. The sensor reading is on this page,
                    below, which is where that one goes. */}
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

      {/* tone="paper", not "card": PhoneCheck is white cards, which on a white
          band are just borders. paper is a 10% step from the aqua above; mist
          and both washes land within 6% and read as one surface. */}
      <Section tone="paper" tight id="take">
        <SectionHead>Take a reading now</SectionHead>
        <div className="mt-3 lg:mt-4"><PhoneCheck/></div>
      </Section>

      {/* A near-white ground, per spec 0c rule 1: no saturated or dark ground
          under a whole section. */}
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
