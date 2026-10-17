import { describe, it, expect, beforeEach } from 'vitest'
import {
  ADS_PER_MINUTE, weeklyMinutes, attention, hoursText, drainers, suggestLimit, minutesSaved,
  trickCounts, iStatement, checkWhen, scoreReplies, noLine, pushbackFor, readStore, writeStore,
  SITUATIONS, SCENARIOS, PUSHBACK, WHO, NO_STYLES, TRICKS,
} from '../src/skills/outside/logic.js'

const apps = [
  { name:'TikTok', minutes:90, feel:'worse', tricks:['scroll', 'rewards'] },
  { name:'YouTube', minutes:45, feel:'same', tricks:['autoplay', 'scroll'] },
  { name:'Messages', minutes:30, feel:'better', tricks:[] },
]

describe('outside-feed: attention estimate', () => {
  it('adds daily minutes and multiplies by seven', () => {
    expect(weeklyMinutes(apps)).toBe((90 + 45 + 30) * 7)
  })
  it('ignores blanks, negatives and non numbers', () => {
    expect(weeklyMinutes([{ minutes:'' }, { minutes:-5 }, { minutes:'abc' }, { minutes:'20' }])).toBe(140)
  })
  it('caps a day at 24 hours of one app', () => {
    expect(weeklyMinutes([{ minutes:5000 }])).toBe(1440 * 7)
  })
  it('estimates ads at the stated rate and a year in hours', () => {
    const a = attention(apps)
    expect(ADS_PER_MINUTE).toBe(0.5)
    expect(a.weekMinutes).toBe(1155)
    expect(a.adsWeek).toBe(Math.round(1155 * 0.5))
    expect(a.yearHours).toBe(Math.round(1155 * 52 / 60))
  })
  it('only counts feed apps toward ads (messages carry none)', () => {
    const a = attention([{ minutes:60, ads:false }, { minutes:60 }])
    expect(a.weekMinutes).toBe(840)
    expect(a.adsWeek).toBe(Math.round(420 * ADS_PER_MINUTE))
  })
  it('writes minutes as hours and minutes', () => {
    expect(hoursText(0)).toBe('0 min')
    expect(hoursText(45)).toBe('45 min')
    expect(hoursText(60)).toBe('1 h')
    expect(hoursText(1155)).toBe('19 h 15 min')
  })
  it('lists draining apps, most minutes first', () => {
    const list = drainers([...apps, { name:'Snap', minutes:120, feel:'worse' }])
    expect(list.map(a => a.name)).toEqual(['Snap', 'TikTok'])
  })
  it('counts how often each trick shows up', () => {
    const c = trickCounts(apps)
    expect(c.scroll).toBe(2)
    expect(c.autoplay).toBe(1)
    expect(c.likes).toBe(0)
  })
  it('every trick card has a how and a counter move', () => {
    TRICKS.forEach(t => { expect(t.id).toBeTruthy(); expect(t.how).toBeTruthy(); expect(t.fix).toBeTruthy() })
  })
})

describe('outside-feed: limits plan', () => {
  it('suggests about a third less, rounded to 5, never under 15 or over the current time', () => {
    expect(suggestLimit(90)).toBe(60)
    expect(suggestLimit(20)).toBe(15)
    expect(suggestLimit(10)).toBe(10)
    expect(suggestLimit(0)).toBe(0)
    expect(suggestLimit(47)).toBe(30)
  })
  it('counts minutes saved per week from limits under the current time only', () => {
    expect(minutesSaved(apps, { TikTok:60, YouTube:60 })).toBe(30 * 7)
    expect(minutesSaved(apps, {})).toBe(0)
  })
})

describe('outside-conflict: I-statements', () => {
  it('builds the four parts into one sentence', () => {
    expect(iStatement({ feel:'left out', when:'plans change last minute', because:'I keep that time free', need:'a text if plans change' }))
      .toBe('I feel left out when plans change last minute because I keep that time free. I need a text if plans change.')
  })
  it('tidies stray capitals, full stops and leading words the user typed twice', () => {
    expect(iStatement({ feel:'Hurt.', when:'When you laugh at me in the group chat.', because:'Because it feels public', need:'I need you to stop.' }))
      .toBe('I feel hurt when you laugh at me in the group chat because it feels public. I need you to stop.')
  })
  it('drops parts that are empty', () => {
    expect(iStatement({ feel:'stressed', when:'', because:'', need:'' })).toBe('I feel stressed.')
    expect(iStatement({})).toBe('')
  })
  it('flags always and never, name calling and blame', () => {
    expect(checkWhen('you always ignore me').join(' ')).toMatch(/always/)
    expect(checkWhen('you never listen').join(' ')).toMatch(/never/)
    expect(checkWhen('you are so stupid').join(' ')).toMatch(/name/)
    expect(checkWhen('you make me so mad').join(' ')).toMatch(/blame|make me/)
    expect(checkWhen('plans change last minute')).toEqual([])
  })
  it('every scenario has one calm, one avoid and one attack reply', () => {
    SCENARIOS.forEach(s => {
      expect(s.options.map(o => o.kind).sort()).toEqual(['attack', 'avoid', 'calm'])
      s.options.forEach(o => expect(o.why).toBeTruthy())
    })
  })
  it('scores practice as calm replies out of total', () => {
    expect(scoreReplies(['calm', 'avoid', 'calm'])).toEqual({ calm:2, total:3 })
    expect(scoreReplies([])).toEqual({ calm:0, total:0 })
  })
  it('includes peer pressure and online bullying situations', () => {
    const ids = SITUATIONS.map(s => s.id)
    expect(ids).toContain('pressure')
    expect(ids).toContain('online')
  })
})

describe('outside-no: boundary lines', () => {
  it('builds each way of saying no around what was asked', () => {
    const ask = 'skip practice with you'
    expect(noLine('plain', ask)).toBe("No, I'm not going to skip practice with you.")
    expect(noLine('reason', ask, { reason:'I have a game Friday' })).toBe("No, I'm not going to skip practice with you. I have a game Friday.")
    expect(noLine('other', ask, { other:'hang out after' })).toBe("I'm not going to skip practice with you, but I can hang out after.")
    expect(noLine('repeat', ask)).toBe("I already said no. I'm not going to skip practice with you.")
    expect(noLine('pause', ask)).toBe("I'm not ready to say yes to that. For now the answer is no.")
  })
  it('falls back to "that" when nothing was typed and drops a missing reason', () => {
    expect(noLine('plain', '')).toBe("No, I'm not going to do that.")
    expect(noLine('reason', '  ', { reason:'' })).toBe("No, I'm not going to do that.")
    expect(noLine('other', '', {})).toBe("No, I'm not going to do that.")
  })
  it('turns "I won\'t" style input into a clean clause', () => {
    expect(noLine('plain', 'Send photos.')).toBe("No, I'm not going to send photos.")
  })
  it('has pushback lines for every kind of person', () => {
    WHO.forEach(w => expect(pushbackFor(w.id).length).toBeGreaterThanOrEqual(3))
    expect(Object.keys(PUSHBACK).sort()).toEqual(WHO.map(w => w.id).sort())
    expect(NO_STYLES.length).toBeGreaterThanOrEqual(4)
  })
})

describe('local store', () => {
  const store = {}
  const fake = {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v) },
    removeItem: k => { delete store[k] },
  }
  beforeEach(() => { for (const k of Object.keys(store)) delete store[k]; globalThis.localStorage = fake })
  it('survives storage that throws', () => {
    globalThis.localStorage = { getItem() { throw new Error('x') }, setItem() { throw new Error('x') } }
    expect(readStore('outside-feed', 7)).toBe(7)
    expect(writeStore('outside-feed', {})).toBe(false)
  })
  it('round trips under mindmap.skills.<id> and survives junk', () => {
    expect(readStore('outside-no', { list:[] })).toEqual({ list:[] })
    writeStore('outside-no', { list:[1] })
    expect(localStorage.getItem('mindmap.skills.outside-no')).toBe('{"list":[1]}')
    expect(readStore('outside-no', { list:[] })).toEqual({ list:[1] })
    localStorage.setItem('mindmap.skills.outside-no', '{bad')
    expect(readStore('outside-no', { list:[] })).toEqual({ list:[] })
  })
})
