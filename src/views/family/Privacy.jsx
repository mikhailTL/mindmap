import React from 'react'
import { Chevron } from '../../ui/marks'
import { AUDIT_LOG, CONSENT, CONSENT_LEDGER, PROTOCOL, PROTOCOL_DONE, PROTOCOL_TIMES } from '../../lib/caseload'
import { SCORE, PRO_LC, CONSENT_SHORT, CONSENT_OFF } from '../../lib/terms'
import { cn } from '../../lib/utils'

/* A child's privacy, from the parent's side: what is shared, what was signed,
 * who opened the record, and the steps after a crisis alert. Moved here from
 * the old parent dashboard, facts unchanged. Read from the same CONSENT record
 * and audit log the Medical Professional console reads; never a second copy.
 *
 * Every box is one shape: the same padding, a heading, then rows on a rule
 * with their text on one left edge, so no box sits out of line with the next. */

/* Which console record stands for each demo child. */
const CODE_OF = { maya: 'Student 8241', leo: 'Student 2298' }
const codeFor = teen => (CONSENT[CODE_OF[teen.id]] ? CODE_OF[teen.id] : Object.keys(CONSENT)[0])

export function Box({ title, meta, children, className }) {
  return (
    <section className={cn('flex h-full flex-col rounded-panel border border-rule bg-card p-5 shadow-card sm:p-6', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="m-0 font-display text-row font-bold leading-tight text-ink">{title}</h3>
        {meta && <span className="shrink-0 text-fine text-ink-3">{meta}</span>}
      </div>
      {children}
    </section>
  )
}

const P = ({ className, children }) => <p className={cn('m-0 mt-3 max-w-[56ch] text-fine text-ink-2', className)}>{children}</p>

function KV({ k, v }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-rule py-2.5">
      <dt className="min-w-0 text-fine text-ink-2">{k}</dt>
      <dd className="m-0 text-right font-display text-ui font-medium tabular-nums text-ink">{v}</dd>
    </div>
  )
}

/* A locked switch is drawn at full strength, not faded. */
function Switch({ on, disabled, label, onClick }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={onClick} disabled={disabled}
      className={cn('min-h-[44px] w-[7.5rem] shrink-0 rounded-field border px-3 font-display text-ui',
        'transition-[background-color,color] duration-150 ease-out disabled:pointer-events-none motion-reduce:transition-none',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        disabled
          ? on ? 'border-ink-3 bg-mist font-medium text-ink' : 'border-ink-3 bg-transparent font-light text-ink-2'
          : on ? 'border-ink bg-ink font-medium text-paper hoverOnly:bg-accent-ink'
               : 'border-ink bg-transparent font-light text-ink-2 hoverOnly:bg-mist')}>
      {on ? 'Shared' : 'Not shared'}
    </button>
  )
}

/* Label and its line on the left edge, the switch on the right, both tops
   level. Same rule and padding as every other row on this page. */
function ScopeRow({ label, sub, children }) {
  return (
    <li className="flex items-start justify-between gap-4 border-b border-rule py-2.5">
      <span className="min-w-0 flex-1 pt-[11px]">
        <span className="block font-display text-ui font-medium leading-snug text-ink">{label}</span>
        {sub && <span className="mt-0.5 block text-fine text-ink-2">{sub}</span>}
      </span>
      {children}
    </li>
  )
}

function WhatIsShared({ teen, record }) {
  const [share, setShare] = React.useState({ score: !!record.score, trends: !!record.trends })
  const scopes = [
    { id: 'score', label: `The ${SCORE} for each day` },
    { id: 'trends', label: `Whether the ${SCORE} moved week to week` },
  ]
  return (
    <Box title="What is shared" meta="four switches">
      <P>{CONSENT_SHORT}</P>
      <ul className="m-0 mt-2 list-none p-0">
        {scopes.map(s => (
          <ScopeRow key={s.id} label={s.label}>
            <Switch on={share[s.id]} label={s.label} onClick={() => setShare(p => ({ ...p, [s.id]: !p[s.id] }))}/>
          </ScopeRow>
        ))}
        <ScopeRow label="Hour-by-hour readings" sub={`Off unless you and ${teen.first} both turn it on. ${teen.first}’s switch.`}>
          <Switch on={!!record.raw} disabled label={`Hour-by-hour readings. Locked here, ${teen.first}’s switch`}/>
        </ScopeRow>
        <ScopeRow label="A crisis alert" sub="Nobody can turn this off.">
          <Switch on disabled label="A crisis alert"/>
        </ScopeRow>
      </ul>
      <P className="text-ink-3">Every switch here is logged.</P>
    </Box>
  )
}

function WhatWasSigned({ teen, code, record }) {
  const ledger = CONSENT_LEDGER.find(r => r.student === code) ?? {}
  return (
    <Box title="What was signed">
      <P>{record.scope}.</P>
      <dl className="m-0 mt-2 p-0">
        <KV k="Signed" v={record.signedAt}/>
        <KV k="Runs out" v={ledger.expires ?? 'Not set'}/>
        <KV k="Legal basis" v={record.basis}/>
      </dl>
      <P>{CONSENT_OFF}</P>
      <P className="mt-1.5 text-ink-3">The {PRO_LC} sees {teen.first} as {code}.</P>
    </Box>
  )
}

const SHOWN = 3
function RecordLog({ code }) {
  const rows = AUDIT_LOG.filter(r => r.subject === code)
  const [all, setAll] = React.useState(false)
  const shown = all ? rows : rows.slice(0, SHOWN)
  return (
    <Box title="Who opened the record" meta="nothing deleted">
      {rows.length ? (
        <ul className="m-0 mt-2 list-none p-0">
          {shown.map(r => (
            <li key={r.at + r.action} className="border-b border-rule py-2.5">
              <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                <span className="min-w-0 flex-1 font-display text-ui font-medium text-ink">{r.action}</span>
                <span className="shrink-0 text-fine tabular-nums text-ink-3">{r.at}</span>
              </span>
              <span className="mt-0.5 block text-fine text-ink-2">{r.actor}</span>
            </li>
          ))}
        </ul>
      ) : <P>Nobody has opened this record yet.</P>}
      {rows.length > SHOWN && (
        <button type="button" aria-expanded={all} onClick={() => setAll(a => !a)}
          className="group mt-1 flex min-h-[44px] w-full items-center gap-3 text-left">
          <span className="min-w-0 flex-1 font-display text-ui font-medium text-ink groupHoverOnly:text-accent-ink">
            {all ? 'Show fewer' : `See all opens (${rows.length})`}</span>
          <Chevron aria-hidden className={cn('size-4 shrink-0 text-accent transition-transform duration-150', all && 'rotate-90')}/>
        </button>
      )}
      <P>Every open is logged.</P>
    </Box>
  )
}

const GUARDIAN_STEP = PROTOCOL.findIndex(s => /guardian/i.test(s))
const minuteOf = t => {
  const [, h, m, ap] = t.match(/(\d+):(\d+)\s*([AP]M)/i)
  return ((Number(h) % 12) + (/p/i.test(ap) ? 12 : 0)) * 60 + Number(m)
}
const TO_GUARDIAN = minuteOf(PROTOCOL_TIMES[GUARDIAN_STEP]) - minuteOf(PROTOCOL_TIMES[0])

function CrisisPath({ code }) {
  /* Only a child whose record holds a logged run shows its clock times. */
  const ran = AUDIT_LOG.some(r => r.subject === code && /crisis alert raised/i.test(r.action))
  return (
    <Box title="Steps after a crisis alert" meta={`${PROTOCOL.length} steps`} className="border-t-2 border-t-crit">
      {!ran && <P>No alert has been raised. If one is, these steps run in order.</P>}
      {ran && <div className="mt-3 border-b border-rule pb-2.5">
        <p className="m-0 text-fine text-ink-2">Time from the alert to your call</p>
        <p className="m-0 mt-0.5 flex items-baseline gap-1.5 font-display text-row font-bold tabular-nums text-ink">
          {TO_GUARDIAN}<span className="font-body text-fine font-normal text-ink-3">minutes, from the one logged run</span></p>
      </div>}
      <ol className={cn('m-0 list-none p-0', !ran && 'mt-2')}>
        {PROTOCOL.map((step, i) => (
          <li key={step} className="flex items-baseline gap-2.5 border-b border-rule py-2.5">
            <span aria-hidden className="w-4 shrink-0 text-fine tabular-nums text-ink-3">{i + 1}</span>
            <span className="min-w-0 flex-1 text-fine text-ink">{step}</span>
            {i === GUARDIAN_STEP && <span className="shrink-0 font-display text-fine font-semibold text-accent-ink">you</span>}
            {ran && <span className="w-[4.25rem] shrink-0 text-right text-fine tabular-nums text-ink-3">
              {PROTOCOL_DONE.includes(i) ? PROTOCOL_TIMES[i] : 'open'}</span>}
          </li>
        ))}
      </ol>
      <P>Every step is logged.</P>
    </Box>
  )
}

export default function FamilyPrivacy({ teen }) {
  const code = codeFor(teen)
  const record = CONSENT[code] ?? {}
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <WhatIsShared key={teen.id} teen={teen} record={record}/>
      <WhatWasSigned teen={teen} code={code} record={record}/>
      <RecordLog key={'log' + teen.id} code={code}/>
      <CrisisPath code={code}/>
    </div>
  )
}
