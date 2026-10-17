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
 *     g.points                         this session's points
 *     g.add(n, { x, y, sound, label }) add points; floats "+n" at x/y percent
 *                                      inside the nearest <Pops/> box;
 *                                      sound: 'tick' | 'good' | 'turn' | 'low'
 *     g.cue(kind)                      play a sound only (if sound is on)
 *     g.finish()                       store the session once, returns result
 *     g.result                         null until finish(), then
 *                                      { points, before, after, levelUp, opened }
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
 *   <EndCard game={g} title stats={[[label, value]]} onAgain={fn}>{extra}</EndCard>
 *                                      result, level ring, unlocks, one Play again
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
         unlocksAt, themeById } from './progress'
export { playSound, wakeSound } from './sound'
