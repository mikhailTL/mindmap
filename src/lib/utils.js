import { clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'
import { TYPE_STEPS } from './type-scale'

// tailwind-merge needs the custom font-size keys, or it groups text-page with text-ink and drops the size.
const twMerge = extendTailwindMerge({
  extend: { classGroups: { 'font-size': [{ text: TYPE_STEPS }] } },
})
export function cn(...i) { return twMerge(clsx(i)) }
