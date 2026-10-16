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

/* The third audience. One name for them, everywhere: never "medical professional",
   "school", "clinician" or "staff" in copy a visitor reads. */
export const PRO = 'Medical Professional'
export const PRO_LC = 'medical professional'
export const PRO_PLURAL = 'Medical Professionals'
export const PRO_PLURAL_LC = 'medical professionals'
export const PRO_FOR = 'For Medical Professionals'

/* Their view. Never "ranked", never "instability", never a leaderboard. */
export const CASELOAD_TITLE = 'Students to check in with'
export const CASELOAD_DEF = 'Whose Mind Score moved most since last week.'

/* Consent, in this order: a guardian opens the account, then the student
   chooses per audience. Nothing is shared by default. */
export const CONSENT_SHORT = 'A guardian opens the account. The student chooses what is shared.'
export const CONSENT_OFF = 'The student can switch any of it off at any time.'
