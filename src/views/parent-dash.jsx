import React from 'react'
import { Chevron } from '../ui/marks'
import { DemoNotice, RealNotice } from '../ui/notice'
import { List, Item } from '../ui/list'
import { RainbowDial } from '../charts/rainbow'
import { WeekChart } from '../charts/week'
import { useMode } from '../lib/mode'
import { DATA } from '../lib/assets'
import { CONSENT } from '../lib/caseload'
import { bandOf } from '../signals/score'
import { cn } from '../lib/utils'
import { SCORE, NOTES, LOCATION, PRO_LC, CONSENT_SHORT, CONSENT_OFF } from '../lib/terms'

/* The parent dashboard.
 *
 * CONSENT SCOPE: a parent sees the Mind Score for each day and for the week,
 * whether a day sat above the student's own usual range, roughly how long she
 * slept, and whether the patch was worn. Nothing finer than a day. No raw
 * reading, Notes entry or Location at any depth, behind any drawer, export or
 * link. The four per-signal rings the student screen draws are not a parent's
 * to see either, so the hero dial carries one band, the week's score. "What is
 * shared" and "What this screen never shows you" state the promise rather than
 * leaving it to be inferred from an absence; both are required.
 *
 * SHAPE: one hero figure, then charts. The week's one sentence is the only
 * prose that earns its place at full size, because it is the product. The rest
 * of what used to be paragraphs is a strip, a bar or a chart. */

const CHILD = 'Maya'
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
   length rather than a phrase. */
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
  /* Flagged day = furthest above her own range, not the latest. No day above
     the band means nothing is flagged. */
  const peak = over.length ? over.reduce((a, b) => (b.v > a.v ? b : a)) : null
  return {
    band, days, over, peak,
    last: days[days.length - 1],
    avg: days.length ? Math.round(days.reduce((a, d) => a + d.v, 0) / days.length) : null,
    /* The dial's harm anchor: the middle of her own fourteen-day range. */
    usual: Math.round((band.lo + band.hi) / 2),
  }
}

/* Tier colour and tier word, both keyed off bandOf, so this screen and the
   student screen agree on what "usual" means. Colour is never the only
   carrier: the word sits beside the dial and the dial marks her usual day on
   the scale. Hex rather than a class because RainbowDial strokes with it. */
const TIER_TONE = { low:'#0a6e68', usual:'#0a6e68', up:'#8f5a0c', high:'#a8321f' }
const TIER_WORD = { low:'Easier than her usual week', usual:'Inside her usual range',
                    up:'A little above her usual range', high:'Above her usual range' }

/* ── 1. The week in one sentence ────────────────────────────────────────── */
/* One score and one sentence is the product, so this is a first-class element
   on the screen rather than a caption under the dial. Branched, not templated:
   a quiet week must not read "no days ran above". */
function weekSentence(w) {
  if (!w.days.length) return null
  if (!w.over.length) return `${CHILD} stayed inside her usual range every day this week.`
  if (w.over.length === w.days.length) return `Every day this week ran above ${CHILD}’s usual range.`
  return `${cap(word(w.over.length))} days ran above ${CHILD}’s usual range this week, and `
    + `${w.peak.name} was the furthest above.`
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

function Tile({ label, figure, unit, children }) {
  return (
    <div className="field p-4">
      <p className="font-display text-tick font-bold text-ink-2">{label}</p>
      <p className="mt-1.5 font-mono text-stat font-medium leading-none tabular-nums text-ink">
        {figure}
        {unit && <span className="ml-1.5 font-body text-tick font-light text-ink-3">{unit}</span>}
      </p>
      {children}
    </div>
  )
}

/* Two bars off one scale: the three short nights against her own usual. Worked
   out from movement, so it is an estimate and the figures say "about". */
function SleepBars() {
  const top = Math.max(SLEEP.hours, SLEEP.usual)
  return (
    <div className="mt-3 flex flex-col gap-1.5" role="img"
      aria-label={`About ${hrs(SLEEP.hours)} on ${word(SLEEP.nights)} nights, against her usual of about ${hrs(SLEEP.usual)}.`}>
      {[[SLEEP.hours, 'bg-warn'], [SLEEP.usual, 'bg-ink-3/40']].map(([v, tone], i) => (
        <span key={i} aria-hidden className="block h-2.5 rounded-bar bg-ink-3/15">
          <span className={cn('block h-full rounded-bar', tone)}
            style={{ width: `${Math.round((v / top) * 100)}%` }}/>
        </span>
      ))}
    </div>
  )
}

/* Real mode only. A day with no reading says so; an unmeasured week and a calm
   week are indistinguishable otherwise. Day to state is a key/value row, so it
   is a description list and not one of the site's lists. */
function EmptyWeek() {
  return (
    <dl className="m-0 p-0">
      {DAYS.map(k => (
        <div key={k} className="flex items-center justify-between gap-4 border-b border-rule py-3.5">
          <dt className="text-body text-ink">{FULL[k]}</dt>
          <dd className="m-0 shrink-0 font-display text-ui font-medium text-ink-3">No data</dd>
        </div>
      ))}
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
      <p className="mt-4 max-w-[52ch] text-sec text-ink-2">No day sat above {CHILD}&rsquo;s own range,
        so nothing is flagged.</p>
    )
  }
  return (
    <>
      <p className="mt-4 font-display text-row font-medium text-ink">{w.peak.name}</p>
      <p className="mt-1.5 max-w-[52ch] text-sec text-ink-2">Her body was working harder that day than
        it usually does. This screen cannot say why, and it is not a diagnosis.</p>
      <List className="mt-5 gap-0">
        {openers(w.peak.name).map(o => (
          <Item key={o} marker="none" className="border-b border-rule py-3.5 text-body text-ink">
            &ldquo;{o}&rdquo;</Item>
        ))}
      </List>
      <p className="mt-4 max-w-[54ch] text-sec text-ink-2">Not this: &ldquo;Your patch says you were
        stressed on {w.peak.name}.&rdquo; She can see this page too.</p>
      <p className="mt-2 max-w-[54ch] text-sec text-ink-2">If you are worried about her safety, contact
        her {PRO_LC} or your local crisis line now, not next week.</p>
    </>
  )
}

/* ── 4. What a parent is never shown ────────────────────────────────────── */
/* Third person, so the same list is true in both modes: in real mode there is
   no child on the account to call "her". */
const NEVER = [
  [NOTES, 'What a student writes in their own journal stays on their phone.'],
  [LOCATION, 'No location is collected, so none can be shared.'],
  ['Their second-by-second readings', 'You get a day, never a moment.'],
  ['Anything they say', 'The microphone is never recorded and never sent.'],
]

/* ── 5. What the school may see ─────────────────────────────────────────── */
/* Read from the same CONSENT record the medical professional's console reads.
   Never keep a second copy here: a consent screen that disagrees with the
   console is worse than none. */
const [SCHOOL_CODE, RECORD] = Object.entries(CONSENT)[0]

const SCOPES = [
  { id:'score',  label:`The ${SCORE} for the week`,
    sub:'One number for a week. Never a reading.' },
  { id:'trends', label:`Whether the ${SCORE} moved week to week`,
    sub:'Direction only, at week grain.' },
  { id:'raw',    label:'Second-by-second readings',
    sub:'Off unless both you and your child turn it on.' },
]

function Switch({ on, disabled, label, onClick }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onClick}
      disabled={disabled}
      className={cn('min-h-[44px] shrink-0 rounded-field border px-4 font-display text-ui',
        'transition-[background-color,color,border-color] duration-150 ease-out',
        'disabled:pointer-events-none disabled:opacity-45',
        on ? 'border-ink bg-ink font-medium text-paper hoverOnly:bg-accent-ink active:bg-accent-ink'
           : 'border-ink bg-transparent font-light text-ink-2 hoverOnly:bg-mist active:bg-mist')}>
      {on ? 'Shared' : 'Not shared'}
    </button>
  )
}

function ScopeRow({ label, sub, children }) {
  return (
    <Item marker="none" className="border-b border-rule py-4">
      <span className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <span className="min-w-0 flex-1 basis-[18rem]">
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
  const [share, setShare] = React.useState(() => ({
    score: !real && RECORD.score, trends: !real && RECORD.trends, raw: !real && RECORD.raw,
  }))
  return (
    <>
      <List className="mt-4 gap-0">
        {SCOPES.map(s => (
          <ScopeRow key={s.id} label={s.label} sub={s.sub}>
            <Switch on={share[s.id]} disabled={real} label={s.label}
              onClick={() => setShare(p => ({ ...p, [s.id]: !p[s.id] }))}/>
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
        <p className="mt-5 max-w-[62ch] text-sec text-ink-2">No consent has been signed, because no
          patch is paired. These controls become live when a patch is paired and a guardian consent is
          signed.</p>
      ) : (
        <>
          <p className="mt-5 max-w-[62ch] text-sec text-ink-2">{CONSENT_OFF} Second-by-second readings
            are kept only for the window she sets, then deleted, and you are never shown them.</p>
          <p className="mt-3 max-w-[62ch] text-meta text-ink-3">On the school console she is
            {' '}{SCHOOL_CODE}, under {RECORD.basis}, signed {RECORD.signedAt}. Here a switch changes
            this page only; in the product it writes a dated row in the school&rsquo;s consent log and
            {' '}{CHILD} is told the same day.</p>
        </>
      )}
    </>
  )
}

/* ── 6. Is the patch even reporting ─────────────────────────────────────── */
/* Real mode leads with this: it is the reason there is no data, not a footnote
   about it. In demo mode the patch-worn tile carries the same fact. */
function PatchStatus() {
  const rows = [['Status', 'Not reporting'],
                ['Days with readings this week', `0 of ${DAYS.length}`],
                ['Last reading', 'None']]
  return (
    <>
      <RealNotice className="mb-5">Nothing has been measured, so there is nothing on this page to
        read. An empty week is not a calm week, and this screen will not draw it as one.</RealNotice>
      <dl className="m-0 p-0">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4 border-b border-rule py-3.5">
            <dt className="text-body text-ink">{k}</dt>
            <dd className="m-0 shrink-0 font-display text-ui font-medium text-crit">{v}</dd>
          </div>
        ))}
      </dl>
      <List className="mt-5">
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
export function ParentDash({ go, openTab }) {
  const [mode] = useMode()
  const real = mode === 'real'
  const w = readWeek()
  const tier = w.avg == null ? 'usual' : bandOf(w.avg).key
  /* One band, the week's score. Never a dial at 0 as an empty state: 0 is a
     calm day on this scale, so real mode draws EmptyWeek instead. */
  const weekRing = { id:'week', name:SCORE, value:w.avg ?? 0, glow:TIER_TONE[tier] }

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-row font-bold text-ink">
          {real ? 'No patch paired' : CHILD}</h2>
        {!real && <span className="note">This week · {w.days[0]?.name} to {w.last?.name}</span>}
      </div>

      {real ? (
        <>
          <section className="mt-8"><PatchStatus/></section>
          <section className="mt-12">
            <h2 className="mark">The last seven days</h2>
            <EmptyWeek/>
            <p className="mt-4 max-w-[62ch] text-sec text-ink-2">Seven days, none of them measured.
              Nothing is flagged because nothing was measured, and that is not the same as a week with
              nothing in it.</p>
          </section>
        </>
      ) : (
        <>
          <DemoNotice className="mt-3">{CHILD} is not a real person. Every figure on this screen is
            generated from the scoring model; nobody has worn a patch and nobody was measured.</DemoNotice>

          {/* The sentence, then the number. Never the other way round. */}
          <section className="mt-9">
            <p className="mx-auto max-w-[36ch] text-center font-display text-row font-medium text-ink">
              {weekSentence(w)}</p>
            <div className="mx-auto mt-7 flex max-w-[26rem] flex-col items-center">
              <RainbowDial score={w.avg} usual={w.usual} rings={[weekRing]} size={360}/>
              <p className="mt-3 flex items-center gap-2.5 font-display text-ui font-medium text-ink">
                <span aria-hidden className="h-4 w-[3px] shrink-0 rounded-bar"
                  style={{ background: TIER_TONE[tier] }}/>
                {TIER_WORD[tier]}
              </p>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="mark">Each day, out of 100</h2>
            <WeekChart data={DATA.week} band={DATA.weekBand}/>
            <p className="mt-3 max-w-[58ch] text-sec text-ink-2">The shaded band is her own usual
              range, worked out from her own last two weeks. She is never compared with other
              students.</p>
          </section>

          <section className="mt-10 grid gap-3 sm:grid-cols-3">
            <Tile label="Above her usual range" figure={w.over.length} unit={`of ${w.days.length} days`}>
              <DayStrip tone="bg-warn" on={w.days.map(d => d.over)}
                label={`${cap(word(w.over.length))} of ${word(w.days.length)} days above her usual range: `
                  + `${list(w.over.map(d => d.name))}.`}/>
            </Tile>
            <Tile label="Patch worn" figure={w.days.length} unit={`of ${DAYS.length} days`}>
              <DayStrip tone="bg-calm" on={DAYS.map(k => w.days.some(d => d.key === k))}
                label={`The patch reported on ${word(w.days.length)} of ${word(DAYS.length)} days.`}/>
            </Tile>
            <Tile label={`Sleep, ${word(SLEEP.nights)} short nights`} figure={`about ${hrs(SLEEP.hours)}`}
              unit={`usual about ${hrs(SLEEP.usual)}`}>
              <SleepBars/>
            </Tile>
          </section>

          <section className="mt-12">
            <h2 className="mark">What to ask about</h2>
            <AskAbout w={w}/>
          </section>
        </>
      )}

      <section className="mt-12">
        <h2 className="mark">What is shared</h2>
        <p className="mt-4 max-w-[62ch] text-sec text-ink-2">{CONSENT_SHORT}</p>
        <SchoolSharing real={real}/>
      </section>

      <section className="mt-12">
        <h2 className="mark">What this screen never shows you</h2>
        <p className="mt-4 max-w-[62ch] text-sec text-ink-2">There is no drawer, no export and no link
          that opens any of it.</p>
        <List className="mt-4 gap-0">
          {NEVER.map(([t, s]) => (
            <Item key={t} marker="none" className="border-b border-rule py-3.5">
              <span className="block text-body text-ink">{t}</span>
              <span className="block text-sec text-ink-2">{s}</span>
            </Item>
          ))}
        </List>
        <button type="button" onClick={() => (openTab ? openTab('shared') : go('privacy'))}
          className="mt-6 flex min-h-[56px] w-full items-center gap-4 border-b border-rule py-4
            text-left transition-colors duration-150 hoverOnly:bg-mist/50">
          <span className="min-w-0 flex-1">
            <span className="block text-body text-ink">Student, parent and medical professional, side by side</span>
            <span className="block text-meta text-ink-2">Every row, and who can see it</span>
          </span>
          <Chevron aria-hidden className="size-4 shrink-0 text-accent"/>
        </button>
      </section>

      <p className="mt-14 max-w-[70ch] text-meta text-ink-3">MindMap reports patterns in body signals.
        It is not a medical device. It does not diagnose or treat any condition. Nothing on this
        screen is a clinical finding.</p>
    </>
  )
}
