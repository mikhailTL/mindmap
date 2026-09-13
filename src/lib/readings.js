import { DATA } from './assets'

/* What each ring is filled to.

   The value is that signal's own distance from this person's fourteen-day
   baseline, mapped to 0-100. It is NOT a share of the overall score and the
   four do not sum to it — the engine puts four z-scores through a logistic,
   so the middle number is a blend, not an average. The detail panel says so,
   because a judge who adds these up and gets 42 instead of 51 has found a
   contradiction rather than a rounding error. */

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

/* rows arrive as pairs so the fixtures stay readable; the panel wants objects */
const shape = r => ({ ...r, rows: r.rows?.map(([label, value]) => ({ label, value })) })
export const studentRings = () => STUDENT_RINGS.map(shape)
export const parentRings  = () => PARENT_RINGS.map(shape)
