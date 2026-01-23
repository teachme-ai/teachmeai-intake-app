const { google } = require('googleapis');
const fs = require('fs');

async function testWrite() {
    try {
        console.log('🧪 Testing Google Sheets Write...');

        // 1. Check if key file exists
        if (!fs.existsSync('./service-account-key.json')) {
            throw new Error('service-account-key.json not found in current directory');
        }

        const auth = new google.auth.GoogleAuth({
            keyFile: './service-account-key.json',
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = '1-EGTgJfeAAEVwPodDJyFbtleM5ww7qZZHJ9J-GJ4YzM';

        console.log(`📊 Spreadsheet ID: ${spreadsheetId}`);

        const values = [[
            new Date().toISOString(),
            'TEST_SESSION_LOCAL',
            'Test raw data',
            'Test AI analysis',
            'Test profile',
            'Test recommendations'
        ]];

        const result = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Sheet1!A:F',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values },
        });

        console.log('✅ Success! Test row appended.');
        console.log('✅ Updated Range:', result.data.updates.updatedRange);
        console.log('👉 Check your sheet now!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.message.includes('permission')) {
            console.log('\n💡 TIP: You MUST share the sheet with the client_email found in service-account-key.json');
        }
    }
}

testWrite();
