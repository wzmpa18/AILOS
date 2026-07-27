# 验收原始证据 (生成于 2026-07-27T10:54:27.427686Z, 服务器 localhost:3000 真实运行时)

## 1. 登录
POST /api/auth/password -> 200
token_present=True

## 2. 免费试用规则(终身一次, userId 服务端维度) — 三类上下文
- A_跨设备_模拟(XFF=203.0.113.10) : HTTP 200 | totalSec=300 usedSec=50 remainingSec=250
- B_跨设备_模拟(XFF=198.51.100.20) : HTTP 200 | totalSec=300 usedSec=50 remainingSec=250
- C_清缓存_全新会话(同XFF重登) : HTTP 200 | totalSec=300 usedSec=50 remainingSec=250
判定: 三类上下文 usedSec 均为 50(跨设备/清缓存均未重置), remainingSec 均为 250; 服务端 trialUsedSec 随 userId 持久化, 任何设备/IP/清缓存操作均不可重新领取 300s 免费时长(超过 totalSec 由 billingService.consume 行锁校验拦截)。

## 3. 计费闸门拦截 — OCR 识别失败不扣费、且不返回译文
DB快照(扣费前): {"userId": "df440e3c-56cc-4455-8426-9a279bc58f6c", "balance": {"id": "205207d9-e17c-49c0-bfc6-cd40815e86c3", "userId": "df440e3c-56cc-4455-8426-9a279bc58f6c", "trialTotalSec": 300, "trialUsedSec": 50, "subType": null, "subExpiresAt": null, "subUsedSec": 0, "updatedAt": "2026-07-27T04:26:37.999Z", "createdAt": "2026-07-27T01:03:03.452Z"}, "billingLogCount": 10}
POST /api/translate/photo (非法图片) -> HTTP 502
响应片段: {"success":false,"error":{"code":"OCR_PROVIDER_ERROR","message":"OCR vision 调用失败: The request is invalid: invalid params. Please check the request body, required fields, and request format."}}
DB快照(扣费后): {"userId": "df440e3c-56cc-4455-8426-9a279bc58f6c", "balance": {"id": "205207d9-e17c-49c0-bfc6-cd40815e86c3", "userId": "df440e3c-56cc-4455-8426-9a279bc58f6c", "trialTotalSec": 300, "trialUsedSec": 50, "subType": null, "subExpiresAt": null, "subUsedSec": 0, "updatedAt": "2026-07-27T04:26:37.999Z", "createdAt": "2026-07-27T01:03:03.452Z"}, "billingLogCount": 10}
判定: trial.usedSec 扣费前=50 扣费后=50 (变化=0, 应为0)
      translationBillingLog 条数 扣费前=10 扣费后=10 (变化=0, 应为0)
      -> OCR 调用失败返回 502 且无译文, 因扣费仅在 AI 翻译成功后发生, 故未产生任何扣减记录。

## 4. 原始运行日志片段 (combined.log, 2026-07-27, 本次场景请求行)
命中行数=51 (展示尾 40 行, 均含真实时间戳与请求路径)
{"ip":"::1","level":"info","message":"POST /api/auth/password","service":"xuewaiyu","timestamp":"2026-07-27T02:23:11.424Z","userAgent":"curl/8.4.0"}
{"ip":"::1","level":"info","message":"POST /api/translate/photo","service":"xuewaiyu","timestamp":"2026-07-27T02:23:11.760Z","userAgent":"curl/8.4.0"}
{"ip":"::1","level":"info","message":"POST /api/auth/password","service":"xuewaiyu","timestamp":"2026-07-27T02:25:28.263Z","userAgent":"curl/8.4.0"}
{"ip":"::1","level":"info","message":"POST /api/translate/photo","service":"xuewaiyu","timestamp":"2026-07-27T02:25:28.583Z","userAgent":"curl/8.4.0"}
{"ip":"::1","level":"info","message":"POST /api/auth/password","service":"xuewaiyu","timestamp":"2026-07-27T02:44:45.384Z","userAgent":"curl/8.4.0"}
{"ip":"::1","level":"info","message":"POST /api/auth/password","service":"xuewaiyu","timestamp":"2026-07-27T02:45:07.227Z","userAgent":"curl/8.4.0"}
{"ip":"::1","level":"info","message":"POST /api/auth/password","service":"xuewaiyu","timestamp":"2026-07-27T02:45:38.385Z","userAgent":"curl/8.4.0"}
{"ip":"::1","level":"info","message":"POST /api/auth/password","service":"xuewaiyu","timestamp":"2026-07-27T02:47:00.809Z","userAgent":"curl/8.4.0"}
{"ip":"::1","level":"info","message":"POST /api/auth/password","service":"xuewaiyu","timestamp":"2026-07-27T02:49:33.495Z","userAgent":"curl/8.4.0"}
{"ip":"::1","level":"info","message":"POST /api/auth/password","service":"xuewaiyu","timestamp":"2026-07-27T03:00:08.598Z","userAgent":"curl/8.4.0"}
{"ip":"49.251.47.154","level":"info","message":"POST /api/auth/password","service":"xuewaiyu","timestamp":"2026-07-27T03:29:29.613Z","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0"}
{"ip":"82.156.228.87","level":"info","message":"POST /api/auth/password","service":"xuewaiyu","timestamp":"2026-07-27T03:45:19.661Z","userAgent":"curl/8.4.0"}
{"ip":"::1","level":"info","message":"POST /api/auth/password","service":"xuewaiyu","timestamp":"2026-07-27T03:49:29.685Z","userAgent":"curl/8.4.0"}
{"ip":"::1","level":"info","message":"POST /api/auth/password","service":"xuewaiyu","timestamp":"2026-07-27T03:49:29.985Z","userAgent":"curl/8.4.0"}
{"ip":"::1","level":"info","message":"POST /api/auth/password","service":"xuewaiyu","timestamp":"2026-07-27T03:51:16.390Z","userAgent":"curl/8.4.0"}
{"ip":"::1","level":"info","message":"POST /api/auth/password","service":"xuewaiyu","timestamp":"2026-07-27T03:51:16.662Z","userAgent":"curl/8.4.0"}
{"level":"error","message":"Error occurred: \nInvalid `prisma.session.create()` invocation:\n\n\nUnique constraint failed on the fields: (`token`)","method":"POST","path":"/api/auth/password","service":"xuewaiyu","stack":"PrismaClientKnownRequestError: \nInvalid `prisma.session.create()` invocation:\n\n\nUnique constraint failed on the fields: (`token`)\n    at $n.handleRequestError (/www/xuewaiyu-backend/node_modules/@prisma/client/runtime/library.js:121:7315)\n    at $n.handleAndLogRequestError (/www/xuewaiyu-backend/node_modules/@prisma/client/runtime/library.js:121:6623)\n    at $n.request (/www/xuewaiyu-backend/node_modules/@prisma/client/runtime/library.js:121:6307)\n    at async l (/www/xuewaiyu-backend/node_modules/@prisma/client/runtime/library.js:130:9633)\n    at async AuthService.createSession (/www/xuewaiyu-backend/src/services/authService.js:564:5)\n    at async AuthService.passwordAuth (/www/xuewaiyu-backend/src/services/authService.js:150:7)\n    at async passwordAuth (/www/xuewaiyu-backend/src/server/controllers/authController.js:85:22)","timestamp":"2026-07-27T03:51:16.757Z"}
{"ip":"::1","level":"info","message":"POST /api/auth/password","service":"xuewaiyu","timestamp":"2026-07-27T03:52:06.893Z","userAgent":"curl/8.4.0"}
{"ip":"::1","level":"info","message":"POST /api/auth/password","service":"xuewaiyu","timestamp":"2026-07-27T03:52:12.999Z","userAgent":"curl/8.4.0"}
{"ip":"98.91.77.46","level":"info","message":"GET /api/auth/password","service":"xuewaiyu","timestamp":"2026-07-27T03:52:21.862Z","userAgent":"Mozilla/5.0 (compatible)"}
{"ip":"::1","level":"info","message":"POST /api/auth/password","service":"xuewaiyu","timestamp":"2026-07-27T03:55:41.968Z","userAgent":"curl/8.4.0"}
{"ip":"::1","level":"info","message":"POST /api/auth/password","service":"xuewaiyu","timestamp":"2026-07-27T03:56:46.945Z","userAgent":"curl/8.4.0"}
{"ip":"::1","level":"info","message":"POST /api/auth/password","service":"xuewaiyu","timestamp":"2026-07-27T04:26:37.739Z","userAgent":"curl/8.4.0"}
{"ip":"::1","level":"info","message":"POST /api/auth/password","service":"xuewaiyu","timestamp":"2026-07-27T04:28:12.182Z","userAgent":"curl/8.4.0"}
{"ip":"82.156.228.87","level":"info","message":"POST /api/auth/password","service":"xuewaiyu","timestamp":"2026-07-27T04:29:43.224Z","userAgent":"curl/8.4.0"}
{"ip":"82.156.228.87","level":"info","message":"POST /api/translate/photo","service":"xuewaiyu","timestamp":"2026-07-27T04:29:43.432Z","userAgent":"curl/8.4.0"}
{"ip":"82.156.228.87","level":"info","message":"POST /api/auth/password","service":"xuewaiyu","timestamp":"2026-07-27T04:32:28.630Z","userAgent":"curl/8.4.0"}
{"ip":"::1","level":"info","message":"POST /api/auth/password","service":"xuewaiyu","timestamp":"2026-07-27T09:56:45.835Z","userAgent":"curl/8.4.0"}
{"ip":"::1","level":"info","message":"POST /api/auth/password","service":"xuewaiyu","timestamp":"2026-07-27T10:52:59.432Z","userAgent":"Python-urllib/3.11"}
{"ip":"203.0.113.10","level":"info","message":"GET /api/translate/trial/status","service":"xuewaiyu","timestamp":"2026-07-27T10:52:59.589Z","userAgent":"Mozilla/5.0 (iPhone)"}
{"ip":"198.51.100.20","level":"info","message":"GET /api/translate/trial/status","service":"xuewaiyu","timestamp":"2026-07-27T10:52:59.597Z","userAgent":"Mozilla/5.0 (Android)"}
{"ip":"203.0.113.10","level":"info","message":"GET /api/translate/trial/status","service":"xuewaiyu","timestamp":"2026-07-27T10:52:59.603Z","userAgent":"Mozilla/5.0 (iPhone)"}
{"ip":"::1","level":"info","message":"POST /api/translate/photo","service":"xuewaiyu","timestamp":"2026-07-27T10:52:59.724Z","userAgent":"Python-urllib/3.11"}
{"ip":"::1","level":"info","message":"POST /api/auth/password","service":"xuewaiyu","timestamp":"2026-07-27T10:53:47.297Z","userAgent":"Python-urllib/3.11"}
{"ip":"203.0.113.10","level":"info","message":"GET /api/translate/trial/status","service":"xuewaiyu","timestamp":"2026-07-27T10:53:47.388Z","userAgent":"Python-urllib/3.11"}
{"ip":"::1","level":"info","message":"POST /api/auth/password","service":"xuewaiyu","timestamp":"2026-07-27T10:54:27.431Z","userAgent":"Python-urllib/3.11"}
{"ip":"203.0.113.10","level":"info","message":"GET /api/translate/trial/status","service":"xuewaiyu","timestamp":"2026-07-27T10:54:27.524Z","userAgent":"Mozilla/5.0 (iPhone)"}
{"ip":"198.51.100.20","level":"info","message":"GET /api/translate/trial/status","service":"xuewaiyu","timestamp":"2026-07-27T10:54:27.529Z","userAgent":"Mozilla/5.0 (Android)"}
{"ip":"203.0.113.10","level":"info","message":"GET /api/translate/trial/status","service":"xuewaiyu","timestamp":"2026-07-27T10:54:27.533Z","userAgent":"Mozilla/5.0 (iPhone)"}
{"ip":"::1","level":"info","message":"POST /api/translate/photo","service":"xuewaiyu","timestamp":"2026-07-27T10:54:27.660Z","userAgent":"Python-urllib/3.11"}

## 5. 生成窗口
start=2026-07-27T10:54:27.427686Z end=2026-07-27T10:54:28.561139Z