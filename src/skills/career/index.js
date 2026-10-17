/* Career (Professionalism and Future-Building): four tools, one per item in
   the owner's list. The registry, routes and toolkit tabs read this. */
import { META } from './meta.jsx'
import Explore from './explore.jsx'
import Email from './email.jsx'
import Feedback from './feedback.jsx'
import Belong from './belong.jsx'

export const CATEGORY = { id:'career', title:'Career', sub:'Career skills', family:'sky' }

export const TOOLS = [
  { ...META.explore,  Component: Explore },
  { ...META.email,    Component: Email },
  { ...META.feedback, Component: Feedback },
  { ...META.belong,   Component: Belong },
]
