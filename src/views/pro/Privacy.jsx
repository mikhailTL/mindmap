import React from 'react'
import { Panel, PanelHead } from '../Monitor'
import { SHARING } from '../../app/store'
import { AUDIT_LOG } from '../../lib/caseload'
import { CASELOAD } from '../../lib/roster'
import { SCORE } from '../../lib/terms'
import { useMode } from '../../lib/mode'
import { Check, Never } from '../../ui/marks'
import { logSubjects } from './metrics'

// Keys match the teen's sharing switches in SHARING.pro (src/app/store.js).
const LABEL = {
  score: `${SCORE} and Heads Up colour`,
  trends: 'Trends, week over week',
  raw: 'Raw readings',
  settle: 'Days slow to settle',
}
const NEVER = [...SHARING.pro.never.map(f => f.label), 'Messages, videos and apps']

function Row({ Mark, tone, children }) {
  return (
    <li className="flex items-center gap-3 border-b border-rule py-2.5 last:border-b-0">
      <Mark aria-hidden className={`size-5 shrink-0 ${tone}`}/>
      <span className="min-w-0 text-ui text-ink">{children}</span>
    </li>
  )
}

export function ProPrivacy() {
  const [mode] = useMode()
  const relabel = logSubjects(CASELOAD)
  const log = mode === 'real' ? [] : AUDIT_LOG.filter(r => r.rel === 'Today').slice(0, 4).map(r => ({
    at: r.at.split(', ')[1],
    action: r.action.replace(/crisis alert/gi, m => (m[0] === 'C' ? 'Urgent alert' : 'urgent alert')),
    subject: relabel(r.subject),
  }))
  return (
    <main className="wrap !pt-4 pb-12">
      <h2 className="m-0 font-display !text-head font-bold tracking-tight text-ink">What teens share with you</h2>
      <p className="m-0 mt-1 max-w-[52ch] text-ui text-ink-2">Each teen chooses what you see. They can change it any time.</p>

      <div className="mt-4 grid grid-cols-1 items-start gap-3 lg:grid-cols-3 lg:gap-4">
        <Panel>
          <PanelHead as="h3" title="Shared if the teen allows"/>
          <ul className="m-0 mt-1 list-none p-0">
            {SHARING.pro.fields.map(f => (
              <Row key={f.key} Mark={Check} tone="text-accent">{LABEL[f.key] || f.label}</Row>
            ))}
          </ul>
          <p className="m-0 mt-2 text-fine text-ink-2">Urgent alerts always reach you.</p>
        </Panel>

        <Panel>
          <PanelHead as="h3" title="Never shared"/>
          <ul className="m-0 mt-1 list-none p-0">
            {NEVER.map(n => <Row key={n} Mark={Never} tone="text-ink-3">{n}</Row>)}
          </ul>
        </Panel>

        <Panel>
          <PanelHead as="h3" title="Who opened what today"/>
          <ul className="m-0 mt-1 list-none p-0">
            {log.length === 0 && <li className="py-2.5 text-fine text-ink-2">Nothing has been logged yet.</li>}
            {log.map(r => (
              <li key={r.at + r.action} className="flex items-baseline justify-between gap-3 border-b border-rule py-2.5 last:border-b-0">
                <span className="min-w-0">
                  <span className="block text-fine text-ink">{r.action}</span>
                  <span className="block text-fine text-ink-3">{r.subject}</span>
                </span>
                <span className="shrink-0 text-fine tabular-nums text-ink-3">{r.at}</span>
              </li>
            ))}
          </ul>
          <p className="m-0 mt-2 text-fine text-ink-2">Every record you open is logged.</p>
        </Panel>
      </div>
    </main>
  )
}
