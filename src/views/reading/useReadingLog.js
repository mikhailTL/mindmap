import React from 'react'
import { useMode } from '../../lib/mode'
import { EVENT, KEY, demoReadings, listReadings, updateReading } from '../../lib/readingLog'
import { TODAY as ROSTER_DAY } from '../../lib/roster'
import { READ, TAKEN_AT } from './demo'

// The demo's "now": the roster's today, 30 minutes after the shared demo reading, fixed so the log looks the same
// in every capture.
const [y, m, d] = ROSTER_DAY.split('-').map(Number)
const [th, tm] = String(TAKEN_AT).split(':').map(Number)
export const DEMO_NOW = new Date(y, m - 1, d, th, tm + 30).getTime()

const DEMO = demoReadings({ end: DEMO_NOW, last: { score: READ.score, clock: TAKEN_AT } })

export function useReadingLog() {
  const [mode] = useMode()
  const [stored, setStored] = React.useState(() => listReadings())
  const [demoNotes, setDemoNotes] = React.useState({})

  React.useEffect(() => {
    const sync = () => setStored(listReadings())
    const onStorage = e => { if (e.key === KEY || e.key === null) sync() }
    addEventListener(EVENT, sync)
    addEventListener('storage', onStorage)
    sync()
    return () => { removeEventListener(EVENT, sync); removeEventListener('storage', onStorage) }
  }, [])

  const demo = mode === 'demo'
  const entries = React.useMemo(() => {
    if (!demo) return stored
    const seeded = DEMO.map(r => (r.id in demoNotes
      ? { ...r, note: demoNotes[r.id] || undefined } : r))
    return [...seeded, ...stored].sort((a, b) => a.at - b.at)
  }, [demo, stored, demoNotes])

  const latest = entries[entries.length - 1]
  const now = demo ? Math.max(DEMO_NOW, latest?.at || 0) : Date.now()

  const setNote = React.useCallback((entry, text) => {
    const note = String(text || '').trim()
    if (entry.demo) setDemoNotes(n => ({ ...n, [entry.id]: note }))
    else updateReading(entry.id, { note })
  }, [])

  return { entries, now, demo, setNote }
}
