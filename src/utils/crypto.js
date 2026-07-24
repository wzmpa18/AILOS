// ============================================================
// src/utils/crypto.js
// 密码哈希 + 验证码生成 + 随机字符串
// ============================================================
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const SALT_ROUNDS = 12;

/**
 * 哈希密码
 */
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 比较密码
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * 生成N位数字验证码
 */
function generateSmsCode(length = 6) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

/**
 * 生成随机字符串
 */
function generateRandomString(length = 16) {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

/**
 * 生成UUID
 */
function generateUuid() {
  return crypto.randomUUID();
}

/**
 * SHA256哈希
 */
function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

module.exports = {
  hashPassword,
  comparePassword,
  generateSmsCode,
  generateRandomString,
  generateUuid,
  sha256,
};