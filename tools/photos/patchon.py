"""Put the MindMap patch on an arm in a photograph.

Not a generative edit. The photograph is never regenerated, so the person in
it stays exactly the person the photographer shot: this only draws one object
into it. What makes a drawn object look drawn is almost never its outline, it
is that the light on it disagrees with the light on everything around it. So
the shading here is not invented; it is sampled from the arm the patch is
sitting on, blurred until only the lighting is left, and multiplied back over
the sprite. A rim light on the arm therefore appears on the patch, in the same
place, at the same strength, for free.

Orientation is the whole point of the exercise and is stated, not guessed:
the sprite is a tall oval, `angle` turns its long axis to lie ALONG the arm
(shoulder to elbow), and the anchor is on the outer face of the upper arm.
"""
import math
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import numpy as np

SPRITE = '/mnt/user-data/uploads/Desktop/mindmap-patient-react/_work/sprite.png'


def _cylinder(sprite, bend):
    """A flat oval laid on a round arm is a little narrower at its edges.

    Horizontal squeeze that grows with distance from the centre line, which is
    what a cylinder does to anything stuck to it. Small numbers only: this
    reads as curvature at 0.10 and as a fairground mirror at 0.4."""
    if bend <= 0:
        return sprite
    w, h = sprite.size
    src = np.array(sprite)
    out = np.zeros_like(src)
    cx = (w - 1) / 2.0
    for x in range(w):
        t = (x - cx) / cx if cx else 0.0
        # inverse map: where on the flat sprite does this output column come from
        u = cx + (x - cx) / max(1e-6, (1.0 - bend * t * t))
        u0 = int(math.floor(u))
        if u0 < 0 or u0 + 1 >= w:
            continue
        f = u - u0
        out[:, x] = (src[:, u0] * (1 - f) + src[:, u0 + 1] * f).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')


def _scene_light(photo, box, size, strength):
    """The lighting under the patch, with the skin texture taken out.

    Crop the footprint, blur it hard enough that nothing survives but the
    gradient, divide by its own mean so it becomes a multiplier around 1.0,
    then pull it toward 1.0 by `strength`. White plastic does not take the
    arm's colour, so only luminance is used."""
    under = photo.crop(box).convert('RGB').resize(size, Image.LANCZOS)
    blur = under.filter(ImageFilter.GaussianBlur(radius=max(size) * 0.42))
    a = np.asarray(blur).astype(np.float32)
    lum = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    m = float(lum.mean()) or 1.0
    f = lum / m
    f = 1.0 + (f - 1.0) * strength
    return np.clip(f, 0.55, 1.45)[..., None]


def _scene_tint(photo, box):
    """The colour of the light in this frame, as a per-channel multiplier.

    Luminance alone is not enough. A white object under a warm gym light is
    warm, and a patch that stays studio-neutral in a scene that is not reads
    as cut out even when every edge is right. The arm's own average colour,
    normalised to its own luminance, is that light's colour; applied at a low
    weight it tints the shell without letting it go skin-coloured."""
    a = np.asarray(photo.crop(box).convert('RGB')).astype(np.float32)
    mean = a.reshape(-1, 3).mean(axis=0)
    lum = 0.2126 * mean[0] + 0.7152 * mean[1] + 0.0722 * mean[2]
    return mean / max(1e-6, lum)


def place(photo, *, cx, cy, width, angle=0.0, bend=0.16, light=0.85, tint=0.30,
          shadow=0.5, shadow_dx=0.10, shadow_dy=0.06, grain=2.0, sprite=SPRITE):
    """cx, cy, width are fractions of the photograph's own width/height."""
    photo = photo.convert('RGB')
    W, H = photo.size
    pw = max(8, int(round(width * W)))
    sp = Image.open(sprite).convert('RGBA')
    ph = max(8, int(round(pw * sp.height / sp.width)))
    sp = sp.resize((pw, ph), Image.LANCZOS)
    sp = _cylinder(sp, bend)

    px, py = cx * W, cy * H

    # the contact shadow, drawn first and from the sprite's own alpha so it is
    # the shape of the object and not an ellipse that approximates it
    if shadow > 0:
        blur = max(2.0, pw * 0.10)
        pad = int(blur * 3)
        sh = Image.new('L', (pw + 2 * pad, ph + 2 * pad), 0)
        sh.paste(sp.getchannel('A'), (pad, pad))
        sh = sh.filter(ImageFilter.GaussianBlur(blur))
        sh = sh.point(lambda v: int(v * shadow))
        sh = sh.rotate(-math.degrees(angle) if angle else 0, resample=Image.BICUBIC,
                       expand=True) if angle else sh
        dark = Image.new('RGB', photo.size, (0, 0, 0))
        m = Image.new('L', photo.size, 0)
        m.paste(sh, (int(px - sh.width / 2 + pw * shadow_dx),
                     int(py - sh.height / 2 + ph * shadow_dy)))
        photo = Image.composite(dark, photo, m.point(lambda v: int(v * 0.55)))

    # scene light, sampled from the footprint before anything is drawn on it
    if light > 0:
        box = (int(px - pw / 2), int(py - ph / 2), int(px + pw / 2), int(py + ph / 2))
        box = (max(0, box[0]), max(0, box[1]), min(W, box[2]), min(H, box[3]))
        if box[2] - box[0] > 4 and box[3] - box[1] > 4:
            f = _scene_light(photo, box, sp.size, light)
            arr = np.asarray(sp).astype(np.float32)
            arr[..., :3] = np.clip(arr[..., :3] * f, 0, 255)
            if tint > 0:
                t = 1.0 + (_scene_tint(photo, box) - 1.0) * tint
                arr[..., :3] = np.clip(arr[..., :3] * t[None, None, :], 0, 255)
            sp = Image.fromarray(arr.astype(np.uint8), 'RGBA')

    # the grain of the photograph, so the one object in frame is not the only
    # clean thing in it
    if grain > 0:
        arr = np.asarray(sp).astype(np.float32)
        n = np.random.default_rng(7).normal(0, grain, arr[..., :3].shape)
        arr[..., :3] = np.clip(arr[..., :3] + n, 0, 255)
        sp = Image.fromarray(arr.astype(np.uint8), 'RGBA')

    if angle:
        sp = sp.rotate(-math.degrees(angle), resample=Image.BICUBIC, expand=True)

    out = photo.convert('RGBA')
    out.alpha_composite(sp, (int(px - sp.width / 2), int(py - sp.height / 2)))
    return out.convert('RGB')


def crop_to(im, ratio, x0, x1, ytop, out_w):
    """A crop stated as a horizontal span plus a top edge, so framing is
    decided in the photograph's own coordinates and the height follows from
    the shape the site needs rather than the other way round."""
    W, H = im.size
    left, right = int(x0 * W), int(x1 * W)
    w = right - left
    h = int(round(w / ratio))
    top = int(ytop * H)
    if top + h > H:
        top = H - h
    if top < 0:
        top, h = 0, min(h, H)
    c = im.crop((left, top, left + w, top + h))
    return c.resize((out_w, int(round(out_w / ratio))), Image.LANCZOS)
