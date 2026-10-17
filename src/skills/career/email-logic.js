/* Professional Email: the builder, the texting-habit checker, the STAR
 * answer and the networking notes. Pure functions, no storage. */

export const PURPOSES = [
  { id:'meeting',   label:'Ask for a short chat',     subject:'Request for a short chat',
    askLabel:'What you would like',  askHint:'a 15 minute call about your job',
    line: a => `I am writing to ask if you would have time for ${a}.`,
    due:  d => `Could you let me know by ${d}?` },
  { id:'apply',     label:'Ask about a job or internship', subject:'Student internship inquiry',
    askLabel:'The role or place',    askHint:'a summer internship at your clinic',
    line: a => `I am interested in ${a}, and I would like to know if there are any openings for students. I can send my resume if that would help.`,
    due:  d => `I am hoping to hear back by ${d}.` },
  { id:'followup',  label:'Follow up',                subject:'Following up',
    askLabel:'What you are following up on', askHint:'my application from last week',
    line: a => `I am following up on ${a}. I wanted to check whether there is anything else you need from me.`,
    due:  d => `Could you let me know by ${d}?` },
  { id:'thanks',    label:'Say thank you',            subject:'Thank you',
    askLabel:'What you are thanking them for', askHint:'meeting with me on Tuesday',
    line: a => `Thank you for ${a}. It really helped me, and I appreciate your time.`,
    due:  () => '' },
  { id:'extension', label:'Ask for more time',        subject:'Request for more time',
    askLabel:'The assignment or task', askHint:'the history essay',
    line: a => `I am writing to ask for more time on ${a}. I want to hand in work I am proud of, and I can share what I have done so far.`,
    due:  d => `Would ${d} work as a new due date?` },
  { id:'reference', label:'Ask for a reference',      subject:'Reference request',
    askLabel:'What you are applying for', askHint:'a part time job at the library',
    line: a => `I am applying for ${a}, and I would be grateful if you would be a reference for me. I can send you a short summary of what I worked on.`,
    due:  d => `The application closes on ${d}.` },
]

const or = (v, ph) => (v && String(v).trim()) || ph
const sentence = s => {
  const t = String(s || '').trim().replace(/[.!?]+$/, '')
  return t ? t[0].toUpperCase() + t.slice(1) + '.' : ''
}

export function buildEmail({ purpose = 'meeting', toName, myName, about, ask, deadline } = {}) {
  const p = PURPOSES.find(x => x.id === purpose) || PURPOSES[0]
  const middle = [sentence(about), p.line(or(ask, `[${p.askLabel.toLowerCase()}]`))].filter(Boolean).join(' ')
  const due = deadline && deadline.trim() ? p.due(deadline.trim()) : ''
  const close = p.id === 'thanks' ? '' : 'Thank you for your time.'
  const body = [
    `Dear ${or(toName, '[their name]')},`, '',
    middle + (due ? ' ' + due : ''), '',
    ...(close ? [close, ''] : []),
    'Best regards,',
    or(myName, '[your name]'),
  ].join('\n')
  return { subject: p.subject, body }
}

/* ── THE CHECKER ─────────────────────────────────────────────────────────
 * Each rule is a texting habit that reads badly in a work email. It returns
 * the habit, in a few words, and the fix. */

const GREET  = /^(dear|hi|hello|good (morning|afternoon|evening)|greetings)\b/i
const CASUAL = /^(hey|heyy+|yo|sup|hiya|wassup)\b/i
const SIGN   = /^(thank you|thanks|many thanks|best|best regards|kind regards|warm regards|regards|sincerely|all the best|respectfully|with thanks)\b/i
export const SLANG = new Set(['u', 'ur', 'lol', 'lmao', 'idk', 'gonna', 'wanna', 'gotta', 'pls', 'plz',
  'thx', 'ty', 'tbh', 'rn', 'btw', 'ya', 'kk', 'omg', 'ngl', 'bc', 'cuz', 'hmu', 'imo', 'lmk', 'nvm',
  'sup', 'ikr', 'smh', 'fr', 'bruh', 'yeah', 'yep', 'nah', 'wyd', 'np', 'tmrw', 'abt'])
const SMILEY = /(^|\s)(:\)|:-\)|:\(|:D|;\)|:P|xD|<3|:\/)(?=\s|$|[.,!?])/i
const EMOJI  = /\p{Extended_Pictographic}/u
export const WORD_LIMIT = 150

export const wordCount = s => (String(s || '').match(/[A-Za-z0-9'][A-Za-z0-9'.-]*/g) || []).length

export function checkEmail(text) {
  const src = String(text || '')
  if (!src.trim()) return []
  const lines = src.split('\n').map(l => l.trim()).filter(Boolean)
  const out = []
  const first = lines[0]
  if (CASUAL.test(first)) out.push({ id:'greeting', label:'A casual greeting', tip:'Start with Dear or Hello and their name.' })
  else if (!GREET.test(first)) out.push({ id:'greeting', label:'No greeting', tip:'Start with Dear or Hello and their name.' })

  const letters = src.match(/[a-z]/gi) || []
  if (letters.length >= 10 && !/[A-Z]/.test(src)) {
    out.push({ id:'lowercase', label:'All lowercase', tip:'Use capitals for names, I, and the start of each sentence.' })
  }
  if (/(^|[^\w'])i('m|'ll|'ve|'d)?(?=[^\w']|$)/.test(src)) {
    out.push({ id:'i', label:'A small i', tip:'Write I with a capital.' })
  }

  const words = src.toLowerCase().match(/[a-z']+/g) || []
  const slang = [...new Set(words.filter(w => SLANG.has(w)))]
  if (slang.length) out.push({ id:'slang', label:`Texting words: ${slang.join(', ')}`, tip:'Write the full words.' })

  if (EMOJI.test(src) || SMILEY.test(src)) out.push({ id:'emoji', label:'Emoji or smiley', tip:'Leave them out of work emails.' })
  if (/[!?]{2,}/.test(src)) out.push({ id:'shout', label:'Double punctuation', tip:'One full stop or one question mark is enough.' })

  if (!lines.slice(-3).some(l => SIGN.test(l))) {
    out.push({ id:'signoff', label:'No sign-off', tip:'End with Best regards or Thank you, then your name.' })
  }
  const n = wordCount(src)
  if (n > WORD_LIMIT) out.push({ id:'length', label:`Too long (${n} words)`, tip:`Aim for under ${WORD_LIMIT} words. Cut to the ask.` })
  return out
}

/* ── INTERVIEWS ─────────────────────────────────────────────────────────── */

export const INTERVIEW = [
  { q:'Tell me about yourself.',              tip:'Two lines on now, one on what you have done, one on why you are here.' },
  { q:'Why do you want this role?',           tip:'Name one thing about them and one thing you want to learn.' },
  { q:'Tell me about a time you worked on a team.', tip:'Pick a real project. Say what you did, not just the team.' },
  { q:'Tell me about a challenge you faced.', tip:'Choose one that ended with you doing something.' },
  { q:'What is one of your strengths?',       tip:'Name it, then prove it with a short story.' },
  { q:'What is something you are working on?', tip:'A real skill you are improving, and how.' },
  { q:'Tell me about a mistake you made.',    tip:'What happened, what you fixed, what you do now.' },
]

export const ASK_THEM = [
  'What does a good first month look like here?',
  'What do students or new people usually find hardest?',
  'What do you enjoy most about working here?',
  'What are the next steps after today?',
]

export function starAnswer({ s, t, a, r } = {}) {
  return [s, t, a, r].map(sentence).filter(Boolean).join(' ')
}

/* Seconds to say it out loud at a calm 140 words a minute. */
export const speakingTime = (words, wpm = 140) => words > 0 ? Math.round(words / wpm * 60) : 0

/* ── NETWORKING NOTES ───────────────────────────────────────────────────── */

export function thankYouNote({ toName, topic, myName, detail } = {}) {
  return [
    `Dear ${or(toName, '[their name]')},`, '',
    `Thank you for ${or(topic, '[what they did]')}. ${detail && detail.trim() ? sentence(detail) : 'I learned a lot, and I really appreciate your time.'}`,
    '', 'I hope we can stay in touch.', '',
    'Best regards,', or(myName, '[your name]'),
  ].join('\n')
}

export function followUpNote({ toName, topic, myName } = {}) {
  return [
    `Dear ${or(toName, '[their name]')},`, '',
    `I hope you are well. I am following up on ${or(topic, '[what you sent]')}. I am still very interested, and I wanted to check if there is any update or anything else you need from me.`,
    '', 'Thank you for your time.', '',
    'Best regards,', or(myName, '[your name]'),
  ].join('\n')
}

export const ETIQUETTE = [
  { id:'thanks', title:'Thank-you notes', rows:[
    'Send it within 24 hours of a chat, interview or shadow day.',
    'Name one thing you learned, so it is clearly about them.',
    'Keep it to four or five sentences.',
  ]},
  { id:'follow', title:'Following up', rows:[
    'Wait about a week before you follow up.',
    'Reply in the same email thread so they have the context.',
    'Follow up once or twice at most. Then let it go politely.',
  ]},
  { id:'linkedin', title:'LinkedIn basics', rows:[
    'You need to be at least 16 to have an account.',
    'Use a clear, friendly photo and your real name.',
    'Your headline can be simple: Student at your school, interested in your field.',
    'Add a short note when you send a connection request.',
  ]},
  { id:'meet', title:'Meeting people', rows:[
    'Say your name, your school and one thing you are curious about.',
    'Ask about them before you ask for anything.',
    'Ask before you add someone online, and keep it about the work.',
  ]},
]
