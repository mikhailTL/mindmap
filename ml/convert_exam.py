"""Convert the PhysioNet wearable exam-stress dataset (10 students × 3 real
exams, Empatica E4) into MindMap-Patch 1 Hz telemetry. Same beat detection and
motion convention as convert_wesad.py (native 32 Hz E4, gain 6.8).

Label column: 1 = Midterm 1, 2 = Midterm 2, 3 = Final (no rest sessions exist).
One CSV per student per exam: S01_m1.csv etc.
"""
import os, sys, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import convert_wesad as cw

RAW, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
SESS = {"Midterm 1": 1, "Midterm 2": 2, "Final": 3}

def read_e4(path):
    with open(path) as f:
        t0 = float(f.readline().split(",")[0]); fs = float(f.readline().split(",")[0])
    x = np.loadtxt(path, delimiter=",", skiprows=2)
    return t0, int(round(fs)), x

def convert(student, sess, tag):
    d = f"{RAW}/{student}/{sess}"
    t0b, fsb, bvp = read_e4(f"{d}/BVP.csv")
    t0e, fse, eda = read_e4(f"{d}/EDA.csv")
    t0t, fst, temp = read_e4(f"{d}/TEMP.csv")
    t0a, fsa, acc = read_e4(f"{d}/ACC.csv")
    t0 = max(t0b, t0e, t0t, t0a)
    bvp = bvp[int((t0 - t0b) * fsb):]; eda = eda[int((t0 - t0e) * fse):]
    temp = temp[int((t0 - t0t) * fst):]; acc = acc[int((t0 - t0a) * fsa):]
    n_sec = min(len(bvp) // 64, len(eda) // 4, len(temp) // 4, len(acc) // 32)
    t_rr, rr = cw.beats_from_bvp(bvp.ravel())
    eda_s = cw.per_second_mean(eda.astype(float).reshape(-1, 1), 4, n_sec).ravel()
    temp_s = cw.per_second_mean(temp.astype(float).reshape(-1, 1), 4, n_sec).ravel()
    a = acc.astype(float)[: n_sec * 32] / 64.0
    mag = np.linalg.norm(a, axis=1)
    motion = np.abs(np.diff(mag, prepend=mag[0])).reshape(n_sec, 32).mean(1) * cw.MOTION_GAIN
    rows = []
    for s in range(n_sec):
        t = s + 1.0
        m_hr = (t_rr > t - cw.HR_TRAIL_S) & (t_rr <= t)
        m_hrv = (t_rr > t - cw.HRV_TRAIL_S) & (t_rr <= t)
        hr = 60000.0 / rr[m_hr].mean() if m_hr.sum() >= 3 else 0.0
        if m_hrv.sum() >= cw.MIN_BEATS:
            r = rr[m_hrv]; rmssd = float(np.sqrt(np.mean(np.diff(r) ** 2))); sdnn = float(np.std(r, ddof=1))
        else:
            rmssd = sdnn = 0.0
        rows.append((s * 1000, hr, rmssd, sdnn, 0.0, eda_s[s], temp_s[s], motion[s], 1, tag))
    arr = np.array(rows, dtype=float)
    name = f"{student}_{'m1' if tag == 1 else 'm2' if tag == 2 else 'final'}"
    np.savetxt(f"{OUT}/{name}.csv", arr, delimiter=",",
               fmt=["%d", "%.2f", "%.2f", "%.2f", "%.1f", "%.4f", "%.3f", "%.4f", "%d", "%d"],
               header="ms,hr_bpm,rmssd_ms,sdnn_ms,spo2_pct,eda_uS,temp_C,motion,contact,label", comments="")
    print(name, n_sec, "hr_valid %.2f" % (arr[:, 1] > 0).mean(), "median motion %.3f" % np.median(motion))

for student in sorted(os.listdir(RAW)):
    if not student.startswith("S"):
        continue
    for sess, tag in SESS.items():
        if os.path.isdir(f"{RAW}/{student}/{sess}"):
            convert(student, sess, tag)
