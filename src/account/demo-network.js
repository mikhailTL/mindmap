/* The demo network: Maya, 15, with her parent Elena and her school counselor
 * Dr. Shah linked, and one request waiting, from Ms. Okafor in private
 * practice. The same three names the calendar's demo card uses. Nobody here
 * is a real person, and the screen says so.
 *
 * `shares` holds the keys from SHARING in src/app/store.js that Maya has
 * switched on for that person's audience. A parent's list never holds more
 * than a day's figure, by the table itself.
 */

export const DEMO_TEEN = { id: 'demo-student', name: 'Maya', role: 'student', avatar: 'fox' }

export const DEMO_LINKS = [
  { id: 'demo-parent', status: 'active', since: '2 Sep',
    person: { id: 'demo-p1', name: 'Elena', role: 'parent', avatar: 'sym-flower' },
    shares: ['score', 'sleep'], teenOk: true, parentOk: true },
  { id: 'demo-pro', status: 'active', since: '20 Sep',
    person: { id: 'demo-p2', name: 'Dr. Shah', role: 'pro', avatar: 'sym-leaf', setting: 'School counselor' },
    shares: ['score', 'trends'], teenOk: true, parentOk: true },
  { id: 'demo-request', status: 'pending', since: 'Yesterday',
    person: { id: 'demo-p3', name: 'Ms. Okafor', role: 'pro', avatar: null, setting: 'Private practice' },
    shares: [], teenOk: false, parentOk: false },
]

export const demoCounts = (links = DEMO_LINKS) => ({
  linked: links.filter(l => l.status === 'active').length,
  waiting: links.filter(l => l.status === 'pending').length,
})
