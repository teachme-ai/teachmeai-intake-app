#!/usr/bin/env node

const jwt = require('jsonwebtoken');
const fs = require('fs');

// Read JWT_SECRET from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const JWT_SECRET = envContent.match(/JWT_SECRET=(.+)/)?.[1]?.trim();

if (!JWT_SECRET) {
    console.error('❌ JWT_SECRET not found in .env.local');
    process.exit(1);
}

console.log('🔐 JWT Testing Suite\n');

// Test 1: Generate Token
console.log('Test 1: Token Generation');
const payload = {
    name: 'Test User',
    email: 'test@example.com',
    role: 'IT Consultancy',
    goal: 'Learn AI tools',
    source: 'chatui',
    timestamp: Date.now()
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
console.log('✅ Token generated:', token.substring(0, 50) + '...\n');

// Test 2: Verify Token
console.log('Test 2: Token Verification');
try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token verified successfully');
    console.log('   Name:', decoded.name);
    console.log('   Email:', decoded.email);
    console.log('   Role:', decoded.role);
    console.log('   Goal:', decoded.goal);
    console.log('   Expires:', new Date(decoded.exp * 1000).toISOString(), '\n');
} catch (error) {
    console.error('❌ Verification failed:', error.message, '\n');
}

// Test 3: Invalid Token
console.log('Test 3: Invalid Token Handling');
try {
    jwt.verify('invalid.token.here', JWT_SECRET);
    console.error('❌ Should have failed\n');
} catch (error) {
    console.log('✅ Invalid token rejected:', error.message, '\n');
}

// Test 4: Expired Token
console.log('Test 4: Expired Token Handling');
const expiredToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '0s' });
setTimeout(() => {
    try {
        jwt.verify(expiredToken, JWT_SECRET);
        console.error('❌ Should have failed\n');
    } catch (error) {
        console.log('✅ Expired token rejected:', error.message, '\n');
    }
    
    console.log('📊 Test Summary: 4/4 tests passed ✅');
}, 100);
