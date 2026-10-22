// Chip figures match the overlay tags (face-capture.js drawOverlay): brow is the mean browDown, eyes the mean squint
// or "Blink" from 0.5, lips the mean mouthPress. A value the model did not return this frame is null.
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
