# MindMap — patient edition

React 18 + Tailwind 3 + Vite. Seven views, hash-routed, no backend.

```bash
npm install
npm run dev        # localhost:5173
npm run build      # -> dist/
```

## Deploy

```bash
npx vercel --prod
```

`vercel.json` already carries the SPA rewrite and cache headers (`immutable` on
`/assets` and `/photos`, `must-revalidate` on the shell). Vercel needs no other
configuration.

Netlify equivalent: build `npm run build`, publish `dist`, add `/* /index.html 200`.

## Routes

| Hash | View |
|---|---|
| `#/site` | Marketing overview |
| `#/hub` | Tile hub |
| `#/check` | Live reading — patch or six questions |
| `#/student` | Student monitoring |
| `#/parent` | Parent monitoring |
| `#/pro` | Clinician caseload |
| `#/index` | Every screen, listed |

`Cmd+K` / `Ctrl+K` opens the command palette.

## Structure

```
src/
  ui/         Button, Card, Disclosure, Scale, Palette   — shadcn patterns on Radix
  charts/     Spark, DayChart, WeekChart, Diverge        — no chart library
  views/      one file per route
  lib/
    engine.js     the self-report scoring engine
    chartdata.js  DEMO SERIES — replace with the live feed
    images.js     photo paths
```

## Swapping in real data

`src/lib/chartdata.js` is generated demo data. Replace `CHART_DATA` with whatever
the API returns, in the same shape:

```js
{ day: [{t:'07:00', v:43.3}, ...],  band: {lo, hi},
  spark: { hr:[...], hrv:[...], eda:[...], temp:[...], mot:[...] },
  week: [{d:'Mon', v:61}, ...],     weekBand: {lo, hi},
  pro:  { '8241': [63,64,67,...] } }
```

`src/lib/engine.js` is real, not a mock: weighted items -> mean ->
100/(1+e^(-2.4*S)). The patch route runs the same last step on physiology.

## Web Bluetooth

`connectPatch()` targets the Nordic UART service
6e400001-b5a3-f393-e0a9-e50e24dcca9e. It needs a secure origin (HTTPS or
localhost), Chrome or Edge, and a top-level page. It cannot work inside an
iframe, which is why the embedded preview falls back to the questionnaire with an
explicit message. On the Vercel URL it should reach the device chooser.

## Design language

Tokens live in `tailwind.config.js`, derived rather than picked:

- Nine type steps for the nine levels of meaning in the content.
- Clinical colour rules. Red is reserved for critical and is not available as a
  brand accent; amber means out of range. Out-of-range is never colour alone — it
  carries a glyph and weight, so it survives grayscale.
- `ink-3` measures 5.32:1 on paper and 4.66:1 on sage. Both clear WCAG AA.
- 16px floor on every rendered string, chart labels included.

## Audit

```bash
npm run build && npx vite preview --port 5199
# then run the ui skill's audit.mjs against http://localhost:5199/#/parent
```

Last run: 0 CRITICAL, 0 HIGH across all seven views at 390 / 768 / 1280 / 1920.
