import { describe, it, expect } from 'vitest'
import { load, save, keyFor } from '../src/skills/career/store.js'
import { CLUSTERS, STATEMENTS, scoreClusters, pickQuestions, swapQuestion, outreachMessage,
         testPlanText } from '../src/skills/career/explore-logic.js'
import { buildEmail, checkEmail, starAnswer, speakingTime, wordCount, thankYouNote,
         followUpNote, PURPOSES } from '../src/skills/career/email-logic.js'
import { suggestSkills, splitSentences, groupSkills, clarifyScript, SKILLS } from '../src/skills/career/feedback-logic.js'
import { topStrengths, advocacyScript, asFirstPerson, listOf, STRENGTHS } from '../src/skills/career/belong-logic.js'

function memStore(init = {}) {
  const m = { ...init }
  return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v) }, m }
}
const broken = { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') } }

describe('store', () => {
  it('uses the mindmap.skills.<id> key', () => {
    expect(keyFor('career-email')).toBe('mindmap.skills.career-email')
  })
  it('round trips and merges over the fallback', () => {
    const s = memStore()
    expect(save('career-explore', { a: 1 }, s)).toBe(true)
    expect(load('career-explore', { a: 0, b: 2 }, s)).toEqual({ a: 1, b: 2 })
  })
  it('falls back on missing, corrupt or blocked storage', () => {
    expect(load('x', { a: 0 }, memStore())).toEqual({ a: 0 })
    expect(load('x', { a: 0 }, memStore({ 'mindmap.skills.x': '{nope' }))).toEqual({ a: 0 })
    expect(load('x', { a: 0 }, memStore({ 'mindmap.skills.x': '[1,2]' }))).toEqual({ a: 0 })
    expect(load('x', { a: 0 }, broken)).toEqual({ a: 0 })
    expect(save('x', { a: 1 }, broken)).toBe(false)
    expect(load('x', { a: 0 }, undefined)).toEqual({ a: 0 })
  })
})

describe('career explore', () => {
  it('every statement points at real clusters and every cluster is reachable', () => {
    const ids = new Set(CLUSTERS.map(c => c.id))
    const reached = new Set()
    for (const s of STATEMENTS) for (const c of s.to) { expect(ids.has(c)).toBe(true); reached.add(c) }
    expect(reached.size).toBe(ids.size)
  })
  it('every cluster has three experiments and at least two own questions', () => {
    for (const c of CLUSTERS) {
      expect(c.tests.length).toBe(3)
      expect(c.tests.map(t => t.kind)).toEqual(['taster', 'shadow', 'project'])
      expect(c.questions.length).toBeGreaterThanOrEqual(2)
    }
  })
  it('scores yes as 2, maybe as 1, no as 0, as a share of what was possible', () => {
    const answers = {}
    STATEMENTS.forEach((s, i) => { answers[i] = s.to.includes('create') ? 'yes' : 'no' })
    const out = scoreClusters(answers)
    expect(out[0].id).toBe('create')
    expect(out[0].pct).toBe(1)
    const tech = out.find(c => c.id === 'tech')
    expect(tech.score).toBe(0)
  })
  it('a maybe counts half', () => {
    const answers = {}
    STATEMENTS.forEach((s, i) => { answers[i] = s.to.includes('care') ? 'maybe' : 'no' })
    const care = scoreClusters(answers).find(c => c.id === 'care')
    expect(care.pct).toBe(0.5)
  })
  it('returns every cluster, sorted, even with no answers', () => {
    const out = scoreClusters({})
    expect(out.length).toBe(CLUSTERS.length)
    expect(out.every(c => c.pct === 0)).toBe(true)
  })
  it('picks n distinct questions, deterministic by seed, including the cluster own ones', () => {
    const a = pickQuestions('tech', 5, 3)
    const b = pickQuestions('tech', 5, 3)
    expect(a).toEqual(b)
    expect(new Set(a).size).toBe(5)
    const own = CLUSTERS.find(c => c.id === 'tech').questions
    expect(a.some(q => own.includes(q))).toBe(true)
  })
  it('swaps one question for one not already on the list', () => {
    const list = pickQuestions('care', 5, 1)
    const next = swapQuestion(list, 2, 'care', 1)
    expect(next.length).toBe(5)
    expect(next[2]).not.toBe(list[2])
    expect(new Set(next).size).toBe(5)
    expect(next.filter((q, i) => i !== 2)).toEqual(list.filter((q, i) => i !== 2))
  })
  it('builds an outreach message with placeholders where blank', () => {
    const blank = outreachMessage({})
    expect(blank).toContain('[their name]')
    expect(blank).toContain('[your name]')
    const m = outreachMessage({ theirName: 'Ms. Ortiz', myName: 'Sam', role: 'nursing',
      how: 'my coach Mr. Lee suggested I write to you' })
    expect(m.startsWith('Hi Ms. Ortiz,')).toBe(true)
    expect(m).toContain('My coach Mr. Lee suggested I write to you.')
    expect(m).toContain('exploring nursing')
    expect(m.trim().endsWith('Sam')).toBe(true)
    expect(m).not.toMatch(/[\u2013\u2014]/)
  })
  it('writes a one page test plan', () => {
    const t = testPlanText({ idea: 'Bake sale', who: 'Teachers', make: '20 cookies',
      measure: 'Sell 15', by: 'Friday', cost: '10' })
    expect(t).toContain('Bake sale')
    expect(t).toContain('Sell 15')
    expect(t).toContain('$10')
  })
})

describe('career email', () => {
  it('builds a greeting, the ask, the deadline and a sign-off', () => {
    const e = buildEmail({ purpose: 'meeting', toName: 'Dr. Patel', myName: 'Ana Ruiz',
      about: 'I am a junior at Riverview High', ask: 'a 15 minute call about lab work', deadline: 'Friday' })
    expect(e.subject.length).toBeGreaterThan(3)
    expect(e.body.startsWith('Dear Dr. Patel,')).toBe(true)
    expect(e.body).toContain('a 15 minute call about lab work')
    expect(e.body).toContain('Friday')
    expect(e.body.trim().endsWith('Ana Ruiz')).toBe(true)
    expect(checkEmail(e.body)).toEqual([])
  })
  it('every purpose builds a clean email', () => {
    for (const p of PURPOSES) {
      const e = buildEmail({ purpose: p.id, toName: 'Mr. Kim', myName: 'Jo', ask: 'help', deadline: '' })
      expect(checkEmail(e.body)).toEqual([])
      expect(e.body).not.toMatch(/[\u2013\u2014]/)
    }
  })
  it('flags texting habits', () => {
    const ids = checkEmail('hey can u send me the thing lol \u{1F600}').map(i => i.id)
    expect(ids).toEqual(expect.arrayContaining(['greeting', 'lowercase', 'slang', 'emoji', 'signoff']))
  })
  it('names the slang it found', () => {
    const slang = checkEmail('Hello Ms. Ray,\n\nidk if ur free tbh.\n\nThanks,\nKai').find(i => i.id === 'slang')
    expect(slang.label).toContain('idk')
    expect(slang.label).toContain('ur')
    expect(slang.label).toContain('tbh')
  })
  it('flags a lone lowercase i and text smileys and shouting', () => {
    const ids = checkEmail('Hello Sam,\n\ni think so :) !!\n\nThanks,\nKai').map(i => i.id)
    expect(ids).toEqual(expect.arrayContaining(['i', 'emoji', 'shout']))
  })
  it('flags too long', () => {
    const long = 'Hello Sam,\n\n' + 'This is a word. '.repeat(50) + '\n\nThanks,\nKai'
    expect(checkEmail(long).map(i => i.id)).toContain('length')
  })
  it('does not flag Hi or Good morning or Best regards', () => {
    expect(checkEmail('Good morning Ms. Ray,\n\nI hope you are well.\n\nBest regards,\nKai')).toEqual([])
    expect(checkEmail('Hi Ms. Ray,\n\nThank you for the tour.\n\nKai')).toEqual([])
  })
  it('an empty email has nothing to check', () => {
    expect(checkEmail('   ')).toEqual([])
  })
  it('joins a STAR answer and times it', () => {
    const a = starAnswer({ s: 'Our robot broke', t: 'I had to fix the arm.', a: 'I rebuilt it', r: 'We placed third' })
    expect(a).toBe('Our robot broke. I had to fix the arm. I rebuilt it. We placed third.')
    expect(wordCount(a)).toBe(15)
    expect(speakingTime(140)).toBe(60)
    expect(speakingTime(0)).toBe(0)
  })
  it('builds thank you and follow up notes', () => {
    const t = thankYouNote({ toName: 'Mr. Kim', topic: 'the shadow day', myName: 'Jo' })
    expect(t).toContain('Dear Mr. Kim,')
    expect(t).toContain('the shadow day')
    expect(checkEmail(t)).toEqual([])
    const f = followUpNote({ toName: 'Mr. Kim', topic: 'the internship', myName: 'Jo' })
    expect(checkEmail(f)).toEqual([])
  })
})

describe('career feedback', () => {
  it('splits sentences', () => {
    expect(splitSentences('Too many typos. Good ideas! Was it rushed?')).toEqual(['Too many typos.', 'Good ideas!', 'Was it rushed?'])
    expect(splitSentences('')).toEqual([])
  })
  it('suggests skills from the words of the note', () => {
    expect(suggestSkills('There were a lot of typos and careless mistakes')[0]).toBe('Checking my work')
    expect(suggestSkills('You turned it in late again')[0]).toBe('Hitting deadlines')
    expect(suggestSkills('Your slides were confusing and hard to follow')[0]).toBe('Explaining clearly')
    expect(suggestSkills('nothing matches here at all')).toEqual([])
  })
  it('every suggested skill is in the skill list', () => {
    for (const s of suggestSkills('late typo quiet confusing rude instructions team initiative')) {
      expect(SKILLS.map(k => k.name)).toContain(s)
    }
  })
  it('groups notes into skills, most first, counting practised', () => {
    const notes = [
      { skill: 'Speaking up', practised: true },
      { skill: 'Checking my work', practised: false },
      { skill: 'Checking my work', practised: true },
    ]
    expect(groupSkills(notes)).toEqual([
      { skill: 'Checking my work', count: 2, practised: 1 },
      { skill: 'Speaking up', count: 1, practised: 1 },
    ])
  })
  it('writes a clarifying question', () => {
    const s = clarifyScript('my lab report')
    expect(s).toContain('my lab report')
    expect(s).toMatch(/\?$/)
  })
})

describe('career belong', () => {
  it('ranks strengths by how many real wins show them', () => {
    const wins = [
      { text: 'Fixed the printer', strengths: ['problem', 'calm'] },
      { text: 'Led the group project', strengths: ['organised', 'problem'] },
      { text: 'Tutored my brother', strengths: ['explain'] },
    ]
    const top = topStrengths(wins)
    expect(top[0].id).toBe('problem')
    expect(top[0].count).toBe(2)
    expect(top[0].wins).toEqual(['Fixed the printer', 'Led the group project'])
    expect(top.every(t => STRENGTHS.some(s => s.id === t.id))).toBe(true)
  })
  it('ignores unknown strength ids', () => {
    expect(topStrengths([{ text: 'x', strengths: ['nope'] }])).toEqual([])
  })
  it('builds a script for help, credit and a chance', () => {
    const help = advocacyScript({ kind: 'help', to: 'Ms. Diaz', what: 'the budget sheet', tried: 'the tutorial', when: 'after lunch' })
    expect(help).toContain('Ms. Diaz')
    expect(help).toContain('the budget sheet')
    expect(help).toContain('the tutorial')
    const credit = advocacyScript({ kind: 'credit', to: 'Sam', what: 'the survey' })
    expect(credit).toContain('the survey')
    const chance = advocacyScript({ kind: 'chance', to: 'Coach', what: 'leading warm ups', win: 'ran the drill last week', strength: 'organised' })
    expect(chance).toContain('leading warm ups')
    expect(chance).toContain('ran the drill last week')
    expect(chance).toContain('organised')
    for (const s of [help, credit, chance]) expect(s).not.toMatch(/[\u2013\u2014]/)
  })
  it('reads as a sentence: a win in the first person, a strength as a trait', () => {
    expect(asFirstPerson('Fixed the printer.')).toBe('I fixed the printer')
    expect(asFirstPerson('I led the club')).toBe('I led the club')
    expect(asFirstPerson('')).toBe('')
    const top = topStrengths([{ text: 'x', strengths: ['problem'] }])
    expect(top[0].trait).toBe('good at solving problems')
    const s = advocacyScript({ kind: 'chance', to: 'Coach', what: 'it', win: 'Fixed the printer', strength: top[0].trait })
    expect(s).toContain('I fixed the printer, and I am good at solving problems.')
    expect(listOf(['a', 'b', 'c'])).toBe('a, b and c')
    expect(listOf(['a'])).toBe('a')
    expect(listOf([])).toBe('')
  })
  it('fills placeholders when blank', () => {
    expect(advocacyScript({ kind: 'help' })).toContain('[')
  })
})

import { FIX_ROUND, SLANG } from '../src/skills/career/email-logic.js'
import { WARMUP } from '../src/skills/career/feedback-logic.js'

describe('practice rounds', () => {
  it('gives every email item one professional answer with no texting habits', () => {
    expect(FIX_ROUND.length).toBeGreaterThanOrEqual(5)
    for (const it of FIX_ROUND) {
      const right = it.options.filter(o => o.ok)
      expect(right).toHaveLength(1)
      const words = right[0].text.toLowerCase().match(/[a-z']+/g) || []
      expect(words.some(w => SLANG.has(w))).toBe(false)
      expect(right[0].text).not.toMatch(/!!|[–—]/)
    }
  })
  it('has a texting habit in at least one wrong answer per item', () => {
    for (const it of FIX_ROUND) {
      const wrong = it.options.filter(o => !o.ok).map(o => o.text)
      expect(wrong.length).toBeGreaterThanOrEqual(2)
    }
  })
  it('sorts the warm up lines into work and judgement', () => {
    expect(WARMUP).toHaveLength(5)
    for (const it of WARMUP) expect(it.options.filter(o => o.ok)).toHaveLength(1)
    expect(WARMUP.filter(it => it.options.find(o => o.ok).id === 'work').length).toBe(3)
  })
})
