import React from 'react'
import { Button } from '../ui/button'
import { cn } from '../lib/utils'
import { Table, THead, TBody, TR, TH, TD } from '../ui/table'
import { List, Item } from '../ui/list'
import {
  PAGE, ALL_ITEMS, REQUIRED,
  SCALE_ITEMS, DEMOGRAPHIC_ITEMS, BLOCKER_ITEM, TEXT_ITEM, STARS_ITEM,
  SCALE_MAX, summariseItem, ratedAnswered,
  questionText, itemById, pageLabel,
} from '../survey/questions'
import { exportRows, toCSV, getVisitor, visitorCode } from '../survey/store'

/* Peer-review survey results.
 *
 * ─── What this page may and may not say ─────────────────────────────────────
 * The survey behind it is a HOUSE QUESTIONNAIRE. Until 13 October it was a
 * published ten-item usability scale, and this page printed one 0-100 figure,
 * a letter grade and a rule drawn at a published population mean of 68. The
 * owner replaced the instrument (docs/design-spec.md, section 0d, directive
 * 10). The benchmark went with it, and so did everything on this page that
 * depended on one:
 *
 *   NO composite score. Six rated items written for one product do not sum
 *     into a figure with any outside reference.
 *   NO letter grade, NO curve, NO benchmark rule, NO "above average".
 *   NO percentage of a maximum, anywhere.
 *
 * What it prints instead, per item: the count, the mean of that item's own
 * 1-5 scale, and how many chose one of the top two points, each stated with
 * its denominator beside it and the full distribution underneath. Every one of
 * those is a statement a reader can check.
 *
 * Demographics are bands and are NEVER averaged: the numbers under them are
 * positions in a list, so a mean of them would be arithmetic on labels.
 *
 * ─── On access ──────────────────────────────────────────────────────────────
 * THIS PAGE IS UNLISTED, WHICH IS NOT SECURITY. There is deliberately no login:
 * a password check in a static bundle is either done in the client or compared
 * against a secret shipped in the bundle, and both are readable.
 *
 * The route resolves but is in no nav bar and linked from nowhere. When
 * VITE_RESPONSES_KEY is set, the page reads a key from the URL query and
 * forwards it as a header for the API to check against its own server-side env
 * var. VITE_RESPONSES_KEY is only ever read as a flag meaning "this deployment
 * expects a key", never as the key itself, so no secret lands in dist/.
 *
 * Real protection requires one of: Vercel deployment protection on the project,
 * or an access-controlled store the function reads with credentials the browser
 * never holds. Until one is on, treat everything here as public. SURVEY-SETUP.md
 * states the same thing. */

const ENDPOINT = import.meta.env?.VITE_SURVEY_ENDPOINT || '/api/responses'
/* Flag, not secret. Its value is never compared against anything and never
 * sent; only its presence switches the header on. */
const KEY_EXPECTED = !!import.meta.env?.VITE_RESPONSES_KEY

const STORE_KEY = 'mindmap.survey'

/* Below this many answers to one item, the page still prints the mean but puts
 * a line under it saying not to read it as a result. There is no published
 * guidance behind the figure and none is claimed: it is a hard floor chosen so
 * that a mean of one or two answers is never presented bare. */
const MIN_REPORT = 3

const REQUIRED_IDS = REQUIRED.map(q => q.id)
const REQUIRED_COUNT = REQUIRED_IDS.length
const STAR_MAX = STARS_ITEM.max
const STAR_STEP = STARS_ITEM.step

/* The app routes on the hash, so a shared link can carry its query on either
 * side of the '#'. Both sides are read. */
function urlKey() {
  try {
    const fromSearch = new URLSearchParams(location.search).get('key')
    if (fromSearch) return fromSearch
    const h = location.hash || ''
    const q = h.indexOf('?')
    if (q < 0) return ''
    return new URLSearchParams(h.slice(q + 1)).get('key') || ''
  } catch {
    return ''
  }
}

/* ------------------------------------------------------------ question map */

/* Sort answers by ask order, not timestamp: a revised answer must not jump to
 * the bottom of the card, away from its question. */
const ASK_ORDER = new Map()
ALL_ITEMS.forEach((item, i) => ASK_ORDER.set(item.id, i))
const askIndex = r => ASK_ORDER.get(r.questionId) ?? 9999

/* ------------------------------------------------------------- normalising */

/* Deliberate duplicate of the store's module-private flattener (the server
 * returns the unflattened original). Do not extract a shared helper: the
 * store's copy defines the exported CSV column, and sharing it would let a
 * display change here alter that column. */
function flat(value) {
  if (value == null) return ''
  if (typeof value === 'object') {
    const score = value.score ?? ''
    const note = value.note ?? ''
    return note ? `${score}: ${note}` : String(score)
  }
  return String(value)
}

function num(v) {
  const n = parseFloat(String(v ?? ''))
  return Number.isFinite(n) ? n : null
}

function mean(list) {
  const v = list.filter(x => x != null)
  if (!v.length) return null
  return v.reduce((a, b) => a + b, 0) / v.length
}

/* Rows arrive in exportRows() shape so the server and local paths converge
 * before anything renders or downloads.
 *
 * An answer counts as current only if it was given on this page and its
 * question is still asked. Everything else, the retired per-page scheme, the
 * ten usability statements, the two free-text prompts and the older
 * demographic and recommendation questions, is split out here and must never
 * reach a figure: it answered a different question, so averaging it in would
 * invent a number. It is still kept and shown in full. */
function build(id, rows, startedAt) {
  const sorted = rows.slice().sort((a, b) => askIndex(a) - askIndex(b))
  const live = r => r.page === PAGE && !!itemById(r.questionId)
  const current = sorted.filter(live)
  const retired = sorted.filter(r => !live(r))
  const times = rows.map(r => r.at).filter(Boolean).sort()

  const by = new Map(current.map(r => [r.questionId, r]))
  const value = qid => (by.has(qid) ? num(by.get(qid).value) : null)
  /* Demographics and the blocker are read as their LABEL, never their number:
     the number is a position in a list and means nothing on its own. */
  const picked = qid => {
    const r = by.get(qid)
    if (!r) return null
    const label = String(r.label ?? '').trim()
    return label || null
  }

  /* One map of rated answers per respondent. Partial is fine and is kept
     partial: an unanswered item contributes nothing to that item's mean
     rather than being filled in or scaling the rest up. */
  const scales = new Map()
  SCALE_ITEMS.forEach(item => {
    const v = value(item.id)
    if (v != null) scales.set(item.id, v)
  })

  const demo = new Map()
  DEMOGRAPHIC_ITEMS.forEach(item => {
    const p = picked(item.id)
    if (p) demo.set(item.id, p)
  })

  const noteRow = by.get(TEXT_ITEM.id)
  const note = noteRow ? String(noteRow.value || '').trim() : ''

  const done = REQUIRED_IDS.filter(qid => {
    const r = by.get(qid)
    return !!r && String(r.value ?? '').trim() !== ''
  }).length

  return {
    id,
    code: visitorCode(id),
    startedAt: startedAt || times[0] || null,
    lastAt: times[times.length - 1] || null,
    rows: current,
    retired,
    answered: rows.length,
    scales,
    rated: ratedAnswered(scales),
    demo,
    blocker: picked(BLOCKER_ITEM.id),
    stars: value(STARS_ITEM.id),
    note,
    done,
    commented: !!note,
  }
}

function group(rows, startedFor) {
  const by = new Map()
  rows.forEach(r => {
    const k = r.visitorId || 'unknown'
    if (!by.has(k)) by.set(k, [])
    by.get(k).push(r)
  })
  return [...by.entries()].map(([id, rs]) =>
    build(id, rs, startedFor ? startedFor(id) : null))
}

/* Returns '' for anything no longer asked, which is what marks a row as
 * retired for display. questions.js still knows the old wording; this is the
 * live-question lookup. */
function textFor(qid) {
  return itemById(qid) ? questionText(qid) : ''
}

function fromRespondents(list) {
  return (Array.isArray(list) ? list : []).map(r => {
    const id = String(r?.id || '')
    const rows = (Array.isArray(r?.answers) ? r.answers : []).map(a => ({
      /* The column is kept because existing spreadsheets expect it in this
         position. The survey collects no name, so it is a constant. */
      visitorName: 'Anonymous',
      visitorId: id,
      page: String(a?.page || ''),
      questionId: String(a?.qid || ''),
      question: textFor(String(a?.qid || '')),
      kind: String(a?.kind || ''),
      value: flat(a?.value),
      label: a?.label ?? '',
      at: a?.at || '',
    }))
    return build(id, rows, r?.startedAt || null)
  })
}

/* The store keeps one visitor per browser. A stored record may also carry a
 * `respondents` array in the shape the API returns and this page's JSON download
 * writes (an archive pasted back in to read offline). Both are read; the store's
 * own copy wins on an id clash. Guarded throughout: in a private window the
 * first localStorage access throws. */
function archived() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return fromRespondents(parsed?.respondents)
  } catch {
    return []
  }
}

function fromLocal() {
  const me = getVisitor()
  const mine = group(
    exportRows().map(r => ({ ...r, question: textFor(r.questionId) })),
    id => (me && me.id === id ? me.startedAt : null)
  ).filter(p => p.answered > 0 || (me && me.id === p.id))
  const seen = new Set(mine.map(p => p.id))
  return [...mine, ...archived().filter(p => !seen.has(p.id))]
}

function fromServer(payload) {
  return fromRespondents(payload?.respondents)
}

/* ------------------------------------------------------------- aggregating */

/* A count per option, over a question's own option list. Options nobody chose
 * still print, at zero, because an empty row is a result. */
function spread(people, valueOf, points) {
  const counts = {}
  let total = 0
  people.forEach(p => {
    const v = valueOf(p)
    if (v == null) return
    counts[v] = (counts[v] || 0) + 1
    total += 1
  })
  return { points, counts, total }
}

/* Option lists keyed by their LABEL, because that is what a demographic or
 * blocker answer is stored and compared as. */
const labelPoints = item => item.points.map(p => ({ value: p.label, label: p.label }))

function summarise(people) {
  /* Per item, over everyone who answered that item. Nothing is summed across
     items: see the header. */
  const items = SCALE_ITEMS.map(item => ({
    item,
    sum: summariseItem(people.map(p => p.scales.get(item.id) ?? null)),
    dist: spread(people, p => p.scales.get(item.id) ?? null, item.points),
  }))

  const starValues = people.map(p => p.stars).filter(v => v != null)
  const starPoints = []
  for (let v = STAR_STEP; v <= STAR_MAX + 1e-9; v += STAR_STEP) {
    const n = Math.round(v * 10) / 10
    starPoints.push({ value: n, label: `${n.toFixed(1)} star${n === 1 ? '' : 's'}` })
  }

  return {
    people: people.length,
    answers: people.reduce((n, p) => n + p.answered, 0),
    items,
    /* Coverage, not a score: how many respondents answered every rated item. */
    fullyRated: people.filter(p => p.rated === SCALE_ITEMS.length).length,
    partlyRated: people.filter(p => p.rated > 0 && p.rated < SCALE_ITEMS.length).length,
    unrated: people.filter(p => p.rated === 0).length,
    starMean: mean(starValues),
    starsAnswered: starValues.length,
    starDist: spread(people, p => p.stars, starPoints),
    demo: DEMOGRAPHIC_ITEMS.map(item => ({
      item,
      dist: spread(people, p => p.demo.get(item.id) ?? null, labelPoints(item)),
    })),
    blocker: spread(people, p => p.blocker, labelPoints(BLOCKER_ITEM)),
    commented: people.filter(p => p.commented).length,
    retired: people.reduce((n, p) => n + p.retired.length, 0),
  }
}

/* ---------------------------------------------------------------- download */

function stamp() {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/* RFC4180 quoting, restated for the per-respondent sheet. The store's
 * serialiser is bound to its own answer-row header, and that header is the
 * column order existing spreadsheets expect, do not widen it to share this. */
function cell(v) {
  const s = v == null ? '' : String(v)
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

function csv(head, rows) {
  const body = rows.map(r => head.map(k => cell(r[k])).join(','))
  return [head.join(','), ...body].join('\r\n')
}

/* One row per respondent, one column per question, in ask order. No composite
 * column and no grade column: there is nothing to put in either, and a blank
 * one would invite somebody to fill it in. The rated items carry their number
 * so the sheet can average a column; the bands carry their label, because
 * averaging a column of bands is the mistake this layout exists to prevent. */
const PERSON_HEAD = [
  'respondent', 'startedAt', 'lastAt',
  ...DEMOGRAPHIC_ITEMS.map(q => q.id),
  ...SCALE_ITEMS.map(q => q.id),
  'stars', 'blocker', 'blockerNote',
  'ratedAnswered', 'ratedTotal', 'requiredAnswered', 'requiredTotal',
]

function personRows(people) {
  return people.map(p => {
    const row = {
      respondent: p.code,
      startedAt: p.startedAt || '',
      lastAt: p.lastAt || '',
      stars: p.stars == null ? '' : p.stars,
      blocker: p.blocker || '',
      blockerNote: p.note || '',
      ratedAnswered: p.rated,
      ratedTotal: SCALE_ITEMS.length,
      requiredAnswered: p.done,
      requiredTotal: REQUIRED_COUNT,
    }
    DEMOGRAPHIC_ITEMS.forEach(q => { row[q.id] = p.demo.get(q.id) || '' })
    SCALE_ITEMS.forEach(q => {
      const v = p.scales.get(q.id)
      row[q.id] = v == null ? '' : v
    })
    return row
  })
}

/* Wrapped: a blocked or revoked blob URL must not take the page down, every
 * answer is already on screen. */
function save(text, filename, mime) {
  try {
    const url = URL.createObjectURL(new Blob([text], { type: mime }))
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
    return true
  } catch {
    return false
  }
}

/* ------------------------------------------------------------------ pieces */

function when(iso) {
  if (!iso) return 'time not recorded'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return 'time not recorded'
    return d.toLocaleString(undefined, {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return 'time not recorded'
  }
}

function shortWhen(iso) {
  if (!iso) return 'not recorded'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return 'not recorded'
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  } catch {
    return 'not recorded'
  }
}

/* A rect in a viewBox; no rounded end, which distorts under the non-uniform
 * scale. accent on mist clears the 3:1 graphics minimum, and the count is
 * printed beside it so bar length is never the only carrier.
 *
 * This is the only bar on the page now. The 0-100 meter that used to sit under
 * the headline, with an ink rule drawn at a published mean, is gone: there is
 * no published mean to draw. */
function Bar({ frac }) {
  const w = frac > 0 ? Math.max(1.2, frac * 100) : 0
  return (
    <svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden
      className="block h-2.5 w-full border border-rule bg-mist">
      {w > 0 && <rect x="0" y="0" width={w} height="10" className="fill-accent" />}
    </svg>
  )
}

function Figure({ label, value, unit, children }) {
  return (
    <div>
      <div className="note">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-stat font-medium leading-none tabular-nums text-ink">
          {value}
        </span>
        {unit && <span className="font-body text-fine tabular-nums text-ink-3">{unit}</span>}
      </div>
      <div className="mt-1.5 max-w-read text-meta text-ink-2">{children}</div>
    </div>
  )
}

function Rows({ points, counts, total, unit = 'answered' }) {
  if (!total) return <p className="note mt-3">Nothing answered here yet.</p>
  return (
    <div className="mt-3 flex flex-col gap-2">
      {points.map(p => {
        const n = counts[p.value] || 0
        return (
          <div key={p.value}
            className="grid grid-cols-[1fr_minmax(48px,28%)_2.5rem] items-center gap-3">
            <span className="text-meta text-ink-2">{p.label}</span>
            <Bar frac={total ? n / total : 0} />
            <span className="text-right text-fine tabular-nums text-ink">{n}</span>
          </div>
        )
      })}
      <p className="note mt-1">{total} {unit}.</p>
    </div>
  )
}

function Spread({ title, note, points, counts, total, children }) {
  return (
    <figure className="m-0 border-t border-rule pt-4">
      <figcaption className="max-w-read font-display text-ui font-bold text-ink">
        {title}
      </figcaption>
      {note && <p className="note mt-1">{note}</p>}
      <Rows points={points} counts={counts} total={total} />
      {children}
    </figure>
  )
}

/* One rated item: its own mean on its own 1-5 scale, the top-two-point count
 * stated as a fraction of the people who answered it, and the distribution.
 * Never a percentage of a maximum, and never a figure from another item. */
function RatedItem({ item, sum, dist }) {
  const thin = sum != null && sum.n < MIN_REPORT
  return (
    <figure className="m-0 border-t border-rule pt-4">
      <figcaption className="max-w-read font-display text-ui font-bold text-ink">
        {item.prompt}
      </figcaption>
      {sum == null ? (
        <p className="note mt-1">Nobody has answered this one yet.</p>
      ) : (
        <>
          <p className="mt-1 max-w-read text-meta text-ink-2">
            Mean <span className="tabular-nums">{sum.mean.toFixed(2)}</span> of {SCALE_MAX},
            across <span className="tabular-nums">{sum.n}</span>{' '}
            answer{sum.n === 1 ? '' : 's'}.{' '}
            <span className="tabular-nums">{sum.top}</span> of{' '}
            <span className="tabular-nums">{sum.n}</span> picked one of the top two points.
          </p>
          {thin && (
            <p className="note mt-1">
              {sum.n === 1
                ? 'One answer. It is not a mean and must not be quoted as one.'
                : `Only ${sum.n} answers. Read it as an early signal, not a result.`}
            </p>
          )}
        </>
      )}
      <Rows points={item.points} counts={dist.counts} total={dist.total} />
    </figure>
  )
}

/* Rating is given as a shape and as a figure, so it never depends on the fill.
 * Read-only on purpose: ui/stars is a slider, and an immovable slider traps
 * keyboard users. */
const STAR = 'M12 2.4l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.4l-5.88 3.1 ' +
             '1.12-6.55L2.48 9.32l6.58-.96z'

function Stars({ value, max = STAR_MAX }) {
  const uid = React.useId()
  if (value == null) {
    return <span className="text-fine text-ink-3">no rating</span>
  }
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex" role="img" aria-label={`${value} out of ${max} stars`}>
        {Array.from({ length: max }, (_, i) => {
          const frac = Math.max(0, Math.min(1, value - i))
          const id = `${uid}-s${i}`
          return (
            <svg key={i} viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden
              className="shrink-0">
              {frac > 0 && (
                <defs>
                  <clipPath id={id}><rect x="0" y="0" width={24 * frac} height="24" /></clipPath>
                </defs>
              )}
              <path d={STAR} className="stroke-ink-3" strokeWidth="1.6" strokeLinejoin="round" />
              {frac > 0 && <path d={STAR} className="fill-accent" clipPath={`url(#${id})`} />}
            </svg>
          )
        })}
      </span>
      <span className="text-fine tabular-nums text-ink">
        {value.toFixed(1)}<span className="text-ink-3"> / {max}</span>
      </span>
    </span>
  )
}

const CONTROL =
  'min-h-[46px] rounded-field border border-rule bg-card px-3 font-display text-ui font-medium ' +
  'text-ink transition-[background-color,border-color] duration-150 ease-out ' +
  'hoverOnly:border-ink-3 hoverOnly:bg-mist active:bg-accent-wash ' +
  'disabled:pointer-events-none disabled:opacity-45'

function Field({ label, children }) {
  const id = React.useId()
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="note">{label}</span>
      {React.cloneElement(children, { id })}
    </label>
  )
}

function Notice({ title, children }) {
  return (
    <div className="mt-8 max-w-measure border-l-2 border-warn bg-warn-wash py-3 pl-4 pr-5">
      <p className="font-display text-ui font-bold text-ink">{title}</p>
      <div className="mt-1.5 text-meta text-ink-2">{children}</div>
    </div>
  )
}

/* Native <details>, not an accordion component: keyboard-operable, findable by
 * the browser's in-page search when open, and no state to get wrong. */
function Fold({ summary, note, children }) {
  return (
    <details className="group mt-6 rounded-panel border border-rule bg-card">
      <summary className="flex cursor-pointer list-none flex-wrap items-baseline gap-x-3 gap-y-1 px-6 py-4 font-display text-ui font-bold text-ink hoverOnly:bg-mist [&::-webkit-details-marker]:hidden">
        <span className="text-fine text-ink-3 group-open:hidden">Show</span>
        <span className="hidden text-fine text-ink-3 group-open:inline">Hide</span>
        {summary}
        {note && <span className="note">{note}</span>}
      </summary>
      <div className="border-t border-rule px-6 pb-6 pt-5">{children}</div>
    </details>
  )
}

function Quote({ code, at, children }) {
  return (
    <figure className="m-0 border-t border-rule pt-4">
      <blockquote className="max-w-measure whitespace-pre-wrap break-words text-sec text-ink">
        {children}
      </blockquote>
      <figcaption className="note mt-2">{code} · {when(at)}</figcaption>
    </figure>
  )
}

function Respondent({ p }) {
  const role = p.demo.get('who-role')
  const age = p.demo.get('who-age')
  return (
    <article className="rounded-panel border border-rule bg-card p-6 sm:p-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h3 className="font-display text-row font-bold text-ink">{p.code}</h3>
        <Stars value={p.stars} />
      </header>
      <p className="note mt-1.5">
        Started {when(p.startedAt)} · {p.done} of {REQUIRED_COUNT} required answered ·{' '}
        {p.rated} of {SCALE_ITEMS.length} rated questions
        {role ? ` · ${role}` : ''}{age ? ` · ${age}` : ''}
        {p.commented ? ' · left a note' : ''}
      </p>

      {p.rows.length === 0 ? (
        <p className="mt-5 text-meta text-ink-2">Opened the survey and answered nothing.</p>
      ) : (
        <dl className="mt-6 flex flex-col gap-5">
          {p.rows.map(r => (
            <div key={r.page + '/' + r.questionId} className="border-t border-rule pt-4">
              <dt className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-fine tabular-nums text-ink-3">
                  {r.questionId}
                </span>
                <span className="max-w-read font-display text-ui font-bold text-ink-2">
                  {textFor(r.questionId) || 'This question is no longer asked'}
                </span>
              </dt>
              {/* Never clamp, ellipsise or scroll reviewer prose, truncating it
                  loses the data. break-words so a pasted URL cannot push the
                  card wider than the screen. */}
              <dd className="mt-2 max-w-measure whitespace-pre-wrap break-words text-sec text-ink">
                {String(r.label || r.value || '').trim() || <span className="text-ink-3">left blank</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  )
}

/* -------------------------------------------------------------------- page */

/* Sorting on a composite is impossible now, deliberately: there is none. These
 * are the orders that remain meaningful. */
const SORTS = {
  when:  (a, b) => String(b.lastAt || '').localeCompare(String(a.lastAt || '')),
  stars: (a, b) => (b.stars ?? -1) - (a.stars ?? -1),
  done:  (a, b) => b.done - a.done,
  code:  (a, b) => a.code.localeCompare(b.code),
}

export function Responses() {
  /* Paint from local records synchronously; the fetch only upgrades them.
     Gating the body on a loading state measured CLS 0.32 at 1280px. It also
     means a reviewer with no network still sees their own answers. */
  const [status, setStatus] = React.useState('local') // local | server
  const [problem, setProblem] = React.useState(null)
  const [ephemeral, setEphemeral] = React.useState(false)
  const [people, setPeople] = React.useState(() => { try { return fromLocal() } catch { return [] } })

  const [sort, setSort] = React.useState('when')
  const [query, setQuery] = React.useState('')
  const [onlyCommented, setOnlyCommented] = React.useState(false)

  const load = React.useCallback(async () => {
    setProblem(null)
    const fallback = (why) => {
      setPeople(fromLocal())
      setEphemeral(false)
      setProblem(why)
      setStatus('local')
    }
    if (typeof fetch !== 'function') {
      fallback('This browser has no fetch, so the server was never asked.')
      return
    }
    try {
      const key = KEY_EXPECTED ? urlKey() : ''
      const res = await fetch(ENDPOINT, {
        method: 'GET',
        headers: key ? { 'x-responses-key': key } : undefined,
      })
      if (!res.ok) {
        fallback(res.status === 401 || res.status === 403
          ? `The server refused the request (${res.status}). The key in this page's URL is missing or wrong.`
          : `The server answered ${res.status}, so there is nothing to read from it.`)
        return
      }
      const data = await res.json()
      setPeople(fromServer(data))
      setEphemeral(!!data?.ephemeral)
      setStatus('server')
    } catch {
      fallback('No response endpoint answered. Either this is a local build with no functions running, or the API is not deployed.')
    }
  }, [])

  React.useEffect(() => { load() }, [load])

  const shown = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = people.filter(p =>
      (!q || p.code.toLowerCase().includes(q)) && (!onlyCommented || p.commented))
    const byWhen = (a, b) => String(b.lastAt || '').localeCompare(String(a.lastAt || ''))
    list.sort((a, b) => (SORTS[sort] || byWhen)(a, b) || byWhen(a, b))
    return list
  }, [people, query, sort, onlyCommented])

  /* Computed over everyone, never the filtered view: a mean that moves when
     you type in the search box is a mean of nothing. */
  const s = React.useMemo(() => summarise(people), [people])

  const notes = React.useMemo(
    () => people.filter(p => p.note).map(p => ({
      key: p.id + '/note', code: p.code, at: p.lastAt, text: p.note,
    })),
    [people])

  /* Grouped by label, not by page id: a dropped question was asked on the
     page that is still current, so grouping on the id alone would file it
     under "Site review". */
  const retiredGroups = React.useMemo(() => {
    const by = new Map()
    people.forEach(p => p.retired.forEach(r => {
      const g = itemById(r.questionId) ? pageLabel(r.page) : 'Questions no longer asked'
      if (!by.has(g)) by.set(g, [])
      by.get(g).push({ ...r, code: p.code })
    }))
    return [...by.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [people])

  /* Every download carries everyone, not the filtered view, the file is the
     archive.

     The question column is filled in here rather than trusted from the row.
     questionText keeps the wording of retired questions, and falls back to the
     id, because an empty spreadsheet cell reads as a missing value rather than
     a deliberate one. */
  const rows = React.useMemo(() => people.flatMap(p =>
    [...p.rows, ...p.retired].map(r => ({
      ...r,
      question: questionText(r.questionId),
    }))), [people])
  const downloadCSV = () => save(toCSV(rows), `mindmap-answers-${stamp()}.csv`, 'text/csv;charset=utf-8')
  const downloadPeople = () => save(
    csv(PERSON_HEAD, personRows(people)),
    `mindmap-respondents-${stamp()}.csv`, 'text/csv;charset=utf-8')
  const downloadJSON = () => save(
    JSON.stringify({ source: status, ephemeral, exportedAt: new Date().toISOString(), respondents: people }, null, 2),
    `mindmap-responses-${stamp()}.json`, 'application/json')

  const nothing = people.length === 0
  const thinStars = s.starsAnswered > 0 && s.starsAnswered < MIN_REPORT

  return (
    <main className="pb-20">
      <div className="border-b border-rule bg-mist">
        <div className="wrap py-10">
          <h1 className="font-display text-major font-bold leading-[1.05] tracking-tight text-ink">
            Reviewer Responses
          </h1>
          <p className="mt-3 max-w-[60ch] text-sec text-ink-2">
            Each question's own figures first, then every answer underneath, grouped by
            the browser that left it. This page is unlisted, not protected: treat
            anything here as readable by anyone who has the link.
          </p>
        </div>
      </div>

      {/* min-h is the taller of the two notices, so swapping or dropping them
          moves nothing below. Without it the swap measured CLS 0.32 at 1280px,
          past the 0.1 the audit allows. */}
      <div className="wrap min-h-[16rem]">
        {status === 'local' && (
          <Notice title="Showing this browser's records only">
            <p>{problem}</p>
            <p className="mt-2">
              What is below is what was answered in this browser. Other reviewers'
              answers are in their own browsers and cannot be read from here until
              the API and its store are deployed. See SURVEY-SETUP.md.
            </p>
          </Notice>
        )}

        {status === 'server' && ephemeral && (
          <Notice title="The server is not keeping these">
            <p>
              The API answered, but it has no store attached, so it is holding
              responses in memory on one instance. They disappear on the next
              deploy or cold start. Download the CSV now, and set up the KV store
              before asking anyone else to review.
            </p>
          </Notice>
        )}

        {/* ------------------------------------------------------- headline */}
        <section aria-label="Headline figures" className="mt-14">
          <p className="mark">Headline Figures</p>

          <div className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            <Figure label="Respondents" value={s.people}>
              {s.people === 0
                ? 'Send the site to a reviewer and this fills in as they read.'
                : `${s.fullyRated} answered every rated question, ${s.partlyRated} answered some, ${s.unrated} answered none. ${s.answers} answers in total.`}
            </Figure>

            <Figure
              label={s.starsAnswered === 1 ? 'Rating, one respondent' : 'Mean rating'}
              value={s.starMean == null ? 'No data' : s.starMean.toFixed(2)}
              unit={s.starMean == null ? null : `of ${STAR_MAX}`}
            >
              {s.starsAnswered === 0
                ? 'Nobody has rated the whole thing yet.'
                : `From ${s.starsAnswered} rating${s.starsAnswered === 1 ? '' : 's'}, given in half stars.`}
            </Figure>

            <Figure label="Written notes" value={s.commented}>
              {s.commented === 0
                ? 'The one written question is optional and nobody has used it yet.'
                : `${s.commented} of ${s.people} named something that would put them off.`}
            </Figure>
          </div>

          {thinStars && (
            <p className="note mt-5 max-w-measure">
              {s.starsAnswered === 1
                ? 'The rating is one person’s. It is not an average and must not be reported as one.'
                : `The rating comes from ${s.starsAnswered} people. Far too few to average with confidence.`}
            </p>
          )}

          {/* The honesty panel. It replaced a paragraph explaining a published
              0-100 scale and its population mean; the instrument it described
              is no longer the one being used. */}
          <div className="mt-10 max-w-measure border-t border-ink pt-4">
            <p className="font-display text-ui font-bold text-ink">What These Figures Are</p>
            <p className="mt-2 text-meta text-ink-2">
              These questions were written for MindMap. There is no outside population
              to compare them against, so nothing on this page is scored against a
              benchmark and no figure here is a percentage of anything.
            </p>
            <p className="mt-2 text-meta text-ink-2">
              There is no total and no grade, on purpose. Adding up items written for
              one product gives a number with nothing to read it against, and a mark
              drawn on that number would be invented. What is reported is one question
              at a time: how many answered, the mean of that question's own one-to-five
              scale, how many picked one of the top two points, and the full spread
              underneath it.
            </p>
            <p className="note mt-2">
              The age, role and school questions are bands. They are counted and never
              averaged: the number behind a band is its place in a list, not a quantity.
            </p>
          </div>
        </section>

        {/* -------------------------------------------------- rated answers */}
        <section aria-label="Rated questions" className="mt-20">
          <p className="mark">Rated Questions</p>
          <p className="mt-4 max-w-measure text-sec text-ink-2">
            {SCALE_ITEMS.length} questions, each on its own five-point scale, each
            reported on its own. No two of them ask the same thing from opposite ends.
          </p>
          <div className="mt-8 grid gap-x-12 gap-y-8 lg:grid-cols-2">
            {s.items.map(({ item, sum, dist }) => (
              <RatedItem key={item.id} item={item} sum={sum} dist={dist} />
            ))}
          </div>
        </section>

        {/* --------------------------------------------------------- rating */}
        <section aria-label="Overall rating" className="mt-20">
          <p className="mark">Overall Rating</p>
          <div className="mt-6 lg:max-w-[38rem]">
            <Spread
              title={STARS_ITEM.prompt}
              note={`Out of ${STAR_MAX}, in half stars.`}
              points={s.starDist.points}
              counts={s.starDist.counts}
              total={s.starDist.total}
            />
          </div>
        </section>

        {/* --------------------------------------------------- demographics */}
        <section aria-label="Who answered" className="mt-20">
          <p className="mark">Bands Of Respondents</p>
          <p className="mt-4 max-w-measure text-sec text-ink-2">
            Counted, never averaged. Every one of these questions offers a refusal,
            and a refusal is printed here as the answer it is.
          </p>
          <div className="mt-8 grid gap-x-12 gap-y-8 lg:grid-cols-2">
            {s.demo.map(({ item, dist }) => (
              <Spread
                key={item.id}
                title={item.prompt}
                points={dist.points}
                counts={dist.counts}
                total={dist.total}
                unit="answered"
              />
            ))}
            <Spread
              title={BLOCKER_ITEM.prompt}
              points={s.blocker.points}
              counts={s.blocker.counts}
              total={s.blocker.total}
              unit="answered"
            />
          </div>
        </section>

        {/* ------------------------------------------------------ the table */}
        <section aria-label="Respondents" className="mt-20">
          <p className="mark">Each Respondent</p>

          <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-4">
            <Field label="Find a respondent code">
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Any part of a code"
                className={cn(CONTROL, 'w-[15rem] max-w-full font-body font-normal placeholder:text-ink-3')}
              />
            </Field>
            <Field label="Sort by">
              <select value={sort} onChange={e => setSort(e.target.value)} className={CONTROL}>
                <option value="when">Most recent answer first</option>
                <option value="stars">Highest rating first</option>
                <option value="done">Most complete first</option>
                <option value="code">Code, A to Z</option>
              </select>
            </Field>
            {/* aria-pressed, not a checkbox: a view filter applied immediately,
                not a value being submitted. */}
            <button
              type="button"
              aria-pressed={onlyCommented}
              onClick={() => setOnlyCommented(v => !v)}
              className={cn(
                'min-h-[46px] rounded-field border px-4 font-display text-ui font-medium',
                'transition-[background-color,border-color,color] duration-150 ease-out',
                'disabled:pointer-events-none disabled:opacity-45',
                onlyCommented
                  ? 'border-ink bg-ink text-paper hoverOnly:bg-accent-ink active:bg-accent-ink'
                  : 'border-rule bg-card text-ink hoverOnly:border-ink-3 hoverOnly:bg-mist active:bg-accent-wash'
              )}
            >
              Left a note{onlyCommented ? ' (on)' : ''}
            </button>
            <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-3">
              <Button size="sm" type="button" variant="outline" onClick={load}>
                Refresh
              </Button>
              <Button size="sm" type="button" disabled={nothing} onClick={downloadPeople}>
                Respondents CSV
              </Button>
              <Button size="sm" type="button" variant="outline" disabled={nothing} onClick={downloadCSV}>
                Answers CSV
              </Button>
              <Button size="sm" type="button" variant="ghost" disabled={nothing} onClick={downloadJSON}>
                JSON
              </Button>
            </div>
          </div>
          <p className="note mt-3 max-w-measure">
            Two sheets. <em>Respondents</em> is one row per person, one column per
            question: the rated questions carry their number so a column can be
            averaged, the bands carry their label so a column cannot be.
            <em> Answers</em> is one row per answer, the full archive, questions that
            are no longer asked included.
          </p>

          {nothing ? (
            /* The empty state must distinguish the two cases: nobody answered,
               or answers cannot reach this page. They need different fixes. */
            <div className="mt-8 rounded-panel border border-rule bg-card p-8">
              <h2 className="font-display text-head font-bold text-ink">
                {status === 'server' ? 'Nobody Has Answered Yet' : 'Nothing Recorded In This Browser'}
              </h2>
              <p className="mt-3 max-w-measure text-sec text-ink-2">
                {status === 'server'
                  ? 'The API answered and its store is empty. Send the site to a reviewer and this page fills in as they read.'
                  : 'This machine has no saved answers and the server could not be reached, so there is genuinely nothing to show, not an empty result from a working backend.'}
              </p>
              <p className="note mt-3">
                The figures above read “No data” because there is nothing to
                compute, not because anything failed.
              </p>
            </div>
          ) : shown.length === 0 ? (
            <div className="mt-8 rounded-panel border border-rule bg-card p-8">
              <h2 className="font-display text-head font-bold text-ink">
                No Match For That Filter
              </h2>
              <p className="mt-3 max-w-measure text-sec text-ink-2">
                {people.length} respondent{people.length === 1 ? '' : 's'} recorded, none of
                them matching the current code and note filter.
              </p>
              <div className="mt-5">
                <Button size="sm" type="button" variant="outline"
                  onClick={() => { setQuery(''); setOnlyCommented(false) }}>
                  Clear the filter
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="note mt-6">
                Showing {shown.length} of {people.length}. A row here is one browser,
                named by the last six characters of its random code, which is the only
                handle the survey has. On a narrow screen the table scrolls sideways.
              </p>
              <div className="mt-4 rounded-panel border border-rule bg-card px-5 py-1 sm:px-6">
                <Table>
                  <THead>
                    <TR>
                      <TH>Code</TH>
                      <TH>When</TH>
                      <TH>Role</TH>
                      <TH>Age group</TH>
                      <TH align="right">Stars</TH>
                      <TH align="right">Rated</TH>
                      <TH align="right">Done</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {shown.map(p => (
                      <TR key={p.id}>
                        <TD className="font-display font-medium text-ink">{p.code}</TD>
                        <TD className="whitespace-nowrap text-ink-2">{shortWhen(p.lastAt)}</TD>
                        <TD className="text-ink-2">
                          {p.demo.get('who-role') || <span className="text-ink-3">none</span>}
                        </TD>
                        <TD className="whitespace-nowrap text-ink-2">
                          {p.demo.get('who-age') || <span className="text-ink-3">none</span>}
                        </TD>
                        <TD num align="right" className="text-ink">
                          {p.stars == null ? <span className="text-ink-3">none</span> : p.stars.toFixed(1)}
                        </TD>
                        <TD num align="right" className="text-ink">
                          {p.rated}<span className="text-ink-3">/{SCALE_ITEMS.length}</span>
                        </TD>
                        <TD num align="right" className="text-ink">
                          {p.done}<span className="text-ink-3">/{REQUIRED_COUNT}</span>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
              <p className="note mt-3">
                “Rated” counts the {SCALE_ITEMS.length} five-point questions. “Done”
                counts all {REQUIRED_COUNT} questions that were not optional. The one
                written question is optional and is in neither.
              </p>
            </>
          )}
        </section>

        {/* ------------------------------------------------------ free text */}
        <section aria-label="Written notes" className="mt-20">
          <p className="mark">Written Notes</p>
          {notes.length === 0 ? (
            <p className="mt-4 max-w-measure text-sec text-ink-2">
              Nobody has written a note yet. The survey has one written question, it is
              optional, and this section stays empty until someone uses it.
            </p>
          ) : (
            <>
              <p className="mt-4 max-w-measure text-sec text-ink-2">
                Quoted in full, from the one written question: “{TEXT_ITEM.prompt}”{' '}
                {notes.length} note{notes.length === 1 ? '' : 's'} from {s.people}{' '}
                respondent{s.people === 1 ? '' : 's'}.
              </p>
              <div className="mt-8 grid gap-x-12 gap-y-8 lg:grid-cols-2">
                {notes.map(c => (
                  <Quote key={c.key} code={c.code} at={c.at}>{c.text}</Quote>
                ))}
              </div>
            </>
          )}
        </section>

        {/* ---------------------------------------------------- the archive */}
        {!nothing && (
          <section aria-label="Every answer" className="mt-20">
            <p className="mark">Every Answer</p>
            <Fold
              summary="Every answer as it was given"
              note={`${shown.length} shown, in the order the questions were asked`}
            >
              <div className="flex flex-col gap-6">
                {shown.map(p => <Respondent key={p.id} p={p} />)}
              </div>
            </Fold>
          </section>
        )}

        {retiredGroups.length > 0 && (
          <section aria-label="Retired answers" className="mt-20">
            <p className="mark">Answers To Questions No Longer Asked</p>
            <p className="mt-4 max-w-measure text-sec text-ink-2">
              Real answers, kept here in full, to questions the survey has since
              dropped. None of them is counted in any figure above: they answered a
              different question, so averaging them in would invent a number.
            </p>
            <List className="mt-4 max-w-measure text-sec text-ink-2">
              <Item>
                The ten usability statements, dropped on 13 October with the
                instrument they belonged to. Half of them were the negative mirror of
                the other half, and the published score they summed into no longer
                applies to anything on this site.
              </Item>
              <Item>The two written prompts: what you would change, and what difference it would make.</Item>
              <Item>The four older questions about you, and the 0 to 10 recommendation question.</Item>
              <Item>The two questions the survey used to ask on every page.</Item>
            </List>
            <Fold
              summary="The older answers"
              note={`${s.retired} answer${s.retired === 1 ? '' : 's'} in ${retiredGroups.length} group${retiredGroups.length === 1 ? '' : 's'}`}
            >
              <div className="flex flex-col gap-8">
                {retiredGroups.map(([g, rs]) => (
                  <div key={g}>
                    <h3 className="font-display text-ui font-bold text-ink">{g}</h3>
                    <dl className="mt-3 flex flex-col gap-4">
                      {rs.map((r, i) => (
                        <div key={g + '/' + r.questionId + '/' + i}
                          className="border-t border-rule pt-3">
                          <dt className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <span className="text-fine tabular-nums text-ink-3">
                              {r.questionId}
                            </span>
                            {/* questions.js keeps the old wording, so a real
                                answer never shows under a bare id. */}
                            <span className="max-w-read font-display text-ui font-bold text-ink-2">
                              {questionText(r.questionId)}
                            </span>
                          </dt>
                          <dd className="mt-1.5 max-w-measure whitespace-pre-wrap break-words text-sec text-ink">
                            {String(r.label || r.value || '').trim() ||
                              <span className="text-ink-3">left blank</span>}
                          </dd>
                          <p className="note mt-1">{r.code}</p>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            </Fold>
          </section>
        )}
      </div>
    </main>
  )
}

export default Responses
