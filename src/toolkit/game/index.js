/* The shared game layer for the student Toolkit.
 *
 * Rules it keeps: points come from effort in one session; the level only
 * grows; no dates are stored, so there are no streaks and a missed day costs
 * nothing; no score is ever shown next to anyone else's. Progress lives in
 * localStorage under `mindmap.toolkit.progress` (every access wrapped).
 *
 * API (stable; P9c imports this):
 *
 *   const g = useGame('sigh')          one session for a tool id
 *     g.points                         this round's score (shown as "Score";
 *                                      never added to the level)
 *     g.add(n, { x, y, sound, label }) add points; floats "+n" at x/y percent
 *                                      inside the nearest <Pops/> box;
 *                                      sound: 'tick' | 'good' | 'turn' | 'low'
 *     g.cue(kind)                      play a sound only (if sound is on)
 *     g.finish({ complete, marks })    store the session once, returns result.
 *                                      Points come ONLY from a finish: 20, +10
 *                                      the first time a tool is finished, +5
 *                                      when marks has 'clean'. complete:false
 *                                      (an early end) pays 0. Without
 *                                      `complete`, a tap on End round / End
 *                                      hunt / End walk / Stop just before
 *                                      counts as an early end. marks: 'plan',
 *                                      'script', 'clean', 'firstaid' (badges).
 *     g.result                         null until finish(), then
 *                                      { complete, points, parts, score, before,
 *                                        after, levelUp, opened, badges }
 *     g.reset()                        clear the session for Play again
 *     g.vars                           style object: --g-main, --g-ink, --g-wash
 *                                      (put it on the game's wrapper)
 *     g.ring                           the picked ring style, for FillRing
 *     g.reduced                        prefers-reduced-motion
 *
 *   <GameBar game={g}>{extra}</GameBar> session points + sound toggle
 *   <Score game={g}/>                  session points alone
 *   <Pops game={g}/>                   the floating +n; parent must be `relative`
 *   <FillRing value={0..1} ring={g.ring}>{centre}</FillRing>
 *   <LevelMeter/>                      Level N and a bar; for the idle screen
 *   <Countdown from={3} onDone={fn}/>  3, 2, 1 then onDone
 *   <EndCard game={g} title stats={[[label, value]]} onAgain={fn} againLabel onDone doneLabel>
 *                                      result, level ring, unlocks, new badges
 *   Life skills pieces live in ./skill.jsx (Quest, QuickRound, Answer,
 *   GoalMeter, Win, useSkill). The Toolkit header is ./PlayerCard.jsx.
 *   <SoundToggle/>  <ThemePicker/>
 *
 *   useProgress()                      the stored progress, live
 *   gameVars(themeId)                  the CSS vars for a colour
 *   recordSession(tool, points)        what finish() calls
 *   levelFor(total) -> { level, into, need, pct }
 *   THEMES, RINGS, PROGRESS_KEY
 *
 * Colours: draw graphics with var(--g-main); words in var(--g-ink) only;
 * grounds in var(--g-wash). */

export { useGame, useProgress, gameVars, Pops, FillRing, Score, SoundToggle, GameBar,
         LevelMeter, ThemePicker, Countdown, EndCard } from './parts'
export { recordSession, readProgress, levelFor, setPick, THEMES, RINGS, PROGRESS_KEY,
         unlocksAt, themeById, recordFinish, awardFor, levelName, levelStart, LEVEL_NAMES,
         BADGES, badgeById, badgesFor, suggestNext, FINISH_POINTS, NEW_TOOL_BONUS, CLEAN_BONUS } from './progress'
export { BadgeIcon } from './badges'
export { CATALOG, TABS, TOOL_IDS, tabOf, toolsIn } from './catalog'
export { playSound, wakeSound } from './sound'
