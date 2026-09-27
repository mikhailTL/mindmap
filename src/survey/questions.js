/* One survey, at the end, off a button in the corner.
 *
 * What was here before: two questions on every page, fired mid-browse after a
 * scroll and a timer, eight times over a visit. That design was answering a
 * question nobody asked — it measured each page in isolation and interrupted
 * the thing it was measuring, and a reviewer who is mid-sentence on the
 * hardware page is the worst possible moment to ask them to rate the hardware
 * page. It is gone. Nothing pops up over a page now.
 *
 * What replaces it is one instrument, opened when the reviewer decides, built
 * out of scales that already have published scoring and published benchmarks,
 * because the point of a review is a number that can be compared with
 * something rather than a shelf of bespoke five-point questions that can only
 * be compared with themselves.
 *
 *   SUS   — the System Usability Scale, Brooke 1986. Ten statements, five-point
 *           agreement, alternating positive and negative. Scores 0-100, and
 *           the population mean across hundreds of published studies is 68,
 *           which is what makes the number mean anything. Wording is kept as
 *           close to canonical as substituting "this app" allows; changing the
 *           statements is what invalidates the benchmark.
 *   NPS   — one 0-10 item. Coarse, but universally understood.
 *   Stars — 1-5 in half steps.
 *   Impact — five points, and the one place a sentence is invited.
 *
 * Demographics come first and are all optional. They exist so a SUS of 71 can
 * be split by whether the respondent was a student, a parent or a counselor —
 * one number for everybody hides exactly the disagreement worth knowing about.
 */

const pts = (...labels) => labels.map((label, i) => ({ value: i + 1, label }))

/* Five-point agreement, negative to positive. One scale, learned once. */
export const AGREE = pts('Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree')

const agree  = (id, prompt, tone) => ({ id, kind:'scale', prompt, points: AGREE, sus: tone })
const choice = (id, prompt, options, extra = {}) => ({ id, kind:'choice', prompt, options, ...extra })

/* The ten SUS statements, in their published order. `sus` marks the direction:
   odd-numbered items are worded positively and even-numbered negatively, and
   the scoring below depends on that alternation being intact. Reordering them
   or dropping one produces a number that is not a SUS score. */
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
    /* Hyphens, not en dashes. Set in a grotesque at 17px an en dash between
       two figures reads as a long rule and the pair stops looking like one
       range. */
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
  /* The segmentation that actually changes how an answer should be read. A
     counselor who deals with this every week and a stranger who has never
     thought about it are both useful reviewers and they are not the same
     reviewer. */
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

/* Three sections, in the order they are asked. Demographics first because they
   are the easiest thing in the survey and finishing something immediately is
   what gets the rest answered. */
export const SECTIONS = [
  { id: 'about',   title: 'About you',
    note: 'All four are optional and none of them name you.',
    items: ABOUT_ITEMS },
  { id: 'usability', title: 'Using the app',
    /* "The standard ten" told a reviewer nothing: they have no reason to know
       there is a standard set of ten. It says what the ten are for instead. */
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

   SUS: positively worded items score (answer - 1), negatively worded items
   score (5 - answer); sum the ten and multiply by 2.5. Range 0-100, mean of
   published studies 68. It is not a percentage and saying "71%" is the most
   common way to misreport it.

   NPS: promoters (9-10) minus detractors (0-6) as a percentage of all
   respondents, ignoring passives. Range -100 to +100. */
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

/* Sauro and Lewis's curved grade, which is the reason a 71 is a C and not a
   "71 out of 100 so nearly an A". */
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

/* Answers recorded under the old per-page scheme are still in reviewers'
   browsers and still on the responses page. They keep their English labels
   rather than showing as bare route ids. */
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
