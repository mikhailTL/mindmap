import * as fs from 'node:fs'
import { neuralForward } from './engine/neural'
const fx = JSON.parse(fs.readFileSync('results/parity_fixtures.json', 'utf8'))
let maxErr = 0, maxC = 0
for (const f of fx) {
  const hist = f.seq.slice(0, -1)
  const r = neuralForward(f.x, hist)
  maxErr = Math.max(maxErr, Math.abs(r.logit - f.logit))
  const cs = Object.values(r.contributions) as number[]
  cs.forEach((c, i) => (maxC = Math.max(maxC, Math.abs(c - f.contrib[i]))))
  maxC = Math.max(maxC, Math.abs(r.temporal - f.temporal))
}
console.log('fixtures', fx.length, 'max |Δlogit|', maxErr.toExponential(2), 'max |Δcontribution|', maxC.toExponential(2))
