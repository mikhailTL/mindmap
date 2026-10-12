/* One survey, opened from a button. Nothing pops up over a page. Built from
 * instruments with published scoring and benchmarks:
 *   SUS    — System Usability Scale, Brooke 1986. Ten statements, five-point
 *            agreement, alternating positive and negative. Scores 0-100;
 *            population mean across published studies is 68.
 *   NPS    — one 0-10 item.  Stars — 1-5 in half steps.
 *   Impact — five points, plus the survey's one free-text sentence.
 * Demographics come first and are all optional, so a SUS can be split by
 * student / parent / counselor. */

const pts = (...labels) => labels.map((label, i) => ({ value: i + 1, label }))

/* Five-point agreement, negative to positive. */
export const AGREE = pts('Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree')

const agree  = (id, prompt, tone) => ({ id, kind:'scale', prompt, points: AGREE, sus: tone })
const choice = (id, prompt, options, extra = {}) => ({ id, kind:'choice', prompt, options, ...extra })

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

export const ABOUT_ITEMS = [
  choice('about-age', 'Your age range', [
    /* Hyphens, not en dashes: at 17px in a grotesque an en dash between two
       figures reads as a rule rather than a range. */
    'Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65 or over',
  ], { optional: true }),
  choice('about-education', 'How far you got in school', [
    'Still in school', 'High school', 'Some college', 'Bachelor’s degree',
    'Master’s degree', 'Doctorate or professional degree',
  ], { optional: true }),
  choice('about-role', 'Which describes you best?', [
    'Student',
    'Parent or guardian',
    'Teacher or school staff',
    'School counselor or psychologist',
    'Clinician or healthcare worker',
    'Engineer, designer or researcher',
    'Something else',
  ], { optional: true }),
  choice('about-closeness', 'How close is teen stress to your own life?', [
    'Not close at all',
    'It comes up now and then',
    'It affects someone I know well',
    'It is part of my work',
  ], { optional: true }),
]

export const RATING_ITEMS = [
  {
    id: 'nps',
    kind: 'nps',
    prompt: 'How likely are you to recommend MindMap to a school or a family?',
    low: 'Not at all likely',
    high: 'Extremely likely',
  },
  {
    id: 'stars',
    kind: 'stars',
    prompt: 'Overall, how would you rate MindMap?',
    max: 5,
    step: 0.5,
  },
  {
    id: 'impact',
    kind: 'impact',
    optional: true,
    prompt: 'If schools actually used this, how much difference would it make?',
    points: pts(
      'None at all',
      'A little, for a few people',
      'A real difference for some',
      'A large difference',
      'It would change how schools work'
    ),
    sentence: {
      prompt: 'Say why, if you want to.',
      placeholder: 'It would matter most because…',
      maxLength: 240,
    },
  },
  {
    id: 'change',
    kind: 'text',
    optional: true,
    prompt: 'What confused you, or what would you change?',
    placeholder: 'The thing I kept tripping over was…',
    maxLength: 400,
  },
]

/* Sections in the order asked; demographics first, as the easiest. */
export const SECTIONS = [
  { id: 'about',   title: 'About you',
    note: 'All four are optional and none of them name you.',
    items: ABOUT_ITEMS },
  { id: 'usability', title: 'Using the app',
    /* Say what the ten are for; a reviewer has no reason to know SUS exists. */
    note: 'Ten set questions, the same ten every app gets asked. First reaction is the useful one.',
    items: SUS_ITEMS },
  { id: 'overall', title: 'Overall',
    note: null,
    items: RATING_ITEMS },
]

export const PAGE = 'review'
export const ALL_ITEMS = SECTIONS.flatMap(s => s.items)
export const REQUIRED = ALL_ITEMS.filter(q => !q.optional)

/* ── Scoring ──────────────────────────────────────────────────────────────
   Published formulas, not house ones.

   SUS: positive items score (answer - 1), negative items score (5 - answer);
   sum the ten, multiply by 2.5. Range 0-100, published-study mean 68. It is
   NOT a percentage — "71%" is the usual misreport.

   NPS: promoters (9-10) minus detractors (0-6) as a percentage of all
   respondents, passives ignored. Range -100 to +100. */
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

export function npsBucket(value) {
  if (value == null) return null
  if (value >= 9) return 'promoter'
  if (value >= 7) return 'passive'
  return 'detractor'
}

export function npsScore(values) {
  const v = values.filter(x => x != null)
  if (!v.length) return null
  const p = v.filter(x => x >= 9).length
  const d = v.filter(x => x <= 6).length
  return Math.round(((p - d) / v.length) * 100)
}

export function questionText(qid) {
  const q = ALL_ITEMS.find(x => x.id === qid)
  return q ? q.prompt : qid
}

export function itemById(qid) {
  return ALL_ITEMS.find(x => x.id === qid) || null
}

/* Answers from the retired per-page scheme are still in reviewers' browsers.
   Keep these labels so they do not render as bare route ids. */
const RETIRED = {
  site: 'Overview (no longer asked)', patch: 'The patch (no longer asked)',
  student: 'For students (no longer asked)', parent: 'For parents (no longer asked)',
  pro: 'For schools (no longer asked)', app: 'Launch (no longer asked)',
  'app-student': 'Student screen (no longer asked)',
  'app-parent': 'Parent screen (no longer asked)',
  'app-pro': 'Counselor console (no longer asked)',
  check: 'Take a reading (no longer asked)',
  privacy: 'Who can see what (no longer asked)', tour: 'The tour (no longer asked)',
  hub: 'Open the app (no longer asked)', final: 'Last questions (no longer asked)',
}

export function pageLabel(page) {
  return page === PAGE ? 'Site review' : (RETIRED[page] || page)
}
