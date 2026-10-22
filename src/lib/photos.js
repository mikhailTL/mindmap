// Photos are imported through Vite so each URL carries a content hash; public/ is served with a one-year immutable cache.
import clinicTalk from '../photos/clinic-talk.webp'
import friendsSteps from '../photos/friends-steps.webp'
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

// Per photo: intrinsic size (px), focal [x%, y%] for object-position, minAspect = widest width/height ratio
// before the subject is cropped, and whether the frame holds a face.
export const PHOTO_META = {
  'clinic-talk': { w: 1600, h: 1066, focal: [50, 36], minAspect: 3.2, face: true },
  'hiw-patch-cad': { w: 531, h: 797, focal: [50, 50], minAspect: 0.5, face: false },
  'friends-steps': { w: 1418, h: 1125, focal: [46, 20], minAspect: 3.0, face: true },
  'parent-card': { w: 1200, h: 423, focal: [52, 38], minAspect: 4.4, face: true },
  'parent-hero': { w: 1344, h: 752, focal: [49, 36], minAspect: 3.0, face: true },
  'parent-kitchen': { w: 1067, h: 1600, focal: [52, 30], minAspect: 1.9, face: true },
  // Parent and child behind an open laptop, faces y 22 to 52.
  'parent-laptop': { w: 1600, h: 1066, focal: [52, 38], minAspect: 3.4, face: true },
  'patch-worn': { w: 1024, h: 688, focal: [44, 40], minAspect: 1.8, face: true },
  // App screen crops, shown whole (object-contain), no face.
  'ppage-mirror-ui': { w: 302, h: 332, focal: [50, 50], minAspect: 0.9, face: false },
  'ppage-survey-ui': { w: 656, h: 386, focal: [50, 50], minAspect: 1.7, face: false },
  'pro-hero': { w: 1344, h: 752, focal: [50, 40], minAspect: 2.2, face: true },
  'school-card': { w: 1200, h: 423, focal: [48, 32], minAspect: 4.2, face: true },
  'student-bus': { w: 1600, h: 1067, focal: [38, 14], minAspect: 3.0, face: true },
  'student-card': { w: 1200, h: 423, focal: [42, 20], minAspect: 4.0, face: true },
  'student-game': { w: 1600, h: 1066, focal: [52, 24], minAspect: 2.8, face: true },
  // One centred subject, head y 5 to 45.
  'student-hero': { w: 1344, h: 752, focal: [52, 26], minAspect: 3.2, face: true },
  'student-homework': { w: 1592, h: 1194, focal: [56, 22], minAspect: 2.8, face: true },
  'students-hallway': { w: 1600, h: 1068, focal: [56, 24], minAspect: 2.6, face: true },
  'ovw-patch-court': { w: 750, h: 650, focal: [46, 18], minAspect: 1.7, face: true },
  'ovw-pro-patch': { w: 1104, h: 690, focal: [50, 40], minAspect: 2.4, face: true },
  'ovw-app-bus': { w: 1600, h: 1000, focal: [50, 50], minAspect: 1.6, face: true },
  'ovw-mirror-face': { w: 944, h: 650, focal: [53, 30], minAspect: 2.2, face: true },
  'student-controller': { w: 1600, h: 1067, focal: [60, 24], minAspect: 2.6, face: true },
  'photos-steps-patch': { w: 720, h: 900, focal: [10, 12], minAspect: 2.0, face: true },
  'photos-hall-duo': { w: 694, h: 730, focal: [40, 26], minAspect: 2.2, face: true },
  'photos-hall-denim': { w: 390, h: 700, focal: [45, 8], minAspect: 1.5, face: true },
  'photos-game-wall': { w: 380, h: 720, focal: [50, 40], minAspect: 0.3, face: false },
  'photos-kitchen-card': { w: 1067, h: 530, focal: [52, 45], minAspect: 2.4, face: true },
}

// Unknown keys are treated as holding a face, the safer assumption for cropping.
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

export const minAspect = key => meta(key).minAspect

// Pixel height needed at this width: the subject's own floor, and 176 px for any frame with a face.
export const minFrameHeight = (key, width) => {
  const m = meta(key)
  const fromSubject = width / m.minAspect
  return Math.ceil(Math.max(fromSubject, m.face ? 176 : 0))
}
