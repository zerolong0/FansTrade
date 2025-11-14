/**
 * Crypto Service - AES-256-GCM Encryption/Decryption
 * 用于加密存储敏感数据（如 Binance API Key）
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16
const AUTH_TAG_LENGTH = 16;

/**
 * 获取加密密钥（从环境变量）
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  // 确保密钥是 32 字节（256 bits）
  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }

  return Buffer.from(key, 'hex');
}

/**
 * 加密文本
 * @param text 明文
 * @returns 加密后的字符串（格式: iv:encrypted:authTag）
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // 返回格式: iv:encrypted:authTag（都是 hex 编码）
    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * 解密文本
 * @param encryptedData 加密的字符串（格式: iv:encrypted:authTag）
 * @returns 解密后的明文
 */
export function decrypt(encryptedData: string): string {
  try {
    const parts = encryptedData.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, encryptedHex, authTagHex] = parts;

    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * 生成新的加密密钥（用于初始化）
 * 返回一个 64 位 hex 字符串，应该保存到 .env 的 ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * 验证加密密钥是否有效
 */
export function validateEncryptionKey(): boolean {
  try {
    const key = process.env.ENCRYPTION_KEY;
    if (!key || key.length !== 64) {
      return false;
    }

    // 测试加密/解密
    const testData = 'test_encryption_key';
    const encrypted = encrypt(testData);
    const decrypted = decrypt(encrypted);

    return decrypted === testData;
  } catch (error) {
    return false;
  }
}
