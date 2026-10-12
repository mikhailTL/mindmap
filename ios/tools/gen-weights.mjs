/* Writes ios/MindMap/Sources/MindMapKit/Resources/net-weights.json from the
 * repo's own src/signals/net-weights.js. The numbers are parsed out of the
 * generated JS module, never retyped. Rerun this after tools/net/train.py.
 *
 *   node ios/tools/gen-weights.mjs
 */
import { writeFileSync } from 'node:fs'
import { WEIGHTS } from '../../src/signals/net-weights.js'

const out = new URL('../MindMap/Sources/MindMapKit/Resources/net-weights.json', import.meta.url)
writeFileSync(out, JSON.stringify(WEIGHTS) + '\n')

const params = WEIGHTS.layers.reduce((a, l) => a + l.w.length + l.b.length, 0)
console.log(`arch ${WEIGHTS.arch.join('x')}  zLimit ${WEIGHTS.zLimit}  params ${params}`)
console.log('wrote', out.pathname)
