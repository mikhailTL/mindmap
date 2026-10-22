import { describe, expect, it } from 'vitest'
import * as Q from '../src/survey/questions.js'
import {
  AGREE, CLEAR, ALL_ITEMS, REQUIRED, SECTIONS,
  DEMOGRAPHIC_ITEMS, SCALE_ITEMS, BLOCKER_ITEM, OPEN_ITEMS, STARS_ITEM,
  TOP_BOX, SCALE_MAX, summariseItem, ratedAnswered,
  questionNumber, questionText, itemById,
} from '../src/survey/questions.js'
import { fields, FIELD_IDS, payload } from '../src/survey/mail.js'

const ids = list => list.map(q => q.id)
const prompts = list => list.map(q => q.prompt)
const labels = item => item.points.map(p => p.label)

describe('the old instrument is gone and nothing replaced its benchmark', () => {
  it('exports no scale, no composite score and no grade', () => {
    expect(Q.SUS_ITEMS).toBeUndefined()
    expect(Q.susScore).toBeUndefined()
    expect(Q.susGrade).toBeUndefined()
    expect(Q.BENCHMARK).toBeUndefined()
  })

  it('exports nothing whose name suggests a composite or a benchmark', () => {
    const offending = Object.keys(Q).filter(k =>
      /sus|benchmark|grade|composite|percentile|curve/i.test(k))
    expect(offending).toEqual([])
  })

  it('exports no numeric 68 under any name', () => {
    const sixtyEights = Object.entries(Q).filter(([, v]) => v === 68)
    expect(sixtyEights).toEqual([])
  })

  it('asks no question carried over from the retired scale', () => {
    for (const q of ALL_ITEMS) expect(q.id.startsWith('sus-')).toBe(false)
    for (const id of ['sus-1', 'sus-5', 'sus-10']) expect(itemById(id)).toBeNull()
  })

  it('offers per-item scoring only', () => {
    expect(typeof summariseItem).toBe('function')
    expect(typeof ratedAnswered).toBe('function')
    const fns = Object.entries(Q).filter(([, v]) => typeof v === 'function').map(([k]) => k)
    expect(fns.sort()).toEqual(
      ['itemById', 'pageLabel', 'questionNumber', 'questionText', 'ratedAnswered', 'summariseItem'])
  })
})

describe('no question is the negative mirror of another', () => {
  it('asks fifteen questions, each one once', () => {
    expect(ALL_ITEMS).toHaveLength(15)
    expect(new Set(ids(ALL_ITEMS)).size).toBe(15)
    expect(new Set(prompts(ALL_ITEMS)).size).toBe(15)
  })

  it('pins the ask order, so an insertion is deliberate', () => {
    expect(ids(ALL_ITEMS)).toEqual([
      'who-age', 'who-role', 'who-school',
      'use-easy', 'sentence-clear', 'use-again',
      'trust-parent', 'trust-clinician', 'would-recommend',
      'stars', 'blocker',
      'open-like', 'open-use', 'open-improve', 'open-other',
    ])
  })

  it('carries no direction, tone or reversal marker on any item', () => {
    for (const q of ALL_ITEMS) {
      expect(q.sus).toBeUndefined()
      expect(q.tone).toBeUndefined()
      expect(q.reverse).toBeUndefined()
      expect(q.negative).toBeUndefined()
    }
  })

  it('uses none of the retired negative phrasings', () => {
    const banned = [
      'unnecessarily complex', 'too complex', 'awkward', 'inconsistency',
      'help from someone technical', 'needed to learn a lot',
    ]
    const all = prompts(ALL_ITEMS).join(' · ').toLowerCase()
    for (const phrase of banned) expect(all).not.toContain(phrase)
  })

  it('has no free-text prompt', () => {
    expect(itemById('change')).toBeNull()
    expect(itemById('impact')).toBeNull()
    const all = prompts(ALL_ITEMS).join(' ').toLowerCase()
    expect(all).not.toContain('what to fix')
    expect(all).not.toContain('what would you change')
  })
})

describe('the demographics block', () => {
  it('asks exactly three questions: age, role and education', () => {
    expect(ids(DEMOGRAPHIC_ITEMS)).toEqual(['who-age', 'who-role', 'who-school'])
    for (const q of DEMOGRAPHIC_ITEMS) {
      expect(q.kind).toBe('scale')
      expect(REQUIRED).toContain(q)
      expect(q.optional).toBeUndefined()
    }
  })

  it('lets every one of them be refused', () => {
    for (const q of DEMOGRAPHIC_ITEMS) {
      expect(labels(q)).toContain('Rather not say')
    }
  })

  it('asks age as bands only', () => {
    const age = itemById('who-age')
    expect(labels(age)).toEqual([
      '19 or younger', '20 to 29', '30 to 44', '45 to 59', '60 or older', 'Rather not say',
    ])
    const text = (age.prompt + ' ' + labels(age).join(' ')).toLowerCase()
    for (const bad of ['date of birth', 'birthday', 'born', 'how old are you', 'exact age']) {
      expect(text).not.toContain(bad)
    }
    /* No free entry: a band list cannot take a typed number. */
    expect(age.kind).toBe('scale')
    expect(age.maxLength).toBeUndefined()
  })

  it('does not make anyone state that they are under 18', () => {
    const all = DEMOGRAPHIC_ITEMS
      .flatMap(q => [q.prompt, ...labels(q)])
      .join(' · ')
      .toLowerCase()
    for (const bad of ['under 18', 'under eighteen', '17 or younger', '13 to 17', 'minor']) {
      expect(all).not.toContain(bad)
    }
    const youngest = labels(itemById('who-age'))[0]
    expect(youngest).toBe('19 or younger')
  })

  it('covers the five roles', () => {
    const role = labels(itemById('who-role')).join(' | ').toLowerCase()
    expect(role).toContain('student')
    expect(role).toContain('parent')
    expect(role).toContain('teacher')
    expect(role).toContain('counselor')
    expect(role).toContain('something else')
  })

  it('asks education as steps a student can answer', () => {
    const school = labels(itemById('who-school'))
    expect(school[0]).toBe('Still in school')
    expect(school.length).toBeGreaterThanOrEqual(5)
    expect(school).toContain('Rather not say')
  })
})

describe('what the survey is allowed to collect', () => {
  it('ends with the four short written answers, all optional and capped', () => {
    const texts = ALL_ITEMS.filter(q => q.kind === 'text')
    expect(texts).toEqual(OPEN_ITEMS)
    expect(ALL_ITEMS.slice(-4)).toEqual(OPEN_ITEMS)
    expect(prompts(OPEN_ITEMS)).toEqual([
      'What do you like about MindMap?',
      'How would you use MindMap?',
      'What improvements would you like to see in MindMap?',
      'Any other feedback or questions?',
    ])
    for (const q of OPEN_ITEMS) {
      expect(q.optional).toBe(true)
      expect(q.maxLength).toBeGreaterThan(0)
      expect(q.maxLength).toBeLessThanOrEqual(500)
      expect(REQUIRED).not.toContain(q)
    }
    expect(OPEN_ITEMS.filter(q => q.important)).toEqual([OPEN_ITEMS[0]])
  })

  it('asks for no name, email, phone, address or birth date', () => {
    const everything = ALL_ITEMS
      .flatMap(q => [q.prompt, q.placeholder || '', ...(q.points ? labels(q) : [])])
      .join(' · ')
      .toLowerCase()
    for (const bad of [
      'your name', 'e-mail', 'email', 'phone', 'address',
      'date of birth', 'birthday', 'which school', 'what school',
    ]) {
      expect(everything).not.toContain(bad)
    }
  })

  it('makes every question but the written answers compulsory', () => {
    expect(REQUIRED).toHaveLength(ALL_ITEMS.length - OPEN_ITEMS.length)
    for (const q of OPEN_ITEMS) expect(ids(REQUIRED)).not.toContain(q.id)
  })
})

describe('the rated items', () => {
  it('are six, all on a five-point scale, none of them a band', () => {
    expect(SCALE_ITEMS).toHaveLength(6)
    expect(ids(SCALE_ITEMS)).toEqual([
      'use-easy', 'sentence-clear', 'use-again',
      'trust-parent', 'trust-clinician', 'would-recommend',
    ])
    for (const q of SCALE_ITEMS) {
      expect(q.kind).toBe('scale')
      expect(q.rated).toBe(true)
      expect(q.points).toHaveLength(SCALE_MAX)
      expect(q.points.map(p => p.value)).toEqual([1, 2, 3, 4, 5])
    }
  })

  it('exclude the demographics, the blocker, the rating and the written answers', () => {
    for (const q of [...DEMOGRAPHIC_ITEMS, BLOCKER_ITEM, STARS_ITEM, ...OPEN_ITEMS]) {
      expect(SCALE_ITEMS).not.toContain(q)
      expect(q.rated).toBeUndefined()
    }
  })

  it('cover the four credibility questions', () => {
    const all = prompts(SCALE_ITEMS).join(' · ').toLowerCase()
    expect(all).toContain('would use mindmap regularly')
    expect(all).toContain('parent or guardian')
    expect(all).toContain('doctor or counselor')
    expect(all).toContain('sentence above the score')
    expect(BLOCKER_ITEM.prompt.toLowerCase()).toContain('stop you from using')
  })

  it('offer both five-point scales, each running negative to positive', () => {
    expect(AGREE.map(p => p.value)).toEqual([1, 2, 3, 4, 5])
    expect(AGREE.map(p => p.label)).toEqual(
      ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'])
    expect(CLEAR.map(p => p.value)).toEqual([1, 2, 3, 4, 5])
    expect(CLEAR.map(p => p.label)).toEqual(
      ['Not clear', 'Slightly clear', 'Fairly clear', 'Clear', 'Completely clear'])
    for (const q of SCALE_ITEMS) expect([AGREE, CLEAR]).toContain(q.points)
  })

  it('puts the top box at the top two points of five', () => {
    expect(TOP_BOX).toBe(4)
    expect(SCALE_MAX).toBe(5)
    expect(AGREE.filter(p => p.value >= TOP_BOX).map(p => p.label))
      .toEqual(['Agree', 'Strongly agree'])
    expect(CLEAR.filter(p => p.value >= TOP_BOX).map(p => p.label))
      .toEqual(['Clear', 'Completely clear'])
  })
})

describe('summariseItem', () => {
  it('returns null rather than zero when nothing was answered', () => {
    expect(summariseItem([])).toBeNull()
    expect(summariseItem(null)).toBeNull()
    expect(summariseItem([null, null])).toBeNull()
    expect(summariseItem(['4', 'Agree', undefined, NaN])).toBeNull()
  })

  it('counts only finite values inside the scale', () => {
    const s = summariseItem([1, 5, 0, 6, -2, 3.5, 'x', null])
    expect(s.n).toBe(3)
    expect(s.mean).toBe(3.17)
  })

  it('keeps the mean inside the scale for every input', () => {
    let seed = 20261013
    const next = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return 1 + (seed % 5) }
    for (let trial = 0; trial < 500; trial++) {
      const n = 1 + (next() % 9)
      const values = Array.from({ length: n }, next)
      const s = summariseItem(values)
      expect(s.n).toBe(n)
      expect(s.mean).toBeGreaterThanOrEqual(1)
      expect(s.mean).toBeLessThanOrEqual(SCALE_MAX)
      const raw = values.reduce((a, b) => a + b, 0) / n
      expect(s.mean).toBe(Math.round(raw * 100) / 100)
      expect(s.top).toBe(values.filter(v => v >= TOP_BOX).length)
      expect(s.share).toBe(s.top / n)
      expect(s.share).toBeGreaterThanOrEqual(0)
      expect(s.share).toBeLessThanOrEqual(1)
    }
  })

  it('scores a hand-worked response', () => {
    const s = summariseItem([5, 4, 4, 3, 2])
    expect(s.n).toBe(5)
    expect(s.mean).toBe(3.6)
    expect(s.top).toBe(3)
    expect(s.share).toBe(0.6)
  })

  it('puts the share at 1 only when everyone picked the top two', () => {
    expect(summariseItem([4, 4, 5, 5]).share).toBe(1)
    expect(summariseItem([1, 2, 3, 3]).share).toBe(0)
    expect(summariseItem([3, 4]).share).toBe(0.5)
  })

  it('reports a uniform response as the answer given, not as a midpoint', () => {
    for (const v of [1, 2, 3, 4, 5]) {
      const s = summariseItem([v, v, v, v])
      expect(s.mean).toBe(v)
      expect(s.share).toBe(v >= TOP_BOX ? 1 : 0)
    }
    const agree = AGREE.find(p => p.label === 'Agree').value
    expect(agree).toBe(4)
    expect(summariseItem([agree, agree, agree]).mean).toBe(4)
  })

  it('never reports a figure out of 100', () => {
    for (const values of [[5, 5, 5], [1], [3, 4, 5, 2]]) {
      const s = summariseItem(values)
      expect(s.mean).toBeLessThanOrEqual(SCALE_MAX)
      expect(Object.keys(s).sort()).toEqual(['mean', 'n', 'share', 'top'])
    }
  })
})

describe('ratedAnswered', () => {
  const filled = extra => new Map([...SCALE_ITEMS.map(q => [q.id, 4]), ...(extra || [])])

  it('counts nothing on an empty response', () => {
    expect(ratedAnswered(new Map())).toBe(0)
    expect(ratedAnswered(undefined)).toBe(0)
  })

  it('counts every rated item when all are answered', () => {
    expect(ratedAnswered(filled())).toBe(SCALE_ITEMS.length)
  })

  it('counts a partial response exactly, and ignores anything not a rated item', () => {
    for (const item of SCALE_ITEMS) {
      const partial = filled()
      partial.delete(item.id)
      expect(ratedAnswered(partial), `missing ${item.id}`).toBe(SCALE_ITEMS.length - 1)
    }
    const decoys = filled([['stars', 5], ['who-age', 1], ['blocker', 2], ['not-a-question', 4]])
    expect(ratedAnswered(decoys)).toBe(SCALE_ITEMS.length)
  })
})

describe('sections', () => {
  it('reach every item exactly once, in ask order', () => {
    expect(SECTIONS.flatMap(s => s.items)).toEqual(ALL_ITEMS)
    expect(SECTIONS.map(s => s.id)).toEqual(['background', 'using', 'trust', 'overall', 'written'])
  })

  it('are titled as plain noun phrases', () => {
    const banned = /\b(it|its|this|that|thing|things|anything|nothing|stuff|something|everything|you|your|my|i)\b/i
    for (const s of SECTIONS) {
      expect(s.title.split(/\s+/).length).toBeLessThanOrEqual(8)
      expect(s.title, s.title).not.toMatch(banned)
      expect(s.title, s.title).not.toMatch(/[.!?]$/)
    }
  })

  it('tells the reader in the background section what is not collected', () => {
    const note = SECTIONS.find(s => s.id === 'background').note.toLowerCase()
    expect(note).toContain('bands')
    expect(note).toContain('no name')
    expect(note).toContain('no school')
  })
})

describe('questionNumber and questionText', () => {
  it('numbers 1 to 15 continuously across the whole survey, not per section', () => {
    expect(ALL_ITEMS.map(q => questionNumber(q.id)))
      .toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
    expect(new Set(ALL_ITEMS.map(q => questionNumber(q.id))).size).toBe(15)
  })

  it('returns null for an id the survey does not ask', () => {
    expect(questionNumber('sus-1')).toBeNull()
    expect(questionNumber('nps')).toBeNull()
    expect(questionNumber('not-a-question')).toBeNull()
  })

  it('still names every retired question so old answers stay readable', () => {
    expect(questionText('sus-1')).toBe('I think that I would want to use MindMap regularly.')
    expect(questionText('sus-2')).toBe('I found MindMap unnecessarily complex.')
    expect(questionText('sus-10'))
      .toBe('I needed to learn a lot of things before I could get going with MindMap.')
    expect(questionText('change')).toBe('What confused you, or what would you change?')
    expect(questionText('impact'))
      .toBe('If this were actually used, what difference would it make?')
    expect(questionText('nps')).toBe('How likely are you to recommend MindMap?')
    expect(questionText('about-age')).toBe('Your age range')
    expect(questionText('blocker-note')).toBe('If something would stop you, name it in a few words.')
    expect(itemById('blocker-note')).toBeNull()
    expect(questionText('never-asked')).toBe('never-asked')
  })

  it('names every live question from its own prompt', () => {
    for (const q of ALL_ITEMS) expect(questionText(q.id)).toBe(q.prompt)
  })
})

describe('the flat payload the endpoint stores', () => {
  const row = (questionId, value, label) => ({ questionId, value, label, visitorId: 'v-abcdef123456' })
  const sample = [
    row('who-age', '1', '19 or younger'),
    row('who-role', '2', 'Parent or guardian'),
    row('who-school', '5', 'Four-year degree'),
    row('use-easy', '5', 'Strongly agree'),
    row('sentence-clear', '4', 'Clear'),
    row('use-again', '3', 'Neutral'),
    row('trust-parent', '4', 'Agree'),
    row('trust-clinician', '2', 'Disagree'),
    row('would-recommend', '5', 'Strongly agree'),
    row('stars', '4.5', '4.5 of 5'),
    row('blocker', '3', 'Who else could see a reading'),
    row('open-like', 'the calm view', null),
    row('open-improve', 'more colours', null),
  ]

  it('carries one field per question, in ask order', () => {
    expect(FIELD_IDS).toEqual(ids(ALL_ITEMS))
    expect(Object.keys(fields(sample))).toEqual(FIELD_IDS)
  })

  it('sends the number for every rated question and the rating', () => {
    const f = fields(sample)
    for (const q of SCALE_ITEMS) expect(Number.isFinite(Number(f[q.id]))).toBe(true)
    expect(f['use-easy']).toBe('5')
    expect(f['trust-clinician']).toBe('2')
    expect(f.stars).toBe('4.5')
  })

  it('sends the label for every band and for the blocker', () => {
    const f = fields(sample)
    expect(f['who-age']).toBe('19 or younger')
    expect(f['who-role']).toBe('Parent or guardian')
    expect(f['who-school']).toBe('Four-year degree')
    expect(f.blocker).toBe('Who else could see a reading')
    expect(f['open-like']).toBe('the calm view')
    expect(f['open-improve']).toBe('more colours')
    expect(f['open-use']).toBe('')
  })

  it('leaves an unanswered question blank rather than zero', () => {
    const f = fields([row('use-easy', '5', 'Strongly agree')])
    expect(f['use-easy']).toBe('5')
    for (const id of FIELD_IDS.filter(x => x !== 'use-easy')) expect(f[id]).toBe('')
  })

  it('sends no name, in the subject or anywhere else', () => {
    const p = payload(sample)
    expect(p.name).toBeUndefined()
    expect(p.visitorName).toBeUndefined()
    expect(p.respondent).toBe('123456')
    expect(p._subject).toBe('MindMap feedback: 123456')
    const flat = JSON.stringify(p).toLowerCase()
    expect(flat).not.toContain('anonymous')
  })
})
