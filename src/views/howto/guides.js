import { PRO_PLURAL, PRO_WRAP } from '../../lib/terms'

// Copy for each How to use guide, by audience and tab id. A step is an `art` key from ./art.jsx and a caption
// of ten words or fewer; `tones` colour the three steps in order.
// PRO_WRAP is the breakable spelling: the caption column is narrower than "Counselor/Professional" on a phone.
const PRO = PRO_WRAP
const PROS = PRO_PLURAL.replace('/', '/\u200B')

const AI_STEPS = [
  { art: 'chat',   cap: 'Tap a question, or type your own.' },
  { art: 'source', cap: 'Tap Sources to see where answers come from.' },
  { art: 'help',   cap: 'Need a person? Help line numbers sit beside the chat.' },
]

const TRENDS = 'How to use Trends'

export const GUIDES = {
  student: {
    'app-student': {
      section: 'Home',
      title: 'How to use Home',
      tones: ['accent', 'sky', 'mint'],
      steps: [
        { art: 'startBar', cap: 'Tap Start a reading to check your stress.' },
        { art: 'cards',    cap: 'Tap a picture: Trends, Toolkit, MindMap AI or Network.' },
        { art: 'patch',    cap: 'See here if your patch is connected.' },
      ],
      use: 'Start here. Every part of MindMap is one tap away.',
      go: { label: 'Take a reading', route: 'reading' },
    },
    reading: {
      section: 'Reading',
      title: 'How to take a reading',
      tones: ['accent', 'coral', 'beam'],
      steps: [
        { art: 'fourWays', cap: 'Pick one way: Mental Mirror, camera, Survey or patch.' },
        { art: 'howWays',  cap: 'Follow the steps on screen. It takes about a minute.' },
        { art: 'dial',     cap: 'Get your Mind Score: 0 is calm, 100 is peak.' },
      ],
      use: 'Checking your stress level. It becomes your Mind Score, 0 calm to 100 peak.',
    },
    'student-trends': {
      section: 'Trends',
      title: TRENDS,
      tones: ['beam', 'mint', 'lilac'],
      steps: [
        { art: 'todayDial', cap: 'See today’s score and its green, yellow or red color.' },
        { art: 'rangeCal',  cap: 'Pick Day, Week or Month. Tap a day for more.' },
        { art: 'log',       cap: 'Scroll past readings and add a note to any.' },
      ],
      use: 'Notice patterns, like which days of the week feel heavier.',
    },
    toolkit: {
      section: 'Toolkit',
      title: 'How to use Toolkit',
      tones: ['mint', 'sky', 'sun'],
      steps: [
        { art: 'toolTabs', cap: 'Pick a topic at the top, like School or Life.' },
        { art: 'toolPick', cap: 'Tap an activity and follow along.' },
        { art: 'levels',   cap: 'Finish activities to earn points, levels and badges.' },
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
    network: {
      section: 'Network',
      title: 'How to use Network',
      tones: ['beam', 'accent', 'mint'],
      steps: [
        { art: 'teenChoose',   cap: `Open the link a parent or ${PRO} sent you.` },
        { art: 'twoAudiences', cap: 'Choose what each person can see.' },
        { art: 'joined',       cap: 'Change or remove anyone, any time.' },
      ],
      use: 'See who is in your network and what they see.',
    },
    shared: {
      section: 'Privacy',
      title: 'How to use Privacy',
      tones: ['accent', 'sky', 'lilac'],
      steps: [
        { art: 'twoAudiences', cap: 'Pick a person, then turn each item on or off.' },
        { art: 'dayView',      cap: 'The preview shows exactly what they will see.' },
        { art: 'keepDays',     cap: 'Your notes and location always stay private.' },
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
        { art: 'cards',      cap: 'Tap a picture: Trends, Toolkit, MindMap AI or Network.' },
        { art: 'familyNet',  cap: `See your teens and their ${PROS} below.` },
        { art: 'inviteBoth', cap: `Add your teen or a ${PRO} by sending a link.` },
      ],
      use: 'Your starting point, and where your family network lives.',
    },
    'parent-trends': {
      section: 'Trends',
      title: TRENDS,
      tones: ['lilac', 'beam', 'mint'],
      steps: [
        { art: 'childPick', cap: 'Pick your child to see today’s Mind Score.' },
        { art: 'range',     cap: 'Pick Day, Week or Month to see the pattern.' },
        { art: 'calendar',  cap: 'Tap a day for more. Notes and location stay private.' },
      ],
      use: 'Spot a rough stretch and start a conversation.',
    },
    toolkit: {
      section: 'Toolkit',
      title: 'How to use Toolkit',
      tones: ['sky', 'mint', 'sun'],
      steps: [
        { art: 'opener',   cap: 'Ways to start a talk, and when to get help.' },
        { art: 'together', cap: 'Try a breathing exercise together with your teen.' },
        { art: 'toolTabs', cap: 'Pick a topic at the top for more, like School.' },
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
    network: {
      section: 'Network',
      title: 'How to use Network',
      tones: ['beam', 'accent', 'mint'],
      steps: [
        { art: 'invite',    cap: 'Copy your invite link and send it to your teen.' },
        { art: 'familyNet', cap: `Approve a ${PRO} before they can see anything.` },
        { art: 'table',     cap: 'Your teen chooses what each person sees.' },
      ],
      use: `Add your teens and approve their ${PRO_PLURAL}.`,
    },
    privacy: {
      section: 'Privacy',
      title: 'How to use Privacy',
      tones: ['accent', 'lilac', 'sky'],
      steps: [
        { art: 'dayView', cap: 'You see each day’s score, sleep and patch wear time.' },
        { art: 'locked',  cap: 'Your teen’s notes and location stay private.' },
        { art: 'table',   cap: 'Your teen decides who sees what.' },
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
        { art: 'cards',      cap: 'Tap a picture: Trends, Toolkit, MindMap AI or Network.' },
        { art: 'roster',     cap: 'See how many teens share with you.' },
        { art: 'eachGroup',  cap: 'Open Trends to see each teen or the whole group.' },
      ],
      use: 'One place to start your day with families.',
      go: { label: 'Open Network', route: 'network' },
    },
    'app-pro-trends': {
      section: 'Trends',
      title: TRENDS,
      tones: ['sky', 'lilac', 'mint'],
      steps: [
        { art: 'headsCount', cap: 'Today’s colors and any urgent alerts are at the top.' },
        { art: 'eachGroup',  cap: 'Switch between each teen and the whole group.' },
        { art: 'filterOpen', cap: 'Sort the list, then tap a teen for details.' },
      ],
      use: 'See who may want a check-in today.',
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
        { art: 'proTools', cap: 'Find conversation starters, next steps and referral notes.' },
        { art: 'together', cap: 'Do the teen exercises together in a session.' },
        { art: 'toolTabs', cap: 'Pick a topic at the top for more, like School.' },
      ],
      use: 'Quick tools for before, during and after a session.',
    },
    network: {
      section: 'Network',
      title: 'How to use Network',
      tones: ['beam', 'accent', 'mint'],
      steps: [
        { art: 'invite',     cap: 'Copy your invite link or code and send it.' },
        { art: 'teenChoose', cap: 'The teen opens it and picks what to share.' },
        { art: 'joined',     cap: 'They then show up in your list.' },
      ],
      use: 'Add families with nothing shared until the teen agrees.',
    },
    'app-pro-privacy': {
      section: 'Privacy',
      title: 'How to use Privacy',
      tones: ['accent', 'lilac', 'beam'],
      steps: [
        { art: 'table',    cap: 'Each teen chooses what you see.' },
        { art: 'proNever', cap: 'Notes, location and messages are never shared.' },
        { art: 'openLog',  cap: 'Every teen you open is recorded.' },
      ],
      use: 'Know what each teen shares with you.',
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
