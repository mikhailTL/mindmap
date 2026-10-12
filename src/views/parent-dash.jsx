import React from 'react'
import { Chevron } from '../ui/marks'
import { DemoNotice, RealNotice } from '../ui/notice'
import { useMode } from '../lib/mode'
import { DATA } from '../lib/assets'
import { CONSENT } from '../lib/caseload'
import { cn } from '../lib/utils'
import { SCORE, NOTES, LOCATION, CONSENT_SHORT, CONSENT_OFF } from '../lib/terms'

/* The parent dashboard.
 *
 * CONSENT SCOPE: nothing on this screen is finer-grained than a day. No raw
 * reading, Notes entry or Location may appear at any depth, behind any drawer,
 * export or link. The "What is shared" and "What this screen never shows you"
 * sections state that promise explicitly rather than leaving it to be inferred
 * from an absence — both are required, not decorative. */

const CHILD = 'Maya'
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const FULL = { Mon:'Monday', Tue:'Tuesday', Wed:'Wednesday', Thu:'Thursday',
               Fri:'Friday', Sat:'Saturday', Sun:'Sunday' }
const WEEKEND = new Set(['Sat', 'Sun'])

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven']
const word = n => WORDS[n] ?? String(n)
const list = xs => xs.length < 2 ? (xs[0] ?? '')
  : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`

/* Single source for every figure on this screen, off the same fixture the rest
   of the app reads. Never retype a count as a literal below: the figure, the
   sentence, the day rows and the flagged day have to move together. */
function readWeek() {
  const band = DATA.weekBand
  const days = (DATA.week ?? []).map(d => ({
    key: d.d, name: FULL[d.d] ?? d.d, over: d.v > band.hi, v: d.v,
  }))
  const over = days.filter(d => d.over)
  const school = days.filter(d => !WEEKEND.has(d.key))
  /* Flagged day = furthest above her own range, not the latest. No day above
     the band means nothing is flagged. */
  const peak = over.length ? over.reduce((a, b) => (b.v > a.v ? b : a)) : null
  return {
    days, over, peak,
    schoolOver: over.filter(d => !WEEKEND.has(d.key)),
    weekendOver: over.filter(d => WEEKEND.has(d.key)),
    schoolCount: school.length,
    last: days[days.length - 1],
  }
}

/* Branched, not templated: a quiet week must not read "no of five". */
function headline(w) {
  if (!w.days.length) return null
  if (!w.over.length) return `${CHILD} stayed inside her usual range every day this week.`
  if (w.over.length === w.days.length) return `Every day this week ran above ${CHILD}'s usual range.`
  if (!w.weekendOver.length)
    return `${list(w.schoolOver.map(d => d.name))}. Both weekend days were inside her usual range.`
  return `${list(w.over.map(d => d.name))}.`
}

/* The unit changes with the shape of the week: "of her five school days" is
   false once a weekend day runs high. */
function unit(w) {
  if (!w.over.length) return `days above her usual range, of ${word(w.days.length)}`
  if (!w.weekendOver.length)
    return `days above her usual range, of her ${word(w.schoolCount)} school days`
  return `days above her usual range, of ${word(w.days.length)}`
}

/* ── 2. The week, at day grain and no finer ─────────────────────────────── */
/* Above or inside, and nothing else. The daily score must not be added here:
   a number per day invites hour-by-hour tracking, which the consent scope does
   not permit a parent.

   Colour is never the only carrier — the word is the state and the weight
   differs too, so the rows survive grayscale. */
function WeekDays({ days, empty }) {
  const cells = empty ? DAYS.map(k => ({ key:k, name:FULL[k] })) : days
  return (
    <ul className="m-0 list-none p-0">
      {cells.map(d => {
        const state = empty ? 'none' : d.over ? 'over' : 'in'
        return (
          <li key={d.key}
            className="flex items-center justify-between gap-4 border-b border-rule py-3.5">
            <span className="text-body text-ink">{d.name}</span>
            <span className={cn('font-display text-ui',
              state === 'over' ? 'font-bold text-warn'
                : state === 'none' ? 'font-medium text-ink-3' : 'font-medium text-ink-2')}>
              {state === 'over' ? 'Above' : state === 'none' ? 'No data' : 'Inside'}
            </span>
          </li>
        )
      })}
    </ul>
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
      <p className="mt-4 max-w-[56ch] text-body text-ink-2">Nothing is flagged this week. This screen
        only ever flags a day that sat above {CHILD}&rsquo;s own range, and no day did.</p>
    )
  }
  return (
    <>
      <p className="mt-4 max-w-[56ch] text-body text-ink">{w.peak.name} sat further above her usual
        range than any other day this week. Her body was working harder that day than it usually
        does. It does not say why, and it is not a diagnosis.</p>
      <ul className="m-0 mt-6 list-none p-0">
        {openers(w.peak.name).map(o => (
          <li key={o} className="border-b border-rule py-3.5 text-body text-ink">&ldquo;{o}&rdquo;</li>
        ))}
      </ul>
      <p className="mt-5 max-w-[56ch] text-sec text-ink-2">Not this: &ldquo;Your patch says you were
        stressed on {w.peak.name}.&rdquo; She can see this page too, and leading with it turns a
        conversation into a review.</p>
      <p className="mt-3 max-w-[56ch] text-sec text-ink-2">If you are worried about her safety, do
        not wait for next week&rsquo;s summary. Contact her medical professional, or your local crisis
        line.</p>
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
/* Read from the same CONSENT record the medical professional's console reads. Never keep a
   second copy here — a consent screen that disagrees with the console is worse
   than none. */
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

function SchoolSharing({ real }) {
  /* Real mode has no signed consent, so every row starts closed and the
     controls are disabled. Do not default any scope on. */
  const [share, setShare] = React.useState(() => ({
    score: !real && RECORD.score, trends: !real && RECORD.trends, raw: !real && RECORD.raw,
  }))
  return (
    <>
      <ul className="m-0 list-none p-0">
        {SCOPES.map(s => (
          <li key={s.id}
            className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-rule py-4">
            <span className="min-w-0 flex-1 basis-[18rem]">
              <span className="block text-body text-ink">{s.label}</span>
              <span className="block text-sec text-ink-2">{s.sub}</span>
            </span>
            <Switch on={share[s.id]} disabled={real} label={s.label}
              onClick={() => setShare(p => ({ ...p, [s.id]: !p[s.id] }))}/>
          </li>
        ))}
        {/* Not a choice, but listed as a disabled control rather than omitted:
            a scope a parent cannot find reads as a scope that does not
            exist. */}
        <li className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-rule py-4">
          <span className="min-w-0 flex-1 basis-[18rem]">
            <span className="block text-body text-ink">A crisis alert</span>
            <span className="block text-sec text-ink-2">Cannot be turned off by you or by your
              child. Both of you are told this before the patch is first worn.</span>
          </span>
          <Switch on disabled label="A crisis alert"/>
        </li>
      </ul>
      {real ? (
        <p className="mt-5 max-w-[62ch] text-sec text-ink-2">No consent has been signed, because no
          patch is paired. Nothing is being shared with any school. These controls become live when a
          patch is paired and a guardian consent is signed.</p>
      ) : (
        <>
          <p className="mt-5 max-w-[62ch] text-sec text-ink-2">{CONSENT_OFF} She cannot widen these
            rows, and neither can the school. Second-by-second readings are kept only for the window
            she sets, then deleted, with no archive and no backup. You are never shown them.</p>
          <p className="mt-3 max-w-[62ch] text-sec text-ink-3">On the school console she is
            {' '}{SCHOOL_CODE}, under {RECORD.basis}, signed {RECORD.signedAt}. In this demo a switch
            changes this page only. In the product it writes a dated row in the school&rsquo;s consent
            log, and {CHILD} is told the same day.</p>
        </>
      )}
    </>
  )
}

/* ── 6. Is the patch even reporting ─────────────────────────────────────── */
/* States how many days reported, not the state of the child: an unmeasured week
   and a calm week are indistinguishable otherwise. In real mode this leads the
   page — it is the reason there is no data, not a footnote about it. */
function PatchStatus({ real, w }) {
  const rows = real
    ? [['Status', 'Not reporting'],
       ['Days with readings this week', `0 of ${DAYS.length}`],
       ['Last reading', 'None']]
    : [['Status', 'Reporting'],
       ['Days with readings this week', `${w.days.length} of ${w.days.length}`],
       ['Most recent day with readings', w.last?.name ?? 'None']]
  return (
    <>
      {real && <RealNotice className="mb-5">Nothing has been measured, so there is nothing on this
        page to read. An empty week is not a calm week, and this screen will not draw it as one.</RealNotice>}
      <dl className="m-0 list-none p-0">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4 border-b border-rule py-3.5">
            <dt className="text-body text-ink">{k}</dt>
            <dd className={cn('m-0 shrink-0 font-display text-ui font-medium',
              real ? 'text-crit' : 'text-ink-2')}>{v}</dd>
          </div>
        ))}
      </dl>
      {real ? (
        <ul className="m-0 mt-5 list-none p-0">
          {['Open MindMap on your child’s phone and pair a patch.',
            'Check the patch is charged and sitting on the upper arm.',
            'This page fills in at the end of the first full week it reports.'].map(s => (
            <li key={s} className="max-w-[56ch] text-sec text-ink-2">{s}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 max-w-[62ch] text-sec text-ink-2">If a day is missing from the rows above,
          the patch was off or flat that day. A missing day is not a calm day, and this screen will
          not read it as one.</p>
      )}
    </>
  )
}

/* ── The screen ─────────────────────────────────────────────────────────── */
export function ParentDash({ go, openTab }) {
  const [mode] = useMode()
  const real = mode === 'real'
  const w = readWeek()

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-row font-bold text-ink">
          {real ? 'No patch paired' : CHILD}</h2>
        {!real && <span className="note">This week · {w.days[0]?.name} to {w.last?.name}</span>}
      </div>

      {/* Real mode leads with the fault; demo mode takes the patch last. */}
      {real ? (
        <section className="mt-8"><PatchStatus real={real} w={w}/></section>
      ) : (
        <>
          <DemoNotice className="mt-3">{CHILD} is not a real person. Every figure on this screen is
            generated from the scoring model; nobody has worn a patch and nobody was measured.</DemoNotice>

          {/* 1. The figure and the sentence that reads it. text-dial matches
                the student screen's score — same kind of statement. */}
          <section className="mx-auto mt-10 max-w-[34rem] text-center">
            <p className="m-0 font-display text-dial font-medium leading-none tracking-tight text-ink">
              {w.over.length}</p>
            <p className="mx-auto mt-2 max-w-[28ch] text-tick text-ink-3">{unit(w)}</p>
            <p className="mx-auto mt-6 max-w-[34ch] text-body text-ink-2">{headline(w)}</p>
          </section>

          <section className="mt-12">
            <h2 className="mark">Day by day</h2>
            <WeekDays days={w.days}/>
            <p className="mt-4 max-w-[62ch] text-sec text-ink-2">Above or inside her own range, and
              that is the whole of it. No daily {SCORE} sits here, and no hour, minute or reading
              behind these rows for anyone to open. Her usual range is worked out from her own last
              two weeks; she is never compared with other students.</p>
          </section>

          <section className="mt-12">
            <h2 className="mark">What to ask about</h2>
            <AskAbout w={w}/>
          </section>
        </>
      )}

      {real && (
        <section className="mt-12">
          <h2 className="mark">The last seven days</h2>
          <WeekDays days={w.days} empty/>
          <p className="mt-4 max-w-[62ch] text-sec text-ink-2">Seven days, none of them measured.
            These stay empty until a patch reports. Nothing is flagged, because nothing was
            measured, and that is not the same as a week with nothing in it.</p>
        </section>
      )}

      <section className="mt-12">
        <h2 className="mark">What is shared</h2>
        <p className="mt-4 max-w-[62ch] text-sec text-ink-2">{CONSENT_SHORT}</p>
        <SchoolSharing real={real}/>
      </section>

      <section className="mt-12">
        <h2 className="mark">What this screen never shows you</h2>
        <p className="mt-4 max-w-[62ch] text-sec text-ink-2">There is no drawer, no export and no
          link that opens any of it.</p>
        <ul className="m-0 mt-4 list-none p-0">
          {NEVER.map(([t, s]) => (
            <li key={t} className="border-b border-rule py-3.5">
              <span className="block text-body text-ink">{t}</span>
              <span className="block text-sec text-ink-2">{s}</span>
            </li>
          ))}
        </ul>
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

      {/* 6. Patch status, in its reading-order position */}
      {!real && (
        <section className="mt-12">
          <h2 className="mark">The patch</h2>
          <div className="mt-4"><PatchStatus real={real} w={w}/></div>
        </section>
      )}

      <p className="mt-14 max-w-[70ch] text-meta text-ink-3">MindMap reports patterns in body signals.
        It is not a medical device. It does not diagnose or treat any condition. Nothing on this
        screen is a clinical finding.</p>
    </>
  )
}
