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

  /* Owner, 20 October: stock photographs in place of the isometric drawings,
     the patch worn in the first two and the app in use in the third. */
  it('shows one photograph per card, each with alt text naming models', () => {
    expect((html.match(/<img /g) || []).length).toBe(3)
    expect(WHAT_IS.map(f => f.photo)).toEqual(['patch-worn', 'ovw-pro-patch', 'ovw-app-bus'])
    for (const f of WHAT_IS) {
      expect(f.alt).toMatch(/model/)
      expect(html).toContain(`alt="${f.alt}"`)
    }
    expect(WHAT_IS[0].alt).toMatch(/patch/)
    expect(WHAT_IS[1].alt).toMatch(/patch/)
    expect(WHAT_IS[2].alt).toMatch(/phone/)
    expect(html).not.toContain('<svg class="block h-auto w-full"')
  })

  it('gives the three cards three different light washes, none green', () => {
    const hues = WHAT_IS.map(f => f.hue)
    expect(new Set(hues).size).toBe(3)
    expect(hues).not.toContain('accent')
    expect(html).not.toContain('bg-accent-wash')
  })

  it('leads with the owner sentence', () => {
    expect(WHAT_IS_LEAD).toBe('MindMap is an adolescent wearable patch and app system designed for teens, parents, and Counselors/Professionals to address the teen mental health crisis at its root by measuring stress and quantifying wellness using innovative features. MindMap provides 3 main features:')
  })

  it('says readings can be taken without the patch', () => {
    const patch = WHAT_IS.find(f => f.id === 'patch')
    expect(patch.more).toMatch(/without the patch/)
    expect(patch.more).toMatch(/Mental Mirror/)
    expect(patch.more).toMatch(/pulse check/)
    expect(patch.more).toMatch(/Survey/)
    expect(html).toContain('Mental Mirror')
  })

  it('keeps the copy to the house rules', () => {
    const copy = [WHAT_IS_LEAD, ...WHAT_IS.map(f => [f.text, f.more].filter(Boolean).join(' '))].join(' ')
    expect(copy).not.toMatch(/[–—]/)
    expect(copy).not.toMatch(/Mindmap|trained on clinical/)
    expect(copy).toContain('Counselors/Professionals')
    expect(copy).not.toMatch(/diagnos|prevent|treat/i)
  })

  it('tells a reader the teen decides who sees what', () => {
    expect(WHAT_IS.find(f => f.id === 'network').text).toMatch(/Teens have the freedom of privacy controls to decide who sees what/)
  })
})
