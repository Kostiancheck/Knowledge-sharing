function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Mono Menu')
      .addItem('Upload new transactions', 'uploadTransactions')
      .addToUi();
}

function uploadTransactions() {
  var ss= SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var tableTransaction = sheet.getRange(2,1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  var from = 0;
  for (let step = 0; step < tableTransaction.length; step++) {
    if (tableTransaction[step][6].valueOf() > from && tableTransaction[step][0] === 'Mono'){
      from = tableTransaction[step][6].valueOf() + 1000
    }
  }

  var account = 0;
  var to = Date.now();

  if (to - from > 30 * 24 * 60 * 60 * 1000) {
    from = to - 30 * 24 * 60 * 60 * 1000 + 1000
  }

  var URL_STRING = `https://api.monobank.ua/personal/statement/${account}/${from}/${to}`;
  var options = {
    'method' : 'get',
    'headers': {'X-Token' : 'ENTER-YOUR-TOKEN-HERE'} // take token from https://api.monobank.ua/
  };
  Logger.log(URL_STRING)

  var response = UrlFetchApp.fetch(URL_STRING, options);
  var json = response.getContentText();
  var transactions = JSON.parse(json);

  var transactionsCnt = transactions.length
  if (transactionsCnt >= 500 ){
    throw "To many transactions. Ask Kostia to update the logic"
  }

  for (let step = transactionsCnt - 1; step >= 0; step--) {
    // Runs 5 times, with values of step 0 through 4.
    Logger.log(transactions[step])

    var transaction = transactions[step];
    var entry = ['Mono', false, transaction.balance / 100, transaction.amount / 100,
    transaction.cashbackAmount / 100, transaction.description, new Date(transaction.time * 1000), 'Інше']
    Logger.log(entry)
    try {
      sheet
          .insertRowBefore(2)
          .getRange(2, 1, 1, entry.length)
          .setValues([entry]);
          } catch (e) {
          sheet
          .deleteRow(2)
        throw e;
      }
  }
}
