import React from 'react'
import { Section, SectionHead } from '../ui/section'
import { ScrollIn, ScrollRow } from '../ui/motion'
import { Button } from '../ui/button'
import { List, Item } from '../ui/list'
import { ArrowRight } from '../ui/marks'
import { DataFlow, MovementFallback, ThreeSteps, WhereItRuns } from '../charts/architecture'
import { CONTEXT_WINDOWS, FEATURES, PARAM_COUNT } from '../signals/tnam'
import { TNAM_RESULTS as R } from '../signals/tnam-results'
import { MOVE_LIMIT_G } from '../signals/motion'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { PRO_LC, SCORE, SCORE_RANGE } from '../lib/terms'
import { cn } from '../lib/utils'

/* Where the Mind Score comes from, for a reader who will not open the
 * repository.
 *
 * THIS PAGE IS AN INSTRUMENT PANEL, NOT AN ESSAY. It was 11,200px of single
 * column prose, three times the whole landing page, and a judge with forty
 * entries to score read none of it. Every claim that was a paragraph is now a
 * labelled value or a short list inside its own card, three columns wide at
 * 1280. The facts did not change; the shape carrying them did. If a figure
 * below looks like it wants a sentence around it, the sentence was the problem.
 *
 * THE RULE THIS PAGE IS WRITTEN UNDER. Every figure about the model is read out
 * of src/signals/tnam-results.js as the page renders, and the file or path it
 * came from is named on the card beside it, so a reader who doubts a number can
 * open one file and find it. Nothing is typed from memory.
 *
 * The model is trained on people, which makes the card stronger and the limits
 * heavier at the same time. Both halves have to stay the same size, so the
 * limits were given shorter containers and not weaker content: they sit at the
 * same type size as the results, there are five of them against nine capability
 * rows, and the two worst are quoted in the headline card at the top of the
 * page rather than left at the bottom. A judge who finds either of them hidden
 * costs this project more than the headline figure earns it. Do not soften
 * "ranks it backwards" into "performs less well".
 */

const f1 = v => v.toFixed(1)
const f2 = v => v.toFixed(2)
const f3 = v => v.toFixed(3)
const pct = v => Math.round(v * 100) + '%'
const pct1 = v => (v * 100).toFixed(1) + '%'

/* The check-in count the calibration card quotes, located in the results
   file's own list rather than assumed to be at a fixed index. */
const ASKS = 8
const K8 = R.calibration.ks.indexOf(ASKS)

/* The temporal term reads the preceding windows. The 30 second hop is stated
   in R.task, so the minutes are arithmetic rather than a typed figure. */
const HOP_S = 30
const CONTEXT_MINUTES = (CONTEXT_WINDOWS * HOP_S) / 60

/* What the shipped movement fallback costs and buys, both computed off
   R.confound so neither can drift from the bars the movement figure draws. */
const CAUGHT_COST = (R.confound.tnam_raw.cognitive_caught
  - R.confound.tnam_fallback.cognitive_caught) * 100
const FALSE_GAIN = (R.confound.tnam_raw.physical_flagged
  - R.confound.tnam_fallback.physical_flagged) * 100

/* ── the page's two containers ────────────────────────────────────────────
   Section 2 of the design spec: no text sits on a tinted band. These are the
   only grounds text lands on, and they are the shape the figures in
   charts/architecture already use, so a fact card and a chart read as one kind
   of object rather than two. */
const CARD = 'rounded-panel border border-rule bg-card px-4 py-3'
const CARD_INK = 'rounded-panel border border-ink-2 bg-ink-2/40 px-4 py-3'
/* A limit keeps the 3px crit rule it carried as a bare block and gains the edge
   section 2 requires. `border` is written first so tailwind-merge cannot drop
   the left width when a caller appends a class. */
const CARD_LIMIT = 'rounded-panel border border-rule border-l-[3px] border-l-crit bg-card px-4 py-3'
const TAG = 'font-mono text-tick text-ink-3'
/* A section's opening. The heading sits on the band, which section 2 allows,
   and its one line sits in a container, which section 2 requires. Two columns
   from lg, because 460px of empty band beside a 62ch column is the failure this
   page was rebuilt out of. */
function Head({ title, line, tone = 'paper' }) {
  const ink = tone === 'ink'
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:items-end lg:gap-4">
      <SectionHead tone={tone} className="max-w-[26ch]">{title}</SectionHead>
      <div className={ink ? CARD_INK : CARD}>
        <p className={cn('text-sec leading-[1.35]', ink ? 'text-mist' : 'text-ink-2')}>{line}</p>
      </div>
    </div>
  )
}

/* A heading inside a band, for the second figure in a band that carries two.
   A band per figure cost 190px of its own padding, label and lede each time,
   and section 1 says a band that is mostly air merges with its neighbour. */
const Mark = ({ children }) => <h2 className="mark mt-4">{children}</h2>

/* One fact of the model card. `label` is the row name the old <dl> carried and
   `right` is the provenance, which belongs on the card rather than inside a
   sentence. `note` pins itself to the bottom so two cards in a grid row end
   level. */
function Fact({ label, right, note, className, children }) {
  return (
    <div className={cn(CARD, 'flex h-full min-w-0 flex-col', className)}>
      <p className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className={TAG}>{label}</span>
        {right && <span className={cn(TAG, 'text-right')}>{right}</span>}
      </p>
      <div className="mt-2">{children}</div>
      {note && <p className="mt-auto pt-2 text-fine leading-[1.35] text-ink-3">{note}</p>}
    </div>
  )
}

/* A limit. Same object as a Fact, with the crit rule and a bold first line, so
   it reads as the same weight of claim and not as a footnote. */
function Limit({ title, right, note, children }) {
  return (
    <div className={cn(CARD_LIMIT, 'flex h-full min-w-0 flex-col')}>
      <p className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className={TAG}>Known limit</span>
        {right && <span className={cn(TAG, 'text-right')}>{right}</span>}
      </p>
      <p className="mt-1 font-display text-ui font-bold leading-[1.25] text-ink">{title}</p>
      <div className="mt-2">{children}</div>
      {note && <p className="mt-auto pt-2 text-fine leading-[1.35] text-ink-3">{note}</p>}
    </div>
  )
}

/* Label and figure on one line. Section 3: the label sits beside the number,
   never under it. `sub` is an interval rather than a label, so it may follow
   the figure and wrap away from it on a narrow card. */
function KV({ k, v, sub }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-rule pt-1
      first:border-t-0 first:pt-0">
      <span className="min-w-0 text-fine leading-[1.35] text-ink-2">{k}</span>
      <span className="min-w-0 text-right">
        <span className="font-mono text-meta tabular-nums text-ink">{v}</span>
        {sub && <span className="ml-1.5 font-mono text-fine tabular-nums text-ink-3">{sub}</span>}
      </span>
    </div>
  )
}
const KVs = ({ children, className }) => (
  <div className={cn('flex flex-col gap-1', className)}>{children}</div>
)

/* A figure that has to beat the labels around it: text-row, mono, tabular,
   label beside it. */
function Big({ v, label, sub }) {
  return (
    <div className="min-w-0">
      <p className="flex items-baseline gap-2">
        <span className="font-mono text-row tabular-nums text-ink">{v}</span>
        <span className="min-w-0 text-fine leading-[1.25] text-ink-2">{label}</span>
      </p>
      {sub && <p className="mt-0.5 font-mono text-fine tabular-nums text-ink-3">{sub}</p>}
    </div>
  )
}

/* Two systems against one measure, which is how every comparison on this page
   is quoted. A bare mean beside a bare mean is the oldest way to make a
   difference look settled, so the interval goes on the AUROC rows. */
function Versus({ label, rows }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-3 gap-y-1 sm:gap-x-5">
      <span className={TAG}>{label}</span>
      <span className={cn(TAG, 'text-right')}>Formula</span>
      <span className={cn(TAG, 'text-right')}>Model</span>
      {rows.map(([k, a, b]) => (
        <React.Fragment key={k}>
          <span className="min-w-0 border-t border-rule pt-1 text-fine leading-[1.35] text-ink-2">{k}</span>
          <span className="border-t border-rule pt-1 text-right font-mono text-meta tabular-nums text-ink-2">
            {f3(a)}
          </span>
          <span className="border-t border-rule pt-1 text-right font-mono text-meta tabular-nums text-ink">
            {f3(b)}
          </span>
        </React.Fragment>
      ))}
    </div>
  )
}

/* Short statements, which is what the paragraphs became. text-meta is the
   spec's body size inside a card, and a limit is set at it too: a limit smaller
   than the result it qualifies is one somebody chose not to have read. */
const Lines = ({ items, className, tone = 'text-ink-2' }) => (
  <List className={cn('gap-1', className)}>
    {items.map(t => (
      <Item key={t} className={cn('text-meta leading-[1.4]', tone)}>{t}</Item>
    ))}
  </List>
)

const INTENDED = [
  `One person, against their own baseline.`,
  `One ${SCORE}, ${SCORE_RANGE}.`,
  'The signal that moved it most.',
  '50 is an ordinary day for them.',
  'A student project: Congressional App Challenge, Conrad Challenge.',
]

const OUT_OF_SCOPE = [
  'Diagnosis, screening or triage.',
  'Any clinical cut-off.',
  'Comparing one person with another.',
  'Telling one kind of distress from another.',
  'Deciding anything by itself.',
]

const WOULD_CHANGE = [
  ['1', 'The adolescent pilot reporting', 'The people this is for, in the figures at last.'],
  ['2', 'A dataset with an emotional condition',
    'The one failure that is a gap in the data rather than in the method.'],
  ['3', 'Readings off the patch itself', 'Rather than a wrist device, which is what it assumes.'],
]

/* Each route's status is read off the code, not off intent. The patch card is
   the one a judge checks first, so it says what the pairing code actually does
   and then stops. */
const ROUTES = [
  { route: 'The patch', today: 'Not running',
    measures: ['Pulse, sweat, skin temperature, movement.',
      `Off the upper arm, once a second. The four the model’s ten features come from.`],
    cannot: ['Nothing yet. No unit has been assembled, so there is no signal to read.'],
    code: 'lib/engine.js can open a pairing request against the service the firmware advertises, and that is all. No patch frame is parsed in this repository.' },
  { route: 'Phone camera and microphone', today: 'Running',
    measures: ['Rear camera, 30 s: heart rate, beat variation.',
      'Speech, 15 s: pitch, range, two steadiness measures. Accelerometer: peak movement.'],
    cannot: [`Fill the model. It reaches two of the ten features; the other eight enter at the person’s usual.`],
    code: 'Those were a wrist sensor on an adult, not a phone camera on a teenager. The one route a stranger can take in the next minute, with no account.' },
  { route: 'Six questions', today: 'Running',
    measures: ['Six answers, five-point scale: body tension, on edge, sleep against usual, energy, focus, what the day has asked.'],
    cannot: ['Anything about the body. It is what the person says, with every floor a self-report carries.'],
    code: 'lib/engine.js puts the six through a logistic with the same constant, 2.4, and the same four bands, so all three land on one dial.' },
]

/* Published figures only, each beside its own source. Nothing is added here
   that is not already sourced in this repository: the statistics are the two
   entries src/charts/problem.jsx names, the instrument is the one
   src/survey/questions.js implements, and the two datasets are named as
   docs/tnam-handoff.md names them. */
const SOURCES = [
  { title: 'The dataset the model is fitted on',
    cite: 'WESAD. docs/tnam-handoff.md; training code in the Conrad repo under ml/',
    body: `${R.per_subject.length} adults, wrist sensors, stress against baseline and amusement,
      60 s windows at a ${HOP_S} s hop, leave one subject out. Protocol string: R.task.` },
  { title: 'The transfer and calibration dataset',
    cite: 'PhysioNet Non-EEG. docs/tnam-handoff.md',
    body: `${R.transfer.subjects} people the model never saw, under stressors it was never fitted
      on. Source of the ${f3(R.transfer.cognitive.tnam.mean)}, the calibration gain and the
      emotional failure.` },
  { title: 'The two statistics on the overview',
    href: 'https://www.cdc.gov/yrbs/youth-health-in-focus/mental-health.html',
    cite: 'CDC, Youth Risk Behavior Survey, 2023',
    body: `40% of US high school students felt persistently sad or hopeless for two weeks or more
      and 20% seriously considered attempting suicide: 39.7% and 20.4% as surveyed. The first read
      30% in 2013, per the YRBS trends report.` },
  { title: 'The treatment gap',
    href: 'https://www.nimh.nih.gov/health/statistics/major-depression',
    cite: 'NIMH, Major Depression, from NSDUH 2021',
    body: `1 in 5 US adolescents aged 12 to 17, 20.1%, had a major depressive episode in the past
      year; 3 in 5 of them, 59.4%, got no treatment. No trend: NSDUH cannot be spliced across its
      2020 redesign.` },
  { title: 'The usability instrument',
    cite: 'Brooke, System Usability Scale, 1986. Grade curve: Sauro and Lewis',
    body: `Ten statements on five-point agreement, alternating in direction, verbatim and in
      published order in src/survey/questions.js. Positive items answer minus 1, negative 5 minus
      answer, summed, times 2.5. 0 to 100, not a percentage. Published mean 68.` },
  { title: 'The mark on the dial',
    href: 'https://doi.org/10.2196/jmir.8889',
    cite: 'Zikmund-Fisher et al., J Med Internet Res, 2018, 20(3):e98',
    body: `Shown a near-normal lab result against a labelled threshold rather than a bare scale,
      the share of 1,618 adults who would contact a doctor urgently fell from about half to about
      a third. For extreme values it made no difference.` },
  { title: 'Why nobody is ranked, and why every share switches off',
    href: 'https://doi.org/10.1037/0033-2909.130.3.355',
    cite: 'Dickerson and Kemeny, Psychological Bulletin, 2004, 130(3):355-391',
    body: `Across 208 laboratory studies, being judged by other people carried d = 0.67 against
      d = 0.15 without it, and an uncontrollable stressor d = 0.52 against d = 0.16.` },
  { title: 'The reading grade, measured',
    href: 'https://doi.org/10.2196/69955',
    cite: 'Will et al., J Med Internet Res, 2025, 27:e69955. tools/readability',
    body: `Guidance for patient material is a sixth-grade reading level. This site measures 4.5 on
      Flesch-Kincaid and 7.4 on SMOG. Both are given: SMOG lands two to three grades above it by
      construction.` },
  { title: 'The accessibility bar',
    href: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum',
    cite: 'WCAG 2.1, Contrast (Minimum) 1.4.3 AA, and Animation from Interactions 2.3.3 AAA',
    body: `Every text node on every route clears 4.5 : 1, verified in a real browser on a
      production build. All motion honours the system reduced-motion setting, which is the AAA
      criterion.` },
]

/* Three to a column. Nine separate boxes left a ragged bottom edge on every
   row and paid nine card paddings for what is, honestly, a bibliography: one
   container per column with a hairline between entries is the same information
   240px shorter. */
const SOURCE_COLS = [SOURCES.slice(0, 3), SOURCES.slice(3, 6), SOURCES.slice(6)]

const NOT_CLAIMED = [
  'No colour-psychology claim appears anywhere on this site.',
  `Nothing here says MindMap lowers anybody’s stress.`,
  'It has not been tested on a teenager, and nothing claims it has.',
]

export function Methods({ go }) {
  return (
    <main>

      {/* ── the plain reading, the two figures that qualify it, and the three
          ways in. One band: each of the three was a figure under its own lede
          under its own label, which section 1 calls a band that is mostly air. */}
      <section className="border-t border-rule bg-paper">
        <div className="wrap py-7 lg:py-10">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,29rem)] lg:items-start lg:gap-4">
            <div className="min-w-0">
              <p className="font-mono text-body font-bold tracking-[0.005em] text-accent">
                How it works
              </p>
              <h1 className="mt-2.5 max-w-[22ch] font-display font-bold text-major leading-[1.05]
                tracking-tight text-ink">
                Where the {SCORE} comes from
              </h1>
              {/* Controls, not prose: a button carries its own edge, so these
                  sit on the band without breaking section 2. */}
              <div className="mt-3.5 flex flex-wrap gap-2.5">
                <Button variant="outline" size="sm" onClick={() => go('site')}>
                  Drag the model figure<ArrowRight aria-hidden/>
                </Button>
                <Button variant="outline" size="sm" onClick={() => go('check')}>
                  Take a reading<ArrowRight aria-hidden/>
                </Button>
              </div>
            </div>

            {/* The headline and the two failures in one card, so neither half of
                the claim can be read without the other. */}
            <div className={CARD}>
              <p className="text-sec leading-[1.35] text-ink-2">
                Three steps, then the detail behind each one.
              </p>
              <p className={cn(TAG, 'mt-2 flex items-baseline justify-between gap-3',
                'border-t border-rule pt-2')}>
                <span>Headline figures, AUROC</span>
                <span>tnam-results.js</span>
              </p>
              <KVs className="mt-1.5">
                <KV k="Fitted data, held out" v={f3(R.summary.tnam.auroc.mean)}/>
                <KV k="The hand formula" v={f3(R.summary.formula.auroc.mean)}/>
                <KV k="New stressor, zero shot" v={f3(R.transfer.cognitive.tnam.mean)}/>
                <KV k={`Then ${ASKS} check-ins`} v={f3(R.calibration.auroc.gains.triggered[K8])}/>
                <KV k="Emotional, below rest" v={f3(R.transfer.emotional.tnam.mean)}/>
              </KVs>
              <p className="mt-2 text-fine leading-[1.35] text-crit">
                The last row is a failure, not a near miss. Every figure read at render.
              </p>
            </div>
          </div>

          <ThreeSteps className="mt-3"/>

          <Mark>Three routes to one number, and which of them runs today</Mark>
          <ul className="m-0 mt-3 grid list-none gap-3 p-0 lg:grid-cols-3 lg:gap-4">
            {ROUTES.map((r, i) => (
              <ScrollRow key={r.route} index={i} as="li" className="min-w-0">
                <div className={cn(CARD, 'flex h-full min-w-0 flex-col')}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <h3 className="font-display text-row font-bold leading-[1.2] tracking-tight text-ink">
                      {r.route}
                    </h3>
                    {/* The rule carries the colour and the word carries the
                        state. warn measures 4.50 : 1 on the aqua-2 ground this
                        card used to sit on, under the 4.5 text floor and over
                        the 3 : 1 a graphic needs, so it stays on the rule and
                        never on the type wherever the card is moved. */}
                    <p className={cn('inline-flex items-baseline border-l-2 pl-2 text-fine text-ink',
                      r.today === 'Running' ? 'border-accent' : 'border-warn')}>
                      {r.today}
                    </p>
                  </div>
                  <p className={cn(TAG, 'mt-2')}>Measures</p>
                  <Lines className="mt-1" items={r.measures}/>
                  <p className={cn(TAG, 'mt-2 border-t border-rule pt-2')}>Cannot</p>
                  <Lines className="mt-1" items={r.cannot}/>
                  {r.route === 'Phone camera and microphone' && (
                    <KVs className="mt-2">
                      <KV k="Heart features only: formula"
                        v={f3(R.ppg_only.formula.auroc.mean)}/>
                      <KV k="The same, the model" v={f3(R.ppg_only.tnam.auroc.mean)}/>
                    </KVs>
                  )}
                  <p className="mt-auto pt-2 text-fine leading-[1.35] text-ink-3">{r.code}</p>
                </div>
              </ScrollRow>
            ))}
          </ul>

          <ScrollIn className="mt-3">
            <div className={cn(CARD, 'lg:flex lg:items-start lg:gap-5')}>
              <div className="min-w-0 lg:flex-1">
                <p className={cn(TAG, 'flex flex-wrap items-baseline justify-between gap-x-3')}>
                  <span>The voice weights, on the phone route</span>
                  <span>signals/score.js</span>
                </p>
                <Lines className="mt-1.5" items={[
                  'The heart terms go through the model. The voice terms do not.',
                  'No public dataset pairs a camera-and-microphone capture with stress labels, so the four voice weights are a starting allocation, fitted to nothing. The band comes back wider for it.',
                ]}/>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2.5 lg:mt-0 lg:shrink-0">
                <Button variant="outline" size="sm" onClick={() => go('without-patch')}>
                  The phone route<ArrowRight aria-hidden/>
                </Button>
                <Button variant="outline" size="sm" onClick={() => go('tour')}>
                  Real, or a demo<ArrowRight aria-hidden/>
                </Button>
              </div>
            </div>
          </ScrollIn>
        </div>
      </section>

      {/* ── the model card, and the movement limit that belongs to it ─────
          Movement had its own band under its own lede. It is a known limit of
          this model, so it sits under the card it qualifies. */}
      <Section name="The model, and the six places it fails" tone="card" className="bg-aqua-2">
        <Head title="Model Card"
          line="What it is for, what it was trained on, and the six places it fails."/>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:gap-4 xl:grid-cols-3">
          <ScrollRow index={0} className="min-w-0">
            <Fact label="Intended use" right={`${SCORE}, ${SCORE_RANGE}`}>
              <Lines items={INTENDED}/>
            </Fact>
          </ScrollRow>

          <ScrollRow index={1} className="min-w-0">
            <Fact label="Out of scope" right={`${OUT_OF_SCOPE.length} things it is not`}
              note="Not a medical device. Every input is a distance from one person's own baseline.">
              <Lines items={OUT_OF_SCOPE}/>
            </Fact>
          </ScrollRow>

          <ScrollRow index={2} className="min-w-0">
            <Fact label="Inputs" right={`${FEATURES.length} features per reading`}
              note="A signal it cannot read enters at 0, at your usual. Its evidence is gone and the band widens.">
              <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                {SENSOR_ORDER.map(id => (
                  <li key={id} className="rounded-chip border border-rule bg-paper px-2.5
                    text-fine text-ink">
                    {SENSORS[id].name.toLowerCase()}
                  </li>
                ))}
              </ul>
              <KVs className="mt-2">
                <KV k="Scale, per signal" v="own baseline" sub="14 d"/>
                <KV k="An ordinary day" v="0"/>
                <KV k="Clamp, signals/score.js" v="plus or minus 3"/>
                <KV k="Movement, patch scale" v="1" sub={`${MOVE_LIMIT_G} g`}/>
              </KVs>
            </Fact>
          </ScrollRow>

          <ScrollRow index={3} className="min-w-0">
            <Fact label="Architecture" right="Temporal Neural Additive Model"
              note="Additive, so the overview breakdown is the model's own arithmetic, exactly.">
              <KVs>
                <KV k="Weights, counted from the file"
                  v={PARAM_COUNT.toLocaleString('en-US')}/>
                <KV k="Terms" v="bias, a curve per signal, one over time"/>
                <KV k="Context" v={`${CONTEXT_WINDOWS} windows`} sub={`${CONTEXT_MINUTES} min`}/>
                <KV k="Anything else" v="nothing"/>
              </KVs>
            </Fact>
          </ScrollRow>

          <ScrollRow index={4} className="min-w-0">
            <Fact label="Training data" right="WESAD, public"
              note="A public dataset with a named protocol. The protocol string is R.task.">
              <KVs>
                <KV k="Subjects" v={R.per_subject.length} sub="adults"/>
                <KV k="Sensors" v="wrist"/>
                <KV k="Windows" v={`60 s at a ${HOP_S} s hop`}/>
                <KV k="Conditions" v="stress, baseline, amusement"/>
                <KV k="Held out" v={`leave one subject out, ${R.per_subject.length} times`}/>
              </KVs>
            </Fact>
          </ScrollRow>

          <ScrollRow index={5} className="min-w-0">
            <Limit title="Every subject is an adult. No patch exists."
              right="On the card beside this"
              note="Teenagers are the only people this product is for.">
              <Lines items={[
                'The adolescent pilot has not reported.',
                'No teenager is in any figure here. The sensors were on a wrist.',
                'No patch has been built or worn, at any age. Every patch figure is generated.',
              ]}/>
            </Limit>
          </ScrollRow>

          <ScrollRow index={6} className="min-w-0 sm:col-span-2 xl:col-span-3">
            <Fact label="Evaluation, on the data it was fitted on"
              right={`Leave one subject out, ${R.summary.tnam.auroc.n} people, R.summary`}
              note="The model interval reaches above 1, an artefact of the interval and not a claim: read it as a ceiling. Held out by person, not by stressor, sensor or age.">
              <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                <div className="grid gap-2 sm:gap-3">
                  <Big v={f3(R.summary.formula.auroc.mean)} label="Hand formula, AUROC"
                    sub={`${f3(R.summary.formula.auroc.lo)} to ${f3(R.summary.formula.auroc.hi)}`}/>
                  <Big v={f3(R.summary.tnam.auroc.mean)} label="The model, AUROC"
                    sub={`${f3(R.summary.tnam.auroc.lo)} to ${f3(R.summary.tnam.auroc.hi)}`}/>
                </div>
                <Versus label="Also, same split" rows={[
                  ['Balanced accuracy', R.summary.formula.bacc.mean, R.summary.tnam.bacc.mean],
                  ['F1', R.summary.formula.f1.mean, R.summary.tnam.f1.mean],
                  ['Heart features only, all a camera reaches',
                    R.ppg_only.formula.auroc.mean, R.ppg_only.tnam.auroc.mean],
                ]}/>
                <KVs>
                  <KV k="People the model is better on, R.paired"
                    v={`${R.paired.wins} of ${R.per_subject.length}`} sub="none worse"/>
                  <KV k="Ties" v={R.paired.ties}/>
                  <KV k="p, paired across people" v={R.paired.p}/>
                </KVs>
              </div>
            </Fact>
          </ScrollRow>

          <ScrollRow index={7} className="min-w-0">
            <Fact label="Personal calibration"
              right={`${R.transfer.subjects} new people, R.calibration`}
              note="Asked when the band changes. Fitted on this device from answers held on it, and a moving reading is never a label.">
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                <Big v={f3(R.calibration.base_auroc.mean)} label="Before any check-in"
                  sub={`${f3(R.calibration.base_auroc.lo)} to ${f3(R.calibration.base_auroc.hi)}`}/>
                <Big v={f3(R.calibration.auroc.gains.triggered[K8])}
                  label={`After ${ASKS} check-ins`}
                  sub={`${f3(R.calibration.auroc_ci.gains.triggered[K8][0])} to ${f3(R.calibration.auroc_ci.gains.triggered[K8][1])}`}/>
              </div>
              <KVs className="mt-2">
                <KV k={`Balanced accuracy, same ${ASKS}`}
                  v={`${f3(R.calibration.base_bacc.mean)} to ${f3(R.calibration.bacc.gains.triggered[K8])}`}/>
                <KV k="Control: a model from scratch"
                  v={f3(R.calibration.auroc.scratch.triggered[K8])}/>
                <KV k="Control: asked on a schedule"
                  v={f3(R.calibration.auroc.gains.scheduled[K8])}/>
                <KV k="Control: threshold alone, where it began"
                  v={f3(R.calibration.auroc.affine.triggered[K8])}/>
              </KVs>
            </Fact>
          </ScrollRow>

          <ScrollRow index={8} className="min-w-0">
            <Limit title="It does not detect emotional distress. It ranks it backwards."
              right={`${R.transfer.subjects} people, R.transfer`}
              note="Nothing here should be read as saying MindMap sees how somebody feels.">
              <KVs>
                <KV k="Emotional condition, the model"
                  v={f3(R.transfer.emotional.tnam.mean)}
                  sub={`${f3(R.transfer.emotional.tnam.lo)} to ${f3(R.transfer.emotional.tnam.hi)}`}/>
                <KV k="The hand formula, which failed too"
                  v={f3(R.transfer.emotional.formula.mean)}/>
              </KVs>
              <Lines className="mt-2" items={[
                'Below 0.5 is not a miss. It ordered those windows as calmer than rest.',
              ]}/>
            </Limit>
          </ScrollRow>

          <ScrollRow index={9} className="min-w-0">
            <Limit title="Zero shot on a new stressor, no better than the formula."
              right="R.transfer"
              note={`Pooled is near enough to chance to call it chance. The ${f3(R.summary.tnam.auroc.mean)} is on the data it was fitted on; the honest headline is the calibration card.`}>
              <Versus label={`${R.transfer.subjects} new people`} rows={[
                ['Cognitive condition',
                  R.transfer.cognitive.formula.mean, R.transfer.cognitive.tnam.mean],
                ['Pooled over all three',
                  R.transfer.any_stress.formula.mean, R.transfer.any_stress.tnam.mean],
              ]}/>
            </Limit>
          </ScrollRow>

          <ScrollRow index={10} className="min-w-0">
            <Limit title="It does not predict performance, and we checked." right="R.exams"
              note="No relationship at all. A grade is not what this measures.">
              <KVs>
                <KV k="Real exams it was run over" v={R.exams.spearman_flagged_vs_grade.n}/>
                <KV k="Flagged, against the grade"
                  v={`rho ${f2(R.exams.spearman_flagged_vs_grade.rho)}`}
                  sub={`p ${f2(R.exams.spearman_flagged_vs_grade.p)}`}/>
                <KV k="Windows dropped for movement" v={pct(R.exams.motion_rejected)}/>
              </KVs>
            </Limit>
          </ScrollRow>

          <ScrollRow index={11} className="min-w-0">
            <Limit title="The baseline has to be earned." right="scoreCapture"
              note="A first reading on a phone that got no voice is reported wide, and nothing in the interface can narrow it.">
              <Lines items={[
                'A fourteen-day baseline means nothing on day one.',
                `On the phone route a personal spread needs five captures. Under five the spread is borrowed and only the average is the person’s own.`,
              ]}/>
            </Limit>
          </ScrollRow>

          <ScrollRow index={12} className="min-w-0">
            <Fact label="The confidence band, in scoreCapture"
              right="Three shortfalls, in quadrature"
              note="Carried through the logistic by its slope at the score.">
              <KVs>
                <KV k="Share of term weight missing" v="0.55"/>
                <KV k="One minus camera quality" v="0.45"/>
                <KV k="exp of minus baseline days over 6" v="0.75"/>
                <KV k="Clamped to" v="3 to 34" sub="points"/>
              </KVs>
            </Fact>
          </ScrollRow>

          <ScrollRow index={13} className="min-w-0 sm:col-span-2 xl:col-span-3">
            <Fact label="What would change this card" right="In the order they would matter"
              note="Until those exist, this card is the whole claim.">
              <div className="grid gap-2 lg:grid-cols-3 lg:gap-4">
                {WOULD_CHANGE.map(([n, title, line]) => (
                  <div key={n} className="min-w-0 border-t border-rule pt-1.5 lg:border-l
                    lg:border-t-0 lg:pl-3 lg:pt-0 lg:first:border-l-0 lg:first:pl-0">
                    <p className="flex items-baseline gap-2">
                      <span className="font-mono text-meta tabular-nums text-ink-3">{n}</span>
                      <span className="min-w-0 font-display text-ui font-bold leading-[1.2] text-ink">
                        {title}
                      </span>
                    </p>
                    <p className="mt-0.5 text-fine leading-[1.4] text-ink-2">{line}</p>
                  </div>
                ))}
              </div>
            </Fact>
          </ScrollRow>
        </div>

        <Mark>A moving reading is not scored by the model at all</Mark>
        <div className="mt-3 grid gap-3 lg:grid-cols-2 lg:gap-4">
          <ScrollIn className="min-w-0">
            <Fact label="What the code does, in scoreCapture" right="Per reading"
              note={`A limit before it is a feature: the reading is kept, the screen says the person was moving, and it counts as stressed neither way. Every reading past the line takes this branch, so ${MOVE_LIMIT_G} g and 2 g reaching the model as one value never reaches a score.`}>
              <KVs>
                <KV k="Peak movement over the line" v={MOVE_LIMIT_G} sub="g"/>
                <KV k="Heart terms" v="the hand formula branch"/>
                <KV k="Temporal term" v="dropped"/>
                <KV k="The reading" v="marked held"/>
                <KV k="As a calibration label" v="never used"/>
              </KVs>
            </Fact>
          </ScrollIn>

          <ScrollIn className="min-w-0">
            <Fact label="The trade, measured" right="R.confound, real jogging and rest"
              note="The training set had no calm exercise in it, so movement and arousal were never separated. The trade ships, and it is paid both ways.">
              <KVs>
                <KV k="Moving windows called stressed, model alone"
                  v={pct1(R.confound.tnam_raw.physical_flagged)}/>
                <KV k="The same, formula over the line" sub="ships"
                  v={pct1(R.confound.tnam_fallback.physical_flagged)}/>
                <KV k="The same, hand formula alone"
                  v={pct1(R.confound.formula.physical_flagged)}/>
                <KV k="Cognitive stress still caught, model alone"
                  v={pct1(R.confound.tnam_raw.cognitive_caught)}/>
                <KV k="The same, formula over the line" sub="ships"
                  v={pct1(R.confound.tnam_fallback.cognitive_caught)}/>
                <KV k="Cognitive points the fallback costs" v={f1(CAUGHT_COST)}/>
                <KV k="False-alarm points it removes" v={f1(FALSE_GAIN)}/>
              </KVs>
            </Fact>
          </ScrollIn>
        </div>

        <MovementFallback className="mt-3"/>
      </Section>

      {/* ── where the code runs, and what survives a reading. One band: both
          halves answer the same question and each was a figure under a lede. */}
      <Section name="Where it runs, and what is kept" tone="card" className="bg-beam-wash">
        <Head title="No Backend, and Nothing to Call"
          line={`Every part that makes a ${SCORE} runs in the page you are reading.`}/>
        <WhereItRuns className="mt-3"/>

        <Mark>What is measured, what is kept, and who can see it</Mark>
        <DataFlow className="mt-3"/>

        <ScrollIn className="mt-3">
          <div className={cn(CARD, 'lg:flex lg:items-start lg:gap-5')}>
            <div className="min-w-0 lg:flex-1">
              <p className={cn(TAG, 'flex flex-wrap items-baseline justify-between gap-x-3')}>
                <span>What on the console is a demonstration</span>
                <span>lib/caseload.js</span>
              </p>
              <Lines className="mt-1.5" items={[
                `The consent records, the students and the audit entries on the ${PRO_LC} console are written by us.`,
                'The rules they enforce are real code, defined in one place. The people are not real people.',
              ]}/>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2.5 lg:mt-0 lg:shrink-0">
              <Button variant="outline" size="sm" onClick={() => go('privacy')}>
                Who can see what<ArrowRight aria-hidden/>
              </Button>
            </div>
          </div>
        </ScrollIn>
      </Section>

      {/* ── sources ──────────────────────────────────────────────────────────
          Dark band: accent fails here, so the only colours are paper, mist,
          ruling and accent.lit. Links carry an underline as well as a colour. */}
      <Section name="Sources" tone="ink">
        <Head tone="ink" title="Every Figure, and Where It Came From"
          line={`${SOURCES.length} sources: the datasets, the published figures, the instruments.`}/>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:gap-4 xl:grid-cols-3">
          {SOURCE_COLS.map((col, ci) => (
            <ScrollRow key={col[0].title} index={ci} className="min-w-0">
              <dl className={cn(CARD_INK, 'm-0 flex h-full min-w-0 flex-col gap-2.5')}>
                {col.map((s, i) => (
                  <div key={s.title}
                    className={cn('min-w-0', i && 'border-t border-ink-3 pt-2.5')}>
                    <dt className="min-w-0">
                      <span className="block font-display text-ui font-bold leading-[1.2] text-paper">
                        {s.title}
                      </span>
                      <span className="mt-0.5 block font-mono text-fine leading-[1.35] text-ruling">
                        {s.href
                          ? <a href={s.href} target="_blank" rel="noreferrer"
                              className="border-b border-accent-lit/50 text-mist hoverOnly:border-accent-lit">
                              {s.cite}
                            </a>
                          : s.cite}
                      </span>
                    </dt>
                    <dd className="m-0 mt-1 min-w-0 text-meta leading-[1.4] text-mist">{s.body}</dd>
                  </div>
                ))}
              </dl>
            </ScrollRow>
          ))}
        </div>

        <ScrollIn className="mt-3">
          <div className={CARD_INK}>
            <p className="flex flex-wrap items-baseline justify-between gap-x-3
              font-mono text-tick text-ruling">
              <span>What is not claimed</span>
              <span>docs/design-evidence.md carries the rest</span>
            </p>
            <div className="mt-1.5 grid gap-1 lg:grid-cols-3 lg:gap-4">
              {NOT_CLAIMED.map(t => (
                <p key={t} className="text-meta leading-[1.4] text-mist">{t}</p>
              ))}
            </div>
          </div>
        </ScrollIn>
      </Section>

    </main>
  )
}
