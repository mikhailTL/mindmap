import React from 'react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderToString } from 'react-dom/server'
import { HowTo, GUIDES, guideFor, storageKey } from '../src/views/howto'
import { ART } from '../src/views/howto/art'

const PAIRS = {
  student: ['app-student', 'reading', 'mirror', 'student-trends', 'toolkit', 'ai', 'shared'],
  parent: ['app-parent', 'parent-trends', 'toolkit', 'ai', 'privacy'],
  pro: ['app-pro', 'app-pro-trends', 'network', 'ai', 'toolkit'],
}
const ALL = Object.entries(PAIRS).flatMap(([app, tabs]) => tabs.map(tab => [app, tab]))

/* A stand-in storage that says every guide was left open, so the server
   render includes the steps. */
let saved
function fakeStorage(value) {
  const store = new Map()
  return {
    getItem: k => (store.has(k) ? store.get(k) : value),
    setItem: (k, v) => { store.set(k, String(v)) },
    removeItem: k => { store.delete(k) },
  }
}
function setStorage(s) {
  Object.defineProperty(globalThis, 'localStorage', { value: s, configurable: true, writable: true })
}

const render = (app, tab, go = () => {}) =>
  renderToString(React.createElement(HowTo, { app, tab, go }))

describe('How to use guides', () => {
  beforeEach(() => {
    saved = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  })
  afterEach(() => {
    if (saved) Object.defineProperty(globalThis, 'localStorage', saved)
    else delete globalThis.localStorage
  })

  it.each(ALL)('%s / %s renders a guide with three steps when open', (app, tab) => {
    setStorage(fakeStorage('open'))
    const html = render(app, tab)
    expect(html).toContain(`data-howto="${app}.${tab}"`)
    expect(html).toContain('aria-expanded="true"')
    expect((html.match(/data-howto-step="/g) || []).length).toBe(3)
    expect(html).toContain(guideFor(app, tab).title)
    expect(html).toContain(guideFor(app, tab).use)
  })

  it.each(ALL)('%s / %s starts collapsed with nothing stored', (app, tab) => {
    setStorage(fakeStorage(null))
    const html = render(app, tab)
    expect(html).toContain('aria-expanded="false"')
    expect(html).toMatch(/How to /)
    expect(html).not.toContain('data-howto-step=')
  })

  it('stays collapsed and does not throw when storage throws', () => {
    setStorage({ getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') } })
    const html = render('student', 'reading')
    expect(html).toContain('aria-expanded="false"')
  })

  it('renders nothing for an unknown or missing tab or app', () => {
    setStorage(fakeStorage('open'))
    expect(render('student', 'nope')).toBe('')
    expect(render('student', null)).toBe('')
    expect(render('student', undefined)).toBe('')
    expect(render('parent', 'reading')).toBe('')
    expect(render('other', 'ai')).toBe('')
    expect(render('student', 'toString')).toBe('')
  })

  it('uses one storage key per app and tab', () => {
    expect(storageKey('parent', 'parent-trends')).toBe('mindmap.howto.parent.parent-trends')
  })

  it('has exactly the listed tabs, each with three drawn steps', () => {
    for (const [app, tabs] of Object.entries(PAIRS)) {
      expect(Object.keys(GUIDES[app]).sort()).toEqual([...tabs].sort())
    }
    for (const [app, tab] of ALL) {
      const g = guideFor(app, tab)
      expect(g.steps).toHaveLength(3)
      for (const s of g.steps) expect(typeof ART[s.art]).toBe('function')
    }
  })

  it('keeps the copy to the house rules', () => {
    for (const [app, tab] of ALL) {
      const g = guideFor(app, tab)
      for (const s of g.steps) {
        expect(s.cap.split(/\s+/).length, s.cap).toBeLessThanOrEqual(10)
      }
      const copy = [g.title, g.use, ...g.steps.map(s => s.cap), g.go?.label || ''].join(' ')
      expect(copy).not.toMatch(/[–—]/)
      expect(copy).not.toMatch(/diagnos|disorder|streak|treat/i)
      /* "AI" only ever as the MindMap AI chat */
      expect(copy.replace(/MindMap AI/g, '')).not.toMatch(/\bAI\b/)
    }
  })

  it('never offers a parent Notes, Location or raw readings', () => {
    const p = guideFor('parent', 'parent-trends').steps.map(s => s.cap).join(' ')
    expect(p).toMatch(/Never Notes, Location or raw readings/)
  })
})
