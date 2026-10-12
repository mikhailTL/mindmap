# Requirements sheet

Everything the owner has asked for, grouped by the surface it lands on. Read
with `docs/design-spec.md`, which is the design contract these requirements are
built on top of. Nothing here overrides the spec's honesty rules in section 9.

Deadline: noon EDT, Monday 26 October 2026.

## A. The marketing site
Files: `src/views/Overview.jsx`, `src/views/PatchPage.jsx`, `src/views/Pairing.jsx`,
`src/charts/pairing-art.jsx`, `src/views/Methods.jsx`, `src/charts/problem.jsx`,
`src/charts/infographics.jsx`

1. Elements are too big, blocky and babyish. Sleek and condensed instead.
2. Cards and containers come back. Text directly on a tinted band is rejected.
3. Far too much blank space. Density per spec section 1.
4. No paragraphs. A judge will not read them.
5. Photographs integrated throughout the landing page, across different cards
   and areas. One strip of equal thumbnails is rejected as low effort.
6. "30% to 40%, the first figure, ten years earlier" is too vague. Clear,
   profound statistics: two labelled values on one chart, 30% in 2013 and 40%
   in 2023, CDC YRBS Data Summary and Trends Report 2013 to 2023.
7. Technical detail belongs on one tab, `#/methods`, not on the landing page.
8. "Inside the patch" belongs under the patch page, not the landing page.
9. Pairing is one button, then progressive disclosure. Not a whole webpage.
   Troubleshooting appears only after the reader says it is not working.
10. Taskbar sections are too similar to each other. The nav is now Overview,
    The patch (menu), How it works, Who uses it (menu), Give feedback.
11. The app opens in no more than three clicks from the landing page.
12. The onboarding walkthrough must actually appear, on every visit, with a
    skip always visible.

## E. Entry and the guided tour
Files: `src/views/Entry.jsx` (new), `src/views/Intro.jsx`

1. On entering, the visitor is asked what best describes them, with four
   choices: Student, Parent, Medical professional, Other.
2. Each of the first three takes them to the part of the site written for them.
3. Other starts a guided tour: the site moves through its own pages by itself
   and explains each one simply, as a user manual rather than a design piece.
4. The walkthrough must actually appear, on every visit, with a skip always
   visible, and must be reachable again afterwards.
5. The whole thing is functional and easy to use before it is anything else.

## B. The app dashboards
Files: `src/views/Monitor.jsx`, `src/views/Students.jsx`, `src/views/parent-dash.jsx`,
`src/views/Parents.jsx`, `src/views/Pro.jsx`

1. The interface is far too simple. Escape minimalism. Distinct elements and
   different parts of the dashboard, each in its own card.
2. The dial must sit in a card. On the app's tinted ground it reads badly.
3. The per-signal graphs were removed and must come back: each of the four
   signals gets its own value, direction and small chart.
4. More technologically complex without being harder to use. The confidence
   band, baseline days, the driver, the held state and the consent ledger all
   exist in the data layer and are not on screen.
5. No invented person's name anywhere. The name Maya is out.
6. Clouds on the student dial only, not the parent one.
7. Consent model unchanged: a parent sees nothing finer than a day, never
   Notes, never Location, never a raw reading; a medical professional sees only
   what was consented to; groups under the k-anonymity floor return nothing;
   every record opened is logged and no setting turns the log off.

## C. App functionality
Files: `src/app/` and the wiring the lead owns in `src/views/App.jsx`

1. There is no crisis or getting-help path. There must be one, reachable from
   anywhere in the app, working without a reading, a patch or an account.
   Resources must be verified live, not written from memory. NEDA's helpline is
   permanently disconnected; the National Alliance for Eating Disorders is the
   live one. No promises about confidentiality or what authorities will do.
2. There are no notification options. Real controls: whether, when, and what a
   lock screen may say. Least intrusive by default. No streaks, no guilt, no
   nagging.
3. There are no teen-selected privacy options. The student chooses what leaves
   their phone, per field and per audience, and can revoke. The interface must
   express the existing consent model exactly and never exceed it, and must say
   honestly that crisis handling is the one thing that cannot be switched off.
4. Not enough truly interactive features. It still does not feel like an app.
5. No backend and no accounts. Settings live on the device, following the
   conventions in `src/survey/store.js`. Nothing typed leaves the device.

## D. The Teen Toolkit
Files: `src/views/Toolkit.jsx`, `src/kit/`

1. Titles are vague and non-descriptive. "Two ways to open it" is rejected.
   Every activity gets a short, concrete feature name a teenager recognises
   before tapping, plus a one-line subtitle saying what it does. Where a
   technique has a common name, use it; where ours goes further, say how.
2. The graphics are low quality. They must be designed and animated, with
   motion that teaches the activity rather than decorating it.
3. It must be peaceful and uplifting, not cold and edgy. Stress-management
   apps are the reference for theme and graphics. A monotonous stack of
   colourless cards with minimalist diagrams is rejected. Neo-brutalist is an
   acceptable direction if taken wholly. See design-spec section 7b.
4. Absolute, for a mental-health product used by teenagers: never suggest
   physical discomfort as a coping strategy; no diagnostic language or clinical
   cut-offs; no streaks, guilt, nagging or comparison between students; nothing
   typed leaves the device; nothing is labelled "AI", because none of it is.

## Cross-cutting, applies to every category

1. The site must read as more professional than it currently does. The owner
   compares it unfavourably to a rival entry and that comparison is the bar.
2. Not edgy, not startup-modern. Functional and easy to use.
3. Every infographic and diagram goes up a notch in real complexity so none of
   them looks babyish. More information per figure, never more decoration.
4. Nothing already asked for may be dropped while something new is added.
