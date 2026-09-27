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

   The whole scale came down about 8% at the display end and about 5% at the
   reading end. It had been tuned for an anxious glance and had ended up
   costing a reader four scrolls to get past a section: the review's words were
   that everything had got "just slightly too big". Ratios between the steps
   are unchanged, so nothing about the hierarchy moved, only its size.

   `gap` is the deliberate irregularity. It sits at 2.75rem, between `stat`
   and the fluid display steps, and is used for the one figure per screen that
   has to beat everything around it without becoming a headline. Nothing else
   in the scale is spaced like it. */
export const TYPE_SCALE = {
  fine:  ['0.875rem',   { lineHeight:'1.5' }],
  note:  ['0.9375rem',  { lineHeight:'1.55' }],
  tick:  ['1rem',       { lineHeight:'1.32', letterSpacing:'-0.004em' }],
  ui:    ['1.0625rem',  { lineHeight:'1.35' }],
  meta:  ['1.125rem',   { lineHeight:'1.5' }],
  sec:   ['1.1875rem',  { lineHeight:'1.55', letterSpacing:'-0.002em' }],
  body:  ['1.3125rem',  { lineHeight:'1.56', letterSpacing:'-0.004em' }],
  lead:  ['clamp(1.3125rem,1.5vw,1.5rem)', { lineHeight:'1.48', letterSpacing:'-0.008em' }],
  row:   ['1.375rem',   { lineHeight:'1.25', letterSpacing:'-0.014em' }],
  head:  ['1.5rem',     { lineHeight:'1.2',  letterSpacing:'-0.018em' }],
  sub:   ['clamp(1.5rem,2.1vw,2rem)', { lineHeight:'1.16', letterSpacing:'-0.022em' }],
  num:   ['1.75rem',    { lineHeight:'1',    letterSpacing:'-0.018em' }],
  stat:  ['2.125rem',   { lineHeight:'1',    letterSpacing:'-0.026em' }],
  gap:   ['2.4375rem',  { lineHeight:'0.98', letterSpacing:'-0.03em' }],
  major: ['clamp(1.875rem,2.8vw,2.5rem)',   { lineHeight:'1.1',  letterSpacing:'-0.028em' }],
  dial:  ['3.125rem',   { lineHeight:'0.95', letterSpacing:'-0.034em' }],
  view:  ['clamp(1.9375rem,3.6vw,2.875rem)',{ lineHeight:'1.08', letterSpacing:'-0.03em' }],
  sect:  ['clamp(2.125rem,3.8vw,3.25rem)',  { lineHeight:'1.05', letterSpacing:'-0.033em' }],
  fig:   ['clamp(3rem,6.2vw,4.5rem)',       { lineHeight:'0.94', letterSpacing:'-0.042em' }],
  page:  ['clamp(2.75rem,6vw,5.25rem)',     { lineHeight:'0.99', letterSpacing:'-0.038em' }],
}
export const TYPE_STEPS = Object.keys(TYPE_SCALE)
