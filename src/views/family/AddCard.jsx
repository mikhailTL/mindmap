import React from 'react'
import * as D from '@radix-ui/react-dialog'
import { Copy, Cross, Plus } from '../../ui/marks'
import { cn } from '../../lib/utils'

/* AddCard({ label, onAdd, who }): the dashed card at the end of the grid. It
 * opens a short sheet with an invite link and the one step the teen takes.
 * The teen approves the link in their own app (Network), so nothing is shared
 * until they do. The link is a demo and goes nowhere. */

const DEMO_LINK = 'https://mindmap.app/join/K7Q-42M'
const DEMO_CODE = 'K7Q-42M'

export default function AddCard({ label = 'Add a child', onAdd, who = 'your teen', className }) {
  const [open, setOpen] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(DEMO_LINK) } catch { /* the link is on screen to select */ }
    setCopied(true)
    onAdd?.(DEMO_LINK)
  }
  React.useEffect(() => { if (!open) setCopied(false) }, [open])

  return (
    <D.Root open={open} onOpenChange={setOpen}>
      <D.Trigger asChild>
        <button type="button"
          className={cn('group flex min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-panel',
            'border-2 border-dashed border-ruling bg-paper p-5 text-center transition-colors duration-200',
            'hoverOnly:border-accent hoverOnly:bg-accent-wash motion-reduce:transition-none',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            className)}>
          <span aria-hidden className="grid size-12 place-items-center rounded-chip border-2 border-accent text-accent-ink">
            <Plus className="size-6"/>
          </span>
          <span className="font-display text-head font-bold text-ink">{label}</span>
          <span className="max-w-[26ch] text-fine text-ink-2">Send an invite. {cap(who)} approves it in their app.</span>
        </button>
      </D.Trigger>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-[90] bg-ink/45"/>
        <D.Content
          className={cn('fixed inset-x-0 bottom-0 z-[100] max-h-[92dvh] overflow-y-auto rounded-t-panel border-t',
            'border-rule bg-card p-5 pb-8 shadow-raise sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2',
            'sm:w-[min(32rem,calc(100vw-3rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-panel sm:border sm:p-6')}>
          <div className="flex items-start justify-between gap-4">
            <D.Title className="m-0 font-display text-head font-bold leading-tight text-ink">{label}</D.Title>
            <D.Close aria-label="Close"
              className="-mr-2 -mt-2 grid size-11 shrink-0 place-items-center rounded-chip text-ink-2 hoverOnly:bg-mist
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
              <Cross className="size-5"/>
            </D.Close>
          </div>
          <D.Description className="m-0 mt-2 text-ui text-ink-2">Send this link to {who}.</D.Description>

          <ol className="m-0 mt-5 list-none space-y-4 p-0">
            <Step n={1} title="Copy the invite link">
              <div className="mt-2 flex items-stretch gap-2">
                <input readOnly value={DEMO_LINK} aria-label="Invite link" onFocus={e => e.target.select()}
                  className="min-h-[44px] min-w-0 flex-1 rounded-field border border-ruling bg-paper px-3 font-body
                    text-fine text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"/>
                <button type="button" onClick={copy}
                  className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-field bg-accent px-4 font-display
                    text-ui font-bold text-paper hoverOnly:bg-accent-ink focus-visible:outline focus-visible:outline-2
                    focus-visible:outline-offset-2 focus-visible:outline-accent">
                  <Copy aria-hidden className="size-4"/>{copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="m-0 mt-2 text-fine text-ink-3">Or give them the code <b className="font-semibold text-ink">{DEMO_CODE}</b>.</p>
            </Step>
            <Step n={2} title={`${cap(who)} approves the link in their app`}>
              <p className="m-0 mt-1 text-fine text-ink-2">Nothing is shared until they do. They choose what you see.</p>
            </Step>
            <Step n={3} title="Their card appears here">
              <p className="m-0 mt-1 text-fine text-ink-2">Their Mind Score fills in after the first full day.</p>
            </Step>
          </ol>
          <p aria-live="polite" className="m-0 mt-5 text-fine text-ink-3">
            {copied ? 'Link copied. This is a demo link.' : 'Demo. The link goes nowhere.'}</p>
        </D.Content>
      </D.Portal>
    </D.Root>
  )
}

const cap = s => s.charAt(0).toUpperCase() + s.slice(1)

function Step({ n, title, children }) {
  return (
    <li className="flex gap-3">
      <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-chip bg-accent-wash font-display
        text-fine font-bold tabular-nums text-accent-ink">{n}</span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="m-0 font-display text-ui font-bold text-ink">{title}</p>
        {children}
      </div>
    </li>
  )
}
