/* The type scale, in one place.

   It lives here and not in tailwind.config.js because two consumers need it
   and they must never disagree: Tailwind, which generates the classes, and
   tailwind-merge, which has to be told these are font sizes. When they did
   disagree — a step added to the config and not to the merge list — cn()
   read `text-head text-ink` as two classes from the same group and kept only
   one, so a heading rendered at body size or with no colour at all. It ships
   silently and an audit finds it as a 1:1 contrast failure.

   Set against a printed observation chart: the small end is dense and close
   together because a chart's annotations are, and the large end jumps hard
   because a chart has exactly one number you read from across a room.

   `gap` is the deliberate irregularity. It sits at 2.75rem, between `stat`
   and the fluid display steps, and is used for the one figure per screen that
   has to beat everything around it without becoming a headline. Nothing else
   in the scale is spaced like it. */
export const TYPE_SCALE = {
  fine:  ['0.9375rem',  { lineHeight:'1.5',  letterSpacing:'0.005em' }],
  note:  ['1rem',       { lineHeight:'1.55', letterSpacing:'0.004em' }],
  tick:  ['1.0625rem',  { lineHeight:'1.3',  letterSpacing:'0.02em' }],
  ui:    ['1.125rem',   { lineHeight:'1.35' }],
  meta:  ['1.1875rem',  { lineHeight:'1.5' }],
  sec:   ['1.25rem',    { lineHeight:'1.55', letterSpacing:'-0.002em' }],
  body:  ['1.4375rem',  { lineHeight:'1.58', letterSpacing:'-0.004em' }],
  lead:  ['clamp(1.4375rem,1.7vw,1.6875rem)', { lineHeight:'1.5', letterSpacing:'-0.008em' }],
  row:   ['1.5rem',     { lineHeight:'1.25', letterSpacing:'-0.014em' }],
  head:  ['1.6875rem',  { lineHeight:'1.2',  letterSpacing:'-0.018em' }],
  sub:   ['clamp(1.6875rem,2.5vw,2.375rem)', { lineHeight:'1.14', letterSpacing:'-0.022em' }],
  num:   ['1.9375rem',  { lineHeight:'1',    letterSpacing:'-0.018em' }],
  stat:  ['2.375rem',   { lineHeight:'1',    letterSpacing:'-0.026em' }],
  gap:   ['2.75rem',    { lineHeight:'0.98', letterSpacing:'-0.03em' }],
  major: ['clamp(2.125rem,3.4vw,3rem)',     { lineHeight:'1.08', letterSpacing:'-0.028em' }],
  dial:  ['3.625rem',   { lineHeight:'0.95', letterSpacing:'-0.034em' }],
  view:  ['clamp(2.125rem,4.4vw,3.625rem)', { lineHeight:'1.06', letterSpacing:'-0.03em' }],
  sect:  ['clamp(2.5rem,4.6vw,4.25rem)',    { lineHeight:'1.02', letterSpacing:'-0.033em' }],
  fig:   ['clamp(3.75rem,8vw,6rem)',        { lineHeight:'0.92', letterSpacing:'-0.042em' }],
  page:  ['clamp(3.25rem,7.6vw,7rem)',      { lineHeight:'0.97', letterSpacing:'-0.038em' }],
}
export const TYPE_STEPS = Object.keys(TYPE_SCALE)
