import React from 'react'
import { Command } from 'cmdk'
import * as Dialog from '@radix-ui/react-dialog'
import { LayoutGrid, LineChart, Users, Stethoscope, Activity, ListTree, Home, Cpu } from 'lucide-react'

/* shadcn's Command component (cmdk + Radix Dialog), adapted: the registry demo
   list is replaced by this product's views, and it is a desktop affordance —
   pointer hardware only, since a touch user has the tab bar. */
const CMDS = [
  { id:'site',    label:'Overview',        icon:Home,        hint:'What MindMap is' },
  { id:'patch',   label:'The patch',       icon:Cpu,         hint:'The device, in 3D' },
  { id:'hub',     label:'The app',         icon:LayoutGrid,  hint:'Student, parent, school' },
  { id:'check',   label:'Take a reading',  icon:Activity,    hint:'Patch or six questions' },
  { id:'student', label:'Student view',    icon:LineChart,   hint:'Today' },
  { id:'parent',  label:'Parent view',     icon:Users,       hint:'This week' },
  { id:'pro',     label:'For schools',     icon:Stethoscope, hint:'Counselors and psychologists' },
  { id:'index',   label:'All features',    icon:ListTree,    hint:'Every screen, listed' },
]
export function Palette({ go }){
  const [open,setOpen] = React.useState(false)
  React.useEffect(()=>{
    const onKey = e => {
      if(e.key==='k' && (e.metaKey||e.ctrlKey)){ e.preventDefault(); setOpen(o=>!o) }
    }
    document.addEventListener('keydown', onKey)
    return ()=>document.removeEventListener('keydown', onKey)
  },[])
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-ink/25 backdrop-blur-[2px]"/>
        <Dialog.Content className="fixed left-1/2 top-[18vh] z-[101] w-[min(92vw,560px)] -translate-x-1/2
          overflow-hidden rounded border border-rule bg-paper shadow-lift">
          <Dialog.Title className="sr-only">Go to a view</Dialog.Title>
          <Dialog.Description className="sr-only">Search the views in MindMap and press Enter to open one.</Dialog.Description>
          <Command loop>
            <Command.Input autoFocus placeholder="Go to…"
              className="w-full border-b border-rule bg-transparent px-5 py-4 font-body text-[1.1875rem]
                text-ink outline-none placeholder:text-ink-3"/>
            <Command.List className="max-h-[52vh] overflow-y-auto p-2">
              <Command.Empty className="px-3 py-6 text-sec text-ink-3">Nothing matches that.</Command.Empty>
              {CMDS.map(c=>(
                <Command.Item key={c.id} value={c.label+' '+c.hint}
                  onSelect={()=>{ go(c.id); setOpen(false) }}
                  className="flex cursor-pointer items-center gap-3 rounded-xs px-3 py-2.5 text-meta text-ink
                    data-[selected=true]:bg-sage">
                  <c.icon aria-hidden className="size-[18px] text-ink-3"/>
                  <span className="font-display font-medium">{c.label}</span>
                  <span className="ml-auto text-sec text-ink-3">{c.hint}</span>
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
/* The hint only shows where the shortcut exists. */
export function PaletteHint(){
  return (
    <span className="ml-3 hidden items-center gap-1.5 font-mono text-[0.9375rem] text-ink-3
      [@media(hover:hover)and(pointer:fine)]:inline-flex">
      <kbd className="rounded-xs border border-rule px-1.5 py-0.5">⌘K</kbd>
    </span>
  )
}
