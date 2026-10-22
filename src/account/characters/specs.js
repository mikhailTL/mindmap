// Demo characters as data with no JSX, so the catalog and the server can read the ids. All names are invented.
export const SKIN = {
  s1: ['#F8DCCB', '#E8B9A0'],
  s2: ['#F1C9A5', '#DCA580'],
  s3: ['#E3B08A', '#C98E68'],
  s4: ['#CF956C', '#B27650'],
  s5: ['#AE7550', '#935F3D'],
  s6: ['#8C5838', '#74452A'],
  s7: ['#6B4029', '#55321F'],
}

export const HAIR = {
  black: '#221B1E', espresso: '#36241A', brown: '#5B3A24', chestnut: '#7B4A2B',
  auburn: '#8E4024', honey: '#B98543', blonde: '#D5AE62', ash: '#8C8178',
}

export const CLOTH = {
  coral: '#F0764E', sun: '#E4B04A', mint: '#2FA97C', sky: '#4A9FE6', lilac: '#9A6BDF',
  blush: '#E9689F', navy: '#2D4673', charcoal: '#3E4452', teal: '#1E8C99', forest: '#24724F',
  plum: '#7A3E6E', denim: '#5677A6', cream: '#F3EBDD', white: '#FBFBFD', shirt: '#D9E8F7',
  green: '#1F8A5B',
}

// Extras codes: g glasses, e earrings, f freckles, b beard, l lanyard, n necklace, w lashes.
// pick marks the teens shown on a teen's own avatar picker.
const T = (key, label, skin, hair, hc, top, tc, bg, x = '', pick = false) =>
  ({ key, label, role: 'student', age: 't', skin, hair, hc, top, tc, bg, x, pick })
const A = (key, label, role, skin, hair, hc, top, tc, bg, x = '', extra = {}) =>
  ({ key, label, role, age: 'a', skin, hair, hc, top, tc, bg, x, ...extra })

export const CHARACTERS = [
  /* Maya Reyes and her brother Leo, the demo family. */
  T('maya',  'Long hair',     's4', 'long',     'espresso', 'hoodie',  'coral', 'coral', 'we', true),
  T('leo',   'Short hair',    's4', 'short',    'black',    'hoodie',  'sky',   'sky',   '',   true),
  T('zoe',   'Two puffs',     's7', 'puffs',    'black',    'tee',     'sun',   'sun',   'we', true),
  T('kai',   'Swept fringe',  's2', 'mop',      'black',    'hoodie',  'charcoal', 'lilac', '', true),
  T('sana',  'Side braid',    's5', 'braid',    'black',    'sweater', 'mint',  'mint',  'we', true),
  T('theo',  'Curls',         's1', 'curly',    'auburn',   'tee',     'sky',   'blush', 'f',  true),
  T('noah',  'Glasses',       's6', 'coily',    'black',    'hoodie',  'navy',  'sky',   'g',  true),
  T('ava',   'Ponytail',      's1', 'ponytail', 'honey',    'tee',     'mint',  'mint',  'wf', true),
  /* The rest of the demo caseload, each a different picture. */
  T('mia',   'Mia',   's3', 'bob',      'espresso', 'tee',     'lilac',    'lilac'),
  T('ethan', 'Ethan', 's2', 'short',    'chestnut', 'hoodie',  'sun',      'sun'),
  T('liam',  'Liam',  's1', 'mop',      'blonde',   'hoodie',  'mint',     'mint'),
  T('isla',  'Isla',  's2', 'long',     'auburn',   'hoodie',  'blush',    'blush', 'wf'),
  T('mateo', 'Mateo', 's4', 'side',     'black',    'jacket',  'denim',    'sky'),
  T('nora',  'Nora',  's6', 'curly',    'espresso', 'tee',     'coral',    'coral', 'w'),
  T('lena',  'Lena',  's3', 'braid',    'brown',    'sweater', 'sky',      'sky',   'w'),
  T('omar',  'Omar',  's5', 'curly',    'black',    'jacket',  'forest',   'sun'),
  T('ruby',  'Ruby',  's1', 'bob',      'auburn',   'hoodie',  'sky',      'sky',   'wf'),
  T('aria',  'Aria',  's5', 'long',     'black',    'tee',     'mint',     'lilac', 'we'),
  T('jonah', 'Jonah', 's7', 'twists',   'black',    'hoodie',  'sun',      'sun'),
  T('eli',   'Eli',   's1', 'short',    'brown',    'tee',     'lilac',    'lilac', 'g'),
  T('grace', 'Grace', 's6', 'topbun',   'espresso', 'tee',     'sky',      'sky',   'we'),
  T('diego', 'Diego', 's4', 'mop',      'espresso', 'hoodie',  'coral',    'coral'),
  T('hana',  'Hana',  's2', 'bob',      'black',    'sweater', 'blush',    'blush', 'w'),
  T('felix', 'Felix', 's2', 'curly',    'chestnut', 'jacket',  'denim',    'mint'),
  T('iris',  'Iris',  's3', 'long',     'honey',    'hoodie',  'sun',      'sun',   'w'),
  T('jude',  'Jude',  's6', 'coily',    'black',    'tee',     'mint',     'mint'),

  /* Parents. Elena is Maya's mum. */
  A('elena',  'Elena',  'parent', 's4', 'bun',      'espresso', 'sweater',  'sun',   'sun',   'we'),
  A('rosa',   'Rosa',   'parent', 's3', 'shoulder', 'chestnut', 'cardigan', 'blush', 'blush', 'we'),
  A('daniel', 'Daniel', 'parent', 's1', 'side',     'brown',    'collar',   'sky',   'sky',   'g'),
  A('priya',  'Priya',  'parent', 's5', 'long',     'black',    'cardigan', 'lilac', 'lilac', 'we'),
  A('marcus', 'Marcus', 'parent', 's7', 'buzz',     'black',    'collar',   'mint',  'mint',  'b'),
  A('helen',  'Helen',  'parent', 's1', 'shoulder', 'ash',      'sweater',  'sky',   'sky',   'gw'),
  A('sam',    'Sam',    'parent', 's3', 'short',    'black',    'jacket',   'sun',   'sun'),
  A('ines',   'Ines',   'parent', 's4', 'pixie',    'brown',    'collar',   'coral', 'coral', 'we'),
  A('tom',    'Tom',    'parent', 's2', 'side',     'honey',    'sweater',  'forest','mint',  'b'),

  A('shah',   'Dr. Shah',   'pro', 's5', 'side', 'black', 'blazer', 'navy', 'sky',   'gl', { inner: 'shirt' }),
  A('okafor', 'Ms. Okafor', 'pro', 's7', 'puff', 'black', 'blazer', 'teal', 'lilac', 'en', { inner: 'cream' }),

  T('student', 'Student', 's3', 'curly', 'brown', 'hoodie', 'green', 'mint'),
  A('parent', 'Parent', 'parent', 's4', 'shoulder', 'brown', 'cardigan', 'sun', 'mint', 'e', { scene: 'tree' }),
  A('counselor', 'Counselor', 'pro', 's6', 'side', 'black', 'blazer', 'charcoal', 'sky', 'l', { inner: 'white', scene: 'bubble' }),
]

export const EMBLEMS = [
  { key: 'tree', label: 'Tree', role: 'parent', bg: 'mint' },
  { key: 'care', label: 'Talk bubble', role: 'pro', bg: 'sky' },
]

export const ROLE_PICKS = {
  parent: ['emblem-tree', 'char-parent'],
  pro: ['emblem-care', 'char-counselor'],
}
