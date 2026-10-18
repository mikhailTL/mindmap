import Feed, { FeedIcon } from './feed.jsx'
import Conflict, { ConflictIcon } from './conflict.jsx'
import SayNo, { NoIcon } from './no.jsx'

export const CATEGORY = { id:'outside', title:'Outside', sub:'Social dynamics', family:'blush' }

export const TOOLS = [
  { id:'outside-feed', title:'Feed Check', line:'Check your app time and set limits',
    family:'sky', icon:FeedIcon, Component:Feed },
  { id:'outside-conflict', title:'Say It Calmly', line:'Practice saying how you feel in a disagreement',
    family:'coral', icon:ConflictIcon, Component:Conflict },
  { id:'outside-no', title:'Saying No', line:'Plan and practice saying no',
    family:'lilac', icon:NoIcon, Component:SayNo },
]
