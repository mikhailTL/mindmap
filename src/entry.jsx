import './input.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CHART_DATA } from './lib/chartdata'

globalThis.__DATA = CHART_DATA
/* The DI-03 CAD, for any view that wants the live model rather than a still.
   `__CAD` is the patch on its own; `__CAD_ARM` is the same assembly on a
   forearm, which is the one that shows the thing at the size it is worn. Both
   are meshopt-compressed, and both are design intent — no unit has been
   built, and nothing in either file was measured from hardware. */
globalThis.__CAD = '/di/models/mindmap.glb'
globalThis.__CAD_ARM = '/di/models/mindmap-onarm.glb'
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
