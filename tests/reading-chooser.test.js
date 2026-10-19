import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { CheckInBody } from '../src/views/CheckIn'

/* The Reading tab's chooser (owner, 19 October): four numbered ways, each an
   isometric picture and words, with no icon tiles or pill badges. */
const html = renderToString(React.createElement(CheckInBody, { go: () => {} }))
const ol = html.slice(html.indexOf('<ol'), html.indexOf('</ol>'))
const items = ol.split(/<li[\s>]/).slice(1)

describe('Reading chooser', () => {
  it('lists four ways in order, numbered 1 to 4', () => {
    expect(items).toHaveLength(4)
    const titles = ['Survey', 'Mental Mirror', 'Camera and microphone', 'Connect a patch']
    items.forEach((li, i) => {
      expect(li).toMatch(new RegExp(`aria-hidden="true"[^>]*>${i + 1}</span>`))
      expect(li).toContain(`>${titles[i]}</span></h3>`)
      expect(li).toContain('<svg viewBox')
    })
  })

  it('keeps each action a named button', () => {
    for (const [id, cta] of [['survey', 'Answer'], ['mirror', 'Open the Mirror'], ['sensors', 'Start'], ['patch', 'Connect']]) {
      expect(ol).toContain(`aria-labelledby="way-${id}-t way-${id}-a"`)
      expect(ol).toContain(`id="way-${id}-a">${cta}</span>`)
    }
  })

  it('carries no dashes in its copy', () => {
    const text = html.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ')
    expect(text).not.toMatch(/[–—]/)
  })
})
