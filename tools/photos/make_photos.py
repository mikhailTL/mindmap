"""Build the seven photographs the site ships.

Five licensed plates, two of them carrying the patch. Every crop is stated as
a horizontal span and a top edge in the plate's own coordinates, so a shape
change on the site moves the bottom edge and never silently takes the top off
somebody's head — which is the one way these have gone wrong before.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image
from patchon import place, crop_to

S = os.environ.get('MINDMAP_PLATES', './_work')
OUT = f'{S}/photos'
os.makedirs(OUT, exist_ok=True)

CARD = (1200, 423)    # the three audience cards on the overview
HERO = (1344, 752)    # the band at the top of each audience page
WORN = (1024, 688)    # the device, worn, on the patch page

def load(n):
    return Image.open(f'{S}/plates/{n}.jpg')

# --- the two plates that carry the patch ----------------------------------
# ball: upper arm vertical, patch on the outer face, long axis along the arm
ball = place(load('ball'), cx=0.7755, cy=0.445, width=0.047 * 0.47,
             angle=0.0, bend=0.16, tint=0.35)
# pro: the arm leans, so the patch leans with it
pro = place(load('pro'), cx=0.7675, cy=0.675, width=0.0365 * 0.46,
            angle=0.15, bend=0.16, tint=0.35)

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
