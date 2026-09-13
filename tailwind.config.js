import { TYPE_SCALE } from './src/lib/type-scale.js'

/** Tokens derived from the product, not from a palette generator.
 *  Clinical vernacular: red is reserved for critical and is unavailable as a
 *  brand accent; terracotta means out-of-range. */
export default {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /* Metallic Chic. Five colours were given, and five colours is not a
           system, so the ink ramp is derived down the deep blue's own hue
           (227°) and every step below was measured rather than picked:
             ink   #171f3c  13.46 : 1 on paper
             ink-2 #30417e   8.00 : 1
             ink-3 #4c5a8e   5.24 : 1  (4.86 on mist, so it survives the band)
           The five originals then do only the work they can actually do.
           3d52a0 is the one that clears 4.5 : 1 as text, so it is the accent.
           7091e6 clears nothing as text and 5.30 : 1 as a bed under ink, so it
           is a fill and never a label. 8697c4 rules charts. adbbda draws
           borders. ede8f5 is the sheet. */
        paper:  '#ede8f5',
        card:   '#f8f6fc',
        mist:   '#dce2f1',
        ink:    { DEFAULT:'#171f3c', 2:'#30417e', 3:'#4c5a8e' },
        rule:   '#adbbda',
        /* The printed grid of an observation chart. It means nothing — it is
           the colour the paper was ruled in, and it is here for that reason. */
        ruling: '#8697c4',
        accent: { DEFAULT:'#3d52a0', ink:'#2c3c78', wash:'#dde3f6' },
        /* The mid blue, used only as a bed: ink on beam is 5.30 : 1 and beam
           on paper is 2.54 : 1. So it can hold text, it can never be text, and
           it is never the only thing carrying a state. */
        beam:   '#7091e6',
        /* Red, amber, green is a traffic light, and this is a chart about a
           child. Crit keeps its red because nothing else reads as an alarm at
           a glance. Warn is a terracotta and calm a deep pine, both far enough
           off the blue family to read as signals rather than as brand.
           Measured on paper : mist
             warn #97482a  5.33 : 4.94
             calm #2a6350  5.82 : 5.40
             crit #a11b1b  6.50 : 6.02 */
        warn:   { DEFAULT:'#97482a', wash:'#f2e9e4' },
        calm:   '#2a6350',
        crit:   '#a11b1b',
      },
      fontFamily: {
        /* Quicksand is a geometric sans with round terminals, set at 500 for
           every heading and 300 only where a line runs large enough that 500
           would go heavy. It has no 700 loaded, so nothing on this site can
           shout by weight — hierarchy is carried by size, position and rule,
           which is the constraint the rest of the system was already built on.
           Chivo is the counterweight: a grotesque with a real 700, set for
           body and for every control. Chivo Mono keeps the figures in the same
           voice as the prose rather than importing a third designer. */
        display: ['Quicksand','-apple-system','system-ui','sans-serif'],
        body:    ['Chivo','-apple-system','system-ui','sans-serif'],
        mono:    ['"Chivo Mono"','ui-monospace','monospace'],
      },
      /* nine steps because the content has nine levels of meaning */
      fontSize: TYPE_SCALE,
      /* Radius by role, not by taste: a containing surface, a field, and the
         things that are physically round. Quicksand's terminals are round and
         the palette is a soft one, so the 0px panel the old green system used
         now reads as an oversight rather than as rigour. */
      borderRadius: {
        none:'0', panel:'10px', field:'6px', chip:'999px', bar:'999px',
        xs:'4px', sm:'6px', DEFAULT:'6px', lg:'10px',
      },
      /* Depth is one mechanism here: the surface shifts and a rule thickens.
         These two are the hard offset a card gets from the sheet under it —
         no blur, no spread, no light source to be inconsistent about, no glow. */
      boxShadow: {
        raise:'3px 3px 0 0 rgb(23 31 60 / 0.10)',
        lift: '5px 5px 0 0 rgb(23 31 60 / 0.16)',
      },
      maxWidth: { measure:'62ch', read:'44ch' },
      transitionTimingFunction: { out:'cubic-bezier(0.2,0.7,0.3,1)' },
      keyframes: {
        down:{ from:{height:'0'}, to:{height:'var(--radix-collapsible-content-height)'} },
        up:  { from:{height:'var(--radix-collapsible-content-height)'}, to:{height:'0'} },
        'accordion-down':{ from:{height:'0'}, to:{height:'var(--radix-accordion-content-height)'} },
        'accordion-up':  { from:{height:'var(--radix-accordion-content-height)'}, to:{height:'0'} },
      },
      animation: {
        down:'down .28s cubic-bezier(0.2,0.7,0.3,1)',
        up:  'up .22s cubic-bezier(0.2,0.7,0.3,1)',
        'accordion-down':'accordion-down .28s cubic-bezier(0.2,0.7,0.3,1)',
        'accordion-up':  'accordion-up .22s cubic-bezier(0.2,0.7,0.3,1)',
      },
    },
  },
}
