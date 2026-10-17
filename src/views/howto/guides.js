import { PRO, PRO_PLURAL } from '../../lib/terms'

/* What each "How to use" guide says, per audience and per tab id.
 *
 * Every guide is three steps that together cover the whole page at a glance:
 * each step is one part of the page and how to use it. A step is a picture
 * (`art`, a key into ART in ./art.jsx) and one caption of ten words or fewer.
 * `use` is the one line on what the section is for. `go` is an optional
 * button to a related route. `tones` colour the three steps, in order; the
 * hues come from the site tokens and are mapped to literal class names in
 * ./index.jsx.
 *
 * House rules for this copy: no em dashes, no diagnostic words, nothing
 * called AI except the MindMap AI chat, no streaks, no comparison between
 * teens, and the Professional's name only ever from src/lib/terms.js.
 * tests/howto.test.js checks the mechanical ones. */

const AI_STEPS = [
  { art: 'chat',   cap: 'Tap a starter or ask in your own words.' },
  { art: 'source', cap: 'Framework and Sources shows where answers come from.' },
  { art: 'help',   cap: 'Want a person? Help lines sit beside the chat.' },
]

const TRENDS = 'How to use Trends'

export const GUIDES = {
  student: {
    'app-student': {
      section: 'Home',
      title: 'How to use Home',
      tones: ['accent', 'sky', 'mint'],
      steps: [
        { art: 'startBar', cap: 'Start a reading from the bar at the top.' },
        { art: 'cards',    cap: 'Cards open Trends, Toolkit, MindMap AI and your network.' },
        { art: 'patch',    cap: 'The patch box shows if your patch is connected.' },
      ],
      use: 'Your starting point. One tap to anywhere in MindMap.',
      go: { label: 'Take a reading', route: 'reading' },
    },
    reading: {
      section: 'Reading',
      title: 'How to take a reading',
      tones: ['accent', 'coral', 'beam'],
      steps: [
        { art: 'fourWays', cap: 'Pick a way: patch, camera, questions or Mental Mirror.' },
        { art: 'howWays',  cap: 'Follow the screen. Each way takes a minute or less.' },
        { art: 'dial',     cap: 'Get a Mind Score, 0 to 100, against your usual.' },
      ],
      use: 'Check in before a test, after practice, or any time.',
    },
    'student-trends': {
      section: 'Trends',
      title: TRENDS,
      tones: ['beam', 'mint', 'lilac'],
      steps: [
        { art: 'todayDial', cap: 'Today: your Mind Score and Heads Up face.' },
        { art: 'rangeCal',  cap: 'Switch Day, Week or Month. Tap a day for detail.' },
        { art: 'log',       cap: 'Scroll your log and add a note to any reading.' },
      ],
      use: 'Notice patterns, like which days of the week feel heavier.',
    },
    toolkit: {
      section: 'Toolkit',
      title: 'How to use Toolkit',
      tones: ['mint', 'sky', 'sun'],
      steps: [
        { art: 'toolTabs', cap: 'Pick a tab: Exercises, School, Outside, Life, Career, Resources.' },
        { art: 'toolPick', cap: 'Tap an activity and follow along at your pace.' },
        { art: 'levels',   cap: 'Finish tools for points, levels and badges. Try today’s quest.' },
      ],
      use: 'Calm your body, clear your head, or build a life skill.',
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
        { art: 'twoAudiences', cap: `Choose a parent or ${PRO}, then flip each switch.` },
        { art: 'dayView',      cap: 'The preview shows exactly what a parent would see.' },
        { art: 'keepDays',     cap: 'Notes and Location stay yours. Pick how long readings keep.' },
      ],
      use: 'You decide what the people in your network see.',
    },
  },

  parent: {
    'app-parent': {
      section: 'Home',
      title: 'How to use Home',
      tones: ['sky', 'mint', 'beam'],
      steps: [
        { art: 'cards',      cap: 'Cards open Trends, Toolkit, MindMap AI and Privacy.' },
        { art: 'familyNet',  cap: `Your network lists your teens and their ${PRO_PLURAL}.` },
        { art: 'inviteBoth', cap: `Add a teen or ${PRO} by sending a link.` },
      ],
      use: 'Your starting point, and where your family network lives.',
    },
    'parent-trends': {
      section: 'Trends',
      title: TRENDS,
      tones: ['lilac', 'beam', 'mint'],
      steps: [
        { art: 'childPick', cap: 'Each child: today’s Heads Up and Mind Score.' },
        { art: 'range',     cap: 'Switch Day, Week or Month to see their pattern.' },
        { art: 'calendar',  cap: 'Tap a calendar day. Never Notes, Location or raw readings.' },
      ],
      use: 'Spot a rough stretch and start a conversation.',
    },
    toolkit: {
      section: 'Toolkit',
      title: 'How to use Toolkit',
      tones: ['sky', 'mint', 'sun'],
      steps: [
        { art: 'opener',   cap: 'Your tools: talk openers, line checks, when to get help.' },
        { art: 'together', cap: 'Do your teen’s exercises together, like Box Breathing.' },
        { art: 'toolTabs', cap: 'More tabs: School, Outside, Life, Career, Resources.' },
      ],
      use: 'Calmer talks with your teen, and skills to share.',
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
        { art: 'dayView', cap: 'You see each day’s Mind Score, sleep and patch wear.' },
        { art: 'locked',  cap: 'Notes, Location and raw readings stay private.' },
        { art: 'table',   cap: 'One table shows who sees what. Your teen decides.' },
      ],
      use: 'Know exactly what you can and cannot see.',
    },
  },

  pro: {
    'app-pro': {
      section: 'Home',
      title: 'How to use Home',
      tones: ['mint', 'sky', 'beam'],
      steps: [
        { art: 'cards',      cap: 'Cards open Trends, Connect, MindMap AI and Toolkit.' },
        { art: 'quickTools', cap: 'Shortcuts open Session Openers, Grounding Timer and Referral Note.' },
        { art: 'roster',     cap: 'See how many teens share with you, then open Trends.' },
      ],
      use: 'One place to start your day with families.',
      go: { label: 'Open Connect', route: 'network' },
    },
    'app-pro-trends': {
      section: 'Trends',
      title: TRENDS,
      tones: ['sky', 'lilac', 'mint'],
      steps: [
        { art: 'headsCount', cap: 'Heads Up today, and any urgent alert, sit up top.' },
        { art: 'eachGroup',  cap: 'Switch Each teen or Whole group. Groups under 5 hide.' },
        { art: 'filterOpen', cap: 'Filter and sort, then open a record. Opens are logged.' },
      ],
      use: 'See who may want a check-in today.',
    },
    network: {
      section: 'Connect',
      title: 'How to use Connect',
      tones: ['beam', 'accent', 'mint'],
      steps: [
        { art: 'invite',     cap: 'Copy your invite link or code and send it.' },
        { art: 'teenChoose', cap: 'The teen opens it, joins and picks what is shared.' },
        { art: 'joined',     cap: 'They appear in Your Network with what they share.' },
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
      tones: ['sky', 'mint', 'sun'],
      steps: [
        { art: 'proTools', cap: 'Your tools: openers, next steps, parent talks, referral notes.' },
        { art: 'together', cap: 'Run the student exercises with a teen in the room.' },
        { art: 'toolTabs', cap: 'More tabs: School, Outside, Life, Career, Resources.' },
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
