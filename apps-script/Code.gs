// Paste this into script.google.com (New project), replace FOLDER_ID, then Deploy > New deployment > Web app.
// Execute as: Me. Who has access: Anyone.

var FOLDER_ID = 'PUT_YOUR_DRIVE_FOLDER_ID_HERE';

function doPost(e) {
  try {
    var folder = DriveApp.getFolderById(FOLDER_ID);
    var data = JSON.parse(e.postData.contents);

    var decoded = Utilities.base64Decode(data.fileData);
    var safeName = (data.guestName ? data.guestName.replace(/[^a-zA-Z0-9 _-]/g, '') + '_' : '') + data.fileName;
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
