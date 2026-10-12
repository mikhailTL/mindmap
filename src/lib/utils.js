import { clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'
import { TYPE_STEPS } from './type-scale'

/* tailwind-merge has to be taught this project's custom font-size keys, or it
 * treats `text-page` and `text-ink` as one group and drops the size. Step names
 * come from the scale itself so a new step cannot be missed here. */
const twMerge = extendTailwindMerge({
  extend: { classGroups: { 'font-size': [{ text: TYPE_STEPS }] } },
})
export function cn(...i) { return twMerge(clsx(i)) }
