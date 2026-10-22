import { createPacer, audioSupported } from '../audio'

let pacer = null

export const soundSupported = () => audioSupported()

/* Call inside a tap. Safe to call more than once. */
export async function wakeSound() {
  if (!audioSupported()) return
  pacer ||= createPacer()
  await pacer.start()
}

// [Hz, seconds] per note; notes overlap by 30% of their length.
const NOTES = {
  tick:  [[440, 0.18]],
  good:  [[392, 0.22], [523, 0.3]],
  turn:  [[294, 0.4]],
  low:   [[220, 0.4]],
  level: [[392, 0.2], [494, 0.2], [587, 0.4]],
}

export function playSound(kind, on) {
  if (!on || !pacer) return
  const seq = NOTES[kind] || NOTES.tick
  let at = 0
  for (const [hz, secs] of seq) {
    setTimeout(() => pacer?.cue(hz, secs, 0.06), at * 1000)
    at += secs * 0.7
  }
}
