import React from 'react'
import { ScrollIn } from '../ui/motion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { Cross } from '../ui/marks'
import { Why } from '../views/Monitor'
import { cn } from '../lib/utils'
import { PRO_LC, SCORE } from '../lib/terms'
import { ArmedButton, ChoiceRows, FixedRow, NeverRow, Panel, SwitchRow } from './controls'
import {
  AUDIENCES, RETENTION, SHARING,
  getSharing, getVersion, revokeAll, setRetention, setShared, subscribe,
} from './store'

/* The student's own sharing controls, per field and per audience.
 *
 * The model is not invented here and this screen may not exceed it. The
 * parent column is src/views/Privacy.jsx's YOU_SEE and YOU_NEVER; the
 * Medical Professional column is the three consent keys every record in
 * src/lib/caseload.js carries. Both lists live in store.js as one table, so
 * there is no second copy to disagree with the first.
 *
 * Three consequences of that, visible on the screen:
 *   - Nothing starts on. terms.js states it as the product's rule.
 *   - A trend cannot be shared without the score it is movement in, and a raw
 *     reading cannot be shared without the score it sits under. caseload.js
 *     enforces that nesting; the switches here express it rather than
 *     re-deciding it.
 *   - A parent never sees anything finer than a day, and never Notes,
 *     Location, a raw reading or anything said. Those are drawn as rows that
 *     say Never rather than left off the screen, because an absence nobody
 *     can see is not a reassurance.
 *
 * Crisis handling is the one row with no switch. caseload.js has no consent
 * key for it, which is the structural reason: there is nothing to turn off.
 * It sits in the Medical Professional column as a row that says Always on.
 *
 * Design spec 0f: 15 to 45 words above the fold. The two audiences are tabs,
 * one list at a time, and each row is its short label; the full label and
 * its hint sit behind the "?" at the top of the list. store.js keeps the
 * long labels because the change log is written from them.
 *
 * Note for the reviewer: src/charts/infographics.jsx marks raw readings as
 * Never for the Medical Professional at every consent level, while
 * src/lib/caseload.js carries a `raw` key and one student with it set. The
 * data layer is what this screen expresses, per its brief, and the raw row is
 * off by default. The two files disagree and one of them should change.
 */

/* Row labels as they are drawn, two or three words each. Keyed by the
   store's field key so a field added there without a line here still shows
   its full label rather than nothing. */
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

function count(state) {
  return AUDIENCES.reduce((n, a) =>
    n + SHARING[a].fields.filter(f => state[a][f.key]).length, 0)
}
const TOTAL = AUDIENCES.reduce((n, a) => n + SHARING[a].fields.length, 0)

/* What the audience would actually be shown, derived from the switches rather
   than described. A switch whose consequence is invisible is a switch nobody
   trusts. */
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

/* The full label and hint for every row, behind the "?" so the list itself
   is the short labels. One list item per row: no paragraph forms. */
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
        /* "Crisis alert" is caseload.js's own word for this, and the band is
           named rather than its number: a threshold printed on a student's
           settings screen is a clinical cut-off, and this is not the screen
           for one. */
        <FixedRow label="Crisis alerts" hint={`A crisis alert always reaches a ${PRO_LC}.`}/>
      )}
      <TheirView audience={audience} state={state}/>
    </div>
  )
}

/**
 * The student's sharing screen.
 *
 * Props
 *   className  string  Optional.
 *
 * Mount at: route `shared`, in place of <PrivacyBody/> in the `shared` entry
 * of PANES in src/views/Students.jsx. PrivacyBody is the parent's read-only
 * statement of scope and should stay on the `privacy` route, which is the
 * parent app; this is the student side of the same model, and it is the one
 * with the switches. The bottom tab already reads "Sharing", so no nav change
 * is needed.
 */
export function SharingControls({ className }) {
  React.useSyncExternalStore(subscribe, getVersion, () => 0)
  const state = getSharing()
  const on = count(state)

  return (
    <div className={cn('min-w-0', className)}>
      <ScrollIn>
        <Panel title="What is shared" aside={on === 0 ? undefined : `${on}/${TOTAL} on`}>
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
          <Panel title="Keep raw readings for" aside={`${state.retention} days`}>
            <ChoiceRows label="How long raw readings are kept on this phone"
              value={state.retention}
              onChange={setRetention}
              options={RETENTION.map(d => ({
                value: d,
                label: `${d} days`,
                hint: d === 7 ? 'This is the shortest option, and the default.'
                  : d === 30 ? 'Keeps a month of samples.'
                  : 'Keeps a term of samples, the longest option.',
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
            <Panel title="Your changes" aside={`${state.log.length} of the last 12`}>
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
                <p className="max-w-[62ch] text-fine text-ink-3">This log stays on your phone and is never sent.</p>
              </div>
            </Panel>
          </ScrollIn>
        )}
      </div>
    </div>
  )
}

/* Short and local. Date first because the log is read newest to oldest and
   the day is what distinguishes two rows. */
function stamp(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const day = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return `${day}, ${time}`
}
