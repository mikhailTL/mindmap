/* Vite fingerprints and serves these from /public/photos. */
const P = (n) => `/photos/${n}.jpg`
export const POS = {
  "hero": "50% 28%",
  "steps": "50% 42%",
  "quiet": "50% 32%",
  "bright": "50% 26%",
  "phone": "50% 50%",
  "teen": "50% 26%",
  "family": "50% 38%",
  "pro": "50% 32%"
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
  { k:'family', src:P('family'), pos:'50% 38%', alt:"A parent and teenager at the kitchen table", c:'col-span-2 row-span-2' },
  { k:'corridor', src:P('corridor'), pos:'50% 30%', alt:"A student in a school corridor", c:'row-span-2' },
  { k:'track', src:P('track'), pos:'50% 45%', alt:"A runner catching their breath after practice", c:'' },
  { k:'study', src:P('study'), pos:'50% 32%', alt:"A teenager studying in the evening", c:'' },
  { k:'sofa', src:P('sofa'), pos:'50% 34%', alt:"A teenager and her mother laughing", c:'row-span-2' },
  { k:'steps', src:P('steps'), pos:'50% 42%', alt:"Teenagers together on school steps", c:'col-span-2' },
  { k:'phone', src:P('phone'), pos:'50% 50%', alt:"Hands holding a phone", c:'' },
  { k:'dogwalk', src:P('dogwalk'), pos:'50% 46%', alt:"A father and son walking the dog", c:'col-span-2' },
  { k:'bright', src:P('bright'), pos:'50% 26%', alt:"Two teenagers laughing outdoors", c:'row-span-2' },
  { k:'flatlay', src:P('flatlay'), pos:'50% 50%', alt:"The patch, a phone and a notebook", c:'col-span-2' },
  { k:'counselor', src:P('counselor'), pos:'50% 32%', alt:"A counselor with a student", c:'' },
  { k:'face-teen', src:P('face-teen'), pos:'50% 26%', alt:"A teenager on the walk home", c:'' },
]
