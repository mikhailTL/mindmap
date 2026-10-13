# Written responses

The rulebook gives the six questions as "similar to the following", so the
wording on the form may differ slightly. These answers are written to survive
small rewordings.

Every number here is checked against the repository. Nothing is rounded up.

---

## 1. What is the title of your app?

MindMap.

---

## 2. Explain the app's purpose.

MindMap tells a teenager when their body is working harder than usual, before
they notice it themselves.

It reads four signals - pulse, sweat, skin temperature and movement - from a
Bluetooth patch worn on the upper arm, or from a phone camera when there is no
patch. A neural network turns those signals into one reading out of 100, and
the app opens with a sentence rather than a number: "Your day has been above
your usual range since about two in the afternoon."

The distinction the whole product rests on is that MindMap measures
physiology, not feeling. It never says "you are more anxious than usual",
because that is a claim about an emotion it did not measure. It says what the
body did, and then asks the teenager what the day was actually like. The two
answers sitting side by side are the point.

A teenager chooses what a parent or a clinician can see. A parent never sees
anything finer than a day, never the notes, never location. Every record a
clinician opens is written to an audit log, and no setting turns that log off.

---

## 3. What inspired you to create this app?

**This answer is yours to write and I have not written it for you.** What is
below is the frame it should sit in; the first paragraph has to be the real
thing, in your words, and a judge can tell the difference immediately.

> `[Two or three sentences: the specific moment, person or observation. Not
> "mental health is important" - the actual thing that happened.]`

The frame, if it is useful:

The adult version of this problem is already solved. Someone who wants to know
what their body is doing buys a watch that tracks it continuously. The teenage
version is not solved, and the reason is that almost every tool built for
teenagers asks them to report how they feel - a check-in, a mood slider, a
survey - at exactly the moment they are least willing to answer honestly. The
CDC's 2023 survey found 40 percent of high school students persistently sad or
hopeless and 20 percent seriously considering suicide, and those numbers come
from asking. The ones who do not answer are not in them.

So MindMap does not start by asking. It starts by measuring, and it earns the
right to ask second.

---

## 4. What technical or coding difficulty did you face, and how did you address it?

The hardest bug in the project was one where every test passed.

The Mind Score comes from a temporal neural additive model I wrote and trained:
one learned curve per signal, then a small GRU over eight four-minute windows,
4,572 parameters total. Trained on the WESAD dataset with
leave-one-subject-out validation, it separates stress from rest at an AUROC of
0.997, against 0.887 for the hand-written formula it replaced - it wins on 13
of the 15 subjects, p = 0.0015.

When I shipped it, the app started scoring people higher the more they moved.

The cause was that the model had learned the truth about its training data and
the wrong thing about my product. In WESAD, the stress condition involves
standing and speaking, so movement genuinely correlates with stress in that
lab. The model learned a motion curve that rises with movement, which is
correct for WESAD and useless for a teenager walking to class. Measured on
held-out subjects, 73.4 percent of the model's confident readings on moving
windows were attributable to motion alone. A student who ran up a flight of
stairs got the same reading as a student having a hard day - and the app's own
screen was telling them the number meant something about stress.

No unit test caught it, because every test asserted the model matched its
training distribution, which it did. The failure was only visible as a
contradiction between the number and the sentence printed next to it.

The fix was to stop asking the model a question it could not answer. Above
0.35 g of movement the temporal term is dropped and the heart terms fall back
to the hand-written formula, which the transfer study had shown degrades
gracefully off-distribution (0.786 against the model's 0.777 on an unseen
dataset). The reading is marked `held`, the screen says why, and - the part
that mattered most - a reading taken while moving is never stored as a
calibration label, so a run for the bus cannot teach the model that running is
what your stress looks like. Motion attribution fell from 73.4 percent to 30.1
percent.

What I took from it: a model that beats a formula on the benchmark can still
be worse than the formula in the product, and the test that would have caught
it was not a test of the model at all. It was reading the screen.

---

## 5. What did you learn while participating in the CAC? Biggest takeaway?

That the credibility of a product is set by the claim it refuses to make.

My model has a real failure, and I know exactly what it is: on a dataset where
distress was induced by film rather than by a lab stressor, it scores that
distress at 0.281 - below resting. My first instinct was to leave that out of
the submission. I put it in the product instead, on the page, where a user
reads it.

Three things changed once I started doing that consistently. The language got
simpler, because a sentence you are willing to defend is shorter than one you
are hedging. Features disappeared, because several of them existed to imply
something I could not demonstrate - there is nothing in MindMap labelled "AI"
that is not a model I trained, and there is no backend pretending to sync.
And the hard engineering became explainable, because the honest version of
"4,572 parameters, 0.997 AUROC, fails at 0.281 on emotional film" is a
sentence a non-specialist can follow, where "AI-powered wellness insights" is
not.

The technical takeaway sits underneath that one: I built a verification
harness before I built most of the features - a headless browser that walks
all 23 routes at phone and desktop width and fails the build on an element
that overflows or a text node under 4.5:1 contrast, plus 86 unit tests. It
caught things I would never have found by looking, and it is also the reason I
know what it does not catch. The movement bug in question 4 passed every one
of those checks.

---

## 6. What would you change in a 2.0 version?

**Build the patch and put it on people.** The electronics are specified, the
shell is modelled and printed, and the firmware protocol is defined - but the
model has never seen a reading from my own hardware. Everything quantitative
in MindMap today comes from WESAD, which is 15 adults in a lab. A teenager's
resting physiology is not an adult's, and a hallway is not a lab. Until I have
worn data, every number in the product is a number about somebody else.

**Fix the failure I know about.** The emotional-film result (0.281) says the
model has learned the physiology of a lab stressor and not the physiology of
feeling bad while sitting still, which is the case teenagers are actually in
most often. That needs a training set that contains it.

**Make calibration the default rather than a feature.** Eight personal
check-ins take the model from 0.777 to 0.946 on an unseen person. That is the
largest single gain available anywhere in the system and it is currently
something a user has to discover.

**A real backend, done properly or not at all.** Sharing today is honest about
being local to one device. Making it genuinely work across a teenager's phone
and a clinician's browser means encryption, key handling, retention and
deletion for health data belonging to minors - which is a larger and more
serious job than the app itself, and the wrong thing to half-ship.

**What I would not change:** the sentence stays about the body, the parent view
stays coarse, and the audit log stays unremovable.
