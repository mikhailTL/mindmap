"""Fits the Mind Score network and writes src/signals/net-weights.js.

The network takes the four patch signals as z-scores against the wearer's own
fourteen-day baseline and returns one number between 0 and 100.

It is fitted here against the reference model in `reference()` below, which is
the published-coefficient blend the rest of the app documents: a weighted sum
of the three autonomic signals, scaled by a movement gate, through a logistic.
Fitting a network to a model rather than to people is deliberate and is the
only honest thing to do before there is data. It buys two things now:

  * the gate makes the reference non-linear in its inputs, so the fitted
    network is doing real work rather than rediscovering a dot product, and
  * when labelled readings exist, `samples()` is replaced by the measured set
    and nothing else in this file or in the app has to change.

Usage:  python3 tools/net/train.py            (writes the weights file)
        python3 tools/net/train.py --check    (reports error, writes nothing)
"""

import argparse, json, pathlib, sys
import numpy as np

ARCH = [4, 16, 10, 1]            # heart, sweat, temp, movement -> one score
Z_LIMIT = 3.0                 # z-scores are clamped to +-3 before they reach the net
SEED = 7

# ── The reference model ──────────────────────────────────────────────────────
# Signs carry direction, and every one of them is a starting allocation rather
# than a fitted value:
#   beat-to-beat variation falls under load          -> heart z is stress-signed, +
#   skin conductance rises under load                -> +
#   skin temperature falls under load                -> -
# Movement is not a term. It is a gate: as a reading gets more active, the
# other three are increasingly explained by exertion, so their contribution is
# pulled toward zero rather than counted as stress. That product is what a
# linear model cannot express.
W = np.array([1.3, 1.0, -0.8])
K = 2.4
GATE_AT, GATE_SHARPNESS = 1.2, 3.0


def reference(z):
    """z: (n, 4) -> (n,) in (0, 1). Multiply by 100 for the Mind Score."""
    gate = 1.0 / (1.0 + np.exp(GATE_SHARPNESS * (z[:, 3] - GATE_AT)))
    s = gate * (z[:, :3] @ W) / np.abs(W).sum() / 2.0
    return 1.0 / (1.0 + np.exp(-K * s))


def samples(n, rng):
    """Inputs the network must get right.

    Half uniform over the whole clamped cube, so no corner is unvisited, and
    half from a standard normal, which is where a real day actually sits.
    """
    half = n // 2
    grid = rng.uniform(-Z_LIMIT, Z_LIMIT, size=(half, ARCH[0]))
    lived = np.clip(rng.normal(0.0, 1.0, size=(n - half, ARCH[0])), -Z_LIMIT, Z_LIMIT)
    return np.vstack([grid, lived])


# ── The network ──────────────────────────────────────────────────────────────
def init(rng):
    p = []
    for a, b in zip(ARCH, ARCH[1:]):
        p.append([rng.normal(0, np.sqrt(1.0 / a), (a, b)), np.zeros(b)])
    return p


def forward(p, x):
    acts = [x]
    h = x
    for i, (w, b) in enumerate(p):
        h = h @ w + b
        h = 1.0 / (1.0 + np.exp(-h)) if i == len(p) - 1 else np.tanh(h)
        acts.append(h)
    return acts


def backward(p, acts, y):
    n = y.shape[0]
    out = acts[-1][:, 0]
    # d(MSE)/d(pre-activation of a logistic output), the usual cancellation
    d = ((out - y) * out * (1 - out) * 2.0 / n)[:, None]
    grads = [None] * len(p)
    for i in range(len(p) - 1, -1, -1):
        grads[i] = [acts[i].T @ d, d.sum(0)]
        if i:
            d = (d @ p[i][0].T) * (1 - acts[i] ** 2)
    return grads


def fit(steps=40000, batch=4096, lr=0.02, quiet=False):
    rng = np.random.default_rng(SEED)
    p = init(rng)
    m = [[np.zeros_like(a) for a in layer] for layer in p]
    v = [[np.zeros_like(a) for a in layer] for layer in p]
    b1, b2, eps = 0.9, 0.999, 1e-8
    for t in range(1, steps + 1):
        x = samples(batch, rng)
        y = reference(x)
        acts = forward(p, x)
        grads = backward(p, acts, y)
        step_lr = lr * (0.05 ** (t / steps))          # decayed, or the worst
        for i in range(len(p)):                          # corner never settles
            for j in range(2):
                m[i][j] = b1 * m[i][j] + (1 - b1) * grads[i][j]
                v[i][j] = b2 * v[i][j] + (1 - b2) * grads[i][j] ** 2
                mh = m[i][j] / (1 - b1 ** t)
                vh = v[i][j] / (1 - b2 ** t)
                p[i][j] -= step_lr * mh / (np.sqrt(vh) + eps)
        if not quiet and t % 10000 == 0:
            e = np.abs(forward(p, x)[-1][:, 0] - y) * 100
            print(f"  step {t:>6}  mean {e.mean():.3f}  max {e.max():.3f}", file=sys.stderr)
    return p


def error(p, rng):
    """Worst case over a dense grid plus a large random draw, in score points."""
    axis = np.linspace(-Z_LIMIT, Z_LIMIT, 17)
    grid = np.stack(np.meshgrid(*[axis] * ARCH[0], indexing="ij"), -1).reshape(-1, ARCH[0])
    draw = samples(400_000, rng)
    x = np.vstack([grid, draw])
    e = np.abs(forward(p, x)[-1][:, 0] - reference(x)) * 100
    return {"mean": float(e.mean()), "p99": float(np.percentile(e, 99)), "max": float(e.max()),
            "points": int(x.shape[0])}


def emit(p, err):
    r = lambda a: [round(float(v), 6) for v in np.asarray(a).ravel()]
    body = {
        "arch": ARCH,
        "zLimit": Z_LIMIT,
        "layers": [{"w": r(w), "b": r(b)} for w, b in p],
    }
    return (
        "/* Generated by tools/net/train.py. Do not edit by hand: rerun the\n"
        " * script, which also re-measures the error quoted below.\n"
        " *\n"
        f" * Fit against the reference model in that script over {err['points']:,} points:\n"
        f" *   mean {err['mean']:.3f}, 99th percentile {err['p99']:.3f}, worst {err['max']:.3f}\n"
        " * score points out of 100.\n"
        " */\n"
        "export const WEIGHTS = " + json.dumps(body, separators=(",", ":")) + "\n"
    )


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--out", default="src/signals/net-weights.js")
    a = ap.parse_args()
    print("fitting", "x".join(map(str, ARCH)), file=sys.stderr)
    p = fit()
    err = error(p, np.random.default_rng(SEED + 1))
    print(f"error over {err['points']:,} points: mean {err['mean']:.3f}  "
          f"p99 {err['p99']:.3f}  max {err['max']:.3f}", file=sys.stderr)
    if a.check:
        sys.exit(0)
    pathlib.Path(a.out).write_text(emit(p, err))
    print("wrote", a.out, file=sys.stderr)
