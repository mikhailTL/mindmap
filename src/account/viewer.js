import { useMode } from '../lib/mode'
import { useAccount } from './store'

export const VIEWER = {
  student: { name: 'Teen', avatar: 'char-student' },
  parent:  { name: 'Parent', avatar: 'char-parent' },
  pro:     { name: 'Counselor', avatar: 'char-counselor' },
}

export function firstName(name) {
  return String(name || '').trim().split(/\s+/)[0] || ''
}

// A counselor keeps the whole name ("Dr. Lee"); a teen or parent, the first word. Empty in Live when signed out.
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
