// Demo network: Maya with her parent and counselor linked and one pending request. All names are invented.
import { CASELOAD, FAMILY } from '../lib/roster.js'
import { ANIMALS, avatarEntry } from './avatar-catalog.js'

const art = (name, or) => {
  const id = 'char-' + String(name).split(' ')[0].toLowerCase()
  return avatarEntry(id) ? id : or
}

export const DEMO_TEEN = { id: 'demo-student', name: 'Maya', role: 'student', avatar: 'char-maya' }
const MAYA_LAST = 'Reyes'

// The caseload record that stands for Maya on the counselor's screens.
const MAYA_RECORD = CASELOAD.find(t => t.grade === 10 && t.age === 15) || CASELOAD[0]

const proShares = consent => [
  ...['score', 'trends', 'raw'].filter(k => consent?.[k]),
  ...(consent?.score ? ['settle'] : []),
]

export const DEMO_LINKS = [
  { id: 'demo-parent', status: 'active', since: '2 Sep',
    person: { id: 'demo-p1', name: 'Elena', role: 'parent', avatar: 'char-elena' },
    shares: ['score', 'week', 'sleep'], teenOk: true, parentOk: true },
  { id: 'demo-pro', status: 'active', since: '20 Sep',
    person: { id: 'demo-p2', name: 'Dr. Shah', role: 'pro', avatar: 'char-shah', setting: 'School' },
    shares: proShares(MAYA_RECORD.consent), teenOk: true, parentOk: true },
  { id: 'demo-request', status: 'pending', since: 'Yesterday',
    person: { id: 'demo-p3', name: 'Ms. Okafor', role: 'pro', avatar: 'char-okafor', setting: 'Private practice' },
    shares: ['score', 'trends', 'raw', 'settle'], teenOk: false, parentOk: false },
]

export const demoCounts = (links = DEMO_LINKS) => ({
  linked: links.filter(l => l.status === 'active').length,
  waiting: links.filter(l => l.status === 'pending').length,
})

const others = CASELOAD.filter(t => t !== MAYA_RECORD)
export const DEMO_CASELOAD = Object.freeze(CASELOAD.map(t => t === MAYA_RECORD
  ? { id: 'demo-pro', teenId: t.id, person: { ...DEMO_TEEN, name: `${DEMO_TEEN.name} ${MAYA_LAST}` },
      code: t.pseudonym, grade: t.grade, maya: true }
  : { id: 'demo-case-' + t.id, teenId: t.id,
      person: { id: 'demo-' + t.id, name: t.name, role: 'student',
        avatar: art(t.first, ANIMALS[others.indexOf(t) % ANIMALS.length]) },
      code: t.pseudonym, grade: t.grade, shares: proShares(t.consent) }))

const PARENT_NAMES = ['Rosa', 'Daniel', 'Priya', 'Marcus', 'Helen', 'Sam', 'Ines', 'Tom']
export const DEMO_PRO_PARENTS = Object.freeze([
  { id: 'demo-parent', person: DEMO_LINKS[0].person, of: 'demo-pro', ofName: DEMO_TEEN.name },
  ...DEMO_CASELOAD.filter((r, i) => !r.maya && i % 3 === 0).slice(0, PARENT_NAMES.length).map((r, i) => ({
    id: 'demo-pp-' + r.teenId, of: r.id, ofName: r.person.name.split(' ')[0],
    person: { id: 'demo-pp-' + r.teenId, name: PARENT_NAMES[i], role: 'parent',
      avatar: art(PARENT_NAMES[i], null) },
  })),
])

export function demoSide(role) {
  if (role === 'parent') {
    const pros = DEMO_LINKS.filter(l => l.person.role === 'pro')
    return {
      people: [...FAMILY.map(t => ({ id: 'demo-' + t.id, name: t.first, role: 'student', avatar: art(t.first, t.avatar) })),
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
