// Paste this into script.google.com (New project), replace FOLDER_ID, then Deploy > New deployment > Web app.
// Execute as: Me. Who has access: Anyone.

var FOLDER_ID = 'PUT_YOUR_DRIVE_FOLDER_ID_HERE';

function doPost(e) {
  try {
    var folder = DriveApp.getFolderById(FOLDER_ID);
    var data = JSON.parse(e.postData.contents);

    var decoded = Utilities.base64Decode(data.fileData);
    var guest = clean(data.guestName);
    var safeName = (guest ? guest + '_' : '') + clean(data.fileName);
    var blob = Utilities.newBlob(decoded, data.mimeType, safeName);
    var file = folder.createFile(blob);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      fileId: file.getId(),
      fileName: file.getName()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Keep Cyrillic. A Latin-only whitelist erases every Bulgarian guest name,
// which defeats the point of asking for one.
var FORBIDDEN = '/\\:*?"<>|';

function clean(s) {
  var out = '';
  s = String(s == null ? '' : s);
  for (var i = 0; i < s.length; i++) {
    var ch = s.charAt(i);
    if (ch.charCodeAt(0) > 31 && FORBIDDEN.indexOf(ch) === -1) out += ch;
  }
  return out.replace(/\s+/g, ' ').trim().slice(0, 80);
}
