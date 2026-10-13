import React from 'react'
import { PHOTOS } from '../lib/photos'
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
 * Band luminance ladder: mist, white, aqua-2, white, ink. 20%, 15% and 15%
 * apart, and then the dark one. Keep adjacent bands this far apart; accent-wash
 * and beam-wash sit 3% apart and read as one surface. `aqua-2` is not a Section
 * tone, so it comes in as a class and tailwind-merge drops the tone's own
 * background. `tone` is still passed because it sets the eyebrow and heading
 * colours, which must stay ink-side.
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
 * What changed in this pass: the hero set its lede, its figures and its button
 * straight on the mist band, which section 2 of the spec rules out, and spent
 * a line of prose on two numbers. Both are in one readout panel now, with the
 * figures as figures. Every band is at least two columns from 1280 up, and the
 * dark band's three limits are in containers rather than under hairlines. */

const PANEL = 'rounded-panel border border-rule bg-card'
const PANEL_INK = 'rounded-panel border border-ink-2 bg-ink-2/40'

/* COLOUR AND PHOTOGRAPHY, this pass. The page ran mist, white, aqua-2, paper,
 * ink: four near-white teals and a dark band, and it carried no photograph at
 * all, which is the register the owner rejected on the twelve reference
 * screens. The ladder is sky, white, sun, paper, ink now, and two licensed
 * stock frames land at two different scales: a wide one in the hero beside the
 * phone, and a tall one inside the camera figure's own border, so the diagram
 * and the person it is about are one container rather than two.
 *
 * Measured, from tools/brand: sky.ink 5.63 on paper and 5.08 on its own wash,
 * sun.ink 5.67 and 5.08, and ink, ink-2, ink-3, accent and warn all clear
 * 4.5 : 1 on both washes, so nothing on this page loses contrast to the
 * change. No hue touches body text. */
const PHOTO = {
  'student-bus':      [1600, 1067],
  'student-homework': [1592, 1194],
}

function Frame({ photo, alt, className }) {
  const src = PHOTOS[photo]
  if (!src || !alt) return null
  const [w, h] = PHOTO[photo]
  return (
    <img src={src} alt={alt} width={w} height={h} loading="eager" decoding="async"
      className={cn('block h-full w-full max-w-none object-cover', className)}/>
  )
}

/* The three figures the hero used to spend a sentence on. 45 is PPG_SECONDS
   plus VOICE_SECONDS, the scale is the site's one scale, and the third is the
   promise PhoneCheck keeps further down the page. */
const HERO_FACTS = [
  ['45', 'seconds, camera and voice'],
  [SCORE_RANGE, SCORE],
  ['0', 'readings that leave the phone'],
]

/* The bridge between a phone reading and a patch reading, which is the one
   thing about this page a reader cannot get from the drawing or from the
   coverage strip under it. What the camera reads, what it cannot, and the
   frame rate are all drawn below; do not restate them here. */
const CAMERA_FACTS = [
  ['Against', 'Your own history, never another student'],
  ['Scale', `A phone reading and a patch reading both return one ${SCORE}`],
]

const ROUTES = [
  { id:'sensors', title:'Camera and microphone', when:'45 seconds', art:'sensors',
    gives:['Heart rate', 'Beat-to-beat', 'Voice'] },
  { id:'ask', title:`${ITEMS.length} questions`, when:'30 seconds', art:'ask',
    gives:['Tension', 'Sleep', 'Energy', 'Focus', 'Load'] },
]

/* Approved claim language; all three must stay. Do not reframe as trial-report
   columns (proved / not proved). This is a build. */
const LIMITS = [
  ['Heart rate', 'Within half a beat per minute of a known signal.'],
  ['Our own index',
   'The beat-to-beat figure is this project’s own index, not a clinical RMSSD. Withheld when the signal is noisy.'],
  ['Where it stands', 'Nothing has been tested on a person. Every figure here is generated.'],
]

function RouteArt({ kind }) {
  if (kind === 'sensors') return (
    <svg viewBox="0 0 200 74" aria-hidden className="h-14 w-[12rem]">
      <rect x="14" y="4" width="52" height="66" rx="13" className="fill-mist stroke-ink" strokeWidth="1.6"/>
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
          className={i === 2 ? 'fill-card stroke-ink' : 'fill-mist stroke-ruling'} strokeWidth="1.5"/>
      ))}
      <path d="M46 29h48M46 43h58M46 57h38" className="stroke-ink-3" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="128" cy="29" r="6" className="fill-none stroke-ruling" strokeWidth="1.6"/>
      <circle cx="128" cy="57" r="6" className="fill-none stroke-ruling" strokeWidth="1.6"/>
      <circle cx="128" cy="43" r="9" className="fill-accent-wash stroke-accent" strokeWidth="1.8"/>
      <path d="M123.5 43l3 3.5 6-7" className="fill-none stroke-accent" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

/* Figures as a chip row inside the panel rather than as a row of cells.
   Spec 2 allows a card to hold a row of chips, and at 390 three cells stacked
   into three rows of their own cost this block about 140px of height for the
   same three numbers. Label beside the figure, never under it. */
function Figures({ items, className }) {
  return (
    <ul className={cn('m-0 flex list-none flex-wrap gap-1.5 p-0', className)}>
      {items.map(([value, label]) => (
        <li key={label} className="inline-flex items-baseline gap-1.5 rounded-chip border
          border-rule bg-paper px-2.5 py-1">
          <span className="font-mono text-ui font-bold tabular-nums leading-none text-accent">
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
      <header className="border-t border-rule bg-sky-wash">
        <div className="wrap py-7 lg:py-10">
          <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-4">
            <div>
              <p className="inline-flex rounded-chip border border-rule bg-card px-2.5 py-1
                font-display text-tick font-bold tracking-[0.01em] text-sky-ink">
                Without the patch
              </p>
              {/* The heading is the one thing section 2 lets sit on a tinted
                  band. Everything under it is in the panel. */}
              <h1 className="mt-2 max-w-[14ch] font-display font-bold text-major
                leading-[1.04] tracking-tight text-ink">
                You do not need the patch.
              </h1>

              <div className={cn(PANEL, 'mt-3 max-w-[34rem] overflow-hidden border-l-[3px] border-l-sky')}>
                {/* The widest frame on the page, and the only one in the hero.
                    A licensed stock frame of models: nobody shown uses MindMap
                    and nobody is wearing a patch. */}
                <div className="h-[128px] border-b border-rule sm:h-[150px]">
                  <Frame photo="student-bus"
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
      <Section name="Inside the camera" tone="card" tight id="camera">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-4">
          <SectionHead>The camera reads your pulse.</SectionHead>
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
          <div className={cn(PANEL, 'grid overflow-hidden border-l-[3px] border-l-sky',
            'lg:grid-cols-[minmax(0,1fr)_minmax(0,250px)]')}>
            <div className="min-w-0 p-3.5 lg:p-4">
              {/* ScrollIn owns the entrance, Parallax2D the drift, on separate
                  elements: both write `transform`, so nesting is required. */}
              <Parallax2D distance={30}>
                <CameraModule className="mx-auto max-w-[66rem]"/>
              </Parallax2D>
            </div>
            <div className="h-[150px] border-t border-rule lg:h-auto lg:border-l lg:border-t-0">
              <Frame photo="student-homework"
                alt="A teenager in headphones leaning over an open notebook at a desk, a laptop and a pencil case beside them"/>
            </div>
          </div>
        </ScrollIn>
        <ScrollIn className="mt-3 lg:mt-4">
          <SignalCoverage/>
        </ScrollIn>
      </Section>

      <Section name="Two ways" tone="mist" tight className="bg-sun-wash">
        <SectionHead>Two ways to take a reading.</SectionHead>
        <div className="mt-3 grid gap-3 lg:auto-rows-fr lg:grid-cols-2 lg:gap-4">
          {ROUTES.map((r, i) => (
            <ScrollRow key={r.id} index={i} className="h-full">
              <div className={cn(PANEL, 'flex h-full flex-col border-l-[3px] p-4 lg:p-5',
                i ? 'border-l-lilac' : 'border-l-sun')}>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                  {/* 16px travel = 8px either side, inside this panel's 10px of
                      vertical padding, so the drawing stays within its ground. */}
                  <div className={cn('w-fit rounded-panel px-3 py-2',
                    i ? 'bg-lilac-wash' : 'bg-sun-wash')}>
                    <Parallax2D distance={16}>
                      <RouteArt kind={r.art}/>
                    </Parallax2D>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-row font-bold leading-tight text-ink">{r.title}</h3>
                    <p className={cn('mt-0.5 font-mono text-fine tabular-nums',
                      i ? 'text-lilac-ink' : 'text-sun-ink')}>{r.when}</p>
                  </div>
                </div>
                <ul className="m-0 mt-3 flex list-none flex-wrap gap-1.5 border-t border-rule p-0 pt-3">
                  {r.gives.map(g => (
                    <li key={g}
                      className="rounded-chip border border-rule bg-mist/60 px-2.5 py-1 text-fine
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
                        Go to the reading<span aria-hidden>→</span>
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
      <Section name="Try it" tone="paper" tight id="take">
        <SectionHead>Take a reading.</SectionHead>
        <div className="mt-3 lg:mt-4"><PhoneCheck/></div>
      </Section>

      <Section name="Limits" tone="ink" tight>
        <SectionHead tone="ink">What this reading is, and is not.</SectionHead>
        <div className="mt-3 grid gap-3 lg:auto-rows-fr lg:grid-cols-3 lg:gap-4">
          {LIMITS.map(([k, v], i) => (
            <ScrollRow key={k} index={i} className="h-full">
              <div className={cn(PANEL_INK, 'h-full p-3.5')}>
                <p className="font-display text-ui font-bold text-accent-lit">{k}</p>
                <p className="mt-1.5 max-w-[40ch] text-meta leading-[1.4] text-mist">{v}</p>
              </div>
            </ScrollRow>
          ))}
        </div>
      </Section>
    </main>
  )
}
