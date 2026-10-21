import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { Overview } from '../src/views/Overview'
import { PHOTOS, PHOTO_META } from '../src/lib/photos'

/* Owner, 20 October, on the site home. */
describe('Overview home', () => {
  const html = renderToString(React.createElement(Overview, { go: () => {} }))
  const band = id => {
    const at = html.indexOf(`id="${id}"`)
    return html.slice(at, html.indexOf('</section>', at))
  }

  it('numbers both ways the same, with no bold lead words', () => {
    const start = band('start')
    expect((start.match(/<ol/g) || []).length).toBe(2)
    expect(start).not.toContain('<strong')
    expect(start).toContain('Mental Mirror reads your face with Google&#x27;s MediaPipe Face Landmarker, a machine learning model.')
    expect(start).toContain('Camera pulse check reads your pulse from skin colour with your phone camera.')
    expect(start).toContain('Survey asks a few short questions.')
    for (const n of ['1', '2', '3']) expect((start.match(new RegExp(`aria-hidden="true"[^>]*>${n}</span>`, 'g')) || []).length).toBe(2)
  })

  it('shows a photograph in each way, not a drawn contour strip', () => {
    const start = band('start')
    expect((start.match(/<img /g) || []).length).toBe(2)
    expect(start).not.toContain('<svg viewBox="0 0 360 120"')
  })

  it('keeps Why MindMap? in the problem band, in the owner’s words, with no dark box', () => {
    const problem = band('problem')
    expect(problem).toContain('id="why"')
    expect(problem).toContain('Why MindMap?')
    const text = problem.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ')
    expect(text).toContain('With these mental illnesses showing no sign of ceasing, current approaches do not focus on connections and support systems, leaving millions of teens suffering alone.')
    expect(text).toContain('contrary to existing solutions focused on adults, individual health, and driving stigma.')
    expect(text).toContain('MindMap is the only app that bridges the gap between teens, parents, and Counselors/Professionals to reduce isolation and nurture caring and supportive environments.')
    expect(problem).not.toMatch(/id="why"[\s\S]*bg-ink p-5/)
  })

  /* Owner, 21 October: "needs to be put into a white card". */
  it('sets Why MindMap? on a white card with dark ink', () => {
    const why = band('problem').split('id="why"')[1]
    expect(why).toMatch(/^[^>]*>\s*<div[^>]*class="[^"]*rounded-panel bg-card /)
    expect(why).toMatch(/<h3[^>]*text-ink"/)
    expect(why).not.toMatch(/text-(paper|mist|accent-lit)/)
  })

  /* Owner, 21 October: the hero tile back to the original green; bands white,
     green or blue ("not on entire page backgrounds"); cards keep their hues. */
  it('drops the glow behind the hero patch and keeps the bands green and blue', () => {
    expect(html).not.toContain('mm-glow')
    const hero = band('hero')
    expect(hero).toContain('bg-accent-wash')
    expect(hero).not.toMatch(/bg-(coral|lilac|sun)-wash/)
    const open = id => html.match(new RegExp(`<section[^>]*id="${id}"[^>]*>`))[0]
    expect(open('screens')).toContain('bg-accent-wash')
    expect(open('privacy')).toContain('bg-[#e2f2f0]')
    for (const tag of html.match(/<section[^>]*>/g)) {
      expect(tag).not.toMatch(/bg-(coral|lilac|sun|blush)/)
    }
  })

  it('registers every derived photograph with its framing data', () => {
    for (const k of ['ovw-patch-court', 'ovw-pro-patch', 'ovw-app-bus', 'ovw-mirror-face']) {
      expect(PHOTOS[k]).toBeTruthy()
      expect(PHOTO_META[k].minAspect).toBeGreaterThan(0)
    }
  })

  it('has no dashes in the copy it sets', () => {
    expect(html.replace(/<[^>]+>/g, '')).not.toMatch(/[–—]/)
  })
})
