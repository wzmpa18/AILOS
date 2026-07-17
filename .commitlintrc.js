// ============================================
// AILOS Commitlint Configuration v1.0.0
// Repository Baseline — Module 1
// Conventional Commits 1.0.0 + AILOS Custom Scopes
// ============================================

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // Bug 修复
        'docs',     // 文档更新
        'style',    // 代码格式（不影响逻辑）
        'refactor', // 重构
        'perf',     // 性能优化
        'test',     // 测试
        'chore',    // 构建/工具/依赖
        'ci',       // CI/CD 变更
        'revert',   // 回滚
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'gateway',    // AI Gateway
        'auth',       // 认证模块
        'learning',   // Learning Engine
        'companion',  // Companion Engine
        'user',       // 用户模块
        'admin',      // 管理后台
        'infra',      // 基础设施
        'config',     // 配置管理
        'plugin',     // 插件系统
        'deps',       // 依赖管理
        'release',    // 版本发布
        'repo',       // 仓库治理
        'compliance', // 合规检测
      ],
    ],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-max-length': [2, 'always', 72],
    'type-empty': [2, 'never'],
    'type-case': [2, 'always', 'lower-case'],
    'scope-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 100],
  },
  ignores: [
    (commit) => commit.startsWith('Merge'),
    (commit) => commit.includes('See merge request'),
  ],
};
