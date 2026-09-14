# Survey setup

The site asks peer reviewers a few questions as they read, and `/api/responses`
collects the answers. Without a store attached, nothing is collected centrally.
These are the steps to change that.

## 1. Create the KV store

1. Open the Vercel dashboard, project **mindmappaitent**.
2. **Storage** → **Create Database** → **KV** (Upstash Redis). Name it
   `mindmap-responses`. Pick the region closest to you.
3. On the new store, **Connect Project** → select **mindmappaitent** → connect
   to **Production**, **Preview** and **Development**.

Connecting sets `KV_REST_API_URL` and `KV_REST_API_TOKEN` as environment
variables on the project. The function checks for exactly those two names and
uses the KV store only when both are present.

## 2. Install the client

```
npm i @vercel/kv
git add package.json package-lock.json
git commit -m "Add @vercel/kv for survey responses"
git push
```

The import in `api/responses.js` is a dynamic `import()` inside a `try`, so the
build does not break if this step is skipped — the function silently falls back
to memory instead. That is the failure this step exists to prevent, so do not
skip it.

## 3. Redeploy

Pushing in step 2 is enough. If you changed only environment variables, use
**Deployments** → latest → **Redeploy**; env vars are read at runtime but a
redeploy is the reliable way to be sure the new ones are in place.

## 4. Read the responses

Open `/#/responses` on the deployed site.

The page shows every reviewer, grouped by name: when they started, how many
questions they answered, their star rating, and every answer in full. Above the
list is the respondent count, the mean rating and a bar for every scale
question.

Check the **Source** tile at the top right of the summary:

- **KV store** — responses are being kept. This is what you want.
- **Server, in memory** — the API is running but has no store. A banner says so.
  Go back to step 1.
- **This browser** — the API could not be reached at all. A banner says why.

## 5. Export

On the responses page: **Download CSV** (opens in Excel or Sheets, one row per
answer, with the question text in its own column) or **Download JSON** (the same
data grouped by respondent, for anything else). Both files contain everyone, not
just whoever the on-screen filter is showing.

Individual reviewers can also export their own answers from the last block of
the site, which is the only route to their data when there is no KV store.

## What happens with no KV store

Nothing is lost from the reviewer's point of view and everything is lost from
yours. Answers are written to that reviewer's own browser as they go, so they
see a working survey and can download their own CSV at the end. The POST to
`/api/responses` either fails quietly or lands in one serverless instance's
memory, which is wiped by the next deploy, the next cold start, or the platform
recycling the instance — and there is more than one instance, so two reviewers
can write to two different copies that never see each other.

In other words: without the KV store, **the only person who can retrieve a
reviewer's answers is that reviewer**, by hand, from the machine they used. If
you are sending the site out for review, do step 1 first.

## The responses page is unlisted, not secured

`/#/responses` is not linked from anywhere and is not in the site's route list.
That is obscurity. Anyone who has the URL can open it, and the URL is guessable.

There is deliberately no login: a password checked in a static bundle is checked
by code the visitor controls, against a secret the visitor can read. It would
look like protection and be worth nothing, which is worse than an honest gap
because it stops you from closing the real one.

The optional key is the same caveat one layer down. Set `RESPONSES_KEY` (server
env, any random string) and `VITE_RESPONSES_KEY=1` (build env — a flag only, its
value is never used as the key and never reaches the bundle). The page then
reads `?key=…` from the URL it was opened with and sends it as an
`x-responses-key` header, and the API refuses `GET` without it. This stops a
casual URL guess. It does not survive the link being forwarded, pasted into a
chat, or landing in someone's browser history.

Real protection is one of:

- **Vercel deployment protection** — Project → **Settings** → **Deployment
  Protection** → **Vercel Authentication**, which requires a Vercel login to
  view the deployment at all. Note that it covers the whole site, so reviewers
  would need accounts; usually you turn it on after the review window closes.
- **An access-controlled store** — move reading behind credentials the browser
  never holds, and fetch the data server-side.

Until one of those is on, treat everything on the responses page as public.
