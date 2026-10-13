# AI use disclosure

Required by Rules §3: AI use must be fully disclosed, and must not constitute
the entirety of the technical development.

## Where AI was used

I used Claude (Anthropic) as an assistant throughout development, in these
roles:

- **Code review and refactoring.** Reviewing components I had written,
  flagging duplication, and proposing structural changes to the React tree.
- **Implementation of specified components.** Where I had decided what a
  screen or module should do, I used it to draft the JSX and Tailwind for it,
  then edited and integrated the result.
- **Writing and running the verification harness.** The headless-browser
  checks (route walking, overflow detection, contrast measurement) and a
  portion of the 86 unit tests.
- **Research with sources.** Locating the CDC YRBS figures used on the site,
  and verifying each crisis-line phone number against its own publisher.
- **Prose.** Drafting and condensing copy on the marketing pages, against
  wording rules I set.

## Where it was not

- **The problem, the product and every design decision are mine**, including
  the decision the whole product rests on: that the reading describes the body
  and never claims a feeling.
- **The model is mine.** The architecture (one additive curve per signal, then
  a GRU over eight windows), the choice of WESAD, the leave-one-subject-out
  protocol, the significance testing, the movement-confound analysis and the
  fallback that fixes it. The failure modes in the written responses are ones
  I found and measured.
- **The hardware** - signal choice, enclosure, placement on the upper arm,
  the decision to be Bluetooth rather than tethered.
- **The privacy model** - what a parent can see, the k-anonymity floor, the
  audit log that cannot be switched off.

## How to check this

The repository is public, with full commit history: every change is
attributable and the sequence shows the work.

The model is checkable rather than asserted. `ml/` holds the training code
(`ml/tnam.py`), the experiment run that produced the shipped weights
(`ml/research.py`), the three dataset converters, and the result files the site
prints its figures from. The datasets themselves are licensed and not
committed. `tools/` and `tests/` hold the harness that checks every route for
layout, contrast and reading grade on each build.
