import React from 'react'
import { Section, SectionHead } from '../ui/section'
import { ScrollIn, ScrollRow } from '../ui/motion'
import { Button } from '../ui/button'
import { List, Item } from '../ui/list'
import { ArrowRight } from '../ui/marks'
import { Table, THead, TBody, TR, TH, TD } from '../ui/table'
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
 * THIS PAGE IS AN INSTRUMENT PANEL, NOT AN ESSAY, AND IT IS NO LONGER A STACK
 * OF IDENTICAL CARDS. It was 11,200px of prose, then 1,900 rendered words in
 * eighteen interchangeable rectangles, which a judge with forty entries to
 * score reads none of. It is now 853 words, and each kind of content has the
 * one shape that fits it:
 *
 *   figures           a band of large numbers, one line of label beside each
 *   the three routes  one table, four columns
 *   the model card    one definition grid, six rows, ONE LINE PER ROW
 *   the comparisons   one table, formula against network
 *   the limits        ONE caution panel with six ruled rows, not six red boxes
 *   the sources       one dense table, not nine cards on a dark band
 *   lists             short lists, and only where a list is the real shape
 *
 * A sentence that restates the number beside it has been deleted, not reworded.
 * Three sentences that made one point are one line. If a row below looks like
 * it wants a paragraph, the paragraph was the problem.
 *
 * THE RULE THIS PAGE IS WRITTEN UNDER. Every figure about the network is read
 * out of src/signals/tnam-results.js as the page renders, and the file or path
 * it came from is named beside it, so a reader who doubts a number can open one
 * file and find it. Nothing is typed from memory.
 *
 * WHAT MAY NOT BE COMPRESSED AWAY. Wording may shrink. These may not leave the
 * page, and all six are in the limits panel, with the two worst also in the
 * figure band at the top: the emotional-distress failure (0.281, below rest);
 * every subject being an adult, with no patch built or worn; zero-shot transfer
 * no better than the formula; the movement confound and its fallback; that it
 * does not predict performance; and a source for every statistic. Do not soften
 * "ranks it backwards" into "performs less well".
 *
 * VOCABULARY. The neural network is "the Mind Score network", then "the
 * network". Never "the model". "Temporal neural additive model" is still the
 * right name for the architecture, and "model card" is the name of this kind of
 * disclosure, not a name for the network.
 */

const f1 = v => v.toFixed(1)
const f2 = v => v.toFixed(2)
const f3 = v => v.toFixed(3)
const pct = v => Math.round(v * 100) + '%'
const pct1 = v => (v * 100).toFixed(1) + '%'

/* The check-in count the calibration figures quote, located in the results
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

/* ── the page's shapes ───────────────────────────────────────────────────
   Section 2 of the design spec: no text sits on a tinted band. PANEL is the
   ground text lands on, and it is the shape charts/architecture already uses,
   so a figure and a table read as one kind of object. CAUTION is used exactly
   once, for the six limits, which is what still makes it mean caution. */
const PANEL = 'rounded-panel border border-rule bg-card px-4 py-3'
const CAUTION = 'rounded-panel border border-rule border-l-[3px] border-l-crit bg-warn-wash px-4 py-3'
/* A label is a line of type, not a capsule (spec 0c rule 3), and a provenance
   is a literal path or identifier, so it takes the real monospace (rule 4).
   No numeral on this page is set in a typewriter face: tabular-nums aligns. */
const LABEL = 'font-body text-tick font-semibold text-ink-2'
const SRC = 'font-code text-fine text-ink-3'

/* A band's opening is now the heading alone, full width, with the band's own
   first object under it. The two-column Head with a one-line lede in a card
   beside the title went when the ledes went: a lede is one line or it is
   deleted, and five of the six were a sentence about the band rather than
   about the product. */
/* A heading inside a band, for the second figure in a band that carries two. */
const Mark = ({ children }) => <h2 className="mark mt-4">{children}</h2>

/* ── shape one: the figure ───────────────────────────────────────────────
   A number large enough to be read first, its label beside it at caption
   size, its interval under. `tone` is a status and the word beside the figure
   says the same thing, so colour is never the only carrier. */
function Figure({ v, label, sub, tone }) {
  return (
    <div className="min-w-0 border-t-2 border-rule pt-2">
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className={cn('text-stat tabular-nums leading-none',
          tone === 'crit' ? 'text-crit' : 'text-ink')}>{v}</span>
        <span className="min-w-0 text-fine leading-[1.3] text-ink-2">{label}</span>
      </p>
      {sub && <p className="mt-1 text-fine tabular-nums text-ink-3">{sub}</p>}
    </div>
  )
}
const Figures = ({ className, children }) => (
  <div className={cn('grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:gap-x-5', className)}>{children}</div>
)

/* ── shape two: the row ──────────────────────────────────────────────────
   Label and figure on one line, the label beside the number and never under
   it. `sub` is an interval or a unit, so it may follow the figure. */
function KV({ k, v, sub }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-rule pt-1
      first:border-t-0 first:pt-0">
      <span className="min-w-0 text-fine leading-[1.35] text-ink-2">{k}</span>
      <span className="min-w-0 text-right">
        <span className="text-meta tabular-nums text-ink">{v}</span>
        {sub && <span className="ml-1.5 text-fine tabular-nums text-ink-3">{sub}</span>}
      </span>
    </div>
  )
}
const KVs = ({ children, className }) => (
  <div className={cn('flex flex-col gap-1', className)}>{children}</div>
)

/* ── shape three: the comparison ─────────────────────────────────────────
   Two systems against one measure, which is how every comparison on this page
   is quoted. A bare mean beside a bare mean is the oldest way to make a
   difference look settled, so an interval goes on the AUROC figures above. */
function Versus({ label, rows, className }) {
  return (
    <div className={cn('grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-3 gap-y-1 sm:gap-x-5',
      className)}>
      <span className={LABEL}>{label}</span>
      <span className={cn(LABEL, 'text-right')}>Formula</span>
      <span className={cn(LABEL, 'text-right')}>Network</span>
      {rows.map(([k, a, b]) => (
        <React.Fragment key={k}>
          <span className="min-w-0 border-t border-rule pt-1 text-fine leading-[1.35] text-ink-2">{k}</span>
          <span className="border-t border-rule pt-1 text-right text-meta tabular-nums text-ink-2">
            {f3(a)}
          </span>
          <span className="border-t border-rule pt-1 text-right text-meta tabular-nums text-ink">
            {f3(b)}
          </span>
        </React.Fragment>
      ))}
    </div>
  )
}

/* ── shape four: the short list ──────────────────────────────────────────
   Only where a list is the real shape of the thing. */
const Lines = ({ items, className }) => (
  <List className={cn('gap-1', className)}>
    {items.map(t => <Item key={t} className="text-meta leading-[1.4] text-ink-2">{t}</Item>)}
  </List>
)

/* A row of the model card. One line per row. */
function Spec({ k, src, children }) {
  return (
    <div className="grid gap-x-4 gap-y-1 border-t border-rule py-2 first:border-t-0 first:pt-0
      lg:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
      <div className="min-w-0">
        <p className={LABEL}>{k}</p>
        {src && <p className={cn(SRC, 'mt-0.5')}>{src}</p>}
      </div>
      <div className="min-w-0 text-meta leading-[1.4] text-ink-2">{children}</div>
    </div>
  )
}

/* A limit. Six of these sit inside ONE caution panel, separated by a rule,
   because five identical red boxes read as a template and one panel of six
   ruled rows reads as a list somebody kept. The claim is at the size of the
   result it qualifies: a limit smaller than its result is one somebody chose
   not to have read. */
function Limit({ n, title, src, figures, children }) {
  return (
    <div className="grid gap-x-5 gap-y-1.5 border-t border-rule pt-2.5 first:border-t-0 first:pt-0
      lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      <div className="min-w-0">
        <p className="flex items-baseline gap-2">
          <span className="text-fine tabular-nums text-ink-3">{n}</span>
          <span className="min-w-0 font-display text-ui font-bold leading-[1.22] text-ink">{title}</span>
        </p>
        <p className="mt-1 text-meta leading-[1.4] text-ink-2">{children}</p>
      </div>
      <div className="min-w-0">
        {figures && <KVs>{figures}</KVs>}
        {src && <p className={cn(SRC, figures && 'mt-1.5')}>{src}</p>}
      </div>
    </div>
  )
}

/* Each route's status is read off the code, not off intent. The patch row is
   the one a judge checks first, so it says what the pairing code actually
   does and then stops. */
const ROUTES = [
  { route: 'The patch', src: 'lib/engine.js', today: 'Not built',
    reads: 'Pulse, sweat, skin temperature, movement. Upper arm, once a second.',
    cannot: 'No unit assembled, so no signal: the repository holds only a pairing request.' },
  { route: 'Phone camera and microphone', src: 'signals/score.js', today: 'Running',
    reads: 'Camera, 30 s: heart rate, beat variation. Speech, 15 s: pitch, range, two steadiness measures. Accelerometer: peak movement.',
    cannot: `Reaches 2 of ${FEATURES.length} features. The other ${FEATURES.length - 2} enter at the person’s usual.` },
  { route: 'Six questions', src: 'lib/engine.js', today: 'Running',
    reads: 'Six five-point answers: tension, on edge, sleep, energy, focus, the day’s demand.',
    cannot: 'Anything about the body. One logistic puts them onto the same dial.' },
]

const OUT_OF_SCOPE =
  'Diagnosis, screening, triage. Any clinical cut-off. Comparing people. Telling one distress from another. Deciding alone. Not a medical device.'

const WOULD_CHANGE = [
  'The adolescent pilot reporting',
  'A dataset with an emotional condition',
  'Readings off the patch itself',
]

/* Published figures only, each beside its own source, and nothing here that is
   not already sourced in this repository: the two statistics src/charts/
   problem.jsx names, the instrument src/survey/questions.js implements, and
   the datasets docs/tnam-handoff.md names.

   TWO COLUMNS, NOT THREE. The third column used to be a sentence restating the
   figure in the first one, which is the thing section 4 of the spec forbids.
   The figure now sits in `holds`, where a reader checking one number finds it,
   and any caveat belonging to the source sits in `cite` with it, so no
   statistic has lost its value, its unit or its provenance. */
const SOURCES = [
  { holds: `Fitted dataset, ${R.per_subject.length} adults`,
    cite: 'WESAD. docs/tnam-handoff.md; ml/ in the Conrad repo' },
  { holds: `Transfer and calibration, ${R.transfer.subjects} people`,
    cite: 'PhysioNet Non-EEG. docs/tnam-handoff.md' },
  { holds: 'Sad or hopeless 39.7%, suicidal thought 20.4%',
    href: 'https://www.cdc.gov/yrbs/youth-health-in-focus/mental-health.html',
    cite: 'CDC, Youth Risk Behavior Survey, 2023. The first read 30% in 2013.' },
  { holds: 'Treatment gap, 20.1% and 59.4%',
    href: 'https://www.nimh.nih.gov/health/statistics/major-depression',
    cite: 'NIMH, Major Depression, NSDUH 2021. No trend across the 2020 redesign.' },
  { holds: 'The mark on the dial',
    href: 'https://doi.org/10.2196/jmir.8889',
    cite: 'Zikmund-Fisher et al., JMIR 2018, 20(3):e98. 1,618 adults; no change at extremes.' },
  { holds: 'Why nobody is ranked',
    href: 'https://doi.org/10.1037/0033-2909.130.3.355',
    cite: 'Dickerson and Kemeny, Psych Bulletin 2004, 130(3):355-391. 208 studies.' },
  { holds: 'Reading grade, 4.5 and 7.4',
    href: 'https://doi.org/10.2196/69955',
    cite: 'Will et al., JMIR 2025, 27:e69955. tools/readability; guidance sixth grade.' },
  { holds: 'Contrast and motion',
    href: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum',
    cite: 'WCAG 2.1, 1.4.3 AA and 2.3.3 AAA. On a production build.' },
]
const SOURCE_COLS = [SOURCES.slice(0, 4), SOURCES.slice(4)]

const NOT_CLAIMED = [
  'No colour-psychology claim on this site.',
  'Nothing says MindMap lowers stress.',
  'Never tested on a teenager.',
]

export function Methods({ go }) {
  return (
    <main>

      {/* ── BAND 1, paper: six figures, the three steps, the three routes.
          A figure band, then a diagram, then a table. */}
      <section className="border-t border-rule bg-paper">
        <div className="wrap py-7 lg:py-10">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,37rem)] lg:items-start lg:gap-5">
            <div className="min-w-0">
              {/* An eyebrow is a line of type. Not a capsule. */}
              <p className="font-body text-ui font-semibold text-accent-ink">How it works</p>
              <h1 className="mt-2 max-w-[20ch] font-display font-bold text-major leading-[1.05]
                tracking-tight text-ink">
                Where the {SCORE} comes from
              </h1>
              {/* Controls, not prose: a button carries its own edge, so these
                  sit on the band without breaking section 2. */}
              <div className="mt-3.5 flex flex-wrap gap-2.5">
                <Button variant="outline" size="sm" onClick={() => go('site')}>
                  Drag the network figure<ArrowRight aria-hidden/>
                </Button>
                <Button variant="outline" size="sm" onClick={() => go('check')}>
                  Take a reading<ArrowRight aria-hidden/>
                </Button>
              </div>
            </div>

            {/* The headline and the failure in one container, so neither half
                of the claim can be read without the other. */}
            <div className={PANEL}>
              <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className={LABEL}>Headline figures, AUROC</span>
                <span className={SRC}>signals/tnam-results.js</span>
              </p>
              <Figures className="mt-2.5">
                <Figure v={f3(R.summary.tnam.auroc.mean)} label="Fitted, held out"
                  sub={`${f3(R.summary.tnam.auroc.lo)} to ${f3(R.summary.tnam.auroc.hi)}`}/>
                <Figure v={f3(R.summary.formula.auroc.mean)} label="Hand formula"
                  sub={`${f3(R.summary.formula.auroc.lo)} to ${f3(R.summary.formula.auroc.hi)}`}/>
                <Figure v={f3(R.transfer.cognitive.tnam.mean)} label="Zero shot, new stressor"/>
                <Figure v={f3(R.calibration.auroc.gains.triggered[K8])}
                  label={`After ${ASKS} check-ins`}/>
                <Figure tone="crit" v={f3(R.transfer.emotional.tnam.mean)}
                  label="Emotional distress, below rest"
                  sub={`${f3(R.transfer.emotional.tnam.lo)} to ${f3(R.transfer.emotional.tnam.hi)}`}/>
                <Figure v={`${R.paired.wins} of ${R.per_subject.length}`} label="People it beats"
                  sub="none worse"/>
              </Figures>
              <p className="mt-2.5 border-t border-rule pt-2 text-fine leading-[1.35] text-crit">
                The emotional figure is a failure, not a near miss.
              </p>
            </div>
          </div>

          <ThreeSteps className="mt-4"/>

          <Mark>Three routes in, and which runs today</Mark>
          <ScrollIn className="mt-3">
            <div className={cn(PANEL, 'py-1')}>
              <Table>
                <THead>
                  <TR>
                    <TH>Route</TH>
                    <TH>Today</TH>
                    <TH>Reads</TH>
                    <TH>Cannot</TH>
                  </TR>
                </THead>
                <TBody>
                  {ROUTES.map(r => (
                    <TR key={r.route}>
                      <TD className="min-w-[9rem] align-top">
                        <span className="font-display font-bold text-ink">{r.route}</span>
                        <span className={cn(SRC, 'mt-0.5 block')}>{r.src}</span>
                      </TD>
                      {/* The rule carries the colour and the word carries the
                          state, so the status survives anywhere the table is
                          moved and at any contrast. */}
                      <TD className="align-top">
                        <span className={cn('inline-flex border-l-2 pl-2 text-fine text-ink',
                          r.today === 'Running' ? 'border-accent' : 'border-warn')}>
                          {r.today}
                        </span>
                      </TD>
                      <TD className="min-w-[14rem] align-top text-fine leading-[1.4] text-ink-2">
                        {r.reads}
                      </TD>
                      <TD className="min-w-[13rem] align-top text-fine leading-[1.4] text-ink-2">
                        {r.cannot}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          </ScrollIn>

          <ScrollIn className="mt-3">
            <div className={cn(PANEL, 'lg:flex lg:items-start lg:gap-5')}>
              <div className="min-w-0 lg:flex-1">
                <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className={LABEL}>On the phone route</span>
                  <span className={SRC}>signals/score.js</span>
                </p>
                <div className="mt-2 grid gap-2.5 sm:grid-cols-2 sm:gap-5">
                  <KVs>
                    <KV k="Heart only, formula" v={f3(R.ppg_only.formula.auroc.mean)}/>
                    <KV k="Heart only, network" v={f3(R.ppg_only.tnam.auroc.mean)}/>
                  </KVs>
                  <p className="text-fine leading-[1.4] text-ink-2">
                    Heart terms go through the network. Voice terms do not: no dataset pairs
                    camera capture with stress labels, so the four voice weights are fitted to
                    nothing.
                  </p>
                </div>
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

      {/* ── BAND 2, aqua-2: the model card as a definition grid. Six rows,
          one line each, which is what fourteen cards of paragraphs became. */}
      <Section name="Model card" tone="card" className="bg-aqua-2">
        <SectionHead className="max-w-[30ch]">What It Is, and What It Was Fitted On</SectionHead>

        <ScrollIn className="mt-3">
          <div className={PANEL}>
            <Spec k="Purpose">
              One {SCORE}, {SCORE_RANGE}, against one person’s own baseline, and the signal that
              moved it. 50 is their ordinary day. A student project.
            </Spec>
            <Spec k="Out of scope">{OUT_OF_SCOPE}</Spec>
            <Spec k="Inputs" src={`${FEATURES.length} features, four signals`}>
              <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                {SENSOR_ORDER.map(id => (
                  <li key={id} className="rounded-field border border-rule bg-paper px-2
                    text-fine text-ink">
                    {SENSORS[id].name.toLowerCase()}
                  </li>
                ))}
              </ul>
              <p className="mt-1.5">
                One it cannot read enters at 0, the person’s usual, and the band widens.
              </p>
            </Spec>
            <Spec k="Scale and band"
              src="signals/score.js; band in quadrature, through the logistic by its slope">
              <div className="grid gap-x-5 gap-y-1 sm:grid-cols-2">
                <KVs>
                  <KV k="Per signal" v="own baseline" sub="14 d"/>
                  <KV k="Ordinary day" v="0"/>
                  <KV k="Clamp" v="plus or minus 3"/>
                  <KV k="Movement, patch" v="1" sub={`${MOVE_LIMIT_G} g`}/>
                </KVs>
                <KVs>
                  <KV k="Band: term weight" v="0.55"/>
                  <KV k="Band: camera quality" v="0.45"/>
                  <KV k="Band: baseline days" v="0.75"/>
                  <KV k="Band, clamped" v="3 to 34" sub="points"/>
                </KVs>
              </div>
            </Spec>
            <Spec k="Architecture"
              src={`${PARAM_COUNT.toLocaleString('en-US')} weights, ${CONTEXT_WINDOWS} windows, ${CONTEXT_MINUTES} min`}>
              Temporal neural additive model: a bias, a curve per signal, one term over time.
              Additive, so the overview breakdown is its own arithmetic.
            </Spec>
            <Spec k="Training data" src="WESAD, public">
              {R.per_subject.length} adults, wrist, 60 s windows at a {HOP_S} s hop, stress against
              baseline and amusement, leave one subject out.
            </Spec>
          </div>
        </ScrollIn>
      </Section>

      {/* ── BAND 3, card: what was measured. A comparison table against the
          formula, then the calibration figures. */}
      <Section name="Measured" tone="card">
        <SectionHead className="max-w-[30ch]">Against the Formula It Replaces</SectionHead>

        <div className="mt-3 grid gap-3 lg:grid-cols-2 lg:gap-4">
          <ScrollRow index={0} className="min-w-0">
            <div className={cn(PANEL, 'h-full')}>
              <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className={LABEL}>Fitted data, leave one subject out</span>
                <span className={SRC}>R.summary, R.paired</span>
              </p>
              <Versus className="mt-2.5" label="Same split" rows={[
                ['AUROC', R.summary.formula.auroc.mean, R.summary.tnam.auroc.mean],
                ['Balanced accuracy', R.summary.formula.bacc.mean, R.summary.tnam.bacc.mean],
                ['F1', R.summary.formula.f1.mean, R.summary.tnam.f1.mean],
                ['Heart features only', R.ppg_only.formula.auroc.mean, R.ppg_only.tnam.auroc.mean],
              ]}/>
              <KVs className="mt-2.5">
                <KV k="People it beats" v={`${R.paired.wins} of ${R.per_subject.length}`}
                  sub="none worse"/>
                <KV k="Ties" v={R.paired.ties}/>
                <KV k="p, paired" v={R.paired.p}/>
              </KVs>
              <p className="mt-2.5 text-fine leading-[1.35] text-ink-3">
                Interval {f3(R.summary.tnam.auroc.lo)} to {f3(R.summary.tnam.auroc.hi)}: above 1 is
                a ceiling, not a claim.
              </p>
            </div>
          </ScrollRow>

          <ScrollRow index={1} className="min-w-0">
            <div className={cn(PANEL, 'h-full')}>
              <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className={LABEL}>Calibration, {R.transfer.subjects} new people</span>
                <span className={SRC}>R.calibration</span>
              </p>
              <Figures className="mt-2.5">
                <Figure v={f3(R.calibration.base_auroc.mean)} label="Before any check-in"
                  sub={`${f3(R.calibration.base_auroc.lo)} to ${f3(R.calibration.base_auroc.hi)}`}/>
                <Figure v={f3(R.calibration.auroc.gains.triggered[K8])}
                  label={`After ${ASKS} check-ins`}
                  sub={`${f3(R.calibration.auroc_ci.gains.triggered[K8][0])} to ${f3(R.calibration.auroc_ci.gains.triggered[K8][1])}`}/>
              </Figures>
              <KVs className="mt-3">
                <KV k="Balanced accuracy"
                  v={`${f3(R.calibration.base_bacc.mean)} to ${f3(R.calibration.bacc.gains.triggered[K8])}`}/>
                <KV k="Control: from scratch"
                  v={f3(R.calibration.auroc.scratch.triggered[K8])}/>
                <KV k="Control: scheduled asks"
                  v={f3(R.calibration.auroc.gains.scheduled[K8])}/>
                <KV k="Control: threshold only"
                  v={f3(R.calibration.auroc.affine.triggered[K8])}/>
              </KVs>
              <p className="mt-2 text-fine leading-[1.35] text-ink-3">
                Asked when the band changes, fitted on the device.
              </p>
            </div>
          </ScrollRow>
        </div>
      </Section>

      {/* ── BAND 4, paper: the limits. ONE caution panel, six ruled rows, the
          movement figure under the row it belongs to. */}
      <Section name="Known limits" tone="paper">
        <SectionHead className="max-w-[30ch]">The Six Places It Fails</SectionHead>

        <ScrollIn className="mt-3">
          <div className={CAUTION}>
            <p className="flex flex-wrap items-baseline justify-between gap-x-3 pb-2">
              <span className={LABEL}>Six limits</span>
              <span className={SRC}>signals/tnam-results.js</span>
            </p>
            <div className="flex flex-col gap-2.5">
              <Limit n="1" title="It does not detect emotional distress. It ranks it backwards."
                src={`R.transfer, ${R.transfer.subjects} people`}
                figures={<>
                  <KV k="The network" v={f3(R.transfer.emotional.tnam.mean)}
                    sub={`${f3(R.transfer.emotional.tnam.lo)} to ${f3(R.transfer.emotional.tnam.hi)}`}/>
                  <KV k="Hand formula, also failed" v={f3(R.transfer.emotional.formula.mean)}/>
                </>}>
                Below 0.5 is not a miss: it ranked those windows calmer than rest.
              </Limit>

              <Limit n="2" title="Zero shot on a new stressor, no better than the formula."
                src="R.transfer"
                figures={<>
                  <KV k="Cognitive: formula, network"
                    v={`${f3(R.transfer.cognitive.formula.mean)} to ${f3(R.transfer.cognitive.tnam.mean)}`}/>
                  <KV k="Pooled: formula, network"
                    v={`${f3(R.transfer.any_stress.formula.mean)} to ${f3(R.transfer.any_stress.tnam.mean)}`}/>
                </>}>
                Pooled is near chance; the {f3(R.summary.tnam.auroc.mean)} is on the data it was
                fitted on.
              </Limit>

              <Limit n="3" title="Every subject is an adult. No patch exists."
                src="The adolescent pilot has not reported">
                No teenager in any figure; the sensors were on a wrist. No patch built or worn:
                every patch figure is generated.
              </Limit>

              <Limit n="4" title="It does not predict performance, and we checked." src="R.exams"
                figures={<>
                  <KV k="Real exams" v={R.exams.spearman_flagged_vs_grade.n}/>
                  <KV k="Flagged vs grade"
                    v={`rho ${f2(R.exams.spearman_flagged_vs_grade.rho)}`}
                    sub={`p ${f2(R.exams.spearman_flagged_vs_grade.p)}`}/>
                  <KV k="Dropped for movement" v={pct(R.exams.motion_rejected)}/>
                </>}>
                No relationship at all.
              </Limit>

              <Limit n="5" title="Movement and arousal were never separated."
                src="R.confound, jogging and rest"
                figures={<>
                  <KV k="Moving called stressed: network, shipped"
                    v={`${pct1(R.confound.tnam_raw.physical_flagged)} to ${pct1(R.confound.tnam_fallback.physical_flagged)}`}/>
                  <KV k="Cognitive caught: network, shipped"
                    v={`${pct1(R.confound.tnam_raw.cognitive_caught)} to ${pct1(R.confound.tnam_fallback.cognitive_caught)}`}/>
                  <KV k="The trade, points"
                    v={`${f1(CAUGHT_COST)} cost`} sub={`${f1(FALSE_GAIN)} gained`}/>
                </>}>
                No calm exercise in the training set. Over {MOVE_LIMIT_G} g the network does not
                score the reading: the formula branch takes it, the temporal term drops, the
                reading is marked held, never a label.
              </Limit>

              <Limit n="6" title="The baseline has to be earned." src="scoreCapture">
                Fourteen days is nothing on day one; under five phone captures the spread is
                borrowed.
              </Limit>
            </div>
          </div>
        </ScrollIn>

        <MovementFallback className="mt-3"/>

        <ScrollIn className="mt-3">
          <div className={PANEL}>
            <p className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className={LABEL}>What would change this</span>
              <span className={SRC}>In order</span>
            </p>
            <div className="mt-2 grid gap-2 lg:grid-cols-3 lg:gap-4">
              {WOULD_CHANGE.map((title, i) => (
                <p key={title} className="flex min-w-0 items-baseline gap-2 border-t border-rule
                  pt-1.5 lg:border-l lg:border-t-0 lg:pl-3 lg:pt-0 lg:first:border-l-0 lg:first:pl-0">
                  <span className="text-fine tabular-nums text-ink-3">{i + 1}</span>
                  <span className="min-w-0 font-display text-ui font-bold leading-[1.2] text-ink">
                    {title}
                  </span>
                </p>
              ))}
            </div>
          </div>
        </ScrollIn>
      </Section>

      {/* ── BAND 5, beam-wash: where the code runs and what survives a
          reading. Two labelled figures and one line, because a lede under
          each figure was 190px of air. */}
      <Section name="Where it runs" tone="card" className="bg-beam-wash">
        <SectionHead className="max-w-[30ch]">No Backend, and Nothing to Call</SectionHead>
        <WhereItRuns className="mt-3"/>

        <Mark>What is measured, what is kept, who sees it</Mark>
        <DataFlow className="mt-3"/>

        <ScrollIn className="mt-3">
          <div className={cn(PANEL, 'lg:flex lg:items-start lg:gap-5')}>
            <div className="min-w-0 lg:flex-1">
              <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className={LABEL}>What on the console is a demonstration</span>
                <span className={SRC}>lib/caseload.js</span>
              </p>
              <p className="mt-1.5 text-meta leading-[1.4] text-ink-2">
                The consent records, students and audit entries on the {PRO_LC} console are
                written by us. The rules are real code; the people are not.
              </p>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2.5 lg:mt-0 lg:shrink-0">
              <Button variant="outline" size="sm" onClick={() => go('privacy')}>
                Who can see what<ArrowRight aria-hidden/>
              </Button>
            </div>
          </div>
        </ScrollIn>
      </Section>

      {/* ── BAND 6, aqua: the sources, as one table. Nine cards on a dark
          ground paid nine card paddings for what is, honestly, a
          bibliography, and the dark ground is gone besides (spec 0c rule 1). */}
      <Section name="Sources" tone="card" className="bg-aqua">
        <SectionHead className="max-w-[30ch]">Every Figure, and Its Source</SectionHead>

        <ScrollIn className="mt-3">
          <div className={cn(PANEL, 'grid gap-x-8 py-1 lg:grid-cols-2')}>
            {SOURCE_COLS.map((col, ci) => (
              <Table key={ci}>
                <THead>
                  <TR>
                    <TH>Holds up</TH>
                    <TH>Source</TH>
                  </TR>
                </THead>
                <TBody>
                  {col.map(s => (
                    <TR key={s.holds}>
                      <TD className="min-w-[11rem] align-top">
                        <span className="font-display font-bold leading-[1.25] text-ink">{s.holds}</span>
                      </TD>
                      <TD className="min-w-[15rem] align-top text-fine leading-[1.4] text-ink-2">
                        {s.href
                          ? <a href={s.href} target="_blank" rel="noreferrer"
                              className="border-b border-accent/50 text-accent-ink hoverOnly:border-accent-ink">
                              {s.cite}
                            </a>
                          : s.cite}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            ))}
          </div>
        </ScrollIn>

        <ScrollIn className="mt-3">
          <div className={PANEL}>
            <p className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className={LABEL}>What is not claimed</span>
              <span className={SRC}>docs/design-evidence.md</span>
            </p>
            <Lines className="mt-1.5 lg:grid lg:grid-cols-3 lg:gap-4" items={NOT_CLAIMED}/>
          </div>
        </ScrollIn>
      </Section>

    </main>
  )
}
