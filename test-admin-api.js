const fetch = require('node-fetch');

async function testAdminAPI() {
  try {
    console.log('🧪 Testing Admin API...');
    
    const response = await fetch('http://localhost:3000/api/admin/submissions', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer admin-token-123',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('📊 Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Admin API test successful!');
      console.log(`📈 Found ${data.submissions?.length || 0} submissions`);
    } else {
      console.log('❌ Admin API test failed:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Test without auth
async function testUnauthorized() {
  try {
    console.log('🧪 Testing unauthorized access...');
    
    const response = await fetch('http://localhost:3000/api/admin/submissions', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('📊 Unauthorized Response:', response.status, data);
    
  } catch (error) {
    console.error('❌ Unauthorized test error:', error.message);
  }
}

if (require.main === module) {
  console.log('🚀 Starting Admin API Tests...');
  testUnauthorized().then(() => testAdminAPI());
}

module.exports = { testAdminAPI, testUnauthorized };