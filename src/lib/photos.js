/* Photographs are imported through Vite, never linked from public/. Vercel
 * serves public/ with `cache-control: public, max-age=31536000, immutable`, so
 * a replaced file under the same name stays invisible to returning visitors
 * for a year. A Vite import emits a content hash in the filename, so changing
 * a photograph changes its URL and busts the cache by itself.
 * Keyed map, because three components pick a photograph by short key. */
import parentCard from '../photos/parent-card.webp'
import parentHero from '../photos/parent-hero.webp'
import patchWorn from '../photos/patch-worn.webp'
import proHero from '../photos/pro-hero.webp'
import schoolCard from '../photos/school-card.webp'
import studentCard from '../photos/student-card.webp'
import studentHero from '../photos/student-hero.webp'

export const PHOTOS = {
  'parent-card': parentCard,
  'parent-hero': parentHero,
  'patch-worn': patchWorn,
  'pro-hero': proHero,
  'school-card': schoolCard,
  'student-card': studentCard,
  'student-hero': studentHero,
}
