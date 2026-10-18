import React from 'react'
import { Button } from '../ui/button'
import { cn } from '../lib/utils'
import { Table, THead, TBody, TR, TH, TD } from '../ui/table'
import {
  PAGE, ALL_ITEMS, REQUIRED,
  SCALE_ITEMS, DEMOGRAPHIC_ITEMS, BLOCKER_ITEM, OPEN_ITEMS, STARS_ITEM,
  SCALE_MAX, summariseItem, ratedAnswered,
  questionText, itemById, pageLabel,
} from '../survey/questions'
import { exportRows, toCSV, getVisitor, visitorCode } from '../survey/store'

/* Peer review survey results. A house questionnaire since 13 October
 * (docs/design-spec.md, section 0d, directive 10): no composite, no grade,
 * no benchmark, no percentage of a maximum. Per item: count, mean on its own
 * 1 to 5 scale, top two count, full distribution. Bands are never averaged.
 *
 * Unlisted, not protected. VITE_RESPONSES_KEY is a flag only: when set, a key
 * from the URL is forwarded as a header for the API to check. Until deployment
 * protection or a credentialed store is on, everything here is public. */

const ENDPOINT = import.meta.env?.VITE_SURVEY_ENDPOINT || '/api/responses'
const KEY_EXPECTED = !!import.meta.env?.VITE_RESPONSES_KEY

const STORE_KEY = 'mindmap.survey'

/* Below this, the mean prints with a caution. A chosen floor. */
const MIN_REPORT = 3

const REQUIRED_IDS = REQUIRED.map(q => q.id)
const REQUIRED_COUNT = REQUIRED_IDS.length
const STAR_MAX = STARS_ITEM.max
const STAR_STEP = STARS_ITEM.step

/* The app routes on the hash, so the key may sit on either side of '#'. */
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

/* Ask order, not timestamp: a revised answer must stay by its question. */
const ASK_ORDER = new Map()
ALL_ITEMS.forEach((item, i) => ASK_ORDER.set(item.id, i))
const askIndex = r => ASK_ORDER.get(r.questionId) ?? 9999

/* ------------------------------------------------------------- normalising */

/* Deliberate duplicate of the store's flattener, which defines the CSV column. */
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

/* exportRows() shape. Current means given on this page to a question still
 * asked; the rest is retired, shown in full, never counted. */
function build(id, rows, startedAt) {
  const sorted = rows.slice().sort((a, b) => askIndex(a) - askIndex(b))
  const live = r => r.page === PAGE && !!itemById(r.questionId)
  const current = sorted.filter(live)
  const retired = sorted.filter(r => !live(r))
  const times = rows.map(r => r.at).filter(Boolean).sort()

  const by = new Map(current.map(r => [r.questionId, r]))
  const value = qid => (by.has(qid) ? num(by.get(qid).value) : null)
  /* Bands and the blocker are read as their label, never their number. */
  const picked = qid => {
    const r = by.get(qid)
    if (!r) return null
    const label = String(r.label ?? '').trim()
    return label || null
  }

  /* Partial stays partial: an unanswered item contributes nothing. */
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

  /* The four short written answers, by question id. */
  const notes = new Map()
  OPEN_ITEMS.forEach(item => {
    const r = by.get(item.id)
    const t = r ? String(r.value || '').trim() : ''
    if (t) notes.set(item.id, t)
  })
  /* The one short text asked before 18 October, kept for the CSV column. */
  const oldNote = rows.find(r => r.questionId === 'blocker-note')

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
    notes,
    oldNote: oldNote ? String(oldNote.value || '').trim() : '',
    done,
    commented: notes.size > 0,
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

/* '' for anything no longer asked, which marks a row as retired. */
function textFor(qid) {
  return itemById(qid) ? questionText(qid) : ''
}

function fromRespondents(list) {
  return (Array.isArray(list) ? list : []).map(r => {
    const id = String(r?.id || '')
    const rows = (Array.isArray(r?.answers) ? r.answers : []).map(a => ({
      /* Kept: existing spreadsheets expect the column. The survey collects no name. */
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

/* The store may also carry a `respondents` archive pasted back in. The
 * store's own copy wins on an id clash. Guarded: a private window throws. */
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

/* ------------------------------------------------------------- aggregating */

/* A count per option. Options nobody chose still print at zero. */
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

const labelPoints = item => item.points.map(p => ({ value: p.label, label: p.label }))

function summarise(people) {
  /* Per item, over everyone who answered it. Nothing is summed across items. */
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

/* RFC4180 quoting. The store's serialiser is bound to its own header. */
function cell(v) {
  const s = v == null ? '' : String(v)
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

function csv(head, rows) {
  const body = rows.map(r => head.map(k => cell(r[k])).join(','))
  return [head.join(','), ...body].join('\r\n')
}

/* One row per respondent, one column per question. Rated items carry their
 * number, bands their label, so a band column cannot be averaged. */
const PERSON_HEAD = [
  'respondent', 'startedAt', 'lastAt',
  ...DEMOGRAPHIC_ITEMS.map(q => q.id),
  ...SCALE_ITEMS.map(q => q.id),
  'stars', 'blocker', ...OPEN_ITEMS.map(q => q.id), 'blockerNote',
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
      blockerNote: p.oldNote || '',
      ratedAnswered: p.rated,
      ratedTotal: SCALE_ITEMS.length,
      requiredAnswered: p.done,
      requiredTotal: REQUIRED_COUNT,
    }
    DEMOGRAPHIC_ITEMS.forEach(q => { row[q.id] = p.demo.get(q.id) || '' })
    OPEN_ITEMS.forEach(q => { row[q.id] = p.notes.get(q.id) || '' })
    SCALE_ITEMS.forEach(q => {
      const v = p.scales.get(q.id)
      row[q.id] = v == null ? '' : v
    })
    return row
  })
}

/* Wrapped: a blocked blob URL must not take the page down. */
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

function fmt(iso, opts, fallback) {
  try {
    const d = new Date(iso)
    if (!iso || Number.isNaN(d.getTime())) return fallback
    return d.toLocaleString(undefined, opts)
  } catch {
    return fallback
  }
}
const when = iso => fmt(iso, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }, 'time not recorded')
const shortWhen = iso => fmt(iso, { day: 'numeric', month: 'short' }, 'not recorded')

/* The count prints beside the bar, so length is never the only carrier. */
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

/* One rated item on its own scale. Never a percentage of a maximum. */
function RatedItem({ item, sum, dist }) {
  const thin = sum != null && sum.n < MIN_REPORT
  return (
    <figure className="m-0 border-t border-rule pt-4">
      <figcaption className="max-w-read font-display text-ui font-bold text-ink">
        {item.prompt}
      </figcaption>
      {sum != null && (
        <p className="mt-1 max-w-read text-meta text-ink-2">
          Mean <span className="tabular-nums">{sum.mean.toFixed(2)}</span> of {SCALE_MAX} from{' '}
          <span className="tabular-nums">{sum.n}</span>.{' '}
          <span className="tabular-nums">{sum.top}</span> of{' '}
          <span className="tabular-nums">{sum.n}</span> picked the top two points.
          {thin && (sum.n === 1 ? ' One answer, not a mean.' : ' Too few to read as a result.')}
        </p>
      )}
      <Rows points={item.points} counts={dist.counts} total={dist.total} />
    </figure>
  )
}

/* Read only: ui/stars is a slider, and an immovable slider traps keyboard users. */
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

/* Native <details>: keyboard operable, searchable when open, no state. */
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
        Started {when(p.startedAt)} · {p.done} of {REQUIRED_COUNT} required ·{' '}
        {p.rated} of {SCALE_ITEMS.length} rated
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
                  {textFor(r.questionId) || 'No longer asked'}
                </span>
              </dt>
              {/* Never clamp reviewer prose; break-words keeps a pasted URL in the card. */}
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

/* No sort on a composite: there is none. */
const SORTS = {
  when:  (a, b) => String(b.lastAt || '').localeCompare(String(a.lastAt || '')),
  stars: (a, b) => (b.stars ?? -1) - (a.stars ?? -1),
  done:  (a, b) => b.done - a.done,
  code:  (a, b) => a.code.localeCompare(b.code),
}

export function Responses() {
  /* Local records paint first; the fetch upgrades them. Gating measured CLS 0.32. */
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
          ? `The server refused the request (${res.status}). The key in the URL is missing or wrong.`
          : `The server answered ${res.status}, so nothing could be read.`)
        return
      }
      const data = await res.json()
      setPeople(fromRespondents(data?.respondents))
      setEphemeral(!!data?.ephemeral)
      setStatus('server')
    } catch {
      fallback('No response endpoint answered. The API may not be deployed.')
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

  /* Over everyone, never the filtered view. */
  const s = React.useMemo(() => summarise(people), [people])

  /* Per written question, quoted in full under its own wording. */
  const notes = React.useMemo(
    () => OPEN_ITEMS.map(item => ({
      item,
      quotes: people.filter(p => p.notes.has(item.id)).map(p => ({
        key: p.id + '/' + item.id, code: p.code, at: p.lastAt, text: p.notes.get(item.id),
      })),
    })),
    [people])

  /* Grouped by label, not page id: a dropped question was asked on the page
     that is still current. */
  const retiredGroups = React.useMemo(() => {
    const by = new Map()
    people.forEach(p => p.retired.forEach(r => {
      const g = itemById(r.questionId) ? pageLabel(r.page) : 'Questions no longer asked'
      if (!by.has(g)) by.set(g, [])
      by.get(g).push({ ...r, code: p.code })
    }))
    return [...by.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [people])

  /* Downloads carry everyone. questionText keeps retired wording. */
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
            Unlisted, not protected. Anyone with the link can read every answer here.
          </p>
        </div>
      </div>

      {/* min-h is the taller notice, so swapping them moves nothing below. */}
      <div className="wrap min-h-[16rem]">
        {status === 'local' && (
          <Notice title="Showing this browser's records only">
            <p>{problem}</p>
            <p className="mt-2">
              Other reviewers' answers stay in their browsers until the API is deployed.
              See SURVEY-SETUP.md.
            </p>
          </Notice>
        )}

        {status === 'server' && ephemeral && (
          <Notice title="The server is not keeping these">
            <p>
              The API has no store, so responses live in memory on one instance.
              Download the CSV now and set up the KV store.
            </p>
          </Notice>
        )}

        {/* ------------------------------------------------------- headline */}
        <section aria-label="Headline figures" className="mt-14">
          <p className="mark">Headline Figures</p>
          <p className="mt-4 max-w-measure text-sec text-ink-2">
            One question at a time. No total, no grade, no benchmark, no percentage.
          </p>

          <div className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            <Figure label="Respondents" value={s.people}>
              {s.people === 0
                ? 'Send the site to a reviewer and the figures fill in.'
                : `${s.fullyRated} rated every question, ${s.partlyRated} some, ${s.unrated} none. ${s.answers} answers in all.`}
            </Figure>

            <Figure
              label={s.starsAnswered === 1 ? 'Rating, one respondent' : 'Mean rating'}
              value={s.starMean == null ? 'No data' : s.starMean.toFixed(2)}
              unit={s.starMean == null ? null : `of ${STAR_MAX}`}
            >
              {s.starsAnswered === 0
                ? 'No overall rating yet.'
                : thinStars
                  ? `From ${s.starsAnswered} rating${s.starsAnswered === 1 ? '' : 's'}. Too few to average.`
                  : `From ${s.starsAnswered} ratings, in half stars.`}
            </Figure>

            <Figure label="Short answers" value={s.commented}>
              {s.commented === 0
                ? 'No short answers yet. All four are optional.'
                : `${s.commented} of ${s.people} wrote at least one.`}
            </Figure>
          </div>
        </section>

        {/* -------------------------------------------------- rated answers */}
        <section aria-label="Rated questions" className="mt-20">
          <p className="mark">Rated Questions</p>
          <p className="mt-4 max-w-measure text-sec text-ink-2">
            {SCALE_ITEMS.length} questions, each on its own five point scale.
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
            Counted, never averaged. A refusal is printed as the answer it is.
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
            <Field label="Find a code">
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
                <option value="when">Newest first</option>
                <option value="stars">Highest rating first</option>
                <option value="done">Most complete first</option>
                <option value="code">Code, A to Z</option>
              </select>
            </Field>
            {/* aria-pressed, not a checkbox: a view filter, not a submitted value. */}
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

          {nothing ? (
            /* Two empty states: nobody answered, or answers cannot reach here. */
            <div className="mt-8 rounded-panel border border-rule bg-card p-8">
              <h2 className="font-display text-head font-bold text-ink">
                {status === 'server' ? 'Nobody Has Answered Yet' : 'Nothing Recorded In This Browser'}
              </h2>
              <p className="mt-3 max-w-measure text-sec text-ink-2">
                {status === 'server'
                  ? 'The store is empty. Send the site to a reviewer.'
                  : 'No saved answers here, and the server could not be reached.'}
              </p>
            </div>
          ) : shown.length === 0 ? (
            <div className="mt-8 rounded-panel border border-rule bg-card p-8">
              <h2 className="font-display text-head font-bold text-ink">
                No Match For That Filter
              </h2>
              <p className="mt-3 max-w-measure text-sec text-ink-2">
                {people.length} respondent{people.length === 1 ? '' : 's'} recorded, none matching.
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
                Showing {shown.length} of {people.length}. One row per browser, named by its code.
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
                      <TH align="right">Required</TH>
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
            </>
          )}
        </section>

        {/* ------------------------------------------------------ free text */}
        <section aria-label="Short answers" className="mt-20">
          <p className="mark">Short Answers</p>
          <div className="mt-6 flex flex-col gap-12">
            {notes.map(({ item, quotes }) => (
              <div key={item.id}>
                <h2 className={cn('max-w-read font-display font-bold text-ink',
                  item.important ? 'text-head' : 'text-row')}>
                  {item.prompt}
                </h2>
                <p className="note mt-1.5">
                  {quotes.length === 0 ? 'No answers yet.' : `${quotes.length} of ${s.people} answered.`}
                </p>
                {quotes.length > 0 && (
                  <div className="mt-5 grid gap-x-12 gap-y-6 lg:grid-cols-2">
                    {quotes.map(c => (
                      <Quote key={c.key} code={c.code} at={c.at}>{c.text}</Quote>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------- the archive */}
        {!nothing && (
          <section aria-label="Every answer" className="mt-20">
            <p className="mark">Every Answer</p>
            <Fold
              summary="all answers"
              note={`${shown.length} shown, in ask order`}
            >
              <div className="flex flex-col gap-6">
                {shown.map(p => <Respondent key={p.id} p={p} />)}
              </div>
            </Fold>
          </section>
        )}

        {retiredGroups.length > 0 && (
          <section aria-label="Retired answers" className="mt-20">
            <p className="mark">Earlier Questions</p>
            <p className="mt-4 max-w-measure text-sec text-ink-2">
              Answers to questions no longer asked. Kept in full, counted in no figure.
            </p>
            <Fold
              summary="earlier answers"
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
                            {/* questions.js keeps the old wording. */}
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
