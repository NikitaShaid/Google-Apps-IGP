const API_KEY = "lDg8yhFiFBYGRtLglFhFNBVYsWWHiC9WRlroNLYgqaXo9Tp1jGl5f94CDFJssjoJyBgsWHvLZWgwnus2sTQ46KxKFqjRx3qzfpXuRY77wbgcdTKlxbAy44M6PwGJI4Px";

const RESPONSE_TRY_COUNT = 50;

const DIRECTORY_DOCUMENT_STORAGE_ID = '1k6KIBGo_BX1mUbVyzxhfjocsm3RhsTUx';
const TEMPLATE_DOCUMENT_ID = '1gMgkZJ6qBnFViPB7sP1jxjgp-iRD4_cir5MqpIXeubo';
const DOCUMENT_USERS_LINK_INFO_ID = '1fkksXMuZ9wZ04yS5kyjy-nv8WGBIzX48tbr_mIXlBCE';

function data() {
  const export_id = createExport();
  const users = parseUsersFromExport(export_id);

  console.log(users);

  users.forEach((user) => {
    const url = tryCreateDocumentLink(user);
    if (!url) return;
    updateDocumentLink(user.email, url);
    writeUserDocLink(user.id, url);
  });
}

function createExport() {
  const url = `https://gc.igp.academy/pl/api/account/users?key=${API_KEY}&status=active`;

  const options = {
    'method': 'get',
  }

  const response = UrlFetchApp.fetch(url, options)
  const json = response.getContentText();
  const data = JSON.parse(json);

  if (!data.success) {
    console.log(data);
    throw new Error("export creation error");
  }

  return data.info.export_id;
}

function parseUsersFromExport(export_id) {
  const exportUrl = `https://gc.igp.academy/pl/api/account/exports/${export_id}?key=${API_KEY}`;

  const options = {
    'method': 'get',
  };

  let data = waitSuccessResponce(exportUrl, options);

  const keyList = {
    id: 0,
    Email: 1,
    Document: 25,
  }

  data.info.fields.forEach((field, index) => {
    keyList[field] = index;
  });

  let users = [];
  data.info.items.forEach(item => {

    const user = {
      "id": item[keyList.id],
      "email": item[keyList.Email],
      "Document": item[keyList.Document]
    }
    users.push(user);
  })

  return users
}


function tryCreateDocumentLink(user) {
  if (isDocumentUrlValid(user.Document))
    return false;

  const file = DriveApp.getFileById(TEMPLATE_DOCUMENT_ID);
  const dir = DriveApp.getFolderById(DIRECTORY_DOCUMENT_STORAGE_ID);
  const newFile = file.makeCopy(`${user.email} - Data`, dir)
    .setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
  const id = newFile.getId();

  return `https://docs.google.com/spreadsheets/d/${id}/edit`;
}

function updateDocumentLink(email, link) {
  const url = `https://gc.igp.academy/pl/api/users`;
  const payload = {
    "user": {
      "addfields": { "Document": link.toString() },
      "email": email.toString(),
    },
    "system": {
      "refresh_if_exists": 1,
    },
  };

  const requestBody = {
    "action": "add",
    "key": API_KEY,
    "params": Utilities.base64Encode(JSON.stringify(payload))
  };

  const options = {
    'method': 'post',
    'contentType': 'application/x-www-form-urlencoded',
    'payload': requestBody,
  };

  let data = waitSuccessResponce(url, options);

  console.log(`Updated Document Url for user ${email}: ${JSON.stringify(data, undefined, ' ')}`);
  Utilities.sleep(5000);
}

function waitSuccessResponce(url, options) {
  let response;
  let json;
  let data;

  for (let i = 0; i < RESPONSE_TRY_COUNT; i++) {
    response = UrlFetchApp.fetch(url, options);
    json = response.getContentText();
    data = JSON.parse(json);

    if (data.success) {
      return data;
    }

    console.log(`await success responce from ${url}\n${JSON.stringify(data, undefined, ' ')}`);

    Utilities.sleep(5000);
  }

  throw new Error(`success responce await exited\n${JSON.stringify(data, undefined, " ")}`);
}

function writeUserDocLink(userId, link) {
  const document = SpreadsheetApp.openById(DOCUMENT_USERS_LINK_INFO_ID);
  const sheet = document.getSheetByName("Sheet1");

  // перезаписать линку если есть айди в документе
  if (sheet.getMaxRows() > 1) {
    const range = sheet.getRange(1, 1, sheet.getMaxRows() - 1, 2);
    const rows = range.getValues();

    const index = rows.findIndex(row => row[0] == userId);
    if (index > 0) {
      sheet.getRange(index + 1, 2).setValue(link);
      console.log(`update document user_id: ${userId} link: ${link}`);
      return;
    }
  }

  // записать новый айди
  sheet.appendRow([userId, link]);
  console.log(`document write new user_id: ${userId} link: ${link}`);
}

function isDocumentUrlValid(url) {
  if (!url) return false;

  try {
    const sheet = SpreadsheetApp.openByUrl(url);
    if (sheet.getId())
      return true;
  } catch (err) { }

  console.log("document link not valid");

  return false;
}