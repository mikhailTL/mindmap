// Chart series are read from a global set in entry.jsx; the fallback keeps charts rendering when it is absent.
export const DATA = globalThis.__DATA || { day:[], band:{lo:0,hi:1}, spark:{}, week:[], weekBand:{lo:0,hi:1}, pro:{} }
