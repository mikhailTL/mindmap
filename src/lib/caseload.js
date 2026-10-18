import { PRO } from './terms.js'

/* Counselor/Professional demo data. Two rules:
   1. CONSENT is the single source of truth. It feeds both the Consent-tab
      ledger and the triage board's flags, so the board cannot show a trend for
      a student consented only to crisis alerts. Keep no second copy.
   2. Nothing here is a measurement. Every number is generated from the scoring
      model, deterministically, per student, which is why the per-student
      helpers take the student as an argument. */

export const K_ANONYMITY = 5

/* Consented students across the whole building. The counselor/professional's own eight are
   below; year-group screens aggregate everyone. */
export const SCHOOL_N = 96

/* score:  may the school see a Mind Score at all
   trends: may the school see week-over-week movement
   Crisis alerts reach the counselor/professional either way: the one thing a guardian
   cannot consent away, and it is stated wherever it applies. */
export const CONSENT = {
  'Student 8241': { score:true,  trends:true,  raw:false, scope:'Mind Score, weekly change and class period patterns',                  basis:'FERPA', signedAt:'Aug 22, 2025' },
  'Student 3907': { score:true,  trends:false, raw:false, scope:'Mind Score and crisis alerts, no weekly change',                        basis:'FERPA', signedAt:'Aug 24, 2025' },
  'Student 5512': { score:true,  trends:true,  raw:true,  scope:'Mind Score, weekly change, class period patterns and raw readings',    basis:'Both',  signedAt:'Sep 03, 2025' },
  'Student 1184': { score:true,  trends:true,  raw:false, scope:'Mind Score and weekly change',                                          basis:'FERPA', signedAt:'Aug 29, 2025' },
  'Student 7736': { score:true,  trends:true,  raw:false, scope:'Mind Score, weekly change and class period patterns',                  basis:'FERPA', signedAt:'Sep 05, 2025' },
  'Student 2298': { score:true,  trends:true,  raw:false, scope:'Mind Score and weekly change',                                          basis:'COPPA', signedAt:'Sep 09, 2025' },
  'Student 6053': { score:true,  trends:false, raw:false, scope:'Mind Score and crisis alerts, no weekly change',                        basis:'Both',  signedAt:'Sep 08, 2025' },
  'Student 4470': { score:false, trends:false, raw:false, scope:'Crisis alerts only',                                       basis:'COPPA', signedAt:'Sep 11, 2025' },
}
const EXPIRES = 'Jun 12, 2026'

const SEED = [
  { id:'t1', name:'Student 8241', grade:11, base:74, drift: 11 },
  { id:'t2', name:'Student 3907', grade:12, base:86, drift:  1 },
  { id:'t3', name:'Student 5512', grade:11, base:58, drift: 16 },
  { id:'t4', name:'Student 1184', grade:10, base:81, drift: -6 },
  { id:'t5', name:'Student 7736', grade:12, base:63, drift:  4 },
  { id:'t6', name:'Student 2298', grade:10, base:49, drift:  9 },
  { id:'t7', name:'Student 6053', grade:11, base:71, drift: -3 },
  { id:'t8', name:'Student 4470', grade: 9, base:55, drift:  0 },
]
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
export const tierOf = s => s >= 85 ? 'crisis' : s >= 72 ? 'high' : s >= 58 ? 'moderate' : 'info'
/* Labels name the band the Mind Score sits in, not a verdict on the student. */
export const TIER_LABEL = { info:'Low', moderate:'Moderate', high:'High', crisis:'Urgent' }
export const TIER_ORDER = ['crisis','high','moderate','info']

/* Every student, carrying what may be shown about them. Rendering `current`
   without checking `showScore` is a bug. */
export const roster = () => SEED.map(s => {
  const c = CONSENT[s.name]
  const current = clamp(s.base, 5, 99), weekAgo = clamp(s.base - s.drift, 5, 99)
  return { ...s, current, weekAgo, velocity: current - weekAgo,
    scope:c.scope, basis:c.basis, signedAt:c.signedAt, expires:EXPIRES,
    showScore:c.score, showTrend:c.trends, showRaw:c.raw,
    tier: c.score ? tierOf(current) : null }
})

/* Ordered by how much the Mind Score moved, so it holds only students
   consented to trends. The rest are listed separately and unordered, because
   ordering them would leak the thing they withheld. */
export const triage = () => roster().filter(s => s.showTrend)
  .sort((a, b) => b.velocity - a.velocity)
export const scoreOnly  = () => roster().filter(s => s.showScore && !s.showTrend)
  .sort((a, b) => b.current - a.current)
export const alertsOnly = () => roster().filter(s => !s.showScore)

/* No teacher, and no field for one. A class is a period and a subject here;
   naming the adult who teaches it would put an invented person in a consent
   record and would be read by nothing on any screen. */
export const COURSES = [
  { id:'c1', name:'AP US History',      period:1 },
  { id:'c2', name:'Pre-Calculus',       period:2 },
  { id:'c3', name:'AP Chemistry',       period:3 },
  { id:'c4', name:'English Literature', period:5 },
  { id:'c5', name:'Spanish III',        period:6 },
  { id:'c6', name:'Biology',            period:7 },
]
const ord = n => n + (['th','st','nd','rd'][(n % 100 - n % 10 !== 10) * (n % 10)] || 'th')

/* n counts consented students in that period across the school, not the
   caseload, hence figures larger than eight. */
export const COHORT_PERIOD = COURSES.map(c => ({
  key:'p' + c.period,
  label:`${ord(c.period)} period · ${c.name}`,
  n: c.period === 5 ? 3 : { 1:24, 2:31, 3:38, 6:27, 7:19 }[c.period],
  mean: { 1:54, 2:57, 3:71, 5:49, 6:46, 7:52 }[c.period],
})).map(r => ({ ...r, suppressed: r.n < K_ANONYMITY }))

export const COHORT_WEEKDAY = [['Mon','Monday'],['Tue','Tuesday'],['Wed','Wednesday'],
  ['Thu','Thursday'],['Fri','Friday']].map(([label, full], i) => ({
  key:label, label, full, n: SCHOOL_N, mean: [58, 52, 61, 63, 47][i], suppressed: false,
}))

export const CONSENT_LEDGER = roster().map(s => ({
  student:s.name, guardian:'Guardian', scope:s.scope, basis:s.basis,
  signedAt:s.signedAt, expires:s.expires,
}))

/* Times must match PROTOCOL_TIMES below. The protocol is still open at the
   last step, so there is no "closed" row. */
/* Every actor is a role, never a person. The three that were already roles
   set the pattern: System, the guardian of a pseudonym, the student behind
   one. A named professional would be an invented person in an audit trail,
   and one role holds this console, so PRO names them. The log stays
   attributable because a role plus a time is who did it on a console one
   professional signs into. */
export const AUDIT_LOG = [
  { at:'12 Sep, 2:34 PM', rel:'Today',     actor:PRO,                action:'Guardian contacted by phone',                      subject:'Student 8241' },
  { at:'12 Sep, 2:26 PM', rel:'Today',     actor:PRO,                action:'Checked on the student in person',                 subject:'Student 8241' },
  { at:'12 Sep, 2:21 PM', rel:'Today',     actor:PRO,                action:'Acknowledged crisis alert',                        subject:'Student 8241' },
  { at:'12 Sep, 2:14 PM', rel:'Today',     actor:'System',           action:`Crisis alert raised, ${PRO} notified`,subject:'Student 8241' },
  { at:'12 Sep, 11:02 AM',rel:'Today',     actor:PRO,                action:'Opened record',                                    subject:'Student 5512' },
  { at:'11 Sep, 4:35 PM', rel:'Yesterday', actor:PRO,                action:'Exported year-group report (no group under five)', subject:'Grade 11' },
  { at:'11 Sep, 9:18 AM', rel:'Yesterday', actor:'Guardian of 8241', action:'Viewed Trends',                                    subject:'Student 8241' },
  { at:'8 Sep, 3:50 PM',  rel:'Monday',    actor:'Student 8241',     action:'Set raw readings to be kept 30 days',              subject:'Student 8241' },
]

export const PROTOCOL = [
  'Acknowledge the alert',
  'Find the student',
  'Check on the student in person',
  'Call the guardian',
  'Write down what happened and the next step',
]
export const PROTOCOL_TIMES = ['2:14 PM','2:21 PM','2:26 PM','2:34 PM','2:41 PM']
export const PROTOCOL_DONE = [0,1,2,3]   // step five is the one still open

export const REFERRALS = [
  { student:'Student 8241', to:'Outside referral: body working harder than usual', opened:'Today',  status:'Waiting for intake' },
  { student:'Student 5512', to:PRO,opened:'Monday', status:'Scheduled' },
  { student:'Student 3907', to:'Outside counseling service',                      opened:'Mar 04', status:'In progress' },
  { student:'Student 1184', to:PRO,opened:'Feb 18', status:'Closed' },
]

/* Which signals account for a student's change this week. Generated per
   student from their own id, so two names never carry the same breakdown. */
const SIGNALS = [
  'Heartbeat less steady than their own normal',
  'Sweat spikes bunched in single lessons',
  'Resting heart rate above their own normal',
  'Resting sweat level above their own normal',
  'Skin temperature falling through a lesson',
  'Restlessness during seated work',
]
export function driversFor(s) {
  const h = [...s.id + s.name].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7)
  const top = SIGNALS.map((label, i) => ({ label, w: ((h >> i) % 7) + (i === 0 ? 5 : 1) }))
    .sort((a, b) => b.w - a.w).slice(0, 5)
  const total = top.reduce((a, b) => a + b.w, 0)
  return top.map(r => ({ label:r.label, share: r.w / total }))
}

export const INTERVENTIONS = [
  { name:'Box breathing',                  sessions:7, hrvDeltaPct: 18 },
  { name:'10-minute walk',                 sessions:3, hrvDeltaPct:  9 },
  { name:'Progressive muscle relaxation',  sessions:4, hrvDeltaPct:  4 },
  { name:'Pomodoro',                       sessions:2, hrvDeltaPct:  0 },
  { name:'Text someone',                   sessions:1, hrvDeltaPct: -3 },
]
export const efficacyLabel = i =>
  i.sessions === 0 ? `${i.name}: not tried yet`
  : i.hrvDeltaPct === 0 ? `${i.name}: no measured change (${i.sessions} session${i.sessions === 1 ? '' : 's'})`
  : `${i.name}: heartbeat steadiness ${i.hrvDeltaPct > 0 ? '+' : ''}${i.hrvDeltaPct}% (${i.sessions} session${i.sessions === 1 ? '' : 's'})`

/* 45 days of daily means, built from that student's own base and drift so the
   line ends where the board says they are today. */
export function profile45(s) {
  const start = s.weekAgo - s.drift * 2
  let v = start, out = []
  for (let i = 0; i < 45; i++) {
    const pull = i > 31 ? (s.current - v) * 0.10 : 0
    v += Math.sin((i + s.grade) / 5) * 1.6 + pull + ((i * 37 + s.base) % 11 - 5) * 0.3
    out.push({ i, v: Math.round(clamp(v, 20, 96)) })
  }
  out[44].v = s.current
  return out
}
