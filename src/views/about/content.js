/* The About text, in the owner's own words (18 October). Kept as he wrote it
   apart from the fixes he asked for: "MindMap" spelled as the product,
   Counselors/Professionals for "medical professionals/schools", and four
   typos ("fast array", "months at end", "these crisis"). Long paragraphs are
   split at sentence ends only; no sentence is reworded. */

export const PARTS = [
  { id: 'problem',  n: '01', title: 'The Problem' },
  { id: 'why',      n: '02', title: 'Why MindMap' },
  { id: 'personal', n: '03', title: 'Personal Experience & Research' },
  { id: 'what',     n: '04', title: 'What is MindMap' },
  { id: 'vision',   n: '05', title: 'Vision' },
]

export const PROBLEM = 'Across the globe, millions of adolescents are silently suffering in the face of the rapidly growing plague of mental illness. 1 in 7 adolescents already suffer from a diagnosed mental illness, while nearly 70% of those showing symptoms remain undiagnosed. The detrimental impacts have expanded further, as mental-illness related suicide has become the #2 leading cause of death among adolescents globally. Within Florida, 40% of adolescents have reported persistent feelings of sadness or hopelessness, leading to over 225,000 depressive episodes within young people over just a year.'

/* The figures in the paragraph above, lifted out as highlights. Each caption
   is a fragment of his sentence, not a new claim. */
export const STATS = [
  { mark: '1 in 7',       to: 7,      fmt: v => `1 in ${v}`,                     note: 'adolescents already suffer from a diagnosed mental illness' },
  { mark: 'nearly 70%',   to: 70,     fmt: v => `${v}%`, pre: 'nearly',          note: 'of those showing symptoms remain undiagnosed' },
  { mark: '#2',           to: 2,      fmt: v => `#${v}`,                         note: 'leading cause of death among adolescents globally' },
  { mark: '40%',          to: 40,     fmt: v => `${v}%`,                         note: 'of adolescents within Florida have reported persistent feelings of sadness or hopelessness' },
  { mark: 'over 225,000', to: 225000, fmt: v => `${v.toLocaleString('en-US')}+`, note: 'depressive episodes within young people over just a year' },
]

export const WHY = [
  'With these mental illnesses showing no sign of ceasing, current approaches do not focus on connections and support systems, leaving millions of teens suffering alone.',
  'MindMap introduces the world’s first wearable patch and app system designed for adolescents, contrary to existing solutions focused on adults, individual health, and driving stigma.',
  'MindMap is the only app that bridges the gap between teens, parents, and Counselors/Professionals to reduce isolation and nurture caring and supportive environments.',
]
/* The sentence set large as the section's pull quote. */
export const WHY_QUOTE = WHY[2]

/* One paragraph per step of the timeline beside it. */
export const PERSONAL = [
  { step: 'Hospital visits',
    text: 'Personally, I was inspired to create MindMap by my grandmother, who has lived with me throughout my entire life, and has been hospitalized for months on end repeatedly over the last 4 years. I empathized with what both the patients and their loved ones experienced on a daily basis.' },
  { step: 'Curiosity',
    text: 'In and out of hospitals, emergency rooms, and rehabs, I noticed the vast struggles and conditions faced by patients and their loved ones daily. I became curious to research a struggle or condition to help these crises, and came across adolescent mental illness. I was shocked to realize the scale of this problem and could relate to the topic from my observations within hospitals, schools, and everyday life.' },
  { step: 'Year-long research',
    text: 'I decided to pursue research in this area, concerning the leading drivers of these harrowing ailments. I conducted a year-long project using machine learning algorithms like XGBOOST to mass-analyze datasets containing adolescent traits, which correlated various factors to adolescent mental illness.' },
  { step: 'MindMap',
    text: 'With the results of this research and a mission to bridge the gap isolating teens from support and growth, I began development of MindMap.' },
]

export const WHAT_LEAD = 'MindMap is the world’s only wearable patch and app system designed exclusively for adolescent wellness. MindMap offers a vast array of features for students, parents, and adolescents including:'

export const FEATURES = [
  { tag: 'Wearable patch', hue: 'mint',
    text: 'A wearable patch that utilizes an originally programmed Neural Additive Model trained on 1.6 million sensor samples with 96% accuracy to analyze biometric data and make intelligent correlations with the unique baseline of each user' },
  { tag: 'Network', hue: 'sky',
    text: 'A completely unique network connecting teens, parents, and Counselors/Professionals at the discretion of the teen’s privacy preferences, reducing stigma and providing the insight to transform lives in a supportive way.' },
  { tag: 'In-app tools', hue: 'lilac',
    text: 'An in-app suite of tools for teens, parents, and Counselors/Professionals for daily care, assistance, and management of teen wellness.',
    tools: [
      { name: 'MindMap AI', text: 'Utilities like MindMap AI are trained by professional medical data from sources like SAMHSA, grounded in clinical guidance to provide understandable and data-backed solutions.' },
      { name: 'Heads Up', text: 'Heads Up offers screen monitoring without the privacy invasion of existing apps, focusing on identifying stress flags and de-escalation as opposed to restriction.' },
      { name: 'MindMap Toolkit', text: 'The innovative MindMap Toolkit provides 20+ activities and teen-friendly approaches to academic success, social dynamics, wellness, and career skills.' },
    ] },
]

export const WHAT_CLOSE = 'MindMap aims to benefit and ease the lives of students, parents, and Counselors/Professionals, whether through in-depth novel data analysis, or original networks connecting teens to support, MindMap is the only solution designed to reduce stigma and bring mental wellness into a positive light.'

export const VISION = [
  'Overall, MindMap aims to ensure that no teen ever feels their invisible stress is invisible alone, turning quiet body signals and metrics into meaningful solutions and support systems that address the teen mental illness epidemic at its very root, an approach never before seen in an app.',
  'MindMap visualizes a world where mental health is no longer a scary topic of discussion, no longer causes stigma, and is no longer contained within the minds of teens alone.',
]
/* The words in the vision line that carry the gold. */
export const VISION_MARK = 'no teen ever feels their invisible stress is invisible alone'

/* Every string a reader sees, for the copy checks in tests/about.test.js. */
export const ALL_TEXT = [
  PROBLEM, ...STATS.map(s => s.note), ...WHY, ...PERSONAL.flatMap(p => [p.step, p.text]),
  WHAT_LEAD, ...FEATURES.flatMap(f => [f.tag, f.text, ...(f.tools || []).flatMap(t => [t.name, t.text])]),
  WHAT_CLOSE, ...VISION, ...PARTS.map(p => p.title),
]
