# ml: the neural Mind Score

Temporal Neural Additive Model (T-NAM) on the engine's personal z-scores, with a per-person
calibration layer fitted from check-ins. Evaluated against the production z-score formula
(`src/engine/score.ts`) on three public datasets.

```
python3 convert_wesad.py  <WESAD dir>  telemetry          # E4 wrist -> MindMap-Patch 1 Hz CSV (+label)
python3 convert_noneeg.py <Non-EEG dir> telemetry_noneeg  # PhysioNet Non-EEG (20 people, no BVP)
python3 convert_exam.py   <exam Data dir> telemetry_exam  # PhysioNet wearable exam stress (10 × 3 exams)
npx tsx export_windows.ts telemetry        windows        # the real TS engine: windows, z, formula score
npx tsx export_windows.ts telemetry_noneeg windows_noneeg
npx tsx export_windows.ts telemetry_exam   windows_exam
python3 research.py                                       # experiments A to E -> results/research_full.json + weights
FEATSET=ppg_only python3 research.py                      # ablations (nomotion / ppg_only / eda_only)
npx tsx parity.ts                                         # PyTorch vs TypeScript forward pass, max |Δ| ~5e-6
npx tsx calib_parity.ts Subject3                          # TS gradient-descent calibration == L-BFGS optimum
```

Experiments (see research.py header): A WESAD LOSO · B zero-shot transfer to Non-EEG ·
C movement confound on real data · D label-efficient personal calibration (query policy ×
calibration layer × budget) · E 30 real exams. Datasets are not committed (WESAD 2.1 GB from
uni-siegen; Non-EEG and exam sets from physionet.org).

Motion convention: the engine reads motion in units where a resting wrist sits near 0.04
(synth spec). Native 32 Hz E4 |Δg| rests near 0.006 → gain 6.8 (WESAD, exams); the 8 Hz
Non-EEG stream interpolated to 32 Hz rests near 0.001 → gain 40. Stated in each converter.

---

## Where this sits relative to the app

This directory is the training and evaluation code for the Mind Score model. It
is committed here so that the model in the app is auditable end to end: the
weights the browser loads (`src/signals/tnam-weights.js`) and the figures the
site prints (`src/signals/tnam-results.js`) are generated from
`results/tnam_weights.json` and `results/research_full.json`, which
`research.py` writes.

The Python here runs standalone: `tnam.py` is the model, `research.py` is the
run, and the three `convert_*.py` scripts turn each public dataset into the 1 Hz
telemetry CSV the pipeline expects.

Two files are TypeScript and belong to the sibling research repository rather
than to this React app: `export_windows.ts` and `parity.ts` call the
TypeScript signal engine (`src/engine/`) in that repo to produce windows and to
check the PyTorch and TypeScript forward passes agree to about 5e-6. They are
included because they are how the parity claim was verified, not because they
run from here.

**The datasets are not committed and must not be.** WESAD is 2.1 GB and
licensed from Universität Siegen; the Non-EEG and exam sets come from
PhysioNet. The converters take the dataset directory as an argument.
