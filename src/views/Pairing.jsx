import React from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Section, SectionHead, SectionLede } from '../ui/section'
import { List, Item } from '../ui/list'
import { ArrowRight, Never } from '../ui/marks'
import { RevealLines, ScrollIn, ScrollRow } from '../ui/motion'
import { WirelessLink, ArmPlacement, StepArt } from '../charts/pairing-art'
import { ITEMS } from '../lib/engine'
import { SCORE } from '../lib/terms'

/* Using the patch: the setup, where it goes, and what to do when it will not
 * connect.
 *
 * Two rules govern this page.
 *
 * One. Every step is the flow lib/engine.js actually runs, and every message in
 * the troubleshooting list is a string from that file, quoted. If the connect
 * path changes, this page changes with it. Do not write a step or a failure the
 * code does not have.
 *
 * Two. No unit has been built or worn. The hero says so in plain words, once,
 * where a reader meets it rather than at the foot of the page, and nothing
 * below it may imply otherwise. Battery life, charge time, adhesive, wear
 * duration, electrode build, part numbers, water resistance, weight, cost,
 * range in metres and pairing time in seconds are all unsettled: a step that
 * would need one of those numbers is written without it.
 *
 * Band ladder: mist, white, aqua-2, paper, aqua. Keep adjacent grounds this far
 * apart. `aqua-2` and `aqua` are not Section tones, so they come in as a class
 * and tailwind-merge drops the tone's own background; `tone` is still passed
 * because it sets the eyebrow and heading colours. Nothing warn-coloured may
 * land on aqua-2, where warn measures 4.498:1 and fails. */

/* Five numbered steps plus the wake, which is the one step that happens off
   the screen. The art for each is in charts/pairing-art. */
const STEPS = [
  { k:'wake', title:'Take the patch off charge',
    line:'Charging runs through a slot in the side of the shell. Off charge, the patch advertises '
      + 'itself over Bluetooth Low Energy. Nothing is plugged into it.' },
  { k:'open', title:'Open the app in a browser',
    line:'There is nothing to install and nothing to download first. It does have to be a browser '
      + 'that can open a Bluetooth connection, which is what the next step asks for.' },
  { k:'tap', title:'Tap Connect to the patch',
    line:'One button. The app asks the browser for a device and touches nothing else on the phone.' },
  { k:'chooser', title:'The browser puts up its own list',
    line:'This sheet belongs to the browser, not to the app. It is filtered to the single service '
      + 'the patch advertises, so nothing else can appear in it.' },
  { k:'pick', title:'Choose the patch, then Pair',
    line:'The name in the list is whatever the patch advertises. Choosing it is what hands the '
      + 'connection to the app, and the app sees nothing until you do.' },
  { k:'stream', title:'It streams',
    line:'The app confirms with the name it connected to and starts reading: four channels, once '
      + 'a second, all day.' },
]

/* Nothing in the setup, stated as the five things a reader does not have to
   find. Drawn with the Never mark rather than as plain bullets, because the
   point of the list is the absence. */
const NOTHING = [
  'A cable',
  'A host computer',
  'A driver',
  'A download before you can start',
  'A development tool',
]

/* Every `seen` string below is quoted from src/lib/engine.js. The line number
   is in the comment beside it so a future edit to the connect path can find
   the copy that describes it. */
const TROUBLE = [
  { /* engine.js:47, the navigator.bluetooth guard */
    title:'Connect returns a message about an embedded page',
    seen:'This browser cannot open a Bluetooth connection from inside an embedded page. Open the '
      + 'site directly in Chrome on a computer, or use the check-in below.',
    why:'The app checks for Bluetooth support before it does anything at all. A page opened inside '
      + 'another app, in a preview pane or in an in-app browser does not have it, so there is '
      + 'nothing for the app to ask.',
    fix:'Open the site in its own browser window and try again. The check-in gives a '
      + `${SCORE} where Bluetooth is unavailable.` },
  { /* engine.js:47 again: the same guard, a different cause */
    title:'The same message in a browser that has no Bluetooth, or on a plain http address',
    seen:'This browser cannot open a Bluetooth connection from inside an embedded page. Open the '
      + 'site directly in Chrome on a computer, or use the check-in below.',
    why:'One guard covers every case where the browser offers no Bluetooth at all. Some browsers '
      + 'do not implement it, and none of them offer it to a page served over plain http.',
    fix:'Open the site over https in a browser that supports it. Nothing about the patch needs '
      + 'changing.' },
  { /* engine.js:45 and 50: the service filter on requestDevice */
    title:'The list opens and stays empty',
    seen:'filters: [{ services: [6e400001-b5a3-f393-e0a9-e50e24dcca9e] }]',
    why:'The request names one service, the one the patch advertises, so no other device can be '
      + 'listed. An empty list means nothing nearby is advertising it.',
    fix:'Take the patch off charge, keep it near the phone, and tap Connect again.' },
  { /* engine.js:54 and 55: NotFoundError, which is a cancel and not a fault */
    title:'You closed the list without choosing',
    seen:'No patch was selected. The check-in below works without one.',
    why:'Dismissing the browser’s sheet is reported to the app as a cancel rather than as a '
      + 'fault, so the app says so and stops.',
    fix:'Tap Connect again and choose the patch.' },
  { /* engine.js:56: anything requestDevice or gatt.connect throws */
    title:'It found the patch and then could not open the connection',
    seen:'Could not connect: unknown. The check-in below works without a patch.',
    why:'Anything the connection itself throws lands here. The reason after the colon comes from '
      + 'the browser, and reads unknown when the browser gives none.',
    fix:'Try once more with the patch close by. If it keeps failing, the check-in returns a '
      + `${SCORE} without a patch.` },
]

export function Pairing({ go }) {
  return (
    <main>
      <header className="border-t border-rule bg-mist">
        <div className="wrap py-9 lg:py-12">
          <div className="grid items-center gap-8
            lg:grid-cols-[minmax(0,1fr)_minmax(0,46%)] lg:gap-12">
            <div className="min-w-0">
              <p className="font-mono text-row font-bold tracking-[0.005em] text-accent">
                Using the patch
              </p>
              {/* The line break is explicit so a 390px column cannot break
                  "plugged" across two lines. */}
              <RevealLines as="h1"
                className="mt-3 max-w-[20ch] font-display font-bold text-major leading-[1.05]
                  tracking-tight text-ink"
                lines={['Nothing is plugged', 'into anything.']}/>
              <ScrollIn className="mt-4">
                <p className="max-w-read text-lead leading-[1.45] text-ink-2">
                  The patch talks to the phone over Bluetooth Low Energy. That is the whole setup.
                </p>
                <p className="mt-3.5 max-w-[48ch] text-sec leading-[1.5] text-ink-2">
                  A design that has to stay tethered to a bench can only be shown where the bench
                  is. This one is meant to be worn under a sleeve at school, so the setup had to
                  be four taps on a phone and nothing else.
                </p>
                <p className="mark mt-7">Not needed to start</p>
                <List className="mt-3 gap-2.5">
                  {NOTHING.map(t => (
                    <Item key={t} marker="none" className="gap-3 text-meta text-ink">
                      <Never aria-hidden className="mt-1 size-4 shrink-0 text-ink-3"/>{t}
                    </Item>
                  ))}
                </List>
                {/* Early, plain, and once. A judge must not reach the steps
                    below believing a unit has been assembled or worn. Do not
                    move this to the foot of the page and do not soften it. */}
                <p className="mt-7 max-w-[48ch] border-l-2 border-ink pl-3.5 text-meta text-ink-2">
                  <b className="font-display font-bold text-ink">No unit has been built or worn.</b>{' '}
                  The enclosure is designed and drawn at a settled size, and the connect path on
                  this page is real code in the app. Nobody has put one on an arm.
                </p>
              </ScrollIn>
            </div>

            <figure className="m-0 min-w-0">
              <WirelessLink/>
              <figcaption className="note mt-3 max-w-[40ch]">
                A drawing, not a photograph. The link is Bluetooth Low Energy and there is no
                second path: no cable, no host computer, no driver.
              </figcaption>
            </figure>
          </div>
        </div>
      </header>

      {/* An ordered list in the DOM, so the order is the document's and not the
          grid's. One drawing and one line per step. */}
      <Section name="The setup" tone="card" className="bg-card">
        <SectionHead className="mt-2 max-w-[26ch]">{STEPS.length} steps, start to streaming</SectionHead>
        <SectionLede>
          The screens below are the app’s own. The sheet in the middle two is the
          browser’s, which is why the app cannot style it or choose for you.
        </SectionLede>
        <ol className="m-0 mt-7 grid list-none gap-4 p-0 sm:grid-cols-2 lg:mt-9 lg:grid-cols-3 lg:gap-5">
          {STEPS.map((s, i) => (
            <li key={s.k}>
              <ScrollRow index={i} className="h-full">
                <Card className="flex h-full flex-col">
                  {/* Fixed art height so six cards in three columns line up;
                      the drawing and the phone mockup are both sized to it in
                      charts/pairing-art. */}
                  <div className="flex h-[404px] items-center justify-center bg-aqua px-4">
                    <StepArt kind={s.k}/>
                  </div>
                  <div className="border-t border-rule p-4 lg:p-5">
                    <p className="font-mono text-tick tabular-nums text-ink-3">
                      Step {i + 1} of {STEPS.length}
                    </p>
                    <h3 className="mt-1.5 font-display text-row font-bold leading-tight text-ink">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-sec text-ink-2">{s.line}</p>
                  </div>
                </Card>
              </ScrollRow>
            </li>
          ))}
        </ol>
      </Section>

      <Section name="On the body" tone="paper" className="bg-aqua-2">
        <SectionHead className="mt-2 max-w-[24ch]">Where it goes</SectionHead>
        <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-12">
          <figure className="m-0 min-w-0">
            <ArmPlacement/>
            <figcaption className="note mt-3 max-w-[40ch]">
              The outer face of the upper arm, seen straight on. A drawing, not a photograph.
            </figcaption>
          </figure>
          <div className="min-w-0">
            <List className="gap-4">
              <Item marker="none" className="border-t border-rule pt-3">
                <span className="block font-display text-ui font-bold text-ink">
                  Outer upper arm, long axis along the arm
                </span>
                <span className="mt-1 block text-sec text-ink-2">
                  The oval is 54 mm along the arm by 36 mm across it, and the 54 lies parallel to
                  the arm, not across it. Turned a quarter, it would sit over the arm rather than
                  down it.
                </span>
              </Item>
              <Item marker="none" className="border-t border-rule pt-3">
                <span className="block font-display text-ui font-bold text-ink">
                  The face against the skin does the reading
                </span>
                <span className="mt-1 block text-sec text-ink-2">
                  All four channels read through it: heart rate and the variation between beats,
                  skin conductance, skin temperature and movement, once a second, all day.
                </span>
              </Item>
              <Item marker="none" className="border-t border-rule pt-3">
                <span className="block font-display text-ui font-bold text-ink">
                  Under a sleeve, charged through the side
                </span>
                <span className="mt-1 block text-sec text-ink-2">
                  Charging runs through a slot in the side of the shell, so the face that touches
                  the skin carries no port.
                </span>
              </Item>
              <Item marker="none" className="border-t border-rule pt-3">
                <span className="block font-display text-ui font-bold text-ink">
                  The reading is scored on the patch
                </span>
                <span className="mt-1 block text-sec text-ink-2">
                  Readings become z-scores against the wearer’s own fourteen-day baseline and
                  run through the {SCORE} model on the device.
                </span>
              </Item>
            </List>
          </div>
        </div>
      </Section>

      {/* Instructions, not marketing: this is the part a reader needs when the
          happy path has already failed. Every quoted line is a string from
          lib/engine.js. */}
      <Section name="When it does not work" tone="paper">
        <SectionHead className="mt-2 max-w-[26ch]">If it will not connect</SectionHead>
        <SectionLede>
          Each line in a frame below is the message the app itself returns, word for word. None of
          them leaves you without a {SCORE}.
        </SectionLede>
        <ul className="m-0 mt-7 grid list-none gap-4 p-0 lg:mt-9 lg:grid-cols-2 lg:gap-5">
          {TROUBLE.map((t, i) => (
            <li key={t.title}>
              <ScrollRow index={i} className="h-full">
                <Card className="flex h-full flex-col p-5 lg:p-6">
                  <h3 className="font-display text-row font-bold leading-tight text-ink">
                    {t.title}
                  </h3>
                  {/* Quoted, so it is recognisable when a reader is looking at
                      it on their own screen. Mono and ruled rather than
                      coloured: warn would fail on one of this page's grounds. */}
                  <p className="mt-3 border-l-2 border-ruling pl-3 font-mono text-fine text-ink-2">
                    {t.seen}
                  </p>
                  <dl className="m-0 mt-4">
                    <dt className="font-display text-tick font-bold text-ink">Why</dt>
                    <dd className="m-0 mt-1 text-sec text-ink-2">{t.why}</dd>
                    <dt className="mt-3.5 font-display text-tick font-bold text-ink">What to do</dt>
                    <dd className="m-0 mt-1 text-sec text-ink-2">{t.fix}</dd>
                  </dl>
                </Card>
              </ScrollRow>
            </li>
          ))}
        </ul>
      </Section>

      {/* The no-patch route is what makes the wireless point stronger rather
          than weaker: there is nothing to plug in because there is nothing you
          have to have. One short block, at the end, on purpose. */}
      <Section tone="paper" tight className="bg-aqua">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
          <div className="min-w-0">
            <SectionHead className="mt-0 max-w-[24ch]">No patch, still a {SCORE}</SectionHead>
            <p className="mt-3 max-w-[46ch] text-sec text-ink-2">
              The app returns a {SCORE} with no hardware at all: the phone camera and microphone,
              or {ITEMS.length} questions.
            </p>
          </div>
          <Button onClick={() => go && go('without-patch')}>
            Take a reading without the patch<ArrowRight aria-hidden/>
          </Button>
        </div>
      </Section>
    </main>
  )
}
