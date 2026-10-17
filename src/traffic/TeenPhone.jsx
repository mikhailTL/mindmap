import React from 'react'
import { IPhone } from '../ui/iphone'
import { NUDGE_TEXT } from '../signals/light.js'
import { IosNotification, IOS, BANNER_TOP } from './ios'
import MessagesScene from './Messages'
import Feed from './Feed'
import BreakSheet from './BreakSheet'
import { clockText } from './core'
import { cn } from '../lib/utils'

/* One teen phone on the Heads Up page: the scene (Messages or the video
 * feed), MindMap's notification, the "Take 2 minutes" sheet, and the slight
 * dim while the phone is paused for a callout. It draws; it decides nothing.
 * `viewRef` is set to the view the script in core.js drives. */

const EMPTY_SHEET = { open: false }

export default function TeenPhone({ kind, scale, viewRef, sessionRef, clock, reduced, label }) {
  const sceneRef = React.useRef(null)
  const [banner, setBanner] = React.useState({ show: false, pressed: null, text: NUDGE_TEXT, mounted: false })
  const [sheet, setSheet] = React.useState(EMPTY_SHEET)
  const [frozen, setFrozen] = React.useState(false)
  const [day, setDay] = React.useState(() => clockText(clock?.now?.() ?? Date.now()))
  const offTimer = React.useRef(0)

  React.useEffect(() => {
    if (!viewRef) return
    const s = () => sceneRef.current
    const patch = p => setSheet(x => ({ ...x, ...p }))
    viewRef.current = {
      /* Messages */
      key(ch, del) { s()?.key?.(!!del, del ? undefined : ch) },
      send() { s()?.send?.() },
      typing(on) { s()?.typing?.(on) },
      receive(text) { s()?.bubble?.(text, false) },
      /* feed */
      go(idx, ms, k) { s()?.go?.(idx, ms, k) },
      fresh() {
        setDay(clockText(clock?.now?.() ?? Date.now()))
        if (kind === 'texting') s()?.reset?.(); else s()?.fresh?.()
      },
      /* the notification */
      showBanner(text) {
        clearTimeout(offTimer.current)
        setBanner({ show: false, pressed: null, text: text || NUDGE_TEXT, mounted: true })
        requestAnimationFrame(() => requestAnimationFrame(() => setBanner(b => ({ ...b, show: true }))))
      },
      pressAction() { setBanner(b => ({ ...b, pressed: 0 })) },
      hideBanner() {
        setBanner(b => ({ ...b, show: false }))
        clearTimeout(offTimer.current)
        offTimer.current = setTimeout(() => setBanner(b => ({ ...b, mounted: false, pressed: null })), 420)
      },
      /* the sheet */
      openSheet() { setSheet({ open: true }) },
      pick(key) { patch({ picked: key }) },
      startActivity(key) { patch({ activity: key, results: [] }) },
      reaction({ trial, phase, ms }) {
        setSheet(x => ({ ...x, trial, phase, ms, results: phase === 'tap' ? [...(x.results || []).slice(0, trial), ms] : (x.results || []) }))
      },
      walk({ steps, secs }) { patch({ steps, secs }) },
      endCard(text) { patch({ end: text }) },
      showBack(text) { patch({ back: text }) },
      pressBack() { patch({ backDown: true }) },
      closeSheet() { setSheet(EMPTY_SHEET) },
      /* the callout pause */
      freeze(on) { setFrozen(!!on); s()?.freeze?.(on) },
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
          ? <MessagesScene active={!frozen} onKey={onKey} handleRef={sceneRef} reduced={reduced} autoReply={false} seed={[]} day={day}/>
          : <Feed handleRef={sceneRef} onScroll={onScroll} reduced={reduced}/>}

        {/* paused for a callout: everything holds and dims slightly */}
        <div aria-hidden className={cn('pointer-events-none absolute inset-0 z-20 transition-opacity duration-200', frozen ? 'opacity-100' : 'opacity-0')}
          style={{ background: 'rgba(13,43,30,0.22)' }}/>

        {banner.mounted && (
          <IosNotification show={banner.show} body={banner.text} reduced={reduced} top={BANNER_TOP}
            actions={[{ label: 'Take a break', primary: true }, { label: 'Not now' }]} pressed={banner.pressed}/>
        )}

        <BreakSheet state={sheet} reduced={reduced}/>

        <span aria-hidden className="pointer-events-none absolute bottom-2 left-1/2 z-50 h-[5px] w-[140px] -translate-x-1/2 rounded-full"
          style={{ background: kind === 'scrolling' && !sheet.open ? '#fff' : '#000' }}/>
      </div>
    </IPhone>
  )
}
