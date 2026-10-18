import React from 'react'
import { cn } from '../../lib/utils'
import { TONES } from './tones'
import { Sky, SceneSvg, useSceneWatch, useUid } from './kit'

/* A band of illustrated scene: the tone's sky and light, then whatever the
 * caller draws. `children` is a function of the id prefix, so gradients and
 * clips never collide between two bands on one page. The art is cropped to
 * the band (slice), so it runs off whichever edge `fit` leaves open. `as`
 * is 'span' inside a button, where a div is not allowed. */
export function SceneBand({ tone = 'dusk', w = 360, h = 140, fit = 'xMidYMid slice', sky = {},
  as: As = 'div', className, children }) {
  const ref = React.useRef(null)
  const u = useUid()
  useSceneWatch(ref)
  return (
    <As ref={ref} aria-hidden="true" className={cn('sc relative block overflow-hidden', className)}
      style={{ backgroundColor: TONES[tone].sky[0] }}>
      <SceneSvg w={w} h={h} fit={fit} className="absolute inset-0 block h-full w-full">
        <Sky u={u} tone={tone} w={w} h={h} {...sky}/>
        {children?.(u)}
      </SceneSvg>
    </As>
  )
}

/* A whole card on a deep tone: the scene across the top and the words below
   it on the tone's own darkest step, so their contrast is exact (tones.js).
   Rounder than the site's panels and lit from within, which is what sets it
   apart from the white cards around it. */
export function SceneCard({ tone = 'dusk', art, w, h, sky, fit, bandClass = 'h-[112px]',
  title, as: H = 'h3', meta, line, footer, className }) {
  const t = TONES[tone]
  return (
    <div className={cn('sc-card flex h-full flex-col overflow-hidden rounded-[22px]', className)}
      style={{ backgroundColor: t.sky[0],
        boxShadow: `0 1px 2px rgb(11 43 51 / 0.08), 0 18px 36px -22px ${t.glow}` }}>
      <SceneBand tone={tone} w={w} h={h} sky={sky} fit={fit} className={bandClass}>{art}</SceneBand>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
        <H className="m-0 font-display text-row font-bold leading-tight" style={{ color: t.ink }}>{title}</H>
        {meta && <p className="m-0 mt-0.5 text-fine font-semibold tabular-nums" style={{ color: t.sub }}>{meta}</p>}
        {line && <p className="m-0 mt-2.5 text-fine" style={{ color: t.sub }}>{line}</p>}
        {footer && <div className="mt-auto pt-3.5">{footer}</div>}
      </div>
    </div>
  )
}
