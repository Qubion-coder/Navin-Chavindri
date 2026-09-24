function doPost(e) {
  return handleRequest(e);
}

function doGet(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const params = e.parameter;
    const formName = params.formName;
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    let sheetName = "";
    if (formName === "rsvp") {
      sheetName = "RSVP";
    } else if (formName === "wish") {
      sheetName = "Wishes";
    } else {
      return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": "Invalid formName" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
    }

    let headers = [];
    if (formName === "rsvp") {
      headers = ["Timestamp", "Name", "Guests", "Dietary Notes"];
    } else if (formName === "wish") {
      headers = ["Timestamp", "Name", "Message"];
    }

    // Check if headers exist
    const range = sheet.getRange(1, 1, 1, Math.max(sheet.getMaxColumns(), headers.length));
    const existingHeaders = range.getValues()[0];
    
    let isHeaderMissing = false;
    for (let i = 0; i < headers.length; i++) {
      if (existingHeaders[i] !== headers[i]) {
        isHeaderMissing = true;
        break;
      }
    }

    if (isHeaderMissing) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    }

    const rowData = [new Date()];
    for (let i = 1; i < headers.length; i++) {
      rowData.push(params[headers[i]] || "");
    }

    sheet.appendRow(rowData);

    return ContentService.createTextOutput(JSON.stringify({ "result": "success", "row": sheet.getLastRow() }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
