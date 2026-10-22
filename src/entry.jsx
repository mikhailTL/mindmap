import './input.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CHART_DATA } from './lib/chartdata'

// Globals are set before main.jsx is imported, because modules read them at load time.
globalThis.__DATA = CHART_DATA
globalThis.gsap = gsap
globalThis.ScrollTrigger = ScrollTrigger

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.registerPlugin(ScrollTrigger)
}
import('./main.jsx')
