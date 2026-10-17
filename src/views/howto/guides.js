/* What each "How to use" guide says, per audience and per tab id.
 *
 * Every guide is three steps. A step is a picture (`art`, a key into ART in
 * ./art.jsx) and one caption of ten words or fewer. `use` is the one line on
 * what the section is for. `go` is an optional button to a related route.
 * `tones` colour the three steps, in order; the hues come from the site
 * tokens and are mapped to literal class names in ./index.jsx.
 *
 * House rules for this copy: no em dashes, no diagnostic words, nothing
 * called AI except the MindMap AI chat, no streaks, no comparison between
 * teens. tests/howto.test.js checks the mechanical ones. */

const AI_STEPS = [
  { art: 'chat',   cap: 'Ask anything in your own words.' },
  { art: 'source', cap: 'Answers draw on published clinical guidance.' },
  { art: 'help',   cap: 'Not a doctor. Get help is always up top.' },
]

export const GUIDES = {
  student: {
    'app-student': {
      section: 'Home',
      title: 'How to use Home',
      tones: ['mint', 'beam', 'sky'],
      steps: [
        { art: 'patch',  cap: 'See if your patch is connected.' },
        { art: 'cards',  cap: 'Tap a card to jump to any section.' },
        { art: 'tabbar', cap: 'Or use the bar at the bottom.' },
      ],
      use: 'Your starting point. One tap to anywhere in MindMap.',
      go: { label: 'Take a reading', route: 'reading' },
    },
    reading: {
      section: 'Reading',
      title: 'How to take a reading',
      tones: ['accent', 'coral', 'beam'],
      steps: [
        { art: 'threeWays', cap: 'Pick one: the patch, phone camera or check-in.' },
        { art: 'fingerCam', cap: 'Camera: fingertip flat over the lens, hold still.' },
        { art: 'dial',      cap: 'A Mind Score, 0 to 100, against your usual day.' },
      ],
      use: 'Check in before a test, after practice, or any time.',
    },
    'student-trends': {
      section: 'Trends',
      title: 'How to use Trends',
      tones: ['beam', 'mint', 'lilac'],
      steps: [
        { art: 'range',    cap: 'Switch between Day, Week and Month.' },
        { art: 'faces',    cap: 'Heads Up faces: green, yellow or red.' },
        { art: 'calendar', cap: 'Tap a calendar day to see its log.' },
      ],
      use: 'Notice patterns, like which days of the week feel heavier.',
    },
    toolkit: {
      section: 'Toolkit',
      title: 'How to use Toolkit',
      tones: ['mint', 'sky', 'sun'],
      steps: [
        { art: 'toolPick', cap: 'Pick a calming activity or a life skill.' },
        { art: 'breathe',  cap: 'Follow along on screen at your own pace.' },
        { art: 'levels',   cap: 'Earn levels and badges as you try things.' },
      ],
      use: 'Something to do when the day feels like a lot.',
    },
    ai: {
      section: 'MindMap AI',
      title: 'How to use MindMap AI',
      tones: ['beam', 'accent', 'coral'],
      steps: AI_STEPS,
      use: 'Questions about sleep, stress, school or a hard week.',
    },
    shared: {
      section: 'Privacy',
      title: 'How to use Privacy',
      tones: ['accent', 'sky', 'lilac'],
      steps: [
        { art: 'togglesOn',    cap: 'Every kind of sharing starts on.' },
        { art: 'toggleOff',    cap: 'Flip a switch off and they stop seeing it.' },
        { art: 'twoAudiences', cap: 'Choose separately for parents and Medical Professionals.' },
      ],
      use: 'You decide what the people in your network see.',
    },
  },

  parent: {
    'app-parent': {
      section: 'Home',
      title: 'How to use Home',
      tones: ['mint', 'beam', 'sky'],
      steps: [
        { art: 'cards',     cap: 'Tap a card to open a section.' },
        { art: 'invite',    cap: 'Send your teen a link from the Network box.' },
        { art: 'inviteMed', cap: 'Add their Medical Professional the same way.' },
      ],
      use: 'Set up your family network in a few taps.',
    },
    'parent-trends': {
      section: 'Trends',
      title: 'How to use Trends',
      tones: ['lilac', 'mint', 'beam'],
      steps: [
        { art: 'childPick', cap: 'Pick a child to see their Mind Score.' },
        { art: 'calendar',  cap: 'Tap a calendar day for its Heads Up.' },
        { art: 'dayOnly',   cap: 'Days only. Never Notes, Location or raw readings.' },
      ],
      use: 'Spot a rough stretch and start a conversation.',
    },
    toolkit: {
      section: 'Toolkit',
      title: 'How to use Toolkit',
      tones: ['sky', 'mint', 'coral'],
      steps: [
        { art: 'opener',    cap: 'Pick a conversation opener to start talking.' },
        { art: 'lineCheck', cap: 'Check your first line before you say it.' },
        { art: 'getHelp',   cap: 'Know when and where to get help.' },
      ],
      use: 'Calmer talks with your teen about stress.',
    },
    ai: {
      section: 'MindMap AI',
      title: 'How to use MindMap AI',
      tones: ['beam', 'accent', 'coral'],
      steps: AI_STEPS,
      use: 'Ask how to support your teen through a hard week.',
    },
    privacy: {
      section: 'Privacy',
      title: 'How to use Privacy',
      tones: ['accent', 'lilac', 'sky'],
      steps: [
        { art: 'dayView',   cap: 'You see a daily Mind Score and Heads Up.' },
        { art: 'locked',    cap: 'Notes, Location and raw readings stay private.' },
        { art: 'toggleOff', cap: 'Your teen can turn any sharing off.' },
      ],
      use: 'Know exactly what you can and cannot see.',
    },
  },

  pro: {
    'app-pro': {
      section: 'Home',
      title: 'How to use Home',
      tones: ['mint', 'beam', 'sky'],
      steps: [
        { art: 'cards',  cap: 'Tap a card to open a section.' },
        { art: 'roster', cap: 'See the teens who chose to join you.' },
        { art: 'tabbar', cap: 'Trends, Connect, Ask and Toolkit sit below.' },
      ],
      use: 'One place to start your day with families.',
      go: { label: 'Open Connect', route: 'network' },
    },
    'app-pro-trends': {
      section: 'Trends',
      title: 'How to use Trends',
      tones: ['mint', 'lilac', 'beam'],
      steps: [
        { art: 'lights', cap: 'A Heads Up light for each consented teen.' },
        { art: 'group5', cap: 'Groups under 5 show nothing.' },
        { art: 'audit',  cap: 'Every record you open is logged.' },
      ],
      use: 'See who may want a check-in.',
    },
    network: {
      section: 'Connect',
      title: 'How to use Connect',
      tones: ['beam', 'accent', 'mint'],
      steps: [
        { art: 'invite',     cap: 'Send a family a link.' },
        { art: 'teenChoose', cap: 'The teen chooses whether to join.' },
        { art: 'joined',     cap: 'They join your network once they say yes.' },
      ],
      use: 'Add families with nothing shared until the teen agrees.',
    },
    ai: {
      section: 'MindMap AI',
      title: 'How to use MindMap AI',
      tones: ['beam', 'accent', 'coral'],
      steps: AI_STEPS,
      use: 'Look up guidance between sessions.',
    },
    toolkit: {
      section: 'Toolkit',
      title: 'How to use Toolkit',
      tones: ['sky', 'lilac', 'mint'],
      steps: [
        { art: 'opener',   cap: 'Session openers to start the conversation.' },
        { art: 'nextStep', cap: 'The next step guide helps you pick what follows.' },
        { art: 'referral', cap: 'Draft a clear referral note.' },
      ],
      use: 'Quick tools for before, during and after a session.',
    },
  },
}

/* The guide for one app and tab, or null when there is none. */
export function guideFor(app, tab) {
  if (!app || !tab) return null
  const byApp = GUIDES[app]
  if (!byApp || !Object.prototype.hasOwnProperty.call(byApp, tab)) return null
  return byApp[tab]
}

export const storageKey = (app, tab) => `mindmap.howto.${app}.${tab}`
