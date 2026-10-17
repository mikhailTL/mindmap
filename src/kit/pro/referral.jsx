import React from 'react'
import { ActivityScreen, Sheet, Choice, FIELD } from '../../toolkit/shell'
import { CopyButton, Crisis, Label, TODAY_LONG } from './common'

/* Referral Note: a short form that writes a plain referral note, ready to
   paste into a letter or a record. Initials or an ID, never a full name by
   default. Nothing typed here is saved or sent. */

const TO = ['School counsellor', 'Primary care doctor', 'Psychologist or therapist', 'Psychiatry', 'Other service']
const WHEN = [
  ['routine', 'Routine'],
  ['soon', 'Soon, within two weeks'],
  ['urgent', 'Urgent, within two days'],
]
const SHARE = ['Readings summary', 'Session notes', 'Contact with a parent']

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="font-display text-ui font-bold text-ink">{label}</span>
      {hint && <span className="ml-2 text-fine text-ink-3">{hint}</span>}
      <span className="mt-2 block">{children}</span>
    </label>
  )
}

export function buildNote(f, date = TODAY_LONG()) {
  const when = (WHEN.find(w => w[0] === f.when) || WHEN[0])[1]
  const who = [f.id.trim() || '[initials or ID]', f.age.trim() && `age ${f.age.trim()}`].filter(Boolean).join(', ')
  const share = f.share.length ? f.share.join(', ').toLowerCase() : 'nothing beyond this note'
  return [
    'Referral',
    `Date: ${date}`,
    `To: ${f.to === 'Other service' ? (f.other.trim() || '[service]') : f.to}`,
    `Urgency: ${when}`,
    '',
    `Young person: ${who}`,
    `Agreed to share: ${share}`,
    '',
    'What I observed:',
    f.seen.trim() || '[what you saw or heard, in plain words]',
    '',
    'MindMap readings:',
    f.pattern.trim() || '[the pattern, for example higher than usual on 9 of 14 days]',
    'MindMap shows body signal patterns. It does not diagnose.',
    '',
    `From: ${f.from.trim() || '[your name, role and contact]'}`,
  ].join('\n')
}

export function ReferralNote({ onBack }) {
  const [f, setF] = React.useState({
    id:'', age:'', to:TO[1], other:'', when:'routine', seen:'', pattern:'', share:['Readings summary'], from:'',
  })
  const set = k => e => setF(x => ({ ...x, [k]: e.target.value }))
  const flip = s => setF(x => ({ ...x, share: x.share.includes(s) ? x.share.filter(y => y !== s) : [...x.share, s] }))
  const note = buildNote(f)

  return (
    <ActivityScreen id="pro-referral" title="Referral Note" onBack={onBack}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Sheet>
          <div className="grid gap-5">
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3">
              <Field label="Young person" hint="initials or ID">
                <input className={FIELD} value={f.id} onChange={set('id')} maxLength={24} placeholder="A.B."/>
              </Field>
              <Field label="Age">
                <input className={FIELD} value={f.age} onChange={set('age')} inputMode="numeric" maxLength={2} placeholder="15"/>
              </Field>
            </div>

            <fieldset className="m-0 border-0 p-0">
              <legend className="font-display text-ui font-bold text-ink">Refer to</legend>
              <div className="mt-2 flex flex-wrap gap-2.5">
                {TO.map(t => <Choice key={t} on={f.to === t} onClick={() => setF(x => ({ ...x, to:t }))}>{t}</Choice>)}
              </div>
              {f.to === 'Other service' && (
                <input className={FIELD + ' mt-2.5'} value={f.other} onChange={set('other')} aria-label="Service name"
                  placeholder="Service name"/>
              )}
            </fieldset>

            <fieldset className="m-0 border-0 p-0">
              <legend className="font-display text-ui font-bold text-ink">Urgency</legend>
              <div className="mt-2 flex flex-wrap gap-2.5">
                {WHEN.map(([id, label]) => (
                  <Choice key={id} on={f.when === id} onClick={() => setF(x => ({ ...x, when:id }))}>{label}</Choice>
                ))}
              </div>
              <p className="mt-2 text-fine text-ink-2">Danger now is not a referral. Call your local emergency number.</p>
            </fieldset>

            <Field label="What you observed">
              <textarea rows={3} className={FIELD} value={f.seen} onChange={set('seen')}
                placeholder="Sleeping badly for three weeks. Missing classes."/>
            </Field>
            <Field label="MindMap readings">
              <textarea rows={2} className={FIELD} value={f.pattern} onChange={set('pattern')}
                placeholder="Higher than usual on 9 of the last 14 days."/>
            </Field>

            <fieldset className="m-0 border-0 p-0">
              <legend className="font-display text-ui font-bold text-ink">The teen agreed to share</legend>
              <div className="mt-2 flex flex-wrap gap-2.5">
                {SHARE.map(s => <Choice key={s} on={f.share.includes(s)} onClick={() => flip(s)}>{s}</Choice>)}
              </div>
            </fieldset>

            <Field label="From">
              <input className={FIELD} value={f.from} onChange={set('from')} placeholder="Your name, role and contact"/>
            </Field>
          </div>
        </Sheet>

        <div className="flex flex-col gap-4">
          <Sheet>
            <Label>The note</Label>
            <pre className="kit-ground mt-3 whitespace-pre-wrap break-words rounded-[14px] p-4 font-body text-sec
              leading-relaxed text-ink">{note}</pre>
            <div className="mt-4"><CopyButton text={note} label="Copy note" kind="primary"/></div>
            <p className="note mt-3">Nothing you type here is saved or sent.</p>
          </Sheet>
          {f.when === 'urgent' && <Crisis/>}
        </div>
      </div>
    </ActivityScreen>
  )
}
