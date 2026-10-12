# -*- coding: utf-8 -*-
"""Reading grade of the copy that actually renders, not of the source.

Flesch-Kincaid grade and SMOG, both computed from the same sentence and
syllable counts so the two numbers are comparable. The syllable count is the
usual vowel-group heuristic with the silent-e and -le corrections; it is
within a syllable of a dictionary count on ordinary English and is what every
readability tool in this class does.
"""
import json, re, sys, math

def sentences(t):
    t = re.sub(r'([.!?])\s*(?=[A-Z0-9])', r'\1|', t)
    return [s for s in (x.strip() for x in t.split('|')) if len(s.split()) >= 2]

def words(t):
    return re.findall(r"[A-Za-z][A-Za-z'’-]*", t)

VOW = 'aeiouy'
def syl(w):
    w = w.lower().strip("'’-")
    if not w: return 0
    n, prev = 0, False
    for ch in w:
        v = ch in VOW
        if v and not prev: n += 1
        prev = v
    if w.endswith('e') and not w.endswith(('le','ee','ye')) and n > 1: n -= 1
    if w.endswith('le') and len(w) > 2 and w[-3] not in VOW: n += 0
    return max(1, n)

def grade(text):
    ss = sentences(text); ws = words(text)
    if not ss or not ws: return None
    sy = [syl(w) for w in ws]
    W, S = len(ws), len(ss)
    fk = 0.39 * (W / S) + 11.8 * (sum(sy) / W) - 15.59
    poly = sum(1 for s in sy if s >= 3)
    smog = 1.0430 * math.sqrt(poly * (30.0 / S)) + 3.1291
    return dict(words=W, sentences=S, wps=round(W / S, 1),
                poly_pct=round(100 * poly / W, 1), fk=round(fk, 1), smog=round(smog, 1))

data = json.load(open(sys.argv[1]))
allt = ' '.join(data.values())
print(f"{'route':<14}{'words':>6}{'sents':>7}{'w/sent':>8}{'3+syl%':>8}{'FK':>7}{'SMOG':>7}")
for r, t in data.items():
    g = grade(t)
    if g: print(f"{r:<14}{g['words']:>6}{g['sentences']:>7}{g['wps']:>8}{g['poly_pct']:>8}{g['fk']:>7}{g['smog']:>7}")
g = grade(allt)
print('-' * 57)
print(f"{'WHOLE SITE':<14}{g['words']:>6}{g['sentences']:>7}{g['wps']:>8}{g['poly_pct']:>8}{g['fk']:>7}{g['smog']:>7}")
