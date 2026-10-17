# Mental Mirror (2026-10-17)

A fourth way to take a reading, inside the student app: the front camera, a landmark mesh drawn over the face as it is read, thirty seconds, one Mind Score.

## Pieces
- `src/signals/face-capture.js` — MediaPipe Face Landmarker (`@mediapipe/tasks-vision` 1.1.1), front camera, per-frame record, mesh drawing. Runtime served from `public/mediapipe/wasm` (copied from node_modules by `tools/mediapipe-wasm.mjs` on `predev`/`prebuild`, git-ignored); model at `public/models/face_landmarker.task` (3.7 MB, committed).
- `src/signals/face.js` — DOM-free analysis: blink rate (hysteresis on the eye-blink blendshapes), brow furrow / raise, eye squint, lip press, jaw, eye-aperture variability, head micro-movement, and a contactless pulse (green channel of a forehead patch, band-pass 0.7–3 Hz, spectral peak, quality = peak share of band power, withheld under 0.25).
- `src/signals/face-score.js` — z-scores against the person's own mirror history (Welford, spread floored at 0.3× the prior); the pulse goes through the T-NAM with the person's calibration gains; expression terms are hand-allocated additive terms in display units; ordinary day = 50; wider band (unfitted channel).
- `src/views/MentalMirror.jsx` — consent screen (students, nothing leaves the phone, not a diagnosis, still being validated), live mirror with mesh and running readout, result card with dial, drivers, check-in ("Stressed / Fine") feeding the same calibration as the fingertip reading (`mindmap.phone.checkins`).
- `src/views/CheckIn.jsx` — fourth card on the chooser, `mirror` screen, intent `mirror`.

## Honesty
- The pulse method is published (camera PPG). The expression weights are not fitted: no dataset pairs face video with stress labels on these sensors. Validation set identified: UBFC-Phys (56 people, face video + E4, social stress), access by request. Until it is run, the screen and the chooser say "starting allocation" and the band is wider.
- Frames are never stored or sent. Each becomes ~56 numbers and is dropped.

## Node check
`node --input-type=module` against synthetic frames (pulse at 72 bpm, blink every 4 s): HR 72.0 recovered, quality 0.98, 16 blinks/min; calm → 50, tense face + 96 bpm → 96.
