import { MoveMark, PulseMark, SweatMark, TempMark } from '../ui/marks'

/* The four signals the patch reads, and the one colour each owns everywhere it
   appears: the band on the arch, the trace on the patch page, the sparkline in
   its detail panel, the chip in the list.

   These are rainbow hues, in rainbow order — red, orange, green, blue at 0°,
   27°, 120° and 218°. An earlier set drifted to pink-crimson at 336° and a
   gold at 44°, which are not colours in a rainbow; they were picked for
   contrast and it showed.

   Each is used flat, at full strength, for graphics only — no gradient, no
   blur, no partial opacity. Every one clears the 3:1 that non-text graphics
   need against paper:

     heart  #e11919  red      0°   4.70
     sweat  #e86a05  orange  27°   3.15
     temp   #199e19  green  120°   3.44
     move   #1560e0  blue   218°   5.41

   Colour never touches text. Four coloured figures down a list read as four
   statuses, and this red is the reserved crisis red's own hue — so no number,
   label or word on these screens is ever painted a sensor colour. The bar, the
   icon and the dot carry identity; the figure beside them is always ink. */
export const SENSORS = {
  heart: { id:'heart', name:'Heart',       unit:'bpm', icon:PulseMark,       glow:'#e11919',
           short:'Beats, and the gaps between them.',
           about:'Beats, and the gaps between them. Rises with effort and with pressure, so the gaps matter more than the rate.' },
  sweat: { id:'sweat', name:'Sweat',       unit:'µS',  icon:SweatMark,    glow:'#e86a05',
           short:'Too small to feel. Rises when you tense.',
           about:'Changes in skin conductance far too small to feel. It is the fastest of the four to react.' },
  temp:  { id:'temp',  name:'Temperature', unit:'°C',  icon:TempMark, glow:'#199e19',
           short:'Drifts as your body settles.',
           about:'Skin temperature drifts down as blood moves away from the hands under strain, and back up as you settle.' },
  move:  { id:'move',  name:'Movement',    unit:'g',   icon:MoveMark,    glow:'#1560e0',
           short:'Tells still apart from running.',
           about:'Separates a hard run from a hard day. Above 0.35 g the score is held back rather than counted as stress.' },
}
export const SENSOR_ORDER = ['heart','sweat','temp','move']

/* Outer ring first, so the rainbow runs warm to cool from the outside in. */
export const RAINBOW = SENSOR_ORDER.map(id => SENSORS[id])
