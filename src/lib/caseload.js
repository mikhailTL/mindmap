/* Counselor demo data, carried over from the Solace build so the two products
   tell the same story. Names are placeholders by design — the real product
   never shows one to a cohort view. */

export const K_ANONYMITY = 5

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
export const TIER_LABEL = { info:'Steady', moderate:'Watch', high:'Elevated', crisis:'Urgent' }
export const TIER_ORDER = ['crisis','high','moderate','info']

export const triage = () => SEED.map(s => {
  const current = clamp(s.base, 5, 99), weekAgo = clamp(s.base - s.drift, 5, 99)
  return { ...s, current, weekAgo, velocity: current - weekAgo, consented:true, tier: tierOf(current) }
}).sort((a, b) => b.velocity - a.velocity)

export const COURSES = [
  { id:'c1', name:'AP US History',      teacher:'Mr. Delaney',  period:1 },
  { id:'c2', name:'Pre-Calculus',       teacher:'Mrs. Okafor',  period:2 },
  { id:'c3', name:'AP Chemistry',       teacher:'Ms. Ruiz',     period:3 },
  { id:'c4', name:'English Literature', teacher:'Mr. Vance',    period:5 },
  { id:'c5', name:'Spanish III',        teacher:'Sra. Molina',  period:6 },
  { id:'c6', name:'Biology',            teacher:'Dr. Aslan',    period:7 },
]
const ord = n => n + (['th','st','nd','rd'][(n % 100 - n % 10 !== 10) * (n % 10)] || 'th')

/* n is synthetic; the means come from the same windows the individual scores use. */
export const COHORT_PERIOD = COURSES.map(c => ({
  key:'p' + c.period,
  label:`${ord(c.period)} period · ${c.name}`,
  n: c.period === 5 ? 3 : 6 + (c.period % 4) * 4,
  mean: { 1:54, 2:57, 3:71, 5:49, 6:46, 7:52 }[c.period],
})).map(r => ({ ...r, suppressed: r.n < K_ANONYMITY }))

export const COHORT_WEEKDAY = [['Mon','Monday'],['Tue','Tuesday'],['Wed','Wednesday'],
  ['Thu','Thursday'],['Fri','Friday']].map(([label, full], i) => ({
  key:label, label, full, n: 22 + i * 3, mean: [58, 52, 61, 63, 47][i], suppressed: false,
}))

export const CONSENT_LEDGER = [
  { student:'Student 8241', guardian:'Guardian', scope:'Wellness score, trends, academic correlation', basis:'FERPA', signedAt:'Aug 22, 2025', expires:'Jun 12, 2026' },
  { student:'Student 3907', guardian:'Guardian', scope:'Wellness score, crisis alerts only',           basis:'FERPA', signedAt:'Aug 24, 2025', expires:'Jun 12, 2026' },
  { student:'Student 5512', guardian:'Guardian', scope:'Full counselor scope',                          basis:'Both',  signedAt:'Sep 03, 2025', expires:'Jun 12, 2026' },
  { student:'Student 2298', guardian:'Guardian', scope:'Wellness score, trends',                        basis:'COPPA', signedAt:'Sep 09, 2025', expires:'Jun 12, 2026' },
  { student:'Student 4470', guardian:'Guardian', scope:'Crisis alerts only',                            basis:'COPPA', signedAt:'Sep 11, 2025', expires:'Jun 12, 2026' },
]

export const AUDIT_LOG = [
  { at:'Today, 2:41 PM',     actor:'System',                 action:'Crisis protocol completed — parent notified',      subject:'Student 8241' },
  { at:'Today, 2:21 PM',     actor:'Counselor (counselor)',  action:'Acknowledged crisis alert',                        subject:'Student 8241' },
  { at:'Today, 2:14 PM',     actor:'System',                 action:'Crisis alert raised — counselor auto-notified',     subject:'Student 8241' },
  { at:'Today, 11:02 AM',    actor:'Counselor (counselor)',  action:'Viewed profile',                                   subject:'Student 5512' },
  { at:'Yesterday, 4:35 PM', actor:'Counselor (counselor)',  action:'Exported cohort report (anonymized, k≥5)',          subject:'Grade 11 cohort' },
  { at:'Yesterday, 9:18 AM', actor:'Guardian (parent)',      action:'Viewed wellness summary',                          subject:'Student 8241' },
  { at:'Monday, 3:50 PM',    actor:'Student 8241',           action:'Revoked sharing: mood log → counselor',             subject:'Student 8241' },
]

export const PROTOCOL = [
  'Acknowledge the alert',
  'Locate the student',
  'In-person welfare check',
  'Contact guardian',
  'Document outcome and next step',
]
export const PROTOCOL_TIMES = ['2:14 PM','2:21 PM','2:26 PM','2:34 PM','2:41 PM']

export const REFERRALS = [
  { student:'Student 8241', to:'External referral — elevated arousal pattern', opened:'Today',  status:'Awaiting intake' },
  { student:'Student 5512', to:'School psychologist',                          opened:'Monday', status:'Scheduled' },
  { student:'Student 3907', to:'External counseling service',                  opened:'Mar 04', status:'In progress' },
  { student:'Student 1184', to:'School psychologist',                          opened:'Feb 18', status:'Closed' },
]

/* Ranked drivers for Student 8241, from the same engine the student view uses. */
export const DRIVERS = [
  { label:'HRV down 18% vs their baseline',                     contribution:0.31 },
  { label:'4 skin-conductance responses in 10 min',             contribution:0.24 },
  { label:'Heart rate 84 bpm — 21% above their resting median', contribution:0.18 },
  { label:'Baseline skin conductance up 12%',                   contribution:0.11 },
  { label:'Skin temp falling 0.4 °C/min',                       contribution:0.06 },
]
export const INTERVENTIONS = [
  { name:'Box breathing',                  sessions:7, hrvDeltaPct: 18 },
  { name:'10-minute walk',                 sessions:3, hrvDeltaPct:  9 },
  { name:'Progressive muscle relaxation',  sessions:4, hrvDeltaPct:  4 },
  { name:'Pomodoro',                       sessions:2, hrvDeltaPct:  0 },
  { name:'Text someone',                   sessions:1, hrvDeltaPct: -3 },
]
export const efficacyLabel = i =>
  i.sessions === 0 ? `${i.name}: not tried yet`
  : i.hrvDeltaPct === 0 ? `${i.name}: no measurable effect (${i.sessions} session${i.sessions === 1 ? '' : 's'})`
  : `${i.name}: HRV ${i.hrvDeltaPct > 0 ? '+' : ''}${i.hrvDeltaPct}% (${i.sessions} session${i.sessions === 1 ? '' : 's'})`

/* 45 days of daily means for Student 8241, ending on the current elevated run. */
export const PROFILE_45 = (() => {
  let v = 52, out = []
  for (let i = 0; i < 45; i++) {
    v += Math.sin(i / 5) * 1.8 + (i > 31 ? 0.75 : 0) + ((i * 37) % 11 - 5) * 0.35
    out.push({ i, v: Math.round(Math.max(34, Math.min(88, v))) })
  }
  return out
})()
