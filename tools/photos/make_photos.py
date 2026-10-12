"""Build the seven photographs the site ships.

Five licensed plates, two of them carrying the patch. Every crop is stated as
a horizontal span and a top edge in the plate's own coordinates. A shape
change then moves the bottom edge; it cannot silently take the top off
somebody's head, which is how an earlier set shipped.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image
from patchon import place, crop_to, arm_fraction

S = os.environ.get('MINDMAP_PLATES', './_work')
OUT = f'{S}/photos'
os.makedirs(OUT, exist_ok=True)

CARD = (1200, 423)    # the three audience cards on the overview
HERO = (1344, 752)    # the band at the top of each audience page
WORN = (1024, 688)    # the device, worn, on the patch page

def load(n):
    return Image.open(f'{S}/plates/{n}.jpg')

# --- the two plates that carry the patch ----------------------------------
# Size comes from the enclosure spec, not from the eye: the assembled pod and
# base are 54 x 36 mm, so the only judgement call left per photograph is how
# wide the arm in it is. That is stated here and nowhere else.
#
#   ARM_FRAC   the visible width of the arm, as a fraction of the plate's width
#   arm_mm     what that arm is taken to be across, in millimetres
#
# ball: a lean teenager, low on the upper arm where it has already tapered,
# taken as 68 mm across (a 21 cm circumference). The patch is then 0.53 of the
# visible arm. That is noticeably chunkier than a Freestyle Libre's 35 mm disc
# and correct: 36 x 54 mm is a bigger object than either that or a Dexcom G6.
ball = place(load('ball'), cx=0.7755, cy=0.448,
             width=0.047 * arm_fraction(68), angle=0.0, bend=0.16, tint=0.35)
# pro: a fuller arm, taken as 72 mm across. The arm leans, so the patch leans
# with it.
pro = place(load('pro'), cx=0.7675, cy=0.678,
            width=0.0365 * arm_fraction(72), angle=0.15, bend=0.16, tint=0.35)

walk, game, parent = load('walk'), load('game2'), load('parent')

jobs = [
    ('patch-worn',   ball,   WORN, 0.505, 0.975, 0.068),
    ('student-card', walk,   CARD, 0.070, 0.930, 0.195),
    ('student-hero', game,   HERO, 0.060, 0.940, 0.060),
    ('parent-card',  parent, CARD, 0.000, 1.000, 0.140),
    ('parent-hero',  parent, HERO, 0.080, 0.950, 0.120),
    # The band is too shallow to hold both the faces and the patch; the faces
    # win here and the patch is carried, whole, by the taller hero below.
    ('school-card',  pro,    CARD, 0.000, 1.000, 0.105),
    ('pro-hero',     pro,    HERO, 0.000, 1.000, 0.120),
]

for name, src, (w, h), x0, x1, ytop in jobs:
    im = crop_to(src, w / h, x0, x1, ytop, w)
    im.save(f'{OUT}/{name}.png')
    im.convert('RGB').save(f'{OUT}/{name}.webp', quality=86, method=6)
    print(f'{name:14s} {im.size}  {os.path.getsize(f"{OUT}/{name}.webp")/1024:6.1f} KB')
