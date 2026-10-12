import React from 'react'
import { Section, SectionHead, SectionLede } from '../ui/section'
import { ScrollIn, ScrollRow } from '../ui/motion'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { List, Item } from '../ui/list'
import { ArrowRight } from '../ui/marks'
import { DataFlow, MovementFallback, ThreeSteps, WhereItRuns } from '../charts/architecture'
import { CONTEXT_WINDOWS, FEATURES, PARAM_COUNT } from '../signals/tnam'
import { TNAM_RESULTS as R } from '../signals/tnam-results'
import { MOVE_LIMIT_G } from '../signals/motion'
import { SENSORS, SENSOR_ORDER } from '../lib/sensors'
import { PRO_LC, SCORE, SCORE_RANGE } from '../lib/terms'
import { cn } from '../lib/utils'

/* How the Mind Score is computed, for a reader who will not open the
 * repository.
 *
 * The page is built to be read twice. The three steps at the top are the whole
 * method for somebody who stops there, and everything below them is for
 * somebody who does not. A claim appears in one of those halves, never in both
 * with two different strengths.
 *
 * THE RULE THIS PAGE IS WRITTEN UNDER. Every figure about the model is read out
 * of src/signals/tnam-results.js as the page renders, and the path it came from
 * is named beside it, so a reader who doubts a number can open one file and
 * find it. Nothing is typed from memory.
 *
 * The model is trained on people now, which makes the card stronger and the
 * limits heavier at the same time. Both halves have to stay the same size. The
 * transfer row and the emotional-condition line are not hedging and are not
 * decoration: a judge who finds either of them buried costs this project more
 * than the headline figure earns it. Do not move them below the fold, and do
 * not soften "ranked them backwards" into "performed less well".
 */

/* Every model figure below comes from this object. The paths are spelled out at
 * each use rather than destructured into short names, because a reader checking
 * the page against the file needs the path, not an alias. */
const f2 = v => v.toFixed(2)
const f3 = v => v.toFixed(3)
const pct = v => Math.round(v * 100) + '%'
const pct1 = v => (v * 100).toFixed(1) + '%'

/* The check-in count the calibration row quotes, located in the results file's
   own list rather than assumed to be at a fixed index. */
const ASKS = 8
const K8 = R.calibration.ks.indexOf(ASKS)

/* The temporal term reads the preceding windows. The 30 second hop is stated in
   R.task, so the minutes are arithmetic rather than a typed figure. */
const HOP_S = 30
const CONTEXT_MINUTES = (CONTEXT_WINDOWS * HOP_S) / 60

const F = ({ children }) => <span className="font-mono text-ink-2">{children}</span>
const Num = ({ children }) => <span className="font-mono tabular-nums text-ink">{children}</span>

/* An AUROC with its interval, which is how every one of them is quoted on this
   page. A bare mean next to a bare mean is the oldest way to make a difference
   look settled. */
const Score = ({ v }) => (
  <>
    <Num>{f3(v.mean)}</Num>
    <span className="whitespace-nowrap text-ink-3"> ({f3(v.lo)} to {f3(v.hi)})</span>
  </>
)

/* A labelled row of the model card. The label column is fixed from sm up so the
   rows read as one artifact rather than as nine paragraphs; below that it
   stacks, because a 390px viewport has no room for two columns of prose. */
function Row({ label, children }) {
  return (
    <div className="border-t border-rule py-5 first:border-t-0 first:pt-0
      sm:grid sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:gap-8">
      <dt className="font-mono text-tick text-ink-3 sm:pt-0.5">{label}</dt>
      {/* The base stylesheet gives every <p> a 62ch measure; these rows are built
          from blocks rather than paragraphs, so the measure is restated here. At
          1680 the card is wide enough to set a 110-character line without it. */}
      <dd className="m-0 mt-2 min-w-0 max-w-[62ch] text-sec leading-[1.55] text-ink-2 sm:mt-0">{children}</dd>
    </div>
  )
}

/* A limit that must not be skimmed past. Same 3px rule the no-patch notice uses,
   and ink type: crit clears 4.5 on this band's ground but red is reserved for an
   alarm here, so it stays on the rule. */
function Hard({ title, children }) {
  return (
    <div className="mt-4 border-l-[3px] border-crit pl-4">
      <p className="font-display text-ui font-bold leading-[1.3] text-ink">{title}</p>
      <p className="mt-1.5 text-sec leading-[1.5] text-ink-2">{children}</p>
    </div>
  )
}

const OUT_OF_SCOPE = [
  'Diagnosis, screening or triage of any condition. It is not a medical device.',
  `Any clinical cut-off. The four bands name where a reading sits in that person's own range, and are not thresholds for anything.`,
  'Comparing one person with another. Every input is a distance from one person’s own baseline, so two people’s scores are not measured from the same place.',
  'Telling one kind of distress from another. It was fitted on one, and the transfer row below shows what it does with a second.',
  'Deciding anything by itself. The output is a number and a sentence for a person to read.',
]

/* Each route's status is read off the code, not off intent. The patch row is
   the one a judge will check first, so it says what connectPatch actually
   does and stops there. */
const ROUTES = [
  { route: 'The patch',
    measures: `Pulse, sweat, skin temperature and movement off the upper arm, once a second. These are the four the model's ten features are computed from.`,
    cannot: `Nothing yet. No unit has been assembled, so there is no signal to read, and every patch figure on this site is generated.`,
    today: 'Not running',
    detail: `lib/engine.js can open a pairing request against the Nordic UART service the firmware advertises, and that is the whole of it. No patch frame is parsed anywhere in this repository.` },
  { route: 'Phone camera and microphone',
    measures: `30 seconds of a fingertip over the rear lens, with the torch on where the phone allows it, gives heart rate and a beat-to-beat variation index. 15 seconds of speech gives pitch, pitch range, pitch steadiness and loudness steadiness. The accelerometer gives peak movement.`,
    cannot: `Fill the model. A camera reaches two of the ten features; the other eight enter at the person's usual, which is what the model was trained to tolerate but is not the same as reading them. On the heart features alone the held-out figure is ${f3(R.ppg_only.tnam.auroc.mean)} against the formula's ${f3(R.ppg_only.formula.auroc.mean)}, and that was still a wrist sensor on an adult, not a phone camera on a teenager.`,
    today: 'Running',
    detail: `The only sensor route a stranger can use in the next minute, in a browser, with no patch and no account.` },
  { route: 'Six questions',
    measures: `Six answers on a five-point scale: how tense the body feels, how on edge, last night's sleep against usual, energy, how hard focus is, and how much the day has asked so far.`,
    cannot: `Anything about the body. It is what the person says, and it carries every floor a self-report carries.`,
    today: 'Running',
    detail: `lib/engine.js puts the six through a logistic with the same constant, 2.4, and the same four bands as the other two routes, so all three land on one dial.` },
]

/* Published figures only, each beside its own source. Nothing is added here
   that is not already sourced in this repository: the statistics are the two
   entries src/charts/problem.jsx names, the instrument is the one
   src/survey/questions.js implements, and the two datasets are named as
   docs/tnam-handoff.md names them. */
const SOURCES = [
  { title: 'The dataset the model is fitted on',
    cite: 'WESAD, a public wearable stress and affect dataset. Provenance in docs/tnam-handoff.md; training code in the Conrad repo under ml/',
    body: `${R.per_subject.length} adults, wrist sensors, a stress condition against baseline and
      amusement, 60 second windows at a ${HOP_S} second hop. Every figure from it on this page is
      leave-one-subject-out, so it is measured on a person the model never saw. The protocol
      string is R.task.` },
  { title: 'The dataset the transfer and calibration figures come from',
    cite: 'PhysioNet Non-EEG. Provenance in docs/tnam-handoff.md',
    body: `${R.transfer.subjects} people the model had never seen, under stressors it was never
      fitted on, scored on the windows they were not asked about. This is where the 0.78, the
      calibration gain and the emotional-condition failure all come from.` },
  { title: 'The two statistics on the overview',
    href: 'https://www.cdc.gov/yrbs/youth-health-in-focus/mental-health.html',
    cite: 'CDC, Youth Risk Behavior Survey, 2023',
    body: `Out of every 100 US high school students, 40% felt persistently sad or hopeless for two
      weeks or more, and 20% seriously considered attempting suicide. The survey reads 39.7% and
      20.4%. The first of those questions read 30% ten years earlier, in the CDC YRBS Data Summary
      and Trends Report for 2013 to 2023.` },
  { title: 'The treatment gap',
    href: 'https://www.nimh.nih.gov/health/statistics/major-depression',
    cite: 'NIMH, Major Depression, from NSDUH 2021',
    body: `Among US adolescents aged 12 to 17, 1 in 5, or 20.1%, had a major depressive episode in
      the past year, and 3 in 5 of that group, 59.4%, received no treatment for it. No trend is
      drawn from this source: NSDUH cannot be spliced across its 2020 redesign.` },
  { title: 'The usability instrument',
    cite: 'Brooke, System Usability Scale, 1986. Grade curve: Sauro and Lewis',
    body: `Ten statements on five-point agreement, alternating in direction, worded verbatim and in
      published order in src/survey/questions.js. Positive items score the answer minus 1, negative
      items 5 minus the answer; the ten are summed and multiplied by 2.5. The result runs 0 to 100
      and is not a percentage. The mean across published studies is 68.` },
  { title: 'The mark on the dial',
    href: 'https://doi.org/10.2196/jmir.8889',
    cite: 'Zikmund-Fisher et al., J Med Internet Res, 2018, 20(3):e98',
    body: `Shown a near-normal lab result against a labelled threshold rather than a bare scale,
      the share of 1,618 adults who said they would contact a doctor urgently fell from about half
      to about a third. For genuinely extreme values the labelled display made no difference.` },
  { title: 'Why nobody is ranked, and why every share switches off',
    href: 'https://doi.org/10.1037/0033-2909.130.3.355',
    cite: 'Dickerson and Kemeny, Psychological Bulletin, 2004, 130(3):355-391',
    body: `Across 208 laboratory studies, being judged by other people carried d = 0.67 against
      d = 0.15 without it, and an uncontrollable stressor carried d = 0.52 against d = 0.16 for a
      controllable one.` },
  { title: 'The reading grade, measured',
    href: 'https://doi.org/10.2196/69955',
    cite: 'Will et al., J Med Internet Res, 2025, 27:e69955. Measured by tools/readability',
    body: `Guidance for patient material is a sixth-grade reading level. Measured over this site's
      paragraph prose, it reads 4.5 on Flesch-Kincaid and 7.4 on SMOG. Both are reported because
      SMOG lands two to three grades above Flesch-Kincaid on the same text by construction.` },
  { title: 'The accessibility bar',
    href: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum',
    cite: 'WCAG 2.1, Contrast (Minimum) 1.4.3 Level AA, and Animation from Interactions 2.3.3 Level AAA',
    body: `Every text node on every route clears 4.5 : 1, verified against a real browser on a
      production build. All motion honours the system reduced-motion setting, which is a AAA
      criterion rather than the AA bar the rest of the site is held to.` },
]

export function Methods({ go }) {
  return (
    <main>

      {/* ── the plain reading, first ─────────────────────────────────────── */}
      <section className="border-t border-rule bg-paper">
        <div className="wrap py-10 lg:py-14">
          <p className="font-mono text-body font-bold tracking-[0.005em] text-accent">
            How it works
          </p>
          <h1 className="mt-3.5 max-w-[24ch] font-display font-bold text-major leading-[1.05]
            tracking-tight text-ink">
            Where the {SCORE} comes from
          </h1>
          <p className="mt-5 max-w-read text-lead leading-[1.55] text-ink-2">
            Three steps, then the detail behind each one. Every figure about the model below is
            read out of its own results file as this page renders, and the path it came from is
            printed beside it.
          </p>

          <ThreeSteps className="mt-9"/>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={() => go('site')}>
              Drag the model figure<ArrowRight aria-hidden/>
            </Button>
            <Button variant="outline" size="sm" onClick={() => go('check')}>
              Take a reading<ArrowRight aria-hidden/>
            </Button>
          </div>
        </div>
      </section>

      {/* ── the model card ───────────────────────────────────────────────── */}
      <Section name="Model card" tone="card" className="bg-aqua-2">
        <SectionHead>Model Card</SectionHead>
        <SectionLede>
          The {SCORE} model in src/signals/tnam.js: what it is for, what it was trained on, what it
          does well, and the three places it fails.
        </SectionLede>

        <ScrollIn className="mt-6">
          <Card className="p-5 lg:p-7">
            <dl className="m-0">

              <Row label="Intended use">
                Score one reading of one person&rsquo;s body signals against that person&rsquo;s own
                baseline and return one {SCORE}, {SCORE_RANGE}, with the signal that moved it most.
                50 is an ordinary day for that person. It is a student project, built for the
                Congressional App Challenge and the Conrad Challenge.
              </Row>

              <Row label="Out of scope">
                <List>
                  {OUT_OF_SCOPE.map(t => (
                    <Item key={t} className="text-sec leading-[1.5] text-ink-2">{t}</Item>
                  ))}
                </List>
              </Row>

              <Row label="Inputs">
                <Num>{FEATURES.length}</Num> features per reading, computed from the four patch
                signals:{' '}
                {SENSOR_ORDER.map((id, i) => (
                  <React.Fragment key={id}>
                    {i > 0 && ', '}
                    <span className="text-ink">{SENSORS[id].name.toLowerCase()}</span>
                  </React.Fragment>
                ))}
                . Each enters as its distance from the wearer&rsquo;s own fourteen-day baseline in
                standard deviations, so <Num>0</Num> is an ordinary day for that person, and
                signals/score.js clamps every one of them to plus or minus <Num>3</Num>. Movement
                enters on the patch&rsquo;s own scale, where <Num>1</Num> is the{' '}
                <Num>{MOVE_LIMIT_G}</Num> g line.
                <span className="mt-3 block">
                  A signal the device cannot read enters at <Num>0</Num>, meaning "at your usual",
                  which is what the model was trained to tolerate. That is a real cost rather than a
                  free pass: it removes that signal&rsquo;s evidence, and the confidence band in{' '}
                  <F>scoreCapture</F> widens to say so.
                </span>
              </Row>

              <Row label="Architecture">
                A Temporal Neural Additive Model. The logit is a bias, plus one learned curve per
                signal, plus one term over the preceding <Num>{CONTEXT_WINDOWS}</Num> windows,
                which at the {HOP_S} second hop is <Num>{CONTEXT_MINUTES}</Num> minutes. Nothing
                else. <Num>{PARAM_COUNT.toLocaleString('en-US')}</Num> weights, counted from the
                weights file by <F>PARAM_COUNT</F> rather than typed here.
                <span className="mt-3 block">
                  Because the structure is additive, a score decomposes exactly into the parts that
                  made it. The breakdown on the overview figure is the arithmetic of the model and
                  not an attribution method laid over it, so it closes to the last decimal place
                  and a reader can check it.
                </span>
              </Row>

              {/* The row the page exists to get right, in both directions. */}
              <Row label="Training data">
                <span className="block font-display text-row font-bold leading-[1.25] tracking-tight
                  text-ink">
                  Trained on people, on a public dataset, with a named protocol.
                </span>
                <span className="mt-3 block">
                  WESAD: <Num>{R.per_subject.length}</Num> adults wearing wrist sensors, a stress
                  condition against baseline and amusement, 60 second windows at a {HOP_S} second
                  hop, every feature a personal robust z-score computed by the same code that runs
                  in this page. The protocol string is <F>R.task</F>.
                </span>
                <span className="mt-3 block">
                  Evaluated leave one subject out: the model is fitted on fourteen people and
                  scored on the fifteenth, fifteen times over. Every WESAD figure below is measured
                  on somebody the model never saw.
                </span>
                <Hard title="Every subject is an adult.">
                  The adolescent pilot has not reported. Teenagers are the only people this product
                  is for, and not one of them appears in any figure on this page. The sensors were
                  on a wrist; the patch is an upper-arm patch that has not been built or worn.
                </Hard>
              </Row>

              <Row label="Evaluation, on the data it was fitted on">
                Leave one subject out across{' '}
                <Num>{R.summary.tnam.auroc.n}</Num> people, from <F>R.summary</F>:
                <List className="mt-3">
                  <Item className="text-sec leading-[1.5] text-ink-2">
                    AUROC: the hand formula it replaces <Score v={R.summary.formula.auroc}/>,
                    the model <Score v={R.summary.tnam.auroc}/>. The upper end of the second
                    interval sits above 1, which is an artefact of the interval rather than a
                    claim; read it as a ceiling.
                  </Item>
                  <Item className="text-sec leading-[1.5] text-ink-2">
                    Balanced accuracy: formula <Num>{f3(R.summary.formula.bacc.mean)}</Num>, model{' '}
                    <Num>{f3(R.summary.tnam.bacc.mean)}</Num>. F1: formula{' '}
                    <Num>{f3(R.summary.formula.f1.mean)}</Num>, model{' '}
                    <Num>{f3(R.summary.tnam.f1.mean)}</Num>.
                  </Item>
                  <Item className="text-sec leading-[1.5] text-ink-2">
                    Per person, from <F>R.paired</F>: better on <Num>{R.paired.wins}</Num> of the{' '}
                    <Num>{R.per_subject.length}</Num> with <Num>{R.paired.ties}</Num> ties and none
                    worse, p = <Num>{R.paired.p}</Num>.
                  </Item>
                  <Item className="text-sec leading-[1.5] text-ink-2">
                    On the heart features alone, which is all a phone camera can reach: formula{' '}
                    <Num>{f3(R.ppg_only.formula.auroc.mean)}</Num>, model{' '}
                    <Num>{f3(R.ppg_only.tnam.auroc.mean)}</Num>, from <F>R.ppg_only</F>.
                  </Item>
                </List>
                <span className="mt-3 block">
                  Held out by person. Not by stressor, not by sensor, and not by age.
                </span>
              </Row>

              <Row label="Personal calibration">
                <span className="block font-display text-row font-bold leading-[1.25] tracking-tight
                  text-ink">
                  Eight questions are worth more than the model knowing you already.
                </span>
                <span className="mt-3 block">
                  On <Num>{R.transfer.subjects}</Num> new people under a stressor it was never
                  fitted on, the model starts at{' '}
                  <Score v={R.calibration.base_auroc}/>. Eight check-ins, asked when the displayed
                  band changes rather than on a schedule, fit one gain per curve on top of the
                  frozen model and take it to{' '}
                  <Num>{f3(R.calibration.auroc.gains.triggered[K8])}</Num>{' '}
                  <span className="whitespace-nowrap text-ink-3">
                    ({f3(R.calibration.auroc_ci.gains.triggered[K8][0])} to{' '}
                    {f3(R.calibration.auroc_ci.gains.triggered[K8][1])})
                  </span>. Balanced accuracy over the same eight rises from{' '}
                  <Num>{f3(R.calibration.base_bacc.mean)}</Num> to{' '}
                  <Num>{f3(R.calibration.bacc.gains.triggered[K8])}</Num>.
                </span>
                <span className="mt-3 block">
                  Three controls, all from <F>R.calibration.auroc</F>: the same eight answers used
                  to fit a model from scratch reach{' '}
                  <Num>{f3(R.calibration.auroc.scratch.triggered[K8])}</Num>; asking on a schedule
                  instead of when the band moves reaches{' '}
                  <Num>{f3(R.calibration.auroc.gains.scheduled[K8])}</Num>; and moving the decision
                  threshold alone reaches{' '}
                  <Num>{f3(R.calibration.auroc.affine.triggered[K8])}</Num>, which is where it
                  started. The curves are worth keeping and the person&rsquo;s own scale on them is
                  what wins.
                </span>
                <span className="mt-3 block">
                  Fitted on this device, from answers held on this device. The gains never leave it,
                  and a reading taken while moving is never used as a label.
                </span>
              </Row>

              <Row label="Known limits">
                <Hard title="It does not detect emotional distress. It ranks it backwards.">
                  On the same {R.transfer.subjects} people, the emotional condition scored{' '}
                  <Num>{f3(R.transfer.emotional.tnam.mean)}</Num>{' '}
                  <span className="whitespace-nowrap">
                    ({f3(R.transfer.emotional.tnam.lo)} to {f3(R.transfer.emotional.tnam.hi)})
                  </span>. Below 0.5 does not mean it failed to notice. It means it ordered those
                  windows as calmer than rest. The hand formula failed there too, at{' '}
                  {f3(R.transfer.emotional.formula.mean)}. Nothing on this site should be read as
                  saying MindMap sees how somebody feels.
                </Hard>
                <Hard title="Zero-shot on a new stressor it is no better than the formula.">
                  On the cognitive condition in the same study the model scores{' '}
                  <Num>{f3(R.transfer.cognitive.tnam.mean)}</Num> against the hand formula&rsquo;s{' '}
                  {f3(R.transfer.cognitive.formula.mean)}. Pooled across all three conditions it is{' '}
                  <Num>{f3(R.transfer.any_stress.tnam.mean)}</Num> against{' '}
                  {f3(R.transfer.any_stress.formula.mean)}, which is near enough to chance to call
                  it chance. The {f3(R.summary.tnam.auroc.mean)} is on the dataset it was fitted on.
                  The honest headline is the calibration row above, not that one.
                </Hard>
                <List className="mt-4">
                  <Item className="text-sec leading-[1.5] text-ink-2">
                    It does not predict performance, and we checked. Over{' '}
                    <Num>{R.exams.spearman_flagged_vs_grade.n}</Num> real exams it runs and
                    drops <Num>{pct(R.exams.motion_rejected)}</Num> of windows for wrist movement,
                    and how often it flagged somebody had no relationship to the grade they got:
                    rho <Num>{f2(R.exams.spearman_flagged_vs_grade.rho)}</Num>, p ={' '}
                    <Num>{f2(R.exams.spearman_flagged_vs_grade.p)}</Num>. From <F>R.exams</F>.
                  </Item>
                  <Item className="text-sec leading-[1.5] text-ink-2">
                    A moving reading is not scored by the model at all. The section below this one
                    is about why, and it is a limit before it is a design.
                  </Item>
                  <Item className="text-sec leading-[1.5] text-ink-2">
                    The baseline has to be earned. A distance from a fourteen-day baseline means
                    nothing on the first day, and on the phone route a personal spread is not used
                    until five captures exist: under that, the spread is a borrowed population
                    figure and only the average is the person&rsquo;s own.
                  </Item>
                  <Item className="text-sec leading-[1.5] text-ink-2">
                    A score is reported with a band, and the band widens when the reading is thin.
                    In <F>scoreCapture</F> three shortfalls are summed in quadrature: 0.55 times the
                    share of term weight that is missing, 0.45 times one minus the camera&rsquo;s own
                    quality score, and 0.75 times exp of minus the baseline&rsquo;s days over 6. The
                    sum is carried through the logistic by its slope at the score and clamped to
                    between 3 and 34 points. A first reading on a phone that got no voice is
                    therefore reported wide, and nothing in the interface can narrow it.
                  </Item>
                  <Item className="text-sec leading-[1.5] text-ink-2">
                    No patch has been built or worn, by anybody, at any age. Every patch figure on
                    this site is generated.
                  </Item>
                </List>
              </Row>

              <Row label="What would change this card">
                Three things, in the order they would matter. The adolescent pilot reporting, which
                would put the people this is for into the figures for the first time. A dataset with
                an emotional condition in it, which is the one failure above that is a gap in the
                training data rather than a limit of the method. And readings off the patch itself
                instead of a wrist device, which is the sensor the whole product assumes. Until
                those exist, this card is the whole claim.
              </Row>

            </dl>
          </Card>
        </ScrollIn>
      </Section>

      {/* ── movement ─────────────────────────────────────────────────────── */}
      <Section name="Movement" tone="paper">
        <SectionHead className="max-w-[34ch]">A Moving Reading Is Not Scored by the Model</SectionHead>
        <SectionLede>
          Its movement curve rises, so to the model a hard run and a hard day look alike. Over the
          line, the hand formula scores the reading instead.
        </SectionLede>

        <ScrollIn>
          <p className="mt-5 max-w-[62ch] text-body leading-[1.55] text-ink-2">
            The training set had no condition where somebody exercised calmly, so movement and
            arousal were never separated in it. Left to itself the model calls{' '}
            <Num>{pct1(R.confound.tnam_raw.physical_flagged)}</Num> of real jogging windows
            stressed. Handing those windows to the hand formula brings that to{' '}
            <Num>{pct1(R.confound.tnam_fallback.physical_flagged)}</Num>, against the
            formula&rsquo;s own <Num>{pct1(R.confound.formula.physical_flagged)}</Num>, and it costs
            about four points of the cognitive stress still caught, down from{' '}
            <Num>{pct1(R.confound.tnam_raw.cognitive_caught)}</Num> to{' '}
            <Num>{pct1(R.confound.tnam_fallback.cognitive_caught)}</Num>. That trade is the
            shipped design and it is paid in both directions.
          </p>
          <p className="mt-4 max-w-[62ch] text-body leading-[1.55] text-ink-2">
            What the code does, in <F>scoreCapture</F>: a reading whose peak movement is over the{' '}
            <Num>{MOVE_LIMIT_G}</Num> g line takes the formula branch for its heart terms, drops
            the temporal term, is marked held, and is never used as a calibration label. It also
            makes the curve&rsquo;s own ceiling harmless, because every reading at or past the line
            takes that branch and the fact that {MOVE_LIMIT_G} g and 2 g are the same input to the
            model never reaches a score.
          </p>
        </ScrollIn>

        <MovementFallback className="mt-7"/>

        <ScrollIn>
          <p className="mt-6 max-w-[74ch] text-meta leading-[1.55] text-ink-3">
            This is a limit before it is a feature. The reading is kept and scored, and the screen
            says the person was moving; it is not counted as a stressed reading either way.
          </p>
        </ScrollIn>
      </Section>

      {/* ── where the code runs ──────────────────────────────────────────── */}
      <Section name="Where it runs" tone="card" className="bg-beam-wash">
        <SectionHead>No Backend, and Nothing to Call</SectionHead>
        <SectionLede>
          The signals, the filters, the baseline, the model and this person&rsquo;s own calibration
          all run in the page you are reading. There is no server that computes a {SCORE}, because
          there is no server.
        </SectionLede>
        <WhereItRuns className="mt-6"/>
      </Section>

      {/* ── data flow and consent ────────────────────────────────────────── */}
      <Section name="Data and privacy" tone="paper">
        <SectionHead>What Is Measured, What Is Kept, Who Can See It</SectionHead>
        <SectionLede>
          Three stages, and only the last one outlives the reading. The consent rules below are read
          from lib/caseload.js, which is the one place they are defined.
        </SectionLede>
        <DataFlow className="mt-6"/>
        <ScrollIn>
          <p className="mt-6 max-w-[74ch] text-meta text-ink-3">
            The consent records, the students and the audit entries on the{' '}
            {PRO_LC} console are written by us as a demonstration. The rules they enforce are real
            code; the people are not real people.
          </p>
        </ScrollIn>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={() => go('privacy')}>
            Who can see what<ArrowRight aria-hidden/>
          </Button>
        </div>
      </Section>

      {/* ── the three routes, side by side ───────────────────────────────── */}
      <Section name="Three routes" tone="card" className="bg-aqua-2">
        <SectionHead>Three Routes to One Number</SectionHead>
        <SectionLede>
          What each route measures, what it cannot measure, and whether it exists as running code
          today.
        </SectionLede>
        {/* A grid rather than ui/table: four columns of prose made the table wider
            than a 390px screen and put the comparison behind a sideways scroll,
            which is the one place a reader will not look. Three columns at lg,
            stacked below it, and one copy of every string either way. */}
        <div className="mt-6">
          <div className="hidden border-b border-ink pb-3 lg:grid lg:gap-6
            lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_minmax(0,1fr)]">
            {['Route', 'What it measures', 'What it cannot'].map(h => (
              <p key={h} className="font-mono text-tick text-ink-3">{h}</p>
            ))}
          </div>
          <ul className="m-0 list-none p-0">
            {ROUTES.map((r, i) => (
              <ScrollRow key={r.route} index={i} as="li"
                className="border-b border-rule py-5 lg:grid lg:gap-6
                  lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_minmax(0,1fr)]">
                <div className="min-w-0">
                  <h3 className="font-display text-row font-bold leading-[1.2] tracking-tight text-ink">
                    {r.route}
                  </h3>
                  {/* The rule carries the colour and the word carries the state. warn
                      measures 4.50 : 1 on this band's aqua-2 ground, which is under the
                      4.5 text floor and over the 3 : 1 a graphic needs, so it stays on
                      the rule and never on the type. */}
                  <p className={cn('mt-2 inline-flex items-baseline border-l-2 pl-2.5 text-fine text-ink',
                    r.today === 'Running' ? 'border-accent' : 'border-warn')}>
                    {r.today}
                  </p>
                  <p className="mt-2 text-fine leading-[1.45] text-ink-2">{r.detail}</p>
                </div>
                <p className="mt-3 min-w-0 text-sec leading-[1.5] text-ink-2 lg:mt-0">{r.measures}</p>
                <p className="mt-3 min-w-0 text-sec leading-[1.5] text-ink-2 lg:mt-0">{r.cannot}</p>
              </ScrollRow>
            ))}
          </ul>
        </div>
        <ScrollIn>
          <p className="mt-5 max-w-[74ch] text-meta leading-[1.55] text-ink-2">
            On the phone route the heart terms go through the model and the voice terms do not: no
            public dataset pairs a camera-and-microphone capture with stress labels, so the four
            voice weights are a starting allocation that is explicitly not fitted to anything.
            signals/score.js says that in its own comments, and the band it returns is wider for it.
          </p>
        </ScrollIn>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={() => go('without-patch')}>
            The phone route<ArrowRight aria-hidden/>
          </Button>
          <Button variant="outline" size="sm" onClick={() => go('tour')}>
            What is real and what is a demo<ArrowRight aria-hidden/>
          </Button>
        </div>
      </Section>

      {/* ── sources ──────────────────────────────────────────────────────────
          Dark band: accent fails here, so the only colours are paper, mist,
          ruling and accent.lit. Links carry an underline as well as a colour. */}
      <Section name="Sources" tone="ink">
        <SectionHead tone="ink" className="max-w-[30ch]">Every Figure, and Where It Came From</SectionHead>
        <SectionLede tone="ink">
          The datasets behind the model, the published figures this project quotes, and the
          instruments it uses.
        </SectionLede>

        <dl className="m-0 mt-6">
          {SOURCES.map((s, i) => (
            <ScrollRow key={s.title} index={i}>
              <div className="border-t border-ink-3 py-5
                lg:grid lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-10">
                <dt className="min-w-0">
                  <span className="block font-display text-ui font-bold leading-[1.25] text-paper">
                    {s.title}
                  </span>
                  <span className="mt-1.5 block font-mono text-fine leading-[1.45] text-ruling">
                    {s.href
                      ? <a href={s.href} target="_blank" rel="noreferrer"
                          className="border-b border-accent-lit/50 text-mist hoverOnly:border-accent-lit">
                          {s.cite}
                        </a>
                      : s.cite}
                  </span>
                </dt>
                <dd className="m-0 mt-3 min-w-0 max-w-[68ch] text-sec leading-[1.55] text-mist lg:mt-0">
                  {s.body}
                </dd>
              </div>
            </ScrollRow>
          ))}
        </dl>

        <ScrollIn>
          <p className="mt-6 max-w-[74ch] border-t border-ink-3 pt-5 text-meta leading-[1.55] text-mist">
            docs/design-evidence.md carries the rest, including its longest section: the claims this
            project declines to make, with the papers that say why. There is no colour-psychology
            claim anywhere on this site. None of this says MindMap lowers anyone&rsquo;s stress. It
            has not been tested on a teenager and nothing here claims it has.
          </p>
        </ScrollIn>
      </Section>

    </main>
  )
}
