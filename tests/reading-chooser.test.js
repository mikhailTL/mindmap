import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { CheckInBody, READING_IS } from '../src/views/CheckIn'

const html = renderToString(React.createElement(CheckInBody, { go: () => {} }))
const ol = html.slice(html.indexOf('<ol'), html.indexOf('</ol>'))
const items = ol.split(/<li[\s>]/).slice(1)

describe('Reading chooser', () => {
  it('says what a reading is, above the ways', () => {
    expect(READING_IS).toMatch(/stress level/)
    expect(READING_IS).toMatch(/Mind Score, from 0 calm to 100 peak/)
    expect(html.indexOf(READING_IS)).toBeGreaterThan(-1)
    expect(html.indexOf(READING_IS)).toBeLessThan(html.indexOf('<ol'))
  })

  it('lists four ways in order, numbered 1 to 4', () => {
    expect(items).toHaveLength(4)
    const titles = ['Mental Mirror', 'Camera and microphone', 'Survey', 'Connect a patch']
    items.forEach((li, i) => {
      expect(li).toMatch(new RegExp(`aria-hidden="true"[^>]*>${i + 1}</span>`))
      expect(li).toContain(titles[i])
    })
  })

  it('draws the cards, not the 3D objects, and no Start here badge', () => {
    items.forEach(li => {
      expect(li).toContain('bg-card')
      expect(li).toContain('rounded-[12px]')
    })
    expect(html).not.toContain('Start here')
  })

  it('keeps each action', () => {
    for (const cta of ['Open the Mirror', 'Start', 'Answer', 'Connect']) expect(ol).toContain(cta)
  })

  it('carries no dashes in its copy', () => {
    const text = html.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ')
    expect(text).not.toMatch(/[–—]/)
  })
})
