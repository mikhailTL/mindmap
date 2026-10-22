// Emails one finished response: the VITE_SURVEY_MAIL endpoint first, then the FormSubmit relay.
// VITE_SURVEY_ENDPOINT is the per-answer sync endpoint and is not used here.
import { exportRows, visitorCode } from './store'
import { ALL_ITEMS, SCALE_ITEMS, DEMOGRAPHIC_ITEMS, BLOCKER_ITEM, STARS_ITEM } from './questions'

const OWN = import.meta.env?.VITE_SURVEY_MAIL || ''
const RELAY = 'https://formsubmit.co/ajax/2020mik2020@gmail.com'

const ORDER = new Map(ALL_ITEMS.map((q, i) => [q.id, i]))
const rank = qid => (ORDER.has(qid) ? ORDER.get(qid) : ORDER.size)

export function answersText(rows) {
  return (rows || [])
    .slice()
    .sort((a, b) => rank(a.questionId) - rank(b.questionId))
    .map(r => {
      const picked = String(r.label ?? '').trim()
      const shown = picked && picked !== String(r.value) ? `${r.value} (${picked})` : r.value
      return `${r.page} · ${r.question} → ${shown}`
    })
    .join('\n')
}

// Rated items export the number so a column can be averaged; demographics and the blocker export the label.
const NUMERIC_IDS = new Set([...SCALE_ITEMS.map(q => q.id), STARS_ITEM.id])
const LABEL_IDS = new Set([...DEMOGRAPHIC_ITEMS.map(q => q.id), BLOCKER_ITEM.id])

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

// text/plain avoids a CORS preflight, which Apps Script endpoints cannot answer; the relay accepts JSON.
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
    // The relay answers 200 with success:false when not activated or rate limited; success is the string "true" on accept.
    let parsed = null
    try { parsed = await res.json() } catch {}
    if (!parsed) return 'sent'          // 2xx with an unreadable body: taken at its status
    if (String(parsed.success) === 'true') return 'sent'
    return 'waiting'
  } catch {
    return 'unreachable'
  }
}
