/* The type scale. Not in tailwind.config.js, because two consumers read it and
   must agree: Tailwind, which generates the classes, and tailwind-merge (see
   utils.js), which has to be told these keys are font sizes. A step added to
   one and not the other makes cn() drop a size or a colour, silently.

   Headings carry separation as a RATIO over body (`sub`/`body` is 28/19
   narrow, 40/18 wide), so retuning moves both ends together. `gap` is the
   deliberate irregularity, between `stat` and the fluid display steps, for the
   one figure per screen that must beat everything around it without becoming a
   headline. */
export const TYPE_SCALE = {
  fine:  ['0.875rem',   { lineHeight:'1.5' }],
  note:  ['0.9375rem',  { lineHeight:'1.55' }],
  tick:  ['0.9375rem',  { lineHeight:'1.34', letterSpacing:'-0.004em' }],
  ui:    ['1rem',       { lineHeight:'1.38' }],
  meta:  ['1.0625rem',  { lineHeight:'1.5' }],
  sec:   ['1.125rem',   { lineHeight:'1.55', letterSpacing:'-0.002em' }],
  body:  ['1.1875rem',  { lineHeight:'1.56', letterSpacing:'-0.004em' }],
  lead:  ['clamp(1.1875rem,1.35vw,1.375rem)', { lineHeight:'1.5', letterSpacing:'-0.008em' }],
  row:   ['1.375rem',   { lineHeight:'1.26', letterSpacing:'-0.014em' }],
  head:  ['1.5625rem',  { lineHeight:'1.22', letterSpacing:'-0.018em' }],
  sub:   ['clamp(1.75rem,2.6vw,2.5rem)',    { lineHeight:'1.14', letterSpacing:'-0.022em' }],
  num:   ['1.5625rem',  { lineHeight:'1',    letterSpacing:'-0.018em' }],
  stat:  ['2.125rem',   { lineHeight:'1',    letterSpacing:'-0.026em' }],
  gap:   ['2.5rem',     { lineHeight:'0.98', letterSpacing:'-0.03em' }],
  major: ['clamp(2.125rem,3.6vw,3.25rem)',  { lineHeight:'1.08', letterSpacing:'-0.028em' }],
  dial:  ['3.125rem',   { lineHeight:'0.95', letterSpacing:'-0.034em' }],
  view:  ['clamp(2.125rem,4.1vw,3.375rem)', { lineHeight:'1.06', letterSpacing:'-0.03em' }],
  sect:  ['clamp(2.375rem,4.4vw,3.875rem)', { lineHeight:'1.04', letterSpacing:'-0.033em' }],
  fig:   ['clamp(3rem,6.6vw,5rem)',         { lineHeight:'0.94', letterSpacing:'-0.042em' }],
  page:  ['clamp(2.875rem,6.4vw,5.5rem)',   { lineHeight:'0.99', letterSpacing:'-0.038em' }],
}
export const TYPE_STEPS = Object.keys(TYPE_SCALE)
