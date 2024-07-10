// const API_KEY = "lDg8yhFiFBYGRtLglFhFNBVYsWWHiC9WRlroNLYgqaXo9Tp1jGl5f94CDFJssjoJyBgsWHvLZWgwnus2sTQ46KxKFqjRx3qzfpXuRY77wbgcdTKlxbAy44M6PwGJI4Px";

// // To many requests, wait 1 min and request again on error instead
// // Refactored 
// const RESPONSE_TRY_COUNT = 50;

// const TEMPLATE_DOCUMENTS = ['14hXgzweRO9bYOKnfZwrJThfZJte8TT4pYVeFf0Ce2wg', '1g5K_ONv3tU6UbRX5E_XPrm4CgwVbrqZ0kcqP2TvZqAo', '1znBxOFlTWOUlc47KIb4qlLmdVMl-5lPjlB_676o-2Xc'];
// const DIRECTORY_DOCUMENT_FOLDER_ID = '1k6KIBGo_BX1mUbVyzxhfjocsm3RhsTUx';
// const DOCUMENT_USERS_LINK_INFO_ID = '1fkksXMuZ9wZ04yS5kyjy-nv8WGBIzX48tbr_mIXlBCE';


// const defaultUser = {
//   id: "1",
//   Email: "test",
//   Name: "test",
//   "workbook-one": "test",
//   "workbook-two": "test",
//   "workbook-three": "test",
// }

// const documentNameArr = ["workbook-one", "workbook-two", "workbook-three"]


// function deleteTrigger() {

//   // Loop over all triggers and delete them
//   var allTriggers = ScriptApp.getProjectTriggers();

//   for (var i = 0; i < allTriggers.length; i++) {
//     ScriptApp.deleteTrigger(allTriggers[i]);
//   }
// }

// function createTrigger() {
//   deleteTrigger();

//   ScriptApp.newTrigger('UpdateData')
//     .timeBased()
//     .everyHours(8)
//     .create();
// }

// function UpdateData() {
//   const export_id = createExport();
//   const users = parseUsersFromExport(export_id);

//   console.log(users);

//   users.forEach((user) => {
//     const success = tryCreateDocumentsLink(user);

//     if (!success) return;

//     updateDocumentsLink(user);
//     writeUserInfoToDoc(user);
//   });
// }

// function createExport() {
//   const url = `https://gc.igp.academy/pl/api/account/groups/3671819/users?key=${API_KEY}`;

//   const options = {
//     'method': 'get',
//   }

//   const response = UrlFetchApp.fetch(url, options)
//   const json = response.getContentText();
//   const data = JSON.parse(json);

//   if (!data.success) {
//     console.log(data);
//     throw new Error("export creation error");
//   }

//   return data.info.export_id;
// }

// function parseUsersFromExport(export_id) {
//   const exportUrl = `https://gc.igp.academy/pl/api/account/exports/${export_id}?key=${API_KEY}`;

//   const options = {
//     'method': 'get',
//   };

//   let data = waitSuccessResponce(exportUrl, options);

//   const keyList = {
//     id: true,
//     Email: true,
//     Name: true,
//     "workbook-one": true,
//     "workbook-two": true,
//     "workbook-three": true,
//   }

//   data.info.fields.forEach((field, index) => {
//     if (keyList[field]) {
//       keyList[field] = index;
//     }
//   });

//   const users = data.info.items.map(item => {

//     const user = {};

//     for (const key in keyList) {
//       user[key] = item[keyList[key]].toString();
//     }

//     return user;
//   })

//   return users;
// }


// function tryCreateDocumentsLink(user = defaultUser) {
//   let updated = false;

//   for (let i = 0; i < documentNameArr.length; i++) {
//     const docName = documentNameArr[i];

//     if (isDocumentUrlValid(user[docName]))
//       continue;

//     const file = DriveApp.getFileById(TEMPLATE_DOCUMENTS[i]);
//     const dir = DriveApp.getFolderById(DIRECTORY_DOCUMENT_FOLDER_ID);
//     const newFile = file.makeCopy(`Work Book ${i + 1} | ${user.Name}`, dir)
//       .setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
//     const id = newFile.getId();

//     updated = true;
//     user[docName] = `https://docs.google.com/document/d/${id}/edit`;
//     console.log("Create new Document");
//   }

//   return updated;
// }

// function updateDocumentsLink(user = defaultUser) {
//   const url = `https://gc.igp.academy/pl/api/users`;
//   const payload = {
//     "user": {
//       "addfields": {
//         [documentNameArr[0]]: user["workbook-one"],
//         [documentNameArr[1]]: user["workbook-two"],
//         [documentNameArr[2]]: user["workbook-three"],
//       },
//       "email": user.Email,
//     },
//     "system": {
//       "refresh_if_exists": 1,
//     },
//   };

//   const requestBody = {
//     "action": "add",
//     "key": API_KEY,
//     "params": Utilities.base64Encode(JSON.stringify(payload))
//   };

//   const options = {
//     'method': 'post',
//     'contentType': 'application/x-www-form-urlencoded',
//     'payload': requestBody,
//   };

//   let data = waitSuccessResponce(url, options);

//   console.log(`Updated Document Url for user ${user.Email}: ${JSON.stringify(data, undefined, ' ')}`);
//   Utilities.sleep(5000);
// }

// function waitSuccessResponce(url, options) {
//   let response;
//   let json;
//   let data;

//   for (let i = 0; i < RESPONSE_TRY_COUNT; i++) {
//     response = UrlFetchApp.fetch(url, options);
//     json = response.getContentText();
//     data = JSON.parse(json);

//     if (data.success) {
//       return data;
//     }

//     console.log(`await success responce from ${url}\n${JSON.stringify(data, undefined, ' ')}`);

//     Utilities.sleep(5000);
//   }

//   throw new Error(`success responce await exited\n${JSON.stringify(data, undefined, " ")}`);
// }

// function writeUserInfoToDoc(user = defaultUser) {
//   const document = SpreadsheetApp.openById(DOCUMENT_USERS_LINK_INFO_ID);
//   const sheet = document.getSheetByName("Sheet1");
//   const rowData = [
//     user.id,
//     user.Name,
//     user.Email,
//     false,
//     user["workbook-one"],
//     false,
//     user["workbook-two"],
//     false,
//     user["workbook-three"],
//   ];

//   // перезаписать линку если есть айди в документе
//   if (sheet.getMaxRows() <= 1) return;

//   const range = sheet.getRange(2, 1, sheet.getMaxRows() - 1, rowData.length);
//   const rows = range.getValues();

//   const index = rows.findIndex(row => row[0] == user.id.toString() || row[0] === "");
//   if (index >= 0) {
//     const docData = rows[index];

//     rowData[3] = docData[3];
//     rowData[5] = docData[5];
//     rowData[7] = docData[7];

//     sheet
//       .getRange(index + 2, 1, 1, rowData.length)
//       .setValues([rowData]);

//     console.log(`update document row: ${index + 2} user: ${JSON.stringify(user, undefined, ' ')}`);
//     return;
//   }

//   sheet.appendRow(rowData);
//   console.log(`document write new user: ${JSON.stringify(user, undefined, ' ')}`);
// }

// function isDocumentUrlValid(url) {
//   if (!url) return false;

//   try {
//     const doc = DocumentApp.openByUrl(url);
//     if (doc.getId())
//       return true;
//   } catch (err) { }

//   console.log("document link not valid");

//   return false;
// }