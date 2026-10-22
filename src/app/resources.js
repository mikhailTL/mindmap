// Help line directory. Numbers, keywords and hours match each service's own page as checked on VERIFIED_ON.
export const VERIFIED_ON = '12 October 2026'

export const RESOURCES = [
  {
    id: '988',
    name: '988 Suicide and Crisis Lifeline',
    what: 'Helps with any crisis, including thoughts of suicide.',
    hours: 'Every hour of every day',
    who: 'Trained crisis counselors across a network of local centers',
    actions: [
      { kind: 'call', label: 'Call 988', href: 'tel:988' },
      { kind: 'text', label: 'Text 988', href: 'sms:988' },
      { kind: 'chat', label: 'Chat online', href: 'https://chat.988lifeline.org/' },
    ],
    extra: { label: 'En español', href: 'https://988lifeline.org/es/inicio/' },
    access: 'Relay users dial 711, then 988. For ASL, call 988 from a videophone number.',
    site: 'https://988lifeline.org/',
  },
  {
    id: 'ctl',
    name: 'Crisis Text Line',
    what: 'Helps with anything, by text message instead of voice.',
    hours: 'Every hour of every day',
    who: 'Trained volunteer crisis counselors',
    actions: [
      { kind: 'text', label: 'Text HOME to 741741', href: 'sms:741741?&body=HOME' },
      { kind: 'chat', label: 'Chat online', href: 'https://connect.crisistextline.org/chat' },
    ],
    extra: { label: 'WhatsApp +1 443 787 7678',
             href: 'https://api.whatsapp.com/send/?phone=14437877678&text=CONNECT' },
    site: 'https://www.crisistextline.org/',
  },
  {
    id: 'teenline',
    name: 'Teen Line',
    what: 'Trained teenagers answer, about school, home, friends or anything.',
    hours: '6 pm to 10 pm Pacific by phone, 6 pm to 9 pm Pacific by text',
    who: 'Trained teenagers, supervised by Didi Hirsch Mental Health Services',
    actions: [
      // 839863 as printed on findahelpline.com; the Didi Hirsch page prints a five-digit typo.
      { kind: 'text', label: 'Text TEEN to 839863', href: 'sms:839863?&body=TEEN' },
      { kind: 'call', label: 'Call 800 852 8336', href: 'tel:18008528336' },
    ],
    extra: null,
    site: 'https://didihirsch.org/teenline/support-line/',
  },
  {
    id: 'trevor',
    name: 'The Trevor Project',
    what: 'Supports LGBTQ young people with anything.',
    hours: 'Every hour of every day',
    who: 'Trained crisis counselors',
    actions: [
      { kind: 'text', label: 'Text START to 678678', href: 'sms:678678?&body=START' },
      { kind: 'call', label: 'Call 1 866 488 7386', href: 'tel:18664887386' },
      { kind: 'chat', label: 'Chat online', href: 'https://www.thetrevorproject.org/get-help/' },
    ],
    extra: null,
    site: 'https://www.thetrevorproject.org/get-help/',
  },
  {
    id: 'trans',
    name: 'Trans Lifeline',
    what: 'Run by trans people, for trans and questioning people.',
    hours: '1 pm to 9 pm Eastern, Monday to Friday',
    who: 'Trans peer operators',
    actions: [
      { kind: 'call', label: 'Call 877 565 8860', href: 'tel:18775658860' },
    ],
    extra: null,
    site: 'https://translifeline.org/hotline/',
  },
  {
    // The NEDA helpline number (1-800-931-2237) is out of service; this row uses the National Alliance line.
    id: 'eating',
    name: 'National Alliance for Eating Disorders',
    what: 'Helps with eating and food. They are not a crisis line.',
    hours: '9 am to 7 pm Eastern, Monday to Friday',
    who: 'Licensed clinicians',
    actions: [
      { kind: 'call', label: 'Call 866 662 1235', href: 'tel:18666621235' },
    ],
    extra: null,
    site: 'https://www.allianceforeatingdisorders.com/find-treatment/',
  },
  {
    id: 'samhsa',
    name: 'SAMHSA National Helpline',
    what: 'Refers you to treatment nearby. They are not a crisis line.',
    hours: 'Every hour of every day',
    who: 'Information and referral specialists',
    actions: [
      { kind: 'call', label: 'Call 1 800 662 4357', href: 'tel:18006624357' },
    ],
    extra: null,
    site: 'https://www.samhsa.gov/find-help/helplines/national-helpline',
  },
]

export const EMERGENCY = {
  label: 'Call 911',
  href: 'tel:911',
  line: 'If somebody is hurt or in danger right now, call 911.',
}
