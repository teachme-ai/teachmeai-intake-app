const { google } = require('googleapis');

async function testAdminData() {
  try {
    console.log('🔍 Testing admin data access...');
    
    const auth = new google.auth.GoogleAuth({
      keyFile: './service-account-key.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: '1-EGTgJfeAAEVwPodDJyFbtleM5ww7qZZHJ9J-GJ4YzM',
      range: 'Sheet1!A:G',
    });

    const rows = response.data.values || [];
    console.log(`✅ Found ${rows.length} rows in Google Sheet`);
    
    // Process the data like the admin API does
    const submissions = rows.map((row, index) => {
      if (!row || row.length === 0) return null;
      
      let rawResponses = {};
      let impactAnalysis = {};
      let currentRoles = 'None selected';
      
      if (row.length >= 4) {
        try {
          if (row[2] && row[2].startsWith('{')) {
            rawResponses = JSON.parse(row[2]);
            currentRoles = rawResponses.currentRoles?.join(', ') || 'None selected';
          } else {
            currentRoles = row[2] || 'None selected';
            if (row[3] && row[3].startsWith('{')) {
              rawResponses = JSON.parse(row[3]);
            }
          }
          
          const analysisColumn = row[2] && row[2].startsWith('{') ? row[3] : row[4];
          if (analysisColumn && analysisColumn.startsWith('{')) {
            impactAnalysis = JSON.parse(analysisColumn);
          }
        } catch (parseError) {
          console.warn(`⚠️ Parsing error for row ${index}:`, parseError.message);
        }
      }
      
      return {
        id: index + 1,
        timestamp: row[0] || 'Unknown',
        sessionId: row[1] || 'Unknown',
        currentRoles,
        learnerType: rawResponses.learnerType || 'Unknown',
        skillStage: rawResponses.skillStage || 'Unknown',
        learnerProfile: impactAnalysis.learnerProfile || 'Unknown'
      };
    }).filter(Boolean);

    console.log(`✅ Processed ${submissions.length} valid submissions`);
    
    submissions.forEach((sub, i) => {
      console.log(`📊 Submission ${i + 1}:`);
      console.log(`   - Session: ${sub.sessionId.slice(-8)}`);
      console.log(`   - Type: ${sub.learnerType}`);
      console.log(`   - Roles: ${sub.currentRoles}`);
      console.log(`   - Skill: ${sub.skillStage}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAdminData();