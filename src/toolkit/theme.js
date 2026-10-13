/* One colour per activity, inside the green/white/turquoise system.
 *
 * design-spec 0d section 1 retires coral, lilac, sun, mint, sky and blush, and
 * reserves warn and crit for out-of-range and critical. src/kit/palette.js
 * still carries a `sand` family built on warn.wash, which is the cream the
 * owner struck out, so the Toolkit no longer reads from it. The family names
 * avoid the retired hue names as well: there is no `sky` here, because `sky`
 * is one of the six colours spec 0d retires and a reader grepping for it
 * should find nothing. Five families,
 * every value a token already in tailwind.config.js, written as hex because
 * these are handed to CSS custom properties rather than to class names.
 *
 *   tint  the card ground. A near-white, never a saturated fill.
 *   deep  the family ink. Clears 4.5 : 1 on its own tint and on card, so
 *         anything drawn in it may also be a word.
 *   art   the family second tone, for flat blocks and for the offset shadow.
 *         Clears 3 : 1, the floor a non-text graphic owes, and never carries
 *         a text node.
 *
 * Measured against tint, then against card:
 *   leaf  deep #07544f  7.23 / 8.79    art #0a6e68  5.02 / 6.10
 *   tide  deep #11677f  5.47 / 6.42    art #1d8fb0  3.19 / 3.74
 *   stone deep #1f5560  6.47 / 8.31    art #3c6a74  4.66 / 5.99
 *   night deep #0b2b33 12.34 / 14.92   art #0a6e68  5.04 / 6.10
 *   pool  deep #07544f  8.22 / 8.79    art #11677f  5.98 / 6.42
 *
 * The four .kit-* helpers in src/kit/kit.css read these, so a control several
 * files down inherits its activity's colour without being passed a class. */

export const FAMILIES = {
  leaf:  { tint:'#d6eeeb', deep:'#07544f', art:'#0a6e68' },  // accent.wash / accent.ink / accent
  tide:  { tint:'#ddf0f8', deep:'#11677f', art:'#1d8fb0' },  // beam.wash  / beam.ink   / beam
  stone: { tint:'#cee8ea', deep:'#1f5560', art:'#3c6a74' },  // aqua.2     / ink.2      / ink.3
  night: { tint:'#dfecee', deep:'#0b2b33', art:'#0a6e68' },  // mist       / ink        / accent
  pool:  { tint:'#edf7f7', deep:'#07544f', art:'#11677f' },  // aqua       / accent.ink / beam.ink
}

/* The four properties a surface sets on itself. `--kit-glow` is deliberately
   absent: the mint it used to carry is not in the green/white/turquoise set. */
export function vars(name) {
  const f = FAMILIES[name] || FAMILIES.leaf
  return { '--kit-tint':f.tint, '--kit-deep':f.deep, '--kit-art':f.art }
}

export const familyOf = name => FAMILIES[name] || FAMILIES.leaf
