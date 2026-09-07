/* Vite fingerprints and serves these from /public/photos. */
const P = (n) => `/photos/${n}.jpg`
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
  { k:'family', src:P('family'), alt:"A parent and teenager at the kitchen table", c:'col-span-2 row-span-2' },
  { k:'corridor', src:P('corridor'), alt:"A student in a school corridor", c:'row-span-2' },
  { k:'track', src:P('track'), alt:"A runner catching their breath after practice", c:'' },
  { k:'study', src:P('study'), alt:"A teenager studying in the evening", c:'' },
  { k:'sofa', src:P('sofa'), alt:"A teenager and her mother laughing", c:'row-span-2' },
  { k:'steps', src:P('steps'), alt:"Teenagers together on school steps", c:'col-span-2' },
  { k:'phone', src:P('phone'), alt:"Hands holding a phone", c:'' },
  { k:'dogwalk', src:P('dogwalk'), alt:"A father and son walking the dog", c:'col-span-2' },
  { k:'bright', src:P('bright'), alt:"Two teenagers laughing outdoors", c:'row-span-2' },
  { k:'flatlay', src:P('flatlay'), alt:"The patch, a phone and a notebook", c:'col-span-2' },
  { k:'counselor', src:P('counselor'), alt:"A counselor with a student", c:'' },
  { k:'face-teen', src:P('face-teen'), alt:"A teenager on the walk home", c:'' },
]
