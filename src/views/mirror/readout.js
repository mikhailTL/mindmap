/* The live chips under the viewfinder. The same figures the overlay tags
 * draw on the face (signals/face-capture.js drawOverlay): brow is the mean of
 * the two browDown scores, eyes the mean squint or "Blink" from 0.5, lips the
 * mean mouthPress. Pulse is the running rate the forehead tag shows, or null
 * while it locks. Nothing here is estimated: a value the model did not return
 * this frame is null and its chip waits. */

const pair = (cats, a, b) => {
  let x = 0, y = 0
  for (let i = 0; i < cats.length; i++) {
    const c = cats[i]
    if (c.categoryName === a) x = c.score
    else if (c.categoryName === b) y = c.score
  }
  return (x + y) / 2
}

export function readoutOf(res, pulse) {
  const present = !!res?.faceLandmarks?.[0]
  const cats = res?.faceBlendshapes?.[0]?.categories ?? []
  const shapes = present && cats.length > 0
  return {
    present,
    pulse: Number.isFinite(pulse) && pulse > 0 ? Math.round(pulse) : null,
    brow: shapes ? Math.round(pair(cats, 'browDownLeft', 'browDownRight') * 100) : null,
    blink: shapes ? pair(cats, 'eyeBlinkLeft', 'eyeBlinkRight') >= 0.5 : false,
    eyes: shapes ? Math.round(pair(cats, 'eyeSquintLeft', 'eyeSquintRight') * 100) : null,
    lips: shapes ? Math.round(pair(cats, 'mouthPressLeft', 'mouthPressRight') * 100) : null,
  }
}
