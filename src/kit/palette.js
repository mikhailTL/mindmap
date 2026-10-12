/* One colour per activity.
 *
 * design-spec.md section 7b carves the toolkit out of the site's restraint and
 * lets colour carry feeling here rather than only status, so that ten
 * activities read as ten different things instead of one stack of identical
 * cards. This file is the whole of that decision, in one place, so no
 * component picks a colour on its own.
 *
 * Every value is a token already in tailwind.config.js, written here as its
 * hex because these are handed to CSS custom properties rather than to class
 * names: a component deep inside an activity cannot be given a Tailwind class
 * it does not know at build time, but it can inherit a variable. If a token
 * moves in the config, it moves here too.
 *
 * Five families, used by both lists, so neither list is one hue with five
 * shades. Each family is three values:
 *
 *   tint  the card's ground. A wash, never a saturated fill. Young people
 *         asked for exactly this in the Western Sydney aesthetics study:
 *         muted over vivid, because a bright screen on a bad day "is shouty,
 *         it hurts your head".
 *   deep  the family's ink. Clears 4.5 : 1 on its own tint AND on card, so
 *         anything drawn in it may also be a word.
 *   art   the family's second tone, for flat blocks inside a drawing. Clears
 *         3 : 1 on tint and on card, which is the floor for a graphic, and is
 *         never given a text node.
 *
 * Measured, tint then card:
 *   sky   deep #11677f 5.47 / 6.42   art #1d8fb0 3.19 / 3.74
 *   leaf  deep #07544f 7.23 / 8.79   art #0a6e68 5.02 / 6.10
 *   sand  deep #8f5a0c 4.92 / 5.78   art #8f5a0c 4.92 / 5.78
 *   stone deep #1f5560 6.47 / 8.31   art #3c6a74 4.66 / 5.99
 *   dusk  deep #0b2b33 12.34 / 14.92 art #0a6e68 5.04 / 6.10
 *
 * crit red is absent on purpose and is not available to this file. It is the
 * site's alarm, and the same study found a harsh red reads as an emergency
 * app, which is the one thing a toolkit must not look like.
 *
 * `glow` is the mint, and it is only ever drawn on `deep` or on ink, where it
 * measures 8.26 : 1. It never touches a tint. */

const GLOW = '#3fd6c4'                                   // accent.lit

export const FAMILIES = {
  sky:   { tint:'#ddf0f8', deep:'#11677f', art:'#1d8fb0', glow:GLOW },  // beam.wash / beam.ink / beam
  leaf:  { tint:'#d6eeeb', deep:'#07544f', art:'#0a6e68', glow:GLOW },  // accent.wash / accent.ink / accent
  sand:  { tint:'#f5ecdb', deep:'#8f5a0c', art:'#8f5a0c', glow:GLOW },  // warn.wash / warn
  stone: { tint:'#cee8ea', deep:'#1f5560', art:'#3c6a74', glow:GLOW },  // aqua.2 / ink.2 / ink.3
  dusk:  { tint:'#dfecee', deep:'#0b2b33', art:'#0a6e68', glow:GLOW },  // mist / ink / accent
}

/* Which activity owns which. Both lists run through all five, so a reader
   scrolling either one never meets the same colour twice in a row. */
export const OWNS = {
  pacer:'sky', feelings:'leaf', words:'sand', senses:'stone', pile:'dusk',
  openers:'leaf', phrase:'sky', meaning:'stone', before:'dusk', worried:'sand',
}

/* The custom properties a panel sets on itself. Everything inside it, however
   deep, reads these through the .kit-* helpers in kit.css. */
export function vars(id) {
  const f = FAMILIES[OWNS[id]] || FAMILIES.leaf
  return { '--kit-tint':f.tint, '--kit-deep':f.deep, '--kit-art':f.art, '--kit-glow':f.glow }
}

export const familyOf = id => FAMILIES[OWNS[id]] || FAMILIES.leaf

/* The same four properties for a surface that is not an activity: the page's
   own intro, the chooser, the closing line. They are part of the set and are
   drawn in the set's language, so they take a family by name. */
export function varsFamily(name) {
  const f = FAMILIES[name] || FAMILIES.leaf
  return { '--kit-tint':f.tint, '--kit-deep':f.deep, '--kit-art':f.art, '--kit-glow':f.glow }
}
