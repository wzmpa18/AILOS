-- ============================================
-- AILOS 数据库迁移脚本 v2.0.0
-- 七库分离，按序执行
-- 执行方式: mysql -u root -p < migration_v2.0.0.sql
-- ============================================

-- ============================================
-- 用户库 (user_db)
-- ============================================
CREATE DATABASE IF NOT EXISTS user_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE user_db;

CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(128) UNIQUE,
    phone VARCHAR(32),
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(512),
    nickname VARCHAR(64),
    membership ENUM('free','member','premium') DEFAULT 'free',
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME,
    status ENUM('active','frozen','deleted') DEFAULT 'active',
    deleted_at DATETIME,
    INDEX idx_users_status (status),
    INDEX idx_users_membership (membership)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_quotas (
    quota_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    date DATE NOT NULL,
    daily_used INT DEFAULT 0,
    daily_limit INT DEFAULT 50,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_date (user_id, date),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS daily_checkins (
    checkin_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    date DATE NOT NULL,
    streak_days INT DEFAULT 0,
    points INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_date (user_id, date),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- ============================================
-- 学习库 (learning_db)
-- ============================================
CREATE DATABASE IF NOT EXISTS learning_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE learning_db;

CREATE TABLE IF NOT EXISTS learner_profiles (
    profile_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    total_study_time INT DEFAULT 0,
    total_exercises INT DEFAULT 0,
    avg_score FLOAT DEFAULT 0,
    current_level VARCHAR(32) DEFAULT 'beginner',
    strengths JSON,
    weaknesses JSON,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_learner_level (current_level)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS domain_learner_profiles (
    domain_profile_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    profile_id BIGINT NOT NULL,
    domain VARCHAR(32) NOT NULL,
    level VARCHAR(32) DEFAULT 'beginner',
    study_time INT DEFAULT 0,
    exercises INT DEFAULT 0,
    avg_score FLOAT DEFAULT 0,
    last_activity_at DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_profile_domain (profile_id, domain),
    FOREIGN KEY (profile_id) REFERENCES learner_profiles(profile_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS learning_paths (
    path_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    profile_id BIGINT NOT NULL,
    domain VARCHAR(32) NOT NULL,
    nodes JSON,
    current_node INT DEFAULT 0,
    status VARCHAR(32) DEFAULT 'in_progress',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES learner_profiles(profile_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS knowledge_traces (
    trace_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    profile_id BIGINT NOT NULL,
    skill_id VARCHAR(128) NOT NULL,
    mastery FLOAT DEFAULT 0,
    attempts INT DEFAULT 0,
    corrects INT DEFAULT 0,
    last_tested_at DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_profile_skill (profile_id, skill_id),
    FOREIGN KEY (profile_id) REFERENCES learner_profiles(profile_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS learning_activities (
    activity_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    profile_id BIGINT NOT NULL,
    domain VARCHAR(32) NOT NULL,
    activity_type VARCHAR(32) NOT NULL,
    duration INT DEFAULT 0,
    score FLOAT,
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_activities_profile (profile_id, created_at)
) ENGINE=InnoDB;

-- ============================================
-- 陪伴库 (companion_db)
-- ============================================
CREATE DATABASE IF NOT EXISTS companion_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE companion_db;

CREATE TABLE IF NOT EXISTS companion_profiles (
    companion_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    persona_name VARCHAR(64) DEFAULT '小言',
    personality_json JSON,
    growth_level INT DEFAULT 1,
    growth_exp INT DEFAULT 0,
    intimacy INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS companion_memories (
    memory_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    companion_id BIGINT NOT NULL,
    keywords JSON,
    content TEXT NOT NULL,
    importance INT DEFAULT 1,
    recalled_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_memories_companion (companion_id),
    FOREIGN KEY (companion_id) REFERENCES companion_profiles(companion_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS emotion_logs (
    emotion_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    companion_id BIGINT NOT NULL,
    emotion VARCHAR(32) NOT NULL,
    intensity FLOAT DEFAULT 0.5,
    trigger VARCHAR(256),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (companion_id) REFERENCES companion_profiles(companion_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS chat_sessions (
    session_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    companion_id BIGINT NOT NULL,
    messages JSON,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    FOREIGN KEY (companion_id) REFERENCES companion_profiles(companion_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS growth_events (
    growth_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    companion_id BIGINT NOT NULL,
    event_type VARCHAR(32) NOT NULL,
    exp_gained INT DEFAULT 0,
    new_level INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- 知识库 (knowledge_db)
-- ============================================
CREATE DATABASE IF NOT EXISTS knowledge_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE knowledge_db;

CREATE TABLE IF NOT EXISTS knowledge_assets (
    asset_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    domain VARCHAR(32) NOT NULL,
    asset_type VARCHAR(32) NOT NULL,
    title VARCHAR(256) NOT NULL,
    content TEXT NOT NULL,
    tags JSON,
    difficulty INT DEFAULT 1,
    quality_score FLOAT DEFAULT 0,
    status ENUM('pending','approved','rejected','deprecated') DEFAULT 'pending',
    version INT DEFAULT 1,
    submitted_by BIGINT,
    reviewed_by BIGINT,
    review_note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_assets_domain (domain),
    INDEX idx_assets_status (status),
    FULLTEXT INDEX ft_assets_content (title, content)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS feedbacks (
    feedback_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    asset_id BIGINT,
    user_id BIGINT NOT NULL,
    category VARCHAR(32) NOT NULL,
    content TEXT NOT NULL,
    ai_suggestion TEXT,
    status ENUM('pending','reviewing','resolved','rejected') DEFAULT 'pending',
    resolved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES knowledge_assets(asset_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS asset_versions (
    version_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    asset_id BIGINT NOT NULL,
    version INT NOT NULL,
    content TEXT NOT NULL,
    changelog TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES knowledge_assets(asset_id)
) ENGINE=InnoDB;

-- ============================================
-- 社交库 (social_db)
-- ============================================
CREATE DATABASE IF NOT EXISTS social_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE social_db;

CREATE TABLE IF NOT EXISTS social_relations (
    relation_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    target_id BIGINT NOT NULL,
    relation_type VARCHAR(16) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_target_type (user_id, target_id, relation_type),
    INDEX idx_relations_target (target_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS posts (
    post_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    media_urls JSON,
    likes INT DEFAULT 0,
    comments INT DEFAULT 0,
    status ENUM('published','hidden','deleted') DEFAULT 'published',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_posts_user (user_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS comments (
    comment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(post_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS likes (
    like_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_post_user (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES posts(post_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS leaderboards (
    leaderboard_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    scope VARCHAR(16) NOT NULL,
    score INT DEFAULT 0,
    rank INT DEFAULT 0,
    period VARCHAR(16) NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_scope_period (user_id, scope, period)
) ENGINE=InnoDB;

-- ============================================
-- 营销库 (marketing_db)
-- ============================================
CREATE DATABASE IF NOT EXISTS marketing_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE marketing_db;

CREATE TABLE IF NOT EXISTS invite_codes (
    invite_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(16) NOT NULL UNIQUE,
    creator_id BIGINT NOT NULL,
    used_count INT DEFAULT 0,
    max_uses INT DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS invite_records (
    record_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invite_id BIGINT NOT NULL,
    invited_user_id BIGINT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invite_id) REFERENCES invite_codes(invite_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS commissions (
    commission_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    level INT NOT NULL,
    amount FLOAT NOT NULL,
    source_user_id BIGINT NOT NULL,
    status ENUM('pending','settled','withdrawn') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    withdrawn_at DATETIME
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS withdrawals (
    withdrawal_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    amount FLOAT NOT NULL,
    method VARCHAR(32) NOT NULL,
    account VARCHAR(128) NOT NULL,
    status ENUM('pending','approved','rejected','completed') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME
) ENGINE=InnoDB;

-- ============================================
-- 系统库 (system_db)
-- ============================================
CREATE DATABASE IF NOT EXISTS system_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE system_db;

CREATE TABLE IF NOT EXISTS system_configs (
    config_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(128) NOT NULL UNIQUE,
    config_value JSON NOT NULL,
    description VARCHAR(512),
    updated_by BIGINT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(64) NOT NULL,
    resource VARCHAR(128) NOT NULL,
    resource_id VARCHAR(64),
    detail JSON,
    ip_address VARCHAR(64),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_user (user_id, created_at),
    INDEX idx_audit_action (action, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS api_keys (
    api_key_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    name VARCHAR(128) NOT NULL,
    permissions JSON,
    last_used_at DATETIME,
    expires_at DATETIME,
    status ENUM('active','revoked','expired') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS plugin_registry (
    plugin_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    plugin_name VARCHAR(128) NOT NULL UNIQUE,
    version VARCHAR(32) NOT NULL,
    manifest JSON NOT NULL,
    status ENUM('registered','enabled','disabled','uninstalled') DEFAULT 'registered',
    grayscale_rate FLOAT DEFAULT 0,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cost_records (
    cost_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    call_id VARCHAR(64) NOT NULL UNIQUE,
    module VARCHAR(64) NOT NULL,
    user_id BIGINT,
    model_name VARCHAR(64) NOT NULL,
    tokens_in INT DEFAULT 0,
    tokens_out INT DEFAULT 0,
    cost FLOAT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cost_module (module, created_at),
    INDEX idx_cost_user (user_id, created_at)
) ENGINE=InnoDB;

-- ============================================
-- 初始种子数据
-- ============================================
USE system_db;

INSERT INTO system_configs (config_key, config_value, description) VALUES
('ai_gateway.cost.global_daily_budget', '{"amount": 100.00, "currency": "USD"}', 'AI网关全局日预算'),
('ai_gateway.cost.warning_threshold', '{"threshold": 0.80}', '成本预警阈值'),
('ai_gateway.cost.circuit_break_threshold', '{"threshold": 0.95}', '熔断阈值'),
('module.switches', '{"community": true, "marketing": true, "developer_center": true}', '模块开关'),
('companion.default_persona', '{"name": "小言", "traits": {"warmth": 0.8, "humor": 0.6, "patience": 0.9, "encouragement": 0.85, "formality": 0.3}}', '默认陪伴人设'),
('grayscale.default_rate', '{"rate": 0.0}', '默认灰度比例');

INSERT INTO plugin_registry (plugin_name, version, manifest, status) VALUES
('yandao_japanese', '1.0.0', '{"domain": "japanese", "enabled": true}', 'enabled'),
('yandao_english', '1.0.0', '{"domain": "english", "enabled": true}', 'enabled'),
('yandao_korean', '1.0.0', '{"domain": "korean", "enabled": true}', 'enabled'),
('yandao_spanish', '1.0.0', '{"domain": "spanish", "enabled": true}', 'enabled'),
('yandao_german', '1.0.0', '{"domain": "german", "enabled": true}', 'enabled');
