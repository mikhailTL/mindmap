/* MindMap survey endpoint: a Google Apps Script web app.
 *
 * Why this file is here. The site is a static build: there is no server of
 * ours between a reviewer's browser and a mailbox. Delivery therefore depends
 * on something outside the bundle, and the free relay the site falls back to
 * has an activation step, a rate limit, and an uptime nobody here controls.
 * This is the owner-controlled transport that goes first. Twelve lines of
 * setup, no key in the bundle (the URL is a destination, not a secret), and
 * the durable record is a spreadsheet rather than an inbox, so a response
 * survives a mail that bounces, a full mailbox, or a label that hides it.
 *
 * Setup is in SURVEY-SETUP.md, "Your own endpoint".
 *
 * ─── Changed on 13 October: REDEPLOY IS REQUIRED ────────────────────────────
 * The survey was replaced. It is no longer a ten-item usability scale with a
 * published benchmark; it is twelve house questions, three of them bands. The
 * browser now posts one flat field per question alongside the prose blob, so
 * this script writes ONE COLUMN PER QUESTION and the sheet can be averaged a
 * column at a time.
 *
 * Two consequences the owner has to act on:
 *
 * 1. PASTE THIS FILE OVER THE SCRIPT AND DEPLOY A NEW VERSION. Apps Script
 *    serves the deployed version, not the saved file, so saving alone changes
 *    nothing: Deploy > Manage deployments > the pencil > Version: New version
 *    > Deploy. The deployment URL does not change, so nothing in the site's
 *    env needs touching.
 * 2. The responses go to a NEW SHEET, named below. The old 'Responses' sheet
 *    is left exactly as it is, because its rows answered the retired
 *    questions and writing new answers under its old header would put a band
 *    in a column labelled 'name' and a blank in nine others. Keep it; it is
 *    the record of what was asked before.
 *
 * Two things this deliberately does in this order:
 *
 * 1. The row is written before the mail is sent. A spreadsheet append is the
 *    durable half; the mail is a notification. If the mail fails the response
 *    is still kept and the browser is still told 'accepted', because it has
 *    been. The reverse order would throw away a response over a notification.
 * 2. Every request is answered 200 with a JSON body, including a malformed
 *    one, which is logged raw to a second sheet. A 500 from here would make a
 *    client that already has the answers retry forever against a bug.
 */

var MAIL_TO = '2020mik2020@gmail.com'
/* New sheet, new header. See note 2 above before renaming this back. */
var SHEET_RESPONSES = 'Responses 2'
var SHEET_RAW = 'Unparsed'

/* One entry per question, in ask order, mirroring ALL_ITEMS in
 * src/survey/questions.js and FIELD_IDS in src/survey/mail.js. The order here
 * is the column order in the sheet, so changing it moves every column.
 *
 * `avg` records whether a column may be averaged, and it is the one thing in
 * this file worth reading twice:
 *
 *   true  -> a one-to-five rating, or the half-star rating. The browser sends
 *            the NUMBER for these, so the column averages.
 *   false -> a band or a free text. The browser sends the LABEL, because the
 *            number behind a band is its position in a list. A mean of
 *            'Parent or guardian' is arithmetic on a word.
 *
 * There is NO composite column and no grade column, on purpose. The retired
 * instrument had a published mean to compare a total against; these questions
 * were written for this product, so a total of them has nothing to be read
 * against and a grade drawn on it would be invented. Do not add one.
 */
var FIELDS = [
  { id: 'who-age',          head: 'age group',            avg: false },
  { id: 'who-role',         head: 'role',                 avg: false },
  { id: 'who-school',       head: 'school level',         avg: false },
  { id: 'use-easy',         head: 'easy to use 1-5',      avg: true  },
  { id: 'sentence-clear',   head: 'sentence clear 1-5',   avg: true  },
  { id: 'use-again',        head: 'would use 1-5',        avg: true  },
  { id: 'trust-parent',     head: 'share parent 1-5',     avg: true  },
  { id: 'trust-clinician',  head: 'share clinician 1-5',  avg: true  },
  { id: 'would-recommend',  head: 'would recommend 1-5',  avg: true  },
  { id: 'stars',            head: 'rating of 5',          avg: true  },
  { id: 'blocker',          head: 'what would stop them', avg: false },
  { id: 'blocker-note',     head: 'note',                 avg: false },
]

function doPost(e) {
  var raw = (e && e.postData && e.postData.contents) || ''
  var data = null
  try { data = JSON.parse(raw) } catch (err) { data = null }

  if (!data || typeof data !== 'object') {
    append_(SHEET_RAW, ['timestamp', 'body'], [new Date(), raw.slice(0, 40000)])
    return json_({ ok: true, stored: 'raw' })
  }

  /* No name. The survey collects none: teenagers answer it, and a first name
     beside an age band and a school-level band identifies a person in a way
     that none of the three does alone. `respondent` is the tail of a random
     code the browser generates, and it is there only so two responses that
     arrive a minute apart can be told apart. Older clients sent `name`; it is
     read as a fallback so a response from a stale tab is not lost, and
     nothing is done with it beyond putting it in that one cell. */
  var who = String(data.respondent || data.name || 'anonymous')
  var submitted = String(data.submitted || new Date().toISOString())
  var answers = String(data.answers || '')
  var count = answers ? answers.split('\n').filter(function (l) { return l.trim() }).length : 0

  var header = ['received', 'submitted', 'respondent']
  var row = [new Date(), submitted, who]
  for (var i = 0; i < FIELDS.length; i++) {
    var f = FIELDS[i]
    header.push(f.head)
    var v = data[f.id]
    v = (v === null || v === undefined) ? '' : String(v)
    /* Rated columns go in as numbers so the sheet can average them without
       anybody retyping a column. A blank stays blank rather than becoming a
       zero: a zero is an answer and an unanswered question is not. */
    if (f.avg && v !== '') {
      var n = Number(v)
      row.push(isNaN(n) ? v : n)
    } else {
      row.push(v)
    }
  }
  header.push('answer count')
  header.push('every answer')
  row.push(count)
  row.push(answers)

  append_(SHEET_RESPONSES, header, row)

  /* After the row. A notification that fails is a notification; a response
     that was never written down is gone. */
  try {
    MailApp.sendEmail({
      to: MAIL_TO,
      subject: 'MindMap feedback: ' + who,
      body:
        who + ' answered ' + count + ' question' + (count === 1 ? '' : 's') +
        '\nsubmitted ' + submitted +
        '\n\n' + answers +
        '\n\n--\nAlso saved to the ' + SHEET_RESPONSES + ' sheet: ' +
        SpreadsheetApp.getActiveSpreadsheet().getUrl(),
    })
  } catch (err) {}

  return json_({ ok: true, stored: 'response', answers: count })
}

/* Opening the deployment URL in a browser should say something useful, so the
   setup can be checked without sending a fake response. It also reports which
   sheet is being written, which is the fastest way to tell a redeployed script
   from a stale one. */
function doGet() {
  var n = 0
  try {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RESPONSES)
    if (sh) n = Math.max(0, sh.getLastRow() - 1)
  } catch (err) {}
  return json_({ ok: true, endpoint: 'mindmap survey', sheet: SHEET_RESPONSES, responses: n })
}

/* Creates the sheet with its header on first use. An existing sheet is never
   re-headed: if the header on it differs from the one above, the script is
   writing to the wrong sheet and the fix is to change SHEET_RESPONSES, not to
   rewrite row 1 over somebody's data. */
function append_(sheetName, header, row) {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sh = ss.getSheetByName(sheetName)
  if (!sh) {
    sh = ss.insertSheet(sheetName)
    sh.appendRow(header)
    sh.setFrozenRows(1)
    sh.getRange(1, 1, 1, header.length).setFontWeight('bold')
  }
  sh.appendRow(row)
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  )
}
