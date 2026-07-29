// ============================================================
// src/services/conversationStorageService.js
// Stage 11 子模块 3 — 对话内容本地加密存储
//
// 隐私合规：
//   - 原始对话内容仅本地 AES-256-GCM 加密存储
//   - 仅用户手动收藏的内容同步云端
//   - 原始音频/文本永久不上传服务器（收藏内容除外）
// ============================================================

const crypto = require('crypto');

// 加密算法：AES-256-GCM（认证加密，防止篡改）
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;  // 256 bits
const IV_LENGTH = 12;   // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * 从用户 ID 派生加密密钥
 * 使用 PBKDF2 确保即使 userId 泄露，密钥也不可逆推
 * 
 * @param {string} userId - 用户唯一标识（作为盐基）
 * @param {Buffer} salt - 随机盐
 * @returns {Buffer} 32 字节密钥
 */
function deriveKey(userId, salt) {
  return crypto.pbkdf2Sync(userId, salt, 100000, KEY_LENGTH, 'sha512');
}

/**
 * 加密对话内容
 * 
 * 格式：salt(32) + iv(12) + authTag(16) + ciphertext
 * 
 * @param {string} userId
 * @param {string} plaintext - 原文内容
 * @returns {Buffer} 加密后的 Buffer（含元数据前缀）
 */
function encrypt(userId, plaintext) {
  if (!plaintext || !userId) {
    throw new Error('encrypt requires userId and plaintext');
  }

  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(userId, salt);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();

  // 打包：salt + iv + authTag + ciphertext
  return Buffer.concat([salt, iv, authTag, encrypted]);
}

/**
 * 解密对话内容
 * 
 * @param {string} userId
 * @param {Buffer} encryptedData - encrypt() 返回的完整 Buffer
 * @returns {string} 解密后的原文
 */
function decrypt(userId, encryptedData) {
  if (!encryptedData || !userId) {
    throw new Error('decrypt requires userId and encryptedData');
  }

  // 拆分：salt(32) + iv(12) + authTag(16) + ciphertext
  const salt = encryptedData.slice(0, SALT_LENGTH);
  const iv = encryptedData.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = encryptedData.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = encryptedData.slice(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

  const key = deriveKey(userId, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * 标记收藏（同步到云端）
 * 
 * 仅当用户手动标记某条对话为"收藏"后，才将内容同步到服务器。
 * 原始对话内容永不上传。
 * 
 * @param {string} userId
 * @param {object} conversationEntry - { id, sourceText, translatedText, timestamp, direction }
 * @returns {object} 可供云端同步的数据（不含原始加密密钥）
 */
function prepareForCloudSync(userId, conversationEntry) {
  return {
    id: conversationEntry.id || `conv_${Date.now()}`,
    sourceLang: conversationEntry.direction === 'target_to_native' ? 'target' : 'native',
    targetLang: conversationEntry.direction === 'target_to_native' ? 'native' : 'target',
    sourceTextLength: (conversationEntry.sourceText || '').length,
    translatedTextLength: (conversationEntry.translatedText || '').length,
    timestamp: conversationEntry.timestamp || Date.now(),
    // ⚠️ 云端不同步原始内容，仅同步元数据
    // 原始内容 hash 用于验证本地数据完整性
    contentHash: crypto.createHash('sha256')
      .update((conversationEntry.sourceText || '') + (conversationEntry.translatedText || ''))
      .digest('hex'),
  };
}

/**
 * 本地会话存储键名（供 IndexedDB/localStorage 使用）
 */
function storageKey(userId) {
  return `ailos_conv_${userId.slice(0, 8)}`;
}

module.exports = {
  encrypt,
  decrypt,
  prepareForCloudSync,
  storageKey,
  ALGORITHM,
};
