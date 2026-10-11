# The photographs

Seven files in `src/photos/`, built from five licensed Adobe Stock plates by
`make_photos.py`. Two of them carry the patch, drawn in by `patchon.py`.

## Why the patch is drawn and not generated

An image model asked to add a device to a photograph regenerates the
photograph, and the person in it comes back subtly not themselves — which is
what "looks AI generated" means when someone says it about a photograph of a
real person. So nothing here is generated. The licensed plate is untouched
except for the pixels the patch covers, and the patch is the site's own
artwork.

What normally gives a drawn-in object away is not its outline but that the
light on it disagrees with the light on everything around it. `patchon.place`
therefore does not invent any lighting: it crops the footprint out of the
photograph, blurs it until only the gradient survives, normalises it to its own
mean and multiplies that back over the sprite, so a rim light on the arm lands
on the patch in the same place at the same strength. The same crop gives the
colour of the light, applied weakly, because a white shell under a warm gym
lamp is warm and a studio-neutral one in that frame reads as cut out. A contact
shadow is taken from the sprite's own alpha rather than an ellipse that
approximates it, and the photograph's grain is added last.

## Orientation

Stated, never guessed, because this is the thing that has been wrong before.
The patch is a tall oval. It sits on the **outer face of the upper arm**, and
its **long axis runs along the arm**, shoulder to elbow — the way a Dexcom G6
sits, not across the arm. `angle` turns the sprite to follow an arm that leans;
`bend` is the small horizontal squeeze a flat oval takes on a round arm.

Width is given as a fraction of the photograph's width and is derived from the
arm, not chosen: a patch is a little over a third of the width of the upper arm
it is on, so `width = arm_width * 0.42..0.47`.

## Crops

Each output is stated as a horizontal span plus a top edge, and the height
follows from the shape the site needs. That ordering is deliberate: when a
shape changes it moves the bottom edge, and it cannot silently take the top off
somebody's head, which is how an earlier set of these shipped with cropped
foreheads.

Where a band is too shallow to hold both the faces and the patch — the
counselor card is 2.84:1 — the faces win and the patch is carried whole by the
taller hero crop of the same plate. A half-cut device at the frame edge reads
as a blemish.

## Rebuilding

Put the five licensed plates in `_work/` as `ball.jpg`, `game2.jpg`,
`walk.jpg`, `parent.jpg`, `pro.jpg`, and the alpha-cut patch artwork at
`_work/sprite.png`, then:

    MINDMAP_PLATES=./_work MINDMAP_SPRITE=./_work/sprite.png \
      python3 tools/photos/make_photos.py

To re-cut the sprite, screenshot the `PatchFront` svg on `/#/site` with
Playwright with the page background made transparent and `omitBackground`, then
trim to its alpha bounding box.

Outputs land in `_work/photos/`; copy the `.webp` files into `src/photos/`.
They are imported through Vite (see `src/lib/photos.js`), so each one gets a
content hash and replacing a photograph busts its own cache.

## The plates

| file | Adobe Stock | what it is |
|---|---|---|
| `ball.jpg`   | 173838410  | teenage boy in a gym, tank top, basketball — carries the patch |
| `game2.jpg`  | 1237468491 | teenage boy playing a video game at home |
| `walk.jpg`   | 317316308  | five teenagers walking through a park |
| `parent.jpg` | 670916081  | a mother and her teenage son at home |
| `pro.jpg`    | 138355957  | a school counselor and a student — carries the patch |
