export const TABS = [
  { id:'exercise', name:'Exercises' },
  { id:'school',   name:'School' },
  { id:'outside',  name:'Outside' },
  { id:'life',     name:'Life' },
  { id:'career',   name:'Career' },
]

// Tool id to tab, as plain strings so progress.js can compute badges without importing any screen.
export const CATALOG = {
  breathing:'exercise', scan:'exercise', move:'exercise', ground:'exercise', reframe:'exercise',
  sigh:'exercise', chest:'exercise', steady:'exercise', alert:'exercise', pocket:'exercise', walk:'exercise',
  'school-cram':'school', 'school-sources':'school', 'school-good-enough':'school', 'school-active':'school',
  'outside-feed':'outside', 'outside-conflict':'outside', 'outside-no':'outside',
  'life-home':'life', 'life-money':'life', 'life-stress':'life', 'life-health':'life',
  'career-explore':'career', 'career-email':'career', 'career-feedback':'career', 'career-belong':'career',
}

export const TOOL_IDS = Object.keys(CATALOG)
export const tabOf = id => CATALOG[id] || null
export const toolsIn = tab => TOOL_IDS.filter(id => CATALOG[id] === tab)
