/* Photographs are imported through Vite, never linked from public/. Vercel
 * serves public/ with `cache-control: public, max-age=31536000, immutable`, so
 * a replaced file under the same name stays invisible to returning visitors
 * for a year. A Vite import emits a content hash in the filename, so changing
 * a photograph changes its URL and busts the cache by itself.
 * Keyed map, because three components pick a photograph by short key.
 *
 * Every photograph here is a licensed Adobe Stock frame of models. Some
 * frames (patch-worn, pro-hero, ovw-*, photos-steps-patch, photos-hall-duo)
 * carry a rendering of the patch placed on the arm; the people are models
 * and nobody in them uses MindMap, so no caption or alt text anywhere may say
 * or imply otherwise. */
import clinicTalk from '../photos/clinic-talk.webp'
import friendsSteps from '../photos/friends-steps.webp'
/* Not a photograph: the patch CAD render (public/patch-front-cad.png) with
   its baked mint glow cut away, for How it works (owner, 20 October). */
import hiwPatchCad from '../photos/hiw-patch-cad.webp'
import parentCard from '../photos/parent-card.webp'
import parentHero from '../photos/parent-hero.webp'
import parentKitchen from '../photos/parent-kitchen.webp'
import parentLaptop from '../photos/parent-laptop.webp'
import patchWorn from '../photos/patch-worn.webp'
import ppageMirrorUi from '../photos/ppage-mirror-ui.webp'
import ppageSurveyUi from '../photos/ppage-survey-ui.webp'
import proHero from '../photos/pro-hero.webp'
import schoolCard from '../photos/school-card.webp'
import studentBus from '../photos/student-bus.webp'
import studentCard from '../photos/student-card.webp'
import studentGame from '../photos/student-game.webp'
import studentHero from '../photos/student-hero.webp'
import studentHomework from '../photos/student-homework.webp'
import studentsHallway from '../photos/students-hallway.webp'
import ovwPatchCourt from '../photos/ovw-patch-court.webp'
import ovwProPatch from '../photos/ovw-pro-patch.webp'
import ovwAppBus from '../photos/ovw-app-bus.webp'
import ovwMirrorFace from '../photos/ovw-mirror-face.webp'
/* Owner, 21 October: fewer repeats across pages and as many girls as boys.
   A frame that sat unused, and four new crops: a girl from each of two
   group frames with the patch render placed on her bare upper arm, one more
   girl from the corridor frame, and an empty wall for the home hero. */
import studentController from '../photos/student-controller.webp'
import photosStepsPatch from '../photos/photos-steps-patch.webp'
import photosHallDuo from '../photos/photos-hall-duo.webp'
import photosHallDenim from '../photos/photos-hall-denim.webp'
import photosGameWall from '../photos/photos-game-wall.webp'
import photosKitchenCard from '../photos/photos-kitchen-card.webp'

export const PHOTOS = {
  'clinic-talk': clinicTalk,
  'friends-steps': friendsSteps,
  'hiw-patch-cad': hiwPatchCad,
  'parent-card': parentCard,
  'parent-hero': parentHero,
  'parent-kitchen': parentKitchen,
  'parent-laptop': parentLaptop,
  'patch-worn': patchWorn,
  /* Not photographs: crops of the app's own screens from the local build,
     the Mirror's face mesh and the Survey's first question. */
  'ppage-mirror-ui': ppageMirrorUi,
  'ppage-survey-ui': ppageSurveyUi,
  'pro-hero': proHero,
  'school-card': schoolCard,
  'student-bus': studentBus,
  'student-card': studentCard,
  'student-game': studentGame,
  'student-hero': studentHero,
  'student-homework': studentHomework,
  'students-hallway': studentsHallway,
  'ovw-patch-court': ovwPatchCourt,
  'ovw-pro-patch': ovwProPatch,
  'ovw-app-bus': ovwAppBus,
  'ovw-mirror-face': ovwMirrorFace,
  'student-controller': studentController,
  'photos-steps-patch': photosStepsPatch,
  'photos-hall-duo': photosHallDuo,
  'photos-hall-denim': photosHallDenim,
  'photos-game-wall': photosGameWall,
  'photos-kitchen-card': photosKitchenCard,
}

/* The demo's people are drawn characters now (src/account/characters/), not
   crops of these frames. Owner, 18 October: the crops "look side profiles". */

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
  // The patch render, no face; shown whole, never cropped.
  'hiw-patch-cad': { w: 531, h: 797, focal: [50, 50], minAspect: 0.5, face: false },
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
  // App screen crops, shown whole (object-contain), no face.
  'ppage-mirror-ui': { w: 302, h: 332, focal: [50, 50], minAspect: 0.9, face: false },
  'ppage-survey-ui': { w: 656, h: 386, focal: [50, 50], minAspect: 1.7, face: false },
  // A woman with a notepad (head x 28, y 12 to 35) and a teenager (x 68, y 9
  // to 35) on a sofa, a drawing of the patch on his upper arm at x 77, y 66.
  // The frame has to keep the arm, so it needs three quarters of its height.
  'pro-hero': { w: 1344, h: 752, focal: [50, 40], minAspect: 2.2, face: true },
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
  'students-hallway': { w: 1600, h: 1068, focal: [56, 24], minAspect: 2.6, face: true },
  // Derived (Overview, 20 October). student-basketball cropped to the player,
  // with the patch render (public/patch-front-cad.png) placed on his upper
  // arm at x 38, y 70; face x 42 to 59, y 10 to 38, hair from y 6. Hair to
  // patch needs 70% of the height, so 1.7 is the widest frame it survives.
  'ovw-patch-court': { w: 750, h: 650, focal: [46, 18], minAspect: 1.7, face: true },
  // Derived: pro-hero cropped to 16:10 round the pair, with a contact shadow
  // under the patch at x 71, y 69. Counselor's face x 9 to 19, the teen's
  // x 55 to 63, both y 14 to 36.
  'ovw-pro-patch': { w: 1104, h: 690, focal: [50, 40], minAspect: 2.4, face: true },
  // Derived: student-bus cropped to 16:10 with a phone showing the student
  // Home screen (rendered from this build, demo mode) at x 71 to 98. A laid
  // out picture, so it is shown whole: its own aspect is the ceiling.
  'ovw-app-bus': { w: 1600, h: 1000, focal: [50, 50], minAspect: 1.6, face: true },
  // Derived: student-hero cropped above the game controller in his hands.
  // One centred face, x 43 to 63, y 2 to 50.
  'ovw-mirror-face': { w: 944, h: 650, focal: [53, 30], minAspect: 2.2, face: true },
  // One teenager on a sofa in headphones, head x 54 to 74, y 9 to 38.
  'student-controller': { w: 1600, h: 1067, focal: [60, 24], minAspect: 2.6, face: true },
  // Derived (21 October): friends-steps cropped to the girl, with the patch
  // render on her upper arm at x 8, y 42. Hair from y 6, face x 15 to 37,
  // so the focal point sits high to keep the hair in a wide frame.
  // Focal held left so a narrow upright frame still keeps the arm.
  'photos-steps-patch': { w: 720, h: 900, focal: [10, 12], minAspect: 2.0, face: true },
  // Derived: students-hallway cropped to two girls, the patch render on the
  // left girl's upper arm at x 8, y 41. Faces x 23 to 83, y 6 to 29.
  'photos-hall-duo': { w: 694, h: 730, focal: [40, 26], minAspect: 2.2, face: true },
  // Derived: students-hallway cropped to one girl; face x 32 to 50, y 8 to 20.
  'photos-hall-denim': { w: 390, h: 700, focal: [45, 8], minAspect: 1.5, face: true },
  // Derived: the plain wall and cushions at the left of student-game. No
  // person, so it is a ground behind the home hero's phone.
  'photos-game-wall': { w: 380, h: 720, focal: [50, 40], minAspect: 0.3, face: false },
  // Derived: parent-kitchen cut to a letterbox round both faces (y 8 to 83),
  // for the app's door cards, which are about 2:1.
  'photos-kitchen-card': { w: 1067, h: 530, focal: [52, 45], minAspect: 2.4, face: true },
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
