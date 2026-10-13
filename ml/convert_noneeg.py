"""Convert the PhysioNet Non-EEG dataset (20 subjects; E4 ACC/temp/EDA at 8 Hz,
Nonin HR at 1 Hz) into MindMap-Patch 1 Hz telemetry with protocol labels.

Labels: 1 Relax · 2 CognitiveStress · 3 EmotionalStress · 4 PhysicalStress
rmssd/sdnn are not measurable here (no BVP) and are written as 0 = missing,
exactly what the patch streams before its RR buffer fills.
"""
import os, sys, numpy as np, wfdb

RAW, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
LAB = {"Relax": 1, "CognitiveStress": 2, "EmotionalStress": 3, "PhysicalStress": 4}
FS = 8
MOTION_GAIN = float(os.environ.get("MOTION_GAIN", "40"))

def convert(subj):
    r = wfdb.rdrecord(f"{RAW}/{subj}_AccTempEDA")
    a = wfdb.rdann(f"{RAW}/{subj}_AccTempEDA", "atr")
    h = wfdb.rdrecord(f"{RAW}/{subj}_SpO2HR").p_signal
    x = r.p_signal
    n_sec = min(len(x) // FS, len(h))
    labels = np.zeros(len(x), dtype=int)
    for s, note in zip(a.sample, a.aux_note):
        labels[s:] = LAB.get(note.strip(), 0)
    mag = np.linalg.norm(x[:, :3], axis=1)
    # Upsample |acc| to 32 Hz so the per-sample first difference is on the same
    # scale as the E4-derived WESAD telemetry (32 Hz), then average per second.
    t8 = np.arange(len(mag)) / FS
    t32 = np.arange(n_sec * 32) / 32
    mag32 = np.interp(t32, t8, mag)
    # Gain puts resting motion at ~0.04, the engine's convention (8 Hz source
    # interpolated to 32 Hz rests near 0.001, hence 40; WESAD native 32 Hz uses 6.8).
    motion = np.abs(np.diff(mag32, prepend=mag32[0])).reshape(n_sec, 32).mean(1) * MOTION_GAIN
    eda = x[: n_sec * FS, 4].reshape(n_sec, FS).mean(1)
    temp = x[: n_sec * FS, 3].reshape(n_sec, FS).mean(1)
    lab = labels[: n_sec * FS].reshape(n_sec, FS)[:, FS // 2]
    hr = h[:n_sec, 1]
    hr = np.where((hr > 30) & (hr < 220), hr, 0.0)
    rows = np.column_stack([
        np.arange(n_sec) * 1000, hr, np.zeros(n_sec), np.zeros(n_sec), h[:n_sec, 0],
        eda, temp, motion, np.ones(n_sec), lab,
    ])
    np.savetxt(f"{OUT}/{subj}.csv", rows, delimiter=",",
               fmt=["%d", "%.2f", "%.2f", "%.2f", "%.1f", "%.4f", "%.3f", "%.4f", "%d", "%d"],
               header="ms,hr_bpm,rmssd_ms,sdnn_ms,spo2_pct,eda_uS,temp_C,motion,contact,label", comments="")
    by = {k: round(float(np.median(motion[lab == v])), 4) for k, v in LAB.items() if (lab == v).any()}
    print(subj, n_sec, "median motion", by)

for i in range(1, 21):
    convert(f"Subject{i}")
