import { describe, it, expect } from 'vitest'
import { analyseFace, analyseRPPG } from '../src/signals/face.js'
import { scoreFace, emptyFaceBaseline, updateFaceBaseline, faceFeatures, faceSentence, FACE_PRIOR } from '../src/signals/face-score.js'
import { coverMap, foreheadPatch, frameReady, mapX, mapY, nextTimestamp, patchPixels } from '../src/signals/face-capture.js'

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

describe('Mental Mirror: slow phones, frame floor', () => {
  it('scores a full capture at 2 frames a second', () => {
    const a = analyseFace(frames({ fps: 2 }))
    expect(a.ok).toBe(true)
    expect(a.hr).toBe(null)
  })

  it('refuses a capture with too few frames, with a short message', () => {
    const a = analyseFace(frames({ fps: 0.8 }))
    expect(a.ok).toBe(false)
    expect(a.reason).toBe('too-few')
    expect(a.message.split(' ').length).toBeLessThan(9)
  })

  it('ignores frames whose colour patch could not be read', () => {
    const f = frames({ bpm: 72 }).map((x, i) => (i % 10 === 0 ? { ...x, green: null } : x))
    const a = analyseFace(f)
    expect(a.ok).toBe(true)
    expect(a.hr).not.toBe(null)
    expect(Math.abs(a.hr - 72)).toBeLessThan(3)
  })
})

describe('Mental Mirror: face-capture.js guards', () => {
  it('only hands the model a decoded frame with a size', () => {
    expect(frameReady(null)).toBe(false)
    expect(frameReady({ readyState: 0, videoWidth: 0, videoHeight: 0 })).toBe(false)
    expect(frameReady({ readyState: 1, videoWidth: 640, videoHeight: 480 })).toBe(false)
    expect(frameReady({ readyState: 4, videoWidth: 0, videoHeight: 0 })).toBe(false)
    expect(frameReady({ readyState: 2, videoWidth: 640, videoHeight: 480 })).toBe(true)
  })

  it('keeps timestamps strictly increasing across captures and repeated clocks', () => {
    let t = 0
    const seq = [1000.2, 1000.7, 1000.9, 999, 1033, 1033, NaN, 2000].map(now => (t = nextTimestamp(t, now)))
    for (let i = 1; i < seq.length; i++) expect(seq[i]).toBeGreaterThan(seq[i - 1])
    expect(seq.every(Number.isInteger)).toBe(true)
    expect(seq[seq.length - 1]).toBe(2000)
  })

  const face = (dx = 0, dy = 0) => {
    const lm = Array.from({ length: 478 }, () => ({ x: 0.5 + dx, y: 0.5 + dy, z: 0 }))
    lm[10] = { x: 0.5 + dx, y: 0.2 + dy }   /* hairline */
    lm[9] = { x: 0.5 + dx, y: 0.3 + dy }    /* brow line */
    lm[234] = { x: 0.3 + dx, y: 0.45 + dy }
    lm[454] = { x: 0.7 + dx, y: 0.45 + dy }
    return lm
  }

  it('places the forehead patch between hairline and brows, a third of the face wide', () => {
    const p = foreheadPatch(face())
    expect(p.y).toBeCloseTo(0.22, 5)
    expect(p.h).toBeCloseTo(0.06, 5)
    expect(p.w).toBeCloseTo(0.14, 5)
    expect(p.x + p.w / 2).toBeCloseTo(0.5, 5)
  })

  it('clips the patch to the frame instead of reading black pixels past the edge', () => {
    const r = patchPixels(foreheadPatch(face(0.45, -0.25)), 64, 48)
    expect(r.x + r.w).toBeLessThanOrEqual(64)
    expect(r.y).toBeGreaterThanOrEqual(0)
    expect(r.w).toBeGreaterThanOrEqual(1)
    expect(r.h).toBeGreaterThanOrEqual(1)
    const off = patchPixels({ x: 2, y: 2, w: 0.1, h: 0.1 }, 64, 48)
    expect(off.x).toBeLessThan(64); expect(off.w).toBe(1)
    expect(patchPixels({ x: NaN, y: 0, w: 0.1, h: 0.1 }, 64, 48)).toBe(null)
  })

  it('maps landmarks onto the cropped, mirrored video the way object-fit: cover shows it', () => {
    const m = coverMap(480, 640, 400, 300, true)
    expect(mapY(m, 0.5)).toBeCloseTo(150, 5)
    expect(mapX(m, 0.5)).toBeCloseTo(200, 5)
    expect(mapX(m, 0)).toBeCloseTo(400, 5)          /* mirrored: left edge of the frame is the right of the screen */
    expect(mapY(m, 0)).toBeCloseTo(150 - (640 * 400 / 480) / 2, 5)
    const plain = coverMap(640, 480, 400, 300, false)
    expect(mapX(plain, 0.25)).toBeCloseTo(100, 5)
    expect(mapY(plain, 0.25)).toBeCloseTo(75, 5)
  })
})

describe('Mental Mirror: result copy', () => {
  it('says the band and the biggest driver in one short line', () => {
    const r = scoreFace({ face: analyseFace(frames({ brow: 0.5 })) })
    const s = faceSentence(r)
    expect(s.tail).toMatch(/^Brow tension is above the typical range\.$/)
    expect(s.tail.split(' ').length).toBeLessThanOrEqual(8)
    expect(s.tail).not.toMatch(/standard deviation|\u2014/)
  })
})
