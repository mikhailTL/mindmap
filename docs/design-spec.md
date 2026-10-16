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

---

## 0c. The correction of 13 October: soothing, in the palette we already had

Section 0b read the twelve references as a licence to saturate. The owner's
verdict on the result, in his words: the colour scheme should not have been
changed, things are "too deep now", the landing page "looks very messy and
looked better before", the scaling "isnt right", and the design had started to
copy the rival's. The direction that supersedes 0b:

> keep the previous color scheme and make it more soothing while taking inspo
> from my references

The references supply *softness, air and variety of tile*. They do not supply a
new palette. The palette is the green one in `tailwind.config.js` and it stays.

### The five rules this adds

**1. No saturated or dark ground on a whole section.** `bg-accent`, `bg-ink`,
`bg-ink-2` and `bg-accent-ink` are for marks, buttons, bars and strokes. A
band's ground comes from the near-whites: `paper`, `card`, `aqua`, `aqua-2`,
`accent-wash`, `beam-wash`, and the six hue `-wash` steps. Variety between
bands comes from which near-white, not from how dark.

The problem band is the specific casualty. It was `bg-ink` with `PANEL_INK`
cards and `text-ruling` small print. It becomes: section `bg-paper`, cards
`PANEL`, headings `text-ink`, body `text-ink-2`, small print `text-ink-3`.

**2. The six hues keep their jobs but only at `-wash`.** They label the four
signals, the three routes and the three audiences. `DEFAULT` stays a graphic
colour on charts, `ink` stays the text colour. Neither fills a band.

**3. No capsule pill as an eyebrow or a label.** A rounded-full enclosure around
a line of letterspaced type above a headline is the most recognisable mark of a
generated landing page, and the owner named it as one. An eyebrow is a line of
type: `font-body text-ui font-semibold text-accent-ink`. `rounded-chip` survives
only where the thing is genuinely a chip a reader acts on or reads as one of a
set -- a filter, a tab, a signal in a row of four -- and `rounded-field` is
preferred even there when the set is static.

**4. No monospace numerals.** `font-mono` now resolves to Chivo, the body face;
`tabular-nums` is what lines figures up and it still does. A typewriter face on
a display number reads as a generated page. `font-code` is the real monospace
and is only for file paths and literal code.

**5. A hero is not a collage.** One ground, one frame, and at most two objects
standing in front of it, each entirely inside its own column. Nothing bleeds off
the viewport, nothing is clipped by the band, no word sits over a face, and the
band's height is its content's and not the viewport's -- forcing `100svh` is
what crushed the left column and cut the phone in half.

### What this does not undo

The sentence still leads the app screens and still describes the body (7c). The
photographs stay, paired with what they are about. The density, the three-click
path and the sourced statistics are unchanged. This is a correction of weight
and of ornament, not of structure.

---

## 0d. The 13 October batch, verbatim, and what each one binds

Ten directives arrived together. They are recorded here as the contract; every
worker reads this section and is judged against it.

### 1. Colour: green, white, turquoise. Nothing else.

> this color isnt allowed, not part of OG color scheme ... The purple as well,
> color scheme needs to be consistent.

The cream (`sun-wash`, roughly #f5ecd7) and the purple (`lilac`) are **out**.
So is any other hue that is not in the original green system. The usable
grounds are: `paper`, `card`, `aqua`, `aqua-2`, `accent-wash`, `beam-wash`.
The usable inks: `ink`, `ink-2`, `ink-3`, `accent`, `accent-ink`, `beam-ink`.
`warn` and `crit` keep their reserved meanings (out of range; critical) and are
the only non-green colours allowed anywhere, used for those meanings only.

`coral`, `lilac`, `sun`, `mint`, `sky` and `blush` are retired. Where a set of
things needed telling apart by colour, tell them apart by **label, order, icon
or ground step** (`paper` / `aqua` / `aqua-2` / `card`) instead.

### 2. The capsule label is banned, in every form.

> the for students in the circle is prime example of vibe coded slop, needs
> severe restyling across the whole site where this font and deisgn appears.

The pattern is: a rounded-full capsule, a monospace or letterspaced face,
bold, in a hue. It appears as audience tags, as eyebrows, as status pills and
as "n min" badges. **Every one of them goes.** Replacements, by job:

- an eyebrow above a heading: a line of type, `font-body text-ui font-semibold
  text-accent-ink`, no enclosure
- a category tag on a card: the word, `font-body text-fine font-semibold
  text-ink-3`, above the title, with a hairline under it if it needs separating
- a status or duration: plain type beside what it describes, never a filled pill
- a thing the reader clicks or toggles: `rounded-field`, body face, normal case

`rounded-chip` survives only on the round score dial and on genuinely circular
marks. No `font-mono` on any label, ever.

### 3. Headings are plain, professional noun phrases.

> titles like this arent allowed, should be replaced by "Fully Wireless, 2
> minutes of setup" Stop with the cryptic and edgy titles and always exclude
> words "it, thing, that, etc" and similar words bc sounds unprofessional

Rules, applied to every heading on the site:

- **No pronouns or empty nouns**: it, its, this, that, thing, anything,
  nothing, stuff, something, everything.
- **Name the subject.** "Nothing is plugged into anything." becomes "Fully
  Wireless, 2 Minutes of Setup". "Who It Is For" becomes "Audiences".
- **No epigrams, no reversals, no one-word drama.** A heading says what the
  section contains, in Title Case, and reads the same to a judge as to a parent.
- Keep them short: five words is plenty, eight is the ceiling.

### 4. Every photograph is framed for its own subject.

> many of the stock images are cutoff and hinder the design significantly, so
> make sure each frame is adjusted and optmized for the contained images

Faces cut in half, heads cropped at the eyebrow and bodies sliced down the
middle are the most visible defect on the site. Each photograph gets a focal
point recorded once, next to its dimensions, and every frame that uses it
honours that focal point and gives it an aspect ratio its subject survives.
A frame shorter than 170px is not allowed to hold a face.

### 5. Opening the app lands on a chooser, not on a demo.

> When the user or judge hits "open the app" it shouldnt take them to the demo
> ... it should give options on the page that say like "take a reading" and 2
> or 3 more options for the toolkit and features of the app ... the demo toggle
> should be default set to real so judge can try out ... this applies to the
> parent and med professional interfaces as will

- The demo toggle **defaults to real** in every audience.
- Opening any audience lands on a short start screen: what the audience can do
  right now, as three or four actions. For the student: Take a reading, Open
  the Toolkit, Ask MindMap AI, Try the worked day. Parent and Medical
  Professional get the equivalents for their own features.
- With no readings yet, the screen offers the actions. It never just says there
  is nothing to show.
- Connecting a patch is one of the offered actions, not a wall of instructions.

### 6. The dashboard opens small and expands on request.

> things are too big like the text and boxes themselves too big. The user
> should be able to open the app and see in center the rainbow readings with
> sentance above it within a card, not the rainbow to the side. Then ... a
> clickable dropdown that says, see details, and when clicked expands to show
> all the readings, charts, and graphs in real time.

- The sentence and the dial are **one centred card**, the sentence above the
  dial. Nothing else above the fold.
- Everything else is behind one **See details** disclosure, collapsed by
  default, holding the readings, the charts and the per-signal traces.
- Type and box sizes come down a step throughout the app: the app is a phone
  interface, not a poster.
- **Weekly and monthly view on a calendar**, with streaks over a user-set
  target score, and percentages for how often the reader stayed in the target
  range and how often they ran above or below it.
- In the demo, the charts under the dial are **live and moving**, as if the
  patch were streaming, rather than a still.

### 7. The Toolkit: smaller, routed, and genuinely capable.

> the toolkit is too big of boxes, and i dont like how the activities open
> within the same page like low effort instead of rerouting ... should
> integrate more advanced things such as yolo model image recognition ...
> Remove the privacy box at bottom.

- Cards come down in size; the blank space goes.
- **Each activity is its own route**, not an in-page accordion.
- Activities get real capability behind a simple surface. Anything that claims
  a technique must actually run it in the page, or not claim it.
- The privacy panel at the foot of the Toolkit is removed.

### 8. MindMap AI replaces Notes, on all three audiences.

The owner's decision, taken on 13 October: **a real model behind a serverless
function, with the owner supplying the key.** It is never shipped labelled "AI"
while it is a script. Never diagnoses. One overarching adolescent mental health
framework, with three adaptations: the teen, the parent, the medical
professional. Explained on the How it works page.

### 9. Get help is a directory, not an essay.

> less descriptions and more actual info such as the numbers or how to contace,
> less space taken up overall. Have a sound icon at the top of the popup to
> make it list options outloud and have translation options for it as well.

Name, number, how to reach it, one line at most. A speaker control at the top
reads the options aloud (Web Speech API, already in the browser). A language
control switches the list.

### 10. The survey is replaced.

The owner's decision, taken on 13 October: **drop the System Usability Scale**
and ask questions that produce quotable credibility instead. "Tell me what to
fix" is removed. Demographics (age group, role, education) are added. No item
is the negative mirror of another. Every claim about a benchmark of 68 comes
off the site with the instrument.

### 11. The landing page's two card rows must read as two sections.

"Three Ways to Start" and the audiences row currently read as one set of six.
They need a visible break: a different ground, a rule, or their own band.

---

## 0e. The second 13 October batch

### 12. The landing page goes back toward what it was

> Ik i said to put things in cards and stuff, but you really overdid it,
> especially on the main landing page ... when everyhing is carded and in
> boxes, it makes the whole screen look like one section ... too many cards
> now, too many ai signature elements, and now too many words, landing page
> needs to be closer to befroe than now but with more glassmorphism and stock
> images

Spec 2 ("containers always") is **overruled on the landing page**. A container
is for a thing that is genuinely a unit: a card a reader clicks, a figure with
its caption, a panel with a border that means something. Running copy, section
headings, lists and figures sit on the band. When every element is boxed, the
boxes stop separating anything and the page reads as one grey slab.

The landing page target: fewer bands, fewer boxes, more photograph, far fewer
words. If a sentence is not carrying a fact a judge needs, delete it.

### 13. Glassmorphism is allowed, by name, over photographs only

The owner asked for it directly. This is the one exception to the AI-tell list:
a translucent blurred panel is permitted **where it sits over a photograph**,
because there it is doing a real job (keeping type legible over an image) and
not imitating depth that is not there. It is not permitted on a flat ground,
where it is pure ornament. Everything else on the AI-tell list stands.

### 14. Mobile is the primary surface, and the bar is Apple Fitness and Oura

> Optmize this entire experience for mobile UI so that its UI looks even better
> on phone and rivals the apple fitness app and Oura, there shouldnt be any
> cutting of elements, misplacements, or extensivley long scrolling thru
> similar cards or text on the phone

At 390px: nothing clipped, nothing overflowing, no horizontal scroll, no run of
similar cards longer than three before something changes, and no band that
takes more than about one and a half screens. Where a desktop layout would
become a long column of identical cards on a phone, it becomes a horizontal
rail, a disclosure, or a shorter list.

### 15. The onboarding plays on every load, and leaves the nav

> guided tour shouldnt be a thing on the taskbar. I still dont see the
> onboarding everytime i refresh

Remove **Guided tour** from the site navigation. The walkthrough plays on every
page load, with a visible skip; no storage suppresses it. The tour remains
reachable from the entry chooser's "Other" route.

### 16. The clinician console is for a person in a hurry

> The medical professional dashboard is too complex, like the words it uses,
> and the jumble of data presented isnt clear and too overwhelming ... like
> "Manage stress across the whole school" instead of a crisis protocol ... Also
> tooooo much text on this one. Mindmap AI needs to be added to this as well.

Plain words, a step-by-step shape, one thing per screenful, and far less prose.
Headings name an outcome ("Manage Stress Across the School"), not a protocol.

### 17. Parent and student dashboards share one shape

Score and sentence first, in one centred card. Everything else behind a
**See details** disclosure. Smaller type, smaller boxes.

### 18. Route ids, fixed, so no two workers invent different ones

```
site  patch  pairing  without-patch  methods  privacy  monitor  survey  responses
students  parents  pro                      (the three audience explainer pages)
app  app-student  app-parent  app-pro        (the product)
reading  calendar  toolkit  ai  help  shared  app-notify
toolkit-breathing  toolkit-ground  toolkit-reframe  toolkit-scan  toolkit-move
```
`src/views/App.jsx` owns the route table. A worker needing a route it does not
own names it in its report rather than adding it.

---

## 0f. 14 October: the text budget, measured from the apps the owner named

The owner sent six screens: Dexcom G7, Dexcom Clarity, the Dexcom profile,
Publix Pharmacy, Apple Fitness, and a rival. Counting every word on each,
labels included:

| screen | words above the fold | longest run of prose |
|---|---|---|
| Dexcom G7 glucose | 12 | none |
| Dexcom Clarity summary | about 40 | one 8-word line |
| Dexcom profile | about 30 | one 11-word line |
| Apple Fitness summary | about 20 | none |
| Publix home | about 45 | one 22-word footnote |

Ours, measured the same way on the student dashboard before this pass: over
200, with four paragraphs.

### The rules, from those numbers

1. **An app screen above the fold holds 15 to 45 words, labels included.**
2. **No paragraph in the app.** A paragraph is three or more sentences in a
   row. Anything that needs one moves behind a disclosure or a "?" control, the
   way Clarity hides its definitions.
3. **No sentence over ten words in the app.** Headings are two to four.
4. **Every tab and every action has an icon.** The bar is Apple Fitness and
   Dexcom: icon above a one-word label.
5. **The app fills a laptop.** Content runs to about 1100px wide at 1280;
   cards sit in two or three columns. Nothing is centred in a narrow column
   with empty margins either side. Phone layout is for phones.
6. **The marketing site may carry more words than the app, and still fewer
   than it does.** Landing page bands: one heading, one line, one figure or
   image. The How it works page: four categories (Hardware, AI, Machine
   Learning, Other Software), each a short band, and no AUROC, p-value or
   interval anywhere a judge reads. Those live in docs/ and in the repo.
7. **Colour has range.** The original scheme had near-white grounds AND dark
   ink bands AND solid accent fills. All three are in use again. "Soothing"
   meant not a saturated field behind the headline; it never meant every
   band the same near-white.

---

## 0g. 16 October: beyond the screen

The owner asked for features no other adolescent wellbeing app has: Toolkit
activities on the phone's own sensors, and a patch measure beyond the score.

**Three patch measures**, all per event, which no consumer wearable reports, on
the per minute arousal index against the wearer's own fourteen day band:

| Measure | Computed |
|---|---|
| Settle time | Minutes from a peak until the index is half way back to the top of the band; capped at 90, then "did not settle"; the day's figure is the median across peaks |
| Run-up | Mean index in the 120 minutes before a marked event, less the wearer's mean for those minutes on unmarked days, in index points |
| Carry-over | Peaks whose settle target was not reached before the next peak or the end of the day, divided by all peaks |

Events are the student's own calendar marks; a comparison needs seven days of
history. The app may say "your body took longer to settle than usual", never
anxiety, depression or risk; no normative threshold. Oura Cumulative Stress is
the nearest neighbour (monthly, 18+). Sources: claude/beyond-the-screen-research.md.

**Nine phone tools**, each with the line it shows at the point of use (Methods
adds: Typing rhythm is exploratory, Steady Hand unvalidated for anxiety):

| Tool | Line on screen |
|---|---|
| Sigh Coach | Sound level is measured here and never recorded. |
| Chest Breathing | Motion is measured here and never recorded. |
| Steady Hand | Movement is measured here and never recorded. Experimental. A grounding exercise with a measured result. |
| Alertness Check | Taps are timed here and never sent. Validated for alertness and sleep loss, not for stress. |
| Typing rhythm | The time between keys, never the keys. |
| Reach | Only where you took readings. Never shared, never a map. |
| Did it work | Measured by the camera, never recorded. |
| Pocket Pacer | A sound file made on this phone. Nothing is recorded. |
| Walk It Off | Motion is measured here and never recorded. The walk is never scored as stress. |

**Consent.** Everything above stays on the device. Reach, events and Run-up are
never shared with anyone. Settle time and Carry-over reach a parent or a Medical
Professional only as one day level field, "Days slow to settle", off by default,
listed in the sharing screen and switchable off by the student: no event, no
time, nothing finer than a day.

**What the browser allowed.** An iPhone web app in October 2026 has DeviceMotion
after a tap, the microphone through Web Audio, foreground geolocation, the camera
and the Screen Wake Lock; it has no Web Bluetooth, no Vibration API (the switch
input trick closed in iOS 26.5) and no background sensing, since page JavaScript
stops at lock. So the eyes closed exercises hold the screen on with the Wake Lock
and cue by sound everywhere, by vibration only on Android; Reach records a point
only at a reading; Pocket Pacer renders the session to a sound file that keeps
playing through the lock screen.

**Ruled out.** Keystroke timing in other apps (no web or iPhone app can read
another app's keyboard), listening to calls (not possible, not acceptable),
background GPS (not possible on the web), posture, touch pressure or tremor as
anxiety measures (no validation; current iPhones report no touch pressure).

**Not yet tried on a phone.** No unit has been worn, so the patch measures have
run only on the demo series and in tests. Unverified on a handset: the iPhone
motion prompt, the microphone envelope in Safari, the Wake Lock holding a dark
screen for a whole session, Pocket Pacer continuing after lock, Android vibration
cues, the geolocation prompt, step counting from a pocket (owner's iPhone trial).
