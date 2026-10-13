import React from 'react'

/* One reader for prefers-reduced-motion, because four activities need it in
 * JavaScript rather than in CSS: a pace driven by requestAnimationFrame is not
 * something a media query can collapse, and an animation handed a behaviour in
 * script overrides the stylesheet. Every activity that reads this stays
 * meaningful when it comes back true: the pacer counts in seconds instead of
 * growing, the scan steps instead of sliding, the meters hold still and report
 * a figure. */
export function useReduced() {
  const [on, setOn] = React.useState(() =>
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  React.useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const on = () => setOn(mq.matches)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])
  return on
}
