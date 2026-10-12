# MindMap: the evidence behind the interface

What follows is the proof for the claim on the overview page, that the screens
and the wording are built from published research rather than from taste. Every
row names a source you can open, says how strong it is, and points at the code
that implements it.

**One rule governs the whole document.** This is a *design rationale*, not an
*efficacy claim*. Nothing here says MindMap reduces anybody's stress. It has not
been tested and no claim is made that it has. The site says this in its own
words, in the last line of the Evidence section, because a judge will ask and
the answer is better volunteered than extracted.

---

## 1. What changed, and why

### 1.1 The score is read against a labelled mark, not against a bare scale

**Finding.** Zikmund-Fisher et al. showed 1,618 US adults a lab result as a
number on a scale, and separately as the same number on a scale carrying a
labelled threshold: *"Many doctors are not concerned until here."* For a
near-normal value, the share who said they would contact a doctor urgently fell
from **48–58% to 35%** (χ²(3) = 53.83, p < .001). For genuinely extreme values
there was **no difference** between displays, the anchor did not blunt
appropriate alarm.

**Source.** Zikmund-Fisher, B. J., Scherer, A. M., Witteman, H. O., Solomon,
J. B., Exe, N. L., & Fagerlin, A. (2018). Effect of harm anchors in visual
displays of test results on patient perceptions of urgency about near-normal
values: experimental study. *Journal of Medical Internet Research*, 20(3), e98.
https://doi.org/10.2196/jmir.8889 · Strength: **single large well-powered
experiment, hypothetical vignettes.**

**What it changed.** A stress score has exactly this failure mode: 51 out of
100 is an ordinary Tuesday, and a reader with no reference point reads anything
past the middle of a scale as bad news. The usual day was already on the screen
, as a sentence *under* the picture. The finding is about a mark *on the scale
the number is read against*, so a sentence underneath does not implement it.
The arch now carries the reader's own usual day as a mark across the four
bands, with a head at its outer end so it reads as deliberate, and the sentence
below says what the mark is.

`src/charts/rainbow.jsx` → `UsualMark`

### 1.2 No student is ever ranked against another student

**Finding.** Across 208 laboratory studies, the two things that predicted a
cortisol response were uncontrollability and **social-evaluative threat** 
being judged by other people. Social evaluation present **d = 0.67** against
**d = 0.15** absent. Both present, d = 0.92; neither present, no significant
rise at all.

**Source.** Dickerson, S. S., & Kemeny, M. E. (2004). Acute stressors and
cortisol responses: a theoretical integration and synthesis of laboratory
research. *Psychological Bulletin*, 130(3), 355–391.
https://doi.org/10.1037/0033-2909.130.3.355 · Strength: **large meta-analysis,
the standard citation in this area.**

**What it changed.** Nothing in the student's view compares them to anyone. The
parent screen states it outright. The counselor screen does order students, but
that list is a caseload for the adult and is never shown to the student, which
is the distinction the finding actually draws, since social-evaluative threat
is about the person *being* evaluated knowing it.

`src/views/parent-dash.jsx` · `src/views/Pro.jsx`

### 1.3 Every share is the student's to switch off

**Finding.** Same meta-analysis: an **uncontrollable** stressor produced
**d = 0.52**, a controllable one **d = 0.16** , more than three times the
cortisol response, from controllability alone.

**What it changed.** Nothing is shared by default; every share is revocable;
the student sees each reading before anyone else does. This was already the
product's consent model, the finding is why it is also a stress-design
decision and not only a privacy one.

### 1.4 The reading level is measured, not asserted

**Finding and target.** NIH guidance for patient education material is a sixth
grade reading level. Published material routinely misses it: American Heart
Association pages measure grade 10.7, American Cancer Society 10.0.

**Source.** Will, J., Gupta, M., Zaretsky, J., Dowlath, A., Testa, P., &
Feldman, J. (2025). Enhancing the readability of online patient education
materials using large language models. *Journal of Medical Internet Research*,
27, e69955. https://doi.org/10.2196/69955 · Strength: **cross-sectional single
study; the sixth-grade target is a guideline.**

**What it changed.** `tools/readability/` runs Flesch-Kincaid and SMOG over the
prose the site actually renders. Measured over every text node, including
headings and table cells, the site scores **grade 3.6** , a flattering number
describing nothing anybody reads, because a heading is a label and a table cell
is a fragment. Measured over paragraph prose only: **Flesch-Kincaid 4.5, SMOG
7.4**, 8.6 words per sentence, 6.6% words of three or more syllables.

Both formulas are reported because SMOG lands two to three grades above
Flesch-Kincaid on the same text by construction, and quoting only the friendlier
one is the oldest trick in this area.

Three sentences of 40, 30 and 23 words were split into the sentences they
already contained. Nothing was cut.

`tools/readability/` · `src/views/Pro.jsx` · `src/views/parent-dash.jsx`

### 1.5 The evidence is on the page, with the claim refused

A new **Evidence** section on the overview carries the four decisions above and
closes with: *"None of this says MindMap lowers anyone's stress. It has not been
tested and nothing here claims it has. These are the reasons behind the design,
and every one of them can be looked up."*

`src/views/Overview.jsx` → `EVIDENCE`

---

## 2. What the site already did right

These were not changed. They are listed because they are defensible and should
be claimed.

| What | Finding | Source |
|---|---|---|
| Low visual density, conventional layout | Visual complexity correlates with rated arousal **r = .74** and worse one-week recognition **r = −.40**; aesthetic judgement forms in 17–50 ms and is driven by low complexity **and high prototypicality** (η²p = .58 and .81) | Tuch et al., *IJHCS* 2009, https://doi.org/10.1016/j.ijhcs.2009.04.002 · Tuch et al., *IJHCS* 2012, https://doi.org/10.1016/j.ijhcs.2012.06.003 |
| Statistics as icon arrays with denominator and time frame named | Pictographs and bar formats are read most accurately; always state the denominator and time frame; present absolute not relative risk | Trevena et al., *BMC Med Inform Decis Mak* 2013, 13(S2):S7, https://doi.org/10.1186/1472-6947-13-S2-S7 |
| Evaluative words beside every number ("above her usual range") | Less numerate readers fill bare numbers in with mood and narrative; evaluative labels changed choices without changing recall of the numbers | Peters, *Current Directions in Psychological Science* 2012, https://doi.org/10.1177/0963721411429960 |
| Motion honours the system reduced-motion setting | WCAG 2.3.3 Animation from Interactions, **Level AAA** , above the usual AA bar | https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions |
| Text contrast clears 4.5:1 everywhere, verified on every route | WCAG 1.4.3 Contrast (Minimum), Level AA | https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum |
| No diagnostic language, no clinical cut-offs, person-first wording | APA bias-free language; WHO responsible-reporting guidance | APA *Publication Manual* 7th ed. · WHO/IASP 2023, https://www.who.int/publications/i/item/9789240076846 |

On the last row: USPSTF (2022) reviewed two RCTs (n = 2,675) and found **no
significant short-term distress** from suicide-risk screening, but states
explicitly that **no study examined labelling or stigmatisation**. Because
labelling is unstudied, the conservative design is the right one, which is
also the honest way to answer a judge who asks whether showing a teenager a
number is safe.

---

## 3. What we deliberately do **not** claim

This section is the most valuable one in a judged setting. Each line is a claim
a weaker project would make and we can explain why we didn't.

**"Green is calming."** The largest review of the field: 132 studies, 42,266
participants, 64 countries: concludes in its own words that *"we do not know if
we feel colours"*, and found the handful of studies testing colour effects on
emotion or physiology inconclusive. A critical review of healthcare colour
states *"there are no direct linkages between particular colors and health
outcomes"* and calls the literature *"fragmented, sporadic, conflicting,
anecdotal."*
→ Jonauskaite & Mohr, *Psychonomic Bulletin & Review* 2025,
https://doi.org/10.3758/s13423-024-02615-z · Tofle et al., *Color in Healthcare
Environments* (CHER, 2004),
https://www.brikbase.org/sites/default/files/chd_color_in_hc_environ.pdf
**What we say instead:** the palette follows documented colour–emotion
*associations* and is kept light and desaturated, the two dimensions that review
identifies as most consistent. No physiological claim.

**"Red raises anxiety or hurts performance."** Meta-analysis of 22 publications,
38 samples: anagrams Δ = −0.06 ns, knowledge Δ = −0.04 ns, overall Δ = −0.13,
estimated power ~18%, and after publication-bias correction *"no evidential
value."*
→ Gnambs, *Psychonomic Bulletin & Review* 2020,
https://doi.org/10.3758/s13423-020-01772-1

**"Curves reduce the threat response."** The curvature preference is real for
simple, briefly-presented forms but fails to replicate for furniture and
interiors, and the amygdala result is one small fMRI study that invites a
reverse-inference objection.
→ Bar & Neta, *Psychological Science* 2006 · Chuquichambi et al., *i-Perception*
2025, https://doi.org/10.1177/20416695251341682

**"Attention Restoration Theory supports our nature imagery."** A systematic
review of 31 studies found only **3 of 13 meta-analyses significant**, and only
7 studies rated high quality. Ulrich's famous 1984 window study is 46 patients
and has never been properly replicated; Ulrich himself cautions about it.
→ Ohly et al., *J Toxicol Environ Health B* 2016,
https://doi.org/10.1080/10937404.2016.1196155 · Ulrich, *Science* 1984

**"Slow animation calms people."** The two papers usually cited show the effect
belonged to the *music* in one case and to *processing fluency* in the other,
not to reduced arousal. Slow easing is justified here on fluency and
vestibular-safety grounds only.
→ Wöllner et al., *PLoS ONE* 2018 · Stuppy et al., *JMR* 2024

**"50–75 characters per line improves reading."** The study this rule comes from
found 100-character lines were read *faster*, with comprehension unchanged;
shorter lines were merely *preferred*.
→ Dyson & Kipping, *Visible Language* 1998

**"Easier text is less stressful text."** The health-literacy literature
measures comprehension, not stress, and a large oncology RCT of a simplified
consent form improved satisfaction without reliably improving comprehension.
Readability is a floor, not a result.

---

## 4. Open options, not yet done

1. **Desaturate the four signal colours.** Saturation tracks arousal more
   consistently than hue does (Jonauskaite & Mohr 2025), and colourfulness is
   one of two computational predictors of first-impression judgement (Reinecke
   et al., *CHI '13*, https://doi.org/10.1145/2470654.2481281). Four fully
   saturated hues on the dial is the least evidence-aligned thing left on the
   site. Not changed unilaterally because it alters the look everywhere.

2. **A breathing pacer in the app at 5.5–6 breaths per minute.** Resonance
   frequency is ~0.1 Hz, refined to ~0.09 Hz ≈ 5.5 breaths/min, an 11-second
   cycle (Lehrer & Gevirtz, *Frontiers in Psychology* 2014,
   https://doi.org/10.3389/fpsyg.2014.00756). Meta-analysis of 12 RCTs puts
   slow breathing at **g = −0.35** for stress and −0.32 for anxiety (Fincham et
   al., *Scientific Reports* 2023,
   https://doi.org/10.1038/s41598-022-27247-y). Defensible to build; the claim
   would have to be about the *technique*, never about our implementation,
   which has not been tested.

3. **Score the copy against the CDC Clear Communication Index.** 20 scored
   items, 100-point scale, ≥90 passes. A named federal instrument with a
   threshold is the single most checkable thing available in this area.
   https://www.cdc.gov/ccindex/pdf/clear-communication-user-guide.pdf

---

## 5. Three citations to verify before printing

Flagged honestly rather than quietly used.

1. **Coyne et al. (2003)**, *Journal of Clinical Oncology* 21(5):836–842: the
   easy-to-read consent RCT. Widely reported as a null result on comprehension.
   Behind a paywall; confirm before citing.
2. **Readability of publicly available mental health information**, *Patient
   Education and Counseling* (2023), PMID 36944285, the most on-topic review
   for this domain.
3. **The completed #chatsafe RCT** (protocol https://doi.org/10.2196/44300) 
   needed before describing #chatsafe as *effective* rather than
   *consensus-based*. The guidelines themselves are a six-stage Delphi study
   with 103 experts including 74 young people: Robinson et al., *PLoS ONE* 2023,
   https://doi.org/10.1371/journal.pone.0289494

---

## 6. How to defend this in three sentences

> Every interface and wording decision on this site is traceable to a published
> source, and the sources are named on the site itself. We have not tested the
> product and we make no efficacy claim: what we claim is that the design is
> reasoned rather than decorative. Where the popular design literature is wrong,
> such as colour psychology, we cite the papers that say so and decline to make
> the claim.

---

## 7. Verification of this build

- 15 routes at 1280 px and 390 px: 0 errors, 0 overflow, 0 horizontal scroll,
  0 em dashes
- Every text node clears WCAG AA contrast on all 15 routes
- 22 of 22 on the standing feedback sweep
- Reading grade re-measured after the copy edits

Re-run the gates with `tools/readability` and the browser checks described
in the README after any change to the copy.
