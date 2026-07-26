# P2 任务一 审计报告（读链路收口 + 前端残留兜底）

生成时间：2026-07-26T07:42:33.775Z

## 结论：✅ PASS（全部验收硬标准达成）

## A. 后端直读 userLanguagePreference / userLearningLanguage（排除项外须 = 0）
- 结果：PASS ✅  （非排除项命中 0 处）
- 合法排除项命中（14 处）：
  - src/services/authService.js:353  [认证/注册写接口]
  - src/services/contextResolver.js:54  [唯一真值源（GAP-03 合规组件）]
  - src/services/contextResolver.js:65  [唯一真值源（GAP-03 合规组件）]
  - src/services/languageService.js:21  [个人中心设置读写接口（getUserLanguages 读 + upsert/update 写）]
  - src/services/languageService.js:25  [个人中心设置读写接口（getUserLanguages 读 + upsert/update 写）]
  - src/services/languageService.js:70  [个人中心设置读写接口（getUserLanguages 读 + upsert/update 写）]
  - src/services/languageService.js:86  [个人中心设置读写接口（getUserLanguages 读 + upsert/update 写）]
  - src/services/languageService.js:93  [个人中心设置读写接口（getUserLanguages 读 + upsert/update 写）]
  - src/services/onboardingService.js:198  [注册引导读写接口]
  - src/services/onboardingService.js:202  [注册引导读写接口]
  - src/services/onboardingService.js:249  [注册引导读写接口]
  - src/services/onboardingService.js:259  [注册引导读写接口]
  - src/services/onboardingService.js:360  [注册引导读写接口]
  - src/services/onboardingService.js:635  [注册引导读写接口]

## B. 双语言配置静默默认兜底（|| 'ja'/'zh-CN'/'zh'/'中文'/'英语' 须 = 0，系统/UI 维度除外）
- 结果：PASS ✅  （违规 0 处）
- 合法例外（8 处）：
  - src/services/aiGateway.js:32  const SYSTEM_TARGET_LANG = process.env.SYSTEM_TARGET_LANG || 'ja';  [合法: 系统固定上下文 SYSTEM_TARGET_LANG/SYSTEM_EXPLAIN_LANG（env 注入，非用户可篡改）]
  - src/services/aiGateway.js:33  const SYSTEM_EXPLAIN_LANG = process.env.SYSTEM_EXPLAIN_LANG || 'zh-CN';  [合法: 系统固定上下文 SYSTEM_TARGET_LANG/SYSTEM_EXPLAIN_LANG（env 注入，非用户可篡改）]
  - src/services/authService.js:325  uiLanguage: context.uiLanguage || 'zh',  [合法: 浏览器/UI 语言维度（uiLanguage/browserLanguage，非双语言学习配置）]
  - src/services/authService.js:326  browserLanguage: context.browserLanguage || 'zh-CN',  [合法: 浏览器/UI 语言维度（uiLanguage/browserLanguage，非双语言学习配置）]
  - src/services/authService.js:337  config: { language: context.uiLanguage || 'zh' },  [合法: 浏览器/UI 语言维度（uiLanguage/browserLanguage，非双语言学习配置）]
  - src/services/authService.js:346  const uiLang = context.uiLanguage || 'zh';  [合法: 浏览器/UI 语言维度（uiLanguage/browserLanguage，非双语言学习配置）]
  - src/services/authService.js:347  const browserLang = context.browserLanguage || 'zh-CN';  [合法: 浏览器/UI 语言维度（uiLanguage/browserLanguage，非双语言学习配置）]
  - src/services/languageGuard.js:26  * 返回: 'ja' | 'ko' | 'zh' | 'en' | 'other'  [合法: 注释中的语种枚举说明]

## C. 前端向网关拼接 languageContext 对象（须 = 0）
- 结果：PASS ✅  （命中 0 处）
  - 无残留（前端传参无效，语言配置由后端 ContextResolver 注入）
