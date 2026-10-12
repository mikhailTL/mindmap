import React from 'react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { cn } from '../lib/utils'
import { Table, THead, TBody, TR, TH, TD } from '../ui/table'
import {
  PAGE, ABOUT_ITEMS, SUS_ITEMS, ALL_ITEMS, REQUIRED,
  susScore, susGrade, npsScore, npsBucket,
  questionText, itemById, pageLabel,
} from '../survey/questions'
import { exportRows, toCSV, getVisitor } from '../survey/store'

/* Peer-review survey results: one instrument (SUS, NPS, stars, impact), each
 * with a published score and benchmark, so the page leads with the arithmetic
 * and keeps the raw answers under it.
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
 * expects a key" — never as the key itself — so no secret lands in dist/.
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

/* Published SUS population mean across several hundred studies. Printed beside
 * every SUS figure on the page — a bare SUS number means nothing without it. */
const BENCHMARK = 68

/* Floor under which the page refuses to print a mean at all. Per Sauro's SUS
 * guidance, small samples move the score by more than the differences being
 * detected. Three is not a defensible sample either — just the hard floor. */
const MIN_MEAN = 3

const REQUIRED_IDS = REQUIRED.map(q => q.id)
const REQUIRED_COUNT = REQUIRED_IDS.length

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

const IMPACT = itemById('impact')
const STARS_ITEM = itemById('stars')
const STAR_MAX = STARS_ITEM?.max || 5
const STAR_STEP = STARS_ITEM?.step || 0.5

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

/* The impact answer flattens to "4: because…"; only the tail is prose. */
function prose(row) {
  if (!row) return ''
  if (row.kind === 'text') return String(row.value || '').trim()
  if (row.kind === 'impact') {
    const s = String(row.value || '')
    const i = s.indexOf(':')
    return i >= 0 ? s.slice(i + 1).trim() : ''
  }
  return ''
}

/* Rows arrive in exportRows() shape so the server and local paths converge
 * before anything renders or downloads.
 *
 * Answers recorded under the retired per-page scheme are split out here and
 * must never reach a figure: they answered different questions on a different
 * instrument, so averaging them in would invent a number. They are still kept
 * and shown. */
function build(id, name, rows, startedAt) {
  const sorted = rows.slice().sort((a, b) => askIndex(a) - askIndex(b))
  const current = sorted.filter(r => r.page === PAGE)
  const retired = sorted.filter(r => r.page !== PAGE)
  const times = rows.map(r => r.at).filter(Boolean).sort()

  const by = new Map(current.map(r => [r.questionId, r]))
  const value = qid => (by.has(qid) ? num(by.get(qid).value) : null)
  const pick = qid => {
    const r = by.get(qid)
    if (!r) return null
    const s = String(r.label ?? '').trim() || String(r.value ?? '').trim()
    return s || null
  }

  /* susScore returns null unless all ten items are present. Nine items times
     2.5 is not a SUS score, it is a smaller number that looks like one. */
  const susAnswers = new Map()
  let susAnswered = 0
  SUS_ITEMS.forEach(item => {
    const v = value(item.id)
    if (v == null) return
    susAnswers.set(item.id, v)
    susAnswered += 1
  })
  const sus = susScore(susAnswers)

  const nps = value('nps')
  const impactRow = by.get('impact')
  const changeRow = by.get('change')
  const impactNote = prose(impactRow)
  const change = prose(changeRow)

  const done = REQUIRED_IDS.filter(qid => {
    const r = by.get(qid)
    return !!r && String(r.value ?? '').trim() !== ''
  }).length

  return {
    id,
    name: name || 'Anonymous',
    startedAt: startedAt || times[0] || null,
    lastAt: times[times.length - 1] || null,
    rows: current,
    retired,
    answered: rows.length,
    sus,
    susAnswered,
    nps,
    npsBucket: npsBucket(nps),
    stars: value('stars'),
    impact: value('impact'),
    impactLabel: pick('impact'),
    impactNote,
    change,
    age: pick('about-age'),
    education: pick('about-education'),
    role: pick('about-role'),
    closeness: pick('about-closeness'),
    done,
    commented: !!(impactNote || change),
  }
}

function group(rows, startedFor) {
  const by = new Map()
  rows.forEach(r => {
    const k = r.visitorId || r.visitorName || 'unknown'
    if (!by.has(k)) by.set(k, [])
    by.get(k).push(r)
  })
  return [...by.entries()].map(([id, rs]) =>
    build(id, rs[0]?.visitorName, rs, startedFor ? startedFor(id) : null))
}

/* Returns '' for a question that no longer exists — the state of any answer
 * recorded against a retired route. */
function textFor(qid) {
  return itemById(qid) ? questionText(qid) : ''
}

function fromRespondents(list) {
  return (Array.isArray(list) ? list : []).map(r => {
    const name = String(r?.name || 'Anonymous')
    const id = String(r?.id || '')
    const rows = (Array.isArray(r?.answers) ? r.answers : []).map(a => ({
      visitorName: name,
      visitorId: id,
      page: String(a?.page || ''),
      questionId: String(a?.qid || ''),
      question: textFor(String(a?.qid || '')),
      kind: String(a?.kind || ''),
      value: flat(a?.value),
      label: a?.label ?? '',
      at: a?.at || '',
    }))
    return build(id, name, rows, r?.startedAt || null)
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

function distribution(people, valueOf, points) {
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

/* A segment prints a mean only with MIN_MEAN complete SUS respondents. Below
 * that the row still appears but states the shortfall in words rather than
 * printing a mean of one. */
function segments(people, pickKey) {
  const by = new Map()
  people.forEach(p => {
    const k = pickKey(p) || 'Did not say'
    if (!by.has(k)) by.set(k, [])
    by.get(k).push(p)
  })
  return [...by.entries()]
    .map(([label, list]) => {
      const complete = list.filter(p => p.sus != null)
      return {
        label,
        n: list.length,
        complete: complete.length,
        mean: complete.length >= MIN_MEAN ? mean(complete.map(p => p.sus)) : null,
      }
    })
    .sort((a, b) => b.complete - a.complete || b.n - a.n || a.label.localeCompare(b.label))
}

function summarise(people) {
  const completeSus = people.filter(p => p.sus != null)
  const partialSus = people.filter(p => p.sus == null && p.susAnswered > 0)
  const susMean = mean(completeSus.map(p => p.sus))
  const npsValues = people.map(p => p.nps).filter(v => v != null)
  const starValues = people.map(p => p.stars).filter(v => v != null)

  const starPoints = []
  for (let v = STAR_STEP; v <= STAR_MAX + 1e-9; v += STAR_STEP) {
    const n = Math.round(v * 10) / 10
    starPoints.push({ value: n, label: `${n.toFixed(1)} star${n === 1 ? '' : 's'}` })
  }

  return {
    people: people.length,
    answers: people.reduce((n, p) => n + p.answered, 0),
    completeSus: completeSus.length,
    partialSus: partialSus.length,
    untouchedSus: people.length - completeSus.length - partialSus.length,
    susMean,
    susGrade: susMean == null ? null : susGrade(susMean),
    susBest: completeSus.length ? Math.max(...completeSus.map(p => p.sus)) : null,
    susWorst: completeSus.length ? Math.min(...completeSus.map(p => p.sus)) : null,
    nps: npsScore(npsValues),
    npsAnswered: npsValues.length,
    promoters: npsValues.filter(v => v >= 9).length,
    passives: npsValues.filter(v => v >= 7 && v <= 8).length,
    detractors: npsValues.filter(v => v <= 6).length,
    starMean: mean(starValues),
    starsAnswered: starValues.length,
    starDist: distribution(people, p => p.stars, starPoints),
    impactDist: distribution(people, p => p.impact, IMPACT?.points || []),
    byRole: segments(people, p => p.role),
    byCloseness: segments(people, p => p.closeness),
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
 * column order existing spreadsheets expect — do not widen it to share this. */
function cell(v) {
  const s = v == null ? '' : String(v)
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

function csv(head, rows) {
  const body = rows.map(r => head.map(k => cell(r[k])).join(','))
  return [head.join(','), ...body].join('\r\n')
}

const PERSON_HEAD = [
  'name', 'visitorId', 'startedAt', 'lastAt',
  'susScore', 'susGrade', 'susItemsAnswered',
  'nps', 'npsBucket', 'stars', 'impact', 'impactLabel',
  'role', 'closeness', 'age', 'education',
  'requiredAnswered', 'requiredTotal', 'impactSentence', 'wouldChange',
]

function personRows(people) {
  return people.map(p => ({
    name: p.name,
    visitorId: p.id,
    startedAt: p.startedAt || '',
    lastAt: p.lastAt || '',
    susScore: p.sus == null ? '' : p.sus,
    susGrade: p.sus == null ? '' : susGrade(p.sus).grade,
    susItemsAnswered: p.susAnswered,
    nps: p.nps == null ? '' : p.nps,
    npsBucket: p.npsBucket || '',
    stars: p.stars == null ? '' : p.stars,
    impact: p.impact == null ? '' : p.impact,
    impactLabel: p.impactLabel || '',
    role: p.role || '',
    closeness: p.closeness || '',
    age: p.age || '',
    education: p.education || '',
    requiredAnswered: p.done,
    requiredTotal: REQUIRED_COUNT,
    impactSentence: p.impactNote || '',
    wouldChange: p.change || '',
  }))
}

/* Wrapped: a blocked or revoked blob URL must not take the page down — every
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
 * printed beside it so bar length is never the only carrier. */
function Bar({ frac }) {
  const w = frac > 0 ? Math.max(1.2, frac * 100) : 0
  return (
    <svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden
      className="block h-2.5 w-full border border-rule bg-mist">
      {w > 0 && <rect x="0" y="0" width={w} height="10" className="fill-accent" />}
    </svg>
  )
}

/* Fixed to the 0-100 SUS range with BENCHMARK drawn as an ink rule. The
 * comparison is also stated in words beside every one of these; the rule is
 * never the only way to read it. */
function Meter({ value }) {
  const w = value == null ? 0 : Math.max(0, Math.min(100, value))
  return (
    <svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden
      className="block h-2.5 w-full border border-rule bg-mist">
      {w > 0 && <rect x="0" y="0" width={w} height="10" className="fill-accent" />}
      <rect x={BENCHMARK - 0.35} y="0" width="0.7" height="10" className="fill-ink" />
    </svg>
  )
}

function Figure({ label, value, unit, children }) {
  return (
    <div>
      <div className="note">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-mono text-stat font-medium leading-none tabular-nums text-ink">
          {value}
        </span>
        {unit && <span className="font-mono text-fine tabular-nums text-ink-3">{unit}</span>}
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
            className="grid grid-cols-[1fr_minmax(60px,30%)_2.5rem] items-center gap-3">
            <span className="text-meta text-ink-2">{p.label}</span>
            <Bar frac={total ? n / total : 0} />
            <span className="text-right font-mono text-fine tabular-nums text-ink">{n}</span>
          </div>
        )
      })}
      <p className="note mt-1">{total} {unit}.</p>
    </div>
  )
}

function Distribution({ title, note, points, counts, total, children }) {
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

function Segment({ title, note, rows }) {
  return (
    <figure className="m-0 border-t border-rule pt-4">
      <figcaption className="max-w-read font-display text-ui font-bold text-ink">
        {title}
      </figcaption>
      <p className="note mt-1">{note}</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-meta text-ink-2">No answers to split on yet.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {rows.map(r => (
            <div key={r.label} className="grid grid-cols-[1fr] gap-1.5 sm:grid-cols-[minmax(0,1fr)_minmax(80px,28%)_6rem] sm:items-center sm:gap-3">
              <span className="text-meta text-ink-2">{r.label}</span>
              {r.mean == null ? (
                <>
                  <span className="text-fine text-ink-3 sm:col-span-2 sm:text-right">
                    {r.complete === 0
                      ? `${r.n} here, none finished`
                      : `${r.complete} of ${r.n} finished, too few`}
                  </span>
                </>
              ) : (
                <>
                  <Meter value={r.mean} />
                  <span className="whitespace-nowrap font-mono text-fine tabular-nums text-ink sm:text-right">
                    {r.mean.toFixed(1)}
                    <span className="text-ink-3"> · n{r.complete}</span>
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      )}
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
      <span className="font-mono text-fine tabular-nums text-ink">
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
        <span className="font-mono text-fine tabular-nums text-ink-3 group-open:hidden">Show</span>
        <span className="hidden font-mono text-fine tabular-nums text-ink-3 group-open:inline">Hide</span>
        {summary}
        {note && <span className="note">{note}</span>}
      </summary>
      <div className="border-t border-rule px-6 pb-6 pt-5">{children}</div>
    </details>
  )
}

function Quote({ name, at, children }) {
  return (
    <figure className="m-0 border-t border-rule pt-4">
      <blockquote className="max-w-measure whitespace-pre-wrap break-words text-sec text-ink">
        {children}
      </blockquote>
      <figcaption className="note mt-2">{name} · {when(at)}</figcaption>
    </figure>
  )
}

function Respondent({ p }) {
  return (
    <article className="rounded-panel border border-rule bg-card p-6 sm:p-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h3 className="font-display text-row font-bold text-ink">{p.name}</h3>
        <Stars value={p.stars} />
      </header>
      <p className="note mt-1.5">
        Started {when(p.startedAt)} · {p.done} of {REQUIRED_COUNT} required answered
        {p.sus == null
          ? ` · SUS not scorable (${p.susAnswered} of ${SUS_ITEMS.length} statements)`
          : ` · SUS ${p.sus.toFixed(1)}`}
        {p.commented ? ' · left a comment' : ''}
      </p>

      {p.rows.length === 0 ? (
        <p className="mt-5 text-meta text-ink-2">Gave a name and then answered nothing.</p>
      ) : (
        <dl className="mt-6 flex flex-col gap-5">
          {p.rows.map(r => (
            <div key={r.page + '/' + r.questionId} className="border-t border-rule pt-4">
              <dt className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-mono text-fine tabular-nums text-ink-3">
                  {r.questionId}
                </span>
                <span className="max-w-read font-display text-ui font-bold text-ink-2">
                  {textFor(r.questionId) || 'This question is no longer asked'}
                </span>
              </dt>
              {/* Never clamp, ellipsise or scroll reviewer prose — truncating it
                  loses the data. break-words so a pasted URL cannot push the
                  card wider than the screen. */}
              <dd className="mt-2 max-w-measure whitespace-pre-wrap break-words text-sec text-ink">
                {String(r.value || '').trim() || <span className="text-ink-3">left blank</span>}
              </dd>
              {r.label && String(r.label) !== String(r.value) && (
                <p className="note mt-1">Picked: {r.label}</p>
              )}
            </div>
          ))}
        </dl>
      )}
    </article>
  )
}

/* -------------------------------------------------------------------- page */

const SORTS = {
  name:  (a, b) => a.name.localeCompare(b.name),
  when:  (a, b) => String(b.lastAt || '').localeCompare(String(a.lastAt || '')),
  sus:   (a, b) => (b.sus ?? -1) - (a.sus ?? -1),
  nps:   (a, b) => (b.nps ?? -1) - (a.nps ?? -1),
  stars: (a, b) => (b.stars ?? -1) - (a.stars ?? -1),
  role:  (a, b) => String(a.role || 'zzz').localeCompare(String(b.role || 'zzz')),
  done:  (a, b) => b.done - a.done,
}

export function Responses() {
  /* Paint from local records synchronously; the fetch only upgrades them.
     Gating the body on a loading state measured CLS 0.32 at 1280px. It also
     means a reviewer with no network still sees their own answers. */
  const [status, setStatus] = React.useState('local') // local | server
  const [problem, setProblem] = React.useState(null)
  const [ephemeral, setEphemeral] = React.useState(false)
  const [people, setPeople] = React.useState(() => { try { return fromLocal() } catch { return [] } })

  const [sort, setSort] = React.useState('name')
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
      (!q || p.name.toLowerCase().includes(q)) && (!onlyCommented || p.commented))
    const byName = (a, b) => a.name.localeCompare(b.name)
    list.sort((a, b) => (SORTS[sort] || byName)(a, b) || byName(a, b))
    return list
  }, [people, query, sort, onlyCommented])

  /* Computed over everyone, never the filtered view: a mean that moves when
     you type in the search box is a mean of nothing. */
  const s = React.useMemo(() => summarise(people), [people])

  const comments = React.useMemo(() => {
    const out = []
    people.forEach(p => {
      if (p.change) out.push({ key: p.id + '/change', name: p.name, at: p.lastAt, kind: 'Would change', text: p.change })
      if (p.impactNote) out.push({ key: p.id + '/impact', name: p.name, at: p.lastAt, kind: 'On impact', text: p.impactNote })
    })
    return out
  }, [people])

  const retiredByPage = React.useMemo(() => {
    const by = new Map()
    people.forEach(p => p.retired.forEach(r => {
      if (!by.has(r.page)) by.set(r.page, [])
      by.get(r.page).push({ ...r, name: p.name })
    }))
    return [...by.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [people])

  /* Every download carries everyone, not the filtered view — the file is the
     archive.

     The question column is filled in here rather than trusted from the row: a
     retired question has no text to look up, and an empty spreadsheet cell
     reads as a missing value rather than a deliberate one. */
  const rows = React.useMemo(() => people.flatMap(p =>
    [...p.rows, ...p.retired].map(r => ({
      ...r,
      question: textFor(r.questionId) || 'Question no longer asked',
    }))), [people])
  const downloadCSV = () => save(toCSV(rows), `mindmap-answers-${stamp()}.csv`, 'text/csv;charset=utf-8')
  const downloadPeople = () => save(
    csv(PERSON_HEAD, personRows(people)),
    `mindmap-respondents-${stamp()}.csv`, 'text/csv;charset=utf-8')
  const downloadJSON = () => save(
    JSON.stringify({ source: status, ephemeral, exportedAt: new Date().toISOString(), respondents: people }, null, 2),
    `mindmap-responses-${stamp()}.json`, 'application/json')

  const nothing = people.length === 0

  /* The label changes with n so the page never prints "mean" over a single
     person's answer. */
  const susLabel = s.completeSus === 1 ? 'SUS score (one respondent)' : 'Mean SUS'
  const smallSample = s.completeSus > 0 && s.completeSus < MIN_MEAN

  return (
    <main className="pb-20">
      <div className="border-b border-rule bg-mist">
        <div className="wrap py-10">
          <h1 className="font-display text-major font-bold leading-[1.05] tracking-tight text-ink">
            What the reviewers said
          </h1>
          <p className="mt-3 max-w-[60ch] text-sec text-ink-2">
            The scored survey first, then every answer underneath it, grouped by
            the person who left it. This page is unlisted, not protected: treat
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
              What is below is what <em>you</em> answered in this browser. Other
              reviewers' answers are in their own browsers and cannot be read from
              here until the API and its store are deployed. See SURVEY-SETUP.md.
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
          <p className="mark">The numbers</p>

          <div className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            <Figure
              label={susLabel}
              value={s.susMean == null ? 'No data' : s.susMean.toFixed(1)}
              unit={s.susMean == null ? null : 'of 100'}
            >
              {s.susMean == null ? (
                <>Nobody has finished all {SUS_ITEMS.length} usability statements yet.</>
              ) : (
                <>
                  Grade {s.susGrade.grade}, {s.susGrade.word}.{' '}
                  {s.susMean >= BENCHMARK
                    ? `${(s.susMean - BENCHMARK).toFixed(1)} above`
                    : `${(BENCHMARK - s.susMean).toFixed(1)} below`}{' '}
                  the published average of {BENCHMARK}.
                </>
              )}
            </Figure>

            <Figure
              label="Net Promoter Score"
              value={s.nps == null ? 'No data' : (s.nps > 0 ? `+${s.nps}` : String(s.nps))}
              unit={s.nps == null ? null : 'of ±100'}
            >
              {s.nps == null
                ? 'Nobody has answered the recommendation question yet.'
                : `${s.promoters} promoter${s.promoters === 1 ? '' : 's'}, ${s.passives} passive, ${s.detractors} detractor${s.detractors === 1 ? '' : 's'}, from ${s.npsAnswered} answer${s.npsAnswered === 1 ? '' : 's'}.`}
            </Figure>

            <Figure
              label={s.starsAnswered === 1 ? 'Rating (one respondent)' : 'Mean rating'}
              value={s.starMean == null ? 'No data' : s.starMean.toFixed(2)}
              unit={s.starMean == null ? null : `of ${STAR_MAX}`}
            >
              {s.starsAnswered === 0
                ? 'Nobody has rated the whole thing yet.'
                : `From ${s.starsAnswered} rating${s.starsAnswered === 1 ? '' : 's'}, given in half stars.`}
            </Figure>

            <Figure label="Respondents" value={s.people}>
              {s.people === 0
                ? 'Send the site to a reviewer and this fills in as they read.'
                : `${s.completeSus} finished the usability scale, ${s.partialSus} started it, ${s.untouchedSus} did not. ${s.answers} answers in total.`}
            </Figure>
          </div>

          <div className="mt-10 grid gap-x-12 gap-y-8 lg:grid-cols-2">
            <figure className="m-0 border-t border-rule pt-4">
              <figcaption className="max-w-read font-display text-ui font-medium text-ink">
                {susLabel} against the benchmark
              </figcaption>
              <div className="mt-3">
                <Meter value={s.susMean} />
                {/* The tick is positioned at BENCHMARK% of the track, not spaced
                    in a justified row — it has to line up with the rule. */}
                <div className="relative mt-1.5 h-[1.5em] font-mono text-tick tabular-nums text-ink-3">
                  <span className="absolute left-0">0</span>
                  <span className="absolute -translate-x-1/2 text-ink" style={{ left: `${BENCHMARK}%` }}>
                    {BENCHMARK}
                  </span>
                  <span className="absolute right-0">100</span>
                </div>
                <p className="note mt-1">The ink rule at {BENCHMARK} is the published average.</p>
              </div>
              <p className="mt-4 max-w-measure text-meta text-ink-2">
                The System Usability Scale runs 0 to 100 and <strong>is not a
                percentage</strong>. A 71 is a 71 on a curve whose population mean
                across hundreds of published studies is 68. The letter grade is
                Sauro and Lewis's curve: 68 is a C, 78.9 a B, 84.1 an A.
              </p>
              {s.completeSus > 0 && (
                <p className="note mt-2">
                  Range {s.susWorst.toFixed(1)} to {s.susBest.toFixed(1)} across{' '}
                  {s.completeSus} complete respondent{s.completeSus === 1 ? '' : 's'}.
                  {s.partialSus > 0 && ` ${s.partialSus} more answered some of the ten and are not scored. A partial SUS is not a smaller SUS, it is no SUS.`}
                </p>
              )}
              {smallSample && (
                <p className="note mt-2">
                  {s.completeSus === 1
                    ? 'This is one person’s score. It is not an average and it should not be reported as one.'
                    : `Only ${s.completeSus} complete responses. Far too few to average with any confidence, so read it as an early signal, not a result.`}
                </p>
              )}
            </figure>

            <figure className="m-0 border-t border-rule pt-4">
              <figcaption className="max-w-read font-display text-ui font-medium text-ink">
                Who would recommend it
              </figcaption>
              <p className="note mt-1">
                One question, scored 0 to 10. Promoters answer 9 or 10, passives 7 or 8,
                detractors 0 to 6. The score is the promoter share minus the detractor share,
                so it runs −100 to +100 and passives count only by diluting both.
              </p>
              <Rows
                points={[
                  { value: 'promoter', label: 'Promoters, 9 or 10' },
                  { value: 'passive', label: 'Passives, 7 or 8' },
                  { value: 'detractor', label: 'Detractors, 0 to 6' },
                ]}
                counts={{ promoter: s.promoters, passive: s.passives, detractor: s.detractors }}
                total={s.npsAnswered}
              />
              <p className="mt-3 max-w-measure text-meta text-ink-2">
                Anything above 0 means more people would recommend it than would
                warn someone off it. It is a coarse instrument on a sample this
                size.
              </p>
            </figure>
          </div>
        </section>

        {/* --------------------------------------------------- segmentation */}
        <section aria-label="Usability by who answered" className="mt-20">
          <p className="mark">Split by who answered</p>
          <p className="mt-4 max-w-measure text-sec text-ink-2">
            One mean over everybody hides the disagreement, and the disagreement
            is usually the finding. A segment gets a printed mean only once{' '}
            {MIN_MEAN} people in it have finished all ten statements.
          </p>
          <div className="mt-8 grid gap-x-12 gap-y-8 lg:grid-cols-2">
            <Segment
              title="Mean SUS by role"
              note={`Rule marks the ${BENCHMARK} benchmark. "Finished" means all ten statements; n is how many.`}
              rows={s.byRole}
            />
            <Segment
              title="Mean SUS by closeness to teen stress"
              note="Same scale, same benchmark rule."
              rows={s.byCloseness}
            />
          </div>
        </section>

        {/* ------------------------------------------------------ the rest */}
        <section aria-label="Ratings and impact" className="mt-20">
          <p className="mark">Rating and impact</p>
          <div className="mt-6 grid gap-x-12 gap-y-8 lg:grid-cols-2">
            <Distribution
              title="Overall rating"
              note={`Out of ${STAR_MAX}, in half stars.`}
              points={s.starDist.points}
              counts={s.starDist.counts}
              total={s.starDist.total}
            />
            <Distribution
              title={IMPACT ? IMPACT.prompt : 'Impact'}
              note="Optional, and the one place a sentence was invited."
              points={s.impactDist.points}
              counts={s.impactDist.counts}
              total={s.impactDist.total}
            />
          </div>
        </section>

        <section aria-label="Who answered" className="mt-20">
          <p className="mark">Who answered</p>
          <p className="mt-4 max-w-measure text-sec text-ink-2">
            Every question here was optional, so these counts are of people who
            chose to say. "Did not say" is counted as an answer.
          </p>
          <div className="mt-8 grid gap-x-12 gap-y-8 lg:grid-cols-2">
            {ABOUT_ITEMS.map(item => {
              const counts = {}
              let total = 0
              people.forEach(p => {
                const r = p.rows.find(x => x.questionId === item.id)
                const v = r ? (String(r.label ?? '').trim() || String(r.value ?? '').trim()) : ''
                const k = v || 'Did not say'
                counts[k] = (counts[k] || 0) + 1
                total += 1
              })
              const points = [...item.options.map(o => ({ value: o, label: o })),
                              { value: 'Did not say', label: 'Did not say' }]
              return (
                <Distribution
                  key={item.id}
                  title={item.prompt}
                  note="Optional question."
                  points={points}
                  counts={counts}
                  total={total}
                />
              )
            })}
          </div>
        </section>

        {/* ------------------------------------------------------ the table */}
        <section aria-label="Respondents" className="mt-20">
          <p className="mark">Each respondent</p>

          <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-4">
            <Field label="Find a name">
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Any part of a name"
                className={cn(CONTROL, 'w-[15rem] max-w-full font-body font-normal placeholder:text-ink-3')}
              />
            </Field>
            <Field label="Sort by">
              <select value={sort} onChange={e => setSort(e.target.value)} className={CONTROL}>
                <option value="name">Name, A to Z</option>
                <option value="when">Most recent answer first</option>
                <option value="sus">Highest SUS first</option>
                <option value="nps">Highest NPS first</option>
                <option value="stars">Highest rating first</option>
                <option value="role">Role</option>
                <option value="done">Most complete first</option>
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
              Left a comment{onlyCommented ? ' (on)' : ''}
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
            Two sheets. <em>Respondents</em> is one row per person with the computed
            SUS, NPS bucket, rating, role and closeness, the sheet that gets pasted
            into a spreadsheet. <em>Answers</em> is one row per answer, the full
            archive, older questions included.
          </p>

          {nothing ? (
            /* The empty state must distinguish the two cases: nobody answered,
               or answers cannot reach this page. They need different fixes. */
            <div className="mt-8 rounded-panel border border-rule bg-card p-8">
              <h2 className="font-display text-head font-bold text-ink">
                {status === 'server' ? 'Nobody has answered yet' : 'Nothing recorded in this browser'}
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
                No one matches that
              </h2>
              <p className="mt-3 max-w-measure text-sec text-ink-2">
                {people.length} respondent{people.length === 1 ? '' : 's'} recorded, none of
                them matching the current name and comment filter.
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
                Showing {shown.length} of {people.length}. SUS is blank where fewer
                than all {SUS_ITEMS.length} statements were answered. On a narrow
                screen the table scrolls sideways: a row here is one person.
              </p>
              <div className="mt-4 rounded-panel border border-rule bg-card px-5 py-1 sm:px-6">
                <Table>
                  <THead>
                    <TR>
                      <TH>Name</TH>
                      <TH>When</TH>
                      <TH align="right">SUS</TH>
                      <TH align="right">Grade</TH>
                      <TH align="right">NPS</TH>
                      <TH align="right">Stars</TH>
                      <TH>Role</TH>
                      <TH align="right">Done</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {shown.map(p => (
                      <TR key={p.id}>
                        <TD className="font-display font-medium text-ink">{p.name}</TD>
                        <TD className="whitespace-nowrap text-ink-2">{shortWhen(p.lastAt)}</TD>
                        <TD num align="right" className="text-ink">
                          {p.sus == null
                            ? <span className="text-ink-3">none</span>
                            : p.sus.toFixed(1)}
                        </TD>
                        <TD align="right">
                          {p.sus == null
                            ? <span className="text-ink-3">none</span>
                            : <Badge>{susGrade(p.sus).grade}</Badge>}
                        </TD>
                        <TD num align="right" className="text-ink">
                          {p.nps == null ? <span className="text-ink-3">none</span> : p.nps}
                        </TD>
                        <TD num align="right" className="text-ink">
                          {p.stars == null ? <span className="text-ink-3">none</span> : p.stars.toFixed(1)}
                        </TD>
                        <TD className="text-ink-2">{p.role || <span className="text-ink-3">not said</span>}</TD>
                        <TD num align="right" className="text-ink">
                          {p.done}<span className="text-ink-3">/{REQUIRED_COUNT}</span>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
              <p className="note mt-3">
                “Done” counts the {REQUIRED_COUNT} questions that were not optional:
                the ten usability statements, the recommendation question and the
                rating.
              </p>
            </>
          )}
        </section>

        {/* ------------------------------------------------------ free text */}
        <section aria-label="What people wrote" className="mt-20">
          <p className="mark">What people wrote</p>
          {comments.length === 0 ? (
            <p className="mt-4 max-w-measure text-sec text-ink-2">
              Nobody has written a sentence yet. Both written questions are
              optional, so this section stays empty until someone uses one.
            </p>
          ) : (
            <>
              <p className="mt-4 max-w-measure text-sec text-ink-2">
                Quoted in full. {comments.length} sentence
                {comments.length === 1 ? '' : 's'} from {s.commented} of {s.people}{' '}
                respondent{s.people === 1 ? '' : 's'}.
              </p>
              <div className="mt-8 grid gap-x-12 gap-y-8 lg:grid-cols-2">
                {comments.map(c => (
                  <div key={c.key}>
                    <p className="note">{c.kind}</p>
                    <Quote name={c.name} at={c.at}>{c.text}</Quote>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* ---------------------------------------------------- the archive */}
        {!nothing && (
          <section aria-label="Every answer" className="mt-20">
            <p className="mark">Every answer</p>
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

        {retiredByPage.length > 0 && (
          <section aria-label="Retired answers" className="mt-20">
            <p className="mark">Older answers we no longer ask</p>
            <p className="mt-4 max-w-measure text-sec text-ink-2">
              The survey used to ask two questions on every page. Those answers are
              real and are kept here, but they were given to different questions on
              a different instrument, so none of them is counted in any figure
              above.
            </p>
            <Fold
              summary="The older answers"
              note={`${s.retired} answer${s.retired === 1 ? '' : 's'} across ${retiredByPage.length} retired page${retiredByPage.length === 1 ? '' : 's'}`}
            >
              <div className="flex flex-col gap-8">
                {retiredByPage.map(([page, rs]) => (
                  <div key={page}>
                    <h3 className="font-display text-ui font-bold text-ink">
                      {pageLabel(page)}
                    </h3>
                    <dl className="mt-3 flex flex-col gap-4">
                      {rs.map((r, i) => (
                        <div key={page + '/' + r.questionId + '/' + i}
                          className="border-t border-rule pt-3">
                          <dt className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <span className="font-mono text-fine tabular-nums text-ink-3">
                              {r.questionId}
                            </span>
                            <span className="font-display text-ui font-bold text-ink-2">
                              {r.name}
                            </span>
                          </dt>
                          <dd className="mt-1.5 max-w-measure whitespace-pre-wrap break-words text-sec text-ink">
                            {String(r.label || r.value || '').trim() ||
                              <span className="text-ink-3">left blank</span>}
                          </dd>
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
