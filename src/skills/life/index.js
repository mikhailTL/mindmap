import { HomeIcon, MoneyIcon, StressIcon, HealthIcon } from './icons.jsx'
import LifeHome from './home.jsx'
import LifeMoney from './money.jsx'
import LifeStress from './stress.jsx'
import LifeHealth from './health.jsx'

/* Life: independence, wellness and emotional resilience. One tool per item
   in the owner's list. Each saves to `mindmap.skills.<id>` on the device. */

export const CATEGORY = { id: 'life', title: 'Life', sub: 'Wellness', family: 'mint' }

export const TOOLS = [
  { id: 'life-home',   title: 'Home Basics',      line: 'Meals, laundry, car, bus',     family: 'sun',   icon: HomeIcon,   Component: LifeHome },
  { id: 'life-money',  title: 'Money Check',      line: 'Find leaks, plan a month',     family: 'mint',  icon: MoneyIcon,  Component: LifeMoney },
  { id: 'life-stress', title: 'Overwhelm Reset',  line: 'Body check, then one step',    family: 'sky',   icon: StressIcon, Component: LifeStress },
  { id: 'life-health', title: 'Own Your Health',  line: 'Visits, medicines, first aid', family: 'coral', icon: HealthIcon, Component: LifeHealth },
]
