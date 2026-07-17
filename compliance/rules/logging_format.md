# ============================================
# AILOS 统一日志格式规范 v1.0.0
# 软件架构蓝图 v2.0.0 强制执行
# ============================================

# 日志级别
# ERROR: 系统错误、异常、违规操作
# WARN:  降级、熔断、配额预警
# INFO:  正常业务流程、API调用
# DEBUG: 开发调试（生产环境关闭）
# VERBOSE: 详细追踪（生产环境关闭）

# 日志格式
# [timestamp] [LEVEL] [module] [traceId] message {context}

# 示例
# [2026-07-16T10:30:00.000Z] [INFO] [AI_Gateway] [trace_abc123] AI request completed {cost: 0.0012, duration: 350ms, cache_hit: true}
# [2026-07-16T10:30:01.000Z] [WARN] [AI_Gateway] [trace_abc124] User quota exceeded, degrading to cache {userId: 12345, quota: 0}

# 强制要求
# 1. 所有AI调用必须记录日志
# 2. 所有核心数据变更必须记录审计日志
# 3. 日志中禁止输出密钥、密码、完整Token
# 4. 日志保留策略至少3年
