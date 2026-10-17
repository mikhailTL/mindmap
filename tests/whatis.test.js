import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { WhatIs, WHAT_IS, WHAT_IS_LEAD } from '../src/views/landing/WhatIs'

describe('What is MindMap? band', () => {
  const html = renderToString(React.createElement(WhatIs, { go: () => {} }))

  it('renders with its anchor and three features', () => {
    expect(html).toContain('id="what-is"')
    expect(html).toContain('What is MindMap?')
    expect(WHAT_IS).toHaveLength(3)
    expect((html.match(/<article/g) || []).length).toBe(3)
  })

  it('gives every picture a label', () => {
    expect((html.match(/role="img" aria-label="Demo: /g) || []).length).toBe(3)
  })

  it('keeps the copy to the house rules', () => {
    const copy = [WHAT_IS_LEAD, ...WHAT_IS.map(f => f.text)].join(' ')
    expect(copy).not.toMatch(/[–—]/)
    expect(copy).not.toMatch(/Mindmap|trained on clinical/)
    expect(copy).toContain('Medical Professionals')
    expect(copy).not.toMatch(/diagnos|prevent|treat/i)
  })

  it('never shows a parent Notes, Location or raw readings', () => {
    expect(html).toMatch(/Never Notes, Location or raw readings/)
  })
})
