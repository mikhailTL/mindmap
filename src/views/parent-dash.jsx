import React from 'react'
import { Chevron } from '../ui/marks'
import { DemoNotice, RealNotice } from '../ui/notice'
import { useMode } from '../lib/mode'
import { DATA } from '../lib/assets'
import { CONSENT } from '../lib/caseload'
import { cn } from '../lib/utils'
import { SCORE, NOTES, LOCATION, CONSENT_SHORT, CONSENT_OFF } from '../lib/terms'

/* The parent's screen, built from what a parent is actually doing here.
 *
 * A parent opens this about once a week and is deciding one thing: whether to
 * ask their kid a question tonight, and what question. So the order of the
 * page is the order of that decision:
 *
 *   one figure → the sentence that reads it → which days → the one thing to
 *   ask → what is and is not shared → is the patch even reporting
 *
 * Nothing here is finer-grained than a day, and no raw reading, Notes entry or
 * Location appears at any depth.
 *
 * What this pass took off, and why. The screen had the right order already and
 * the wrong number of objects: a two-column sentence-and-evidence grid, seven
 * bordered day cells in a seven-up grid, a two-column "why it is flagged /
 * how to bring it up" grid with three ruled quote blocks and two ruled warning
 * blocks, a four-row never-list with an icon per row, a five-row consent list
 * with an icon AND a switch per row, a three-field definition list under it,
 * three paragraphs of small print after that, a bordered patch card holding
 * its own three-field definition list, and a card-shaped link to the privacy
 * comparison. Nineteen framed or gridded things, no single thing to look at
 * first, and the one sentence a parent came for was one paragraph among nine.
 *
 * So: one figure at the top, at the size the student screen gives its score,
 * because "three of five school days" IS this screen's reading. Everything
 * under it is rows on one surface — day, label, value, hairline — and the only
 * boxes left are the consent switches, which are controls and have to look
 * like controls. Colour lands once, on the days that ran above her range.
 *
 * Sections 5 and 6 state the privacy promise on the page rather than leaving
 * it to be inferred from what happens to be absent. That has not changed and
 * is not negotiable; it is just rows now.
 */

const CHILD = 'Maya'
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const FULL = { Mon:'Monday', Tue:'Tuesday', Wed:'Wednesday', Thu:'Thursday',
               Fri:'Friday', Sat:'Saturday', Sun:'Sunday' }
const WEEKEND = new Set(['Sat', 'Sun'])

/* Counts read as words inside a sentence; the one count that is the screen's
   figure is set as a figure, which is a different job. */
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven']
const word = n => WORDS[n] ?? String(n)
const list = xs => xs.length < 2 ? (xs[0] ?? '')
  : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`

/* Every figure on this screen is derived here, from the same fixture the rest
   of the app reads. Nothing below retypes a count as a literal, so a change to
   the generated week changes the figure, the sentence, the day rows and the
   flagged day together instead of leaving four statements to disagree. */
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
    return `${list(w.schoolOver.map(d => d.name))}. Both weekend days were inside her usual range.`
  return `${list(w.over.map(d => d.name))}.`
}

/* The figure's own unit, which is the thing that makes a bare numeral a
   reading. It changes with the shape of the week for the same reason the
   sentence does: "of her five school days" is false if a weekend day ran
   high. */
function unit(w) {
  if (!w.over.length) return `days above her usual range, of ${word(w.days.length)}`
  if (!w.weekendOver.length)
    return `days above her usual range, of her ${word(w.schoolCount)} school days`
  return `days above her usual range, of ${word(w.days.length)}`
}

/* ── 2. The week, at day grain and no finer ─────────────────────────────── */
/* Seven rows, each saying one word. The daily Mind Score is deliberately not
   here: a number per day invites a parent to follow it hour by hour, which is
   the instrument posture this screen exists to avoid. Above or inside is the
   whole answer.

   It was seven bordered cells in a seven-across grid, which is a chart of a
   thing that is not a chart — at 390 they stacked into seven boxes anyway, so
   the grid bought a desk layout nobody needed and a box per day everywhere.
   Rows cost one hairline each and read the same at both widths.

   Colour is never alone: the word is the state, and the weight differs as well
   as the hue, so it survives grayscale. */
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
/* A flag with no next step is worse than no flag: the parent still acts, just
   badly — usually by reading the dashboard out loud at the kitchen table. So
   the opener lines and the one thing not to do are part of the flag, not a
   help article somewhere behind it. Three openers, three rows; the two
   cautions are sentences rather than ruled blocks, because five ruled blocks
   in one section is a wall of ruled blocks and nothing stands out in it. */
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
        not wait for next week&rsquo;s summary. Contact her school counselor, or your local crisis
        line.</p>
    </>
  )
}

/* ── 4. What a parent is never shown ────────────────────────────────────── */
/* Phrased in the third person so the identical list is true in both modes —
   in real mode there is no child on this account to call "her". The per-row
   Never glyph is gone: the heading over the list is the word never, four
   copies of it down the left margin said it four more times, and a glyph that
   means the same on every row of a list is not carrying any information. */
const NEVER = [
  [NOTES, 'What a student writes in their own journal stays on their phone.'],
  [LOCATION, 'No location is collected, so none can be shared.'],
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

/* The switch is the row's value, on the right, where every other value on this
   screen is. The Always / Never glyph that used to sit on the left of each row
   said the same thing the switch says and said it in a second vocabulary. */
function SchoolSharing({ real }) {
  /* Real mode has no signed consent to load, so the rows start closed and the
     controls are inert — there is nothing yet for them to act on. */
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
        {/* The one row that is not a choice. It is shown as a control in the
            disabled state rather than left off the list, because a parent who
            cannot find it assumes it does not exist. */}
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
        /* Three paragraphs and a three-field definition list stood here. The
           list's three facts are one line of small print, which is what they
           are, and the two paragraphs that repeated each other are one. */
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
/* A week with no readings and a week with nothing wrong look identical unless
   something says so, so this states the count of days that reported rather
   than the state of the child. In real mode it is the first thing on the page:
   it is not a footnote about the data, it is the reason there is none.

   It was a bordered card around a three-field definition list, which is a box
   around three rows. It is three rows. */
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

      {/* Real mode leads with the fault: there is no answer to lead with, and a
          device that is not reporting is the only news there is. Demo mode
          takes the patch last, where it belongs in the reading order. */}
      {real ? (
        <section className="mt-8"><PatchStatus real={real} w={w}/></section>
      ) : (
        <>
          <DemoNotice className="mt-3">{CHILD} is not a real person. Every figure on this screen is
            generated from the scoring model; nobody has worn a patch and nobody was measured.</DemoNotice>

          {/* 1. The figure, and the sentence that reads it. This is the whole
                of what a parent came for and it is the only thing above the
                fold. The count is set at the step the student screen sets its
                score at, because it is the same kind of statement. */}
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

      {/* 5. What is shared, and what never is. One section: a parent reading
            the first half is asking the same question as a parent reading the
            second, and they used to be two sections a screen apart. */}
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
            <span className="block text-body text-ink">Student, parent and counselor, side by side</span>
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
        It is not a medical device, it does not diagnose or treat any condition, and nothing on this
        screen is a clinical finding.</p>
    </>
  )
}
