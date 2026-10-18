/* Try a Career: the data and the pure logic.
 *
 * Twelve "do you like this" statements each point at one to three of eight
 * career clusters. Yes is 2, Maybe is 1, No is 0. A cluster's match is its
 * points as a share of what it could have scored, so a cluster with fewer
 * statements is not punished for it. The clusters are a starting point for
 * small tests, never a verdict. */

export const CLUSTERS = [
  { id:'build', name:'Build and Fix', jobs:'engineer, electrician, mechanic, architect',
    tests:[
      { kind:'taster',  text:'Follow one free beginner project on Instructables and build it.' },
      { kind:'shadow',  text:'Ask a mechanic, electrician or engineer if you can watch them work for a morning.' },
      { kind:'project', text:'Fix or upcycle one thing, then offer the same fix to two neighbours.' },
    ],
    questions:['What tools or software do you use every day?', 'What is a mistake that taught you the most?'] },
  { id:'care', name:'Health and Care', jobs:'nurse, physical therapist, vet tech, paramedic',
    tests:[
      { kind:'taster',  text:'Watch three free health and medicine lessons on Khan Academy.' },
      { kind:'shadow',  text:'Ask a nurse, vet tech or physical therapist about a shadow day or a volunteer shift.' },
      { kind:'project', text:'Make a one page snack and water plan for your team and ask ten people if it helped.' },
    ],
    questions:['How do you look after yourself after a hard shift?', 'Which health jobs do people not know about?'] },
  { id:'create', name:'Create and Design', jobs:'designer, animator, writer, video editor',
    tests:[
      { kind:'taster',  text:'Make one poster with a free design tool and change it after a friend gives notes.' },
      { kind:'shadow',  text:'Ask a local designer, photographer or video maker if you can sit in on a shoot or a session.' },
      { kind:'project', text:'Design three stickers or prints for a club and count how many people want one.' },
    ],
    questions:['How did you build your portfolio?', 'How do you get paid work when you are starting out?'] },
  { id:'tech', name:'Tech and Data', jobs:'software developer, data analyst, IT support, game designer',
    tests:[
      { kind:'taster',  text:'Do one free Hour of Code on Code.org, or the first lessons on freeCodeCamp.' },
      { kind:'shadow',  text:'Ask someone in IT at school or a local company to show you what they fix in a day.' },
      { kind:'project', text:'Build a simple sign up sheet or web page for a club and see if they still use it in two weeks.' },
    ],
    questions:['Which language or tool would you learn first if you started again?', 'How much of your day is coding and how much is people?'] },
  { id:'business', name:'Business and Start-ups', jobs:'founder, marketer, accountant, sales lead',
    tests:[
      { kind:'taster',  text:'Take the free personal finance lessons on Khan Academy, starting with budgeting.' },
      { kind:'shadow',  text:'Ask a local shop owner if you can help out and watch how they run a busy day.' },
      { kind:'project', text:'Sell one small thing or service for two weekends and track cost, price and profit.' },
    ],
    questions:['How did you find your first customers?', 'What would you test first if you started a business today?'] },
  { id:'people', name:'Teach and Support', jobs:'teacher, counselor, coach, social worker',
    tests:[
      { kind:'taster',  text:'Teach a five minute mini lesson to a younger sibling or friend, then ask what stuck.' },
      { kind:'shadow',  text:'Ask a teacher, coach or school counselor if you can help with one class or practice.' },
      { kind:'project', text:'Tutor one younger student for three sessions and ask them to rate each one from 1 to 5.' },
    ],
    questions:['How do you handle a day when nothing goes to plan?', 'What training did you need, and how long did it take?'] },
  { id:'science', name:'Science and Nature', jobs:'lab researcher, environmental scientist, vet, park ranger',
    tests:[
      { kind:'taster',  text:'Join a free citizen science project on Zooniverse and classify fifty images.' },
      { kind:'shadow',  text:'Ask a lab, nature center or vet clinic if they take student visitors or volunteers.' },
      { kind:'project', text:'Run one small experiment at home for three weeks and log the results in a table.' },
    ],
    questions:['What does a research project look like from start to finish?', 'How did you get your first lab or field job?'] },
  { id:'public', name:'Law and Public Service', jobs:'lawyer, police officer, city planner, policy analyst',
    tests:[
      { kind:'taster',  text:'Play two free iCivics games, or watch one city council or school board meeting online.' },
      { kind:'shadow',  text:'Ask your local representative office or a public defender office about student visits.' },
      { kind:'project', text:'Pick one small problem at school, collect twenty opinions and present them to student council.' },
    ],
    questions:['What does a hard case or project teach you?', 'How do you deal with people who disagree with you?'] },
]

export const STATEMENTS = [
  { text:'Taking things apart or fixing them',          to:['build', 'science'] },
  { text:'Helping someone who is hurt or stuck',         to:['care', 'people'] },
  { text:'Drawing, filming, writing or making music',    to:['create'] },
  { text:'Figuring out how an app or game works',        to:['tech', 'build'] },
  { text:'Selling something or running a stall',         to:['business'] },
  { text:'Explaining things to younger kids',            to:['people'] },
  { text:'Running an experiment to see what happens',    to:['science', 'care'] },
  { text:'Arguing a point or fixing something unfair',   to:['public'] },
  { text:'Spotting patterns in numbers',                 to:['tech', 'business', 'science'] },
  { text:'Being outdoors or working with animals',       to:['science', 'care'] },
  { text:'Planning an event or leading a group',         to:['business', 'public', 'people'] },
  { text:'Making things look good',                      to:['create', 'build'] },
]

export const ANSWERS = [
  { id:'yes',   label:'Me',       points:2 },
  { id:'maybe', label:'Not sure', points:1 },
  { id:'no',    label:'Not me',   points:0 },
]
const POINTS = Object.fromEntries(ANSWERS.map(a => [a.id, a.points]))

export const TEST_KINDS = {
  taster:'Free online taster',
  shadow:'Shadow day',
  project:'Small project or side job',
}

/* answers: { [statement index]: 'yes' | 'maybe' | 'no' } */
export function scoreClusters(answers = {}) {
  const out = CLUSTERS.map((c, order) => {
    let score = 0, max = 0
    STATEMENTS.forEach((s, i) => {
      if (!s.to.includes(c.id)) return
      max += 2
      score += POINTS[answers[i]] || 0
    })
    return { id:c.id, name:c.name, score, max, pct: max ? score / max : 0, order }
  })
  return out.sort((a, b) => b.pct - a.pct || b.score - a.score || a.order - b.order)
}

export const GENERAL_QUESTIONS = [
  'What does a normal day look like for you?',
  'How did you get into this work?',
  'What do you wish you had known at my age?',
  'What is the hardest part of the job?',
  'Which skill matters most, and how could I start building it now?',
  'What surprised you most when you started?',
  'Is there a class, club or small project you would suggest I try?',
  'Who else should I talk to about this?',
]

/* A small seeded shuffle, so a list is the same every time it is drawn
   with the same seed. */
function shuffle(list, seed) {
  const a = [...list]
  let s = (Math.abs(Math.floor(seed)) % 2147483647) || 1
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647
    const j = s % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const ownQuestions = id => (CLUSTERS.find(c => c.id === id) || { questions:[] }).questions

/* Two of the cluster's own questions, the rest from the general bank. */
export function pickQuestions(clusterId, n = 5, seed = 1) {
  const own = shuffle(ownQuestions(clusterId), seed).slice(0, 2)
  const rest = shuffle(GENERAL_QUESTIONS, seed + 7).filter(q => !own.includes(q))
  return [...own, ...rest].slice(0, n)
}

/* Swap one question for the next one on the shuffled pool that is not
   already on the list, walking forward so repeated swaps cycle. */
export function swapQuestion(list, index, clusterId, seed = 1) {
  const order = shuffle([...ownQuestions(clusterId), ...GENERAL_QUESTIONS], seed)
  const start = Math.max(0, order.indexOf(list[index]))
  for (let k = 1; k <= order.length; k++) {
    const cand = order[(start + k) % order.length]
    if (!list.includes(cand)) return list.map((q, i) => i === index ? cand : q)
  }
  return list
}

const or = (v, ph) => (v && String(v).trim()) || ph
const sentence = s => {
  const t = s.trim().replace(/[.!?]+$/, '')
  return t ? t[0].toUpperCase() + t.slice(1) + '.' : ''
}

export function outreachMessage({ theirName, myName, role, how } = {}) {
  const me = or(myName, '[your name]')
  const intro = ['My name is ' + me + '.', how && how.trim() ? sentence(how) : ''].filter(Boolean).join(' ')
  return [
    `Hi ${or(theirName, '[their name]')},`,
    '',
    `${intro} I am a high school student exploring ${or(role, '[the field]')}, and I would really like to hear how you got started.`,
    '',
    'Would you have 15 minutes for a short call or a chat in the next few weeks? I am happy to work around your schedule.',
    '',
    'Thank you,',
    me,
  ].join('\n')
}

export function testPlanText({ idea, who, make, measure, by, cost } = {}) {
  const c = or(cost, '0').replace(/^\$/, '')
  return [
    'My one page test plan',
    '',
    `Idea: ${or(idea, '[the idea]')}`,
    `Who it is for: ${or(who, '[who]')}`,
    `What I will make or do: ${or(make, '[what]')}`,
    `How I will know it worked: ${or(measure, '[one number to check]')}`,
    `Finish by: ${or(by, '[a date]')}`,
    `Most I will spend: $${c}`,
  ].join('\n')
}
