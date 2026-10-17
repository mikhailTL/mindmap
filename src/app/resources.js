/* The help list.
 *
 * Every row below was fetched and read on 12 October 2026, and the URL each
 * detail came from is on the row. Nothing here is written from memory, because
 * a disconnected number on this screen is worse than no screen: the National
 * Eating Disorders Association's telephone helpline, 1-800-931-2237, was wound
 * down in 2023 and still circulates in copied lists, so the live eating
 * disorder line here is the National Alliance for Eating Disorders instead.
 *
 * Checked again, page by page, on 12 October 2026. Every page below was
 * opened on that date and every number, short code, keyword and stated hour
 * on the rows was read off it:
 *   988 Lifeline            https://988lifeline.org/
 *                           ("The 988 Lifeline is available 24/7/365")
 *                           https://chat.988lifeline.org/
 *                           https://988lifeline.org/es/inicio/
 *                           https://988lifeline.org/help-yourself/for-deaf-hard-of-hearing/
 *                           (relay: "dial 711 then 988"; videophone: "calling
 *                           988 with a VP number")
 *   Crisis Text Line        https://www.crisistextline.org/
 *                           https://connect.crisistextline.org/chat
 *   Teen Line               https://didihirsch.org/teenline/support-line/
 *                           (phone "6-10 p.m. PST every night", text 6 to 9)
 *                           https://chat.findahelpline.com/organizations/teen-line
 *                           (the short code 839863 is printed in full there;
 *                           the Didi Hirsch page prints it once as 83986,
 *                           which is a typo on their page, so the six-digit
 *                           form is the one used here)
 *   The Trevor Project      https://www.thetrevorproject.org/get-help/
 *   Alliance for Eating
 *     Disorders             https://www.allianceforeatingdisorders.com/find-treatment/
 *                           ("The Alliance's helpline is not a 24/7 crisis
 *                           line", 9:00 am to 7:00 pm EST, Monday to Friday)
 *   SAMHSA National
 *     Helpline              https://www.samhsa.gov/find-help/helplines/national-helpline
 *   Trans Lifeline          https://translifeline.org/hotline/
 *                           (Monday to Friday, "1 PM - 9 PM Eastern"; that
 *                           page also lists holiday closures, which is why the
 *                           row says hours change and links to it)
 *
 * The NEDA wind-down is reported at
 *   https://www.npr.org/sections/health-shots/2023/05/31/1179244569/national-eating-disorders-association-phases-out-human-helpline-pivots-to-chatbo
 * and nationaleatingdisorders.org/get-help/ was opened again on 12 October
 * 2026 and still lists no telephone number at all: an email address and two
 * postal addresses, nothing to call.
 *
 * Two things are deliberately absent from every line of copy in this file:
 * any promise about confidentiality, and any statement about what a service
 * or an authority will or will not do with what it is told. Both vary by
 * service, by state and by circumstance, and neither is ours to promise.
 * Several of these services do describe themselves as confidential on their
 * own pages. Those words stay on their pages, and the link is how a reader
 * gets to them.
 *
 * `hours` is quoted close to the source wording. `kind` orders the actions:
 * text first on the rows where texting is the thing a teenager will actually
 * do. `access` is for a way in that is not a button, which so far is only
 * 988's relay and videophone routes.
 */

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

/* Printed once at the top of the sheet rather than on every row. */
export const EMERGENCY = {
  label: 'Call 911',
  href: 'tel:911',
  line: 'If somebody is hurt or in danger right now, call 911.',
}
