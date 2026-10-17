import React from 'react'
import { backend, liveData, useAccount } from '../../account/store'
import { toTeen } from './live.js'

/* The teens linked to the signed in parent or Medical Professional, from the
 * account snapshot, shaped for the cards. Re-renders on every snapshot, so
 * the 20 second refresh in src/account/sync.js (useLiveSync) moves the cards.
 *
 *   state  'signedout' | 'role' (signed in as somebody else) | 'device'
 *          (no account server on this deploy) | 'ready'
 */
export function useLiveTeens(audience) {
  const me = useAccount()
  const live = liveData()
  const teens = React.useMemo(
    () => (me && me.role === audience ? live.teens.map(t => toTeen(t, audience)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [me?.id, me?.role, audience, live.at, live.teens])
  const state = !me ? 'signedout' : me.role !== audience ? 'role' : backend() !== 'remote' ? 'device' : 'ready'
  return { teens, state, me, at: live.at }
}
