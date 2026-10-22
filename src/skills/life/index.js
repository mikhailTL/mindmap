import { HomeIcon, MoneyIcon, StressIcon, HealthIcon } from './icons.jsx'
import LifeHome from './home.jsx'
import LifeMoney from './money.jsx'
import LifeStress from './stress.jsx'
import LifeHealth from './health.jsx'

export const CATEGORY = { id: 'life', title: 'Life', sub: 'Wellness', family: 'mint' }

export const TOOLS = [
  { id: 'life-home',   title: 'Home Basics',      line: 'Meals, laundry, car care and the bus',     family: 'sun',   icon: HomeIcon,   Component: LifeHome },
  { id: 'life-money',  title: 'Money Check',      line: 'Track spending and plan a monthly budget',     family: 'mint',  icon: MoneyIcon,  Component: LifeMoney },
  { id: 'life-stress', title: 'Overwhelm Reset',  line: 'Calm down, then pick one next step',    family: 'sky',   icon: StressIcon, Component: LifeStress },
  { id: 'life-health', title: 'Health Basics',    line: 'Doctor visits, medicines and first aid', family: 'coral', icon: HealthIcon, Component: LifeHealth },
]
