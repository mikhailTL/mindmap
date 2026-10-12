import React from 'react'
import { ScrollIn } from '../ui/motion'
import { cn } from '../lib/utils'
import { NOTES, NOTES_DEF, PRO_LC, SCORE } from '../lib/terms'
import { ArmedButton, Panel } from './controls'
import { GetHelp } from './Help'
import {
  NOTE_MAX, addNote, editNote, getVersion, listNotes, removeNote, subscribe,
} from './store'

/* Notes.
 *
 * The product already names this: terms.js defines Notes as "what a student
 * writes in their own journal", Privacy.jsx lists it as the first thing a
 * parent never sees, and the consent test asserts that no Notes entry exists
 * anywhere in the school-side data layer. All of which described a feature
 * the app did not have. This is it, and it is the one place in MindMap where
 * the student makes something rather than reading a figure.
 *
 * Everything written here stays in this browser's own storage. There is no
 * endpoint in store.js and no fetch in this file. Nothing reads a note: there
 * is no scoring of it, no sentiment on it, no word anybody is watching for,
 * and no path by which it could reach a parent or a Medical Professional,
 * because it never leaves the phone to begin with.
 *
 * Deleting removes the row. There is no bin behind it and nothing was ever
 * sent, so there is nothing elsewhere to withdraw.
 *
 * The filter below the list is the same: a substring match run in this
 * component over an array already in memory. It does not reach storage and it
 * does not persist, so leaving the screen clears it.
 */

const COUNT_WARN = 1800

function stamp(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const day = d.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' })
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return `${day}, ${time}`
}

const fieldClass = cn(
  'block w-full resize-y rounded-field border border-rule bg-card p-3 font-body text-ui',
  'leading-[1.55] text-ink placeholder:text-ink-3 transition-colors duration-150 ease',
  'hoverOnly:border-ink-3'
)

/* text-ui is 16px: the floor that stops iOS Safari zooming the page when a
   field takes focus. Do not shrink it. */
function Composer({ value, onChange, onSave, onCancel, saveLabel, label, autoFocus = false }) {
  const empty = !value.trim()
  const long = value.length > COUNT_WARN
  return (
    <div>
      <label className="block">
        <span className="block font-display text-fine font-medium text-ink-2">{label}</span>
        <textarea rows={5} value={value} maxLength={NOTE_MAX} autoFocus={autoFocus}
          onChange={e => onChange(e.target.value)}
          placeholder="Whatever it was. Nobody else reads this."
          className={cn(fieldClass, 'mt-1.5')}/>
      </label>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="button" disabled={empty} onClick={onSave}
          className={cn('inline-flex min-h-[44px] items-center rounded-field border px-4',
            'font-display text-ui font-medium transition-colors duration-150 ease',
            empty
              ? 'cursor-not-allowed border-rule bg-mist text-ink-3'
              : 'border-accent-ink bg-accent text-paper hoverOnly:bg-accent-ink')}>
          {saveLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="inline-flex min-h-[44px] items-center rounded-field px-3 font-display
              text-ui font-medium text-ink-2 transition-colors duration-150 ease hoverOnly:text-ink">
            Leave it as it was
          </button>
        )}
        <span className={cn('ml-auto font-mono text-fine tabular-nums',
          long ? 'text-warn' : 'text-ink-3')}>
          {value.length}/{NOTE_MAX}
        </span>
      </div>
    </div>
  )
}

function Note({ note }) {
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(note.text)

  return (
    <li className="border-t border-rule px-4 py-3 first:border-t-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-fine tabular-nums text-ink-3">{stamp(note.at)}</span>
        {note.editedAt && <span className="text-fine text-ink-3">Edited</span>}
      </div>
      {editing ? (
        <div className="mt-2">
          <Composer label="Change it" value={draft} onChange={setDraft} autoFocus
            saveLabel="Save the change"
            onSave={() => { editNote(note.id, draft); setEditing(false) }}
            onCancel={() => { setDraft(note.text); setEditing(false) }}/>
        </div>
      ) : (
        <>
          {/* whitespace-pre-line keeps the line breaks somebody typed; a note
              is not prose to be reflowed. */}
          <p className="mt-1 max-w-[62ch] whitespace-pre-line text-meta leading-[1.55] text-ink">
            {note.text}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <button type="button" onClick={() => setEditing(true)}
              className="inline-flex min-h-[44px] items-center rounded-field border border-rule
                px-3 font-display text-ui font-medium text-ink transition-colors duration-150
                ease hoverOnly:bg-mist">
              Change it
            </button>
            <ArmedButton armedLabel="Yes, delete it" onConfirm={() => removeNote(note.id)}>
              Delete it
            </ArmedButton>
          </div>
        </>
      )}
    </li>
  )
}

/* Finding one entry again. A journal holds up to 400 of these and scrolling
   for one is the thing that makes a long list useless, so the field appears
   once there are more than FILTER_FROM of them and not before: a search box
   over two notes is a control that cannot do anything.

   The match is a plain case-insensitive substring. Nothing is indexed, nothing
   is scored, and the typing goes nowhere: the field's value lives in this
   component and is gone when the screen is left. */
const FILTER_FROM = 3

function FilterField({ value, onChange, shown, total }) {
  const id = React.useId()
  return (
    <div className="flex flex-wrap items-end gap-x-3 gap-y-2 border-t border-rule px-4 py-3 first:border-t-0">
      <div className="min-w-0 basis-full sm:basis-0 sm:flex-1">
        <label htmlFor={id} className="block font-display text-fine font-medium text-ink-2">
          Find one again
        </label>
        <input id={id} type="search" value={value} autoComplete="off"
          onChange={e => onChange(e.target.value)}
          placeholder="A word you used"
          className={cn('mt-1 block min-h-[44px] w-full rounded-field border border-rule bg-card',
            'px-3 font-body text-ui text-ink placeholder:text-ink-3',
            'transition-colors duration-150 ease hoverOnly:border-ink-3')}/>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span aria-live="polite"
          className="font-mono text-fine tabular-nums text-ink-3">{shown} of {total}</span>
        {value && (
          <button type="button" onClick={() => onChange('')}
            className="inline-flex min-h-[44px] items-center rounded-field border border-rule
              px-3 font-display text-ui font-medium text-ink transition-colors duration-150
              ease hoverOnly:bg-mist">
            Show all
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * The student's journal.
 *
 * Props
 *   className  string  Optional.
 *
 * Mount at: the student app, as a new route `notes`, tab label "Notes",
 * inside <SectionShell>. It belongs on the student app's bottom bar beside
 * Today and Reading: it is a thing the student does, not a setting. Nothing
 * on the parent or Medical Professional side may link to it or render it.
 */
export function NotesJournal({ className }) {
  React.useSyncExternalStore(subscribe, getVersion, () => 0)
  const notes = listNotes()
  const [draft, setDraft] = React.useState('')
  const [query, setQuery] = React.useState('')

  const save = () => { addNote(draft); setDraft('') }

  const needle = query.trim().toLowerCase()
  const filtering = notes.length > FILTER_FROM && needle
  const shown = filtering
    ? notes.filter(n => n.text.toLowerCase().includes(needle))
    : notes

  return (
    <div className={cn('min-w-0', className)}>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,23rem)] lg:gap-4">
        <ScrollIn>
          <Panel title={`Write a note`}
            lede={NOTES_DEF + ' It stays on this phone.'}>
            <div className="p-4">
              <Composer label="Today" value={draft} onChange={setDraft} onSave={save}
                saveLabel="Keep it"/>
            </div>
          </Panel>
        </ScrollIn>

        <ScrollIn delay={0.05} className="h-full">
          <Panel title="Where this goes" className="h-full">
            <ul className="m-0 list-none p-0">
              {[
                ['Stored', 'In this browser, on this phone, and nowhere else.'],
                ['Sent', 'Never. There is no address for it to be sent to.'],
                ['Read', `Not by a parent, not by a ${PRO_LC}, not by us.`],
                ['Scored', `Nothing here moves your ${SCORE}. A note is not a reading.`],
                ['Deleted', 'When you delete one it is gone from the phone. There is no bin.'],
              ].map(([k, v]) => (
                <li key={k} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 border-t
                  border-rule px-4 py-2.5 first:border-t-0">
                  <span className="font-mono text-fine text-ink-3">{k}</span>
                  <span className="max-w-[48ch] text-fine text-ink-2">{v}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-rule bg-aqua px-4 py-3">
              <p className="max-w-[48ch] text-fine text-ink-2">
                Writing it down is not the same as telling somebody. If you want a person,
                the lines are here and none of them need a reading.
              </p>
              <GetHelp className="mt-2.5"/>
            </div>
          </Panel>
        </ScrollIn>
      </div>

      <ScrollIn delay={0.1}>
        <Panel className="mt-3" title={NOTES}
          aside={notes.length === 1 ? '1 note' : `${notes.length} notes`}>
          {notes.length > FILTER_FROM && (
            <FilterField value={query} onChange={setQuery}
              shown={shown.length} total={notes.length}/>
          )}
          {notes.length === 0 ? (
            <div className="px-4 py-6">
              <p className="max-w-[52ch] text-meta text-ink-2">
                Nothing written yet. The first one can be a sentence.
              </p>
            </div>
          ) : shown.length === 0 ? (
            <div className="border-t border-rule px-4 py-6">
              <p className="max-w-[52ch] text-meta text-ink-2">
                No note here holds that word. Nothing has been deleted: clear the field to
                see all {notes.length} again.
              </p>
            </div>
          ) : (
            <ul className="m-0 list-none p-0">
              {shown.map(n => <Note key={n.id} note={n}/>)}
            </ul>
          )}
        </Panel>
      </ScrollIn>
    </div>
  )
}
