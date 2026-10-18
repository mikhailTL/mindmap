import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { AboutSheet } from '../src/views/about/AboutSheet'
import { AboutButton } from '../src/views/about/AboutButton'
import { ALL_TEXT, PARTS, PROBLEM, STATS, WHY, WHY_QUOTE, VISION, VISION_MARK } from '../src/views/about/content'

describe('About MindMap', () => {
  const html = renderToString(React.createElement(AboutSheet, { open: false, onClose: () => {} }))
  const text = ALL_TEXT.join('\n')

  it('has the owner’s five parts, in order', () => {
    expect(PARTS.map(p => p.title)).toEqual(
      ['The Problem', 'Why MindMap', 'Personal Experience & Research', 'What is MindMap', 'Vision'])
    let at = 0
    for (const p of PARTS) {
      const i = html.indexOf(p.title.replace('&', '&amp;'), at)
      expect(i).toBeGreaterThan(-1)
      at = i
    }
  })

  it('carries the copy fixes', () => {
    expect(text).not.toMatch(/Mindmap/)
    expect(text).not.toMatch(/medical professional/i)
    expect(text).not.toMatch(/[–—]/)
    expect(text).not.toMatch(/fast array|months at end|these crisis\b/)
    expect(text).toContain('Counselors/Professionals')
  })

  it('is a labelled dialog with a close control', () => {
    expect(html).toMatch(/<dialog[^>]*aria-labelledby="ab-title"/)
    expect(html).toContain('id="ab-title"')
    expect(html).toContain('aria-label="Close"')
  })

  it('pulls its highlights from the owner’s own sentences', () => {
    for (const s of STATS) expect(PROBLEM).toContain(s.mark)
    expect(WHY).toContain(WHY_QUOTE)
    expect(VISION[0]).toContain(VISION_MARK)
  })

  it('keeps the About button’s name', () => {
    const b = renderToString(React.createElement(AboutButton, { onClick: () => {} }))
    expect(b).toMatch(/<button[^>]*>About<\/button>/)
  })
})
