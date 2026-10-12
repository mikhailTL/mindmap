import { PRO_FOR } from '../lib/terms'

/* One survey, opened from a button. Nothing pops up over a page. Thirteen
 * questions, numbered continuously, no multiple choice. Built around one
 * instrument with published scoring and a benchmark:
 *   SUS   — System Usability Scale, Brooke 1986. Ten statements, five-point
 *           agreement, alternating positive and negative. Scores 0-100;
 *           population mean across published studies is 68.
 *   Stars — 1-5 in half steps.
 * Two optional sentences close it. */

const pts = (...labels) => labels.map((label, i) => ({ value: i + 1, label }))

/* Five-point agreement, negative to positive. */
export const AGREE = pts('Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree')

const agree = (id, prompt, tone) => ({ id, kind:'scale', prompt, points: AGREE, sus: tone })

/* Verbatim SUS wording, in published order. Do not reword, reorder or drop an
   item — the result would not be a SUS score and the benchmark would not apply.
   `sus` marks direction: odd items positive, even negative, and the scoring
   below depends on that alternation. */
export const SUS_ITEMS = [
  agree('sus-1',  'I think that I would want to use MindMap regularly.', 'pos'),
  agree('sus-2',  'I found MindMap unnecessarily complex.', 'neg'),
  agree('sus-3',  'I thought MindMap was easy to use.', 'pos'),
  agree('sus-4',  'I think I would need help from someone technical to use MindMap.', 'neg'),
  agree('sus-5',  'I found the various parts of MindMap were well put together.', 'pos'),
  agree('sus-6',  'I thought there was too much inconsistency in MindMap.', 'neg'),
  agree('sus-7',  'I would imagine that most people would learn to use MindMap very quickly.', 'pos'),
  agree('sus-8',  'I found MindMap very awkward to use.', 'neg'),
  agree('sus-9',  'I felt confident using MindMap.', 'pos'),
  agree('sus-10', 'I needed to learn a lot of things before I could get going with MindMap.', 'neg'),
]

/* The rating, then the two sentences. Both sentences are optional and stand on
   their own; neither names an audience. */
export const RATING_ITEMS = [
  {
    id: 'stars',
    kind: 'stars',
    prompt: 'Overall, how would you rate MindMap?',
    max: 5,
    step: 0.5,
  },
  {
    id: 'change',
    kind: 'text',
    optional: true,
    prompt: 'What confused you, or what would you change?',
    placeholder: 'The thing I kept tripping over was…',
    maxLength: 400,
  },
  {
    /* Was a five-point question with a sentence under it. The points are gone;
       the sentence is the question. Same id, so answers already given keep
       their place. */
    id: 'impact',
    kind: 'text',
    optional: true,
    prompt: 'If this were actually used, what difference would it make?',
    placeholder: 'It would matter most because…',
    maxLength: 240,
  },
]

/* Sections in the order asked. */
export const SECTIONS = [
  { id: 'usability', title: 'Using the app',
    /* Say what the ten are for; a reviewer has no reason to know SUS exists. */
    note: 'Ten set questions, the same ten every app gets asked. First reaction is the useful one.',
    items: SUS_ITEMS },
  { id: 'overall', title: 'Overall',
    note: 'The rating, then two sentences you can skip.',
    items: RATING_ITEMS },
]

export const PAGE = 'review'
export const ALL_ITEMS = SECTIONS.flatMap(s => s.items)
export const REQUIRED = ALL_ITEMS.filter(q => !q.optional)

/* Numbers run 1-13 across the whole survey, not per section, and come from ask
   order rather than being written next to the prompts — a hand-written numeral
   survives an insertion and produces two of the same number. */
const NUMBERS = new Map(ALL_ITEMS.map((q, i) => [q.id, i + 1]))

export function questionNumber(qid) {
  return NUMBERS.get(qid) ?? null
}

/* ── Scoring ──────────────────────────────────────────────────────────────
   Published formula, not a house one.

   SUS: positive items score (answer - 1), negative items score (5 - answer);
   sum the ten, multiply by 2.5. Range 0-100, published-study mean 68. It is
   NOT a percentage — "71%" is the usual misreport. */
export function susScore(answers) {
  let sum = 0, n = 0
  for (const item of SUS_ITEMS) {
    const a = answers.get(item.id)
    if (a == null) continue
    sum += item.sus === 'pos' ? a - 1 : 5 - a
    n++
  }
  if (n < SUS_ITEMS.length) return null
  return Math.round(sum * 2.5 * 10) / 10
}

/* Sauro and Lewis curved grade: 71 is a C, not "71 out of 100, nearly an A". */
export function susGrade(score) {
  if (score == null) return null
  if (score >= 84.1) return { grade: 'A', word: 'excellent' }
  if (score >= 78.9) return { grade: 'B', word: 'good' }
  if (score >= 68)   return { grade: 'C', word: 'about average' }
  if (score >= 51.7) return { grade: 'D', word: 'below average' }
  return { grade: 'F', word: 'poor' }
}

/* Questions earlier versions asked: the four demographic ones and the 0-10
   recommendation. Answers to them are still in reviewers' browsers, so the
   wording stays here — a real answer under a bare id is unreadable. */
const RETIRED_QUESTIONS = {
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
  'app-pro': 'Medical Professional console (no longer asked)',
  check: 'Take a reading (no longer asked)',
  privacy: 'Who can see what (no longer asked)', tour: 'The tour (no longer asked)',
  hub: 'Open the app (no longer asked)', final: 'Last questions (no longer asked)',
}

export function pageLabel(page) {
  return page === PAGE ? 'Site review' : (RETIRED[page] || page)
}
