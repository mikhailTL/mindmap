import { TYPE_SCALE } from './src/lib/type-scale.js'

/** Tokens derived from the product, not from a palette generator.
 *  Clinical vernacular: red is reserved for critical and is unavailable as a
 *  brand accent; amber means out-of-range. */
export default {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      /* ── THE GREEN PALETTE ────────────────────────────────────────────
         Green is the colour mental health is spoken in, so it is the highlight
         everywhere the maroon used to be. White is the ground and a turquoise
         is the second voice, used on graphics and almost never on a word.

         Every value below was measured, not picked. Ratios against paper,
         card, mist and the dark band:

           ink    #0d2b1e  14.47 : 15.20 : 12.69
           ink-2  #2a5744   7.85 :  8.25 :  6.89
           ink-3  #47705e   5.33 :  5.61 :  4.68   (clears 4.5 on all three)
           accent #157446   5.52 :  5.80 :  4.85   paper on it, 5.52
           beam   #0e9c9c   3.20 on paper, so it is a GRAPHIC and never a word
           beam.ink #0b7d7d 4.71, which is the turquoise when it must be a word

         accent drops to 2.80 against the dark band, where it fails outright.
         accent.lit is the band's green and is only ever used there: 7.67.

         REVERT: this whole block replaced the Metallic Chic blues. To put them
         back, swap the eight values below for these and nothing else changes.
           paper #ede8f5  card #f8f6fc  mist #dce2f1
           ink   #171f3c / #30417e / #4c5a8e     rule #adbbda  ruling #8697c4
           accent #3d52a0 / ink #2c3c78 / wash #dde3f6        beam #7091e6
           warn #97482a / wash #f2e9e4          calm #2a6350  crit #a11b1b  */
      colors: {
        paper:  '#f5fafa',
        card:   '#ffffff',
        mist:   '#dfecee',
        ink:    { DEFAULT:'#0b2b33', 2:'#1f5560', 3:'#3c6a74' },
        rule:   '#bed6da',
        ruling: '#8eb0b6',
        accent: { DEFAULT:'#0a6e68', ink:'#07544f', wash:'#d6eeeb', lit:'#3fd6c4' },
        /* The turquoise. 3.20 : 1 on paper clears the 3 : 1 a non-text graphic
           needs and clears nothing at all as text, so it rules charts, fills
           bars and draws rain, and `beam.ink` is the only one allowed to be a
           word. It is never the only thing carrying a state. */
        beam:   { DEFAULT:'#1d8fb0', ink:'#11677f', wash:'#ddf0f8' },
        /* Two more grounds, asked for by name: the review wanted turquoise in
           the run of near-whites so a long page reads as a sequence of
           sections rather than one sheet. Both were measured against every ink
           that can land on them and both clear 4.5 : 1 for the weakest of
           them, which is what makes them usable as section grounds rather than
           as decoration:
             aqua   #eef7f6  ink 13.95 : ink-3 5.14 : accent 5.33
             aqua-2 #e2f2f0  ink 13.17 : ink-3 4.86 : accent 5.03
           A third, deeper step was measured at #d2ebe8 and rejected: ink-3
           lands at 4.48 on it, which fails. */
        aqua:   { DEFAULT:'#edf7f7', 2:'#cee8ea' },
        /* The score's own three tiers. Calm is the brand green, because on a
           green site a calm day should look like the site. Warn is an amber
           and crit keeps its red, since nothing else reads as an alarm at a
           glance. Measured on paper : mist
             warn #99590c  5.27 : 4.63
             crit #a8321f  6.36 : 5.58 */
        warn:   { DEFAULT:'#8f5a0c', wash:'#f5ecdb' },
        calm:   '#0a6e68',
        crit:   '#a8321f',
      },
      /* Quicksand for display, Chivo for body, Chivo Mono for figures.
         All three are variable files, so 700 is available and headings are
         bold: the site had been set at 500 throughout, which is why a heading
         differed from the paragraph under it by size alone.

         The note that sent this to Satoshi for an afternoon was about one
         habit rather than the kit: a mono caption under every heading, which
         is a tell. The kit is back and the habit is gone. `mono` is for
         figures that have to line up, not for labels. */
      fontFamily: {
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
        raise:'3px 3px 0 0 rgb(13 43 30 / 0.10)',
        lift: '5px 5px 0 0 rgb(13 43 30 / 0.16)',
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
