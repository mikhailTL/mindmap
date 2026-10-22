import React from 'react'

// Kept apart from index.js so a tool can read its own entry without importing the other tools.
const I = ({ children }) => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden focusable="false"
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
    className="shrink-0">{children}</svg>
)

export const ExploreIcon  = () => <I><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5M8.5 11h5M11 8.5v5"/></I>
export const EmailIcon    = () => <I><rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/></I>
export const FeedbackIcon = () => <I><path d="M4 5h12v8H8l-4 3z"/><path d="M14 17l2.5 2.5L21 15"/></I>
export const BelongIcon   = () => <I><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/></I>

export const META = {
  explore:  { id:'career-explore',  title:'Try a Career',        line:'Try out careers with small tests', family:'sun',   icon:ExploreIcon },
  email:    { id:'career-email',    title:'Professional Email',  line:'Write emails and prepare for interviews',   family:'sky',   icon:EmailIcon },
  feedback: { id:'career-feedback', title:'Feedback Notes',      line:'Turn feedback into one skill to work on',       family:'mint',  icon:FeedbackIcon },
  belong:   { id:'career-belong',   title:'Speak Up for Yourself', line:'List your wins and ask for what you need',         family:'lilac', icon:BelongIcon },
}
