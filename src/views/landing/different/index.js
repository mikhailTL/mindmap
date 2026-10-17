import ScoreDemo from './score'
import NetworkDemo from './network'
import PatchDemo from './patch'
import HeadsUpDemo from './headsup'
import RecoveryDemo from './recovery'
import EventsDemo from './events'
import ExercisesDemo from './exercises'
import BeforeAfterDemo from './beforeafter'
import AiDemo from './ai'
import SharingDemo from './sharing'

/* One working demo per feature, keyed by the feature id in Different.jsx. */
export const DEMOS = {
  score: ScoreDemo,
  network: NetworkDemo,
  patch: PatchDemo,
  heads: HeadsUpDemo,
  settle: RecoveryDemo,
  event: EventsDemo,
  breath: ExercisesDemo,
  helped: BeforeAfterDemo,
  ai: AiDemo,
  sharing: SharingDemo,
}

export { DEMO_CSS } from './kit'
