import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const read = p => fs.readFileSync(path.resolve(__dirname, '..', p), 'utf8')
const src = read('src/views/audience.jsx')
const photos = read('src/lib/photos.js')

function page(name) {
  const a = src.indexOf(`export function ${name}(`)
  const b = src.indexOf('export function', a + 1)
  return src.slice(a, b < 0 ? undefined : b)
}

function keys(body) {
  const out = [...body.matchAll(/photo=\{?["']([a-z-]+)["']/g)].map(m => m[1])
  if (/photo=\{HALLWAY\[0\]\}/.test(body)) out.push('students-hallway')
  return out
}

const PAGES = { ForStudents: 'students-hallway', ForParents: 'parent-hero', ForSchools: 'clinic-talk' }

describe('audience pages', () => {
  it('have no contour lines, drawn scene, glow shadow or monospace', () => {
    expect(src).not.toMatch(/contourPath|<Contours|HeroScene|heroGround|glowShadow/)
    expect(src).not.toMatch(/font-mono|ui-monospace|MICRO/)
  })

  for (const [name, hero] of Object.entries(PAGES)) {
    it(`${name} opens on its own hero photograph and pairs at least two more`, () => {
      const k = keys(page(name))
      expect(k[0], name).toBe(hero)
      expect(k.length, name).toBeGreaterThanOrEqual(3)
      expect(new Set(k).size, `${name} repeats a photograph`).toBe(k.length)
    })
  }

  it('names only photographs photos.js imports and has framing for', () => {
    for (const name of Object.keys(PAGES)) {
      for (const k of keys(page(name))) {
        expect(photos, k).toContain(`'${k}': `)
        expect(photos, k).toMatch(new RegExp(`'${k}': \\{ w: \\d+`))
      }
    }
  })

  it('gives each audience its own two light hues', () => {
    const t = src.slice(src.indexOf('const THEME'), src.indexOf('}\n', src.indexOf('pro:')))
    expect(t).toMatch(/students:[^}]*sky[^}]*mint/s)
    expect(t).toMatch(/parents:[^}]*accent[^}]*sky/s)
    expect(t).toMatch(/pro:[^}]*sky[^}]*beam/s)
    for (const m of t.matchAll(/(hero|a|b): '([^']+)'/g)) {
      expect(m[2], m[1]).not.toMatch(/lilac|sun|coral|blush/)
    }
  })

  it('keeps the Heads Up traffic light', () => {
    expect(src).toMatch(/export function HeadsUp\b/)
    expect(src).toMatch(/<TrafficLight /)
  })
})
