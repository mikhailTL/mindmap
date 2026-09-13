/* The type scale, in one place.

   It lives here and not in tailwind.config.js because two consumers need it
   and they must never disagree: Tailwind, which generates the classes, and
   tailwind-merge, which has to be told these are font sizes. When they did
   disagree — a step added to the config and not to the merge list — cn()
   read `text-head text-ink` as two classes from the same group and kept only
   one, so a heading rendered at body size or with no colour at all. It ships
   silently and an audit finds it as a 1:1 contrast failure. */
export const TYPE_SCALE = {
  label: ['1.0625rem',  { lineHeight:'1.4',  letterSpacing:'0.11em' }],
  tiny:  ['1rem',       { lineHeight:'1.45' }],
  ui:    ['1.125rem',   { lineHeight:'1.35' }],
  meta:  ['1.1875rem',  { lineHeight:'1.5' }],
  sec:   ['1.25rem',    { lineHeight:'1.55' }],
  body:  ['1.4375rem',  { lineHeight:'1.58' }],
  lead:  ['clamp(1.4375rem,1.7vw,1.625rem)', { lineHeight:'1.52' }],
  row:   ['1.5rem',     { lineHeight:'1.25', letterSpacing:'-0.02em' }],
  head:  ['1.625rem',   { lineHeight:'1.2',  letterSpacing:'-0.02em' }],
  sub:   ['clamp(1.625rem,2.5vw,2.25rem)',   { lineHeight:'1.15', letterSpacing:'-0.025em' }],
  num:   ['1.875rem',   { lineHeight:'1.05', letterSpacing:'-0.02em' }],
  stat:  ['2.25rem',    { lineHeight:'1',    letterSpacing:'-0.03em' }],
  major: ['clamp(2rem,3.4vw,2.875rem)',     { lineHeight:'1.1',  letterSpacing:'-0.03em' }],
  dial:  ['3.5rem',     { lineHeight:'1',    letterSpacing:'-0.03em' }],
  view:  ['clamp(2rem,4.4vw,3.5rem)',       { lineHeight:'1.1',  letterSpacing:'-0.03em' }],
  sect:  ['clamp(2.375rem,4.4vw,4rem)',     { lineHeight:'1.05', letterSpacing:'-0.03em' }],
  fig:   ['clamp(3.625rem,8vw,5.625rem)',   { lineHeight:'1',    letterSpacing:'-0.04em' }],
  page:  ['clamp(3.125rem,7.4vw,6.625rem)', { lineHeight:'1.02', letterSpacing:'-0.035em' }],
}
export const TYPE_STEPS = Object.keys(TYPE_SCALE)
