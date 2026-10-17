/* The demo network: Maya, 15, with her parent Elena and her Counselor/Professional
 * Dr. Shah linked, and one request waiting, from Ms. Okafor in private
 * practice. The same three names the calendar's demo card uses. Nobody here
 * is a real person, and the screen says so.
 *
 * `shares` holds the keys from SHARING in src/app/store.js that Maya has
 * switched on for that person's audience. Every switch starts on; Maya has
 * turned a few off for Elena. A parent's list never holds more than a day's
 * figure, by the table itself.
 *
 * Dr. Shah's side is the whole caseload from src/lib/roster.js, so the count
 * on the Counselor/Professional home and the list on the network screen agree.
 * Maya is one of those teens: the grade 10, age 15 record, which the
 * dashboards show by its student code like every other teen.
 */

import { CASELOAD } from '../lib/roster.js'

export const DEMO_TEEN = { id: 'demo-student', name: 'Maya', role: 'student', avatar: 'fox' }

/* The caseload record that stands for Maya on Dr. Shah's screens. */
const MAYA_RECORD = CASELOAD.find(t => t.grade === 10 && t.age === 15) || CASELOAD[0]

/* What a caseload teen shares with their Counselor/Professional, from the
   record's own consent so the network and the dashboards say the same. */
const proShares = consent => [
  ...['score', 'trends', 'raw'].filter(k => consent?.[k]),
  ...(consent?.score ? ['settle'] : []),
]

export const DEMO_LINKS = [
  { id: 'demo-parent', status: 'active', since: '2 Sep',
    person: { id: 'demo-p1', name: 'Elena', role: 'parent', avatar: 'sym-flower' },
    shares: ['score', 'week', 'sleep'], teenOk: true, parentOk: true },
  { id: 'demo-pro', status: 'active', since: '20 Sep',
    person: { id: 'demo-p2', name: 'Dr. Shah', role: 'pro', avatar: 'sym-leaf', setting: 'School' },
    shares: proShares(MAYA_RECORD.consent), teenOk: true, parentOk: true },
  { id: 'demo-request', status: 'pending', since: 'Yesterday',
    person: { id: 'demo-p3', name: 'Ms. Okafor', role: 'pro', avatar: null, setting: 'Private practice' },
    shares: ['score', 'trends', 'raw', 'settle'], teenOk: false, parentOk: false },
]

export const demoCounts = (links = DEMO_LINKS) => ({
  linked: links.filter(l => l.status === 'active').length,
  waiting: links.filter(l => l.status === 'pending').length,
})

/* Dr. Shah's network: one row per caseload teen. Maya's row has no shares of
   its own; the screen reads them from her 'demo-pro' link above, so her
   switches change what Dr. Shah sees. */
export const DEMO_CASELOAD = Object.freeze(CASELOAD.map(t => t === MAYA_RECORD
  ? { id: 'demo-pro', teenId: t.id, person: { ...DEMO_TEEN }, code: t.pseudonym, grade: t.grade, maya: true }
  : { id: 'demo-case-' + t.id, teenId: t.id, person: { id: 'demo-' + t.id, name: t.name, role: 'student', avatar: null },
      code: t.pseudonym, grade: t.grade, shares: proShares(t.consent) }))

/* Parents who also linked to Dr. Shah. Every teen's link had a parent's OK;
   these are the parents who joined the network themselves. */
const PARENT_NAMES = ['Rosa', 'Daniel', 'Priya', 'Marcus', 'Helen', 'Sam', 'Ines', 'Tom']
export const DEMO_PRO_PARENTS = Object.freeze([
  { id: 'demo-parent', person: DEMO_LINKS[0].person, of: 'demo-pro', ofName: DEMO_TEEN.name },
  ...DEMO_CASELOAD.filter((r, i) => !r.maya && i % 3 === 0).slice(0, PARENT_NAMES.length).map((r, i) => ({
    id: 'demo-pp-' + r.teenId, of: r.id, ofName: r.person.name.split(' ')[0],
    person: { id: 'demo-pp-' + r.teenId, name: PARENT_NAMES[i], role: 'parent', avatar: null },
  })),
])
