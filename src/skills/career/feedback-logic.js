/* Feedback Notes: turning a note into one skill. Pure functions.
 *
 * The skill suggestions come from plain keyword matching on the words of
 * the note. They are suggestions to pick from, not a reading of anybody. */

export const SKILLS = [
  { name:'Checking my work',       words:['typo', 'typos', 'mistake', 'mistakes', 'error', 'errors', 'careless', 'detail', 'details', 'proofread', 'sloppy', 'spelling', 'double check', 'check your'] },
  { name:'Hitting deadlines',      words:['late', 'deadline', 'deadlines', 'on time', 'due', 'missed', 'rushed', 'last minute', 'slow'] },
  { name:'Speaking up',            words:['quiet', 'speak up', 'participate', 'participation', 'voice', 'shy', 'share more', 'ask questions', 'louder'] },
  { name:'Explaining clearly',     words:['confusing', 'unclear', 'clear', 'explain', 'organized', 'organised', 'structure', 'rambling', 'vague', 'hard to follow'] },
  { name:'Tone with others',       words:['rude', 'tone', 'attitude', 'polite', 'respectful', 'interrupt', 'interrupting', 'harsh', 'snappy', 'eye roll'] },
  { name:'Following instructions', words:['instructions', 'directions', 'rubric', 'requirements', 'asked you to', 'read the', 'prompt'] },
  { name:'Working as a team',      words:['team', 'teammates', 'group', 'share the', 'collaborate', 'others', 'help out'] },
  { name:'Taking initiative',      words:['initiative', 'proactive', 'waited', 'waiting', 'effort', 'step up', 'without being asked'] },
]

export const FEELINGS = [
  'I am bad at this', 'They do not like me', 'I am going to fail', 'Everyone saw',
  'It is not fair', 'I want to quit',
]

export const FROM = ['Teacher', 'Coach', 'Manager', 'Teammate', 'Customer', 'Parent']

export const NEXT_STEPS = [
  { id:'ask',      label:'Ask one question to understand it' },
  { id:'practise', label:'Practise it once, on purpose' },
  { id:'show',     label:'Show them the next version' },
  { id:'watch',    label:'Watch how someone good does it' },
]

export function splitSentences(text) {
  return (String(text || '').match(/[^.!?\n]+[.!?]*/g) || []).map(s => s.trim()).filter(Boolean)
}

/* Skill names the note's words point at, most hits first. */
export function suggestSkills(text) {
  const t = ' ' + String(text || '').toLowerCase().replace(/[^a-z' ]+/g, ' ') + ' '
  return SKILLS
    .map((s, order) => ({ name:s.name, order, hits: s.words.filter(w => t.includes(' ' + w + ' ') || t.includes(' ' + w)).length }))
    .filter(s => s.hits > 0)
    .sort((a, b) => b.hits - a.hits || a.order - b.order)
    .map(s => s.name)
}

/* notes: [{ skill, practised }] -> [{ skill, count, practised }] */
export function groupSkills(notes = []) {
  const m = new Map()
  for (const n of notes) {
    if (!n || !n.skill) continue
    const g = m.get(n.skill) || { skill:n.skill, count:0, practised:0 }
    g.count++
    if (n.practised) g.practised++
    m.set(n.skill, g)
  }
  return [...m.values()].sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill))
}

export function clarifyScript(what) {
  const w = String(what || '').trim() || 'my work'
  return `Thanks for the feedback on ${w}. To make sure I get it right next time, could you show me one example of what good looks like?`
}

/* A warm up round: is a line about the work (something you can see, check
   or change) or a judgement about the person? Five lines, one right answer
   each. The why always points at the useful part. */
const W = (id, prompt, work, why) => ({ id, prompt, why, fixed:true,
  options:[{ id:'work', text:'About the work', ok:work }, { id:'me', text:'A judgement about me', ok:!work }] })
export const WARMUP = [
  W('units', 'Three answers were missing their units.', true, 'You can check it and change it next time. That is a fact about the work.'),
  W('careless', 'You are just careless.', false, 'This is a label you cannot check. Ask what exactly was careless. That part is useful.'),
  W('late', 'The report came in two days late.', true, 'A fact you can plan around. It says nothing about who you are.'),
  W('care', 'You clearly do not care about this class.', false, 'A guess about your feelings. Ask what they saw that made them think so.'),
  W('intro', 'The intro does not say what the essay will argue.', true, 'Specific and fixable: add one sentence that says your argument.'),
]
