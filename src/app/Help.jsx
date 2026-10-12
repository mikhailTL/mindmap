import React from 'react'
import * as D from '@radix-ui/react-dialog'
import { Cross } from '../ui/marks'
import { cn } from '../lib/utils'
import { PRO_LC } from '../lib/terms'
import { EMERGENCY, RESOURCES, VERIFIED_ON } from './resources'

/* Getting help.
 *
 * Reachable from every app screen, and it works with no reading, no patch and
 * no account, because the moment somebody needs this is not the moment to
 * pair a device. It is a list of other people's phone numbers: it does not
 * score anybody, it does not decide whether a person is in crisis, and it
 * never opens itself. Nothing in it is an alarm.
 *
 * Three things it deliberately does not say: that any of this is
 * confidential, what any service will do with what it is told, and what any
 * authority will or will not do. All three vary and none of them are ours to
 * promise. The services describe themselves on their own pages and every row
 * links to one.
 *
 * Numbers, codes, hours and links are in ./resources.js with the URL each one
 * was read from and the date it was checked.
 */

/* Local glyphs rather than additions to ui/marks.jsx: three shapes, used
   nowhere else, drawn in the same 24-box single-stroke idiom as that file. */
const G = p => (
  <svg viewBox="0 0 24 24" width={p.size || 18} height={p.size || 18} fill="none" aria-hidden
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    className={cn('shrink-0', p.className)}>{p.children}</svg>
)
const CallMark = p => (
  <G {...p}><path d="M6.5 3.5h3l1.5 4-2 1.5a10 10 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z"/></G>
)
const TextMark = p => (
  <G {...p}><path d="M4 5.5h16v10H9l-5 4Z"/><path d="M8.5 10.5h7"/></G>
)
const ChatMark = p => (
  <G {...p}><path d="M3.5 7.5h13v8h-7l-6 4Z"/><path d="M8.5 4.5h12v8l-2 1.4"/></G>
)
const MARK = { call: CallMark, text: TextMark, chat: ChatMark }

/* An action is an anchor, not a button: a long press should offer to copy the
   number, and a chat link should be openable in a new tab. 48 tall, so three
   of them stacked on a 390 screen are still three separate targets. */
function Action({ kind, label, href }) {
  const Mark = MARK[kind] || CallMark
  const external = href.startsWith('http')
  return (
    <a href={href}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      className={cn('inline-flex min-h-[48px] flex-auto items-center justify-center gap-2 rounded-field',
        'border px-3 font-display text-ui font-medium transition-colors duration-150 ease',
        kind === 'chat'
          ? 'border-rule bg-card text-ink hoverOnly:bg-mist'
          : 'border-accent-ink bg-accent text-paper hoverOnly:bg-accent-ink')}>
      <Mark size={17}/>
      <span>{label}</span>
    </a>
  )
}

function Resource({ r }) {
  return (
    <li className="flex h-full flex-col overflow-hidden rounded-panel border border-rule bg-card">
      <div className="border-b border-rule px-4 py-3">
        <h3 className="font-display text-meta font-bold leading-tight text-ink">{r.name}</h3>
        <p className="mt-1 max-w-[52ch] text-fine text-ink-2">{r.what}</p>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          {r.actions.map(a => <Action key={a.label} {...a}/>)}
        </div>
        <dl className="m-0 mt-auto grid grid-cols-[5.75rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-fine">
          <dt className="font-mono text-ink-3">Open</dt>
          <dd className="m-0 text-ink-2">{r.hours}</dd>
          <dt className="font-mono text-ink-3">Answered by</dt>
          <dd className="m-0 text-ink-2">{r.who}</dd>
          {/* A way in that is not a button, so it is a row rather than a
              fourth action: nothing here is tappable. */}
          {r.access && (
            <>
              <dt className="font-mono text-ink-3">Also</dt>
              <dd className="m-0 text-ink-2">{r.access}</dd>
            </>
          )}
        </dl>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <a href={r.site} target="_blank" rel="noreferrer"
            className="inline-flex min-h-[44px] items-center font-display text-fine font-medium
              text-accent underline decoration-accent/40 underline-offset-2
              transition-colors duration-150 ease hoverOnly:text-accent-ink">
            Their own page
          </a>
          {r.extra && (
            <a href={r.extra.href} target="_blank" rel="noreferrer"
              className="inline-flex min-h-[44px] items-center font-display text-fine font-medium
                text-accent underline decoration-accent/40 underline-offset-2
                transition-colors duration-150 ease hoverOnly:text-accent-ink">
              {r.extra.label}
            </a>
          )}
        </div>
      </div>
    </li>
  )
}

/* The content on its own, so it can be a route as well as a sheet. */
export function HelpBody({ className }) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-4">
        <div className="rounded-panel border border-rule bg-card p-4">
          <p className="max-w-[62ch] text-meta text-ink">
            These are other people’s phone numbers, not MindMap’s. You do not need a reading,
            a patch or an account to use any of them, and MindMap does not record that you
            opened this page or tell a parent or a {PRO_LC} that you did.
          </p>
          <p className="mt-2 max-w-[62ch] text-fine text-ink-3">
            Calling, texting or opening a chat reaches that service, and what they do with
            what you tell them is theirs to say, on their own page. MindMap cannot promise
            anything on their behalf.
          </p>
        </div>
        <div className="rounded-panel border border-rule bg-aqua p-4">
          <h3 className="font-display text-meta font-bold text-ink">Right now</h3>
          <p className="mt-1 max-w-[42ch] text-fine text-ink-2">{EMERGENCY.line}</p>
          <a href={EMERGENCY.href}
            className="mt-3 inline-flex min-h-[48px] w-full items-center justify-center gap-2
              rounded-field border border-accent-ink bg-accent px-4 font-display text-ui
              font-bold text-paper transition-colors duration-150 ease hoverOnly:bg-accent-ink">
            <CallMark size={17}/>{EMERGENCY.label}
          </a>
        </div>
      </div>

      <h3 className="mark mt-6">Lines that answer</h3>
      <ul className="mt-3 grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2 lg:grid-cols-3 lg:gap-4">
        {RESOURCES.map(r => <Resource key={r.id} r={r}/>)}
      </ul>

      <p className="mt-4 max-w-[70ch] text-fine text-ink-3">
        Every number, code and link on this page was opened and read on {VERIFIED_ON}. Hours
        and numbers do change: if one of these does not connect, the service’s own page is
        linked beside it.
      </p>
    </div>
  )
}

/* The sheet. Full height on a phone, a panel on a laptop. Radix owns the
   focus trap, the Escape key and the return of focus to the trigger. */
export function HelpSheet({ open, onOpenChange }) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-[90] bg-ink/45"/>
        <D.Content
          aria-describedby={undefined}
          className={cn('fixed inset-0 z-[100] flex flex-col overflow-hidden bg-paper',
            'sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-[min(92dvh,56rem)]',
            'sm:w-[min(74rem,calc(100vw-3rem))] sm:-translate-x-1/2 sm:-translate-y-1/2',
            'sm:rounded-panel sm:border sm:border-ink-3')}>
          <div className="flex shrink-0 items-center gap-3 border-b border-ink-3 bg-card px-4 py-3">
            <span aria-hidden className="h-4 w-[3px] shrink-0 rounded-bar bg-accent"/>
            <D.Title className="min-w-0 flex-1 font-display text-head font-bold text-ink">
              Getting help
            </D.Title>
            <D.Close
              className="-mr-1 grid size-11 shrink-0 place-items-center rounded-field text-ink-2
                transition-colors duration-150 ease hoverOnly:bg-mist hoverOnly:text-ink"
              aria-label="Close">
              <Cross className="size-4"/>
            </D.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain
            px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6">
            <HelpBody/>
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  )
}

/* The trigger and the sheet together, so a screen mounts one element and gets
   the whole path. `compact` is the top-bar spelling, where the label shortens
   on a phone and the row already carries three other controls. */
export function GetHelp({ compact = false, className }) {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className={cn('inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2',
          'rounded-field border border-accent-ink bg-accent font-display text-ui font-medium',
          'text-paper transition-colors duration-150 ease hoverOnly:bg-accent-ink',
          compact ? 'w-11 px-0 sm:w-auto sm:gap-2 sm:px-3' : 'px-3', className)}>
        <CallMark size={16}/>
        {compact ? (
          <>
            <span className="sr-only sm:not-sr-only">Get help</span>
          </>
        ) : 'Get help'}
      </button>
      <HelpSheet open={open} onOpenChange={setOpen}/>
    </>
  )
}
