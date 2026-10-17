/* Soft game sounds, off until the reader turns them on.
 *
 * Built on createPacer in ../audio.js: two sine voices through a smooth
 * envelope, quiet on purpose. One shared context for the whole page, made on
 * the tap that turns sound on (browsers refuse to start audio any other way).
 * Nothing is recorded and nothing is fetched. */

import { createPacer, audioSupported } from '../audio'

let pacer = null

export const soundSupported = () => audioSupported()

/* Call inside a tap. Safe to call more than once. */
export async function wakeSound() {
  if (!audioSupported()) return
  pacer ||= createPacer()
  await pacer.start()
}

const NOTES = {
  tick:  [[440, 0.18]],
  good:  [[392, 0.22], [523, 0.3]],
  turn:  [[294, 0.4]],
  low:   [[220, 0.4]],
  level: [[392, 0.2], [494, 0.2], [587, 0.4]],
}

/* Plays a named cue. Does nothing unless `on` is true. */
export function playSound(kind, on) {
  if (!on || !pacer) return
  const seq = NOTES[kind] || NOTES.tick
  let at = 0
  for (const [hz, secs] of seq) {
    setTimeout(() => pacer?.cue(hz, secs, 0.06), at * 1000)
    at += secs * 0.7
  }
}
