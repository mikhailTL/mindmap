# Changelog

What actually changed, grouped by the days work landed. Every entry below is
drawn from the commits in this repository; nothing is listed that was not
built. Dates are the dates the work was committed.

MindMap has no users, no trial and no clinical validation. Numbers on screen
are generated, and the hardware described by the site has not been built.

## 2026-10-12

The release the Congressional App Challenge entry is submitted from.

- The Mind Score is now computed by a small fitted network over the four
  signals instead of a hand written formula.
- The overview shows the model, the patch and the people, rather than
  describing them.
- One screen per app route. The product header that used to sit inside the
  app screens is gone.
- The parent week is drawn instead of written out.
- Each reading opens from its own card.
- The Teen Toolkit was added, for students and for parents.
- The usability survey is numbered and cut to thirteen questions, and asks for
  a name on the survey itself rather than in front of the site.
- The opening walkthrough was rebuilt as a walkthrough and cut from 86 seconds
  to 30.
- An iOS wrapper and its App Store readiness notes were added.
- Four dead modules and one opaque directory were deleted, the comments were
  rewritten as comments, and the em dashes were taken out of the
  documentation.
- The patch is drawn at its real size, with the design work shown.

## 2026-10-11

- Survey responses go through an endpoint of this project's own in front of
  the relay, so a response can no longer be lost, and the button submits
  rather than downloads.
- Photographs replaced the illustrated placeholders: the patch is composited
  onto licensed photographs at its real 54 x 36 mm.
- Three dashboards cut to the bone, scroll in 3D, and motion put behind a
  frequency gate.
- Content that was never being drawn, and photographs that could never
  update, were both fixed.
- The footer was given room to clear the feedback pill.

## 2026-10-09 to 2026-10-10

- The daily number got one name, Mind Score, held in a single vocabulary file
  so every screen says the same word.
- Every tester note was answered in the site's own words.

## 2026-10-05 to 2026-10-07

- A teal palette, photographs, and a hero that is not two paragraphs.
- Heading scale reworked, aqua section grounds introduced, rules replaced with
  cards, and the copy rewritten to say what each thing is.
- Every Congressional App Challenge requirement checked against a real
  browser.

## 2026-09-27 to 2026-09-29

The green rebuild.

- New palette, reordered homepage, sourced problem statistics.
- Full height hero with both devices, the patch moved to the upper arm, stats
  moved onto the dark band.
- Product navigation, compact sensor tiles, and the generated photo removed.

## 2026-09-13 to 2026-09-20

- Hash routed views for the site and for the three app audiences: student,
  parent, medical professional.
- A reading taken without the patch, from camera PPG, voice and motion.
- The interactive CAD viewer of the patch assembly was integrated.
- The homepage became a launcher, with an onboarding animation and three
  screen tiles.
- The usability survey and its results page were mounted, dead routes retired.
- The score dial was replaced with a fused arch, one band per sensor.

## 2026-09-07

- First build: MindMap patient edition, React 18 with Tailwind and Vite, real
  CAD and the three dashboards.

## Current version

1.0.0, as of 12 October 2026.
