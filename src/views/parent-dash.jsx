import React from 'react'
import { Card } from '../ui/card'
import { Chevron, Always, Never } from '../ui/marks'
import { DemoNotice, RealNotice } from '../ui/notice'
import { useMode } from '../lib/mode'
import { DATA } from '../lib/assets'
import { CONSENT } from '../lib/caseload'
import { ScrollIn } from '../s21/motion'
import { cn } from '../lib/utils'

/* The parent's screen, built from what a parent is actually doing here.
 *
 * What this replaces: ParentBody in Monitor.jsx, which was StudentBody with
 * the nouns changed — the same rainbow dial, the same four signal rings, the
 * same "see every reading" drawer. That is a screen for someone who opens the
 * app daily and wants to know which signal moved. A parent opens this about
 * once a week and is deciding one thing: whether to ask their kid a question
 * tonight, and what question. So the dial is gone, the four-signal breakdown
 * is gone, and the order of the page is the order of that decision:
 *
 *   the answer → which days → the one thing to ask → what you are never
 *   shown → what the school may see → is the patch even reporting
 *
 * Nothing here is finer-grained than a day, and no raw reading, note or
 * location appears at any depth. That is the product's central promise, and
 * sections 4 and 5 state it on the page rather than leaving it to be inferred
 * from what happens to be absent.
 */

const CHILD = 'Maya'
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const FULL = { Mon:'Monday', Tue:'Tuesday', Wed:'Wednesday', Thu:'Thursday',
               Fri:'Friday', Sat:'Saturday', Sun:'Sunday' }
const WEEKEND = new Set(['Sat', 'Sun'])

/* Counts read as words at this size; "3" set at text-major next to a name is a
   figure on a chart, and this line is a sentence. */
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven']
const word = n => WORDS[n] ?? String(n)
const list = xs => xs.length < 2 ? (xs[0] ?? '')
  : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`

/* Every figure on this screen is derived here, from the same fixture the rest
   of the app reads. Nothing below retypes a count as a literal, so a change to
   the generated week changes the sentence, the day row and the flagged day
   together instead of leaving three statements to disagree. */
function readWeek() {
  const band = DATA.weekBand
  const days = (DATA.week ?? []).map(d => ({
    key: d.d, name: FULL[d.d] ?? d.d, over: d.v > band.hi, v: d.v,
  }))
  const over = days.filter(d => d.over)
  const school = days.filter(d => !WEEKEND.has(d.key))
  /* The flagged day is the one furthest above her own range, not the latest
     and not a hand-picked one. If no day is above it, nothing is flagged. */
  const peak = over.length ? over.reduce((a, b) => (b.v > a.v ? b : a)) : null
  return {
    days, over, peak,
    schoolOver: over.filter(d => !WEEKEND.has(d.key)),
    weekendOver: over.filter(d => WEEKEND.has(d.key)),
    schoolCount: school.length,
    last: days[days.length - 1],
  }
}

/* The line a parent came for. Written by branch rather than by template so
   that a quiet week reads like a quiet week instead of "no of five". */
function headline(w) {
  if (!w.days.length) return null
  if (!w.over.length) return `${CHILD} stayed inside her usual range every day this week.`
  if (w.over.length === w.days.length) return `Every day this week ran above ${CHILD}'s usual range.`
  if (!w.weekendOver.length)
    return `${CHILD} ran above her usual range on ${word(w.schoolOver.length)} of her ${word(w.schoolCount)} school days.`
  return `${CHILD} ran above her usual range on ${word(w.over.length)} of the seven days.`
}

function detail(w) {
  if (!w.over.length) return 'No day this week sat above it, school day or weekend.'
  const names = list(w.over.map(d => d.name))
  if (!w.weekendOver.length) return `${names}. Both weekend days were inside it.`
  return `${names}.`
}

/* ── 2. The week, at day grain and no finer ─────────────────────────────── */
/* Seven cells, each saying one word. There is deliberately no daily score
   here: a number invites a parent to watch it move, which is the instrument
   posture this screen exists to avoid. Above / inside is the whole answer.
   Colour is never alone — the word is the state, and the bar differs in weight
   as well as hue so it survives grayscale. */
function WeekDays({ days, empty }) {
  const cells = empty ? DAYS.map(k => ({ key:k, name:FULL[k] })) : days
  return (
    <ol className="mt-4 grid list-none grid-cols-1 gap-1.5 p-0 sm:grid-cols-7 sm:gap-2">
      {cells.map(d => {
        const state = empty ? 'none' : d.over ? 'over' : 'in'
        return (
          <li key={d.key}
            className={cn('flex items-center justify-between gap-3 rounded-xs border px-4 py-3',
              'sm:flex-col sm:items-stretch sm:gap-2.5 sm:px-2 sm:text-center',
              state === 'over' ? 'border-warn bg-warn-wash'
                : state === 'none' ? 'border-dashed border-rule bg-paper' : 'border-rule bg-card')}>
            <span className="font-mono text-tick text-ink-2">
              <span className="sm:hidden">{d.name}</span>
              <span className="hidden sm:inline">{d.key}</span>
            </span>
            <span className={cn('font-display text-fine',
              state === 'over' ? 'font-medium text-warn'
                : state === 'none' ? 'font-medium text-crit' : 'text-ink-2')}>
              {state === 'over' ? 'Above' : state === 'none' ? 'No data' : 'Inside'}
            </span>
            <span aria-hidden className={cn('hidden sm:block',
              state === 'over' ? 'h-2 bg-warn'
                : state === 'none' ? 'h-[3px] border-t-[3px] border-dashed border-ink-3' : 'h-[3px] bg-ink-3')}/>
          </li>
        )
      })}
    </ol>
  )
}

/* ── 3. The one thing worth asking about ────────────────────────────────── */
/* A flag with no next step is worse than no flag: the parent still acts, just
   badly — usually by reading the dashboard out loud at the kitchen table. So
   the opener lines and the one thing not to do are part of the flag, not a
   help article somewhere behind it. */
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
      <p className="mt-4 font-display text-sub font-medium tracking-tight text-ink">{w.peak.name}.</p>
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)] lg:gap-14">
        <div>
          <h3 className="mark">Why it is flagged</h3>
          <p className="mt-3 max-w-[48ch] text-sec text-ink-2">
            {w.peak.name} sat further above her usual range than any other day this week
            {w.over.length > 1 && <>, one of {word(w.over.length)} days that were above it at all</>}.
            It means her body was working harder that day than it usually does. It does not say why,
            and it is not a diagnosis.
          </p>
        </div>
        <div>
          <h3 className="mark">How to raise it</h3>
          <ul className="mt-3 list-none space-y-3 p-0">
            {openers(w.peak.name).map(o => (
              <li key={o} className="border-l-2 border-accent py-0.5 pl-4 text-sec text-ink">
                &ldquo;{o}&rdquo;
              </li>
            ))}
          </ul>
          {/* The failure mode testers described, written down as itself. */}
          {/* The counter-example takes the same ruled form as the openers in
              the warn hue rather than a heavier weight: Chivo loads 300, 400
              and 700 and the site sets none of them bold, so weight is not an
              emphasis this system has. */}
          <p className="mt-5 max-w-[48ch] border-l-2 border-warn py-0.5 pl-4 text-sec text-ink-2">
            Not this: &ldquo;Your patch says you were stressed on {w.peak.name}.&rdquo; She can see
            this page too, and leading with it turns a conversation into a review.</p>
          <p className="mt-4 max-w-[48ch] text-sec text-ink-2">If you are worried about her safety,
            do not wait for next week&rsquo;s summary. Contact her school counselor, or your local
            crisis line.</p>
        </div>
      </div>
    </>
  )
}

/* ── 4. What a parent is never shown ────────────────────────────────────── */
/* Phrased in the third person so the identical list is true in both modes —
   in real mode there is no child on this account to call "her". */
const NEVER = [
  ['Anything they write in the app', 'Notes and check-in answers stay on their phone.'],
  ['Where they were', 'No location is collected, so none can be shared.'],
  ['Their second-by-second readings', 'You get a day, never a moment.'],
  ['Anything they say', 'The microphone is never recorded and never sent.'],
]

/* ── 5. What the school may see ─────────────────────────────────────────── */
/* Read from the same CONSENT record the counselor's console reads, rather than
   a second copy on this screen: when those two were maintained separately they
   disagreed, and a consent screen that contradicts the console is worse than
   no consent screen. */
const [SCHOOL_CODE, RECORD] = Object.entries(CONSENT)[0]

const SCOPES = [
  { id:'score',  label:'A wellness score for the week',
    sub:'One number for a week. Never a reading.' },
  { id:'trends', label:'Whether that score moved week to week',
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
        on ? 'border-ink bg-ink font-medium text-paper hover:bg-accent-ink active:bg-accent-ink'
           : 'border-ink bg-transparent font-light text-ink-2 hover:bg-mist active:bg-mist')}>
      {on ? 'Shared' : 'Not shared'}
    </button>
  )
}

function SchoolSharing({ real }) {
  /* Real mode has no signed consent to load, so the rows start closed and the
     controls are inert — there is nothing yet for them to act on. */
  const [share, setShare] = React.useState(() => ({
    score: !real && RECORD.score, trends: !real && RECORD.trends, raw: !real && RECORD.raw,
  }))
  return (
    <>
      <ul className="mt-4 list-none divide-y divide-rule border-y border-rule p-0">
        {SCOPES.map(s => {
          const on = share[s.id]
          return (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-5">
              <div className="flex min-w-0 flex-1 basis-[18rem] items-start gap-3">
                <span className={cn('mt-1 shrink-0', on ? 'text-accent' : 'text-ink-3')}>
                  {on ? <Always/> : <Never/>}
                </span>
                <span className="min-w-0">
                  <span className="block text-body text-ink">{s.label}</span>
                  <span className="block text-sec text-ink-2">{s.sub}</span>
                </span>
              </div>
              <Switch on={on} disabled={real} label={s.label}
                onClick={() => setShare(p => ({ ...p, [s.id]: !p[s.id] }))}/>
            </li>
          )
        })}
        {/* The one row that is not a choice. It is shown as a control in the
            disabled state rather than left off the list, because a parent who
            cannot find it assumes it does not exist. */}
        <li className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-5">
          <div className="flex min-w-0 flex-1 basis-[18rem] items-start gap-3">
            <span className="mt-1 shrink-0 text-accent"><Always/></span>
            <span className="min-w-0">
              <span className="block text-body text-ink">A crisis alert</span>
              <span className="block text-sec text-ink-2">Cannot be turned off by you or by your
                child. Both of you are told this before the patch is first worn.</span>
            </span>
          </div>
          <Switch on disabled label="A crisis alert"/>
        </li>
      </ul>
      {real ? (
        <p className="mt-5 max-w-[62ch] text-sec text-ink-2">No consent has been signed, because no
          patch is paired. Nothing is being shared with any school. These controls become live when a
          patch is paired and a guardian consent is signed.</p>
      ) : (
        <>
          <dl className="mt-5 grid gap-x-10 gap-y-2 sm:grid-cols-3">
            {[['On the school console she is', SCHOOL_CODE],
              ['Consent basis', RECORD.basis],
              ['Signed', RECORD.signedAt]].map(([k, v]) => (
              <div key={k}>
                <dt className="note">{k}</dt>
                <dd className="m-0 font-mono text-tick tabular-nums text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 max-w-[62ch] text-sec text-ink-2">{CHILD} can narrow any of these further
            from her own phone. She cannot widen them, and neither can the school. Second-by-second
            readings are kept only for the window she sets; when it closes they are deleted, with no
            archive and no backup — and you are not shown them at any point in it.</p>
          <p className="mt-3 max-w-[62ch] text-sec text-ink-3">In this demo a switch changes this page
            only. In the product it writes a dated row in the school&rsquo;s consent log, and {CHILD} is
            told the same day.</p>
        </>
      )}
    </>
  )
}

/* ── 6. Is the patch even reporting ─────────────────────────────────────── */
/* A week with no readings and a week with nothing wrong look identical unless
   something says so, so this states the count of days that reported rather
   than the state of the child. In real mode it is the first thing on the page:
   it is not a footnote about the data, it is the reason there is none. */
function PatchStatus({ real, w }) {
  const rows = real
    ? [['Status', 'Not reporting', null],
       ['Days with readings this week', `0 of ${DAYS.length}`, null],
       ['Last reading', 'None', 'No patch has ever been paired to this account.']]
    : [['Status', 'Reporting', null],
       ['Days with readings this week', `${w.days.length} of ${w.days.length}`, null],
       ['Most recent day with readings', w.last?.name ?? '—', null]]
  return (
    <Card className={cn('mt-4', real && 'border-l-[3px] border-l-crit')}>
      <div className="p-6">
        {real && <RealNotice>Nothing has been measured, so there is nothing on this page to read.
          An empty week is not a calm week, and this screen will not draw it as one.</RealNotice>}
        <dl className={cn('grid gap-x-10 gap-y-4 sm:grid-cols-3', real && 'mt-6')}>
          {rows.map(([k, v, sub]) => (
            <div key={k}>
              <dt className="note">{k}</dt>
              <dd className="m-0 mt-1 font-display text-row font-medium text-ink">{v}</dd>
              {sub && <dd className="m-0 mt-1 max-w-[30ch] text-sec text-ink-2">{sub}</dd>}
            </div>
          ))}
        </dl>
        {real ? (
          <>
            <h3 className="mark mt-10">What to do about it</h3>
            <ol className="mt-3 list-none space-y-2.5 p-0">
              {['Open MindMap on your child’s phone and pair a patch.',
                'Check the patch is charged and sitting on the forearm.',
                'This page fills in at the end of the first full week it reports.'].map((s, i) => (
                <li key={s} className="flex gap-4 text-sec text-ink-2">
                  <span className="font-mono text-tick tabular-nums text-ink-3">0{i + 1}</span>
                  <span className="max-w-[52ch]">{s}</span>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <p className="mt-6 max-w-[62ch] text-sec text-ink-2">If a day is missing from the row above,
            the patch was off or flat that day. A missing day is not a calm day, and this screen will
            not read it as one.</p>
        )}
      </div>
    </Card>
  )
}

/* ── The screen ─────────────────────────────────────────────────────────── */
export function ParentDash({ go, openTab }) {
  const [mode] = useMode()
  const real = mode === 'real'
  const w = readWeek()
  const patch = <PatchStatus real={real} w={w}/>

  return (
    <>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <h2 className="font-display text-row font-medium text-ink">
          {real ? 'No patch paired' : CHILD}</h2>
        {!real && <span className="note">This week · {w.days[0]?.name} to {w.last?.name}</span>}
      </div>
      {/* Real mode leads with the fault: there is no answer to lead with, and a
          device that is not reporting is the only news there is. Demo mode
          takes the patch last, where it belongs in the reading order. The
          fault notice is not repeated up here — the same stamp twice in one
          screenful reads as two problems. */}
      {real
        ? <ScrollIn as="section" className="mt-10">{patch}</ScrollIn>
        : <DemoNotice className="mt-4">{CHILD} is not a real person. Every figure on this screen is
            generated from the scoring model; nobody has worn a patch and nobody was measured.</DemoNotice>}

      {/* 1 and 2 are one section in two columns: the sentence and the evidence
          for it, side by side on a monitor and stacked in that order on a
          phone. Apart, the sentence left a third of a 1440 screen empty beside
          it, which reads as a layout that broke rather than as a measure. */}
      <ScrollIn as="section" className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <h2 className="mark">The week</h2>
          {real
            ? <p className="mt-5 max-w-[34ch] text-body text-ink-2">Nothing was measured, so there is
                no week to report. The seven days are empty for that reason and no other.</p>
            : <>
                <p className="mt-5 max-w-[22ch] font-display text-major font-medium leading-[1.1]
                  tracking-tight text-ink">{headline(w)}</p>
                <p className="mt-5 max-w-[40ch] text-body text-ink-2">{detail(w)}</p>
                <p className="mt-5 max-w-[44ch] text-sec text-ink-3">Her usual range is worked out from
                  her own last two weeks. She is never compared with other students.</p>
              </>}
        </div>
        <div>
          <h2 className="mark">{real ? 'The last seven days' : 'Day by day'}</h2>
          <WeekDays days={w.days} empty={real}/>
          <p className="mt-4 max-w-[52ch] text-sec text-ink-2">
            {real
              ? 'Seven days, none of them measured. These stay empty until a patch reports.'
              : 'Above or inside her own range, and that is the whole of it — no daily score here to watch, and no hour, minute or reading behind these cells for anyone to open.'}
          </p>
        </div>
      </ScrollIn>

      {/* 3. One thing worth asking about */}
      <ScrollIn as="section" className="mt-14">
        <h2 className="mark">Worth asking about</h2>
        {real
          ? <p className="mt-4 max-w-[56ch] text-body text-ink-2">Nothing is flagged, because nothing
              was measured. That is not the same as a week with nothing in it.</p>
          : <AskAbout w={w}/>}
      </ScrollIn>

      {/* 4. What you are never shown */}
      <ScrollIn as="section" className="mt-14">
        <h2 className="mark">What this screen never shows you</h2>
        <p className="mt-4 max-w-[62ch] text-sec text-ink-2">True in both modes and at every depth of
          this page. There is no drawer, no export and no link that opens any of it.</p>
        <ul className="mt-5 list-none divide-y divide-rule border-y border-rule p-0">
          {NEVER.map(([t, s]) => (
            <li key={t} className="flex items-start gap-3 py-4">
              <span className="mt-1 shrink-0 text-ink-3"><Never/></span>
              <span>
                <span className="block text-body text-ink">{t}</span>
                <span className="block text-sec text-ink-2">{s}</span>
              </span>
            </li>
          ))}
        </ul>
        <Card interactive as="button"
          onClick={() => (openTab ? openTab('shared') : go('privacy'))}
          className="mt-6 flex min-h-[56px] items-center justify-between gap-4 px-5 py-4">
          <span className="text-body text-ink">Student, parent and counselor, side by side
            <span className="block text-meta text-ink-2">Every row, and who can see it</span></span>
          <Chevron aria-hidden className="size-4 shrink-0 text-accent"/>
        </Card>
      </ScrollIn>

      {/* 5. What the school may see, and how to change it */}
      <ScrollIn as="section" className="mt-14">
        <h2 className="mark">What you have allowed the school to see</h2>
        <SchoolSharing real={real}/>
      </ScrollIn>

      {/* 6. Patch status, in its reading-order position */}
      {!real && (
        <ScrollIn as="section" className="mt-14">
          <h2 className="mark">The patch</h2>
          {patch}
        </ScrollIn>
      )}

      <p className="mt-14 max-w-[70ch] text-meta text-ink-3">MindMap reports patterns in body signals.
        It is not a medical device, it does not diagnose or treat any condition, and nothing on this
        screen is a clinical finding.</p>
    </>
  )
}
