import { describe, it, expect } from 'vitest'
import {
  parseTime, fmtTime, learnFactor, factorLine, adjust, splitTask, autoPlan, canMove,
  scheduleNight, minutesPastBed, nightLabel,
  SOURCE_QUESTIONS, scoreSource, SAMPLES, gradeSort,
  readiness, gutCheck, mistakeEntry,
  noteToCard, notesToCards, review, dueCards,
  buildQuestion, precision,
} from '../src/skills/school/logic.js'

describe('cram: time helpers', () => {
  it('parses and formats clock times', () => {
    expect(parseTime('21:30')).toBe(1290)
    expect(parseTime('7:05')).toBe(425)
    expect(parseTime('bad')).toBe(null)
    expect(fmtTime(1290)).toBe('9:30 pm')
    expect(fmtTime(0)).toBe('12:00 am')
    expect(fmtTime(1440 + 45)).toBe('12:45 am')
    expect(fmtTime(720)).toBe('12:00 pm')
  })
  it('labels nights from today', () => {
    expect(nightLabel(0, 2)).toBe('Tonight')
    expect(nightLabel(1, 2)).toBe('Tomorrow')
    expect(nightLabel(2, 2)).toBe('Thursday')
    expect(nightLabel(5, 5)).toBe('Wednesday')
  })
})

describe('cram: the estimate adjuster', () => {
  it('is 1 with no history', () => {
    expect(learnFactor([])).toEqual({ factor:1, n:0 })
  })
  it('learns from total actual over total guessed', () => {
    const r = learnFactor([{ est:30, actual:45 }, { est:60, actual:72 }])
    expect(r.n).toBe(2)
    expect(r.factor).toBeCloseTo(1.3, 5)
  })
  it('ignores bad rows, clamps, and only reads the last 10', () => {
    expect(learnFactor([{ est:0, actual:50 }, { est:10, actual:-1 }]).n).toBe(0)
    expect(learnFactor([{ est:10, actual:100 }]).factor).toBe(3)
    expect(learnFactor([{ est:100, actual:10 }]).factor).toBe(0.5)
    const old = Array.from({ length:5 }, () => ({ est:10, actual:30 }))
    const recent = Array.from({ length:10 }, () => ({ est:20, actual:20 }))
    expect(learnFactor([...old, ...recent]).factor).toBe(1)
  })
  it('says it in words', () => {
    expect(factorLine(1.3)).toMatch(/30% longer/)
    expect(factorLine(0.8)).toMatch(/20% less/)
    expect(factorLine(1.02)).toMatch(/about right/)
  })
  it('adjusts a guess and rounds up to 5 minutes', () => {
    expect(adjust(30, 1.3)).toBe(40)
    expect(adjust(20, 1)).toBe(20)
    expect(adjust(1, 0.5)).toBe(5)
  })
})

describe('cram: splitting and planning', () => {
  it('splits a long task into even parts of at most an hour', () => {
    const p = splitTask({ id:'a', name:'Essay', est:100, due:3 }, 1.3)
    expect(p.map(x => x.mins)).toEqual([45, 45, 40])
    expect(p.reduce((s, x) => s + x.mins, 0)).toBe(130)
    expect(p.length).toBe(3)
    expect(p.every(x => x.mins <= 60 && x.mins % 5 === 0)).toBe(true)
    expect(p[0]).toMatchObject({ taskId:'a', part:1, of:3, due:3 })
  })
  it('keeps a short task whole', () => {
    expect(splitTask({ id:'b', name:'Math', est:25, due:1 }, 1)).toHaveLength(1)
  })
  it('spreads work across nights before each due date, parts in order', () => {
    const pieces = [
      ...splitTask({ id:'e', name:'Essay', est:150, due:3 }, 1),
      ...splitTask({ id:'m', name:'Math', est:40, due:1 }, 1),
    ]
    const plan = autoPlan(pieces)
    const math = plan.find(x => x.taskId === 'm')
    expect(math.night).toBe(0)
    const essay = plan.filter(x => x.taskId === 'e')
    expect(essay.every(x => x.night <= 2)).toBe(true)
    for (let i = 1; i < essay.length; i++) expect(essay[i].night).toBeGreaterThanOrEqual(essay[i - 1].night)
    expect(new Set(essay.map(x => x.night)).size).toBeGreaterThan(1)
  })
  it('only moves a part inside its window and its order', () => {
    const plan = autoPlan(splitTask({ id:'e', name:'Essay', est:150, due:3 }, 1))
    const [a, b, c] = plan
    expect(canMove(a, -1, plan)).toBe(false)
    expect(canMove(c, 1, plan)).toBe(false)
    expect(canMove(b, 1, plan)).toBe(b.night < c.night)
  })
})

describe('cram: one night', () => {
  it('lays work into 50/10 blocks', () => {
    const r = scheduleNight([{ key:'x', label:'Essay', mins:60 }, { key:'y', label:'Math', mins:30 }], 960, '50/10')
    expect(r.segments.map(s => [s.kind, s.from, s.to])).toEqual([
      ['work', 960, 1010], ['break', 1010, 1020], ['work', 1020, 1030], ['work', 1030, 1060],
    ])
    expect(r.end).toBe(1060)
    expect(r.workMins).toBe(90)
  })
  it('runs straight through with no breaks', () => {
    expect(scheduleNight([{ key:'x', label:'A', mins:120 }], 960, 'none').end).toBe(1080)
  })
  it('measures time past bedtime, including after midnight', () => {
    expect(minutesPastBed(1380, 1200, 1350)).toBe(30)
    expect(minutesPastBed(1300, 1200, 1350)).toBe(-50)
    expect(minutesPastBed(1500, 1200, 30)).toBe(30)
  })
})

describe('sources', () => {
  const all = v => Object.fromEntries(SOURCE_QUESTIONS.map(q => [q.id, v]))
  it('has six checks', () => { expect(SOURCE_QUESTIONS).toHaveLength(6) })
  it('rates a fully checked source as solid', () => {
    const r = scoreSource(all('yes'))
    expect(r.level).toBe('strong')
    expect(r.pct).toBe(100)
    expect(r.flags).toEqual([])
  })
  it('never calls it solid without a second source', () => {
    expect(scoreSource({ ...all('yes'), second:'no' }).level).toBe('mixed')
  })
  it('calls it weak with no evidence and no second source', () => {
    expect(scoreSource({ ...all('yes'), evidence:'no', second:'no' }).level).toBe('weak')
    expect(scoreSource(all('no')).level).toBe('weak')
  })
  it('lists a next step for each flag', () => {
    const r = scoreSource({ ...all('yes'), when:'unsure' })
    expect(r.flags.map(f => f.id)).toEqual(['when'])
    expect(r.flags[0].next.length).toBeGreaterThan(10)
  })
  it('grades the practice sort', () => {
    const picks = Object.fromEntries(SAMPLES.map(s => [s.id, s.answer]))
    expect(gradeSort(picks).right).toBe(SAMPLES.length)
    picks[SAMPLES[0].id] = 'nope'
    expect(gradeSort(picks).right).toBe(SAMPLES.length - 1)
  })
})

describe('good enough', () => {
  it('is ready only when every must-have is done', () => {
    expect(readiness([]).ready).toBe(false)
    expect(readiness([{ done:true }, { done:false }])).toMatchObject({ done:1, total:2, pct:0.5, ready:false })
    expect(readiness([{ done:true }, { done:true }]).ready).toBe(true)
  })
  it('compares the gut to the checklist', () => {
    expect(gutCheck(40, 1).kind).toBe('doubt')
    expect(gutCheck(90, 0.5).kind).toBe('ahead')
    expect(gutCheck(60, 0.6).kind).toBe('agree')
  })
  it('makes a mistake into a data entry', () => {
    expect(mistakeEntry({ what:'  ', tells:'x', next:'y' })).toBe(null)
    expect(mistakeEntry({ what:' Lost points on units ', tells:'', next:'' }))
      .toMatchObject({ what:'Lost points on units', tells:'', next:'' })
  })
})

describe('active: notes to questions', () => {
  it('turns a term and definition into a question', () => {
    expect(noteToCard('Osmosis: water moving across a membrane')).toMatchObject({
      q:'What is osmosis?', a:'water moving across a membrane' })
  })
  it('uses the verb in an is or are line', () => {
    expect(noteToCard('Mitochondria are where cells make energy.')).toMatchObject({
      q:'What are mitochondria?', a:'where cells make energy' })
  })
  it('asks why for a because line', () => {
    expect(noteToCard('Leaves look green because chlorophyll reflects green light').q)
      .toBe('Why is it that leaves look green?')
  })
  it('blanks a year', () => {
    expect(noteToCard('The Treaty of Versailles was signed in 1919')).toMatchObject({
      q:'The Treaty of Versailles was signed in ____. Fill the blank.', a:'1919' })
  })
  it('falls back to a blank on the longest word', () => {
    const c = noteToCard('Photosynthesis happens in leaves')
    expect(c.a).toBe('Photosynthesis')
    expect(c.q).toMatch(/____/)
  })
  it('splits notes into lines and drops bullets and scraps', () => {
    const cards = notesToCards('- Osmosis: water moving\n* ok\n2. Enzymes are proteins that speed reactions. Heat changes them a lot')
    expect(cards.map(c => c.q)).toEqual(['What is osmosis?', 'What are enzymes?', expect.stringMatching(/____/)])
  })
})

describe('active: spaced recall', () => {
  const card = { id:'c', box:1, due:10 }
  it('moves up a box and waits longer when you got it', () => {
    expect(review(card, 'got', 10)).toMatchObject({ box:2, due:11 })
    expect(review({ ...card, box:4 }, 'got', 10)).toMatchObject({ box:5, due:24 })
    expect(review({ ...card, box:5 }, 'got', 10)).toMatchObject({ box:5, due:24 })
  })
  it('stays put for partly and resets for not yet', () => {
    expect(review({ ...card, box:3 }, 'partly', 10)).toMatchObject({ box:3, due:11 })
    expect(review({ ...card, box:3 }, 'not', 10)).toMatchObject({ box:1, due:10 })
  })
  it('lists due cards, lowest box first', () => {
    const cards = [{ id:'a', box:3, due:9 }, { id:'b', box:1, due:10 }, { id:'c', box:1, due:12 }]
    expect(dueCards(cards, 10).map(c => c.id)).toEqual(['b', 'a'])
  })
})

describe('active: question builder', () => {
  const full = { where:'Unit 3, problem 7', get:'how to set up the equation',
    stuck:'I have to move x to one side', tried:'redoing the class example', ask:'Why does the sign flip' }
  it('builds one precise question', () => {
    expect(buildQuestion(full)).toBe('On Unit 3, problem 7: I understand how to set up the equation. ' +
      'I get stuck when I have to move x to one side. I already tried redoing the class example. Why does the sign flip?')
  })
  it('scores precision and flags vague words', () => {
    expect(precision(full).score).toBe(5)
    const vague = precision({ ...full, stuck:'everything', ask:'help' })
    expect(vague.score).toBe(3)
    expect(vague.checks.filter(c => !c.ok).map(c => c.id)).toEqual(['stuck', 'ask'])
  })
  it('skips empty parts in the sentence', () => {
    expect(buildQuestion({ ask:'What is a mole?' })).toBe('What is a mole?')
  })
})
