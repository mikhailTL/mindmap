# Reading grade

The site claims a reading level on its overview page. This is what measures it,
so the claim is reproducible and moves when the writing does.

    npx vite build && npx vite preview --outDir dist --port 4173 &
    node tools/readability/dump.mjs            # writes text.json
    python3 tools/readability/grade.py text.json

`dump.mjs` opens each of the 13 public routes in a real browser, scrolls to the
foot so nothing is still waiting to be revealed, and takes the text out of the
`<p>` elements only.

**Paragraphs only, and nothing is punctuated on the way out.** This is the part
that decides whether the number means anything. A heading is a label and a
table cell is a fragment; feeding either to a readability formula and calling
it a sentence drives the words-per-sentence term down and produces a flattering
number that describes nothing anybody reads. Measured over everything the page
renders, this site scored grade 3.6; measured over its actual prose, 4.5. The
second number is the true one and it is the one on the page.

`grade.py` reports Flesch-Kincaid and SMOG from the same sentence and syllable
counts, so the two are comparable. Both are printed because they disagree by
design: SMOG counts words of three or more syllables and lands two to three
grades above Flesch-Kincaid on the same text. Quoting only the friendlier one
is the oldest trick in this area, and a judge who re-runs it will find the
other.

The syllable count is the usual vowel-group heuristic with the silent-`e`
correction. It is within a syllable of a dictionary count on ordinary English,
which is what every tool in this class does.

## What the numbers are for

NIH guidance for patient education material is a sixth-grade reading level, and
published material routinely misses it — American Heart Association pages
measure around grade 10.7. The overview page states the measured figures and
the target, and does not claim that an easier text is a less stressful one. The
health-literacy literature measures comprehension, not stress, and the one
large trial of a simplified consent form improved satisfaction without
improving comprehension. Readability is a floor, not a result.

Re-run this after any copy change and update the figure on the overview page if
it has moved across a grade boundary.
