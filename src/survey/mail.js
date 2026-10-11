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
const ENDPOINT = 'https://formsubmit.co/ajax/2020mik2020@gmail.com'

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
export async function sendResponse() {
  try {
    if (typeof fetch !== 'function') return false
    const rows = exportRows()
    if (!rows.length) return false
    const name = rows[0].visitorName || 'Anonymous'
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        _subject: `MindMap feedback: ${name}`,
        _template: 'table',
        _captcha: 'false',
        name,
        submitted: new Date().toISOString(),
        answers: answersText(rows),
      }),
    })
    if (!res || !res.ok) return false
    /* A 200 is not acceptance on its own: the relay answers 200 with
     * success:false when the address is unconfirmed or the post is rate
     * limited. success comes back as the string "true" on accept and the
     * boolean false on refusal, so it is compared as text rather than trusted
     * as a boolean. */
    try {
      const body = await res.json()
      if (body && String(body.success) !== 'true') return false
    } catch {
      /* A 2xx whose body will not parse is taken at its status. Calling it a
       * failure would invite a second copy of the same response. */
    }
    return true
  } catch {
    /* No signal, blocked request, or a relay that is down. */
    return false
  }
}
