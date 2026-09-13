import { Heart, Droplets, Thermometer, Activity } from 'lucide-react'

/* The four signals the patch reads, and the one colour each owns everywhere it
   appears: the rings on the dashboard, the trace on the patch page, the
   sparkline in its detail panel.

   Why these four hues and not a literal spectrum. The product already spends
   colour on meaning — crit #a11b1b is reserved for a crisis, warn #9a4a18 for
   out of range, calm and accent for good and neutral. A sensor colour that
   landed on one of those would read as a status, so each of these sits at
   least 20° of hue away from the nearest reserved colour and all four clear
   4.5:1 on paper and 4.0:1 on sage:

     heart  #bc2a5c  339°  5.64 : 4.95
     sweat  #8a6500   44°  5.19 : 4.55
     temp   #3f7a2e  107°  5.07 : 4.45
     move   #3a55a8  225°  6.72 : 5.89

   Each sensor carries two values of its hue, because text and graphics are
   judged against different thresholds. `ink` is the deep one and is the only
   one allowed to carry words — it clears 4.5:1 on paper. `glow` is the vivid
   one the bands, traces and chips are drawn in; graphics need 3:1, so it can
   be far more saturated:

     heart  #f5175f  3.96    sweat  #c88400  3.03
     temp   #1d9c4b  3.46    move   #2f6bf0  4.56

   Amber is the one that cannot go brighter — #c88400 is already at the 3:1
   floor against paper and sits at 2.66 against the sage track, so the bands
   carry a paper hairline between them and every row states its name and
   number. Colour is never the only carrier.

   Colour never carries a reading on its own here either — every ring has a
   name, an icon and a number beside it. */
export const SENSORS = {
  heart: { id:'heart', name:'Heart',       unit:'bpm', icon:Heart,       color:'#bc2a5c', glow:'#f5175f',
           short:'Beats, and the gaps between them.',
           about:'Beats, and the gaps between them. Rises with effort and with pressure, so the gaps matter more than the rate.' },
  sweat: { id:'sweat', name:'Sweat',       unit:'µS',  icon:Droplets,    color:'#8a6500', glow:'#c88400',
           short:'Too small to feel. Rises when you tense.',
           about:'Changes in skin conductance far too small to feel. It is the fastest of the four to react.' },
  temp:  { id:'temp',  name:'Temperature', unit:'°C',  icon:Thermometer, color:'#3f7a2e', glow:'#1d9c4b',
           short:'Drifts as your body settles.',
           about:'Skin temperature drifts down as blood moves away from the hands under strain, and back up as you settle.' },
  move:  { id:'move',  name:'Movement',    unit:'g',   icon:Activity,    color:'#3a55a8', glow:'#2f6bf0',
           short:'Tells still apart from running.',
           about:'Separates a hard run from a hard day. Above 0.35 g the score is held back rather than counted as stress.' },
}
export const SENSOR_ORDER = ['heart','sweat','temp','move']

/* Outer ring first, so the rainbow runs warm to cool from the outside in. */
export const RAINBOW = SENSOR_ORDER.map(id => SENSORS[id])
