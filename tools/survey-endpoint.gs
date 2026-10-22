/* MindMap survey endpoint (Google Apps Script web app).
 *
 * Appends each response to a sheet, one column per question, then emails a
 * notification. The row is written first so a failed email never loses a
 * response. Every request gets a 200 with a JSON body; malformed bodies are
 * logged raw to a second sheet so clients do not retry forever.
 *
 * Setup: paste into Apps Script and deploy as a web app. After editing, deploy
 * a new version (Deploy > Manage deployments > Version: New version); the URL
 * stays the same.
 */

var MAIL_TO = '2020mik2020@gmail.com'
// Responses to the current survey go to their own sheet.
var SHEET_RESPONSES = 'Responses 2'
var SHEET_RAW = 'Unparsed'

/* One entry per question, in the order of ALL_ITEMS in src/survey/questions.js
 * and FIELD_IDS in src/survey/mail.js; this is also the sheet's column order.
 * avg: true for 1 to 5 ratings (sent as numbers), false for bands and free
 * text (sent as labels).
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
