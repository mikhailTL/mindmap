import './input.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { IMAGES, MOSAIC_LIST } from './lib/images'
import { CHART_DATA } from './lib/chartdata'
import { POS } from './lib/images'

globalThis.__IMG = IMAGES
globalThis.__MOSAIC = MOSAIC_LIST
globalThis.__DATA = CHART_DATA
globalThis.__POS = POS
globalThis.__CAD = '/MindMap-Patch-colored.glb'
globalThis.gsap = gsap
globalThis.ScrollTrigger = ScrollTrigger

/* Lenis is gone. It was inherited from the earlier build and nothing here
   needs smooth-scroll inertia, but everything here fights it: four wheel ticks
   of 600px moved the overview 252px, and window.scrollTo(0, 0) — which every
   route change, every opened sensor panel and the check-in result all rely on
   — landed at 1727 instead of the top. Native scroll does all of that
   correctly, and ScrollTrigger's scrubs work on it unchanged. */
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.registerPlugin(ScrollTrigger)
}
import('./main.jsx')
