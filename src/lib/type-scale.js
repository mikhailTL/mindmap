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

   The review that set the sizes below said one thing six times: a reader
   could not tell where one section ended and the next began, because a section
   heading was barely larger than the paragraph under it. So the three heading
   steps are the ones that moved, and they moved a long way: `sub` (a section
   heading) from 26-36px to 32-48px, `major` (a page title) from 34-48px to
   40-60px, `head` (a card title) from 26 to 29. Body text did not move at all,
   which is the point: the gap between a heading and its paragraph is the
   signal, and widening the gap is what makes a new section announce itself.

   The reading end came down about 5% and stayed there: body, sec, meta, ui,
   tick, note and fine are what a section's bulk is set in, and that is where
   "everything has got slightly too big" was actually true.

   The display end came down with it and went straight back up, because the
   note behind that was about sections, not about headlines. A title is the
   one thing on a page allowed to be large. view, sect, major, fig, page,
   dial, sub, head, row, stat and gap are at or above where they started.

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
  row:   ['1.5625rem',  { lineHeight:'1.25', letterSpacing:'-0.014em' }],
  head:  ['1.8125rem',  { lineHeight:'1.2',  letterSpacing:'-0.018em' }],
  sub:   ['clamp(2rem,3.1vw,3rem)',        { lineHeight:'1.12', letterSpacing:'-0.024em' }],
  num:   ['1.75rem',    { lineHeight:'1',    letterSpacing:'-0.018em' }],
  stat:  ['2.375rem',   { lineHeight:'1',    letterSpacing:'-0.026em' }],
  gap:   ['2.75rem',    { lineHeight:'0.98', letterSpacing:'-0.03em' }],
  major: ['clamp(2.5rem,4.2vw,3.75rem)',    { lineHeight:'1.07', letterSpacing:'-0.028em' }],
  dial:  ['3.5rem',     { lineHeight:'0.95', letterSpacing:'-0.034em' }],
  view:  ['clamp(2.25rem,4.4vw,3.625rem)',  { lineHeight:'1.06', letterSpacing:'-0.03em' }],
  sect:  ['clamp(2.625rem,4.8vw,4.25rem)',  { lineHeight:'1.03', letterSpacing:'-0.033em' }],
  fig:   ['clamp(3.5rem,7.4vw,5.5rem)',     { lineHeight:'0.93', letterSpacing:'-0.042em' }],
  page:  ['clamp(3.25rem,7.4vw,6.5rem)',    { lineHeight:'0.98', letterSpacing:'-0.038em' }],
}
export const TYPE_STEPS = Object.keys(TYPE_SCALE)
