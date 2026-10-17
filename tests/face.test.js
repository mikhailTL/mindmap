import { describe, it, expect } from 'vitest'
import { analyseFace, analyseRPPG } from '../src/signals/face.js'
import { scoreFace, emptyFaceBaseline, updateFaceBaseline, faceFeatures, FACE_PRIOR } from '../src/signals/face-score.js'

/* Synthetic camera frames, the shape face-capture.js records: one per camera
   frame at `fps`, a forehead green level carrying a pulse, blink and tension
   blendshapes, eye aperture, nose position and face width. */
function frames({ seconds = 30, fps = 30, bpm = 72, blinkEvery = 4, brow = 0.12, lips = 0.08, squint = 0.15,
  sway = 0, pulseAmp = 0.003, seed = 1 } = {}) {
  let r = seed
  const rand = () => ((r = (r * 16807) % 2147483647) / 2147483647) - 0.5
  const out = []
  for (let i = 0; i < seconds * fps; i++) {
    const t = (i * 1000) / fps
    const s = t / 1000
    const inBlink = blinkEvery > 0 && (s % blinkEvery) < 0.15
    const blink = inBlink ? 0.9 : 0.05
    out.push({
      t, ok: true,
      bs: {
        eyeBlinkLeft: blink, eyeBlinkRight: blink,
        browDownLeft: brow, browDownRight: brow, browInnerUp: 0.1,
        eyeSquintLeft: squint, eyeSquintRight: squint,
        mouthPressLeft: lips, mouthPressRight: lips, jawForward: 0.02,
      },
      ear: inBlink ? 0.1 : 0.3 + rand() * 0.01,
      nose: [0.5 + sway * Math.sin(2 * Math.PI * 0.5 * s), 0.5],
      faceW: 0.4,
      green: 120 * (1 + pulseAmp * Math.sin(2 * Math.PI * (bpm / 60) * s)) + rand() * 0.05,
    })
  }
  return out
}

describe('Mental Mirror: face.js', () => {
  it('reads a planted pulse from the forehead green level', () => {
    const f = frames({ bpm: 72 })
    const r = analyseRPPG(f.map(x => ({ t: x.t, v: x.green })))
    expect(r.ok).toBe(true)
    expect(Math.abs(r.hr - 72)).toBeLessThan(2)
    expect(r.quality).toBeGreaterThan(0.5)
  })

  it('withholds the pulse when there is none', () => {
    const r = analyseRPPG(frames({ pulseAmp: 0 }).map(x => ({ t: x.t, v: x.green })))
    expect(r.ok === false || r.quality < 0.6).toBe(true)
  })

  it('counts blinks per minute', () => {
    const a = analyseFace(frames({ blinkEvery: 4 }))
    expect(a.ok).toBe(true)
    expect(a.blinkRate).toBeGreaterThan(13)
    expect(a.blinkRate).toBeLessThan(17)
  })

  it('reads head movement in face-widths per second at any frame rate', () => {
    const a30 = analyseFace(frames({ sway: 0.02, fps: 30 }))
    const a15 = analyseFace(frames({ sway: 0.02, fps: 15 }))
    expect(a30.headMotion).toBeGreaterThan(0)
    expect(Math.abs(a30.headMotion - a15.headMotion) / a30.headMotion).toBeLessThan(0.25)
  })

  it('refuses a capture with no face in view', () => {
    const f = frames().map((x, i) => (i % 2 ? x : { t: x.t, ok: false }))
    expect(analyseFace(f).ok).toBe(false)
  })
})

describe('Mental Mirror: face-score.js', () => {
  it('scores an ordinary face on an ordinary day near 50', () => {
    let b = emptyFaceBaseline()
    for (let d = 0; d < 6; d++) {
      const a = analyseFace(frames({ seed: d + 2 }))
      b = updateFaceBaseline(b, faceFeatures(a), `2026-10-0${d + 1}`)
    }
    const r = scoreFace({ face: analyseFace(frames({ seed: 99 })), baseline: b })
    expect(r.ok).toBe(true)
    expect(Math.abs(r.score - 50)).toBeLessThan(8)
    expect(r.low).toBeLessThanOrEqual(r.score)
    expect(r.high).toBeGreaterThanOrEqual(r.score)
  })

  it('scores a tense, fast-blinking, fast-pulse face higher', () => {
    const calm = scoreFace({ face: analyseFace(frames()) })
    const tense = scoreFace({ face: analyseFace(frames({ brow: 0.45, lips: 0.3, blinkEvery: 1.5, bpm: 96 })) })
    expect(tense.score).toBeGreaterThan(calm.score + 15)
    expect(tense.contrib.find(c => c.id === 'browFurrow').raw).toBeGreaterThan(0)
  })

  it('uses the population prior when there is no history', () => {
    const r = scoreFace({ face: analyseFace(frames({ bpm: FACE_PRIOR.hr.m })) })
    expect(r.baselineDays).toBe(0)
    expect(r.half).toBeGreaterThan(10)
  })
})

describe('Mental Mirror: slow phones', () => {
  it('still scores the face at 5 frames a second, without guessing a pulse', () => {
    const a = analyseFace(frames({ fps: 5 }))
    expect(a.ok).toBe(true)
    expect(a.hr).toBe(null)
    expect(scoreFace({ face: a }).ok).toBe(true)
  })
})
