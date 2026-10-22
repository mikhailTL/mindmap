"""Convert WESAD Empatica E4 wrist streams into MindMap-Patch 1 Hz telemetry.

Output per subject: ml/telemetry/S<N>.csv with the patch contract
    ms, hr_bpm, rmssd_ms, sdnn_ms, spo2_pct, eda_uS, temp_C, motion, contact
plus a trailing `label` column (WESAD protocol label, mode over the second).

0 in a physiological field means "not yet computed", exactly as the firmware.
"""
import os, sys, pickle, numpy as np
from scipy.signal import butter, filtfilt, find_peaks

RAW = sys.argv[1]
OUT = sys.argv[2]
os.makedirs(OUT, exist_ok=True)

FS_BVP, FS_ACC, FS_EDA, FS_TEMP, FS_LAB = 64, 32, 4, 4, 700
HR_TRAIL_S, HRV_TRAIL_S, MIN_BEATS = 8, 60, 10
MOTION_GAIN = float(os.environ.get("MOTION_GAIN", "6.8"))

def bandpass(x, fs, lo=0.5, hi=4.0, order=3):
    b, a = butter(order, [lo / (fs / 2), hi / (fs / 2)], btype="band")
    return filtfilt(b, a, x)

def beats_from_bvp(bvp):
    f = bandpass(bvp, FS_BVP)
    # Normalise by a rolling RMS (4 s) so quiet, low-amplitude pulse segments
    # are detected with the same prominence rule as noisy high-amplitude ones.
    k = np.ones(FS_BVP * 4) / (FS_BVP * 4)
    rms = np.sqrt(np.convolve(f * f, k, mode="same")) + 1e-6
    fn = f / rms
    peaks, _ = find_peaks(fn, distance=int(FS_BVP * 0.33), prominence=0.6)
    t = peaks / FS_BVP
    rr = np.diff(t) * 1000.0
    t_rr = t[1:]
    ok = (rr > 300) & (rr < 2000)
    # Reject beats whose RR deviates > 30% from the running median of the
    # last 8 accepted RRs (standard ectopic/artifact rule for wrist PPG).
    keep = np.zeros_like(ok)
    recent = []
    last_t = -1e9
    for i in range(len(rr)):
        if not ok[i]:
            continue
        if t_rr[i] - last_t > 3.0:
            recent = []  # lost the pulse: re-acquire rather than stay locked
        last_t = t_rr[i]
        ref = np.median(recent) if len(recent) >= 3 else None
        if ref is None or abs(rr[i] - ref) / ref < 0.30:
            keep[i] = True
            recent.append(rr[i])
            if len(recent) > 8:
                recent.pop(0)
    return t_rr[keep], rr[keep]

def per_second_mean(x, fs, n_sec):
    x = x[: n_sec * fs].reshape(n_sec, fs, -1)
    return x.mean(axis=1)

def mode_rows(a):
    out = np.zeros(a.shape[0], dtype=int)
    for i, row in enumerate(a):
        v, c = np.unique(row, return_counts=True)
        out[i] = v[np.argmax(c)]
    return out

def convert(subj):
    d = pickle.load(open(f"{RAW}/{subj}/{subj}.pkl", "rb"), encoding="latin1")
    w = d["signal"]["wrist"]
    lab = d["label"]
    n_sec = min(
        len(w["BVP"]) // FS_BVP, len(w["ACC"]) // FS_ACC,
        len(w["EDA"]) // FS_EDA, len(w["TEMP"]) // FS_TEMP, len(lab) // FS_LAB,
    )
    t_rr, rr = beats_from_bvp(w["BVP"].ravel())
    eda = per_second_mean(w["EDA"].astype(float), FS_EDA, n_sec).ravel()
    temp = per_second_mean(w["TEMP"].astype(float), FS_TEMP, n_sec).ravel()
    acc = w["ACC"].astype(float)[: n_sec * FS_ACC] / 64.0  # 1/64 g units -> g
    mag = np.linalg.norm(acc, axis=1)
    dmag = np.abs(np.diff(mag, prepend=mag[0])).reshape(n_sec, FS_ACC)
    # Motion gain: the patch expresses motion in units where a resting body sits
    # near 0.04 (the synth/engine convention). Native E4 32 Hz |Δg| rests near
    # 0.006, so a fixed gain of 6.8 puts both datasets on the engine's scale.
    motion = dmag.mean(axis=1) * MOTION_GAIN
    labels = mode_rows(lab[: n_sec * FS_LAB].reshape(n_sec, FS_LAB))

    rows = []
    for s in range(n_sec):
        t = s + 1.0
        m_hr = (t_rr > t - HR_TRAIL_S) & (t_rr <= t)
        m_hrv = (t_rr > t - HRV_TRAIL_S) & (t_rr <= t)
        hr = 60000.0 / rr[m_hr].mean() if m_hr.sum() >= 3 else 0.0
        if m_hrv.sum() >= MIN_BEATS:
            r = rr[m_hrv]
            rmssd = float(np.sqrt(np.mean(np.diff(r) ** 2)))
            sdnn = float(np.std(r, ddof=1))
        else:
            rmssd = sdnn = 0.0
        rows.append((s * 1000, hr, rmssd, sdnn, 0.0, eda[s], temp[s], motion[s], 1, labels[s]))
    arr = np.array(rows, dtype=float)
    np.savetxt(
        f"{OUT}/{subj}.csv", arr, delimiter=",",
        fmt=["%d", "%.2f", "%.2f", "%.2f", "%.1f", "%.4f", "%.3f", "%.4f", "%d", "%d"],
        header="ms,hr_bpm,rmssd_ms,sdnn_ms,spo2_pct,eda_uS,temp_C,motion,contact,label", comments="",
    )
    valid = (arr[:, 1] > 0).mean()
    by = {int(k): float(np.median(motion[labels == k])) for k in (1, 2, 3, 4) if (labels == k).any()}
    print(f"{subj}: {n_sec}s  hr_valid={valid:.2f}  median motion by label={by}")

if __name__ == "__main__":
    subs = sorted([s for s in os.listdir(RAW) if s.startswith("S")], key=lambda s: int(s[1:]))
    for s in subs:
        convert(s)
