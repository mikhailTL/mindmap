import React from 'react'
import * as C from '@radix-ui/react-collapsible'
import { ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'

/* Radix Collapsible replaces the native <details>: it gives a real
   aria-expanded/aria-controls pair and a measured height animation. */
/* A phone gets the sentence and nothing else until it asks. A monitor has the
   room to show the evidence beside the sentence, so it opens by default —
   same information architecture, density set by the viewport. */
export function useWide(q='(min-width: 1280px)'){
  const [on,setOn] = React.useState(()=> typeof matchMedia==='function' && matchMedia(q).matches)
  React.useEffect(()=>{
    const m = matchMedia(q); const fn = e => setOn(e.matches)
    m.addEventListener('change', fn); return ()=>m.removeEventListener('change', fn)
  },[q])
  return on
}
export function Disclosure({ label, children, className, openOnWide=false }){
  const wide = useWide()
  const [open,setOpen] = React.useState(()=> openOnWide && wide)
  React.useEffect(()=>{ if(openOnWide) setOpen(wide) },[wide,openOnWide])
  return (
    <C.Root open={open} onOpenChange={setOpen} className={cn('border-t border-rule',className)}>
      <C.Trigger className="group flex w-full items-center gap-3 min-h-[56px] font-display
        font-medium text-ui text-ink hover:text-accent transition-colors duration-150">
        <ChevronRight aria-hidden className="size-4 transition-transform duration-200 ease-out
          group-data-[state=open]:rotate-90" />
        {label}
      </C.Trigger>
      <C.Content className="overflow-hidden data-[state=open]:animate-down data-[state=closed]:animate-up">
        <div className="pb-2">{children}</div>
      </C.Content>
    </C.Root>
  )
}
