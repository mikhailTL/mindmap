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

   This scale has been pulled in both directions by two different complaints
   and the current settlement is the interesting part of the file.

   A review once said six times over that a reader could not tell where one
   section ended and the next began, because a section heading was barely
   larger than the paragraph under it. Every heading step went up hard in
   answer: `sub` from 26-36px to 32-48px, `major` from 34-48 to 40-60, `head`
   from 26 to 29.

   The answer overshot, and the note back named the cost precisely: things
   "go down", sections get "unnecessarily larger", and blank space opens up
   behind them. That is arithmetic, not taste. A card title at 29px sets the
   height of every card in a row of three, a section heading at 48px pushes
   its own lede and everything under it down a line, and on a fixed-height
   band the surplus prints as emptiness.

   So the heading steps came back about 14% and the reading steps about 5%:
   `sub` is 28-40px, `head` 25, `row` 22, body 19. The gap that makes a
   section announce itself survives the cut, because it is a RATIO and both
   ends moved: sub over body is 28/19 at the narrow end and 40/18 at the wide
   end, against the 1.37 the original complaint was about.

   The display steps came down least, around 7%, and deliberately. A page
   title is the one thing allowed to be large, the hero is a fixed-height
   band whose emptiness grows when its headline shrinks, and the request to
   make the title stand out is still standing. view, sect, fig and page are
   the four steps that carry it.

   `gap` is the deliberate irregularity. It sits at 2.75rem, between `stat`
   and the fluid display steps, and is used for the one figure per screen that
   has to beat everything around it without becoming a headline. Nothing else
   in the scale is spaced like it. */
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
