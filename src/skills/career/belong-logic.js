export const STRENGTHS = [
  { id:'reliable',  name:'Reliable', trait:'reliable' },
  { id:'curious',   name:'Curious', trait:'curious' },
  { id:'explain',   name:'Explains things well', trait:'good at explaining things' },
  { id:'calm',      name:'Calm under pressure', trait:'calm under pressure' },
  { id:'creative',  name:'Creative', trait:'creative' },
  { id:'organised', name:'Organised', trait:'organised' },
  { id:'effort',    name:'Keeps going', trait:'someone who keeps going' },
  { id:'kind',      name:'Kind to teammates', trait:'kind to teammates' },
  { id:'learner',   name:'Learns fast', trait:'a fast learner' },
  { id:'detail',    name:'Good with details', trait:'good with details' },
  { id:'brave',     name:'Asks questions', trait:'not afraid to ask questions' },
  { id:'problem',   name:'Solves problems', trait:'good at solving problems' },
]
const NAME = Object.fromEntries(STRENGTHS.map(s => [s.id, s.name]))
const TRAIT = Object.fromEntries(STRENGTHS.map(s => [s.id, s.trait]))

export const WIN_PROMPTS = [
  'Something you fixed', 'A time someone asked you for help', 'A grade or score you earned',
  'Something you learned on your own', 'A time you kept going', 'Something you made',
]

// wins: [{ text, strengths: [id] }] -> [{ id, name, count, wins: [text] }]
export function topStrengths(wins = []) {
  const m = new Map()
  for (const w of wins) {
    for (const id of w?.strengths || []) {
      if (!NAME[id]) continue
      const g = m.get(id) || { id, name:NAME[id], trait:TRAIT[id], count:0, wins:[], order: STRENGTHS.findIndex(s => s.id === id) }
      g.count++
      g.wins.push(w.text)
      m.set(id, g)
    }
  }
  return [...m.values()].sort((a, b) => b.count - a.count || a.order - b.order)
    .map(({ order, ...g }) => g)
}

export const KINDS = [
  { id:'help',   label:'Ask for help' },
  { id:'credit', label:'Ask for credit' },
  { id:'chance', label:'Ask for a chance' },
]

// "Fixed the printer" -> "I fixed the printer"; text already starting with "I" is kept.
export function asFirstPerson(text) {
  const t = String(text || '').trim().replace(/[.!?]+$/, '')
  if (!t) return ''
  if (/^(I|I'm|I've|I'd)\b/.test(t)) return t
  return 'I ' + t[0].toLowerCase() + t.slice(1)
}

export const listOf = xs => xs.length < 2 ? (xs[0] || '') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1]

const or = (v, ph) => (v && String(v).trim()) || ph

export function advocacyScript({ kind = 'help', to, what, tried, when, strength, win } = {}) {
  const name = or(to, '[their name]')
  if (kind === 'credit') {
    return `Hi ${name}, I wanted to mention that I did ${or(what, '[the part you did]')} for this project. ` +
      'When we share it, could my name go on that part? I am happy to explain how I did it.'
  }
  if (kind === 'chance') {
    const did = win && win.trim() ? asFirstPerson(win) : ''
    const proof = did ? ` Recently ${did}` + (strength ? `, and I am ${strength}.` : '.') :
      (strength ? ` I am ${strength}.` : '')
    return `Hi ${name}, I would like to try ${or(what, '[the task]')}.${proof} ` +
      'Could I take it on, and check in with you after the first try?'
  }
  return `Hi ${name}, I am working on ${or(what, '[the task]')}. I have tried ${or(tried, '[what you tried]')}, ` +
    `and I am stuck on the next step. Could you spare ten minutes ${or(when, '[a time]')} to point me the right way?`
}

export const INITIATIVES = [
  'Ask one question in a meeting or class',
  'Offer to take notes for the group',
  'Volunteer for one small task nobody picked',
  'Introduce yourself to one new person',
  'Share one idea in writing before the meeting',
  'Ask for feedback on one piece of work',
]
