// One-shot hand-off: a page sets this just before go('check'), and the reading screen takes it once on mount.
// Module state, so it does not survive a reload.
let want = null

export function setReadingIntent(id) { want = id }

export function takeReadingIntent() {
  const v = want
  want = null
  return v
}
