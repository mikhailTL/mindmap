# Mental Mirror (2026-10-17)

A way to take a reading under the Reading tab (chooser card on route `reading`; `#/mirror` still renders it): the front camera, the face model's landmarks and live values drawn on the face, thirty seconds, one Mind Score.

## Pieces
- `src/signals/face-capture.js` — MediaPipe Face Landmarker (`@mediapipe/tasks-vision` 1.1.1), front camera, per-frame record, overlay (`drawOverlay`). Runtime served from `public/mediapipe/wasm` (copied from node_modules by `tools/mediapipe-wasm.mjs` on `predev`/`prebuild`, git-ignored); model at `public/models/face_landmarker.task` (3.7 MB, committed).
- `src/signals/face.js` — DOM-free analysis: blink rate (hysteresis on the eye-blink blendshapes), brow furrow / raise, eye squint, lip press, jaw, eye-aperture variability, head micro-movement, and a contactless pulse (green channel of a forehead patch, band-pass 0.7–3 Hz, spectral peak, quality = peak share of band power, withheld under 0.25).
- `src/signals/face-score.js` — z-scores against the person's own mirror history (Welford, spread floored at 0.3× the prior); the pulse goes through the T-NAM with the person's calibration gains; expression terms are hand-allocated additive terms in display units; ordinary day = 50; wider band (unfitted channel).
- `src/views/MentalMirror.jsx` — four-line consent (students only, no picture kept, not a diagnosis, how it reads), live mirror with overlay, short result (dial, one line, score, range, pulse, check-in feeding `mindmap.phone.checkins`, "What moved it" detail), wrapped in an error boundary ("Something went wrong. Try again." + retry).
- `src/views/CheckIn.jsx` — fourth card on the chooser, `mirror` screen, intent `mirror`.

## Honesty
- The pulse method is published (camera PPG). The expression weights are not fitted: no dataset pairs face video with stress labels on these sensors. Validation set identified: UBFC-Phys (56 people, face video + E4, social stress), access by request. Until it is run, the band stays wider; the screen does not claim validation either way.
- Frames are never stored or sent. Each becomes ~56 numbers and is dropped.

## Node check
`node --input-type=module` against synthetic frames (pulse at 72 bpm, blink every 4 s): HR 72.0 recovered, quality 0.98, 16 blinks/min; calm → 50, tense face + 96 bpm → 96.

## 2026-10-17 integration pass
- One record per camera frame (dedupe on video.currentTime): a 60 Hz screen over a 30 fps camera had logged every frame twice, which halved head-movement medians.
- Head movement now uses each step's own time, so it no longer assumes 30 fps.
- Slow devices: captures need 60 face frames (not 180); the pulse is withheld under 8 frames/s instead of the whole reading failing.
- GPU delegate falls back to CPU; Stop resolves the capture with null; forehead patch inset from the hairline.
- Dial shows four bands (Pulse, Brow, Eyes, Mouth and head), each 0-100 with 50 = own usual; the sentence says "the typical range" until the person has history.
- tests/face.test.js: planted 72 bpm read back within 2 bpm, blink rate, frame-rate independence, ordinary day near 50, tense face scores higher, 5 fps still scores.
- Headless Chromium with a fake camera (a still photo, pulse planted in the green channel): model loads, mesh draws, a result renders and is logged.

## 2026-10-17 crash pass (headless Chromium, fake camera, MediaPipe 1.1.1)
Root causes, each reproduced:
- **A failed detectForVideo call breaks the landmarker for good.** Probed on fresh landmarkers (GPU and CPU): a repeated or lower timestamp ("Packet timestamp mismatch on ... norm_rect"), a video with no frame yet (readyState 0, 0x0: "RET_CHECK failure ... roi->width > 0"), or a 0x0 canvas each throw once, and every later call throws "Graph has errors" even with a good frame and a higher timestamp. The landmarker is a page singleton and the capture swallowed per-frame errors, so after one bad call every later reading on the page recorded no frames. Ended frames from a stopped track, fractional and far-apart timestamps are fine. Fix: no call without `frameReady` (readyState >= 2 and a size); timestamps from one page-wide clock (`nextTimestamp`); one capture may feed the landmarker at a time; a landmarker that throws is closed and rebuilt (CPU) on the next reading, and that reading ends with "Something went wrong. Try again."
- **Stop or leaving during "Loading the face model" did not stop the run.** Repro: fresh page, Start, Stop at 150 ms, Start. The first run woke up, opened the camera and ran its full 30 s; with Stop then Start inside 30 ms both runs went on, one `play()` failed with "The play() request was interrupted by a new load request" (shown raw on screen), and its error path stopped the shared stream, so the next reading ran 30 s on an ended track (1 frame, then "The capture stopped early."). Overlapping runs are also how two loops would feed the landmarker the same timestamp or a 0x0 frame mid-srcObject swap. Fix: each run owns an id; Stop, a new Start and unmount move it on; a stale run stops only its own camera and sets no state. Camera, model and runtime load with `allSettled`, so a camera opened while the model failed is closed. Browser errors become short messages.
- **Slow devices failed at random.** On a software GPU the model ran at ~2 fps: 61 to 91 frames per 30 s against a 60-frame floor, so one reading passed and the next said "The capture stopped early." The floor is now 30 frames (`MIN_FACE_FRAMES`) over at least 12 s; the pulse still needs 8 fps and is withheld below it.
- **Camera ending or the page hiding left the reading hanging** with "Reading..." for the rest of the 30 s, then a misleading message. The capture now ends on the track's `ended` event, on `visibilitychange` to hidden, and after 4 s without a new frame, each with its own message.
- **Overlay did not sit on the face on phones.** The video is `object-fit: cover` in a 4:3 box but the canvas was stretched to the box at the stream's size; a portrait 480x640 phone stream is cropped top and bottom, so the mesh landed off the face and read as decoration. The canvas is now the box's size in device pixels and every point goes through the same cover-and-mirror mapping as the video (`coverMap`), re-fit by a ResizeObserver.
- Also: the colour patch is clipped to the frame (pixels past the edge read as black), Progress no longer gets values over 100.
Checked and not a cause: DrawingUtils per frame (it only stores the context; heap stayed 41-44 MB across 14 readings), setState after unmount (no React 18 warning; now guarded anyway), 2D context loss (drawing becomes a no-op, no throw).

Overlay: no tessellation. All 478 landmarks as dots, face oval, brows, eyes, lips and irises as lines, the forehead patch the pulse is read from as its exact rectangle, and tags on the face with live values (Brow %, Eyes % or "Blink", Lips %, Pulse bpm once 12 s are in). Drawn without DrawingUtils: one path per feature, no per-landmark allocation.

Stress script: `scratchpad/og/mirror-stress.mjs` (cold Stop+Start, Start, Read again x3, Stop mid-way then Start, leave mid-capture and mid-load and come back, track stopped, page hidden, viewport resize). After the fixes every cycle ends in a result or the right short message, with no page errors and no model errors.
