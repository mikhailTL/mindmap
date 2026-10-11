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
 *
 * Two things came back three reviews running and are fixed here.
 *
 * The first is white space. The hero phone stood at 0.62 and the step phones
 * at 0.55 for no reason but that a drawing likes room; the section stack was
 * mt-8 on top of mt-10 on top of a figure carrying its own caption band; the
 * camera figure was capped at 60rem inside a 1328px wrap, so a sixth of the
 * page's width was margin. All of that is measured down here, and the figure
 * puts its caption in the margin instead of under itself.
 *
 * The second is the ladder. Alternating paper and card is alternating nothing:
 * they are 2% apart in luminance. The bands are mist, white, aqua-2, white,
 * ink: 20%, 15%, 15% apart and then the dark one. The accent-wash and
 * beam-wash pair that used to sit in the middle of that run measured 3% apart
 * and read as one surface. aqua-2 is not a tone the Section component knows
 * about, so it arrives as a class and tailwind-merge drops the tone's own
 * background; tone is still passed because it sets the eyebrow and heading
 * colours, which must stay ink-side.
 *
 * The fourth review cut the page again, on one note: too much of it. Six bands
 * are four plus the hero now. The camera figure and the signal coverage are
 * one subject and share a band. The four step phones are the instructions for
 * the capture they sat above, so they moved into it and the lede between them
 * went. Nothing on the page is a paragraph any more. The hero is a <header>
 * rather than a <section>, so every <section> here is headed by an h2 at the
 * one section size and the heading a reader could not find is gone.
 */

const ROUTES = [
  { id:'sensors', title:'Camera and microphone', when:'45 seconds', art:'sensors',
    gives:['Heart rate', 'Beat-to-beat', 'Voice'] },
  { id:'ask', title:`${ITEMS.length} questions`, when:'30 seconds', art:'ask',
    gives:['Tension', 'Sleep', 'Energy', 'Focus', 'Load'] },
]

/* The captions used to repeat each phone screen's own title word for word,
   so the row printed "Hold still." twice, forty pixels apart. The screens
   carry the instruction now and the caption is the short imperative under it,
   which is also the label a screen reader is given for the drawing. */
const STEPS = [
  { k:'pad',   t:'Index fingertip, lens and flash.' },
  { k:'still', t:'Hand resting, thirty seconds.' },
  { k:'say',   t:'One sentence, quiet room.' },
  { k:'got',   t:'Your Mind Score and band.' },
]

/* Two small drawings, because two cards of equal prose are a comparison a
   reader has to do themselves. Kept local: they are this page's furniture,
   not a chart anything else will want. Down from 84 units of height to 64:
   neither drawing has anything in the top or bottom sixth of its box. */
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
      {/* three cards deep, and the options inside the top one rather than
          hanging off its right edge, which is where they sat first and read as
          a rendering fault */}
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
  /* One measurement, two consumers: the phone mockups have to shrink on a
     390px screen or they run off it, and the camera drawing swaps its labels
     out for a list at the same width. */
  const narrow = useNarrow()
  const toCheck = () => document.getElementById('take')?.scrollIntoView({ behavior:'smooth', block:'start' })

  return (
    <main>
      {/* mist, not paper. The hero used to be the same near-white as the
          section under it, so the page opened on one undivided sheet. */}
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
                Forty five seconds, one Mind Score out of 100.
              </p>
              <p className="mt-2.5 max-w-read text-sec text-ink-2">
                Nothing leaves the phone.
              </p>
              {/* One control. The second one went to the questions, which the
                  route card below goes to under a clearer name. */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={toCheck}>Take a reading<span aria-hidden>→</span></Button>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <IPhone scale={narrow ? 0.44 : 0.44} label="The MindMap app running on a phone">
                <PhoneApp/>
              </IPhone>
            </div>
          </div>
        </div>
      </header>

      {/* White, so the ruled step table in the figure has a ground its mist
          bands can be told apart from. */}
      <Section name="Inside the camera" tone="card" tight id="camera">
        <SectionHead>How your phone reads a pulse.</SectionHead>
        <ScrollIn className="mt-5 lg:mt-6">
          <CameraModule className="mx-auto max-w-[66rem]"/>
        </ScrollIn>
        {/* The coverage strip used to be two thirds of the way down the next
            band under an h3, which is the heading the review could not find.
            It is the same subject as the figure and sits under the same h2. */}
        <ScrollIn className="mt-7">
          <SignalCoverage/>
        </ScrollIn>
      </Section>

      <Section name="Two ways" tone="mist" tight className="bg-aqua-2">
        <SectionHead>Two ways to take a reading.</SectionHead>
        {/* Asked twice, on two pages: how two ways to take a reading squares
            with three ways to use MindMap. One line, in the Overview page's
            own words so the two headings match. */}
        <SectionLede className="mt-2.5">
          Two of the 3 Ways to Use MindMap. The demo takes no reading.
        </SectionLede>
        <div className="mt-5 grid gap-4 lg:grid-cols-2 lg:gap-5">
          {ROUTES.map((r, i) => (
            <ScrollRow key={r.id} index={i} className="h-full">
              <Card className="flex h-full flex-col p-5">
                {/* w-fit, not a full-width banner. The panel used to run the
                    width of the card with a 170px drawing centred in it, which
                    is 460px of grey doing nothing on every card. */}
                <div className="w-fit rounded-panel bg-mist/70 px-4 py-2.5">
                  <RouteArt kind={r.art}/>
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
                {/* Both cards end on a control, which is the only reason the
                    row has no shelf in it: one card carried a button and the
                    other stopped at its chips, so the left one finished 80px
                    above the right. The names differ because the page already
                    has a "Take a reading" in the hero and two controls with
                    one name is one control to anything reading the page
                    aloud. */}
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

      {/* The procedure and the thing it is a procedure for were two bands,
          two headings and a lede. One band now: four phones, then the capture
          that follows them. The numerals stay because this is a sequence.

          paper, not card: the capture is built out of white cards, and on a
          white band a white card is a border and nothing else. Against the
          aqua band above it paper is a 10% step, where mist, aqua and both
          washes all land inside 6% of it and read as the same surface. */}
      <Section name="Try it" tone="paper" tight id="take">
        <SectionHead>Take a reading in four steps.</SectionHead>
        {/* Two up until 1280, not until 1024. At 1024 a four-column track is
            210px wide and the phone drawing is 228px, so the row ran off the
            right edge on exactly the laptop width most people have.

            The phones came down from 0.55 to 0.50 and the row gap from 8 to 4.
            At 1280 a 0.55 phone left 86px of nothing in each of four columns
            and cost 80px of height to do it. */}
        <ol className="mt-5 grid list-none grid-cols-2 gap-x-3 gap-y-4 p-0
          sm:gap-x-6 xl:grid-cols-4 xl:gap-x-5">
          {STEPS.map((s, i) => (
            <ScrollRow key={s.k} index={i} as="li" className="flex flex-col items-center text-center">
              <IPhone model="14" scale={narrow ? 0.36 : 0.5} color="natural"
                showHomeIndicator={false} label={s.t}>
                <StepScreen kind={s.k}/>
              </IPhone>
              <p className="mt-3 flex items-baseline justify-center gap-2 text-fine
                leading-[1.35] text-ink-2 sm:text-sec">
                <span className="font-mono tabular-nums text-accent">{i + 1}</span>
                <span className="max-w-[20ch]">{s.t}</span>
              </p>
            </ScrollRow>
          ))}
        </ol>
        <div className="mt-8"><PhoneCheck/></div>
      </Section>

      {/* Proved / Careful / Not proved was the wrong frame: those are the
          columns of a trial report, and this is a build. The three facts the
          band exists to state are unchanged, and they are the ones a reader
          has to leave with: what the camera reading actually is, that the
          beat-to-beat figure is ours and is withheld when the signal is bad,
          and that nothing here has met a person yet. Said as build notes they
          read as the same honesty without borrowing a clinical claim to
          disclaim. */}
      <Section name="Limits" tone="ink" tight>
        <SectionHead tone="ink">What this reading is, and what it is not</SectionHead>
        <ul className="mt-5 grid list-none gap-4 p-0 lg:grid-cols-3 lg:gap-6">
          {[
            ['What it measures',
              'Heart rate off the camera, matched to within half a beat per minute against a known signal.'],
            ['Our own index',
              'The beat-to-beat figure is this project’s own index, not a clinical RMSSD. It is withheld when the signal is noisy.'],
            ['Where it stands',
              'Nothing here has been tested on a person. Every figure on this page is generated.'],
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
