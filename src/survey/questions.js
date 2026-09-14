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

  student: [
    agree('student-control', 'I could tell what a student is able to share, hide, or delete.'),
    choice('student-useful', 'Which part of this screen was most useful?', [
      'The score for today',
      'The four signals behind it',
      'What gets shared',
      'None of them',
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
    ease('pro-ease', 'How easy was it to tell which student to see first?'),
    choice('pro-order', 'Students are ordered on this list by:', [
      'Highest score',
      'Fastest change week to week',
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
    choice('privacy-who', 'Who decides how long the data is kept?', [
      'The school',
      'The parent',
      'The student',
      'Not sure',
    ]),
  ],

  hub: [
    ease('hub-ease', 'How easy was it to pick the right view for you?'),
    choice('hub-first', 'Which view did you want to open first?', [
      'Student',
      'Parent',
      'School counselor',
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

export const SURVEY_PAGES = Object.keys(QUESTIONS).filter(p => p !== 'final')

export function questionsFor(page) {
  return QUESTIONS[page] || []
}

export function questionText(page, qid) {
  const q = (QUESTIONS[page] || []).find(x => x.id === qid)
  return q ? q.prompt : qid
}
