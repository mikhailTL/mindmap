/* Photographs, imported rather than linked.
 *
 * They used to live in public/ and be referenced as `/photos/<name>.webp`.
 * That is a stable URL, which sounds like a virtue and is the opposite of one
 * here: Vercel serves everything under public/ with
 *
 *   cache-control: public, max-age=31536000, immutable
 *
 * `immutable` means a browser will not revalidate the file for a year. So the
 * day every photograph on the site was replaced, nobody who had already
 * visited saw a single new one. The old pictures were still on their disk
 * under the same seven names and the browser had been told, correctly, that
 * those names would never change. The deploy was fine; the URL was the bug.
 *
 * Imported through Vite, each file is emitted with a content hash in its name,
 * so changing a photograph changes its URL and the cache busts itself. The
 * header stays exactly as aggressive, which is what you want for a file whose
 * name already encodes its contents.
 *
 * The map is here and not at the call sites because three different components
 * pick a photograph by a short key held in their own data. */
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
