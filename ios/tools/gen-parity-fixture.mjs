/* Writes the scorer parity fixture the Swift unit tests check against.
 *
 * The expected values come from running the repo's own src/signals/net.js, so
 * the fixture is the JS scorer's answer and not a second implementation of it.
 * Grid: every combination of five z-scores on each of the four inputs, which
 * visits both clamp limits, zero, and a point either side; then a seeded
 * pseudo-random draw over the clamped cube for the space between grid points.
 *
 *   node ios/tools/gen-parity-fixture.mjs
 */
import { writeFileSync } from 'node:fs'
import { run, reference, SIGNALS, ARCH, Z_LIMIT, PARAM_COUNT } from '../../src/signals/net.js'

const AXIS = [-3, -1.5, 0, 1.5, 3]

/* A small deterministic generator, so the fixture is reproducible without a
 * dependency. mulberry32. */
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const cases = []
const push = z => {
  const r = run(z)
  /* p is written at full double precision on purpose: rounding it here would
   * put a floor under the probability gap the Swift test asserts on, and that
   * floor would be larger than the arithmetic difference being measured. */
  cases.push({ z: z.map(v => Number(v.toFixed(6))), score: r.score, p: r.p,
    ref: reference(z).score })
}

for (const a of AXIS) for (const b of AXIS) for (const c of AXIS) for (const d of AXIS)
  push([a, b, c, d])

const rand = rng(20261012)
for (let i = 0; i < 375; i++)
  push(Array.from({ length: 4 }, () => Number((rand() * 6 - 3).toFixed(6))))

const fixture = {
  generatedBy: 'ios/tools/gen-parity-fixture.mjs against src/signals/net.js',
  signals: SIGNALS, arch: ARCH, zLimit: Z_LIMIT, paramCount: PARAM_COUNT,
  axis: AXIS, count: cases.length, cases,
}

const out = new URL('../MindMap/Tests/MindMapTests/Fixtures/net-parity.json', import.meta.url)
writeFileSync(out, JSON.stringify(fixture, null, 0) + '\n')
console.log(`${cases.length} cases, ${PARAM_COUNT} params, arch ${ARCH.join('x')}`)
console.log('wrote', out.pathname)
