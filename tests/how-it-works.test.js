import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/* Owner, 20 October: How it works pairs each drawing with stock, has less
   glow and no contour lines, no monospace ("AI font, remove"), and the
   camera pulse explainer lives only in the camera reading screen, behind a
   disclosure. Source-level checks: these pages need a browser to render. */
const read = p => fs.readFileSync(path.resolve(__dirname, '..', p), 'utf8')

const METHODS = ['src/views/Methods.jsx', 'src/views/methods/TechFigures.jsx',
  'src/views/methods/ToolkitBand.jsx', 'src/views/methods/MirrorDemo.jsx']

describe('How it works', () => {
  it('uses no monospace label and no contour lines', () => {
    for (const f of [...METHODS, 'src/ui/tech/index.jsx']) {
      const s = read(f)
      expect(s, f).not.toMatch(/t-mono|ui-monospace|Chivo Mono/)
      expect(s, f).not.toMatch(/<Topo\b|t-topo/)
    }
    const css = read('src/ui/tech/tech.css')
    expect(css).not.toMatch(/ui-monospace|Chivo Mono|monospace/)
    expect(css).not.toMatch(/\.t-topo|\.t-bloom/)
  })

  it('pairs every tab with a stock photograph and its own colour', () => {
    const s = read('src/views/Methods.jsx')
    const photos = [...s.matchAll(/photo: '([a-z-]+)'/g)].map(m => m[1])
    expect(photos).toEqual(['ovw-patch-court', 'student-hero', 'student-card', 'photos-steps-patch', 'student-bus'])
    const tones = [...s.matchAll(/tone: '([a-z]+)'/g)].map(m => m[1])
    expect(new Set(tones).size).toBe(tones.length)
    expect(read('src/views/methods/ToolkitBand.jsx')).toMatch(/photo="friends-steps"/)
  })

  it('does not show the camera pulse explainer', () => {
    for (const f of METHODS) expect(read(f), f).not.toMatch(/CameraModule|SignalCoverage|camera pulse check works/)
  })
})

describe('Camera reading screen', () => {
  it('holds the camera pulse explainer in a closed disclosure', () => {
    const s = read('src/views/CheckIn.jsx')
    expect(s).toMatch(/<SeeDetails label="How the camera pulse check works"[^>]*>\s*<div[^>]*>\s*<CameraModule/)
    expect(s).not.toMatch(/label="How the camera pulse check works"[^>]*defaultOpen/)
  })

  it('drops the 01 to 06 numbering from the camera steps', () => {
    const s = read('src/charts/camera.jsx')
    expect(s).not.toMatch(/n: '0\d'/)
    expect(s).not.toMatch(/\{s\.n\}/)
  })
})
