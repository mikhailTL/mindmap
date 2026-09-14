/* Vite fingerprints and serves these from /public/photos. */
const P = (n) => `/photos/${n}.jpg`
/* Where the subject actually is in each frame, read off the photographs
   rather than guessed. The old values were all near 50% horizontally, which is
   where nobody in these pictures stands: `steps` at 42% vertical cropped four
   faces out of the top, `quiet`'s subject sits at 80% across, `bright`'s at
   24%. With object-fit: cover, this point is what survives every crop. */
export const POS = {
  "hero":   "52% 26%",   // her face, upper-centre
  "steps":  "50% 22%",   // the row of faces, not the steps
  "quiet":  "80% 40%",   // seated figure, far right
  "bright": "24% 18%",   // laughing face, upper left
  "phone":  "45% 48%",   // the hands and the screen
  "teen":   "50% 32%",
  "family": "55% 28%",   // between the two faces
  "pro":    "42% 30%"    // between counselor and student
}
export const IMAGES = {
  hero: P('hero'),
  steps: P('steps'),
  quiet: P('quiet'),
  bright: P('bright'),
  phone: P('phone'),
  teen: P('face-teen'),
  family: P('family'),
  pro: P('counselor'),
  appStudent: P('app-student'),
  appParent: P('app-parent'),
  appPro: P('app-counselor'),
}
export const MOSAIC_LIST = [
  { k:'family', src:P('family'), pos:'55% 28%', alt:"A parent and teenager at the kitchen table", c:'col-span-2 row-span-2' },
  { k:'corridor', src:P('corridor'), pos:'48% 14%', alt:"A student in a school corridor", c:'row-span-2' },
  { k:'track', src:P('track'), pos:'70% 45%', alt:"A runner catching their breath after practice", c:'' },
  { k:'study', src:P('study'), pos:'50% 20%', alt:"A teenager studying in the evening", c:'' },
  { k:'sofa', src:P('sofa'), pos:'45% 18%', alt:"A teenager and her mother laughing", c:'row-span-2' },
  { k:'steps', src:P('steps'), pos:'50% 22%', alt:"Teenagers together on school steps", c:'col-span-2' },
  { k:'phone', src:P('phone'), pos:'45% 48%', alt:"Hands holding a phone", c:'' },
  { k:'dogwalk', src:P('dogwalk'), pos:'55% 30%', alt:"A father and son walking the dog", c:'col-span-2' },
  { k:'bright', src:P('bright'), pos:'24% 18%', alt:"Two teenagers laughing outdoors", c:'row-span-2' },
  { k:'flatlay', src:P('flatlay'), pos:'50% 50%', alt:"The patch, a phone and a notebook", c:'col-span-2' },
  { k:'counselor', src:P('counselor'), pos:'42% 30%', alt:"A counselor with a student", c:'' },
  { k:'face-teen', src:P('face-teen'), pos:'50% 32%', alt:"A teenager on the walk home", c:'' },
]
