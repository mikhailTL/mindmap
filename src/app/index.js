/* The four app features, for the lead to wire. Each component is
 * self-contained, takes no required props and reads its own state from
 * ./store.js, which is device-only: three localStorage slots, no endpoint, no
 * account, and no fetch anywhere in this directory.
 *
 *   GetHelp                 Button plus sheet, in one element. Mount once in
 *                           AppTopBar in src/views/App.jsx, first in the
 *                           right-hand group before <ModeToggle/>, with
 *                           `compact`. It is then on every app screen,
 *                           including the launcher and the console. Under
 *                           `sm` the compact spelling is the handset mark in a
 *                           44 square with its name on the button rather than
 *                           beside it, because at 390 that row already carries
 *                           the screen name, the demo switch and the way back.
 *   HelpSheet / HelpBody    The same content as a controlled dialog, or as a
 *                           page body. HelpBody wants a `help` route of its
 *                           own as well: the sheet is the fast path, a route
 *                           is the one that can be linked to and reloaded.
 *   NotificationSettings    A new student route, tab label "Reminders".
 *   SharingControls         Route `shared`, in place of <PrivacyBody/> in
 *                           PANES in src/views/Students.jsx.
 *   NotesJournal            A new student route, tab label "Notes".
 *
 * Nothing here imports App.jsx, Students.jsx, Monitor.jsx, Parents.jsx,
 * Pro.jsx, Toolkit.jsx or any chart.
 */
export { GetHelp, HelpBody, HelpSheet } from './Help'
export { NotificationSettings } from './Notifications'
export { SharingControls } from './Sharing'
export { NotesJournal } from './Notes'
