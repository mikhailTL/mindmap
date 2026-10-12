import { DATA } from './assets'

/* What each ring is filled to: that signal's own distance from this person's
   fourteen-day baseline, mapped to 0-100. NOT a share of the overall score,
   and the four do not sum to it — the engine puts four z-scores through a
   logistic, so the centre number is a blend, not an average. The detail panel
   has to keep saying so. */

export const STUDENT_RINGS = [
  { id:'heart', value:64, big:'70', reading:'70 bpm, resting level 64',
    window:'last hour', series: DATA.spark?.hr,
    rows:[
      ['Resting level',        '64 bpm'],
      ['Now',                  '70 bpm'],
      ['Variability',          '60 ms, 1% below normal'],
      ['Breaks it stayed up',  '3 of 4'],
    ],
    note:'Most days it drops back to about 64 within ten minutes of a lesson ending. Today it stayed near 70 through three of those breaks, which is what pushed this ring up.' },
  { id:'sweat', value:58, big:'3.00', reading:'3.00 µS, four responses in ten minutes',
    window:'last hour', series: DATA.spark?.eda,
    rows:[
      ['Resting level',   '2.68 µS'],
      ['Now',             '3.00 µS'],
      ['Responses',       '4 in ten minutes'],
      ['Your usual',      '1 to 2 in ten minutes'],
    ],
    note:'This is the first of the four to move. It rose in third period and has not come back down.' },
  { id:'temp',  value:34, big:'33.5', reading:'33.5 °C, steady all afternoon',
    window:'last hour', series: DATA.spark?.temp,
    rows:[
      ['Now',           '33.5 °C'],
      ['Your usual',    '33.4 to 33.8 °C'],
      ['Change today',  '−0.1 °C'],
    ],
    note:'Inside your normal range all afternoon, so it is adding almost nothing to today’s score.' },
  { id:'move',  value:12, big:'0.01', reading:'0.01 g, sitting still',
    window:'last hour', series: DATA.spark?.mot,
    rows:[
      ['Now',                 '0.01 g'],
      ['Exercise threshold',  '0.35 g'],
      ['Time above it today', 'None'],
    ],
    note:'You were sitting still, so none of the rise above is being explained away as exercise.' },
]

export const PARENT_RINGS = [
  { id:'heart', value:66, big:'72', reading:'72 bpm on school mornings, resting 65',
    window:'this week', series: DATA.spark?.hr,
    rows:[
      ['Resting level',            '65 bpm'],
      ['School-morning average',   '72 bpm'],
      ['Weekend average',          '66 bpm'],
      ['Days above her usual',     '3 of 5'],
    ],
    note:'Monday, Wednesday and Thursday sat above her usual before lunch. Saturday and Sunday did not.' },
  { id:'sweat', value:71, big:'3.40', reading:'3.40 µS, most responses before lunch',
    window:'this week', series: DATA.spark?.eda,
    rows:[
      ['Resting level',        '2.70 µS'],
      ['Week average',         '3.40 µS'],
      ['Busiest stretch',      'Before lunch, three days'],
      ['Quietest stretch',     'Both weekend days'],
    ],
    note:'The clearest of the four this week, and the reason the ring in the middle is where it is.' },
  { id:'temp',  value:40, big:'33.4', reading:'33.4 °C, normal every day',
    window:'this week', series: DATA.spark?.temp,
    rows:[
      ['Week average',  '33.4 °C'],
      ['Her usual',     '33.2 to 33.9 °C'],
      ['Days outside',  'None'],
    ],
    note:'Nothing here suggests illness. Skin temperature stayed inside her own range every day.' },
  { id:'move',  value:28, big:'0.04', reading:'0.04 g, about 5½ hours of still time',
    window:'this week', series: DATA.spark?.mot,
    rows:[
      ['Still time, three nights', 'About 5 h 30'],
      ['Her usual',                'About 8 h'],
      ['Daytime activity',         'Unchanged'],
    ],
    note:'Worked out from movement, not from anything she wrote. The three short nights were the same three days that ran high.' },
]

/* Each signal's day split into the six class periods, against that person's
   own normal band. Drawn by the detail panel. */
const P = ['1st','2nd','3rd','4th','5th','6th']
const bars = (id, vals) => ({ id, bars: P.map((p, i) => ({ label:p, v: vals[i] })) })

export const STUDENT_BARS = Object.fromEntries([
  bars('heart', [41, 48, 78, 66, 61, 58]),
  bars('sweat', [33, 44, 82, 63, 55, 49]),
  bars('temp',  [30, 32, 41, 37, 34, 33]),
  bars('move',  [22, 18, 11,  9, 14, 12]),
].map(b => [b.id, b.bars]))

const W = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const wbars = (id, vals) => [id, W.map((p, i) => ({ label:p, v: vals[i] }))]
export const PARENT_BARS = Object.fromEntries([
  wbars('heart', [71, 52, 74, 76, 55, 44, 46]),
  wbars('sweat', [76, 58, 79, 81, 60, 47, 49]),
  wbars('temp',  [42, 38, 44, 45, 39, 36, 37]),
  wbars('move',  [31, 26, 34, 36, 27, 19, 21]),
])

/* lo/hi is that person's own fourteen-day normal band, on the ring's 0-100
   scale; `now` is where they sit against it. */
export const STUDENT_BAND = {
  heart:{ lo:28, hi:52, now:64 }, sweat:{ lo:24, hi:47, now:58 },
  temp: { lo:26, hi:49, now:34 }, move: { lo:8,  hi:38, now:12 },
}
export const PARENT_BAND = {
  heart:{ lo:30, hi:54, now:66 }, sweat:{ lo:27, hi:50, now:71 },
  temp: { lo:28, hi:51, now:40 }, move: { lo:12, hi:42, now:28 },
}

/* Fixtures hold rows as pairs for readability; the panel wants objects. */
const shape = (r, bars, band, unit) => ({
  ...r,
  rows: r.rows?.map(([label, value]) => ({ label, value })),
  bars: bars[r.id], band: band[r.id], barUnit: unit,
})
export const studentRings = () => STUDENT_RINGS.map(r => shape(r, STUDENT_BARS, STUDENT_BAND, 'class period'))
export const parentRings  = () => PARENT_RINGS.map(r => shape(r, PARENT_BARS, PARENT_BAND, 'day'))
