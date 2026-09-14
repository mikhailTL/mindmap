import React from 'react'
import { ScrollIn, ScrollRow, RevealLines, Tally } from '../s21/motion'
import { Button } from '../ui/button'
import { RAINBOW } from '../lib/sensors'
import { cn } from '../lib/utils'

/* This replaced a page called "All features", which was a list of everything
   the product does with no order of importance — the least useful thing to put
   in front of someone with four minutes and a scoring rubric.
 *
 * A judge needs four things, in this order: see it work, try it themselves,
 * know which parts are real, and know what is missing. The last one is the
 * reason this page exists. Every demo claims to work; almost none of them say
 * where they stop. */

const TRY = [
  { to:'check',   n:'01', h:'Take a reading, right now',
    p:'Six questions, scored by the same model the patch uses. About thirty seconds, no hardware.' },
  { to:'student', n:'02', h:'See what a student sees',
    p:'One number, one sentence, and four signals you can open.' },
  { to:'pro',     n:'03', h:'See what a counselor sees',
    p:'Eight students ranked by how fast they are changing, and the consent record behind each one.' },
]

const REAL = [
  ['The scoring engine',   'Real',  'Runs in your browser. The six-question route computes a live score; nothing is looked up.'],
  ['The CAD model',        'Real',  'Our own Onshape export, rendered in three.js. Three printed parts.'],
  ['The Bluetooth pairing','Real',  'Web Bluetooth against the Nordic UART service the firmware advertises.'],
  ['Student readings',     'Demo',  'Generated from the model. No child was measured to build any screen here.'],
  ['The caseload',         'Demo',  'Eight generated students. The consent rules that govern them are enforced in code.'],
  ['The film\u2019s footage',  'Demo',  'The three photographic shots in the film are generated from our own stills. The screen recording is not.'],
  ['A built unit',         'None',  'There is no photograph of an assembled patch on this site, because there is not one yet.'],
  ['Validation data',      'None',  'The scoring model has not been tested against a clinical instrument.'],
]

const STACK = [
  ['XIAO nRF52840 Sense',  'Motion sensor, microphone and the Bluetooth radio, in the electronics pod.'],
  ['PPG · EDA · temp',     'Pulse, sweat and skin temperature through the base ring, once a second.'],
  ['React 18 · Tailwind',  'The app you are reading. Nine routes, no framework beyond Vite.'],
  ['Robust z-scores',      'Every signal measured against that person’s own fourteen-day median, never a population.'],
]

function Tag({ kind }) {
  const tone = { Real:'border-calm text-calm', Demo:'border-warn text-warn', None:'border-ink-3 text-ink-3' }[kind]
  return (
    <span className={cn('inline-block shrink-0 rounded-full border px-2.5 py-0.5 font-mono text-label',
      'uppercase tracking-[0.12em]', tone)}>{kind}</span>
  )
}

export function Demo({ go }) {
  return (
    <main>
      <div className="relative overflow-hidden border-b border-rule bg-sage">
        <div className="wrap relative py-10 sm:py-14">
          <p className="lab">Judge demo</p>
          <RevealLines as="h1" className="mt-3 max-w-[18ch] font-display font-bold text-sect text-ink"
            lines={['Four minutes,', 'start to finish.']}/>
          <p className="mt-5 max-w-[58ch] text-lead text-ink-2">
            Watch it run, then try it yourself. Everything on this site is listed below as real,
            demonstration, or not built yet.
          </p>
        </div>
      </div>

      <section className="wrap py-10 sm:py-14">
        <h2 className="lab font-normal">The film</h2>
        <ScrollIn className="mt-4">
          <figure className="m-0">
            <video className="block w-full rounded-xs border border-rule bg-ink"
              controls preload="metadata" playsInline poster="/photos/hero.jpg">
              <source src="/mindmap-explainer.mp4" type="video/mp4"/>
              <p className="p-6 text-body text-paper">Your browser cannot play this clip.</p>
            </video>
            <figcaption className="mt-3 max-w-[70ch] text-sec text-ink-2">
              Forty seconds. What the patch reads, what the app says, and who sees it.
            </figcaption>
          </figure>
        </ScrollIn>

        <h2 className="lab mt-12 font-normal">The product, unedited</h2>
        <ScrollIn className="mt-4">
          <figure className="m-0">
            <video className="block w-full rounded-xs border border-rule bg-ink"
              controls preload="metadata" playsInline poster="/photos/flatlay.jpg">
              <source src="/walkthrough.mp4" type="video/mp4"/>
              {/* only rendered if <video> is unsupported, but it still inherits
                  ink on the player's dark ground unless it says otherwise */}
              <p className="p-6 text-body text-paper">Your browser cannot play this clip. The three
                buttons below do the same thing, live.</p>
            </video>
            <figcaption className="mt-3 max-w-[70ch] text-sec text-ink-2">
              Recorded off this site in one pass, nothing cut: the overview, a student opening a
              signal, a live reading scored from six answers, the counselor board and its consent
              ledger, then the patch taken apart.
            </figcaption>
          </figure>
        </ScrollIn>
      </section>

      <section className="wrap pb-12 sm:pb-16">
        <h2 className="lab font-normal">Or drive it yourself</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {TRY.map((t, i) => (
            <ScrollRow key={t.to} index={i} className="h-full">
              <button onClick={() => go(t.to)}
                className="group flex h-full w-full flex-col justify-between gap-10 rounded-xs border
                  border-rule bg-paper p-6 text-left transition-[border-color,box-shadow,transform]
                  duration-200 hover:-translate-y-0.5 hover:border-ink hover:shadow-raise">
                <span>
                  <span className="font-mono text-label text-ink-3">{t.n}</span>
                  <span className="mt-3 block font-display text-head font-bold tracking-tight text-ink">{t.h}</span>
                  <span className="mt-2.5 block max-w-[32ch] text-sec text-ink-2">{t.p}</span>
                </span>
                <span className="flex items-center gap-2 font-display text-meta font-medium text-accent">
                  Open
                  <svg viewBox="0 0 20 20" aria-hidden
                    className="size-4 transition-transform duration-200 group-hover:translate-x-1">
                    <path d="M3 10h13M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              </button>
            </ScrollRow>
          ))}
        </div>
      </section>

      <section className="border-y border-rule bg-sage">
        <div className="wrap grid gap-x-10 gap-y-8 py-11 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { n:4,  s:'',      l:'Signals',            p:'Heart, sweat, temperature, movement.' },
            { n:1,  s:'Hz',    l:'Sample rate',        p:'Once a second, all day.' },
            { n:30, s:'s',     l:'Score interval',     p:'Recomputed from the previous minute.' },
            { n:14, s:'',      l:'Days of baseline',   p:'Their own history, never a population.' },
          ].map((f, i) => (
            <ScrollRow key={f.l} index={i}>
              <p className="font-mono font-medium tabular-nums text-fig leading-none text-ink">
                <Tally to={f.n} suffix={f.s}/></p>
              <p className="mt-3 font-display text-row font-bold text-ink">{f.l}</p>
              <p className="mt-1.5 max-w-[26ch] text-sec text-ink-2">{f.p}</p>
            </ScrollRow>
          ))}
        </div>
      </section>

      <section className="wrap py-12 sm:py-16">
        <h2 className="font-display font-bold text-sub tracking-tight text-ink">
          What is real, what is a demonstration, what is not built</h2>
        <p className="mt-3 max-w-[66ch] text-sec text-ink-2">
          Judges have to work this out for themselves on most submissions. Here it is.
        </p>
        <ul className="mt-7 list-none border-t border-ink p-0">
          {REAL.map(([what, kind, why], i) => (
            <ScrollRow as="li" key={what} index={i}
              className="grid gap-x-6 gap-y-2 border-b border-rule py-4
                sm:grid-cols-[minmax(0,15rem)_5.5rem_minmax(0,1fr)] sm:items-baseline">
              <span className="font-display text-row font-bold text-ink">{what}</span>
              <Tag kind={kind}/>
              <span className="text-sec text-ink-2">{why}</span>
            </ScrollRow>
          ))}
        </ul>
      </section>

      <section className="wrap pb-14 sm:pb-20">
        <h2 className="lab font-normal">What it is made of</h2>
        <div className="mt-4 grid gap-x-10 gap-y-5 sm:grid-cols-2">
          {STACK.map(([h, p], i) => (
            <ScrollRow key={h} index={i} className="border-t border-rule pt-4">
              <p className="font-display text-row font-bold text-ink">{h}</p>
              <p className="mt-1.5 max-w-[40ch] text-sec text-ink-2">{p}</p>
            </ScrollRow>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {RAINBOW.map(s => (
            <span key={s.id} className="inline-flex items-center gap-2 rounded-full border border-rule
              bg-paper px-3 py-1.5 text-meta text-ink">
              <span aria-hidden className="size-2.5 rounded-full" style={{ background: s.glow }}/>
              {s.name}
            </span>
          ))}
        </div>
        <div className="mt-9 flex flex-wrap gap-3">
          <Button onClick={() => go('patch')}>See the hardware</Button>
          <Button variant="outline" onClick={() => go('privacy')}>See who can see what</Button>
        </div>
      </section>
    </main>
  )
}
