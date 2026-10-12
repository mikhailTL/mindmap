import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import {
  AGREE, ALL_ITEMS, REQUIRED, SUS_ITEMS, questionNumber, questionText, susGrade, susScore,
} from '../src/survey/questions.js'

/* The System Usability Scale is a validated instrument, not house copy. Its
   published benchmark (mean 68 across studies) only applies if the ten items
   are the published ten, in the published order, on the published five-point
   agreement scale. Reword, reorder or drop one and the number MindMap reports
   stops being a SUS score while still looking like one, which is worse than
   reporting nothing. Everything in this file exists to make that impossible
   to do by accident. */

/* Brooke 1986, verbatim, with the product name substituted. */
const PUBLISHED_PROMPTS = [
  'I think that I would want to use MindMap regularly.',
  'I found MindMap unnecessarily complex.',
  'I thought MindMap was easy to use.',
  'I think I would need help from someone technical to use MindMap.',
  'I found the various parts of MindMap were well put together.',
  'I thought there was too much inconsistency in MindMap.',
  'I would imagine that most people would learn to use MindMap very quickly.',
  'I found MindMap very awkward to use.',
  'I felt confident using MindMap.',
  'I needed to learn a lot of things before I could get going with MindMap.',
]

/* A second, order-sensitive lock over id, wording and direction together, so a
   change to any one of the three has to be deliberate enough to update this
   digest. */
const ITEM_BLOCK_SHA256 = '35fa34e8712a913e11f06e7905f6e8b5423aadd55ebb34956b12295fc72320c5'

const digest = () => createHash('sha256')
  .update(JSON.stringify(SUS_ITEMS.map(i => [i.id, i.prompt, i.sus])), 'utf8')
  .digest('hex')

const answerAll = v => new Map(SUS_ITEMS.map(i => [i.id, v]))

describe('SUS instrument integrity', () => {
  it('has exactly the ten published items', () => {
    expect(SUS_ITEMS).toHaveLength(10)
  })

  it('carries the published wording in the published order', () => {
    expect(SUS_ITEMS.map(i => i.prompt)).toEqual(PUBLISHED_PROMPTS)
  })

  it('matches the pinned digest of id, wording and direction', () => {
    expect(digest()).toBe(ITEM_BLOCK_SHA256)
  })

  /* Ids are storage keys. Reviewers already have answers under these ids in
     their browsers; renaming one silently discards a response. */
  it('keeps the stored answer ids', () => {
    expect(SUS_ITEMS.map(i => i.id))
      .toEqual(['sus-1', 'sus-2', 'sus-3', 'sus-4', 'sus-5', 'sus-6', 'sus-7', 'sus-8', 'sus-9', 'sus-10'])
  })

  /* The instrument requires alternation: the scoring below reads direction
     from `sus`, and a run of two same-direction items would both bias the
     score and remove the acquiescence control the alternation exists for. */
  it('alternates positive and negative items', () => {
    expect(SUS_ITEMS.map(i => i.sus))
      .toEqual(['pos', 'neg', 'pos', 'neg', 'pos', 'neg', 'pos', 'neg', 'pos', 'neg'])
    SUS_ITEMS.forEach((item, i) => {
      expect(item.sus).toBe(i % 2 === 0 ? 'pos' : 'neg')
    })
    expect(SUS_ITEMS.filter(i => i.sus === 'pos')).toHaveLength(5)
    expect(SUS_ITEMS.filter(i => i.sus === 'neg')).toHaveLength(5)
  })

  it('offers the published five-point agreement scale, negative to positive', () => {
    expect(AGREE.map(p => p.value)).toEqual([1, 2, 3, 4, 5])
    expect(AGREE.map(p => p.label))
      .toEqual(['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'])
    for (const item of SUS_ITEMS) {
      expect(item.points).toBe(AGREE)
      expect(item.kind).toBe('scale')
    }
  })

  /* Every SUS item has to be compulsory: susScore returns null on a partial
     set, so an optional item would mean a survey that can never be scored. */
  it('makes all ten compulsory', () => {
    for (const item of SUS_ITEMS) {
      expect(item.optional).toBeUndefined()
      expect(REQUIRED).toContain(item)
    }
  })
})

describe('susScore', () => {
  it('returns exactly 50 when every item is answered Agree', () => {
    const agreeValue = AGREE.find(p => p.label === 'Agree').value
    expect(agreeValue).toBe(4)
    expect(susScore(answerAll(agreeValue))).toBe(50)
  })

  it('returns null unless all ten are answered', () => {
    expect(susScore(new Map())).toBeNull()
    for (const item of SUS_ITEMS) {
      const partial = answerAll(4)
      partial.delete(item.id)
      expect(susScore(partial), `missing ${item.id}`).toBeNull()
    }
    /* Nine of ten plus an answer to something that is not a SUS item is still
       not a SUS score. */
    const decoy = answerAll(4)
    decoy.delete('sus-10')
    decoy.set('stars', 5)
    expect(susScore(decoy)).toBeNull()
  })

  /* The published formula, written out independently of the implementation:
     positive items score (answer - 1), negative items score (5 - answer), sum
     the ten, multiply by 2.5. */
  it('implements the published formula and nothing else', () => {
    const byFormula = answers => {
      let sum = 0
      for (const item of SUS_ITEMS) {
        const a = answers.get(item.id)
        sum += item.sus === 'pos' ? a - 1 : 5 - a
      }
      return Math.round(sum * 2.5 * 10) / 10
    }
    let seed = 20260926
    const next = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return 1 + (seed % 5) }
    for (let trial = 0; trial < 500; trial++) {
      const answers = new Map(SUS_ITEMS.map(i => [i.id, next()]))
      expect(susScore(answers), JSON.stringify([...answers])).toBe(byFormula(answers))
    }
  })

  it('spans the full 0 to 100 range at the extremes', () => {
    const worst = new Map(SUS_ITEMS.map(i => [i.id, i.sus === 'pos' ? 1 : 5]))
    const best = new Map(SUS_ITEMS.map(i => [i.id, i.sus === 'pos' ? 5 : 1]))
    expect(susScore(worst)).toBe(0)
    expect(susScore(best)).toBe(100)
  })

  it('scores a hand-worked mixed response the published way', () => {
    /* pos 5,5,4,5,4 -> 4+4+3+4+3 = 18 ; neg 1,1,2,1,2 -> 4+4+3+4+3 = 18
       36 * 2.5 = 90 */
    const answers = new Map([
      ['sus-1', 5], ['sus-2', 1], ['sus-3', 5], ['sus-4', 1], ['sus-5', 4],
      ['sus-6', 2], ['sus-7', 5], ['sus-8', 1], ['sus-9', 4], ['sus-10', 2],
    ])
    expect(susScore(answers)).toBe(90)
  })

  /* Alternation makes every straight-line response land on 50. Any analysis
     of the collected responses has to treat a 50 as suspect rather than as a
     middling verdict, so the property is pinned here where it is visible. */
  it('maps any uniform response to 50, which is the straight-lining signature', () => {
    for (const v of [1, 2, 3, 4, 5]) expect(susScore(answerAll(v))).toBe(50)
  })

  it('is not a percentage, and grades on the Sauro and Lewis curve', () => {
    expect(susGrade(90).grade).toBe('A')
    expect(susGrade(84.1).grade).toBe('A')
    expect(susGrade(84).grade).toBe('B')
    expect(susGrade(78.9).grade).toBe('B')
    expect(susGrade(78.8).grade).toBe('C')
    /* 71 looks like a pass mark and is not: it is a C, below the population
       mean of 68 only by a little. */
    expect(susGrade(71).grade).toBe('C')
    expect(susGrade(68).grade).toBe('C')
    expect(susGrade(67.9).grade).toBe('D')
    expect(susGrade(51.7).grade).toBe('D')
    expect(susGrade(51.6).grade).toBe('F')
    expect(susGrade(null)).toBeNull()
  })
})

describe('questionNumber', () => {
  /* Numbers are shown to reviewers and quoted in the write-up. They come from
     ask order, so an inserted question renumbers the rest rather than
     producing two of the same number. */
  it('covers every item exactly once', () => {
    const numbers = ALL_ITEMS.map(q => questionNumber(q.id))
    expect(numbers).toHaveLength(ALL_ITEMS.length)
    expect(new Set(numbers).size).toBe(ALL_ITEMS.length)
    expect(numbers.every(n => Number.isInteger(n))).toBe(true)
  })

  it('runs 1 to 13 continuously across the whole survey, not per section', () => {
    expect(ALL_ITEMS).toHaveLength(13)
    expect(ALL_ITEMS.map(q => questionNumber(q.id)))
      .toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13])
    expect(ALL_ITEMS.map(q => q.id).slice(10)).toEqual(['stars', 'change', 'impact'])
  })

  it('returns null for an id the survey does not ask', () => {
    expect(questionNumber('nps')).toBeNull()
    expect(questionNumber('not-a-question')).toBeNull()
  })

  /* Answers to retired questions are still in reviewers' browsers. They have
     to render as the question that was asked, not as a bare id. */
  it('still names retired questions so old answers stay readable', () => {
    expect(questionText('nps')).toBe('How likely are you to recommend MindMap?')
    expect(questionText('about-age')).toBe('Your age range')
    expect(questionText('sus-1')).toBe(PUBLISHED_PROMPTS[0])
    expect(questionText('never-asked')).toBe('never-asked')
  })
})
