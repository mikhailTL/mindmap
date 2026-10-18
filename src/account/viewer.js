import { useMode } from '../lib/mode'
import { useAccount } from './store'

/* Who the reader is on a role's screens. The owner, 18 October: "The demo
 * welcomes should say welcome Student, welcome Parent, and welcome
 * Counselor, not guest", and "it says welcome guest but mentions names like
 * Dr. Shah, this is hard to follow".
 *
 * So in the demo (Guest Mode or not, signed in or not) the reader is the
 * role word, and no screen calls them by a demo person's name. In Live, the
 * signed-in account's name. Other people in the reader's network keep their
 * demo names: a student's Counselor/Professional can be Dr. Shah. */

export const VIEWER = {
  student: { name: 'Student', avatar: 'panda' },
  parent:  { name: 'Parent', avatar: 'initials-P' },
  pro:     { name: 'Counselor', avatar: 'initials-C' },
}

export function firstName(name) {
  return String(name || '').trim().split(/\s+/)[0] || ''
}

/* A Counselor/Professional keeps the whole name ("Dr. Lee"); a teen or a
   parent, the first word. Empty in Live with nobody signed in. */
export function viewerName(role, mode, me) {
  if (mode !== 'real') return VIEWER[role]?.name || ''
  const name = String(me?.name || '').trim()
  return role === 'pro' ? name : firstName(name)
}

export function useViewerName(role) {
  const [mode] = useMode()
  const me = useAccount()
  return viewerName(role, mode, me)
}
