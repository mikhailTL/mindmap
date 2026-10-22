import React from 'react'

// prefers-reduced-motion read in JS, because requestAnimationFrame animations are not covered by a CSS media query.
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
