import { clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/* tailwind-merge does not know this project's custom font-size keys, so it read
 * `text-page` and `text-ink` as two classes from the same group and dropped the
 * size — every headline that went through cn() rendered at body size. Teach it
 * the scale from tailwind.config.js and the conflict disappears. */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['label', 'meta', 'sec', 'body', 'row', 'view', 'sect', 'fig', 'page'] }],
    },
  },
})
export function cn(...i) { return twMerge(clsx(i)) }
