/* Chart data is injected at build time as a global, which keeps the generated
   series out of the bundle and out of Tailwind's class scan. */
export const DATA = globalThis.__DATA || { day:[], band:{lo:0,hi:1}, spark:{}, week:[], weekBand:{lo:0,hi:1}, pro:{} }
