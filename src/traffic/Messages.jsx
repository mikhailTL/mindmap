import React from 'react'
import { IOS, StatusBar } from './ios'
import { cn } from '../lib/utils'

/* A text conversation drawn the way the iPhone draws one: the frosted header
 * with the contact, grey bubbles in, blue bubbles out, the field and the
 * keyboard under it. It is live. Messages arrive after the typing dots, and
 * every key, whether the demo pressed it, the visitor clicked a drawn key or
 * typed on their own keyboard, goes out through `onKey(del)` and nothing
 * else: the engine learns that a key was pressed and whether it deleted,
 * never which key.
 *
 * Props:
 *   active     false pauses the dots and the caret
 *   onKey      (del) for every key press, from every source
 *   handleRef  ref; set to { key(del, ch), send(), receive(text, ms),
 *              focus(), reset() }
 *   reduced    bubbles and keys change in place, nothing slides or pops
 *   autoReply  when true, the contact answers a visitor's own message */

const BLUE = IOS.blue
const GREY = IOS.grey
const SECONDARY = IOS.secondary
const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)'

const CONTACT = 'Jordan'

const SEED = [
  { me: false, text: 'did you finish the bio worksheet' },
  { me: true, text: 'almost, question 6 is weird' },
  { me: false, text: 'same' },
  { me: false, text: 'are you going to mayas saturday' },
  { me: true, text: 'probably, what time' },
]
const REPLIES = ['ok', 'haha same', 'wait really', 'ok text me later', 'lol']
const MAX_BUBBLES = 40

const KEYFRAMES = `
@keyframes mm-msg-dot { 0%, 60%, 100% { opacity: .3; transform: scale(.9) } 30% { opacity: 1; transform: scale(1) } }
@keyframes mm-msg-caret { 0%, 49% { opacity: 1 } 50%, 100% { opacity: 0 } }
`

/* ── the keyboard ───────────────────────────────────────────────────────── */

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']
const PAD_X = 3
const GAP = 6
const KW = (393 - PAD_X * 2 - GAP * 9) / 10
const KH = 42
const ROW_GAP = 12
const KEY_BG = '#ffffff'
const FN_BG = '#abb0ba'
const BOARD_BG = '#d1d4da'
const KEY_SHADOW = '0 1px 0 rgba(0,0,0,0.3)'
const FN_W = 92

function Mic({ size = 18, color }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <rect x="6.2" y="1.5" width="5.6" height="9.6" rx="2.8" fill={color} stroke="none"/>
      <path d="M3.6 8.4a5.4 5.4 0 0 0 10.8 0M9 13.8v2.7"/>
    </svg>
  )
}

/* which drawn key a character or a physical key lands on */
function keyIdFor(ch, del) {
  if (del) return 'del'
  if (ch == null) return null
  if (ch === ' ') return 'space'
  if (ch === '\n' || ch === 'Enter') return 'return'
  if (ch === 'Backspace' || ch === 'Delete') return 'del'
  if (ch === 'Shift') return 'shift'
  const c = ch.toLowerCase()
  return c.length === 1 && c >= 'a' && c <= 'z' ? c : null
}

/* The magnified key iOS shows above a letter while it is held: a wide
   rounded head that narrows into the key itself. `dx` is where the key sits
   inside the head, so the edge keys lean inward instead of leaving the screen. */
function Balloon({ ch, dx }) {
  const w = KW, bw = KW + 22, bh = 54, neck = 12, total = bh + neck + KH, r = 9
  const kl = dx, kr = dx + w
  const d = [
    `M ${r} 0 H ${bw - r} Q ${bw} 0 ${bw} ${r} V ${bh - 6}`,
    `C ${bw} ${bh + neck * 0.5} ${kr} ${bh + neck * 0.4} ${kr} ${bh + neck}`,
    `V ${total - 5} Q ${kr} ${total} ${kr - 5} ${total} H ${kl + 5} Q ${kl} ${total} ${kl} ${total - 5}`,
    `V ${bh + neck} C ${kl} ${bh + neck * 0.4} 0 ${bh + neck * 0.5} 0 ${bh - 6}`,
    `V ${r} Q 0 0 ${r} 0 Z`,
  ].join(' ')
  return (
    <span aria-hidden className="pointer-events-none absolute z-20"
      style={{ left: -dx, bottom: 0, width: bw, height: total }}>
      <svg width={bw} height={total} viewBox={`0 0 ${bw} ${total}`} className="absolute inset-0"
        style={{ filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.35)) drop-shadow(0 0 0.5px rgba(0,0,0,0.3))' }}>
        <path d={d} fill={KEY_BG}/>
      </svg>
      <span className="absolute inset-x-0 top-0 text-center font-light"
        style={{ fontSize: 34, lineHeight: `${bh}px`, color: '#000' }}>{ch}</span>
    </span>
  )
}

function Key({ id, label, width, fn, pressed, popup, dx = 11, onPress, children }) {
  const down = pressed?.id === id
  const bg = fn ? (down ? KEY_BG : FN_BG) : (down && !popup ? FN_BG : KEY_BG)
  return (
    <button type="button" tabIndex={-1}
      onPointerDown={e => { e.preventDefault(); onPress(id) }}
      className="relative flex shrink-0 items-center justify-center rounded-[5px] outline-none"
      style={{ width, height: KH, background: bg, boxShadow: KEY_SHADOW, color: '#000', touchAction: 'manipulation' }}>
      {children ?? <span className={cn(fn ? 'text-[16px]' : 'text-[22.5px] font-light')}>{label}</span>}
      {down && popup && <Balloon ch={label} dx={dx}/>}
    </button>
  )
}

function Keyboard({ pressed, shift, popups, onPress }) {
  const letter = (c, i, row) => {
    const last = ROWS[row].length - 1
    /* the outermost keys of each row lean their balloon inward */
    const dx = row !== 2 && i === 0 ? 3 : row !== 2 && i === last ? 19 : 11
    const label = shift ? c.toUpperCase() : c
    return <Key key={c} id={c} label={label} width={KW} pressed={pressed} popup={popups} dx={dx} onPress={onPress}/>
  }
  const row = { display: 'flex', justifyContent: 'center', gap: GAP, height: KH }
  return (
    <div aria-hidden className="relative z-10 shrink-0 select-none"
      style={{ background: BOARD_BG, padding: `8px ${PAD_X}px 0`, height: 8 + KH * 4 + ROW_GAP * 3 + 44 + 4 }}>
      <div style={row}>{[...ROWS[0]].map((c, i) => letter(c, i, 0))}</div>
      <div style={{ ...row, marginTop: ROW_GAP }}>{[...ROWS[1]].map((c, i) => letter(c, i, 1))}</div>
      <div style={{ ...row, marginTop: ROW_GAP, justifyContent: 'space-between' }}>
        <Key id="shift" fn width={42} pressed={shift ? { id: 'shift' } : pressed} onPress={onPress}>
          <svg width="19" height="17" viewBox="0 0 19 17" fill={shift ? '#000' : 'none'} stroke="#000" strokeWidth="1.4" strokeLinejoin="round">
            <path d="M9.5 1.2 1.6 9.3h4.3v6.2h7.2V9.3h4.3Z"/>
          </svg>
        </Key>
        <div style={{ display: 'flex', gap: GAP }}>{[...ROWS[2]].map((c, i) => letter(c, i, 2))}</div>
        <Key id="del" fn width={42} pressed={pressed} onPress={onPress}>
          <svg width="23" height="17" viewBox="0 0 23 17" fill="none" stroke="#000" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
            <path d="M7.2 1.2h12.6a2 2 0 0 1 2 2v10.6a2 2 0 0 1-2 2H7.2L1.2 8.5Z"/>
            <path d="m10.6 5.4 6.2 6.2m0-6.2-6.2 6.2"/>
          </svg>
        </Key>
      </div>
      {/* on a phone with Face ID the bottom row is 123, space, return; the
          emoji and dictation keys sit in the strip under it */}
      <div style={{ ...row, marginTop: ROW_GAP, justifyContent: 'flex-start' }}>
        <Key id="123" fn label="123" width={FN_W} pressed={pressed} onPress={onPress}/>
        <Key id="space" label="space" width={393 - PAD_X * 2 - FN_W * 2 - GAP * 2} pressed={pressed} onPress={onPress}/>
        <Key id="return" fn label="return" width={FN_W} pressed={pressed} onPress={onPress}/>
      </div>
      <div className="flex items-start justify-between" style={{ height: 44, padding: '9px 22px 0 21px' }}>
        <svg width="26" height="26" viewBox="0 0 22 22" fill="none" stroke="#50555c" strokeWidth="1.4" strokeLinecap="round">
          <circle cx="11" cy="11" r="9.3"/>
          <circle cx="7.9" cy="8.7" r="0.6" fill="#50555c"/><circle cx="14.1" cy="8.7" r="0.6" fill="#50555c"/>
          <path d="M6.8 12.6c1 1.9 2.5 2.8 4.2 2.8s3.2-.9 4.2-2.8"/>
        </svg>
        <Mic size={26} color="#50555c"/>
      </div>
    </div>
  )
}

/* ── the thread ─────────────────────────────────────────────────────────── */

/* The tail is the familiar two-layer trick: a coloured curve, then a curve
   the colour of the thread cut out of it. It only works on a white thread. */
function Tail({ me }) {
  const fill = me ? BLUE : GREY
  const side = me ? 'right' : 'left'
  return (
    <>
      <span aria-hidden style={{
        position: 'absolute', bottom: 0, [side]: -7, height: 20, width: 20, background: fill,
        [me ? 'borderBottomLeftRadius' : 'borderBottomRightRadius']: 16,
      }}/>
      <span aria-hidden style={{
        position: 'absolute', bottom: 0, [side]: -10, height: 20, width: 10, background: '#fff',
        [me ? 'borderBottomLeftRadius' : 'borderBottomRightRadius']: 10,
      }}/>
    </>
  )
}

function Bubble({ b, tail, gapTop, reduced }) {
  const ref = React.useRef(null)
  React.useLayoutEffect(() => {
    if (!b.fresh || reduced || !ref.current?.animate) return
    ref.current.animate(b.me
      ? [{ transform: 'translateY(58px) scale(0.92)', opacity: 0.4 }, { transform: 'none', opacity: 1 }]
      : [{ transform: 'scale(0.82)', opacity: 0 }, { transform: 'none', opacity: 1 }],
    { duration: b.me ? 340 : 260, easing: EASE })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className={cn('flex', b.me ? 'justify-end' : 'justify-start')} style={{ marginTop: gapTop }}>
      <div ref={ref} className="relative max-w-[75%] break-words"
        style={{
          background: b.me ? BLUE : GREY, color: b.me ? '#fff' : '#000',
          borderRadius: 18, padding: '7px 12px', fontSize: 17, lineHeight: '22px',
          letterSpacing: '-0.01em', transformOrigin: b.me ? '100% 100%' : '0 100%',
        }}>
        {tail && <Tail me={b.me}/>}
        <span className="relative">{b.text}</span>
      </div>
    </div>
  )
}

function TypingDots({ running, reduced, gapTop }) {
  const ref = React.useRef(null)
  React.useLayoutEffect(() => {
    if (reduced || !ref.current?.animate) return
    ref.current.animate([{ transform: 'scale(0.6)', opacity: 0 }, { transform: 'none', opacity: 1 }],
      { duration: 220, easing: EASE })
  }, [reduced])
  return (
    <div className="flex justify-start" style={{ marginTop: gapTop }} aria-label={`${CONTACT} is typing`} role="img">
      <div ref={ref} className="relative flex items-center gap-[5px]"
        style={{ background: GREY, borderRadius: 18, padding: '13px 15px', transformOrigin: '0 100%' }}>
        {[0, 1, 2].map(i => (
          <span key={i} className="block rounded-full"
            style={{ width: 8, height: 8, background: '#8e8e93',
              opacity: reduced ? 0.4 + i * 0.25 : undefined,
              animation: reduced ? 'none' : `mm-msg-dot 1.2s ease-in-out ${i * 0.18}s infinite`,
              animationPlayState: running ? 'running' : 'paused' }}/>
        ))}
        <span aria-hidden className="absolute rounded-full" style={{ left: -3, bottom: -2, width: 11, height: 11, background: GREY }}/>
        <span aria-hidden className="absolute rounded-full" style={{ left: -8, bottom: -7, width: 5, height: 5, background: GREY }}/>
      </div>
    </div>
  )
}

/* ── the header ─────────────────────────────────────────────────────────── */

function Header() {
  return (
    <div className="absolute inset-x-0 top-0 z-10"
      style={{ background: 'rgba(249,249,249,0.92)', backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)', boxShadow: '0 0.5px 0 rgba(0,0,0,0.22)' }}>
      <StatusBar/>
      <div className="relative flex h-[80px] items-start justify-between px-2 pt-1.5">
        <span aria-hidden className="flex h-[44px] items-center gap-1 pl-1" style={{ color: BLUE }}>
          <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke={BLUE} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 2 2 10l8 8"/>
          </svg>
          <span className="text-[17px] leading-none">3</span>
        </span>
        <span className="absolute left-1/2 top-1.5 flex -translate-x-1/2 flex-col items-center">
          <span aria-hidden className="grid place-items-center rounded-full text-white"
            style={{ width: 52, height: 52, backgroundColor: '#686d77', backgroundImage: 'linear-gradient(180deg, #8a8f99 0%, #686d77 100%)',
              fontSize: 23, fontWeight: 600, letterSpacing: '0.01em' }}>J</span>
          <span className="mt-1 flex items-center gap-0.5 text-[11.5px] leading-4 text-black">
            {CONTACT}
            <svg aria-hidden width="6" height="9" viewBox="0 0 6 9" fill="none" stroke={SECONDARY} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m1.2 1 3.4 3.5L1.2 8"/>
            </svg>
          </span>
        </span>
        <span aria-hidden className="flex h-[44px] items-center pr-2.5">
          <svg width="27" height="18" viewBox="0 0 27 18" fill="none" stroke={BLUE} strokeWidth="1.8" strokeLinejoin="round">
            <rect x="1" y="1.5" width="17" height="15" rx="3.5"/>
            <path d="m18 7.2 6.8-4v11.6l-6.8-4Z"/>
          </svg>
        </span>
      </div>
    </div>
  )
}
const HEADER_H = 47 + 80

/* ── the scene ──────────────────────────────────────────────────────────── */

let uid = 0
const seedBubbles = () => SEED.map(b => ({ ...b, id: ++uid, fresh: false }))

export default function MessagesScene({ active = true, onKey, handleRef, reduced = false, autoReply = true }) {
  const [bubbles, setBubbles] = React.useState(seedBubbles)
  const [typing, setTyping] = React.useState(false)
  const [draft, setDraft] = React.useState('')
  const [pressed, setPressed] = React.useState(null)
  const [focused, setFocused] = React.useState(false)
  const [shift, setShift] = React.useState(false)

  const draftRef = React.useRef('')
  const shiftRef = React.useRef(false)
  const inputRef = React.useRef(null)
  const threadRef = React.useRef(null)
  const lastKeyRef = React.useRef(-1e9)
  const pressTimer = React.useRef(0)
  const timers = React.useRef(new Set())
  const replyN = React.useRef(0)
  const props = React.useRef({}); props.current = { onKey, autoReply }

  const later = (fn, ms) => {
    const id = setTimeout(() => { timers.current.delete(id); fn() }, ms)
    timers.current.add(id)
  }
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current.clear() }
  React.useEffect(() => () => { clearTimers(); clearTimeout(pressTimer.current) }, [])

  const putDraft = v => { draftRef.current = v; setDraft(v) }
  const putShift = v => { shiftRef.current = v; setShift(v) }
  const add = b => setBubbles(list => [...list, { ...b, id: ++uid, fresh: true }].slice(-MAX_BUBBLES))

  const press = id => {
    if (!id) return
    clearTimeout(pressTimer.current)
    setPressed({ id })
    pressTimer.current = setTimeout(() => setPressed(null), 130)
  }

  /* the one path every key takes */
  const type = (ch, del) => {
    props.current.onKey?.(!!del)
    putDraft(del ? draftRef.current.slice(0, -1) : draftRef.current + ch)
  }

  const receive = (text, ms = 1400) => {
    setTyping(true)
    later(() => { setTyping(false); add({ me: false, text }) }, ms)
  }

  const send = ({ human = false } = {}) => {
    const text = draftRef.current.trim()
    putDraft('')
    if (!text) return
    add({ me: true, text })
    if (human && props.current.autoReply) {
      const reply = REPLIES[replyN.current++ % REPLIES.length]
      later(() => receive(reply, 1500), 900)
    }
  }

  /* a drawn key, clicked */
  const onPress = id => {
    press(id)
    if (id === 'shift') { putShift(!shiftRef.current); return }
    if (id === 'return') { send({ human: true }); return }
    if (id === 'del') { type(null, true); return }
    if (id === 'space') { type(' ', false); return }
    if (id.length === 1) { type(shiftRef.current ? id.toUpperCase() : id, false); if (shiftRef.current) putShift(false) }
  }

  /* the visitor's own keyboard: keydown records { del } and nothing else */
  const onKeyDown = e => {
    press(keyIdFor(e.key))
    if (e.key === 'Enter') { e.preventDefault(); send({ human: true }); return }
    const del = e.key === 'Backspace' || e.key === 'Delete'
    if (!del && e.key.length !== 1) return
    lastKeyRef.current = performance.now()
    props.current.onKey?.(del)
  }
  /* some phone keyboards send keydown as "Unidentified"; the input event
     still says whether it was a deletion, and that is all we keep */
  const onInput = e => {
    putDraft(e.target.value)
    if (performance.now() - lastKeyRef.current < 40) return
    const kind = e.nativeEvent?.inputType || ''
    if (kind.startsWith('delete')) props.current.onKey?.(true)
    else if (kind.startsWith('insert')) props.current.onKey?.(false)
  }

  const reset = () => {
    clearTimers()
    setTyping(false)
    putDraft('')
    putShift(false)
    setPressed(null)
    setBubbles(seedBubbles())
    inputRef.current?.blur()
  }

  React.useEffect(() => {
    if (!handleRef) return
    handleRef.current = {
      key(del, ch) {
        if (ch === '\n') { press('send'); send(); return }
        press(keyIdFor(ch, del))
        type(ch ?? 'a', del)
      },
      send() { press('send'); send() },
      receive,
      focus() { /* the field already shows its caret whenever the scene is up */ },
      reset,
    }
    return () => { handleRef.current = null }
  }, [handleRef]) // eslint-disable-line react-hooks/exhaustive-deps

  React.useLayoutEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [bubbles, typing])

  let lastMine = -1
  bubbles.forEach((b, i) => { if (b.me) lastMine = i })
  const hasText = draft.length > 0
  const sendDown = pressed?.id === 'send'

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-white"
      style={{ fontFamily: IOS.font, WebkitFontSmoothing: 'antialiased' }}>
      <style>{KEYFRAMES}</style>
      <Header/>

      {/* the thread scrolls under the frosted header */}
      <div ref={threadRef} aria-label={`Conversation with ${CONTACT}`}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        style={{ padding: `${HEADER_H + 8}px 16px 10px`, scrollbarWidth: 'none' }}>
        <p className="m-0 mb-1.5 text-center text-[11px] leading-4" style={{ color: SECONDARY }}>
          <span className="font-semibold">Today</span> 9:38 PM
        </p>
        {bubbles.map((b, i) => {
          const prev = bubbles[i - 1], next = bubbles[i + 1]
          const first = !prev || prev.me !== b.me
          const last = !next || next.me !== b.me
          return (
            <React.Fragment key={b.id}>
              <Bubble b={b} tail={last} gapTop={i === 0 ? 0 : first ? 10 : 2} reduced={reduced}/>
              {i === lastMine && (
                <p className="m-0 mr-1 mt-0.5 text-right text-[11px] font-medium leading-4" style={{ color: SECONDARY }}>
                  Delivered
                </p>
              )}
            </React.Fragment>
          )
        })}
        {typing && <TypingDots running={active} reduced={reduced} gapTop={10}/>}
      </div>

      {/* the field */}
      <div className="flex shrink-0 items-end gap-2 bg-white px-2 pb-2 pt-1.5">
        <span aria-hidden className="grid size-[34px] shrink-0 place-items-center rounded-full" style={{ background: '#eeeef0' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" stroke="#77777c" strokeWidth="2" strokeLinecap="round">
            <path d="M8 1.5v13M1.5 8h13"/>
          </svg>
        </span>
        <div className="relative h-[36px] min-w-0 flex-1 rounded-[18px]"
          style={{ boxShadow: 'inset 0 0 0 1px #c6c6c8' }}>
          {/* what the demo types, with a caret, while the real field is not focused */}
          {!focused && (
            <span aria-hidden className="pointer-events-none absolute inset-y-0 left-3 right-11 flex items-center overflow-hidden whitespace-pre text-[17px] text-black">
              {draft}
              <span className="ml-px inline-block h-[21px] w-[2px] rounded-full"
                style={{ background: BLUE, animation: reduced || !active ? 'none' : 'mm-msg-caret 1s infinite' }}/>
            </span>
          )}
          <label htmlFor="mm-teen-field" className="sr-only">Message</label>
          <input id="mm-teen-field" ref={inputRef} type="text" value={draft}
            placeholder={draft ? '' : 'Text Message'}
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} enterKeyHint="send"
            onKeyDown={onKeyDown} onInput={onInput} onChange={() => {}}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            className="absolute inset-0 h-full w-full rounded-[18px] bg-transparent pl-3 pr-11 text-[17px] outline-none placeholder:text-[#3c3c434d] focus-visible:ring-2 focus-visible:ring-[#0a84ff]/40"
            style={{ color: focused ? '#000' : 'transparent', caretColor: BLUE, paddingLeft: focused ? 12 : 16 }}/>
          <button type="button" aria-label="Send" disabled={!hasText}
            onPointerDown={e => e.preventDefault()}
            onClick={() => { press('send'); send({ human: true }) }}
            className="absolute bottom-[4px] right-[4px] grid size-[28px] place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#0a84ff]/50"
            style={{ background: hasText ? BLUE : 'transparent', transition: reduced ? 'none' : 'background-color 150ms, transform 150ms',
              transform: sendDown && !reduced ? 'scale(0.88)' : 'none' }}>
            {/* an empty field shows the microphone, as iOS does; the arrow
                comes with the first letter */}
            {hasText ? (
              <svg aria-hidden width="14" height="16" viewBox="0 0 14 16" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 14.5V2M1.6 7.2 7 1.8l5.4 5.4"/>
              </svg>
            ) : <Mic size={20} color="#8e8e93"/>}
          </button>
        </div>
      </div>

      <Keyboard pressed={pressed} shift={shift} popups={!reduced} onPress={onPress}/>
    </div>
  )
}
