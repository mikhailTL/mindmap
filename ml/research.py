"""MindMap neural scorer — the research run.

A  WESAD leave-one-subject-out: formula vs linear vs NAM vs T-NAM vs black boxes
   (+ ablations by FEATSET, + amusement/meditation false-alarm rates).
B  Zero-shot transfer: train on all of WESAD (lab TSST), test on 20 new people in
   the PhysioNet Non-EEG protocol (cognitive stress, emotional stress, relax),
   with no HRV channel available (missing-sensor robustness).
C  The movement confound on real data: physical stress (walk/jog) windows —
   how often each scorer flags them, next to how often it catches cognitive stress.
D  Label-efficient personal calibration: a new person answers k check-ins; which
   windows to ask about (random / scheduled / signal-triggered) and how the
   calibration layer (affine / per-signal gains) closes the gap to an oracle.
E  In-the-wild functionality: 10 students × 3 real exams (PhysioNet), score
   trajectory within the exam, rejection rates, grade correlation (exploratory).

Writes results/research.json and the deployable weights.
"""
import json, os, sys
import numpy as np, torch
from scipy import stats
from sklearn.linear_model import LogisticRegression
from tnam import *

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "results"); os.makedirs(OUT, exist_ok=True)
FEATSET = os.environ.get("FEATSET", "full")
COLS = [ALLCOLS.index(c) for c in COLSETS[FEATSET]]
NF = len(COLS)
TEMP = 2.5  # display temperature (monotone)
BANDS = (40, 60, 78)
seed_all()

wesad = load_dir(os.path.join(ROOT, "windows"), COLS)
noneeg = load_dir(os.path.join(ROOT, "windows_noneeg"), COLS)
exam = load_dir(os.path.join(ROOT, "windows_exam"), COLS, key=lambda s: s["subject"])
print("WESAD", len(wesad), "Non-EEG", len(noneeg), "exam sessions", len(exam))
R = {"featset": FEATSET}

def band(score):
    return np.digitize(score, BANDS)

# ============================================================================
# A. WESAD LOSO
# ============================================================================
def wesad_binary(s, include_damped=False):
    return select(s, pos=(2,), neg=(1, 3), include_damped=include_damped)

MODELS = {
    "formula": None, "logreg": "logreg",
    "nam": lambda: TNAM(NF, temporal=False), "tnam": lambda: TNAM(NF, temporal=True),
    "mlp": lambda: MLP(NF), "gru": lambda: GRUBox(NF),
}
per = {m: [] for m in MODELS}
false_alarm = {m: {"amusement": [], "meditation": []} for m in MODELS}
loso_models = []
for i, held in enumerate(wesad):
    train = [s for j, s in enumerate(wesad) if j != i]
    val_ids = [(i + 1) % len(train), (i + 2) % len(train)]
    tr = [s for j, s in enumerate(train) if j not in val_ids]; va = [train[j] for j in val_ids]
    Xtr, Str, ytr, _, _ = concat([wesad_binary(s) for s in tr])
    Xva, Sva, yva, _, _ = concat([wesad_binary(s) for s in va])
    Xall, Sall, yall, fall, _ = concat([wesad_binary(s) for s in train])
    Xte, Ste, yte, fte, _ = wesad_binary(held)
    Xam, Sam, _, fam, _ = select(held, pos=(3,), neg=())
    Xme, Sme, _, fme, _ = select(held, pos=(4,), neg=())
    fold = {}
    for name, ctor in MODELS.items():
        if name == "formula":
            thr = youden(fall, yall); te, am, me = fte, fam, fme
        elif name == "logreg":
            lr = LogisticRegression(max_iter=3000, class_weight="balanced").fit(Xall, yall)
            thr = youden(lr.decision_function(Xall), yall)
            te, am, me = lr.decision_function(Xte), lr.decision_function(Xam), lr.decision_function(Xme)
        else:
            seed_all(SEED + i)
            m = fit(ctor(), Xtr, Str, ytr, Xva, Sva, yva)
            thr = youden(logits(m, Xall, Sall), yall)
            te, am, me = logits(m, Xte, Ste), logits(m, Xam, Sam), logits(m, Xme, Sme)
            if name == "tnam": fold["model"] = m
        r = metrics(te, yte, thr); r["subject"] = held["subject"]; per[name].append(r)
        if len(am): false_alarm[name]["amusement"].append(float((am >= thr).mean()))
        if len(me): false_alarm[name]["meditation"].append(float((me >= thr).mean()))
    loso_models.append(fold)
    print(f"A {held['subject']:4s} " + "  ".join(f"{n} {per[n][-1]['auroc']:.3f}/{per[n][-1]['f1']:.2f}" for n in MODELS))

R["A_wesad_loso"] = {n: dict(auroc=ci([r["auroc"] for r in per[n]]), f1=ci([r["f1"] for r in per[n]]), bacc=ci([r["bacc"] for r in per[n]]),
                             amusement_flagged=float(np.mean(false_alarm[n]["amusement"])), meditation_flagged=float(np.mean(false_alarm[n]["meditation"])))
                     for n in MODELS}
R["A_per_subject"] = [dict(subject=a["subject"], formula=a["auroc"], tnam=b["auroc"], formula_f1=a["f1"], tnam_f1=b["f1"]) for a, b in zip(per["formula"], per["tnam"])]
fa, ta = np.array([r["auroc"] for r in per["formula"]]), np.array([r["auroc"] for r in per["tnam"]])
ff, tf = np.array([r["f1"] for r in per["formula"]]), np.array([r["f1"] for r in per["tnam"]])
R["A_paired"] = dict(wins=int((ta > fa).sum()), ties=int((ta == fa).sum()), p=float(stats.wilcoxon(ta, fa).pvalue), gain=float((ta - fa).mean()),
                     f1_gain=float((tf - ff).mean()), f1_p=float(stats.wilcoxon(tf, ff).pvalue))
print("\nA summary:", {n: round(R["A_wesad_loso"][n]["auroc"]["mean"], 3) for n in MODELS}, R["A_paired"])
json.dump(rnd(R), open(os.path.join(OUT, f"research_{FEATSET}.json"), "w"))
if FEATSET != "full":
    sys.exit(0)

# ============================================================================
# Final model on all of WESAD (the deployable one)
# ============================================================================
va = wesad[-2:]; tr = wesad[:-2]
Xtr, Str, ytr, _, _ = concat([wesad_binary(s) for s in tr]); Xva, Sva, yva, _, _ = concat([wesad_binary(s) for s in va])
Xall, Sall, yall, fall, _ = concat([wesad_binary(s) for s in wesad])
seed_all(); final = fit(TNAM(NF), Xtr, Str, ytr, Xva, Sva, yva)
THR_LOGIT = youden(logits(final, Xall, Sall), yall)
THR_FORMULA = youden(fall, yall)
lr_all = LogisticRegression(max_iter=3000, class_weight="balanced").fit(Xall, yall)
THR_LR = youden(lr_all.decision_function(Xall), yall)
print(f"final: thr logit {THR_LOGIT:.3f} (p={sigmoid(THR_LOGIT):.3f}), formula thr {THR_FORMULA:.1f}, params {sum(p.numel() for p in final.parameters())}")

def lin(l): return dict(w=l.weight.detach().numpy().tolist(), b=l.bias.detach().numpy().tolist())
json.dump(dict(features=ALLCOLS, T=T, threshold=float(sigmoid(THR_LOGIT)), bias=float(final.bias.item()),
               shapes=[[lin(f.net[0]), lin(f.net[2]), lin(f.net[4])] for f in final.shapes],
               gru=dict(w_ih=final.gru.weight_ih_l0.detach().numpy().tolist(), w_hh=final.gru.weight_hh_l0.detach().numpy().tolist(),
                        b_ih=final.gru.bias_ih_l0.detach().numpy().tolist(), b_hh=final.gru.bias_hh_l0.detach().numpy().tolist()),
               head=lin(final.head)), open(os.path.join(OUT, "tnam_weights.json"), "w"))
grid = np.linspace(-4, 4, 81, dtype=np.float32)
with torch.no_grad():
    json.dump({name: dict(x=(grid if name != "motion" else np.linspace(0, 1, 81, dtype=np.float32)).tolist(),
                          y=final.shapes[k](torch.tensor(grid if name != "motion" else np.linspace(0, 1, 81, dtype=np.float32))[:, None]).numpy().ravel().tolist())
               for k, name in enumerate(ALLCOLS)}, open(os.path.join(OUT, "shape_functions.json"), "w"))
    idx = np.random.RandomState(0).choice(len(Xall), 20, replace=False)
    c, ct = final.contributions(torch.tensor(Xall[idx]), torch.tensor(Sall[idx])); lg = final(torch.tensor(Xall[idx]), torch.tensor(Sall[idx]))
json.dump([dict(x=Xall[i].tolist(), seq=Sall[i].tolist(), logit=float(lg[j]), contrib=c[j].tolist(), temporal=float(ct[j])) for j, i in enumerate(idx)],
          open(os.path.join(OUT, "parity_fixtures.json"), "w"))
R["univariate_auroc"] = {}
for k, name in enumerate(ALLCOLS):
    aucs = []
    for s in wesad:
        X, _, y, _, _ = wesad_binary(s)
        if len(np.unique(y)) > 1: aucs.append(roc_auc_score(y, X[:, k]))
    R["univariate_auroc"][name] = float(np.mean(aucs))

# ============================================================================
# B. Zero-shot transfer to Non-EEG (20 new people, different stressors, no HRV)
# ============================================================================
def score_all(s, include_damped=False, pos=(2, 3), neg=(1,)):
    X, S, y, f, t = select(s, pos=pos, neg=neg, include_damped=include_damped)
    return dict(formula=f, logreg=lr_all.decision_function(X) if len(X) else np.array([]), tnam=logits(final, X, S) if len(X) else np.array([]), y=y, t=t)

THR = dict(formula=THR_FORMULA, logreg=THR_LR, tnam=THR_LOGIT)
B = {"any_stress": {k: [] for k in THR}, "cognitive": {k: [] for k in THR}, "emotional": {k: [] for k in THR}}
for s in noneeg:
    for task, pos in (("any_stress", (2, 3)), ("cognitive", (2,)), ("emotional", (3,))):
        sc = score_all(s, pos=pos)
        for k in THR:
            if len(np.unique(sc["y"])) > 1:
                B[task][k].append(dict(subject=s["subject"], **metrics(sc[k], sc["y"], THR[k])))
R["B_transfer_noneeg"] = {task: {k: dict(auroc=ci([r["auroc"] for r in v]), f1=ci([r["f1"] for r in v]), bacc=ci([r["bacc"] for r in v])) for k, v in d.items()} for task, d in B.items()}
R["B_per_subject"] = [dict(subject=a["subject"], formula=a["auroc"], tnam=b["auroc"]) for a, b in zip(B["any_stress"]["formula"], B["any_stress"]["tnam"])]
ba = np.array([r["auroc"] for r in B["any_stress"]["formula"]]); bt = np.array([r["auroc"] for r in B["any_stress"]["tnam"]])
R["B_paired"] = dict(wins=int((bt > ba).sum()), p=float(stats.wilcoxon(bt, ba).pvalue), gain=float((bt - ba).mean()))
print("\nB zero-shot Non-EEG (any stress vs relax):", {k: round(R["B_transfer_noneeg"]["any_stress"][k]["auroc"]["mean"], 3) for k in THR}, R["B_paired"])
print("  cognitive:", {k: round(R["B_transfer_noneeg"]["cognitive"][k]["auroc"]["mean"], 3) for k in THR}, " emotional:", {k: round(R["B_transfer_noneeg"]["emotional"][k]["auroc"]["mean"], 3) for k in THR})

# ============================================================================
# C. The movement confound on real data
# ============================================================================
C = {k: {"physical_flagged": [], "cognitive_caught": [], "relax_flagged": []} for k in ("formula", "tnam_raw", "tnam_fallback")}
for s in noneeg:
    phys = select(s, pos=(4,), neg=(), include_damped=True)
    cog = select(s, pos=(2,), neg=(), include_damped=True)
    rel = select(s, pos=(1,), neg=(), include_damped=True)
    for name, (X, S, _, f, _) in (("physical_flagged", phys), ("cognitive_caught", cog), ("relax_flagged", rel)):
        if not len(X): continue
        damped = X[:, ALLCOLS.index("motion")] >= 1.0 - 1e-6 if "motion" in ALLCOLS else np.zeros(len(X), bool)
        fflag = f >= THR_FORMULA
        nflag = logits(final, X, S) >= THR_LOGIT
        C["formula"][name].append(float(fflag.mean()))
        C["tnam_raw"][name].append(float(nflag.mean()))
        C["tnam_fallback"][name].append(float(np.where(damped, fflag, nflag).mean()))
R["C_confound"] = {k: {n: float(np.mean(v)) for n, v in d.items()} for k, d in C.items()}
R["C_physical_windows_damped"] = float(np.mean([float((select(s, pos=(4,), neg=(), include_damped=True)[0][:, ALLCOLS.index("motion")] >= 1 - 1e-6).mean()) for s in noneeg if len(select(s, pos=(4,), neg=(), include_damped=True)[0])]))
print("\nC confound:", rnd(R["C_confound"], 3), "physical windows motion-damped:", round(R["C_physical_windows_damped"], 3))

# ============================================================================
# D. Label-efficient personal calibration
# ============================================================================
KS = [0, 2, 4, 6, 8, 12, 16, 24]
POLICIES = ["random", "scheduled", "triggered", "uncertainty"]
LAM = 0.5  # prior strength toward (a=1, b=0, g=1)

def calibrate(L, Cm, Ct, y, mode):
    """Fit a personal calibration on k labelled windows. L: base logits, Cm: per-feature
    contributions (n×F), Ct: temporal term. Returns a function logit' = f(L, Cm, Ct)."""
    if len(y) == 0 or mode == "none":
        return lambda L, Cm, Ct: L
    if mode == "scratch":
        # No population model at all: a personal logistic regression on the same
        # z-scores from the k labels alone (needs both classes).
        if len(np.unique(y)) < 2:
            return lambda L, Cm, Ct: L
        lr = LogisticRegression(max_iter=2000, C=0.5, class_weight="balanced").fit(Xq_holder[0], y)
        return lambda L, Cm, Ct: lr.decision_function(Xq_holder[1]) + THR_LOGIT
    yt = torch.tensor(y)[:, None]
    if mode == "affine":
        a = torch.ones(1, requires_grad=True); b = torch.zeros(1, requires_grad=True)
        params = [a, b]
        def f(L, Cm, Ct): return a * torch.tensor(L)[:, None] + b
        def prior(): return (a - 1) ** 2 + b ** 2
    else:  # gains: per-signal gain on contributions + temporal gain + offset
        g = torch.ones(Cm.shape[1], requires_grad=True); gt = torch.ones(1, requires_grad=True); b = torch.zeros(1, requires_grad=True)
        base_bias = float(final.bias.item())
        params = [g, gt, b]
        def f(L, Cm, Ct): return base_bias + (torch.tensor(Cm) * g).sum(1, keepdim=True) + gt * torch.tensor(Ct)[:, None] + b
        def prior(): return ((g - 1) ** 2).sum() + (gt - 1) ** 2 + b ** 2
    pos = max(1e-3, min(1 - 1e-3, float(y.mean())))
    lossf = torch.nn.BCEWithLogitsLoss(pos_weight=torch.tensor((1 - pos) / pos))
    opt = torch.optim.LBFGS(params, max_iter=50, line_search_fn="strong_wolfe")
    Lk, Cmk, Ctk = L, Cm, Ct
    def closure():
        opt.zero_grad(); loss = lossf(f(Lk, Cmk, Ctk) - THR_LOGIT, yt) + LAM * prior() / max(1, len(y)); loss.backward(); return loss
    opt.step(closure)
    with torch.no_grad():
        return lambda L, Cm, Ct: f(L, Cm, Ct).detach().numpy().ravel()

def pick(policy, L, t, k, rng):
    n = len(L)
    if k == 0 or n == 0: return np.array([], int)
    if policy == "random": return np.sort(rng.choice(n, min(k, n), replace=False))
    if policy == "scheduled": return np.unique(np.linspace(0, n - 1, min(k, n)).round().astype(int))
    if policy == "uncertainty": return np.sort(np.argsort(np.abs(L - THR_LOGIT))[:k])
    # triggered: ask when the displayed band changes, at most once per 2 min; fill with scheduled picks
    sc = 100 * sigmoid(L / TEMP); bd = band(sc)
    chosen, last = [], -1e9
    for i in range(1, n):
        if bd[i] != bd[i - 1] and t[i] - last >= 2.0:
            chosen.append(i); last = t[i]
            if len(chosen) >= k: break
    if len(chosen) < k:
        rest = [i for i in np.linspace(0, n - 1, k).round().astype(int) if i not in chosen]
        chosen += rest[: k - len(chosen)]
    return np.sort(np.array(chosen, int))

MODES = ("affine", "gains", "scratch")
Xq_holder = [None, None]
def run_D(subjects, task_pos, task_neg, name):
    out = {mode: {p: {k: [] for k in KS} for p in POLICIES} for mode in MODES}
    out_auc = {mode: {p: {k: [] for k in KS} for p in POLICIES} for mode in MODES}
    oracle = {mode: [] for mode in MODES}
    base = []; base_auc = []
    rng = np.random.RandomState(0)
    for s in subjects:
        X, S, y, f, t = select(s, pos=task_pos, neg=task_neg)
        if len(np.unique(y)) < 2 or len(y) < 30: continue
        with torch.no_grad():
            Cm, Ct = final.contributions(torch.tensor(X), torch.tensor(S)); Cm, Ct = Cm.numpy(), Ct.numpy().ravel()
        L = logits(final, X, S)
        bm = metrics(L, y, THR_LOGIT); base.append(bm["bacc"]); base_auc.append(bm["auroc"])
        for mode in MODES:
            Xq_holder[0] = X; Xq_holder[1] = X
            g = calibrate(L, Cm, Ct, y, mode)
            oracle[mode].append(metrics(g(L, Cm, Ct), y, THR_LOGIT)["bacc"])
            for p in POLICIES:
                for k in KS:
                    reps = 5 if p == "random" else 1
                    vals = []
                    for r in range(reps):
                        q = pick(p, L, t, k, rng)
                        rest = np.setdiff1d(np.arange(len(y)), q)
                        if len(np.unique(y[rest])) < 2: continue
                        Xq_holder[0] = X[q]; Xq_holder[1] = X[rest]
                        g = calibrate(L[q], Cm[q], Ct[q], y[q], mode) if k else (lambda L, Cm, Ct: L)
                        mm = metrics(g(L[rest], Cm[rest], Ct[rest]), y[rest], THR_LOGIT)
                        vals.append((mm["bacc"], mm["auroc"]))
                    if vals:
                        out[mode][p][k].append(float(np.mean([v[0] for v in vals])))
                        out_auc[mode][p][k].append(float(np.mean([v[1] for v in vals])))
    res = dict(base_bacc=ci(base), base_auroc=ci(base_auc), oracle={m: ci(v) for m, v in oracle.items()},
               curves={m: {p: {str(k): ci(v) for k, v in d.items()} for p, d in pd.items()} for m, pd in out.items()},
               curves_auroc={m: {p: {str(k): ci(v) for k, v in d.items()} for p, d in pd.items()} for m, pd in out_auc.items()})
    # labels needed to reach 95 % of the oracle gain
    for m in MODES:
        target = res["base_bacc"]["mean"] + 0.95 * (res["oracle"][m]["mean"] - res["base_bacc"]["mean"])
        res.setdefault("labels_to_95pct", {})[m] = {p: next((k for k in KS if res["curves"][m][p][str(k)]["mean"] >= target), None) for p in POLICIES}
    print(f"\nD {name}: base bAcc {res['base_bacc']['mean']:.3f}  oracle affine {res['oracle']['affine']['mean']:.3f} gains {res['oracle']['gains']['mean']:.3f}")
    for m in MODES:
        for p in POLICIES:
            print(f"   {m:7s} {p:11s} " + " ".join(f"k{k}:{res['curves'][m][p][str(k)]['mean']:.3f}" for k in KS) + f"   95%@{res['labels_to_95pct'][m][p]}")
            print(f"   {'':7s} {'auroc':11s} " + " ".join(f"k{k}:{res['curves_auroc'][m][p][str(k)]['mean']:.3f}" for k in KS))
    return res

R["D_calibration_noneeg"] = run_D(noneeg, (2, 3), (1,), "Non-EEG any stress vs relax (zero-shot base)")
R["D_calibration_noneeg_cognitive"] = run_D(noneeg, (2,), (1,), "Non-EEG cognitive vs relax (zero-shot base)")
R["D_calibration_wesad"] = run_D(wesad, (2,), (1, 3), "WESAD (in-distribution base; sanity)")

# ============================================================================
# E. Real exams
# ============================================================================
grades = {}
for sess, tag, denom in (("MIDTERM 1", 1, 100), ("MIDTERM 2", 2, 100), ("FINAL", 3, 200)):
    pass
GR = {"S1": (78, 82, 182), "S2": (82, 85, 180), "S3": (77, 90, 188), "S4": (75, 77, 149), "S5": (67, 77, 157),
      "S6": (71, 64, 175), "S7": (64, 33, 110), "S8": (92, 88, 184), "S9": (80, 39, 126), "S10": (89, 64, 116)}
E_rows = []
for s in exam:
    X, S, y, f, t = select(s, pos=(1, 2, 3), neg=())
    if len(X) < 20: continue
    L = logits(final, X, S); sc = 100 * sigmoid(L / TEMP)
    thirds = np.array_split(np.arange(len(sc)), 3)
    student, sess = s["subject"].split("_")
    tag = {"m1": 0, "m2": 1, "final": 2}[sess]
    grade = GR[student][tag] / (200 if tag == 2 else 100)
    E_rows.append(dict(session=s["subject"], n=int(len(sc)), rejected_motion=float(s["damped"].mean()),
                       neural_thirds=[float(sc[i].mean()) for i in thirds], formula_thirds=[float(f[i].mean()) for i in thirds],
                       neural_flagged=float((L >= THR_LOGIT).mean()), formula_flagged=float((f >= THR_FORMULA).mean()), grade=grade))
R["E_exams"] = dict(sessions=E_rows,
                    neural_thirds_mean=[float(np.mean([r["neural_thirds"][i] for r in E_rows])) for i in range(3)],
                    formula_thirds_mean=[float(np.mean([r["formula_thirds"][i] for r in E_rows])) for i in range(3)],
                    neural_flagged=float(np.mean([r["neural_flagged"] for r in E_rows])), formula_flagged=float(np.mean([r["formula_flagged"] for r in E_rows])),
                    motion_rejected=float(np.mean([r["rejected_motion"] for r in E_rows])))
sp = stats.spearmanr([r["neural_flagged"] for r in E_rows], [r["grade"] for r in E_rows])
R["E_exams"]["spearman_flagged_vs_grade"] = dict(rho=float(sp.statistic), p=float(sp.pvalue), n=len(E_rows))
print("\nE exams:", rnd({k: v for k, v in R["E_exams"].items() if k != "sessions"}, 3))

json.dump(rnd(R), open(os.path.join(OUT, "research_full.json"), "w"))
print("\nwrote results/research_full.json")
