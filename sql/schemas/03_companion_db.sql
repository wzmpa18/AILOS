-- ============================================
-- AILOS 库3：AI记忆与陪伴库 (companion_db)
-- 归属：Companion Engine + 数据资产中心协同管理
-- ============================================

CREATE DATABASE IF NOT EXISTS companion_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'ailos_companion_svc'@'%' IDENTIFIED BY 'CHANGE_ME_COMPANION_PWD';
GRANT SELECT, INSERT, UPDATE ON companion_db.* TO 'ailos_companion_svc'@'%';

USE companion_db;

CREATE TABLE IF NOT EXISTS companion_profiles (
  companion_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  companion_name VARCHAR(64) NOT NULL DEFAULT '小言',
  voice_id VARCHAR(64) DEFAULT NULL,
  personality_traits JSON DEFAULT NULL,
  catchphrases JSON DEFAULT NULL,
  growth_level INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (companion_id),
  UNIQUE KEY uk_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI伙伴配置';

CREATE TABLE IF NOT EXISTS companion_personality (
  personality_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  dimension_values JSON NOT NULL,
  evolution_history JSON DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (personality_id),
  UNIQUE KEY uk_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI伙伴性格演化';

CREATE TABLE IF NOT EXISTS companion_memories (
  memory_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  memory_type VARCHAR(32) NOT NULL,
  content TEXT NOT NULL,
  vector_index JSON DEFAULT NULL,
  importance_weight DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (memory_id),
  KEY idx_user_type (user_id, memory_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='长期记忆向量存储';

CREATE TABLE IF NOT EXISTS companion_conversations (
  conversation_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  session_id VARCHAR(64) NOT NULL,
  user_input TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  emotion_tag VARCHAR(32) DEFAULT NULL,
  scene VARCHAR(64) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (conversation_id),
  KEY idx_user_session (user_id, session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='对话记录';

CREATE TABLE IF NOT EXISTS companion_emotion_log (
  log_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  trigger_event VARCHAR(128) NOT NULL,
  user_emotion VARCHAR(32) DEFAULT NULL,
  ai_strategy VARCHAR(64) DEFAULT NULL,
  effect_rating TINYINT UNSIGNED DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (log_id),
  KEY idx_user_time (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='情绪互动日志';

CREATE TABLE IF NOT EXISTS companion_growth_log (
  growth_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  exp_change INT NOT NULL DEFAULT 0,
  level_change INT NOT NULL DEFAULT 0,
  unlocked_ability VARCHAR(128) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (growth_id),
  KEY idx_user_time (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='伙伴成长日志';
