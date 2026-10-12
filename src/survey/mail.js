import { exportRows } from './store'
import { ALL_ITEMS } from './questions'

/* Emails one finished response from a static build. One mail per response.
 * Two transports, tried in order:
 *
 * OWN — the owner's endpoint, from VITE_SURVEY_MAIL at build time. The
 *   variable is VITE_SURVEY_MAIL, NOT VITE_SURVEY_ENDPOINT: that one is
 *   already the per-answer sync endpoint (store.js posts to it, Responses.jsx
 *   reads it back, both on the /api/responses protocol), and pointing it at a
 *   mail endpoint breaks the responses page.
 * RELAY — keyless fallback. Any token would ship in the bundle and so would
 *   not be a secret. FormSubmit answers in JSON, so a refusal is readable
 *   instead of a redirect, and delivers nothing until the owner clicks a
 *   one-time activation link — hence the 'waiting' outcome below. */
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
    .map(r => `${r.page} · ${r.question} → ${r.value}`)
    .join('\n')
}

export function payload(rows) {
  const name = rows[0]?.visitorName || 'Anonymous'
  return {
    _subject: `MindMap feedback: ${name}`,
    _template: 'table',
    _captcha: 'false',
    name,
    submitted: new Date().toISOString(),
    answers: answersText(rows),
  }
}

/* The content type is load-bearing. The relay is CORS-aware and takes
 * application/json. Apps Script is not: application/json triggers a CORS
 * preflight OPTIONS it cannot answer, so the POST never happens and the
 * failure looks like a dead network. text/plain is a simple request, no
 * preflight, same JSON body — so it is the default for OWN. */
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
 * cannot deliver yet — unactivated relay or rate limit; never shown to the
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
