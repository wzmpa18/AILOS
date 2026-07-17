# ============================================
# AILOS 统一命名规范 v1.0.0
# 软件架构蓝图 v2.0.0 强制执行
# ============================================

# 文件命名
# - 模块文件: kebab-case (ai-gateway.service.ts)
# - 类文件: PascalCase 与类名一致
# - 配置文件: kebab-case (app.config.ts)

# 变量命名
# - 变量/函数: camelCase (getUserProfile)
# - 类/接口: PascalCase (AiGatewayService)
# - 常量: UPPER_SNAKE_CASE (MAX_RETRY_COUNT)
# - 私有成员: 前缀 _ (private _cache: CacheService)

# 数据库命名
# - 表名: snake_case (user_profiles)
# - 字段名: snake_case (created_at)
# - 索引: idx_表名_字段名 (idx_user_id)
# - 唯一键: uk_字段名 (uk_email)

# API 命名
# - RESTful 风格: /api/v1/resource/action
# - 复数资源名: /api/v1/users/:id
# - 动作用动词: /api/v1/learning/path/generate

# 事件命名
# - 格式: 领域.对象.动作
# - 示例: lesson.completed, user.registered, user.paid
