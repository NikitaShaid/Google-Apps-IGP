const API_KEY = "lDg8yhFiFBYGRtLglFhFNBVYsWWHiC9WRlroNLYgqaXo9Tp1jGl5f94CDFJssjoJyBgsWHvLZWgwnus2sTQ46KxKFqjRx3qzfpXuRY77wbgcdTKlxbAy44M6PwGJI4Px"
const TEMPLATE_DOCUMENTS = ['14hXgzweRO9bYOKnfZwrJThfZJte8TT4pYVeFf0Ce2wg', '1g5K_ONv3tU6UbRX5E_XPrm4CgwVbrqZ0kcqP2TvZqAo', '1znBxOFlTWOUlc47KIb4qlLmdVMl-5lPjlB_676o-2Xc']
const DIRECTORY_DOCUMENT_FOLDER_ID = '1k6KIBGo_BX1mUbVyzxhfjocsm3RhsTUx'
const DOCUMENT_USERS_LINK_INFO_ID = '1fkksXMuZ9wZ04yS5kyjy-nv8WGBIzX48tbr_mIXlBCE'
const RESPONSE_TRY_COUNT = 3
const DOCUMENT_NAMES = ["workbook-one", "workbook-two", "workbook-three"]
const GC_GROUP_ID = 3671819

function updateData() {
  const userInfoSpreadsheet = SpreadsheetApp.openById(DOCUMENT_USERS_LINK_INFO_ID).getSheetByName("Main")
  const export_id = createExport(0)
  Utilities.sleep(25000)
  const user_data = exportUsers(0, export_id)
  const users = parseUsersFromExport(user_data)
  processNewUsers(users, userInfoSpreadsheet)
}

function createExport(req_count) {
  if (req_count > 2) {
    throw new Error("export creation error, too many requests");
  }

  const url = `https://gc.igp.academy/pl/api/account/groups/${GC_GROUP_ID}/users?key=${API_KEY}`
  const options = {
    'method': 'get',
  }

  const response = UrlFetchApp.fetch(url, options)
  const json = response.getContentText()
  let data = JSON.parse(json)

  if (!data.success) {
    console.log("failed to create export")
    console.log(data)
    Utilities.sleep(15000)
    data = createExport(req_count + 1)
  }
  console.log(`Export ID: ${data.info.export_id}`)
  return data.info.export_id
}

function exportUsers(req_count, export_id) {
  if (req_count > 4) {
    throw new Error("user export error, too many requests");
  }

  const url = `https://gc.igp.academy/pl/api/account/exports/${export_id}?key=${API_KEY}`
  const options = {
    'method': 'get',
  }

  const response = UrlFetchApp.fetch(url, options)
  const json = response.getContentText()
  let data = JSON.parse(json)

  if (!data.success) {
    console.log("failed to export users")
    Utilities.sleep(25000 * req_count + 1)
    req_count++
    data = exportUsers(req_count, export_id)
  }
  console.log(`User data:`)
  console.log(data)
  return data
}

function parseUsersFromExport(data) {
  const keyList = {
    id: true,
    Email: true,
    Name: true,
    "workbook-one": true,
    "workbook-two": true,
    "workbook-three": true
  }

  data.info.fields.forEach((field, index) => {
    if (keyList[field]) {
      keyList[field] = index
    }
  })

  const users = data.info.items.map(item => {
    const user = {}

    for (const key in keyList) {
      user[key] = item[keyList[key]].toString()
    }

    return user
  })
  console.log(`Parsed users:`)
  console.log(users)
  return users
}

function processNewUsers(users, sheet) {
  const values = sheet.getRange("A2:A").getValues().map(a => a[0])
  let update = false
  users.forEach(user => {
    if (!values.includes(Number(user.id))) {
      update = true
      processNewUser(user, sheet)
    }
  })
  if (!update) {
    console.log("Nothing to update")
  }
}

function processNewUser(user, userInfoSpreadsheet) {
  user = generateDocuments(user)
  const req = buildUserUpdateRequest(user)
  recursive_req(req, 1)
  updateUserInfoSpreadsheet(userInfoSpreadsheet, user)
  console.log(`User ${user.id} updated`)
}

function recursive_req(req, count) {
  const response = UrlFetchApp.fetch(req.url, req.options)
  const json = response.getContentText()
  const data = JSON.parse(json)
  if (!data.success) {
    console.log(`update user request failed for the ${count} time`)
    Utilities.sleep(15000 * count)
    recursive_req(req, count + 1)
  }
}

function generateDocuments(user) {
  for (let i = 0; i < DOCUMENT_NAMES.length; i++) {
    const file = DriveApp.getFileById(TEMPLATE_DOCUMENTS[i])
    const dir = DriveApp.getFolderById(DIRECTORY_DOCUMENT_FOLDER_ID)
    const newFile = file.makeCopy(`Work Book ${i + 1} | ${user.Name}`, dir)
      .setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT)
    const id = newFile.getId()
    user[DOCUMENT_NAMES[i]] = `https://docs.google.com/document/d/${id}/edit`
  }
  return user
}

function buildUserUpdateRequest(user){
  const url = `https://gc.igp.academy/pl/api/users`
  const payload = {
    "user": {
      "addfields": {
        [DOCUMENT_NAMES[0]]: user["workbook-one"],
        [DOCUMENT_NAMES[1]]: user["workbook-two"],
        [DOCUMENT_NAMES[2]]: user["workbook-three"]
      },
      "email": user.Email
    },
    "system": {
      "refresh_if_exists": 1
    }
  }

  const requestBody = {
    "action": "add",
    "key": API_KEY,
    "params": Utilities.base64Encode(JSON.stringify(payload))
  }

  const options = {
    'method': 'post',
    'contentType': 'application/x-www-form-urlencoded',
    'payload': requestBody
  }

  return {
    url: url,
    options: options
  }
}

function updateUserInfoSpreadsheet(userInfoSpreadsheet, user) {
  const rowData = [
    user.id,
    user.Name,
    user.Email,
    false,
    user["workbook-one"],
    false,
    user["workbook-two"],
    false,
    user["workbook-three"],
  ]
  userInfoSpreadsheet.appendRow(rowData)
}

/++++++++
function deleteTrigger() {

  // Loop over all triggers and delete them
  var allTriggers = ScriptApp.getProjectTriggers();

  for (var i = 0; i < allTriggers.length; i++) {
    ScriptApp.deleteTrigger(allTriggers[i]);
  }
}

function createTrigger() {
  deleteTrigger();

  ScriptApp.newTrigger('UpdateData')
    .timeBased()
    .everyHours(8)
    .create();
}