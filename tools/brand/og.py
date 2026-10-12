#!/usr/bin/env python3
"""Generates every raster brand asset the site ships: the Open Graph card and
the four app icons.

Nothing here is hand-placed in an image editor. The mark is redrawn from the
same 40 x 28 viewBox geometry as `src/ui/Logo.jsx` and the inline shell in
`index.html`, and every colour is a token copied out of `tailwind.config.js`.
Change a token there, run this, and the share card follows.

    python3 tools/brand/og.py

Outputs, all into public/:
    og.png                    1200 x 630, the Open Graph and Twitter card
    icon-192.png              rounded, for an Android home screen
    icon-512.png              rounded, the large any-purpose icon
    icon-512-maskable.png     full bleed, mark inside the 80% safe circle
    apple-touch-icon.png      180 x 180, square, iOS applies its own mask

Fonts. The site serves Quicksand and Chivo from public/fonts as woff2, which
FreeType cannot open. This script fetches the upstream variable TTFs once into
a cache outside the repository, so no binary font is checked in here:

    MINDMAP_FONT_CACHE=/some/dir python3 tools/brand/og.py

Only Pillow is needed. It is not a project dependency and must not become one;
this script is run by hand when the mark or the palette changes.
"""

import os
import sys
import urllib.request
from PIL import Image, ImageDraw, ImageFont

# ── Palette ──────────────────────────────────────────────────────────────────
# Copied from tailwind.config.js. The comments there carry the measured
# contrast ratios; the only rule that matters at this size is that beam is a
# graphic and never a word.
PAPER      = (0xf5, 0xfa, 0xfa)
AQUA       = (0xed, 0xf7, 0xf7)
INK        = (0x0b, 0x2b, 0x33)
INK_3      = (0x3c, 0x6a, 0x74)
RULE       = (0xbe, 0xd6, 0xda)
ACCENT     = (0x0a, 0x6e, 0x68)
ACCENT_LIT = (0x3f, 0xd6, 0xc4)
BEAM       = (0x1d, 0x8f, 0xb0)
BEAM_WASH  = (0xdd, 0xf0, 0xf8)

# ── Copy ─────────────────────────────────────────────────────────────────────
# Every line has to be true of a product with no users and no built hardware.
# What is true: the scoring model, the two ways a reading is taken, and who it
# was built for.
HEAD_1 = 'One score a day, from a patch'
HEAD_2 = 'or from the phone in your pocket.'
META   = 'Built for the Congressional App Challenge'
URL    = 'mindmappaitent.vercel.app'

HERE   = os.path.dirname(os.path.abspath(__file__))
REPO   = os.path.dirname(os.path.dirname(HERE))
OUT    = os.path.join(REPO, 'public')
CACHE  = os.environ.get('MINDMAP_FONT_CACHE',
                        os.path.expanduser('~/.cache/mindmap-brand-fonts'))

FONTS = {
    'Quicksand-Variable.ttf':
        'https://raw.githubusercontent.com/google/fonts/main/ofl/quicksand/Quicksand%5Bwght%5D.ttf',
    'Chivo-Variable.ttf':
        'https://raw.githubusercontent.com/google/fonts/main/ofl/chivo/Chivo%5Bwght%5D.ttf',
}


def font(name, size, weight):
    """A variable font pinned to one weight. Pillow mutates the instance, so
    each call gets its own."""
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, name)
    if not os.path.exists(path):
        print('fetching', name, 'into', CACHE)
        urllib.request.urlretrieve(FONTS[name], path)
    f = ImageFont.truetype(path, size)
    f.set_variation_by_axes([float(weight)])
    return f


# ── The mark ─────────────────────────────────────────────────────────────────
# viewBox 0 0 40 28: a rounded capsule, a five point trace across it, and a
# filled dot on the trace's last peak. Drawn at `ss` times the target and
# reduced, because Pillow strokes arcs and joins without antialiasing.
SS = 4


def mark(width, stroke, dot, ss=SS):
    """RGBA image of the MindMap mark, `width` px wide, aspect 40:28."""
    k = (width * ss) / 40.0
    w, h = int(round(40 * k)), int(round(28 * k))
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    sw = 2.3 * k                      # the shell and Logo.jsx both stroke 2.2 to 2.3
    d.rounded_rectangle(
        [2 * k + sw / 2, 4 * k + sw / 2, 38 * k - sw / 2, 24 * k - sw / 2],
        radius=10 * k - sw / 2, outline=stroke + (255,), width=int(round(sw)))

    trace = [(10.5, 18.2), (15, 10.2), (20, 15.8), (25.4, 11), (29.5, 17.6)]
    pts = [(x * k, y * k) for x, y in trace]
    d.line(pts, fill=stroke + (255,), width=int(round(sw)), joint='curve')
    # joint='curve' rounds the interior joins; the two ends need capping too.
    for x, y in (pts[0], pts[-1]):
        r = sw / 2
        d.ellipse([x - r, y - r, x + r, y + r], fill=stroke + (255,))

    r = 2.4 * k
    cx, cy = 29.5 * k, 17.6 * k
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=dot + (255,))

    return img.resize((width, int(round(width * 28 / 40))), Image.LANCZOS)


# ── The Open Graph card ──────────────────────────────────────────────────────
def og_card():
    W, H = 1200, 630
    img = Image.new('RGB', (W, H), PAPER)
    d = ImageDraw.Draw(img)

    # The lower band: the site reads as a sequence of near-white sections
    # rather than one sheet, and aqua is the token that does that.
    band_y = 420
    d.rectangle([0, band_y, W, H], fill=AQUA)
    d.rectangle([0, band_y, W, band_y + 2], fill=RULE)

    # A signal trace through the band. Fixed points, not generated, so the
    # card is byte-identical on every run.
    shape = [0.52, 0.30, 0.66, 0.44, 0.74, 0.22, 0.58, 0.38, 0.86, 0.46, 0.18]
    span = H - band_y - 40
    pts = [(int(i * (W / (len(shape) - 1))), int(band_y + 28 + v * span))
           for i, v in enumerate(shape)]

    fill = Image.new('RGBA', (W * 2, H * 2), (0, 0, 0, 0))
    fd = ImageDraw.Draw(fill)
    fd.polygon([(x * 2, y * 2) for x, y in pts] + [(W * 2, H * 2), (0, H * 2)],
               fill=BEAM_WASH + (255,))
    fd.line([(x * 2, y * 2) for x, y in pts],
            fill=BEAM + (255,), width=12, joint='curve')
    img.paste(fill.resize((W, H), Image.LANCZOS), (0, 0),
              fill.resize((W, H), Image.LANCZOS))

    # The dot sits on the trace's own peak, the way it does in the mark.
    peak = min(pts[1:-1], key=lambda p: p[1])
    d.ellipse([peak[0] - 11, peak[1] - 11, peak[0] + 11, peak[1] + 11], fill=ACCENT)

    # Lockup: mark, then the wordmark with Map in the green.
    x = 84
    m = mark(104, INK, ACCENT)
    img.paste(m, (x, 86), m)

    wx = x + 104 + 26
    f_word = font('Quicksand-Variable.ttf', 82, 700)
    d.text((wx, 80), 'Mind', font=f_word, fill=INK)
    d.text((wx + d.textlength('Mind', font=f_word), 80), 'Map',
           font=f_word, fill=ACCENT)

    f_url = font('Chivo-Variable.ttf', 25, 500)
    d.text((W - 84, 112), URL, font=f_url, fill=INK_3, anchor='rs')

    f_head = font('Chivo-Variable.ttf', 54, 600)
    d.text((x, 212), HEAD_1, font=f_head, fill=INK)
    d.text((x, 280), HEAD_2, font=f_head, fill=INK)

    f_meta = font('Chivo-Variable.ttf', 28, 500)
    d.text((x, 364), META, font=f_meta, fill=INK_3)

    return img


# ── Icons ────────────────────────────────────────────────────────────────────
def icon(size, radius_ratio, mark_ratio):
    """Accent ground, paper mark, accent-lit dot. `mark_ratio` is the mark's
    width as a fraction of the icon: a maskable icon has to keep the whole
    mark inside the middle 80%, so it asks for a smaller one."""
    ss = 4
    big = Image.new('RGBA', (size * ss, size * ss), (0, 0, 0, 0))
    d = ImageDraw.Draw(big)
    r = int(size * ss * radius_ratio)
    if r:
        d.rounded_rectangle([0, 0, size * ss - 1, size * ss - 1],
                            radius=r, fill=ACCENT + (255,))
    else:
        d.rectangle([0, 0, size * ss - 1, size * ss - 1], fill=ACCENT + (255,))
    img = big.resize((size, size), Image.LANCZOS)

    mw = int(size * mark_ratio)
    m = mark(mw, PAPER, ACCENT_LIT)
    img.paste(m, ((size - mw) // 2, (size - m.height) // 2), m)
    return img


def main():
    os.makedirs(OUT, exist_ok=True)
    jobs = [
        ('og.png',                 og_card()),
        # 22% is the corner a rounded Android icon wants; 0.62 leaves the mark
        # breathing room without looking lost.
        ('icon-192.png',           icon(192, 0.22, 0.62)),
        ('icon-512.png',           icon(512, 0.22, 0.62)),
        # Maskable: full bleed ground, and the mark at 0.46 so its 40 x 28 box
        # fits inside the 80% safe circle whichever way a launcher crops.
        ('icon-512-maskable.png',  icon(512, 0.0, 0.46)),
        # iOS masks the square itself and dislikes transparency.
        ('apple-touch-icon.png',   icon(180, 0.0, 0.66)),
    ]
    for name, im in jobs:
        path = os.path.join(OUT, name)
        im.convert('RGB').save(path, 'PNG', optimize=True)
        print('%-24s %7d bytes  %s' % (name, os.path.getsize(path), im.size))


if __name__ == '__main__':
    sys.exit(main())
