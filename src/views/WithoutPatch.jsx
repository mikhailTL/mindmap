import React from 'react'
import { Button } from '../ui/button'
import { Card, CardTitle } from '@/ui/card'
import { Section, SectionHead } from '../ui/section'
import { IPhone } from '../ui/iphone'
import { PhoneApp } from '../ui/phone-app'
import { Parallax2D, ScrollIn, ScrollRow } from '../ui/motion'
import { CameraModule, SignalCoverage } from '../charts/camera'
import { PhoneCheck } from './PhoneCheck'
import { ITEMS } from '../lib/engine'

/* Taking a reading with nothing on your arm.
 *
 * Band luminance ladder: mist, white, aqua-2, white, ink — 20%, 15%, 15% apart
 * and then the dark one. Keep adjacent bands this far apart; accent-wash and
 * beam-wash sit 3% apart and read as one surface. `aqua-2` is not a Section
 * tone, so it comes in as a class and tailwind-merge drops the tone's own
 * background. `tone` is still passed because it sets the eyebrow and heading
 * colours, which must stay ink-side.
 *
 * Capture instructions (which fingertip, resting on a table, a quiet room, a
 * sentence to say, what the score is measured against) live in PhoneCheck, at
 * the point of use. Do not duplicate them onto this page.
 *
 * Every figure here is 2D, so all use Parallax2D, never a 3D scene. Distances
 * are deliberately unequal — hero phone 64, camera module 30, coverage strip
 * 18, route drawings 16 — because figures at one shared distance read as a
 * rendering fault rather than as depth. */

const ROUTES = [
  { id:'sensors', title:'Camera and microphone', when:'45 seconds', art:'sensors',
    gives:['Heart rate', 'Beat-to-beat', 'Voice'] },
  { id:'ask', title:`${ITEMS.length} questions`, when:'30 seconds', art:'ask',
    gives:['Tension', 'Sleep', 'Energy', 'Focus', 'Load'] },
]

function RouteArt({ kind }) {
  if (kind === 'sensors') return (
    <svg viewBox="0 0 200 74" aria-hidden className="h-16 w-[13.5rem]">
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
    <svg viewBox="0 0 200 74" aria-hidden className="h-16 w-[13.5rem]">
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

export function WithoutPatch({ go }) {
  const toCheck = () => document.getElementById('take')?.scrollIntoView({ behavior:'smooth', block:'start' })

  return (
    <main>
      <header className="border-t border-rule bg-mist">
        <div className="wrap py-9 lg:py-12">
          <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12">
            <div>
              <p className="font-display text-tick font-bold tracking-[0.01em] text-accent">
                Without the patch
              </p>
              <h1 className="mt-2.5 max-w-[14ch] font-display font-bold text-major
                leading-[1.04] tracking-tight text-ink">
                You do not need the patch.
              </h1>
              <p className="mt-4 max-w-read text-lead leading-[1.4] text-ink-2">
                Forty five seconds, one Mind Score. Nothing leaves the phone.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={toCheck}>Take a reading<span aria-hidden>→</span></Button>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              {/* 64px travel = 32px either side, inside this band's 36px minimum
                  padding, so nothing reaches the edge and no layout shifts. */}
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
        <SectionHead>The camera reads your pulse.</SectionHead>
        <ScrollIn className="mt-5 lg:mt-6">
          {/* ScrollIn owns the entrance, Parallax2D the drift, on separate
              elements — both write `transform`, so nesting is required. */}
          <Parallax2D distance={30}>
            <CameraModule className="mx-auto max-w-[66rem]"/>
          </Parallax2D>
        </ScrollIn>
        <ScrollIn className="mt-7">
          <Parallax2D distance={18}>
            <SignalCoverage/>
          </Parallax2D>
        </ScrollIn>
      </Section>

      <Section name="Two ways" tone="mist" tight className="bg-aqua-2">
        <SectionHead>Two ways to take a reading.</SectionHead>
        <div className="mt-5 grid gap-4 lg:grid-cols-2 lg:gap-5">
          {ROUTES.map((r, i) => (
            <ScrollRow key={r.id} index={i} className="h-full">
              <Card className="flex h-full flex-col p-5">
                {/* 16px travel = 8px either side, inside this panel's 10px of
                    vertical padding, so the drawing stays within its ground. */}
                <div className="w-fit rounded-panel bg-mist/70 px-4 py-2.5">
                  <Parallax2D distance={16}>
                    <RouteArt kind={r.art}/>
                  </Parallax2D>
                </div>
                <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <CardTitle>{r.title}</CardTitle>
                  <span className="font-mono text-tick tabular-nums text-accent">{r.when}</span>
                </div>
                <ul className="mt-3 flex list-none flex-wrap gap-2 p-0">
                  {r.gives.map(g => (
                    <li key={g} className="rounded-chip border border-rule bg-mist/60 px-3 py-0.5 text-fine text-ink-2">{g}</li>
                  ))}
                </ul>
                {/* Both labels must differ from the hero's "Take a reading" —
                    duplicate names are one control to a screen reader. */}
                <div className="mt-auto pt-4">
                  {r.id === 'ask'
                    ? <Button variant="outline" size="sm" onClick={() => go('check')}>
                        Start the questions<span aria-hidden>→</span>
                      </Button>
                    : <Button variant="outline" size="sm" onClick={toCheck}>
                        Go to the reading<span aria-hidden>→</span>
                      </Button>}
                </div>
              </Card>
            </ScrollRow>
          ))}
        </div>
      </Section>

      {/* tone="paper", not "card": PhoneCheck is white cards, which on a white
          band are just borders. paper is a 10% step from the aqua above; mist
          and both washes land within 6% and read as one surface. */}
      <Section name="Try it" tone="paper" tight id="take">
        <SectionHead>Take a reading.</SectionHead>
        <div className="mt-5"><PhoneCheck/></div>
      </Section>

      {/* Approved claim language; all three must stay. Do not reframe as
          trial-report columns (proved / not proved) — this is a build. */}
      <Section name="Limits" tone="ink" tight>
        <SectionHead tone="ink">What this reading is, and is not.</SectionHead>
        <ul className="mt-5 grid list-none gap-4 p-0 lg:grid-cols-3 lg:gap-6">
          {[
            ['Heart rate',
              'Within half a beat per minute of a known signal.'],
            ['Our own index',
              'The beat-to-beat figure is this project’s own index, not a clinical RMSSD. Withheld when the signal is noisy.'],
            ['Where it stands',
              'Nothing has been tested on a person. Every figure here is generated.'],
          ].map(([k, v], i) => (
            <ScrollRow key={k} index={i} as="li" className="border-t border-ink-3 pt-3">
              <p className="font-display text-ui font-bold text-accent-lit">{k}</p>
              <p className="mt-1.5 max-w-[40ch] text-sec leading-[1.45] text-mist">{v}</p>
            </ScrollRow>
          ))}
        </ul>
      </Section>
    </main>
  )
}
