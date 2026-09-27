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
        paper:  '#f7faf8',
        card:   '#ffffff',
        mist:   '#e3ede7',
        ink:    { DEFAULT:'#0d2b1e', 2:'#2a5744', 3:'#47705e' },
        rule:   '#c2d7ca',
        ruling: '#93b2a1',
        accent: { DEFAULT:'#157446', ink:'#0f5836', wash:'#dcefe4', lit:'#3ecf9a' },
        /* The turquoise. 3.20 : 1 on paper clears the 3 : 1 a non-text graphic
           needs and clears nothing at all as text, so it rules charts, fills
           bars and draws rain, and `beam.ink` is the only one allowed to be a
           word. It is never the only thing carrying a state. */
        beam:   { DEFAULT:'#0e9c9c', ink:'#0b7d7d', wash:'#d9f0ef' },
        /* The score's own three tiers. Calm is the brand green, because on a
           green site a calm day should look like the site. Warn is an amber
           and crit keeps its red, since nothing else reads as an alarm at a
           glance. Measured on paper : mist
             warn #99590c  5.27 : 4.63
             crit #a8321f  6.36 : 5.58 */
        warn:   { DEFAULT:'#99590c', wash:'#f6ecdc' },
        calm:   '#157446',
        crit:   '#a8321f',
      },
      fontFamily: {
        /* Quicksand is a geometric sans with round terminals. It is a
           variable face on a 300-to-700 weight axis, and 700 is now loaded,
           because the review said headings were blending into the paragraphs
           under them. They were: the whole site was set at 500, so a heading
           differed from body text by size alone. Headings are 700 now.
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
