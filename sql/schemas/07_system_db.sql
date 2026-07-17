-- ============================================
-- AILOS 库7：系统日志与成本审计库 (system_db)
-- 归属：Admin + AI Gateway 协同管理
-- ============================================

CREATE DATABASE IF NOT EXISTS system_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'ailos_system_svc'@'%' IDENTIFIED BY 'CHANGE_ME_SYSTEM_PWD';
GRANT SELECT, INSERT ON system_db.* TO 'ailos_system_svc'@'%';
-- Admin 有写权限
CREATE USER IF NOT EXISTS 'ailos_admin_svc'@'%' IDENTIFIED BY 'CHANGE_ME_ADMIN_PWD';
GRANT SELECT, INSERT, UPDATE ON system_db.* TO 'ailos_admin_svc'@'%';

USE system_db;

CREATE TABLE IF NOT EXISTS ai_call_logs (
  call_id VARCHAR(128) NOT NULL,
  module VARCHAR(64) NOT NULL,
  scene VARCHAR(64) NOT NULL,
  user_id BIGINT UNSIGNED DEFAULT NULL,
  model_name VARCHAR(64) NOT NULL,
  input_tokens INT UNSIGNED NOT NULL DEFAULT 0,
  output_tokens INT UNSIGNED NOT NULL DEFAULT 0,
  cost DECIMAL(10,6) NOT NULL DEFAULT 0.000000,
  duration_ms INT UNSIGNED NOT NULL DEFAULT 0,
  cache_hit TINYINT(1) NOT NULL DEFAULT 0,
  degradation_level TINYINT UNSIGNED DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (call_id),
  KEY idx_module_time (module, created_at),
  KEY idx_user_time (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI调用日志';

CREATE TABLE IF NOT EXISTS cost_daily_report (
  report_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  report_date DATE NOT NULL,
  total_cost DECIMAL(12,6) NOT NULL DEFAULT 0.000000,
  breakdown JSON DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (report_id),
  UNIQUE KEY uk_date (report_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='日成本汇总';

CREATE TABLE IF NOT EXISTS prompt_versions (
  prompt_id VARCHAR(128) NOT NULL,
  scene VARCHAR(64) NOT NULL,
  version VARCHAR(16) NOT NULL,
  content TEXT NOT NULL,
  status ENUM('active','deprecated','grayscale') NOT NULL DEFAULT 'active',
  grayscale_rate DECIMAL(5,2) DEFAULT NULL,
  created_by VARCHAR(64) DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (prompt_id),
  KEY idx_scene_version (scene, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Prompt版本管理';

CREATE TABLE IF NOT EXISTS plugin_config (
  plugin_id VARCHAR(128) NOT NULL,
  config_key VARCHAR(64) NOT NULL,
  config_value TEXT NOT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (plugin_id, config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='插件独立配置';

CREATE TABLE IF NOT EXISTS audit_logs (
  log_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  operator VARCHAR(64) NOT NULL,
  operation_type VARCHAR(32) NOT NULL,
  operation_detail TEXT NOT NULL,
  data_snapshot JSON DEFAULT NULL,
  ip_address VARCHAR(64) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (log_id),
  KEY idx_operator_time (operator, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作审计日志';

CREATE TABLE IF NOT EXISTS system_config (
  config_key VARCHAR(128) NOT NULL,
  config_value TEXT NOT NULL,
  scope VARCHAR(32) NOT NULL DEFAULT 'global',
  last_modified_by VARCHAR(64) DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置';

CREATE TABLE IF NOT EXISTS module_switches (
  module_name VARCHAR(64) NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  grayscale_rate DECIMAL(5,2) DEFAULT 100.00,
  operated_by VARCHAR(64) DEFAULT NULL,
  operated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (module_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='模块开关';

CREATE TABLE IF NOT EXISTS event_log (
  event_id VARCHAR(128) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  publisher VARCHAR(64) NOT NULL,
  subscribers JSON DEFAULT NULL,
  status ENUM('published','delivered','consumed','failed') NOT NULL DEFAULT 'published',
  duration_ms INT UNSIGNED DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (event_id),
  KEY idx_type_time (event_type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='事件总线日志';

CREATE TABLE IF NOT EXISTS cache_stats (
  stat_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cache_key VARCHAR(255) NOT NULL,
  hit_count INT UNSIGNED NOT NULL DEFAULT 0,
  miss_count INT UNSIGNED NOT NULL DEFAULT 0,
  cache_size_bytes BIGINT UNSIGNED DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (stat_id),
  UNIQUE KEY uk_cache_key (cache_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='缓存统计';

CREATE TABLE IF NOT EXISTS performance_metrics (
  metric_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  metric_name VARCHAR(64) NOT NULL,
  metric_value DECIMAL(12,4) NOT NULL,
  dimension VARCHAR(64) DEFAULT NULL,
  recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (metric_id),
  KEY idx_name_time (metric_name, recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='性能指标';
