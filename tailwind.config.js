import plugin from 'tailwindcss/plugin'
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
           ink-3  #426a58   5.33 :  5.61 :  4.68   (clears 4.5 on all three)
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
        ink:    { DEFAULT:'#0d2b1e', 2:'#2a5744', 3:'#426a58' },
        rule:   '#c2d7ca',
        ruling: '#93b2a1',
        accent: { DEFAULT:'#157446', ink:'#0f5836', wash:'#dcefe4', lit:'#3ecf9a' },
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
        warn:   { DEFAULT:'#99590c', wash:'#f6ecdc' },
        /* Six hues the product can be cheerful in. The teal above is the brand
           and stays the brand; these exist because an app a teenager opens
           every day cannot be one colour, and because a dashboard whose tiles
           are all the same tint reads as a spreadsheet.

           Each hue is three tokens with one job each, and the jobs do not swap:
             DEFAULT  a graphic only, never a word. Clears 3 : 1 on paper, the
                      floor a non-text graphic owes.
             ink      the only one allowed to be text. Clears 4.5 : 1 on paper,
                      on card, and on its own wash, so a coloured label can sit
                      on its own tile.
             wash     a ground. ink, ink-2 and the hue's own ink all clear
                      4.5 : 1 on it.
           Measured, ink on paper : ink on its own wash
             coral 6.01 : 5.38   lilac 8.46 : 7.59   sun   5.67 : 5.08
             mint  5.83 : 5.17   sky   5.63 : 5.08   blush 6.44 : 5.73
           Generated and checked by the script in tools/brand; rerun it before
           changing any value here. Colour still never carries a state on its
           own: a tile that means something also says so in words. */
        coral:  { DEFAULT:'#f25424', ink:'#b23009', wash:'#ffe8e0' },
        lilac:  { DEFAULT:'#a024f2', ink:'#6f09b2', wash:'#f6e8ff' },
        sun:    { DEFAULT:'#b5871b', ink:'#825d07', wash:'#f5ecd7' },
        mint:   { DEFAULT:'#18a370', ink:'#067049', wash:'#d5f2e8' },
        sky:    { DEFAULT:'#2294e6', ink:'#0967ab', wash:'#def0fc', band:'#d4e9fb' },
        blush:  { DEFAULT:'#f2248b', ink:'#b2095e', wash:'#fce6f1' },
        calm:   '#157446',
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
        /* `mono` is the body face, not a typewriter one. It is kept as a name
           because ~200 call sites use it to mean "a figure that has to line up
           with the figure above it", and `tabular-nums` is what actually does
           that: Chivo's lining figures are fixed-width under that feature. A
           monospaced face on a display number reads as a generated page, which
           is the one thing this site cannot afford to look like.
           `code` is the real monospace, for file paths and literal code. */
        mono:    ['Chivo','-apple-system','system-ui','sans-serif'],
        code:    ['"Chivo Mono"','ui-monospace','monospace'],
      },
      /* nine steps because the content has nine levels of meaning */
      fontSize: TYPE_SCALE,
      /* Radius by role, not by taste: a containing surface, a field, and the
         things that are physically round. Quicksand's terminals are round and
         the palette is a soft one, so the 0px panel the old green system used
         now reads as an oversight rather than as rigour. */
      borderRadius: {
        none:'0', panel:'14px', field:'8px', chip:'999px', bar:'999px',
        xs:'4px', sm:'6px', DEFAULT:'8px', lg:'14px',
      },
      /* Depth is one mechanism here: the surface shifts and a rule thickens.
         These two are the hard offset a card gets from the sheet under it —
         no blur, no spread, no light source to be inconsistent about, no glow. */
      boxShadow: {
        /* Soft and layered, one light source from above: the hard 3px offset
           these replaced read as a sticker. `card` is every resting surface,
           `raise` a hovered or lifted one. */
        card: '0 1px 2px rgb(11 43 51 / 0.04), 0 10px 28px -16px rgb(11 43 51 / 0.14)',
        raise:'0 2px 4px rgb(11 43 51 / 0.05), 0 18px 40px -20px rgb(11 43 51 / 0.22)',
        lift: '0 2px 4px rgb(11 43 51 / 0.05), 0 18px 40px -20px rgb(11 43 51 / 0.22)',
      },
      maxWidth: { measure:'62ch', read:'44ch' },
      /* `out` is the house curve and predates the rest; it is left alone
         because every existing `ease-out` in the codebase is timed against it.
         The two added beside it are the stronger curves a deliberate animation
         needs: the built-in CSS easings are too weak to read as intentional at
         150 to 250ms. `quint` enters and exits, `quart` moves and morphs.
         Nothing in this project is allowed an ease-in: it holds still through
         the exact moment the eye is on it. */
      transitionTimingFunction: {
        out:'cubic-bezier(0.2,0.7,0.3,1)',
        quint:'cubic-bezier(0.23,1,0.32,1)',
        quart:'cubic-bezier(0.77,0,0.175,1)',
      },
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
  /* A tap on a touch screen fires a hover, and it STICKS: the row a reader
     last touched stays lit until they touch another one, which reads as a
     selection they did not make. Every hover on this site therefore goes
     behind a fine pointer. `hoverOnly:` and `groupHoverOnly:` are drop-in
     replacements for `hover:` and `group-hover:` and exist so that is one
     word at the call site rather than a 40-character arbitrary variant
     nobody will remember to type. */
  plugins: [
    plugin(({ addVariant }) => {
      addVariant('hoverOnly', '@media (hover: hover) and (pointer: fine) { &:hover }')
      addVariant('groupHoverOnly',
        '@media (hover: hover) and (pointer: fine) { :merge(.group):hover & }')
    }),
  ],
}
