/* Product vocabulary lives in this one file so every screen says the same
   word. Do not add a second name for the same thing. */

/* The daily number, 0-100, against the student's own baseline. */
export const SCORE = 'Mind Score'
export const SCORE_LC = 'Mind Score'          // it is a proper noun mid-sentence too
export const SCORE_RANGE = '0 to 100'
export const SCORE_DEF =
  'One number a day, 0 to 100, measured against your own normal rather than anybody else’s.'

/* Privacy rows: name the feature, not the data category. */
export const NOTES = 'Notes'
export const NOTES_DEF = 'What a student writes in their own journal.'
export const LOCATION = 'Location'

/* Counselor view. Never "ranked", never "instability", never a leaderboard. */
export const CASELOAD_TITLE = 'Who to check in with this week'
export const CASELOAD_DEF =
  'The students whose Mind Score moved most since last week, so a check-in starts with the biggest change.'

/* Consent, in this order: a guardian opens the account, then the student
   chooses per audience. Nothing is shared by default. */
export const CONSENT_SHORT = 'A guardian opens the account. The student chooses what is shared.'
export const CONSENT_OFF = 'Any of it can be switched off by the student, at any time.'
