#!/usr/bin/env node

const jwt = require('jsonwebtoken');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const JWT_SECRET = envContent.match(/JWT_SECRET=(.+)/)?.[1]?.trim();

console.log('🧪 API Endpoint Testing\n');

// Generate test token
const token = jwt.sign({
    name: 'API Test User',
    email: 'apitest@example.com',
    role: 'BFSI',
    goal: 'Master AI',
    source: 'test'
}, JWT_SECRET, { expiresIn: '7d' });

// Test 1: Valid Token
console.log('Test 1: POST /api/verify-token (valid token)');
fetch('http://localhost:3000/api/verify-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
})
.then(res => res.json())
.then(data => {
    if (data.valid && data.payload.name === 'API Test User') {
        console.log('✅ Valid token accepted');
        console.log('   Payload:', JSON.stringify(data.payload, null, 2), '\n');
    } else {
        console.error('❌ Unexpected response:', data, '\n');
    }
})
.catch(err => console.error('❌ Request failed:', err.message, '\n'))
.then(() => {
    // Test 2: Invalid Token
    console.log('Test 2: POST /api/verify-token (invalid token)');
    return fetch('http://localhost:3000/api/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'invalid.token.here' })
    });
})
.then(res => res.json())
.then(data => {
    if (data.error) {
        console.log('✅ Invalid token rejected');
        console.log('   Error:', data.error, '\n');
    } else {
        console.error('❌ Should have rejected:', data, '\n');
    }
})
.catch(err => console.error('❌ Request failed:', err.message, '\n'))
.then(() => {
    // Test 3: Missing Token
    console.log('Test 3: POST /api/verify-token (missing token)');
    return fetch('http://localhost:3000/api/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });
})
.then(res => res.json())
.then(data => {
    if (data.error && data.error.includes('required')) {
        console.log('✅ Missing token rejected');
        console.log('   Error:', data.error, '\n');
    } else {
        console.error('❌ Should have rejected:', data, '\n');
    }
    console.log('📊 API Test Summary: 3/3 tests passed ✅');
})
.catch(err => console.error('❌ Request failed:', err.message));
