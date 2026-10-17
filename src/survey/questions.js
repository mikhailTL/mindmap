import { PRO, PRO_FOR } from '../lib/terms'

/* One survey, twelve questions, numbered continuously.
 *
 * ─── What this is, and what it is not ───────────────────────────────────────
 * This is a HOUSE QUESTIONNAIRE. It is not a published instrument, it has no
 * external benchmark, and no figure it produces may be compared against one.
 * Nothing here is "validated".
 *
 * It replaced a ten-item usability scale on 13 October, on the owner's
 * explicit decision (docs/design-spec.md, section 0d, directive 10). The old
 * scale had a published population mean that this one does not have, and
 * trading that away was the cost of the change. Every claim about a benchmark
 * went with it. Do not reintroduce one.
 *
 * Three things the replacement is built to do:
 *   1. Ask no question that is the negative mirror of another. The old scale
 *      alternated positive and negative wording on purpose; this one asks the
 *      positive form once and stops.
 *   2. Record who answered, in bands, so a quoted figure can say whose figure
 *      it is.
 *   3. Produce per-item figures a submission can quote, and no composite.
 *
 * ─── What is collected ──────────────────────────────────────────────────────
 * An opaque id generated in the browser, a timestamp, and the answers below.
 * NO name, NO email, NO school, NO date of birth. Age is a band only, and the
 * youngest band spans the age of majority so that answering it never states
 * that the respondent is a minor. One short free text, capped, asked in a form
 * that wants two or three words about a feature and not a sentence about a
 * person. Teenagers answer this survey; that is the reason for every line of
 * this paragraph, and src/survey/NameGate.jsx says the same thing to the
 * reader before a single answer is taken. */

const pts = (...labels) => labels.map((label, i) => ({ value: i + 1, label }))

/* Five-point agreement, negative to positive. */
export const AGREE = pts('Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree')

/* Five-point clarity, negative to positive. Same 1-5 shape as AGREE so one
   top-box rule covers both; a separate scale because "how clear was it" is a
   worse question when forced into an agreement frame. */
export const CLEAR = pts('Not clear', 'Slightly clear', 'Fairly clear', 'Clear', 'Completely clear')

const rated = (id, prompt, points) => ({ id, kind: 'scale', prompt, points, rated: true })
const choice = (id, prompt, ...labels) => ({ id, kind: 'scale', prompt, points: pts(...labels) })

/* ── Background ────────────────────────────────────────────────────────────
   Bands, every one of them, with a refusal on every question. `kind: 'scale'`
   is the renderer's single-choice list, not a measurement: these carry no
   direction and never reach a mean. DEMOGRAPHIC_ITEMS is the list that keeps
   them out of the arithmetic. */
export const DEMOGRAPHIC_ITEMS = [
  /* No exact age and no date of birth. The first band runs to 19 so that
     picking it does not state that the respondent is under 18. */
  choice('who-age', 'Which age group are you in?',
    '19 or younger', '20 to 29', '30 to 44', '45 to 59', '60 or older', 'Rather not say'),
  choice('who-role', 'Which of these describes you best?',
    'Student', 'Parent or guardian', 'Teacher or school staff',
    'Doctor, nurse or counselor', 'Something else', 'Rather not say'),
  /* Education, in steps that a fourteen-year-old and a consultant can both
     answer without naming a school. */
  choice('who-school', 'How far have you got in school?',
    'Still in school', 'Finished high school', 'Some college, no degree yet',
    'Two-year or trade qualification', 'Four-year degree',
    'Graduate or professional degree', 'Rather not say'),
]

/* ── Using MindMap ─────────────────────────────────────────────────────────
   Positive wording only. The old scale asked "was it easy" and then "was it
   unnecessarily complex", which is one question asked twice; the owner's
   instruction was to keep the positive half. */
const USE_ITEMS = [
  rated('use-easy', 'MindMap was easy to use.', AGREE),
  rated('sentence-clear', 'How clear was the sentence above the score?', CLEAR),
  rated('use-again', 'I would use MindMap regularly if I had the patch.', AGREE),
]

/* ── Trust and sharing ─────────────────────────────────────────────────────
   The two questions a submission actually needs answered, asked separately
   because a parent and a clinician are not the same decision. */
const TRUST_ITEMS = [
  rated('trust-parent', 'I would be comfortable showing a reading to a parent or guardian.', AGREE),
  rated('trust-clinician', 'I would be comfortable showing a reading to a doctor or counselor.', AGREE),
  rated('would-recommend', 'I would recommend MindMap to someone who needs it.', AGREE),
]

/* The single-choice blocker, so "what would stop you" produces a countable
   answer and not only prose. */
export const BLOCKER_ITEM = choice('blocker', 'What would most stop you from using MindMap?',
  'Nothing I can think of', 'Wearing a patch every day', 'Who else could see a reading',
  'Trusting what the score says', 'Cost', 'Something else')

/* The one free text in the whole survey, and the only one allowed. Short on
   purpose: 200 characters wants a feature named, not a story told, and a
   reviewer who cannot fit identifying detail will not type it. */
export const TEXT_ITEM = {
  id: 'blocker-note',
  kind: 'text',
  optional: true,
  prompt: 'If something would stop you, name it in a few words.',
  placeholder: 'The patch, the price, the sharing...',
  maxLength: 200,
}

export const STARS_ITEM = {
  id: 'stars',
  kind: 'stars',
  prompt: 'Overall, how would you rate MindMap?',
  max: 5,
  step: 0.5,
}

/* Every item scored on a 1-5 scale. DEMOGRAPHIC_ITEMS and BLOCKER_ITEM are
   deliberately absent: a mean of "Parent or guardian" is a number with no
   meaning, and printing one is the failure this split exists to prevent. */
export const SCALE_ITEMS = [...USE_ITEMS, ...TRUST_ITEMS]

/* Sections in the order asked. Titles are plain Title Case noun phrases with
   no pronouns, per the heading rule. The prompts above address the reader in
   the second person, which a question has to do. */
export const SECTIONS = [
  { id: 'background', title: 'Background',
    note: 'Three questions about who is answering, in bands. No name, no email, no school, no birth date.',
    items: DEMOGRAPHIC_ITEMS },
  { id: 'using', title: 'Using MindMap',
    note: 'First reaction is the useful one.',
    items: USE_ITEMS },
  { id: 'trust', title: 'Trust and Sharing',
    note: 'Whether a reading is something you would hand to someone else.',
    items: TRUST_ITEMS },
  { id: 'overall', title: 'Overall Rating',
    note: 'The rating, then what would stop you. The written answer is optional and wants a few words, not a sentence about you.',
    items: [STARS_ITEM, BLOCKER_ITEM, TEXT_ITEM] },
]

export const PAGE = 'review'
export const ALL_ITEMS = SECTIONS.flatMap(s => s.items)
export const REQUIRED = ALL_ITEMS.filter(q => !q.optional)

/* Numbers run 1-12 across the whole survey, not per section, and come from ask
   order rather than being written next to the prompts, because a hand-written
   numeral survives an insertion and produces two of the same number. */
const NUMBERS = new Map(ALL_ITEMS.map((q, i) => [q.id, i + 1]))

export function questionNumber(qid) {
  return NUMBERS.get(qid) ?? null
}

/* ── Scoring ──────────────────────────────────────────────────────────────
   There is no composite. There is no total. There is no grade.
 
   The old instrument summed ten items into one 0-100 figure that could be
   read against a published mean. Nothing here can be: these items were
   written for this product, so a sum of them is a number with no outside
   reference, and a benchmark drawn on it would be invented. What this gives
   instead is, per item, the count, the mean of that item's own 1-5 scale, and
   the share who chose one of the top two points. Each of those is a statement
   about one question that a reader can check against the distribution printed
   beside it.
 
   TOP_BOX is 4, so the top two points of a five-point scale. On AGREE that is
   Agree and Strongly agree; on CLEAR, Clear and Completely clear. */
export const TOP_BOX = 4
export const SCALE_MAX = 5

/* One item's figures, or null. Null and not zero when nothing was answered:
   a zero mean would print as a verdict, and "no data" is the true statement.
   Values that are not finite numbers are dropped rather than coerced, so a
   blank or a string from an older record cannot drag a mean down. */
export function summariseItem(values) {
  const nums = (Array.isArray(values) ? values : [])
    .filter(v => typeof v === 'number' && Number.isFinite(v) && v >= 1 && v <= SCALE_MAX)
  if (!nums.length) return null
  const sum = nums.reduce((a, b) => a + b, 0)
  const top = nums.filter(v => v >= TOP_BOX).length
  return {
    n: nums.length,
    mean: Math.round((sum / nums.length) * 100) / 100,
    top,
    share: top / nums.length,
  }
}

/* How many of a respondent's rated items are answered. Used to say "7 of 8"
   on a card, never to scale a figure up to a full set: a respondent who
   answered three items contributes three answers to three item means and
   nothing at all to the other five. */
export function ratedAnswered(answers) {
  let n = 0
  for (const item of SCALE_ITEMS) {
    const v = answers?.get?.(item.id)
    if (typeof v === 'number' && Number.isFinite(v)) n += 1
  }
  return n
}

/* Questions earlier versions asked. Answers to them are still in reviewers'
   browsers and still on the owner's sheet, so the wording stays here: a real
   answer under a bare id is unreadable, and these answered a different
   question so none of them may reach a figure.
 
   The ten 'sus-*' entries are the retired usability scale, verbatim as it was
   asked. They are kept for exactly one reason, which is that someone answered
   them. */
const RETIRED_QUESTIONS = {
  'sus-1': 'I think that I would want to use MindMap regularly.',
  'sus-2': 'I found MindMap unnecessarily complex.',
  'sus-3': 'I thought MindMap was easy to use.',
  'sus-4': 'I think I would need help from someone technical to use MindMap.',
  'sus-5': 'I found the various parts of MindMap were well put together.',
  'sus-6': 'I thought there was too much inconsistency in MindMap.',
  'sus-7': 'I would imagine that most people would learn to use MindMap very quickly.',
  'sus-8': 'I found MindMap very awkward to use.',
  'sus-9': 'I felt confident using MindMap.',
  'sus-10': 'I needed to learn a lot of things before I could get going with MindMap.',
  change: 'What confused you, or what would you change?',
  impact: 'If this were actually used, what difference would it make?',
  'about-age': 'Your age range',
  'about-education': 'How far you got in school',
  'about-role': 'Which describes you best?',
  'about-closeness': 'How close is teen stress to your own life?',
  nps: 'How likely are you to recommend MindMap?',
}

export function questionText(qid) {
  const q = ALL_ITEMS.find(x => x.id === qid)
  return q ? q.prompt : (RETIRED_QUESTIONS[qid] || qid)
}

export function itemById(qid) {
  return ALL_ITEMS.find(x => x.id === qid) || null
}

/* Answers from the retired per-page scheme are still in reviewers' browsers.
   Keep these labels so they do not render as bare route ids. */
const RETIRED = {
  site: 'Overview (no longer asked)', patch: 'The patch (no longer asked)',
  student: 'For students (no longer asked)', parent: 'For parents (no longer asked)',
  pro: `${PRO_FOR} (no longer asked)`, app: 'Launch (no longer asked)',
  'app-student': 'Student screen (no longer asked)',
  'app-parent': 'Parent screen (no longer asked)',
  'app-pro': `${PRO} console (no longer asked)`,
  check: 'Take a reading (no longer asked)',
  privacy: 'Who can see what (no longer asked)', tour: 'The tour (no longer asked)',
  hub: 'Open the app (no longer asked)', final: 'Last questions (no longer asked)',
}

export function pageLabel(page) {
  return page === PAGE ? 'Site review' : (RETIRED[page] || page)
}
