/* The site's vocabulary, in one place.
 *
 * A tester asked for the daily number to have a name the way an Oura ring has
 * a readiness score, so that every screen can refer to the same thing without
 * re-explaining it. Before this it was "one score", "one number a day", "the
 * score" and "today's score" depending on which file you were reading.
 *
 * Use these strings. Do not invent a second name for the same thing. */

/* The daily number, 0 to 100, read against the student's own baseline. */
export const SCORE = 'Mind Score'
export const SCORE_LC = 'Mind Score'          // it is a proper noun mid-sentence too
export const SCORE_RANGE = '0 to 100'
export const SCORE_DEF =
  'One number a day, 0 to 100, measured against your own normal rather than anybody else’s.'

/* Two privacy rows testers found vague. "Anything they wrote" and "where they
   were" both read as surveillance categories rather than as features. */
export const NOTES = 'Notes'
export const NOTES_DEF = 'What a student writes in their own journal.'
export const LOCATION = 'Location'

/* The counselor view.
 *
 * It was "a caseload ranked by who is changing fastest", which two testers read
 * as students being ranked by how unstable they are. The list has not changed;
 * what it is for has to be what it says. It is a short list of the students
 * whose Mind Score moved most this week, and it exists so that a counselor
 * knows who to check in with first. Never "ranked", never "instability",
 * never a leaderboard. */
export const CASELOAD_TITLE = 'Who to check in with this week'
export const CASELOAD_DEF =
  'The students whose Mind Score moved most since last week, so a check-in starts with the biggest change.'

/* The consent model, said the same way everywhere.
 *
 * Two different claims were on the site at once: that the student decides what
 * leaves their phone, and that a guardian agrees to share trends. Both are
 * true and the order matters. A guardian opens the account because the student
 * is a minor; after that the student chooses, per audience, what is shared, and
 * can switch any of it off. Nothing is shared by default. */
export const CONSENT_SHORT = 'A guardian opens the account. The student chooses what is shared.'
export const CONSENT_OFF = 'Any of it can be switched off by the student, at any time.'
