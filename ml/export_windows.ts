// Run the production MindMap engine (unchanged) over WESAD-derived telemetry.
// Emits one JSON per subject: per accepted window -> features, personal z-scores,
// the formula score, and the WESAD protocol label.
//
// Baseline protocol = the product's: a rolling personal median/MAD, warmed on the
// first accepted windows (which in WESAD are the resting "baseline" condition),
// then updated with every accepted window. Windows scored before the baseline is
// ready (fewer than 8 accepted windows) are emitted with ready=false.

import * as fs from 'node:fs'
import * as path from 'node:path'
import { Baseline, FEATURE_KEYS } from './engine/baseline'
import { evaluateWindow, evaluateWindowForDisplay } from './engine/features'
import { scoreWindow } from './engine/score'
import type { Sample } from './engine/types'

const IN = process.argv[2]
const OUT = process.argv[3]
fs.mkdirSync(OUT, { recursive: true })

const WINDOW_S = 60
const HOP_S = 30

function load(file: string): { samples: Sample[]; labels: number[] } {
  const lines = fs.readFileSync(file, 'utf8').trim().split('\n').slice(1)
  const samples: Sample[] = []
  const labels: number[] = []
  for (const line of lines) {
    const p = line.split(',').map(Number)
    samples.push({
      ms: p[0], hr_bpm: p[1], rmssd_ms: p[2], sdnn_ms: p[3], spo2_pct: p[4],
      eda_uS: p[5], temp_C: p[6], motion: p[7], contact: p[8] ? 1 : 0,
    })
    labels.push(p[9])
  }
  return { samples, labels }
}

function mode(a: number[]): { value: number; purity: number } {
  const c = new Map<number, number>()
  for (const v of a) c.set(v, (c.get(v) ?? 0) + 1)
  let best = -1, n = 0
  for (const [v, k] of c) if (k > n) { best = v; n = k }
  return { value: best, purity: n / a.length }
}

for (const f of fs.readdirSync(IN).filter((x) => x.endsWith('.csv')).sort()) {
  const subj = path.basename(f, '.csv')
  const { samples, labels } = load(path.join(IN, f))
  const baseline = new Baseline()
  const rows: any[] = []
  let rejected = { contact: 0, motion: 0, sparse: 0 }
  for (let start = 0; start + WINDOW_S <= samples.length; start += HOP_S) {
    const win = samples.slice(start, start + WINDOW_S)
    const tEnd = win[win.length - 1].ms
    // Display path scores through movement (cardiac terms damped); the strict
    // path decides what enters the personal baseline. Same split as the app.
    const strict = evaluateWindow(win, tEnd)
    const disp = evaluateWindowForDisplay(win, tEnd)
    if (!strict.ok) rejected[strict.reason!]++
    if (!disp.ok || !disp.features) continue
    const lab = mode(labels.slice(start, start + WINDOW_S))
    const ready = baseline.ready
    const res = scoreWindow(disp.features, baseline)
    const z = baseline.zAll(disp.features)
    rows.push({
      tEnd,
      label: lab.value,
      purity: lab.purity,
      ready,
      damped: !!disp.lowConfidence,
      n_baseline: baseline.n,
      features: disp.features,
      z,
      baseline_median: Object.fromEntries(FEATURE_KEYS.map((k) => [k, baseline.median(k)])),
      formula_score: res.score,
      formula_drivers: res.drivers.map((d) => d.key),
    })
    if (strict.ok && strict.features) baseline.push(strict.features)
  }
  fs.writeFileSync(path.join(OUT, `${subj}.json`), JSON.stringify({ subject: subj, rejected, rows }))
  const byLabel: Record<number, number[]> = {}
  for (const r of rows) if (r.ready && r.purity > 0.9 && !r.damped) (byLabel[r.label] ??= []).push(r.formula_score)
  const summary = Object.entries(byLabel)
    .map(([k, v]) => `${k}:${(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1)}(n=${v.length})`)
    .join(' ')
  console.log(`${subj} windows=${rows.length} rejected=${JSON.stringify(rejected)} meanScore ${summary}`)
}
