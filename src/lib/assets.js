/* Chart data is injected at build time as a global so the bundle stays free of
   the generated series (and Tailwind never scans it).

   IMG, POS and MOSAIC used to live here alongside it. Every photograph on this
   site has been removed, so nothing reads them any more. */
export const DATA = globalThis.__DATA || { day:[], band:{lo:0,hi:1}, spark:{}, week:[], weekBand:{lo:0,hi:1}, pro:{} }
