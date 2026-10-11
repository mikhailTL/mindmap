/* MindMap survey endpoint — a Google Apps Script web app.
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
var SHEET_RESPONSES = 'Responses'
var SHEET_RAW = 'Unparsed'

function doPost(e) {
  var raw = (e && e.postData && e.postData.contents) || ''
  var data = null
  try { data = JSON.parse(raw) } catch (err) { data = null }

  if (!data || typeof data !== 'object') {
    append_(SHEET_RAW, ['timestamp', 'body'], [new Date(), raw.slice(0, 40000)])
    return json_({ ok: true, stored: 'raw' })
  }

  var name = String(data.name || 'Anonymous')
  var submitted = String(data.submitted || new Date().toISOString())
  var answers = String(data.answers || '')
  var count = answers ? answers.split('\n').filter(function (l) { return l.trim() }).length : 0

  append_(
    SHEET_RESPONSES,
    ['received', 'submitted', 'name', 'answers', 'answer count'],
    [new Date(), submitted, name, answers, count]
  )

  /* After the row. A notification that fails is a notification; a response
     that was never written down is gone. */
  try {
    MailApp.sendEmail({
      to: MAIL_TO,
      subject: 'MindMap feedback: ' + name,
      body:
        name + ' answered ' + count + ' question' + (count === 1 ? '' : 's') +
        '\nsubmitted ' + submitted +
        '\n\n' + answers +
        '\n\n--\nAlso saved to the Responses sheet: ' +
        SpreadsheetApp.getActiveSpreadsheet().getUrl(),
    })
  } catch (err) {}

  return json_({ ok: true, stored: 'response', answers: count })
}

/* Opening the deployment URL in a browser should say something useful, so the
   setup can be checked without sending a fake response. */
function doGet() {
  var n = 0
  try {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RESPONSES)
    if (sh) n = Math.max(0, sh.getLastRow() - 1)
  } catch (err) {}
  return json_({ ok: true, endpoint: 'mindmap survey', responses: n })
}

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
