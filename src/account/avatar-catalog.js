// Avatar choices as data with no JSX, so the store and server can read the ids. Animals keep bare ids;
// the rest are prefixed sym-, face-, emo-, pat-, char- or emblem- by how they are drawn.
import { CHARACTERS, EMBLEMS, ROLE_PICKS } from './characters/specs.js'

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

const SYMBOLS = [
  'circle', 'square', 'triangle', 'diamond', 'hexagon', 'star',
  'sparkle', 'heart', 'moon', 'sun', 'cloud', 'bolt',
  'leaf', 'drop', 'wave', 'mountain', 'spiral', 'infinity',
  'plus', 'target', 'arrow', 'note', 'flower', 'snowflake',
  'planet', 'peace', 'anchor', 'atom', 'asterisk', 'bars',
]

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
  ...CHARACTERS.map(c => ({ ...c, id: 'char-' + c.key, group: c.pick ? 'people' : null, kind: 'char' })),
  ...EMBLEMS.map(e => ({ ...e, id: 'emblem-' + e.key, group: null, kind: 'emblem' })),
]

export const AVATAR_ALL_IDS = CATALOG.map(c => c.id)

const BY_ID = new Map(CATALOG.map(c => [c.id, c]))
export const avatarEntry = id => BY_ID.get(id) || null

export const avatarWords = c =>
  [c.label, c.key, c.pair || '', c.hue || '', GROUPS.find(g => g.id === c.group)?.label || ''].join(' ').toLowerCase()

// Uploaded photos are kept as small data URLs; this is the maximum length in characters.
export const PHOTO_MAX = 60000
const PHOTO_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/
export const isPhotoAvatar = v => typeof v === 'string' && v.length <= PHOTO_MAX && PHOTO_RE.test(v)

export { ROLE_PICKS }

export const fitsRole = (role, v) => (role === 'student'
  ? !!avatarEntry(v)?.group
  : isPhotoAvatar(v) || (ROLE_PICKS[role] || []).includes(v))

// Initials come from the first and last words, skipping a title: "Dr. Shah" is S, "Rosa Diaz" is RD.
const TITLE = /^(dr|mr|mrs|ms|mx|prof)\.?$/i
export function initialsOf(name) {
  const words = String(name || '').trim().split(/\s+/).filter(w => w && !TITLE.test(w))
  if (!words.length) return ''
  const first = words[0].charAt(0), last = words.length > 1 ? words[words.length - 1].charAt(0) : ''
  return (first + last).toUpperCase()
}
