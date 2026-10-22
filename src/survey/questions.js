import { PRO, PRO_FOR } from '../lib/terms'

// Survey items: a house questionnaire with no published benchmark, so results are per-item figures only.
const pts = (...labels) => labels.map((label, i) => ({ value: i + 1, label }))

/* Five-point agreement, negative to positive. */
export const AGREE = pts('Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree')

export const CLEAR = pts('Not clear', 'Slightly clear', 'Fairly clear', 'Clear', 'Completely clear')

const rated = (id, prompt, points) => ({ id, kind: 'scale', prompt, points, rated: true })
const choice = (id, prompt, ...labels) => ({ id, kind: 'scale', prompt, points: pts(...labels) })

// Single-choice lists rendered as 'scale'; they are not in SCALE_ITEMS, so they are excluded from means.
export const DEMOGRAPHIC_ITEMS = [
  // The youngest band runs to 19, so choosing it does not state the respondent is under 18.
  choice('who-age', 'Which age group are you in?',
    '19 or younger', '20 to 29', '30 to 44', '45 to 59', '60 or older', 'Rather not say'),
  choice('who-role', 'Which of these describes you best?',
    'Student', 'Parent or guardian', 'Teacher or school staff',
    'Doctor, nurse or counselor', 'Something else', 'Rather not say'),
  choice('who-school', 'How far have you got in school?',
    'Still in school', 'Finished high school', 'Some college, no degree yet',
    'Two-year or trade qualification', 'Four-year degree',
    'Graduate or professional degree', 'Rather not say'),
]

const USE_ITEMS = [
  rated('use-easy', 'MindMap was easy to use.', AGREE),
  rated('sentence-clear', 'How clear was the sentence above the score?', CLEAR),
  rated('use-again', 'I would use MindMap regularly if I had the patch.', AGREE),
]

const TRUST_ITEMS = [
  rated('trust-parent', 'I would be comfortable showing a reading to a parent or guardian.', AGREE),
  rated('trust-clinician', 'I would be comfortable showing a reading to a doctor or counselor.', AGREE),
  rated('would-recommend', 'I would recommend MindMap to someone who needs it.', AGREE),
]

export const BLOCKER_ITEM = choice('blocker', 'What would most stop you from using MindMap?',
  'Nothing I can think of', 'Wearing a patch every day', 'Who else could see a reading',
  'Trusting what the score says', 'Cost', 'Something else')

const open = (id, prompt, maxLength, extra) =>
  ({ id, kind: 'text', optional: true, prompt, maxLength, ...extra })

export const OPEN_ITEMS = [
  open('open-like', 'What do you like about MindMap?', 500,
    { important: true, hint: 'This helps us most.' }),
  open('open-use', 'How would you use MindMap?', 300),
  open('open-improve', 'What improvements would you like to see in MindMap?', 300),
  open('open-other', 'Any other feedback or questions?', 300),
]

export const STARS_ITEM = {
  id: 'stars',
  kind: 'stars',
  prompt: 'Overall, how would you rate MindMap?',
  max: 5,
  step: 0.5,
}

export const SCALE_ITEMS = [...USE_ITEMS, ...TRUST_ITEMS]

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
    note: 'The rating, then what would stop you.',
    items: [STARS_ITEM, BLOCKER_ITEM] },
  { id: 'written', title: 'Short Answers',
    note: 'All optional. The first one helps us most.',
    items: OPEN_ITEMS },
]

export const PAGE = 'review'
export const ALL_ITEMS = SECTIONS.flatMap(s => s.items)
export const REQUIRED = ALL_ITEMS.filter(q => !q.optional)

// Numbers come from ask order, so inserting a question cannot duplicate a number.
const NUMBERS = new Map(ALL_ITEMS.map((q, i) => [q.id, i + 1]))

export function questionNumber(qid) {
  return NUMBERS.get(qid) ?? null
}

// Top-box share counts answers of 4 or 5 on the 5-point scales.
export const TOP_BOX = 4
export const SCALE_MAX = 5

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

export function ratedAnswered(answers) {
  let n = 0
  for (const item of SCALE_ITEMS) {
    const v = answers?.get?.(item.id)
    if (typeof v === 'number' && Number.isFinite(v)) n += 1
  }
  return n
}

// Wording for retired question ids still present in stored answers; they are excluded from every figure.
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
  'blocker-note': 'If something would stop you, name it in a few words.',
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
