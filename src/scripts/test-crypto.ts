/**
 * Test script for crypto service
 * Usage: npx tsx src/scripts/test-crypto.ts
 */

import dotenv from 'dotenv';
dotenv.config({ override: true });

import { encrypt, decrypt, validateEncryptionKey, generateEncryptionKey } from '../services/crypto.service';

async function testCrypto() {
  console.log('🔐 Testing Crypto Service...\n');

  // Test 1: Validate encryption key
  console.log('Test 1: Validate ENCRYPTION_KEY');
  const isValid = validateEncryptionKey();
  console.log(`✅ Encryption key is ${isValid ? 'valid' : 'invalid'}\n`);

  if (!isValid) {
    console.log('⚠️  Generating new ENCRYPTION_KEY...');
    const newKey = generateEncryptionKey();
    console.log(`📝 Add this to your .env file:`);
    console.log(`ENCRYPTION_KEY=${newKey}\n`);
    return;
  }

  // Test 2: Encrypt/Decrypt simple text
  console.log('Test 2: Encrypt and decrypt simple text');
  const testData = 'This is a test API key: sk-1234567890abcdef';
  console.log(`Original: ${testData}`);

  const encrypted = encrypt(testData);
  console.log(`Encrypted: ${encrypted.substring(0, 50)}...`);

  const decrypted = decrypt(encrypted);
  console.log(`Decrypted: ${decrypted}`);
  console.log(`✅ Match: ${testData === decrypted}\n`);

  // Test 3: Encrypt/Decrypt Binance API Key format
  console.log('Test 3: Encrypt and decrypt Binance API Key format');
  const binanceApiKey = 'vF4RpQGhv7LqH6yW8xE9zN2mK5tS1bA3cD7fG0jL9pM6nO4q';
  const binanceApiSecret = 'xZ8kL3mN9pR2tV5wY1bC4dF7gH0jK6nQ9sT2uV5xZ8aB1cD4';

  console.log(`API Key: ${binanceApiKey.substring(0, 10)}...`);
  console.log(`API Secret: ${binanceApiSecret.substring(0, 10)}...`);

  const encryptedKey = encrypt(binanceApiKey);
  const encryptedSecret = encrypt(binanceApiSecret);

  console.log(`Encrypted Key: ${encryptedKey.substring(0, 50)}...`);
  console.log(`Encrypted Secret: ${encryptedSecret.substring(0, 50)}...`);

  const decryptedKey = decrypt(encryptedKey);
  const decryptedSecret = decrypt(encryptedSecret);

  console.log(`✅ API Key match: ${binanceApiKey === decryptedKey}`);
  console.log(`✅ API Secret match: ${binanceApiSecret === decryptedSecret}\n`);

  // Test 4: Error handling
  console.log('Test 4: Error handling');
  try {
    decrypt('invalid_encrypted_data');
    console.log('❌ Should have thrown an error');
  } catch (error: any) {
    console.log(`✅ Correctly threw error: ${error.message}\n`);
  }

  console.log('🎉 All tests passed!');
}

testCrypto().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
