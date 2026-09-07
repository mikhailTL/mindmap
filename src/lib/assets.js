/* Images and chart data are injected at build time as globals so the bundle
   stays free of several megabytes of base64 (and Tailwind never scans it). */
export const IMG  = globalThis.__IMG  || {}
export const DATA = globalThis.__DATA || { day:[], band:{lo:0,hi:1}, spark:{}, week:[], weekBand:{lo:0,hi:1}, pro:{} }
export const MOSAIC = globalThis.__MOSAIC || []
