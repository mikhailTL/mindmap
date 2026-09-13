import { Heart, Droplets, Thermometer, Activity } from 'lucide-react'

/* The four signals the patch reads, and the one colour each owns everywhere it
   appears: the band on the arch, the trace on the patch page, the sparkline in
   its detail panel, the chip in the list.

   `glow` is the only colour each sensor has, and it is used flat at full
   strength for every graphic — no gradient, no blur, no partial opacity. It
   clears the 3:1 that non-text graphics need.

   Neither is used for text. Four differently-coloured numbers down a list read
   as four different statuses, and the deep amber is close enough to warn
   #9a4a18 to be misread as "out of range". Every number on these screens is
   ink; the dot and the icon beside it carry the identity.

     heart  #f50f6b  336°  3.96 on paper
     sweat  #e8590c   21°  3.49
     temp   #1d9c4b  142°  3.46
     move   #2f6bf0  221°  4.56

   Hues sit 45° or more apart, and the previous amber (#8a6500, hue 44) is gone
   — at that value and hue it read as brown rather than as a colour in a
   rainbow. */
export const SENSORS = {
  heart: { id:'heart', name:'Heart',       unit:'bpm', icon:Heart,       glow:'#f50f6b',
           short:'Beats, and the gaps between them.',
           about:'Beats, and the gaps between them. Rises with effort and with pressure, so the gaps matter more than the rate.' },
  sweat: { id:'sweat', name:'Sweat',       unit:'µS',  icon:Droplets,    glow:'#e8590c',
           short:'Too small to feel. Rises when you tense.',
           about:'Changes in skin conductance far too small to feel. It is the fastest of the four to react.' },
  temp:  { id:'temp',  name:'Temperature', unit:'°C',  icon:Thermometer, glow:'#1d9c4b',
           short:'Drifts as your body settles.',
           about:'Skin temperature drifts down as blood moves away from the hands under strain, and back up as you settle.' },
  move:  { id:'move',  name:'Movement',    unit:'g',   icon:Activity,    glow:'#2f6bf0',
           short:'Tells still apart from running.',
           about:'Separates a hard run from a hard day. Above 0.35 g the score is held back rather than counted as stress.' },
}
export const SENSOR_ORDER = ['heart','sweat','temp','move']

/* Outer ring first, so the rainbow runs warm to cool from the outside in. */
export const RAINBOW = SENSOR_ORDER.map(id => SENSORS[id])
