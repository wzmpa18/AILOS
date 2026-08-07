# HUNYUAN_TEST_REPORT.md
## AILOS 腾讯混元 API 接口验证报告

| 属性 | 值 |
|------|-----|
| 测试日期 | 2026-07-20 |
| 测试版本 | RC_PHASE1 v3.2.2 |
| 测试范围 | API 连通性 + 模型响应 + Prompt 测试 + languageContext 验证 |
| 测试方式 | 12 组随机语言组合 + 多端点/多模型尝试 |
| 测试人员 | TRAE RC Auditor |

---

### 一、API 连通性测试

| 端点 | 认证方式 | 模型 | 结果 |
|------|---------|------|------|
| tokenhub.tencentmaas.com/v1/chat/completions | Bearer Token | hunyuan | ❌ HTTP 403 |
| tokenhub.tencentmaas.com/v1/chat/completions | Bearer Token | hunyuan-turbo | ❌ HTTP 403 |
| tokenhub.tencentmaas.com/v1/chat/completions | Bearer Token | hunyuan-lite | ❌ HTTP 403 |
| api.hunyuan.cloud.tencent.com/v1/chat/completions | Bearer Token | hunyuan-lite | ❌ HTTP 401 |

---

### 二、错误详情

**tokenhub.tencentmaas.com（正确端点）:**
```
HTTP 403 - Error Code: 403005
Message: Source IP 49.251.47.154 is not in the API Key allowlist.
Please check whether the IP is within the allowlist range on the 
API Key management page in the console.
See: https://console.cloud.tencent.com/tokenhub/apikey
```

**api.hunyuan.cloud.tencent.com（标准端点）:**
```
HTTP 401 - invalid_api_key
Message: Incorrect API key provided
```

---

### 三、根因分析

| 分析项 | 结论 |
|--------|------|
| API Key 有效性 | ✅ 有效（tokenhub 端点返回 403 IP 限制而非 401 认证失败） |
| 端点正确性 | ✅ tokenhub.tencentmaas.com 为正确端点 |
| 阻塞原因 | ⚠️ API Key 配置了 IP 白名单，当前环境 IP 49.251.47.154 不在允许列表中 |
| 解决方案 | 在腾讯云 TokenHub 控制台添加 IP 49.251.47.154 到白名单，或解除 IP 限制 |

---

### 四、12 组语言组合测试（因 IP 限制全部阻塞）

| # | Native Language | Target Language | 状态 |
|---|----------------|----------------|------|
| 1 | Chinese | Japanese | ❌ IP 限制 |
| 2 | Japanese | Chinese | ❌ IP 限制 |
| 3 | Korean | English | ❌ IP 限制 |
| 4 | English | French | ❌ IP 限制 |
| 5 | Spanish | German | ❌ IP 限制 |
| 6 | Arabic | English | ❌ IP 限制 |
| 7 | Russian | Chinese | ❌ IP 限制 |
| 8 | French | Japanese | ❌ IP 限制 |
| 9 | German | Spanish | ❌ IP 限制 |
| 10 | Chinese | Korean | ❌ IP 限制 |
| 11 | Vietnamese | English | ❌ IP 限制 |
| 12 | Hindi | Chinese | ❌ IP 限制 |

---

### 五、Prompt 测试（代码层面）

| 测试项 | 状态 | 说明 |
|--------|------|------|
| System Prompt 语言上下文 | ✅ PASS | 代码中包含 `native_language` + `target_language` 参数注入 |
| 母语响应指令 | ✅ PASS | System Prompt 明确要求"用母语解释" |
| PromptBuilder 集成 | ✅ PASS | `src/services/aiService.js` 中 PromptBuilder 正确构建语言上下文 |
| languageContext 传递 | ✅ PASS | 后端中间件自动注入 `req.language_context` |

---

### 六、成本风险记录

| 风险项 | 评估 | 说明 |
|--------|------|------|
| API 调用成本 | 低风险 | 腾讯混元有免费额度，12 组测试预估 Token 消耗 < 5000 |
| IP 白名单风险 | 中风险 | 当前 IP 限制导致开发和测试环境无法调用 API |
| 生产环境成本 | 待评估 | 需上线后根据真实用户量评估 Token 消耗 |

---

### 七、验收结论

**混元 API 验证：部分通过（IP 白名单阻塞）**

API Key 有效，端点正确，代码层面 Prompt 构建和 languageContext 传递链路完整。因腾讯云 TokenHub 控制台配置了 IP 白名单，当前开发环境 IP 无法调用 API。

**前置条件：在腾讯云控制台 https://console.cloud.tencent.com/tokenhub/apikey 添加 IP 49.251.47.154 到白名单后，重新执行 12 组语言测试。**

**评级：CONDITIONALLY READY（需解除 IP 限制后完成最终验证）**