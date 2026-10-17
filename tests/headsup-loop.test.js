import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import {
  startTeen, headlessView, makeClock, pickParent, LOOP_MS, STAGGER_MS, CLIPS, known, RATE, CALM_MS,
} from '../src/traffic/core.js'
import { seededBaseline } from '../src/traffic/baseline.js'
import { Light, SIGNAL, RED_AFTER_MS } from '../src/signals/light.js'

/* Both teen phones, headless, under fake timers, for four loops: the same
   scripts, the same engine and the same callout rule the page runs. */
const LOOPS = 4
let rec

beforeAll(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] })
  vi.setSystemTime(new Date(2026, 9, 16, 14, 0, 0))
  const clock = makeClock()
  const baseline = seededBaseline()
  const t0 = Date.now()
  const sec = () => (Date.now() - t0) / 1000
  rec = { texting: { loops: [] }, scrolling: { loops: [] }, parent: [], both: 0 }
  const lives = {}
  const phones = {}
  for (const [kind, offset] of [['texting', 0], ['scrolling', STAGGER_MS]]) {
    const R = rec[kind]
    let session = null
    const view = headlessView(kind, () => session)
    const p = startTeen({
      kind, baseline, clock, view, offset,
      onPhase: m => {
        if (m === 'calm') R.loops.push({ start: sec(), ticks: [], callouts: [], phases: {} })
        const L = R.loops[R.loops.length - 1]
        if (L) L.phases[m] = sec()
      },
      onState: live => {
        lives[kind] = live
        const L = R.loops[R.loops.length - 1]
        if (L) L.ticks.push({ t: sec(), light: live.light, index: live.index, signals: live.signals, phase: p?.phase() })
      },
      onCallout: c => { const L = R.loops[R.loops.length - 1]; L.callouts.push({ t: sec(), ...c }) },
      onNudge: () => { const L = R.loops[R.loops.length - 1]; L.nudge = sec() },
    })
    session = p.session
    phones[kind] = p
  }
  const iv = setInterval(() => {
    const pick = pickParent(lives.texting, lives.scrolling)
    if (lives.texting?.light === Light.RED && lives.scrolling?.light === Light.RED) rec.both++
    const l = known(pick?.light)
    const last = rec.parent[rec.parent.length - 1]
    if (!last || last[1] !== l) rec.parent.push([sec(), l])
  }, 250)
  vi.advanceTimersByTime(STAGGER_MS + LOOPS * LOOP_MS + 20000)
  clearInterval(iv)
  phones.texting.stop(); phones.scrolling.stop()
  vi.useRealTimers()
  if (process.env.HU_DEBUG) {
    for (const k of ['texting', 'scrolling']) for (const L of rec[k].loops) {
      const first = l => L.ticks.find(x => x.light === l)?.t
      console.log(k, JSON.stringify({ start: L.start, phases: L.phases, yellow: first('yellow'), red: first('red'), nudge: L.nudge,
        callouts: L.callouts.map(c => [c.t, c.label]), maxCalm: Math.max(...L.ticks.filter(x => x.phase === 'calm').map(x => x.index)),
        signalsSeen: [...new Set(L.ticks.flatMap(x => x.signals))] }))
    }
    console.log('parent', JSON.stringify(rec.parent.slice(0, 20)))
  }
})

afterAll(() => vi.useRealTimers())

const done = k => rec[k].loops.filter(L => L.phases.done != null)

describe('Heads Up loop on the real engine', () => {
  it('runs at least three full loops on each phone', () => {
    expect(done('texting').length).toBeGreaterThanOrEqual(3)
    expect(done('scrolling').length).toBeGreaterThanOrEqual(3)
  })

  it('stays green through the calm screen', () => {
    for (const k of ['texting', 'scrolling']) for (const L of done(k)) {
      expect(L.ticks.filter(x => x.phase === 'calm' && x.light !== Light.GREEN)).toEqual([])
    }
  })

  it('goes yellow, then red, then offers the break', () => {
    for (const k of ['texting', 'scrolling']) for (const L of done(k)) {
      const y = L.ticks.find(x => x.light === Light.YELLOW)?.t
      const r = L.ticks.find(x => x.light === Light.RED)?.t
      expect(y).toBeTypeOf('number')
      expect(r).toBeGreaterThan(y)
      expect(L.nudge).toBeGreaterThanOrEqual(r - 0.01)
    }
  })

  it('texting calls out exactly Frantic typing and Constant backspacing, once each per loop', () => {
    for (const L of done('texting')) {
      expect(L.callouts.map(c => c.label).sort()).toEqual([SIGNAL.deletions, SIGNAL.medianGap].sort())
    }
  })

  it('scrolling calls out exactly Nervous scrolling and Scrolling back and forth, once each per loop', () => {
    for (const L of done('scrolling')) {
      expect(L.callouts.map(c => c.label).sort()).toEqual([SIGNAL.pxPerSec, SIGNAL.reversals].sort())
    }
  })

  it("never shows Can't put it down or Restless hand", () => {
    for (const k of ['texting', 'scrolling']) for (const L of rec[k].loops) {
      const seen = new Set(L.ticks.flatMap(x => x.signals))
      expect(seen.has(SIGNAL.minutes)).toBe(false)
      expect(seen.has(SIGNAL.motion)).toBe(false)
    }
  })

  it('never has both teen phones red at once', () => {
    expect(rec.both).toBe(0)
  })

  it('turns the parent red at least once per loop and back to green', () => {
    const reds = rec.parent.filter(p => p[1] === Light.RED).length
    expect(reds).toBeGreaterThanOrEqual(2 * 3)
  })

  it('loops both scenes in well under a minute', () => {
    expect(LOOP_MS).toBeLessThanOrEqual(50 * 1000)
    for (const k of ['texting', 'scrolling']) {
      const L = done(k)
      for (let i = 1; i < L.length; i++) expect(L[i].start - L[i - 1].start).toBeCloseTo(LOOP_MS / 1000, 0)
    }
  })

  it('each scene is about three seconds of usual use, then mostly the stressed use, in under 25 seconds', () => {
    for (const k of ['texting', 'scrolling']) for (const L of done(k)) {
      const calm = L.phases.stress - L.phases.calm
      const scene = L.phases.done - L.phases.calm
      expect(calm).toBeGreaterThanOrEqual(CALM_MS / 1000 - 0.1)
      expect(calm).toBeLessThanOrEqual(CALM_MS / 1000 + 1)
      expect(scene).toBeLessThan(25)
      expect((L.phases.done - L.phases.stress) / scene).toBeGreaterThan(0.75)
    }
  })

  it('holds on the moment of detection, with the notification up, before starting over', () => {
    for (const k of ['texting', 'scrolling']) for (const L of done(k)) {
      expect(L.phases.detected).toBeGreaterThanOrEqual(L.nudge - 0.01)
      expect(L.phases.done - L.phases.detected).toBeGreaterThanOrEqual(3)
    }
  })

  it('red still needs the engine minute: no sooner than a minute of session clock after the index first reads red', () => {
    for (const k of ['texting', 'scrolling']) for (const L of done(k)) {
      const hot = L.ticks.find(x => x.phase === 'stress' && x.index >= 70)?.t
      const r = L.ticks.find(x => x.light === Light.RED)?.t
      expect(r - hot).toBeGreaterThanOrEqual(RED_AFTER_MS / RATE / 1000 - 0.01)
    }
  })

  it('the two phones take turns: one scene never overlaps the other', () => {
    const spans = ['texting', 'scrolling'].flatMap(k => done(k).map(L => [L.phases.calm, L.phases.done]))
      .sort((a, b) => a[0] - b[0])
    for (let i = 1; i < spans.length; i++) expect(spans[i][0]).toBeGreaterThanOrEqual(spans[i - 1][1])
  })

  it('uses 4537 and never the retired 46876', () => {
    const ids = CLIPS.map(c => c.id)
    expect(ids).toContain('4537')
    expect(ids).not.toContain('46876')
  })
})
