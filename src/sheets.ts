export function getSpreadsheet(): GoogleAppsScript.Spreadsheet.Spreadsheet {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('SPREADSHEET_ID is not set in Script Properties');
  return SpreadsheetApp.openById(id);
}

export function getSheet(name: string): GoogleAppsScript.Spreadsheet.Sheet {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error(`Sheet "${name}" not found`);
  return sheet;
}

export function getSheetData(name: string): Record<string, string>[] {
  const sheet = getSheet(name);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(String);

  return data.slice(1).map(row => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] === '' || row[i] === null || row[i] === undefined
        ? ''
        : String(row[i]);
    });
    return obj;
  });
}

export function appendRow(sheetName: string, data: Record<string, string>): void {
  const sheet = getSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const row = headers.map(h => data[h] || '');
  sheet.appendRow(row);
}

export function findRowIndex(sheetName: string, column: string, value: string): number {
  const sheet = getSheet(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(String);
  const colIndex = headers.indexOf(column);
  if (colIndex === -1) return -1;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][colIndex]) === value) return i + 1; // 1-based row number
  }
  return -1;
}

export function updateCell(sheetName: string, row: number, column: string, value: string): void {
  const sheet = getSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const colIndex = headers.indexOf(column);
  if (colIndex === -1) throw new Error(`Column "${column}" not found in ${sheetName}`);
  sheet.getRange(row, colIndex + 1).setValue(value);
}

export function generateId(): string {
  return Utilities.getUuid();
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
