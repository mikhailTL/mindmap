/* Every picture an account can choose, as data. No JSX, so the store can
 * read the ids without pulling in the drawings. ./avatars.jsx draws them.
 *
 * Four groups. The twelve animals are the original set and keep their ids,
 * so an account made before this list grew still shows its picture. The
 * rest are new ids with a prefix that says how each is drawn:
 *   sym-*   a neutral shape or sign, drawn here as one SVG path set
 *   face-*  an emoji style face, drawn here
 *   emo-*   an object or plant, set in the system emoji font
 *   pat-*   a pattern, generated from its id, so it is the same every time
 *   char-*  a drawn person from ./characters/specs.js: the demo's teens,
 *           parents and Counselors/Professionals
 *   emblem-* a sign a parent or a Counselor/Professional can pick
 */

import { CHARACTERS, EMBLEMS, ROLE_PICKS } from './characters/specs.js'

/* Animals first: the owner, 18 October, "kids should be the animal and fun
   ones". These drawings are the teen's set; parents and
   Counselors/Professionals get initials, a photo or ROLE_PICKS (see below). */
export const GROUPS = [
  { id: 'animals',  label: 'Animals' },
  { id: 'people',   label: 'People' },
  { id: 'faces',    label: 'Faces and things' },
  { id: 'shapes',   label: 'Shapes and signs' },
  { id: 'patterns', label: 'Patterns' },
]

export const HUES = ['coral', 'sun', 'mint', 'sky', 'lilac', 'blush']

export const ANIMALS = [
  'fox', 'owl', 'panda', 'frog', 'cat', 'bear',
  'koala', 'penguin', 'bunny', 'whale', 'hedgehog', 'sloth',
]

/* Neutral shapes and signs. Nothing religious, political or national. */
const SYMBOLS = [
  'circle', 'square', 'triangle', 'diamond', 'hexagon', 'star',
  'sparkle', 'heart', 'moon', 'sun', 'cloud', 'bolt',
  'leaf', 'drop', 'wave', 'mountain', 'spiral', 'infinity',
  'plus', 'target', 'arrow', 'note', 'flower', 'snowflake',
  'planet', 'peace', 'anchor', 'atom', 'asterisk', 'bars',
]

/* Faces are friendly or neutral. No crying, angry or sick face: a picture
   you see every time you open a stress app should not be one of those. */
const FACES = [
  'smile', 'grin', 'cool', 'wink', 'starry', 'calm',
  'tongue', 'glasses', 'robot', 'alien', 'ghost', 'neutral',
]

const EMOJI = [
  ['rocket', '🚀'], ['headphones', '🎧'], ['game', '🎮'], ['palette', '🎨'],
  ['books', '📚'], ['soccer', '⚽'], ['basketball', '🏀'], ['guitar', '🎸'],
  ['skateboard', '🛹'], ['dice', '🎲'], ['puzzle', '🧩'], ['gem', '💎'],
  ['saturn', '🪐'], ['rainbow', '🌈'], ['wave', '🌊'], ['clover', '🍀'],
  ['blossom', '🌸'], ['cactus', '🌵'], ['pizza', '🍕'], ['donut', '🍩'],
  ['strawberry', '🍓'], ['avocado', '🥑'], ['unicorn', '🦄'], ['octopus', '🐙'],
]

/* Nine generated designs in four colour pairs. */
export const PATTERNS = ['stripes', 'dots', 'checks', 'waves', 'rings', 'sunburst', 'zigzag', 'confetti', 'blocks']
export const PAIRS = {
  ember:  ['coral', 'sun'],
  lagoon: ['sky', 'mint'],
  dusk:   ['lilac', 'blush'],
  forest: ['mint', 'sun'],
}

const cap = s => s.charAt(0).toUpperCase() + s.slice(1)
const LABEL_FIX = { tongue: 'Silly face', calm: 'Calm face', starry: 'Star eyes', glasses: 'Glasses',
  cool: 'Sunglasses', neutral: 'Plain face', smile: 'Smile', grin: 'Grin', wink: 'Wink',
  robot: 'Robot', alien: 'Alien', ghost: 'Ghost', bars: 'Bars', note: 'Music note',
  target: 'Target', game: 'Game controller', gem: 'Gem', saturn: 'Ringed planet' }
const label = s => LABEL_FIX[s] || cap(s)

const hueAt = i => HUES[i % HUES.length]
/* Faces skip sun: on a face, the token reads as mud rather than as yellow. */
const FACE_HUES = ['coral', 'mint', 'sky', 'lilac', 'blush']

export const CATALOG = [
  ...SYMBOLS.map((s, i) => ({ id: 'sym-' + s, group: 'shapes', kind: 'sym', key: s, hue: hueAt(i), label: label(s) })),
  ...FACES.map((s, i) => ({ id: 'face-' + s, group: 'faces', kind: 'face', key: s, hue: FACE_HUES[i % FACE_HUES.length], label: label(s) })),
  ...EMOJI.map(([s, ch], i) => ({ id: 'emo-' + s, group: 'faces', kind: 'emo', key: s, char: ch, hue: hueAt(i + 3),
    label: s === 'wave' ? 'Ocean wave' : label(s) })),
  ...PATTERNS.flatMap(p => Object.keys(PAIRS).map(pair => ({
    id: `pat-${p}-${pair}`, group: 'patterns', kind: 'pat', key: p, pair, label: `${cap(pair)} ${p}`,
  }))),
  ...ANIMALS.map(s => ({ id: s, group: 'animals', kind: 'animal', key: s, label: cap(s) })),
  /* The characters. Only the teens marked `pick` are on a teen's picker; the
     rest have no group and are drawn for the demo's people. */
  ...CHARACTERS.map(c => ({ ...c, id: 'char-' + c.key, group: c.pick ? 'people' : null, kind: 'char' })),
  ...EMBLEMS.map(e => ({ ...e, id: 'emblem-' + e.key, group: null, kind: 'emblem' })),
]

export const AVATAR_ALL_IDS = CATALOG.map(c => c.id)

const BY_ID = new Map(CATALOG.map(c => [c.id, c]))
export const avatarEntry = id => BY_ID.get(id) || null

/* Words a search box matches: the label, the group, and the drawing's key. */
export const avatarWords = c =>
  [c.label, c.key, c.pair || '', c.hue || '', GROUPS.find(g => g.id === c.group)?.label || ''].join(' ').toLowerCase()

/* Uploaded photos. The owner, 18 October: "parents should use either letter
   avatars or uploaded pictures, and counselors should use uploaded
   professional images". A photo is cropped square and shrunk on the device
   (src/account/ui.jsx), then kept as a small data URL. A teen's account never
   holds one: teens pick from the drawings above. */
export const PHOTO_MAX = 60000
const PHOTO_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/
export const isPhotoAvatar = v => typeof v === 'string' && v.length <= PHOTO_MAX && PHOTO_RE.test(v)

/* The drawings a parent or a Counselor/Professional can pick besides a
   photo: a sign and a character (owner, 18 October: a tree for a parent, a
   Counselor fitting symbol). */
export { ROLE_PICKS }

/* Whether a picture suits a role: a teen any drawing on their picker, an
   adult a photo or one of their role's picks. */
export const fitsRole = (role, v) => (role === 'student'
  ? !!avatarEntry(v)?.group
  : isPhotoAvatar(v) || (ROLE_PICKS[role] || []).includes(v))

/* Initials for a letter avatar: the first letters of the first and last
   words, a title such as Dr. or Ms. left out. "Dr. Shah" is S, "Rosa Diaz"
   is RD. */
const TITLE = /^(dr|mr|mrs|ms|mx|prof)\.?$/i
export function initialsOf(name) {
  const words = String(name || '').trim().split(/\s+/).filter(w => w && !TITLE.test(w))
  if (!words.length) return ''
  const first = words[0].charAt(0), last = words.length > 1 ? words[words.length - 1].charAt(0) : ''
  return (first + last).toUpperCase()
}
