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
import schoolCard from '../photos/school-card.webp'
import studentBus from '../photos/student-bus.webp'
import studentCard from '../photos/student-card.webp'
import studentGame from '../photos/student-game.webp'
import studentHero from '../photos/student-hero.webp'
import studentHomework from '../photos/student-homework.webp'
import studentsHallway from '../photos/students-hallway.webp'
import avatarCounselorA from '../photos/avatar-counselor-a.webp'
import avatarCounselorB from '../photos/avatar-counselor-b.webp'
import avatarParentA from '../photos/avatar-parent-a.webp'

export const PHOTOS = {
  'clinic-talk': clinicTalk,
  'friends-steps': friendsSteps,
  'parent-card': parentCard,
  'parent-hero': parentHero,
  'parent-kitchen': parentKitchen,
  'parent-laptop': parentLaptop,
  'patch-worn': patchWorn,
  'school-card': schoolCard,
  'student-bus': studentBus,
  'student-card': studentCard,
  'student-game': studentGame,
  'student-hero': studentHero,
  'student-homework': studentHomework,
  'students-hallway': studentsHallway,
}

/* 160px square crops of three frames above, for the demo's people: the man
   in clinic-talk, the woman in pro-hero.webp (both shown as Counselors/
   Professionals) and the woman in parent-kitchen (a parent). Models, not
   MindMap users: each is drawn with alt="" beside a demo name. Owner, 18
   October: "counselors should use uploaded professional images, make that
   apparent in the demo". Read by src/account/avatars.jsx as photo-<key>. */
export const AVATAR_PHOTOS = {
  'counselor-a': avatarCounselorA,
  'counselor-b': avatarCounselorB,
  'parent-a': avatarParentA,
}

/* ---------------------------------------------------------------------------
 * Framing data, recorded once, per spec 0d rule 4:
 *
 *   "many of the stock images are cutoff and hinder the design significantly,
 *    so make sure each frame is adjusted and optmized for the contained images"
 *
 * Before this table every frame on the site used the browser default or a
 * hand-copied `object-[50%_32%]`, which is why three teenagers were cut off at
 * the chin in the wide strip, why two students were sliced down the middle in
 * a card, and why the landing-page cards lost their subjects off the left
 * edge. A photograph's subject does not sit at the same place in every file,
 * so the position is a property of the file and belongs here, next to its
 * dimensions, and not at the call site.
 *
 * Fields, per key:
 *
 *   w, h        intrinsic pixel size, read with `identify`. The browser needs
 *               both to reserve the box before the file lands.
 *   focal       [x, y] in percent, passed straight to CSS object-position.
 *               It is the centre of the region that must survive any crop:
 *               the band from the top of the highest head to a little below
 *               the lowest chin, and the horizontal midpoint of the faces.
 *   minAspect   the SHORTEST frame this photograph survives, as width divided
 *               by height. A box wider than `minAspect` per unit of height
 *               starts cutting the subject, so it is a ceiling on width : a
 *               taller box is always safe. Derived from how much of the file's
 *               height (or width, where the subjects spread sideways) has to
 *               stay visible.
 *   face        true when the frame contains a human face, which is what makes
 *               the 170px floor in spec 0d rule 4 apply to any box holding it.
 *
 * Every focal point below was measured by eye against a 10 percent grid laid
 * over the file itself, not inferred from the filename.
 * ------------------------------------------------------------------------- */
export const PHOTO_META = {
  // Two figures on a sofa, boy at x 38, the other at x 68; heads run y 24 to 48.
  'clinic-talk': { w: 1600, h: 1066, focal: [50, 36], minAspect: 3.2, face: true },
  // Two students on steps, heads y 8 to 32, shoulders apart at x 28 and x 62.
  'friends-steps': { w: 1418, h: 1125, focal: [46, 20], minAspect: 3.0, face: true },
  // A letterbox crop of parent-laptop; both faces sit low, y 12 to 65.
  'parent-card': { w: 1200, h: 423, focal: [52, 38], minAspect: 4.4, face: true },
  // Parent and child at a laptop, faces y 15 to 62, the pair centred at x 49.
  'parent-hero': { w: 1344, h: 752, focal: [49, 36], minAspect: 3.0, face: true },
  // The one portrait file. Faces y 17 to 42; a wide strip of it is all ceiling.
  'parent-kitchen': { w: 1067, h: 1600, focal: [52, 30], minAspect: 1.9, face: true },
  // Parent and child behind an open laptop, faces y 22 to 52.
  'parent-laptop': { w: 1600, h: 1066, focal: [52, 38], minAspect: 3.4, face: true },
  // Face high at y 2 to 40 and the patch low on the arm near x 57, y 78, so
  // this one needs most of its own height before it says what it is for.
  'patch-worn': { w: 1024, h: 688, focal: [44, 40], minAspect: 1.8, face: true },
  // Letterbox already. Two women turned towards each other at x 27 and x 68.
  'school-card': { w: 1200, h: 423, focal: [48, 32], minAspect: 4.2, face: true },
  // Two boys on a bus seat, the left head almost touching the top edge, so the
  // focal point sits high: anything lower crops hair off the blond boy.
  'student-bus': { w: 1600, h: 1067, focal: [38, 14], minAspect: 3.0, face: true },
  // Five teenagers walking, faces strung from x 15 to x 70 at y 8 to 35.
  'student-card': { w: 1200, h: 423, focal: [42, 20], minAspect: 4.0, face: true },
  // Three boys on a sofa, heads stepping up from y 20 on the left to y 8 on
  // the right, which is what the old 50% 34% was cutting at the eyebrow.
  'student-game': { w: 1600, h: 1066, focal: [52, 24], minAspect: 2.8, face: true },
  // One centred subject, head y 5 to 45.
  'student-hero': { w: 1344, h: 752, focal: [52, 26], minAspect: 3.2, face: true },
  // Head at the top edge and well right of centre, at x 56, y 2 to 35.
  'student-homework': { w: 1592, h: 1194, focal: [56, 22], minAspect: 2.8, face: true },
  // Four students across a corridor, x 15 to x 90, heads y 8 to 38. The widest
  // spread of faces on the site, so the shortest frame it survives is 2.6.
  'students-hallway': { w: 1600, h: 1068, focal: [50, 24], minAspect: 2.6, face: true },
}

/* A key nobody recorded still has to render. 16:9ish, centred, and treated as
   holding a face, because assuming it does is the safe way to be wrong. */
const FALLBACK = { w: 1600, h: 1066, focal: [50, 40], minAspect: 2.6, face: true }

export const meta = key => PHOTO_META[key] || FALLBACK

/* [width, height] in intrinsic pixels, for the img attributes. */
export const dims = key => {
  const m = meta(key)
  return [m.w, m.h]
}

/* The CSS object-position string for a key, e.g. '62% 24%'. */
export const focal = key => {
  const [x, y] = meta(key).focal
  return `${x}% ${y}%`
}

/* The shortest frame this photograph survives, as width divided by height. */
export const minAspect = key => meta(key).minAspect

/* Whether a box of this width is tall enough to hold the photograph. Two
   floors apply: the subject's own, and the flat 170px that spec 0d rule 4 puts
   under any frame containing a face. Returns a pixel height. */
export const minFrameHeight = (key, width) => {
  const m = meta(key)
  const fromSubject = width / m.minAspect
  return Math.ceil(Math.max(fromSubject, m.face ? 176 : 0))
}
