import React from 'react'
import { backend, liveData, useAccount } from '../../account/store'
import { toTeen } from './live.js'

export function useLiveTeens(audience) {
  const me = useAccount()
  const live = liveData()
  const teens = React.useMemo(
    () => (me && me.role === audience ? live.teens.map(t => toTeen(t, audience)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [me?.id, me?.role, audience, live.at, live.teens])
  // 'role': signed in with another role. 'device': no account server on this deploy.
  const state = !me ? 'signedout' : me.role !== audience ? 'role' : backend() !== 'remote' ? 'device' : 'ready'
  return { teens, state, me, at: live.at }
}
