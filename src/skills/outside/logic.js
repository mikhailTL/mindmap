/* Pure logic and copy for the Outside tools (social dynamics, digital spaces,
 * boundaries). No React here, so tests/skills-outside.test.js can reach all
 * of it. Every figure the feed audit shows comes from these functions and the
 * one stated assumption, ADS_PER_MINUTE. */

/* ---------- local store ---------- */

const KEY = id => 'mindmap.skills.' + id

export function readStore(id, fallback) {
  try {
    const raw = localStorage.getItem(KEY(id))
    return raw == null ? fallback : JSON.parse(raw)
  } catch { return fallback }
}

export function writeStore(id, value) {
  try { localStorage.setItem(KEY(id), JSON.stringify(value)); return true } catch { return false }
}

/* ---------- outside-feed: the digital wellness audit ---------- */

/* The one assumption behind "ads seen": about one ad for every two minutes in
   a feed. Real rates vary by app and by account, so the screen says so. */
export const ADS_PER_MINUTE = 0.5

export const START_APPS = [
  { name:'TikTok', ads:true }, { name:'Instagram', ads:true }, { name:'YouTube', ads:true },
  { name:'Snapchat', ads:true }, { name:'Games', ads:true }, { name:'Messages', ads:false },
]

export const FEELS = [
  { id:'better', label:'Better' },
  { id:'same',   label:'Same' },
  { id:'worse',  label:'Worse' },
]

export const TRICKS = [
  { id:'scroll',   name:'Infinite scroll',
    how:'The feed has no bottom, so there is never a natural place to stop.',
    fix:'Decide a stop time before you open it, or set an app limit.' },
  { id:'streaks',  name:'Streaks',
    how:'A count you lose if you skip a day, so missing feels like losing something.',
    fix:'Turn off streak reminders. A streak is not a friendship.' },
  { id:'autoplay', name:'Autoplay',
    how:'The next video starts before you have decided to watch it.',
    fix:'Turn autoplay off in the app settings.' },
  { id:'rewards',  name:'Variable rewards',
    how:'Pull to refresh works like a slot machine. Sometimes there is something good, so you keep pulling.',
    fix:'Check at set times instead of whenever you feel the pull.' },
  { id:'likes',    name:'Likes and counts',
    how:'A public score that pulls you back to check, and invites comparing your life to other people\'s best moments.',
    fix:'Hide like counts where the app allows it, and mute accounts that leave you feeling worse.' },
]

export const FREE_TIMES = [
  'Meals', 'First 30 minutes after waking', 'Last hour before bed', 'Homework blocks',
  'Time with friends', 'Walking or in the car',
]

export const NOTIF_CUTS = [
  'Turn off likes and comment alerts', 'Turn off streak reminders', 'Turn off autoplay',
  'Only alerts from people I know', 'Do Not Disturb at night',
]

const perDay = m => {
  const n = Number(m)
  return Number.isFinite(n) && n > 0 ? Math.min(n, 1440) : 0
}

export function weeklyMinutes(apps) {
  return (apps || []).reduce((sum, a) => sum + perDay(a.minutes), 0) * 7
}

export function attention(apps) {
  const weekMinutes = weeklyMinutes(apps)
  const feedWeek = weeklyMinutes((apps || []).filter(a => a.ads !== false))
  return {
    weekMinutes,
    adsWeek: Math.round(feedWeek * ADS_PER_MINUTE),
    yearHours: Math.round(weekMinutes * 52 / 60),
  }
}

export function hoursText(min) {
  const m = Math.round(min || 0)
  const h = Math.floor(m / 60), r = m % 60
  if (!h) return r + ' min'
  return r ? `${h} h ${r} min` : `${h} h`
}

export function drainers(apps) {
  return (apps || []).filter(a => a.feel === 'worse' && perDay(a.minutes) > 0)
    .sort((a, b) => perDay(b.minutes) - perDay(a.minutes))
}

export function trickCounts(apps) {
  const out = Object.fromEntries(TRICKS.map(t => [t.id, 0]))
  ;(apps || []).forEach(a => (a.tricks || []).forEach(t => { if (t in out) out[t]++ }))
  return out
}

/* About a third less, rounded down to 5 minutes, never under 15 unless the
   app is already under 15. */
export function suggestLimit(min) {
  const m = perDay(min)
  if (m <= 15) return m
  return Math.max(15, Math.floor(m * 2 / 3 / 5) * 5)
}

export function minutesSaved(apps, limits) {
  return (apps || []).reduce((sum, a) => {
    const lim = limits?.[a.name]
    if (lim == null || lim === '') return sum
    const cut = perDay(a.minutes) - perDay(lim)
    return sum + (cut > 0 ? cut : 0)
  }, 0) * 7
}

/* ---------- outside-conflict: I-statements and de-escalation ---------- */

export const FEELINGS = [
  'hurt', 'left out', 'frustrated', 'embarrassed', 'pressured', 'ignored', 'disrespected', 'worried',
  'uncomfortable', 'angry',
]

export const SITUATIONS = [
  { id:'pressure', label:'Peer pressure', line:'Friends keep pushing me to do something I do not want to do.',
    when:'I get pushed after I already said no', because:'it makes me feel like my answer does not count',
    need:'you to drop it when I say no' },
  { id:'online', label:'Online bullying', line:'Someone is posting or sending mean things about me.',
    when:'posts about me get shared in the group chat', because:'everyone I know can see them',
    need:'them taken down and for it to stop' },
  { id:'friend', label:'Friend friction', line:'A friend keeps cancelling, ignoring me or talking behind my back.',
    when:'plans change at the last minute', because:'I keep that time free',
    need:'a text if plans change' },
  { id:'home', label:'Arguments at home', line:'The same fight about rules or chores keeps coming back.',
    when:'we argue about my phone at dinner', because:'it turns into yelling and nothing gets fixed',
    need:'us to talk about it at a calmer time' },
  { id:'group', label:'Group project', line:'Someone in my group is not doing their part.',
    when:'the slides are not done the night before', because:'my grade depends on the whole group',
    need:'your part by Thursday' },
]

export const MOVES = [
  { id:'breathe', label:'Breathe before you answer', say:'(Take one slow breath before you reply.)' },
  { id:'lower',   label:'Lower your voice', say:'(Speak a little slower and quieter than them.)' },
  { id:'name',    label:'Name their feeling', say:'It sounds like you are really frustrated.' },
  { id:'ask',     label:'Ask a real question', say:'What would make this better for you?' },
  { id:'agree',   label:'Find one thing to agree on', say:'We both want this to stop being a thing.' },
  { id:'pause',   label:'Suggest a pause', say:'Can we talk about this after school, when we are both calmer?' },
  { id:'leave',   label:'Walk away and come back', say:'I am going to take a break. I will come back to this.' },
]

export const BULLYING_STEPS = [
  ['Do not reply in anger.', 'A reply gives them a reaction and can be used against you.'],
  ['Save the evidence.', 'Screenshot the posts or messages with the date and username showing.'],
  ['Block and report.', 'Use the app\'s report button. Reports are anonymous on most apps.'],
  ['Tell a trusted adult.', 'A parent, school counselor, teacher or coach. Show them what you saved.'],
]

export const SCENARIOS = [
  { id:'vape', tag:'pressure',
    text:'At a party a friend holds out a vape. "Just try it, everyone is."',
    options:[
      { kind:'calm', text:'"No thanks, I\'m good." Then change the subject or move away.',
        why:'Short, clear and calm. You do not owe a speech.' },
      { kind:'avoid', text:'Take it so they stop asking.',
        why:'Going along to end the pressure teaches them that pushing works.' },
      { kind:'attack', text:'"That is so stupid, you are all losers."',
        why:'Insults turn a small moment into a fight and make the pressure louder.' },
    ] },
  { id:'skip', tag:'pressure',
    text:'Your group wants to skip class and says you are boring if you do not come.',
    options:[
      { kind:'attack', text:'"Whatever, I don\'t even like you guys."',
        why:'It ends the moment but can cost a friendship you wanted.' },
      { kind:'calm', text:'"I\'m staying. Text me after and we can meet up."',
        why:'Clear no, plus a way to stay connected.' },
      { kind:'avoid', text:'Say nothing and go along.',
        why:'Silence usually reads as a yes.' },
    ] },
  { id:'post', tag:'online',
    text:'Someone posts an edited photo of you with a mean caption. People are laughing in the comments.',
    options:[
      { kind:'attack', text:'Post something worse about them.',
        why:'Getting even makes you part of it and can get you in trouble too.' },
      { kind:'avoid', text:'Delete your account and tell no one.',
        why:'It stops you seeing it but it keeps going, and you carry it alone.' },
      { kind:'calm', text:'Screenshot it, report and block, then show a trusted adult.',
        why:'Evidence plus an adult is what gets posts taken down and stops it.' },
    ] },
  { id:'cancel', tag:'friend',
    text:'Your friend cancels on you for the third time, ten minutes before.',
    options:[
      { kind:'calm', text:'"I feel let down when plans change last minute. Can you tell me earlier next time?"',
        why:'An I-statement says how it hit you without calling them names.' },
      { kind:'attack', text:'"You are such a flake. You always do this."',
        why:'"Always" and name calling make them defend themselves instead of listen.' },
      { kind:'avoid', text:'"It\'s fine." (It is not fine.)',
        why:'It stays inside and comes out bigger later.' },
    ] },
  { id:'dinner', tag:'home',
    text:'A parent says "You are on your phone all the time" in front of everyone.',
    options:[
      { kind:'avoid', text:'Walk off to your room and slam the door.',
        why:'It ends the moment but the same fight comes back tomorrow.' },
      { kind:'calm', text:'"I feel embarrassed when it comes up at dinner. Can we talk about it later tonight?"',
        why:'You name the feeling and move the talk to a calmer time.' },
      { kind:'attack', text:'"You are on yours way more than me."',
        why:'Firing back makes it a contest instead of a conversation.' },
    ] },
  { id:'slides', tag:'group',
    text:'It is the night before the project is due and one person has done nothing.',
    options:[
      { kind:'calm', text:'"I need your slides by 8 tonight. If that will not work, tell me now so we can split it."',
        why:'A clear request with a time is hard to ignore.' },
      { kind:'avoid', text:'Do their part yourself and say nothing.',
        why:'It gets done this time, and you end up doing it every time.' },
      { kind:'attack', text:'Post in the group chat that they are useless.',
        why:'Calling someone out in public makes them dig in.' },
    ] },
]

export function scenariosFor(situation, n = 3) {
  const first = SCENARIOS.filter(s => s.tag === situation)
  const rest = SCENARIOS.filter(s => s.tag !== situation)
  return [...first, ...rest].slice(0, n)
}

export function scoreReplies(kinds) {
  return { calm:(kinds || []).filter(k => k === 'calm').length, total:(kinds || []).length }
}

const tidy = s => String(s || '').trim().replace(/[.!?\s]+$/, '')
const lowerFirst = s => (/^I\b/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1))
const part = (s, lead) => lowerFirst(tidy(s).replace(lead, '').trim())

export function iStatement({ feel, when, because, need } = {}) {
  const f = part(feel, /^i\s+feel\s+/i)
  const w = part(when, /^when\s+/i)
  const b = part(because, /^because\s+/i)
  const n = part(need, /^i\s+need\s+/i)
  let first = ''
  if (f || w || b) {
    first = f ? `I feel ${f}` : 'It bothers me'
    if (w) first += ` when ${w}`
    if (b) first += ` because ${b}`
    first += '.'
  }
  const second = n ? `I need ${n}.` : ''
  return [first, second].filter(Boolean).join(' ')
}

export function checkWhen(text) {
  const t = String(text || '').toLowerCase()
  const tips = []
  if (/\b(always|never)\b/.test(t))
    tips.push('Swap always or never for one real time it happened.')
  if (/\b(stupid|idiot|dumb|loser|selfish|fake|crazy|lazy|pathetic|jerk|annoying|useless)\b/.test(t))
    tips.push('Leave out the name calling. Say what happened, not what they are.')
  if (/\byou make me\b|\byour fault\b|\bbecause of you\b/.test(t))
    tips.push('Skip blame like "you make me". Say what happened and how it felt.')
  return tips
}

/* ---------- outside-no: boundaries ---------- */

export const WHO = [
  { id:'friend',  label:'A friend',
    asks:['lend them money', 'cover for them with a lie', 'give them my passwords', 'skip practice with them'] },
  { id:'group',   label:'My friend group',
    asks:['go to a party I do not want to go to', 'drink or vape', 'post something mean about someone', 'stay out past my curfew'] },
  { id:'partner', label:'Someone I am dating',
    asks:['send photos', 'go further than I want to', 'share my location all the time', 'stop seeing my friends'] },
  { id:'adult',   label:'A coach or teacher',
    asks:['play while I am injured', 'take on another commitment this week', 'stay late every day this week'] },
]

export const NO_STYLES = [
  { id:'plain',  label:'Plain no', line:'Short and clear. No reason needed.' },
  { id:'reason', label:'No and a reason', line:'One honest reason, said once.' },
  { id:'other',  label:'No and an offer', line:'Say no to this, yes to something else.' },
  { id:'repeat', label:'Broken record', line:'Say the same calm line again, as many times as it takes.' },
  { id:'pause',  label:'Not now', line:'For when you need time. Not now means no for now.' },
]

const clause = ask => {
  const c = lowerFirst(tidy(ask).replace(/^(i\s+won'?t|i\s+will\s+not|i'?m\s+not\s+going\s+to|to)\s+/i, '').trim())
  return c || 'do that'
}
const sentence = s => { const t = tidy(s); return t ? t.charAt(0).toUpperCase() + t.slice(1) + '.' : '' }

export function noLine(style, ask, { reason = '', other = '' } = {}) {
  const c = clause(ask)
  const plain = `No, I'm not going to ${c}.`
  if (style === 'reason') return [plain, sentence(reason)].filter(Boolean).join(' ')
  if (style === 'other') return tidy(other) ? `I'm not going to ${c}, but I can ${lowerFirst(tidy(other))}.` : plain
  if (style === 'repeat') return `I already said no. I'm not going to ${c}.`
  if (style === 'pause') return "I'm not ready to say yes to that. For now the answer is no."
  return plain
}

export const PUSHBACK = {
  friend:  ['"Come on, I would do it for you."', '"I thought we were friends."', '"Just this once. Nobody will know."'],
  group:   ['"Everyone else is doing it."', '"Don\'t be so boring."', '"Fine, we\'ll just go without you then."'],
  partner: ['"If you really liked me, you would."', '"Everyone else\'s girlfriend or boyfriend does."', '"You\'re overreacting. It\'s not a big deal."'],
  adult:   ['"The team needs you right now."', '"Everyone else manages it."', '"If you want to start, you\'ll find a way."'],
}

export const pushbackFor = who => PUSHBACK[who] || PUSHBACK.friend

/* The three ways a round can go. `hold` uses the person's own line. */
export const REPLIES = [
  { kind:'hold',    why:'You held your line without a fight. Repeating yourself calmly is enough.' },
  { kind:'explain', text:'"I mean, sorry, it\'s just that, I don\'t know, maybe..."',
    why:'Long apologies and reasons give them something to argue with. One short line is stronger.' },
  { kind:'give',    text:'"Fine. Just this once."',
    why:'Most people give in sometimes. Next time, try saying your line one more time first.' },
]

export const CONSENT = [
  'No means no, every time, from anyone.',
  'You can change your mind at any point, even after saying yes.',
  'Guilt, pressure or threats are not okay in any relationship.',
  'Asking for or sharing nude photos of anyone under 18 is serious and illegal in many places.',
]
