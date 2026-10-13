import { exportRows, visitorCode } from './store'
import { ALL_ITEMS, SCALE_ITEMS, DEMOGRAPHIC_ITEMS, BLOCKER_ITEM, TEXT_ITEM, STARS_ITEM } from './questions'

/* Emails one finished response from a static build. One mail per response.
 * Two transports, tried in order:
 *
 * OWN, the owner's endpoint, from VITE_SURVEY_MAIL at build time. The
 *   variable is VITE_SURVEY_MAIL, NOT VITE_SURVEY_ENDPOINT: that one is
 *   already the per-answer sync endpoint (store.js posts to it, Responses.jsx
 *   reads it back, both on the /api/responses protocol), and pointing it at a
 *   mail endpoint breaks the responses page.
 * RELAY, keyless fallback. Any token would ship in the bundle and so would
 *   not be a secret. FormSubmit answers in JSON, so a refusal is readable
 *   instead of a redirect, and delivers nothing until the owner clicks a
 *   one-time activation link, hence the 'waiting' outcome below. */
const OWN = import.meta.env?.VITE_SURVEY_MAIL || ''
const RELAY = 'https://formsubmit.co/ajax/2020mik2020@gmail.com'

/* Sorts by question order, not answer order. Answers from the retired
 * per-page scheme sort last rather than being dropped. */
const ORDER = new Map(ALL_ITEMS.map((q, i) => [q.id, i]))
const rank = qid => (ORDER.has(qid) ? ORDER.get(qid) : ORDER.size)

/* Same rows as the CSV export, already flattened by exportRows. */
export function answersText(rows) {
  return (rows || [])
    .slice()
    .sort((a, b) => rank(a.questionId) - rank(b.questionId))
    /* The label as well as the value, because "2" on its own is unreadable in
     * a mail and the label is what the reviewer actually chose. */
    .map(r => {
      const picked = String(r.label ?? '').trim()
      const shown = picked && picked !== String(r.value) ? `${r.value} (${picked})` : r.value
      return `${r.page} · ${r.question} → ${shown}`
    })
    .join('\n')
}

/* One column per question, in ask order, so the owner's sheet has a column he
 * can average rather than one cell holding every answer as prose.
 *
 * Which of `value` and `label` goes in the cell depends on the question, and
 * getting it backwards is the whole reason this map is explicit:
 *   rated 1-5 items -> the NUMBER, because these are the only ones a mean may
 *     be taken of, and a column of the word "Agree" cannot be averaged.
 *   demographics and the blocker -> the LABEL, because the number is an
 *     arbitrary position in a list. A mean of "Parent or guardian" is the
 *     error this split exists to make impossible.
 *   the rating -> the number. The free text -> the text. */
const NUMERIC_IDS = new Set([...SCALE_ITEMS.map(q => q.id), STARS_ITEM.id])
const LABEL_IDS = new Set([...DEMOGRAPHIC_ITEMS.map(q => q.id), BLOCKER_ITEM.id])

/* Fixed order. A sheet whose columns move between responses is unreadable, so
 * this list and not the order answers happened to arrive in decides it. */
export const FIELD_IDS = ALL_ITEMS.map(q => q.id)

export function fields(rows) {
  const by = new Map((rows || []).map(r => [r.questionId, r]))
  const out = {}
  for (const qid of FIELD_IDS) {
    const r = by.get(qid)
    if (!r) { out[qid] = ''; continue }
    if (LABEL_IDS.has(qid)) out[qid] = String(r.label ?? '').trim() || String(r.value ?? '')
    else if (NUMERIC_IDS.has(qid)) out[qid] = String(r.value ?? '')
    else out[qid] = String(r.value ?? '')
  }
  return out
}

/* No name in the subject or the body: the survey collects none. The code is
 * the tail of the browser's opaque id and is there so two responses that
 * arrive a minute apart can be told apart. */
export function payload(rows) {
  const code = visitorCode(rows[0]?.visitorId)
  return {
    _subject: `MindMap feedback: ${code}`,
    _template: 'table',
    _captcha: 'false',
    respondent: code,
    submitted: new Date().toISOString(),
    answers: answersText(rows),
    ...fields(rows),
  }
}

/* The content type is load-bearing. The relay is CORS-aware and takes
 * application/json. Apps Script is not: application/json triggers a CORS
 * preflight OPTIONS it cannot answer, so the POST never happens and the
 * failure looks like a dead network. text/plain is a simple request, no
 * preflight, same JSON body, so it is the default for OWN. */
async function post(url, body, type) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': type || 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
    redirect: 'follow',
  })
}

/* Three outcomes: 'sent' (the only terminal one), 'waiting' (reachable but
 * cannot deliver yet, unactivated relay or rate limit; never shown to the
 * reviewer as an error), 'unreachable'. The last two keep the response queued
 * for another attempt. Never throws; callers are click handlers and effects. */
export async function sendResponse() {
  if (typeof fetch !== 'function') return 'unreachable'
  let rows
  try {
    rows = exportRows()
  } catch { return 'unreachable' }
  if (!rows || !rows.length) return 'unreachable'
  const body = payload(rows)

  /* On the owner's own endpoint a 2xx is acceptance. */
  if (OWN) {
    try {
      const res = await post(OWN, body, 'text/plain;charset=utf-8')
      if (res && res.ok) return 'sent'
    } catch {}
  }

  try {
    const res = await post(RELAY, body, 'application/json')
    if (!res) return 'unreachable'
    if (!res.ok) return 'unreachable'
    /* A 200 is not acceptance: the relay answers 200 with success:false for
       both an unactivated address and a rate limit, which are both 'waiting'.
       `success` is the string "true" on accept and boolean false on refusal,
       so compare as text. */
    let parsed = null
    try { parsed = await res.json() } catch {}
    if (!parsed) return 'sent'          // 2xx with an unreadable body: taken at its status
    if (String(parsed.success) === 'true') return 'sent'
    return 'waiting'
  } catch {
    return 'unreachable'
  }
}
