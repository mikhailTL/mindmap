import { describe, expect, it } from 'vitest'
import { ITEMS, band, score, sentence } from '../src/lib/engine.js'
import { bandOf } from '../src/signals/score.js'

/* The self-report route exists so a student with no patch still gets a number
   on the same scale. "Same scale" is only true if the band boundaries match,
   so the two routes are compared against each other here rather than each
   being checked against its own copy of the numbers. */

const answerAll = v => Object.fromEntries(ITEMS.map(i => [i.id, v]))

describe('self-report items', () => {
  it('asks the ten check-in questions the screen lays out', () => {
    expect(ITEMS).toHaveLength(10)
    expect(ITEMS.map(i => i.id)).toEqual(['tension', 'edge', 'sleep', 'energy', 'focus', 'demand',
      'worry', 'snap', 'body', 'support'])
  })

  /* Every item carries both directions of its own phrasing, because the
     one-sentence summary names the top contributor and has to be able to say
     it either way round. */
  it('gives every item a weight and both directions of phrasing', () => {
    for (const item of ITEMS) {
      expect(item.w).toBeGreaterThan(0)
      expect(item.up.length).toBeGreaterThan(0)
      expect(item.dn.length).toBeGreaterThan(0)
      expect(item.lo.length).toBeGreaterThan(0)
      expect(item.hi.length).toBeGreaterThan(0)
    }
    expect(ITEMS.reduce((a, b) => a + b.w, 0)).toBeCloseTo(8.8, 10)
  })
})

describe('self-report scoring', () => {
  /* The five radio points are 0 to 4, so the midpoint has to land on the
     middle of the scale: an all-neutral check-in is an ordinary day, not a
     calm one. */
  it('puts an all-neutral check-in at the middle of the scale', () => {
    const r = score(answerAll(2))
    expect(r.S).toBe(0)
    expect(r.score).toBe(50)
    expect(band(r.score).key).toBe('usual')
  })

  it('saturates toward but never reaches the ends of the scale', () => {
    expect(score(answerAll(0)).score).toBe(8)
    expect(score(answerAll(4)).score).toBe(92)
    expect(score(answerAll(0)).S).toBe(-1)
    expect(score(answerAll(4)).S).toBe(1)
  })

  it('is monotone in every single answer', () => {
    for (const item of ITEMS) {
      let previous = -Infinity
      for (const v of [0, 1, 2, 3, 4]) {
        const r = score({ ...answerAll(2), [item.id]: v })
        expect(r.score).toBeGreaterThan(previous)
        previous = r.score
      }
    }
  })

  /* Each contribution is reported so the summary can name the biggest one.
     The weight has to be visible in it, or the sentence credits the wrong
     answer. */
  it('reports each contribution as its own weighted distance from neutral', () => {
    const answers = { tension: 4, edge: 0, sleep: 3, energy: 2, focus: 1, demand: 4, worry: 3, snap: 1, body: 0, support: 2 }
    const r = score(answers)
    for (const c of r.contrib) {
      expect(c.raw).toBeCloseTo(c.item.w * ((answers[c.item.id] - 2) / 2), 12)
    }
    const sumW = ITEMS.reduce((a, b) => a + b.w, 0)
    expect(r.S).toBeCloseTo(r.contrib.reduce((a, c) => a + c.raw, 0) / sumW, 12)
    expect(r.score).toBe(Math.round(100 / (1 + Math.exp(-2.4 * r.S))))
  })

  it('names the heaviest answer in the sentence, in the right direction', () => {
    const high = sentence(score({ ...answerAll(2), edge: 4 }))
    expect(high.word).toBe(band(score({ ...answerAll(2), edge: 4 }).score).word)
    expect(high.tail).toContain('how on edge you feel')
    const low = sentence(score({ ...answerAll(2), edge: 0 }))
    expect(low.tail).toContain('how settled you feel')
    /* An ordinary day should not have a headline driver invented for it. */
    expect(sentence(score(answerAll(2))).tail)
      .toBe('. Nothing you answered stands out on its own.')
  })
})

describe('bands', () => {
  it('breaks at 35, 58 and 73', () => {
    expect(band(0).key).toBe('low')
    expect(band(34).key).toBe('low')
    expect(band(35).key).toBe('usual')
    expect(band(57).key).toBe('usual')
    expect(band(58).key).toBe('up')
    expect(band(72).key).toBe('up')
    expect(band(73).key).toBe('high')
    expect(band(100).key).toBe('high')
  })

  /* The claim made to a judge and to a user is that the patch route and the
     self-report route land on one scale. If these two functions ever drift
     apart, the same number means two different things on two screens. */
  it('agrees with the patch route on every score from 0 to 100', () => {
    for (let n = 0; n <= 100; n++) {
      expect(band(n), `score ${n}`).toEqual(bandOf(n))
    }
  })

  it('agrees on the word "usual" specifically, which is the shared anchor', () => {
    const usual = []
    for (let n = 0; n <= 100; n++) if (band(n).key === 'usual') usual.push(n)
    expect(usual[0]).toBe(35)
    expect(usual[usual.length - 1]).toBe(57)
    for (const n of usual) expect(bandOf(n).word).toBe('in your usual range')
  })
})

describe('self-report scoring, incomplete answers', () => {
  /* Documents current behaviour, which is not safe behaviour. score() does no
     completeness check: a missing answer makes the arithmetic NaN, and band()
     falls through all three comparisons to the top band, so a half-finished
     check-in reads as "high" rather than as unfinished. Only the call site in
     CheckIn.jsx stops this reaching a user, and nothing in this module stops
     a second caller getting it wrong. */
  it('produces NaN and bands NaN as high, so the guard has to stay at the call site', () => {
    const partial = { ...answerAll(2) }
    delete partial.demand
    const r = score(partial)
    expect(Number.isNaN(r.S)).toBe(true)
    expect(Number.isNaN(r.score)).toBe(true)
    expect(band(r.score).key).toBe('high')
    expect(band(NaN).key).toBe('high')
  })
})
