-- ============================================
-- AILOS 库2：学习业务库 (learning_db)
-- 归属：Learning Engine 管理
-- 原则：禁止营销/社交模块直接读写，禁止物理删除历史记录
-- ============================================

CREATE DATABASE IF NOT EXISTS learning_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'ailos_learning_svc'@'%' IDENTIFIED BY 'CHANGE_ME_LEARNING_PWD';
GRANT SELECT, INSERT, UPDATE ON learning_db.* TO 'ailos_learning_svc'@'%';

USE learning_db;

CREATE TABLE IF NOT EXISTS learner_profiles (
  profile_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  global_level INT NOT NULL DEFAULT 1,
  total_study_seconds BIGINT UNSIGNED NOT NULL DEFAULT 0,
  total_knowledge_nodes INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (profile_id),
  UNIQUE KEY uk_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习者核心档案';

CREATE TABLE IF NOT EXISTS domain_learner_profiles (
  domain_profile_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  domain VARCHAR(64) NOT NULL,
  current_level INT NOT NULL DEFAULT 1,
  mastered_nodes JSON DEFAULT NULL,
  weak_points JSON DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (domain_profile_id),
  UNIQUE KEY uk_user_domain (user_id, domain)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='按领域的学习者画像';

CREATE TABLE IF NOT EXISTS learning_paths (
  path_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  domain VARCHAR(64) NOT NULL,
  path_nodes JSON NOT NULL,
  current_node_index INT NOT NULL DEFAULT 0,
  progress_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (path_id),
  KEY idx_user_domain (user_id, domain)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习路径记录';

CREATE TABLE IF NOT EXISTS learning_activities (
  activity_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  domain VARCHAR(64) NOT NULL,
  activity_type VARCHAR(32) NOT NULL,
  content_summary VARCHAR(512) DEFAULT NULL,
  duration_seconds INT UNSIGNED DEFAULT 0,
  score DECIMAL(5,2) DEFAULT NULL,
  completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (activity_id),
  KEY idx_user_domain_time (user_id, domain, completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习活动记录';

CREATE TABLE IF NOT EXISTS exercise_records (
  record_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  domain VARCHAR(64) NOT NULL,
  question_id VARCHAR(128) NOT NULL,
  user_answer JSON DEFAULT NULL,
  is_correct TINYINT(1) NOT NULL DEFAULT 0,
  duration_seconds INT UNSIGNED DEFAULT 0,
  error_attribution VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (record_id),
  KEY idx_user_domain (user_id, domain)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='练习记录';

CREATE TABLE IF NOT EXISTS assessment_results (
  assessment_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  domain VARCHAR(64) NOT NULL,
  assessment_type VARCHAR(32) NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  level_result INT NOT NULL,
  dimension_scores JSON DEFAULT NULL,
  assessed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (assessment_id),
  KEY idx_user_domain (user_id, domain)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='测评结果';

CREATE TABLE IF NOT EXISTS knowledge_trace (
  trace_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  domain VARCHAR(64) NOT NULL,
  node_id VARCHAR(128) NOT NULL,
  mastery_level DECIMAL(4,3) NOT NULL DEFAULT 0.000,
  last_review_at DATETIME DEFAULT NULL,
  forgetting_curve_params JSON DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (trace_id),
  UNIQUE KEY uk_user_node (user_id, domain, node_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识掌握追踪';

CREATE TABLE IF NOT EXISTS learning_sessions (
  session_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  domain VARCHAR(64) NOT NULL,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME DEFAULT NULL,
  duration_seconds INT UNSIGNED DEFAULT 0,
  activities_completed INT UNSIGNED DEFAULT 0,
  PRIMARY KEY (session_id),
  KEY idx_user_time (user_id, started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学习会话';
