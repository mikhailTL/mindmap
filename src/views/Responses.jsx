import React from 'react'
import { Button } from '../ui/button'
import { cn } from '../lib/utils'
import { QUESTIONS, questionText } from '../survey/questions'
import { exportRows, toCSV, getVisitor } from '../survey/store'

/* The page Mikhail opens to read what peer reviewers actually said.
 *
 * Grouped by person, not by question, because the question that was asked of
 * this page is "what did the reviewers say" and a reviewer is a person with an
 * opinion that hangs together. A table of forty rows sorted by question id
 * answers a different question — it tells you the mean of item 4 and loses the
 * one reviewer who said the same thing three different ways.
 *
 * ─── On access ──────────────────────────────────────────────────────────────
 * This page is UNLISTED, WHICH IS NOT SECURITY. There is no login here on
 * purpose: a password field in a static bundle is either checked in the client
 * (where anyone can read the comparison) or checked against a secret shipped in
 * the bundle (where anyone can read the secret). Both are theatre, and theatre
 * is worse than an honest gap because it stops you from closing the real one.
 *
 * What is here instead: the route is not in the nav and not in VIEWS, and when
 * VITE_RESPONSES_KEY is set the page takes a key out of the URL query string
 * and forwards it as a header for the API to check against its own server-side
 * env var. The key is never a build-time constant — VITE_RESPONSES_KEY is read
 * only as a flag meaning "this deployment expects a key", never as the key
 * itself, so nothing secret lands in dist/.
 *
 * The real protection is one of: Vercel deployment protection on the project,
 * or an access-controlled store the function reads with credentials the browser
 * never holds. Until one of those is on, treat everything here as public.
 * SURVEY-SETUP.md says the same thing in the same words.
 */

const ENDPOINT = import.meta.env?.VITE_SURVEY_ENDPOINT || '/api/responses'
/* Flag, not secret. Its value is never compared against anything and never
 * sent; only its presence switches the header on. */
const KEY_EXPECTED = !!import.meta.env?.VITE_RESPONSES_KEY

/* The app routes on the hash, so a shared link can carry its query on either
 * side of the '#'. Both are read rather than making Mikhail remember which. */
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

const PAGE_ORDER = Object.keys(QUESTIONS)

const PAGE_LABEL = {
  site: 'Overview', patch: 'The patch', hub: 'Open the app',
  student: 'For students', check: 'Take a reading', parent: 'For parents',
  privacy: 'Who can see what', pro: 'For schools', tour: 'The tour',
  final: 'Last questions',
}

/* Sorting a reviewer's answers by the order they were asked, not by the clock:
 * someone who went back and changed one answer should not have it jump to the
 * bottom of their card away from the question it belongs beside. */
const ASK_ORDER = new Map()
PAGE_ORDER.forEach((page, pi) => {
  ;(QUESTIONS[page] || []).forEach((q, qi) => ASK_ORDER.set(page + '/' + q.id, pi * 100 + qi))
})
const askIndex = r => ASK_ORDER.get(r.page + '/' + r.questionId) ?? 9999

const TOTAL_QUESTIONS = PAGE_ORDER.reduce((n, p) => n + (QUESTIONS[p] || []).length, 0)

/* Every question that produces a number worth counting, in the order asked. */
const SCALED = PAGE_ORDER.flatMap(page =>
  (QUESTIONS[page] || [])
    .filter(q => (q.kind === 'scale' || q.kind === 'impact') && Array.isArray(q.points))
    .map(q => ({ page, id: q.id, prompt: q.prompt, points: q.points }))
)

/* ------------------------------------------------------------- normalising */

/* The store flattens a compound answer for its CSV with a module-private
 * helper. The server hands back the unflattened original, so the same rule is
 * restated here rather than exported and shared — the store's copy is the one
 * that defines the CSV, and a shared helper would let a change to this page's
 * display quietly change the column Mikhail opens in a spreadsheet. */
function flat(value) {
  if (value == null) return ''
  if (typeof value === 'object') {
    const score = value.score ?? ''
    const note = value.note ?? ''
    return note ? `${score} — ${note}` : String(score)
  }
  return String(value)
}

function num(v) {
  const n = parseFloat(String(v ?? ''))
  return Number.isFinite(n) ? n : null
}

/* The sentence a reviewer typed, pulled clear of the score it was attached to:
 * the impact answer flattens to "4 — because…" and only the tail is prose. */
function prose(row) {
  if (row.kind === 'text') return String(row.value || '').trim()
  if (row.kind === 'impact') {
    const s = String(row.value || '')
    const i = s.indexOf('—')
    return i >= 0 ? s.slice(i + 1).trim() : ''
  }
  return ''
}

/* One respondent, built from rows already in exportRows() shape so the server
 * path and the local path converge before anything renders or downloads. */
function build(id, name, rows, startedAt) {
  const sorted = rows.slice().sort((a, b) => askIndex(a) - askIndex(b))
  const times = rows.map(r => r.at).filter(Boolean).sort()
  const stars = num(rows.find(r => r.questionId === 'final-stars')?.value)
  return {
    id,
    name: name || 'Anonymous',
    startedAt: startedAt || times[0] || null,
    lastAt: times[times.length - 1] || null,
    rows: sorted,
    answered: rows.length,
    stars: stars == null ? null : stars,
    commented: sorted.some(r => prose(r).length > 0),
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

function fromLocal() {
  const me = getVisitor()
  return group(exportRows(), id => (me && me.id === id ? me.startedAt : null))
}

function fromServer(payload) {
  const list = Array.isArray(payload?.respondents) ? payload.respondents : []
  return list.map(r => {
    const name = String(r?.name || 'Anonymous')
    const id = String(r?.id || '')
    const rows = (Array.isArray(r?.answers) ? r.answers : []).map(a => ({
      visitorName: name,
      visitorId: id,
      page: String(a?.page || ''),
      questionId: String(a?.qid || ''),
      question: questionText(a?.page, a?.qid),
      kind: String(a?.kind || ''),
      value: flat(a?.value),
      label: a?.label ?? '',
      at: a?.at || '',
    }))
    return build(id, name, rows, r?.startedAt || null)
  })
}

/* ---------------------------------------------------------------- download */

function stamp() {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/* Same mechanism the survey card uses. Wrapped because a blocked blob URL or a
 * revoked object URL must not take the page down with it — the reader still has
 * every answer on screen, which is the thing that matters. */
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

/* A drawn bar, the way every other figure on this site is drawn: a rect in a
 * viewBox, no library, no rounded end to distort under a non-uniform scale.
 * accent on mist clears the 3:1 graphics minimum, and the count is printed
 * beside it so the length is never the only carrier. */
function Bar({ frac }) {
  const w = frac > 0 ? Math.max(1.2, frac * 100) : 0
  return (
    <svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden
      className="block h-2.5 w-full border border-rule bg-mist">
      {w > 0 && <rect x="0" y="0" width={w} height="10" className="fill-accent" />}
    </svg>
  )
}

function Distribution({ q, counts, total }) {
  return (
    <figure className="m-0 border-t border-rule pt-4">
      <figcaption className="max-w-read font-display text-ui font-medium text-ink">
        {q.prompt}
      </figcaption>
      <p className="note mt-1">{PAGE_LABEL[q.page] || q.page} · {total} answered</p>
      <div className="mt-3 flex flex-col gap-2">
        {q.points.map(p => {
          const n = counts[p.value] || 0
          return (
            <div key={p.value} className="grid grid-cols-[1fr_minmax(70px,32%)_2.5rem] items-center gap-3">
              <span className="text-meta text-ink-2">{p.label}</span>
              <Bar frac={total ? n / total : 0} />
              <span className="text-right font-mono text-fine tabular-nums text-ink">{n}</span>
            </div>
          )
        })}
      </div>
    </figure>
  )
}

/* The rating as a shape and as a figure, so it never depends on the fill.
 * Read-only: the interactive control in ui/stars is a slider and a slider that
 * cannot be moved is a trap for a keyboard user. */
const STAR = 'M12 2.4l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.4l-5.88 3.1 ' +
             '1.12-6.55L2.48 9.32l6.58-.96z'

function Stars({ value, max = 5 }) {
  const uid = React.useId()
  if (value == null) {
    return <span className="font-mono text-fine text-ink-3">no rating</span>
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
  'hover:border-ink-3 hover:bg-mist active:bg-accent-wash ' +
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

/* A drawn stand-in while the fetch is out. Not a spinner: a spinner says "wait"
 * and says nothing else, where this says what shape the thing being fetched is,
 * and it holds the layout so nothing jumps when the answers land. It does not
 * move, which is also how it satisfies reduced motion. */

function Notice({ title, children }) {
  return (
    <div className="mt-8 max-w-measure border-l-2 border-warn bg-warn-wash py-3 pl-4 pr-5">
      <p className="font-display text-ui font-medium text-ink">{title}</p>
      <div className="mt-1.5 text-meta text-ink-2">{children}</div>
    </div>
  )
}

function Respondent({ p }) {
  return (
    <article className="rounded-panel border border-rule bg-card p-6 sm:p-8">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h3 className="font-display text-row font-medium text-ink">{p.name}</h3>
        <Stars value={p.stars} />
      </header>
      <p className="note mt-1.5">
        Started {when(p.startedAt)} · answered {p.answered} of {TOTAL_QUESTIONS}
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
                  {PAGE_LABEL[r.page] || r.page}
                </span>
                <span className="max-w-read font-display text-ui font-medium text-ink-2">
                  {r.question}
                </span>
              </dt>
              {/* Prose is never clamped, ellipsised or scrolled: a reviewer's
                  sentence is the single most useful thing in this whole file,
                  and truncating it to fit a card is losing the data to keep the
                  layout. break-words because a pasted URL must not push the
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

export function Responses() {
  /* This browser's own records are available synchronously, so the page paints
     its real structure on the first frame and the fetch only ever upgrades it.
     Gating the whole body on `status !== 'loading'` measured CLS 0.32 at
     1280px — an empty page replaced wholesale a few hundred ms later. Starting
     from local data and swapping the rows in place measures near zero, and it
     also means a reviewer with no network still sees their own answers. */
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
      fallback('No response endpoint answered — either this is a local build with no functions running, or the API is not deployed.')
    }
  }, [])

  React.useEffect(() => { load() }, [load])

  const shown = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = people.filter(p =>
      (!q || p.name.toLowerCase().includes(q)) && (!onlyCommented || p.commented))
    const byName = (a, b) => a.name.localeCompare(b.name)
    if (sort === 'name') list.sort(byName)
    if (sort === 'newest') list.sort((a, b) => String(b.lastAt || '').localeCompare(String(a.lastAt || '')) || byName(a, b))
    if (sort === 'oldest') list.sort((a, b) => String(a.startedAt || '').localeCompare(String(b.startedAt || '')) || byName(a, b))
    if (sort === 'most') list.sort((a, b) => b.answered - a.answered || byName(a, b))
    return list
  }, [people, query, sort, onlyCommented])

  /* Summary is computed over everyone, not over the filter: a mean that moves
     when you type in a search box is a mean of nothing. */
  const summary = React.useMemo(() => {
    const rated = people.map(p => p.stars).filter(v => v != null)
    const mean = rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : null
    const dist = SCALED.map(q => {
      const counts = {}
      let total = 0
      people.forEach(p => {
        const row = p.rows.find(r => r.questionId === q.id)
        if (!row) return
        const v = num(row.value)
        if (v == null) return
        counts[v] = (counts[v] || 0) + 1
        total += 1
      })
      return { q, counts, total }
    })
    return {
      mean,
      rated: rated.length,
      commented: people.filter(p => p.commented).length,
      answers: people.reduce((n, p) => n + p.answered, 0),
      dist: dist.filter(d => d.total > 0),
      silent: dist.filter(d => d.total === 0).length,
    }
  }, [people])

  /* Both downloads carry everyone, not the filtered view — the file is the
     archive, and a CSV that silently omits the people you had filtered out is
     the worst kind of wrong. */
  const rows = React.useMemo(() => people.flatMap(p => p.rows), [people])
  const downloadCSV = () => save(toCSV(rows), `mindmap-responses-${stamp()}.csv`, 'text/csv;charset=utf-8')
  const downloadJSON = () => save(
    JSON.stringify({ source: status, ephemeral, exportedAt: new Date().toISOString(), respondents: people }, null, 2),
    `mindmap-responses-${stamp()}.json`, 'application/json')

  const nothing = people.length === 0

  return (
    <main className="pb-20">
      <div className="border-b border-rule bg-mist">
        <div className="wrap py-10">
          <h1 className="font-display text-major font-medium leading-[1.05] tracking-tight text-ink">
            What the reviewers said
          </h1>
          <p className="mt-3 max-w-[60ch] text-sec text-ink-2">
            Every answer left on the site, grouped by the person who left it.
            This page is unlisted, not protected — treat anything here as readable
            by anyone who has the link.
          </p>
        </div>
      </div>

      {/* The skeleton, the two notices and the summary all occupy this slot in
          turn. Without a floor under it the swap moved the whole page — measured
          at CLS 0.32 on a 1280px viewport, well past the 0.1 the audit allows.
          The floor is the tallest of the three, so nothing below it ever moves. */}
      <div className="wrap min-h-[16rem]">
        
        {status === 'local' && (
          <Notice title="Showing this browser's records only">
            <p>{problem}</p>
            <p className="mt-2">
              What is below is what <em>you</em> answered in this browser. Other
              reviewers' answers are sitting in their own browsers and cannot be
              read from here until the API and its store are deployed — see
              SURVEY-SETUP.md.
            </p>
          </Notice>
        )}

        {status === 'server' && ephemeral && (
          <Notice title="The server is not keeping these">
            <p>
              The API answered, but it has no store attached, so it is holding
              responses in memory on one instance. They will disappear on the next
              deploy, the next cold start, or whenever that instance is recycled.
              Download the CSV now, and set up the KV store before asking anyone
              else to review.
            </p>
          </Notice>
        )}

        {(
          <>
            <section aria-label="Summary" className="mt-14">
              <p className="mark">Summary</p>
              <div className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <div className="note">Respondents</div>
                  <div className="mt-2 font-mono text-stat font-medium leading-none tabular-nums text-ink">
                    {people.length}
                  </div>
                  <p className="mt-1.5 text-meta text-ink-2">
                    {summary.answers} answers between them.
                  </p>
                </div>
                <div>
                  <div className="note">Mean rating</div>
                  <div className="mt-2 font-mono text-stat font-medium leading-none tabular-nums text-ink">
                    {summary.mean == null ? '—' : summary.mean.toFixed(2)}
                  </div>
                  <p className="mt-1.5 text-meta text-ink-2">
                    {summary.rated === 0
                      ? 'Nobody has rated the site yet.'
                      : `From ${summary.rated} rating${summary.rated === 1 ? '' : 's'}, out of 5.`}
                  </p>
                </div>
                <div>
                  <div className="note">Left a comment</div>
                  <div className="mt-2 font-mono text-stat font-medium leading-none tabular-nums text-ink">
                    {summary.commented}
                  </div>
                  <p className="mt-1.5 text-meta text-ink-2">
                    Wrote at least one sentence, not just a score.
                  </p>
                </div>
                <div>
                  <div className="note">Source</div>
                  <div className="mt-2 font-display text-head font-medium text-ink">
                    {status === 'server' ? (ephemeral ? 'Server, in memory' : 'Server store') : 'This browser'}
                  </div>
                  <p className="mt-1.5 text-meta text-ink-2">
                    {status === 'server'
                      ? 'Read live from the API.'
                      : 'Read from local storage on this machine.'}
                  </p>
                </div>
              </div>

              {summary.dist.length > 0 && (
                <div className="mt-12 grid gap-x-12 gap-y-8 lg:grid-cols-2">
                  {summary.dist.map(d => (
                    <Distribution key={d.q.id} q={d.q} counts={d.counts} total={d.total} />
                  ))}
                </div>
              )}
              {summary.silent > 0 && (
                <p className="note mt-6">
                  {summary.silent} scale question{summary.silent === 1 ? ' has' : 's have'} no
                  answers yet, so {summary.silent === 1 ? 'it is' : 'they are'} not charted.
                </p>
              )}
            </section>

            <section aria-label="Responses" className="mt-20">
              <p className="mark">Responses</p>

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
                    <option value="newest">Most recent answer first</option>
                    <option value="oldest">First to start</option>
                    <option value="most">Most questions answered</option>
                  </select>
                </Field>
                {/* aria-pressed rather than a checkbox: it is a view filter that
                    takes effect immediately, not a value being submitted. */}
                <button
                  type="button"
                  aria-pressed={onlyCommented}
                  onClick={() => setOnlyCommented(v => !v)}
                  className={cn(
                    'min-h-[46px] rounded-field border px-4 font-display text-ui font-medium',
                    'transition-[background-color,border-color,color] duration-150 ease-out',
                    'disabled:pointer-events-none disabled:opacity-45',
                    onlyCommented
                      ? 'border-ink bg-ink text-paper hover:bg-accent-ink active:bg-accent-ink'
                      : 'border-rule bg-card text-ink hover:border-ink-3 hover:bg-mist active:bg-accent-wash'
                  )}
                >
                  Left a comment{onlyCommented ? ' — on' : ''}
                </button>
                <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-3">
                  <Button size="sm" type="button" variant="outline" onClick={load}>
                    Refresh
                  </Button>
                  <Button size="sm" type="button" disabled={nothing} onClick={downloadCSV}>
                    Download CSV
                  </Button>
                  <Button size="sm" type="button" variant="ghost" disabled={nothing} onClick={downloadJSON}>
                    Download JSON
                  </Button>
                </div>
              </div>

              {nothing ? (
                /* Drawn, and it says which of the two very different things it
                   means — nobody has answered, or nobody's answers can reach
                   this page. Those need different actions from Mikhail. */
                <div className="mt-8 rounded-panel border border-rule bg-card p-8">
                  <h2 className="font-display text-head font-medium text-ink">
                    {status === 'server' ? 'Nobody has answered yet' : 'Nothing recorded in this browser'}
                  </h2>
                  <p className="mt-3 max-w-measure text-sec text-ink-2">
                    {status === 'server'
                      ? 'The API answered and its store is empty. Send the site to a reviewer and this fills in as they read.'
                      : 'This machine has no saved answers, and the server could not be reached, so there is genuinely nothing to show — not an empty result from a working backend.'}
                  </p>
                </div>
              ) : shown.length === 0 ? (
                <div className="mt-8 rounded-panel border border-rule bg-card p-8">
                  <h2 className="font-display text-head font-medium text-ink">
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
                    Showing {shown.length} of {people.length}.
                  </p>
                  <div className="mt-4 flex flex-col gap-6">
                    {shown.map(p => <Respondent key={p.id} p={p} />)}
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}

export default Responses
