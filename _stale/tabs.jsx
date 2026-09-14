import React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'
import { ChevronDown } from 'lucide-react'
import { cn } from '../lib/utils'

/* Input primitives from the s21 kit, retokenised to the light clinical
   palette. The dark kit's 10–14px type is gone: nothing here renders below
   16px, and every trigger clears a 44px target. */

/* ── Tabs — underline, not pills. Reads as navigation, not chrome. ── */

export const Tabs = TabsPrimitive.Root

export function TabsList({ children, className }) {
  return (
    <TabsPrimitive.List className={cn('flex items-center gap-1 border-b border-rule', className)}>
      {children}
    </TabsPrimitive.List>
  )
}

export function TabsTrigger({ children, value, className }) {
  return (
    <TabsPrimitive.Trigger value={value}
      className={cn(
        'relative -mb-px inline-flex min-h-[44px] items-center border-b border-transparent px-3 py-2.5',
        'font-mono text-label uppercase tracking-[0.16em] text-ink-3',
        'outline-none transition-colors duration-150 hover:text-ink-2',
        'data-[state=active]:border-ink data-[state=active]:text-ink',
        'rounded-t focus-visible:ring-2 focus-visible:ring-accent',
        className)}>
      {children}
    </TabsPrimitive.Trigger>
  )
}

export const TabsContent = TabsPrimitive.Content

/* ── Accordion ─────────────────────────────────────────────────────── */

/* The kit built this on @radix-ui/react-accordion, which this project does not
   depend on. Rebuilt on the Collapsible primitive that is already here: one
   item per Collapsible, with the single/multiple open-set kept in context.
   The Root props (type, collapsible, value, defaultValue, onValueChange) are
   unchanged, so call sites port across as-is. */

const AccordionContext = React.createContext(null)
const asArray = v => (v == null || v === '' ? [] : Array.isArray(v) ? v : [v])

export function Accordion({
  type = 'single',
  collapsible = false,
  value,
  defaultValue,
  onValueChange,
  children,
  className,
  ...rest
}) {
  const multiple = type === 'multiple'
  const controlled = value !== undefined
  const [internal, setInternal] = React.useState(() => asArray(defaultValue))
  const open = controlled ? asArray(value) : internal

  const commit = React.useCallback(next => {
    if (!controlled) setInternal(next)
    if (onValueChange) onValueChange(multiple ? next : (next[0] ?? ''))
  }, [controlled, multiple, onValueChange])

  const toggle = React.useCallback(item => {
    const isOpen = open.includes(item)
    if (multiple) commit(isOpen ? open.filter(v => v !== item) : [...open, item])
    else if (isOpen) { if (collapsible) commit([]) }
    else commit([item])
  }, [open, multiple, collapsible, commit])

  const ctx = React.useMemo(() => ({ open, toggle }), [open, toggle])
  return (
    <AccordionContext.Provider value={ctx}>
      <div className={className} {...rest}>{children}</div>
    </AccordionContext.Provider>
  )
}

export function AccordionItem({ value, trigger, children, className }) {
  const ctx = React.useContext(AccordionContext)
  const open = ctx ? ctx.open.includes(value) : false
  return (
    <CollapsiblePrimitive.Root open={open} onOpenChange={() => ctx && ctx.toggle(value)}
      className={cn('border-b border-rule', className)}>
      <CollapsiblePrimitive.Trigger
        className="group flex min-h-[44px] w-full items-center justify-between gap-4 py-4 text-left outline-none">
        <span className="font-display text-body text-ink transition-colors group-hover:text-accent">{trigger}</span>
        <ChevronDown aria-hidden size={18}
          className="shrink-0 text-ink-3 transition-transform duration-300 group-data-[state=open]:rotate-180"/>
      </CollapsiblePrimitive.Trigger>
      {/* animate-down / animate-up ride the measured Radix content height; the
          base stylesheet flattens both under prefers-reduced-motion. */}
      <CollapsiblePrimitive.Content
        className="overflow-hidden data-[state=open]:animate-down data-[state=closed]:animate-up">
        <div className="pb-4 pr-8 text-sec text-ink-2">{children}</div>
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  )
}
