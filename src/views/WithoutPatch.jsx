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
 * one subject and share a band. Nothing on the page is a paragraph any more.
 * The hero is a <header> rather than a <section>, so every <section> here is
 * headed by an h2 at the one section size and the heading a reader could not
 * find is gone.
 *
 * The fifth cut was counted rather than judged: the route rendered 538 words
 * against a budget of 330. Almost all of the overrun was one band. Four phone
 * mockups stood above the capture screen and each one printed the title and
 * the subtitle of a step the screen underneath prints again, forty pixels
 * lower: 104 words to say twice what the reader is about to be told once, at
 * the moment they do it. The phones are gone and the instructions live in
 * PhoneCheck, which is where the reading is actually taken. What the capture
 * needs in order to be completed at all (which fingertip, resting it on a
 * table, a quiet room, a sentence to say, what the score is measured against)
 * stayed there and was not moved onto this page.
 *
 * Everything else lost its second sentence. A heading is a claim, one line
 * follows it, then the thing itself; the lede that reconciled "two ways" with
 * the Overview page's "3 Ways" was a cross-reference, not a reason to read on,
 * and the limits band says its three facts in one sentence each.
 *
 * MOTION. Every figure on this page is 2D, so every one of them takes
 * Parallax2D rather than a 3D scene — nothing drawn here is a stack of objects
 * in space and tipping a flat schematic would only make it harder to read. The
 * distances are graded by how near the thing is meant to feel: the phone in
 * the hero is the nearest object on the page and travels 64px, the camera
 * module 30, the coverage strip under it 18, and the two small route drawings
 * 16 inside their own panels. Figures at one shared distance read as a
 * rendering fault rather than as depth, which is why no two here match.
 */

const ROUTES = [
  { id:'sensors', title:'Camera and microphone', when:'45 seconds', art:'sensors',
    gives:['Heart rate', 'Beat-to-beat', 'Voice'] },
  { id:'ask', title:`${ITEMS.length} questions`, when:'30 seconds', art:'ask',
    gives:['Tension', 'Sleep', 'Energy', 'Focus', 'Load'] },
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
                Forty five seconds, one Mind Score. Nothing leaves the phone.
              </p>
              {/* One control. The second one went to the questions, which the
                  route card below goes to under a clearer name. */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={toCheck}>Take a reading<span aria-hidden>→</span></Button>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              {/* The nearest object on the page, so it drifts furthest. 32px
                  either side of centre, against a hero band whose own vertical
                  padding is 36px at the narrow end: the phone cannot reach the
                  band's edge and its box does not move, so the headline beside
                  it does not shift by a pixel. */}
              <Parallax2D distance={64} className="shrink-0">
                <IPhone scale={0.44} label="The MindMap app running on a phone">
                  <PhoneApp/>
                </IPhone>
              </Parallax2D>
            </div>
          </div>
        </div>
      </header>

      {/* White, so the ruled step table in the figure has a ground its mist
          bands can be told apart from. */}
      <Section name="Inside the camera" tone="card" tight id="camera">
        <SectionHead>The camera reads your pulse.</SectionHead>
        <ScrollIn className="mt-5 lg:mt-6">
          {/* Two mechanisms on one figure, and they do not collide: ScrollIn
              owns the entrance and ends, Parallax2D owns the drift and is on
              its own element inside it. Neither one writes the other's
              transform. */}
          <Parallax2D distance={30}>
            <CameraModule className="mx-auto max-w-[66rem]"/>
          </Parallax2D>
        </ScrollIn>
        {/* The coverage strip used to be two thirds of the way down the next
            band under an h3, which is the heading the review could not find.
            It is the same subject as the figure and sits under the same h2. */}
        <ScrollIn className="mt-7">
          {/* Half the module's distance. The two sit in one band under one
              heading, and the smaller figure reading as the further one is
              what keeps the pair from drifting as a single sheet. */}
          <Parallax2D distance={18}>
            <SignalCoverage/>
          </Parallax2D>
        </ScrollIn>
      </Section>

      <Section name="Two ways" tone="mist" tight className="bg-aqua-2">
        <SectionHead>Two ways to take a reading.</SectionHead>
        {/* No lede. It used to reconcile this heading with the Overview page's
            "3 Ways to Use MindMap", which is that page's job: the two cards
            under here are the two ways, and a reader who has not seen the
            third is not missing anything they need in order to take a
            reading. */}
        <div className="mt-5 grid gap-4 lg:grid-cols-2 lg:gap-5">
          {ROUTES.map((r, i) => (
            <ScrollRow key={r.id} index={i} className="h-full">
              <Card className="flex h-full flex-col p-5">
                {/* w-fit, not a full-width banner. The panel used to run the
                    width of the card with a 170px drawing centred in it, which
                    is 460px of grey doing nothing on every card. */}
                {/* 8px either side, which is inside this panel's own 10px of
                    vertical padding, so the drawing moves within its grey
                    rather than against the card's edge. */}
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

      {/* The heading, then the reading. There used to be a row of four phone
          mockups between the two, each one printing a step's title and its
          subtitle above the screen that prints both again a little lower, and
          between them they were a third of the page's words. A marketing page
          does not need a picture of the form that is directly underneath it.

          So the heading lost its count as well: nothing here is numbered any
          more, and PhoneCheck's own three steps carry the order.

          paper, not card: the capture is built out of white cards, and on a
          white band a white card is a border and nothing else. Against the
          aqua band above it paper is a 10% step, where mist, aqua and both
          washes all land inside 6% of it and read as the same surface. */}
      <Section name="Try it" tone="paper" tight id="take">
        <SectionHead>Take a reading.</SectionHead>
        <div className="mt-5"><PhoneCheck/></div>
      </Section>

      {/* Proved / Careful / Not proved was the wrong frame: those are the
          columns of a trial report, and this is a build. The three facts the
          band exists to state are unchanged, and they are the ones a reader
          has to leave with: what the camera reading actually is, that the
          beat-to-beat figure is ours and is withheld when the signal is bad,
          and that nothing here has met a person yet. Said as build notes they
          read as the same honesty without borrowing a clinical claim to
          disclaim.

          Each one is one sentence now, and the label in front of it names the
          subject rather than a column. "What it measures" measured nothing;
          the sentence under it is the measurement. */}
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
