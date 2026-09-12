import { clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'
import { TYPE_STEPS } from './type-scale'

/* tailwind-merge does not know this project's custom font-size keys, so it read
 * `text-page` and `text-ink` as two classes from the same group and dropped the
 * size — every headline that went through cn() rendered at body size. The step
 * names come from the scale itself so a new step cannot be missed here. */
const twMerge = extendTailwindMerge({
  extend: { classGroups: { 'font-size': [{ text: TYPE_STEPS }] } },
})
export function cn(...i) { return twMerge(clsx(i)) }
