-- ============================================
-- AILOS 库4：知识资产库 (knowledge_db)
-- 归属：数据资产中心管理（全平台公共资产）
-- ============================================

CREATE DATABASE IF NOT EXISTS knowledge_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'ailos_knowledge_svc'@'%' IDENTIFIED BY 'CHANGE_ME_KNOWLEDGE_PWD';
GRANT SELECT, INSERT, UPDATE ON knowledge_db.* TO 'ailos_knowledge_svc'@'%';

USE knowledge_db;

CREATE TABLE IF NOT EXISTS knowledge_nodes (
  node_id VARCHAR(128) NOT NULL,
  domain VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  parent_node_id VARCHAR(128) DEFAULT NULL,
  hierarchy_level INT NOT NULL DEFAULT 0,
  difficulty INT NOT NULL DEFAULT 1,
  content TEXT NOT NULL,
  tags JSON DEFAULT NULL,
  copyright_audit_status ENUM('pending','passed','rejected') NOT NULL DEFAULT 'pending',
  quality_score DECIMAL(3,2) DEFAULT 0.00,
  reuse_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (node_id),
  KEY idx_domain_level (domain, hierarchy_level),
  KEY idx_domain_difficulty (domain, difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='结构化知识点';

CREATE TABLE IF NOT EXISTS knowledge_graph (
  graph_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  node_id VARCHAR(128) NOT NULL,
  related_node_id VARCHAR(128) NOT NULL,
  relation_type ENUM('prerequisite','postrequisite','parallel') NOT NULL,
  relation_strength DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  PRIMARY KEY (graph_id),
  KEY idx_node (node_id),
  KEY idx_related (related_node_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识图谱关系';

CREATE TABLE IF NOT EXISTS public_questions (
  question_id VARCHAR(128) NOT NULL,
  domain VARCHAR(64) NOT NULL,
  node_id VARCHAR(128) DEFAULT NULL,
  question_type VARCHAR(32) NOT NULL,
  difficulty INT NOT NULL DEFAULT 1,
  content JSON NOT NULL,
  explanation TEXT DEFAULT NULL,
  quality_score DECIMAL(3,2) DEFAULT 0.00,
  reuse_count INT UNSIGNED NOT NULL DEFAULT 0,
  copyright_audit_status ENUM('pending','passed','rejected') NOT NULL DEFAULT 'pending',
  PRIMARY KEY (question_id),
  KEY idx_domain_difficulty (domain, difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公共题库';

CREATE TABLE IF NOT EXISTS public_materials (
  material_id VARCHAR(128) NOT NULL,
  domain VARCHAR(64) NOT NULL,
  material_type VARCHAR(32) NOT NULL,
  content LONGTEXT NOT NULL,
  applicable_level INT DEFAULT NULL,
  tags JSON DEFAULT NULL,
  quality_score DECIMAL(3,2) DEFAULT 0.00,
  copyright_audit_status ENUM('pending','passed','rejected') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (material_id),
  KEY idx_domain_type (domain, material_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公共素材';

CREATE TABLE IF NOT EXISTS public_templates (
  template_id VARCHAR(128) NOT NULL,
  domain VARCHAR(64) NOT NULL,
  template_type VARCHAR(32) NOT NULL,
  template_structure JSON NOT NULL,
  applicable_scenes JSON DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (template_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公共模板';

CREATE TABLE IF NOT EXISTS asset_quality_audit (
  audit_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id VARCHAR(128) NOT NULL,
  asset_type VARCHAR(32) NOT NULL,
  audit_status ENUM('pending','passed','rejected') NOT NULL DEFAULT 'pending',
  auditor VARCHAR(64) DEFAULT NULL,
  quality_score DECIMAL(3,2) DEFAULT NULL,
  audit_comment TEXT DEFAULT NULL,
  audited_at DATETIME DEFAULT NULL,
  PRIMARY KEY (audit_id),
  KEY idx_asset (asset_id, asset_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资产质量审核';

CREATE TABLE IF NOT EXISTS asset_grade_audit (
  audit_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id VARCHAR(128) NOT NULL,
  original_grade VARCHAR(16) NOT NULL,
  target_grade VARCHAR(16) NOT NULL,
  trigger_reason VARCHAR(255) DEFAULT NULL,
  audit_result ENUM('approved','rejected') DEFAULT NULL,
  audited_at DATETIME DEFAULT NULL,
  PRIMARY KEY (audit_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资产晋级审核记录';

CREATE TABLE IF NOT EXISTS asset_usage_stats (
  stat_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_id VARCHAR(128) NOT NULL,
  usage_count INT UNSIGNED NOT NULL DEFAULT 0,
  reuse_rate DECIMAL(5,2) DEFAULT 0.00,
  avg_rating DECIMAL(3,2) DEFAULT 0.00,
  last_used_at DATETIME DEFAULT NULL,
  PRIMARY KEY (stat_id),
  UNIQUE KEY uk_asset_id (asset_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资产使用统计';

CREATE TABLE IF NOT EXISTS user_feedback (
  feedback_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  asset_id VARCHAR(128) NOT NULL,
  feedback_type ENUM('content_error','difficulty_mismatch','copyright_concern','other') NOT NULL,
  feedback_content TEXT NOT NULL,
  status ENUM('pending','processing','resolved','rejected') NOT NULL DEFAULT 'pending',
  resolution TEXT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (feedback_id),
  KEY idx_asset (asset_id),
  KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户反馈';
