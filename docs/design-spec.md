# The design spec

One file, binding on every page. It exists because six agents were sent at this
site without one and each invented its own answer to "make it better", which is
why the site reads as six sites. Read it before changing any surface. If a rule
here is wrong, change it here first and say so, then change the code.

## What the owner said, verbatim in substance

- "the whole websites elements are too big blocky and babyish"
- "notice how the comparitive one is sleek, condensed, and u can open the app
  within 3 clicks"
- "I really dislike how youve removed cards and other text and image containing
  elements and instead have text on the color background, this is low effort"
- "theres sooo much blank space its not even funny"
- "no judge is gonna take time to read ur paragraphs"
- "The actual app interface is WAYYY TOOO SIMPLE, escape minimalism, u need
  elements, different parts of the dashboard"

Everything below follows from those six lines.

## 0. What this site is for, which outranks every rule below

The owner, correcting an earlier draft of this spec: "the goal here isnt to be
edgy or modern like a startup but rly functional and easy to use."

So "sleek and condensed" below means legible and dense with real information.
It does not mean fashionable, minimal, or clever. When a choice is between
looking current and being obvious to a tired reader who has never seen this
product, the obvious one wins every time. Plain labels over wordplay. A control
that looks like a control. A number next to the thing it measures. Nothing that
has to be figured out.

Judges are local professionals, educators and congressional staff reading fast.
Design for them, not for a design award.

## 0b. The references, which outrank my earlier reading of "sleek"

The owner sent twelve reference screens and they correct this spec. Read this
section before sections 1, 3 and 6, which it amends.

**For the landing page**, three medical-device sites: one full-bleed photographic
hero with the headline over it; one product render running off the edge of the
frame with almost no text; one saturated colour hero with a large product figure
to the right and, under it, white cards each led by a photograph of a real
person. A marketing builder screen showing a white hero with the headline left
and, right, overlapping cards at different depths, one of them a real photograph
and the others live figures.

What they share, and what we do not have: **one big confident image or render
per hero, a saturated ground, and floating cards layered over it.** Not a flat
tinted band with a heading on it. The owner's words: "too plain and devoid of
images and stock photos, it is all monotonous in color and not nice."

**For the app**, six wellness and fitness dashboards. Every one of them: tiles in
several different colours, not one tint; tiles of several different sizes, not a
uniform grid; a big friendly ring or arc as the hero figure; illustration; mood
faces; rounded chips for filters and days; a greeting by name at the top. They
look like something a teenager would open. The owner's words: "they're all
engaging, have some fun engaging features to engage teens and kids, and are
colorful and follow the same playful pattern, not just bare design, thats what
urs needs to be like, like a real dashboard in a real app."

**And the balance he says we are missing**: "the blend of both infographic and
diagram design with realism, stock images, and realistic stuff." Our figures are
all diagram and no realism. A section that carries a chart should often also
carry a photograph of the person the chart is about.

So: section 6's restraint is lifted for grounds, tiles and figures. The six hues
added to `tailwind.config.js` for this are measured and may be used freely.
Colour still never carries a state on its own, body text stays ink, and nothing
is invented outside the config.

## 1. Density

The old rhythm was a portfolio: one idea per screen, large type, wide gutters.
It is wrong for this product and it is wrong for a judge with forty entries to
score. The new rhythm is an instrument panel: many true things visible at once,
each one small, each one in its own container.

- Section vertical padding: `py-10` at the base, `lg:py-14`. Never more.
- Grid gaps: `gap-3` at the base, `lg:gap-4`. Never `gap-8`.
- A section that fills less than 70% of its own height with content is wrong.
  Either it gains content or it merges with its neighbour.
- At 1280 and up, every section uses at least two columns. A single centred
  column of full-width cards is the failure mode this spec exists to stop.
- Target: the whole landing page under 4,000px at 1280.

## 2. Containers, always

Text sitting directly on a tinted band is the specific thing the owner called
low effort. Every piece of content belongs to a container with a visible edge.

- The container is `rounded-panel border border-rule bg-card`. On the ink band
  it is `border-ink-2 bg-ink-2/40`.
- A heading may sit on the band. Body text, figures, lists and statistics may
  not.
- Containers may be nested one level: a card holding a row of chips is right.

## 3. Type

Smaller and tighter than it is now. Sleek, not shouty.

- Section heading: `text-sub`, not `text-sect`. The page title is the only
  thing above `text-sub`.
- Body: `text-meta` for anything inside a card. `text-sec` only for a lede.
- A number that carries weight is `font-mono`, `tabular-nums`, `text-row` or
  `text-head`, with its unit or label at `text-fine` beside it, never under it.
- Line length never past 62 characters inside a card.

## 4. Words

- No paragraph anywhere on the marketing pages. One line, then a figure.
- A section lede is one line or it is deleted.
- A statistic is a number, a unit and a source. "30% to 40%, the first figure,
  ten years earlier" is not a statistic; it is a sentence about two statistics.
  Write "30% in 2013" and "40% in 2023" as two labelled values on one chart.
- Every noun comes from `src/lib/terms.js`. No synonyms.

## 5. Photography

Thirteen licensed frames in `src/lib/photos.js`. They are stock models; nobody
pictured uses MindMap and no caption may imply otherwise.

- Mixed scale on purpose: one frame per page may run full bleed, the rest sit
  inside cards at card width.
- A photograph inside a card is the card's top edge to edge, 150 to 220px tall,
  `object-cover`.
- Never a uniform grid of equal thumbnails. That is the "one bar" the owner
  rejected.
- The first six frames on a page are `loading="eager"`. Lazy images below them.

## 6. Colour

Only what is already in `tailwind.config.js`. No new colour, no gradient, no
blur, no glass.

- Ground: `paper` is the default, `card` for containers, one `ink` band per
  page at most, tints (`accent-wash`, `beam-wash`, `aqua-2`) to separate
  neighbouring sections.
- Colour never touches body text. A coloured figure is a status.
- `text-warn` measures 4.498:1 on `bg-aqua-2` and fails AA. Never put it there.

## 7. The app

The app screens are held to a different and higher bar than the marketing
pages, because the owner's complaint is that they do not feel like an app.

- Every screen is built from distinct modules, each in its own card: a primary
  readout, a breakdown, a trend, an action row. One number alone on a tinted
  ground is not a screen.
- The dial belongs in a card on `card` ground. It must never sit directly on
  the app's tinted canvas.
- Per-signal detail is a requirement, not a nicety: each of the four signals
  gets its own small chart, its own value and its own direction against the
  wearer's normal.
- Density over whitespace. A judge should see a lot of real information and
  still know instantly what the one number is.
- No invented person's name anywhere in the app.
- Clouds belong to the student dial only.

## 8. Clicks

From the landing page, the app opens in no more than three clicks, and one of
them is the button in the header. Nothing may be added that lengthens that
path.

## 7b. The Toolkit is the one place that breaks the restraint

The owner, after seeing it: "the toolkit shouldnt be cold and edgy, it should be
peaceful and uplifting, look at apps that focus on stress management and the
themes and graphics they use, you need to add that, not a monotonous stack of
cards with no color and minimalist diagrams. In fact these can be of the
neo-brutalist style."

So the Toolkit is carved out of sections 2, 3 and 6 above. It keeps the house
tokens and it keeps every safety rule, and it drops the restraint.

- Colour is allowed to carry feeling here, not only status, and each activity
  may own a colour so the set reads as a set of different things rather than a
  stack of identical cards. Take them from the palette; do not invent one.
- Illustration is allowed. A breathing circle, a sky, a horizon, a growing
  shape. Warm and calming, drawn with care, never clip art and never a mascot.
- Shapes may be larger and softer than the rest of the site. The flat
  instrument-panel density of section 1 is the wrong target for a page somebody
  opens because they are having a bad day.
- Neo-brutalist is explicitly permitted: heavy borders, flat blocks of colour,
  hard offset shadows, big confident type. If that route is taken it is taken
  wholly and consistently across all ten activities, not sprinkled.
- What does not change: nothing is stored or sent, no streaks, no guilt, no
  comparison, no diagnostic language, no suggestion of physical discomfort,
  nothing labelled "AI", AA contrast on every text node, 44px targets, and every
  activity still working and meaningful under prefers-reduced-motion.

The test is a teenager opening this at 11pm feeling bad. It should feel like
somewhere calm to land, not like a settings screen.

## 7c. The one sentence is the app's hero, and it has to be readable

The owner: "Ours should emphasize the one sentence (which needs to be readable
to the user, not like number comparison, but like 'youre more anxious than
usual' or stuff like that, u have it wrong rn)."

He is right that it is wrong. The student screen currently leads with "Today is
51, five above a usual 46, with heart furthest above its own normal." That is
three numbers, and nobody reads it as a sentence about their day.

The sentence becomes the largest thing on the screen, above the number, in plain
words, at display size. The number stays, under it, smaller.

**What the sentence may not become.** MindMap measures physiology. It does not
measure anxiety, mood or feeling, and it has never claimed to. "You are more
anxious than usual" is a claim about an emotion we did not measure, and putting
it on a teenager's screen is both false and the kind of thing that gets a
health app rejected. The honest sentence is about the body and is just as
readable:

  "Your body is working harder than usual today."
  "Today looks like an ordinary day for you."
  "You have been running high since about two o'clock."
  "Today is calmer than your last two weeks."

Plain, second person, no figure in it, no diagnosis, nothing a reader has to
decode. Then one quieter line underneath may name the one signal that moved
most, in words rather than standard deviations. The parent and professional
screens get the same treatment in their own voice.

## 8b. Infographics and diagrams

Every figure on the site is held to a higher bar than it currently meets. The
owner: "All infographics and diagrams must be taken a notch up for complexity
so it doesnt look babyish."

That means more real information per figure, not more decoration. A chart earns
its place by carrying values, units, a scale, a baseline or comparison, and a
source. Big friendly shapes with one number in them are the thing being
rejected. Where a figure draws real data, draw more of it: axes, ticks,
reference lines, the comparison case, the uncertainty. Where a figure is a
diagram, label its parts and show the relationships rather than the silhouette.

What this does not license: invented data, decorative complexity, or a figure a
reader cannot decode. Complexity that carries nothing is worse than simplicity.

## 9. Honesty, unchanged

None of the above licenses a claim. No unit has been built or worn. Nothing is
labelled "AI". Every figure traces to `tnam-results.js`, to a file in this
repo, or to a cited source. Approved statistics only.

## 10. Verifying

Measurement is necessary and not sufficient. Every change to a surface is
looked at, as a rendered image, at 390 and at 1280, before it is called done.
`$HOME/pw/SEE.md` says how. An agent that reports "verified by geometry" and
has not looked has not finished.
