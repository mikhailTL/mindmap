import { exportRows } from './store'
import { ALL_ITEMS } from './questions'

/* Delivery of a finished response, by email, from a page with no server behind
 * it.
 *
 * Why this exists at all: the site is a static Vite build on Vercel. The POST
 * in store.js aims at an endpoint that only exists if someone self-hosts a
 * backend, so on the deployment that actually serves reviewers every answer sat
 * in one browser and reached nobody. A review nobody reads is not a review.
 *
 * Why a keyless relay and not an API: anything with a token would have to ship
 * the token in the bundle, where it is readable by every visitor and therefore
 * not a secret. FormSubmit's ajax endpoint takes a plain JSON POST straight
 * from the browser with nothing but the destination address in the URL, and
 * answers in JSON rather than redirecting, so a refusal is something the survey
 * can read instead of a navigation away from the half-finished form. The
 * address is a destination, not a credential: the relay delivers nothing until
 * the owner of that mailbox clicks a one-time confirmation link, which is what
 * keeps the endpoint from being an open spam relay.
 *
 * One mail per response, not one per answer. The old per-answer POST was right
 * for a database and would be twelve separate emails for one reviewer.
 */
/* Two transports, tried in order.
 *
 * OWN is the owner's own endpoint, set at build time through
 * VITE_SURVEY_MAIL. It is empty on this build and that is fine: when it is set
 * it goes first, because a response delivered by infrastructure the owner
 * controls does not depend on a free relay's uptime, rate limit or activation
 * state. A Google Apps Script web app or a Vercel function both work; neither
 * needs a key in the bundle, because the URL is the destination, not a secret.
 *
 * It is NOT VITE_SURVEY_ENDPOINT, which is already taken: store.js posts each
 * answer there as it is given and Responses.jsx reads the collected set back
 * from it, both against the /api/responses protocol. Pointing that one at a
 * mail endpoint sends it per-answer traffic it does not understand and breaks
 * the responses page, which is exactly the kind of failure that shows up as a
 * silent partial delivery weeks later. One name, one job.
 *
 * RELAY is the keyless fallback. Anything with a token would have to ship the
 * token in the bundle, where every visitor can read it, so it would not be a
 * secret. FormSubmit takes a plain JSON POST with nothing but the destination
 * in the URL and answers in JSON, so a refusal is something the survey can read
 * rather than a navigation away from a half-finished form. It delivers nothing
 * until the owner of that mailbox clicks a one-time activation link, which is
 * what stops it being an open spam relay, and which is a state this module now
 * reports by name instead of calling it a failure. */
const OWN = import.meta.env?.VITE_SURVEY_MAIL || ''
const RELAY = 'https://formsubmit.co/ajax/2020mik2020@gmail.com'

/* Question order, not the order the answers were given. A reviewer doubles
 * back and re-answers item three last, and a mail that lists the instrument in
 * its published order can be read side by side with the survey. An answer left
 * in a browser from the retired per-page scheme is not in the instrument any
 * more, so it sorts after the rest rather than being dropped. */
const ORDER = new Map(ALL_ITEMS.map((q, i) => [q.id, i]))
const rank = qid => (ORDER.has(qid) ? ORDER.get(qid) : ORDER.size)

/* Built from the same rows the CSV is built from, so the mail and the file a
 * reviewer downloads can never disagree about what was said. The flattening of
 * the impact score and the star fraction already happened in exportRows. */
export function answersText(rows) {
  return (rows || [])
    .slice()
    .sort((a, b) => rank(a.questionId) - rank(b.questionId))
    .map(r => `${r.page} · ${r.question} → ${r.value}`)
    .join('\n')
}

/* Resolves to a boolean, always, and never throws: the caller is a click
 * handler and an effect in a survey a reviewer is still sitting in front of,
 * and a rejected promise there is a console error and a dead button. A refusal
 * leaves the stored record untouched so the next attempt sends the whole
 * response again rather than half of it. */
/* The three outcomes, named.
 *
 *   'sent'       the response is accepted and gone
 *   'waiting'    the transport is there but cannot deliver yet. Today that
 *                means the relay wants its one-time activation click from the
 *                owner's mailbox; it is not the reviewer's problem and must
 *                never be shown to them as an error.
 *   'unreachable' no signal, a blocked request, or the relay is down.
 *
 * Only 'sent' is terminal. The other two mean the store keeps the response and
 * tries again, which is the whole of how this is reliable: delivery does not
 * have to succeed at the moment a button is pressed.
 *
 * Never throws. The callers are a click handler, an effect, and a window event
 * in a survey somebody is sitting in front of; a rejected promise there is a
 * console error and a dead button. */
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

/* Two content types, and the difference matters more than it looks.
 *
 * The relay is a CORS-aware API and is happy with application/json.
 *
 * A Google Apps Script web app is not: application/json makes the browser send
 * a CORS preflight OPTIONS first, Apps Script has no way to answer one, and the
 * POST that follows never happens — the response never leaves the browser and
 * the failure looks like a network error rather than a misconfiguration.
 * text/plain is a simple request, so there is no preflight; the body is still
 * the same JSON text and the script still reads it with JSON.parse. The script
 * answers with CORS headers of its own, so the reply is readable and acceptance
 * is something the survey can see rather than guess. A Vercel function is
 * same-origin and does not care either way, so plain text is the safe default
 * for whatever the owner stands up. */
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

export async function sendResponse() {
  if (typeof fetch !== 'function') return 'unreachable'
  let rows
  try {
    rows = exportRows()
  } catch { return 'unreachable' }
  if (!rows || !rows.length) return 'unreachable'
  const body = payload(rows)

  /* The owner's own endpoint, when there is one. A 2xx is acceptance: this is
     their server and it has no activation step to be in the middle of. */
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
    /* A 200 is not acceptance on its own. The relay answers 200 with
       success:false both when the address is not activated yet and when the
       post is rate limited, and those are different futures: the first clears
       when the owner clicks a link, the second clears by waiting. Both are
       'waiting' as far as the reviewer is concerned, and both keep the
       response queued. success comes back as the string "true" on accept and
       the boolean false on refusal, so it is read as text. */
    let parsed = null
    try { parsed = await res.json() } catch {}
    if (!parsed) return 'sent'          // 2xx with an unreadable body: taken at its status
    if (String(parsed.success) === 'true') return 'sent'
    return 'waiting'
  } catch {
    return 'unreachable'
  }
}
