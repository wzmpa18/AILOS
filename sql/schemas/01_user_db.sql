-- ============================================
-- AILOS 库1：用户核心库 (user_db)
-- 归属：数据资产中心管理
-- 原则：永久保留、跨领域通用、禁止物理删除、全量加密存储
-- ============================================

CREATE DATABASE IF NOT EXISTS user_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- 创建独立数据库账号
CREATE USER IF NOT EXISTS 'ailos_user_svc'@'%' IDENTIFIED BY 'CHANGE_ME_USER_PWD';
GRANT SELECT, INSERT ON user_db.* TO 'ailos_user_svc'@'%';
-- 核心资产库默认仅开放只读权限给其他模块
CREATE USER IF NOT EXISTS 'ailos_user_reader'@'%' IDENTIFIED BY 'CHANGE_ME_READER_PWD';
GRANT SELECT ON user_db.* TO 'ailos_user_reader'@'%';

USE user_db;

-- 用户基础信息
CREATE TABLE IF NOT EXISTS users (
  user_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL,
  email VARCHAR(128) DEFAULT NULL,
  phone VARCHAR(32) DEFAULT NULL,
  password_hash VARCHAR(255) NOT NULL,
  registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('active','frozen','deleted') NOT NULL DEFAULT 'active',
  deleted_at DATETIME DEFAULT NULL,
  PRIMARY KEY (user_id),
  UNIQUE KEY uk_username (username),
  UNIQUE KEY uk_email (email),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户基础信息（禁止物理删除）';

-- 用户扩展资料
CREATE TABLE IF NOT EXISTS user_profiles (
  profile_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  avatar_url VARCHAR(512) DEFAULT NULL,
  nickname VARCHAR(64) DEFAULT NULL,
  timezone VARCHAR(64) DEFAULT 'Asia/Tokyo',
  preferred_language VARCHAR(16) DEFAULT 'zh-CN',
  settings JSON DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (profile_id),
  UNIQUE KEY uk_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户扩展资料';

-- 用户身份/权限
CREATE TABLE IF NOT EXISTS user_identities (
  identity_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  role ENUM('normal','member','admin','super_admin') NOT NULL DEFAULT 'normal',
  permission_bits BIGINT UNSIGNED NOT NULL DEFAULT 0,
  granted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (identity_id),
  KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户身份/权限';

-- 用户设备信息
CREATE TABLE IF NOT EXISTS user_devices (
  device_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  device_uid VARCHAR(255) NOT NULL,
  device_type VARCHAR(32) DEFAULT NULL,
  last_login_ip VARCHAR(64) DEFAULT NULL,
  last_login_at DATETIME DEFAULT NULL,
  PRIMARY KEY (device_id),
  KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户设备信息';

-- 用户状态（软删除支持）
CREATE TABLE IF NOT EXISTS user_status (
  status_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  account_status ENUM('normal','frozen','cancelled') NOT NULL DEFAULT 'normal',
  freeze_reason VARCHAR(255) DEFAULT NULL,
  cancelled_at DATETIME DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (status_id),
  UNIQUE KEY uk_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户状态';
