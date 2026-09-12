import { TYPE_SCALE } from './src/lib/type-scale.js'

/** Tokens derived from the product, not from a palette generator.
 *  Clinical vernacular: red is reserved for critical and is unavailable as a
 *  brand accent; amber means out-of-range. */
export default {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper:  '#fcfcfb',
        sage:   '#e7efeb',
        /* 3 measured 5.32:1 on paper and 4.66:1 on sage — the previous #6c8380 failed AA at 3.94 */
        ink:    { DEFAULT:'#0d2b27', 2:'#3f5754', 3:'#576e6b' },
        rule:   '#dde5e2',
        accent: { DEFAULT:'#0f6b62', ink:'#0a4a44', wash:'#e8f1ef' },
        warn:   { DEFAULT:'#9a4a18', wash:'#f7ede6' },
        calm:   '#2f6d4f',
        crit:   '#a11b1b',
      },
      fontFamily: {
        display: ['"Schibsted Grotesk"','-apple-system','system-ui','sans-serif'],
        body:    ['Newsreader','Georgia','serif'],
        mono:    ['"JetBrains Mono"','ui-monospace','monospace'],
      },
      /* nine steps because the content has nine levels of meaning */
      fontSize: TYPE_SCALE,
      borderRadius: { xs:'2px', sm:'3px', DEFAULT:'4px', lg:'6px' },
      boxShadow: {
        /* two layers, one light source */
        raise:'0 1px 2px -1px rgb(13 43 39 / 0.10), 0 12px 28px -18px rgb(13 43 39 / 0.35)',
        lift: '0 2px 4px -2px rgb(13 43 39 / 0.12), 0 26px 56px -30px rgb(13 43 39 / 0.45)',
      },
      maxWidth: { measure:'62ch', read:'44ch' },
      transitionTimingFunction: { out:'cubic-bezier(0.2,0.7,0.3,1)' },
      keyframes: {
        down:{ from:{height:'0'}, to:{height:'var(--radix-collapsible-content-height)'} },
        up:  { from:{height:'var(--radix-collapsible-content-height)'}, to:{height:'0'} },
      },
      animation: { down:'down .28s cubic-bezier(0.2,0.7,0.3,1)', up:'up .22s cubic-bezier(0.2,0.7,0.3,1)' },
    },
  },
}
