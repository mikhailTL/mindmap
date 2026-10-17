import React from 'react'
import { ScrollIn } from '../ui/motion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { Chevron, Cross } from '../ui/marks'
import { Why } from '../views/Monitor'
import { cn } from '../lib/utils'
import { PRO_LC, SCORE } from '../lib/terms'
import { ArmedButton, ChoiceRows, FixedRow, NeverRow, Panel, SwitchRow } from './controls'
import {
  AUDIENCES, RETENTION, SHARING,
  getSharing, getVersion, revokeAll, setRetention, setShared, subscribe,
} from './store'

/* The student's sharing controls. The model is store.js's SHARING table:
 * nothing starts on, a dependent row needs its parent row, a parent never
 * sees finer than a day and never Notes, Location, raw readings or anything
 * said. Those are drawn as Never rows. Crisis alerts have no switch.
 * Known disagreement: infographics.jsx marks raw readings Never for the
 * Medical Professional while caseload.js carries a `raw` key.
 */

/* Short row labels, keyed by the store's field key. */
const SHORT = {
  parent: { score: `Daily ${SCORE}`, week: 'Days above usual', sleep: 'Hours slept', worn: 'Patch worn',
            settle: 'Days slow to settle' },
  pro:    { score: SCORE, trends: 'Weekly change', raw: 'Raw readings', settle: 'Days slow to settle' },
}
const SHORT_NEVER = {
  'My readings second by second': 'Raw readings',
  'Anything I say': 'Voice',
}
const label = (audience, f) => SHORT[audience]?.[f.key] || f.label

/* The short row label for a field key, for screens that list what a person
   can see (src/account/Network.jsx). */
export function shareLabel(audience, key) {
  const f = SHARING[audience]?.fields.find(x => x.key === key)
  return f ? label(audience, f) : key
}
function count(state) {
  return AUDIENCES.reduce((n, a) =>
    n + SHARING[a].fields.filter(f => state[a][f.key]).length, 0)
}
const TOTAL = AUDIENCES.reduce((n, a) => n + SHARING[a].fields.length, 0)

/* What the audience would be shown, derived from the switches. */
function TheirView({ audience, state }) {
  const on = SHARING[audience].fields.filter(f => state[audience][f.key])
  return (
    <div className="mt-auto border-t border-rule bg-aqua px-4 py-3">
      <p className="font-display text-fine font-bold text-ink">
        {SHARING[audience].who} would see
      </p>
      {on.length === 0 ? (
        <p className="mt-1 text-fine text-ink-2">Nothing is shared.</p>
      ) : (
        <ul className="m-0 mt-1.5 flex list-none flex-wrap gap-1.5 p-0">
          {on.map(f => (
            <li key={f.key}
              className="rounded-field border border-rule bg-card px-2 py-0.5 font-display
                text-fine font-medium text-ink">
              {label(audience, f)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function RowMeanings({ audience }) {
  const spec = SHARING[audience]
  return (
    <>
      <p className="font-display font-bold text-ink">
        {audience === 'parent' ? 'A parent sees one figure a day at most.' : 'A Medical Professional sees only what you share.'}
      </p>
      <dl className="m-0 mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {spec.fields.map(f => (
          <React.Fragment key={f.key}>
            <dt className="font-medium text-ink">{label(audience, f)}</dt>
            <dd className="m-0">{f.hint}</dd>
          </React.Fragment>
        ))}
        {spec.never.map(n => (
          <React.Fragment key={n.label}>
            <dt className="font-medium text-ink">{SHORT_NEVER[n.label] || n.label}</dt>
            <dd className="m-0">{n.hint}</dd>
          </React.Fragment>
        ))}
        {audience === 'pro' && (
          <>
            <dt className="font-medium text-ink">Crisis alerts</dt>
            <dd className="m-0">Consent does not cover a crisis. Their own protocol decides what follows.</dd>
          </>
        )}
      </dl>
    </>
  )
}

function Audience({ audience, state }) {
  const spec = SHARING[audience]
  const mine = state[audience]
  const on = spec.fields.filter(f => mine[f.key]).length
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-rule px-4 py-2">
        <span className="font-mono text-fine tabular-nums text-ink-3">{`${on}/${spec.fields.length} on`}</span>
        <Why label={`What each row means for ${spec.whom}`} className="ml-auto">
          <RowMeanings audience={audience}/>
        </Why>
      </div>
      {spec.fields.map(f => {
        const blocked = f.needs && !mine[f.needs]
        const parent = blocked && spec.fields.find(x => x.key === f.needs)
        return (
          <SwitchRow key={f.key}
            label={label(audience, f)}
            checked={mine[f.key]}
            disabled={blocked}
            note={blocked ? `Turn on “${label(audience, parent)}” first.` : undefined}
            onChange={on => setShared(audience, f.key, on)}/>
        )
      })}
      {spec.never.map(n => <NeverRow key={n.label} label={SHORT_NEVER[n.label] || n.label}/>)}
      {audience === 'pro' && (
        <FixedRow label="Crisis alerts" hint={`A crisis alert always reaches a ${PRO_LC}.`}/>
      )}
      <TheirView audience={audience} state={state}/>
    </div>
  )
}

/* The student's privacy screen, at route `shared`. The nav calls it
   Privacy, so its first heading does too. `go`, when the shell passes it,
   opens the network from the row under the heading. */
export function SharingControls({ className, go }) {
  React.useSyncExternalStore(subscribe, getVersion, () => 0)
  const state = getSharing()
  const on = count(state)

  return (
    <div className={cn('min-w-0', className)}>
      <ScrollIn>
        <Panel title="Privacy" aside={on === 0 ? undefined : `${on}/${TOTAL} on`}>
          {go && (
            <button type="button" onClick={() => go('network')}
              className="flex min-h-[56px] w-full items-center gap-3 border-b border-rule px-4 py-3 text-left
                transition-colors duration-150 hoverOnly:bg-mist/50">
              <span className="min-w-0 flex-1">
                <span className="block font-display text-ui font-medium text-ink">Who is linked to you</span>
                <span className="mt-0.5 block text-fine text-ink-3">Open your network to invite or remove someone.</span>
              </span>
              <ChevronMark/>
            </button>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4">
            <ArmedButton armedLabel="Yes, stop sharing everything" onConfirm={revokeAll}>
              <Cross aria-hidden className="size-4"/>Turn everything off
            </ArmedButton>
            <Why label="How sharing works" className="ml-auto">
              Every switch starts off. You can turn any off again, any time.
            </Why>
          </div>
        </Panel>
      </ScrollIn>

      <ScrollIn delay={0.05}>
        <Tabs defaultValue={AUDIENCES[0]}
          className="mt-3 overflow-hidden rounded-panel border border-rule bg-card lg:mt-4">
          <TabsList scroll aria-label="Who" className="border-rule px-4">
            {AUDIENCES.map(a => (
              <TabsTrigger key={a} value={a}>{SHARING[a].who}</TabsTrigger>
            ))}
          </TabsList>
          {AUDIENCES.map(a => (
            <TabsContent key={a} value={a} className="mt-0">
              <Audience audience={a} state={state}/>
            </TabsContent>
          ))}
        </Tabs>
      </ScrollIn>

      <div className="mt-3 grid gap-3 lg:grid-cols-2 lg:gap-4">
        <ScrollIn delay={0.1}>
          <Panel title="Keep Raw Readings For" aside={`${state.retention} days`}>
            <ChoiceRows label="How long raw readings are kept on this phone"
              value={state.retention}
              onChange={setRetention}
              options={RETENTION.map(d => ({
                value: d,
                label: `${d} days`,
                hint: d === 7 ? 'The shortest, and the default.'
                  : d === 30 ? 'A month of samples.'
                  : 'A term of samples, the longest.',
              }))}/>
            <div className="border-t border-rule px-4 py-3">
              <p className="max-w-[62ch] text-fine text-ink-3">
                Older samples are dropped. The daily {SCORE} stays.
              </p>
            </div>
          </Panel>
        </ScrollIn>

        {state.log.length > 0 && (
          <ScrollIn delay={0.15}>
            <Panel title="Your Changes" aside={`${state.log.length} of the last 12`}>
              <ul className="m-0 list-none p-0">
                {state.log.map((r, i) => (
                  <li key={r.at + i}
                    className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 border-t border-rule
                      px-4 py-2.5 first:border-t-0 sm:grid-cols-[8.5rem_minmax(0,1fr)]">
                    <span className="font-mono text-fine tabular-nums text-ink-3">{stamp(r.at)}</span>
                    <span className="max-w-[62ch] text-fine text-ink-2">{r.text}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-rule px-4 py-3">
                <p className="max-w-[62ch] text-fine text-ink-3">Kept on your phone. Never sent.</p>
              </div>
            </Panel>
          </ScrollIn>
        )}
      </div>
    </div>
  )
}

const ChevronMark = () => <Chevron aria-hidden className="size-4 shrink-0 text-ink-3"/>

function stamp(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const day = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return `${day}, ${time}`
}
