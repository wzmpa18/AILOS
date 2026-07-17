-- ============================================
-- AILOS 库6：权益营销库 (marketing_db)
-- 归属：Marketing 模块 + 权益中心协同管理
-- ============================================

CREATE DATABASE IF NOT EXISTS marketing_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'ailos_marketing_svc'@'%' IDENTIFIED BY 'CHANGE_ME_MARKETING_PWD';
GRANT SELECT, INSERT, UPDATE ON marketing_db.* TO 'ailos_marketing_svc'@'%';

USE marketing_db;

CREATE TABLE IF NOT EXISTS member_rights (
  level_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  level_name VARCHAR(32) NOT NULL,
  rights_list JSON NOT NULL,
  ai_daily_quota INT UNSIGNED NOT NULL DEFAULT 50,
  model_permissions JSON DEFAULT NULL,
  PRIMARY KEY (level_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员权益配置';

CREATE TABLE IF NOT EXISTS user_membership (
  membership_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  level_id INT UNSIGNED NOT NULL DEFAULT 1,
  effective_from DATETIME NOT NULL,
  expires_at DATETIME DEFAULT NULL,
  remaining_quota INT UNSIGNED NOT NULL DEFAULT 50,
  PRIMARY KEY (membership_id),
  UNIQUE KEY uk_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户会员信息';

CREATE TABLE IF NOT EXISTS user_quota (
  quota_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  remaining_amount INT UNSIGNED NOT NULL DEFAULT 0,
  total_consumed INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (quota_id),
  UNIQUE KEY uk_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户AI额度余额';

CREATE TABLE IF NOT EXISTS quota_consume_log (
  log_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  scene VARCHAR(64) NOT NULL,
  amount INT UNSIGNED NOT NULL,
  call_id VARCHAR(128) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (log_id),
  KEY idx_user_time (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='额度消耗日志';

CREATE TABLE IF NOT EXISTS cost_threshold_config (
  config_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  dimension VARCHAR(32) NOT NULL,
  threshold_value DECIMAL(12,2) NOT NULL,
  degradation_strategy VARCHAR(64) NOT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  PRIMARY KEY (config_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='成本熔断阈值配置';

CREATE TABLE IF NOT EXISTS invite_relations (
  relation_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  inviter_one BIGINT UNSIGNED DEFAULT NULL,
  inviter_two BIGINT UNSIGNED DEFAULT NULL,
  bound_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  bound_source VARCHAR(64) DEFAULT NULL,
  PRIMARY KEY (relation_id),
  UNIQUE KEY uk_user_id (user_id),
  KEY idx_inviter_one (inviter_one),
  KEY idx_inviter_two (inviter_two)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分销邀请关系表';

CREATE TABLE IF NOT EXISTS commission_records (
  record_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  trigger_order_id VARCHAR(128) NOT NULL,
  commission_one DECIMAL(10,2) DEFAULT 0.00,
  commission_two DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('frozen','unfrozen','settled') NOT NULL DEFAULT 'frozen',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (record_id),
  KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='佣金记录表';

CREATE TABLE IF NOT EXISTS commission_settlement (
  settlement_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  withdraw_status ENUM('pending','approved','rejected','paid') NOT NULL DEFAULT 'pending',
  audit_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  settled_at DATETIME DEFAULT NULL,
  PRIMARY KEY (settlement_id),
  KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='佣金结算表';

CREATE TABLE IF NOT EXISTS user_points (
  point_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  balance INT UNSIGNED NOT NULL DEFAULT 0,
  total_earned INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (point_id),
  UNIQUE KEY uk_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户积分表';

CREATE TABLE IF NOT EXISTS checkin_records (
  record_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  checkin_date DATE NOT NULL,
  streak_days INT UNSIGNED NOT NULL DEFAULT 0,
  points_earned INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (record_id),
  UNIQUE KEY uk_user_date (user_id, checkin_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='签到记录表';
