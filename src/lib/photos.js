/* Photographs are imported through Vite, never linked from public/. Vercel
 * serves public/ with `cache-control: public, max-age=31536000, immutable`, so
 * a replaced file under the same name stays invisible to returning visitors
 * for a year. A Vite import emits a content hash in the filename, so changing
 * a photograph changes its URL and busts the cache by itself.
 * Keyed map, because three components pick a photograph by short key.
 *
 * Every photograph here is a licensed Adobe Stock frame of models. Nobody in
 * them is a MindMap user and no unit has been built or worn, so no caption or
 * alt text anywhere may say or imply otherwise. */
import clinicTalk from '../photos/clinic-talk.webp'
import friendsSteps from '../photos/friends-steps.webp'
import parentCard from '../photos/parent-card.webp'
import parentHero from '../photos/parent-hero.webp'
import parentKitchen from '../photos/parent-kitchen.webp'
import parentLaptop from '../photos/parent-laptop.webp'
import patchWorn from '../photos/patch-worn.webp'
import proHero from '../photos/pro-hero.webp'
import schoolCard from '../photos/school-card.webp'
import studentBasketball from '../photos/student-basketball.webp'
import studentBus from '../photos/student-bus.webp'
import studentCard from '../photos/student-card.webp'
import studentController from '../photos/student-controller.webp'
import studentGame from '../photos/student-game.webp'
import studentHero from '../photos/student-hero.webp'
import studentHomework from '../photos/student-homework.webp'
import studentsHallway from '../photos/students-hallway.webp'

export const PHOTOS = {
  'clinic-talk': clinicTalk,
  'friends-steps': friendsSteps,
  'parent-card': parentCard,
  'parent-hero': parentHero,
  'parent-kitchen': parentKitchen,
  'parent-laptop': parentLaptop,
  'patch-worn': patchWorn,
  'pro-hero': proHero,
  'school-card': schoolCard,
  'student-basketball': studentBasketball,
  'student-bus': studentBus,
  'student-card': studentCard,
  'student-controller': studentController,
  'student-game': studentGame,
  'student-hero': studentHero,
  'student-homework': studentHomework,
  'students-hallway': studentsHallway,
}
