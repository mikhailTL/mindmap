# Demonstration video script

Hard cap **3:00** (Rules §4). This script is 403 words of narration: **2:31** at 160 words a
minute, **2:41** at 150, plus two silent scrolls. The example
rubric awards a point for organisation *and* penalises overruns, so the
headroom is deliberate: do not fill it.

Every required element is present and marked in the margin, because the
rulebook names them: participant names, app name, purpose in one sentence,
target audience, tools and languages, showcase of functionality.

Two blanks only you can fill are marked `[ ]`. Do not let me guess them.

---

## 0:00 - 0:14  ·  names, app name, purpose, audience

> I'm `[full name]`, a `[grade]`th grader at `[school]`. This is MindMap.
>
> MindMap tells a teenager when their body is working harder than usual,
> before they notice it themselves. It is for teenagers, and for the parents and
> clinicians they choose to share with.

*On screen: the landing page. Nothing clicked yet.*

## 0:14 - 0:36  ·  the problem

> In 2023 the CDC found 40 percent of high school students felt persistently
> sad or hopeless, and 20 percent seriously considered suicide. Ten years
> earlier that first figure was 30.
>
> The usual answer is to ask a teenager how they feel. MindMap asks their
> body instead.

*On screen: the statistics section. Let the figures sit still; they do not
animate.*

## 0:36 - 1:06  ·  open it, in one click

> No signup. One click.

*Click into the app. The entry chooser appears.*

> You say what describes you, and it opens where you belong.

*Choose Student. Let the dashboard land.*

> The first thing a student sees is a sentence.
>
> "Your day has been above your usual range since about two in the
> afternoon."
>
> Not a number to interpret - a sentence. Under it, the reading, and the four
> signals behind it: pulse, sweat, skin temperature, movement.

*Scroll the dashboard once, slowly. Do not narrate the scroll.*

## 1:06 - 1:52  ·  the engineering

> That number comes from the Mind Score network, which I wrote and trained
> myself.
>
> It is a temporal neural additive model, 4,572 parameters. Every signal gets
> its own learned curve, so what the network believes about pulse is a line you
> can read. Then a small recurrent layer looks across eight
> windows - four minutes of history - because stress is a shape over time,
> not a snapshot.

*On screen: the per-signal curves, then the window strip.*

> I trained it on WESAD, fifteen adults, holding one person out at a time. It
> separates stress from rest with an AUROC of 0.997, against 0.887 for the
> hand-written formula it replaced. It wins on thirteen of the fifteen
> people, p equals 0.0015. It runs in the browser. There is no server.
>
> It also has a real failure: on a different dataset it scores emotional
> distress at 0.281, below rest. That is printed in the product, not only in
> my notes.

*On screen: the limits section, with that number visible.*

## 1:52 - 2:20  ·  the patch

> The patch is a printed shell for the upper arm. It is Bluetooth Low Energy:
> no cable, no host computer, nothing to install. One button pairs it.

*On screen: the pairing flow.*

> And without one, the phone camera reads your pulse from a fingertip. Same
> network, fewer signals, and the app says so.

## 2:20 - 2:40  ·  privacy, tools, close

> A parent never sees anything finer than a day. Never notes, never location.
> Every record a clinician opens is logged, and no setting turns the log off.
>
> Built in React and JavaScript, with Tailwind and Vite. Trained in Python
> with PyTorch and exported to plain JavaScript. 86 tests. Every page clears
> AA contrast.
>
> MindMap. It asks the body.

---

## Shooting notes

- **The pairing shot.** No assembled unit exists in the repo's record. If you
  have built one, film the real thing - it is the single strongest twenty
  seconds available to you, and the rival shows no hardware at all. If you
  have not, film the on-screen pairing flow only and say "the pairing flow",
  not "pairing my patch". Do not film a shell and let it read as a working
  unit.
- **Screen recording, not a phone pointed at a monitor.** The UI point is
  lost at 30 degrees off axis.
- **One take per section**, then cut. Do not try to run 2:40 live.
- **Captions.** Burn them in. Judges watch with sound off more often than you
  would like.
- **Upload public on YouTube**, not unlisted. Unlisted has failed for
  entrants before.
