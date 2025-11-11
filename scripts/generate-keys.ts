#!/usr/bin/env tsx

/**
 * Generate secure keys for .env file
 */

import crypto from 'crypto';

console.log('\n🔐 FansTrade - Secure Key Generator\n');

// Generate JWT secret (64 bytes)
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_SECRET:');
console.log(jwtSecret);

// Generate encryption key (32 bytes for AES-256)
const encryptionKey = crypto.randomBytes(32).toString('hex');
console.log('\nENCRYPTION_KEY:');
console.log(encryptionKey);

console.log('\n📋 Copy these values to your .env file');
console.log('\n✅ Keys generated successfully!\n');
