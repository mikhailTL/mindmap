import React from 'react'
import { ScrollIn } from '../ui/motion'
import { cn } from '../lib/utils'
import { CONSENT_OFF, PRO_LC, SCORE } from '../lib/terms'
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
 * Crisis handling is the one thing with no switch. caseload.js has no consent
 * key for it, which is the structural reason: there is nothing to turn off.
 * It is stated here plainly instead of being drawn as a switch that does not
 * move.
 *
 * Note for the reviewer: src/charts/infographics.jsx marks raw readings as
 * Never for the Medical Professional at every consent level, while
 * src/lib/caseload.js carries a `raw` key and one student with it set. The
 * data layer is what this screen expresses, per its brief, and the raw row is
 * off by default. The two files disagree and one of them should change.
 */

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
        <p className="mt-1 max-w-[62ch] text-fine text-ink-2">
          Nothing. {audience === 'pro'
            ? 'The console would list you with no figure beside your name.'
            : 'The week would be blank.'}
        </p>
      ) : (
        <ul className="m-0 mt-1.5 flex list-none flex-wrap gap-1.5 p-0">
          {on.map(f => (
            <li key={f.key}
              className="rounded-field border border-rule bg-card px-2 py-0.5 font-display
                text-fine font-medium text-ink">
              {f.label.replace(/^My /, '')}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Audience({ audience, state }) {
  const spec = SHARING[audience]
  const mine = state[audience]
  return (
    <Panel className="flex h-full flex-col" title={spec.who}
      aside={`${spec.fields.filter(f => mine[f.key]).length} of ${spec.fields.length} on`}
      lede={audience === 'parent'
        ? 'One figure a day at most. Never an hour, never a minute.'
        : `What the console beside your name may hold.`}>
      {spec.fields.map(f => {
        const blocked = f.needs && !mine[f.needs]
        const parent = blocked && spec.fields.find(x => x.key === f.needs)
        return (
          <SwitchRow key={f.key}
            label={f.label}
            hint={f.hint}
            checked={mine[f.key]}
            disabled={blocked}
            note={blocked ? `Needs “${parent.label}” on first: this is movement in it.` : undefined}
            onChange={on => setShared(audience, f.key, on)}/>
        )
      })}
      {spec.never.map(n => <NeverRow key={n.label} label={n.label} hint={n.hint}/>)}
      <TheirView audience={audience} state={state}/>
    </Panel>
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
        <Panel title="What leaves this phone" aside={`${on} of ${TOTAL} on`}
          lede={CONSENT_OFF}>
          <div className="px-4 py-4">
            <p className="max-w-[62ch] text-meta text-ink">
              Every switch below starts off. You turn one on, and you turn it off again, and
              the thing it names stops being shared from that moment.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <ArmedButton armedLabel="Yes, stop sharing everything" onConfirm={revokeAll}>
                Turn everything off
              </ArmedButton>
              <p className="text-fine text-ink-3">
                {on === 0 ? 'Nothing is being shared right now.'
                  : `${on} of ${TOTAL} things are being shared.`}
              </p>
            </div>
          </div>
        </Panel>
      </ScrollIn>

      <div className="mt-3 grid gap-3 lg:grid-cols-2 lg:gap-4">
        {AUDIENCES.map((a, i) => (
          <ScrollIn key={a} delay={0.05 * (i + 1)} className="h-full">
            <Audience audience={a} state={state}/>
          </ScrollIn>
        ))}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2 lg:gap-4">
        <ScrollIn delay={0.15}>
          <Panel title="The one thing with no switch">
            {/* "Crisis alert" is caseload.js's own word for this, and the
                band is named rather than its number: a threshold printed on a
                student's settings screen is a clinical cut-off, and this is
                not the screen for one. */}
            <FixedRow label="Crisis alerts"
              hint={`A crisis alert reaches a ${PRO_LC} whatever else here is switched off. There is no switch for it because there is none in the product: it is the one thing consent does not cover. What happens after that is their own protocol, and nothing on this screen can promise you what it will be.`}/>
            <div className="border-t border-rule px-4 py-3">
              <p className="max-w-[62ch] text-fine text-ink-3">
                Everything else on this screen is yours to turn off, including the {SCORE}
                {' '}itself. This row is the exception and it is the only one.
              </p>
            </div>
          </Panel>
        </ScrollIn>

        <ScrollIn delay={0.2}>
          <Panel title="How long raw readings are kept"
            lede="On this phone. Nothing is kept anywhere else."
            aside={`${state.retention} days`}>
            <ChoiceRows label="How long raw readings are kept on this phone"
              value={state.retention}
              onChange={setRetention}
              options={RETENTION.map(d => ({
                value: d,
                label: `${d} days`,
                hint: d === 7 ? 'The shortest, and where this starts.'
                  : d === 30 ? 'A month of samples behind each score.'
                  : 'A term of samples. The longest this offers.',
              }))}/>
            <div className="border-t border-rule px-4 py-3">
              <p className="max-w-[62ch] text-fine text-ink-3">
                Older samples are dropped. The daily {SCORE} they were behind stays, because
                it is one number a day rather than a reading.
              </p>
            </div>
          </Panel>
        </ScrollIn>
      </div>

      {state.log.length > 0 && (
        <ScrollIn delay={0.25}>
          <Panel className="mt-3" title="What you changed, on this phone"
            aside={`${state.log.length} of the last 12`}>
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
              <p className="max-w-[62ch] text-fine text-ink-3">
                This list is on the phone and goes nowhere. It is here so a switch you
                changed last week is still something you can check.
              </p>
            </div>
          </Panel>
        </ScrollIn>
      )}
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
