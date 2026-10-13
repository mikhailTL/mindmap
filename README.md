# MindMap

A stress tracker for teenagers: a wearable patch that reads four body signals,
and an app that turns a day of them into one number and one sentence.

This repository is the web front end: the marketing site that explains the
product, and an interactive prototype of the three app views (student, parent,
school counsellor). The hardware and firmware live elsewhere.

Built for the Congressional App Challenge and the Conrad Challenge.

**Live:** https://mindmappaitent.vercel.app

> MindMap reports patterns in body signals. It is not a medical device, it does
> not diagnose or treat any condition, and no screen in here is a clinical
> finding. Every number in the prototype is generated; no person has been
> measured.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # -> dist/
npm run preview    # serve the build on :4173
```

Node 20 (`.nvmrc`). No backend is needed to run the site; `api/` is a single
Vercel function and is optional (see [docs/survey.md](docs/survey.md)).

## Routes

Hash-routed, no router dependency. Fifteen views in two groups.

**The site.** What MindMap is, for somebody who has not used it.

| Route | What it is |
|---|---|
| `#/site` | Overview |
| `#/patch` | The patch: what it reads, how it is built |
| `#/without-patch` | Taking a reading with a phone camera instead |
| `#/student` `#/parent` `#/pro` | What each audience gets |
| `#/privacy` | Who sees what, and what is never shared |
| `#/tour` | The whole product in one page |

**The app.** The screens somebody would actually open.

| Route | What it is |
|---|---|
| `#/app` | Pick a view |
| `#/app-student` | The daily score, its four signals, the week |
| `#/app-parent` | One sentence a week, and which days ran high |
| `#/app-pro` | A counsellor's caseload, consent-scoped |
| `#/check` | Take a reading: patch, phone camera, or demo |
| `#/survey` `#/responses` | Usability survey and its results |

An opening walkthrough plays on first load and can be skipped permanently.

## Layout

```
src/
  views/      one file per route, plus the shell and the walkthrough
  charts/     every drawing: the score arch, the sensor traces, the 3D viewer,
              the problem statistics
  ui/         buttons, cards, section furniture, the logo
  signals/    the scoring network and the generated readings behind it
  survey/     the usability instrument, its store, and delivery
  lib/        design tokens, sensor definitions, shared vocabulary
  photos/     licensed photographs, imported so Vite content-hashes them
api/          one serverless function, optional
ml/           the network: training, evaluation, and the generated weights
tools/        the scripts that produce and check what ships
docs/         setup and design notes
public/di/    the vendored 3D patch viewer (see below)
```

Two conventions worth knowing before editing:

- **Vocabulary lives in `src/lib/terms.js`.** The daily number is called the
  same thing on every screen because every screen imports the same constant.
- **Photographs are imported, never linked.** Vercel serves `public/` with
  `cache-control: immutable`, so a photograph replaced under its old filename
  is invisible to anyone who has already visited. Going through Vite gives each
  file a content hash. `src/lib/photos.js` is the map.

## The network

The daily reading is not a weighted formula. `src/signals/tnam.js` is a temporal
neural additive model - one learned curve per signal, then a GRU over eight
four-minute windows, 4,572 parameters - running in the page with no server and
no dependencies.

`ml/` is how it was made, committed so the claim is checkable rather than
asserted: `ml/tnam.py` is the network, `ml/research.py` is the run that produced
the weights the browser loads, and `ml/results/` holds its output. On WESAD with
leave-one-subject-out validation it reaches 0.997 AUROC against 0.887 for the
formula it replaced, winning on 13 of 15 subjects (p = 0.0015).

It also fails in a way the site prints rather than hides: on a dataset where
distress was induced by film it scores that distress at 0.281, below rest. See
`ml/README.md` and `docs/tnam-handoff.md`.

## The 3D patch viewer

`public/di/arena/` is a vendored, self-contained WebGL viewer for the patch
assembly: a 621 KB script and a 20 MB geometry file holding 178 bodies. It is
exposed as a custom element and driven through `src/charts/arena.jsx`.

It is a build artifact from the CAD pipeline and is checksummed there. **Do not
edit anything in that directory.** Regenerate it upstream instead.

This is also why a clone is large.

## Checking what ships

`tools/` holds the scripts that build and verify the site rather than a folder
of one-off helpers.

```
tools/photos/       composites the patch onto licensed photographs at its real
                    54 x 36 mm, and crops every image the site uses
tools/readability/  measures the reading grade of the prose the site renders
tools/survey-endpoint.gs
                    an Apps Script web app that receives survey responses
```

Both have a README explaining the decisions that are easy to get wrong:
patch orientation in one, what counts as a sentence in the other.

Beyond those, the site is held to four gates, run against a real browser on a
production build:

- **Layout.** All 23 routes at 1280 px and 390 px: no console errors, no
  element wider than its container, no horizontal scroll, no em dashes.
- **Contrast.** Every text node on every route clears WCAG AA (4.5:1).
- **Reading grade.** Flesch-Kincaid and SMOG over the rendered prose.
  Currently 4.5 and 7.4; NIH guidance for health material is grade 6 or below.
- **Walkthrough fit.** All five beats at both widths, with every heading,
  sub-line and label inside the viewport and three reachable controls.

## Design notes

Interface and wording decisions are traceable to published sources rather than
to taste, and [docs/design-evidence.md](docs/design-evidence.md) is the proof:
every decision, its citation, how strong that evidence is, and, in the longest
section, the claims the project deliberately refuses to make, with the papers
that say why.

The short version: the score is read against a labelled mark rather than a bare
scale (Zikmund-Fisher et al., 2018); no student is ever ranked against another
and every share is revocable (Dickerson & Kemeny, 2004); and no claim is made
that any of it reduces anybody's stress, because that has not been tested.

## Deploying

```bash
npx vercel --prod
```

`vercel.json` carries the SPA rewrite and the cache headers. Netlify
equivalent: build `npm run build`, publish `dist`, add `/* /index.html 200`.

## Credits

Photographs are licensed from Adobe Stock; the IDs are listed in
`tools/photos/README.md`. Statistics are from the CDC Youth Risk Behavior
Survey (2023) and NIMH/NSDUH (2021) and are cited on the pages that use them.

