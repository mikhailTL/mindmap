import React from 'react'
import { IPhone } from '../ui/iphone'
import { NUDGE_TEXT } from '../signals/light.js'
import { IosNotification, IOS, BANNER_TOP } from './ios'
import MessagesScene from './Messages'
import Feed from './Feed'
import { clockText, TEXT_SEED } from './core'

/* One teen phone on the Heads Up page: the scene (Messages or the video
 * feed) and MindMap's notification. While the phone is paused on a moment of
 * detection the scene holds where it is. It draws; it decides nothing.
 * `viewRef` is set to the view the script in core.js drives. `hold` keeps the
 * scene still while the other phone has its turn or the page is on a beat. */

export default function TeenPhone({ kind, scale, viewRef, sessionRef, clock, reduced, label, hold = false }) {
  const sceneRef = React.useRef(null)
  const [banner, setBanner] = React.useState({ show: false, pressed: null, text: NUDGE_TEXT, mounted: false })
  const [frozen, setFrozen] = React.useState(false)
  const [day, setDay] = React.useState(() => clockText(clock?.now?.() ?? Date.now()))
  const offTimer = React.useRef(0)
  /* From the notification on, the scene holds its frame: the script may still
     be mid-swipe or mid-message, and the page is on its red beat. A fresh
     screen lets it go again. */
  const still = React.useRef(false)

  React.useEffect(() => {
    if (!viewRef) return
    const s = () => (still.current ? null : sceneRef.current)
    viewRef.current = {
      /* Messages */
      key(ch, del) { s()?.key?.(!!del, del ? undefined : ch) },
      send() { s()?.send?.() },
      typing(on) { s()?.typing?.(on) },
      receive(text) { s()?.bubble?.(text, false) },
      /* feed */
      go(idx, ms, k) { s()?.go?.(idx, ms, k) },
      fresh() {
        still.current = false
        setDay(clockText(clock?.now?.() ?? Date.now()))
        if (kind === 'texting') s()?.reset?.(); else s()?.fresh?.()
      },
      /* the notification */
      showBanner(text) {
        setFrozen(true); sceneRef.current?.freeze?.(true); still.current = true
        clearTimeout(offTimer.current)
        setBanner({ show: false, pressed: null, text: text || NUDGE_TEXT, mounted: true })
        requestAnimationFrame(() => requestAnimationFrame(() => setBanner(b => ({ ...b, show: true }))))
      },
      hideBanner() {
        setBanner(b => ({ ...b, show: false }))
        clearTimeout(offTimer.current)
        offTimer.current = setTimeout(() => setBanner(b => ({ ...b, mounted: false, pressed: null })), 420)
      },
      /* the pause on a moment of detection */
      freeze(on) { setFrozen(!!on); sceneRef.current?.freeze?.(on) },
      mark() {},
    }
    return () => { viewRef.current = null; clearTimeout(offTimer.current) }
  }, [viewRef, kind, clock])

  const onKey = React.useCallback(del => sessionRef?.current?.recordKey(del), [sessionRef])
  const onScroll = React.useCallback(y => sessionRef?.current?.onScroll(y), [sessionRef])

  return (
    <IPhone interactive={false} scale={scale} screenBg={kind === 'texting' ? '#fff' : '#000'} showHomeIndicator={false} label={label}>
      <div className="absolute inset-0 isolate overflow-hidden" style={{ fontFamily: IOS.font }}>
        {kind === 'texting'
          ? <MessagesScene active={!frozen && !hold} onKey={onKey} handleRef={sceneRef} reduced={reduced} autoReply={false} seed={TEXT_SEED} day={day}/>
          : <Feed handleRef={sceneRef} onScroll={onScroll} reduced={reduced} paused={hold}/>}

        {banner.mounted && (
          <IosNotification show={banner.show} body={banner.text} reduced={reduced} top={BANNER_TOP}
            actions={[{ label: 'Take a break', primary: true }, { label: 'Not now' }]} pressed={banner.pressed}/>
        )}

        <span aria-hidden className="pointer-events-none absolute bottom-2 left-1/2 z-50 h-[5px] w-[140px] -translate-x-1/2 rounded-full"
          style={{ background: kind === 'scrolling' ? '#fff' : '#000' }}/>
      </div>
    </IPhone>
  )
}
