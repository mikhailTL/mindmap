import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { WhatIs, WHAT_IS, WHAT_IS_LEAD, TOOLKIT_PART } from '../src/views/landing/WhatIs'

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

  it('leads with the owner sentence', () => {
    expect(WHAT_IS_LEAD).toBe('MindMap is an adolescent wearable patch and app system designed for teens, parents, and Counselors/Professionals to address the teen mental health crisis at its root, providing 3 main features:')
  })

  it('shows the Toolkit as a part of the app feature, with its own picture', () => {
    expect(WHAT_IS.find(f => f.id === 'app').part).toBe(TOOLKIT_PART)
    expect(TOOLKIT_PART.text).toMatch(/breathing, grounding and body scan/)
    expect(TOOLKIT_PART.text).toMatch(/life skills/)
    expect(TOOLKIT_PART.text).toMatch(/levels/)
    expect(html).toContain('aria-label="Toolkit"')
    expect((html.match(/role="img" aria-label="Toolkit demo: /g) || []).length).toBe(1)
  })

  it('keeps the copy to the house rules', () => {
    const copy = [WHAT_IS_LEAD, ...WHAT_IS.map(f => f.text), TOOLKIT_PART.text].join(' ')
    expect(copy).not.toMatch(/[–—]/)
    expect(copy).not.toMatch(/Mindmap|trained on clinical/)
    expect(copy).toContain('Counselors/Professionals')
    expect(copy).not.toMatch(/diagnos|prevent|treat/i)
  })

  it('never shows a parent Notes, Location or raw readings', () => {
    expect(html).toMatch(/Never Notes, Location or raw readings/)
  })
})
