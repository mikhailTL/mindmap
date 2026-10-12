import { MoveMark, PulseMark, SweatMark, TempMark } from '../ui/marks'

/* The four patch signals and the one colour each owns on every surface. Used
   flat at full strength, graphics only — no gradient, blur or partial opacity.
   Contrast against paper, all clearing the 3:1 non-text graphics minimum:

     heart  #e11919  red      0°   4.70
     sweat  #e86a05  orange  27°   3.15
     temp   #199e19  green  120°   3.44
     move   #1560e0  blue   218°   5.41

   Colour never touches text: a coloured figure reads as a status, and heart
   red shares the reserved crisis red's hue. Bar, icon and dot carry identity;
   the figure beside them is always ink. */
export const SENSORS = {
  heart: { id:'heart', name:'Heart',       unit:'bpm', icon:PulseMark,       glow:'#e11919',
           short:'How fast it beats, and how steady the beat is.',
           about:'How fast your heart beats, and how even the time between beats is. The rate rises with exercise and with pressure alike, so the evenness is what tells them apart: under stress the gaps between beats get more regular.' },
  sweat: { id:'sweat', name:'Sweat',       unit:'µS',  icon:SweatMark,    glow:'#e86a05',
           short:'Sweat you cannot feel. Rises first when you tense.',
           about:'Changes in skin conductance far too small to feel. It is the fastest of the four to react.' },
  temp:  { id:'temp',  name:'Temperature', unit:'°C',  icon:TempMark, glow:'#199e19',
           short:'Skin cools under strain, warms as you settle.',
           about:'Skin temperature drifts down as blood moves away from the hands under strain, and back up as you settle.' },
  move:  { id:'move',  name:'Movement',    unit:'g',   icon:MoveMark,    glow:'#1560e0',
           short:'Separates a hard run from a hard day.',
           about:'Separates a hard run from a hard day. Above 0.35 g the score is held back rather than counted as stress.' },
}
export const SENSOR_ORDER = ['heart','sweat','temp','move']

/* Outer ring first, so the rainbow runs warm to cool from the outside in. */
export const RAINBOW = SENSOR_ORDER.map(id => SENSORS[id])
