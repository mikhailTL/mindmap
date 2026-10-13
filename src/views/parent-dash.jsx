import React from 'react'
import { Chevron } from '../ui/marks'
import { DemoNotice, RealNotice } from '../ui/notice'
import { List, Item } from '../ui/list'
import { Panel } from '../ui/display'
import { TONES } from './Monitor'
import { RainbowDial } from '../charts/rainbow'
import { WeekChart } from '../charts/week'
import { useMode } from '../lib/mode'
import { DATA } from '../lib/assets'
import { AUDIT_LOG, CONSENT, CONSENT_LEDGER, K_ANONYMITY, PROTOCOL, PROTOCOL_DONE,
  PROTOCOL_TIMES, SCHOOL_N } from '../lib/caseload'
import { bandOf } from '../signals/score'
import { cn } from '../lib/utils'
import { SCORE, NOTES, LOCATION, PRO_LC, CONSENT_SHORT, CONSENT_OFF } from '../lib/terms'

/* The parent dashboard.
 *
 * CONSENT SCOPE: a parent sees the Mind Score for each day and for the week,
 * whether a day sat above the student's own usual range, roughly how long they
 * slept, and whether the patch was worn. Nothing finer than a day. No raw
 * reading, Notes entry or Location at any depth, behind any drawer, export or
 * link. The four per-signal rings the student screen draws are not a parent's
 * to see either, so the hero dial carries one band, the week's score. "What
 * the school may see" and "What this screen never shows you" state the promise
 * rather than leaving it to be inferred from an absence; both are required.
 *
 * NO NAME: the child is never given a first name. A parent screen is about
 * that parent's own child, so the relationship is the label, and where a code
 * is needed it is the pseudonym the school console already uses. Pronouns are
 * "they", which is also what makes the same copy true in real mode, where
 * there is no child on the account at all.
 *
 * SHAPE: nine modules, each in its own card, per the design spec section 7.
 * One sentence and one dial stay the hero; the week shape, the day figures,
 * the openers, the consent scope, the record's own log, the crisis path and
 * the never-shown list sit under it. Two columns from lg up. */

const CHILD = 'Your child'
const CHILD_POSS = 'your child’s'
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const FULL = { Mon:'Monday', Tue:'Tuesday', Wed:'Wednesday', Thu:'Thursday',
               Fri:'Friday', Sat:'Saturday', Sun:'Sunday' }

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven']
const word = n => WORDS[n] ?? String(n)
const cap = s => s.charAt(0).toUpperCase() + s.slice(1)
const list = xs => xs.length < 2 ? (xs[0] ?? '')
  : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`

/* Still time off the movement channel, in hours. Same figures as the movement
   ring in src/lib/readings.js; held as numbers here because a bar needs a
   length rather than a phrase.

   NOT A SCORING-MODEL OUTPUT. These three come off the patch's movement
   channel against the same wearer's own usual, which is a different route from
   the score the rest of this screen draws, and nobody wrote them down in an
   app. So the tile says where they come from, both figures say "about", and
   the demo notice at the head of the screen names the two routes separately
   rather than crediting every figure here to the model. */
const SLEEP = { nights: 3, hours: 5.5, usual: 8 }
const hrs = h => {
  const m = Math.round((h % 1) * 60)
  return m ? `${Math.floor(h)} h ${m}` : `${h} h`
}

/* Single source for every figure on this screen, off the same fixture the week
   chart draws. Never retype a count as a literal below: the dial, the
   sentence, the strips and the flagged day have to move together. */
function readWeek() {
  const band = DATA.weekBand
  const days = (DATA.week ?? []).map(d => ({
    key: d.d, name: FULL[d.d] ?? d.d, over: d.v > band.hi, v: d.v,
  }))
  const over = days.filter(d => d.over)
  /* Flagged day = furthest above their own range, not the latest. No day above
     the band means nothing is flagged. */
  const peak = over.length ? over.reduce((a, b) => (b.v > a.v ? b : a)) : null
  /* Highest and lowest day of the seven, which is day grain and so inside a
     parent's scope. Read off the same fixture as everything else here. */
  const ranked = [...days].sort((a, b) => b.v - a.v)
  return {
    band, days, over, peak,
    hiDay: ranked[0] ?? null, loDay: ranked[ranked.length - 1] ?? null,
    last: days[days.length - 1],
    avg: days.length ? Math.round(days.reduce((a, d) => a + d.v, 0) / days.length) : null,
    /* The dial's harm anchor: the middle of their own fourteen-day range. */
    usual: Math.round((band.lo + band.hi) / 2),
  }
}

/* Tier colour and tier word, both keyed off bandOf, so this screen and the
   student screen agree on what "usual" means. Colour is never the only
   carrier: the word sits beside the dial and the dial marks the usual day on
   the scale. Hex rather than a class because RainbowDial strokes with it. */
const TIER_TONE = { low:'#0a6e68', usual:'#0a6e68', up:'#8f5a0c', high:'#a8321f' }
const TIER_WORD = { low:'Easier than their usual week', usual:'Inside their usual range',
                    up:'A little above their usual range', high:'Above their usual range' }

/* The same six tones the student screens use, read from `TONES` in
   src/views/Monitor.jsx so the three app screens cannot drift apart, with one
   addition this file needs: the hue's own ink, which is the only one of a
   hue's three tokens allowed to be a word, and which labels a coloured tile
   here. Measured on every wash: ink 12.57, ink-2 7.00, ink-3 5.03, warn 4.87,
   crit 5.63 and each hue's own ink 5.00 at worst, so a coloured module keeps
   AA on every text node.

   The DEFAULT of each hue is used only as an edge. It owes 3 : 1 as a filled
   graphic and clears that on paper and card alone; the grounds here are the
   app canvas `beam/15` and the washes, where mint lands at 2.59 and coral at
   2.78. So nothing on these screens is filled with a DEFAULT, and every bar,
   strip and tier keeps a measured state token.

   Colour says which module this is, never what state it is in: every coloured
   module also prints its state in words. */
const INK = { coral:'text-coral-ink', lilac:'text-lilac-ink', sun:'text-sun-ink',
              mint:'text-mint-ink', sky:'text-sky-ink', blush:'text-blush-ink' }
const TONE = Object.fromEntries(Object.entries(INK)
  .map(([k, ink]) => [k, { ground: TONES[k], ink }]))

/* ── 1. The week in one sentence ────────────────────────────────────────── */
/* Design spec 7c. The sentence is the largest thing on the screen, in plain
   readable words, with the number under it and smaller.

   WHAT IT MAY NOT SAY. MindMap measures physiology. It does not measure
   anxiety, mood or feeling, so a sentence here may say a body worked harder
   and may never say a child was anxious, stressed, sad or struggling. "Three
   days this week were harder on their body than usual" is what was measured.
   "Your child was anxious" is not, and does not ship.

   No figure goes in the sentence itself; the quieter line under it carries the
   days and the range. Branched, not templated: a quiet week must not read
   "no days were harder". */
function heroSentence(w) {
  if (!w.days.length) return null
  const n = w.over.length
  if (!n) return 'This week looked like an ordinary week for their body.'
  if (n === w.days.length) return 'Every day this week was harder on their body than usual.'
  if (n === 1) return 'One day this week was harder on their body than usual.'
  return `${cap(word(n))} days this week were harder on their body than usual.`
}

/* The quieter line: which days, and how far their own range runs. Still day
   grain, still no signal and no reading. */
function heroDetail(w) {
  if (!w.days.length) return null
  const range = `their own usual range, ${w.band.lo} to ${w.band.hi}`
  if (!w.over.length) return `Every day sat inside ${range}, worked out from their own last two weeks.`
  if (w.over.length === 1) return `${w.peak.name} was the one day above ${range}.`
  return `${list(w.over.map(d => d.name))} sat above ${range}, and ${w.peak.name} went the furthest.`
}

/* ── 2. The week, at day grain and no finer ─────────────────────────────── */
/* Seven segments, one per day, and the mark both day tiles share. The figure
   above a strip says how many, so the colour is not the only carrier. */
function DayStrip({ on, tone, label }) {
  return (
    <div className="mt-3 flex gap-1" role="img" aria-label={label}>
      {on.map((v, i) => (
        <span key={i} aria-hidden
          className={cn('h-2.5 flex-1 rounded-bar', v ? tone : 'bg-ink-3/25')}/>
      ))}
    </div>
  )
}

/* `pre` is the hedging word in front of a figure, small and on the same line.
   Set in the figure's own run it wrapped the tile over two lines at 1280. */
function Tile({ label, pre, figure, unit, tone, className, children }) {
  const t = TONE[tone]
  return (
    <div className={cn('rounded-field border p-4', t ? t.ground : TONES.card, className)}>
      <p className={cn('font-display text-tick font-bold', t ? t.ink : 'text-ink-2')}>{label}</p>
      <p className="mt-1.5 font-mono text-stat font-medium leading-none tabular-nums text-ink">
        {pre && <span className="mr-1.5 font-body text-tick font-light text-ink-3">{pre}</span>}
        {figure}
        {unit && <span className="ml-1.5 font-body text-tick font-light text-ink-3">{unit}</span>}
      </p>
      {children}
    </div>
  )
}

/* A key and a figure on one rule. Used by every module that carries a short
   read-only record rather than a chart. */
function Fact({ k, v, tone = 'text-ink' }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-rule py-2.5">
      <dt className="text-meta text-ink-2">{k}</dt>
      <dd className={cn('m-0 shrink-0 font-display text-ui font-medium', tone)}>{v}</dd>
    </div>
  )
}

/* A measured value against the same wearer's own usual, as two bars off one
   zero-based scale. Each bar carries its own name and its own figure, because
   a bar whose only label is in the aria string is a bar a sighted reader has
   to guess at. `top` is the scale's full length, never the larger of the two
   values, so a bar's length is readable as a share of the whole rather than
   only against its neighbour. */
function PairBars({ rows, top, aria }) {
  return (
    <div className="mt-3 flex flex-col gap-2" role="img" aria-label={aria}>
      {rows.map(r => (
        <span key={r.k} aria-hidden className="block">
          <span className="flex items-baseline justify-between gap-2">
            <span className="min-w-0 text-fine text-ink-2">{r.k}</span>
            <span className="shrink-0 font-mono text-fine tabular-nums text-ink">{r.text}</span>
          </span>
          <span className="mt-1 block h-2.5 rounded-bar bg-ink-3/15">
            <span className={cn('block h-full rounded-bar', r.tone)}
              style={{ width: `${Math.round((r.v / top) * 100)}%` }}/>
          </span>
        </span>
      ))}
    </div>
  )
}

/* Worked out from movement, so it is an estimate and both figures say "about". */
function SleepBars() {
  return (
    <PairBars top={Math.max(SLEEP.hours, SLEEP.usual)}
      aria={`About ${hrs(SLEEP.hours)} on ${word(SLEEP.nights)} nights, against their usual of about ${hrs(SLEEP.usual)}.`}
      rows={[
        /* Short keys: the tile is 216px wide at 1280 and the key sits on one
           rule with its figure. The tile's own label carries the full phrase,
           and so does the aria string above. */
        { k:'short nights', v:SLEEP.hours, text:`about ${hrs(SLEEP.hours)}`, tone:'bg-warn' },
        { k:'usual night', v:SLEEP.usual, text:`about ${hrs(SLEEP.usual)}`, tone:'bg-ink-3/40' },
      ]}/>
  )
}

/* Real mode only. A day with no reading says so; an unmeasured week and a calm
   week are indistinguishable otherwise. Day to state is a key/value row, so it
   is a description list and not one of the site's lists. */
function EmptyWeek() {
  return (
    <dl className="m-0 p-0">
      {DAYS.map(k => <Fact key={k} k={FULL[k]} v="No data" tone="text-ink-3"/>)}
    </dl>
  )
}

/* ── 3. The one thing worth asking about ────────────────────────────────── */
/* The openers, the "not this" line and the safety line ship with the flag, not
   behind a link: a flag with no next step gets acted on badly. */
const openers = day => [
  `How was ${day}?`,
  'Anything this week you want to get off your chest?',
  'Do you want me to do something about it, or just listen?',
]

function AskAbout({ w }) {
  if (!w.peak) {
    return (
      <p className="max-w-[52ch] text-sec text-ink-2">No day sat above {CHILD_POSS} own range,
        so nothing is flagged.</p>
    )
  }
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-display text-row font-medium text-ink">{w.peak.name}</p>
        <p className="font-mono text-num font-medium leading-none tabular-nums text-warn">
          {w.peak.v}
          <span className="ml-1.5 font-body text-tick font-light text-ink-3">out of 100</span></p>
      </div>
      <p className="mt-1.5 max-w-[52ch] text-sec text-ink-2">Their body was working harder that day
        than it usually does. This screen cannot say why, and it is not a diagnosis.</p>
      {/* The flagged day on its own leaves the other days above the range
          unnamed, and a parent who asks about one of three has been told a
          third of what this screen knows. Day grain, like everything here. */}
      <dl className="m-0 mt-3.5 p-0">
        {w.over.map(d => (
          <Fact key={d.key} k={d.name === w.peak.name ? `${d.name}, the furthest above` : d.name}
            v={`${d.v} of 100`} tone={d.name === w.peak.name ? 'text-warn' : 'text-ink'}/>
        ))}
        <Fact k="Their own usual range" v={`${w.band.lo} to ${w.band.hi}`}/>
      </dl>
      <List className="mt-4 gap-0">
        {openers(w.peak.name).map(o => (
          <Item key={o} marker="none" className="border-b border-rule py-3 text-body text-ink">
            &ldquo;{o}&rdquo;</Item>
        ))}
      </List>
      <p className="mt-3.5 max-w-[54ch] text-meta text-ink-2">Not this: &ldquo;Your patch says you
        were stressed on {w.peak.name}.&rdquo; They can see this page too.</p>
      <p className="mt-2 max-w-[54ch] text-meta text-ink-2">If you are worried about their safety,
        contact their {PRO_LC} or your local crisis line now, not next week.</p>
    </>
  )
}

/* ── 4. What a parent is never shown ────────────────────────────────────── */
/* Third person, so the same list is true in both modes: in real mode there is
   no child on the account to call "they". */
const NEVER = [
  [NOTES, 'What a student writes in their own journal stays on their phone.'],
  [LOCATION, 'No location is collected, so none can be shared.'],
  ['Their second-by-second readings', 'You get a day, never a moment.'],
  ['Anything they say', 'The microphone is never recorded and never sent.'],
  ['The four signals behind the score',
   'Heart, sweat, temperature and movement stay on your child’s own screen. You get the one number they add up to.'],
]

/* ── 5. What the school may see ─────────────────────────────────────────── */
/* Read from the same CONSENT record the medical professional's console reads.
   Never keep a second copy here: a consent screen that disagrees with the
   console is worse than none. */
const [SCHOOL_CODE, RECORD] = Object.entries(CONSENT)[0]
const LEDGER = CONSENT_LEDGER.find(r => r.student === SCHOOL_CODE) ?? {}

const SCOPES = [
  { id:'score',  label:`The ${SCORE} for the week`,
    sub:'One number for a week. Never a reading.' },
  { id:'trends', label:`Whether the ${SCORE} moved week to week`,
    sub:'Direction only, at week grain.' },
  { id:'raw',    label:'Second-by-second readings',
    sub:'Off unless both you and your child turn it on. You cannot turn it on from this screen.',
    /* The student holds the other half of this one, so a parent cannot widen
       it alone. The row stays, because a scope a parent cannot find reads as a
       scope that does not exist, and it is locked rather than merely defaulted
       off. The words beside the control are what carry the lock: a disabled
       control alone says only "not now". */
    held:'Your child’s switch' },
]

/* A locked row is drawn, not faded. The old disabled state was
   `opacity-45`, which composites the whole control against the card and lands
   white-on-grey at about 2.4 : 1, a fail no contrast sweep catches, because
   element opacity is applied after the colours a checker reads. Locked rows
   keep full-strength ink and say what they are in words beside them. */
function Switch({ on, disabled, label, onClick }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onClick}
      disabled={disabled}
      className={cn('min-h-[44px] shrink-0 rounded-field border px-4 font-display text-ui',
        'transition-[background-color,color,border-color] duration-150 ease-out',
        'disabled:pointer-events-none',
        disabled
          ? on ? 'border-ink-3 bg-mist font-medium text-ink'
               : 'border-ink-3 bg-transparent font-light text-ink-2'
          : on ? 'border-ink bg-ink font-medium text-paper hoverOnly:bg-accent-ink active:bg-accent-ink'
               : 'border-ink bg-transparent font-light text-ink-2 hoverOnly:bg-mist active:bg-mist')}>
      {on ? 'Shared' : 'Not shared'}
    </button>
  )
}

function ScopeRow({ label, sub, children }) {
  return (
    <Item marker="none" className="border-b border-rule py-3.5">
      <span className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
        <span className="min-w-0 flex-1 basis-[15rem]">
          <span className="block text-body text-ink">{label}</span>
          <span className="block text-sec text-ink-2">{sub}</span>
        </span>
        {children}
      </span>
    </Item>
  )
}

function SchoolSharing({ real }) {
  /* Real mode has no signed consent, so every row starts closed and the
     controls are disabled. Do not default any scope on. */
  /* Only the scopes a parent may actually move are in this state. The raw
     scope is deliberately absent: there is nothing here that could flip it. */
  const [share, setShare] = React.useState(() => ({
    score: !real && RECORD.score, trends: !real && RECORD.trends,
  }))
  return (
    <>
      <p className="max-w-[62ch] text-sec text-ink-2">{CONSENT_SHORT}</p>
      <List className="mt-4 gap-0">
        {SCOPES.map(s => (
          <ScopeRow key={s.id} label={s.label} sub={s.sub}>
            {s.held ? (
              /* Read from the consent record and not from this screen's state,
                 so there is no path by which a tap here changes it. Drawn at
                 full strength, like the crisis row below. */
              <span className="flex shrink-0 flex-wrap items-center justify-end gap-x-3 gap-y-2">
                <span className="font-display text-tick font-bold text-ink-2">{s.held}</span>
                <Switch on={!real && !!RECORD[s.id]} disabled
                  label={`${s.label}. Locked here, ${s.held.toLowerCase()}`}/>
              </span>
            ) : (
              <Switch on={share[s.id]} disabled={real} label={s.label}
                onClick={() => setShare(p => ({ ...p, [s.id]: !p[s.id] }))}/>
            )}
          </ScopeRow>
        ))}
        {/* Not a choice, but listed as a disabled control rather than omitted:
            a scope a parent cannot find reads as a scope that does not
            exist. */}
        <ScopeRow label="A crisis alert"
          sub="Cannot be turned off by you or by your child. Both of you are told this before the patch is first worn.">
          <Switch on disabled label="A crisis alert"/>
        </ScopeRow>
      </List>
      {real ? (
        <p className="mt-4 max-w-[62ch] text-sec text-ink-2">No consent has been signed, because no
          patch is paired. These controls become live when a patch is paired and a guardian consent
          is signed.</p>
      ) : (
        <>
          <dl className="m-0 mt-4 p-0">
            <Fact k="Signed scope" v={RECORD.scope}/>
            <Fact k="Legal basis" v={RECORD.basis}/>
            <Fact k="Signed" v={RECORD.signedAt}/>
            <Fact k="Scope expires" v={LEDGER.expires ?? 'Not set'}/>
          </dl>
          <p className="mt-3.5 max-w-[62ch] text-meta text-ink-2">{CONSENT_OFF} Second-by-second
            readings are kept only for the window your child sets, then deleted, and you are never
            shown them.</p>
          <p className="mt-2 max-w-[62ch] text-meta text-ink-3">On the school console your child is
            {' '}{SCHOOL_CODE}. Here a switch changes this page only; in the product it writes a
            dated row in the school&rsquo;s consent log and your child is told the same day.</p>
        </>
      )}
      <div className="mt-4 border-t border-rule pt-4">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-stat font-medium leading-none tabular-nums text-ink">
            {K_ANONYMITY}</span>
          <span className="max-w-[46ch] text-meta text-ink-2">the smallest group the school may
            report on. Under {K_ANONYMITY} consented students a group figure returns nothing, so no
            year group report can single your child out.</span>
        </div>
        {/* The floor means little without the population it is a floor on, so
            the school-wide count is read from the same module the console
            aggregates over rather than written down here. */}
        <dl className="m-0 mt-3.5 p-0">
          <Fact k="Consented students across the school" v={String(SCHOOL_N)}/>
          <Fact k="Smallest group a report may cover" v={`${K_ANONYMITY} students`}/>
        </dl>
      </div>
    </>
  )
}

/* ── 6. The record's own log ────────────────────────────────────────────── */
/* The same append-only log the school console shows, narrowed to this one
   record. A parent being able to read who opened it is the other half of the
   consent promise, so it is on the screen rather than behind a request. */
const MY_ROWS = AUDIT_LOG.filter(r => r.subject === SCHOOL_CODE)

function RecordLog({ real }) {
  return (
    <>
      {real ? (
        <p className="max-w-[58ch] text-sec text-ink-2">Nothing has been logged, because there is no
          record yet. A row is written the first time one is opened.</p>
      ) : (
        <ul className="m-0 list-none p-0">
          {MY_ROWS.map(r => (
            <li key={r.at + r.action} className="border-b border-rule py-3">
              <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                <span className="min-w-0 flex-1 text-meta text-ink">{r.action}</span>
                <span className="shrink-0 font-mono text-tick tabular-nums text-ink-3">{r.at}</span>
              </span>
              <span className="mt-0.5 block text-sec text-ink-3">{r.actor}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 max-w-[58ch] text-meta text-ink-3">Every open, export and setting change
        writes a row. No setting on any screen turns the log off, and no row can be edited or
        deleted.</p>
    </>
  )
}

/* ── 7. What happens if a crisis alert is raised ────────────────────────── */
/* The practice's own protocol, same five steps the console runs, with the step
   that is the call to this parent marked. A promise with no visible mechanism
   behind it is not worth much. */
const GUARDIAN_STEP = PROTOCOL.findIndex(s => /guardian/i.test(s))

/* Minutes between two of the protocol's own clock times. Parsed rather than
   written down: a figure typed in here would disagree with PROTOCOL_TIMES the
   moment that list moved, and this one figure is the whole promise. */
const minuteOf = t => {
  const [, h, m, ap] = t.match(/(\d+):(\d+)\s*([AP]M)/i)
  return ((Number(h) % 12) + (/p/i.test(ap) ? 12 : 0)) * 60 + Number(m)
}
const TO_GUARDIAN = minuteOf(PROTOCOL_TIMES[GUARDIAN_STEP]) - minuteOf(PROTOCOL_TIMES[0])

function CrisisPath({ real }) {
  return (
    <>
      {/* Demo only. In real mode the protocol has never run, so a time against
          a step would be a measurement nobody made. */}
      {!real && (
        <div className="flex items-baseline gap-3 border-b border-rule pb-4">
          <span className="font-mono text-stat font-medium leading-none tabular-nums text-ink">
            {TO_GUARDIAN}</span>
          <span className="max-w-[40ch] text-meta text-ink-2">minutes from the alert to the call to
            you, in the one run logged on this record.</span>
        </div>
      )}
      <ol className={cn('m-0 list-none p-0', !real && 'mt-1')}>
        {PROTOCOL.map((step, i) => (
          <li key={step} className="flex items-baseline gap-3 border-b border-rule py-3">
            <span aria-hidden className="w-4 shrink-0 font-mono text-tick tabular-nums text-ink-3">
              {i + 1}</span>
            <span className="min-w-0 flex-1 text-meta text-ink">{step}</span>
            {i === GUARDIAN_STEP && (
              <span className="shrink-0 font-display text-tick font-bold text-accent">you</span>
            )}
            {!real && (
              <span className="w-[4.5rem] shrink-0 text-right font-mono text-tick tabular-nums text-ink-3">
                {PROTOCOL_DONE.includes(i) ? PROTOCOL_TIMES[i] : 'open'}</span>
            )}
          </li>
        ))}
      </ol>
      <p className="mt-3 max-w-[58ch] text-meta text-ink-3">Step {GUARDIAN_STEP + 1} is the call to
        you. A crisis alert cannot be switched off by you or by your child, and every step above is
        written to the record log.{real ? '' : ' Step ' + PROTOCOL.length + ' is still open on this'
        + ' record, so it carries no time yet.'}</p>
    </>
  )
}

/* ── 8. Is the patch even reporting ─────────────────────────────────────── */
/* Real mode leads with this: it is the reason there is no data, not a footnote
   about it. In demo mode the patch-worn tile carries the same fact. */
function PatchStatus() {
  const rows = [['Status', 'Not reporting'],
                ['Days with readings this week', `0 of ${DAYS.length}`],
                ['Last reading', 'None']]
  return (
    <>
      <RealNotice className="mb-4">Nothing has been measured, so there is nothing on this page to
        read. An empty week is not a calm week, and this screen will not draw it as one.</RealNotice>
      <dl className="m-0 p-0">
        {rows.map(([k, v]) => <Fact key={k} k={k} v={v} tone="text-crit"/>)}
      </dl>
      <List className="mt-4">
        {['Open MindMap on your child’s phone and pair a patch.',
          'Check the patch is charged and sitting on the upper arm.',
          'This page fills in at the end of the first full week it reports.'].map(s => (
          <Item key={s} className="max-w-[56ch] text-sec text-ink-2">{s}</Item>
        ))}
      </List>
    </>
  )
}

/* ── The screen ─────────────────────────────────────────────────────────── */
/* items-start: a grid stretches its children by default, so the shorter
   column of a two-column row used to print a tall empty card rather than
   ending where its content ends. */
const ROW = 'mt-3 grid items-start gap-3 lg:mt-4 lg:gap-4'

export function ParentDash({ go, openTab }) {
  const [mode] = useMode()
  const real = mode === 'real'
  const w = readWeek()
  const tier = w.avg == null ? 'usual' : bandOf(w.avg).key
  /* One band, the week's score. Never a dial at 0 as an empty state: 0 is a
     calm day on this scale, so real mode draws EmptyWeek instead. */
  const weekRing = { id:'week', name:SCORE, value:w.avg ?? 0, glow:TIER_TONE[tier] }
  const measured = w.days.length

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-row font-bold text-ink">
          {real ? 'No patch paired' : `${CHILD}, this week`}</h2>
        {!real && <span className="note">{w.days[0]?.name} to {w.last?.name} · day grain only</span>}
      </div>

      {real ? (
        <>
          <div className={cn(ROW, 'lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]')}>
            <Panel as="h3" label="Is the patch reporting"><PatchStatus/></Panel>
            <Panel as="h3" label="The last seven days">
              <EmptyWeek/>
              <p className="mt-3 max-w-[48ch] text-meta text-ink-3">Seven days, none of them
                measured. Nothing is flagged because nothing was measured, and that is not the same
                as a week with nothing in it.</p>
            </Panel>
          </div>
        </>
      ) : (
        <>
          {/* Two routes, named separately: the scores are the scoring model's
              output and the still-time figures are read off the movement
              channel, so one sentence crediting the model for all of them was
              not true of the sleep tile. */}
          <DemoNotice className="mt-3">Every figure on this screen is generated: the scores by the
            scoring model, the sleep figures off the patch&rsquo;s movement channel, which is why
            those two say about. No child is named or described here; nobody has worn a patch and
            nobody was measured.</DemoNotice>

          {/* The hero, per design spec 7c: the sentence first and largest, in
              plain words with no figure in it, then the quieter line, then the
              number in its own field, smaller. `text-major` runs 34px at 390
              and 46px at 1280; the score under it is `text-num`, 25px, so the
              order of reading is the order of size at every width. The tier
              word sits beside the tier's own rule, so colour never carries
              that state alone. */}
          <div className={ROW}>
            <Panel as="h3" label="Their week in one sentence" className={TONE.blush.ground}
              action={`${measured} of ${DAYS.length} days measured`}>
              <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)] lg:gap-8">
                <div>
                  <p className="max-w-[24ch] font-display text-major font-bold leading-[1.07] tracking-tight text-ink">
                    {heroSentence(w)}</p>
                  <p className="mt-3 max-w-[52ch] text-meta text-ink-2">{heroDetail(w)}</p>
                  <p className="mt-3 flex items-center gap-2.5 font-display text-ui font-medium text-ink">
                    <span aria-hidden className="h-4 w-[3px] shrink-0 rounded-bar"
                      style={{ background: TIER_TONE[tier] }}/>
                    {TIER_WORD[tier]}
                  </p>
                </div>
                <div className={cn('rounded-field border p-4', TONES.card)}>
                  <p className={cn('font-display text-tick font-bold', TONE.blush.ink)}>
                    {SCORE} for the week</p>
                  <p className="mt-1.5 font-mono text-head font-medium leading-none tabular-nums text-ink">
                    {w.avg}
                    <span className="ml-1.5 font-body text-fine font-light text-ink-3">out of 100</span></p>
                  <dl className="m-0 mt-3 p-0">
                    <Fact k="A usual day for them" v={String(w.usual)}/>
                    <Fact k="Their own usual range" v={`${w.band.lo} to ${w.band.hi}`}/>
                    <Fact k="Grain shared with you" v="One day"/>
                  </dl>
                </div>
              </div>
            </Panel>
          </div>

          {/* TWO STACKS, NOT A PANEL BESIDE A STACK. At 1280 the dial panel
              stood alone in the left column at 567px while the right column ran
              to 904px, so the row printed 337px of bare app ground under the
              dial. The sleep tile moved under the dial and the other two moved
              under the chart they belong to: the chart's amber days and the
              above-range tile's amber strip are the same seven days, and the
              patch-worn strip is the same seven again. Measured after:
              796px against 865px. */}
          <div className={cn(ROW, 'lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]')}>
            <div className="flex flex-col gap-3 lg:gap-4">
            <Panel as="h3" label={`The week, ${SCORE} out of 100`}>
              <div className="flex flex-col items-center">
                {/* 380 rather than 320: RainbowDial caps itself at `size` and
                    the card is 440 wide at 1280, so the hero was sitting in a
                    card wider than itself with the slack landing at its foot.
                    Under sm the card is narrower than either figure and the
                    dial takes the card's width, so nothing changes at 390. */}
                {/* Clouds belong to the student dial only, and `weather` is a
                    prop on RainbowDial now, so this is the switch rather than
                    a selector written against that file's internals. */}
                <RainbowDial weather={false} score={w.avg} usual={w.usual}
                  rings={[weekRing]} size={380}/>
              </div>
              <dl className="m-0 mt-4 p-0">
                {w.hiDay && <Fact k="Highest day" v={`${w.hiDay.name}, ${w.hiDay.v}`}
                  tone={w.hiDay.over ? 'text-warn' : 'text-ink'}/>}
                {w.loDay && <Fact k="Lowest day" v={`${w.loDay.name}, ${w.loDay.v}`}/>}
                <Fact k="Days measured" v={`${measured} of ${DAYS.length}`}/>
              </dl>
            </Panel>
              {/* Hours as a decimal, not "5 h 30": the formatted string ran
                  past the tile at 390 and broke the figure over two lines.
                  "about" is the tile's `pre` for the same reason. */}
              <Tile tone="sun" label={`Sleep, ${word(SLEEP.nights)} short nights`}
                pre="about" figure={SLEEP.hours} unit="h a night">
                <SleepBars/>
                {/* Provenance on the tile, because this is the one figure on
                    the screen the scoring model did not produce. */}
                <p className="mt-2 text-fine text-ink-2">Still time off the movement channel, not
                  anything they wrote down.</p>
              </Tile>
            </div>

            <div className="flex flex-col gap-3 lg:gap-4">
              <Panel as="h3" label="Each day, out of 100">
                <WeekChart data={DATA.week} band={DATA.weekBand}/>
                <p className="mt-2 max-w-[54ch] text-meta text-ink-3">The shaded band is their own
                  usual range, worked out from their own last two weeks. They are never compared
                  with other students.</p>
              </Panel>
              {/* The wide tile, under the chart that draws the same seven
                  days. It carries a strip, the day names and a pair of bars,
                  so it takes the column's full width. */}
              <Tile tone="coral"
                label="Above their usual range" figure={w.over.length}
                unit={`of ${measured} days`}>
                <DayStrip tone="bg-warn" on={w.days.map(d => d.over)}
                  label={`${cap(word(w.over.length))} of ${word(measured)} days above their usual range: `
                    + `${list(w.over.map(d => d.name))}.`}/>
                <p className="mt-2 text-fine text-ink-2">
                  {w.over.length ? list(w.over.map(d => d.name)) : 'No day above their range'}</p>
                {/* How far above, which the count alone does not say. Both
                    bars run off the same 0 to 100 scale the score uses. */}
                {w.peak && (
                  <PairBars top={100}
                    aria={`${w.peak.name} scored ${w.peak.v} out of 100, against their usual day of ${w.usual}.`}
                    rows={[
                      { k:w.peak.name, v:w.peak.v, text:`${w.peak.v} of 100`, tone:'bg-warn' },
                      { k:'usual day', v:w.usual, text:`${w.usual} of 100`, tone:'bg-ink-3/40' },
                    ]}/>
                )}
              </Tile>
              <Tile tone="mint" label="Patch worn" figure={measured} unit={`of ${DAYS.length} days`}>
                <DayStrip tone="bg-calm" on={DAYS.map(k => w.days.some(d => d.key === k))}
                  label={`The patch reported on ${word(measured)} of ${word(DAYS.length)} days.`}/>
                <p className="mt-2 text-fine text-ink-2">
                  {measured === DAYS.length ? 'Every day reported'
                    : `${cap(word(DAYS.length - measured))} days with no reading`}</p>
              </Tile>
            </div>
          </div>

          <div className={cn(ROW, 'lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]')}>
            <Panel as="h3" label="What to ask about" className={TONE.lilac.ground}>
              <AskAbout w={w}/></Panel>
            <Panel as="h3" label="Every time this record was opened" action="Append only">
              <RecordLog real={real}/>
            </Panel>
          </div>
        </>
      )}

      {/* Two equal columns rather than 7fr and 5fr: the consent module is one
          card and the column beside it is two, and at 7fr the pair ran 168px
          past the bottom of the consent card. Equal widths put the three
          within a few dozen pixels of each other. */}
      <div className={cn(ROW, 'lg:grid-cols-2')}>
        <Panel as="h3" label="What the school may see" className={TONE.sky.ground}>
          <SchoolSharing real={real}/></Panel>
        <div className="flex flex-col gap-3 lg:gap-4">
          {/* The crisis module keeps card stock and a crit edge. Nothing on
              this screen is coloured to mean urgency; crit is the one colour
              that does, and it is the module's rule rather than its ground. */}
          <Panel as="h3" label="If a crisis alert is raised" className="border-t-2 border-t-crit">
            <CrisisPath real={real}/></Panel>
          <Panel as="h3" label="What this screen never shows you" className={TONE.sky.ground}>
            <p className="max-w-[58ch] text-sec text-ink-2">There is no drawer, no export and no
              link that opens any of it.</p>
            <List className="mt-3 gap-0">
              {NEVER.map(([t, s]) => (
                <Item key={t} marker="none" className="border-b border-rule py-3">
                  <span className="block text-body text-ink">{t}</span>
                  <span className="block text-sec text-ink-2">{s}</span>
                </Item>
              ))}
            </List>
            <button type="button" onClick={() => (openTab ? openTab('shared') : go('privacy'))}
              className="mt-2 flex min-h-[56px] w-full items-center gap-4 py-3 text-left
                transition-colors duration-150 hoverOnly:bg-mist/50">
              <span className="min-w-0 flex-1">
                <span className="block text-body text-ink">Student, parent and medical professional,
                  side by side</span>
                <span className="block text-meta text-ink-2">Every row, and who can see it</span>
              </span>
              <Chevron aria-hidden className="size-4 shrink-0 text-accent"/>
            </button>
          </Panel>
        </div>
      </div>
      {/* No medical disclaimer here. AppFoot in src/views/App.jsx prints one
          immediately below this screen, and the same sentence twice, 24px
          apart, reads as a template rather than as a statement. */}
    </>
  )
}
