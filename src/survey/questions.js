/* The questions, one page at a time.
 *
 * Rewritten against the standard instruments rather than invented from
 * scratch. The first draft asked things like "Working out what MindMap
 * actually is — a patch, an app, or both — from this page was…", which is a
 * reviewer reading a sentence twice before they can answer it. Usability
 * research has settled wording for this and there is no reason to reinvent it:
 *
 *   SEQ  — the Single Ease Question, asked immediately after a task:
 *          "How easy or difficult was …", very difficult → very easy.
 *   SUS  — five-point agreement with a flat statement, strongly disagree →
 *          strongly agree. Every per-page rating here is one or the other.
 *   UMUX-Lite — the two-item capability/ease pair, asked once at the end.
 *
 * Two structural rules:
 *
 * 1. Per page: exactly one rating and one multiple choice. No free text. A
 *    reviewer mid-browse will pick an option; they will not compose a
 *    sentence, and asking them to eight times is how a survey gets abandoned.
 *    Every written answer is collected once, at the end, where the reviewer
 *    has finished and has something to say.
 * 2. Most of the choice questions are comprehension checks with a real right
 *    answer ("Where is the patch worn?", "Can a parent see a raw reading?").
 *    A page can feel clear and still not land — asking what they took away
 *    catches that, and a rating alone never does.
 *
 * The keys are route ids, and they are the route ids the site actually has.
 * When the app moved behind Launch, `student`/`parent`/`pro` stopped being the
 * dashboards and became the walkthroughs that explain them, `hub` was deleted,
 * and `app` plus the three `app-*` dashboards appeared with no questions at
 * all — so the survey was asking about screens the reviewer was not looking at
 * and asking nothing about the four screens that matter most. Every question
 * below is answerable from what is on the page it is keyed to; a comprehension
 * check whose answer is not on the page measures nothing.
 */

const pts = (...labels) => labels.map((label, i) => ({ value: i + 1, label }))

/* The two standard five-point scales, both running negative → positive so the
   direction is learned once and never re-read. */
const EASE  = pts('Very difficult', 'Difficult', 'Neutral', 'Easy', 'Very easy')
const AGREE = pts('Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree')

const ease   = (id, prompt) => ({ id, kind:'scale', prompt, points: EASE })
const agree  = (id, prompt) => ({ id, kind:'scale', prompt, points: AGREE })
const choice = (id, prompt, options) => ({ id, kind:'choice', prompt, options })

export const QUESTIONS = {
  site: [
    ease('site-ease', 'How easy was it to understand what MindMap does?'),
    choice('site-what', 'From this page, MindMap is:', [
      'A patch you wear',
      'A phone app',
      'A patch and an app together',
      'Still not sure',
    ]),
  ],

  patch: [
    ease('patch-ease', 'How easy was it to understand what the patch measures?'),
    choice('patch-where', 'Where is the patch worn?', [
      'On the forearm',
      'On the chest',
      'On the wrist',
      'Not sure',
    ]),
  ],

  /* ── The three walkthroughs ──────────────────────────────────────────────
     Nothing is operated on these pages, so nothing here asks how easy a task
     was. They are explanations, and the only thing worth measuring about an
     explanation is whether it was clear and what the reader took from it. */

  student: [
    agree('student-clear', 'This page made it clear what a student gets from MindMap.'),
    choice('student-baseline', 'A student’s score is measured against:', [
      'Their own last two weeks',
      'Other students in their class',
      'A national average',
      'Not sure',
    ]),
  ],

  parent: [
    agree('parent-limits', 'I understood what a parent can and cannot see.'),
    choice('parent-raw', 'Can a parent see a raw, second-by-second reading?', [
      'Yes',
      'No',
      'Not sure',
    ]),
  ],

  pro: [
    agree('pro-limits', 'The limits a school counselor works inside were clear.'),
    choice('pro-floor', 'For a group of fewer than five students, the console returns:', [
      'Nothing at all',
      'An estimate',
      'A rounded figure',
      'Not sure',
    ]),
  ],

  /* ── The app ─────────────────────────────────────────────────────────────
     One door and three screens behind it. These are the screens a reviewer is
     being asked to judge, so all four are SEQ: there is a task on each one. */

  app: [
    ease('app-ease', 'How easy was it to tell which of the three screens is yours?'),
    choice('app-differ', 'The three screens differ because:', [
      'They show different slices of the same day',
      'Each one reads a different patch',
      'Each one belongs to a different school',
      'Not sure',
    ]),
  ],

  'app-student': [
    ease('app-student-ease', 'How easy was it to find what moved today’s score?'),
    choice('app-student-sees', 'On this screen, a student can reach:', [
      'Every reading the patch took',
      'Only the day’s score',
      'Only what they agreed to share',
      'Not sure',
    ]),
  ],

  'app-parent': [
    ease('app-parent-ease', 'How easy was it to tell how the week had gone?'),
    choice('app-parent-day', 'Each day of the week is marked as:', [
      'Above or inside her usual range',
      'A score out of 100',
      'Her heart rate',
      'Not sure',
    ]),
  ],

  'app-pro': [
    ease('app-pro-ease', 'How easy was it to tell which student to see first?'),
    choice('app-pro-order', 'The caseload is ordered by:', [
      'How fast a student is changing',
      'Highest score first',
      'Alphabetical order',
      'Not sure',
    ]),
  ],

  check: [
    ease('check-ease', 'How easy was the check-in to complete?'),
    choice('check-length', 'The length of the check-in was:', [
      'Too short',
      'About right',
      'Too long',
    ]),
  ],

  privacy: [
    agree('privacy-trust', 'I would trust this product with a student’s data.'),
    choice('privacy-never', 'Which of these is never shared with a parent?', [
      'Where the student was',
      'Whether the patch was worn',
      'Whether a day was above their usual',
      'Not sure',
    ]),
  ],

  tour: [
    agree('tour-built', 'The tour made it clear what has actually been built.'),
    choice('tour-length', 'The tour length was:', [
      'Too short',
      'About right',
      'Too long',
    ]),
  ],

  /* Everything written is collected here, once, at the end. The three
     agreement items are UMUX-Lite's capability/ease pair plus a recommendation
     item — the shortest set that still reports like a standard score. */
  final: [
    agree('final-needs',   'MindMap’s features meet what a school would need.'),
    agree('final-easy',    'MindMap is easy to use.'),
    agree('final-recommend', 'I would be comfortable recommending this to a school.'),
    {
      id: 'final-stars',
      kind: 'stars',
      prompt: 'Taking the whole site together, how would you rate it?',
      max: 5,
      step: 0.5,
    },
    {
      id: 'final-impact',
      kind: 'impact',
      optional: true,
      prompt: 'If this existed and schools used it, how much difference could it make?',
      points: pts(
        'None at all',
        'A little, for a few people',
        'A real difference for some',
        'A large difference',
        'It would change how schools work'
      ),
      sentence: {
        prompt: 'If you want to say why — one sentence.',
        placeholder: 'It would matter most because…',
        maxLength: 240,
      },
    },
    {
      id: 'final-change',
      kind: 'text',
      prompt: 'Anything that confused you, or that you would change?',
      placeholder: 'The thing I kept tripping over was…',
      maxLength: 400,
    },
  ],
}

/* The page names, beside the questions rather than in the page that reports
   them: they were kept in Responses.jsx, so adding a route meant editing two
   files and the second one was the one that got forgotten — which is how a
   live route ended up labelled with its own id. */
const PAGE_LABEL = {
  site: 'Overview', patch: 'The patch',
  student: 'For students', parent: 'For parents', pro: 'For schools',
  app: 'Launch the app',
  'app-student': 'Student screen', 'app-parent': 'Parent screen',
  'app-pro': 'Counselor console',
  check: 'Take a reading', privacy: 'Who can see what', tour: 'The tour',
  final: 'Last questions',
}

/* Routes that no longer exist. Answers recorded against them are still in
   reviewers' browsers and still in the store, and they have to read as English
   on the responses page rather than as a bare id — deleting a route does not
   delete the answers somebody already gave. */
const RETIRED_LABEL = {
  hub: 'Open the app — retired',
}

export function pageLabel(page) {
  return PAGE_LABEL[page] || RETIRED_LABEL[page] || page
}

export function questionsFor(page) {
  return QUESTIONS[page] || []
}

export function questionText(page, qid) {
  const q = (QUESTIONS[page] || []).find(x => x.id === qid)
  return q ? q.prompt : qid
}
