import { describe, it, expect } from 'vitest'
import { SKILL_GROUPS, SKILL_TOOLS, SKILL_ROUTES } from '../src/skills/index.js'

describe('life skills registry', () => {
  it('has the four categories in the owner order', () => {
    expect(SKILL_GROUPS.map(g => g.title)).toEqual(['School', 'Outside', 'Life', 'Career'])
    expect(SKILL_GROUPS.map(g => g.sub)).toEqual(['Academic success', 'Social dynamics', 'Wellness', 'Career skills'])
  })
  it('lists one tool per listed problem, each with a unique id and route', () => {
    expect(SKILL_TOOLS).toHaveLength(15)
    expect(new Set(SKILL_TOOLS.map(t => t.id)).size).toBe(15)
    expect(SKILL_ROUTES.every(r => r.startsWith('toolkit-'))).toBe(true)
  })
  it('gives every tool what a tile needs', () => {
    for (const t of SKILL_TOOLS) {
      expect(typeof t.title).toBe('string')
      expect(typeof t.line).toBe('string')
      expect(typeof t.family).toBe('string')
      expect(typeof t.icon).toBe('function')
      expect(typeof t.Component).toBe('function')
      expect(t.route).toBe('toolkit-' + t.id)
    }
  })
})
