import React from 'react'
import { Button } from '../ui/button'
import { Card, CardTitle } from '@/ui/card'
import { Section, SectionHead, SectionLede } from '../ui/section'
import { IPhone } from '../ui/iphone'
import { PhoneApp } from '../ui/phone-app'
import { ScrollIn, ScrollRow } from '../s21/motion'
import { CameraModule, SignalCoverage, StepScreen, useNarrow } from '../charts/camera'
import { PhoneCheck } from './PhoneCheck'
import { ITEMS } from '../lib/engine'

/* Taking a reading with nothing on your arm.
 *
 * The page existed and read as slop: a numbered "02 · The two routes" eyebrow
 * in a style the site no longer uses, titles written as slogans ("The phone in
 * your pocket is already a sensor"), two prose cards a reader had to parse to
 * compare, and a set of capture instructions that were a paragraph each. The
 * review's instruction was to cut it roughly in half and let pictures carry
 * what the sentences were carrying.
 *
 * So: the camera is drawn rather than described, the comparison is four
 * signals lit or unlit rather than a clause beginning "no skin temperature",
 * and the instructions are four phones with one line under each. Every title
 * is now something a fifteen-year-old reads once.
 */

const ROUTES = [
  { id:'sensors', title:'Camera and microphone', when:'45 seconds', art:'sensors',
    line:'A fingertip on the rear lens, then one spoken sentence.',
    gives:['Heart rate', 'Beat-to-beat', 'Voice'] },
  { id:'ask', title:`${ITEMS.length} questions`, when:'30 seconds', art:'ask',
    line:'No camera, no microphone. Same model, same scale.',
    gives:['Tension', 'Sleep', 'Energy', 'Focus', 'Load'] },
]

const STEPS = [
  { k:'pad',   t:'Fingertip on the rear camera.' },
  { k:'still', t:'Hold still for thirty seconds.' },
  { k:'say',   t:'Say one sentence out loud.' },
  { k:'got',   t:'Read your score.' },
]

/* Two small drawings, because two cards of equal prose are a comparison a
   reader has to do themselves. Kept local: they are this page's furniture,
   not a chart anything else will want. */
function RouteArt({ kind }) {
  if (kind === 'sensors') return (
    <svg viewBox="0 0 200 84" aria-hidden className="h-[84px] w-full">
      <rect x="14" y="8" width="52" height="68" rx="13" className="fill-mist stroke-ink" strokeWidth="1.6"/>
      <rect x="24" y="16" width="30" height="30" rx="9" className="fill-card stroke-ink-3" strokeWidth="1.3"/>
      <circle cx="33" cy="25" r="5" className="fill-none stroke-ink-3" strokeWidth="1.3"/>
      <circle cx="45" cy="37" r="5" className="fill-none stroke-ink-3" strokeWidth="1.3"/>
      <circle cx="45" cy="25" r="3" className="fill-accent"/>
      <ellipse cx="39" cy="31" rx="19" ry="15" className="fill-accent-wash stroke-ink" strokeWidth="1.8" opacity="0.9"/>
      <path d="M92 42h16M100 34v16" className="stroke-ruling" strokeWidth="1.6" strokeLinecap="round"/>
      <rect x="132" y="12" width="20" height="34" rx="10" className="fill-card stroke-ink" strokeWidth="1.6"/>
      <path d="M124 40a18 18 0 0 0 36 0M142 58v12M132 70h20" className="fill-none stroke-ink" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M168 22c5 6 5 14 0 20M178 16c9 10 9 22 0 32" className="fill-none stroke-beam" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
  return (
    <svg viewBox="0 0 200 84" aria-hidden className="h-[84px] w-full">
      {/* three cards deep, and the options inside the top one rather than
          hanging off its right edge, which is where they sat first and read as
          a rendering fault */}
      {[0, 1, 2].map(i => (
        <rect key={i} x={16 + i * 9} y={6 + i * 8} width="116" height="54" rx="8"
          className={i === 2 ? 'fill-card stroke-ink' : 'fill-mist stroke-ruling'} strokeWidth="1.5"/>
      ))}
      <path d="M46 34h48M46 50h58M46 66h38" className="stroke-ink-3" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="128" cy="34" r="6" className="fill-none stroke-ruling" strokeWidth="1.6"/>
      <circle cx="128" cy="66" r="6" className="fill-none stroke-ruling" strokeWidth="1.6"/>
      <circle cx="128" cy="50" r="9" className="fill-accent-wash stroke-accent" strokeWidth="1.8"/>
      <path d="M123.5 50l3 3.5 6-7" className="fill-none stroke-accent" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function WithoutPatch({ go }) {
  /* One measurement, two consumers: the phone mockups have to shrink on a
     390px screen or they run off it, and the camera drawing swaps its labels
     out for a list at the same width. */
  const narrow = useNarrow()
  const toCheck = () => document.getElementById('take')?.scrollIntoView({ behavior:'smooth', block:'start' })

  return (
    <main>
      <section className="border-t border-rule bg-paper">
        <div className="wrap py-12 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
            <div>
              <p className="font-display text-tick font-bold tracking-[0.01em] text-accent">
                Without a patch
              </p>
              <h1 className="mt-3 max-w-[14ch] font-display font-bold text-view lg:text-sect
                leading-[1.04] tracking-tight text-ink">
                You do not need the patch.
              </h1>
              <p className="mt-5 max-w-read text-lead leading-[1.45] text-ink-2">
                Your phone already has the sensors. Forty five seconds, one score out of 100.
              </p>
              <p className="mt-4 max-w-read text-sec text-ink-2">
                Nothing leaves the phone. No video or recording is ever saved.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button onClick={toCheck}>Take a reading<span aria-hidden>→</span></Button>
                <Button variant="outline" onClick={() => go('check')}>
                  Answer {ITEMS.length} questions
                </Button>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <IPhone scale={narrow ? 0.5 : 0.62} label="The MindMap app running on a phone">
                <PhoneApp/>
              </IPhone>
            </div>
          </div>
        </div>
      </section>

      <Section name="Inside the camera" tone="card" tight id="camera">
        <SectionHead>How your phone reads a pulse.</SectionHead>
        <ScrollIn className="mt-8 lg:mt-10">
          <CameraModule className="mx-auto max-w-[60rem]"/>
        </ScrollIn>
      </Section>

      <Section name="Two ways" tone="paper">
        <SectionHead>Two ways to take a reading.</SectionHead>
        <div className="mt-8 grid gap-5 lg:grid-cols-2 lg:gap-6">
          {ROUTES.map((r, i) => (
            <ScrollRow key={r.id} index={i} className="h-full">
              <Card className="flex h-full flex-col p-6">
                <div className="rounded-panel bg-mist/70 px-4 py-3">
                  <RouteArt kind={r.art}/>
                </div>
                <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <CardTitle>{r.title}</CardTitle>
                  <span className="font-mono text-tick tabular-nums text-accent">{r.when}</span>
                </div>
                <p className="mt-2 max-w-[38ch] text-sec leading-[1.5] text-ink-2">{r.line}</p>
                <ul className="mt-4 flex list-none flex-wrap gap-2 p-0">
                  {r.gives.map(g => (
                    <li key={g} className="rounded-chip border border-rule bg-mist/60 px-3 py-1
                      font-mono text-fine text-ink-2">{g}</li>
                  ))}
                </ul>
                {r.id === 'ask' && (
                  <div className="mt-auto pt-5">
                    <Button variant="outline" size="sm" onClick={() => go('check')}>
                      Start the questions<span aria-hidden>→</span>
                    </Button>
                  </div>
                )}
              </Card>
            </ScrollRow>
          ))}
        </div>

        <ScrollIn className="mt-10">
          <h3 className="font-display text-head font-bold text-ink">What the phone picks up.</h3>
          <SignalCoverage className="mt-4"/>
        </ScrollIn>
      </Section>

      <Section name="How to do it" tone="mist" tight>
        <SectionHead>Four steps.</SectionHead>
        {/* Two up until 1280, not until 1024. At 1024 a four-column track is
            210px wide and the phone drawing is 228px, so the row ran off the
            right edge on exactly the laptop width most people have. */}
        <ol className="mt-8 grid list-none grid-cols-2 gap-x-3 gap-y-8 p-0
          sm:gap-x-6 xl:grid-cols-4 xl:gap-6">
          {STEPS.map((s, i) => (
            <ScrollRow key={s.k} index={i} as="li" className="flex flex-col items-center text-center">
              <IPhone model="14" scale={narrow ? 0.38 : 0.55} color="natural"
                showHomeIndicator={false} label={s.t}>
                <StepScreen kind={s.k}/>
              </IPhone>
              <p className="mt-4 flex items-baseline justify-center gap-2 text-fine
                leading-[1.4] text-ink-2 sm:text-sec">
                <span className="font-mono tabular-nums text-accent">{i + 1}</span>
                <span className="max-w-[20ch]">{s.t}</span>
              </p>
            </ScrollRow>
          ))}
        </ol>
      </Section>

      <Section name="Try it" tone="card" id="take">
        <SectionHead>Take a reading now.</SectionHead>
        <SectionLede>
          The band under the score is how sure the reading is.
        </SectionLede>
        <div className="mt-8"><PhoneCheck/></div>
      </Section>

      <Section name="Limits" tone="ink">
        <SectionHead tone="ink">What we have and have not proved.</SectionHead>
        <ul className="mt-7 grid list-none gap-5 p-0 lg:grid-cols-3 lg:gap-8">
          {[
            ['Proved', 'Heart rate lands within half a beat per minute of a test signal whose rate we already knew.'],
            ['Careful', 'The beat-to-beat number is an index of our own, not a clinical RMSSD. It is withheld when the timing is too noisy.'],
            ['Not proved', 'None of it has been tested against a real person yet. Every figure comes from synthetic signals.'],
          ].map(([k, v], i) => (
            <ScrollRow key={k} index={i} as="li" className="border-t border-ink-3 pt-4">
              <p className="font-display text-ui font-bold text-accent-lit">{k}</p>
              <p className="mt-2 max-w-[40ch] text-sec leading-[1.5] text-mist">{v}</p>
            </ScrollRow>
          ))}
        </ul>
      </Section>
    </main>
  )
}
