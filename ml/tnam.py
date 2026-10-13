"""Shared model, data and metric code for the MindMap neural scorer experiments."""
import json, os, math, random
import numpy as np, torch, torch.nn as nn
from sklearn.metrics import roc_auc_score, f1_score, balanced_accuracy_score, roc_curve
from scipy import stats

FEATS = ["rmssd", "sdnn", "pnn50", "lfhf", "hr", "edaTonic", "edaPhasic", "scrPerMin", "tempSlope"]
ALLCOLS = FEATS + ["motion"]
COLSETS = {
    "full": ALLCOLS,
    "nomotion": FEATS,
    "ppg_only": ["rmssd", "sdnn", "pnn50", "lfhf", "hr", "motion"],
    "eda_only": ["edaTonic", "edaPhasic", "scrPerMin"],
}
T = 8  # temporal context: 8 windows × 30 s hop = 4 min
SEED = 7

def seed_all(s=SEED):
    torch.manual_seed(s); np.random.seed(s); random.seed(s)

# ----------------------------------------------------------------------------
# Data
# ----------------------------------------------------------------------------
def load_subject(path, cols=None):
    cols = cols or list(range(len(ALLCOLS)))
    d = json.load(open(path))
    rows = d["rows"]
    Z = np.array([[r["z"][k] for k in FEATS] for r in rows], dtype=np.float32)
    motion = np.array([r["features"]["motion"] for r in rows], dtype=np.float32)
    motion = np.clip(motion / 0.35, 0, 1)[:, None]
    X = np.concatenate([Z, motion], axis=1)[:, cols]
    seq = np.zeros((len(rows), T, X.shape[1]), dtype=np.float32)
    for i in range(len(rows)):
        for j in range(T):
            k = i - (T - 1 - j)
            if k >= 0:
                seq[i, j] = X[k]
    return dict(
        subject=d["subject"], X=X, seq=seq,
        y=np.array([r["label"] for r in rows]),
        t=np.array([r["tEnd"] for r in rows], dtype=np.float64) / 60000.0,
        keep=np.array([r["ready"] and r["purity"] > 0.9 for r in rows]),
        damped=np.array([bool(r.get("damped", False)) for r in rows]),
        formula=np.array([r["formula_score"] for r in rows], dtype=np.float32),
    )

def load_dir(path, cols=None, key=lambda s: int("".join(c for c in s["subject"] if c.isdigit()) or 0)):
    subs = [load_subject(os.path.join(path, f), cols) for f in sorted(os.listdir(path)) if f.endswith(".json")]
    return sorted(subs, key=key)

def select(s, pos, neg, include_damped=False):
    """Windows of one subject for a binary task. Returns X, seq, y, formula, t."""
    m = s["keep"] & np.isin(s["y"], list(pos) + list(neg))
    if not include_damped:
        m &= ~s["damped"]
    return s["X"][m], s["seq"][m], np.isin(s["y"][m], list(pos)).astype(np.float32), s["formula"][m], s["t"][m]

def concat(parts):
    return [np.concatenate(p) for p in zip(*parts)]

# ----------------------------------------------------------------------------
# Models
# ----------------------------------------------------------------------------
class ShapeFn(nn.Module):
    def __init__(self, h=16):
        super().__init__()
        self.net = nn.Sequential(nn.Linear(1, h), nn.ReLU(), nn.Linear(h, h), nn.ReLU(), nn.Linear(h, 1))
    def forward(self, x):
        return self.net(x)

class TNAM(nn.Module):
    """Additive: logit = b + Σ_k f_k(z_k) + g(seq). Each term is a driver."""
    def __init__(self, n_feat, h=16, gru_h=16, temporal=True):
        super().__init__()
        self.shapes = nn.ModuleList([ShapeFn(h) for _ in range(n_feat)])
        self.temporal = temporal
        if temporal:
            self.gru = nn.GRU(n_feat, gru_h, batch_first=True)
            self.head = nn.Linear(gru_h, 1)
        self.bias = nn.Parameter(torch.zeros(1))
    def contributions(self, x, seq):
        c = torch.cat([f(x[:, k:k+1]) for k, f in enumerate(self.shapes)], dim=1)
        if self.temporal:
            _, hN = self.gru(seq)
            ct = self.head(hN[-1])
        else:
            ct = torch.zeros(x.shape[0], 1)
        return c, ct
    def forward(self, x, seq):
        c, ct = self.contributions(x, seq)
        return self.bias + c.sum(1, keepdim=True) + ct

class MLP(nn.Module):
    def __init__(self, n_in, h=32):
        super().__init__()
        self.net = nn.Sequential(nn.Linear(n_in, h), nn.ReLU(), nn.Linear(h, h), nn.ReLU(), nn.Linear(h, 1))
    def forward(self, x, seq):
        return self.net(x)

class GRUBox(nn.Module):
    def __init__(self, n_in, h=32):
        super().__init__()
        self.gru = nn.GRU(n_in, h, batch_first=True); self.head = nn.Linear(h, 1)
    def forward(self, x, seq):
        _, hN = self.gru(seq); return self.head(hN[-1])

def fit(model, X, S, y, Xv, Sv, yv, epochs=120, lr=3e-3, wd=1e-4, l2c=1e-3, patience=15, drop=0.1):
    X, S, y = map(torch.tensor, (X, S, y[:, None]))
    Xv, Sv, yv = map(torch.tensor, (Xv, Sv, yv[:, None]))
    pos = y.mean().clamp(1e-3, 1 - 1e-3)
    lossf = nn.BCEWithLogitsLoss(pos_weight=(1 - pos) / pos)
    opt = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=wd)
    best, best_state, bad = 1e9, None, 0
    n = len(X)
    for _ in range(epochs):
        model.train()
        perm = torch.randperm(n)
        for i in range(0, n, 64):
            idx = perm[i:i+64]
            xb, sb = X[idx], S[idx]
            if isinstance(model, TNAM) and drop > 0:
                # Channel dropout: a missing sensor degrades the score, never breaks it.
                xb = xb * (torch.rand_like(xb) > drop).float()
            loss = lossf(model(xb, sb), y[idx])
            if isinstance(model, TNAM):
                c, ct = model.contributions(xb, sb)
                loss = loss + l2c * (c.pow(2).mean() + ct.pow(2).mean())
            opt.zero_grad(); loss.backward(); opt.step()
        model.eval()
        with torch.no_grad():
            vl = lossf(model(Xv, Sv), yv).item()
        if vl < best - 1e-4:
            best, bad = vl, 0
            best_state = {k: v.clone() for k, v in model.state_dict().items()}
        else:
            bad += 1
            if bad >= patience:
                break
    model.load_state_dict(best_state)
    return model

def logits(model, X, S):
    model.eval()
    with torch.no_grad():
        return model(torch.tensor(X), torch.tensor(S)).numpy().ravel()

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

# ----------------------------------------------------------------------------
# Metrics
# ----------------------------------------------------------------------------
def youden(scores, y):
    fpr, tpr, thr = roc_curve(y, scores)
    return float(thr[np.argmax(tpr - fpr)])

def metrics(scores, y, thr):
    pred = (scores >= thr).astype(int)
    return dict(
        auroc=float(roc_auc_score(y, scores)) if len(np.unique(y)) > 1 else float("nan"),
        f1=float(f1_score(y, pred, zero_division=0)),
        bacc=float(balanced_accuracy_score(y, pred)) if len(np.unique(y)) > 1 else float("nan"),
    )

def ci(a):
    a = np.array(a, dtype=float); a = a[~np.isnan(a)]
    if len(a) < 2:
        return dict(mean=float(a.mean()) if len(a) else float("nan"), lo=float("nan"), hi=float("nan"), n=int(len(a)))
    m = a.mean(); h = stats.t.ppf(0.975, len(a) - 1) * a.std(ddof=1) / math.sqrt(len(a))
    return dict(mean=float(m), lo=float(m - h), hi=float(m + h), n=int(len(a)))

def rnd(o, nd=4):
    if isinstance(o, float): return round(o, nd)
    if isinstance(o, dict): return {k: rnd(v, nd) for k, v in o.items()}
    if isinstance(o, (list, tuple)): return [rnd(x, nd) for x in o]
    return o
