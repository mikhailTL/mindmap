/* MindMap AI, for the lead to wire.
 *
 *   MindMapAI   The screen. One route, `ai`, shared by all three audiences.
 *               Replace <AiPending/> in the route table in src/views/App.jsx
 *               with one line:
 *
 *                 ai: p => <MindMapAI {...p} who={audience}/>,
 *
 *               `who` is 'student' | 'parent' | 'pro' and is the only thing
 *               that differs between the three. `go` arrives with {...p} and
 *               is optional. Nothing else in App.jsx changes, and AiPending
 *               and the ArrowRight import it uses can then go.
 *
 * The framework, the three adaptations and the cited sources are in
 * ./framework.js, read by this screen and by api/mindmap-ai.js so the rules
 * the page prints are the rules the server enforces.
 *
 * Nothing here imports App.jsx, Students.jsx, Parents.jsx, Pro.jsx, Monitor,
 * Toolkit or any chart. The one app import is GetHelp, from src/app/Help.jsx.
 */
export { MindMapAI } from './Ai'
export {
  AUDIENCES, AUDIENCE_IDS, MODEL_DEFAULT, PILLARS, SOURCES,
  pillarSources, systemPrompt,
} from './framework'
