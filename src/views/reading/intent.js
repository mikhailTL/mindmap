/* One-shot hand-off for a link that has to land on a reading rather than on the
   chooser. A reading has no route of its own, so the page that links to one
   sets this immediately before go('check') and the reading screen reads it once
   on mount. Module state, not storage: it must not survive a reload. */
let want = null

export function setReadingIntent(id) { want = id }

export function takeReadingIntent() {
  const v = want
  want = null
  return v
}
