import { MoveMark, PulseMark, SweatMark, TempMark } from '../ui/marks'

// Each patch signal's colour; all clear 3:1 graphics contrast on paper and stay off text, since heart red shares the crisis hue.
export const SENSORS = {
  heart: { id:'heart', name:'Heart',       unit:'bpm', icon:PulseMark,       glow:'#e11919',
           short:'Your heart rate, and how even the beats are.',
           about:'How fast your heart beats, and how even the time between beats is. The rate rises with exercise and with pressure alike, so the evenness is what tells them apart: under stress the gaps between beats get more regular.' },
  sweat: { id:'sweat', name:'Sweat',       unit:'µS',  icon:SweatMark,    glow:'#e86a05',
           short:'Small changes in skin sweat, too small to feel.',
           about:'Changes in skin conductance far too small to feel. It is the fastest of the four to react.' },
  temp:  { id:'temp',  name:'Temperature', unit:'°C',  icon:TempMark, glow:'#199e19',
           short:'Your skin temperature, which drops a little under stress.',
           about:'Skin temperature drifts down as blood moves away from the hands under strain, and back up as you settle.' },
  move:  { id:'move',  name:'Movement',    unit:'g',   icon:MoveMark,    glow:'#1560e0',
           short:'How much you move, so exercise is not read as stress.',
           about:'How much you move. Above 0.35 g the score is held back rather than counted as stress.' },
}
export const SENSOR_ORDER = ['heart','sweat','temp','move']

export const RAINBOW = SENSOR_ORDER.map(id => SENSORS[id])
