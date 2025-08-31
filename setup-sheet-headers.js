const { google } = require('googleapis');

async function setupSheetHeaders() {
  try {
    console.log('🔧 Setting up Google Sheet headers...');
    
    const auth = new google.auth.GoogleAuth({
      keyFile: './service-account-key.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    const spreadsheetId = '1-EGTgJfeAAEVwPodDJyFbtleM5ww7qZZHJ9J-GJ4YzM';

    // Check if headers already exist
    const currentData = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A1:F1',
    });

    const firstRow = currentData.data.values?.[0];
    const hasHeaders = firstRow && firstRow[0] === 'Timestamp';

    if (hasHeaders) {
      console.log('✅ Headers already exist, skipping setup');
      return;
    }

    // Insert new row at the top for headers
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          insertDimension: {
            range: {
              sheetId: 0,
              dimension: 'ROWS',
              startIndex: 0,
              endIndex: 1
            },
            inheritFromBefore: false
          }
        }]
      }
    });

    // Add headers to the new first row
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1:F1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          'Timestamp',
          'Session ID', 
          'Raw Intake Data',
          'IMPACT Analysis',
          'Learner Profile',
          'Recommendations'
        ]]
      }
    });

    // Format the header row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 6
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.6, blue: 0.9 },
                  textFormat: { 
                    bold: true, 
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    fontSize: 11
                  },
                  horizontalAlignment: 'CENTER'
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
            }
          },
          {
            updateSheetProperties: {
              properties: {
                sheetId: 0,
                gridProperties: {
                  frozenRowCount: 1
                }
              },
              fields: 'gridProperties.frozenRowCount'
            }
          }
        ]
      }
    });

    console.log('✅ Headers added and formatted successfully!');
    console.log('✅ First row is now frozen and protected');

  } catch (error) {
    console.error('❌ Error setting up headers:', error.message);
  }
}

setupSheetHeaders();