const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const logger = require('./logger');

// 为每个 token 注入随机 jti，确保同一秒内并发登录生成的 refreshToken 互不相同，
// 避免 Session 表 @unique([userId, refreshToken]) 触发 P2002 唯一约束冲突（登录并发 bug）。
function genJti() {
  return crypto.randomBytes(12).toString('hex');
}

const generateTokens = (payload) => {
  try {
    const accessToken = jwt.sign(
      { ...payload, jti: genJti() },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh', jti: genJti() },
      config.jwt.secret,
      { expiresIn: '30d' }
    );

    return { accessToken, refreshToken };
  } catch (error) {
    logger.error('Token generation failed:', error);
    throw new Error('Token generation failed');
  }
};

const generateGuestToken = (guestId) => {
  try {
    const token = jwt.sign(
      { guestId, isGuest: true, type: 'guest' },
      config.jwt.secret,
      { expiresIn: '2h' }
    );
    return { token, expiresIn: 7200 };
  } catch (error) {
    logger.error('Guest token generation failed:', error);
    throw new Error('Guest token generation failed');
  }
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    logger.error('Token verification failed:', error);
    throw new Error('Invalid token');
  }
};

const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('Token decode failed:', error);
    return null;
  }
};

module.exports = {
  generateTokens,
  generateGuestToken,
  verifyToken,
  decodeToken,
};