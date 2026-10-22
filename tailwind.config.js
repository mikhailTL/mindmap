import plugin from 'tailwindcss/plugin'
import { TYPE_SCALE } from './src/lib/type-scale.js'

export default {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper:  '#f7faf8',
        card:   '#ffffff',
        mist:   '#e3ede7',
        ink:    { DEFAULT:'#0d2b1e', 2:'#2a5744', 3:'#426a58' },
        rule:   '#c2d7ca',
        ruling: '#93b2a1',
        accent: { DEFAULT:'#157446', ink:'#0f5836', wash:'#dcefe4', lit:'#3ecf9a' },
        beam:   { DEFAULT:'#1d8fb0', ink:'#11677f', wash:'#ddf0f8' },
        aqua:   { DEFAULT:'#edf7f7', 2:'#cee8ea' },
        warn:   { DEFAULT:'#99590c', wash:'#f6ecdc' },
        coral:  { DEFAULT:'#f25424', ink:'#b23009', wash:'#ffe8e0' },
        lilac:  { DEFAULT:'#a024f2', ink:'#6f09b2', wash:'#f6e8ff' },
        sun:    { DEFAULT:'#b5871b', ink:'#825d07', wash:'#f5ecd7' },
        mint:   { DEFAULT:'#18a370', ink:'#067049', wash:'#d5f2e8' },
        sky:    { DEFAULT:'#2294e6', ink:'#0967ab', wash:'#def0fc', band:'#d4e9fb' },
        blush:  { DEFAULT:'#f2248b', ink:'#b2095e', wash:'#fce6f1' },
        calm:   '#157446',
        crit:   '#a8321f',
      },
      fontFamily: {
        display: ['Quicksand','-apple-system','system-ui','sans-serif'],
        body:    ['Chivo','-apple-system','system-ui','sans-serif'],
        mono:    ['Chivo','-apple-system','system-ui','sans-serif'],
        code:    ['"Chivo Mono"','ui-monospace','monospace'],
      },
      fontSize: TYPE_SCALE,
      borderRadius: {
        none:'0', panel:'14px', field:'8px', chip:'999px', bar:'999px',
        xs:'4px', sm:'6px', DEFAULT:'8px', lg:'14px',
      },
      boxShadow: {
        card: '0 1px 2px rgb(11 43 51 / 0.04), 0 10px 28px -16px rgb(11 43 51 / 0.14)',
        raise:'0 2px 4px rgb(11 43 51 / 0.05), 0 18px 40px -20px rgb(11 43 51 / 0.22)',
        lift: '0 2px 4px rgb(11 43 51 / 0.05), 0 18px 40px -20px rgb(11 43 51 / 0.22)',
      },
      maxWidth: { measure:'62ch', read:'44ch' },
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
  plugins: [
    plugin(({ addVariant }) => {
      addVariant('hoverOnly', '@media (hover: hover) and (pointer: fine) { &:hover }')
      addVariant('groupHoverOnly',
        '@media (hover: hover) and (pointer: fine) { :merge(.group):hover & }')
    }),
  ],
}
