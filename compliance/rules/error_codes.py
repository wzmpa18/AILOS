# ============================================
# AILOS 全局错误码体系 v1.0.0
# 软件架构蓝图 v2.0.0 强制执行
# ============================================
# 范围规则：
#   0    : 成功
#   1xxx : 通用错误（参数、认证、权限）
#   2xxx : 业务错误（学习引擎、陪伴引擎）
#   3xxx : AI Gateway 错误（限流、熔断、模型异常）
#   4xxx : 数据资产错误
#   5xxx : 领域插件错误
#   9xxx : 系统内部错误

ERROR_CODES = {
    # 成功
    "SUCCESS": 0,

    # 1xxx 通用错误
    "BAD_REQUEST": 1001,
    "UNAUTHORIZED": 1002,
    "FORBIDDEN": 1003,
    "NOT_FOUND": 1004,
    "VALIDATION_ERROR": 1005,
    "RATE_LIMIT_EXCEEDED": 1006,
    "DUPLICATE_REQUEST": 1007,

    # 2xxx 业务错误
    "LEARNING_PATH_NOT_FOUND": 2001,
    "ASSESSMENT_FAILED": 2002,
    "EXERCISE_SUBMIT_FAILED": 2003,
    "COMPANION_NOT_FOUND": 2101,
    "COMPANION_CHAT_FAILED": 2102,

    # 3xxx AI Gateway 错误
    "AI_QUOTA_EXCEEDED": 3001,
    "AI_MODEL_UNAVAILABLE": 3002,
    "AI_RATE_LIMITED": 3003,
    "AI_CONTENT_REJECTED": 3004,
    "AI_FALLBACK_ACTIVATED": 3005,

    # 4xxx 数据资产错误
    "ASSET_NOT_FOUND": 4001,
    "ASSET_ACCESS_DENIED": 4002,
    "ASSET_WRITE_FORBIDDEN": 4003,
    "ASSET_AUDIT_REQUIRED": 4004,

    # 5xxx 领域插件错误
    "PLUGIN_NOT_FOUND": 5001,
    "PLUGIN_LOAD_FAILED": 5002,
    "PLUGIN_SANDBOX_VIOLATION": 5003,

    # 9xxx 系统内部错误
    "INTERNAL_ERROR": 9000,
    "DATABASE_ERROR": 9001,
    "CACHE_ERROR": 9002,
    "EVENT_BUS_ERROR": 9003,
}
