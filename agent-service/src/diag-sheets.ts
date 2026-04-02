import { google } from 'googleapis';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Try to load env from parent directory if needed
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function diagnose() {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID || '1-EGTgJfeAAEVwPodDJyFbtleM5ww7qZZHJ9J-GJ4YzM';
    console.log(`📊 Checking Spreadsheet: ${spreadsheetId}`);

    // Auth setup using service-account-key.json in root
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, '../../service-account-key.json'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A:F',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('❌ No data found.');
      return;
    }

    console.log(`✅ Found ${rows.length} rows.`);
    console.log('--- LATEST 3 ENTRIES ---');
    rows.slice(-3).forEach((row, i) => {
      console.log(`Row ${rows.length - 2 + i}: ${row.join(' | ').substring(0, 200)}...`);
    });

  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }
}

diagnose();
