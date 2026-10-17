import { describe, it, expect } from 'vitest'
import { PALETTES, contrast, paletteFor } from '../src/toolkit/nameplates/palettes.js'
import { SCENES } from '../src/toolkit/nameplates/scenes.jsx'
import { ALL_ITEMS } from '../src/toolkit/index.jsx'
import { SKILL_TOOLS } from '../src/skills/index.js'

const IDS = [...ALL_ITEMS.map(i => i.id), ...SKILL_TOOLS.map(t => t.id)]

describe('toolkit nameplates', () => {
  it('gives every activity and life skill its own drawing and palette', () => {
    for (const id of IDS) {
      expect(typeof SCENES[id], id).toBe('function')
      expect(PALETTES[id], id).toBeTruthy()
    }
  })
  it('keeps the title and the line readable on the banner, 4.5 : 1 or better', () => {
    for (const id of IDS) {
      const p = PALETTES[id]
      expect(contrast(p.ink, p.fade), id + ' title').toBeGreaterThanOrEqual(4.5)
      expect(contrast(p.sub, p.fade), id + ' line').toBeGreaterThanOrEqual(4.5)
    }
  })
  it('does not reuse a banner colour between activities', () => {
    const fades = IDS.map(id => PALETTES[id].fade)
    expect(new Set(fades).size).toBe(fades.length)
  })
  it('falls back to a readable palette for a tool it does not know', () => {
    const p = paletteFor('not-a-tool', 'sky')
    expect(contrast(p.ink, p.fade)).toBeGreaterThanOrEqual(4.5)
  })
})
