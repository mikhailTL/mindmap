/* Every tool a student can finish, by id, and the tab it sits in.
 *
 * Kept as plain strings so the progress store can work out badges without
 * importing any screen (that would pull every tool into every tool). A test
 * checks this list against STUDENT_ITEMS and SKILL_TOOLS, so a new tool that
 * is not added here fails the build's tests rather than silently earning no
 * badge. Order inside a tab is the order the Toolkit shows them. */

export const TABS = [
  { id:'exercise', name:'Exercises' },
  { id:'school',   name:'School' },
  { id:'outside',  name:'Outside' },
  { id:'life',     name:'Life' },
  { id:'career',   name:'Career' },
]

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
