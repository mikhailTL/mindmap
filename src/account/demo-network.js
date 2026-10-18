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
 *
 * The reader of the demo is never one of these names: the Student, Parent or
 * Counselor demo calls its reader by the role word (./viewer.js).
 *
 * Pictures, by role (owner, 18 October): teens have animals, parents have
 * initials (Rosa has a photo), Counselors/Professionals have photos. The
 * photos are crops of the licensed stock frames in src/lib/photos.js.
 */

import { CASELOAD, FAMILY } from '../lib/roster.js'
import { ANIMALS, CATALOG, initialsOf } from './avatar-catalog.js'

export const DEMO_TEEN = { id: 'demo-student', name: 'Maya', role: 'student', avatar: 'fox' }
/* Her surname, shown where a Counselor/Professional lists her beside other
   teens with theirs (owner, 18 October). Her parent calls her Maya. */
const MAYA_LAST = 'Reyes'
const FACE_IDS = CATALOG.filter(c => c.kind === 'face').map(c => c.id)

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
    person: { id: 'demo-p1', name: 'Elena', role: 'parent', avatar: 'initials-E' },
    shares: ['score', 'week', 'sleep'], teenOk: true, parentOk: true },
  { id: 'demo-pro', status: 'active', since: '20 Sep',
    person: { id: 'demo-p2', name: 'Dr. Shah', role: 'pro', avatar: 'photo-counselor-a', setting: 'School' },
    shares: proShares(MAYA_RECORD.consent), teenOk: true, parentOk: true },
  { id: 'demo-request', status: 'pending', since: 'Yesterday',
    person: { id: 'demo-p3', name: 'Ms. Okafor', role: 'pro', avatar: 'photo-counselor-b', setting: 'Private practice' },
    shares: ['score', 'trends', 'raw', 'settle'], teenOk: false, parentOk: false },
]

export const demoCounts = (links = DEMO_LINKS) => ({
  linked: links.filter(l => l.status === 'active').length,
  waiting: links.filter(l => l.status === 'pending').length,
})

/* Dr. Shah's network: one row per caseload teen. Maya's row has no shares of
   its own; the screen reads them from her 'demo-pro' link above, so her
   switches change what Dr. Shah sees. */
/* Every teen a different drawing (owner, 18 October: "all should have
   different profile pics"): the animals first, then the faces. The fox
   stays Maya's. */
const TEEN_ART = [...ANIMALS.filter(a => a !== DEMO_TEEN.avatar), ...FACE_IDS]
const others = CASELOAD.filter(t => t !== MAYA_RECORD)
export const DEMO_CASELOAD = Object.freeze(CASELOAD.map(t => t === MAYA_RECORD
  ? { id: 'demo-pro', teenId: t.id, person: { ...DEMO_TEEN, name: `${DEMO_TEEN.name} ${MAYA_LAST}` },
      code: t.pseudonym, grade: t.grade, maya: true }
  : { id: 'demo-case-' + t.id, teenId: t.id,
      person: { id: 'demo-' + t.id, name: t.name, role: 'student',
        avatar: TEEN_ART[others.indexOf(t) % TEEN_ART.length] },
      code: t.pseudonym, grade: t.grade, shares: proShares(t.consent) }))

/* Parents who also linked to Dr. Shah. Every teen's link had a parent's OK;
   these are the parents who joined the network themselves. */
const PARENT_NAMES = ['Rosa', 'Daniel', 'Priya', 'Marcus', 'Helen', 'Sam', 'Ines', 'Tom']
export const DEMO_PRO_PARENTS = Object.freeze([
  { id: 'demo-parent', person: DEMO_LINKS[0].person, of: 'demo-pro', ofName: DEMO_TEEN.name },
  ...DEMO_CASELOAD.filter((r, i) => !r.maya && i % 3 === 0).slice(0, PARENT_NAMES.length).map((r, i) => ({
    id: 'demo-pp-' + r.teenId, of: r.id, ofName: r.person.name.split(' ')[0],
    person: { id: 'demo-pp-' + r.teenId, name: PARENT_NAMES[i], role: 'parent',
      avatar: i === 0 ? 'photo-parent-a' : 'initials-' + initialsOf(PARENT_NAMES[i]) },
  })),
])

/* The settings page's "Your people" for each side of the demo: who, how many
   linked and how many waiting. */
export function demoSide(role) {
  if (role === 'parent') {
    const pros = DEMO_LINKS.filter(l => l.person.role === 'pro')
    return {
      people: [...FAMILY.map(t => ({ id: 'demo-' + t.id, name: t.first, role: 'student', avatar: t.avatar })),
        ...pros.map(l => l.person)],
      linked: FAMILY.length + pros.filter(l => l.status === 'active').length,
      waiting: pros.filter(l => l.status === 'pending').length,
    }
  }
  if (role === 'pro') {
    return {
      people: [...DEMO_CASELOAD.slice(0, 3).map(r => r.person), ...DEMO_PRO_PARENTS.slice(1, 2).map(p => p.person)],
      linked: DEMO_CASELOAD.length + DEMO_PRO_PARENTS.length,
      waiting: 0,
    }
  }
  const c = demoCounts()
  return { people: DEMO_LINKS.map(l => l.person), linked: c.linked, waiting: c.waiting }
}
