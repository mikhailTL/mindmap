import { describe, it, expect } from 'vitest'
import { SKILL_TOOLS } from '../src/skills/index.js'
import { STUDENT_ITEMS } from '../src/toolkit/index.jsx'
import { CATALOG, TOOL_IDS } from '../src/toolkit/game/catalog.js'

describe('game catalog', () => {
  it('lists every student exercise and every life skills tool, in its tab', () => {
    const want = [...STUDENT_ITEMS.map(i => [i.id, 'exercise']), ...SKILL_TOOLS.map(t => [t.id, t.category])]
    expect(TOOL_IDS).toHaveLength(26)
    expect(Object.entries(CATALOG).sort()).toEqual(want.sort())
  })
})

import { gradeRound, rightOption, roundLine, mixOptions } from '../src/toolkit/game/round.js'

const ITEMS = [
  { id:'a', prompt:'x', options:[{ id:'1', text:'one', ok:true }, { id:'2', text:'two' }] },
  { id:'b', prompt:'y', options:[{ id:'1', text:'one' }, { id:'2', text:'two', ok:true }] },
]

describe('quick rounds', () => {
  it('finds the right option', () => {
    expect(rightOption(ITEMS[1]).id).toBe('2')
    expect(rightOption({ options:[] })).toBe(null)
  })
  it('grades picks and says when every answer was right', () => {
    expect(gradeRound(ITEMS, { a:'1', b:'1' })).toMatchObject({ right:1, total:2, answered:2, clean:false })
    expect(gradeRound(ITEMS, { a:'1', b:'2' }).clean).toBe(true)
    expect(gradeRound(ITEMS, {})).toMatchObject({ right:0, answered:0, clean:false })
    expect(gradeRound([], {}).clean).toBe(false)
  })
  it('words a result without judging the person, and with no dashes', () => {
    for (const [r, t] of [[0, 5], [3, 5], [4, 5], [5, 5]]) {
      expect(roundLine(r, t)).not.toMatch(/[–—]|bad|fail|wrong/i)
    }
  })
  it('mixes options the same way for the same seed and keeps every option', () => {
    const o = ['a', 'b', 'c', 'd']
    expect(mixOptions(o, 7)).toEqual(mixOptions(o, 7))
    expect([...mixOptions(o, 3)].sort()).toEqual(o)
  })
})
