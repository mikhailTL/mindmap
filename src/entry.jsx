import './input.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { IMAGES, MOSAIC_LIST } from './lib/images'
import { CHART_DATA } from './lib/chartdata'

globalThis.__IMG = IMAGES
globalThis.__MOSAIC = MOSAIC_LIST
globalThis.__DATA = CHART_DATA
globalThis.gsap = gsap
globalThis.ScrollTrigger = ScrollTrigger

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.registerPlugin(ScrollTrigger)
  const l = new Lenis({ duration: 1.05, smoothWheel: true })
  l.on('scroll', ScrollTrigger.update)
  gsap.ticker.add(t => l.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
}
import('./main.jsx')
