import React from 'react'
import * as D from '@radix-ui/react-dialog'
import { Cross } from '../ui/marks'
import { cn } from '../lib/utils'
import { EMERGENCY, RESOURCES, VERIFIED_ON } from './resources'

/* Getting help.
 *
 * Reachable from every app screen, and it works with no reading, no patch and
 * no account, because the moment somebody needs this is not the moment to pair
 * a device. It is a directory of other people's phone numbers: it does not
 * score anybody, it does not decide whether a person is in crisis, and it
 * never opens itself.
 *
 * Rebuilt as a directory on the owner's instruction: name, number, how to
 * reach it, one line at most, far less space. Two controls sit at the top, in
 * this order, because both change the whole list under them:
 *
 *   Read aloud   speechSynthesis, already in every current browser. The list
 *                is queued one row per utterance so the voice pauses between
 *                services, and Stop calls cancel(). Digit runs of three or
 *                more are spaced out before they are spoken, so a voice reads
 *                "9 8 8" rather than "nine hundred and eighty eight", in
 *                either language. The control is not rendered at all where the
 *                API is missing, rather than rendered dead.
 *   Language     switches the copy, the action labels, the hours and the
 *                `lang` the voice is given.
 *
 * TRANSLATION POLICY. Every organisation's name stays in English, in both
 * languages, including inside the spoken text. Their own pages are the
 * authority on what they are called and an invented Spanish name on a crisis
 * directory is a real harm, so only the surrounding text is translated. The
 * same rule holds inside an action: the keyword in "Text HOME to 741741" is
 * literal and stays HOME, and only the instruction around it moves. Where a
 * translation is missing for a row, the English string shows rather than
 * nothing: untranslated and correct beats translated and wrong.
 *
 * Three things it deliberately does not say: that any of this is confidential,
 * what any service will do with what it is told, and what any authority will
 * or will not do. All three vary and none of them are ours to promise. Every
 * row links to the service's own page, which is where those words live.
 *
 * Numbers, codes, hours and links are in ./resources.js with the URL each one
 * was read from and the date it was checked. Nothing is added here that is not
 * on a row there.
 */

/* ── Marks ──────────────────────────────────────────────────────────────── */

/* Local glyphs rather than additions to ui/marks.jsx: five shapes, used
   nowhere else, drawn in the same 24-box single-stroke idiom as that file. */
const G = p => (
  <svg viewBox="0 0 24 24" width={p.size || 18} height={p.size || 18} fill="none" aria-hidden
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    className={cn('shrink-0', p.className)}>{p.children}</svg>
)
const CallMark = p => (
  <G {...p}><path d="M6.5 3.5h3l1.5 4-2 1.5a10 10 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z"/></G>
)
const TextMark = p => (
  <G {...p}><path d="M4 5.5h16v10H9l-5 4Z"/><path d="M8.5 10.5h7"/></G>
)
const ChatMark = p => (
  <G {...p}><path d="M3.5 7.5h13v8h-7l-6 4Z"/><path d="M8.5 4.5h12v8l-2 1.4"/></G>
)
const SoundMark = p => (
  <G {...p}><path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4Z"/><path d="M15.5 9.2a4.2 4.2 0 0 1 0 5.6"/>
    <path d="M18.2 6.6a8 8 0 0 1 0 10.8"/></G>
)
const StopMark = p => (
  <G {...p}><rect x="6.5" y="6.5" width="11" height="11" rx="1.5"/></G>
)
const MARK = { call: CallMark, text: TextMark, chat: ChatMark }

/* ── Languages ──────────────────────────────────────────────────────────── */

/* `speech` is the BCP 47 tag handed to the utterance. US variants, because
   every number on these rows is a United States number. */
const LANGS = [
  { code: 'en', label: 'English', speech: 'en-US' },
  { code: 'es', label: 'Español', speech: 'es-US' },
]

const COPY = {
  en: {
    title: 'Get Help',
    intro: 'These numbers belong to other organisations. You do not need a reading or an account.',
    readAloud: 'Read aloud',
    stop: 'Stop',
    speaking: 'Reading the list aloud.',
    stopped: 'Stopped.',
    language: 'Language',
    lines: 'Help Lines',
    theirPage: 'Their page',
    also: 'Also',
    verified: 'Checked on ',
    drift: 'Numbers can change. Each row links to the service’s own page.',
    getHelp: 'Get help',
  },
  es: {
    title: 'Pedir ayuda',
    intro: 'Estos números son de otras organizaciones. No necesitas una lectura ni una cuenta.',
    readAloud: 'Leer en voz alta',
    stop: 'Detener',
    speaking: 'Leyendo la lista en voz alta.',
    stopped: 'Detenido.',
    language: 'Idioma',
    lines: 'Líneas de ayuda',
    theirPage: 'Su página',
    also: 'Además',
    verified: 'Comprobado el ',
    drift: 'Los números pueden cambiar. Cada fila enlaza a la página del servicio.',
    getHelp: 'Pedir ayuda',
  },
}

/* VERIFIED_ON is written in English in resources.js. Rather than keep a second
   date that can drift away from it, the month is translated and the day and
   year are reused. An unmapped month falls through unchanged. */
const MONTH_ES = {
  January: 'enero', February: 'febrero', March: 'marzo', April: 'abril',
  May: 'mayo', June: 'junio', July: 'julio', August: 'agosto',
  September: 'septiembre', October: 'octubre', November: 'noviembre', December: 'diciembre',
}
function verifiedDate(code) {
  if (code === 'en') return VERIFIED_ON
  const [day, month, year] = String(VERIFIED_ON).split(' ')
  const es = MONTH_ES[month]
  return es ? `${day} de ${es} de ${year}` : VERIFIED_ON
}

/* One line per service, short enough for a directory. Keyed by the row id in
   resources.js, so a row added there without a line here falls back to that
   row's own `what` and is still correct, only longer. */
const LINE = {
  en: {
    '988': 'Helps with any crisis, including thoughts of suicide.',
    ctl: 'Helps with anything, by text message instead of voice.',
    teenline: 'Trained teenagers answer the line.',
    trevor: 'Supports LGBTQ young people.',
    trans: 'Run by trans people, for trans and questioning people.',
    eating: 'Helps with eating and food. They are not a crisis line.',
    samhsa: 'Refers you to treatment nearby. They are not a crisis line.',
  },
  es: {
    '988': 'Ayuda con cualquier crisis, incluidos los pensamientos de suicidio.',
    ctl: 'Ayuda con cualquier tema, por mensaje en vez de por voz.',
    teenline: 'Adolescentes capacitados atienden la línea.',
    trevor: 'Apoya a jóvenes LGBTQ.',
    trans: 'Atendida por personas trans, para personas trans y en cuestionamiento.',
    eating: 'Ayuda con la alimentación y la comida. No es una línea de crisis.',
    samhsa: 'Te refiere a tratamiento cercano. No es una línea de crisis.',
  },
}

/* Keyed by the exact English string in resources.js, so a change there shows
   as an untranslated row rather than as a wrong one. */
const HOURS_ES = {
  'Every hour of every day': 'Todas las horas, todos los días',
  '6 pm to 10 pm Pacific by phone, 6 pm to 9 pm Pacific by text':
    'De 6 pm a 10 pm del Pacífico por teléfono, de 6 pm a 9 pm del Pacífico por mensaje',
  '1 pm to 9 pm Eastern, Monday to Friday':
    'De 1 pm a 9 pm del Este, de lunes a viernes',
  '9 am to 7 pm Eastern, Monday to Friday':
    'De 9 am a 7 pm del Este, de lunes a viernes',
}

/* The keyword and the number are literal and never translated. */
const ACTION_ES = {
  'Call 988': 'Llama al 988',
  'Text 988': 'Envía un mensaje al 988',
  'Chat online': 'Chatea en línea',
  'Text HOME to 741741': 'Envía HOME al 741741',
  'Text TEEN to 839863': 'Envía TEEN al 839863',
  'Call 800 852 8336': 'Llama al 800 852 8336',
  'Text START to 678678': 'Envía START al 678678',
  'Call 1 866 488 7386': 'Llama al 1 866 488 7386',
  'Call 877 565 8860': 'Llama al 877 565 8860',
  'Call 866 662 1235': 'Llama al 866 662 1235',
  'Call 1 800 662 4357': 'Llama al 1 800 662 4357',
}

const ACCESS_ES = {
  'Relay users dial 711, then 988. For ASL, call 988 from a videophone number.':
    'Con relé, marca el 711 y luego el 988. Para ASL, llama al 988 por videoteléfono.',
}

const EMERGENCY_ES = {
  label: 'Llama al 911',
  line: 'Si alguien está herido o en peligro ahora, llama al 911.',
}

/* One reader for every translated field, so a missing entry is an English
   string on the screen and never an empty one. */
function t(code, map, key) {
  if (code === 'en') return key
  return map[key] || key
}

/* ── Reading it aloud ───────────────────────────────────────────────────── */

/* A run of three or more digits is a number to read out, digit by digit. Left
   alone, both voices say "seven hundred and forty one thousand" at 741741. */
function spoken(text) {
  return String(text).replace(/\d{3,}/g, m => m.split('').join(' '))
}

function useSpeech(code) {
  const [speaking, setSpeaking] = React.useState(false)
  const [voices, setVoices] = React.useState([])
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null
  const supported = Boolean(synth && typeof window.SpeechSynthesisUtterance === 'function')

  /* Chrome fills the voice list asynchronously and fires voiceschanged once it
     has. With none matching, the browser's default voice reads the text and
     only the accent is wrong. */
  React.useEffect(() => {
    if (!supported) return
    const read = () => setVoices(synth.getVoices() || [])
    read()
    synth.addEventListener?.('voiceschanged', read)
    return () => synth.removeEventListener?.('voiceschanged', read)
  }, [supported, synth])

  const stop = React.useCallback(() => {
    if (!supported) return
    synth.cancel()
    setSpeaking(false)
  }, [supported, synth])

  /* Unmounting is a stop: closing the sheet must not leave a voice running. */
  React.useEffect(() => () => { if (supported) synth.cancel() }, [supported, synth])
  /* A language change is a stop, so the rest of the list is not read in the
     language the reader just left. */
  React.useEffect(() => { stop() }, [code, stop])

  const speak = React.useCallback(parts => {
    if (!supported) return
    synth.cancel()
    const lang = (LANGS.find(l => l.code === code) || LANGS[0]).speech
    const voice = voices.find(v => v.lang === lang)
      || voices.find(v => String(v.lang).toLowerCase().startsWith(code))
      || null
    const list = parts.filter(Boolean)
    if (!list.length) return
    setSpeaking(true)
    list.forEach((part, i) => {
      const u = new window.SpeechSynthesisUtterance(spoken(part))
      u.lang = lang
      if (voice) u.voice = voice
      u.rate = 0.95
      if (i === list.length - 1) u.onend = () => setSpeaking(false)
      u.onerror = () => setSpeaking(false)
      synth.speak(u)
    })
  }, [code, supported, synth, voices])

  return { supported, speaking, speak, stop }
}

/* ── Rows ───────────────────────────────────────────────────────────────── */

/* `rounded-field`, 6px, not `rounded-chip`: these are things a reader taps,
   and the capsule pill is banned in every form. */
const tap = cn('inline-flex min-h-[44px] items-center gap-1.5 rounded-field border px-2.5',
  'font-display text-ui font-medium transition-colors duration-150 ease')

function Resource({ r, code, copy }) {
  const Mark = MARK[r.actions[0]?.kind] || CallMark
  const access = r.access ? t(code, ACCESS_ES, r.access) : null
  return (
    <li className="px-3.5 py-3 md:rounded-panel md:border md:border-rule md:bg-card">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <h4 className="min-w-0 font-display text-ui font-bold leading-snug text-ink">{r.name}</h4>
        <span className="text-fine text-ink-3">{t(code, HOURS_ES, r.hours)}</span>
      </div>
      <p className="mt-0.5 max-w-[60ch] text-fine text-ink-2">
        {LINE[code]?.[r.id] || LINE.en[r.id] || r.what}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        {r.actions.map((a, i) => {
          const A = MARK[a.kind] || Mark
          const external = a.href.startsWith('http')
          return (
            <a key={a.label} href={a.href}
              {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
              className={cn(tap, i === 0
                ? 'border-accent-ink bg-accent text-paper hoverOnly:bg-accent-ink'
                : 'border-rule bg-paper text-ink hoverOnly:bg-mist')}>
              <A size={16}/>
              <span>{t(code, ACTION_ES, a.label)}</span>
            </a>
          )
        })}
        <a href={r.site} target="_blank" rel="noreferrer"
          className={cn(tap, 'border-rule bg-paper text-ink hoverOnly:bg-mist')}>
          {copy.theirPage}
        </a>
      </div>
      {/* A way in that is not a button, so it is a line rather than a chip:
          nothing here is tappable. */}
      {access && (
        <p className="mt-1.5 max-w-[60ch] text-fine text-ink-3">
          <span className="font-display font-semibold text-ink-3">{copy.also}: </span>{access}
        </p>
      )}
      {r.extra && (
        <p className="mt-1 text-fine">
          <a href={r.extra.href} target="_blank" rel="noreferrer"
            className="inline-flex min-h-[32px] items-center font-display font-medium text-accent
              underline decoration-accent/40 underline-offset-2 transition-colors duration-150
              ease hoverOnly:text-accent-ink">
            {r.extra.label}
          </a>
        </p>
      )}
    </li>
  )
}

/* ── The content, so it can be a route as well as a sheet ───────────────── */

export function HelpBody({ className, onLang }) {
  const [code, setCode] = React.useState('en')
  React.useEffect(() => { onLang?.(code) }, [code, onLang])
  const copy = COPY[code]
  const { supported, speaking, speak, stop } = useSpeech(code)

  /* The spoken list is the printed list, in the printed order, built from the
     same strings. One utterance per row, so the voice pauses between
     services and a listener can act on one before the next starts. */
  const parts = React.useMemo(() => {
    const em = code === 'en' ? EMERGENCY : EMERGENCY_ES
    const rows = RESOURCES.map(r => [
      r.name + '.',
      LINE[code]?.[r.id] || LINE.en[r.id] || r.what,
      t(code, HOURS_ES, r.hours) + '.',
      r.actions.map(a => t(code, ACTION_ES, a.label)).join('. ') + '.',
    ].join(' '))
    return [copy.lines + '. ' + copy.intro, em.line + ' ' + em.label + '.', ...rows]
  }, [code, copy])

  const em = code === 'en' ? EMERGENCY : EMERGENCY_ES

  return (
    <div className={cn('min-w-0', className)} lang={code}>
      {/* Both controls change the whole list, so both sit above it. */}
      <div className="flex flex-wrap items-center gap-2">
        {supported && (
          <button type="button" aria-pressed={speaking}
            onClick={() => (speaking ? stop() : speak(parts))}
            className={cn(tap, speaking
              ? 'border-accent-ink bg-accent text-paper hoverOnly:bg-accent-ink'
              : 'border-rule bg-card text-ink hoverOnly:bg-mist')}>
            {speaking ? <StopMark size={17}/> : <SoundMark size={17}/>}
            <span>{speaking ? copy.stop : copy.readAloud}</span>
          </button>
        )}
        <div role="group" aria-label={copy.language} className="flex items-center gap-2">
          {LANGS.map(l => {
            const on = l.code === code
            return (
              <button key={l.code} type="button" lang={l.code} aria-pressed={on}
                onClick={() => setCode(l.code)}
                className={cn(tap, on
                  ? 'border-accent-ink bg-accent text-paper hoverOnly:bg-accent-ink'
                  : 'border-rule bg-card text-ink hoverOnly:bg-mist')}>
                {l.label}
              </button>
            )
          })}
        </div>
      </div>
      <p aria-live="polite" className="sr-only">{speaking ? copy.speaking : ''}</p>

      <p className="mt-2.5 max-w-[66ch] text-fine text-ink-2">{copy.intro}</p>

      {/* Red, on purpose. The owner: "Just bc ur adhering to color scheme
          doesnt mean u cant use colors like red or anything in the alerts or
          emergency call sections." crit on its wash is 5.58 : 1 and paper on
          crit 6.36 : 1. */}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-panel
        border border-crit/40 bg-[#fbeae6] px-3.5 py-3">
        <p className="min-w-0 flex-1 basis-full text-fine font-medium text-[#7a2314] sm:basis-0">{em.line}</p>
        <a href={EMERGENCY.href}
          className={cn(tap, 'border-[#7a2314] bg-crit font-bold text-paper',
            'hoverOnly:bg-[#7a2314]')}>
          <CallMark size={17}/>{em.label}
        </a>
      </div>

      <h3 className="mark mt-4">{copy.lines}</h3>
      {/* One container with hairline dividers on a phone, which is the dense
          spelling the owner asked for; two cards abreast from md, where a
          single column would be a long thin ribbon. `divide-y` draws the rule
          between rows rather than on them, so neither spelling fights the
          other. */}
      <ul className="mt-2.5 m-0 list-none divide-y divide-rule overflow-hidden rounded-panel
        border border-rule bg-card p-0 md:grid md:grid-cols-2 md:items-start md:gap-3
        md:divide-y-0 md:overflow-visible md:rounded-none md:border-0 md:bg-transparent
        xl:grid-cols-3">
        {RESOURCES.map(r => <Resource key={r.id} r={r} code={code} copy={copy}/>)}
      </ul>

      <p className="mt-3 max-w-[70ch] text-fine text-ink-3">
        {copy.verified}{verifiedDate(code)}. {copy.drift}
      </p>
    </div>
  )
}

/* ── The sheet ──────────────────────────────────────────────────────────── */

/* Full height on a phone, a panel on a laptop. Radix owns the focus trap, the
   Escape key and the return of focus to the trigger. */
export function HelpSheet({ open, onOpenChange }) {
  /* The language control lives in the body, below this bar, so the title is
     told which language the list is in rather than guessing. */
  const [code, setCode] = React.useState('en')
  React.useEffect(() => { if (!open) setCode('en') }, [open])
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-[90] bg-ink/45"/>
        <D.Content
          aria-describedby={undefined}
          className={cn('fixed inset-0 z-[100] flex flex-col overflow-hidden bg-paper',
            'sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-[min(92dvh,46rem)]',
            'sm:w-[min(62rem,calc(100vw-3rem))] sm:-translate-x-1/2 sm:-translate-y-1/2',
            'sm:rounded-panel sm:border sm:border-ink-3')}>
          <div className="flex shrink-0 items-center gap-3 border-b border-ink-3 bg-card px-4 py-3">
            <span aria-hidden className="h-4 w-[3px] shrink-0 rounded-bar bg-accent"/>
            <D.Title lang={code}
              className="min-w-0 flex-1 font-display text-head font-bold text-ink">
              {COPY[code].title}
            </D.Title>
            <D.Close
              className="-mr-1 grid size-11 shrink-0 place-items-center rounded-field text-ink-2
                transition-colors duration-150 ease hoverOnly:bg-mist hoverOnly:text-ink"
              aria-label="Close">
              <Cross className="size-4"/>
            </D.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain
            px-4 py-3.5 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6">
            <HelpBody onLang={setCode}/>
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  )
}

/* ── Trigger plus sheet ─────────────────────────────────────────────────── */

/* So a screen mounts one element and gets the whole path. `compact` is the
   top-bar spelling, where the label shortens on a phone and the row already
   carries three other controls. */
export function GetHelp({ compact = false, className }) {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className={cn('inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2',
          'rounded-field border border-[#7a2314] bg-crit font-display text-ui font-medium',
          'text-paper transition-colors duration-150 ease hoverOnly:bg-[#7a2314]',
          compact ? 'w-11 px-0 sm:w-auto sm:gap-2 sm:px-3' : 'px-3', className)}>
        <CallMark size={16}/>
        {compact
          ? <span className="sr-only sm:not-sr-only">{COPY.en.getHelp}</span>
          : COPY.en.getHelp}
      </button>
      <HelpSheet open={open} onOpenChange={setOpen}/>
    </>
  )
}
