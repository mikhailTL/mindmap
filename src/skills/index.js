import * as school from './school/index.js'
import * as outside from './outside/index.js'
import * as life from './life/index.js'
import * as career from './career/index.js'

// Each category folder exports CATEGORY and TOOLS; every tool opens at #/toolkit-<tool id>.
export const SKILL_GROUPS = [school, outside, life, career]
  .map(m => ({ ...m.CATEGORY, tools: m.TOOLS }))

export const SKILL_TOOLS = SKILL_GROUPS.flatMap(g =>
  g.tools.map(t => ({ ...t, category: g.id, route: 'toolkit-' + t.id })))

export const SKILL_BY_ID = Object.fromEntries(SKILL_TOOLS.map(t => [t.id, t]))
export const SKILL_ROUTES = SKILL_TOOLS.map(t => t.route)
