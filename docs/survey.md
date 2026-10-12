# Survey setup

A reviewer's answers have to get to you. Two independent paths do that, and
they are separate on purpose, because the thing that kills a review window is
one path quietly failing while nobody is watching the other.

- **Email, every submission.** This is the one that matters while the site is
  out for review. The survey posts the whole finished response, once. It tries
  your own endpoint first and falls back to a keyless relay. Set up below under
  *Your own endpoint*; nothing else on this page is needed for it.
- **A central store, every answer as it is given.** This feeds `/#/responses`,
  which shows all reviewers side by side with charts and CSV export. It needs a
  database, and without one each reviewer's answers stay in their own browser.
  That is the rest of this page.

Neither depends on the other. If you only do one, do the first.

## Your own endpoint

The fallback relay is free, which means it has an activation step, a rate limit
and an uptime nobody here controls; the survey handles all three by queueing and
retrying, but a queued response is not a delivered one. An endpoint you own goes
first and removes that dependency. It takes about two minutes and needs no key
in the bundle, because the URL is a destination, not a secret.

`tools/survey-endpoint.gs` is the whole thing: a Google Apps Script web app that
writes every response to a spreadsheet **and then** emails it to you. The
spreadsheet is the durable half, a response survives a bounced mail, a full
mailbox, or a filter that files the notification somewhere you never look.

1. Open <https://sheets.new>. Name the sheet something like *MindMap feedback*.
   Leave it empty; the script creates the tabs it needs.
2. **Extensions** → **Apps Script**. Delete the stub `myFunction`, paste the
   entire contents of `tools/survey-endpoint.gs`, and save.
3. **Deploy** → **New deployment** → gear icon → **Web app**.
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**

   "Anyone" is what lets a reviewer's browser post without signing in. It does
   not expose the spreadsheet: the script answers `GET` with a count and
   nothing else, and only ever writes.
4. **Deploy**, then **Authorize access** and allow the two permissions it asks
   for: send mail as you, and edit this spreadsheet. The warning screen is the
   standard unverified-app one; it is your own script. Copy the **Web app URL**
   at the end. It looks like
   `https://script.google.com/macros/s/AKfy…long…/exec`.
5. Paste that URL into the browser. It should answer
   `{"ok":true,"endpoint":"mindmap survey","responses":0}`. If it does, the
   endpoint works and the rest is wiring.
6. In the Vercel dashboard, project **mindmappaitent** → **Settings** →
   **Environment Variables**, add:

   ```
   VITE_SURVEY_MAIL = https://script.google.com/macros/s/AKfy…/exec
   ```

   All three environments. Then redeploy, because a `VITE_` variable is read at
   build time and baked into the bundle.

That is it. The next submission lands as a row in the sheet and an email in
`2020mik2020@gmail.com`.

### Two details that are easy to get wrong

**The variable is `VITE_SURVEY_MAIL`, not `VITE_SURVEY_ENDPOINT`.** The second
one is already taken: `store.js` posts each answer to it as it is given and the
responses page reads the collected set back from it, both speaking the
`/api/responses` protocol. Pointing it at a mail endpoint sends per-answer
traffic the script does not understand and breaks the responses page. One name,
one job.

**The post goes out as `text/plain`.** A cross-origin POST with
`Content-Type: application/json` makes the browser send a CORS preflight first,
Apps Script has no way to answer one, and the real request never happens: the
failure looks like a dead network rather than a misconfiguration. `text/plain`
is a simple request with no preflight; the body is still the same JSON text and
the script still reads it with `JSON.parse`. This is already handled in
`src/survey/mail.js`; it is written down here because anyone who later
"corrects" that header will break delivery and the symptom will not point at
the cause.

### If you would rather not use Google

Anything that accepts a POST and answers 2xx works, including a Vercel function
in this same project (same origin, so the content type stops mattering). The
body is one JSON object:

```json
{ "name": "Reviewer's name",
  "submitted": "2026-10-11T22:08:58.728Z",
  "answers": "page · question → answer\npage · question → answer" }
```

`_subject`, `_template` and `_captcha` also ride along for the relay's benefit;
ignore them.

### What the survey does when nothing is set up

It still works and nothing is lost. The response is written to the reviewer's
browser as they answer, the submit button reports *Saved. It will send on its
own*, and the response is retried a couple of seconds after every page load and
whenever the network comes back. It is delivered the moment any transport
accepts it: including the relay, the moment you click its activation link. The
reviewer never sees an error, because none of this is their problem.

## The central store, for the responses page

`/api/responses` collects every answer as it is given, and `/#/responses` reads
them back. Without a store attached, nothing is collected centrally and the
only copy of a reviewer's answers is the one in their own browser. These are the
steps to change that.

### 1. Create the store

Vercel KV as a first-party product is retired; the store now comes from the
Marketplace and is Upstash Redis underneath. It still sets the same two
environment variables, which is all the function looks for.

1. Open the Vercel dashboard, project **mindmappaitent**.
2. **Storage** → **Create Database** → **Marketplace Database Providers** →
   **Upstash** → **Redis**. Name it `mindmap-responses`, region closest to you.
3. On the new store, **Connect Project** → **mindmappaitent** → connect to
   **Production**, **Preview** and **Development**.

Connecting sets `KV_REST_API_URL` and `KV_REST_API_TOKEN` on the project. The
function checks for exactly those two names and uses the store only when both
are present.

### 2. The client is already installed

`@vercel/kv` is in `package.json`. npm prints a deprecation warning on install
, that notice is about the hosted product moving to the Marketplace, not about
the client, which still speaks the same REST protocol Upstash exposes through
those two variables. Nothing to do here unless the install was skipped:

```
npm i @vercel/kv
```

The import in `api/responses.js` is a dynamic `import()` inside a `try`, so the
build does not break if this step is skipped, the function silently falls back
to memory instead. That is the failure this step exists to prevent, so do not
skip it.

### 3. Redeploy

Pushing in step 2 is enough. If you changed only environment variables, use
**Deployments** → latest → **Redeploy**; env vars are read at runtime but a
redeploy is the reliable way to be sure the new ones are in place.

### 4. Read the responses

Open `/#/responses` on the deployed site.

The page shows every reviewer, grouped by name: when they started, how many
questions they answered, their star rating, and every answer in full. Above the
list is the respondent count, the mean rating and a bar for every scale
question.

Check the **Source** tile at the top right of the summary:

- **KV store** , responses are being kept. This is what you want.
- **Server, in memory** , the API is running but has no store. A banner says so.
  Go back to step 1.
- **This browser** , the API could not be reached at all. A banner says why.

### 5. Export

On the responses page: **Download CSV** (opens in Excel or Sheets, one row per
answer, with the question text in its own column) or **Download JSON** (the same
data grouped by respondent, for anything else). Both files contain everyone, not
just whoever the on-screen filter is showing.

Individual reviewers can also export their own answers from the last block of
the site, which is the only route to their data when there is no KV store.

### What happens with no KV store

Nothing is lost from the reviewer's point of view and everything is lost from
yours. Answers are written to that reviewer's own browser as they go, so they
see a working survey and can download their own CSV at the end. The POST to
`/api/responses` either fails quietly or lands in one serverless instance's
memory, which is wiped by the next deploy, the next cold start, or the platform
recycling the instance, and there is more than one instance, so two reviewers
can write to two different copies that never see each other.

In other words: without the KV store, **the only person who can retrieve a
reviewer's answers is that reviewer**, by hand, from the machine they used. If
you are sending the site out for review, do step 1 first.

### The responses page is unlisted, not secured

`/#/responses` is not linked from anywhere and is not in the site's route list.
That is obscurity. Anyone who has the URL can open it, and the URL is guessable.

There is deliberately no login: a password checked in a static bundle is checked
by code the visitor controls, against a secret the visitor can read. It would
look like protection and be worth nothing, which is worse than an honest gap
because it stops you from closing the real one.

The optional key is the same caveat one layer down. Set `RESPONSES_KEY` (server
env, any random string) and `VITE_RESPONSES_KEY=1` (build env, a flag only, its
value is never used as the key and never reaches the bundle). The page then
reads `?key=…` from the URL it was opened with and sends it as an
`x-responses-key` header, and the API refuses `GET` without it. This stops a
casual URL guess. It does not survive the link being forwarded, pasted into a
chat, or landing in someone's browser history.

Real protection is one of:

- **Vercel deployment protection** , Project → **Settings** → **Deployment
  Protection** → **Vercel Authentication**, which requires a Vercel login to
  view the deployment at all. Note that it covers the whole site, so reviewers
  would need accounts; usually you turn it on after the review window closes.
- **An access-controlled store** , move reading behind credentials the browser
  never holds, and fetch the data server-side.

Until one of those is on, treat everything on the responses page as public.
