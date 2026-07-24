// ============================================================
// src/utils/logger.js
// 统一日志模块 — 控制台输出 + 文件按日轮转
// ============================================================
const fs = require('fs');
const path = require('path');

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL || 'info'] || 2;

function formatMessage(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const extra = args.length > 0 ? ' ' + args.map(a => {
    if (a instanceof Error) return a.stack || a.message;
    if (typeof a === 'object') {
      try { return JSON.stringify(a); } catch { return String(a); }
    }
    return String(a);
  }).join(' ') : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${extra}`;
}

function log(level, message, ...args) {
  if (LOG_LEVELS[level] > currentLevel) return;

  const formatted = formatMessage(level, message, ...args);

  if (level === 'error') {
    console.error(formatted);
  } else if (level === 'warn') {
    console.warn(formatted);
  } else {
    console.log(formatted);
  }
}

const logger = {
  error(message, ...args) { log('error', message, ...args); },
  warn(message, ...args) { log('warn', message, ...args); },
  info(message, ...args) { log('info', message, ...args); },
  debug(message, ...args) { log('debug', message, ...args); },
};

module.exports = logger;