import * as fs from 'node:fs'
import { Baseline } from './engine/baseline'
import { evaluateWindow } from './engine/features'
import { NeuralScorer, neuralInput, neuralForward, fitCalibration, NEURAL_FEATURES, THRESHOLD_LOGIT, calibratedLogit } from './engine/neural'
import type { Sample } from './engine/types'
// One Non-EEG subject: build contributions, take 8 "triggered" labels, fit in TS, dump for the Python check.
const subj = process.argv[2] ?? 'Subject3'
const lines = fs.readFileSync(`telemetry_noneeg/${subj}.csv`, 'utf8').trim().split('\n').slice(1)
const S: Sample[] = [], L: number[] = []
for (const l of lines) { const p = l.split(',').map(Number); S.push({ ms: p[0], hr_bpm: p[1], rmssd_ms: p[2], sdnn_ms: p[3], spo2_pct: p[4], eda_uS: p[5], temp_C: p[6], motion: p[7], contact: p[8] ? 1 : 0 }); L.push(p[9]) }
const b = new Baseline(); const hist: number[][] = []
const rows: { c: number[]; t: number; y: number; logit: number }[] = []
for (let s = 0; s + 60 <= S.length; s += 30) {
  const win = S.slice(s, s + 60); const r = evaluateWindow(win, win[59].ms); if (!r.ok || !r.features) continue
  const lab = L[s + 30]
  if (b.ready && (lab === 1 || lab === 2)) {
    const x = neuralInput(r.features, b); const fw = neuralForward(x, hist)
    rows.push({ c: NEURAL_FEATURES.map((k) => fw.contributions[k]), t: fw.temporal, y: lab === 2 ? 1 : 0, logit: fw.logit })
    hist.push(x); if (hist.length > 8) hist.shift()
  }
  b.push(r.features)
}
const q = [...Array(rows.length).keys()].filter((i) => i % Math.floor(rows.length / 8) === 0).slice(0, 8)
const ex = q.map((i) => ({ contributions: rows[i].c, temporal: rows[i].t, label: rows[i].y as 0 | 1 }))
const cal = fitCalibration(ex)
const auc = (sc: number[], y: number[]) => { let n = 0, p = 0; for (let i = 0; i < y.length; i++) for (let j = 0; j < y.length; j++) if (y[i] === 1 && y[j] === 0) { n++; if (sc[i] > sc[j]) p++; else if (sc[i] === sc[j]) p += 0.5 } return p / n }
const rest = rows.map((_, i) => i).filter((i) => !q.includes(i))
const before = auc(rest.map((i) => rows[i].logit), rest.map((i) => rows[i].y))
const after = auc(rest.map((i) => calibratedLogit({ contributions: Object.fromEntries(NEURAL_FEATURES.map((k, j) => [k, rows[i].c[j]])) as any, temporal: rows[i].t }, cal)), rest.map((i) => rows[i].y))
console.log(subj, 'windows', rows.length, 'labels', ex.length, 'AUROC before', before.toFixed(3), 'after', after.toFixed(3))
fs.writeFileSync('results/calib_fixture.json', JSON.stringify({ examples: ex, cal, thr: THRESHOLD_LOGIT }))
