/* The questions, one page at a time.
 *
 * The reason this is split by page rather than held as one form: a reviewer
 * who is asked "was the parent page clear?" forty minutes after leaving it is
 * answering from memory, and memory of a website is mostly a mood. Asked while
 * the page is still on screen, they answer about the page.
 *
 * Two rules the wording follows. Every scale point is a phrase, never a bare
 * number, because 3 out of 5 means nothing to the person picking it and less
 * to the person reading it back. And every question names the specific task
 * that page is supposed to support, so a low score points at a fix — "finding
 * what a parent can and cannot see was hard" is actionable, "this page was 2"
 * is not.
 */

/* Five phrases, easiest-last, so the scale runs the same direction everywhere.
 * A reviewer who learns the direction once should never have to re-read it. */
const pts = (...labels) => labels.map((label, i) => ({ value: i + 1, label }))

const EASE = pts('Impossible', 'Hard work', 'Doable', 'Easy', 'Immediate')
const CLARITY = pts('Lost me', 'Vague', 'Mostly clear', 'Clear', 'Unmistakable')

export const QUESTIONS = {
  site: [
    {
      id: 'site-what',
      kind: 'scale',
      prompt: 'Working out what MindMap actually is — a patch, an app, or both — from this page was…',
      points: CLARITY,
    },
    {
      id: 'site-pitch',
      kind: 'text',
      prompt: 'In one line, how would you describe this to a friend?',
      placeholder: 'It is a…',
      maxLength: 160,
    },
  ],

  patch: [
    {
      id: 'patch-measure',
      kind: 'scale',
      prompt: 'Understanding what the patch measures, and where on the body it sits, was…',
      points: CLARITY,
    },
    {
      id: 'patch-gap',
      kind: 'text',
      prompt: 'What did you still want to know about the hardware after reading this?',
      placeholder: 'Battery, how it sticks, what happens in the shower…',
      maxLength: 200,
    },
  ],

  student: [
    {
      id: 'student-control',
      kind: 'scale',
      prompt: 'Finding what a student can switch off, hide, or delete was…',
      points: EASE,
    },
    {
      id: 'student-first',
      kind: 'text',
      prompt: 'Which control on this page did you want to press first, and what did you expect it to do?',
      placeholder: 'I went for…, and I thought it would…',
      maxLength: 200,
    },
  ],

  parent: [
    {
      id: 'parent-visibility',
      kind: 'scale',
      prompt: 'Finding what a parent can and cannot see was…',
      points: EASE,
    },
    {
      id: 'parent-comfort',
      kind: 'text',
      prompt: 'Reading it as a parent, was there anything here you would not be comfortable with?',
      placeholder: 'What sat badly, or nothing did…',
      maxLength: 240,
    },
  ],

  pro: [
    {
      id: 'pro-purpose',
      kind: 'scale',
      prompt: 'Working out what a counselor is meant to do with this screen was…',
      points: CLARITY,
    },
    {
      id: 'pro-missing',
      kind: 'text',
      prompt: 'What would a counselor need here that this page does not give them?',
      placeholder: 'They would want…',
      maxLength: 200,
    },
  ],

  check: [
    {
      id: 'check-answerable',
      kind: 'scale',
      prompt: 'Getting through the check-in without having to guess what a question meant was…',
      points: EASE,
    },
    {
      id: 'check-hardest',
      kind: 'text',
      prompt: 'Which question in the check-in was hardest to answer honestly, and why?',
      placeholder: 'The one about…',
      maxLength: 200,
    },
  ],

  privacy: [
    {
      id: 'privacy-who',
      kind: 'scale',
      prompt: 'Reading who sees each reading — the student, a parent, the school — was…',
      points: CLARITY,
    },
    {
      id: 'privacy-delete',
      kind: 'text',
      prompt: 'After this page, what do you believe happens to a reading a student deletes?',
      placeholder: 'I think it…',
      maxLength: 200,
    },
  ],

  hub: [
    {
      id: 'hub-route',
      kind: 'scale',
      prompt: 'Getting from this screen to the part of the app you actually wanted was…',
      points: EASE,
    },
    {
      id: 'hub-misplaced',
      kind: 'text',
      prompt: 'Was anything here somewhere you would not have looked for it?',
      placeholder: 'I expected … to be under …',
      maxLength: 160,
    },
  ],

  tour: [
    {
      id: 'tour-order',
      kind: 'scale',
      prompt: 'Following where the tour took you next was…',
      points: EASE,
    },
    {
      id: 'tour-stop',
      kind: 'text',
      prompt: 'Where in the tour did you want it to slow down and let you look around?',
      placeholder: 'Around the part where…',
      maxLength: 160,
    },
  ],

  /* Asked once, at the end, inline — not as a floating card. The stars and the
   * impact question are about the whole project, so they cannot honestly be
   * asked from inside any single page. */
  final: [
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

/* The CSV needs the question a row answers, and the store must not carry a
 * copy of the wording — if the wording is edited, old rows should read as the
 * question now reads, not as a stale duplicate. */
export function questionText(page, qid) {
  const q = questionsFor(page).find(x => x.id === qid)
  return q ? q.prompt : qid
}
